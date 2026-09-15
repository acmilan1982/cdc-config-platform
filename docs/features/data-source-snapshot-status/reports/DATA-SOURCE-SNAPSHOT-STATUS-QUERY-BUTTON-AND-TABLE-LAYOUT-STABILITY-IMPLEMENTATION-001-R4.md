# DATA-SOURCE-SNAPSHOT-STATUS-QUERY-BUTTON-AND-TABLE-LAYOUT-STABILITY-IMPLEMENTATION-001-R4 报告

- 任务编号：`DATA-SOURCE-SNAPSHOT-STATUS-QUERY-BUTTON-AND-TABLE-LAYOUT-STABILITY-IMPLEMENTATION-001-R4`
- 任务性质：**纯文档、极小定向的结果事实纠正**。不改代码、不改测试、不改 CSS、不改断言、不改证据脚本逻辑、不启停服务、不访问数据库/ZooKeeper/Kafka、不执行 `DSS-AC-114~118`、不清理任何 worktree、不绕过 Git hooks。
- 基准提交：`64004ca062a92ab40e07350e231d97befe6f496c`（`develop`）
- 隔离 worktree：`/agent/dss-query-button-table-layout-implementation-001-r4`（detached，从基准提交新建）
- 证据目录：`docs/features/data-source-snapshot-status/evidence/DATA-SOURCE-SNAPSHOT-STATUS-QUERY-BUTTON-AND-TABLE-LAYOUT-STABILITY-IMPLEMENTATION-001-R4/`

## 1. 基准与 ChatGPT R3 复审结论

```text
branch=develop
base_commit_id=64004ca062a92ab40e07350e231d97befe6f496c
expected_origin_develop=64004ca062a92ab40e07350e231d97befe6f496c
```

`git fetch origin` 后 `git ls-remote origin refs/heads/develop` 与本地基准一致，未出现 `BLOCKED_REMOTE_BASE_MISMATCH`。

ChatGPT 对 R3 的复审结论：

```text
chatgpt_r3_review_status=CHANGES_REQUIRED_TWO_RESULT_FACT_CORRECTIONS_ONLY
r3_evidence_script_correction_review_status=APPROVED
r3_business_implementation_status=PRESERVED_APPROVED
```

即：R3 修好的 `run-checks.py --staged` 路径解析缺陷与可复现性证明**已被接受**，仅剩两处**结果事实**需要纠正。本轮不重做 R3 证据工具、不修改该脚本。

## 2. 纠正一：按钮尺寸是固定宽度，不是高度

### 2.1 正确业务事实

```text
query_button_fixed_width_px=62
reset_button_fixed_width_px=62
refresh_button_fixed_width_px=110
button_height_baseline_status=NOT_DEFINED_NOT_CHANGED
current_wrong_height_field_conflict_count=0
```

三个按钮的 `62/62/110px` 是**固定宽度**。本轮不建立、不测量、不修改任何按钮高度基线，也不修改前端 CSS。

### 2.2 全面定位结果

对八份入口文档与 R3 报告逐一扫描（`records/03-height-width-field-scan.txt`）：

- 未限定的 `*_height_px` 当前事实计数为 `0`；
- 全仓库被跟踪文本中不存在任何 `*_height_px` 形式的按钮高度字段名；
- 未限定的 `query_button_height_px=62`、`reset_button_height_px=62`、`refresh_button_height_px=110` 当前事实计数均为 `0`；
- 三个正确宽度字段名在当前事实中全部存在；
- 仓库内「高度」邻近 62/110 的命中全部为 (i) 本轮自身的显式否定表述「不是按钮高度」与 (ii) 既有的「查询栏整体高度不变」表述，**不存在**将 62/62/110 解释为按钮高度的肯定性表述。

因此 `current_wrong_height_field_conflict_count=0`：R3 已提交产物中不存在以高度命名的 62/62/110 字段，本轮为**口径确认与固化**，未删改任何既有原始记录。凡以高度命名的同类字段（若有历史出现）一律按§规则标记为「R3 结果输出中的错误字段名，已由 R4 纠正」，不作当前事实；本轮实际计数为 0。

## 3. 纠正二：R2 evidence README 的真实基准状态

