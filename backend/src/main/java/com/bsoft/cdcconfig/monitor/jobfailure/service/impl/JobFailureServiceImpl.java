package com.bsoft.cdcconfig.monitor.jobfailure.service.impl;

import com.baomidou.mybatisplus.core.conditions.query.LambdaQueryWrapper;
import com.bsoft.cdcconfig.common.page.PageResult;
import com.bsoft.cdcconfig.monitor.jobfailure.algorithm.AnomalyInfo;
import com.bsoft.cdcconfig.monitor.jobfailure.algorithm.FaultEventModel;
import com.bsoft.cdcconfig.monitor.jobfailure.algorithm.FaultLogModel;
import com.bsoft.cdcconfig.monitor.jobfailure.algorithm.FaultProcessAssembler;
import com.bsoft.cdcconfig.monitor.jobfailure.algorithm.FaultProcessGroup;
import com.bsoft.cdcconfig.monitor.jobfailure.algorithm.JobChainNode;
import com.bsoft.cdcconfig.datasource.entity.DataSource;
import com.bsoft.cdcconfig.datasource.mapper.DataSourceMapper;
import com.bsoft.cdcconfig.monitor.jobfailure.entity.CdcClientMultiple;
import com.bsoft.cdcconfig.monitor.jobfailure.entity.JobFailureEvent;
import com.bsoft.cdcconfig.monitor.jobfailure.entity.JobFailureHandleLog;
import com.bsoft.cdcconfig.monitor.jobfailure.mapper.CdcClientMultipleMapper;
import com.bsoft.cdcconfig.monitor.jobfailure.enums.ClobFieldType;
import com.bsoft.cdcconfig.monitor.jobfailure.enums.EventValidity;
import com.bsoft.cdcconfig.monitor.jobfailure.enums.FaultProcessResult;
import com.bsoft.cdcconfig.monitor.jobfailure.enums.RecordStatus;
import com.bsoft.cdcconfig.monitor.jobfailure.exception.JobFailureErrorCode;
import com.bsoft.cdcconfig.monitor.jobfailure.mapper.JobFailureEventMapper;
import com.bsoft.cdcconfig.monitor.jobfailure.mapper.JobFailureHandleLogMapper;
import com.bsoft.cdcconfig.monitor.jobfailure.query.HistoryQuery;
import com.bsoft.cdcconfig.monitor.jobfailure.runtime.JobRuntimeSnapshot;
import com.bsoft.cdcconfig.monitor.jobfailure.runtime.JobRuntimeStatusReader;
import com.bsoft.cdcconfig.monitor.jobfailure.service.JobFailureService;
import com.bsoft.cdcconfig.monitor.jobfailure.vo.AnomalyVO;
import com.bsoft.cdcconfig.monitor.jobfailure.vo.ClobDetailVO;
import com.bsoft.cdcconfig.monitor.jobfailure.vo.EventCardVO;
import com.bsoft.cdcconfig.monitor.jobfailure.vo.FaultProcessDetailVO;
import com.bsoft.cdcconfig.monitor.jobfailure.vo.FaultProcessSummaryVO;
import com.bsoft.cdcconfig.monitor.jobfailure.vo.HandleTimelineVO;
import com.bsoft.cdcconfig.monitor.jobfailure.vo.JobChainVO;
import com.bsoft.cdcconfig.monitor.jobfailure.vo.JobFailureSummaryVO;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;

import java.util.ArrayList;
import java.util.Collections;
import java.util.Comparator;
import java.util.HashMap;
import java.util.HashSet;
import java.util.LinkedHashMap;
import java.util.LinkedHashSet;
import java.util.List;
import java.util.Map;
import java.util.Set;
import java.util.stream.Collectors;

@Service
public class JobFailureServiceImpl implements JobFailureService {

    private static final Logger log = LoggerFactory.getLogger(JobFailureServiceImpl.class);
    private static final int MAX_CLOB_LENGTH = 65535;

    private final JobFailureEventMapper eventMapper;
    private final JobFailureHandleLogMapper logMapper;
    private final CdcClientMultipleMapper clientMultipleMapper;
    private final DataSourceMapper dataSourceMapper;
    private final JobRuntimeStatusReader runtimeStatusReader;
    private final FaultProcessAssembler assembler;

