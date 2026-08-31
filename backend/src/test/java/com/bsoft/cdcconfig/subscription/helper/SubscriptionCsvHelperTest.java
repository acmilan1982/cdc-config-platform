package com.bsoft.cdcconfig.subscription.helper;

import org.junit.jupiter.api.Test;

import java.util.Arrays;
import java.util.Collections;
import java.util.List;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertTrue;

/**
 * null-safe CSV 契约（DESIGN §4.9）：9 个可空边界示例、三类匹配语义、S01/S012 精确匹配、
 * %/_/句点按字面、多源库异常判定。
 */
class SubscriptionCsvHelperTest {

    // ---- splitTrimDropEmpty 9 个可空边界示例（DESIGN §4.9 权威表） ----

    @Test
    void splitNull_shouldReturnEmpty() {
        assertEquals(Collections.emptyList(), SubscriptionCsvHelper.splitTrimDropEmpty(null));
    }

    @Test
    void splitEmptyString_shouldReturnEmpty() {
        assertEquals(Collections.emptyList(), SubscriptionCsvHelper.splitTrimDropEmpty(""));
    }

    @Test
    void splitWhitespaceOnly_shouldReturnEmpty() {
        assertEquals(Collections.emptyList(), SubscriptionCsvHelper.splitTrimDropEmpty("   "));
    }

    @Test
    void splitSingleToken_shouldReturnOne() {
        assertEquals(Collections.singletonList("S01"), SubscriptionCsvHelper.splitTrimDropEmpty("S01"));
    }

    @Test
    void splitLeadingComma_shouldDropEmpty() {
        assertEquals(Collections.singletonList("S01"), SubscriptionCsvHelper.splitTrimDropEmpty(",S01"));
    }

    @Test
    void splitTrailingEmptyTokens_shouldDropEmpty() {
        assertEquals(Collections.singletonList("S01"), SubscriptionCsvHelper.splitTrimDropEmpty("S01,,"));
    }

    @Test
    void splitCommaWhitespace_shouldDropEmpty() {
        assertEquals(Collections.singletonList("S01"), SubscriptionCsvHelper.splitTrimDropEmpty("S01, , "));
    }

    @Test
    void splitTrimmedTwoTokens_shouldReturnTwo() {
        assertEquals(Arrays.asList("S01", "S02"), SubscriptionCsvHelper.splitTrimDropEmpty(" S01 , S02 "));
    }

    @Test
    void splitTwoTokens_shouldReturnTwo() {
        assertEquals(Arrays.asList("S01", "S02"), SubscriptionCsvHelper.splitTrimDropEmpty("S01,S02"));
    }

    @Test
    void splitShouldPreserveCaseAndOrder() {
        assertEquals(Arrays.asList("s01", "S02", "s03"),
                SubscriptionCsvHelper.splitTrimDropEmpty("s01, S02 ,s03"));
    }

    // ---- 普通候选完整 token 字面精确匹配 ----

    @Test
    void normalMatch_exactToken() {
        assertTrue(SubscriptionCsvHelper.matchCsvNormal("S01,T01", "T01"));
        assertTrue(SubscriptionCsvHelper.matchCsvNormal("S01", "S01"));
    }

    @Test
    void normalMatch_s01ShouldNotMatchS012() {
        assertFalse(SubscriptionCsvHelper.matchCsvNormal("S012", "S01"));
        assertFalse(SubscriptionCsvHelper.matchCsvNormal("S01", "S012"));
        assertFalse(SubscriptionCsvHelper.matchCsvNormal("S01,S012", "S01S012"));
    }

    @Test
    void normalMatch_isCaseSensitive() {
        assertFalse(SubscriptionCsvHelper.matchCsvNormal("S01", "s01"));
    }

    @Test
    void normalMatch_percentUnderscoreBackslashDotAreLiteral() {
        assertTrue(SubscriptionCsvHelper.matchCsvNormal("A%B", "A%B"));
        assertTrue(SubscriptionCsvHelper.matchCsvNormal("A_B", "A_B"));
        assertTrue(SubscriptionCsvHelper.matchCsvNormal("A\\B", "A\\B"));
        assertTrue(SubscriptionCsvHelper.matchCsvNormal("A.B", "A.B"));
        assertFalse(SubscriptionCsvHelper.matchCsvNormal("AB", "A%B"));
    }

