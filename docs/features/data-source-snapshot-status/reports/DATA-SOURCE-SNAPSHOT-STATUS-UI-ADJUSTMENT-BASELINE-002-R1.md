# 第二轮验收前 UI 调整草案 R1 极小定向修订执行报告 DATA-SOURCE-SNAPSHOT-STATUS-UI-ADJUSTMENT-BASELINE-002-R1

## 1. 任务信息

| 项目 | 值 |
|---|---|
| 任务编号 | `DATA-SOURCE-SNAPSHOT-STATUS-UI-ADJUSTMENT-BASELINE-002-R1` |
| 任务类型 | `DOCUMENT_DRAFT_REVISION_R1`（纯文档、第二轮验收前 UI 调整草案的 R1 极小定向修订；不批准、不实现、不执行正式验收） |
| Feature | 源库快照状态（slug `data-source-snapshot-status`） |
| 所属模块 | 运行监控 |
| 任务状态 | `COMPLETED`（R1 定向修订完成并入库；草案仍未批准、第二轮调整仍未实现、仍未执行正式验收） |
| 驱动事实 | ChatGPT 对第二轮验收前 UI 调整草案初版提交 `0889cec1a67b6e0be654f6cb1f771b71df19677d` 独立正式复审，结论 `CHANGES_REQUIRED`——初版提交范围、75 条需求、86 条验收与第二轮四项核心调整均通过，仅要求定向修订残留冲突与实现落点描述；初版任务为 `DATA-SOURCE-SNAPSHOT-STATUS-UI-ADJUSTMENT-BASELINE-002` |
| 任务基准提交（base） | `0889cec1a67b6e0be654f6cb1f771b71df19677d`（本任务开始时本地 HEAD 与 `origin/develop`、远程 `refs/heads/develop` 一致，ahead/behind=0/0） |
| 执行分支 | `develop` |
| 结果提交 | 见本任务机器可读输出 `AGENT_TASK_RESULT` 的 `result_commit_id`（本报告不自引用，惯例同 BASELINE-002 报告 §1） |
| 远程提交 | 见 `AGENT_TASK_RESULT` 的 `remote_commit_id`（普通推送至 `origin/develop`，推送后本地 HEAD、`origin/develop`、远程三者一致，ahead/behind=0/0） |

## 2. 任务范围与目标

在第二轮验收前 UI 调整草案（初版提交 `0889cec...`）基础上，把 ChatGPT 独立复审指出的残留冲突与实现落点描述做 **R1 纯文档极小定向修订**。本任务：

- 只修改 `DSS-REQ-067`、`DESIGN.md` §5.6/§22.8（及标题锚点）、`UI.md` §8.2/§16.1/§16.8 中与第二轮现行规则冲突或表述不准确的现行规则文字；不改变第二轮四项核心调整及其数值、不重新设计已通过复审的第二轮核心规则。
- 不新增 `DSS-REQ-076`，不新增任何验收编号；需求保持 75 条、验收保持 86 条全部 `NOT_RUN`。
- 不改接口/SQL/表结构/数据库访问与产品只读边界（`API.md`/`DATABASE.md` 整文件零差异）；不改任何源码/测试/配置/菜单/路由/既有证据。
- 不批准第二轮草案、不实现第二轮调整、不执行任何正式验收或人工页面验收。

## 3. 环境与前置检查

| 检查项 | 结果 |
|---|---|
| 当前目录 | `/agent/cdc-config-platform`（Git 仓库） |
| 当前分支 | `develop` |
| 本任务开始前 Commit ID | `0889cec1a67b6e0be654f6cb1f771b71df19677d` |
| `origin/develop` | `0889cec1a67b6e0be654f6cb1f771b71df19677d`（fetch 后核对） |
| `git ls-remote origin refs/heads/develop` | `0889cec1a67b6e0be654f6cb1f771b71df19677d` |
| ahead/behind | `0/0`（无分叉） |
| 与本任务无关的既有工作区修改 | 存在大量用户既有未提交内容；保持原样，未清理、未覆盖、未暂存、未提交，未使用任何破坏性 Git 命令 |
| 环境预检 | 纯文档任务；不要求后端/前端/数据库/ZooKeeper 环境启动（验证矩阵 `NOT_APPLICABLE`） |

