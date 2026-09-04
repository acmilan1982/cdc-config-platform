package com.bsoft.cdcconfig.clientconfig;

import com.bsoft.cdcconfig.clientconfig.controller.ClientConfigController;
import com.bsoft.cdcconfig.clientconfig.entity.CdcClientConfig;
import com.bsoft.cdcconfig.clientconfig.entity.CdcDataSource;
import com.bsoft.cdcconfig.clientconfig.exception.ClientConfigErrorCode;
import com.bsoft.cdcconfig.clientconfig.mapper.CdcClientConfigMapper;
import com.bsoft.cdcconfig.clientconfig.mapper.CdcDataSourceMapper;
import com.bsoft.cdcconfig.clientconfig.model.vo.ClientListItemVO;
import com.bsoft.cdcconfig.clientconfig.model.vo.ClientListVO;
import com.bsoft.cdcconfig.clientconfig.model.vo.ClientConfigDataSourceOptionVO;
import com.bsoft.cdcconfig.clientconfig.model.vo.DataSourceViewItemVO;
import org.apache.ibatis.annotations.Select;
import org.junit.jupiter.api.Test;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;

import java.io.File;
import java.lang.reflect.Field;
import java.lang.reflect.Method;
import java.lang.reflect.Modifier;
import java.nio.charset.StandardCharsets;
import java.nio.file.Files;
import java.util.ArrayList;
import java.util.Arrays;
import java.util.HashSet;
import java.util.List;
import java.util.Set;
import java.util.regex.Pattern;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertNotEquals;
import static org.junit.jupiter.api.Assertions.assertNotNull;
import static org.junit.jupiter.api.Assertions.assertTrue;

/**
 * 静态代码契约校验（§8.1 第 12 项与 §11 门禁 4/6/8）：
 * Controller 恰好 E1~E7；Mapper SQL 只读安全列、无 LOCK TABLE / FOR UPDATE / ${} / 密码列；
 * 实现与错误码源文件不出现 50050 / ORA-30006 / LOCK_WAIT_TIMEOUT / LOCK TABLE；
 * 响应模型不含密码字段。全部为静态检查，不触任何外部系统。
 */
class ClientConfigStaticContractTest {

    private static final Pattern WRITE_STATEMENT = Pattern.compile(
            "(?i)\\b(insert|update|delete|merge|create|alter|drop|truncate|lock)\\b");

    private static final String MAIN_BASE =
            "src/main/java/com/bsoft/cdcconfig/clientconfig/";

    // ------------------------------------------------------- 门禁 4：恰好 E1~E7

    @Test
    void controller_shouldExposeExactlySevenEndpoints() {
        Set<String> actual = new HashSet<>();
        Class<?> clazz = ClientConfigController.class;
        for (Method m : clazz.getDeclaredMethods()) {
            String verb = null;
            String path = "";
            GetMapping get = m.getAnnotation(GetMapping.class);
            PostMapping post = m.getAnnotation(PostMapping.class);
            PutMapping put = m.getAnnotation(PutMapping.class);
            DeleteMapping del = m.getAnnotation(DeleteMapping.class);
            if (get != null) {
                verb = "GET";
                path = get.value().length == 0 ? "" : get.value()[0];
            } else if (post != null) {
                verb = "POST";
                path = post.value().length == 0 ? "" : post.value()[0];
            } else if (put != null) {
                verb = "PUT";
                path = put.value().length == 0 ? "" : put.value()[0];
            } else if (del != null) {
                verb = "DELETE";
                path = del.value().length == 0 ? "" : del.value()[0];
            }
            if (verb != null) {
                assertFalse(m.isAnnotationPresent(PatchMapping.class), "不得出现 PATCH");
                actual.add(verb + " " + path);
            }
        }

        Set<String> expected = new HashSet<>(Arrays.asList(
                "GET ",                 // E1
                "GET /data-source-options", // E2
                "POST ",                // E3
                "PUT /{originalClientId}", // E4
                "DELETE /{clientId}",   // E5
                "PUT /{clientId}/enable", // E6
                "PUT /{clientId}/disable")); // E7
        assertEquals(expected, actual, "Controller 应恰好暴露 E1~E7，无额外详情/分页/批量/连接测试接口");
    }

    // ------------------------------------------------------- Mapper SQL 契约

    @Test
    void mappers_sqlShouldBeReadOnlySafeColumns() {
        assertMapperShape(CdcClientConfigMapper.class, "selectByKeywordAndStatus", "selectFullScan");
        assertMapperShape(CdcDataSourceMapper.class, "selectSafeAll");
    }

    private static void assertMapperShape(Class<?> mapperClass, String... expectedMethods) {
        List<String> names = new ArrayList<>();
        for (Method method : mapperClass.getDeclaredMethods()) {
            names.add(method.getName());
            Select select = method.getAnnotation(Select.class);
            assertNotNull(select, mapperClass.getSimpleName() + "." + method.getName() + " 必须为 @Select");
            String joined = String.join(" ", select.value());
            String cleaned = joined.replaceAll("(?is)<script>|</script>", "").trim();
            String sql = cleaned.toUpperCase();
            assertTrue(sql.startsWith("SELECT"), mapperClass.getSimpleName() + "." + method.getName() + " SQL 必须以 SELECT 开头");
            assertFalse(WRITE_STATEMENT.matcher(sql).find(),
                    sql + " 不应包含写/锁语句");
            assertFalse(sql.contains("SELECT *"), "不应使用 SELECT *");
            assertFalse(sql.contains("FOR UPDATE"), "不得使用 SELECT ... FOR UPDATE");
            assertFalse(sql.contains("LOCK TABLE"), "不得使用 LOCK TABLE");
            assertFalse(sql.contains("${"), "不得使用 ${} 字符串插值");
            assertFalse(sql.contains("DATA_SOURCE_PASSWORD"), "不得读取密码列");
            assertFalse(sql.contains("50050"), "SQL 不得引用 50050");
        }
        assertEquals(new HashSet<>(Arrays.asList(expectedMethods)), new HashSet<>(names),
                mapperClass.getSimpleName() + " 声明的方法集合不符预期");
    }

