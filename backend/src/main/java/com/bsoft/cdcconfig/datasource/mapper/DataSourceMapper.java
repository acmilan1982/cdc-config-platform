package com.bsoft.cdcconfig.datasource.mapper;

import com.baomidou.mybatisplus.core.mapper.BaseMapper;
import com.bsoft.cdcconfig.datasource.entity.DataSource;
import org.apache.ibatis.annotations.Insert;
import org.apache.ibatis.annotations.Mapper;

@Mapper
public interface DataSourceMapper extends BaseMapper<DataSource> {

    /**
     * 主表新增：在同一条 INSERT 中以 Oracle 数据库当前时间写入 INSERT_TIME / UPDATE_TIME。
     * 不使用 JVM 时间，也不依赖数据库列默认值。
     */
    @Insert("INSERT INTO CDC_DATA_SOURCE ("
            + "DATA_SOURCE_ID, DATA_SOURCE_NAME, DATA_SOURCE_CATEGORY, DATA_SOURCE_TYPE, "
            + "DATA_SOURCE_ORG, DATA_SOURCE_HOST, DATA_SOURCE_PORT, DATA_SOURCE_USER_NAME, "
            + "DATA_SOURCE_PASSWORD, DATA_SOURCE_SERVICE_NAME, FG_ACTIVE, "
            + "INSERT_TIME, UPDATE_TIME"
            + ") VALUES ("
            + "#{dataSourceId}, #{dataSourceName}, #{dataSourceCategory}, #{dataSourceType}, "
            + "#{dataSourceOrg}, #{dataSourceHost}, #{dataSourcePort}, #{dataSourceUserName}, "
            + "#{dataSourcePassword}, #{dataSourceServiceName}, #{fgActive}, "
            + "SYSDATE, SYSDATE"
            + ")")
    int insertWithSysdate(DataSource entity);
}