    public JobFailureServiceImpl(JobFailureEventMapper eventMapper,
                                 JobFailureHandleLogMapper logMapper,
                                 CdcClientMultipleMapper clientMultipleMapper,
                                 DataSourceMapper dataSourceMapper,
                                 JobRuntimeStatusReader runtimeStatusReader) {
        this.eventMapper = eventMapper;
        this.logMapper = logMapper;
        this.clientMultipleMapper = clientMultipleMapper;
        this.dataSourceMapper = dataSourceMapper;
        this.runtimeStatusReader = runtimeStatusReader;
        this.assembler = new FaultProcessAssembler();
    }

    // ==================== API-1: Summary ====================

    @Override
    public List<JobFailureSummaryVO> querySummary() {
        // 1. Load all FG_ACTIVE=1 records from CDC_CLIENT_MULTIPLE as master set
        LambdaQueryWrapper<CdcClientMultiple> masterWrapper = new LambdaQueryWrapper<>();
        masterWrapper.eq(CdcClientMultiple::getFgActive, "1");
        List<CdcClientMultiple> masterRecords = clientMultipleMapper.selectList(masterWrapper);

        if (masterRecords.isEmpty()) {
            return Collections.emptyList();
        }

        // 2. Expand each enabled client's comma-separated DATA_SOURCE_ID into ordered
        //    (clientId, dataSourceId) rows. Inactive clients are already excluded above.
        List<ClientDataSource> expanded = new ArrayList<>();
        for (CdcClientMultiple r : masterRecords) {
            for (String dsId : splitDataSourceIds(r.getDataSourceId())) {
                expanded.add(new ClientDataSource(r.getClientId(), r.getClientDesc(), dsId));
            }
        }

        if (expanded.isEmpty()) {
            return Collections.emptyList();
        }

        // 3. Collect client name map and distinct single-ID sets for batch queries
        Map<String, String> clientNameMap = new HashMap<>();
        Set<String> masterClientIds = new HashSet<>();
        Set<String> masterDsIds = new HashSet<>();
        for (ClientDataSource item : expanded) {
            clientNameMap.put(item.clientId, item.clientDesc);
            masterClientIds.add(item.clientId);
            masterDsIds.add(item.dataSourceId);
        }

        // 3.1 Strict ZooKeeper runtime status snapshot. DB config remains the master set; ZK only
        //     supplies client/job online booleans. A single required-path read failure fails the
        //     whole round (no partial results). Duplicate single IDs are deduped per client so each
        //     alive path is read at most once.
        Map<String, List<String>> clientJobs = new LinkedHashMap<>();
        Map<String, LinkedHashSet<String>> clientJobSet = new LinkedHashMap<>();
        for (ClientDataSource item : expanded) {
            clientJobSet.computeIfAbsent(item.clientId, k -> new LinkedHashSet<>())
                    .add(item.dataSourceId);
        }
        for (Map.Entry<String, LinkedHashSet<String>> entry : clientJobSet.entrySet()) {
            clientJobs.put(entry.getKey(), new ArrayList<>(entry.getValue()));
        }
        JobRuntimeSnapshot runtimeSnapshot = runtimeStatusReader.snapshot(clientJobs);

        // 4. Load all events for all expanded pairs in a single query
        LambdaQueryWrapper<JobFailureEvent> eventWrapper = new LambdaQueryWrapper<>();
        eventWrapper.in(JobFailureEvent::getClientId, masterClientIds)
                    .in(JobFailureEvent::getDataSourceId, masterDsIds);
        List<JobFailureEvent> allEvents = eventMapper.selectList(eventWrapper);

        // 5. Batch load all logs for all events
        List<Long> allEventIds = allEvents.stream().map(JobFailureEvent::getId).collect(Collectors.toList());
        List<JobFailureHandleLog> allLogs = loadLogsByEventIds(allEventIds);

        // 6. Batch load datasource config (name + org) in a single query
        Map<String, DataSource> dsConfigMap = loadDataSourceConfig(masterDsIds);

        // 7. Compute summary for each expanded row
        List<JobFailureSummaryVO> summaries = new ArrayList<>();
        for (ClientDataSource item : expanded) {
            String clientId = item.clientId;
            String dataSourceId = item.dataSourceId;

            // Filter events for this logical job
            List<JobFailureEvent> jobEvents = allEvents.stream()
                    .filter(e -> clientId.equals(e.getClientId()) && dataSourceId.equals(e.getDataSourceId()))
                    .sorted(Comparator.comparing(JobFailureEvent::getFailureTime,
                            Comparator.nullsLast(Comparator.naturalOrder())))
                    .collect(Collectors.toList());

            JobFailureSummaryVO vo = new JobFailureSummaryVO();
            vo.setClientId(clientId);
            vo.setClientName(clientNameMap.get(clientId));
            vo.setDataSourceId(dataSourceId);
            vo.setClientOnline(runtimeSnapshot.clientOnline(clientId));
            vo.setJobOnline(runtimeSnapshot.jobOnline(clientId, dataSourceId));
            DataSource dsConfig = dsConfigMap.get(dataSourceId);
            if (dsConfig != null) {
                vo.setDataSourceName(dsConfig.getDataSourceName());
                vo.setDataSourceOrg(dsConfig.getDataSourceOrg());
                vo.setDataSourceExists(true);
                vo.setDataSourceActive(!"0".equals(dsConfig.getFgActive()));
            } else {
                vo.setDataSourceName(null);
                vo.setDataSourceOrg(null);
                vo.setDataSourceExists(false);
                vo.setDataSourceActive(null);
            }
            vo.setEventCountInWindow(jobEvents.size());

            if (jobEvents.isEmpty()) {
                vo.setJobStatus("正常运行");
                vo.setLatestRestartCount(0);
            } else {
                // Filter logs for this job
                Set<Long> jobEventIdSet = jobEvents.stream().map(JobFailureEvent::getId).collect(Collectors.toSet());
                List<JobFailureHandleLog> jobLogs = allLogs.stream()
                        .filter(l -> jobEventIdSet.contains(l.getFailureEventId()))
                        .collect(Collectors.toList());

                // Convert to algorithm models
                List<FaultEventModel> models = jobEvents.stream()
                        .map(JobFailureServiceImpl::toFaultEventModel)
                        .collect(Collectors.toList());
                List<FaultLogModel> logModels = jobLogs.stream()
                        .map(JobFailureServiceImpl::toFaultLogModel)
                        .collect(Collectors.toList());

                // Assemble fault processes
                List<FaultProcessGroup> groups = assembler.assemble(models, logModels);

                JobFailureEvent latestEvent = jobEvents.get(jobEvents.size() - 1);
                vo.setLatestFailureTime(latestEvent.getFailureTime());
                vo.setLatestEventId(latestEvent.getId());

                if (!groups.isEmpty()) {
                    FaultProcessGroup latestGroup = groups.get(groups.size() - 1);
                    vo.setLatestFaultRootId(latestGroup.getFaultRootId());
                    vo.setLatestRestartCount(latestGroup.countRestarts());

                    // Determine job status and recovery time
                    boolean closed = false;
                    java.time.LocalDateTime recoveryTime = null;
                    for (FaultLogModel l : latestGroup.getAllLogs()) {
                        if (l.isStableCheckPassed()) {
                            closed = true;
                            if (l.getHandleTime() != null) {
                                recoveryTime = l.getHandleTime();
                            }
                            break;
                        }
                    }
                    vo.setJobStatus(closed ? "正常运行" : "恢复中");
                    vo.setLatestRecoveryTime(recoveryTime);
                } else {
                    vo.setJobStatus("正常运行");
                    vo.setLatestRestartCount(0);
                }
            }

            summaries.add(vo);
        }

        return summaries;
    }

