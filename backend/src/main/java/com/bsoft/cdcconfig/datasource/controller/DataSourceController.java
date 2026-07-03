package com.bsoft.cdcconfig.datasource.controller;

import com.bsoft.cdcconfig.common.api.ApiResponse;
import com.bsoft.cdcconfig.common.page.PageResult;
import com.bsoft.cdcconfig.datasource.dto.DataSourceCreateDTO;
import com.bsoft.cdcconfig.datasource.dto.DataSourceUpdateDTO;
import com.bsoft.cdcconfig.datasource.query.DataSourceQuery;
import com.bsoft.cdcconfig.datasource.service.DataSourceService;
import com.bsoft.cdcconfig.datasource.vo.DataSourceDetailVO;
import com.bsoft.cdcconfig.datasource.vo.DataSourceListVO;
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

@Tag(name = "数据源管理", description = "数据源CRUD与启停管理")
@RestController
@RequestMapping("/api/data-sources")
public class DataSourceController {

    private final DataSourceService dataSourceService;

    public DataSourceController(DataSourceService dataSourceService) {
        this.dataSourceService = dataSourceService;
    }

    @Operation(summary = "分页查询数据源列表", description = "支持按数据源ID精确匹配、按名称模糊匹配，默认按ID升序")
    @GetMapping
    public ApiResponse<PageResult<DataSourceListVO>> list(@Valid DataSourceQuery query) {
        PageResult<DataSourceListVO> page = dataSourceService.queryPage(query);
        return ApiResponse.success(page);
    }

    @Operation(summary = "查询数据源详情", description = "返回基础信息与扩展配置；历史数据缺失扩展配置时extendExists=false")
    @GetMapping("/{dataSourceId}")
    public ApiResponse<DataSourceDetailVO> detail(
            @Parameter(description = "数据源ID") @PathVariable String dataSourceId) {
        DataSourceDetailVO vo = dataSourceService.getDetail(dataSourceId);
        return ApiResponse.success(vo);
    }

    @Operation(summary = "新增数据源", description = "主表与扩展表同一事务保存，默认启用")
    @PostMapping
    public ApiResponse<Void> create(@Valid @RequestBody DataSourceCreateDTO dto) {
        dataSourceService.create(dto);
        return ApiResponse.success();
    }

    @Operation(summary = "修改数据源", description = "支持DATA_SOURCE_ID修改；密码留空不修改原密码；主表与扩展表同一事务更新")
    @PutMapping("/{originalDataSourceId}")
    public ApiResponse<Void> update(
            @Parameter(description = "原数据源ID") @PathVariable String originalDataSourceId,
            @Valid @RequestBody DataSourceUpdateDTO dto) {
        dataSourceService.update(originalDataSourceId, dto);
        return ApiResponse.success();
    }

    @Operation(summary = "删除数据源", description = "不做引用检查；先删扩展表再删主表，同一事务")
    @DeleteMapping("/{dataSourceId}")
    public ApiResponse<Void> delete(
            @Parameter(description = "数据源ID") @PathVariable String dataSourceId) {
        dataSourceService.delete(dataSourceId);
        return ApiResponse.success();
    }

    @Operation(summary = "启用数据源", description = "将FG_ACTIVE设置为1")
    @PutMapping("/{dataSourceId}/enable")
    public ApiResponse<Void> enable(
            @Parameter(description = "数据源ID") @PathVariable String dataSourceId) {
        dataSourceService.enable(dataSourceId);
        return ApiResponse.success();
    }

    @Operation(summary = "停用数据源", description = "将FG_ACTIVE设置为0")
    @PutMapping("/{dataSourceId}/disable")
    public ApiResponse<Void> disable(
            @Parameter(description = "数据源ID") @PathVariable String dataSourceId) {
        dataSourceService.disable(dataSourceId);
        return ApiResponse.success();
    }
}
