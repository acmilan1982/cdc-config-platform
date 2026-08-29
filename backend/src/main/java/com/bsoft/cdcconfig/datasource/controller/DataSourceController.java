package com.bsoft.cdcconfig.datasource.controller;

import com.bsoft.cdcconfig.common.api.ApiResponse;
import com.bsoft.cdcconfig.datasource.dto.BizAttrSaveDTO;
import com.bsoft.cdcconfig.datasource.dto.DataSourceCreateDTO;
import com.bsoft.cdcconfig.datasource.dto.DataSourceUpdateDTO;
import com.bsoft.cdcconfig.datasource.dto.NamingStrategyDTO;
import com.bsoft.cdcconfig.datasource.dto.TestConnectionDTO;
import com.bsoft.cdcconfig.datasource.query.DataSourceQuery;
import com.bsoft.cdcconfig.datasource.service.DataSourceService;
import com.bsoft.cdcconfig.datasource.vo.BizAttrVO;
import com.bsoft.cdcconfig.datasource.vo.DataSourceDetailVO;
import com.bsoft.cdcconfig.datasource.vo.DataSourceListVO;
import com.bsoft.cdcconfig.datasource.vo.NamingStrategyVO;
import com.bsoft.cdcconfig.datasource.vo.TargetOptionVO;
import com.bsoft.cdcconfig.datasource.vo.TestConnectionResultVO;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.Parameter;
import io.swagger.v3.oas.annotations.tags.Tag;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import javax.validation.Valid;
import java.util.List;

@Tag(name = "数据源管理", description = "数据源CRUD、连接测试与命名策略管理")
@RestController
@RequestMapping("/api/data-sources")
public class DataSourceController {

    private final DataSourceService dataSourceService;

    public DataSourceController(DataSourceService dataSourceService) {
        this.dataSourceService = dataSourceService;
    }

    @Operation(summary = "查询数据源列表", description = "支持按数据源ID、名称、主机模糊匹配，仅返回启用数据源，按ID升序")
    @GetMapping
    public ApiResponse<List<DataSourceListVO>> list(@Valid DataSourceQuery query) {
        return ApiResponse.success(dataSourceService.list(query));
    }

    @Operation(summary = "测试数据源连接", description = "仅测试连接有效性，不保存任何数据")
    @PostMapping("/test-connection")
    public ApiResponse<TestConnectionResultVO> testConnection(
            @Valid @RequestBody TestConnectionDTO dto) {
        return ApiResponse.success(dataSourceService.testConnection(dto));
    }

    @Operation(summary = "查询目标库选项", description = "返回所有启用的目标库，用于命名策略配置")
    @GetMapping("/target-options")
    public ApiResponse<List<TargetOptionVO>> targetOptions() {
        return ApiResponse.success(dataSourceService.targetOptions());
    }

    @Operation(summary = "查询数据源详情", description = "返回数据源基础信息")
    @GetMapping("/{dataSourceId}")
    public ApiResponse<DataSourceDetailVO> detail(
            @Parameter(description = "数据源ID") @PathVariable String dataSourceId) {
        return ApiResponse.success(dataSourceService.getDetail(dataSourceId));
    }

    @Operation(summary = "新增数据源", description = "新增成功后返回新数据源ID")
    @PostMapping
    public ApiResponse<String> create(@Valid @RequestBody DataSourceCreateDTO dto) {
        return ApiResponse.success(dataSourceService.create(dto));
    }

    @Operation(summary = "修改数据源", description = "支持修改DATA_SOURCE_ID；密码留空不修改原密码；返回编辑后的数据源ID")
    @PutMapping("/{originalDataSourceId}")
    public ApiResponse<String> update(
            @Parameter(description = "原数据源ID") @PathVariable String originalDataSourceId,
            @Valid @RequestBody DataSourceUpdateDTO dto) {
        return ApiResponse.success(dataSourceService.update(originalDataSourceId, dto));
    }

    @Operation(summary = "删除数据源", description = "物理删除数据源记录")
    @DeleteMapping("/{dataSourceId}")
    public ApiResponse<Void> delete(
            @Parameter(description = "数据源ID") @PathVariable String dataSourceId) {
        dataSourceService.delete(dataSourceId);
        return ApiResponse.success();
    }

    @Operation(summary = "查询数据源业务属性", description = "仅目标库支持读取业务属性")
    @GetMapping("/{dataSourceId}/biz-attr")
    public ApiResponse<BizAttrVO> getBizAttr(
            @Parameter(description = "数据源ID") @PathVariable String dataSourceId) {
        return ApiResponse.success(dataSourceService.getBizAttr(dataSourceId));
    }

    @Operation(summary = "保存数据源业务属性", description = "仅目标库支持保存业务属性")
    @PutMapping("/{dataSourceId}/biz-attr")
    public ApiResponse<Void> saveBizAttr(
            @Parameter(description = "数据源ID") @PathVariable String dataSourceId,
            @Valid @RequestBody BizAttrSaveDTO dto) {
        dataSourceService.saveBizAttr(dataSourceId, dto);
        return ApiResponse.success();
    }

    @Operation(summary = "查询命名策略列表", description = "查询指定源库的命名策略列表")
    @GetMapping("/{sourceId}/naming-strategies")
    public ApiResponse<List<NamingStrategyVO>> listNamingStrategies(
            @Parameter(description = "源库数据源ID") @PathVariable String sourceId) {
        return ApiResponse.success(dataSourceService.listNamingStrategies(sourceId));
    }

    @Operation(summary = "新增命名策略", description = "同一源库到同一目标库的命名策略不允许重复")
    @PostMapping("/{sourceId}/naming-strategies")
    public ApiResponse<Void> createNamingStrategy(
            @Parameter(description = "源库数据源ID") @PathVariable String sourceId,
            @Valid @RequestBody NamingStrategyDTO dto) {
        dataSourceService.createNamingStrategy(sourceId, dto);
        return ApiResponse.success();
    }

    @Operation(summary = "修改命名策略", description = "支持修改目标库；修改后的逻辑键不允许重复")
    @PutMapping("/{sourceId}/naming-strategies/{originalTargetId}")
    public ApiResponse<Void> updateNamingStrategy(
            @Parameter(description = "源库数据源ID") @PathVariable String sourceId,
            @Parameter(description = "原目标库数据源ID") @PathVariable String originalTargetId,
            @Valid @RequestBody NamingStrategyDTO dto) {
        dataSourceService.updateNamingStrategy(sourceId, originalTargetId, dto);
        return ApiResponse.success();
    }

    @Operation(summary = "删除命名策略", description = "删除指定源库到指定目标库的命名策略")
    @DeleteMapping("/{sourceId}/naming-strategies/{targetId}")
    public ApiResponse<Void> deleteNamingStrategy(
            @Parameter(description = "源库数据源ID") @PathVariable String sourceId,
            @Parameter(description = "目标库数据源ID") @PathVariable String targetId) {
        dataSourceService.deleteNamingStrategy(sourceId, targetId);
        return ApiResponse.success();
    }
}
