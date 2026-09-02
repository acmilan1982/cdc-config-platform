package com.bsoft.cdcconfig.monitor.topicoffset.vo;

import java.util.List;

/**
 * /candidates 响应 data（API.md §4.2）：三组候选，全部配置含停用，前端固定“全部”为第一项。
 */
public class CandidateGroupVO {

    private List<ClientCandidateVO> clients;
    private List<DataSourceCandidateVO> sources;
    private List<DataSourceCandidateVO> targets;

    public List<ClientCandidateVO> getClients() {
        return clients;
    }

    public void setClients(List<ClientCandidateVO> clients) {
        this.clients = clients;
    }

    public List<DataSourceCandidateVO> getSources() {
        return sources;
    }

    public void setSources(List<DataSourceCandidateVO> sources) {
        this.sources = sources;
    }

    public List<DataSourceCandidateVO> getTargets() {
        return targets;
    }

    public void setTargets(List<DataSourceCandidateVO> targets) {
        this.targets = targets;
    }
}
