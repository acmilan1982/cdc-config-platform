package com.bsoft.cdcconfig.monitor.topicoffset.service.impl;

import com.bsoft.cdcconfig.common.exception.BusinessException;
import com.bsoft.cdcconfig.monitor.topicoffset.constant.TopicOffsetConstants;
import com.bsoft.cdcconfig.monitor.topicoffset.domain.TopicParts;
import com.bsoft.cdcconfig.monitor.topicoffset.exception.TopicOffsetErrorCode;
import com.bsoft.cdcconfig.monitor.topicoffset.mapper.ClientConfigMapper;
import com.bsoft.cdcconfig.monitor.topicoffset.mapper.DataSourceConfigMapper;
import com.bsoft.cdcconfig.monitor.topicoffset.mapper.TopicOffsetMapper;
import com.bsoft.cdcconfig.monitor.topicoffset.model.ClientConfigRow;
import com.bsoft.cdcconfig.monitor.topicoffset.model.DataSourceConfigRow;
import com.bsoft.cdcconfig.monitor.topicoffset.model.TopicOffsetRow;
import com.bsoft.cdcconfig.monitor.topicoffset.parser.TopicNameParser;
import com.bsoft.cdcconfig.monitor.topicoffset.query.TopicOffsetQuery;
import com.bsoft.cdcconfig.monitor.topicoffset.service.TopicOffsetQueryService;
import com.bsoft.cdcconfig.monitor.topicoffset.vo.CandidateGroupVO;
import com.bsoft.cdcconfig.monitor.topicoffset.vo.ClientCandidateVO;
import com.bsoft.cdcconfig.monitor.topicoffset.vo.DataSourceCandidateVO;
import com.bsoft.cdcconfig.monitor.topicoffset.vo.TopicEndpointMappingVO;
import com.bsoft.cdcconfig.monitor.topicoffset.vo.TopicNameMapVO;
import com.bsoft.cdcconfig.monitor.topicoffset.vo.TopicOffsetItemVO;
import com.bsoft.cdcconfig.monitor.topicoffset.vo.TopicOffsetPageVO;
import com.bsoft.cdcconfig.monitor.topicoffset.vo.TopicRowMappingVO;
import org.springframework.stereotype.Service;

import java.util.ArrayList;
import java.util.Collections;
import java.util.Comparator;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Locale;
import java.util.Map;

/**
 * topic-offset 只读查询编排（DESIGN §4/§5）。
 * /offsets：三次只读 SELECT（两张配置表 + 断点表）→ 内存解析/过滤/映射/切片；
 * /candidates：两次只读 SELECT（仅两张配置表）。
 * 全链路无任何写动作；NEXT_OFFSET/UPDATED_AT 已由 SQL TO_CHAR 字符串化，Java 只透传。
 */
@Service
public class TopicOffsetQueryServiceImpl implements TopicOffsetQueryService {

    private final TopicOffsetMapper topicOffsetMapper;
    private final ClientConfigMapper clientConfigMapper;
    private final DataSourceConfigMapper dataSourceConfigMapper;

    public TopicOffsetQueryServiceImpl(TopicOffsetMapper topicOffsetMapper,
                                       ClientConfigMapper clientConfigMapper,
                                       DataSourceConfigMapper dataSourceConfigMapper) {
        this.topicOffsetMapper = topicOffsetMapper;
        this.clientConfigMapper = clientConfigMapper;
        this.dataSourceConfigMapper = dataSourceConfigMapper;
    }

