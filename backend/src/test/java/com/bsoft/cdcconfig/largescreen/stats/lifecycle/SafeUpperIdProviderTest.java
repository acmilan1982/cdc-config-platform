package com.bsoft.cdcconfig.largescreen.stats.lifecycle;

import com.bsoft.cdcconfig.common.util.SnowflakeIdBoundaryCalculator;
import com.bsoft.cdcconfig.largescreen.stats.config.StatsTaskConfig;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.jdbc.core.JdbcTemplate;

import java.time.Clock;
import java.time.Instant;
import java.time.ZoneId;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class SafeUpperIdProviderTest {

    @Mock
    private JdbcTemplate jdbcTemplate;

    private Clock fixedClock;
    private SafeUpperIdProvider provider;
    private StatsTaskConfig config;

    @BeforeEach
    void setUp() {
        fixedClock = Clock.fixed(Instant.ofEpochMilli(1786003200000L), ZoneId.of("UTC"));
        provider = new SafeUpperIdProvider(jdbcTemplate, fixedClock);
        config = StatsTaskConfig.builder()
                .taskCode("LARGE_SCREEN_STATS")
                .taskName("Test")
                .enabled(1)
                .startupDelayMinutes(10)
                .scheduleIntervalMinutes(60)
                .safetyDelayMinutes(30)
                .batchSize(200000)
                .maxBatchesPerRun(10)
                .maxRunDurationSeconds(900)
                .build();
    }

    @Test
    void safeUpperIdIsMinOfMaxLogIdAndTimeBoundary() {
        long timeBoundary = SnowflakeIdBoundaryCalculator.maxIdAt(
                1786003200000L - 30 * 60_000L);
        when(jdbcTemplate.queryForObject(contains("CDC_LOG_CORRECT"), eq(Long.class)))
                .thenReturn(1000L);
        when(jdbcTemplate.queryForObject(contains("CDC_LOG_ERROR"), eq(Long.class)))
                .thenReturn(timeBoundary + 1000L); // > timeBoundary

        SafeUpperIdProvider.SafeUpperIds ids = provider.compute(config);

        // maxLogId=1000 < timeBoundary → safeUpper=1000
        assertEquals(1000L, ids.correctSafeUpperId);
        // maxLogId > timeBoundary → safeUpper=timeBoundary
        assertEquals(timeBoundary, ids.errorSafeUpperId);
    }

    @Test
    void safeUpperIdClampedByTimeBoundary() {
        long timeBoundary = SnowflakeIdBoundaryCalculator.maxIdAt(
                1786003200000L - 30 * 60_000L);
        when(jdbcTemplate.queryForObject(contains("CDC_LOG_CORRECT"), eq(Long.class)))
                .thenReturn(timeBoundary + 5000L);
        when(jdbcTemplate.queryForObject(contains("CDC_LOG_ERROR"), eq(Long.class)))
                .thenReturn(timeBoundary + 5000L);

        SafeUpperIdProvider.SafeUpperIds ids = provider.compute(config);

        assertEquals(timeBoundary, ids.correctSafeUpperId);
        assertEquals(timeBoundary, ids.errorSafeUpperId);
    }

    @Test
    void emptyTableReturnsSafeUpperIdZero() {
        when(jdbcTemplate.queryForObject(contains("CDC_LOG_CORRECT"), eq(Long.class)))
                .thenReturn(0L);
        when(jdbcTemplate.queryForObject(contains("CDC_LOG_ERROR"), eq(Long.class)))
                .thenReturn(null);

        SafeUpperIdProvider.SafeUpperIds ids = provider.compute(config);

        assertEquals(0L, ids.correctSafeUpperId);
        assertEquals(0L, ids.errorSafeUpperId);
    }

    @Test
    void nullMaxIdTreatedAsZero() {
        long timeBoundary = SnowflakeIdBoundaryCalculator.maxIdAt(
                1786003200000L - 30 * 60_000L);
        when(jdbcTemplate.queryForObject(contains("CDC_LOG_CORRECT"), eq(Long.class)))
                .thenReturn(null);
        when(jdbcTemplate.queryForObject(contains("CDC_LOG_ERROR"), eq(Long.class)))
                .thenReturn(null);

        SafeUpperIdProvider.SafeUpperIds ids = provider.compute(config);

        assertEquals(0L, ids.correctSafeUpperId);
        assertEquals(0L, ids.errorSafeUpperId);
        assertEquals(timeBoundary, ids.timeBoundary);
    }

    @Test
    void correctAndErrorMaxIdsQueriedSeparately() {
        when(jdbcTemplate.queryForObject(anyString(), eq(Long.class))).thenReturn(100L);

        provider.compute(config);

        verify(jdbcTemplate).queryForObject(contains("CDC_LOG_CORRECT"), eq(Long.class));
        verify(jdbcTemplate).queryForObject(contains("CDC_LOG_ERROR"), eq(Long.class));
    }

    @Test
    void timeBoundaryUsesSnowflakeIdBoundaryCalculator() {
        when(jdbcTemplate.queryForObject(anyString(), eq(Long.class))).thenReturn(0L);

        SafeUpperIdProvider.SafeUpperIds ids = provider.compute(config);

        long expected = SnowflakeIdBoundaryCalculator.maxIdAt(
                1786003200000L - 30 * 60_000L);
        assertEquals(expected, ids.timeBoundary);
    }

    @Test
    void invalidTableNameThrows() {
        assertThrows(IllegalArgumentException.class,
                () -> provider.queryMaxLogId("CDC_LOG_UNKNOWN"));
    }

    @Test
    void fieldsAreAccessible() {
        when(jdbcTemplate.queryForObject(anyString(), eq(Long.class))).thenReturn(500L);

        SafeUpperIdProvider.SafeUpperIds ids = provider.compute(config);

        assertTrue(ids.correctMaxLogId >= 0);
        assertTrue(ids.errorMaxLogId >= 0);
        assertTrue(ids.timeBoundary > 0);
    }
}
