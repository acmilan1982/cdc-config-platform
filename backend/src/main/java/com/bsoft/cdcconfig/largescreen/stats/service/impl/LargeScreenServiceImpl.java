package com.bsoft.cdcconfig.largescreen.stats.service.impl;

import com.baomidou.mybatisplus.core.conditions.query.LambdaQueryWrapper;
import com.bsoft.cdcconfig.datasource.entity.DataSource;
import com.bsoft.cdcconfig.datasource.mapper.DataSourceMapper;
import com.bsoft.cdcconfig.largescreen.stats.entity.CumulativeOverviewEntity;
import com.bsoft.cdcconfig.largescreen.stats.entity.DailyOverviewEntity;
import com.bsoft.cdcconfig.largescreen.stats.entity.DataSubscribeEntity;
import com.bsoft.cdcconfig.largescreen.stats.entity.StatsWatermarkEntity;
import com.bsoft.cdcconfig.largescreen.stats.mapper.DataSubscribeMapper;
import com.bsoft.cdcconfig.largescreen.stats.mapper.LargeScreenMapper;
import com.bsoft.cdcconfig.largescreen.stats.service.LargeScreenService;
import com.bsoft.cdcconfig.largescreen.stats.vo.CoreMetricsVO;
import com.bsoft.cdcconfig.largescreen.stats.vo.CoverageStatsVO;
import com.bsoft.cdcconfig.largescreen.stats.vo.DailyTrendVO;
import com.bsoft.cdcconfig.largescreen.stats.vo.DashboardVO;
import com.bsoft.cdcconfig.largescreen.stats.vo.DataFlowVO;
import com.bsoft.cdcconfig.largescreen.stats.vo.DataRatioVO;
import com.bsoft.cdcconfig.largescreen.stats.vo.OrgRankVO;
import com.bsoft.cdcconfig.largescreen.stats.vo.Top10VO;
import com.bsoft.cdcconfig.largescreen.stats.vo.TopItemVO;
import org.springframework.stereotype.Service;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.sql.Date;
import java.text.SimpleDateFormat;
import java.time.LocalDate;
import java.time.ZoneId;
import java.util.ArrayList;
import java.util.Arrays;
import java.util.Calendar;
import java.util.Collections;
import java.util.Comparator;
import java.util.HashMap;
import java.util.HashSet;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.Set;

/**
 * 大屏仪表盘查询服务实现。
 * "今日"和"最近7天"均按 Asia/Shanghai 时区计算，日期边界作为绑定参数传给 Mapper。
 * 三类 Top 10 在数据库侧完成排序和截断。
 */
@Service
public class LargeScreenServiceImpl implements LargeScreenService {

    private static final String TASK_CODE = "LARGE_SCREEN_STATS";
    private static final ZoneId ZONE_SHANGHAI = ZoneId.of("Asia/Shanghai");
    private static final String[] WEEKDAY_CN = {"", "周日", "周一", "周二", "周三", "周四", "周五", "周六"};

    private final LargeScreenMapper largeScreenMapper;
    private final DataSubscribeMapper dataSubscribeMapper;
    private final DataSourceMapper dataSourceMapper;

    public LargeScreenServiceImpl(LargeScreenMapper largeScreenMapper,
                                  DataSubscribeMapper dataSubscribeMapper,
                                  DataSourceMapper dataSourceMapper) {
        this.largeScreenMapper = largeScreenMapper;
        this.dataSubscribeMapper = dataSubscribeMapper;
        this.dataSourceMapper = dataSourceMapper;
    }

