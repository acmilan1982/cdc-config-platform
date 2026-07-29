package com.bsoft.cdcconfig.monitor.jobfailure.vo;

import java.time.LocalDateTime;

public class FaultProcessSummaryVO {

    private Long faultRootId;
    private LocalDateTime startTime;
    private LocalDateTime lastRecordTime;
    private String startFailedJobId;
    private String lastSubmittedJobId;
    private int mainChainEventCount;
    private int restartCount;
    private String recordStatus;
    private String recordStatusLabel;
    private String faultProcessResult;
    private String faultProcessResultLabel;
    private boolean hasAnomalies;

    public Long getFaultRootId() { return faultRootId; }
    public void setFaultRootId(Long faultRootId) { this.faultRootId = faultRootId; }

    public LocalDateTime getStartTime() { return startTime; }
    public void setStartTime(LocalDateTime startTime) { this.startTime = startTime; }

    public LocalDateTime getLastRecordTime() { return lastRecordTime; }
    public void setLastRecordTime(LocalDateTime lastRecordTime) { this.lastRecordTime = lastRecordTime; }

    public String getStartFailedJobId() { return startFailedJobId; }
    public void setStartFailedJobId(String startFailedJobId) { this.startFailedJobId = startFailedJobId; }

    public String getLastSubmittedJobId() { return lastSubmittedJobId; }
    public void setLastSubmittedJobId(String lastSubmittedJobId) { this.lastSubmittedJobId = lastSubmittedJobId; }

    public int getMainChainEventCount() { return mainChainEventCount; }
    public void setMainChainEventCount(int mainChainEventCount) { this.mainChainEventCount = mainChainEventCount; }

    public int getRestartCount() { return restartCount; }
    public void setRestartCount(int restartCount) { this.restartCount = restartCount; }

    public String getRecordStatus() { return recordStatus; }
    public void setRecordStatus(String recordStatus) { this.recordStatus = recordStatus; }

    public String getRecordStatusLabel() { return recordStatusLabel; }
    public void setRecordStatusLabel(String recordStatusLabel) { this.recordStatusLabel = recordStatusLabel; }

    public String getFaultProcessResult() { return faultProcessResult; }
    public void setFaultProcessResult(String faultProcessResult) { this.faultProcessResult = faultProcessResult; }

    public String getFaultProcessResultLabel() { return faultProcessResultLabel; }
    public void setFaultProcessResultLabel(String faultProcessResultLabel) { this.faultProcessResultLabel = faultProcessResultLabel; }

    public boolean isHasAnomalies() { return hasAnomalies; }
    public void setHasAnomalies(boolean hasAnomalies) { this.hasAnomalies = hasAnomalies; }
}
