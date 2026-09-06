package com.bsoft.cdcconfig.monitor.datasourcerunstate.mapper;

import com.bsoft.cdcconfig.monitor.datasourcerunstate.model.RunStateDataSourceRow;
import org.apache.ibatis.annotations.Mapper;
import org.apache.ibatis.annotations.Select;

import java.util.List;

/**
 * CDC_DATA_SOURCE 只读 Mapper：显式列投影（ID/ORG/CATEGORY/FG_ACTIVE），读取全部行（含停用）。
 * 列清单绝不包含 DATA_SOURCE_PASSWORD（安全约束，DATABASE §3.3/§10）。
 */
@Mapper
public interface RunStateDataSourceMapper {

    @Select("SELECT DATA_SOURCE_ID AS dataSourceId, DATA_SOURCE_ORG AS dataSourceOrg, "
            + "DATA_SOURCE_CATEGORY AS dataSourceCategory, FG_ACTIVE AS fgActive "
            + "FROM CDC_DATA_SOURCE")
    List<RunStateDataSourceRow> selectAll();
}