    @Override
    public DashboardVO getDashboard() {
        DashboardVO vo = new DashboardVO();
        vo.setTitle("CDC 数据同步统计大屏");
        vo.setSubtitle("CDC Data Sync Statistics");

        // 按 Asia/Shanghai 计算今日日期边界
        LocalDate today = LocalDate.now(ZONE_SHANGHAI);
        Date todaySqlDate = Date.valueOf(today);
        Date startDate = Date.valueOf(today.minusDays(6));

        // 查询数据库
        CumulativeOverviewEntity cumulative = largeScreenMapper.selectCumulativeOverview(TASK_CODE);
        DailyOverviewEntity todayEntity = largeScreenMapper.selectDailyOverview(TASK_CODE, todaySqlDate);
        List<DailyOverviewEntity> dailyRange = largeScreenMapper.selectDailyRange(TASK_CODE, startDate, todaySqlDate);
        List<StatsWatermarkEntity> watermarks = largeScreenMapper.selectWatermarks(TASK_CODE);

        // 数据状态
        vo.setDataStatus(determineDataStatus(cumulative, watermarks));

        // 统计更新时间：取本次展示依赖的全部结果表中有效 UPDATE_TIME 的最小值
        // 各表 UPDATE_TIME 由 TASK 4 同一批次事务内 Oracle SYSDATE 写入，取最小值即最保守的新鲜度
        vo.setDataUpdateTime(computeDataUpdateTime(cumulative, todayEntity, dailyRange, watermarks));

        // 组装各区块
        vo.setCoreMetrics(buildCoreMetrics(todayEntity, cumulative));
        vo.setCumulativeRatio(buildCumulativeRatio(cumulative));
        vo.setTodayRatio(buildTodayRatio(todayEntity));
        vo.setCoverageStats(buildCoverageStats());
        vo.setSevenDayTrend(buildSevenDayTrend(dailyRange, today));
        vo.setTop(buildTop10());
        vo.setOrgDetails(buildOrgDetails(todaySqlDate));
        vo.setDataFlows(buildDataFlows());

        // 确保集合字段不为 null
        if (vo.getSevenDayTrend() == null) { vo.setSevenDayTrend(Collections.emptyList()); }
        if (vo.getOrgDetails() == null) { vo.setOrgDetails(Collections.emptyList()); }
        if (vo.getDataFlows() == null) { vo.setDataFlows(Collections.emptyList()); }
        if (vo.getTop() == null) {
            Top10VO emptyTop = new Top10VO();
            emptyTop.setSourceDatabases(Collections.<TopItemVO>emptyList());
            emptyTop.setTargetDatabases(Collections.<TopItemVO>emptyList());
            emptyTop.setTables(Collections.<TopItemVO>emptyList());
            vo.setTop(emptyTop);
        }

        return vo;
    }

    // ---- 核心指标 ----

    private CoreMetricsVO buildCoreMetrics(DailyOverviewEntity today,
                                           CumulativeOverviewEntity cumulative) {
        CoreMetricsVO vo = new CoreMetricsVO();
        if (today != null) {
            vo.setTodaySync(today.getTotalCount());
            vo.setTodaySuccess(today.getSuccessCount());
            vo.setTodayError(today.getErrorCount());
            vo.setTodaySuccessRate(calcRate(today.getSuccessCount(), today.getTotalCount()));
        } else {
            vo.setTodaySync(0L);
            vo.setTodaySuccess(0L);
            vo.setTodayError(0L);
            vo.setTodaySuccessRate(BigDecimal.ZERO.setScale(2));
        }
        vo.setCumulativeSync(cumulative != null ? cumulative.getTotalCount() : 0L);
        return vo;
    }

    // ---- 比率 ----

    private DataRatioVO buildCumulativeRatio(CumulativeOverviewEntity cumulative) {
        DataRatioVO vo = new DataRatioVO();
        vo.setSuccessCount(cumulative != null ? cumulative.getSuccessCount() : 0L);
        vo.setErrorCount(cumulative != null ? cumulative.getErrorCount() : 0L);
        return vo;
    }

    private DataRatioVO buildTodayRatio(DailyOverviewEntity today) {
        DataRatioVO vo = new DataRatioVO();
        vo.setSuccessCount(today != null ? today.getSuccessCount() : 0L);
        vo.setErrorCount(today != null ? today.getErrorCount() : 0L);
        return vo;
    }

    // ---- 覆盖规模（冻结链：启用客户端→source数据源→订阅表） ----

