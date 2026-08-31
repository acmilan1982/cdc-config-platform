package com.bsoft.cdcconfig.subscription.vo;

import java.util.List;

/**
 * 按 Schema 分组的可解析表清单（API.md §4.2）。schema 保持源 Oracle 原始大小写。
 */
public class SchemaTableGroup {

    private String schema;
    private List<String> tables;

    public String getSchema() { return schema; }
    public void setSchema(String schema) { this.schema = schema; }

    public List<String> getTables() { return tables; }
    public void setTables(List<String> tables) { this.tables = tables; }
}
