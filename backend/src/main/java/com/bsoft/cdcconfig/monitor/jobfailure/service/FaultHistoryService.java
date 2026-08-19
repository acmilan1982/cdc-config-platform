package com.bsoft.cdcconfig.monitor.jobfailure.service;

import com.bsoft.cdcconfig.monitor.jobfailure.query.FaultHistoryListQuery;
import com.bsoft.cdcconfig.monitor.jobfailure.vo.FaultHistorySummaryVO;
import com.bsoft.cdcconfig.monitor.jobfailure.vo.FaultProcessSummaryVO;

import java.util.List;

/**
 * 独立"故障历史"只读查询（JFM-API-006、JFM-API-007）。
 * 纯数据库历史统计，不读取 ZooKeeper，不加载 CLOB。
 */
public interface FaultHistoryService {

    /**
     * 故障历史概览：返回当前配置全集数据源的三层自然日次数、最近故障与数据源展示字段。
     *
     * @param clientId 可选客户端筛选，只能命中启用客户端
     */
    List<FaultHistorySummaryVO> querySummary(String clientId);

    /**
     * 单个当前配置数据源的完整历史故障过程（不分页）。
     * 一次性返回所选自然日范围内全部故障过程；后端校验 clientId/dataSourceId 当前仍属启用客户端现行配置。
     */
    List<FaultProcessSummaryVO> queryHistory(FaultHistoryListQuery query);
}
