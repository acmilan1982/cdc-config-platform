package com.bsoft.cdcconfig.datasource.enums;

public enum DataSourceCategoryEnum {
    SOURCE("SOURCE", "源端"),
    TARGET("TARGET", "目标端");

    private final String code;
    private final String label;

    DataSourceCategoryEnum(String code, String label) {
        this.code = code;
        this.label = label;
    }

    public String getCode() { return code; }
    public String getLabel() { return label; }

    public static boolean isValid(String value) {
        if (value == null) return false;
        String upper = value.toUpperCase();
        return "SOURCE".equals(upper) || "TARGET".equals(upper);
    }

    public static String normalize(String value) {
        if (value == null) return null;
        return value.toUpperCase();
    }
}
