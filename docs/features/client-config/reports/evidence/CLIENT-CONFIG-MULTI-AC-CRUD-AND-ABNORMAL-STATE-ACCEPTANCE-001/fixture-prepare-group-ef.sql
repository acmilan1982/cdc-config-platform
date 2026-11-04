-- Group E/F fixture preparation (DML on CDC_CLIENT_MULTIPLE only).
-- Owner authorized arbitrary data operations on this table for this task; no cleanup required.
-- Synthetic rows only, explicit NON-real-probe descriptions, batch prefix MULTIAC-.
-- NULL DATA_SOURCE_ID keeps these rows free of data-source allocation conflicts,
-- except where a real conflict is intentionally reused (MULTIAC-ENC vs MULTIAC-CONFA).

INSERT INTO CDC_CLIENT_MULTIPLE (CLIENT_ID, CLIENT_DESC, DATA_SOURCE_ID, FG_ACTIVE)
VALUES ('MULTIAC-E139A', 'MULTIAC synthetic fixture: AC-139 cancel/success disable path. Not a real runtime probe.', NULL, '1');

INSERT INTO CDC_CLIENT_MULTIPLE (CLIENT_ID, CLIENT_DESC, DATA_SOURCE_ID, FG_ACTIVE)
VALUES ('MULTIAC-E139F', 'MULTIAC synthetic fixture: AC-139 disable failure injection target. Not a real runtime probe.', NULL, '1');

INSERT INTO CDC_CLIENT_MULTIPLE (CLIENT_ID, CLIENT_DESC, DATA_SOURCE_ID, FG_ACTIVE)
VALUES ('MULTIAC-F145A', 'MULTIAC synthetic fixture: AC-145 toggle-success reselect target. Not a real runtime probe.', NULL, '1');

INSERT INTO CDC_CLIENT_MULTIPLE (CLIENT_ID, CLIENT_DESC, DATA_SOURCE_ID, FG_ACTIVE)
VALUES ('MULTIAC-F145D', 'MULTIAC synthetic fixture: AC-145 delete-failure selection retention target. Not a real runtime probe.', NULL, '0');

COMMIT;

SELECT CLIENT_ID, FG_ACTIVE, DATA_SOURCE_ID
  FROM CDC_CLIENT_MULTIPLE
 WHERE CLIENT_ID IN ('MULTIAC-E139A','MULTIAC-E139F','MULTIAC-F145A','MULTIAC-F145D')
 ORDER BY CLIENT_ID;
