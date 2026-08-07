package com.bsoft.cdcconfig.largescreen.stats.lifecycle;

import com.bsoft.cdcconfig.largescreen.stats.config.StatsTaskConfig;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.context.ApplicationListener;
import org.springframework.boot.context.event.ApplicationReadyEvent;
import org.springframework.scheduling.concurrent.ThreadPoolTaskScheduler;
import org.springframework.stereotype.Component;

import java.util.Date;
import java.util.concurrent.Executors;
import java.util.concurrent.ScheduledExecutorService;
import java.util.concurrent.TimeUnit;
import java.util.concurrent.atomic.AtomicBoolean;

/**
 * 统计任务调度器。
 * ApplicationReadyEvent 后加载配置并启动固定延迟调度。
 * 无 @PreDestroy / 无 stopping / 无 graceful shutdown（按 kill -9 设计）。
 */
@Component
public class StatsScheduler implements ApplicationListener<ApplicationReadyEvent> {

    private static final Logger log = LoggerFactory.getLogger(StatsScheduler.class);

    private final ThreadPoolTaskScheduler taskScheduler;
    private final StatsTaskConfigLoader configLoader;
    private final StatsRoundRunner roundRunner;
    private final DynamicBatchSizeManager batchSizeManager;
    private final AtomicBoolean started = new AtomicBoolean(false);

    public StatsScheduler(ThreadPoolTaskScheduler taskScheduler,
                          StatsTaskConfigLoader configLoader,
                          StatsRoundRunner roundRunner,
                          DynamicBatchSizeManager batchSizeManager) {
        this.taskScheduler = taskScheduler;
        this.configLoader = configLoader;
        this.roundRunner = roundRunner;
        this.batchSizeManager = batchSizeManager;
    }

    @Override
    public void onApplicationEvent(ApplicationReadyEvent event) {
        if (!started.compareAndSet(false, true)) {
            return;
        }
        try {
            StatsTaskConfig config = configLoader.loadOnce();
            if (config.getEnabled() != 1) {
                log.info("Stats scheduling not started: task disabled. "
                        + "Check CDC_STATS_TASK_CONFIG for TASK_CODE='LARGE_SCREEN_STATS'");
                return;
            }
            // 初始化动态批大小
            batchSizeManager.initialize(config.getBatchSize());
            long initialDelayMs = config.getStartupDelayMinutes() * 60_000L;
            long intervalMs = config.getScheduleIntervalMinutes() * 60_000L;
            taskScheduler.scheduleWithFixedDelay(
                    this::safeRunRound,
                    new Date(System.currentTimeMillis() + initialDelayMs),
                    intervalMs);
            log.info("Stats scheduler started: initialDelayMs={}, intervalMs={}",
                    initialDelayMs, intervalMs);
        } catch (StatsConfigLoadException e) {
            logConfigLoadError(e);
            ScheduledExecutorService scheduler = Executors.newSingleThreadScheduledExecutor(r -> {
                Thread t = new Thread(r, "cdc-stats-config-warn");
                t.setDaemon(true);
                return t;
            });
            startPeriodicWarn(scheduler);
        }
    }

    /**
     * 记录首次 ERROR 日志并携带完整异常，供 spy 验证。
     * 仅包内和测试可见。
     */
    void logConfigLoadError(StatsConfigLoadException e) {
        log.error("大屏统计配置加载失败，统计任务将不会启动", e);
    }

    /**
     * 记录周期 WARN 日志，不携带异常，供 spy 验证。
     * 仅包内和测试可见。
     */
    void logConfigNotStartedWarn() {
        log.warn("大屏统计任务未启动：配置加载失败，请检查 CDC_STATS_TASK_CONFIG 表中 TASK_CODE='LARGE_SCREEN_STATS' 的配置");
    }

    /**
     * 注册周期告警任务（包内可见，测试可传入 mock 验证调度参数）。
     */
    void startPeriodicWarn(ScheduledExecutorService warnScheduler) {
        this.warnScheduler = warnScheduler;
        this.warnTask = this::logConfigNotStartedWarn;
        this.warnScheduler.scheduleWithFixedDelay(warnTask, 60, 60, TimeUnit.SECONDS);
    }

    private void safeRunRound() {
        try {
            StatsTaskConfig config = configLoader.getConfig();
            if (config == null) {
                return;
            }
            roundRunner.runRound(config);
        } catch (Exception e) {
            log.error("Unhandled exception in scheduled round", e);
        }
    }

    // 以下字段和属性为包内可见，供测试使用

    /** 周期告警任务，测试可获取 Runnable 以同步断言日志行为。 */
    volatile Runnable warnTask;
    /** 周期告警调度器，测试可验证注入的 mock。 */
    volatile ScheduledExecutorService warnScheduler;

    boolean isStarted() { return started.get(); }
}
