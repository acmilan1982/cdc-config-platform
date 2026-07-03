package com.bsoft.cdcconfig.datasource.dto;

import javax.validation.Valid;
import javax.validation.constraints.NotBlank;
import javax.validation.constraints.NotNull;

public class DataSourceUpdateDTO {

    private String dataSourceId;

    @NotBlank(message = "数据源名称不能为空")
    private String dataSourceName;

    @NotBlank(message = "数据源类别不能为空")
    private String dataSourceCategory;

    @NotBlank(message = "数据库类型不能为空")
    private String dataSourceType;

    @NotBlank(message = "数据源机构不能为空")
    private String dataSourceOrg;

    @NotBlank(message = "主机地址不能为空")
    private String dataSourceHost;

    @NotBlank(message = "端口不能为空")
    private String dataSourcePort;

    @NotBlank(message = "用户名不能为空")
    private String dataSourceUserName;

    private String dataSourcePassword;

    @NotBlank(message = "Service Name不能为空")
    private String dataSourceServiceName;

    private String sourceApp;

    private String dataSourceBizAttr;

    @Valid
    @NotNull(message = "扩展配置不能为空")
    private DataSourceExtendDTO extend;

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

    public String getDataSourcePassword() { return dataSourcePassword; }
    public void setDataSourcePassword(String dataSourcePassword) { this.dataSourcePassword = dataSourcePassword; }

    public String getDataSourceServiceName() { return dataSourceServiceName; }
    public void setDataSourceServiceName(String dataSourceServiceName) { this.dataSourceServiceName = dataSourceServiceName; }

    public String getSourceApp() { return sourceApp; }
    public void setSourceApp(String sourceApp) { this.sourceApp = sourceApp; }

    public String getDataSourceBizAttr() { return dataSourceBizAttr; }
    public void setDataSourceBizAttr(String dataSourceBizAttr) { this.dataSourceBizAttr = dataSourceBizAttr; }

    public DataSourceExtendDTO getExtend() { return extend; }
    public void setExtend(DataSourceExtendDTO extend) { this.extend = extend; }
}
