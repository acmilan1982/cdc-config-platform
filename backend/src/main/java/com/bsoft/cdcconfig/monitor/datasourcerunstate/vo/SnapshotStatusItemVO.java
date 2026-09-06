package com.bsoft.cdcconfig.monitor.datasourcerunstate.vo;

import com.fasterxml.jackson.annotation.JsonInclude;

/**
 * 列表项 VO（API.md §6 records[]）。字段顺序即 JSON 顺序。
 * 全局 Jackson 为 non_null，仅对需显式 null 的时间字段用字段级 @JsonInclude(ALWAYS)，
 * 不改全局序列化配置。clientId/sourceId 恒为 RUN_STATE 原始值；sourceId 由内部 dataSourceId 显式映射。
 */
public class SnapshotStatusItemVO {

    private String clientId;
    private ClientRefVO clientRef;
    private String sourceId;
    private SourceRefVO sourceRef;
    private String snapshotStatus;
    private String statusCategory;

    @JsonInclude(JsonInclude.Include.ALWAYS)
    private String snapshotLastSeenAt;

    @JsonInclude(JsonInclude.Include.ALWAYS)
    private String snapshotCompletedAt;

    private String updatedAt;

    public String getClientId() {
        return clientId;
    }

    public void setClientId(String clientId) {
        this.clientId = clientId;
    }

    public ClientRefVO getClientRef() {
        return clientRef;
    }

    public void setClientRef(ClientRefVO clientRef) {
        this.clientRef = clientRef;
    }

    public String getSourceId() {
        return sourceId;
    }

    public void setSourceId(String sourceId) {
        this.sourceId = sourceId;
    }

    public SourceRefVO getSourceRef() {
        return sourceRef;
    }

    public void setSourceRef(SourceRefVO sourceRef) {
        this.sourceRef = sourceRef;
    }

    public String getSnapshotStatus() {
        return snapshotStatus;
    }

    public void setSnapshotStatus(String snapshotStatus) {
        this.snapshotStatus = snapshotStatus;
    }

    public String getStatusCategory() {
        return statusCategory;
    }

    public void setStatusCategory(String statusCategory) {
        this.statusCategory = statusCategory;
    }

    public String getSnapshotLastSeenAt() {
        return snapshotLastSeenAt;
    }

    public void setSnapshotLastSeenAt(String snapshotLastSeenAt) {
        this.snapshotLastSeenAt = snapshotLastSeenAt;
    }

    public String getSnapshotCompletedAt() {
        return snapshotCompletedAt;
    }

    public void setSnapshotCompletedAt(String snapshotCompletedAt) {
        this.snapshotCompletedAt = snapshotCompletedAt;
    }

    public String getUpdatedAt() {
        return updatedAt;
    }

    public void setUpdatedAt(String updatedAt) {
        this.updatedAt = updatedAt;
    }
}
