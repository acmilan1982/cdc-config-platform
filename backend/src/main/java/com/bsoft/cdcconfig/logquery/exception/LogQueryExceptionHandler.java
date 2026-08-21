package com.bsoft.cdcconfig.logquery.exception;

import com.bsoft.cdcconfig.common.api.ApiResponse;
import org.springframework.core.Ordered;
import org.springframework.core.annotation.Order;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestControllerAdvice;

/**
 * 日志查询专用异常映射：路径 cdcLogId 等参数格式错误返回 HTTP 400。
 * @Order(HIGHEST_PRECEDENCE) 使本处理器在 GlobalExceptionHandler 之前被咨询，
 * 否则其兜底 Exception 处理会遮蔽本处理器更具体的匹配（EHR 取第一个可匹配的 advice）。
 */
@Order(Ordered.HIGHEST_PRECEDENCE)
@RestControllerAdvice
public class LogQueryExceptionHandler {

    @ExceptionHandler(LogQueryBadRequestException.class)
    @ResponseStatus(HttpStatus.BAD_REQUEST)
    public ApiResponse<Void> handleBadRequest(LogQueryBadRequestException e) {
        return ApiResponse.fail(400, e.getMessage());
    }
}
