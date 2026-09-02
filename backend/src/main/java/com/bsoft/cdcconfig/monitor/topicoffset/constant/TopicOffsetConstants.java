package com.bsoft.cdcconfig.monitor.topicoffset.constant;

/**
 * topic-offset 模块常量（数据同步进度）。
 * 固定页大小、参数防御上限与映射状态词，契约见 docs/features/topic-offset/API.md。
 */
public final class TopicOffsetConstants {

    /** 固定每页条数，不接受分页规格参数。 */
    public static final int PAGE_SIZE = 150;

    /** 单个筛选维度（clientId/sourceId/targetId）最多传入项数。 */
    public static final int MAX_FILTER_IDS = 50;

    /** 表名去除首尾空格后最大长度。 */
    public static final int MAX_TABLE_NAME_LENGTH = 200;

    public static final String MAPPING_STATE_ACTIVE = "ACTIVE";
    public static final String MAPPING_STATE_INACTIVE = "INACTIVE";
    public static final String MAPPING_STATE_NOT_FOUND = "NOT_FOUND";

    /** FG_ACTIVE 启用标识。 */
    public static final String FG_ACTIVE_ENABLED = "1";

    public static final String DATA_SOURCE_CATEGORY_SOURCE = "SOURCE";
    public static final String DATA_SOURCE_CATEGORY_TARGET = "TARGET";

    private TopicOffsetConstants() {
    }
}
