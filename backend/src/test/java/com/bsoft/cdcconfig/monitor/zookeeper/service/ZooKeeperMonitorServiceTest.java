package com.bsoft.cdcconfig.monitor.zookeeper.service;

import com.bsoft.cdcconfig.monitor.zookeeper.client.ZooKeeperReadOnlyClient;
import com.bsoft.cdcconfig.monitor.zookeeper.config.ZooKeeperConfig;
import com.bsoft.cdcconfig.monitor.zookeeper.parser.NodeDataParser;
import com.bsoft.cdcconfig.monitor.zookeeper.service.impl.ZooKeeperMonitorServiceImpl;
import com.bsoft.cdcconfig.monitor.zookeeper.vo.ZooKeeperClientMonitorResponse;
import com.bsoft.cdcconfig.monitor.zookeeper.vo.ZooKeeperClientVO;
import com.bsoft.cdcconfig.monitor.zookeeper.vo.ZooKeeperJobVO;
import org.apache.curator.framework.CuratorFramework;
import org.apache.curator.framework.CuratorFrameworkFactory;
import org.apache.curator.retry.RetryOneTime;
import org.apache.curator.test.TestingServer;
import org.apache.zookeeper.CreateMode;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;

import java.nio.charset.StandardCharsets;
import java.util.List;

import static org.junit.jupiter.api.Assertions.*;

class ZooKeeperMonitorServiceTest {

    private TestingServer zkServer;
    private CuratorFramework curatorClient;
    private ZooKeeperMonitorService service;

    @BeforeEach
    void setUp() throws Exception {
        zkServer = new TestingServer();
        curatorClient = CuratorFrameworkFactory.builder()
                .connectString(zkServer.getConnectString())
                .retryPolicy(new RetryOneTime(100))
                .build();
        curatorClient.start();

        curatorClient.create().creatingParentsIfNeeded().forPath("/bsoft-cdc/clients");

        ZooKeeperConfig config = new ZooKeeperConfig();
        config.setConnectString(zkServer.getConnectString());
        config.setRootPath("/bsoft-cdc");

        ZooKeeperReadOnlyClient zkReadOnlyClient = new ZooKeeperReadOnlyClient(curatorClient, config);
        NodeDataParser parser = new NodeDataParser();
        service = new ZooKeeperMonitorServiceImpl(zkReadOnlyClient, parser);
    }

    @AfterEach
    void tearDown() throws Exception {
        if (curatorClient != null) {
            curatorClient.close();
        }
        if (zkServer != null) {
            zkServer.close();
        }
    }

    private void createJsonNode(String path, String json) throws Exception {
        curatorClient.create().creatingParentsIfNeeded()
                .withMode(CreateMode.PERSISTENT)
                .forPath(path, json.getBytes(StandardCharsets.UTF_8));
    }

    private void createEphemeralNode(String path, String json) throws Exception {
        curatorClient.create().creatingParentsIfNeeded()
                .withMode(CreateMode.EPHEMERAL)
                .forPath(path, json.getBytes(StandardCharsets.UTF_8));
    }

    @Test
    void shouldReturnMultipleClientsSortedByName() throws Exception {
        createFullClient("hosp-007", true, "1002");
        createFullClient("hosp-006", true, "1002");

        ZooKeeperClientMonitorResponse resp = service.getClients();

        assertNotNull(resp.getClients());
        assertEquals(2, resp.getClients().size());
        assertEquals("hosp-006", resp.getClients().get(0).getClientName());
        assertEquals("hosp-007", resp.getClients().get(1).getClientName());
    }

    @Test
    void shouldMarkOnlineWhenAliveExists() throws Exception {
        createFullClient("hosp-006", true, "1002");

        ZooKeeperClientMonitorResponse resp = service.getClients();

        assertEquals(1, resp.getClients().size());
        assertTrue(resp.getClients().get(0).getOnline());
        assertEquals("19584", resp.getClients().get(0).getPid());
    }

    @Test
    void shouldMarkOfflineWhenAliveMissing() throws Exception {
        createFullClient("hosp-007", false, "9001");

        ZooKeeperClientMonitorResponse resp = service.getClients();

        assertEquals(1, resp.getClients().size());
        assertFalse(resp.getClients().get(0).getOnline());
        assertEquals("--", resp.getClients().get(0).getPid());
        assertEquals("--", resp.getClients().get(0).getInstanceId());
        assertEquals("--", resp.getClients().get(0).getStartTime());
    }

