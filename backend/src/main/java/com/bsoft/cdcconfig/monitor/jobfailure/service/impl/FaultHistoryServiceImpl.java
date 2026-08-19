package com.bsoft.cdcconfig.monitor.jobfailure.service.impl;

import com.baomidou.mybatisplus.core.conditions.query.LambdaQueryWrapper;
import com.bsoft.cdcconfig.datasource.entity.DataSource;
import com.bsoft.cdcconfig.datasource.mapper.DataSourceMapper;
import com.bsoft.cdcconfig.monitor.jobfailure.algorithm.FaultEventModel;
import com.bsoft.cdcconfig.monitor.jobfailure.algorithm.FaultLogModel;
import com.bsoft.cdcconfig.monitor.jobfailure.algorithm.FaultProcessAssembler;
import com.bsoft.cdcconfig.monitor.jobfailure.algorithm.FaultProcessGroup;
import com.bsoft.cdcconfig.monitor.jobfailure.entity.CdcClientMultiple;
import com.bsoft.cdcconfig.monitor.jobfailure.entity.JobFailureEvent;
import com.bsoft.cdcconfig.monitor.jobfailure.entity.JobFailureHandleLog;
import com.bsoft.cdcconfig.monitor.jobfailure.enums.FaultHistoryRange;
import com.bsoft.cdcconfig.monitor.jobfailure.enums.RecordStatus;
import com.bsoft.cdcconfig.monitor.jobfailure.exception.JobFailureErrorCode;
import com.bsoft.cdcconfig.monitor.jobfailure.mapper.CdcClientMultipleMapper;
import com.bsoft.cdcconfig.monitor.jobfailure.mapper.JobFailureEventMapper;
import com.bsoft.cdcconfig.monitor.jobfailure.mapper.JobFailureHandleLogMapper;
import com.bsoft.cdcconfig.monitor.jobfailure.query.FaultHistoryListQuery;
import com.bsoft.cdcconfig.monitor.jobfailure.service.FaultHistoryService;
import com.bsoft.cdcconfig.monitor.jobfailure.support.NaturalDayWindow;
import com.bsoft.cdcconfig.monitor.jobfailure.vo.FaultHistorySummaryVO;
import com.bsoft.cdcconfig.monitor.jobfailure.vo.FaultProcessSummaryVO;
import org.springframework.stereotype.Service;

import java.time.Clock;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.Collections;
import java.util.Comparator;
import java.util.HashMap;
import java.util.HashSet;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.Set;
import java.util.stream.Collectors;

/**
 * 独立"故障历史"只读查询实现（JFM-API-006、JFM-API-007）。
 * 纯数据库历史统计：不读取 ZooKeeper、不加载 CLOB、无 N+1。
 * 故障次数按派生故障过程根事件（JFM-CHAIN-005）去重，时间归属使用过程首次失败时间。
 */
@Service
public class FaultHistoryServiceImpl implements FaultHistoryService {

    private static final String JOB_KEY_SEPARATOR = "";

    private final JobFailureEventMapper eventMapper;
    private final JobFailureHandleLogMapper logMapper;
    private final CdcClientMultipleMapper clientMultipleMapper;
    private final DataSourceMapper dataSourceMapper;
    private final Clock clock;
    private final FaultProcessAssembler assembler = new FaultProcessAssembler();

    public FaultHistoryServiceImpl(JobFailureEventMapper eventMapper,
                                   JobFailureHandleLogMapper logMapper,
                                   CdcClientMultipleMapper clientMultipleMapper,
                                   DataSourceMapper dataSourceMapper,
                                   Clock clock) {
        this.eventMapper = eventMapper;
        this.logMapper = logMapper;
        this.clientMultipleMapper = clientMultipleMapper;
        this.dataSourceMapper = dataSourceMapper;
        this.clock = clock;
    }

    // ==================== JFM-API-006: 故障历史概览 ====================

