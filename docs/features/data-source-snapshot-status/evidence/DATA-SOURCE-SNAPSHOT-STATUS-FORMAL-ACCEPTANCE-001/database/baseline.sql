-- Read-only baseline snapshot for DATA-SOURCE-SNAPSHOT-STATUS-FORMAL-ACCEPTANCE-001
-- Scope: CDC_DATA_SOURCE_RUN_STATE, CDC_CLIENT_MULTIPLE, CDC_DATA_SOURCE (+ dictionary views)
-- No DML, no DDL, no PL/SQL.
set pagesize 500 linesize 400 feedback off heading on trimspool on echo off
alter session set nls_date_format='YYYY-MM-DD HH24:MI:SS';

prompt ===== A. ROW COUNTS (Feature three business tables + stats) =====
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

prompt ===== E. CONSTRAINTS AND INDEXES (three tables) =====
column table_name format a26
column constraint_name format a34
column index_name format a34
select c.table_name, c.constraint_name, c.constraint_type, c.status, c.search_condition_vc
  from user_constraints c
 where c.table_name in ('CDC_DATA_SOURCE_RUN_STATE','CDC_CLIENT_MULTIPLE','CDC_DATA_SOURCE')
 order by c.table_name, c.constraint_type, c.constraint_name;
select i.table_name, i.index_name, i.uniqueness, i.status
  from user_indexes i
 where i.table_name in ('CDC_DATA_SOURCE_RUN_STATE','CDC_CLIENT_MULTIPLE','CDC_DATA_SOURCE')
 order by i.table_name, i.index_name;

prompt ===== F. RUN_STATE x CLIENT_MULTIPLE LEFT JOIN (per-row probe config) =====
column client_desc format a34
select r.CLIENT_ID, r.DATA_SOURCE_ID, r.SNAPSHOT_STATUS,
       m.CLIENT_DESC, m.FG_ACTIVE as client_fg_active,
       case when m.CLIENT_ID is null then 'NO_CONFIG' else 'HAS_CONFIG' end as config_state,
       length(m.CLIENT_DESC) as desc_len
  from CDC_DATA_SOURCE_RUN_STATE r
  left join CDC_CLIENT_MULTIPLE m on m.CLIENT_ID = r.CLIENT_ID
 order by r.CLIENT_ID, r.DATA_SOURCE_ID;

prompt ===== G. RUN_STATE x CDC_DATA_SOURCE LEFT JOIN (per-row source config) =====
column data_source_org format a26
column data_source_category format a20
select r.CLIENT_ID, r.DATA_SOURCE_ID, r.SNAPSHOT_STATUS,
       s.DATA_SOURCE_ORG, s.DATA_SOURCE_CATEGORY, s.FG_ACTIVE as source_fg_active,
       case when s.DATA_SOURCE_ID is null then 'NO_CONFIG' else 'HAS_CONFIG' end as config_state
  from CDC_DATA_SOURCE_RUN_STATE r
  left join CDC_DATA_SOURCE s on s.DATA_SOURCE_ID = r.DATA_SOURCE_ID
 order by r.CLIENT_ID, r.DATA_SOURCE_ID;

prompt ===== H. JOINED ROWCOUNT (LEFT JOIN must not change row count) =====
select count(*) as joined_rows
  from CDC_DATA_SOURCE_RUN_STATE r
  left join CDC_CLIENT_MULTIPLE m on m.CLIENT_ID = r.CLIENT_ID
  left join CDC_DATA_SOURCE s on s.DATA_SOURCE_ID = r.DATA_SOURCE_ID;

prompt ===== I. CANDIDATE SOURCES (distinct RUN_STATE values) =====
select 'CLIENT' as dim, CLIENT_ID as value from CDC_DATA_SOURCE_RUN_STATE group by CLIENT_ID
union all
select 'SOURCE', DATA_SOURCE_ID from CDC_DATA_SOURCE_RUN_STATE group by DATA_SOURCE_ID
order by 1,2;

prompt ===== J. CDC_STATS_* TABLES PRESENT? =====
column table_name format a40
select table_name from user_tables where table_name like 'CDC_STATS%' order by table_name;

prompt ===== K. MAX UPDATED_AT / NULL TIME COUNTS =====
select count(*) as total_rows,
       sum(case when SNAPSHOT_LAST_SEEN_AT is null then 1 else 0 end) as null_last_seen,
       sum(case when SNAPSHOT_COMPLETED_AT is null then 1 else 0 end) as null_completed,
       sum(case when UPDATED_AT is null then 1 else 0 end) as null_updated
  from CDC_DATA_SOURCE_RUN_STATE;

exit
