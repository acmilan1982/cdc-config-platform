package com.bsoft.cdcconfig.monitor.topicoffset.controller;

import com.bsoft.cdcconfig.common.api.ApiResponse;
import com.bsoft.cdcconfig.monitor.topicoffset.query.TopicOffsetQuery;
import com.bsoft.cdcconfig.monitor.topicoffset.service.TopicOffsetQueryService;
import com.bsoft.cdcconfig.monitor.topicoffset.vo.CandidateGroupVO;
import com.bsoft.cdcconfig.monitor.topicoffset.vo.TopicOffsetPageVO;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

/**
 * 数据同步进度只读 Controller。仅暴露两个 GET 接口（API.md §2）：
 * /api/monitor/topic-offset/offsets、/api/monitor/topic-offset/candidates。
 */
@RestController
@RequestMapping("/api/monitor/topic-offset")
public class TopicOffsetController {

    private final TopicOffsetQueryService queryService;

    public TopicOffsetController(TopicOffsetQueryService queryService) {
        this.queryService = queryService;
    }

    @GetMapping("/offsets")
    public ApiResponse<TopicOffsetPageVO> offsets(
            @RequestParam(required = false) List<String> clientId,
            @RequestParam(required = false) List<String> sourceId,
            @RequestParam(required = false) List<String> targetId,
            @RequestParam(required = false) String tableName,
            @RequestParam(required = false) String pageNum) {
        TopicOffsetQuery query = new TopicOffsetQuery();
        query.setClientId(clientId);
        query.setSourceId(sourceId);
        query.setTargetId(targetId);
        query.setTableName(tableName);
        query.setPageNum(pageNum);
        return ApiResponse.success(queryService.queryOffsets(query));
    }

    @GetMapping("/candidates")
    public ApiResponse<CandidateGroupVO> candidates() {
        return ApiResponse.success(queryService.queryCandidates());
    }
}
