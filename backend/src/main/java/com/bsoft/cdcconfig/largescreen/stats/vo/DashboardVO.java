package com.bsoft.cdcconfig.largescreen.stats.vo;

import java.util.List;

/**
 * 大屏仪表盘聚合响应。
 * 包含核心指标、覆盖规模、成功率、7 日趋势、机构排名、
 * 三类 Top 10（源库 / 目标库 / 表）、数据流向、数据状态和统计更新时间。
 */
public class DashboardVO {

    private String title;
    private String subtitle;
    private String dataUpdateTime;
    private String dataStatus;
    private CoreMetricsVO coreMetrics;
    private CoverageStatsVO coverageStats;
    private DataRatioVO cumulativeRatio;
    private DataRatioVO todayRatio;
    private List<DailyTrendVO> sevenDayTrend;
    private Top10VO top;
    private List<OrgRankVO> orgDetails;
    private List<DataFlowVO> dataFlows;

    public String getTitle() { return title; }
    public void setTitle(String v) { this.title = v; }
    public String getSubtitle() { return subtitle; }
    public void setSubtitle(String v) { this.subtitle = v; }
    public String getDataUpdateTime() { return dataUpdateTime; }
    public void setDataUpdateTime(String v) { this.dataUpdateTime = v; }
    public String getDataStatus() { return dataStatus; }
    public void setDataStatus(String v) { this.dataStatus = v; }
    public CoreMetricsVO getCoreMetrics() { return coreMetrics; }
    public void setCoreMetrics(CoreMetricsVO v) { this.coreMetrics = v; }
    public CoverageStatsVO getCoverageStats() { return coverageStats; }
    public void setCoverageStats(CoverageStatsVO v) { this.coverageStats = v; }
    public DataRatioVO getCumulativeRatio() { return cumulativeRatio; }
    public void setCumulativeRatio(DataRatioVO v) { this.cumulativeRatio = v; }
    public DataRatioVO getTodayRatio() { return todayRatio; }
    public void setTodayRatio(DataRatioVO v) { this.todayRatio = v; }
    public List<DailyTrendVO> getSevenDayTrend() { return sevenDayTrend; }
    public void setSevenDayTrend(List<DailyTrendVO> v) { this.sevenDayTrend = v; }
    public Top10VO getTop() { return top; }
    public void setTop(Top10VO v) { this.top = v; }
    public List<OrgRankVO> getOrgDetails() { return orgDetails; }
    public void setOrgDetails(List<OrgRankVO> v) { this.orgDetails = v; }
    public List<DataFlowVO> getDataFlows() { return dataFlows; }
    public void setDataFlows(List<DataFlowVO> v) { this.dataFlows = v; }
}
