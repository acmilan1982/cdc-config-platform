package com.bsoft.cdcconfig.clientconfig.controller;

import com.bsoft.cdcconfig.clientconfig.model.dto.CreateClientRequest;
import com.bsoft.cdcconfig.clientconfig.model.dto.UpdateClientRequest;
import com.bsoft.cdcconfig.clientconfig.model.query.ClientStatus;
import com.bsoft.cdcconfig.clientconfig.model.vo.ClientListItemVO;
import com.bsoft.cdcconfig.clientconfig.model.vo.ClientListVO;
import com.bsoft.cdcconfig.clientconfig.model.vo.ClientConfigDataSourceOptionVO;
import com.bsoft.cdcconfig.clientconfig.service.ClientConfigService;
import com.bsoft.cdcconfig.common.exception.BusinessException;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.WebMvcTest;
import org.springframework.boot.test.mock.mockito.MockBean;
import org.springframework.http.MediaType;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.MvcResult;

import java.util.Collections;
import java.util.List;

import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.ArgumentMatchers.isNull;
import static org.mockito.Mockito.doNothing;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.delete;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.put;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

/**
 * Controller 切片测试（§8.1 第 1 项）：E1~E7 路由、请求绑定、统一响应与错误码。
 * 复用项目 @WebMvcTest + @MockBean 既有方式；不连接真实 DB。
 */
@WebMvcTest(ClientConfigController.class)
class ClientConfigControllerTest {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private ObjectMapper objectMapper;

    @MockBean
    private ClientConfigService clientConfigService;

    // ---- E1 列表 ----

