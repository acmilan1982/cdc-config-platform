package com.bsoft.cdcconfig.largescreen.stats.config;

/**
 * 不可变统计任务配置值对象。
 * 由 TASK 4 在应用启动时从 CDC_STATS_TASK_CONFIG 读取并构造。
 */
public final class StatsTaskConfig {

    private final String taskCode;
    private final String taskName;
    private final int enabled;
    private final int startupDelayMinutes;
    private final int scheduleIntervalMinutes;
    private final int safetyDelayMinutes;
    private final int batchSize;
    private final int maxBatchesPerRun;
    private final int maxRunDurationSeconds;

    private StatsTaskConfig(Builder builder) {
        this.taskCode = builder.taskCode;
        this.taskName = builder.taskName;
        this.enabled = builder.enabled;
        this.startupDelayMinutes = builder.startupDelayMinutes;
        this.scheduleIntervalMinutes = builder.scheduleIntervalMinutes;
        this.safetyDelayMinutes = builder.safetyDelayMinutes;
        this.batchSize = builder.batchSize;
        this.maxBatchesPerRun = builder.maxBatchesPerRun;
        this.maxRunDurationSeconds = builder.maxRunDurationSeconds;
        validate();
    }

    private void validate() {
        if (taskCode == null || taskCode.trim().isEmpty()) {
            throw new IllegalArgumentException("taskCode must not be empty");
        }
        if (enabled != 0 && enabled != 1) {
            throw new IllegalArgumentException("enabled must be 0 or 1");
        }
        if (startupDelayMinutes < 0 || startupDelayMinutes > 1440) {
            throw new IllegalArgumentException("startupDelayMinutes must be 0-1440");
        }
        if (scheduleIntervalMinutes < 1 || scheduleIntervalMinutes > 1440) {
            throw new IllegalArgumentException("scheduleIntervalMinutes must be 1-1440");
        }
        if (safetyDelayMinutes < 1 || safetyDelayMinutes > 1440) {
            throw new IllegalArgumentException("safetyDelayMinutes must be 1-1440");
        }
        if (batchSize < 1000 || batchSize > 1000000) {
            throw new IllegalArgumentException("batchSize must be 1000-1000000");
        }
        if (maxBatchesPerRun < 1 || maxBatchesPerRun > 100) {
            throw new IllegalArgumentException("maxBatchesPerRun must be 1-100");
        }
        if (maxRunDurationSeconds < 10 || maxRunDurationSeconds > 3600) {
            throw new IllegalArgumentException("maxRunDurationSeconds must be 10-3600");
        }
    }

    public static Builder builder() {
        return new Builder();
    }

    public String getTaskCode() { return taskCode; }
    public String getTaskName() { return taskName; }
    public int getEnabled() { return enabled; }
    public int getStartupDelayMinutes() { return startupDelayMinutes; }
    public int getScheduleIntervalMinutes() { return scheduleIntervalMinutes; }
    public int getSafetyDelayMinutes() { return safetyDelayMinutes; }
    public int getBatchSize() { return batchSize; }
    public int getMaxBatchesPerRun() { return maxBatchesPerRun; }
    public int getMaxRunDurationSeconds() { return maxRunDurationSeconds; }

    public static final class Builder {
        private String taskCode;
        private String taskName;
        private int enabled;
        private int startupDelayMinutes;
        private int scheduleIntervalMinutes;
        private int safetyDelayMinutes;
        private int batchSize;
        private int maxBatchesPerRun;
        private int maxRunDurationSeconds;

        public Builder taskCode(String v) { this.taskCode = v; return this; }
        public Builder taskName(String v) { this.taskName = v; return this; }
        public Builder enabled(int v) { this.enabled = v; return this; }
        public Builder startupDelayMinutes(int v) { this.startupDelayMinutes = v; return this; }
        public Builder scheduleIntervalMinutes(int v) { this.scheduleIntervalMinutes = v; return this; }
        public Builder safetyDelayMinutes(int v) { this.safetyDelayMinutes = v; return this; }
        public Builder batchSize(int v) { this.batchSize = v; return this; }
        public Builder maxBatchesPerRun(int v) { this.maxBatchesPerRun = v; return this; }
        public Builder maxRunDurationSeconds(int v) { this.maxRunDurationSeconds = v; return this; }
        public StatsTaskConfig build() { return new StatsTaskConfig(this); }
    }
}
