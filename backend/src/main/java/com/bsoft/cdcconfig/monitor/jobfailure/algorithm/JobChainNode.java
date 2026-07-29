package com.bsoft.cdcconfig.monitor.jobfailure.algorithm;

/**
 * A node in the physical Job evolution chain.
 */
public class JobChainNode {

    private String jobId;
    private ChainNodeType nodeType;
    private boolean hasAnomaly;

    public JobChainNode() {}

    public JobChainNode(String jobId, ChainNodeType nodeType) {
        this.jobId = jobId;
        this.nodeType = nodeType;
    }

    public JobChainNode(String jobId, ChainNodeType nodeType, boolean hasAnomaly) {
        this.jobId = jobId;
        this.nodeType = nodeType;
        this.hasAnomaly = hasAnomaly;
    }

    public String getJobId() { return jobId; }
    public void setJobId(String jobId) { this.jobId = jobId; }

    public ChainNodeType getNodeType() { return nodeType; }
    public void setNodeType(ChainNodeType nodeType) { this.nodeType = nodeType; }

    public boolean isHasAnomaly() { return hasAnomaly; }
    public void setHasAnomaly(boolean hasAnomaly) { this.hasAnomaly = hasAnomaly; }

    public enum ChainNodeType {
        INITIAL, INTERMEDIATE, CURRENT, FINAL
    }
}
