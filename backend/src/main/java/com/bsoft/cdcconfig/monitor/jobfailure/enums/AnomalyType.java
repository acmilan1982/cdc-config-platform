package com.bsoft.cdcconfig.monitor.jobfailure.enums;

public enum AnomalyType {
    FORK("分叉", "一个NEW_JOB_ID匹配到多个后续失败事件"),
    MULTI_PARENT("多父节点", "一个FAILED_JOB_ID被多个NEW_JOB_ID指向"),
    BROKEN_CHAIN("断链", "非首节点的FAILED_JOB_ID在前序事件中无匹配的NEW_JOB_ID"),
    LOOP("环", "物理Job ID链形成闭环"),
    DUPLICATE_EDGE("重复边", "同一个(FAILED_JOB_ID, NEW_JOB_ID)出现多次"),
    ORPHAN_LOG("孤立处理日志", "日志的FAILURE_EVENT_ID在事件表中不存在");

    private final String label;
    private final String description;

    AnomalyType(String label, String description) {
        this.label = label;
        this.description = description;
    }

    public String getLabel() { return label; }
    public String getDescription() { return description; }
}
