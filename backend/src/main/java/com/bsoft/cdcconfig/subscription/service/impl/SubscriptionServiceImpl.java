package com.bsoft.cdcconfig.subscription.service.impl;

import com.baomidou.mybatisplus.core.conditions.query.LambdaQueryWrapper;
import com.baomidou.mybatisplus.core.conditions.update.LambdaUpdateWrapper;
import com.bsoft.cdcconfig.subscription.converter.SubscriptionConverter;
import com.bsoft.cdcconfig.subscription.dto.SourceTableInput;
import com.bsoft.cdcconfig.subscription.dto.SubscriptionQuery;
import com.bsoft.cdcconfig.subscription.dto.SubscriptionSaveDTO;
import com.bsoft.cdcconfig.subscription.entity.DataSubscribe;
import com.bsoft.cdcconfig.subscription.entity.DataSourceRef;
import com.bsoft.cdcconfig.subscription.exception.BadRequestException;
import com.bsoft.cdcconfig.subscription.exception.SubscriptionErrorCode;
import com.bsoft.cdcconfig.subscription.exception.SubscriptionValidationException;
import com.bsoft.cdcconfig.subscription.helper.DataSourceTableParser;
import com.bsoft.cdcconfig.subscription.helper.SubscriptionCsvHelper;
import com.bsoft.cdcconfig.subscription.mapper.SubscriptionDataSubscribeMapper;
import com.bsoft.cdcconfig.subscription.mapper.SubscriptionDataSourceMapper;
import com.bsoft.cdcconfig.subscription.service.SourceMetadataService;
import com.bsoft.cdcconfig.subscription.service.SubscriptionService;
import com.bsoft.cdcconfig.subscription.vo.OptionsVO;
import com.bsoft.cdcconfig.subscription.vo.QueryWarningVO;
import com.bsoft.cdcconfig.subscription.vo.SourceOptionVO;
import com.bsoft.cdcconfig.subscription.vo.SubscriptionDeletePreviewVO;
import com.bsoft.cdcconfig.subscription.vo.SubscriptionDetailVO;
import com.bsoft.cdcconfig.subscription.vo.SubscriptionEditOpenVO;
import com.bsoft.cdcconfig.subscription.vo.SubscriptionListVO;
import com.bsoft.cdcconfig.subscription.vo.SubscriptionRowVO;
import com.bsoft.cdcconfig.subscription.vo.SubscriptionTargetOptionVO;
import com.bsoft.cdcconfig.subscription.vo.ValidationErrorVO;
import org.springframework.stereotype.Service;
import org.springframework.transaction.PlatformTransactionManager;
import org.springframework.transaction.support.TransactionTemplate;

import java.util.ArrayList;
import java.util.Collections;
import java.util.HashMap;
import java.util.HashSet;
import java.util.List;
import java.util.Map;
import java.util.Set;
import java.util.UUID;

/**
 * 数据订阅业务实现（API.md §4）。关键设计点：
 *
 * <ul>
 *   <li>列表过滤在服务层 Java 完成（DESIGN §7.1）：源库组内 OR、目标库组内 OR、两组 AND，
 *       统一走 {@link SubscriptionCsvHelper} 三类匹配语义；含逗号候选产生 queryWarnings。</li>
 *   <li>新增/编辑保存：批量校验失败统一抛 {@link SubscriptionValidationException}（40300 +
 *       validationErrors，一次列全失效项，API.md §4.6）；40340/40341 连接/加载失败按单点错误传播。</li>
 *   <li>写入事务用 {@link TransactionTemplate}（DESIGN §5.4）：源库 Oracle 校验在配置库写入
 *       事务之外完成；校验通过后才进入写入事务。</li>
 *   <li>数据源引用映射只读最小投影 {@link DataSourceRef}，绝不加载含密码的完整实体。</li>
 * </ul>
 */
@Service
public class SubscriptionServiceImpl implements SubscriptionService {

    private static final String AMBIGUOUS_COMMA_WARNING =
            "含逗号的数据源 ID 只能进行历史兼容可能匹配，结果可能包含歧义记录";

    private final SubscriptionDataSubscribeMapper dataSubscribeMapper;
    private final SubscriptionDataSourceMapper subscriptionDataSourceMapper;
    private final SourceMetadataService sourceMetadataService;
    private final TransactionTemplate transactionTemplate;