    private CoverageStatsVO buildCoverageStats() {
        CoverageStatsVO vo = new CoverageStatsVO();

        // 步骤1：查询启用客户端及其 DATA_SOURCE_IDS（逗号分隔）
        List<Map<String, Object>> activeClients = largeScreenMapper.selectActiveClientDataSources();
        if (activeClients == null || activeClients.isEmpty()) {
            return zeroCoverage(vo);
        }
        vo.setClientCount(activeClients.size());

        // 步骤2：解析所有 DATA_SOURCE_IDS，收集为 Set
        Set<String> clientSourceIdSet = new HashSet<>();
        for (Map<String, Object> client : activeClients) {
            String dsIds = (String) client.get("DATA_SOURCE_ID");
            addCommaSplitIds(clientSourceIdSet, dsIds);
        }
        if (clientSourceIdSet.isEmpty()) {
            return zeroCoverage(vo);
        }

        // 步骤3：查询 CDC_DATA_SOURCE，过滤 LOWER(CATEGORY) = 'source'
        List<DataSource> allDsList = dataSourceMapper.selectBatchIds(clientSourceIdSet);
        List<DataSource> sourceDsList = new ArrayList<>();
        for (DataSource ds : allDsList) {
            if (ds.getDataSourceCategory() != null
                    && "source".equalsIgnoreCase(ds.getDataSourceCategory())) {
                sourceDsList.add(ds);
            }
        }
        // 接入机构数：按稳定 DATA_SOURCE_ID 去重计数（每个有效 source 数据源计为一条接入机构记录）
        // 不得按 DATA_SOURCE_ORG 或机构名称额外去重
        vo.setInstitutionCount(sourceDsList.size());
        vo.setSourceDbCount(sourceDsList.size());

        // 步骤4：订阅表去重（在启用 source 数据源范围内）
        Set<String> sourceIdSet = new HashSet<>();
        for (DataSource ds : sourceDsList) {
            sourceIdSet.add(ds.getDataSourceId());
        }
        vo.setSubscribeTableCount(countDistinctSubscribeTables(sourceIdSet));

        // targetDbCount 从维度统计去重（TARGET_DB）
        vo.setTargetDbCount(countDistinctTargetDbs());

        return vo;
    }

    private CoverageStatsVO zeroCoverage(CoverageStatsVO vo) {
        vo.setInstitutionCount(0);
        vo.setClientCount(0);
        vo.setSourceDbCount(0);
        vo.setTargetDbCount(0);
        vo.setSubscribeTableCount(0);
        return vo;
    }

    /**
     * 在启用 source 数据源范围内统计去重订阅表数。
     * 去重键：source数据源ID + 表名（newline-separated CLOB 中的每一行）。
     */
    private int countDistinctSubscribeTables(Set<String> activeSourceIds) {
        List<DataSubscribeEntity> subscriptions = dataSubscribeMapper.selectList(
                new LambdaQueryWrapper<DataSubscribeEntity>()
                        .eq(DataSubscribeEntity::getFgActive, "1"));
        if (subscriptions.isEmpty()) {
            return 0;
        }
        Set<String> dedupSet = new HashSet<>();
        for (DataSubscribeEntity sub : subscriptions) {
            List<String> fromIds = parseCommaSeparated(sub.getDataFromSourceId());
            for (String fromId : fromIds) {
                if (!activeSourceIds.contains(fromId)) {
                    continue;
                }
                String tableClob = sub.getDataSourceTable();
                if (tableClob != null && !tableClob.isEmpty()) {
                    for (String tableName : tableClob.split("\n")) {
                        String trimmed = tableName.trim();
                        if (!trimmed.isEmpty()) {
                            dedupSet.add(fromId + "\n" + trimmed);
                        }
                    }
                }
            }
        }
        return dedupSet.size();
    }

    /** 从维度统计中统计去重目标库数。 */
    private int countDistinctTargetDbs() {
        List<Map<String, Object>> rows = largeScreenMapper.selectDimCumulativeByType(TASK_CODE, "TARGET_DB");
        if (rows == null || rows.isEmpty()) {
            return 0;
        }
        Set<String> tgtSet = new HashSet<>();
        for (Map<String, Object> row : rows) {
            String dimValue = (String) row.get("DIM_VALUE");
            if (dimValue != null && !dimValue.isEmpty()) {
                tgtSet.add(dimValue);
            }
        }
        return tgtSet.size();
    }

    // ---- 7 日趋势（固定 7 点、补零、升序、Asia/Shanghai） ----

