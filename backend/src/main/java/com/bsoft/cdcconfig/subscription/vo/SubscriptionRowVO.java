package com.bsoft.cdcconfig.subscription.vo;

import java.util.List;

/**
 * 列表行（API.md §4.2）。anomalyMultiSource 为多源库异常标志（异常记录 source=null，
 * 整行警示且无操作）。updateTime / insertTime 为 ISO-8601 字符串（Asia/Shanghai）。
 */
public class SubscriptionRowVO {

    private String dataSubId;
    private String dataSubDesc;
    private boolean anomalyMultiSource;
    private SourceRefVO source;
    private int sourceTableCount;
    private List<SchemaTableGroup> tablesBySchema;
    private List<String> rawUnparseableTables;
    private List<TargetRefVO> targets;
    private String updateTime;
    private String insertTime;

    public String getDataSubId() { return dataSubId; }
    public void setDataSubId(String dataSubId) { this.dataSubId = dataSubId; }

    public String getDataSubDesc() { return dataSubDesc; }
    public void setDataSubDesc(String dataSubDesc) { this.dataSubDesc = dataSubDesc; }

    public boolean isAnomalyMultiSource() { return anomalyMultiSource; }
    public void setAnomalyMultiSource(boolean anomalyMultiSource) { this.anomalyMultiSource = anomalyMultiSource; }

    public SourceRefVO getSource() { return source; }
    public void setSource(SourceRefVO source) { this.source = source; }

    public int getSourceTableCount() { return sourceTableCount; }
    public void setSourceTableCount(int sourceTableCount) { this.sourceTableCount = sourceTableCount; }

    public List<SchemaTableGroup> getTablesBySchema() { return tablesBySchema; }
    public void setTablesBySchema(List<SchemaTableGroup> tablesBySchema) { this.tablesBySchema = tablesBySchema; }

    public List<String> getRawUnparseableTables() { return rawUnparseableTables; }
    public void setRawUnparseableTables(List<String> rawUnparseableTables) { this.rawUnparseableTables = rawUnparseableTables; }

    public List<TargetRefVO> getTargets() { return targets; }
    public void setTargets(List<TargetRefVO> targets) { this.targets = targets; }

    public String getUpdateTime() { return updateTime; }
    public void setUpdateTime(String updateTime) { this.updateTime = updateTime; }

    public String getInsertTime() { return insertTime; }
    public void setInsertTime(String insertTime) { this.insertTime = insertTime; }
}
