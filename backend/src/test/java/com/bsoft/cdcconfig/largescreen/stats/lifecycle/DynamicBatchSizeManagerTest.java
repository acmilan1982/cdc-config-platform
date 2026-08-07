package com.bsoft.cdcconfig.largescreen.stats.lifecycle;

import com.bsoft.cdcconfig.largescreen.stats.dto.BatchResult;
import com.bsoft.cdcconfig.largescreen.stats.dto.RoundResult;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;

import static org.junit.jupiter.api.Assertions.*;

class DynamicBatchSizeManagerTest {

    private DynamicBatchSizeManager manager;

    @BeforeEach
    void setUp() {
        manager = new DynamicBatchSizeManager();
    }

    @Test
    void notInitializedThrowsOnGet() {
        assertThrows(IllegalStateException.class, () -> manager.getCorrectBatchSize());
    }

    @Test
    void notInitializedThrowsOnAdjust() {
        RoundResult result = new RoundResult(1000, 2000, System.currentTimeMillis());
        assertThrows(IllegalStateException.class, () -> manager.adjust(result, 10));
    }

    @Test
    void initializeSetsBothStreamsToSameValue() {
        manager.initialize(200000);
        assertEquals(200000, manager.getCorrectBatchSize());
        assertEquals(200000, manager.getErrorBatchSize());
        assertTrue(manager.isInitialized());
    }

    @Test
    void initializeIsIdempotentWithSameValue() {
        manager.initialize(200000);
        manager.initialize(200000);
        assertEquals(200000, manager.getCorrectBatchSize());
        assertEquals(200000, manager.getErrorBatchSize());
    }

    @Test
    void initializeThrowsWithDifferentValue() {
        manager.initialize(200000);
        assertThrows(IllegalStateException.class, () -> manager.initialize(300000));
        assertEquals(200000, manager.getCorrectBatchSize());
    }

    // ---- increase tests ----

    @Test
    void increaseWhenBacklogAndBatchLimitReached() {
        manager.initialize(200000);
        long now = System.currentTimeMillis();
        RoundResult result = new RoundResult(5000, 5000, now);
        result.setStopReason("completed");
        result.setRoundEndTime(now + 1000);

        for (int i = 0; i < 10; i++) {
            result.addCorrectBatch(new BatchResult.Builder()
                    .success(true).logType("CORRECT")
                    .oldLastLogId(i * 100).newLastLogId((i + 1) * 100)
                    .processedCount(100).build());
        }
        result.setCorrectCaughtUp(false);
        result.setCorrectFailed(false);
        result.setErrorCaughtUp(true);

        manager.adjust(result, 10);

        assertEquals(210000, manager.getCorrectBatchSize());
        assertEquals(200000, manager.getErrorBatchSize()); // ERROR unchanged
    }

    @Test
    void noAdjustWhenCaughtUp() {
        manager.initialize(200000);
        RoundResult result = new RoundResult(5000, 5000, System.currentTimeMillis());
        result.setStopReason("completed");
        result.setRoundEndTime(System.currentTimeMillis());
        result.setCorrectCaughtUp(true);
        result.setErrorCaughtUp(true);

        manager.adjust(result, 10);

        assertEquals(200000, manager.getCorrectBatchSize());
        assertEquals(200000, manager.getErrorBatchSize());
    }

    @Test
    void noIncreaseWhenFailed() {
        manager.initialize(200000);
        RoundResult result = new RoundResult(5000, 5000, System.currentTimeMillis());
        result.setStopReason("completed");
        result.setRoundEndTime(System.currentTimeMillis());
        result.setCorrectFailed(true);
        result.setCorrectCaughtUp(false);
        for (int i = 0; i < 10; i++) {
            result.addCorrectBatch(new BatchResult.Builder()
                    .success(true).logType("CORRECT").processedCount(100).build());
        }

        manager.adjust(result, 10);

        assertEquals(200000, manager.getCorrectBatchSize());
    }

    @Test
    void noIncreaseForEmptyBatch() {
        manager.initialize(200000);
        RoundResult result = new RoundResult(5000, 5000, System.currentTimeMillis());
        result.setStopReason("all_caught_up");
        result.setRoundEndTime(System.currentTimeMillis());
        result.setCorrectCaughtUp(true);
        result.setErrorCaughtUp(true);

        manager.adjust(result, 10);

        assertEquals(200000, manager.getCorrectBatchSize());
    }

