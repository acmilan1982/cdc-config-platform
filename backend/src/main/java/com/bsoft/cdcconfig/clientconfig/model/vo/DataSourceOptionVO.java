package com.bsoft.cdcconfig.clientconfig.model.vo;

import java.util.ArrayList;
import java.util.List;

/**
 * E2 数据源候选项（CCFG-API-006）。notSelectableReason 取值 COMMA_IN_ID / OCCUPIED / null。
 * occupiedByClientIds 为占用该候选的全部探针 ID（已按 excludeClientId 自排除）。
 */
public class DataSourceOptionVO {

    private String dataSourceId;

    private String org;

    private String dataSourceName;

    private boolean selectable;

    private String notSelectableReason;

    private List<String> occupiedByClientIds = new ArrayList<>();

    public String getDataSourceId() {
        return dataSourceId;
    }

    public void setDataSourceId(String dataSourceId) {
        this.dataSourceId = dataSourceId;
    }

    public String getOrg() {
        return org;
    }

    public void setOrg(String org) {
        this.org = org;
    }

    public String getDataSourceName() {
        return dataSourceName;
    }

    public void setDataSourceName(String dataSourceName) {
        this.dataSourceName = dataSourceName;
    }

    public boolean isSelectable() {
        return selectable;
    }

    public void setSelectable(boolean selectable) {
        this.selectable = selectable;
    }

    public String getNotSelectableReason() {
        return notSelectableReason;
    }

    public void setNotSelectableReason(String notSelectableReason) {
        this.notSelectableReason = notSelectableReason;
    }

    public List<String> getOccupiedByClientIds() {
        return occupiedByClientIds;
    }

    public void setOccupiedByClientIds(List<String> occupiedByClientIds) {
        this.occupiedByClientIds = occupiedByClientIds;
    }
}
