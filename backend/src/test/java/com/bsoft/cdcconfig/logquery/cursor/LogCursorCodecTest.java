package com.bsoft.cdcconfig.logquery.cursor;

import com.fasterxml.jackson.databind.ObjectMapper;
import org.junit.jupiter.api.Test;

import javax.crypto.Mac;
import javax.crypto.spec.SecretKeySpec;
import java.math.BigDecimal;
import java.nio.charset.StandardCharsets;
import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.Base64;
import java.util.LinkedHashMap;
import java.util.Map;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.junit.jupiter.api.Assertions.assertTrue;

/**
 * 游标编解码与验签（LQ-API-52 ~ 54）：base64url 无填充、单点分隔、
 * 常量时间验签、版本、logType 与条件指纹一致性、同密钥重启等价。
 */
class LogCursorCodecTest {

    private static final DateTimeFormatter TIME_FORMAT =
            DateTimeFormatter.ofPattern("yyyy-MM-dd HH:mm:ss");
    private static final ObjectMapper OBJECT_MAPPER = new ObjectMapper();
    private static final char[] HEX = "0123456789abcdef".toCharArray();

    private static final String SECRET = "test-cursor-secret";
    private static final String LOG_TYPE = "error";
    private static final String FINGERPRINT = repeat('a', 64);
    private static final LocalDateTime TARGET_TIME = LocalDateTime.parse("2026-08-20 10:00:00", TIME_FORMAT);
    private static final BigDecimal CDC_LOG_ID = new BigDecimal("1234567890123456789");

    // ============ 编解码往返（LQ-API-52） ============

    @Test
    void roundTrip_shouldReturnBoundary() {
        LogCursorCodec codec = new LogCursorCodec(SECRET);
        String cursor = codec.encode(LOG_TYPE, FINGERPRINT, TARGET_TIME, CDC_LOG_ID);

        LogCursorBoundary b = codec.decodeAndVerify(cursor, LOG_TYPE, FINGERPRINT);
        assertEquals(TARGET_TIME, b.getTargetTime());
        assertEquals(CDC_LOG_ID, b.getCdcLogId());
    }

    @Test
    void encode_payload_isBase64urlJsonNoPadding() throws Exception {
        LogCursorCodec codec = new LogCursorCodec(SECRET);
        String cursor = codec.encode(LOG_TYPE, FINGERPRINT, TARGET_TIME, CDC_LOG_ID);

        String payload = cursor.substring(0, cursor.indexOf('.'));
        // base64url：无填充且不含 + /
        assertTrue(!payload.contains("="), "payload must have no padding");
        assertTrue(!payload.contains("+"), "payload must not use standard alphabet");
        assertTrue(!payload.contains("/"), "payload must not use standard alphabet");

        byte[] jsonBytes = Base64.getUrlDecoder().decode(payload);
        Map<?, ?> json = OBJECT_MAPPER.readValue(jsonBytes, Map.class);
        assertEquals(1, json.get("v"));
        assertEquals(LOG_TYPE, json.get("lt"));
        assertEquals(FINGERPRINT, json.get("fp"));
        assertEquals("2026-08-20 10:00:00", json.get("t"));
        assertEquals("1234567890123456789", json.get("id"));
    }

    @Test
    void encode_hasSingleDotSeparator() {
        LogCursorCodec codec = new LogCursorCodec(SECRET);
        String cursor = codec.encode(LOG_TYPE, FINGERPRINT, TARGET_TIME, CDC_LOG_ID);
        assertEquals(cursor.indexOf('.'), cursor.lastIndexOf('.'));
        assertTrue(cursor.indexOf('.') > 0);
    }

    @Test
    void encode_id_serializedAsPlainDecimal() {
        LogCursorCodec codec = new LogCursorCodec(SECRET);
        BigDecimal big = new BigDecimal("7755033852453421056");
        String cursor = codec.encode(LOG_TYPE, FINGERPRINT, TARGET_TIME, big);
        LogCursorBoundary b = codec.decodeAndVerify(cursor, LOG_TYPE, FINGERPRINT);
        assertEquals(big, b.getCdcLogId());
        assertEquals(0, b.getCdcLogId().scale());
    }

    // ============ 签名与格式（LQ-API-54 -> CURSOR_INVALID） ============

    @Test
    void tamperedSignature_shouldThrowInvalid() {
        LogCursorCodec codec = new LogCursorCodec(SECRET);
        String cursor = codec.encode(LOG_TYPE, FINGERPRINT, TARGET_TIME, CDC_LOG_ID);
        String tampered = cursor.substring(0, cursor.length() - 2) + "00";
        assertThrows(LogCursorInvalidException.class,
                () -> codec.decodeAndVerify(tampered, LOG_TYPE, FINGERPRINT));
    }

    @Test
    void tamperedPayload_shouldThrowInvalid() {
        LogCursorCodec codec = new LogCursorCodec(SECRET);
        String cursor = codec.encode(LOG_TYPE, FINGERPRINT, TARGET_TIME, CDC_LOG_ID);
        int dot = cursor.indexOf('.');
        char first = cursor.charAt(0) == 'A' ? 'B' : 'A';
        String tampered = first + cursor.substring(1);
        assertThrows(LogCursorInvalidException.class,
                () -> codec.decodeAndVerify(tampered, LOG_TYPE, FINGERPRINT));
    }

