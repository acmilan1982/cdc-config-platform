package com.bsoft.cdcconfig.logquery.cursor;

/**
 * 游标格式非法 / 验签失败 / 版本不支持（LQ-API-85 映射为 CURSOR_INVALID）。
 */
public class LogCursorInvalidException extends RuntimeException {

    public LogCursorInvalidException(String message) {
        super(message);
    }

    public LogCursorInvalidException(String message, Throwable cause) {
        super(message, cause);
    }
}
