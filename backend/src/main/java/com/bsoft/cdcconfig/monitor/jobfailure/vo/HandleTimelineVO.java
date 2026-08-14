package com.bsoft.cdcconfig.monitor.jobfailure.vo;

import java.time.LocalDateTime;

public class HandleTimelineVO {

    private Long logId;
    private String logIdText;
    private Long eventId;
    private String handleStage;
    private LocalDateTime handleTime;
    private Integer attemptNo;
    private String newJobId;
    private String remark;

    public Long getLogId() { return logId; }
    public void setLogId(Long logId) { this.logId = logId; }

    public String getLogIdText() { return logIdText; }
    public void setLogIdText(String logIdText) { this.logIdText = logIdText; }

    public Long getEventId() { return eventId; }
    public void setEventId(Long eventId) { this.eventId = eventId; }

    public String getHandleStage() { return handleStage; }
    public void setHandleStage(String handleStage) { this.handleStage = handleStage; }

    public LocalDateTime getHandleTime() { return handleTime; }
    public void setHandleTime(LocalDateTime handleTime) { this.handleTime = handleTime; }

    public Integer getAttemptNo() { return attemptNo; }
    public void setAttemptNo(Integer attemptNo) { this.attemptNo = attemptNo; }

    public String getNewJobId() { return newJobId; }
    public void setNewJobId(String newJobId) { this.newJobId = newJobId; }

    public String getRemark() { return remark; }
    public void setRemark(String remark) { this.remark = remark; }
}
