package com.bsoft.cdcconfig.monitor.jobfailure.enums;

public enum RecordStatus {
    WAITING_RESTART("等待重启"),
    RESTARTING("正在重启"),
    STABILITY_OBSERVING("稳定观察中"),
    RECOVERY_RECORDED("已记录恢复"),
    SUBMIT_FAILED("本次提交失败"),
    RESTART_SKIPPED("计划已跳过"),
    IGNORED("已忽略"),
    NOT_CLOSED("记录未闭环"),
    DATA_ANOMALY("数据异常");

    private final String label;

    RecordStatus(String label) { this.label = label; }

    public String getLabel() { return label; }
}
