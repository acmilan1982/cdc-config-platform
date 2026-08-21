package com.bsoft.cdcconfig.logquery.config;

import org.springframework.boot.context.properties.ConfigurationProperties;
import org.springframework.stereotype.Component;

/**
 * 日志查询配置绑定（LQ-API-52 / DESIGN §7.1）。
 * cursorSecret 来自后端持久化外部配置，默认空串，不硬编码任何密钥。
 */
@Component
@ConfigurationProperties(prefix = "cdc.log-query")
public class LogQueryProperties {

    private String cursorSecret = "";

    public String getCursorSecret() {
        return cursorSecret;
    }

    public void setCursorSecret(String cursorSecret) {
        this.cursorSecret = cursorSecret;
    }
}
