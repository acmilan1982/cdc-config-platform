package com.bsoft.cdcconfig.serverconfig.service;

import com.baomidou.mybatisplus.core.MybatisConfiguration;
import com.baomidou.mybatisplus.core.conditions.AbstractWrapper;
import com.baomidou.mybatisplus.core.conditions.SharedString;
import com.baomidou.mybatisplus.core.conditions.query.LambdaQueryWrapper;
import com.baomidou.mybatisplus.core.conditions.update.LambdaUpdateWrapper;
import com.baomidou.mybatisplus.core.metadata.TableInfoHelper;
import com.baomidou.mybatisplus.core.toolkit.GlobalConfigUtils;
import com.bsoft.cdcconfig.common.exception.BusinessException;
import com.bsoft.cdcconfig.serverconfig.dto.ServerConfigSaveItem;
import com.bsoft.cdcconfig.serverconfig.dto.ServerConfigSaveRequest;
import com.bsoft.cdcconfig.serverconfig.entity.CdcServer;
import com.bsoft.cdcconfig.serverconfig.entity.CdcServerConfig;
import com.bsoft.cdcconfig.serverconfig.exception.ServerConfigErrorCode;
import com.bsoft.cdcconfig.serverconfig.mapper.CdcServerConfigMapper;
import com.bsoft.cdcconfig.serverconfig.mapper.CdcServerMapper;
import com.bsoft.cdcconfig.serverconfig.service.impl.ServerConfigServiceImpl;
import com.bsoft.cdcconfig.serverconfig.vo.ServerConfigPageVO;
import org.apache.ibatis.builder.MapperBuilderAssistant;
import org.junit.jupiter.api.BeforeAll;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.mockito.junit.jupiter.MockitoSettings;
import org.mockito.quality.Strictness;
import org.springframework.transaction.annotation.Transactional;

import java.lang.reflect.Field;
import java.lang.reflect.Method;
import java.util.Arrays;
import java.util.Collections;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertNotNull;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.junit.jupiter.api.Assertions.assertTrue;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

/**
 * 中心端配置服务实现测试（SC-DESIGN-022）：唯一中心端识别、稳定排序、编辑资格双重判定、
 * 保存逐条重查校验、值规范化落库、整批回滚与 50030 兜底。
 */
@ExtendWith(MockitoExtension.class)
@MockitoSettings(strictness = Strictness.LENIENT)
class ServerConfigServiceImplTest {

    @Mock
    private CdcServerMapper cdcServerMapper;

    @Mock
    private CdcServerConfigMapper cdcServerConfigMapper;

    @InjectMocks
    private ServerConfigServiceImpl service;

    @BeforeAll
    static void initMybatisPlusLambdaCache() {
        // 预置 MyBatis-Plus TableInfo/lambda 缓存，使 LambdaQueryWrapper/LambdaUpdateWrapper
        // 能在无 Spring 上下文时解析实体列名。
        MybatisConfiguration configuration = new MybatisConfiguration();
        GlobalConfigUtils.setGlobalConfig(configuration, GlobalConfigUtils.defaults());
        TableInfoHelper.initTableInfo(new MapperBuilderAssistant(configuration, ""), CdcServer.class);
        TableInfoHelper.initTableInfo(new MapperBuilderAssistant(configuration, ""), CdcServerConfig.class);
    }

    private CdcServer server(String id) {
        CdcServer s = new CdcServer();
        s.setServerId(id);
        return s;
    }

    private CdcServerConfig config(String id, String serverId, String key, String value, String editable) {
        CdcServerConfig c = new CdcServerConfig();
        c.setIdServerConfig(id);
        c.setServerId(serverId);
        c.setConfigKey(key);
        c.setConfigValue(value);
        c.setIsEditable(editable);
        return c;
    }

    private ServerConfigSaveItem item(String id, String value) {
        return new ServerConfigSaveItem(id, value);
    }

    private ServerConfigSaveRequest request(ServerConfigSaveItem... items) {
        return new ServerConfigSaveRequest(Arrays.asList(items));
    }

    // ---- getPage：唯一中心端识别（SC-DB-030） ----

