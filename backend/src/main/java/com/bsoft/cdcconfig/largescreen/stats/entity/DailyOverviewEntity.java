package com.bsoft.cdcconfig.largescreen.stats.entity;

import com.baomidou.mybatisplus.annotation.TableName;
import java.util.Date;

@TableName("CDC_STATS_DAILY_OVERVIEW")
public class DailyOverviewEntity {

    private String taskCode;
    private Date statDate;
    private Long successCount;
    private Long errorCount;
    private Long totalCount;
    private String lastBatchId;
    private Date createTime;
    private Date updateTime;

    public String getTaskCode() { return taskCode; }
    public void setTaskCode(String v) { this.taskCode = v; }
    public Date getStatDate() { return statDate; }
    public void setStatDate(Date v) { this.statDate = v; }
    public Long getSuccessCount() { return successCount; }
    public void setSuccessCount(Long v) { this.successCount = v; }
    public Long getErrorCount() { return errorCount; }
    public void setErrorCount(Long v) { this.errorCount = v; }
    public Long getTotalCount() { return totalCount; }
    public void setTotalCount(Long v) { this.totalCount = v; }
    public String getLastBatchId() { return lastBatchId; }
    public void setLastBatchId(String v) { this.lastBatchId = v; }
    public Date getCreateTime() { return createTime; }
    public void setCreateTime(Date v) { this.createTime = v; }
    public Date getUpdateTime() { return updateTime; }
    public void setUpdateTime(Date v) { this.updateTime = v; }
}
