package com.bsoft.cdcconfig.largescreen.stats.entity;

import com.baomidou.mybatisplus.annotation.TableField;
import com.baomidou.mybatisplus.annotation.TableId;
import com.baomidou.mybatisplus.annotation.TableName;

import java.util.Date;

@TableName("CDC_DATA_SUBSCRIBE")
public class DataSubscribeEntity {

    @TableId("DATA_SUB_ID")
    private String dataSubId;

    @TableField("DATA_SUB_DESC")
    private String dataSubDesc;

    @TableField("DATA_FROM_SOURCE_ID")
    private String dataFromSourceId;

    @TableField("DATA_TO_SOURCE_ID")
    private String dataToSourceId;

    @TableField("DATA_SOURCE_TABLE")
    private String dataSourceTable;

    @TableField("DATA_SOURCE_COMMENT")
    private String dataSourceComment;

    @TableField("DATA_TARGET_TABLE")
    private String dataTargetTable;

    @TableField("DATA_TARGET_COMMENT")
    private String dataTargetComment;

    @TableField("INSERT_TIME")
    private Date insertTime;

    @TableField("UPDATE_TIME")
    private Date updateTime;

    @TableField("DELETE_TIME")
    private Date deleteTime;

    @TableField("FG_ACTIVE")
    private String fgActive;

    public String getDataSubId() { return dataSubId; }
    public void setDataSubId(String v) { this.dataSubId = v; }
    public String getDataSubDesc() { return dataSubDesc; }
    public void setDataSubDesc(String v) { this.dataSubDesc = v; }
    public String getDataFromSourceId() { return dataFromSourceId; }
    public void setDataFromSourceId(String v) { this.dataFromSourceId = v; }
    public String getDataToSourceId() { return dataToSourceId; }
    public void setDataToSourceId(String v) { this.dataToSourceId = v; }
    public String getDataSourceTable() { return dataSourceTable; }
    public void setDataSourceTable(String v) { this.dataSourceTable = v; }
    public String getDataSourceComment() { return dataSourceComment; }
    public void setDataSourceComment(String v) { this.dataSourceComment = v; }
    public String getDataTargetTable() { return dataTargetTable; }
    public void setDataTargetTable(String v) { this.dataTargetTable = v; }
    public String getDataTargetComment() { return dataTargetComment; }
    public void setDataTargetComment(String v) { this.dataTargetComment = v; }
    public Date getInsertTime() { return insertTime; }
    public void setInsertTime(Date v) { this.insertTime = v; }
    public Date getUpdateTime() { return updateTime; }
    public void setUpdateTime(Date v) { this.updateTime = v; }
    public Date getDeleteTime() { return deleteTime; }
    public void setDeleteTime(Date v) { this.deleteTime = v; }
    public String getFgActive() { return fgActive; }
    public void setFgActive(String v) { this.fgActive = v; }
}
