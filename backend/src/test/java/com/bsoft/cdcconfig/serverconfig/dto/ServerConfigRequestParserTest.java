package com.bsoft.cdcconfig.serverconfig.dto;

import com.bsoft.cdcconfig.common.exception.BusinessException;
import com.bsoft.cdcconfig.serverconfig.exception.ServerConfigBadRequestException;
import com.bsoft.cdcconfig.serverconfig.exception.ServerConfigErrorCode;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.junit.jupiter.api.Test;

import java.util.List;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertThrows;

class ServerConfigRequestParserTest {

    private final ObjectMapper objectMapper = new ObjectMapper();

    private ServerConfigSaveRequest parse(String json) {
        try {
            JsonNode root = objectMapper.readTree(json);
            return ServerConfigRequestParser.parse(root);
        } catch (ServerConfigBadRequestException | BusinessException e) {
            throw e;
        } catch (Exception e) {
            throw new AssertionError("无效测试 JSON: " + json, e);
        }
    }

    private void assertParseFailure(String json, int expectedCode) {
        try {
            JsonNode root = objectMapper.readTree(json);
            ServerConfigRequestParser.parse(root);
            throw new AssertionError("应当解析失败: " + json);
        } catch (BusinessException e) {
            assertEquals(expectedCode, e.getCode());
        } catch (ServerConfigBadRequestException e) {
            assertEquals(expectedCode, 400);
        } catch (Exception e) {
            throw new AssertionError("无效测试 JSON: " + json, e);
        }
    }

    // ---- 结构错误 → HTTP 400（ServerConfigBadRequestException） ----

    @Test
    void parse_topLevelNotObject_shouldThrowBadRequest() {
        assertParseFailure("[1,2]", 400);
        assertParseFailure("\"str\"", 400);
        assertParseFailure("123", 400);
    }

    @Test
    void parse_itemsNotArray_shouldThrowBadRequest() {
        assertParseFailure("{\"items\": {}}", 400);
        assertParseFailure("{\"items\": \"abc\"}", 400);
        assertParseFailure("{\"items\": 5}", 400);
        assertParseFailure("{\"items\": true}", 400);
    }

    @Test
    void parse_itemNotObject_shouldThrowBadRequest() {
        assertParseFailure("{\"items\": [null]}", 400);
        assertParseFailure("{\"items\": [\"abc\"]}", 400);
        assertParseFailure("{\"items\": [123]}", 400);
        assertParseFailure("{\"items\": [[\"x\"]]}", 400);
    }

    // ---- 额外字段 → 40227 ----

    @Test
    void parse_topLevelExtraField_shouldRejectWholeBatch() {
        assertParseFailure("{\"items\": [], \"serverId\": \"S1\"}", ServerConfigErrorCode.REQUEST_FIELD_NOT_ALLOWED);
    }

    @Test
    void parse_itemExtraField_shouldRejectWholeBatch() {
        assertParseFailure("{\"items\": [{\"idServerConfig\": \"1\", \"configValue\": \"true\", \"configKey\": \"auto-create-table\"}]}",
                ServerConfigErrorCode.REQUEST_FIELD_NOT_ALLOWED);
        assertParseFailure("{\"items\": [{\"idServerConfig\": \"1\", \"configValue\": \"true\", \"isEditable\": \"1\"}]}",
                ServerConfigErrorCode.REQUEST_FIELD_NOT_ALLOWED);
    }

    // ---- 批量级错误 ----

    @Test
    void parse_itemsMissingOrEmpty_shouldThrowBatchEmpty() {
        assertParseFailure("{}", ServerConfigErrorCode.BATCH_EMPTY);
        assertParseFailure("{\"items\": null}", ServerConfigErrorCode.BATCH_EMPTY);
        assertParseFailure("{\"items\": []}", ServerConfigErrorCode.BATCH_EMPTY);
    }

    @Test
    void parse_tooManyItems_shouldThrowItemCountExceeded() {
        StringBuilder sb = new StringBuilder("{\"items\": [");
        for (int i = 1; i <= 201; i++) {
            if (i > 1) {
                sb.append(',');
            }
            sb.append("{\"idServerConfig\": \"").append(i).append("\", \"configValue\": \"true\"}");
        }
        sb.append("]}");
        assertParseFailure(sb.toString(), ServerConfigErrorCode.ITEM_COUNT_EXCEEDED);
    }

