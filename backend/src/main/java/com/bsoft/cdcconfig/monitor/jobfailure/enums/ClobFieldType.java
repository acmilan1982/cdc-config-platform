package com.bsoft.cdcconfig.monitor.jobfailure.enums;

/**
 * Fixed whitelist for CLOB lazy-load fields.
 * The string value is used in the API path; enum name is internal.
 */
public enum ClobFieldType {
    FAILURE_EVENT_FAILURE_DETAIL("FAILURE_EVENT_FAILURE_DETAIL", "CDC_JOB_FAILURE_EVENT", "FAILURE_DETAIL"),
    FAILURE_HANDLE_LOG_ERROR_DETAIL("FAILURE_HANDLE_LOG_ERROR_DETAIL", "CDC_JOB_FAILURE_HANDLE_LOG", "ERROR_DETAIL");

    private final String apiValue;
    private final String tableName;
    private final String columnName;

    ClobFieldType(String apiValue, String tableName, String columnName) {
        this.apiValue = apiValue;
        this.tableName = tableName;
        this.columnName = columnName;
    }

    public String getApiValue() { return apiValue; }
    public String getTableName() { return tableName; }
    public String getColumnName() { return columnName; }

    public static ClobFieldType fromApiValue(String apiValue) {
        for (ClobFieldType t : values()) {
            if (t.apiValue.equals(apiValue)) return t;
        }
        return null;
    }
}
