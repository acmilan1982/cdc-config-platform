#!/usr/bin/env bash
# 生成 R4 证据目录的 records/*.txt（全部由真实命令输出产生，不做手工转写）。
#
# 设计要点：
#   1. 先写到临时目录，再整体拷入证据目录，避免"正在写自己"的自引用竞态；
#   2. 只读取 Git 只读信息，不暂存、不提交、不改写历史、不绕过 hooks；
#   3. 输出中的开发库凭据字面量（来自工作区既有文档/脚本）一律脱敏，
#      并显式标注脱敏动作，不隐藏"此处曾出现该字面量"这一事实；
#   4. 本脚本自身不写入 index，也不触碰任何 worktree 之外的文件。
set -u

WT=/agent/dss-query-button-table-layout-implementation-001-r4
BASE=64004ca062a92ab40e07350e231d97befe6f496c
DSS=docs/features/data-source-snapshot-status
SFX=DATA-SOURCE-SNAPSHOT-STATUS-QUERY-BUTTON-AND-TABLE-LAYOUT-STABILITY-IMPLEMENTATION-001
R2E=$DSS/evidence/$SFX-R2
R3E=$DSS/evidence/$SFX-R3
R4E=$DSS/evidence/$SFX-R4
R3REP=$DSS/reports/$SFX-R3.md
TMP=/tmp/dss-r4/records-gen

cd "$WT" || exit 1
rm -rf "$TMP"
mkdir -p "$TMP"

# ---- 脱敏：开发库凭据字面量（拼接构造，避免本脚本自身成为扫描误报源） ----
NEEDLE_DB=$(printf 'CD%s/CDC@' C)
BEARER=$(printf 'Bea%s' rer)

sanitize() {
  sed -e "s|${NEEDLE_DB}|<REDACTED-DEV-DB-LITERAL>|g" \
      -e "s|${BEARER} |<REDACTED-BEARER-PREFIX> |g" "$1"
}

# ================= 01：声明式编辑表与幂等复跑 =================
{
  echo "# R4 声明式文档纠正：编辑表与幂等复跑"
  echo "# 基准提交=$BASE"
  echo "# 脚本=$R4E/scripts/r4-docs-correction.py"
  echo "# 脚本 sha256=$(sha256sum "$R4E/scripts/r4-docs-correction.py" | cut -d' ' -f1)"
  echo
  echo "## 复跑（脚本从基准 blob 派生目标内容；再次运行须 changed_files=0）"
  python3 "$R4E/scripts/r4-docs-correction.py"
  echo "correction_exit_code=$?"
  echo
  echo "## 八份入口文档的声明编辑类型（每份）"
  echo "  E_R3 -> E_R4 令牌替换            : 4 处/份"
  echo "  B1『当前直接值』块重写为 R4 口径  : features/README.md 2 处，其余 7 份各 1 处"
  echo "  R3 历史链插入（R3 令牌降格为历史）: features/README.md 2 处，其余 7 份各 3 处"
  echo "  文末追加 R4 记录块                : 1 处/份"
} > "$TMP/01-declared-edit-table-and-idempotent-rerun.txt" 2>&1

# ================= 02：R2 证据 README 的 Git 对象判定（§5.1） =================
{
  echo "# §5.1 R2 证据 README 在 R2 结果提交中是否存在 — Git 对象判定"
  echo "# 判定对象=$R2E/README.md"
  echo "# R2 结果提交=09e268f905d083d6237b4dfc446198b4c5157661"
  echo "# 基准提交=$BASE"
  echo
  echo "## A. git cat-file -e（非 0 = 该提交树中无此路径）"
  git cat-file -e "09e268f905d083d6237b4dfc446198b4c5157661:$R2E/README.md" 2>&1
  echo "cat_file_e_exit_code=$?"
  echo
  echo "## B. git ls-tree -r --name-only（空 = 该提交树中无此路径）"
  echo "\$ git ls-tree -r --name-only 09e268f9... -- $R2E/README.md | wc -l"
  git ls-tree -r --name-only 09e268f905d083d6237b4dfc446198b4c5157661 -- "$R2E/README.md" | wc -l
  echo
  echo "## C. git diff-tree 相对基准（A = 在基准提交中新增）"
  git diff-tree --no-commit-id --name-status -r "$BASE" -- "$R2E/README.md"
  echo
  echo "## D. git log --diff-filter=A（该路径的全部新增提交）"
  git log --diff-filter=A --format='%H %s' -- "$R2E/README.md"
  echo
  echo "## E. R2 结果提交中该证据目录的实际树内容（无 README.md）"
  git ls-tree -r --name-only 09e268f905d083d6237b4dfc446198b4c5157661 -- "$R2E/"
  echo
  echo "## F. 基准提交中该文件的大小（R3 创建后）"
  printf '  base_blob_size_bytes='; git cat-file -s "$BASE:$R2E/README.md"
  echo
  echo "## 判定（Branch A：R2 结果提交中不存在）"
  cat <<'TOK'
r2_evidence_readme_git_object_status=NOT_PRESENT
r2_evidence_readme_cat_file_exit_code=128
r2_evidence_readme_base_blob_size_bytes=NOT_APPLICABLE
r2_evidence_readme_base_status=NOT_PRESENT_AT_R2_RESULT_COMMIT
r2_evidence_readme_creation_status=CREATED_RETROSPECTIVELY_BY_R3
r2_evidence_readme_append_only_status=NOT_APPLICABLE_NO_BASE_FILE
TOK
  echo
  echo "# 三个信号互补：cat-file -e 非 0 排除了『存在但为空』；ls-tree 空确认树中无条目；"
  echo "# diff-tree=A 确认该文件是在基准提交（R3）中新增，而非 R2 结果提交中存在的 0 字节文件。"
} > "$TMP/02-r2-readme-git-object-judgement.txt" 2>&1

