package com.bsoft.cdcconfig.logquery.dto;

import java.util.List;

/**
 * 列表查询请求体（LQ-API-12 / LQ-DESIGN-02）。
 * 不含 pageSize：页容量固定 100，服务端不读取任何页容量输入。
 */
public class LogListQuery {

    private String logType;
    private List<String> sourceDataSourceIds;
    private String sourceTableName;
    private List<String> targetDataSourceIds;
    private String targetTableName;
    private String startTime;
    private String endTime;
    private String cursor;

    public String getLogType() {
        return logType;
    }

    public void setLogType(String logType) {
        this.logType = logType;
    }

    public List<String> getSourceDataSourceIds() {
        return sourceDataSourceIds;
    }

    public void setSourceDataSourceIds(List<String> sourceDataSourceIds) {
        this.sourceDataSourceIds = sourceDataSourceIds;
    }

    public String getSourceTableName() {
        return sourceTableName;
    }

    public void setSourceTableName(String sourceTableName) {
        this.sourceTableName = sourceTableName;
    }

    public List<String> getTargetDataSourceIds() {
        return targetDataSourceIds;
    }

    public void setTargetDataSourceIds(List<String> targetDataSourceIds) {
        this.targetDataSourceIds = targetDataSourceIds;
    }

    public String getTargetTableName() {
        return targetTableName;
    }

    public void setTargetTableName(String targetTableName) {
        this.targetTableName = targetTableName;
    }

    public String getStartTime() {
        return startTime;
    }

    public void setStartTime(String startTime) {
        this.startTime = startTime;
    }

    public String getEndTime() {
        return endTime;
    }

    public void setEndTime(String endTime) {
        this.endTime = endTime;
    }

    public String getCursor() {
        return cursor;
    }

    public void setCursor(String cursor) {
        this.cursor = cursor;
    }
}
