#!/usr/bin/env bash
# R1 强制校验脚本（DATA-SOURCE-SNAPSHOT-STATUS-QUERY-BUTTON-AND-TABLE-LAYOUT-STABILITY-FORMAL-ACCEPTANCE-001-R1，提示词 §13 共 30 项）。
#
# 约定：
#   * 任何一项失败即累计失败，脚本最终以非零退出码结束；
#   * 不以「搜索不到目标的空匹配」伪造 PASS：每项都同时验证期望数量或目标集合；
#   * 只执行只读 Git 命令、文件读取、文本比较与进程/端口存在性检查；
#     不访问数据库、ZooKeeper、Kafka；不启停任何服务；不清理任何 worktree。
#
# 本脚本必须在**提交与推送之前**运行（§13 要求「提交前至少真实执行并保存」）。

set -u

WORKTREE=/agent/dss-query-button-table-layout-formal-acceptance-001-r1
MAIN_WORKTREE=/agent/cdc-config-platform
BASE=71368a0a338209af564103291f5a51bc03e60bb4
EV="$WORKTREE/docs/features/data-source-snapshot-status/evidence/DATA-SOURCE-SNAPSHOT-STATUS-QUERY-BUTTON-AND-TABLE-LAYOUT-STABILITY-FORMAL-ACCEPTANCE-001-R1"
LIB="$EV/checks/check-r1-lib.py"
F="$WORKTREE/docs/features"
D="$F/data-source-snapshot-status"
R0_REPORT="$D/reports/DATA-SOURCE-SNAPSHOT-STATUS-QUERY-BUTTON-AND-TABLE-LAYOUT-STABILITY-FORMAL-ACCEPTANCE-001.md"
R1_REPORT="$D/reports/DATA-SOURCE-SNAPSHOT-STATUS-QUERY-BUTTON-AND-TABLE-LAYOUT-STABILITY-FORMAL-ACCEPTANCE-001-R1.md"
R0_ZKEV="$D/evidence/DATA-SOURCE-SNAPSHOT-STATUS-QUERY-BUTTON-AND-TABLE-LAYOUT-STABILITY-FORMAL-ACCEPTANCE-001/database/zookeeper-kafka-boundary.md"
SNAPSHOT=/tmp/dss-query-button-table-layout-formal-acceptance-001-r1/snapshot-start.txt

DOCS=(
  "$F/README.md"
  "$D/README.md"
  "$D/REQUIREMENTS.md"
  "$D/ACCEPTANCE.md"
  "$D/DESIGN.md"
  "$D/UI.md"
  "$D/API.md"
  "$D/DATABASE.md"
)

R1_ENTRY="CHATGPT_QUERY_BUTTON_AND_TABLE_LAYOUT_STABILITY_FORMAL_ACCEPTANCE_R1_REVIEW_FROM_GIT_THEN_PROJECT_OWNER_FINAL_ACCEPTANCE_DECISION"
R0_ENTRY_SUFFIX="（**当前直接值（2026-09-15 正式验收执行任务提交并推送后）**："
R1_REC_MARK="查询按钮与表格布局稳定性正式验收 ZooKeeper 边界与结果事实 R1 纠正记录"
QUAL_MARK="历史表述（2026-09-15 R0 记录原文的笼统写法）"
# 拼接构造，避免本校验脚本自身在证据目录内产生该字面量（否则 17b 会误报）
WRONG_FIELD="formal_acceptance_task_initiated_zookeeper_node_operation_status=""NONE"
RIGHT_FIELD="formal_acceptance_task_initiated_zookeeper_node_operation_status=READ_ONLY_LS_ONE"
VIOLATED="zookeeper_boundary_compliance_status=VIOLATED_READ_PROHIBITION"

PASSED=0
FAILED_N=0
FAILED_LIST=()

pass() { PASSED=$((PASSED + 1)); printf 'CHECK %s PASS  %s\n' "$1" "$2"; }
fail() { FAILED_N=$((FAILED_N + 1)); FAILED_LIST+=("$1"); printf 'CHECK %s FAIL  %s\n' "$1" "$2"; }

assert_eq() { # n label expected actual
  if [ "$3" = "$4" ]; then pass "$1" "$2 (=$4)"; else fail "$1" "$2 [expected=$3 actual=$4]"; fi
}

# 统计某个字面量在若干文件中的出现次数： cnt <literal> <file...>
cnt() { grep -ohF "$1" "${@:2}" 2>/dev/null | wc -l; }
# 统计匹配某正则的行数： cntre <regex> <file...>
cntre() { grep -hE "$1" "${@:2}" 2>/dev/null | wc -l; }

echo "===================================================================================================="
echo "R1 强制校验（提示词 §13，30 项）"
echo "worktree=$WORKTREE"
echo "base_commit_id=$BASE"
echo "run_at=$(date -u +%Y-%m-%dT%H:%M:%SZ)"
echo "===================================================================================================="

