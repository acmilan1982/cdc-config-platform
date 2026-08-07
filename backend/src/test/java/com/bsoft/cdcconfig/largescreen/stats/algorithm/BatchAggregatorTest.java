package com.bsoft.cdcconfig.largescreen.stats.algorithm;

import com.bsoft.cdcconfig.largescreen.stats.dto.BatchAggregationResult;
import com.bsoft.cdcconfig.largescreen.stats.dto.LogRecordProjection;
import org.junit.jupiter.api.Test;

import java.sql.Date;
import java.time.LocalDate;
import java.util.Arrays;
import java.util.Collections;

import static org.junit.jupiter.api.Assertions.*;

class BatchAggregatorTest {

    private final BatchAggregator aggregator = new BatchAggregator();

    @Test
    void correctLogAddsSuccessCount() {
        LogRecordProjection rec = makeRec(1L, date("2026-08-06"), "DS", "TG", "SC", "TB");
        BatchAggregationResult r = aggregator.aggregate("TASK", "CORRECT",
                Collections.singletonList(rec));

        assertEquals(1, r.getTotalSuccessIncrement());
        assertEquals(0, r.getTotalErrorIncrement());
        assertEquals(1, r.getTotalRowCount());
    }

    @Test
    void errorLogAddsErrorCount() {
        LogRecordProjection rec = makeRec(1L, date("2026-08-06"), "DS", "TG", "SC", "TB");
        BatchAggregationResult r = aggregator.aggregate("TASK", "ERROR",
                Collections.singletonList(rec));

        assertEquals(0, r.getTotalSuccessIncrement());
        assertEquals(1, r.getTotalErrorIncrement());
    }

    @Test
    void maxLogIdIsMaxOfBatch() {
        LogRecordProjection r1 = makeRec(100L, date("2026-08-06"), "DS", "TG", "SC", "TB");
        LogRecordProjection r2 = makeRec(200L, date("2026-08-06"), "DS", "TG", "SC", "TB");
        LogRecordProjection r3 = makeRec(150L, date("2026-08-06"), "DS", "TG", "SC", "TB");

        BatchAggregationResult r = aggregator.aggregate("TASK", "CORRECT",
                Arrays.asList(r1, r2, r3));
        assertEquals(200L, r.getMaxLogId());
    }

    @Test
    void cumulativeOverviewAlwaysPopulated() {
        LogRecordProjection rec = makeRec(1L, date("2026-08-06"), "DS", "TG", "SC", "TB");
        BatchAggregationResult r = aggregator.aggregate("TASK", "CORRECT",
                Collections.singletonList(rec));

        assertFalse(r.getCumulativeIncrements().isEmpty());
    }

    @Test
    void dailyOverviewWithEffectiveTime() {
        LogRecordProjection rec = makeRec(1L, date("2026-08-06"), "DS", "TG", "SC", "TB");
        BatchAggregationResult r = aggregator.aggregate("TASK", "CORRECT",
                Collections.singletonList(rec));

        assertEquals(1, r.getDailyIncrements().size());
        assertEquals(3, r.getDimCumulativeIncrements().size());
        assertEquals(3, r.getDimDailyIncrements().size());
    }

    @Test
    void dualNullTimeOnlyCumulative() {
        LogRecordProjection rec = makeRec(1L, null, "DS", "TG", "SC", "TB");
        rec.setTargetTime(null);
        rec.setInsertTime(null);

        BatchAggregationResult r = aggregator.aggregate("TASK", "CORRECT",
                Collections.singletonList(rec));

        // Cumulative always populated
        assertFalse(r.getCumulativeIncrements().isEmpty());
        // Daily NOT populated when both times are null
        assertTrue(r.getDailyIncrements().isEmpty());
        // Dim cumulative populated (even without time)
        assertEquals(3, r.getDimCumulativeIncrements().size());
        // Dim daily NOT populated
        assertTrue(r.getDimDailyIncrements().isEmpty());
        assertEquals(1, r.getDualNullCount());
    }

    @Test
    void targetTimePriorityOverInsertTime() {
        LogRecordProjection rec = new LogRecordProjection();
        rec.setCdcLogId(1L);
        rec.setTargetTime(date("2026-08-06"));
        rec.setInsertTime(date("2026-08-05"));
        rec.setSourceDataSourceId("DS");
        rec.setTargetDataSourceId("TG");
        rec.setSourceSchemaName("SC");
        rec.setSourceTableName("TB");

        BatchAggregationResult r = aggregator.aggregate("TASK", "CORRECT",
                Collections.singletonList(rec));

        // Should use TARGET_TIME (Aug 6), not INSERT_TIME (Aug 5)
        String dailyKeyPrefix = "TASK|2026-08-06";
        boolean hasAug6 = r.getDailyIncrements().keySet().stream()
                .anyMatch(k -> k.equals(dailyKeyPrefix));
        assertTrue(hasAug6);
    }

