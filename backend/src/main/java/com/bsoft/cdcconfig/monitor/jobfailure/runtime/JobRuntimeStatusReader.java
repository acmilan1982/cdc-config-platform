package com.bsoft.cdcconfig.monitor.jobfailure.runtime;

import com.bsoft.cdcconfig.monitor.jobfailure.exception.JobFailureErrorCode;
import com.bsoft.cdcconfig.monitor.zookeeper.client.ZooKeeperReadOnlyClient;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Component;

import java.util.List;
import java.util.Map;

/**
 * Strict read-only ZooKeeper runtime status reader for the fault-monitor Summary.
 * Reuses the shared {@link ZooKeeperReadOnlyClient} (single Curator bean) and only checks
 * {@code alive} node existence via {@code nodeExists}, which propagates exceptions.
 * A client whose {@code alive} node is absent short-circuits: its job {@code alive} paths are
 * never read. Any required-path read failure fails the whole snapshot.
 */
@Component
public class JobRuntimeStatusReader {

    private static final Logger log = LoggerFactory.getLogger(JobRuntimeStatusReader.class);

    private final ZooKeeperReadOnlyClient zkClient;

    public JobRuntimeStatusReader(ZooKeeperReadOnlyClient zkClient) {
        this.zkClient = zkClient;
    }

    /**
     * @param clientJobs ordered clientId -> ordered distinct single-DATA_SOURCE_ID list (already
     *                   split/trimmed/deduped by the caller)
     */
    public JobRuntimeSnapshot snapshot(Map<String, List<String>> clientJobs) {
        if (!zkClient.isConnected()) {
            log.error("ZooKeeper 未连接，运行时状态快照失败");
            throw JobFailureErrorCode.zkStatusUnavailable();
        }

        JobRuntimeSnapshot snapshot = new JobRuntimeSnapshot();
        for (Map.Entry<String, List<String>> entry : clientJobs.entrySet()) {
            String clientId = entry.getKey();
            boolean clientOnline = clientAliveExists(clientId);
            snapshot.setClientOnline(clientId, clientOnline);

            for (String jobId : entry.getValue()) {
                if (!clientOnline) {
                    snapshot.setJobOnline(clientId, jobId, false);
                } else {
                    snapshot.setJobOnline(clientId, jobId, jobAliveExists(clientId, jobId));
                }
            }
        }
        return snapshot;
    }

    private boolean clientAliveExists(String clientId) {
        String path = clientAlivePath(clientId);
        try {
            return zkClient.nodeExists(path);
        } catch (Exception e) {
            log.error("读取客户端 alive 失败: clientId={}, path={}", clientId, path, e);
            throw JobFailureErrorCode.zkStatusUnavailable();
        }
    }

    private boolean jobAliveExists(String clientId, String jobId) {
        String path = jobAlivePath(clientId, jobId);
        try {
            return zkClient.nodeExists(path);
        } catch (Exception e) {
            log.error("读取 Job alive 失败: clientId={}, jobId={}, path={}", clientId, jobId, path, e);
            throw JobFailureErrorCode.zkStatusUnavailable();
        }
    }

    String clientAlivePath(String clientId) {
        return zkClient.getClientsPath() + "/" + clientId + "/alive";
    }

    String jobAlivePath(String clientId, String jobId) {
        return zkClient.getClientsPath() + "/" + clientId + "/jobs/" + jobId + "/alive";
    }
}
