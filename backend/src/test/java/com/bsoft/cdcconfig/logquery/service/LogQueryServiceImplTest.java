package com.bsoft.cdcconfig.logquery.service;

import com.bsoft.cdcconfig.common.exception.BusinessException;
import com.bsoft.cdcconfig.logquery.config.LogQueryProperties;
import com.bsoft.cdcconfig.logquery.cursor.LogCursorBoundary;
import com.bsoft.cdcconfig.logquery.cursor.LogCursorCodec;
import com.bsoft.cdcconfig.logquery.cursor.LogCursorConditionMismatchException;
import com.bsoft.cdcconfig.logquery.cursor.LogCursorInvalidException;
import com.bsoft.cdcconfig.logquery.dto.LogListQuery;
import com.bsoft.cdcconfig.logquery.exception.LogQueryBadRequestException;
import com.bsoft.cdcconfig.logquery.exception.LogQueryErrorCode;
import com.bsoft.cdcconfig.logquery.mapper.DataSourceRow;
import com.bsoft.cdcconfig.logquery.mapper.LogDetailRow;
import com.bsoft.cdcconfig.logquery.mapper.LogListRow;
import com.bsoft.cdcconfig.logquery.mapper.LogQueryMapper;
import com.bsoft.cdcconfig.logquery.mapper.RawMessageRow;
import com.bsoft.cdcconfig.logquery.service.impl.LogQueryServiceImpl;
import com.bsoft.cdcconfig.logquery.vo.DataSourceOptionVO;
import com.bsoft.cdcconfig.logquery.vo.DataSourceOptionsVO;
import com.bsoft.cdcconfig.logquery.vo.LogDetailVO;
import com.bsoft.cdcconfig.logquery.vo.LogListResponse;
import com.bsoft.cdcconfig.logquery.vo.LogListVO;
import com.bsoft.cdcconfig.logquery.vo.LogQueryStatusVO;
import com.bsoft.cdcconfig.logquery.vo.RawMessageVO;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.dao.QueryTimeoutException;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
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
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.times;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.verifyNoInteractions;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class LogQueryServiceImplTest {

    private static final DateTimeFormatter TIME_FORMAT =
            DateTimeFormatter.ofPattern("yyyy-MM-dd HH:mm:ss");

    @Mock
    private LogQueryMapper mapper;

    @Mock
    private LogCursorCodec cursorCodec;

    @Mock
    private LogQueryProperties properties;

    @InjectMocks
    private LogQueryServiceImpl service;

    @BeforeEach
    void setUp() {
    }

    // ============ 时间范围（§12-3 / §12-4） ============

    @Test
    void searchLogs_missingStartTime_shouldThrowTimeRangeRequired() {
        LogListQuery q = query();
        q.setStartTime(null);
        BusinessException ex = assertThrows(BusinessException.class, () -> service.searchLogs(q));
        assertEquals(LogQueryErrorCode.TIME_RANGE_REQUIRED, ex.getCode());
    }

    @Test
    void searchLogs_missingEndTime_shouldThrowTimeRangeRequired() {
        LogListQuery q = query();
        q.setEndTime(null);
        BusinessException ex = assertThrows(BusinessException.class, () -> service.searchLogs(q));
        assertEquals(LogQueryErrorCode.TIME_RANGE_REQUIRED, ex.getCode());
    }

    @Test
    void searchLogs_invalidTimeFormat_shouldThrowTimeRangeRequired() {
        LogListQuery q = query();
        q.setStartTime("2026/08/14 00:00:00");
        BusinessException ex = assertThrows(BusinessException.class, () -> service.searchLogs(q));
        assertEquals(LogQueryErrorCode.TIME_RANGE_REQUIRED, ex.getCode());
    }

    @Test
    void searchLogs_startAfterEnd_shouldThrowTimeOrderInvalid() {
        LogListQuery q = query();
        q.setStartTime("2026-08-20 00:00:00");
        q.setEndTime("2026-08-14 00:00:00");
        BusinessException ex = assertThrows(BusinessException.class, () -> service.searchLogs(q));
        assertEquals(LogQueryErrorCode.TIME_ORDER_INVALID, ex.getCode());
    }

    @Test
    void searchLogs_fullSevenDays_shouldPass() {
        when(mapper.selectAllDataSources()).thenReturn(defaultDataSourceRows());
        when(mapper.selectLogList(any(), any(), any(), any(), any(), any(), any(), any(), any()))
                .thenReturn(Collections.emptyList());

        LogListQuery q = query();
        q.setStartTime("2026-08-14 00:00:00");
        q.setEndTime("2026-08-20 23:59:59"); // endExclusive = 2026-08-21 00:00:00, exactly 7 days

        LogListResponse r = service.searchLogs(q);
        assertNotNull(r);
        assertFalse(r.isHasNext());
    }

    @Test
    void searchLogs_sevenDaysPlusOneSecond_shouldThrowTimeSpanExceeded() {
        LogListQuery q = query();
        q.setStartTime("2026-08-14 00:00:00");
        q.setEndTime("2026-08-21 00:00:00"); // endExclusive = +1s, exceeds 7 days
        BusinessException ex = assertThrows(BusinessException.class, () -> service.searchLogs(q));
        assertEquals(LogQueryErrorCode.TIME_SPAN_EXCEEDED, ex.getCode());
    }

    // ============ R1-01：严格自然日期（LQ-API-32） ============

    @Test
    void searchLogs_feb30_shouldThrowTimeRangeRequired() {
        LogListQuery q = query();
        q.setStartTime("2026-02-30 12:00:00");
        BusinessException ex = assertThrows(BusinessException.class, () -> service.searchLogs(q));
        assertEquals(LogQueryErrorCode.TIME_RANGE_REQUIRED, ex.getCode());
    }

    @Test
    void searchLogs_nonLeapFeb29_shouldThrowTimeRangeRequired() {
        LogListQuery q = query();
        q.setStartTime("2025-02-29 12:00:00");
        BusinessException ex = assertThrows(BusinessException.class, () -> service.searchLogs(q));
        assertEquals(LogQueryErrorCode.TIME_RANGE_REQUIRED, ex.getCode());
    }

    @Test
    void searchLogs_otherImpossibleDates_shouldThrowTimeRangeRequired() {
        LogListQuery q = query();
        q.setStartTime("2026-04-31 00:00:00");
        assertThrows(BusinessException.class, () -> service.searchLogs(q));
        q.setStartTime("2026-13-01 00:00:00");
        assertThrows(BusinessException.class, () -> service.searchLogs(q));
        q.setStartTime("2026-08-20 24:00:00");
        assertThrows(BusinessException.class, () -> service.searchLogs(q));
        q.setStartTime("2026-08-20 10:60:00");
        assertThrows(BusinessException.class, () -> service.searchLogs(q));
        q.setStartTime("2026-08-20 10:00:60");
        assertThrows(BusinessException.class, () -> service.searchLogs(q));
    }

    @Test
    void searchLogs_validLeapDay_shouldPass() {
        when(mapper.selectAllDataSources()).thenReturn(defaultDataSourceRows());
        when(mapper.selectLogList(any(), any(), any(), any(), any(), any(), any(), any(), any()))
                .thenReturn(Collections.emptyList());

        LogListQuery q = query();
        q.setStartTime("2024-02-29 00:00:00");
        q.setEndTime("2024-02-29 23:59:59");

        LogListResponse r = service.searchLogs(q);
        assertNotNull(r);
        assertFalse(r.isHasNext());
    }

    // ============ 日志类型（§12-6） ============

    @Test
    void searchLogs_invalidLogType_shouldThrowLogTypeInvalid() {
        LogListQuery q = query();
        q.setLogType("INVALID");
        BusinessException ex = assertThrows(BusinessException.class, () -> service.searchLogs(q));
        assertEquals(LogQueryErrorCode.LOG_TYPE_INVALID, ex.getCode());
        verify(mapper, never()).selectAllDataSources();
    }

    // ============ 可选条件（§12-5） ============

    @Test
    void searchLogs_optionalConditions_arePassedNormalizedToMapper() throws Exception {
        when(mapper.selectAllDataSources()).thenReturn(defaultDataSourceRows());
        when(mapper.selectLogList(any(), any(), any(), any(), any(), any(), any(), any(), any()))
                .thenReturn(Collections.emptyList());

        LogListQuery q = query();
        q.setSourceDataSourceIds(Arrays.asList("DS_SRC_001", "DS_SRC_001")); // dupe -> dedupe
        q.setSourceTableName("  T_ORDER  "); // trim
        q.setTargetDataSourceIds(Collections.singletonList("DS_TGT_001"));
        q.setTargetTableName("ODS_ORDER");

        service.searchLogs(q);

        @SuppressWarnings("unchecked")
        ArgumentCaptor<List<String>> srcIds = ArgumentCaptor.forClass(List.class);
        @SuppressWarnings("unchecked")
        ArgumentCaptor<List<String>> tgtIds = ArgumentCaptor.forClass(List.class);
        ArgumentCaptor<String> srcTable = ArgumentCaptor.forClass(String.class);
        ArgumentCaptor<String> tgtTable = ArgumentCaptor.forClass(String.class);
        verify(mapper).selectLogList(eq("CDC_LOG_ERROR"),
                any(), any(),
                srcIds.capture(), srcTable.capture(),
                tgtIds.capture(), tgtTable.capture(),
                any(), any());
        assertEquals(Collections.singletonList("DS_SRC_001"), srcIds.getValue());
        assertEquals("T_ORDER", srcTable.getValue());
        assertEquals(Collections.singletonList("DS_TGT_001"), tgtIds.getValue());
        assertEquals("ODS_ORDER", tgtTable.getValue());
    }

    @Test
    void searchLogs_emptyArrays_areTreatedAsUnselected() {
        when(mapper.selectAllDataSources()).thenReturn(defaultDataSourceRows());
        when(mapper.selectLogList(any(), any(), any(), any(), any(), any(), any(), any(), any()))
                .thenReturn(Collections.emptyList());

        LogListQuery q = query();
        q.setSourceDataSourceIds(Collections.emptyList());
        q.setTargetDataSourceIds(Collections.emptyList());
        q.setSourceTableName("");
        q.setTargetTableName("   ");

        LogListResponse r = service.searchLogs(q);
        assertNotNull(r);
    }

    @Test
    void searchLogs_dataSourceIdArrayOver100_shouldThrowDataSourcesInvalid() {
        List<String> ids = new ArrayList<>();
        for (int i = 0; i < 101; i++) {
            ids.add("ID_" + i);
        }
        LogListQuery q = query();
        q.setSourceDataSourceIds(ids);
        BusinessException ex = assertThrows(BusinessException.class, () -> service.searchLogs(q));
        assertEquals(LogQueryErrorCode.DATA_SOURCE_IDS_INVALID, ex.getCode());
    }

    @Test
    void searchLogs_dataSourceIdBlankElement_shouldThrowDataSourcesInvalid() {
        LogListQuery q = query();
        q.setSourceDataSourceIds(Collections.singletonList("  "));
        BusinessException ex = assertThrows(BusinessException.class, () -> service.searchLogs(q));
        assertEquals(LogQueryErrorCode.DATA_SOURCE_IDS_INVALID, ex.getCode());
    }

    @Test
    void searchLogs_selectedIdNotInCandidates_shouldThrowDataSourcesInvalid() {
        when(mapper.selectAllDataSources()).thenReturn(defaultDataSourceRows());
        LogListQuery q = query();
        q.setSourceDataSourceIds(Collections.singletonList("DS_NOT_EXIST"));
        BusinessException ex = assertThrows(BusinessException.class, () -> service.searchLogs(q));
        assertEquals(LogQueryErrorCode.DATA_SOURCE_IDS_INVALID, ex.getCode());
    }

    @Test
    void searchLogs_selectedInactiveId_shouldThrowDataSourcesInvalid() {
        when(mapper.selectAllDataSources()).thenReturn(defaultDataSourceRows());
        LogListQuery q = query();
        q.setTargetDataSourceIds(Collections.singletonList("DS_INACTIVE"));
        BusinessException ex = assertThrows(BusinessException.class, () -> service.searchLogs(q));
        assertEquals(LogQueryErrorCode.DATA_SOURCE_IDS_INVALID, ex.getCode());
    }

    @Test
    void searchLogs_tableNameOver64_shouldThrowTableNameInvalid() {
        StringBuilder sb = new StringBuilder();
        for (int i = 0; i < 65; i++) {
            sb.append('A');
        }
        LogListQuery q = query();
        q.setSourceTableName(sb.toString());
        BusinessException ex = assertThrows(BusinessException.class, () -> service.searchLogs(q));
        assertEquals(LogQueryErrorCode.TABLE_NAME_INVALID, ex.getCode());
    }

    // ============ 数据源一次全表读取，无 N+1（§12-15） ============

    @Test
    void searchLogs_readsDataSourceTableExactlyOnce() {
        when(mapper.selectAllDataSources()).thenReturn(defaultDataSourceRows());
        when(mapper.selectLogList(any(), any(), any(), any(), any(), any(), any(), any(), any()))
                .thenReturn(Collections.emptyList());

        service.searchLogs(query());

        verify(mapper, times(1)).selectAllDataSources();
        verify(mapper, times(1)).selectLogList(any(), any(), any(), any(), any(), any(), any(), any(), any());
        verify(mapper, never()).selectLogDetail(any(), any());
        verify(mapper, never()).selectRawMessage(any(), any());
    }

    // ============ 名称映射与降级（§12-16） ============

    @Test
    void searchLogs_nullSourceId_omitsIdAndName() {
        when(mapper.selectAllDataSources()).thenReturn(defaultDataSourceRows());
        LogListRow row = listRow();
        row.setSourceDataSourceId(null);
        row.setTargetDataSourceId(null);
        when(mapper.selectLogList(any(), any(), any(), any(), any(), any(), any(), any(), any()))
                .thenReturn(Collections.singletonList(row));

        LogListResponse r = service.searchLogs(query());
        LogListVO vo = r.getItems().get(0);
        assertNull(vo.getSourceDataSourceId());
        assertNull(vo.getSourceDataSourceName());
        assertNull(vo.getTargetDataSourceId());
        assertNull(vo.getTargetDataSourceName());
    }

    @Test
    void searchLogs_foundOrg_usesOrgAsName() {
        when(mapper.selectAllDataSources()).thenReturn(defaultDataSourceRows());
        LogListRow row = listRow();
        row.setSourceDataSourceId("DS_SRC_001");
        row.setTargetDataSourceId("DS_TGT_001");
        when(mapper.selectLogList(any(), any(), any(), any(), any(), any(), any(), any(), any()))
                .thenReturn(Collections.singletonList(row));

        LogListResponse r = service.searchLogs(query());
        LogListVO vo = r.getItems().get(0);
        assertEquals("业务库-订单", vo.getSourceDataSourceName());
        assertEquals("数仓ODS", vo.getTargetDataSourceName());
    }

    @Test
    void searchLogs_foundBlankOrg_showsUndefinedName() {
        when(mapper.selectAllDataSources()).thenReturn(defaultDataSourceRows());
        LogListRow row = listRow();
        row.setTargetDataSourceId("DS_NO_NAME"); // org blank
        when(mapper.selectLogList(any(), any(), any(), any(), any(), any(), any(), any(), any()))
                .thenReturn(Collections.singletonList(row));

        LogListResponse r = service.searchLogs(query());
        assertEquals("未定义名称", r.getItems().get(0).getTargetDataSourceName());
    }

    @Test
    void searchLogs_notFound_showsRawIdAsName() {
        when(mapper.selectAllDataSources()).thenReturn(defaultDataSourceRows());
        LogListRow row = listRow();
        row.setSourceDataSourceId("DS_MISSING");
        when(mapper.selectLogList(any(), any(), any(), any(), any(), any(), any(), any(), any()))
                .thenReturn(Collections.singletonList(row));

        LogListResponse r = service.searchLogs(query());
        LogListVO vo = r.getItems().get(0);
        assertEquals("DS_MISSING", vo.getSourceDataSourceId());
        assertEquals("DS_MISSING", vo.getSourceDataSourceName());
    }

    // ============ 100 / 101 边界（§12-9 / §12-21） ============

    @Test
    void searchLogs_101Rows_hasNextTrue_returns100_andEncodesCursorFrom100thRow() {
        when(mapper.selectAllDataSources()).thenReturn(defaultDataSourceRows());
        List<LogListRow> rows = new ArrayList<>();
        for (int i = 1; i <= 101; i++) {
            rows.add(listRow(i));
        }
        when(mapper.selectLogList(any(), any(), any(), any(), any(), any(), any(), any(), any()))
                .thenReturn(rows);
        when(cursorCodec.encode(anyString(), anyString(), any(), any())).thenReturn("CURSOR");

        LogListResponse r = service.searchLogs(query());

        assertTrue(r.isHasNext());
        assertEquals(100, r.getItems().size());
        assertEquals("CURSOR", r.getNextCursor());

        ArgumentCaptor<LocalDateTime> timeCaptor = ArgumentCaptor.forClass(LocalDateTime.class);
        ArgumentCaptor<BigDecimal> idCaptor = ArgumentCaptor.forClass(BigDecimal.class);
        verify(cursorCodec).encode(anyString(), anyString(), timeCaptor.capture(), idCaptor.capture());
        assertEquals(rows.get(99).getTargetTime(), timeCaptor.getValue());
        assertEquals(rows.get(99).getCdcLogId(), idCaptor.getValue());
        assertEquals("100", r.getItems().get(99).getCdcLogId());
    }

    @Test
    void searchLogs_100Rows_hasNextFalse_noNextCursor() {
        when(mapper.selectAllDataSources()).thenReturn(defaultDataSourceRows());
        List<LogListRow> rows = new ArrayList<>();
        for (int i = 1; i <= 100; i++) {
            rows.add(listRow(i));
        }
        when(mapper.selectLogList(any(), any(), any(), any(), any(), any(), any(), any(), any()))
                .thenReturn(rows);

        LogListResponse r = service.searchLogs(query());

        assertFalse(r.isHasNext());
        assertEquals(100, r.getItems().size());
        assertNull(r.getNextCursor());
        verify(cursorCodec, never()).encode(any(), any(), any(), any());
    }

    @Test
    void searchLogs_cdcLogId_isAlwaysStringInResponse() {
        when(mapper.selectAllDataSources()).thenReturn(defaultDataSourceRows());
        LogListRow row = listRow(7755033852453421056L);
        when(mapper.selectLogList(any(), any(), any(), any(), any(), any(), any(), any(), any()))
                .thenReturn(Collections.singletonList(row));

        LogListResponse r = service.searchLogs(query());
        assertEquals("7755033852453421056", r.getItems().get(0).getCdcLogId());
    }

    // ============ 游标（§12-12） ============

    @Test
    void searchLogs_validCursor_passesBoundaryToMapper() {
        when(mapper.selectAllDataSources()).thenReturn(defaultDataSourceRows());
        LocalDateTime boundaryTime = LocalDateTime.parse("2026-08-20 10:00:00", TIME_FORMAT);
        BigDecimal boundaryId = new BigDecimal("1234567890123456789");
        when(cursorCodec.decodeAndVerify(anyString(), eq("error"), anyString()))
                .thenReturn(new LogCursorBoundary(boundaryTime, boundaryId));
        when(mapper.selectLogList(any(), any(), any(), any(), any(), any(), any(), any(), any()))
                .thenReturn(Collections.emptyList());

        LogListQuery q = query();
        q.setCursor("payload.signature");
        service.searchLogs(q);

        ArgumentCaptor<LocalDateTime> timeCaptor = ArgumentCaptor.forClass(LocalDateTime.class);
        ArgumentCaptor<BigDecimal> idCaptor = ArgumentCaptor.forClass(BigDecimal.class);
        verify(mapper).selectLogList(eq("CDC_LOG_ERROR"),
                any(), any(), any(), any(), any(), any(),
                timeCaptor.capture(), idCaptor.capture());
        assertEquals(boundaryTime, timeCaptor.getValue());
        assertEquals(boundaryId, idCaptor.getValue());
    }

    @Test
    void searchLogs_cursorInvalid_shouldThrowCursorInvalid() {
        when(mapper.selectAllDataSources()).thenReturn(defaultDataSourceRows());
        when(cursorCodec.decodeAndVerify(anyString(), eq("error"), anyString()))
                .thenThrow(new LogCursorInvalidException("tampered"));
        LogListQuery q = query();
        q.setCursor("bad.cursor");
        BusinessException ex = assertThrows(BusinessException.class, () -> service.searchLogs(q));
        assertEquals(LogQueryErrorCode.CURSOR_INVALID, ex.getCode());
    }

    @Test
    void searchLogs_cursorConditionMismatch_shouldThrowConditionMismatch() {
        when(mapper.selectAllDataSources()).thenReturn(defaultDataSourceRows());
        when(cursorCodec.decodeAndVerify(anyString(), eq("error"), anyString()))
                .thenThrow(new LogCursorConditionMismatchException("mismatch"));
        LogListQuery q = query();
        q.setCursor("other.condition");
        BusinessException ex = assertThrows(BusinessException.class, () -> service.searchLogs(q));
        assertEquals(LogQueryErrorCode.CURSOR_CONDITION_MISMATCH, ex.getCode());
    }

    // ============ CDC_LOG_ID 无损数值绑定（§12-10 / §12-11） ============

    @Test
    void parseCdcLogId_validLargeValue_returnsExactBigDecimal() {
        BigDecimal id = LogQueryServiceImpl.parseCdcLogId("7755033852453421056");
        assertEquals(0, id.scale());
        assertEquals(new BigDecimal("7755033852453421056"), id);
    }

    @Test
    void parseCdcLogId_greaterThanLongMax_returnsExactBigDecimal() {
        BigDecimal id = LogQueryServiceImpl.parseCdcLogId("9999999999999999999");
        assertEquals(0, id.scale());
        assertEquals(new BigDecimal("9999999999999999999"), id);
    }

    @Test
    void parseCdcLogId_nonDecimal_shouldThrowBadRequest() {
        assertThrows(LogQueryBadRequestException.class,
                () -> LogQueryServiceImpl.parseCdcLogId("abc"));
        assertThrows(LogQueryBadRequestException.class,
                () -> LogQueryServiceImpl.parseCdcLogId("0x1F"));
    }

    @Test
    void parseCdcLogId_withDecimalPoint_shouldThrowBadRequest() {
        assertThrows(LogQueryBadRequestException.class,
                () -> LogQueryServiceImpl.parseCdcLogId("123.0"));
    }

    @Test
    void parseCdcLogId_over19Digits_shouldThrowBadRequest() {
        assertThrows(LogQueryBadRequestException.class,
                () -> LogQueryServiceImpl.parseCdcLogId("123456789012345678901"));
    }

    @Test
    void parseCdcLogId_negative_shouldThrowBadRequest() {
        assertThrows(LogQueryBadRequestException.class,
                () -> LogQueryServiceImpl.parseCdcLogId("-1"));
    }

    @Test
    void getDetail_invalidCdcLogId_shouldThrowBadRequest() {
        assertThrows(LogQueryBadRequestException.class,
                () -> service.getLogDetail("error", "not-a-number"));
    }

    // ============ 详情（§12-17） ============

    @Test
    void getDetail_shouldReadDetailAndMapFields() {
        LogDetailRow row = new LogDetailRow();
        row.setCdcLogId(new BigDecimal("7755033852453421056"));
        row.setSourceDataSourceId("DS_SRC_001");
        row.setSourceTableName("T_ORDER");
        row.setTargetDataSourceId("DS_TGT_001");
        row.setTargetTableName("ODS_ORDER");
        row.setInstructionType("INSERT");
        row.setResultCode("0");
        row.setOffset("123456789012");
        row.setSourceTime(LocalDateTime.parse("2026-08-20 10:00:00", TIME_FORMAT));
        row.setKafkaEnqueueTime(LocalDateTime.parse("2026-08-20 10:00:01", TIME_FORMAT));
        row.setTargetTime(LocalDateTime.parse("2026-08-20 10:00:02", TIME_FORMAT));
        row.setInsertTime(LocalDateTime.parse("2026-08-20 10:00:03", TIME_FORMAT));
        row.setLogDetail("full detail");
        when(mapper.selectLogDetail(eq("CDC_LOG_ERROR"), eq(new BigDecimal("7755033852453421056"))))
                .thenReturn(row);

        LogDetailVO vo = service.getLogDetail("error", "7755033852453421056");

        assertEquals("7755033852453421056", vo.getCdcLogId());
        assertEquals("DS_SRC_001", vo.getSourceDataSourceId());
        assertEquals("0", vo.getResultCode());
        assertEquals("full detail", vo.getLogDetail());
        assertEquals("2026-08-20 10:00:02", vo.getTargetTime());
        verify(mapper, never()).selectRawMessage(any(), any());
    }

    @Test
    void getDetail_notFound_shouldThrow40410() {
        when(mapper.selectLogDetail(any(), any())).thenReturn(null);
        BusinessException ex = assertThrows(BusinessException.class,
                () -> service.getLogDetail("error", "7755033852453421056"));
        assertEquals(LogQueryErrorCode.LOG_RECORD_NOT_FOUND, ex.getCode());
    }

    @Test
    void getDetail_invalidLogType_shouldThrowLogTypeInvalid() {
        BusinessException ex = assertThrows(BusinessException.class,
                () -> service.getLogDetail("BAD", "7755033852453421056"));
        assertEquals(LogQueryErrorCode.LOG_TYPE_INVALID, ex.getCode());
    }

    // ============ 原始消息（§12-17） ============

    @Test
    void getRawMessage_shouldReadOnlyRawMessage() {
        RawMessageRow row = new RawMessageRow();
        row.setCdcLogId(new BigDecimal("7755033852453421056"));
        row.setRawMessage("{\"op\":\"INSERT\"}");
        when(mapper.selectRawMessage(eq("CDC_LOG_CORRECT"), eq(new BigDecimal("7755033852453421056"))))
                .thenReturn(row);

        RawMessageVO vo = service.getRawMessage("correct", "7755033852453421056");

        assertEquals("7755033852453421056", vo.getCdcLogId());
        assertEquals("{\"op\":\"INSERT\"}", vo.getRawMessage());
        verify(mapper, never()).selectLogDetail(any(), any());
    }

    @Test
    void getRawMessage_nullRawMessage_returnsEmptyString() {
        RawMessageRow row = new RawMessageRow();
        row.setCdcLogId(new BigDecimal("1"));
        row.setRawMessage(null);
        when(mapper.selectRawMessage(any(), any())).thenReturn(row);

        RawMessageVO vo = service.getRawMessage("error", "1");
        assertEquals("", vo.getRawMessage());
    }

    @Test
    void getRawMessage_notFound_shouldThrow40410() {
        when(mapper.selectRawMessage(any(), any())).thenReturn(null);
        BusinessException ex = assertThrows(BusinessException.class,
                () -> service.getRawMessage("error", "7755033852453421056"));
        assertEquals(LogQueryErrorCode.LOG_RECORD_NOT_FOUND, ex.getCode());
    }

    // ============ 超时与数据库访问失败（§12-19 / §12-20） ============

    @Test
    void searchLogs_mapperTimeout_shouldMapToQueryTimeout() {
        when(mapper.selectAllDataSources()).thenReturn(defaultDataSourceRows());
        when(mapper.selectLogList(any(), any(), any(), any(), any(), any(), any(), any(), any()))
                .thenThrow(new QueryTimeoutException("statement timeout"));

        BusinessException ex = assertThrows(BusinessException.class, () -> service.searchLogs(query()));
        assertEquals(LogQueryErrorCode.QUERY_TIMEOUT, ex.getCode());
    }

    @Test
    void searchLogs_mapperGenericFailure_shouldMapToDatabaseAccessFailed() {
        when(mapper.selectAllDataSources()).thenReturn(defaultDataSourceRows());
        when(mapper.selectLogList(any(), any(), any(), any(), any(), any(), any(), any(), any()))
                .thenThrow(new IllegalStateException("boom"));

        BusinessException ex = assertThrows(BusinessException.class, () -> service.searchLogs(query()));
        assertEquals(LogQueryErrorCode.DATABASE_ACCESS_FAILED, ex.getCode());
    }

    @Test
    void searchLogs_timeout_doesNotAutoRetry() {
        when(mapper.selectAllDataSources()).thenReturn(defaultDataSourceRows());
        when(mapper.selectLogList(any(), any(), any(), any(), any(), any(), any(), any(), any()))
                .thenThrow(new QueryTimeoutException("statement timeout"));

        assertThrows(BusinessException.class, () -> service.searchLogs(query()));
        verify(mapper, times(1)).selectLogList(any(), any(), any(), any(), any(), any(), any(), any(), any());
    }

    @Test
    void getDataSourceOptions_mapperFailure_shouldMapToDatabaseAccessFailed() {
        when(mapper.selectAllDataSources()).thenThrow(new IllegalStateException("boom"));
        BusinessException ex = assertThrows(BusinessException.class, service::getDataSourceOptions);
        assertEquals(LogQueryErrorCode.DATABASE_ACCESS_FAILED, ex.getCode());
    }

    // ============ 数据源候选（§12-16） ============

    @Test
    void getOptions_filtersActiveAndMatchesCategoryIgnoreCaseAndSorts() {
        when(mapper.selectAllDataSources()).thenReturn(defaultDataSourceRows());
        DataSourceOptionsVO vo = service.getDataSourceOptions();
        assertEquals(2, vo.getSourceList().size());
        assertEquals(2, vo.getTargetList().size());
        // source sorted by org（UTF-16 字典序："会员" < "订单"）
        assertEquals("业务库-会员", vo.getSourceList().get(0).getOrg());
        assertEquals("DS_SRC_002", vo.getSourceList().get(0).getId());
        assertEquals("业务库-订单", vo.getSourceList().get(1).getOrg());
        assertEquals("DS_SRC_001", vo.getSourceList().get(1).getId());
        // category " source " trimmed + ignoreCase matched
        // inactive excluded
        assertFalse(vo.getSourceList().stream().anyMatch(o -> "DS_INACTIVE".equals(o.getId())));
        // null org last (nullsLast)
        assertNull(vo.getTargetList().get(1).getOrg());
        assertEquals("DS_NO_NAME", vo.getTargetList().get(1).getId());
    }

    @Test
    void getOptions_blankOrg_normalizedToNull() {
        List<DataSourceRow> rows = new ArrayList<>();
        rows.add(row("DS_A", "   ", "SOURCE", "1"));
        when(mapper.selectAllDataSources()).thenReturn(rows);
        DataSourceOptionsVO vo = service.getDataSourceOptions();
        assertEquals(1, vo.getSourceList().size());
        assertNull(vo.getSourceList().get(0).getOrg());
    }

    // ============ R1-04：候选同名 / 空名称稳定排序 ============

    @Test
    void getOptions_sameOrg_tieBreakByIdAscending() {
        List<DataSourceRow> rows = new ArrayList<>();
        rows.add(row("DS_B", "共享库", "SOURCE", "1"));
        rows.add(row("DS_A", "共享库", "SOURCE", "1"));
        when(mapper.selectAllDataSources()).thenReturn(rows);

        DataSourceOptionsVO vo = service.getDataSourceOptions();
        assertEquals(2, vo.getSourceList().size());
        assertEquals("DS_A", vo.getSourceList().get(0).getId());
        assertEquals("DS_B", vo.getSourceList().get(1).getId());
    }

    @Test
    void getOptions_nullOrgs_tieBreakByIdAscending() {
        List<DataSourceRow> rows = new ArrayList<>();
        rows.add(row("DS_B", null, "SOURCE", "1"));
        rows.add(row("DS_A", null, "SOURCE", "1"));
        when(mapper.selectAllDataSources()).thenReturn(rows);

        DataSourceOptionsVO vo = service.getDataSourceOptions();
        assertEquals(2, vo.getSourceList().size());
        assertEquals("DS_A", vo.getSourceList().get(0).getId());
        assertEquals("DS_B", vo.getSourceList().get(1).getId());
    }

    @Test
    void getOptions_inputRowOrderChange_outputConsistent() {
        List<DataSourceRow> order1 = new ArrayList<>();
        order1.add(row("DS_B", "共享库", "SOURCE", "1"));
        order1.add(row("DS_C", null, "SOURCE", "1"));
        order1.add(row("DS_A", "共享库", "SOURCE", "1"));

        List<DataSourceRow> order2 = new ArrayList<>();
        order2.add(row("DS_A", "共享库", "SOURCE", "1"));
        order2.add(row("DS_B", "共享库", "SOURCE", "1"));
        order2.add(row("DS_C", null, "SOURCE", "1"));

        when(mapper.selectAllDataSources()).thenReturn(order1);
        DataSourceOptionsVO vo1 = service.getDataSourceOptions();
        when(mapper.selectAllDataSources()).thenReturn(order2);
        DataSourceOptionsVO vo2 = service.getDataSourceOptions();

        List<String> ids1 = new ArrayList<>();
        for (DataSourceOptionVO v : vo1.getSourceList()) {
            ids1.add(v.getId());
        }
        List<String> ids2 = new ArrayList<>();
        for (DataSourceOptionVO v : vo2.getSourceList()) {
            ids2.add(v.getId());
        }
        // 输入行顺序改变时输出仍一致：同名按 ID 升序，空名称放最后
        assertEquals(ids2, ids1);
        assertEquals(Arrays.asList("DS_A", "DS_B", "DS_C"), ids1);
    }

    // ============ 功能开关状态（LQ-API-170/171） ============

    @Test
    void getLogQueryStatus_enabledTrue_returnsTrue_andTouchesNoMapperOrZk() {
        when(properties.isEnabled()).thenReturn(true);

        LogQueryStatusVO vo = service.getLogQueryStatus();

        assertNotNull(vo);
        assertTrue(vo.isEnabled());
        verifyNoInteractions(mapper);
        verifyNoInteractions(cursorCodec);
    }

    @Test
    void getLogQueryStatus_enabledFalse_returnsFalse() {
        when(properties.isEnabled()).thenReturn(false);

        LogQueryStatusVO vo = service.getLogQueryStatus();

        assertNotNull(vo);
        assertFalse(vo.isEnabled());
        verifyNoInteractions(mapper);
        verifyNoInteractions(cursorCodec);
    }

    // ============ helpers ============

    private LogListQuery query() {
        LogListQuery q = new LogListQuery();
        q.setLogType("error");
        q.setStartTime("2026-08-14 00:00:00");
        q.setEndTime("2026-08-20 23:59:59");
        return q;
    }

    private List<DataSourceRow> defaultDataSourceRows() {
        List<DataSourceRow> rows = new ArrayList<>();
        rows.add(row("DS_SRC_001", "业务库-订单", "SOURCE", "1"));
        rows.add(row("DS_SRC_002", "业务库-会员", " source ", "1"));
        rows.add(row("DS_TGT_001", "数仓ODS", "TARGET", "1"));
        rows.add(row("DS_INACTIVE", "停用库", "SOURCE", "0"));
        rows.add(row("DS_NO_NAME", null, "TARGET", "1"));
        return rows;
    }

    private DataSourceRow row(String id, String org, String category, String fgActive) {
        DataSourceRow r = new DataSourceRow();
        r.setDataSourceId(id);
        r.setDataSourceOrg(org);
        r.setDataSourceCategory(category);
        r.setFgActive(fgActive);
        return r;
    }

    private LogListRow listRow() {
        return listRow(1L);
    }

    private LogListRow listRow(long id) {
        LogListRow row = new LogListRow();
        row.setCdcLogId(new BigDecimal(id));
        row.setTargetTime(LocalDateTime.parse("2026-08-20 10:00:00", TIME_FORMAT));
        row.setHasLogDetail(true);
        row.setHasRawMessage(false);
        return row;
    }

    private LogListRow listRow(int id) {
        return listRow((long) id);
    }
}