    @Test
    void insertTimeUsedWhenTargetTimeNull() {
        LogRecordProjection rec = new LogRecordProjection();
        rec.setCdcLogId(1L);
        rec.setTargetTime(null);
        rec.setInsertTime(date("2026-08-05"));
        rec.setSourceDataSourceId("DS");
        rec.setTargetDataSourceId("TG");
        rec.setSourceSchemaName("SC");
        rec.setSourceTableName("TB");

        BatchAggregationResult r = aggregator.aggregate("TASK", "CORRECT",
                Collections.singletonList(rec));

        // Should use INSERT_TIME (Aug 5)
        String dailyKeyPrefix = "TASK|2026-08-05";
        boolean hasAug5 = r.getDailyIncrements().keySet().stream()
                .anyMatch(k -> k.equals(dailyKeyPrefix));
        assertTrue(hasAug5);
    }

    @Test
    void multipleLogsSameDimensionsMerge() {
        LogRecordProjection r1 = makeRec(1L, date("2026-08-06"), "DS", "TG", "SC", "TB");
        LogRecordProjection r2 = makeRec(2L, date("2026-08-06"), "DS", "TG", "SC", "TB");

        BatchAggregationResult r = aggregator.aggregate("TASK", "CORRECT",
                Arrays.asList(r1, r2));

        assertEquals(2, r.getTotalRowCount());
        assertEquals(2, r.getTotalSuccessIncrement());
    }

    @Test
    void emptyBatch() {
        BatchAggregationResult r = aggregator.aggregate("TASK", "CORRECT",
                Collections.emptyList());

        assertEquals(0, r.getTotalRowCount());
        assertEquals(0, r.getTotalSuccessIncrement());
        assertEquals(0, r.getTotalErrorIncrement());
    }

    @Test
    void dimKeysUseReservedValuesForNulls() {
        LogRecordProjection rec = makeRec(1L, date("2026-08-06"), null, null, null, null);
        BatchAggregationResult r = aggregator.aggregate("TASK", "CORRECT",
                Collections.singletonList(rec));

        boolean hasUnidentifiedSource = r.getDimCumulativeIncrements().keySet().stream()
                .anyMatch(k -> k.contains("__UNIDENTIFIED_SOURCE__"));
        boolean hasUnidentifiedTarget = r.getDimCumulativeIncrements().keySet().stream()
                .anyMatch(k -> k.contains("__UNIDENTIFIED_TARGET__"));
        boolean hasUnidentifiedTable = r.getDimCumulativeIncrements().keySet().stream()
                .anyMatch(k -> k.contains("__UNIDENTIFIED_TABLE__"));

        assertTrue(hasUnidentifiedSource);
        assertTrue(hasUnidentifiedTarget);
        assertTrue(hasUnidentifiedTable);
    }

    // ---- strict logType validation ----

    @Test
    void nullLogTypeThrows() {
        LogRecordProjection rec = makeRec(1L, date("2026-08-06"), "DS", "TG", "SC", "TB");
        assertThrows(IllegalArgumentException.class, () ->
                aggregator.aggregate("TASK", null, Collections.singletonList(rec)));
    }

    @Test
    void emptyLogTypeThrows() {
        LogRecordProjection rec = makeRec(1L, date("2026-08-06"), "DS", "TG", "SC", "TB");
        assertThrows(IllegalArgumentException.class, () ->
                aggregator.aggregate("TASK", "", Collections.singletonList(rec)));
    }

    @Test
    void unknownLogTypeThrows() {
        LogRecordProjection rec = makeRec(1L, date("2026-08-06"), "DS", "TG", "SC", "TB");
        assertThrows(IllegalArgumentException.class, () ->
                aggregator.aggregate("TASK", "CORRECT_OLD", Collections.singletonList(rec)));
        assertThrows(IllegalArgumentException.class, () ->
                aggregator.aggregate("TASK", "SUCCESS", Collections.singletonList(rec)));
        assertThrows(IllegalArgumentException.class, () ->
                aggregator.aggregate("TASK", "error", Collections.singletonList(rec)));
    }

    // ---- timezone boundary ----

    @Test
    void asiaShanghaiCrossDayBoundary() {
        // 2026-08-06 16:00:00 UTC = 2026-08-07 00:00:00 Asia/Shanghai
        java.sql.Date eveningUtc = new java.sql.Date(1786041600000L);
        LogRecordProjection rec = new LogRecordProjection();
        rec.setCdcLogId(1L);
        rec.setTargetTime(eveningUtc);
        rec.setInsertTime(null);
        rec.setSourceDataSourceId("DS");
        rec.setTargetDataSourceId("TG");
        rec.setSourceSchemaName("SC");
        rec.setSourceTableName("TB");

        BatchAggregationResult r = aggregator.aggregate("TASK", "CORRECT",
                Collections.singletonList(rec));

        // Stat date should be 2026-08-07 (Shanghai), not 2026-08-06 (UTC)
        String dailyKeyAug7 = "TASK|2026-08-07";
        assertTrue(r.getDailyIncrements().containsKey(dailyKeyAug7),
                "Expected daily key for Shanghai date 2026-08-07");
    }

