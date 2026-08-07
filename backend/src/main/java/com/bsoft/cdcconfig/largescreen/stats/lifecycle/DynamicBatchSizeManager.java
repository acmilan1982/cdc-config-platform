package com.bsoft.cdcconfig.largescreen.stats.lifecycle;

import com.bsoft.cdcconfig.largescreen.stats.dto.RoundResult;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Component;

import java.util.concurrent.atomic.AtomicBoolean;
import java.util.concurrent.atomic.AtomicInteger;

/**
 * 动态批大小管理器。
 * CORRECT 和 ERROR 分别维护独立的动态单批大小，仅保存在 JVM 内存中。
 * 必须先调用 initialize() 初始化，否则 get/adjust 抛出 IllegalStateException。
 * 重启后从数据库配置值重新初始化。
 */
@Component
public class DynamicBatchSizeManager {

    private static final Logger log = LoggerFactory.getLogger(DynamicBatchSizeManager.class);

    private static final int STEP = 10_000;
    private static final int MIN_SIZE = 50_000;
    private static final int MAX_SIZE = 500_000;

    private final AtomicBoolean initialized = new AtomicBoolean(false);
    private final AtomicInteger correctBatchSize = new AtomicInteger(0);
    private final AtomicInteger errorBatchSize = new AtomicInteger(0);
    private volatile int initialSize = -1;

    /**
     * 线程安全、幂等初始化。
     * 首次调用完成初始化；重复传入相同值安全返回；传入不同值抛出异常。
     */
    public void initialize(int initialBatchSize) {
        if (initialBatchSize < MIN_SIZE || initialBatchSize > MAX_SIZE) {
            throw new IllegalArgumentException(
                    "initialBatchSize " + initialBatchSize + " out of range [" + MIN_SIZE + ", " + MAX_SIZE + "]");
        }
        if (initialized.compareAndSet(false, true)) {
            this.initialSize = initialBatchSize;
            correctBatchSize.set(initialBatchSize);
            errorBatchSize.set(initialBatchSize);
            log.info("DynamicBatchSizeManager initialized: initialSize={}", initialBatchSize);
            return;
        }
        // 已初始化，检查是否相同
        if (this.initialSize != initialBatchSize) {
            throw new IllegalStateException(
                    "DynamicBatchSizeManager already initialized with " + this.initialSize
                            + ", cannot re-initialize with " + initialBatchSize);
        }
    }

    private void ensureInitialized() {
        if (!initialized.get()) {
            throw new IllegalStateException(
                    "DynamicBatchSizeManager not initialized: config not loaded or task disabled");
        }
    }

    public int getCorrectBatchSize() {
        ensureInitialized();
        return correctBatchSize.get();
    }

    public int getErrorBatchSize() {
        ensureInitialized();
        return errorBatchSize.get();
    }

    public boolean isInitialized() { return initialized.get(); }

    /**
     * 根据轮次结果调整动态批大小。
     * 增加和减少均逐流独立判断，maxBatchesPerRun 由调用方显式传入。
     */
    public void adjust(RoundResult roundResult, int maxBatchesPerRun) {
        ensureInitialized();
        if (roundResult == null) {
            return;
        }

        boolean timeLimit = "time_limit_reached".equals(roundResult.getStopReason());

        adjustCorrect(roundResult, maxBatchesPerRun, timeLimit);
        adjustError(roundResult, maxBatchesPerRun, timeLimit);
    }

    private void adjustCorrect(RoundResult result, int maxBatchesPerRun, boolean timeLimit) {
        adjustStream(result, "CORRECT", correctBatchSize,
                result.isCorrectCaughtUp(), result.isCorrectFailed(),
                result.getTotalCorrectBatches(), maxBatchesPerRun, timeLimit);
    }

    private void adjustError(RoundResult result, int maxBatchesPerRun, boolean timeLimit) {
        adjustStream(result, "ERROR", errorBatchSize,
                result.isErrorCaughtUp(), result.isErrorFailed(),
                result.getTotalErrorBatches(), maxBatchesPerRun, timeLimit);
    }

    /**
     * 逐流调整。
     *
     * 增加条件（全部满足）:
     *   1. 未追平 (!caughtUp)
     *   2. 未失败 (!failed)
     *   3. 批次数达到 maxBatchesPerRun
     *   4. 非超时结束 (!timeLimit)
     *
     * 减少条件（全部满足）:
     *   1. 超时结束 (timeLimit)
     *   2. 本轮至少完成过一个非空批次 (batchCount > 0)
     *   3. 未失败 (!failed)
     *   4. 仍有积压 (!caughtUp)
     */
    private void adjustStream(RoundResult result, String logType, AtomicInteger size,
                              boolean caughtUp, boolean failed, int batchCount,
                              int maxBatchesPerRun, boolean timeLimit) {
        if (timeLimit && batchCount > 0 && !failed && !caughtUp) {
            int newVal = Math.max(size.get() - STEP, MIN_SIZE);
            size.set(newVal);
            log.info("Dynamic batch size decreased for {}: {} (time limit reached)", logType, newVal);
            return;
        }

        if (!caughtUp && !failed && batchCount >= maxBatchesPerRun && !timeLimit) {
            int newVal = Math.min(size.get() + STEP, MAX_SIZE);
            size.set(newVal);
            log.info("Dynamic batch size increased for {}: {}", logType, newVal);
        }
    }
}