    @Override
    public TopicOffsetPageVO queryOffsets(TopicOffsetQuery query) {
        NormalizedCriteria criteria = normalize(query);

        Map<String, ClientConfigRow> clientById =
                indexClients(clientConfigMapper.selectAll());
        Map<String, DataSourceConfigRow> dataSourceById =
                indexDataSources(dataSourceConfigMapper.selectAll());

        List<TopicOffsetRow> rows = topicOffsetMapper.selectAll();
        List<MatchedRow> matched = new ArrayList<>();
        long unparseableTotal = 0L;
        for (TopicOffsetRow row : rows) {
            TopicParts parts = TopicNameParser.parse(row.getKafkaTopic());
            if (!parts.isParseable()) {
                if (criteria.structured) {
                    continue;
                }
                unparseableTotal++;
                matched.add(new MatchedRow(row, parts));
                continue;
            }
            if (criteria.structured && !matches(parts, criteria)) {
                continue;
            }
            matched.add(new MatchedRow(row, parts));
        }

        int total = matched.size();
        int pages = total == 0 ? 0 : (total + TopicOffsetConstants.PAGE_SIZE - 1) / TopicOffsetConstants.PAGE_SIZE;
        int pageNum = criteria.pageNum;
        long from = (long) (pageNum - 1) * TopicOffsetConstants.PAGE_SIZE;
        List<TopicOffsetItemVO> records = new ArrayList<>();
        if (from < total) {
            int start = (int) from;
            int to = (int) Math.min(from + TopicOffsetConstants.PAGE_SIZE, total);
            for (int i = start; i < to; i++) {
                MatchedRow matchedRow = matched.get(i);
                records.add(toItem(matchedRow.row, matchedRow.parts, clientById, dataSourceById));
            }
        }

        TopicOffsetPageVO vo = new TopicOffsetPageVO();
        vo.setPageNum(pageNum);
        vo.setPageSize(TopicOffsetConstants.PAGE_SIZE);
        vo.setTotal(total);
        vo.setPages(pages);
        vo.setUnparseableTotal(unparseableTotal);
        vo.setRecords(records);
        return vo;
    }

    @Override
    public CandidateGroupVO queryCandidates() {
        Map<String, ClientConfigRow> clientById =
                indexClients(clientConfigMapper.selectAll());
        Map<String, DataSourceConfigRow> dataSourceById =
                indexDataSources(dataSourceConfigMapper.selectAll());

        List<ClientConfigRow> clients = new ArrayList<>(clientById.values());
        clients.sort(Comparator.comparing(ClientConfigRow::getClientId,
                Comparator.nullsLast(Comparator.naturalOrder())));

        Comparator<DataSourceConfigRow> orgThenId = Comparator
                .comparing(DataSourceConfigRow::getDataSourceOrg,
                        Comparator.nullsLast(Comparator.naturalOrder()))
                .thenComparing(DataSourceConfigRow::getDataSourceId,
                        Comparator.nullsLast(Comparator.naturalOrder()));

        CandidateGroupVO group = new CandidateGroupVO();
        group.setClients(toClientCandidates(clients));
        group.setSources(toDataSourceCandidates(dataSourceById.values(), TopicOffsetConstants.DATA_SOURCE_CATEGORY_SOURCE, orgThenId));
        group.setTargets(toDataSourceCandidates(dataSourceById.values(), TopicOffsetConstants.DATA_SOURCE_CATEGORY_TARGET, orgThenId));
        return group;
    }

    private static List<ClientCandidateVO> toClientCandidates(List<ClientConfigRow> rows) {
        List<ClientCandidateVO> out = new ArrayList<>();
        for (ClientConfigRow row : rows) {
            ClientCandidateVO vo = new ClientCandidateVO();
            vo.setId(row.getClientId());
            vo.setDesc(row.getClientDesc());
            vo.setActive(TopicOffsetConstants.FG_ACTIVE_ENABLED.equals(row.getFgActive()));
            out.add(vo);
        }
        return out;
    }

    private static List<DataSourceCandidateVO> toDataSourceCandidates(
            Iterable<DataSourceConfigRow> rows, String category, Comparator<DataSourceConfigRow> comparator) {
        List<DataSourceConfigRow> filtered = new ArrayList<>();
        for (DataSourceConfigRow row : rows) {
            if (row.getDataSourceCategory() != null
                    && category.equals(row.getDataSourceCategory().toUpperCase(Locale.ROOT))) {
                filtered.add(row);
            }
        }
        filtered.sort(comparator);
        List<DataSourceCandidateVO> out = new ArrayList<>();
        for (DataSourceConfigRow row : filtered) {
            DataSourceCandidateVO vo = new DataSourceCandidateVO();
            vo.setId(row.getDataSourceId());
            vo.setOrg(row.getDataSourceOrg());
            vo.setActive(TopicOffsetConstants.FG_ACTIVE_ENABLED.equals(row.getFgActive()));
            out.add(vo);
        }
        return out;
    }

