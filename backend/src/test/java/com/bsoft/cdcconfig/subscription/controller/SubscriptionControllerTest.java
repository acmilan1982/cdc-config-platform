package com.bsoft.cdcconfig.subscription.controller;

import com.bsoft.cdcconfig.subscription.dto.SubscriptionQuery;
import com.bsoft.cdcconfig.subscription.dto.SubscriptionSaveDTO;
import com.bsoft.cdcconfig.subscription.exception.BadRequestException;
import com.bsoft.cdcconfig.subscription.exception.SubscriptionErrorCode;
import com.bsoft.cdcconfig.subscription.exception.SubscriptionValidationException;
import com.bsoft.cdcconfig.subscription.service.SourceMetadataService;
import com.bsoft.cdcconfig.subscription.service.SubscriptionService;
import com.bsoft.cdcconfig.subscription.vo.OptionsVO;
import com.bsoft.cdcconfig.subscription.vo.SchemaVO;
import com.bsoft.cdcconfig.subscription.vo.SubscriptionDeletePreviewVO;
import com.bsoft.cdcconfig.subscription.vo.SubscriptionDetailVO;
import com.bsoft.cdcconfig.subscription.vo.SubscriptionEditOpenVO;
import com.bsoft.cdcconfig.subscription.vo.SubscriptionListVO;
import com.bsoft.cdcconfig.subscription.vo.TableVO;
import com.bsoft.cdcconfig.subscription.vo.ValidationErrorVO;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.WebMvcTest;
import org.springframework.boot.test.mock.mockito.MockBean;
import org.springframework.http.MediaType;
import org.springframework.test.web.servlet.MockMvc;

import java.util.Arrays;
import java.util.Collections;

import static org.junit.jupiter.api.Assertions.assertEquals;
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

/**
 * 数据订阅 10 个端点（API.md §2）：路径、查询参数、成功响应、核心错误
 * （40430 / 40300+validationErrors 本地处理器 / BadRequest 400 / 请求体格式错误 400 /
 * 缺少请求参数 400）。
 */
@WebMvcTest(SubscriptionController.class)
class SubscriptionControllerTest {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private ObjectMapper objectMapper;

    @MockBean
    private SubscriptionService subscriptionService;

    @MockBean
    private SourceMetadataService sourceMetadataService;

