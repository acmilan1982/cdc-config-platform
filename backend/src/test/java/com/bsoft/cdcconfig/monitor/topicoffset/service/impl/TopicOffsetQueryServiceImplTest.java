package com.bsoft.cdcconfig.monitor.topicoffset.service.impl;

import com.bsoft.cdcconfig.common.exception.BusinessException;
import com.bsoft.cdcconfig.monitor.topicoffset.constant.TopicOffsetConstants;
import com.bsoft.cdcconfig.monitor.topicoffset.mapper.ClientConfigMapper;
import com.bsoft.cdcconfig.monitor.topicoffset.mapper.DataSourceConfigMapper;
import com.bsoft.cdcconfig.monitor.topicoffset.mapper.TopicOffsetMapper;
import com.bsoft.cdcconfig.monitor.topicoffset.model.ClientConfigRow;
import com.bsoft.cdcconfig.monitor.topicoffset.model.DataSourceConfigRow;
import com.bsoft.cdcconfig.monitor.topicoffset.model.TopicOffsetRow;
import com.bsoft.cdcconfig.monitor.topicoffset.query.TopicOffsetQuery;
import com.bsoft.cdcconfig.monitor.topicoffset.vo.CandidateGroupVO;
import com.bsoft.cdcconfig.monitor.topicoffset.vo.DataSourceCandidateVO;
import com.bsoft.cdcconfig.monitor.topicoffset.vo.TopicOffsetItemVO;
import com.bsoft.cdcconfig.monitor.topicoffset.vo.TopicOffsetPageVO;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.mockito.junit.jupiter.MockitoSettings;
import org.mockito.quality.Strictness;

import java.util.ArrayList;
import java.util.Arrays;
import java.util.Collections;
import java.util.List;
import java.util.stream.Collectors;
import java.util.stream.IntStream;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertNotNull;
import static org.junit.jupiter.api.Assertions.assertNull;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.junit.jupiter.api.Assertions.assertTrue;
import static org.mockito.Mockito.when;

/**
 * TopicOffsetQueryServiceImpl 纯 Mockito 单测（不连接数据库）。
 * 覆盖过滤/解析/映射/切片/错误码与候选，验证 NEXT_OFFSET 字符串透传。
 */
@ExtendWith(MockitoExtension.class)
@MockitoSettings(strictness = Strictness.LENIENT)
class TopicOffsetQueryServiceImplTest {

    @Mock
    private TopicOffsetMapper topicOffsetMapper;
    @Mock
    private ClientConfigMapper clientConfigMapper;
    @Mock
    private DataSourceConfigMapper dataSourceConfigMapper;

    private TopicOffsetQueryServiceImpl service;

    @BeforeEach
    void setUp() {
        service = new TopicOffsetQueryServiceImpl(topicOffsetMapper, clientConfigMapper, dataSourceConfigMapper);
        when(clientConfigMapper.selectAll()).thenReturn(Collections.emptyList());
        when(dataSourceConfigMapper.selectAll()).thenReturn(Collections.emptyList());
    }

    private static TopicOffsetRow row(String topic, String offset) {
        TopicOffsetRow row = new TopicOffsetRow();
        row.setServerId("Server001");
        row.setKafkaTopic(topic);
        row.setNextOffsetStr(offset);
        row.setUpdatedAtStr("2026-08-17 17:49:01");
        return row;
    }

    private static TopicOffsetQuery query() {
        return new TopicOffsetQuery();
    }

    // ==================== 默认/无结构化条件 ====================

    @Test
    void noConditionShouldReturnAllRowsIncludingUnparseableInOrder() {
        List<TopicOffsetRow> rows = Arrays.asList(
                row("cli.src.sch.tab.trg", "0"),
                row("offline.malformed", "42"),
                row("cli2.src2.sch2.tab2.trg2", "1"));
        when(topicOffsetMapper.selectAll()).thenReturn(rows);

        TopicOffsetPageVO vo = service.queryOffsets(query());

        assertEquals(3, vo.getTotal());
        assertEquals(1, vo.getPages());
        assertEquals(1, vo.getUnparseableTotal());
        List<TopicOffsetItemVO> records = vo.getRecords();
        assertEquals(3, records.size());
        assertEquals("cli.src.sch.tab.trg", records.get(0).getRawTopic());
        assertEquals("offline.malformed", records.get(1).getRawTopic());
        assertEquals("cli2.src2.sch2.tab2.trg2", records.get(2).getRawTopic());
        assertTrue(records.get(0).isParseable());
        assertFalse(records.get(1).isParseable());
        assertNull(records.get(1).getParsed());
        assertNull(records.get(1).getMapping());
    }

