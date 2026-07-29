package com.bsoft.cdcconfig.monitor.jobfailure.algorithm;

import java.util.ArrayList;
import java.util.Collections;
import java.util.List;
import java.util.Set;
import java.util.stream.Collectors;

/**
 * Filters events into main-chain and excluded categories.
 *
 * Main-chain eligible: NOT IGNORED_INVALID, NOT IGNORED_STALE,
 * and NOT associated with any DUPLICATED_EVENT_IGNORED log.
 */
public class MainChainFilter {

    /**
     * Apply main-chain filtering to a list of events and their logs.
     *
     * @param events all events for a logical job, sorted by FAILURE_TIME ASC
     * @param logs   all logs for these events
     * @return FilterResult with main-chain and excluded events
     */
    public FilterResult filter(List<FaultEventModel> events, List<FaultLogModel> logs) {
        if (events == null || events.isEmpty()) {
            return new FilterResult(Collections.emptyList(), Collections.emptyList());
        }

        Set<Long> duplicateIgnoredEventIds = Collections.emptySet();
        if (logs != null && !logs.isEmpty()) {
            duplicateIgnoredEventIds = logs.stream()
                    .filter(FaultLogModel::isDuplicateEventIgnored)
                    .map(FaultLogModel::getFailureEventId)
                    .filter(id -> id != null)
                    .collect(Collectors.toSet());
        }

        for (FaultEventModel event : events) {
            if (duplicateIgnoredEventIds.contains(event.getId())) {
                event.setHasDuplicateIgnoredLog(true);
            }
        }

        List<FaultEventModel> mainChain = new ArrayList<>();
        List<FaultEventModel> excluded = new ArrayList<>();

        for (FaultEventModel event : events) {
            if (event.isMainChainEligible()) {
                mainChain.add(event);
            } else {
                excluded.add(event);
            }
        }

        return new FilterResult(mainChain, excluded);
    }

    public static class FilterResult {
        private final List<FaultEventModel> mainChainEvents;
        private final List<FaultEventModel> excludedEvents;

        public FilterResult(List<FaultEventModel> mainChainEvents, List<FaultEventModel> excludedEvents) {
            this.mainChainEvents = mainChainEvents;
            this.excludedEvents = excludedEvents;
        }

        public List<FaultEventModel> getMainChainEvents() { return mainChainEvents; }
        public List<FaultEventModel> getExcludedEvents() { return excludedEvents; }
    }
}
