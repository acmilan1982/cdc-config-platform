package com.bsoft.cdcconfig.monitor.jobfailure.service;

import com.baomidou.mybatisplus.core.MybatisConfiguration;
import com.baomidou.mybatisplus.core.metadata.TableInfoHelper;
import com.baomidou.mybatisplus.core.toolkit.GlobalConfigUtils;
import com.bsoft.cdcconfig.datasource.entity.DataSource;
import com.bsoft.cdcconfig.datasource.mapper.DataSourceMapper;
import com.bsoft.cdcconfig.monitor.jobfailure.entity.CdcClientMultiple;
import com.bsoft.cdcconfig.monitor.jobfailure.entity.JobFailureEvent;
import com.bsoft.cdcconfig.monitor.jobfailure.entity.JobFailureHandleLog;
import com.bsoft.cdcconfig.monitor.jobfailure.mapper.CdcClientMultipleMapper;
import com.bsoft.cdcconfig.monitor.jobfailure.mapper.JobFailureEventMapper;
import com.bsoft.cdcconfig.monitor.jobfailure.mapper.JobFailureHandleLogMapper;
import com.bsoft.cdcconfig.monitor.jobfailure.runtime.JobRuntimeStatusReader;
import com.bsoft.cdcconfig.monitor.jobfailure.service.impl.JobFailureServiceImpl;
import com.bsoft.cdcconfig.monitor.jobfailure.vo.FaultProcessDetailVO;
import org.apache.ibatis.builder.MapperBuilderAssistant;
import org.junit.jupiter.api.BeforeAll;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.mockito.junit.jupiter.MockitoSettings;
import org.mockito.quality.Strictness;

import java.time.LocalDateTime;
import java.util.Arrays;
import java.util.Collections;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertNotNull;
import static org.junit.jupiter.api.Assertions.assertNull;
import static org.junit.jupiter.api.Assertions.assertTrue;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.times;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.verifyNoInteractions;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
@MockitoSettings(strictness = Strictness.LENIENT)
class JobFailureDetailDataSourceTest {

    private static final String CLIENT_ID = "hosp-012";
    private static final String DS_ID = "112-source-19c";
    private static final long ROOT_ID = 341473352776552448L;
    private static final String ROOT_ID_TEXT = "341473352776552448";
    private static final String JOB_A = "aaaaaaaa0000bbbbbbbb1111cccccccc2222";
    private static final String JOB_B = "bbbbbbbb2222cccccccc3333dddddddd4444";
    private static final LocalDateTime T0 = LocalDateTime.of(2026, 7, 27, 19, 17, 24);
    private static final LocalDateTime T1 = LocalDateTime.of(2026, 7, 27, 19, 17, 43);
    private static final LocalDateTime T2 = LocalDateTime.of(2026, 7, 27, 19, 18, 43);
    private static final LocalDateTime T3 = LocalDateTime.of(2026, 7, 27, 19, 18, 44);
    private static final LocalDateTime T4 = LocalDateTime.of(2026, 7, 27, 19, 23, 44);

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

    private JobFailureServiceImpl service;

    @BeforeAll
    static void initMybatisPlusLambdaCache() {
        MybatisConfiguration configuration = new MybatisConfiguration();
        GlobalConfigUtils.setGlobalConfig(configuration, GlobalConfigUtils.defaults());
        MapperBuilderAssistant assistant = new MapperBuilderAssistant(configuration, "");
        TableInfoHelper.initTableInfo(assistant, CdcClientMultiple.class);
        TableInfoHelper.initTableInfo(assistant, JobFailureEvent.class);
        TableInfoHelper.initTableInfo(assistant, JobFailureHandleLog.class);
    }

    @BeforeEach
    void setUp() {
        service = new JobFailureServiceImpl(eventMapper, logMapper, clientMultipleMapper, dataSourceMapper, runtimeStatusReader);
    }

