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
import com.bsoft.cdcconfig.datasource.dto.TestConnectionDTO;
import com.bsoft.cdcconfig.datasource.entity.DataSource;
import com.bsoft.cdcconfig.datasource.exception.DataSourceErrorCode;
import com.bsoft.cdcconfig.datasource.mapper.DataSourceMapper;
import com.bsoft.cdcconfig.datasource.query.DataSourceQuery;
import com.bsoft.cdcconfig.datasource.service.impl.DataSourceServiceImpl;
import com.bsoft.cdcconfig.datasource.vo.BizAttrVO;
import com.bsoft.cdcconfig.datasource.vo.DataSourceDetailVO;
import com.bsoft.cdcconfig.datasource.vo.DataSourceListVO;
import com.bsoft.cdcconfig.datasource.vo.TargetOptionVO;
import com.bsoft.cdcconfig.datasource.vo.TestConnectionResultVO;
import org.apache.ibatis.annotations.Insert;
import org.apache.ibatis.builder.MapperBuilderAssistant;
import org.junit.jupiter.api.BeforeAll;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.lang.reflect.Method;
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
        createDTO.setDataSourceCategory("SOURCE");
        createDTO.setDataSourceType("ORACLE");
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
    void list_shouldReturnAllStatusRecordsWithFilters() {
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
        assertFalse(sql.contains("FG_ACTIVE"));
    }

    @Test
    void list_withoutFilters_shouldNotFilterActive() {
        when(dataSourceMapper.selectList(any(LambdaQueryWrapper.class)))
                .thenReturn(Collections.emptyList());

        service.list(new DataSourceQuery());

        ArgumentCaptor<LambdaQueryWrapper<DataSource>> captor = ArgumentCaptor.forClass(LambdaQueryWrapper.class);
        verify(dataSourceMapper).selectList(captor.capture());
        assertFalse(captor.getValue().getCustomSqlSegment().contains("FG_ACTIVE"));
    }

    @Test
    void list_shouldReturnRawFgActiveWithoutNormalization() {
        DataSource inactive = new DataSource();
        inactive.setDataSourceId("DS0");
        inactive.setFgActive("0");
        DataSource abnormal = new DataSource();
        abnormal.setDataSourceId("DSX");
        abnormal.setFgActive("X");
        DataSource nullStatus = new DataSource();
        nullStatus.setDataSourceId("DSN");
        nullStatus.setFgActive(null);
        when(dataSourceMapper.selectList(any(LambdaQueryWrapper.class)))
                .thenReturn(java.util.Arrays.asList(sourceDs, inactive, abnormal, nullStatus));

        List<DataSourceListVO> vos = service.list(new DataSourceQuery());

        assertEquals(4, vos.size());
        assertEquals("1", vos.get(0).getFgActive());
        assertEquals("0", vos.get(1).getFgActive());
        assertEquals("X", vos.get(2).getFgActive());
        assertEquals(null, vos.get(3).getFgActive());
    }

    @Test
    void list_withCategory_shouldApplyCaseCompatibleAndFilter() {
        DataSourceQuery query = new DataSourceQuery();
        query.setCategory("TARGET");
        when(dataSourceMapper.selectList(any(LambdaQueryWrapper.class)))
                .thenReturn(Collections.emptyList());

        service.list(query);

        ArgumentCaptor<LambdaQueryWrapper<DataSource>> captor = ArgumentCaptor.forClass(LambdaQueryWrapper.class);
        verify(dataSourceMapper).selectList(captor.capture());
        String sql = captor.getValue().getCustomSqlSegment();
        assertTrue(sql.contains("UPPER(DATA_SOURCE_CATEGORY) ="));
        assertFalse(sql.contains("FG_ACTIVE"));
    }

    @Test
    void list_withoutCategory_shouldNotFilterCategory() {
        when(dataSourceMapper.selectList(any(LambdaQueryWrapper.class)))
                .thenReturn(Collections.emptyList());

        service.list(new DataSourceQuery());

        ArgumentCaptor<LambdaQueryWrapper<DataSource>> captor = ArgumentCaptor.forClass(LambdaQueryWrapper.class);
        verify(dataSourceMapper).selectList(captor.capture());
        assertFalse(captor.getValue().getCustomSqlSegment().contains("DATA_SOURCE_CATEGORY"));
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
        when(dataSourceMapper.insertWithSysdate(any(DataSource.class))).thenReturn(1);

        String id = service.create(createDTO);

        assertEquals("DS001", id);
        ArgumentCaptor<DataSource> captor = ArgumentCaptor.forClass(DataSource.class);
        verify(dataSourceMapper).insertWithSysdate(captor.capture());
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
        when(dataSourceMapper.insertWithSysdate(any(DataSource.class))).thenReturn(1);

        service.create(createDTO);

        ArgumentCaptor<DataSource> captor = ArgumentCaptor.forClass(DataSource.class);
        verify(dataSourceMapper).insertWithSysdate(captor.capture());
        assertEquals("MYSQL", captor.getValue().getDataSourceType());
    }

    @Test
    void create_lowercaseCategory_shouldThrow40001() {
        createDTO.setDataSourceCategory("source");
        when(dataSourceMapper.selectCount(any(LambdaQueryWrapper.class))).thenReturn(0L);

        BusinessException ex = assertThrows(BusinessException.class, () -> service.create(createDTO));
        assertEquals(DataSourceErrorCode.INVALID_CATEGORY, ex.getCode());
    }

    @Test
    void create_lowercaseType_shouldThrow40002() {
        createDTO.setDataSourceType("oracle");
        when(dataSourceMapper.selectCount(any(LambdaQueryWrapper.class))).thenReturn(0L);

        BusinessException ex = assertThrows(BusinessException.class, () -> service.create(createDTO));
        assertEquals(DataSourceErrorCode.INVALID_TYPE, ex.getCode());
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
        when(dataSourceMapper.insertWithSysdate(any(DataSource.class))).thenReturn(0);

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
    void update_caseOnlyChangeId_shouldUpdateId() {
        updateDTO.setDataSourceId("ds001");
        when(dataSourceMapper.selectOne(any(LambdaQueryWrapper.class))).thenReturn(sourceDs);
        when(dataSourceMapper.selectCount(any(LambdaQueryWrapper.class))).thenReturn(0L);
        when(dataSourceMapper.update(any(), any(LambdaUpdateWrapper.class))).thenReturn(1);

        String id = service.update("DS001", updateDTO);

        assertEquals("ds001", id);
        ArgumentCaptor<LambdaUpdateWrapper<DataSource>> captor = ArgumentCaptor.forClass(LambdaUpdateWrapper.class);
        verify(dataSourceMapper).update(eq(null), captor.capture());
        assertTrue(captor.getValue().getSqlSet().contains("DATA_SOURCE_ID"));
    }

    @Test
    void update_missingId_shouldThrowValidationError() {
        updateDTO.setDataSourceId(null);
        when(dataSourceMapper.selectOne(any(LambdaQueryWrapper.class))).thenReturn(sourceDs);

        BusinessException ex = assertThrows(BusinessException.class,
                () -> service.update("DS001", updateDTO));
        assertEquals(400, ex.getCode());
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
    void update_nameDuplicateAcrossAllRecords_shouldThrow40901() {
        when(dataSourceMapper.selectOne(any(LambdaQueryWrapper.class))).thenReturn(sourceDs);
        when(dataSourceMapper.selectCount(any(LambdaQueryWrapper.class))).thenReturn(1L);

        BusinessException ex = assertThrows(BusinessException.class,
                () -> service.update("DS001", updateDTO));
        assertEquals(DataSourceErrorCode.DATA_SOURCE_NAME_DUPLICATE, ex.getCode());

        ArgumentCaptor<LambdaQueryWrapper<DataSource>> captor = ArgumentCaptor.forClass(LambdaQueryWrapper.class);
        verify(dataSourceMapper).selectCount(captor.capture());
        String sql = captor.getValue().getCustomSqlSegment();
        assertTrue(sql.contains("UPPER(DATA_SOURCE_NAME)"));
        assertFalse(sql.contains("FG_ACTIVE"));
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

    // ---- maintainable boundary (FG_ACTIVE IN ('1','0')) ----
    @Test
    void getDetail_shouldAcceptActiveOrInactive() {
        when(dataSourceMapper.selectOne(any(LambdaQueryWrapper.class))).thenReturn(sourceDs);

        service.getDetail("SRC001");

        ArgumentCaptor<LambdaQueryWrapper<DataSource>> captor = ArgumentCaptor.forClass(LambdaQueryWrapper.class);
        verify(dataSourceMapper).selectOne(captor.capture());
        String sql = captor.getValue().getCustomSqlSegment();
        assertTrue(sql.contains("FG_ACTIVE IN"), "expect FG_ACTIVE IN ('1','0'), got: " + sql);
        assertFalse(sql.contains("FG_ACTIVE ="), "must not degrade to FG_ACTIVE = '1': " + sql);
    }

    @Test
    void testConnection_withoutPassword_shouldReadInactiveRecord() {
        testConnDTO.setPassword(null);
        testConnDTO.setOriginalDataSourceId("SRC001");
        when(dataSourceMapper.selectOne(any(LambdaQueryWrapper.class))).thenReturn(sourceDs);
        when(connectionTester.test(any(), any(), any(), any(), any(), any()))
                .thenReturn(new TestConnectionResultVO(true, "连接成功"));

        service.testConnection(testConnDTO);

        ArgumentCaptor<LambdaQueryWrapper<DataSource>> captor = ArgumentCaptor.forClass(LambdaQueryWrapper.class);
        verify(dataSourceMapper).selectOne(captor.capture());
        assertTrue(captor.getValue().getCustomSqlSegment().contains("FG_ACTIVE IN"));
    }

    @Test
    void saveBizAttr_shouldAcceptActiveOrInactiveSourceRecord() {
        when(dataSourceMapper.selectOne(any(LambdaQueryWrapper.class))).thenReturn(targetDs);
        when(dataSourceMapper.update(any(), any(LambdaUpdateWrapper.class))).thenReturn(1);

        service.saveBizAttr("TG001", new BizAttrSaveDTO());

        ArgumentCaptor<LambdaQueryWrapper<DataSource>> captor = ArgumentCaptor.forClass(LambdaQueryWrapper.class);
        verify(dataSourceMapper).selectOne(captor.capture());
        assertTrue(captor.getValue().getCustomSqlSegment().contains("FG_ACTIVE IN"));
    }

    // ---- enable ----
    @Test
    void enable_fromInactive_shouldWriteActive() {
        sourceDs.setFgActive("0");
        when(dataSourceMapper.selectOne(any(LambdaQueryWrapper.class))).thenReturn(sourceDs);
        when(dataSourceMapper.update(any(), any(LambdaUpdateWrapper.class))).thenReturn(1);

        service.enable("SRC001");

        ArgumentCaptor<LambdaUpdateWrapper<DataSource>> captor = ArgumentCaptor.forClass(LambdaUpdateWrapper.class);
        verify(dataSourceMapper).update(eq(null), captor.capture());
        LambdaUpdateWrapper<DataSource> wrapper = captor.getValue();
        assertTrue(wrapper.getSqlSet().contains("FG_ACTIVE"));
        String where = wrapper.getCustomSqlSegment();
        assertTrue(where.contains("DATA_SOURCE_ID ="));
        assertTrue(where.contains("FG_ACTIVE ="), "conditional update must match observed status: " + where);
    }

    @Test
    void enable_alreadyActive_shouldBeIdempotentWithoutDml() {
        sourceDs.setFgActive("1");
        when(dataSourceMapper.selectOne(any(LambdaQueryWrapper.class))).thenReturn(sourceDs);

        service.enable("SRC001");

        verify(dataSourceMapper, never()).update(any(), any(LambdaUpdateWrapper.class));
    }

    @Test
    void enable_abnormalStatus_shouldThrow40250WithoutDml() {
        sourceDs.setFgActive("X");
        when(dataSourceMapper.selectOne(any(LambdaQueryWrapper.class))).thenReturn(sourceDs);

        BusinessException ex = assertThrows(BusinessException.class, () -> service.enable("SRC001"));
        assertEquals(DataSourceErrorCode.STATUS_INVALID, ex.getCode());
        verify(dataSourceMapper, never()).update(any(), any(LambdaUpdateWrapper.class));
    }

    @Test
    void enable_nullStatus_shouldThrow40250WithoutDml() {
        sourceDs.setFgActive(null);
        when(dataSourceMapper.selectOne(any(LambdaQueryWrapper.class))).thenReturn(sourceDs);

        BusinessException ex = assertThrows(BusinessException.class, () -> service.enable("SRC001"));
        assertEquals(DataSourceErrorCode.STATUS_INVALID, ex.getCode());
        verify(dataSourceMapper, never()).update(any(), any(LambdaUpdateWrapper.class));
    }

    @Test
    void enable_notFound_shouldThrow40400WithoutDml() {
        when(dataSourceMapper.selectOne(any(LambdaQueryWrapper.class))).thenReturn(null);

        BusinessException ex = assertThrows(BusinessException.class, () -> service.enable("NONEXIST"));
        assertEquals(DataSourceErrorCode.DATA_SOURCE_NOT_FOUND, ex.getCode());
        verify(dataSourceMapper, never()).update(any(), any(LambdaUpdateWrapper.class));
    }

    @Test
    void enable_conditionalUpdateZeroRows_shouldThrow50002() {
        sourceDs.setFgActive("0");
        when(dataSourceMapper.selectOne(any(LambdaQueryWrapper.class))).thenReturn(sourceDs);
        when(dataSourceMapper.update(any(), any(LambdaUpdateWrapper.class))).thenReturn(0);

        BusinessException ex = assertThrows(BusinessException.class, () -> service.enable("SRC001"));
        assertEquals(DataSourceErrorCode.STATUS_FAILED, ex.getCode());
    }

    // ---- disable ----
    @Test
    void disable_fromActive_shouldWriteInactive() {
        sourceDs.setFgActive("1");
        when(dataSourceMapper.selectOne(any(LambdaQueryWrapper.class))).thenReturn(sourceDs);
        when(dataSourceMapper.update(any(), any(LambdaUpdateWrapper.class))).thenReturn(1);

        service.disable("SRC001");

        ArgumentCaptor<LambdaUpdateWrapper<DataSource>> captor = ArgumentCaptor.forClass(LambdaUpdateWrapper.class);
        verify(dataSourceMapper).update(eq(null), captor.capture());
        LambdaUpdateWrapper<DataSource> wrapper = captor.getValue();
        assertTrue(wrapper.getSqlSet().contains("FG_ACTIVE"));
        assertTrue(wrapper.getCustomSqlSegment().contains("FG_ACTIVE ="));
    }

    @Test
    void disable_alreadyInactive_shouldBeIdempotentWithoutDml() {
        sourceDs.setFgActive("0");
        when(dataSourceMapper.selectOne(any(LambdaQueryWrapper.class))).thenReturn(sourceDs);

        service.disable("SRC001");

        verify(dataSourceMapper, never()).update(any(), any(LambdaUpdateWrapper.class));
    }

    @Test
    void disable_abnormalStatus_shouldNormalizeToInactive() {
        sourceDs.setFgActive("X");
        when(dataSourceMapper.selectOne(any(LambdaQueryWrapper.class))).thenReturn(sourceDs);
        when(dataSourceMapper.update(any(), any(LambdaUpdateWrapper.class))).thenReturn(1);

        service.disable("SRC001");

        ArgumentCaptor<LambdaUpdateWrapper<DataSource>> captor = ArgumentCaptor.forClass(LambdaUpdateWrapper.class);
        verify(dataSourceMapper).update(eq(null), captor.capture());
        assertTrue(captor.getValue().getCustomSqlSegment().contains("FG_ACTIVE ="));
    }

    @Test
    void disable_nullStatus_shouldNormalizeWithNullSafeCondition() {
        sourceDs.setFgActive(null);
        when(dataSourceMapper.selectOne(any(LambdaQueryWrapper.class))).thenReturn(sourceDs);
        when(dataSourceMapper.update(any(), any(LambdaUpdateWrapper.class))).thenReturn(1);

        service.disable("SRC001");

        ArgumentCaptor<LambdaUpdateWrapper<DataSource>> captor = ArgumentCaptor.forClass(LambdaUpdateWrapper.class);
        verify(dataSourceMapper).update(eq(null), captor.capture());
        assertTrue(captor.getValue().getCustomSqlSegment().contains("FG_ACTIVE IS NULL"));
    }

    @Test
    void disable_notFound_shouldThrow40400WithoutDml() {
        when(dataSourceMapper.selectOne(any(LambdaQueryWrapper.class))).thenReturn(null);

        BusinessException ex = assertThrows(BusinessException.class, () -> service.disable("NONEXIST"));
        assertEquals(DataSourceErrorCode.DATA_SOURCE_NOT_FOUND, ex.getCode());
        verify(dataSourceMapper, never()).update(any(), any(LambdaUpdateWrapper.class));
    }

    @Test
    void disable_conditionalUpdateZeroRows_shouldThrow50002() {
        sourceDs.setFgActive("1");
        when(dataSourceMapper.selectOne(any(LambdaQueryWrapper.class))).thenReturn(sourceDs);
        when(dataSourceMapper.update(any(), any(LambdaUpdateWrapper.class))).thenReturn(0);

        BusinessException ex = assertThrows(BusinessException.class, () -> service.disable("SRC001"));
        assertEquals(DataSourceErrorCode.STATUS_FAILED, ex.getCode());
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
    void testConnection_withoutPasswordAndOriginalId_shouldThrowValidationError() {
        testConnDTO.setPassword(null);

        BusinessException ex = assertThrows(BusinessException.class,
                () -> service.testConnection(testConnDTO));
        assertEquals(400, ex.getCode());
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

    // ---- 时间字段维护（DS-REQ-178~182） ----

    /** 新增走专用 INSERT，且时间字段不由 Java 侧赋值——时间只能来自数据库 SYSDATE。 */
    @Test
    void create_shouldNotAssignTimeFieldsInJava() {
        when(dataSourceMapper.selectCount(any(LambdaQueryWrapper.class))).thenReturn(0L);
        when(dataSourceMapper.insertWithSysdate(any(DataSource.class))).thenReturn(1);

        service.create(createDTO);

        ArgumentCaptor<DataSource> captor = ArgumentCaptor.forClass(DataSource.class);
        verify(dataSourceMapper).insertWithSysdate(captor.capture());
        assertNull(captor.getValue().getInsertTime());
        assertNull(captor.getValue().getUpdateTime());
        verify(dataSourceMapper, never()).insert(any(DataSource.class));
    }

    /** 新增 SQL 必须在同一条 INSERT 中以数据库当前时间写入两个时间列（DS-REQ-178）。 */
    @Test
    void createInsertStatement_shouldWriteBothTimesWithSysdateInOneStatement() throws Exception {
        Method method = DataSourceMapper.class.getMethod("insertWithSysdate", DataSource.class);
        Insert annotation = method.getAnnotation(Insert.class);
        assertNotNull(annotation, "insertWithSysdate 必须带 @Insert 注解");

        String sql = String.join(" ", annotation.value()).replaceAll("\\s+", " ").trim();

        assertTrue(sql.startsWith("INSERT INTO CDC_DATA_SOURCE"), sql);
        assertTrue(sql.contains("INSERT_TIME, UPDATE_TIME)"), sql);
        assertEquals(2, countOccurrences(sql, "SYSDATE"), "两个时间列都必须是 SYSDATE：" + sql);
        assertTrue(sql.contains("SYSDATE, SYSDATE)"), sql);
        assertFalse(sql.contains("SYSTIMESTAMP"), sql);
    }

    /** 主弹窗编辑保存：同一条 UPDATE 刷新 UPDATE_TIME，且不触碰 INSERT_TIME（DS-REQ-179）。 */
    @Test
    void update_shouldRefreshUpdateTimeAndKeepInsertTimeUntouched() {
        when(dataSourceMapper.selectOne(any(LambdaQueryWrapper.class))).thenReturn(sourceDs);
        when(dataSourceMapper.update(any(), any(LambdaUpdateWrapper.class))).thenReturn(1);

        service.update("DS001", updateDTO);

        ArgumentCaptor<LambdaUpdateWrapper<DataSource>> captor = ArgumentCaptor.forClass(LambdaUpdateWrapper.class);
        verify(dataSourceMapper).update(eq(null), captor.capture());
        String setSql = captor.getValue().getSqlSet();
        assertTrue(setSql.contains("UPDATE_TIME = SYSDATE"), setSql);
        assertFalse(setSql.contains("INSERT_TIME"), setSql);
    }

    /** 非幂等启用：状态与 UPDATE_TIME 在同一条 UPDATE 中写入（DS-REQ-180）。 */
    @Test
    void enable_nonIdempotent_shouldRefreshUpdateTime() {
        sourceDs.setFgActive("0");
        when(dataSourceMapper.selectOne(any(LambdaQueryWrapper.class))).thenReturn(sourceDs);
        when(dataSourceMapper.update(any(), any(LambdaUpdateWrapper.class))).thenReturn(1);

        service.enable("SRC001");

        ArgumentCaptor<LambdaUpdateWrapper<DataSource>> captor = ArgumentCaptor.forClass(LambdaUpdateWrapper.class);
        verify(dataSourceMapper).update(eq(null), captor.capture());
        String setSql = captor.getValue().getSqlSet();
        assertTrue(setSql.contains("FG_ACTIVE"));
        assertTrue(setSql.contains("UPDATE_TIME = SYSDATE"), setSql);
    }

    /** 非幂等停用：状态与 UPDATE_TIME 在同一条 UPDATE 中写入（DS-REQ-180）。 */
    @Test
    void disable_nonIdempotent_shouldRefreshUpdateTime() {
        sourceDs.setFgActive("1");
        when(dataSourceMapper.selectOne(any(LambdaQueryWrapper.class))).thenReturn(sourceDs);
        when(dataSourceMapper.update(any(), any(LambdaUpdateWrapper.class))).thenReturn(1);

        service.disable("SRC001");

        ArgumentCaptor<LambdaUpdateWrapper<DataSource>> captor = ArgumentCaptor.forClass(LambdaUpdateWrapper.class);
        verify(dataSourceMapper).update(eq(null), captor.capture());
        String setSql = captor.getValue().getSqlSet();
        assertTrue(setSql.contains("FG_ACTIVE"));
        assertTrue(setSql.contains("UPDATE_TIME = SYSDATE"), setSql);
    }

    /** 异常状态归一化停用同样刷新 UPDATE_TIME，并与原状态条件在同一条 UPDATE（DS-REQ-180）。 */
    @Test
    void disable_abnormalStatus_shouldRefreshUpdateTime() {
        sourceDs.setFgActive("X");
        when(dataSourceMapper.selectOne(any(LambdaQueryWrapper.class))).thenReturn(sourceDs);
        when(dataSourceMapper.update(any(), any(LambdaUpdateWrapper.class))).thenReturn(1);

        service.disable("SRC001");

        ArgumentCaptor<LambdaUpdateWrapper<DataSource>> captor = ArgumentCaptor.forClass(LambdaUpdateWrapper.class);
        verify(dataSourceMapper).update(eq(null), captor.capture());
        assertTrue(captor.getValue().getSqlSet().contains("UPDATE_TIME = SYSDATE"));
    }

    /** 幂等启用分支不执行 DML，也不得仅为更新时间而写库（DS-REQ-180）。 */
    @Test
    void enable_idempotent_shouldNotWriteAnythingIncludingUpdateTime() {
        sourceDs.setFgActive("1");
        when(dataSourceMapper.selectOne(any(LambdaQueryWrapper.class))).thenReturn(sourceDs);

        service.enable("SRC001");

        verify(dataSourceMapper, never()).update(any(), any(LambdaUpdateWrapper.class));
    }

    /** 幂等停用分支不执行 DML，也不得仅为更新时间而写库（DS-REQ-180）。 */
    @Test
    void disable_idempotent_shouldNotWriteAnythingIncludingUpdateTime() {
        sourceDs.setFgActive("0");
        when(dataSourceMapper.selectOne(any(LambdaQueryWrapper.class))).thenReturn(sourceDs);

        service.disable("SRC001");

        verify(dataSourceMapper, never()).update(any(), any(LambdaUpdateWrapper.class));
    }

    /** 业务属性保存与 UPDATE_TIME 在同一条主表 UPDATE 中完成（DS-REQ-181）。 */
    @Test
    void saveBizAttr_shouldRefreshUpdateTimeInSameUpdate() {
        when(dataSourceMapper.selectOne(any(LambdaQueryWrapper.class))).thenReturn(targetDs);
        when(dataSourceMapper.update(any(), any(LambdaUpdateWrapper.class))).thenReturn(1);

        BizAttrSaveDTO dto = new BizAttrSaveDTO();
        dto.setBizAttr("{\"x\":\"y\"}");
        service.saveBizAttr("TG001", dto);

        ArgumentCaptor<LambdaUpdateWrapper<DataSource>> captor = ArgumentCaptor.forClass(LambdaUpdateWrapper.class);
        verify(dataSourceMapper).update(eq(null), captor.capture());
        String setSql = captor.getValue().getSqlSet();
        assertTrue(setSql.contains("DATA_SOURCE_BIZ_ATTR"));
        assertTrue(setSql.contains("UPDATE_TIME = SYSDATE"), setSql);
    }

    // ---- 列表排序（DS-REQ-183） ----

    /** 列表默认排序由后端查询生成：两个时间列 DESC NULLS LAST，最后以 DATA_SOURCE_ID ASC 稳定排序。 */
    @Test
    void list_shouldOrderByTimesDescNullsLastThenIdAsc() {
        when(dataSourceMapper.selectList(any(LambdaQueryWrapper.class)))
                .thenReturn(Collections.emptyList());

        service.list(new DataSourceQuery());

        ArgumentCaptor<LambdaQueryWrapper<DataSource>> captor = ArgumentCaptor.forClass(LambdaQueryWrapper.class);
        verify(dataSourceMapper).selectList(captor.capture());
        String sql = captor.getValue().getSqlSegment();

        int updateIdx = sql.indexOf("ORDER BY UPDATE_TIME DESC NULLS LAST");
        int insertIdx = sql.indexOf("INSERT_TIME DESC NULLS LAST");
        int idIdx = sql.indexOf("DATA_SOURCE_ID ASC");
        assertTrue(updateIdx >= 0, sql);
        assertTrue(insertIdx > updateIdx, sql);
        assertTrue(idIdx > insertIdx, sql);
        assertEquals(2, countOccurrences(sql, "NULLS LAST"), sql);
    }

    /** 排序条件不得混入查询过滤：过滤语义与既有行为一致（DS-REQ-183）。 */
    @Test
    void list_sortAddition_shouldKeepFiltersUnchanged() {
        DataSourceQuery query = new DataSourceQuery();
        query.setCategory("TARGET");
        when(dataSourceMapper.selectList(any(LambdaQueryWrapper.class)))
                .thenReturn(Collections.emptyList());

        service.list(query);

        ArgumentCaptor<LambdaQueryWrapper<DataSource>> captor = ArgumentCaptor.forClass(LambdaQueryWrapper.class);
        verify(dataSourceMapper).selectList(captor.capture());
        String where = captor.getValue().getCustomSqlSegment();
        assertTrue(where.contains("UPPER(DATA_SOURCE_CATEGORY) ="));
        assertFalse(where.contains("FG_ACTIVE"));
    }

    private static int countOccurrences(String text, String needle) {
        int count = 0;
        int from = 0;
        while (true) {
            int idx = text.indexOf(needle, from);
            if (idx < 0) {
                return count;
            }
            count++;
            from = idx + needle.length();
        }
    }
}