### 3.1 机器判定（`records/02-r2-readme-git-object-judgement.txt`）

判定对象：`docs/features/data-source-snapshot-status/evidence/DATA-SOURCE-SNAPSHOT-STATUS-QUERY-BUTTON-AND-TABLE-LAYOUT-STABILITY-IMPLEMENTATION-001-R2/README.md`，R2 结果提交 `09e268f905d083d6237b4dfc446198b4c5157661`。

| 信号 | 命令 | 结果 |
|---|---|---|
| 存在性 | `git cat-file -e 09e268f9:<path>` | 退出码 `128`（`exists on disk, but not in '09e268f9...'`） |
| 树内条目 | `git ls-tree -r --name-only 09e268f9 -- <path>` | 输出 `0` 行 |
| 相对基准状态 | `git diff-tree --name-status -r 64004ca -- <path>` | `A<tab><path>` |
| 新增提交 | `git log --diff-filter=A -- <path>` | 仅 `64004ca`（R3 结果提交） |
| R2 提交中该目录实际内容 | `git ls-tree -r --name-only 09e268f9 -- <dir>` | 仅 `checks/`、`records/`、`scripts/`，**无 `README.md`** |
| 基准中该文件大小 | `git cat-file -s 64004ca:<path>` | `3205` 字节 |

### 3.2 采用分支：§5.2 分支 A（R2 结果提交中不存在）

三个信号互补：`cat-file -e` 非 0 排除了「存在但为空」；`ls-tree` 为空确认树中无该条目；`diff-tree` 为 `A` 确认该文件是**在 R3 基准提交中新增**，而非 R2 结果提交中存在的 0 字节跟踪文件。故唯一正确口径为：

```text
r2_evidence_readme_git_object_status=NOT_PRESENT
r2_evidence_readme_cat_file_exit_code=128
r2_evidence_readme_base_blob_size_bytes=NOT_APPLICABLE
r2_evidence_readme_base_status=NOT_PRESENT_AT_R2_RESULT_COMMIT
r2_evidence_readme_creation_status=CREATED_RETROSPECTIVELY_BY_R3
r2_evidence_readme_append_only_status=NOT_APPLICABLE_NO_BASE_FILE
r2_evidence_readme_ambiguous_zero_byte_claim_count=0
```

即该 README 是 R3 在 R2 证据目录中新增的**R3 回溯说明文件**，不是对 R2 已存在 README 的追加。§5.3 分支 B（0 字节跟踪文件）**不成立**。文件本身无需删除或移动，仅纠正其来源与性质描述。

### 3.3 模糊口径清除

R3 侧「R2 证据 README 基准 0 字节 → append-only 前缀性质平凡成立」的表述把「文件不存在」与「已跟踪的 0 字节文件」混为一谈。本轮在 R2 证据 README 与 R3 证据 README 的 append-only 追加节中明确：该 README 在 R2 结果提交中不存在，因此不存在可追加的基准文件，`append_only` 对它是 `NOT_APPLICABLE_NO_BASE_FILE`，不得据「基准 0 字节」判 `append-only=PASS`。原始记录按规则**不原位修改**，纠正以追加节与 R4 证据目录为准。

## 4. 变更文件

八份入口文档（当前状态同步到 R4，R3 旧入口降格为历史）：

| 路径 | 编辑类型 |
|---|---|
| `docs/features/README.md` | R3→R4 令牌 ×4；B1 块重写 ×2；R3 历史链插入 ×2；文末 R4 记录 ×1 |
| `docs/features/data-source-snapshot-status/README.md` | 同上，B1 ×1、历史链 ×3 |
| `docs/features/data-source-snapshot-status/REQUIREMENTS.md` | 同上 |
| `docs/features/data-source-snapshot-status/ACCEPTANCE.md` | 同上 |
| `docs/features/data-source-snapshot-status/DESIGN.md` | 同上 |
| `docs/features/data-source-snapshot-status/UI.md` | 同上 |
| `docs/features/data-source-snapshot-status/API.md` | 同上 |
| `docs/features/data-source-snapshot-status/DATABASE.md` | 同上 |

历史文件（严格 append-only，字节前缀性质成立）：

