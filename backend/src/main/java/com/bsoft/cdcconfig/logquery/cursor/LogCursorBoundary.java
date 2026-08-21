package com.bsoft.cdcconfig.logquery.cursor;

import java.math.BigDecimal;
import java.time.LocalDateTime;

/**
 * 游标解码后的 keyset 边界：TARGET_TIME + CDC_LOG_ID（LQ-DESIGN-62 / 63）。
 */
public class LogCursorBoundary {

    private final LocalDateTime targetTime;
    private final BigDecimal cdcLogId;

    public LogCursorBoundary(LocalDateTime targetTime, BigDecimal cdcLogId) {
        this.targetTime = targetTime;
        this.cdcLogId = cdcLogId;
    }

    public LocalDateTime getTargetTime() {
        return targetTime;
    }

    public BigDecimal getCdcLogId() {
        return cdcLogId;
    }
}
