package com.bsoft.cdcconfig.largescreen.stats.mapper;

import org.junit.jupiter.api.Test;

import java.lang.reflect.Method;
import java.util.Arrays;
import java.util.HashSet;
import java.util.Set;

import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertTrue;

/**
 * SQL 边界检查：验证 LargeScreenMapper 中的 @Select 注解不包含禁止模式。
 * - 禁止 SELECT *
 * - 禁止 ${} 动态拼接
 * - 禁止日志大表和禁用统计表
 * - 禁止 NLS 隐式转换
 */
class LargeScreenMapperSqlCheckTest {

    private static final Set<String> FORBIDDEN_TABLES = new HashSet<>(Arrays.asList(
            "CDC_LOG_CORRECT",
            "CDC_LOG_ERROR",
            "CDC_SYNC_CURRENT_STATS",
            "CDC_ABNORMAL_COUNT_STATS",
            "CDC_ORG_SYNC_STATS",
            "MV_CDC_STATS"
    ));

    @Test
    void noSelectStarInAnyMapperMethod() throws Exception {
        for (Method method : LargeScreenMapper.class.getDeclaredMethods()) {
            org.apache.ibatis.annotations.Select select =
                    method.getAnnotation(org.apache.ibatis.annotations.Select.class);
            if (select != null) {
                for (String sql : select.value()) {
                    String upper = sql.toUpperCase();
                    assertFalse(upper.contains("SELECT *"),
                            method.getName() + " contains SELECT *: " + sql);
                    assertFalse(upper.contains("SELECT  *"),
                            method.getName() + " contains SELECT  *: " + sql);
                }
            }
        }
    }

    @Test
    void noStringInterpolationInAnyMapperMethod() throws Exception {
        for (Method method : LargeScreenMapper.class.getDeclaredMethods()) {
            org.apache.ibatis.annotations.Select select =
                    method.getAnnotation(org.apache.ibatis.annotations.Select.class);
            if (select != null) {
                for (String sql : select.value()) {
                    assertFalse(sql.contains("${"),
                            method.getName() + " contains ${}: " + sql);
                }
            }
        }
    }

    @Test
    void noForbiddenTableAccessInAnyMapperMethod() throws Exception {
        for (Method method : LargeScreenMapper.class.getDeclaredMethods()) {
            org.apache.ibatis.annotations.Select select =
                    method.getAnnotation(org.apache.ibatis.annotations.Select.class);
            if (select != null) {
                for (String sql : select.value()) {
                    String upper = sql.toUpperCase();
                    for (String forbidden : FORBIDDEN_TABLES) {
                        assertFalse(upper.contains(forbidden),
                                method.getName() + " references " + forbidden);
                    }
                }
            }
        }
    }

    @Test
    void coverageDoesNotUseOrgDedupInSql() throws Exception {
        // 覆盖规模不得在 SQL 侧按 DATA_SOURCE_ORG 做 COUNT(DISTINCT ...) 去重
        for (Method method : LargeScreenMapper.class.getDeclaredMethods()) {
            org.apache.ibatis.annotations.Select select =
                    method.getAnnotation(org.apache.ibatis.annotations.Select.class);
            if (select != null) {
                for (String sql : select.value()) {
                    String upper = sql.toUpperCase();
                    assertFalse(upper.contains("DATA_SOURCE_ORG"),
                            method.getName() + " references DATA_SOURCE_ORG in SQL: " + sql);
                }
            }
        }
    }

    @Test
    void noTruncSysdateOrImplicitNlsConversion() throws Exception {
        for (Method method : LargeScreenMapper.class.getDeclaredMethods()) {
            org.apache.ibatis.annotations.Select select =
                    method.getAnnotation(org.apache.ibatis.annotations.Select.class);
            if (select != null) {
                for (String sql : select.value()) {
                    String upper = sql.toUpperCase();
                    assertFalse(upper.contains("TRUNC("),
                            method.getName() + " uses TRUNC(): " + sql);
                    assertFalse(upper.contains("TO_DATE(") && sql.toUpperCase().contains("SYSDATE"),
                            method.getName() + " uses TO_DATE with SYSDATE: " + sql);
                }
            }
        }
    }

    @Test
    void allParameterizedSelectMethodsUseParamAnnotation() throws Exception {
        for (Method method : LargeScreenMapper.class.getDeclaredMethods()) {
            org.apache.ibatis.annotations.Select select =
                    method.getAnnotation(org.apache.ibatis.annotations.Select.class);
            if (select != null && method.getParameterCount() > 0) {
                for (String sql : select.value()) {
                    assertTrue(sql.contains("#{"),
                            method.getName() + " with params does not use #{bound params}: " + sql);
                }
            }
        }
    }

    @Test
    void top10MethodsUseFetchFirst() throws Exception {
        Method[] top10Methods = {
                LargeScreenMapper.class.getDeclaredMethod("selectTop10SourceDatabases", String.class),
                LargeScreenMapper.class.getDeclaredMethod("selectTop10TargetDatabases", String.class),
                LargeScreenMapper.class.getDeclaredMethod("selectTop10Tables", String.class)
        };
        for (Method method : top10Methods) {
            org.apache.ibatis.annotations.Select select =
                    method.getAnnotation(org.apache.ibatis.annotations.Select.class);
            boolean hasFetchFirst = false;
            for (String sql : select.value()) {
                if (sql.toUpperCase().contains("FETCH FIRST 10 ROWS ONLY")) {
                    hasFetchFirst = true;
                }
            }
            assertTrue(hasFetchFirst, method.getName() + " missing FETCH FIRST 10 ROWS ONLY");
        }
    }
}