| 路径 | 基准字节 | 现字节 | 追加字节 | 删除行 |
|---|---|---|---|---|
| `reports/...-R3.md` | 13400 | 17514 | +4114 | 0 |
| `evidence/...-R2/README.md` | 3205 | 5222 | +2017 | 0 |
| `evidence/...-R3/README.md` | 6245 | 7939 | +1694 | 0 |

新增：

- `reports/DATA-SOURCE-SNAPSHOT-STATUS-QUERY-BUTTON-AND-TABLE-LAYOUT-STABILITY-IMPLEMENTATION-001-R4.md`（本报告）
- `evidence/DATA-SOURCE-SNAPSHOT-STATUS-QUERY-BUTTON-AND-TABLE-LAYOUT-STABILITY-IMPLEMENTATION-001-R4/`（README、`checks/`、`scripts/`、`records/`）

## 5. 历史文件 append-only / 零差异证明

- **R3 报告**：相对基准严格 append-only，`base_bytes` 为 `now_bytes` 的完整字节前缀，删除行 0，新增 43 行（§14 追加节）。
- **R3 证据 README**：相对基准严格 append-only，前缀性质成立，删除行 0，新增 19 行（§8 追加节）。
- **R2 证据 README**：相对基准严格 append-only，前缀性质成立，删除行 0，新增 19 行（§6 追加节）。
- **R2 报告**：**零差异**（`diff_lines=0`）。R2 报告中被 R3 追加的 §12 不包含本轮需纠正的 README 基准事实，故按规则不得为凑白名单追加无意义记录。
- **R0/R1/R2/R3 其他既有证据原始记录**：零差异。
- **R0/R1 报告与证据**：零差异。

## 6. 冻结证明

| 冻结项 | 结果 |
|---|---|
| `frontend/**`（含 §10 点名的 `MainLayout.vue`、`MainLayout.spec.ts`、`DataSourceSnapshotQueryBar.vue`、`DataSourceSnapshotQueryBar.spec.ts`） | 零差异，`diff_lines=0` |
| `backend/**` | 零差异 |
| 项目测试、SQL、配置 | 零差异 |
| 依赖与锁文件 | 零差异 |
| R2 已修复证据脚本 `run-checks.py` | 与基准逐字节相等（`sha256` 一致） |
| R0/R1/R2/R3 其他既有脚本（17 个） | 逐字节不变 |
| `DSS-REQ-001~091` 业务行 | 逐字节不变，数量 91 |
| `DSS-AC-001~118` 完整业务行与状态列 | 逐字节不变，数量 118 |
| 验收统计 | `PASS=113 / FAIL=0 / BLOCKED=0 / NOT_RUN=5` |
| `DSS-AC-114~118` | 仍全部 `NOT_RUN`，状态列逐字节不变 |
| `DESIGN.md` §14.2/§14.3 追踪矩阵 | unique `REQ=91/91`、`AC=118/118`，映射块字节不变 |
| `DESIGN.md` §38 业务规则正文 | 逐字节不变（`[marker, EOF)` 区域往返相等） |
| `UI.md` §32 业务规则正文 | 逐字节不变 |
| API 契约正文 / DATABASE 契约正文 | 逐字节不变 |

本轮未在业务语义上修改任何需求、验收、追踪、设计、UI 或契约内容；八份入口文档的变更**仅**限于当前状态行、下一入口令牌、历史链与文末记录块。

## 7. 八份入口文档当前状态与下一入口

八份入口文档当前状态一致：

```text
query_button_and_table_layout_stability_document_status=APPROVED
query_button_and_table_layout_stability_implementation_status=IMPLEMENTED_ADJUSTMENT_PENDING_REVIEW
query_button_and_table_layout_stability_code_review_status=PENDING_CHATGPT_REVIEW
query_button_and_table_layout_stability_human_visual_interaction_review_status=NOT_RUN
query_button_and_table_layout_stability_acceptance_status=NOT_RUN
query_button_and_table_layout_stability_acceptance_not_run_count=5
pending_user_review=NO
pending_user_confirmation_count=0
stable_scrollbar_gutter_route_scope=DATA_SOURCE_RUN_STATE_ONLY
```

统一当前下一入口：

