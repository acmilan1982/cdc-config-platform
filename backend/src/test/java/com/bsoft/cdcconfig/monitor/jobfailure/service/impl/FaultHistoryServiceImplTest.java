package com.bsoft.cdcconfig.monitor.jobfailure.service.impl;

import com.baomidou.mybatisplus.core.MybatisConfiguration;
import com.baomidou.mybatisplus.core.conditions.query.LambdaQueryWrapper;
import com.baomidou.mybatisplus.core.metadata.TableInfoHelper;
import com.baomidou.mybatisplus.core.toolkit.GlobalConfigUtils;
import com.bsoft.cdcconfig.common.exception.BusinessException;
import com.bsoft.cdcconfig.datasource.entity.DataSource;
import com.bsoft.cdcconfig.datasource.mapper.DataSourceMapper;
import com.bsoft.cdcconfig.monitor.jobfailure.entity.CdcClientMultiple;
import com.bsoft.cdcconfig.monitor.jobfailure.entity.JobFailureEvent;
import com.bsoft.cdcconfig.monitor.jobfailure.entity.JobFailureHandleLog;
import com.bsoft.cdcconfig.monitor.jobfailure.exception.JobFailureErrorCode;
import com.bsoft.cdcconfig.monitor.jobfailure.mapper.CdcClientMultipleMapper;
import com.bsoft.cdcconfig.monitor.jobfailure.mapper.JobFailureEventMapper;
import com.bsoft.cdcconfig.monitor.jobfailure.mapper.JobFailureHandleLogMapper;
import com.bsoft.cdcconfig.monitor.jobfailure.query.FaultHistoryListQuery;
import com.bsoft.cdcconfig.monitor.jobfailure.vo.FaultHistorySummaryVO;
import com.bsoft.cdcconfig.monitor.jobfailure.vo.FaultProcessSummaryVO;
import org.apache.ibatis.builder.MapperBuilderAssistant;
import org.junit.jupiter.api.BeforeAll;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.mockito.junit.jupiter.MockitoSettings;
import org.mockito.quality.Strictness;

import java.time.Clock;
import java.time.Instant;
import java.time.LocalDateTime;
import java.time.ZoneId;
import java.time.ZoneOffset;
import java.util.Arrays;
import java.util.Collections;
import java.util.List;
import java.util.stream.Collectors;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertNull;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.junit.jupiter.api.Assertions.assertTrue;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.times;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

/**
 * FaultHistoryServiceImpl 纯 Mockito 单测（JFM-API-006 / JFM-API-007）。
 * 固定 Asia/Shanghai 时区 Clock，覆盖自然日边界、根事件去重、当前配置全集、
 * 排序分页、批次查询与错误码。不连接 ZooKeeper、不加载 CLOB。
 */
@ExtendWith(MockitoExtension.class)
@MockitoSettings(strictness = Strictness.LENIENT)
class FaultHistoryServiceImplTest {

    // 固定 now = 2026-08-18 10:00:00 Asia/Shanghai
    private static final LocalDateTime NOW = LocalDateTime.of(2026, 8, 18, 10, 0, 0);
    private static final LocalDateTime TODAY_START = LocalDateTime.of(2026, 8, 18, 0, 0, 0);
    private static final LocalDateTime LAST7_START = LocalDateTime.of(2026, 8, 12, 0, 0, 0);
    private static final LocalDateTime LAST30_START = LocalDateTime.of(2026, 7, 20, 0, 0, 0);
    private static final ZoneId ZONE = ZoneId.of("Asia/Shanghai");
    private static final Clock FIXED_CLOCK = Clock.fixed(
            NOW.toInstant(ZoneOffset.ofHours(8)), ZONE);

    @Mock
    private JobFailureEventMapper eventMapper;
    @Mock
    private JobFailureHandleLogMapper logMapper;
    @Mock
    private CdcClientMultipleMapper clientMultipleMapper;
    @Mock
    private DataSourceMapper dataSourceMapper;

    private FaultHistoryServiceImpl service;

