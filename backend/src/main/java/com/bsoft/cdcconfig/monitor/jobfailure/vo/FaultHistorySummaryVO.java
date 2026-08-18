package com.bsoft.cdcconfig.monitor.jobfailure.vo;

import java.time.LocalDateTime;

/**
 * 故障历史概览行（JFM-API-006）。
 * 每行对应当前配置全集中的一个 (clientId, dataSourceId)。
 * 故障次数按派生故障过程根事件去重；时间归属使用过程首次失败时间。
 */
public class FaultHistorySummaryVO {

    private String clientId;
    private String dataSourceId;
    private String dataSourceOrg;
    private boolean dataSourceExists;
    private Boolean dataSourceActive;
    private int todayFailureCount;
    private int last7DaysFailureCount;
    private int last30DaysFailureCount;
    private LocalDateTime latestFailureTime;
    private String latestProcessStatus;
    private String latestProcessStatusLabel;

    public String getClientId() { return clientId; }
    public void setClientId(String clientId) { this.clientId = clientId; }

    public String getDataSourceId() { return dataSourceId; }
    public void setDataSourceId(String dataSourceId) { this.dataSourceId = dataSourceId; }

    public String getDataSourceOrg() { return dataSourceOrg; }
    public void setDataSourceOrg(String dataSourceOrg) { this.dataSourceOrg = dataSourceOrg; }

    public boolean isDataSourceExists() { return dataSourceExists; }
    public void setDataSourceExists(boolean dataSourceExists) { this.dataSourceExists = dataSourceExists; }

    public Boolean getDataSourceActive() { return dataSourceActive; }
    public void setDataSourceActive(Boolean dataSourceActive) { this.dataSourceActive = dataSourceActive; }

    public int getTodayFailureCount() { return todayFailureCount; }
    public void setTodayFailureCount(int todayFailureCount) { this.todayFailureCount = todayFailureCount; }

    public int getLast7DaysFailureCount() { return last7DaysFailureCount; }
    public void setLast7DaysFailureCount(int last7DaysFailureCount) { this.last7DaysFailureCount = last7DaysFailureCount; }

    public int getLast30DaysFailureCount() { return last30DaysFailureCount; }
    public void setLast30DaysFailureCount(int last30DaysFailureCount) { this.last30DaysFailureCount = last30DaysFailureCount; }

    public LocalDateTime getLatestFailureTime() { return latestFailureTime; }
    public void setLatestFailureTime(LocalDateTime latestFailureTime) { this.latestFailureTime = latestFailureTime; }

    public String getLatestProcessStatus() { return latestProcessStatus; }
    public void setLatestProcessStatus(String latestProcessStatus) { this.latestProcessStatus = latestProcessStatus; }

    public String getLatestProcessStatusLabel() { return latestProcessStatusLabel; }
    public void setLatestProcessStatusLabel(String latestProcessStatusLabel) { this.latestProcessStatusLabel = latestProcessStatusLabel; }
}
