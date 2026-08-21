package com.bsoft.cdcconfig.logquery.config;

import com.bsoft.cdcconfig.logquery.cursor.LogCursorCodec;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.context.annotation.Lazy;

/**
 * 日志查询游标编解码器 Bean。
 * @Lazy 保证密钥缺失时不破坏应用启动；实际使用游标时若密钥未配置，
 * LogCursorCodec 构造抛 IllegalStateException（失败关闭，不使用不安全兜底密钥）。
 */
@Configuration
public class LogQueryConfig {

    private final LogQueryProperties properties;

    public LogQueryConfig(LogQueryProperties properties) {
        this.properties = properties;
    }

    @Bean
    @Lazy
    public LogCursorCodec logCursorCodec() {
        return new LogCursorCodec(properties.getCursorSecret());
    }
}
