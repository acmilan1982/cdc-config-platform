# DATA-SOURCE-LIST-PAGE-SELECTIVE-QUERY-LIST-INTEGRATION-BASELINE-001 执行报告

- 任务编号：`DATA-SOURCE-LIST-PAGE-SELECTIVE-QUERY-LIST-INTEGRATION-BASELINE-001`
- 日期：2026-09-19
- 分支：`develop`
- 任务性质：`FEATURE_ADJUSTMENT_BASELINE_DRAFT`（**纯文档任务**）
- 实现授权：`NOT_GRANTED_IN_THIS_TASK`
- 授权读取：当前远程 Git、当前基线、相关代码与测试（只读）
- 开始前提交（base）：`98e45f22f576799d6524b50a25b1a0791c9d5421`
- 结果提交 / Push：见任务控制台结果块 `result_commit_id` / `remote_commit_id` / `ahead_behind`
- 测试与构建：`NOT_RUN_NOT_REQUIRED_DOCS_ONLY`

> 本任务为“数据源管理”Feature 的**列表首页调整基线草案**：为 `/config/data-source` 第一个主列表页“选择性接入
> 查询列表页公共组件”建立需求、验收、设计、API、UI 影响草案与迁移授权记录。
> **未**修改任何 `.vue`/`.ts`/`.java`/测试/依赖/锁文件/配置/SQL；**未**访问数据库 / ZooKeeper / Kafka；
> **未**启动服务。任务停在“ChatGPT 远程复审 + 项目负责人批准调整基线”入口。

---

## 1. 任务开始前 Git 现场

```text
branch=develop
HEAD=98e45f22f576799d6524b50a25b1a0791c9d5421
origin/develop=98e45f22f576799d6524b50a25b1a0791c9d5421
rev-list --left-right --count HEAD...origin/develop = 0	0
git status --short = "?? docs/prompts/"
```

- 本地 `HEAD` 与 `origin/develop` 一致，`ahead/behind = 0 0`。
- 提示词创建的观察提交 `98e45f2...` 与本任务执行时远程 `develop` 一致，**无需**以新基准恢复现场。
- 工作区仅有 `docs/prompts/` 未跟踪目录（既有、与本任务目标文件不重叠）；本任务对其保持原样，不修改、不暂存、不提交。
- 任务执行期间，`.claude/settings.local.json` 被 Agent 运行环境**自动追加**了若干 `Bash(...)` 权限条目（本任务命令的副产物）。该文件**不在**本任务授权文档范围内，本任务**不暂存、不提交**该文件，也**不**执行 `git checkout`/restore 等回滚操作（项目 Git 规则禁止），保持其现状并如实记录。

## 2. 强制阅读与只读核对范围

### 2.1 项目规则与项目基线

`CLAUDE.md`、`docs/baseline/README.md`、`docs/baseline/query-list-page-template/{README,DESIGN,UI,SHARED_COMPONENT_DESIGN,MIGRATION}.md`、
`docs/features/README.md`（定向 `grep`，因文件过大未整读）。

### 2.2 公共组件当前实现（只读核对真实契约）

`frontend/src/components/query-list/{index.ts,types.ts,QueryListPageShell.vue,QueryListQueryPanel.vue,QueryListActions.vue,QueryListResultPanel.vue}`。

关键事实：四个拟接入组件均已实现并最终接受；`QueryListActions` 的 `widthLock(px)` 为四值同锁
（`width/min-width/max-width/flex-basis` + `flex-grow:0;flex-shrink:0;box-sizing:border-box`）；
`QueryListResultPanel` 固定 DOM 顺序为 header → error-slot → divider → body，`toolbar`/`body` 为具名槽；
`QueryListPageShell` 默认槽子节点直挂 `.ql-page`、无包裹层。

### 2.3 数据源管理 Feature 基线与当前实现

- Feature 基线：`README.md`（本任务新建）、`REQUIREMENTS.md`、`ACCEPTANCE.md`、`DESIGN.md`、`API.md`、`UI.md`、`DATABASE.md`。
- 当前实现（只读）：`frontend/src/views/data-source/DataSourcePage.vue`（1669 行）、
  `frontend/src/types/dataSource.ts`、`frontend/src/views/data-source/dataSource.spec.ts`、
  `backend/src/main/java/com/bsoft/cdcconfig/datasource/**`、`backend/.../common/exception/GlobalExceptionHandler.java`。
- 路由与布局：`frontend/src/router/index.ts`、`frontend/src/layouts/MainLayout.vue`。

### 2.4 关键当前事实（实现侧，只读核对结论）