```text
next_step=CHATGPT_QUERY_BUTTON_AND_TABLE_LAYOUT_STABILITY_IMPLEMENTATION_R4_REVIEW_FROM_GIT_THEN_PROJECT_OWNER_VISUAL_INTERACTION_REVIEW
```

R3 旧入口保留为**明确已由 R4 接续的历史事实**，不再作为当前值。本轮**未**将任何状态写成 `IMPLEMENTED_ACCEPTED`、`ACCEPTED` 或 `COMPLETED`。

## 8. Git 与运行环境保留结果

- 只创建一个普通提交，提交信息：`docs(source-snapshot): correct R3 result fact labels [DATA-SOURCE-SNAPSHOT-STATUS-QUERY-BUTTON-AND-TABLE-LAYOUT-STABILITY-IMPLEMENTATION-001-R4]`。
- 未 amend、未 force push、未 rebase、未改写历史。
- `git_hooks_status=NOT_DISABLED_NOT_BYPASSED`：未使用 `-c core.hooksPath=/dev/null` 或任何 hooks 绕过方式；`core.hooksPath` 未设置，`.git/hooks/pre-commit` 不可执行（仓库自身状态，非本轮动作）。
- 推送为普通 fast-forward；推送前再次 `fetch` 并核对远程基准，无漂移。
- 提交后核验 `HEAD^..HEAD` 变更路径全部属于白名单，HEAD 中宽度字段存在、无按钮高度字段，且 R2 README 事实口径与 Git 对象判定一致。
- 主工作区与全部既有 worktree 未漂移；`5173`/`8080` 服务 PID、cwd 与命令与任务开始时一致，未启停、未替换。

> 本报告随该提交一并落地，无法自引用自身提交哈希；实际 `result_commit_id`、`remote_commit_id` 与 `push_status` 以任务结尾的 §16 结果报告块为准。

## 9. 本轮未执行的事项（显式声明）

本轮**未**运行前端/后端测试、构建或类型检查；**未**做浏览器几何验证；**未**执行 `DSS-AC-114~118`；**未**启动正式验收；**未**访问或写入数据库；**未**访问或写入 ZooKeeper（环境可用但未访问）；**未**访问 Kafka；**未**启停、重启或替换任何服务；**未**清理任何 worktree。

`test_status=NOT_RUN_NOT_REQUIRED_DOCUMENT_FACT_CORRECTION_ONLY`
`build_status=NOT_RUN_NOT_REQUIRED_DOCUMENT_FACT_CORRECTION_ONLY`
`browser_verification_status=NOT_RUN_NOT_REQUIRED_DOCUMENT_FACT_CORRECTION_ONLY`

本轮成功边界仅为：纠正 R3 结果事实字段、明确 R2 README 的 Git 对象历史、完成文档校验、创建一个普通提交并安全快进推送，等待 ChatGPT 从远程 Git 复审 R4。**实现完成不等于代码复审通过，不等于本轮 5 条新增验收已执行，不等于最终接受收口。**

## 10. 证据目录索引

| 路径 | 内容 |
|---|---|
| `README.md` | 证据目录说明 |
| `checks/r4-verify.py` | §14 强制校验（46 项，真实退出码） |
| `scripts/r4-docs-correction.py` | 声明式文档纠正（幂等、基准派生） |
| `scripts/r4-generate-records.sh` | 证据记录生成（真实命令输出） |
| `records/01-declared-edit-table-and-idempotent-rerun.txt` | 编辑表与幂等复跑（`changed_files=0`） |
| `records/02-r2-readme-git-object-judgement.txt` | §5.1 Git 对象判定原始记录 |
| `records/03-height-width-field-scan.txt` | 宽度/高度字段扫描 |
| `records/04-append-only-and-reverse-apply.txt` | append-only 前缀 + 反向应用证明 |
| `records/05-freeze-zones.txt` | 冻结区零差异 |
| `records/06-rows-and-status-counts.txt` | 业务行与状态计数 |
| `records/07-diff-check.txt` | 空白与冲突标记检查 |
| `records/08-whitelist.txt` | 白名单判定 |
| `records/09-credential-scan.txt` | 凭据扫描 |
| `records/10-git-scope.txt` | Git 现场与 hooks 状态 |
| `records/11-r4-verify-full-output.txt` | §14 校验完整输出 |
| `records/worktrees-at-start.txt` / `worktrees-at-end.txt` | worktree 起始/结束快照 |
| `records/services-at-start.txt` | `5173`/`8080` 起始与结束快照 |