# ---------------------------------------------------------------- 01
R=$(git -C "$WORKTREE" ls-remote origin refs/heads/develop 2>/dev/null | awk '{print $1}')
assert_eq 01 "origin/develop 与 ls-remote 在任务开始时等于基准提交" "$BASE" "$R"
assert_eq 01b "任务开始快照记录的远程值等于基准提交" 1 \
  "$(grep -c "ls_remote_develop_at_task_start=$BASE" "$EV/git/01-base-and-worktree.txt")"

# ---------------------------------------------------------------- 02
assert_eq 02 "HEAD 等于基准提交" "$BASE" "$(git -C "$WORKTREE" rev-parse HEAD)"
if git -C "$WORKTREE" symbolic-ref -q HEAD >/dev/null 2>&1; then
  fail 02 "隔离工作区应为 detached HEAD"
else
  pass 02b "隔离工作区为 detached HEAD（不指向任何本地分支）"
fi
assert_eq 02c "任务开始快照记录工作区基于基准提交" 1 \
  "$(grep -c "isolation_worktree_head_equals_base=true" "$EV/git/01-base-and-worktree.txt")"

# ---------------------------------------------------------------- 03
CHANGED=$(git -C "$WORKTREE" diff --name-only "$BASE" -- . ; git -C "$WORKTREE" ls-files --others --exclude-standard)
OUTSIDE=0
while IFS= read -r p; do
  [ -z "$p" ] && continue
  case "$p" in
    docs/features/README.md) ;;
    docs/features/data-source-snapshot-status/README.md) ;;
    docs/features/data-source-snapshot-status/REQUIREMENTS.md) ;;
    docs/features/data-source-snapshot-status/ACCEPTANCE.md) ;;
    docs/features/data-source-snapshot-status/DESIGN.md) ;;
    docs/features/data-source-snapshot-status/UI.md) ;;
    docs/features/data-source-snapshot-status/API.md) ;;
    docs/features/data-source-snapshot-status/DATABASE.md) ;;
    docs/features/data-source-snapshot-status/reports/DATA-SOURCE-SNAPSHOT-STATUS-QUERY-BUTTON-AND-TABLE-LAYOUT-STABILITY-FORMAL-ACCEPTANCE-001.md) ;;
    docs/features/data-source-snapshot-status/reports/DATA-SOURCE-SNAPSHOT-STATUS-QUERY-BUTTON-AND-TABLE-LAYOUT-STABILITY-FORMAL-ACCEPTANCE-001-R1.md) ;;
    docs/features/data-source-snapshot-status/evidence/DATA-SOURCE-SNAPSHOT-STATUS-QUERY-BUTTON-AND-TABLE-LAYOUT-STABILITY-FORMAL-ACCEPTANCE-001/database/zookeeper-kafka-boundary.md) ;;
    docs/features/data-source-snapshot-status/evidence/DATA-SOURCE-SNAPSHOT-STATUS-QUERY-BUTTON-AND-TABLE-LAYOUT-STABILITY-FORMAL-ACCEPTANCE-001-R1/*) ;;
    *) OUTSIDE=$((OUTSIDE + 1)); echo "       白名单外路径: $p" ;;
  esac
done <<< "$CHANGED"
assert_eq 03 "全部变更路径位于 §12 白名单内（白名单外=$OUTSIDE）" 0 "$OUTSIDE"
UNTRACKED=$(git -C "$WORKTREE" ls-files --others --exclude-standard)
BADNEW=0
while IFS= read -r p; do
  [ -z "$p" ] && continue
  case "$p" in
    docs/features/data-source-snapshot-status/reports/DATA-SOURCE-SNAPSHOT-STATUS-QUERY-BUTTON-AND-TABLE-LAYOUT-STABILITY-FORMAL-ACCEPTANCE-001-R1.md) ;;
    docs/features/data-source-snapshot-status/evidence/DATA-SOURCE-SNAPSHOT-STATUS-QUERY-BUTTON-AND-TABLE-LAYOUT-STABILITY-FORMAL-ACCEPTANCE-001-R1/*) ;;
    *) BADNEW=$((BADNEW + 1)); echo "       越界新增文件: $p" ;;
  esac
done <<< "$UNTRACKED"
assert_eq 03b "新增文件全部位于 R1 报告或 R1 证据目录（越界=$BADNEW）" 0 "$BADNEW"
echo "       modified_tracked=$(git -C "$WORKTREE" diff --name-only "$BASE" -- . | grep -c .) untracked_new=$(printf '%s\n' "$UNTRACKED" | grep -c .)"

# ---------------------------------------------------------------- 04
FREEZE_DIFF=$(git -C "$WORKTREE" diff --name-only "$BASE" -- \
  frontend backend '*.spec.ts' '**/*.spec.ts' '*.test.ts' '**/*.test.ts' \
  package.json package-lock.json pom.xml '*.sql' '**/*.sql' | wc -l)
