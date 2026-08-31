package com.bsoft.cdcconfig.subscription.vo;

import java.util.List;

/**
 * 列表唯一响应类型（API.md §4.2）：items + queryWarnings，data 不得被当作数组。
 */
public class SubscriptionListVO {

    private List<SubscriptionRowVO> items;
    private List<QueryWarningVO> queryWarnings;

    public SubscriptionListVO() {
    }

    public SubscriptionListVO(List<SubscriptionRowVO> items, List<QueryWarningVO> queryWarnings) {
        this.items = items;
        this.queryWarnings = queryWarnings;
    }

    public List<SubscriptionRowVO> getItems() { return items; }
    public void setItems(List<SubscriptionRowVO> items) { this.items = items; }

    public List<QueryWarningVO> getQueryWarnings() { return queryWarnings; }
    public void setQueryWarnings(List<QueryWarningVO> queryWarnings) { this.queryWarnings = queryWarnings; }
}
