# 查询按钮与表格布局稳定性实现——R2 定向纠正报告

任务编号：`DATA-SOURCE-SNAPSHOT-STATUS-QUERY-BUTTON-AND-TABLE-LAYOUT-STABILITY-IMPLEMENTATION-001-R2`
任务性质：**纯文档事实分层定向纠正**（不重做实现、不改代码/测试/CSS/断言、不执行验收、不作最终接受收口）
分支：`develop`
基准提交：`8272d69bda0fa917cd569d85cbd61f6ed9e28b4e`
基线工作区：`/agent/dss-query-button-table-layout-implementation-001-r2`（独立 detached worktree）
日期：2026-09-15

---

## 1. ChatGPT 从远程 Git 的 R1 复审结论

任务开始前 `git fetch origin` 与 `git ls-remote origin refs/heads/develop` 均严格等于 `8272d69bda0fa917cd569d85cbd61f6ed9e28b4e`，与其后 ChatGPT 的 R1 复审结论一致：

```text
chatgpt_r1_review_status=CHANGES_REQUIRED_ONE_RESIDUAL_DOCUMENT_FACT_CONFLATION
r1_business_implementation_review_status=APPROVED
r1_traceability_reference_correction_status=APPROVED
r1_current_status_correction_status=APPROVED
r1_report_append_only_review_status=APPROVED
```

即：R1 的业务实现结论、§3 的 5 处需求编号引用纠正结论、§4 的文档当前事实纠正结论、§7 的 R0 报告 append-only 结论**均有效且不被推翻**；本轮只修复一处残余的**文档事实精确性**问题，不改变任何业务实现、CSS、断言、验收业务行或冻结边界。

## 2. 残余文档事实混写的具体位置

ChatGPT 的 R1 复审指出且经本轮全仓库定向排查确认：残余问题**只有一处表述、漂移在 8 份入口文档中**，即把两个不同层次的事实写成了同一事实：

```text
两个前端实现文件除 5 处需求编号注释/测试名称外逐字节不变
```

该表述被同时用于表达两件不同的事：

1. R0 业务实现的**文件范围**（实际为 2 个生产源码文件 + 2 个测试文件，共 4 个前端路径）；
2. R1 需求编号引用纠正的**文件范围与位置数**（横跨上述 4 个文件的 5 处）。

派生出的不准确表述还有 `MainLayout.vue` 与 `DataSourceSnapshotQueryBar.vue` 的 §32.7 / §38.9 记录：`修改两个前端文件（其中 5 处为需求编号注释/测试名称纠正）`，同样把 R0 的文件范围与 R1 的纠正位置数合并计数。

逐份位置（纠正前，行号取自基准提交 `8272d69...`）：

| # | 文档 | 位置 | 情况 |
|---|---|---|---|
| 1 | `docs/features/data-source-snapshot-status/README.md` | R1 记录块冻结边界句 | 原句 1 处 |
| 2 | `docs/features/data-source-snapshot-status/REQUIREMENTS.md` | 同上 | 原句 1 处 |
| 3 | `docs/features/data-source-snapshot-status/ACCEPTANCE.md` | 同上 | 原句 1 处 |
| 4 | `docs/features/data-source-snapshot-status/DESIGN.md` | R1 记录块冻结边界句；另 §38.9 记录 | 原句 1 处 + §38.9 1 处 |
| 5 | `docs/features/data-source-snapshot-status/UI.md` | R1 记录块冻结边界句；另 §32.7 记录 | 原句 1 处 + §32.7 1 处 |
| 6 | `docs/features/data-source-snapshot-status/API.md` | R1 记录块冻结边界句 | 原句 1 处 |
| 7 | `docs/features/data-source-snapshot-status/DATABASE.md` | R1 记录块冻结边界句 | 原句 1 处 |
| 8 | `docs/features/README.md` | R1 段落冻结边界句 | 原句 1 处 |

ChatGPT R1 复审的单点指认为本报告的 `§4.2 第 6 项（UI.md §32.7）`；经排查同一层次的混写还存在于上述其余入口文档的冻结边界句中，因此本轮按同一口径一并分层纠正，而非只改一处造成文档间口径不一致。

## 3. R0 与 R1 文件事实的正确分层（唯一口径）

