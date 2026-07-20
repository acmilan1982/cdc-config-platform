package com.bsoft.cdcconfig.monitor.zookeeper.vo;

import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.ArrayList;
import java.util.List;

public class ZooKeeperClientMonitorResponse {

    private String refreshedAt;
    private String source;
    private Boolean partialFailure;
    private List<String> warnings;
    private List<ZooKeeperClientVO> clients;

    public ZooKeeperClientMonitorResponse() {
        this.refreshedAt = LocalDateTime.now().format(DateTimeFormatter.ofPattern("yyyy-MM-dd HH:mm:ss"));
        this.source = "/bsoft-cdc/clients";
        this.partialFailure = false;
        this.warnings = new ArrayList<>();
        this.clients = new ArrayList<>();
    }

    public String getRefreshedAt() {
        return refreshedAt;
    }

    public void setRefreshedAt(String refreshedAt) {
        this.refreshedAt = refreshedAt;
    }

    public String getSource() {
        return source;
    }

    public void setSource(String source) {
        this.source = source;
    }

    public Boolean getPartialFailure() {
        return partialFailure;
    }

    public void setPartialFailure(Boolean partialFailure) {
        this.partialFailure = partialFailure;
    }

    public List<String> getWarnings() {
        return warnings;
    }

    public void setWarnings(List<String> warnings) {
        this.warnings = warnings;
    }

    public List<ZooKeeperClientVO> getClients() {
        return clients;
    }

    public void setClients(List<ZooKeeperClientVO> clients) {
        this.clients = clients;
    }

    public void addWarning(String warning) {
        this.warnings.add(warning);
        this.partialFailure = true;
    }
}