    private static Map<String, ClientConfigRow> indexClients(List<ClientConfigRow> rows) {
        Map<String, ClientConfigRow> map = new LinkedHashMap<>();
        if (rows != null) {
            for (ClientConfigRow row : rows) {
                if (row.getClientId() != null) {
                    map.putIfAbsent(row.getClientId(), row);
                }
            }
        }
        return map;
    }

    private static Map<String, DataSourceConfigRow> indexDataSources(List<DataSourceConfigRow> rows) {
        Map<String, DataSourceConfigRow> map = new LinkedHashMap<>();
        if (rows != null) {
            for (DataSourceConfigRow row : rows) {
                if (row.getDataSourceId() != null) {
                    map.putIfAbsent(row.getDataSourceId(), row);
                }
            }
        }
        return map;
    }

    private static TopicOffsetItemVO toItem(TopicOffsetRow row, TopicParts parts,
                                            Map<String, ClientConfigRow> clientById,
                                            Map<String, DataSourceConfigRow> dataSourceById) {
        TopicOffsetItemVO item = new TopicOffsetItemVO();
        item.setServerId(row.getServerId());
        item.setRawTopic(row.getKafkaTopic());
        item.setNextOffset(row.getNextOffsetStr());
        item.setUpdatedAt(row.getUpdatedAtStr());
        item.setParseable(parts.isParseable());
        if (parts.isParseable()) {
            item.setParsed(new TopicNameMapVO(
                    parts.getClientId(), parts.getSourceId(), parts.getSchema(),
                    parts.getTable(), parts.getTargetId()));
            item.setMapping(buildMapping(parts, clientById, dataSourceById));
        }
        return item;
    }

    private static TopicRowMappingVO buildMapping(TopicParts parts,
                                                  Map<String, ClientConfigRow> clientById,
                                                  Map<String, DataSourceConfigRow> dataSourceById) {
        TopicRowMappingVO mapping = new TopicRowMappingVO();
        mapping.setClient(mapClient(parts.getClientId(), clientById));
        mapping.setSource(mapDataSource(parts.getSourceId(), dataSourceById));
        mapping.setTarget(mapDataSource(parts.getTargetId(), dataSourceById));
        return mapping;
    }

    private static TopicEndpointMappingVO mapClient(String id, Map<String, ClientConfigRow> byId) {
        ClientConfigRow config = byId.get(id);
        if (config == null) {
            return new TopicEndpointMappingVO(TopicOffsetConstants.MAPPING_STATE_NOT_FOUND, id, null, null);
        }
        String state = active(config.getFgActive())
                ? TopicOffsetConstants.MAPPING_STATE_ACTIVE
                : TopicOffsetConstants.MAPPING_STATE_INACTIVE;
        return new TopicEndpointMappingVO(state, id, null, null);
    }

    private static TopicEndpointMappingVO mapDataSource(String id, Map<String, DataSourceConfigRow> byId) {
        DataSourceConfigRow config = byId.get(id);
        if (config == null) {
            return new TopicEndpointMappingVO(TopicOffsetConstants.MAPPING_STATE_NOT_FOUND, id, null, null);
        }
        String state = active(config.getFgActive())
                ? TopicOffsetConstants.MAPPING_STATE_ACTIVE
                : TopicOffsetConstants.MAPPING_STATE_INACTIVE;
        return new TopicEndpointMappingVO(state, id, config.getDataSourceOrg(), null);
    }

    private static boolean active(String fgActive) {
        return TopicOffsetConstants.FG_ACTIVE_ENABLED.equals(fgActive);
    }

