package com.bsoft.cdcconfig.monitor.jobfailure.service;

import com.baomidou.mybatisplus.core.MybatisConfiguration;
import com.baomidou.mybatisplus.core.conditions.query.LambdaQueryWrapper;
import com.baomidou.mybatisplus.core.metadata.TableInfoHelper;
import com.baomidou.mybatisplus.core.toolkit.GlobalConfigUtils;
import com.bsoft.cdcconfig.datasource.entity.DataSource;
import com.bsoft.cdcconfig.datasource.mapper.DataSourceMapper;
import com.bsoft.cdcconfig.monitor.jobfailure.entity.CdcClientMultiple;
import com.bsoft.cdcconfig.monitor.jobfailure.mapper.CdcClientMultipleMapper;
import com.bsoft.cdcconfig.monitor.jobfailure.mapper.JobFailureEventMapper;
import com.bsoft.cdcconfig.monitor.jobfailure.mapper.JobFailureHandleLogMapper;
import com.bsoft.cdcconfig.monitor.jobfailure.runtime.JobRuntimeSnapshot;
import com.bsoft.cdcconfig.monitor.jobfailure.runtime.JobRuntimeStatusReader;
import com.bsoft.cdcconfig.monitor.jobfailure.service.impl.JobFailureServiceImpl;
import com.bsoft.cdcconfig.monitor.jobfailure.vo.JobFailureSummaryVO;
import org.apache.ibatis.builder.MapperBuilderAssistant;
import org.junit.jupiter.api.BeforeAll;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.mockito.junit.jupiter.MockitoSettings;
import org.mockito.quality.Strictness;

import java.util.Arrays;
import java.util.Collections;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertNull;
import static org.junit.jupiter.api.Assertions.assertTrue;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.times;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
@MockitoSettings(strictness = Strictness.LENIENT)
class JobFailureSummaryExpansionTest {

    @Mock
    private JobFailureEventMapper eventMapper;
    @Mock
    private JobFailureHandleLogMapper logMapper;
    @Mock
    private CdcClientMultipleMapper clientMultipleMapper;
    @Mock
    private DataSourceMapper dataSourceMapper;
    @Mock
    private JobRuntimeStatusReader runtimeStatusReader;
    @Mock
    private JobRuntimeSnapshot runtimeSnapshot;

    private JobFailureServiceImpl service;

    @BeforeAll
    static void initMybatisPlusLambdaCache() {
        // Populate MyBatis-Plus TableInfo/lambda cache so LambdaQueryWrapper can
        // resolve CdcClientMultiple::getFgActive to its column name without a Spring context.
        MybatisConfiguration configuration = new MybatisConfiguration();
        GlobalConfigUtils.setGlobalConfig(configuration, GlobalConfigUtils.defaults());
        TableInfoHelper.initTableInfo(new MapperBuilderAssistant(configuration, ""), CdcClientMultiple.class);
    }

    @BeforeEach
    void setUp() {
        when(runtimeStatusReader.snapshot(any())).thenReturn(runtimeSnapshot);
        when(runtimeSnapshot.clientOnline(anyString())).thenReturn(Boolean.TRUE);
        when(runtimeSnapshot.jobOnline(anyString(), anyString())).thenReturn(Boolean.TRUE);
        service = new JobFailureServiceImpl(eventMapper, logMapper, clientMultipleMapper, dataSourceMapper, runtimeStatusReader);
    }

    private CdcClientMultiple client(String clientId, String clientDesc, String dataSourceIds, String fgActive) {
        CdcClientMultiple c = new CdcClientMultiple();
        c.setClientId(clientId);
        c.setClientDesc(clientDesc);
        c.setDataSourceId(dataSourceIds);
        c.setFgActive(fgActive);
        return c;
    }

    private DataSource ds(String dataSourceId, String name, String org, String fgActive) {
        DataSource d = new DataSource();
        d.setDataSourceId(dataSourceId);
        d.setDataSourceName(name);
        d.setDataSourceOrg(org);
        d.setFgActive(fgActive);
        return d;
    }

    private JobFailureSummaryVO findById(List<JobFailureSummaryVO> list, String id) {
        return list.stream()
                .filter(r -> id.equals(r.getDataSourceId()))
                .findFirst().orElse(null);
    }

    @Test
    void expansion_shouldSplitTrimIgnoreEmptyAndPreserveOrder() {
        when(clientMultipleMapper.selectList(any())).thenReturn(Collections.singletonList(
                client("c1", "客户端1", " source-a,source-b, , source-c ", "1")));
        when(eventMapper.selectList(any())).thenReturn(Collections.emptyList());
        when(dataSourceMapper.selectBatchIds(any())).thenReturn(Arrays.asList(
                ds("source-a", "name-a", "org-a", "1"),
                ds("source-b", "name-b", "org-a", "0"),
                ds("source-c", "name-c", "", "0")));

        List<JobFailureSummaryVO> result = service.querySummary();

        assertEquals(3, result.size());
        assertEquals(Arrays.asList("source-a", "source-b", "source-c"),
                result.stream().map(JobFailureSummaryVO::getDataSourceId).collect(Collectors.toList()));
        for (JobFailureSummaryVO vo : result) {
            assertEquals(vo.getDataSourceId(), vo.getDataSourceId().trim(),
                    "dataSourceId must not contain leading/trailing whitespace");
        }
    }