```text
r0_production_source_file_count=2
r0_test_file_count=2
r0_total_frontend_changed_file_count=4
r1_reference_corrected_file_count=4
r1_reference_corrected_location_count=5
r1_business_logic_diff=ZERO
r1_css_rule_diff=ZERO
r1_test_assertion_diff=ZERO
r1_fixture_mock_diff=ZERO
```

| 层次 | 文件 | 说明 |
|---|---|---|
| R0 生产源码实现 | `frontend/src/layouts/MainLayout.vue`、`frontend/src/views/data-source-run-state/components/DataSourceSnapshotQueryBar.vue` | 业务实现落点的 2 个生产源码文件 |
| R0 同时修改的测试文件 | `frontend/src/layouts/MainLayout.spec.ts`、`frontend/src/views/data-source-run-state/components/DataSourceSnapshotQueryBar.spec.ts` | 与源码实现同一提交内同时修改的 2 个测试文件 |
| R1 引用纠正分布 | `MainLayout.vue` 1 处（注释）、`MainLayout.spec.ts` 2 处（文件说明/测试名称）、`DataSourceSnapshotQueryBar.vue` 1 处（注释）、`DataSourceSnapshotQueryBar.spec.ts` 1 处（测试名称） | 4 个文件、5 处 |

正确口径：**R0 业务实现涉及 2 个生产源码文件和 2 个测试文件，共 4 个前端路径；R1 仅在这 4 个文件中纠正 5 处需求编号注释/测试名称，未改变业务逻辑、CSS 规则、测试断言、fixture 或 mock。**

## 4. 纠正方式（before → after）

八份入口文档统一改为分层口径，并在句末标明原表述为不准确历史表述：

- **before**：`……两个前端实现文件除 5 处需求编号注释/测试名称外逐字节不变。`
- **after**：`……R0 业务实现实际涉及 2 个生产源码文件（…）和 2 个测试文件（…），共 4 个前端路径（r0_production_source_file_count=2、r0_test_file_count=2、r0_total_frontend_changed_file_count=4）；R1 仅在这 4 个文件中纠正 5 处需求编号注释/测试名称（r1_reference_corrected_file_count=4、r1_reference_corrected_location_count=5：MainLayout.vue 1 处、MainLayout.spec.ts 2 处、DataSourceSnapshotQueryBar.vue 1 处、DataSourceSnapshotQueryBar.spec.ts 1 处），未改变业务逻辑、CSS 规则、测试断言、fixture 或 mock（r1_business_logic_diff=ZERO、r1_css_rule_diff=ZERO、r1_test_assertion_diff=ZERO、r1_fixture_mock_diff=ZERO）；原「两个前端实现文件」表述将 R0 的业务实现文件范围与 R1 的引用纠正文件范围混写为同一事实，属 ChatGPT R1 复审发现的不准确历史表述，已由 R2 纠正，不再构成当前事实。`

`UI.md` §32.7 与 `DESIGN.md` §38.9 的相邻记录改为先陈述 **R0 落地的是 2 个生产源码文件**，再单独补充 **R0 同时修改对应 2 个测试文件、共 4 个前端路径**，最后陈述 **R1 仅在这 4 个文件中纠正 5 处**，不再出现"两个文件（其中 5 处…）"的合并计数。

本轮不保留任何**未限定**的原句：唯一保留的原句出现在各文档文末新增的 R2 记录块中，作为被纠正的历史引用，并紧跟限定语 `ChatGPT R1 复审发现的不准确历史表述，已由 R2 纠正`。经机器扫描，八份文档中**未限定的错误混写计数为 0**。

同时按 §5 更新当前下一入口：八份文档的当前下一入口统一为 `CHATGPT_QUERY_BUTTON_AND_TABLE_LAYOUT_STABILITY_IMPLEMENTATION_R2_REVIEW_FROM_GIT_THEN_PROJECT_OWNER_VISUAL_INTERACTION_REVIEW`；旧 R1 入口保留但被标注为 `2026-09-15 R1 定向纠正任务提交后的历史入口，已由 …-R2 接续，不构成当前直接值`。

## 5. 冻结边界核验（相对 `8272d69...`）

