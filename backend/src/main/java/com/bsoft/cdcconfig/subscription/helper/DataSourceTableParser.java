package com.bsoft.cdcconfig.subscription.helper;

import java.util.ArrayList;
import java.util.List;

/**
 * {@code DATA_SOURCE_TABLE} 单表格式解析（DESIGN §4.2 / DATABASE §4.5 权威定义）。
 *
 * <p>单张表格式为 {@code DATA_SOURCE_ID.Schema.表名}，两个英文句点是三段结构的保留
 * 分隔符；从第一个 '.' 与最后一个 '.' 分割。组件内部额外句点或任一组件为空 → 该 token
 * 无法可靠解析，归入 {@code rawUnparseable}，绝不静默丢弃。</p>
 *
 * <p>{@code tableCount} = 按英文逗号拆分、trim、丢弃空 token 后统计的所有非空 token
 * 数（含当前无法解析的历史 token），与列表“共 N 张”口径一致（DESIGN §4.5）。</p>
 */
public final class DataSourceTableParser {

    private DataSourceTableParser() {
    }

    /**
     * 解析整段 CSV。逗号拆分、trim、丢弃空 token 统一复用 {@link SubscriptionCsvHelper}。
     */
    public static ParseResult parse(String csv) {
        List<String> tokens = SubscriptionCsvHelper.splitTrimDropEmpty(csv);
        List<TableEntry> entries = new ArrayList<>();
        List<String> rawUnparseable = new ArrayList<>();
        for (String token : tokens) {
            TableEntry entry = parseToken(token);
            if (entry == null) {
                rawUnparseable.add(token);
            } else {
                entries.add(entry);
            }
        }
        return new ParseResult(entries, rawUnparseable, tokens.size());
    }

    /**
     * 解析单个表标识。两个结构句点且各组件非空 → TableEntry；否则（无句点、单句点、
     * Schema 内额外句点、任一组件为空）→ null（不可解析）。
     */
    public static TableEntry parseToken(String token) {
        if (token == null) {
            return null;
        }
        int firstDot = token.indexOf('.');
        int lastDot = token.lastIndexOf('.');
        if (firstDot < 0 || firstDot == lastDot) {
            return null;
        }
        String dataSourceId = token.substring(0, firstDot);
        String schema = token.substring(firstDot + 1, lastDot);
        String tableName = token.substring(lastDot + 1);
        if (schema.indexOf('.') >= 0) {
            return null;
        }
        if (dataSourceId.isEmpty() || schema.isEmpty() || tableName.isEmpty()) {
            return null;
        }
        return new TableEntry(dataSourceId, schema, tableName);
    }

    /** 解析结果：可解析条目（保持原始 token 顺序）、不可解析原始 token、非空 token 总数。 */
    public static final class ParseResult {

        private final List<TableEntry> entries;
        private final List<String> rawUnparseable;
        private final int tableCount;

        private ParseResult(List<TableEntry> entries, List<String> rawUnparseable, int tableCount) {
            this.entries = entries;
            this.rawUnparseable = rawUnparseable;
            this.tableCount = tableCount;
        }

        public List<TableEntry> getEntries() { return entries; }
        public List<String> getRawUnparseable() { return rawUnparseable; }
        public int getTableCount() { return tableCount; }
    }

    /** 三段结构条目：DATA_SOURCE_ID / Schema / 表名（保持原始大小写）。 */
    public static final class TableEntry {

        private final String dataSourceId;
        private final String schema;
        private final String tableName;

        private TableEntry(String dataSourceId, String schema, String tableName) {
            this.dataSourceId = dataSourceId;
            this.schema = schema;
            this.tableName = tableName;
        }

        public String getDataSourceId() { return dataSourceId; }
        public String getSchema() { return schema; }
        public String getTableName() { return tableName; }
    }
}
