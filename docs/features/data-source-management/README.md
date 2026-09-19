# 数据源管理 Feature 入口（README）

> 本文件是“数据源管理”（`data-source-management`）Feature 的**状态与导航入口**，不承载新的正式结论。
> 正式结论一律以本目录各专门文档为准；本文件与专门文档冲突时，以专门文档为准。
> 文档状态：`APPROVED`（本入口文档本身已随本轮调整基线批准收口；其描述的既有基线状态为 `APPROVED`，本轮调整基线为 `APPROVED`（需求、设计、API、UI 与验收标准定义已批准，列表首页调整已实现，状态 `IMPLEMENTED_PENDING_USER_REVIEW`；正式验收未执行、新增验收全部 `NOT_RUN`））
> 建立任务：`DATA-SOURCE-LIST-PAGE-SELECTIVE-QUERY-LIST-INTEGRATION-BASELINE-001`
> 建立日期：2026-09-19
> 批准任务：`DATA-SOURCE-LIST-PAGE-SELECTIVE-QUERY-LIST-INTEGRATION-APPROVAL-CLOSEOUT-001`
> 批准日期：2026-09-19
> 批准人：项目负责人（用户）
> 批准依据：用户明确回复“批准这轮调整基线”
> 实现任务：`DATA-SOURCE-LIST-PAGE-SELECTIVE-QUERY-LIST-INTEGRATION-IMPLEMENTATION-001`
> 实现日期：2026-09-19
> 实现状态：`IMPLEMENTED_PENDING_USER_REVIEW`（实现已完成，停在项目负责人页面目测与后续正式验收入口；未置为 `IMPLEMENTED_ACCEPTED`）
>
> **当前调整草案（尚待批准）**：`DATA-SOURCE-LIST-ALL-STATUS-ENABLE-DISABLE-UI-ADJUSTMENT-BASELINE-001`，状态 `DRAFT_PENDING_USER_REVIEW`，见 §2.3。该草案**不影响**上方既有基线（§2.1）与上一轮调整基线（§2.2）的已批准状态，也**不代表**任何已批准、已实现、已测试、已验收或生产可用结论。

---

## 1. 定位

| 项目 | 值 |
|---|---|
| Feature 中文名称 | 数据源管理 |
| Feature 标识 | `data-source-management` |
| 正式菜单 | 数据源管理（配置管理组） |
| 既有路由 | `/config/data-source`（name `DataSource`） |
| 页面组件 | `frontend/src/views/data-source/DataSourcePage.vue` |
| 后端包 | `com.bsoft.cdcconfig.datasource` |
| 主表 | `CDC_DATA_SOURCE`（主数据源）、`CDC_DATA_SOURCE_EXTEND`（源库到目标库的命名策略） |

“数据源管理”是对源库（`SOURCE`）与目标库（`TARGET`）连接配置进行增、删、改、查维护的**配置管理页面**，不是只读查询监控页。

## 2. 状态分层（必须严格区分，不得合并表述）

### 2.1 既有基线（`APPROVED`）

```text
feature_baseline_status=APPROVED
requirements_status=APPROVED            # DS-REQ-001~115
acceptance_criteria_status=APPROVED     # DS-AC-001~115
design_status=APPROVED                  # DESIGN.md / API.md / UI.md / DATABASE.md
implementation_status=IMPLEMENTED_PENDING_REVIEW
formal_acceptance_status=BLOCKED
feature_existing_acceptance_statistics=PASS_113_FAIL_0_BLOCKED_2_NOT_RUN_0
blocked_cases=DS-AC-104,DS-AC-108
```

- 既有正式验收历史必须原样保留：`PASS=113 / FAIL=0 / BLOCKED=2 / NOT_RUN=0`；`DS-AC-104`（MySQL 远程授权与 Doris 环境未具备）与 `DS-AC-108`（共享 Oracle 开发库无法安全构造“系统完全无数据”空状态）保持既有阻塞。
- 实现状态为 `IMPLEMENTED_PENDING_REVIEW`，**未**置为 `IMPLEMENTED_ACCEPTED`；不得把文档批准当作用例通过证据。

### 2.2 本轮调整基线（`APPROVED`，已实现待目测）

```text
current_adjustment_task=DATA-SOURCE-LIST-PAGE-SELECTIVE-QUERY-LIST-INTEGRATION-BASELINE-001
current_adjustment_document_status=APPROVED
adjustment_baseline_status=APPROVED
current_adjustment_implementation_status=IMPLEMENTED_PENDING_USER_REVIEW
current_adjustment_acceptance_status=ALL_NOT_RUN
implementation_authorization_status=GRANTED_IN_THIS_TASK
formal_acceptance_execution_status=NOT_RUN
new_adjustment_acceptance_status=ALL_NOT_RUN
```

