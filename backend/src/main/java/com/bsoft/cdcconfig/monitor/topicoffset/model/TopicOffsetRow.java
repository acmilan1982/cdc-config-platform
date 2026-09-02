package com.bsoft.cdcconfig.monitor.topicoffset.model;

/**
 * CDC_TOPIC_OFFSET 只读行。NEXT_OFFSET/UPDATED_AT 已在 SQL 层 TO_CHAR 字符串化，
 * Java/JSON 全程字符串透传（DESIGN §5.8）。
 */
public class TopicOffsetRow {

    private String serverId;
    private String kafkaTopic;
    private String nextOffsetStr;
    private String updatedAtStr;

    public String getServerId() {
        return serverId;
    }

    public void setServerId(String serverId) {
        this.serverId = serverId;
    }

    public String getKafkaTopic() {
        return kafkaTopic;
    }

    public void setKafkaTopic(String kafkaTopic) {
        this.kafkaTopic = kafkaTopic;
    }

    public String getNextOffsetStr() {
        return nextOffsetStr;
    }

    public void setNextOffsetStr(String nextOffsetStr) {
        this.nextOffsetStr = nextOffsetStr;
    }

    public String getUpdatedAtStr() {
        return updatedAtStr;
    }

    public void setUpdatedAtStr(String updatedAtStr) {
        this.updatedAtStr = updatedAtStr;
    }
}
