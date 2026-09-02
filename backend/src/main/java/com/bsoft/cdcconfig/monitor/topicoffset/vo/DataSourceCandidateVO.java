package com.bsoft.cdcconfig.monitor.topicoffset.vo;

/**
 * 数据源候选元素（API.md §4.2 sources[]/targets[]）。org 可为空。
 */
public class DataSourceCandidateVO {

    private String id;
    private String org;
    private boolean active;

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

    public boolean isActive() {
        return active;
    }

    public void setActive(boolean active) {
        this.active = active;
    }
}
