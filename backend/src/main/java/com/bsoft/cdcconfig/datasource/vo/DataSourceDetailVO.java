package com.bsoft.cdcconfig.datasource.vo;

import com.bsoft.cdcconfig.datasource.dto.DataSourceExtendDTO;

public class DataSourceDetailVO {

    private String dataSourceId;
    private String dataSourceName;
    private String dataSourceCategory;
    private String dataSourceType;
    private String dataSourceOrg;
    private String dataSourceHost;
    private String dataSourcePort;
    private String dataSourceUserName;
    private String dataSourceServiceName;
    private String fgActive;
    private String sourceApp;
    private String dataSourceBizAttr;

    private Boolean extendExists;
    private DataSourceExtendVO extend;

    public String getDataSourceId() { return dataSourceId; }
    public void setDataSourceId(String dataSourceId) { this.dataSourceId = dataSourceId; }

    public String getDataSourceName() { return dataSourceName; }
    public void setDataSourceName(String dataSourceName) { this.dataSourceName = dataSourceName; }

    public String getDataSourceCategory() { return dataSourceCategory; }
    public void setDataSourceCategory(String dataSourceCategory) { this.dataSourceCategory = dataSourceCategory; }

    public String getDataSourceType() { return dataSourceType; }
    public void setDataSourceType(String dataSourceType) { this.dataSourceType = dataSourceType; }

    public String getDataSourceOrg() { return dataSourceOrg; }
    public void setDataSourceOrg(String dataSourceOrg) { this.dataSourceOrg = dataSourceOrg; }

    public String getDataSourceHost() { return dataSourceHost; }
    public void setDataSourceHost(String dataSourceHost) { this.dataSourceHost = dataSourceHost; }

    public String getDataSourcePort() { return dataSourcePort; }
    public void setDataSourcePort(String dataSourcePort) { this.dataSourcePort = dataSourcePort; }

    public String getDataSourceUserName() { return dataSourceUserName; }
    public void setDataSourceUserName(String dataSourceUserName) { this.dataSourceUserName = dataSourceUserName; }

    public String getDataSourceServiceName() { return dataSourceServiceName; }
    public void setDataSourceServiceName(String dataSourceServiceName) { this.dataSourceServiceName = dataSourceServiceName; }

    public String getFgActive() { return fgActive; }
    public void setFgActive(String fgActive) { this.fgActive = fgActive; }

    public String getSourceApp() { return sourceApp; }
    public void setSourceApp(String sourceApp) { this.sourceApp = sourceApp; }

    public String getDataSourceBizAttr() { return dataSourceBizAttr; }
    public void setDataSourceBizAttr(String dataSourceBizAttr) { this.dataSourceBizAttr = dataSourceBizAttr; }

    public Boolean getExtendExists() { return extendExists; }
    public void setExtendExists(Boolean extendExists) { this.extendExists = extendExists; }

    public DataSourceExtendVO getExtend() { return extend; }
    public void setExtend(DataSourceExtendVO extend) { this.extend = extend; }
}
