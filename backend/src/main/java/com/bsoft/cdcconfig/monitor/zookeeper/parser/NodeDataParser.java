package com.bsoft.cdcconfig.monitor.zookeeper.parser;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Component;

@Component
public class NodeDataParser {

    private static final Logger log = LoggerFactory.getLogger(NodeDataParser.class);
    private static final ObjectMapper MAPPER = new ObjectMapper();

    public JsonNode parseJson(String data) {
        if (data == null || data.trim().isEmpty()) {
            return null;
        }
        try {
            return MAPPER.readTree(data);
        } catch (Exception e) {
            log.warn("Failed to parse JSON data", e);
            return null;
        }
    }

    public String getTextField(JsonNode node, String fieldName) {
        if (node == null || !node.has(fieldName) || node.get(fieldName).isNull()) {
            return null;
        }
        return node.get(fieldName).asText();
    }
}
