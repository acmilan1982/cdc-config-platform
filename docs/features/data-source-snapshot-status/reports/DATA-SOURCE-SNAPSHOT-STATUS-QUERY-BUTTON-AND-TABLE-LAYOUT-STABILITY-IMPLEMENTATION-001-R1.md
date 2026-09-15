# 查询按钮与表格布局稳定性实现——R1 定向纠正报告

任务编号：`DATA-SOURCE-SNAPSHOT-STATUS-QUERY-BUTTON-AND-TABLE-LAYOUT-STABILITY-IMPLEMENTATION-001-R1`
任务性质：**纯文档与注释/测试名称可追踪性定向纠正**（不重做实现、不执行验收、不作最终接受收口）
分支：`develop`
基准提交：`d77e174a912daf852837c9658f13672918fc766e`
基线工作区：`/agent/dss-query-button-table-layout-implementation-001-r1`（独立 detached worktree）
日期：2026-09-15

---

## 1. ChatGPT 从远程 Git 的 R0 复审结论

| 项 | 值 |
|---|---|
| `chatgpt_r0_review_status` | `CHANGES_REQUIRED_DOCUMENT_TRACEABILITY_AND_CURRENT_STATUS_ONLY` |
| `business_implementation_review_status` | `CORRECT_AND_PRESERVED` |
| `browser_evidence_review_status` | `APPROVED_FOR_IMPLEMENTATION_REVIEW` |

复审**只**要求纠正两类问题：① 需求编号引用；② 文档"当前事实"口径。业务实现与 R0 浏览器证据**不被推翻、不重跑**；R1 不得伪造重跑、不得给出代码复审通过结论。

---

## 2. 正确的需求编号映射（唯一口径）

```text
DSS-REQ-090 = 查询与重置按钮固定 62px；立即刷新保持 110px
DSS-REQ-091 = 源库快照状态路由真实主内容滚动容器保留 stable scrollbar gutter
DSS-REQ-090 -> DSS-AC-114, DSS-AC-117
DSS-REQ-091 -> DSS-AC-115, DSS-AC-116, DSS-AC-117, DSS-AC-118
```

---

## 3. 逐处被纠正的误引用（before → after）

只改**注释与测试显示名**，可执行逻辑、CSS 声明、断言、测试步骤、fixture 与 mock 全部零变化（证明见 §6 与 §9）。

| # | 文件 | 位置 | before | after |
|---|---|---|---|---|
| 1 | `frontend/src/layouts/MainLayout.vue` | 第 62 行私有路由作用域滚动条槽位注释 | `DSS-REQ-090` | `DSS-REQ-091` |
| 2 | `frontend/src/layouts/MainLayout.spec.ts` | 第 12 行文件头注释 | `DSS-REQ-090` | `DSS-REQ-091` |
| 3 | `frontend/src/layouts/MainLayout.spec.ts` | 第 106 行 `describe('MainLayout 路由作用域稳定滚动条槽位（…）')` | `DSS-REQ-090` | `DSS-REQ-091` |
| 4 | `frontend/src/views/data-source-run-state/components/DataSourceSnapshotQueryBar.vue` | 第 503 行重置按钮几何锁注释 | `DSS-REQ-091` | `DSS-REQ-090` |
| 5 | `frontend/src/views/data-source-run-state/components/DataSourceSnapshotQueryBar.spec.ts` | 第 1434 行 `describe('DataSourceSnapshotQueryBar 重置按钮固定几何（…）')` | `DSS-REQ-091` | `DSS-REQ-090` |

共纠正 **5 处**。

**未改动项（语义本来正确）**：`DataSourceSnapshotQueryBar.spec.ts` 第 1429–1432 行同时覆盖 `DSS-REQ-090 / DSS-REQ-091` 的组合注释块，语义正确，**未做机械删除或改写**。`DataSourceSnapshotQueryBar.vue` 第 504 行既有的"（R1 统一口径：…）"指更早一轮的 R1，与本次任务编号无关，未改动。

---

## 4. 文档当前事实的冲突位置与纠正方式

检查并同步 8 份入口文档：

