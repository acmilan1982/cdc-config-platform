# 数据源管理 Feature 入口（README）

> 本文件是“数据源管理”（`data-source-management`）Feature 的**状态与导航入口**，不承载新的正式结论。
> 正式结论一律以本目录各专门文档为准；本文件与专门文档冲突时，以专门文档为准。
> 文档状态：`APPROVED`（本入口文档本身已随**上一轮**调整基线批准收口；其描述的既有基线（§2.1）为 `APPROVED`。**两组调整基线必须区分，不得笼统合称“本轮调整基线”**：①**上一轮调整基线（§2.2）**= 列表首页选择性接入查询列表页公共组件，`APPROVED`（需求、设计、API、UI 与验收标准定义已批准、已实现），实现状态 `IMPLEMENTED_PENDING_USER_REVIEW`，**正式验收尚未执行、`DS-AC-116~140`（25 条）仍全部 `NOT_RUN`**；②**当前调整基线（§2.3）**= 列表展示全部状态、启用/停用及视觉微调，`APPROVED`、已实现，**`DS-AC-141~182`（42 条）已于 2026-09-20 正式验收执行且全部 `PASS`**，并已于 2026-09-20 由项目负责人**最终验收接受**（实现状态 `IMPLEMENTED_ACCEPTED`、`final_acceptance_status=ACCEPTED`）。两组用例状态互相独立、不得合并统计）
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
> **当前调整基线（已批准、已实现、正式验收已执行）**：`DATA-SOURCE-LIST-ALL-STATUS-ENABLE-DISABLE-UI-ADJUSTMENT-BASELINE-001`，状态 `APPROVED`（项目负责人 2026-09-19 明确回复“批准本轮调整基线”），已由 `DATA-SOURCE-LIST-ALL-STATUS-ENABLE-DISABLE-UI-ADJUSTMENT-IMPLEMENTATION-001` 实现，并于 2026-09-20 由 `DATA-SOURCE-LIST-ALL-STATUS-ENABLE-DISABLE-UI-ADJUSTMENT-FORMAL-ACCEPTANCE-001` 在真实环境执行正式验收：`DS-AC-141~182`（42 条）`PASS=42/FAIL=0/BLOCKED=0/NOT_RUN=0`，实现状态 `IMPLEMENTED_ACCEPTED`、`final_acceptance_status=ACCEPTED`（项目负责人 2026-09-20 最终验收接受），见 §2.3。本次 `ACCEPTED` **仅适用于当前调整** `DS-REQ-139~177`/`DS-AC-141~182`；该基线**不影响**上方既有基线（§2.1）与上一轮调整基线（§2.2）的已批准状态，**不改变**数据源管理 Feature 整体正式验收状态（既有 `PASS=113/FAIL=0/BLOCKED=2/NOT_RUN=0`、`DS-AC-104`/`DS-AC-108` 仍 `BLOCKED`、上一轮 `DS-AC-116~140` 仍全部 `NOT_RUN`）。

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

### 2.2 上一轮调整基线（列表首页选择性接入查询列表页公共组件）（`APPROVED`，已实现待目测）

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
- **状态速览（与当前调整严格区分，R1 澄清）**：本节为**上一轮**调整基线，`DS-AC-116~140`（25 条）仍全部 `NOT_RUN`、正式验收执行状态 `NOT_RUN`，实现状态 `IMPLEMENTED_PENDING_USER_REVIEW`；与之相对的**当前**调整基线见 §2.3（`DS-AC-141~182`，42 条已于 2026-09-20 正式验收执行且全部 `PASS`，实现状态 `IMPLEMENTED_ACCEPTED`、`final_acceptance_status=ACCEPTED`）。两组状态互相独立、不得合并，也不得用“本轮”笼统指代本节。
- 本轮实现**未修改**公共查询列表组件、三个业务弹窗、其他路由/Feature、依赖或配置，**未修改**数据库对象、SQL 或数据库配置；**未**启动服务；**未**访问数据库 / ZooKeeper / Kafka。
- 下一步为 ChatGPT 从远程 Git 独立复审实现提交，再由项目负责人进行页面目测；此后另行决定是否正式执行 `DS-AC-116~140`。

### 2.3 当前调整基线（`APPROVED`，`IMPLEMENTED_ACCEPTED`，正式验收已执行且最终验收已通过 `PASS=42/FAIL=0/BLOCKED=0/NOT_RUN=0`，`final_acceptance_status=ACCEPTED`）

```text
new_adjustment_task=DATA-SOURCE-LIST-ALL-STATUS-ENABLE-DISABLE-UI-ADJUSTMENT-BASELINE-001
new_adjustment_implementation_task=DATA-SOURCE-LIST-ALL-STATUS-ENABLE-DISABLE-UI-ADJUSTMENT-IMPLEMENTATION-001
new_adjustment_formal_acceptance_task=DATA-SOURCE-LIST-ALL-STATUS-ENABLE-DISABLE-UI-ADJUSTMENT-FORMAL-ACCEPTANCE-001
adjustment_document_status=APPROVED
adjustment_baseline_status=APPROVED
implementation_status=IMPLEMENTED_ACCEPTED
final_acceptance_status=ACCEPTED
implementation_authorization_status=GRANTED_IN_THIS_TASK
formal_acceptance_execution_status=EXECUTED_PASSED_LOCAL
new_adjustment_acceptance_status=PASS_42_OF_42
```