    @Test
    void utcDateDifferentFromShanghaiDate() {
        // 2026-08-06 00:30:00 UTC = 2026-08-06 08:30:00 Shanghai → same day
        java.sql.Date earlyUtc = new java.sql.Date(1785985800000L);
        LogRecordProjection rec = new LogRecordProjection();
        rec.setCdcLogId(1L);
        rec.setTargetTime(earlyUtc);
        rec.setInsertTime(null);
        rec.setSourceDataSourceId("DS");
        rec.setTargetDataSourceId("TG");
        rec.setSourceSchemaName("SC");
        rec.setSourceTableName("TB");

        BatchAggregationResult r = aggregator.aggregate("TASK", "CORRECT",
                Collections.singletonList(rec));

        String dailyKeyAug6 = "TASK|2026-08-06";
        assertTrue(r.getDailyIncrements().containsKey(dailyKeyAug6),
                "Expected daily key for Shanghai date 2026-08-06");

        // 2026-08-06 22:00:00 UTC = 2026-08-07 06:00:00 Shanghai → next day
        java.sql.Date lateUtc = new java.sql.Date(1786063200000L);
        LogRecordProjection rec2 = new LogRecordProjection();
        rec2.setCdcLogId(2L);
        rec2.setTargetTime(lateUtc);
        rec2.setInsertTime(null);
        rec2.setSourceDataSourceId("DS");
        rec2.setTargetDataSourceId("TG");
        rec2.setSourceSchemaName("SC");
        rec2.setSourceTableName("TB");

        BatchAggregationResult r2 = aggregator.aggregate("TASK", "CORRECT",
                Collections.singletonList(rec2));

        String dailyKeyAug7 = "TASK|2026-08-07";
        assertTrue(r2.getDailyIncrements().containsKey(dailyKeyAug7),
                "Expected daily key for Shanghai date 2026-08-07");
    }

    @Test
    void dualNullWarnLimit() {
        // Create many records with dual-null time
        java.util.List<LogRecordProjection> records = new java.util.ArrayList<>();
        for (int i = 0; i < 100; i++) {
            LogRecordProjection rec = new LogRecordProjection();
            rec.setCdcLogId(i + 1);
            rec.setTargetTime(null);
            rec.setInsertTime(null);
            rec.setSourceDataSourceId("DS");
            rec.setTargetDataSourceId("TG");
            rec.setSourceSchemaName("SC");
            rec.setSourceTableName("TB");
            records.add(rec);
        }

        BatchAggregationResult r = aggregator.aggregate("TASK", "CORRECT", records);
        assertEquals(100, r.getDualNullCount());
        assertEquals(100, r.getTotalRowCount());
    }

    @Test
    void aggregatedTableDimKeyUsesDotSeparator() {
        LogRecordProjection rec = makeRec(1L, date("2026-08-06"),
                "420000000890", "TG", "SPT_HIS_2023_TYC", "IPT_INAOUTPUT");

        BatchAggregationResult r = aggregator.aggregate("TASK", "CORRECT",
                Collections.singletonList(rec));

        // Verify the TABLE dim key uses dot separator and contains no U+001F or pipe
        boolean hasDotDim = r.getDimCumulativeIncrements().keySet().stream()
                .anyMatch(k -> k.contains("|TABLE|") && k.contains("420000000890.SPT_HIS_2023_TYC.IPT_INAOUTPUT"));
        assertTrue(hasDotDim, "TABLE dimension cumulative key should contain dot-separated value");

        boolean noU001F = r.getDimCumulativeIncrements().keySet().stream()
                .noneMatch(k -> k.contains(""));
        assertTrue(noU001F, "No dimension key should contain U+001F");

        boolean noPipeInDimValue = r.getDimDailyIncrements().keySet().stream()
                .noneMatch(k -> {
                    // Pipe is allowed only as composite-key separator, not within DIM_VALUE
                    String[] parts = k.split("\\|");
                    return parts.length >= 3 && parts[2].contains("|");
                });
        assertTrue(noPipeInDimValue, "DIM_VALUE should not contain pipe");
    }

    private LogRecordProjection makeRec(long id, Date effectiveTime,
                                         String src, String tgt, String schema, String table) {
        LogRecordProjection rec = new LogRecordProjection();
        rec.setCdcLogId(id);
        rec.setTargetTime(effectiveTime);
        rec.setInsertTime(effectiveTime);
        rec.setSourceDataSourceId(src);
        rec.setTargetDataSourceId(tgt);
        rec.setSourceSchemaName(schema);
        rec.setSourceTableName(table);
        return rec;
    }

    private java.sql.Date date(String yyyyMMdd) {
        return java.sql.Date.valueOf(LocalDate.parse(yyyyMMdd));
    }
}
