package com.bsoft.cdcconfig.common.util;

/**
 * 配置平台独立的雪花ID时间边界计算类。
 * 只计算某时间点对应的最大雪花ID，不生成ID。
 */
public final class SnowflakeIdBoundaryCalculator {

    /** 自定义起始时间戳：2024-01-01 00:00:00 UTC */
    private static final long EPOCH = 1704067200000L;

    /** 时间戳左移位数。 */
    private static final int TIMESTAMP_SHIFT = 22;

    /** 低位掩码：workerId(5) + datacenterId(5) + sequence(12) = 22位全1。 */
    private static final long LOW_BITS_MASK = (1L << 22) - 1; // 4194303L

    /** 41位毫秒时间戳最大值（约69.7年，从2024年起大约可用至2093年）。 */
    private static final long MAX_TIMESTAMP_MILLIS = (1L << 41) - 1;

    private SnowflakeIdBoundaryCalculator() {
        // 工具类不允许实例化。
    }

    /**
     * 计算指定毫秒时间点对应的最大雪花ID。
     *
     * @param timestampMillis 时间点（UTC毫秒）
     * @return 该时间点可能的最大雪花ID
     * @throws IllegalArgumentException 时间早于EPOCH或超过41位范围
     */
    public static long maxIdAt(long timestampMillis) {
        if (timestampMillis < EPOCH) {
            throw new IllegalArgumentException(
                    "Timestamp " + timestampMillis + " is before EPOCH " + EPOCH);
        }
        long delta = timestampMillis - EPOCH;
        if (delta > MAX_TIMESTAMP_MILLIS) {
            throw new IllegalArgumentException(
                    "Timestamp delta " + delta + " exceeds 41-bit range " + MAX_TIMESTAMP_MILLIS);
        }
        return (delta << TIMESTAMP_SHIFT) | LOW_BITS_MASK;
    }
}
