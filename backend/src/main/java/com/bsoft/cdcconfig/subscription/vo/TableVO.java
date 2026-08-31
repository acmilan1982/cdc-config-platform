package com.bsoft.cdcconfig.subscription.vo;

import java.util.List;

/**
 * 按 Schema 查询的普通表清单（API.md §4.5）。表名保持源 Oracle 原始大小写。
 */
public class TableVO {

    private String dataSourceId;
    private String schema;
    private List<String> tables;

    public String getDataSourceId() { return dataSourceId; }
    public void setDataSourceId(String dataSourceId) { this.dataSourceId = dataSourceId; }

    public String getSchema() { return schema; }
    public void setSchema(String schema) { this.schema = schema; }

    public List<String> getTables() { return tables; }
    public void setTables(List<String> tables) { this.tables = tables; }
}
