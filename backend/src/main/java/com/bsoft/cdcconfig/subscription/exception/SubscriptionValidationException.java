package com.bsoft.cdcconfig.subscription.exception;

import com.bsoft.cdcconfig.common.exception.BusinessException;
import com.bsoft.cdcconfig.subscription.vo.ValidationErrorVO;

import java.util.Collections;
import java.util.List;

/**
 * 批量校验失败异常（API.md §4.6）：code=40300，data 携带结构化 validationErrors。
 * 由 SubscriptionController 的本地 {@code @ExceptionHandler} 转为
 * ApiResponse&lt;ValidationErrorsVO&gt;，避免把 data 置空（GlobalExceptionHandler 对
 * BusinessException 返回 data=null）。
 */
public class SubscriptionValidationException extends BusinessException {

    private final List<ValidationErrorVO> validationErrors;

    public SubscriptionValidationException(List<ValidationErrorVO> validationErrors) {
        super(SubscriptionErrorCode.SUBSCRIPTION_VALIDATION_FAILED,
                "存在 " + validationErrors.size() + " 个校验失败项，请修正后重试");
        this.validationErrors = validationErrors == null
                ? Collections.emptyList()
                : Collections.unmodifiableList(validationErrors);
    }

    public List<ValidationErrorVO> getValidationErrors() {
        return validationErrors;
    }
}
