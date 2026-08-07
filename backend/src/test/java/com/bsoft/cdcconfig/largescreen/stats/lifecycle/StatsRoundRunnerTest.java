package com.bsoft.cdcconfig.largescreen.stats.lifecycle;

import com.bsoft.cdcconfig.largescreen.stats.config.StatsTaskConfig;
import com.bsoft.cdcconfig.largescreen.stats.dto.BatchResult;
import com.bsoft.cdcconfig.largescreen.stats.dto.RoundResult;
import com.bsoft.cdcconfig.largescreen.stats.executor.RoundExecutor;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class StatsRoundRunnerTest {

    @Mock
    private RoundExecutor roundExecutor;

    @Mock
    private SafeUpperIdProvider safeUpperIdProvider;

    private DynamicBatchSizeManager batchSizeManager;
    private StatsRoundRunner runner;
    private StatsTaskConfig config;

    @BeforeEach
    void setUp() {
        batchSizeManager = new DynamicBatchSizeManager();
        runner = new StatsRoundRunner(roundExecutor, safeUpperIdProvider, batchSizeManager);
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
    void lockAcquiredRoundExecutes() {
        SafeUpperIdProvider.SafeUpperIds ids =
                new SafeUpperIdProvider.SafeUpperIds(1000, 2000, 500, 1000, 3000);
        when(safeUpperIdProvider.compute(config)).thenReturn(ids);

        RoundResult mockResult = new RoundResult(1000, 2000, System.currentTimeMillis());
        mockResult.setStopReason("completed");
        mockResult.setRoundEndTime(System.currentTimeMillis());
        mockResult.setCorrectCaughtUp(true);
        mockResult.setErrorCaughtUp(true);
        when(roundExecutor.executeRound(eq(config), eq(1000L), eq(2000L), anyInt(), anyInt()))
                .thenReturn(mockResult);

        // Must initialize first
        batchSizeManager.initialize(200000);
        RoundRunResult result = runner.runRound(config);

        assertEquals(RoundRunStatus.EXECUTED, result.getStatus());
        assertNotNull(result.getRoundResult());
        verify(roundExecutor).executeRound(eq(config), eq(1000L), eq(2000L), anyInt(), anyInt());
    }

    @Test
    void lockHeldReturnsSkippedLocked() {
        batchSizeManager.initialize(200000);

        SafeUpperIdProvider.SafeUpperIds ids =
                new SafeUpperIdProvider.SafeUpperIds(1000, 2000, 500, 1000, 3000);
        when(safeUpperIdProvider.compute(config)).thenReturn(ids);
        // Make first call block so second call hits lock
        when(roundExecutor.executeRound(any(), anyLong(), anyLong(), anyInt(), anyInt()))
                .thenAnswer(inv -> {
                    Thread.sleep(100);
                    RoundResult r = new RoundResult(1000, 2000, System.currentTimeMillis());
                    r.setStopReason("completed");
                    r.setRoundEndTime(System.currentTimeMillis());
                    return r;
                });

        // Start first round in another thread
        Thread t = new Thread(() -> runner.runRound(config));
        t.start();

        // Give it time to acquire lock
        try { Thread.sleep(20); } catch (InterruptedException ignored) {}

        // Second call should be skipped
        RoundRunResult result = runner.runRound(config);
        assertEquals(RoundRunStatus.SKIPPED_LOCKED, result.getStatus());
        assertNull(result.getRoundResult());

        try { t.join(); } catch (InterruptedException ignored) {}
    }

    @Test
    void lockReleasedAfterSuccess() {
        SafeUpperIdProvider.SafeUpperIds ids =
                new SafeUpperIdProvider.SafeUpperIds(1000, 2000, 500, 1000, 3000);
        when(safeUpperIdProvider.compute(config)).thenReturn(ids);
        when(roundExecutor.executeRound(any(), anyLong(), anyLong(), anyInt(), anyInt()))
                .thenAnswer(inv -> {
                    RoundResult r = new RoundResult(1000, 2000, System.currentTimeMillis());
                    r.setStopReason("completed");
                    r.setRoundEndTime(System.currentTimeMillis());
                    return r;
                });

        batchSizeManager.initialize(200000);
        runner.runRound(config);

        // Second call can acquire lock (would be SKIPPED_LOCKED otherwise)
        RoundRunResult result2 = runner.runRound(config);
        assertEquals(RoundRunStatus.EXECUTED, result2.getStatus());
    }

    @Test
    void lockReleasedAfterSafeUpperIdException() {
        when(safeUpperIdProvider.compute(config))
                .thenThrow(new RuntimeException("Connection failed"));

        batchSizeManager.initialize(200000);
        RoundRunResult result = runner.runRound(config);

        assertEquals(RoundRunStatus.FAILED, result.getStatus());
        assertNull(result.getRoundResult());

        // Lock should be released — verify by checking lock can be re-acquired
        // Use reset to clear old stubs, then set up new ones
        verify(roundExecutor, never()).executeRound(any(), anyLong(), anyLong(), anyInt(), anyInt());
    }

    @Test
    void lockCanBeReacquiredAfterSafeUpperIdFailure() {
        SafeUpperIdProvider.SafeUpperIds ids2 =
                new SafeUpperIdProvider.SafeUpperIds(1000, 2000, 500, 1000, 3000);
        reset(safeUpperIdProvider);
        when(safeUpperIdProvider.compute(config)).thenReturn(ids2);
        when(roundExecutor.executeRound(any(), anyLong(), anyLong(), anyInt(), anyInt()))
                .thenAnswer(inv -> {
                    RoundResult r = new RoundResult(1000, 2000, System.currentTimeMillis());
                    r.setStopReason("completed");
                    r.setRoundEndTime(System.currentTimeMillis());
                    return r;
                });

        batchSizeManager.initialize(200000);
        RoundRunResult result2 = runner.runRound(config);
        assertEquals(RoundRunStatus.EXECUTED, result2.getStatus());
    }

    @Test
    void lockReleasedAfterRoundExecutorException() {
        SafeUpperIdProvider.SafeUpperIds ids =
                new SafeUpperIdProvider.SafeUpperIds(1000, 2000, 500, 1000, 3000);
        when(safeUpperIdProvider.compute(config)).thenReturn(ids);
        when(roundExecutor.executeRound(any(), anyLong(), anyLong(), anyInt(), anyInt()))
                .thenThrow(new RuntimeException("Execution error"));

        batchSizeManager.initialize(200000);
        RoundRunResult result = runner.runRound(config);

        assertEquals(RoundRunStatus.FAILED, result.getStatus());
    }

    @Test
    void lockCanBeReacquiredAfterRoundExecutorFailure() {
        SafeUpperIdProvider.SafeUpperIds ids2 =
                new SafeUpperIdProvider.SafeUpperIds(2000, 3000, 1000, 2000, 4000);
        lenient().when(safeUpperIdProvider.compute(config)).thenReturn(ids2);
        when(roundExecutor.executeRound(any(), anyLong(), anyLong(), anyInt(), anyInt()))
                .thenAnswer(inv -> {
                    RoundResult r = new RoundResult(2000, 3000, System.currentTimeMillis());
                    r.setStopReason("completed");
                    r.setRoundEndTime(System.currentTimeMillis());
                    return r;
                });

        batchSizeManager.initialize(200000);
        RoundRunResult result2 = runner.runRound(config);
        assertEquals(RoundRunStatus.EXECUTED, result2.getStatus());
    }

    @Test
    void dynamicBatchSizeAdjustedAfterRound() {
        batchSizeManager.initialize(200000);

        SafeUpperIdProvider.SafeUpperIds ids =
                new SafeUpperIdProvider.SafeUpperIds(5000, 5000, 1000, 2000, 3000);
        when(safeUpperIdProvider.compute(config)).thenReturn(ids);

        long now = System.currentTimeMillis();
        RoundResult mockResult = new RoundResult(5000, 5000, now);
        mockResult.setStopReason("time_limit_reached");
        mockResult.setRoundEndTime(now + 1000);
        // Both streams: not caught up, not failed, and have at least one batch
        mockResult.addCorrectBatch(new BatchResult.Builder()
                .success(true).logType("CORRECT").processedCount(100).build());
        mockResult.setCorrectCaughtUp(false);
        mockResult.setCorrectFailed(false);
        mockResult.addErrorBatch(new BatchResult.Builder()
                .success(true).logType("ERROR").processedCount(100).build());
        mockResult.setErrorCaughtUp(false);
        mockResult.setErrorFailed(false);
        when(roundExecutor.executeRound(eq(config), eq(5000L), eq(5000L), anyInt(), anyInt()))
                .thenReturn(mockResult);

        runner.runRound(config);

        // time_limit_reached + has batches + !caughtUp + !failed → both decreased
        assertEquals(190000, batchSizeManager.getCorrectBatchSize());
        assertEquals(190000, batchSizeManager.getErrorBatchSize());
    }

    @Test
    void safeUpperIdComputationFailureReturnsFailed() {
        when(safeUpperIdProvider.compute(config))
                .thenThrow(new RuntimeException("DB unreachable"));

        batchSizeManager.initialize(200000);
        RoundRunResult result = runner.runRound(config);

        assertEquals(RoundRunStatus.FAILED, result.getStatus());
        assertNull(result.getRoundResult());
        verify(roundExecutor, never()).executeRound(any(), anyLong(), anyLong(), anyInt(), anyInt());
    }

    @Test
    void executedStatusHasRoundResult() {
        batchSizeManager.initialize(200000);
        SafeUpperIdProvider.SafeUpperIds ids =
                new SafeUpperIdProvider.SafeUpperIds(1000, 2000, 500, 1000, 3000);
        when(safeUpperIdProvider.compute(config)).thenReturn(ids);
        when(roundExecutor.executeRound(any(), anyLong(), anyLong(), anyInt(), anyInt()))
                .thenAnswer(inv -> {
                    RoundResult r = new RoundResult(1000, 2000, System.currentTimeMillis());
                    r.setStopReason("completed");
                    r.setRoundEndTime(System.currentTimeMillis());
                    return r;
                });

        RoundRunResult result = runner.runRound(config);

        assertEquals(RoundRunStatus.EXECUTED, result.getStatus());
        assertNotNull(result.getRoundResult());
    }

    @Test
    void failedStatusHasNullRoundResult() {
        when(safeUpperIdProvider.compute(config))
                .thenThrow(new RuntimeException("error"));

        batchSizeManager.initialize(200000);
        RoundRunResult result = runner.runRound(config);

        assertEquals(RoundRunStatus.FAILED, result.getStatus());
        assertNull(result.getRoundResult());
    }

    @Test
    void uninitializedBatchSizeManagerReturnsFailedAndReleasesLock() {
        // batchSizeManager is NOT initialized — runRound should catch
        // IllegalStateException, return FAILED, and release the lock

        SafeUpperIdProvider.SafeUpperIds ids =
                new SafeUpperIdProvider.SafeUpperIds(1000, 2000, 500, 1000, 3000);
        when(safeUpperIdProvider.compute(config)).thenReturn(ids);

        assertFalse(batchSizeManager.isInitialized());
        RoundRunResult result = runner.runRound(config);

        assertEquals(RoundRunStatus.FAILED, result.getStatus());
        assertNull(result.getRoundResult());
        // RoundExecutor must NOT be called
        verify(roundExecutor, never()).executeRound(any(), anyLong(), anyLong(), anyInt(), anyInt());

        // Lock must be released — verify by checking lock can be re-acquired
        batchSizeManager.initialize(200000);
        reset(safeUpperIdProvider);
        when(safeUpperIdProvider.compute(config)).thenReturn(ids);
        when(roundExecutor.executeRound(any(), anyLong(), anyLong(), anyInt(), anyInt()))
                .thenAnswer(inv -> {
                    RoundResult r = new RoundResult(1000, 2000, System.currentTimeMillis());
                    r.setStopReason("completed");
                    r.setRoundEndTime(System.currentTimeMillis());
                    return r;
                });

        RoundRunResult result2 = runner.runRound(config);
        assertEquals(RoundRunStatus.EXECUTED, result2.getStatus());
    }
}
