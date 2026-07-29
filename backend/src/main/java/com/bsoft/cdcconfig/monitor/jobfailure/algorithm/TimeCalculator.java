package com.bsoft.cdcconfig.monitor.jobfailure.algorithm;

import java.time.Duration;
import java.time.LocalDateTime;

/**
 * Time calculation utilities for fault process display.
 */
public final class TimeCalculator {

    private TimeCalculator() {}

    /**
     * Calculate duration between two times. Returns null if either is null or result is negative.
     */
    public static Duration duration(LocalDateTime from, LocalDateTime to) {
        if (from == null || to == null) return null;
        if (to.isBefore(from)) return null;
        return Duration.between(from, to);
    }

    /**
     * Calculate the recovery time from a fault process.
     * Recovery time = HANDLE_TIME of the STABLE_CHECK_PASSED log.
     */
    public static LocalDateTime recoveryTime(FaultProcessGroup group) {
        if (group == null || group.getAllLogs() == null) return null;
        for (int i = group.getAllLogs().size() - 1; i >= 0; i--) {
            FaultLogModel log = group.getAllLogs().get(i);
            if (log.isStableCheckPassed() && log.getHandleTime() != null) {
                return log.getHandleTime();
            }
        }
        return null;
    }

    /**
     * Calculate fault process duration.
     * If recovered: recoveryTime - firstFailureTime
     * If not closed: NOW - firstFailureTime (for frontend "ongoing" display)
     */
    public static Duration faultDuration(FaultProcessGroup group, boolean isRecovered) {
        if (group == null) return null;
        LocalDateTime firstFailure = group.getFirstFailureTime();
        if (firstFailure == null) return null;

        if (isRecovered) {
            LocalDateTime recovery = recoveryTime(group);
            return duration(firstFailure, recovery);
        } else {
            return duration(firstFailure, LocalDateTime.now());
        }
    }
}
