package com.bsoft.cdcconfig.largescreen.stats.lifecycle;

import com.bsoft.cdcconfig.largescreen.stats.config.StatsTaskConfig;
import com.bsoft.cdcconfig.largescreen.stats.dto.RoundResult;
import com.bsoft.cdcconfig.largescreen.stats.executor.RoundExecutor;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Component;

import java.util.concurrent.atomic.AtomicBoolean;

/**
 * 单轮运行编排器。
 * 编排：锁 → 安全上限 → 批大小 → RoundExecutor → 调整 → 释放。
 */
@Component
public class StatsRoundRunner {

    private static final Logger log = LoggerFactory.getLogger(StatsRoundRunner.class);

    private final RoundExecutor roundExecutor;
    private final SafeUpperIdProvider safeUpperIdProvider;
    private final DynamicBatchSizeManager batchSizeManager;
    private final AtomicBoolean lock = new AtomicBoolean(false);

    public StatsRoundRunner(RoundExecutor roundExecutor,
                            SafeUpperIdProvider safeUpperIdProvider,
                            DynamicBatchSizeManager batchSizeManager) {
        this.roundExecutor = roundExecutor;
        this.safeUpperIdProvider = safeUpperIdProvider;
        this.batchSizeManager = batchSizeManager;
    }

    public RoundRunResult runRound(StatsTaskConfig config) {
        if (!lock.compareAndSet(false, true)) {
            log.warn("Previous round still running, skipping this trigger");
            return new RoundRunResult(RoundRunStatus.SKIPPED_LOCKED, null);
        }
        try {
            // 1. 安全上限
            SafeUpperIdProvider.SafeUpperIds ids;
            try {
                ids = safeUpperIdProvider.compute(config);
            } catch (Exception e) {
                log.error("Safe upper ID computation failed", e);
                return new RoundRunResult(RoundRunStatus.FAILED, null);
            }

            // 2. 获取当前动态批大小
            int correctBs = batchSizeManager.getCorrectBatchSize();
            int errorBs = batchSizeManager.getErrorBatchSize();

            log.info("Round START | task={} | correctSafeUpper={} | errorSafeUpper={} | "
                            + "correctMaxLogId={} | errorMaxLogId={} | timeBoundary={} | "
                            + "correctBatchSize={} | errorBatchSize={}",
                    config.getTaskCode(), ids.correctSafeUpperId, ids.errorSafeUpperId,
                    ids.correctMaxLogId, ids.errorMaxLogId, ids.timeBoundary,
                    correctBs, errorBs);

            // 3. 执行轮次
            RoundResult result = roundExecutor.executeRound(
                    config,
                    ids.correctSafeUpperId, ids.errorSafeUpperId,
                    correctBs, errorBs);

            // 4. 调整动态批大小（显式传入 maxBatchesPerRun）
            batchSizeManager.adjust(result, config.getMaxBatchesPerRun());

            log.info("Round RESULT | correctBatches={} | errorBatches={} | "
                            + "correctProcessed={} | errorProcessed={} | "
                            + "stopReason={} | duration={}ms | "
                            + "newCorrectBatchSize={} | newErrorBatchSize={}",
                    result.getTotalCorrectBatches(), result.getTotalErrorBatches(),
                    result.getTotalCorrectProcessed(), result.getTotalErrorProcessed(),
                    result.getStopReason(),
                    result.getRoundEndTime() - result.getRoundStartTime(),
                    batchSizeManager.getCorrectBatchSize(),
                    batchSizeManager.getErrorBatchSize());

            return new RoundRunResult(RoundRunStatus.EXECUTED, result);

        } catch (Exception e) {
            log.error("Round execution failed", e);
            return new RoundRunResult(RoundRunStatus.FAILED, null);
        } finally {
            lock.set(false);
        }
    }
}
