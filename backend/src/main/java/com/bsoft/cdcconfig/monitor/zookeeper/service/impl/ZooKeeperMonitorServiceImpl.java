package com.bsoft.cdcconfig.monitor.zookeeper.service.impl;

import com.bsoft.cdcconfig.monitor.zookeeper.client.ZooKeeperReadOnlyClient;
import com.bsoft.cdcconfig.monitor.zookeeper.parser.NodeDataParser;
import com.bsoft.cdcconfig.monitor.zookeeper.service.ZooKeeperMonitorService;
import com.bsoft.cdcconfig.monitor.zookeeper.vo.ZooKeeperClientMonitorResponse;
import com.bsoft.cdcconfig.monitor.zookeeper.vo.ZooKeeperClientVO;
import com.bsoft.cdcconfig.monitor.zookeeper.vo.ZooKeeperJobVO;
import com.fasterxml.jackson.databind.JsonNode;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;

import java.util.ArrayList;
import java.util.Collections;
import java.util.Comparator;
import java.util.List;

@Service
public class ZooKeeperMonitorServiceImpl implements ZooKeeperMonitorService {

    private static final Logger log = LoggerFactory.getLogger(ZooKeeperMonitorServiceImpl.class);

    private final ZooKeeperReadOnlyClient zkClient;
    private final NodeDataParser parser;

    public ZooKeeperMonitorServiceImpl(ZooKeeperReadOnlyClient zkClient, NodeDataParser parser) {
        this.zkClient = zkClient;
        this.parser = parser;
    }

    @Override
    public ZooKeeperClientMonitorResponse getClients() {
        long start = System.currentTimeMillis();
        ZooKeeperClientMonitorResponse response = new ZooKeeperClientMonitorResponse();

        List<String> clientNames;
        try {
            if (!zkClient.clientsPathExists()) {
                response.addWarning("ZK 客户端路径不存在: " + zkClient.getClientsPath());
                return response;
            }
            clientNames = zkClient.getClientNames();
        } catch (Exception e) {
            log.error("Failed to read ZK clients path", e);
            response.addWarning("ZK 整体读取失败: " + e.getMessage());
            return response;
        }

        // Sort clients by name ascending
        clientNames.sort(Comparator.naturalOrder());

        for (String clientName : clientNames) {
            try {
                ZooKeeperClientVO clientVO = buildClientVO(clientName);
                response.getClients().add(clientVO);
                if (!"OK".equals(clientVO.getReadStatus()) || (clientVO.getWarnings() != null && !clientVO.getWarnings().isEmpty())) {
                    response.addWarning("客户端 " + clientName + " 存在读取异常");
                }
            } catch (Exception e) {
                log.error("Failed to read client={}", clientName, e);
                ZooKeeperClientVO partialClient = new ZooKeeperClientVO();
                partialClient.setClientName(clientName);
                partialClient.setClientPath(zkClient.getClientsPath() + "/" + clientName);
                partialClient.setReadStatus("ERROR");
                partialClient.addWarning("客户端读取失败: " + e.getMessage());
                response.getClients().add(partialClient);
                response.addWarning("客户端 " + clientName + " 读取失败");
            }
        }

        log.info("ZK monitor query completed: {} clients, {}ms", clientNames.size(), System.currentTimeMillis() - start);
        return response;
    }

    @Override
    public boolean isZooKeeperConnected() {
        return zkClient.isConnected();
    }

