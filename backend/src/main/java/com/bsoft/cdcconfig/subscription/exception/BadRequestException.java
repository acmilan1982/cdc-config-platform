package com.bsoft.cdcconfig.subscription.exception;

/**
 * 订阅模块参数/请求契约错误（HTTP 400 + code=400）。区别于 {@link BusinessException}
 * 的“HTTP 200 + 业务码”语义：本异常用于查询候选空白、sourceSelectionMode 缺失或非法、
 * 请求体为 null 等请求级契约违反，由 SubscriptionController 本地
 * {@code @ExceptionHandler} 转为 HTTP 400。
 */
public class BadRequestException extends RuntimeException {

    public BadRequestException(String message) {
        super(message);
    }
}
