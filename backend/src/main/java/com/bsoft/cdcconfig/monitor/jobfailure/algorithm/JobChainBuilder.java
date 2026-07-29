package com.bsoft.cdcconfig.monitor.jobfailure.algorithm;

import java.util.ArrayList;
import java.util.Collections;
import java.util.LinkedHashSet;
import java.util.List;
import java.util.Set;

/**
 * Builds the physical Job evolution chain from events and logs.
 * Chain order follows chronological discovery: FAILED_JOB_ID → NEW_JOB_ID → next FAILED_JOB_ID.
 */
public class JobChainBuilder {

    /**
     * Build the physical Job chain for a fault process.
     *
     * @param events main-chain events, sorted by FAILURE_TIME ASC
     * @param logs   all logs for these events, sorted by (HANDLE_TIME ASC, ID ASC)
     * @return ordered list of JobChainNode
     */
    public List<JobChainNode> build(List<FaultEventModel> events, List<FaultLogModel> logs) {
        if (events == null || events.isEmpty()) {
            return Collections.emptyList();
        }

        LinkedHashSet<String> orderedJobIds = new LinkedHashSet<>();

        // Process events in chronological order
        for (FaultEventModel event : events) {
            if (event.getFailedJobId() != null && !event.getFailedJobId().isEmpty()) {
                orderedJobIds.add(event.getFailedJobId());
            }

            if (logs != null) {
                // Find logs for this event, in chronological order
                for (FaultLogModel log : logs) {
                    if (event.getId().equals(log.getFailureEventId())) {
                        if (log.hasNewJobId()) {
                            orderedJobIds.add(log.getNewJobId());
                        }
                    }
                }
            }
        }

        if (orderedJobIds.isEmpty()) {
            return Collections.emptyList();
        }

        // Determine the "current/final" job ID
        String finalJobId = null;
        if (logs != null) {
            // Last NEW_JOB_ID from STABLE_CHECK_PASSED = final recovered job
            for (int i = logs.size() - 1; i >= 0; i--) {
                FaultLogModel log = logs.get(i);
                if (log.isStableCheckPassed() && log.hasNewJobId()) {
                    finalJobId = log.getNewJobId();
                    break;
                }
            }
            // If no STABLE_CHECK_PASSED, take the last NEW_JOB_ID
            if (finalJobId == null) {
                for (int i = logs.size() - 1; i >= 0; i--) {
                    FaultLogModel log = logs.get(i);
                    if (log.hasNewJobId()) {
                        finalJobId = log.getNewJobId();
                        break;
                    }
                }
            }
        }
        // Fallback: last FAILED_JOB_ID
        if (finalJobId == null && !orderedJobIds.isEmpty()) {
            List<String> ids = new ArrayList<>(orderedJobIds);
            finalJobId = ids.get(ids.size() - 1);
        }

        String firstJobId = orderedJobIds.iterator().next();
        List<String> idList = new ArrayList<>(orderedJobIds);

        List<JobChainNode> chain = new ArrayList<>();
        for (int i = 0; i < idList.size(); i++) {
            String jobId = idList.get(i);
            JobChainNode.ChainNodeType nodeType;

            if (idList.size() == 1) {
                // Single node: it's both initial and current
                if (jobId.equals(finalJobId)) {
                    nodeType = JobChainNode.ChainNodeType.CURRENT;
                } else {
                    nodeType = JobChainNode.ChainNodeType.INITIAL;
                }
            } else if (i == 0) {
                nodeType = JobChainNode.ChainNodeType.INITIAL;
            } else if (jobId.equals(finalJobId)) {
                if (i == idList.size() - 1) {
                    nodeType = JobChainNode.ChainNodeType.CURRENT;
                } else {
                    nodeType = JobChainNode.ChainNodeType.CURRENT;
                }
            } else if (i == idList.size() - 1 && !jobId.equals(finalJobId)) {
                nodeType = JobChainNode.ChainNodeType.INTERMEDIATE;
            } else {
                nodeType = JobChainNode.ChainNodeType.INTERMEDIATE;
            }

            chain.add(new JobChainNode(jobId, nodeType));
        }

        return chain;
    }
}
