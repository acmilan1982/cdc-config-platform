package com.bsoft.cdcconfig.monitor.jobfailure.query;

import java.time.LocalDateTime;

public class JobFailureSummaryQuery {

    private String clientId;
    private String dataSourceId;
    private String clientName;
    private String dataSourceName;
    private LocalDateTime failureTimeStart;
    private LocalDateTime failureTimeEnd;
    private String recordStatus;
    private Boolean hasUnclosedProcess;
    private Boolean hasDataAnomaly;
    private int pageNum = 1;
    private int pageSize = 20;

    public String getClientId() { return clientId; }
    public void setClientId(String clientId) { this.clientId = clientId; }

    public String getDataSourceId() { return dataSourceId; }
    public void setDataSourceId(String dataSourceId) { this.dataSourceId = dataSourceId; }

    public String getClientName() { return clientName; }
    public void setClientName(String clientName) { this.clientName = clientName; }

    public String getDataSourceName() { return dataSourceName; }
    public void setDataSourceName(String dataSourceName) { this.dataSourceName = dataSourceName; }

    public LocalDateTime getFailureTimeStart() { return failureTimeStart; }
    public void setFailureTimeStart(LocalDateTime failureTimeStart) { this.failureTimeStart = failureTimeStart; }

    public LocalDateTime getFailureTimeEnd() { return failureTimeEnd; }
    public void setFailureTimeEnd(LocalDateTime failureTimeEnd) { this.failureTimeEnd = failureTimeEnd; }

    public String getRecordStatus() { return recordStatus; }
    public void setRecordStatus(String recordStatus) { this.recordStatus = recordStatus; }

    public Boolean getHasUnclosedProcess() { return hasUnclosedProcess; }
    public void setHasUnclosedProcess(Boolean hasUnclosedProcess) { this.hasUnclosedProcess = hasUnclosedProcess; }

    public Boolean getHasDataAnomaly() { return hasDataAnomaly; }
    public void setHasDataAnomaly(Boolean hasDataAnomaly) { this.hasDataAnomaly = hasDataAnomaly; }

    public int getPageNum() { return pageNum; }
    public void setPageNum(int pageNum) { this.pageNum = pageNum; }

    public int getPageSize() { return pageSize; }
    public void setPageSize(int pageSize) { this.pageSize = pageSize; }
}
