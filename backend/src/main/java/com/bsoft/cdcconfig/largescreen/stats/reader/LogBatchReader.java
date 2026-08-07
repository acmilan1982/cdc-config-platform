package com.bsoft.cdcconfig.largescreen.stats.reader;

import com.bsoft.cdcconfig.largescreen.stats.dto.LogRecordProjection;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.jdbc.core.RowCallbackHandler;
import org.springframework.stereotype.Component;

import java.sql.ResultSet;
import java.sql.SQLException;
import java.util.ArrayList;
import java.util.Collections;
import java.util.List;
import java.util.Set;
import java.util.function.Consumer;

/**
 * 日志批量读取器，使用 JdbcTemplate 流式读取轻量投影字段。
 * 表名通过白名单控制，不允许任意字符串拼接。
 */
@Component
public class LogBatchReader {

    private static final Logger log = LoggerFactory.getLogger(LogBatchReader.class);

    private static final Set<String> ALLOWED_TABLES = Collections.unmodifiableSet(
            new java.util.HashSet<>(java.util.Arrays.asList("CDC_LOG_CORRECT", "CDC_LOG_ERROR")));

    private static final String QUERY_SQL =
            "SELECT CDC_LOG_ID, TARGET_TIME, INSERT_TIME, "
                    + "SOURCE_DATA_SOURCE_ID, TARGET_DATA_SOURCE_ID, "
                    + "SOURCE_SCHEMA_NAME, SOURCE_TABLE_NAME "
                    + "FROM %s "
                    + "WHERE CDC_LOG_ID > ? AND CDC_LOG_ID <= ? "
                    + "ORDER BY CDC_LOG_ID ASC "
                    + "FETCH FIRST ? ROWS ONLY";

    private final JdbcTemplate jdbcTemplate;

    public LogBatchReader(JdbcTemplate jdbcTemplate) {
        this.jdbcTemplate = jdbcTemplate;
    }

    /**
     * 批量读取日志投影，返回最多 batchSize 条记录（按 CDC_LOG_ID 升序）。
     * 空结果返回空列表。
     */
    public List<LogRecordProjection> readBatch(String tableName, long lowerId,
                                                long upperId, int batchSize) {
        if (!ALLOWED_TABLES.contains(tableName)) {
            throw new IllegalArgumentException("Table not allowed: " + tableName);
        }
        if (lowerId < 0 || upperId < 0 || lowerId >= upperId) {
            throw new IllegalArgumentException(
                    "Invalid range: lowerId=" + lowerId + " upperId=" + upperId);
        }
        if (batchSize < 1 || batchSize > 1000000) {
            throw new IllegalArgumentException("Invalid batchSize: " + batchSize);
        }

        String sql = String.format(QUERY_SQL, tableName);
        // Set fetchSize for streaming; Oracle driver supports this
        jdbcTemplate.setFetchSize(500);

        List<LogRecordProjection> results = jdbcTemplate.query(sql,
                new Object[]{lowerId, upperId, batchSize},
                this::mapRow);

        if (results.isEmpty()) {
            return Collections.emptyList();
        }
        log.debug("Read {} rows from {} ({} < CDC_LOG_ID <= {})",
                results.size(), tableName, lowerId, upperId);
        return results;
    }

    /**
     * 流式读取日志投影，通过 RowCallbackHandler 逐行消费，不累积 List。
     * 生产路径使用此方法。
     */
    public void readBatchStreaming(String tableName, long lowerId, long upperId,
                                   int batchSize, Consumer<LogRecordProjection> consumer) {
        if (!ALLOWED_TABLES.contains(tableName)) {
            throw new IllegalArgumentException("Table not allowed: " + tableName);
        }
        if (lowerId < 0 || upperId < 0 || lowerId >= upperId) {
            throw new IllegalArgumentException(
                    "Invalid range: lowerId=" + lowerId + " upperId=" + upperId);
        }
        if (batchSize < 1 || batchSize > 1000000) {
            throw new IllegalArgumentException("Invalid batchSize: " + batchSize);
        }

        String sql = String.format(QUERY_SQL, tableName);
        jdbcTemplate.setFetchSize(500);

        jdbcTemplate.query(sql, new Object[]{lowerId, upperId, batchSize},
                (RowCallbackHandler) rs -> {
                    LogRecordProjection p = mapRow(rs, 0);
                    consumer.accept(p);
                });
    }

    private LogRecordProjection mapRow(ResultSet rs, int rowNum) throws SQLException {
        LogRecordProjection p = new LogRecordProjection();
        p.setCdcLogId(rs.getLong("CDC_LOG_ID"));
        p.setTargetTime(rs.getDate("TARGET_TIME"));
        p.setInsertTime(rs.getDate("INSERT_TIME"));
        p.setSourceDataSourceId(rs.getString("SOURCE_DATA_SOURCE_ID"));
        p.setTargetDataSourceId(rs.getString("TARGET_DATA_SOURCE_ID"));
        p.setSourceSchemaName(rs.getString("SOURCE_SCHEMA_NAME"));
        p.setSourceTableName(rs.getString("SOURCE_TABLE_NAME"));
        return p;
    }
}
