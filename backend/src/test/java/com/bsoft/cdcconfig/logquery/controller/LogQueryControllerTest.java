package com.bsoft.cdcconfig.logquery.controller;

import com.bsoft.cdcconfig.logquery.dto.LogListQuery;
import com.bsoft.cdcconfig.logquery.exception.LogQueryBadRequestException;
import com.bsoft.cdcconfig.logquery.exception.LogQueryErrorCode;
import com.bsoft.cdcconfig.logquery.service.LogQueryService;
import com.bsoft.cdcconfig.logquery.vo.DataSourceOptionVO;
import com.bsoft.cdcconfig.logquery.vo.DataSourceOptionsVO;
import com.bsoft.cdcconfig.logquery.vo.LogDetailVO;
import com.bsoft.cdcconfig.logquery.vo.LogListResponse;
import com.bsoft.cdcconfig.logquery.vo.LogListVO;
import com.bsoft.cdcconfig.logquery.vo.RawMessageVO;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.WebMvcTest;
import org.springframework.boot.test.mock.mockito.MockBean;
import org.springframework.http.MediaType;
import org.springframework.test.web.servlet.MockMvc;

import java.util.Collections;
import java.util.HashMap;
import java.util.Map;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

/**
 * HTTP 层：4 个路由、HTTP 状态、业务码、cdcLogId 字符串化、pageSize 输入被忽略（LQ-API-04/05/99）。
 */
@WebMvcTest(LogQueryController.class)
class LogQueryControllerTest {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private ObjectMapper objectMapper;

    @MockBean
    private LogQueryService logQueryService;

    // ---- data-source-options ----

