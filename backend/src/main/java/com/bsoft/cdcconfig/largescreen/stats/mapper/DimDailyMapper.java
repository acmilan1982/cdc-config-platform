package com.bsoft.cdcconfig.largescreen.stats.mapper;

import com.baomidou.mybatisplus.core.mapper.BaseMapper;
import com.bsoft.cdcconfig.largescreen.stats.entity.DimDailyEntity;
import org.apache.ibatis.annotations.Mapper;
import org.apache.ibatis.annotations.Param;
import org.apache.ibatis.annotations.Update;

import java.util.Date;

@Mapper
public interface DimDailyMapper extends BaseMapper<DimDailyEntity> {

    @Update("MERGE INTO CDC_STATS_DIM_DAILY t "
            + "USING (SELECT #{taskCode} AS task_code, #{dimType} AS dim_type, "
            + "  #{dimValue} AS dim_value, #{statDate} AS stat_date FROM DUAL) s "
            + "ON (t.TASK_CODE = s.task_code AND t.DIM_TYPE = s.dim_type "
            + "  AND t.DIM_VALUE = s.dim_value AND t.STAT_DATE = s.stat_date) "
            + "WHEN MATCHED THEN UPDATE SET "
            + "  SUCCESS_COUNT = SUCCESS_COUNT + #{successInc}, "
            + "  ERROR_COUNT = ERROR_COUNT + #{errorInc}, "
            + "  TOTAL_COUNT = TOTAL_COUNT + #{successInc} + #{errorInc}, "
            + "  LAST_BATCH_ID = #{batchId}, "
            + "  UPDATE_TIME = SYSDATE "
            + "WHEN NOT MATCHED THEN INSERT ("
            + "  TASK_CODE, DIM_TYPE, DIM_VALUE, STAT_DATE, "
            + "  SUCCESS_COUNT, ERROR_COUNT, TOTAL_COUNT, "
            + "  LAST_BATCH_ID, CREATE_TIME, UPDATE_TIME"
            + ") VALUES ("
            + "  #{taskCode}, #{dimType}, #{dimValue}, #{statDate}, "
            + "  #{successInc}, #{errorInc}, #{successInc} + #{errorInc}, "
            + "  #{batchId}, SYSDATE, SYSDATE"
            + ")")
    int mergeIncrement(@Param("taskCode") String taskCode,
                       @Param("dimType") String dimType,
                       @Param("dimValue") String dimValue,
                       @Param("statDate") Date statDate,
                       @Param("successInc") long successInc,
                       @Param("errorInc") long errorInc,
                       @Param("batchId") String batchId);
}