    private JobFailureEvent event(Long id, String failedJobId, LocalDateTime time, String eventResult) {
        JobFailureEvent e = new JobFailureEvent();
        e.setId(id);
        e.setClientId(CLIENT_ID);
        e.setDataSourceId(DS_ID);
        e.setFailedJobId(failedJobId);
        e.setFailureTime(time);
        e.setEventResult(eventResult);
        e.setCreatedAt(time.plusMinutes(1));
        return e;
    }

    private JobFailureHandleLog log(Long id, Long eventId, String stage, LocalDateTime time, String newJobId) {
        JobFailureHandleLog l = new JobFailureHandleLog();
        l.setId(id);
        l.setFailureEventId(eventId);
        l.setHandleStage(stage);
        l.setHandleTime(time);
        l.setNewJobId(newJobId);
        return l;
    }

    private DataSource ds(String id, String org, String fgActive) {
        DataSource d = new DataSource();
        d.setDataSourceId(id);
        d.setDataSourceOrg(org);
        d.setFgActive(fgActive);
        return d;
    }

    private void stubFaultProcess(DataSource dsConfig) {
        JobFailureEvent e1 = event(ROOT_ID, JOB_A, T0, "ACCEPTED");
        when(eventMapper.selectList(any())).thenReturn(Collections.singletonList(e1));
        when(logMapper.selectList(any())).thenReturn(Arrays.asList(
                log(101L, ROOT_ID, "JOB_FAILURE_RECEIVED", T1, null),
                log(102L, ROOT_ID, "RESTART_SCHEDULED", T1, null),
                log(103L, ROOT_ID, "RESTART_STARTED", T2, null),
                log(104L, ROOT_ID, "NEW_JOB_SUBMIT_SUCCEEDED", T3, JOB_B),
                log(105L, ROOT_ID, "STABLE_CHECK_PASSED", T4, JOB_B)));
        when(dataSourceMapper.selectById(DS_ID)).thenReturn(dsConfig);
    }

    // ==================== API-2 data source contract ====================

    @Test
    void latestFault_shouldReturnActiveDataSourceWithOrg() {
        stubFaultProcess(ds(DS_ID, "孝感市第一人民医院", "1"));

        FaultProcessDetailVO vo = service.getLatestFault(CLIENT_ID, DS_ID);

        assertNotNull(vo);
        assertTrue(vo.isDataSourceExists());
        assertEquals(Boolean.TRUE, vo.getDataSourceActive());
        assertEquals("孝感市第一人民医院", vo.getDataSourceOrg());
    }

    @Test
    void latestFault_shouldReturnActiveDataSourceWithEmptyOrg() {
        stubFaultProcess(ds(DS_ID, "", "1"));

        FaultProcessDetailVO vo = service.getLatestFault(CLIENT_ID, DS_ID);

        assertTrue(vo.isDataSourceExists());
        assertEquals(Boolean.TRUE, vo.getDataSourceActive());
        assertEquals("", vo.getDataSourceOrg());
    }

    @Test
    void latestFault_shouldReturnInactiveDataSourceWithOrg() {
        stubFaultProcess(ds(DS_ID, "org-b", "0"));

        FaultProcessDetailVO vo = service.getLatestFault(CLIENT_ID, DS_ID);

        assertTrue(vo.isDataSourceExists());
        assertEquals(Boolean.FALSE, vo.getDataSourceActive());
        assertEquals("org-b", vo.getDataSourceOrg());
    }

    @Test
    void latestFault_shouldReturnInactiveDataSourceWithEmptyOrg() {
        stubFaultProcess(ds(DS_ID, "", "0"));

        FaultProcessDetailVO vo = service.getLatestFault(CLIENT_ID, DS_ID);

        assertTrue(vo.isDataSourceExists());
        assertEquals(Boolean.FALSE, vo.getDataSourceActive());
        assertEquals("", vo.getDataSourceOrg());
    }

    @Test
    void latestFault_shouldReturnDetailWhenDataSourceMissing() {
        stubFaultProcess(null);

        FaultProcessDetailVO vo = service.getLatestFault(CLIENT_ID, DS_ID);

        assertNotNull(vo);
        assertFalse(vo.isDataSourceExists());
        assertNull(vo.getDataSourceActive());
        assertNull(vo.getDataSourceOrg());
        assertNotNull(vo.getFaultRootId());
        assertNotNull(vo.getJobChain());
        assertNotNull(vo.getMainChainEvents());
        assertNotNull(vo.getHandleTimeline());
    }

