package com.bsoft.cdcconfig.monitor.jobfailure.vo;

public class JobChainVO {

    private String jobId;
    private String nodeType;
    private String nodeTypeLabel;
    private boolean hasAnomaly;

    public String getJobId() { return jobId; }
    public void setJobId(String jobId) { this.jobId = jobId; }

    public String getNodeType() { return nodeType; }
    public void setNodeType(String nodeType) { this.nodeType = nodeType; }

    public String getNodeTypeLabel() { return nodeTypeLabel; }
    public void setNodeTypeLabel(String nodeTypeLabel) { this.nodeTypeLabel = nodeTypeLabel; }

    public boolean isHasAnomaly() { return hasAnomaly; }
    public void setHasAnomaly(boolean hasAnomaly) { this.hasAnomaly = hasAnomaly; }
}