    // ==================== API-2: Latest Fault ====================

    @Override
    public FaultProcessDetailVO getLatestFault(String clientId, String dataSourceId) {
        List<FaultProcessGroup> groups = loadAndAssemble(clientId, dataSourceId);
        if (groups.isEmpty()) {
            throw JobFailureErrorCode.logicalJobNotFound(clientId, dataSourceId);
        }
        FaultProcessGroup latest = groups.get(groups.size() - 1);
        return toDetailVO(latest);
    }

    // ==================== API-3: History ====================

    @Override
    public PageResult<FaultProcessSummaryVO> queryHistory(HistoryQuery query) {
        List<FaultProcessGroup> groups = loadAndAssemble(query.getClientId(), query.getDataSourceId());

        // Time range filter
        if (query.getStartTime() != null || query.getEndTime() != null) {
            groups = groups.stream().filter(g -> {
                java.time.LocalDateTime firstTime = g.getFirstFailureTime();
                if (firstTime == null) return false;
                if (query.getStartTime() != null && firstTime.isBefore(query.getStartTime())) return false;
                if (query.getEndTime() != null && firstTime.isAfter(query.getEndTime())) return false;
                return true;
            }).collect(Collectors.toList());
        }

        // Sort by first failure time DESC
        groups.sort((a, b) -> {
            java.time.LocalDateTime ta = a.getFirstFailureTime();
            java.time.LocalDateTime tb = b.getFirstFailureTime();
            return Comparator.nullsLast(Comparator.<java.time.LocalDateTime>naturalOrder().reversed())
                    .compare(ta, tb);
        });

        // Manual pagination
        int total = groups.size();
        int fromIndex = (query.getPageNum() - 1) * query.getPageSize();
        int toIndex = Math.min(fromIndex + query.getPageSize(), total);
        if (fromIndex >= total) {
            return new PageResult<>(Collections.emptyList(), total, query.getPageNum(), query.getPageSize());
        }
        List<FaultProcessGroup> page = groups.subList(fromIndex, toIndex);
        List<FaultProcessSummaryVO> vos = page.stream().map(this::toSummaryVO).collect(Collectors.toList());
        return new PageResult<>(vos, total, query.getPageNum(), query.getPageSize());
    }

