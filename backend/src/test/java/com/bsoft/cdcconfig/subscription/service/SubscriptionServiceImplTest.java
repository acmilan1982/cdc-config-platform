package com.bsoft.cdcconfig.subscription.service;

import com.baomidou.mybatisplus.annotation.IdType;
import com.baomidou.mybatisplus.annotation.TableId;
import com.baomidou.mybatisplus.core.MybatisConfiguration;
import com.baomidou.mybatisplus.core.conditions.update.LambdaUpdateWrapper;
import com.baomidou.mybatisplus.core.metadata.TableInfoHelper;
import com.bsoft.cdcconfig.common.exception.BusinessException;
import com.bsoft.cdcconfig.subscription.dto.SourceTableInput;
import com.bsoft.cdcconfig.subscription.dto.SubscriptionQuery;
import com.bsoft.cdcconfig.subscription.dto.SubscriptionSaveDTO;
import com.bsoft.cdcconfig.subscription.entity.DataSourceRef;
import com.bsoft.cdcconfig.subscription.entity.DataSubscribe;
import com.bsoft.cdcconfig.subscription.exception.BadRequestException;
import com.bsoft.cdcconfig.subscription.exception.SubscriptionErrorCode;
import com.bsoft.cdcconfig.subscription.exception.SubscriptionValidationException;
import com.bsoft.cdcconfig.subscription.mapper.SubscriptionDataSubscribeMapper;
import com.bsoft.cdcconfig.subscription.mapper.SubscriptionDataSourceMapper;
import com.bsoft.cdcconfig.subscription.service.impl.SubscriptionServiceImpl;
import com.bsoft.cdcconfig.subscription.vo.OptionsVO;
import com.bsoft.cdcconfig.subscription.vo.QueryWarningVO;
import com.bsoft.cdcconfig.subscription.vo.SubscriptionDeletePreviewVO;
import com.bsoft.cdcconfig.subscription.vo.SubscriptionDetailVO;
import com.bsoft.cdcconfig.subscription.vo.SubscriptionEditOpenVO;
import com.bsoft.cdcconfig.subscription.vo.SubscriptionListVO;
import com.bsoft.cdcconfig.subscription.vo.SubscriptionRowVO;
import com.bsoft.cdcconfig.subscription.vo.ValidationErrorVO;
import org.apache.ibatis.builder.MapperBuilderAssistant;
import org.junit.jupiter.api.BeforeAll;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.transaction.PlatformTransactionManager;

import java.lang.reflect.Field;
import java.util.ArrayList;
import java.util.Arrays;
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

/**
 * 订阅业务（API.md §4）：候选 SQL、列表 OR/AND + 歧义警告、多源库异常 4 类拒绝码、
 * 新增 UUID32 主键 + IdType.INPUT、PRESERVE 不重写 CLOB、无并发令牌/行锁、删除保护。
 * 全部使用 Mock 与 TransactionTemplate（mock 事务管理器），不连真实 Oracle。
 */
@ExtendWith(MockitoExtension.class)
class SubscriptionServiceImplTest {

    @Mock
    private SubscriptionDataSubscribeMapper dataSubscribeMapper;

    @Mock
    private SubscriptionDataSourceMapper subscriptionDataSourceMapper;

    @Mock
    private SourceMetadataService sourceMetadataService;

    @Mock
    private PlatformTransactionManager transactionManager;

    @InjectMocks
    private SubscriptionServiceImpl service;

    @BeforeAll
    static void initTableInfo() {
        MapperBuilderAssistant assistant = new MapperBuilderAssistant(new MybatisConfiguration(), "");
        TableInfoHelper.initTableInfo(assistant, DataSubscribe.class);
        TableInfoHelper.initTableInfo(assistant, DataSourceRef.class);
    }

    private DataSubscribe row;

    @BeforeEach
    void setUp() {
        row = new DataSubscribe();
        row.setDataSubId("SUB001");
        row.setDataSubDesc("订阅描述");
        row.setDataFromSourceId("S01");
        row.setDataToSourceId("T01");
        row.setDataSourceTable("S01.SCHEMA_A.TABLE_1");
        row.setFgActive("1");
    }

    // ---- 候选 ---- //