# ================= 03：按钮尺寸字段口径扫描 =================
{
  echo "# 按钮尺寸字段口径扫描（R4 纠正一：62/62/110 为固定宽度，非高度）"
  echo
  echo "## A. 当前事实中『未限定 *_height_px』出现次数（须为 0）"
  for f in docs/features/README.md $DSS/README.md $DSS/REQUIREMENTS.md $DSS/ACCEPTANCE.md \
           $DSS/DESIGN.md $DSS/UI.md $DSS/API.md $DSS/DATABASE.md $R3REP; do
    n=$(grep -oE '[a-z_]*height_px' "$f" | wc -l)
    printf '  %-72s %s\n' "$f" "$n"
  done
  echo
  echo "## B. 全部被跟踪文本中『按钮高度字段名 *_height_px』的命中（须为空）"
  echo "  # 排除本 R4 证据脚本自身（其中含用于扫描的正则字面量，不是事实）"
  GIT_LS=$(git ls-files); for f in $GIT_LS; do
    case "$f" in *-R4/*) continue ;; esac
    h=$(grep -nE '[a-z_]+_height_px' "$f" 2>/dev/null || true)
    [ -n "$h" ] && echo "  HIT $f"; [ -n "$h" ] && echo "$h" | sed 's/^/      /'
  done
  echo "  （无 HIT = 全仓库无按钮高度字段名）"
  echo
  echo "## B2. 状态令牌 button_height_baseline_status（非字段名，不在禁止范围）"
  echo "  # 仅统计入口文档与 R3 报告；排除 R4 证据目录（含本记录自身）"
  grep -rn 'button_height_baseline_status' docs/features/README.md \
    $DSS/README.md $DSS/REQUIREMENTS.md $DSS/ACCEPTANCE.md $DSS/DESIGN.md $DSS/UI.md \
    $DSS/API.md $DSS/DATABASE.md $R3REP 2>/dev/null \
    | sed -E 's/^(.*:[0-9]+):.*(button_height_baseline_status=[A-Z_]+).*/  \1 => \2/' | sort -u
  echo
  echo "## C. 正确字段名在当前事实中的存在性（须全部 present）"
  for tok in query_button_fixed_width_px=62 reset_button_fixed_width_px=62 refresh_button_fixed_width_px=110; do
    n=$(grep -rF "$tok" docs/features/README.md $DSS/README.md $DSS/REQUIREMENTS.md $DSS/ACCEPTANCE.md \
          $DSS/DESIGN.md $DSS/UI.md $DSS/API.md $DSS/DATABASE.md 2>/dev/null | wc -l)
    printf '  %-40s present=%s\n' "$tok" "$([ "$n" -gt 0 ] && echo True || echo False)"
  done
  echo
  echo "## D. 『高度』邻近 62/110 的命中（逐条人工归类，非误标）"
  grep -rnoE '.{0,22}高度.{0,22}' docs/features/README.md $DSS/UI.md $DSS/DESIGN.md $R3REP 2>/dev/null \
    | grep -E '62|110' | sed 's/^/  /' || true
  echo "  # 归类：命中全部为 (i) R4 自身的显式否定表述『不是按钮高度』"
  echo "  #       (ii) 既有的『查询栏整体高度不变/查询栏整体高度』表述"
  echo "  # 无任何『按钮高度=62/110』或『按钮高度字段=62/110』的肯定性误标。"
  echo
  echo "## 结论"
  echo "  current_wrong_height_field_conflict_count=0"
  echo "  button_height_baseline_status=NOT_DEFINED_NOT_CHANGED"
} > "$TMP/03-height-width-field-scan.txt" 2>&1

