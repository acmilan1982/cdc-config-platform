package com.bsoft.cdcconfig.serverconfig.dto;

import java.util.List;

/**
 * 批量保存请求体（API.md SC-API-040/051）。
 * 顶层只承载 items 数组。
 */
public class ServerConfigSaveRequest {

    private List<ServerConfigSaveItem> items;

    public ServerConfigSaveRequest() {
    }

    public ServerConfigSaveRequest(List<ServerConfigSaveItem> items) {
        this.items = items;
    }

    public List<ServerConfigSaveItem> getItems() {
        return items;
    }

    public void setItems(List<ServerConfigSaveItem> items) {
        this.items = items;
    }
}
