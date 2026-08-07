package com.bsoft.cdcconfig.largescreen.stats.mapper;

import com.baomidou.mybatisplus.core.mapper.BaseMapper;
import com.bsoft.cdcconfig.largescreen.stats.entity.CumulativeOverviewEntity;
import org.apache.ibatis.annotations.Mapper;
import org.apache.ibatis.annotations.Param;
import org.apache.ibatis.annotations.Update;

@Mapper
public interface CumulativeOverviewMapper extends BaseMapper<CumulativeOverviewEntity> {

    @Update("MERGE INTO CDC_STATS_CUMULATIVE_OVERVIEW t "
            + "USING (SELECT #{taskCode} AS task_code FROM DUAL) s "
            + "ON (t.TASK_CODE = s.task_code) "
            + "WHEN MATCHED THEN UPDATE SET "
            + "  SUCCESS_COUNT = SUCCESS_COUNT + #{successInc}, "
            + "  ERROR_COUNT = ERROR_COUNT + #{errorInc}, "
            + "  TOTAL_COUNT = TOTAL_COUNT + #{successInc} + #{errorInc}, "
            + "  LAST_BATCH_ID = #{batchId}, "
            + "  UPDATE_TIME = SYSDATE "
            + "WHEN NOT MATCHED THEN INSERT ("
            + "  TASK_CODE, SUCCESS_COUNT, ERROR_COUNT, TOTAL_COUNT, "
            + "  LAST_BATCH_ID, CREATE_TIME, UPDATE_TIME"
            + ") VALUES ("
            + "  #{taskCode}, #{successInc}, #{errorInc}, #{successInc} + #{errorInc}, "
            + "  #{batchId}, SYSDATE, SYSDATE"
            + ")")
    int mergeIncrement(@Param("taskCode") String taskCode,
                       @Param("successInc") long successInc,
                       @Param("errorInc") long errorInc,
                       @Param("batchId") String batchId);
}
