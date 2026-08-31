package com.bsoft.cdcconfig.subscription.service;

import com.baomidou.mybatisplus.core.MybatisConfiguration;
import com.baomidou.mybatisplus.core.metadata.TableInfoHelper;
import com.bsoft.cdcconfig.common.exception.BusinessException;
import com.bsoft.cdcconfig.datasource.connection.ConnectionFactory;
import com.bsoft.cdcconfig.datasource.entity.DataSource;
import com.bsoft.cdcconfig.datasource.mapper.DataSourceMapper;
import com.bsoft.cdcconfig.subscription.dto.SourceTableInput;
import com.bsoft.cdcconfig.subscription.service.impl.SourceMetadataServiceImpl;
import com.bsoft.cdcconfig.subscription.vo.SchemaVO;
import com.bsoft.cdcconfig.subscription.vo.TableVO;
import com.bsoft.cdcconfig.subscription.vo.ValidationErrorVO;
import org.apache.ibatis.builder.MapperBuilderAssistant;
import org.junit.jupiter.api.BeforeAll;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.lang.reflect.Field;
import java.sql.Connection;
import java.sql.PreparedStatement;
import java.sql.ResultSet;
import java.sql.SQLException;
import java.sql.Statement;
import java.util.ArrayList;
import java.util.Arrays;
import java.util.Collections;
import java.util.List;
import java.util.Properties;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.junit.jupiter.api.Assertions.assertTrue;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyInt;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.ArgumentMatchers.contains;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.times;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

/**
 * 源库 Oracle 元数据只读访问（DESIGN §6）：能力分层/回退、物化视图三处排除、
 * 批量复核 40330/40331 分类、错误脱敏、best-effort 可达性探测。
 */
@ExtendWith(MockitoExtension.class)
class SourceMetadataServiceImplTest {

    @Mock
    private DataSourceMapper dataSourceMapper;

    @Mock
    private ConnectionFactory connectionFactory;

    @InjectMocks
    private SourceMetadataServiceImpl service;

    @BeforeAll
    static void initTableInfo() {
        MapperBuilderAssistant assistant = new MapperBuilderAssistant(new MybatisConfiguration(), "");
        TableInfoHelper.initTableInfo(assistant, DataSource.class);
    }

    private DataSource activeSource() {
        DataSource ds = new DataSource();
        ds.setDataSourceId("S01");
        ds.setDataSourceCategory("SOURCE");
        ds.setFgActive("1");
        ds.setDataSourceHost("10.1.1.1");
        ds.setDataSourcePort("1521");
        ds.setDataSourceServiceName("prod");
        ds.setDataSourceUserName("user");
        ds.setDataSourcePassword("secret");
        return ds;
    }

    // ---- Schema 列表：能力分层 ---- //

    @Test
    void listSchemas_capabilityMode_returnsSchemasAndFilterMode() throws Exception {
        when(dataSourceMapper.selectOne(any())).thenReturn(activeSource());
        Connection conn = mock(Connection.class);
        PreparedStatement ps = mock(PreparedStatement.class);
        ResultSet rs = mock(ResultSet.class);
        when(connectionFactory.open(anyString(), anyString(), any(Properties.class), anyString(), anyString()))
                .thenReturn(conn);
        when(conn.prepareStatement(contains("ORACLE_MAINTAINED"))).thenReturn(ps);
        when(ps.executeQuery()).thenReturn(rs);
        when(rs.next()).thenReturn(true, true, false);
        when(rs.getString(1)).thenReturn("SCHEMA_A", "SCHEMA_B");

        SchemaVO vo = service.listSchemas("S01");

        assertEquals("ORACLE_MAINTAINED", vo.getFilterMode());
        assertEquals(Arrays.asList("SCHEMA_A", "SCHEMA_B"), vo.getSchemas());
        assertEquals("S01", vo.getDataSourceId());
        verify(conn, never()).prepareStatement(contains("NOT IN ("));
    }