    // ---- options ----
    @Test
    void options_shouldReturnBothCandidates() throws Exception {
        when(subscriptionService.options()).thenReturn(new OptionsVO());

        mockMvc.perform(get("/api/subscriptions/options"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.code").value(200));
    }

    // ---- list ----
    @Test
    void list_shouldPassSourceTargetParams() throws Exception {
        when(subscriptionService.list(any())).thenReturn(new SubscriptionListVO());

        mockMvc.perform(get("/api/subscriptions")
                        .param("sourceIds", "S01", "S02")
                        .param("targetIds", "T01"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.code").value(200));

        org.mockito.ArgumentCaptor<SubscriptionQuery> captor =
                org.mockito.ArgumentCaptor.forClass(SubscriptionQuery.class);
        verify(subscriptionService).list(captor.capture());
        assertEquals(Arrays.asList("S01", "S02"), captor.getValue().getSourceIds());
        assertEquals(Collections.singletonList("T01"), captor.getValue().getTargetIds());
    }

    @Test
    void list_withoutFilters_shouldPassEmpty() throws Exception {
        when(subscriptionService.list(any())).thenReturn(new SubscriptionListVO());

        mockMvc.perform(get("/api/subscriptions"))
                .andExpect(status().isOk());

        org.mockito.ArgumentCaptor<SubscriptionQuery> captor =
                org.mockito.ArgumentCaptor.forClass(SubscriptionQuery.class);
        verify(subscriptionService).list(captor.capture());
        assertEquals(0, captor.getValue().getSourceIds().size());
        assertEquals(0, captor.getValue().getTargetIds().size());
    }

    // ---- detail ----
    @Test
    void detail_shouldReturnDetail() throws Exception {
        SubscriptionDetailVO vo = new SubscriptionDetailVO();
        vo.setDataSubId("SUB001");
        when(subscriptionService.detail("SUB001")).thenReturn(vo);

        mockMvc.perform(get("/api/subscriptions/SUB001"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.code").value(200))
                .andExpect(jsonPath("$.data.dataSubId").value("SUB001"));
    }

    @Test
    void detail_notFound_shouldReturn40430() throws Exception {
        when(subscriptionService.detail("NOPE")).thenThrow(SubscriptionErrorCode.subscriptionNotFound());

        mockMvc.perform(get("/api/subscriptions/NOPE"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.code").value(40430));
    }

    // ---- metadata: schemas ----
    @Test
    void schemas_shouldReturnSchemas() throws Exception {
        SchemaVO vo = new SchemaVO();
        vo.setDataSourceId("S01");
        vo.setFilterMode("ORACLE_MAINTAINED");
        vo.setSchemas(Collections.singletonList("SCHEMA_A"));
        when(sourceMetadataService.listSchemas("S01")).thenReturn(vo);

        mockMvc.perform(get("/api/subscriptions/metadata/schemas").param("dataSourceId", "S01"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.code").value(200))
                .andExpect(jsonPath("$.data.filterMode").value("ORACLE_MAINTAINED"));
    }

    @Test
    void schemas_missingParam_shouldReturn400() throws Exception {
        mockMvc.perform(get("/api/subscriptions/metadata/schemas"))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.code").value(400))
                .andExpect(jsonPath("$.message").value("缺少请求参数: dataSourceId"));
    }

    // ---- metadata: tables ----
    @Test
    void tables_shouldReturnTables() throws Exception {
        TableVO vo = new TableVO();
        vo.setDataSourceId("S01");
        vo.setSchema("SCHEMA_A");
        vo.setTables(Collections.singletonList("TABLE_1"));
        when(sourceMetadataService.listTables("S01", "SCHEMA_A")).thenReturn(vo);

        mockMvc.perform(get("/api/subscriptions/metadata/tables")
                        .param("dataSourceId", "S01")
                        .param("schema", "SCHEMA_A"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.code").value(200))
                .andExpect(jsonPath("$.data.tables[0]").value("TABLE_1"));
    }

    // ---- create ----
    @Test
    void create_shouldReturnDataSubIdAsObject() throws Exception {
        when(subscriptionService.create(any(SubscriptionSaveDTO.class))).thenReturn("uuid32...");
        String body = "{\"dataSubDesc\":\"订阅\",\"dataFromSourceId\":\"S01\","
                + "\"dataToSourceIds\":[\"T01\"],\"sourceSelectionMode\":\"REPLACE\","
                + "\"sourceTables\":[{\"schemaName\":\"SCHEMA_A\",\"tableName\":\"TABLE_1\"}]}";

        mockMvc.perform(post("/api/subscriptions")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(body))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.code").value(200))
                .andExpect(jsonPath("$.data").isMap())
                .andExpect(jsonPath("$.data.dataSubId").value("uuid32..."));

        verify(subscriptionService).create(any(SubscriptionSaveDTO.class));
    }

    @Test
    void create_validationFailed_shouldReturn40300WithValidationErrors() throws Exception {
        ValidationErrorVO item = new ValidationErrorVO();
        item.setErrorCode("40310");
        item.setField("dataSubDesc");
        item.setName(null);
        item.setMessage("订阅描述不能为空");
        when(subscriptionService.create(any(SubscriptionSaveDTO.class)))
                .thenThrow(new SubscriptionValidationException(Collections.singletonList(item)));
        String body = "{}";

        mockMvc.perform(post("/api/subscriptions")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(body))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.code").value(40300))
                .andExpect(jsonPath("$.data.validationErrors[0].errorCode").value("40310"))
                .andExpect(jsonPath("$.data.validationErrors[0].message").value("订阅描述不能为空"));
    }

    @Test
    void create_badRequest_shouldReturn400() throws Exception {
        when(subscriptionService.create(any(SubscriptionSaveDTO.class)))
                .thenThrow(new BadRequestException("请求体不能为空"));
        String body = "{}";

        mockMvc.perform(post("/api/subscriptions")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(body))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.code").value(400))
                .andExpect(jsonPath("$.message").value("请求体不能为空"));
    }

    @Test
    void create_malformedJson_shouldReturn400() throws Exception {
        mockMvc.perform(post("/api/subscriptions")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{"))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.code").value(400))
                .andExpect(jsonPath("$.message").value("请求体格式错误或为空"));
    }

    // ---- edit ----
    @Test
    void edit_shouldReturnEditOpen() throws Exception {
        SubscriptionEditOpenVO vo = new SubscriptionEditOpenVO();
        vo.setDataSubId("SUB001");
        vo.setSourceTableCheck("CHECKED");
        when(subscriptionService.editOpen("SUB001")).thenReturn(vo);

        mockMvc.perform(get("/api/subscriptions/SUB001/edit"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.code").value(200))
                .andExpect(jsonPath("$.data.sourceTableCheck").value("CHECKED"));
    }

    // ---- update ----
    @Test
    void update_shouldSucceed() throws Exception {
        doNothing().when(subscriptionService).update(eq("SUB001"), any(SubscriptionSaveDTO.class));
        String body = "{\"dataSubDesc\":\"订阅\",\"dataFromSourceId\":\"S01\","
                + "\"dataToSourceIds\":[\"T01\"],\"sourceSelectionMode\":\"PRESERVE\"}";

        mockMvc.perform(put("/api/subscriptions/SUB001")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(body))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.code").value(200));

        verify(subscriptionService).update(eq("SUB001"), any(SubscriptionSaveDTO.class));
    }

    // ---- delete-preview ----
    @Test
    void deletePreview_shouldReturnPreview() throws Exception {
        SubscriptionDeletePreviewVO vo = new SubscriptionDeletePreviewVO();
        vo.setDataSubId("SUB001");
        vo.setTableCount(2);
        when(subscriptionService.deletePreview("SUB001")).thenReturn(vo);

        mockMvc.perform(get("/api/subscriptions/SUB001/delete-preview"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.code").value(200))
                .andExpect(jsonPath("$.data.tableCount").value(2));
    }

    // ---- delete ----
    @Test
    void delete_shouldSucceed() throws Exception {
        doNothing().when(subscriptionService).delete("SUB001");

        mockMvc.perform(delete("/api/subscriptions/SUB001"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.code").value(200));

        verify(subscriptionService).delete("SUB001");
    }
}
