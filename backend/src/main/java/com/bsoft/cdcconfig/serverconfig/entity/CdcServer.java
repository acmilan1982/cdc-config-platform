package com.bsoft.cdcconfig.serverconfig.entity;

import com.baomidou.mybatisplus.annotation.TableField;
import com.baomidou.mybatisplus.annotation.TableId;
import com.baomidou.mybatisplus.annotation.TableName;

/**
 * CDC_SERVER 中心端登记表实体。
 * 本 Feature 只读取该表用于识别唯一中心端（SC-DB-010），不做任何写操作。
 */
@TableName("CDC_SERVER")
public class CdcServer {

    @TableId("SERVER_ID")
    private String serverId;

    @TableField("SERVER_DESC")
    private String serverDesc;

    @TableField("DATA_SOURCE_ID")
    private String dataSourceId;

    @TableField("FG_ACTIVE")
    private String fgActive;

    public String getServerId() {
        return serverId;
    }

    public void setServerId(String serverId) {
        this.serverId = serverId;
    }

    public String getServerDesc() {
        return serverDesc;
    }

    public void setServerDesc(String serverDesc) {
        this.serverDesc = serverDesc;
    }

    public String getDataSourceId() {
        return dataSourceId;
    }

    public void setDataSourceId(String dataSourceId) {
        this.dataSourceId = dataSourceId;
    }

    public String getFgActive() {
        return fgActive;
    }

    public void setFgActive(String fgActive) {
        this.fgActive = fgActive;
    }
}