    // ==================== 结构化条件剔除无法解析 ====================

    @Test
    void structuredClientFilterShouldExcludeUnparseableRows() {
        when(topicOffsetMapper.selectAll()).thenReturn(Arrays.asList(
                row("hosp-012.112-src.sch.tab.trg", "5"),
                row("offline.malformed", "42")));

        TopicOffsetQuery q = query();
        q.setClientId(Collections.singletonList("hosp-012"));

        TopicOffsetPageVO vo = service.queryOffsets(q);

        assertEquals(1, vo.getTotal());
        assertEquals(0, vo.getUnparseableTotal());
        assertEquals(1, vo.getRecords().size());
        assertEquals("hosp-012.112-src.sch.tab.trg", vo.getRecords().get(0).getRawTopic());
    }

    @Test
    void structuredTableNameOnlyShouldExcludeUnparseableRows() {
        when(topicOffsetMapper.selectAll()).thenReturn(Arrays.asList(
                row("cli.src.sch.OPT_FEE.trg", "5"),
                row("bad.topic", "42")));

        TopicOffsetQuery q = query();
        q.setTableName("opt_fee");

        TopicOffsetPageVO vo = service.queryOffsets(q);

        assertEquals(1, vo.getTotal());
        assertEquals(0, vo.getUnparseableTotal());
    }

    // ==================== 同维 OR / 跨维 AND ====================

    @Test
    void sameDimensionIdsShouldBeOr() {
        when(topicOffsetMapper.selectAll()).thenReturn(Arrays.asList(
                row("c1.s1.s.t1.trg", "1"),
                row("c2.s1.s.t2.trg", "2"),
                row("c3.s1.s.t3.trg", "3")));

        TopicOffsetQuery q = query();
        q.setClientId(Arrays.asList("c1", "c3"));

        TopicOffsetPageVO vo = service.queryOffsets(q);

        assertEquals(2, vo.getTotal());
        List<String> topics = vo.getRecords().stream().map(TopicOffsetItemVO::getRawTopic).collect(Collectors.toList());
        assertTrue(topics.contains("c1.s1.s.t1.trg"));
        assertTrue(topics.contains("c3.s1.s.t3.trg"));
        assertFalse(topics.contains("c2.s1.s.t2.trg"));
    }

    @Test
    void crossDimensionsShouldBeAnd() {
        when(topicOffsetMapper.selectAll()).thenReturn(Arrays.asList(
                row("c1.s1.s.t1.trg", "1"),
                row("c1.s2.s.t2.trg", "2"),
                row("c2.s1.s.t3.trg", "3")));

        TopicOffsetQuery q = query();
        q.setClientId(Collections.singletonList("c1"));
        q.setSourceId(Collections.singletonList("s1"));

        TopicOffsetPageVO vo = service.queryOffsets(q);

        assertEquals(1, vo.getTotal());
        assertEquals("c1.s1.s.t1.trg", vo.getRecords().get(0).getRawTopic());
    }

    @Test
    void targetDimensionShouldMatchFifthSegment() {
        when(topicOffsetMapper.selectAll()).thenReturn(Arrays.asList(
                row("c1.s1.s.t1.trg1", "1"),
                row("c1.s1.s.t2.trg2", "2")));

        TopicOffsetQuery q = query();
        q.setTargetId(Collections.singletonList("trg2"));

        TopicOffsetPageVO vo = service.queryOffsets(q);

        assertEquals(1, vo.getTotal());
        assertEquals("c1.s1.s.t2.trg2", vo.getRecords().get(0).getRawTopic());
    }

    // ==================== 表名匹配（第 4 段、不区分大小写包含、字面量） ====================

    @Test
    void tableNameShouldMatchFourthSegmentCaseInsensitivelyButIgnoreOtherSegments() {
        when(topicOffsetMapper.selectAll()).thenReturn(Arrays.asList(
                row("cli.src.orderDetail.OPT_FEE.trg", "1"),
                row("cli.src.MyOrder.ORDER_DETAIL.trg", "2")));

        TopicOffsetQuery q = query();
        q.setTableName("order_detail");

        TopicOffsetPageVO vo = service.queryOffsets(q);

        // schema/源库段含 order_detail 但第 4 段不是的 r1 不命中；r2 第 4 段 ORDER_DETAIL 命中
        assertEquals(1, vo.getTotal());
        assertEquals("cli.src.MyOrder.ORDER_DETAIL.trg", vo.getRecords().get(0).getRawTopic());
    }

