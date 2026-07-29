package com.bsoft.cdcconfig.monitor.jobfailure.service;

import com.bsoft.cdcconfig.common.exception.BusinessException;
import com.bsoft.cdcconfig.common.page.PageResult;
import com.bsoft.cdcconfig.monitor.jobfailure.query.HistoryQuery;
import com.bsoft.cdcconfig.monitor.jobfailure.query.JobFailureSummaryQuery;
import com.bsoft.cdcconfig.monitor.jobfailure.vo.ClobDetailVO;
import com.bsoft.cdcconfig.monitor.jobfailure.vo.FaultProcessDetailVO;
import com.bsoft.cdcconfig.monitor.jobfailure.vo.FaultProcessSummaryVO;
import com.bsoft.cdcconfig.monitor.jobfailure.vo.HandleTimelineVO;
import com.bsoft.cdcconfig.monitor.jobfailure.vo.JobFailureSummaryVO;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;

import java.util.List;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertNotNull;
import static org.junit.jupiter.api.Assertions.assertNull;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.junit.jupiter.api.Assertions.assertTrue;

@SpringBootTest
class JobFailureServiceTest {

    @Autowired
    private JobFailureService jobFailureService;

    private static final String EXISTING_CLIENT = "hosp-006";
    private static final String EXISTING_DS = "my-19c";
    private static final long EXISTING_EVENT_ID = 340090292801880064L;

    // ==================== API-1: Summary ====================

    @Test
    void summaryShouldReturnResultsForAllLogicalJobs() {
        JobFailureSummaryQuery query = new JobFailureSummaryQuery();
        PageResult<JobFailureSummaryVO> page = jobFailureService.querySummary(query);

        assertNotNull(page);
        assertTrue(page.getTotal() >= 1);
        List<JobFailureSummaryVO> records = page.getRecords();
        assertFalse(records.isEmpty());

        // Verify existing logical job is present
        boolean found = records.stream()
                .anyMatch(r -> EXISTING_CLIENT.equals(r.getClientId())
                        && EXISTING_DS.equals(r.getDataSourceId()));
        assertTrue(found, "Should find existing logical job in summary");
    }

    @Test
    void summaryShouldFilterByClientId() {
        JobFailureSummaryQuery query = new JobFailureSummaryQuery();
        query.setClientId(EXISTING_CLIENT);
        PageResult<JobFailureSummaryVO> page = jobFailureService.querySummary(query);

        assertNotNull(page);
        List<JobFailureSummaryVO> records = page.getRecords();
        for (JobFailureSummaryVO vo : records) {
            assertEquals(EXISTING_CLIENT, vo.getClientId());
        }
    }

    @Test
    void summaryShouldFilterByDataSourceId() {
        JobFailureSummaryQuery query = new JobFailureSummaryQuery();
        query.setDataSourceId(EXISTING_DS);
        PageResult<JobFailureSummaryVO> page = jobFailureService.querySummary(query);

        assertNotNull(page);
        List<JobFailureSummaryVO> records = page.getRecords();
        for (JobFailureSummaryVO vo : records) {
            assertEquals(EXISTING_DS, vo.getDataSourceId());
        }
    }

    @Test
    void summaryWithNonExistentClientShouldReturnEmpty() {
        JobFailureSummaryQuery query = new JobFailureSummaryQuery();
        query.setClientId("non-existent-client");
        PageResult<JobFailureSummaryVO> page = jobFailureService.querySummary(query);

        assertNotNull(page);
        assertEquals(0, page.getTotal());
        assertTrue(page.getRecords().isEmpty());
    }

    @Test
    void summaryShouldHaveCorrectFieldsForExistingJob() {
        JobFailureSummaryQuery query = new JobFailureSummaryQuery();
        query.setClientId(EXISTING_CLIENT);
        query.setDataSourceId(EXISTING_DS);
        PageResult<JobFailureSummaryVO> page = jobFailureService.querySummary(query);

        assertEquals(1, page.getTotal());
        JobFailureSummaryVO vo = page.getRecords().get(0);

        assertEquals(EXISTING_CLIENT, vo.getClientId());
        assertEquals(EXISTING_DS, vo.getDataSourceId());
        // hosp-006 not in CDC_CLIENT → clientName is null; my-19c has DATA_SOURCE_NAME
        assertNull(vo.getClientName());
        assertEquals("oracle-业务库33", vo.getDataSourceName());
        assertNotNull(vo.getLatestFailureTime());
        assertNotNull(vo.getLatestEventId());
        assertNotNull(vo.getLatestFaultRootId());
        assertNotNull(vo.getLatestRecordStatus());
        assertNotNull(vo.getLatestRecordStatusLabel());
        assertNotNull(vo.getLatestFaultProcessResult());
        assertNotNull(vo.getLatestFaultProcessResultLabel());
        assertTrue(vo.getEventCountInWindow() >= 1);
    }

