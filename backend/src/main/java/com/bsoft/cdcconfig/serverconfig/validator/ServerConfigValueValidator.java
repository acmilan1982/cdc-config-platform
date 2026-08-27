package com.bsoft.cdcconfig.serverconfig.validator;

import com.bsoft.cdcconfig.serverconfig.enums.ServerConfigEditableKey;
import com.bsoft.cdcconfig.serverconfig.exception.ServerConfigErrorCode;

import java.util.Arrays;
import java.util.LinkedHashSet;
import java.util.List;
import java.util.Set;

/**
 * 六类已支持 Key 的专门校验与规范化（SC-DESIGN-081~086、SC-API-052）。
 * 与前端 configRules.ts 维护完全一致的规则（SC-EDIT-04）；后端保存时独立重新执行。
 * 校验顺序固定：trim 非空 → 原样提交长度 ≤64 → Key 专门规则 → 规范化后非空且 ≤64。
 */
public final class ServerConfigValueValidator {

    private static final List<String> DB_TYPE_ORDER = Arrays.asList("doris", "oracle", "mysql");
    private static final Set<String> RAW_MESSAGE_STRATEGIES =
            new LinkedHashSet<>(Arrays.asList("NONE", "PLAIN", "COMPRESS"));
    private static final Set<String> TABLE_DELETE_STRATEGIES =
            new LinkedHashSet<>(Arrays.asList("DELETE", "DELETE_FLAG"));

    private ServerConfigValueValidator() {
    }

    /**
     * 对 configValue 执行通用校验 + Key 专门规则校验并返回规范化后的最终保存值。
     * 任一步失败即抛对应业务异常。
     */
    public static String validateAndNormalize(String configKey, String submittedValue) {
        ServerConfigEditableKey key = ServerConfigEditableKey.fromValue(configKey);
        if (key == null) {
            throw ServerConfigErrorCode.configKeyNotSupported();
        }
        if (submittedValue == null || submittedValue.trim().isEmpty()) {
            throw ServerConfigErrorCode.valueEmpty();
        }
        if (submittedValue.length() > 64) {
            throw ServerConfigErrorCode.valueLengthExceeded();
        }
        String canonical = normalizeForKey(key, submittedValue);
        if (canonical == null || canonical.isEmpty() || canonical.length() > 64) {
            throw ServerConfigErrorCode.valueFormatInvalid();
        }
        return canonical;
    }

    private static String normalizeForKey(ServerConfigEditableKey key, String value) {
        switch (key) {
            case AUTO_CREATE_TABLE:
            case AUTO_EXPAND_COLUMN_LENGTH:
                return normalizeBool(value);
            case RAW_MESSAGE_STORAGE_STRATEGY:
                return normalizeEnum(value, RAW_MESSAGE_STRATEGIES);
            case REALTIME_INSERT_BATCH_ENABLED_DATABASE_TYPES:
                return normalizeDbTypes(value);
            case SNAPSHOT_BATCH_SIZE:
                return normalizeInteger(value);
            case TABLE_ROW_DELETE_STRATEGY:
                return normalizeEnum(value, TABLE_DELETE_STRATEGIES);
            default:
                throw ServerConfigErrorCode.configKeyNotSupported();
        }
    }

    private static String normalizeBool(String value) {
        String trimmed = value.trim();
        if ("true".equals(trimmed) || "false".equals(trimmed)) {
            return trimmed;
        }
        throw ServerConfigErrorCode.valueFormatInvalid();
    }

    private static String normalizeEnum(String value, Set<String> allowed) {
        String trimmed = value.trim();
        if (allowed.contains(trimmed)) {
            return trimmed;
        }
        throw ServerConfigErrorCode.valueFormatInvalid();
    }

    private static String normalizeDbTypes(String value) {
        // split 保留尾部空 token，保证 "doris,," 与前端 JS split 语义一致被拒（SC-CFG-DBTYPE-07）
        String[] tokens = value.split(",", -1);
        Set<String> selected = new LinkedHashSet<>();
        for (String token : tokens) {
            String t = token.trim().toLowerCase();
            if (!DB_TYPE_ORDER.contains(t)) {
                throw ServerConfigErrorCode.valueFormatInvalid();
            }
            selected.add(t);
        }
        if (selected.isEmpty()) {
            throw ServerConfigErrorCode.valueFormatInvalid();
        }
        StringBuilder sb = new StringBuilder();
        for (String allowed : DB_TYPE_ORDER) {
            if (selected.contains(allowed)) {
                if (sb.length() > 0) {
                    sb.append(',');
                }
                sb.append(allowed);
            }
        }
        return sb.toString();
    }

    private static String normalizeInteger(String value) {
        String trimmed = value.trim();
        if (!trimmed.matches("[0-9]+")) {
            throw ServerConfigErrorCode.valueFormatInvalid();
        }
        String canonical = trimmed.replaceFirst("^0+(?=\\d)", "");
        if (canonical.isEmpty()) {
            canonical = "0";
        }
        int num;
        try {
            num = Integer.parseInt(canonical);
        } catch (NumberFormatException e) {
            throw ServerConfigErrorCode.valueFormatInvalid();
        }
        if (num < 100 || num > 10000) {
            throw ServerConfigErrorCode.valueFormatInvalid();
        }
        return String.valueOf(num);
    }
}