```text
docs/features/README.md
docs/features/data-source-snapshot-status/README.md
docs/features/data-source-snapshot-status/REQUIREMENTS.md
docs/features/data-source-snapshot-status/ACCEPTANCE.md
docs/features/data-source-snapshot-status/DESIGN.md
docs/features/data-source-snapshot-status/UI.md
docs/features/data-source-snapshot-status/API.md
docs/features/data-source-snapshot-status/DATABASE.md
```

### 4.1 统一后的当前事实

```text
query_button_and_table_layout_stability_document_status=APPROVED
query_button_and_table_layout_stability_implementation_status=IMPLEMENTED_ADJUSTMENT_PENDING_REVIEW
query_button_and_table_layout_stability_code_review_status=PENDING_CHATGPT_REVIEW
query_button_and_table_layout_stability_human_visual_interaction_review_status=NOT_RUN
query_button_and_table_layout_stability_acceptance_status=NOT_RUN
query_button_and_table_layout_stability_acceptance_not_run_count=5
accepted_scope_pass_count=113
pending_user_review=NO
pending_user_confirmation_count=0
current_next_entry=CHATGPT_QUERY_BUTTON_AND_TABLE_LAYOUT_STABILITY_IMPLEMENTATION_R1_REVIEW_FROM_GIT_THEN_PROJECT_OWNER_VISUAL_INTERACTION_REVIEW
```

### 4.2 已确认并处理的冲突点

| # | 位置 | 原当前语气表述 | 处理方式 |
|---|---|---|---|
| 1 | `REQUIREMENTS.md` §21.10 ④ 事实边界 | 以当前语气写"仍**不得**把 Feature 写成 `IMPLEMENTED`… Feature 最终接受收口待独立正式实现任务完成后另行收口" | 改为带日期与任务编号的**当前事实**（已实现、待复审、`DSS-AC-114~118` 仍 `NOT_RUN`）；原批准时点口径降级为"批准时点历史（该时点本轮尚未实现，已由实现任务于 2026-09-15 处理完毕，不构成当前直接值）" |
| 2 | `DESIGN.md` §38.1 | 以当前语气写"仍不在 `5173` 实现、不执行本轮新增验收…" | 前置"当前事实（2026-09-15 R1 定向纠正任务提交并推送后）：本轮实现已完成…但**未执行本轮新增验收、未做最终接受收口**"；原口径标记为"起草与批准时点历史" |
| 3 | `DESIGN.md` §38.1 末句 | "批准文档不等于实现完成，也不等于本轮 5 条新增验收已执行" | 改为当前事实；保留"不得被解释为本轮 5 条新增验收已通过或已最终接受收口" |
| 4 | `DESIGN.md` §38.9 自检 | "`frontend/**`、`backend/**`、测试代码…零差异"当作当前事实 | 限定为"**自检时点（2026-09-15 草案建立与批准收口时点，该时点本轮尚未实现）**"，并注明该结论仅对该时点成立、不构成当前事实；本轮实现已落地两个前端文件（`backend/**`、SQL、配置、依赖与锁文件仍零差异） |
| 5 | `UI.md` §32 开头 | 以当前语气写"**未实现**（不得写成 `IMPLEMENTED`）、**未验收**…待独立正式实现任务完成后另行收口" | 改为当前事实（已实现、`DSS-AC-114~118` 仍全部 `NOT_RUN`、未作最终接受收口）；原口径标记为"起草与批准时点历史" |
| 6 | `UI.md` §32.7 | "代码零差异：本轮不产生 `frontend/`/`backend/`…差异"当作当前事实 | 限定为"**自检时点**"结论，并注明本轮实现已修改两个前端文件（其中 5 处为需求编号注释/测试名称纠正） |

另有两种**恒定**冲突在全部 8 份文档中统一处理：