    private ZooKeeperClientVO buildClientVO(String clientName) throws Exception {
        ZooKeeperClientVO vo = new ZooKeeperClientVO();
        String clientPath = zkClient.getClientsPath() + "/" + clientName;
        vo.setClientName(clientName);
        vo.setClientPath(clientPath);

        // Check client alive (ephemeral node) to determine current runtime state
        boolean aliveExists;
        boolean aliveCheckFailed = false;
        try {
            aliveExists = zkClient.nodeExists(clientPath + "/alive");
        } catch (Exception e) {
            log.warn("Failed to check client alive for {}", clientName, e);
            aliveExists = false;
            aliveCheckFailed = true;
        }

        if (aliveCheckFailed) {
            vo.setOnline(null);
        } else if (!aliveExists) {
            vo.setOnline(false);
        } else {
            vo.setOnline(true);
        }

        // IP node
        readIpNode(clientName, vo);

        // Status node (persisted) — detailInfo and updateTime retained regardless of alive
        readStatusNode(clientName, vo);

        // Override status code/message for non-running client
        if (!aliveExists) {
            vo.setStatusCode("--");
            vo.setStatusMessage(aliveCheckFailed ? "状态未知" : "未运行");
        }

        // Alive data (pid, instanceId, startTime) — only when online
        if (aliveExists && !aliveCheckFailed) {
            readAliveNode(clientName, vo);
        } else {
            vo.setPid("--");
            vo.setInstanceId("--");
            vo.setStartTime("--");
        }

        if (aliveCheckFailed) {
            vo.addWarning("client alive 检查失败");
        }

        // Jobs
        readJobs(clientName, vo);

        boolean hasWarnings = vo.getWarnings() != null && !vo.getWarnings().isEmpty();
        vo.setReadStatus(hasWarnings ? "PARTIAL" : "OK");
        return vo;
    }

    private void readIpNode(String clientName, ZooKeeperClientVO vo) {
        try {
            String data = zkClient.getNodeDataAsString(zkClient.getClientsPath() + "/" + clientName + "/ip");
            if (data == null) {
                vo.addWarning("IP 节点不存在");
                return;
            }
            JsonNode json = parser.parseJson(data);
            if (json != null) {
                vo.setIp(parser.getTextField(json, "ip"));
            } else {
                vo.addWarning("IP 数据解析失败");
            }
        } catch (Exception e) {
            log.warn("Failed to read IP for client={}", clientName, e);
            vo.addWarning("IP 读取失败");
        }
    }

    private void readStatusNode(String clientName, ZooKeeperClientVO vo) {
        try {
            String data = zkClient.getNodeDataAsString(zkClient.getClientsPath() + "/" + clientName + "/status");
            if (data == null) {
                vo.addWarning("status 节点不存在");
                return;
            }
            JsonNode json = parser.parseJson(data);
            if (json != null) {
                vo.setStatusCode(parser.getTextField(json, "code"));
                vo.setStatusMessage(parser.getTextField(json, "description"));
                vo.setDetailInfo(parser.getTextField(json, "detailInfo"));
                vo.setUpdateTime(parser.getTextField(json, "updateTime"));
            } else {
                vo.addWarning("status 数据解析失败");
            }
        } catch (Exception e) {
            log.warn("Failed to read status for client={}", clientName, e);
            vo.addWarning("状态读取失败");
        }
    }

    private void readAliveNode(String clientName, ZooKeeperClientVO vo) {
        try {
            String data = zkClient.getNodeDataAsString(zkClient.getClientsPath() + "/" + clientName + "/alive");
            JsonNode json = parser.parseJson(data);
            if (json != null) {
                vo.setPid(parser.getTextField(json, "pid"));
                vo.setInstanceId(parser.getTextField(json, "instanceId"));
                vo.setStartTime(parser.getTextField(json, "startTime"));
            }
        } catch (Exception e) {
            log.warn("Failed to read alive data for client={}", clientName, e);
            vo.addWarning("alive 数据读取失败");
        }
    }

    private void readJobs(String clientName, ZooKeeperClientVO vo) throws Exception {
        List<ZooKeeperJobVO> jobs = new ArrayList<>();
        String jobsPath = zkClient.getClientsPath() + "/" + clientName + "/jobs";

        List<String> jobNames;
        try {
            jobNames = zkClient.getChildren(jobsPath);
        } catch (Exception e) {
            log.warn("Failed to list jobs for client={}", clientName, e);
            vo.addWarning("jobs 列表读取失败");
            vo.setJobs(jobs);
            return;
        }

        if (jobNames.isEmpty()) {
            vo.setJobs(jobs);
            return;
        }

        jobNames.sort(Comparator.naturalOrder());

        for (String jobName : jobNames) {
            try {
                ZooKeeperJobVO jobVO = buildJobVO(clientName, jobName, jobsPath);
                jobs.add(jobVO);
            } catch (Exception e) {
                log.warn("Failed to read job={} for client={}", jobName, clientName, e);
                ZooKeeperJobVO partialJob = new ZooKeeperJobVO();
                partialJob.setJobName(jobName);
                partialJob.setJobPath(jobsPath + "/" + jobName);
                partialJob.setReadStatus("ERROR");
                partialJob.addWarning("任务读取失败: " + e.getMessage());
                jobs.add(partialJob);
                vo.addWarning("任务 " + jobName + " 读取失败");
            }
        }

        vo.setJobs(jobs);
    }