    public SubscriptionServiceImpl(SubscriptionDataSubscribeMapper dataSubscribeMapper,
                                   SubscriptionDataSourceMapper subscriptionDataSourceMapper,
                                   SourceMetadataService sourceMetadataService,
                                   PlatformTransactionManager transactionManager) {
        this.dataSubscribeMapper = dataSubscribeMapper;
        this.subscriptionDataSourceMapper = subscriptionDataSourceMapper;
        this.sourceMetadataService = sourceMetadataService;
        this.transactionTemplate = new TransactionTemplate(transactionManager);
    }

    @Override
    public OptionsVO options() {
        OptionsVO vo = new OptionsVO();
        vo.setSources(toSourceOptions(subscriptionDataSourceMapper.selectList(
                new LambdaQueryWrapper<DataSourceRef>()
                        .eq(DataSourceRef::getFgActive, "1")
                        .apply("UPPER(DATA_SOURCE_CATEGORY) = 'SOURCE'")
                        .orderByAsc(DataSourceRef::getDataSourceId))));
        vo.setTargets(toTargetOptions(subscriptionDataSourceMapper.selectList(
                new LambdaQueryWrapper<DataSourceRef>()
                        .eq(DataSourceRef::getFgActive, "1")
                        .apply("UPPER(DATA_SOURCE_CATEGORY) = 'TARGET'")
                        .orderByAsc(DataSourceRef::getDataSourceId))));
        return vo;
    }

    @Override
    public SubscriptionListVO list(SubscriptionQuery query) {
        List<String> sourceCandidates = normalizeCandidates(
                query == null ? null : query.getSourceIds(), "sourceIds");
        List<String> targetCandidates = normalizeCandidates(
                query == null ? null : query.getTargetIds(), "targetIds");

        List<DataSubscribe> all = dataSubscribeMapper.selectActiveForList();
        List<DataSubscribe> filtered = new ArrayList<>();
        for (DataSubscribe row : all) {
            if (!sourceCandidates.isEmpty()
                    && !matchAny(row.getDataFromSourceId(), sourceCandidates)) {
                continue;
            }
            if (!targetCandidates.isEmpty()
                    && !matchAny(row.getDataToSourceId(), targetCandidates)) {
                continue;
            }
            filtered.add(row);
        }

        Map<String, DataSourceRef> refMap = loadRefsForRows(filtered);
        List<SubscriptionRowVO> items = new ArrayList<>(filtered.size());
        for (DataSubscribe row : filtered) {
            items.add(SubscriptionConverter.toRowVO(row, refMap));
        }
        return new SubscriptionListVO(items, buildQueryWarnings(sourceCandidates, targetCandidates));
    }

    @Override
    public SubscriptionDetailVO detail(String dataSubId) {
        DataSubscribe row = selectActiveById(dataSubId);
        if (SubscriptionCsvHelper.isMultiSourceAnomaly(row.getDataFromSourceId())) {
            throw SubscriptionErrorCode.anomalyNotViewable();
        }
        Map<String, DataSourceRef> refMap = loadRefsForRows(Collections.singletonList(row));
        return SubscriptionConverter.toDetailVO(row, refMap, buildWarnings(row, refMap));
    }

    @Override
    public String create(SubscriptionSaveDTO dto) {
        if (dto == null) {
            throw new BadRequestException("请求体不能为空");
        }
        String mode = dto.getSourceSelectionMode();
        if (mode != null && !mode.trim().isEmpty() && !"REPLACE".equalsIgnoreCase(mode.trim())) {
            throw new BadRequestException("新增订阅 sourceSelectionMode 只能为 REPLACE");
        }
        List<ValidationErrorVO> errors = validatePayload(dto, true);
        if (!errors.isEmpty()) {
            throw new SubscriptionValidationException(errors);
        }
        String sourceId = singleSourceToken(dto.getDataFromSourceId());
        List<String> targets = normalizeTargets(dto.getDataToSourceIds());
        validateRefsForSave(sourceId, targets, errors);
        if (!errors.isEmpty()) {
            throw new SubscriptionValidationException(errors);
        }
        List<ValidationErrorVO> tableErrors =
                sourceMetadataService.validateTables(sourceId, dto.getSourceTables());
        if (!tableErrors.isEmpty()) {
            throw new SubscriptionValidationException(tableErrors);
        }

        String dataSubId = UUID.randomUUID().toString().replace("-", "");
        DataSubscribe entity = new DataSubscribe();
        entity.setDataSubId(dataSubId);
        entity.setDataSubDesc(dto.getDataSubDesc().trim());
        entity.setDataFromSourceId(sourceId);
        entity.setDataToSourceId(String.join(",", targets));
        entity.setDataSourceTable(buildDataSourceTable(sourceId, dto.getSourceTables()));

        return transactionTemplate.execute(status -> {
            int rows = dataSubscribeMapper.insertForCreate(entity);
            if (rows != 1) {
                throw SubscriptionErrorCode.saveFailed();
            }
            return dataSubId;
        });
    }

