package com.bsoft.cdcconfig.subscription.mapper;

import com.baomidou.mybatisplus.core.mapper.BaseMapper;
import com.bsoft.cdcconfig.subscription.entity.DataSourceRef;
import org.apache.ibatis.annotations.Mapper;

/**
 * CDC_DATA_SOURCE 最小投影 Mapper（订阅模块专用）。只投影 DATA_SOURCE_ID / DATA_SOURCE_ORG /
 * DATA_SOURCE_CATEGORY / FG_ACTIVE，绝不加载 DATA_SOURCE_PASSWORD 等敏感字段。
 */
@Mapper
public interface SubscriptionDataSourceMapper extends BaseMapper<DataSourceRef> {
}
