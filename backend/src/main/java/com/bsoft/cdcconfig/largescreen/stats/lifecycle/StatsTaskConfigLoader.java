package com.bsoft.cdcconfig.largescreen.stats.lifecycle;

import com.bsoft.cdcconfig.largescreen.stats.config.StatsTaskConfig;
import com.bsoft.cdcconfig.largescreen.stats.entity.StatsTaskConfigEntity;
import com.bsoft.cdcconfig.largescreen.stats.mapper.StatsTaskConfigMapper;
import com.baomidou.mybatisplus.core.conditions.query.LambdaQueryWrapper;
import org.springframework.stereotype.Component;

import java.util.List;

/**
 * 统计任务配置加载器。
 * 本次应用生命周期只尝试加载一次，采用三态状态机：
 * NOT_ATTEMPTED → LOADED（成功）或 FAILED（失败）。
 * Loader 不记录任何日志，日志由调用方（StatsScheduler）负责。
 */
@Component
public class StatsTaskConfigLoader {

    private static final String TASK_CODE = "LARGE_SCREEN_STATS";

    private enum LoadState { NOT_ATTEMPTED, LOADED, FAILED }

    private final StatsTaskConfigMapper configMapper;
    private final Object lock = new Object();
    private volatile LoadState state = LoadState.NOT_ATTEMPTED;
    private volatile StatsTaskConfig cachedConfig;
    private volatile StatsConfigLoadException cachedException;

    public StatsTaskConfigLoader(StatsTaskConfigMapper configMapper) {
        this.configMapper = configMapper;
    }

    /**
     * 本次应用生命周期只尝试加载一次。
     *
     * NOT_ATTEMPTED: 执行 DB 查询；成功→LOADED+缓存配置；失败→FAILED+缓存异常
     * LOADED:        直接返回缓存配置，不访问数据库
     * FAILED:        直接抛出缓存异常，不访问数据库
     *
     * 并发调用: synchronized(lock) 确保只有一个线程执行首次 DB 查询。
     * 不记录日志。
     */
    public StatsTaskConfig loadOnce() {
        if (state == LoadState.LOADED) {
            return cachedConfig;
        }
        if (state == LoadState.FAILED) {
            throw cachedException;
        }
        synchronized (lock) {
            if (state == LoadState.LOADED) {
                return cachedConfig;
            }
            if (state == LoadState.FAILED) {
                throw cachedException;
            }
            try {
                LambdaQueryWrapper<StatsTaskConfigEntity> wrapper = new LambdaQueryWrapper<>();
                wrapper.eq(StatsTaskConfigEntity::getTaskCode, TASK_CODE);
                List<StatsTaskConfigEntity> entities = configMapper.selectList(wrapper);

                if (entities.isEmpty()) {
                    throw new StatsConfigLoadException(
                            "No config found for TASK_CODE='" + TASK_CODE + "' in CDC_STATS_TASK_CONFIG");
                }
                if (entities.size() > 1) {
                    throw new StatsConfigLoadException(
                            "Multiple config rows (" + entities.size() + ") for TASK_CODE='" + TASK_CODE + "'");
                }

                StatsTaskConfigEntity e = entities.get(0);
                checkNotNull(e.getEnabled(), "ENABLED");
                checkNotNull(e.getStartupDelayMinutes(), "STARTUP_DELAY_MINUTES");
                checkNotNull(e.getScheduleIntervalMinutes(), "SCHEDULE_INTERVAL_MINUTES");
                checkNotNull(e.getSafetyDelayMinutes(), "SAFETY_DELAY_MINUTES");
                checkNotNull(e.getBatchSize(), "BATCH_SIZE");
                checkNotNull(e.getMaxBatchesPerRun(), "MAX_BATCHES_PER_RUN");
                checkNotNull(e.getMaxRunDurationSeconds(), "MAX_RUN_DURATION_SECONDS");

                StatsTaskConfig config = StatsTaskConfig.builder()
                        .taskCode(e.getTaskCode())
                        .taskName(e.getTaskName() != null ? e.getTaskName() : "")
                        .enabled(e.getEnabled())
                        .startupDelayMinutes(e.getStartupDelayMinutes())
                        .scheduleIntervalMinutes(e.getScheduleIntervalMinutes())
                        .safetyDelayMinutes(e.getSafetyDelayMinutes())
                        .batchSize(e.getBatchSize())
                        .maxBatchesPerRun(e.getMaxBatchesPerRun())
                        .maxRunDurationSeconds(e.getMaxRunDurationSeconds())
                        .build();

                cachedConfig = config;
                state = LoadState.LOADED;
                return cachedConfig;

            } catch (StatsConfigLoadException e) {
                cachedException = e;
                state = LoadState.FAILED;
                throw e;
            } catch (Exception e) {
                // Wrap validation or DB exceptions
                StatsConfigLoadException wrapped = new StatsConfigLoadException(
                        "Failed to load config for TASK_CODE='" + TASK_CODE + "': " + e.getMessage(), e);
                cachedException = wrapped;
                state = LoadState.FAILED;
                throw wrapped;
            }
        }
    }

    public StatsTaskConfig getConfig() { return cachedConfig; }

    public boolean isLoaded() { return state == LoadState.LOADED; }

    public boolean isFailed() { return state == LoadState.FAILED; }

    private void checkNotNull(Integer value, String fieldName) {
        if (value == null) {
            throw new StatsConfigLoadException(
                    "Null field in CDC_STATS_TASK_CONFIG: " + fieldName + " for TASK_CODE='" + TASK_CODE + "'");
        }
    }
}
