package com.bsoft.cdcconfig.monitor.datasourcerunstate.service.impl;

import com.bsoft.cdcconfig.common.exception.BusinessException;
import com.bsoft.cdcconfig.monitor.datasourcerunstate.constant.DataSourceRunStateConstants;
import com.bsoft.cdcconfig.monitor.datasourcerunstate.mapper.DataSourceRunStateMapper;
import com.bsoft.cdcconfig.monitor.datasourcerunstate.mapper.RunStateClientMapper;
import com.bsoft.cdcconfig.monitor.datasourcerunstate.mapper.RunStateDataSourceMapper;
import com.bsoft.cdcconfig.monitor.datasourcerunstate.model.DataSourceRunStateRow;
import com.bsoft.cdcconfig.monitor.datasourcerunstate.model.RunStateClientRow;
import com.bsoft.cdcconfig.monitor.datasourcerunstate.model.RunStateDataSourceRow;
import com.bsoft.cdcconfig.monitor.datasourcerunstate.query.DataSourceRunStateQuery;
import com.bsoft.cdcconfig.monitor.datasourcerunstate.vo.CandidateGroupVO;
import com.bsoft.cdcconfig.monitor.datasourcerunstate.vo.ClientCandidateVO;
import com.bsoft.cdcconfig.monitor.datasourcerunstate.vo.SnapshotStatusItemVO;
import com.bsoft.cdcconfig.monitor.datasourcerunstate.vo.SnapshotStatusListVO;
import com.bsoft.cdcconfig.monitor.datasourcerunstate.vo.SourceCandidateVO;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.mockito.junit.jupiter.MockitoSettings;
import org.mockito.quality.Strictness;

import java.util.Arrays;
import java.util.Collections;
import java.util.List;
import java.util.stream.Collectors;
import java.util.stream.IntStream;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertNull;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.junit.jupiter.api.Assertions.assertTrue;
import static org.mockito.Mockito.when;

/**
 * DataSourceRunStateQueryServiceImpl 纯 Mockito 单测（不连接数据库）。
 * 覆盖过滤 OR/AND/全部、状态分类与排序、候选全量派生不被收窄、关联异常保行、
 * NULL 时间透传与错误码（41001/41002）。
 */
@ExtendWith(MockitoExtension.class)
@MockitoSettings(strictness = Strictness.LENIENT)
class DataSourceRunStateQueryServiceImplTest {

    @Mock
    private DataSourceRunStateMapper dataSourceRunStateMapper;
    @Mock
    private RunStateClientMapper runStateClientMapper;
    @Mock
    private RunStateDataSourceMapper runStateDataSourceMapper;

    private DataSourceRunStateQueryServiceImpl service;

    @BeforeEach
    void setUp() {
        service = new DataSourceRunStateQueryServiceImpl(
                dataSourceRunStateMapper, runStateClientMapper, runStateDataSourceMapper);
        when(runStateClientMapper.selectAll()).thenReturn(Collections.emptyList());
        when(runStateDataSourceMapper.selectAll()).thenReturn(Collections.emptyList());
    }

    private static DataSourceRunStateRow row(String client, String source, String rawStatus,
                                             String lastSeen, String completed, String updatedAt) {
        DataSourceRunStateRow r = new DataSourceRunStateRow();
        r.setClientId(client);
        r.setDataSourceId(source);
        r.setSnapshotStatus(rawStatus);
        r.setSnapshotLastSeenAt(lastSeen);
        r.setSnapshotCompletedAt(completed);
        r.setUpdatedAt(updatedAt);
        return r;
    }

    private static RunStateClientRow client(String id, String desc, String fgActive) {
        RunStateClientRow c = new RunStateClientRow();
        c.setClientId(id);
        c.setClientDesc(desc);
        c.setFgActive(fgActive);
        return c;
    }

    private static RunStateDataSourceRow source(String id, String org, String category, String fgActive) {
        RunStateDataSourceRow s = new RunStateDataSourceRow();
        s.setDataSourceId(id);
        s.setDataSourceOrg(org);
        s.setDataSourceCategory(category);
        s.setFgActive(fgActive);
        return s;
    }

