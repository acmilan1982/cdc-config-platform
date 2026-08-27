package com.bsoft.cdcconfig.serverconfig.validator;

import com.bsoft.cdcconfig.common.exception.BusinessException;
import com.bsoft.cdcconfig.serverconfig.exception.ServerConfigErrorCode;
import org.junit.jupiter.api.Test;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertThrows;

class ServerConfigValueValidatorTest {

    // ---- boolean：auto-create-table / auto-expand-column-length ----

    @Test
    void booleanKey_validValues_normalized() {
        assertEquals("true", ServerConfigValueValidator.validateAndNormalize("auto-create-table", "true"));
        assertEquals("false", ServerConfigValueValidator.validateAndNormalize("auto-create-table", "false"));
        assertEquals("true", ServerConfigValueValidator.validateAndNormalize("auto-expand-column-length", " true "));
    }

    @Test
    void booleanKey_invalidValues_rejected() {
        assertValueFormatInvalid("auto-create-table", "TRUE");
        assertValueFormatInvalid("auto-create-table", "False");
        assertValueFormatInvalid("auto-create-table", "1");
        assertValueFormatInvalid("auto-create-table", "0");
        assertValueFormatInvalid("auto-create-table", "yes");
        assertValueFormatInvalid("auto-expand-column-length", "TRue");
    }

    // ---- raw-message-storage-strategy ----

    @Test
    void rawMessageStrategy_validValues_normalized() {
        assertEquals("NONE", ServerConfigValueValidator.validateAndNormalize("raw-message-storage-strategy", "NONE"));
        assertEquals("PLAIN", ServerConfigValueValidator.validateAndNormalize("raw-message-storage-strategy", "PLAIN"));
        assertEquals("COMPRESS", ServerConfigValueValidator.validateAndNormalize("raw-message-storage-strategy", "COMPRESS"));
    }

    @Test
    void rawMessageStrategy_invalidValues_rejected() {
        assertValueFormatInvalid("raw-message-storage-strategy", "none");
        assertValueFormatInvalid("raw-message-storage-strategy", "Plain");
        assertValueFormatInvalid("raw-message-storage-strategy", "X");
    }

    // ---- realtime-insert-batch-enabled-database-types ----

    @Test
    void dbTypes_normalizesToFixedOrderAndDedupe() {
        assertEquals("doris,mysql", ServerConfigValueValidator.validateAndNormalize(
                "realtime-insert-batch-enabled-database-types", "doris,mysql"));
        assertEquals("doris,mysql", ServerConfigValueValidator.validateAndNormalize(
                "realtime-insert-batch-enabled-database-types", "mysql,doris"));
        assertEquals("doris,mysql", ServerConfigValueValidator.validateAndNormalize(
                "realtime-insert-batch-enabled-database-types", "doris, MYSQL ,doris"));
        assertEquals("oracle", ServerConfigValueValidator.validateAndNormalize(
                "realtime-insert-batch-enabled-database-types", " ORACLE "));
        assertEquals("doris,oracle,mysql", ServerConfigValueValidator.validateAndNormalize(
                "realtime-insert-batch-enabled-database-types", "doris,oracle,mysql"));
    }

    @Test
    void dbTypes_invalidOrEmpty_rejected() {
        assertValueFormatInvalid("realtime-insert-batch-enabled-database-types", "postgres");
        assertValueFormatInvalid("realtime-insert-batch-enabled-database-types", "doris,postgres");
        assertValueFormatInvalid("realtime-insert-batch-enabled-database-types", "doris,,");
    }

    @Test
    void dbTypes_emptyValue_rejectedAsValueEmpty() {
        assertValueEmpty("realtime-insert-batch-enabled-database-types", "");
    }

    // ---- snapshotBatchSize ----

