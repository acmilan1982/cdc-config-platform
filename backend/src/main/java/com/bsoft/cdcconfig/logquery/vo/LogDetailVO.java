package com.bsoft.cdcconfig.logquery.vo;

/**
 * 日志详情响应（API §9.1、LQ-API-73）。cdcLogId / offset 为字符串；
 * 时间字段为 yyyy-MM-dd HH:mm:ss 字符串；除 cdcLogId、targetTime 外按可空性可选。
 */
public class LogDetailVO {

    private String cdcLogId;
    private String sourceDataSourceId;
    private String sourceTableName;
    private String targetDataSourceId;
    private String targetTableName;
    private String instructionType;
    private String resultCode;
    private String offset;
    private String sourceTime;
    private String kafkaEnqueueTime;
    private String targetTime;
    private String insertTime;
    private String logDetail;

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

    public String getLogDetail() {
        return logDetail;
    }

    public void setLogDetail(String logDetail) {
        this.logDetail = logDetail;
    }
}
