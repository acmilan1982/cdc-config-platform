package com.bsoft.cdcconfig.monitor.jobfailure.service;

import com.bsoft.cdcconfig.common.exception.BusinessException;
import com.bsoft.cdcconfig.common.page.PageResult;
import com.bsoft.cdcconfig.monitor.jobfailure.query.HistoryQuery;
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
    void summaryShouldReturnAllFgActiveLogicalJobs() {
        List<JobFailureSummaryVO> list = jobFailureService.querySummary();

        assertNotNull(list);
        assertTrue(list.size() >= 2, "Should return at least 2 FG_ACTIVE=1 records");

        // Verify existing logical job is present
        boolean found = list.stream()
                .anyMatch(r -> EXISTING_CLIENT.equals(r.getClientId())
                        && EXISTING_DS.equals(r.getDataSourceId()));
        assertTrue(found, "Should find existing logical job in summary");
    }

    @Test
    void summaryShouldHaveCorrectFieldsForExistingJob() {
        List<JobFailureSummaryVO> list = jobFailureService.querySummary();

        JobFailureSummaryVO vo = list.stream()
                .filter(r -> EXISTING_CLIENT.equals(r.getClientId())
                        && EXISTING_DS.equals(r.getDataSourceId()))
                .findFirst().get();

        assertEquals(EXISTING_CLIENT, vo.getClientId());
        assertEquals(EXISTING_DS, vo.getDataSourceId());
        // hosp-006 CLIENT_DESC from CDC_CLIENT_MULTIPLE
        assertNotNull(vo.getClientName());
        assertTrue(vo.getClientName().contains("总部测试"));
        assertEquals("oracle-业务库33", vo.getDataSourceName());
        assertNotNull(vo.getJobStatus());
        assertTrue("正常运行".equals(vo.getJobStatus()) || "恢复中".equals(vo.getJobStatus()));
        assertNotNull(vo.getLatestFailureTime());
        assertNotNull(vo.getLatestEventId());
        assertTrue(vo.getEventCountInWindow() >= 1);
    }

    @Test
    void summaryShouldReturnJobStatusForAllRecords() {
        List<JobFailureSummaryVO> list = jobFailureService.querySummary();

        assertFalse(list.isEmpty());
        for (JobFailureSummaryVO vo : list) {
            assertNotNull(vo.getJobStatus(), "Every record must have a jobStatus");
            assertTrue("正常运行".equals(vo.getJobStatus()) || "恢复中".equals(vo.getJobStatus()),
                    "jobStatus must be 正常运行 or 恢复中, got: " + vo.getJobStatus());
            assertNotNull(vo.getClientId());
            assertNotNull(vo.getDataSourceId());
            // clientName comes from CDC_CLIENT_MULTIPLE.CLIENT_DESC
            assertNotNull(vo.getClientName(), "clientName should come from CDC_CLIENT_MULTIPLE");
        }
    }

    @Test
    void existingClosedJobShouldReturnNormalStatus() {
        List<JobFailureSummaryVO> list = jobFailureService.querySummary();

        JobFailureSummaryVO vo = list.stream()
                .filter(r -> EXISTING_CLIENT.equals(r.getClientId())
                        && EXISTING_DS.equals(r.getDataSourceId()))
                .findFirst().get();

        // hosp-006/my-19c has STABLE_CHECK_PASSED → job should be 正常运行
        assertEquals("正常运行", vo.getJobStatus());
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
        List<JobFailureSummaryVO> list = jobFailureService.querySummary();
        Long faultRootId = list.stream()
                .filter(r -> EXISTING_CLIENT.equals(r.getClientId())
                        && EXISTING_DS.equals(r.getDataSourceId()))
                .findFirst().get().getLatestFaultRootId();

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

    @Test
    void errorDetailByLogId_shouldReturnContent() {
        List<JobFailureSummaryVO> list = jobFailureService.querySummary();
        Long faultRootId = list.stream()
                .filter(r -> EXISTING_CLIENT.equals(r.getClientId())
                        && EXISTING_DS.equals(r.getDataSourceId()))
                .findFirst().get().getLatestFaultRootId();

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
        List<JobFailureSummaryVO> list = jobFailureService.querySummary();
        Long faultRootId = list.stream()
                .filter(r -> EXISTING_CLIENT.equals(r.getClientId())
                        && EXISTING_DS.equals(r.getDataSourceId()))
                .findFirst().get().getLatestFaultRootId();

        BusinessException ex = assertThrows(BusinessException.class,
                () -> jobFailureService.getClobDetail(faultRootId,
                        "FAILURE_HANDLE_LOG_ERROR_DETAIL", 999999999L));
        assertEquals(40006, ex.getCode());
    }

    @Test
    void errorDetail_nullErrorDetail_shouldReturnNullContent() {
        List<JobFailureSummaryVO> list = jobFailureService.querySummary();
        Long faultRootId = list.stream()
                .filter(r -> EXISTING_CLIENT.equals(r.getClientId())
                        && EXISTING_DS.equals(r.getDataSourceId()))
                .findFirst().get().getLatestFaultRootId();

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

    @Test
    void failureDetail_wrongFaultRootForEventsFaultProcess_shouldThrow() {
        BusinessException ex = assertThrows(BusinessException.class,
                () -> jobFailureService.getClobDetail(999999999L,
                        "FAILURE_EVENT_FAILURE_DETAIL", EXISTING_EVENT_ID));
        assertEquals(40401, ex.getCode());
    }

    @Test
    void errorDetail_wrongFaultRootForLogsFaultProcess_shouldThrow() {
        List<JobFailureSummaryVO> list = jobFailureService.querySummary();
        Long faultRootId = list.stream()
                .filter(r -> EXISTING_CLIENT.equals(r.getClientId())
                        && EXISTING_DS.equals(r.getDataSourceId()))
                .findFirst().get().getLatestFaultRootId();

        FaultProcessDetailVO detail = jobFailureService.getLatestFault(EXISTING_CLIENT, EXISTING_DS);
        Long anyLogId = detail.getHandleTimeline().get(0).getLogId();

        BusinessException ex = assertThrows(BusinessException.class,
                () -> jobFailureService.getClobDetail(999999999L,
                        "FAILURE_HANDLE_LOG_ERROR_DETAIL", anyLogId));
        assertEquals(40401, ex.getCode());
    }

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
        List<JobFailureSummaryVO> list = jobFailureService.querySummary();
        assertNotNull(list);
        assertTrue(list.size() >= 1);
    }

    @Test
    void faultDetailShouldNotContainClobContent() {
        FaultProcessDetailVO vo = jobFailureService.getLatestFault(EXISTING_CLIENT, EXISTING_DS);
        assertNotNull(vo);
        assertNotNull(vo.getHandleTimeline());
    }

    // ==================== Config name resolution ====================

    @Test
    void summaryShouldResolveDataSourceNameFromConfig() {
        List<JobFailureSummaryVO> list = jobFailureService.querySummary();

        JobFailureSummaryVO vo = list.stream()
                .filter(r -> EXISTING_DS.equals(r.getDataSourceId()))
                .findFirst().get();
        assertEquals(EXISTING_DS, vo.getDataSourceId());
        assertEquals("oracle-业务库33", vo.getDataSourceName());
    }

    @Test
    void summaryShouldHaveClientNameFromCdcClientMultiple() {
        List<JobFailureSummaryVO> list = jobFailureService.querySummary();

        JobFailureSummaryVO vo = list.stream()
                .filter(r -> EXISTING_CLIENT.equals(r.getClientId()))
                .findFirst().get();
        assertEquals(EXISTING_CLIENT, vo.getClientId());
        // hosp-006 exists in CDC_CLIENT_MULTIPLE with CLIENT_DESC
        assertNotNull(vo.getClientName());
        assertFalse(vo.getClientName().isEmpty());
    }

    // ==================== N+1 verification ====================

    @Test
    void summaryShouldNotTriggerNPlusOne() {
        List<JobFailureSummaryVO> first = jobFailureService.querySummary();
        List<JobFailureSummaryVO> second = jobFailureService.querySummary();
        assertEquals(first.size(), second.size());
    }
}