    @Test
    void options_usesEnabledAndCategoryPredicates() {
        DataSourceRef src = ref("S01", "机构A", "SOURCE", "1");
        DataSourceRef tgt = ref("T01", "机构B", "TARGET", "1");
        when(subscriptionDataSourceMapper.selectList(any())).thenReturn(
                Collections.singletonList(src), Collections.singletonList(tgt));

        OptionsVO vo = service.options();

        assertEquals(1, vo.getSources().size());
        assertEquals("S01", vo.getSources().get(0).getDataSourceId());
        assertEquals("机构A", vo.getSources().get(0).getDataSourceOrg());
        assertEquals(1, vo.getTargets().size());
        assertEquals("T01", vo.getTargets().get(0).getDataSourceId());
    }

    @Test
    void options_lowercaseCategory_stillReturnsEnabledCandidate() {
        DataSourceRef lower = ref("S01", "机构A", "source", "1");
        when(subscriptionDataSourceMapper.selectList(any())).thenReturn(
                Collections.singletonList(lower), Collections.emptyList());

        OptionsVO vo = service.options();
        assertEquals(1, vo.getSources().size());
        assertEquals("S01", vo.getSources().get(0).getDataSourceId());
        assertEquals("机构A", vo.getSources().get(0).getDataSourceOrg());
    }

    // ---- 列表过滤：源库组内 OR、目标库组内 OR、两组 AND ---- //

    @Test
    void list_sourceOrTargetAnd_filteringAndAnomalyRetention() {
        DataSubscribe row1 = row; // S01 -> T01
        DataSubscribe row2 = newRow("SUB002", "S02", "T01");
        DataSubscribe row3 = newRow("SUB003", "S01", "T02");
        DataSubscribe anomaly = newRow("SUB004", "S01,S02", "T01");
        when(dataSubscribeMapper.selectActiveForList())
                .thenReturn(Arrays.asList(row1, row2, row3, anomaly));
        when(subscriptionDataSourceMapper.selectList(any())).thenReturn(Collections.emptyList());

        SubscriptionQuery query = new SubscriptionQuery();
        query.setSourceIds(Collections.singletonList("S01"));
        query.setTargetIds(Collections.singletonList("T01"));

        SubscriptionListVO vo = service.list(query);

        assertEquals(2, vo.getItems().size());
        assertEquals("SUB001", vo.getItems().get(0).getDataSubId());
        SubscriptionRowVO anomalyRow = vo.getItems().get(1);
        assertEquals("SUB004", anomalyRow.getDataSubId());
        assertTrue(anomalyRow.isAnomalyMultiSource(), "多源库异常记录整行警示");
        assertNull(anomalyRow.getSource());
        assertEquals(0, vo.getQueryWarnings().size());
    }

    @Test
    void list_noFilters_returnsAllRows() {
        when(dataSubscribeMapper.selectActiveForList())
                .thenReturn(Collections.singletonList(row));
        when(subscriptionDataSourceMapper.selectList(any())).thenReturn(Collections.emptyList());

        SubscriptionListVO vo = service.list(new SubscriptionQuery());

        assertEquals(1, vo.getItems().size());
        assertEquals("SUB001", vo.getItems().get(0).getDataSubId());
    }

    @Test
    void list_nullQuery_returnsAllRows() {
        when(dataSubscribeMapper.selectActiveForList())
                .thenReturn(Collections.singletonList(row));
        when(subscriptionDataSourceMapper.selectList(any())).thenReturn(Collections.emptyList());

        SubscriptionListVO vo = service.list(null);

        assertEquals(1, vo.getItems().size());
    }

    @Test
    void list_commaCandidate_generatesAmbiguousWarning() {
        DataSubscribe stored = newRow("SUB005", "A,B", "T01");
        when(dataSubscribeMapper.selectActiveForList())
                .thenReturn(Collections.singletonList(stored));
        when(subscriptionDataSourceMapper.selectList(any())).thenReturn(Collections.emptyList());

        SubscriptionQuery query = new SubscriptionQuery();
        query.setSourceIds(Collections.singletonList("A,B"));

        SubscriptionListVO vo = service.list(query);

        assertEquals(1, vo.getItems().size(), "含逗号候选按历史兼容可能匹配");
        assertEquals(1, vo.getQueryWarnings().size());
        QueryWarningVO warning = vo.getQueryWarnings().get(0);
        assertEquals("AMBIGUOUS_COMMA_ID", warning.getType());
        assertEquals("sourceIds", warning.getField());
        assertEquals("A,B", warning.getValue());
        assertTrue(warning.getMessage().contains("历史兼容可能匹配"));
    }

    @Test
    void list_blankCandidate_throwsBadRequest() {
        SubscriptionQuery query = new SubscriptionQuery();
        query.setSourceIds(Collections.singletonList("   "));

        BadRequestException e = assertThrows(BadRequestException.class, () -> service.list(query));
        assertTrue(e.getMessage().contains("sourceIds"));
    }

