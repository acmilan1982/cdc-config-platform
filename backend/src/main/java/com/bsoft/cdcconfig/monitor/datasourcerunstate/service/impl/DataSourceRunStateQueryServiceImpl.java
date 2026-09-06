package com.bsoft.cdcconfig.monitor.datasourcerunstate.service.impl;

import com.bsoft.cdcconfig.common.exception.BusinessException;
import com.bsoft.cdcconfig.monitor.datasourcerunstate.constant.DataSourceRunStateConstants;
import com.bsoft.cdcconfig.monitor.datasourcerunstate.enums.SnapshotStatusCategory;
import com.bsoft.cdcconfig.monitor.datasourcerunstate.exception.DataSourceRunStateErrorCode;
import com.bsoft.cdcconfig.monitor.datasourcerunstate.mapper.DataSourceRunStateMapper;
import com.bsoft.cdcconfig.monitor.datasourcerunstate.mapper.RunStateClientMapper;
import com.bsoft.cdcconfig.monitor.datasourcerunstate.mapper.RunStateDataSourceMapper;
import com.bsoft.cdcconfig.monitor.datasourcerunstate.model.DataSourceRunStateRow;
import com.bsoft.cdcconfig.monitor.datasourcerunstate.model.RunStateClientRow;
import com.bsoft.cdcconfig.monitor.datasourcerunstate.model.RunStateDataSourceRow;
import com.bsoft.cdcconfig.monitor.datasourcerunstate.query.DataSourceRunStateQuery;
import com.bsoft.cdcconfig.monitor.datasourcerunstate.service.DataSourceRunStateQueryService;
import com.bsoft.cdcconfig.monitor.datasourcerunstate.vo.CandidateGroupVO;
import com.bsoft.cdcconfig.monitor.datasourcerunstate.vo.ClientCandidateVO;
import com.bsoft.cdcconfig.monitor.datasourcerunstate.vo.ClientRefVO;
import com.bsoft.cdcconfig.monitor.datasourcerunstate.vo.SnapshotStatusItemVO;
import com.bsoft.cdcconfig.monitor.datasourcerunstate.vo.SnapshotStatusListVO;
import com.bsoft.cdcconfig.monitor.datasourcerunstate.vo.SourceCandidateVO;
import com.bsoft.cdcconfig.monitor.datasourcerunstate.vo.SourceRefVO;
import org.springframework.stereotype.Service;

import java.util.ArrayList;
import java.util.Collections;
import java.util.Comparator;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Locale;
import java.util.Map;

/**
 * 源库快照状态只读查询编排（DESIGN §4/§5）。
 * /list：三次只读 SELECT（RUN_STATE 全量驱动 + 两张配置表投影）→ 候选（全量派生）→
 * 过滤（同维 OR、跨维 AND）→ 固定排序 → 逐行映射。
 * 全链路无任何写动作；三个 DATE 已由 SQL TO_CHAR 字符串化，Java 只透传；
 * 行恒由 RUN_STATE 驱动，关联缺失/停用/类别异常只补充字段、绝不裁剪行。
 */
@Service
public class DataSourceRunStateQueryServiceImpl implements DataSourceRunStateQueryService {

    private final DataSourceRunStateMapper dataSourceRunStateMapper;
    private final RunStateClientMapper runStateClientMapper;
    private final RunStateDataSourceMapper runStateDataSourceMapper;

    public DataSourceRunStateQueryServiceImpl(DataSourceRunStateMapper dataSourceRunStateMapper,
                                              RunStateClientMapper runStateClientMapper,
                                              RunStateDataSourceMapper runStateDataSourceMapper) {
        this.dataSourceRunStateMapper = dataSourceRunStateMapper;
        this.runStateClientMapper = runStateClientMapper;
        this.runStateDataSourceMapper = runStateDataSourceMapper;
    }