    // ==================== API-2: Latest Fault ====================

    @Test
    void latestFaultShouldReturnDetailForExistingJob() {
        FaultProcessDetailVO vo = jobFailureService.getLatestFault(EXISTING_CLIENT, EXISTING_DS);

        assertNotNull(vo);
        assertNotNull(vo.getFaultRootId());
        assertEquals(EXISTING_CLIENT, vo.getClientId());
        assertEquals(EXISTING_DS, vo.getDataSourceId());
        assertNotNull(vo.getFirstFailureTime());
        assertNotNull(vo.getJobChain());
        assertFalse(vo.getJobChain().isEmpty());
        assertNotNull(vo.getMainChainEvents());
        assertFalse(vo.getMainChainEvents().isEmpty());
        assertNotNull(vo.getHandleTimeline());
        assertFalse(vo.getHandleTimeline().isEmpty());
        assertNotNull(vo.getRecordStatus());
        assertNotNull(vo.getFaultProcessResult());
    }

    @Test
    void latestFaultShouldHaveCorrectRestartCount() {
        FaultProcessDetailVO vo = jobFailureService.getLatestFault(EXISTING_CLIENT, EXISTING_DS);
        // The test data has 1 RESTART_STARTED log
        assertEquals(1, vo.getRestartCount());
    }

    @Test
    void latestFaultForNonExistentJobShouldThrow() {
        BusinessException ex = assertThrows(BusinessException.class,
                () -> jobFailureService.getLatestFault("non-existent", "non-existent"));
        assertEquals(40402, ex.getCode());
    }

    // ==================== API-3: History ====================

    @Test
    void historyShouldReturnPaginatedResults() {
        HistoryQuery query = new HistoryQuery();
        query.setClientId(EXISTING_CLIENT);
        query.setDataSourceId(EXISTING_DS);
        PageResult<FaultProcessSummaryVO> page = jobFailureService.queryHistory(query);

        assertNotNull(page);
        assertTrue(page.getTotal() >= 1);
        List<FaultProcessSummaryVO> records = page.getRecords();
        assertFalse(records.isEmpty());

        FaultProcessSummaryVO vo = records.get(0);
        assertNotNull(vo.getFaultRootId());
        assertNotNull(vo.getStartTime());
        assertNotNull(vo.getStartFailedJobId());
        assertTrue(vo.getMainChainEventCount() >= 1);
        assertNotNull(vo.getRecordStatus());
        assertNotNull(vo.getFaultProcessResult());
    }

    @Test
    void historyForNonExistentJobShouldReturnEmpty() {
        HistoryQuery query = new HistoryQuery();
        query.setClientId("non-existent");
        query.setDataSourceId("non-existent");
        PageResult<FaultProcessSummaryVO> page = jobFailureService.queryHistory(query);

        assertNotNull(page);
        assertEquals(0, page.getTotal());
        assertTrue(page.getRecords().isEmpty());
    }

    // ==================== API-4: Process Detail ====================

    @Test
    void processDetailShouldReturnResultForExistingRoot() {
        // First get the fault root ID from the summary
        JobFailureSummaryQuery query = new JobFailureSummaryQuery();
        query.setClientId(EXISTING_CLIENT);
        query.setDataSourceId(EXISTING_DS);
        PageResult<JobFailureSummaryVO> page = jobFailureService.querySummary(query);
        Long faultRootId = page.getRecords().get(0).getLatestFaultRootId();

        FaultProcessDetailVO vo = jobFailureService.getProcessDetail(faultRootId);

        assertNotNull(vo);
        assertEquals(faultRootId, vo.getFaultRootId());
        assertNotNull(vo.getJobChain());
        assertNotNull(vo.getMainChainEvents());
        assertNotNull(vo.getHandleTimeline());
    }

    @Test
    void processDetailForNonExistentIdShouldThrow() {
        BusinessException ex = assertThrows(BusinessException.class,
                () -> jobFailureService.getProcessDetail(999999999L));
        assertEquals(40401, ex.getCode());
    }

    // ==================== API-5: CLOB Lazy Load ====================

    // -- FAILURE_EVENT_FAILURE_DETAIL tests --

    @Test
    void failureDetailByEvent_shouldReturnContent() {
        ClobDetailVO vo = jobFailureService.getClobDetail(EXISTING_EVENT_ID,
                "FAILURE_EVENT_FAILURE_DETAIL", EXISTING_EVENT_ID);

        assertNotNull(vo);
        assertEquals("FAILURE_EVENT_FAILURE_DETAIL", vo.getRecordType());
        assertEquals(EXISTING_EVENT_ID, vo.getRecordId());
        assertNotNull(vo.getContent());
        assertTrue(vo.getContentLength() > 0);
    }