assert_eq 04 "frontend/backend/项目测试/依赖/锁文件/SQL/配置 零差异" 0 "$FREEZE_DIFF"
assert_eq 04b "冻结清单声明的 5 个零差异项与 git 实测一致" 0 \
  "$(git -C "$WORKTREE" diff --stat "$BASE" -- frontend backend package.json package-lock.json pom.xml | wc -l)"

# ---------------------------------------------------------------- 05 / 06
python3 "$LIB" doc-verify "$WORKTREE" "$BASE" docs/features/data-source-snapshot-status/DESIGN.md 85 87 "$WORKTREE" >/dev/null \
  && pass 05 "八份入口文档中仅 3 行变化（DESIGN.md 抽样验证通过）" \
  || fail 05 "DESIGN.md 逐行校验失败"
if python3 "$LIB" rows-verify "$WORKTREE" "$BASE" docs/features/data-source-snapshot-status/REQUIREMENTS.md REQ 91 "$WORKTREE"; then
  pass 05b "DSS-REQ-001~091 业务行逐字节不变且编号完整"
else
  fail 05b "DSS-REQ 业务行校验失败"
fi
if python3 "$LIB" rows-verify "$WORKTREE" "$BASE" docs/features/data-source-snapshot-status/ACCEPTANCE.md AC 118 "$WORKTREE"; then
  pass 06 "DSS-AC-001~118 完整业务行与状态列逐字节不变且编号完整"
else
  fail 06 "DSS-AC 业务行校验失败"
fi

# ---------------------------------------------------------------- 07
ac_pass=$(awk -F'|' '/^\| DSS-AC-11[4-8] /{gsub(/^ +| +$/,"",$3); if ($3=="PASS") c++} END{print c+0}' "$D/ACCEPTANCE.md")
assert_eq 07 "DSS-AC-114~118 状态列仍全部为 PASS" 5 "$ac_pass"
assert_eq 07b "ACCEPTANCE.md 中仍存在 5 条 DSS-AC-114~118 行" 5 \
  "$(grep -cE '^\| DSS-AC-11[4-8] ' "$D/ACCEPTANCE.md")"

# ---------------------------------------------------------------- 08
RECLINES=$(grep -h "$R1_REC_MARK" "${DOCS[@]}" 2>/dev/null)
assert_eq 08a "八份文档各含 1 行 R1 记录段" 8 "$(printf '%s\n' "$RECLINES" | grep -c .)"
assert_eq 08b "R1 记录段内 formal_acceptance_pass_count=118" 8 \
  "$(printf '%s\n' "$RECLINES" | grep -oF 'formal_acceptance_pass_count=118' | wc -l)"
assert_eq 08c "R1 记录段内 adjustment_acceptance_pass_count=5" 8 \
  "$(printf '%s\n' "$RECLINES" | grep -oF 'adjustment_acceptance_pass_count=5' | wc -l)"
assert_eq 08d "R1 记录段内 0 FAIL / 0 BLOCKED / 0 NOT_RUN 口径" 8 \
  "$(printf '%s\n' "$RECLINES" | grep -oF '0 FAIL / 0 BLOCKED / 0 NOT_RUN' | wc -l)"
assert_eq 08e "R1 报告 §4 保留 118 PASS / 0 FAIL / 0 BLOCKED / 0 NOT_RUN 明细" 1 \
  "$(grep -cF 'formal_acceptance_pass_count=118' "$R1_REPORT")"

# ---------------------------------------------------------------- 09 / 10
assert_eq 09a "DESIGN §14.2 需求 → 设计落点矩阵（91/91）存在且唯一" 1 \
  "$(grep -cF '### 14.2 需求 → 设计落点矩阵（91/91）' "$D/DESIGN.md")"
assert_eq 09b "DESIGN 追踪覆盖声明 91/91" 1 "$(grep -cF '覆盖：91/91' "$D/DESIGN.md")"
# 09c：需求总数 91 必须是「事实数」。所有出现都必须与 acceptance_count=118 成对紧邻出现，
# 且覆盖全部 8 份入口文档，以此排除用历史值（87/89）冒充当前值的可能。
R91=$(cnt '`requirements_count=91`' "${DOCS[@]}")
R91P=$(cnt '`requirements_count=91`、`acceptance_count=118`' "${DOCS[@]}")
R91DOCS=$(grep -lF '`requirements_count=91`' "${DOCS[@]}" 2>/dev/null | grep -c .)
assert_eq 09c "需求总数 91 共 $R91 处且全部与 acceptance_count=118 成对紧邻（无孤立值/历史值冒充）" "$R91" "$R91P"
assert_eq 09c2 "需求总数 91 覆盖全部 8 份入口文档" 8 "$R91DOCS"
assert_eq 10a "DESIGN §14.3 验收 → 设计落点矩阵（118/118）存在且唯一" 1 \
  "$(grep -cF '### 14.3 验收 → 设计落点矩阵（118/118）' "$D/DESIGN.md")"
