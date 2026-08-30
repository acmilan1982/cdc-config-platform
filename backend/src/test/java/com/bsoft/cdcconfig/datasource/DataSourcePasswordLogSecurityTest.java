package com.bsoft.cdcconfig.datasource;

import ch.qos.logback.classic.Level;
import ch.qos.logback.classic.Logger;
import ch.qos.logback.classic.LoggerContext;
import ch.qos.logback.classic.spi.ILoggingEvent;
import ch.qos.logback.core.read.ListAppender;
import com.baomidou.mybatisplus.core.MybatisConfiguration;
import com.baomidou.mybatisplus.core.metadata.TableInfoHelper;
import com.bsoft.cdcconfig.common.api.ApiResponse;
import com.bsoft.cdcconfig.common.exception.BusinessException;
import com.bsoft.cdcconfig.common.exception.GlobalExceptionHandler;
import com.bsoft.cdcconfig.datasource.dto.DataSourceCreateDTO;
import com.bsoft.cdcconfig.datasource.dto.DataSourceUpdateDTO;
import com.bsoft.cdcconfig.datasource.entity.DataSource;
import com.bsoft.cdcconfig.datasource.mapper.DataSourceMapper;
import com.bsoft.cdcconfig.datasource.service.impl.DataSourceServiceImpl;
import org.apache.ibatis.builder.MapperBuilderAssistant;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.BeforeAll;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.mockito.Mockito;
import org.slf4j.LoggerFactory;
import org.springframework.boot.env.YamlPropertySourceLoader;
import org.springframework.core.env.PropertySource;
import org.springframework.core.io.ClassPathResource;

import java.util.List;
import java.util.UUID;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertNotNull;
import static org.junit.jupiter.api.Assertions.assertTrue;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.when;

/**
 * DS-AC-052：数据源新增/编辑/查询/删除/连接测试的任何应用日志不得输出真实密码；
 * 数据源 Mapper 的 SQL 绑定参数日志在 dev 配置下不得泄露密码。
 *
 * <p>证据边界：单元测试用 mock 的 DataSourceMapper，无法真实触发 MyBatis 绑定参数日志；
 * 因此本测试同时提供 (1) 配置级验证——dev 配置把数据源 Mapper 精确覆盖为 INFO，
 * (2) 最接近真实路径的日志捕获——按 dev 配置级别把 DEBUG 绑定日志模拟为被抑制，并
 * 以随机哨兵密码跑真实新增/编辑服务路径捕获日志断言不泄露。正式复验仍会用真实保存检查运行日志。</p>
 */
class DataSourcePasswordLogSecurityTest {

    private static final String MAPPER_PACKAGE = "com.bsoft.cdcconfig.datasource.mapper";
    private static final String MAPPER_LOGGER = MAPPER_PACKAGE + ".DataSourceMapper";

    private DataSourceMapper dataSourceMapper;
    private DataSourceServiceImpl service;
    private GlobalExceptionHandler exceptionHandler;

    private LoggerContext loggerContext;
    private Logger mapperLogger;
    private Logger serviceLogger;
    private ListAppender<ILoggingEvent> appender;
    private Level originalMapperLevel;
    private Level originalServiceLevel;

    @BeforeAll
    static void initTableInfo() {
        MapperBuilderAssistant assistant = new MapperBuilderAssistant(new MybatisConfiguration(), "");
        TableInfoHelper.initTableInfo(assistant, DataSource.class);
    }

    @BeforeEach
    void setUp() {
        dataSourceMapper = Mockito.mock(DataSourceMapper.class);
        service = new DataSourceServiceImpl(dataSourceMapper, null);
        exceptionHandler = new GlobalExceptionHandler();

        loggerContext = (LoggerContext) LoggerFactory.getILoggerFactory();
        mapperLogger = loggerContext.getLogger(MAPPER_LOGGER);
        serviceLogger = loggerContext.getLogger(DataSourceServiceImpl.class);
        originalMapperLevel = mapperLogger.getLevel();
        originalServiceLevel = serviceLogger.getLevel();

        appender = new ListAppender<>();
        appender.setContext(loggerContext);
        appender.start();
        mapperLogger.addAppender(appender);
        serviceLogger.addAppender(appender);

        // 按 dev 目标配置设置数据源 Mapper 与数据源 Service 日志级别
        mapperLogger.setLevel(Level.INFO);
        serviceLogger.setLevel(Level.INFO);
    }

    @AfterEach
    void tearDown() {
        mapperLogger.detachAppender(appender);
        serviceLogger.detachAppender(appender);
        appender.stop();
        mapperLogger.setLevel(originalMapperLevel);
        serviceLogger.setLevel(originalServiceLevel);
    }

    @Test
    void devConfig_declaresDatasourceMapperLevelInfo() throws Exception {
        YamlPropertySourceLoader loader = new YamlPropertySourceLoader();
        List<PropertySource<?>> sources = loader.load(
                "application-dev", new ClassPathResource("application-dev.yml"));
        assertFalse(sources.isEmpty());

        PropertySource<?> ps = sources.get(0);
        Object level = ps.getProperty("logging.level." + MAPPER_PACKAGE);
        assertNotNull(level, "dev 配置必须为数据源 Mapper 精确声明日志级别");
        assertEquals("INFO", level);
    }