| 边界 | 结果 |
|---|---|
| `frontend/**` | 零差异 |
| `backend/**` | 零差异 |
| 全部测试文件（含 `**/*test*`、`**/*.spec.*`） | 零差异（4 个前端文件本轮未被再次修改，注释/空白/格式/测试名称均未触碰） |
| SQL、配置、依赖与锁文件（`package.json`、`package-lock.json`、`pnpm-lock.yaml`、`yarn.lock`） | 零差异 |
| `DSS-REQ-001~091` 业务行 | 逐字节不变，计数 `91` |
| `DSS-AC-001~118` 完整业务行与状态列 | 逐字节不变，计数 `118`；统计仍为 `PASS 113 / FAIL 0 / BLOCKED 0 / NOT_RUN 5` |
| `DSS-AC-114~118` | 仍全部 `NOT_RUN`（5 条） |
| `DESIGN.md` §14.2/§14.3 映射行 | 逐字节不变，`91/91`、`118/118` |
| `DESIGN.md` §38 业务规则正文（根因、固定按钮几何、路由范围稳定滚动条槽、禁止方案、机器断言设计） | 除授权的分层事实与状态记录文字外逐字节不变 |
| `UI.md` §32 业务规则正文 | 同上 |
| `API.md` / `DATABASE.md` 契约正文 | 零变化 |
| 按钮固定宽度 | `query_button_fixed_width_px=62`、`reset_button_fixed_width_px=62`、`refresh_button_fixed_width_px=110`（未触碰） |
| 稳定滚动条槽方案 | `stable_scrollbar_gutter_route_scope=DATA_SOURCE_RUN_STATE_ONLY`（未触碰） |
| `ACCEPTANCE.md` 既有的非升序行序 | 未调整 |
| R0 实现报告 | 零差异 |
| R0 / R1 既有原始证据目录 | 零差异（R0 32 文件、R1 15 文件） |
| R1 报告 | **仅 append-only 追加**（见 §6） |

## 6. R1 报告的 append-only 证明

`reports/DATA-SOURCE-SNAPSHOT-STATUS-QUERY-BUTTON-AND-TABLE-LAYOUT-STABILITY-IMPLEMENTATION-001-R1.md` 以文末追加方式加入 `## 12. ChatGPT R1 复审与 R2 定向纠正记录`，既有内容未删除、未替换、未移动、未原位编辑：

```text
base_commit=8272d69bda0fa917cd569d85cbd61f6ed9e28b4e
base_bytes=16602
base_sha256=8783e06c862eabe4c4a88a515bad8630918cf11a423b84e662f3a5e68ecf7323
now_bytes=21334
now_sha256=ddd6bb2caf9fdfbb2dbe2c7310945c1febe2222a7ba9cae5b84303a80b75054d
base_is_complete_prefix=true
appended_bytes=4732
appended_starts_with_section12=true
numstat_added=74 numstat_deleted=0
deleted_diff_lines=0
deletion_bytes=0
append_only_status=PASS
```

> 该追加块的正文本身**不写入报告自身的修改后哈希**（文件无法内嵌自身 `SHA-256`）；上表的 `now_bytes` / `now_sha256` 记于独立证据文件 `evidence/…-IMPLEMENTATION-001-R2/records/r1-report-append-only-proof.txt`。

追加的 §12 明确记载：R1 的业务实现结论、引用纠正结论与当前状态结论**仍然有效、不被推翻**；被指出的混淆位于本报告 §4.2 第 6 项与 §5 的相邻文字；正确分层见 §12.3；`DSS-AC-114~118` 共 5 条仍全部 `NOT_RUN`。

## 7. 执行与未执行范围

| 项 | 状态 |
|---|---|
| 测试 | `NOT_RUN_NOT_REQUIRED_DOCUMENT_FACT_CORRECTION_ONLY`（本轮为纯文档任务，不重跑也不新增测试） |
| 前端构建 / 后端构建 | `NOT_RUN_NOT_REQUIRED_DOCUMENT_FACT_CORRECTION_ONLY` |
| 浏览器几何验证 | `NOT_RUN_NOT_REQUIRED_DOCUMENT_FACT_CORRECTION_ONLY`（不重跑、不伪造、不复用为正式验收） |
| 正式验收（`DSS-AC-114~118`） | 未执行，仍 `NOT_RUN` |
| 服务启停（`5173`/`8080`） | `NOT_RUN_EXISTING_SERVICES_UNTOUCHED`：既有服务**未触碰、保持现状**，未启动、未停止、未重启、未替换 |
| 数据库访问 / 写入 | `NONE` / `NOT_REQUESTED` |
| ZooKeeper 访问 / 写入 | `NONE` / `NOT_REQUESTED`（`feature_zookeeper_dependency=NONE`） |
| Kafka 访问 | `NONE` |
| 依赖变更 / 复制 `node_modules` | 无（本轮不引入、不安装、不复制任何依赖） |
| worktree 清理 | 未清理任何 worktree |
| 实现复审收口 / 正式验收 / 最终接受任务 | 未创建 |

