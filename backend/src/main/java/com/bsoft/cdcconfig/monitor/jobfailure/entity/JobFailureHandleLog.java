package com.bsoft.cdcconfig.monitor.jobfailure.entity;

import com.baomidou.mybatisplus.annotation.TableField;
import com.baomidou.mybatisplus.annotation.TableId;
import com.baomidou.mybatisplus.annotation.TableName;

import java.time.LocalDateTime;

@TableName("CDC_JOB_FAILURE_HANDLE_LOG")
public class JobFailureHandleLog {

    @TableId("ID")
    private Long id;

    @TableField("FAILURE_EVENT_ID")
    private Long failureEventId;

    @TableField("CLIENT_ID")
    private String clientId;

    @TableField("DATA_SOURCE_ID")
    private String dataSourceId;

    @TableField("FAILED_JOB_ID")
    private String failedJobId;

    @TableField("ATTEMPT_NO")
    private Integer attemptNo;

    @TableField("HANDLE_STAGE")
    private String handleStage;

    @TableField("HANDLE_TIME")
    private LocalDateTime handleTime;

    @TableField("CONSECUTIVE_FAILURES")
    private Integer consecutiveFailures;

    @TableField("RESTART_COUNT_TOTAL")
    private Long restartCountTotal;

    @TableField("RESTART_DELAY_SECONDS")
    private Integer restartDelaySeconds;

    @TableField("NEXT_RESTART_TIME")
    private LocalDateTime nextRestartTime;

    @TableField("RESTART_START_TIME")
    private LocalDateTime restartStartTime;

    @TableField("RESTART_END_TIME")
    private LocalDateTime restartEndTime;

    @TableField("NEW_JOB_ID")
    private String newJobId;

    @TableField("ERROR_DETAIL")
    private String errorDetail;

    @TableField("REMARK")
    private String remark;

    @TableField("CREATED_AT")
    private LocalDateTime createdAt;

    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }

    public Long getFailureEventId() { return failureEventId; }
    public void setFailureEventId(Long failureEventId) { this.failureEventId = failureEventId; }

    public String getClientId() { return clientId; }
    public void setClientId(String clientId) { this.clientId = clientId; }

    public String getDataSourceId() { return dataSourceId; }
    public void setDataSourceId(String dataSourceId) { this.dataSourceId = dataSourceId; }

    public String getFailedJobId() { return failedJobId; }
    public void setFailedJobId(String failedJobId) { this.failedJobId = failedJobId; }

    public Integer getAttemptNo() { return attemptNo; }
    public void setAttemptNo(Integer attemptNo) { this.attemptNo = attemptNo; }

    public String getHandleStage() { return handleStage; }
    public void setHandleStage(String handleStage) { this.handleStage = handleStage; }

    public LocalDateTime getHandleTime() { return handleTime; }
    public void setHandleTime(LocalDateTime handleTime) { this.handleTime = handleTime; }

    public Integer getConsecutiveFailures() { return consecutiveFailures; }
    public void setConsecutiveFailures(Integer consecutiveFailures) { this.consecutiveFailures = consecutiveFailures; }

    public Long getRestartCountTotal() { return restartCountTotal; }
    public void setRestartCountTotal(Long restartCountTotal) { this.restartCountTotal = restartCountTotal; }

    public Integer getRestartDelaySeconds() { return restartDelaySeconds; }
    public void setRestartDelaySeconds(Integer restartDelaySeconds) { this.restartDelaySeconds = restartDelaySeconds; }

    public LocalDateTime getNextRestartTime() { return nextRestartTime; }
    public void setNextRestartTime(LocalDateTime nextRestartTime) { this.nextRestartTime = nextRestartTime; }

    public LocalDateTime getRestartStartTime() { return restartStartTime; }
    public void setRestartStartTime(LocalDateTime restartStartTime) { this.restartStartTime = restartStartTime; }

    public LocalDateTime getRestartEndTime() { return restartEndTime; }
    public void setRestartEndTime(LocalDateTime restartEndTime) { this.restartEndTime = restartEndTime; }

    public String getNewJobId() { return newJobId; }
    public void setNewJobId(String newJobId) { this.newJobId = newJobId; }

    public String getErrorDetail() { return errorDetail; }
    public void setErrorDetail(String errorDetail) { this.errorDetail = errorDetail; }

    public String getRemark() { return remark; }
    public void setRemark(String remark) { this.remark = remark; }

    public LocalDateTime getCreatedAt() { return createdAt; }
    public void setCreatedAt(LocalDateTime createdAt) { this.createdAt = createdAt; }
}
