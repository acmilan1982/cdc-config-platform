package com.bsoft.cdcconfig.datasource.dto;

import javax.validation.constraints.NotBlank;
import javax.validation.constraints.Size;

public class NamingStrategyDTO {

    @NotBlank(message = "目标数据源ID不能为空")
    @Size(max = 32, message = "目标数据源ID长度不能超过32")
    private String targetDataSourceId;

    @NotBlank(message = "命名策略不能为空")
    private String tableNamingStrategy;

    @Size(max = 128, message = "表名前缀长度不能超过128")
    private String tableNamePrefix;

    @Size(max = 128, message = "表名后缀长度不能超过128")
    private String tableNameSuffix;

    public String getTargetDataSourceId() { return targetDataSourceId; }
    public void setTargetDataSourceId(String targetDataSourceId) { this.targetDataSourceId = targetDataSourceId; }

    public String getTableNamingStrategy() { return tableNamingStrategy; }
    public void setTableNamingStrategy(String tableNamingStrategy) { this.tableNamingStrategy = tableNamingStrategy; }

    public String getTableNamePrefix() { return tableNamePrefix; }
    public void setTableNamePrefix(String tableNamePrefix) { this.tableNamePrefix = tableNamePrefix; }

    public String getTableNameSuffix() { return tableNameSuffix; }
    public void setTableNameSuffix(String tableNameSuffix) { this.tableNameSuffix = tableNameSuffix; }
}
