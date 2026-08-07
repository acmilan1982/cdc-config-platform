package com.bsoft.cdcconfig.largescreen.stats.algorithm;

import com.bsoft.cdcconfig.largescreen.stats.config.DimKeyBuilder;
import com.bsoft.cdcconfig.largescreen.stats.dto.BatchAggregationResult;
import com.bsoft.cdcconfig.largescreen.stats.dto.LogRecordProjection;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Component;

import java.time.Instant;
import java.time.LocalDate;
import java.time.ZoneId;
import java.util.ArrayList;
import java.util.Date;
import java.util.List;
import java.util.function.Consumer;

/**
 * 单遍聚合器：一批日志 → 四类结果增量 Map + 元数据。
 * 一次遍历完成所有四类结果和三个维度的聚合。
 */
@Component
public class BatchAggregator {

    private static final Logger log = LoggerFactory.getLogger(BatchAggregator.class);

    private static final ZoneId ZONE_SHANGHAI = ZoneId.of("Asia/Shanghai");

    /** 每批最多记录的 WARN 样本 ID 数。 */
    private static final int MAX_WARN_SAMPLES = 5;

    /**
     * 对单批日志执行单遍聚合。
     *
     * @param taskCode  任务代码
     * @param logType   CORRECT 或 ERROR
     * @param logRecords 本批日志投影
     * @return 聚合结果
     */
    public BatchAggregationResult aggregate(String taskCode, String logType,
                                             List<LogRecordProjection> logRecords) {
        if (logType == null || (!"CORRECT".equals(logType) && !"ERROR".equals(logType))) {
            throw new IllegalArgumentException(
                    "logType must be CORRECT or ERROR, got: " + logType);
        }

        if (logRecords.isEmpty()) {
            return new BatchAggregationResult(0);
        }

        boolean isCorrect = "CORRECT".equals(logType);
        long maxLogId = 0;
        int dualNullCount = 0;
        List<Long> dualNullIds = new ArrayList<>(MAX_WARN_SAMPLES);
        Date minEffective = null;
        Date maxEffective = null;

        BatchAggregationResult result = new BatchAggregationResult(0);

        for (LogRecordProjection rec : logRecords) {
            // 记录本批最大 ID
            if (rec.getCdcLogId() > maxLogId) {
                maxLogId = rec.getCdcLogId();
            }

            // 成功/错误增量
            long successInc = isCorrect ? 1 : 0;
            long errorInc = isCorrect ? 0 : 1;

            // 时间
            Date effectiveTime = rec.getTargetTime() != null
                    ? rec.getTargetTime() : rec.getInsertTime();

            if (effectiveTime != null) {
                if (minEffective == null || effectiveTime.before(minEffective)) {
                    minEffective = effectiveTime;
                }
                if (maxEffective == null || effectiveTime.after(maxEffective)) {
                    maxEffective = effectiveTime;
                }
            }

            // 累计总览（始终计入）
            result.addCumulative(taskCode, successInc, errorInc);

            // 每日 & 维度
            if (effectiveTime != null) {
                LocalDate statDate = Instant.ofEpochMilli(effectiveTime.getTime())
                        .atZone(ZONE_SHANGHAI).toLocalDate();
                // 转为 java.sql.Date（Oracle DATE 自然日）
                java.sql.Date sqlDate = java.sql.Date.valueOf(statDate);

                // 每日总览
                String dailyKey = taskCode + "|" + statDate;
                result.addDaily(dailyKey, successInc, errorInc);

                // 维度累计 + 维度每日
                addDimensions(result, rec, taskCode, sqlDate, successInc, errorInc);
            } else {
                dualNullCount++;
                if (dualNullIds.size() < MAX_WARN_SAMPLES) {
                    dualNullIds.add(rec.getCdcLogId());
                }
                // 两个时间都为 null：仍计入累计维度，不计入每日维度
                addDimensionsCumulativeOnly(result, rec, taskCode, successInc, errorInc);
            }

            result.setTotalSuccessIncrement(result.getTotalSuccessIncrement() + successInc);
            result.setTotalErrorIncrement(result.getTotalErrorIncrement() + errorInc);
        }

        result.setMaxLogId(maxLogId);
        result.setTotalRowCount(logRecords.size());
        result.setDualNullCount(dualNullCount);
        result.setMinEffectiveTime(minEffective);
        result.setMaxEffectiveTime(maxEffective);

        if (dualNullCount > 0) {
            log.warn("Batch complete: {} rows, {} dual-null time records. "
                            + "Sample CDC_LOG_IDs: {}",
                    logRecords.size(), dualNullCount, dualNullIds);
        }

        return result;
    }

