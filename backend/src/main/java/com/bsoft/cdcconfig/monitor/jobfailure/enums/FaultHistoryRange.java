package com.bsoft.cdcconfig.monitor.jobfailure.enums;

/**
 * 故障历史固定自然日时间范围（JFM-ADJ-274～276、JFM-ADJ-288）。
 * 仅允许三个枚举，不接受前端任意起止时间。
 */
public enum FaultHistoryRange {

    TODAY("今日"),
    LAST_7_DAYS("近7天"),
    LAST_30_DAYS("近30天");

    private final String label;

    FaultHistoryRange(String label) { this.label = label; }

    public String getLabel() { return label; }

    /** null/空白按 TODAY 处理；其余非法值返回 null，由调用方报错。 */
    public static FaultHistoryRange from(String value) {
        if (value == null || value.trim().isEmpty()) {
            return TODAY;
        }
        for (FaultHistoryRange r : values()) {
            if (r.name().equalsIgnoreCase(value.trim())) {
                return r;
            }
        }
        return null;
    }
}
