package com.bsoft.cdcconfig.serverconfig.exception;

/**
 * 中心端配置请求体结构错误（非对象顶层、非数组 items、非对象 item）。
 * 由 Feature 局部异常处理器映射为 HTTP 400 + ApiResponse.fail(400, "请求格式错误")
 * （API.md SC-API-050/056/057）。
 */
public class ServerConfigBadRequestException extends RuntimeException {

    public ServerConfigBadRequestException() {
        super("请求格式错误");
    }
}
