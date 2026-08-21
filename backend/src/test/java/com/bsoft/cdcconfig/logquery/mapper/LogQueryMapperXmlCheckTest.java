package com.bsoft.cdcconfig.logquery.mapper;

import org.junit.jupiter.api.BeforeAll;
import org.junit.jupiter.api.Test;

import java.io.IOException;
import java.io.InputStream;
import java.nio.charset.StandardCharsets;
import java.util.regex.Matcher;
import java.util.regex.Pattern;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertTrue;

/**
 * XML Mapper 静态检查（LQ-DESIGN-04 / LQ-API-90~98）：
 * 25 秒超时、绑定参数、禁止 LIKE/COUNT/分页 OFFSET/隐式转换/DDL、大字段隔离、keyset 游标。
 */
class LogQueryMapperXmlCheckTest {

    private static String xml;

    @BeforeAll
    static void loadXml() throws IOException {
        String raw;
        try (InputStream in = LogQueryMapperXmlCheckTest.class.getResourceAsStream("/mapper/logquery/LogQueryMapper.xml")) {
            byte[] bytes = new byte[in.available()];
            int read = in.read(bytes);
            assertEquals(read, bytes.length, "read full xml");
            raw = new String(bytes, StandardCharsets.UTF_8);
        }
        // 去除 XML 注释，避免说明文字（如“不使用 TO_CHAR/CAST”）干扰关键字扫描
        xml = raw.replaceAll("(?s)<!--.*?-->", "");
    }

    @Test
    void hasFourSelects_eachWith25sTimeout() {
        assertEquals(4, countOccurrences(xml, "<select "));
        assertEquals(4, countOccurrences(xml, "timeout=\"25\""));
    }

    @Test
    void noSelectStar() {
        String upper = xml.toUpperCase();
        assertFalse(upper.contains("SELECT *"));
        assertFalse(upper.contains("SELECT  *"));
    }

    @Test
    void noLikeCountOrJoin() {
        String upper = xml.toUpperCase();
        assertFalse(upper.contains(" LIKE "));
        assertFalse(upper.contains("COUNT("));
        assertFalse(upper.contains(" JOIN "));
        assertFalse(upper.contains(" JOIN\n"));
    }

    @Test
    void noToCharOrCastOrImplicitConversion() {
        String upper = xml.toUpperCase();
        assertFalse(upper.contains("TO_CHAR"));
        assertFalse(upper.contains("CAST("));
        assertFalse(upper.contains("TO_NUMBER"));
        assertFalse(upper.contains("TO_DATE"));
        assertFalse(upper.contains("TO_TIMESTAMP"));
    }

    @Test
    void noOffsetPaginationClause() {
        // OFFSET 是业务列名，只允许 `OFFSET,`；禁止 OFFSET n ROWS 分页子句
        String upper = xml.toUpperCase();
        Matcher m = Pattern.compile("OFFSET\\s+\\d+\\s+ROWS").matcher(upper);
        assertFalse(m.find(), "must not use OFFSET pagination clause");
    }

    @Test
    void tableNameOnlyFromClosedEnum() {
        // ${} 只允许 ${tableName}，且出现 3 次（列表/详情/原始消息）
        assertEquals(3, countOccurrences(xml, "${tableName}"));
        assertEquals(3, countOccurrences(xml, "${"));
        assertTrue(xml.contains("FROM CDC_DATA_SOURCE"));
    }

    @Test
    void allValueConditionsUseBindParams() {
        // SQL 关键字在文件中即为大写；实体 &gt;=&lt; 不转大写以免误匹配
        assertTrue(xml.contains("WHERE TARGET_TIME &gt;= #{startTime}"));
        assertTrue(xml.contains("AND TARGET_TIME &lt;  #{endExclusive}"));
        assertTrue(xml.contains("SOURCE_DATA_SOURCE_ID IN"));
        assertTrue(xml.contains("TARGET_DATA_SOURCE_ID IN"));
        assertTrue(xml.contains("SOURCE_TABLE_NAME = #{sourceTableName}"));
        assertTrue(xml.contains("TARGET_TABLE_NAME = #{targetTableName}"));
        assertTrue(xml.contains("CDC_LOG_ID = #{cdcLogId}"));
    }

    @Test
    void largeFieldsIsolated() {
        assertTrue(xml.contains("SUBSTR(LOG_DETAIL, 1, 300) AS LOG_DETAIL_SUMMARY"));
        assertTrue(xml.contains("CASE WHEN LENGTH(LOG_DETAIL) &gt; 0 THEN 1 ELSE 0 END AS HAS_LOG_DETAIL"));
        assertTrue(xml.contains("CASE WHEN LENGTH(RAW_MESSAGE) &gt; 0 THEN 1 ELSE 0 END AS HAS_RAW_MESSAGE"));
        // 列表不读取完整大字段，也不读取 RESULT_DETAIL
        assertFalse(xml.contains("RESULT_DETAIL"));
    }

    @Test
    void emptyDataSourceArray_omitsBothInPredicates() {
        // 空数组不生成 IN 条件：两个 IN 谓词均由非空判断守卫
        assertTrue(xml.contains("<if test=\"sourceDataSourceIds != null and !sourceDataSourceIds.isEmpty()\">"));
        assertTrue(xml.contains("<if test=\"targetDataSourceIds != null and !targetDataSourceIds.isEmpty()\">"));
    }

    @Test
    void fixedSortAndFetchLimits() {
        assertTrue(xml.contains("ORDER BY TARGET_TIME DESC, CDC_LOG_ID DESC"));
        assertTrue(xml.contains("FETCH FIRST 101 ROWS ONLY"));
        assertEquals(2, countOccurrences(xml, "FETCH FIRST 1 ROWS ONLY"));
    }

    @Test
    void keysetCursorPredicatePresent() {
        assertTrue(xml.contains("TARGET_TIME &lt;  #{cursorTargetTime}"));
        assertTrue(xml.contains("CDC_LOG_ID &lt; #{cursorCdcLogId}"));
        assertTrue(xml.contains("<if test=\"cursorTargetTime != null\">"));
    }

    @Test
    void noPhysicalDesignDdl() {
        String upper = xml.toUpperCase();
        assertFalse(upper.contains("PARTITION"));
        assertFalse(upper.contains("SUBPARTITION"));
        assertFalse(upper.contains("TABLESPACE"));
        assertFalse(upper.contains("CREATE"));
        assertFalse(upper.contains("ALTER"));
        assertFalse(upper.contains("DROP"));
        assertFalse(upper.contains("TRUNCATE"));
        assertFalse(upper.contains("INDEX"));
    }

    @Test
    void listQueryColumnSetDoesNotReadRawOrResultDetail() {
        int listStart = xml.indexOf("selectLogList");
        int listEnd = xml.indexOf("</select>", listStart);
        String listSql = xml.substring(listStart, listEnd);
        // RAW_MESSAGE 仅出现在 LENGTH 存在性判断中，不作为独立列读取
        assertTrue(listSql.contains("LENGTH(RAW_MESSAGE)"));
        assertFalse(Pattern.compile("(?m)^\\s*RAW_MESSAGE\\s*[,]?\\s*$").matcher(listSql).find(),
                "RAW_MESSAGE must not be selected as a standalone column in list");
        assertFalse(listSql.contains("RESULT_DETAIL"));
        assertFalse(listSql.contains("RESULT_CODE"));
    }

    private static int countOccurrences(String haystack, String needle) {
        int count = 0;
        int idx = 0;
        while ((idx = haystack.indexOf(needle, idx)) >= 0) {
            count++;
            idx += needle.length();
        }
        return count;
    }
}
