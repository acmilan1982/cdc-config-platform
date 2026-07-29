package com.bsoft.cdcconfig.monitor.jobfailure.algorithm;

import com.bsoft.cdcconfig.monitor.jobfailure.enums.FaultProcessResult;
import com.bsoft.cdcconfig.monitor.jobfailure.enums.RecordStatus;

import java.util.ArrayList;
import java.util.Comparator;
import java.util.List;
import java.util.stream.Collectors;

/**
 * Orchestrator that assembles a complete FaultProcessGroup from raw events and logs.
 * Runs the full pipeline: group → filter → chain build → anomaly detect → status resolve.
 */
public class FaultProcessAssembler {

    private final FaultProcessGrouper grouper = new FaultProcessGrouper();
    private final MainChainFilter mainChainFilter = new MainChainFilter();
    private final JobChainBuilder chainBuilder = new JobChainBuilder();
    private final AnomalyDetector anomalyDetector = new AnomalyDetector();
    private final RecordStatusResolver statusResolver = new RecordStatusResolver();
    private final FaultProcessResultResolver resultResolver = new FaultProcessResultResolver();

    /**
     * Assemble complete fault process groups from raw events and logs for one logical job.
     *
     * @param events raw events for the logical job
     * @param logs   raw logs for these events
     * @return list of fully assembled FaultProcessGroup, with logs attached
     */
    public List<FaultProcessGroup> assemble(List<FaultEventModel> events, List<FaultLogModel> logs) {
        if (events == null || events.isEmpty()) {
            return new ArrayList<>();
        }

        List<FaultLogModel> safeLogs = logs != null ? logs : new ArrayList<>();

        // 1. Filter events into main-chain and excluded
        MainChainFilter.FilterResult filterResult = mainChainFilter.filter(events, safeLogs);

        // 2. Group main-chain events into fault processes
        List<FaultProcessGroup> groups = grouper.group(filterResult.getMainChainEvents(), safeLogs);

        // 3. For each group, attach logs, build chain, detect anomalies, resolve status
        for (FaultProcessGroup group : groups) {
            // Attach logs belonging to this group's events
            List<Long> eventIds = group.getAllEvents().stream()
                    .map(FaultEventModel::getId)
                    .collect(Collectors.toList());
            List<FaultLogModel> groupLogs = safeLogs.stream()
                    .filter(l -> eventIds.contains(l.getFailureEventId()))
                    .sorted(Comparator.comparing(FaultLogModel::getHandleTime,
                                    Comparator.nullsLast(Comparator.naturalOrder()))
                            .thenComparing(FaultLogModel::getId,
                                    Comparator.nullsLast(Comparator.naturalOrder())))
                    .collect(Collectors.toList());
            group.setAllLogs(groupLogs);

            // Build job chain
            List<JobChainNode> chain = chainBuilder.build(group.getMainChainEvents(), groupLogs);
            group.setJobChain(chain);

            // Detect anomalies
            List<AnomalyInfo> anomalies = anomalyDetector.detect(group.getMainChainEvents(), groupLogs);
            group.setAnomalies(anomalies);
        }

        return groups;
    }

    public RecordStatus resolveRecordStatus(FaultProcessGroup group) {
        return statusResolver.resolve(group.getMainChainEvents(), group.getAllLogs(), group.hasAnomalies());
    }

    public FaultProcessResult resolveResult(FaultProcessGroup group) {
        return resultResolver.resolve(group.getMainChainEvents(), group.getAllLogs(), group.hasAnomalies());
    }
}