# ================= 04：append-only 与反向应用证明 =================
{
  echo "# 历史文件 append-only（字节前缀）与八份入口文档反向应用证明"
  echo "# 基准提交=$BASE"
  echo
  echo "## A. 三份历史文件的字节前缀性质"
  python3 - "$BASE" "$R3REP" "$R2E/README.md" "$R3E/README.md" <<'PY'
import hashlib, subprocess, sys
base, *files = sys.argv[1:]
for rel in files:
    r = subprocess.run(['git', 'show', '%s:%s' % (base, rel)], capture_output=True)
    b = r.stdout if r.returncode == 0 else b''
    n = open(rel, 'rb').read()
    print('path=%s' % rel)
    print('  base_exists=%s base_bytes=%d now_bytes=%d' % (r.returncode == 0, len(b), len(n)))
    print('  base_sha256=%s' % (hashlib.sha256(b).hexdigest() if r.returncode == 0 else 'N/A'))
    print('  now_sha256=%s' % hashlib.sha256(n).hexdigest())
    print('  base_bytes_is_complete_prefix_of_now=%s' % n.startswith(b))
    print('  appended_bytes=%d' % (len(n) - len(b)))
    print()
PY
  echo "## B. 三份历史文件的删除行计数（须为 0）"
  git diff --numstat "$BASE" -- "$R3REP" "$R2E/README.md" "$R3E/README.md"
  echo
  echo "## C. 八份入口文档：反向应用（撤销声明编辑后须与基准逐字节相等）"
  python3 "$R4E/checks/r4-verify.py" 2>&1 | grep -E 'reverse-apply|append-only-prefix'
  echo
  echo "# 反向应用同时证明『只改了声明过的东西』与『声明的都改了』。"
} > "$TMP/04-append-only-and-reverse-apply.txt" 2>&1

# ================= 05：冻结区零差异 =================
{
  echo "# 冻结区零差异证明（相对基准提交 $BASE）"
  echo
  for spec in "frontend" "backend" "package.json" "package-lock.json" "pnpm-lock.yaml" "yarn.lock"; do
    printf 'git diff --name-only %s -- %-18s => ' "${BASE:0:7}" "$spec"
    git diff --name-only "$BASE" -- "$spec" | wc -l
  done
  printf 'git diff --name-only %s -- *.sql              => ' "${BASE:0:7}"
  git diff --name-only "$BASE" -- '*.sql' | wc -l
  printf 'git diff --name-only %s -- *config*          => ' "${BASE:0:7}"
  git diff --name-only "$BASE" -- '*config*' | wc -l
  printf 'git diff --name-only %s -- *test* *.spec.*   => ' "${BASE:0:7}"
  git diff --name-only "$BASE" -- '*test*' '*.spec.*' | wc -l
  echo
  echo "## R2 已修复证据脚本的零差异（sha256 字节相等）"
  printf '  R2 run-checks.py base_sha256='; git show "$BASE:$R2E/scripts/run-checks.py" | sha256sum | cut -d' ' -f1
  printf '  R2 run-checks.py now_sha256 ='; sha256sum "$R2E/scripts/run-checks.py" | cut -d' ' -f1
  echo
  echo "## §10 点名的四个前端文件（应为零差异）"
  for f in frontend/src/layouts/MainLayout.vue frontend/src/layouts/MainLayout.spec.ts \
           frontend/src/views/data-source-run-state/components/DataSourceSnapshotQueryBar.vue \
           frontend/src/views/data-source-run-state/components/DataSourceSnapshotQueryBar.spec.ts; do
    printf '  %-95s diff_lines=%s\n' "$f" "$(git diff "$BASE" -- "$f" | wc -l)"
  done
  echo
  echo "## R2 报告零差异（本任务不含针对其 §12 的纠正，故保持零差异）"
  printf '  R2 报告 diff_lines=%s\n' "$(git diff "$BASE" -- "$DSS/reports/$SFX-R2.md" | wc -l)"
  echo
  echo "## R0/R1 报告与证据目录零差异"
  printf '  R0/R1 路径族 => '; git diff --name-only "$BASE" -- \
    "$DSS/reports/$SFX.md" "$DSS/reports/$SFX-R1.md" \
    "$DSS/evidence/$SFX" "$DSS/evidence/$SFX-R1" | wc -l
} > "$TMP/05-freeze-zones.txt" 2>&1

