package com.bsoft.cdcconfig.subscription.vo;

import java.util.List;

/**
 * 删除预览（API.md §4.9）。schemaCount 为至少选中一张表的 Schema 数；tableCount 为
 * DATA_SOURCE_TABLE 非空 token 总数（含不可解析历史 token）。只读配置库，不锁行。
 */
public class SubscriptionDeletePreviewVO {

    private String dataSubId;
    private String dataSubDesc;
    private SourceRefVO source;
    private int schemaCount;
    private int tableCount;
    private List<TargetRefVO> targets;
    private List<String> warnings;

    public String getDataSubId() { return dataSubId; }
    public void setDataSubId(String dataSubId) { this.dataSubId = dataSubId; }

    public String getDataSubDesc() { return dataSubDesc; }
    public void setDataSubDesc(String dataSubDesc) { this.dataSubDesc = dataSubDesc; }

    public SourceRefVO getSource() { return source; }
    public void setSource(SourceRefVO source) { this.source = source; }

    public int getSchemaCount() { return schemaCount; }
    public void setSchemaCount(int schemaCount) { this.schemaCount = schemaCount; }

    public int getTableCount() { return tableCount; }
    public void setTableCount(int tableCount) { this.tableCount = tableCount; }

    public List<TargetRefVO> getTargets() { return targets; }
    public void setTargets(List<TargetRefVO> targets) { this.targets = targets; }

    public List<String> getWarnings() { return warnings; }
    public void setWarnings(List<String> warnings) { this.warnings = warnings; }
}