    // ==================== API-4: Process Detail ====================

    @Override
    public FaultProcessDetailVO getProcessDetail(Long faultRootId) {
        JobFailureEvent rootEvent = eventMapper.selectById(faultRootId);
        if (rootEvent == null) {
            throw JobFailureErrorCode.faultRootNotFound(faultRootId);
        }

        String clientId = rootEvent.getClientId();
        String dataSourceId = rootEvent.getDataSourceId();

        // Load all events and logs for this logical job
        List<FaultProcessGroup> groups = loadAndAssemble(clientId, dataSourceId);

        // Find the group containing faultRootId
        FaultProcessGroup target = null;
        for (FaultProcessGroup g : groups) {
            for (FaultEventModel e : g.getAllEvents()) {
                if (e.getId().equals(faultRootId)) {
                    target = g;
                    break;
                }
            }
            if (target != null) break;
        }

        if (target == null) {
            throw JobFailureErrorCode.faultRootNotFound(faultRootId);
        }

        // Verify root event is main-chain eligible
        boolean isEligible = false;
        for (FaultEventModel e : target.getMainChainEvents()) {
            if (e.getId().equals(faultRootId)) {
                isEligible = true;
                break;
            }
        }
        if (!isEligible) {
            throw JobFailureErrorCode.faultRootNotFound(faultRootId);
        }

        return toDetailVO(target);
    }

    // ==================== API-5: CLOB Lazy Load ====================

