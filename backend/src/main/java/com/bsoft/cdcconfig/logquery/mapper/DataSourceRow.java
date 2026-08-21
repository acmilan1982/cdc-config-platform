package com.bsoft.cdcconfig.logquery.mapper;

/**
 * CDC_DATA_SOURCE 四列全表读取的结果行（LQ-API-25 / DESIGN §6.4）。
 */
public class DataSourceRow {

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