    private List<DailyTrendVO> buildSevenDayTrend(List<DailyOverviewEntity> dbRows, LocalDate today) {
        // 构建 DB 查询结果索引：statDate(yyyy-MM-dd) → entity
        SimpleDateFormat dbDateFmt = new SimpleDateFormat("yyyy-MM-dd");
        Map<String, DailyOverviewEntity> index = new HashMap<>();
        if (dbRows != null) {
            for (DailyOverviewEntity row : dbRows) {
                if (row.getStatDate() != null) {
                    index.put(dbDateFmt.format(row.getStatDate()), row);
                }
            }
        }

        // 生成最近 7 天骨架（today-6 → today），升序
        SimpleDateFormat outDateFmt = new SimpleDateFormat("yyyy-MM-dd");
        List<DailyTrendVO> result = new ArrayList<>(7);
        for (int i = 6; i >= 0; i--) {
            LocalDate day = today.minusDays(i);
            java.util.Date dayDate = Date.valueOf(day);
            String key = outDateFmt.format(dayDate);

            DailyTrendVO vo = new DailyTrendVO();
            vo.setDate(key);
            vo.setWeekday(getWeekdayCn(dayDate));
            DailyOverviewEntity entity = index.get(key);
            if (entity != null) {
                vo.setCount(entity.getTotalCount() != null ? entity.getTotalCount() : 0L);
            } else {
                vo.setCount(0L);
            }
            result.add(vo);
        }
        return result;
    }

    // ---- 三类 Top 10 ----

    private Top10VO buildTop10() {
        Top10VO top = new Top10VO();

        List<TopItemVO> sourceItems = buildTopItems(
                largeScreenMapper.selectTop10SourceDatabases(TASK_CODE), "SOURCE_DATA_SOURCE");
        List<TopItemVO> targetItems = buildTopItems(
                largeScreenMapper.selectTop10TargetDatabases(TASK_CODE), "TARGET_DB");
        List<TopItemVO> tableItems = buildTopItems(
                largeScreenMapper.selectTop10Tables(TASK_CODE), "TABLE");

        top.setSourceDatabases(sourceItems);
        top.setTargetDatabases(targetItems);
        top.setTables(tableItems);
        return top;
    }

    private List<TopItemVO> buildTopItems(List<Map<String, Object>> rows, String dimType) {
        if (rows == null || rows.isEmpty()) {
            return Collections.emptyList();
        }
        // 预加载名称映射
        Set<String> dimValues = new HashSet<>();
        for (Map<String, Object> row : rows) {
            String dv = (String) row.get("DIM_VALUE");
            if (dv != null) { dimValues.add(dv); }
        }
        Map<String, DataSource> dsMap = loadDataSourceMap(dimValues);

        List<TopItemVO> result = new ArrayList<>(rows.size());
        int rank = 0;
        for (Map<String, Object> row : rows) {
            rank++;
            String dimValue = (String) row.get("DIM_VALUE");
            long success = toLong(row.get("SUCCESS_COUNT"));
            long error = toLong(row.get("ERROR_COUNT"));

            TopItemVO item = new TopItemVO();
            item.setRank(rank);
            item.setKey(dimValue);
            item.setName(resolveDisplayName(dimValue, dimType, dsMap));
            item.setSuccessCount(success);
            item.setErrorCount(error);
            item.setTotalCount(success + error);
            result.add(item);
        }
        return result;
    }

    /** 根据维度类型和值解析展示名称，优先映射 CDC_DATA_SOURCE，其次使用 DIM_VALUE 本身。 */
    private String resolveDisplayName(String dimValue, String dimType,
                                      Map<String, DataSource> dsMap) {
        if ("TABLE".equals(dimType)) {
            // DIM_VALUE 格式: "sourceId.schema.tableName" — 直接用作展示名
            return dimValue;
        }
        // SOURCE_DATA_SOURCE 或 TARGET_DB：通过 CDC_DATA_SOURCE 映射名称
        DataSource ds = dsMap.get(dimValue);
        if (ds != null && ds.getDataSourceName() != null && !ds.getDataSourceName().isEmpty()) {
            return ds.getDataSourceName();
        }
        return dimValue; // 回退：使用 DATA_SOURCE_ID
    }

