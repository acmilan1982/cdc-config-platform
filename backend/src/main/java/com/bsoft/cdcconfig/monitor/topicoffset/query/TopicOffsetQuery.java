package com.bsoft.cdcconfig.monitor.topicoffset.query;

import java.util.List;

/**
 * /offsets 查询参数载体（API.md §4.1）。
 * clientId/sourceId/targetId 为可重复查询参数；pageNum 保留原始字符串以便校验非整数（40001）。
 */
public class TopicOffsetQuery {

    private List<String> clientId;
    private List<String> sourceId;
    private List<String> targetId;
    private String tableName;
    private String pageNum;

    public List<String> getClientId() {
        return clientId;
    }

    public void setClientId(List<String> clientId) {
        this.clientId = clientId;
    }

    public List<String> getSourceId() {
        return sourceId;
    }

    public void setSourceId(List<String> sourceId) {
        this.sourceId = sourceId;
    }

    public List<String> getTargetId() {
        return targetId;
    }

    public void setTargetId(List<String> targetId) {
        this.targetId = targetId;
    }

    public String getTableName() {
        return tableName;
    }

    public void setTableName(String tableName) {
        this.tableName = tableName;
    }

    public String getPageNum() {
        return pageNum;
    }

    public void setPageNum(String pageNum) {
        this.pageNum = pageNum;
    }
}