    @Test
    void shouldReadClientStatusFields() throws Exception {
        createFullClient("hosp-006", true, "1002");

        ZooKeeperClientMonitorResponse resp = service.getClients();
        ZooKeeperClientVO c = resp.getClients().get(0);

        assertEquals("1002", c.getStatusCode());
        assertEquals("正常运行", c.getStatusMessage());
        assertNotNull(c.getDetailInfo());
        assertNotNull(c.getUpdateTime());
    }

    @Test
    void shouldReadClientIp() throws Exception {
        createFullClient("hosp-006", true, "1002");

        ZooKeeperClientMonitorResponse resp = service.getClients();

        assertEquals("10.16.18.86:10003", resp.getClients().get(0).getIp());
    }

    @Test
    void shouldSetClientPath() throws Exception {
        createFullClient("hosp-006", true, "1002");

        ZooKeeperClientMonitorResponse resp = service.getClients();

        assertEquals("/bsoft-cdc/clients/hosp-006", resp.getClients().get(0).getClientPath());
    }

    @Test
    void shouldReturnEmptyListWhenClientsPathMissing() throws Exception {
        curatorClient.delete().forPath("/bsoft-cdc/clients");

        ZooKeeperClientMonitorResponse resp = service.getClients();

        assertNotNull(resp.getClients());
        assertTrue(resp.getClients().isEmpty());
    }

    @Test
    void shouldReadJobsSortedByName() throws Exception {
        createFullClient("hosp-006", true, "1002");
        createJob("hosp-006", "my-19c", "1101", "31120290432", "2026-07-16 16:00:04");
        createJob("hosp-006", "abc-job", "1101", null, null);

        ZooKeeperClientMonitorResponse resp = service.getClients();
        List<ZooKeeperJobVO> jobs = resp.getClients().get(0).getJobs();

        assertEquals(2, jobs.size());
        assertEquals("abc-job", jobs.get(0).getJobName());
        assertEquals("my-19c", jobs.get(1).getJobName());
    }

    @Test
    void shouldAllowEmptyJobs() throws Exception {
        createFullClient("hosp-007", false, "9001");

        ZooKeeperClientMonitorResponse resp = service.getClients();
        List<ZooKeeperJobVO> jobs = resp.getClients().get(0).getJobs();

        assertNotNull(jobs);
        assertTrue(jobs.isEmpty());
    }

    @Test
    void shouldAllowEmptyScn() throws Exception {
        createFullClient("hosp-006", true, "1002");
        createJob("hosp-006", "snapshot-job", "1001", null, null);

        ZooKeeperClientMonitorResponse resp = service.getClients();
        ZooKeeperJobVO job = resp.getClients().get(0).getJobs().get(0);

        assertNull(job.getScn());
        assertNull(job.getScnUpdateTime());
    }

    @Test
    void shouldReadScnWithValue() throws Exception {
        createFullClient("hosp-006", true, "1002");
        createJob("hosp-006", "my-19c", "1101", "31120290432", "2026-07-16 16:00:04");

        ZooKeeperClientMonitorResponse resp = service.getClients();
        ZooKeeperJobVO job = resp.getClients().get(0).getJobs().get(0);

        assertEquals("31120290432", job.getScn());
        assertEquals("2026-07-16 16:00:04", job.getScnUpdateTime());
    }

    @Test
    void shouldSetJobPath() throws Exception {
        createFullClient("hosp-006", true, "1002");
        createJob("hosp-006", "my-19c", "1101", null, null);

        ZooKeeperClientMonitorResponse resp = service.getClients();
        ZooKeeperJobVO job = resp.getClients().get(0).getJobs().get(0);

        assertEquals("/bsoft-cdc/clients/hosp-006/jobs/my-19c", job.getJobPath());
    }

