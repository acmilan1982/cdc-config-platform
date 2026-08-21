package com.bsoft.cdcconfig.logquery.vo;

/**
 * 列表行（API §6.3）。cdcLogId / offset 为字符串；
 * 时间字段为 yyyy-MM-dd HH:mm:ss 字符串；null 字段按 non_null 策略省略。
 */
public class LogListVO {

    private String cdcLogId;
    private String sourceDataSourceId;
    private String sourceDataSourceName;
    private String sourceTableName;
    private String targetDataSourceId;
    private String targetDataSourceName;
    private String targetTableName;
    private String instructionType;
    private String logSummary;
    private boolean hasLogDetail;
    private boolean hasRawMessage;
    private String offset;
    private String sourceTime;
    private String kafkaEnqueueTime;
    private String targetTime;
    private String insertTime;

    public String getCdcLogId() {
        return cdcLogId;
    }

    public void setCdcLogId(String cdcLogId) {
        this.cdcLogId = cdcLogId;
    }

    public String getSourceDataSourceId() {
        return sourceDataSourceId;
    }

    public void setSourceDataSourceId(String sourceDataSourceId) {
        this.sourceDataSourceId = sourceDataSourceId;
    }

    public String getSourceDataSourceName() {
        return sourceDataSourceName;
    }

    public void setSourceDataSourceName(String sourceDataSourceName) {
        this.sourceDataSourceName = sourceDataSourceName;
    }

    public String getSourceTableName() {
        return sourceTableName;
    }

    public void setSourceTableName(String sourceTableName) {
        this.sourceTableName = sourceTableName;
    }

    public String getTargetDataSourceId() {
        return targetDataSourceId;
    }

    public void setTargetDataSourceId(String targetDataSourceId) {
        this.targetDataSourceId = targetDataSourceId;
    }

    public String getTargetDataSourceName() {
        return targetDataSourceName;
    }

    public void setTargetDataSourceName(String targetDataSourceName) {
        this.targetDataSourceName = targetDataSourceName;
    }

    public String getTargetTableName() {
        return targetTableName;
    }

    public void setTargetTableName(String targetTableName) {
        this.targetTableName = targetTableName;
    }

    public String getInstructionType() {
        return instructionType;
    }

    public void setInstructionType(String instructionType) {
        this.instructionType = instructionType;
    }

    public String getLogSummary() {
        return logSummary;
    }

    public void setLogSummary(String logSummary) {
        this.logSummary = logSummary;
    }

    public boolean isHasLogDetail() {
        return hasLogDetail;
    }

    public void setHasLogDetail(boolean hasLogDetail) {
        this.hasLogDetail = hasLogDetail;
    }

    public boolean isHasRawMessage() {
        return hasRawMessage;
    }

    public void setHasRawMessage(boolean hasRawMessage) {
        this.hasRawMessage = hasRawMessage;
    }

    public String getOffset() {
        return offset;
    }

    public void setOffset(String offset) {
        this.offset = offset;
    }

    public String getSourceTime() {
        return sourceTime;
    }

    public void setSourceTime(String sourceTime) {
        this.sourceTime = sourceTime;
    }

    public String getKafkaEnqueueTime() {
        return kafkaEnqueueTime;
    }

    public void setKafkaEnqueueTime(String kafkaEnqueueTime) {
        this.kafkaEnqueueTime = kafkaEnqueueTime;
    }

    public String getTargetTime() {
        return targetTime;
    }

    public void setTargetTime(String targetTime) {
        this.targetTime = targetTime;
    }

    public String getInsertTime() {
        return insertTime;
    }

    public void setInsertTime(String insertTime) {
        this.insertTime = insertTime;
    }
}
