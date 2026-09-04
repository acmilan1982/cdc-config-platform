package com.bsoft.cdcconfig.clientconfig.service.impl;

import com.baomidou.mybatisplus.core.conditions.update.LambdaUpdateWrapper;
import com.bsoft.cdcconfig.clientconfig.entity.CdcClientConfig;
import com.bsoft.cdcconfig.clientconfig.entity.CdcDataSource;
import com.bsoft.cdcconfig.clientconfig.exception.ClientConfigErrorCode;
import com.bsoft.cdcconfig.clientconfig.helper.ClientConfigDataUtil;
import com.bsoft.cdcconfig.clientconfig.helper.ClientConfigDataUtil.CsvParseResult;
import com.bsoft.cdcconfig.clientconfig.mapper.CdcClientConfigMapper;
import com.bsoft.cdcconfig.clientconfig.mapper.CdcDataSourceMapper;
import com.bsoft.cdcconfig.clientconfig.model.dto.CreateClientRequest;
import com.bsoft.cdcconfig.clientconfig.model.dto.UpdateClientRequest;
import com.bsoft.cdcconfig.clientconfig.model.query.ClientStatus;
import com.bsoft.cdcconfig.clientconfig.model.vo.ClientListItemVO;
import com.bsoft.cdcconfig.clientconfig.model.vo.ClientListVO;
import com.bsoft.cdcconfig.clientconfig.model.vo.DataSourceOptionVO;
import com.bsoft.cdcconfig.clientconfig.model.vo.DataSourceViewItemVO;
import com.bsoft.cdcconfig.clientconfig.service.ClientConfigService;
import com.bsoft.cdcconfig.common.exception.BusinessException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.ArrayList;
import java.util.Collections;
import java.util.HashMap;
import java.util.HashSet;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Locale;
import java.util.Map;
import java.util.Set;
import java.util.regex.Pattern;

/**
 * 探针端管理业务实现（并发口径：普通短事务 → 目标 DML 前全量重读 CDC_CLIENT_MULTIPLE → 当次应用层校验 →
 * 无冲突立即 DML → 行数校验；不执行显式表锁 / SELECT ... FOR UPDATE / 分布式锁，接受检查与写入之间的竞态窗口）。
 */
@Service
public class ClientConfigServiceImpl implements ClientConfigService {

    private static final Pattern CLIENT_ID_PATTERN = Pattern.compile("^[A-Za-z0-9][A-Za-z0-9._-]{0,31}$");
    private static final int CLIENT_DESC_MAX_BYTES = 1024;
    private static final int DATA_SOURCE_SERIALIZED_MAX_BYTES = 1000;
    private static final String FG_ACTIVE_1 = "1";
    private static final String FG_ACTIVE_0 = "0";
    private static final String CATEGORY_SOURCE = "SOURCE";
    private static final String TYPE_ORACLE = "ORACLE";

    private static final String ABNORMAL_MSG_NOT_FOUND = "不存在";
    private static final String ABNORMAL_MSG_INACTIVE = "已停用";
    private static final String ABNORMAL_MSG_CATEGORY = "类别非 SOURCE";
    private static final String ABNORMAL_MSG_TYPE = "类型非 ORACLE";

    private final CdcClientConfigMapper clientConfigMapper;
    private final CdcDataSourceMapper dataSourceMapper;

    public ClientConfigServiceImpl(CdcClientConfigMapper clientConfigMapper,
                                   CdcDataSourceMapper dataSourceMapper) {
        this.clientConfigMapper = clientConfigMapper;
        this.dataSourceMapper = dataSourceMapper;
    }

    // ---------------------------------------------------------------- E1 列表