- 本轮为 `/config/data-source` **第一个主列表页**的“列表首页调整基线”，性质为 `FEATURE_ADJUSTMENT_BASELINE_DRAFT`；已于 2026-09-19 由项目负责人批准（批准链：初版草案提交 `01680ee527b8e35cd4afd84c4789b862d34f7a77` → R1 修订提交 `c3fd460bea64a14ccc7b52a554194a133330e29d` → ChatGPT 远程 Git R1 复审结论 `REVIEW_PASS` → 项目负责人明确回复“批准这轮调整基线”；批准任务 `DATA-SOURCE-LIST-PAGE-SELECTIVE-QUERY-LIST-INTEGRATION-APPROVAL-CLOSEOUT-001`）。
- 批准只代表需求、设计、API、UI 与验收标准定义正式成立，并随本轮调整基线一并批准 `DATABASE.md §8` 的“本轮无数据库变化声明”，**不代表**已实现、已测试、已验收或生产可用：本轮实现已由 `DATA-SOURCE-LIST-PAGE-SELECTIVE-QUERY-LIST-INTEGRATION-IMPLEMENTATION-001` 完成（实现状态 `IMPLEMENTED_PENDING_USER_REVIEW`，实现授权 `GRANTED_IN_THIS_TASK`），但本轮新增 `DS-AC-116~140`（25 条）仍全部 `NOT_RUN`（`ALL_NOT_RUN`），正式验收执行状态为 `NOT_RUN`。
- 本轮实现**未修改**公共查询列表组件、三个业务弹窗、其他路由/Feature、依赖或配置，**未修改**数据库对象、SQL 或数据库配置；**未**启动服务；**未**访问数据库 / ZooKeeper / Kafka。
- 下一步为 ChatGPT 从远程 Git 独立复审实现提交，再由项目负责人进行页面目测；此后另行决定是否正式执行 `DS-AC-116~140`。

### 2.3 新调整草案（`DRAFT_PENDING_USER_REVIEW`）

```text
new_adjustment_task=DATA-SOURCE-LIST-ALL-STATUS-ENABLE-DISABLE-UI-ADJUSTMENT-BASELINE-001
adjustment_document_status=DRAFT_PENDING_USER_REVIEW
adjustment_baseline_status=DRAFT_PENDING_USER_REVIEW
implementation_status=NOT_STARTED
implementation_authorization_status=NOT_GRANTED_IN_THIS_TASK
formal_acceptance_execution_status=NOT_RUN
new_adjustment_acceptance_status=ALL_NOT_RUN
```

- 本轮为 `/config/data-source` **第一个主列表页**的又一调整基线草案，性质为 `FEATURE_ADJUSTMENT_BASELINE_DRAFT`；范围是「列表展示全部状态、逐行启用/停用、结果区头部与序号列、行高与字体、新增按钮视觉」。
- 新增需求 `DS-REQ-139~177`（39 条）、新增验收 `DS-AC-141~182`（42 条，全部 `NOT_RUN`）；详见 [REQUIREMENTS.md](./REQUIREMENTS.md) §23 与 [ACCEPTANCE.md](./ACCEPTANCE.md) §4.17。
- 本草案**尚未**获得项目负责人批准，**尚未**授权实现，**未**执行任何正式验收；不得写为 `APPROVED`、`IMPLEMENTED`、`IMPLEMENTED_ACCEPTED`、已测试、已验收或生产可用。
- §2.1 既有基线状态与既有正式复验统计 `PASS=113/FAIL=0/BLOCKED=2/NOT_RUN=0`、`DS-AC-104`/`DS-AC-108` 两个 `BLOCKED` **逐字保留、未受影响**；上一轮调整验收 `DS-AC-116~140` 仍全部 `NOT_RUN`，**未混入**本轮新验收统计。

## 3. 文档导航