| 项目 | 当前事实 |
|---|---|
| 查询条件 | 数据源 ID / 数据源名称 / 主机地址三个文本输入，`@keyup.enter` 触发查询；`查询`/`重置` 按钮 |
| 首次加载 / 重置 | `onMounted` 以 `effectiveSnapshot()` 加载；`onReset()` 置空三条件并把 `effectiveQuery` 复位后**立即重新加载全部有效记录**（符合 `DS-REQ-009`） |
| 分页 | **无**任何分页参数或控件；后端契约亦不接受 `pageNum`/`pageSize` |
| 自动刷新 | **无**自动刷新、无刷新工具栏、无倒计时 |
| 双击编辑提示 | **无**“双击数据行可编辑”文案；`@row-dblclick` 打开编辑弹窗 |
| 行操作 | 当前存在**可见“编辑”按钮**（另含删除、目标库“业务属性”、源库“目标库命名策略”），操作列 `width=300 fixed right` |
| Tooltip | 数据源 ID / 名称 / 主机 / Service Name / 用户名等列使用 Element Plus `show-overflow-tooltip` |
| 角色规范化 | 后端忽略大小写识别 `DATA_SOURCE_CATEGORY` 并输出规范化 `SOURCE`/`TARGET`；前端据此渲染源库/目标库 |
| 列表请求参数对象 | `backend/.../datasource/query/DataSourceQuery.java` = `{ id, name, host }`（短小写参数名习惯） |
| 统一参数校验契约 | `GlobalExceptionHandler`：Bean 校验 → HTTP 400 + `code=400` 字段级消息；类型不匹配 → HTTP 400 + `参数类型错误: <name>` |
| 稳定滚动条槽 | `stableScrollbarGutter: true` **仅**在路由 `DataSourceRunState`（`/monitor/data-source-state`）上；`.content-area.is-stable-gutter { scrollbar-gutter: stable }` |

### 2.5 现有测试对被移除能力的引用（如实记录，本轮不改）

`dataSource.spec.ts` 多处通过 `buttonByText(wrapper, '编辑')` 取用行内“编辑”按钮
（如第 421/443/478/490/534/570/606/835/850/865/899 行，及第 1058/1253 行的 `text().includes('编辑')`）。
本轮测试代码**禁止修改**；该事实意味着 `DS-REQ-130`（移除可见编辑按钮）在**实现阶段**必须同步适配测试，
本草案不改测试、不产生实现提交。

## 3. 冲突识别与处理（未静默选边）

### 3.1 模板适用范围与本次“选择性接入”之间的张力

- **当前事实**：已批准的查询列表页模板基线明确面向**只读查询列表页**。
  `docs/baseline/query-list-page-template/MIGRATION.md` §1.1 将“数据源管理（含新增/编辑/删除）”列为
  **“不适合直接套用：含写操作与行级操作列”**；§5 将“含新增/编辑/删除的配置管理页面”列为**不纳入迁移范围**。
- **冲突来源**：本任务 §4.2 要求对数据源管理主列表页**选择性接入**该模板的四个公共组件。
- **影响**：若按模板既有结论，数据源管理**不在**迁移范围内；若按本任务产品输入，需要“选择性接入”。
- **处理方式（已按授权路径落地，未改写模板历史）**：本任务记录项目负责人 **2026-09-18** 的明确授权，
  并将本轮定性为**页面范围化、业务行为不变**的“选择性接入”，走 `MIGRATION.md` §5 明示的
  **“另立任务评估”**路径；同时以**追加**方式在 `MIGRATION.md` 记录该授权与 `DRAFT/NOT_STARTED` 事实，
  **不改写** §1.1/§5 既有结论、不改写参考页历史、不改变模板级
  `page_migration_status`/`page_migration_authorization_status`/`pilot_page_selection_status`。
- **待项目负责人决策**：上述“模板 §1.1/§5 排除 + 本次经明确授权选择性接入”的并行状态，是否需要
  在**后续独立基线维护任务**中显式修订模板 §5 的排除措辞。本任务不自行修订，仅如实记录并提交 ChatGPT 复审。

### 3.2 既有可观测点的“局部替代”，避免新旧结论并存

对三个被本轮触及的既有结论，统一采用文档既有“替代/修订”机制，**局部**替代并**显式声明边界**：

| 既有条目 | 本轮处理 | 替代边界 |
|---|---|---|
| `DS-REQ-006`（查询条件严格限定为三个文本输入框） | `DS-REQ-125` **局部替代其排他性** | “存在且仅存在三个文本条件”继续有效；新增角色单选后当前有效结论为“三文本条件 + 一角色单选” |
| `DS-REQ-013` 编辑项 / `DS-REQ-014`“单击编辑按钮” | `DS-REQ-130` **局部替代** | `DS-REQ-013` 的“业务属性/命名策略/删除”三项及 `DS-REQ-014`“双击行 = 编辑”继续有效；仅移除按钮入口 |
| `UI.md` §1 页面区划/结果区头部/查询区排布 | `UI.md` §10.1 **局部替代** | §1 的列清单、不得展示列、无分页、默认排序、角色规范化、双击编辑等结论继续有效 |

