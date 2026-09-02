package com.bsoft.cdcconfig.monitor.topicoffset.vo;

import com.fasterxml.jackson.annotation.JsonInclude;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.bsoft.cdcconfig.monitor.topicoffset.constant.TopicOffsetConstants;
import org.junit.jupiter.api.Test;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertNotNull;
import static org.junit.jupiter.api.Assertions.assertTrue;

/**
 * JSON null 显式序列化单测（API.md §3.1 / DESIGN §5.10）。
 * 在全局 non_null 语义下，Kafka 三列与失败行 parsed/mapping 必须显式输出 JSON null，
 * 而可选子字段（如 client 引用无 org/desc）保持被省略。
 */
class TopicOffsetItemVoJsonTest {

    private final ObjectMapper mapper = new ObjectMapper()
            .setSerializationInclusion(JsonInclude.Include.NON_NULL);

    private static TopicOffsetItemVO parseableItem() {
        TopicOffsetItemVO item = new TopicOffsetItemVO();
        item.setServerId("Server001");
        item.setRawTopic("hosp-012.112-src.SPT_HIS_2023.OPT_FEE.company-trg");
        item.setNextOffset("9007199254740993");
        item.setUpdatedAt("2026-08-17 17:49:01");
        item.setParseable(true);
        item.setParsed(new TopicNameMapVO("hosp-012", "112-src", "SPT_HIS_2023", "OPT_FEE", "company-trg"));
        TopicRowMappingVO mapping = new TopicRowMappingVO();
        mapping.setClient(new TopicEndpointMappingVO(
                TopicOffsetConstants.MAPPING_STATE_NOT_FOUND, "hosp-012", null, null));
        mapping.setSource(new TopicEndpointMappingVO(
                TopicOffsetConstants.MAPPING_STATE_ACTIVE, "112-src", "源库112", null));
        mapping.setTarget(new TopicEndpointMappingVO(
                TopicOffsetConstants.MAPPING_STATE_ACTIVE, "company-trg", "Doris目标库", null));
        item.setMapping(mapping);
        return item;
    }

    private static TopicOffsetItemVO unparseableItem() {
        TopicOffsetItemVO item = new TopicOffsetItemVO();
        item.setServerId("Server001");
        item.setRawTopic("offline.malformed.topic");
        item.setNextOffset("42");
        item.setUpdatedAt("2026-08-17 18:00:00");
        item.setParseable(false);
        return item;
    }

    @Test
    void kafkaThreeColumnsShouldAlwaysAppearAsJsonNull() throws Exception {
        JsonNode node = mapper.readTree(mapper.writeValueAsString(parseableItem()));
        assertTrue(node.has("kafkaEndOffset"), "kafkaEndOffset must be present");
        assertTrue(node.get("kafkaEndOffset").isNull());
        assertTrue(node.has("pendingCount"), "pendingCount must be present");
        assertTrue(node.get("pendingCount").isNull());
        assertTrue(node.has("consumeLag"), "consumeLag must be present");
        assertTrue(node.get("consumeLag").isNull());
        assertEquals("9007199254740993", node.get("nextOffset").asText());
    }

    @Test
    void parseableRowShouldExposeParsedAndMappingObjects() throws Exception {
        JsonNode node = mapper.readTree(mapper.writeValueAsString(parseableItem()));
        assertTrue(node.get("parseable").asBoolean());
        assertNotNull(node.get("parsed"));
        assertFalse(node.get("parsed").isNull());
        assertEquals("OPT_FEE", node.get("parsed").get("table").asText());
        assertNotNull(node.get("mapping"));
        assertEquals(TopicOffsetConstants.MAPPING_STATE_NOT_FOUND,
                node.get("mapping").get("client").get("state").asText());
        assertEquals("hosp-012", node.get("mapping").get("client").get("id").asText());
        // client 引用不携带 org/desc（null 时被全局 non_null 省略）
        assertFalse(node.get("mapping").get("client").has("org"));
        assertFalse(node.get("mapping").get("client").has("desc"));
        // source 引用携带 org
        assertTrue(node.get("mapping").get("source").has("org"));
        assertEquals("源库112", node.get("mapping").get("source").get("org").asText());
    }

    @Test
    void unparseableRowShouldExposeParsedAndMappingAsExplicitJsonNull() throws Exception {
        JsonNode node = mapper.readTree(mapper.writeValueAsString(unparseableItem()));
        assertFalse(node.get("parseable").asBoolean());
        assertTrue(node.has("parsed"), "parsed must be present on unparseable row");
        assertTrue(node.get("parsed").isNull());
        assertTrue(node.has("mapping"), "mapping must be present on unparseable row");
        assertTrue(node.get("mapping").isNull());
        assertTrue(node.has("kafkaEndOffset"));
        assertTrue(node.get("kafkaEndOffset").isNull());
        assertEquals("offline.malformed.topic", node.get("rawTopic").asText());
    }

    @Test
    void zeroOrFakeNumbersMustNeverBeSubstitutedForKafkaColumns() throws Exception {
        String json = mapper.writeValueAsString(parseableItem());
        assertFalse(json.contains("\"kafkaEndOffset\":0"));
        assertFalse(json.contains("\"pendingCount\":0"));
        assertFalse(json.contains("\"consumeLag\":0"));
        assertFalse(json.contains("\"consumeLag\":\"null\""));
    }
}
