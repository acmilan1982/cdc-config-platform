package com.bsoft.cdcconfig.largescreen.stats.dto;

import java.util.ArrayList;
import java.util.List;

/**
 * 完整一轮执行结果。
 */
public class RoundResult {

    private final long correctSafeUpperId;
    private final long errorSafeUpperId;
    private final long roundStartTime;
    private long roundEndTime;
    private String stopReason;
    private final List<BatchResult> correctBatches = new ArrayList<>();
    private final List<BatchResult> errorBatches = new ArrayList<>();
    private boolean correctCaughtUp;
    private boolean errorCaughtUp;
    private boolean correctFailed;
    private boolean errorFailed;
    private long correctStartWatermark;
    private long correctEndWatermark;
    private long errorStartWatermark;
    private long errorEndWatermark;
    private long totalCorrectProcessed;
    private long totalErrorProcessed;

    public RoundResult(long correctSafeUpperId, long errorSafeUpperId, long roundStartTime) {
        this.correctSafeUpperId = correctSafeUpperId;
        this.errorSafeUpperId = errorSafeUpperId;
        this.roundStartTime = roundStartTime;
        this.roundEndTime = roundStartTime;
    }

    public void addCorrectBatch(BatchResult r) { correctBatches.add(r); }
    public void addErrorBatch(BatchResult r) { errorBatches.add(r); }

    public long getCorrectSafeUpperId() { return correctSafeUpperId; }
    public long getErrorSafeUpperId() { return errorSafeUpperId; }
    /** @deprecated kept for backward compatibility with TASK 3 tests */
    @Deprecated
    public long getSafeUpperId() { return correctSafeUpperId; }
    public long getRoundStartTime() { return roundStartTime; }
    public long getRoundEndTime() { return roundEndTime; }
    public void setRoundEndTime(long v) { this.roundEndTime = v; }
    public String getStopReason() { return stopReason; }
    public void setStopReason(String v) { this.stopReason = v; }
    public List<BatchResult> getCorrectBatches() { return correctBatches; }
    public List<BatchResult> getErrorBatches() { return errorBatches; }
    public boolean isCorrectCaughtUp() { return correctCaughtUp; }
    public void setCorrectCaughtUp(boolean v) { this.correctCaughtUp = v; }
    public boolean isErrorCaughtUp() { return errorCaughtUp; }
    public void setErrorCaughtUp(boolean v) { this.errorCaughtUp = v; }
    public boolean isCorrectFailed() { return correctFailed; }
    public void setCorrectFailed(boolean v) { this.correctFailed = v; }
    public boolean isErrorFailed() { return errorFailed; }
    public void setErrorFailed(boolean v) { this.errorFailed = v; }
    public long getCorrectStartWatermark() { return correctStartWatermark; }
    public void setCorrectStartWatermark(long v) { this.correctStartWatermark = v; }
    public long getCorrectEndWatermark() { return correctEndWatermark; }
    public void setCorrectEndWatermark(long v) { this.correctEndWatermark = v; }
    public long getErrorStartWatermark() { return errorStartWatermark; }
    public void setErrorStartWatermark(long v) { this.errorStartWatermark = v; }
    public long getErrorEndWatermark() { return errorEndWatermark; }
    public void setErrorEndWatermark(long v) { this.errorEndWatermark = v; }
    public long getTotalCorrectProcessed() { return totalCorrectProcessed; }
    public void setTotalCorrectProcessed(long v) { this.totalCorrectProcessed = v; }
    public long getTotalErrorProcessed() { return totalErrorProcessed; }
    public void setTotalErrorProcessed(long v) { this.totalErrorProcessed = v; }

    public boolean isPartialFailure() { return correctFailed || errorFailed; }
    public boolean isAllCaughtUp() { return correctCaughtUp && errorCaughtUp; }

    public int getTotalCorrectBatches() { return correctBatches.size(); }
    public int getTotalErrorBatches() { return errorBatches.size(); }

    @Override
    public String toString() {
        return "RoundResult{correctSafeUpperId=" + correctSafeUpperId
                + ", errorSafeUpperId=" + errorSafeUpperId
                + ", correctBatches=" + correctBatches.size()
                + ", errorBatches=" + errorBatches.size()
                + ", correctCaughtUp=" + correctCaughtUp
                + ", errorCaughtUp=" + errorCaughtUp
                + ", correctFailed=" + correctFailed
                + ", errorFailed=" + errorFailed
                + ", stopReason=" + stopReason + '}';
    }
}