    @Test
    void clientMapper_keywordSql_shouldEscapedLiteralAndOrderDesc() {
        Method method = methodByName(CdcClientConfigMapper.class, "selectByKeywordAndStatus");
        String sql = String.join(" ", method.getAnnotation(Select.class).value()).toUpperCase();
        assertTrue(sql.contains("LOWER(CLIENT_ID) LIKE #{PATTERN} ESCAPE '\\'"),
                "关键词需 LOWER + ESCAPE 字面量匹配");
        assertTrue(sql.contains("LOWER(CLIENT_DESC) LIKE #{PATTERN} ESCAPE '\\'"));
        assertTrue(sql.contains("ORDER BY CLIENT_ID DESC"), "默认需按 CLIENT_ID 降序");
    }

    private static Method methodByName(Class<?> clazz, String name) {
        for (Method method : clazz.getDeclaredMethods()) {
            if (method.getName().equals(name)) {
                return method;
            }
        }
        throw new IllegalStateException("找不到方法 " + clazz.getSimpleName() + "." + name);
    }

    // ------------------------------------------------------- 门禁 6：无锁等待/50050/ORA-30006 Feature 映射

    @Test
    void errorCode_shouldNotDefine50050OrLockWaitOrOra30006() throws Exception {
        for (Field field : ClientConfigErrorCode.class.getDeclaredFields()) {
            if (Modifier.isStatic(field.getModifiers()) && field.getType() == int.class) {
                int value = field.getInt(null);
                assertNotEquals(50050, value, "本 Feature 不得定义 50050 LOCK_WAIT_TIMEOUT");
            }
        }
    }

    @Test
    void featureSources_shouldNotContainLockOrForbiddenMarkers() {
        List<String> files = Arrays.asList(
                MAIN_BASE + "service/impl/ClientConfigServiceImpl.java",
                MAIN_BASE + "controller/ClientConfigController.java",
                MAIN_BASE + "exception/ClientConfigErrorCode.java",
                MAIN_BASE + "mapper/CdcClientConfigMapper.java",
                MAIN_BASE + "mapper/CdcDataSourceMapper.java");
        for (String path : files) {
            String text = readSource(path);
            String upper = text.toUpperCase();
            assertFalse(upper.contains("LOCK TABLE"), path + " 不得出现 LOCK TABLE");
            assertFalse(upper.contains("ORA-30006"), path + " 不得映射 ORA-30006");
            assertFalse(upper.contains("LOCK_WAIT_TIMEOUT"), path + " 不得出现 LOCK_WAIT_TIMEOUT");
            assertFalse(text.contains("50050"), path + " 不得出现 50050");
            assertFalse(text.contains("${"), path + " 不得使用 ${}");
            // FOR UPDATE 仅允许出现在说明性注释；出现在带引号的 SQL 字符串即视为锁用法
            for (String line : text.split("\n")) {
                if (line.contains("FOR UPDATE") && line.contains("\"")) {
                    org.junit.jupiter.api.Assertions.fail(
                            path + " 行存在 SQL 形式 FOR UPDATE 引用：" + line.trim());
                }
            }
        }
    }

    // ------------------------------------------------------- 门禁 8：无密码字段

    @Test
    void responseModels_shouldNotCarryPasswordField() {
        List<Class<?>> classes = Arrays.asList(
                ClientListVO.class, ClientListItemVO.class,
                ClientConfigDataSourceOptionVO.class, DataSourceViewItemVO.class,
                CdcClientConfig.class, CdcDataSource.class);
        for (Class<?> clazz : classes) {
            for (Field field : clazz.getDeclaredFields()) {
                assertFalse(field.getName().toLowerCase().contains("password"),
                        clazz.getSimpleName() + "." + field.getName() + " 不得携带密码字段");
            }
        }
    }

    @Test
    void dataSourceMapper_declaresOnlyReadSafeMethod() {
        Method[] methods = CdcDataSourceMapper.class.getDeclaredMethods();
        assertEquals(1, methods.length, "数据源只读 Mapper 只声明 selectSafeAll");
    }

    // ------------------------------------------------------- helpers

    private static String readSource(String relative) {
        List<String> bases = new ArrayList<>();
        bases.add(relative);
        bases.add("backend/" + relative);
        for (String candidate : bases) {
            File f = new File(candidate);
            if (f.exists() && f.isFile()) {
                try {
                    return new String(Files.readAllBytes(f.toPath()), StandardCharsets.UTF_8);
                } catch (Exception e) {
                    throw new IllegalStateException("读取失败: " + candidate, e);
                }
            }
        }
        throw new IllegalStateException("找不到源文件: " + relative + " (基于目录: "
                + new File(".").getAbsolutePath() + ")");
    }
}
