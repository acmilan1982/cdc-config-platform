package com.bsoft.cdcconfig.serverconfig.service;

import com.bsoft.cdcconfig.serverconfig.dto.ServerConfigSaveRequest;
import com.bsoft.cdcconfig.serverconfig.vo.ServerConfigPageVO;

/**
 * 中心端配置服务（SC-DESIGN-022）。
 */
public interface ServerConfigService {

    /** 查询中心端配置页面数据：唯一中心端 + 全部配置 + 可编辑判定（SC-API-020）。 */
    ServerConfigPageVO getPage();

    /** 批量保存既有配置记录的 CONFIG_VALUE（SC-API-040），单事务、整批回滚。 */
    void save(ServerConfigSaveRequest request);
}
