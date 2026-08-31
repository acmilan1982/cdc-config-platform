package com.bsoft.cdcconfig.subscription.dto;

import java.util.List;

/**
 * 列表查询参数（API.md §4.2）。由 Controller 从 HttpServletRequest 手工构建，保留每个
 * 候选值为原子字符串（含逗号候选不被 Spring 集合转换器切分）。源库组内 OR、目标库组内
 * OR、两组之间 AND，过滤在服务层 Java 完成。
 */
public class SubscriptionQuery {

    private List<String> sourceIds;
    private List<String> targetIds;

    public List<String> getSourceIds() { return sourceIds; }
    public void setSourceIds(List<String> sourceIds) { this.sourceIds = sourceIds; }

    public List<String> getTargetIds() { return targetIds; }
    public void setTargetIds(List<String> targetIds) { this.targetIds = targetIds; }
}