    @Override
    public SubscriptionEditOpenVO editOpen(String dataSubId) {
        DataSubscribe row = selectActiveById(dataSubId);
        if (SubscriptionCsvHelper.isMultiSourceAnomaly(row.getDataFromSourceId())) {
            throw SubscriptionErrorCode.anomalyNotEditable();
        }
        Map<String, DataSourceRef> refMap = loadRefsForRows(Collections.singletonList(row));

        SubscriptionEditOpenVO vo = new SubscriptionEditOpenVO();
        vo.setDataSubId(row.getDataSubId());
        vo.setDataSubDesc(row.getDataSubDesc());
        List<String> sourceTokens = SubscriptionCsvHelper.splitTrimDropEmpty(row.getDataFromSourceId());
        String sourceId = sourceTokens.isEmpty() ? null : sourceTokens.get(0);
        if (sourceId != null) {
            vo.setSource(SubscriptionConverter.toSourceRefVO(refMap.get(sourceId), sourceId));
        }
        vo.setTargets(SubscriptionConverter.toTargetRefVOList(row.getDataToSourceId(), refMap));
        DataSourceTableParser.ParseResult parsed = DataSourceTableParser.parse(row.getDataSourceTable());
        vo.setTablesBySchema(SubscriptionConverter.groupBySchema(parsed.getEntries()));
        vo.setRawUnparseableTables(parsed.getRawUnparseable());

        DataSourceRef sourceRef = sourceId == null ? null : refMap.get(sourceId);
        if (sourceRef != null && "1".equals(sourceRef.getFgActive())
                && "SOURCE".equalsIgnoreCase(sourceRef.getDataSourceCategory())) {
            fillSourceCheck(vo, sourceId, parsed.getEntries());
        } else {
            vo.setSourceReachable(false);
            vo.setSourceTableCheck("SKIPPED");
            vo.setInvalidTables(Collections.emptyList());
        }
        return vo;
    }

    @Override
    public void update(String dataSubId, SubscriptionSaveDTO dto) {
        if (dto == null) {
            throw new BadRequestException("请求体不能为空");
        }
        DataSubscribe current = selectActiveById(dataSubId);
        if (SubscriptionCsvHelper.isMultiSourceAnomaly(current.getDataFromSourceId())) {
            throw SubscriptionErrorCode.anomalyNotEditable();
        }
        boolean replace = resolveReplaceMode(dto.getSourceSelectionMode());

        List<ValidationErrorVO> errors = validatePayload(dto, replace);
        if (!errors.isEmpty()) {
            throw new SubscriptionValidationException(errors);
        }
        String sourceId = singleSourceToken(dto.getDataFromSourceId());
        List<String> targets = normalizeTargets(dto.getDataToSourceIds());
        validateRefsForSave(sourceId, targets, errors);
        if (!errors.isEmpty()) {
            throw new SubscriptionValidationException(errors);
        }
        if (replace) {
            List<ValidationErrorVO> tableErrors =
                    sourceMetadataService.validateTables(sourceId, dto.getSourceTables());
            if (!tableErrors.isEmpty()) {
                throw new SubscriptionValidationException(tableErrors);
            }
        }

        String finalSourceId = sourceId;
        List<String> finalTargets = targets;
        transactionTemplate.executeWithoutResult(status -> {
            DataSubscribe latest = selectActiveById(dataSubId);
            if (!replace && !finalSourceId.equals(singleSourceToken(latest.getDataFromSourceId()))) {
                throw new SubscriptionValidationException(Collections.singletonList(
                        errorItem("40312", "dataFromSourceId", finalSourceId,
                                "有限编辑模式下源库不能变更，如需更换源库请使用完整编辑模式")));
            }
            LambdaUpdateWrapper<DataSubscribe> wrapper = new LambdaUpdateWrapper<>();
            wrapper.eq(DataSubscribe::getDataSubId, dataSubId)
                    .set(DataSubscribe::getDataSubDesc, dto.getDataSubDesc().trim())
                    .set(DataSubscribe::getDataFromSourceId, finalSourceId)
                    .set(DataSubscribe::getDataToSourceId, String.join(",", finalTargets));
            if (replace) {
                wrapper.set(DataSubscribe::getDataSourceTable,
                        buildDataSourceTable(finalSourceId, dto.getSourceTables()));
            }
            wrapper.setSql("UPDATE_TIME = SYSDATE");
            int rows = dataSubscribeMapper.update(null, wrapper);
            if (rows == 0) {
                throw SubscriptionErrorCode.subscriptionNotFound();
            }
            if (rows > 1) {
                throw SubscriptionErrorCode.saveFailed();
            }
        });
    }

