# 数据源管理 Feature 入口（README）

> 本文件是“数据源管理”（`data-source-management`）Feature 的**状态与导航入口**，不承载新的正式结论。
> 正式结论一律以本目录各专门文档为准；本文件与专门文档冲突时，以专门文档为准。
> 文档状态：`DRAFT_PENDING_USER_REVIEW`（本入口文档本身为草案；其描述的既有基线状态为 `APPROVED`，本轮调整草案为 `DRAFT_PENDING_USER_REVIEW`）
> 建立任务：`DATA-SOURCE-LIST-PAGE-SELECTIVE-QUERY-LIST-INTEGRATION-BASELINE-001`
> 建立日期：2026-09-19

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

### 2.2 本轮调整草案（`DRAFT_PENDING_USER_REVIEW`，未实现）

```text
current_adjustment_task=DATA-SOURCE-LIST-PAGE-SELECTIVE-QUERY-LIST-INTEGRATION-BASELINE-001
current_adjustment_document_status=DRAFT_PENDING_USER_REVIEW
current_adjustment_implementation_status=NOT_STARTED
current_adjustment_acceptance_status=ALL_NOT_RUN
implementation_authorization_status=NOT_GRANTED_IN_THIS_TASK
```

- 本轮为 `/config/data-source` **第一个主列表页**的“列表首页调整基线草案”，性质为 `FEATURE_ADJUSTMENT_BASELINE_DRAFT`。
- 本轮**未修改**任何业务代码、测试代码、依赖、锁文件、配置、SQL 或数据库对象；**未**启动服务；**未**访问数据库 / ZooKeeper / Kafka。
- 本任务必须停在“ChatGPT 远程复审 + 项目负责人批准调整基线”的入口，**不得继续实现**。

## 3. 文档导航

| 文档 | 职责 | 当前状态 |
|---|---|---|
| [REQUIREMENTS.md](./REQUIREMENTS.md) | 需求基线；§22 为本轮调整草案需求 `DS-REQ-116~138` | 既有 `APPROVED`；§22 `DRAFT_PENDING_USER_REVIEW` |
| [ACCEPTANCE.md](./ACCEPTANCE.md) | 验收基线；§4.16 为本轮调整草案用例 `DS-AC-116~140` | 既有 `APPROVED`；§4.16 全部 `NOT_RUN` |
| [DESIGN.md](./DESIGN.md) | 设计基线；§11 为本轮调整草案设计 | 既有 `APPROVED`；§11 `DRAFT_PENDING_USER_REVIEW` |
| [API.md](./API.md) | API 设计基线；§9 为本轮角色查询参数草案 | 既有 `APPROVED`；§9 `DRAFT_PENDING_USER_REVIEW` |
| [UI.md](./UI.md) | UI 设计基线；§10 为本轮列表首页草案 | 既有 `APPROVED`；§10 `DRAFT_PENDING_USER_REVIEW` |
| [DATABASE.md](./DATABASE.md) | 数据库设计基线；§8 声明本轮无数据库变化 | 既有 `APPROVED`；§8 为无变化声明 |
| [reports/](./reports/) | 执行 / 验收 / 复审报告 | 按各报告自身状态 |

项目级模板入口：[`docs/baseline/query-list-page-template/`](../../baseline/query-list-page-template/README.md)（迁移授权与逐页边界见该目录 `MIGRATION.md`）。

## 4. 本轮调整的关键边界（速览，详版见各专门文档）

- **范围**：只调整 `/config/data-source` 第一个主列表页。新增/编辑数据源弹窗、业务属性弹窗、目标库命名策略弹窗及其内部表单/列表、测试连接行为、删除确认框、其他路由与其他 Feature **均不变**。
- **选择性接入公共组件**：`QueryListPageShell`（标题与说明）、`QueryListQueryPanel`（查询条件容器）、`QueryListActions`（查询 / 重置）、`QueryListResultPanel`（结果卡片，`toolbar` 槽承载“新增数据源”，`body` 槽承载 Feature 自有表格与行操作）。
- **不接入**：`QueryListRefreshToolbar`；稳定滚动条槽不自动启用。
- **不分页**：前后端继续不使用分页参数或分页交互（`DS-REQ-005` 保持）。
- **Tooltip 保留**：既有 `show-overflow-tooltip` 行为不得删除、弱化或改变。
- **编辑入口**：移除每行可见“编辑”按钮，编辑只保留双击行；页面不得显示“双击数据行可编辑”提示文案。
- **操作列**：只保留一个带文字的“更多”下拉；源库行菜单为“目标库命名策略 / 分隔线 / 红色危险项 删除”，目标库行菜单为“业务属性 / 分隔线 / 红色危险项 删除”；菜单不含“编辑”。
- **角色查询**：新增“角色”单选（全部 / 源库 `SOURCE` / 目标库 `TARGET`），默认“全部”；过滤使用规范化代码，不使用中文展示值。
- **重置语义**：保持既有 `DS-REQ-009`“重置后立即恢复全部有效记录”；不得套用模板默认“重置不查询”。

## 5. 变更记录

| 日期 | 变更 | 依据 |
|---|---|---|
| 2026-09-19 | 创建本 Feature 入口文档（此前该 Feature 无 `README.md`）：建立状态分层、文档导航与本轮调整边界速览；本轮调整草案为 `DRAFT_PENDING_USER_REVIEW` / `NOT_STARTED` / 验收全部 `NOT_RUN`；既有基线状态与 `PASS=113/FAIL=0/BLOCKED=2/NOT_RUN=0` 逐字保留 | `DATA-SOURCE-LIST-PAGE-SELECTIVE-QUERY-LIST-INTEGRATION-BASELINE-001`（列表首页调整基线草案；纯文档任务） |