    /**
     * 流式聚合：通过 Consumer 回调逐行消费，不持有完整 List。
     * 生产路径使用此方法。
     *
     * @param taskCode       任务代码
     * @param logType        日志类型（CORRECT / ERROR）
     * @param sourceProvider 接收一个 Consumer&lt;LogRecordProjection&gt;，
     *                       在此 Consumer 被调用期间逐行消费所有记录
     * @return 聚合结果
     */
    public BatchAggregationResult aggregateStreaming(String taskCode, String logType,
                                                      Consumer<Consumer<LogRecordProjection>> sourceProvider) {
        if (logType == null || (!"CORRECT".equals(logType) && !"ERROR".equals(logType))) {
            throw new IllegalArgumentException(
                    "logType must be CORRECT or ERROR, got: " + logType);
        }

        boolean isCorrect = "CORRECT".equals(logType);
        BatchAggregationResult result = new BatchAggregationResult(0);
        long[] maxLogId = {0};
        int[] dualNullCount = {0};
        int[] rowCount = {0};
        List<Long> dualNullIds = new ArrayList<>(MAX_WARN_SAMPLES);
        Date[] minEffective = {null};
        Date[] maxEffective = {null};

        sourceProvider.accept(rec -> {
            rowCount[0]++;

            if (rec.getCdcLogId() > maxLogId[0]) {
                maxLogId[0] = rec.getCdcLogId();
            }

            long successInc = isCorrect ? 1 : 0;
            long errorInc = isCorrect ? 0 : 1;

            Date effectiveTime = rec.getTargetTime() != null
                    ? rec.getTargetTime() : rec.getInsertTime();

            if (effectiveTime != null) {
                if (minEffective[0] == null || effectiveTime.before(minEffective[0])) {
                    minEffective[0] = effectiveTime;
                }
                if (maxEffective[0] == null || effectiveTime.after(maxEffective[0])) {
                    maxEffective[0] = effectiveTime;
                }
            }

            // 累计总览
            result.addCumulative(taskCode, successInc, errorInc);

            if (effectiveTime != null) {
                LocalDate statDate = Instant.ofEpochMilli(effectiveTime.getTime())
                        .atZone(ZONE_SHANGHAI).toLocalDate();
                java.sql.Date sqlDate = java.sql.Date.valueOf(statDate);

                String dailyKey = taskCode + "|" + statDate;
                result.addDaily(dailyKey, successInc, errorInc);

                addDimensions(result, rec, taskCode, sqlDate, successInc, errorInc);
            } else {
                dualNullCount[0]++;
                if (dualNullIds.size() < MAX_WARN_SAMPLES) {
                    dualNullIds.add(rec.getCdcLogId());
                }
                addDimensionsCumulativeOnly(result, rec, taskCode, successInc, errorInc);
            }

            result.setTotalSuccessIncrement(result.getTotalSuccessIncrement() + successInc);
            result.setTotalErrorIncrement(result.getTotalErrorIncrement() + errorInc);
        });

        result.setMaxLogId(maxLogId[0]);
        result.setTotalRowCount(rowCount[0]);
        result.setDualNullCount(dualNullCount[0]);
        result.setMinEffectiveTime(minEffective[0]);
        result.setMaxEffectiveTime(maxEffective[0]);

        if (dualNullCount[0] > 0) {
            log.warn("Batch complete: {} rows, {} dual-null time records. "
                            + "Sample CDC_LOG_IDs: {}",
                    rowCount[0], dualNullCount[0], dualNullIds);
        }

        if (rowCount[0] == 0) {
            return new BatchAggregationResult(0);
        }

        return result;
    }

    private void addDimensions(BatchAggregationResult result, LogRecordProjection rec,
                                String taskCode, java.sql.Date statDate,
                                long successInc, long errorInc) {
        String srcDim = DimKeyBuilder.buildSourceDimKey(rec.getSourceDataSourceId());
        String tgtDim = DimKeyBuilder.buildTargetDbDimKey(rec.getTargetDataSourceId());
        String tblDim = DimKeyBuilder.buildTableDimKey(
                rec.getSourceDataSourceId(), rec.getSourceSchemaName(),
                rec.getSourceTableName());

        // 累计维度
        result.addDimCumulative(taskCode + "|SOURCE_DATA_SOURCE|" + srcDim, successInc, errorInc);
        result.addDimCumulative(taskCode + "|TARGET_DB|" + tgtDim, successInc, errorInc);
        result.addDimCumulative(taskCode + "|TABLE|" + tblDim, successInc, errorInc);

        // 每日维度
        String dateStr = statDate.toString();
        result.addDimDaily(taskCode + "|SOURCE_DATA_SOURCE|" + srcDim + "|" + dateStr,
                successInc, errorInc);
        result.addDimDaily(taskCode + "|TARGET_DB|" + tgtDim + "|" + dateStr,
                successInc, errorInc);
        result.addDimDaily(taskCode + "|TABLE|" + tblDim + "|" + dateStr,
                successInc, errorInc);
    }

    private void addDimensionsCumulativeOnly(BatchAggregationResult result,
                                              LogRecordProjection rec,
                                              String taskCode,
                                              long successInc, long errorInc) {
        String srcDim = DimKeyBuilder.buildSourceDimKey(rec.getSourceDataSourceId());
        String tgtDim = DimKeyBuilder.buildTargetDbDimKey(rec.getTargetDataSourceId());
        String tblDim = DimKeyBuilder.buildTableDimKey(
                rec.getSourceDataSourceId(), rec.getSourceSchemaName(),
                rec.getSourceTableName());

        result.addDimCumulative(taskCode + "|SOURCE_DATA_SOURCE|" + srcDim, successInc, errorInc);
        result.addDimCumulative(taskCode + "|TARGET_DB|" + tgtDim, successInc, errorInc);
        result.addDimCumulative(taskCode + "|TABLE|" + tblDim, successInc, errorInc);
    }

    public BatchAggregationResult empty() {
        return new BatchAggregationResult(0);
    }
}