    @Override
    public SubscriptionDeletePreviewVO deletePreview(String dataSubId) {
        DataSubscribe row = selectActiveById(dataSubId);
        if (SubscriptionCsvHelper.isMultiSourceAnomaly(row.getDataFromSourceId())) {
            throw SubscriptionErrorCode.anomalyNotPreviewable();
        }
        Map<String, DataSourceRef> refMap = loadRefsForRows(Collections.singletonList(row));
        return SubscriptionConverter.toDeletePreviewVO(row, refMap, buildWarnings(row, refMap));
    }

    @Override
    public void delete(String dataSubId) {
        transactionTemplate.executeWithoutResult(status -> {
            DataSubscribe current = selectActiveById(dataSubId);
            if (SubscriptionCsvHelper.isMultiSourceAnomaly(current.getDataFromSourceId())) {
                throw SubscriptionErrorCode.anomalyNotDeletable();
            }
            int rows = dataSubscribeMapper.delete(new LambdaQueryWrapper<DataSubscribe>()
                    .eq(DataSubscribe::getDataSubId, dataSubId));
            if (rows == 0) {
                throw SubscriptionErrorCode.subscriptionNotFound();
            }
            if (rows > 1) {
                throw SubscriptionErrorCode.deleteFailed();
            }
        });
    }

    // ---- 候选 ----

    private static List<SourceOptionVO> toSourceOptions(List<DataSourceRef> refs) {
        List<SourceOptionVO> result = new ArrayList<>(refs.size());
        for (DataSourceRef ref : refs) {
            result.add(SubscriptionConverter.toSourceOptionVO(ref));
        }
        return result;
    }

    private static List<SubscriptionTargetOptionVO> toTargetOptions(List<DataSourceRef> refs) {
        List<SubscriptionTargetOptionVO> result = new ArrayList<>(refs.size());
        for (DataSourceRef ref : refs) {
            result.add(SubscriptionConverter.toTargetOptionVO(ref));
        }
        return result;
    }

    // ---- 列表过滤 ----

    private List<String> normalizeCandidates(List<String> candidates, String field) {
        if (candidates == null || candidates.isEmpty()) {
            return Collections.emptyList();
        }
        List<String> result = new ArrayList<>(candidates.size());
        for (String candidate : candidates) {
            if (SubscriptionCsvHelper.splitTrimDropEmpty(candidate).isEmpty()) {
                throw new BadRequestException("查询参数 " + field + " 无效：候选不能为空");
            }
            result.add(candidate);
        }
        return result;
    }

    private static boolean matchAny(String storedCsv, List<String> candidates) {
        for (String candidate : candidates) {
            if (SubscriptionCsvHelper.matchCsv(storedCsv, candidate)) {
                return true;
            }
        }
        return false;
    }

    private static List<QueryWarningVO> buildQueryWarnings(List<String> sourceCandidates,
                                                           List<String> targetCandidates) {
        List<QueryWarningVO> warnings = new ArrayList<>();
        for (String candidate : sourceCandidates) {
            if (SubscriptionCsvHelper.containsComma(candidate)) {
                warnings.add(queryWarning("sourceIds", candidate));
            }
        }
        for (String candidate : targetCandidates) {
            if (SubscriptionCsvHelper.containsComma(candidate)) {
                warnings.add(queryWarning("targetIds", candidate));
            }
        }
        return warnings;
    }

