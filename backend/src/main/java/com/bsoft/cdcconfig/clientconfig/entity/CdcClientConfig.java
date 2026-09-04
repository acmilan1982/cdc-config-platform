package com.bsoft.cdcconfig.clientconfig.entity;

import com.baomidou.mybatisplus.annotation.TableField;
import com.baomidou.mybatisplus.annotation.TableId;
import com.baomidou.mybatisplus.annotation.TableName;

/**
 * 探针端管理 Feature 自己的写实体，映射 CDC_CLIENT_MULTIPLE。
 * 不复用 monitor/jobfailure 的只读消费模型 CdcClientMultiple，避免跨 Feature 耦合。
 */
@TableName("CDC_CLIENT_MULTIPLE")
public class CdcClientConfig {

    @TableId("CLIENT_ID")
    private String clientId;

    @TableField("CLIENT_DESC")
    private String clientDesc;

    @TableField("DATA_SOURCE_ID")
    private String dataSourceId;

    @TableField("FG_ACTIVE")
    private String fgActive;

    public String getClientId() { return clientId; }
    public void setClientId(String clientId) { this.clientId = clientId; }

    public String getClientDesc() { return clientDesc; }
    public void setClientDesc(String clientDesc) { this.clientDesc = clientDesc; }

    public String getDataSourceId() { return dataSourceId; }
    public void setDataSourceId(String dataSourceId) { this.dataSourceId = dataSourceId; }

    public String getFgActive() { return fgActive; }
    public void setFgActive(String fgActive) { this.fgActive = fgActive; }
}
