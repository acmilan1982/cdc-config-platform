package com.bsoft.cdcconfig.logquery.cursor;

import com.fasterxml.jackson.databind.ObjectMapper;

import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.ArrayList;
import java.util.Collections;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.TreeSet;

/**
 * 条件指纹：对规范化条件 JSON（固定字段顺序、UTF-8、时间秒级、数组去重排序、
 * 空数组 []、空文本 null）计算 SHA-256 小写十六进制（LQ-API-53、LQ-DESIGN-62）。
 * 生成与校验必须使用同一规则。
 */
public final class LogQueryFingerprint {

    private static final DateTimeFormatter TIME_FORMAT =
            DateTimeFormatter.ofPattern("yyyy-MM-dd HH:mm:ss");
    private static final ObjectMapper OBJECT_MAPPER = new ObjectMapper();
    private static final char[] HEX = "0123456789abcdef".toCharArray();

    private LogQueryFingerprint() {
    }

    public static String compute(String logType, LocalDateTime startTime, LocalDateTime endExclusive,
                                 List<String> sourceDataSourceIds, String sourceTableName,
                                 List<String> targetDataSourceIds, String targetTableName) {
        Map<String, Object> map = new LinkedHashMap<>();
        map.put("logType", logType);
        map.put("startTime", startTime.format(TIME_FORMAT));
        map.put("endExclusive", endExclusive.format(TIME_FORMAT));
        map.put("sourceDataSourceIds", normalizeArray(sourceDataSourceIds));
        map.put("sourceTableName", blankToNull(sourceTableName));
        map.put("targetDataSourceIds", normalizeArray(targetDataSourceIds));
        map.put("targetTableName", blankToNull(targetTableName));

        String json;
        try {
            json = OBJECT_MAPPER.writeValueAsString(map);
        } catch (Exception e) {
            throw new IllegalStateException("Fingerprint JSON serialization failed", e);
        }
        byte[] digest;
        try {
            digest = MessageDigest.getInstance("SHA-256")
                    .digest(json.getBytes(StandardCharsets.UTF_8));
        } catch (Exception e) {
            throw new IllegalStateException("SHA-256 digest failed", e);
        }
        return bytesToHex(digest);
    }

    /**
     * 数组去重后按字典序升序排序；空数组统一为 []。
     */
    private static List<String> normalizeArray(List<String> ids) {
        if (ids == null || ids.isEmpty()) {
            return Collections.emptyList();
        }
        TreeSet<String> sorted = new TreeSet<>();
        for (String id : ids) {
            if (id != null) {
                sorted.add(id);
            }
        }
        return new ArrayList<>(sorted);
    }

    /**
     * 空文本统一为 null。
     */
    private static String blankToNull(String s) {
        if (s == null || s.trim().isEmpty()) {
            return null;
        }
        return s;
    }

    private static String bytesToHex(byte[] bytes) {
        char[] hex = new char[bytes.length * 2];
        for (int i = 0; i < bytes.length; i++) {
            int v = bytes[i] & 0xFF;
            hex[i * 2] = HEX[v >>> 4];
            hex[i * 2 + 1] = HEX[v & 0x0F];
        }
        return new String(hex);
    }
}