- 本轮为 `/config/data-source` **第一个主列表页**的调整基线，性质为 `FEATURE_ADJUSTMENT_BASELINE`；范围是「列表展示全部状态、逐行启用/停用、结果区头部与序号列、行高与字体、新增按钮视觉」。
- 新增需求 `DS-REQ-139~177`（39 条）、新增验收 `DS-AC-141~182`（42 条，**已于 2026-09-20 正式验收执行：`PASS=42/FAIL=0/BLOCKED=0/NOT_RUN=0`**，并经项目负责人 2026-09-20 **最终验收接受** `final_acceptance_status=ACCEPTED`）；详见 [REQUIREMENTS.md](./REQUIREMENTS.md) §23 与 [ACCEPTANCE.md](./ACCEPTANCE.md) §4.17。
- 本轮调整基线已于 2026-09-19 获得项目负责人批准（批准原话“批准本轮调整基线”），并已由 `DATA-SOURCE-LIST-ALL-STATUS-ENABLE-DISABLE-UI-ADJUSTMENT-IMPLEMENTATION-001` 完成实现（实现授权 `GRANTED_IN_THIS_TASK`）；随后由 `DATA-SOURCE-LIST-ALL-STATUS-ENABLE-DISABLE-UI-ADJUSTMENT-FORMAL-ACCEPTANCE-001`（2026-09-20）在真实后端 + 真实 Oracle 开发库 + 真实浏览器 + 受控验收数据（`RUN_TAG=FACC001`）下执行正式验收，42 条全部 `PASS`，实现状态 `IMPLEMENTED_ACCEPTED`。随后 ChatGPT 对远程证据提交 `30e902f7c2c3de62b7a7ff454fa25a4cef74fdfa` 作出正式验收 R1 复审结论 `REVIEW_PASS`（`blocking_finding_count=0`），项目负责人据此于 2026-09-20 作出**最终验收接受**决定（`final_acceptance_status=ACCEPTED`；收口任务 `DATA-SOURCE-LIST-ALL-STATUS-ENABLE-DISABLE-UI-ADJUSTMENT-FINAL-ACCEPTANCE-CLOSEOUT-001`，见 [reports/DATA-SOURCE-LIST-ALL-STATUS-ENABLE-DISABLE-UI-ADJUSTMENT-FINAL-ACCEPTANCE-CLOSEOUT-001.md](./reports/DATA-SOURCE-LIST-ALL-STATUS-ENABLE-DISABLE-UI-ADJUSTMENT-FINAL-ACCEPTANCE-CLOSEOUT-001.md)）；接受范围**仅限** `DS-REQ-139~177`/`DS-AC-141~182` 当前调整，被验收业务实现提交 `399cb224...`。
- 本轮正式验收使用的自建数据已按已批准清单精确白名单清理（主表/延伸表残留 `0`），既有 34 条主表与 10 条延伸表记录逐字节与验收前一致；证据与报告见 [reports/](./reports/) 与 `evidence/DATA-SOURCE-LIST-ALL-STATUS-ENABLE-DISABLE-UI-ADJUSTMENT-FORMAL-ACCEPTANCE-001/`。
- §2.1 既有基线状态与既有正式复验统计 `PASS=113/FAIL=0/BLOCKED=2/NOT_RUN=0`、`DS-AC-104`/`DS-AC-108` 两个 `BLOCKED` **逐字保留、未受影响**；上一轮调整验收 `DS-AC-116~140` 仍全部 `NOT_RUN`，**未混入**本轮新验收统计。
- **R1 修订链（2026-09-19）**：ChatGPT 对远程提交 `4ccd6610...` 复审返回 `CHANGES_REQUIRED`（3 类阻塞：`API.md` 引用不存在的需求编号 `DS-REQ-18x`、`disable` 无状态条件 `UPDATE` 与幂等约束冲突、启停失败后刷新列表与并发错误码留待实现期冻结）。本 R1 已定向修订：删除虚构需求引用（改用既有敏感信息保护需求 `DS-REQ-047`/`DS-REQ-107`，并并列 `DS-REQ-169`）；冻结统一启停方案（两个接口均**先读取**原始 `FG_ACTIVE`；**每次非幂等状态变更最多一条带原状态条件的 `UPDATE`**，`NULL` 正确匹配；影响行数 ≠ 1 → `50002` 回滚；并发冲突返回 `50002`；不引入重试/悲观锁/乐观版本/新错误码）；统一失败页面行为（**任何启停失败均不刷新列表**，只有成功才按已应用条件刷新）。详见 [reports/DATA-SOURCE-LIST-ALL-STATUS-ENABLE-DISABLE-UI-ADJUSTMENT-BASELINE-001-R1.md](./reports/DATA-SOURCE-LIST-ALL-STATUS-ENABLE-DISABLE-UI-ADJUSTMENT-BASELINE-001-R1.md)。R1 后本轮状态仍为 `DRAFT_PENDING_USER_REVIEW`、`NOT_STARTED`、`NOT_GRANTED_IN_THIS_TASK`、`ALL_NOT_RUN`——**未**获批准、**未**授权实现、**未**执行验收（该状态已被下方批准收口取代）。
- **R2 修订链（2026-09-19）**：ChatGPT 对远程 R1 提交 `c4e1048...` 复审仍返回 `CHANGES_REQUIRED`（唯一阻塞，位于 `DATABASE.md §9.2` 的两处关联表述错误）。本 R2 只做该处的极小修订：**停用**异常状态不再统一写成 `FG_ACTIVE IS NULL`，改为按 §9.3 的 NULL-safe 原状态匹配条件执行（`NULL` 用 `FG_ACTIVE IS NULL`，`'X'` 等**非空异常值**用 `FG_ACTIVE=:observedStatus`）；并把 `40250` 的适用范围收窄为**仅 `enable` 遇异常状态**，`disable` 遇异常状态**不**返回 `40250`，而是按原状态条件归一化为 `'0'`。R1 对总体方案的修订（先读、幂等不写、条件 `UPDATE`、并发 `50002`、失败不刷新）**继续有效**。详见 [reports/DATA-SOURCE-LIST-ALL-STATUS-ENABLE-DISABLE-UI-ADJUSTMENT-BASELINE-001-R2.md](./reports/DATA-SOURCE-LIST-ALL-STATUS-ENABLE-DISABLE-UI-ADJUSTMENT-BASELINE-001-R2.md)。R2 修订后本轮状态为 `DRAFT_PENDING_USER_REVIEW`、`NOT_STARTED`、`NOT_GRANTED_IN_THIS_TASK`、`ALL_NOT_RUN`（该状态已被下方批准收口取代）。
- **批准链（2026-09-19）**：初版草案提交 `4ccd6610...` → R1 修订提交 `c4e1048...` → R2 极小修订提交 `aa906c0...` → ChatGPT 从远程 Git 复审 R2 提交 `aa906c0...` 结论 `REVIEW_PASS`（`blocking_finding_count=0`）→ 项目负责人 2026-09-19 明确回复“批准本轮调整基线” → 批准收口任务 `DATA-SOURCE-LIST-ALL-STATUS-ENABLE-DISABLE-UI-ADJUSTMENT-APPROVAL-CLOSEOUT-001`。批准对象为经初版、R1、R2 修订并由 ChatGPT 远程复审通过的**当前**调整基线，**非仅初版**；批准**不代表**已实现、已测试、已验收或生产可用，后续实现须**另行**授权并使用独立任务（该实现授权已由 `DATA-SOURCE-LIST-ALL-STATUS-ENABLE-DISABLE-UI-ADJUSTMENT-IMPLEMENTATION-001` 取得并完成实现）。当前分层状态：`adjustment_document_status=APPROVED`、`adjustment_baseline_status=APPROVED`、`implementation_status=IMPLEMENTED_ACCEPTED`、`final_acceptance_status=ACCEPTED`、`implementation_authorization_status=GRANTED_IN_THIS_TASK`、`formal_acceptance_execution_status=EXECUTED_PASSED_LOCAL`、`new_adjustment_acceptance_status=PASS_42_OF_42`。

