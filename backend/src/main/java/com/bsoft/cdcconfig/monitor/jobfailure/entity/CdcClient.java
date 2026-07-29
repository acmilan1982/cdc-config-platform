package com.bsoft.cdcconfig.monitor.jobfailure.entity;

import com.baomidou.mybatisplus.annotation.TableField;
import com.baomidou.mybatisplus.annotation.TableId;
import com.baomidou.mybatisplus.annotation.TableName;

@TableName("CDC_CLIENT")
public class CdcClient {

    @TableId("CLIENT_ID")
    private String clientId;

    @TableField("CLIENT_DESC")
    private String clientDesc;

    public String getClientId() { return clientId; }
    public void setClientId(String clientId) { this.clientId = clientId; }

    public String getClientDesc() { return clientDesc; }
    public void setClientDesc(String clientDesc) { this.clientDesc = clientDesc; }
}