    // ---- 详情 ---- //

    @Test
    void detail_anomalyMultiSource_throws40352() {
        row.setDataFromSourceId("S01,S02");
        when(dataSubscribeMapper.selectOne(any())).thenReturn(row);

        BusinessException e = assertThrows(BusinessException.class, () -> service.detail("SUB001"));
        assertEquals(40352, e.getCode());
    }

    @Test
    void detail_notFound_throws40430() {
        when(dataSubscribeMapper.selectOne(any())).thenReturn(null);

        BusinessException e = assertThrows(BusinessException.class, () -> service.detail("NOPE"));
        assertEquals(40430, e.getCode());
    }

    @Test
    void detail_normal_returnsWarningsAndRefs() {
        when(dataSubscribeMapper.selectOne(any())).thenReturn(row);
        when(subscriptionDataSourceMapper.selectList(any())).thenReturn(Arrays.asList(
                ref("S01", "机构A", "SOURCE", "1"),
                ref("T01", "机构B", "TARGET", "1")));

        SubscriptionDetailVO vo = service.detail("SUB001");

        assertEquals("SUB001", vo.getDataSubId());
        assertEquals("NORMAL", vo.getSource().getStatus());
        assertEquals(1, vo.getTargets().size());
        assertEquals(0, vo.getWarnings().size());
        assertEquals(1, vo.getTablesBySchema().size());
    }

    // ---- 新增 ---- //

    @Test
    void create_success_usesUuid32AndPersistsFields() {
        SubscriptionSaveDTO dto = validDto();
        when(subscriptionDataSourceMapper.selectOne(any()))
                .thenReturn(ref("S01", "机构A", "SOURCE", "1"),
                        ref("T01", "机构B", "TARGET", "1"),
                        ref("T02", "机构D", "TARGET", "1"));
        when(sourceMetadataService.validateTables(eq("S01"), any())).thenReturn(Collections.emptyList());
        when(dataSubscribeMapper.insertForCreate(any())).thenReturn(1);

        String id = service.create(dto);

        assertNotNull(id);
        assertEquals(32, id.length());
        assertFalse(id.contains("-"), "UUID32 不得含连字符");
        assertTrue(id.matches("[0-9a-fA-F]{32}"));

        ArgumentCaptor<DataSubscribe> captor = ArgumentCaptor.forClass(DataSubscribe.class);
        verify(dataSubscribeMapper).insertForCreate(captor.capture());
        DataSubscribe created = captor.getValue();
        assertEquals(id, created.getDataSubId());
        assertEquals("订阅描述", created.getDataSubDesc());
        assertEquals("S01", created.getDataFromSourceId());
        assertEquals("T01,T02", created.getDataToSourceId());
        assertEquals("S01.SCHEMA_A.TABLE_1,S01.SCHEMA_A.TABLE_2", created.getDataSourceTable());
    }

    @Test
    void create_modePreserve_throwsBadRequest() {
        SubscriptionSaveDTO dto = validDto();
        dto.setSourceSelectionMode("PRESERVE");

        BadRequestException e = assertThrows(BadRequestException.class, () -> service.create(dto));
        assertEquals("新增订阅 sourceSelectionMode 只能为 REPLACE", e.getMessage());
    }

    @Test
    void create_modeLowercaseReplace_accepted() {
        SubscriptionSaveDTO dto = validDto();
        dto.setSourceSelectionMode("replace");
        when(subscriptionDataSourceMapper.selectOne(any()))
                .thenReturn(ref("S01", "机构A", "SOURCE", "1"),
                        ref("T01", "机构B", "TARGET", "1"));
        when(sourceMetadataService.validateTables(eq("S01"), any())).thenReturn(Collections.emptyList());
        when(dataSubscribeMapper.insertForCreate(any())).thenReturn(1);

        assertNotNull(service.create(dto));
    }

    @Test
    void create_nullDto_throwsBadRequest() {
        BadRequestException e = assertThrows(BadRequestException.class, () -> service.create(null));
        assertEquals("请求体不能为空", e.getMessage());
    }

    @Test
    void create_insertReturnsZero_throws50040() {
        SubscriptionSaveDTO dto = validDto();
        when(subscriptionDataSourceMapper.selectOne(any()))
                .thenReturn(ref("S01", "机构A", "SOURCE", "1"),
                        ref("T01", "机构B", "TARGET", "1"));
        when(sourceMetadataService.validateTables(eq("S01"), any())).thenReturn(Collections.emptyList());
        when(dataSubscribeMapper.insertForCreate(any())).thenReturn(0);

        BusinessException e = assertThrows(BusinessException.class, () -> service.create(dto));
        assertEquals(50040, e.getCode());
    }

