package com.bsoft.cdcconfig.datasource.vo;

public class DataSourceExtendVO {

    private String tableNamingStrategy;
    private String tableNamePrefix;
    private String tableNameSuffix;

    public String getTableNamingStrategy() { return tableNamingStrategy; }
    public void setTableNamingStrategy(String tableNamingStrategy) { this.tableNamingStrategy = tableNamingStrategy; }

    public String getTableNamePrefix() { return tableNamePrefix; }
    public void setTableNamePrefix(String tableNamePrefix) { this.tableNamePrefix = tableNamePrefix; }

    public String getTableNameSuffix() { return tableNameSuffix; }
    public void setTableNameSuffix(String tableNameSuffix) { this.tableNameSuffix = tableNameSuffix; }
}
