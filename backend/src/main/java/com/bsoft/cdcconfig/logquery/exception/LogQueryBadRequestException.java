package com.bsoft.cdcconfig.logquery.exception;

/**
 * 日志查询参数格式错误（如路径 cdcLogId 非法/越界），
 * 由 LogQueryExceptionHandler 映射为 HTTP 400（LQ-API-04 / 99、LQ-DESIGN-19）。
 * 与业务错误（HTTP 200 + 业务码）明确区分。
 */
public class LogQueryBadRequestException extends RuntimeException {

    public LogQueryBadRequestException(String message) {
        super(message);
    }
}