- **统一下一入口**：由 R0 入口更新为 `CHATGPT_QUERY_BUTTON_AND_TABLE_LAYOUT_STABILITY_IMPLEMENTATION_R1_REVIEW_FROM_GIT_THEN_PROJECT_OWNER_VISUAL_INTERACTION_REVIEW`（状态表"草案下一入口"行、`current_next_entry=` 字段）。
- **R0 入口的历史化**：R0 入口 `CHATGPT_QUERY_BUTTON_AND_TABLE_LAYOUT_STABILITY_IMPLEMENTATION_REVIEW_FROM_GIT_THEN_PROJECT_OWNER_VISUAL_INTERACTION_REVIEW` 保留为"2026-09-15 R0 实现提交后的历史入口，已由 R1 纠正任务处理，不构成当前直接值"，不再作为当前直接值。

每份文档文末追加同一段 R1 定向纠正记录，说明 R0 结论、纠正后的 090/091 口径、5 处误引用、当前状态令牌集合、冻结边界与 R1/R0 下一入口关系。

### 4.3 保留原则

- 旧 `PENDING_FORMAL_IMPLEMENTATION_ON_5173`、旧代码复审 `NOT_RUN`、旧实现入口与"未实现/代码零差异"等表述**只作为带日期、带任务编号、注明"已由实现任务处理完毕"的历史事实保留**，未删除历史；
- 未做仓库级机械批量替换；
- 未改动任何需求业务行、验收业务行/状态列、设计或界面业务规则；
- `ACCEPTANCE.md` §4.24 的 `DSS-AC-114~118` 五条状态仍为 `NOT_RUN`；
- 真正的时间限定历史文字（"本草案时点"/"批准收口时点"）保持原样，未被错误改写为当前事实。

---

## 5. 原业务实现与 R0 浏览器证据为何仍然有效

- 本次 5 处改动全部位于**注释与测试显示名**；`width = min-width = max-width = flex-basis = 62px` 的 CSS 声明、"查询/重置"同宽与"立即刷新"`110px` 的声明、`scrollbar-gutter: stable` 仅作用于 `DataSourceRunState` 路由真实主内容滚动容器 `.content-area` 的规则，均逐字节未变；
- `MainLayout.vue` 与 `DataSourceSnapshotQueryBar.vue` 除各 1 行需求编号注释外，与基准提交逐字节相同（§6 证明）；
- 两个 spec 文件除名称/注释外，用例数、断言、fixture、mock 与基准提交逐字节相同；
- 因此 R0 的浏览器几何结论（四档视口长/短两态 `clientWidth` 逐档完全相等、七列表头 `x`/`width` 差值全 `0`、查询/重置/立即刷新三按钮自矩形差值全 `0`、机器判定 `114/114 PASS`、`0.001px` 负向注入退出码非零）继续有效，无需重跑；
- 验收基线不受影响：既有 `DSS-AC-001~113` 仍 `PASS 113 / FAIL 0 / BLOCKED 0 / NOT_RUN 0`；本轮 `DSS-AC-114~118` 共 5 条仍全部 `NOT_RUN`。

---

## 6. 冻结边界核验（相对 `d77e174...`）

| 边界 | 结果 |
|---|---|
| `DSS-REQ-001~091` 业务行 91 条 | 集合恰为 `001..091`，逐字节不变 |
| `DSS-AC-001~118` 业务行 118 条与状态列 | 集合恰为 `001..118`，逐字节不变 |
| 验收统计 | `PASS 113 / FAIL 0 / BLOCKED 0 / NOT_RUN 5` |
| `DESIGN.md` §14.2/§14.3 映射块 | 唯一 `DSS-REQ` 91/91、唯一 `DSS-AC` 118/118，映射块逐字节不变 |
| `API.md`/`DATABASE.md` 业务契约 | 变更集恰好等于声明的状态/记录措辞编辑，业务契约零变化 |
| `MainLayout.vue`/`DataSourceSnapshotQueryBar.vue` 可执行代码与 CSS | 除各 1 行需求编号注释外逐字节不变 |
| 两个 spec 文件的用例逻辑/断言/fixture/mock/用例数 | 逐字节不变（10 用例 / 1 describe；103 用例 / 17 describe） |
| `backend/**`、路由配置、全局样式、依赖、锁文件、SQL、配置 | 变更集内 0 文件 |
| R0 既有浏览器/测试/构建原始证据目录（32 个文件） | 逐字节不变 |
| 其他既有报告 | 仅 R0 实现报告按 §7 追加，无其他报告变更 |

