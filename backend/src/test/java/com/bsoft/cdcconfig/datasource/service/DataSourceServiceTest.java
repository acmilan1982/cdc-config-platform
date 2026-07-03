package com.bsoft.cdcconfig.datasource.service;

import com.baomidou.mybatisplus.core.conditions.query.LambdaQueryWrapper;
import com.baomidou.mybatisplus.core.conditions.update.LambdaUpdateWrapper;
import com.baomidou.mybatisplus.extension.plugins.pagination.Page;
import com.bsoft.cdcconfig.common.exception.BusinessException;
import com.bsoft.cdcconfig.common.page.PageResult;
import com.bsoft.cdcconfig.datasource.dto.DataSourceCreateDTO;
import com.bsoft.cdcconfig.datasource.dto.DataSourceExtendDTO;
import com.bsoft.cdcconfig.datasource.dto.DataSourceUpdateDTO;
import com.bsoft.cdcconfig.datasource.entity.DataSource;
import com.bsoft.cdcconfig.datasource.entity.DataSourceExtend;
import com.bsoft.cdcconfig.datasource.exception.DataSourceErrorCode;
import com.bsoft.cdcconfig.datasource.mapper.DataSourceExtendMapper;
import com.bsoft.cdcconfig.datasource.mapper.DataSourceMapper;
import com.bsoft.cdcconfig.datasource.query.DataSourceQuery;
import com.bsoft.cdcconfig.datasource.service.impl.DataSourceServiceImpl;
import com.bsoft.cdcconfig.datasource.vo.DataSourceDetailVO;
import com.bsoft.cdcconfig.datasource.vo.DataSourceListVO;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertNotNull;
import static org.junit.jupiter.api.Assertions.assertNull;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.junit.jupiter.api.Assertions.assertTrue;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class DataSourceServiceTest {

    @Mock
    private DataSourceMapper dataSourceMapper;

    @Mock
    private DataSourceExtendMapper extendMapper;

    @InjectMocks
    private DataSourceServiceImpl service;

    private DataSource ds;
    private DataSourceExtend extend;
    private DataSourceCreateDTO createDTO;
    private DataSourceUpdateDTO updateDTO;
    private DataSourceExtendDTO extendDTO;

    @BeforeEach
    void setUp() {
        ds = new DataSource();
        ds.setDataSourceId("DS001");
        ds.setDataSourceName("测试数据源");
        ds.setDataSourceCategory("SOURCE");
        ds.setDataSourceType("ORACLE");
        ds.setDataSourceOrg("测试机构");
        ds.setDataSourceHost("192.168.1.1");
        ds.setDataSourcePort("1521");
        ds.setDataSourceUserName("testuser");
        ds.setDataSourcePassword("encrypted_pass");
        ds.setDataSourceServiceName("testdb");
        ds.setFgActive("1");

        extend = new DataSourceExtend();
        extend.setDataSourceId("DS001");
        extend.setTableNamingStrategy("TABLE_MERGE");
        extend.setTableNamePrefix("");
        extend.setTableNameSuffix("");

        extendDTO = new DataSourceExtendDTO();
        extendDTO.setTableNamingStrategy("TABLE_MERGE");
        extendDTO.setTableNamePrefix("");
        extendDTO.setTableNameSuffix("");

        createDTO = new DataSourceCreateDTO();
        createDTO.setDataSourceId("DS001");
        createDTO.setDataSourceName("测试数据源");
        createDTO.setDataSourceCategory("source");
        createDTO.setDataSourceType("oracle");
        createDTO.setDataSourceOrg("测试机构");
        createDTO.setDataSourceHost("192.168.1.1");
        createDTO.setDataSourcePort("1521");
        createDTO.setDataSourceUserName("testuser");
        createDTO.setDataSourcePassword("testpass");
        createDTO.setDataSourceServiceName("testdb");
        createDTO.setExtend(extendDTO);

        updateDTO = new DataSourceUpdateDTO();
        updateDTO.setDataSourceId("DS001");
        updateDTO.setDataSourceName("测试数据源");
        updateDTO.setDataSourceCategory("source");
        updateDTO.setDataSourceType("oracle");
        updateDTO.setDataSourceOrg("测试机构");
        updateDTO.setDataSourceHost("192.168.1.1");
        updateDTO.setDataSourcePort("1521");
        updateDTO.setDataSourceUserName("testuser");
        updateDTO.setDataSourceServiceName("testdb");
        updateDTO.setExtend(extendDTO);
    }

    // ---- queryPage ----
    @Test
    void queryPage_shouldReturnPaginatedList() {
        DataSourceQuery query = new DataSourceQuery();
        query.setPageNum(1);
        query.setPageSize(20);

        Page<DataSource> page = new Page<>(1, 20, 1);
        page.setRecords(java.util.Collections.singletonList(ds));
        when(dataSourceMapper.selectPage(any(Page.class), any(LambdaQueryWrapper.class)))
                .thenReturn(page);
        when(extendMapper.selectList(any(LambdaQueryWrapper.class)))
                .thenReturn(java.util.Collections.singletonList(extend));

        PageResult<DataSourceListVO> result = service.queryPage(query);

        assertNotNull(result);
        assertEquals(1, result.getTotal());
    }

    // ---- getDetail ----
    @Test
    void getDetail_shouldReturnDetailWithExtend() {
        when(dataSourceMapper.selectById("DS001")).thenReturn(ds);
        when(extendMapper.selectList(any(LambdaQueryWrapper.class))).thenReturn(java.util.Collections.singletonList(extend));

        DataSourceDetailVO vo = service.getDetail("DS001");

        assertNotNull(vo);
        assertTrue(vo.getExtendExists());
        assertNotNull(vo.getExtend());
        assertEquals("DS001", vo.getDataSourceId());
    }

    @Test
    void getDetail_withoutExtend_shouldReturnDetailWithoutExtend() {
        when(dataSourceMapper.selectById("DS002")).thenReturn(ds);
        when(extendMapper.selectList(any(LambdaQueryWrapper.class))).thenReturn(java.util.Collections.emptyList());

        DataSourceDetailVO vo = service.getDetail("DS002");

        assertNotNull(vo);
        assertFalse(vo.getExtendExists());
        assertNull(vo.getExtend());
    }

    @Test
    void getDetail_notFound_shouldThrowException() {
        when(dataSourceMapper.selectById("NONEXIST")).thenReturn(null);

        BusinessException ex = assertThrows(BusinessException.class,
                () -> service.getDetail("NONEXIST"));
        assertEquals(DataSourceErrorCode.DATA_SOURCE_NOT_FOUND, ex.getCode());
    }

    // ---- create ----
    @Test
    void create_shouldSucceed() {
        when(dataSourceMapper.selectById("DS001")).thenReturn(null);
        when(dataSourceMapper.selectOne(any(LambdaQueryWrapper.class))).thenReturn(null);
        when(dataSourceMapper.insert(any(DataSource.class))).thenReturn(1);
        when(extendMapper.insert(any(DataSourceExtend.class))).thenReturn(1);

        service.create(createDTO);

        ArgumentCaptor<DataSource> dsCaptor = ArgumentCaptor.forClass(DataSource.class);
        verify(dataSourceMapper).insert(dsCaptor.capture());
        DataSource inserted = dsCaptor.getValue();
        assertEquals("DS001", inserted.getDataSourceId());
        assertEquals("SOURCE", inserted.getDataSourceCategory());
        assertEquals("ORACLE", inserted.getDataSourceType());
        assertEquals("1", inserted.getFgActive());

        verify(extendMapper).insert(any(DataSourceExtend.class));
    }

    @Test
    void create_duplicateId_shouldThrowException() {
        when(dataSourceMapper.selectById("DS001")).thenReturn(ds);

        BusinessException ex = assertThrows(BusinessException.class,
                () -> service.create(createDTO));
        assertEquals(DataSourceErrorCode.DATA_SOURCE_ID_DUPLICATE, ex.getCode());
    }

    @Test
    void create_duplicateName_shouldThrowException() {
        when(dataSourceMapper.selectById("DS001")).thenReturn(null);
        when(dataSourceMapper.selectOne(any(LambdaQueryWrapper.class))).thenReturn(ds);

        BusinessException ex = assertThrows(BusinessException.class,
                () -> service.create(createDTO));
        assertEquals(DataSourceErrorCode.DATA_SOURCE_NAME_DUPLICATE, ex.getCode());
    }

    @Test
    void create_missingExtend_shouldThrowException() {
        createDTO.setExtend(null);

        BusinessException ex = assertThrows(BusinessException.class,
                () -> service.create(createDTO));
        assertEquals(DataSourceErrorCode.EXTEND_REQUIRED, ex.getCode());
    }

    @Test
    void create_invalidCategory_shouldThrowException() {
        when(dataSourceMapper.selectById("DS001")).thenReturn(null);
        when(dataSourceMapper.selectOne(any(LambdaQueryWrapper.class))).thenReturn(null);
        createDTO.setDataSourceCategory("INVALID");

        BusinessException ex = assertThrows(BusinessException.class,
                () -> service.create(createDTO));
        assertEquals(DataSourceErrorCode.INVALID_CATEGORY, ex.getCode());
    }

    @Test
    void create_invalidType_shouldThrowException() {
        when(dataSourceMapper.selectById("DS001")).thenReturn(null);
        when(dataSourceMapper.selectOne(any(LambdaQueryWrapper.class))).thenReturn(null);
        createDTO.setDataSourceType("POSTGRES");

        BusinessException ex = assertThrows(BusinessException.class,
                () -> service.create(createDTO));
        assertEquals(DataSourceErrorCode.INVALID_TYPE, ex.getCode());
    }

    // ---- update ----
    @Test
    void update_shouldSucceed() {
        when(dataSourceMapper.selectById("DS001")).thenReturn(ds);
        when(dataSourceMapper.selectOne(any(LambdaQueryWrapper.class))).thenReturn(null);
        when(dataSourceMapper.update(any(), any(LambdaUpdateWrapper.class))).thenReturn(1);
        when(extendMapper.selectList(any(LambdaQueryWrapper.class))).thenReturn(java.util.Collections.singletonList(extend));
        when(extendMapper.update(any(), any(LambdaUpdateWrapper.class))).thenReturn(1);

        service.update("DS001", updateDTO);

        verify(dataSourceMapper).update(any(DataSource.class), any(LambdaUpdateWrapper.class));
        verify(extendMapper).update(any(DataSourceExtend.class), any(LambdaUpdateWrapper.class));
    }

    @Test
    void update_changeId_shouldSucceed() {
        updateDTO.setDataSourceId("DS002");
        when(dataSourceMapper.selectById("DS001")).thenReturn(ds);
        when(dataSourceMapper.selectById("DS002")).thenReturn(null);
        when(dataSourceMapper.selectOne(any(LambdaQueryWrapper.class))).thenReturn(null);
        when(dataSourceMapper.update(any(), any(LambdaUpdateWrapper.class))).thenReturn(1);
        when(extendMapper.selectList(any(LambdaQueryWrapper.class))).thenReturn(java.util.Collections.singletonList(extend));
        when(extendMapper.update(any(), any(LambdaUpdateWrapper.class))).thenReturn(1);

        service.update("DS001", updateDTO);

        verify(dataSourceMapper).update(any(DataSource.class), any(LambdaUpdateWrapper.class));
        ArgumentCaptor<DataSourceExtend> extCaptor = ArgumentCaptor.forClass(DataSourceExtend.class);
        verify(extendMapper).update(extCaptor.capture(), any(LambdaUpdateWrapper.class));
        assertEquals("DS002", extCaptor.getValue().getDataSourceId());
    }

    @Test
    void update_changeToExistingId_shouldThrowException() {
        updateDTO.setDataSourceId("DS002");
        when(dataSourceMapper.selectById("DS001")).thenReturn(ds);
        DataSource existing = new DataSource();
        existing.setDataSourceId("DS002");
        when(dataSourceMapper.selectById("DS002")).thenReturn(existing);

        BusinessException ex = assertThrows(BusinessException.class,
                () -> service.update("DS001", updateDTO));
        assertEquals(DataSourceErrorCode.DATA_SOURCE_ID_DUPLICATE, ex.getCode());
    }

    @Test
    void update_passwordEmpty_shouldNotUpdatePassword() {
        updateDTO.setDataSourcePassword(null);
        when(dataSourceMapper.selectById("DS001")).thenReturn(ds);
        when(dataSourceMapper.selectOne(any(LambdaQueryWrapper.class))).thenReturn(null);
        when(dataSourceMapper.update(any(), any(LambdaUpdateWrapper.class))).thenReturn(1);
        when(extendMapper.selectList(any(LambdaQueryWrapper.class))).thenReturn(java.util.Collections.singletonList(extend));
        when(extendMapper.update(any(), any(LambdaUpdateWrapper.class))).thenReturn(1);

        service.update("DS001", updateDTO);

        ArgumentCaptor<DataSource> dsCaptor = ArgumentCaptor.forClass(DataSource.class);
        verify(dataSourceMapper).update(dsCaptor.capture(), any(LambdaUpdateWrapper.class));
        assertEquals("encrypted_pass", dsCaptor.getValue().getDataSourcePassword());
    }

    @Test
    void update_passwordProvided_shouldUpdatePassword() {
        updateDTO.setDataSourcePassword("newpass");
        when(dataSourceMapper.selectById("DS001")).thenReturn(ds);
        when(dataSourceMapper.selectOne(any(LambdaQueryWrapper.class))).thenReturn(null);
        when(dataSourceMapper.update(any(), any(LambdaUpdateWrapper.class))).thenReturn(1);
        when(extendMapper.selectList(any(LambdaQueryWrapper.class))).thenReturn(java.util.Collections.singletonList(extend));
        when(extendMapper.update(any(), any(LambdaUpdateWrapper.class))).thenReturn(1);

        service.update("DS001", updateDTO);

        ArgumentCaptor<DataSource> dsCaptor = ArgumentCaptor.forClass(DataSource.class);
        verify(dataSourceMapper).update(dsCaptor.capture(), any(LambdaUpdateWrapper.class));
        assertEquals("newpass", dsCaptor.getValue().getDataSourcePassword());
    }

    @Test
    void update_notFound_shouldThrowException() {
        when(dataSourceMapper.selectById("NONEXIST")).thenReturn(null);

        BusinessException ex = assertThrows(BusinessException.class,
                () -> service.update("NONEXIST", updateDTO));
        assertEquals(DataSourceErrorCode.DATA_SOURCE_NOT_FOUND, ex.getCode());
    }

    @Test
    void update_nameDuplicate_shouldThrowException() {
        updateDTO.setDataSourceName("重复名称");
        when(dataSourceMapper.selectById("DS001")).thenReturn(ds);
        DataSource other = new DataSource();
        other.setDataSourceId("DS999");
        other.setDataSourceName("重复名称");
        when(dataSourceMapper.selectOne(any(LambdaQueryWrapper.class))).thenReturn(other);

        BusinessException ex = assertThrows(BusinessException.class,
                () -> service.update("DS001", updateDTO));
        assertEquals(DataSourceErrorCode.DATA_SOURCE_NAME_DUPLICATE, ex.getCode());
    }

    // ---- delete ----
    @Test
    void delete_shouldDeleteExtendThenMain() {
        when(dataSourceMapper.selectById("DS001")).thenReturn(ds);
        when(extendMapper.delete(any(LambdaQueryWrapper.class))).thenReturn(1);
        when(dataSourceMapper.deleteById("DS001")).thenReturn(1);

        service.delete("DS001");

        verify(extendMapper).delete(any(LambdaQueryWrapper.class));
        verify(dataSourceMapper).deleteById("DS001");
    }

    @Test
    void delete_notFound_shouldThrowException() {
        when(dataSourceMapper.selectById("NONEXIST")).thenReturn(null);

        BusinessException ex = assertThrows(BusinessException.class,
                () -> service.delete("NONEXIST"));
        assertEquals(DataSourceErrorCode.DATA_SOURCE_NOT_FOUND, ex.getCode());
    }

    // ---- enable / disable ----
    @Test
    void enable_shouldSetFgActiveTo1() {
        when(dataSourceMapper.selectById("DS001")).thenReturn(ds);
        when(dataSourceMapper.update(any(), any(LambdaUpdateWrapper.class))).thenReturn(1);

        service.enable("DS001");

        verify(dataSourceMapper).update(eq(null), any(LambdaUpdateWrapper.class));
    }

    @Test
    void enable_notFound_shouldThrowException() {
        when(dataSourceMapper.selectById("NONEXIST")).thenReturn(null);

        BusinessException ex = assertThrows(BusinessException.class,
                () -> service.enable("NONEXIST"));
        assertEquals(DataSourceErrorCode.DATA_SOURCE_NOT_FOUND, ex.getCode());
    }

    @Test
    void disable_shouldSetFgActiveTo0() {
        when(dataSourceMapper.selectById("DS001")).thenReturn(ds);
        when(dataSourceMapper.update(any(), any(LambdaUpdateWrapper.class))).thenReturn(1);

        service.disable("DS001");

        verify(dataSourceMapper).update(eq(null), any(LambdaUpdateWrapper.class));
    }

    @Test
    void disable_notFound_shouldThrowException() {
        when(dataSourceMapper.selectById("NONEXIST")).thenReturn(null);

        BusinessException ex = assertThrows(BusinessException.class,
                () -> service.disable("NONEXIST"));
        assertEquals(DataSourceErrorCode.DATA_SOURCE_NOT_FOUND, ex.getCode());
    }
}
