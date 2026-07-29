package com.bsoft.cdcconfig.monitor.jobfailure.algorithm;

import java.util.ArrayList;
import java.util.List;

/**
 * A group of events and logs belonging to one fault process.
 * faultRootId is the ID of the first main-chain event in this process.
 */
public class FaultProcessGroup {

    /** ID of the chronologically first main-chain event in this fault process. */
    private Long faultRootId;

    /** All events in this fault process (main-chain and excluded), sorted by FAILURE_TIME ASC. */
    private List<FaultEventModel> allEvents = new ArrayList<>();

    /** Main-chain events only, sorted by FAILURE_TIME ASC. */
    private List<FaultEventModel> mainChainEvents = new ArrayList<>();

    /** Events excluded from main chain (invalid/stale/duplicate). */
    private List<FaultEventModel> excludedEvents = new ArrayList<>();

    /** All logs for all events in this process, sorted by (HANDLE_TIME ASC, ID ASC). */
    private List<FaultLogModel> allLogs = new ArrayList<>();

    /** Physical Job chain nodes. */
    private List<JobChainNode> jobChain = new ArrayList<>();

    /** Detected anomalies. */
    private List<AnomalyInfo> anomalies = new ArrayList<>();

    public Long getFaultRootId() { return faultRootId; }
    public void setFaultRootId(Long faultRootId) { this.faultRootId = faultRootId; }

    public List<FaultEventModel> getAllEvents() { return allEvents; }
    public void setAllEvents(List<FaultEventModel> allEvents) { this.allEvents = allEvents; }

    public List<FaultEventModel> getMainChainEvents() { return mainChainEvents; }
    public void setMainChainEvents(List<FaultEventModel> mainChainEvents) { this.mainChainEvents = mainChainEvents; }

    public List<FaultEventModel> getExcludedEvents() { return excludedEvents; }
    public void setExcludedEvents(List<FaultEventModel> excludedEvents) { this.excludedEvents = excludedEvents; }

    public List<FaultLogModel> getAllLogs() { return allLogs; }
    public void setAllLogs(List<FaultLogModel> allLogs) { this.allLogs = allLogs; }

    public List<JobChainNode> getJobChain() { return jobChain; }
    public void setJobChain(List<JobChainNode> jobChain) { this.jobChain = jobChain; }

    public List<AnomalyInfo> getAnomalies() { return anomalies; }
    public void setAnomalies(List<AnomalyInfo> anomalies) { this.anomalies = anomalies; }

    public boolean hasAnomalies() { return anomalies != null && !anomalies.isEmpty(); }

    /**
     * Number of RESTART_STARTED logs across all main-chain events.
     */
    public int countRestarts() {
        int count = 0;
        for (FaultLogModel log : allLogs) {
            if (log.isRestartStarted()) count++;
        }
        return count;
    }

    /**
     * Number of main-chain events in this fault process.
     */
    public int countMainChainEvents() {
        return mainChainEvents.size();
    }

    /**
     * First failure time across all events.
     */
    public java.time.LocalDateTime getFirstFailureTime() {
        if (allEvents.isEmpty()) return null;
        java.time.LocalDateTime first = null;
        for (FaultEventModel e : allEvents) {
            if (e.getFailureTime() != null) {
                if (first == null || e.getFailureTime().isBefore(first)) {
                    first = e.getFailureTime();
                }
            }
        }
        return first;
    }

    /**
     * Latest handle time across all logs.
     */
    public java.time.LocalDateTime getLastHandleTime() {
        if (allLogs.isEmpty()) return null;
        java.time.LocalDateTime last = null;
        for (FaultLogModel log : allLogs) {
            if (log.getHandleTime() != null) {
                if (last == null || log.getHandleTime().isAfter(last)) {
                    last = log.getHandleTime();
                }
            }
        }
        return last;
    }
}
