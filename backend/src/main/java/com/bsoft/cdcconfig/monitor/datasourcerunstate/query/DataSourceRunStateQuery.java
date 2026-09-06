package com.bsoft.cdcconfig.monitor.datasourcerunstate.query;

import java.util.List;

/**
 * /list 查询参数载体（API.md §4.1）。
 * clientId/sourceId/status 均为可重复查询参数，绑定为 List；归一校验在服务层完成。
 */
public class DataSourceRunStateQuery {

    private List<String> clientId;
    private List<String> sourceId;
    private List<String> status;

    public List<String> getClientId() {
        return clientId;
    }

    public void setClientId(List<String> clientId) {
        this.clientId = clientId;
    }

    public List<String> getSourceId() {
        return sourceId;
    }

    public void setSourceId(List<String> sourceId) {
        this.sourceId = sourceId;
    }

    public List<String> getStatus() {
        return status;
    }

    public void setStatus(List<String> status) {
        this.status = status;
    }
}
