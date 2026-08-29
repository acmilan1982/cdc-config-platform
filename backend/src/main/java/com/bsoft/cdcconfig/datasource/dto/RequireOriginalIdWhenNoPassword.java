package com.bsoft.cdcconfig.datasource.dto;

import javax.validation.Constraint;
import javax.validation.Payload;
import java.lang.annotation.Documented;
import java.lang.annotation.Retention;
import java.lang.annotation.Target;

import static java.lang.annotation.ElementType.TYPE;
import static java.lang.annotation.RetentionPolicy.RUNTIME;

/**
 * 连接测试跨字段校验：未提供 password 时必须提供 originalDataSourceId。
 * 违反时按参数校验错误返回（HTTP 400 / code=400），不得使用业务码 40002。
 */
@Documented
@Target({TYPE})
@Retention(RUNTIME)
@Constraint(validatedBy = RequireOriginalIdWhenNoPasswordValidator.class)
public @interface RequireOriginalIdWhenNoPassword {

    String message() default "未填写密码时必须提供原数据源ID";

    Class<?>[] groups() default {};

    Class<? extends Payload>[] payload() default {};
}
