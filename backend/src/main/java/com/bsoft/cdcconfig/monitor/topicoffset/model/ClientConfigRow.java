package com.bsoft.cdcconfig.monitor.topicoffset.model;

/**
 * CDC_CLIENT_MULTIPLE 显式列投影行（CLIENT_ID/CLIENT_DESC/FG_ACTIVE，全部行含停用）。
 */
public class ClientConfigRow {

    private String clientId;
    private String clientDesc;
    private String fgActive;

    public String getClientId() {
        return clientId;
    }

    public void setClientId(String clientId) {
        this.clientId = clientId;
    }

    public String getClientDesc() {
        return clientDesc;
    }

    public void setClientDesc(String clientDesc) {
        this.clientDesc = clientDesc;
    }

    public String getFgActive() {
        return fgActive;
    }

    public void setFgActive(String fgActive) {
        this.fgActive = fgActive;
    }
}
