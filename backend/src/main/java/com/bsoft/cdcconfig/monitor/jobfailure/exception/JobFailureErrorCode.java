package com.bsoft.cdcconfig.monitor.jobfailure.exception;

import com.bsoft.cdcconfig.common.exception.BusinessException;

public final class JobFailureErrorCode {

    private JobFailureErrorCode() {}

    public static final int FAULT_ROOT_NOT_FOUND = 40401;
    public static final int CLOB_FIELD_INVALID = 40005;
    public static final int LOGICAL_JOB_NOT_FOUND = 40402;
    public static final int RECORD_NOT_IN_FAULT_PROCESS = 40006;
    public static final int ZK_STATUS_UNAVAILABLE = 50010;
    public static final int HISTORY_DATA_SOURCE_NOT_IN_CURRENT_CONFIG = 40403;
    public static final int HISTORY_RANGE_INVALID = 40007;
    public static final int HISTORY_PAGE_INVALID = 40008;
    public static final int HISTORY_PAGE_SIZE_INVALID = 40009;

    public static BusinessException faultRootNotFound(Long faultRootId) {
        return new BusinessException(FAULT_ROOT_NOT_FOUND,
                "故障过程不存在或已被排除: faultRootId=" + faultRootId);
    }

    public static BusinessException clobFieldInvalid(String clobField) {
        return new BusinessException(CLOB_FIELD_INVALID,
                "无效的CLOB字段类型: " + clobField);
    }

    public static BusinessException logicalJobNotFound(String clientId, String dataSourceId) {
        return new BusinessException(LOGICAL_JOB_NOT_FOUND,
                "未找到该逻辑Job的失败记录: clientId=" + clientId + ", dataSourceId=" + dataSourceId);
    }

    public static BusinessException recordNotInFaultProcess(Long recordId, Long faultRootId) {
        return new BusinessException(RECORD_NOT_IN_FAULT_PROCESS,
                "记录不属于指定故障过程: recordId=" + recordId + ", faultRootId=" + faultRootId);
    }

    public static BusinessException zkStatusUnavailable() {
        return new BusinessException(ZK_STATUS_UNAVAILABLE, "ZooKeeper 连接失败，将在 60 秒重试");
    }

    public static BusinessException historyDataSourceNotInCurrentConfig(String clientId, String dataSourceId) {
        return new BusinessException(HISTORY_DATA_SOURCE_NOT_IN_CURRENT_CONFIG,
                "当前配置中不存在该数据源: clientId=" + clientId + ", dataSourceId=" + dataSourceId);
    }

    public static BusinessException historyRangeInvalid(String range) {
        return new BusinessException(HISTORY_RANGE_INVALID,
                "无效的时间范围: " + range + "（仅支持 TODAY / LAST_7_DAYS / LAST_30_DAYS）");
    }

    public static BusinessException historyPageInvalid(int page) {
        return new BusinessException(HISTORY_PAGE_INVALID, "无效的页码: " + page + "（page 必须 >= 1）");
    }

    public static BusinessException historyPageSizeInvalid(int pageSize) {
        return new BusinessException(HISTORY_PAGE_SIZE_INVALID,
                "无效的每页条数: " + pageSize + "（仅支持 20 / 50 / 100）");
    }
}
