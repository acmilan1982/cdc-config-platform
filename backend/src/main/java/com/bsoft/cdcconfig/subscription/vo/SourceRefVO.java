package com.bsoft.cdcconfig.subscription.vo;

/**
 * 源库引用展示（API.md §4.2）。status 为 NORMAL / INACTIVE / NOT_FOUND：
 * 已停用显示 ORG 并标记“已停用”，不存在显示原始 ID 并标记“不存在”（dataSourceOrg=null）。
 */
public class SourceRefVO {

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