## 3. 文档导航

| 文档 | 职责 | 当前状态 |
|---|---|---|
| [REQUIREMENTS.md](./REQUIREMENTS.md) | 需求基线；§22 为上一轮调整基线需求 `DS-REQ-116~138`；§23 为当前调整基线需求 `DS-REQ-139~177` | 既有 `APPROVED`；§22 `APPROVED`；§23 `APPROVED` |
| [ACCEPTANCE.md](./ACCEPTANCE.md) | 验收基线；§4.16 为上一轮调整基线用例 `DS-AC-116~140`；§4.17 为当前调整基线验收标准 `DS-AC-141~182` | 既有 `APPROVED`；§4.16 `APPROVED`，全部 `NOT_RUN`；§4.17 `APPROVED`，42 条已正式验收执行：`PASS=42/FAIL=0/BLOCKED=0/NOT_RUN=0` |
| [DESIGN.md](./DESIGN.md) | 设计基线；§11 为上一轮调整基线设计；§13 为当前调整基线设计 | 既有 `APPROVED`；§11 `APPROVED`；§13 `APPROVED` |
| [API.md](./API.md) | API 设计基线；§9 为上一轮角色查询参数；§11 为当前启停接口与列表状态字段 | 既有 `APPROVED`；§9 `APPROVED`；§11 `APPROVED` |
| [UI.md](./UI.md) | UI 设计基线；§10 为上一轮列表首页设计；§11 为当前列表全部状态与启停视觉微调 | 既有 `APPROVED`；§10 `APPROVED`；§11 `APPROVED` |
| [DATABASE.md](./DATABASE.md) | 数据库设计基线；§8 为上一轮无数据库变化声明；§9 为当前无数据库变化声明 | 既有 `APPROVED`；§8 `APPROVED`；§9 `APPROVED` |
| [reports/](./reports/) | 执行 / 验收 / 复审报告 | 按各报告自身状态 |

项目级模板入口：[`docs/baseline/query-list-page-template/`](../../baseline/query-list-page-template/README.md)（迁移授权与逐页边界见该目录 `MIGRATION.md`）。

**当前调整基线（§2.3，`APPROVED`）对应章节**：[REQUIREMENTS.md](./REQUIREMENTS.md) §23（`DS-REQ-139~177`）、[ACCEPTANCE.md](./ACCEPTANCE.md) §4.17（`DS-AC-141~182`）、[DESIGN.md](./DESIGN.md) §13、[API.md](./API.md) §11、[UI.md](./UI.md) §11、[DATABASE.md](./DATABASE.md) §9，均已随当前调整基线批准为 `APPROVED` 并已实现（实现状态 `IMPLEMENTED_ACCEPTED`、`final_acceptance_status=ACCEPTED`），42 条用例已于 2026-09-20 正式验收执行且全部 `PASS`，并经项目负责人最终验收接受。上表“当前状态”列中既有基线（§2.1）与上一轮调整基线（§2.2）的状态未因当前调整基线的批准、实现、正式验收执行与最终验收接受而改变。

## 4. 上一轮调整的关键边界（速览，详版见各专门文档）

> 本节描述**上一轮**调整基线（`DATA-SOURCE-LIST-PAGE-SELECTIVE-QUERY-LIST-INTEGRATION-BASELINE-001`，§2.2）的边界。**当前已批准**调整基线（§2.3）对其中**两条**作出**局部替代**，声明如下。

