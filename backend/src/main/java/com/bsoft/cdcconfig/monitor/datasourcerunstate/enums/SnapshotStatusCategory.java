package com.bsoft.cdcconfig.monitor.datasourcerunstate.enums;

/**
 * 归一状态类别 token（API.md §6 statusCategory / §4.1 status 白名单）。
 * classify 对 SNAPSHOT_STATUS 原始值做只读推导，与过滤、展示、候选三处共享（DESIGN §5.5）。
 */
public enum SnapshotStatusCategory {

    RUNNING,
    COMPLETED,
    UNKNOWN;

    private static final String RAW_SNAPSHOT_RUNNING = "SNAPSHOT_RUNNING";
    private static final String RAW_SNAPSHOT_COMPLETED = "SNAPSHOT_COMPLETED";

    /**
     * 由数据库原始状态值推导归一类别；未知值（含理论上不可能的 NULL）一律宽容为 UNKNOWN，
     * 行保留、原值不被改写或丢弃。
     */
    public static SnapshotStatusCategory fromRaw(String raw) {
        if (RAW_SNAPSHOT_RUNNING.equals(raw)) {
            return RUNNING;
        }
        if (RAW_SNAPSHOT_COMPLETED.equals(raw)) {
            return COMPLETED;
        }
        return UNKNOWN;
    }

    /** status 查询参数白名单校验：仅接受 RUNNING/COMPLETED/UNKNOWN（API.md §4.1）。 */
    public static boolean isValidToken(String token) {
        if (token == null) {
            return false;
        }
        for (SnapshotStatusCategory category : values()) {
            if (category.name().equals(token)) {
                return true;
            }
        }
        return false;
    }
}
