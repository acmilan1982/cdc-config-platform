package com.bsoft.cdcconfig.monitor.jobfailure.algorithm;

import com.bsoft.cdcconfig.monitor.jobfailure.enums.FaultProcessResult;
import com.bsoft.cdcconfig.monitor.jobfailure.enums.RecordStatus;
import org.junit.jupiter.api.Test;

import java.util.Arrays;
import java.util.Collections;
import java.util.List;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertNotNull;
import static org.junit.jupiter.api.Assertions.assertTrue;

class FaultProcessAssemblerTest {

    private final FaultProcessAssembler assembler = new FaultProcessAssembler();

    @Test
    void realWorldScenario_singleRecovery() {
        // Replicate the real dev database scenario:
        // One event (ACCEPTED), 5 logs from RECEIVED → STABLE_CHECK_PASSED
        FaultEventModel e1 = TestDataFactory.event(1L, TestDataFactory.JOB_A, TestDataFactory.T0, "ACCEPTED");

        FaultLogModel l1 = TestDataFactory.logWithAttempt(101L, 1L, "JOB_FAILURE_RECEIVED",
                TestDataFactory.T1, null, 0);
        FaultLogModel l2 = TestDataFactory.logWithAttempt(102L, 1L, "RESTART_SCHEDULED",
                TestDataFactory.T1, null, 1);
        FaultLogModel l3 = TestDataFactory.logWithAttempt(103L, 1L, "RESTART_STARTED",
                TestDataFactory.T2, null, 1);
        FaultLogModel l4 = TestDataFactory.logWithAttempt(104L, 1L, "NEW_JOB_SUBMIT_SUCCEEDED",
                TestDataFactory.T3, TestDataFactory.JOB_B, 1);
        FaultLogModel l5 = TestDataFactory.logWithAttempt(105L, 1L, "STABLE_CHECK_PASSED",
                TestDataFactory.T4, TestDataFactory.JOB_B, 1);

        List<FaultProcessGroup> groups = assembler.assemble(
                Collections.singletonList(e1),
                Arrays.asList(l1, l2, l3, l4, l5));

        assertEquals(1, groups.size());
        FaultProcessGroup group = groups.get(0);

        assertNotNull(group.getFaultRootId());
        assertEquals(1, group.getMainChainEvents().size());
        assertEquals(5, group.getAllLogs().size());
        assertFalse(group.hasAnomalies());
        assertEquals(1, group.countRestarts(), "Should count exactly 1 RESTART_STARTED");
        assertEquals(1, group.countMainChainEvents());

        RecordStatus status = assembler.resolveRecordStatus(group);
        assertEquals(RecordStatus.RECOVERY_RECORDED, status);

        FaultProcessResult result = assembler.resolveResult(group);
        assertEquals(FaultProcessResult.RECOVERY_RECORDED, result);
    }

    @Test
    void multiEventChain_withRecovery() {
        FaultEventModel e1 = TestDataFactory.event(1L, TestDataFactory.JOB_A, TestDataFactory.T0, "ACCEPTED");
        FaultLogModel l1 = TestDataFactory.log(101L, 1L, "NEW_JOB_SUBMIT_SUCCEEDED", TestDataFactory.T3, TestDataFactory.JOB_B);
        FaultLogModel l1r = TestDataFactory.log(102L, 1L, "RESTART_STARTED", TestDataFactory.T2, null);

        FaultEventModel e2 = TestDataFactory.event(2L, TestDataFactory.JOB_B,
                TestDataFactory.T4.plusHours(1), "ACCEPTED");
        FaultLogModel l2 = TestDataFactory.log(201L, 2L, "STABLE_CHECK_PASSED",
                TestDataFactory.T4.plusHours(1).plusMinutes(5), TestDataFactory.JOB_C);
        FaultLogModel l2r = TestDataFactory.log(202L, 2L, "RESTART_STARTED",
                TestDataFactory.T4.plusHours(1).plusSeconds(30), null);

        List<FaultProcessGroup> groups = assembler.assemble(
                Arrays.asList(e1, e2),
                Arrays.asList(l1, l1r, l2, l2r));

        assertEquals(1, groups.size());
        FaultProcessGroup group = groups.get(0);

        assertEquals(2, group.getMainChainEvents().size());
        assertEquals(2, group.countRestarts(), "Should count 2 RESTART_STARTED across two events");
        assertEquals(RecordStatus.RECOVERY_RECORDED, assembler.resolveRecordStatus(group));
    }

    @Test
    void notClosed_noStableCheck() {
        FaultEventModel e1 = TestDataFactory.event(1L, TestDataFactory.JOB_A, TestDataFactory.T0, "ACCEPTED");
        // Only up to submit_succeeded, no stable check
        FaultLogModel l1 = TestDataFactory.log(101L, 1L, "NEW_JOB_SUBMIT_SUCCEEDED", TestDataFactory.T3, TestDataFactory.JOB_B);

        List<FaultProcessGroup> groups = assembler.assemble(
                Collections.singletonList(e1), Collections.singletonList(l1));

        assertEquals(1, groups.size());
        assertEquals(RecordStatus.STABILITY_OBSERVING, assembler.resolveRecordStatus(groups.get(0)));
        assertEquals(FaultProcessResult.NOT_CLOSED, assembler.resolveResult(groups.get(0)));
    }

    @Test
    void invalidEventExcluded_butPresentInResult() {
        FaultEventModel valid = TestDataFactory.event(1L, TestDataFactory.JOB_A, TestDataFactory.T0, "ACCEPTED");
        FaultEventModel invalid = TestDataFactory.event(2L, TestDataFactory.JOB_B,
                TestDataFactory.T0.plusMinutes(1), "IGNORED_INVALID");

        FaultLogModel l1 = TestDataFactory.log(101L, 1L, "JOB_FAILURE_RECEIVED", TestDataFactory.T1, null);
        FaultLogModel l2 = TestDataFactory.log(201L, 2L, "JOB_FAILURE_IGNORED_INVALID", TestDataFactory.T1.plusMinutes(1), null);

        List<FaultProcessGroup> groups = assembler.assemble(
                Arrays.asList(valid, invalid), Arrays.asList(l1, l2));

        assertEquals(1, groups.size()); // Only valid is in main chain
        assertEquals(1, groups.get(0).getMainChainEvents().size());
    }

    @Test
    void restartCount_correctlyUsesOnlyRestartStarted() {
        // TASK 046 spec: restart count = COUNT(RESTART_STARTED) only
        FaultEventModel e1 = TestDataFactory.event(1L, TestDataFactory.JOB_A, TestDataFactory.T0, "ACCEPTED");

        FaultLogModel l1 = TestDataFactory.log(101L, 1L, "RESTART_SCHEDULED", TestDataFactory.T1, null);
        l1.setAttemptNo(5);
        l1.setRestartCountTotal(100L);

        FaultLogModel l2 = TestDataFactory.log(102L, 1L, "RESTART_STARTED", TestDataFactory.T2, null);

        FaultLogModel l3 = TestDataFactory.log(103L, 1L, "STABLE_CHECK_PASSED", TestDataFactory.T4, TestDataFactory.JOB_B);
        l3.setRestartCountTotal(101L);

        List<FaultProcessGroup> groups = assembler.assemble(
                Collections.singletonList(e1), Arrays.asList(l1, l2, l3));

        assertEquals(1, groups.get(0).countRestarts(),
                "Should count only RESTART_STARTED (1), not RESTART_COUNT_TOTAL (101) or ATTEMPT_NO (5)");
    }
}