    private static DataSourceRunStateQuery query() {
        return new DataSourceRunStateQuery();
    }

    private static SnapshotStatusItemVO byClientId(List<SnapshotStatusItemVO> records, String clientId) {
        return records.stream().filter(r -> clientId.equals(r.getClientId()))
                .findFirst()
                .orElseThrow(() -> new AssertionError("row not found: " + clientId));
    }

    // ==================== 全量 + 固定排序 ====================

    @Test
    void noConditionShouldReturnAllRowsGroupedByStatusThenUpdatedAtDesc() {
        when(dataSourceRunStateMapper.selectAll()).thenReturn(Arrays.asList(
                row("c1", "s1", "SNAPSHOT_RUNNING", "2026-08-17 10:00:00", null, "2026-08-17 10:00:00"),
                row("c2", "s3", "SNAPSHOT_RUNNING", null, null, "2026-08-17 12:00:00"),
                row("c3", "s4", "SNAPSHOT_READY", null, "2026-08-17 09:00:00", "2026-08-17 09:00:00"),
                row("c4", "s2", "SNAPSHOT_COMPLETED", "2026-08-17 08:00:00", "2026-08-17 08:02:00", "2026-08-17 08:02:00")));

        SnapshotStatusListVO vo = service.queryList(query());

        List<String> ids = vo.getRecords().stream()
                .map(r -> r.getClientId() + "/" + r.getSourceId())
                .collect(Collectors.toList());
        // RUNNING(先) → UNKNOWN → COMPLETED；RUNNING 组内 updatedAt 倒序
        assertEquals(Arrays.asList("c2/s3", "c1/s1", "c3/s4", "c4/s2"), ids);

        SnapshotStatusItemVO unknown = vo.getRecords().get(2);
        assertEquals("SNAPSHOT_READY", unknown.getSnapshotStatus());
        assertEquals("UNKNOWN", unknown.getStatusCategory());
    }

    @Test
    void sortTieShouldBreakByClientIdThenSourceIdAsc() {
        when(dataSourceRunStateMapper.selectAll()).thenReturn(Arrays.asList(
                row("b", "s1", "SNAPSHOT_COMPLETED", null, null, "2026-08-17 08:00:00"),
                row("a", "s9", "SNAPSHOT_COMPLETED", null, null, "2026-08-17 08:00:00"),
                row("a", "s1", "SNAPSHOT_COMPLETED", null, null, "2026-08-17 08:00:00")));

        SnapshotStatusListVO vo = service.queryList(query());

        List<String> ids = vo.getRecords().stream()
                .map(r -> r.getClientId() + "/" + r.getSourceId())
                .collect(Collectors.toList());
        assertEquals(Arrays.asList("a/s1", "a/s9", "b/s1"), ids);
    }

    // ==================== 同维 OR / 跨维 AND / “全部” ====================

    @Test
    void sameDimensionClientIdsShouldBeOr() {
        when(dataSourceRunStateMapper.selectAll()).thenReturn(Arrays.asList(
                row("c1", "s1", "SNAPSHOT_RUNNING", null, null, "2026-08-17 10:00:00"),
                row("c2", "s1", "SNAPSHOT_RUNNING", null, null, "2026-08-17 10:00:00"),
                row("c3", "s1", "SNAPSHOT_RUNNING", null, null, "2026-08-17 10:00:00")));

        DataSourceRunStateQuery q = query();
        q.setClientId(Arrays.asList("c1", "c3"));

        List<SnapshotStatusItemVO> records = service.queryList(q).getRecords();
        assertEquals(2, records.size());
        assertTrue(records.stream().anyMatch(r -> r.getClientId().equals("c1")));
        assertTrue(records.stream().anyMatch(r -> r.getClientId().equals("c3")));
        assertTrue(records.stream().noneMatch(r -> r.getClientId().equals("c2")));
    }

