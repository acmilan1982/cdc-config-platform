package com.bsoft.cdcconfig.datasource.dto;

import javax.validation.constraints.Max;
import javax.validation.constraints.Min;
import javax.validation.constraints.NotBlank;
import javax.validation.constraints.NotNull;
import javax.validation.constraints.Pattern;
import javax.validation.constraints.Size;

public class DataSourceUpdateDTO {

    @NotBlank(message = "数据源ID不能为空")
    @Size(max = 32, message = "数据源ID长度不能超过32")
    @Pattern(regexp = "[A-Za-z0-9_-]+", message = "数据源ID只能包含字母、数字、下划线和短横线")
    private String dataSourceId;

    @NotBlank(message = "数据源名称不能为空")
    @Size(max = 30, message = "数据源名称长度不能超过30")
    private String dataSourceName;

    @NotBlank(message = "数据源类别不能为空")
    private String dataSourceCategory;

    @NotBlank(message = "数据库类型不能为空")
    private String dataSourceType;

    @NotBlank(message = "主机地址不能为空")
    @Size(max = 64, message = "主机地址长度不能超过64")
    private String host;

    @NotNull(message = "端口不能为空")
    @Min(value = 1, message = "端口必须为1-65535之间的整数")
    @Max(value = 65535, message = "端口必须为1-65535之间的整数")
    private Integer port;

    @NotBlank(message = "用户名不能为空")
    @Size(max = 64, message = "用户名长度不能超过64")
    private String userName;

    @Size(max = 64, message = "密码长度不能超过64")
    private String password;

    @NotBlank(message = "Service Name不能为空")
    @Size(max = 64, message = "Service Name长度不能超过64")
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

    public String getPassword() { return password; }
    public void setPassword(String password) { this.password = password; }

    public String getServiceName() { return serviceName; }
    public void setServiceName(String serviceName) { this.serviceName = serviceName; }
}
