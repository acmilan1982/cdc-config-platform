package com.bsoft.cdcconfig.largescreen.stats.entity;

import com.baomidou.mybatisplus.annotation.TableId;
import com.baomidou.mybatisplus.annotation.TableName;
import java.util.Date;

@TableName("CDC_STATS_WATERMARK")
public class StatsWatermarkEntity {

    private String taskCode;
    private String logType;
    private Long lastLogId;
    private String lastBatchId;
    private Date lastBatchTime;
    private Long totalProcessed;
    private Date createTime;
    private Date updateTime;

    public String getTaskCode() { return taskCode; }
    public void setTaskCode(String v) { this.taskCode = v; }
    public String getLogType() { return logType; }
    public void setLogType(String v) { this.logType = v; }
    public Long getLastLogId() { return lastLogId; }
    public void setLastLogId(Long v) { this.lastLogId = v; }
    public String getLastBatchId() { return lastBatchId; }
    public void setLastBatchId(String v) { this.lastBatchId = v; }
    public Date getLastBatchTime() { return lastBatchTime; }
    public void setLastBatchTime(Date v) { this.lastBatchTime = v; }
    public Long getTotalProcessed() { return totalProcessed; }
    public void setTotalProcessed(Long v) { this.totalProcessed = v; }
    public Date getCreateTime() { return createTime; }
    public void setCreateTime(Date v) { this.createTime = v; }
    public Date getUpdateTime() { return updateTime; }
    public void setUpdateTime(Date v) { this.updateTime = v; }
}
