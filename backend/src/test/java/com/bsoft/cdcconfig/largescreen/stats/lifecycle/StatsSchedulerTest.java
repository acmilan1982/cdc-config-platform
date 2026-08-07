package com.bsoft.cdcconfig.largescreen.stats.lifecycle;

import ch.qos.logback.classic.Level;
import ch.qos.logback.classic.Logger;
import ch.qos.logback.classic.spi.ILoggingEvent;
import ch.qos.logback.core.read.ListAppender;

import com.bsoft.cdcconfig.largescreen.stats.config.StatsTaskConfig;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.slf4j.LoggerFactory;
import org.springframework.boot.context.event.ApplicationReadyEvent;
import org.springframework.scheduling.concurrent.ThreadPoolTaskScheduler;

import java.util.Date;
import java.util.List;
import java.util.concurrent.ScheduledExecutorService;
import java.util.concurrent.TimeUnit;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;

/**
 * StatsScheduler 单元测试。
 * 日志事件断言使用 Logback ListAppender 捕获实际 ILoggingEvent，
 * 调度参数断言使用 mock ScheduledExecutorService，
 * 行为断言使用 Mockito verify。
 */
@ExtendWith(MockitoExtension.class)
class StatsSchedulerTest {

    @Mock
    private ThreadPoolTaskScheduler taskScheduler;

    @Mock
    private StatsTaskConfigLoader configLoader;

    @Mock
    private StatsRoundRunner roundRunner;

    @Mock
    private DynamicBatchSizeManager batchSizeManager;

    @Mock
    private ApplicationReadyEvent applicationReadyEvent;

    @Mock
    private ScheduledExecutorService mockWarnScheduler;

    private StatsTaskConfig config;

    // 当前测试中挂载的 ListAppender，由 @AfterEach 统一解绑
    private ListAppender<ILoggingEvent> activeAppender;

    @BeforeEach
    void setUp() {
        config = StatsTaskConfig.builder()
                .taskCode("LARGE_SCREEN_STATS")
                .taskName("Test")
                .enabled(1)
                .startupDelayMinutes(10)
                .scheduleIntervalMinutes(60)
                .safetyDelayMinutes(30)
                .batchSize(200000)
                .maxBatchesPerRun(10)
                .maxRunDurationSeconds(900)
                .build();
    }

    @AfterEach
    void detachAppender() {
        if (activeAppender != null) {
            Logger logger = (Logger) LoggerFactory.getLogger(StatsScheduler.class);
            logger.detachAppender(activeAppender);
            activeAppender.stop();
            activeAppender = null;
        }
    }

    // ---- 工具方法 ----

    private StatsScheduler createScheduler() {
        return new StatsScheduler(taskScheduler, configLoader, roundRunner, batchSizeManager);
    }

    /**
     * 向 StatsScheduler 的 Logger 挂载 ListAppender 并返回。
     * 调用方通过 appender.list 获取捕获的 ILoggingEvent 列表。
     */
    private ListAppender<ILoggingEvent> attachAppender() {
        Logger logger = (Logger) LoggerFactory.getLogger(StatsScheduler.class);
        ListAppender<ILoggingEvent> appender = new ListAppender<>();
        appender.start();
        logger.addAppender(appender);
        activeAppender = appender;
        return appender;
    }

    /** 返回指定 Level 的日志事件列表。 */
    private List<ILoggingEvent> eventsOfLevel(ListAppender<ILoggingEvent> appender, Level level) {
        return appender.list.stream()
                .filter(e -> e.getLevel() == level)
                .collect(java.util.stream.Collectors.toList());
    }

    // ============================================================
    // 基础调度测试
    // ============================================================

    @Test
    void applicationReadyStartsScheduling() {
        StatsScheduler scheduler = createScheduler();
        when(configLoader.loadOnce()).thenReturn(config);

        scheduler.onApplicationEvent(applicationReadyEvent);

        verify(taskScheduler).scheduleWithFixedDelay(any(Runnable.class), any(Date.class), anyLong());
        assertTrue(scheduler.isStarted());
    }

    @Test
    void initialDelayMatchesConfig() {
        StatsScheduler scheduler = createScheduler();
        when(configLoader.loadOnce()).thenReturn(config);

        scheduler.onApplicationEvent(applicationReadyEvent);

        ArgumentCaptor<Date> dateCaptor = ArgumentCaptor.forClass(Date.class);
        verify(taskScheduler).scheduleWithFixedDelay(any(Runnable.class), dateCaptor.capture(), anyLong());

        long now = System.currentTimeMillis();
        long expectedDelay = config.getStartupDelayMinutes() * 60_000L;
        long actualDelay = dateCaptor.getValue().getTime() - now;
        assertTrue(Math.abs(actualDelay - expectedDelay) < 5000,
                "Expected delay ~" + expectedDelay + "ms, got " + actualDelay + "ms");
    }

