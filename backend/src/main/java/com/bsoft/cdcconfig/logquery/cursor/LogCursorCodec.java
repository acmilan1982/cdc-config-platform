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
import java.time.format.ResolverStyle;
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
            DateTimeFormatter.ofPattern("uuuu-MM-dd HH:mm:ss").withResolverStyle(ResolverStyle.STRICT);
    private static final ObjectMapper OBJECT_MAPPER = new ObjectMapper();
    private static final char[] HEX = "0123456789abcdef".toCharArray();
    private static final BigDecimal MAX_NUMBER_19_0 = new BigDecimal("9999999999999999999");

    private final byte[] secretBytes;

    public LogCursorCodec(String secret) {
        if (secret == null || secret.trim().isEmpty()) {
            throw new IllegalStateException("LogQuery cursor secret is not configured");
        }
        this.secretBytes = secret.getBytes(StandardCharsets.UTF_8);
    }

    /**
     * 生成游标。边界为 TARGET_TIME（秒级）与 CDC_LOG_ID（十进制字符串）。
     * cdcLogId 必须是 scale=0 且在 NUMBER(19,0) 范围内的非负整数（R1-02），
     * 拒绝 null、科学计数/小数（非零 scale）与超范围值，防止生成违反契约的游标。
     */
    public String encode(String logType, String fingerprint,
                         LocalDateTime targetTime, BigDecimal cdcLogId) {
        if (cdcLogId == null) {
            throw new IllegalArgumentException("cdcLogId must not be null");
        }
        if (cdcLogId.scale() != 0) {
            throw new IllegalArgumentException("cdcLogId must have scale 0");
        }
        if (cdcLogId.signum() < 0 || cdcLogId.compareTo(MAX_NUMBER_19_0) > 0) {
            throw new IllegalArgumentException("cdcLogId out of NUMBER(19,0) range");
        }
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
     * 校验顺序（LQ-DESIGN-63 / LQ-API-54，R1-03）：
     * 1) 按最后一个 '.' 拆解；2) base64url 解码确认编码合法；3) 重算 HMAC 并以常量时间比较签名
     * （HMAC 覆盖 payload 的原始 base64url 文本）；4) 验签通过后才解析 JSON；5) 校验 v==1；
     * 6) 校验 logType 一致；7) 校验条件指纹一致；8) 校验并构造排序边界。
     * 格式/base64/签名/版本/边界失败抛 LogCursorInvalidException；
     * logType/指纹不一致抛 LogCursorConditionMismatchException。
     */
    public LogCursorBoundary decodeAndVerify(String cursor, String logType, String fingerprint) {
        // 1) 按最后一个 '.' 拆解 payload.signature
        int idx = cursor.lastIndexOf('.');
        if (idx <= 0 || idx == cursor.length() - 1) {
            throw new LogCursorInvalidException("cursor format invalid");
        }
        String payload = cursor.substring(0, idx);
        String providedSignature = cursor.substring(idx + 1);

        // 2) base64url 解码，确认编码合法（不解析 JSON）
        byte[] jsonBytes;
        try {
            jsonBytes = Base64.getUrlDecoder().decode(payload);
        } catch (IllegalArgumentException e) {
            throw new LogCursorInvalidException("cursor payload base64 invalid", e);
        }

        // 3) 重算 HMAC（覆盖 payload 原始 base64url 文本）并常量时间比较签名
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

        // 4) 验签通过后才解析不可信 JSON
        JsonNode node;
        try {
            node = OBJECT_MAPPER.readTree(jsonBytes);
        } catch (Exception e) {
            throw new LogCursorInvalidException("cursor payload json invalid", e);
        }

        // 5) 版本
        if (node.path("v").asInt() != 1) {
            throw new LogCursorInvalidException("cursor version unsupported");
        }
        // 6) logType
        if (!logType.equals(node.path("lt").asText(null))) {
            throw new LogCursorConditionMismatchException("cursor logType mismatch");
        }
        // 7) 条件指纹
        if (!fingerprint.equals(node.path("fp").asText(null))) {
            throw new LogCursorConditionMismatchException("cursor condition mismatch");
        }

        // 8) 校验并构造排序边界：t 严格自然日期；id 必须为 JSON 字符串且严格 1~19 位十进制、
        // scale=0、NUMBER(19,0) 范围（JSON number 节点一律拒绝，避免 asText 歧义）
        LocalDateTime targetTime;
        BigDecimal cdcLogId;
        try {
            targetTime = LocalDateTime.parse(node.path("t").asText(), TIME_FORMAT);
            JsonNode idNode = node.get("id");
            if (idNode == null || !idNode.isTextual()) {
                throw new IllegalArgumentException("cursor cdcLogId must be a JSON string");
            }
            cdcLogId = requireCdcLogId(idNode.asText());
        } catch (Exception e) {
            throw new LogCursorInvalidException("cursor boundary invalid", e);
        }
        return new LogCursorBoundary(targetTime, cdcLogId);
    }

    /**
     * 游标内部专用 CDC_LOG_ID 校验（R1-02）：严格匹配 1~19 位十进制字符串，
     * scale=0 且在 NUMBER(19,0) 范围内。科学计数、负数、小数、空文本、超长、
     * JSON number（path("id").asText() 对数字节点会丢失非字符串原义）等一律拒绝。
     * 不依赖 Service 实现类。
     */
    private static BigDecimal requireCdcLogId(String idText) {
        if (idText == null || !idText.matches("[0-9]{1,19}")) {
            throw new IllegalArgumentException("cursor cdcLogId invalid");
        }
        BigDecimal id = new BigDecimal(idText);
        if (id.compareTo(MAX_NUMBER_19_0) > 0) {
            throw new IllegalArgumentException("cursor cdcLogId out of NUMBER(19,0) range");
        }
        return id;
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
