package com.bsoft.cdcconfig.largescreen.stats.executor;

import com.bsoft.cdcconfig.largescreen.stats.algorithm.WatermarkCasUpdater;
import com.bsoft.cdcconfig.largescreen.stats.config.StatsTaskConfig;
import com.bsoft.cdcconfig.largescreen.stats.dto.BatchResult;
import com.bsoft.cdcconfig.largescreen.stats.dto.RoundResult;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;

import java.time.Clock;

/**
 * 一轮交替执行编排器。
 * 无 @Transactional —— 不开启跨批大事务，每批独立事务由 BatchTransactionExecutor 保证。
 * 安全上限和动态批大小由 TASK 4 传入。
 */
@Service
public class RoundExecutor {

    private static final Logger log = LoggerFactory.getLogger(RoundExecutor.class);

    private static final String CORRECT = "CORRECT";
    private static final String ERROR = "ERROR";
    static final String TABLE_CORRECT = "CDC_LOG_CORRECT";
    static final String TABLE_ERROR = "CDC_LOG_ERROR";

    private final BatchTransactionExecutor batchTransactionExecutor;
    private final WatermarkCasUpdater watermarkCasUpdater;
    private final Clock clock;

    public RoundExecutor(BatchTransactionExecutor batchTransactionExecutor,
                          WatermarkCasUpdater watermarkCasUpdater,
                          Clock clock) {
        this.batchTransactionExecutor = batchTransactionExecutor;
        this.watermarkCasUpdater = watermarkCasUpdater;
        this.clock = clock;
    }

