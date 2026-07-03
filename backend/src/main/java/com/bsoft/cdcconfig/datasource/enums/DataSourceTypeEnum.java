package com.bsoft.cdcconfig.datasource.enums;

public enum DataSourceTypeEnum {
    ORACLE("ORACLE"),
    MYSQL("MYSQL"),
    DORIS("DORIS");

    private final String code;

    DataSourceTypeEnum(String code) {
        this.code = code;
    }

    public String getCode() { return code; }

    public static boolean isValid(String value) {
        if (value == null) return false;
        String upper = value.toUpperCase();
        for (DataSourceTypeEnum t : values()) {
            if (t.code.equals(upper)) return true;
        }
        return false;
    }
}