    @Override
    public SnapshotStatusListVO queryList(DataSourceRunStateQuery query) {
        NormalizedCriteria criteria = normalize(query);

        Map<String, RunStateClientRow> clientById = indexClients(runStateClientMapper.selectAll());
        Map<String, RunStateDataSourceRow> dataSourceById = indexDataSources(runStateDataSourceMapper.selectAll());

        List<DataSourceRunStateRow> allRows = dataSourceRunStateMapper.selectAll();

        List<DataSourceRunStateRow> matched = new ArrayList<>();
        boolean unknownPresent = false;
        for (DataSourceRunStateRow row : allRows) {
            if (SnapshotStatusCategory.fromRaw(row.getSnapshotStatus()) == SnapshotStatusCategory.UNKNOWN) {
                unknownPresent = true;
            }
            if (matches(row, criteria)) {
                matched.add(row);
            }
        }
        matched.sort(ROW_COMPARATOR);

        List<SnapshotStatusItemVO> records = new ArrayList<>(matched.size());
        for (DataSourceRunStateRow row : matched) {
            records.add(toItem(row, clientById, dataSourceById));
        }

        SnapshotStatusListVO vo = new SnapshotStatusListVO();
        vo.setRecords(records);
        vo.setCandidates(buildCandidates(allRows, clientById, dataSourceById, unknownPresent));
        return vo;
    }

    // ---------- 过滤 / 排序 ----------

    private static boolean matches(DataSourceRunStateRow row, NormalizedCriteria criteria) {
        if (!criteria.clientIds.isEmpty() && !criteria.clientIds.contains(row.getClientId())) {
            return false;
        }
        if (!criteria.sourceIds.isEmpty() && !criteria.sourceIds.contains(row.getDataSourceId())) {
            return false;
        }
        if (!criteria.statuses.isEmpty()) {
            SnapshotStatusCategory category = SnapshotStatusCategory.fromRaw(row.getSnapshotStatus());
            if (!criteria.statuses.contains(category.name())) {
                return false;
            }
        }
        return true;
    }

    private static final Comparator<DataSourceRunStateRow> ROW_COMPARATOR = (a, b) -> {
        int byRank = Integer.compare(statusRank(a.getSnapshotStatus()), statusRank(b.getSnapshotStatus()));
        if (byRank != 0) {
            return byRank;
        }
        int byUpdated = compareUpdatedAtDesc(a.getUpdatedAt(), b.getUpdatedAt());
        if (byUpdated != 0) {
            return byUpdated;
        }
        int byClient = compareNullableAsc(a.getClientId(), b.getClientId());
        if (byClient != 0) {
            return byClient;
        }
        return compareNullableAsc(a.getDataSourceId(), b.getDataSourceId());
    };

    private static int statusRank(String raw) {
        switch (SnapshotStatusCategory.fromRaw(raw)) {
            case RUNNING:
                return 0;
            case UNKNOWN:
                return 1;
            default:
                return 2;
        }
    }

    private static int compareUpdatedAtDesc(String a, String b) {
        if (a == null && b == null) {
            return 0;
        }
        if (a == null) {
            return 1;
        }
        if (b == null) {
            return -1;
        }
        return b.compareTo(a);
    }

    private static int compareNullableAsc(String a, String b) {
        if (a == null && b == null) {
            return 0;
        }
        if (a == null) {
            return -1;
        }
        if (b == null) {
            return 1;
        }
        return a.compareTo(b);
    }

    // ---------- 候选 ----------

