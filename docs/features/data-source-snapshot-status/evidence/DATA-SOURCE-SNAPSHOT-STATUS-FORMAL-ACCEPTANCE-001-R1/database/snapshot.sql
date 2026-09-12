-- DSS-AC-065 R1 canonical read-only snapshot (no DML)
-- usage: sqlplus -S ... @snapshot.sql <OUTDIR> <TAG>
set pagesize 0 linesize 32767 heading off feedback off echo off verify off trimspool on termout off
col c1 format a100
spool &1/run_state_&2..txt
select CLIENT_ID||'|'||DATA_SOURCE_ID||'|'||SNAPSHOT_STATUS||'|'||
       nvl(TO_CHAR(SNAPSHOT_LAST_SEEN_AT,'YYYY-MM-DD HH24:MI:SS'),'~NULL~')||'|'||
       nvl(TO_CHAR(SNAPSHOT_COMPLETED_AT,'YYYY-MM-DD HH24:MI:SS'),'~NULL~')||'|'||
       TO_CHAR(UPDATED_AT,'YYYY-MM-DD HH24:MI:SS')
from CDC_DATA_SOURCE_RUN_STATE
order by CLIENT_ID, DATA_SOURCE_ID;
spool off
spool &1/client_multiple_&2..txt
select CLIENT_ID||'|'||nvl(CLIENT_DESC,'~NULL~')||'|'||nvl(DATA_SOURCE_ID,'~NULL~')||'|'||FG_ACTIVE
from CDC_CLIENT_MULTIPLE order by CLIENT_ID;
spool off
spool &1/data_source_&2..txt
select DATA_SOURCE_ID||'|'||nvl(DATA_SOURCE_ORG,'~NULL~')||'|'||nvl(DATA_SOURCE_TYPE,'~NULL~')||'|'||
       nvl(DATA_SOURCE_CATEGORY,'~NULL~')||'|'||nvl(DATA_SOURCE_NAME,'~NULL~')||'|'||
       nvl(DATA_SOURCE_DOMAIN,'~NULL~')||'|'||nvl(SOURCE_APP,'~NULL~')||'|'||nvl(FG_ACTIVE,'~NULL~')||'|'||
       nvl(TO_CHAR(INSERT_TIME,'YYYY-MM-DD HH24:MI:SS'),'~NULL~')||'|'||
       nvl(TO_CHAR(UPDATE_TIME,'YYYY-MM-DD HH24:MI:SS'),'~NULL~')||'|'||
       nvl(TO_CHAR(DELETE_TIME,'YYYY-MM-DD HH24:MI:SS'),'~NULL~')
from CDC_DATA_SOURCE order by DATA_SOURCE_ID;
spool off
