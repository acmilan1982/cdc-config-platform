package com.bsoft.cdcconfig.monitor.zookeeper.controller;

import com.bsoft.cdcconfig.monitor.zookeeper.config.ZooKeeperConfig;
import com.bsoft.cdcconfig.monitor.zookeeper.service.ZooKeeperMonitorService;
import com.bsoft.cdcconfig.monitor.zookeeper.vo.ZooKeeperClientMonitorResponse;
import com.bsoft.cdcconfig.monitor.zookeeper.vo.ZooKeeperClientVO;
import com.bsoft.cdcconfig.monitor.zookeeper.vo.ZooKeeperJobVO;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.WebMvcTest;
import org.springframework.boot.test.mock.mockito.MockBean;
import org.springframework.test.web.servlet.MockMvc;

import java.util.Collections;

import static org.hamcrest.Matchers.containsString;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@WebMvcTest(ZooKeeperMonitorController.class)
class ZooKeeperMonitorControllerTest {

    @Autowired
    private MockMvc mockMvc;

    @MockBean
    private ZooKeeperMonitorService monitorService;

    @MockBean
    private ZooKeeperConfig zooKeeperConfig;

    @Test
    void shouldReturnSuccessForClientsEndpoint() throws Exception {
        ZooKeeperClientMonitorResponse resp = new ZooKeeperClientMonitorResponse();
        ZooKeeperClientVO client = new ZooKeeperClientVO();
        client.setClientName("hosp-006");
        client.setOnline(true);
        client.setIp("10.16.18.86:10003");
        client.setStatusCode("1002");
        client.setReadStatus("OK");
        resp.setClients(Collections.singletonList(client));

        when(monitorService.getClients()).thenReturn(resp);

        mockMvc.perform(get("/api/monitor/zookeeper/clients"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.code").value(200))
                .andExpect(jsonPath("$.data.clients[0].clientName").value("hosp-006"))
                .andExpect(jsonPath("$.data.clients[0].online").value(true))
                .andExpect(jsonPath("$.data.source").value("/bsoft-cdc/clients"));
    }

    @Test
    void shouldReturnEmptyList() throws Exception {
        ZooKeeperClientMonitorResponse resp = new ZooKeeperClientMonitorResponse();
        when(monitorService.getClients()).thenReturn(resp);

        mockMvc.perform(get("/api/monitor/zookeeper/clients"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.clients").isArray())
                .andExpect(jsonPath("$.data.clients").isEmpty());
    }

    @Test
    void shouldReturnPartialFailureFlag() throws Exception {
        ZooKeeperClientMonitorResponse resp = new ZooKeeperClientMonitorResponse();
        resp.addWarning("client x read failed");
        when(monitorService.getClients()).thenReturn(resp);

        mockMvc.perform(get("/api/monitor/zookeeper/clients"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.partialFailure").value(true))
                .andExpect(jsonPath("$.data.warnings[0]").value(containsString("client x")));
    }

    @Test
    void shouldReturnRefreshedAt() throws Exception {
        ZooKeeperClientMonitorResponse resp = new ZooKeeperClientMonitorResponse();
        when(monitorService.getClients()).thenReturn(resp);

        mockMvc.perform(get("/api/monitor/zookeeper/clients"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.refreshedAt").isNotEmpty());
    }

    @Test
    void shouldReturnClientsWithJobs() throws Exception {
        ZooKeeperClientMonitorResponse resp = new ZooKeeperClientMonitorResponse();
        ZooKeeperClientVO client = new ZooKeeperClientVO();
        client.setClientName("hosp-006");
        client.setOnline(true);
        client.setReadStatus("OK");

        ZooKeeperJobVO job = new ZooKeeperJobVO();
        job.setJobName("my-19c");
        job.setStatusCode("1101");
        job.setScn("31120290432");
        job.setReadStatus("OK");
        client.setJobs(Collections.singletonList(job));
        resp.setClients(Collections.singletonList(client));

        when(monitorService.getClients()).thenReturn(resp);

        mockMvc.perform(get("/api/monitor/zookeeper/clients"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.clients[0].jobs[0].jobName").value("my-19c"))
                .andExpect(jsonPath("$.data.clients[0].jobs[0].scn").value("31120290432"));
    }

    @Test
    void shouldReturnScnNullWhenEmpty() throws Exception {
        ZooKeeperClientMonitorResponse resp = new ZooKeeperClientMonitorResponse();
        ZooKeeperClientVO client = new ZooKeeperClientVO();
        client.setClientName("hosp-006");
        client.setOnline(true);
        client.setReadStatus("OK");

        ZooKeeperJobVO job = new ZooKeeperJobVO();
        job.setJobName("snapshot-job");
        job.setReadStatus("OK");
        client.setJobs(Collections.singletonList(job));
        resp.setClients(Collections.singletonList(client));

        when(monitorService.getClients()).thenReturn(resp);

        mockMvc.perform(get("/api/monitor/zookeeper/clients"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.clients[0].jobs[0].scn").doesNotExist());
    }

    @Test
    void shouldReturnOfflineClientWithDashPlaceholders() throws Exception {
        ZooKeeperClientMonitorResponse resp = new ZooKeeperClientMonitorResponse();
        ZooKeeperClientVO client = new ZooKeeperClientVO();
        client.setClientName("hosp-007");
        client.setOnline(false);
        client.setPid("--");
        client.setInstanceId("--");
        client.setStartTime("--");
        client.setReadStatus("OK");
        client.setJobs(Collections.emptyList());
        resp.setClients(Collections.singletonList(client));

        when(monitorService.getClients()).thenReturn(resp);

        mockMvc.perform(get("/api/monitor/zookeeper/clients"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.clients[0].online").value(false))
                .andExpect(jsonPath("$.data.clients[0].pid").value("--"))
                .andExpect(jsonPath("$.data.clients[0].jobs").isEmpty());
    }

    @Test
    void shouldReturnHealthConnected() throws Exception {
        when(monitorService.isZooKeeperConnected()).thenReturn(true);
        when(zooKeeperConfig.getConnectString()).thenReturn("localhost:2181");
        when(zooKeeperConfig.getRootPath()).thenReturn("/bsoft-cdc");

        mockMvc.perform(get("/api/monitor/zookeeper/health"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.code").value(200))
                .andExpect(jsonPath("$.data.connected").value(true));
    }

    @Test
    void shouldReturnHealthDisconnected() throws Exception {
        when(monitorService.isZooKeeperConnected()).thenReturn(false);
        when(zooKeeperConfig.getConnectString()).thenReturn("localhost:2181");
        when(zooKeeperConfig.getRootPath()).thenReturn("/bsoft-cdc");

        mockMvc.perform(get("/api/monitor/zookeeper/health"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.connected").value(false))
                .andExpect(jsonPath("$.data.errorMessage").isNotEmpty());
    }

    @Test
    void shouldIncludeDetailInfoInResponse() throws Exception {
        ZooKeeperClientMonitorResponse resp = new ZooKeeperClientMonitorResponse();
        ZooKeeperClientVO client = new ZooKeeperClientVO();
        client.setClientName("hosp-006");
        client.setDetailInfo("java.sql.SQLException: ORA-00257: Archiver error\nat oracle.jdbc...");
        client.setReadStatus("OK");
        resp.setClients(Collections.singletonList(client));

        when(monitorService.getClients()).thenReturn(resp);

        mockMvc.perform(get("/api/monitor/zookeeper/clients"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.clients[0].detailInfo").value(containsString("ORA-00257")));
    }
}
