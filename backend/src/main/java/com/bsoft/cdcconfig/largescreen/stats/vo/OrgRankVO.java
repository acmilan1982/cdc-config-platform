package com.bsoft.cdcconfig.largescreen.stats.vo;

import java.math.BigDecimal;

public class OrgRankVO {

    private Integer rank;
    private String orgName;
    private Long todaySync;
    private Long todaySuccess;
    private Long todayError;
    private BigDecimal todaySuccessRate;
    private Long cumulativeSync;
    private String lastDataTime;

    public Integer getRank() { return rank; }
    public void setRank(Integer v) { this.rank = v; }
    public String getOrgName() { return orgName; }
    public void setOrgName(String v) { this.orgName = v; }
    public Long getTodaySync() { return todaySync; }
    public void setTodaySync(Long v) { this.todaySync = v; }
    public Long getTodaySuccess() { return todaySuccess; }
    public void setTodaySuccess(Long v) { this.todaySuccess = v; }
    public Long getTodayError() { return todayError; }
    public void setTodayError(Long v) { this.todayError = v; }
    public BigDecimal getTodaySuccessRate() { return todaySuccessRate; }
    public void setTodaySuccessRate(BigDecimal v) { this.todaySuccessRate = v; }
    public Long getCumulativeSync() { return cumulativeSync; }
    public void setCumulativeSync(Long v) { this.cumulativeSync = v; }
    public String getLastDataTime() { return lastDataTime; }
    public void setLastDataTime(String v) { this.lastDataTime = v; }
}
