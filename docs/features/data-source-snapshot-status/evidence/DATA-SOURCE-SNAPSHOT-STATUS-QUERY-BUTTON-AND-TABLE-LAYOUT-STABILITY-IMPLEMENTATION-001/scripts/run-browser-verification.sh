#!/usr/bin/env bash
# §9/§10 端到端复跑入口：版本证明 → 真实 Chromium 采样 → 严格判定 → 负向自证。
# 用法: run-browser-verification.sh <worktree-root> <origin> <evidence-root> [cdp-port]
set -uo pipefail

WT="${1:?worktree root}"
ORIGIN="${2:?origin}"
EV="${3:?evidence root}"
CDP_PORT="${4:-9222}"
S="${EV}/scripts"
B="${EV}/browser"
V="${EV}/versions"
LOGDIR="/tmp/dss-query-button-table-layout-implementation-001"

mkdir -p "$B" "$V" "$LOGDIR"
source /agent/cdc-config-platform/agent-env.sh >/dev/null 2>&1

rc() { echo "EXIT[$1]=$2"; }
STEP_FAIL=0

# ---------------------------------------------------------------- 1. 版本证明
echo "### [1/4] version proof"
bash "$S/version-proof.sh" "$WT" "$ORIGIN" "$V" > "$LOGDIR/version-proof.txt" 2>&1
vprc=$?; rc version-proof "$vprc"; [ $vprc -ne 0 ] && STEP_FAIL=1
cat "$LOGDIR/version-proof.txt"
echo

# ---------------------------------------------------------------- 2. 启动 headless Chromium
echo "### [2/4] launch headless chromium"
PROFILE="$(mktemp -d /tmp/dss-qbt-chrome-XXXXXX)"
CHROME_BIN=/usr/bin/google-chrome
"$CHROME_BIN" --version
"$CHROME_BIN" --version > "$V/chrome-version.txt" 2>&1
node -v > "$V/node-version.txt" 2>&1

nohup "$CHROME_BIN" \
  --headless=new \
  --remote-debugging-port="$CDP_PORT" \
  --remote-allow-origins='*' \
  --user-data-dir="$PROFILE" \
  --no-first-run --no-default-browser-check \
  --disable-gpu \
  --no-proxy-server \
  --hide-scrollbars=false \
  --window-size=1280,800 \
  about:blank > "$LOGDIR/chrome-$CDP_PORT.log" 2>&1 &
CHROME_PID=$!
disown
echo "chrome_pid=$CHROME_PID profile=$PROFILE"
for _ in $(seq 1 50); do
  curl --noproxy '*' -sf "http://127.0.0.1:$CDP_PORT/json/version" >/dev/null 2>&1 && break
  sleep 0.2
done
curl --noproxy '*' -s "http://127.0.0.1:$CDP_PORT/json/version" > "$V/cdp-version.json" || { echo "CDP_UNREACHABLE"; STEP_FAIL=1; }
cat "$V/cdp-version.json"; echo

# ---------------------------------------------------------------- 3. 真实采样
echo "### [3/4] real page sampling (§9.2/§9.3)"
node "$S/sample-browser.mjs" --cdp-port "$CDP_PORT" --origin "$ORIGIN" --out "$B" > "$LOGDIR/sampler.txt" 2>&1
samprc=$?; rc sampler "$samprc"; cat "$LOGDIR/sampler.txt"
[ $samprc -ne 0 ] && STEP_FAIL=1

# ---------------------------------------------------------------- 4. 严格判定 + 负向自证
echo "### [4/4] strict judgement (§9.4) + negative self-proof (§10)"
node "$S/judge-run.mjs" --raw "$B/raw-geometry.json" --out "$B/judgement.json" > "$LOGDIR/judgement.txt" 2>&1
jrc=$?; rc judgement "$jrc"; cat "$LOGDIR/judgement.txt"
[ $jrc -ne 0 ] && STEP_FAIL=1

node "$S/judge-run.mjs" --raw "$B/raw-geometry.json" --inject-px 0.001 --out "$B/judgement-negative-control.json" > "$LOGDIR/negative-control.txt" 2>&1
ncrc=$?; rc negative_control "$ncrc"; cat "$LOGDIR/negative-control.txt"
# 负向自证必须“真实非零退出”；若其为 0 则说明判定函数形同虚设。
if [ "$ncrc" -eq 0 ]; then
  echo "NEGATIVE_CONTROL_DID_NOT_FAIL => harness is vacuous"
  nc_ok=no
else
  nc_ok=yes
fi
echo "NEGATIVE_CONTROL_EXITED_NONZERO=$nc_ok"

echo
echo "SUMMARY version_proof=$vprc sampler=$samprc judgement=$jrc negative_control=$ncrc(expect_nonzero) negative_control_ok=$nc_ok"

# 关闭本次自建 Chromium（只关本脚本拉起的 PID，不做模糊 kill）
kill "$CHROME_PID" 2>/dev/null
echo "chrome_stopped_pid=$CHROME_PID"

if [ "$STEP_FAIL" -ne 0 ] || [ "$nc_ok" != yes ]; then
  echo "OVERALL_EXIT=1"
  exit 1
fi
echo "OVERALL_EXIT=0"
exit 0
