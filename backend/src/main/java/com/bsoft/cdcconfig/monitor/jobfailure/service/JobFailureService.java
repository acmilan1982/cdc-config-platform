package com.bsoft.cdcconfig.monitor.jobfailure.service;

import com.bsoft.cdcconfig.common.page.PageResult;
import com.bsoft.cdcconfig.monitor.jobfailure.query.HistoryQuery;
import com.bsoft.cdcconfig.monitor.jobfailure.query.JobFailureSummaryQuery;
import com.bsoft.cdcconfig.monitor.jobfailure.vo.ClobDetailVO;
import com.bsoft.cdcconfig.monitor.jobfailure.vo.FaultProcessDetailVO;
import com.bsoft.cdcconfig.monitor.jobfailure.vo.FaultProcessSummaryVO;
import com.bsoft.cdcconfig.monitor.jobfailure.vo.JobFailureSummaryVO;

public interface JobFailureService {

    PageResult<JobFailureSummaryVO> querySummary(JobFailureSummaryQuery query);

    FaultProcessDetailVO getLatestFault(String clientId, String dataSourceId);

    PageResult<FaultProcessSummaryVO> queryHistory(HistoryQuery query);

    FaultProcessDetailVO getProcessDetail(Long faultRootId);

    ClobDetailVO getClobDetail(Long faultRootId, String clobField, Long recordId);
}