    @Test
    void intervalMatchesConfig() {
        StatsScheduler scheduler = createScheduler();
        when(configLoader.loadOnce()).thenReturn(config);

        scheduler.onApplicationEvent(applicationReadyEvent);

        long expectedInterval = config.getScheduleIntervalMinutes() * 60_000L;
        verify(taskScheduler).scheduleWithFixedDelay(any(Runnable.class), any(Date.class),
                eq(expectedInterval));
    }

    @Test
    void disabledConfigDoesNotSchedule() {
        StatsScheduler scheduler = createScheduler();
        StatsTaskConfig disabledConfig = StatsTaskConfig.builder()
                .taskCode("LARGE_SCREEN_STATS").taskName("Test").enabled(0)
                .startupDelayMinutes(10).scheduleIntervalMinutes(60)
                .safetyDelayMinutes(30).batchSize(200000)
                .maxBatchesPerRun(10).maxRunDurationSeconds(900).build();
        when(configLoader.loadOnce()).thenReturn(disabledConfig);

        scheduler.onApplicationEvent(applicationReadyEvent);

        verify(taskScheduler, never()).scheduleWithFixedDelay(any(Runnable.class),
                any(Date.class), anyLong());
    }

    @Test
    void configLoadExceptionDoesNotPropagate() {
        StatsScheduler scheduler = createScheduler();
        when(configLoader.loadOnce())
                .thenThrow(new StatsConfigLoadException("No config found"));

        assertDoesNotThrow(() -> scheduler.onApplicationEvent(applicationReadyEvent));

        verify(taskScheduler, never()).scheduleWithFixedDelay(any(Runnable.class),
                any(Date.class), anyLong());
    }

    @Test
    void doubleStartupOnlySchedulesOnce() {
        StatsScheduler scheduler = createScheduler();
        when(configLoader.loadOnce()).thenReturn(config);

        scheduler.onApplicationEvent(applicationReadyEvent);
        scheduler.onApplicationEvent(applicationReadyEvent);

        verify(taskScheduler, times(1)).scheduleWithFixedDelay(any(Runnable.class),
                any(Date.class), anyLong());
    }

    @Test
    void runnableSurvivesExceptionAndRunsAgain() {
        StatsScheduler scheduler = createScheduler();
        when(configLoader.loadOnce()).thenReturn(config);

        scheduler.onApplicationEvent(applicationReadyEvent);

        ArgumentCaptor<Runnable> runnableCaptor = ArgumentCaptor.forClass(Runnable.class);
        verify(taskScheduler).scheduleWithFixedDelay(runnableCaptor.capture(),
                any(Date.class), anyLong());

        Runnable scheduledRunnable = runnableCaptor.getValue();
        when(configLoader.getConfig()).thenReturn(config);
        when(roundRunner.runRound(config))
                .thenThrow(new RuntimeException("First failure"))
                .thenReturn(new RoundRunResult(RoundRunStatus.EXECUTED, null));

        scheduledRunnable.run();
        scheduledRunnable.run();

        verify(roundRunner, times(2)).runRound(config);
    }

    @Test
    void exceptionDoesNotEscapeRunnable() {
        StatsScheduler scheduler = createScheduler();
        when(configLoader.loadOnce()).thenReturn(config);

        scheduler.onApplicationEvent(applicationReadyEvent);

        ArgumentCaptor<Runnable> runnableCaptor = ArgumentCaptor.forClass(Runnable.class);
        verify(taskScheduler).scheduleWithFixedDelay(runnableCaptor.capture(),
                any(Date.class), anyLong());

        when(configLoader.getConfig()).thenReturn(config);
        when(roundRunner.runRound(config)).thenThrow(new RuntimeException("Simulated failure"));

        assertDoesNotThrow(() -> runnableCaptor.getValue().run());
    }

    @Test
    void noPreDestroyAnnotationOnScheduler() {
        java.lang.reflect.Method[] methods = StatsScheduler.class.getDeclaredMethods();
        for (java.lang.reflect.Method m : methods) {
            assertNull(m.getAnnotation(javax.annotation.PreDestroy.class),
                    "StatsScheduler should not have @PreDestroy: " + m.getName());
        }
    }

