package com.bsoft.cdcconfig.serverconfig.controller;

import com.bsoft.cdcconfig.serverconfig.dto.ServerConfigSaveRequest;
import com.bsoft.cdcconfig.serverconfig.exception.ServerConfigErrorCode;
import com.bsoft.cdcconfig.serverconfig.service.ServerConfigService;
import com.bsoft.cdcconfig.serverconfig.vo.ServerConfigItemVO;
import com.bsoft.cdcconfig.serverconfig.vo.ServerConfigPageVO;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.WebMvcTest;
import org.springframework.boot.test.mock.mockito.MockBean;
import org.springframework.http.MediaType;
import org.springframework.test.web.servlet.MockMvc;

import java.util.Collections;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

/**
 * HTTP 层（SC-API-020/040）：路由、HTTP 状态、业务码。
 * 结构错误唯一映射 HTTP 400 + code=400；专用业务错误返回 HTTP 200 + 业务码。
 */
@WebMvcTest(ServerConfigController.class)
class ServerConfigControllerTest {

    @Autowired
    private MockMvc mockMvc;

    @MockBean
    private ServerConfigService serverConfigService;

    // ---- GET /api/server-config ----

    @Test
    void page_shouldReturnServerConfigPage() throws Exception {
        ServerConfigItemVO item = new ServerConfigItemVO();
        item.setIdServerConfig("0001");
        item.setConfigKey("auto-create-table");
        item.setConfigDesc("自动建表");
        item.setConfigValue("true");
        item.setEditable(true);

        ServerConfigPageVO vo = new ServerConfigPageVO();
        vo.setServerId("S1");
        vo.setConfigCount(1);
        vo.setItems(Collections.singletonList(item));
        when(serverConfigService.getPage()).thenReturn(vo);

        mockMvc.perform(get("/api/server-config"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.code").value(200))
                .andExpect(jsonPath("$.data.serverId").value("S1"))
                .andExpect(jsonPath("$.data.configCount").value(1))
                .andExpect(jsonPath("$.data.items[0].idServerConfig").value("0001"))
                .andExpect(jsonPath("$.data.items[0].editable").value(true));
    }

    @Test
    void page_noServer_shouldReturnHttp200With40210() throws Exception {
        when(serverConfigService.getPage()).thenThrow(ServerConfigErrorCode.serverNotRegistered());

        mockMvc.perform(get("/api/server-config"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.code").value(ServerConfigErrorCode.SERVER_NOT_REGISTERED));
    }

    @Test
    void page_multipleServers_shouldReturnHttp200With40211() throws Exception {
        when(serverConfigService.getPage()).thenThrow(ServerConfigErrorCode.serverMultipleFound());

        mockMvc.perform(get("/api/server-config"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.code").value(ServerConfigErrorCode.SERVER_MULTIPLE_FOUND));
    }

    // ---- POST /api/server-config/save：成功 ----

    @Test
    void save_validBody_shouldCallServiceAndReturnSuccess() throws Exception {
        mockMvc.perform(post("/api/server-config/save")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"items\":[{\"idServerConfig\":\"0001\",\"configValue\":\"false\"}]}"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.code").value(200));

        verify(serverConfigService).save(any(ServerConfigSaveRequest.class));
    }

    // ---- 结构错误 → HTTP 400 + code=400 ----

    @Test
    void save_malformedJson_shouldReturnHttp400() throws Exception {
        mockMvc.perform(post("/api/server-config/save")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"items\":["))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.code").value(400));
        verify(serverConfigService, never()).save(any(ServerConfigSaveRequest.class));
    }

    @Test
    void save_topLevelNotObject_shouldReturnHttp400() throws Exception {
        mockMvc.perform(post("/api/server-config/save")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("[1,2]"))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.code").value(400));
        verify(serverConfigService, never()).save(any(ServerConfigSaveRequest.class));
    }

    @Test
    void save_itemsNotArray_shouldReturnHttp400() throws Exception {
        mockMvc.perform(post("/api/server-config/save")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"items\":{}}"))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.code").value(400));
        verify(serverConfigService, never()).save(any(ServerConfigSaveRequest.class));
    }

    @Test
    void save_itemNotObject_shouldReturnHttp400() throws Exception {
        mockMvc.perform(post("/api/server-config/save")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"items\":[123]}"))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.code").value(400));
        verify(serverConfigService, never()).save(any(ServerConfigSaveRequest.class));
    }

    // ---- 额外字段 → 40227 ----

    @Test
    void save_topLevelExtraField_shouldReturnHttp200With40227() throws Exception {
        mockMvc.perform(post("/api/server-config/save")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"items\":[],\"serverId\":\"S1\"}"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.code").value(ServerConfigErrorCode.REQUEST_FIELD_NOT_ALLOWED));
        verify(serverConfigService, never()).save(any(ServerConfigSaveRequest.class));
    }

    @Test
    void save_itemExtraField_shouldReturnHttp200With40227() throws Exception {
        mockMvc.perform(post("/api/server-config/save")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"items\":[{\"idServerConfig\":\"1\",\"configValue\":\"true\",\"isEditable\":\"1\"}]}"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.code").value(ServerConfigErrorCode.REQUEST_FIELD_NOT_ALLOWED));
        verify(serverConfigService, never()).save(any(ServerConfigSaveRequest.class));
    }

    // ---- 批量级错误 ----

    @Test
    void save_missingItems_shouldReturnHttp200With40220() throws Exception {
        mockMvc.perform(post("/api/server-config/save")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{}"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.code").value(ServerConfigErrorCode.BATCH_EMPTY));
        verify(serverConfigService, never()).save(any(ServerConfigSaveRequest.class));
    }

    @Test
    void save_tooManyItems_shouldReturnHttp200With40221() throws Exception {
        StringBuilder sb = new StringBuilder("{\"items\":[");
        for (int i = 1; i <= 201; i++) {
            if (i > 1) {
                sb.append(',');
            }
            sb.append("{\"idServerConfig\":\"").append(i).append("\",\"configValue\":\"true\"}");
        }
        sb.append("]}");
        mockMvc.perform(post("/api/server-config/save")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(sb.toString()))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.code").value(ServerConfigErrorCode.ITEM_COUNT_EXCEEDED));
        verify(serverConfigService, never()).save(any(ServerConfigSaveRequest.class));
    }

    @Test
    void save_duplicateId_shouldReturnHttp200With40222() throws Exception {
        mockMvc.perform(post("/api/server-config/save")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"items\":[{\"idServerConfig\":\"1\",\"configValue\":\"true\"},{\"idServerConfig\":\"1\",\"configValue\":\"false\"}]}"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.code").value(ServerConfigErrorCode.DUPLICATE_ID));
        verify(serverConfigService, never()).save(any(ServerConfigSaveRequest.class));
    }

    // ---- 主键错误 → 40223 ----

    @Test
    void save_invalidId_shouldReturnHttp200With40223() throws Exception {
        mockMvc.perform(post("/api/server-config/save")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"items\":[{\"configValue\":\"true\"}]}"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.code").value(ServerConfigErrorCode.ID_INVALID));
        verify(serverConfigService, never()).save(any(ServerConfigSaveRequest.class));
    }

    // ---- 值错误 ----

    @Test
    void save_valueEmpty_shouldReturnHttp200With40224() throws Exception {
        mockMvc.perform(post("/api/server-config/save")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"items\":[{\"idServerConfig\":\"1\"}]}"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.code").value(ServerConfigErrorCode.VALUE_EMPTY));
        verify(serverConfigService, never()).save(any(ServerConfigSaveRequest.class));
    }

    @Test
    void save_valueNonString_shouldReturnHttp200With40226() throws Exception {
        mockMvc.perform(post("/api/server-config/save")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"items\":[{\"idServerConfig\":\"1\",\"configValue\":123}]}"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.code").value(ServerConfigErrorCode.VALUE_FORMAT_INVALID));
        verify(serverConfigService, never()).save(any(ServerConfigSaveRequest.class));
    }

    @Test
    void save_valueTooLong_shouldReturnHttp200With40225() throws Exception {
        String value = repeat("t", 65);
        mockMvc.perform(post("/api/server-config/save")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"items\":[{\"idServerConfig\":\"1\",\"configValue\":\"" + value + "\"}]}"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.code").value(ServerConfigErrorCode.VALUE_LENGTH_EXCEEDED));
        verify(serverConfigService, never()).save(any(ServerConfigSaveRequest.class));
    }

    // ---- Service 业务错误与 DB 错误透传 ----

    @Test
    void save_serviceConfigRecordNotFound_shouldReturnHttp200With40420() throws Exception {
        org.mockito.Mockito.doThrow(ServerConfigErrorCode.configRecordNotFound())
                .when(serverConfigService).save(any(ServerConfigSaveRequest.class));

        mockMvc.perform(post("/api/server-config/save")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"items\":[{\"idServerConfig\":\"1\",\"configValue\":\"true\"}]}"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.code").value(ServerConfigErrorCode.CONFIG_RECORD_NOT_FOUND));
    }

    @Test
    void save_serviceSaveFailed_shouldReturnHttp200With50030() throws Exception {
        org.mockito.Mockito.doThrow(ServerConfigErrorCode.saveFailed())
                .when(serverConfigService).save(any(ServerConfigSaveRequest.class));

        mockMvc.perform(post("/api/server-config/save")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"items\":[{\"idServerConfig\":\"1\",\"configValue\":\"true\"}]}"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.code").value(ServerConfigErrorCode.SAVE_FAILED));
    }

    private static String repeat(String s, int n) {
        StringBuilder sb = new StringBuilder();
        for (int i = 0; i < n; i++) {
            sb.append(s);
        }
        return sb.toString();
    }
}
