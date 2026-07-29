package com.bsoft.cdcconfig.monitor.jobfailure.controller;

import com.bsoft.cdcconfig.common.api.ApiResponse;
import com.bsoft.cdcconfig.common.page.PageResult;
import com.bsoft.cdcconfig.monitor.jobfailure.query.HistoryQuery;
import com.bsoft.cdcconfig.monitor.jobfailure.query.JobFailureSummaryQuery;
import com.bsoft.cdcconfig.monitor.jobfailure.service.JobFailureService;
import com.bsoft.cdcconfig.monitor.jobfailure.vo.ClobDetailVO;
import com.bsoft.cdcconfig.monitor.jobfailure.vo.FaultProcessDetailVO;
import com.bsoft.cdcconfig.monitor.jobfailure.vo.FaultProcessSummaryVO;
import com.bsoft.cdcconfig.monitor.jobfailure.vo.JobFailureSummaryVO;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.Parameter;
import io.swagger.v3.oas.annotations.tags.Tag;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@Tag(name = "Job失败监控", description = "Job失败重启记录查询、故障链分析与CLOB长文本懒加载")
@RestController
@RequestMapping("/api/job-failure")
public class JobFailureController {

    private final JobFailureService jobFailureService;

    public JobFailureController(JobFailureService jobFailureService) {
        this.jobFailureService = jobFailureService;
    }

    @Operation(summary = "API-1: 故障逻辑Job分页汇总",
            description = "按(CLIENT_ID, DATA_SOURCE_ID)汇总所有发生过失败事件的逻辑Job，支持按状态、时间范围等筛选")
    @GetMapping("/summary")
    public ApiResponse<PageResult<JobFailureSummaryVO>> summary(JobFailureSummaryQuery query) {
        PageResult<JobFailureSummaryVO> page = jobFailureService.querySummary(query);
        return ApiResponse.success(page);
    }

    @Operation(summary = "API-2: 逻辑Job最近一次故障过程详情",
            description = "返回指定逻辑Job最近一次故障过程的完整信息，包括Job链、主链事件、时间线和异常")
    @GetMapping("/latest/{clientId}/{dataSourceId}")
    public ApiResponse<FaultProcessDetailVO> latestFault(
            @Parameter(description = "客户端ID") @PathVariable String clientId,
            @Parameter(description = "数据源ID") @PathVariable String dataSourceId) {
        FaultProcessDetailVO vo = jobFailureService.getLatestFault(clientId, dataSourceId);
        return ApiResponse.success(vo);
    }

    @Operation(summary = "API-3: 逻辑Job历史故障过程分页",
            description = "分页查询指定逻辑Job的所有历史故障过程，支持按时间范围筛选")
    @GetMapping("/history/{clientId}/{dataSourceId}")
    public ApiResponse<PageResult<FaultProcessSummaryVO>> history(
            @Parameter(description = "客户端ID") @PathVariable String clientId,
            @Parameter(description = "数据源ID") @PathVariable String dataSourceId,
            HistoryQuery query) {
        query.setClientId(clientId);
        query.setDataSourceId(dataSourceId);
        PageResult<FaultProcessSummaryVO> page = jobFailureService.queryHistory(query);
        return ApiResponse.success(page);
    }

    @Operation(summary = "API-4: 指定故障过程详情",
            description = "根据faultRootId返回指定故障过程的完整信息，包括Job链、主链事件、时间线和异常")
    @GetMapping("/process/{faultRootId}")
    public ApiResponse<FaultProcessDetailVO> processDetail(
            @Parameter(description = "故障根事件ID") @PathVariable Long faultRootId) {
        FaultProcessDetailVO vo = jobFailureService.getProcessDetail(faultRootId);
        return ApiResponse.success(vo);
    }

    @Operation(summary = "API-5: CLOB长文本懒加载",
            description = "按需加载故障详情或错误明细的长文本内容。"
                    + "FAILURE_EVENT_FAILURE_DETAIL时recordId为事件ID，"
                    + "FAILURE_HANDLE_LOG_ERROR_DETAIL时recordId为处理日志ID。"
                    + "服务端验证recordId属于faultRootId对应的故障过程。")
    @GetMapping("/clob/{faultRootId}/{clobField}/{recordId}")
    public ApiResponse<ClobDetailVO> clobDetail(
            @Parameter(description = "故障根事件ID") @PathVariable Long faultRootId,
            @Parameter(description = "CLOB字段枚举: FAILURE_EVENT_FAILURE_DETAIL 或 FAILURE_HANDLE_LOG_ERROR_DETAIL")
            @PathVariable String clobField,
            @Parameter(description = "记录ID: 事件ID(FAILURE_EVENT_FAILURE_DETAIL) 或 日志ID(FAILURE_HANDLE_LOG_ERROR_DETAIL)")
            @PathVariable Long recordId) {
        ClobDetailVO vo = jobFailureService.getClobDetail(faultRootId, clobField, recordId);
        return ApiResponse.success(vo);
    }
}
