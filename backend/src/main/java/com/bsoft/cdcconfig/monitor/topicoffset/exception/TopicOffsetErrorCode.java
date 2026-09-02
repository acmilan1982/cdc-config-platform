package com.bsoft.cdcconfig.monitor.topicoffset.exception;

/**
 * topic-offset 参数校验错误码（范围沿用监控模块 40xxx 风格，API.md §7）。
 */
public enum TopicOffsetErrorCode {

    INVALID_PAGE_NUM(40001, "页码必须为不小于 1 的整数"),
    TABLE_NAME_TOO_LONG(40002, "表名长度不能超过 200 个字符"),
    TOO_MANY_FILTER_IDS(40003, "单个筛选维度最多选择 50 个");

    private final int code;
    private final String message;

    TopicOffsetErrorCode(int code, String message) {
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
