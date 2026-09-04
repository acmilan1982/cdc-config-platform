package com.bsoft.cdcconfig.clientconfig.exception;

import com.bsoft.cdcconfig.common.exception.BusinessException;

import java.util.List;

/**
 * 探针端管理错误码（API.md §9）。业务失败均以 HTTP 200 + 业务 code 返回。
 * 并发口径已删除显式表锁/锁等待路径，本 Feature 不含相关映射。
 */
public final class ClientConfigErrorCode {

    private ClientConfigErrorCode() {
    }

    public static final int CLIENT_ID_REQUIRED = 40100;
    public static final int INVALID_CLIENT_ID = 40101;
    public static final int INVALID_CLIENT_DESC = 40102;
    public static final int DATA_SOURCE_REQUIRED = 40103;
    public static final int INVALID_DATA_SOURCE_ID = 40104;
    public static final int DATA_SOURCE_IDS_TOO_LONG = 40105;
    public static final int ILLEGAL_CLIENT_STATE = 40240;
    public static final int CLIENT_NOT_FOUND = 40440;
    public static final int DATA_SOURCE_UNAVAILABLE = 40441;
    public static final int CLIENT_ID_CONFLICT = 40940;
    public static final int DATA_SOURCE_OCCUPIED = 40941;
    public static final int ANOMALOUS_SELECTION_BLOCKED = 40942;
    public static final int SAVE_FAILED = 50051;
    public static final int DELETE_FAILED = 50052;

    // -- factory methods --

    public static BusinessException clientIdRequired() {
        return new BusinessException(CLIENT_ID_REQUIRED, "探针 ID 不能为空。");
    }

    public static BusinessException invalidClientId() {
        return new BusinessException(INVALID_CLIENT_ID,
                "探针 ID 格式不正确：须为 1~32 位字母、数字、点、下划线或连字符，且以字母或数字开头。");
    }

    public static BusinessException invalidClientDesc() {
        return new BusinessException(INVALID_CLIENT_DESC,
                "探针描述不能为空，或去除首尾空白后的原文超过 1024 字节（UTF-8）。");
    }

    public static BusinessException dataSourceRequired() {
        return new BusinessException(DATA_SOURCE_REQUIRED, "采集数据源不能为空，至少选择 1 个数据源。");
    }

    public static BusinessException invalidDataSourceId() {
        return new BusinessException(INVALID_DATA_SOURCE_ID, "数据源 ID 含英文逗号，不可选择。");
    }

    public static BusinessException dataSourceIdsTooLong() {
        return new BusinessException(DATA_SOURCE_IDS_TOO_LONG,
                "数据源序列化结果超过 1000 字节（UTF-8），请减少选择。");
    }

    public static BusinessException illegalClientState() {
        return new BusinessException(ILLEGAL_CLIENT_STATE, "探针当前状态不允许该操作。");
    }

    public static BusinessException clientNotFound() {
        return new BusinessException(CLIENT_NOT_FOUND, "探针不存在或已被删除。");
    }

    /**
     * 数据源不存在/停用/类别或类型不符。reason 取自：不存在 / 已停用 / 类别非 SOURCE / 类型非 ORACLE。
     */
    public static BusinessException dataSourceUnavailable(String dataSourceId, String reason) {
        return new BusinessException(DATA_SOURCE_UNAVAILABLE,
                "数据源（" + dataSourceId + "）：" + reason);
    }

    public static BusinessException clientIdConflict() {
        return new BusinessException(CLIENT_ID_CONFLICT,
                "探针 ID 已存在冲突（不区分大小写），请更换探针 ID。");
    }

    /** org 为空时使用省略机构名称的形态。conflictClientIds 需为有序、完整冲突探针 ID 列表。 */
    public static BusinessException dataSourceOccupied(String org, String dataSourceId,
                                                       List<String> conflictClientIds) {
        String owner = String.join("、", conflictClientIds);
        if (org != null && !org.trim().isEmpty()) {
            return new BusinessException(DATA_SOURCE_OCCUPIED,
                    "数据源“" + org.trim() + "（" + dataSourceId + "）”已分配给探针："
                            + owner + "，不能重复分配。");
        }
        return new BusinessException(DATA_SOURCE_OCCUPIED,
                "数据源（" + dataSourceId + "）已分配给探针：" + owner + "，不能重复分配。");
    }

    public static BusinessException saveFailed() {
        return new BusinessException(SAVE_FAILED, "保存失败，请稍后重试。");
    }

    public static BusinessException deleteFailed() {
        return new BusinessException(DELETE_FAILED, "删除失败，请稍后重试。");
    }
}
