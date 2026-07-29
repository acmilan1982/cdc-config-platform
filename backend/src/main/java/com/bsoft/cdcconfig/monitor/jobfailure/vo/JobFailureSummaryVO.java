package com.bsoft.cdcconfig.monitor.jobfailure.vo;

import java.time.LocalDateTime;

public class JobFailureSummaryVO {

    private String clientId;
    private String clientName;
    private String dataSourceId;
    private String dataSourceName;
    private LocalDateTime latestFailureTime;
    private Long latestEventId;
    private Long latestFaultRootId;
    private String latestRecordStatus;
    private String latestRecordStatusLabel;
    private String latestFaultProcessResult;
    private String latestFaultProcessResultLabel;
    private int latestRestartCount;
    private int eventCountInWindow;
    private boolean hasUnclosedProcess;
    private boolean hasDataAnomaly;

    public String getClientId() { return clientId; }
    public void setClientId(String clientId) { this.clientId = clientId; }

    public String getClientName() { return clientName; }
    public void setClientName(String clientName) { this.clientName = clientName; }

    public String getDataSourceId() { return dataSourceId; }
    public void setDataSourceId(String dataSourceId) { this.dataSourceId = dataSourceId; }

    public String getDataSourceName() { return dataSourceName; }
    public void setDataSourceName(String dataSourceName) { this.dataSourceName = dataSourceName; }

    public LocalDateTime getLatestFailureTime() { return latestFailureTime; }
    public void setLatestFailureTime(LocalDateTime latestFailureTime) { this.latestFailureTime = latestFailureTime; }

    public Long getLatestEventId() { return latestEventId; }
    public void setLatestEventId(Long latestEventId) { this.latestEventId = latestEventId; }

    public Long getLatestFaultRootId() { return latestFaultRootId; }
    public void setLatestFaultRootId(Long latestFaultRootId) { this.latestFaultRootId = latestFaultRootId; }

    public String getLatestRecordStatus() { return latestRecordStatus; }
    public void setLatestRecordStatus(String latestRecordStatus) { this.latestRecordStatus = latestRecordStatus; }

    public String getLatestRecordStatusLabel() { return latestRecordStatusLabel; }
    public void setLatestRecordStatusLabel(String latestRecordStatusLabel) { this.latestRecordStatusLabel = latestRecordStatusLabel; }

    public String getLatestFaultProcessResult() { return latestFaultProcessResult; }
    public void setLatestFaultProcessResult(String latestFaultProcessResult) { this.latestFaultProcessResult = latestFaultProcessResult; }

    public String getLatestFaultProcessResultLabel() { return latestFaultProcessResultLabel; }
    public void setLatestFaultProcessResultLabel(String latestFaultProcessResultLabel) { this.latestFaultProcessResultLabel = latestFaultProcessResultLabel; }

    public int getLatestRestartCount() { return latestRestartCount; }
    public void setLatestRestartCount(int latestRestartCount) { this.latestRestartCount = latestRestartCount; }

    public int getEventCountInWindow() { return eventCountInWindow; }
    public void setEventCountInWindow(int eventCountInWindow) { this.eventCountInWindow = eventCountInWindow; }

    public boolean isHasUnclosedProcess() { return hasUnclosedProcess; }
    public void setHasUnclosedProcess(boolean hasUnclosedProcess) { this.hasUnclosedProcess = hasUnclosedProcess; }

    public boolean isHasDataAnomaly() { return hasDataAnomaly; }
    public void setHasDataAnomaly(boolean hasDataAnomaly) { this.hasDataAnomaly = hasDataAnomaly; }
}
