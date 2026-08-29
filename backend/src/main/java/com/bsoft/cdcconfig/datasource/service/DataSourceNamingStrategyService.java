package com.bsoft.cdcconfig.datasource.service;

import com.bsoft.cdcconfig.datasource.dto.NamingStrategyDTO;
import com.bsoft.cdcconfig.datasource.vo.NamingStrategyVO;

import java.util.List;

/**
 * 命名策略服务（DESIGN.md）：只写 CDC_DATA_SOURCE_EXTEND；对 CDC_DATA_SOURCE 仅做只读校验与
 * 目标展示信息查询，保持批量查询、无 N+1。
 */
public interface DataSourceNamingStrategyService {

    List<NamingStrategyVO> list(String sourceId);

    void create(String sourceId, NamingStrategyDTO dto);

    void update(String sourceId, String originalTargetId, NamingStrategyDTO dto);

    void delete(String sourceId, String targetId);
}
