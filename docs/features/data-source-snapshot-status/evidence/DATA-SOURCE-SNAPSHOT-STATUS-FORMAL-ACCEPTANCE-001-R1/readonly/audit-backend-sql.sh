#!/usr/bin/env bash
# DSS-AC-065 R1 — read-only audit of backend SQL emitted during the R1 verification window.
# Input: readonly/runtime-window.txt, the byte-bounded slice of the running backend log
#        (/tmp/dss-fa-001/backend.log, pid 10371) covering exactly this R1 sweep
#        (http/fetch.sh + browser/scripts/fa065-r1.cjs).
# Issues no SQL itself; only greps an existing log slice.
set -u
LOG="${1:-$(cd "$(dirname "$0")" && pwd)/runtime-window.txt}"
if [ ! -f "$LOG" ]; then echo "MISSING LOG: $LOG" >&2; exit 2; fi

echo "# Backend SQL audit — DATA-SOURCE-SNAPSHOT-STATUS-FORMAL-ACCEPTANCE-001-R1 (DSS-AC-065 supplement)"
echo "# log=$LOG"
echo "# lines=$(wc -l < "$LOG")  bytes=$(wc -c < "$LOG")"
echo "# window bounded by readonly/.window.begin (N0..N1) on the live backend log"
echo
echo "## 1. All MyBatis 'Preparing:' statements by SQL verb"
grep -oE 'Preparing: (SELECT|INSERT|UPDATE|DELETE|MERGE)' "$LOG" | sort | uniq -c | sed 's/^/  /'
echo
echo "## 2. WRITE statements (INSERT/UPDATE/DELETE/MERGE) — full list (expect none)"
n=$(grep -cE 'Preparing: (INSERT|UPDATE|DELETE|MERGE)' "$LOG")
echo "  write_statement_count=$n"
grep -E 'Preparing: (INSERT|UPDATE|DELETE|MERGE)' "$LOG" | sed 's/^/  /'
echo
echo "## 3. Distinct read-only statements against the Feature three tables"
for t in CDC_DATA_SOURCE_RUN_STATE CDC_CLIENT_MULTIPLE CDC_DATA_SOURCE; do
  echo "  --- $t"
  echo "      SELECT=$(grep -cE "Preparing: SELECT .*FROM $t\b" "$LOG")  WRITE=$(grep -cE "Preparing: (INSERT|UPDATE|DELETE|MERGE).*$t\b" "$LOG")"
  grep -oE "Preparing: SELECT .*FROM $t\b[^ ]*" "$LOG" | sort -u | sed 's/^/      /'
done
echo
echo "## 4. Any DDL / PL-SQL / commit markers in window"
for p in 'CREATE ' 'ALTER ' 'DROP ' 'TRUNCATE' 'BEGIN' 'COMMIT' 'callable'; do
  echo "  /$p/ = $(grep -ciE "$p" "$LOG")"
done
echo
echo "## 5. All tables referenced by window statements (by verb)"
grep -oE 'FROM [A-Za-z0-9_]+' "$LOG" | sort | uniq -c | sed 's/^/  /'
echo
echo "## 6. ZooKeeper (layered reporting — Feature uses no ZK API)"
echo "  zk_lines=$(grep -ciE 'zookeeper|ClientCnxn' "$LOG")"
echo "  --- distinct zk messages (Background application connection attempts ONLY; expect connect/refused, no node ops)"
grep -iE 'zookeeper|ClientCnxn' "$LOG" | sed -E 's/^[0-9-]+ [0-9:.]+ +INFO [0-9]+ --- //' | sort | uniq -c | sed 's/^/      /'
echo "  --- ZK node read/write API markers (expect 0): getData/setData/create/delete/setACL/reconfig list"
for p in 'getData' 'setData' 'setACL' 'reconfig' 'ZooKeeper\.getChildren' 'zkCli' 'bsoft-cdc'; do
  echo "      /$p/ = $(grep -cE "$p" "$LOG")"
done
