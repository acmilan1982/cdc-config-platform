package com.bsoft.cdcconfig.monitor.jobfailure.enums;

public enum FaultProcessResult {
    RECOVERY_RECORDED("已记录恢复"),
    NOT_CLOSED("记录未闭环"),
    DATA_ANOMALY("数据异常");

    private final String label;

    FaultProcessResult(String label) { this.label = label; }

    public String getLabel() { return label; }
}
