package com.bsoft.cdcconfig.subscription.helper;

import java.util.ArrayList;
import java.util.Collections;
import java.util.List;

/**
 * 统一 null-safe CSV 解析与查询匹配契约（DESIGN §4.9 / DATABASE §4.1 权威定义）。
 *
 * <p>DATA_TO_SOURCE_ID / DATA_SOURCE_TABLE / DATA_FROM_SOURCE_ID 及查询候选 ID 的 CSV 处理
 * 必须统一走本类，不得各自 split/trim（DESIGN §4.9）。</p>
 *
 * <ul>
 *   <li>splitTrimDropEmpty(null / 空 / 仅空白) 返回空集合，禁止直接对 null 调 {@code split(",")}；
 *   <li>按英文逗号拆分、trim、丢弃空 token，大小写与顺序保持；
 *   <li>普通候选（不含逗号）用 matchCsvNormal：完整 token 字面精确匹配（Java equals，大小写敏感，
 *       % _ \ . 正则字符按字面，S01 不匹配 S012）；
 *   <li>含逗号候选用 matchCsvComma：queryAtomic 是 storedAtomic 的连续子序列（历史兼容可能匹配）；
 *   <li>多源库异常判定 isMultiSourceAnomaly：归一化后非空 token 数 &gt;= 2。
 * </ul>
 */
public final class SubscriptionCsvHelper {

    private SubscriptionCsvHelper() {
    }

    /** 拆分、trim、丢弃空 token；null / 空白 → 空集合。 */
    public static List<String> splitTrimDropEmpty(String csv) {
        if (csv == null || csv.trim().isEmpty()) {
            return Collections.emptyList();
        }
        List<String> result = new ArrayList<>();
        for (String token : csv.split(",", -1)) {
            String trimmed = token.trim();
            if (!trimmed.isEmpty()) {
                result.add(trimmed);
            }
        }
        return result;
    }

    /** 是否含英文逗号（含逗号候选进入历史兼容可能匹配语义）。 */
    public static boolean containsComma(String value) {
        return value != null && value.indexOf(',') >= 0;
    }

    /** 统一入口：按候选是否含逗号分派三类语义。 */
    public static boolean matchCsv(String storedCsv, String queryId) {
        if (queryId == null) {
            return false;
        }
        if (containsComma(queryId)) {
            return matchCsvComma(storedCsv, queryId);
        }
        return matchCsvNormal(storedCsv, queryId);
    }

    /** 普通候选完整 token 字面精确匹配。 */
    public static boolean matchCsvNormal(String storedCsv, String queryId) {
        if (queryId == null || queryId.trim().isEmpty()) {
            return false;
        }
        for (String segment : splitTrimDropEmpty(storedCsv)) {
            if (segment.equals(queryId)) {
                return true;
            }
        }
        return false;
    }

    /** 含逗号候选历史兼容可能匹配：queryAtomic 是 storedAtomic 的连续子序列。 */
    public static boolean matchCsvComma(String storedCsv, String queryId) {
        List<String> storedAtomic = splitTrimDropEmpty(storedCsv);
        List<String> queryAtomic = splitTrimDropEmpty(queryId);
        if (queryAtomic.isEmpty()) {
            return false;
        }
        return containsSubsequence(storedAtomic, queryAtomic);
    }

    /** query 是否为 stored 的连续子序列（历史兼容可能匹配核心）。 */
    public static boolean containsSubsequence(List<String> stored, List<String> query) {
        if (query.isEmpty()) {
            return true;
        }
        if (stored.isEmpty() || query.size() > stored.size()) {
            return false;
        }
        for (int i = 0; i + query.size() <= stored.size(); i++) {
            boolean matched = true;
            for (int j = 0; j < query.size(); j++) {
                if (!query.get(j).equals(stored.get(i + j))) {
                    matched = false;
                    break;
                }
            }
            if (matched) {
                return true;
            }
        }
        return false;
    }

    /** 多源库异常判定：归一化后非空 token 数 &gt;= 2。 */
    public static boolean isMultiSourceAnomaly(String dataFromSourceId) {
        return splitTrimDropEmpty(dataFromSourceId).size() >= 2;
    }
}
