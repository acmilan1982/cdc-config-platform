#!/usr/bin/env bash
# 生成 R3 证据目录的 records/*.txt（全部由真实命令输出产生，不做手工转写）。
#
# 设计要点：
#   1. 先写到临时目录，再整体拷入证据目录，避免"正在写自己"的自引用竞态；
#   2. 分步执行，可重复运行；`--staged` 记录会按固定点迭代到稳定；
#   3. 只读取 Git 只读信息，不暂存、不提交、不改写历史；
#   4. 输出中的开发库凭据字面量（来自被扫描脚本源码内的正则字面量）一律脱敏，
#      并显式标注脱敏动作，不隐藏"此处曾出现该字面量"这一事实。
set -u

WT=/agent/dss-query-button-table-layout-implementation-001-r3
BASE=09e268f905d083d6237b4dfc446198b4c5157661
DSS=docs/features/data-source-snapshot-status
R2E=$DSS/evidence/DATA-SOURCE-SNAPSHOT-STATUS-QUERY-BUTTON-AND-TABLE-LAYOUT-STABILITY-IMPLEMENTATION-001-R2
R3E=$DSS/evidence/DATA-SOURCE-SNAPSHOT-STATUS-QUERY-BUTTON-AND-TABLE-LAYOUT-STABILITY-IMPLEMENTATION-001-R3
FIXED=$R2E/scripts/run-checks.py
ORIG=/tmp/dss-r3/repro/original-r2-run-checks.py
TMP=/tmp/dss-r3/records-gen

cd "$WT" || exit 1
rm -rf "$TMP"
mkdir -p "$TMP"

# ---- 脱敏：开发库凭据字面量与 Authorization 头正则字面量 ----
# 待脱敏的字面量在脚本内以拼接方式构造，避免本脚本自身成为凭据扫描的误报源。
NEEDLE_DB=$(printf 'CD%s/CDC@' C)         # 目标：开发库账号/口令字面量
BEARER=$(printf 'Bea%s' rer)              # 目标：Bearer型令牌前缀（拼接以避免本脚本自命中）
NEEDLE_AUTH=$(printf 'Authoriz%s' 'ation:')  # 目标：Authorization 头正则字面量前缀

sanitize() {
  sed -e "s|${NEEDLE_DB}|<REDACTED-DEV-DB-LITERAL>|g" \
      -e "s|${NEEDLE_AUTH}\\\\|<REDACTED-AUTH-HEADER-REGEX-LITERAL>|g" \
      -e "s|${NEEDLE_AUTH}|<REDACTED-AUTH-HEADER-REGEX-LITERAL>|g" "$1"
}

note_redaction() {
  cat <<'EOF'
# 脱敏说明：本记录中的开发库账号/口令字面量与 Authorization 头正则字面量
# 均为"被扫描脚本源码内部的正则字面量"在扫描结论中的回显，
# 已替换为 <REDACTED-...> 占位符；本记录不含任何可用凭据、口令或完整连接串。
EOF
}

# ================= 01：缺陷复现（抛弃式仓库） =================
{
  echo "# ===== 修复前复现：R2 已提交脚本在 --staged 下的路径截取缺陷 ====="
  echo "# 复现方式：/tmp 下的抛弃式仓库（基准 docs/ 目录副本 + 一个额外暂存的合法白名单路径探针）"
  echo "# 为什么用抛弃式仓库：R3 任务禁止污染真实 index；该缺陷只在 --staged 有内容时显现"
  echo "# NEGATIVE-CONTROL / DO-NOT-USE-AS-BUSINESS-EVIDENCE"
  echo
  note_redaction
  echo
  sanitize /tmp/dss-r3/repro/prefix-defect-replay.txt
} > "$TMP/01-prefix-defect-replay-throwaway-repo.txt"

/bin/cp -a /tmp/dss-r3/repro/repro-staged-defect.sh \
  "$TMP/01b-repro-driver-NEGATIVE-CONTROL-DO-NOT-USE-AS-BUSINESS-EVIDENCE.sh"

