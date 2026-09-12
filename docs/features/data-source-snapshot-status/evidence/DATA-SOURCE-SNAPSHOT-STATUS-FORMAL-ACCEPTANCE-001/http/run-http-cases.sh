#!/usr/bin/env bash
# Read-only HTTP evidence capture for DATA-SOURCE-SNAPSHOT-STATUS-FORMAL-ACCEPTANCE-001
# GET only. No POST/PUT/PATCH/DELETE is issued anywhere in this script.
set -u
BASE='http://127.0.0.1:8080/api/monitor/data-source-run-state/list'
OUT="$(cd "$(dirname "$0")" && pwd)"
CURL=(curl -sS --noproxy '*' -H 'Accept: application/json')

hit() { # name querystring
  local name="$1"; shift
  local url="$BASE"
  if [ "$#" -gt 0 ] && [ -n "$1" ]; then url="$BASE?$1"; fi
  { echo "# GET $url"; echo "# $(date -Is)"; echo "# HTTP status:"; } > "$OUT/$name.txt"
  "${CURL[@]}" -o "$OUT/$name.json" -w '%{http_code}\n' "$url" >> "$OUT/$name.txt" 2>&1
  echo >> "$OUT/$name.txt"
  if [ -s "$OUT/$name.json" ]; then
    node -e '
      const fs=require("fs");const p=process.argv[1];
      const j=JSON.parse(fs.readFileSync(p,"utf8"));
      const d=j.data||{};
      const recs=d.records||[];const cands=d.candidates||{};
      const g=(k)=>(cands[k]||[]).map(x=>x.value!==undefined?x.value:x);
      console.log("code="+j.code+" message="+(j.message===undefined?"(absent)":JSON.stringify(j.message)));
      console.log("records="+recs.length+"  客户端候选client="+g("clientId").length+" source="+g("sourceId").length+" status="+JSON.stringify(g("status")));
      console.log("statusCategory分布="+JSON.stringify(recs.reduce((a,r)=>{a[r.statusCategory]=(a[r.statusCategory]||0)+1;return a},{})));
      if(recs[0]) console.log("firstRecord="+JSON.stringify(recs[0]));
    ' "$OUT/$name.json" >> "$OUT/$name.txt" 2>&1
  else
    echo "(empty body)" >> "$OUT/$name.txt"
  fi
  echo "  -> $name $(grep -m1 -o 'code=[0-9]*' "$OUT/$name.txt" 2>/dev/null)"
}

hit 01-no-params ''
hit 02-client-single 'clientId=hosp-012'
hit 03-source-single 'sourceId=112-source-19c'
hit 04-status-running 'status=RUNNING'
hit 05-status-completed 'status=COMPLETED'
hit 06-status-unknown 'status=UNKNOWN'
hit 07-client-multi-or 'clientId=c-dssr1-0906-miss1&clientId=c-dssr1-0906-miss2'
hit 08-source-multi-or 'sourceId=s-dssr1-0906-m1&sourceId=s-dssr1-0906-m2&sourceId=s-dssr1-0906-m3'
hit 09-cross-dim-and 'clientId=hosp-012&sourceId=112-source-19c&status=RUNNING'
hit 10-cross-dim-and-nomatch 'clientId=hosp-012&sourceId=s-dssr1-0906-1'
hit 11-empty-success 'clientId=no-such-client-xyz'
hit 12-status-multi-or 'status=RUNNING&status=UNKNOWN'
hit 13-invalid-status 'status=BOGUS'
hit 14-invalid-status-mixed 'status=RUNNING&status=BOGUS'
hit 15-empty-status-value 'status='
hit 16-candidates-with-filter 'clientId=hosp-012'
hit 17-full-value-not-truncated-19char 'clientId=c-dssr1-0906-miss1'
hit 18-truncated-prefix-must-not-match 'clientId=c-dssr1-0906-mis'
hit 19-oversized-value 'clientId=AAAAAAAAAAAAAAAAAAAAAAAAAAAAAA'
hit 20-client-desc-rich 'clientId=c-dssr1-0906-a'
hit 21-source-notfound-config 'sourceId=s-dssr1-0906-m1'
hit 22-unknown-status-row 'clientId=c-dssr1-0906-d&sourceId=s-dssr1-0906-4'

echo "DONE"
