package com.bsoft.cdcconfig.monitor.zookeeper.client;

import com.bsoft.cdcconfig.monitor.zookeeper.config.ZooKeeperConfig;
import org.apache.curator.framework.CuratorFramework;
import org.apache.zookeeper.KeeperException;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Component;

import java.nio.charset.StandardCharsets;
import java.util.Collections;
import java.util.List;

@Component
public class ZooKeeperReadOnlyClient {

    private static final Logger log = LoggerFactory.getLogger(ZooKeeperReadOnlyClient.class);

    private final CuratorFramework client;
    private final String rootPath;

    public ZooKeeperReadOnlyClient(CuratorFramework client, ZooKeeperConfig config) {
        this.client = client;
        this.rootPath = config.getRootPath();
    }

    public String getRootPath() {
        return rootPath;
    }

    public String getClientsPath() {
        return rootPath + "/clients";
    }

    public boolean clientsPathExists() throws Exception {
        return client.checkExists().forPath(getClientsPath()) != null;
    }

    public List<String> getClientNames() throws Exception {
        String clientsPath = getClientsPath();
        if (client.checkExists().forPath(clientsPath) == null) {
            return Collections.emptyList();
        }
        return client.getChildren().forPath(clientsPath);
    }

    public boolean nodeExists(String path) throws Exception {
        return client.checkExists().forPath(path) != null;
    }

    public byte[] getNodeData(String path) throws Exception {
        if (client.checkExists().forPath(path) == null) {
            return null;
        }
        return client.getData().forPath(path);
    }

    public String getNodeDataAsString(String path) throws Exception {
        byte[] data = getNodeData(path);
        if (data == null || data.length == 0) {
            return null;
        }
        return new String(data, StandardCharsets.UTF_8);
    }

    public List<String> getChildren(String path) throws Exception {
        if (client.checkExists().forPath(path) == null) {
            return Collections.emptyList();
        }
        return client.getChildren().forPath(path);
    }

    public boolean isAlive(String clientName) {
        try {
            String alivePath = getClientsPath() + "/" + clientName + "/alive";
            return client.checkExists().forPath(alivePath) != null;
        } catch (Exception e) {
            log.warn("Failed to check alive for client={}", clientName, e);
            return false;
        }
    }

    public boolean isConnected() {
        return client.getZookeeperClient().isConnected();
    }
}
