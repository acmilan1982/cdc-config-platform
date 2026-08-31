package com.bsoft.cdcconfig.subscription.vo;

import java.util.List;

/**
 * 源库 Schema 列表（API.md §4.4）。filterMode 为 ORACLE_MAINTAINED /
 * FALLBACK_EXCLUSION_LIST，仅用于可核验性，不展示给普通用户。
 */
public class SchemaVO {

    private String dataSourceId;
    private String filterMode;
    private List<String> schemas;

    public String getDataSourceId() { return dataSourceId; }
    public void setDataSourceId(String dataSourceId) { this.dataSourceId = dataSourceId; }

    public String getFilterMode() { return filterMode; }
    public void setFilterMode(String filterMode) { this.filterMode = filterMode; }

    public List<String> getSchemas() { return schemas; }
    public void setSchemas(List<String> schemas) { this.schemas = schemas; }
}
