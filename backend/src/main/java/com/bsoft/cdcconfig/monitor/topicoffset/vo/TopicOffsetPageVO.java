package com.bsoft.cdcconfig.monitor.topicoffset.vo;

import java.util.List;

/**
 * /offsets 分页响应 data（API.md §4.1）：在 PageResult 语义上扩展 unparseableTotal。
 * total/pages/unparseableTotal 均基于过滤后全集；pageSize 恒为 150。
 */
public class TopicOffsetPageVO {

    private long pageNum;
    private long pageSize;
    private long total;
    private long pages;
    private long unparseableTotal;
    private List<TopicOffsetItemVO> records;

    public long getPageNum() {
        return pageNum;
    }

    public void setPageNum(long pageNum) {
        this.pageNum = pageNum;
    }

    public long getPageSize() {
        return pageSize;
    }

    public void setPageSize(long pageSize) {
        this.pageSize = pageSize;
    }

    public long getTotal() {
        return total;
    }

    public void setTotal(long total) {
        this.total = total;
    }

    public long getPages() {
        return pages;
    }

    public void setPages(long pages) {
        this.pages = pages;
    }

    public long getUnparseableTotal() {
        return unparseableTotal;
    }

    public void setUnparseableTotal(long unparseableTotal) {
        this.unparseableTotal = unparseableTotal;
    }

    public List<TopicOffsetItemVO> getRecords() {
        return records;
    }

    public void setRecords(List<TopicOffsetItemVO> records) {
        this.records = records;
    }
}
