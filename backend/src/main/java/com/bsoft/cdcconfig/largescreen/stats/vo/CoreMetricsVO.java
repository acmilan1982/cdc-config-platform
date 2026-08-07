package com.bsoft.cdcconfig.largescreen.stats.vo;

import java.math.BigDecimal;

public class CoreMetricsVO {

    private Long todaySync;
    private Long cumulativeSync;
    private Long todaySuccess;
    private Long todayError;
    private BigDecimal todaySuccessRate;

    public Long getTodaySync() { return todaySync; }
    public void setTodaySync(Long v) { this.todaySync = v; }
    public Long getCumulativeSync() { return cumulativeSync; }
    public void setCumulativeSync(Long v) { this.cumulativeSync = v; }
    public Long getTodaySuccess() { return todaySuccess; }
    public void setTodaySuccess(Long v) { this.todaySuccess = v; }
    public Long getTodayError() { return todayError; }
    public void setTodayError(Long v) { this.todayError = v; }
    public BigDecimal getTodaySuccessRate() { return todaySuccessRate; }
    public void setTodaySuccessRate(BigDecimal v) { this.todaySuccessRate = v; }
}