## 4. 允许修改范围（白名单，7 个文件）

1. `docs/features/data-source-snapshot-status/REQUIREMENTS.md`（修改：仅 `DSS-REQ-067` 业务行＋§25 变更记录）
2. `docs/features/data-source-snapshot-status/DESIGN.md`（修改：§5.6 及标题锚点、§22.8）
3. `docs/features/data-source-snapshot-status/UI.md`（修改：§8.2、§16.1、§16.8）
4. `docs/features/data-source-snapshot-status/README.md`（修改：§1 注记、§5 报告导航、§8/§9 记录、§10 下一入口）
5. `docs/features/README.md`（修改：`data-source-snapshot-status` 行最小同步）
6. `docs/features/data-source-snapshot-status/reports/DATA-SOURCE-SNAPSHOT-STATUS-UI-ADJUSTMENT-BASELINE-002.md`（只追加 §14 R1 注记）
7. `docs/features/data-source-snapshot-status/reports/DATA-SOURCE-SNAPSHOT-STATUS-UI-ADJUSTMENT-BASELINE-002-R1.md`（新增，本文件）

`ACCEPTANCE.md`、`API.md`、`DATABASE.md` 必须整文件零差异；所有源码/测试/配置/菜单/路由/既有证据、其他既有报告、其他 Feature 文档必须零修改。

## 5. R1-01~R1-05 修订前后口径与实际落点

### 5.1 R1-01：修订 `DSS-REQ-067` 的现行冲突（落点 `REQUIREMENTS.md` `DSS-REQ-067` 行）

- 修订前末句：`既有行内关联异常提示继续保留，不在头部扩展复杂的多类别汇总。`
- 修订后口径：保留结果卡片头部总数与未知状态汇总规则；行内展示统一遵循 `DSS-REQ-028/029/045/073/074` 的第二轮现行规则——除探针端关联配置 `FG_ACTIVE!='1'` 时在 `CLIENT_ID` 后显示红色普通文字“停用”外，本页不显示关联异常图标、异常文字或异常 Tooltip；源库缺失、停用或类别非 `SOURCE` 不产生行内异常提示；未知快照状态标签及原始状态值 Tooltip 不受影响；不改变头部 `unknownCount` 的统计语义。
- `DSS-REQ-067` 是本任务唯一允许改变的需求业务行；未新增 `DSS-REQ-076`。

### 5.2 R1-02：修订 `DESIGN.md` §5.6 的现行展示冲突（落点 DESIGN §5.6）

- 修订前：§5.6 标题“关联异常标志模型（结论）”；正文“前端据此渲染单元格内图标/弱提示与 Tooltip”；类别归一决策“`upper!='SOURCE'`（含 `TARGET`、空、畸形）产生‘类别非 SOURCE’轻提示”；源库展示条目“类别异常只加提示、绝不影响行保留”。
- 修订后唯一现行展示语义：
  1. `clientRef.state`：`ACTIVE` 只显示 `CLIENT_ID`；`INACTIVE` 显示 `CLIENT_ID`＋空格＋红色普通文字“停用”；`NOT_FOUND` 只显示原始 `CLIENT_ID`（静默）；Tooltip 只取非空完整 `clientRef.desc`，不拼接状态或异常说明。
  2. `sourceRef.state/category/sourceRole`：继续由后端映射并保留在响应中，前端只用于 ORG/原始 ID 的展示回退，不产生黄色图标、红字、异常文字或异常 Tooltip。
  3. `upper!='SOURCE'` 仍归一为 `sourceRole=false`，但这是只读数据语义、不是页面告警条件。
  4. RUN_STATE 行始终保留，不因关联状态过滤或丢行。
- 标题最小改为“关联引用状态模型（结论）”，并同步必要的锚点/引用：§3.2 引用（DESIGN:111，原误标 §5.5 一并纠正为 §5.6）、§4.3 服务职责映射输出名（原“关联异常标志”）、§5.1 逐行映射清单、§15.1 已定关键决策第 5 条（原“非 SOURCE 仅提示不丢行”改为只读数据语义、行始终保留口径）。
- 保留：`clientRef`/`sourceRef` 数据映射模型、状态字段、后端宽容映射、`API`/后端设计不变（本任务零代码、零接口改动）。