    @Test
    void shouldPreserveMultiLineDetailInfo() throws Exception {
        createFullClient("hosp-006", true, "9001");
        String multiLineStatus = "{\"code\":\"9001\",\"description\":\"异常\","
                + "\"detailInfo\":\"java.sql.SQLException: ORA-00257: Archiver error\\n"
                + "at oracle.jdbc.driver.T4CConnection.logon(T4CConnection.java:774)\\n"
                + "at java.util.concurrent.ThreadPoolExecutor.runWorker(ThreadPoolExecutor.java:1149)\","
                + "\"updateTime\":\"2026-07-17 16:23:16\"}";
        curatorClient.setData().forPath("/bsoft-cdc/clients/hosp-006/status",
                multiLineStatus.getBytes(StandardCharsets.UTF_8));

        ZooKeeperClientMonitorResponse resp = service.getClients();
        String detailInfo = resp.getClients().get(0).getDetailInfo();

        assertNotNull(detailInfo);
        assertTrue(detailInfo.contains("ORA-00257"));
    }

    @Test
    void shouldSurviveSingleJobParseFailure() throws Exception {
        createFullClient("hosp-006", true, "1002");
        createJob("hosp-006", "good-job", "1101", null, null);
        curatorClient.create().creatingParentsIfNeeded()
                .forPath("/bsoft-cdc/clients/hosp-006/jobs/bad-job/status",
                        "{invalid json".getBytes(StandardCharsets.UTF_8));

        ZooKeeperClientMonitorResponse resp = service.getClients();
        List<ZooKeeperJobVO> jobs = resp.getClients().get(0).getJobs();

        assertEquals(2, jobs.size());
        boolean hasOk = jobs.stream().anyMatch(j -> "OK".equals(j.getReadStatus()));
        assertTrue(hasOk);
    }

    @Test
    void shouldSurviveSingleClientFailure() throws Exception {
        createFullClient("hosp-006", true, "1002");
        curatorClient.create().creatingParentsIfNeeded().forPath("/bsoft-cdc/clients/hosp-bad");
        curatorClient.create().creatingParentsIfNeeded()
                .forPath("/bsoft-cdc/clients/hosp-bad/status",
                        "not json".getBytes(StandardCharsets.UTF_8));

        ZooKeeperClientMonitorResponse resp = service.getClients();

        assertEquals(2, resp.getClients().size());
        assertTrue(resp.getPartialFailure() || !resp.getWarnings().isEmpty());
    }

    @Test
    void shouldHandleClientsPathNotExisting() throws Exception {
        curatorClient.delete().deletingChildrenIfNeeded().forPath("/bsoft-cdc/clients");

        ZooKeeperClientMonitorResponse resp = service.getClients();

        assertTrue(resp.getClients().isEmpty());
        assertTrue(resp.getPartialFailure());
    }

    @Test
    void shouldHandleOfflineClientWithErrorAndEmptyJobs() throws Exception {
        createFullClient("hosp-007", false, "9001");
        String errorStatus = "{\"code\":\"9001\",\"description\":\"进程异常\","
                + "\"detailInfo\":\"java.sql.SQLException: ORA-00257: Archiver error\\n\","
                + "\"updateTime\":\"2026-07-17 16:23:16\"}";
        curatorClient.setData().forPath("/bsoft-cdc/clients/hosp-007/status",
                errorStatus.getBytes(StandardCharsets.UTF_8));

        ZooKeeperClientMonitorResponse resp = service.getClients();

        ZooKeeperClientVO c = resp.getClients().get(0);
        assertFalse(c.getOnline());
        assertEquals("--", c.getStatusCode());
        assertEquals("未运行", c.getStatusMessage());
        assertTrue(c.getJobs().isEmpty());
        assertEquals("--", c.getPid());
    }

    @Test
    void shouldSetRefreshedAtAndSource() throws Exception {
        createFullClient("hosp-006", true, "1002");

        ZooKeeperClientMonitorResponse resp = service.getClients();

        assertNotNull(resp.getRefreshedAt());
        assertEquals("/bsoft-cdc/clients", resp.getSource());
    }

    @Test
    void shouldReadJobDetailInfo() throws Exception {
        createFullClient("hosp-006", true, "1002");
        createJob("hosp-006", "my-19c", "1101", null, null);

        ZooKeeperClientMonitorResponse resp = service.getClients();
        ZooKeeperJobVO job = resp.getClients().get(0).getJobs().get(0);

        assertEquals("everything under control", job.getDetailInfo());
    }

    @Test
    void shouldSetReadStatusOkOnSuccess() throws Exception {
        createFullClient("hosp-006", true, "1002");
        createJob("hosp-006", "my-19c", "1101", null, null);

        ZooKeeperClientMonitorResponse resp = service.getClients();
        assertEquals("OK", resp.getClients().get(0).getReadStatus());
        assertEquals("OK", resp.getClients().get(0).getJobs().get(0).getReadStatus());
    }

