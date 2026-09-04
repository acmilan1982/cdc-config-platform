package com.bsoft.cdcconfig.clientconfig.helper;

import com.bsoft.cdcconfig.clientconfig.helper.ClientConfigDataUtil.CsvParseResult;
import org.junit.jupiter.api.Test;

import java.util.Arrays;
import java.util.Collections;
import java.util.HashSet;
import java.util.List;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertTrue;

/** 纯数据工具测试（覆盖 §8.1 第 2 项与部分第 6/7 项的工具层）。 */
class ClientConfigDataUtilTest {

    // ---- parseCsv ----

    @Test
    void parseCsv_nullOrBlank_shouldReturnEmpty() {
        for (String raw : new String[]{null, "", "   ", ",,,", " , , "}) {
            CsvParseResult r = ClientConfigDataUtil.parseCsv(raw);
            assertTrue(r.getDistinctTokens().isEmpty(), "raw=" + raw);
            assertTrue(r.getDuplicateTokens().isEmpty());
            assertEquals(0, r.size());
            assertFalse(r.isHasDuplicate());
        }
    }

    @Test
    void parseCsv_shouldTrimIgnoreEmptyAndDedupePreservingFirstOrder() {
        CsvParseResult r = ClientConfigDataUtil.parseCsv("  ds2 , ds1 ,,  ,ds2 ,ds1 ,ds3 ");
        assertEquals(Arrays.asList("ds2", "ds1", "ds3"), r.getDistinctTokens());
        assertEquals(new HashSet<>(Arrays.asList("ds1", "ds2")), r.getDuplicateTokens());
        assertTrue(r.isHasDuplicate());
        assertEquals(3, r.size());
    }

    @Test
    void parseCsv_singleToken_shouldNotMarkDuplicate() {
        CsvParseResult r = ClientConfigDataUtil.parseCsv(" lone ");
        assertEquals(Collections.singletonList("lone"), r.getDistinctTokens());
        assertTrue(r.getDuplicateTokens().isEmpty());
        assertFalse(r.isHasDuplicate());
    }

    // ---- serializeCsv ----

    @Test
    void serializeCsv_shouldJoinWithNoSpaceComma() {
        assertEquals("a,b,c", ClientConfigDataUtil.serializeCsv(Arrays.asList("a", "b", "c")));
        assertEquals("solo", ClientConfigDataUtil.serializeCsv(Collections.singletonList("solo")));
        assertEquals("", ClientConfigDataUtil.serializeCsv(Collections.emptyList()));
        assertEquals("", ClientConfigDataUtil.serializeCsv(null));
    }

    // ---- normalizeDataSourceIds ----

    @Test
    void normalizeDataSourceIds_shouldTrimDropEmptyAndDedupePreservingFirstOrder() {
        assertEquals(Arrays.asList("d2", "d1"),
                ClientConfigDataUtil.normalizeDataSourceIds(
                        Arrays.asList(" d2 ", null, "d1", "", "  ", " d1 ")));
        assertEquals(Collections.emptyList(), ClientConfigDataUtil.normalizeDataSourceIds(null));
    }

    // ---- utf8Length ----

    @Test
    void utf8Length_shouldCountUtf8Bytes() {
        assertEquals(0, ClientConfigDataUtil.utf8Length(null));
        assertEquals(4, ClientConfigDataUtil.utf8Length("abcd"));
        assertEquals(6, ClientConfigDataUtil.utf8Length("中文"));
        assertEquals(4, ClientConfigDataUtil.utf8Length("😀")); // 1 个 emoji = 4 字节
    }

    // ---- escapeLike ----

    @Test
    void escapeLike_shouldEscapeBackslashPercentAndUnderscore() {
        assertEquals("", ClientConfigDataUtil.escapeLike(""));
        assertEquals("abc", ClientConfigDataUtil.escapeLike("abc"));
        // 输入含一个反斜杠、一个 %、一个 _；反斜杠先转义为 \\，再转义 %/_。
        assertEquals("a\\%b\\_c\\\\d", ClientConfigDataUtil.escapeLike("a%b_c\\d"));
    }

    // ---- findPossibleCommaDataSourceIds ----

    @Test
    void findPossibleCommaDataSourceIds_nullOrEmpty_shouldReturnEmpty() {
        assertTrue(ClientConfigDataUtil.findPossibleCommaDataSourceIds(
                null, new HashSet<>(Collections.singletonList("A,1"))).isEmpty());
        assertTrue(ClientConfigDataUtil.findPossibleCommaDataSourceIds(
                "ds1", Collections.emptySet()).isEmpty());
        assertTrue(ClientConfigDataUtil.findPossibleCommaDataSourceIds(
                "ds1", null).isEmpty());
    }

    @Test
    void findPossibleCommaDataSourceIds_shouldMatchOnlyContiguousCsvBoundaryTokens() {
        HashSet<String> commaIds = new HashSet<>(Arrays.asList("A,1", "B,2"));
        // 完整处于 CSV 边界（整串或前/后为英文逗号）
        assertEquals(Collections.singletonList("A,1"),
                ClientConfigDataUtil.findPossibleCommaDataSourceIds("A,1", commaIds));
        assertEquals(Collections.singletonList("A,1"),
                ClientConfigDataUtil.findPossibleCommaDataSourceIds("pre,A,1", commaIds));
        assertEquals(Collections.singletonList("B,2"),
                ClientConfigDataUtil.findPossibleCommaDataSourceIds("B,2,post", commaIds));
        // 位于普通字符内部 → 非 CSV 边界 → 不算可能匹配
        assertTrue(ClientConfigDataUtil.findPossibleCommaDataSourceIds("preA,1x", commaIds).isEmpty());
        assertTrue(ClientConfigDataUtil.findPossibleCommaDataSourceIds("ds", commaIds).isEmpty());
    }

    @Test
    void findPossibleCommaDataSourceIds_shouldReturnSortedOrder() {
        HashSet<String> commaIds = new HashSet<>(Arrays.asList("Z,9", "A,1", "M,5"));
        List<String> matched = ClientConfigDataUtil.findPossibleCommaDataSourceIds(
                "Z,9;M,5;A,1", commaIds);
        assertTrue(matched.isEmpty(), "分号分隔不是 CSV 边界");
        matched = ClientConfigDataUtil.findPossibleCommaDataSourceIds(
                "Z,9,M,5,A,1", commaIds);
        assertEquals(Arrays.asList("A,1", "M,5", "Z,9"), matched, "应按数据源 ID 升序去重");
    }
}
