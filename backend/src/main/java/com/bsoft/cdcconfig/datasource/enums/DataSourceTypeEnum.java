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

    /** 请求枚举只接受批准的大写值；小写输入必须拒绝。 */
    public static boolean isValid(String value) {
        if (value == null) return false;
        for (DataSourceTypeEnum t : values()) {
            if (t.code.equals(value)) return true;
        }
        return false;
    }
}
