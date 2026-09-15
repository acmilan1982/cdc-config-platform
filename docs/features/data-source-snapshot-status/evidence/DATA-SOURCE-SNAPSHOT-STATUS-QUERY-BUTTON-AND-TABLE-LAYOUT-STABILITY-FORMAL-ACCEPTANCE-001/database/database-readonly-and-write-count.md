# Database read-only evidence and write-count proof (prompt §11)

Connection used: the project's approved internal dev database only, via `agent-env.sh`
(`ORACLE_HOME=/opt/oracle/instantclient`). No other database, user or schema was contacted.
The connection string itself is not repeated here (see `CLAUDE.md` §11) and is not stored in any new file.

## 1. Feature read objects (read-only metadata)

```text
CDC_DATA_SOURCE_RUN_STATE   TABLE   VALID
CDC_CLIENT_MULTIPLE         TABLE   VALID
CDC_DATA_SOURCE             TABLE   VALID
```

## 2. Row counts (read-only `SELECT COUNT(*)`, taken AFTER the acceptance run)

```text
CDC_DATA_SOURCE_RUN_STATE  rows=30
CDC_CLIENT_MULTIPLE        rows=16
CDC_DATA_SOURCE            rows=34
```

## 3. Proof that the acceptance run wrote nothing

The strongest form of proof here is not a before/after count (both 30) but the write watermark:

```text
select to_char(max(UPDATED_AT),'YYYY-MM-DD HH24:MI:SS') from CDC_DATA_SOURCE_RUN_STATE;
  -> 2026-09-06 11:02:00
```

`UPDATED_AT` is NOT NULL on this table and is the record's own write timestamp. The newest value in the
whole table predates this acceptance task by ten days. If the acceptance had performed even one INSERT or
UPDATE against this table, the maximum would have to be on 2026-09-15/16. It is not. No row was inserted,
updated or deleted. Table-level row counts taken after the run also match the pre-run values in the
committed database verification report (30 / 16 / 34).

## 4. Write SQL issued by the feature request path = 0

The feature's three mappers declare exactly three fixed read-only statements and no write annotation:

```text
DataSourceRunStateMapper.selectAll()   @Select  ... FROM CDC_DATA_SOURCE_RUN_STATE   (no WHERE — full read)
RunStateClientMapper.selectAll()       @Select  ... FROM CDC_CLIENT_MULTIPLE
RunStateDataSourceMapper.selectAll()   @Select  ... FROM CDC_DATA_SOURCE
```

Observed on the live backend during the whole 4-viewport acceptance run:

```text
Preparing: SELECT ... FROM CDC_DATA_SOURCE_RUN_STATE ...   x63
Preparing: SELECT ... FROM CDC_CLIENT_MULTIPLE ...         x63
Preparing: SELECT ... FROM CDC_DATA_SOURCE ...             x63
INSERT/UPDATE/DELETE/MERGE statements in the backend log: 0
```

## 5. Read-only result reproduction

`GET /api/monitor/data-source-run-state/list` returns `code=200` with 30 records and field set
`clientId, clientRef, sourceId, sourceRef, snapshotStatus, statusCategory, snapshotLastSeenAt,
snapshotCompletedAt, updatedAt` — byte-compatible with the acceptance baseline. Repeated identical calls
return identical row counts, i.e. the endpoint is side-effect free.

```text
database_access_status=AVAILABLE_READ_ONLY
database_write_status=ZERO
feature_request_sql_select_count=63
feature_request_sql_write_count=0
approval_requested=FALSE (no write was needed or attempted)
```
