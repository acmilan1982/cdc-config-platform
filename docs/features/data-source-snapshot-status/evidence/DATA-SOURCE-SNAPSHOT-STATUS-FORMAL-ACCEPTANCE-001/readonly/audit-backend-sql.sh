#!/usr/bin/env bash
# Read-only audit of backend SQL emitted during the acceptance run.
# Inputs: a captured backend runtime log (default /tmp/dss-fa-001/backend.log).
# Issues no SQL itself; only greps an existing log file.
set -u
LOG="${1:-/tmp/dss-fa-001/backend.log}"
if [ ! -f "$LOG" ]; then echo "MISSING LOG: $LOG" >&2; exit 2; fi

echo "# Backend SQL audit — DATA-SOURCE-SNAPSHOT-STATUS-FORMAL-ACCEPTANCE-001"
echo "# log=$LOG"
echo "# lines=$(wc -l < "$LOG")  bytes=$(wc -c < "$LOG")"
echo
echo "## 1. All MyBatis 'Preparing:' statements by SQL verb"
grep -oE 'Preparing: (SELECT|INSERT|UPDATE|DELETE|MERGE)' "$LOG" | sort | uniq -c | sed 's/^/  /'
echo
echo "## 2. WRITE statements (INSERT/UPDATE/DELETE/MERGE) — full list (expect none)"
n=$(grep -cE 'Preparing: (INSERT|UPDATE|DELETE|MERGE)' "$LOG")
echo "  write_statement_count=$n"
grep -E 'Preparing: (INSERT|UPDATE|DELETE|MERGE)' "$LOG" | sed 's/^/  /'
echo
echo "## 3. Feature business table CDC_DATA_SOURCE_RUN_STATE — access statements by verb"
echo "  total mentions=$(grep -cE 'CDC_DATA_SOURCE_RUN_STATE' "$LOG")"
echo "  SELECT=$(grep -cE 'Preparing: SELECT .*FROM CDC_DATA_SOURCE_RUN_STATE' "$LOG")"
echo "  WRITE =$(grep -cE 'Preparing: (INSERT|UPDATE|DELETE|MERGE).*CDC_DATA_SOURCE_RUN_STATE' "$LOG")"
echo
echo "## 4. Other Feature tables CDC_CLIENT_MULTIPLE / CDC_DATA_SOURCE access by verb"
for t in CDC_CLIENT_MULTIPLE CDC_DATA_SOURCE; do
  echo "  $t: SELECT=$(grep -cE "Preparing: SELECT .*FROM $t\b" "$LOG") WRITE=$(grep -cE "Preparing: (INSERT|UPDATE|DELETE|MERGE).*$t\b" "$LOG")"
done
echo
echo "## 5. Stats scheduler rounds observed in this log window"
grep -E 'Stats scheduler started|Round START|Round end' "$LOG" | sed 's/^/  /'
echo
echo "## 6. Stats scheduler tables touched (separate from Feature three tables)"
for t in CDC_STATS_TASK_CONFIG CDC_STATS_WATERMARK CDC_STATS_DAILY CDC_STATS_CUMULATIVE; do
  echo "  $t: SELECT=$(grep -cE "Preparing: SELECT .*FROM $t\b" "$LOG") WRITE=$(grep -cE "Preparing: (INSERT|UPDATE|DELETE|MERGE).*$t\b" "$LOG")"
done
echo
echo "## 7. ZooKeeper client chatter (application startup, unrelated to this Feature; no ZK API used by the Feature)"
echo "  zk_lines=$(grep -ciE 'zookeeper|ClientCnxn' "$LOG")"
