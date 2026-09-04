package com.bsoft.cdcconfig.clientconfig.model.vo;

import java.util.ArrayList;
import java.util.List;

/**
 * E1 列表行（CCFG-API-005）：clientDesc/rawDataSourceIds 允许 null（历史值）；
 * dataSources 恒按规范化去重后的原存储顺序返回，前端不得原地改序。
 */
public class ClientListItemVO {

    private String clientId;

    private String clientDesc;

    private String status;

    private String fgActive;

    private int dataSourceCount;

    private String rawDataSourceIds;

    private List<String> possibleCommaDataSourceIds = new ArrayList<>();

    private List<String> rowAnomalies = new ArrayList<>();

    private List<DataSourceViewItemVO> dataSources = new ArrayList<>();

    public String getClientId() {
        return clientId;
    }

    public void setClientId(String clientId) {
        this.clientId = clientId;
    }

    public String getClientDesc() {
        return clientDesc;
    }

    public void setClientDesc(String clientDesc) {
        this.clientDesc = clientDesc;
    }

    public String getStatus() {
        return status;
    }

    public void setStatus(String status) {
        this.status = status;
    }

    public String getFgActive() {
        return fgActive;
    }

    public void setFgActive(String fgActive) {
        this.fgActive = fgActive;
    }

    public int getDataSourceCount() {
        return dataSourceCount;
    }

    public void setDataSourceCount(int dataSourceCount) {
        this.dataSourceCount = dataSourceCount;
    }

    public String getRawDataSourceIds() {
        return rawDataSourceIds;
    }

    public void setRawDataSourceIds(String rawDataSourceIds) {
        this.rawDataSourceIds = rawDataSourceIds;
    }

    public List<String> getPossibleCommaDataSourceIds() {
        return possibleCommaDataSourceIds;
    }

    public void setPossibleCommaDataSourceIds(List<String> possibleCommaDataSourceIds) {
        this.possibleCommaDataSourceIds = possibleCommaDataSourceIds;
    }

    public List<String> getRowAnomalies() {
        return rowAnomalies;
    }

    public void setRowAnomalies(List<String> rowAnomalies) {
        this.rowAnomalies = rowAnomalies;
    }

    public List<DataSourceViewItemVO> getDataSources() {
        return dataSources;
    }

    public void setDataSources(List<DataSourceViewItemVO> dataSources) {
        this.dataSources = dataSources;
    }
}