    @Test
    void normalMatch_nullOrBlankStored_shouldNeverMatch() {
        assertFalse(SubscriptionCsvHelper.matchCsvNormal(null, "S01"));
        assertFalse(SubscriptionCsvHelper.matchCsvNormal("", "S01"));
        assertFalse(SubscriptionCsvHelper.matchCsvNormal("   ", "S01"));
    }

    @Test
    void normalMatch_nullOrBlankQuery_shouldNotMatch() {
        assertFalse(SubscriptionCsvHelper.matchCsvNormal("S01", null));
        assertFalse(SubscriptionCsvHelper.matchCsvNormal("S01", ""));
        assertFalse(SubscriptionCsvHelper.matchCsvNormal("S01", "  "));
    }

    @Test
    void normalMatch_dotOnlyId_usesExactRule() {
        assertTrue(SubscriptionCsvHelper.matchCsvNormal("A.B", "A.B"));
        assertFalse(SubscriptionCsvHelper.matchCsvNormal("A.B", "A"));
    }

    // ---- 含逗号候选历史兼容可能匹配 ----

    @Test
    void commaMatch_exactCommaSegment() {
        assertTrue(SubscriptionCsvHelper.matchCsvComma("A,B", "A,B"));
    }

    @Test
    void commaMatch_contiguousInsideStored() {
        assertTrue(SubscriptionCsvHelper.matchCsvComma("X,A,B,Y", "A,B"));
    }

    @Test
    void commaMatch_notContiguous_shouldNotMatch() {
        assertFalse(SubscriptionCsvHelper.matchCsvComma("A,X,B", "A,B"));
    }

    @Test
    void commaMatch_querySubsequenceOfStored() {
        assertTrue(SubscriptionCsvHelper.matchCsvComma("A,B,C", "B,C"));
        assertTrue(SubscriptionCsvHelper.matchCsvComma("A,B,C", "A,B"));
        assertFalse(SubscriptionCsvHelper.matchCsvComma("A,B,C", "A,C"));
    }

    // ---- matchCsv 统一分派 ----

    @Test
    void matchCsv_dispatchesByComma() {
        assertTrue(SubscriptionCsvHelper.matchCsv("A,B", "A"));
        assertTrue(SubscriptionCsvHelper.matchCsv("A,B", "A,B"));
        assertFalse(SubscriptionCsvHelper.matchCsv("A,X,B", "A,B"));
        assertFalse(SubscriptionCsvHelper.matchCsv(null, "A"));
    }

    // ---- 多源库异常判定 ----

    @Test
    void multiSourceAnomaly_threshold() {
        assertFalse(SubscriptionCsvHelper.isMultiSourceAnomaly(null));
        assertFalse(SubscriptionCsvHelper.isMultiSourceAnomaly(""));
        assertFalse(SubscriptionCsvHelper.isMultiSourceAnomaly("   "));
        assertFalse(SubscriptionCsvHelper.isMultiSourceAnomaly("S01"));
        assertFalse(SubscriptionCsvHelper.isMultiSourceAnomaly(",S01,"));
        assertTrue(SubscriptionCsvHelper.isMultiSourceAnomaly(" S01 , S02 "));
        assertTrue(SubscriptionCsvHelper.isMultiSourceAnomaly("S01,S02"));
    }

    @Test
    void containsSubsequence_contract() {
        assertTrue(SubscriptionCsvHelper.containsSubsequence(
                Arrays.asList("A", "B", "C"), Collections.singletonList("B")));
        assertTrue(SubscriptionCsvHelper.containsSubsequence(
                Arrays.asList("A", "B", "C"), Arrays.asList("A", "B")));
        assertFalse(SubscriptionCsvHelper.containsSubsequence(
                Arrays.asList("A", "B", "C"), Arrays.asList("A", "C")));
        assertFalse(SubscriptionCsvHelper.containsSubsequence(
                Arrays.asList("A"), Arrays.asList("A", "B")));
    }

    @Test
    void containsComma_shouldDetectOnlyComma() {
        assertFalse(SubscriptionCsvHelper.containsComma(null));
        assertFalse(SubscriptionCsvHelper.containsComma("A.B"));
        assertTrue(SubscriptionCsvHelper.containsComma("A,B"));
    }
}
