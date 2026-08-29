package com.bsoft.cdcconfig.datasource.dto;

import org.springframework.util.StringUtils;

import javax.validation.ConstraintValidator;
import javax.validation.ConstraintValidatorContext;

public class RequireOriginalIdWhenNoPasswordValidator
        implements ConstraintValidator<RequireOriginalIdWhenNoPassword, TestConnectionDTO> {

    @Override
    public boolean isValid(TestConnectionDTO dto, ConstraintValidatorContext context) {
        if (dto == null) {
            return true;
        }
        boolean hasPassword = StringUtils.hasText(dto.getPassword());
        boolean hasOriginalId = StringUtils.hasText(dto.getOriginalDataSourceId());
        return hasPassword || hasOriginalId;
    }
}
