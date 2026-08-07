package com.bsoft.cdcconfig.largescreen.stats.lifecycle;

import com.bsoft.cdcconfig.largescreen.stats.dto.RoundResult;

/**
 * 一轮运行结果值对象，包含运行状态和可选的 RoundResult。
 */
public class RoundRunResult {

    private final RoundRunStatus status;
    private final RoundResult roundResult;

    public RoundRunResult(RoundRunStatus status, RoundResult roundResult) {
        this.status = status;
        this.roundResult = roundResult;
    }

    public RoundRunStatus getStatus() { return status; }
    public RoundResult getRoundResult() { return roundResult; }

    @Override
    public String toString() {
        return "RoundRunResult{status=" + status
                + ", roundResult=" + (roundResult != null ? roundResult.getStopReason() : "null") + '}';
    }
}
