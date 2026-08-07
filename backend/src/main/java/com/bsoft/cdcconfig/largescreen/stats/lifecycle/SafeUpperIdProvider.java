package com.bsoft.cdcconfig.largescreen.stats.lifecycle;

import com.bsoft.cdcconfig.common.util.SnowflakeIdBoundaryCalculator;
import com.bsoft.cdcconfig.largescreen.stats.config.StatsTaskConfig;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Component;

import java.time.Clock;
import java.util.Arrays;
import java.util.Collections;
import java.util.HashSet;
import java.util.Set;

/**
 * 双流安全上限提供器。
 * 分别查询 CORRECT/ERROR 日志表的最大 CDC_LOG_ID，结合安全延迟计算安全上限。
 */
@Component
public class SafeUpperIdProvider {

    private static final Set<String> ALLOWED_TABLES =
            Collections.unmodifiableSet(new HashSet<>(Arrays.asList(
                    "CDC_LOG_CORRECT", "CDC_LOG_ERROR")));

    private final JdbcTemplate jdbcTemplate;
    private final Clock clock;

    public SafeUpperIdProvider(JdbcTemplate jdbcTemplate, Clock clock) {
        this.jdbcTemplate = jdbcTemplate;
        this.clock = clock;
    }

    /**
     * 分别计算两个流的安全上限。
     */
    public SafeUpperIds compute(StatsTaskConfig config) {
        long timeBoundary = SnowflakeIdBoundaryCalculator.maxIdAt(
                clock.millis() - config.getSafetyDelayMinutes() * 60_000L);

        long correctMaxId = queryMaxLogId("CDC_LOG_CORRECT");
        long errorMaxId = queryMaxLogId("CDC_LOG_ERROR");

        return new SafeUpperIds(
                correctMaxId == 0 ? 0 : Math.min(correctMaxId, timeBoundary),
                errorMaxId == 0 ? 0 : Math.min(errorMaxId, timeBoundary),
                correctMaxId, errorMaxId, timeBoundary);
    }

    long queryMaxLogId(String tableName) {
        if (!ALLOWED_TABLES.contains(tableName)) {
            throw new IllegalArgumentException("Table not allowed: " + tableName);
        }
        Long maxId = jdbcTemplate.queryForObject(
                "SELECT MAX(CDC_LOG_ID) FROM " + tableName, Long.class);
        return maxId != null ? maxId : 0L;
    }

    /**
     * 双流安全上限值对象。
     */
    public static class SafeUpperIds {
        public final long correctSafeUpperId;
        public final long errorSafeUpperId;
        public final long correctMaxLogId;
        public final long errorMaxLogId;
        public final long timeBoundary;

        public SafeUpperIds(long correctSafeUpperId, long errorSafeUpperId,
                            long correctMaxLogId, long errorMaxLogId, long timeBoundary) {
            this.correctSafeUpperId = correctSafeUpperId;
            this.errorSafeUpperId = errorSafeUpperId;
            this.correctMaxLogId = correctMaxLogId;
            this.errorMaxLogId = errorMaxLogId;
            this.timeBoundary = timeBoundary;
        }
    }
}