    @Test
    void safeRunRoundReturnsWhenConfigIsNull() {
        StatsScheduler scheduler = createScheduler();
        when(configLoader.loadOnce()).thenReturn(config);

        scheduler.onApplicationEvent(applicationReadyEvent);

        ArgumentCaptor<Runnable> runnableCaptor = ArgumentCaptor.forClass(Runnable.class);
        verify(taskScheduler).scheduleWithFixedDelay(runnableCaptor.capture(),
                any(Date.class), anyLong());

        when(configLoader.getConfig()).thenReturn(null);

        assertDoesNotThrow(() -> runnableCaptor.getValue().run());
        verify(roundRunner, never()).runRound(any());
    }

    // ---- DynamicBatchSizeManager 初始化 ----

    @Test
    void batchSizeManagerInitializedWhenTaskEnabled() {
        StatsScheduler scheduler = createScheduler();
        when(configLoader.loadOnce()).thenReturn(config);

        scheduler.onApplicationEvent(applicationReadyEvent);

        verify(batchSizeManager).initialize(config.getBatchSize());
    }

    @Test
    void batchSizeManagerNotInitializedWhenTaskDisabled() {
        StatsScheduler scheduler = createScheduler();
        StatsTaskConfig disabledConfig = StatsTaskConfig.builder()
                .taskCode("LARGE_SCREEN_STATS").taskName("Test").enabled(0)
                .startupDelayMinutes(10).scheduleIntervalMinutes(60)
                .safetyDelayMinutes(30).batchSize(200000)
                .maxBatchesPerRun(10).maxRunDurationSeconds(900).build();
        when(configLoader.loadOnce()).thenReturn(disabledConfig);

        scheduler.onApplicationEvent(applicationReadyEvent);

        verify(batchSizeManager, never()).initialize(anyInt());
    }

    @Test
    void batchSizeManagerNotInitializedWhenConfigLoadFails() {
        StatsScheduler scheduler = createScheduler();
        when(configLoader.loadOnce())
                .thenThrow(new StatsConfigLoadException("No config found"));

        scheduler.onApplicationEvent(applicationReadyEvent);

        verify(batchSizeManager, never()).initialize(anyInt());
    }

    // ============================================================
    // 调度参数验证 — 60 秒周期
    // ============================================================

    @Test
    void warnScheduleRegisteredWith60SecondPeriodAndSecondsUnit() {
        StatsScheduler scheduler = createScheduler();

        scheduler.startPeriodicWarn(mockWarnScheduler);

        ArgumentCaptor<Runnable> runnableCaptor = ArgumentCaptor.forClass(Runnable.class);
        verify(mockWarnScheduler).scheduleWithFixedDelay(
                runnableCaptor.capture(), eq(60L), eq(60L), eq(TimeUnit.SECONDS));
        // initialDelay = 60, period = 60, unit = SECONDS
        assertNotNull(runnableCaptor.getValue(), "warnTask Runnable should be registered");
        assertEquals(scheduler.warnTask, runnableCaptor.getValue(),
                "registered Runnable should be the same as warnTask field");
    }

    @Test
    void startPeriodicWarnNotCalledWhenConfigLoadsSuccessfully() {
        StatsScheduler scheduler = createScheduler();
        StatsScheduler spy = spy(scheduler);
        when(configLoader.loadOnce()).thenReturn(config);

        spy.onApplicationEvent(applicationReadyEvent);

        verify(spy, never()).startPeriodicWarn(any(ScheduledExecutorService.class));
        assertNull(spy.warnScheduler);
        assertNull(spy.warnTask);
    }

    @Test
    void startPeriodicWarnNotCalledWhenTaskDisabled() {
        StatsScheduler scheduler = createScheduler();
        StatsScheduler spy = spy(scheduler);
        StatsTaskConfig disabledConfig = StatsTaskConfig.builder()
                .taskCode("LARGE_SCREEN_STATS").taskName("Test").enabled(0)
                .startupDelayMinutes(10).scheduleIntervalMinutes(60)
                .safetyDelayMinutes(30).batchSize(200000)
                .maxBatchesPerRun(10).maxRunDurationSeconds(900).build();
        when(configLoader.loadOnce()).thenReturn(disabledConfig);

        spy.onApplicationEvent(applicationReadyEvent);

        verify(spy, never()).startPeriodicWarn(any(ScheduledExecutorService.class));
        assertNull(spy.warnScheduler);
        assertNull(spy.warnTask);
    }

    @Test
    void normalScheduleNotCreatedOnConfigFailure() {
        StatsScheduler scheduler = createScheduler();
        StatsScheduler spy = spy(scheduler);
        when(configLoader.loadOnce())
                .thenThrow(new StatsConfigLoadException("No config found"));

        spy.onApplicationEvent(applicationReadyEvent);

        verify(taskScheduler, never()).scheduleWithFixedDelay(any(Runnable.class),
                any(Date.class), anyLong());
    }

