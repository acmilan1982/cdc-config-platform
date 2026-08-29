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

    /** 请求枚举只接受批准的大写值；小写输入必须拒绝（读取存量时仍经 normalize 忽略大小写）。 */
    public static boolean isValid(String value) {
        return "SOURCE".equals(value) || "TARGET".equals(value);
    }

    public static String normalize(String value) {
        if (value == null) return null;
        return value.toUpperCase();
    }
}
