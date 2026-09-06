package com.bsoft.cdcconfig.monitor.datasourcerunstate.vo;

import java.util.List;

import org.apache.ibatis.type.Alias;

/**
 * /list 响应 candidates（API.md §5.2）：由 RUN_STATE 全量行派生的三组查询候选，
 * 与当前筛选条件无关、不被过滤收窄。
 *
 * <p>type-aliases-package 按简单类名全项目注册别名，须用功能前缀避免与其他模块同名 VO 冲突。
 */
@Alias("SnapshotCandidateGroupVO")
public class CandidateGroupVO {

    private List<ClientCandidateVO> clients;
    private List<SourceCandidateVO> sources;
    private List<String> statuses;

    public List<ClientCandidateVO> getClients() {
        return clients;
    }

    public void setClients(List<ClientCandidateVO> clients) {
        this.clients = clients;
    }

    public List<SourceCandidateVO> getSources() {
        return sources;
    }

    public void setSources(List<SourceCandidateVO> sources) {
        this.sources = sources;
    }

    public List<String> getStatuses() {
        return statuses;
    }

    public void setStatuses(List<String> statuses) {
        this.statuses = statuses;
    }
}