    private static QueryWarningVO queryWarning(String field, String value) {
        QueryWarningVO vo = new QueryWarningVO();
        vo.setType("AMBIGUOUS_COMMA_ID");
        vo.setField(field);
        vo.setValue(value);
        vo.setMessage(AMBIGUOUS_COMMA_WARNING);
        return vo;
    }

    // ---- 数据源引用映射（最小投影，不含密码） ----

    private Map<String, DataSourceRef> loadRefsForRows(List<DataSubscribe> rows) {
        Set<String> ids = new HashSet<>();
        for (DataSubscribe row : rows) {
            ids.addAll(SubscriptionCsvHelper.splitTrimDropEmpty(row.getDataFromSourceId()));
            ids.addAll(SubscriptionCsvHelper.splitTrimDropEmpty(row.getDataToSourceId()));
        }
        if (ids.isEmpty()) {
            return Collections.emptyMap();
        }
        List<DataSourceRef> refs = subscriptionDataSourceMapper.selectList(
                new LambdaQueryWrapper<DataSourceRef>().in(DataSourceRef::getDataSourceId, ids));
        Map<String, DataSourceRef> map = new HashMap<>();
        for (DataSourceRef ref : refs) {
            map.put(ref.getDataSourceId(), ref);
        }
        return map;
    }

    // ---- 保存校验 ----

    /**
     * 批量结构化校验（API.md §4.6 步骤 1/4/5/6）：描述、源库、目标库、源表。
     * {@code requireSourceTables} 为 false 表示 PRESERVE 模式（不校验、不使用 sourceTables）。
     */
    private List<ValidationErrorVO> validatePayload(SubscriptionSaveDTO dto, boolean requireSourceTables) {
        List<ValidationErrorVO> errors = new ArrayList<>();
        String desc = dto.getDataSubDesc();
        if (desc == null || desc.trim().isEmpty()) {
            errors.add(errorItem("40310", "dataSubDesc", null, "订阅描述不能为空"));
        } else if (desc.length() > 255) {
            errors.add(errorItem("40311", "dataSubDesc", null, "订阅描述超过 255 字符上限"));
        }

        String source = dto.getDataFromSourceId();
        if (source == null || source.trim().isEmpty()) {
            errors.add(errorItem("40312", "dataFromSourceId", null, "必须且只能选择一个源库"));
        } else {
            String trimmed = source.trim();
            if (SubscriptionCsvHelper.containsComma(trimmed) || trimmed.indexOf('.') >= 0) {
                errors.add(errorItem("40316", "dataFromSourceId", trimmed,
                        "名称含协议保留字符（英文逗号或英文句点），不能用于订阅配置"));
            }
        }

        List<String> targetIds = dto.getDataToSourceIds();
        if (targetIds == null || targetIds.isEmpty()) {
            errors.add(errorItem("40313", "dataToSourceIds", null, "必须至少选择一个目标库"));
        } else {
            Set<String> seen = new HashSet<>();
            for (String target : targetIds) {
                if (target == null || target.trim().isEmpty()) {
                    errors.add(errorItem("40313", "dataToSourceIds", target, "必须至少选择一个目标库"));
                    continue;
                }
                String tid = target.trim();
                if (SubscriptionCsvHelper.containsComma(tid) || tid.indexOf('.') >= 0) {
                    errors.add(errorItem("40316", "dataToSourceIds", tid,
                            "名称含协议保留字符（英文逗号或英文句点），不能用于订阅配置"));
                } else if (!seen.add(tid)) {
                    errors.add(errorItem("40318", "dataToSourceIds", tid, "记录内存在重复目标库"));
                }
            }
        }

        if (requireSourceTables) {
            validateSourceTables(dto.getSourceTables(), errors);
        }
        return errors;
    }

