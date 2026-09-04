package com.bsoft.cdcconfig.clientconfig.controller;

import com.bsoft.cdcconfig.clientconfig.model.dto.CreateClientRequest;
import com.bsoft.cdcconfig.clientconfig.model.dto.UpdateClientRequest;
import com.bsoft.cdcconfig.clientconfig.model.query.ClientStatus;
import com.bsoft.cdcconfig.clientconfig.model.vo.ClientListVO;
import com.bsoft.cdcconfig.clientconfig.model.vo.ClientConfigDataSourceOptionVO;
import com.bsoft.cdcconfig.clientconfig.service.ClientConfigService;
import com.bsoft.cdcconfig.common.api.ApiResponse;
import com.fasterxml.jackson.databind.JsonMappingException;
import com.fasterxml.jackson.databind.exc.MismatchedInputException;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.Parameter;
import io.swagger.v3.oas.annotations.tags.Tag;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.http.HttpStatus;
import org.springframework.http.converter.HttpMessageNotReadableException;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;

import javax.validation.Valid;
import java.util.List;

/** 探针端管理接口（CCFG-API-003 固定 E1~E7 最小接口集合）。 */
@Tag(name = "探针端管理", description = "探针端列表、数据源候选、新增、编辑、删除、启用与停用")
@RestController
@RequestMapping("/api/clients")
public class ClientConfigController {

    private static final Logger log = LoggerFactory.getLogger(ClientConfigController.class);

    private final ClientConfigService clientConfigService;

    public ClientConfigController(ClientConfigService clientConfigService) {
        this.clientConfigService = clientConfigService;
    }

    @Operation(summary = "查询探针端列表", description = "按关键词字面量包含与状态筛选，返回行内数据源视图与异常")
    @GetMapping
    public ApiResponse<ClientListVO> list(
            @Parameter(description = "关键词（可选，Trim 后为空按无关键词）")
            @RequestParam(required = false) String keyword,
            @Parameter(description = "状态筛选：ALL/ENABLED/DISABLED，缺省 ALL")
            @RequestParam(defaultValue = "ALL") ClientStatus status) {
        return ApiResponse.success(clientConfigService.list(keyword, status));
    }

    @Operation(summary = "查询数据源候选", description = "新增/编辑用候选数据源与占用标记（编辑时传原探针 ID 自排除）")
    @GetMapping("/data-source-options")
    public ApiResponse<List<ClientConfigDataSourceOptionVO>> dataSourceOptions(
            @Parameter(description = "编辑时当前记录原探针 ID，可选")
            @RequestParam(required = false) String excludeClientId) {
        return ApiResponse.success(clientConfigService.dataSourceOptions(excludeClientId));
    }

    @Operation(summary = "新增探针", description = "INSERT 前重读全表校验后写入，FG_ACTIVE='1'")
    @PostMapping
    public ApiResponse<Void> create(@Valid @RequestBody CreateClientRequest request) {
        clientConfigService.create(request);
        return ApiResponse.success();
    }

    @Operation(summary = "编辑探针", description = "按原探针 ID 定位并原子 UPDATE 探针 ID、描述与数据源序列化值")
    @PutMapping("/{originalClientId}")
    public ApiResponse<Void> update(
            @Parameter(description = "原探针 ID") @PathVariable String originalClientId,
            @Valid @RequestBody UpdateClientRequest request) {
        clientConfigService.update(originalClientId, request);
        return ApiResponse.success();
    }

    @Operation(summary = "删除探针", description = "物理删除探针记录，行数必须为 1")
    @DeleteMapping("/{clientId}")
    public ApiResponse<Void> delete(
            @Parameter(description = "探针 ID") @PathVariable String clientId) {
        clientConfigService.delete(clientId);
        return ApiResponse.success();
    }

    @Operation(summary = "启用探针", description = "UPDATE 前重读目标与全表，无重复分配冲突则仅置 FG_ACTIVE='1'")
    @PutMapping("/{clientId}/enable")
    public ApiResponse<Void> enable(
            @Parameter(description = "探针 ID") @PathVariable String clientId) {
        clientConfigService.enable(clientId);
        return ApiResponse.success();
    }

    @Operation(summary = "停用探针", description = "短事务内仅置目标记录 FG_ACTIVE='0'，历史数据源异常不阻断")
    @PutMapping("/{clientId}/disable")
    public ApiResponse<Void> disable(
            @Parameter(description = "探针 ID") @PathVariable String clientId) {
        clientConfigService.disable(clientId);
        return ApiResponse.success();
    }

    /**
     * 请求体字段类型不匹配：按契约返回 HTTP 400 / code=400，可定位字段时消息为"参数类型错误: 字段名"，
     * 无法定位字段名的畸形 JSON 返回脱敏通用消息。只提取 Jackson 路径中的字段名，不输出输入值或异常堆栈。
     */
    @ExceptionHandler(HttpMessageNotReadableException.class)
    @ResponseStatus(HttpStatus.BAD_REQUEST)
    public ApiResponse<Void> handleUnreadableRequestBody(HttpMessageNotReadableException e) {
        String field = resolveTypeErrorField(e);
        log.warn("Invalid client config request body: {}", field != null ? "field=" + field : "malformed");
        String message = field != null ? "参数类型错误: " + field : "请求体格式错误";
        return ApiResponse.fail(400, message);
    }

    private static String resolveTypeErrorField(HttpMessageNotReadableException e) {
        Throwable cause = e.getCause();
        if (cause instanceof MismatchedInputException) {
            List<JsonMappingException.Reference> path = ((MismatchedInputException) cause).getPath();
            if (path != null && !path.isEmpty() && path.get(0).getFieldName() != null) {
                return path.get(0).getFieldName();
            }
        }
        return null;
    }
}
