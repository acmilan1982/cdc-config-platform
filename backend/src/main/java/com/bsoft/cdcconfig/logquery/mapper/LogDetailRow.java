package com.bsoft.cdcconfig.logquery.mapper;

import java.math.BigDecimal;
import java.time.LocalDateTime;

/**
 * 日志详情最小字段查询结果行（DESIGN §6.6）。含完整 LOG_DETAIL 与 RESULT_CODE；
 * 不读取 RESULT_DETAIL / RAW_MESSAGE。
 */
public class LogDetailRow {

    private BigDecimal cdcLogId;
    private String sourceDataSourceId;
    private String sourceTableName;
    private String targetDataSourceId;
    private String targetTableName;
    private String instructionType;
    private String resultCode;
    private String offset;
    private LocalDateTime sourceTime;
    private LocalDateTime kafkaEnqueueTime;
    private LocalDateTime targetTime;
    private LocalDateTime insertTime;
    private String logDetail;

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

    public String getResultCode() {
        return resultCode;
    }

    public void setResultCode(String resultCode) {
        this.resultCode = resultCode;
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

    public String getLogDetail() {
        return logDetail;
    }

    public void setLogDetail(String logDetail) {
        this.logDetail = logDetail;
    }
}
