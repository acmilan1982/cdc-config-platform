package com.bsoft.cdcconfig.largescreen.stats.controller;

import com.bsoft.cdcconfig.common.api.ApiResponse;
import com.bsoft.cdcconfig.largescreen.stats.service.LargeScreenService;
import com.bsoft.cdcconfig.largescreen.stats.vo.DashboardVO;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@Tag(name = "大屏统计", description = "CDC 大屏数据同步统计查询接口")
@RestController
@RequestMapping("/api/large-screen")
public class LargeScreenController {

    private final LargeScreenService largeScreenService;

    public LargeScreenController(LargeScreenService largeScreenService) {
        this.largeScreenService = largeScreenService;
    }

    @Operation(summary = "大屏仪表盘聚合数据",
            description = "返回大屏所需全部数据：核心指标、覆盖规模、成功率、7日趋势、机构排名、数据流向、数据状态")
    @GetMapping("/dashboard")
    public ApiResponse<DashboardVO> dashboard() {
        DashboardVO vo = largeScreenService.getDashboard();
        return ApiResponse.success(vo);
    }
}
