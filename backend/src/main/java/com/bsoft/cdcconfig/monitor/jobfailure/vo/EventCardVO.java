package com.bsoft.cdcconfig.monitor.jobfailure.vo;

import java.time.LocalDateTime;

public class EventCardVO {

    private Long eventId;
    private String eventIdText;
    private String failedJobId;
    private LocalDateTime failureTime;
    private String eventResult;
    private String validity;
    private String validityLabel;
    private boolean hasDuplicateIgnoredLog;

    public Long getEventId() { return eventId; }
    public void setEventId(Long eventId) { this.eventId = eventId; }

    public String getEventIdText() { return eventIdText; }
    public void setEventIdText(String eventIdText) { this.eventIdText = eventIdText; }

    public String getFailedJobId() { return failedJobId; }
    public void setFailedJobId(String failedJobId) { this.failedJobId = failedJobId; }

    public LocalDateTime getFailureTime() { return failureTime; }
    public void setFailureTime(LocalDateTime failureTime) { this.failureTime = failureTime; }

    public String getEventResult() { return eventResult; }
    public void setEventResult(String eventResult) { this.eventResult = eventResult; }

    public String getValidity() { return validity; }
    public void setValidity(String validity) { this.validity = validity; }

    public String getValidityLabel() { return validityLabel; }
    public void setValidityLabel(String validityLabel) { this.validityLabel = validityLabel; }

    public boolean isHasDuplicateIgnoredLog() { return hasDuplicateIgnoredLog; }
    public void setHasDuplicateIgnoredLog(boolean hasDuplicateIgnoredLog) { this.hasDuplicateIgnoredLog = hasDuplicateIgnoredLog; }
}