    @Test
    void create_insertReturnsMoreThanOne_throws50040() {
        SubscriptionSaveDTO dto = validDto();
        when(subscriptionDataSourceMapper.selectOne(any()))
                .thenReturn(ref("S01", "机构A", "SOURCE", "1"),
                        ref("T01", "机构B", "TARGET", "1"));
        when(sourceMetadataService.validateTables(eq("S01"), any())).thenReturn(Collections.emptyList());
        when(dataSubscribeMapper.insertForCreate(any())).thenReturn(2);

        BusinessException e = assertThrows(BusinessException.class, () -> service.create(dto));
        assertEquals(50040, e.getCode());
    }

    // ---- 新增结构化校验 ---- //

    @Test
    void create_structuralErrors_collectItems() {
        SubscriptionSaveDTO dto = validDto();
        dto.setDataSubDesc("   ");
        dto.setDataFromSourceId("S01,S02");
        dto.setDataToSourceIds(Arrays.asList("T01", "T01"));
        dto.setSourceTables(Arrays.asList(
                new SourceTableInput("SCHEMA_A", "T1"),
                new SourceTableInput("SCHEMA_A", "T1"),
                new SourceTableInput("SCHEMA", "T.1")));

        SubscriptionValidationException e =
                assertThrows(SubscriptionValidationException.class, () -> service.create(dto));

        assertNotNull(errorByCode(e, "40310"));
        assertNotNull(errorByCode(e, "40312"), "多源库只能选一个源库");
        assertNotNull(errorByCode(e, "40318"), "记录内重复目标库");
        assertNotNull(errorByCode(e, "40317"), "记录内重复源表");
        assertNotNull(errorByCode(e, "40316"), "表名含英文句点");
        verify(dataSubscribeMapper, never()).insertForCreate(any());
    }

    @Test
    void create_sourceTablesEmpty_returns40314() {
        SubscriptionSaveDTO dto = validDto();
        dto.setSourceTables(Collections.emptyList());

        SubscriptionValidationException e =
                assertThrows(SubscriptionValidationException.class, () -> service.create(dto));
        assertNotNull(errorByCode(e, "40314"));
    }

    @Test
    void create_sourceContainsDot_returns40316() {
        SubscriptionSaveDTO dto = validDto();
        dto.setDataFromSourceId("S.01");

        SubscriptionValidationException e =
                assertThrows(SubscriptionValidationException.class, () -> service.create(dto));
        assertNotNull(errorByCode(e, "40316"));
    }

    @Test
    void create_refsNotFoundOrWrongCategory_collectItems() {
        SubscriptionSaveDTO dto = validDto();
        when(subscriptionDataSourceMapper.selectOne(any())).thenReturn(null, null);

        SubscriptionValidationException e =
                assertThrows(SubscriptionValidationException.class, () -> service.create(dto));

        ValidationErrorVO source = errorByCode(e, "40320");
        ValidationErrorVO target = errorByCode(e, "40321");
        assertNotNull(source);
        assertEquals("dataFromSourceId", source.getField());
        assertNotNull(target);
        assertEquals("dataToSourceIds", target.getField());
    }

    @Test
    void create_sourceCategoryMismatch_returns40322() {
        SubscriptionSaveDTO dto = validDto();
        when(subscriptionDataSourceMapper.selectOne(any()))
                .thenReturn(ref("S01", "机构A", "TARGET", "1"),
                        ref("T01", "机构B", "TARGET", "1"));

        SubscriptionValidationException e =
                assertThrows(SubscriptionValidationException.class, () -> service.create(dto));
        assertNotNull(errorByCode(e, "40322"));
    }

    @Test
    void create_validateTablesErrors_throwAsValidation() {
        SubscriptionSaveDTO dto = validDto();
        when(subscriptionDataSourceMapper.selectOne(any()))
                .thenReturn(ref("S01", "机构A", "SOURCE", "1"),
                        ref("T01", "机构B", "TARGET", "1"));
        ValidationErrorVO tableError = errorItem("40330", "sourceTables", "SCHEMA_A.GONE",
                "源表中存在当前源库不存在的表");
        when(sourceMetadataService.validateTables(eq("S01"), any()))
                .thenReturn(Collections.singletonList(tableError));

        SubscriptionValidationException e =
                assertThrows(SubscriptionValidationException.class, () -> service.create(dto));
        assertEquals("SCHEMA_A.GONE", e.getValidationErrors().get(0).getName());
        verify(dataSubscribeMapper, never()).insertForCreate(any());
    }