    @Override
    public List<FaultHistorySummaryVO> querySummary(String clientId) {
        NaturalDayWindow window = NaturalDayWindow.of(clock);

        List<CdcClientMultiple> enabledClients = loadEnabledClients();
        if (clientId != null && !clientId.trim().isEmpty()) {
            enabledClients = enabledClients.stream()
                    .filter(r -> clientId.equals(r.getClientId()))
                    .collect(Collectors.toList());
        }
        if (enabledClients.isEmpty()) {
            return Collections.emptyList();
        }

        List<ExpandedRow> expanded = new ArrayList<>();
        for (CdcClientMultiple r : enabledClients) {
            List<String> dsIds = JobFailureServiceImpl.splitDataSourceIds(r.getDataSourceId());
            for (int i = 0; i < dsIds.size(); i++) {
                expanded.add(new ExpandedRow(r.getClientId(), dsIds.get(i), i));
            }
        }
        if (expanded.isEmpty()) {
            return Collections.emptyList();
        }

        Set<String> masterClientIds = new HashSet<>();
        Set<String> masterDsIds = new HashSet<>();
        for (ExpandedRow row : expanded) {
            masterClientIds.add(row.clientId);
            masterDsIds.add(row.dataSourceId);
        }

        Map<String, DataSource> dsConfigMap = loadDataSourceConfig(masterDsIds);

        List<JobFailureEvent> allEvents = loadEventsForPairs(masterClientIds, masterDsIds);
        List<JobFailureHandleLog> allLogs = loadLogsByEventIds(
                allEvents.stream().map(JobFailureEvent::getId).collect(Collectors.toList()));

        Map<Long, List<JobFailureHandleLog>> logsByEvent = new HashMap<>();
        for (JobFailureHandleLog log : allLogs) {
            logsByEvent.computeIfAbsent(log.getFailureEventId(), k -> new ArrayList<>()).add(log);
        }

        Map<String, List<FaultProcessGroup>> groupsByJob = new HashMap<>();

        Map<String, List<ExpandedRow>> rowsByClient = new LinkedHashMap<>();
        for (ExpandedRow row : expanded) {
            rowsByClient.computeIfAbsent(row.clientId, k -> new ArrayList<>()).add(row);
        }

        List<ClientGroup> clientGroups = new ArrayList<>();
        for (Map.Entry<String, List<ExpandedRow>> entry : rowsByClient.entrySet()) {
            String clientIdKey = entry.getKey();
            List<FaultHistorySummaryVO> rows = new ArrayList<>();
            Map<String, Integer> configOrderById = new HashMap<>();
            for (ExpandedRow row : entry.getValue()) {
                configOrderById.put(row.dataSourceId, row.configOrder);
                List<FaultProcessGroup> groups = groupsByJob.computeIfAbsent(
                        row.jobKey(), k -> assembleLogicalJob(
                                eventsForJob(allEvents, row.clientId, row.dataSourceId),
                                logsByEvent));
                rows.add(buildSummaryRow(row, groups, dsConfigMap.get(row.dataSourceId), window));
            }
            sortRowsWithinClient(rows, configOrderById);
            clientGroups.add(new ClientGroup(clientIdKey, rows));
        }

        clientGroups.sort((a, b) -> {
            int cmp = Integer.compare(sumToday(b.rows), sumToday(a.rows));
            if (cmp != 0) return cmp;
            cmp = Integer.compare(sum7Days(b.rows), sum7Days(a.rows));
            if (cmp != 0) return cmp;
            cmp = Integer.compare(sum30Days(b.rows), sum30Days(a.rows));
            if (cmp != 0) return cmp;
            return a.clientId.compareTo(b.clientId);
        });

        List<FaultHistorySummaryVO> result = new ArrayList<>();
        for (ClientGroup cg : clientGroups) {
            result.addAll(cg.rows);
        }
        return result;
    }

    // ==================== JFM-API-007: 完整历史列表（不分页） ====================

    @Override
    public List<FaultProcessSummaryVO> queryHistory(FaultHistoryListQuery query) {
        FaultHistoryRange range = FaultHistoryRange.from(query.getRange());
        if (range == null) {
            throw JobFailureErrorCode.historyRangeInvalid(query.getRange());
        }

        validateCurrentConfig(query.getClientId(), query.getDataSourceId());

        NaturalDayWindow window = NaturalDayWindow.of(clock);
        LocalDateTime start = range == FaultHistoryRange.TODAY ? window.getTodayStart()
                : range == FaultHistoryRange.LAST_7_DAYS ? window.getLast7DaysStart()
                : window.getLast30DaysStart();

        List<FaultProcessGroup> groups = loadAndAssemble(query.getClientId(), query.getDataSourceId());

        List<FaultProcessGroup> filtered = groups.stream()
                .filter(g -> window.inWindow(g.getFirstFailureTime(), start))
                .collect(Collectors.toList());

        filtered.sort((a, b) -> {
            int cmp = Comparator.nullsLast(Comparator.<LocalDateTime>naturalOrder().reversed())
                    .compare(a.getFirstFailureTime(), b.getFirstFailureTime());
            if (cmp != 0) return cmp;
            return Long.compare(a.getFaultRootId(), b.getFaultRootId());
        });

        return filtered.stream()
                .map(g -> JobFailureServiceImpl.toSummaryVO(g, assembler))
                .collect(Collectors.toList());
    }

    // ==================== 概览构建 ====================

