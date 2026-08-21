package com.bsoft.cdcconfig.logquery.cursor;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;

import javax.crypto.Mac;
import javax.crypto.spec.SecretKeySpec;
import java.math.BigDecimal;
import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.Base64;
import java.util.LinkedHashMap;
import java.util.Map;

/**
 * 不透明签名游标编解码与验签（LQ-API-52 ~ 54、LQ-DESIGN-60 ~ 63）。
 * 载荷：UTF-8 JSON 的 base64url（无填充），签名：HMAC-SHA256 覆盖载荷原始 base64url 文本，十六进制。
 * 游标 = payload + "." + signature。签名比较使用常量时间比较。
 */
public class LogCursorCodec {

    private static final DateTimeFormatter TIME_FORMAT =
            DateTimeFormatter.ofPattern("yyyy-MM-dd HH:mm:ss");
    private static final ObjectMapper OBJECT_MAPPER = new ObjectMapper();
    private static final char[] HEX = "0123456789abcdef".toCharArray();

    private final byte[] secretBytes;

    public LogCursorCodec(String secret) {
        if (secret == null || secret.trim().isEmpty()) {
            throw new IllegalStateException("LogQuery cursor secret is not configured");
        }
        this.secretBytes = secret.getBytes(StandardCharsets.UTF_8);
    }

    /**
     * 生成游标。边界为 TARGET_TIME（秒级）与 CDC_LOG_ID（十进制字符串）。
     */
    public String encode(String logType, String fingerprint,
                         LocalDateTime targetTime, BigDecimal cdcLogId) {
        Map<String, Object> payloadMap = new LinkedHashMap<>();
        payloadMap.put("v", 1);
        payloadMap.put("lt", logType);
        payloadMap.put("fp", fingerprint);
        payloadMap.put("t", targetTime.format(TIME_FORMAT));
        payloadMap.put("id", cdcLogId.toPlainString());
        String json = writeJson(payloadMap);
        String payload = Base64.getUrlEncoder().withoutPadding()
                .encodeToString(json.getBytes(StandardCharsets.UTF_8));
        return payload + "." + hmacHex(payload);
    }

    /**
     * 解码并验签，返回 keyset 边界。
     * 校验顺序（LQ-API-54）：按最后一个 '.' 拆解 → base64url 解码 → 常量时间验签
     * → 版本 → logType 一致 → 条件指纹一致。
     * 格式/签名/版本失败抛 LogCursorInvalidException；logType/指纹不一致抛 LogCursorConditionMismatchException。
     */
    public LogCursorBoundary decodeAndVerify(String cursor, String logType, String fingerprint) {
        int idx = cursor.lastIndexOf('.');
        if (idx <= 0 || idx == cursor.length() - 1) {
            throw new LogCursorInvalidException("cursor format invalid");
        }
        String payload = cursor.substring(0, idx);
        String providedSignature = cursor.substring(idx + 1);

        byte[] expectedMac = hmac(payload);
        byte[] providedMac;
        try {
            providedMac = hexToBytes(providedSignature);
        } catch (IllegalArgumentException e) {
            throw new LogCursorInvalidException("cursor signature invalid", e);
        }
        if (!MessageDigest.isEqual(expectedMac, providedMac)) {
            throw new LogCursorInvalidException("cursor signature mismatch");
        }

        JsonNode node = decodePayload(payload);
        if (node.path("v").asInt() != 1) {
            throw new LogCursorInvalidException("cursor version unsupported");
        }
        if (!logType.equals(node.path("lt").asText(null))) {
            throw new LogCursorConditionMismatchException("cursor logType mismatch");
        }
        if (!fingerprint.equals(node.path("fp").asText(null))) {
            throw new LogCursorConditionMismatchException("cursor condition mismatch");
        }

        LocalDateTime targetTime;
        BigDecimal cdcLogId;
        try {
            targetTime = LocalDateTime.parse(node.path("t").asText(), TIME_FORMAT);
            cdcLogId = new BigDecimal(node.path("id").asText());
        } catch (Exception e) {
            throw new LogCursorInvalidException("cursor boundary invalid", e);
        }
        return new LogCursorBoundary(targetTime, cdcLogId);
    }

    private JsonNode decodePayload(String payload) {
        byte[] jsonBytes;
        try {
            jsonBytes = Base64.getUrlDecoder().decode(payload);
        } catch (IllegalArgumentException e) {
            throw new LogCursorInvalidException("cursor payload base64 invalid", e);
        }
        try {
            return OBJECT_MAPPER.readTree(jsonBytes);
        } catch (Exception e) {
            throw new LogCursorInvalidException("cursor payload json invalid", e);
        }
    }

    private byte[] hmac(String payload) {
        try {
            Mac mac = Mac.getInstance("HmacSHA256");
            mac.init(new SecretKeySpec(secretBytes, "HmacSHA256"));
            return mac.doFinal(payload.getBytes(StandardCharsets.UTF_8));
        } catch (Exception e) {
            throw new IllegalStateException("HMAC-SHA256 failed", e);
        }
    }

    private String hmacHex(String payload) {
        return bytesToHex(hmac(payload));
    }

    private static String writeJson(Map<String, Object> map) {
        try {
            return OBJECT_MAPPER.writeValueAsString(map);
        } catch (Exception e) {
            throw new IllegalStateException("Cursor JSON serialization failed", e);
        }
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

    private static byte[] hexToBytes(String hex) {
        if (hex.length() % 2 != 0) {
            throw new IllegalArgumentException("odd length hex");
        }
        byte[] out = new byte[hex.length() / 2];
        for (int i = 0; i < out.length; i++) {
            int hi = Character.digit(hex.charAt(i * 2), 16);
            int lo = Character.digit(hex.charAt(i * 2 + 1), 16);
            if (hi < 0 || lo < 0) {
                throw new IllegalArgumentException("invalid hex");
            }
            out[i] = (byte) ((hi << 4) | lo);
        }
        return out;
    }
}
