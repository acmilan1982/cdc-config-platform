-- ============================================================================
-- DSS-AC-065 R1  CLEANUP / RESTORE (7 exact composite-PK DELETEs)  [PART OF APPROVAL]
-- Target: Oracle 19c development / CDC / CDC_DATA_SOURCE_RUN_STATE
-- Exact PK predicate on BOTH key columns; NO LIKE, NO full-table delete.
-- ============================================================================
DELETE FROM CDC_DATA_SOURCE_RUN_STATE WHERE CLIENT_ID='hosp-007'                 AND DATA_SOURCE_ID='112-source-19c';
DELETE FROM CDC_DATA_SOURCE_RUN_STATE WHERE CLIENT_ID='hosp-002'                 AND DATA_SOURCE_ID='112-source-19c';
DELETE FROM CDC_DATA_SOURCE_RUN_STATE WHERE CLIENT_ID='dss-fa065-r1-client-orphan' AND DATA_SOURCE_ID='112-source-19c';
DELETE FROM CDC_DATA_SOURCE_RUN_STATE WHERE CLIENT_ID='hosp-0061'                AND DATA_SOURCE_ID='dss-fa065-r1-source-orphan';
DELETE FROM CDC_DATA_SOURCE_RUN_STATE WHERE CLIENT_ID='CCFG-AC-R1-OFF'           AND DATA_SOURCE_ID='112-source-19c';
DELETE FROM CDC_DATA_SOURCE_RUN_STATE WHERE CLIENT_ID='CCFG-AC-R1-ON'            AND DATA_SOURCE_ID='199-source';
DELETE FROM CDC_DATA_SOURCE_RUN_STATE WHERE CLIENT_ID='hosp-012'                 AND DATA_SOURCE_ID='company-target-doris-v4';
COMMIT;