    @Test
    void devConfig_effectiveLevel_suppressesDebugBindingLogs() {
        // MyBatis Slf4jImpl 只在 isDebugEnabled() 时输出“==> Parameters”绑定参数日志；
        // dev 目标配置下数据源 Mapper 为 INFO，DEBUG 级绑定日志根本不会被输出。
        assertFalse(mapperLogger.isDebugEnabled(),
                "dev 配置下数据源 Mapper 不得启用 DEBUG（避免绑定参数日志泄露密码）");

        String sentinel = "pwd-" + UUID.randomUUID();
        mapperLogger.debug("==> Parameters: {} (String)", sentinel);
        assertTrue(appender.list.stream()
                        .noneMatch(e -> e.getFormattedMessage().contains(sentinel)),
                "DEBUG 级绑定参数日志在 INFO 级别下不得被输出");
    }

    @Test
    void createAndUpdatePaths_doNotLeakRandomSentinelPassword() {
        String sentinel = "pwd-" + UUID.randomUUID();

        // 新增路径
        DataSourceCreateDTO create = new DataSourceCreateDTO();
        create.setDataSourceId("DS001");
        create.setDataSourceName("测试数据源");
        create.setDataSourceCategory("SOURCE");
        create.setDataSourceType("ORACLE");
        create.setHost("192.168.1.1");
        create.setPort(1521);
        create.setUserName("testuser");
        create.setPassword(sentinel);
        create.setServiceName("testdb");
        when(dataSourceMapper.selectCount(any())).thenReturn(0L);
        when(dataSourceMapper.insert(any(DataSource.class))).thenReturn(1);
        service.create(create);

        // 编辑路径（携带新密码）
        DataSourceUpdateDTO update = new DataSourceUpdateDTO();
        update.setDataSourceId("DS001");
        update.setDataSourceName("测试数据源");
        update.setDataSourceCategory("SOURCE");
        update.setDataSourceType("ORACLE");
        update.setHost("192.168.1.1");
        update.setPort(1521);
        update.setUserName("testuser");
        update.setPassword(sentinel);
        update.setServiceName("testdb");
        when(dataSourceMapper.selectOne(any())).thenReturn(existingRecord());
        when(dataSourceMapper.selectCount(any())).thenReturn(0L);
        when(dataSourceMapper.update(Mockito.isNull(), any())).thenReturn(1);
        service.update("DS001", update);

        for (ILoggingEvent event : appender.list) {
            assertFalse(event.getFormattedMessage().contains(sentinel),
                    "日志不得包含哨兵密码");
            assertFalse(event.getFormattedMessage().contains("Parameters"),
                    "数据源 Mapper 绑定参数日志不得出现在捕获日志中");
        }
    }

    @Test
    void unknownExceptionResponse_doesNotLeakSentinel() {
        String sentinel = "pwd-" + UUID.randomUUID();
        RuntimeException leaky = new RuntimeException("connection failed with password=" + sentinel);

        ApiResponse<Void> resp = exceptionHandler.handleUnknownException(leaky);

        assertEquals(500, resp.getCode());
        assertEquals("服务器内部错误", resp.getMessage());
        assertFalse(resp.getMessage().contains(sentinel));
    }

    @Test
    void serviceBusinessAndUnknownErrors_doNotLeakSentinelIntoResponse() {
        String sentinel = "pwd-" + UUID.randomUUID();

        // 业务异常路径：新增遇到 ID 重复，响应消息不得含哨兵密码
        DataSourceCreateDTO create = new DataSourceCreateDTO();
        create.setDataSourceId("DS001");
        create.setDataSourceName("测试数据源");
        create.setDataSourceCategory("SOURCE");
        create.setDataSourceType("ORACLE");
        create.setHost("192.168.1.1");
        create.setPort(1521);
        create.setUserName("testuser");
        create.setPassword(sentinel);
        create.setServiceName("testdb");
        when(dataSourceMapper.selectCount(any())).thenReturn(1L);

        BusinessException biz = org.junit.jupiter.api.Assertions.assertThrows(
                BusinessException.class, () -> service.create(create));
        ApiResponse<Void> bizResp = exceptionHandler.handleBusinessException(biz);
        assertFalse(bizResp.getMessage().contains(sentinel));

        // 未知异常路径：底层异常文本含哨兵，服务层上抛后按契约返回脱敏消息
        when(dataSourceMapper.selectCount(any())).thenReturn(0L);
        when(dataSourceMapper.insert(any(DataSource.class)))
                .thenThrow(new RuntimeException("driver error with password=" + sentinel));
        RuntimeException leaky = org.junit.jupiter.api.Assertions.assertThrows(
                RuntimeException.class, () -> service.create(create));
        ApiResponse<Void> unknownResp = exceptionHandler.handleUnknownException(leaky);
        assertEquals("服务器内部错误", unknownResp.getMessage());
        assertFalse(unknownResp.getMessage().contains(sentinel));
    }

    private DataSource existingRecord() {
        DataSource ds = new DataSource();
        ds.setDataSourceId("DS001");
        ds.setDataSourceName("测试数据源");
        ds.setDataSourceCategory("SOURCE");
        ds.setDataSourceType("ORACLE");
        ds.setDataSourceHost("192.168.1.1");
        ds.setDataSourcePort("1521");
        ds.setDataSourceUserName("testuser");
        ds.setDataSourcePassword("persisted_pass");
        ds.setDataSourceServiceName("testdb");
        ds.setFgActive("1");
        return ds;
    }
}
