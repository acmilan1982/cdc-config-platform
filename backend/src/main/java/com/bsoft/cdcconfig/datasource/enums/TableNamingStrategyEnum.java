package com.bsoft.cdcconfig.datasource.enums;

public enum TableNamingStrategyEnum {
    TABLE_MERGE("TABLE_MERGE"),
    CUSTOM_PREFIX_SUFFIX("CUSTOM_PREFIX_SUFFIX");

    private final String code;

    TableNamingStrategyEnum(String code) {
        this.code = code;
    }

    public String getCode() { return code; }

    public static boolean isValid(String value) {
        if (value == null) return false;
        return "TABLE_MERGE".equals(value) || "CUSTOM_PREFIX_SUFFIX".equals(value);
    }
}