    private void validateSourceTables(List<SourceTableInput> sourceTables,
                                      List<ValidationErrorVO> errors) {
        if (sourceTables == null || sourceTables.isEmpty()) {
            errors.add(errorItem("40314", "sourceTables", null, "必须至少选择一张源表"));
            return;
        }
        Set<String> seen = new HashSet<>();
        for (SourceTableInput input : sourceTables) {
            if (input == null || isBlank(input.getSchemaName()) || isBlank(input.getTableName())) {
                errors.add(errorItem("40315", "sourceTables",
                        nvl(input == null ? null : input.getSchemaName()) + "."
                                + nvl(input == null ? null : input.getTableName()),
                        "源表输入结构或 Schema/表名格式非法"));
                continue;
            }
            String schema = input.getSchemaName().trim();
            String table = input.getTableName().trim();
            if (schema.isEmpty() || table.isEmpty()) {
                errors.add(errorItem("40315", "sourceTables", schema + "." + table,
                        "源表输入结构或 Schema/表名格式非法"));
                continue;
            }
            if (SubscriptionCsvHelper.containsComma(schema) || schema.indexOf('.') >= 0
                    || SubscriptionCsvHelper.containsComma(table) || table.indexOf('.') >= 0) {
                errors.add(errorItem("40316", "sourceTables", schema + "." + table,
                        "名称含协议保留字符（英文逗号或英文句点），不能用于订阅配置"));
                continue;
            }
            if (!seen.add(schema + "," + table)) {
                errors.add(errorItem("40317", "sourceTables", schema + "." + table,
                        "记录内存在重复源表"));
            }
        }
    }

    /**
     * 源库/目标库存在性、启用、类别校验（API.md §4.6 步骤 2/3，TBD-02 内存 equalsIgnoreCase）。
     * 复用最小投影 DataSourceRef，不加载密码；失效项统一并入 validationErrors。
     */
    private void validateRefsForSave(String sourceId, List<String> targets,
                                     List<ValidationErrorVO> errors) {
        DataSourceRef sourceRef = subscriptionDataSourceMapper.selectOne(
                new LambdaQueryWrapper<DataSourceRef>().eq(DataSourceRef::getDataSourceId, sourceId));
        if (sourceRef == null || !"1".equals(sourceRef.getFgActive())) {
            errors.add(errorItem("40320", "dataFromSourceId", sourceId, "源库不存在或已停用"));
        } else if (!"SOURCE".equalsIgnoreCase(sourceRef.getDataSourceCategory())) {
            errors.add(errorItem("40322", "dataFromSourceId", sourceId, "源库类别不正确"));
        }
        for (String targetId : targets) {
            DataSourceRef targetRef = subscriptionDataSourceMapper.selectOne(
                    new LambdaQueryWrapper<DataSourceRef>().eq(DataSourceRef::getDataSourceId, targetId));
            if (targetRef == null || !"1".equals(targetRef.getFgActive())) {
                errors.add(errorItem("40321", "dataToSourceIds", targetId, "目标库不存在或已停用"));
            } else if (!"TARGET".equalsIgnoreCase(targetRef.getDataSourceCategory())) {
                errors.add(errorItem("40323", "dataToSourceIds", targetId, "目标库类别不正确"));
            }
        }
    }

    // ---- 编辑打开源表检查（best-effort） ----

    private void fillSourceCheck(SubscriptionEditOpenVO vo, String sourceId,
                                 List<DataSourceTableParser.TableEntry> entries) {
        boolean reachable = false;
        try {
            reachable = sourceMetadataService.probeReachable(sourceId);
        } catch (RuntimeException ignored) {
            reachable = false;
        }
        vo.setSourceReachable(reachable);
        if (!reachable) {
            vo.setSourceTableCheck("UNREACHABLE");
            vo.setInvalidTables(Collections.emptyList());
            return;
        }
        try {
            List<String> invalid = checkInvalidTables(sourceId, entries);
            vo.setSourceTableCheck("CHECKED");
            vo.setInvalidTables(invalid);
        } catch (RuntimeException ignored) {
            vo.setSourceReachable(false);
            vo.setSourceTableCheck("UNREACHABLE");
            vo.setInvalidTables(Collections.emptyList());
        }
    }

    private List<String> checkInvalidTables(String sourceId,
                                            List<DataSourceTableParser.TableEntry> entries) {
        if (entries.isEmpty()) {
            return Collections.emptyList();
        }
        List<SourceTableInput> inputs = new ArrayList<>(entries.size());
        for (DataSourceTableParser.TableEntry entry : entries) {
            inputs.add(new SourceTableInput(entry.getSchema(), entry.getTableName()));
        }
        List<ValidationErrorVO> tableErrors = sourceMetadataService.validateTables(sourceId, inputs);
        List<String> invalid = new ArrayList<>();
        for (ValidationErrorVO error : tableErrors) {
            if ("40330".equals(error.getErrorCode()) || "40331".equals(error.getErrorCode())) {
                invalid.add(error.getName());
            }
        }
        return invalid;
    }

