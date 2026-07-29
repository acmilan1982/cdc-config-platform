package com.bsoft.cdcconfig.monitor.jobfailure.algorithm;

import com.bsoft.cdcconfig.monitor.jobfailure.enums.AnomalyType;

import java.util.ArrayList;
import java.util.HashMap;
import java.util.HashSet;
import java.util.List;
import java.util.Map;
import java.util.Set;

/**
 * Detects structural anomalies in a fault process chain.
 */
public class AnomalyDetector {

    public List<AnomalyInfo> detect(List<FaultEventModel> events, List<FaultLogModel> logs) {
        List<AnomalyInfo> anomalies = new ArrayList<>();
        if (events == null || events.isEmpty()) return anomalies;
        List<FaultLogModel> safeLogs = logs != null ? logs : new ArrayList<>();

        // Build: eventId → list of NEW_JOB_IDs this event produced
        Map<Long, List<String>> eventNewJobIds = new HashMap<>();
        for (FaultLogModel log : safeLogs) {
            if (log.getNewJobId() != null && !log.getNewJobId().isEmpty() && log.getFailureEventId() != null) {
                eventNewJobIds.computeIfAbsent(log.getFailureEventId(), k -> new ArrayList<>()).add(log.getNewJobId());
            }
        }

        // FORK: a NEW_JOB_ID from one event matches as FAILED_JOB_ID in 2+ DIFFERENT subsequent events
        // Build: NEW_JOB_ID → set of event IDs whose FAILED_JOB_ID == this NEW_JOB_ID
        Map<String, Set<Long>> newJobIdToTargets = new HashMap<>();
        for (FaultEventModel event : events) {
            String failedJobId = event.getFailedJobId();
            if (failedJobId != null && !failedJobId.isEmpty()) {
                newJobIdToTargets.computeIfAbsent(failedJobId, k -> new HashSet<>()).add(event.getId());
            }
        }
        for (Map.Entry<String, Set<Long>> entry : newJobIdToTargets.entrySet()) {
            if (entry.getValue().size() >= 2) {
                AnomalyInfo a = new AnomalyInfo(AnomalyType.FORK,
                        "新Job ID " + truncate(entry.getKey()) + " 匹配到 " + entry.getValue().size() + " 个后续失败事件");
                a.getInvolvedEventIds().addAll(entry.getValue());
                anomalies.add(a);
            }
        }

        // MULTI_PARENT: a FAILED_JOB_ID is claimed as NEW_JOB_ID by 2+ DIFFERENT events
        // Build: FAILED_JOB_ID (=some NEW_JOB_ID value) → set of source event IDs that claimed it
        // A FAILED_JOB_ID of event X appears as NEW_JOB_ID in logs of events A and B → multi-parent for X
        Map<String, Set<Long>> failedJobIdClaimedBy = new HashMap<>();
        for (Map.Entry<Long, List<String>> entry : eventNewJobIds.entrySet()) {
            Long sourceEventId = entry.getKey();
            for (String newJobId : entry.getValue()) {
                failedJobIdClaimedBy.computeIfAbsent(newJobId, k -> new HashSet<>()).add(sourceEventId);
            }
        }
        for (Map.Entry<String, Set<Long>> entry : failedJobIdClaimedBy.entrySet()) {
            if (entry.getValue().size() >= 2) {
                AnomalyInfo a = new AnomalyInfo(AnomalyType.MULTI_PARENT,
                        "Job ID " + truncate(entry.getKey()) + " 被 " + entry.getValue().size() + " 个不同事件作为NEW_JOB_ID输出");
                a.getInvolvedEventIds().addAll(entry.getValue());
                anomalies.add(a);
            }
        }

        // DUPLICATE_EDGE: same (FAILED_JOB_ID, NEW_JOB_ID) pair from DIFFERENT events
        Map<String, Set<Long>> edgeEventSources = new HashMap<>();
        for (Map.Entry<Long, List<String>> entry : eventNewJobIds.entrySet()) {
            Long eventId = entry.getKey();
            // Find this event's FAILED_JOB_ID
            String failedJobId = null;
            for (FaultEventModel ev : events) {
                if (ev.getId().equals(eventId)) {
                    failedJobId = ev.getFailedJobId();
                    break;
                }
            }
            for (String newJobId : entry.getValue()) {
                String edgeKey = failedJobId + "->" + newJobId;
                edgeEventSources.computeIfAbsent(edgeKey, k -> new HashSet<>()).add(eventId);
            }
        }
        for (Map.Entry<String, Set<Long>> entry : edgeEventSources.entrySet()) {
            if (entry.getValue().size() > 1) {
                AnomalyInfo a = new AnomalyInfo(AnomalyType.DUPLICATE_EDGE,
                        "边 " + entry.getKey() + " 来自 " + entry.getValue().size() + " 个不同事件");
                a.getInvolvedEventIds().addAll(entry.getValue());
                anomalies.add(a);
            }
        }

        // BROKEN_CHAIN: non-first event's FAILED_JOB_ID not in any predecessor's NEW_JOB_ID set
        Set<String> allNewJobIds = new HashSet<>();
        for (List<String> ids : eventNewJobIds.values()) {
            allNewJobIds.addAll(ids);
        }
        for (int i = 1; i < events.size(); i++) {
            FaultEventModel event = events.get(i);
            String failedJobId = event.getFailedJobId();
            if (failedJobId != null && !failedJobId.isEmpty() && !allNewJobIds.contains(failedJobId)) {
                // Only flag if there ARE predecessors with NEW_JOB_IDs (otherwise this might be a separate root)
                if (!allNewJobIds.isEmpty()) {
                    AnomalyInfo a = new AnomalyInfo(AnomalyType.BROKEN_CHAIN,
                            "事件 " + event.getId() + " 的 FAILED_JOB_ID " + truncate(failedJobId)
                                    + " 未匹配到任何前序事件的 NEW_JOB_ID");
                    a.getInvolvedEventIds().add(event.getId());
                    anomalies.add(a);
                }
            }
        }

        // LOOP: a NEW_JOB_ID from one event appears as NEW_JOB_ID from a DIFFERENT event
        // (same NEW_JOB_ID from different source events, excluding same-event duplicates)
        Map<String, Set<Long>> newJobIdSourceEvents = new HashMap<>();
        for (Map.Entry<Long, List<String>> entry : eventNewJobIds.entrySet()) {
            for (String newJobId : entry.getValue()) {
                newJobIdSourceEvents.computeIfAbsent(newJobId, k -> new HashSet<>()).add(entry.getKey());
            }
        }
        for (Map.Entry<String, Set<Long>> entry : newJobIdSourceEvents.entrySet()) {
            if (entry.getValue().size() >= 2) {
                AnomalyInfo a = new AnomalyInfo(AnomalyType.LOOP,
                        "Job ID " + truncate(entry.getKey()) + " 被 " + entry.getValue().size() + " 个不同事件作为NEW_JOB_ID输出，可能形成环");
                a.getInvolvedEventIds().addAll(entry.getValue());
                anomalies.add(a);
            }
        }

        return anomalies;
    }

    private static String truncate(String s) {
        if (s == null) return "null";
        if (s.length() <= 16) return s;
        return s.substring(0, 8) + "..." + s.substring(s.length() - 8);
    }
}