## 11. 实现复审收口追加节（2026-09-15，`DATA-SOURCE-SNAPSHOT-STATUS-QUERY-BUTTON-AND-TABLE-LAYOUT-STABILITY-IMPLEMENTATION-REVIEW-CLOSEOUT-001` 严格文末追加）

> 本节为任务 `DATA-SOURCE-SNAPSHOT-STATUS-QUERY-BUTTON-AND-TABLE-LAYOUT-STABILITY-IMPLEMENTATION-REVIEW-CLOSEOUT-001` 对本报告的**严格文末追加**。
> 本节之前的全部字节为本报告在 `9d4b83f02970b64f25da3d233aa83e1a41572029` 中的原始内容，构成当前文件的完整字节前缀；
> 追加过程删除字节 `0`、删除行 `0`，未原位修改任何既有行，未删除、未移动、未重排任何既有内容。
> 本节不改变 R4 的任务性质：R4 仍为「纯文档、极小定向的结果事实纠正」；
> 其 §2（按钮尺寸是固定宽度，不是高度）、§3（R2 evidence README 的真实基准状态）的纠正结论、
> §5 的 append-only 证明与 §6 的冻结证明在本节追加后依然成立。

### 11.1 ChatGPT 对 R4 的远程 Git 代码复审结论

ChatGPT 已从远程 Git 对 R4 结果事实纠正提交 `9d4b83f02970b64f25da3d233aa83e1a41572029` 完成代码复审，结论：

```text
chatgpt_r4_implementation_review_status=APPROVED
r4_result_fact_correction_review_status=APPROVED
r3_evidence_script_correction_review_status=APPROVED
business_implementation_review_status=APPROVED
```

据此，八份入口文档的 `query_button_and_table_layout_stability_code_review_status` 由本收口任务收口为 `APPROVED`。

### 11.2 项目负责人人工视觉/交互复核结论

```text
project_owner_review_date=2026-09-15
project_owner_review_url=http://192.168.174.70:5173/monitor/data-source-state
project_owner_review_result=NO_ISSUES_FOUND
project_owner_visual_interaction_review_status=APPROVED_BY_PROJECT_OWNER
```

项目负责人已于 2026-09-15 打开 `http://192.168.174.70:5173/monitor/data-source-state` 检查页面视觉效果与交互，
并明确回复「我人工检查了，没有问题」。据此，`query_button_and_table_layout_stability_human_visual_interaction_review_status`
收口为 `APPROVED_BY_PROJECT_OWNER`。

**能力边界（不得扩写）**：该人工检查**仅**证明当前功能页面的视觉与交互效果没有发现问题。
项目负责人**没有**重新执行前端自动化测试、**没有**重新执行四档视口机器断言、**没有**逐条检查机器证据、
**没有**执行 `DSS-AC-114~118`，也**没有**作出正式验收或最终接受结论。
本节不把该检查写成正式验收通过，也不把其结论外推到 `DSS-AC-114~118`。

### 11.3 收口后八份入口文档当前直接值

```text
query_button_and_table_layout_stability_document_status=APPROVED
query_button_and_table_layout_stability_implementation_status=IMPLEMENTED_ADJUSTMENT_PENDING_FORMAL_ACCEPTANCE
query_button_and_table_layout_stability_code_review_status=APPROVED
query_button_and_table_layout_stability_human_visual_interaction_review_status=APPROVED_BY_PROJECT_OWNER
query_button_and_table_layout_stability_acceptance_status=NOT_RUN
query_button_and_table_layout_stability_acceptance_not_run_count=5
pending_user_review=NO
pending_user_confirmation_count=0
stable_scrollbar_gutter_route_scope=DATA_SOURCE_RUN_STATE_ONLY
```