    @BeforeAll
    static void initMybatisPlusLambdaCache() {
        MybatisConfiguration configuration = new MybatisConfiguration();
        GlobalConfigUtils.setGlobalConfig(configuration, GlobalConfigUtils.defaults());
        TableInfoHelper.initTableInfo(new MapperBuilderAssistant(configuration, ""), CdcClientMultiple.class);
    }

    @BeforeEach
    void setUp() {
        service = new FaultHistoryServiceImpl(eventMapper, logMapper, clientMultipleMapper, dataSourceMapper, FIXED_CLOCK);
    }

    // ==================== 数据构造 ====================

    private CdcClientMultiple client(String clientId, String dataSourceIds, String fgActive) {
        CdcClientMultiple c = new CdcClientMultiple();
        c.setClientId(clientId);
        c.setClientDesc("desc-" + clientId);
        c.setDataSourceId(dataSourceIds);
        c.setFgActive(fgActive);
        return c;
    }

    private DataSource ds(String dataSourceId, String org, String fgActive) {
        DataSource d = new DataSource();
        d.setDataSourceId(dataSourceId);
        d.setDataSourceName("name-" + dataSourceId);
        d.setDataSourceOrg(org);
        d.setFgActive(fgActive);
        return d;
    }

    private JobFailureEvent event(Long id, String clientId, String dataSourceId, String jobId, LocalDateTime t) {
        JobFailureEvent e = new JobFailureEvent();
        e.setId(id);
        e.setClientId(clientId);
        e.setDataSourceId(dataSourceId);
        e.setFailedJobId(jobId);
        e.setFailureTime(t);
        e.setEventResult("ACCEPTED");
        e.setCreatedAt(t.plusMinutes(1));
        return e;
    }

    private JobFailureHandleLog log(Long id, Long eventId, String stage, LocalDateTime t, String newJobId) {
        JobFailureHandleLog l = new JobFailureHandleLog();
        l.setId(id);
        l.setFailureEventId(eventId);
        l.setHandleStage(stage);
        l.setHandleTime(t);
        l.setNewJobId(newJobId);
        return l;
    }

    private FaultHistorySummaryVO row(List<FaultHistorySummaryVO> rows, String dataSourceId) {
        return rows.stream()
                .filter(r -> dataSourceId.equals(r.getDataSourceId()))
                .findFirst().orElse(null);
    }

    /** c1/ds-a：一条两事件故障链 + 4 条独立事件，覆盖各窗口边界。 */
    private void stubBoundaryScenario() {
        when(clientMultipleMapper.selectList(any())).thenReturn(Collections.singletonList(
                client("c1", "ds-a", "1")));
        when(dataSourceMapper.selectBatchIds(any())).thenReturn(Collections.singletonList(
                ds("ds-a", "org-a", "1")));

        List<JobFailureEvent> events = Arrays.asList(
                event(1L, "c1", "ds-a", "JOB1", LocalDateTime.of(2026, 8, 18, 2, 0, 0)),
                event(2L, "c1", "ds-a", "JOB2", LocalDateTime.of(2026, 8, 18, 3, 30, 0)),
                event(3L, "c1", "ds-a", "JOB3A", LAST7_START),
                event(4L, "c1", "ds-a", "JOB4A", LAST7_START.minusSeconds(1)),
                event(5L, "c1", "ds-a", "JOB5A", LAST30_START),
                event(6L, "c1", "ds-a", "JOB6A", LAST30_START.minusSeconds(1)));
        when(eventMapper.selectList(any())).thenReturn(events);

        List<JobFailureHandleLog> logs = Arrays.asList(
                log(101L, 1L, "RESTART_STARTED", LocalDateTime.of(2026, 8, 18, 2, 1, 0), null),
                log(102L, 1L, "NEW_JOB_SUBMIT_SUCCEEDED", LocalDateTime.of(2026, 8, 18, 2, 5, 0), "JOB2"),
                log(103L, 2L, "STABLE_CHECK_PASSED", LocalDateTime.of(2026, 8, 18, 3, 40, 0), "JOB3"),
                log(104L, 3L, "STABLE_CHECK_PASSED", LAST7_START.plusMinutes(5), "JOB3B"),
                log(105L, 4L, "STABLE_CHECK_PASSED", LAST7_START.minusSeconds(1).plusMinutes(5), "JOB4B"),
                log(106L, 5L, "STABLE_CHECK_PASSED", LAST30_START.plusMinutes(5), "JOB5B"),
                log(107L, 6L, "STABLE_CHECK_PASSED", LAST30_START.minusSeconds(1).plusMinutes(5), "JOB6B"));
        when(logMapper.selectList(any())).thenReturn(logs);
    }

