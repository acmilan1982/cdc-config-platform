package com.bsoft.cdcconfig.monitor.datasourcerunstate.vo;

import com.fasterxml.jackson.annotation.JsonInclude;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.bsoft.cdcconfig.monitor.datasourcerunstate.constant.DataSourceRunStateConstants;
import org.junit.jupiter.api.Test;

import java.util.Arrays;
import java.util.Collections;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertTrue;

/**
 * JSON 契约单测（API.md §2.5/§6/§6.2）：在全局 non_null 语义下，
 * snapshotLastSeenAt/snapshotCompletedAt/clientRef.desc/sourceRef.org/sourceRef.category
 * 必须显式输出 JSON null；行键字段名为 sourceId（非内部 dataSourceId）；无任何分页字段。
 */
class SnapshotStatusItemVoJsonTest {

    private final ObjectMapper mapper = new ObjectMapper()
            .setSerializationInclusion(JsonInclude.Include.NON_NULL);

    private static ClientRefVO notFoundClientRef() {
        ClientRefVO ref = new ClientRefVO();
        ref.setState(DataSourceRunStateConstants.MAPPING_STATE_NOT_FOUND);
        ref.setDesc(null);
        return ref;
    }

    private static SourceRefVO notFoundSourceRef() {
        SourceRefVO ref = new SourceRefVO();
        ref.setState(DataSourceRunStateConstants.MAPPING_STATE_NOT_FOUND);
        ref.setOrg(null);
        ref.setCategory(null);
        ref.setSourceRole(false);
        return ref;
    }

    private static SnapshotStatusItemVO item() {
        SnapshotStatusItemVO item = new SnapshotStatusItemVO();
        item.setClientId("orphan-client-01");
        item.setClientRef(notFoundClientRef());
        item.setSourceId("ds-disabled-01");
        item.setSourceRef(notFoundSourceRef());
        item.setSnapshotStatus("SNAPSHOT_COMPLETED");
        item.setStatusCategory("COMPLETED");
        item.setSnapshotLastSeenAt(null);
        item.setSnapshotCompletedAt(null);
        item.setUpdatedAt("2026-08-18 08:02:00");
        return item;
    }

    @Test
    void nullableTimeFieldsShouldAppearAsExplicitJsonNull() throws Exception {
        JsonNode node = mapper.readTree(mapper.writeValueAsString(item()));

        assertTrue(node.has("snapshotLastSeenAt"), "snapshotLastSeenAt must be present");
        assertTrue(node.get("snapshotLastSeenAt").isNull());
        assertTrue(node.has("snapshotCompletedAt"), "snapshotCompletedAt must be present");
        assertTrue(node.get("snapshotCompletedAt").isNull());

        assertTrue(node.has("clientRef"));
        assertTrue(node.get("clientRef").has("desc"), "clientRef.desc must be present");
        assertTrue(node.get("clientRef").get("desc").isNull());

        assertTrue(node.get("sourceRef").has("org"), "sourceRef.org must be present");
        assertTrue(node.get("sourceRef").get("org").isNull());
        assertTrue(node.get("sourceRef").has("category"), "sourceRef.category must be present");
        assertTrue(node.get("sourceRef").get("category").isNull());
        assertFalse(node.get("sourceRef").get("sourceRole").asBoolean());

        // NOT_FOUND 映射状态
        assertEquals(DataSourceRunStateConstants.MAPPING_STATE_NOT_FOUND, node.get("clientRef").get("state").asText());
        assertEquals(DataSourceRunStateConstants.MAPPING_STATE_NOT_FOUND, node.get("sourceRef").get("state").asText());
    }

    @Test
    void rowKeyFieldsShouldBeNamedClientIdAndSourceIdNotDataSourceId() throws Exception {
        JsonNode node = mapper.readTree(mapper.writeValueAsString(item()));
        assertEquals("orphan-client-01", node.get("clientId").asText());
        assertEquals("ds-disabled-01", node.get("sourceId").asText());
        assertEquals("SNAPSHOT_COMPLETED", node.get("snapshotStatus").asText());
        assertEquals("COMPLETED", node.get("statusCategory").asText());
        assertFalse(node.has("dataSourceId"), "internal dataSourceId must not leak into JSON");
    }

    @Test
    void listVoShouldCarryOnlyRecordsAndCandidatesWithNoPaginationFields() throws Exception {
        CandidateGroupVO group = new CandidateGroupVO();
        ClientCandidateVO client = new ClientCandidateVO();
        client.setId("hosp-012");
        client.setDesc("HIS 探针示例");
        client.setActive(true);
        group.setClients(Collections.singletonList(client));
        group.setSources(Collections.emptyList());
        group.setStatuses(Arrays.asList("RUNNING", "COMPLETED"));

        SnapshotStatusListVO list = new SnapshotStatusListVO();
        list.setRecords(Collections.singletonList(item()));
        list.setCandidates(group);

        JsonNode data = mapper.readTree(mapper.writeValueAsString(list));
        assertTrue(data.has("records"));
        assertTrue(data.has("candidates"));
        assertEquals(1, data.get("records").size());
        assertEquals("hosp-012", data.get("candidates").get("clients").get(0).get("id").asText());
        assertEquals("RUNNING", data.get("candidates").get("statuses").get(0).asText());

        // 无分页契约：响应不得出现任何分页字段（API §6.2）
        assertFalse(data.has("pageNum"));
        assertFalse(data.has("pageSize"));
        assertFalse(data.has("pages"));
        assertFalse(data.has("total"));
        assertFalse(data.has("hasMore"));
    }
}
