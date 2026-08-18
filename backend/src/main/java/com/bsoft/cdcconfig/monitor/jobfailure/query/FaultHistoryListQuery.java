package com.bsoft.cdcconfig.monitor.jobfailure.query;

/**
 * 故障历史列表查询（JFM-API-007）。
 * range 仅允许 TODAY / LAST_7_DAYS / LAST_30_DAYS；前端不得传入任意 start/end。
 */
public class FaultHistoryListQuery {

    private String clientId;
    private String dataSourceId;
    private String range;
    private int page = 1;
    private int pageSize = 20;

    public String getClientId() { return clientId; }
    public void setClientId(String clientId) { this.clientId = clientId; }

    public String getDataSourceId() { return dataSourceId; }
    public void setDataSourceId(String dataSourceId) { this.dataSourceId = dataSourceId; }

    public String getRange() { return range; }
    public void setRange(String range) { this.range = range; }

    public int getPage() { return page; }
    public void setPage(int page) { this.page = page; }

    public int getPageSize() { return pageSize; }
    public void setPageSize(int pageSize) { this.pageSize = pageSize; }
}
