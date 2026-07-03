package com.bsoft.cdcconfig.datasource.exception;

import com.bsoft.cdcconfig.common.exception.BusinessException;

public final class DataSourceErrorCode {

    private DataSourceErrorCode() {
    }

    public static final int DATA_SOURCE_NOT_FOUND = 40400;
    public static final int DATA_SOURCE_ID_DUPLICATE = 40900;
    public static final int DATA_SOURCE_NAME_DUPLICATE = 40901;
    public static final int INVALID_CATEGORY = 40001;
    public static final int INVALID_TYPE = 40002;
    public static final int INVALID_NAMING_STRATEGY = 40003;
    public static final int EXTEND_REQUIRED = 40004;
    public static final int SAVE_FAILED = 50000;
    public static final int DELETE_FAILED = 50001;
    public static final int STATUS_FAILED = 50002;

    // -- factory methods --

    public static BusinessException notFound(String dataSourceId) {
        return new BusinessException(DATA_SOURCE_NOT_FOUND,
                "数据源不存在: " + dataSourceId);
    }

    public static BusinessException idDuplicate(String dataSourceId) {
        return new BusinessException(DATA_SOURCE_ID_DUPLICATE,
                "数据源ID已存在: " + dataSourceId);
    }

    public static BusinessException nameDuplicate(String name) {
        return new BusinessException(DATA_SOURCE_NAME_DUPLICATE,
                "数据源名称已存在: " + name);
    }

    public static BusinessException invalidCategory() {
        return new BusinessException(INVALID_CATEGORY,
                "数据源类别只能为SOURCE或TARGET");
    }

    public static BusinessException invalidType() {
        return new BusinessException(INVALID_TYPE,
                "数据库类型只能为ORACLE、MYSQL或DORIS");
    }

    public static BusinessException invalidNamingStrategy() {
        return new BusinessException(INVALID_NAMING_STRATEGY,
                "命名策略无效");
    }

    public static BusinessException extendRequired() {
        return new BusinessException(EXTEND_REQUIRED,
                "扩展配置不能为空");
    }
}
