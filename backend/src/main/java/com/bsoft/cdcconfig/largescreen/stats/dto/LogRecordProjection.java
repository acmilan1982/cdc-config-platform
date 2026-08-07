package com.bsoft.cdcconfig.largescreen.stats.dto;

import java.util.Date;

/**
 * 日志轻量级投影，只包含聚合所需的7个字段。
 * 避免加载CLOB和大字段。
 */
public class LogRecordProjection {

    private long cdcLogId;
    private Date targetTime;
    private Date insertTime;
    private String sourceDataSourceId;
    private String targetDataSourceId;
    private String sourceSchemaName;
    private String sourceTableName;

    public long getCdcLogId() { return cdcLogId; }
    public void setCdcLogId(long v) { this.cdcLogId = v; }
    public Date getTargetTime() { return targetTime; }
    public void setTargetTime(Date v) { this.targetTime = v; }
    public Date getInsertTime() { return insertTime; }
    public void setInsertTime(Date v) { this.insertTime = v; }
    public String getSourceDataSourceId() { return sourceDataSourceId; }
    public void setSourceDataSourceId(String v) { this.sourceDataSourceId = v; }
    public String getTargetDataSourceId() { return targetDataSourceId; }
    public void setTargetDataSourceId(String v) { this.targetDataSourceId = v; }
    public String getSourceSchemaName() { return sourceSchemaName; }
    public void setSourceSchemaName(String v) { this.sourceSchemaName = v; }
    public String getSourceTableName() { return sourceTableName; }
    public void setSourceTableName(String v) { this.sourceTableName = v; }
}
