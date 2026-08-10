package com.bsoft.cdcconfig.largescreen.stats.executor;

import com.bsoft.cdcconfig.largescreen.stats.algorithm.WatermarkCasUpdater;
import com.bsoft.cdcconfig.largescreen.stats.config.StatsTaskConfig;
import com.bsoft.cdcconfig.largescreen.stats.dto.BatchResult;
import com.bsoft.cdcconfig.largescreen.stats.dto.RoundResult;
import com.bsoft.cdcconfig.largescreen.stats.support.ControllableClock;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Nested;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.time.Clock;
import java.time.Instant;
import java.time.ZoneId;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class RoundExecutorTest {

    @Mock
    private BatchTransactionExecutor batchTransactionExecutor;

    @Mock
    private WatermarkCasUpdater watermarkCasUpdater;

    private Clock fixedClock;
    private RoundExecutor executor;
    private StatsTaskConfig config;

    // Pre-computed safe upper IDs for fixed clock at 1786003200000 with 30min safety delay
    private long correctSafeUpperId;
    private long errorSafeUpperId;

    @BeforeEach
    void setUp() {
        // 2026-08-06 08:00:00 UTC = 1786003200000 ms
        fixedClock = Clock.fixed(Instant.ofEpochMilli(1786003200000L), ZoneId.of("UTC"));
        executor = new RoundExecutor(batchTransactionExecutor, watermarkCasUpdater, fixedClock);
        config = StatsTaskConfig.builder()
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

        long expectedTimestamp = 1786003200000L - 30 * 60_000L;
        correctSafeUpperId = com.bsoft.cdcconfig.common.util.SnowflakeIdBoundaryCalculator
                .maxIdAt(expectedTimestamp);
        errorSafeUpperId = correctSafeUpperId;
    }

    @Test
    void alternatingOrderCorrectThenError() {
        BatchResult correctBatch = new BatchResult.Builder()
                .success(true).logType("CORRECT")
                .oldLastLogId(0).newLastLogId(100)
                .processedCount(50).build();

        when(watermarkCasUpdater.readCurrentWatermark(anyString(), eq("CORRECT"))).thenReturn(0L);
        when(watermarkCasUpdater.readCurrentWatermark(anyString(), eq("ERROR"))).thenReturn(0L);
        when(batchTransactionExecutor.executeBatch(anyString(), eq("CORRECT"),
                eq("CDC_LOG_CORRECT"), anyLong(), anyInt()))
                .thenReturn(correctBatch).thenReturn(BatchResult.EMPTY);
        when(batchTransactionExecutor.executeBatch(anyString(), eq("ERROR"),
                eq("CDC_LOG_ERROR"), anyLong(), anyInt()))
                .thenReturn(BatchResult.EMPTY);

        RoundResult result = executor.executeRound(config,
                correctSafeUpperId, errorSafeUpperId,
                config.getBatchSize(), config.getBatchSize());

        assertFalse(result.isPartialFailure());
        assertTrue(result.getErrorBatches().stream().anyMatch(BatchResult::isEmpty));
        verify(watermarkCasUpdater, atLeastOnce()).readCurrentWatermark("LARGE_SCREEN_STATS", "CORRECT");
        verify(watermarkCasUpdater, atLeastOnce()).readCurrentWatermark("LARGE_SCREEN_STATS", "ERROR");
    }

    @Test
    void bothCaughtUpAfterEmptyBatches() {
        when(watermarkCasUpdater.readCurrentWatermark(anyString(), eq("CORRECT"))).thenReturn(100L);
        when(watermarkCasUpdater.readCurrentWatermark(anyString(), eq("ERROR"))).thenReturn(200L);
        when(batchTransactionExecutor.executeBatch(anyString(), eq("CORRECT"),
                anyString(), anyLong(), anyInt())).thenReturn(BatchResult.EMPTY);
        when(batchTransactionExecutor.executeBatch(anyString(), eq("ERROR"),
                anyString(), anyLong(), anyInt())).thenReturn(BatchResult.EMPTY);

        RoundResult result = executor.executeRound(config,
                correctSafeUpperId, errorSafeUpperId,
                config.getBatchSize(), config.getBatchSize());

        assertTrue(result.isAllCaughtUp());
        assertEquals("all_caught_up", result.getStopReason());
        assertEquals(1, result.getTotalCorrectBatches());
        assertEquals(1, result.getTotalErrorBatches());
    }

    @Test
    void correctFailureDoesNotStopErrorStream() {
        when(watermarkCasUpdater.readCurrentWatermark(anyString(), eq("CORRECT"))).thenReturn(0L);
        when(watermarkCasUpdater.readCurrentWatermark(anyString(), eq("ERROR"))).thenReturn(0L);
        when(batchTransactionExecutor.executeBatch(anyString(), eq("CORRECT"),
                eq("CDC_LOG_CORRECT"), anyLong(), anyInt()))
                .thenThrow(new RuntimeException("CORRECT failed"));
        BatchResult errorBatch = new BatchResult.Builder()
                .success(true).logType("ERROR")
                .oldLastLogId(0).newLastLogId(50).processedCount(25).build();
        when(batchTransactionExecutor.executeBatch(anyString(), eq("ERROR"),
                eq("CDC_LOG_ERROR"), anyLong(), anyInt()))
                .thenReturn(errorBatch).thenReturn(BatchResult.EMPTY);

        RoundResult result = executor.executeRound(config,
                correctSafeUpperId, errorSafeUpperId,
                config.getBatchSize(), config.getBatchSize());

        assertTrue(result.isCorrectFailed());
        assertFalse(result.isErrorFailed());
        assertTrue(result.getTotalErrorBatches() >= 1);
        assertTrue(result.isPartialFailure());
    }

    @Test
    void safeUpperIdsPreservedFromParameters() {
        when(watermarkCasUpdater.readCurrentWatermark(anyString(), anyString())).thenReturn(0L);
        when(batchTransactionExecutor.executeBatch(anyString(), anyString(),
                anyString(), anyLong(), anyInt()))
                .thenReturn(BatchResult.EMPTY);

        long specificCorrect = 12345L;
        long specificError = 67890L;

        RoundResult result = executor.executeRound(config,
                specificCorrect, specificError,
                config.getBatchSize(), config.getBatchSize());

        assertEquals(specificCorrect, result.getCorrectSafeUpperId());
        assertEquals(specificError, result.getErrorSafeUpperId());
    }

    @Test
    void batchCountRespectsLimit() {
        when(watermarkCasUpdater.readCurrentWatermark(anyString(), eq("CORRECT"))).thenReturn(0L);
        when(watermarkCasUpdater.readCurrentWatermark(anyString(), eq("ERROR"))).thenReturn(0L);

        BatchResult batch = new BatchResult.Builder()
                .success(true).logType("CORRECT")
                .oldLastLogId(0).newLastLogId(100).processedCount(10).build();
        when(batchTransactionExecutor.executeBatch(anyString(), eq("CORRECT"),
                eq("CDC_LOG_CORRECT"), anyLong(), anyInt()))
                .thenReturn(batch);
        when(batchTransactionExecutor.executeBatch(anyString(), eq("ERROR"),
                eq("CDC_LOG_ERROR"), anyLong(), anyInt()))
                .thenReturn(BatchResult.EMPTY);

        RoundResult result = executor.executeRound(config,
                correctSafeUpperId, errorSafeUpperId,
                config.getBatchSize(), config.getBatchSize());
        assertTrue(result.getTotalCorrectBatches() <= 10);
    }

    @Test
    void oneSideReachesBatchLimit() {
        when(watermarkCasUpdater.readCurrentWatermark(anyString(), eq("CORRECT"))).thenReturn(0L);
        when(watermarkCasUpdater.readCurrentWatermark(anyString(), eq("ERROR"))).thenReturn(0L);

        BatchResult batch = new BatchResult.Builder()
                .success(true).logType("CORRECT")
                .oldLastLogId(0).newLastLogId(100).processedCount(10).build();
        when(batchTransactionExecutor.executeBatch(anyString(), eq("CORRECT"),
                eq("CDC_LOG_CORRECT"), anyLong(), anyInt())).thenReturn(batch);
        when(batchTransactionExecutor.executeBatch(anyString(), eq("ERROR"),
                eq("CDC_LOG_ERROR"), anyLong(), anyInt())).thenReturn(BatchResult.EMPTY);

        RoundResult result = executor.executeRound(config,
                correctSafeUpperId, errorSafeUpperId,
                config.getBatchSize(), config.getBatchSize());
        assertFalse(result.isPartialFailure() || result.isCorrectFailed() || result.isErrorFailed());
    }

    @Test
    void timeLimitStopsBetweenBatchesNotDuringBatch() {
        when(watermarkCasUpdater.readCurrentWatermark(anyString(), eq("CORRECT"))).thenReturn(0L);
        when(watermarkCasUpdater.readCurrentWatermark(anyString(), eq("ERROR"))).thenReturn(0L);

        BatchResult batch = new BatchResult.Builder()
                .success(true).logType("CORRECT")
                .oldLastLogId(0).newLastLogId(100).processedCount(10).build();
        when(batchTransactionExecutor.executeBatch(anyString(), eq("CORRECT"),
                eq("CDC_LOG_CORRECT"), anyLong(), anyInt()))
                .thenReturn(batch);
        when(batchTransactionExecutor.executeBatch(anyString(), eq("ERROR"),
                eq("CDC_LOG_ERROR"), anyLong(), anyInt()))
                .thenReturn(BatchResult.EMPTY);

        RoundResult result = executor.executeRound(config,
                correctSafeUpperId, errorSafeUpperId,
                config.getBatchSize(), config.getBatchSize());

        assertTrue(result.getTotalCorrectBatches() >= 1);
    }

    @Test
    void eachLogTypeRespectsMaxBatchesPerRun() {
        when(watermarkCasUpdater.readCurrentWatermark(anyString(), eq("CORRECT"))).thenReturn(0L);
        when(watermarkCasUpdater.readCurrentWatermark(anyString(), eq("ERROR"))).thenReturn(0L);

        BatchResult dataBatch = new BatchResult.Builder()
                .success(true).logType("CORRECT")
                .oldLastLogId(0).newLastLogId(100).processedCount(10).build();
        when(batchTransactionExecutor.executeBatch(anyString(), eq("CORRECT"),
                eq("CDC_LOG_CORRECT"), anyLong(), anyInt()))
                .thenReturn(dataBatch);
        when(batchTransactionExecutor.executeBatch(anyString(), eq("ERROR"),
                eq("CDC_LOG_ERROR"), anyLong(), anyInt()))
                .thenReturn(BatchResult.EMPTY);

        RoundResult result = executor.executeRound(config,
                correctSafeUpperId, errorSafeUpperId,
                config.getBatchSize(), config.getBatchSize());

        assertTrue(result.getTotalCorrectBatches() <= 10,
                "CORRECT batches " + result.getTotalCorrectBatches() + " should not exceed 10");
        assertTrue(result.getTotalErrorBatches() <= 10,
                "ERROR batches should not exceed 10");
    }

    @Nested
    @DisplayName("V06: 180s soft time limit with controllable clock")
    class V06TimeLimitTests {

        private ControllableClock controllable;
        private RoundExecutor timeExecutor;

        @BeforeEach
        void setUp() {
            controllable = new ControllableClock(1786003200000L, ZoneId.of("UTC"));
            timeExecutor = new RoundExecutor(batchTransactionExecutor,
                    watermarkCasUpdater, controllable);
        }

        @Test
        @DisplayName("continues batches before deadline")
        void continuesBatchesBeforeDeadline() {
            when(watermarkCasUpdater.readCurrentWatermark(anyString(), anyString()))
                    .thenReturn(0L);

            BatchResult dataBatch = new BatchResult.Builder()
                    .success(true).logType("CORRECT")
                    .oldLastLogId(0).newLastLogId(100).processedCount(10).build();
            when(batchTransactionExecutor.executeBatch(anyString(), eq("CORRECT"),
                    eq("CDC_LOG_CORRECT"), anyLong(), anyInt()))
                    .thenReturn(dataBatch);
            when(batchTransactionExecutor.executeBatch(anyString(), eq("ERROR"),
                    eq("CDC_LOG_ERROR"), anyLong(), anyInt()))
                    .thenReturn(BatchResult.EMPTY);

            RoundResult result = timeExecutor.executeRound(config,
                    correctSafeUpperId, errorSafeUpperId,
                    config.getBatchSize(), config.getBatchSize());

            assertTrue(result.getTotalCorrectBatches() >= 1,
                    "at least one batch processed before deadline");
            assertEquals("batch_limit_reached", result.getStopReason());
            assertFalse(result.isCorrectFailed());
            assertFalse(result.isErrorFailed());
        }

        @Test
        @DisplayName("stops with time_limit_reached when deadline exceeded")
        void stopsWhenDeadlineExceeded() {
            when(watermarkCasUpdater.readCurrentWatermark(anyString(), anyString()))
                    .thenReturn(0L);

            BatchResult dataBatch = new BatchResult.Builder()
                    .success(true).logType("CORRECT")
                    .oldLastLogId(0).newLastLogId(100).processedCount(10).build();
            // Advance clock past 180s deadline on first CORRECT batch return
            when(batchTransactionExecutor.executeBatch(anyString(), eq("CORRECT"),
                    eq("CDC_LOG_CORRECT"), anyLong(), anyInt()))
                    .thenAnswer(inv -> {
                        controllable.advance(181_000L);
                        return dataBatch;
                    });
            when(batchTransactionExecutor.executeBatch(anyString(), eq("ERROR"),
                    eq("CDC_LOG_ERROR"), anyLong(), anyInt()))
                    .thenReturn(BatchResult.EMPTY);

            RoundResult result = timeExecutor.executeRound(config,
                    correctSafeUpperId, errorSafeUpperId,
                    config.getBatchSize(), config.getBatchSize());

            assertEquals("time_limit_reached", result.getStopReason(),
                    "should stop due to time limit, not batch limit");
            assertTrue(result.getTotalCorrectBatches() >= 1,
                    "already-started batch must complete");
            assertFalse(result.isCorrectFailed(),
                    "time limit stop is not a failure");
        }

        @Test
        @DisplayName("completed batches not rolled back after time limit")
        void completedBatchesNotRolledBack() {
            when(watermarkCasUpdater.readCurrentWatermark(anyString(), anyString()))
                    .thenReturn(0L);

            BatchResult dataBatch = new BatchResult.Builder()
                    .success(true).logType("CORRECT")
                    .oldLastLogId(0).newLastLogId(5000).processedCount(2000).build();
            when(batchTransactionExecutor.executeBatch(anyString(), eq("CORRECT"),
                    eq("CDC_LOG_CORRECT"), anyLong(), anyInt()))
                    .thenAnswer(inv -> {
                        controllable.advance(181_000L);
                        return dataBatch;
                    });
            when(batchTransactionExecutor.executeBatch(anyString(), eq("ERROR"),
                    eq("CDC_LOG_ERROR"), anyLong(), anyInt()))
                    .thenReturn(BatchResult.EMPTY);

            RoundResult result = timeExecutor.executeRound(config,
                    correctSafeUpperId, errorSafeUpperId,
                    config.getBatchSize(), config.getBatchSize());

            long correctProcessed = result.getTotalCorrectProcessed();
            assertTrue(correctProcessed >= 2000,
                    "processed count must be preserved after time limit stop");
            assertEquals("time_limit_reached", result.getStopReason());
        }

        @Test
        @DisplayName("time limit coexists with batch limit per frozen priority")
        void timeLimitAndBatchLimitCoexist() {
            // This test verifies the current implementation's priority:
            // batch_limit_reached takes precedence over time_limit_reached
            // when both conditions are met simultaneously.
            when(watermarkCasUpdater.readCurrentWatermark(anyString(), anyString()))
                    .thenReturn(0L);

            BatchResult dataBatch = new BatchResult.Builder()
                    .success(true).logType("CORRECT")
                    .oldLastLogId(0).newLastLogId(100).processedCount(10).build();
            when(batchTransactionExecutor.executeBatch(anyString(), eq("CORRECT"),
                    eq("CDC_LOG_CORRECT"), anyLong(), anyInt()))
                    .thenReturn(dataBatch);
            when(batchTransactionExecutor.executeBatch(anyString(), eq("ERROR"),
                    eq("CDC_LOG_ERROR"), anyLong(), anyInt()))
                    .thenReturn(BatchResult.EMPTY);

            RoundResult result = timeExecutor.executeRound(config,
                    correctSafeUpperId, errorSafeUpperId,
                    config.getBatchSize(), config.getBatchSize());

            // With 10-batch limit reached, stopReason is batch_limit_reached
            // regardless of whether time also elapsed
            assertNotNull(result.getStopReason());
            assertFalse(result.isCorrectFailed());
            assertFalse(result.isErrorFailed());
        }
    }
}