    @Test
    void listSchemas_fallbackMode_whenCapabilityUnsupported() throws Exception {
        when(dataSourceMapper.selectOne(any())).thenReturn(activeSource());
        Connection conn = mock(Connection.class);
        PreparedStatement capabilityPs = mock(PreparedStatement.class);
        PreparedStatement fallbackPs = mock(PreparedStatement.class);
        ResultSet rs = mock(ResultSet.class);
        when(connectionFactory.open(anyString(), anyString(), any(Properties.class), anyString(), anyString()))
                .thenReturn(conn);
        when(conn.prepareStatement(contains("ORACLE_MAINTAINED"))).thenReturn(capabilityPs);
        when(capabilityPs.executeQuery())
                .thenThrow(new SQLException("ORA-00904 invalid identifier", "42000", 904));
        when(conn.prepareStatement(contains("NOT IN ("))).thenReturn(fallbackPs);
        when(fallbackPs.executeQuery()).thenReturn(rs);
        when(rs.next()).thenReturn(true, false);
        when(rs.getString(1)).thenReturn("SCHEMA_F");

        SchemaVO vo = service.listSchemas("S01");

        assertEquals("FALLBACK_EXCLUSION_LIST", vo.getFilterMode());
        assertEquals(Collections.singletonList("SCHEMA_F"), vo.getSchemas());
    }

    @Test
    void listSchemas_sourceNotFound_throws40320() {
        when(dataSourceMapper.selectOne(any())).thenReturn(null);

        BusinessException e = assertThrows(BusinessException.class, () -> service.listSchemas("NOPE"));
        assertEquals(40320, e.getCode());
    }

    @Test
    void listSchemas_sourceInactive_throws40320() {
        DataSource ds = activeSource();
        ds.setFgActive("0");
        when(dataSourceMapper.selectOne(any())).thenReturn(ds);

        BusinessException e = assertThrows(BusinessException.class, () -> service.listSchemas("S01"));
        assertEquals(40320, e.getCode());
    }

    @Test
    void listSchemas_sourceCategoryMismatch_throws40322() {
        DataSource ds = activeSource();
        ds.setDataSourceCategory("TARGET");
        when(dataSourceMapper.selectOne(any())).thenReturn(ds);

        BusinessException e = assertThrows(BusinessException.class, () -> service.listSchemas("S01"));
        assertEquals(40322, e.getCode());
    }

    // ---- 错误脱敏 ---- //

    @Test
    void listSchemas_connectionFailed_returns40340Desensitized() throws Exception {
        when(dataSourceMapper.selectOne(any())).thenReturn(activeSource());
        when(connectionFactory.open(anyString(), anyString(), any(Properties.class), anyString(), anyString()))
                .thenThrow(new SQLException("ORA-01017 invalid username/password; secret=hunter2"));

        BusinessException e = assertThrows(BusinessException.class, () -> service.listSchemas("S01"));
        assertEquals(40340, e.getCode());
        assertEquals("源库连接失败：认证失败", e.getMessage());
        assertFalse(e.getMessage().contains("hunter2"));
    }

    @Test
    void listSchemas_genericSchemaLoadFailure_returns40341Desensitized() throws Exception {
        when(dataSourceMapper.selectOne(any())).thenReturn(activeSource());
        Connection conn = mock(Connection.class);
        when(connectionFactory.open(anyString(), anyString(), any(Properties.class), anyString(), anyString()))
                .thenReturn(conn);
        when(conn.prepareStatement(contains("ORACLE_MAINTAINED")))
                .thenThrow(new SQLException("ORA-00001 unique constraint violated; secret=hunter2"));

        BusinessException e = assertThrows(BusinessException.class, () -> service.listSchemas("S01"));
        assertEquals(40341, e.getCode());
        assertEquals("Schema/表加载失败：数据库连接失败", e.getMessage());
        assertFalse(e.getMessage().contains("hunter2"));
    }

    // ---- 表清单 ---- //

    @Test
    void listTables_returnsTablesWithExactSchema() throws Exception {
        when(dataSourceMapper.selectOne(any())).thenReturn(activeSource());
        Connection conn = mock(Connection.class);
        PreparedStatement ps = mock(PreparedStatement.class);
        ResultSet rs = mock(ResultSet.class);
        when(connectionFactory.open(anyString(), anyString(), any(Properties.class), anyString(), anyString()))
                .thenReturn(conn);
        when(conn.prepareStatement(contains("FROM ALL_TABLES"))).thenReturn(ps);
        when(ps.executeQuery()).thenReturn(rs);
        when(rs.next()).thenReturn(true, false);
        when(rs.getString(1)).thenReturn("TBL_A");

        TableVO vo = service.listTables("S01", "SCHEMA_A");

        assertEquals("SCHEMA_A", vo.getSchema());
        assertEquals(Collections.singletonList("TBL_A"), vo.getTables());
        verify(ps).setString(1, "SCHEMA_A");
    }