- **范围**：只调整 `/config/data-source` 第一个主列表页。新增/编辑数据源弹窗、业务属性弹窗、目标库命名策略弹窗及其内部表单/列表、测试连接行为、删除确认框、其他路由与其他 Feature **均不变**。
- **选择性接入公共组件**：`QueryListPageShell`（标题与说明）、`QueryListQueryPanel`（查询条件容器）、`QueryListActions`（查询 / 重置）、`QueryListResultPanel`（结果卡片，保留固定结构“头部 → 固定错误槽 → 固定分隔线 → `body`”；固定错误槽承载 `loadError` 的 `el-alert`，`toolbar` 槽承载“新增数据源”，`body` 槽承载 Feature 自有表格与行操作）。
- **不接入**：`QueryListRefreshToolbar`；稳定滚动条槽不自动启用。
- **不分页**：前后端继续不使用分页参数或分页交互（`DS-REQ-005` 保持）。
- **Tooltip 保留**：既有 `show-overflow-tooltip` 行为不得删除、弱化或改变。
- **编辑入口**：移除每行可见“编辑”按钮，编辑只保留双击行；页面不得显示“双击数据行可编辑”提示文案。
- **操作列**：只保留一个带文字的“更多”下拉；源库行菜单为“目标库命名策略 / 分隔线 / 红色危险项 删除”，目标库行菜单为“业务属性 / 分隔线 / 红色危险项 删除”；菜单不含“编辑”。
- **角色查询**：新增“角色”`el-select` 单选下拉框（选项顺序与文本：全部 / 源库 / 目标库，绑定值：空值 / `SOURCE` / `TARGET`），默认“全部”，宽度 `140px`；过滤使用规范化代码，不使用中文展示值，前端不静默纠正非法值。
- **重置语义**：保持既有 `DS-REQ-009`“重置后立即恢复全部有效记录”；不得套用模板默认“重置不查询”。

> **局部替代声明（本轮已批准调整基线 §2.3 对上一轮 §4 的替代）**：
> 1. **重置语义**：上条“保持既有 `DS-REQ-009`‘重置后立即恢复全部有效记录’；不得套用模板默认‘重置不查询’”被 `DS-REQ-139`/`DS-REQ-140` **局部替代**。替代后当前有效结论为：**重置只恢复查询控件缺省值（三个文本条件清空、角色恢复“全部”），零请求；不改变当前表格、结果总数、错误展示与已应用条件；只在用户点击“查询”时才发起查询**。被替代的仅是“重置即发起查询”的部分；`DS-REQ-009`/`DS-REQ-127` 关于“重置清空三个文本条件、角色恢复‘全部’”的控件清空结论**继续有效**。
> 2. **结果区头部**：上一轮“结果区头部左侧为‘数据源列表’与当前结果数量”被 `DS-REQ-141` **局部替代**；替代后**只显示 `共 n 条`**。`DS-REQ-123` 关于“保留 `QueryListResultPanel` 固定结构（头部 → 固定错误槽 → 固定分隔线 → `body`）”“`loadError` 映射固定错误槽”“不增加双击提示行或其他辅助说明行”的结论**继续有效**。
> 3. **操作列菜单**：上一轮“源库行菜单为‘目标库命名策略 / 分隔线 / 红色危险项 删除’、目标库行菜单为‘业务属性 / 分隔线 / 红色危险项 删除’”被 `DS-REQ-163`~`DS-REQ-167` **局部替代**：在既有业务入口与红色“删除”之间**插入**一个状态相关的启用/停用项，并把异常行的菜单收敛为只有用于归一化的“停用”。业务入口、删除为最后一项且红色危险、菜单不含“编辑”等结论**继续有效**。
> 本节其余边界（范围、公共组件接入、不接入刷新工具栏、不分页、Tooltip 保留、编辑入口只保留双击、“更多”下拉为唯一操作入口、角色查询 `el-select` 单选 `140px`）**不被替代，继续有效**。本轮已批准调整基线其余结论见 §2.3 与各专门文档。

## 5. 变更记录