    @Test
    void increaseUsesPassedMaxBatchesPerRun() {
        manager.initialize(200000);
        long now = System.currentTimeMillis();
        RoundResult result = new RoundResult(5000, 5000, now);
        result.setStopReason("completed");
        result.setRoundEndTime(now + 1000);
        result.setCorrectCaughtUp(false);
        result.setCorrectFailed(false);
        // 5 batches >= maxBatchesPerRun=5 → increase
        for (int i = 0; i < 5; i++) {
            result.addCorrectBatch(new BatchResult.Builder()
                    .success(true).logType("CORRECT").processedCount(100).build());
        }
        result.setErrorCaughtUp(true);

        manager.adjust(result, 5);
        assertEquals(210000, manager.getCorrectBatchSize());

        // Same 5 batches < maxBatchesPerRun=10 → no increase
        manager = new DynamicBatchSizeManager();
        manager.initialize(200000);
        manager.adjust(result, 10);
        assertEquals(200000, manager.getCorrectBatchSize());
    }

    // ---- per-stream decrease tests ----

    @Test
    void correctCausesTimeoutAndStillHasBacklogOnlyCorrectDecreases() {
        manager.initialize(200000);
        long now = System.currentTimeMillis();
        RoundResult result = new RoundResult(5000, 5000, now);
        result.setStopReason("time_limit_reached");
        result.setRoundEndTime(now + 1000);

        // CORRECT: 3 non-empty batches, not caught up, not failed → should decrease
        for (int i = 0; i < 3; i++) {
            result.addCorrectBatch(new BatchResult.Builder()
                    .success(true).logType("CORRECT").processedCount(100).build());
        }
        result.setCorrectCaughtUp(false);
        result.setCorrectFailed(false);

        // ERROR: caught up → should NOT decrease
        result.setErrorCaughtUp(true);
        result.setErrorFailed(false);

        manager.adjust(result, 10);

        assertEquals(190000, manager.getCorrectBatchSize());
        assertEquals(200000, manager.getErrorBatchSize()); // unchanged
    }

    @Test
    void errorCausesTimeoutAndStillHasBacklogOnlyErrorDecreases() {
        manager.initialize(200000);
        long now = System.currentTimeMillis();
        RoundResult result = new RoundResult(5000, 5000, now);
        result.setStopReason("time_limit_reached");
        result.setRoundEndTime(now + 1000);

        // CORRECT: caught up → should NOT decrease
        result.setCorrectCaughtUp(true);
        result.setCorrectFailed(false);

        // ERROR: 3 non-empty batches, not caught up, not failed → should decrease
        for (int i = 0; i < 3; i++) {
            result.addErrorBatch(new BatchResult.Builder()
                    .success(true).logType("ERROR").processedCount(100).build());
        }
        result.setErrorCaughtUp(false);
        result.setErrorFailed(false);

        manager.adjust(result, 10);

        assertEquals(200000, manager.getCorrectBatchSize()); // unchanged
        assertEquals(190000, manager.getErrorBatchSize());
    }

    @Test
    void caughtUpStreamDoesNotDecreaseWhenOtherStreamCausesTimeout() {
        manager.initialize(200000);
        long now = System.currentTimeMillis();
        RoundResult result = new RoundResult(5000, 5000, now);
        result.setStopReason("time_limit_reached");
        result.setRoundEndTime(now + 1000);

        // CORRECT: caught up, no batches → should NOT decrease
        result.setCorrectCaughtUp(true);
        result.setCorrectFailed(false);

        // ERROR: has batches, not caught up → should decrease
        result.addErrorBatch(new BatchResult.Builder()
                .success(true).logType("ERROR").processedCount(100).build());
        result.setErrorCaughtUp(false);
        result.setErrorFailed(false);

        manager.adjust(result, 10);

        assertEquals(200000, manager.getCorrectBatchSize());
        assertEquals(190000, manager.getErrorBatchSize());
    }

    @Test
    void streamWithZeroBatchesDoesNotDecreaseWhenTimeout() {
        manager.initialize(200000);
        long now = System.currentTimeMillis();
        RoundResult result = new RoundResult(5000, 5000, now);
        result.setStopReason("time_limit_reached");
        result.setRoundEndTime(now + 1000);

        // CORRECT: 0 batches (not executed this round) → should NOT decrease
        result.setCorrectCaughtUp(false);
        result.setCorrectFailed(false);

        // ERROR: has batches, not caught up → should decrease
        result.addErrorBatch(new BatchResult.Builder()
                .success(true).logType("ERROR").processedCount(100).build());
        result.setErrorCaughtUp(false);
        result.setErrorFailed(false);

        manager.adjust(result, 10);

        assertEquals(200000, manager.getCorrectBatchSize());
        assertEquals(190000, manager.getErrorBatchSize());
    }

