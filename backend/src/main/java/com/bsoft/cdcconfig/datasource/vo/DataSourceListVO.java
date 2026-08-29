package com.bsoft.cdcconfig.datasource.vo;

public class DataSourceListVO {

    private String dataSourceId;
    private String dataSourceName;
    private String dataSourceCategory;
    private String dataSourceType;
    private String host;
    private Integer port;
    private String userName;
    private String serviceName;

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
}
