package com.bsoft.cdcconfig.logquery.controller;

import com.bsoft.cdcconfig.common.api.ApiResponse;
import com.bsoft.cdcconfig.logquery.dto.LogListQuery;
import com.bsoft.cdcconfig.logquery.enums.LogTypeEnum;
import com.bsoft.cdcconfig.logquery.exception.LogQueryErrorCode;
import com.bsoft.cdcconfig.logquery.service.LogQueryService;
import com.bsoft.cdcconfig.logquery.vo.DataSourceOptionsVO;
import com.bsoft.cdcconfig.logquery.vo.LogDetailVO;
import com.bsoft.cdcconfig.logquery.vo.LogListResponse;
import com.bsoft.cdcconfig.logquery.vo.RawMessageVO;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.Parameter;
import io.swagger.v3.oas.annotations.tags.Tag;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

/**
 * 日志查询接口（LQ-DESIGN-01）。
 * 只做协议接入与基础白名单校验，不拼 SQL、不做业务规则判断。
 */
@Tag(name = "日志查询", description = "日志查询：数据源候选、日志列表、日志详情与原始消息")
@RestController
@RequestMapping("/api/log-query")
public class LogQueryController {

    private final LogQueryService logQueryService;

    public LogQueryController(LogQueryService logQueryService) {
        this.logQueryService = logQueryService;
    }

    @Operation(summary = "数据源候选", description = "一次返回源库与目标库下拉候选，仅启用且类别匹配")
    @GetMapping("/data-source-options")
    public ApiResponse<DataSourceOptionsVO> dataSourceOptions() {
        return ApiResponse.success(logQueryService.getDataSourceOptions());
    }

    @Operation(summary = "日志列表查询", description = "错误/正确日志列表首查、下一页、上一页共用；固定排序、游标分页")
    @PostMapping("/logs/search")
    public ApiResponse<LogListResponse> search(@RequestBody LogListQuery query) {
        requireLogType(query.getLogType());
        return ApiResponse.success(logQueryService.searchLogs(query));
    }

    @Operation(summary = "日志详情", description = "按日志类型与CDC_LOG_ID获取日志详情")
    @GetMapping("/logs/{logType}/{cdcLogId}/detail")
    public ApiResponse<LogDetailVO> detail(
            @Parameter(description = "日志类型: error/correct") @PathVariable String logType,
            @Parameter(description = "日志ID，十进制字符串") @PathVariable String cdcLogId) {
        requireLogType(logType);
        return ApiResponse.success(logQueryService.getLogDetail(logType, cdcLogId));
    }

    @Operation(summary = "原始消息", description = "按日志类型与CDC_LOG_ID获取原始消息")
    @GetMapping("/logs/{logType}/{cdcLogId}/raw-message")
    public ApiResponse<RawMessageVO> rawMessage(
            @Parameter(description = "日志类型: error/correct") @PathVariable String logType,
            @Parameter(description = "日志ID，十进制字符串") @PathVariable String cdcLogId) {
        requireLogType(logType);
        return ApiResponse.success(logQueryService.getRawMessage(logType, cdcLogId));
    }

    /**
     * HTTP 层白名单校验（LQ-DESIGN-16）：非白名单值在到达 SQL 前即被拒绝。
     */
    private static void requireLogType(String logType) {
        if (LogTypeEnum.fromValue(logType) == null) {
            throw LogQueryErrorCode.logTypeInvalid(logType);
        }
    }
}
