package com.bsoft.cdcconfig.monitor.jobfailure.vo;

public class ClobDetailVO {

    private String recordType;
    private Long recordId;
    private String recordIdText;
    private String contentType;
    private String content;
    private int contentLength;
    private boolean truncated;

    public String getRecordType() { return recordType; }
    public void setRecordType(String recordType) { this.recordType = recordType; }

    public Long getRecordId() { return recordId; }
    public void setRecordId(Long recordId) { this.recordId = recordId; }

    public String getRecordIdText() { return recordIdText; }
    public void setRecordIdText(String recordIdText) { this.recordIdText = recordIdText; }

    public String getContentType() { return contentType; }
    public void setContentType(String contentType) { this.contentType = contentType; }

    public String getContent() { return content; }
    public void setContent(String content) { this.content = content; }

    public int getContentLength() { return contentLength; }
    public void setContentLength(int contentLength) { this.contentLength = contentLength; }

    public boolean isTruncated() { return truncated; }
    public void setTruncated(boolean truncated) { this.truncated = truncated; }
}
