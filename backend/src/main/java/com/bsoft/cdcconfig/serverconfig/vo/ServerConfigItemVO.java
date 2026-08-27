package com.bsoft.cdcconfig.serverconfig.vo;

/**
 * 配置项响应行（API.md SC-API-026~030）。
 */
public class ServerConfigItemVO {

    private String idServerConfig;

    private String configKey;

    private String configDesc;

    private String configValue;

    /** 计算可编辑布尔（仅控件形态判定，SC-API-032）。 */
    private boolean editable;

    public String getIdServerConfig() {
        return idServerConfig;
    }

    public void setIdServerConfig(String idServerConfig) {
        this.idServerConfig = idServerConfig;
    }

    public String getConfigKey() {
        return configKey;
    }

    public void setConfigKey(String configKey) {
        this.configKey = configKey;
    }

    public String getConfigDesc() {
        return configDesc;
    }

    public void setConfigDesc(String configDesc) {
        this.configDesc = configDesc;
    }

    public String getConfigValue() {
        return configValue;
    }

    public void setConfigValue(String configValue) {
        this.configValue = configValue;
    }

    public boolean isEditable() {
        return editable;
    }

    public void setEditable(boolean editable) {
        this.editable = editable;
    }
}
