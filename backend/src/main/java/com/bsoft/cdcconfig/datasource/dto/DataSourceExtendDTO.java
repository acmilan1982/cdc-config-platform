package com.bsoft.cdcconfig.datasource.dto;

import javax.validation.constraints.NotBlank;

public class DataSourceExtendDTO {

    @NotBlank(message = "命名策略不能为空")
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
