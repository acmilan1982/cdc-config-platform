package com.bsoft.cdcconfig.subscription.exception;

import com.bsoft.cdcconfig.common.exception.BusinessException;

/**
 * 数据订阅模块业务错误码（API.md §7，共 25 个）。独立于 DataSourceErrorCode /
 * ServerConfigErrorCode。单点业务错误返回对应单码；批量保存校验失败统一走
 * SubscriptionValidationException（40300 + validationErrors）。
 */
public final class SubscriptionErrorCode {

    private SubscriptionErrorCode() {
    }

    public static final int SUBSCRIPTION_VALIDATION_FAILED = 40300;
    public static final int DESC_EMPTY = 40310;
    public static final int DESC_TOO_LONG = 40311;
    public static final int SOURCE_REQUIRED = 40312;
    public static final int TARGET_REQUIRED = 40313;
    public static final int SOURCE_TABLE_REQUIRED = 40314;
    public static final int INVALID_TABLE_FORMAT = 40315;
    public static final int NAME_CONTAINS_COMMA_OR_DOT = 40316;
    public static final int DUPLICATE_TABLE_WITHIN_RECORD = 40317;
    public static final int DUPLICATE_TARGET_WITHIN_RECORD = 40318;
    public static final int SOURCE_NOT_FOUND_OR_INACTIVE = 40320;
    public static final int TARGET_NOT_FOUND_OR_INACTIVE = 40321;
    public static final int SOURCE_CATEGORY_MISMATCH = 40322;
    public static final int TARGET_CATEGORY_MISMATCH = 40323;
    public static final int TABLE_NOT_FOUND_IN_SOURCE = 40330;
    public static final int TABLE_NOT_ACCESSIBLE = 40331;
    public static final int SOURCE_CONNECTION_FAILED = 40340;
    public static final int SCHEMA_LOAD_FAILED = 40341;
    public static final int ANOMALY_NOT_EDITABLE = 40350;
    public static final int ANOMALY_NOT_DELETABLE = 40351;
    public static final int ANOMALY_NOT_VIEWABLE = 40352;
    public static final int ANOMALY_NOT_PREVIEWABLE = 40353;
    public static final int SUBSCRIPTION_NOT_FOUND = 40430;
    public static final int SAVE_FAILED = 50040;
    public static final int DELETE_FAILED = 50041;

    // -- factory methods --

    public static BusinessException validationFailed(int count) {
        return new BusinessException(SUBSCRIPTION_VALIDATION_FAILED,
                "存在 " + count + " 个校验失败项，请修正后重试");
    }

    public static BusinessException descEmpty() {
        return new BusinessException(DESC_EMPTY, "订阅描述不能为空");
    }

    public static BusinessException descTooLong() {
        return new BusinessException(DESC_TOO_LONG, "订阅描述超过 255 字符上限");
    }

    public static BusinessException sourceRequired() {
        return new BusinessException(SOURCE_REQUIRED, "必须且只能选择一个源库");
    }

    public static BusinessException targetRequired() {
        return new BusinessException(TARGET_REQUIRED, "必须至少选择一个目标库");
    }

    public static BusinessException sourceTableRequired() {
        return new BusinessException(SOURCE_TABLE_REQUIRED, "必须至少选择一张源表");
    }

    public static BusinessException invalidTableFormat() {
        return new BusinessException(INVALID_TABLE_FORMAT, "源表输入结构或 Schema/表名格式非法");
    }

    public static BusinessException nameContainsCommaOrDot() {
        return new BusinessException(NAME_CONTAINS_COMMA_OR_DOT,
                "数据源ID、Schema名或表名不能包含英文逗号或组件内部英文句点");
    }

    public static BusinessException duplicateTableWithinRecord() {
        return new BusinessException(DUPLICATE_TABLE_WITHIN_RECORD, "记录内存在重复源表");
    }

    public static BusinessException duplicateTargetWithinRecord() {
        return new BusinessException(DUPLICATE_TARGET_WITHIN_RECORD, "记录内存在重复目标库");
    }

    public static BusinessException sourceNotFoundOrInactive() {
        return new BusinessException(SOURCE_NOT_FOUND_OR_INACTIVE, "源库不存在或已停用");
    }

    public static BusinessException targetNotFoundOrInactive() {
        return new BusinessException(TARGET_NOT_FOUND_OR_INACTIVE, "目标库不存在或已停用");
    }

    public static BusinessException sourceCategoryMismatch() {
        return new BusinessException(SOURCE_CATEGORY_MISMATCH, "源库类别不正确");
    }

    public static BusinessException targetCategoryMismatch() {
        return new BusinessException(TARGET_CATEGORY_MISMATCH, "目标库类别不正确");
    }

    public static BusinessException tableNotFoundInSource() {
        return new BusinessException(TABLE_NOT_FOUND_IN_SOURCE, "源表中存在当前源库不存在的表");
    }

    public static BusinessException tableNotAccessible() {
        return new BusinessException(TABLE_NOT_ACCESSIBLE, "源表中存在当前账号不可访问的表");
    }

    public static BusinessException sourceConnectionFailed(String classified) {
        return new BusinessException(SOURCE_CONNECTION_FAILED, "源库连接失败：" + classified);
    }

    public static BusinessException schemaLoadFailed(String classified) {
        return new BusinessException(SCHEMA_LOAD_FAILED, "Schema/表加载失败：" + classified);
    }

    public static BusinessException anomalyNotEditable() {
        return new BusinessException(ANOMALY_NOT_EDITABLE, "多源库异常记录不支持编辑");
    }

    public static BusinessException anomalyNotDeletable() {
        return new BusinessException(ANOMALY_NOT_DELETABLE, "多源库异常记录不支持删除");
    }

    public static BusinessException anomalyNotViewable() {
        return new BusinessException(ANOMALY_NOT_VIEWABLE, "多源库异常记录不支持查看");
    }

    public static BusinessException anomalyNotPreviewable() {
        return new BusinessException(ANOMALY_NOT_PREVIEWABLE, "多源库异常记录不支持删除预览");
    }

    public static BusinessException subscriptionNotFound() {
        return new BusinessException(SUBSCRIPTION_NOT_FOUND, "订阅记录不存在或已被删除");
    }

    public static BusinessException saveFailed() {
        return new BusinessException(SAVE_FAILED, "保存失败");
    }

    public static BusinessException deleteFailed() {
        return new BusinessException(DELETE_FAILED, "删除失败");
    }
}