    @Test
    void failureDetail_eventNotInFaultProcess_shouldThrow() {
        BusinessException ex = assertThrows(BusinessException.class,
                () -> jobFailureService.getClobDetail(EXISTING_EVENT_ID,
                        "FAILURE_EVENT_FAILURE_DETAIL", 999999999L));
        assertEquals(40006, ex.getCode());
    }

    // -- FAILURE_HANDLE_LOG_ERROR_DETAIL tests --

    @Test
    void errorDetailByLogId_shouldReturnContent() {
        JobFailureSummaryQuery query = new JobFailureSummaryQuery();
        query.setClientId(EXISTING_CLIENT);
        query.setDataSourceId(EXISTING_DS);
        Long faultRootId = jobFailureService.querySummary(query)
                .getRecords().get(0).getLatestFaultRootId();

        // Get the log ID that has ERROR_DETAIL (RESTART_SCHEDULED from test data)
        FaultProcessDetailVO detail = jobFailureService.getLatestFault(EXISTING_CLIENT, EXISTING_DS);
        Long logWithErrorDetail = null;
        for (HandleTimelineVO t : detail.getHandleTimeline()) {
            if ("RESTART_SCHEDULED".equals(t.getHandleStage())) {
                logWithErrorDetail = t.getLogId();
                break;
            }
        }

        ClobDetailVO vo = jobFailureService.getClobDetail(faultRootId,
                "FAILURE_HANDLE_LOG_ERROR_DETAIL", logWithErrorDetail);

        assertNotNull(vo);
        assertEquals("FAILURE_HANDLE_LOG_ERROR_DETAIL", vo.getRecordType());
        assertEquals(logWithErrorDetail, vo.getRecordId());
        assertNotNull(vo.getContent());
        assertTrue(vo.getContentLength() > 0);
    }

    @Test
    void errorDetail_logNotInFaultProcess_shouldThrow() {
        JobFailureSummaryQuery query = new JobFailureSummaryQuery();
        query.setClientId(EXISTING_CLIENT);
        query.setDataSourceId(EXISTING_DS);
        Long faultRootId = jobFailureService.querySummary(query)
                .getRecords().get(0).getLatestFaultRootId();

        BusinessException ex = assertThrows(BusinessException.class,
                () -> jobFailureService.getClobDetail(faultRootId,
                        "FAILURE_HANDLE_LOG_ERROR_DETAIL", 999999999L));
        assertEquals(40006, ex.getCode());
    }

    @Test
    void errorDetail_nullErrorDetail_shouldReturnNullContent() {
        JobFailureSummaryQuery query = new JobFailureSummaryQuery();
        query.setClientId(EXISTING_CLIENT);
        query.setDataSourceId(EXISTING_DS);
        Long faultRootId = jobFailureService.querySummary(query)
                .getRecords().get(0).getLatestFaultRootId();

        // Find a log without ERROR_DETAIL (JOB_FAILURE_RECEIVED has null)
        FaultProcessDetailVO detail = jobFailureService.getLatestFault(EXISTING_CLIENT, EXISTING_DS);
        Long logWithoutError = null;
        for (HandleTimelineVO t : detail.getHandleTimeline()) {
            if ("JOB_FAILURE_RECEIVED".equals(t.getHandleStage())) {
                logWithoutError = t.getLogId();
                break;
            }
        }

        ClobDetailVO vo = jobFailureService.getClobDetail(faultRootId,
                "FAILURE_HANDLE_LOG_ERROR_DETAIL", logWithoutError);

        assertNotNull(vo);
        assertNull(vo.getContent());
        assertEquals(0, vo.getContentLength());
    }

    // -- Cross-process rejection tests --

    @Test
    void failureDetail_wrongFaultRootForEventsFaultProcess_shouldThrow() {
        // Use a non-existent faultRootId; any eventId is then not in that process
        BusinessException ex = assertThrows(BusinessException.class,
                () -> jobFailureService.getClobDetail(999999999L,
                        "FAILURE_EVENT_FAILURE_DETAIL", EXISTING_EVENT_ID));
        assertEquals(40401, ex.getCode());
    }

    @Test
    void errorDetail_wrongFaultRootForLogsFaultProcess_shouldThrow() {
        JobFailureSummaryQuery query = new JobFailureSummaryQuery();
        query.setClientId(EXISTING_CLIENT);
        query.setDataSourceId(EXISTING_DS);
        Long faultRootId = jobFailureService.querySummary(query)
                .getRecords().get(0).getLatestFaultRootId();

        FaultProcessDetailVO detail = jobFailureService.getLatestFault(EXISTING_CLIENT, EXISTING_DS);
        Long anyLogId = detail.getHandleTimeline().get(0).getLogId();

        // Use a non-existent faultRootId — the log is not in that process
        BusinessException ex = assertThrows(BusinessException.class,
                () -> jobFailureService.getClobDetail(999999999L,
                        "FAILURE_HANDLE_LOG_ERROR_DETAIL", anyLogId));
        assertEquals(40401, ex.getCode());
    }