| 日期 | 变更 | 依据 |
|---|---|---|
| 2026-09-19 | 创建本 Feature 入口文档（此前该 Feature 无 `README.md`）：建立状态分层、文档导航与本轮调整边界速览；本轮调整草案为 `DRAFT_PENDING_USER_REVIEW` / `NOT_STARTED` / 验收全部 `NOT_RUN`；既有基线状态与 `PASS=113/FAIL=0/BLOCKED=2/NOT_RUN=0` 逐字保留 | `DATA-SOURCE-LIST-PAGE-SELECTIVE-QUERY-LIST-INTEGRATION-BASELINE-001`（列表首页调整基线草案；纯文档任务） |
| 2026-09-19 | R1 定向修订（ChatGPT 远程独立复审四项问题）：§4 速览同步——结果卡片补充“固定结构（头部 → 固定错误槽 → 固定分隔线 → `body`）”与 `loadError` 的错误槽承载；“角色查询”由“单选”改为 `el-select` 单选下拉框并补充选项顺序、绑定值与 `140px` 宽度、前端不静默纠正非法值。§2 状态分层、§3 文档导航与既有验收统计未修改 | `DATA-SOURCE-LIST-PAGE-SELECTIVE-QUERY-LIST-INTEGRATION-BASELINE-001-R1`（ChatGPT 远程复审定向修订；纯文档任务） |
| 2026-09-19 | 本轮调整基线批准收口：本入口文档状态由 `DRAFT_PENDING_USER_REVIEW` 收口为 `APPROVED`，新增批准任务/批准日期/批准人/批准依据元数据；§2.2 由“本轮调整草案（`DRAFT_PENDING_USER_REVIEW`，未实现）”改为“本轮调整基线（`APPROVED`，未实现）”（`current_adjustment_document_status=APPROVED`，其余分层状态 `NOT_STARTED`/`ALL_NOT_RUN`/`NOT_GRANTED_IN_THIS_TASK` 不变）；§3 文档导航表六行的本轮状态统一改为 `APPROVED`；记录批准链（初版草案提交 `01680ee5...` → R1 修订提交 `c3fd460b...` → ChatGPT 远程 Git R1 复审 `REVIEW_PASS` → 项目负责人 2026-09-19 明确回复“批准这轮调整基线”）；§2.1 既有基线状态与 `PASS=113/FAIL=0/BLOCKED=2/NOT_RUN=0`、`DS-AC-104`/`DS-AC-108` 两个 `BLOCKED` 逐字保留；未修改业务代码/测试/依赖/配置/SQL，未访问数据库/ZK/Kafka，未启动服务 | `DATA-SOURCE-LIST-PAGE-SELECTIVE-QUERY-LIST-INTEGRATION-APPROVAL-CLOSEOUT-001`（项目负责人批准驱动的调整基线批准收口；纯文档任务） |
| 2026-09-19 | **R1 勘误修订**：ChatGPT 从远程 Git 复审上一批准收口提交后返回 `CHANGES_REQUIRED`（唯一阻塞）：上一批准收口**遗漏** `DATABASE.md §8`（本轮无数据库变化声明）的状态收口，其标题仍为 `DRAFT_PENDING_USER_REVIEW`。该遗漏源于上一份批准收口提示词的**范围排除错误**，非上一 Agent 未执行。本 R1 将 `DATABASE.md §8` 收口为 `APPROVED`，并同步本入口 §3 文档导航 `DATABASE.md` 行当前状态为“§8 `APPROVED`（本轮无数据库变化声明）”、§2.2 批准范围补充“`DATABASE.md §8` 本轮无数据库变化声明”。§2.1 既有基线状态、§2.2 分层状态（`NOT_STARTED`/`ALL_NOT_RUN`/`NOT_GRANTED_IN_THIS_TASK`）、历史统计 `PASS=113/FAIL=0/BLOCKED=2/NOT_RUN=0` 与两个 `BLOCKED` 逐字保留；未修改业务代码/测试/依赖/配置/SQL，未访问数据库/ZK/Kafka，未启动服务 | `DATA-SOURCE-LIST-PAGE-SELECTIVE-QUERY-LIST-INTEGRATION-APPROVAL-CLOSEOUT-001-R1`（ChatGPT 批准收口复审 `CHANGES_REQUIRED` 定向修订；纯文档任务） |
| 2026-09-19 | 本轮调整实现状态回写：§2.2 由“本轮调整基线（`APPROVED`，未实现）”改为“（`APPROVED`，已实现待目测）”，分层状态由 `current_adjustment_implementation_status=NOT_STARTED`/`implementation_authorization_status=NOT_GRANTED_IN_THIS_TASK` 更新为 `IMPLEMENTED_PENDING_USER_REVIEW`/`GRANTED_IN_THIS_TASK`，并按统一状态补充 `adjustment_baseline_status=APPROVED`、`formal_acceptance_execution_status=NOT_RUN`、`new_adjustment_acceptance_status=ALL_NOT_RUN`；文档头部新增实现任务/实现日期/实现状态元数据；§4 边界速览正文未改；§2.1 既有基线状态与 `PASS=113/FAIL=0/BLOCKED=2/NOT_RUN=0`、`DS-AC-104`/`DS-AC-108` 两个 `BLOCKED` 逐字保留；本轮 25 条调整验收仍全部 `NOT_RUN`，未置 `IMPLEMENTED_ACCEPTED`/`ACCEPTED`/生产可用 | `DATA-SOURCE-LIST-PAGE-SELECTIVE-QUERY-LIST-INTEGRATION-IMPLEMENTATION-001`（已批准调整基线的前后端实现、自动化测试、构建与实现状态回写） |
| 2026-09-19 | 新增调整草案入口：文档头部增加当前调整草案指引；新增 §2.3「新调整草案（`DRAFT_PENDING_USER_REVIEW`）」，登记 `DATA-SOURCE-LIST-ALL-STATUS-ENABLE-DISABLE-UI-ADJUSTMENT-BASELINE-001` 的六个分层状态键（`adjustment_document_status`/`adjustment_baseline_status`/`implementation_status`/`implementation_authorization_status`/`formal_acceptance_execution_status`/`new_adjustment_acceptance_status`）、新增需求 `DS-REQ-139~177`（39 条）与新增验收 `DS-AC-141~182`（42 条，全部 `NOT_RUN`）；§3 增加本轮新草案对应章节指引；§4 标题明确为“上一轮调整”，并新增“局部替代声明”逐项说明本轮对“重置后立即查询”“结果区‘数据源列表’”“操作列菜单仅有业务入口与删除”三条的**局部**替代边界；§2.1 既有基线状态与 `PASS=113/FAIL=0/BLOCKED=2/NOT_RUN=0`、`DS-AC-104`/`DS-AC-108` 两个 `BLOCKED` 逐字保留，上一轮 `DS-AC-116~140` 仍全部 `NOT_RUN` 且未混入本轮统计；本草案未获批准、未授权实现、未执行验收，未写为 `APPROVED`/已实现/已测试/已验收/生产可用；未修改业务代码/测试/依赖/配置/SQL，未访问数据库/ZK/Kafka，未启动服务 | `DATA-SOURCE-LIST-ALL-STATUS-ENABLE-DISABLE-UI-ADJUSTMENT-BASELINE-001`（列表展示全部状态与启用/停用调整基线草案；纯文档任务） |
| 2026-09-19 | R1 定向修订（ChatGPT 对远程提交 `4ccd6610...` 的复审结论 `CHANGES_REQUIRED`，3 类阻塞问题）：§2.3 追加 R1 修订链并指向新 R1 报告；状态分层、文档导航与既有统计未改。本轮状态仍为 `DRAFT_PENDING_USER_REVIEW`、`NOT_STARTED`、`NOT_GRANTED_IN_THIS_TASK`、`ALL_NOT_RUN`，未获批准、未授权实现、未执行验收；未写为 `APPROVED`/已实现/已测试/已验收/生产可用 | `DATA-SOURCE-LIST-ALL-STATUS-ENABLE-DISABLE-UI-ADJUSTMENT-BASELINE-001-R1`（ChatGPT 远程复审定向修订；纯文档任务） |
| 2026-09-19 | R2 极小修订（ChatGPT 对远程 R1 提交 `c4e1048...` 的复审结论 `CHANGES_REQUIRED`，唯一阻塞在 `DATABASE.md §9.2`）：§2.3 追加 R2 修订链并指向新 R2 报告；明确 R2 只修正异常状态条件匹配（`NULL` 用 `IS NULL`、非空异常值用 `FG_ACTIVE=:observedStatus`）与 `40250` 的适用范围（仅 `enable`；`disable` 异常归一化为 `'0'`）；状态分层、文档导航与既有统计未改。本轮状态仍为 `DRAFT_PENDING_USER_REVIEW`、`NOT_STARTED`、`NOT_GRANTED_IN_THIS_TASK`、`ALL_NOT_RUN`，未获批准、未授权实现、未执行验收；未写为 `APPROVED`/已实现/已测试/已验收/生产可用 | `DATA-SOURCE-LIST-ALL-STATUS-ENABLE-DISABLE-UI-ADJUSTMENT-BASELINE-001-R2`（ChatGPT 远程复审定向修订；纯文档任务） |
| 2026-09-19 | 本轮调整基线批准收口：文档头部“当前调整草案（尚待批准）”改为“当前调整基线（已批准、尚未实现）”；§2.3 标题由“新调整草案（`DRAFT_PENDING_USER_REVIEW`）”改为“本轮调整基线（`APPROVED`，尚未实现）”，分层状态 `adjustment_document_status`/`adjustment_baseline_status` 由 `DRAFT_PENDING_USER_REVIEW` 收口为 `APPROVED`（`implementation_status`/`implementation_authorization_status`/`formal_acceptance_execution_status`/`new_adjustment_acceptance_status` 保持 `NOT_STARTED`/`NOT_GRANTED_IN_THIS_TASK`/`NOT_RUN`/`ALL_NOT_RUN`）；§2.3 新增完整批准链（初版草案 `4ccd6610...` → R1 修订 `c4e1048...` → R2 极小修订 `aa906c0...` → ChatGPT 远程 Git 复审 R2 提交 `aa906c0...` 结论 `REVIEW_PASS`（`blocking_finding_count=0`）→ 项目负责人 2026-09-19 明确回复“批准本轮调整基线” → 批准收口任务 `DATA-SOURCE-LIST-ALL-STATUS-ENABLE-DISABLE-UI-ADJUSTMENT-APPROVAL-CLOSEOUT-001`）；§3 文档导航 6 行补充当前调整基线章节（`REQUIREMENTS §23`/`ACCEPTANCE §4.17`/`DESIGN §13`/`API §11`/`UI §11`/`DATABASE §9`）均显示 `APPROVED`；§4 局部替代声明由“本轮新草案”改为“本轮已批准调整基线”；新增批准收口报告链接；§2.1 既有基线状态与历史统计 `PASS=113/FAIL=0/BLOCKED=2/NOT_RUN=0`、两个 `BLOCKED` 逐字保留；本轮 42 条验收仍全部 `NOT_RUN`、上一轮 25 条仍全部 `NOT_RUN`；未改业务代码/测试/依赖/配置/SQL，未访问数据库/ZK/Kafka，未启动服务；批准不代表已实现、已测试、已验收或生产可用 | `DATA-SOURCE-LIST-ALL-STATUS-ENABLE-DISABLE-UI-ADJUSTMENT-APPROVAL-CLOSEOUT-001`（项目负责人批准驱动的调整基线批准收口；纯文档任务） |
| 2026-09-19 | 本轮调整实现状态回写：§2.3 由“本轮调整基线（`APPROVED`，尚未实现）”改为“（`APPROVED`，已实现待目测）”，分层状态由 `implementation_status=NOT_STARTED`/`implementation_authorization_status=NOT_GRANTED_IN_THIS_TASK` 更新为 `IMPLEMENTED_PENDING_USER_REVIEW`/`GRANTED_IN_THIS_TASK`，并补充实现任务号 `new_adjustment_implementation_task`；`adjustment_document_status`/`adjustment_baseline_status` 保持 `APPROVED`，`formal_acceptance_execution_status=NOT_RUN`、`new_adjustment_acceptance_status=ALL_NOT_RUN` 保持；§2.3 批准链段与「本轮调整基线对应章节」段同步补充实现事实；§2.1 既有基线状态与 `PASS=113/FAIL=0/BLOCKED=2/NOT_RUN=0`、`DS-AC-104`/`DS-AC-108` 两个 `BLOCKED` 逐字保留；本轮 42 条验收仍全部 `NOT_RUN`、上一轮 25 条仍全部 `NOT_RUN`；未置 `IMPLEMENTED_ACCEPTED`/`ACCEPTED`/生产可用 | `DATA-SOURCE-LIST-ALL-STATUS-ENABLE-DISABLE-UI-ADJUSTMENT-IMPLEMENTATION-001`（已批准调整基线的前后端实现、自动化测试、构建与实现状态回写） |
| 2026-09-20 | 实现 R1 复审整改：ChatGPT 对实现提交 `6b7ae04...` 的复审结论 `CHANGES_REQUIRED`（6 项阻塞），本 R1 按已批准契约整改实现与测试并按需回写受影响文档（`REQUIREMENTS.md` §23.1 新增 `DS-REQ-110` 空状态辅助提示语一致性勘误声明与 §21 记录；`ACCEPTANCE.md` §4.15 新增 `DS-AC-107` 措辞一致性勘误声明与 §7 记录；`UI.md` §9.1 辅助提示语勘误 + §12.4 记录；`API.md` §11.1 成功响应 `data.success=true`、§11.2 `fgActive` 显式 `null` 澄清 + §12.5 记录）。`DS-REQ-001~177` 编号与业务正文零变化；`DS-AC-001~182` 编号与业务正文零变化、`DS-AC-141~182`（42 条）仍全部 `NOT_RUN`、上一轮 `DS-AC-116~140`（25 条）仍全部 `NOT_RUN`；既有 `PASS=113/FAIL=0/BLOCKED=2/NOT_RUN=0` 与两个 `BLOCKED` 逐字保留；实现状态保持 `IMPLEMENTED_PENDING_USER_REVIEW`，未置 `IMPLEMENTED_ACCEPTED`/`ACCEPTED`/生产可用；未访问数据库/ZK/Kafka，未启动/停止/重启任何服务，未做浏览器人工目测 | `DATA-SOURCE-LIST-ALL-STATUS-ENABLE-DISABLE-UI-ADJUSTMENT-IMPLEMENTATION-001-R1`（实现复审 R1 整改：`data.success` 成功响应、列表/详情类型拆分、菜单分隔线与警示色、空状态文案与 `DS-REQ-110` 一致性勘误、`fgActive` 全状态与显式 `null` JSON 契约、`undefined` 显示防护；前后端测试与构建） |
| 2026-09-20 | 部署核验判定 `BLOCKED`：本服务器**不存在** cdc-config 既有运行环境（无进程/服务单元/监听端口 8080·5173·80·443/已部署 jar/已发布静态目录/部署脚本/反向代理），且仓库对交付形态存在「开发验收临时运行（README、ENVIRONMENT §4.2）↔ 生产式 fat-jar serve SPA（ENVIRONMENT §4.3、ARCHITECTURE §8）」两种并存描述，§3.2 要求的部署目标、备份对象与回滚方式**无法唯一确认**，依 §3.2 停止并报告；未构建部署、未替换文件、未启停服务、未做接口核验与页面冒烟；`DS-AC-141~182`（42 条）仍全部 `NOT_RUN`，`implementation_status` 仍为 `IMPLEMENTED_PENDING_USER_REVIEW`，未置 `IMPLEMENTED_ACCEPTED`/`ACCEPTED`/生产可用；未访问数据库/ZK/Kafka，未调用写接口 | `DATA-SOURCE-LIST-ALL-STATUS-ENABLE-DISABLE-UI-ADJUSTMENT-DEPLOYMENT-VERIFY-001`（同提交部署及版本一致性核验：部署目标不可唯一确认，`BLOCKED`） |
| 2026-09-20 | 临时验收运行及只读核验（项目负责人决策 `TEMPORARY_ACCEPTANCE_RUNTIME`）：在独立干净工作树检出远程提交 `e6965dd...`（前后端业务代码与已复审 `399cb224...` 零差异），后端定向 147/0、同范围安全回归集 1019/0、`clean package` 成功，前端定向 108/0、全量 1032/0、`npm run build` 成功；临时后端（`127.0.0.1:8080`，profile `dev`）与 Vite（`0.0.0.0:5173`）从同一提交启动并**保持运行**供项目负责人目测；`GET /api/data-sources` 返回 34 条、每行含 `fgActive`（`'1'`=15、`'0'`=19、`null`=0、其他=0），页面渲染 34 行并对 19 条 `'0'` 显示“停用”，不再出现 `异常（原始值=undefined）`；`DS-AC-141~182`（42 条）仍全部 `NOT_RUN`，`implementation_status` 仍为 `IMPLEMENTED_PENDING_USER_REVIEW`，未置 `IMPLEMENTED_ACCEPTED`/`ACCEPTED`/生产可用；未直接访问数据库/执行 SQL/调用写接口/修改数据；未修改业务代码/测试/配置/依赖/锁文件/SQL；未做项目负责人目测结论与正式验收 | `DATA-SOURCE-LIST-ALL-STATUS-ENABLE-DISABLE-UI-ADJUSTMENT-TEMP-ACCEPTANCE-RUN-001`（临时验收运行与只读核验；服务保持运行待目测） |
| 2026-09-20 | 本轮调整基线正式验收执行与状态回写：§2.3 由“（`APPROVED`，已实现待目测）”改为“（`APPROVED`，已实现，正式验收已执行 `PASS=42/FAIL=0/BLOCKED=0/NOT_RUN=0`）”，分层状态由 `implementation_status=IMPLEMENTED_PENDING_USER_REVIEW`/`formal_acceptance_execution_status=NOT_RUN`/`new_adjustment_acceptance_status=ALL_NOT_RUN` 更新为 `implementation_status=IMPLEMENTED_PENDING_FINAL_ACCEPTANCE`/`formal_acceptance_execution_status=EXECUTED_PASSED_LOCAL`/`new_adjustment_acceptance_status=PASS_42_OF_42`，并登记正式验收任务 `DATA-SOURCE-LIST-ALL-STATUS-ENABLE-DISABLE-UI-ADJUSTMENT-FORMAL-ACCEPTANCE-001`；文档头部当前基线指引、§3 文档导航表 `ACCEPTANCE.md` 行与“本轮调整基线对应章节”说明同步更新。执行方式：真实后端 + 真实 Oracle 开发库 + 真实浏览器 + 受控验收数据（`RUN_TAG=FACC001`；主表累计创建 14 条、延伸表预置 2 条），数据库写操作经项目负责人明确批准（`GRANTED_FOR_R2`）；`DS-AC-175` 按任务 §9.4 以定向自动化测试 + 实现路径审计作为补充证据并明示证据层级。自建数据已按精确白名单清理（残留 `0`），既有 34 条主表与 10 条延伸表记录逐字节与验收前一致；`DS-REQ-138~177`/`DS-AC-001~182` 编号与正文零变化，仅 `DS-AC-141~182` 状态列由 `NOT_RUN` 更新为 `PASS`；既有 `PASS=113/FAIL=0/BLOCKED=2/NOT_RUN=0` 与 `DS-AC-104`/`DS-AC-108` 两个 `BLOCKED` 逐字保留、上一轮 `DS-AC-116~140`（25 条）仍全部 `NOT_RUN`；**未置** `IMPLEMENTED_ACCEPTED`/`ACCEPTED`/生产可用；未修改任何业务代码/测试/配置/依赖/锁文件/SQL/DDL；ZooKeeper 只读、无 Kafka、未访问业务源库/目标库 | `DATA-SOURCE-LIST-ALL-STATUS-ENABLE-DISABLE-UI-ADJUSTMENT-FORMAL-ACCEPTANCE-001`（正式验收执行 + 状态回写） |
| 2026-09-20 | 正式验收 R1 复审修订（ChatGPT 对远程提交 `0a4200a30beff753de997bd5fc13a9ee982e8aa9` 的 R1 复审结论 `review_status=CHANGES_REQUIRED`、`blocking_finding_count=2`；其中数据库明文连接经项目负责人明确决定为 `database_connection_plaintext_status=ALLOWED_BY_PROJECT_OWNER`，**不列为缺陷或待整改项**）：**（一）消除 README 状态歧义**——文档头部原“本轮调整基线…正式验收未执行、新增验收全部 `NOT_RUN`”为**笼统**表述，其所指实为**上一轮**列表首页公共组件调整（`DS-AC-116~140`），已改为明确区分「**上一轮**调整基线（§2.2，`DS-AC-116~140` 25 条仍全部 `NOT_RUN`，实现状态 `IMPLEMENTED_PENDING_USER_REVIEW`）」与「**当前**调整基线（§2.3，`DS-AC-141~182` 42 条正式验收已执行且全部 `PASS`，实现状态 `IMPLEMENTED_PENDING_FINAL_ACCEPTANCE`）」；§2.2 标题由“本轮调整基线（…）”改为“上一轮调整基线（列表首页选择性接入查询列表页公共组件）（…）”；§2.3 标题由“本轮调整基线（…）”改为“当前调整基线（…）”；§2.2 增补“状态速览（与当前调整严格区分，R1 澄清）”条目；§3「当前调整基线（§2.3）对应章节」段与 §4 开头同步改用“当前 / 上一轮”措辞。**两组用例的实际状态未改动**（`DS-AC-116~140` 仍 25 条 `NOT_RUN`、实现状态仍 `IMPLEMENTED_PENDING_USER_REVIEW`；`DS-AC-141~182` 仍 42 条 `PASS`、实现状态仍 `IMPLEMENTED_PENDING_FINAL_ACCEPTANCE`）。**（二）正式验收报告数据库服务名拼写修正**——`reports/DATA-SOURCE-LIST-ALL-STATUS-ENABLE-DISABLE-UI-ADJUSTMENT-FORMAL-ACCEPTANCE-001.md` §1 由 `prod.enmengtech.com` 修正为实际值 `prod.enmotech.com`，并新增 R1 修订记录；数据库地址、端口、Schema、用户名与密码继续按项目负责人决定明文保留。既有 `PASS=113/FAIL=0/BLOCKED=2/NOT_RUN=0` 与 `DS-AC-104`/`DS-AC-108` 两个 `BLOCKED` 逐字保留；未修改需求正文、用例正文、业务代码/测试/配置/依赖/锁文件；未访问数据库/ZK/Kafka/源库/目标库；未启动或重启服务；未重跑测试或构建；**未置** `IMPLEMENTED_ACCEPTED`/`ACCEPTED`/生产可用 | `DATA-SOURCE-LIST-ALL-STATUS-ENABLE-DISABLE-UI-ADJUSTMENT-FORMAL-ACCEPTANCE-001-R1`（正式验收 R1 复审定向修订：README 状态歧义消除 + 报告数据库服务名拼写修正；纯文档任务） |
| 2026-09-20 | 项目负责人**最终验收接受**（纯文档收口）：ChatGPT 对远程证据提交 `30e902f7c2c3de62b7a7ff454fa25a4cef74fdfa` 的正式验收 R1 复审结论为 `review_status=REVIEW_PASS`、`blocking_finding_count=0`；项目负责人据此作出最终验收决定，接受「数据源管理——列表展示全部状态、启用/停用及视觉微调」当前调整。**§2.3 由“（`APPROVED`，已实现，正式验收已执行 `PASS=42/FAIL=0/BLOCKED=0/NOT_RUN=0`）”改为“（`APPROVED`，`IMPLEMENTED_ACCEPTED`，正式验收已执行且最终验收已通过 `PASS=42/FAIL=0/BLOCKED=0/NOT_RUN=0`，`final_acceptance_status=ACCEPTED`）”；分层状态 `implementation_status` 由 `IMPLEMENTED_PENDING_FINAL_ACCEPTANCE` 更新为 `IMPLEMENTED_ACCEPTED`，并新增 `final_acceptance_status=ACCEPTED`；`formal_acceptance_execution_status=EXECUTED_PASSED_LOCAL`、`new_adjustment_acceptance_status=PASS_42_OF_42` 逐字保留。**接受范围**：`DS-REQ-139~177`、`DS-AC-141~182`、正式验收结果 `PASS=42/FAIL=0/BLOCKED=0/NOT_RUN=0`、被验收业务实现提交 `399cb2249f60411b52235a859a8ce95d9f6e4579`、证据链截至 `30e902f7c2c3de62b7a7ff454fa25a4cef74fdfa`（最终接受日期 2026-09-20）。**边界**：本次 `ACCEPTED` **仅**适用于该当前调整，**不**把数据源管理 Feature 整体正式验收状态改为 `ACCEPTED`；既有 `PASS=113/FAIL=0/BLOCKED=2/NOT_RUN=0` 与 `DS-AC-104`/`DS-AC-108` 两个 `BLOCKED` 逐字保留；上一轮 `DS-AC-116~140`（25 条）仍全部 `NOT_RUN`、仍为 `IMPLEMENTED_PENDING_USER_REVIEW`，状态未改变；未修改需求正文、验收正文、业务代码/测试/配置/依赖/锁文件；未访问数据库/ZK/Kafka/源库/目标库；未启动服务；未重跑测试或构建；数据库连接信息按项目负责人决定继续明文保留 | `DATA-SOURCE-LIST-ALL-STATUS-ENABLE-DISABLE-UI-ADJUSTMENT-FINAL-ACCEPTANCE-CLOSEOUT-001`（最终验收接受与状态回写；纯文档任务） |
