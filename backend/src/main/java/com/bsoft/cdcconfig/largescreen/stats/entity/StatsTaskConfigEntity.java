package com.bsoft.cdcconfig.largescreen.stats.entity;

import com.baomidou.mybatisplus.annotation.TableId;
import com.baomidou.mybatisplus.annotation.TableName;
import java.util.Date;

@TableName("CDC_STATS_TASK_CONFIG")
public class StatsTaskConfigEntity {

    @TableId
    private String taskCode;
    private String taskName;
    private Integer enabled;
    private Integer startupDelayMinutes;
    private Integer scheduleIntervalMinutes;
    private Integer safetyDelayMinutes;
    private Integer batchSize;
    private Integer maxBatchesPerRun;
    private Integer maxRunDurationSeconds;
    private Date createTime;
    private Date updateTime;
    private String updatedBy;

    public String getTaskCode() { return taskCode; }
    public void setTaskCode(String v) { this.taskCode = v; }
    public String getTaskName() { return taskName; }
    public void setTaskName(String v) { this.taskName = v; }
    public Integer getEnabled() { return enabled; }
    public void setEnabled(Integer v) { this.enabled = v; }
    public Integer getStartupDelayMinutes() { return startupDelayMinutes; }
    public void setStartupDelayMinutes(Integer v) { this.startupDelayMinutes = v; }
    public Integer getScheduleIntervalMinutes() { return scheduleIntervalMinutes; }
    public void setScheduleIntervalMinutes(Integer v) { this.scheduleIntervalMinutes = v; }
    public Integer getSafetyDelayMinutes() { return safetyDelayMinutes; }
    public void setSafetyDelayMinutes(Integer v) { this.safetyDelayMinutes = v; }
    public Integer getBatchSize() { return batchSize; }
    public void setBatchSize(Integer v) { this.batchSize = v; }
    public Integer getMaxBatchesPerRun() { return maxBatchesPerRun; }
    public void setMaxBatchesPerRun(Integer v) { this.maxBatchesPerRun = v; }
    public Integer getMaxRunDurationSeconds() { return maxRunDurationSeconds; }
    public void setMaxRunDurationSeconds(Integer v) { this.maxRunDurationSeconds = v; }
    public Date getCreateTime() { return createTime; }
    public void setCreateTime(Date v) { this.createTime = v; }
    public Date getUpdateTime() { return updateTime; }
    public void setUpdateTime(Date v) { this.updateTime = v; }
    public String getUpdatedBy() { return updatedBy; }
    public void setUpdatedBy(String v) { this.updatedBy = v; }
}
