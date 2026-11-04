SET ECHO OFF PAGESIZE 100 LINESIZE 400 VERIFY OFF FEEDBACK OFF TRIMSPOOL ON
COL CLIENT_ID FOR A18
COL DATA_SOURCE_ID FOR A80
COL CLIENT_DESC FOR A40
COL BYTES FOR 9999
COL CHARS FOR 9999

-- AC-014: write request supplied padded / empty / duplicate IDs; persisted value
-- must be trimmed, deduplicated, original-order, single comma, no spaces.
SELECT CLIENT_ID,
       DATA_SOURCE_ID,
       LENGTHB(DATA_SOURCE_ID) BYTES,
       CLIENT_DESC
  FROM CDC_CLIENT_MULTIPLE
 WHERE CLIENT_ID = 'S2AC-P14';

-- AC-015: historical row contains a trim-duplicate at storage level. Display and
-- count must deduplicate; the duplicate keeps the original raw value.
SELECT CLIENT_ID,
       DATA_SOURCE_ID AS RAW_IDS,
       LENGTH(DATA_SOURCE_ID) CHARS
  FROM CDC_CLIENT_MULTIPLE
 WHERE CLIENT_ID = 'S2AC-PH1';