    // ---- 编辑打开 ---- //

    @Test
    void editOpen_anomaly_throws40350() {
        row.setDataFromSourceId("S01,S02");
        when(dataSubscribeMapper.selectOne(any())).thenReturn(row);

        BusinessException e = assertThrows(BusinessException.class, () -> service.editOpen("SUB001"));
        assertEquals(40350, e.getCode());
    }

    @Test
    void editOpen_notFound_throws40430() {
        when(dataSubscribeMapper.selectOne(any())).thenReturn(null);

        BusinessException e = assertThrows(BusinessException.class, () -> service.editOpen("NOPE"));
        assertEquals(40430, e.getCode());
    }

    @Test
    void editOpen_sourceChecked_returnsInvalidTables() {
        when(dataSubscribeMapper.selectOne(any())).thenReturn(row);
        when(subscriptionDataSourceMapper.selectList(any())).thenReturn(Arrays.asList(
                ref("S01", "机构A", "SOURCE", "1"),
                ref("T01", "机构B", "TARGET", "1")));
        when(sourceMetadataService.probeReachable("S01")).thenReturn(true);
        ValidationErrorVO invalid = errorItem("40330", "sourceTables", "SCHEMA_A.GONE",
                "源表中存在当前源库不存在的表");
        when(sourceMetadataService.validateTables(eq("S01"), any()))
                .thenReturn(Collections.singletonList(invalid));

        SubscriptionEditOpenVO vo = service.editOpen("SUB001");

        assertEquals("CHECKED", vo.getSourceTableCheck());
        assertTrue(vo.isSourceReachable());
        assertEquals(Collections.singletonList("SCHEMA_A.GONE"), vo.getInvalidTables());
        assertEquals(1, vo.getTablesBySchema().size());
    }

    @Test
    void editOpen_sourceUnreachable_marksUnreachable() {
        when(dataSubscribeMapper.selectOne(any())).thenReturn(row);
        when(subscriptionDataSourceMapper.selectList(any())).thenReturn(Arrays.asList(
                ref("S01", "机构A", "SOURCE", "1"),
                ref("T01", "机构B", "TARGET", "1")));
        when(sourceMetadataService.probeReachable("S01")).thenReturn(false);

        SubscriptionEditOpenVO vo = service.editOpen("SUB001");

        assertEquals("UNREACHABLE", vo.getSourceTableCheck());
        assertFalse(vo.isSourceReachable());
        assertTrue(vo.getInvalidTables().isEmpty());
    }

    @Test
    void editOpen_sourceRefInactive_skipsCheck() {
        when(dataSubscribeMapper.selectOne(any())).thenReturn(row);
        when(subscriptionDataSourceMapper.selectList(any())).thenReturn(Arrays.asList(
                ref("S01", "机构A", "SOURCE", "0"),
                ref("T01", "机构B", "TARGET", "1")));

        SubscriptionEditOpenVO vo = service.editOpen("SUB001");

        assertEquals("SKIPPED", vo.getSourceTableCheck());
        assertFalse(vo.isSourceReachable());
    }

    // ---- 编辑保存 ---- //

    @Test
    void update_preserve_doesNotRewriteDataSourceTable() {
        SubscriptionSaveDTO dto = validDto();
        dto.setSourceSelectionMode("PRESERVE");
        dto.setSourceTables(null);
        when(dataSubscribeMapper.selectOne(any())).thenReturn(row);
        when(subscriptionDataSourceMapper.selectOne(any()))
                .thenReturn(ref("S01", "机构A", "SOURCE", "1"),
                        ref("T01", "机构B", "TARGET", "1"));
        when(dataSubscribeMapper.update(eq(null), any())).thenReturn(1);

        service.update("SUB001", dto);

        ArgumentCaptor<LambdaUpdateWrapper<DataSubscribe>> captor =
                ArgumentCaptor.forClass(LambdaUpdateWrapper.class);
        verify(dataSubscribeMapper).update(eq(null), captor.capture());
        String sqlSet = captor.getValue().getSqlSet();
        assertTrue(sqlSet.contains("DATA_SUB_DESC"));
        assertTrue(sqlSet.contains("DATA_TO_SOURCE_ID"));
        assertTrue(sqlSet.contains("UPDATE_TIME = SYSDATE"));
        assertFalse(sqlSet.contains("DATA_SOURCE_TABLE"), "PRESERVE 不得重写 DATA_SOURCE_TABLE");
        verify(sourceMetadataService, never()).validateTables(any(), any());
    }

