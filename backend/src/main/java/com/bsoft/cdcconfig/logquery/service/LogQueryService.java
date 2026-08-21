package com.bsoft.cdcconfig.logquery.service;

import com.bsoft.cdcconfig.logquery.dto.LogListQuery;
import com.bsoft.cdcconfig.logquery.vo.DataSourceOptionsVO;
import com.bsoft.cdcconfig.logquery.vo.LogDetailVO;
import com.bsoft.cdcconfig.logquery.vo.LogListResponse;
import com.bsoft.cdcconfig.logquery.vo.RawMessageVO;

/**
 * 日志查询服务（LQ-DESIGN-03）。
 */
public interface LogQueryService {

    DataSourceOptionsVO getDataSourceOptions();

    LogListResponse searchLogs(LogListQuery query);

    LogDetailVO getLogDetail(String logType, String cdcLogId);

    RawMessageVO getRawMessage(String logType, String cdcLogId);
}
