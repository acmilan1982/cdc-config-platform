package com.bsoft.cdcconfig.subscription.dto;

/**
 * 结构化源表输入项（API.md §4.6 / DESIGN §4.2）。保存请求中 {@code sourceTables} 唯一
 * 类型为 {@code SourceTableInput[]}（仅 schemaName + tableName），完整
 * {@code DATA_SOURCE_ID.Schema.表名} 由后端以 dataFromSourceId 拼装。
 */
public class SourceTableInput {

    private String schemaName;
    private String tableName;

    public SourceTableInput() {
    }

    public SourceTableInput(String schemaName, String tableName) {
        this.schemaName = schemaName;
        this.tableName = tableName;
    }

    public String getSchemaName() { return schemaName; }
    public void setSchemaName(String schemaName) { this.schemaName = schemaName; }

    public String getTableName() { return tableName; }
    public void setTableName(String tableName) { this.tableName = tableName; }
}
