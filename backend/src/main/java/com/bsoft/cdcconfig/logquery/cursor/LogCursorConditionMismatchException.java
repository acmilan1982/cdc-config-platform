package com.bsoft.cdcconfig.logquery.cursor;

/**
 * 游标 logType 或条件指纹与当前请求不一致（LQ-API-86 映射为 CURSOR_CONDITION_MISMATCH）。
 */
public class LogCursorConditionMismatchException extends RuntimeException {

    public LogCursorConditionMismatchException(String message) {
        super(message);
    }
}
