#!/usr/bin/env bash
# DSS-AC-065 R1 — §8.3 restore verification (read-only).
# Proves: the 7 approved temporary RUN_STATE rows are gone, task prefix is 0,
# the restored full-table export is byte-identical to the pre-task export, and
# both config tables saw zero change.
set -u
EV="$(cd "$(dirname "$0")" && pwd)"
# Credentials are NOT stored in evidence. Export the project CLAUDE.md §11 dev-DB
# connection string before re-running, e.g.:
#   export DSS_DEV_CONN='<user>/<password>@//<host>:<port>/<service>'
CONN="${DSS_DEV_CONN:?export DSS_DEV_CONN from project CLAUDE.md §11 before re-running}"

echo "# DSS-AC-065 R1 restore verification (§8.3)"
echo "# table under test: CDC / CDC_DATA_SOURCE_RUN_STATE (dev Oracle 19c 192.168.174.65:1521/prod.enmotech.com)"
echo

echo "## 1. byte-compare: restored export vs pre-task export (expect identical)"
for f in run_state client_multiple data_source; do
  if cmp -s "$EV/${f}_before.txt" "$EV/${f}_restored.txt"; then r="IDENTICAL"; else r="DIFFER"; fi
  printf '  %-16s before=%s restored=%s -> %s\n' "$f" \
    "$(sha256sum "$EV/${f}_before.txt" | cut -c1-16)" \
    "$(sha256sum "$EV/${f}_restored.txt" | cut -c1-16)" "$r"
done
echo

echo "## 2. row counts and content digests (live re-read after restore)"
sqlplus -S "$CONN" <<'SQL'
set pagesize 0 linesize 300 heading off feedback off echo off verify off trimspool on
prompt  -- task-prefix rows remaining (expect 0)
select '  prefix_rows='||count(*) from CDC_DATA_SOURCE_RUN_STATE where CLIENT_ID like 'dss-fa065-r1-%' or DATA_SOURCE_ID like 'dss-fa065-r1-%';
prompt  -- any of the 7 approved composite PKs still present (expect 0)
select '  temp_pk_remaining='||count(*) from CDC_DATA_SOURCE_RUN_STATE where (CLIENT_ID,DATA_SOURCE_ID) in (
 ('hosp-007','112-source-19c'),('hosp-002','112-source-19c'),('dss-fa065-r1-client-orphan','112-source-19c'),
 ('hosp-0061','dss-fa065-r1-source-orphan'),('CCFG-AC-R1-OFF','112-source-19c'),('CCFG-AC-R1-ON','199-source'),
 ('hosp-012','company-target-doris-v4'));
prompt  -- total row counts (expect run_state=30 client_multiple=16 data_source=34)
select '  run_state='||count(*) from CDC_DATA_SOURCE_RUN_STATE;
select '  client_multiple='||count(*) from CDC_CLIENT_MULTIPLE;
select '  data_source='||count(*) from CDC_DATA_SOURCE;
prompt  -- ordered 6-field content digest and PK-set digest (expect 3928100845 / 524003855)
select '  content_digest='||ora_hash(listagg(CLIENT_ID||'|'||DATA_SOURCE_ID||'|'||SNAPSHOT_STATUS||'|'||
    nvl(TO_CHAR(SNAPSHOT_LAST_SEEN_AT,'YYYY-MM-DD HH24:MI:SS'),'~NULL~')||'|'||
    nvl(TO_CHAR(SNAPSHOT_COMPLETED_AT,'YYYY-MM-DD HH24:MI:SS'),'~NULL~')||'|'||
    TO_CHAR(UPDATED_AT,'YYYY-MM-DD HH24:MI:SS'), chr(10)) within group (order by CLIENT_ID, DATA_SOURCE_ID), 4294967295)
 from CDC_DATA_SOURCE_RUN_STATE;
select '  pk_set_digest='||ora_hash(listagg(CLIENT_ID||'|'||DATA_SOURCE_ID, chr(10)) within group (order by CLIENT_ID, DATA_SOURCE_ID), 4294967295) from CDC_DATA_SOURCE_RUN_STATE;
prompt  -- status distribution (expect 30 rows total)
select '  '||SNAPSHOT_STATUS||' = '||count(*) from CDC_DATA_SOURCE_RUN_STATE group by SNAPSHOT_STATUS order by 1;
prompt  -- NULL counts
select '  last_seen_null='||sum(case when SNAPSHOT_LAST_SEEN_AT is null then 1 else 0 end)||' completed_null='||sum(case when SNAPSHOT_COMPLETED_AT is null then 1 else 0 end) from CDC_DATA_SOURCE_RUN_STATE;
prompt  -- task-prefix rows in config tables (expect 0)
select '  cm_prefix='||count(*) from CDC_CLIENT_MULTIPLE where CLIENT_ID like 'dss-fa065-r1-%';
select '  ds_prefix='||count(*) from CDC_DATA_SOURCE where DATA_SOURCE_ID like 'dss-fa065-r1-%';
exit
SQL
echo
echo "## 3. cleanup tail — rows remaining with the task prefix in any Feature table"
sqlplus -S "$CONN" <<'SQL'
set pagesize 0 linesize 300 heading off feedback off echo off verify off trimspool on
select '  '||CLIENT_ID||' | '||DATA_SOURCE_ID from CDC_DATA_SOURCE_RUN_STATE where CLIENT_ID like 'dss-fa065-r1-%' or DATA_SOURCE_ID like 'dss-fa065-r1-%';
exit
SQL