    @Test
    void tableNameShouldBeCaseInsensitiveContainsOnFourthSegment() {
        when(topicOffsetMapper.selectAll()).thenReturn(Arrays.asList(
                row("cli.src.sch.OPT_FEE.trg", "1"),
                row("cli.src.sch.opt_tmp.trg", "2")));

        TopicOffsetQuery q = query();
        q.setTableName("opt");

        TopicOffsetPageVO vo = service.queryOffsets(q);

        assertEquals(2, vo.getTotal());
    }

    @Test
    void percentUnderscoreBackslashShouldBeTreatedLiterallyNotAsWildcard() {
        when(topicOffsetMapper.selectAll()).thenReturn(Arrays.asList(
                row("cli.src.sch.10%done.trg", "1"),
                row("cli.src.sch.100done.trg", "2"),
                row("cli.src.sch.tx1.trg", "3"),
                row("cli.src.sch.t_1abc.trg", "4"),
                row("cli.src.sch.a\\b.trg", "5")));

        // '%' 按字面：r1 含 "10%" 命中；r2 "100done" 不含字面 "%" 不命中（LIKE 语义下二者都命中）
        TopicOffsetQuery percent = query();
        percent.setTableName("10%");
        assertEquals(1, service.queryOffsets(percent).getTotal());

        // '_' 按字面：r3 "tx1" 不含 "t_1" 不命中（LIKE 下会命中）；r4 命中
        TopicOffsetQuery underscore = query();
        underscore.setTableName("t_1");
        assertEquals(1, service.queryOffsets(underscore).getTotal());

        TopicOffsetQuery backslash = query();
        backslash.setTableName("a\\b");
        assertEquals(1, service.queryOffsets(backslash).getTotal());
    }

    @Test
    void tableNameShouldBeTrimmedBeforeMatching() {
        when(topicOffsetMapper.selectAll()).thenReturn(Collections.singletonList(
                row("cli.src.sch.OPT_FEE.trg", "1")));

        TopicOffsetQuery q = query();
        q.setTableName("  opt_fee  ");

        TopicOffsetPageVO vo = service.queryOffsets(q);

        assertEquals(1, vo.getTotal());
    }

    @Test
    void filterIdsShouldBeTrimmed() {
        when(topicOffsetMapper.selectAll()).thenReturn(Collections.singletonList(
                row("c1.s1.s.t.trg", "1")));

        TopicOffsetQuery q = query();
        q.setClientId(Collections.singletonList("  c1  "));

        assertEquals(1, service.queryOffsets(q).getTotal());
    }

    // ==================== 分页与切片 ====================

    @Test
    void pageSlicingShouldHonorFixedPageSizeAndReportTotals() {
        List<TopicOffsetRow> rows = new ArrayList<>();
        for (int i = 0; i < 155; i++) {
            rows.add(row("c1.s1.sch.tbl" + i + ".trg", String.valueOf(i)));
        }
        when(topicOffsetMapper.selectAll()).thenReturn(rows);

        TopicOffsetQuery q = query();
        q.setPageNum("1");
        TopicOffsetPageVO page1 = service.queryOffsets(q);
        assertEquals(155, page1.getTotal());
        assertEquals(2, page1.getPages());
        assertEquals(150, page1.getPageSize());
        assertEquals(150, page1.getRecords().size());
        assertEquals("c1.s1.sch.tbl0.trg", page1.getRecords().get(0).getRawTopic());
        assertEquals("c1.s1.sch.tbl149.trg", page1.getRecords().get(149).getRawTopic());

        TopicOffsetQuery q2 = query();
        q2.setPageNum("2");
        TopicOffsetPageVO page2 = service.queryOffsets(q2);
        assertEquals(2, page2.getPageNum());
        assertEquals(5, page2.getRecords().size());
        assertEquals("c1.s1.sch.tbl150.trg", page2.getRecords().get(0).getRawTopic());
        assertEquals("c1.s1.sch.tbl154.trg", page2.getRecords().get(4).getRawTopic());
    }

