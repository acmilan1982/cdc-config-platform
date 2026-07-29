package com.bsoft.cdcconfig.monitor.jobfailure.algorithm;

import com.bsoft.cdcconfig.monitor.jobfailure.enums.RecordStatus;
import org.junit.jupiter.api.Test;

import java.util.Arrays;
import java.util.Collections;

import static org.junit.jupiter.api.Assertions.assertEquals;

class RecordStatusResolverTest {

    private final RecordStatusResolver resolver = new RecordStatusResolver();

    @Test
    void recovered_shouldReturnRecoveryRecorded() {
        FaultEventModel e1 = TestDataFactory.event(1L, TestDataFactory.JOB_A, TestDataFactory.T0, "ACCEPTED");
        FaultLogModel l1 = TestDataFactory.log(101L, 1L, "STABLE_CHECK_PASSED", TestDataFactory.T4, TestDataFactory.JOB_B);

        RecordStatus status = resolver.resolve(
                Collections.singletonList(e1), Collections.singletonList(l1), false);

        assertEquals(RecordStatus.RECOVERY_RECORDED, status);
    }

    @Test
    void waitingRestart_shouldReturnWaitingRestart() {
        FaultEventModel e1 = TestDataFactory.event(1L, TestDataFactory.JOB_A, TestDataFactory.T0, "ACCEPTED");
        FaultLogModel l1 = TestDataFactory.log(101L, 1L, "RESTART_SCHEDULED", TestDataFactory.T1, null);

        RecordStatus status = resolver.resolve(
                Collections.singletonList(e1), Collections.singletonList(l1), false);

        assertEquals(RecordStatus.WAITING_RESTART, status);
    }

    @Test
    void restarting_shouldReturnRestarting() {
        FaultEventModel e1 = TestDataFactory.event(1L, TestDataFactory.JOB_A, TestDataFactory.T0, "ACCEPTED");
        FaultLogModel l1 = TestDataFactory.log(101L, 1L, "RESTART_STARTED", TestDataFactory.T2, null);

        RecordStatus status = resolver.resolve(
                Collections.singletonList(e1), Collections.singletonList(l1), false);

        assertEquals(RecordStatus.RESTARTING, status);
    }

    @Test
    void stabilityObserving_shouldReturnStabilityObserving() {
        FaultEventModel e1 = TestDataFactory.event(1L, TestDataFactory.JOB_A, TestDataFactory.T0, "ACCEPTED");
        FaultLogModel l1 = TestDataFactory.log(101L, 1L, "NEW_JOB_SUBMIT_SUCCEEDED", TestDataFactory.T3, TestDataFactory.JOB_B);

        RecordStatus status = resolver.resolve(
                Collections.singletonList(e1), Collections.singletonList(l1), false);

        assertEquals(RecordStatus.STABILITY_OBSERVING, status);
    }

    @Test
    void submitFailed_shouldReturnSubmitFailed() {
        FaultEventModel e1 = TestDataFactory.event(1L, TestDataFactory.JOB_A, TestDataFactory.T0, "ACCEPTED");
        FaultLogModel l1 = TestDataFactory.log(101L, 1L, "NEW_JOB_SUBMIT_FAILED", TestDataFactory.T3, null);

        RecordStatus status = resolver.resolve(
                Collections.singletonList(e1), Collections.singletonList(l1), false);

        assertEquals(RecordStatus.SUBMIT_FAILED, status);
    }

    @Test
    void noLogs_shouldReturnNotClosed() {
        FaultEventModel e1 = TestDataFactory.event(1L, TestDataFactory.JOB_A, TestDataFactory.T0, "ACCEPTED");

        RecordStatus status = resolver.resolve(
                Collections.singletonList(e1), Collections.emptyList(), false);

        assertEquals(RecordStatus.NOT_CLOSED, status);
    }

    @Test
    void missingStableCheck_shouldReturnNotClosed() {
        FaultEventModel e1 = TestDataFactory.event(1L, TestDataFactory.JOB_A, TestDataFactory.T0, "ACCEPTED");
        // Only RECEIVED, no further processing recorded
        FaultLogModel l1 = TestDataFactory.log(101L, 1L, "JOB_FAILURE_RECEIVED", TestDataFactory.T1, null);

        RecordStatus status = resolver.resolve(
                Collections.singletonList(e1), Collections.singletonList(l1), false);

        assertEquals(RecordStatus.NOT_CLOSED, status);
    }

    @Test
    void unknownStage_shouldNotThrow() {
        FaultEventModel e1 = TestDataFactory.event(1L, TestDataFactory.JOB_A, TestDataFactory.T0, "ACCEPTED");
        FaultLogModel l1 = TestDataFactory.log(101L, 1L, "UNKNOWN_STAGE_XYZ", TestDataFactory.T1, null);

        RecordStatus status = resolver.resolve(
                Collections.singletonList(e1), Collections.singletonList(l1), false);

        // Should not throw, should return a valid status
        assertEquals(RecordStatus.NOT_CLOSED, status);
    }

    @Test
    void invalidEvent_shouldReturnIgnored() {
        FaultEventModel e1 = TestDataFactory.event(1L, TestDataFactory.JOB_A, TestDataFactory.T0, "IGNORED_INVALID");

        RecordStatus status = resolver.resolve(
                Collections.singletonList(e1), Collections.emptyList(), false);

        assertEquals(RecordStatus.IGNORED, status);
    }

    @Test
    void restartSkipped_shouldReturnRestartSkipped() {
        FaultEventModel e1 = TestDataFactory.event(1L, TestDataFactory.JOB_A, TestDataFactory.T0, "ACCEPTED");
        FaultLogModel l1 = TestDataFactory.log(101L, 1L, "SCHEDULED_RESTART_SKIPPED", TestDataFactory.T2, null);

        RecordStatus status = resolver.resolve(
                Collections.singletonList(e1), Collections.singletonList(l1), false);

        assertEquals(RecordStatus.RESTART_SKIPPED, status);
    }

    @Test
    void sameSecondLogs_latestById_shouldDetermineStatus() {
        // Two logs at the same HANDLE_TIME, second ID should be treated as latest
        FaultEventModel e1 = TestDataFactory.event(1L, TestDataFactory.JOB_A, TestDataFactory.T0, "ACCEPTED");
        FaultLogModel l1 = TestDataFactory.log(101L, 1L, "RESTART_SCHEDULED", TestDataFactory.T1, null);
        FaultLogModel l2 = TestDataFactory.log(102L, 1L, "RESTART_STARTED", TestDataFactory.T1, null); // same time, higher ID

        RecordStatus status = resolver.resolve(
                Collections.singletonList(e1), Arrays.asList(l1, l2), false);

        // Latest (by ID since same time) is RESTART_STARTED
        assertEquals(RecordStatus.RESTARTING, status);
    }

    @Test
    void hashAnomalies_shouldReturnDataAnomaly() {
        FaultEventModel e1 = TestDataFactory.event(1L, TestDataFactory.JOB_A, TestDataFactory.T0, "ACCEPTED");
        FaultLogModel l1 = TestDataFactory.log(101L, 1L, "JOB_FAILURE_RECEIVED", TestDataFactory.T1, null);

        RecordStatus status = resolver.resolve(
                Collections.singletonList(e1), Collections.singletonList(l1), true);

        assertEquals(RecordStatus.DATA_ANOMALY, status);
    }
}