assert_eq 10b "DESIGN 追踪覆盖声明 118/118" 1 "$(grep -cF '覆盖：118/118' "$D/DESIGN.md")"
# 10c：验收总数 118 同理，必须与 requirements_count=91 成对，且覆盖全部 8 份入口文档。
A118=$(cnt '`acceptance_count=118`' "${DOCS[@]}")
A118P=$(cnt '`requirements_count=91`、`acceptance_count=118`' "${DOCS[@]}")
A118DOCS=$(grep -lF '`acceptance_count=118`' "${DOCS[@]}" 2>/dev/null | grep -c .)
assert_eq 10c "验收总数 118 共 $A118 处且全部与 requirements_count=91 成对紧邻（无孤立值/历史值冒充）" "$A118" "$A118P"
assert_eq 10c2 "验收总数 118 覆盖全部 8 份入口文档" 8 "$A118DOCS"

# ---------------------------------------------------------------- 11 / 12
if python3 "$LIB" span-verify "$WORKTREE" "$BASE" docs/features/data-source-snapshot-status/DESIGN.md '## 38.' "$WORKTREE"; then
  pass 11 "DESIGN.md §38 业务规则正文逐字节不变"
else
  fail 11 "DESIGN.md §38 业务规则正文发生差异"
fi
if python3 "$LIB" span-verify "$WORKTREE" "$BASE" docs/features/data-source-snapshot-status/UI.md '## 32.' "$WORKTREE"; then
  pass 12 "UI.md §32 业务规则正文逐字节不变"
else
  fail 12 "UI.md §32 业务规则正文发生差异"
fi

# ---------------------------------------------------------------- 13
python3 "$LIB" doc-verify "$WORKTREE" "$BASE" docs/features/data-source-snapshot-status/API.md 23 25 "$WORKTREE" >/dev/null \
  && pass 13a "API.md 除 2 处入口元数据与末行插入外逐字节不变（含全部接口契约正文）" \
  || fail 13a "API.md 逐行校验失败"
python3 "$LIB" doc-verify "$WORKTREE" "$BASE" docs/features/data-source-snapshot-status/DATABASE.md 22 24 "$WORKTREE" >/dev/null \
  && pass 13b "DATABASE.md 除 2 处入口元数据与末行插入外逐字节不变（含表结构/SQL/只读契约正文）" \
  || fail 13b "DATABASE.md 逐行校验失败"

# ---------------------------------------------------------------- 14 / 15  append-only（重算，不引用既有结论）
append_only_check() { # n label path
  local n="$1" label="$2" path="$3"
  local tmpb tmppfx
  tmpb=$(mktemp) || return 1
  tmpc=$(mktemp) || return 1
  git -C "$WORKTREE" show "$BASE:$path" > "$tmpb"
  cat "$WORKTREE/$path" > "$tmpc"
  local nb nc
  nb=$(stat -c%s "$tmpb")
  nc=$(stat -c%s "$tmpc")
  if [ "$nc" -le "$nb" ]; then
    fail "$n" "$label 当前字节数未增加（before=$nb after=$nc）"
    rm -f "$tmpb" "$tmpc"; return 1
  fi
  local src_hash pfx_hash
  src_hash=$(sha256sum "$tmpb" | awk '{print $1}')
  pfx_hash=$(head -c "$nb" "$tmpc" | sha256sum | awk '{print $1}')
  local proofline
  proofline=$(grep -c "^before_sha256=$src_hash$" "$EV/git/03-append-only-proof.txt")
  if [ "$src_hash" != "$pfx_hash" ]; then
    fail "$n" "$label 原字节不是新文件的完整前缀（before_sha=$src_hash prefix_sha=$pfx_hash）"
    rm -f "$tmpb" "$tmpc"; return 1
  fi
  if [ "$proofline" != "1" ]; then
    fail "$n" "$label 证据文件未记录该 before_sha256（$src_hash）"
    rm -f "$tmpb" "$tmpc"; return 1
  fi
  pass "$n" "$label append-only 成立：原 $nb 字节为新文件完整前缀，删除 0 字节 0 行（after=$nc，+$((nc-nb)) 字节）"
  rm -f "$tmpb" "$tmpc"
}
append_only_check 14 "R0 正式验收报告" "docs/features/data-source-snapshot-status/reports/DATA-SOURCE-SNAPSHOT-STATUS-QUERY-BUTTON-AND-TABLE-LAYOUT-STABILITY-FORMAL-ACCEPTANCE-001.md"
append_only_check 15 "R0 ZooKeeper/Kafka 证据文件" "docs/features/data-source-snapshot-status/evidence/DATA-SOURCE-SNAPSHOT-STATUS-QUERY-BUTTON-AND-TABLE-LAYOUT-STABILITY-FORMAL-ACCEPTANCE-001/database/zookeeper-kafka-boundary.md"
assert_eq 15b "R0 报告追加的 §17 章节存在" 1 "$(grep -c '^## 17\. ChatGPT R0 复审与 R1 ZooKeeper 边界事实纠正记录$' "$R0_REPORT")"
assert_eq 15c "R0 ZK 证据文件追加的 R1 纠正段存在" 1 "$(grep -c '^## R1 纠正段（append-only）$' "$R0_ZKEV")"

