package com.bsoft.cdcconfig.serverconfig.controller;

import com.bsoft.cdcconfig.common.api.ApiResponse;
import com.bsoft.cdcconfig.serverconfig.dto.ServerConfigRequestParser;
import com.bsoft.cdcconfig.serverconfig.dto.ServerConfigSaveRequest;
import com.bsoft.cdcconfig.serverconfig.service.ServerConfigService;
import com.bsoft.cdcconfig.serverconfig.vo.ServerConfigPageVO;
import com.fasterxml.jackson.databind.JsonNode;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

/**
 * 中心端配置接口（SC-API-020/040）。
 * 只做协议接入与严格请求体结构解析，不拼 SQL、不做业务规则判断（同 LogQueryController 风格）。
 */
@Tag(name = "中心端配置", description = "中心端配置：查询页面数据与批量保存配置值")
@RestController
@RequestMapping("/api/server-config")
public class ServerConfigController {

    private final ServerConfigService serverConfigService;

    public ServerConfigController(ServerConfigService serverConfigService) {
        this.serverConfigService = serverConfigService;
    }

    @Operation(summary = "查询中心端配置页面数据",
            description = "返回唯一中心端 SERVER_ID、配置项总数与全部配置（CONFIG_KEY ASC NULLS LAST 稳定排序）")
    @GetMapping
    public ApiResponse<ServerConfigPageVO> page() {
        return ApiResponse.success(serverConfigService.getPage());
    }

    @Operation(summary = "批量保存配置值",
            description = "请求体顶层为 JSON 对象仅含 items 数组；每条仅 idServerConfig + configValue 两个 JSON 字符串字段")
    @PostMapping("/save")
    public ApiResponse<Void> save(@RequestBody JsonNode root) {
        ServerConfigSaveRequest request = ServerConfigRequestParser.parse(root);
        serverConfigService.save(request);
        return ApiResponse.success();
    }
}