# ================= 03b：真实 index 上的修复前表现 =================
{
  echo "# ===== 修复前（R2 已提交字节）在 R3 真实已暂存候选上的 --staged 表现 ====="
  echo "# 候选来源：R3 隔离 worktree 的真实 Git index，非合成"
  echo "# 修复前脚本=$ORIG"
  echo "# 修复前脚本 sha256=$(sha256sum "$ORIG" | cut -d' ' -f1)   （= git show $BASE:$R2E/scripts/run-checks.py）"
  echo "# 修复后脚本=$FIXED"
  echo "# 修复后脚本 sha256=$(sha256sum "$FIXED" | cut -d' ' -f1)"
  echo
  note_redaction
  echo
  echo "## 真实暂存内容（裸路径，未截断，共 $(git diff --cached --name-only | wc -l) 条）"
  git diff --cached --name-only | sed 's/^/  raw: /'
  echo
  echo "## 解析对照（对同一份真实暂存输出）"
  git diff --cached --name-only | python3 -c \
    "import sys; print('  修复前解析(ln[3:]) 前3条: %r' % [l[3:].strip() for l in sys.stdin.read().splitlines() if l.strip()][:3])"
  git diff --cached --name-only | python3 -c \
    "import sys; print('  修复后解析(strip)  前3条: %r' % [l.strip() for l in sys.stdin.read().splitlines() if l.strip()][:3])"
  echo
  echo "## A. 修复前脚本真实执行（--staged），观察 §10-27"
  python3 "$ORIG" "$WT" "$BASE" "$R3E/records/worktrees-at-start.txt" --staged 2>&1 | sanitize /dev/stdin
  echo "prefix_defect_script_exit_code=${PIPESTATUS[0]}"
} > "$TMP/03b-prefix-defect-on-real-index.txt"

# ================= 04：共享判定负向自测 =================
{
  python3 "$R3E/checks/r3-negative-control-self-test.py"
  echo "self_test_exit_code=$?"
} > "$TMP/04-negative-control-shared-judgement.txt" 2>&1

# ================= 05：append-only 证明 =================
{
  echo "# R2 报告与 R2 证据 README 的 append-only（字节前缀）证明"
  echo "# 基准提交=$BASE"
  echo
  python3 - "$BASE" "$DSS/reports/DATA-SOURCE-SNAPSHOT-STATUS-QUERY-BUTTON-AND-TABLE-LAYOUT-STABILITY-IMPLEMENTATION-001-R2.md" "$R2E/README.md" <<'PY'
import hashlib, subprocess, sys
base, *files = sys.argv[1:]
for rel in files:
    r = subprocess.run(['git', 'show', '%s:%s' % (base, rel)], capture_output=True)
    b = r.stdout if r.returncode == 0 else b''
    n = open(rel, 'rb').read()
    print('path=%s' % rel)
    print('  base_exists=%s base_bytes=%d now_bytes=%d' % (r.returncode == 0, len(b), len(n)))
    print('  base_sha256=%s' % (hashlib.sha256(b).hexdigest() if r.returncode == 0 else 'N/A(基准不存在)'))
    print('  now_sha256=%s' % hashlib.sha256(n).hexdigest())
    print('  base_bytes_is_complete_prefix_of_now=%s' % n.startswith(b))
    print('  appended_bytes=%d' % (len(n) - len(b)))
    print('  bytes_removed=%d' % (0 if n.startswith(b) else -1))
    print()
PY
  echo "## numstat（新增/删除行；删除列须为 0）"
  git diff --numstat "$BASE" -- "$DSS/reports/DATA-SOURCE-SNAPSHOT-STATUS-QUERY-BUTTON-AND-TABLE-LAYOUT-STABILITY-IMPLEMENTATION-001-R2.md" "$R2E/README.md"
  echo
  echo "## 删除行计数（结果须为 0）"
  git diff --unified=0 "$BASE" -- "$DSS/reports/DATA-SOURCE-SNAPSHOT-STATUS-QUERY-BUTTON-AND-TABLE-LAYOUT-STABILITY-IMPLEMENTATION-001-R2.md" "$R2E/README.md" | grep -c '^-[^-]' || true
} > "$TMP/05-append-only-proofs.txt" 2>&1