    private static CandidateGroupVO buildCandidates(List<DataSourceRunStateRow> allRows,
                                                    Map<String, RunStateClientRow> clientById,
                                                    Map<String, RunStateDataSourceRow> dataSourceById,
                                                    boolean unknownPresent) {
        LinkedHashMap<String, ClientCandidateVO> clientSeen = new LinkedHashMap<>();
        LinkedHashMap<String, SourceCandidateVO> sourceSeen = new LinkedHashMap<>();
        for (DataSourceRunStateRow row : allRows) {
            String clientId = row.getClientId();
            if (clientId != null && !clientSeen.containsKey(clientId)) {
                clientSeen.put(clientId, clientCandidate(clientId, clientById));
            }
            String dataSourceId = row.getDataSourceId();
            if (dataSourceId != null && !sourceSeen.containsKey(dataSourceId)) {
                sourceSeen.put(dataSourceId, sourceCandidate(dataSourceId, dataSourceById));
            }
        }

        List<ClientCandidateVO> clients = new ArrayList<>(clientSeen.values());
        clients.sort(Comparator.comparing(ClientCandidateVO::getId,
                Comparator.nullsLast(Comparator.naturalOrder())));

        Comparator<SourceCandidateVO> orgThenId = Comparator
                .comparing(SourceCandidateVO::getOrg,
                        Comparator.nullsLast(Comparator.naturalOrder()))
                .thenComparing(SourceCandidateVO::getId,
                        Comparator.nullsLast(Comparator.naturalOrder()));
        List<SourceCandidateVO> sources = new ArrayList<>(sourceSeen.values());
        sources.sort(orgThenId);

        List<String> statuses = new ArrayList<>();
        statuses.add(SnapshotStatusCategory.RUNNING.name());
        statuses.add(SnapshotStatusCategory.COMPLETED.name());
        if (unknownPresent) {
            statuses.add(SnapshotStatusCategory.UNKNOWN.name());
        }

        CandidateGroupVO group = new CandidateGroupVO();
        group.setClients(clients);
        group.setSources(sources);
        group.setStatuses(statuses);
        return group;
    }

    private static ClientCandidateVO clientCandidate(String id, Map<String, RunStateClientRow> byId) {
        ClientCandidateVO vo = new ClientCandidateVO();
        vo.setId(id);
        RunStateClientRow config = byId.get(id);
        if (config != null) {
            vo.setDesc(config.getClientDesc());
            vo.setActive(DataSourceRunStateConstants.FG_ACTIVE_ENABLED.equals(config.getFgActive()));
        }
        return vo;
    }

    private static SourceCandidateVO sourceCandidate(String id, Map<String, RunStateDataSourceRow> byId) {
        SourceCandidateVO vo = new SourceCandidateVO();
        vo.setId(id);
        RunStateDataSourceRow config = byId.get(id);
        if (config != null) {
            vo.setOrg(config.getDataSourceOrg());
            vo.setActive(DataSourceRunStateConstants.FG_ACTIVE_ENABLED.equals(config.getFgActive()));
        }
        return vo;
    }

    // ---------- 映射 ----------

    private static SnapshotStatusItemVO toItem(DataSourceRunStateRow row,
                                               Map<String, RunStateClientRow> clientById,
                                               Map<String, RunStateDataSourceRow> dataSourceById) {
        SnapshotStatusItemVO item = new SnapshotStatusItemVO();
        item.setClientId(row.getClientId());
        item.setClientRef(mapClientRef(row.getClientId(), clientById));
        // 内部 Row 名 dataSourceId → 对外契约 JSON 字段 sourceId 的显式映射（API §6）。
        item.setSourceId(row.getDataSourceId());
        item.setSourceRef(mapSourceRef(row.getDataSourceId(), dataSourceById));
        item.setSnapshotStatus(row.getSnapshotStatus());
        item.setStatusCategory(SnapshotStatusCategory.fromRaw(row.getSnapshotStatus()).name());
        item.setSnapshotLastSeenAt(row.getSnapshotLastSeenAt());
        item.setSnapshotCompletedAt(row.getSnapshotCompletedAt());
        item.setUpdatedAt(row.getUpdatedAt());
        return item;
    }

    private static ClientRefVO mapClientRef(String id, Map<String, RunStateClientRow> byId) {
        RunStateClientRow config = byId.get(id);
        ClientRefVO ref = new ClientRefVO();
        if (config == null) {
            ref.setState(DataSourceRunStateConstants.MAPPING_STATE_NOT_FOUND);
            ref.setDesc(null);
            return ref;
        }
        ref.setState(active(config.getFgActive())
                ? DataSourceRunStateConstants.MAPPING_STATE_ACTIVE
                : DataSourceRunStateConstants.MAPPING_STATE_INACTIVE);
        ref.setDesc(config.getClientDesc());
        return ref;
    }