    @Test
    void snapshotBatchSize_validValues_normalized() {
        assertEquals("100", ServerConfigValueValidator.validateAndNormalize("snapshotBatchSize", "100"));
        assertEquals("10000", ServerConfigValueValidator.validateAndNormalize("snapshotBatchSize", "10000"));
        assertEquals("1000", ServerConfigValueValidator.validateAndNormalize("snapshotBatchSize", "1000"));
        assertEquals("100", ServerConfigValueValidator.validateAndNormalize("snapshotBatchSize", "0100"));
        assertEquals("1000", ServerConfigValueValidator.validateAndNormalize("snapshotBatchSize", " 1000 "));
    }

    @Test
    void snapshotBatchSize_invalidValues_rejected() {
        assertValueFormatInvalid("snapshotBatchSize", "99");
        assertValueFormatInvalid("snapshotBatchSize", "10001");
        assertValueFormatInvalid("snapshotBatchSize", "0");
        assertValueFormatInvalid("snapshotBatchSize", "-5");
        assertValueFormatInvalid("snapshotBatchSize", "1e3");
        assertValueFormatInvalid("snapshotBatchSize", "100.0");
        assertValueFormatInvalid("snapshotBatchSize", "abc");
    }

    @Test
    void snapshotBatchSize_emptyValue_rejectedAsValueEmpty() {
        assertValueEmpty("snapshotBatchSize", "");
    }

    // ---- tableRowDeleteStrategy ----

    @Test
    void tableDeleteStrategy_validValues_normalized() {
        assertEquals("DELETE", ServerConfigValueValidator.validateAndNormalize("tableRowDeleteStrategy", "DELETE"));
        assertEquals("DELETE_FLAG", ServerConfigValueValidator.validateAndNormalize("tableRowDeleteStrategy", "DELETE_FLAG"));
    }

    @Test
    void tableDeleteStrategy_invalidValues_rejected() {
        assertValueFormatInvalid("tableRowDeleteStrategy", "delete");
        assertValueFormatInvalid("tableRowDeleteStrategy", "Delete_Flag");
        assertValueFormatInvalid("tableRowDeleteStrategy", "FLAG");
    }

    // ---- unknown key / generic rules ----

    @Test
    void unknownKey_rejectedAsConfigKeyNotSupported() {
        BusinessException ex = assertThrows(BusinessException.class,
                () -> ServerConfigValueValidator.validateAndNormalize("monitor-metric-topic-name", "cdc-metric"));
        assertEquals(ServerConfigErrorCode.CONFIG_KEY_NOT_SUPPORTED, ex.getCode());
    }

    @Test
    void blankValue_rejectedAsValueEmpty() {
        BusinessException ex = assertThrows(BusinessException.class,
                () -> ServerConfigValueValidator.validateAndNormalize("auto-create-table", "   "));
        assertEquals(ServerConfigErrorCode.VALUE_EMPTY, ex.getCode());
    }

    @Test
    void valueLongerThan64_rejectedAsValueLengthExceeded() {
        String longValue = repeat("t", 65);
        BusinessException ex = assertThrows(BusinessException.class,
                () -> ServerConfigValueValidator.validateAndNormalize("auto-create-table", longValue));
        assertEquals(ServerConfigErrorCode.VALUE_LENGTH_EXCEEDED, ex.getCode());
    }

    private static void assertValueFormatInvalid(String key, String value) {
        BusinessException ex = assertThrows(BusinessException.class,
                () -> ServerConfigValueValidator.validateAndNormalize(key, value));
        assertEquals(ServerConfigErrorCode.VALUE_FORMAT_INVALID, ex.getCode());
    }

    private static void assertValueEmpty(String key, String value) {
        BusinessException ex = assertThrows(BusinessException.class,
                () -> ServerConfigValueValidator.validateAndNormalize(key, value));
        assertEquals(ServerConfigErrorCode.VALUE_EMPTY, ex.getCode());
    }

    private static String repeat(String s, int n) {
        StringBuilder sb = new StringBuilder();
        for (int i = 0; i < n; i++) {
            sb.append(s);
        }
        return sb.toString();
    }
}
