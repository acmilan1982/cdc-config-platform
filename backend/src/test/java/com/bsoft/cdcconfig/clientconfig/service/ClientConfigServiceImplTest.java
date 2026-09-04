package com.bsoft.cdcconfig.clientconfig.service;

import com.baomidou.mybatisplus.core.MybatisConfiguration;
import com.baomidou.mybatisplus.core.conditions.update.LambdaUpdateWrapper;
import com.baomidou.mybatisplus.core.metadata.TableInfoHelper;
import com.bsoft.cdcconfig.clientconfig.entity.CdcClientConfig;
import com.bsoft.cdcconfig.clientconfig.entity.CdcDataSource;
import com.bsoft.cdcconfig.clientconfig.exception.ClientConfigErrorCode;
import com.bsoft.cdcconfig.clientconfig.mapper.CdcClientConfigMapper;
import com.bsoft.cdcconfig.clientconfig.mapper.CdcDataSourceMapper;
import com.bsoft.cdcconfig.clientconfig.model.dto.CreateClientRequest;
import com.bsoft.cdcconfig.clientconfig.model.dto.UpdateClientRequest;
import com.bsoft.cdcconfig.clientconfig.model.query.ClientStatus;
import com.bsoft.cdcconfig.clientconfig.model.vo.ClientListItemVO;
import com.bsoft.cdcconfig.clientconfig.model.vo.ClientListVO;
import com.bsoft.cdcconfig.clientconfig.model.vo.DataSourceOptionVO;
import com.bsoft.cdcconfig.clientconfig.model.vo.DataSourceViewItemVO;
import com.bsoft.cdcconfig.clientconfig.service.impl.ClientConfigServiceImpl;
import com.bsoft.cdcconfig.common.exception.BusinessException;
import org.apache.ibatis.builder.MapperBuilderAssistant;
import org.junit.jupiter.api.BeforeAll;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.InOrder;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.Mockito;
import org.mockito.junit.jupiter.MockitoExtension;

import java.util.ArrayList;
import java.util.Arrays;
import java.util.Collections;
import java.util.List;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertNull;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.junit.jupiter.api.Assertions.assertTrue;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.times;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

/**
 * 探针端管理 Service 逻辑测试（mock Mapper，不触真实 DB）。
 * 覆盖 §8.1 第 2~11、13 项：归一化/字节边界、ID 大小写不敏感唯一、候选资格与占用自排除、
 * 列表原顺序/各类历史异常、DML 前全表重读与当次校验、删除直删/停用仅置位、
 * 启用仅被重复分配阻断、以及"允许一笔或两笔成功"的并发口径。
 */
@ExtendWith(MockitoExtension.class)
class ClientConfigServiceImplTest {

    @Mock
    private CdcClientConfigMapper clientConfigMapper;

    @Mock
    private CdcDataSourceMapper dataSourceMapper;

    @InjectMocks
    private ClientConfigServiceImpl service;

    @BeforeAll
    static void initTableInfo() {
        MapperBuilderAssistant assistant = new MapperBuilderAssistant(new MybatisConfiguration(), "");
        TableInfoHelper.initTableInfo(assistant, CdcClientConfig.class);
    }

    @BeforeEach
    void setUp() {
    }

    // ------------------------------------------------------------- 工具函数

    private CdcClientConfig row(String clientId, String desc, String dataSourceRaw, String fg) {
        CdcClientConfig c = new CdcClientConfig();
        c.setClientId(clientId);
        c.setClientDesc(desc);
        c.setDataSourceId(dataSourceRaw);
        c.setFgActive(fg);
        return c;
    }

    private CdcDataSource ds(String id, String category, String type, String org, String fg) {
        CdcDataSource d = new CdcDataSource();
        d.setDataSourceId(id);
        d.setDataSourceName(id + " 名称");
        d.setDataSourceCategory(category);
        d.setDataSourceType(type);
        d.setDataSourceOrg(org);
        d.setFgActive(fg);
        return d;
    }

    private CreateClientRequest createReq(String clientId, String desc, String... dsIds) {
        CreateClientRequest req = new CreateClientRequest();
        req.setClientId(clientId);
        req.setClientDesc(desc);
        req.setDataSourceIds(dsIds == null ? new ArrayList<String>() : new ArrayList<>(Arrays.asList(dsIds)));
        return req;
    }

    private UpdateClientRequest updateReq(String clientId, String desc, String... dsIds) {
        UpdateClientRequest req = new UpdateClientRequest();
        req.setClientId(clientId);
        req.setClientDesc(desc);
        req.setDataSourceIds(dsIds == null ? new ArrayList<String>() : new ArrayList<>(Arrays.asList(dsIds)));
        return req;
    }

    private static String repeat(String s, int n) {
        StringBuilder sb = new StringBuilder(s.length() * n);
        for (int i = 0; i < n; i++) {
            sb.append(s);
        }
        return sb.toString();
    }

    // ------------------------------------------------------------- E3 新增：格式校验（§8.1 第 2、3、4 项）

    @Test
    void create_blankOrNullClientId_shouldThrow40100() {
        assertThrowsBusinessCode(ClientConfigErrorCode.CLIENT_ID_REQUIRED,
                () -> service.create(createReq("", "desc", "DS-A")));
        assertThrowsBusinessCode(ClientConfigErrorCode.CLIENT_ID_REQUIRED,
                () -> service.create(createReq("   ", "desc", "DS-A")));
        assertThrowsBusinessCode(ClientConfigErrorCode.CLIENT_ID_REQUIRED,
                () -> service.create(createReq(null, "desc", "DS-A")));
    }

    @Test
    void create_invalidClientIdFormat_shouldThrow40101() {
        String[] invalid = {"-abc", "abc def", "a b", "ab@cd", repeat("a", 33)};
        for (String id : invalid) {
            assertThrowsBusinessCode(ClientConfigErrorCode.INVALID_CLIENT_ID,
                    () -> service.create(createReq(id, "desc", "DS-A")));
        }
    }

    @Test
    void create_validClientIdForms_shouldSucceedUpTo32() {
        when(clientConfigMapper.selectFullScan()).thenReturn(Collections.emptyList());
        when(dataSourceMapper.selectSafeAll()).thenReturn(Collections.singletonList(ds("DS-A", "SOURCE", "ORACLE", "org", "1")));
        when(clientConfigMapper.insert(any(CdcClientConfig.class))).thenReturn(1);

        // 1 位数字开头、32 位极限、允许的点/下划线/连字符
        service.create(createReq("9", "desc", "DS-A"));
        service.create(createReq("A", "desc", "DS-A"));
        service.create(createReq(repeat("a", 32), "desc", "DS-A"));
        service.create(createReq("ab_cd.ef-gh", "desc", "DS-A"));

        verify(clientConfigMapper, times(4)).insert(any(CdcClientConfig.class));
    }

