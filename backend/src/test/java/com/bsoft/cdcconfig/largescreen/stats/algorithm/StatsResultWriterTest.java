package com.bsoft.cdcconfig.largescreen.stats.algorithm;

import com.bsoft.cdcconfig.largescreen.stats.dto.BatchAggregationResult;
import com.bsoft.cdcconfig.largescreen.stats.mapper.CumulativeOverviewMapper;
import com.bsoft.cdcconfig.largescreen.stats.mapper.DailyOverviewMapper;
import com.bsoft.cdcconfig.largescreen.stats.mapper.DimCumulativeMapper;
import com.bsoft.cdcconfig.largescreen.stats.mapper.DimDailyMapper;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.sql.Date;
import java.time.LocalDate;

import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class StatsResultWriterTest {

    @Mock
    private CumulativeOverviewMapper cumulativeOverviewMapper;

    @Mock
    private DailyOverviewMapper dailyOverviewMapper;

    @Mock
    private DimCumulativeMapper dimCumulativeMapper;

    @Mock
    private DimDailyMapper dimDailyMapper;

    private StatsResultWriter writer;
    private static final String BATCH_ID = "test-batch-id";
    private static final String TASK_CODE = "TEST_TASK";

    @BeforeEach
    void setUp() {
        writer = new StatsResultWriter(cumulativeOverviewMapper, dailyOverviewMapper,
                dimCumulativeMapper, dimDailyMapper);
    }

    @Test
    void cumulativeIncrementCallsCorrectMapper() {
        BatchAggregationResult r = new BatchAggregationResult(0);
        r.addCumulative(TASK_CODE, 5L, 3L);

        writer.mergeAll(TASK_CODE, BATCH_ID, r);

        verify(cumulativeOverviewMapper).mergeIncrement(
                eq(TASK_CODE), eq(5L), eq(3L), eq(BATCH_ID));
        verify(dailyOverviewMapper, never()).mergeIncrement(any(), any(), anyLong(), anyLong(), any());
        verify(dimCumulativeMapper, never()).mergeIncrement(any(), any(), any(), anyLong(), anyLong(), any());
        verify(dimDailyMapper, never()).mergeIncrement(any(), any(), any(), any(), anyLong(), anyLong(), any());
    }

    @Test
    void dailyIncrementCallsCorrectMapperWithCorrectDate() {
        BatchAggregationResult r = new BatchAggregationResult(0);
        r.addDaily(TASK_CODE + "|2026-08-06", 2L, 1L);

        writer.mergeAll(TASK_CODE, BATCH_ID, r);

        verify(dailyOverviewMapper).mergeIncrement(
                eq(TASK_CODE), eq(Date.valueOf("2026-08-06")), eq(2L), eq(1L), eq(BATCH_ID));
    }

    @Test
    void dimCumulativeIncrementCallsCorrectMapperWithParams() {
        BatchAggregationResult r = new BatchAggregationResult(0);
        r.addDimCumulative(TASK_CODE + "|SOURCE_DATA_SOURCE|DS001", 7L, 2L);

        writer.mergeAll(TASK_CODE, BATCH_ID, r);

        verify(dimCumulativeMapper).mergeIncrement(
                eq(TASK_CODE), eq("SOURCE_DATA_SOURCE"), eq("DS001"), eq(7L), eq(2L), eq(BATCH_ID));
    }

    @Test
    void dimDailyIncrementCallsCorrectMapperWithDate() {
        BatchAggregationResult r = new BatchAggregationResult(0);
        r.addDimDaily(TASK_CODE + "|TARGET_DB|TGT001|2026-08-06", 4L, 1L);

        writer.mergeAll(TASK_CODE, BATCH_ID, r);

        verify(dimDailyMapper).mergeIncrement(
                eq(TASK_CODE), eq("TARGET_DB"), eq("TGT001"),
                eq(Date.valueOf("2026-08-06")), eq(4L), eq(1L), eq(BATCH_ID));
    }

    @Test
    void allFourTypesCalledForMixedBatch() {
        BatchAggregationResult r = new BatchAggregationResult(0);
        r.addCumulative(TASK_CODE, 10L, 2L);
        r.addDaily(TASK_CODE + "|2026-08-06", 8L, 1L);
        r.addDimCumulative(TASK_CODE + "|SOURCE_DATA_SOURCE|DS001", 3L, 1L);
        r.addDimDaily(TASK_CODE + "|TABLE|key1.key2.key3|2026-08-06", 2L, 0L);

        writer.mergeAll(TASK_CODE, BATCH_ID, r);

        verify(cumulativeOverviewMapper).mergeIncrement(any(), anyLong(), anyLong(), any());
        verify(dailyOverviewMapper).mergeIncrement(any(), any(), anyLong(), anyLong(), any());
        verify(dimCumulativeMapper).mergeIncrement(any(), any(), any(), anyLong(), anyLong(), any());
        verify(dimDailyMapper).mergeIncrement(any(), any(), any(), any(), anyLong(), anyLong(), any());
    }

    @Test
    void emptyIncrementMapsNoDml() {
        BatchAggregationResult r = new BatchAggregationResult(0);

        writer.mergeAll(TASK_CODE, BATCH_ID, r);

        verifyNoInteractions(cumulativeOverviewMapper);
        verifyNoInteractions(dailyOverviewMapper);
        verifyNoInteractions(dimCumulativeMapper);
        verifyNoInteractions(dimDailyMapper);
    }

    @Test
    void zeroIncrementsSkipped() {
        // Increments with both success=0 and error=0 should not trigger DML
        BatchAggregationResult r = new BatchAggregationResult(0);
        // addCumulative with (0,0) - the key exists but increments are zero
        r.addCumulative(TASK_CODE, 0L, 0L);

        writer.mergeAll(TASK_CODE, BATCH_ID, r);

        // StatsResultWriter checks inc[0] > 0 || inc[1] > 0 before calling mapper
        verifyNoInteractions(cumulativeOverviewMapper);
    }

    @Test
    void tableDimValuePreservedAsOpaqueDotSeparatedString() {
        BatchAggregationResult r = new BatchAggregationResult(0);
        String dimKey = TASK_CODE + "|TABLE|src.sc.tb";
        r.addDimCumulative(dimKey, 1L, 0L);

        writer.mergeAll(TASK_CODE, BATCH_ID, r);

        verify(dimCumulativeMapper).mergeIncrement(
                eq(TASK_CODE), eq("TABLE"), eq("src.sc.tb"),
                eq(1L), eq(0L), eq(BATCH_ID));
    }

    @Test
    void dimDailyTableDimValuePassedVerbatimWithDots() {
        BatchAggregationResult r = new BatchAggregationResult(0);
        String dimKey = TASK_CODE + "|TABLE|420000000890.SPT_HIS_2023_TYC.IPT_INAOUTPUT|2026-08-06";
        r.addDimDaily(dimKey, 2L, 0L);

        writer.mergeAll(TASK_CODE, BATCH_ID, r);

        verify(dimDailyMapper).mergeIncrement(
                eq(TASK_CODE), eq("TABLE"), eq("420000000890.SPT_HIS_2023_TYC.IPT_INAOUTPUT"),
                eq(java.sql.Date.valueOf("2026-08-06")), eq(2L), eq(0L), eq(BATCH_ID));
    }

    @Test
    void dimValueContainsNoUnitSeparator() {
        BatchAggregationResult r = new BatchAggregationResult(0);
        r.addDimCumulative(TASK_CODE + "|TABLE|a.b.c", 1L, 0L);

        writer.mergeAll(TASK_CODE, BATCH_ID, r);

        verify(dimCumulativeMapper).mergeIncrement(
                eq(TASK_CODE), eq("TABLE"), argThat(v -> !v.contains("")),
                eq(1L), eq(0L), eq(BATCH_ID));
    }

    @Test
    void dimValueFieldContainsNoPipe() {
        // Pipe is used as composite-key separator (TASK_CODE|DIM_TYPE|DIM_VALUE),
        // but must not appear inside DIM_VALUE itself
        BatchAggregationResult r = new BatchAggregationResult(0);
        r.addDimCumulative(TASK_CODE + "|TABLE|a.b.c", 1L, 0L);

        writer.mergeAll(TASK_CODE, BATCH_ID, r);

        verify(dimCumulativeMapper).mergeIncrement(
                eq(TASK_CODE), eq("TABLE"), argThat(v -> !v.contains("|")),
                eq(1L), eq(0L), eq(BATCH_ID));
    }

    @Test
    void writerDoesNotSplitOrRewriteTableDimValue() {
        // Given a dim value that looks parseable, StatsResultWriter
        // must pass it through verbatim without splitting on dots
        BatchAggregationResult r = new BatchAggregationResult(0);
        r.addDimCumulative(TASK_CODE + "|TABLE|a.b.c.d.e", 3L, 1L);

        writer.mergeAll(TASK_CODE, BATCH_ID, r);

        // DIM_VALUE is the entire opaque string, not split into individual fields
        verify(dimCumulativeMapper).mergeIncrement(
                eq(TASK_CODE), eq("TABLE"), eq("a.b.c.d.e"),
                eq(3L), eq(1L), eq(BATCH_ID));
    }

    @Test
    void batchIdPassedThroughToAllMappers() {
        String customBatchId = "my-batch-uuid";
        BatchAggregationResult r = new BatchAggregationResult(0);
        r.addCumulative(TASK_CODE, 1L, 0L);

        writer.mergeAll(TASK_CODE, customBatchId, r);

        verify(cumulativeOverviewMapper).mergeIncrement(
                eq(TASK_CODE), eq(1L), eq(0L), eq(customBatchId));
    }
}
