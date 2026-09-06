package com.bsoft.cdcconfig.monitor.datasourcerunstate.vo;

import org.apache.ibatis.type.Alias;

import com.fasterxml.jackson.annotation.JsonInclude;

/**
 * 源库关联映射引用（API.md §6 sourceRef）。state∈{ACTIVE,INACTIVE,NOT_FOUND}；
 * org=ORG（可 null 显式 null）；category=trim+upper 归一类别（NOT_FOUND 时为 null，显式 null）；
 * sourceRole=(category=='SOURCE')（DESIGN §5.6）。
 *
 * <p>type-aliases-package 按简单类名全项目注册别名，须用功能前缀避免与其他模块同名 VO 冲突。
 */
@Alias("SnapshotSourceRefVO")
public class SourceRefVO {

    private String state;

    @JsonInclude(JsonInclude.Include.ALWAYS)
    private String org;

    @JsonInclude(JsonInclude.Include.ALWAYS)
    private String category;

    private boolean sourceRole;

    public String getState() {
        return state;
    }

    public void setState(String state) {
        this.state = state;
    }

    public String getOrg() {
        return org;
    }

    public void setOrg(String org) {
        this.org = org;
    }

    public String getCategory() {
        return category;
    }

    public void setCategory(String category) {
        this.category = category;
    }

    public boolean isSourceRole() {
        return sourceRole;
    }

    public void setSourceRole(boolean sourceRole) {
        this.sourceRole = sourceRole;
    }
}
