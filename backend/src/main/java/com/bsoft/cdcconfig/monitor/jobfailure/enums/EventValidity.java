package com.bsoft.cdcconfig.monitor.jobfailure.enums;

public enum EventValidity {
    VALID("有效"),
    INVALID("无效"),
    STALE("过期"),
    UNKNOWN("未知");

    private final String label;

    EventValidity(String label) { this.label = label; }

    public String getLabel() { return label; }

    public static EventValidity fromEventResult(String eventResult) {
        if (eventResult == null) return UNKNOWN;
        switch (eventResult) {
            case "ACCEPTED": return VALID;
            case "IGNORED_INVALID": return INVALID;
            case "IGNORED_STALE": return STALE;
            default: return UNKNOWN;
        }
    }
}