    @Test
    void list_shouldReturnClientList() throws Exception {
        ClientListVO vo = new ClientListVO();
        ClientListItemVO item = new ClientListItemVO();
        item.setClientId("probe-001");
        item.setStatus("ENABLED");
        vo.setItems(Collections.singletonList(item));
        when(clientConfigService.list(isNull(), eq(ClientStatus.ALL))).thenReturn(vo);

        mockMvc.perform(get("/api/clients"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.code").value(200))
                .andExpect(jsonPath("$.data.items[0].clientId").value("probe-001"));

        verify(clientConfigService).list(isNull(), eq(ClientStatus.ALL));
    }

    @Test
    void list_withKeywordAndStatus_shouldBind() throws Exception {
        ClientListVO vo = new ClientListVO();
        vo.setItems(Collections.emptyList());
        when(clientConfigService.list(eq("probe"), eq(ClientStatus.ENABLED))).thenReturn(vo);

        mockMvc.perform(get("/api/clients")
                        .param("keyword", "probe")
                        .param("status", "ENABLED"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.code").value(200));

        verify(clientConfigService).list(eq("probe"), eq(ClientStatus.ENABLED));
    }

    @Test
    void list_invalidStatus_shouldReturn400Code400() throws Exception {
        mockMvc.perform(get("/api/clients").param("status", "UNKNOWN"))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.code").value(400));
    }

    // ---- E2 数据源候选 ----

    @Test
    void dataSourceOptions_shouldPassExcludeAndReturnOptions() throws Exception {
        ClientConfigDataSourceOptionVO option = new ClientConfigDataSourceOptionVO();
        option.setDataSourceId("DS-A");
        option.setSelectable(false);
        option.setNotSelectableReason("OCCUPIED");
        option.setOccupiedByClientIds(Collections.singletonList("clientB"));
        when(clientConfigService.dataSourceOptions("editor")).thenReturn(
                Collections.singletonList(option));

        mockMvc.perform(get("/api/clients/data-source-options")
                        .param("excludeClientId", "editor"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.code").value(200))
                .andExpect(jsonPath("$.data[0].dataSourceId").value("DS-A"))
                .andExpect(jsonPath("$.data[0].notSelectableReason").value("OCCUPIED"))
                .andExpect(jsonPath("$.data[0].occupiedByClientIds[0]").value("clientB"));

        verify(clientConfigService).dataSourceOptions("editor");
    }

    @Test
    void dataSourceOptions_response_shouldNotExposePasswordField() throws Exception {
        ClientConfigDataSourceOptionVO option = new ClientConfigDataSourceOptionVO();
        option.setDataSourceId("DS-A");
        option.setDataSourceName("测试源");
        option.setSelectable(true);
        when(clientConfigService.dataSourceOptions(isNull())).thenReturn(
                Collections.singletonList(option));

        MvcResult result = mockMvc.perform(get("/api/clients/data-source-options"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.code").value(200))
                .andReturn();
        assertFalse(result.getResponse().getContentAsString().contains("password"));
    }

    // ---- E3 新增 ----

    @Test
    void create_shouldReturnOk() throws Exception {
        doNothing().when(clientConfigService).create(any(CreateClientRequest.class));

        mockMvc.perform(post("/api/clients")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(createBody()))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.code").value(200));

        verify(clientConfigService).create(any(CreateClientRequest.class));
    }

    @Test
    void create_missingRequiredField_shouldReturn400() throws Exception {
        mockMvc.perform(post("/api/clients")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{}"))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.code").value(400));
    }

    @Test
    void create_businessError_shouldReturnBusinessCode200() throws Exception {
        org.mockito.Mockito.doThrow(new BusinessException(40100, "探针 ID 不能为空。"))
                .when(clientConfigService).create(any(CreateClientRequest.class));

        mockMvc.perform(post("/api/clients")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(createBody()))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.code").value(40100))
                .andExpect(jsonPath("$.message").value("探针 ID 不能为空。"));
    }

    // ---- E4 编辑 ----

    @Test
    void update_shouldReturnOk() throws Exception {
        doNothing().when(clientConfigService).update(eq("probe-001"), any(UpdateClientRequest.class));

        mockMvc.perform(put("/api/clients/probe-001")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(createBody()))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.code").value(200));

        verify(clientConfigService).update(eq("probe-001"), any(UpdateClientRequest.class));
    }

    @Test
    void update_conflict_shouldReturnBusinessCode() throws Exception {
        org.mockito.Mockito.doThrow(new BusinessException(40940, "探针 ID 已存在冲突（不区分大小写），请更换探针 ID。"))
                .when(clientConfigService).update(eq("probe-001"), any(UpdateClientRequest.class));

        mockMvc.perform(put("/api/clients/probe-001")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(createBody()))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.code").value(40940));
    }

    // ---- E5 删除 ----

    @Test
    void delete_shouldReturnOk() throws Exception {
        doNothing().when(clientConfigService).delete("probe-001");

        mockMvc.perform(delete("/api/clients/probe-001"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.code").value(200));

        verify(clientConfigService).delete("probe-001");
    }

    @Test
    void delete_notFound_shouldReturnBusinessCode() throws Exception {
        org.mockito.Mockito.doThrow(new BusinessException(40440, "探针不存在或已被删除。"))
                .when(clientConfigService).delete("probe-001");

        mockMvc.perform(delete("/api/clients/probe-001"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.code").value(40440));
    }

    // ---- E6/E7 启停 ----

    @Test
    void enable_shouldReturnOk() throws Exception {
        doNothing().when(clientConfigService).enable("probe-001");

        mockMvc.perform(put("/api/clients/probe-001/enable"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.code").value(200));

        verify(clientConfigService).enable("probe-001");
    }

    @Test
    void disable_shouldReturnOk() throws Exception {
        doNothing().when(clientConfigService).disable("probe-001");

        mockMvc.perform(put("/api/clients/probe-001/disable"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.code").value(200));

        verify(clientConfigService).disable("probe-001");
    }

    // ---- 请求体类型错误/畸形 JSON（本地 handler） ----

    @Test
    void create_typeMismatchField_shouldReturn400WithFieldName() throws Exception {
        mockMvc.perform(post("/api/clients")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"clientId\":[],\"clientDesc\":\"desc\",\"dataSourceIds\":[\"DS-A\"]}"))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.code").value(400))
                .andExpect(jsonPath("$.message").value("参数类型错误: clientId"));
    }

    @Test
    void create_malformedJson_shouldReturn400Generic() throws Exception {
        mockMvc.perform(post("/api/clients")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{"))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.code").value(400))
                .andExpect(jsonPath("$.message").value("请求体格式错误"));
    }

    @Test
    void update_typeError_shouldNotLeakDeserializationDetail() throws Exception {
        MvcResult result = mockMvc.perform(put("/api/clients/probe-001")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"clientId\":\"abc\",\"clientDesc\":\"d\",\"dataSourceIds\":{}}"))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.code").value(400))
                .andExpect(jsonPath("$.message").value("参数类型错误: dataSourceIds"))
                .andReturn();
        String body = result.getResponse().getContentAsString();
        assertFalse(body.contains("Cannot deserialize"));
        assertFalse(body.contains("Exception"));
    }

    // ---- helpers ----

    private String createBody() {
        CreateClientRequest req = new CreateClientRequest();
        req.setClientId("probe-001");
        req.setClientDesc("测试探针");
        List<String> ids = Collections.singletonList("DS-A");
        req.setDataSourceIds(ids);
        try {
            return objectMapper.writeValueAsString(req);
        } catch (Exception e) {
            throw new IllegalStateException(e);
        }
    }
}