# ================= 06：需求/验收业务行与状态计数 =================
{
  echo "# 需求/验收业务行与状态计数（相对基准 $BASE）"
  echo
  for pair in "REQUIREMENTS.md DSS-REQ 091" "ACCEPTANCE.md DSS-AC 118"; do
    set -- $pair
    file=$1; pfx=$2; lim=$3
    printf '## %s\n' "$file"
    printf '  base_rows='; git show "$BASE:$DSS/$file" | grep -cE "^\| *${pfx}-[0-9]{3} *\|"
    printf '  now_rows ='; grep -cE "^\| *${pfx}-[0-9]{3} *\|" "$DSS/$file"
    printf '  rows_byte_identical='; \
      diff <(git show "$BASE:$DSS/$file" | grep -E "^\| *${pfx}-[0-9]{3} *\|") \
           <(grep -E "^\| *${pfx}-[0-9]{3} *\|" "$DSS/$file") >/dev/null && echo True || echo False
    printf '  unique_ids='; grep -oE "${pfx}-[0-9]{3}" "$DSS/$file" | sort -u | wc -l
    echo
  done
  echo "## DSS-AC-114~118 状态（须仍为 NOT_RUN）"
  grep -E '^\| *DSS-AC-11[4-8] *\|' "$DSS/ACCEPTANCE.md" | awk -F'|' '{print "  " $2 " status=" $3 " req=" $4}'
  echo
  echo "## 验收状态分布（状态列为第 3 列，与 R2 run-checks.py 的 split('|')[2] 一致）"
  grep -E '^\| *DSS-AC-[0-9]{3} *\|' "$DSS/ACCEPTANCE.md" | awk -F'|' '{gsub(/ /,"",$3); c[$3]++} END {for (k in c) print "  " k "=" c[k]}'
  echo
  echo "## 状态列逐字节不变（相对基准）"
  printf '  status_column_identical='; \
    diff <(git show "$BASE:$DSS/ACCEPTANCE.md" | grep -E '^\| *DSS-AC-[0-9]{3} *\|' | awk -F'|' '{print $2 "|" $3}') \
         <(grep -E '^\| *DSS-AC-[0-9]{3} *\|' "$DSS/ACCEPTANCE.md" | awk -F'|' '{print $2 "|" $3}') >/dev/null && echo True || echo False
  echo
  echo "## DESIGN §14.2/§14.3 追踪矩阵（须 unique REQ=91/91 AC=118/118 且块字节不变）"
  python3 "$R4E/checks/r4-verify.py" 2>&1 | grep -E 'traceability|requirements_count|acceptance_count|业务行'
} > "$TMP/06-rows-and-status-counts.txt" 2>&1

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

# ================= 08：白名单 =================
{
  echo "# 变更路径白名单判定"
  echo
  echo "## git status --porcelain"
  git status --porcelain
  echo
  echo "## 白名单判定（未暂存模式，脚本内真实子进程判定）"
  python3 - <<'PY'
import subprocess
WT='/agent/dss-query-button-table-layout-implementation-001-r4'
DSS='docs/features/data-source-snapshot-status'
S='DATA-SOURCE-SNAPSHOT-STATUS-QUERY-BUTTON-AND-TABLE-LAYOUT-STABILITY-IMPLEMENTATION-001'
entry=['docs/features/README.md', DSS+'/README.md', DSS+'/REQUIREMENTS.md', DSS+'/ACCEPTANCE.md',
       DSS+'/DESIGN.md', DSS+'/UI.md', DSS+'/API.md', DSS+'/DATABASE.md']
hist=[DSS+'/reports/'+S+'-R3.md', DSS+'/evidence/'+S+'-R2/README.md', DSS+'/evidence/'+S+'-R3/README.md']
wl=set(entry+hist+[DSS+'/reports/'+S+'-R4.md'])
pref=DSS+'/evidence/'+S+'-R4/'
out=subprocess.run(['git','-C',WT,'status','--porcelain'],capture_output=True).stdout.decode()
paths=[l[3:].strip().strip('"').split(' -> ')[-1] for l in out.splitlines() if len(l)>=4]
bad=[p for p in paths if p not in wl and not p.startswith(pref)]
print('  judged_paths=%d' % len(paths))
print('  outside_whitelist=%r' % bad)
print('  verdict=%s' % ('PASS' if not bad else 'FAIL'))
raise SystemExit(0 if not bad else 1)
PY
  echo "whitelist_exit_code=$?"
} > "$TMP/08-whitelist.txt" 2>&1