| 文档 | 职责 | 当前状态 |
|---|---|---|
| [REQUIREMENTS.md](./REQUIREMENTS.md) | 需求基线；§22 为本轮调整基线需求 `DS-REQ-116~138` | 既有 `APPROVED`；§22 `APPROVED` |
| [ACCEPTANCE.md](./ACCEPTANCE.md) | 验收基线；§4.16 为本轮调整基线用例 `DS-AC-116~140` | 既有 `APPROVED`；§4.16 `APPROVED`，全部 `NOT_RUN` |
| [DESIGN.md](./DESIGN.md) | 设计基线；§11 为本轮调整基线设计 | 既有 `APPROVED`；§11 `APPROVED` |
| [API.md](./API.md) | API 设计基线；§9 为本轮角色查询参数 | 既有 `APPROVED`；§9 `APPROVED` |
| [UI.md](./UI.md) | UI 设计基线；§10 为本轮列表首页设计 | 既有 `APPROVED`；§10 `APPROVED` |
| [DATABASE.md](./DATABASE.md) | 数据库设计基线；§8 声明本轮无数据库变化 | 既有 `APPROVED`；§8 `APPROVED`（本轮无数据库变化声明） |
| [reports/](./reports/) | 执行 / 验收 / 复审报告 | 按各报告自身状态 |

项目级模板入口：[`docs/baseline/query-list-page-template/`](../../baseline/query-list-page-template/README.md)（迁移授权与逐页边界见该目录 `MIGRATION.md`）。

**本轮新草案（§2.3，`DRAFT_PENDING_USER_REVIEW`）对应章节**：[REQUIREMENTS.md](./REQUIREMENTS.md) §23（`DS-REQ-139~177`）、[ACCEPTANCE.md](./ACCEPTANCE.md) §4.17（`DS-AC-141~182`）、[DESIGN.md](./DESIGN.md) §13、[API.md](./API.md) §11、[UI.md](./UI.md) §11、[DATABASE.md](./DATABASE.md) §9。上表“当前状态”列描述的是既有基线与**上一轮**调整基线，本草案不改写其状态。

## 4. 上一轮调整的关键边界（速览，详版见各专门文档）

> 本节描述**上一轮**调整基线（`DATA-SOURCE-LIST-PAGE-SELECTIVE-QUERY-LIST-INTEGRATION-BASELINE-001`，§2.2）的边界。本轮新草案（§2.3）对其中**两条**作出**局部替代**，声明如下。

- **范围**：只调整 `/config/data-source` 第一个主列表页。新增/编辑数据源弹窗、业务属性弹窗、目标库命名策略弹窗及其内部表单/列表、测试连接行为、删除确认框、其他路由与其他 Feature **均不变**。
- **选择性接入公共组件**：`QueryListPageShell`（标题与说明）、`QueryListQueryPanel`（查询条件容器）、`QueryListActions`（查询 / 重置）、`QueryListResultPanel`（结果卡片，保留固定结构“头部 → 固定错误槽 → 固定分隔线 → `body`”；固定错误槽承载 `loadError` 的 `el-alert`，`toolbar` 槽承载“新增数据源”，`body` 槽承载 Feature 自有表格与行操作）。
- **不接入**：`QueryListRefreshToolbar`；稳定滚动条槽不自动启用。
- **不分页**：前后端继续不使用分页参数或分页交互（`DS-REQ-005` 保持）。
- **Tooltip 保留**：既有 `show-overflow-tooltip` 行为不得删除、弱化或改变。
- **编辑入口**：移除每行可见“编辑”按钮，编辑只保留双击行；页面不得显示“双击数据行可编辑”提示文案。
- **操作列**：只保留一个带文字的“更多”下拉；源库行菜单为“目标库命名策略 / 分隔线 / 红色危险项 删除”，目标库行菜单为“业务属性 / 分隔线 / 红色危险项 删除”；菜单不含“编辑”。
- **角色查询**：新增“角色”`el-select` 单选下拉框（选项顺序与文本：全部 / 源库 / 目标库，绑定值：空值 / `SOURCE` / `TARGET`），默认“全部”，宽度 `140px`；过滤使用规范化代码，不使用中文展示值，前端不静默纠正非法值。
- **重置语义**：保持既有 `DS-REQ-009`“重置后立即恢复全部有效记录”；不得套用模板默认“重置不查询”。

