package com.bsoft.cdcconfig.datasource.service;

import com.baomidou.mybatisplus.core.MybatisConfiguration;
import com.baomidou.mybatisplus.core.conditions.query.LambdaQueryWrapper;
import com.baomidou.mybatisplus.core.conditions.update.LambdaUpdateWrapper;
import com.baomidou.mybatisplus.core.metadata.TableInfoHelper;
import com.bsoft.cdcconfig.common.exception.BusinessException;
import com.bsoft.cdcconfig.datasource.connection.ConnectionTester;
import com.bsoft.cdcconfig.datasource.dto.BizAttrSaveDTO;
import com.bsoft.cdcconfig.datasource.dto.DataSourceCreateDTO;
import com.bsoft.cdcconfig.datasource.dto.DataSourceUpdateDTO;
import com.bsoft.cdcconfig.datasource.dto.NamingStrategyDTO;
import com.bsoft.cdcconfig.datasource.dto.TestConnectionDTO;
import com.bsoft.cdcconfig.datasource.entity.DataSource;
import com.bsoft.cdcconfig.datasource.entity.DataSourceExtend;
import com.bsoft.cdcconfig.datasource.exception.DataSourceErrorCode;
import com.bsoft.cdcconfig.datasource.mapper.DataSourceExtendMapper;
import com.bsoft.cdcconfig.datasource.mapper.DataSourceMapper;
import com.bsoft.cdcconfig.datasource.query.DataSourceQuery;
import com.bsoft.cdcconfig.datasource.service.impl.DataSourceServiceImpl;
import com.bsoft.cdcconfig.datasource.vo.BizAttrVO;
import com.bsoft.cdcconfig.datasource.vo.DataSourceDetailVO;
import com.bsoft.cdcconfig.datasource.vo.DataSourceListVO;
import com.bsoft.cdcconfig.datasource.vo.NamingStrategyVO;
import com.bsoft.cdcconfig.datasource.vo.TargetOptionVO;
import com.bsoft.cdcconfig.datasource.vo.TestConnectionResultVO;
import org.apache.ibatis.builder.MapperBuilderAssistant;
import org.junit.jupiter.api.BeforeAll;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.util.Collections;
import java.util.List;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertNotNull;
import static org.junit.jupiter.api.Assertions.assertNull;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.junit.jupiter.api.Assertions.assertTrue;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class DataSourceServiceTest {

    @Mock
    private DataSourceMapper dataSourceMapper;

    @Mock
    private DataSourceExtendMapper extendMapper;

    @Mock
    private ConnectionTester connectionTester;

    @InjectMocks
    private DataSourceServiceImpl service;

    private DataSource sourceDs;
    private DataSource targetDs;
    private DataSourceCreateDTO createDTO;
    private DataSourceUpdateDTO updateDTO;
    private TestConnectionDTO testConnDTO;

    @BeforeAll
    static void initTableInfo() {
        MapperBuilderAssistant assistant = new MapperBuilderAssistant(new MybatisConfiguration(), "");
        TableInfoHelper.initTableInfo(assistant, DataSource.class);
        TableInfoHelper.initTableInfo(assistant, DataSourceExtend.class);
    }

    @BeforeEach
    void setUp() {
        sourceDs = new DataSource();
        sourceDs.setDataSourceId("SRC001");
        sourceDs.setDataSourceName("源库");
        sourceDs.setDataSourceCategory("SOURCE");
        sourceDs.setDataSourceType("ORACLE");
        sourceDs.setDataSourceHost("192.168.1.1");
        sourceDs.setDataSourcePort("1521");
        sourceDs.setDataSourceUserName("testuser");
        sourceDs.setDataSourcePassword("persisted_pass");
        sourceDs.setDataSourceServiceName("testdb");
        sourceDs.setFgActive("1");

        targetDs = new DataSource();
        targetDs.setDataSourceId("TG001");
        targetDs.setDataSourceName("目标库");
        targetDs.setDataSourceCategory("TARGET");
        targetDs.setDataSourceType("oracle");
        targetDs.setDataSourceHost("192.168.1.2");
        targetDs.setDataSourcePort("1521");
        targetDs.setDataSourceUserName("testuser");
        targetDs.setDataSourcePassword("persisted_pass");
        targetDs.setDataSourceServiceName("testdb");
        targetDs.setFgActive("1");

        createDTO = new DataSourceCreateDTO();
        createDTO.setDataSourceId("DS001");
        createDTO.setDataSourceName("测试数据源");
        createDTO.setDataSourceCategory("source");
        createDTO.setDataSourceType("oracle");
        createDTO.setHost("192.168.1.1");
        createDTO.setPort(1521);
        createDTO.setUserName("testuser");
        createDTO.setPassword("testpass");
        createDTO.setServiceName("testdb");

        updateDTO = new DataSourceUpdateDTO();
        updateDTO.setDataSourceId("DS001");
        updateDTO.setDataSourceName("测试数据源");
        updateDTO.setDataSourceCategory("SOURCE");
        updateDTO.setDataSourceType("ORACLE");
        updateDTO.setHost("192.168.1.1");
        updateDTO.setPort(1521);
        updateDTO.setUserName("testuser");
        updateDTO.setServiceName("testdb");

        testConnDTO = new TestConnectionDTO();
        testConnDTO.setDataSourceType("ORACLE");
        testConnDTO.setHost("192.168.1.1");
        testConnDTO.setPort(1521);
        testConnDTO.setUserName("testuser");
        testConnDTO.setPassword("testpass");
        testConnDTO.setServiceName("testdb");
    }

    // ---- list ----
    @Test
    void list_shouldReturnActiveRecordsWithFilters() {
        DataSourceQuery query = new DataSourceQuery();
        query.setId("DS");
        query.setName("测试");
        query.setHost("192.168");
        when(dataSourceMapper.selectList(any(LambdaQueryWrapper.class)))
                .thenReturn(Collections.singletonList(sourceDs));

        List<DataSourceListVO> vos = service.list(query);

        assertEquals(1, vos.size());
        assertEquals("SRC001", vos.get(0).getDataSourceId());

        ArgumentCaptor<LambdaQueryWrapper<DataSource>> captor = ArgumentCaptor.forClass(LambdaQueryWrapper.class);
        verify(dataSourceMapper).selectList(captor.capture());
        String sql = captor.getValue().getCustomSqlSegment();
        assertTrue(sql.contains("UPPER(DATA_SOURCE_ID) LIKE"));
        assertTrue(sql.contains("UPPER(DATA_SOURCE_NAME) LIKE"));
        assertTrue(sql.contains("UPPER(DATA_SOURCE_HOST) LIKE"));
        assertTrue(sql.contains("FG_ACTIVE"));
    }

    @Test
    void list_withoutFilters_shouldStillFilterActive() {
        when(dataSourceMapper.selectList(any(LambdaQueryWrapper.class)))
                .thenReturn(Collections.emptyList());

        service.list(new DataSourceQuery());

        ArgumentCaptor<LambdaQueryWrapper<DataSource>> captor = ArgumentCaptor.forClass(LambdaQueryWrapper.class);
        verify(dataSourceMapper).selectList(captor.capture());
        assertTrue(captor.getValue().getCustomSqlSegment().contains("FG_ACTIVE"));
    }

    // ---- getDetail ----
    @Test
    void getDetail_shouldReturnDetail() {
        when(dataSourceMapper.selectOne(any(LambdaQueryWrapper.class))).thenReturn(sourceDs);

        DataSourceDetailVO vo = service.getDetail("SRC001");

        assertNotNull(vo);
        assertEquals("SRC001", vo.getDataSourceId());
        assertEquals("SOURCE", vo.getDataSourceCategory());
        assertEquals("ORACLE", vo.getDataSourceType());
        assertEquals(Integer.valueOf(1521), vo.getPort());
    }

    @Test
    void getDetail_notFound_shouldThrow40400() {
        when(dataSourceMapper.selectOne(any(LambdaQueryWrapper.class))).thenReturn(null);

        BusinessException ex = assertThrows(BusinessException.class,
                () -> service.getDetail("NONEXIST"));
        assertEquals(DataSourceErrorCode.DATA_SOURCE_NOT_FOUND, ex.getCode());
    }

    // ---- create ----
    @Test
    void create_shouldNormalizeAndInsert() {
        when(dataSourceMapper.selectCount(any(LambdaQueryWrapper.class))).thenReturn(0L);
        when(dataSourceMapper.insert(any(DataSource.class))).thenReturn(1);

        String id = service.create(createDTO);

        assertEquals("DS001", id);
        ArgumentCaptor<DataSource> captor = ArgumentCaptor.forClass(DataSource.class);
        verify(dataSourceMapper).insert(captor.capture());
        DataSource inserted = captor.getValue();
        assertEquals("SOURCE", inserted.getDataSourceCategory());
        assertEquals("ORACLE", inserted.getDataSourceType());
        assertEquals("1521", inserted.getDataSourcePort());
        assertEquals("1", inserted.getFgActive());
    }

    @Test
    void create_targetWithMySql_shouldSucceed() {
        createDTO.setDataSourceCategory("TARGET");
        createDTO.setDataSourceType("MYSQL");
        when(dataSourceMapper.selectCount(any(LambdaQueryWrapper.class))).thenReturn(0L);
        when(dataSourceMapper.insert(any(DataSource.class))).thenReturn(1);

        service.create(createDTO);

        ArgumentCaptor<DataSource> captor = ArgumentCaptor.forClass(DataSource.class);
        verify(dataSourceMapper).insert(captor.capture());
        assertEquals("MYSQL", captor.getValue().getDataSourceType());
    }

    @Test
    void create_duplicateId_shouldThrow40900() {
        when(dataSourceMapper.selectCount(any(LambdaQueryWrapper.class))).thenReturn(1L);

        BusinessException ex = assertThrows(BusinessException.class, () -> service.create(createDTO));
        assertEquals(DataSourceErrorCode.DATA_SOURCE_ID_DUPLICATE, ex.getCode());
    }

    @Test
    void create_duplicateName_shouldThrow40901() {
        when(dataSourceMapper.selectCount(any(LambdaQueryWrapper.class))).thenReturn(0L, 1L);

        BusinessException ex = assertThrows(BusinessException.class, () -> service.create(createDTO));
        assertEquals(DataSourceErrorCode.DATA_SOURCE_NAME_DUPLICATE, ex.getCode());
    }

    @Test
    void create_invalidCategory_shouldThrow40001() {
        createDTO.setDataSourceCategory("INVALID");
        when(dataSourceMapper.selectCount(any(LambdaQueryWrapper.class))).thenReturn(0L);

        BusinessException ex = assertThrows(BusinessException.class, () -> service.create(createDTO));
        assertEquals(DataSourceErrorCode.INVALID_CATEGORY, ex.getCode());
    }

    @Test
    void create_invalidType_shouldThrow40002() {
        createDTO.setDataSourceType("POSTGRES");
        when(dataSourceMapper.selectCount(any(LambdaQueryWrapper.class))).thenReturn(0L);

        BusinessException ex = assertThrows(BusinessException.class, () -> service.create(createDTO));
        assertEquals(DataSourceErrorCode.INVALID_TYPE, ex.getCode());
    }

    @Test
    void create_sourceWithMySqlType_shouldThrow40002() {
        createDTO.setDataSourceCategory("SOURCE");
        createDTO.setDataSourceType("MYSQL");
        when(dataSourceMapper.selectCount(any(LambdaQueryWrapper.class))).thenReturn(0L);

        BusinessException ex = assertThrows(BusinessException.class, () -> service.create(createDTO));
        assertEquals(DataSourceErrorCode.INVALID_TYPE, ex.getCode());
    }

    @Test
    void create_insertFailed_shouldThrow50000() {
        when(dataSourceMapper.selectCount(any(LambdaQueryWrapper.class))).thenReturn(0L);
        when(dataSourceMapper.insert(any(DataSource.class))).thenReturn(0);

        BusinessException ex = assertThrows(BusinessException.class, () -> service.create(createDTO));
        assertEquals(DataSourceErrorCode.SAVE_FAILED, ex.getCode());
    }

    // ---- update ----
    @Test
    void update_sameId_shouldNotChangeId() {
        when(dataSourceMapper.selectOne(any(LambdaQueryWrapper.class))).thenReturn(sourceDs);
        when(dataSourceMapper.selectCount(any(LambdaQueryWrapper.class))).thenReturn(0L);
        when(dataSourceMapper.update(any(), any(LambdaUpdateWrapper.class))).thenReturn(1);

        String id = service.update("DS001", updateDTO);

        assertEquals("DS001", id);
        ArgumentCaptor<LambdaUpdateWrapper<DataSource>> captor = ArgumentCaptor.forClass(LambdaUpdateWrapper.class);
        verify(dataSourceMapper).update(eq(null), captor.capture());
        String setSql = captor.getValue().getSqlSet();
        assertFalse(setSql.contains("DATA_SOURCE_ID"));
    }

    @Test
    void update_changeId_shouldUpdateIdAndReturnNewId() {
        updateDTO.setDataSourceId("DS002");
        when(dataSourceMapper.selectOne(any(LambdaQueryWrapper.class))).thenReturn(sourceDs);
        when(dataSourceMapper.selectCount(any(LambdaQueryWrapper.class))).thenReturn(0L);
        when(dataSourceMapper.update(any(), any(LambdaUpdateWrapper.class))).thenReturn(1);

        String id = service.update("DS001", updateDTO);

        assertEquals("DS002", id);
        ArgumentCaptor<LambdaUpdateWrapper<DataSource>> captor = ArgumentCaptor.forClass(LambdaUpdateWrapper.class);
        verify(dataSourceMapper).update(eq(null), captor.capture());
        assertTrue(captor.getValue().getSqlSet().contains("DATA_SOURCE_ID"));
    }

    @Test
    void update_changeToExistingId_shouldThrow40900() {
        updateDTO.setDataSourceId("DS002");
        when(dataSourceMapper.selectOne(any(LambdaQueryWrapper.class))).thenReturn(sourceDs);
        when(dataSourceMapper.selectCount(any(LambdaQueryWrapper.class))).thenReturn(1L);

        BusinessException ex = assertThrows(BusinessException.class,
                () -> service.update("DS001", updateDTO));
        assertEquals(DataSourceErrorCode.DATA_SOURCE_ID_DUPLICATE, ex.getCode());
    }

    @Test
    void update_nameDuplicate_shouldThrow40901() {
        when(dataSourceMapper.selectOne(any(LambdaQueryWrapper.class))).thenReturn(sourceDs);
        when(dataSourceMapper.selectCount(any(LambdaQueryWrapper.class))).thenReturn(1L);

        BusinessException ex = assertThrows(BusinessException.class,
                () -> service.update("DS001", updateDTO));
        assertEquals(DataSourceErrorCode.DATA_SOURCE_NAME_DUPLICATE, ex.getCode());
    }

    @Test
    void update_passwordProvided_shouldSetPassword() {
        updateDTO.setPassword("newpass");
        when(dataSourceMapper.selectOne(any(LambdaQueryWrapper.class))).thenReturn(sourceDs);
        when(dataSourceMapper.selectCount(any(LambdaQueryWrapper.class))).thenReturn(0L);
        when(dataSourceMapper.update(any(), any(LambdaUpdateWrapper.class))).thenReturn(1);

        service.update("DS001", updateDTO);

        ArgumentCaptor<LambdaUpdateWrapper<DataSource>> captor = ArgumentCaptor.forClass(LambdaUpdateWrapper.class);
        verify(dataSourceMapper).update(eq(null), captor.capture());
        assertTrue(captor.getValue().getSqlSet().contains("DATA_SOURCE_PASSWORD"));
    }

    @Test
    void update_passwordEmpty_shouldNotSetPassword() {
        when(dataSourceMapper.selectOne(any(LambdaQueryWrapper.class))).thenReturn(sourceDs);
        when(dataSourceMapper.selectCount(any(LambdaQueryWrapper.class))).thenReturn(0L);
        when(dataSourceMapper.update(any(), any(LambdaUpdateWrapper.class))).thenReturn(1);

        service.update("DS001", updateDTO);

        ArgumentCaptor<LambdaUpdateWrapper<DataSource>> captor = ArgumentCaptor.forClass(LambdaUpdateWrapper.class);
        verify(dataSourceMapper).update(eq(null), captor.capture());
        assertFalse(captor.getValue().getSqlSet().contains("DATA_SOURCE_PASSWORD"));
    }

    @Test
    void update_notFound_shouldThrow40400() {
        when(dataSourceMapper.selectOne(any(LambdaQueryWrapper.class))).thenReturn(null);

        BusinessException ex = assertThrows(BusinessException.class,
                () -> service.update("NONEXIST", updateDTO));
        assertEquals(DataSourceErrorCode.DATA_SOURCE_NOT_FOUND, ex.getCode());
    }

    @Test
    void update_invalidCategory_shouldThrow40001() {
        updateDTO.setDataSourceCategory("INVALID");
        when(dataSourceMapper.selectOne(any(LambdaQueryWrapper.class))).thenReturn(sourceDs);
        when(dataSourceMapper.selectCount(any(LambdaQueryWrapper.class))).thenReturn(0L);

        BusinessException ex = assertThrows(BusinessException.class,
                () -> service.update("DS001", updateDTO));
        assertEquals(DataSourceErrorCode.INVALID_CATEGORY, ex.getCode());
    }

    @Test
    void update_sourceWithMySqlType_shouldThrow40002() {
        updateDTO.setDataSourceCategory("SOURCE");
        updateDTO.setDataSourceType("MYSQL");
        when(dataSourceMapper.selectOne(any(LambdaQueryWrapper.class))).thenReturn(sourceDs);
        when(dataSourceMapper.selectCount(any(LambdaQueryWrapper.class))).thenReturn(0L);

        BusinessException ex = assertThrows(BusinessException.class,
                () -> service.update("DS001", updateDTO));
        assertEquals(DataSourceErrorCode.INVALID_TYPE, ex.getCode());
    }

    @Test
    void update_affectedRowsZero_shouldThrow40400() {
        when(dataSourceMapper.selectOne(any(LambdaQueryWrapper.class))).thenReturn(sourceDs);
        when(dataSourceMapper.selectCount(any(LambdaQueryWrapper.class))).thenReturn(0L);
        when(dataSourceMapper.update(any(), any(LambdaUpdateWrapper.class))).thenReturn(0);

        BusinessException ex = assertThrows(BusinessException.class,
                () -> service.update("DS001", updateDTO));
        assertEquals(DataSourceErrorCode.DATA_SOURCE_NOT_FOUND, ex.getCode());
    }

    // ---- delete ----
    @Test
    void delete_shouldDeleteActiveRecord() {
        when(dataSourceMapper.selectOne(any(LambdaQueryWrapper.class))).thenReturn(sourceDs);
        when(dataSourceMapper.delete(any(LambdaQueryWrapper.class))).thenReturn(1);

        service.delete("SRC001");

        verify(dataSourceMapper).delete(any(LambdaQueryWrapper.class));
    }

    @Test
    void delete_notFound_shouldThrow40400() {
        when(dataSourceMapper.selectOne(any(LambdaQueryWrapper.class))).thenReturn(null);

        BusinessException ex = assertThrows(BusinessException.class,
                () -> service.delete("NONEXIST"));
        assertEquals(DataSourceErrorCode.DATA_SOURCE_NOT_FOUND, ex.getCode());
    }

    @Test
    void delete_affectedRowsZero_shouldThrow50001() {
        when(dataSourceMapper.selectOne(any(LambdaQueryWrapper.class))).thenReturn(sourceDs);
        when(dataSourceMapper.delete(any(LambdaQueryWrapper.class))).thenReturn(0);

        BusinessException ex = assertThrows(BusinessException.class,
                () -> service.delete("SRC001"));
        assertEquals(DataSourceErrorCode.DELETE_FAILED, ex.getCode());
    }

    // ---- testConnection ----
    @Test
    void testConnection_withExplicitPassword_shouldUseIt() {
        when(connectionTester.test(eq("ORACLE"), eq("192.168.1.1"), eq(1521),
                eq("testuser"), eq("testpass"), eq("testdb")))
                .thenReturn(new TestConnectionResultVO(true, "连接成功"));

        TestConnectionResultVO result = service.testConnection(testConnDTO);

        assertTrue(result.getSuccess());
        verify(dataSourceMapper, never()).selectOne(any(LambdaQueryWrapper.class));
    }

    @Test
    void testConnection_withoutPassword_shouldUsePersistedPassword() {
        testConnDTO.setPassword(null);
        testConnDTO.setOriginalDataSourceId("SRC001");
        when(dataSourceMapper.selectOne(any(LambdaQueryWrapper.class))).thenReturn(sourceDs);
        when(connectionTester.test(eq("ORACLE"), eq("192.168.1.1"), eq(1521),
                eq("testuser"), eq("persisted_pass"), eq("testdb")))
                .thenReturn(new TestConnectionResultVO(true, "连接成功"));

        TestConnectionResultVO result = service.testConnection(testConnDTO);

        assertTrue(result.getSuccess());
    }

    @Test
    void testConnection_withoutPasswordAndOriginalId_shouldThrow40002() {
        testConnDTO.setPassword(null);

        BusinessException ex = assertThrows(BusinessException.class,
                () -> service.testConnection(testConnDTO));
        assertEquals(DataSourceErrorCode.INVALID_TYPE, ex.getCode());
        assertEquals("密码为空时必须提供原数据源ID", ex.getMessage());
    }

    @Test
    void testConnection_withoutPasswordAndUnknownOriginalId_shouldThrow40400() {
        testConnDTO.setPassword(null);
        testConnDTO.setOriginalDataSourceId("NONEXIST");
        when(dataSourceMapper.selectOne(any(LambdaQueryWrapper.class))).thenReturn(null);

        BusinessException ex = assertThrows(BusinessException.class,
                () -> service.testConnection(testConnDTO));
        assertEquals(DataSourceErrorCode.DATA_SOURCE_NOT_FOUND, ex.getCode());
    }

    @Test
    void testConnection_invalidType_shouldThrow40002() {
        testConnDTO.setDataSourceType("POSTGRES");

        BusinessException ex = assertThrows(BusinessException.class,
                () -> service.testConnection(testConnDTO));
        assertEquals(DataSourceErrorCode.INVALID_TYPE, ex.getCode());
    }

    // ---- targetOptions ----
    @Test
    void targetOptions_shouldReturnOnlyTargets() {
        when(dataSourceMapper.selectList(any(LambdaQueryWrapper.class)))
                .thenReturn(Collections.singletonList(targetDs));

        List<TargetOptionVO> vos = service.targetOptions();

        assertEquals(1, vos.size());
        assertEquals("TG001", vos.get(0).getDataSourceId());
        assertEquals("ORACLE", vos.get(0).getDataSourceType());
        ArgumentCaptor<LambdaQueryWrapper<DataSource>> captor = ArgumentCaptor.forClass(LambdaQueryWrapper.class);
        verify(dataSourceMapper).selectList(captor.capture());
        assertTrue(captor.getValue().getCustomSqlSegment().contains("UPPER(DATA_SOURCE_CATEGORY) = 'TARGET'"));
    }

    // ---- biz attr ----
    @Test
    void getBizAttr_shouldReturnBizAttr() {
        targetDs.setDataSourceBizAttr("{\"a\":1}");
        when(dataSourceMapper.selectOne(any(LambdaQueryWrapper.class))).thenReturn(targetDs);

        BizAttrVO vo = service.getBizAttr("TG001");

        assertEquals("TG001", vo.getDataSourceId());
        assertEquals("{\"a\":1}", vo.getBizAttr());
    }

    @Test
    void getBizAttr_nonTargetRole_shouldThrow40006() {
        when(dataSourceMapper.selectOne(any(LambdaQueryWrapper.class))).thenReturn(sourceDs);

        BusinessException ex = assertThrows(BusinessException.class,
                () -> service.getBizAttr("SRC001"));
        assertEquals(DataSourceErrorCode.ROLE_NOT_APPLICABLE, ex.getCode());
    }

    @Test
    void getBizAttr_notFound_shouldThrow40400() {
        when(dataSourceMapper.selectOne(any(LambdaQueryWrapper.class))).thenReturn(null);

        BusinessException ex = assertThrows(BusinessException.class,
                () -> service.getBizAttr("NONEXIST"));
        assertEquals(DataSourceErrorCode.DATA_SOURCE_NOT_FOUND, ex.getCode());
    }

    @Test
    void saveBizAttr_shouldUpdateBizAttr() {
        when(dataSourceMapper.selectOne(any(LambdaQueryWrapper.class))).thenReturn(targetDs);
        when(dataSourceMapper.update(any(), any(LambdaUpdateWrapper.class))).thenReturn(1);

        BizAttrSaveDTO dto = new BizAttrSaveDTO();
        dto.setBizAttr("{\"x\":\"y\"}");
        service.saveBizAttr("TG001", dto);

        ArgumentCaptor<LambdaUpdateWrapper<DataSource>> captor = ArgumentCaptor.forClass(LambdaUpdateWrapper.class);
        verify(dataSourceMapper).update(eq(null), captor.capture());
        assertTrue(captor.getValue().getSqlSet().contains("DATA_SOURCE_BIZ_ATTR"));
    }

    @Test
    void saveBizAttr_updateFailed_shouldThrow50000() {
        when(dataSourceMapper.selectOne(any(LambdaQueryWrapper.class))).thenReturn(targetDs);
        when(dataSourceMapper.update(any(), any(LambdaUpdateWrapper.class))).thenReturn(0);

        BusinessException ex = assertThrows(BusinessException.class,
                () -> service.saveBizAttr("TG001", new BizAttrSaveDTO()));
        assertEquals(DataSourceErrorCode.SAVE_FAILED, ex.getCode());
    }

    // ---- listNamingStrategies ----
    @Test
    void listNamingStrategies_shouldMapTargetInfo() {
        DataSourceExtend ext = new DataSourceExtend();
        ext.setDataSourceId("SRC001");
        ext.setTargetDataSourceId("TG001");
        ext.setTableNamingStrategy("TABLE_MERGE");
        ext.setTableNamePrefix("");
        ext.setTableNameSuffix("");
        when(dataSourceMapper.selectOne(any(LambdaQueryWrapper.class))).thenReturn(sourceDs);
        when(extendMapper.selectList(any(LambdaQueryWrapper.class)))
                .thenReturn(Collections.singletonList(ext));
        when(dataSourceMapper.selectList(any(LambdaQueryWrapper.class)))
                .thenReturn(Collections.singletonList(targetDs));

        List<NamingStrategyVO> vos = service.listNamingStrategies("SRC001");

        assertEquals(1, vos.size());
        assertEquals("SRC001", vos.get(0).getSourceDataSourceId());
        assertEquals("TG001", vos.get(0).getTargetDataSourceId());
        assertEquals("目标库", vos.get(0).getTargetDataSourceName());
        assertEquals("ORACLE", vos.get(0).getTargetDataSourceType());
        assertEquals("TABLE_MERGE", vos.get(0).getTableNamingStrategy());
    }

    @Test
    void listNamingStrategies_missingTarget_shouldLeaveNull() {
        DataSourceExtend ext = new DataSourceExtend();
        ext.setDataSourceId("SRC001");
        ext.setTargetDataSourceId("MISSING");
        ext.setTableNamingStrategy("TABLE_MERGE");
        when(dataSourceMapper.selectOne(any(LambdaQueryWrapper.class))).thenReturn(sourceDs);
        when(extendMapper.selectList(any(LambdaQueryWrapper.class)))
                .thenReturn(Collections.singletonList(ext));
        when(dataSourceMapper.selectList(any(LambdaQueryWrapper.class)))
                .thenReturn(Collections.emptyList());

        List<NamingStrategyVO> vos = service.listNamingStrategies("SRC001");

        assertEquals(1, vos.size());
        assertEquals("MISSING", vos.get(0).getTargetDataSourceId());
        assertNull(vos.get(0).getTargetDataSourceName());
        assertNull(vos.get(0).getTargetDataSourceType());
    }

    @Test
    void listNamingStrategies_sourceNotFound_shouldThrow40400() {
        when(dataSourceMapper.selectOne(any(LambdaQueryWrapper.class))).thenReturn(null);

        BusinessException ex = assertThrows(BusinessException.class,
                () -> service.listNamingStrategies("NONEXIST"));
        assertEquals(DataSourceErrorCode.DATA_SOURCE_NOT_FOUND, ex.getCode());
    }

    // ---- createNamingStrategy ----
    @Test
    void createNamingStrategy_tableMerge_shouldClearPrefixSuffix() {
        when(dataSourceMapper.selectOne(any(LambdaQueryWrapper.class))).thenReturn(sourceDs, targetDs);
        when(extendMapper.selectCount(any(LambdaQueryWrapper.class))).thenReturn(0L);
        when(extendMapper.insert(any(DataSourceExtend.class))).thenReturn(1);

        NamingStrategyDTO dto = buildStrategyDTO("TG001", "TABLE_MERGE", "p_", "_s");
        service.createNamingStrategy("SRC001", dto);

        ArgumentCaptor<DataSourceExtend> captor = ArgumentCaptor.forClass(DataSourceExtend.class);
        verify(extendMapper).insert(captor.capture());
        assertEquals("SRC001", captor.getValue().getDataSourceId());
        assertEquals("TG001", captor.getValue().getTargetDataSourceId());
        assertEquals("", captor.getValue().getTableNamePrefix());
        assertEquals("", captor.getValue().getTableNameSuffix());
    }

    @Test
    void createNamingStrategy_customPrefixSuffix_shouldKeepValues() {
        when(dataSourceMapper.selectOne(any(LambdaQueryWrapper.class))).thenReturn(sourceDs, targetDs);
        when(extendMapper.selectCount(any(LambdaQueryWrapper.class))).thenReturn(0L);
        when(extendMapper.insert(any(DataSourceExtend.class))).thenReturn(1);

        NamingStrategyDTO dto = buildStrategyDTO("TG001", "CUSTOM_PREFIX_SUFFIX", "p_", "_s");
        service.createNamingStrategy("SRC001", dto);

        ArgumentCaptor<DataSourceExtend> captor = ArgumentCaptor.forClass(DataSourceExtend.class);
        verify(extendMapper).insert(captor.capture());
        assertEquals("p_", captor.getValue().getTableNamePrefix());
        assertEquals("_s", captor.getValue().getTableNameSuffix());
    }

    @Test
    void createNamingStrategy_duplicate_shouldThrow40902() {
        when(dataSourceMapper.selectOne(any(LambdaQueryWrapper.class))).thenReturn(sourceDs, targetDs);
        when(extendMapper.selectCount(any(LambdaQueryWrapper.class))).thenReturn(1L);

        BusinessException ex = assertThrows(BusinessException.class,
                () -> service.createNamingStrategy("SRC001", buildStrategyDTO("TG001", "TABLE_MERGE", "", "")));
        assertEquals(DataSourceErrorCode.NAMING_STRATEGY_DUPLICATE, ex.getCode());
    }

    @Test
    void createNamingStrategy_multiConflict_shouldThrow40903() {
        when(dataSourceMapper.selectOne(any(LambdaQueryWrapper.class))).thenReturn(sourceDs, targetDs);
        when(extendMapper.selectCount(any(LambdaQueryWrapper.class))).thenReturn(2L);

        BusinessException ex = assertThrows(BusinessException.class,
                () -> service.createNamingStrategy("SRC001", buildStrategyDTO("TG001", "TABLE_MERGE", "", "")));
        assertEquals(DataSourceErrorCode.NAMING_STRATEGY_MULTI_CONFLICT, ex.getCode());
    }

    @Test
    void createNamingStrategy_invalidTarget_shouldThrow40005() {
        when(dataSourceMapper.selectOne(any(LambdaQueryWrapper.class))).thenReturn(sourceDs, null);

        BusinessException ex = assertThrows(BusinessException.class,
                () -> service.createNamingStrategy("SRC001", buildStrategyDTO("BAD", "TABLE_MERGE", "", "")));
        assertEquals(DataSourceErrorCode.INVALID_TARGET_DATA_SOURCE, ex.getCode());
    }

    @Test
    void createNamingStrategy_customWithoutPrefix_shouldThrow40003() {
        when(dataSourceMapper.selectOne(any(LambdaQueryWrapper.class))).thenReturn(sourceDs, targetDs);

        BusinessException ex = assertThrows(BusinessException.class,
                () -> service.createNamingStrategy("SRC001",
                        buildStrategyDTO("TG001", "CUSTOM_PREFIX_SUFFIX", null, "_s")));
        assertEquals(DataSourceErrorCode.INVALID_NAMING_STRATEGY, ex.getCode());
        assertEquals("自定义命名策略必须填写前缀和后缀", ex.getMessage());
    }

    @Test
    void createNamingStrategy_invalidStrategy_shouldThrow40003() {
        when(dataSourceMapper.selectOne(any(LambdaQueryWrapper.class))).thenReturn(sourceDs, targetDs);

        BusinessException ex = assertThrows(BusinessException.class,
                () -> service.createNamingStrategy("SRC001", buildStrategyDTO("TG001", "BAD", "", "")));
        assertEquals(DataSourceErrorCode.INVALID_NAMING_STRATEGY, ex.getCode());
    }

    @Test
    void createNamingStrategy_insertFailed_shouldThrow50000() {
        when(dataSourceMapper.selectOne(any(LambdaQueryWrapper.class))).thenReturn(sourceDs, targetDs);
        when(extendMapper.selectCount(any(LambdaQueryWrapper.class))).thenReturn(0L);
        when(extendMapper.insert(any(DataSourceExtend.class))).thenReturn(0);

        BusinessException ex = assertThrows(BusinessException.class,
                () -> service.createNamingStrategy("SRC001", buildStrategyDTO("TG001", "TABLE_MERGE", "", "")));
        assertEquals(DataSourceErrorCode.SAVE_FAILED, ex.getCode());
    }

    // ---- updateNamingStrategy ----
    @Test
    void updateNamingStrategy_sameTarget_shouldSucceed() {
        when(dataSourceMapper.selectOne(any(LambdaQueryWrapper.class))).thenReturn(sourceDs, targetDs);
        when(extendMapper.selectCount(any(LambdaQueryWrapper.class))).thenReturn(1L);
        when(extendMapper.update(any(), any(LambdaUpdateWrapper.class))).thenReturn(1);

        service.updateNamingStrategy("SRC001", "TG001",
                buildStrategyDTO("TG001", "TABLE_MERGE", "", ""));

        verify(extendMapper).update(any(), any(LambdaUpdateWrapper.class));
    }

    @Test
    void updateNamingStrategy_changeTarget_shouldSucceed() {
        when(dataSourceMapper.selectOne(any(LambdaQueryWrapper.class))).thenReturn(sourceDs, targetDs);
        when(extendMapper.selectCount(any(LambdaQueryWrapper.class))).thenReturn(1L, 0L);
        when(extendMapper.update(any(), any(LambdaUpdateWrapper.class))).thenReturn(1);

        service.updateNamingStrategy("SRC001", "TG001",
                buildStrategyDTO("TG002", "TABLE_MERGE", "", ""));

        ArgumentCaptor<LambdaUpdateWrapper<DataSourceExtend>> captor =
                ArgumentCaptor.forClass(LambdaUpdateWrapper.class);
        verify(extendMapper).update(eq(null), captor.capture());
        assertTrue(captor.getValue().getSqlSet().contains("TARGET_DATA_SOURCE_ID"));
    }

    @Test
    void updateNamingStrategy_originalNotFound_shouldThrow40401() {
        when(dataSourceMapper.selectOne(any(LambdaQueryWrapper.class))).thenReturn(sourceDs, targetDs);
        when(extendMapper.selectCount(any(LambdaQueryWrapper.class))).thenReturn(0L);

        BusinessException ex = assertThrows(BusinessException.class,
                () -> service.updateNamingStrategy("SRC001", "TG001",
                        buildStrategyDTO("TG001", "TABLE_MERGE", "", "")));
        assertEquals(DataSourceErrorCode.NAMING_STRATEGY_NOT_FOUND, ex.getCode());
    }

    @Test
    void updateNamingStrategy_originalMulti_shouldThrow40903() {
        when(dataSourceMapper.selectOne(any(LambdaQueryWrapper.class))).thenReturn(sourceDs, targetDs);
        when(extendMapper.selectCount(any(LambdaQueryWrapper.class))).thenReturn(2L);

        BusinessException ex = assertThrows(BusinessException.class,
                () -> service.updateNamingStrategy("SRC001", "TG001",
                        buildStrategyDTO("TG001", "TABLE_MERGE", "", "")));
        assertEquals(DataSourceErrorCode.NAMING_STRATEGY_MULTI_CONFLICT, ex.getCode());
    }

    @Test
    void updateNamingStrategy_newKeyDuplicate_shouldThrow40902() {
        when(dataSourceMapper.selectOne(any(LambdaQueryWrapper.class))).thenReturn(sourceDs, targetDs);
        when(extendMapper.selectCount(any(LambdaQueryWrapper.class))).thenReturn(1L, 1L);

        BusinessException ex = assertThrows(BusinessException.class,
                () -> service.updateNamingStrategy("SRC001", "TG001",
                        buildStrategyDTO("TG002", "TABLE_MERGE", "", "")));
        assertEquals(DataSourceErrorCode.NAMING_STRATEGY_DUPLICATE, ex.getCode());
    }

    @Test
    void updateNamingStrategy_newKeyMulti_shouldThrow40903() {
        when(dataSourceMapper.selectOne(any(LambdaQueryWrapper.class))).thenReturn(sourceDs, targetDs);
        when(extendMapper.selectCount(any(LambdaQueryWrapper.class))).thenReturn(1L, 2L);

        BusinessException ex = assertThrows(BusinessException.class,
                () -> service.updateNamingStrategy("SRC001", "TG001",
                        buildStrategyDTO("TG002", "TABLE_MERGE", "", "")));
        assertEquals(DataSourceErrorCode.NAMING_STRATEGY_MULTI_CONFLICT, ex.getCode());
    }

    @Test
    void updateNamingStrategy_invalidStrategy_shouldThrow40003() {
        when(dataSourceMapper.selectOne(any(LambdaQueryWrapper.class))).thenReturn(sourceDs, targetDs);

        BusinessException ex = assertThrows(BusinessException.class,
                () -> service.updateNamingStrategy("SRC001", "TG001",
                        buildStrategyDTO("TG001", "BAD", "", "")));
        assertEquals(DataSourceErrorCode.INVALID_NAMING_STRATEGY, ex.getCode());
    }

    // ---- deleteNamingStrategy ----
    @Test
    void deleteNamingStrategy_shouldSucceed() {
        when(dataSourceMapper.selectOne(any(LambdaQueryWrapper.class))).thenReturn(sourceDs);
        when(extendMapper.selectCount(any(LambdaQueryWrapper.class))).thenReturn(1L);
        when(extendMapper.delete(any(LambdaQueryWrapper.class))).thenReturn(1);

        service.deleteNamingStrategy("SRC001", "TG001");

        verify(extendMapper).delete(any(LambdaQueryWrapper.class));
    }

    @Test
    void deleteNamingStrategy_notFound_shouldThrow40401() {
        when(dataSourceMapper.selectOne(any(LambdaQueryWrapper.class))).thenReturn(sourceDs);
        when(extendMapper.selectCount(any(LambdaQueryWrapper.class))).thenReturn(0L);

        BusinessException ex = assertThrows(BusinessException.class,
                () -> service.deleteNamingStrategy("SRC001", "TG001"));
        assertEquals(DataSourceErrorCode.NAMING_STRATEGY_NOT_FOUND, ex.getCode());
    }

    @Test
    void deleteNamingStrategy_multi_shouldThrow40903() {
        when(dataSourceMapper.selectOne(any(LambdaQueryWrapper.class))).thenReturn(sourceDs);
        when(extendMapper.selectCount(any(LambdaQueryWrapper.class))).thenReturn(2L);

        BusinessException ex = assertThrows(BusinessException.class,
                () -> service.deleteNamingStrategy("SRC001", "TG001"));
        assertEquals(DataSourceErrorCode.NAMING_STRATEGY_MULTI_CONFLICT, ex.getCode());
    }

    @Test
    void deleteNamingStrategy_deleteFailed_shouldThrow40401() {
        when(dataSourceMapper.selectOne(any(LambdaQueryWrapper.class))).thenReturn(sourceDs);
        when(extendMapper.selectCount(any(LambdaQueryWrapper.class))).thenReturn(1L);
        when(extendMapper.delete(any(LambdaQueryWrapper.class))).thenReturn(0);

        BusinessException ex = assertThrows(BusinessException.class,
                () -> service.deleteNamingStrategy("SRC001", "TG001"));
        assertEquals(DataSourceErrorCode.NAMING_STRATEGY_NOT_FOUND, ex.getCode());
    }

    // -- helpers --

    private NamingStrategyDTO buildStrategyDTO(String targetId, String strategy,
                                               String prefix, String suffix) {
        NamingStrategyDTO dto = new NamingStrategyDTO();
        dto.setTargetDataSourceId(targetId);
        dto.setTableNamingStrategy(strategy);
        dto.setTableNamePrefix(prefix);
        dto.setTableNameSuffix(suffix);
        return dto;
    }
}