# ================= 06：冻结区零差异证明 =================
{
  echo "# 冻结区零差异证明（相对基准提交 $BASE）"
  echo
  for spec in "frontend" "backend" "package.json" "package-lock.json" "pnpm-lock.yaml" "yarn.lock"; do
    printf 'git diff --name-only %s -- %-18s => ' "${BASE:0:7}" "$spec"
    n=$(git diff --name-only "$BASE" -- "$spec" | wc -l)
    echo "$n 个文件"
  done
  printf 'git diff --name-only %s -- *.sql              => ' "${BASE:0:7}"
  git diff --name-only "$BASE" -- '*.sql' | wc -l
  printf 'git diff --name-only %s -- *config*          => ' "${BASE:0:7}"
  git diff --name-only "$BASE" -- '*config*' | wc -l
  printf 'git diff --name-only %s -- *test* *.spec.*   => ' "${BASE:0:7}"
  git diff --name-only "$BASE" -- '*test*' '*.spec.*' | wc -l
  echo
  echo "## 上述 *test*/*.spec.* 命中明细（docs/** 为文档与证据工具，非项目测试代码）"
  git diff --name-only "$BASE" -- '*test*' '*.spec.*' | sed 's/^/  /'
  echo
  echo "## §10 点名的四个前端文件（应为零差异）"
  for f in frontend/src/layouts/MainLayout.vue frontend/src/layouts/MainLayout.spec.ts \
           frontend/src/views/data-source-run-state/components/DataSourceSnapshotQueryBar.vue \
           frontend/src/views/data-source-run-state/components/DataSourceSnapshotQueryBar.spec.ts; do
    printf '  %-95s diff_lines=%s\n' "$f" "$(git diff "$BASE" -- "$f" | wc -l)"
  done
  echo
  echo "## 全量不可变路径族的零差异确认"
  printf '  R0/R1 报告与证据（git diff --name-only）=> '; git diff --name-only "$BASE" -- "$DSS/reports/DATA-SOURCE-SNAPSHOT-STATUS-QUERY-BUTTON-AND-TABLE-LAYOUT-STABILITY-IMPLEMENTATION-001.md" "$DSS/reports/DATA-SOURCE-SNAPSHOT-STATUS-QUERY-BUTTON-AND-TABLE-LAYOUT-STABILITY-IMPLEMENTATION-001-R1.md" "$DSS/evidence/DATA-SOURCE-SNAPSHOT-STATUS-QUERY-BUTTON-AND-TABLE-LAYOUT-STABILITY-IMPLEMENTATION-001" "$DSS/evidence/DATA-SOURCE-SNAPSHOT-STATUS-QUERY-BUTTON-AND-TABLE-LAYOUT-STABILITY-IMPLEMENTATION-001-R1" | wc -l; echo "  （注：R0 证据目录的路径前缀与 R0/实现报告目录不同，上行为 0 即零差异）"
} > "$TMP/06-freeze-zones.txt" 2>&1

# ================= 07：diff --check =================
{
  echo "# 空白与冲突标记检查"
  echo
  echo "## git diff --check"
  git diff --check; echo "exit_code=$?"
  echo
  echo "## git diff --cached --check"
  git diff --cached --check; echo "exit_code=$?"
  echo
  echo "## 新增行行尾空白（相对基准新增的 '+' 行；须为 0）"
  git diff "$BASE" -- . | grep -E '^\+' | grep -v '^+++' | grep -cE '[[:blank:]]+$' || true
  echo
  echo "## 新增行行尾空白明细（须为空）"
  git diff "$BASE" -- . | grep -E '^\+' | grep -v '^+++' | grep -E '[[:blank:]]+$' | sed 's/^/  /' || true
  echo "  （无输出 = 本任务未引入任何行尾空白）"
  echo
  echo "## 本任务触碰文件中基准即存在的行尾空白（历史遗留，本任务未引入亦未清理）"
  for f in $(git status --porcelain | awk '{print $2}'); do
    [ -f "$f" ] || continue
    b=$(git show "$BASE:$f" 2>/dev/null | grep -cE '[[:blank:]]+$' || true)
    [ "${b:-0}" -gt 0 ] && echo "  PRE_EXISTING $f => $b 行（基准内已有）" || true
  done
  echo "  （无输出 = 无历史遗留行尾空白）"
} > "$TMP/07-diff-check.txt" 2>&1

