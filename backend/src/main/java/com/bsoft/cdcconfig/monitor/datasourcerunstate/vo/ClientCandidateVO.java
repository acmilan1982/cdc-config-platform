package com.bsoft.cdcconfig.monitor.datasourcerunstate.vo;

import org.apache.ibatis.type.Alias;

/**
 * 探针端候选元素（API.md §5.2 clients[]）。desc=配置 CLIENT_DESC 或 null（配置缺失）。
 *
 * <p>type-aliases-package 按简单类名全项目注册别名，须用功能前缀避免与其他模块同名 VO 冲突。
 */
@Alias("SnapshotClientCandidateVO")
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
