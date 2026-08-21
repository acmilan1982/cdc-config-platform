package com.bsoft.cdcconfig.logquery.exception;

import com.bsoft.cdcconfig.common.exception.BusinessException;

/**
 * 日志查询错误码常量与 BusinessException 静态工厂（LQ-API-80 ~ 90、LQ-DESIGN-160）。
 * 风格同 JobFailureErrorCode / DataSourceErrorCode。
 */
public final class LogQueryErrorCode {

    private LogQueryErrorCode() {
    }

    public static final int TIME_RANGE_REQUIRED = 40010;
    public static final int TIME_ORDER_INVALID = 40011;
    public static final int TIME_SPAN_EXCEEDED = 40012;
    public static final int DATA_SOURCE_IDS_INVALID = 40013;
    public static final int LOG_TYPE_INVALID = 40014;
    public static final int CURSOR_INVALID = 40015;
    public static final int CURSOR_CONDITION_MISMATCH = 40016;
    public static final int TABLE_NAME_INVALID = 40017;
    public static final int LOG_RECORD_NOT_FOUND = 40410;
    public static final int QUERY_TIMEOUT = 50020;
    public static final int DATABASE_ACCESS_FAILED = 50021;

    public static BusinessException timeRangeRequired() {
        return new BusinessException(TIME_RANGE_REQUIRED,
                "同步到目标库时间范围必须填写开始与结束时间");
    }

    public static BusinessException timeOrderInvalid() {
        return new BusinessException(TIME_ORDER_INVALID,
                "开始时间不能晚于结束时间");
    }

    public static BusinessException timeSpanExceeded() {
        return new BusinessException(TIME_SPAN_EXCEEDED,
                "时间跨度超过 7 天，请缩小查询范围");
    }

    public static BusinessException dataSourceIdsInvalid() {
        return new BusinessException(DATA_SOURCE_IDS_INVALID,
                "数据源ID数组数量超限、元素非法或不在有效候选集合");
    }

    public static BusinessException logTypeInvalid(String logType) {
        return new BusinessException(LOG_TYPE_INVALID,
                "不支持的日志类型: " + logType);
    }

    public static BusinessException cursorInvalid() {
        return new BusinessException(CURSOR_INVALID,
                "游标无效或已过期，请重新查询第一页");
    }

    public static BusinessException cursorConditionMismatch() {
        return new BusinessException(CURSOR_CONDITION_MISMATCH,
                "游标与当前查询条件不一致");
    }

    public static BusinessException tableNameInvalid() {
        return new BusinessException(TABLE_NAME_INVALID,
                "表名长度超过 64 字符");
    }

    public static BusinessException logRecordNotFound() {
        return new BusinessException(LOG_RECORD_NOT_FOUND,
                "日志记录不存在");
    }

    public static BusinessException queryTimeout() {
        return new BusinessException(QUERY_TIMEOUT,
                "数据库查询超时，请缩小查询范围或增加条件");
    }

    public static BusinessException databaseAccessFailed() {
        return new BusinessException(DATABASE_ACCESS_FAILED,
                "数据库访问失败");
    }
}