    @Test
    void update_preserve_sourceChangedConcurrently_returns40312() {
        SubscriptionSaveDTO dto = validDto();
        dto.setSourceSelectionMode("PRESERVE");
        dto.setSourceTables(null);
        DataSubscribe changed = newRow("SUB001", "S02", "T01");
        when(dataSubscribeMapper.selectOne(any())).thenReturn(row, changed);
        when(subscriptionDataSourceMapper.selectOne(any()))
                .thenReturn(ref("S01", "机构A", "SOURCE", "1"),
                        ref("T01", "机构B", "TARGET", "1"));

        SubscriptionValidationException e =
                assertThrows(SubscriptionValidationException.class, () -> service.update("SUB001", dto));
        ValidationErrorVO item = errorByCode(e, "40312");
        assertNotNull(item);
        assertEquals("dataFromSourceId", item.getField());
        assertTrue(item.getMessage().contains("有限编辑模式下源库不能变更"));
        verify(dataSubscribeMapper, never()).update(eq(null), any());
    }

    @Test
    void update_replace_setsDataSourceTable() {
        SubscriptionSaveDTO dto = validDto();
        dto.setSourceSelectionMode("REPLACE");
        when(dataSubscribeMapper.selectOne(any())).thenReturn(row);
        when(subscriptionDataSourceMapper.selectOne(any()))
                .thenReturn(ref("S01", "机构A", "SOURCE", "1"),
                        ref("T01", "机构B", "TARGET", "1"));
        when(sourceMetadataService.validateTables(eq("S01"), any())).thenReturn(Collections.emptyList());
        when(dataSubscribeMapper.update(eq(null), any())).thenReturn(1);

        service.update("SUB001", dto);

        ArgumentCaptor<LambdaUpdateWrapper<DataSubscribe>> captor =
                ArgumentCaptor.forClass(LambdaUpdateWrapper.class);
        verify(dataSubscribeMapper).update(eq(null), captor.capture());
        assertTrue(captor.getValue().getSqlSet().contains("DATA_SOURCE_TABLE"));
    }

    @Test
    void update_replace_validateTablesErrors_throwAsValidation() {
        SubscriptionSaveDTO dto = validDto();
        dto.setSourceSelectionMode("REPLACE");
        when(dataSubscribeMapper.selectOne(any())).thenReturn(row);
        when(subscriptionDataSourceMapper.selectOne(any()))
                .thenReturn(ref("S01", "机构A", "SOURCE", "1"),
                        ref("T01", "机构B", "TARGET", "1"));
        when(sourceMetadataService.validateTables(eq("S01"), any()))
                .thenReturn(Collections.singletonList(
                        errorItem("40330", "sourceTables", "SCHEMA_A.GONE", "源表中存在当前源库不存在的表")));

        SubscriptionValidationException e =
                assertThrows(SubscriptionValidationException.class, () -> service.update("SUB001", dto));
        assertEquals(1, e.getValidationErrors().size());
    }

    @Test
    void update_anomaly_throws40350() {
        row.setDataFromSourceId("S01,S02");
        when(dataSubscribeMapper.selectOne(any())).thenReturn(row);

        BusinessException e = assertThrows(BusinessException.class, () -> service.update("SUB001", validDto()));
        assertEquals(40350, e.getCode());
    }

    @Test
    void update_notFound_throws40430() {
        when(dataSubscribeMapper.selectOne(any())).thenReturn(null);

        BusinessException e = assertThrows(BusinessException.class, () -> service.update("NOPE", validDto()));
        assertEquals(40430, e.getCode());
    }

    @Test
    void update_updateReturnsZero_throws40430() {
        SubscriptionSaveDTO dto = validDto();
        dto.setSourceSelectionMode("REPLACE");
        when(dataSubscribeMapper.selectOne(any())).thenReturn(row);
        when(subscriptionDataSourceMapper.selectOne(any()))
                .thenReturn(ref("S01", "机构A", "SOURCE", "1"),
                        ref("T01", "机构B", "TARGET", "1"));
        when(sourceMetadataService.validateTables(eq("S01"), any())).thenReturn(Collections.emptyList());
        when(dataSubscribeMapper.update(eq(null), any())).thenReturn(0);

        BusinessException e = assertThrows(BusinessException.class, () -> service.update("SUB001", dto));
        assertEquals(40430, e.getCode());
    }