# ---------------------------------------------------------------- 16  其他既有报告与证据零差异
OTHER=$(git -C "$WORKTREE" diff --name-only "$BASE" -- docs | grep -vE \
  '^(docs/features/README\.md|docs/features/data-source-snapshot-status/(README|REQUIREMENTS|ACCEPTANCE|DESIGN|UI|API|DATABASE)\.md|docs/features/data-source-snapshot-status/reports/DATA-SOURCE-SNAPSHOT-STATUS-QUERY-BUTTON-AND-TABLE-LAYOUT-STABILITY-FORMAL-ACCEPTANCE-001(-R1)?\.md|docs/features/data-source-snapshot-status/evidence/DATA-SOURCE-SNAPSHOT-STATUS-QUERY-BUTTON-AND-TABLE-LAYOUT-STABILITY-FORMAL-ACCEPTANCE-001/database/zookeeper-kafka-boundary\.md)$' | wc -l)
assert_eq 16 "除 §6.1/§6.2/§6.3 指定对象外的既有报告与证据零差异" 0 "$OTHER"
assert_eq 16b "R0 浏览器证据/截图/rect JSON/判定 JSON/测试记录/数据库证据零差异" 0 \
  "$(git -C "$WORKTREE" diff --name-only "$BASE" -- 'docs/features/data-source-snapshot-status/evidence/DATA-SOURCE-SNAPSHOT-STATUS-QUERY-BUTTON-AND-TABLE-LAYOUT-STABILITY-FORMAL-ACCEPTANCE-001/' | grep -v 'database/zookeeper-kafka-boundary.md' | wc -l)"

# ---------------------------------------------------------------- 17  错误字段字面量分布
assert_eq 17a "错误字段在本 Feature 当前直接事实（R1 记录段）中计数为 0" 0 \
  "$(printf '%s\n' "$RECLINES" | grep -oF "$WRONG_FIELD" | wc -l)"
# 17b：R1 证据目录内允许且仅允许 1 处，且必须是「被纠正的错误值」引用——
# 其紧邻上一行须明确标注为错误结果字段。以此区分「纠正性引用」与「当前事实」。
R1EV_WRONG_N=$(grep -roF "$WRONG_FIELD" "$EV" 2>/dev/null | wc -l)
assert_eq 17b "错误字段在 R1 证据目录中仅 1 处（纠正记录对被纠正错误值的引用）" 1 "$R1EV_WRONG_N"
# 该处位于纠正记录第 4 节，其锚点为上一行的标题「4. 被纠正的错误结果字段」，
# 紧随其后的说明行以「（此即**错误结果字段**）」明确标注该值错误。两项同时在位才算纠正性引用。
R1CR="$EV/database/01-zk-boundary-correction.txt"
HDR_LN=$(grep -nF '4. 被纠正的错误结果字段' "$R1CR" | head -1 | cut -d: -f1)
OCC_LN=$(grep -nF "$WRONG_FIELD" "$R1CR" | head -1 | cut -d: -f1)
if [ -n "$HDR_LN" ] && [ -n "$OCC_LN" ] && [ "$OCC_LN" -gt "$HDR_LN" ]; then
  pass 17b2 "该处位于纠正记录第 4 节「被纠正的错误结果字段」标题（第 $HDR_LN 行）之后的第 $OCC_LN 行"
else
  fail 17b2 "该处未落在第 4 节标题之后（heading=$HDR_LN occurrence=$OCC_LN）"
fi
assert_eq 17b3 "该处前 3 行内以「（此即**错误结果字段**）」明确标注其为错误值（非当前事实）" 1 \
  "$(grep -F -B3 "$WRONG_FIELD" "$R1CR" 2>/dev/null | grep -cF '此即**错误结果字段**')"
assert_eq 17c "八份入口文档中 8 处均属 ABLV 历史记录（不在 ABLV 行上的计数为 0）" 0 \
  "$(grep -h "$WRONG_FIELD" "${DOCS[@]}" | grep -vc '操作按钮 Loading')"
assert_eq 17d "全仓库（docs/）该字面量总数与本报告 §8.2 声明的 14 一致" 14 \
  "$(grep -roF "$WRONG_FIELD" "$WORKTREE/docs" | wc -l)"
# 与上表六类相符：14 处恰好分布在 14 个文件、每文件 1 处（8 入口文档 + 3 ABLV 报告/证据 + 3 纠正性引用）
assert_eq 17d2 "该字面量分布在 14 个文件（每文件恰 1 处，与 §8.2 六类归属一致）" 14 \
  "$(grep -rlF "$WRONG_FIELD" "$WORKTREE/docs" | wc -l)"