    // ---- 警告与工具 ----

    /**
     * 详情/删除预览 warnings（string[]）：已停用/不存在源库与目标库、无法解析的源表配置。
     */
    private static List<String> buildWarnings(DataSubscribe row, Map<String, DataSourceRef> refMap) {
        List<String> warnings = new ArrayList<>();
        List<String> sourceTokens = SubscriptionCsvHelper.splitTrimDropEmpty(row.getDataFromSourceId());
        if (!sourceTokens.isEmpty()) {
            String sourceId = sourceTokens.get(0);
            DataSourceRef ref = refMap.get(sourceId);
            if (ref == null) {
                warnings.add("源库不存在（" + sourceId + "）");
            } else if (!"1".equals(ref.getFgActive())) {
                warnings.add("源库已停用（" + sourceId + "）");
            }
        }
        for (String targetId : SubscriptionCsvHelper.splitTrimDropEmpty(row.getDataToSourceId())) {
            DataSourceRef ref = refMap.get(targetId);
            if (ref == null) {
                warnings.add("目标库不存在（" + targetId + "）");
            } else if (!"1".equals(ref.getFgActive())) {
                warnings.add("目标库已停用（" + targetId + "）");
            }
        }
        int unparseable = DataSourceTableParser.parse(row.getDataSourceTable()).getRawUnparseable().size();
        if (unparseable > 0) {
            warnings.add("源表配置存在无法解析的内容（" + unparseable + " 项），请查看原始表清单");
        }
        return warnings;
    }

    private DataSubscribe selectActiveById(String dataSubId) {
        DataSubscribe row = dataSubscribeMapper.selectOne(
                new LambdaQueryWrapper<DataSubscribe>()
                        .eq(DataSubscribe::getDataSubId, dataSubId)
                        .eq(DataSubscribe::getFgActive, "1"));
        if (row == null) {
            throw SubscriptionErrorCode.subscriptionNotFound();
        }
        return row;
    }

    private boolean resolveReplaceMode(String mode) {
        if (mode == null || mode.trim().isEmpty()) {
            throw new BadRequestException("sourceSelectionMode 不能为空，编辑保存必须指定 PRESERVE 或 REPLACE");
        }
        String normalized = mode.trim();
        if ("REPLACE".equalsIgnoreCase(normalized)) {
            return true;
        }
        if ("PRESERVE".equalsIgnoreCase(normalized)) {
            return false;
        }
        throw new BadRequestException("sourceSelectionMode 只能为 PRESERVE 或 REPLACE");
    }

    private static String singleSourceToken(String dataFromSourceId) {
        return SubscriptionCsvHelper.splitTrimDropEmpty(dataFromSourceId).get(0);
    }

    private static List<String> normalizeTargets(List<String> targetIds) {
        if (targetIds == null || targetIds.isEmpty()) {
            return Collections.emptyList();
        }
        List<String> result = new ArrayList<>(targetIds.size());
        for (String target : targetIds) {
            if (target != null && !target.trim().isEmpty()) {
                result.add(target.trim());
            }
        }
        return result;
    }

    private static String buildDataSourceTable(String sourceId, List<SourceTableInput> sourceTables) {
        StringBuilder sb = new StringBuilder();
        for (SourceTableInput input : sourceTables) {
            if (sb.length() > 0) {
                sb.append(',');
            }
            sb.append(sourceId).append('.').append(input.getSchemaName().trim())
                    .append('.').append(input.getTableName().trim());
        }
        return sb.toString();
    }

    private static ValidationErrorVO errorItem(String errorCode, String field, String name, String message) {
        ValidationErrorVO vo = new ValidationErrorVO();
        vo.setErrorCode(errorCode);
        vo.setField(field);
        vo.setName(name);
        vo.setMessage(message);
        return vo;
    }

    private static boolean isBlank(String value) {
        return value == null || value.trim().isEmpty();
    }

    private static String nvl(String value) {
        return value == null ? "" : value;
    }
}