    @Test
    void update_updateReturnsMoreThanOne_throws50040() {
        SubscriptionSaveDTO dto = validDto();
        dto.setSourceSelectionMode("REPLACE");
        when(dataSubscribeMapper.selectOne(any())).thenReturn(row);
        when(subscriptionDataSourceMapper.selectOne(any()))
                .thenReturn(ref("S01", "机构A", "SOURCE", "1"),
                        ref("T01", "机构B", "TARGET", "1"));
        when(sourceMetadataService.validateTables(eq("S01"), any())).thenReturn(Collections.emptyList());
        when(dataSubscribeMapper.update(eq(null), any())).thenReturn(2);

        BusinessException e = assertThrows(BusinessException.class, () -> service.update("SUB001", dto));
        assertEquals(50040, e.getCode());
    }

    @Test
    void update_missingMode_throwsBadRequest() {
        SubscriptionSaveDTO dto = validDto();
        dto.setSourceSelectionMode(null);
        when(dataSubscribeMapper.selectOne(any())).thenReturn(row);

        BadRequestException e = assertThrows(BadRequestException.class, () -> service.update("SUB001", dto));
        assertTrue(e.getMessage().contains("sourceSelectionMode 不能为空"));
    }

    @Test
    void update_invalidMode_throwsBadRequest() {
        SubscriptionSaveDTO dto = validDto();
        dto.setSourceSelectionMode("MERGE");
        when(dataSubscribeMapper.selectOne(any())).thenReturn(row);

        BadRequestException e = assertThrows(BadRequestException.class, () -> service.update("SUB001", dto));
        assertEquals("sourceSelectionMode 只能为 PRESERVE 或 REPLACE", e.getMessage());
    }

    @Test
    void update_nullDto_throwsBadRequest() {
        BadRequestException e = assertThrows(BadRequestException.class, () -> service.update("SUB001", null));
        assertEquals("请求体不能为空", e.getMessage());
    }

    // ---- 删除预览 ---- //

    @Test
    void deletePreview_anomaly_throws40353() {
        row.setDataFromSourceId("S01,S02");
        when(dataSubscribeMapper.selectOne(any())).thenReturn(row);

        BusinessException e = assertThrows(BusinessException.class, () -> service.deletePreview("SUB001"));
        assertEquals(40353, e.getCode());
    }

    @Test
    void deletePreview_notFound_throws40430() {
        when(dataSubscribeMapper.selectOne(any())).thenReturn(null);

        BusinessException e = assertThrows(BusinessException.class, () -> service.deletePreview("NOPE"));
        assertEquals(40430, e.getCode());
    }

    @Test
    void deletePreview_normal_returnsCountsWithoutVersionToken() {
        when(dataSubscribeMapper.selectOne(any())).thenReturn(row);
        when(subscriptionDataSourceMapper.selectList(any())).thenReturn(Arrays.asList(
                ref("S01", "机构A", "SOURCE", "1"),
                ref("T01", "机构B", "TARGET", "1")));

        SubscriptionDeletePreviewVO vo = service.deletePreview("SUB001");

        assertEquals("SUB001", vo.getDataSubId());
        assertEquals(1, vo.getSchemaCount());
        assertEquals(1, vo.getTableCount());
        assertEquals(1, vo.getTargets().size());
    }

    // ---- 物理删除 ---- //

    @Test
    void delete_success_removesByPrimaryKey() {
        when(dataSubscribeMapper.selectOne(any())).thenReturn(row);
        when(dataSubscribeMapper.delete(any())).thenReturn(1);

        service.delete("SUB001");

        verify(dataSubscribeMapper).delete(any());
    }

    @Test
    void delete_anomaly_throws40351() {
        row.setDataFromSourceId("S01,S02");
        when(dataSubscribeMapper.selectOne(any())).thenReturn(row);

        BusinessException e = assertThrows(BusinessException.class, () -> service.delete("SUB001"));
        assertEquals(40351, e.getCode());
    }

    @Test
    void delete_notFound_throws40430() {
        when(dataSubscribeMapper.selectOne(any())).thenReturn(null);

        BusinessException e = assertThrows(BusinessException.class, () -> service.delete("NOPE"));
        assertEquals(40430, e.getCode());
    }

    @Test
    void delete_deleteReturnsZero_throws40430() {
        when(dataSubscribeMapper.selectOne(any())).thenReturn(row);
        when(dataSubscribeMapper.delete(any())).thenReturn(0);

        BusinessException e = assertThrows(BusinessException.class, () -> service.delete("SUB001"));
        assertEquals(40430, e.getCode());
    }