    @Override
    public ClientListVO list(String keyword, ClientStatus status) {
        String kw = (keyword == null) ? null : keyword.trim();
        String statusName = (status == null) ? null : status.name();
        String pattern = null;
        if (kw != null && !kw.isEmpty()) {
            pattern = "%" + ClientConfigDataUtil.escapeLike(kw.toLowerCase(Locale.ROOT)) + "%";
        }
        String keywordParam = (kw == null || kw.isEmpty()) ? null : kw;
        String statusParam = ("ALL".equals(statusName)) ? null : statusName;

        List<CdcClientConfig> rows = clientConfigMapper.selectByKeywordAndStatus(
                keywordParam, pattern, statusParam);
        ClientListVO vo = new ClientListVO();
        if (rows.isEmpty()) {
            return vo;
        }
        List<CdcDataSource> dataSources = dataSourceMapper.selectSafeAll();
        Map<String, CdcDataSource> dsById = indexDataSources(dataSources);
        Set<String> commaIds = collectCommaContainingIds(dataSources);
        Map<String, List<String>> occupancy = buildOccupancy(rows);
        for (CdcClientConfig row : rows) {
            vo.getItems().add(toListItem(row, dsById, commaIds, occupancy));
        }
        return vo;
    }

    private ClientListItemVO toListItem(CdcClientConfig row,
                                        Map<String, CdcDataSource> dsById,
                                        Set<String> commaIds,
                                        Map<String, List<String>> occupancy) {
        ClientListItemVO vo = new ClientListItemVO();
        String clientId = row.getClientId();
        vo.setClientId(clientId);
        vo.setClientDesc(row.getClientDesc());
        vo.setFgActive(row.getFgActive());
        vo.setStatus(resolveStatus(row.getFgActive()));

        String raw = row.getDataSourceId();
        vo.setRawDataSourceIds(raw);
        CsvParseResult parse = ClientConfigDataUtil.parseCsv(raw);
        List<String> tokens = parse.getDistinctTokens();
        vo.setDataSourceCount(tokens.size());

        List<String> commaMatches = ClientConfigDataUtil.findPossibleCommaDataSourceIds(raw, commaIds);
        vo.setPossibleCommaDataSourceIds(commaMatches);
        if (!commaMatches.isEmpty()) {
            vo.getRowAnomalies().add("COMMA_PROTOCOL_AMBIGUOUS");
        }

        for (String token : tokens) {
            vo.getDataSources().add(toDataSourceViewItem(
                    token, clientId, parse.getDuplicateTokens().contains(token), dsById, occupancy));
        }
        return vo;
    }

    private DataSourceViewItemVO toDataSourceViewItem(String token,
                                                      String ownerClientId,
                                                      boolean duplicateInRow,
                                                      Map<String, CdcDataSource> dsById,
                                                      Map<String, List<String>> occupancy) {
        DataSourceViewItemVO vo = new DataSourceViewItemVO();
        vo.setDataSourceId(token);
        CdcDataSource ds = dsById.get(token);
        vo.setOrg(normalizeNullable(ds == null ? null : ds.getDataSourceOrg()));
        vo.setDataSourceName(normalizeNullable(ds == null ? null : ds.getDataSourceName()));

        List<String> anomalies = new ArrayList<>();
        if (duplicateInRow) {
            anomalies.add("DUPLICATE_IN_ROW");
        }
        String health = resolveItemAnomaly(ds);
        if (health != null) {
            anomalies.add(health);
        }
        List<String> others = ownersExcluding(occupancy.get(token), ownerClientId);
        if (!others.isEmpty()) {
            anomalies.add("ASSIGNED_TO_MULTIPLE_CLIENTS");
            vo.setConflictClientIds(others);
        }
        vo.setAnomalies(anomalies);
        return vo;
    }

    // ---------------------------------------------------------------- E2 候选

    @Override
    public List<DataSourceOptionVO> dataSourceOptions(String excludeClientId) {
        String exclude = (excludeClientId == null) ? null : excludeClientId.trim();
        List<CdcClientConfig> clients = clientConfigMapper.selectFullScan();
        List<CdcDataSource> dataSources = dataSourceMapper.selectSafeAll();
        Map<String, List<String>> occupancy = buildOccupancy(clients);

        List<DataSourceOptionVO> result = new ArrayList<>();
        for (CdcDataSource ds : dataSources) {
            if (!isCandidate(ds)) {
                continue;
            }
            DataSourceOptionVO vo = new DataSourceOptionVO();
            vo.setDataSourceId(ds.getDataSourceId());
            vo.setOrg(normalizeNullable(ds.getDataSourceOrg()));
            vo.setDataSourceName(normalizeNullable(ds.getDataSourceName()));
            if (ds.getDataSourceId().contains(",")) {
                vo.setSelectable(false);
                vo.setNotSelectableReason("COMMA_IN_ID");
            } else {
                List<String> owners = ownersExcluding(
                        occupancy.get(ds.getDataSourceId()), exclude);
                if (owners.isEmpty()) {
                    vo.setSelectable(true);
                } else {
                    vo.setSelectable(false);
                    vo.setNotSelectableReason("OCCUPIED");
                    vo.setOccupiedByClientIds(owners);
                }
            }
            result.add(vo);
        }
        return result;
    }

