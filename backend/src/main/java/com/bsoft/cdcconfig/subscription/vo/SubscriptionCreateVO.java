package com.bsoft.cdcconfig.subscription.vo;

/**
 * 新增订阅成功响应（API.md §4.6）：data 为对象，仅含后端生成的订阅 ID。
 * 前端必须按 {@code data.dataSubId} 读取，不再是裸字符串。
 */
public class SubscriptionCreateVO {

    private String dataSubId;

    public SubscriptionCreateVO() {
    }

    public SubscriptionCreateVO(String dataSubId) {
        this.dataSubId = dataSubId;
    }

    public String getDataSubId() { return dataSubId; }
    public void setDataSubId(String dataSubId) { this.dataSubId = dataSubId; }
}
