package com.bsoft.cdcconfig.monitor.jobfailure.runtime;

import java.util.LinkedHashMap;
import java.util.Map;

/**
 * Strict read-only snapshot of ZooKeeper runtime status for a Summary round.
 * Never holds stale data: each instance is built once per {@code querySummary()} call.
 */
public class JobRuntimeSnapshot {

    private final Map<String, Boolean> clientOnline = new LinkedHashMap<>();
    private final Map<String, Map<String, Boolean>> jobOnline = new LinkedHashMap<>();

    void setClientOnline(String clientId, boolean online) {
        clientOnline.put(clientId, online);
    }

    void setJobOnline(String clientId, String jobId, boolean online) {
        jobOnline.computeIfAbsent(clientId, k -> new LinkedHashMap<>()).put(jobId, online);
    }

    public Boolean clientOnline(String clientId) {
        return clientOnline.get(clientId);
    }

    public Boolean jobOnline(String clientId, String jobId) {
        Map<String, Boolean> jobs = jobOnline.get(clientId);
        return jobs == null ? null : jobs.get(jobId);
    }
}
