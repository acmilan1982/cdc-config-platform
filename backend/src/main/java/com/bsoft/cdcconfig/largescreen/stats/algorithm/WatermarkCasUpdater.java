package com.bsoft.cdcconfig.largescreen.stats.algorithm;

import com.baomidou.mybatisplus.core.conditions.query.LambdaQueryWrapper;
import com.bsoft.cdcconfig.largescreen.stats.entity.StatsWatermarkEntity;
import com.bsoft.cdcconfig.largescreen.stats.mapper.StatsWatermarkMapper;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Component;

/**
 * 水位读取与CAS更新。
 */
@Component
public class WatermarkCasUpdater {

    private static final Logger log = LoggerFactory.getLogger(WatermarkCasUpdater.class);

    private final StatsWatermarkMapper statsWatermarkMapper;

    public WatermarkCasUpdater(StatsWatermarkMapper statsWatermarkMapper) {
        this.statsWatermarkMapper = statsWatermarkMapper;
    }

    /**
     * 读取当前水位值。
     *
     * @return 当前 LAST_LOG_ID，如果无水位记录返回 0
     */
    public long readCurrentWatermark(String taskCode, String logType) {
        LambdaQueryWrapper<StatsWatermarkEntity> qw = new LambdaQueryWrapper<>();
        qw.eq(StatsWatermarkEntity::getTaskCode, taskCode)
          .eq(StatsWatermarkEntity::getLogType, logType);
        StatsWatermarkEntity entity = statsWatermarkMapper.selectOne(qw);
        if (entity == null) {
            log.warn("No watermark found for task {} type {}, defaulting to 0",
                    taskCode, logType);
            return 0L;
        }
        return entity.getLastLogId() != null ? entity.getLastLogId() : 0L;
    }

    /**
     * CAS 更新水位。影响行数必须恰好为1，否则抛异常。
     *
     * @throws IllegalStateException 如果影响行数不为1
     */
    public void casUpdate(String taskCode, String logType,
                           long oldId, long newId,
                           int batchCount, String batchId) {
        int rows = statsWatermarkMapper.casUpdate(
                taskCode, logType, oldId, newId, batchCount, batchId);

        if (rows != 1) {
            throw new IllegalStateException(
                    "Watermark CAS failed: expected 1 row affected, got " + rows
                            + ". taskCode=" + taskCode + ", logType=" + logType
                            + ", oldId=" + oldId + ", newId=" + newId);
        }

        log.debug("Watermark CAS ok: {} {} {} → {}", taskCode, logType, oldId, newId);
    }
}