    @Test
    void crossDimensionShouldBeAnd() {
        when(dataSourceRunStateMapper.selectAll()).thenReturn(Arrays.asList(
                row("c1", "s1", "SNAPSHOT_RUNNING", null, null, "2026-08-17 10:00:00"),
                row("c1", "s2", "SNAPSHOT_RUNNING", null, null, "2026-08-17 10:00:00"),
                row("c2", "s1", "SNAPSHOT_RUNNING", null, null, "2026-08-17 10:00:00")));

        DataSourceRunStateQuery q = query();
        q.setClientId(Collections.singletonList("c1"));
        q.setSourceId(Collections.singletonList("s1"));

        List<SnapshotStatusItemVO> records = service.queryList(q).getRecords();
        assertEquals(1, records.size());
        assertEquals("c1", records.get(0).getClientId());
        assertEquals("s1", records.get(0).getSourceId());
    }

    @Test
    void absentOrBlankDimensionShouldMeanAll() {
        when(dataSourceRunStateMapper.selectAll()).thenReturn(Arrays.asList(
                row("c1", "s1", "SNAPSHOT_RUNNING", null, null, "2026-08-17 10:00:00"),
                row("c2", "s2", "SNAPSHOT_COMPLETED", null, null, "2026-08-17 10:00:00")));

        DataSourceRunStateQuery q = query();
        q.setClientId(Arrays.asList("   ", "", null));

        // 归一后为空集合 → 该维“全部”，不应收窄
        assertEquals(2, service.queryList(q).getRecords().size());
    }

    // ==================== 状态 token 过滤 ====================

    @Test
    void statusRunningTokenShouldMatchOnlyRunningRawRows() {
        when(dataSourceRunStateMapper.selectAll()).thenReturn(Arrays.asList(
                row("c1", "s1", "SNAPSHOT_RUNNING", null, null, "2026-08-17 10:00:00"),
                row("c2", "s2", "SNAPSHOT_COMPLETED", null, null, "2026-08-17 10:00:00"),
                row("c3", "s3", "SNAPSHOT_READY", null, null, "2026-08-17 10:00:00")));

        DataSourceRunStateQuery q = query();
        q.setStatus(Collections.singletonList("RUNNING"));

        List<SnapshotStatusItemVO> records = service.queryList(q).getRecords();
        assertEquals(1, records.size());
        assertEquals("c1", records.get(0).getClientId());
    }

    @Test
    void statusUnknownTokenShouldMatchRowsWhoseRawIsNeitherKnownValue() {
        when(dataSourceRunStateMapper.selectAll()).thenReturn(Arrays.asList(
                row("c1", "s1", "SNAPSHOT_RUNNING", null, null, "2026-08-17 10:00:00"),
                row("c2", "s2", "SNAPSHOT_COMPLETED", null, null, "2026-08-17 10:00:00"),
                row("c3", "s3", "SNAPSHOT_READY", null, null, "2026-08-17 10:00:00")));

        DataSourceRunStateQuery q = query();
        q.setStatus(Arrays.asList("UNKNOWN", "COMPLETED"));

        List<SnapshotStatusItemVO> records = service.queryList(q).getRecords();
        assertEquals(2, records.size());
        assertTrue(records.stream().anyMatch(r -> r.getClientId().equals("c2")));
        assertTrue(records.stream().anyMatch(r -> r.getClientId().equals("c3")));
    }

    @Test
    void statusFilterShouldNotBeDisturbedByConfigMissingOrInactive() {
        // 三行 RUNNING，但 s2 停用、s3 配置缺失：状态过滤 RUNNING 仍应命中全部三行（保行）
        when(dataSourceRunStateMapper.selectAll()).thenReturn(Arrays.asList(
                row("c1", "s1", "SNAPSHOT_RUNNING", null, null, "2026-08-17 10:00:00"),
                row("c2", "s2", "SNAPSHOT_RUNNING", null, null, "2026-08-17 10:00:00"),
                row("c3", "s3", "SNAPSHOT_RUNNING", null, null, "2026-08-17 10:00:00")));
        when(runStateClientMapper.selectAll()).thenReturn(Collections.singletonList(client("c1", "desc1", "1")));
        when(runStateDataSourceMapper.selectAll()).thenReturn(Arrays.asList(
                source("s1", "org1", "source", "1"),
                source("s2", "org2", "source", "0")));

        DataSourceRunStateQuery q = query();
        q.setStatus(Collections.singletonList("RUNNING"));

        List<SnapshotStatusItemVO> records = service.queryList(q).getRecords();
        assertEquals(3, records.size());
        assertEquals(DataSourceRunStateConstants.MAPPING_STATE_INACTIVE, records.get(1).getSourceRef().getState());
        assertEquals(DataSourceRunStateConstants.MAPPING_STATE_NOT_FOUND, records.get(2).getSourceRef().getState());
    }

