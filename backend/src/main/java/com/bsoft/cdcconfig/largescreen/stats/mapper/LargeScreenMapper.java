package com.bsoft.cdcconfig.largescreen.stats.mapper;

import com.bsoft.cdcconfig.largescreen.stats.entity.CumulativeOverviewEntity;
import com.bsoft.cdcconfig.largescreen.stats.entity.DailyOverviewEntity;
import com.bsoft.cdcconfig.largescreen.stats.entity.StatsWatermarkEntity;
import org.apache.ibatis.annotations.Mapper;
import org.apache.ibatis.annotations.Param;
import org.apache.ibatis.annotations.Select;

import java.util.Date;
import java.util.List;
import java.util.Map;

/**
 * 大屏查询 Mapper — 只读查询统计结果表、水位表和配置表。
 * 禁止引用 CDC_LOG_CORRECT / CDC_LOG_ERROR 两张日志大表。
 */
@Mapper
public interface LargeScreenMapper {

    // ---- 累计概览 ----

    @Select("SELECT TASK_CODE, SUCCESS_COUNT, ERROR_COUNT, TOTAL_COUNT, "
            + "LAST_BATCH_ID, CREATE_TIME, UPDATE_TIME "
            + "FROM CDC_STATS_CUMULATIVE_OVERVIEW WHERE TASK_CODE = #{taskCode}")
    CumulativeOverviewEntity selectCumulativeOverview(@Param("taskCode") String taskCode);

    // ---- 每日概览（日期由 Service 层按 Asia/Shanghai 计算后传入） ----

    @Select("SELECT TASK_CODE, STAT_DATE, SUCCESS_COUNT, ERROR_COUNT, TOTAL_COUNT, "
            + "LAST_BATCH_ID, CREATE_TIME, UPDATE_TIME "
            + "FROM CDC_STATS_DAILY_OVERVIEW "
            + "WHERE TASK_CODE = #{taskCode} AND STAT_DATE = #{statDate}")
    DailyOverviewEntity selectDailyOverview(@Param("taskCode") String taskCode,
                                            @Param("statDate") Date statDate);

    @Select("SELECT TASK_CODE, STAT_DATE, SUCCESS_COUNT, ERROR_COUNT, TOTAL_COUNT, "
            + "LAST_BATCH_ID, CREATE_TIME, UPDATE_TIME "
            + "FROM CDC_STATS_DAILY_OVERVIEW "
            + "WHERE TASK_CODE = #{taskCode} "
            + "AND STAT_DATE >= #{startDate} AND STAT_DATE <= #{endDate} "
            + "ORDER BY STAT_DATE ASC")
    List<DailyOverviewEntity> selectDailyRange(@Param("taskCode") String taskCode,
                                               @Param("startDate") Date startDate,
                                               @Param("endDate") Date endDate);

    // ---- 维度累计（按类型查询全部维度记录，用于 ORG 聚合和覆盖规模） ----

    @Select("SELECT DIM_VALUE, SUCCESS_COUNT, ERROR_COUNT, TOTAL_COUNT, UPDATE_TIME "
            + "FROM CDC_STATS_DIM_CUMULATIVE "
            + "WHERE TASK_CODE = #{taskCode} AND DIM_TYPE = #{dimType}")
    List<Map<String, Object>> selectDimCumulativeByType(@Param("taskCode") String taskCode,
                                                        @Param("dimType") String dimType);

    // ---- 维度每日（日期由 Service 层传入） ----

    @Select("SELECT DIM_VALUE, SUCCESS_COUNT, ERROR_COUNT, TOTAL_COUNT, UPDATE_TIME "
            + "FROM CDC_STATS_DIM_DAILY "
            + "WHERE TASK_CODE = #{taskCode} AND DIM_TYPE = #{dimType} "
            + "AND STAT_DATE = #{statDate}")
    List<Map<String, Object>> selectDimDailyByType(@Param("taskCode") String taskCode,
                                                    @Param("dimType") String dimType,
                                                    @Param("statDate") Date statDate);

    // ---- 三类 Top 10（数据库侧 ORDER BY TOTAL_COUNT DESC + FETCH FIRST 10） ----

    @Select("SELECT DIM_VALUE, SUCCESS_COUNT, ERROR_COUNT, TOTAL_COUNT "
            + "FROM CDC_STATS_DIM_CUMULATIVE "
            + "WHERE TASK_CODE = #{taskCode} AND DIM_TYPE = 'SOURCE_DATA_SOURCE' "
            + "ORDER BY TOTAL_COUNT DESC, DIM_VALUE ASC "
            + "FETCH FIRST 10 ROWS ONLY")
    List<Map<String, Object>> selectTop10SourceDatabases(@Param("taskCode") String taskCode);

    @Select("SELECT DIM_VALUE, SUCCESS_COUNT, ERROR_COUNT, TOTAL_COUNT "
            + "FROM CDC_STATS_DIM_CUMULATIVE "
            + "WHERE TASK_CODE = #{taskCode} AND DIM_TYPE = 'TARGET_DB' "
            + "ORDER BY TOTAL_COUNT DESC, DIM_VALUE ASC "
            + "FETCH FIRST 10 ROWS ONLY")
    List<Map<String, Object>> selectTop10TargetDatabases(@Param("taskCode") String taskCode);

    @Select("SELECT DIM_VALUE, SUCCESS_COUNT, ERROR_COUNT, TOTAL_COUNT "
            + "FROM CDC_STATS_DIM_CUMULATIVE "
            + "WHERE TASK_CODE = #{taskCode} AND DIM_TYPE = 'TABLE' "
            + "ORDER BY TOTAL_COUNT DESC, DIM_VALUE ASC "
            + "FETCH FIRST 10 ROWS ONLY")
    List<Map<String, Object>> selectTop10Tables(@Param("taskCode") String taskCode);

    // ---- 水位（用于 dataStatus 判定） ----

    @Select("SELECT TASK_CODE, LOG_TYPE, LAST_LOG_ID, LAST_BATCH_ID, "
            + "LAST_BATCH_TIME, TOTAL_PROCESSED, CREATE_TIME, UPDATE_TIME "
            + "FROM CDC_STATS_WATERMARK WHERE TASK_CODE = #{taskCode}")
    List<StatsWatermarkEntity> selectWatermarks(@Param("taskCode") String taskCode);

    // ---- 统计更新时间（各结果表最保守的新鲜度） ----

    @Select("SELECT MIN(UPDATE_TIME) FROM CDC_STATS_DIM_CUMULATIVE "
            + "WHERE TASK_CODE = #{taskCode}")
    Date selectMinDimCumulativeUpdateTime(@Param("taskCode") String taskCode);

    @Select("SELECT MIN(UPDATE_TIME) FROM CDC_STATS_DIM_DAILY "
            + "WHERE TASK_CODE = #{taskCode}")
    Date selectMinDimDailyUpdateTime(@Param("taskCode") String taskCode);

    // ---- 覆盖规模：启用客户端 ----

    @Select("SELECT CLIENT_ID, DATA_SOURCE_ID "
            + "FROM CDC_CLIENT_MULTIPLE WHERE FG_ACTIVE = '1'")
    List<Map<String, Object>> selectActiveClientDataSources();
}