    private static SourceRefVO mapSourceRef(String id, Map<String, RunStateDataSourceRow> byId) {
        RunStateDataSourceRow config = byId.get(id);
        SourceRefVO ref = new SourceRefVO();
        if (config == null) {
            ref.setState(DataSourceRunStateConstants.MAPPING_STATE_NOT_FOUND);
            ref.setOrg(null);
            ref.setCategory(null);
            ref.setSourceRole(false);
            return ref;
        }
        ref.setState(active(config.getFgActive())
                ? DataSourceRunStateConstants.MAPPING_STATE_ACTIVE
                : DataSourceRunStateConstants.MAPPING_STATE_INACTIVE);
        ref.setOrg(config.getDataSourceOrg());
        String category = normalizeCategory(config.getDataSourceCategory());
        ref.setCategory(category);
        ref.setSourceRole(DataSourceRunStateConstants.DATA_SOURCE_CATEGORY_SOURCE.equals(category));
        return ref;
    }

    private static boolean active(String fgActive) {
        return DataSourceRunStateConstants.FG_ACTIVE_ENABLED.equals(fgActive);
    }

    private static String normalizeCategory(String raw) {
        if (raw == null) {
            return null;
        }
        String trimmed = raw.trim();
        if (trimmed.isEmpty()) {
            return null;
        }
        return trimmed.toUpperCase(Locale.ROOT);
    }

    // ---------- 参数归一与校验 ----------

    private static NormalizedCriteria normalize(DataSourceRunStateQuery query) {
        List<String> clientIds = normalizeDimension(query == null ? null : query.getClientId());
        List<String> sourceIds = normalizeDimension(query == null ? null : query.getSourceId());
        List<String> statuses = normalizeStatuses(query == null ? null : query.getStatus());
        return new NormalizedCriteria(clientIds, sourceIds, statuses);
    }

    private static List<String> normalizeStatuses(List<String> raw) {
        List<String> tokens = normalizeDimension(raw);
        for (String token : tokens) {
            if (!SnapshotStatusCategory.isValidToken(token)) {
                throw badRequest(DataSourceRunStateErrorCode.INVALID_STATUS_TOKEN);
            }
        }
        return tokens;
    }

    private static List<String> normalizeDimension(List<String> raw) {
        if (raw == null) {
            return Collections.emptyList();
        }
        if (raw.size() > DataSourceRunStateConstants.MAX_FILTER_IDS) {
            throw badRequest(DataSourceRunStateErrorCode.TOO_MANY_FILTER_IDS);
        }
        List<String> values = new ArrayList<>();
        for (String value : raw) {
            String trimmed = trimToNull(value);
            if (trimmed != null && !values.contains(trimmed)) {
                values.add(trimmed);
            }
        }
        return values;
    }

    private static BusinessException badRequest(DataSourceRunStateErrorCode errorCode) {
        return new BusinessException(errorCode.getCode(), errorCode.getMessage());
    }

    private static String trimToNull(String value) {
        if (value == null) {
            return null;
        }
        String trimmed = value.trim();
        return trimmed.isEmpty() ? null : trimmed;
    }

    private static Map<String, RunStateClientRow> indexClients(List<RunStateClientRow> rows) {
        Map<String, RunStateClientRow> map = new LinkedHashMap<>();
        for (RunStateClientRow row : rows) {
            if (row.getClientId() != null) {
                map.putIfAbsent(row.getClientId(), row);
            }
        }
        return map;
    }

    private static Map<String, RunStateDataSourceRow> indexDataSources(List<RunStateDataSourceRow> rows) {
        Map<String, RunStateDataSourceRow> map = new LinkedHashMap<>();
        for (RunStateDataSourceRow row : rows) {
            if (row.getDataSourceId() != null) {
                map.putIfAbsent(row.getDataSourceId(), row);
            }
        }
        return map;
    }

    private static final class NormalizedCriteria {
        private final List<String> clientIds;
        private final List<String> sourceIds;
        private final List<String> statuses;

        private NormalizedCriteria(List<String> clientIds, List<String> sourceIds, List<String> statuses) {
            this.clientIds = clientIds;
            this.sourceIds = sourceIds;
            this.statuses = statuses;
        }
    }
}
