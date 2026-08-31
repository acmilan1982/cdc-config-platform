package com.bsoft.cdcconfig.subscription.mapper;

import com.baomidou.mybatisplus.core.mapper.BaseMapper;
import com.bsoft.cdcconfig.subscription.entity.DataSubscribe;
import org.apache.ibatis.annotations.Insert;
import org.apache.ibatis.annotations.Mapper;
import org.apache.ibatis.annotations.Select;

import java.util.List;

@Mapper
public interface SubscriptionDataSubscribeMapper extends BaseMapper<DataSubscribe> {

    /**
     * 列表唯一数据库查询：只读启用订阅并按 NVL(UPDATE_TIME, INSERT_TIME) DESC 排序
     * （DATABASE.md §4.1）。源库/目标库过滤在服务层 Java 完成。
     */
    @Select("SELECT DATA_SUB_ID, DATA_SUB_DESC, DATA_FROM_SOURCE_ID, DATA_TO_SOURCE_ID, "
            + "DATA_SOURCE_TABLE, INSERT_TIME, UPDATE_TIME "
            + "FROM CDC_DATA_SUBSCRIBE "
            + "WHERE FG_ACTIVE = '1' "
            + "ORDER BY NVL(UPDATE_TIME, INSERT_TIME) DESC")
    List<DataSubscribe> selectActiveForList();

    /**
     * 专用参数化 INSERT：INSERT_TIME=SYSDATE、UPDATE_TIME=NULL、DELETE_TIME=NULL、
     * FG_ACTIVE='1'、三个遗留字段 NULL（DATABASE.md §4.3）。主键由 Service 显式设置（IdType.INPUT）。
     */
    @Insert("INSERT INTO CDC_DATA_SUBSCRIBE "
            + "(DATA_SUB_ID, DATA_SUB_DESC, DATA_FROM_SOURCE_ID, DATA_TO_SOURCE_ID, "
            + "DATA_SOURCE_TABLE, DATA_SOURCE_COMMENT, DATA_TARGET_TABLE, DATA_TARGET_COMMENT, "
            + "INSERT_TIME, UPDATE_TIME, DELETE_TIME, FG_ACTIVE) "
            + "VALUES (#{dataSubId}, #{dataSubDesc}, #{dataFromSourceId}, #{dataToSourceId}, "
            + "#{dataSourceTable,jdbcType=CLOB}, NULL, NULL, NULL, "
            + "SYSDATE, NULL, NULL, '1')")
    int insertForCreate(DataSubscribe entity);
}
