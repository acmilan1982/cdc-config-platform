package com.bsoft.cdcconfig.clientconfig.entity;

import com.baomidou.mybatisplus.annotation.TableField;
import com.baomidou.mybatisplus.annotation.TableId;
import com.baomidou.mybatisplus.annotation.TableName;

/**
 * 只读安全字段来源实体：仅映射批准的安全字段，绝不读取/传输 DATA_SOURCE_PASSWORD、
 * 连接串、主机、用户名、服务名等无关连接信息（CCFG-DB-006 / CCFG-DESIGN-008）。
 */
@TableName("CDC_DATA_SOURCE")
public class CdcDataSource {

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

    @TableField("FG_ACTIVE")
    private String fgActive;

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

    public String getFgActive() { return fgActive; }
    public void setFgActive(String fgActive) { this.fgActive = fgActive; }
}