    // ---- 保存前批量复核 ---- //

    @Test
    void validateTables_classifies40331MviewAnd40330Missing() throws Exception {
        when(dataSourceMapper.selectOne(any())).thenReturn(activeSource());
        Connection conn = mock(Connection.class);
        PreparedStatement normalPs = mock(PreparedStatement.class);
        PreparedStatement mviewPs = mock(PreparedStatement.class);
        ResultSet normalRs = mock(ResultSet.class);
        ResultSet mviewRs = mock(ResultSet.class);
        when(connectionFactory.open(anyString(), anyString(), any(Properties.class), anyString(), anyString()))
                .thenReturn(conn);
        // 注意：批量普通表 SQL 的 NOT EXISTS 子句也含 "FROM ALL_MVIEWS"，必须用唯一前缀区分两个 matcher
        when(conn.prepareStatement(contains("SELECT t.OWNER, t.TABLE_NAME FROM ALL_TABLES"))).thenReturn(normalPs);
        when(normalPs.executeQuery()).thenReturn(normalRs);
        when(normalRs.next()).thenReturn(true, false);
        when(normalRs.getString(1)).thenReturn("S1");
        when(normalRs.getString(2)).thenReturn("T1");
        when(conn.prepareStatement(contains("SELECT OWNER, MVIEW_NAME, CONTAINER_NAME FROM ALL_MVIEWS")))
                .thenReturn(mviewPs);
        when(mviewPs.executeQuery()).thenReturn(mviewRs);
        when(mviewRs.next()).thenReturn(true, true, false);
        when(mviewRs.getString(1)).thenReturn("S1", "S1");
        when(mviewRs.getString(2)).thenReturn("MV1", null);
        when(mviewRs.getString(3)).thenReturn(null, "CT1");

        List<ValidationErrorVO> errors = service.validateTables("S01", Arrays.asList(
                new SourceTableInput("S1", "T1"),
                new SourceTableInput("S1", "MV1"),
                new SourceTableInput("S1", "CT1"),
                new SourceTableInput("S1", "GONE")));

        assertEquals(3, errors.size());
        assertTrue(hasError(errors, "40331", "S1.MV1"));
        assertTrue(hasError(errors, "40331", "S1.CT1"));
        assertTrue(hasError(errors, "40330", "S1.GONE"));
        verify(conn).prepareStatement(contains("SELECT t.OWNER, t.TABLE_NAME FROM ALL_TABLES"));
        verify(conn).prepareStatement(contains("SELECT OWNER, MVIEW_NAME, CONTAINER_NAME FROM ALL_MVIEWS"));
    }

    @Test
    void validateTables_emptyInputs_returnsEmpty() throws Exception {
        when(dataSourceMapper.selectOne(any())).thenReturn(activeSource());

        assertEquals(Collections.emptyList(), service.validateTables("S01", Collections.emptyList()));
        verify(connectionFactory, never()).open(anyString(), anyString(), any(Properties.class),
                anyString(), anyString());
    }

