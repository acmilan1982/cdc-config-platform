package com.bsoft.cdcconfig.monitor.jobfailure.compat;

import com.baomidou.mybatisplus.annotation.TableField;
import com.baomidou.mybatisplus.annotation.TableId;
import com.baomidou.mybatisplus.annotation.TableName;

import java.time.LocalDateTime;

@TableName("CDC_JOB_FAILURE_EVENT")
public class DateMappingTestEntity {

    @TableId("ID")
    private Long id;

    @TableField("FAILURE_TIME")
    private LocalDateTime failureTime;

    @TableField("CREATED_AT")
    private LocalDateTime createdAt;

    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }

    public LocalDateTime getFailureTime() { return failureTime; }
    public void setFailureTime(LocalDateTime failureTime) { this.failureTime = failureTime; }

    public LocalDateTime getCreatedAt() { return createdAt; }
    public void setCreatedAt(LocalDateTime createdAt) { this.createdAt = createdAt; }
}