    @Test
    void outOfRangePageShouldReturnEmptyRecordsButCorrectTotalAndPages() {
        when(topicOffsetMapper.selectAll()).thenReturn(Arrays.asList(
                row("c1.s1.s.t1.trg", "1"),
                row("c1.s1.s.t2.trg", "2")));

        TopicOffsetQuery q = query();
        q.setPageNum("99");

        TopicOffsetPageVO vo = service.queryOffsets(q);
        assertEquals(99, vo.getPageNum());
        assertEquals(2, vo.getTotal());
        assertEquals(1, vo.getPages());
        assertTrue(vo.getRecords().isEmpty());
    }

    @Test
    void emptyTotalShouldYieldZeroPages() {
        when(topicOffsetMapper.selectAll()).thenReturn(Collections.emptyList());
        TopicOffsetPageVO vo = service.queryOffsets(query());
        assertEquals(0, vo.getTotal());
        assertEquals(0, vo.getPages());
        assertTrue(vo.getRecords().isEmpty());
    }

    // ==================== 配置映射状态 ====================

    @Test
    void rowMappingShouldReflectActiveInactiveAndNotFoundStates() {
        when(topicOffsetMapper.selectAll()).thenReturn(Collections.singletonList(
                row("hosp-001.112-src.sch.tab.company-trg", "5")));

        ClientConfigRow client = new ClientConfigRow();
        client.setClientId("hosp-001");
        client.setClientDesc("市一医院HIS");
        client.setFgActive("1");
        when(clientConfigMapper.selectAll()).thenReturn(Collections.singletonList(client));

        DataSourceConfigRow source = new DataSourceConfigRow();
        source.setDataSourceId("112-src");
        source.setDataSourceOrg("源库112");
        source.setDataSourceCategory("SOURCE");
        source.setFgActive("1");
        DataSourceConfigRow target = new DataSourceConfigRow();
        target.setDataSourceId("company-trg");
        target.setDataSourceOrg("Doris目标库");
        target.setDataSourceCategory("target");
        target.setFgActive("0");
        when(dataSourceConfigMapper.selectAll()).thenReturn(Arrays.asList(source, target));

        TopicOffsetPageVO vo = service.queryOffsets(query());

        TopicOffsetItemVO item = vo.getRecords().get(0);
        assertEquals(TopicOffsetConstants.MAPPING_STATE_ACTIVE, item.getMapping().getClient().getState());
        assertEquals("hosp-001", item.getMapping().getClient().getId());
        // 客户端配置存在 → desc 携带真实描述，不置 null（TOPIC-OFFSET-R1 §4.5）
        assertEquals("市一医院HIS", item.getMapping().getClient().getDesc());
        assertEquals(TopicOffsetConstants.MAPPING_STATE_ACTIVE, item.getMapping().getSource().getState());
        assertEquals("源库112", item.getMapping().getSource().getOrg());
        assertEquals(TopicOffsetConstants.MAPPING_STATE_INACTIVE, item.getMapping().getTarget().getState());
        assertEquals("company-trg", item.getMapping().getTarget().getId());
        assertEquals("Doris目标库", item.getMapping().getTarget().getOrg());
    }

    @Test
    void clientMappingShouldCarryDescForActiveAndInactiveButNullForNotFound() {
        when(topicOffsetMapper.selectAll()).thenReturn(Arrays.asList(
                row("cli-active.src.sch.tab.trg", "1"),
                row("cli-inactive.src.sch.tab.trg", "2"),
                row("cli-ghost.src.sch.tab.trg", "3")));

        ClientConfigRow active = new ClientConfigRow();
        active.setClientId("cli-active");
        active.setClientDesc("活动客户端描述");
        active.setFgActive("1");
        ClientConfigRow inactive = new ClientConfigRow();
        inactive.setClientId("cli-inactive");
        inactive.setClientDesc("停用客户端描述");
        inactive.setFgActive("0");
        when(clientConfigMapper.selectAll()).thenReturn(Arrays.asList(active, inactive));

        DataSourceConfigRow source = new DataSourceConfigRow();
        source.setDataSourceId("src");
        source.setDataSourceOrg("源库");
        source.setDataSourceCategory("SOURCE");
        source.setFgActive("1");
        DataSourceConfigRow target = new DataSourceConfigRow();
        target.setDataSourceId("trg");
        target.setDataSourceOrg("目标库");
        target.setDataSourceCategory("TARGET");
        target.setFgActive("1");
        when(dataSourceConfigMapper.selectAll()).thenReturn(Arrays.asList(source, target));

        TopicOffsetPageVO vo = service.queryOffsets(query());
        List<TopicOffsetItemVO> records = vo.getRecords();
        assertEquals(3, records.size());

        assertEquals(TopicOffsetConstants.MAPPING_STATE_ACTIVE, records.get(0).getMapping().getClient().getState());
        assertEquals("活动客户端描述", records.get(0).getMapping().getClient().getDesc());
        assertEquals(TopicOffsetConstants.MAPPING_STATE_INACTIVE, records.get(1).getMapping().getClient().getState());
        assertEquals("停用客户端描述", records.get(1).getMapping().getClient().getDesc());
        assertEquals(TopicOffsetConstants.MAPPING_STATE_NOT_FOUND, records.get(2).getMapping().getClient().getState());
        assertNull(records.get(2).getMapping().getClient().getDesc());
    }

