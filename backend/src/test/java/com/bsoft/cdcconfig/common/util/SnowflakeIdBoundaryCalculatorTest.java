package com.bsoft.cdcconfig.common.util;

import org.junit.jupiter.api.Test;

import static org.junit.jupiter.api.Assertions.*;

class SnowflakeIdBoundaryCalculatorTest {

    /** 冻结样例：2026-08-06 16:00 CST = 2026-08-06 08:00 UTC = 1786003200000 ms */
    @Test
    void shouldComputeFrozenSample() {
        long maxId = SnowflakeIdBoundaryCalculator.maxIdAt(1786003200000L);
        assertEquals(343664492548194303L, maxId);
    }

    @Test
    void shouldComputeEpochExactly() {
        long maxId = SnowflakeIdBoundaryCalculator.maxIdAt(1704067200000L);
        assertEquals(4194303L, maxId); // ((0) << 22) | LOW_BITS_MASK
    }

    @Test
    void shouldComputeOneMilliAfterEpoch() {
        long maxId = SnowflakeIdBoundaryCalculator.maxIdAt(1704067200001L);
        assertEquals((1L << 22) | 4194303L, maxId);
    }

    @Test
    void shouldRejectBeforeEpoch() {
        assertThrows(IllegalArgumentException.class,
                () -> SnowflakeIdBoundaryCalculator.maxIdAt(1704067199999L));
    }

    @Test
    void shouldRejectBeyond41BitRange() {
        // EPOCH + 2^41 = max valid timestamp + 1
        long beyondRange = 1704067200000L + (1L << 41);
        assertThrows(IllegalArgumentException.class,
                () -> SnowflakeIdBoundaryCalculator.maxIdAt(beyondRange));
    }

    @Test
    void shouldAcceptMax41BitTimestamp() {
        long maxTimestamp = 1704067200000L + ((1L << 41) - 1);
        assertDoesNotThrow(() -> SnowflakeIdBoundaryCalculator.maxIdAt(maxTimestamp));
    }

    @Test
    void shouldBeMonotonicallyIncreasing() {
        long id1 = SnowflakeIdBoundaryCalculator.maxIdAt(1786003200000L);
        long id2 = SnowflakeIdBoundaryCalculator.maxIdAt(1786003200001L);
        assertTrue(id2 > id1);
    }
}
