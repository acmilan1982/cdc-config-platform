package com.bsoft.cdcconfig.serverconfig.enums;

import java.util.Arrays;

/**
 * 已支持可编辑 Key 白名单（SC-EDIT-01、SC-EDIT-03）。
 * 新增可编辑 Key 必须前后端同步扩展（ServerConfigEditableKey / configRules.ts）。
 */
public enum ServerConfigEditableKey {

    AUTO_CREATE_TABLE("auto-create-table"),
    AUTO_EXPAND_COLUMN_LENGTH("auto-expand-column-length"),
    RAW_MESSAGE_STORAGE_STRATEGY("raw-message-storage-strategy"),
    REALTIME_INSERT_BATCH_ENABLED_DATABASE_TYPES("realtime-insert-batch-enabled-database-types"),
    SNAPSHOT_BATCH_SIZE("snapshotBatchSize"),
    TABLE_ROW_DELETE_STRATEGY("tableRowDeleteStrategy");

    private final String key;

    ServerConfigEditableKey(String key) {
        this.key = key;
    }

    public String getKey() {
        return key;
    }

    /** 精确匹配 CONFIG_KEY 字符串；不在白名单或为 null 时返回 null。 */
    public static ServerConfigEditableKey fromValue(String configKey) {
        if (configKey == null) {
            return null;
        }
        return Arrays.stream(values())
                .filter(e -> e.key.equals(configKey))
                .findFirst()
                .orElse(null);
    }
}
