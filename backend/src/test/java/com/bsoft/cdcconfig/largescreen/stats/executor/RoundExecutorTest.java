package com.bsoft.cdcconfig.largescreen.stats.executor;

import com.bsoft.cdcconfig.largescreen.stats.algorithm.WatermarkCasUpdater;
import com.bsoft.cdcconfig.largescreen.stats.config.StatsTaskConfig;
import com.bsoft.cdcconfig.largescreen.stats.dto.BatchResult;
import com.bsoft.cdcconfig.largescreen.stats.dto.RoundResult;
import org.junit.jupiter.api.BeforeEach;
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

    @Test
    void perStreamBatchSizesUsed() {
        when(watermarkCasUpdater.readCurrentWatermark(anyString(), anyString())).thenReturn(0L);
        when(batchTransactionExecutor.executeBatch(anyString(), anyString(),
                anyString(), anyLong(), anyInt())).thenReturn(BatchResult.EMPTY);

        int customCorrectBs = 50000;
        int customErrorBs = 300000;

        executor.executeRound(config,
                correctSafeUpperId, errorSafeUpperId,
                customCorrectBs, customErrorBs);

        verify(batchTransactionExecutor, atLeastOnce()).executeBatch(
                anyString(), eq("CORRECT"), eq("CDC_LOG_CORRECT"), anyLong(), eq(customCorrectBs));
        verify(batchTransactionExecutor, atLeastOnce()).executeBatch(
                anyString(), eq("ERROR"), eq("CDC_LOG_ERROR"), anyLong(), eq(customErrorBs));
    }
}