assert_eq 17e "R1 报告自身仅 1 处提及且明确标注为错误结果字段" 1 \
  "$(grep -F "$WRONG_FIELD" "$R1_REPORT" | grep -cF '错误结果字段')"
assert_eq 17f "R0 证据文件保留 R0 原始记录 1 处（§6.3 允许）" 1 \
  "$(grep -oF "$WRONG_FIELD" "$R0_ZKEV" | wc -l)"

# ---------------------------------------------------------------- 18
assert_eq 18a "正确字段 READ_ONLY_LS_ONE 在 R1 记录段中每份文档 1 处" 8 \
  "$(printf '%s\n' "$RECLINES" | grep -oF "$RIGHT_FIELD" | wc -l)"
assert_eq 18b "正确字段在历史限定语中每份文档 1 处" 8 \
  "$(grep -h "$QUAL_MARK" "${DOCS[@]}" | grep -oF "$RIGHT_FIELD" | wc -l)"
assert_eq 18c "正确字段在 R1 报告中出现" 1 "$(grep -cF "$RIGHT_FIELD" "$R1_REPORT")"
assert_eq 18d "正确字段在 R0 纠正段中出现" 1 "$(grep -cF "$RIGHT_FIELD" "$R0_ZKEV")"

# ---------------------------------------------------------------- 19
assert_eq 19a "VIOLATED_READ_PROHIBITION 在 R1 记录段中每份文档 1 处" 8 \
  "$(printf '%s\n' "$RECLINES" | grep -oF "$VIOLATED" | wc -l)"
assert_eq 19b "VIOLATED_READ_PROHIBITION 在历史限定语中每份文档 1 处" 8 \
  "$(grep -h "$QUAL_MARK" "${DOCS[@]}" | grep -oF "$VIOLATED" | wc -l)"
TOT19=$(cnt 'zookeeper_boundary_compliance_status=' "${DOCS[@]}")
VAL19=$(cnt "$VIOLATED" "${DOCS[@]}")
assert_eq 19c "八份入口文档中 zookeeper_boundary_compliance_status 取值一致（总 $TOT19，VIOLATED $VAL19）" 0 "$((TOT19 - VAL19))"
assert_eq 19d "VIOLATED_READ_PROHIBITION 在 R1 报告中出现" 1 "$(grep -cF "$VIOLATED" "$R1_REPORT")"

# ---------------------------------------------------------------- 20
assert_eq 20a "R1 记录段中 zookeeper_write_status=ZERO 每份文档 1 处" 8 \
  "$(printf '%s\n' "$RECLINES" | grep -oF 'zookeeper_write_status=ZERO' | wc -l)"
assert_eq 20b "R1 记录段中 zookeeper_acl_change_status=ZERO 每份文档 1 处" 8 \
  "$(printf '%s\n' "$RECLINES" | grep -oF 'zookeeper_acl_change_status=ZERO' | wc -l)"
TOT20=$(cnt 'zookeeper_acl_change_status=' "${DOCS[@]}")
VAL20=$(cnt 'zookeeper_acl_change_status=ZERO' "${DOCS[@]}")
assert_eq 20c "八份入口文档中 zookeeper_acl_change_status 取值全部为 ZERO（总 $TOT20，ZERO $VAL20）" 0 "$((TOT20 - VAL20))"
assert_eq 20d "R1 报告中写入与 ACL 均为 ZERO" 2 \
  "$(( $(grep -cF 'zookeeper_write_status=ZERO' "$R1_REPORT") + $(grep -cF 'zookeeper_acl_change_status=ZERO' "$R1_REPORT") ))"
assert_eq 20e "R0 纠正段声明写入与 ACL 均为 ZERO" 2 \
  "$(grep -A3 '^zookeeper_write_status=ZERO$' "$R0_ZKEV" | grep -cF 'zookeeper_acl_change_status=ZERO')"

# ---------------------------------------------------------------- 21
U=0
for f in "${DOCS[@]}"; do
  n=$(grep -oF "$R1_ENTRY" "$f" | wc -l)
  [ "$n" -eq 2 ] || { U=$((U + 1)); echo "       $f 的 R1 下一入口计数=$n（期望 2）"; }
done
assert_eq 21 "八份入口文档当前下一入口统一为 R1 ChatGPT 复审入口（每份 2 处）" 0 "$U"
assert_eq 21b "R0 入口的「当前直接值」后缀已全部降级为历史（剩余 0）" 0 \
  "$(cnt "$R0_ENTRY_SUFFIX" "${DOCS[@]}")"

# ---------------------------------------------------------------- 22
assert_eq 22a "R1 记录段中不存在当前 ACCEPTED/IMPLEMENTED_ACCEPTED/COMPLETED 状态" 0 \
  "$(printf '%s\n' "$RECLINES" | grep -cE 'stability_(document|implementation|acceptance)_status=(ACCEPTED|IMPLEMENTED_ACCEPTED|COMPLETED)')"
