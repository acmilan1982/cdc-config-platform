package com.bsoft.cdcconfig.logquery.cursor;

import com.fasterxml.jackson.databind.ObjectMapper;
import org.junit.jupiter.api.Test;

import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.Arrays;
import java.util.Collections;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertNotEquals;

/**
 * 条件指纹规范化（LQ-API-53）：固定字段顺序、数组去重排序、空数组 []、
 * 空文本 null、时间秒级、UTF-8 稳定、确定性输出。
 */
class LogQueryFingerprintTest {

    private static final DateTimeFormatter TIME_FORMAT =
            DateTimeFormatter.ofPattern("yyyy-MM-dd HH:mm:ss");
    private static final ObjectMapper OBJECT_MAPPER = new ObjectMapper();
    private static final char[] HEX = "0123456789abcdef".toCharArray();

    private static final String LOG_TYPE = "error";
    private static final LocalDateTime START = LocalDateTime.parse("2026-08-14 00:00:00", TIME_FORMAT);
    private static final LocalDateTime END_EXCLUSIVE = LocalDateTime.parse("2026-08-21 00:00:00", TIME_FORMAT);

    // ============ 确定性 ============

    @Test
    void sameInputs_sameHash() {
        List<String> ids = Arrays.asList("DS_SRC_001", "DS_SRC_002");
        String h1 = LogQueryFingerprint.compute(LOG_TYPE, START, END_EXCLUSIVE, ids, "T_ORDER",
                ids, "ODS_ORDER");
        String h2 = LogQueryFingerprint.compute(LOG_TYPE, START, END_EXCLUSIVE, ids, "T_ORDER",
                ids, "ODS_ORDER");
        assertEquals(h1, h2);
        assertEquals(64, h1.length());
    }

    @Test
    void differentLogType_changesHash() {
        String a = LogQueryFingerprint.compute("error", START, END_EXCLUSIVE, null, null, null, null);
        String b = LogQueryFingerprint.compute("correct", START, END_EXCLUSIVE, null, null, null, null);
        assertNotEquals(a, b);
    }

    @Test
    void differentTime_changesHash() {
        LocalDateTime other = END_EXCLUSIVE.minusSeconds(1);
        String a = LogQueryFingerprint.compute(LOG_TYPE, START, END_EXCLUSIVE, null, null, null, null);
        String b = LogQueryFingerprint.compute(LOG_TYPE, START, other, null, null, null, null);
        assertNotEquals(a, b);
    }

    @Test
    void differentSourceTable_changesHash() {
        String a = LogQueryFingerprint.compute(LOG_TYPE, START, END_EXCLUSIVE, null, "A", null, null);
        String b = LogQueryFingerprint.compute(LOG_TYPE, START, END_EXCLUSIVE, null, "B", null, null);
        assertNotEquals(a, b);
    }

    // ============ 数组规范化 ============

    @Test
    void arrayOrderIndependent_sameHash() {
        List<String> ab = Arrays.asList("DS_A", "DS_B");
        List<String> ba = Arrays.asList("DS_B", "DS_A");
        String h1 = LogQueryFingerprint.compute(LOG_TYPE, START, END_EXCLUSIVE, ab, null, ab, null);
        String h2 = LogQueryFingerprint.compute(LOG_TYPE, START, END_EXCLUSIVE, ba, null, ba, null);
        assertEquals(h1, h2);
    }

    @Test
    void arrayDedupe_sameHash() {
        List<String> dup = Arrays.asList("DS_A", "DS_A", "DS_B");
        List<String> uniq = Arrays.asList("DS_B", "DS_A");
        String h1 = LogQueryFingerprint.compute(LOG_TYPE, START, END_EXCLUSIVE, dup, null, dup, null);
        String h2 = LogQueryFingerprint.compute(LOG_TYPE, START, END_EXCLUSIVE, uniq, null, uniq, null);
        assertEquals(h1, h2);
    }

    @Test
    void nullAndEmptyArray_sameHash() {
        String h1 = LogQueryFingerprint.compute(LOG_TYPE, START, END_EXCLUSIVE, null, null, null, null);
        String h2 = LogQueryFingerprint.compute(LOG_TYPE, START, END_EXCLUSIVE,
                Collections.emptyList(), null, Collections.emptyList(), null);
        assertEquals(h1, h2);
    }

    // ============ 文本规范化 ============

    @Test
    void nullAndBlankTable_sameHash() {
        String h1 = LogQueryFingerprint.compute(LOG_TYPE, START, END_EXCLUSIVE, null, null, null, null);
        String h2 = LogQueryFingerprint.compute(LOG_TYPE, START, END_EXCLUSIVE, null, "   ", null, "  ");
        assertEquals(h1, h2);
    }

    @Test
    void chineseTableName_utf8Stable() {
        List<String> ids = Collections.singletonList("DS_中");
        String h1 = LogQueryFingerprint.compute(LOG_TYPE, START, END_EXCLUSIVE, ids, "订单表", ids, null);
        String h2 = LogQueryFingerprint.compute(LOG_TYPE, START, END_EXCLUSIVE, ids, "订单表", ids, null);
        assertEquals(h1, h2);
    }

    // ============ 固定字段顺序（与设计约定 JSON 完全一致） ============

    @Test
    void fieldOrder_matchesDesignJson() throws Exception {
        List<String> ids = Arrays.asList("DS_SRC_001", "DS_SRC_002");
        String actual = LogQueryFingerprint.compute(LOG_TYPE, START, END_EXCLUSIVE,
                ids, "T_ORDER", Collections.emptyList(), "  ");

        // 设计约定的字段顺序：logType, startTime, endExclusive,
        // sourceDataSourceIds, sourceTableName, targetDataSourceIds, targetTableName
        Map<String, Object> expected = new LinkedHashMap<>();
        expected.put("logType", LOG_TYPE);
        expected.put("startTime", "2026-08-14 00:00:00");
        expected.put("endExclusive", "2026-08-21 00:00:00");
        expected.put("sourceDataSourceIds", Arrays.asList("DS_SRC_001", "DS_SRC_002"));
        expected.put("sourceTableName", "T_ORDER");
        expected.put("targetDataSourceIds", Collections.emptyList());
        expected.put("targetTableName", null);

        String expectedJson = OBJECT_MAPPER.writeValueAsString(expected);
        assertEquals(sha256Hex(expectedJson), actual);
    }

    // ============ helpers ============

    private static String sha256Hex(String text) throws Exception {
        byte[] digest = MessageDigest.getInstance("SHA-256")
                .digest(text.getBytes(StandardCharsets.UTF_8));
        char[] hex = new char[digest.length * 2];
        for (int i = 0; i < digest.length; i++) {
            int v = digest[i] & 0xFF;
            hex[i * 2] = HEX[v >>> 4];
            hex[i * 2 + 1] = HEX[v & 0x0F];
        }
        return new String(hex);
    }
}
