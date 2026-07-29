package com.bsoft.cdcconfig.monitor.jobfailure.algorithm;

import com.bsoft.cdcconfig.monitor.jobfailure.enums.FaultProcessResult;

import java.util.List;

/**
 * Resolves the overall fault process result:
 *   RECOVERY_RECORDED - STABLE_CHECK_PASSED found at end of chain
 *   NOT_CLOSED - no STABLE_CHECK_PASSED, but chain is structurally valid
 *   DATA_ANOMALY - structural anomalies detected
 */
public class FaultProcessResultResolver {

    /**
     * Resolve the result for a fault process.
     *
     * @param events main-chain events
     * @param logs   all logs for the process
     * @param hasAnomalies whether structural anomalies were detected
     */
    public FaultProcessResult resolve(List<FaultEventModel> events, List<FaultLogModel> logs, boolean hasAnomalies) {
        if (hasAnomalies) {
            return FaultProcessResult.DATA_ANOMALY;
        }

        if (logs == null || logs.isEmpty()) {
            return FaultProcessResult.NOT_CLOSED;
        }

        boolean hasStableCheck = false;
        for (FaultLogModel log : logs) {
            if (log.isStableCheckPassed()) {
                hasStableCheck = true;
                break;
            }
        }

        if (hasStableCheck) {
            return FaultProcessResult.RECOVERY_RECORDED;
        }

        return FaultProcessResult.NOT_CLOSED;
    }
}
