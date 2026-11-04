-- Task: CLIENT-CONFIG-MULTI-AC-CRUD-AND-ABNORMAL-STATE-ACCEPTANCE-001
-- Fixture preparation DML (owner-authorized, CDC_CLIENT_MULTIPLE only, no DDL).
-- Synthetic test records use the MULTIAC- prefix. No credentials in this file.
-- Run with SQL*Plus using the repo-authorized development connection from the environment.

SET DEFINE OFF
SET FEEDBACK ON

-- Release the reviewed synthetic source holders so DS01..DS08 become free candidates.
-- These are synthetic acceptance fixtures (not real runtime probes).
UPDATE CDC_CLIENT_MULTIPLE SET DATA_SOURCE_ID = NULL WHERE CLIENT_ID = 'CCFG-AC-R1-ON';
UPDATE CDC_CLIENT_MULTIPLE SET DATA_SOURCE_ID = NULL WHERE CLIENT_ID = 'CCFG-AC-R1-OFF';

-- Abnormal FG_ACTIVE samples (non '0'/'1' value '2').
INSERT INTO CDC_CLIENT_MULTIPLE (CLIENT_ID, CLIENT_DESC, DATA_SOURCE_ID, FG_ACTIVE)
VALUES ('MULTIAC-ABN1', 'MULTIAC synthetic fixture: abnormal FG_ACTIVE=2 for three-state menu checks. Not a real runtime probe.', 'CCFG-AC-R1-DS03', '2');
INSERT INTO CDC_CLIENT_MULTIPLE (CLIENT_ID, CLIENT_DESC, DATA_SOURCE_ID, FG_ACTIVE)
VALUES ('MULTIAC-ABN2', 'MULTIAC synthetic fixture: abnormal FG_ACTIVE=2 for disable-via-UI check. Not a real runtime probe.', 'CCFG-AC-R1-DS04', '2');
INSERT INTO CDC_CLIENT_MULTIPLE (CLIENT_ID, CLIENT_DESC, DATA_SOURCE_ID, FG_ACTIVE)
VALUES ('MULTIAC-ABN3', 'MULTIAC synthetic fixture: abnormal FG_ACTIVE=2 for delete-via-UI check. Not a real runtime probe.', 'CCFG-AC-R1-DS05', '2');

-- Normal disabled fixture for enable-confirmation checks.
INSERT INTO CDC_CLIENT_MULTIPLE (CLIENT_ID, CLIENT_DESC, DATA_SOURCE_ID, FG_ACTIVE)
VALUES ('MULTIAC-OFF1', 'MULTIAC synthetic fixture: disabled probe for enable-confirmation checks. Not a real runtime probe.', 'CCFG-AC-R1-DS02', '0');

-- Deletable fixtures.
INSERT INTO CDC_CLIENT_MULTIPLE (CLIENT_ID, CLIENT_DESC, DATA_SOURCE_ID, FG_ACTIVE)
VALUES ('MULTIAC-DEL1', 'MULTIAC synthetic fixture: deletable probe for AC-020. Not a real runtime probe.', NULL, '0');
INSERT INTO CDC_CLIENT_MULTIPLE (CLIENT_ID, CLIENT_DESC, DATA_SOURCE_ID, FG_ACTIVE)
VALUES ('MULTIAC-DEL2', 'MULTIAC synthetic fixture: deletable probe for AC-145 delete-selection checks. Not a real runtime probe.', NULL, '0');

-- ID edit sample and its conflict target.
INSERT INTO CDC_CLIENT_MULTIPLE (CLIENT_ID, CLIENT_DESC, DATA_SOURCE_ID, FG_ACTIVE)
VALUES ('MULTIAC-ID1', 'MULTIAC synthetic fixture: probe-ID edit sample. Not a real runtime probe.', 'CCFG-AC-R1-DS07', '0');
INSERT INTO CDC_CLIENT_MULTIPLE (CLIENT_ID, CLIENT_DESC, DATA_SOURCE_ID, FG_ACTIVE)
VALUES ('MULTIAC-ID2', 'MULTIAC synthetic fixture: probe-ID conflict target. Not a real runtime probe.', NULL, '0');

-- Source-occupancy owner for conflict checks.
INSERT INTO CDC_CLIENT_MULTIPLE (CLIENT_ID, CLIENT_DESC, DATA_SOURCE_ID, FG_ACTIVE)
VALUES ('MULTIAC-CONFA', 'MULTIAC synthetic fixture: source occupancy owner for conflict checks. Not a real runtime probe.', 'CCFG-AC-R1-DS08', '1');

-- Description boundary sample (non-empty initial description).
INSERT INTO CDC_CLIENT_MULTIPLE (CLIENT_ID, CLIENT_DESC, DATA_SOURCE_ID, FG_ACTIVE)
VALUES ('MULTIAC-DESC', 'MULTIAC synthetic description boundary sample. Not a real runtime probe.', '77711', '0');

COMMIT;

-- Post-commit verification.
SELECT CLIENT_ID, LENGTHB(CLIENT_DESC) AS DESCB, DATA_SOURCE_ID, FG_ACTIVE
FROM CDC_CLIENT_MULTIPLE
WHERE CLIENT_ID LIKE 'MULTIAC-%' OR CLIENT_ID IN ('CCFG-AC-R1-ON','CCFG-AC-R1-OFF')
ORDER BY CLIENT_ID;
EXIT
