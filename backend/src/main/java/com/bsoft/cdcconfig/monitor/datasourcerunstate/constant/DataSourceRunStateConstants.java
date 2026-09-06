package com.bsoft.cdcconfig.monitor.datasourcerunstate.constant;

/**
 * 源库快照状态模块常量（契约见 docs/features/data-source-snapshot-status/API.md）。
 * 单维筛选上限、映射状态词与源库类别判定，原始状态值归属 {@link com.bsoft.cdcconfig.monitor.datasourcerunstate.enums.SnapshotStatusCategory}。
 */
public final class DataSourceRunStateConstants {

    /** 单个筛选维度（clientId/sourceId/status）最多传入项数（API.md §4.1，纯防御上限）。 */
    public static final int MAX_FILTER_IDS = 200;

    public static final String MAPPING_STATE_ACTIVE = "ACTIVE";
    public static final String MAPPING_STATE_INACTIVE = "INACTIVE";
    public static final String MAPPING_STATE_NOT_FOUND = "NOT_FOUND";

    /** FG_ACTIVE 启用标识。 */
    public static final String FG_ACTIVE_ENABLED = "1";

    /** 源库类别归一后判定为“源库”的值（大小写不敏感，DESIGN §5.6）。 */
    public static final String DATA_SOURCE_CATEGORY_SOURCE = "SOURCE";

    private DataSourceRunStateConstants() {
    }
}
