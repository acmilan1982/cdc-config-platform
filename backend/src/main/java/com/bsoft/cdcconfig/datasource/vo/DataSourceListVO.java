package com.bsoft.cdcconfig.datasource.vo;

import com.fasterxml.jackson.annotation.JsonInclude;

/**
 * 数据源列表行（API.md §11.2）。
 * <p>全局 Jackson 为 non_null；{@code fgActive} 在数据库原值为 {@code NULL} 时仍需以显式 JSON
 * {@code null} 输出（键存在），供前端区分「原值 NULL」与「字段未返回」，故仅对本字段使用字段级
 * {@code @JsonInclude(ALWAYS)}，不改变全局序列化配置。
 */
public class DataSourceListVO {

    private String dataSourceId;
    private String dataSourceName;
    private String dataSourceCategory;
    private String dataSourceType;
    private String host;
    private Integer port;
    private String userName;
    private String serviceName;

    @JsonInclude(JsonInclude.Include.ALWAYS)
    private String fgActive;

    public String getDataSourceId() { return dataSourceId; }
    public void setDataSourceId(String dataSourceId) { this.dataSourceId = dataSourceId; }

    public String getDataSourceName() { return dataSourceName; }
    public void setDataSourceName(String dataSourceName) { this.dataSourceName = dataSourceName; }

    public String getDataSourceCategory() { return dataSourceCategory; }
    public void setDataSourceCategory(String dataSourceCategory) { this.dataSourceCategory = dataSourceCategory; }

    public String getDataSourceType() { return dataSourceType; }
    public void setDataSourceType(String dataSourceType) { this.dataSourceType = dataSourceType; }

    public String getHost() { return host; }
    public void setHost(String host) { this.host = host; }

    public Integer getPort() { return port; }
    public void setPort(Integer port) { this.port = port; }

    public String getUserName() { return userName; }
    public void setUserName(String userName) { this.userName = userName; }

    public String getServiceName() { return serviceName; }
    public void setServiceName(String serviceName) { this.serviceName = serviceName; }

    public String getFgActive() { return fgActive; }
    public void setFgActive(String fgActive) { this.fgActive = fgActive; }
}