> **局部替代声明（本轮新草案 §2.3 对上一轮 §4 的替代）**：
> 1. **重置语义**：上条“保持既有 `DS-REQ-009`‘重置后立即恢复全部有效记录’；不得套用模板默认‘重置不查询’”被 `DS-REQ-139`/`DS-REQ-140` **局部替代**。替代后当前有效结论为：**重置只恢复查询控件缺省值（三个文本条件清空、角色恢复“全部”），零请求；不改变当前表格、结果总数、错误展示与已应用条件；只在用户点击“查询”时才发起查询**。被替代的仅是“重置即发起查询”的部分；`DS-REQ-009`/`DS-REQ-127` 关于“重置清空三个文本条件、角色恢复‘全部’”的控件清空结论**继续有效**。
> 2. **结果区头部**：上一轮“结果区头部左侧为‘数据源列表’与当前结果数量”被 `DS-REQ-141` **局部替代**；替代后**只显示 `共 n 条`**。`DS-REQ-123` 关于“保留 `QueryListResultPanel` 固定结构（头部 → 固定错误槽 → 固定分隔线 → `body`）”“`loadError` 映射固定错误槽”“不增加双击提示行或其他辅助说明行”的结论**继续有效**。
> 3. **操作列菜单**：上一轮“源库行菜单为‘目标库命名策略 / 分隔线 / 红色危险项 删除’、目标库行菜单为‘业务属性 / 分隔线 / 红色危险项 删除’”被 `DS-REQ-163`~`DS-REQ-167` **局部替代**：在既有业务入口与红色“删除”之间**插入**一个状态相关的启用/停用项，并把异常行的菜单收敛为只有用于归一化的“停用”。业务入口、删除为最后一项且红色危险、菜单不含“编辑”等结论**继续有效**。
> 本节其余边界（范围、公共组件接入、不接入刷新工具栏、不分页、Tooltip 保留、编辑入口只保留双击、“更多”下拉为唯一操作入口、角色查询 `el-select` 单选 `140px`）**不被替代，继续有效**。本轮新草案其余结论见 §2.3 与各专门文档。

## 5. 变更记录

