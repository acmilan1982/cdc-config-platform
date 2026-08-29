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
    public static final int INVALID_TARGET_DATA_SOURCE = 40005;
    public static final int ROLE_NOT_APPLICABLE = 40006;
    public static final int NAMING_STRATEGY_NOT_FOUND = 40401;
    public static final int NAMING_STRATEGY_DUPLICATE = 40902;
    public static final int NAMING_STRATEGY_MULTI_CONFLICT = 40903;
    public static final int SAVE_FAILED = 50000;
    public static final int DELETE_FAILED = 50001;

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

    public static BusinessException invalidTargetDataSource() {
        return new BusinessException(INVALID_TARGET_DATA_SOURCE,
                "目标库无效或已停用");
    }

    public static BusinessException roleNotApplicable() {
        return new BusinessException(ROLE_NOT_APPLICABLE,
                "数据源角色不适用于当前操作");
    }

    public static BusinessException namingStrategyNotFound() {
        return new BusinessException(NAMING_STRATEGY_NOT_FOUND,
                "命名策略不存在");
    }

    public static BusinessException namingStrategyDuplicate() {
        return new BusinessException(NAMING_STRATEGY_DUPLICATE,
                "该源库到该目标库的命名策略已存在");
    }

    public static BusinessException namingStrategyMultiConflict() {
        return new BusinessException(NAMING_STRATEGY_MULTI_CONFLICT,
                "检测到重复命名策略数据，保存被阻止");
    }

    public static BusinessException saveFailed() {
        return new BusinessException(SAVE_FAILED, "保存失败");
    }

    public static BusinessException deleteFailed() {
        return new BusinessException(DELETE_FAILED, "删除失败");
    }
}
