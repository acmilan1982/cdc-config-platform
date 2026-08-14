package com.bsoft.cdcconfig.monitor.jobfailure.service.impl;

import org.junit.jupiter.api.Test;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertNull;

class JobFailurePreciseIdTest {

    @Test
    void idText_shouldPreserveSnowflakePrecision() {
        assertEquals("341473352776552448", JobFailureServiceImpl.idText(341473352776552448L));
    }

    @Test
    void idText_shouldReturnNullForNull() {
        assertNull(JobFailureServiceImpl.idText(null));
    }
}
