package com.bsoft.cdcconfig.clientconfig.service;

import com.bsoft.cdcconfig.clientconfig.model.dto.CreateClientRequest;
import com.bsoft.cdcconfig.clientconfig.model.dto.UpdateClientRequest;
import com.bsoft.cdcconfig.clientconfig.model.query.ClientStatus;
import com.bsoft.cdcconfig.clientconfig.model.vo.ClientListVO;
import com.bsoft.cdcconfig.clientconfig.model.vo.DataSourceOptionVO;

import java.util.List;

/** 探针端管理业务服务：E1~E7（CCFG-API-003 固定最小接口集合）。 */
public interface ClientConfigService {

    ClientListVO list(String keyword, ClientStatus status);

    List<DataSourceOptionVO> dataSourceOptions(String excludeClientId);

    void create(CreateClientRequest request);

    void update(String originalClientId, UpdateClientRequest request);

    void delete(String clientId);

    void enable(String clientId);

    void disable(String clientId);
}
