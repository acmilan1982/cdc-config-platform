package com.bsoft.cdcconfig.subscription.vo;

import java.util.List;

/**
 * 40300 批量校验失败响应的 data 载体（API.md §4.6）。
 */
public class ValidationErrorsVO {

    private List<ValidationErrorVO> validationErrors;

    public ValidationErrorsVO() {
    }

    public ValidationErrorsVO(List<ValidationErrorVO> validationErrors) {
        this.validationErrors = validationErrors;
    }

    public List<ValidationErrorVO> getValidationErrors() { return validationErrors; }
    public void setValidationErrors(List<ValidationErrorVO> validationErrors) { this.validationErrors = validationErrors; }
}
