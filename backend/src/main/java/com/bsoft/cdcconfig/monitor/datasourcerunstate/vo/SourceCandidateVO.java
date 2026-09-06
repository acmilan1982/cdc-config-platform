package com.bsoft.cdcconfig.monitor.datasourcerunstate.vo;

/**
 * 源库候选元素（API.md §5.2 sources[]）。org=配置 DATA_SOURCE_ORG 或 null（配置缺失）。
 */
public class SourceCandidateVO {

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
