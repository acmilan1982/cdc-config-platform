package com.bsoft.cdcconfig.monitor.jobfailure.entity;

import com.baomidou.mybatisplus.annotation.TableField;
import com.baomidou.mybatisplus.annotation.TableId;
import com.baomidou.mybatisplus.annotation.TableName;

import java.time.LocalDateTime;

@TableName("CDC_JOB_FAILURE_EVENT")
public class JobFailureEvent {

    @TableId("ID")
    private Long id;

    @TableField("CLIENT_ID")
    private String clientId;

    @TableField("DATA_SOURCE_ID")
    private String dataSourceId;

    @TableField("FAILED_JOB_ID")
    private String failedJobId;

    @TableField("FAILURE_TIME")
    private LocalDateTime failureTime;

    @TableField("FLINK_STATUS")
    private String flinkStatus;

    @TableField("FAILURE_REASON")
    private String failureReason;

    @TableField("FAILURE_DETAIL")
    private String failureDetail;

    @TableField("EVENT_RESULT")
    private String eventResult;

    @TableField("IGNORE_REASON")
    private String ignoreReason;

    @TableField("CREATED_AT")
    private LocalDateTime createdAt;

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

    public String getFlinkStatus() { return flinkStatus; }
    public void setFlinkStatus(String flinkStatus) { this.flinkStatus = flinkStatus; }

    public String getFailureReason() { return failureReason; }
    public void setFailureReason(String failureReason) { this.failureReason = failureReason; }

    public String getFailureDetail() { return failureDetail; }
    public void setFailureDetail(String failureDetail) { this.failureDetail = failureDetail; }

    public String getEventResult() { return eventResult; }
    public void setEventResult(String eventResult) { this.eventResult = eventResult; }

    public String getIgnoreReason() { return ignoreReason; }
    public void setIgnoreReason(String ignoreReason) { this.ignoreReason = ignoreReason; }

    public LocalDateTime getCreatedAt() { return createdAt; }
    public void setCreatedAt(LocalDateTime createdAt) { this.createdAt = createdAt; }
}
