package com.bsoft.cdcconfig.logquery.vo;

/**
 * 原始消息响应（API §9.2、LQ-API-78）。rawMessage 可为空字符串；
 * 内容原样返回，不修改、不格式化。
 */
public class RawMessageVO {

    private String cdcLogId;
    private String rawMessage;

    public String getCdcLogId() {
        return cdcLogId;
    }

    public void setCdcLogId(String cdcLogId) {
        this.cdcLogId = cdcLogId;
    }

    public String getRawMessage() {
        return rawMessage;
    }

    public void setRawMessage(String rawMessage) {
        this.rawMessage = rawMessage;
    }
}
