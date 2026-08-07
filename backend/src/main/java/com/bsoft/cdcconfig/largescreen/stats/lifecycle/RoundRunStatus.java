package com.bsoft.cdcconfig.largescreen.stats.lifecycle;

/**
 * 单轮运行状态枚举。
 */
public enum RoundRunStatus {
    /** 本轮已执行完成 */
    EXECUTED,
    /** 上一轮仍在执行，本轮跳过 */
    SKIPPED_LOCKED,
    /** 本轮执行失败 */
    FAILED
}