    @Test
    void getPage_noServer_shouldThrowServerNotRegistered() {
        when(cdcServerMapper.selectList(any(LambdaQueryWrapper.class))).thenReturn(Collections.emptyList());

        BusinessException ex = assertThrows(BusinessException.class, service::getPage);

        assertEquals(ServerConfigErrorCode.SERVER_NOT_REGISTERED, ex.getCode());
    }

    @Test
    void getPage_multipleServers_shouldThrowServerMultipleFound() {
        when(cdcServerMapper.selectList(any(LambdaQueryWrapper.class)))
                .thenReturn(Arrays.asList(server("S1"), server("S2")));

        BusinessException ex = assertThrows(BusinessException.class, service::getPage);

        assertEquals(ServerConfigErrorCode.SERVER_MULTIPLE_FOUND, ex.getCode());
    }

    @Test
    void getPage_emptyConfigs_shouldReturnEmptyPage() {
        when(cdcServerMapper.selectList(any(LambdaQueryWrapper.class)))
                .thenReturn(Collections.singletonList(server("S1")));
        when(cdcServerConfigMapper.selectList(any(LambdaQueryWrapper.class))).thenReturn(Collections.emptyList());

        ServerConfigPageVO vo = service.getPage();

        assertEquals("S1", vo.getServerId());
        assertEquals(0, vo.getConfigCount());
        assertTrue(vo.getItems().isEmpty());
    }

    @Test
    void getPage_withConfigs_shouldReturnItemsAndOrderByIdServerConfigAsc() {
        CdcServerConfig c1 = config("C1", "S1", "snapshotBatchSize", "1000", "1");
        CdcServerConfig c2 = config("C2", "S1", "auto-create-table", "true", "1");
        when(cdcServerMapper.selectList(any(LambdaQueryWrapper.class)))
                .thenReturn(Collections.singletonList(server("S1")));
        when(cdcServerConfigMapper.selectList(any(LambdaQueryWrapper.class)))
                .thenReturn(Arrays.asList(c1, c2));

        ServerConfigPageVO vo = service.getPage();

        assertEquals("S1", vo.getServerId());
        assertEquals(2, vo.getConfigCount());
        // 返回列表顺序与 Mapper 返回顺序一致，证明 Service 不做二次内存排序
        assertEquals("C1", vo.getItems().get(0).getIdServerConfig());
        assertEquals("C2", vo.getItems().get(1).getIdServerConfig());

        ArgumentCaptor<LambdaQueryWrapper<CdcServerConfig>> wrapperCaptor =
                ArgumentCaptor.forClass(LambdaQueryWrapper.class);
        verify(cdcServerConfigMapper).selectList(wrapperCaptor.capture());
        LambdaQueryWrapper<CdcServerConfig> queryWrapper = wrapperCaptor.getValue();
        String lastSql = readLastSql(queryWrapper);
        assertTrue(lastSql.contains("ORDER BY ID_SERVER_CONFIG ASC"));
        assertFalse(lastSql.contains("CONFIG_KEY ASC NULLS LAST"));
        assertFalse(lastSql.contains("CONFIG_KEY"));
        assertTrue(queryWrapper.getSqlSegment().contains("SERVER_ID"));
        assertTrue(queryWrapper.getParamNameValuePairs().containsValue("S1"));
    }

    // ---- getPage：编辑资格双重判定（SC-EDIT-01） ----

    @Test
    void getPage_editableRequiresFlagOneAndKeyInWhitelist() {
        CdcServerConfig editable = config("C1", "S1", "auto-create-table", "true", "1");
        CdcServerConfig flagZero = config("C2", "S1", "auto-create-table", "true", "0");
        CdcServerConfig keyNotSupported = config("C3", "S1", "monitor-metric-topic-name", "x", "1");
        CdcServerConfig flagNull = config("C4", "S1", "auto-create-table", "true", null);
        when(cdcServerMapper.selectList(any(LambdaQueryWrapper.class)))
                .thenReturn(Collections.singletonList(server("S1")));
        when(cdcServerConfigMapper.selectList(any(LambdaQueryWrapper.class)))
                .thenReturn(Arrays.asList(editable, flagZero, keyNotSupported, flagNull));

        ServerConfigPageVO vo = service.getPage();

        assertTrue(vo.getItems().get(0).isEditable());
        assertFalse(vo.getItems().get(1).isEditable());
        assertFalse(vo.getItems().get(2).isEditable());
        assertFalse(vo.getItems().get(3).isEditable());
    }

