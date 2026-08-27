package com.bsoft.cdcconfig.serverconfig.dto;

import com.bsoft.cdcconfig.serverconfig.exception.ServerConfigBadRequestException;
import com.bsoft.cdcconfig.serverconfig.exception.ServerConfigErrorCode;
import com.fasterxml.jackson.databind.JsonNode;

import java.util.ArrayList;
import java.util.HashSet;
import java.util.Iterator;
import java.util.List;
import java.util.Set;

/**
 * 批量保存请求体的严格结构解析（API.md SC-API-050/051/055~057、SC-DB-113）。
 * Controller 接收 JsonNode，由本解析器校验结构、允许字段与精确类型后再构造 DTO。
 * 结构错误（非对象顶层、非数组 items、非对象 item）抛出 ServerConfigBadRequestException
 * 映射 HTTP 400；额外字段、批量级/字段级错误按专用业务错误码抛出。
 */
public final class ServerConfigRequestParser {

    public static final int MAX_BATCH_SIZE = 200;

    private static final String ITEMS_FIELD = "items";
    private static final String ID_FIELD = "idServerConfig";
    private static final String VALUE_FIELD = "configValue";

    private ServerConfigRequestParser() {
    }

    public static ServerConfigSaveRequest parse(JsonNode root) {
        if (root == null || !root.isObject()) {
            throw new ServerConfigBadRequestException();
        }

        rejectUnknownFields(root, ITEMS_FIELD);

        JsonNode itemsNode = root.get(ITEMS_FIELD);
        if (itemsNode == null || itemsNode.isNull() || itemsNode.isArray() && itemsNode.size() == 0) {
            throw ServerConfigErrorCode.batchEmpty();
        }
        if (!itemsNode.isArray()) {
            throw new ServerConfigBadRequestException();
        }
        if (itemsNode.size() > MAX_BATCH_SIZE) {
            throw ServerConfigErrorCode.itemCountExceeded();
        }

        List<ServerConfigSaveItem> items = new ArrayList<>(itemsNode.size());
        Set<String> seenIds = new HashSet<>();
        for (JsonNode itemNode : itemsNode) {
            if (itemNode == null || !itemNode.isObject()) {
                throw new ServerConfigBadRequestException();
            }

            rejectUnknownFields(itemNode, ID_FIELD, VALUE_FIELD);

            JsonNode idNode = itemNode.get(ID_FIELD);
            if (idNode == null || idNode.isNull() || !idNode.isTextual()) {
                throw ServerConfigErrorCode.idInvalid();
            }
            String id = idNode.asText();
            if (id.trim().isEmpty() || id.length() > 32) {
                throw ServerConfigErrorCode.idInvalid();
            }
            if (!seenIds.add(id)) {
                throw ServerConfigErrorCode.duplicateId();
            }

            String value = resolveConfigValue(itemNode);

            items.add(new ServerConfigSaveItem(id, value));
        }

        return new ServerConfigSaveRequest(items);
    }

    /**
     * configValue 校验顺序（SC-API-052 ①②③④）：缺失/JSON null → 40224；
     * 非字符串类型 → 40226；trim 后非空 → 40224；原样提交长度 ≤ 64 → 40225。
     * Key 专门规则与规范化后检查在 Service 内执行（⑤⑥）。
     */
    private static String resolveConfigValue(JsonNode itemNode) {
        JsonNode valueNode = itemNode.get(VALUE_FIELD);
        if (valueNode == null || valueNode.isNull()) {
            throw ServerConfigErrorCode.valueEmpty();
        }
        if (!valueNode.isTextual()) {
            throw ServerConfigErrorCode.valueFormatInvalid();
        }
        String value = valueNode.asText();
        if (value.trim().isEmpty()) {
            throw ServerConfigErrorCode.valueEmpty();
        }
        if (value.length() > 64) {
            throw ServerConfigErrorCode.valueLengthExceeded();
        }
        return value;
    }

    private static void rejectUnknownFields(JsonNode object, String... allowed) {
        Iterator<String> fieldNames = object.fieldNames();
        outer:
        while (fieldNames.hasNext()) {
            String field = fieldNames.next();
            for (String a : allowed) {
                if (a.equals(field)) {
                    continue outer;
                }
            }
            throw ServerConfigErrorCode.requestFieldNotAllowed();
        }
    }
}
