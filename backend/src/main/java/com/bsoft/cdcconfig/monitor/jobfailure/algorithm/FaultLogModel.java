package com.bsoft.cdcconfig.monitor.jobfailure.algorithm;

import java.time.LocalDateTime;

/**
 * Internal algorithm model — decoupled from MyBatis-Plus Entity.
 * Represents one CDC_JOB_FAILURE_HANDLE_LOG row.
 */
public class FaultLogModel {

    private Long id;
    private Long failureEventId;
    private String handleStage;
    private LocalDateTime handleTime;
    private String newJobId;
    private Integer attemptNo;
    private LocalDateTime nextRestartTime;
    private LocalDateTime restartStartTime;
    private LocalDateTime restartEndTime;
    private Long restartCountTotal;
    private Integer restartDelaySeconds;

    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }

    public Long getFailureEventId() { return failureEventId; }
    public void setFailureEventId(Long failureEventId) { this.failureEventId = failureEventId; }

    public String getHandleStage() { return handleStage; }
    public void setHandleStage(String handleStage) { this.handleStage = handleStage; }

    public LocalDateTime getHandleTime() { return handleTime; }
    public void setHandleTime(LocalDateTime handleTime) { this.handleTime = handleTime; }

    public String getNewJobId() { return newJobId; }
    public void setNewJobId(String newJobId) { this.newJobId = newJobId; }

    public Integer getAttemptNo() { return attemptNo; }
    public void setAttemptNo(Integer attemptNo) { this.attemptNo = attemptNo; }

    public LocalDateTime getNextRestartTime() { return nextRestartTime; }
    public void setNextRestartTime(LocalDateTime nextRestartTime) { this.nextRestartTime = nextRestartTime; }

    public LocalDateTime getRestartStartTime() { return restartStartTime; }
    public void setRestartStartTime(LocalDateTime restartStartTime) { this.restartStartTime = restartStartTime; }

    public LocalDateTime getRestartEndTime() { return restartEndTime; }
    public void setRestartEndTime(LocalDateTime restartEndTime) { this.restartEndTime = restartEndTime; }

    public Long getRestartCountTotal() { return restartCountTotal; }
    public void setRestartCountTotal(Long restartCountTotal) { this.restartCountTotal = restartCountTotal; }

    public Integer getRestartDelaySeconds() { return restartDelaySeconds; }
    public void setRestartDelaySeconds(Integer restartDelaySeconds) { this.restartDelaySeconds = restartDelaySeconds; }

    public boolean isRestartStarted() { return "RESTART_STARTED".equals(handleStage); }

    public boolean isDuplicateEventIgnored() { return "DUPLICATED_EVENT_IGNORED".equals(handleStage); }

    public boolean hasNewJobId() { return newJobId != null && !newJobId.isEmpty(); }

    public boolean isStableCheckPassed() { return "STABLE_CHECK_PASSED".equals(handleStage); }

    public boolean isSubmitSucceeded() { return "NEW_JOB_SUBMIT_SUCCEEDED".equals(handleStage); }
}