    // ==================== JFM-API-006 概览 ====================

    @Test
    void summary_naturalDayBoundariesAndRootEventDedup() {
        stubBoundaryScenario();

        List<FaultHistorySummaryVO> result = service.querySummary(null);

        assertEquals(1, result.size());
        FaultHistorySummaryVO vo = result.get(0);
        assertEquals("ds-a", vo.getDataSourceId());

        // 两事件故障链按派生根事件去重计 1，时间归属首次失败时间
        assertEquals(1, vo.getTodayFailureCount());
        // 含 08-12 00:00:00 边界（含），不含 08-11 23:59:59
        assertEquals(2, vo.getLast7DaysFailureCount());
        // 含 07-20 00:00:00 边界（含），不含 07-19 23:59:59
        assertEquals(4, vo.getLast30DaysFailureCount());

        assertEquals(LocalDateTime.of(2026, 8, 18, 2, 0, 0), vo.getLatestFailureTime());
        assertEquals("RECOVERY_RECORDED", vo.getLatestProcessStatus());
        assertEquals("已记录恢复", vo.getLatestProcessStatusLabel());

        assertEquals("org-a", vo.getDataSourceOrg());
        assertTrue(vo.isDataSourceExists());
        assertEquals(Boolean.TRUE, vo.getDataSourceActive());
    }

    @Test
    void summary_currentConfigFullSetZeroCountAndDeconfiguredExcluded() {
        // mock 只返回启用客户端；FG_ACTIVE=1 过滤由 SQL wrapper 承担（另有 captor 用例断言）
        when(clientMultipleMapper.selectList(any())).thenReturn(Collections.singletonList(
                client("c1", " ds-a , ds-b ", "1")));
        when(dataSourceMapper.selectBatchIds(any())).thenReturn(Collections.singletonList(
                ds("ds-a", "org-a", "1")));
        when(eventMapper.selectList(any())).thenReturn(Collections.emptyList());

        List<FaultHistorySummaryVO> result = service.querySummary(null);

        assertEquals(Arrays.asList("ds-a", "ds-b"),
                result.stream().map(FaultHistorySummaryVO::getDataSourceId).collect(Collectors.toList()));

        FaultHistorySummaryVO a = row(result, "ds-a");
        assertEquals(0, a.getTodayFailureCount());
        assertEquals(0, a.getLast7DaysFailureCount());
        assertEquals(0, a.getLast30DaysFailureCount());
        assertNull(a.getLatestFailureTime());
        assertEquals("org-a", a.getDataSourceOrg());
        assertTrue(a.isDataSourceExists());
        assertEquals(Boolean.TRUE, a.getDataSourceActive());

        FaultHistorySummaryVO b = row(result, "ds-b");
        assertEquals(0, b.getTodayFailureCount());
        assertNull(b.getDataSourceOrg());
        assertTrue(!b.isDataSourceExists());
        assertNull(b.getDataSourceActive());

        assertNull(row(result, "ds-x"), "停用客户端的配置数据源不得出现");

        // clientId 只能命中启用客户端
        assertTrue(service.querySummary("c2").isEmpty());
    }

    @Test
    @SuppressWarnings("unchecked")
    void summary_clientMultipleQueryKeepsFgActiveFilter() {
        when(clientMultipleMapper.selectList(any())).thenReturn(Collections.singletonList(
                client("c1", "ds-a", "1")));
        when(dataSourceMapper.selectBatchIds(any())).thenReturn(Collections.singletonList(
                ds("ds-a", "org-a", "1")));
        when(eventMapper.selectList(any())).thenReturn(Collections.emptyList());

        service.querySummary(null);

        org.mockito.ArgumentCaptor<LambdaQueryWrapper<CdcClientMultiple>> captor =
                org.mockito.ArgumentCaptor.forClass(LambdaQueryWrapper.class);
        verify(clientMultipleMapper).selectList(captor.capture());
        LambdaQueryWrapper<CdcClientMultiple> wrapper = captor.getValue();
        assertTrue(wrapper.getSqlSegment().contains("FG_ACTIVE"));
        assertTrue(wrapper.getParamNameValuePairs().containsValue("1"));
    }

