package com.bsoft.cdcconfig.monitor.topicoffset.vo;

/**
 * 客户端候选元素（API.md §4.2 clients[]）。desc 可为空。
 */
public class ClientCandidateVO {

    private String id;
    private String desc;
    private boolean active;

    public String getId() {
        return id;
    }

    public void setId(String id) {
        this.id = id;
    }

    public String getDesc() {
        return desc;
    }

    public void setDesc(String desc) {
        this.desc = desc;
    }

    public boolean isActive() {
        return active;
    }

    public void setActive(boolean active) {
        this.active = active;
    }
}
