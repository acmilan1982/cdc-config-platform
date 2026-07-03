package com.bsoft.cdcconfig.common.api;

import com.bsoft.cdcconfig.common.exception.BusinessException;
import org.junit.jupiter.api.Test;

import java.util.List;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertNotNull;
import static org.junit.jupiter.api.Assertions.assertNull;
import static org.junit.jupiter.api.Assertions.assertTrue;

class ApiResponseTest {

    @Test
    void successWithoutData() {
        ApiResponse<Void> response = ApiResponse.success();
        assertEquals(200, response.getCode());
        assertEquals("success", response.getMessage());
        assertNull(response.getData());
        assertNotNull(response.getTimestamp());
    }

    @Test
    void successWithData() {
        List<String> data = java.util.Arrays.asList("a", "b");
        ApiResponse<List<String>> response = ApiResponse.success(data);
        assertEquals(200, response.getCode());
        assertEquals("success", response.getMessage());
        assertEquals(data, response.getData());
    }

    @Test
    void fail() {
        ApiResponse<Void> response = ApiResponse.fail(404, "not found");
        assertEquals(404, response.getCode());
        assertEquals("not found", response.getMessage());
        assertNull(response.getData());
        assertNotNull(response.getTimestamp());
    }

    @Test
    void businessExceptionHasCodeAndMessage() {
        BusinessException e = new BusinessException(1001, "业务错误");
        assertEquals(1001, e.getCode());
        assertEquals("业务错误", e.getMessage());
    }

    @Test
    void businessExceptionDefaultCode() {
        BusinessException e = new BusinessException("默认错误");
        assertEquals(500, e.getCode());
    }
}