    // ---- 机构排名（按 ORG 聚合 SOURCE_DATA_SOURCE 维度） ----

    private List<OrgRankVO> buildOrgDetails(Date todaySqlDate) {
        List<Map<String, Object>> cumulativeRows =
                largeScreenMapper.selectDimCumulativeByType(TASK_CODE, "SOURCE_DATA_SOURCE");
        List<Map<String, Object>> dailyRows =
                largeScreenMapper.selectDimDailyByType(TASK_CODE, "SOURCE_DATA_SOURCE", todaySqlDate);

        // 收集所有 source 数据源 ID
        Set<String> sourceIds = new HashSet<>();
        if (cumulativeRows != null) {
            for (Map<String, Object> row : cumulativeRows) {
                String dv = (String) row.get("DIM_VALUE");
                if (dv != null) { sourceIds.add(dv); }
            }
        }
        if (dailyRows != null) {
            for (Map<String, Object> row : dailyRows) {
                String dv = (String) row.get("DIM_VALUE");
                if (dv != null) { sourceIds.add(dv); }
            }
        }
        Map<String, DataSource> dsMap = loadDataSourceMap(sourceIds);

        // 按 ORG 聚合累计数据
        Map<String, OrgAgg> orgAggMap = new LinkedHashMap<>();
        if (cumulativeRows != null) {
            for (Map<String, Object> row : cumulativeRows) {
            String dimValue = (String) row.get("DIM_VALUE");
            String orgName = resolveOrgName(dimValue, dsMap);
            long success = toLong(row.get("SUCCESS_COUNT"));
            long error = toLong(row.get("ERROR_COUNT"));
            long total = success + error;

            OrgAgg agg = orgAggMap.computeIfAbsent(orgName, k -> new OrgAgg());
            agg.orgName = orgName;
            agg.cumulativeSuccess += success;
            agg.cumulativeError += error;
            agg.cumulativeTotal += total;
            java.util.Date updateTime = (java.util.Date) row.get("UPDATE_TIME");
            if (updateTime != null && (agg.lastDataTime == null || updateTime.after(agg.lastDataTime))) {
                agg.lastDataTime = updateTime;
            }
        }
        }

        // 按 ORG 聚合今日数据
        if (dailyRows != null) {
            for (Map<String, Object> row : dailyRows) {
            String dimValue = (String) row.get("DIM_VALUE");
            String orgName = resolveOrgName(dimValue, dsMap);
            long success = toLong(row.get("SUCCESS_COUNT"));
            long error = toLong(row.get("ERROR_COUNT"));
            OrgAgg agg = orgAggMap.get(orgName);
            if (agg != null) {
                agg.todaySuccess += success;
                agg.todayError += error;
                agg.todayTotal += success + error;
            }
        }
        }

        // 按累计总量降序排序
        List<OrgAgg> sorted = new ArrayList<>(orgAggMap.values());
        sorted.sort(Comparator.comparingLong((OrgAgg a) -> a.cumulativeTotal).reversed());

        SimpleDateFormat sdf = new SimpleDateFormat("yyyy-MM-dd HH:mm:ss");
        List<OrgRankVO> result = new ArrayList<>(sorted.size());
        int rank = 0;
        for (OrgAgg agg : sorted) {
            rank++;
            OrgRankVO vo = new OrgRankVO();
            vo.setRank(rank);
            vo.setOrgName(agg.orgName);
            vo.setTodaySync(agg.todayTotal);
            vo.setTodaySuccess(agg.todaySuccess);
            vo.setTodayError(agg.todayError);
            vo.setTodaySuccessRate(calcRate(agg.todaySuccess, agg.todayTotal));
            vo.setCumulativeSync(agg.cumulativeTotal);
            vo.setLastDataTime(agg.lastDataTime != null ? sdf.format(agg.lastDataTime) : null);
            result.add(vo);
        }
        return result;
    }

    private String resolveOrgName(String dimValue, Map<String, DataSource> dsMap) {
        DataSource ds = dsMap.get(dimValue);
        if (ds != null && ds.getDataSourceOrg() != null && !ds.getDataSourceOrg().isEmpty()) {
            return ds.getDataSourceOrg();
        }
        return dimValue; // 回退：使用 DATA_SOURCE_ID
    }

