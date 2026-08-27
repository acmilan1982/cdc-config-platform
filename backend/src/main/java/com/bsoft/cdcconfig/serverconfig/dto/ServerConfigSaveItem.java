package com.bsoft.cdcconfig.serverconfig.dto;

/**
 * 批量保存请求单条记录（API.md SC-API-051）。
 * 只承载 idServerConfig + configValue，均为 JSON 字符串。
 */
public class ServerConfigSaveItem {

    private String idServerConfig;

    private String configValue;

    public ServerConfigSaveItem() {
    }

    public ServerConfigSaveItem(String idServerConfig, String configValue) {
        this.idServerConfig = idServerConfig;
        this.configValue = configValue;
    }

    public String getIdServerConfig() {
        return idServerConfig;
    }

    public void setIdServerConfig(String idServerConfig) {
        this.idServerConfig = idServerConfig;
    }

    public String getConfigValue() {
        return configValue;
    }

    public void setConfigValue(String configValue) {
        this.configValue = configValue;
    }
}
