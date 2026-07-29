package com.bsoft.cdcconfig.monitor.jobfailure.algorithm;

import com.bsoft.cdcconfig.monitor.jobfailure.enums.RecordStatus;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

import java.util.List;

/**
 * Determines the current record processing status for a fault process
 * based on the latest handle stage from the most recent event's logs.
 */
public class RecordStatusResolver {

    private static final Logger log = LoggerFactory.getLogger(RecordStatusResolver.class);

    /**
     * Resolve the record status for a fault process.
     * The status is based on the latest log entry (by HANDLE_TIME DESC, ID DESC).
     *
     * @param events main-chain events, sorted by FAILURE_TIME ASC
     * @param logs   all logs for the fault process, sorted by (HANDLE_TIME ASC, ID ASC)
     * @param hasAnomalies whether structural anomalies were detected
     */
    public RecordStatus resolve(List<FaultEventModel> events, List<FaultLogModel> logs, boolean hasAnomalies) {
        // Empty or no events
        if (events == null || events.isEmpty()) {
            return RecordStatus.NOT_CLOSED;
        }

        // Check if any event is invalid/stale/duplicate
        for (FaultEventModel e : events) {
            if (e.isInvalid()) return RecordStatus.IGNORED;
            if (e.isStale()) return RecordStatus.IGNORED;
            if (e.isHasDuplicateIgnoredLog()) return RecordStatus.IGNORED;
        }

        // No logs at all
        if (logs == null || logs.isEmpty()) {
            return RecordStatus.NOT_CLOSED;
        }

        // Get the latest log entry (last in sorted list)
        FaultLogModel latestLog = logs.get(logs.size() - 1);

        // Check for STABLE_CHECK_PASSED anywhere in the fault process
        boolean hasStableCheck = false;
        for (FaultLogModel l : logs) {
            if (l.isStableCheckPassed()) {
                hasStableCheck = true;
                break;
            }
        }

        String stage = latestLog.getHandleStage();
        if (stage == null) {
            return hasAnomalies ? RecordStatus.DATA_ANOMALY : RecordStatus.NOT_CLOSED;
        }

        // If structural anomalies exist, override the stage-based status
        if (hasAnomalies) {
            return RecordStatus.DATA_ANOMALY;
        }

        switch (stage) {
            case "STABLE_CHECK_PASSED":
                return RecordStatus.RECOVERY_RECORDED;
            case "RESTART_SCHEDULED":
                return RecordStatus.WAITING_RESTART;
            case "RESTART_STARTED":
                return RecordStatus.RESTARTING;
            case "NEW_JOB_SUBMIT_SUCCEEDED":
                return RecordStatus.STABILITY_OBSERVING;
            case "NEW_JOB_SUBMIT_FAILED":
                return RecordStatus.SUBMIT_FAILED;
            case "SCHEDULED_RESTART_SKIPPED":
                return RecordStatus.RESTART_SKIPPED;
            case "JOB_FAILURE_RECEIVED":
                return hasStableCheck ? RecordStatus.RECOVERY_RECORDED : RecordStatus.NOT_CLOSED;
            case "JOB_FAILURE_IGNORED_INVALID":
            case "JOB_FAILURE_IGNORED_STALE":
            case "DUPLICATED_EVENT_IGNORED":
                return RecordStatus.IGNORED;
            default:
                log.warn("Unknown HANDLE_STAGE: {}, treating as NOT_CLOSED for event group", stage);
                return RecordStatus.NOT_CLOSED;
        }
    }

    /**
     * Resolve status for a single event (used in API-1 summary for individual events).
     */
    public RecordStatus resolveForEvent(FaultEventModel event, List<FaultLogModel> eventLogs) {
        if (event == null) return RecordStatus.NOT_CLOSED;
        if (event.isInvalid() || event.isStale()) return RecordStatus.IGNORED;
        if (event.isHasDuplicateIgnoredLog()) return RecordStatus.IGNORED;

        if (eventLogs == null || eventLogs.isEmpty()) return RecordStatus.NOT_CLOSED;

        FaultLogModel latest = eventLogs.get(eventLogs.size() - 1);
        String stage = latest.getHandleStage();
        if (stage == null) return RecordStatus.NOT_CLOSED;

        switch (stage) {
            case "STABLE_CHECK_PASSED": return RecordStatus.RECOVERY_RECORDED;
            case "RESTART_SCHEDULED": return RecordStatus.WAITING_RESTART;
            case "RESTART_STARTED": return RecordStatus.RESTARTING;
            case "NEW_JOB_SUBMIT_SUCCEEDED": return RecordStatus.STABILITY_OBSERVING;
            case "NEW_JOB_SUBMIT_FAILED": return RecordStatus.SUBMIT_FAILED;
            case "SCHEDULED_RESTART_SKIPPED": return RecordStatus.RESTART_SKIPPED;
            case "JOB_FAILURE_RECEIVED": return RecordStatus.NOT_CLOSED;
            default:
                log.warn("Unknown HANDLE_STAGE: {}", stage);
                return RecordStatus.NOT_CLOSED;
        }
    }
}