    @Test
    void shouldHandleMissingIpNode() throws Exception {
        curatorClient.create().creatingParentsIfNeeded().forPath("/bsoft-cdc/clients/hosp-noid");
        createEphemeralNode("/bsoft-cdc/clients/hosp-noid/alive",
                "{\"clientId\":\"hosp-noid\",\"pid\":\"123\",\"instanceId\":\"uuid\",\"startTime\":\"2026-07-17 10:00:00\"}");
        curatorClient.create().creatingParentsIfNeeded().forPath("/bsoft-cdc/clients/hosp-noid/status",
                "{\"code\":\"1002\",\"description\":\"正常\",\"detailInfo\":\"ok\",\"updateTime\":\"2026-07-17 10:00:00\"}".getBytes(StandardCharsets.UTF_8));

        ZooKeeperClientMonitorResponse resp = service.getClients();

        assertEquals(1, resp.getClients().size());
        assertNull(resp.getClients().get(0).getIp());
    }

    @Test
    void shouldReturnConnectedWhenZkIsUp() {
        assertTrue(service.isZooKeeperConnected());
    }

    @Test
    void shouldSetRunningTrueWhenAliveExists() throws Exception {
        createFullClient("hosp-006", true, "1002");
        createJob("hosp-006", "my-job", "1101", null, null, true);

        ZooKeeperClientMonitorResponse resp = service.getClients();
        ZooKeeperJobVO job = resp.getClients().get(0).getJobs().get(0);

        assertTrue(job.getRunning());
    }

    @Test
    void shouldReturnPersistedStatusWhenAliveExists() throws Exception {
        createFullClient("hosp-006", true, "1002");
        createJob("hosp-006", "my-job", "1101", null, null, true);

        ZooKeeperClientMonitorResponse resp = service.getClients();
        ZooKeeperJobVO job = resp.getClients().get(0).getJobs().get(0);

        assertEquals("1101", job.getStatusCode());
        assertEquals("运行中", job.getStatusMessage());
    }

    @Test
    void shouldSetRunningFalseAndDashWhenAliveMissing() throws Exception {
        createFullClient("hosp-006", true, "1002");
        createJob("hosp-006", "stopped-job", "1101", null, null, false);

        ZooKeeperClientMonitorResponse resp = service.getClients();
        ZooKeeperJobVO job = resp.getClients().get(0).getJobs().get(0);

        assertFalse(job.getRunning());
        assertEquals("--", job.getStatusCode());
        assertEquals("未运行", job.getStatusMessage());
    }

    @Test
    void shouldNotProduceWarningWhenAliveMissing() throws Exception {
        createFullClient("hosp-006", true, "1002");
        createJob("hosp-006", "stopped-job", "1101", null, null, false);

        ZooKeeperClientMonitorResponse resp = service.getClients();
        ZooKeeperJobVO job = resp.getClients().get(0).getJobs().get(0);

        assertEquals("OK", job.getReadStatus());
        assertTrue(job.getWarnings() == null || job.getWarnings().isEmpty());
    }

    @Test
    void shouldRetainDetailInfoWhenAliveMissing() throws Exception {
        createFullClient("hosp-006", true, "1002");
        createJob("hosp-006", "stopped-job", "1101", null, null, false);

        ZooKeeperClientMonitorResponse resp = service.getClients();
        ZooKeeperJobVO job = resp.getClients().get(0).getJobs().get(0);

        assertEquals("everything under control", job.getDetailInfo());
    }

    @Test
    void shouldRetainScnWhenAliveMissing() throws Exception {
        createFullClient("hosp-006", true, "1002");
        createJob("hosp-006", "stopped-job", "1101", "31120290432", "2026-07-16 16:00:04", false);

        ZooKeeperClientMonitorResponse resp = service.getClients();
        ZooKeeperJobVO job = resp.getClients().get(0).getJobs().get(0);

        assertEquals("31120290432", job.getScn());
        assertEquals("2026-07-16 16:00:04", job.getScnUpdateTime());
    }

