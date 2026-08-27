package com.bsoft.cdcconfig.serverconfig.exception;

import com.bsoft.cdcconfig.common.api.ApiResponse;
import org.springframework.core.Ordered;
import org.springframework.core.annotation.Order;
import org.springframework.http.HttpStatus;
import org.springframework.http.converter.HttpMessageNotReadableException;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestControllerAdvice;
import com.bsoft.cdcconfig.serverconfig.controller.ServerConfigController;

/**
 * 中心端配置专用异常映射（API.md SC-API-050/056/057）。
 * 只作用于 ServerConfigController，不影响其他接口；结构错误唯一映射 HTTP 400 + code=400，
 * 不得被全局兜底异常处理映射成 HTTP 500。
 */
@Order(Ordered.HIGHEST_PRECEDENCE)
@RestControllerAdvice(assignableTypes = ServerConfigController.class)
public class ServerConfigExceptionHandler {

    @ExceptionHandler(ServerConfigBadRequestException.class)
    @ResponseStatus(HttpStatus.BAD_REQUEST)
    public ApiResponse<Void> handleBadRequest(ServerConfigBadRequestException e) {
        return ApiResponse.fail(400, e.getMessage());
    }

    @ExceptionHandler(HttpMessageNotReadableException.class)
    @ResponseStatus(HttpStatus.BAD_REQUEST)
    public ApiResponse<Void> handleNotReadable(HttpMessageNotReadableException e) {
        return ApiResponse.fail(400, "请求格式错误");
    }
}
