package com.bsoft.cdcconfig.datasource.service;

import com.baomidou.mybatisplus.core.MybatisConfiguration;
import com.baomidou.mybatisplus.core.conditions.query.LambdaQueryWrapper;
import com.baomidou.mybatisplus.core.conditions.update.LambdaUpdateWrapper;
import com.baomidou.mybatisplus.core.metadata.TableInfoHelper;
import com.bsoft.cdcconfig.common.exception.BusinessException;
import com.bsoft.cdcconfig.datasource.dto.NamingStrategyDTO;
import com.bsoft.cdcconfig.datasource.entity.DataSource;
import com.bsoft.cdcconfig.datasource.entity.DataSourceExtend;
import com.bsoft.cdcconfig.datasource.exception.DataSourceErrorCode;
import com.bsoft.cdcconfig.datasource.mapper.DataSourceExtendMapper;
import com.bsoft.cdcconfig.datasource.mapper.DataSourceMapper;
import com.bsoft.cdcconfig.datasource.service.impl.DataSourceNamingStrategyServiceImpl;
import com.bsoft.cdcconfig.datasource.vo.NamingStrategyVO;
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
import static org.junit.jupiter.api.Assertions.assertNull;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.junit.jupiter.api.Assertions.assertTrue;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class DataSourceNamingStrategyServiceTest {

    @Mock
    private DataSourceMapper dataSourceMapper;

    @Mock
    private DataSourceExtendMapper extendMapper;

    @InjectMocks
    private DataSourceNamingStrategyServiceImpl service;

    private DataSource sourceDs;
    private DataSource targetDs;

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
        sourceDs.setFgActive("1");

        targetDs = new DataSource();
        targetDs.setDataSourceId("TG001");
        targetDs.setDataSourceName("目标库");
        targetDs.setDataSourceCategory("TARGET");
        targetDs.setDataSourceType("oracle");
        targetDs.setFgActive("1");
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

        List<NamingStrategyVO> vos = service.list("SRC001");

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

        List<NamingStrategyVO> vos = service.list("SRC001");

        assertEquals(1, vos.size());
        assertEquals("MISSING", vos.get(0).getTargetDataSourceId());
        assertNull(vos.get(0).getTargetDataSourceName());
        assertNull(vos.get(0).getTargetDataSourceType());
    }

    @Test
    void listNamingStrategies_sourceNotFound_shouldThrow40400() {
        when(dataSourceMapper.selectOne(any(LambdaQueryWrapper.class))).thenReturn(null);

        BusinessException ex = assertThrows(BusinessException.class,
                () -> service.list("NONEXIST"));
        assertEquals(DataSourceErrorCode.DATA_SOURCE_NOT_FOUND, ex.getCode());
    }

    @Test
    void listNamingStrategies_notSource_shouldThrow40006() {
        when(dataSourceMapper.selectOne(any(LambdaQueryWrapper.class))).thenReturn(targetDs);

        BusinessException ex = assertThrows(BusinessException.class,
                () -> service.list("TG001"));
        assertEquals(DataSourceErrorCode.ROLE_NOT_APPLICABLE, ex.getCode());
    }

    // ---- createNamingStrategy ----

    @Test
    void createNamingStrategy_tableMerge_shouldClearPrefixSuffix() {
        when(dataSourceMapper.selectOne(any(LambdaQueryWrapper.class))).thenReturn(sourceDs, targetDs);
        when(extendMapper.selectCount(any(LambdaQueryWrapper.class))).thenReturn(0L);
        when(extendMapper.insert(any(DataSourceExtend.class))).thenReturn(1);

        service.create("SRC001", buildStrategyDTO("TG001", "TABLE_MERGE", "p_", "_s"));

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

        service.create("SRC001", buildStrategyDTO("TG001", "CUSTOM_PREFIX_SUFFIX", "p_", "_s"));

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
                () -> service.create("SRC001", buildStrategyDTO("TG001", "TABLE_MERGE", "", "")));
        assertEquals(DataSourceErrorCode.NAMING_STRATEGY_DUPLICATE, ex.getCode());
    }

    @Test
    void createNamingStrategy_multiConflict_shouldThrow40903() {
        when(dataSourceMapper.selectOne(any(LambdaQueryWrapper.class))).thenReturn(sourceDs, targetDs);
        when(extendMapper.selectCount(any(LambdaQueryWrapper.class))).thenReturn(2L);

        BusinessException ex = assertThrows(BusinessException.class,
                () -> service.create("SRC001", buildStrategyDTO("TG001", "TABLE_MERGE", "", "")));
        assertEquals(DataSourceErrorCode.NAMING_STRATEGY_MULTI_CONFLICT, ex.getCode());
    }

    @Test
    void createNamingStrategy_invalidTarget_shouldThrow40005() {
        when(dataSourceMapper.selectOne(any(LambdaQueryWrapper.class))).thenReturn(sourceDs, null);

        BusinessException ex = assertThrows(BusinessException.class,
                () -> service.create("SRC001", buildStrategyDTO("BAD", "TABLE_MERGE", "", "")));
        assertEquals(DataSourceErrorCode.INVALID_TARGET_DATA_SOURCE, ex.getCode());
    }

    @Test
    void createNamingStrategy_customWithoutPrefix_shouldThrow40003() {
        when(dataSourceMapper.selectOne(any(LambdaQueryWrapper.class))).thenReturn(sourceDs, targetDs);

        BusinessException ex = assertThrows(BusinessException.class,
                () -> service.create("SRC001",
                        buildStrategyDTO("TG001", "CUSTOM_PREFIX_SUFFIX", null, "_s")));
        assertEquals(DataSourceErrorCode.INVALID_NAMING_STRATEGY, ex.getCode());
        assertEquals("自定义命名策略必须填写前缀和后缀", ex.getMessage());
    }

    @Test
    void createNamingStrategy_invalidStrategy_shouldThrow40003() {
        when(dataSourceMapper.selectOne(any(LambdaQueryWrapper.class))).thenReturn(sourceDs, targetDs);

        BusinessException ex = assertThrows(BusinessException.class,
                () -> service.create("SRC001", buildStrategyDTO("TG001", "BAD", "", "")));
        assertEquals(DataSourceErrorCode.INVALID_NAMING_STRATEGY, ex.getCode());
    }

    @Test
    void createNamingStrategy_sourceNotFound_shouldThrow40400() {
        when(dataSourceMapper.selectOne(any(LambdaQueryWrapper.class))).thenReturn(null);

        BusinessException ex = assertThrows(BusinessException.class,
                () -> service.create("NONEXIST", buildStrategyDTO("TG001", "TABLE_MERGE", "", "")));
        assertEquals(DataSourceErrorCode.DATA_SOURCE_NOT_FOUND, ex.getCode());
    }

    @Test
    void createNamingStrategy_insertFailed_shouldThrow50000() {
        when(dataSourceMapper.selectOne(any(LambdaQueryWrapper.class))).thenReturn(sourceDs, targetDs);
        when(extendMapper.selectCount(any(LambdaQueryWrapper.class))).thenReturn(0L);
        when(extendMapper.insert(any(DataSourceExtend.class))).thenReturn(0);

        BusinessException ex = assertThrows(BusinessException.class,
                () -> service.create("SRC001", buildStrategyDTO("TG001", "TABLE_MERGE", "", "")));
        assertEquals(DataSourceErrorCode.SAVE_FAILED, ex.getCode());
    }

    // ---- updateNamingStrategy ----

    @Test
    void updateNamingStrategy_sameTarget_shouldSucceed() {
        when(dataSourceMapper.selectOne(any(LambdaQueryWrapper.class))).thenReturn(sourceDs, targetDs);
        when(extendMapper.selectCount(any(LambdaQueryWrapper.class))).thenReturn(1L);
        when(extendMapper.update(any(), any(LambdaUpdateWrapper.class))).thenReturn(1);

        service.update("SRC001", "TG001",
                buildStrategyDTO("TG001", "TABLE_MERGE", "", ""));

        verify(extendMapper).update(any(), any(LambdaUpdateWrapper.class));
    }

    @Test
    void updateNamingStrategy_changeTarget_shouldSucceed() {
        when(dataSourceMapper.selectOne(any(LambdaQueryWrapper.class))).thenReturn(sourceDs, targetDs);
        when(extendMapper.selectCount(any(LambdaQueryWrapper.class))).thenReturn(1L, 0L);
        when(extendMapper.update(any(), any(LambdaUpdateWrapper.class))).thenReturn(1);

        service.update("SRC001", "TG001",
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
                () -> service.update("SRC001", "TG001",
                        buildStrategyDTO("TG001", "TABLE_MERGE", "", "")));
        assertEquals(DataSourceErrorCode.NAMING_STRATEGY_NOT_FOUND, ex.getCode());
    }

    @Test
    void updateNamingStrategy_originalMulti_shouldThrow40903() {
        when(dataSourceMapper.selectOne(any(LambdaQueryWrapper.class))).thenReturn(sourceDs, targetDs);
        when(extendMapper.selectCount(any(LambdaQueryWrapper.class))).thenReturn(2L);

        BusinessException ex = assertThrows(BusinessException.class,
                () -> service.update("SRC001", "TG001",
                        buildStrategyDTO("TG001", "TABLE_MERGE", "", "")));
        assertEquals(DataSourceErrorCode.NAMING_STRATEGY_MULTI_CONFLICT, ex.getCode());
    }

    @Test
    void updateNamingStrategy_newKeyDuplicate_shouldThrow40902() {
        when(dataSourceMapper.selectOne(any(LambdaQueryWrapper.class))).thenReturn(sourceDs, targetDs);
        when(extendMapper.selectCount(any(LambdaQueryWrapper.class))).thenReturn(1L, 1L);

        BusinessException ex = assertThrows(BusinessException.class,
                () -> service.update("SRC001", "TG001",
                        buildStrategyDTO("TG002", "TABLE_MERGE", "", "")));
        assertEquals(DataSourceErrorCode.NAMING_STRATEGY_DUPLICATE, ex.getCode());
    }

    @Test
    void updateNamingStrategy_newKeyMulti_shouldThrow40903() {
        when(dataSourceMapper.selectOne(any(LambdaQueryWrapper.class))).thenReturn(sourceDs, targetDs);
        when(extendMapper.selectCount(any(LambdaQueryWrapper.class))).thenReturn(1L, 2L);

        BusinessException ex = assertThrows(BusinessException.class,
                () -> service.update("SRC001", "TG001",
                        buildStrategyDTO("TG002", "TABLE_MERGE", "", "")));
        assertEquals(DataSourceErrorCode.NAMING_STRATEGY_MULTI_CONFLICT, ex.getCode());
    }

    @Test
    void updateNamingStrategy_invalidStrategy_shouldThrow40003() {
        when(dataSourceMapper.selectOne(any(LambdaQueryWrapper.class))).thenReturn(sourceDs, targetDs);

        BusinessException ex = assertThrows(BusinessException.class,
                () -> service.update("SRC001", "TG001",
                        buildStrategyDTO("TG001", "BAD", "", "")));
        assertEquals(DataSourceErrorCode.INVALID_NAMING_STRATEGY, ex.getCode());
    }

    @Test
    void updateNamingStrategy_updateFailed_shouldThrow50000() {
        when(dataSourceMapper.selectOne(any(LambdaQueryWrapper.class))).thenReturn(sourceDs, targetDs);
        when(extendMapper.selectCount(any(LambdaQueryWrapper.class))).thenReturn(1L);
        when(extendMapper.update(any(), any(LambdaUpdateWrapper.class))).thenReturn(0);

        BusinessException ex = assertThrows(BusinessException.class,
                () -> service.update("SRC001", "TG001",
                        buildStrategyDTO("TG001", "TABLE_MERGE", "", "")));
        assertEquals(DataSourceErrorCode.SAVE_FAILED, ex.getCode());
    }

    // ---- deleteNamingStrategy ----

    @Test
    void deleteNamingStrategy_shouldSucceed() {
        when(dataSourceMapper.selectOne(any(LambdaQueryWrapper.class))).thenReturn(sourceDs);
        when(extendMapper.selectCount(any(LambdaQueryWrapper.class))).thenReturn(1L);
        when(extendMapper.delete(any(LambdaQueryWrapper.class))).thenReturn(1);

        service.delete("SRC001", "TG001");

        verify(extendMapper).delete(any(LambdaQueryWrapper.class));
    }

    @Test
    void deleteNamingStrategy_notFound_shouldThrow40401() {
        when(dataSourceMapper.selectOne(any(LambdaQueryWrapper.class))).thenReturn(sourceDs);
        when(extendMapper.selectCount(any(LambdaQueryWrapper.class))).thenReturn(0L);

        BusinessException ex = assertThrows(BusinessException.class,
                () -> service.delete("SRC001", "TG001"));
        assertEquals(DataSourceErrorCode.NAMING_STRATEGY_NOT_FOUND, ex.getCode());
    }

    @Test
    void deleteNamingStrategy_multi_shouldThrow40903() {
        when(dataSourceMapper.selectOne(any(LambdaQueryWrapper.class))).thenReturn(sourceDs);
        when(extendMapper.selectCount(any(LambdaQueryWrapper.class))).thenReturn(2L);

        BusinessException ex = assertThrows(BusinessException.class,
                () -> service.delete("SRC001", "TG001"));
        assertEquals(DataSourceErrorCode.NAMING_STRATEGY_MULTI_CONFLICT, ex.getCode());
    }

    @Test
    void deleteNamingStrategy_deleteFailed_shouldThrow50001() {
        when(dataSourceMapper.selectOne(any(LambdaQueryWrapper.class))).thenReturn(sourceDs);
        when(extendMapper.selectCount(any(LambdaQueryWrapper.class))).thenReturn(1L);
        when(extendMapper.delete(any(LambdaQueryWrapper.class))).thenReturn(0);

        BusinessException ex = assertThrows(BusinessException.class,
                () -> service.delete("SRC001", "TG001"));
        assertEquals(DataSourceErrorCode.DELETE_FAILED, ex.getCode());
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