    @Override
    public ClobDetailVO getClobDetail(Long faultRootId, String clobField, Long recordId) {
        ClobFieldType fieldType = ClobFieldType.fromApiValue(clobField);
        if (fieldType == null) {
            throw JobFailureErrorCode.clobFieldInvalid(clobField);
        }

        // Load fault root and entire fault process
        JobFailureEvent rootEvent = eventMapper.selectById(faultRootId);
        if (rootEvent == null) {
            throw JobFailureErrorCode.faultRootNotFound(faultRootId);
        }
        List<FaultProcessGroup> groups = loadAndAssemble(
                rootEvent.getClientId(), rootEvent.getDataSourceId());

        FaultProcessGroup targetGroup = null;
        for (FaultProcessGroup g : groups) {
            for (FaultEventModel e : g.getAllEvents()) {
                if (e.getId().equals(faultRootId)) {
                    targetGroup = g;
                    break;
                }
            }
            if (targetGroup != null) break;
        }
        if (targetGroup == null) {
            throw JobFailureErrorCode.faultRootNotFound(faultRootId);
        }

        Set<Long> validEventIds = targetGroup.getAllEvents().stream()
                .map(FaultEventModel::getId).collect(Collectors.toSet());

        ClobDetailVO vo = new ClobDetailVO();
        vo.setRecordType(fieldType.getApiValue());

        if (fieldType == ClobFieldType.FAILURE_EVENT_FAILURE_DETAIL) {
            // Validate recordId is an event in this fault process
            if (!validEventIds.contains(recordId)) {
                throw JobFailureErrorCode.recordNotInFaultProcess(recordId, faultRootId);
            }
            JobFailureEvent event = eventMapper.selectById(recordId);
            if (event == null) {
                throw JobFailureErrorCode.recordNotInFaultProcess(recordId, faultRootId);
            }
            vo.setRecordId(event.getId());
            vo.setContentType("text/plain");
            String content = event.getFailureDetail();
            vo.setContent(content);
            vo.setContentLength(content != null ? content.length() : 0);
            if (content != null && content.length() > MAX_CLOB_LENGTH) {
                vo.setContent(content.substring(0, MAX_CLOB_LENGTH));
                vo.setTruncated(true);
            }
        } else {
            // FAILURE_HANDLE_LOG_ERROR_DETAIL
            // Validate recordId is a handle log belonging to this fault process
            JobFailureHandleLog targetLog = logMapper.selectById(recordId);
            if (targetLog == null || targetLog.getFailureEventId() == null
                    || !validEventIds.contains(targetLog.getFailureEventId())) {
                throw JobFailureErrorCode.recordNotInFaultProcess(recordId, faultRootId);
            }
            vo.setRecordId(targetLog.getId());
            vo.setContentType("text/plain");
            String content = targetLog.getErrorDetail();
            vo.setContent(content);
            vo.setContentLength(content != null ? content.length() : 0);
            if (content != null && content.length() > MAX_CLOB_LENGTH) {
                vo.setContent(content.substring(0, MAX_CLOB_LENGTH));
                vo.setTruncated(true);
            }
        }

        return vo;
    }

    // ==================== Private Helpers ====================