    // ---- 数据流向（订阅配置驱动，映射名称后输出） ----

    private List<DataFlowVO> buildDataFlows() {
        List<DataSubscribeEntity> subscriptions = dataSubscribeMapper.selectList(
                new LambdaQueryWrapper<DataSubscribeEntity>()
                        .eq(DataSubscribeEntity::getFgActive, "1"));
        if (subscriptions == null || subscriptions.isEmpty()) {
            return Collections.emptyList();
        }

        Set<String> allIds = new HashSet<>();
        for (DataSubscribeEntity sub : subscriptions) {
            addCommaSplitIds(allIds, sub.getDataFromSourceId());
            addCommaSplitIds(allIds, sub.getDataToSourceId());
        }
        Map<String, DataSource> dsMap = loadDataSourceMap(allIds);

        Map<String, DataFlowVO> flowMap = new LinkedHashMap<>();
        for (DataSubscribeEntity sub : subscriptions) {
            List<String> fromIds = parseCommaSeparated(sub.getDataFromSourceId());
            List<String> toIds = parseCommaSeparated(sub.getDataToSourceId());
            int tableCount = countSubscribedTables(sub.getDataSourceTable());

            for (String fromId : fromIds) {
                DataSource sourceDs = dsMap.get(fromId);
                String sourceDbName = sourceDs != null && sourceDs.getDataSourceName() != null
                        ? sourceDs.getDataSourceName() : fromId;
                String sourceOrg = sourceDs != null ? sourceDs.getDataSourceOrg() : null;

                for (String toId : toIds) {
                    DataSource targetDs = dsMap.get(toId);
                    String targetDbName = targetDs != null && targetDs.getDataSourceName() != null
                            ? targetDs.getDataSourceName() : toId;

                    String key = fromId + "|" + toId;
                    DataFlowVO vo = flowMap.get(key);
                    if (vo == null) {
                        vo = new DataFlowVO();
                        vo.setSourceDb(sourceDbName);
                        vo.setSourceOrg(sourceOrg);
                        vo.setTargetDb(targetDbName);
                        vo.setTableCount(0);
                        flowMap.put(key, vo);
                    }
                    vo.setTableCount(vo.getTableCount() + tableCount);
                }
            }
        }

        List<DataFlowVO> result = new ArrayList<>(flowMap.values());
        result.sort(Comparator.comparingInt(DataFlowVO::getTableCount).reversed());
        return result;
    }

    // ---- 数据状态 ----

    /**
     * 判定数据就绪状态（保守规则）。
     * EMPTY:   统计结果表无任何可展示结果（累计概览为 null 或总量为 0）。
     * PARTIAL: 已有可展示统计结果，但缺少可靠证据证明统计已达到正常可用状态。
     *          仅凭水位表 totalProcessed &gt; 0 不能证明已追平，
     *          因第一批处理完成后两条流即均有处理量，而系统可能仍处于历史追赶阶段。
     * READY:   当前表结构无可靠的追平依据（无日志表访问权限），暂不返回。
     *          枚举保留 READY 值供未来具备可靠依据后使用。
     */
    String determineDataStatus(CumulativeOverviewEntity cumulative,
                               List<StatsWatermarkEntity> watermarks) {
        if (cumulative == null || cumulative.getTotalCount() == null || cumulative.getTotalCount() == 0) {
            return "EMPTY";
        }
        // 有可展示结果但无可靠追平证据 → PARTIAL
        // READY 保留不返回，待未来具备可靠依据（如独立追平标志位）后启用
        return "PARTIAL";
    }