    @Test
    void parse_duplicateId_shouldThrowDuplicateId() {
        assertParseFailure(
                "{\"items\": [{\"idServerConfig\": \"1\", \"configValue\": \"true\"}, {\"idServerConfig\": \"1\", \"configValue\": \"false\"}]}",
                ServerConfigErrorCode.DUPLICATE_ID);
    }

    // ---- 主键错误 → 40223 ----

    @Test
    void parse_invalidId_shouldThrowIdInvalid() {
        assertParseFailure("{\"items\": [{\"configValue\": \"true\"}]}", ServerConfigErrorCode.ID_INVALID);
        assertParseFailure("{\"items\": [{\"idServerConfig\": null, \"configValue\": \"true\"}]}", ServerConfigErrorCode.ID_INVALID);
        assertParseFailure("{\"items\": [{\"idServerConfig\": 123, \"configValue\": \"true\"}]}", ServerConfigErrorCode.ID_INVALID);
        assertParseFailure("{\"items\": [{\"idServerConfig\": true, \"configValue\": \"true\"}]}", ServerConfigErrorCode.ID_INVALID);
        assertParseFailure("{\"items\": [{\"idServerConfig\": \"   \", \"configValue\": \"true\"}]}", ServerConfigErrorCode.ID_INVALID);
        assertParseFailure("{\"items\": [{\"idServerConfig\": \"123456789012345678901234567890123\", \"configValue\": \"true\"}]}",
                ServerConfigErrorCode.ID_INVALID);
    }

    // ---- 值错误 ----

    @Test
    void parse_valueMissingOrNull_shouldThrowValueEmpty() {
        assertParseFailure("{\"items\": [{\"idServerConfig\": \"1\"}]}", ServerConfigErrorCode.VALUE_EMPTY);
        assertParseFailure("{\"items\": [{\"idServerConfig\": \"1\", \"configValue\": null}]}", ServerConfigErrorCode.VALUE_EMPTY);
        assertParseFailure("{\"items\": [{\"idServerConfig\": \"1\", \"configValue\": \"   \"}]}", ServerConfigErrorCode.VALUE_EMPTY);
    }

    @Test
    void parse_valueNonString_shouldThrowValueFormatInvalid() {
        assertParseFailure("{\"items\": [{\"idServerConfig\": \"1\", \"configValue\": 123}]}",
                ServerConfigErrorCode.VALUE_FORMAT_INVALID);
        assertParseFailure("{\"items\": [{\"idServerConfig\": \"1\", \"configValue\": true}]}",
                ServerConfigErrorCode.VALUE_FORMAT_INVALID);
    }

    @Test
    void parse_valueTooLong_shouldThrowValueLengthExceeded() {
        String value = repeat("t", 65);
        assertParseFailure("{\"items\": [{\"idServerConfig\": \"1\", \"configValue\": \"" + value + "\"}]}",
                ServerConfigErrorCode.VALUE_LENGTH_EXCEEDED);
    }

    // ---- 合法请求 ----

    @Test
    void parse_validRequest_shouldReturnItems() {
        ServerConfigSaveRequest request = parse(
                "{\"items\": [{\"idServerConfig\": \"0001\", \"configValue\": \"false\"}, {\"idServerConfig\": \"0002\", \"configValue\": \"doris,mysql\"}]}");
        List<ServerConfigSaveItem> items = request.getItems();
        assertEquals(2, items.size());
        assertEquals("0001", items.get(0).getIdServerConfig());
        assertEquals("false", items.get(0).getConfigValue());
        assertEquals("0002", items.get(1).getIdServerConfig());
        assertEquals("doris,mysql", items.get(1).getConfigValue());
    }

    private static String repeat(String s, int n) {
        StringBuilder sb = new StringBuilder();
        for (int i = 0; i < n; i++) {
            sb.append(s);
        }
        return sb.toString();
    }
}
