package com.bsoft.cdcconfig.subscription.vo;

import java.util.List;

/**
 * 编辑打开回显（API.md §4.7）。sourceReachable 为源 Oracle 是否可达（best-effort）；
 * sourceTableCheck 为 CHECKED / UNREACHABLE / SKIPPED；invalidTables 为原选择中已删除
 * 或不可访问的表。不返回版本令牌或指纹。
 */
public class SubscriptionEditOpenVO {

    private String dataSubId;
    private String dataSubDesc;
    private SourceRefVO source;
    private List<TargetRefVO> targets;
    private List<SchemaTableGroup> tablesBySchema;
    private List<String> rawUnparseableTables;
    private boolean sourceReachable;
    private String sourceTableCheck;
    private List<String> invalidTables;

    public String getDataSubId() { return dataSubId; }
    public void setDataSubId(String dataSubId) { this.dataSubId = dataSubId; }

    public String getDataSubDesc() { return dataSubDesc; }
    public void setDataSubDesc(String dataSubDesc) { this.dataSubDesc = dataSubDesc; }

    public SourceRefVO getSource() { return source; }
    public void setSource(SourceRefVO source) { this.source = source; }

    public List<TargetRefVO> getTargets() { return targets; }
    public void setTargets(List<TargetRefVO> targets) { this.targets = targets; }

    public List<SchemaTableGroup> getTablesBySchema() { return tablesBySchema; }
    public void setTablesBySchema(List<SchemaTableGroup> tablesBySchema) { this.tablesBySchema = tablesBySchema; }

    public List<String> getRawUnparseableTables() { return rawUnparseableTables; }
    public void setRawUnparseableTables(List<String> rawUnparseableTables) { this.rawUnparseableTables = rawUnparseableTables; }

    public boolean isSourceReachable() { return sourceReachable; }
    public void setSourceReachable(boolean sourceReachable) { this.sourceReachable = sourceReachable; }

    public String getSourceTableCheck() { return sourceTableCheck; }
    public void setSourceTableCheck(String sourceTableCheck) { this.sourceTableCheck = sourceTableCheck; }

    public List<String> getInvalidTables() { return invalidTables; }
    public void setInvalidTables(List<String> invalidTables) { this.invalidTables = invalidTables; }
}