对应验收侧：`ACCEPTANCE.md` §4.2/§4.3 分别加“本轮调整草案局部替代提示”，说明
`DS-AC-007`/`DS-AC-009`/`DS-AC-011` 的**当前有效结论边界**已改变，但其**历史状态 `PASS` 与执行证据逐字保留**。

### 3.3 非法角色参数的契约选择

- `API.md` §5.2 明确将业务码 `40001` 限定为“**仅用于新增/编辑主表请求中 `dataSourceCategory` 非 `SOURCE`/`TARGET`**”，
  不适用于列表查询参数；若复用 `40001` 将扩大该码既有语义。
- 处理：列表查询参数非法值走**统一请求参数校验契约**（Bean 校验 →
  `MethodArgumentNotValidException` → HTTP 400 / `code=400` / 字段级消息），**不新增**业务错误码。
  该结论记录于 `API.md` §9.2，并说明与 `DS-AC-105` 确立的“非法参数返回 HTTP 400 而非 500”方向一致。

## 4. 变更文件与变更范围

| 文件 | 操作 | 变更范围 |
|---|---|---|
| `docs/features/data-source-management/README.md` | **新增** | Feature 状态与导航入口：分层状态（既有基线 `APPROVED` + 本轮草案 `DRAFT_PENDING_USER_REVIEW`）、文档导航、边界速览、变更记录 |
| `docs/features/data-source-management/REQUIREMENTS.md` | 修改 | 新增 §22 调整草案需求 `DS-REQ-116~138`（23 条，含四段局部替代声明）；§21 变更记录追加一行 |
| `docs/features/data-source-management/ACCEPTANCE.md` | 修改 | §3 新增本轮草案分类行与分层说明；§4.16 新增 `DS-AC-116~140`（25 条，全部 `NOT_RUN`）；§4.2/§4.3 加局部替代提示；§5 追踪矩阵追加 `DS-REQ-116~138`；§7 变更记录追加一行 |
| `docs/features/data-source-management/DESIGN.md` | 修改 | 新增 §11 调整草案设计（职责边界、组件映射、槽位归属、页面结构、角色查询、操作列、Tooltip 结论、无分页、几何稳定、迁移授权边界、追踪）；新增 §12 本轮变更记录 |
| `docs/features/data-source-management/API.md` | 修改 | 新增 §9 角色查询参数草案（参数定义、非法值行为、与 §4.1 差异、追踪）；新增 §10 本轮变更记录 |
| `docs/features/data-source-management/UI.md` | 修改 | 新增 §10 列表首页选择性接入草案（三段结构、结果区头部、角色单选、操作列与“更多”菜单、Tooltip、弹窗零变化与零回归、追踪、变更记录），含对 §1 的局部替代声明 |
| `docs/features/data-source-management/DATABASE.md` | 修改（最小） | 新增 §8 本轮数据库变化声明：**无任何 DDL / 无结构变化**，角色过滤仅复用既有 `DATA_SOURCE_CATEGORY` 列 |
| `docs/baseline/query-list-page-template/MIGRATION.md` | 修改（**只追加**） | 追加“数据源管理列表页选择性接入授权记录（2026-09-18 授权 / 2026-09-19 记录）”：授权事实、与 §1.1/§5 的关系、当前状态块、禁止边界；既有历史与状态块**未修改** |
| `docs/features/data-source-management/reports/DATA-SOURCE-LIST-PAGE-SELECTIVE-QUERY-LIST-INTEGRATION-BASELINE-001.md` | **新增** | 本报告 |

**未修改**：任何 `.vue`/`.ts`/`.java`、任何测试、依赖、锁文件、配置、SQL、数据库对象、菜单、路由；
`docs/baseline/` 六份项目级基线；`docs/baseline/query-list-page-template/{README,DESIGN,UI,SHARED_COMPONENT_DESIGN}.md`；
`docs/features/README.md`；`docs/database/**`；任何公共组件实现；任何历史报告。

## 5. 编号统计与追踪统计

