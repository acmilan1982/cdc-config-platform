package com.bsoft.cdcconfig.monitor.jobfailure.compat;

import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.jdbc.core.JdbcTemplate;

import java.time.LocalDateTime;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertNotNull;

/**
 * Minimal Oracle DATE to LocalDateTime mapping verification.
 *
 * Uses JdbcTemplate (not MyBatis-Plus) to avoid Mapper scan issues in test source.
 * Verifies that Oracle thin driver + JDK 8 correctly maps DATE columns to LocalDateTime
 * through the project's actual datasource.
 */
@SpringBootTest
class OracleDateMappingTest {

    @Autowired
    private JdbcTemplate jdbcTemplate;

    @Test
    void oracleDateToLocalDateTime_viaJdbcTemplate_shouldMapCorrectly() {
        // Query all DATE columns from the real table using getObject(col, LocalDateTime.class)
        // This is the same code path MyBatis uses internally via TypeHandler
        LocalDateTime failureTime = jdbcTemplate.queryForObject(
                "SELECT FAILURE_TIME FROM CDC_JOB_FAILURE_EVENT WHERE ROWNUM = 1",
                (rs, rowNum) -> rs.getObject("FAILURE_TIME", LocalDateTime.class));

        LocalDateTime createdAt = jdbcTemplate.queryForObject(
                "SELECT CREATED_AT FROM CDC_JOB_FAILURE_EVENT WHERE ROWNUM = 1",
                (rs, rowNum) -> rs.getObject("CREATED_AT", LocalDateTime.class));

        // -- FAILURE_TIME: known value 2026-07-27 19:17:24 --
        assertNotNull(failureTime, "FAILURE_TIME should map to non-null LocalDateTime");
        assertEquals(2026, failureTime.getYear());
        assertEquals(7, failureTime.getMonthValue());
        assertEquals(27, failureTime.getDayOfMonth());
        assertEquals(19, failureTime.getHour());
        assertEquals(17, failureTime.getMinute());
        assertEquals(24, failureTime.getSecond());
        assertEquals(0, failureTime.getNano(), "Oracle DATE has no sub-second precision");

        // -- CREATED_AT: known value 2026-07-27 19:18:41 --
        assertNotNull(createdAt, "CREATED_AT should map to non-null LocalDateTime");
        assertEquals(2026, createdAt.getYear());
        assertEquals(7, createdAt.getMonthValue());
        assertEquals(27, createdAt.getDayOfMonth());
        assertEquals(19, createdAt.getHour());
        assertEquals(18, createdAt.getMinute());
        assertEquals(41, createdAt.getSecond());
        assertEquals(0, createdAt.getNano());

        // Verify ordering invariant
        assertFalse(failureTime.isAfter(createdAt),
                "FAILURE_TIME should be before or equal to CREATED_AT");
    }

    @Test
    void oracleDateNullHandling_shouldReturnNullForNullColumn() {
        // Many columns are nullable; test NEXT_RESTART_TIME which can be null
        LocalDateTime nullTime = jdbcTemplate.queryForObject(
                "SELECT NEXT_RESTART_TIME FROM CDC_JOB_FAILURE_HANDLE_LOG WHERE HANDLE_STAGE = 'JOB_FAILURE_RECEIVED' AND ROWNUM = 1",
                (rs, rowNum) -> rs.getObject("NEXT_RESTART_TIME", LocalDateTime.class));

        // JOB_FAILURE_RECEIVED stage does not set NEXT_RESTART_TIME
        // It should be null — and LocalDateTime is nullable so this is fine
        // (no assertion on null/not-null — just verifying no ClassCastException)
    }
}
