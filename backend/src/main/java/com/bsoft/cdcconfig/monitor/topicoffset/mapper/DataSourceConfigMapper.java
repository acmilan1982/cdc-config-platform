package com.bsoft.cdcconfig.monitor.topicoffset.mapper;

import com.bsoft.cdcconfig.monitor.topicoffset.model.DataSourceConfigRow;
import org.apache.ibatis.annotations.Mapper;
import org.apache.ibatis.annotations.Select;

import java.util.List;

/**
 * CDC_DATA_SOURCE 只读 Mapper：显式列投影（ID/ORG/CATEGORY/FG_ACTIVE），读取全部行（含停用）。
 * 列清单绝不包含 DATA_SOURCE_PASSWORD。
 */
@Mapper
public interface DataSourceConfigMapper {

    @Select("SELECT DATA_SOURCE_ID AS dataSourceId, DATA_SOURCE_ORG AS dataSourceOrg, "
            + "DATA_SOURCE_CATEGORY AS dataSourceCategory, FG_ACTIVE AS fgActive "
            + "FROM CDC_DATA_SOURCE")
    List<DataSourceConfigRow> selectAll();
}