    @Test
    void create_caseInsensitiveDuplicateClientId_shouldThrow40940() {
        when(clientConfigMapper.selectFullScan()).thenReturn(
                Collections.singletonList(row("Probe-001", "已有", "DS-A", "1")));
        when(dataSourceMapper.selectSafeAll()).thenReturn(Collections.singletonList(ds("DS-A", "SOURCE", "ORACLE", "org", "1")));

        assertThrowsBusinessCode(ClientConfigErrorCode.CLIENT_ID_CONFLICT,
                () -> service.create(createReq("probe-001", "desc", "DS-A")));
        verify(clientConfigMapper, never()).insert(any(CdcClientConfig.class));
    }

    // ---- CLIENT_DESC：空白拒绝、原样保存、UTF-8 1024 字节边界（§8.1 第 4 项）

    @Test
    void create_blankDesc_shouldThrow40102() {
        assertThrowsBusinessCode(ClientConfigErrorCode.INVALID_CLIENT_DESC,
                () -> service.create(createReq("p1", "   ", "DS-A")));
        assertThrowsBusinessCode(ClientConfigErrorCode.INVALID_CLIENT_DESC,
                () -> service.create(createReq("p1", "", "DS-A")));
    }

    @Test
    void create_descSurroundingWhitespaceShouldBeSavedRaw() {
        when(clientConfigMapper.selectFullScan()).thenReturn(Collections.emptyList());
        when(dataSourceMapper.selectSafeAll()).thenReturn(Collections.singletonList(ds("DS-A", "SOURCE", "ORACLE", "org", "1")));
        when(clientConfigMapper.insert(any(CdcClientConfig.class))).thenReturn(1);

        service.create(createReq("p1", "  中间说明  ", "DS-A"));

        ArgumentCaptor<CdcClientConfig> cap = ArgumentCaptor.forClass(CdcClientConfig.class);
        verify(clientConfigMapper).insert(cap.capture());
        assertEquals("  中间说明  ", cap.getValue().getClientDesc());
    }

    @Test
    void create_descUtf8Boundary_ascii1024Ok_1025Reject() {
        when(clientConfigMapper.selectFullScan()).thenReturn(Collections.emptyList());
        when(dataSourceMapper.selectSafeAll()).thenReturn(Collections.singletonList(ds("DS-A", "SOURCE", "ORACLE", "org", "1")));
        when(clientConfigMapper.insert(any(CdcClientConfig.class))).thenReturn(1);

        service.create(createReq("p1", repeat("a", 1024), "DS-A")); // 1024 字节恰好允许

        assertThrowsBusinessCode(ClientConfigErrorCode.INVALID_CLIENT_DESC,
                () -> service.create(createReq("p1", repeat("a", 1025), "DS-A")));
    }

    @Test
    void create_descUtf8Boundary_chinese341Ok_342Reject() {
        when(clientConfigMapper.selectFullScan()).thenReturn(Collections.emptyList());
        when(dataSourceMapper.selectSafeAll()).thenReturn(Collections.singletonList(ds("DS-A", "SOURCE", "ORACLE", "org", "1")));
        when(clientConfigMapper.insert(any(CdcClientConfig.class))).thenReturn(1);

        service.create(createReq("p1", repeat("中", 341), "DS-A")); // 341*3=1023 ≤1024

        assertThrowsBusinessCode(ClientConfigErrorCode.INVALID_CLIENT_DESC,
                () -> service.create(createReq("p1", repeat("中", 342), "DS-A"))); // 342*3=1026
    }

    @Test
    void create_descUtf8Boundary_emoji256Ok_257Reject() {
        when(clientConfigMapper.selectFullScan()).thenReturn(Collections.emptyList());
        when(dataSourceMapper.selectSafeAll()).thenReturn(Collections.singletonList(ds("DS-A", "SOURCE", "ORACLE", "org", "1")));
        when(clientConfigMapper.insert(any(CdcClientConfig.class))).thenReturn(1);

        String emoji = "😀"; // UTF-8 4 字节
        service.create(createReq("p1", repeat(emoji, 256), "DS-A")); // 256*4=1024

        assertThrowsBusinessCode(ClientConfigErrorCode.INVALID_CLIENT_DESC,
                () -> service.create(createReq("p1", repeat(emoji, 257), "DS-A"))); // 257*4=1028
    }

    // ---- 数据源多值归一化、必选、逗号与 1000 BYTE 边界（§8.1 第 2 项）

    @Test
    void create_dataSourceRequired_shouldThrow40103() {
        assertThrowsBusinessCode(ClientConfigErrorCode.DATA_SOURCE_REQUIRED,
                () -> service.create(createReq("p1", "desc", (String[]) null)));
        assertThrowsBusinessCode(ClientConfigErrorCode.DATA_SOURCE_REQUIRED,
                () -> service.create(createReq("p1", "desc")));
        assertThrowsBusinessCode(ClientConfigErrorCode.DATA_SOURCE_REQUIRED,
                () -> service.create(createReq("p1", "desc", "  ", "")));
    }

    @Test
    void create_dataSourceTokenWithComma_shouldThrow40104() {
        assertThrowsBusinessCode(ClientConfigErrorCode.INVALID_DATA_SOURCE_ID,
                () -> service.create(createReq("p1", "desc", "a,b")));
    }

    @Test
    void create_serializedDataSourceOver1000Byte_shouldThrow40105() {
        List<String> ids = new ArrayList<>();
        for (int i = 0; i < 10; i++) {
            ids.add("t" + i + repeat("x", 98)); // 每条 ≥100 ASCII，10 条 + 9 逗号 > 1000 字节
        }
        CreateClientRequest req = new CreateClientRequest();
        req.setClientId("p1");
        req.setClientDesc("desc");
        req.setDataSourceIds(ids);
        assertThrowsBusinessCode(ClientConfigErrorCode.DATA_SOURCE_IDS_TOO_LONG,
                () -> service.create(req));
    }

    @Test
    void create_dataSourceTrimDedupePreserveFirstOrder_shouldSerializeCsv() {
        when(clientConfigMapper.selectFullScan()).thenReturn(Collections.emptyList());
        when(dataSourceMapper.selectSafeAll()).thenReturn(Arrays.asList(
                ds("DS-A", "SOURCE", "ORACLE", "org", "1"),
                ds("DS-B", "SOURCE", "ORACLE", "org", "1")));
        when(clientConfigMapper.insert(any(CdcClientConfig.class))).thenReturn(1);

        service.create(createReq("p1", "desc", " DS-B ", " DS-A ", " DS-B ", "", "DS-A"));

        ArgumentCaptor<CdcClientConfig> cap = ArgumentCaptor.forClass(CdcClientConfig.class);
        verify(clientConfigMapper).insert(cap.capture());
        assertEquals("DS-B,DS-A", cap.getValue().getDataSourceId());
        assertEquals("1", cap.getValue().getFgActive());
    }