    @Test
    void shouldKeepJobInListWhenAliveMissing() throws Exception {
        createFullClient("hosp-006", true, "1002");
        createJob("hosp-006", "stopped-job", "1101", null, null, false);

        ZooKeeperClientMonitorResponse resp = service.getClients();

        assertEquals(1, resp.getClients().get(0).getJobs().size());
    }

    @Test
    void shouldShowNotRunningWhenPersistedStatusIs1101ButAliveMissing() throws Exception {
        createFullClient("hosp-006", true, "1002");
        createJob("hosp-006", "stopped-job", "1101", null, null, false);

        ZooKeeperClientMonitorResponse resp = service.getClients();
        ZooKeeperJobVO job = resp.getClients().get(0).getJobs().get(0);

        assertEquals("--", job.getStatusCode());
        assertEquals("未运行", job.getStatusMessage());
        assertFalse(job.getRunning());
    }

    @Test
    void shouldShowNotRunningWhenPersistedStatusIs1201ButAliveMissing() throws Exception {
        createFullClient("hosp-006", true, "1002");
        createJob("hosp-006", "stopped-job", "1201", null, null, false);

        ZooKeeperClientMonitorResponse resp = service.getClients();
        ZooKeeperJobVO job = resp.getClients().get(0).getJobs().get(0);

        assertEquals("--", job.getStatusCode());
        assertEquals("未运行", job.getStatusMessage());
    }

    @Test
    void shouldHandleAliveNodeWithEmptyJsonValue() throws Exception {
        createFullClient("hosp-006", true, "1002");
        createJob("hosp-006", "my-job", "1101", null, null, true);

        ZooKeeperClientMonitorResponse resp = service.getClients();
        ZooKeeperJobVO job = resp.getClients().get(0).getJobs().get(0);

        assertTrue(job.getRunning());
        assertEquals("1101", job.getStatusCode());
    }

    @Test
    void shouldHandleOfflineClientWithJobAliveMissing() throws Exception {
        createFullClient("hosp-007", false, "9001");
        createJob("hosp-007", "stopped-job", "1101", null, null, false);

        ZooKeeperClientMonitorResponse resp = service.getClients();
        ZooKeeperClientVO client = resp.getClients().get(0);
        ZooKeeperJobVO job = client.getJobs().get(0);

        assertFalse(client.getOnline());
        assertEquals(1, client.getJobs().size());
        assertEquals("--", job.getStatusCode());
        assertEquals("未运行", job.getStatusMessage());
    }

    @Test
    void shouldSurviveSingleJobAliveCheckFailureAndNotAffectOtherJobs() throws Exception {
        createFullClient("hosp-006", true, "1002");
        createJob("hosp-006", "good-job", "1101", null, null, true);
        // Deleting the parent client path will cause alive check to fail for bad-job
        // because the path won't exist when accessed outside normal flow
        curatorClient.create().creatingParentsIfNeeded().forPath("/bsoft-cdc/clients/hosp-006/jobs/bad-job");
        curatorClient.create().creatingParentsIfNeeded().forPath("/bsoft-cdc/clients/hosp-006/jobs/bad-job/status",
                "not json".getBytes(StandardCharsets.UTF_8));
        // Create an alive node then delete its parent to simulate a race
        String badAlivePath = "/bsoft-cdc/clients/hosp-006/jobs/bad-job/alive";
        createEphemeralNode(badAlivePath, "{}");
        // bad-job alive exists, but status is invalid json — the job should still be processed

        ZooKeeperClientMonitorResponse resp = service.getClients();
        List<ZooKeeperJobVO> jobs = resp.getClients().get(0).getJobs();

        assertEquals(2, jobs.size());
        ZooKeeperJobVO goodJob = jobs.stream().filter(j -> "good-job".equals(j.getJobName())).findFirst().orElse(null);
        assertNotNull(goodJob);
        assertTrue(goodJob.getRunning());
        assertEquals("1101", goodJob.getStatusCode());
    }

    // --- Client alive-based runtime state tests ---

    @Test
    void shouldUsePersistedStatusWhenClientAliveExists() throws Exception {
        createFullClient("hosp-006", true, "1002");

        ZooKeeperClientMonitorResponse resp = service.getClients();
        ZooKeeperClientVO c = resp.getClients().get(0);

        assertTrue(c.getOnline());
        assertEquals("1002", c.getStatusCode());
        assertEquals("正常运行", c.getStatusMessage());
    }

