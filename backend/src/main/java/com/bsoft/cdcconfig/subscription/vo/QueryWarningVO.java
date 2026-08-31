package com.bsoft.cdcconfig.subscription.vo;

/**
 * 列表查询歧义条件（API.md §4.2）。type 当前唯一值 AMBIGUOUS_COMMA_ID（含逗号数据源
 * ID 历史兼容可能匹配）；field 为 sourceIds / targetIds；value 为含逗号原始候选。
 */
public class QueryWarningVO {

    private String type;
    private String field;
    private String value;
    private String message;

    public String getType() { return type; }
    public void setType(String type) { this.type = type; }

    public String getField() { return field; }
    public void setField(String field) { this.field = field; }

    public String getValue() { return value; }
    public void setValue(String value) { this.value = value; }

    public String getMessage() { return message; }
    public void setMessage(String message) { this.message = message; }
}
