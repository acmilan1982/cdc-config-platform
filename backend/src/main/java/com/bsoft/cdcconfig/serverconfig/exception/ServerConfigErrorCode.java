package com.bsoft.cdcconfig.serverconfig.exception;

import com.bsoft.cdcconfig.common.exception.BusinessException;

/**
 * 中心端配置错误码常量与 BusinessException 静态工厂（API.md §7，共 15 个专用错误码）。
 * 风格同 DataSourceErrorCode / LogQueryErrorCode / JobFailureErrorCode。
 */
public final class ServerConfigErrorCode {

    private ServerConfigErrorCode() {
    }

    public static final int SERVER_NOT_REGISTERED = 40210;
    public static final int SERVER_MULTIPLE_FOUND = 40211;
    public static final int BATCH_EMPTY = 40220;
    public static final int ITEM_COUNT_EXCEEDED = 40221;
    public static final int DUPLICATE_ID = 40222;
    public static final int ID_INVALID = 40223;
    public static final int VALUE_EMPTY = 40224;
    public static final int VALUE_LENGTH_EXCEEDED = 40225;
    public static final int VALUE_FORMAT_INVALID = 40226;
    public static final int REQUEST_FIELD_NOT_ALLOWED = 40227;
    public static final int CONFIG_RECORD_NOT_FOUND = 40420;
    public static final int CONFIG_NOT_EDITABLE = 40421;
    public static final int CONFIG_KEY_NOT_SUPPORTED = 40422;
    public static final int SERVER_BELONGING_MISMATCH = 40423;
    public static final int SAVE_FAILED = 50030;

    public static BusinessException serverNotRegistered() {
        return new BusinessException(SERVER_NOT_REGISTERED,
                "中心端尚未注册，请先启动 sync-server");
    }

    public static BusinessException serverMultipleFound() {
        return new BusinessException(SERVER_MULTIPLE_FOUND,
                "检测到多个中心端，当前功能仅支持唯一中心端");
    }

    public static BusinessException batchEmpty() {
        return new BusinessException(BATCH_EMPTY, "批量保存请求不能为空");
    }

    public static BusinessException itemCountExceeded() {
        return new BusinessException(ITEM_COUNT_EXCEEDED, "批量保存记录数超过上限 200");
    }

    public static BusinessException duplicateId() {
        return new BusinessException(DUPLICATE_ID, "批量请求包含重复主键");
    }

    public static BusinessException idInvalid() {
        return new BusinessException(ID_INVALID, "配置记录主键为空或格式非法");
    }

    public static BusinessException valueEmpty() {
        return new BusinessException(VALUE_EMPTY, "配置值为空");
    }

    public static BusinessException valueLengthExceeded() {
        return new BusinessException(VALUE_LENGTH_EXCEEDED, "配置值超过 64 字符上限");
    }

    public static BusinessException valueFormatInvalid() {
        return new BusinessException(VALUE_FORMAT_INVALID, "配置值不符合该配置项的专门规则");
    }

    public static BusinessException requestFieldNotAllowed() {
        return new BusinessException(REQUEST_FIELD_NOT_ALLOWED, "批量保存请求包含不允许的字段");
    }

    public static BusinessException configRecordNotFound() {
        return new BusinessException(CONFIG_RECORD_NOT_FOUND, "配置记录不存在");
    }

    public static BusinessException configNotEditable() {
        return new BusinessException(CONFIG_NOT_EDITABLE, "配置项不可编辑");
    }

    public static BusinessException configKeyNotSupported() {
        return new BusinessException(CONFIG_KEY_NOT_SUPPORTED, "配置Key不受支持");
    }

    public static BusinessException serverBelongingMismatch() {
        return new BusinessException(SERVER_BELONGING_MISMATCH, "配置记录不属于唯一中心端");
    }

    public static BusinessException saveFailed() {
        return new BusinessException(SAVE_FAILED, "保存失败，请稍后重试");
    }
}
