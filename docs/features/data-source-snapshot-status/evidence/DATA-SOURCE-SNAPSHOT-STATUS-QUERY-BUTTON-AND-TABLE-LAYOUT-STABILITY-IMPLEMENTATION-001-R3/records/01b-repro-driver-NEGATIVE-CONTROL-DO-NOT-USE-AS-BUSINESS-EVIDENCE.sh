#!/usr/bin/env bash
# 复现 R2 已提交脚本 run-checks.py 的 --staged 路径截取缺陷。
#
# 为什么在临时仓库中复现：
#   R3 worktree 在修复前是干净的（没有已暂存路径），而该缺陷只在
#   `git diff --cached --name-only` 非空时才显现。任务禁止污染真实 index
#   （§5.3.3），因此使用 /tmp 下的抛弃式仓库：复制基准的 docs/ 目录作为
#   基线提交，再额外暂存一个**合法白名单路径**，观察合法路径被误判为越界。
#   脚本本身使用 R2 提交中的原始字节，未做任何修改。
#
# NEGATIVE-CONTROL / DO-NOT-USE-AS-BUSINESS-EVIDENCE
#   本仓库与其中的探针文件只用于证明校验工具的解析缺陷，
#   不构成任何业务失败证据，也不是真实项目的变更。
set -u

SRC=/agent/dss-query-button-table-layout-implementation-001-r3
REPO=/tmp/dss-r3/repro/throwaway-repo
ORIG=/tmp/dss-r3/repro/original-r2-run-checks.py
PROBE=docs/features/data-source-snapshot-status/evidence/DATA-SOURCE-SNAPSHOT-STATUS-QUERY-BUTTON-AND-TABLE-LAYOUT-STABILITY-IMPLEMENTATION-001-R2/NEGATIVE-CONTROL-probe-DO-NOT-USE-AS-BUSINESS-EVIDENCE.txt

rm -rf "$REPO"
mkdir -p "$REPO"
git -C "$REPO" init -q
git -C "$REPO" config user.email "repro@local"
git -C "$REPO" config user.name "repro"
/bin/cp -a "$SRC/docs" "$REPO/docs"
git -C "$REPO" add docs
git -C "$REPO" commit -q -m "repro baseline = R3 base docs tree"
BASE=$(git -C "$REPO" rev-parse HEAD)

printf 'NEGATIVE-CONTROL / DO-NOT-USE-AS-BUSINESS-EVIDENCE\n' > "$REPO/$PROBE"
git -C "$REPO" add "$PROBE"

echo "# ===== 修复前复现：R2 已提交脚本的 --staged 路径截取缺陷 ====="
echo "# original_script=$ORIG"
echo "# original_script_sha256=$(sha256sum "$ORIG" | cut -d' ' -f1)"
echo "# throwaway_repo=$REPO  (NEGATIVE-CONTROL / DO-NOT-USE-AS-BUSINESS-EVIDENCE)"
echo "# 说明：仓库内容 = 基准提交的 docs/ 目录副本 + 一个额外暂存的合法白名单路径探针；"
echo "#       真实项目工作区与 index 均未被触碰。"
echo "# base=$BASE"
echo
echo "# 暂存内容（真实 git 输出，纯路径、不截断）"
git -C "$REPO" diff --cached --name-only | sed 's/^/  raw: /'
echo
echo "# 原始脚本第 434 行的解析结果（截断前 3 个字符）"
git -C "$REPO" diff --cached --name-only | python3 -c \
  "import sys; print('  parsed: %r' % [ln[3:].strip() for ln in sys.stdin.read().splitlines() if ln.strip()])"
echo "# 正确解析（完整行）"
git -C "$REPO" diff --cached --name-only | python3 -c \
  "import sys; print('  parsed: %r' % [ln.strip() for ln in sys.stdin.read().splitlines() if ln.strip()])"
echo
echo "# 真实执行原始脚本（--staged）"
python3 "$ORIG" "$REPO" "$BASE" /dev/null --staged
echo "original_script_exit_code=$?"