    @Test
    void dataSourceOptions_shouldReturnSourceAndTargetLists() throws Exception {
        DataSourceOptionsVO vo = new DataSourceOptionsVO();
        DataSourceOptionVO src = new DataSourceOptionVO();
        src.setId("DS_SRC_001");
        src.setOrg("业务库-订单");
        vo.setSourceList(Collections.singletonList(src));
        vo.setTargetList(Collections.emptyList());
        when(logQueryService.getDataSourceOptions()).thenReturn(vo);

        mockMvc.perform(get("/api/log-query/data-source-options"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.code").value(200))
                .andExpect(jsonPath("$.data.sourceList[0].id").value("DS_SRC_001"))
                .andExpect(jsonPath("$.data.sourceList[0].org").value("业务库-订单"))
                .andExpect(jsonPath("$.data.targetList").isArray());
    }

    // ---- logs/search ----

    @Test
    void search_validBody_shouldReturnList() throws Exception {
        LogListVO item = new LogListVO();
        item.setCdcLogId("7755033852453421056");
        item.setTargetTime("2026-08-20 10:00:00");
        LogListResponse resp = new LogListResponse(Collections.singletonList(item), false, null);
        when(logQueryService.searchLogs(any(LogListQuery.class))).thenReturn(resp);

        mockMvc.perform(post("/api/log-query/logs/search")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(body()))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.code").value(200))
                .andExpect(jsonPath("$.data.hasNext").value(false))
                .andExpect(jsonPath("$.data.items[0].cdcLogId").value("7755033852453421056"));
    }

    @Test
    void search_invalidLogType_shouldReturn200WithBusinessCode() throws Exception {
        // 白名单在 HTTP 层拒绝，未到达 Service，返回 HTTP 200 + 业务码 40014
        mockMvc.perform(post("/api/log-query/logs/search")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"logType\":\"BAD\"}"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.code").value(LogQueryErrorCode.LOG_TYPE_INVALID));
        verify(logQueryService, never()).searchLogs(any(LogListQuery.class));
    }

    @Test
    void search_bodyWithPageSize_shouldIgnoreAndStillCallService() throws Exception {
        // 请求体携带 pageSize 时服务端必须忽略（固定页容量 100，不读取输入）
        LogListResponse resp = new LogListResponse(Collections.emptyList(), false, null);
        when(logQueryService.searchLogs(any(LogListQuery.class))).thenReturn(resp);

        Map<String, Object> extra = new HashMap<>();
        extra.put("logType", "error");
        extra.put("startTime", "2026-08-14 00:00:00");
        extra.put("endTime", "2026-08-20 23:59:59");
        extra.put("pageSize", 999);
        String body = objectMapper.writeValueAsString(extra);

        mockMvc.perform(post("/api/log-query/logs/search")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(body))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.code").value(200));
        verify(logQueryService).searchLogs(any(LogListQuery.class));
    }

    // ---- detail ----

    @Test
    void detail_valid_shouldReturnDetail() throws Exception {
        LogDetailVO vo = new LogDetailVO();
        vo.setCdcLogId("7755033852453421056");
        vo.setLogDetail("full");
        when(logQueryService.getLogDetail(eq("error"), eq("7755033852453421056"))).thenReturn(vo);

        mockMvc.perform(get("/api/log-query/logs/error/7755033852453421056/detail"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.code").value(200))
                .andExpect(jsonPath("$.data.cdcLogId").value("7755033852453421056"));
    }

    @Test
    void detail_invalidCdcLogId_shouldReturnHttp400() throws Exception {
        // 服务层把非法路径 cdcLogId 映射为 LogQueryBadRequestException -> HTTP 400
        when(logQueryService.getLogDetail(eq("error"), anyString()))
                .thenThrow(new LogQueryBadRequestException("cdcLogId 必须为 1~19 位十进制字符串且在 NUMBER(19,0) 范围内"));

        mockMvc.perform(get("/api/log-query/logs/error/not-a-number/detail"))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.code").value(400));
    }

    @Test
    void detail_invalidLogType_shouldReturn200WithBusinessCode() throws Exception {
        mockMvc.perform(get("/api/log-query/logs/BAD/7755033852453421056/detail"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.code").value(LogQueryErrorCode.LOG_TYPE_INVALID));
        verify(logQueryService, never()).getLogDetail(anyString(), anyString());
    }

    @Test
    void detail_notFound_shouldReturn200With40410() throws Exception {
        when(logQueryService.getLogDetail(eq("error"), anyString()))
                .thenThrow(LogQueryErrorCode.logRecordNotFound());

        mockMvc.perform(get("/api/log-query/logs/error/7755033852453421056/detail"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.code").value(LogQueryErrorCode.LOG_RECORD_NOT_FOUND));
    }

    // ---- raw-message ----

    @Test
    void rawMessage_valid_shouldReturnRawMessage() throws Exception {
        RawMessageVO vo = new RawMessageVO();
        vo.setCdcLogId("7755033852453421056");
        vo.setRawMessage("{\"op\":\"INSERT\"}");
        when(logQueryService.getRawMessage(eq("correct"), eq("7755033852453421056"))).thenReturn(vo);

        mockMvc.perform(get("/api/log-query/logs/correct/7755033852453421056/raw-message"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.code").value(200))
                .andExpect(jsonPath("$.data.rawMessage").value("{\"op\":\"INSERT\"}"));
    }

    @Test
    void rawMessage_invalidCdcLogId_shouldReturnHttp400() throws Exception {
        when(logQueryService.getRawMessage(eq("error"), anyString()))
                .thenThrow(new LogQueryBadRequestException("cdcLogId 必须为 1~19 位十进制字符串且在 NUMBER(19,0) 范围内"));

        mockMvc.perform(get("/api/log-query/logs/error/0x1F/raw-message"))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.code").value(400));
    }

    @Test
    void rawMessage_invalidLogType_shouldReturn200WithBusinessCode() throws Exception {
        mockMvc.perform(get("/api/log-query/logs/BAD/7755033852453421056/raw-message"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.code").value(LogQueryErrorCode.LOG_TYPE_INVALID));
        verify(logQueryService, never()).getRawMessage(anyString(), anyString());
    }

    // ---- helpers ----

    private String body() throws Exception {
        Map<String, Object> map = new HashMap<>();
        map.put("logType", "error");
        map.put("startTime", "2026-08-14 00:00:00");
        map.put("endTime", "2026-08-20 23:59:59");
        return objectMapper.writeValueAsString(map);
    }
}