    @Test
    void expansion_shouldKeepDuplicateOrgRows() {
        when(clientMultipleMapper.selectList(any())).thenReturn(Collections.singletonList(
                client("c1", "客户端1", "source-a,source-b", "1")));
        when(eventMapper.selectList(any())).thenReturn(Collections.emptyList());
        when(dataSourceMapper.selectBatchIds(any())).thenReturn(Arrays.asList(
                ds("source-a", "name-a", "org-shared", "1"),
                ds("source-b", "name-b", "org-shared", "1")));

        List<JobFailureSummaryVO> result = service.querySummary();

        assertEquals(2, result.size());
        assertEquals("org-shared", findById(result, "source-a").getDataSourceOrg());
        assertEquals("org-shared", findById(result, "source-b").getDataSourceOrg());
    }

    @Test
    void expansion_shouldMarkActiveInactiveAndUnmatchedStates() {
        when(clientMultipleMapper.selectList(any())).thenReturn(Collections.singletonList(
                client("c1", "客户端1", " source-a,source-b,source-c,source-d ", "1")));
        when(eventMapper.selectList(any())).thenReturn(Collections.emptyList());
        when(dataSourceMapper.selectBatchIds(any())).thenReturn(Arrays.asList(
                ds("source-a", "name-a", "org-a", "1"),
                ds("source-b", "name-b", "org-b", "0"),
                ds("source-c", "name-c", "", "0")));

        List<JobFailureSummaryVO> result = service.querySummary();

        assertEquals(4, result.size());

        JobFailureSummaryVO active = findById(result, "source-a");
        assertTrue(active.isDataSourceExists());
        assertEquals(Boolean.TRUE, active.getDataSourceActive());
        assertEquals("org-a", active.getDataSourceOrg());

        JobFailureSummaryVO inactiveWithOrg = findById(result, "source-b");
        assertTrue(inactiveWithOrg.isDataSourceExists());
        assertEquals(Boolean.FALSE, inactiveWithOrg.getDataSourceActive());
        assertEquals("org-b", inactiveWithOrg.getDataSourceOrg());

        JobFailureSummaryVO inactiveEmptyOrg = findById(result, "source-c");
        assertTrue(inactiveEmptyOrg.isDataSourceExists());
        assertEquals(Boolean.FALSE, inactiveEmptyOrg.getDataSourceActive());
        assertEquals("", inactiveEmptyOrg.getDataSourceOrg());

        JobFailureSummaryVO unmatched = findById(result, "source-d");
        assertTrue(!unmatched.isDataSourceExists());
        assertNull(unmatched.getDataSourceActive());
        assertNull(unmatched.getDataSourceName());
        assertNull(unmatched.getDataSourceOrg());
    }

    @Test
    void expansion_shouldQueryDataSourceOnceWithoutPerIdLookup() {
        when(clientMultipleMapper.selectList(any())).thenReturn(Collections.singletonList(
                client("c1", "客户端1", "source-a,source-b", "1")));
        when(eventMapper.selectList(any())).thenReturn(Collections.emptyList());
        when(dataSourceMapper.selectBatchIds(any())).thenReturn(Arrays.asList(
                ds("source-a", "name-a", "org-a", "1"),
                ds("source-b", "name-b", "org-b", "1")));

        service.querySummary();

        verify(dataSourceMapper, times(1)).selectBatchIds(any());
        verify(dataSourceMapper, never()).selectById(any());
    }

    @Test
    void expansion_allEmptyConfig_shouldReturnEmptyWithoutQuerying() {
        when(clientMultipleMapper.selectList(any())).thenReturn(Collections.singletonList(
                client("c1", "客户端1", " , , ", "1")));

        List<JobFailureSummaryVO> result = service.querySummary();

        assertTrue(result.isEmpty());
        verify(eventMapper, never()).selectList(any());
        verify(dataSourceMapper, never()).selectBatchIds(any());
    }

    @Test
    @SuppressWarnings("unchecked")
    void expansion_shouldPassInvalidAndInactiveDataSourcesToRuntimeSnapshot() {
        when(clientMultipleMapper.selectList(any())).thenReturn(Collections.singletonList(
                client("c1", "客户端1", "source-a,source-b,source-c,source-d", "1")));
        when(eventMapper.selectList(any())).thenReturn(Collections.emptyList());
        when(dataSourceMapper.selectBatchIds(any())).thenReturn(Arrays.asList(
                ds("source-a", "name-a", "org-a", "1"),
                ds("source-b", "name-b", "org-b", "0"),
                ds("source-c", "name-c", "", "0")));

        service.querySummary();

        ArgumentCaptor<Map<String, List<String>>> captor = ArgumentCaptor.forClass(Map.class);
        verify(runtimeStatusReader).snapshot(captor.capture());
        Map<String, List<String>> clientJobs = captor.getValue();
        assertEquals(Arrays.asList("source-a", "source-b", "source-c", "source-d"),
                clientJobs.get("c1"));
    }

    @Test
    void expansion_shouldKeepClientFgActiveFilter() {
        when(clientMultipleMapper.selectList(any())).thenReturn(Collections.singletonList(
                client("c1", "客户端1", "source-a", "1")));
        when(eventMapper.selectList(any())).thenReturn(Collections.emptyList());
        when(dataSourceMapper.selectBatchIds(any())).thenReturn(Collections.singletonList(
                ds("source-a", "name-a", "org-a", "1")));

        service.querySummary();

        ArgumentCaptor<LambdaQueryWrapper<CdcClientMultiple>> captor =
                ArgumentCaptor.forClass(LambdaQueryWrapper.class);
        verify(clientMultipleMapper).selectList(captor.capture());
        LambdaQueryWrapper<CdcClientMultiple> wrapper = captor.getValue();
        String sql = wrapper.getSqlSegment();
        assertTrue(sql.contains("FG_ACTIVE"), "CDC_CLIENT_MULTIPLE.FG_ACTIVE=1 filter must remain");
        Map<String, Object> params = wrapper.getParamNameValuePairs();
        assertTrue(params.containsValue("1"), "FG_ACTIVE filter value must be 1");
    }
}
