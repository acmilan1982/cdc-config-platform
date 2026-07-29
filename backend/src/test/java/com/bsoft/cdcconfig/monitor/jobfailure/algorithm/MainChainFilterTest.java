package com.bsoft.cdcconfig.monitor.jobfailure.algorithm;

import org.junit.jupiter.api.Test;

import java.util.Arrays;
import java.util.Collections;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertTrue;

class MainChainFilterTest {

    private final MainChainFilter filter = new MainChainFilter();

    @Test
    void acceptedEventWithoutDuplicate_shouldBeMainChain() {
        FaultEventModel e = TestDataFactory.event(1L, TestDataFactory.JOB_A, TestDataFactory.T0, "ACCEPTED");

        MainChainFilter.FilterResult result = filter.filter(
                Collections.singletonList(e), Collections.emptyList());

        assertEquals(1, result.getMainChainEvents().size());
        assertEquals(0, result.getExcludedEvents().size());
    }

    @Test
    void ignoredInvalid_shouldBeExcluded() {
        FaultEventModel e = TestDataFactory.event(1L, TestDataFactory.JOB_A, TestDataFactory.T0, "IGNORED_INVALID");

        MainChainFilter.FilterResult result = filter.filter(
                Collections.singletonList(e), Collections.emptyList());

        assertEquals(0, result.getMainChainEvents().size());
        assertEquals(1, result.getExcludedEvents().size());
        assertTrue(result.getExcludedEvents().get(0).isInvalid());
    }

    @Test
    void ignoredStale_shouldBeExcluded() {
        FaultEventModel e = TestDataFactory.event(1L, TestDataFactory.JOB_A, TestDataFactory.T0, "IGNORED_STALE");

        MainChainFilter.FilterResult result = filter.filter(
                Collections.singletonList(e), Collections.emptyList());

        assertEquals(0, result.getMainChainEvents().size());
        assertEquals(1, result.getExcludedEvents().size());
        assertTrue(result.getExcludedEvents().get(0).isStale());
    }

    @Test
    void acceptedWithDuplicateIgnoredLog_shouldBeExcluded() {
        FaultEventModel e = TestDataFactory.event(1L, TestDataFactory.JOB_A, TestDataFactory.T0, "ACCEPTED");
        FaultLogModel dupLog = TestDataFactory.log(101L, 1L, "DUPLICATED_EVENT_IGNORED",
                TestDataFactory.T1, null);

        MainChainFilter.FilterResult result = filter.filter(
                Collections.singletonList(e), Collections.singletonList(dupLog));

        assertEquals(0, result.getMainChainEvents().size());
        assertEquals(1, result.getExcludedEvents().size());
        assertTrue(result.getExcludedEvents().get(0).isHasDuplicateIgnoredLog());
    }

    @Test
    void mixedEvents_shouldSeparateCorrectly() {
        FaultEventModel valid = TestDataFactory.event(1L, TestDataFactory.JOB_A, TestDataFactory.T0, "ACCEPTED");
        FaultEventModel invalid = TestDataFactory.event(2L, TestDataFactory.JOB_B,
                TestDataFactory.T0.plusMinutes(1), "IGNORED_INVALID");
        FaultEventModel stale = TestDataFactory.event(3L, TestDataFactory.JOB_C,
                TestDataFactory.T0.plusMinutes(2), "IGNORED_STALE");

        MainChainFilter.FilterResult result = filter.filter(
                Arrays.asList(valid, invalid, stale), Collections.emptyList());

        assertEquals(1, result.getMainChainEvents().size());
        assertEquals(2, result.getExcludedEvents().size());
        assertEquals(1L, result.getMainChainEvents().get(0).getId().longValue());
    }
}