    // ---------------------------------------------------------------- E3 新增

    @Override
    @Transactional(rollbackFor = Exception.class)
    public void create(CreateClientRequest request) {
        NormalizedPayload payload = normalizePayload(
                request == null ? null : request.getClientId(),
                request == null ? null : request.getClientDesc(),
                request == null ? null : request.getDataSourceIds());

        List<CdcClientConfig> clients = clientConfigMapper.selectFullScan();
        List<CdcDataSource> dataSources = dataSourceMapper.selectSafeAll();
        assertClientIdUnique(clients, null, payload.clientId);
        assertSourcesAllocatable(clients, dataSources, null, payload.dataSourceIds, true);

        CdcClientConfig entity = new CdcClientConfig();
        entity.setClientId(payload.clientId);
        entity.setClientDesc(payload.clientDesc);
        entity.setDataSourceId(payload.serializedDataSourceIds);
        entity.setFgActive(FG_ACTIVE_1);
        int rows = clientConfigMapper.insert(entity);
        if (rows != 1) {
            throw ClientConfigErrorCode.saveFailed();
        }
    }

    // ---------------------------------------------------------------- E4 编辑

    @Override
    @Transactional(rollbackFor = Exception.class)
    public void update(String originalClientId, UpdateClientRequest request) {
        String original = originalClientId == null ? null : originalClientId.trim();
        NormalizedPayload payload = normalizePayload(
                request == null ? null : request.getClientId(),
                request == null ? null : request.getClientDesc(),
                request == null ? null : request.getDataSourceIds());

        List<CdcClientConfig> clients = clientConfigMapper.selectFullScan();
        CdcClientConfig originalRow = findExact(clients, original);
        if (originalRow == null) {
            throw ClientConfigErrorCode.clientNotFound();
        }
        List<CdcDataSource> dataSources = dataSourceMapper.selectSafeAll();
        assertClientIdUnique(clients, original, payload.clientId);
        assertUpdateAllowed(clients, dataSources, originalRow, payload.dataSourceIds);

        int rows = clientConfigMapper.update(null,
                new LambdaUpdateWrapper<CdcClientConfig>()
                        .eq(CdcClientConfig::getClientId, original)
                        .set(CdcClientConfig::getClientId, payload.clientId)
                        .set(CdcClientConfig::getClientDesc, payload.clientDesc)
                        .set(CdcClientConfig::getDataSourceId, payload.serializedDataSourceIds));
        if (rows != 1) {
            throw ClientConfigErrorCode.clientNotFound();
        }
    }

    // ---------------------------------------------------------------- E5 删除

    @Override
    @Transactional(rollbackFor = Exception.class)
    public void delete(String clientId) {
        String id = clientId == null ? null : clientId.trim();
        int rows = clientConfigMapper.deleteById(id);
        if (rows != 1) {
            throw ClientConfigErrorCode.clientNotFound();
        }
    }

    // ---------------------------------------------------------------- E6 启用

