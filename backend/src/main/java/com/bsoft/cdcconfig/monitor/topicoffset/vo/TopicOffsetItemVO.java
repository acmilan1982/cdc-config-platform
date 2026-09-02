package com.bsoft.cdcconfig.monitor.topicoffset.vo;

import com.fasterxml.jackson.annotation.JsonInclude;

/**
 * 断点行映射结果 VO（API.md §4.1 records[]）。
 * Kafka 三列第一版恒为 JSON 显式 null；不可解析行的 parsed/mapping 恒为 JSON 显式 null。
 * 全局 Jackson 为 non_null，仅本 VO 相关字段使用字段级 @JsonInclude(ALWAYS) 显式输出，
 * 不改变全局序列化配置（DESIGN §5.10 / API.md §3.1）。
 */
public class TopicOffsetItemVO {

    private String serverId;
    private String rawTopic;
    private String nextOffset;
    private String updatedAt;

    @JsonInclude(JsonInclude.Include.ALWAYS)
    private String kafkaEndOffset;

    @JsonInclude(JsonInclude.Include.ALWAYS)
    private String pendingCount;

    @JsonInclude(JsonInclude.Include.ALWAYS)
    private String consumeLag;

    private boolean parseable;

    @JsonInclude(JsonInclude.Include.ALWAYS)
    private TopicNameMapVO parsed;

    @JsonInclude(JsonInclude.Include.ALWAYS)
    private TopicRowMappingVO mapping;

    public String getServerId() {
        return serverId;
    }

    public void setServerId(String serverId) {
        this.serverId = serverId;
    }

    public String getRawTopic() {
        return rawTopic;
    }

    public void setRawTopic(String rawTopic) {
        this.rawTopic = rawTopic;
    }

    public String getNextOffset() {
        return nextOffset;
    }

    public void setNextOffset(String nextOffset) {
        this.nextOffset = nextOffset;
    }

    public String getUpdatedAt() {
        return updatedAt;
    }

    public void setUpdatedAt(String updatedAt) {
        this.updatedAt = updatedAt;
    }

    public String getKafkaEndOffset() {
        return kafkaEndOffset;
    }

    public void setKafkaEndOffset(String kafkaEndOffset) {
        this.kafkaEndOffset = kafkaEndOffset;
    }

    public String getPendingCount() {
        return pendingCount;
    }

    public void setPendingCount(String pendingCount) {
        this.pendingCount = pendingCount;
    }

    public String getConsumeLag() {
        return consumeLag;
    }

    public void setConsumeLag(String consumeLag) {
        this.consumeLag = consumeLag;
    }

    public boolean isParseable() {
        return parseable;
    }

    public void setParseable(boolean parseable) {
        this.parseable = parseable;
    }

    public TopicNameMapVO getParsed() {
        return parsed;
    }

    public void setParsed(TopicNameMapVO parsed) {
        this.parsed = parsed;
    }

    public TopicRowMappingVO getMapping() {
        return mapping;
    }

    public void setMapping(TopicRowMappingVO mapping) {
        this.mapping = mapping;
    }
}
