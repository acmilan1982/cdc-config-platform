package com.bsoft.cdcconfig.largescreen.stats.config;

import org.junit.jupiter.api.Test;

import static org.junit.jupiter.api.Assertions.*;

class StatsTaskConfigTest {

    @Test
    void validConfigBuildsSuccessfully() {
        StatsTaskConfig config = StatsTaskConfig.builder()
                .taskCode("LARGE_SCREEN_STATS")
                .taskName("Test")
                .enabled(1)
                .startupDelayMinutes(10)
                .scheduleIntervalMinutes(60)
                .safetyDelayMinutes(30)
                .batchSize(200000)
                .maxBatchesPerRun(10)
                .maxRunDurationSeconds(180)
                .build();

        assertEquals("LARGE_SCREEN_STATS", config.getTaskCode());
        assertEquals(1, config.getEnabled());
        assertEquals(10, config.getStartupDelayMinutes());
        assertEquals(60, config.getScheduleIntervalMinutes());
        assertEquals(30, config.getSafetyDelayMinutes());
        assertEquals(200000, config.getBatchSize());
        assertEquals(10, config.getMaxBatchesPerRun());
        assertEquals(180, config.getMaxRunDurationSeconds());
    }

    @Test
    void nullTaskCodeThrows() {
        assertThrows(IllegalArgumentException.class,
                () -> StatsTaskConfig.builder().taskCode(null).build());
    }

    @Test
    void emptyTaskCodeThrows() {
        assertThrows(IllegalArgumentException.class,
                () -> StatsTaskConfig.builder().taskCode("").build());
    }

    @Test
    void enabledOutOfRangeThrows() {
        assertThrows(IllegalArgumentException.class,
                () -> StatsTaskConfig.builder().taskCode("T").enabled(2).build());
    }

    @Test
    void batchSizeOutOfRangeThrows() {
        assertThrows(IllegalArgumentException.class,
                () -> StatsTaskConfig.builder().taskCode("T").batchSize(100).build());
    }

    @Test
    void safetyDelayZeroThrows() {
        assertThrows(IllegalArgumentException.class,
                () -> StatsTaskConfig.builder().taskCode("T").safetyDelayMinutes(0).build());
    }

    @Test
    void scheduleIntervalMax() {
        StatsTaskConfig config = StatsTaskConfig.builder()
                .taskCode("T")
                .scheduleIntervalMinutes(1440)
                .safetyDelayMinutes(1)
                .batchSize(1000)
                .maxBatchesPerRun(1)
                .maxRunDurationSeconds(10)
                .build();
        assertEquals(1440, config.getScheduleIntervalMinutes());
    }
}
