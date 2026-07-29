package com.bsoft.cdcconfig.monitor.jobfailure.algorithm;

import java.util.ArrayList;
import java.util.Collections;
import java.util.Comparator;
import java.util.HashMap;
import java.util.HashSet;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.Set;

/**
 * Groups events into fault processes via BFS over NEW_JOB_ID → FAILED_JOB_ID edges.
 *
 * Two events belong to the same fault process if:
 *   Event-A has a log with NEW_JOB_ID=X
 *   Event-B has FAILED_JOB_ID=X
 *
 * Edge direction: A → B (B "continues" the chain started by A).
 */
public class FaultProcessGrouper {

    /**
     * Group main-chain events into fault processes.
     *
     * @param events main-chain events for one logical job, sorted by FAILURE_TIME ASC
     * @param logs   all logs for these events
     * @return list of fault process groups, sorted by first failure time ASC
     */
    public List<FaultProcessGroup> group(List<FaultEventModel> events, List<FaultLogModel> logs) {
        if (events == null || events.isEmpty()) {
            return Collections.emptyList();
        }

        List<FaultLogModel> safeLogs = logs != null ? logs : Collections.emptyList();

        // Build NEW_JOB_ID → list of Event IDs (edge source)
        Map<String, List<Long>> newJobIdToEventIds = new LinkedHashMap<>();
        for (FaultLogModel log : safeLogs) {
            if (log.getNewJobId() != null && !log.getNewJobId().isEmpty()
                    && log.getFailureEventId() != null) {
                newJobIdToEventIds
                        .computeIfAbsent(log.getNewJobId(), k -> new ArrayList<>())
                        .add(log.getFailureEventId());
            }
        }

        // Build Event ID → Event index
        Map<Long, FaultEventModel> eventById = new LinkedHashMap<>();
        for (FaultEventModel e : events) {
            eventById.put(e.getId(), e);
        }

        // Build adjacency list: event → next events
        // Edge: if event's FAILED_JOB_ID appears as NEW_JOB_ID in another event's logs,
        // that other event is a successor
        Map<Long, List<Long>> successors = new HashMap<>();
        for (FaultEventModel e : events) {
            String failedJobId = e.getFailedJobId();
            if (failedJobId != null && !failedJobId.isEmpty()) {
                List<Long> targetEventIds = newJobIdToEventIds.get(failedJobId);
                if (targetEventIds != null && !targetEventIds.isEmpty()) {
                    successors.put(e.getId(), new ArrayList<>(targetEventIds));
                }
            }
        }

        // Also build reverse: predecessors
        Map<Long, List<Long>> predecessors = new HashMap<>();
        for (Map.Entry<Long, List<Long>> entry : successors.entrySet()) {
            Long fromId = entry.getKey();
            for (Long toId : entry.getValue()) {
                predecessors.computeIfAbsent(toId, k -> new ArrayList<>()).add(fromId);
            }
        }

        // BFS to find connected components
        Set<Long> visited = new HashSet<>();
        List<List<Long>> components = new ArrayList<>();

        // Start from root events (those with no predecessor)
        for (FaultEventModel e : events) {
            if (visited.contains(e.getId())) continue;
            if (predecessors.containsKey(e.getId())) continue; // not a root

            List<Long> component = new ArrayList<>();
            bfs(e.getId(), successors, visited, component);
            components.add(component);
        }

        // Any remaining unvisited events (should not happen in clean data, but handle gracefully)
        for (FaultEventModel e : events) {
            if (!visited.contains(e.getId())) {
                List<Long> component = new ArrayList<>();
                bfs(e.getId(), successors, visited, component);
                components.add(component);
            }
        }

        // Build FaultProcessGroup for each component
        List<FaultProcessGroup> groups = new ArrayList<>();
        for (List<Long> component : components) {
            FaultProcessGroup group = new FaultProcessGroup();

            List<FaultEventModel> groupedEvents = new ArrayList<>();
            for (Long id : component) {
                FaultEventModel ev = eventById.get(id);
                if (ev != null) groupedEvents.add(ev);
            }
            groupedEvents.sort(Comparator.comparing(FaultEventModel::getFailureTime,
                    Comparator.nullsLast(Comparator.naturalOrder())));

            // faultRootId = first event ID
            if (!groupedEvents.isEmpty()) {
                group.setFaultRootId(groupedEvents.get(0).getId());
            }

            group.setMainChainEvents(groupedEvents);
            group.setAllEvents(new ArrayList<>(groupedEvents));
            groups.add(group);
        }

        // Sort groups by first failure time ASC
        groups.sort(Comparator.comparing(g -> {
            if (g.getAllEvents().isEmpty()) return null;
            return g.getAllEvents().get(0).getFailureTime();
        }, Comparator.nullsLast(Comparator.naturalOrder())));

        return groups;
    }

    private void bfs(Long startId, Map<Long, List<Long>> successors,
                     Set<Long> visited, List<Long> component) {
        List<Long> queue = new ArrayList<>();
        queue.add(startId);
        visited.add(startId);

        int head = 0;
        while (head < queue.size()) {
            Long currentId = queue.get(head++);
            component.add(currentId);

            List<Long> nextIds = successors.get(currentId);
            if (nextIds != null) {
                for (Long nextId : nextIds) {
                    if (!visited.contains(nextId)) {
                        visited.add(nextId);
                        queue.add(nextId);
                    }
                }
            }
        }
    }
}
