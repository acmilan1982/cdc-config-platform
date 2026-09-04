package com.bsoft.cdcconfig.clientconfig.model.query;

/**
 * 列表状态筛选：ALL 含任意原始 FG_ACTIVE；ENABLED 只匹配 '1'；DISABLED 只匹配 '0'；
 * 非 0/1 历史异常值只出现在 ALL（CCFG-DESIGN-006）。非法枚举值由全局类型绑定失败映射为 HTTP 400。
 */
public enum ClientStatus {
    ALL,
    ENABLED,
    DISABLED
}
