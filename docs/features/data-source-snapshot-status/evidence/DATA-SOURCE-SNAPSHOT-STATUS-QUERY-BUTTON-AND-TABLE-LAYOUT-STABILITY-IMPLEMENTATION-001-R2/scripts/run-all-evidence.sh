#!/usr/bin/env bash
# 重新生成 R2 全部机器证据。
# 本任务为纯文档事实分层纠正：不跑测试、不跑构建、不启停服务、
# 不访问数据库/ZooKeeper/Kafka、不重跑浏览器几何验证。
# 用法：run-all-evidence.sh [--staged]
set -u

WT=/agent/dss-query-button-table-layout-implementation-001-r2
BASE=8272d69bda0fa917cd569d85cbd61f6ed9e28b4e
SNAP=/tmp/dss-r2/worktrees-start-full.txt
HERE="$(cd "$(dirname "$0")" && pwd)"
EV="$(dirname "$HERE")"
MODE="${1:-}"

source /agent/cdc-config-platform/agent-env.sh >/dev/null 2>&1

echo "== §10 提交前强制校验（1～25）=="
python3 "$HERE/run-checks.py" "$WT" "$BASE" "$SNAP" > "$EV/checks/01-section10-checks.txt" 2>&1
echo "01 exit=$?"

echo "== 当前语气冲突扫描 =="
python3 "$HERE/conflicts-scan.py" > "$EV/checks/02-current-status-conflicts.txt" 2>&1
echo "02 exit=$?"

echo "== R1 报告 append-only 证明 =="
python3 "$HERE/verify-r1-report-append-only.py" "$WT" "$BASE" \
  > "$EV/records/r1-report-append-only-proof.txt" 2>&1
echo "append-only exit=$?"

echo "== 任务开始前 worktree 快照 =="
{
  echo "# 任务开始前 worktree 快照（55 个 worktree，path|HEAD|branch|mods）"
  cat "$SNAP"
} > "$EV/records/worktrees-at-start.txt"

echo "== Git 现场 =="
{
  echo "# R2 worktree 相对基准提交的变更"
  git -C "$WT" status --porcelain
  echo
  git -C "$WT" diff --numstat "$BASE"
  echo
  echo "# HEAD"
  git -C "$WT" rev-parse HEAD
  echo
  echo "# 远程 develop"
  git -C "$WT" ls-remote origin refs/heads/develop
} > "$EV/records/git-state.txt" 2>&1

if [ "$MODE" = "--staged" ]; then
  echo "== §10 校验（26～27，暂存后）=="
  python3 "$HERE/run-checks.py" "$WT" "$BASE" "$SNAP" --staged \
    > "$EV/checks/01-section10-checks.txt" 2>&1
  echo "staged exit=$?"
fi

# 规范文末换行：去掉文件尾部多余空白行，保证 `git diff --check` 净空
python3 - "$EV" <<'PY'
import os, sys
ev = sys.argv[1]
for sub in ('checks', 'records'):
    d = os.path.join(ev, sub)
    if not os.path.isdir(d):
        continue
    for fn in sorted(os.listdir(d)):
        p = os.path.join(d, fn)
        if not os.path.isfile(p):
            continue
        with open(p, encoding='utf-8') as fh:
            t = fh.read()
        with open(p, 'w', encoding='utf-8') as fh:
            fh.write(t.rstrip('\n') + '\n')
print('normalized trailing newlines')
PY
echo "records done"