    @Test
    void wrongVersion_shouldThrowInvalid() throws Exception {
        LogCursorCodec codec = new LogCursorCodec(SECRET);
        Map<String, Object> map = new LinkedHashMap<>();
        map.put("v", 2);
        map.put("lt", LOG_TYPE);
        map.put("fp", FINGERPRINT);
        map.put("t", "2026-08-20 10:00:00");
        map.put("id", "1");
        String cursor = buildCursor(map, SECRET);
        assertThrows(LogCursorInvalidException.class,
                () -> codec.decodeAndVerify(cursor, LOG_TYPE, FINGERPRINT));
    }

    @Test
    void malformedCursor_shouldThrowInvalid() {
        LogCursorCodec codec = new LogCursorCodec(SECRET);
        assertThrows(LogCursorInvalidException.class, () -> codec.decodeAndVerify("abc", LOG_TYPE, FINGERPRINT));
        assertThrows(LogCursorInvalidException.class, () -> codec.decodeAndVerify("abc.", LOG_TYPE, FINGERPRINT));
        assertThrows(LogCursorInvalidException.class, () -> codec.decodeAndVerify(".sig", LOG_TYPE, FINGERPRINT));
        assertThrows(LogCursorInvalidException.class, () -> codec.decodeAndVerify("", LOG_TYPE, FINGERPRINT));
    }

    @Test
    void invalidBase64_shouldThrowInvalid() {
        LogCursorCodec codec = new LogCursorCodec(SECRET);
        assertThrows(LogCursorInvalidException.class,
                () -> codec.decodeAndVerify("!!!.aabbcc", LOG_TYPE, FINGERPRINT));
    }

    @Test
    void invalidBoundaryValues_shouldThrowInvalid() throws Exception {
        LogCursorCodec codec = new LogCursorCodec(SECRET);
        Map<String, Object> map = new LinkedHashMap<>();
        map.put("v", 1);
        map.put("lt", LOG_TYPE);
        map.put("fp", FINGERPRINT);
        map.put("t", "not-a-time");
        map.put("id", "abc");
        String cursor = buildCursor(map, SECRET);
        assertThrows(LogCursorInvalidException.class,
                () -> codec.decodeAndVerify(cursor, LOG_TYPE, FINGERPRINT));
    }

    // ============ 条件一致性（LQ-API-54 -> CURSOR_CONDITION_MISMATCH） ============

    @Test
    void logTypeMismatch_shouldThrowConditionMismatch() {
        LogCursorCodec codec = new LogCursorCodec(SECRET);
        String cursor = codec.encode("error", FINGERPRINT, TARGET_TIME, CDC_LOG_ID);
        assertThrows(LogCursorConditionMismatchException.class,
                () -> codec.decodeAndVerify(cursor, "correct", FINGERPRINT));
    }

    @Test
    void fingerprintMismatch_shouldThrowConditionMismatch() {
        LogCursorCodec codec = new LogCursorCodec(SECRET);
        String cursor = codec.encode(LOG_TYPE, FINGERPRINT, TARGET_TIME, CDC_LOG_ID);
        String other = repeat('b', 64);
        assertThrows(LogCursorConditionMismatchException.class,
                () -> codec.decodeAndVerify(cursor, LOG_TYPE, other));
    }

    // ============ 密钥语义（LQ-API-52） ============

    @Test
    void sameSecret_secondInstance_decodesSameCursor() {
        LogCursorCodec codecA = new LogCursorCodec(SECRET);
        LogCursorCodec codecB = new LogCursorCodec(SECRET);
        String cursor = codecA.encode(LOG_TYPE, FINGERPRINT, TARGET_TIME, CDC_LOG_ID);
        LogCursorBoundary b = codecB.decodeAndVerify(cursor, LOG_TYPE, FINGERPRINT);
        assertEquals(TARGET_TIME, b.getTargetTime());
        assertEquals(CDC_LOG_ID, b.getCdcLogId());
    }

    @Test
    void differentSecret_shouldThrowInvalid() {
        LogCursorCodec codec = new LogCursorCodec("secret-a");
        LogCursorCodec other = new LogCursorCodec("secret-b");
        String cursor = codec.encode(LOG_TYPE, FINGERPRINT, TARGET_TIME, CDC_LOG_ID);
        assertThrows(LogCursorInvalidException.class,
                () -> other.decodeAndVerify(cursor, LOG_TYPE, FINGERPRINT));
    }

    @Test
    void blankSecret_shouldFailFastAtConstruction() {
        assertThrows(IllegalStateException.class, () -> new LogCursorCodec(""));
        assertThrows(IllegalStateException.class, () -> new LogCursorCodec("   "));
        assertThrows(IllegalStateException.class, () -> new LogCursorCodec(null));
    }

    // ============ helpers ============

    private static String buildCursor(Map<String, Object> map, String secret) throws Exception {
        String json = OBJECT_MAPPER.writeValueAsString(map);
        String payload = Base64.getUrlEncoder().withoutPadding()
                .encodeToString(json.getBytes(StandardCharsets.UTF_8));
        return payload + "." + hmacHex(payload, secret);
    }

    private static String hmacHex(String payload, String secret) throws Exception {
        Mac mac = Mac.getInstance("HmacSHA256");
        mac.init(new SecretKeySpec(secret.getBytes(StandardCharsets.UTF_8), "HmacSHA256"));
        return bytesToHex(mac.doFinal(payload.getBytes(StandardCharsets.UTF_8)));
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

    private static String repeat(char c, int n) {
        StringBuilder sb = new StringBuilder(n);
        for (int i = 0; i < n; i++) {
            sb.append(c);
        }
        return sb.toString();
    }
}
