package com.bsoft.cdcconfig.logquery.vo;

import java.util.List;

/**
 * 数据源候选响应（API §5.2）：一次返回 source + target 两份列表。
 */
public class DataSourceOptionsVO {

    private List<DataSourceOptionVO> sourceList;
    private List<DataSourceOptionVO> targetList;

    public List<DataSourceOptionVO> getSourceList() {
        return sourceList;
    }

    public void setSourceList(List<DataSourceOptionVO> sourceList) {
        this.sourceList = sourceList;
    }

    public List<DataSourceOptionVO> getTargetList() {
        return targetList;
    }

    public void setTargetList(List<DataSourceOptionVO> targetList) {
        this.targetList = targetList;
    }
}
