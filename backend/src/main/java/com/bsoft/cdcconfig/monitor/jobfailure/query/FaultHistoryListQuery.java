package com.bsoft.cdcconfig.monitor.jobfailure.query;

/**
 * 故障历史列表查询（JFM-API-007）。
 * 仅接收 clientId、dataSourceId、固定 range；不含任何分页参数。
 */
public class FaultHistoryListQuery {

    private String clientId;
    private String dataSourceId;
    private String range;

    public String getClientId() { return clientId; }
    public void setClientId(String clientId) { this.clientId = clientId; }

    public String getDataSourceId() { return dataSourceId; }
    public void setDataSourceId(String dataSourceId) { this.dataSourceId = dataSourceId; }

    public String getRange() { return range; }
    public void setRange(String range) { this.range = range; }
}
