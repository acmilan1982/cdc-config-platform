package com.bsoft.cdcconfig.subscription.converter;

import com.bsoft.cdcconfig.subscription.entity.DataSourceRef;
import com.bsoft.cdcconfig.subscription.entity.DataSubscribe;
import com.bsoft.cdcconfig.subscription.helper.DataSourceTableParser;
import com.bsoft.cdcconfig.subscription.vo.SchemaTableGroup;
import com.bsoft.cdcconfig.subscription.vo.SourceRefVO;
import com.bsoft.cdcconfig.subscription.vo.SubscriptionDeletePreviewVO;
import com.bsoft.cdcconfig.subscription.vo.SubscriptionDetailVO;
import com.bsoft.cdcconfig.subscription.vo.SubscriptionRowVO;
import com.bsoft.cdcconfig.subscription.vo.TargetRefVO;
import org.junit.jupiter.api.Test;

import java.lang.reflect.Field;
import java.time.LocalDateTime;
import java.time.ZoneId;
import java.util.Arrays;
import java.util.Collections;
import java.util.Date;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertNotNull;
import static org.junit.jupiter.api.Assertions.assertNull;
import static org.junit.jupiter.api.Assertions.assertTrue;

/**
 * Entity &lt;-&gt; VO 转换（DESIGN §2.2 / §4.8）：引用映射状态、按 Schema 分组、时间格式化、
 * 多源库异常行、删除预览计数、DataSourceRef 最小投影不加载密码字段。
 */
class SubscriptionConverterTest {

    private static DataSourceRef ref(String id, String org, String category, String active) {
        DataSourceRef ref = new DataSourceRef();
        ref.setDataSourceId(id);
        ref.setDataSourceOrg(org);
        ref.setDataSourceCategory(category);
        ref.setFgActive(active);
        return ref;
    }

    @Test
    void toSourceRefVO_normalInactiveNotFound() {
        SourceRefVO normal = SubscriptionConverter.toSourceRefVO(
                ref("S01", "机构A", "SOURCE", "1"), "S01");
        assertEquals("NORMAL", normal.getStatus());
        assertEquals("机构A", normal.getDataSourceOrg());

        SourceRefVO inactive = SubscriptionConverter.toSourceRefVO(
                ref("S01", "机构A", "SOURCE", "0"), "S01");
        assertEquals("INACTIVE", inactive.getStatus());
        assertEquals("机构A", inactive.getDataSourceOrg());

        SourceRefVO notFound = SubscriptionConverter.toSourceRefVO(null, "S01");
        assertEquals("NOT_FOUND", notFound.getStatus());
        assertNull(notFound.getDataSourceOrg());
        assertEquals("S01", notFound.getDataSourceId());
    }

    @Test
    void toTargetRefVO_sameStatusSemantics() {
        TargetRefVO normal = SubscriptionConverter.toTargetRefVO(
                ref("T01", "机构B", "TARGET", "1"), "T01");
        assertEquals("NORMAL", normal.getStatus());
        TargetRefVO notFound = SubscriptionConverter.toTargetRefVO(null, "T01");
        assertEquals("NOT_FOUND", notFound.getStatus());
    }

    @Test
    void groupBySchema_preservesFirstOccurrenceOrderAndTableOrder() {
        List<SchemaTableGroup> groups = SubscriptionConverter.groupBySchema(Arrays.asList(
                DataSourceTableParser.parseToken("S01.SCHEMA_B.T2"),
                DataSourceTableParser.parseToken("S01.SCHEMA_A.T1"),
                DataSourceTableParser.parseToken("S01.SCHEMA_B.T3")));
        assertEquals(2, groups.size());
        assertEquals("SCHEMA_B", groups.get(0).getSchema());
        assertEquals(Arrays.asList("T2", "T3"), groups.get(0).getTables());
        assertEquals("SCHEMA_A", groups.get(1).getSchema());
        assertEquals(Collections.singletonList("T1"), groups.get(1).getTables());
    }

    @Test
    void formatTime_nullReturnsNull() {
        assertNull(SubscriptionConverter.formatTime(null));
    }

    @Test
    void formatTime_returnsIso8601AsiaShanghai() {
        // 2026-08-30T10:00:00 UTC -> 2026-08-30T18:00:00 Asia/Shanghai
        Date utc = Date.from(LocalDateTime.of(2026, 8, 30, 10, 0, 0)
                .atZone(ZoneId.of("UTC")).toInstant());
        assertEquals("2026-08-30T18:00:00", SubscriptionConverter.formatTime(utc));
    }

    @Test
    void toRowVO_multiSourceAnomaly_sourceNullAndFlagged() {
        DataSubscribe row = new DataSubscribe();
        row.setDataSubId("sub1");
        row.setDataSubDesc("异常记录");
        row.setDataFromSourceId("S01,S02");
        row.setDataToSourceId("T01");
        row.setDataSourceTable("S01.SCHEMA_A.TABLE_1");
        Map<String, DataSourceRef> refMap = new HashMap<>();
        refMap.put("S01", ref("S01", "机构A", "SOURCE", "1"));
        refMap.put("S02", ref("S02", "机构C", "SOURCE", "1"));
        refMap.put("T01", ref("T01", "机构B", "TARGET", "1"));

        SubscriptionRowVO vo = SubscriptionConverter.toRowVO(row, refMap);
        assertTrue(vo.isAnomalyMultiSource());
        assertNull(vo.getSource());
        assertEquals(1, vo.getSourceTableCount());
        assertEquals(1, vo.getTargets().size());
    }

