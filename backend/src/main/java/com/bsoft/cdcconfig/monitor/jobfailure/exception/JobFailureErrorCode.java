package com.bsoft.cdcconfig.monitor.jobfailure.exception;

import com.bsoft.cdcconfig.common.exception.BusinessException;

public final class JobFailureErrorCode {

    private JobFailureErrorCode() {}

    public static final int FAULT_ROOT_NOT_FOUND = 40401;
    public static final int CLOB_FIELD_INVALID = 40005;
    public static final int LOGICAL_JOB_NOT_FOUND = 40402;
    public static final int RECORD_NOT_IN_FAULT_PROCESS = 40006;
    public static final int ZK_STATUS_UNAVAILABLE = 50010;

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
}