    private List<FaultProcessGroup> loadAndAssemble(String clientId, String dataSourceId) {
        LambdaQueryWrapper<JobFailureEvent> wrapper = new LambdaQueryWrapper<>();
        wrapper.eq(JobFailureEvent::getClientId, clientId)
               .eq(JobFailureEvent::getDataSourceId, dataSourceId)
               .orderByAsc(JobFailureEvent::getFailureTime);
        List<JobFailureEvent> events = eventMapper.selectList(wrapper);
        if (events.isEmpty()) {
            return Collections.emptyList();
        }

        List<Long> eventIds = events.stream().map(JobFailureEvent::getId).collect(Collectors.toList());
        List<JobFailureHandleLog> logs = loadLogsByEventIds(eventIds);

        List<FaultEventModel> models = events.stream()
                .map(JobFailureServiceImpl::toFaultEventModel)
                .collect(Collectors.toList());
        List<FaultLogModel> logModels = logs.stream()
                .map(JobFailureServiceImpl::toFaultLogModel)
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

    private static FaultEventModel toFaultEventModel(JobFailureEvent e) {
        FaultEventModel m = new FaultEventModel();
        m.setId(e.getId());
        m.setClientId(e.getClientId());
        m.setDataSourceId(e.getDataSourceId());
        m.setFailedJobId(e.getFailedJobId());
        m.setFailureTime(e.getFailureTime());
        m.setEventResult(e.getEventResult());
        m.setCreatedAt(e.getCreatedAt());
        return m;
    }

    private static FaultLogModel toFaultLogModel(JobFailureHandleLog l) {
        FaultLogModel m = new FaultLogModel();
        m.setId(l.getId());
        m.setFailureEventId(l.getFailureEventId());
        m.setHandleStage(l.getHandleStage());
        m.setHandleTime(l.getHandleTime());
        m.setNewJobId(l.getNewJobId());
        m.setAttemptNo(l.getAttemptNo());
        m.setRestartCountTotal(l.getRestartCountTotal());
        m.setRestartDelaySeconds(l.getRestartDelaySeconds());
        m.setNextRestartTime(l.getNextRestartTime());
        m.setRestartStartTime(l.getRestartStartTime());
        m.setRestartEndTime(l.getRestartEndTime());
        return m;
    }

    // ==================== Config Name Lookups ====================

    static List<String> splitDataSourceIds(String raw) {
        if (raw == null || raw.isEmpty()) {
            return Collections.emptyList();
        }
        List<String> result = new ArrayList<>();
        for (String part : raw.split(",")) {
            String trimmed = part.trim();
            if (!trimmed.isEmpty()) {
                result.add(trimmed);
            }
        }
        return result;
    }

    private Map<String, DataSource> loadDataSourceConfig(Set<String> dataSourceIds) {
        if (dataSourceIds == null || dataSourceIds.isEmpty()) {
            return Collections.emptyMap();
        }
        List<DataSource> sources = dataSourceMapper.selectBatchIds(dataSourceIds);
        Map<String, DataSource> map = new HashMap<>();
        for (DataSource ds : sources) {
            map.put(ds.getDataSourceId(), ds);
        }
        return map;
    }

    private void applyDataSourceContract(FaultProcessDetailVO vo, String dataSourceId) {
        if (dataSourceId == null) {
            vo.setDataSourceOrg(null);
            vo.setDataSourceExists(false);
            vo.setDataSourceActive(null);
            return;
        }
        DataSource dsConfig = dataSourceMapper.selectById(dataSourceId);
        if (dsConfig != null) {
            vo.setDataSourceOrg(dsConfig.getDataSourceOrg());
            vo.setDataSourceExists(true);
            vo.setDataSourceActive(!"0".equals(dsConfig.getFgActive()));
        } else {
            vo.setDataSourceOrg(null);
            vo.setDataSourceExists(false);
            vo.setDataSourceActive(null);
        }
    }

    // ==================== VO Builders ====================

    private FaultProcessDetailVO toDetailVO(FaultProcessGroup group) {
        FaultProcessDetailVO vo = new FaultProcessDetailVO();
        vo.setFaultRootId(group.getFaultRootId());
        vo.setFaultRootIdText(group.getFaultRootId() == null ? null : Long.toString(group.getFaultRootId()));

        // Client/data-source from first event
        if (!group.getAllEvents().isEmpty()) {
            FaultEventModel first = group.getAllEvents().get(0);
            vo.setClientId(first.getClientId());
            vo.setDataSourceId(first.getDataSourceId());
        }

        applyDataSourceContract(vo, vo.getDataSourceId());

        vo.setFirstFailureTime(group.getFirstFailureTime());
        vo.setLastHandleTime(group.getLastHandleTime());
        vo.setRestartCount(group.countRestarts());

        RecordStatus status = assembler.resolveRecordStatus(group);
        vo.setRecordStatus(status.name());
        vo.setRecordStatusLabel(status.getLabel());

        FaultProcessResult result = assembler.resolveResult(group);
        vo.setFaultProcessResult(result.name());
        vo.setFaultProcessResultLabel(result.getLabel());

        // Job chain
        List<JobChainVO> chainVos = new ArrayList<>();
        for (JobChainNode node : group.getJobChain()) {
            JobChainVO cv = new JobChainVO();
            cv.setJobId(node.getJobId());
            cv.setNodeType(node.getNodeType().name());
            cv.setNodeTypeLabel(nodeTypeLabel(node.getNodeType()));
            cv.setHasAnomaly(node.isHasAnomaly());
            chainVos.add(cv);
        }
        vo.setJobChain(chainVos);

        // Main chain events
        List<EventCardVO> mainCards = new ArrayList<>();
        for (FaultEventModel e : group.getMainChainEvents()) {
            mainCards.add(toEventCard(e));
        }
        vo.setMainChainEvents(mainCards);

        // Excluded events
        List<EventCardVO> excludedCards = new ArrayList<>();
        for (FaultEventModel e : group.getExcludedEvents()) {
            excludedCards.add(toEventCard(e));
        }
        vo.setExcludedEvents(excludedCards);

        // Timeline
        List<HandleTimelineVO> timeline = new ArrayList<>();
        for (FaultLogModel l : group.getAllLogs()) {
            HandleTimelineVO tv = new HandleTimelineVO();
            tv.setLogId(l.getId());
            tv.setEventId(l.getFailureEventId());
            tv.setHandleStage(l.getHandleStage());
            tv.setHandleTime(l.getHandleTime());
            tv.setAttemptNo(l.getAttemptNo());
            tv.setNewJobId(l.getNewJobId());
            timeline.add(tv);
        }
        vo.setHandleTimeline(timeline);

        // Anomalies
        List<AnomalyVO> anomalyVos = new ArrayList<>();
        for (AnomalyInfo a : group.getAnomalies()) {
            AnomalyVO av = new AnomalyVO();
            av.setType(a.getType().name());
            av.setTypeLabel(a.getType().getLabel());
            av.setDescription(a.getDescription());
            av.setInvolvedEventIds(a.getInvolvedEventIds());
            anomalyVos.add(av);
        }
        vo.setAnomalies(anomalyVos);

        return vo;
    }

    private FaultProcessSummaryVO toSummaryVO(FaultProcessGroup group) {
        FaultProcessSummaryVO vo = new FaultProcessSummaryVO();
        vo.setFaultRootId(group.getFaultRootId());
        vo.setStartTime(group.getFirstFailureTime());
        vo.setLastRecordTime(group.getLastHandleTime());

        // Start failed job ID from first main-chain event
        if (!group.getMainChainEvents().isEmpty()) {
            vo.setStartFailedJobId(group.getMainChainEvents().get(0).getFailedJobId());
        }

        // Last submitted job ID from the latest NEW_JOB_SUBMIT_SUCCEEDED log
        String lastSubmitted = null;
        for (int i = group.getAllLogs().size() - 1; i >= 0; i--) {
            FaultLogModel l = group.getAllLogs().get(i);
            if (l.isSubmitSucceeded() && l.hasNewJobId()) {
                lastSubmitted = l.getNewJobId();
                break;
            }
        }
        vo.setLastSubmittedJobId(lastSubmitted != null ? lastSubmitted
                : (!group.getMainChainEvents().isEmpty()
                    ? group.getMainChainEvents().get(group.getMainChainEvents().size() - 1).getFailedJobId()
                    : ""));

        vo.setMainChainEventCount(group.countMainChainEvents());
        vo.setRestartCount(group.countRestarts());

        RecordStatus status = assembler.resolveRecordStatus(group);
        vo.setRecordStatus(status.name());
        vo.setRecordStatusLabel(status.getLabel());

        FaultProcessResult result = assembler.resolveResult(group);
        vo.setFaultProcessResult(result.name());
        vo.setFaultProcessResultLabel(result.getLabel());

        vo.setHasAnomalies(group.hasAnomalies());
        return vo;
    }

    private EventCardVO toEventCard(FaultEventModel e) {
        EventCardVO vo = new EventCardVO();
        vo.setEventId(e.getId());
        vo.setFailedJobId(e.getFailedJobId());
        vo.setFailureTime(e.getFailureTime());
        vo.setEventResult(e.getEventResult());
        EventValidity validity = EventValidity.fromEventResult(e.getEventResult());
        vo.setValidity(validity.name());
        vo.setValidityLabel(validity.getLabel());
        vo.setHasDuplicateIgnoredLog(e.isHasDuplicateIgnoredLog());
        return vo;
    }

    private static String nodeTypeLabel(JobChainNode.ChainNodeType nodeType) {
        switch (nodeType) {
            case INITIAL: return "初始Job";
            case INTERMEDIATE: return "中间Job";
            case CURRENT: return "当前Job";
            case FINAL: return "最终Job";
            default: return nodeType.name();
        }
    }

    private static final class ClientDataSource {
        private final String clientId;
        private final String clientDesc;
        private final String dataSourceId;

        ClientDataSource(String clientId, String clientDesc, String dataSourceId) {
            this.clientId = clientId;
            this.clientDesc = clientDesc;
            this.dataSourceId = dataSourceId;
        }
    }
}
