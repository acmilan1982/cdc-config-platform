package com.bsoft.cdcconfig.largescreen.stats.dto;

/**
 * 单批执行结果。
 */
public class BatchResult {

    public static final BatchResult EMPTY = createEmpty();

    private final boolean empty;
    private final boolean success;
    private final String logType;
    private final long oldLastLogId;
    private final long newLastLogId;
    private final int processedCount;
    private final long successIncrement;
    private final long errorIncrement;
    private final int dualNullCount;
    private final String errorMessage;

    private BatchResult(Builder builder) {
        this.empty = builder.empty;
        this.success = builder.success;
        this.logType = builder.logType;
        this.oldLastLogId = builder.oldLastLogId;
        this.newLastLogId = builder.newLastLogId;
        this.processedCount = builder.processedCount;
        this.successIncrement = builder.successIncrement;
        this.errorIncrement = builder.errorIncrement;
        this.dualNullCount = builder.dualNullCount;
        this.errorMessage = builder.errorMessage;
    }

    private static BatchResult createEmpty() {
        return new Builder().empty(true).success(true).build();
    }

    public boolean isEmpty() { return empty; }
    public boolean isSuccess() { return success; }
    public String getLogType() { return logType; }
    public long getOldLastLogId() { return oldLastLogId; }
    public long getNewLastLogId() { return newLastLogId; }
    public int getProcessedCount() { return processedCount; }
    public long getSuccessIncrement() { return successIncrement; }
    public long getErrorIncrement() { return errorIncrement; }
    public int getDualNullCount() { return dualNullCount; }
    public String getErrorMessage() { return errorMessage; }

    public static final class Builder {
        private boolean empty;
        private boolean success;
        private String logType;
        private long oldLastLogId;
        private long newLastLogId;
        private int processedCount;
        private long successIncrement;
        private long errorIncrement;
        private int dualNullCount;
        private String errorMessage;

        public Builder empty(boolean v) { this.empty = v; return this; }
        public Builder success(boolean v) { this.success = v; return this; }
        public Builder logType(String v) { this.logType = v; return this; }
        public Builder oldLastLogId(long v) { this.oldLastLogId = v; return this; }
        public Builder newLastLogId(long v) { this.newLastLogId = v; return this; }
        public Builder processedCount(int v) { this.processedCount = v; return this; }
        public Builder successIncrement(long v) { this.successIncrement = v; return this; }
        public Builder errorIncrement(long v) { this.errorIncrement = v; return this; }
        public Builder dualNullCount(int v) { this.dualNullCount = v; return this; }
        public Builder errorMessage(String v) { this.errorMessage = v; return this; }
        public BatchResult build() { return new BatchResult(this); }
    }
}
