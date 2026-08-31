package com.bsoft.cdcconfig.subscription.entity;

import com.baomidou.mybatisplus.annotation.TableField;
import com.baomidou.mybatisplus.annotation.TableId;
import com.baomidou.mybatisplus.annotation.TableName;

/**
 * CDC_DATA_SOURCE 最小字段投影（仅 DATA_SOURCE_ID / DATA_SOURCE_ORG / DATA_SOURCE_CATEGORY / FG_ACTIVE）。
 * 用于订阅列表/详情/候选的数据源引用映射，避免为展示批量加载包含密码的完整 DataSource Entity
 * （DESIGN §4.8 / DATABASE §4.6）。密码仅在 SourceMetadataService 建立源 Oracle 连接时按需单条读取。
 */
@TableName("CDC_DATA_SOURCE")
public class DataSourceRef {

    @TableId("DATA_SOURCE_ID")
    private String dataSourceId;

    @TableField("DATA_SOURCE_ORG")
    private String dataSourceOrg;

    @TableField("DATA_SOURCE_CATEGORY")
    private String dataSourceCategory;

    @TableField("FG_ACTIVE")
    private String fgActive;

    public String getDataSourceId() { return dataSourceId; }
    public void setDataSourceId(String dataSourceId) { this.dataSourceId = dataSourceId; }

    public String getDataSourceOrg() { return dataSourceOrg; }
    public void setDataSourceOrg(String dataSourceOrg) { this.dataSourceOrg = dataSourceOrg; }

    public String getDataSourceCategory() { return dataSourceCategory; }
    public void setDataSourceCategory(String dataSourceCategory) { this.dataSourceCategory = dataSourceCategory; }

    public String getFgActive() { return fgActive; }
    public void setFgActive(String fgActive) { this.fgActive = fgActive; }
}