## 8. 验证清单（§10 共 27 项）

| # | 检查 | 结果 |
|---|---|---|
| 1 | `git diff --check` 退出码 | `0` |
| 2 | 全部变更路径在 §7 白名单内 | 是（`changed_paths=9` 受控文件 + 新增 R2 证据目录，越界 `0`） |
| 3–6 | `frontend/**`、`backend/**`、全部测试文件、SQL/配置/依赖与锁文件零差异 | 全部零差异 |
| 7 | `DSS-REQ-001~091` 行逐字节不变、计数 `91` | 是 |
| 8 | `DSS-AC-001~118` 完整行与状态列逐字节不变、计数 `118` | 是 |
| 9 | 统计 `PASS 113 / FAIL 0 / BLOCKED 0 / NOT_RUN 5` | 是 |
| 10 | `DESIGN.md` 追踪 `91/91`、`118/118` 且映射行逐字节不变 | 是 |
| 11–12 | `DESIGN.md` §38、`UI.md` §32 非授权业务规则正文逐字节不变 | 是（区域回滚后与基准逐字节相同） |
| 13 | `API.md`/`DATABASE.md` 契约正文逐字节不变 | 是 |
| 14 | R0 实现报告零差异 | 是 |
| 15 | R0/R1 既有证据目录零差异 | 是（32 + 15 文件） |
| 16 | R1 报告基准字节为修改后文件的完整前缀，删除字节/行均为 `0` | 是 |
| 17 | 八份文档对 R0/R1 文件事实的当前陈述一致 | 是（分层计数令牌齐全） |
| 18 | 当前未限定的错误混写计数 | `0` |
| 19 | `r0_production_source_file_count=2` / `r0_test_file_count=2` / `r0_total_frontend_changed_file_count=4` | 八份文档均齐备 |
| 20 | `r1_reference_corrected_file_count=4` / `r1_reference_corrected_location_count=5` | 八份文档均齐备 |
| 21 | 当前状态仍待 ChatGPT R2 复审、`DSS-AC-114~118` 仍 `NOT_RUN` | 是 |
| 22 | 八份文档当前下一入口为 R2 入口，R1 入口仅作已限定历史 | 是 |
| 23 | 新增报告与证据无口令/Token/Cookie/Authorization/私钥/完整连接串 | 是（`secret_hits=0`） |
| 24 | 新增/修改 Markdown 无行尾空白；项目文档校验工具 | 行尾空白 `0`；`documentation_validation_status=NOT_AVAILABLE`（项目内不存在文档校验脚本，候选路径均不存在） |
| 25 | 主工作区与全部既有 worktree 的路径/HEAD/分支或 detached/修改数不变 | 是（基线 55 个 worktree，既有 worktree `drift=0`；主工作区 HEAD/分支/修改数不变；本任务的隔离 worktree 仍为基准提交 detached） |
| 26 | `git diff --cached --check` 退出码 | `0` |
| 27 | 全部已暂存路径在白名单内 | 是 |

校验脚本 `scripts/run-checks.py` 对每项断言失败均返回真实非零退出码；本清单结果由该脚本真实执行产生，未以"脚本成功运行"代替断言结论。

## 9. 证据目录

`evidence/DATA-SOURCE-SNAPSHOT-STATUS-QUERY-BUTTON-AND-TABLE-LAYOUT-STABILITY-IMPLEMENTATION-001-R2/`