    private ZooKeeperJobVO buildJobVO(String clientName, String jobName, String parentJobsPath) throws Exception {
        ZooKeeperJobVO vo = new ZooKeeperJobVO();
        String jobPath = parentJobsPath + "/" + jobName;
        vo.setJobName(jobName);
        vo.setJobPath(jobPath);

        // Check job alive (ephemeral node) to determine current runtime state
        boolean aliveExists;
        boolean aliveCheckFailed = false;
        try {
            aliveExists = zkClient.nodeExists(jobPath + "/alive");
        } catch (Exception e) {
            log.warn("Failed to check job alive for {}/{}", clientName, jobName, e);
            aliveExists = false;
            aliveCheckFailed = true;
        }

        if (aliveCheckFailed) {
            vo.setRunning(null);
            vo.setStatusCode("--");
            vo.setStatusMessage("状态未知");
            vo.addWarning("job alive 检查失败");
        } else if (!aliveExists) {
            vo.setRunning(false);
            vo.setStatusCode("--");
            vo.setStatusMessage("未运行");
        } else {
            vo.setRunning(true);
        }

        // Job status (persisted) — detailInfo retained regardless of alive
        try {
            String statusData = zkClient.getNodeDataAsString(jobPath + "/status");
            JsonNode statusJson = parser.parseJson(statusData);
            if (statusJson != null) {
                if (aliveExists && !aliveCheckFailed) {
                    vo.setStatusCode(parser.getTextField(statusJson, "code"));
                    vo.setStatusMessage(parser.getTextField(statusJson, "description"));
                }
                vo.setDetailInfo(parser.getTextField(statusJson, "detailInfo"));
            }
        } catch (Exception e) {
            log.warn("Failed to read job status for {}/{}", clientName, jobName, e);
            vo.addWarning("job status 读取失败");
        }

        // Job node metadata (dataSourceOrg -> displayName)
        try {
            String jobNodeData = zkClient.getNodeDataAsString(jobPath);
            JsonNode jobNodeJson = parser.parseJson(jobNodeData);
            String dataSourceOrg = null;
            if (jobNodeJson != null) {
                dataSourceOrg = parser.getTextField(jobNodeJson, "dataSourceOrg");
            }
            if (dataSourceOrg != null && !dataSourceOrg.trim().isEmpty()) {
                vo.setDisplayName(dataSourceOrg.trim());
            } else {
                vo.setDisplayName(jobName);
            }
        } catch (Exception e) {
            log.warn("Failed to read job node metadata for {}/{}", clientName, jobName, e);
            vo.setDisplayName(jobName);
            vo.addWarning("job 元数据读取失败");
        }

        // SCN node
        try {
            String scnData = zkClient.getNodeDataAsString(jobPath + "/scn");
            JsonNode scnJson = parser.parseJson(scnData);
            if (scnJson != null) {
                String scnValue = parser.getTextField(scnJson, "scn");
                if (scnValue != null && !scnValue.isEmpty()) {
                    vo.setScn(scnValue);
                    vo.setScnUpdateTime(parser.getTextField(scnJson, "updateTime"));
                }
                // SCN empty = leave fields null (blank on page)
            }
        } catch (Exception e) {
            log.warn("Failed to read SCN for {}/{}", clientName, jobName, e);
            vo.addWarning("SCN 读取失败");
        }

        boolean hasWarnings = vo.getWarnings() != null && !vo.getWarnings().isEmpty();
        vo.setReadStatus(hasWarnings ? "PARTIAL" : "OK");
        return vo;
    }
}
