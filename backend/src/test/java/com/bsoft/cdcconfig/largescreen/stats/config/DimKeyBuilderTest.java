package com.bsoft.cdcconfig.largescreen.stats.config;

import org.junit.jupiter.api.Test;

import static org.junit.jupiter.api.Assertions.*;

class DimKeyBuilderTest {

    // --- SOURCE_DATA_SOURCE ---

    @Test
    void sourceNormal() {
        String key = DimKeyBuilder.buildSourceDimKey("DS001");
        assertEquals("DS001", key);
    }

    @Test
    void sourceNull() {
        assertEquals("__UNIDENTIFIED_SOURCE__",
                DimKeyBuilder.buildSourceDimKey(null));
    }

    @Test
    void sourceEmpty() {
        assertEquals("__UNIDENTIFIED_SOURCE__",
                DimKeyBuilder.buildSourceDimKey(""));
    }

    @Test
    void sourceWhitespace() {
        assertEquals("__UNIDENTIFIED_SOURCE__",
                DimKeyBuilder.buildSourceDimKey("   "));
    }

    @Test
    void sourceTrimmed() {
        assertEquals("DS001", DimKeyBuilder.buildSourceDimKey("  DS001  "));
    }

    // --- TARGET_DB ---

    @Test
    void targetNormal() {
        String key = DimKeyBuilder.buildTargetDbDimKey("TG001");
        assertEquals("TG001", key);
    }

    @Test
    void targetNull() {
        assertEquals("__UNIDENTIFIED_TARGET__",
                DimKeyBuilder.buildTargetDbDimKey(null));
    }

    @Test
    void targetWhitespace() {
        assertEquals("__UNIDENTIFIED_TARGET__",
                DimKeyBuilder.buildTargetDbDimKey("  "));
    }

    // --- TABLE ---

    @Test
    void tableNormal() {
        String key = DimKeyBuilder.buildTableDimKey("420000000890", "SPT_HIS_2023_TYC", "IPT_INAOUTPUT");
        assertEquals("420000000890.SPT_HIS_2023_TYC.IPT_INAOUTPUT", key);
    }

    @Test
    void tableSourceNull() {
        assertEquals("__UNIDENTIFIED_TABLE__",
                DimKeyBuilder.buildTableDimKey(null, "S", "T"));
    }

    @Test
    void tableSchemaNull() {
        assertEquals("__UNIDENTIFIED_TABLE__",
                DimKeyBuilder.buildTableDimKey("D", null, "T"));
    }

    @Test
    void tableTableNull() {
        assertEquals("__UNIDENTIFIED_TABLE__",
                DimKeyBuilder.buildTableDimKey("D", "S", null));
    }

    @Test
    void tableSchemaWhitespace() {
        assertEquals("__UNIDENTIFIED_TABLE__",
                DimKeyBuilder.buildTableDimKey("D", "  ", "T"));
    }

    @Test
    void tableAllTrimmed() {
        String key = DimKeyBuilder.buildTableDimKey(" 420000000890 ", " SPT_HIS_2023_TYC ", " IPT_INAOUTPUT ");
        assertEquals("420000000890.SPT_HIS_2023_TYC.IPT_INAOUTPUT", key);
    }

    // --- dot separator ---

    @Test
    void tableDelimiterIsDot() {
        String key = DimKeyBuilder.buildTableDimKey("A", "B", "C");
        assertEquals("A.B.C", key);
        assertTrue(key.contains("."));
        assertFalse(key.contains("|"));
        assertFalse(key.contains(""));
    }

    @Test
    void tableContainsExactlyTwoDotSeparators() {
        String key = DimKeyBuilder.buildTableDimKey("420000000890", "SPT_HIS_2023_TYC", "IPT_INAOUTPUT");
        // Count dots
        long dotCount = key.chars().filter(ch -> ch == '.').count();
        assertEquals(2, dotCount);
    }

    @Test
    void tableKeyContainsNoUnitSeparator() {
        String key = DimKeyBuilder.buildTableDimKey("X", "Y", "Z");
        assertFalse(key.contains(""),
                "TABLE dim key must not contain U+001F");
    }

    @Test
    void tableKeyContainsNoPipe() {
        String key = DimKeyBuilder.buildTableDimKey("X", "Y", "Z");
        assertFalse(key.contains("|"),
                "TABLE dim key must not contain pipe");
    }

    @Test
    void tableWithDotInFieldValue() {
        // Field values containing . are allowed — the key has exactly 2 separator dots
        String key = DimKeyBuilder.buildTableDimKey("A.B", "C", "D");
        assertTrue(key.contains("A.B"));
        assertEquals("A.B.C.D", key);
    }
}
