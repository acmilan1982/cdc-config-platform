package com.bsoft.cdcconfig.datasource.controller;

import com.bsoft.cdcconfig.datasource.dto.BizAttrSaveDTO;
import com.bsoft.cdcconfig.datasource.dto.DataSourceCreateDTO;
import com.bsoft.cdcconfig.datasource.dto.DataSourceUpdateDTO;
import com.bsoft.cdcconfig.datasource.dto.NamingStrategyDTO;
import com.bsoft.cdcconfig.datasource.dto.TestConnectionDTO;
import com.bsoft.cdcconfig.datasource.service.DataSourceNamingStrategyService;
import com.bsoft.cdcconfig.datasource.service.DataSourceService;
import com.bsoft.cdcconfig.datasource.vo.BizAttrVO;
import com.bsoft.cdcconfig.datasource.vo.DataSourceDetailVO;
import com.bsoft.cdcconfig.datasource.vo.DataSourceListVO;
import com.bsoft.cdcconfig.datasource.vo.NamingStrategyVO;
import com.bsoft.cdcconfig.datasource.vo.TargetOptionVO;
import com.bsoft.cdcconfig.datasource.vo.TestConnectionResultVO;
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

    @MockBean
    private DataSourceNamingStrategyService namingStrategyService;

    // ---- list ----
    @Test
    void list_shouldReturnList() throws Exception {
        DataSourceListVO vo = new DataSourceListVO();
        vo.setDataSourceId("DS001");
        vo.setDataSourceName("测试数据源");
        when(dataSourceService.list(any())).thenReturn(Collections.singletonList(vo));

        mockMvc.perform(get("/api/data-sources"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.code").value(200))
                .andExpect(jsonPath("$.data[0].dataSourceId").value("DS001"));
    }

    @Test
    void list_withFilters_shouldPassParams() throws Exception {
        when(dataSourceService.list(any())).thenReturn(Collections.emptyList());

        mockMvc.perform(get("/api/data-sources")
                        .param("id", "DS")
                        .param("name", "测试")
                        .param("host", "192.168"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.code").value(200));
    }

    // ---- detail ----
    @Test
    void detail_shouldReturnDetail() throws Exception {
        DataSourceDetailVO vo = new DataSourceDetailVO();
        vo.setDataSourceId("DS001");
        when(dataSourceService.getDetail("DS001")).thenReturn(vo);

        mockMvc.perform(get("/api/data-sources/DS001"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.code").value(200))
                .andExpect(jsonPath("$.data.dataSourceId").value("DS001"));
    }

    // ---- create ----
    @Test
    void create_shouldReturnNewId() throws Exception {
        when(dataSourceService.create(any(DataSourceCreateDTO.class))).thenReturn("DS001");

        String body = objectMapper.writeValueAsString(buildCreateDTO());

        mockMvc.perform(post("/api/data-sources")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(body))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.code").value(200))
                .andExpect(jsonPath("$.data").value("DS001"));

        verify(dataSourceService).create(any(DataSourceCreateDTO.class));
    }

    @Test
    void create_missingRequiredFields_shouldReturn400() throws Exception {
        mockMvc.perform(post("/api/data-sources")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{}"))
                .andExpect(status().isBadRequest());
    }

    // ---- update ----
    @Test
    void update_shouldReturnEditedId() throws Exception {
        when(dataSourceService.update(eq("DS001"), any(DataSourceUpdateDTO.class))).thenReturn("DS001");

        String body = objectMapper.writeValueAsString(buildUpdateDTO());

        mockMvc.perform(put("/api/data-sources/DS001")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(body))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.code").value(200))
                .andExpect(jsonPath("$.data").value("DS001"));
    }

    @Test
    void update_missingRequiredFields_shouldReturn400() throws Exception {
        mockMvc.perform(put("/api/data-sources/DS001")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{}"))
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

    // ---- test-connection ----
    @Test
    void testConnection_shouldReturnResult() throws Exception {
        when(dataSourceService.testConnection(any(TestConnectionDTO.class)))
                .thenReturn(new TestConnectionResultVO(true, "连接成功"));

        String body = objectMapper.writeValueAsString(buildTestConnectionDTO());

        mockMvc.perform(post("/api/data-sources/test-connection")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(body))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.code").value(200))
                .andExpect(jsonPath("$.data.success").value(true))
                .andExpect(jsonPath("$.data.message").value("连接成功"));
    }

    @Test
    void testConnection_missingRequiredFields_shouldReturn400() throws Exception {
        mockMvc.perform(post("/api/data-sources/test-connection")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{}"))
                .andExpect(status().isBadRequest());
    }

    @Test
    void testConnection_withoutPasswordAndOriginalId_shouldReturn400() throws Exception {
        mockMvc.perform(post("/api/data-sources/test-connection")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"dataSourceType\":\"ORACLE\",\"host\":\"192.168.1.1\",\"port\":1521,"
                                + "\"userName\":\"testuser\",\"serviceName\":\"testdb\"}"))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.code").value(400));
    }

    // ---- target-options ----
    @Test
    void targetOptions_shouldReturnTargets() throws Exception {
        TargetOptionVO vo = new TargetOptionVO();
        vo.setDataSourceId("TG001");
        when(dataSourceService.targetOptions()).thenReturn(Collections.singletonList(vo));

        mockMvc.perform(get("/api/data-sources/target-options"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.code").value(200))
                .andExpect(jsonPath("$.data[0].dataSourceId").value("TG001"));
    }

    // ---- biz-attr ----
    @Test
    void getBizAttr_shouldReturnBizAttr() throws Exception {
        BizAttrVO vo = new BizAttrVO();
        vo.setDataSourceId("TG001");
        vo.setBizAttr("{\"a\":1}");
        when(dataSourceService.getBizAttr("TG001")).thenReturn(vo);

        mockMvc.perform(get("/api/data-sources/TG001/biz-attr"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.code").value(200))
                .andExpect(jsonPath("$.data.bizAttr").value("{\"a\":1}"));
    }

    @Test
    void saveBizAttr_shouldSucceed() throws Exception {
        doNothing().when(dataSourceService).saveBizAttr(eq("TG001"), any(BizAttrSaveDTO.class));

        mockMvc.perform(put("/api/data-sources/TG001/biz-attr")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"bizAttr\":\"abc\"}"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.code").value(200));

        verify(dataSourceService).saveBizAttr(eq("TG001"), any(BizAttrSaveDTO.class));
    }

    // ---- naming strategies ----
    @Test
    void listNamingStrategies_shouldReturnStrategies() throws Exception {
        NamingStrategyVO vo = new NamingStrategyVO();
        vo.setSourceDataSourceId("SRC001");
        when(namingStrategyService.list("SRC001"))
                .thenReturn(Collections.singletonList(vo));

        mockMvc.perform(get("/api/data-sources/SRC001/naming-strategies"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.code").value(200))
                .andExpect(jsonPath("$.data[0].sourceDataSourceId").value("SRC001"));
    }

    @Test
    void createNamingStrategy_shouldSucceed() throws Exception {
        doNothing().when(namingStrategyService).create(eq("SRC001"), any(NamingStrategyDTO.class));

        String body = objectMapper.writeValueAsString(buildNamingStrategyDTO());

        mockMvc.perform(post("/api/data-sources/SRC001/naming-strategies")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(body))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.code").value(200));

        verify(namingStrategyService).create(eq("SRC001"), any(NamingStrategyDTO.class));
    }

    @Test
    void createNamingStrategy_missingRequiredFields_shouldReturn400() throws Exception {
        mockMvc.perform(post("/api/data-sources/SRC001/naming-strategies")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{}"))
                .andExpect(status().isBadRequest());
    }

    @Test
    void updateNamingStrategy_shouldSucceed() throws Exception {
        doNothing().when(namingStrategyService)
                .update(eq("SRC001"), eq("TG001"), any(NamingStrategyDTO.class));

        String body = objectMapper.writeValueAsString(buildNamingStrategyDTO());

        mockMvc.perform(put("/api/data-sources/SRC001/naming-strategies/TG001")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(body))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.code").value(200));

        verify(namingStrategyService).update(eq("SRC001"), eq("TG001"), any(NamingStrategyDTO.class));
    }

    @Test
    void deleteNamingStrategy_shouldSucceed() throws Exception {
        doNothing().when(namingStrategyService).delete("SRC001", "TG001");

        mockMvc.perform(delete("/api/data-sources/SRC001/naming-strategies/TG001"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.code").value(200));

        verify(namingStrategyService).delete("SRC001", "TG001");
    }

    // -- helpers --

    private DataSourceCreateDTO buildCreateDTO() {
        DataSourceCreateDTO dto = new DataSourceCreateDTO();
        dto.setDataSourceId("DS001");
        dto.setDataSourceName("测试数据源");
        dto.setDataSourceCategory("SOURCE");
        dto.setDataSourceType("ORACLE");
        dto.setHost("192.168.1.1");
        dto.setPort(1521);
        dto.setUserName("testuser");
        dto.setPassword("testpass");
        dto.setServiceName("testdb");
        return dto;
    }

    private DataSourceUpdateDTO buildUpdateDTO() {
        DataSourceUpdateDTO dto = new DataSourceUpdateDTO();
        dto.setDataSourceId("DS001");
        dto.setDataSourceName("测试数据源");
        dto.setDataSourceCategory("SOURCE");
        dto.setDataSourceType("ORACLE");
        dto.setHost("192.168.1.1");
        dto.setPort(1521);
        dto.setUserName("testuser");
        dto.setServiceName("testdb");
        return dto;
    }

    private TestConnectionDTO buildTestConnectionDTO() {
        TestConnectionDTO dto = new TestConnectionDTO();
        dto.setDataSourceType("ORACLE");
        dto.setHost("192.168.1.1");
        dto.setPort(1521);
        dto.setUserName("testuser");
        dto.setPassword("testpass");
        dto.setServiceName("testdb");
        return dto;
    }

    private NamingStrategyDTO buildNamingStrategyDTO() {
        NamingStrategyDTO dto = new NamingStrategyDTO();
        dto.setTargetDataSourceId("TG001");
        dto.setTableNamingStrategy("TABLE_MERGE");
        dto.setTableNamePrefix("");
        dto.setTableNameSuffix("");
        return dto;
    }
}