    private FaultHistorySummaryVO buildSummaryRow(ExpandedRow row,
                                                  List<FaultProcessGroup> groups,
                                                  DataSource dsConfig,
                                                  NaturalDayWindow window) {
        FaultHistorySummaryVO vo = new FaultHistorySummaryVO();
        vo.setClientId(row.clientId);
        vo.setDataSourceId(row.dataSourceId);

        int today = 0;
        int last7 = 0;
        int last30 = 0;
        FaultProcessGroup latest = null;
        for (FaultProcessGroup g : groups) {
            LocalDateTime first = g.getFirstFailureTime();
            if (first == null) {
                continue;
            }
            if (window.inToday(first)) today++;
            if (window.inLast7Days(first)) last7++;
            if (window.inLast30Days(first)) last30++;
            if (latest == null || first.isAfter(latest.getFirstFailureTime())) {
                latest = g;
            }
        }
        vo.setTodayFailureCount(today);
        vo.setLast7DaysFailureCount(last7);
        vo.setLast30DaysFailureCount(last30);

        if (latest != null) {
            vo.setLatestFailureTime(latest.getFirstFailureTime());
            RecordStatus status = assembler.resolveRecordStatus(latest);
            vo.setLatestProcessStatus(status.name());
            vo.setLatestProcessStatusLabel(status.getLabel());
        }

        if (dsConfig != null) {
            vo.setDataSourceOrg(dsConfig.getDataSourceOrg());
            vo.setDataSourceExists(true);
            vo.setDataSourceActive(!"0".equals(dsConfig.getFgActive()));
        } else {
            vo.setDataSourceOrg(null);
            vo.setDataSourceExists(false);
            vo.setDataSourceActive(null);
        }
        return vo;
    }

    private void sortRowsWithinClient(List<FaultHistorySummaryVO> rows, Map<String, Integer> configOrderById) {
        rows.sort((a, b) -> {
            int cmp = Integer.compare(b.getTodayFailureCount(), a.getTodayFailureCount());
            if (cmp != 0) return cmp;
            cmp = Integer.compare(b.getLast7DaysFailureCount(), a.getLast7DaysFailureCount());
            if (cmp != 0) return cmp;
            cmp = Integer.compare(b.getLast30DaysFailureCount(), a.getLast30DaysFailureCount());
            if (cmp != 0) return cmp;
            int oa = configOrderById.getOrDefault(a.getDataSourceId(), 0);
            int ob = configOrderById.getOrDefault(b.getDataSourceId(), 0);
            if (oa != ob) return Integer.compare(oa, ob);
            return a.getDataSourceId().compareTo(b.getDataSourceId());
        });
    }

    private static int sumToday(List<FaultHistorySummaryVO> rows) {
        return rows.stream().mapToInt(FaultHistorySummaryVO::getTodayFailureCount).sum();
    }

    private static int sum7Days(List<FaultHistorySummaryVO> rows) {
        return rows.stream().mapToInt(FaultHistorySummaryVO::getLast7DaysFailureCount).sum();
    }

    private static int sum30Days(List<FaultHistorySummaryVO> rows) {
        return rows.stream().mapToInt(FaultHistorySummaryVO::getLast30DaysFailureCount).sum();
    }

    // ==================== 当前配置校验与数据加载 ====================

    private void validateCurrentConfig(String clientId, String dataSourceId) {
        if (dataSourceId != null && dataSourceId.contains(",")) {
            throw JobFailureErrorCode.historyDataSourceNotInCurrentConfig(clientId, dataSourceId);
        }
        boolean inConfig = false;
        for (CdcClientMultiple r : loadEnabledClients()) {
            if (!clientId.equals(r.getClientId())) {
                continue;
            }
            if (JobFailureServiceImpl.splitDataSourceIds(r.getDataSourceId()).contains(dataSourceId)) {
                inConfig = true;
            }
            break;
        }
        if (!inConfig) {
            throw JobFailureErrorCode.historyDataSourceNotInCurrentConfig(clientId, dataSourceId);
        }
    }

    private List<CdcClientMultiple> loadEnabledClients() {
        LambdaQueryWrapper<CdcClientMultiple> wrapper = new LambdaQueryWrapper<>();
        wrapper.eq(CdcClientMultiple::getFgActive, "1");
        return clientMultipleMapper.selectList(wrapper);
    }

    private Map<String, DataSource> loadDataSourceConfig(Set<String> dataSourceIds) {
        if (dataSourceIds == null || dataSourceIds.isEmpty()) {
            return Collections.emptyMap();
        }
        Map<String, DataSource> map = new HashMap<>();
        for (DataSource ds : dataSourceMapper.selectBatchIds(dataSourceIds)) {
            map.put(ds.getDataSourceId(), ds);
        }
        return map;
    }

