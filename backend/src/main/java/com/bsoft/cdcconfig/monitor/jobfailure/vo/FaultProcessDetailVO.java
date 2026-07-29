package com.bsoft.cdcconfig.monitor.jobfailure.vo;

import java.time.LocalDateTime;
import java.util.List;

public class FaultProcessDetailVO {

    private Long faultRootId;
    private String clientId;
    private String dataSourceId;
    private LocalDateTime firstFailureTime;
    private LocalDateTime lastHandleTime;
    private List<JobChainVO> jobChain;
    private List<EventCardVO> mainChainEvents;
    private List<EventCardVO> excludedEvents;
    private List<HandleTimelineVO> handleTimeline;
    private int restartCount;
    private String recordStatus;
    private String recordStatusLabel;
    private String faultProcessResult;
    private String faultProcessResultLabel;
    private List<AnomalyVO> anomalies;

    public Long getFaultRootId() { return faultRootId; }
    public void setFaultRootId(Long faultRootId) { this.faultRootId = faultRootId; }

    public String getClientId() { return clientId; }
    public void setClientId(String clientId) { this.clientId = clientId; }

    public String getDataSourceId() { return dataSourceId; }
    public void setDataSourceId(String dataSourceId) { this.dataSourceId = dataSourceId; }

    public LocalDateTime getFirstFailureTime() { return firstFailureTime; }
    public void setFirstFailureTime(LocalDateTime firstFailureTime) { this.firstFailureTime = firstFailureTime; }

    public LocalDateTime getLastHandleTime() { return lastHandleTime; }
    public void setLastHandleTime(LocalDateTime lastHandleTime) { this.lastHandleTime = lastHandleTime; }

    public List<JobChainVO> getJobChain() { return jobChain; }
    public void setJobChain(List<JobChainVO> jobChain) { this.jobChain = jobChain; }

    public List<EventCardVO> getMainChainEvents() { return mainChainEvents; }
    public void setMainChainEvents(List<EventCardVO> mainChainEvents) { this.mainChainEvents = mainChainEvents; }

    public List<EventCardVO> getExcludedEvents() { return excludedEvents; }
    public void setExcludedEvents(List<EventCardVO> excludedEvents) { this.excludedEvents = excludedEvents; }

    public List<HandleTimelineVO> getHandleTimeline() { return handleTimeline; }
    public void setHandleTimeline(List<HandleTimelineVO> handleTimeline) { this.handleTimeline = handleTimeline; }

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

    public List<AnomalyVO> getAnomalies() { return anomalies; }
    public void setAnomalies(List<AnomalyVO> anomalies) { this.anomalies = anomalies; }
}