### 5.3 R1-03：修订 `UI.md` §8.2 的可访问性冲突（落点 UI §8.2）

- 修订前：§8.2 含“状态与异常信息均有文字”“状态标签、异常图标对辅助技术可读（文本优先）”等仍暗示关联异常图标的泛化表述。
- 修订后唯一口径：快照状态标签具有明确文字（§5.1/§5.2），未知状态保留原始值；探针端非启用红字“停用”是有明确含义的可读文字（§16.3）；状态与页面请求错误信息均有文字表达、不只依赖颜色传达状态（§5.3）；本页探针端与源库列**不存在关联异常图标**，因而没有需向辅助技术传达的关联异常图标或异常说明（§5.4/§16.6）。
- 未知快照状态与页面请求错误提示仍按既有规则处理。

### 5.4 R1-04：纠正 `UI.md` §16.1 的错误历史说明（落点 UI §16.1 取代/修订清单项）

- 修订前：取代清单写作“§13.4 源库正常行 Tooltip 用原始 `DATA_SOURCE_ID` 的旧表述 → 正常行 Tooltip 只用完整 `DATA_SOURCE_ORG`”，该说法把第一轮 §13.4 正常源库行 Tooltip 描述为使用原始 ID，与第一轮真实历史（正常行 Tooltip 本就用完整 ORG，见 UI §13.4 历史）不符。
- 修订后准确历史说明：正常源库行 Tooltip 一直显示完整 `DATA_SOURCE_ORG`、不以原始 `DATA_SOURCE_ID` 作为正常行 Tooltip 默认内容，第二轮未改变该正常行规则；第二轮只改变**回退行**（源库配置缺失或 ORG 为空）Tooltip——不再追加“配置缺失”等异常说明，只显示完整原始 `DATA_SOURCE_ID`（§16.4，对应 `DSS-REQ-029` 修订）。不制造不存在的第一轮差异。

### 5.5 R1-05：纠正预计前端实现文件职责（落点 DESIGN §22.8 与 UI §16.8）

- 修订前：预计实现文件把“受控 Tooltip 当前槽/内容源、下拉展示截断与完整 value 隔离”归给 `composables/useDataSourceSnapshot.ts`。
- 修订后统一职责：`DataSourceRunStatePage.vue`（结果卡片/表格容器铺满与页面组合）；`components/DataSourceSnapshotTable.vue`（弹性列宽、探针端/源库单元格内容与 Tooltip 触发内容、删除黄色图标）；`components/DataSourceSnapshotQueryBar.vue`（option label 的 Unicode 安全截断、selected tag 视觉约束、控件与 popper 宽度）；`tooltip/useSnapshotTooltip.ts`（仅在实现确有必要时调整页面级单实例 Tooltip 状态或内容切换；若现有通用状态逻辑已满足则保持不变）；`composables/useDataSourceSnapshot.ts`（**不属于本轮预计修改文件**；查询、已应用条件、刷新、单飞行与计时器状态机必须保持不变）。
- 因本任务为纯文档，未因此修改任何代码。

## 6. 需求/验收/设计/状态计数与一致性

