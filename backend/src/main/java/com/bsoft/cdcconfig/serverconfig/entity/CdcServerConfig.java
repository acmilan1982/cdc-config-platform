package com.bsoft.cdcconfig.serverconfig.entity;

import com.baomidou.mybatisplus.annotation.TableField;
import com.baomidou.mybatisplus.annotation.TableId;
import com.baomidou.mybatisplus.annotation.TableName;

/**
 * CDC_SERVER_CONFIG 中心端配置项表实体。
 * 本 Feature 查询全部既有记录，并只更新可编辑记录的 CONFIG_VALUE（SC-DB-011、SC-DB-027）。
 */
@TableName("CDC_SERVER_CONFIG")
public class CdcServerConfig {

    @TableId("ID_SERVER_CONFIG")
    private String idServerConfig;

    @TableField("SERVER_ID")
    private String serverId;

    @TableField("CONFIG_DESC")
    private String configDesc;

    @TableField("CONFIG_KEY")
    private String configKey;

    @TableField("CONFIG_VALUE")
    private String configValue;

    @TableField("IS_EDITABLE")
    private String isEditable;

    public String getIdServerConfig() {
        return idServerConfig;
    }

    public void setIdServerConfig(String idServerConfig) {
        this.idServerConfig = idServerConfig;
    }

    public String getServerId() {
        return serverId;
    }

    public void setServerId(String serverId) {
        this.serverId = serverId;
    }

    public String getConfigDesc() {
        return configDesc;
    }

    public void setConfigDesc(String configDesc) {
        this.configDesc = configDesc;
    }

    public String getConfigKey() {
        return configKey;
    }

    public void setConfigKey(String configKey) {
        this.configKey = configKey;
    }

    public String getConfigValue() {
        return configValue;
    }

    public void setConfigValue(String configValue) {
        this.configValue = configValue;
    }

    public String getIsEditable() {
        return isEditable;
    }

    public void setIsEditable(String isEditable) {
        this.isEditable = isEditable;
    }
}
