package com.bsoft.cdcconfig.monitor.jobfailure.vo;

import java.time.LocalDateTime;

public class JobFailureSummaryVO {

    private String clientId;
    private String clientName;
    private String dataSourceId;
    private String dataSourceName;
    private String jobStatus;
    private LocalDateTime latestFailureTime;
    private Long latestEventId;
    private Long latestFaultRootId;
    private int latestRestartCount;
    private int eventCountInWindow;

    public String getClientId() { return clientId; }
    public void setClientId(String clientId) { this.clientId = clientId; }

    public String getClientName() { return clientName; }
    public void setClientName(String clientName) { this.clientName = clientName; }

    public String getDataSourceId() { return dataSourceId; }
    public void setDataSourceId(String dataSourceId) { this.dataSourceId = dataSourceId; }

    public String getDataSourceName() { return dataSourceName; }
    public void setDataSourceName(String dataSourceName) { this.dataSourceName = dataSourceName; }

    public String getJobStatus() { return jobStatus; }
    public void setJobStatus(String jobStatus) { this.jobStatus = jobStatus; }

    public LocalDateTime getLatestFailureTime() { return latestFailureTime; }
    public void setLatestFailureTime(LocalDateTime latestFailureTime) { this.latestFailureTime = latestFailureTime; }

    public Long getLatestEventId() { return latestEventId; }
    public void setLatestEventId(Long latestEventId) { this.latestEventId = latestEventId; }

    public Long getLatestFaultRootId() { return latestFaultRootId; }
    public void setLatestFaultRootId(Long latestFaultRootId) { this.latestFaultRootId = latestFaultRootId; }

    public int getLatestRestartCount() { return latestRestartCount; }
    public void setLatestRestartCount(int latestRestartCount) { this.latestRestartCount = latestRestartCount; }

    public int getEventCountInWindow() { return eventCountInWindow; }
    public void setEventCountInWindow(int eventCountInWindow) { this.eventCountInWindow = eventCountInWindow; }
}
