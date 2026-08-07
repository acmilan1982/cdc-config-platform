package com.bsoft.cdcconfig.largescreen.stats.vo;

import java.util.List;

/**
 * 三类 Top 榜单：源库同步量、目标库同步量、同步表同步量。
 * 每类最多 10 条，按累计同步量降序，不足 10 条按实际数量返回。
 */
public class Top10VO {

    private List<TopItemVO> sourceDatabases;
    private List<TopItemVO> targetDatabases;
    private List<TopItemVO> tables;

    public List<TopItemVO> getSourceDatabases() { return sourceDatabases; }
    public void setSourceDatabases(List<TopItemVO> v) { this.sourceDatabases = v; }
    public List<TopItemVO> getTargetDatabases() { return targetDatabases; }
    public void setTargetDatabases(List<TopItemVO> v) { this.targetDatabases = v; }
    public List<TopItemVO> getTables() { return tables; }
    public void setTables(List<TopItemVO> v) { this.tables = v; }
}