| 项 | 值 |
|---|---|
| requirements_status | `DRAFT_ADJUSTMENT_PENDING_USER_REVIEW`（当前第二轮调整版本） |
| acceptance_status | `DRAFT_ADJUSTMENT_PENDING_USER_REVIEW` |
| design_status（DESIGN.md/UI.md） | `DRAFT_ADJUSTMENT_PENDING_USER_REVIEW` |
| implementation_status | `IMPLEMENTED_ADJUSTMENT_PENDING` |
| formal_acceptance_execution_status | `NOT_RUN` |
| human_visual_acceptance_status | `NOT_RUN` |
| human_visual_review_status | `CHANGES_REQUIRED` |
| requirements_count | `75`（`DSS-REQ-001~075`；不新增 076） |
| acceptance_count | `86`（`DSS-AC-001~086` 全部 `NOT_RUN`） |
| acceptance_not_run_count | `86` |
| requirements_acceptance_coverage | `75/75` |
| acceptance_reverse_reference_status | `COMPLETE`（无悬空） |
| pending_user_review | `YES` |
| pending_user_confirmation_count | `0` |
| req067_revision_status | `REVISED_IN_PLACE`（R1-01） |
| requirements_other_business_rows_diff | `ZERO`（其余 74 条需求业务行相对 `0889cec...` 逐字节零差异） |
| acceptance_file_diff | `ZERO`（`ACCEPTANCE.md` 整文件零差异） |
| acceptance_traceability_diff | `ZERO`（追踪矩阵零差异） |
| design_56_current_display_conflict_status | `REVISED_TO_R2_REFERENCE_STATE_SEMANTICS`（标题改“关联引用状态模型”＋锚点同步） |
| ui_accessibility_conflict_status | `REVISED_TO_R2_ACCESSIBILITY_STATEMENT`（无关联异常图标可读表述残留） |
| ui_history_statement_status | `CORRECTED`（§16.1 撤销不存在的第一轮差异，改为准确历史说明） |
| implementation_file_responsibility_status | `CORRECTED`（Tooltip/下拉职责归 `tooltip/useSnapshotTooltip.ts`；`composables/useDataSourceSnapshot.ts` 不属于本轮修改文件） |
| conflict_residual_scan_status | `COMPLETE`（§8 扫描无现行规则残留冲突） |
| api_file_diff | `ZERO` |
| database_file_diff | `ZERO` |
| code_change_status | `NONE` |
| test_build_status | `NOT_RUN_NOT_APPLICABLE_DOCS_ONLY` |
| browser_verification_status | `NOT_RUN_NOT_APPLICABLE_DOCS_ONLY` |
| database_access_status | `NONE` |
| database_write_status | `NONE` |
| ddl_status | `NONE` |
| zookeeper_access_status | `NONE` |
| kafka_access_status | `NONE` |
| service_operation_status | `NONE` |
| report_path | `docs/features/data-source-snapshot-status/reports/DATA-SOURCE-SNAPSHOT-STATUS-UI-ADJUSTMENT-BASELINE-002-R1.md` |
| error | 无 |

`CHANGES_REQUIRED` 是项目负责人对第一轮页面的人工检查结论及 ChatGPT 对第二轮草案初版提交的复审结论；它不代表本 R1 可以自行批准。R1 完成后仍等待 ChatGPT 对 R1 结果提交独立复审。

## 7. 初版报告处理

初版报告 `reports/DATA-SOURCE-SNAPSHOT-STATUS-UI-ADJUSTMENT-BASELINE-002.md` 作为历史执行报告保留，未重写其初版任务结果，只追加了 §14 R1 复审注记，说明：

- ChatGPT 独立复审发现初版残留冲突；
- 初版 `conflict_residual_scan_status=COMPLETE` 仅代表初版 Agent 当时的自检结果，不代表独立复审通过；
- R1 已对 `DSS-REQ-067`、DESIGN §5.6/§22.8、UI §8.2/§16.1/§16.8 完成定向修订；
- 初版提交与其余历史内容保持不变。

## 8. 强制一致性与残留扫描（任务 §9，Commit 前机械核验）

1. 需求编号 `DSS-REQ-001~075` 连续唯一，共 75 条——`PASS`。
2. 验收编号 `DSS-AC-001~086` 连续唯一，共 86 条，全部 `NOT_RUN`——`PASS`。
3. 需求—验收覆盖 75/75，反向引用无悬空——`PASS`。
4. 相对 `0889cec...`，仅 `DSS-REQ-067` 业务行允许变化，其余 74 条需求业务行逐字节零差异——`PASS`（git diff 核验见 §9）。
5. `ACCEPTANCE.md` 及追踪矩阵整文件零差异——`PASS`。
6. API、DATABASE、代码、测试、配置与既有证据零差异——`PASS`。
7. 当前第二轮状态在 REQUIREMENTS/DESIGN/UI/Feature README/总索引中一致——`PASS`。
8. 全部实际变更严格落在白名单 7 个文件——`PASS`。
9. 全部修改文件为有效 UTF-8，实 NUL 字节为 0——`PASS`（UTF-8/NUL 检测通过）。
10. 当前规则中无下列残留：
    - “既有行内关联异常提示继续保留”——`REMOVED`（`DSS-REQ-067` 修订）。
    - 前端为两列关联状态渲染黄色图标或异常弱提示——`REMOVED`（DESIGN §5.6 现行展示语义）。
    - `upper!='SOURCE'` 产生页面“类别非 SOURCE”提示——`REMOVED`（DESIGN §5.6 决策与 §15.1）。
    - “类别异常只加提示”——`REMOVED`（DESIGN §5.6）。
    - “异常图标对辅助技术可读”——`REMOVED`（UI §8.2）。
    - 第一轮正常源库 Tooltip 使用原始 `DATA_SOURCE_ID` 的错误历史陈述——`REMOVED`（UI §16.1）。
    - 将下拉截断或 Tooltip 展示职责分配给 `useDataSourceSnapshot.ts`——`REMOVED`（DESIGN §22.8、UI §16.8）。

