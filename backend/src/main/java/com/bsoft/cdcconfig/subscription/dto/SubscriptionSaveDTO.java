package com.bsoft.cdcconfig.subscription.dto;

import java.util.List;

/**
 * 新增/编辑保存请求（API.md §4.6/§4.8）。{@code sourceSelectionMode} 为 PRESERVE /
 * REPLACE；POST 恒为 REPLACE（可选，省略按 REPLACE），PUT 必填。
 */
public class SubscriptionSaveDTO {

    private String dataSubDesc;
    private String dataFromSourceId;
    private List<String> dataToSourceIds;
    private String sourceSelectionMode;
    private List<SourceTableInput> sourceTables;

    public String getDataSubDesc() { return dataSubDesc; }
    public void setDataSubDesc(String dataSubDesc) { this.dataSubDesc = dataSubDesc; }

    public String getDataFromSourceId() { return dataFromSourceId; }
    public void setDataFromSourceId(String dataFromSourceId) { this.dataFromSourceId = dataFromSourceId; }

    public List<String> getDataToSourceIds() { return dataToSourceIds; }
    public void setDataToSourceIds(List<String> dataToSourceIds) { this.dataToSourceIds = dataToSourceIds; }

    public String getSourceSelectionMode() { return sourceSelectionMode; }
    public void setSourceSelectionMode(String sourceSelectionMode) { this.sourceSelectionMode = sourceSelectionMode; }

    public List<SourceTableInput> getSourceTables() { return sourceTables; }
    public void setSourceTables(List<SourceTableInput> sourceTables) { this.sourceTables = sourceTables; }
}
