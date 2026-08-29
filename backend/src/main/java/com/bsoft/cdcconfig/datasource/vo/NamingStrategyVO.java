package com.bsoft.cdcconfig.datasource.vo;

public class NamingStrategyVO {

    private String sourceDataSourceId;
    private String targetDataSourceId;
    private String targetDataSourceName;
    private String targetDataSourceType;
    private String tableNamingStrategy;
    private String tableNamePrefix;
    private String tableNameSuffix;

    public String getSourceDataSourceId() { return sourceDataSourceId; }
    public void setSourceDataSourceId(String sourceDataSourceId) { this.sourceDataSourceId = sourceDataSourceId; }

    public String getTargetDataSourceId() { return targetDataSourceId; }
    public void setTargetDataSourceId(String targetDataSourceId) { this.targetDataSourceId = targetDataSourceId; }

    public String getTargetDataSourceName() { return targetDataSourceName; }
    public void setTargetDataSourceName(String targetDataSourceName) { this.targetDataSourceName = targetDataSourceName; }

    public String getTargetDataSourceType() { return targetDataSourceType; }
    public void setTargetDataSourceType(String targetDataSourceType) { this.targetDataSourceType = targetDataSourceType; }

    public String getTableNamingStrategy() { return tableNamingStrategy; }
    public void setTableNamingStrategy(String tableNamingStrategy) { this.tableNamingStrategy = tableNamingStrategy; }

    public String getTableNamePrefix() { return tableNamePrefix; }
    public void setTableNamePrefix(String tableNamePrefix) { this.tableNamePrefix = tableNamePrefix; }

    public String getTableNameSuffix() { return tableNameSuffix; }
    public void setTableNameSuffix(String tableNameSuffix) { this.tableNameSuffix = tableNameSuffix; }
}