    @Test
    void validateTables_dedupsSchemasAndBindsOnceInFirstOccurrenceOrder() throws Exception {
        when(dataSourceMapper.selectOne(any())).thenReturn(activeSource());
        Connection conn = mock(Connection.class);
        PreparedStatement normalPs = mock(PreparedStatement.class);
        PreparedStatement mviewPs = mock(PreparedStatement.class);
        ResultSet normalRs = mock(ResultSet.class);
        ResultSet mviewRs = mock(ResultSet.class);
        when(connectionFactory.open(anyString(), anyString(), any(Properties.class), anyString(), anyString()))
                .thenReturn(conn);
        when(conn.prepareStatement(anyString())).thenReturn(normalPs, mviewPs);
        when(normalPs.executeQuery()).thenReturn(normalRs);
        when(mviewPs.executeQuery()).thenReturn(mviewRs);
        when(normalRs.next()).thenReturn(false);
        when(mviewRs.next()).thenReturn(false);

        service.validateTables("S01", Arrays.asList(
                new SourceTableInput("SCHEMA_B", "T1"),
                new SourceTableInput("SCHEMA_A", "T2"),
                new SourceTableInput("SCHEMA_B", "T3"),
                new SourceTableInput("SCHEMA_C", "T4"),
                new SourceTableInput("SCHEMA_A", "T5")));

        ArgumentCaptor<String> sqlCaptor = ArgumentCaptor.forClass(String.class);
        verify(conn, times(2)).prepareStatement(sqlCaptor.capture());
        assertEquals(3, countQuestionMarks(sqlCaptor.getAllValues().get(0)), "普通表批量 SQL 占位符=唯一 Schema 数");
        assertEquals(3, countQuestionMarks(sqlCaptor.getAllValues().get(1)), "物化视图批量 SQL 占位符=唯一 Schema 数");

        ArgumentCaptor<Integer> normalIdx = ArgumentCaptor.forClass(Integer.class);
        ArgumentCaptor<String> normalVal = ArgumentCaptor.forClass(String.class);
        verify(normalPs, times(3)).setString(normalIdx.capture(), normalVal.capture());
        assertEquals(Arrays.asList(1, 2, 3), normalIdx.getAllValues());
        assertEquals(Arrays.asList("SCHEMA_B", "SCHEMA_A", "SCHEMA_C"), normalVal.getAllValues(),
                "普通表绑定按首次出现顺序，每 Schema 一次");

        ArgumentCaptor<Integer> mviewIdx = ArgumentCaptor.forClass(Integer.class);
        ArgumentCaptor<String> mviewVal = ArgumentCaptor.forClass(String.class);
        verify(mviewPs, times(3)).setString(mviewIdx.capture(), mviewVal.capture());
        assertEquals(Arrays.asList(1, 2, 3), mviewIdx.getAllValues());
        assertEquals(Arrays.asList("SCHEMA_B", "SCHEMA_A", "SCHEMA_C"), mviewVal.getAllValues(),
                "物化视图绑定按首次出现顺序，每 Schema 一次");
    }

    @Test
    void validateTables_oneSchemaManyTables_generatesSingleSchemaPlaceholder() throws Exception {
        when(dataSourceMapper.selectOne(any())).thenReturn(activeSource());
        Connection conn = mock(Connection.class);
        PreparedStatement normalPs = mock(PreparedStatement.class);
        PreparedStatement mviewPs = mock(PreparedStatement.class);
        ResultSet normalRs = mock(ResultSet.class);
        ResultSet mviewRs = mock(ResultSet.class);
        when(connectionFactory.open(anyString(), anyString(), any(Properties.class), anyString(), anyString()))
                .thenReturn(conn);
        when(conn.prepareStatement(anyString())).thenReturn(normalPs, mviewPs);
        when(normalPs.executeQuery()).thenReturn(normalRs);
        when(mviewPs.executeQuery()).thenReturn(mviewRs);
        when(normalRs.next()).thenReturn(false);
        when(mviewRs.next()).thenReturn(false);

        List<SourceTableInput> inputs = new ArrayList<>(120);
        for (int i = 0; i < 120; i++) {
            inputs.add(new SourceTableInput("SCHEMA_A", "T" + i));
        }
        service.validateTables("S01", inputs);

        ArgumentCaptor<String> sqlCaptor = ArgumentCaptor.forClass(String.class);
        verify(conn, times(2)).prepareStatement(sqlCaptor.capture());
        assertEquals(1, countQuestionMarks(sqlCaptor.getAllValues().get(0)),
                "同一 Schema 120 张表不得生成 120 个重复 Schema 参数");
        assertEquals(1, countQuestionMarks(sqlCaptor.getAllValues().get(1)));

        verify(normalPs, times(1)).setString(anyInt(), anyString());
        verify(mviewPs, times(1)).setString(anyInt(), anyString());
        verify(normalPs).setString(1, "SCHEMA_A");
        verify(mviewPs).setString(1, "SCHEMA_A");
    }

    // ---- best-effort 可达性探测 ---- //

