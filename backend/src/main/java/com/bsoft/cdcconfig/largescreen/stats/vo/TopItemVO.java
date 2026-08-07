package com.bsoft.cdcconfig.largescreen.stats.vo;

/**
 * 单个 Top 榜单条目：rank、稳定标识、展示名称、成功/错误/总量。
 * 总量 = 成功数 + 错误数。
 */
public class TopItemVO {

    private Integer rank;
    private String key;
    private String name;
    private Long successCount;
    private Long errorCount;
    private Long totalCount;

    public Integer getRank() { return rank; }
    public void setRank(Integer v) { this.rank = v; }
    public String getKey() { return key; }
    public void setKey(String v) { this.key = v; }
    public String getName() { return name; }
    public void setName(String v) { this.name = v; }
    public Long getSuccessCount() { return successCount; }
    public void setSuccessCount(Long v) { this.successCount = v; }
    public Long getErrorCount() { return errorCount; }
    public void setErrorCount(Long v) { this.errorCount = v; }
    public Long getTotalCount() { return totalCount; }
    public void setTotalCount(Long v) { this.totalCount = v; }
}
