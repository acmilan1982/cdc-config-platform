package com.bsoft.cdcconfig.subscription.vo;

import java.util.List;

/**
 * 详情（API.md §4.3）。warnings 为已停用/不存在数据源、字段格式异常等警告文案
 * （string[]，区别于列表的 QueryWarning 结构）。不展示遗留字段。
 */
public class SubscriptionDetailVO {

    private String dataSubId;
    private String dataSubDesc;
    private SourceRefVO source;
    private List<SchemaTableGroup> tablesBySchema;
    private List<String> rawUnparseableTables;
    private List<TargetRefVO> targets;
    private String insertTime;
    private String updateTime;
    private List<String> warnings;

    public String getDataSubId() { return dataSubId; }
    public void setDataSubId(String dataSubId) { this.dataSubId = dataSubId; }

    public String getDataSubDesc() { return dataSubDesc; }
    public void setDataSubDesc(String dataSubDesc) { this.dataSubDesc = dataSubDesc; }

    public SourceRefVO getSource() { return source; }
    public void setSource(SourceRefVO source) { this.source = source; }

    public List<SchemaTableGroup> getTablesBySchema() { return tablesBySchema; }
    public void setTablesBySchema(List<SchemaTableGroup> tablesBySchema) { this.tablesBySchema = tablesBySchema; }

    public List<String> getRawUnparseableTables() { return rawUnparseableTables; }
    public void setRawUnparseableTables(List<String> rawUnparseableTables) { this.rawUnparseableTables = rawUnparseableTables; }

    public List<TargetRefVO> getTargets() { return targets; }
    public void setTargets(List<TargetRefVO> targets) { this.targets = targets; }

    public String getInsertTime() { return insertTime; }
    public void setInsertTime(String insertTime) { this.insertTime = insertTime; }

    public String getUpdateTime() { return updateTime; }
    public void setUpdateTime(String updateTime) { this.updateTime = updateTime; }

    public List<String> getWarnings() { return warnings; }
    public void setWarnings(List<String> warnings) { this.warnings = warnings; }
}
