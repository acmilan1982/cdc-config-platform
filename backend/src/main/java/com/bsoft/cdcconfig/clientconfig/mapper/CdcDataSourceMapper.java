package com.bsoft.cdcconfig.clientconfig.mapper;

import com.baomidou.mybatisplus.core.mapper.BaseMapper;
import com.bsoft.cdcconfig.clientconfig.entity.CdcDataSource;
import org.apache.ibatis.annotations.Mapper;
import org.apache.ibatis.annotations.Select;

import java.util.List;

/**
 * 只读安全字段读取：列表/候选只读安全列，禁止读取 DATA_SOURCE_PASSWORD 及无关连接信息。
 */
@Mapper
public interface CdcDataSourceMapper extends BaseMapper<CdcDataSource> {

    @Select("SELECT DATA_SOURCE_ID, DATA_SOURCE_NAME, DATA_SOURCE_CATEGORY,"
            + " DATA_SOURCE_TYPE, DATA_SOURCE_ORG, FG_ACTIVE"
            + " FROM CDC_DATA_SOURCE ORDER BY DATA_SOURCE_ID")
    List<CdcDataSource> selectSafeAll();
}
