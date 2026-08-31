package com.bsoft.cdcconfig.subscription.vo;

/**
 * 目标库候选（API.md §4.1）。类名前缀 Subscription 以避免与
 * {@code datasource.vo.TargetOptionVO} 在 MyBatis 类型别名注册时冲突
 * （type-aliases-package 按简单类名注册）。
 */
public class SubscriptionTargetOptionVO {

    private String dataSourceId;
    private String dataSourceOrg;

    public String getDataSourceId() { return dataSourceId; }
    public void setDataSourceId(String dataSourceId) { this.dataSourceId = dataSourceId; }

    public String getDataSourceOrg() { return dataSourceOrg; }
    public void setDataSourceOrg(String dataSourceOrg) { this.dataSourceOrg = dataSourceOrg; }
}