    @Test
    void shouldReturnDashAndNotRunningWhenClientAliveMissing() throws Exception {
        createFullClient("hosp-007", false, "1002");

        ZooKeeperClientMonitorResponse resp = service.getClients();
        ZooKeeperClientVO c = resp.getClients().get(0);

        assertFalse(c.getOnline());
        assertEquals("--", c.getStatusCode());
        assertEquals("未运行", c.getStatusMessage());
    }

    @Test
    void shouldOverridePersisted1002WhenClientAliveMissing() throws Exception {
        createFullClient("hosp-007", false, "1002");

        ZooKeeperClientMonitorResponse resp = service.getClients();
        ZooKeeperClientVO c = resp.getClients().get(0);

        assertEquals("--", c.getStatusCode());
        assertEquals("未运行", c.getStatusMessage());
    }

    @Test
    void shouldOverridePersisted9001WhenClientAliveMissing() throws Exception {
        createFullClient("hosp-007", false, "9001");

        ZooKeeperClientMonitorResponse resp = service.getClients();
        ZooKeeperClientVO c = resp.getClients().get(0);

        assertEquals("--", c.getStatusCode());
        assertEquals("未运行", c.getStatusMessage());
    }

    @Test
    void shouldNotProduceWarningWhenClientAliveMissing() throws Exception {
        createFullClient("hosp-007", false, "1002");

        ZooKeeperClientMonitorResponse resp = service.getClients();
        ZooKeeperClientVO c = resp.getClients().get(0);

        assertEquals("OK", c.getReadStatus());
        assertTrue(c.getWarnings() == null || c.getWarnings().isEmpty());
    }

    @Test
    void shouldRetainDetailInfoWhenClientAliveMissing() throws Exception {
        createFullClient("hosp-007", false, "9001");
        String errorStatus = "{\"code\":\"9001\",\"description\":\"进程异常\","
                + "\"detailInfo\":\"ORA-00257: Archiver error\\n\","
                + "\"updateTime\":\"2026-07-17 16:23:16\"}";
        curatorClient.setData().forPath("/bsoft-cdc/clients/hosp-007/status",
                errorStatus.getBytes(StandardCharsets.UTF_8));

        ZooKeeperClientMonitorResponse resp = service.getClients();
        ZooKeeperClientVO c = resp.getClients().get(0);

        assertNotNull(c.getDetailInfo());
        assertTrue(c.getDetailInfo().contains("ORA-00257"));
    }

    // --- SCN preservation tests (unified alive+SCN rules) ---

    @Test
    void shouldReturnScnWhenJobAliveMissingAndScnHasValue() throws Exception {
        createFullClient("hosp-006", true, "1002");
        createJob("hosp-006", "stopped-job", "1101", "110813170", "2026-07-21 12:00:00", false);

        ZooKeeperClientMonitorResponse resp = service.getClients();
        ZooKeeperJobVO job = resp.getClients().get(0).getJobs().get(0);

        assertFalse(job.getRunning());
        assertEquals("--", job.getStatusCode());
        assertEquals("未运行", job.getStatusMessage());
        assertEquals("110813170", job.getScn());
        assertEquals("2026-07-21 12:00:00", job.getScnUpdateTime());
    }

    @Test
    void shouldReturnScnWhenJobAliveExistsAndScnHasValue() throws Exception {
        createFullClient("hosp-006", true, "1002");
        createJob("hosp-006", "running-job", "1101", "110813170", "2026-07-21 12:00:00", true);

        ZooKeeperClientMonitorResponse resp = service.getClients();
        ZooKeeperJobVO job = resp.getClients().get(0).getJobs().get(0);

        assertTrue(job.getRunning());
        assertEquals("1101", job.getStatusCode());
        assertEquals("110813170", job.getScn());
    }

    @Test
    void shouldHandleScnParseFailureWhenJobAliveMissing() throws Exception {
        createFullClient("hosp-006", true, "1002");
        String jobPath = "/bsoft-cdc/clients/hosp-006/jobs/bad-scn-job";
        curatorClient.create().creatingParentsIfNeeded().forPath(jobPath);
        createJsonNode(jobPath + "/status",
                "{\"code\":\"1101\",\"description\":\"运行中\","
                        + "\"detailInfo\":\"ok\",\"updateTime\":\"2026-07-17 16:29:38\"}");
        createJsonNode(jobPath + "/scn", "{invalid scn json");

        ZooKeeperClientMonitorResponse resp = service.getClients();
        ZooKeeperJobVO job = resp.getClients().get(0).getJobs().get(0);

        assertEquals("--", job.getStatusCode());
        assertEquals("未运行", job.getStatusMessage());
        assertNull(job.getScn());
        // Parse failure caught by NodeDataParser, returns null – no exception propagated
        assertEquals("OK", job.getReadStatus());
    }

