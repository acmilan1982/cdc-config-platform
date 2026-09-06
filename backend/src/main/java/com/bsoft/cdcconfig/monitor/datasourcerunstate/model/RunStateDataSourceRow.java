package com.bsoft.cdcconfig.monitor.datasourcerunstate.model;

/**
 * CDC_DATA_SOURCE 显式列投影行（DATA_SOURCE_ID/ORG/CATEGORY/FG_ACTIVE）。
 * 列清单不含 DATA_SOURCE_PASSWORD（安全约束，DATABASE §3.3）。
 */
public class RunStateDataSourceRow {

    private String dataSourceId;
    private String dataSourceOrg;
    private String dataSourceCategory;
    private String fgActive;

    public String getDataSourceId() {
        return dataSourceId;
    }

    public void setDataSourceId(String dataSourceId) {
        this.dataSourceId = dataSourceId;
    }

    public String getDataSourceOrg() {
        return dataSourceOrg;
    }

    public void setDataSourceOrg(String dataSourceOrg) {
        this.dataSourceOrg = dataSourceOrg;
    }

    public String getDataSourceCategory() {
        return dataSourceCategory;
    }

    public void setDataSourceCategory(String dataSourceCategory) {
        this.dataSourceCategory = dataSourceCategory;
    }

    public String getFgActive() {
        return fgActive;
    }

    public void setFgActive(String fgActive) {
        this.fgActive = fgActive;
    }
}