    @Override
    @Transactional(rollbackFor = Exception.class)
    public void enable(String clientId) {
        String id = clientId == null ? null : clientId.trim();
        List<CdcClientConfig> clients = clientConfigMapper.selectFullScan();
        CdcClientConfig target = findExact(clients, id);
        if (target == null) {
            throw ClientConfigErrorCode.clientNotFound();
        }
        String fg = target.getFgActive();
        if (!FG_ACTIVE_1.equals(fg) && !FG_ACTIVE_0.equals(fg)) {
            throw ClientConfigErrorCode.illegalClientState();
        }
        List<CdcDataSource> dataSources = dataSourceMapper.selectSafeAll();
        Map<String, CdcDataSource> dsById = indexDataSources(dataSources);
        List<String> tokens = ClientConfigDataUtil.parseCsv(target.getDataSourceId()).getDistinctTokens();
        Map<String, List<String>> occupancy = buildOccupancy(clients);
        for (String token : tokens) {
            List<String> others = ownersExcluding(occupancy.get(token), id);
            if (!others.isEmpty()) {
                String org = normalizeNullable(
                        dsById.containsKey(token) ? dsById.get(token).getDataSourceOrg() : null);
                throw ClientConfigErrorCode.dataSourceOccupied(org, token, others);
            }
        }
        int rows = clientConfigMapper.update(null,
                new LambdaUpdateWrapper<CdcClientConfig>()
                        .eq(CdcClientConfig::getClientId, id)
                        .set(CdcClientConfig::getFgActive, FG_ACTIVE_1));
        if (rows != 1) {
            throw ClientConfigErrorCode.clientNotFound();
        }
    }

    // ---------------------------------------------------------------- E7 停用

    @Override
    @Transactional(rollbackFor = Exception.class)
    public void disable(String clientId) {
        String id = clientId == null ? null : clientId.trim();
        int rows = clientConfigMapper.update(null,
                new LambdaUpdateWrapper<CdcClientConfig>()
                        .eq(CdcClientConfig::getClientId, id)
                        .set(CdcClientConfig::getFgActive, FG_ACTIVE_0));
        if (rows != 1) {
            throw ClientConfigErrorCode.clientNotFound();
        }
    }

    // ---------------------------------------------------------------- 校验与装配

    private void assertClientIdUnique(List<CdcClientConfig> clients,
                                      String excludeExactClientId,
                                      String finalClientId) {
        for (CdcClientConfig row : clients) {
            if (row.getClientId() == null) {
                continue;
            }
            if (excludeExactClientId != null && row.getClientId().equals(excludeExactClientId)) {
                continue;
            }
            if (row.getClientId().equalsIgnoreCase(finalClientId)) {
                throw ClientConfigErrorCode.clientIdConflict();
            }
        }
    }

    private void assertSourcesAllocatable(List<CdcClientConfig> clients,
                                          List<CdcDataSource> dataSources,
                                          String excludeClientId,
                                          List<String> tokens,
                                          boolean availabilityRequired) {
        Map<String, CdcDataSource> dsById = indexDataSources(dataSources);
        Map<String, List<String>> occupancy = buildOccupancy(clients);
        for (String token : tokens) {
            if (availabilityRequired) {
                String problem = resolveCandidateProblem(token, dsById.get(token));
                if (problem != null) {
                    throw ClientConfigErrorCode.dataSourceUnavailable(token, problem);
                }
            }
            List<String> others = ownersExcluding(occupancy.get(token), excludeClientId);
            if (!others.isEmpty()) {
                String org = normalizeNullable(
                        dsById.containsKey(token) ? dsById.get(token).getDataSourceOrg() : null);
                throw ClientConfigErrorCode.dataSourceOccupied(org, token, others);
            }
        }
    }

