# 查询列表页模板基线（草案）

> 文档状态：`DRAFT_PENDING_CHATGPT_AND_PROJECT_OWNER_REVIEW`
> 建立任务：`QUERY-LIST-PAGE-TEMPLATE-BASELINE-001`
> 建立日期：2026-09-16
> 基准提交：`83ff5c1ff80190459a4849eb74617cd4760db26e`
> 分支：`develop`

## 1. 状态

```text
query_list_page_template_document_status=DRAFT_PENDING_CHATGPT_AND_PROJECT_OWNER_REVIEW
query_list_page_template_implementation_status=NOT_STARTED
shared_component_implementation_status=NOT_STARTED
page_migration_status=NOT_STARTED
reference_feature_status=FINAL_ACCEPTED_AND_CLOSED
```

说明：

- 本模板是**项目级草案**，尚未批准，未实现，未应用到任何页面。
- 本模板**不改变任何 Feature 的既有状态**；“源库快照状态”的最终接受状态
  （`FINAL_ACCEPTED_AND_CLOSED`）由原 Feature 收口任务确立，本任务只读取、不重开、不改写。
- 本任务**未创建公共组件**、**未创建 Composable**、**未迁移任何页面**、**未修改任何代码**。
- 上述五项状态**不得**写成 `APPROVED`、`IMPLEMENTED`、`ACCEPTED` 或 `COMPLETED`。

## 2. 模板目标与适用范围

### 2.1 目标

以已经完成最终接受的“源库快照状态”（`data-source-snapshot-status`，路由 `/monitor/data-source-state`）
为主要参考实现，提炼 CDC 配置管理平台“查询列表页”的**项目级模板基线**，使后续页面能够：

- 复用同一套页面结构、视觉规范与交互规范；
- 明确区分“可复用能力”与“业务页面专属能力”；
- 逐页评估、逐页迁移、逐页验收，而不是批量套用。

### 2.2 适用范围

模板草案面向**只读查询列表页**，典型形态为：

- 页面只读取数据，不写入数据库；
- 顶部一组查询条件（多选、文本框、日期范围等）；
- 一次加载或分页展示的结果表格；
- 结果区头部有结果摘要，可选配刷新工具栏。

适用于该结构的候选页面包括：

- 只读运行监控页（例如后续新增的监控类查询页）；
- 日志查询页；
- 适合该结构的配置查询页。

### 2.3 不适用范围

以下情形不属于本模板的适用对象，必须逐页判断，不得机械套用：

- 带新增、编辑、删除、启停等写操作的配置管理页面（例如“数据源管理”）：这类页面的
  操作列、行级操作、弹窗表单、写权限与并发控制属于 Feature 专属，模板不覆盖；
- 详情页、大屏页、向导式或多步骤表单页；
- 以时间轴、图表、卡片流为主要呈现形态的页面；
- 需要复杂权限模型或多租户差异的页面。

即使结构相近，迁移也必须遵守第 6 节的逐页规则。

## 3. 主要参考实现及基准提交

```text
reference_feature=DATA-SOURCE-SNAPSHOT-STATUS-QUERY-BUTTON-AND-TABLE-LAYOUT-STABILITY
reference_page_route=/monitor/data-source-state
reference_page_status=FINAL_ACCEPTED_AND_CLOSED
reference_base_commit=83ff5c1ff80190459a4849eb74617cd4760db26e
```

参考实现的核心文件（均只读取，未修改）：

| 文件 | 角色 |
| --- | --- |
| `frontend/src/views/data-source-run-state/DataSourceRunStatePage.vue` | 页面壳：三段式结构、错误态、组合 |
| `frontend/src/views/data-source-run-state/components/DataSourceSnapshotQueryBar.vue` | 查询条件卡片与查询/重置操作 |
| `frontend/src/views/data-source-run-state/components/DataSourceSnapshotToolbar.vue` | 结果区刷新工具栏 |
| `frontend/src/views/data-source-run-state/components/DataSourceSnapshotTable.vue` | 结果表格与单实例 Tooltip 接入 |
| `frontend/src/views/data-source-run-state/composables/useDataSourceSnapshot.ts` | 行为组合：单飞行、自动刷新、可见性 |
| `frontend/src/layouts/MainLayout.vue` | 真实主内容滚动容器与路由作用域稳定滚动条槽 |

参考页面对应的 Feature 文档为 `docs/features/data-source-snapshot-status/`
（`REQUIREMENTS.md`、`DESIGN.md`、`UI.md`、`ACCEPTANCE.md` 等），最终接受收口报告为
`docs/features/data-source-snapshot-status/reports/DATA-SOURCE-SNAPSHOT-STATUS-QUERY-BUTTON-AND-TABLE-LAYOUT-STABILITY-FINAL-ACCEPTANCE-CLOSEOUT-001.md`。

## 4. 术语定义