    // ---- E3 可用性/占用（§8.1 第 5、8、9 项）

    @Test
    void create_sourceUnavailableReasons_shouldThrow40441WithReason() {
        // 不存在 / 已停用 / 类别非 SOURCE / 类型非 ORACLE 四种形态
        when(clientConfigMapper.selectFullScan()).thenReturn(Collections.emptyList());
        when(dataSourceMapper.selectSafeAll()).thenReturn(Collections.singletonList(ds("DS-A", "SOURCE", "ORACLE", "org", "1")));

        BusinessException notFound = assertThrows(BusinessException.class,
                () -> service.create(createReq("p1", "desc", "GHOST")));
        assertEquals(ClientConfigErrorCode.DATA_SOURCE_UNAVAILABLE, notFound.getCode());
        assertTrue(notFound.getMessage().contains("GHOST"));
        assertTrue(notFound.getMessage().contains("不存在"));
        verify(clientConfigMapper, never()).insert(any(CdcClientConfig.class));
    }

    @Test
    void create_sourceInactiveCategoryTypeMismatch_shouldThrow40441() {
        when(clientConfigMapper.selectFullScan()).thenReturn(Collections.emptyList());

        // 停用
        when(dataSourceMapper.selectSafeAll()).thenReturn(Collections.singletonList(ds("INAC", "SOURCE", "ORACLE", "org", "0")));
        assertUnavailableReason("INAC", "已停用");

        // 类别非 SOURCE
        when(dataSourceMapper.selectSafeAll()).thenReturn(Collections.singletonList(ds("CATX", "TARGET", "ORACLE", "org", "1")));
        assertUnavailableReason("CATX", "类别非 SOURCE");

        // 类型非 ORACLE
        when(dataSourceMapper.selectSafeAll()).thenReturn(Collections.singletonList(ds("TYX", "SOURCE", "MYSQL", "org", "1")));
        assertUnavailableReason("TYX", "类型非 ORACLE");
    }

    private void assertUnavailableReason(String token, String reason) {
        BusinessException ex = assertThrows(BusinessException.class,
                () -> service.create(createReq("p1", "desc", token)));
        assertEquals(ClientConfigErrorCode.DATA_SOURCE_UNAVAILABLE, ex.getCode());
        assertTrue(ex.getMessage().contains(token));
        assertTrue(ex.getMessage().contains(reason));
    }

    @Test
    void create_sourceOccupiedByOther_shouldThrow40941AndNotInsert() {
        when(clientConfigMapper.selectFullScan()).thenReturn(
                Collections.singletonList(row("clientB", "占用者", "DS-X", "1")));
        when(dataSourceMapper.selectSafeAll()).thenReturn(Collections.singletonList(ds("DS-X", "SOURCE", "ORACLE", "orgX", "1")));

        BusinessException ex = assertThrows(BusinessException.class,
                () -> service.create(createReq("newP", "desc", "DS-X")));
        assertEquals(ClientConfigErrorCode.DATA_SOURCE_OCCUPIED, ex.getCode());
        assertEquals("数据源“orgX（DS-X）”已分配给探针：clientB，不能重复分配。", ex.getMessage());
        verify(clientConfigMapper, never()).insert(any(CdcClientConfig.class));
    }

    @Test
    void create_oneOfMultipleTokensConflicts_shouldNotPerformPartialDml() {
        when(clientConfigMapper.selectFullScan()).thenReturn(
                Collections.singletonList(row("clientB", "占用者", "OK2", "1")));
        when(dataSourceMapper.selectSafeAll()).thenReturn(Arrays.asList(
                ds("OK1", "SOURCE", "ORACLE", "org", "1"),
                ds("OK2", "SOURCE", "ORACLE", "org", "1")));

        // 第一个 token 可分配，第二个冲突 → 任一冲突即整笔拒绝，绝无部分 DML
        BusinessException ex = assertThrows(BusinessException.class,
                () -> service.create(createReq("newP", "desc", "OK1", "OK2")));
        assertEquals(ClientConfigErrorCode.DATA_SOURCE_OCCUPIED, ex.getCode());
        verify(clientConfigMapper, never()).insert(any(CdcClientConfig.class));
    }

    @Test
    void create_insertRowsZero_shouldThrow50051() {
        when(clientConfigMapper.selectFullScan()).thenReturn(Collections.emptyList());
        when(dataSourceMapper.selectSafeAll()).thenReturn(Collections.singletonList(ds("DS-A", "SOURCE", "ORACLE", "org", "1")));
        when(clientConfigMapper.insert(any(CdcClientConfig.class))).thenReturn(0);

        assertThrowsBusinessCode(ClientConfigErrorCode.SAVE_FAILED,
                () -> service.create(createReq("p1", "desc", "DS-A")));
    }

    // ------------------------------------------------------------- E2 数据源候选（§8.1 第 5 项）

    @Test
    void dataSourceOptions_shouldFilterCandidateAndMarkCommaAndOccupied() {
        List<CdcClientConfig> clients = Arrays.asList(
                row("clientA", "A", "DS-OWNED", "1"),
                row("clientB", "B", "DS-OWNED", "1"),
                row("editor", "编辑中", "DS-OWNED", "1"));
        when(clientConfigMapper.selectFullScan()).thenReturn(clients);
        List<CdcDataSource> dataSources = Arrays.asList(
                ds("DS-FREE1", "SOURCE", "ORACLE", "org1", "1"),
                ds("DS-OWNED", "SOURCE", "ORACLE", "org2", "1"),
                ds("A,1", "SOURCE", "ORACLE", "comma", "1"),
                ds("DS-INAC", "SOURCE", "ORACLE", "org", "0"),
                ds("DS-TARGET", "TARGET", "ORACLE", "org", "1"),
                ds("DS-MYSQL", "SOURCE", "MYSQL", "org", "1"));
        when(dataSourceMapper.selectSafeAll()).thenReturn(dataSources);

        List<DataSourceOptionVO> options = service.dataSourceOptions("editor");

        assertEquals(3, options.size());
        DataSourceOptionVO free = options.get(0);
        assertTrue(free.isSelectable());
        assertNull(free.getNotSelectableReason());
        assertEquals("DS-FREE1", free.getDataSourceId());

        // 已占用，自排除 editor 后仍被 clientA/clientB 占用
        DataSourceOptionVO owned = options.get(1);
        assertFalse(owned.isSelectable());
        assertEquals("OCCUPIED", owned.getNotSelectableReason());
        assertEquals(Arrays.asList("clientA", "clientB"), owned.getOccupiedByClientIds());

        // 含逗号 ID 恒禁选
        DataSourceOptionVO comma = options.get(2);
        assertFalse(comma.isSelectable());
        assertEquals("COMMA_IN_ID", comma.getNotSelectableReason());
        assertTrue(comma.getOccupiedByClientIds().isEmpty());
    }