    // ==================== 空表 / 筛空 / 候选不被收窄 ====================

    @Test
    void emptyTableShouldReturnEmptyRecordsAndEmptyCandidatesWithBothKnownStatuses() {
        when(dataSourceRunStateMapper.selectAll()).thenReturn(Collections.emptyList());

        SnapshotStatusListVO vo = service.queryList(query());

        assertTrue(vo.getRecords().isEmpty());
        assertTrue(vo.getCandidates().getClients().isEmpty());
        assertTrue(vo.getCandidates().getSources().isEmpty());
        assertEquals(Arrays.asList("RUNNING", "COMPLETED"), vo.getCandidates().getStatuses());
    }

    @Test
    void screenedOutShouldReturnEmptyRecordsButNonEmptyCandidates() {
        when(dataSourceRunStateMapper.selectAll()).thenReturn(Arrays.asList(
                row("c1", "s1", "SNAPSHOT_RUNNING", null, null, "2026-08-17 10:00:00")));
        when(runStateClientMapper.selectAll()).thenReturn(Collections.singletonList(client("c1", "desc1", "1")));
        when(runStateDataSourceMapper.selectAll()).thenReturn(Collections.singletonList(source("s1", "org1", "source", "1")));

        DataSourceRunStateQuery q = query();
        q.setStatus(Collections.singletonList("COMPLETED"));

        SnapshotStatusListVO vo = service.queryList(q);
        assertTrue(vo.getRecords().isEmpty());
        assertEquals(1, vo.getCandidates().getClients().size());
        assertEquals(1, vo.getCandidates().getSources().size());
    }

    @Test
    void candidatesShouldNeverBeNarrowedByCurrentFilter() {
        when(dataSourceRunStateMapper.selectAll()).thenReturn(Arrays.asList(
                row("c1", "s1", "SNAPSHOT_RUNNING", null, null, "2026-08-17 10:00:00"),
                row("c2", "s2", "SNAPSHOT_COMPLETED", null, null, "2026-08-17 10:00:00")));

        DataSourceRunStateQuery q = query();
        q.setClientId(Collections.singletonList("c1"));
        q.setStatus(Collections.singletonList("RUNNING"));

        CandidateGroupVO candidates = service.queryList(q).getCandidates();
        // 候选仍覆盖全量两行；状态候选仍为两项已知（无未知行）
        assertEquals(2, candidates.getClients().size());
        assertEquals(2, candidates.getSources().size());
        assertEquals(Arrays.asList("RUNNING", "COMPLETED"), candidates.getStatuses());
    }

    @Test
    void unknownStatusCandidateShouldAppearOnlyWhenUnknownRowExists() {
        when(dataSourceRunStateMapper.selectAll()).thenReturn(Arrays.asList(
                row("c1", "s1", "SNAPSHOT_RUNNING", null, null, "2026-08-17 10:00:00"),
                row("c2", "s2", "SNAPSHOT_WEIRD", null, null, "2026-08-17 10:00:00")));

        CandidateGroupVO candidates = service.queryList(query()).getCandidates();
        assertEquals(Arrays.asList("RUNNING", "COMPLETED", "UNKNOWN"), candidates.getStatuses());

        // 未知行被 status=COMPLETED 筛掉后，候选仍保留 UNKNOWN（候选基于全量，与筛选无关）
        DataSourceRunStateQuery q = query();
        q.setStatus(Collections.singletonList("COMPLETED"));
        assertEquals(Arrays.asList("RUNNING", "COMPLETED", "UNKNOWN"),
                service.queryList(q).getCandidates().getStatuses());
    }

    // ==================== 候选去重与排序 ====================