    @Test
    void summary_clientFilterAndBatchQueriesWithoutNPlus1() {
        when(clientMultipleMapper.selectList(any())).thenReturn(Arrays.asList(
                client("c1", "ds-a", "1"),
                client("c2", "ds-b", "1")));
        when(dataSourceMapper.selectBatchIds(any())).thenReturn(Arrays.asList(
                ds("ds-a", "org-a", "1"),
                ds("ds-b", "org-b", "1")));
        when(eventMapper.selectList(any())).thenReturn(Collections.singletonList(
                event(1L, "c1", "ds-a", "JOB1", LocalDateTime.of(2026, 8, 18, 3, 0, 0))));
        when(logMapper.selectList(any())).thenReturn(Collections.singletonList(
                log(101L, 1L, "STABLE_CHECK_PASSED", LocalDateTime.of(2026, 8, 18, 3, 5, 0), "JOB2")));

        List<FaultHistorySummaryVO> result = service.querySummary("c1");

        // 仅命中 c1，c1 有今日故障排序在前
        assertEquals(1, result.size());
        assertEquals("ds-a", result.get(0).getDataSourceId());
        assertEquals(1, result.get(0).getTodayFailureCount());

        verify(eventMapper, times(1)).selectList(any());
        verify(logMapper, times(1)).selectList(any());
        verify(dataSourceMapper, times(1)).selectBatchIds(any());
        verify(dataSourceMapper, never()).selectById(any());
    }

    // ==================== JFM-API-007 完整列表（不分页） ====================

    @Test
    void history_rangeFilteringSortAndFullReturn() {
        stubBoundaryScenario();

        // TODAY：仅一条两事件链，完整返回
        List<FaultProcessSummaryVO> todayList = service.queryHistory(query("c1", "ds-a", "TODAY"));
        assertEquals(1, todayList.size());
        FaultProcessSummaryVO root1 = todayList.get(0);
        assertEquals("1", root1.getFaultRootIdText());
        assertEquals(LocalDateTime.of(2026, 8, 18, 2, 0, 0), root1.getStartTime());
        assertEquals(2, root1.getMainChainEventCount());
        assertEquals(1, root1.getRestartCount());
        assertEquals("RECOVERY_RECORDED", root1.getRecordStatus());

        // LAST_7_DAYS：两事件链 + 08-12 00:00 边界事件，完整返回
        List<FaultProcessSummaryVO> weekList = service.queryHistory(query("c1", "ds-a", "LAST_7_DAYS"));
        assertEquals(2, weekList.size());
        assertEquals(Arrays.asList("1", "3"),
                weekList.stream().map(FaultProcessSummaryVO::getFaultRootIdText).collect(Collectors.toList()));

        // LAST_30_DAYS：4 条，按首次失败时间倒序，完整返回（无分页截断）
        List<FaultProcessSummaryVO> monthList = service.queryHistory(query("c1", "ds-a", "LAST_30_DAYS"));
        assertEquals(4, monthList.size());
        assertEquals(Arrays.asList("1", "3", "4", "5"),
                monthList.stream().map(FaultProcessSummaryVO::getFaultRootIdText).collect(Collectors.toList()));
    }

