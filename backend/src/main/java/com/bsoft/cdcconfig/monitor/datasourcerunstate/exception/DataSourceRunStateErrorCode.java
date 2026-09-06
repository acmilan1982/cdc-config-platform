package com.bsoft.cdcconfig.monitor.datasourcerunstate.exception;

/**
 * 源库快照状态参数校验错误码（取自当前未被其它监控模块占用的 41xxx 段，API.md §8）。
 */
public enum DataSourceRunStateErrorCode {

    TOO_MANY_FILTER_IDS(41001, "查询参数数量超过限制"),
    INVALID_STATUS_TOKEN(41002, "快照状态取值非法");

    private final int code;
    private final String message;

    DataSourceRunStateErrorCode(int code, String message) {
        this.code = code;
        this.message = message;
    }

    public int getCode() {
        return code;
    }

    public String getMessage() {
        return message;
    }
}