    @Test
    void emptyStreamDoesNotDecreaseWhenTimeout() {
        manager.initialize(200000);
        long now = System.currentTimeMillis();
        RoundResult result = new RoundResult(5000, 5000, now);
        result.setStopReason("time_limit_reached");
        result.setRoundEndTime(now + 1000);

        // CORRECT: 1 empty batch (caught up first batch) → should NOT decrease
        result.addCorrectBatch(BatchResult.EMPTY);
        result.setCorrectCaughtUp(true);
        result.setCorrectFailed(false);

        // ERROR: has batches, not caught up → should decrease
        result.addErrorBatch(new BatchResult.Builder()
                .success(true).logType("ERROR").processedCount(100).build());
        result.setErrorCaughtUp(false);
        result.setErrorFailed(false);

        manager.adjust(result, 10);

        assertEquals(200000, manager.getCorrectBatchSize());
        assertEquals(190000, manager.getErrorBatchSize());
    }

    @Test
    void bothStreamsDecreaseWhenBothHaveBacklogAndTimeout() {
        manager.initialize(200000);
        long now = System.currentTimeMillis();
        RoundResult result = new RoundResult(5000, 5000, now);
        result.setStopReason("time_limit_reached");
        result.setRoundEndTime(now + 1000);

        // CORRECT: has batches, not caught up, not failed
        result.addCorrectBatch(new BatchResult.Builder()
                .success(true).logType("CORRECT").processedCount(100).build());
        result.setCorrectCaughtUp(false);
        result.setCorrectFailed(false);

        // ERROR: has batches, not caught up, not failed
        result.addErrorBatch(new BatchResult.Builder()
                .success(true).logType("ERROR").processedCount(100).build());
        result.setErrorCaughtUp(false);
        result.setErrorFailed(false);

        manager.adjust(result, 10);

        assertEquals(190000, manager.getCorrectBatchSize());
        assertEquals(190000, manager.getErrorBatchSize());
    }

    @Test
    void decreaseDoesNotGoBelowMinimum() {
        manager.initialize(50000); // at minimum
        long now = System.currentTimeMillis();
        RoundResult result = new RoundResult(5000, 5000, now);
        result.setStopReason("time_limit_reached");
        result.setRoundEndTime(now + 1000);
        result.addCorrectBatch(new BatchResult.Builder()
                .success(true).logType("CORRECT").processedCount(100).build());
        result.setCorrectCaughtUp(false);
        result.setCorrectFailed(false);
        result.addErrorBatch(new BatchResult.Builder()
                .success(true).logType("ERROR").processedCount(100).build());
        result.setErrorCaughtUp(false);
        result.setErrorFailed(false);

        manager.adjust(result, 10);

        assertEquals(50000, manager.getCorrectBatchSize());
        assertEquals(50000, manager.getErrorBatchSize());
    }

    @Test
    void increaseDoesNotExceedMaximum() {
        manager.initialize(500000);
        long now = System.currentTimeMillis();
        RoundResult result = new RoundResult(5000, 5000, now);
        result.setStopReason("completed");
        result.setRoundEndTime(now + 1000);
        result.setCorrectCaughtUp(false);
        result.setCorrectFailed(false);
        for (int i = 0; i < 10; i++) {
            result.addCorrectBatch(new BatchResult.Builder()
                    .success(true).logType("CORRECT").processedCount(100).build());
        }
        result.setErrorCaughtUp(true);

        manager.adjust(result, 10);

        assertEquals(500000, manager.getCorrectBatchSize());
    }

    @Test
    void failedStreamDoesNotDecreaseWhenTimeout() {
        manager.initialize(200000);
        long now = System.currentTimeMillis();
        RoundResult result = new RoundResult(5000, 5000, now);
        result.setStopReason("time_limit_reached");
        result.setRoundEndTime(now + 1000);

        // CORRECT: failed → should NOT decrease (failure != backlog)
        result.setCorrectFailed(true);
        result.setCorrectCaughtUp(false);

        // ERROR: has work, not failed, not caught up → should decrease
        result.addErrorBatch(new BatchResult.Builder()
                .success(true).logType("ERROR").processedCount(100).build());
        result.setErrorCaughtUp(false);
        result.setErrorFailed(false);

        manager.adjust(result, 10);

        assertEquals(200000, manager.getCorrectBatchSize());
        assertEquals(190000, manager.getErrorBatchSize());
    }
}