    /**
     * 执行完整一轮统计。
     *
     * @param config              任务配置
     * @param correctSafeUpperId  CORRECT 流安全上限
     * @param errorSafeUpperId    ERROR 流安全上限
     * @param correctBatchSize    CORRECT 流动态批大小
     * @param errorBatchSize      ERROR 流动态批大小
     * @return 结构化一轮结果
     */
    public RoundResult executeRound(StatsTaskConfig config,
                                     long correctSafeUpperId,
                                     long errorSafeUpperId,
                                     int correctBatchSize,
                                     int errorBatchSize) {
        String taskCode = config.getTaskCode();
        long roundStartMs = clock.millis();

        log.info("Round start: task={}, correctSafeUpperId={}, errorSafeUpperId={}, "
                        + "correctBatchSize={}, errorBatchSize={}, safetyDelay={}min",
                taskCode, correctSafeUpperId, errorSafeUpperId,
                correctBatchSize, errorBatchSize, config.getSafetyDelayMinutes());

        RoundResult roundResult = new RoundResult(correctSafeUpperId, errorSafeUpperId, roundStartMs);
        roundResult.setStopReason("completed");
        long roundDeadline = roundStartMs + config.getMaxRunDurationSeconds() * 1000L;

        // 读取起始水位
        long correctWm = watermarkCasUpdater.readCurrentWatermark(taskCode, CORRECT);
        long errorWm = watermarkCasUpdater.readCurrentWatermark(taskCode, ERROR);
        roundResult.setCorrectStartWatermark(correctWm);
        roundResult.setErrorStartWatermark(errorWm);

        boolean correctCaughtUp = false;
        boolean errorCaughtUp = false;
        boolean correctFailed = false;
        boolean errorFailed = false;
        int correctBatchCount = 0;
        int errorBatchCount = 0;
        int maxBatches = config.getMaxBatchesPerRun();

        // 交替执行
        while (true) {
            // --- 检查时间上限（批间检查） ---
            if (clock.millis() >= roundDeadline) {
                roundResult.setRoundEndTime(clock.millis());
                roundResult.setStopReason("time_limit_reached");
                log.info("Round stopped: time limit reached at {} ms",
                        clock.millis() - roundStartMs);
                break;
            }

            boolean anyWork = false;

            // CORRECT 批次
            if (!correctCaughtUp && !correctFailed && correctBatchCount < maxBatches) {
                try {
                    BatchResult cr = batchTransactionExecutor.executeBatch(
                            taskCode, CORRECT, TABLE_CORRECT, correctSafeUpperId,
                            correctBatchSize);
                    roundResult.addCorrectBatch(cr);
                    if (cr.isEmpty()) {
                        correctCaughtUp = true;
                    } else {
                        correctBatchCount++;
                        anyWork = true;
                    }
                } catch (Exception e) {
                    log.error("CORRECT batch failed: task={} batch#={}",
                            taskCode, correctBatchCount + 1, e);
                    correctFailed = true;
                    roundResult.addCorrectBatch(new BatchResult.Builder()
                            .success(false).logType(CORRECT)
                            .errorMessage(e.getMessage()).build());
                }
            }

            // ERROR 批次
            if (!errorCaughtUp && !errorFailed && errorBatchCount < maxBatches) {
                try {
                    BatchResult er = batchTransactionExecutor.executeBatch(
                            taskCode, ERROR, TABLE_ERROR, errorSafeUpperId,
                            errorBatchSize);
                    roundResult.addErrorBatch(er);
                    if (er.isEmpty()) {
                        errorCaughtUp = true;
                    } else {
                        errorBatchCount++;
                        anyWork = true;
                    }
                } catch (Exception e) {
                    log.error("ERROR batch failed: task={} batch#={}",
                            taskCode, errorBatchCount + 1, e);
                    errorFailed = true;
                    roundResult.addErrorBatch(new BatchResult.Builder()
                            .success(false).logType(ERROR)
                            .errorMessage(e.getMessage()).build());
                }
            }

            // 停止条件
            if (!anyWork) {
                roundResult.setRoundEndTime(clock.millis());
                roundResult.setStopReason("all_caught_up");
                break;
            }
            if (correctCaughtUp && errorCaughtUp) {
                roundResult.setRoundEndTime(clock.millis());
                roundResult.setStopReason("all_caught_up");
                break;
            }
            if (correctFailed && errorFailed) {
                roundResult.setRoundEndTime(clock.millis());
                roundResult.setStopReason("both_streams_failed");
                break;
            }
            if ((correctCaughtUp || correctFailed || correctBatchCount >= maxBatches)
                    && (errorCaughtUp || errorFailed || errorBatchCount >= maxBatches)) {
                String reason;
                if (correctBatchCount >= maxBatches || errorBatchCount >= maxBatches) {
                    reason = "batch_limit_reached";
                } else if (correctFailed != errorFailed) {
                    reason = "partial_failure";
                } else {
                    reason = "completed";
                }
                roundResult.setRoundEndTime(clock.millis());
                roundResult.setStopReason(reason);
                break;
            }
        }

        roundResult.setCorrectCaughtUp(correctCaughtUp);
        roundResult.setErrorCaughtUp(errorCaughtUp);
        roundResult.setCorrectFailed(correctFailed);
        roundResult.setErrorFailed(errorFailed);

        // 读取结束水位
        try {
            roundResult.setCorrectEndWatermark(
                    watermarkCasUpdater.readCurrentWatermark(taskCode, CORRECT));
        } catch (Exception e) {
            log.warn("Failed to read CORRECT end watermark", e);
        }
        try {
            roundResult.setErrorEndWatermark(
                    watermarkCasUpdater.readCurrentWatermark(taskCode, ERROR));
        } catch (Exception e) {
            log.warn("Failed to read ERROR end watermark", e);
        }

        long totalCorrect = roundResult.getCorrectBatches().stream()
                .filter(BatchResult::isSuccess).filter(r -> !r.isEmpty())
                .mapToLong(BatchResult::getProcessedCount).sum();
        long totalError = roundResult.getErrorBatches().stream()
                .filter(BatchResult::isSuccess).filter(r -> !r.isEmpty())
                .mapToLong(BatchResult::getProcessedCount).sum();
        roundResult.setTotalCorrectProcessed(totalCorrect);
        roundResult.setTotalErrorProcessed(totalError);

        log.info("Round end: task={}, correctBatches={}/{}, errorBatches={}/{}, "
                        + "correctProcessed={}, errorProcessed={}, "
                        + "correctCaughtUp={}, errorCaughtUp={}, "
                        + "correctFailed={}, errorFailed={}, "
                        + "stopReason={}, duration={}ms",
                taskCode, correctBatchCount, maxBatches, errorBatchCount, maxBatches,
                totalCorrect, totalError,
                correctCaughtUp, errorCaughtUp,
                correctFailed, errorFailed,
                roundResult.getStopReason(),
                roundResult.getRoundEndTime() - roundStartMs);

        return roundResult;
    }
}
