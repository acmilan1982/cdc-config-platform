package com.bsoft.cdcconfig.clientconfig.model.dto;

import javax.validation.constraints.NotNull;
import java.util.List;

/**
 * 编辑探针请求（E4）。originalClientId 走路径参数，不入 body（CCFG-API-009/013）。
 * 仅 @NotNull 保证字段结构存在；业务规则由 Service 权威校验。
 */
public class UpdateClientRequest {

    @NotNull
    private String clientId;

    @NotNull
    private String clientDesc;

    @NotNull
    private List<String> dataSourceIds;

    public String getClientId() {
        return clientId;
    }

    public void setClientId(String clientId) {
        this.clientId = clientId;
    }

    public String getClientDesc() {
        return clientDesc;
    }

    public void setClientDesc(String clientDesc) {
        this.clientDesc = clientDesc;
    }

    public List<String> getDataSourceIds() {
        return dataSourceIds;
    }

    public void setDataSourceIds(List<String> dataSourceIds) {
        this.dataSourceIds = dataSourceIds;
    }
}
