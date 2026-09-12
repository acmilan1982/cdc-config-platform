-- Read-only AFTER snapshot for DATA-SOURCE-SNAPSHOT-STATUS-FORMAL-ACCEPTANCE-001.
-- Same read-only shape as baseline.sql so before/after can be diffed for zero-write proof.
-- No DML, no DDL, no PL/SQL. Connection credentials are supplied at run time, never stored here.
set pagesize 500 linesize 400 feedback off heading on trimspool on echo off
alter session set nls_date_format='YYYY-MM-DD HH24:MI:SS';

prompt ===== A. ROW COUNTS (Feature three business tables) =====
select 'CDC_DATA_SOURCE_RUN_STATE' as table_name, count(*) as row_count from CDC_DATA_SOURCE_RUN_STATE
union all select 'CDC_CLIENT_MULTIPLE', count(*) from CDC_CLIENT_MULTIPLE
union all select 'CDC_DATA_SOURCE', count(*) from CDC_DATA_SOURCE;

prompt ===== B. CDC_DATA_SOURCE_RUN_STATE FULL CONTENT (ordered) =====
column client_id format a22
column data_source_id format a30
column snapshot_status format a20
select CLIENT_ID, DATA_SOURCE_ID, SNAPSHOT_STATUS, SNAPSHOT_LAST_SEEN_AT, SNAPSHOT_COMPLETED_AT, UPDATED_AT
  from CDC_DATA_SOURCE_RUN_STATE
 order by CLIENT_ID, DATA_SOURCE_ID;

prompt ===== C. RUN_STATE STATUS DISTRIBUTION =====
select SNAPSHOT_STATUS, count(*) as cnt from CDC_DATA_SOURCE_RUN_STATE group by SNAPSHOT_STATUS order by SNAPSHOT_STATUS;

prompt ===== D. RUN_STATE CONTENT HASH =====
select count(*) as row_count,
       sum(ora_hash(CLIENT_ID||'|'||DATA_SOURCE_ID||'|'||SNAPSHOT_STATUS||'|'||nvl(to_char(SNAPSHOT_LAST_SEEN_AT,'YYYYMMDDHH24MISS'),'~')||'|'||nvl(to_char(SNAPSHOT_COMPLETED_AT,'YYYYMMDDHH24MISS'),'~')||'|'||to_char(UPDATED_AT,'YYYYMMDDHH24MISS'))) as content_hash_sum
  from CDC_DATA_SOURCE_RUN_STATE;

prompt ===== H. JOINED ROWCOUNT (LEFT JOIN must not change row count) =====
select count(*) as joined_rows
  from CDC_DATA_SOURCE_RUN_STATE r
  left join CDC_CLIENT_MULTIPLE m on m.CLIENT_ID = r.CLIENT_ID
  left join CDC_DATA_SOURCE s on s.DATA_SOURCE_ID = r.DATA_SOURCE_ID;

prompt ===== K. NULL TIME COUNTS =====
select count(*) as total_rows,
       sum(case when SNAPSHOT_LAST_SEEN_AT is null then 1 else 0 end) as null_last_seen,
       sum(case when SNAPSHOT_COMPLETED_AT is null then 1 else 0 end) as null_completed,
       sum(case when UPDATED_AT is null then 1 else 0 end) as null_updated
  from CDC_DATA_SOURCE_RUN_STATE;

prompt ===== L. CDC_STATS_* ROW COUNTS (scheduler domain, separate from Feature tables) =====
select 'CDC_STATS_TASK_CONFIG' as table_name, count(*) as row_count from CDC_STATS_TASK_CONFIG
union all select 'CDC_STATS_WATERMARK', count(*) from CDC_STATS_WATERMARK
union all select 'CDC_STATS_CUMULATIVE_OVERVIEW', count(*) from CDC_STATS_CUMULATIVE_OVERVIEW
union all select 'CDC_STATS_DAILY_OVERVIEW', count(*) from CDC_STATS_DAILY_OVERVIEW
union all select 'CDC_STATS_DIM_CUMULATIVE', count(*) from CDC_STATS_DIM_CUMULATIVE
union all select 'CDC_STATS_DIM_DAILY', count(*) from CDC_STATS_DIM_DAILY;

exit