    /**
     * 编辑（E4）当次写前数据源校验：在同一事务内 DML 前重读的原记录、数据源安全字段与全表占用之上，
     * 区分“原记录历史异常仍被最终提交保留”→ 40942 与“新注入的不可用/普通占用”→ 40441/40941。
     * 判定口径：保留以“最终规范化 token 是否属于原记录普通 CSV 解析结果”为准；原行含重复 token 时
     * 请求数组规范化去重即可修复，DUPLICATE_IN_ROW 不构成 40942 阻断；行级含逗号歧义在最终规范化
     * 选择与原普通 CSV 解析结果完全一致时视为未清除（40942）。发现任一保留异常即整体阻断，不执行 DML。
     */
    private void assertUpdateAllowed(List<CdcClientConfig> clients,
                                     List<CdcDataSource> dataSources,
                                     CdcClientConfig originalRow,
                                     List<String> finalTokens) {
        Map<String, CdcDataSource> dsById = indexDataSources(dataSources);
        Set<String> commaIds = collectCommaContainingIds(dataSources);
        Map<String, List<String>> occupancy = buildOccupancy(clients);
        String originalClientId = originalRow.getClientId();
        String originalRaw = originalRow.getDataSourceId();
        List<String> originalTokens = ClientConfigDataUtil.parseCsv(originalRaw).getDistinctTokens();
        List<String> commaMatches =
                ClientConfigDataUtil.findPossibleCommaDataSourceIds(originalRaw, commaIds);

        if (!commaMatches.isEmpty() && finalTokens.equals(originalTokens)) {
            throw ClientConfigErrorCode.anomalousSelectionRowAmbiguous(originalRaw, commaMatches);
        }

        List<String> retainedProblems = new ArrayList<>();
        BusinessException firstNewProblem = null;
        for (String token : finalTokens) {
            boolean retained = originalTokens.contains(token);
            CdcDataSource ds = dsById.get(token);
            String healthReason = resolveCandidateProblem(token, ds);
            List<String> others = ownersExcluding(occupancy.get(token), originalClientId);
            if (retained) {
                if (healthReason != null) {
                    retainedProblems.add("数据源（" + token + "）：" + healthReason);
                }
                if (!others.isEmpty()) {
                    retainedProblems.add(ClientConfigErrorCode.occupiedDescriptor(
                            normalizeNullable(ds == null ? null : ds.getDataSourceOrg()), token, others));
                }
            } else if (healthReason != null) {
                if (firstNewProblem == null) {
                    firstNewProblem = ClientConfigErrorCode.dataSourceUnavailable(token, healthReason);
                }
            } else if (!others.isEmpty()) {
                if (firstNewProblem == null) {
                    firstNewProblem = ClientConfigErrorCode.dataSourceOccupied(
                            normalizeNullable(ds == null ? null : ds.getDataSourceOrg()), token, others);
                }
            }
        }
        if (!retainedProblems.isEmpty()) {
            throw ClientConfigErrorCode.anomalousSelectionBlocked(retainedProblems);
        }
        if (firstNewProblem != null) {
            throw firstNewProblem;
        }
    }

    private static Map<String, List<String>> buildOccupancy(List<CdcClientConfig> clients) {
        Map<String, List<String>> occupancy = new HashMap<>();
        for (CdcClientConfig row : clients) {
            List<String> tokens = ClientConfigDataUtil.parseCsv(row.getDataSourceId()).getDistinctTokens();
            for (String token : tokens) {
                occupancy.computeIfAbsent(token, k -> new ArrayList<>()).add(row.getClientId());
            }
        }
        return occupancy;
    }

    private static List<String> ownersExcluding(List<String> owners, String excludeClientId) {
        if (owners == null || owners.isEmpty()) {
            return Collections.emptyList();
        }
        List<String> others = new ArrayList<>();
        for (String owner : owners) {
            if (excludeClientId == null || !owner.equals(excludeClientId)) {
                others.add(owner);
            }
        }
        Collections.sort(others);
        return others;
    }

    private static String resolveItemAnomaly(CdcDataSource ds) {
        if (ds == null) {
            return "NOT_FOUND";
        }
        if (!CATEGORY_SOURCE.equalsIgnoreCase(ds.getDataSourceCategory())) {
            return "CATEGORY_MISMATCH";
        }
        if (!TYPE_ORACLE.equalsIgnoreCase(ds.getDataSourceType())) {
            return "TYPE_MISMATCH";
        }
        if (!FG_ACTIVE_1.equals(ds.getFgActive())) {
            return "INACTIVE";
        }
        return null;
    }

    private static String resolveCandidateProblem(String token, CdcDataSource ds) {
        if (ds == null) {
            return ABNORMAL_MSG_NOT_FOUND;
        }
        if (!CATEGORY_SOURCE.equalsIgnoreCase(ds.getDataSourceCategory())) {
            return ABNORMAL_MSG_CATEGORY;
        }
        if (!TYPE_ORACLE.equalsIgnoreCase(ds.getDataSourceType())) {
            return ABNORMAL_MSG_TYPE;
        }
        if (!FG_ACTIVE_1.equals(ds.getFgActive())) {
            return ABNORMAL_MSG_INACTIVE;
        }
        return null;
    }