```text
requirements_before=DS-REQ-001..115 (115 条, APPROVED, 逐字冻结)
requirements_added=DS-REQ-116..138 (23 条, DRAFT_PENDING_USER_REVIEW, 全部 NOT_STARTED)
requirements_after=DS-REQ-001..138 (138 条, 无重编号/复用/删除)
requirement_count_delta=+23

acceptance_before=DS-AC-001..115 (115 条, PASS=113/FAIL=0/BLOCKED=2/NOT_RUN=0, 逐字冻结)
acceptance_added=DS-AC-116..140 (25 条, 全部 NOT_RUN)
acceptance_after=DS-AC-001..140 (140 条, 无重编号/复用/删除)
acceptance_count_delta=+25

traceability_new_requirement_rows=23 (DS-REQ-116..138 全部有覆盖)
traceability_new_cases_referenced=25/25 (DS-AC-116..140 全部被引用)
traceability_status=COMPLETE
```

编号连续性：`DS-REQ` 由既有最大 115 续至 138（连续无缺号）；`DS-AC` 由既有最大 115 续至 140（连续无缺号）。
`REQUIREMENTS §22 ↔ ACCEPTANCE §4.16 ↔ DESIGN §11 ↔ API §9 ↔ UI §10 ↔ DATABASE §8` 双向追踪完整。

## 6. 既有正式验收历史的保留核验

```text
feature_existing_acceptance_statistics=PASS_113_FAIL_0_BLOCKED_2_NOT_RUN_0  # 逐字保留
blocked_cases=DS-AC-104,DS-AC-108                                          # 两个既有 BLOCKED 未被清零
implementation_status=IMPLEMENTED_PENDING_REVIEW                            # 未写为 IMPLEMENTED_ACCEPTED
formal_acceptance_status=BLOCKED
new_adjustment_acceptance_status=ALL_NOT_RUN
```

## 7. 明确未执行事项

- 未修改任何业务代码、测试代码、依赖、锁文件、配置、SQL 或数据库对象；
- 未访问数据库 / ZooKeeper / Kafka；未执行任何 DDL/DML；
- 未启动 / 停止前后端服务；
- 未运行 Maven / npm 测试或构建（`NOT_RUN_NOT_REQUIRED_DOCS_ONLY`）；
- 未创建分页；未删除 Tooltip；未新增刷新能力；未修改任何弹窗内容或视觉；
- 未修改任何公共组件实现；未迁移其他页面；
- 未把模板默认“重置不查询”套用到数据源管理；
- 未生成本轮实现提交或正式验收结果；
- 未把文档草案状态写成 `APPROVED` / `IMPLEMENTED` / `PASS` / `ACCEPTED`。

## 8. 本轮未修复的既有过期状态（如实记录，不在授权范围内）

- `docs/features/data-source-management/DATABASE.md` 头部元数据仍为“实现状态 `NOT_STARTED`、106 条验收仍全部 `NOT_RUN`”，
  与当前正式复验事实（`IMPLEMENTED_PENDING_REVIEW`、`PASS=113/FAIL=0/BLOCKED=2/NOT_RUN=0`）不一致；
  本任务按提示词只做“无数据库变化声明”的最小更新，**未**顺带改写该头部元数据。
- `docs/features/README.md` 中“数据源管理”条目仍为“部分实现（后端 CRUD 完整，前端占位）… `BASELINE_NOT_ESTABLISHED`”，
  与现状不符；该索引**不在**本任务授权范围，**未**修改。
- `docs/baseline/PROJECT_STATUS.md` §1.1 仍将数据源管理列为占位页；
  项目级基线**只能**由用户批准的独立基线维护任务修改，本任务**未**修改。

以上均建议由**独立文档维护任务**评估修正，以免在业务调整任务中夹带基线改动。

## 9. 下一步入口

```text
next_step=CHATGPT_REMOTE_GIT_REVIEW_THEN_PROJECT_OWNER_BASELINE_APPROVAL_DECISION
```

1. ChatGPT 从**远程 Git**（`origin/develop`）独立复审本草案，重点核对：
   模板适用范围授权的处理（§3.1）、局部替代边界（§3.2）、角色参数契约选择（§3.3）、
   既有 `PASS=113/FAIL=0/BLOCKED=2/NOT_RUN=0` 与两个 `BLOCKED` 是否逐字保留。
2. 项目负责人决定是否**批准本轮调整基线**；批准后**另行**生成本轮实现任务提示词。
3. 本任务**不得**继续实现。

---

## 10. 变更记录

| 日期 | 变更 | 依据 |
|---|---|---|
| 2026-09-19 | 创建本报告：记录读取范围、当前事实、冲突处理、变更文件、编号与追踪统计、未执行事项、既有过期状态与下一步入口 | DATA-SOURCE-LIST-PAGE-SELECTIVE-QUERY-LIST-INTEGRATION-BASELINE-001（纯文档任务） |
