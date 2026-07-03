package com.bsoft.cdcconfig.datasource.entity;

import com.baomidou.mybatisplus.annotation.TableField;
import com.baomidou.mybatisplus.annotation.TableId;
import com.baomidou.mybatisplus.annotation.TableName;

import java.util.Date;

@TableName("CDC_DATA_SOURCE")
public class DataSource {

    @TableId("DATA_SOURCE_ID")
    private String dataSourceId;

    @TableField("DATA_SOURCE_NAME")
    private String dataSourceName;

    @TableField("DATA_SOURCE_CATEGORY")
    private String dataSourceCategory;

    @TableField("DATA_SOURCE_TYPE")
    private String dataSourceType;

    @TableField("DATA_SOURCE_ORG")
    private String dataSourceOrg;

    @TableField("DATA_SOURCE_HOST")
    private String dataSourceHost;

    @TableField("DATA_SOURCE_PORT")
    private String dataSourcePort;

    @TableField("DATA_SOURCE_USER_NAME")
    private String dataSourceUserName;

    @TableField("DATA_SOURCE_PASSWORD")
    private String dataSourcePassword;

    @TableField("DATA_SOURCE_SERVICE_NAME")
    private String dataSourceServiceName;

    @TableField("FG_ACTIVE")
    private String fgActive;

    @TableField("SOURCE_APP")
    private String sourceApp;

    @TableField("DATA_SOURCE_BIZ_ATTR")
    private String dataSourceBizAttr;

    @TableField("DATA_SOURCE_DOMAIN")
    private String dataSourceDomain;

    @TableField("INSERT_TIME")
    private Date insertTime;

    @TableField("UPDATE_TIME")
    private Date updateTime;

    @TableField("DELETE_TIME")
    private Date deleteTime;

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

    public String getFgActive() { return fgActive; }
    public void setFgActive(String fgActive) { this.fgActive = fgActive; }

    public String getSourceApp() { return sourceApp; }
    public void setSourceApp(String sourceApp) { this.sourceApp = sourceApp; }

    public String getDataSourceBizAttr() { return dataSourceBizAttr; }
    public void setDataSourceBizAttr(String dataSourceBizAttr) { this.dataSourceBizAttr = dataSourceBizAttr; }

    public String getDataSourceDomain() { return dataSourceDomain; }
    public void setDataSourceDomain(String dataSourceDomain) { this.dataSourceDomain = dataSourceDomain; }

    public Date getInsertTime() { return insertTime; }
    public void setInsertTime(Date insertTime) { this.insertTime = insertTime; }

    public Date getUpdateTime() { return updateTime; }
    public void setUpdateTime(Date updateTime) { this.updateTime = updateTime; }

    public Date getDeleteTime() { return deleteTime; }
    public void setDeleteTime(Date deleteTime) { this.deleteTime = deleteTime; }
}
