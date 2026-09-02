package com.bsoft.cdcconfig.monitor.topicoffset.domain;

/**
 * Topic 严格五段解析结果（DESIGN §5.3）。
 * parseable=true 时携带恰好拆分出的五段（不保证各段非空，按原值保留）；
 * parseable=false 时仅保留原始 Topic，绝不猜测任何段。
 */
public class TopicParts {

    private final boolean parseable;
    private final String rawTopic;
    private final String clientId;
    private final String sourceId;
    private final String schema;
    private final String table;
    private final String targetId;

    private TopicParts(boolean parseable, String rawTopic, String clientId, String sourceId,
                       String schema, String table, String targetId) {
        this.parseable = parseable;
        this.rawTopic = rawTopic;
        this.clientId = clientId;
        this.sourceId = sourceId;
        this.schema = schema;
        this.table = table;
        this.targetId = targetId;
    }

    public static TopicParts parseable(String rawTopic, String clientId, String sourceId,
                                       String schema, String table, String targetId) {
        return new TopicParts(true, rawTopic, clientId, sourceId, schema, table, targetId);
    }

    public static TopicParts unparseable(String rawTopic) {
        return new TopicParts(false, rawTopic, null, null, null, null, null);
    }

    public boolean isParseable() {
        return parseable;
    }

    public String getRawTopic() {
        return rawTopic;
    }

    public String getClientId() {
        return clientId;
    }

    public String getSourceId() {
        return sourceId;
    }

    public String getSchema() {
        return schema;
    }

    public String getTable() {
        return table;
    }

    public String getTargetId() {
        return targetId;
    }
}