| 术语 | 含义 |
| --- | --- |
| 查询列表页 | 以查询条件 + 结果表格为主体的页面形态 |
| 模板基线 | 项目级、跨 Feature 的推荐结构与规范，本文件集即其草案 |
| 参考实现 | 已经最终接受、“源库快照状态”的当前代码与文档 |
| 参考事实 | 在基准提交 `83ff5c1...` 中可直接验证的代码/文档事实 |
| 草案规则 | 拟作为项目级规范、尚待复审批准的内容 |
| 后续建议 | 尚未实现的候选组件、Composable、路由元数据与迁移顺序 |
| 请求草稿 | 用户在查询区当前选择、尚未提交的选择 |
| 已应用条件 | 最近一次**成功**查询所确立的条件；刷新恒按它执行 |
| 单飞行 | 同一时刻至多一个实际数据请求在途；在途期间新的触发被抑制，不排队、不补发 |
| 稳定滚动条槽 | CSS `scrollbar-gutter: stable`，为纵向滚动容器预留稳定空间 |
| 主内容滚动容器 | 真实承载页面纵向滚动的容器（当前布局中为 `.content-area`） |

## 5. 规范分层

四份模板文档严格区分三类信息，任何一处措辞都必须能对应到其中一类：

### 5.1 已实现参考事实

标记：

```text
REFERENCE_IMPLEMENTATION_FACT
```

只记录能在基准提交 `83ff5c1...` 中直接验证的事实。例如：查询按钮固定宽度 `62px`、
重置按钮固定宽度 `62px`、立即刷新按钮固定宽度 `110px`、稳定滚动条槽当前作用于
`MainLayout` 内容区域、当前仅 `data-source-run-state` 路由启用、其他路由样式泄漏为零。

### 5.2 模板规范草案

标记：

```text
TEMPLATE_RULE_DRAFT_PENDING_REVIEW
```

表示拟作为项目级查询列表页规范、**尚待 ChatGPT 与项目负责人复审批准**的内容。
草案**不得**被写成已经批准，**不得**被写成已经应用到所有页面。

### 5.3 后续实现建议

标记：

```text
PROPOSED_NOT_IMPLEMENTED
```

包括候选公共组件、候选 Composable、候选路由元数据、Props、Slots、事件与迁移顺序。
这些内容**不得**被写成现有代码已经具备的能力。

> 阅读约定：本文档集中，凡未显式标注的内容默认属于 `TEMPLATE_RULE_DRAFT_PENDING_REVIEW`；
> 凡描述当前代码行为的内容必须标注 `REFERENCE_IMPLEMENTATION_FACT`；
> 凡描述未来代码接口的内容必须标注 `PROPOSED_NOT_IMPLEMENTED`。

## 6. 四份文档导航

| 文件 | 内容 |
| --- | --- |
| `README.md` | 本文件：目标、范围、参考实现、状态、术语、分层、导航、任务入口与变更记录 |
| `DESIGN.md` | 三层设计（页面壳层 / 展示组件层 / 行为组合层）、候选组件与 Composable、状态模型、明确不得抽取的内容 |
| `UI.md` | 页面结构、查询区、结果工具栏、表格、稳定滚动条槽、响应式与可访问性规范 |
| `MIGRATION.md` | 逐页评估清单、推荐迁移顺序、每页独立任务要求、已接受参考页保护、后续任务代码 |

## 7. 后续任务入口

以下入口为**文档记录**，本任务**不执行**：

```text
QUERY-LIST-PAGE-SHARED-COMPONENT-DESIGN-001
QUERY-LIST-PAGE-SHARED-COMPONENT-IMPLEMENTATION-001
QUERY-LIST-PAGE-SHARED-COMPONENT-FORMAL-ACCEPTANCE-001
TOPIC-OFFSET-QUERY-LIST-TEMPLATE-MIGRATION-001
```

当前唯一有效下一步：

```text
next_step=CHATGPT_QUERY_LIST_PAGE_TEMPLATE_BASELINE_REVIEW_FROM_REMOTE_GIT_THEN_PROJECT_OWNER_APPROVAL_DECISION
```

即：由 ChatGPT 从远程 Git 复审本四份模板文档，随后由项目负责人决定是否批准该模板基线。
在批准之前，不得进入公共组件设计、实现或任何页面迁移。

## 8. 使用本模板的注意事项

- 本模板是**项目级草案**，不会改变任何 Feature 的既有状态。
- “源库快照状态”是**参考实现**，不是可直接复制的业务页面；其查询字段、列定义、
  状态标签语义、接口与分页策略均属于该 Feature 专属。
- 后续页面必须**逐页评估**，不能批量无差别套用（见 `MIGRATION.md`）。
- 本任务**未创建公共组件**，也**未迁移任何页面**。
- 参考模型中的 62px / 62px / 110px 是**按钮固定宽度**，不是按钮高度；
  本模板不定义、不测量、不修改任何按钮高度基线。

## 9. 变更记录

- 2026-09-16，建立查询列表页模板基线草案
  （`QUERY-LIST-PAGE-TEMPLATE-BASELINE-001`，纯文档任务）。
  以基准提交 `83ff5c1ff80190459a4849eb74617cd4760db26e` 的“源库快照状态”为参考实现，
  新增 `docs/baseline/query-list-page-template/` 下四份文档。
  本轮不修改任何既有文件，不修改任何前端/后端代码、测试、SQL、配置或依赖，
  不访问数据库、ZooKeeper 或 Kafka，不启停任何服务，不执行测试、构建或浏览器验证。
  文档状态 `DRAFT_PENDING_CHATGPT_AND_PROJECT_OWNER_REVIEW`；
  实现状态 `NOT_STARTED`；公共组件实现状态 `NOT_STARTED`；页面迁移状态 `NOT_STARTED`。
