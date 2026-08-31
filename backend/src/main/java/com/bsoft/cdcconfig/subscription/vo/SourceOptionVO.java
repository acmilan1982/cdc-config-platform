package com.bsoft.cdcconfig.subscription.vo;

/**
 * 源库候选（API.md §4.1）。
 */
public class SourceOptionVO {

    private String dataSourceId;
    private String dataSourceOrg;

    public String getDataSourceId() { return dataSourceId; }
    public void setDataSourceId(String dataSourceId) { this.dataSourceId = dataSourceId; }

    public String getDataSourceOrg() { return dataSourceOrg; }
    public void setDataSourceOrg(String dataSourceOrg) { this.dataSourceOrg = dataSourceOrg; }
}
