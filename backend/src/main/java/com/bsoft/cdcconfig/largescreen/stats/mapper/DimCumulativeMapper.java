package com.bsoft.cdcconfig.largescreen.stats.mapper;

import com.baomidou.mybatisplus.core.mapper.BaseMapper;
import com.bsoft.cdcconfig.largescreen.stats.entity.DimCumulativeEntity;
import org.apache.ibatis.annotations.Mapper;
import org.apache.ibatis.annotations.Param;
import org.apache.ibatis.annotations.Update;

@Mapper
public interface DimCumulativeMapper extends BaseMapper<DimCumulativeEntity> {

    @Update("MERGE INTO CDC_STATS_DIM_CUMULATIVE t "
            + "USING (SELECT #{taskCode} AS task_code, #{dimType} AS dim_type, "
            + "  #{dimValue} AS dim_value FROM DUAL) s "
            + "ON (t.TASK_CODE = s.task_code AND t.DIM_TYPE = s.dim_type "
            + "  AND t.DIM_VALUE = s.dim_value) "
            + "WHEN MATCHED THEN UPDATE SET "
            + "  SUCCESS_COUNT = SUCCESS_COUNT + #{successInc}, "
            + "  ERROR_COUNT = ERROR_COUNT + #{errorInc}, "
            + "  TOTAL_COUNT = TOTAL_COUNT + #{successInc} + #{errorInc}, "
            + "  LAST_BATCH_ID = #{batchId}, "
            + "  UPDATE_TIME = SYSDATE "
            + "WHEN NOT MATCHED THEN INSERT ("
            + "  TASK_CODE, DIM_TYPE, DIM_VALUE, SUCCESS_COUNT, ERROR_COUNT, "
            + "  TOTAL_COUNT, LAST_BATCH_ID, CREATE_TIME, UPDATE_TIME"
            + ") VALUES ("
            + "  #{taskCode}, #{dimType}, #{dimValue}, #{successInc}, #{errorInc}, "
            + "  #{successInc} + #{errorInc}, #{batchId}, SYSDATE, SYSDATE"
            + ")")
    int mergeIncrement(@Param("taskCode") String taskCode,
                       @Param("dimType") String dimType,
                       @Param("dimValue") String dimValue,
                       @Param("successInc") long successInc,
                       @Param("errorInc") long errorInc,
                       @Param("batchId") String batchId);
}
