package com.bsoft.cdcconfig.logquery.vo;

import java.util.List;

/**
 * 列表查询响应（API §6.3）。不返回 total / 页码 / pageSize。
 * hasNext=true 时返回 nextCursor（边界为第 100 条记录）。
 */
public class LogListResponse {

    private List<LogListVO> items;
    private boolean hasNext;
    private String nextCursor;

    public LogListResponse() {
    }

    public LogListResponse(List<LogListVO> items, boolean hasNext, String nextCursor) {
        this.items = items;
        this.hasNext = hasNext;
        this.nextCursor = nextCursor;
    }

    public List<LogListVO> getItems() {
        return items;
    }

    public void setItems(List<LogListVO> items) {
        this.items = items;
    }

    public boolean isHasNext() {
        return hasNext;
    }

    public void setHasNext(boolean hasNext) {
        this.hasNext = hasNext;
    }

    public String getNextCursor() {
        return nextCursor;
    }

    public void setNextCursor(String nextCursor) {
        this.nextCursor = nextCursor;
    }
}
