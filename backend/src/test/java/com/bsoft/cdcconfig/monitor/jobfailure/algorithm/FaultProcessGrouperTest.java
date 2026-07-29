package com.bsoft.cdcconfig.monitor.jobfailure.algorithm;

import org.junit.jupiter.api.Test;

import java.util.Arrays;
import java.util.Collections;
import java.util.List;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertNotNull;
import static org.junit.jupiter.api.Assertions.assertTrue;

class FaultProcessGrouperTest {

    private final FaultProcessGrouper grouper = new FaultProcessGrouper();

    @Test
    void singleEvent_shouldReturnSingleGroup() {
        FaultEventModel e1 = TestDataFactory.event(1L, TestDataFactory.JOB_A, TestDataFactory.T0, "ACCEPTED");
        FaultLogModel l1 = TestDataFactory.log(101L, 1L, "JOB_FAILURE_RECEIVED", TestDataFactory.T1, null);
        FaultLogModel l2 = TestDataFactory.log(102L, 1L, "RESTART_STARTED", TestDataFactory.T2, null);
        FaultLogModel l3 = TestDataFactory.log(103L, 1L, "NEW_JOB_SUBMIT_SUCCEEDED", TestDataFactory.T3, TestDataFactory.JOB_B);
        FaultLogModel l4 = TestDataFactory.log(104L, 1L, "STABLE_CHECK_PASSED", TestDataFactory.T4, TestDataFactory.JOB_B);

        List<FaultProcessGroup> groups = grouper.group(
                Collections.singletonList(e1),
                Arrays.asList(l1, l2, l3, l4));

        assertEquals(1, groups.size());
        assertEquals(1L, groups.get(0).getFaultRootId().longValue());
        assertEquals(1, groups.get(0).getMainChainEvents().size());
    }

    @Test
    void multiEventChain_shouldMergeIntoOneGroup() {
        // Event1: JOB_A fails → restarted as JOB_B
        FaultEventModel e1 = TestDataFactory.event(1L, TestDataFactory.JOB_A, TestDataFactory.T0, "ACCEPTED");
        FaultLogModel l1 = TestDataFactory.log(101L, 1L, "NEW_JOB_SUBMIT_SUCCEEDED", TestDataFactory.T3, TestDataFactory.JOB_B);

        // Event2: JOB_B fails → restarted as JOB_C
        FaultEventModel e2 = TestDataFactory.event(2L, TestDataFactory.JOB_B,
                TestDataFactory.T4.plusHours(1), "ACCEPTED");
        FaultLogModel l2 = TestDataFactory.log(201L, 2L, "NEW_JOB_SUBMIT_SUCCEEDED",
                TestDataFactory.T4.plusHours(1).plusMinutes(1), TestDataFactory.JOB_C);

        // Event3: JOB_C fails → stable recovery as JOB_D
        FaultEventModel e3 = TestDataFactory.event(3L, TestDataFactory.JOB_C,
                TestDataFactory.T4.plusHours(2), "ACCEPTED");
        FaultLogModel l3 = TestDataFactory.log(301L, 3L, "STABLE_CHECK_PASSED",
                TestDataFactory.T4.plusHours(2).plusMinutes(5), TestDataFactory.JOB_D);

        List<FaultEventModel> events = Arrays.asList(e1, e2, e3);
        List<FaultLogModel> logs = Arrays.asList(l1, l2, l3);

        List<FaultProcessGroup> groups = grouper.group(events, logs);

        assertEquals(1, groups.size(), "Three linked events should form one fault process");
        assertEquals(1L, groups.get(0).getFaultRootId().longValue());
        assertEquals(3, groups.get(0).getMainChainEvents().size());
    }

    @Test
    void unrelatedEvents_shouldReturnSeparateGroups() {
        // Two events with no NEW_JOB_ID → FAILED_JOB_ID connection
        FaultEventModel e1 = TestDataFactory.event(1L, TestDataFactory.JOB_A, TestDataFactory.T0, "ACCEPTED");
        FaultLogModel l1 = TestDataFactory.log(101L, 1L, "STABLE_CHECK_PASSED", TestDataFactory.T4, TestDataFactory.JOB_B);

        FaultEventModel e2 = TestDataFactory.event(2L, TestDataFactory.JOB_C,
                TestDataFactory.T4.plusDays(1), "ACCEPTED");

        List<FaultProcessGroup> groups = grouper.group(Arrays.asList(e1, e2), Collections.singletonList(l1));

        assertEquals(2, groups.size(), "Two unrelated events should form two separate groups");
    }

    @Test
    void emptyEvents_shouldReturnEmpty() {
        assertTrue(grouper.group(Collections.emptyList(), Collections.emptyList()).isEmpty());
        assertTrue(grouper.group(null, null).isEmpty());
    }

    @Test
    void groupWithMissingLogs_shouldNotThrow() {
        FaultEventModel e1 = TestDataFactory.event(1L, TestDataFactory.JOB_A, TestDataFactory.T0, "ACCEPTED");

        List<FaultProcessGroup> groups = grouper.group(
                Collections.singletonList(e1), null);

        assertEquals(1, groups.size());
        assertNotNull(groups.get(0).getFaultRootId());
    }

    @Test
    void eventsWithNullNewJobId_shouldBeSeparateGroups() {
        FaultEventModel e1 = TestDataFactory.event(1L, TestDataFactory.JOB_A, TestDataFactory.T0, "ACCEPTED");
        FaultLogModel l1 = TestDataFactory.log(101L, 1L, "JOB_FAILURE_RECEIVED", TestDataFactory.T1, null);

        FaultEventModel e2 = TestDataFactory.event(2L, TestDataFactory.JOB_B,
                TestDataFactory.T0.plusMinutes(30), "ACCEPTED");
        FaultLogModel l2 = TestDataFactory.log(201L, 2L, "JOB_FAILURE_RECEIVED", TestDataFactory.T1.plusMinutes(30), null);

        List<FaultProcessGroup> groups = grouper.group(Arrays.asList(e1, e2), Arrays.asList(l1, l2));

        assertEquals(2, groups.size());
    }
}
