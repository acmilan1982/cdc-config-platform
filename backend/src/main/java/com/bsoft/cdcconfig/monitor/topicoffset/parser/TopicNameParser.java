package com.bsoft.cdcconfig.monitor.topicoffset.parser;

import com.bsoft.cdcconfig.monitor.topicoffset.domain.TopicParts;

/**
 * Topic 纯函数解析器：按英文句点拆分，恰好 5 段即成功；不做任何 trim/改写/重组。
 * 使用 split("\\.", -1) 保留尾部空段，保证前导点、尾点、连续点只要拆分结果为 5 段仍算成功。
 */
public final class TopicNameParser {

    private static final int EXPECTED_PARTS = 5;

    private TopicNameParser() {
    }

    public static TopicParts parse(String rawTopic) {
        if (rawTopic == null) {
            return TopicParts.unparseable(null);
        }
        String[] parts = rawTopic.split("\\.", -1);
        if (parts.length == EXPECTED_PARTS) {
            return TopicParts.parseable(rawTopic, parts[0], parts[1], parts[2], parts[3], parts[4]);
        }
        return TopicParts.unparseable(rawTopic);
    }
}