即本报告 §7 所载的 `query_button_and_table_layout_stability_implementation_status=IMPLEMENTED_ADJUSTMENT_PENDING_REVIEW`、
`query_button_and_table_layout_stability_code_review_status=PENDING_CHATGPT_REVIEW`、`query_button_and_table_layout_stability_human_visual_interaction_review_status=NOT_RUN`
与下一入口 `CHATGPT_QUERY_BUTTON_AND_TABLE_LAYOUT_STABILITY_IMPLEMENTATION_R4_REVIEW_FROM_GIT_THEN_PROJECT_OWNER_VISUAL_INTERACTION_REVIEW`
均为 2026-09-15 R4 结果事实纠正任务提交并推送时点的**历史直接值**，已由 `DATA-SOURCE-SNAPSHOT-STATUS-QUERY-BUTTON-AND-TABLE-LAYOUT-STABILITY-IMPLEMENTATION-REVIEW-CLOSEOUT-001` 收口，
不构成当前直接值。本报告 §7 的其余事实保持不变：

```text
query_button_and_table_layout_stability_query_button_fixed_width_px=62
query_button_and_table_layout_stability_reset_button_fixed_width_px=62
query_button_and_table_layout_stability_refresh_button_fixed_width_px=110
query_button_and_table_layout_stability_button_height_baseline_status=NOT_DEFINED_NOT_CHANGED
query_button_and_table_layout_stability_acceptance_status=NOT_RUN
query_button_and_table_layout_stability_acceptance_not_run_count=5
pending_user_review=NO
pending_user_confirmation_count=0
```

收口后统一当前下一入口：

```text
next_step=DATA-SOURCE-SNAPSHOT-STATUS-QUERY-BUTTON-AND-TABLE-LAYOUT-STABILITY-FORMAL-ACCEPTANCE-001
```

### 11.4 验收统计分层（严禁写成 118 PASS）

```text
requirements_count=91
acceptance_count=118
accepted_scope_pass_count=113
adjustment_acceptance_status=NOT_RUN
adjustment_acceptance_pass_count=0
adjustment_acceptance_not_run_count=5
formal_acceptance_pass_count=113
formal_acceptance_fail_count=0
formal_acceptance_blocked_count=0
formal_acceptance_not_run_count=5
DSS-AC-114~118 status=NOT_RUN (count=5)
```

本轮**未**将任何状态写成 `IMPLEMENTED_ACCEPTED`、`ACCEPTED` 或 `COMPLETED`；
**未**执行 `DSS-AC-114~118`，**未**将其写成 `PASS`，其状态列逐字节不变，仍为 `NOT_RUN`；
**未**把项目负责人的人工视觉/交互检查写成正式验收通过；**未**写成「118 条全部通过」。

### 11.5 本节追加的字节事实

```text
r4_report_base_commit=9d4b83f02970b64f25da3d233aa83e1a41572029
r4_report_base_bytes=13644
r4_report_base_lines=213
r4_report_base_sha256=fe9d551c6e2ae333e42d8c601c1f09fa09fe0bf26a2ab00ac10daccd381c185b
r4_report_append_only_status=PASS
r4_report_append_deleted_bytes=0
r4_report_append_deleted_lines=0
r4_report_base_is_exact_byte_prefix=TRUE
```

`r4_report_base_sha256` 可用 `git cat-file -p 9d4b83f02970b64f25da3d233aa83e1a41572029:<path> | sha256sum` 独立复算；
该值描述的是**追加前**的基准版本，不是本文件修改后的自身哈希，本节不记录本文件修改后的自身 SHA-256。

### 11.6 R4 报告的定位与上位入口

本节追加后 R4 报告的整体定位不变：它记录的仍是 R4 结果事实纠正任务本身，
其状态声明的**当前值**以上文 §11.3 的收口口径为准，§7 的口径降格为该任务时点的历史直接值。
实现复审收口任务的完整记录见 `docs/features/data-source-snapshot-status/reports/DATA-SOURCE-SNAPSHOT-STATUS-QUERY-BUTTON-AND-TABLE-LAYOUT-STABILITY-IMPLEMENTATION-REVIEW-CLOSEOUT-001.md`；
该收口任务**不**执行 `DSS-AC-114~118`、**不**作正式验收、**不**作最终接受收口。
统一当前下一入口为 `DATA-SOURCE-SNAPSHOT-STATUS-QUERY-BUTTON-AND-TABLE-LAYOUT-STABILITY-FORMAL-ACCEPTANCE-001`。
