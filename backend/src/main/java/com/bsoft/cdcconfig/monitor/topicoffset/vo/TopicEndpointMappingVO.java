package com.bsoft.cdcconfig.monitor.topicoffset.vo;

/**
 * 单端映射引用（API.md §4.1 mapping 内 client/source/target）。
 * org 仅 source/target 携带；desc 仅客户端候选携带；均非 null 才输出（全局 non_null）。
 */
public class TopicEndpointMappingVO {

    private String state;
    private String id;
    private String org;
    private String desc;

    public TopicEndpointMappingVO() {
    }

    public TopicEndpointMappingVO(String state, String id, String org, String desc) {
        this.state = state;
        this.id = id;
        this.org = org;
        this.desc = desc;
    }

    public String getState() {
        return state;
    }

    public void setState(String state) {
        this.state = state;
    }

    public String getId() {
        return id;
    }

    public void setId(String id) {
        this.id = id;
    }

    public String getOrg() {
        return org;
    }

    public void setOrg(String org) {
        this.org = org;
    }

    public String getDesc() {
        return desc;
    }

    public void setDesc(String desc) {
        this.desc = desc;
    }
}
