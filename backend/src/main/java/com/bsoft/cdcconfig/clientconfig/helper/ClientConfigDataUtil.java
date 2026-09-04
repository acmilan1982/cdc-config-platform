package com.bsoft.cdcconfig.clientconfig.helper;

import java.nio.charset.StandardCharsets;
import java.util.ArrayList;
import java.util.Collections;
import java.util.LinkedHashSet;
import java.util.List;
import java.util.Set;
import java.util.TreeSet;

/**
 * 探针端管理 Feature 的纯数据工具：
 * <ul>
 *   <li>统一 CSV 协议解析（单英文逗号拆分、逐项 Trim、忽略空项、去重保序）与无空格单逗号序列化；</li>
 *   <li>UTF-8 BYTE 计数（StandardCharsets.UTF_8）；</li>
 *   <li>SQL LIKE 字面量转义（\ % _ 均按普通字符，ESCAPE '\'）；</li>
 *   <li>行级含逗号歧义（COMMA_PROTOCOL_AMBIGUOUS）的可能匹配判定。</li>
 * </ul>
 */
public final class ClientConfigDataUtil {

    private ClientConfigDataUtil() {
    }

    /** 普通 CSV 解析结果：distinctTokens 为 Trim 去空去重保序后的 token 列表。 */
    public static final class CsvParseResult {
        private final List<String> distinctTokens;
        private final Set<String> duplicateTokens;

        public CsvParseResult(List<String> distinctTokens, Set<String> duplicateTokens) {
            this.distinctTokens = distinctTokens;
            this.duplicateTokens = duplicateTokens;
        }

        public List<String> getDistinctTokens() {
            return distinctTokens;
        }

        /** 在行内出现超过一次的 Trim 后 token（原配置含重复 token → DUPLICATE_IN_ROW）。 */
        public Set<String> getDuplicateTokens() {
            return duplicateTokens;
        }

        public boolean isHasDuplicate() {
            return !duplicateTokens.isEmpty();
        }

        public int size() {
            return distinctTokens.size();
        }
    }

    /**
     * 普通 CSV 解析：按英文逗号拆分，逐项 Trim，忽略空项，按 Trim 后精确值去重（保留首次出现顺序）。
     * raw 为 null/空串/仅空白时返回空结果。
     */
    public static CsvParseResult parseCsv(String raw) {
        if (raw == null) {
            return new CsvParseResult(Collections.emptyList(), Collections.emptySet());
        }
        List<String> trimmed = new ArrayList<>();
        for (String segment : raw.split(",", -1)) {
            String t = segment.trim();
            if (!t.isEmpty()) {
                trimmed.add(t);
            }
        }
        Set<String> duplicates = new LinkedHashSet<>();
        for (int i = 0; i < trimmed.size(); i++) {
            String token = trimmed.get(i);
            if (trimmed.indexOf(token) != trimmed.lastIndexOf(token)) {
                duplicates.add(token);
            }
        }
        List<String> distinct = new ArrayList<>(new LinkedHashSet<>(trimmed));
        return new CsvParseResult(distinct, duplicates);
    }

    /** 无空格单英文逗号序列化；调用方需保证 tokens 已 Trim/去重保序。 */
    public static String serializeCsv(List<String> tokens) {
        if (tokens == null || tokens.isEmpty()) {
            return "";
        }
        StringBuilder sb = new StringBuilder();
        for (int i = 0; i < tokens.size(); i++) {
            if (i > 0) {
                sb.append(',');
            }
            sb.append(tokens.get(i));
        }
        return sb.toString();
    }

    /** UTF-8 字节数（Oracle VARCHAR2 ... BYTE 语义）。 */
    public static int utf8Length(String s) {
        if (s == null) {
            return 0;
        }
        return s.getBytes(StandardCharsets.UTF_8).length;
    }

    /**
     * SQL LIKE 字面量转义：先转义反斜杠，再转义 % 与 _；返回可拼入 "%{escaped}%" 的片段。
     */
    public static String escapeLike(String keyword) {
        return keyword.replace("\\", "\\\\")
                .replace("%", "\\%")
                .replace("_", "\\_");
    }

    /**
     * 行级含逗号歧义判定：raw 原始串中是否存在某个“已知含英文逗号的数据源 ID”以完整连续文本落在
     * CSV 边界上（前/后为字符串边界或英文逗号）。存在任一匹配即视为普通 CSV 解析无法无损还原。
     *
     * @return 全部可能匹配的已知含逗号数据源 ID，升序确定顺序；无匹配返回空列表。
     */
    public static List<String> findPossibleCommaDataSourceIds(String raw, Set<String> commaContainingIds) {
        if (raw == null || raw.isEmpty() || commaContainingIds == null || commaContainingIds.isEmpty()) {
            return Collections.emptyList();
        }
        TreeSet<String> matched = new TreeSet<>();
        for (String commaId : commaContainingIds) {
            if (commaId != null && isContiguousAtCsvBoundary(raw, commaId)) {
                matched.add(commaId);
            }
        }
        return new ArrayList<>(matched);
    }

    private static boolean isContiguousAtCsvBoundary(String raw, String commaId) {
        if (commaId.length() > raw.length()) {
            return false;
        }
        int idx = raw.indexOf(commaId);
        while (idx >= 0) {
            boolean beforeOk = idx == 0 || raw.charAt(idx - 1) == ',';
            int after = idx + commaId.length();
            boolean afterOk = after == raw.length() || raw.charAt(after) == ',';
            if (beforeOk && afterOk) {
                return true;
            }
            idx = raw.indexOf(commaId, idx + 1);
        }
        return false;
    }

    /** 规范化新增/编辑提交的数据源 ID 数组：Trim、去空、去重保序。 */
    public static List<String> normalizeDataSourceIds(List<String> dataSourceIds) {
        List<String> out = new ArrayList<>();
        if (dataSourceIds == null) {
            return out;
        }
        LinkedHashSet<String> seen = new LinkedHashSet<>();
        for (String item : dataSourceIds) {
            if (item == null) {
                continue;
            }
            String t = item.trim();
            if (t.isEmpty()) {
                continue;
            }
            if (seen.add(t)) {
                out.add(t);
            }
        }
        return out;
    }
}