    private List<JobFailureEvent> loadEventsForPairs(Set<String> clientIds, Set<String> dataSourceIds) {
        LambdaQueryWrapper<JobFailureEvent> wrapper = new LambdaQueryWrapper<>();
        wrapper.in(JobFailureEvent::getClientId, clientIds)
               .in(JobFailureEvent::getDataSourceId, dataSourceIds)
               .orderByAsc(JobFailureEvent::getClientId)
               .orderByAsc(JobFailureEvent::getDataSourceId)
               .orderByAsc(JobFailureEvent::getFailureTime);
        return eventMapper.selectList(wrapper);
    }

    private List<JobFailureEvent> eventsForJob(List<JobFailureEvent> allEvents, String clientId, String dataSourceId) {
        return allEvents.stream()
                .filter(e -> clientId.equals(e.getClientId()) && dataSourceId.equals(e.getDataSourceId()))
                .sorted(Comparator.comparing(JobFailureEvent::getFailureTime,
                        Comparator.nullsLast(Comparator.naturalOrder())))
                .collect(Collectors.toList());
    }

    private List<FaultProcessGroup> assembleLogicalJob(List<JobFailureEvent> events,
                                                       Map<Long, List<JobFailureHandleLog>> logsByEvent) {
        if (events.isEmpty()) {
            return Collections.emptyList();
        }
        List<FaultLogModel> logModels = new ArrayList<>();
        for (JobFailureEvent e : events) {
            List<JobFailureHandleLog> logs = logsByEvent.get(e.getId());
            if (logs != null) {
                for (JobFailureHandleLog l : logs) {
                    logModels.add(JobFailureServiceImpl.toFaultLogModel(l));
                }
            }
        }
        logModels.sort(Comparator.comparing(FaultLogModel::getHandleTime,
                        Comparator.nullsLast(Comparator.naturalOrder()))
                .thenComparing(FaultLogModel::getId, Comparator.nullsLast(Comparator.naturalOrder())));

        List<FaultEventModel> models = events.stream()
                .map(JobFailureServiceImpl::toFaultEventModel)
                .collect(Collectors.toList());
        return assembler.assemble(models, logModels);
    }

    private List<JobFailureHandleLog> loadLogsByEventIds(List<Long> eventIds) {
        if (eventIds == null || eventIds.isEmpty()) {
            return Collections.emptyList();
        }
        LambdaQueryWrapper<JobFailureHandleLog> wrapper = new LambdaQueryWrapper<>();
        wrapper.in(JobFailureHandleLog::getFailureEventId, eventIds)
               .orderByAsc(JobFailureHandleLog::getHandleTime)
               .orderByAsc(JobFailureHandleLog::getId);
        return logMapper.selectList(wrapper);
    }

    private List<FaultProcessGroup> loadAndAssemble(String clientId, String dataSourceId) {
        LambdaQueryWrapper<JobFailureEvent> wrapper = new LambdaQueryWrapper<>();
        wrapper.eq(JobFailureEvent::getClientId, clientId)
               .eq(JobFailureEvent::getDataSourceId, dataSourceId)
               .orderByAsc(JobFailureEvent::getFailureTime);
        List<JobFailureEvent> events = eventMapper.selectList(wrapper);
        if (events.isEmpty()) {
            return Collections.emptyList();
        }
        List<JobFailureHandleLog> logs = loadLogsByEventIds(
                events.stream().map(JobFailureEvent::getId).collect(Collectors.toList()));
        List<FaultEventModel> models = events.stream()
                .map(JobFailureServiceImpl::toFaultEventModel)
                .collect(Collectors.toList());
        List<FaultLogModel> logModels = logs.stream()
                .map(JobFailureServiceImpl::toFaultLogModel)
                .collect(Collectors.toList());
        return assembler.assemble(models, logModels);
    }

    // ==================== 内部结构 ====================

    private static final class ExpandedRow {
        final String clientId;
        final String dataSourceId;
        final int configOrder;

        ExpandedRow(String clientId, String dataSourceId, int configOrder) {
            this.clientId = clientId;
            this.dataSourceId = dataSourceId;
            this.configOrder = configOrder;
        }

        String jobKey() {
            return clientId + JOB_KEY_SEPARATOR + dataSourceId;
        }
    }

    private static final class ClientGroup {
        final String clientId;
        final List<FaultHistorySummaryVO> rows;

        ClientGroup(String clientId, List<FaultHistorySummaryVO> rows) {
            this.clientId = clientId;
            this.rows = rows;
        }
    }
}
