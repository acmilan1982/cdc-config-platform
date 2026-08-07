package com.bsoft.cdcconfig.largescreen.stats.mapper;

import com.baomidou.mybatisplus.core.mapper.BaseMapper;
import com.bsoft.cdcconfig.largescreen.stats.entity.StatsWatermarkEntity;
import org.apache.ibatis.annotations.Mapper;
import org.apache.ibatis.annotations.Param;
import org.apache.ibatis.annotations.Update;

@Mapper
public interface StatsWatermarkMapper extends BaseMapper<StatsWatermarkEntity> {

    /**
     * CAS 更新水位。
     * 只有当前 LAST_LOG_ID 等于旧值时才更新，影响行数必须恰好为1。
     */
    @Update("UPDATE CDC_STATS_WATERMARK SET "
            + "LAST_LOG_ID = #{newId}, "
            + "TOTAL_PROCESSED = TOTAL_PROCESSED + #{batchCount}, "
            + "LAST_BATCH_ID = #{batchId}, "
            + "LAST_BATCH_TIME = SYSDATE, "
            + "UPDATE_TIME = SYSDATE "
            + "WHERE TASK_CODE = #{taskCode} "
            + "AND LOG_TYPE = #{logType} "
            + "AND LAST_LOG_ID = #{oldId}")
    int casUpdate(@Param("taskCode") String taskCode,
                  @Param("logType") String logType,
                  @Param("oldId") long oldId,
                  @Param("newId") long newId,
                  @Param("batchCount") int batchCount,
                  @Param("batchId") String batchId);
}