    @Test
    void dataSourceOptions_selfExclusionShouldUseOriginalProbeId() {
        when(clientConfigMapper.selectFullScan()).thenReturn(
                Collections.singletonList(row("editor", "编辑中", "DS-OWNED", "1")));
        when(dataSourceMapper.selectSafeAll()).thenReturn(
                Collections.singletonList(ds("DS-OWNED", "SOURCE", "ORACLE", "org", "1")));

        // 自排除使用原探针 ID（exclude=editor 且占用者即 editor）→ 恢复可选
        List<DataSourceOptionVO> options = service.dataSourceOptions("editor");
        assertEquals(1, options.size());
        assertTrue(options.get(0).isSelectable());
        assertTrue(options.get(0).getOccupiedByClientIds().isEmpty());

        // 换一个非占用者 exclude → 仍标记占用
        List<DataSourceOptionVO> options2 = service.dataSourceOptions("stranger");
        assertEquals(1, options2.size());
        assertFalse(options2.get(0).isSelectable());
        assertEquals("OCCUPIED", options2.get(0).getNotSelectableReason());
    }

    // ------------------------------------------------------------- E1 列表（§8.1 第 6、7 项）

    @Test
    void list_keywordAndStatusLiteralEscaping_shouldPassEscapedPattern() {
        when(clientConfigMapper.selectByKeywordAndStatus(any(), any(), any()))
                .thenReturn(Collections.emptyList());

        service.list("50%_x\\y", ClientStatus.ALL);

        ArgumentCaptor<String> kw = ArgumentCaptor.forClass(String.class);
        ArgumentCaptor<String> pat = ArgumentCaptor.forClass(String.class);
        ArgumentCaptor<String> st = ArgumentCaptor.forClass(String.class);
        verify(clientConfigMapper).selectByKeywordAndStatus(kw.capture(), pat.capture(), st.capture());
        assertEquals("50%_x\\y", kw.getValue());
        // 转义顺序：反斜杠→%→_，再整体包裹 %..%；%/_/\ 均按普通字符
        assertEquals("%50\\%\\_x\\\\y%", pat.getValue());
        assertNull(st.getValue()); // ALL → 不按状态过滤
    }

    @Test
    void list_statusEnabled_shouldPassEnabledAndNullPattern() {
        when(clientConfigMapper.selectByKeywordAndStatus(any(), any(), any()))
                .thenReturn(Collections.emptyList());

        service.list(null, ClientStatus.ENABLED);

        ArgumentCaptor<String> kw = ArgumentCaptor.forClass(String.class);
        ArgumentCaptor<String> pat = ArgumentCaptor.forClass(String.class);
        ArgumentCaptor<String> st = ArgumentCaptor.forClass(String.class);
        verify(clientConfigMapper).selectByKeywordAndStatus(kw.capture(), pat.capture(), st.capture());
        assertNull(kw.getValue());
        assertNull(pat.getValue());
        assertEquals("ENABLED", st.getValue());
    }

    @Test
    void list_emptyRows_shouldReturnEmptyItemsWithoutReadingDataSources() {
        when(clientConfigMapper.selectByKeywordAndStatus(any(), any(), any()))
                .thenReturn(Collections.emptyList());

        ClientListVO vo = service.list("k", ClientStatus.DISABLED);
        assertTrue(vo.getItems().isEmpty());
        verify(dataSourceMapper, never()).selectSafeAll();
    }

    @Test
    void list_normalRow_shouldMapFieldsAndPreserveDataSourceFirstOrder() {
        CdcClientConfig r = row("probe-001", "描述", " C , A , B ", "1");
        when(clientConfigMapper.selectByKeywordAndStatus(any(), any(), any()))
                .thenReturn(Collections.singletonList(r));
        when(dataSourceMapper.selectSafeAll()).thenReturn(Arrays.asList(
                ds("C", "SOURCE", "ORACLE", "orgC", "1"),
                ds("A", "SOURCE", "ORACLE", "orgA", "1"),
                ds("B", "SOURCE", "ORACLE", "orgB", "1")));

        ClientListVO vo = service.list(null, null);
        assertEquals(1, vo.getItems().size());
        ClientListItemVO item = vo.getItems().get(0);
        assertEquals("probe-001", item.getClientId());
        assertEquals("描述", item.getClientDesc());
        assertEquals("ENABLED", item.getStatus());
        assertEquals("1", item.getFgActive());
        assertEquals(3, item.getDataSourceCount());
        // 行内视图按原 CSV 顺序（首次出现顺序），服务不得改序
        assertEquals(Arrays.asList("C", "A", "B"),
                idsOf(item.getDataSources()));
        assertTrue(item.getRowAnomalies().isEmpty());
        assertTrue(item.getPossibleCommaDataSourceIds().isEmpty());
    }

    @Test
    void list_nullDescAndAbnormalFg_shouldReturnNullDescAndAbnormalStatus() {
        CdcClientConfig abnormal = row("p-abn", null, "DS-A", "9");
        CdcClientConfig disabled = row("p-off", "关闭", "DS-A", "0");
        when(clientConfigMapper.selectByKeywordAndStatus(any(), any(), any()))
                .thenReturn(Arrays.asList(disabled, abnormal));
        when(dataSourceMapper.selectSafeAll()).thenReturn(Collections.singletonList(ds("DS-A", "SOURCE", "ORACLE", "org", "1")));

        ClientListVO vo = service.list(null, ClientStatus.ALL);
        assertEquals(2, vo.getItems().size());
        ClientListItemVO first = vo.getItems().get(0); // DISABLED 在前（SQL 保证 DESC；此处仅测映射）
        ClientListItemVO abn = vo.getItems().get(1);
        assertEquals("DISABLED", first.getStatus());
        assertNull(abn.getClientDesc());
        assertEquals("ABNORMAL", abn.getStatus());
    }

