package com.bsoft.cdcconfig.datasource.vo;

/**
 * 启用/停用成功结果（API.md §11.1）：成功响应 {@code data.success=true}。
 * 最小且强类型，不含任何敏感信息。
 */
public class DataSourceStatusResultVO {

    private boolean success;

    public DataSourceStatusResultVO() {
    }

    public DataSourceStatusResultVO(boolean success) {
        this.success = success;
    }

    public static DataSourceStatusResultVO success() {
        return new DataSourceStatusResultVO(true);
    }

    public boolean isSuccess() {
        return success;
    }

    public void setSuccess(boolean success) {
        this.success = success;
    }
}