    @Test
    void missingConfigShouldYieldNotFoundAndEmptyOrgShouldBeNull() {
        when(topicOffsetMapper.selectAll()).thenReturn(Collections.singletonList(
                row("ghost.src.sch.tab.ghost-trg", "5")));

        DataSourceConfigRow source = new DataSourceConfigRow();
        source.setDataSourceId("src");
        source.setDataSourceOrg(null);
        source.setDataSourceCategory("SOURCE");
        source.setFgActive("1");
        when(dataSourceConfigMapper.selectAll()).thenReturn(Collections.singletonList(source));

        TopicOffsetPageVO vo = service.queryOffsets(query());
        TopicOffsetItemVO item = vo.getRecords().get(0);

        assertEquals(TopicOffsetConstants.MAPPING_STATE_NOT_FOUND, item.getMapping().getClient().getState());
        assertEquals("ghost", item.getMapping().getClient().getId());
        // 客户端配置不存在 → NOT_FOUND 且 desc 为 null（TOPIC-OFFSET-R1 §4.5）
        assertNull(item.getMapping().getClient().getDesc());
        assertEquals(TopicOffsetConstants.MAPPING_STATE_NOT_FOUND, item.getMapping().getTarget().getState());
        assertEquals("ghost-trg", item.getMapping().getTarget().getId());
        // 源库段 "src" 存在但 ORG 为空 → ACTIVE 且 org 为 null
        assertEquals(TopicOffsetConstants.MAPPING_STATE_ACTIVE, item.getMapping().getSource().getState());
        assertEquals("src", item.getMapping().getSource().getId());
        assertNull(item.getMapping().getSource().getOrg());
    }

    @Test
    void parseableRowShouldCarryParsedFiveSegments() {
        when(topicOffsetMapper.selectAll()).thenReturn(Collections.singletonList(
                row("hosp-001.112-src.sch.TABLE_X.trg", "5")));

        TopicOffsetPageVO vo = service.queryOffsets(query());
        TopicOffsetItemVO item = vo.getRecords().get(0);

        assertTrue(item.isParseable());
        assertNotNull(item.getParsed());
        assertEquals("hosp-001", item.getParsed().getClientId());
        assertEquals("112-src", item.getParsed().getSourceId());
        assertEquals("sch", item.getParsed().getSchema());
        assertEquals("TABLE_X", item.getParsed().getTable());
        assertEquals("trg", item.getParsed().getTargetId());
    }

    // ==================== NEXT_OFFSET 字符串透传 ====================

    @Test
    void nextOffsetStringShouldPassThroughUntouched() {
        List<String> samples = Arrays.asList(
                "0", "1", "-1", "9007199254740993",
                "9999999999999999999", "-9999999999999999999");
        List<TopicOffsetRow> rows = new ArrayList<>();
        for (String s : samples) {
            rows.add(row("c1.s1.s.t.trg", s));
        }
        when(topicOffsetMapper.selectAll()).thenReturn(rows);

        List<String> actual = service.queryOffsets(query()).getRecords()
                .stream().map(TopicOffsetItemVO::getNextOffset).collect(Collectors.toList());
        assertEquals(samples, actual);
    }

    // ==================== 错误码 ====================

    @Test
    void nonIntegerPageNumShouldThrow40001() {
        TopicOffsetQuery q = query();
        q.setPageNum("abc");
        BusinessException e = assertThrows(BusinessException.class, () -> service.queryOffsets(q));
        assertEquals(40001, e.getCode());
    }

    @Test
    void pageNumLessThanOneShouldThrow40001() {
        for (String bad : Arrays.asList("0", "-3")) {
            TopicOffsetQuery q = query();
            q.setPageNum(bad);
            BusinessException e = assertThrows(BusinessException.class, () -> service.queryOffsets(q));
            assertEquals(40001, e.getCode());
        }
    }

