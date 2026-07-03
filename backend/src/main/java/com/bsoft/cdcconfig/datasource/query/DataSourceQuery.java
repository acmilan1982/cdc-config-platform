package com.bsoft.cdcconfig.datasource.query;

import com.bsoft.cdcconfig.common.page.PageResult;

public class DataSourceQuery {

    private String dataSourceId;
    private String dataSourceName;
    private Integer pageNum = 1;
    private Integer pageSize = 20;

    public String getDataSourceId() { return dataSourceId; }
    public void setDataSourceId(String dataSourceId) { this.dataSourceId = dataSourceId; }

    public String getDataSourceName() { return dataSourceName; }
    public void setDataSourceName(String dataSourceName) { this.dataSourceName = dataSourceName; }

    public Integer getPageNum() { return pageNum; }
    public void setPageNum(Integer pageNum) { this.pageNum = pageNum; }

    public Integer getPageSize() { return pageSize; }
    public void setPageSize(Integer pageSize) { this.pageSize = pageSize; }
}
