package com.bsoft.cdcconfig.largescreen.stats.executor;

import com.bsoft.cdcconfig.largescreen.stats.algorithm.BatchAggregator;
import com.bsoft.cdcconfig.largescreen.stats.algorithm.StatsResultWriter;
import com.bsoft.cdcconfig.largescreen.stats.algorithm.WatermarkCasUpdater;
import com.bsoft.cdcconfig.largescreen.stats.dto.BatchAggregationResult;
import com.bsoft.cdcconfig.largescreen.stats.dto.BatchResult;
import com.bsoft.cdcconfig.largescreen.stats.dto.LogRecordProjection;
import com.bsoft.cdcconfig.largescreen.stats.reader.LogBatchReader;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InOrder;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.util.function.Consumer;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class BatchTransactionExecutorTest {

    @Mock
    private LogBatchReader logBatchReader;

    @Mock
    private BatchAggregator batchAggregator;

    @Mock
    private StatsResultWriter statsResultWriter;

    @Mock
    private WatermarkCasUpdater watermarkCasUpdater;

    private BatchTransactionExecutor executor;

    private static final String TASK_CODE = "TEST";
    private static final String LOG_TYPE = "CORRECT";
    private static final String TABLE_NAME = "CDC_LOG_CORRECT";
    private static final long SAFE_UPPER_ID = 10000L;
    private static final int BATCH_SIZE = 200000;

    @BeforeEach
    void setUp() {
        executor = new BatchTransactionExecutor(logBatchReader, batchAggregator,
                statsResultWriter, watermarkCasUpdater);
    }

    @SuppressWarnings("unchecked")
    @Test
    void emptyBatchDoesNotCallMergeAllOrCas() {
        when(watermarkCasUpdater.readCurrentWatermark(TASK_CODE, LOG_TYPE)).thenReturn(5000L);

        // aggregateStreaming returns empty result (rowCount=0)
        BatchAggregationResult emptyResult = new BatchAggregationResult(0);
        when(batchAggregator.aggregateStreaming(eq(TASK_CODE), eq(LOG_TYPE), any(Consumer.class)))
                .thenReturn(emptyResult);

        BatchResult result = executor.executeBatch(TASK_CODE, LOG_TYPE, TABLE_NAME,
                SAFE_UPPER_ID, BATCH_SIZE);

        assertTrue(result.isEmpty());
        verify(statsResultWriter, never()).mergeAll(any(), any(), any());
        verify(watermarkCasUpdater, never()).casUpdate(any(), any(), anyLong(),
                anyLong(), anyInt(), any());
    }

    @SuppressWarnings("unchecked")
    @Test
    void nonEmptyBatchCallsMergeAllBeforeCas() {
        long oldWatermark = 5000L;
        when(watermarkCasUpdater.readCurrentWatermark(TASK_CODE, LOG_TYPE)).thenReturn(oldWatermark);

        BatchAggregationResult aggResult = new BatchAggregationResult(0);
        aggResult.setMaxLogId(7000L);
        aggResult.setTotalRowCount(2);
        aggResult.setTotalSuccessIncrement(2);
        aggResult.setTotalErrorIncrement(0);
        when(batchAggregator.aggregateStreaming(eq(TASK_CODE), eq(LOG_TYPE), any(Consumer.class)))
                .thenReturn(aggResult);

        BatchResult result = executor.executeBatch(TASK_CODE, LOG_TYPE, TABLE_NAME,
                SAFE_UPPER_ID, BATCH_SIZE);

        // Verify ordering: mergeAll BEFORE casUpdate
        InOrder inOrder = inOrder(statsResultWriter, watermarkCasUpdater);
        inOrder.verify(statsResultWriter).mergeAll(eq(TASK_CODE), anyString(), eq(aggResult));
        inOrder.verify(watermarkCasUpdater).casUpdate(eq(TASK_CODE), eq(LOG_TYPE),
                eq(5000L), eq(7000L), eq(2), anyString());

        assertTrue(result.isSuccess());
        assertEquals(2, result.getProcessedCount());
        assertEquals(7000L, result.getNewLastLogId());
    }

    @SuppressWarnings("unchecked")
    @Test
    void mergeAllExceptionDoesNotCallCas() {
        when(watermarkCasUpdater.readCurrentWatermark(TASK_CODE, LOG_TYPE)).thenReturn(0L);

        BatchAggregationResult aggResult = new BatchAggregationResult(0);
        aggResult.setTotalRowCount(1);
        when(batchAggregator.aggregateStreaming(eq(TASK_CODE), eq(LOG_TYPE), any(Consumer.class)))
                .thenReturn(aggResult);

        doThrow(new RuntimeException("MERGE failed")).when(statsResultWriter)
                .mergeAll(eq(TASK_CODE), anyString(), eq(aggResult));

        assertThrows(RuntimeException.class, () ->
                executor.executeBatch(TASK_CODE, LOG_TYPE, TABLE_NAME, SAFE_UPPER_ID, BATCH_SIZE));

        // CAS must NOT be called after mergeAll fails
        verify(watermarkCasUpdater, never()).casUpdate(any(), any(), anyLong(),
                anyLong(), anyInt(), any());
    }

    @SuppressWarnings("unchecked")
    @Test
    void casExceptionPropagates() {
        when(watermarkCasUpdater.readCurrentWatermark(TASK_CODE, LOG_TYPE)).thenReturn(0L);

        BatchAggregationResult aggResult = new BatchAggregationResult(0);
        aggResult.setMaxLogId(200L);
        aggResult.setTotalRowCount(1);
        when(batchAggregator.aggregateStreaming(eq(TASK_CODE), eq(LOG_TYPE), any(Consumer.class)))
                .thenReturn(aggResult);

        doThrow(new IllegalStateException("CAS failed: 0 rows"))
                .when(watermarkCasUpdater).casUpdate(eq(TASK_CODE), eq(LOG_TYPE),
                        eq(0L), eq(200L), eq(1), anyString());

        assertThrows(IllegalStateException.class, () ->
                executor.executeBatch(TASK_CODE, LOG_TYPE, TABLE_NAME, SAFE_UPPER_ID, BATCH_SIZE));
    }

    @SuppressWarnings("unchecked")
    @Test
    void newWatermarkEqualsMaxCdcLogIdNotSafeUpperId() {
        when(watermarkCasUpdater.readCurrentWatermark(TASK_CODE, LOG_TYPE)).thenReturn(0L);

        BatchAggregationResult aggResult = new BatchAggregationResult(0);
        aggResult.setMaxLogId(5000L);
        aggResult.setTotalRowCount(1);
        aggResult.setTotalSuccessIncrement(1);
        when(batchAggregator.aggregateStreaming(eq(TASK_CODE), eq(LOG_TYPE), any(Consumer.class)))
                .thenReturn(aggResult);

        BatchResult result = executor.executeBatch(TASK_CODE, LOG_TYPE, TABLE_NAME,
                SAFE_UPPER_ID, BATCH_SIZE);

        // New watermark should be 5000 (actual max CDC_LOG_ID), not 10000 (safeUpperId)
        assertEquals(5000L, result.getNewLastLogId());
        verify(watermarkCasUpdater).casUpdate(eq(TASK_CODE), eq(LOG_TYPE),
                eq(0L), eq(5000L), eq(1), anyString());
    }
}