历史原文如需保留，仅位于明确标记的历史章节（DESIGN §16~§21、UI §11~§15 等第一轮时点记录）或执行报告初版结果中，不构成现行规则；第一轮批准/实现及其 R1 历史事实未被改写。

## 9. 相对任务基准 `0889cec...` 的实际变更核验

- 实际变更文件：仅白名单 7 个文件（见 §4）；`git diff --cached --name-status` 逐文件核验通过。
- `REQUIREMENTS.md`：仅 `DSS-REQ-067` 业务行与 §25 变更记录各一行变化；其余 74 条 `DSS-REQ-*` 业务行逐字节零差异。
- `ACCEPTANCE.md`/`API.md`/`DATABASE.md`：整文件零差异。
- 全部源码、测试、配置、菜单、路由、既有证据：零差异。
- DESIGN/UI 只改动 §5.6（及标题锚点）、§8.2、§16.1、§16.8、§22.8 等 R1-01~R1-05 落点文字；其余为第二轮草案既有内容，零差异。
- UTF-8/NUL：全部修改文件为有效 UTF-8、实 NUL 字节为 0。

## 10. 未执行事项

- 未访问或操作数据库，未执行任何 SELECT/DML/DDL；未操作 ZooKeeper、Kafka、sync-client、sync-server；未启动/停止/重启任何服务。
- 未运行浏览器联调、前后端构建或测试（纯文档任务，验证矩阵 `NOT_APPLICABLE`）。
- 未批准第二轮草案（四文档当前第二轮版本均保持 `DRAFT_ADJUSTMENT_PENDING_USER_REVIEW`）；未把草案写成 `APPROVED`/`PASS`/`ACCEPTED`/`IMPLEMENTED_ACCEPTED`，未把第一轮实现完成状态写成已接受。
- 未执行任何正式验收或人工页面验收（86 条 `DSS-AC-001~086` 全部保持 `NOT_RUN`）。
- 未修改白名单外文件；未暂存或提交用户既有修改；未使用任何破坏性 Git 命令。

## 11. 工作区既有修改保护

工作区存在大量与本任务无关的用户既有未提交内容（前端布局/菜单/大屏、`agent-env.sh`、数据库与 agent 过程文档、既有报告等）。本任务未清理、未覆盖、未暂存、未提交这些内容，仅逐个暂存白名单内且确由本任务产生的实际变更文件；未使用任何破坏性 Git 命令。

## 12. Git 提交与推送结果

- 提交信息含任务代码 `DATA-SOURCE-SNAPSHOT-STATUS-UI-ADJUSTMENT-BASELINE-002-R1`（普通提交，未 amend、未强推）。
- 推送：普通推送至 `origin/develop`（非强推）。推送后核对本地 HEAD、`origin/develop`、`git ls-remote origin refs/heads/develop` 三者一致，ahead/behind=0/0。
- 结果提交 ID 与远程提交 ID 见本任务机器可读输出 `AGENT_TASK_RESULT`（本报告不自引用，惯例同 BASELINE-002 报告）。

## 13. 下一入口

下一入口只能是 **ChatGPT 对 R1 结果提交（`DATA-SOURCE-SNAPSHOT-STATUS-UI-ADJUSTMENT-BASELINE-002-R1`）进行独立正式复审（`pending_user_review=YES`，不是直接实现）**；复审 `APPROVED` 且项目负责人明确批准后，再另立第二轮 UI 调整实现任务按 DESIGN §22/UI §16 落地；正式验收（`DSS-AC-001~086` 共 86 条）另立独立正式验收任务执行。本任务完成后立即停止，不继续批准草案、不实现第二轮调整、不执行正式验收。
