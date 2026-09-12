#!/usr/bin/env bash
# DSS-AC-065 R1 — read-only HTTP sweep of the single Feature endpoint.
# Regenerates *.json (raw bodies) and SUMMARY.txt. Issues GET only.
#
# usage: ./fetch.sh [BASE]      (default BASE=http://192.168.174.70:8080)
set -u
BASE="${1:-http://192.168.174.70:8080}"
EP="$BASE/api/monitor/data-source-run-state/list"
OUT="$(cd "$(dirname "$0")" && pwd)"
CURL=(curl -sS --noproxy '*' --max-time 20 -H 'Accept: application/json')

run() { # name query
  local name="$1" query="$2"
  local url="$EP"
  [ -n "$query" ] && url="$EP?$query"
  local http
  http=$("${CURL[@]}" -o "$OUT/$name.json" -w '%{http_code}' "$url")
  echo "$name|$http|$url" >> "$OUT/.sweep.tsv"
}

rm -f "$OUT/.sweep.tsv"
run 01-no-params                 ""
run 02-status-completed          "status=COMPLETED"
run 03-status-unknown            "status=UNKNOWN"
run 04-status-running            "status=RUNNING"
run 05-client-hosp007            "clientId=hosp-007"
run 06-client-orphan-probe       "clientId=dss-fa065-r1-client-orphan"
run 07-source-orphan-source      "sourceId=dss-fa065-r1-source-orphan"
run 08-client-disabled           "clientId=CCFG-AC-R1-OFF"
run 09-source-disabled           "sourceId=199-source"
run 10-source-nonsource          "sourceId=company-target-doris-v4"
run 11-client-hosp002-status-unknown "clientId=hosp-002&status=UNKNOWN"
run 12-invalid-status            "status=FORBIDDEN_STATE"

python3 - "$OUT" <<'PY'
import json, sys, os
out = sys.argv[1]
lines = []
for row in open(os.path.join(out, '.sweep.tsv'), encoding='utf-8'):
    name, http, url = row.rstrip('\n').split('|', 2)
    body = json.load(open(os.path.join(out, name + '.json'), encoding='utf-8'))
    data = body.get('data') or {}
    recs = data.get('records') or []
    cat = {}
    for r in recs:
        cat[r.get('statusCategory')] = cat.get(r.get('statusCategory'), 0) + 1
    cand = data.get('candidates') or {}
    lines.append(f"### {name}  http={http}  url={url}")
    lines.append(f"  code={body.get('code')} message={body.get('message')} records={len(recs)} cat={cat}")
    if cand:
        lines.append(f"  candidates: clients={len(cand.get('clients') or [])} sources={len(cand.get('sources') or [])} statuses={cand.get('statuses')}")
    # small result sets: full payloads; large sets: only the temp-prefixed rows
    def is_temp(r):
        return 'dss-fa065-r1' in str(r.get('clientId')) or 'dss-fa065-r1' in str(r.get('sourceId'))
    for r in (recs if len(recs) <= 3 else [r for r in recs if is_temp(r)]):
        lines.append('  ROW ' + json.dumps(r, ensure_ascii=False, sort_keys=True))
    lines.append('')
open(os.path.join(out, 'SUMMARY.txt'), 'w', encoding='utf-8').write('\n'.join(lines))
print(f"SUMMARY.txt lines={len(lines)}")
PY
rm -f "$OUT/.sweep.tsv"