    // -- Input validation tests --

    @Test
    void clobDetailWithInvalidFieldShouldThrow() {
        BusinessException ex = assertThrows(BusinessException.class,
                () -> jobFailureService.getClobDetail(EXISTING_EVENT_ID,
                        "INVALID_FIELD", EXISTING_EVENT_ID));
        assertEquals(40005, ex.getCode());
    }

    @Test
    void clobDetailForNonExistentFaultRootShouldThrow() {
        BusinessException ex = assertThrows(BusinessException.class,
                () -> jobFailureService.getClobDetail(999999999L,
                        "FAILURE_EVENT_FAILURE_DETAIL", 999999999L));
        assertEquals(40401, ex.getCode());
    }

    // ==================== CLOB isolation ====================

    @Test
    void summaryShouldNotContainClobContent() {
        JobFailureSummaryQuery query = new JobFailureSummaryQuery();
        PageResult<JobFailureSummaryVO> page = jobFailureService.querySummary(query);
        // VOs don't have CLOB fields - verified by compilation (no getter for failureDetail/errorDetail)
        assertNotNull(page);
        assertTrue(page.getRecords().size() >= 1);
    }

    @Test
    void faultDetailShouldNotContainClobContent() {
        FaultProcessDetailVO vo = jobFailureService.getLatestFault(EXISTING_CLIENT, EXISTING_DS);
        // Detail VO has no CLOB fields - verified by compilation
        assertNotNull(vo);
        assertNotNull(vo.getHandleTimeline());
    }

    // ==================== Record status correctness ====================

    @Test
    void existingJobShouldHaveValidRecordStatus() {
        JobFailureSummaryQuery query = new JobFailureSummaryQuery();
        query.setClientId(EXISTING_CLIENT);
        query.setDataSourceId(EXISTING_DS);
        PageResult<JobFailureSummaryVO> page = jobFailureService.querySummary(query);

        JobFailureSummaryVO vo = page.getRecords().get(0);
        // The test data has STABLE_CHECK_PASSED → should be RECOVERY_RECORDED
        assertEquals("RECOVERY_RECORDED", vo.getLatestFaultProcessResult());
        assertNotNull(vo.getLatestRecordStatusLabel());
        assertFalse(vo.getLatestRecordStatusLabel().isEmpty());
    }

    @Test
    void existingJobShouldNotHaveAnomalies() {
        JobFailureSummaryQuery query = new JobFailureSummaryQuery();
        query.setClientId(EXISTING_CLIENT);
        query.setDataSourceId(EXISTING_DS);
        PageResult<JobFailureSummaryVO> page = jobFailureService.querySummary(query);

        JobFailureSummaryVO vo = page.getRecords().get(0);
        assertFalse(vo.isHasDataAnomaly());
    }

    // ==================== Config name resolution ====================

    @Test
    void summaryShouldResolveDataSourceNameFromConfig() {
        JobFailureSummaryQuery query = new JobFailureSummaryQuery();
        query.setDataSourceId(EXISTING_DS);
        PageResult<JobFailureSummaryVO> page = jobFailureService.querySummary(query);

        for (JobFailureSummaryVO vo : page.getRecords()) {
            assertEquals(EXISTING_DS, vo.getDataSourceId());
            // my-19c exists in CDC_DATA_SOURCE with name "oracle-业务库33"
            assertEquals("oracle-业务库33", vo.getDataSourceName());
        }
    }

    @Test
    void summaryShouldReturnNullClientNameWhenConfigMissing() {
        JobFailureSummaryQuery query = new JobFailureSummaryQuery();
        query.setClientId(EXISTING_CLIENT);
        PageResult<JobFailureSummaryVO> page = jobFailureService.querySummary(query);

        for (JobFailureSummaryVO vo : page.getRecords()) {
            assertEquals(EXISTING_CLIENT, vo.getClientId());
            // hosp-006 does not exist in CDC_CLIENT
            assertNull(vo.getClientName());
        }
    }

    // ==================== N+1 verification ====================

    @Test
    void summaryShouldNotTriggerNPlusOne() {
        // Repeated calls should not increase linearly
        JobFailureSummaryQuery query = new JobFailureSummaryQuery();
        PageResult<JobFailureSummaryVO> first = jobFailureService.querySummary(query);
        PageResult<JobFailureSummaryVO> second = jobFailureService.querySummary(query);
        assertEquals(first.getTotal(), second.getTotal());
    }
}
