package com.bsoft.cdcconfig.monitor.datasourcerunstate.controller;

import com.bsoft.cdcconfig.common.api.ApiResponse;
import com.bsoft.cdcconfig.monitor.datasourcerunstate.query.DataSourceRunStateQuery;
import com.bsoft.cdcconfig.monitor.datasourcerunstate.service.DataSourceRunStateQueryService;
import com.bsoft.cdcconfig.monitor.datasourcerunstate.vo.SnapshotStatusListVO;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

/**
 * 源库快照状态只读 Controller（API.md §3）。仅暴露一个 GET 端点：
 * /api/monitor/data-source-run-state/list。无任何 POST/PUT/PATCH/DELETE 或写方法调用路径。
 */
@RestController
@RequestMapping("/api/monitor/data-source-run-state")
public class DataSourceRunStateController {

    private final DataSourceRunStateQueryService queryService;

    public DataSourceRunStateController(DataSourceRunStateQueryService queryService) {
        this.queryService = queryService;
    }

    @GetMapping("/list")
    public ApiResponse<SnapshotStatusListVO> list(
            @RequestParam(required = false) List<String> clientId,
            @RequestParam(required = false) List<String> sourceId,
            @RequestParam(required = false) List<String> status) {
        DataSourceRunStateQuery query = new DataSourceRunStateQuery();
        query.setClientId(clientId);
        query.setSourceId(sourceId);
        query.setStatus(status);
        return ApiResponse.success(queryService.queryList(query));
    }
}
