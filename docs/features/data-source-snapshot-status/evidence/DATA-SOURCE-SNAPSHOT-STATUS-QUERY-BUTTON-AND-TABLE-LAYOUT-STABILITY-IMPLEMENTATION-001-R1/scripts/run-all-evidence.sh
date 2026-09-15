#!/usr/bin/env bash
# 重新生成 R1 全部机器证据（不启停服务、不访问数据库/ZooKeeper/Kafka、不重跑浏览器几何）。
# 用法：run-all-evidence.sh
set -u

WT=/agent/dss-query-button-table-layout-implementation-001-r1
BASE=d77e174a912daf852837c9658f13672918fc766e
SNAP=/tmp/dss-r1/worktrees-start-full.txt
HERE="$(cd "$(dirname "$0")" && pwd)"
EV="$(dirname "$HERE")"

source /agent/cdc-config-platform/agent-env.sh >/dev/null 2>&1

python3 "$HERE/check-frontend-reference-only.py" "$WT" "$BASE" > "$EV/checks/01-frontend-reference-only.txt" 2>&1
echo "01 exit=$?"
python3 "$HERE/verify-docs-roundtrip.py" "$WT" "$BASE" > "$EV/checks/02-docs-roundtrip.txt" 2>&1
echo "02 exit=$?"
python3 "$HERE/run-checks.py" "$WT" "$BASE" "$SNAP" > "$EV/checks/03-section9-checks.txt" 2>&1
echo "03 exit=$?"
python3 "$HERE/conflicts-scan.py" > "$EV/checks/04-current-status-conflicts.txt" 2>&1
echo "04 exit=$?"
python3 "$HERE/verify-report-append-only.py" "$WT" "$BASE" > "$EV/records/append-only-proof.txt" 2>&1
echo "append-only exit=$?"

{
  echo "# 定向测试（仅证明 §5 注释/测试显示名改动未破坏用例发现与执行；不作为正式验收，不替代 DSS-AC-114~118）"
  echo "# worktree: $WT  base: $BASE"
  echo "# 命令: node node_modules/.bin/vitest run src/layouts/MainLayout.spec.ts src/views/data-source-run-state/components/DataSourceSnapshotQueryBar.spec.ts --reporter=basic"
  echo
  (cd "$WT/frontend" && node node_modules/.bin/vitest run \
     src/layouts/MainLayout.spec.ts \
     src/views/data-source-run-state/components/DataSourceSnapshotQueryBar.spec.ts \
     --reporter=basic)
} > "$EV/checks/05-targeted-tests.txt" 2>&1
echo "05 exit=$?"

{
  echo "# 任务开始前 worktree 快照（53 个既有 worktree，path|HEAD|branch|mods）"
  cat "$SNAP"
} > "$EV/records/worktrees-at-start.txt"

{
  echo "# R1 结束时 worktree 列表"
  git -C "$WT" worktree list --porcelain
  echo
  echo "# R1 worktree 相对基准提交的变更"
  git -C "$WT" status --porcelain
  echo
  git -C "$WT" diff --numstat "$BASE"
  echo
  echo "# HEAD"
  git -C "$WT" rev-parse HEAD
} > "$EV/records/git-state.txt" 2>&1

# 规范文末换行：去掉文件尾部多余的空白行，保证 `git diff --check` 净空
python3 - "$EV" <<'PY'
import os, sys
ev = sys.argv[1]
for sub in ('checks', 'records'):
    for fn in sorted(os.listdir(os.path.join(ev, sub))):
        p = os.path.join(ev, sub, fn)
        if not os.path.isfile(p):
            continue
        with open(p, encoding='utf-8') as fh:
            t = fh.read()
        with open(p, 'w', encoding='utf-8') as fh:
            fh.write(t.rstrip('\n') + '\n')
print('normalized trailing newlines')
PY
echo "records done"
