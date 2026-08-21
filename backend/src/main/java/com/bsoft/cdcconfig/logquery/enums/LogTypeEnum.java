package com.bsoft.cdcconfig.logquery.enums;

/**
 * 日志类型白名单到固定日志表的封闭映射（LQ-API-08、LQ-DESIGN-04/05）。
 * 大小写敏感，其余任何值由服务端拒绝。
 */
public enum LogTypeEnum {

    ERROR("error", "CDC_LOG_ERROR"),
    CORRECT("correct", "CDC_LOG_CORRECT");

    private final String value;
    private final String tableName;

    LogTypeEnum(String value, String tableName) {
        this.value = value;
        this.tableName = tableName;
    }

    public String getValue() {
        return value;
    }

    public String getTableName() {
        return tableName;
    }

    /**
     * 大小写敏感的精确查找；未命中返回 null。
     */
    public static LogTypeEnum fromValue(String value) {
        if (value == null) {
            return null;
        }
        for (LogTypeEnum e : values()) {
            if (e.value.equals(value)) {
                return e;
            }
        }
        return null;
    }
}