    @Test
    void history_over20AllReturned() {
        when(clientMultipleMapper.selectList(any())).thenReturn(Collections.singletonList(
                client("c1", "ds-a", "1")));
        when(dataSourceMapper.selectBatchIds(any())).thenReturn(Collections.singletonList(
                ds("ds-a", "org-a", "1")));

        // 25 条独立事件（无 NEW_JOB_ID 关联），全部落在今日窗口，超过旧默认 20 条上限仍应全部返回
        List<JobFailureEvent> events = new java.util.ArrayList<>();
        List<JobFailureHandleLog> logs = new java.util.ArrayList<>();
        for (int i = 0; i < 25; i++) {
            long id = 2000L + i;
            String job = "PAGJOB" + i;
            events.add(event(id, "c1", "ds-a", job, TODAY_START.plusMinutes(1 + i)));
            logs.add(log(3000L + i, id, "STABLE_CHECK_PASSED",
                    TODAY_START.plusMinutes(2 + i), job + "-NEW"));
        }
        when(eventMapper.selectList(any())).thenReturn(events);
        when(logMapper.selectList(any())).thenReturn(logs);

        List<FaultProcessSummaryVO> list = service.queryHistory(query("c1", "ds-a", "TODAY"));

        assertEquals(25, list.size());
        // 按首次失败时间倒序：最新（id 2024）在前
        assertEquals("2024", list.get(0).getFaultRootIdText());
        assertEquals("2000", list.get(24).getFaultRootIdText());
    }

    @Test
    void history_over100AllReturned() {
        when(clientMultipleMapper.selectList(any())).thenReturn(Collections.singletonList(
                client("c1", "ds-a", "1")));
        when(dataSourceMapper.selectBatchIds(any())).thenReturn(Collections.singletonList(
                ds("ds-a", "org-a", "1")));

        // 120 条独立事件，超过旧最大 100 条上限仍应全部返回，无 SQL/Java/接口层截断
        List<JobFailureEvent> events = new java.util.ArrayList<>();
        List<JobFailureHandleLog> logs = new java.util.ArrayList<>();
        for (int i = 0; i < 120; i++) {
            long id = 5000L + i;
            String job = "BIGJOB" + i;
            events.add(event(id, "c1", "ds-a", job, TODAY_START.plusMinutes(1 + i)));
            logs.add(log(6000L + i, id, "STABLE_CHECK_PASSED",
                    TODAY_START.plusMinutes(2 + i), job + "-NEW"));
        }
        when(eventMapper.selectList(any())).thenReturn(events);
        when(logMapper.selectList(any())).thenReturn(logs);

        List<FaultProcessSummaryVO> list = service.queryHistory(query("c1", "ds-a", "TODAY"));

        assertEquals(120, list.size());
        assertEquals("5119", list.get(0).getFaultRootIdText());
        assertEquals("5000", list.get(119).getFaultRootIdText());
    }

    @Test
    void history_emptyEventsReturnsEmptyList() {
        when(clientMultipleMapper.selectList(any())).thenReturn(Collections.singletonList(
                client("c1", "ds-a", "1")));
        when(eventMapper.selectList(any())).thenReturn(Collections.emptyList());

        List<FaultProcessSummaryVO> list = service.queryHistory(query("c1", "ds-a", "TODAY"));

        assertTrue(list.isEmpty());
    }

    @Test
    void history_invalidRangeRejected() {
        when(clientMultipleMapper.selectList(any())).thenReturn(Collections.singletonList(
                client("c1", "ds-a", "1")));

        BusinessException ex = assertThrows(BusinessException.class,
                () -> service.queryHistory(query("c1", "ds-a", "FOO")));
        assertEquals(JobFailureErrorCode.HISTORY_RANGE_INVALID, ex.getCode());
    }

    @Test
    void history_dataSourceNotInCurrentConfigRejected() {
        when(clientMultipleMapper.selectList(any())).thenReturn(Collections.singletonList(
                client("c1", "ds-a", "1")));

        BusinessException notConfig = assertThrows(BusinessException.class,
                () -> service.queryHistory(query("c1", "ds-not-configured", "TODAY")));
        assertEquals(JobFailureErrorCode.HISTORY_DATA_SOURCE_NOT_IN_CURRENT_CONFIG, notConfig.getCode());

        BusinessException comma = assertThrows(BusinessException.class,
                () -> service.queryHistory(query("c1", "ds-a,ds-b", "TODAY")));
        assertEquals(JobFailureErrorCode.HISTORY_DATA_SOURCE_NOT_IN_CURRENT_CONFIG, comma.getCode());
    }

    private FaultHistoryListQuery query(String clientId, String dataSourceId, String range) {
        FaultHistoryListQuery q = new FaultHistoryListQuery();
        q.setClientId(clientId);
        q.setDataSourceId(dataSourceId);
        q.setRange(range);
        return q;
    }
}