    @Test
    void candidatesShouldDedupeByAppearedIdsAndSortClientsByIdSourcesByOrgNullsLast() {
        when(dataSourceRunStateMapper.selectAll()).thenReturn(Arrays.asList(
                row("c2", "sB", "SNAPSHOT_RUNNING", null, null, "2026-08-17 10:00:00"),
                row("c1", "sA", "SNAPSHOT_RUNNING", null, null, "2026-08-17 10:00:00"),
                row("c2", "sA", "SNAPSHOT_RUNNING", null, null, "2026-08-17 10:00:00"),
                row("c1", "sZ", "SNAPSHOT_RUNNING", null, null, "2026-08-17 10:00:00")));
        when(runStateClientMapper.selectAll()).thenReturn(Arrays.asList(
                client("c1", "医院一", "1"),
                client("c2", "医院二", "0")));
        when(runStateDataSourceMapper.selectAll()).thenReturn(Arrays.asList(
                source("sB", null, "source", "1"),
                source("sA", "医院A库", "source", "1"),
                source("sZ", "医院Z库", "source", "0")));

        CandidateGroupVO candidates = service.queryList(query()).getCandidates();

        List<String> clientIds = candidates.getClients().stream()
                .map(ClientCandidateVO::getId).collect(Collectors.toList());
        assertEquals(Arrays.asList("c1", "c2"), clientIds);
        assertEquals("医院一", candidates.getClients().get(0).getDesc());
        assertTrue(candidates.getClients().get(0).isActive());
        assertFalse(candidates.getClients().get(1).isActive());

        // 源库候选按 org(空值后置) → id 升序：sA(医院A库) → sZ(医院Z库) → sB(null org)
        List<String> sourceIds = candidates.getSources().stream()
                .map(SourceCandidateVO::getId).collect(Collectors.toList());
        assertEquals(Arrays.asList("sA", "sZ", "sB"), sourceIds);
        assertNull(candidates.getSources().get(2).getOrg());
    }

    // ==================== 关联映射与类别归一 ====================

    @Test
    void refsShouldReflectActiveInactiveNotFoundAndCategoryNormalization() {
        when(dataSourceRunStateMapper.selectAll()).thenReturn(Arrays.asList(
                row("cActive", "sActive", "SNAPSHOT_RUNNING", "2026-08-17 10:00:00", null, "2026-08-17 10:00:00"),
                row("cInactive", "sTarget", "SNAPSHOT_RUNNING", null, null, "2026-08-17 10:00:00"),
                row("cGhost", "sGhost", "SNAPSHOT_RUNNING", null, null, "2026-08-17 10:00:00")));
        when(runStateClientMapper.selectAll()).thenReturn(Arrays.asList(
                client("cActive", "活动探针", "1"),
                client("cInactive", "停用探针", "0")));
        when(runStateDataSourceMapper.selectAll()).thenReturn(Arrays.asList(
                source("sActive", "源库ORG", "source", "1"),
                source("sTarget", "目标库", "TARGET", "0")));

        List<SnapshotStatusItemVO> records = service.queryList(query()).getRecords();
        assertEquals(3, records.size());

        SnapshotStatusItemVO active = byClientId(records, "cActive");
        assertEquals(DataSourceRunStateConstants.MAPPING_STATE_ACTIVE, active.getClientRef().getState());
        assertEquals("活动探针", active.getClientRef().getDesc());
        assertEquals(DataSourceRunStateConstants.MAPPING_STATE_ACTIVE, active.getSourceRef().getState());
        assertEquals("源库ORG", active.getSourceRef().getOrg());
        // 小写 source 归一为 SOURCE → sourceRole=true
        assertEquals("SOURCE", active.getSourceRef().getCategory());
        assertTrue(active.getSourceRef().isSourceRole());

        SnapshotStatusItemVO inactive = byClientId(records, "cInactive");
        assertEquals(DataSourceRunStateConstants.MAPPING_STATE_INACTIVE, inactive.getClientRef().getState());
        assertEquals(DataSourceRunStateConstants.MAPPING_STATE_INACTIVE, inactive.getSourceRef().getState());
        assertEquals("TARGET", inactive.getSourceRef().getCategory());
        assertFalse(inactive.getSourceRef().isSourceRole());

        SnapshotStatusItemVO ghost = byClientId(records, "cGhost");
        assertEquals(DataSourceRunStateConstants.MAPPING_STATE_NOT_FOUND, ghost.getClientRef().getState());
        assertNull(ghost.getClientRef().getDesc());
        assertEquals(DataSourceRunStateConstants.MAPPING_STATE_NOT_FOUND, ghost.getSourceRef().getState());
        assertNull(ghost.getSourceRef().getOrg());
        assertNull(ghost.getSourceRef().getCategory());
        assertFalse(ghost.getSourceRef().isSourceRole());
    }

