package com.bsoft.cdcconfig.monitor.datasourcerunstate.service;

import com.bsoft.cdcconfig.monitor.datasourcerunstate.query.DataSourceRunStateQuery;
import com.bsoft.cdcconfig.monitor.datasourcerunstate.vo.SnapshotStatusListVO;

/**
 * 源库快照状态只读查询服务。仅一个只读 GET 语义，无任何写方法面。
 */
public interface DataSourceRunStateQueryService {

    SnapshotStatusListVO queryList(DataSourceRunStateQuery query);
}
