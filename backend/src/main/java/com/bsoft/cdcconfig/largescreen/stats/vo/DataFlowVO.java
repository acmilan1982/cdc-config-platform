package com.bsoft.cdcconfig.largescreen.stats.vo;

public class DataFlowVO {

    private String sourceDb;
    private String sourceOrg;
    private String targetDb;
    private Integer tableCount;

    public String getSourceDb() { return sourceDb; }
    public void setSourceDb(String v) { this.sourceDb = v; }
    public String getSourceOrg() { return sourceOrg; }
    public void setSourceOrg(String v) { this.sourceOrg = v; }
    public String getTargetDb() { return targetDb; }
    public void setTargetDb(String v) { this.targetDb = v; }
    public Integer getTableCount() { return tableCount; }
    public void setTableCount(Integer v) { this.tableCount = v; }
}
