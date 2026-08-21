package com.bsoft.cdcconfig.logquery.vo;

/**
 * 日志查询功能开关状态（LQ-API-171 / DESIGN §7.1）。
 * enabled 仅来自后端配置 ${CDC_LOG_QUERY_ENABLED}，不读取数据库，默认 false。
 */
public class LogQueryStatusVO {

    private boolean enabled;

    public LogQueryStatusVO() {
    }

    public LogQueryStatusVO(boolean enabled) {
        this.enabled = enabled;
    }

    public boolean isEnabled() {
        return enabled;
    }

    public void setEnabled(boolean enabled) {
        this.enabled = enabled;
    }
}