    // ---- save：逐条重查、校验、规范化更新（SC-DESIGN-022） ----

    @Test
    void save_success_normalizesValueAndUpdatesRow() {
        when(cdcServerMapper.selectList(any(LambdaQueryWrapper.class)))
                .thenReturn(Collections.singletonList(server("S1")));
        CdcServerConfig record = config("C1", "S1", "realtime-insert-batch-enabled-database-types", "doris", "1");
        when(cdcServerConfigMapper.selectById("C1")).thenReturn(record);
        when(cdcServerConfigMapper.update(any(), any(LambdaUpdateWrapper.class))).thenReturn(1);

        service.save(request(item("C1", "MYSQL ,doris")));

        ArgumentCaptor<LambdaUpdateWrapper<CdcServerConfig>> updateCaptor =
                ArgumentCaptor.forClass(LambdaUpdateWrapper.class);
        verify(cdcServerConfigMapper).update(eq(null), updateCaptor.capture());
        LambdaUpdateWrapper<CdcServerConfig> updateWrapper = updateCaptor.getValue();
        // 落库值为规范化后的固定顺序小写结果，而非原样提交值（SC-CFG-DBTYPE-08/09）
        assertTrue(updateWrapper.getParamNameValuePairs().containsValue("doris,mysql"));
        assertFalse(updateWrapper.getParamNameValuePairs().containsValue("MYSQL ,doris"));
    }

    @Test
    void save_recordNotFound_shouldThrowConfigRecordNotFound() {
        when(cdcServerMapper.selectList(any(LambdaQueryWrapper.class)))
                .thenReturn(Collections.singletonList(server("S1")));
        when(cdcServerConfigMapper.selectById("C1")).thenReturn(null);

        BusinessException ex = assertThrows(BusinessException.class,
                () -> service.save(request(item("C1", "true"))));

        assertEquals(ServerConfigErrorCode.CONFIG_RECORD_NOT_FOUND, ex.getCode());
    }

    @Test
    void save_wrongServerOwner_shouldThrowServerBelongingMismatch() {
        when(cdcServerMapper.selectList(any(LambdaQueryWrapper.class)))
                .thenReturn(Collections.singletonList(server("S1")));
        when(cdcServerConfigMapper.selectById("C1"))
                .thenReturn(config("C1", "S2", "auto-create-table", "true", "1"));

        BusinessException ex = assertThrows(BusinessException.class,
                () -> service.save(request(item("C1", "true"))));

        assertEquals(ServerConfigErrorCode.SERVER_BELONGING_MISMATCH, ex.getCode());
    }

    @Test
    void save_notEditable_shouldThrowConfigNotEditable() {
        when(cdcServerMapper.selectList(any(LambdaQueryWrapper.class)))
                .thenReturn(Collections.singletonList(server("S1")));
        when(cdcServerConfigMapper.selectById("C1"))
                .thenReturn(config("C1", "S1", "auto-create-table", "true", "0"));

        BusinessException ex = assertThrows(BusinessException.class,
                () -> service.save(request(item("C1", "true"))));

        assertEquals(ServerConfigErrorCode.CONFIG_NOT_EDITABLE, ex.getCode());
    }

    @Test
    void save_keyNotSupported_shouldThrowConfigKeyNotSupported() {
        when(cdcServerMapper.selectList(any(LambdaQueryWrapper.class)))
                .thenReturn(Collections.singletonList(server("S1")));
        when(cdcServerConfigMapper.selectById("C1"))
                .thenReturn(config("C1", "S1", "monitor-metric-topic-name", "x", "1"));

        BusinessException ex = assertThrows(BusinessException.class,
                () -> service.save(request(item("C1", "x"))));

        assertEquals(ServerConfigErrorCode.CONFIG_KEY_NOT_SUPPORTED, ex.getCode());
    }

