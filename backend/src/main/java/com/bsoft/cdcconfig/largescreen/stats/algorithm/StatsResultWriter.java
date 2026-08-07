package com.bsoft.cdcconfig.largescreen.stats.algorithm;

import com.bsoft.cdcconfig.largescreen.stats.dto.BatchAggregationResult;
import com.bsoft.cdcconfig.largescreen.stats.mapper.CumulativeOverviewMapper;
import com.bsoft.cdcconfig.largescreen.stats.mapper.DailyOverviewMapper;
import com.bsoft.cdcconfig.largescreen.stats.mapper.DimCumulativeMapper;
import com.bsoft.cdcconfig.largescreen.stats.mapper.DimDailyMapper;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Component;

import java.sql.Date;
import java.time.LocalDate;
import java.util.Map;

/**
 * 四类结果表原子 MERGE 写入。
 * 每张表独立 MERGE，任一步失败即抛异常触发事务回滚。
 */
@Component
public class StatsResultWriter {

    private static final Logger log = LoggerFactory.getLogger(StatsResultWriter.class);

    private static final String SEP = "|";

    private final CumulativeOverviewMapper cumulativeOverviewMapper;
    private final DailyOverviewMapper dailyOverviewMapper;
    private final DimCumulativeMapper dimCumulativeMapper;
    private final DimDailyMapper dimDailyMapper;

    public StatsResultWriter(CumulativeOverviewMapper cumulativeOverviewMapper,
                              DailyOverviewMapper dailyOverviewMapper,
                              DimCumulativeMapper dimCumulativeMapper,
                              DimDailyMapper dimDailyMapper) {
        this.cumulativeOverviewMapper = cumulativeOverviewMapper;
        this.dailyOverviewMapper = dailyOverviewMapper;
        this.dimCumulativeMapper = dimCumulativeMapper;
        this.dimDailyMapper = dimDailyMapper;
    }

    /**
     * 将单批聚合结果原子的累加到四张结果表。
     *
     * @param taskCode 任务代码
     * @param batchId  批次标识
     * @param result   聚合增量结果
     */
    public void mergeAll(String taskCode, String batchId, BatchAggregationResult result) {
        // 1. 累计总览
        for (Map.Entry<String, long[]> entry : result.getCumulativeIncrements().entrySet()) {
            long[] inc = entry.getValue();
            if (inc[0] > 0 || inc[1] > 0) {
                cumulativeOverviewMapper.mergeIncrement(taskCode, inc[0], inc[1], batchId);
            }
        }

        // 2. 每日总览
        for (Map.Entry<String, long[]> entry : result.getDailyIncrements().entrySet()) {
            long[] inc = entry.getValue();
            if (inc[0] > 0 || inc[1] > 0) {
                String key = entry.getKey();
                // key format: taskCode|statDate (yyyy-MM-dd)
                int sepIdx = key.indexOf(SEP);
                LocalDate localDate = LocalDate.parse(key.substring(sepIdx + 1));
                Date statDate = Date.valueOf(localDate);
                dailyOverviewMapper.mergeIncrement(taskCode, statDate, inc[0], inc[1], batchId);
            }
        }

        // 3. 维度累计
        for (Map.Entry<String, long[]> entry : result.getDimCumulativeIncrements().entrySet()) {
            long[] inc = entry.getValue();
            if (inc[0] > 0 || inc[1] > 0) {
                String[] parts = parseDimKey(entry.getKey(), 3);
                dimCumulativeMapper.mergeIncrement(
                        taskCode, parts[1], parts[2], inc[0], inc[1], batchId);
            }
        }

        // 4. 维度每日
        for (Map.Entry<String, long[]> entry : result.getDimDailyIncrements().entrySet()) {
            long[] inc = entry.getValue();
            if (inc[0] > 0 || inc[1] > 0) {
                String[] parts = parseDimKey(entry.getKey(), 4);
                LocalDate localDate = LocalDate.parse(parts[3]);
                Date statDate = Date.valueOf(localDate);
                dimDailyMapper.mergeIncrement(
                        taskCode, parts[1], parts[2], statDate, inc[0], inc[1], batchId);
            }
        }

        log.debug("Merged batch {}: cumulative={}, daily={}, dimCum={}, dimDaily={}",
                batchId,
                result.getCumulativeIncrements().size(),
                result.getDailyIncrements().size(),
                result.getDimCumulativeIncrements().size(),
                result.getDimDailyIncrements().size());
    }

    private String[] parseDimKey(String key, int expectedParts) {
        String[] parts = key.split("\\" + SEP);
        if (parts.length != expectedParts) {
            throw new IllegalArgumentException(
                    "Invalid key format, expected " + expectedParts + " parts: " + key);
        }
        return parts;
    }
}