| 日期 | 变更 | 依据 |
|---|---|---|
| 2026-09-19 | 创建本 Feature 入口文档（此前该 Feature 无 `README.md`）：建立状态分层、文档导航与本轮调整边界速览；本轮调整草案为 `DRAFT_PENDING_USER_REVIEW` / `NOT_STARTED` / 验收全部 `NOT_RUN`；既有基线状态与 `PASS=113/FAIL=0/BLOCKED=2/NOT_RUN=0` 逐字保留 | `DATA-SOURCE-LIST-PAGE-SELECTIVE-QUERY-LIST-INTEGRATION-BASELINE-001`（列表首页调整基线草案；纯文档任务） |
| 2026-09-19 | R1 定向修订（ChatGPT 远程独立复审四项问题）：§4 速览同步——结果卡片补充“固定结构（头部 → 固定错误槽 → 固定分隔线 → `body`）”与 `loadError` 的错误槽承载；“角色查询”由“单选”改为 `el-select` 单选下拉框并补充选项顺序、绑定值与 `140px` 宽度、前端不静默纠正非法值。§2 状态分层、§3 文档导航与既有验收统计未修改 | `DATA-SOURCE-LIST-PAGE-SELECTIVE-QUERY-LIST-INTEGRATION-BASELINE-001-R1`（ChatGPT 远程复审定向修订；纯文档任务） |
| 2026-09-19 | 本轮调整基线批准收口：本入口文档状态由 `DRAFT_PENDING_USER_REVIEW` 收口为 `APPROVED`，新增批准任务/批准日期/批准人/批准依据元数据；§2.2 由“本轮调整草案（`DRAFT_PENDING_USER_REVIEW`，未实现）”改为“本轮调整基线（`APPROVED`，未实现）”（`current_adjustment_document_status=APPROVED`，其余分层状态 `NOT_STARTED`/`ALL_NOT_RUN`/`NOT_GRANTED_IN_THIS_TASK` 不变）；§3 文档导航表六行的本轮状态统一改为 `APPROVED`；记录批准链（初版草案提交 `01680ee5...` → R1 修订提交 `c3fd460b...` → ChatGPT 远程 Git R1 复审 `REVIEW_PASS` → 项目负责人 2026-09-19 明确回复“批准这轮调整基线”）；§2.1 既有基线状态与 `PASS=113/FAIL=0/BLOCKED=2/NOT_RUN=0`、`DS-AC-104`/`DS-AC-108` 两个 `BLOCKED` 逐字保留；未修改业务代码/测试/依赖/配置/SQL，未访问数据库/ZK/Kafka，未启动服务 | `DATA-SOURCE-LIST-PAGE-SELECTIVE-QUERY-LIST-INTEGRATION-APPROVAL-CLOSEOUT-001`（项目负责人批准驱动的调整基线批准收口；纯文档任务） |
| 2026-09-19 | **R1 勘误修订**：ChatGPT 从远程 Git 复审上一批准收口提交后返回 `CHANGES_REQUIRED`（唯一阻塞）：上一批准收口**遗漏** `DATABASE.md §8`（本轮无数据库变化声明）的状态收口，其标题仍为 `DRAFT_PENDING_USER_REVIEW`。该遗漏源于上一份批准收口提示词的**范围排除错误**，非上一 Agent 未执行。本 R1 将 `DATABASE.md §8` 收口为 `APPROVED`，并同步本入口 §3 文档导航 `DATABASE.md` 行当前状态为“§8 `APPROVED`（本轮无数据库变化声明）”、§2.2 批准范围补充“`DATABASE.md §8` 本轮无数据库变化声明”。§2.1 既有基线状态、§2.2 分层状态（`NOT_STARTED`/`ALL_NOT_RUN`/`NOT_GRANTED_IN_THIS_TASK`）、历史统计 `PASS=113/FAIL=0/BLOCKED=2/NOT_RUN=0` 与两个 `BLOCKED` 逐字保留；未修改业务代码/测试/依赖/配置/SQL，未访问数据库/ZK/Kafka，未启动服务 | `DATA-SOURCE-LIST-PAGE-SELECTIVE-QUERY-LIST-INTEGRATION-APPROVAL-CLOSEOUT-001-R1`（ChatGPT 批准收口复审 `CHANGES_REQUIRED` 定向修订；纯文档任务） |
| 2026-09-19 | 本轮调整实现状态回写：§2.2 由“本轮调整基线（`APPROVED`，未实现）”改为“（`APPROVED`，已实现待目测）”，分层状态由 `current_adjustment_implementation_status=NOT_STARTED`/`implementation_authorization_status=NOT_GRANTED_IN_THIS_TASK` 更新为 `IMPLEMENTED_PENDING_USER_REVIEW`/`GRANTED_IN_THIS_TASK`，并按统一状态补充 `adjustment_baseline_status=APPROVED`、`formal_acceptance_execution_status=NOT_RUN`、`new_adjustment_acceptance_status=ALL_NOT_RUN`；文档头部新增实现任务/实现日期/实现状态元数据；§4 边界速览正文未改；§2.1 既有基线状态与 `PASS=113/FAIL=0/BLOCKED=2/NOT_RUN=0`、`DS-AC-104`/`DS-AC-108` 两个 `BLOCKED` 逐字保留；本轮 25 条调整验收仍全部 `NOT_RUN`，未置 `IMPLEMENTED_ACCEPTED`/`ACCEPTED`/生产可用 | `DATA-SOURCE-LIST-PAGE-SELECTIVE-QUERY-LIST-INTEGRATION-IMPLEMENTATION-001`（已批准调整基线的前后端实现、自动化测试、构建与实现状态回写） |
| 2026-09-19 | 新增调整草案入口：文档头部增加当前调整草案指引；新增 §2.3「新调整草案（`DRAFT_PENDING_USER_REVIEW`）」，登记 `DATA-SOURCE-LIST-ALL-STATUS-ENABLE-DISABLE-UI-ADJUSTMENT-BASELINE-001` 的六个分层状态键（`adjustment_document_status`/`adjustment_baseline_status`/`implementation_status`/`implementation_authorization_status`/`formal_acceptance_execution_status`/`new_adjustment_acceptance_status`）、新增需求 `DS-REQ-139~177`（39 条）与新增验收 `DS-AC-141~182`（42 条，全部 `NOT_RUN`）；§3 增加本轮新草案对应章节指引；§4 标题明确为“上一轮调整”，并新增“局部替代声明”逐项说明本轮对“重置后立即查询”“结果区‘数据源列表’”“操作列菜单仅有业务入口与删除”三条的**局部**替代边界；§2.1 既有基线状态与 `PASS=113/FAIL=0/BLOCKED=2/NOT_RUN=0`、`DS-AC-104`/`DS-AC-108` 两个 `BLOCKED` 逐字保留，上一轮 `DS-AC-116~140` 仍全部 `NOT_RUN` 且未混入本轮统计；本草案未获批准、未授权实现、未执行验收，未写为 `APPROVED`/已实现/已测试/已验收/生产可用；未修改业务代码/测试/依赖/配置/SQL，未访问数据库/ZK/Kafka，未启动服务 | `DATA-SOURCE-LIST-ALL-STATUS-ENABLE-DISABLE-UI-ADJUSTMENT-BASELINE-001`（列表展示全部状态与启用/停用调整基线草案；纯文档任务） |
