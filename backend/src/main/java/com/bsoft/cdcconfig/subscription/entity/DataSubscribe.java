package com.bsoft.cdcconfig.subscription.entity;

import com.baomidou.mybatisplus.annotation.IdType;
import com.baomidou.mybatisplus.annotation.TableField;
import com.baomidou.mybatisplus.annotation.TableId;
import com.baomidou.mybatisplus.annotation.TableName;

import java.util.Date;

/**
 * 订阅记录实体（订阅模块专用，复用 CDC_DATA_SUBSCRIBE 表）。
 * 主键由 Service 显式生成 32 位无连字符 UUID（IdType.INPUT，TBD-01 结论），
 * 不得沿用大屏 {@code largescreen.stats.entity.DataSubscribeEntity} 的无 IdType 写法。
 */
@TableName("CDC_DATA_SUBSCRIBE")
public class DataSubscribe {

    @TableId(value = "DATA_SUB_ID", type = IdType.INPUT)
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
    public void setDataSubId(String dataSubId) { this.dataSubId = dataSubId; }

    public String getDataSubDesc() { return dataSubDesc; }
    public void setDataSubDesc(String dataSubDesc) { this.dataSubDesc = dataSubDesc; }

    public String getDataFromSourceId() { return dataFromSourceId; }
    public void setDataFromSourceId(String dataFromSourceId) { this.dataFromSourceId = dataFromSourceId; }

    public String getDataToSourceId() { return dataToSourceId; }
    public void setDataToSourceId(String dataToSourceId) { this.dataToSourceId = dataToSourceId; }

    public String getDataSourceTable() { return dataSourceTable; }
    public void setDataSourceTable(String dataSourceTable) { this.dataSourceTable = dataSourceTable; }

    public String getDataSourceComment() { return dataSourceComment; }
    public void setDataSourceComment(String dataSourceComment) { this.dataSourceComment = dataSourceComment; }

    public String getDataTargetTable() { return dataTargetTable; }
    public void setDataTargetTable(String dataTargetTable) { this.dataTargetTable = dataTargetTable; }

    public String getDataTargetComment() { return dataTargetComment; }
    public void setDataTargetComment(String dataTargetComment) { this.dataTargetComment = dataTargetComment; }

    public Date getInsertTime() { return insertTime; }
    public void setInsertTime(Date insertTime) { this.insertTime = insertTime; }

    public Date getUpdateTime() { return updateTime; }
    public void setUpdateTime(Date updateTime) { this.updateTime = updateTime; }

    public Date getDeleteTime() { return deleteTime; }
    public void setDeleteTime(Date deleteTime) { this.deleteTime = deleteTime; }

    public String getFgActive() { return fgActive; }
    public void setFgActive(String fgActive) { this.fgActive = fgActive; }
}
