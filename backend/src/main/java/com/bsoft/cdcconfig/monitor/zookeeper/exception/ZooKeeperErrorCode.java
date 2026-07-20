package com.bsoft.cdcconfig.monitor.zookeeper.exception;

public enum ZooKeeperErrorCode {

    ZK_CONNECTION_FAILED(5001, "ZooKeeper 连接失败"),
    ZK_CLIENTS_PATH_NOT_FOUND(5002, "客户端路径不存在"),
    ZK_INTERNAL_ERROR(5003, "ZooKeeper 内部读取错误");

    private final int code;
    private final String message;

    ZooKeeperErrorCode(int code, String message) {
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
