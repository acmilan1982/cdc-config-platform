package com.bsoft.cdcconfig.monitor.zookeeper.service;

import com.bsoft.cdcconfig.monitor.zookeeper.vo.ZooKeeperClientMonitorResponse;

public interface ZooKeeperMonitorService {

    ZooKeeperClientMonitorResponse getClients();

    boolean isZooKeeperConnected();
}