    @Test
    void list_duplicateTokenInRow_shouldMarkDuplicateInRow() {
        CdcClientConfig r = row("p1", "d", "DS-A, DS-A ,DS-B", "1");
        when(clientConfigMapper.selectByKeywordAndStatus(any(), any(), any()))
                .thenReturn(Collections.singletonList(r));
        when(dataSourceMapper.selectSafeAll()).thenReturn(Arrays.asList(
                ds("DS-A", "SOURCE", "ORACLE", "org", "1"),
                ds("DS-B", "SOURCE", "ORACLE", "org", "1")));

        ClientListVO vo = service.list(null, null);
        DataSourceViewItemVO a = vo.getItems().get(0).getDataSources().get(0);
        assertEquals("DS-A", a.getDataSourceId());
        assertTrue(a.getAnomalies().contains("DUPLICATE_IN_ROW"));
        DataSourceViewItemVO b = vo.getItems().get(0).getDataSources().get(1);
        assertFalse(b.getAnomalies().contains("DUPLICATE_IN_ROW"));
    }

    @Test
    void list_healthAnomalies_shouldMarkNotFoundCategoryTypeInactive() {
        CdcClientConfig r = row("p1", "d", "MISSING,CATX,TYX,INAC,HEALTHY", "1");
        when(clientConfigMapper.selectByKeywordAndStatus(any(), any(), any()))
                .thenReturn(Collections.singletonList(r));
        when(dataSourceMapper.selectSafeAll()).thenReturn(Arrays.asList(
                ds("CATX", "TARGET", "ORACLE", "org", "1"),
                ds("TYX", "SOURCE", "MYSQL", "org", "1"),
                ds("INAC", "SOURCE", "ORACLE", "org", "0"),
                ds("HEALTHY", "SOURCE", "ORACLE", "org", "1")));

        ClientListVO vo = service.list(null, null);
        List<DataSourceViewItemVO> items = vo.getItems().get(0).getDataSources();
        assertEquals(Arrays.asList("MISSING", "CATX", "TYX", "INAC", "HEALTHY"), idsOf(items));
        assertTrue(items.get(0).getAnomalies().contains("NOT_FOUND"));
        assertTrue(items.get(1).getAnomalies().contains("CATEGORY_MISMATCH"));
        assertTrue(items.get(2).getAnomalies().contains("TYPE_MISMATCH"));
        assertTrue(items.get(3).getAnomalies().contains("INACTIVE"));
        assertTrue(items.get(4).getAnomalies().isEmpty());
    }

    @Test
    void list_crossProbeConflict_shouldMarkAssignedToMultipleClients() {
        List<CdcClientConfig> rows = Arrays.asList(
                row("clientA", "A", "DS-X", "1"),
                row("clientB", "B", "DS-X", "1"));
        when(clientConfigMapper.selectByKeywordAndStatus(any(), any(), any())).thenReturn(rows);
        when(dataSourceMapper.selectSafeAll()).thenReturn(Collections.singletonList(ds("DS-X", "SOURCE", "ORACLE", "org", "1")));

        ClientListVO vo = service.list(null, null);
        DataSourceViewItemVO forA = vo.getItems().get(0).getDataSources().get(0);
        assertTrue(forA.getAnomalies().contains("ASSIGNED_TO_MULTIPLE_CLIENTS"));
        assertEquals(Collections.singletonList("clientB"), forA.getConflictClientIds());

        DataSourceViewItemVO forB = vo.getItems().get(1).getDataSources().get(0);
        assertEquals(Collections.singletonList("clientA"), forB.getConflictClientIds());
    }

    @Test
    void list_commaAmbiguity_shouldMarkRowAnomalyAndPossibleCommaIds() {
        CdcClientConfig r = row("p1", "d", "B,2", "1");
        when(clientConfigMapper.selectByKeywordAndStatus(any(), any(), any()))
                .thenReturn(Collections.singletonList(r));
        when(dataSourceMapper.selectSafeAll()).thenReturn(
                Collections.singletonList(ds("B,2", "SOURCE", "ORACLE", "org", "1")));

        ClientListVO vo = service.list(null, null);
        ClientListItemVO item = vo.getItems().get(0);
        assertEquals(Collections.singletonList("B,2"), item.getPossibleCommaDataSourceIds());
        assertTrue(item.getRowAnomalies().contains("COMMA_PROTOCOL_AMBIGUOUS"));
        // 普通 CSV 解析仍拆出两个 token 各自呈现（缺失数据源），歧义在行级表达
        assertEquals(Arrays.asList("B", "2"), idsOf(item.getDataSources()));
        assertEquals(2, item.getDataSourceCount());
    }

    // ------------------------------------------------------------- E4 编辑（§8.1 第 3、8 项）

    @Test
    void update_originalNotFound_shouldThrow40440BeforeReadingDataSources() {
        when(clientConfigMapper.selectFullScan()).thenReturn(
                Collections.singletonList(row("other", "其他", "DS-A", "1")));

        assertThrowsBusinessCode(ClientConfigErrorCode.CLIENT_NOT_FOUND,
                () -> service.update("missing", updateReq("p1", "d", "DS-B")));
        verify(dataSourceMapper, never()).selectSafeAll();
    }

    @Test
    void update_toOtherCaseVariantClientId_shouldThrow40940() {
        List<CdcClientConfig> clients = Arrays.asList(
                row("probe-001", "self", "DS-A", "1"),
                row("probe-002", "other", "DS-X", "1"));
        when(clientConfigMapper.selectFullScan()).thenReturn(clients);
        when(dataSourceMapper.selectSafeAll()).thenReturn(
                Collections.singletonList(ds("DS-A", "SOURCE", "ORACLE", "org", "1")));

        BusinessException ex = assertThrows(BusinessException.class,
                () -> service.update("probe-001", updateReq("Probe-002", "d", "DS-A")));
        assertEquals(ClientConfigErrorCode.CLIENT_ID_CONFLICT, ex.getCode());
        verify(clientConfigMapper, never()).update(eq(null), any(LambdaUpdateWrapper.class));
    }

    @Test
    void update_selfCaseOnlyChange_shouldSucceed() {
        List<CdcClientConfig> clients = Collections.singletonList(row("probe-001", "self", "DS-A", "1"));
        when(clientConfigMapper.selectFullScan()).thenReturn(clients);
        when(dataSourceMapper.selectSafeAll()).thenReturn(
                Collections.singletonList(ds("DS-A", "SOURCE", "ORACLE", "org", "1")));
        when(clientConfigMapper.update(eq(null), any(LambdaUpdateWrapper.class))).thenReturn(1);

        service.update("probe-001", updateReq("PROBE-001", "self", "DS-A")); // 仅大小写调整允许

        ArgumentCaptor<LambdaUpdateWrapper<CdcClientConfig>> cap = ArgumentCaptor.forClass(LambdaUpdateWrapper.class);
        verify(clientConfigMapper).update(eq(null), cap.capture());
        assertTrue(cap.getValue().getSqlSet().contains("CLIENT_ID"));
        assertTrue(cap.getValue().getCustomSqlSegment().contains("CLIENT_ID"));
    }