    @Test
    void delete_deleteReturnsMoreThanOne_throws50041() {
        when(dataSubscribeMapper.selectOne(any())).thenReturn(row);
        when(dataSubscribeMapper.delete(any())).thenReturn(2);

        BusinessException e = assertThrows(BusinessException.class, () -> service.delete("SUB001"));
        assertEquals(50041, e.getCode());
    }

    // ---- 无并发令牌 / 行锁 ---- //

    @Test
    void noConcurrencyVersionTokenOrRowLockFields() throws Exception {
        assertNoConcurrencyField(SubscriptionSaveDTO.class);
        assertNoConcurrencyField(SubscriptionDetailVO.class);
        assertNoConcurrencyField(SubscriptionEditOpenVO.class);
        assertNoConcurrencyField(SubscriptionDeletePreviewVO.class);
        assertNoConcurrencyField(SubscriptionRowVO.class);
        assertNoConcurrencyField(SubscriptionQuery.class);
    }

    // ---- 主键 IdType.INPUT ---- //

    @Test
    void dataSubscribe_usesTableIdInputWithDataSubId() throws Exception {
        Field field = DataSubscribe.class.getDeclaredField("dataSubId");
        TableId tableId = field.getAnnotation(TableId.class);
        assertNotNull(tableId);
        assertEquals("DATA_SUB_ID", tableId.value());
        assertEquals(IdType.INPUT, tableId.type());
    }

    @Test
    void errorCodes_haveNoConcurrentModified40910() throws Exception {
        assertFalse(containsConstant(40910), "不得残留 40910 并发修改错误码");
    }

    // ---- helpers ---- //

    private DataSubscribe newRow(String id, String from, String to) {
        DataSubscribe r = new DataSubscribe();
        r.setDataSubId(id);
        r.setDataSubDesc("订阅描述");
        r.setDataFromSourceId(from);
        r.setDataToSourceId(to);
        r.setDataSourceTable(from + ".SCHEMA_A.TABLE_1");
        r.setFgActive("1");
        return r;
    }

    private SubscriptionSaveDTO validDto() {
        SubscriptionSaveDTO dto = new SubscriptionSaveDTO();
        dto.setDataSubDesc("订阅描述");
        dto.setDataFromSourceId("S01");
        dto.setDataToSourceIds(Arrays.asList("T01", "T02"));
        dto.setSourceSelectionMode("REPLACE");
        dto.setSourceTables(Arrays.asList(
                new SourceTableInput("SCHEMA_A", "TABLE_1"),
                new SourceTableInput("SCHEMA_A", "TABLE_2")));
        return dto;
    }

    private static DataSourceRef ref(String id, String org, String category, String active) {
        DataSourceRef ref = new DataSourceRef();
        ref.setDataSourceId(id);
        ref.setDataSourceOrg(org);
        ref.setDataSourceCategory(category);
        ref.setFgActive(active);
        return ref;
    }

    private static ValidationErrorVO errorItem(String code, String field, String name, String message) {
        ValidationErrorVO vo = new ValidationErrorVO();
        vo.setErrorCode(code);
        vo.setField(field);
        vo.setName(name);
        vo.setMessage(message);
        return vo;
    }

    private static ValidationErrorVO errorByCode(SubscriptionValidationException e, String code) {
        for (ValidationErrorVO item : e.getValidationErrors()) {
            if (code.equals(item.getErrorCode())) {
                return item;
            }
        }
        return null;
    }

    private static void assertNoConcurrencyField(Class<?> type) throws Exception {
        for (Field field : type.getDeclaredFields()) {
            String name = field.getName().toLowerCase();
            assertFalse(name.contains("version"), type.getSimpleName() + " 不得包含版本令牌字段: " + field.getName());
            assertFalse(name.contains("token"), type.getSimpleName() + " 不得包含令牌字段: " + field.getName());
            assertFalse(name.contains("fingerprint"), type.getSimpleName() + " 不得包含指纹字段: " + field.getName());
            assertFalse(name.contains("lock"), type.getSimpleName() + " 不得包含行锁字段: " + field.getName());
        }
    }

    private static boolean containsConstant(int value) throws Exception {
        for (Field field : SubscriptionErrorCode.class.getDeclaredFields()) {
            if (java.lang.reflect.Modifier.isStatic(field.getModifiers())
                    && java.lang.reflect.Modifier.isFinal(field.getModifiers())
                    && field.getType() == int.class && field.getInt(null) == value) {
                return true;
            }
        }
        return false;
    }
}