assert_eq 22b "R1 记录段明确 final_acceptance_status=NOT_EXECUTED" 8 \
  "$(printf '%s\n' "$RECLINES" | grep -oF 'final_acceptance_status=NOT_EXECUTED' | wc -l)"
assert_eq 22c "R1 记录段明确 acceptance_status=EXECUTED_PENDING_CHATGPT_REVIEW" 8 \
  "$(printf '%s\n' "$RECLINES" | grep -oF 'query_button_and_table_layout_stability_acceptance_status=EXECUTED_PENDING_CHATGPT_REVIEW' | wc -l)"
assert_eq 22d "R1 报告声明不构成 ACCEPTED/IMPLEMENTED_ACCEPTED/COMPLETED" 1 \
  "$(grep -cF '本报告**不**构成 `ACCEPTED`、`IMPLEMENTED_ACCEPTED` 或 `COMPLETED`' "$R1_REPORT")"

# ---------------------------------------------------------------- 23
assert_eq 23a "八份入口文档均声明「不等于 ChatGPT 已批准 R1」" 8 \
  "$(cnt '不等于** ChatGPT 已批准 R1' "${DOCS[@]}")"
# 23b：限定到 R1 记录段。同一短语在 R0 执行记录中亦出现（彼时写的是「正式验收」），
# 直接对入口文档全文计数会把 R0 历史记录一并计入，故以 R1 记录段为断言范围。
assert_eq 23b "R1 记录段（八份文档）均声明「不等于项目负责人已作最终接受」" 8 \
  "$(printf '%s\n' "$RECLINES" | grep -oF '不等于**项目负责人已作最终接受' | wc -l)"
assert_eq 23c "R1 报告声明不声称 ChatGPT 已批准 R1" 1 "$(grep -cF '声称 ChatGPT 已批准 R1' "$R1_REPORT")"
assert_eq 23d "R1 报告声明不声称项目负责人已作最终接受" 1 \
  "$(grep -cF '声称项目负责人已作出最终接受决定' "$R1_REPORT")"

# ---------------------------------------------------------------- 24
TOTAL=$(cnt 'r1_task_zookeeper_access_status=' "${DOCS[@]}" "$R1_REPORT" "$EV/database/01-zk-boundary-correction.txt")
ZKNONE=$(cnt 'r1_task_zookeeper_access_status=NONE' "${DOCS[@]}" "$R1_REPORT" "$EV/database/01-zk-boundary-correction.txt")
TOTALDB=$(cnt 'r1_task_database_access_status=' "${DOCS[@]}" "$R1_REPORT" "$EV/database/01-zk-boundary-correction.txt")
DBNONE=$(cnt 'r1_task_database_access_status=NONE' "${DOCS[@]}" "$R1_REPORT" "$EV/database/01-zk-boundary-correction.txt")
TOTALKA=$(cnt 'r1_task_kafka_access_status=' "${DOCS[@]}" "$R1_REPORT" "$EV/database/01-zk-boundary-correction.txt")
KANONE=$(cnt 'r1_task_kafka_access_status=NONE' "${DOCS[@]}" "$R1_REPORT" "$EV/database/01-zk-boundary-correction.txt")
assert_eq 24a "本轮 ZooKeeper 访问声明全部为 NONE（无其他取值）" "$TOTAL" "$ZKNONE"
assert_eq 24b "本轮数据库访问声明全部为 NONE（无其他取值）" "$TOTALDB" "$DBNONE"
assert_eq 24c "本轮 Kafka 访问声明全部为 NONE（无其他取值）" "$TOTALKA" "$KANONE"
if [ "$ZKNONE" -ge 1 ] && [ "$DBNONE" -ge 1 ] && [ "$KANONE" -ge 1 ]; then
  pass 24d "三类声明均存在（zk=$ZKNONE db=$DBNONE kafka=$KANONE）"
else
  fail 24d "三类访问声明缺失（zk=$ZKNONE db=$DBNONE kafka=$KANONE）"
fi
# 24e：本轮未执行任何 ZooKeeper 命令。$EV/database/01-zk-boundary-correction.txt 会在正文中
# 引用 R0 的历史命令原文（这是 §6.3 要求的事实记录），因此这里只断言「本任务的执行/操作记录」
# 与「服务记录」中不存在任何 zkCli 调用痕迹。
assert_eq 24e "本任务执行/服务记录中无 zkCli 调用痕迹" 0 \
  "$(grep -rl 'zkCli' "$EV/git" "$EV/services" 2>/dev/null | wc -l)"

# ---------------------------------------------------------------- 25  服务未被本轮启停
LIVE=0
for pid in 112421 112435 112346; do [ -d "/proc/$pid" ] && LIVE=$((LIVE + 1)); done
assert_eq 25a "R0 记录的三个服务 PID 仍未运行（本任务未启动、未停止、未重启）" 0 "$LIVE"
if command -v ss >/dev/null 2>&1; then
  LISTEN=$(ss -ltn 2>/dev/null | grep -cE ':(5173|8080)[[:space:]]')