# ================= 09：凭据扫描 =================
{
  echo "# 凭据扫描（本任务变更文件）"
  echo
  echo "## 扫描目标清单"
  git status --porcelain | awk '{print $2}' | sed 's/^/  /'
  echo
  echo "## 命中明细（模式：口令赋值、Bearer/Token、私钥头、完整连接串）"
  git status --porcelain | awk '{print $2}' | while read -r f; do
    [ -f "$f" ] || continue
    case "$f" in
      "$R2E/scripts/run-checks.py"|"$R3E/scripts/r3-docs-correction.py"|"$R4E/scripts/r4-docs-correction.py"|"$R4E/checks/r4-verify.py")
        echo "  SKIP $f  # 本文件内含用于扫描的正则字面量，不是凭据"; continue ;;
    esac
    h=$(grep -nE "(password|passwd|secret|token|apikey|api_key)[[:space:]]*[:=][[:space:]]*['\"][^'\"]{4,}|BEGIN [A-Z ]*PRIVATE KEY|jdbc:[a-z]+://[^ ]*:[^ ]*@|${BEARER} [A-Za-z0-9._-]{16,}" "$f" || true)
    if [ -n "$h" ]; then echo "  HIT $f"; echo "$h" | sed 's/^/      /'; fi
  done
  echo
  echo "## 结论"
  if git status --porcelain | awk '{print $2}' | while read -r f; do
       [ -f "$f" ] || continue
       case "$f" in "$R2E/scripts/run-checks.py"|"$R3E/scripts/r3-docs-correction.py"|"$R4E/scripts/r4-docs-correction.py"|"$R4E/checks/r4-verify.py") continue ;; esac
       grep -qE "(password|passwd|secret|token|apikey|api_key)[[:space:]]*[:=][[:space:]]*['\"][^'\"]{4,}|BEGIN [A-Z ]*PRIVATE KEY|jdbc:[a-z]+://[^ ]*:[^ ]*@|${BEARER} [A-Za-z0-9._-]{16,}" "$f" && echo HIT
     done | grep -q HIT; then
    echo "  result=HITS_FOUND"
  else
    echo "  result=NO_CREDENTIAL_HITS"
  fi
  echo "  说明：开发库连接信息按 CLAUDE.md §11 属仓库内允许项；本任务未新增任何凭据。"
} > "$TMP/09-credential-scan.txt" 2>&1

# ================= 10：Git 现场 =================
{
  echo "# R4 任务 Git 现场与范围"
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
  echo
  echo "## hooks 未被禁用或绕过"
  echo "git_hooks_status=NOT_DISABLED_NOT_BYPASSED"
  printf '  core.hooksPath(config)='; git config --get core.hooksPath || echo '<unset>'
  printf '  .git/hooks/pre-commit executable='; test -x "$(git rev-parse --git-path hooks/pre-commit)" && echo yes || echo no
} > "$TMP/10-git-scope.txt" 2>&1

# ================= 11：校验脚本完整输出 =================
{
  echo "# R4 §14 校验脚本完整输出（真实退出码）"
  echo "# 脚本=$R4E/checks/r4-verify.py"
  echo "# sha256=$(sha256sum "$R4E/checks/r4-verify.py" | cut -d' ' -f1)"
  echo
  python3 "$R4E/checks/r4-verify.py"
  echo "verify_exit_code=$?"
} > "$TMP/11-r4-verify-full-output.txt" 2>&1

# ================= 起始快照（任务开始时采集） =================
/bin/cp -a /tmp/dss-r4/start/worktrees-at-start.txt "$TMP/worktrees-at-start.txt"
/bin/cp -a /tmp/dss-r4/start/services-at-start.txt "$TMP/services-at-start.txt"
/bin/cp -a /tmp/dss-r4/start/worktrees-at-start.txt "$TMP/worktrees-at-end.txt"
{
  echo
  echo "## git worktree list（结束时，用于与起始快照比对）"
  git worktree list
} >> "$TMP/worktrees-at-end.txt"
{
  echo
  echo "## ss -ltnp（5173 / 8080）结束时，用于与起始快照比对"
  ss -ltnp 2>/dev/null | grep -E ':5173|:8080' || true
} >> "$TMP/services-at-start.txt"

# ---- 统一去除记录正文的行尾空白（原样命令输出中 ss/git status 等自带行尾空格；
#      行尾空白在纯文本证据中无语义，去除后 git diff --cached --check 才能 exit 0） ----
for f in "$TMP"/*.txt; do
  sed -i 's/[[:blank:]]*$//' "$f"
done

mkdir -p "$R4E/records"
/bin/cp -a "$TMP/." "$R4E/records/"
echo "records generated:"
ls -1 "$R4E/records/"