    private static boolean isCandidate(CdcDataSource ds) {
        return ds != null
                && FG_ACTIVE_1.equals(ds.getFgActive())
                && CATEGORY_SOURCE.equalsIgnoreCase(ds.getDataSourceCategory())
                && TYPE_ORACLE.equalsIgnoreCase(ds.getDataSourceType());
    }

    private static Map<String, CdcDataSource> indexDataSources(List<CdcDataSource> dataSources) {
        Map<String, CdcDataSource> map = new HashMap<>();
        if (dataSources != null) {
            for (CdcDataSource ds : dataSources) {
                map.put(ds.getDataSourceId(), ds);
            }
        }
        return map;
    }

    private static Set<String> collectCommaContainingIds(List<CdcDataSource> dataSources) {
        Set<String> ids = new HashSet<>();
        if (dataSources != null) {
            for (CdcDataSource ds : dataSources) {
                if (ds.getDataSourceId() != null && ds.getDataSourceId().contains(",")) {
                    ids.add(ds.getDataSourceId());
                }
            }
        }
        return ids;
    }

    private static CdcClientConfig findExact(List<CdcClientConfig> clients, String clientId) {
        if (clients == null) {
            return null;
        }
        for (CdcClientConfig row : clients) {
            if (row.getClientId() != null && row.getClientId().equals(clientId)) {
                return row;
            }
        }
        return null;
    }

    private static String resolveStatus(String fgActive) {
        if (FG_ACTIVE_1.equals(fgActive)) {
            return "ENABLED";
        }
        if (FG_ACTIVE_0.equals(fgActive)) {
            return "DISABLED";
        }
        return "ABNORMAL";
    }

    private static String normalizeNullable(String value) {
        if (value == null) {
            return null;
        }
        String t = value.trim();
        return t.isEmpty() ? null : value;
    }

    /** 归一化新增/编辑请求，字段格式/描述/数据源顺序校验均在此完成。 */
    private NormalizedPayload normalizePayload(String clientIdRaw, String clientDescRaw, List<String> dsRaw) {
        String clientId = clientIdRaw == null ? null : clientIdRaw.trim();
        if (clientId == null || clientId.isEmpty()) {
            throw ClientConfigErrorCode.clientIdRequired();
        }
        if (!CLIENT_ID_PATTERN.matcher(clientId).matches()) {
            throw ClientConfigErrorCode.invalidClientId();
        }

        String descOriginal = clientDescRaw == null ? "" : clientDescRaw;
        String descTrimmed = descOriginal.trim();
        if (descTrimmed.isEmpty()) {
            throw ClientConfigErrorCode.invalidClientDesc();
        }
        if (ClientConfigDataUtil.utf8Length(descOriginal) > CLIENT_DESC_MAX_BYTES) {
            throw ClientConfigErrorCode.invalidClientDesc();
        }

        List<String> tokens = ClientConfigDataUtil.normalizeDataSourceIds(dsRaw);
        if (tokens.isEmpty()) {
            throw ClientConfigErrorCode.dataSourceRequired();
        }
        for (String token : tokens) {
            if (token.contains(",")) {
                throw ClientConfigErrorCode.invalidDataSourceId();
            }
        }
        String serialized = ClientConfigDataUtil.serializeCsv(tokens);
        if (ClientConfigDataUtil.utf8Length(serialized) > DATA_SOURCE_SERIALIZED_MAX_BYTES) {
            throw ClientConfigErrorCode.dataSourceIdsTooLong();
        }
        return new NormalizedPayload(clientId, descOriginal, tokens, serialized);
    }

    private static final class NormalizedPayload {
        private final String clientId;
        private final String clientDesc;
        private final List<String> dataSourceIds;
        private final String serializedDataSourceIds;

        private NormalizedPayload(String clientId, String clientDesc,
                                  List<String> dataSourceIds, String serializedDataSourceIds) {
            this.clientId = clientId;
            this.clientDesc = clientDesc;
            this.dataSourceIds = dataSourceIds;
            this.serializedDataSourceIds = serializedDataSourceIds;
        }
    }
}