    private static boolean matches(TopicParts parts, NormalizedCriteria criteria) {
        if (!criteria.clientIds.isEmpty() && !criteria.clientIds.contains(parts.getClientId())) {
            return false;
        }
        if (!criteria.sourceIds.isEmpty() && !criteria.sourceIds.contains(parts.getSourceId())) {
            return false;
        }
        if (!criteria.targetIds.isEmpty() && !criteria.targetIds.contains(parts.getTargetId())) {
            return false;
        }
        if (criteria.tableNameKey != null
                && !parts.getTable().toLowerCase(Locale.ROOT).contains(criteria.tableNameKey)) {
            return false;
        }
        return true;
    }

    private static NormalizedCriteria normalize(TopicOffsetQuery query) {
        int pageNum = parsePageNum(query == null ? null : query.getPageNum());
        List<String> clientIds = normalizeIds(query == null ? null : query.getClientId());
        List<String> sourceIds = normalizeIds(query == null ? null : query.getSourceId());
        List<String> targetIds = normalizeIds(query == null ? null : query.getTargetId());
        String tableName = trimToNull(query == null ? null : query.getTableName());
        if (tableName != null && tableName.length() > TopicOffsetConstants.MAX_TABLE_NAME_LENGTH) {
            throw badRequest(TopicOffsetErrorCode.TABLE_NAME_TOO_LONG);
        }
        boolean structured = !clientIds.isEmpty() || !sourceIds.isEmpty() || !targetIds.isEmpty() || tableName != null;
        String tableNameKey = tableName == null ? null : tableName.toLowerCase(Locale.ROOT);
        return new NormalizedCriteria(pageNum, clientIds, sourceIds, targetIds, tableNameKey, structured);
    }

    private static int parsePageNum(String raw) {
        String value = trimToNull(raw);
        if (value == null) {
            return 1;
        }
        int pageNum;
        try {
            pageNum = Integer.parseInt(value);
        } catch (NumberFormatException e) {
            throw badRequest(TopicOffsetErrorCode.INVALID_PAGE_NUM);
        }
        if (pageNum < 1) {
            throw badRequest(TopicOffsetErrorCode.INVALID_PAGE_NUM);
        }
        return pageNum;
    }

    private static List<String> normalizeIds(List<String> raw) {
        if (raw == null) {
            return Collections.emptyList();
        }
        if (raw.size() > TopicOffsetConstants.MAX_FILTER_IDS) {
            throw badRequest(TopicOffsetErrorCode.TOO_MANY_FILTER_IDS);
        }
        List<String> ids = new ArrayList<>();
        for (String value : raw) {
            String trimmed = trimToNull(value);
            if (trimmed != null) {
                ids.add(trimmed);
            }
        }
        return ids;
    }

    private static BusinessException badRequest(TopicOffsetErrorCode errorCode) {
        return new BusinessException(errorCode.getCode(), errorCode.getMessage());
    }

    private static String trimToNull(String value) {
        if (value == null) {
            return null;
        }
        String trimmed = value.trim();
        return trimmed.isEmpty() ? null : trimmed;
    }

    private static final class NormalizedCriteria {
        private final int pageNum;
        private final List<String> clientIds;
        private final List<String> sourceIds;
        private final List<String> targetIds;
        private final String tableNameKey;
        private final boolean structured;

        private NormalizedCriteria(int pageNum, List<String> clientIds, List<String> sourceIds,
                                   List<String> targetIds, String tableNameKey, boolean structured) {
            this.pageNum = pageNum;
            this.clientIds = clientIds;
            this.sourceIds = sourceIds;
            this.targetIds = targetIds;
            this.tableNameKey = tableNameKey;
            this.structured = structured;
        }
    }

    private static final class MatchedRow {
        private final TopicOffsetRow row;
        private final TopicParts parts;

        private MatchedRow(TopicOffsetRow row, TopicParts parts) {
            this.row = row;
            this.parts = parts;
        }
    }
}
