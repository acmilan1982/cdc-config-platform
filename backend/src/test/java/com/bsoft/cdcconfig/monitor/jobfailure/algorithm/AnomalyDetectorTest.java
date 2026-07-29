package com.bsoft.cdcconfig.monitor.jobfailure.algorithm;

import com.bsoft.cdcconfig.monitor.jobfailure.enums.AnomalyType;
import org.junit.jupiter.api.Test;

import java.util.Arrays;
import java.util.Collections;
import java.util.List;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertTrue;

class AnomalyDetectorTest {

    private final AnomalyDetector detector = new AnomalyDetector();

    @Test
    void cleanChain_shouldHaveNoAnomalies() {
        FaultEventModel e1 = TestDataFactory.event(1L, TestDataFactory.JOB_A, TestDataFactory.T0, "ACCEPTED");
        FaultLogModel l1 = TestDataFactory.log(101L, 1L, "NEW_JOB_SUBMIT_SUCCEEDED", TestDataFactory.T3, TestDataFactory.JOB_B);
        FaultLogModel l2 = TestDataFactory.log(102L, 1L, "STABLE_CHECK_PASSED", TestDataFactory.T4, TestDataFactory.JOB_B);

        List<AnomalyInfo> anomalies = detector.detect(
                Collections.singletonList(e1), Arrays.asList(l1, l2));

        assertTrue(anomalies.isEmpty());
    }

    @Test
    void fork_shouldBeDetected() {
        // Event1's NEW_JOB_ID=JOB_B → matches FAILED_JOB_ID of BOTH Event2 AND Event3 → fork
        FaultEventModel e1 = TestDataFactory.event(1L, TestDataFactory.JOB_A, TestDataFactory.T0, "ACCEPTED");
        FaultLogModel l1 = TestDataFactory.log(101L, 1L, "NEW_JOB_SUBMIT_SUCCEEDED", TestDataFactory.T3, TestDataFactory.JOB_B);

        FaultEventModel e2 = TestDataFactory.event(2L, TestDataFactory.JOB_B,
                TestDataFactory.T0.plusMinutes(30), "ACCEPTED");
        FaultLogModel l2 = TestDataFactory.log(201L, 2L, "JOB_FAILURE_RECEIVED", TestDataFactory.T0.plusMinutes(31), null);

        FaultEventModel e3 = TestDataFactory.event(3L, TestDataFactory.JOB_B,
                TestDataFactory.T0.plusMinutes(32), "ACCEPTED");
        FaultLogModel l3 = TestDataFactory.log(301L, 3L, "JOB_FAILURE_RECEIVED", TestDataFactory.T0.plusMinutes(33), null);

        List<AnomalyInfo> anomalies = detector.detect(Arrays.asList(e1, e2, e3), Arrays.asList(l1, l2, l3));

        boolean hasFork = anomalies.stream().anyMatch(a -> a.getType() == AnomalyType.FORK);
        assertTrue(hasFork, "JOB_B matching two events' FAILED_JOB_ID should be detected as fork");
    }

    @Test
    void multiParent_shouldBeDetected() {
        // Two events whose failed_job_id=X is claimed as NEW_JOB_ID by different predecessor events
        FaultEventModel e1 = TestDataFactory.event(1L, TestDataFactory.JOB_A, TestDataFactory.T0, "ACCEPTED");
        FaultLogModel l1 = TestDataFactory.log(101L, 1L, "NEW_JOB_SUBMIT_SUCCEEDED", TestDataFactory.T3, TestDataFactory.JOB_X);

        FaultEventModel e2 = TestDataFactory.event(2L, TestDataFactory.JOB_B, TestDataFactory.T0, "ACCEPTED");
        FaultLogModel l2 = TestDataFactory.log(201L, 2L, "NEW_JOB_SUBMIT_SUCCEEDED",
                TestDataFactory.T3.plusSeconds(1), TestDataFactory.JOB_X);

        // Both events claim their new job is JOB_X → JOB_X has 2 "parents"
        List<AnomalyInfo> anomalies = detector.detect(Arrays.asList(e1, e2), Arrays.asList(l1, l2));

        // Should detect multi-parent for JOB_X
        boolean hasMultiParent = anomalies.stream()
                .anyMatch(a -> a.getType() == AnomalyType.MULTI_PARENT);
        assertTrue(hasMultiParent);
    }

    @Test
    void duplicateEdge_shouldBeDetected() {
        // Same (FAILED_JOB_ID → NEW_JOB_ID) pair from DIFFERENT events
        FaultEventModel e1 = TestDataFactory.event(1L, TestDataFactory.JOB_A, TestDataFactory.T0, "ACCEPTED");
        FaultLogModel l1 = TestDataFactory.log(101L, 1L, "NEW_JOB_SUBMIT_SUCCEEDED", TestDataFactory.T3, TestDataFactory.JOB_B);

        FaultEventModel e2 = TestDataFactory.event(2L, TestDataFactory.JOB_A,
                TestDataFactory.T0.plusHours(1), "ACCEPTED");
        FaultLogModel l2 = TestDataFactory.log(201L, 2L, "NEW_JOB_SUBMIT_SUCCEEDED",
                TestDataFactory.T3.plusHours(1), TestDataFactory.JOB_B);

        List<AnomalyInfo> anomalies = detector.detect(Arrays.asList(e1, e2), Arrays.asList(l1, l2));

        // Both events produce the same edge JOB_A → JOB_B → duplicate edge
        boolean hasDuplicateEdge = anomalies.stream()
                .anyMatch(a -> a.getType() == AnomalyType.DUPLICATE_EDGE);
        assertTrue(hasDuplicateEdge, "Same (FAILED_JOB_ID,NEW_JOB_ID) from different events should be detected");
    }

    @Test
    void emptyEvents_shouldReturnEmpty() {
        assertTrue(detector.detect(Collections.emptyList(), Collections.emptyList()).isEmpty());
    }

    @Test
    void brokenChain_shouldBeDetected() {
        FaultEventModel e1 = TestDataFactory.event(1L, TestDataFactory.JOB_A, TestDataFactory.T0, "ACCEPTED");
        FaultLogModel l1 = TestDataFactory.log(101L, 1L, "STABLE_CHECK_PASSED", TestDataFactory.T4, TestDataFactory.JOB_B);

        FaultEventModel e2 = TestDataFactory.event(2L, TestDataFactory.JOB_C,
                TestDataFactory.T4.plusHours(1), "ACCEPTED");

        List<AnomalyInfo> anomalies = detector.detect(Arrays.asList(e1, e2), Collections.singletonList(l1));

        boolean hasBrokenChain = anomalies.stream()
                .anyMatch(a -> a.getType() == AnomalyType.BROKEN_CHAIN);
        assertTrue(hasBrokenChain, "JOB_C not matching any NEW_JOB_ID should be detected as broken chain");
    }
}
