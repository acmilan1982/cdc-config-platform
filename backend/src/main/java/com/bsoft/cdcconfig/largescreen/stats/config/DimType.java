package com.bsoft.cdcconfig.largescreen.stats.config;

/**
 * 维度类型枚举。
 * 不包含 ORG — 机构排行在查询阶段通过 SOURCE_DATA_SOURCE_ID → CDC_DATA_SOURCE.DATA_SOURCE_ORG 实时映射。
 */
public enum DimType {
    SOURCE_DATA_SOURCE,
    TARGET_DB,
    TABLE
}
