package com.bsoft.cdcconfig.logquery.vo;

/**
 * 数据源候选行（API §5.2）。org 为 NULL/空串时前端显示"未定义名称"。
 */
public class DataSourceOptionVO {

    private String id;
    private String org;

    public String getId() {
        return id;
    }

    public void setId(String id) {
        this.id = id;
    }

    public String getOrg() {
        return org;
    }

    public void setOrg(String org) {
        this.org = org;
    }
}