    @Test
    void shouldReturnScnNullWhenScnNodeIsEmptyJson() throws Exception {
        createFullClient("hosp-006", true, "1002");
        createJob("hosp-006", "empty-scn-job", "1101", null, null, false);

        ZooKeeperClientMonitorResponse resp = service.getClients();
        ZooKeeperJobVO job = resp.getClients().get(0).getJobs().get(0);

        assertNull(job.getScn());
        assertNull(job.getScnUpdateTime());
        assertEquals("OK", job.getReadStatus());
    }

    @Test
    void shouldReturnPartialFailureWhenAllClientsHaveWarnings() throws Exception {
        createFullClient("hosp-006", true, "1002");
        // Delete the status node to cause a read warning
        curatorClient.delete().forPath("/bsoft-cdc/clients/hosp-006/status");
        // Delete the ip node too
        curatorClient.delete().forPath("/bsoft-cdc/clients/hosp-006/ip");

        ZooKeeperClientMonitorResponse resp = service.getClients();
        ZooKeeperClientVO c = resp.getClients().get(0);

        assertTrue(c.getOnline());
        assertEquals("PARTIAL", c.getReadStatus());
        assertTrue(c.getWarnings() != null && !c.getWarnings().isEmpty());
    }

    private void createFullClient(String name, boolean online, String statusCode) throws Exception {
        curatorClient.create().creatingParentsIfNeeded().forPath("/bsoft-cdc/clients/" + name);

        createJsonNode("/bsoft-cdc/clients/" + name + "/ip",
                "{\"ip\":\"10.16.18.86:10003\",\"updateTime\":\"2026-07-17 16:29:12\"}");

        createJsonNode("/bsoft-cdc/clients/" + name + "/status",
                "{\"code\":\"" + statusCode + "\",\"description\":\"正常运行\","
                        + "\"detailInfo\":\"everything under control\","
                        + "\"updateTime\":\"2026-07-17 16:29:38\"}");

        if (online) {
            createEphemeralNode("/bsoft-cdc/clients/" + name + "/alive",
                    "{\"clientId\":\"" + name + "\",\"ip\":\"10.16.18.86:10003\","
                            + "\"pid\":\"19584\",\"instanceId\":\"40833a77-ee6f-43b7-a302-0edcdae476ff\","
                            + "\"startTime\":\"2026-07-17 16:29:12\","
                            + "\"updateTime\":\"2026-07-17 16:29:12\"}");
        }

        curatorClient.create().creatingParentsIfNeeded().forPath("/bsoft-cdc/clients/" + name + "/jobs");
    }

    private void createJob(String clientName, String jobName, String statusCode,
                           String scnValue, String scnUpdateTime) throws Exception {
        createJob(clientName, jobName, statusCode, scnValue, scnUpdateTime, true);
    }

    private void createJob(String clientName, String jobName, String statusCode,
                           String scnValue, String scnUpdateTime, boolean createAlive) throws Exception {
        String jobPath = "/bsoft-cdc/clients/" + clientName + "/jobs/" + jobName;
        curatorClient.create().creatingParentsIfNeeded().forPath(jobPath);

        String statusJson = "{\"code\":\"" + statusCode + "\",\"description\":\"运行中\","
                + "\"detailInfo\":\"everything under control\","
                + "\"updateTime\":\"2026-07-17 16:29:38\"}";
        createJsonNode(jobPath + "/status", statusJson);

        if (scnValue != null) {
            String scnJson = "{\"scn\":\"" + scnValue + "\",\"updateTime\":\"" + scnUpdateTime + "\"}";
            createJsonNode(jobPath + "/scn", scnJson);
        } else {
            createJsonNode(jobPath + "/scn", "{}");
        }

        if (createAlive) {
            createEphemeralNode(jobPath + "/alive", "{}");
        }
    }
}
