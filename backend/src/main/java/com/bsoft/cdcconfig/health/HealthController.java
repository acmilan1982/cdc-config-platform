package com.bsoft.cdcconfig.health;

import com.bsoft.cdcconfig.common.api.ApiResponse;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.time.LocalDateTime;
import java.util.LinkedHashMap;
import java.util.Map;

@RestController
@RequestMapping("/api")
@Tag(name = "健康检查", description = "应用健康检查接口")
public class HealthController {

    @Value("${spring.application.name:cdc-config-platform}")
    private String appName;

    @GetMapping("/health")
    @Operation(summary = "健康检查", description = "返回应用运行状态")
    public ApiResponse<Map<String, Object>> health() {
        Map<String, Object> info = new LinkedHashMap<>();
        info.put("status", "UP");
        info.put("appName", appName);
        info.put("currentTime", LocalDateTime.now().toString());
        return ApiResponse.success(info);
    }
}