    @Test
    void update_allOk_shouldSetThreeColumnsAndKeepOriginalWhere() {
        List<CdcClientConfig> clients = Collections.singletonList(row("probe-001", "self", "DS-A", "1"));
        when(clientConfigMapper.selectFullScan()).thenReturn(clients);
        when(dataSourceMapper.selectSafeAll()).thenReturn(Arrays.asList(
                ds("DS-A", "SOURCE", "ORACLE", "org", "1"),
                ds("DS-B", "SOURCE", "ORACLE", "org", "1")));
        when(clientConfigMapper.update(eq(null), any(LambdaUpdateWrapper.class))).thenReturn(1);

        service.update("probe-001", updateReq("probe-001", "新描述", "DS-A", "DS-B"));

        ArgumentCaptor<LambdaUpdateWrapper<CdcClientConfig>> cap = ArgumentCaptor.forClass(LambdaUpdateWrapper.class);
        verify(clientConfigMapper).update(eq(null), cap.capture());
        LambdaUpdateWrapper<CdcClientConfig> w = cap.getValue();
        assertTrue(w.getSqlSet().contains("CLIENT_ID"));
        assertTrue(w.getSqlSet().contains("CLIENT_DESC"));
        assertTrue(w.getSqlSet().contains("DATA_SOURCE_ID"));
        assertTrue(w.getCustomSqlSegment().contains("CLIENT_ID"));
    }

    @Test
    void update_updateRowsZero_shouldThrow40440() {
        when(clientConfigMapper.selectFullScan()).thenReturn(
                Collections.singletonList(row("probe-001", "self", "DS-A", "1")));
        when(dataSourceMapper.selectSafeAll()).thenReturn(
                Collections.singletonList(ds("DS-A", "SOURCE", "ORACLE", "org", "1")));
        when(clientConfigMapper.update(eq(null), any(LambdaUpdateWrapper.class))).thenReturn(0);

        assertThrowsBusinessCode(ClientConfigErrorCode.CLIENT_NOT_FOUND,
                () -> service.update("probe-001", updateReq("probe-001", "d", "DS-A")));
    }

    // ------------------------------------------------------------- E4 编辑：历史异常保留 → 40942（R1-01）

    @Test
    void update_retainedInactiveSource_shouldBlock40942AndNotUpdate() {
        when(clientConfigMapper.selectFullScan()).thenReturn(
                Collections.singletonList(row("probe-001", "self", "DS-A,INAC", "1")));
        when(dataSourceMapper.selectSafeAll()).thenReturn(Arrays.asList(
                ds("DS-A", "SOURCE", "ORACLE", "org", "1"),
                ds("INAC", "SOURCE", "ORACLE", "org", "0")));

        BusinessException ex = assertThrows(BusinessException.class,
                () -> service.update("probe-001", updateReq("probe-001", "self", "DS-A", "INAC")));
        assertEquals(ClientConfigErrorCode.ANOMALOUS_SELECTION_BLOCKED, ex.getCode());
        assertTrue(ex.getMessage().contains("INAC"));
        assertTrue(ex.getMessage().contains("已停用"));
        verify(clientConfigMapper, never()).update(eq(null), any(LambdaUpdateWrapper.class));
    }

    @Test
    void update_retainedMissingSource_shouldBlock40942AndNotUpdate() {
        when(clientConfigMapper.selectFullScan()).thenReturn(
                Collections.singletonList(row("probe-001", "self", "GHOST", "1")));
        when(dataSourceMapper.selectSafeAll()).thenReturn(Collections.emptyList());

        BusinessException ex = assertThrows(BusinessException.class,
                () -> service.update("probe-001", updateReq("probe-001", "self", "GHOST")));
        assertEquals(ClientConfigErrorCode.ANOMALOUS_SELECTION_BLOCKED, ex.getCode());
        assertTrue(ex.getMessage().contains("GHOST"));
        assertTrue(ex.getMessage().contains("不存在"));
        verify(clientConfigMapper, never()).update(eq(null), any(LambdaUpdateWrapper.class));
    }

    @Test
    void update_retainedCategoryAndTypeMismatch_shouldBlock40942WithAccumulatedMessage() {
        when(clientConfigMapper.selectFullScan()).thenReturn(
                Collections.singletonList(row("probe-001", "self", "CATX,TYX", "1")));
        when(dataSourceMapper.selectSafeAll()).thenReturn(Arrays.asList(
                ds("CATX", "TARGET", "ORACLE", "org", "1"),
                ds("TYX", "SOURCE", "MYSQL", "org", "1")));

        BusinessException ex = assertThrows(BusinessException.class,
                () -> service.update("probe-001", updateReq("probe-001", "self", "CATX", "TYX")));
        assertEquals(ClientConfigErrorCode.ANOMALOUS_SELECTION_BLOCKED, ex.getCode());
        assertTrue(ex.getMessage().contains("CATX"));
        assertTrue(ex.getMessage().contains("类别非 SOURCE"));
        assertTrue(ex.getMessage().contains("TYX"));
        assertTrue(ex.getMessage().contains("类型非 ORACLE"));
        verify(clientConfigMapper, never()).update(eq(null), any(LambdaUpdateWrapper.class));
    }

    @Test
    void update_retainedCrossProbeAssignment_shouldBlock40942WithLocatableMessage() {
        List<CdcClientConfig> clients = Arrays.asList(
                row("probe-001", "self", "DS-X", "1"),
                row("clientB", "占用者", "DS-X", "1"));
        when(clientConfigMapper.selectFullScan()).thenReturn(clients);
        when(dataSourceMapper.selectSafeAll()).thenReturn(
                Collections.singletonList(ds("DS-X", "SOURCE", "ORACLE", "orgX", "1")));

        BusinessException ex = assertThrows(BusinessException.class,
                () -> service.update("probe-001", updateReq("probe-001", "self", "DS-X")));
        assertEquals(ClientConfigErrorCode.ANOMALOUS_SELECTION_BLOCKED, ex.getCode());
        assertTrue(ex.getMessage().contains("DS-X"));
        assertTrue(ex.getMessage().contains("orgX"));
        assertTrue(ex.getMessage().contains("clientB"));
        verify(clientConfigMapper, never()).update(eq(null), any(LambdaUpdateWrapper.class));
    }

    @Test
    void update_unclearedRowCommaAmbiguity_shouldBlock40942AndNotUpdate() {
        when(clientConfigMapper.selectFullScan()).thenReturn(
                Collections.singletonList(row("probe-001", "self", "B,2", "1")));
        when(dataSourceMapper.selectSafeAll()).thenReturn(
                Collections.singletonList(ds("B,2", "SOURCE", "ORACLE", "org", "1")));

        BusinessException ex = assertThrows(BusinessException.class,
                () -> service.update("probe-001", updateReq("probe-001", "self", "B", "2")));
        assertEquals(ClientConfigErrorCode.ANOMALOUS_SELECTION_BLOCKED, ex.getCode());
        assertTrue(ex.getMessage().contains("B,2"));
        verify(clientConfigMapper, never()).update(eq(null), any(LambdaUpdateWrapper.class));
    }

