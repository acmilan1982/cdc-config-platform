package com.bsoft.cdcconfig.monitor.topicoffset;

import com.baomidou.mybatisplus.core.mapper.BaseMapper;
import com.bsoft.cdcconfig.monitor.topicoffset.controller.TopicOffsetController;
import com.bsoft.cdcconfig.monitor.topicoffset.mapper.ClientConfigMapper;
import com.bsoft.cdcconfig.monitor.topicoffset.mapper.DataSourceConfigMapper;
import com.bsoft.cdcconfig.monitor.topicoffset.mapper.TopicOffsetMapper;
import org.apache.ibatis.annotations.Select;
import org.junit.jupiter.api.Test;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;

import java.lang.reflect.Method;
import java.util.Arrays;
import java.util.List;
import java.util.regex.Pattern;

import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertTrue;

/**
 * 静态只读契约校验（DESIGN §5.2/§9）：Mapper 不继承 BaseMapper、SQL 仅 SELECT、
 * 不读取密码列、不使用 SELECT *、不写备份表；Controller 仅 GET。
 */
class TopicOffsetReadOnlyContractTest {

    private static final Pattern FORBIDDEN_STATEMENT = Pattern.compile(
            "(?i)\\b(insert|update|delete|merge|create|alter|drop|truncate)\\b");

    private static final List<Class<?>> MAPPER_CLASSES = Arrays.asList(
            TopicOffsetMapper.class, ClientConfigMapper.class, DataSourceConfigMapper.class);

    @Test
    void mappersShouldNotExtendBaseMapper() {
        for (Class<?> clazz : MAPPER_CLASSES) {
            assertFalse(BaseMapper.class.isAssignableFrom(clazz),
                    clazz.getSimpleName() + " must not extend BaseMapper");
        }
    }

    @Test
    void mapperSqlShouldOnlyContainSelectStatements() throws Exception {
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
                assertFalse(sql.contains("CDC_TOPIC_OFFSET_2026_09_02"),
                        clazz.getSimpleName() + "." + method.getName() + " must not touch the backup table");
            }
        }
    }

    @Test
    void dataSourceMapperShouldProjectOnlySafeColumns() throws Exception {
        String sql = String.join(" ", DataSourceConfigMapper.class.getDeclaredMethod("selectAll")
                .getAnnotation(Select.class).value()).toUpperCase();
        assertTrue(sql.contains("DATA_SOURCE_ID"));
        assertTrue(sql.contains("DATA_SOURCE_ORG"));
        assertTrue(sql.contains("DATA_SOURCE_CATEGORY"));
        assertTrue(sql.contains("FG_ACTIVE"));
    }

    @Test
    void topicOffsetMapperSqlShouldPreserveDesignFormatContract() throws Exception {
        String sql = String.join(" ", TopicOffsetMapper.class.getDeclaredMethod("selectAll")
                .getAnnotation(Select.class).value());
        String upper = sql.toUpperCase();
        assertTrue(upper.contains("TO_CHAR(NEXT_OFFSET"));
        assertTrue(upper.contains("FM99999999999999999990"));
        assertTrue(upper.contains("NLS_NUMERIC_CHARACTERS=''.,''"));
        assertTrue(upper.contains("TO_CHAR(UPDATED_AT"));
        assertTrue(upper.contains("ORDER BY KAFKA_TOPIC ASC, SERVER_ID ASC"));
    }

    @Test
    void controllerShouldExposeOnlyReadOnlyGetEndpoints() {
        Class<?> clazz = TopicOffsetController.class;
        Method[] methods = clazz.getDeclaredMethods();
        assertTrue(methods.length == 2, "controller should expose exactly two endpoints");
        for (Method method : methods) {
            assertTrue(method.getAnnotation(GetMapping.class) != null,
                    method.getName() + " must be annotated with @GetMapping");
            assertFalse(method.isAnnotationPresent(PostMapping.class), method.getName() + " must not be POST");
            assertFalse(method.isAnnotationPresent(PutMapping.class), method.getName() + " must not be PUT");
            assertFalse(method.isAnnotationPresent(DeleteMapping.class), method.getName() + " must not be DELETE");
            assertFalse(method.isAnnotationPresent(PatchMapping.class), method.getName() + " must not be PATCH");
        }
    }
}