    /**
     * 计算整套大屏展示数据的保守新鲜度时间。
     * 取本次展示依赖的全部统计结果表中有效 UPDATE_TIME 的最小值。
     * 各表 UPDATE_TIME 由 TASK 4 在同一批次事务内以 Oracle SYSDATE 写入，
     * 取最小值即最保守口径 —— 证明至少到该时间点，所有依赖表均已更新。
     *
     * 规则：
     * - EMPTY 时返回 null
     * - 已有统计结果但缺少可靠更新时间时返回 null（不伪造）
     * - 有可靠时间时返回最小值，格式 yyyy-MM-dd HH:mm:ss
     */
    private String computeDataUpdateTime(CumulativeOverviewEntity cumulative,
                                         DailyOverviewEntity todayEntity,
                                         List<DailyOverviewEntity> dailyRange,
                                         List<StatsWatermarkEntity> watermarks) {
        // EMPTY：无统计数据，不返回更新时间
        if (cumulative == null || cumulative.getTotalCount() == null || cumulative.getTotalCount() == 0) {
            return null;
        }

        List<java.util.Date> times = new ArrayList<>();

        // 累计概览
        addIfNotNull(times, cumulative.getUpdateTime());

        // 今日每日概览
        if (todayEntity != null) {
            addIfNotNull(times, todayEntity.getUpdateTime());
        }

        // 7 日趋势范围内的每日概览
        if (dailyRange != null) {
            for (DailyOverviewEntity d : dailyRange) {
                addIfNotNull(times, d.getUpdateTime());
            }
        }

        // 水位表
        if (watermarks != null) {
            for (StatsWatermarkEntity w : watermarks) {
                addIfNotNull(times, w.getUpdateTime());
            }
        }

        // 累计维度
        java.util.Date dimCumMin = largeScreenMapper.selectMinDimCumulativeUpdateTime(TASK_CODE);
        addIfNotNull(times, dimCumMin);

        // 每日维度
        java.util.Date dimDailyMin = largeScreenMapper.selectMinDimDailyUpdateTime(TASK_CODE);
        addIfNotNull(times, dimDailyMin);

        if (times.isEmpty()) {
            return null;
        }

        java.util.Date minTime = Collections.min(times);
        return new SimpleDateFormat("yyyy-MM-dd HH:mm:ss").format(minTime);
    }

    private static void addIfNotNull(List<java.util.Date> list, java.util.Date val) {
        if (val != null) {
            list.add(val);
        }
    }

    // ---- 通用工具 ----

    private BigDecimal calcRate(long success, long total) {
        if (total == 0) {
            return BigDecimal.ZERO.setScale(2, RoundingMode.UNNECESSARY);
        }
        return BigDecimal.valueOf(success)
                .multiply(BigDecimal.valueOf(100))
                .divide(BigDecimal.valueOf(total), 2, RoundingMode.HALF_UP);
    }

    private long toLong(Object val) {
        if (val instanceof Number) {
            return ((Number) val).longValue();
        }
        return 0L;
    }

    private String getWeekdayCn(java.util.Date date) {
        Calendar cal = Calendar.getInstance();
        cal.setTime(date);
        return WEEKDAY_CN[cal.get(Calendar.DAY_OF_WEEK)];
    }

    private Map<String, DataSource> loadDataSourceMap(Set<String> ids) {
        if (ids.isEmpty()) {
            return Collections.emptyMap();
        }
        List<DataSource> dsList = dataSourceMapper.selectBatchIds(ids);
        Map<String, DataSource> map = new HashMap<>();
        for (DataSource ds : dsList) {
            map.put(ds.getDataSourceId(), ds);
        }
        return map;
    }

    private void addCommaSplitIds(Set<String> set, String val) {
        if (val != null && !val.isEmpty()) {
            for (String id : val.split(",")) {
                String trimmed = id.trim();
                if (!trimmed.isEmpty()) {
                    set.add(trimmed);
                }
            }
        }
    }

    private List<String> parseCommaSeparated(String val) {
        if (val == null || val.isEmpty()) {
            return Collections.emptyList();
        }
        List<String> result = new ArrayList<>();
        for (String id : val.split(",")) {
            String trimmed = id.trim();
            if (!trimmed.isEmpty()) {
                result.add(trimmed);
            }
        }
        return result;
    }

    private int countSubscribedTables(String tableClob) {
        if (tableClob == null || tableClob.isEmpty()) {
            return 0;
        }
        return tableClob.split("\n").length;
    }

    // 内部聚合辅助类
    private static class OrgAgg {
        String orgName;
        long cumulativeSuccess;
        long cumulativeError;
        long cumulativeTotal;
        long todaySuccess;
        long todayError;
        long todayTotal;
        java.util.Date lastDataTime;
    }
}
