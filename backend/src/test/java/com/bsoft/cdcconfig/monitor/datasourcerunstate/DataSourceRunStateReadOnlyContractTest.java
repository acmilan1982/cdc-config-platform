package com.bsoft.cdcconfig.monitor.datasourcerunstate;

import com.baomidou.mybatisplus.core.mapper.BaseMapper;
import com.bsoft.cdcconfig.monitor.datasourcerunstate.controller.DataSourceRunStateController;
import com.bsoft.cdcconfig.monitor.datasourcerunstate.mapper.DataSourceRunStateMapper;
import com.bsoft.cdcconfig.monitor.datasourcerunstate.mapper.RunStateClientMapper;
import com.bsoft.cdcconfig.monitor.datasourcerunstate.mapper.RunStateDataSourceMapper;
import org.apache.ibatis.annotations.Select;
import org.junit.jupiter.api.Test;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestMapping;

import java.lang.reflect.Method;
import java.util.Arrays;
import java.util.List;
import java.util.regex.Pattern;

import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertTrue;

/**
 * 静态只读契约校验（DESIGN §11）：Mapper 不继承 BaseMapper、SQL 仅 SELECT、显式列、
 * 不读取 DATA_SOURCE_PASSWORD；Controller 仅一个 GET 端点，无任何写注解。
 */
class DataSourceRunStateReadOnlyContractTest {

    private static final Pattern FORBIDDEN_STATEMENT = Pattern.compile(
            "(?i)\\b(insert|update|delete|merge|create|alter|drop|truncate)\\b");

    private static final List<Class<?>> MAPPER_CLASSES = Arrays.asList(
            DataSourceRunStateMapper.class, RunStateClientMapper.class, RunStateDataSourceMapper.class);

    @Test
    void mappersShouldNotExtendBaseMapper() {
        for (Class<?> clazz : MAPPER_CLASSES) {
            assertFalse(BaseMapper.class.isAssignableFrom(clazz),
                    clazz.getSimpleName() + " must not extend BaseMapper");
        }
    }

    @Test
    void mapperSqlShouldOnlyContainSelectStatementsWithoutPasswordOrStar() throws Exception {
        for (Class<?> clazz : MAPPER_CLASSES) {
            for (Method method : clazz.getDeclaredMethods()) {
                Select select = method.getAnnotation(Select.class);
                assertTrue(select != null, clazz.getSimpleName() + "." + method.getName() + " must be @Select");
                String sql = String.join(" ", select.value()).toUpperCase();
                assertTrue(sql.trim().startsWith("SELECT"),
                        clazz.getSimpleName() + "." + method.getName() + " must start with SELECT");
                assertFalse(FORBIDDEN_STATEMENT.matcher(sql).find(),
                        clazz.getSimpleName() + "." + method.getName() + " contains a write statement");
                assertFalse(sql.contains("SELECT *"),
                        clazz.getSimpleName() + "." + method.getName() + " must not use SELECT *");
                assertFalse(sql.contains("DATA_SOURCE_PASSWORD"),
                        clazz.getSimpleName() + "." + method.getName() + " must not read the password column");
            }
        }
    }

    @Test
    void runStateMapperSqlShouldProjectSixSafeColumnsWithToCharDates() throws Exception {
        String sql = String.join(" ", DataSourceRunStateMapper.class.getDeclaredMethod("selectAll")
                .getAnnotation(Select.class).value());
        String upper = sql.toUpperCase();
        assertTrue(upper.contains("CLIENT_ID"));
        assertTrue(upper.contains("DATA_SOURCE_ID"));
        assertTrue(upper.contains("SNAPSHOT_STATUS"));
        assertTrue(upper.contains("FROM CDC_DATA_SOURCE_RUN_STATE"));
        // 三个 DATE 均 TO_CHAR 固定格式，Java 只透传
        assertTrue(upper.contains("TO_CHAR(SNAPSHOT_LAST_SEEN_AT"));
        assertTrue(upper.contains("TO_CHAR(SNAPSHOT_COMPLETED_AT"));
        assertTrue(upper.contains("TO_CHAR(UPDATED_AT"));
        assertTrue(sql.contains("YYYY-MM-DD HH24:MI:SS"));
        // 无 WHERE，全量驱动集（保行关键）
        assertFalse(upper.contains(" WHERE "));
    }

    @Test
    void controllerShouldExposeOnlyOneReadOnlyGetEndpoint() {
        Class<?> clazz = DataSourceRunStateController.class;
        RequestMapping mapping = clazz.getAnnotation(RequestMapping.class);
        assertTrue(mapping != null);
        assertTrue(mapping.value().length == 1
                && "/api/monitor/data-source-run-state".equals(mapping.value()[0]));

        Method[] methods = clazz.getDeclaredMethods();
        assertTrue(methods.length == 1, "controller should expose exactly one endpoint");
        Method method = methods[0];
        assertTrue(method.getAnnotation(GetMapping.class) != null, "must be annotated with @GetMapping");
        assertFalse(method.isAnnotationPresent(PostMapping.class), "must not be POST");
        assertFalse(method.isAnnotationPresent(PutMapping.class), "must not be PUT");
        assertFalse(method.isAnnotationPresent(DeleteMapping.class), "must not be DELETE");
        assertFalse(method.isAnnotationPresent(PatchMapping.class), "must not be PATCH");
    }
}
