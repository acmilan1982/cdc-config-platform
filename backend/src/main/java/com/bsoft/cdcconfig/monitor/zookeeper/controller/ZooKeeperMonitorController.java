package com.bsoft.cdcconfig.monitor.zookeeper.controller;

import com.bsoft.cdcconfig.common.api.ApiResponse;
import com.bsoft.cdcconfig.monitor.zookeeper.config.ZooKeeperConfig;
import com.bsoft.cdcconfig.monitor.zookeeper.service.ZooKeeperMonitorService;
import com.bsoft.cdcconfig.monitor.zookeeper.vo.ZooKeeperClientMonitorResponse;
import com.bsoft.cdcconfig.monitor.zookeeper.vo.ZooKeeperHealthResponse;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.media.Content;
import io.swagger.v3.oas.annotations.media.Schema;
import io.swagger.v3.oas.annotations.responses.ApiResponses;
import io.swagger.v3.oas.annotations.tags.Tag;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/monitor/zookeeper")
@Tag(name = "ZooKeeper 客户端监控", description = "CDC 客户端节点只读监控接口")
public class ZooKeeperMonitorController {

    private static final Logger log = LoggerFactory.getLogger(ZooKeeperMonitorController.class);

    private final ZooKeeperMonitorService monitorService;
    private final ZooKeeperConfig zkConfig;

    public ZooKeeperMonitorController(ZooKeeperMonitorService monitorService, ZooKeeperConfig zkConfig) {
        this.monitorService = monitorService;
        this.zkConfig = zkConfig;
    }

    @GetMapping("/clients")
    @Operation(
            summary = "查询全部 CDC 客户端节点",
            description = "读取 /bsoft-cdc/clients 下所有客户端及其 jobs，聚合返回在线状态、IP、status、detailInfo、SCN 等信息。在线状态唯一依据 alive 临时节点是否存在。单客户端/单 job 异常不导致整体失败。"
    )
    @io.swagger.v3.oas.annotations.responses.ApiResponse(
            responseCode = "200",
            description = "成功返回客户端监控数据，可能包含 partialFailure 标记",
            content = @Content(schema = @Schema(implementation = ZooKeeperClientMonitorResponse.class))
    )
    public ApiResponse<ZooKeeperClientMonitorResponse> getClients() {
        log.debug("ZK monitor clients request");
        ZooKeeperClientMonitorResponse data = monitorService.getClients();
        return ApiResponse.success(data);
    }

    @GetMapping("/health")
    @Operation(
            summary = "ZooKeeper 连接健康检查",
            description = "检查本平台到 ZooKeeper 的连接状态，不读取业务节点数据。"
    )
    public ApiResponse<ZooKeeperHealthResponse> health() {
        ZooKeeperHealthResponse health = new ZooKeeperHealthResponse();
        health.setConnectString(zkConfig.getConnectString());
        health.setRootPath(zkConfig.getRootPath());

        try {
            boolean connected = monitorService.isZooKeeperConnected();
            health.setConnected(connected);
            if (!connected) {
                health.setErrorMessage("ZooKeeper 未连接");
            }
        } catch (Exception e) {
            log.warn("ZK health check failed", e);
            health.setConnected(false);
            health.setErrorMessage(e.getMessage());
        }

        return ApiResponse.success(health);
    }
}