`DESIGN.md` §38、`UI.md` §32 的业务规则正文除上述 §4 授权的状态/历史措辞外未改动。

机器证明见 `evidence/...-R1/checks/03-section9-checks.txt` 的 §9-5、§9-6、§9-7、§9-8、§9-9、§9-11、§9-16 项。

---

## 7. R0 实现报告的 append-only 证明

`reports/DATA-SOURCE-SNAPSHOT-STATUS-QUERY-BUTTON-AND-TABLE-LAYOUT-STABILITY-IMPLEMENTATION-001.md` 未做任何删除/替换/就地修改，仅在文末追加 "## 11. ChatGPT R0 复审与 R1 定向纠正记录" 一节。

| 项 | 值 |
|---|---|
| 基准提交 | `d77e174a912daf852837c9658f13672918fc766e` |
| 追加前字节数 | `23728` |
| 追加前 SHA-256 | `4ec9764ccc62b3a1afad5cb2dd67de1d153898e9a396975b8b879364fa2eb9a5` |
| 追加后字节数 | `28659` |
| 追加后 SHA-256 | `9e23d546901ab0682f8184287a786c919816a82d05457cd35de01dddbc40d1ca` |
| 原有字节为追加后文件的**完整前缀** | `true`（逐字节比较） |
| 新增 `##` 一级小节数 | `1` |
| `git diff --numstat` | `56  0`（删除行数 `0`） |

原始报告中 §3.3 的误引用（"`DataSourceSnapshotQueryBar.spec.ts` 追加重置按钮固定几何（`DSS-REQ-091`）"）**保留在历史字节中**，其正确口径由追加的 §11.2 声明为 `DSS-REQ-090`。

证明脚本：`evidence/...-R1/scripts/verify-report-append-only.py`，输出：`evidence/...-R1/records/append-only-proof.txt`。

---

## 8. 执行与未执行范围

| 项 | 状态 |
|---|---|
| 定向前端测试（2 个 spec 文件） | **已执行**：`Test Files 2 passed (2)` / `Tests 113 passed (113)`（`MainLayout.spec.ts` 10 用例 + `DataSourceSnapshotQueryBar.spec.ts` 103 用例）。仅用于证明名称/注释改动未破坏用例发现与执行，**不作为正式验收** |
| 前端全量测试 / 构建 | `NOT_RUN_NOT_REQUIRED_REFERENCE_AND_DOCUMENT_CORRECTION_ONLY` |
| 浏览器几何验证 | `NOT_RUN_R0_APPROVED_EVIDENCE_REUSED`（不重跑、不伪造） |
| 服务启停（`5173`/`8080`） | `NOT_RUN_SERVICES_PRESERVED`（保留 R0 运行中的前端 `20567`、后端 `20509`，未启动、未停止、未重启） |
| 数据库访问/写入 | `NONE` / `NOT_REQUESTED` |
| ZooKeeper 访问/写入 | `NONE` / `NOT_REQUESTED`（`feature_zookeeper_dependency=NONE`） |
| Kafka 访问 | `NONE` |
| worktree 清理 | 未清理任何 worktree |

> 为了在不改动其他 worktree 的前提下运行上述定向测试，R1 worktree 的 `frontend/node_modules` 由 R0 worktree 的已装依赖**复制**而来；`node_modules/` 已被 `.gitignore`（第 20 行）忽略，不进入提交，也未在 R0 worktree 内创建、修改或删除任何文件。

---

## 9. 验证清单（§9）

