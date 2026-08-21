package com.bsoft.cdcconfig.logquery.mapper;

import java.math.BigDecimal;
import java.time.LocalDateTime;

/**
 * 列表轻量查询结果行（DESIGN §6.1）。CDC_LOG_ID 以 BigDecimal(scale=0) 无损映射；
 * LOG_DETAIL 只取 300 字符摘要；不读取完整大字段。
 */
public class LogListRow {

    private BigDecimal cdcLogId;
    private String sourceDataSourceId;
    private String sourceTableName;
    private String targetDataSourceId;
    private String targetTableName;
    private String instructionType;
    private String logDetailSummary;
    private Boolean hasLogDetail;
    private Boolean hasRawMessage;
    private String offset;
    private LocalDateTime sourceTime;
    private LocalDateTime kafkaEnqueueTime;
    private LocalDateTime targetTime;
    private LocalDateTime insertTime;

    public BigDecimal getCdcLogId() {
        return cdcLogId;
    }

    public void setCdcLogId(BigDecimal cdcLogId) {
        this.cdcLogId = cdcLogId;
    }

    public String getSourceDataSourceId() {
        return sourceDataSourceId;
    }

    public void setSourceDataSourceId(String sourceDataSourceId) {
        this.sourceDataSourceId = sourceDataSourceId;
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

    public String getLogDetailSummary() {
        return logDetailSummary;
    }

    public void setLogDetailSummary(String logDetailSummary) {
        this.logDetailSummary = logDetailSummary;
    }

    public Boolean getHasLogDetail() {
        return hasLogDetail;
    }

    public void setHasLogDetail(Boolean hasLogDetail) {
        this.hasLogDetail = hasLogDetail;
    }

    public Boolean getHasRawMessage() {
        return hasRawMessage;
    }

    public void setHasRawMessage(Boolean hasRawMessage) {
        this.hasRawMessage = hasRawMessage;
    }

    public String getOffset() {
        return offset;
    }

    public void setOffset(String offset) {
        this.offset = offset;
    }

    public LocalDateTime getSourceTime() {
        return sourceTime;
    }

    public void setSourceTime(LocalDateTime sourceTime) {
        this.sourceTime = sourceTime;
    }

    public LocalDateTime getKafkaEnqueueTime() {
        return kafkaEnqueueTime;
    }

    public void setKafkaEnqueueTime(LocalDateTime kafkaEnqueueTime) {
        this.kafkaEnqueueTime = kafkaEnqueueTime;
    }

    public LocalDateTime getTargetTime() {
        return targetTime;
    }

    public void setTargetTime(LocalDateTime targetTime) {
        this.targetTime = targetTime;
    }

    public LocalDateTime getInsertTime() {
        return insertTime;
    }

    public void setInsertTime(LocalDateTime insertTime) {
        this.insertTime = insertTime;
    }
}
