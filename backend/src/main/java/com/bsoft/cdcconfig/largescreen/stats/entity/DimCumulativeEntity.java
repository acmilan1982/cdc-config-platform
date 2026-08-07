package com.bsoft.cdcconfig.largescreen.stats.entity;

import com.baomidou.mybatisplus.annotation.TableName;
import java.util.Date;

@TableName("CDC_STATS_DIM_CUMULATIVE")
public class DimCumulativeEntity {

    private String taskCode;
    private String dimType;
    private String dimValue;
    private Long successCount;
    private Long errorCount;
    private Long totalCount;
    private String lastBatchId;
    private Date createTime;
    private Date updateTime;

    public String getTaskCode() { return taskCode; }
    public void setTaskCode(String v) { this.taskCode = v; }
    public String getDimType() { return dimType; }
    public void setDimType(String v) { this.dimType = v; }
    public String getDimValue() { return dimValue; }
    public void setDimValue(String v) { this.dimValue = v; }
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
