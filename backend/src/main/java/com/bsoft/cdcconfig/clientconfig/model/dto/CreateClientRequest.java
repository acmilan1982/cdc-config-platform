package com.bsoft.cdcconfig.clientconfig.model.dto;

import javax.validation.constraints.NotNull;
import java.util.List;

/**
 * 新增探针请求（E3）。仅 @NotNull 保证字段结构存在；
 * 空值/空白/格式/去重/字节等业务规则由 Service 权威校验（CCFG-API-008/013/014/015/016）。
 */
public class CreateClientRequest {

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
