package com.bsoft.cdcconfig.largescreen.stats.config;

/**
 * 维度键构造器。
 * Oracle 空字符串等价于 NULL，使用 TRIM 后判空。
 */
public final class DimKeyBuilder {

    /** TABLE 维度字段间分隔符（英文句点）。 */
    static final char SEPARATOR = '.';

    /** TABLE 维度全部缺失时的保留键。 */
    static final String UNIDENTIFIED_TABLE = "__UNIDENTIFIED_TABLE__";

    /** SOURCE_DATA_SOURCE 维度缺失时的保留键。 */
    static final String UNIDENTIFIED_SOURCE = "__UNIDENTIFIED_SOURCE__";

    /** TARGET_DB 维度缺失时的保留键。 */
    static final String UNIDENTIFIED_TARGET = "__UNIDENTIFIED_TARGET__";

    /** DIM_VALUE 最大长度，必须 ≤ 数据库定义 VARCHAR2(256)。 */
    private static final int MAX_DIM_VALUE_LENGTH = 256;

    private DimKeyBuilder() {
    }

    /**
     * 构造源数据源维度键。
     */
    public static String buildSourceDimKey(String sourceDataSourceId) {
        String trimmed = trimToNull(sourceDataSourceId);
        return trimmed != null ? trimmed : UNIDENTIFIED_SOURCE;
    }

    /**
     * 构造目标库维度键。
     */
    public static String buildTargetDbDimKey(String targetDataSourceId) {
        String trimmed = trimToNull(targetDataSourceId);
        return trimmed != null ? trimmed : UNIDENTIFIED_TARGET;
    }

    /**
     * 构造同步表维度键。
     * 三个字段中任意一个为空即归入保留键，使用英文句点 `.` 分隔。
     */
    public static String buildTableDimKey(String sourceDataSourceId,
                                          String sourceSchemaName,
                                          String sourceTableName) {
        String sourceId = trimToNull(sourceDataSourceId);
        String schema = trimToNull(sourceSchemaName);
        String table = trimToNull(sourceTableName);

        if (sourceId == null || schema == null || table == null) {
            return UNIDENTIFIED_TABLE;
        }
        String key = sourceId + SEPARATOR + schema + SEPARATOR + table;
        if (key.length() > MAX_DIM_VALUE_LENGTH) {
            throw new IllegalArgumentException(
                    "TABLE dim value exceeds " + MAX_DIM_VALUE_LENGTH + " chars: "
                            + key.length() + " chars");
        }
        return key;
    }

    private static String trimToNull(String value) {
        if (value == null) {
            return null;
        }
        String trimmed = value.trim();
        return trimmed.isEmpty() ? null : trimmed;
    }
}
