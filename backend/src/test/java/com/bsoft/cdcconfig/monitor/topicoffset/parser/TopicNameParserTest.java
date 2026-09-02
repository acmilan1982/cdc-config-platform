package com.bsoft.cdcconfig.monitor.topicoffset.parser;

import com.bsoft.cdcconfig.monitor.topicoffset.domain.TopicParts;
import org.junit.jupiter.api.Test;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertNull;
import static org.junit.jupiter.api.Assertions.assertTrue;

/**
 * Topic 严格五段解析单测（DESIGN §5.3）。恰好 5 段即成功，不要求各段非空；原值权威保留。
 */
class TopicNameParserTest {

    @Test
    void fiveSegmentsShouldParse() {
        TopicParts parts = TopicNameParser.parse("hosp-012.112-source-19c.SPT_HIS_2023.OPT_FEE.company-target");
        assertTrue(parts.isParseable());
        assertEquals("hosp-012", parts.getClientId());
        assertEquals("112-source-19c", parts.getSourceId());
        assertEquals("SPT_HIS_2023", parts.getSchema());
        assertEquals("OPT_FEE", parts.getTable());
        assertEquals("company-target", parts.getTargetId());
        assertEquals("hosp-012.112-source-19c.SPT_HIS_2023.OPT_FEE.company-target", parts.getRawTopic());
    }

    @Test
    void fewerThanFiveSegmentsShouldBeUnparseable() {
        TopicParts parts = TopicNameParser.parse("offline.malformed");
        assertFalse(parts.isParseable());
        assertNull(parts.getClientId());
        assertNull(parts.getTable());
        assertEquals("offline.malformed", parts.getRawTopic());
    }

    @Test
    void moreThanFiveSegmentsShouldBeUnparseable() {
        TopicParts parts = TopicNameParser.parse("a.b.c.d.e.f");
        assertFalse(parts.isParseable());
        assertEquals("a.b.c.d.e.f", parts.getRawTopic());
    }

    @Test
    void innerDotProducingMoreThanFiveSegmentsShouldBeUnparseable() {
        TopicParts parts = TopicNameParser.parse("cli.src.schema.ta.ble.target");
        assertFalse(parts.isParseable());
    }

    @Test
    void leadingDotWithExactlyFiveSegmentsShouldParse() {
        TopicParts parts = TopicNameParser.parse(".a.b.c.d");
        assertTrue(parts.isParseable());
        assertEquals("", parts.getClientId());
        assertEquals("a", parts.getSourceId());
        assertEquals("d", parts.getTargetId());
        assertEquals(".a.b.c.d", parts.getRawTopic());
    }

    @Test
    void trailingDotWithExactlyFiveSegmentsShouldParse() {
        TopicParts parts = TopicNameParser.parse("a.b.c.d.");
        assertTrue(parts.isParseable());
        assertEquals("", parts.getTargetId());
        assertEquals("a", parts.getClientId());
        assertEquals("a.b.c.d.", parts.getRawTopic());
    }

    @Test
    void consecutiveDotsWithExactlyFiveSegmentsShouldParse() {
        TopicParts parts = TopicNameParser.parse("a..b.c.d");
        assertTrue(parts.isParseable());
        assertEquals("", parts.getSourceId());
        assertEquals("a", parts.getClientId());
        assertEquals("a..b.c.d", parts.getRawTopic());
    }

    @Test
    void emptyStringShouldBeUnparseable() {
        TopicParts parts = TopicNameParser.parse("");
        assertFalse(parts.isParseable());
        assertEquals("", parts.getRawTopic());
    }

    @Test
    void nullShouldBeUnparseable() {
        TopicParts parts = TopicNameParser.parse(null);
        assertFalse(parts.isParseable());
        assertNull(parts.getRawTopic());
    }
}