| # | 检查 | 结果 |
|---|---|---|
| 1 | `git diff --check` / `git diff --cached --check` 退出码 | `0` / `0` |
| 2 | 变更路径是否全部在白名单内 | 是（`changed_paths=14`，越界 `0`） |
| 3 | 四个前端文件只发生 §5 规定的纠正 | 是 |
| 4 | 移除授权行后四文件与基准逐字节相同 | 是（`total_replaced_line_count=5`，`restored_bytes_equals_base=True`） |
| 5 | `DSS-REQ-001~091` 连续唯一且业务行逐字节不变 | 是 |
| 6 | `DSS-AC-001~118` 连续唯一且业务行/状态列逐字节不变 | 是 |
| 7 | 验收统计 `PASS 113 / FAIL 0 / BLOCKED 0 / NOT_RUN 5` | 是 |
| 8 | `DESIGN.md` 追踪 91/91、118/118，映射行逐字节不变 | 是 |
| 9 | `API.md`/`DATABASE.md` 业务契约零变化 | 是 |
| 10 | R0 报告 append-only、原有完整字节为前缀 | 是 |
| 11 | R0 既有证据目录逐字节不变 | 是（32 文件） |
| 12 | 当前需求编号引用冲突数 | `0` |
| 13 | 当前未限定的"未实现/待正式实现/代码零差异/旧下一入口"冲突数 | `0` |
| 14 | 新增报告与证据无口令/Token/Cookie/Authorization/私钥/完整连接串 | 是（`secret_hits=0`） |
| 15 | 主工作区与全部既有 worktree 未被改动 | 是（基线 53 个 worktree，`drift=0`；主工作区 HEAD/分支/修改数不变） |
| 16 | 追加：相对基准提交的受控变更恰好为 4 前端 + 8 文档 + R0 报告 + R1 报告 | 是（`14/14`） |

证据目录：`evidence/DATA-SOURCE-SNAPSHOT-STATUS-QUERY-BUTTON-AND-TABLE-LAYOUT-STABILITY-IMPLEMENTATION-001-R1/`

```text
scripts/run-all-evidence.sh                # 一键重生成全部证据
scripts/r1-docs-correction.py              # §7 文档纠正（默认 dry-run）
scripts/check-frontend-reference-only.py   checks/01-frontend-reference-only.txt
scripts/verify-docs-roundtrip.py           checks/02-docs-roundtrip.txt
scripts/run-checks.py                      checks/03-section9-checks.txt
scripts/conflicts-scan.py                  checks/04-current-status-conflicts.txt
scripts/verify-report-append-only.py       checks/05-targeted-tests.txt
                                           records/append-only-proof.txt
                                           records/worktrees-at-start.txt
                                           records/git-state.txt
```

`run-all-evidence.sh` 的退出码：`01=0`、`02=0`、`03=0`、`04=0`、`append-only=0`、`05=0`。

---

## 10. Git / Commit / Push 与 worktree

- 基线工作区：`/agent/dss-query-button-table-layout-implementation-001-r1`（detached HEAD = `d77e174a912daf852837c9658f13672918fc766e`），任务开始时工作区干净；
- 变更文件：8 份入口文档 + R0 实现报告 + 4 个前端文件（共 13 个受控文件），加新增 R1 证据目录；
- 提交方式：按白名单逐路径暂存，单个普通提交，不使用 amend，不使用 force push；
- 推送方式：`git push origin HEAD:refs/heads/develop`（普通快进）；
- 主工作区 `/agent/cdc-config-platform` 与其余 52 个既有 worktree 始终保持原状，未进入、未清理、未 reset、未 stash、未删除；
- 本任务 Prompt Markdown 未提交入项目仓库。

---

## 11. 当前状态与下一入口

- 本任务**不**设置 `code_review_status=APPROVED`，**不**把人工视觉/交互复核写为通过，**不**执行或更新 `DSS-AC-114~118`，**不**开始正式验收，**不**给出 `IMPLEMENTED_ACCEPTED`/`ACCEPTED`/`COMPLETED` 结论；
- 本轮实现完成**不等于**代码复审通过、**不等于**本轮 5 条新增验收已执行、**不等于**最终接受收口；
- 下一入口：`CHATGPT_QUERY_BUTTON_AND_TABLE_LAYOUT_STABILITY_IMPLEMENTATION_R1_REVIEW_FROM_GIT_THEN_PROJECT_OWNER_VISUAL_INTERACTION_REVIEW`——即先由 ChatGPT 从远程 Git 对 R1 提交做实现复审，再由项目负责人对 `http://192.168.174.70:5173/monitor/data-source-state` 作人工视觉交互复核，之后再决定是否另立任务执行 `DSS-AC-114~118` 共 5 条新增验收。
