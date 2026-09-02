package com.bsoft.cdcconfig.monitor.topicoffset.vo;

/**
 * 可解析 Topic 的五段对象（API.md §4.1 parsed）。对应第 1/2/3/4/5 段。
 */
public class TopicNameMapVO {

    private String clientId;
    private String sourceId;
    private String schema;
    private String table;
    private String targetId;

    public TopicNameMapVO() {
    }

    public TopicNameMapVO(String clientId, String sourceId, String schema, String table, String targetId) {
        this.clientId = clientId;
        this.sourceId = sourceId;
        this.schema = schema;
        this.table = table;
        this.targetId = targetId;
    }

    public String getClientId() {
        return clientId;
    }

    public void setClientId(String clientId) {
        this.clientId = clientId;
    }

    public String getSourceId() {
        return sourceId;
    }

    public void setSourceId(String sourceId) {
        this.sourceId = sourceId;
    }

    public String getSchema() {
        return schema;
    }

    public void setSchema(String schema) {
        this.schema = schema;
    }

    public String getTable() {
        return table;
    }

    public void setTable(String table) {
        this.table = table;
    }

    public String getTargetId() {
        return targetId;
    }

    public void setTargetId(String targetId) {
        this.targetId = targetId;
    }
}