    // ==================== API-4 data source contract ====================

    @Test
    void processDetail_shouldReturnDataSourceFields() {
        stubFaultProcess(ds(DS_ID, "孝感市第一人民医院", "1"));
        when(eventMapper.selectById(ROOT_ID)).thenReturn(event(ROOT_ID, JOB_A, T0, "ACCEPTED"));

        FaultProcessDetailVO vo = service.getProcessDetail(ROOT_ID);

        assertNotNull(vo);
        assertTrue(vo.isDataSourceExists());
        assertEquals(Boolean.TRUE, vo.getDataSourceActive());
        assertEquals("孝感市第一人民医院", vo.getDataSourceOrg());
        assertEquals(Long.valueOf(ROOT_ID), vo.getFaultRootId());
        assertEquals(ROOT_ID_TEXT, vo.getFaultRootIdText());
    }

    // ==================== Query cardinality ====================

    @Test
    void latestFault_shouldQueryDataSourceOnce() {
        stubFaultProcess(ds(DS_ID, "孝感市第一人民医院", "1"));

        service.getLatestFault(CLIENT_ID, DS_ID);

        verify(dataSourceMapper, times(1)).selectById(DS_ID);
        verify(dataSourceMapper, never()).selectBatchIds(any());
    }

    @Test
    void processDetail_shouldQueryDataSourceOnce() {
        stubFaultProcess(ds(DS_ID, "孝感市第一人民医院", "1"));
        when(eventMapper.selectById(ROOT_ID)).thenReturn(event(ROOT_ID, JOB_A, T0, "ACCEPTED"));

        service.getProcessDetail(ROOT_ID);

        verify(dataSourceMapper, times(1)).selectById(DS_ID);
        verify(dataSourceMapper, never()).selectBatchIds(any());
    }

    // ==================== faultRootIdText precision ====================

    @Test
    void faultRootIdText_shouldPreserveFullSnowflakePrecision() {
        stubFaultProcess(ds(DS_ID, "孝感市第一人民医院", "1"));

        FaultProcessDetailVO vo = service.getLatestFault(CLIENT_ID, DS_ID);

        assertEquals(ROOT_ID, vo.getFaultRootId().longValue());
        assertEquals(ROOT_ID_TEXT, vo.getFaultRootIdText());
    }

    // ==================== Original fields preserved ====================

    @Test
    void latestFault_shouldPreserveOriginalFields() {
        stubFaultProcess(ds(DS_ID, "孝感市第一人民医院", "1"));

        FaultProcessDetailVO vo = service.getLatestFault(CLIENT_ID, DS_ID);

        assertEquals(CLIENT_ID, vo.getClientId());
        assertEquals(DS_ID, vo.getDataSourceId());
        assertNotNull(vo.getFirstFailureTime());
        assertNotNull(vo.getLastHandleTime());
        assertNotNull(vo.getJobChain());
        assertFalse(vo.getJobChain().isEmpty());
        assertNotNull(vo.getMainChainEvents());
        assertFalse(vo.getMainChainEvents().isEmpty());
        assertNotNull(vo.getHandleTimeline());
        assertFalse(vo.getHandleTimeline().isEmpty());
        assertEquals(1, vo.getRestartCount());
        assertNotNull(vo.getRecordStatus());
        assertNotNull(vo.getFaultProcessResult());
    }

    // ==================== No ZK / write access ====================

    @Test
    void detailBuild_shouldNotInvokeRuntimeStatusReader() {
        stubFaultProcess(ds(DS_ID, "孝感市第一人民医院", "1"));
        when(eventMapper.selectById(ROOT_ID)).thenReturn(event(ROOT_ID, JOB_A, T0, "ACCEPTED"));

        service.getLatestFault(CLIENT_ID, DS_ID);
        service.getProcessDetail(ROOT_ID);

        verifyNoInteractions(runtimeStatusReader);
    }
}
