package com.bsoft.cdcconfig.largescreen.stats.dto;

import java.util.Date;
import java.util.LinkedHashMap;
import java.util.Map;

/**
 * 单批聚合结果：包含四类增量和本轮实际最大CDC_LOG_ID。
 */
public class BatchAggregationResult {

    /** 本批实际读取到的最大CDC_LOG_ID（候选新水位）。 */
    private long maxLogId;

    /** 累计总览增量：TASK_CODE → { successCount, errorCount } */
    private final Map<String, long[]> cumulativeIncrements = new LinkedHashMap<>();

    /** 每日总览增量：TASK_CODE|STAT_DATE → { successCount, errorCount } */
    private final Map<String, long[]> dailyIncrements = new LinkedHashMap<>();

    /** 维度累计增量：TASK_CODE|DIM_TYPE|DIM_VALUE → { successCount, errorCount } */
    private final Map<String, long[]> dimCumulativeIncrements = new LinkedHashMap<>();

    /** 维度每日增量：TASK_CODE|DIM_TYPE|DIM_VALUE|STAT_DATE → { successCount, errorCount } */
    private final Map<String, long[]> dimDailyIncrements = new LinkedHashMap<>();

    private int totalRowCount;
    private int dualNullCount;
    private long totalSuccessIncrement;
    private long totalErrorIncrement;
    private Date minEffectiveTime;
    private Date maxEffectiveTime;

    public BatchAggregationResult(long maxLogId) {
        this.maxLogId = maxLogId;
    }

    public long getMaxLogId() { return maxLogId; }
    public void setMaxLogId(long v) { this.maxLogId = v; }

    public void addCumulative(String taskCode, long successInc, long errorInc) {
        cumulativeIncrements.merge(taskCode, new long[]{successInc, errorInc},
                (a, b) -> new long[]{a[0] + b[0], a[1] + b[1]});
    }

    public void addDaily(String key, long successInc, long errorInc) {
        dailyIncrements.merge(key, new long[]{successInc, errorInc},
                (a, b) -> new long[]{a[0] + b[0], a[1] + b[1]});
    }

    public void addDimCumulative(String key, long successInc, long errorInc) {
        dimCumulativeIncrements.merge(key, new long[]{successInc, errorInc},
                (a, b) -> new long[]{a[0] + b[0], a[1] + b[1]});
    }

    public void addDimDaily(String key, long successInc, long errorInc) {
        dimDailyIncrements.merge(key, new long[]{successInc, errorInc},
                (a, b) -> new long[]{a[0] + b[0], a[1] + b[1]});
    }

    public Map<String, long[]> getCumulativeIncrements() { return cumulativeIncrements; }
    public Map<String, long[]> getDailyIncrements() { return dailyIncrements; }
    public Map<String, long[]> getDimCumulativeIncrements() { return dimCumulativeIncrements; }
    public Map<String, long[]> getDimDailyIncrements() { return dimDailyIncrements; }

    public int getTotalRowCount() { return totalRowCount; }
    public void setTotalRowCount(int v) { this.totalRowCount = v; }
    public int getDualNullCount() { return dualNullCount; }
    public void setDualNullCount(int v) { this.dualNullCount = v; }
    public long getTotalSuccessIncrement() { return totalSuccessIncrement; }
    public void setTotalSuccessIncrement(long v) { this.totalSuccessIncrement = v; }
    public long getTotalErrorIncrement() { return totalErrorIncrement; }
    public void setTotalErrorIncrement(long v) { this.totalErrorIncrement = v; }
    public Date getMinEffectiveTime() { return minEffectiveTime; }
    public void setMinEffectiveTime(Date v) { this.minEffectiveTime = v; }
    public Date getMaxEffectiveTime() { return maxEffectiveTime; }
    public void setMaxEffectiveTime(Date v) { this.maxEffectiveTime = v; }
}