    @Test
    void blankOrNullPageNumShouldDefaultToOne() {
        when(topicOffsetMapper.selectAll()).thenReturn(Collections.emptyList());
        TopicOffsetQuery q = query();
        q.setPageNum("   ");
        assertEquals(1, service.queryOffsets(q).getPageNum());
    }

    @Test
    void overLongTableNameShouldThrow40002() {
        TopicOffsetQuery q = query();
        q.setTableName(String.join("", Collections.nCopies(201, "a")));
        BusinessException e = assertThrows(BusinessException.class, () -> service.queryOffsets(q));
        assertEquals(40002, e.getCode());
    }

    @Test
    void tooManyFilterIdsShouldThrow40003() {
        List<String> ids = IntStream.rangeClosed(1, 51)
                .mapToObj(i -> "id" + i).collect(Collectors.toList());
        TopicOffsetQuery q = query();
        q.setClientId(ids);
        BusinessException e = assertThrows(BusinessException.class, () -> service.queryOffsets(q));
        assertEquals(40003, e.getCode());
    }

    // ==================== 候选 /candidates ====================

    @Test
    void clientCandidatesShouldBeSortedByIdAndIncludeInactiveAndDesc() {
        ClientConfigRow c2 = new ClientConfigRow();
        c2.setClientId("hosp-002");
        c2.setClientDesc("");
        c2.setFgActive("0");
        ClientConfigRow c1 = new ClientConfigRow();
        c1.setClientId("hosp-001");
        c1.setClientDesc("市一医院HIS");
        c1.setFgActive("1");
        when(clientConfigMapper.selectAll()).thenReturn(Arrays.asList(c2, c1));

        CandidateGroupVO group = service.queryCandidates();

        assertEquals(2, group.getClients().size());
        assertEquals("hosp-001", group.getClients().get(0).getId());
        assertTrue(group.getClients().get(0).isActive());
        assertEquals("市一医院HIS", group.getClients().get(0).getDesc());
        assertEquals("hosp-002", group.getClients().get(1).getId());
        assertFalse(group.getClients().get(1).isActive());
    }

    @Test
    void dataSourceCandidatesShouldSplitByCategoryCaseInsensitivelyAndSortOrgNullsLast() {
        DataSourceConfigRow src = ds("s1", "源库1", "SOURCE", "1");
        DataSourceConfigRow srcLower = ds("s2", null, "source", "1");
        DataSourceConfigRow tgt = ds("t1", null, "TARGET", "1");
        DataSourceConfigRow tgtLower = ds("t2", "目标库2", "target", "0");
        DataSourceConfigRow other = ds("o1", "其他", "", "1");
        when(dataSourceConfigMapper.selectAll())
                .thenReturn(Arrays.asList(src, tgtLower, other, tgt, srcLower));

        CandidateGroupVO group = service.queryCandidates();

        List<DataSourceCandidateVO> sources = group.getSources();
        assertEquals(2, sources.size());
        // org null 的 s2 排在 org 有值的 s1 之后
        assertEquals("s1", sources.get(0).getId());
        assertTrue(sources.get(0).isActive());
        assertEquals("s2", sources.get(1).getId());
        assertNull(sources.get(1).getOrg());

        List<DataSourceCandidateVO> targets = group.getTargets();
        assertEquals(2, targets.size());
        // t1 org null 排后，t2 org 有值排前
        assertEquals("t2", targets.get(0).getId());
        assertFalse(targets.get(0).isActive());
        assertEquals("t1", targets.get(1).getId());
        assertTrue(targets.get(1).isActive());
    }

    @Test
    void candidatesShouldDedupeSameIdKeepingFirst() {
        DataSourceConfigRow first = ds("dup", "org1", "SOURCE", "1");
        DataSourceConfigRow second = ds("dup", "org2", "SOURCE", "0");
        when(dataSourceConfigMapper.selectAll()).thenReturn(Arrays.asList(first, second));

        CandidateGroupVO group = service.queryCandidates();

        assertEquals(1, group.getSources().size());
        assertEquals("org1", group.getSources().get(0).getOrg());
        assertTrue(group.getSources().get(0).isActive());
    }

    private static DataSourceConfigRow ds(String id, String org, String category, String fgActive) {
        DataSourceConfigRow row = new DataSourceConfigRow();
        row.setDataSourceId(id);
        row.setDataSourceOrg(org);
        row.setDataSourceCategory(category);
        row.setFgActive(fgActive);
        return row;
    }
}
