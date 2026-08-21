package com.bsoft.cdcconfig.logquery;

import org.junit.jupiter.api.Test;

import java.io.IOException;
import java.nio.charset.StandardCharsets;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.util.List;
import java.util.regex.Pattern;
import java.util.stream.Collectors;
import java.util.stream.Stream;

import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertTrue;

/**
 * 源码静态边界（LQ-DESIGN / LQ-API）：
 * 物理设计解耦（无 PARTITION/SUBPARTITION/TABLESPACE/CREATE INDEX）、
 * DTO/VO 不含页容量输入、列表响应不含 total/页码、无直接 JDBC、CDC_LOG_ID 数值绑定。
 */
class LogQueryStaticCheckTest {

    private static final Path SRC = Paths.get(System.getProperty("user.dir"),
            "src/main/java/com/bsoft/cdcconfig/logquery");

    // ============ 物理设计解耦 ============

    @Test
    void noPhysicalDesignDdlInAnySource() throws IOException {
        for (String content : readAllSources()) {
            assertFalse(Pattern.compile("\\bPARTITION\\b").matcher(content).find(),
                    "source must not mention PARTITION");
            assertFalse(Pattern.compile("\\bSUBPARTITION\\b").matcher(content).find(),
                    "source must not mention SUBPARTITION");
            assertFalse(Pattern.compile("\\bTABLESPACE\\b").matcher(content).find(),
                    "source must not mention TABLESPACE");
            assertFalse(Pattern.compile("\\bCREATE\\s+INDEX\\b").matcher(content).find(),
                    "source must not contain CREATE INDEX");
        }
    }

    // ============ 无页容量输入 / 无 total 页码 ============

    @Test
    void listQueryDto_hasNoPaginationFields() throws IOException {
        String dto = readFile(SRC.resolve("dto/LogListQuery.java"));
        assertFalse(declaresField(dto, "pageSize"));
        assertFalse(declaresField(dto, "pageNo"));
        assertFalse(declaresField(dto, "total"));
        assertFalse(declaresField(dto, "page"));
        assertTrue(declaresField(dto, "logType"));
        assertTrue(declaresField(dto, "startTime"));
        assertTrue(declaresField(dto, "endTime"));
        assertTrue(declaresField(dto, "cursor"));
    }

    @Test
    void listResponseVo_hasNoTotalOrPagingFields() throws IOException {
        String vo = readFile(SRC.resolve("vo/LogListResponse.java"));
        assertFalse(declaresField(vo, "total"));
        assertFalse(declaresField(vo, "pageSize"));
        assertFalse(declaresField(vo, "pageNo"));
        assertFalse(declaresField(vo, "page"));
        assertTrue(declaresField(vo, "items"));
        assertTrue(declaresField(vo, "hasNext"));
        assertTrue(declaresField(vo, "nextCursor"));
    }

    // ============ 无直接 JDBC / SQL 拼装位置 ============

    @Test
    void controllerDoesNotUseDirectJdbc() throws IOException {
        String controller = readFile(SRC.resolve("controller/LogQueryController.java"));
        assertFalse(controller.contains("java.sql"));
        assertFalse(controller.contains("javax.sql"));
        assertFalse(controller.contains("JdbcTemplate"));
        assertFalse(controller.contains("SqlSession"));
        assertTrue(controller.contains("@RequestMapping"));
    }

    @Test
    void mapperUsesBigDecimalForCdcLogIdBinding() throws IOException {
        String mapper = readFile(SRC.resolve("mapper/LogQueryMapper.java"));
        assertTrue(mapper.contains("BigDecimal"));
        assertTrue(mapper.contains("selectLogList"));
        assertTrue(mapper.contains("selectAllDataSources"));
        assertTrue(mapper.contains("selectLogDetail"));
        assertTrue(mapper.contains("selectRawMessage"));
    }

    @Test
    void serviceUsesBoundSecretCursorCodec_notHardcodedSecret() throws IOException {
        String impl = readFile(SRC.resolve("service/impl/LogQueryServiceImpl.java"));
        assertTrue(impl.contains("cursorCodec"));
        assertFalse(impl.contains("cursor-secret"));
        assertFalse(impl.contains("SECRET"));
        String config = readFile(SRC.resolve("config/LogQueryProperties.java"));
        assertTrue(config.contains("cursorSecret"));
        assertFalse(config.contains("hardcoded"));
    }

    // ============ 功能开关调整（LQ-API-170 ~ 180） ============

    @Test
    void controller_addsStatusEndpoint_withoutEnabledGateOnAnyEndpoint() throws IOException {
        String controller = readFile(SRC.resolve("controller/LogQueryController.java"));
        // 状态接口存在且只通过 Service 读取开关
        assertTrue(controller.contains("getLogQueryStatus"));
        assertTrue(controller.contains("@GetMapping(\"/status\")"));
        // 原四接口与控制器本身均不出现 isEnabled()/enabled 门控，开关只在 Service 状态接口内生效
        assertFalse(controller.contains("isEnabled("));
        assertFalse(controller.contains("properties"));
    }

    @Test
    void statusService_doesNotAccessDatabaseOrZk() throws IOException {
        String impl = readFile(SRC.resolve("service/impl/LogQueryServiceImpl.java"));
        assertTrue(impl.contains("getLogQueryStatus"));
        // 状态方法只读配置：实现类不注入 JdbcTemplate/SqlSession/ZooKeeper
        assertFalse(impl.contains("JdbcTemplate"));
        assertFalse(impl.contains("SqlSession"));
        assertFalse(impl.contains("ZooKeeper"));
        assertFalse(impl.contains("zookeeper"));
    }

    @Test
    void errorCode_hasNo403OrFeatureClosedCode() throws IOException {
        String errorCode = readFile(SRC.resolve("exception/LogQueryErrorCode.java"));
        assertFalse(Pattern.compile("= 403\\b").matcher(errorCode).find(),
                "must not add a 403 or feature-closed error code");
        assertFalse(Pattern.compile("= 40310\\b").matcher(errorCode).find());
        assertFalse(errorCode.contains("FEATURE_CLOSED"));
        assertFalse(errorCode.contains("NOT_OPEN"));
        assertFalse(errorCode.contains("功能未开放"));
    }

    @Test
    void noToCharOrCastInAnySource() throws IOException {
        for (String content : readAllSources()) {
            assertFalse(content.contains("TO_CHAR"), "source must not use TO_CHAR");
            assertFalse(content.contains("CAST("), "source must not use CAST");
        }
    }

    // ============ helpers ============

    private static List<String> readAllSources() throws IOException {
        try (Stream<Path> walk = Files.walk(SRC)) {
            return walk.filter(p -> p.toString().endsWith(".java"))
                    .map(LogQueryStaticCheckTest::readFile)
                    .collect(Collectors.toList());
        }
    }

    private static String readFile(Path path) {
        try {
            return new String(Files.readAllBytes(path), StandardCharsets.UTF_8);
        } catch (IOException e) {
            throw new IllegalStateException("cannot read " + path, e);
        }
    }

    private static boolean declaresField(String source, String fieldName) {
        return Pattern.compile("(?m)^\\s*private\\s+[^;\\n]+\\b" + fieldName + "\\b\\s*;")
                .matcher(source).find();
    }
}
