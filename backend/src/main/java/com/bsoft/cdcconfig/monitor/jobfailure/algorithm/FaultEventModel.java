package com.bsoft.cdcconfig.monitor.jobfailure.algorithm;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

/**
 * Internal algorithm model — decoupled from MyBatis-Plus Entity.
 * Represents one CDC_JOB_FAILURE_EVENT row after basic filtering.
 */
public class FaultEventModel {

    private Long id;
    private String clientId;
    private String dataSourceId;
    private String failedJobId;
    private LocalDateTime failureTime;
    private String eventResult;
    private LocalDateTime createdAt;
    private boolean hasDuplicateIgnoredLog;

    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }

    public String getClientId() { return clientId; }
    public void setClientId(String clientId) { this.clientId = clientId; }

    public String getDataSourceId() { return dataSourceId; }
    public void setDataSourceId(String dataSourceId) { this.dataSourceId = dataSourceId; }

    public String getFailedJobId() { return failedJobId; }
    public void setFailedJobId(String failedJobId) { this.failedJobId = failedJobId; }

    public LocalDateTime getFailureTime() { return failureTime; }
    public void setFailureTime(LocalDateTime failureTime) { this.failureTime = failureTime; }

    public String getEventResult() { return eventResult; }
    public void setEventResult(String eventResult) { this.eventResult = eventResult; }

    public LocalDateTime getCreatedAt() { return createdAt; }
    public void setCreatedAt(LocalDateTime createdAt) { this.createdAt = createdAt; }

    public boolean isHasDuplicateIgnoredLog() { return hasDuplicateIgnoredLog; }
    public void setHasDuplicateIgnoredLog(boolean hasDuplicateIgnoredLog) { this.hasDuplicateIgnoredLog = hasDuplicateIgnoredLog; }

    public boolean isInvalid() { return "IGNORED_INVALID".equals(eventResult); }
    public boolean isStale() { return "IGNORED_STALE".equals(eventResult); }
    public boolean isMainChainEligible() {
        return !isInvalid() && !isStale() && !hasDuplicateIgnoredLog;
    }
}
