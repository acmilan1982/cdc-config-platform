package com.bsoft.cdcconfig.monitor.datasourcerunstate.vo;

import com.fasterxml.jackson.annotation.JsonInclude;

/**
 * 探针端关联映射引用（API.md §6 clientRef）。state∈{ACTIVE,INACTIVE,NOT_FOUND}；
 * desc=配置 CLIENT_DESC，可为 null（@JsonInclude(ALWAYS) 显式 null）。
 */
public class ClientRefVO {

    private String state;

    @JsonInclude(JsonInclude.Include.ALWAYS)
    private String desc;

    public String getState() {
        return state;
    }

    public void setState(String state) {
        this.state = state;
    }

    public String getDesc() {
        return desc;
    }

    public void setDesc(String desc) {
        this.desc = desc;
    }
}
