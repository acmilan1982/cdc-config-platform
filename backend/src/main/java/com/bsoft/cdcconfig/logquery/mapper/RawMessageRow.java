package com.bsoft.cdcconfig.logquery.mapper;

import java.math.BigDecimal;

/**
 * 原始消息最小字段查询结果行（DESIGN §6.7）。只读取 RAW_MESSAGE 及最小标识。
 */
public class RawMessageRow {

    private BigDecimal cdcLogId;
    private String rawMessage;

    public BigDecimal getCdcLogId() {
        return cdcLogId;
    }

    public void setCdcLogId(BigDecimal cdcLogId) {
        this.cdcLogId = cdcLogId;
    }

    public String getRawMessage() {
        return rawMessage;
    }

    public void setRawMessage(String rawMessage) {
        this.rawMessage = rawMessage;
    }
}