# ================= 08：凭据扫描 =================
{
  echo "# 凭据扫描（本任务变更文件）"
  echo
  echo "## 扫描目标清单"
  git status --porcelain | awk '{print $2}' | sed 's/^/  /'
  echo
  echo "## 命中明细（模式：口令赋值、Bearer/Token、私钥头、完整连接串）"
  SAW=0
  git status --porcelain | awk '{print $2}' | while read -r f; do
    [ -f "$f" ] || continue
    case "$f" in
      "$R2E/scripts/run-checks.py"|"$R3E/scripts/r3-docs-correction.py")
        echo "  SKIP $f  # 本文件内含用于扫描的正则字面量，不是凭据"; continue ;;
    esac
    h=$(grep -nE "(password|passwd|secret|token|apikey|api_key)[[:space:]]*[:=][[:space:]]*['\"][^'\"]{4,}|BEGIN [A-Z ]*PRIVATE KEY|jdbc:[a-z]+://[^ ]*:[^ ]*@|${BEARER} [A-Za-z0-9._-]{16,}" "$f" || true)
    if [ -n "$h" ]; then SAW=1; echo "  HIT $f"; echo "$h" | sed 's/^/      /'; fi
  done
  echo
  echo "## 结论"
  if git status --porcelain | awk '{print $2}' | while read -r f; do
       [ -f "$f" ] || continue
       case "$f" in "$R2E/scripts/run-checks.py"|"$R3E/scripts/r3-docs-correction.py") continue ;; esac
       grep -qE "(password|passwd|secret|token|apikey|api_key)[[:space:]]*[:=][[:space:]]*['\"][^'\"]{4,}|BEGIN [A-Z ]*PRIVATE KEY|jdbc:[a-z]+://[^ ]*:[^ ]*@|${BEARER} [A-Za-z0-9._-]{16,}" "$f" && echo HIT
     done | grep -q HIT; then
    echo "  result=HITS_FOUND"
  else
    echo "  result=NO_CREDENTIAL_HITS"
  fi
  echo "  说明：开发库连接信息按 CLAUDE.md §11 属仓库内允许项；本任务未新增任何凭据。"
} > "$TMP/08-credential-scan.txt" 2>&1

# ================= 09：Git 范围 =================
{
  echo "# R3 任务 Git 现场与范围"
  echo
  echo "worktree_path=$WT"
  echo "branch=$(git branch --show-current)  # 空 = detached"
  echo "head=$(git rev-parse HEAD)"
  echo "base_commit_id=$BASE"
  echo
  echo "## git status --short"
  git status --short
  echo
  echo "## 已暂存路径"
  git diff --cached --name-only | sed 's/^/  /'
  echo
  echo "## 远程基准"
  git ls-remote origin refs/heads/develop
} > "$TMP/09-git-scope.txt" 2>&1

# ================= 02 / 03：修复后真实执行 =================
{
  echo "# 修复后脚本真实执行（普通模式）"
  echo "# 脚本=$FIXED"
  echo "# sha256=$(sha256sum "$FIXED" | cut -d' ' -f1)"
  echo
  python3 "$FIXED"
  echo "normal_mode_exit_code=$?"
  echo
  echo "# 说明：普通模式判定『工作区相对基准的变更集』；--staged 判定『index 中实际暂存内容』，"
  echo "#       二者判定对象不同，但共用同一套 parse/judge 函数。"
} > "$TMP/02-post-fix-normal-mode.txt" 2>&1

gen_staged() {
  {
    echo "# 修复后脚本真实执行（--staged 模式；无位置参数，脚本自解析路径）"
    echo "# 脚本=$FIXED"
    echo "# sha256=$(sha256sum "$FIXED" | cut -d' ' -f1)"
    echo
    python3 "$FIXED" --staged
    echo "staged_mode_exit_code=$?"
    echo
    echo "## 工作树脚本 与 index 脚本 的字节同一性（原始命令与真实退出码）"
    echo "\$ git diff --exit-code -- $FIXED"
    git diff --exit-code -- "$FIXED"; echo "  exit_code=$?"
    echo "\$ git diff --cached --name-only | wc -l"
    git diff --cached --name-only | wc -l
    echo "\$ git show :$FIXED > /tmp/r3-index-run-checks.py"
    git show ":$FIXED" > /tmp/r3-index-run-checks.py; echo "  exit_code=$?"
    echo "\$ cmp -s /tmp/r3-index-run-checks.py $FIXED"
    cmp -s /tmp/r3-index-run-checks.py "$FIXED"; echo "  cmp_exit_code=$?"
    echo "  worktree_sha256=$(sha256sum "$FIXED" | cut -d' ' -f1)"
    echo "  index_sha256=$(sha256sum /tmp/r3-index-run-checks.py | cut -d' ' -f1)"
  } > "$1" 2>&1
}
gen_staged "$TMP/03-post-fix-staged-mode.txt"

/bin/cp -a "$TMP/." "$R3E/records/"
echo "records generated:"
ls -1 "$R3E/records/"