```text
scripts/run-all-evidence.sh                    # 一键重生成全部证据（不跑测试/构建/服务/数据库）
scripts/r2-docs-correction.py                  # §4 文档分层纠正（基准派生；默认 dry-run，--apply 写盘）
scripts/r2-r1-report-append.py                 # §6 R1 报告文末追加（先校验前缀性质）
scripts/run-checks.py                          # §8 校验（1～25；--staged 追加 26～27）
scripts/conflicts-scan.py                      # 当前语气冲突扫描（未限定混写计数）
scripts/verify-r1-report-append-only.py        # R1 报告 append-only 证明
checks/01-section10-checks.txt                 # §10 校验输出（25 项全 PASS）
checks/02-current-status-conflicts.txt         # 冲突扫描（total_unqualified=0）
records/r1-report-append-only-proof.txt        # 追加前/后字节数与 SHA-256、前缀判定
records/worktrees-at-start.txt                 # 任务开始前 55 个 worktree 快照
records/git-state.txt                          # 变更列表、numstat、HEAD、远程 develop
```

`scripts/r2-docs-correction.py` 为**基准派生**编辑：以 `git show <基准>:<路径>` 读取基准 blob，在内存中施加声明的 42 处锚定编辑（每处断言锚点出现次数严格等于声明值），再与工作区比对/重写。因此纠正结果由"基准 + 声明编辑"唯一决定，`--apply` 幂等，且可证明工作区相对基准的差异恰好等于声明编辑集合。

证据仅包含文档一致性、字节前缀、diff、状态与 Git 核验结果，未复制依赖、源码、数据库内容、凭据、Cookie、Token 或完整连接串。

## 10. Git / Commit / Push 与 worktree

- 基线工作区：`/agent/dss-query-button-table-layout-implementation-001-r2`（detached HEAD = `8272d69bda0fa917cd569d85cbd61f6ed9e28b4e`），任务开始时工作区干净；
- 变更文件：8 份入口文档 + R1 报告（纯追加），加新增 R2 报告与 R2 证据目录；
- 提交方式：按白名单逐路径暂存（不使用 `git add .` / `git add -A`），**单个普通提交**，不使用 amend，不使用 force push，未夹带无关变更；
- 提交信息：`docs(source-snapshot): separate R0 implementation and R1 reference facts [DATA-SOURCE-SNAPSHOT-STATUS-QUERY-BUTTON-AND-TABLE-LAYOUT-STABILITY-IMPLEMENTATION-001-R2]`；
- 推送前复核：再次 `git fetch origin` 并确认远程 `develop` 仍为 `8272d69...`，未漂移后才推送；
- 推送方式：`git push origin HEAD:refs/heads/develop`（普通快进）；推送后本地 HEAD、`origin/develop` 与 `git ls-remote` 三处一致，ahead/behind `0/0`；
- 主工作区 `/agent/cdc-config-platform` 与其余 54 个既有 worktree 始终保持原状，未进入、未清理、未 reset、未 stash、未切换、未删除；
- 本任务 Prompt Markdown 未提交入项目仓库；
- 结果提交 ID 与推送结论记录在任务结果块中，本报告不内嵌自身提交哈希（避免自指）。

## 11. 当前状态与下一入口

本轮**不**设置 `code_review_status=APPROVED`，**不**把人工视觉/交互复核写为通过，**不**执行或更新 `DSS-AC-114~118`，**不**开始正式验收，**不**给出 `IMPLEMENTED_ACCEPTED`/`ACCEPTED`/`COMPLETED` 结论。

```text
query_button_and_table_layout_stability_document_status=APPROVED
query_button_and_table_layout_stability_implementation_status=IMPLEMENTED_ADJUSTMENT_PENDING_REVIEW
query_button_and_table_layout_stability_code_review_status=PENDING_CHATGPT_REVIEW
query_button_and_table_layout_stability_human_visual_interaction_review_status=NOT_RUN
query_button_and_table_layout_stability_acceptance_status=NOT_RUN
query_button_and_table_layout_stability_acceptance_not_run_count=5
pending_user_review=NO
pending_user_confirmation_count=0
```

- 本轮实现完成**不等于**代码复审通过、**不等于**本轮 5 条新增验收已执行、**不等于**最终接受收口；
- 下一入口：`CHATGPT_QUERY_BUTTON_AND_TABLE_LAYOUT_STABILITY_IMPLEMENTATION_R2_REVIEW_FROM_GIT_THEN_PROJECT_OWNER_VISUAL_INTERACTION_REVIEW`——即先由 ChatGPT 从远程 Git 对 R2 提交做实现复审，再由项目负责人对 `http://192.168.174.70:5173/monitor/data-source-state` 作人工视觉交互复核，之后再决定是否另立任务执行 `DSS-AC-114~118` 共 5 条新增验收。