    // ============================================================
    // ERROR 日志事件验证（ListAppender 捕获实际 ILoggingEvent）
    // ============================================================

    /**
     * 配置加载失败时产生恰好一条 ERROR，携带 StatsConfigLoadException，
     * 消息包含"大屏统计""配置加载失败""统计任务将不会启动"语义。
     */
    @Test
    void configFailureEmitsOneErrorWithThrowableAndCorrectMessage() {
        StatsScheduler scheduler = createScheduler();
        ListAppender<ILoggingEvent> appender = attachAppender();
        StatsConfigLoadException ex = new StatsConfigLoadException("Config not found");
        when(configLoader.loadOnce()).thenThrow(ex);

        scheduler.onApplicationEvent(applicationReadyEvent);

        List<ILoggingEvent> errors = eventsOfLevel(appender, Level.ERROR);
        assertEquals(1, errors.size(), "should emit exactly 1 ERROR event");

        ILoggingEvent errorEvent = errors.get(0);
        assertEquals(Level.ERROR, errorEvent.getLevel(), "log level must be ERROR");

        String msg = errorEvent.getFormattedMessage();
        assertTrue(msg.contains("大屏统计"), "message should mention 大屏统计");
        assertTrue(msg.contains("配置加载失败"), "message should mention 配置加载失败");
        assertTrue(msg.contains("统计任务将不会启动") || msg.contains("不会启动"),
                "message should indicate task will not start");

        assertNotNull(errorEvent.getThrowableProxy(),
                "throwableProxy must not be null — full stack trace required");
        assertTrue(errorEvent.getThrowableProxy().getClassName().contains("StatsConfigLoadException"),
                "Throwable must be StatsConfigLoadException, got: "
                        + errorEvent.getThrowableProxy().getClassName());
    }

    /** 配置加载成功时不产生 ERROR 日志。 */
    @Test
    void noErrorWhenConfigLoadsSuccessfully() {
        StatsScheduler scheduler = createScheduler();
        ListAppender<ILoggingEvent> appender = attachAppender();
        when(configLoader.loadOnce()).thenReturn(config);

        scheduler.onApplicationEvent(applicationReadyEvent);

        List<ILoggingEvent> errors = eventsOfLevel(appender, Level.ERROR);
        assertTrue(errors.isEmpty(), "should emit 0 ERROR events on success, got " + errors.size());
    }

    /** 任务停用时 (enabled=0) 不产生 ERROR 日志。 */
    @Test
    void noErrorWhenTaskDisabled() {
        StatsScheduler scheduler = createScheduler();
        ListAppender<ILoggingEvent> appender = attachAppender();
        StatsTaskConfig disabledConfig = StatsTaskConfig.builder()
                .taskCode("LARGE_SCREEN_STATS").taskName("Test").enabled(0)
                .startupDelayMinutes(10).scheduleIntervalMinutes(60)
                .safetyDelayMinutes(30).batchSize(200000)
                .maxBatchesPerRun(10).maxRunDurationSeconds(900).build();
        when(configLoader.loadOnce()).thenReturn(disabledConfig);

        scheduler.onApplicationEvent(applicationReadyEvent);

        List<ILoggingEvent> errors = eventsOfLevel(appender, Level.ERROR);
        assertTrue(errors.isEmpty(), "should emit 0 ERROR events when disabled, got " + errors.size());
    }

    // ============================================================
    // WARN 日志事件验证（ListAppender 捕获实际 ILoggingEvent）
    // ============================================================

    /**
     * 配置失败后同步执行 warnTask 一次，恰好产生一条 WARN，
     * 消息包含"大屏统计任务未启动""配置加载失败"，throwableProxy 为 null。
     */
    @Test
    void singleWarnTaskRunEmitsOneWarnWithoutThrowable() {
        StatsScheduler scheduler = createScheduler();
        when(configLoader.loadOnce())
                .thenThrow(new StatsConfigLoadException("No config found"));

        scheduler.onApplicationEvent(applicationReadyEvent);

        // 挂载 appender 在 warnTask 执行前，避免捕获 onApplicationEvent 的 ERROR
        ListAppender<ILoggingEvent> appender = attachAppender();

        assertNotNull(scheduler.warnTask, "warnTask must be non-null after config failure");
        scheduler.warnTask.run();

        List<ILoggingEvent> warns = eventsOfLevel(appender, Level.WARN);
        assertEquals(1, warns.size(), "should emit exactly 1 WARN event");

        ILoggingEvent warnEvent = warns.get(0);
        assertEquals(Level.WARN, warnEvent.getLevel(), "log level must be WARN");

        String msg = warnEvent.getFormattedMessage();
        assertTrue(msg.contains("大屏统计任务未启动"), "message should mention 大屏统计任务未启动");
        assertTrue(msg.contains("配置加载失败"), "message should mention 配置加载失败");

        assertNull(warnEvent.getThrowableProxy(),
                "throwableProxy must be null — WARN must not carry a Throwable");
    }

