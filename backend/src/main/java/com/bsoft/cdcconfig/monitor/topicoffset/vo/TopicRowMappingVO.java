package com.bsoft.cdcconfig.monitor.topicoffset.vo;

/**
 * 可解析行的三端映射（API.md §4.1 mapping）：client/source/target。
 */
public class TopicRowMappingVO {

    private TopicEndpointMappingVO client;
    private TopicEndpointMappingVO source;
    private TopicEndpointMappingVO target;

    public TopicEndpointMappingVO getClient() {
        return client;
    }

    public void setClient(TopicEndpointMappingVO client) {
        this.client = client;
    }

    public TopicEndpointMappingVO getSource() {
        return source;
    }

    public void setSource(TopicEndpointMappingVO source) {
        this.source = source;
    }

    public TopicEndpointMappingVO getTarget() {
        return target;
    }

    public void setTarget(TopicEndpointMappingVO target) {
        this.target = target;
    }
}