    @Test
    void probeReachable_activeSource_returnsTrue() throws Exception {
        when(dataSourceMapper.selectOne(any())).thenReturn(activeSource());
        Connection conn = mock(Connection.class);
        Statement st = mock(Statement.class);
        ResultSet rs = mock(ResultSet.class);
        when(connectionFactory.open(anyString(), anyString(), any(Properties.class), anyString(), anyString()))
                .thenReturn(conn);
        when(conn.createStatement()).thenReturn(st);
        when(st.executeQuery(anyString())).thenReturn(rs);
        when(rs.next()).thenReturn(true);

        assertTrue(service.probeReachable("S01"));

        ArgumentCaptor<String> urlCaptor = ArgumentCaptor.forClass(String.class);
        ArgumentCaptor<String> driverCaptor = ArgumentCaptor.forClass(String.class);
        verify(connectionFactory).open(urlCaptor.capture(), driverCaptor.capture(),
                any(Properties.class), anyString(), anyString());
        assertEquals("jdbc:oracle:thin:@//10.1.1.1:1521/prod", urlCaptor.getValue());
        assertEquals("oracle.jdbc.OracleDriver", driverCaptor.getValue());
        verify(st).executeQuery("SELECT 1 FROM DUAL");
    }

    @Test
    void probeReachable_queryEmpty_returnsFalse() throws Exception {
        when(dataSourceMapper.selectOne(any())).thenReturn(activeSource());
        Connection conn = mock(Connection.class);
        Statement st = mock(Statement.class);
        ResultSet rs = mock(ResultSet.class);
        when(connectionFactory.open(anyString(), anyString(), any(Properties.class), anyString(), anyString()))
                .thenReturn(conn);
        when(conn.createStatement()).thenReturn(st);
        when(st.executeQuery(anyString())).thenReturn(rs);
        when(rs.next()).thenReturn(false);

        assertFalse(service.probeReachable("S01"));
    }

    @Test
    void probeReachable_connectionFailure_returnsFalseWithoutThrowing() throws Exception {
        when(dataSourceMapper.selectOne(any())).thenReturn(activeSource());
        when(connectionFactory.open(anyString(), anyString(), any(Properties.class), anyString(), anyString()))
                .thenThrow(new SQLException("ORA-12541 TNS:no listener"));

        assertFalse(service.probeReachable("S01"));
    }

    @Test
    void probeReachable_inactiveOrNonSource_returnsFalseWithoutOpening() throws Exception {
        DataSource inactive = activeSource();
        inactive.setFgActive("0");
        when(dataSourceMapper.selectOne(any())).thenReturn(inactive);

        assertFalse(service.probeReachable("S01"));
        verify(connectionFactory, never()).open(anyString(), anyString(), any(Properties.class),
                anyString(), anyString());
    }

    // ---- 物化视图三处 SQL 谓词 ---- //

    @Test
    void mviewExclusion_presentInAllThreeSqlConstants() throws Exception {
        String cap = sqlConstant("CAPABILITY_SCHEMA_SQL");
        String fallback = sqlConstant("FALLBACK_SCHEMA_SQL");
        String table = sqlConstant("TABLE_SQL");

        for (String sql : Arrays.asList(cap, fallback, table)) {
            assertTrue(sql.contains("ALL_MVIEWS"), "missing ALL_MVIEWS: " + sql);
            assertTrue(sql.contains("MVIEW_NAME"), "missing MVIEW_NAME: " + sql);
            assertTrue(sql.contains("CONTAINER_NAME"), "missing CONTAINER_NAME: " + sql);
        }
    }

    private static String sqlConstant(String name) throws Exception {
        Field field = SourceMetadataServiceImpl.class.getDeclaredField(name);
        field.setAccessible(true);
        return (String) field.get(null);
    }

    private static int countQuestionMarks(String sql) {
        int count = 0;
        for (int i = 0; i < sql.length(); i++) {
            if (sql.charAt(i) == '?') {
                count++;
            }
        }
        return count;
    }

    private static boolean hasError(List<ValidationErrorVO> errors, String code, String name) {
        for (ValidationErrorVO error : errors) {
            if (code.equals(error.getErrorCode()) && name.equals(error.getName())) {
                return true;
            }
        }
        return false;
    }
}
