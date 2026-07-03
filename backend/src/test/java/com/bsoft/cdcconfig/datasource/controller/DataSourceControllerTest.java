package com.bsoft.cdcconfig.datasource.controller;

import com.bsoft.cdcconfig.common.page.PageResult;
import com.bsoft.cdcconfig.datasource.dto.DataSourceCreateDTO;
import com.bsoft.cdcconfig.datasource.dto.DataSourceExtendDTO;
import com.bsoft.cdcconfig.datasource.dto.DataSourceUpdateDTO;
import com.bsoft.cdcconfig.datasource.service.DataSourceService;
import com.bsoft.cdcconfig.datasource.vo.DataSourceDetailVO;
import com.bsoft.cdcconfig.datasource.vo.DataSourceExtendVO;
import com.bsoft.cdcconfig.datasource.vo.DataSourceListVO;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.WebMvcTest;
import org.springframework.boot.test.mock.mockito.MockBean;
import org.springframework.http.MediaType;
import org.springframework.test.web.servlet.MockMvc;

import java.util.Collections;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.doNothing;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.delete;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.put;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@WebMvcTest(DataSourceController.class)
class DataSourceControllerTest {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private ObjectMapper objectMapper;

    @MockBean
    private DataSourceService dataSourceService;

    // ---- list ----
    @Test
    void list_shouldReturnPageResult() throws Exception {
        PageResult<DataSourceListVO> page = new PageResult<>(
                Collections.emptyList(), 0, 1, 20);
        when(dataSourceService.queryPage(any())).thenReturn(page);

        mockMvc.perform(get("/api/data-sources")
                        .param("pageNum", "1")
                        .param("pageSize", "20"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.code").value(200))
                .andExpect(jsonPath("$.data.total").value(0));
    }

    @Test
    void list_withFilters_shouldPassParams() throws Exception {
        PageResult<DataSourceListVO> page = new PageResult<>(
                Collections.emptyList(), 0, 1, 20);
        when(dataSourceService.queryPage(any())).thenReturn(page);

        mockMvc.perform(get("/api/data-sources")
                        .param("dataSourceId", "DS001")
                        .param("dataSourceName", "测试"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.code").value(200));
    }

    // ---- detail ----
    @Test
    void detail_shouldReturnDetail() throws Exception {
        DataSourceDetailVO vo = new DataSourceDetailVO();
        vo.setDataSourceId("DS001");
        vo.setExtendExists(true);
        DataSourceExtendVO ext = new DataSourceExtendVO();
        ext.setTableNamingStrategy("TABLE_MERGE");
        vo.setExtend(ext);
        when(dataSourceService.getDetail("DS001")).thenReturn(vo);

        mockMvc.perform(get("/api/data-sources/DS001"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.code").value(200))
                .andExpect(jsonPath("$.data.dataSourceId").value("DS001"));
    }

    // ---- create ----
    @Test
    void create_shouldSucceed() throws Exception {
        doNothing().when(dataSourceService).create(any(DataSourceCreateDTO.class));

        String body = objectMapper.writeValueAsString(buildCreateDTO());

        mockMvc.perform(post("/api/data-sources")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(body))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.code").value(200));
    }

    @Test
    void create_missingRequiredFields_shouldReturn400() throws Exception {
        String body = "{}";

        mockMvc.perform(post("/api/data-sources")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(body))
                .andExpect(status().isBadRequest());
    }

    // ---- update ----
    @Test
    void update_shouldSucceed() throws Exception {
        doNothing().when(dataSourceService).update(eq("DS001"), any(DataSourceUpdateDTO.class));

        String body = objectMapper.writeValueAsString(buildUpdateDTO());

        mockMvc.perform(put("/api/data-sources/DS001")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(body))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.code").value(200));
    }

    @Test
    void update_missingRequiredFields_shouldReturn400() throws Exception {
        String body = "{}";

        mockMvc.perform(put("/api/data-sources/DS001")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(body))
                .andExpect(status().isBadRequest());
    }

    // ---- delete ----
    @Test
    void delete_shouldSucceed() throws Exception {
        doNothing().when(dataSourceService).delete("DS001");

        mockMvc.perform(delete("/api/data-sources/DS001"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.code").value(200));

        verify(dataSourceService).delete("DS001");
    }

    // ---- enable ----
    @Test
    void enable_shouldSucceed() throws Exception {
        doNothing().when(dataSourceService).enable("DS001");

        mockMvc.perform(put("/api/data-sources/DS001/enable"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.code").value(200));

        verify(dataSourceService).enable("DS001");
    }

    // ---- disable ----
    @Test
    void disable_shouldSucceed() throws Exception {
        doNothing().when(dataSourceService).disable("DS001");

        mockMvc.perform(put("/api/data-sources/DS001/disable"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.code").value(200));

        verify(dataSourceService).disable("DS001");
    }

    // -- helpers --

    private DataSourceCreateDTO buildCreateDTO() {
        DataSourceExtendDTO ext = new DataSourceExtendDTO();
        ext.setTableNamingStrategy("TABLE_MERGE");

        DataSourceCreateDTO dto = new DataSourceCreateDTO();
        dto.setDataSourceId("DS001");
        dto.setDataSourceName("测试");
        dto.setDataSourceCategory("SOURCE");
        dto.setDataSourceType("ORACLE");
        dto.setDataSourceOrg("测试机构");
        dto.setDataSourceHost("192.168.1.1");
        dto.setDataSourcePort("1521");
        dto.setDataSourceUserName("user");
        dto.setDataSourcePassword("pass");
        dto.setDataSourceServiceName("db");
        dto.setExtend(ext);
        return dto;
    }

    private DataSourceUpdateDTO buildUpdateDTO() {
        DataSourceExtendDTO ext = new DataSourceExtendDTO();
        ext.setTableNamingStrategy("TABLE_MERGE");

        DataSourceUpdateDTO dto = new DataSourceUpdateDTO();
        dto.setDataSourceName("测试");
        dto.setDataSourceCategory("SOURCE");
        dto.setDataSourceType("ORACLE");
        dto.setDataSourceOrg("测试机构");
        dto.setDataSourceHost("192.168.1.1");
        dto.setDataSourcePort("1521");
        dto.setDataSourceUserName("user");
        dto.setDataSourceServiceName("db");
        dto.setExtend(ext);
        return dto;
    }
}