    @Test
    void blankCategoryShouldYieldNullCategoryAndSourceRoleFalse() {
        when(dataSourceRunStateMapper.selectAll()).thenReturn(Collections.singletonList(
                row("c1", "s1", "SNAPSHOT_RUNNING", null, null, "2026-08-17 10:00:00")));
        when(runStateDataSourceMapper.selectAll()).thenReturn(
                Collections.singletonList(source("s1", "org1", "   ", "1")));

        SnapshotStatusItemVO item = service.queryList(query()).getRecords().get(0);
        assertNull(item.getSourceRef().getCategory());
        assertFalse(item.getSourceRef().isSourceRole());
    }

    // ==================== NULL 时间透传 ====================

    @Test
    void nullTimesShouldPassThroughAsJavaNull() {
        when(dataSourceRunStateMapper.selectAll()).thenReturn(Collections.singletonList(
                row("c1", "s1", "SNAPSHOT_COMPLETED", null, null, "2026-08-17 10:00:00")));

        SnapshotStatusItemVO item = service.queryList(query()).getRecords().get(0);
        assertNull(item.getSnapshotLastSeenAt());
        assertNull(item.getSnapshotCompletedAt());
        assertEquals("2026-08-17 10:00:00", item.getUpdatedAt());
    }

    // ==================== 错误码 ====================

    @Test
    void overLimitFilterIdsShouldThrow41001() {
        List<String> ids = IntStream.rangeClosed(1, 201)
                .mapToObj(i -> "id" + i).collect(Collectors.toList());
        DataSourceRunStateQuery q = query();
        q.setClientId(ids);
        BusinessException e = assertThrows(BusinessException.class, () -> service.queryList(q));
        assertEquals(41001, e.getCode());
    }

    @Test
    void overLimitStatusIdsShouldThrow41001() {
        List<String> tokens = IntStream.rangeClosed(1, 201)
                .mapToObj(i -> "RUNNING").collect(Collectors.toList());
        DataSourceRunStateQuery q = query();
        q.setStatus(tokens);
        BusinessException e = assertThrows(BusinessException.class, () -> service.queryList(q));
        assertEquals(41001, e.getCode());
    }

    @Test
    void illegalStatusTokenIncludingRawValueShouldThrow41002() {
        DataSourceRunStateQuery q1 = query();
        q1.setStatus(Arrays.asList("RUNNING", "FORBIDDEN_STATE"));
        BusinessException e1 = assertThrows(BusinessException.class, () -> service.queryList(q1));
        assertEquals(41002, e1.getCode());

        // 数据库原值当 token 传入也必须判非法（前端只发白名单三类）
        DataSourceRunStateQuery q2 = query();
        q2.setStatus(Collections.singletonList("SNAPSHOT_RUNNING"));
        BusinessException e2 = assertThrows(BusinessException.class, () -> service.queryList(q2));
        assertEquals(41002, e2.getCode());
    }

    @Test
    void duplicateFilterValuesShouldBeDeduplicatedAfterTrim() {
        when(dataSourceRunStateMapper.selectAll()).thenReturn(Collections.singletonList(
                row("c1", "s1", "SNAPSHOT_RUNNING", null, null, "2026-08-17 10:00:00")));

        DataSourceRunStateQuery q = query();
        q.setClientId(Arrays.asList("  c1  ", "c1", "   ", "", "  c1  "));
        List<SnapshotStatusItemVO> records = service.queryList(q).getRecords();
        assertEquals(1, records.size());
        assertEquals("c1", records.get(0).getClientId());
    }
}
