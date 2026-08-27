package com.bsoft.cdcconfig.serverconfig.vo;

import java.util.List;

/**
 * 中心端配置页面查询响应 data（API.md SC-API-023~025）。
 */
public class ServerConfigPageVO {

    private String serverId;

    private int configCount;

    private List<ServerConfigItemVO> items;

    public String getServerId() {
        return serverId;
    }

    public void setServerId(String serverId) {
        this.serverId = serverId;
    }

    public int getConfigCount() {
        return configCount;
    }

    public void setConfigCount(int configCount) {
        this.configCount = configCount;
    }

    public List<ServerConfigItemVO> getItems() {
        return items;
    }

    public void setItems(List<ServerConfigItemVO> items) {
        this.items = items;
    }
}
