package com.bsoft.cdcconfig.largescreen.stats.executor;

import com.bsoft.cdcconfig.largescreen.stats.algorithm.BatchAggregator;
import com.bsoft.cdcconfig.largescreen.stats.algorithm.StatsResultWriter;
import com.bsoft.cdcconfig.largescreen.stats.algorithm.WatermarkCasUpdater;
import com.bsoft.cdcconfig.largescreen.stats.dto.BatchAggregationResult;
import com.bsoft.cdcconfig.largescreen.stats.dto.BatchResult;
import com.bsoft.cdcconfig.largescreen.stats.reader.LogBatchReader;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.UUID;

/**
 * 单批事务执行器。独立 Spring Bean，@Transactional 方法经 Spring 代理生效。
 * 内部操作：读日志 → 聚合 → 写四类结果 → CAS水位 → 提交。
 */
@Service
public class BatchTransactionExecutor {

    private static final Logger log = LoggerFactory.getLogger(BatchTransactionExecutor.class);

    private final LogBatchReader logBatchReader;
    private final BatchAggregator batchAggregator;
    private final StatsResultWriter statsResultWriter;
    private final WatermarkCasUpdater watermarkCasUpdater;

    public BatchTransactionExecutor(LogBatchReader logBatchReader,
                                     BatchAggregator batchAggregator,
                                     StatsResultWriter statsResultWriter,
                                     WatermarkCasUpdater watermarkCasUpdater) {
        this.logBatchReader = logBatchReader;
        this.batchAggregator = batchAggregator;
        this.statsResultWriter = statsResultWriter;
        this.watermarkCasUpdater = watermarkCasUpdater;
    }

    /**
     * 执行一个批次（独立事务）。
     * 由 RoundExecutor 跨 Bean 调用，Spring 代理保证 @Transactional 生效。
     *
     * @param taskCode     任务代码
     * @param logType      日志类型（CORRECT / ERROR）
     * @param tableName    日志表名（CDC_LOG_CORRECT / CDC_LOG_ERROR）
     * @param safeUpperId  本轮固定安全上限
     * @param batchSize    每批最大条数
     * @return 批次执行结果
     */
    @Transactional(rollbackFor = Exception.class)
    public BatchResult executeBatch(String taskCode, String logType,
                                     String tableName, long safeUpperId,
                                     int batchSize) {
        String batchId = UUID.randomUUID().toString();

        // 1. 读取当前水位
        long oldLastLogId = watermarkCasUpdater.readCurrentWatermark(taskCode, logType);

        // 2. 流式查询 + 聚合（不产生中间 List）
        BatchAggregationResult aggregationResult = batchAggregator.aggregateStreaming(
                taskCode, logType,
                rowConsumer -> logBatchReader.readBatchStreaming(
                        tableName, oldLastLogId, safeUpperId, batchSize, rowConsumer));

        // 3. 空批次：不推进水位，标记追平
        if (aggregationResult.getTotalRowCount() == 0) {
            log.debug("Empty batch: {} {}, lastId={}, safeUpper={}",
                    taskCode, logType, oldLastLogId, safeUpperId);
            return BatchResult.EMPTY;
        }

        long newLastLogId = aggregationResult.getMaxLogId();
        int processedCount = aggregationResult.getTotalRowCount();

        // 4. 四类结果原子写入
        statsResultWriter.mergeAll(taskCode, batchId, aggregationResult);

        // 5. CAS 推进水位
        watermarkCasUpdater.casUpdate(taskCode, logType, oldLastLogId, newLastLogId,
                processedCount, batchId);

        log.info("Batch committed: {} {} batch={}, {} rows, watermark {} → {}",
                taskCode, logType, batchId, processedCount, oldLastLogId, newLastLogId);

        return new BatchResult.Builder()
                .success(true)
                .logType(logType)
                .oldLastLogId(oldLastLogId)
                .newLastLogId(newLastLogId)
                .processedCount(processedCount)
                .successIncrement(aggregationResult.getTotalSuccessIncrement())
                .errorIncrement(aggregationResult.getTotalErrorIncrement())
                .dualNullCount(aggregationResult.getDualNullCount())
                .build();
    }
}
