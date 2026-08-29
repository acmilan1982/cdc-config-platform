package com.bsoft.cdcconfig.datasource.vo;

public class TestConnectionResultVO {

    private Boolean success;
    private String message;

    public TestConnectionResultVO() {
    }

    public TestConnectionResultVO(Boolean success, String message) {
        this.success = success;
        this.message = message;
    }

    public Boolean getSuccess() { return success; }
    public void setSuccess(Boolean success) { this.success = success; }

    public String getMessage() { return message; }
    public void setMessage(String message) { this.message = message; }
}
