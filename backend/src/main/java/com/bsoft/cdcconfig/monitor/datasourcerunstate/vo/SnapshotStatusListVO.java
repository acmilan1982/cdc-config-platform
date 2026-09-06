package com.bsoft.cdcconfig.monitor.datasourcerunstate.vo;

import java.util.List;

/**
 * /list 响应 data（API.md §5）：过滤+固定排序后的记录与 RUN_STATE 全量派生的候选，同请求同快照。
 */
public class SnapshotStatusListVO {

    private List<SnapshotStatusItemVO> records;
    private CandidateGroupVO candidates;

    public List<SnapshotStatusItemVO> getRecords() {
        return records;
    }

    public void setRecords(List<SnapshotStatusItemVO> records) {
        this.records = records;
    }

    public CandidateGroupVO getCandidates() {
        return candidates;
    }

    public void setCandidates(CandidateGroupVO candidates) {
        this.candidates = candidates;
    }
}