    /** 连续执行两次 warnTask，恰好产生两条 WARN，且均无 throwableProxy。 */
    @Test
    void twoWarnTaskRunsEmitTwoWarnsBothWithoutThrowable() {
        StatsScheduler scheduler = createScheduler();
        when(configLoader.loadOnce())
                .thenThrow(new StatsConfigLoadException("No config found"));

        scheduler.onApplicationEvent(applicationReadyEvent);

        ListAppender<ILoggingEvent> appender = attachAppender();

        assertNotNull(scheduler.warnTask);
        scheduler.warnTask.run();
        scheduler.warnTask.run();

        List<ILoggingEvent> warns = eventsOfLevel(appender, Level.WARN);
        assertEquals(2, warns.size(), "should emit exactly 2 WARN events after 2 runs");

        for (ILoggingEvent e : warns) {
            assertEquals(Level.WARN, e.getLevel(), "each WARN must have Level=WARN");
            assertNull(e.getThrowableProxy(),
                    "each WARN must have null throwableProxy (no stack trace)");
            assertTrue(e.getFormattedMessage().contains("配置加载失败"),
                    "each WARN message should mention 配置加载失败");
        }
    }

    /** 执行 warnTask 两次后 ERROR 数量仍为 1，WARN 不触发额外 ERROR。 */
    @Test
    void warnExecutionsDoNotIncreaseErrorCount() {
        StatsScheduler scheduler = createScheduler();
        when(configLoader.loadOnce())
                .thenThrow(new StatsConfigLoadException("No config found"));

        scheduler.onApplicationEvent(applicationReadyEvent);

        // 挂载 appender 在 onApplicationEvent 之后，只捕获后续 WARN 产生的日志
        ListAppender<ILoggingEvent> appender = attachAppender();

        assertNotNull(scheduler.warnTask);
        scheduler.warnTask.run();
        scheduler.warnTask.run();

        // WARN 执行不应产生任何 ERROR
        List<ILoggingEvent> errors = eventsOfLevel(appender, Level.ERROR);
        assertTrue(errors.isEmpty(),
                "WARN executions should emit 0 ERROR events, got " + errors.size());
    }

    // ============================================================
    // WARN 行为验证（不重新加载配置、不创建统计调度）
    // ============================================================

    /** logConfigNotStartedWarn 方法无参数 — 编译期保证不携带 Throwable。 */
    @Test
    void logConfigNotStartedWarnTakesNoArguments() throws NoSuchMethodException {
        java.lang.reflect.Method m = StatsScheduler.class.getDeclaredMethod("logConfigNotStartedWarn");
        assertEquals(0, m.getParameterCount(),
                "logConfigNotStartedWarn must have zero parameters to guarantee no Throwable");
    }

    @Test
    void warnTaskDoesNotCallLoadOnce() {
        StatsScheduler scheduler = createScheduler();
        when(configLoader.loadOnce())
                .thenThrow(new StatsConfigLoadException("No config found"));

        scheduler.onApplicationEvent(applicationReadyEvent);

        verify(configLoader, times(1)).loadOnce();

        assertNotNull(scheduler.warnTask);
        scheduler.warnTask.run();
        scheduler.warnTask.run();

        // WARN 不重新调用 loadOnce → 不查询配置 Mapper
        verify(configLoader, times(1)).loadOnce();
    }

    @Test
    void warnTaskDoesNotCallTaskSchedulerForNormalSchedule() {
        StatsScheduler scheduler = createScheduler();
        when(configLoader.loadOnce())
                .thenThrow(new StatsConfigLoadException("No config found"));

        scheduler.onApplicationEvent(applicationReadyEvent);

        // 配置失败路径不创建正常统计调度
        verify(taskScheduler, never()).scheduleWithFixedDelay(any(Runnable.class),
                any(Date.class), anyLong());

        assertNotNull(scheduler.warnTask);
        scheduler.warnTask.run();
        scheduler.warnTask.run();

        // WARN 执行后仍不创建正常统计调度
        verify(taskScheduler, never()).scheduleWithFixedDelay(any(Runnable.class),
                any(Date.class), anyLong());
        verifyNoMoreInteractions(taskScheduler);
    }
}