else
  # 5173=0x1435, 8080=0x1F90（/proc/net/tcp 的本地端口为十六进制）
  LISTEN=$(awk '$4=="0A" && ($2 ~ /:1435$/ || $2 ~ /:1F90$/)' /proc/net/tcp /proc/net/tcp6 2>/dev/null | wc -l)
fi
assert_eq 25b "无 5173/8080 监听端口（服务在任务开始前已退出，本轮未启停）" 0 "$LISTEN"
assert_eq 25c "服务存在性记录文件已保存" 1 "$(test -f "$EV/services/01-service-presence.txt" && echo 1 || echo 0)"

# ---------------------------------------------------------------- 26 / 27
if git -C "$WORKTREE" diff --check >/dev/null 2>&1; then
  pass 26 "git diff --check exit 0"
else
  fail 26 "git diff --check 非零退出：$(git -C "$WORKTREE" diff --check 2>&1 | head -3)"
fi
if git -C "$WORKTREE" diff --cached --check >/dev/null 2>&1; then
  pass 27 "git diff --cached --check exit 0"
else
  fail 27 "git diff --cached --check 非零退出"
fi

# ---------------------------------------------------------------- 28
CRED=0
while IFS= read -r p; do
  [ -z "$p" ] && continue
  f="$WORKTREE/$p"
  [ -f "$f" ] || continue
  # 排除「扫描器本身」与其「扫描记录」：二者逐字列出待检模式，属工具文本而非凭据。
  case "$p" in
    *'/checks/check-r1.sh'|*'/checks/check-r1-lib.py'|*'/git/04-credential-scan.txt') continue ;;
  esac
  if grep -qE 'CDC/CDC@|sqlplus .*CDC|ghp_[A-Za-z0-9]|AKIA[0-9A-Z]{16}|-----BEGIN|PRIVATE KEY|Bearer [A-Za-z0-9._-]{20,}' "$f"; then
    CRED=$((CRED + 1)); echo "       疑似凭据: $p"
  fi
done <<< "$CHANGED"
assert_eq 28 "凭据扫描无密码/Token/完整数据库连接串/认证信息" 0 "$CRED"
assert_eq 28b "凭据扫描记录文件已保存" 1 "$(test -f "$EV/git/04-credential-scan.txt" && echo 1 || echo 0)"

# ---------------------------------------------------------------- 29
MAIN_NOW=$(git -C "$MAIN_WORKTREE" status --short | wc -l)
MAIN_SNAP=$(awk '/^main_worktree_status_short_full:$/{f=1;next} /^--- /{f=0} f' "$SNAPSHOT" | grep -c .)
assert_eq 29a "主工作区既有修改条数与任务开始快照一致" "$MAIN_SNAP" "$MAIN_NOW"
MAIN_DIFF=$(diff <(awk '/^main_worktree_status_short_full:$/{f=1;next} /^--- /{f=0} f' "$SNAPSHOT" | grep .) \
                 <(git -C "$MAIN_WORKTREE" status --short) | wc -l)
assert_eq 29b "主工作区既有修改逐行不变（未被本任务修改/覆盖/暂存）" 0 "$MAIN_DIFF"
assert_eq 29c "主工作区仍位于 develop 且 HEAD 不变" "4222b0a24b927aca6f62ff348fd8549b73d4156c" \
  "$(git -C "$MAIN_WORKTREE" rev-parse HEAD)"

# ---------------------------------------------------------------- 30
WT_DIFF=$(diff <(awk '/^--- git worktree list --porcelain \(after creating R1 worktree\) ---$/{f=1;next} f' "$SNAPSHOT" | sed '/^$/d' | sed 's/[[:space:]]*$//') \
               <(git -C "$WORKTREE" worktree list --porcelain | sed '/^$/d' | sed 's/[[:space:]]*$//') | wc -l)
assert_eq 30a "既有 worktree 路径/HEAD 未漂移（含本任务新增 worktree 在内逐行一致）" 0 "$WT_DIFF"
assert_eq 30b "worktree 总数 = 任务开始时 59 + 本任务新增 1" 60 \
  "$(git -C "$WORKTREE" worktree list --porcelain | grep -c '^worktree ')"

# ---------------------------------------------------------------- 汇总
echo "===================================================================================================="
echo "checks_passed=$PASSED"
echo "checks_failed=$FAILED_N"
if [ "$FAILED_N" -ne 0 ]; then
  echo "failed_check_ids=${FAILED_LIST[*]}"
  echo "RESULT=FAIL"
  echo "===================================================================================================="
  exit 1
fi
echo "failed_check_ids="
echo "RESULT=PASS"
echo "===================================================================================================="
exit 0
