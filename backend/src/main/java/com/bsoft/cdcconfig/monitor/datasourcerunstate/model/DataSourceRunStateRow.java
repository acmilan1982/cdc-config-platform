package com.bsoft.cdcconfig.monitor.datasourcerunstate.model;

/**
 * CDC_DATA_SOURCE_RUN_STATE 只读行（DATABASE §3.1）。三个 DATE 已在 SQL 层 TO_CHAR 字符串化，
 * Java/JSON 全程字符串透传（DESIGN §5.7）。
 * 内部 Row 名为 dataSourceId，映射到对外契约 JSON 字段 sourceId 时在 VO 层显式衔接（API §6）。
 */
public class DataSourceRunStateRow {

    private String clientId;
    private String dataSourceId;
    private String snapshotStatus;
    private String snapshotLastSeenAt;
    private String snapshotCompletedAt;
    private String updatedAt;

    public String getClientId() {
        return clientId;
    }

    public void setClientId(String clientId) {
        this.clientId = clientId;
    }

    public String getDataSourceId() {
        return dataSourceId;
    }

    public void setDataSourceId(String dataSourceId) {
        this.dataSourceId = dataSourceId;
    }

    public String getSnapshotStatus() {
        return snapshotStatus;
    }

    public void setSnapshotStatus(String snapshotStatus) {
        this.snapshotStatus = snapshotStatus;
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