    @Test
    void save_valueFormatInvalid_shouldThrowValueFormatInvalid() {
        when(cdcServerMapper.selectList(any(LambdaQueryWrapper.class)))
                .thenReturn(Collections.singletonList(server("S1")));
        when(cdcServerConfigMapper.selectById("C1"))
                .thenReturn(config("C1", "S1", "snapshotBatchSize", "1000", "1"));

        BusinessException ex = assertThrows(BusinessException.class,
                () -> service.save(request(item("C1", "abc"))));

        assertEquals(ServerConfigErrorCode.VALUE_FORMAT_INVALID, ex.getCode());
    }

    @Test
    void save_updateAffectsZeroRows_shouldThrowSaveFailed() {
        when(cdcServerMapper.selectList(any(LambdaQueryWrapper.class)))
                .thenReturn(Collections.singletonList(server("S1")));
        when(cdcServerConfigMapper.selectById("C1"))
                .thenReturn(config("C1", "S1", "auto-create-table", "true", "1"));
        when(cdcServerConfigMapper.update(any(), any(LambdaUpdateWrapper.class))).thenReturn(0);

        BusinessException ex = assertThrows(BusinessException.class,
                () -> service.save(request(item("C1", "true"))));

        assertEquals(ServerConfigErrorCode.SAVE_FAILED, ex.getCode());
    }

    @Test
    void save_dbException_shouldWrapIntoSaveFailed() {
        when(cdcServerMapper.selectList(any(LambdaQueryWrapper.class)))
                .thenReturn(Collections.singletonList(server("S1")));
        when(cdcServerConfigMapper.selectById("C1"))
                .thenReturn(config("C1", "S1", "auto-create-table", "true", "1"));
        when(cdcServerConfigMapper.update(any(), any(LambdaUpdateWrapper.class)))
                .thenThrow(new RuntimeException("ORA-xxxx"));

        BusinessException ex = assertThrows(BusinessException.class,
                () -> service.save(request(item("C1", "true"))));

        assertEquals(ServerConfigErrorCode.SAVE_FAILED, ex.getCode());
    }

    @Test
    void save_midBatchFailure_shouldAbortWholeBatch() {
        when(cdcServerMapper.selectList(any(LambdaQueryWrapper.class)))
                .thenReturn(Collections.singletonList(server("S1")));
        when(cdcServerConfigMapper.selectById("C1"))
                .thenReturn(config("C1", "S1", "auto-create-table", "true", "1"));
        when(cdcServerConfigMapper.selectById("C2"))
                .thenReturn(config("C2", "S1", "snapshotBatchSize", "1000", "1"));
        when(cdcServerConfigMapper.update(any(), any(LambdaUpdateWrapper.class))).thenReturn(1);

        // 第二条值非法，第二批失败 → 整批异常（真实事务由 @Transactional 回滚）
        BusinessException ex = assertThrows(BusinessException.class,
                () -> service.save(request(item("C1", "true"), item("C2", "abc"))));

        assertEquals(ServerConfigErrorCode.VALUE_FORMAT_INVALID, ex.getCode());
        verify(cdcServerConfigMapper).update(any(), any(LambdaUpdateWrapper.class));
    }

    @Test
    void save_shouldBeTransactionalWithRollbackForException() throws Exception {
        Method method = ServerConfigServiceImpl.class.getMethod("save", ServerConfigSaveRequest.class);
        Transactional tx = method.getAnnotation(Transactional.class);
        assertNotNull(tx);
        assertEquals(1, tx.rollbackFor().length);
        assertEquals(Exception.class, tx.rollbackFor()[0]);
    }

    private static String readLastSql(LambdaQueryWrapper<CdcServerConfig> wrapper) {
        try {
            Field field = AbstractWrapper.class.getDeclaredField("lastSql");
            field.setAccessible(true);
            SharedString shared = (SharedString) field.get(wrapper);
            return shared == null ? "" : shared.getStringValue();
        } catch (Exception e) {
            throw new AssertionError("无法读取 wrapper lastSql", e);
        }
    }
}
