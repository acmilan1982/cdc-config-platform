package com.bsoft.cdcconfig.largescreen.stats.lifecycle;

/**
 * 配置加载失败异常。
 * 由 StatsTaskConfigLoader 在首次加载失败时包装并缓存，
 * 后续调用直接抛出缓存实例。
 */
public class StatsConfigLoadException extends RuntimeException {

    public StatsConfigLoadException(String message) {
        super(message);
    }

    public StatsConfigLoadException(String message, Throwable cause) {
        super(message, cause);
    }
}
