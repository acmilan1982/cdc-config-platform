package com.bsoft.cdcconfig.subscription.vo;

/**
 * 批量校验失效项（API.md §4.6）。{@code field} 取值 dataSubDesc / dataFromSourceId /
 * dataToSourceIds / sourceTables；{@code name} 为具体失效名称（如源表标识或目标库 ID）。
 */
public class ValidationErrorVO {

    private String errorCode;
    private String field;
    private String name;
    private String message;

    public String getErrorCode() { return errorCode; }
    public void setErrorCode(String errorCode) { this.errorCode = errorCode; }

    public String getField() { return field; }
    public void setField(String field) { this.field = field; }

    public String getName() { return name; }
    public void setName(String name) { this.name = name; }

    public String getMessage() { return message; }
    public void setMessage(String message) { this.message = message; }
}
