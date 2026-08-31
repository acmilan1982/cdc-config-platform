package com.bsoft.cdcconfig.subscription.controller;

import com.bsoft.cdcconfig.common.api.ApiResponse;
import com.bsoft.cdcconfig.subscription.dto.SubscriptionQuery;
import com.bsoft.cdcconfig.subscription.dto.SubscriptionSaveDTO;
import com.bsoft.cdcconfig.subscription.exception.BadRequestException;
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
import com.bsoft.cdcconfig.subscription.vo.ValidationErrorsVO;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.Parameter;
import io.swagger.v3.oas.annotations.tags.Tag;
import org.springframework.http.HttpStatus;
import org.springframework.http.converter.HttpMessageNotReadableException;
import org.springframework.web.bind.MissingServletRequestParameterException;
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

import javax.servlet.http.HttpServletRequest;
import java.util.Arrays;
import java.util.Collections;
import java.util.List;

/**
 * 数据订阅接口（API.md §2，共 10 个端点）。
 *
 * <p>本地 {@code @ExceptionHandler} 优先于全局 {@code GlobalExceptionHandler}：
 * SubscriptionValidationException（40300 + data.validationErrors）与请求契约错误
 * （HTTP 400）都在本类收敛，避免 40300 的 data 被全局处理器置空。</p>
 */
@Tag(name = "数据订阅", description = "订阅配置候选、列表、详情、源库元数据、新增、编辑、删除预览与物理删除")
@RestController
@RequestMapping("/api/subscriptions")
public class SubscriptionController {

    private final SubscriptionService subscriptionService;
    private final SourceMetadataService sourceMetadataService;

    public SubscriptionController(SubscriptionService subscriptionService,
                                  SourceMetadataService sourceMetadataService) {
        this.subscriptionService = subscriptionService;
        this.sourceMetadataService = sourceMetadataService;
    }

    @Operation(summary = "查询源库/目标库启用候选", description = "一次返回源库与目标库两类候选，均仅启用记录")
    @GetMapping("/options")
    public ApiResponse<OptionsVO> options() {
        return ApiResponse.success(subscriptionService.options());
    }

    @Operation(summary = "查询启用订阅列表", description = "可带源库/目标库多选条件，服务层 Java 过滤，无分页")
    @GetMapping
    public ApiResponse<SubscriptionListVO> list(HttpServletRequest request) {
        SubscriptionQuery query = new SubscriptionQuery();
        query.setSourceIds(asList(request.getParameterValues("sourceIds")));
        query.setTargetIds(asList(request.getParameterValues("targetIds")));
        return ApiResponse.success(subscriptionService.list(query));
    }

    @Operation(summary = "查询订阅详情", description = "只读已保存配置与数据源映射，不连接源 Oracle")
    @GetMapping("/{dataSubId}")
    public ApiResponse<SubscriptionDetailVO> detail(
            @Parameter(description = "订阅ID") @PathVariable String dataSubId) {
        return ApiResponse.success(subscriptionService.detail(dataSubId));
    }

    @Operation(summary = "查询源库 Schema 列表", description = "源库可访问且含普通表的非系统 Schema")
    @GetMapping("/metadata/schemas")
    public ApiResponse<SchemaVO> schemas(
            @Parameter(description = "源库ID（原始字符串）") @RequestParam String dataSourceId) {
        return ApiResponse.success(sourceMetadataService.listSchemas(dataSourceId));
    }

    @Operation(summary = "按 Schema 查询普通表", description = "不含视图、物化视图、同义词")
    @GetMapping("/metadata/tables")
    public ApiResponse<TableVO> tables(
            @Parameter(description = "源库ID（原始字符串）") @RequestParam String dataSourceId,
            @Parameter(description = "Schema名（原始字符串）") @RequestParam String schema) {
        return ApiResponse.success(sourceMetadataService.listTables(dataSourceId, schema));
    }

    @Operation(summary = "新增订阅", description = "恒为 REPLACE 语义；返回后端生成的订阅ID")
    @PostMapping
    public ApiResponse<String> create(@RequestBody SubscriptionSaveDTO dto) {
        return ApiResponse.success(subscriptionService.create(dto));
    }

    @Operation(summary = "编辑打开", description = "回显原配置与已选 Schema/表；best-effort 源表有效性核对")
    @GetMapping("/{dataSubId}/edit")
    public ApiResponse<SubscriptionEditOpenVO> edit(
            @Parameter(description = "订阅ID") @PathVariable String dataSubId) {
        return ApiResponse.success(subscriptionService.editOpen(dataSubId));
    }

    @Operation(summary = "编辑保存", description = "PRESERVE/REPLACE 语义；PRESERVE 不重写 DATA_SOURCE_TABLE")
    @PutMapping("/{dataSubId}")
    public ApiResponse<Void> update(
            @Parameter(description = "订阅ID") @PathVariable String dataSubId,
            @RequestBody SubscriptionSaveDTO dto) {
        subscriptionService.update(dataSubId, dto);
        return ApiResponse.success();
    }

    @Operation(summary = "删除预览", description = "只读配置库，返回删除确认所需信息，不锁行")
    @GetMapping("/{dataSubId}/delete-preview")
    public ApiResponse<SubscriptionDeletePreviewVO> deletePreview(
            @Parameter(description = "订阅ID") @PathVariable String dataSubId) {
        return ApiResponse.success(subscriptionService.deletePreview(dataSubId));
    }

    @Operation(summary = "物理删除订阅", description = "按主键物理删除，不携带并发字段")
    @DeleteMapping("/{dataSubId}")
    public ApiResponse<Void> delete(
            @Parameter(description = "订阅ID") @PathVariable String dataSubId) {
        subscriptionService.delete(dataSubId);
        return ApiResponse.success();
    }

    /**
     * 批量校验失败（API.md §4.6）：HTTP 200 + code=40300，data 携带结构化 validationErrors。
     * 本地处理器保证 data 不被全局 BusinessException 处理器置空。
     */
    @ExceptionHandler(SubscriptionValidationException.class)
    @ResponseStatus(HttpStatus.OK)
    public ApiResponse<ValidationErrorsVO> handleSubscriptionValidation(SubscriptionValidationException e) {
        ApiResponse<ValidationErrorsVO> response = ApiResponse.fail(e.getCode(), e.getMessage());
        response.setData(new ValidationErrorsVO(e.getValidationErrors()));
        return response;
    }

    /**
     * 请求契约错误（空白查询候选、非法 sourceSelectionMode、空请求体等）：HTTP 400 + code=400。
     */
    @ExceptionHandler(BadRequestException.class)
    @ResponseStatus(HttpStatus.BAD_REQUEST)
    public ApiResponse<Void> handleBadRequest(BadRequestException e) {
        return ApiResponse.fail(400, e.getMessage());
    }

    @ExceptionHandler(HttpMessageNotReadableException.class)
    @ResponseStatus(HttpStatus.BAD_REQUEST)
    public ApiResponse<Void> handleUnreadableRequestBody(HttpMessageNotReadableException e) {
        return ApiResponse.fail(400, "请求体格式错误或为空");
    }

    @ExceptionHandler(MissingServletRequestParameterException.class)
    @ResponseStatus(HttpStatus.BAD_REQUEST)
    public ApiResponse<Void> handleMissingParam(MissingServletRequestParameterException e) {
        return ApiResponse.fail(400, "缺少请求参数: " + e.getParameterName());
    }

    private static List<String> asList(String[] values) {
        if (values == null || values.length == 0) {
            return Collections.emptyList();
        }
        return Arrays.asList(values);
    }
}