    @Test
    void update_removeAnomalyAndReselectLegal_shouldSucceed() {
        when(clientConfigMapper.selectFullScan()).thenReturn(
                Collections.singletonList(row("probe-001", "self", "INAC,DS-A", "1")));
        when(dataSourceMapper.selectSafeAll()).thenReturn(Arrays.asList(
                ds("INAC", "SOURCE", "ORACLE", "org", "0"),
                ds("DS-A", "SOURCE", "ORACLE", "org", "1"),
                ds("DS-B", "SOURCE", "ORACLE", "org", "1")));
        when(clientConfigMapper.update(eq(null), any(LambdaUpdateWrapper.class))).thenReturn(1);

        service.update("probe-001", updateReq("probe-001", "self", "DS-A", "DS-B"));

        verify(clientConfigMapper, times(1)).update(eq(null), any(LambdaUpdateWrapper.class));
    }

    @Test
    void update_normalizedDuplicateTokens_shouldNotPermanentlyLock() {
        when(clientConfigMapper.selectFullScan()).thenReturn(
                Collections.singletonList(row("probe-001", "self", "DS-A,DS-A", "1")));
        when(dataSourceMapper.selectSafeAll()).thenReturn(
                Collections.singletonList(ds("DS-A", "SOURCE", "ORACLE", "org", "1")));
        when(clientConfigMapper.update(eq(null), any(LambdaUpdateWrapper.class))).thenReturn(1);

        service.update("probe-001", updateReq("probe-001", "self", "DS-A"));

        verify(clientConfigMapper, times(1)).update(eq(null), any(LambdaUpdateWrapper.class));
    }

    @Test
    void update_newInjectedUnavailableSource_shouldThrow40441AndNotUpdate() {
        when(clientConfigMapper.selectFullScan()).thenReturn(
                Collections.singletonList(row("probe-001", "self", "DS-A", "1")));
        when(dataSourceMapper.selectSafeAll()).thenReturn(
                Collections.singletonList(ds("DS-A", "SOURCE", "ORACLE", "org", "1")));

        BusinessException ex = assertThrows(BusinessException.class,
                () -> service.update("probe-001", updateReq("probe-001", "self", "DS-A", "GHOST")));
        assertEquals(ClientConfigErrorCode.DATA_SOURCE_UNAVAILABLE, ex.getCode());
        assertTrue(ex.getMessage().contains("GHOST"));
        assertTrue(ex.getMessage().contains("不存在"));
        verify(clientConfigMapper, never()).update(eq(null), any(LambdaUpdateWrapper.class));
    }

    @Test
    void update_newOccupiedConflict_shouldThrow40941AndNotUpdate() {
        List<CdcClientConfig> clients = Arrays.asList(
                row("probe-001", "self", "DS-A", "1"),
                row("clientB", "占用者", "DS-X", "1"));
        when(clientConfigMapper.selectFullScan()).thenReturn(clients);
        when(dataSourceMapper.selectSafeAll()).thenReturn(Arrays.asList(
                ds("DS-A", "SOURCE", "ORACLE", "org", "1"),
                ds("DS-X", "SOURCE", "ORACLE", "orgX", "1")));

        BusinessException ex = assertThrows(BusinessException.class,
                () -> service.update("probe-001", updateReq("probe-001", "self", "DS-A", "DS-X")));
        assertEquals(ClientConfigErrorCode.DATA_SOURCE_OCCUPIED, ex.getCode());
        assertTrue(ex.getMessage().contains("DS-X"));
        assertTrue(ex.getMessage().contains("orgX"));
        assertTrue(ex.getMessage().contains("clientB"));
        verify(clientConfigMapper, never()).update(eq(null), any(LambdaUpdateWrapper.class));
    }

    // ------------------------------------------------------------- E5/E7 删除与停用（§8.1 第 10 项）

    @Test
    void delete_shouldDirectlyPhysicalDeleteWithoutChecks() {
        when(clientConfigMapper.deleteById("probe-001")).thenReturn(1);

        service.delete("probe-001");

        verify(clientConfigMapper).deleteById("probe-001");
        verify(clientConfigMapper, never()).selectFullScan();
        verify(dataSourceMapper, never()).selectSafeAll();
    }

    @Test
    void delete_missing_shouldThrow40440() {
        when(clientConfigMapper.deleteById("missing")).thenReturn(0);

        assertThrowsBusinessCode(ClientConfigErrorCode.CLIENT_NOT_FOUND,
                () -> service.delete("missing"));
    }

    @Test
    void disable_shouldOnlyFlipFgActiveWithoutPreRead() {
        when(clientConfigMapper.update(eq(null), any(LambdaUpdateWrapper.class))).thenReturn(1);

        service.disable("probe-001");

        ArgumentCaptor<LambdaUpdateWrapper<CdcClientConfig>> cap = ArgumentCaptor.forClass(LambdaUpdateWrapper.class);
        verify(clientConfigMapper).update(eq(null), cap.capture());
        LambdaUpdateWrapper<CdcClientConfig> w = cap.getValue();
        assertTrue(w.getSqlSet().contains("FG_ACTIVE"));
        assertFalse(w.getSqlSet().contains("CLIENT_ID"));
        assertFalse(w.getSqlSet().contains("CLIENT_DESC"));
        assertFalse(w.getSqlSet().contains("DATA_SOURCE_ID"));
        assertTrue(w.getCustomSqlSegment().contains("CLIENT_ID"));
        verify(clientConfigMapper, never()).selectFullScan();
    }

    @Test
    void disable_missing_shouldThrow40440() {
        when(clientConfigMapper.update(eq(null), any(LambdaUpdateWrapper.class))).thenReturn(0);

        assertThrowsBusinessCode(ClientConfigErrorCode.CLIENT_NOT_FOUND,
                () -> service.disable("missing"));
    }

    // ------------------------------------------------------------- E6 启用（§8.1 第 11 项）

    @Test
    void enable_illegalState_shouldThrow40240() {
        when(clientConfigMapper.selectFullScan()).thenReturn(
                Collections.singletonList(row("probe-001", "self", "DS-A", "9")));

        assertThrowsBusinessCode(ClientConfigErrorCode.ILLEGAL_CLIENT_STATE,
                () -> service.enable("probe-001"));
        verify(dataSourceMapper, never()).selectSafeAll();
        verify(clientConfigMapper, never()).update(eq(null), any(LambdaUpdateWrapper.class));
    }

