package com.bsoft.cdcconfig.clientconfig.model.vo;

import java.util.ArrayList;
import java.util.List;

/**
 * E1 行内单个数据源视图项（CCFG-API-005）。org/dataSourceName 允许 null（找不到/缺名时仍须能回显原始 ID）。
 * anomalies 稳定枚举：INACTIVE/NOT_FOUND/CATEGORY_MISMATCH/TYPE_MISMATCH/DUPLICATE_IN_ROW/ASSIGNED_TO_MULTIPLE_CLIENTS。
 */
public class DataSourceViewItemVO {

    private String dataSourceId;

    private String org;

    private String dataSourceName;

    private List<String> anomalies = new ArrayList<>();

    private List<String> conflictClientIds = new ArrayList<>();

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

    public List<String> getAnomalies() {
        return anomalies;
    }

    public void setAnomalies(List<String> anomalies) {
        this.anomalies = anomalies;
    }

    public List<String> getConflictClientIds() {
        return conflictClientIds;
    }

    public void setConflictClientIds(List<String> conflictClientIds) {
        this.conflictClientIds = conflictClientIds;
    }
}
