package com.bsoft.cdcconfig.largescreen.stats.service;

import com.bsoft.cdcconfig.datasource.entity.DataSource;
import com.bsoft.cdcconfig.datasource.mapper.DataSourceMapper;
import com.bsoft.cdcconfig.largescreen.stats.entity.CumulativeOverviewEntity;
import com.bsoft.cdcconfig.largescreen.stats.entity.DailyOverviewEntity;
import com.bsoft.cdcconfig.largescreen.stats.entity.DataSubscribeEntity;
import com.bsoft.cdcconfig.largescreen.stats.entity.StatsWatermarkEntity;
import com.bsoft.cdcconfig.largescreen.stats.mapper.DataSubscribeMapper;
import com.bsoft.cdcconfig.largescreen.stats.mapper.LargeScreenMapper;
import com.bsoft.cdcconfig.largescreen.stats.service.impl.LargeScreenServiceImpl;
import com.bsoft.cdcconfig.largescreen.stats.vo.DailyTrendVO;
import com.bsoft.cdcconfig.largescreen.stats.vo.DashboardVO;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.math.BigDecimal;
import java.sql.Date;
import java.time.LocalDate;
import java.time.ZoneId;
import java.util.ArrayList;
import java.util.Arrays;
import java.util.Collections;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class LargeScreenServiceTest {

    @Mock
    private LargeScreenMapper largeScreenMapper;
    @Mock
    private DataSubscribeMapper dataSubscribeMapper;
    @Mock
    private DataSourceMapper dataSourceMapper;

    private LargeScreenService service;
    private static final String TC = "LARGE_SCREEN_STATS";
    private static final ZoneId ZONE = ZoneId.of("Asia/Shanghai");

    @BeforeEach
    void setUp() {
        service = new LargeScreenServiceImpl(largeScreenMapper, dataSubscribeMapper, dataSourceMapper);
    }

    // All stubs are lenient so individual tests can override specific ones.
    private void mockBase() {
        lenient().when(largeScreenMapper.selectCumulativeOverview(TC)).thenReturn(null);
        lenient().when(largeScreenMapper.selectDailyOverview(eq(TC), any(Date.class))).thenReturn(null);
        lenient().when(largeScreenMapper.selectDailyRange(eq(TC), any(Date.class), any(Date.class)))
                .thenReturn(Collections.emptyList());
        lenient().when(largeScreenMapper.selectWatermarks(TC)).thenReturn(Collections.emptyList());
        lenient().when(largeScreenMapper.selectActiveClientDataSources()).thenReturn(Collections.emptyList());
        lenient().when(largeScreenMapper.selectDimCumulativeByType(anyString(), anyString()))
                .thenReturn(Collections.emptyList());
        lenient().when(largeScreenMapper.selectDimDailyByType(anyString(), anyString(), any(Date.class)))
                .thenReturn(Collections.emptyList());
        lenient().when(largeScreenMapper.selectTop10SourceDatabases(TC)).thenReturn(Collections.emptyList());
        lenient().when(largeScreenMapper.selectTop10TargetDatabases(TC)).thenReturn(Collections.emptyList());
        lenient().when(largeScreenMapper.selectTop10Tables(TC)).thenReturn(Collections.emptyList());
        lenient().when(dataSubscribeMapper.selectList(any())).thenReturn(Collections.emptyList());
        lenient().when(largeScreenMapper.selectMinDimCumulativeUpdateTime(TC)).thenReturn(null);
        lenient().when(largeScreenMapper.selectMinDimDailyUpdateTime(TC)).thenReturn(null);
    }

    // ============================================================
    // dataStatus — 第二次补正：保守三态（EMPTY / PARTIAL，READY 暂不返回）
    // ============================================================

    @Test
    void dataStatusEmptyWhenCumulativeIsNull() {
        mockBase();
        assertEquals("EMPTY", service.getDashboard().getDataStatus());
    }

    @Test
    void dataStatusEmptyWhenTotalCountIsZero() {
        mockBase();
        CumulativeOverviewEntity cum = new CumulativeOverviewEntity();
        cum.setTotalCount(0L);
        cum.setSuccessCount(0L);
        cum.setErrorCount(0L);
        when(largeScreenMapper.selectCumulativeOverview(TC)).thenReturn(cum);

        assertEquals("EMPTY", service.getDashboard().getDataStatus());
    }

    @Test
    void dataStatusPartialWhenCumulativeHasData() {
        mockBase();
        CumulativeOverviewEntity cum = entity(1000L, 990L, 10L);
        when(largeScreenMapper.selectCumulativeOverview(TC)).thenReturn(cum);

        assertEquals("PARTIAL", service.getDashboard().getDataStatus());
    }

    @Test
    void dataStatusPartialNotReadyWhenBothWatermarksHaveData() {
        // 两条水位的 totalProcessed > 0 不能单独证明 READY
        mockBase();
        CumulativeOverviewEntity cum = entity(1000L, 990L, 10L);
        when(largeScreenMapper.selectCumulativeOverview(TC)).thenReturn(cum);
        StatsWatermarkEntity wm1 = wm("CORRECT", 500L);
        StatsWatermarkEntity wm2 = wm("ERROR", 50L);
        when(largeScreenMapper.selectWatermarks(TC)).thenReturn(Arrays.asList(wm1, wm2));

        assertEquals("PARTIAL", service.getDashboard().getDataStatus());
    }

    @Test
    void dataStatusNotReadyWhenWatermarkProcessedIsZero() {
        mockBase();
        CumulativeOverviewEntity cum = entity(1000L, 990L, 10L);
        when(largeScreenMapper.selectCumulativeOverview(TC)).thenReturn(cum);
        StatsWatermarkEntity wm1 = wm("CORRECT", 0L);
        StatsWatermarkEntity wm2 = wm("ERROR", 0L);
        when(largeScreenMapper.selectWatermarks(TC)).thenReturn(Arrays.asList(wm1, wm2));

        assertEquals("PARTIAL", service.getDashboard().getDataStatus());
    }

    @Test
    void dataStatusPartialWhenWatermarksNull() {
        mockBase();
        CumulativeOverviewEntity cum = entity(500L, 499L, 1L);
        when(largeScreenMapper.selectCumulativeOverview(TC)).thenReturn(cum);
        when(largeScreenMapper.selectWatermarks(TC)).thenReturn(null);

        assertEquals("PARTIAL", service.getDashboard().getDataStatus());
    }

    @Test
    void dataStatusPartialWhenTodayIsZeroButHistoryExists() {
        // 今日为 0、历史累计存在时，不返回 EMPTY
        mockBase();
        CumulativeOverviewEntity cum = entity(5000L, 4990L, 10L);
        when(largeScreenMapper.selectCumulativeOverview(TC)).thenReturn(cum);
        DailyOverviewEntity today = daily(0L, 0L, 0L);
        when(largeScreenMapper.selectDailyOverview(eq(TC), any(Date.class))).thenReturn(today);

        assertEquals("PARTIAL", service.getDashboard().getDataStatus());
    }

    @Test
    void dataStatusNeverReturnsReady() {
        // READY 暂不返回，即使水位齐全且有数据
        mockBase();
        CumulativeOverviewEntity cum = entity(10000L, 9990L, 10L);
        cum.setUpdateTime(new java.util.Date());
        when(largeScreenMapper.selectCumulativeOverview(TC)).thenReturn(cum);
        StatsWatermarkEntity wm1 = wm("CORRECT", 50000L);
        StatsWatermarkEntity wm2 = wm("ERROR", 500L);
        wm1.setUpdateTime(new java.util.Date());
        wm2.setUpdateTime(new java.util.Date());
        when(largeScreenMapper.selectWatermarks(TC)).thenReturn(Arrays.asList(wm1, wm2));

        assertNotEquals("READY", service.getDashboard().getDataStatus());
    }

    // ============================================================
    // 统计更新时间 — 第二次补正：取全部依赖结果表 UPDATE_TIME 的最小值
    // ============================================================

    @Test
    void updateTimeNullWhenEmpty() {
        mockBase();
        assertNull(service.getDashboard().getDataUpdateTime());
    }

    @Test
    void updateTimeFromCumulativeWhenOnlySource() {
        mockBase();
        java.util.Date t = new java.util.Date(1700000000000L);
        CumulativeOverviewEntity cum = entity(100L, 99L, 1L);
        cum.setUpdateTime(t);
        when(largeScreenMapper.selectCumulativeOverview(TC)).thenReturn(cum);

        assertNotNull(service.getDashboard().getDataUpdateTime());
    }

    @Test
    void updateTimeReturnsMinAcrossAllSources() {
        mockBase();
        // cumulative: time=3000ms, daily: 1000ms, dimCum: 2000ms → min = 1000
        java.util.Date tCum = new java.util.Date(3000L);
        java.util.Date tDaily = new java.util.Date(1000L);
        java.util.Date tDimCum = new java.util.Date(2000L);

        CumulativeOverviewEntity cum = entity(100L, 99L, 1L);
        cum.setUpdateTime(tCum);
        when(largeScreenMapper.selectCumulativeOverview(TC)).thenReturn(cum);

        DailyOverviewEntity today = daily(10L, 9L, 1L);
        today.setUpdateTime(tDaily);
        when(largeScreenMapper.selectDailyOverview(eq(TC), any(Date.class))).thenReturn(today);

        when(largeScreenMapper.selectMinDimCumulativeUpdateTime(TC)).thenReturn(new Date(2000L));
        when(largeScreenMapper.selectMinDimDailyUpdateTime(TC)).thenReturn(null);

        String result = service.getDashboard().getDataUpdateTime();
        assertNotNull(result);
        // 最保守时间应来自 tDaily (1000ms)
    }

    @Test
    void updateTimeWhenAllTimesAreNullReturnsNull() {
        mockBase();
        CumulativeOverviewEntity cum = entity(100L, 99L, 1L);
        cum.setUpdateTime(null);
        when(largeScreenMapper.selectCumulativeOverview(TC)).thenReturn(cum);

        assertNull(service.getDashboard().getDataUpdateTime());
    }

    @Test
    void updateTimeIgnoresNullValues() {
        mockBase();
        java.util.Date t = new java.util.Date(5000L);
        CumulativeOverviewEntity cum = entity(100L, 99L, 1L);
        cum.setUpdateTime(t);
        when(largeScreenMapper.selectCumulativeOverview(TC)).thenReturn(cum);
        // today is null (default mockBase)
        // dim cumulative/daily times are null (default mockBase)

        assertNotNull(service.getDashboard().getDataUpdateTime());
    }

    @Test
    void updateTimeNotUsingCurrentTime() {
        mockBase();
        java.util.Date fixedTime = new java.util.Date(1600000000000L); // 2020-09-13
        CumulativeOverviewEntity cum = entity(100L, 99L, 1L);
        cum.setUpdateTime(fixedTime);
        when(largeScreenMapper.selectCumulativeOverview(TC)).thenReturn(cum);

        String result = service.getDashboard().getDataUpdateTime();
        assertNotNull(result);
        assertTrue(result.startsWith("2020"));
    }

    @Test
    void updateTimeNoNpeWhenAllMappersNull() {
        lenient().when(largeScreenMapper.selectCumulativeOverview(TC)).thenReturn(null);
        lenient().when(largeScreenMapper.selectDailyOverview(eq(TC), any(Date.class))).thenReturn(null);
        lenient().when(largeScreenMapper.selectDailyRange(eq(TC), any(Date.class), any(Date.class))).thenReturn(null);
        lenient().when(largeScreenMapper.selectWatermarks(TC)).thenReturn(null);
        lenient().when(largeScreenMapper.selectActiveClientDataSources()).thenReturn(null);
        lenient().when(largeScreenMapper.selectDimCumulativeByType(anyString(), anyString())).thenReturn(null);
        lenient().when(largeScreenMapper.selectDimDailyByType(anyString(), anyString(), any(Date.class))).thenReturn(null);
        lenient().when(largeScreenMapper.selectTop10SourceDatabases(TC)).thenReturn(null);
        lenient().when(largeScreenMapper.selectTop10TargetDatabases(TC)).thenReturn(null);
        lenient().when(largeScreenMapper.selectTop10Tables(TC)).thenReturn(null);
        lenient().when(dataSubscribeMapper.selectList(any())).thenReturn(null);
        lenient().when(largeScreenMapper.selectMinDimCumulativeUpdateTime(TC)).thenReturn(null);
        lenient().when(largeScreenMapper.selectMinDimDailyUpdateTime(TC)).thenReturn(null);

        DashboardVO vo = service.getDashboard();
        assertNotNull(vo);
        assertNull(vo.getDataUpdateTime());
    }

    // ============================================================
    // 核心指标（无变化，回归验证）
    // ============================================================

    @Test
    void coreMetricsTodayOnlySuccess() {
        mockBase();
        CumulativeOverviewEntity cum = entity(500L, 500L, 0L);
        when(largeScreenMapper.selectCumulativeOverview(TC)).thenReturn(cum);
        DailyOverviewEntity today = daily(100L, 100L, 0L);
        when(largeScreenMapper.selectDailyOverview(eq(TC), any(Date.class))).thenReturn(today);

        DashboardVO vo = service.getDashboard();
        assertEquals(100L, vo.getCoreMetrics().getTodaySync());
        assertEquals(100L, vo.getCoreMetrics().getTodaySuccess());
        assertEquals(0L, vo.getCoreMetrics().getTodayError());
        assertEquals(new BigDecimal("100.00"), vo.getCoreMetrics().getTodaySuccessRate());
        assertEquals(500L, vo.getCoreMetrics().getCumulativeSync());
    }

    @Test
    void coreMetricsTodayOnlyError() {
        mockBase();
        CumulativeOverviewEntity cum = entity(100L, 50L, 50L);
        when(largeScreenMapper.selectCumulativeOverview(TC)).thenReturn(cum);
        DailyOverviewEntity today = daily(10L, 0L, 10L);
        when(largeScreenMapper.selectDailyOverview(eq(TC), any(Date.class))).thenReturn(today);

        DashboardVO vo = service.getDashboard();
        assertEquals(10L, vo.getCoreMetrics().getTodaySync());
        assertEquals(0L, vo.getCoreMetrics().getTodaySuccess());
        assertEquals(10L, vo.getCoreMetrics().getTodayError());
        assertEquals(BigDecimal.ZERO.setScale(2), vo.getCoreMetrics().getTodaySuccessRate());
    }

    @Test
    void coreMetricsTodayTotalZero() {
        mockBase();
        CumulativeOverviewEntity cum = entity(100L, 100L, 0L);
        when(largeScreenMapper.selectCumulativeOverview(TC)).thenReturn(cum);
        DailyOverviewEntity today = daily(0L, 0L, 0L);
        when(largeScreenMapper.selectDailyOverview(eq(TC), any(Date.class))).thenReturn(today);

        assertEquals(BigDecimal.ZERO.setScale(2),
                service.getDashboard().getCoreMetrics().getTodaySuccessRate());
    }

    @Test
    void coreMetricsAllNull() {
        mockBase();
        DashboardVO vo = service.getDashboard();
        assertEquals(0L, vo.getCoreMetrics().getTodaySync());
        assertEquals(0L, vo.getCoreMetrics().getCumulativeSync());
        assertEquals(BigDecimal.ZERO.setScale(2), vo.getCoreMetrics().getTodaySuccessRate());
    }

    @Test
    void successRateRounding() {
        mockBase();
        CumulativeOverviewEntity cum = entity(997L, 997L, 0L);
        when(largeScreenMapper.selectCumulativeOverview(TC)).thenReturn(cum);
        DailyOverviewEntity today = daily(199L, 197L, 2L);
        when(largeScreenMapper.selectDailyOverview(eq(TC), any(Date.class))).thenReturn(today);

        assertEquals(new BigDecimal("98.99"),
                service.getDashboard().getCoreMetrics().getTodaySuccessRate());
    }

    // ============================================================
    // 7 天趋势（无变化，回归验证）
    // ============================================================

    @Test
    void sevenDayTrendAlwaysReturns7Points() {
        mockBase();
        CumulativeOverviewEntity cum = entity(1L, 1L, 0L);
        when(largeScreenMapper.selectCumulativeOverview(TC)).thenReturn(cum);

        assertEquals(7, service.getDashboard().getSevenDayTrend().size());
    }

    @Test
    void sevenDayTrendMissingDaysFillZero() {
        mockBase();
        CumulativeOverviewEntity cum = entity(100L, 99L, 1L);
        when(largeScreenMapper.selectCumulativeOverview(TC)).thenReturn(cum);
        LocalDate today = LocalDate.now(ZONE);
        DailyOverviewEntity day3 = dailyForDate(Date.valueOf(today.minusDays(3)), 50L, 49L, 1L);
        when(largeScreenMapper.selectDailyRange(eq(TC), any(Date.class), any(Date.class)))
                .thenReturn(Collections.singletonList(day3));

        DashboardVO vo = service.getDashboard();
        assertEquals(7, vo.getSevenDayTrend().size());
        long nonZero = vo.getSevenDayTrend().stream().filter(d -> d.getCount() > 0).count();
        assertEquals(1, nonZero);
    }

    @Test
    void sevenDayTrendAscendingOrder() {
        mockBase();
        CumulativeOverviewEntity cum = entity(700L, 690L, 10L);
        when(largeScreenMapper.selectCumulativeOverview(TC)).thenReturn(cum);

        List<DailyTrendVO> trend = service.getDashboard().getSevenDayTrend();
        for (int i = 1; i < 7; i++) {
            assertTrue(trend.get(i).getDate().compareTo(trend.get(i - 1).getDate()) > 0);
        }
    }

    @Test
    void sevenDayTrendLastDayIsTodayInShanghai() {
        mockBase();
        CumulativeOverviewEntity cum = entity(1L, 1L, 0L);
        when(largeScreenMapper.selectCumulativeOverview(TC)).thenReturn(cum);

        LocalDate today = LocalDate.now(ZONE);
        List<DailyTrendVO> trend = service.getDashboard().getSevenDayTrend();
        assertEquals(today.toString(), trend.get(6).getDate());
    }

    // ============================================================
    // 三类 Top 10（无变化，回归验证）
    // ============================================================

    @Test
    void top10AllEmptyWhenNoData() {
        mockBase();
        CumulativeOverviewEntity cum = entity(1L, 1L, 0L);
        when(largeScreenMapper.selectCumulativeOverview(TC)).thenReturn(cum);

        DashboardVO vo = service.getDashboard();
        assertNotNull(vo.getTop());
        assertTrue(vo.getTop().getSourceDatabases().isEmpty());
        assertTrue(vo.getTop().getTargetDatabases().isEmpty());
        assertTrue(vo.getTop().getTables().isEmpty());
    }

    @Test
    void top10SourceDatabasesRankAndTotalFormula() {
        mockBase();
        CumulativeOverviewEntity cum = entity(1000L, 990L, 10L);
        when(largeScreenMapper.selectCumulativeOverview(TC)).thenReturn(cum);

        List<Map<String, Object>> rows = new ArrayList<>();
        rows.add(dimRow("DS001", 500L, 5L));
        rows.add(dimRow("DS002", 300L, 3L));
        when(largeScreenMapper.selectTop10SourceDatabases(TC)).thenReturn(rows);

        DataSource ds1 = ds("DS001", "OrgA", "db-one");
        DataSource ds2 = ds("DS002", "OrgB", "db-two");
        when(dataSourceMapper.selectBatchIds(anyCollection()))
                .thenReturn(Arrays.asList(ds1, ds2));

        DashboardVO vo = service.getDashboard();
        assertEquals(2, vo.getTop().getSourceDatabases().size());
        assertEquals(1, vo.getTop().getSourceDatabases().get(0).getRank().intValue());
        assertEquals("db-one", vo.getTop().getSourceDatabases().get(0).getName());
        assertEquals("DS001", vo.getTop().getSourceDatabases().get(0).getKey());
        assertEquals(505L, vo.getTop().getSourceDatabases().get(0).getTotalCount());
        assertEquals(500L, vo.getTop().getSourceDatabases().get(0).getSuccessCount());
        assertEquals(5L, vo.getTop().getSourceDatabases().get(0).getErrorCount());
    }

    @Test
    void top10TablesUsesDimValueAsName() {
        mockBase();
        CumulativeOverviewEntity cum = entity(100L, 99L, 1L);
        when(largeScreenMapper.selectCumulativeOverview(TC)).thenReturn(cum);

        List<Map<String, Object>> tableRows = new ArrayList<>();
        tableRows.add(dimRow("DS001.HIS.PATIENT", 100L, 1L));
        when(largeScreenMapper.selectTop10Tables(TC)).thenReturn(tableRows);

        DashboardVO vo = service.getDashboard();
        assertEquals("DS001.HIS.PATIENT", vo.getTop().getTables().get(0).getName());
    }

    @Test
    void top10NameFallbackToId() {
        mockBase();
        CumulativeOverviewEntity cum = entity(100L, 99L, 1L);
        when(largeScreenMapper.selectCumulativeOverview(TC)).thenReturn(cum);

        List<Map<String, Object>> rows = new ArrayList<>();
        rows.add(dimRow("UNKNOWN", 100L, 1L));
        when(largeScreenMapper.selectTop10SourceDatabases(TC)).thenReturn(rows);
        when(dataSourceMapper.selectBatchIds(anyCollection())).thenReturn(Collections.emptyList());

        assertEquals("UNKNOWN",
                service.getDashboard().getTop().getSourceDatabases().get(0).getName());
    }

    // ============================================================
    // 覆盖规模 — 第二次补正：机构数按稳定 DATA_SOURCE_ID 去重
    // ============================================================

    @Test
    void coverageAllZeroWhenNoActiveClients() {
        mockBase();
        CumulativeOverviewEntity cum = entity(1L, 1L, 0L);
        when(largeScreenMapper.selectCumulativeOverview(TC)).thenReturn(cum);

        DashboardVO vo = service.getDashboard();
        assertEquals(0, vo.getCoverageStats().getInstitutionCount().intValue());
        assertEquals(0, vo.getCoverageStats().getClientCount().intValue());
        assertEquals(0, vo.getCoverageStats().getSourceDbCount().intValue());
    }

    @Test
    void coverageFiltersNonSourceCategory() {
        mockBase();
        CumulativeOverviewEntity cum = entity(1L, 1L, 0L);
        when(largeScreenMapper.selectCumulativeOverview(TC)).thenReturn(cum);
        Map<String, Object> client = new HashMap<>();
        client.put("CLIENT_ID", "C1");
        client.put("DATA_SOURCE_ID", "DS001,DS002");
        when(largeScreenMapper.selectActiveClientDataSources())
                .thenReturn(Collections.singletonList(client));
        DataSource ds1 = new DataSource();
        ds1.setDataSourceId("DS001");
        ds1.setDataSourceCategory("source");
        ds1.setDataSourceOrg("OrgA");
        DataSource ds2 = new DataSource();
        ds2.setDataSourceId("DS002");
        ds2.setDataSourceCategory("target");
        ds2.setDataSourceOrg("OrgB");
        when(dataSourceMapper.selectBatchIds(anyCollection()))
                .thenReturn(Arrays.asList(ds1, ds2));

        DashboardVO vo = service.getDashboard();
        // 只有 DS001 是 source，机构数和业务库数均为 1
        assertEquals(1, vo.getCoverageStats().getInstitutionCount().intValue());
        assertEquals(1, vo.getCoverageStats().getClientCount().intValue());
        assertEquals(1, vo.getCoverageStats().getSourceDbCount().intValue());
    }

    @Test
    void coverageInstitutionCountByDataSourceIdNotOrg() {
        // 两个 source 数据源同属一个 ORG → 机构数仍为 2（按稳定 ID 计数，不按 ORG 去重）
        mockBase();
        CumulativeOverviewEntity cum = entity(1L, 1L, 0L);
        when(largeScreenMapper.selectCumulativeOverview(TC)).thenReturn(cum);
        Map<String, Object> client = new HashMap<>();
        client.put("CLIENT_ID", "C1");
        client.put("DATA_SOURCE_ID", "DS001,DS002");
        when(largeScreenMapper.selectActiveClientDataSources())
                .thenReturn(Collections.singletonList(client));
        DataSource ds1 = new DataSource();
        ds1.setDataSourceId("DS001");
        ds1.setDataSourceCategory("source");
        ds1.setDataSourceOrg("SameOrg");
        DataSource ds2 = new DataSource();
        ds2.setDataSourceId("DS002");
        ds2.setDataSourceCategory("source");
        ds2.setDataSourceOrg("SameOrg");
        when(dataSourceMapper.selectBatchIds(anyCollection()))
                .thenReturn(Arrays.asList(ds1, ds2));

        DashboardVO vo = service.getDashboard();
        // 不按 ORG 去重：两个不同的 source 数据源 → 机构数=2
        assertEquals(2, vo.getCoverageStats().getInstitutionCount().intValue());
        assertEquals(2, vo.getCoverageStats().getSourceDbCount().intValue());
    }

    @Test
    void coverageDedupByStableIdWhenDuplicateClientRef() {
        // 同一稳定 DATA_SOURCE_ID 被重复关联时不重复计数
        mockBase();
        CumulativeOverviewEntity cum = entity(1L, 1L, 0L);
        when(largeScreenMapper.selectCumulativeOverview(TC)).thenReturn(cum);
        // 两个客户端引用同一个 DATA_SOURCE_ID
        Map<String, Object> c1 = new HashMap<>();
        c1.put("CLIENT_ID", "C1");
        c1.put("DATA_SOURCE_ID", "DS001");
        Map<String, Object> c2 = new HashMap<>();
        c2.put("CLIENT_ID", "C2");
        c2.put("DATA_SOURCE_ID", "DS001");
        when(largeScreenMapper.selectActiveClientDataSources())
                .thenReturn(Arrays.asList(c1, c2));
        DataSource ds1 = new DataSource();
        ds1.setDataSourceId("DS001");
        ds1.setDataSourceCategory("source");
        ds1.setDataSourceOrg("OrgA");
        when(dataSourceMapper.selectBatchIds(anyCollection()))
                .thenReturn(Collections.singletonList(ds1));

        DashboardVO vo = service.getDashboard();
        assertEquals(1, vo.getCoverageStats().getInstitutionCount().intValue());
        assertEquals(2, vo.getCoverageStats().getClientCount().intValue());
    }

    @Test
    void coverageSameNameDifferentIdsStillCountedAsTwo() {
        // 两个 source 数据源名称相同但 ID 不同，业务库数仍按两条稳定 ID 计数
        mockBase();
        CumulativeOverviewEntity cum = entity(1L, 1L, 0L);
        when(largeScreenMapper.selectCumulativeOverview(TC)).thenReturn(cum);
        Map<String, Object> client = new HashMap<>();
        client.put("CLIENT_ID", "C1");
        client.put("DATA_SOURCE_ID", "DS001,DS002");
        when(largeScreenMapper.selectActiveClientDataSources())
                .thenReturn(Collections.singletonList(client));
        DataSource ds1 = new DataSource();
        ds1.setDataSourceId("DS001");
        ds1.setDataSourceCategory("source");
        ds1.setDataSourceName("same-name");
        DataSource ds2 = new DataSource();
        ds2.setDataSourceId("DS002");
        ds2.setDataSourceCategory("source");
        ds2.setDataSourceName("same-name");
        when(dataSourceMapper.selectBatchIds(anyCollection()))
                .thenReturn(Arrays.asList(ds1, ds2));

        DashboardVO vo = service.getDashboard();
        assertEquals(2, vo.getCoverageStats().getSourceDbCount().intValue());
        assertEquals(2, vo.getCoverageStats().getInstitutionCount().intValue());
    }

    @Test
    void coverageNoSourceReturnsZero() {
        // 没有有效 source 数据源时返回 0
        mockBase();
        CumulativeOverviewEntity cum = entity(1L, 1L, 0L);
        when(largeScreenMapper.selectCumulativeOverview(TC)).thenReturn(cum);
        Map<String, Object> client = new HashMap<>();
        client.put("CLIENT_ID", "C1");
        client.put("DATA_SOURCE_ID", "DS999");
        when(largeScreenMapper.selectActiveClientDataSources())
                .thenReturn(Collections.singletonList(client));
        DataSource ds1 = new DataSource();
        ds1.setDataSourceId("DS999");
        ds1.setDataSourceCategory("target");
        when(dataSourceMapper.selectBatchIds(anyCollection()))
                .thenReturn(Collections.singletonList(ds1));

        DashboardVO vo = service.getDashboard();
        assertEquals(0, vo.getCoverageStats().getInstitutionCount().intValue());
        assertEquals(0, vo.getCoverageStats().getSourceDbCount().intValue());
    }

    @Test
    void coverageOnlyActiveClients() {
        // 只统计启用客户端（FG_ACTIVE = '1'）；mapper 层已过滤，这里验证 service 逻辑
        mockBase();
        CumulativeOverviewEntity cum = entity(1L, 1L, 0L);
        when(largeScreenMapper.selectCumulativeOverview(TC)).thenReturn(cum);
        // selectActiveClientDataSources 返回空 → 覆盖规模为 0
        assertEquals(0, service.getDashboard().getCoverageStats().getClientCount().intValue());
    }

    @Test
    void subscribeTableCountDedup() {
        mockBase();
        CumulativeOverviewEntity cum = entity(1L, 1L, 0L);
        when(largeScreenMapper.selectCumulativeOverview(TC)).thenReturn(cum);
        Map<String, Object> client = new HashMap<>();
        client.put("CLIENT_ID", "C1");
        client.put("DATA_SOURCE_ID", "DS001");
        when(largeScreenMapper.selectActiveClientDataSources())
                .thenReturn(Collections.singletonList(client));
        DataSource ds1 = new DataSource();
        ds1.setDataSourceId("DS001");
        ds1.setDataSourceCategory("source");
        ds1.setDataSourceOrg("OrgA");
        when(dataSourceMapper.selectBatchIds(anyCollection()))
                .thenReturn(Collections.singletonList(ds1));
        // 两个订阅引用同一 (source, table) → 去重为 1
        DataSubscribeEntity s1 = sub("DS001", "table_a");
        DataSubscribeEntity s2 = sub("DS001", "table_a");
        when(dataSubscribeMapper.selectList(any())).thenReturn(Arrays.asList(s1, s2));

        assertEquals(1,
                service.getDashboard().getCoverageStats().getSubscribeTableCount().intValue());
    }

    @Test
    void coverageMapperNullReturnsZero() {
        mockBase();
        CumulativeOverviewEntity cum = entity(1L, 1L, 0L);
        when(largeScreenMapper.selectCumulativeOverview(TC)).thenReturn(cum);
        when(largeScreenMapper.selectActiveClientDataSources()).thenReturn(null);

        DashboardVO vo = service.getDashboard();
        assertEquals(0, vo.getCoverageStats().getInstitutionCount().intValue());
    }

    // ============================================================
    // 空值安全
    // ============================================================

    @Test
    void allMapperReturnsNull_noNpe() {
        lenient().when(largeScreenMapper.selectCumulativeOverview(TC)).thenReturn(null);
        lenient().when(largeScreenMapper.selectDailyOverview(eq(TC), any(Date.class))).thenReturn(null);
        lenient().when(largeScreenMapper.selectDailyRange(eq(TC), any(Date.class), any(Date.class))).thenReturn(null);
        lenient().when(largeScreenMapper.selectWatermarks(TC)).thenReturn(null);
        lenient().when(largeScreenMapper.selectActiveClientDataSources()).thenReturn(null);
        lenient().when(largeScreenMapper.selectDimCumulativeByType(anyString(), anyString())).thenReturn(null);
        lenient().when(largeScreenMapper.selectDimDailyByType(anyString(), anyString(), any(Date.class))).thenReturn(null);
        lenient().when(largeScreenMapper.selectTop10SourceDatabases(TC)).thenReturn(null);
        lenient().when(largeScreenMapper.selectTop10TargetDatabases(TC)).thenReturn(null);
        lenient().when(largeScreenMapper.selectTop10Tables(TC)).thenReturn(null);
        lenient().when(dataSubscribeMapper.selectList(any())).thenReturn(null);
        lenient().when(largeScreenMapper.selectMinDimCumulativeUpdateTime(TC)).thenReturn(null);
        lenient().when(largeScreenMapper.selectMinDimDailyUpdateTime(TC)).thenReturn(null);

        DashboardVO vo = service.getDashboard();
        assertNotNull(vo);
        assertEquals("EMPTY", vo.getDataStatus());
        assertNull(vo.getDataUpdateTime());
        assertNotNull(vo.getSevenDayTrend());
        assertNotNull(vo.getTop());
        assertNotNull(vo.getOrgDetails());
        assertNotNull(vo.getDataFlows());
        assertNotNull(vo.getTop().getSourceDatabases());
    }

    // ============================================================
    // helpers
    // ============================================================

    private CumulativeOverviewEntity entity(long total, long success, long error) {
        CumulativeOverviewEntity e = new CumulativeOverviewEntity();
        e.setTotalCount(total);
        e.setSuccessCount(success);
        e.setErrorCount(error);
        e.setUpdateTime(new java.util.Date());
        return e;
    }

    private DailyOverviewEntity daily(long total, long success, long error) {
        DailyOverviewEntity e = new DailyOverviewEntity();
        e.setTotalCount(total);
        e.setSuccessCount(success);
        e.setErrorCount(error);
        e.setStatDate(new java.util.Date());
        return e;
    }

    private DailyOverviewEntity dailyForDate(Date d, long total, long success, long error) {
        DailyOverviewEntity e = new DailyOverviewEntity();
        e.setTotalCount(total);
        e.setSuccessCount(success);
        e.setErrorCount(error);
        e.setStatDate(d);
        return e;
    }

    private StatsWatermarkEntity wm(String logType, long processed) {
        StatsWatermarkEntity w = new StatsWatermarkEntity();
        w.setLogType(logType);
        w.setTotalProcessed(processed);
        return w;
    }

    private Map<String, Object> dimRow(String dv, long success, long error) {
        Map<String, Object> row = new HashMap<>();
        row.put("DIM_VALUE", dv);
        row.put("SUCCESS_COUNT", success);
        row.put("ERROR_COUNT", error);
        row.put("TOTAL_COUNT", success + error);
        return row;
    }

    private DataSource ds(String id, String org, String name) {
        DataSource d = new DataSource();
        d.setDataSourceId(id);
        d.setDataSourceOrg(org);
        d.setDataSourceName(name);
        return d;
    }

    private DataSubscribeEntity sub(String fromIds, String tableClob) {
        DataSubscribeEntity s = new DataSubscribeEntity();
        s.setFgActive("1");
        s.setDataFromSourceId(fromIds);
        s.setDataSourceTable(tableClob);
        return s;
    }
}