    @Test
    void enable_notFound_shouldThrow40440() {
        when(clientConfigMapper.selectFullScan()).thenReturn(
                Collections.singletonList(row("other", "o", "DS-A", "0")));

        assertThrowsBusinessCode(ClientConfigErrorCode.CLIENT_NOT_FOUND,
                () -> service.enable("probe-001"));
        verify(dataSourceMapper, never()).selectSafeAll();
        verify(clientConfigMapper, never()).update(eq(null), any(LambdaUpdateWrapper.class));
    }

    @Test
    void enable_duplicateAssignment_shouldThrow40941() {
        List<CdcClientConfig> clients = Arrays.asList(
                row("probe-001", "self", "DS-X", "0"),
                row("clientB", "占用者", "DS-X", "1"));
        when(clientConfigMapper.selectFullScan()).thenReturn(clients);
        when(dataSourceMapper.selectSafeAll()).thenReturn(
                Collections.singletonList(ds("DS-X", "SOURCE", "ORACLE", "orgX", "1")));

        BusinessException ex = assertThrows(BusinessException.class,
                () -> service.enable("probe-001"));
        assertEquals(ClientConfigErrorCode.DATA_SOURCE_OCCUPIED, ex.getCode());
        assertTrue(ex.getMessage().contains("clientB"));
        assertTrue(ex.getMessage().contains("DS-X"));
        verify(clientConfigMapper, never()).update(eq(null), any(LambdaUpdateWrapper.class));
    }

    @Test
    void enable_historicalAnomalyAndMissingDs_shouldNotBlockEnable() {
        // 目标自身 token 对应停用/缺失数据源：仅重复分配阻断，历史异常本身不阻断
        List<CdcClientConfig> clients = Collections.singletonList(
                row("probe-001", "self", "INAC,GHOST", "0"));
        when(clientConfigMapper.selectFullScan()).thenReturn(clients);
        when(dataSourceMapper.selectSafeAll()).thenReturn(
                Collections.singletonList(ds("INAC", "SOURCE", "ORACLE", "org", "0")));
        when(clientConfigMapper.update(eq(null), any(LambdaUpdateWrapper.class))).thenReturn(1);

        service.enable("probe-001");

        ArgumentCaptor<LambdaUpdateWrapper<CdcClientConfig>> cap = ArgumentCaptor.forClass(LambdaUpdateWrapper.class);
        verify(clientConfigMapper).update(eq(null), cap.capture());
        assertTrue(cap.getValue().getSqlSet().contains("FG_ACTIVE"));
    }

    // ------------------------------------------------------------- 并发口径（§8.1 第 13 项）

    @Test
    void racingCreates_allowBothSuccess_shouldNotEnforceSingleSuccess() {
        // 每个请求都在目标 DML 前重读全表；模拟两个请求的重读都看到初始空表（已接受的竞态窗口）
        when(clientConfigMapper.selectFullScan()).thenReturn(Collections.emptyList());
        when(dataSourceMapper.selectSafeAll()).thenReturn(
                Collections.singletonList(ds("DS-A", "SOURCE", "ORACLE", "org", "1")));
        when(clientConfigMapper.insert(any(CdcClientConfig.class))).thenReturn(1);

        // 两笔都可成功（approved 口径：不保证并发最多一笔成功），不把"最多一个成功"当断言
        service.create(createReq("probe-001", "desc", "DS-A"));
        service.create(createReq("probe-001", "desc", "DS-A"));

        verify(clientConfigMapper, times(2)).insert(any(CdcClientConfig.class));
    }

    @Test
    void writeOperations_shouldFullReReadBeforeDml_throughInOrder() {
        when(clientConfigMapper.selectFullScan()).thenReturn(Collections.emptyList());
        when(dataSourceMapper.selectSafeAll()).thenReturn(
                Collections.singletonList(ds("DS-A", "SOURCE", "ORACLE", "org", "1")));
        when(clientConfigMapper.insert(any(CdcClientConfig.class))).thenReturn(1);

        service.create(createReq("c1", "d", "DS-A"));
        service.create(createReq("c2", "d", "DS-A"));

        InOrder inOrder = Mockito.inOrder(clientConfigMapper);
        inOrder.verify(clientConfigMapper, times(1)).selectFullScan();
        inOrder.verify(clientConfigMapper, times(1)).insert(any(CdcClientConfig.class));
        inOrder.verify(clientConfigMapper, times(1)).selectFullScan();
        inOrder.verify(clientConfigMapper, times(1)).insert(any(CdcClientConfig.class));
    }

    @Test
    void enable_update_shouldFullReReadBeforeDml() {
        when(clientConfigMapper.selectFullScan()).thenReturn(
                Collections.singletonList(row("probe-001", "self", "DS-A", "0")));
        when(dataSourceMapper.selectSafeAll()).thenReturn(
                Collections.singletonList(ds("DS-A", "SOURCE", "ORACLE", "org", "1")));
        when(clientConfigMapper.update(eq(null), any(LambdaUpdateWrapper.class))).thenReturn(1);

        service.enable("probe-001");

        InOrder inOrder = Mockito.inOrder(clientConfigMapper);
        inOrder.verify(clientConfigMapper).selectFullScan();
        inOrder.verify(clientConfigMapper).update(eq(null), any(LambdaUpdateWrapper.class));
    }

    @Test
    void update_shouldFullReReadBeforeDml() {
        when(clientConfigMapper.selectFullScan()).thenReturn(
                Collections.singletonList(row("probe-001", "self", "DS-A", "1")));
        when(dataSourceMapper.selectSafeAll()).thenReturn(
                Collections.singletonList(ds("DS-A", "SOURCE", "ORACLE", "org", "1")));
        when(clientConfigMapper.update(eq(null), any(LambdaUpdateWrapper.class))).thenReturn(1);

        service.update("probe-001", updateReq("probe-001", "d", "DS-A"));

        InOrder inOrder = Mockito.inOrder(clientConfigMapper);
        inOrder.verify(clientConfigMapper).selectFullScan();
        inOrder.verify(clientConfigMapper).update(eq(null), any(LambdaUpdateWrapper.class));
    }

    // ------------------------------------------------------------- helper

    private void assertThrowsBusinessCode(int code, Runnable r) {
        BusinessException ex = assertThrows(BusinessException.class, r::run);
        assertEquals(code, ex.getCode());
    }

    private static List<String> idsOf(List<DataSourceViewItemVO> items) {
        List<String> out = new ArrayList<>();
        for (DataSourceViewItemVO item : items) {
            out.add(item.getDataSourceId());
        }
        return out;
    }
}
