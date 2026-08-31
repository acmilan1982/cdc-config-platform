package com.bsoft.cdcconfig.subscription.helper;

import com.bsoft.cdcconfig.subscription.helper.DataSourceTableParser.ParseResult;
import com.bsoft.cdcconfig.subscription.helper.DataSourceTableParser.TableEntry;
import org.junit.jupiter.api.Test;

import java.util.Arrays;
import java.util.List;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertNotNull;
import static org.junit.jupiter.api.Assertions.assertNull;

/**
 * DATA_SOURCE_TABLE 三段结构解析（DESIGN §4.2）：正常解析、不可解析 token 保留、
 * 表数量口径、大小写保持、正常三段格式不被误判为异常。
 */
class DataSourceTableParserTest {

    @Test
    void parse_normalTwoTables() {
        ParseResult result = DataSourceTableParser.parse("S01.SCHEMA_A.TABLE_1,S01.SCHEMA_A.TABLE_2");
        assertEquals(2, result.getTableCount());
        assertEquals(0, result.getRawUnparseable().size());
        assertEquals(2, result.getEntries().size());
        TableEntry first = result.getEntries().get(0);
        assertEquals("S01", first.getDataSourceId());
        assertEquals("SCHEMA_A", first.getSchema());
        assertEquals("TABLE_1", first.getTableName());
    }

    @Test
    void parse_preservesOriginalCaseAndOrder() {
        ParseResult result = DataSourceTableParser.parse("s01.ScHeMa_A.tbl_1,S01.SCHEMA_B.TABLE_2");
        assertEquals(Arrays.asList("s01", "S01"),
                result.getEntries().stream().map(TableEntry::getDataSourceId).collect(java.util.stream.Collectors.toList()));
        assertEquals("tbl_1", result.getEntries().get(0).getTableName());
    }

    @Test
    void parse_nullOrBlank_shouldYieldEmpty() {
        ParseResult nullResult = DataSourceTableParser.parse(null);
        assertEquals(0, nullResult.getTableCount());
        assertEquals(0, nullResult.getEntries().size());
        assertEquals(0, nullResult.getRawUnparseable().size());

        ParseResult blankResult = DataSourceTableParser.parse("  , , ");
        assertEquals(0, blankResult.getTableCount());
        assertEquals(0, blankResult.getEntries().size());
        assertEquals(0, blankResult.getRawUnparseable().size());
    }

    @Test
    void parse_unparseableTokensRetainedWithCount() {
        // 末尾多余组件（表名后句点）→ schema 段含句点 → 整段不可解析，归入 rawUnparseable
        ParseResult result = DataSourceTableParser.parse(
                "S01.SCHEMA_A.TABLE_1,S01.SCHEMA_A.TABLE_2.GONE,plain,BAD");
        assertEquals(4, result.getTableCount(), "表数量包含全部非空 token（含不可解析）");
        assertEquals(1, result.getEntries().size(), "只有可解析三段 token 计入条目");
        assertEquals(Arrays.asList("S01.SCHEMA_A.TABLE_2.GONE", "plain", "BAD"),
                result.getRawUnparseable(), "不可解析原始 token 不得静默丢弃");
    }

    @Test
    void parseToken_noDot_shouldBeNull() {
        assertNull(DataSourceTableParser.parseToken("NO_DOT"));
    }

    @Test
    void parseToken_singleDot_shouldBeNull() {
        assertNull(DataSourceTableParser.parseToken("S01.SCHEMA_A"));
    }

    @Test
    void parseToken_schemaContainsExtraDot_shouldBeNull() {
        assertNull(DataSourceTableParser.parseToken("S01.SCHEMA.A.TABLE_1"));
    }

    @Test
    void parseToken_emptyComponent_shouldBeNull() {
        assertNull(DataSourceTableParser.parseToken("S01..TABLE_1"));
        assertNull(DataSourceTableParser.parseToken(".SCHEMA_A.TABLE_1"));
        assertNull(DataSourceTableParser.parseToken("S01.SCHEMA_A."));
    }

    @Test
    void parseToken_null_shouldBeNull() {
        assertNull(DataSourceTableParser.parseToken(null));
    }

    @Test
    void parseToken_normalTwoStructuralDots_shouldNotBeFlagged() {
        TableEntry entry = DataSourceTableParser.parseToken("S01.SCHEMA_A.TABLE_1");
        assertNotNull(entry);
        assertEquals("S01", entry.getDataSourceId());
        assertEquals("SCHEMA_A", entry.getSchema());
        assertEquals("TABLE_1", entry.getTableName());
    }

    @Test
    void parseToken_tableNameDotMakesTokenUnparseable() {
        // 表名内句点会使 schema 段含句点（按首个/末个句点分割）→ 整段不可可靠解析；
        // 该 token 归入 rawUnparseable，保存时由 40316 拒绝（不静默丢字面量）。
        assertNull(DataSourceTableParser.parseToken("S01.SCHEMA_A.TABLE_1.X"));
    }
}
