package com.bsoft.cdcconfig.subscription.vo;

/**
 * 目标库引用展示（API.md §4.2）。status 语义同 SourceRefVO。
 */
public class TargetRefVO {

    private String dataSourceId;
    private String dataSourceOrg;
    private String status;

    public String getDataSourceId() { return dataSourceId; }
    public void setDataSourceId(String dataSourceId) { this.dataSourceId = dataSourceId; }

    public String getDataSourceOrg() { return dataSourceOrg; }
    public void setDataSourceOrg(String dataSourceOrg) { this.dataSourceOrg = dataSourceOrg; }

    public String getStatus() { return status; }
    public void setStatus(String status) { this.status = status; }
}
