package com.bsoft.cdcconfig.monitor.zookeeper.vo;

import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;

public class ZooKeeperHealthResponse {

    private Boolean connected;
    private String connectString;
    private String rootPath;
    private String checkedAt;
    private String errorMessage;

    public ZooKeeperHealthResponse() {
        this.checkedAt = LocalDateTime.now().format(DateTimeFormatter.ofPattern("yyyy-MM-dd HH:mm:ss"));
    }

    public Boolean getConnected() {
        return connected;
    }

    public void setConnected(Boolean connected) {
        this.connected = connected;
    }

    public String getConnectString() {
        return connectString;
    }

    public void setConnectString(String connectString) {
        this.connectString = connectString;
    }

    public String getRootPath() {
        return rootPath;
    }

    public void setRootPath(String rootPath) {
        this.rootPath = rootPath;
    }

    public String getCheckedAt() {
        return checkedAt;
    }

    public void setCheckedAt(String checkedAt) {
        this.checkedAt = checkedAt;
    }

    public String getErrorMessage() {
        return errorMessage;
    }

    public void setErrorMessage(String errorMessage) {
        this.errorMessage = errorMessage;
    }
}
