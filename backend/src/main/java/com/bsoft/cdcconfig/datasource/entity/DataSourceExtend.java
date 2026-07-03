package com.bsoft.cdcconfig.datasource.entity;

import com.baomidou.mybatisplus.annotation.TableField;
import com.baomidou.mybatisplus.annotation.TableName;

@TableName("CDC_DATA_SOURCE_EXTEND")
public class DataSourceExtend {

    @TableField("DATA_SOURCE_ID")
    private String dataSourceId;

    @TableField("TABLE_NAMING_STRATEGY")
    private String tableNamingStrategy;

    @TableField("TABLE_NAME_PREFIX")
    private String tableNamePrefix;

    @TableField("TABLE_NAME_SUFFIX")
    private String tableNameSuffix;

    public String getDataSourceId() { return dataSourceId; }
    public void setDataSourceId(String dataSourceId) { this.dataSourceId = dataSourceId; }

    public String getTableNamingStrategy() { return tableNamingStrategy; }
    public void setTableNamingStrategy(String tableNamingStrategy) { this.tableNamingStrategy = tableNamingStrategy; }

    public String getTableNamePrefix() { return tableNamePrefix; }
    public void setTableNamePrefix(String tableNamePrefix) { this.tableNamePrefix = tableNamePrefix; }

    public String getTableNameSuffix() { return tableNameSuffix; }
    public void setTableNameSuffix(String tableNameSuffix) { this.tableNameSuffix = tableNameSuffix; }
}
