package com.bsoft.cdcconfig.largescreen.stats.vo;

public class CoverageStatsVO {

    private Integer institutionCount;
    private Integer clientCount;
    private Integer sourceDbCount;
    private Integer targetDbCount;
    private Integer subscribeTableCount;

    public Integer getInstitutionCount() { return institutionCount; }
    public void setInstitutionCount(Integer v) { this.institutionCount = v; }
    public Integer getClientCount() { return clientCount; }
    public void setClientCount(Integer v) { this.clientCount = v; }
    public Integer getSourceDbCount() { return sourceDbCount; }
    public void setSourceDbCount(Integer v) { this.sourceDbCount = v; }
    public Integer getTargetDbCount() { return targetDbCount; }
    public void setTargetDbCount(Integer v) { this.targetDbCount = v; }
    public Integer getSubscribeTableCount() { return subscribeTableCount; }
    public void setSubscribeTableCount(Integer v) { this.subscribeTableCount = v; }
}