    @Test
    void toRowVO_normalRow_fillsSourceAndTables() {
        DataSubscribe row = new DataSubscribe();
        row.setDataSubId("sub2");
        row.setDataSubDesc("正常记录");
        row.setDataFromSourceId("S01");
        row.setDataToSourceId("T01");
        row.setDataSourceTable("S01.SCHEMA_A.TABLE_1,S01.SCHEMA_A.TABLE_2");
        Map<String, DataSourceRef> refMap = new HashMap<>();
        refMap.put("S01", ref("S01", "机构A", "SOURCE", "1"));
        refMap.put("T01", ref("T01", "机构B", "TARGET", "1"));

        SubscriptionRowVO vo = SubscriptionConverter.toRowVO(row, refMap);
        assertFalse(vo.isAnomalyMultiSource());
        assertNotNull(vo.getSource());
        assertEquals("NORMAL", vo.getSource().getStatus());
        assertEquals(2, vo.getSourceTableCount());
        assertEquals(1, vo.getTablesBySchema().size());
        assertEquals(0, vo.getRawUnparseableTables().size());
        assertEquals(1, vo.getTargets().size());
    }

    @Test
    void toRowVO_unparseableTablesRetained() {
        DataSubscribe row = new DataSubscribe();
        row.setDataSubId("sub3");
        row.setDataSubDesc("含异常项");
        row.setDataFromSourceId("S01");
        row.setDataToSourceId("T01");
        row.setDataSourceTable("S01.SCHEMA_A.TABLE_1,unparseable");
        Map<String, DataSourceRef> refMap = Collections.emptyMap();

        SubscriptionRowVO vo = SubscriptionConverter.toRowVO(row, refMap);
        assertEquals(2, vo.getSourceTableCount(), "表数量含不可解析 token");
        assertEquals(1, vo.getTablesBySchema().size(), "可解析表按 Schema 分组");
        assertEquals(Collections.singletonList("unparseable"), vo.getRawUnparseableTables());
        assertEquals("NOT_FOUND", vo.getSource().getStatus());
    }

    @Test
    void toDetailVO_passesWarningsAndTargets() {
        DataSubscribe row = new DataSubscribe();
        row.setDataSubId("sub4");
        row.setDataSubDesc("详情记录");
        row.setDataFromSourceId("S01");
        row.setDataToSourceId("T01,T02");
        row.setDataSourceTable("S01.SCHEMA_A.TABLE_1");
        Map<String, DataSourceRef> refMap = new HashMap<>();
        refMap.put("S01", ref("S01", "机构A", "SOURCE", "1"));
        refMap.put("T01", ref("T01", "机构B", "TARGET", "1"));
        refMap.put("T02", ref("T02", "机构D", "TARGET", "0"));

        SubscriptionDetailVO vo = SubscriptionConverter.toDetailVO(
                row, refMap, Collections.singletonList("目标库已停用（T02）"));
        assertEquals(2, vo.getTargets().size());
        assertEquals("INACTIVE", vo.getTargets().get(1).getStatus());
        assertEquals(Collections.singletonList("目标库已停用（T02）"), vo.getWarnings());
    }

    @Test
    void toDeletePreviewVO_countsSchemaAndTableIncludingUnparseable() {
        DataSubscribe row = new DataSubscribe();
        row.setDataSubId("sub5");
        row.setDataSubDesc("删除预览");
        row.setDataFromSourceId("S01");
        row.setDataToSourceId("T01");
        row.setDataSourceTable("S01.SCHEMA_A.TABLE_1,S01.SCHEMA_B.TABLE_2,unparseable");
        Map<String, DataSourceRef> refMap = new HashMap<>();
        refMap.put("S01", ref("S01", "机构A", "SOURCE", "1"));
        refMap.put("T01", ref("T01", "机构B", "TARGET", "1"));

        SubscriptionDeletePreviewVO vo = SubscriptionConverter.toDeletePreviewVO(
                row, refMap, Collections.emptyList());
        assertEquals(2, vo.getSchemaCount(), "只统计至少选中一张表的 Schema");
        assertEquals(3, vo.getTableCount(), "表数量含不可解析历史 token");
        assertEquals(1, vo.getTargets().size());
    }

    @Test
    void dataSourceRef_projectionHasNoPasswordField() {
        for (Field field : DataSourceRef.class.getDeclaredFields()) {
            assertFalse(field.getName().toLowerCase().contains("password"),
                    "DataSourceRef 最小投影不得包含密码字段");
        }
    }

    @Test
    void toTargetRefVOList_handlesCsvAndNotFound() {
        Map<String, DataSourceRef> refMap = new HashMap<>();
        refMap.put("T01", ref("T01", "机构B", "TARGET", "1"));
        List<TargetRefVO> targets = SubscriptionConverter.toTargetRefVOList("T01,T02", refMap);
        assertEquals(2, targets.size());
        assertEquals("NORMAL", targets.get(0).getStatus());
        assertEquals("NOT_FOUND", targets.get(1).getStatus());
    }
}
