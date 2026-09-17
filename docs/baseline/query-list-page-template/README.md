# 查询列表页模板基线（批准版）

> 文档状态：`APPROVED`
> 批准任务：`QUERY-LIST-PAGE-TEMPLATE-BASELINE-APPROVAL-001`
> 批准日期：2026-09-16
> ChatGPT R1 复审：`APPROVED`
> 项目负责人授权：`APPROVED`
> 建立任务：`QUERY-LIST-PAGE-TEMPLATE-BASELINE-001`
> 建立日期：2026-09-16
> 基准提交：`83ff5c1ff80190459a4849eb74617cd4760db26e`
> 分支：`develop`

## 1. 状态

```text
query_list_page_template_document_status=APPROVED
query_list_page_template_implementation_status=NOT_STARTED
shared_component_implementation_status=IMPLEMENTED_FORMAL_ACCEPTANCE_EXECUTED_PENDING_CHATGPT_REVIEW
shared_component_formal_acceptance_execution_status=PASS
shared_component_formal_acceptance_review_status=PENDING_CHATGPT_R1_REMOTE_GIT_REVIEW
chatgpt_formal_acceptance_r0_review_status=CHANGES_REQUIRED_TWO_DOCUMENT_EVIDENCE_CORRECTIONS_ONLY
formal_acceptance_r1_correction_task=QUERY-LIST-PAGE-SHARED-COMPONENT-FORMAL-ACCEPTANCE-001-R1
formal_acceptance_r1_correction_status=APPLIED_PENDING_CHATGPT_R1_REVIEW
shared_component_project_owner_acceptance_status=PENDING
tooltip_hover_reliability_correction_status=IMPLEMENTED_PENDING_CHATGPT_REVIEW
project_owner_manual_review_status=CHANGES_REQUIRED_TOOLTIP_HOVER_RELIABILITY_CORRECTION_IMPLEMENTED_PENDING_RECHECK
page_migration_status=NOT_STARTED
reference_feature_status=FINAL_ACCEPTED_AND_CLOSED
chatgpt_r1_review_status=APPROVED
project_owner_approval_status=APPROVED
approval_task=QUERY-LIST-PAGE-TEMPLATE-BASELINE-APPROVAL-001
approval_date=2026-09-16
shared_component_design_status=APPROVED
shared_component_design_approval_status=COMPLETED
shared_component_design_approval_task=QUERY-LIST-PAGE-SHARED-COMPONENT-DESIGN-APPROVAL-001
shared_component_design_approval_date=2026-09-16
chatgpt_r0_shared_component_design_review_status=CHANGES_REQUIRED_CONTRACT_EQUIVALENCE_CORRECTIONS_ONLY
chatgpt_r1_shared_component_design_review_status=CHANGES_REQUIRED_FOUR_CONTRACT_CLOSURE_CORRECTIONS
chatgpt_r2_shared_component_design_review_status=APPROVED
r1_contract_equivalence_correction_status=APPLIED_AND_REVIEWED_CHANGES_REQUIRED
r2_contract_closure_correction_status=APPLIED_AND_REVIEWED_APPROVED
project_owner_approval_status=APPROVED
```

说明：

- 本模板是**项目级已批准基线**；阶段一公共组件已实现并已执行正式验收
  （`shared_component_implementation_status` 见上），但**尚未应用到任何其它页面**。
- `shared_component_design_status` 指**公共组件详细设计**（见
  `SHARED_COMPONENT_DESIGN.md`）的状态。该设计**已批准**（`APPROVED`），
  并已由后续独立任务实现、由独立正式验收任务执行通过验收；它的存在**不改变**
  本模板的批准状态，也**不改变** `query_list_page_template_implementation_status`
  与 `page_migration_status` 二者仍为 `NOT_STARTED` 的事实。
- `chatgpt_r0_shared_component_design_review_status`,
  `chatgpt_r1_shared_component_design_review_status`,
  `chatgpt_r2_shared_component_design_review_status`,
  `r1_contract_equivalence_correction_status`,
  `r2_contract_closure_correction_status` 与
  `shared_component_design_approval_status` **只**描述**公共组件详细设计**
  的复审、纠正与批准状态；其演进均为**已完成的历史事实**：ChatGPT 从远程 Git
  对 R0 草案的复审结论为“架构方向通过、只需纠正契约等价性”，R1
  （`QUERY-LIST-PAGE-SHARED-COMPONENT-DESIGN-001-R1`，日期 `2026-09-16`）
  已应用该纠正；ChatGPT 对 R1 的复审结论为
  `CHANGES_REQUIRED_FOUR_CONTRACT_CLOSURE_CORRECTIONS`
  （架构方向继续通过，仍需关闭 `QueryListPageShell` DOM/间距、
  Tooltip 类型与 Host ID、按钮焦点态等价、`countdown` 表述四处契约缺口），
  R2（`QUERY-LIST-PAGE-SHARED-COMPONENT-DESIGN-001-R2`，日期 `2026-09-16`）
  已应用该纠正并提交（`6f3c3517821d4b7e43300180033c5b5ef7c628f9`）；
  ChatGPT 对 R2 提交的独立复审结论为 `APPROVED`，项目负责人随后批准；
  批准收口任务为
  `QUERY-LIST-PAGE-SHARED-COMPONENT-DESIGN-APPROVAL-001`（`2026-09-16`）。
  这些状态**不表示**公共组件已实现、**不表示**任何页面已迁移。注意：本文件顶部
  “ChatGPT R1 复审 / 项目负责人授权”指**四份模板文档的批准收口**
  （`QUERY-LIST-PAGE-TEMPLATE-BASELINE-APPROVAL-001`），与本设计的 R0/R1/R2
  及批准收口是**不同任务**，不得混为一谈。
- 本模板**不改变任何 Feature 的既有状态**；“源库快照状态”的最终接受状态
  （`FINAL_ACCEPTED_AND_CLOSED`）由原 Feature 收口任务确立，本任务只读取、不重开、不改写。
- 本任务**未创建公共组件**、**未创建 Composable**、**未迁移任何页面**、**未修改任何代码**。
- `query_list_page_template_implementation_status` 与 `page_migration_status`
  **不得**写成 `IMPLEMENTED`、`ACCEPTED` 或 `COMPLETED`；
  `shared_component_implementation_status` 当前值为
  `IMPLEMENTED_FORMAL_ACCEPTANCE_EXECUTED_PENDING_CHATGPT_REVIEW`，
  它表示**阶段一公共组件已实现且正式验收已执行**，**不表示** ChatGPT 远程复审已通过、
  **不表示**项目负责人已最终接受（`project_owner_acceptance_status=PENDING`）、
  **更不表示**任何页面已迁移（`page_migration_status=NOT_STARTED`）；
  该字段**不得**改写成 `FINAL_ACCEPTED`、`FINAL_ACCEPTED_AND_CLOSED` 或
  `PAGE_MIGRATION_STARTED`。

## 2. 模板目标与适用范围

### 2.1 目标

以已经完成最终接受的“源库快照状态”（`data-source-snapshot-status`，路由 `/monitor/data-source-state`）
为主要参考实现，提炼 CDC 配置管理平台“查询列表页”的**项目级模板基线**，使后续页面能够：

- 复用同一套页面结构、视觉规范与交互规范；
- 明确区分“可复用能力”与“业务页面专属能力”；
- 逐页评估、逐页迁移、逐页验收，而不是批量套用。

### 2.2 适用范围

本模板面向**只读查询列表页**，典型形态为：

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
| 模板基线 | 项目级、跨 Feature 的推荐结构与规范，本文件集即其已批准基线 |
| 参考实现 | 已经最终接受、“源库快照状态”的当前代码与文档 |
| 参考事实 | 在基准提交 `83ff5c1...` 中可直接验证的代码/文档事实 |
| 已批准规范 | 项目级、已经 ChatGPT 复审与项目负责人批准的内容 |
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

### 5.2 模板规范（已批准）

标记：

```text
TEMPLATE_RULE_APPROVED
```

表示已经 ChatGPT 复审与项目负责人批准的项目级查询列表页规范。
已批准规范**不得**被写成已经实现，**不得**被写成已经应用到所有页面。

### 5.3 后续实现建议

标记：

```text
PROPOSED_NOT_IMPLEMENTED
```

包括候选公共组件、候选 Composable、候选路由元数据、Props、Slots、事件与迁移顺序。
这些内容**不得**被写成现有代码已经具备的能力。

> 阅读约定：本文档集中，凡未显式标注的内容默认属于 `TEMPLATE_RULE_APPROVED`；
> 凡描述当前代码行为的内容必须标注 `REFERENCE_IMPLEMENTATION_FACT`；
> 凡描述未来代码接口的内容必须标注 `PROPOSED_NOT_IMPLEMENTED`。

## 6. 四份文档导航

| 文件 | 内容 |
| --- | --- |
| `README.md` | 本文件：目标、范围、参考实现、状态、术语、分层、导航、任务入口与变更记录 |
| `DESIGN.md` | 三层设计（页面壳层 / 展示组件层 / 行为组合层）、候选组件与 Composable、状态模型、明确不得抽取的内容 |
| `UI.md` | 页面结构、查询区、结果工具栏、表格、稳定滚动条槽、响应式与可访问性规范 |
| `MIGRATION.md` | 逐页评估清单、推荐迁移顺序、每页独立任务要求、已接受参考页保护、后续任务代码 |
| `SHARED_COMPONENT_DESIGN.md` | **公共组件详细设计**（已批准、未实现）：组件决策矩阵、目录与命名、各组件公共契约、Loading 与按钮几何、单实例 Tooltip、稳定滚动条槽唯一方案、状态归属、样式令牌、响应式与可访问性、阶段一范围、验收矩阵、风险与回滚 |

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
next_step=CHATGPT_QUERY_LIST_PAGE_SHARED_COMPONENT_FORMAL_ACCEPTANCE_REVIEW_FROM_REMOTE_GIT
```

即：公共组件详细设计任务（`QUERY-LIST-PAGE-SHARED-COMPONENT-DESIGN-001`）
已产出 `SHARED_COMPONENT_DESIGN.md`（纯设计任务，**未写代码**）；
ChatGPT 从远程 Git 对 R0 草案的复审结论为“架构方向通过、只需纠正契约等价性”；
R1 纠正任务（`QUERY-LIST-PAGE-SHARED-COMPONENT-DESIGN-001-R1`，纯文档纠正）
已应用该纠正并提交；ChatGPT 对 R1 的复审结论为
`CHANGES_REQUIRED_FOUR_CONTRACT_CLOSURE_CORRECTIONS`；
R2 纠正任务（`QUERY-LIST-PAGE-SHARED-COMPONENT-DESIGN-001-R2`，纯文档纠正）
已应用该四项契约闭环纠正并提交（`6f3c3517821d4b7e43300180033c5b5ef7c628f9`）；
ChatGPT 对 R2 的独立复审结论为 `APPROVED`；
批准收口任务
（`QUERY-LIST-PAGE-SHARED-COMPONENT-DESIGN-APPROVAL-001`，`2026-09-16`）
已把该设计收口为**已批准**。

`shared_component_design_status=APPROVED` 表示**设计结论已批准**。
设计与批准之后，独立实现任务
（`QUERY-LIST-PAGE-SHARED-COMPONENT-IMPLEMENTATION-001`，结果提交
`ff9bf2b8ed026f42cfd42904065a4577e7aa1556`；其 R1 纠正
`…-IMPLEMENTATION-001-R1`，结果提交
`d1cd3b1fffb56b50793e576a369325e94063cabc`）
已实现阶段一 6 个公共组件与 1 个 composable，并让“源库快照状态”参考页面等价接入；
独立正式验收任务
（`QUERY-LIST-PAGE-SHARED-COMPONENT-FORMAL-ACCEPTANCE-001`，`2026-09-17`）
已执行 17 项强制验收用例并全部通过。

下一条唯一入口是**ChatGPT 从远程 Git 对该正式验收执行的 R1 独立复审**：

```text
CHATGPT_QUERY_LIST_PAGE_SHARED_COMPONENT_FORMAL_ACCEPTANCE_R1_REVIEW_FROM_REMOTE_GIT
```

该入口**只表示**等待 ChatGPT 复审，**不表示**复审已通过、**不表示**项目负责人已最终接受、
**不表示**任何页面迁移已获授权：仍**不得**迁移任何页面、
**不得**把 `page_migration_status` 改为任何非 `NOT_STARTED` 值、
**不得**自行声明项目负责人最终接受。

正式验收执行的 ChatGPT 远程复审结论为
`CHANGES_REQUIRED_TWO_DOCUMENT_EVIDENCE_CORRECTIONS_ONLY`
（仅两处验收文档内部数字不一致：报告 §13「未实现建议」计数、`AC-001`/`AC-017` 的
worktree 数量 `70/71`）；R1 纯文档纠正任务
（`QUERY-LIST-PAGE-SHARED-COMPONENT-FORMAL-ACCEPTANCE-001-R1`）已定向应用该两处纠正
并**未**重跑任何验收用例、测试、构建或浏览器验证。

## 8. 使用本模板的注意事项

- 本模板是**项目级已批准基线**，不会改变任何 Feature 的既有状态。
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
- 2026-09-16，查询列表页模板基线**批准收口**
  （`QUERY-LIST-PAGE-TEMPLATE-BASELINE-APPROVAL-001`，纯文档任务）。
  R0 建立草案提交 `87d85c0f37805584470a6e555247f618fdf6296c`；
  R1 纠正查询区类名事实与 Tooltip 章节引用提交 `6c2eea445f93c4fe8261aea986765ef8a31caf63`；
  ChatGPT 从远程 Git 对 R1 提交的独立复审结论为 `APPROVED`；
  项目负责人在 ChatGPT 给出批准建议后回复“继续”，授权本批准收口任务。
  本轮只把四份模板文档由草案状态收口为已批准基线，并把全部规范分层标记
  由草案标记统一升级为已批准标记（`README.md` `2` 处、`DESIGN.md` `7` 处、
  `UI.md` `32` 处、`MIGRATION.md` `7` 处，共 `48` 处）；
  参考实现事实标记与未实现建议标记两类保持不变。
  **本轮不实现公共组件、不新建 Composable、不修改任何业务页面、不迁移任何页面、
  不执行测试、构建或浏览器验证**；公共组件实现状态与页面迁移状态仍为 `NOT_STARTED`。
  批准仅意味着四份模板文档及其规范成为后续设计与迁移的正式基线输入，
  **不代表**公共组件已设计或实现、参考页面已接入公共组件、任何页面已迁移。
- 2026-09-16，新增**公共组件详细设计草案**（`QUERY-LIST-PAGE-SHARED-COMPONENT-DESIGN-001`，
  纯文档设计任务）。设计基准提交 `44d2605f5fa0529f472a6e3b189cd5b88f38a5dd`。
  新增 `SHARED_COMPONENT_DESIGN.md`（本目录第 5 份文档），并对本目录四份已批准文档
  做**最小**更新：本文件状态区新增 `shared_component_design_status` 一行、
  第 6 节导航新增该草案条目、第 7 节下一步入口改为
  `CHATGPT_QUERY_LIST_PAGE_SHARED_COMPONENT_DESIGN_REVIEW_FROM_REMOTE_GIT_THEN_PROJECT_OWNER_APPROVAL_DECISION`；
  `DESIGN.md` 增加指向草案的段落；`UI.md` 在两处稳定滚动条槽候选形式后增加交叉引用；
  `MIGRATION.md` 把“公共组件详细设计”阶段记为 `DRAFT_COMPLETED_PENDING_REVIEW`
  并更新下一步入口。
  本轮**不实现**任何公共组件与 Composable、**不新增**路由元数据、**不修改**任何前端
  或后端代码与测试、**不迁移**任何页面、**不重开**任何 Feature、
  **不执行**测试、构建或浏览器验证。
  本文件版本**不记录**本轮结果提交（其尚不存在）；结果提交应在实现任务或
  后续文档任务中另行记录。
  状态：`query_list_page_template_document_status=APPROVED`、
  `shared_component_design_status=DRAFT_PENDING_CHATGPT_AND_PROJECT_OWNER_REVIEW`、
  `query_list_page_template_implementation_status=NOT_STARTED`、
  `shared_component_implementation_status=NOT_STARTED`、
  `page_migration_status=NOT_STARTED`、`reference_feature_status=FINAL_ACCEPTED_AND_CLOSED`。
- 2026-09-16，公共组件详细设计**R0 复审与 R1 契约等价性纠正**
  （`QUERY-LIST-PAGE-SHARED-COMPONENT-DESIGN-001-R1`，纯文档纠正任务）。
  本轮基准提交 `106bb41c83c9dfd6f19b323cd68bd1b347193f80`（即 R0 结果提交）。
  ChatGPT 从远程 Git 对 R0 草案的复审结论为
  `CHANGES_REQUIRED_CONTRACT_EQUIVALENCE_CORRECTIONS_ONLY`
  （架构方向、候选取舍、路由元数据方案与阶段划分通过，仅需纠正公共契约
  无法复现参考页面现状的问题）。
  只纠正 `SHARED_COMPONENT_DESIGN.md` 的以下五项**契约等价性缺口**：
  页面壳几何与排版事实（内层内边距 `14px 16px`、圆角 `10px`、背景 `transparent`、
  标题 `#09090b`、描述 `#71717a` 等，并修正“页面内边距属 `MainLayout`”的错误归属）；
  结果面板的 divider 与正文 `padding` / `min-width:0`；
  查询/重置按钮的完整视觉契约与 `heightPx` **无公共默认值**；
  统一 Tooltip 的调用方 `maxWidthPx`（表格省略、查询候选传 `480`）与
  `aria-describedby` 读屏关联生命周期；
  以及 `countdown` 必填性、重复标题/重复状态行、操作组换行表述等内部一致性。
  同时对 `README.md`、`MIGRATION.md` 做**最小**状态与入口更新。
  本轮**不改变**架构方向与候选取舍
  （`6/1/3/0` 计数、`ROUTE_META`、`DEFERRED_ALL_THREE`、
  `NOT_DEFINED_NOT_CHANGED` 均保持不变），
  **不实现**任何公共组件与 Composable、**不新增**路由元数据、
  **不修改**任何前端或后端代码与测试、**不迁移**任何页面、**不重开**任何 Feature、
  **不执行**测试、构建或浏览器验证。
  本文件**不记录**本轮结果提交（其尚不存在）；结果提交应在后续文档任务中记录。
  纠正后状态：`shared_component_design_status=DRAFT_PENDING_CHATGPT_AND_PROJECT_OWNER_REVIEW`、
  `r1_contract_equivalence_correction_status=APPLIED_PENDING_CHATGPT_R1_REVIEW`、
  `shared_component_implementation_status=NOT_STARTED`、
  `page_migration_status=NOT_STARTED`；**未**把设计状态改为 `APPROVED`。
- 2026-09-16，公共组件详细设计**R1 复审与 R2 契约闭环纠正**
  （`QUERY-LIST-PAGE-SHARED-COMPONENT-DESIGN-001-R2`，纯文档纠正任务）。
  本轮基准提交 `db9309058c230411c33466bff5027e87b6e0e1fb`（即 R1 结果提交）。
  ChatGPT 从远程 Git 对 R1 的复审结论为
  `CHANGES_REQUIRED_FOUR_CONTRACT_CLOSURE_CORRECTIONS`
  （架构方向继续通过，仅需关闭四处契约闭环缺口）。
  只纠正 `SHARED_COMPONENT_DESIGN.md` 的以下四项：
  ① `QueryListPageShell` 的默认槽包装层 `div.ql-page__body` 改变参考页面直接子节点
  结构与根级 `gap` 几何 → **删除该包装层**，默认槽内容直接成为 `.ql-page` 子节点，
  并补齐 `.ql-page` / `.ql-page__title` / `.ql-page__description` 的可执行 CSS；
  ② Tooltip 的 `maxWidthPx` / Host `id` / 触发元素 `aria-describedby` 未闭环 →
  `QueryListTooltipTarget` 增加 `maxWidthPx`、控制器返回 `hostId`、Host props 增加 `id`，
  写明唯一使用关系、全链路数据流与 `aria-describedby` 的
  追加/去重/切换/清理/删除空属性规则；
  ③ 查询/重置按钮焦点选择器由 `:focus-visible` 改为参考实现事实 `:focus`
  （二者非严格等价；`QueryListRefreshToolbar` 自身的 `focus-visible` 不变）；
  ④ 候选决策矩阵中“不传倒计时即可不渲染该段”纠正为
  “无自动刷新的页面显式传 `countdown=null`，即可不渲染倒计时段”。
  同时对 `README.md`、`MIGRATION.md` 做**最小**状态与入口更新。
  本轮**不改变**架构方向与候选取舍
  （`6/1/3/0` 计数、`ROUTE_META`、`DEFERRED_ALL_THREE`、
  `NOT_DEFINED_NOT_CHANGED` 均保持不变），
  **不实现**任何公共组件与 Composable、**不新增**路由元数据、
  **不修改**任何前端或后端代码与测试、**不迁移**任何页面、**不重开**任何 Feature、
  **不执行**测试、构建或浏览器验证。
  本文件**不记录**本轮结果提交（其尚不存在）；结果提交应在后续文档任务中记录。
  纠正后状态：`shared_component_design_status=DRAFT_PENDING_CHATGPT_AND_PROJECT_OWNER_REVIEW`、
  `chatgpt_r1_shared_component_design_review_status=CHANGES_REQUIRED_FOUR_CONTRACT_CLOSURE_CORRECTIONS`、
  `r2_contract_closure_correction_status=APPLIED_PENDING_CHATGPT_R2_REVIEW`、
  `shared_component_implementation_status=NOT_STARTED`、
  `page_migration_status=NOT_STARTED`；**未**把设计状态改为 `APPROVED`。
- 2026-09-16，公共组件详细设计**R2 复审与项目负责人批准收口**
  （`QUERY-LIST-PAGE-SHARED-COMPONENT-DESIGN-APPROVAL-001`，纯文档任务）。
  本轮基准提交 `6f3c3517821d4b7e43300180033c5b5ef7c628f9`（即 R2 结果提交）。
  ChatGPT 从远程 Git 对该 R2 提交的独立复审结论为 `APPROVED`
  （架构方向、四处契约闭环、十项候选结论、路由元数据方案、Tooltip 契约、
  页面壳契约、查询/重置选择器契约与 `countdown` 契约全部通过）；
  项目负责人在 ChatGPT 给出批准建议后回复“按照你的想法来，请继续”，
  授权本批准收口任务。
  本轮把 `SHARED_COMPONENT_DESIGN.md` 由待复审状态收口为**已批准**：
  设计正文全部设计决策标记由草案态**等量**替换为批准态（`66` 处，
  草案态现为 `0` 处）；`shared_component_design_status` 改为 `APPROVED`；
  并把 `.ql-page` 的“直接元素子节点恰好 3 个”限定到**正常内容状态**，
  为首载失败状态（`firstLoadError`）补齐“页头 / 错误卡片”共 2 个直接元素
  子节点的断言，两种状态均**不得**生成默认槽包装层——该澄清**仅**限定契约边界，
  **未**引入包装层、**未**改变插槽 API、**未**改变根布局 CSS。
  同时对 `DESIGN.md`、`UI.md`、`MIGRATION.md` 做**最小**引用与状态更新。
  本轮**不改变**架构方向与候选取舍
  （`10/6/1/3/0` 计数、`ROUTE_META`、`DEFERRED_ALL_THREE`、
  `NOT_DEFINED_NOT_CHANGED` 均保持不变），
  **不实现**任何公共组件与 Composable、**不新增**路由元数据、
  **不修改**任何前端或后端代码与测试、**不迁移**任何页面、**不重开**任何 Feature、
  **不执行**测试、构建或浏览器验证。
  批准后状态：`query_list_page_template_document_status=APPROVED`、
  `shared_component_design_status=APPROVED`、
  `shared_component_design_approval_status=COMPLETED`、
  `query_list_page_template_implementation_status=NOT_STARTED`、
  `shared_component_implementation_status=NOT_STARTED`、
  `page_migration_status=NOT_STARTED`、`reference_feature_status=FINAL_ACCEPTED_AND_CLOSED`；
  下一条唯一入口为 `QUERY-LIST-PAGE-SHARED-COMPONENT-IMPLEMENTATION-001`，
  该入口仅表示**可以单独发起实现任务**。
  **设计获批不等于公共组件已实现、不等于任何页面已迁移。**
- 2026-09-17，阶段一公共组件**实现与正式验收执行记录**
  （`QUERY-LIST-PAGE-SHARED-COMPONENT-IMPLEMENTATION-001` 及其 R1 纠正
  `…-IMPLEMENTATION-001-R1`；随后为正式验收任务
  `QUERY-LIST-PAGE-SHARED-COMPONENT-FORMAL-ACCEPTANCE-001`）。
  实现结果提交为 `ff9bf2b8ed026f42cfd42904065a4577e7aa1556`，
  R1 纠正结果提交为 `d1cd3b1fffb56b50793e576a369325e94063cabc`
  （即本轮验收基准）；正式验收报告见
  `reports/QUERY-LIST-PAGE-SHARED-COMPONENT-FORMAL-ACCEPTANCE-001.md`。
  实现阶段交付阶段一 6 个公共组件（`QueryListPageShell`、`QueryListQueryPanel`、
  `QueryListActions`、`QueryListResultPanel`、`QueryListRefreshToolbar`、
  `QueryListTooltipHost`）与 1 个 composable（`useQueryListTooltip`），
  并把“源库快照状态”参考页面等价接入公共组件；`StableTableContainer`
  按设计并入 `QueryListResultPanel` 正文区，未单独成组件；三个行为 composable
  仍按设计推迟。
  正式验收任务执行 17 项强制验收用例并全部通过：定向测试 `367`、全量前端测试 `967`、
  `vue-tsc` 与生产构建均通过；真实前后端 + 真实浏览器四视口
  （`1280x800` / `1700x920` / `1920x1080` / `2560x1440`）验证通过；
  严格零容差几何比对 `263 checks / 0 failures`；五个临时负向变异全部被非零退出码判定失败
  并已精确还原（未入库）。
  本轮**未**修改 `DESIGN.md`、`UI.md`，**未**新增或改变任何规范设计内容、候选决策、
  数值契约与保留标记；**未**修改任何前端/后端代码、测试、依赖或锁定文件；
  **未**迁移任何页面、**未**选择试点页面、**未**声明项目负责人最终接受；
  未访问数据库、未主动访问 ZooKeeper、未访问 Kafka；未清理任何 worktree。
  更新后状态：`shared_component_design_status=APPROVED`、
  `shared_component_implementation_status=IMPLEMENTED_FORMAL_ACCEPTANCE_EXECUTED_PENDING_CHATGPT_REVIEW`、
  `shared_component_formal_acceptance_execution_status=PASS`、
  `shared_component_formal_acceptance_review_status=PENDING_CHATGPT_REMOTE_GIT_REVIEW`、
  `shared_component_project_owner_acceptance_status=PENDING`、
  `query_list_page_template_implementation_status=NOT_STARTED`、
  `page_migration_status=NOT_STARTED`、`reference_feature_status=FINAL_ACCEPTED_AND_CLOSED`；
  下一条唯一入口为
  `CHATGPT_QUERY_LIST_PAGE_SHARED_COMPONENT_FORMAL_ACCEPTANCE_REVIEW_FROM_REMOTE_GIT`。
  **正式验收执行通过不等于 ChatGPT 远程复审已通过、不等于项目负责人最终接受、
  不等于任何页面迁移已获授权。**

- `2026-09-17`（`QUERY-LIST-PAGE-SHARED-COMPONENT-FORMAL-ACCEPTANCE-001-R1`，**纯文档纠正**）：
  ChatGPT 从远程 Git 对正式验收执行提交
  （`63d26f8ce981d7708798fa48a452e148b1ea8698`）的复审结论为
  `CHANGES_REQUIRED_TWO_DOCUMENT_EVIDENCE_CORRECTIONS_ONLY`，本 R1 任务只定向纠正两处
  验收文档内部数字不一致，**未**重跑正式验收、**未**执行任何测试/构建/浏览器验证、
  **未**启动服务、**未**修改实现或测试代码：
  1. 正式验收报告 §13 的「未实现建议」计数由自相矛盾的
     `proposed_not_implemented_count=0（保留 9 处未实现建议标记）`
     纠正为 `proposed_not_implemented_count=9`；
  2. `AC-001` 的 worktree 数量 `71` 与 `AC-017` 的 `70` 不一致 —— 依据 Git worktree
     注册表时点证据（`.git/worktrees` 目录 mtime 与
     `…-implementation-001-r1` 注册项 birth 同为 `2026-09-17 12:19:35`，
     为该注册表成员最后一次变化；此后至提交时总数恒为 `70` = 1 主工作区 + 69 已登记
     worktree），判定 `71` 为同一时点笔误，两份证据统一为 `70`，
     「验收前后数量一致、全部保持原状」的结论经证据复核后继续成立
     （推证见 `evidence/…/AC-017-scope-freeze-safety.md` §7.1）。
  两处纠正均**未**新增或删除任何保留标记字面量：模板标记冻结保持 `48/0/43/9`、
  设计决策冻结保持 `66/0`；17 项验收结论保持 `17/17/0`，定向测试 `367/367/0`、
  全量测试 `967/967/0`、严格几何 `263/0`、负向控制结论均保持不变。
  更新后状态：
  `chatgpt_formal_acceptance_r0_review_status=CHANGES_REQUIRED_TWO_DOCUMENT_EVIDENCE_CORRECTIONS_ONLY`、
  `formal_acceptance_r1_correction_status=APPLIED_PENDING_CHATGPT_R1_REVIEW`、
  `shared_component_formal_acceptance_review_status=PENDING_CHATGPT_R1_REMOTE_GIT_REVIEW`、
  `shared_component_project_owner_acceptance_status=PENDING`、
  `page_migration_status=NOT_STARTED`；下一条唯一入口为
  `CHATGPT_QUERY_LIST_PAGE_SHARED_COMPONENT_FORMAL_ACCEPTANCE_R1_REVIEW_FROM_REMOTE_GIT`。
  **R1 纠正完成不等于 ChatGPT R1 远程复审已通过、不等于项目负责人最终接受、
  不等于任何页面迁移已获授权。**
- 2026-09-17，参考页 Tooltip **悬停可靠性纠正**
  （`QUERY-LIST-PAGE-SHARED-TOOLTIP-HOVER-RELIABILITY-CORRECTION-001`）。
  项目负责人在“源库快照状态”页人工复检中发现：加载 30+ 条记录后悬停“快照状态”标签
  **有时显示、有时不显示**——缓慢移入可见，快速移入或快速扫行常常不显示。
  该缺陷**不是**公共组件抽取引入的：抽取前提交
  `94a84239ae9b617e783f5acf20274e838e11a105` 的
  `frontend/src/views/data-source-run-state/tooltip/useSnapshotTooltip.ts`
  即已存在同一“连续停留 `320ms` 才显示、离开即取消”机制，抽取时如实保留。
  本任务按人工授权只做两项机制纠正：① `show()` 新增可选 `delayMs`
  （公共默认 `QUERY_LIST_TOOLTIP_DELAY_MS=320` **保持不变**，未传参行为不变，
  延迟机制**未**移除；**仅**“快照状态”一处显式传 `0`，探针端 / 源库 / 查询候选
  继续使用公共默认，不得被顺手改为即时）；② `hide(key?: string)`
  （无参仍是全局关闭，带 key 只关闭/取消该 key 自身，过期 key 为 no-op），
  每个鼠标触发器进入与离开使用同一稳定 key。
  **未**放大“快照状态”命中区（不整格触发、不加透明覆盖层、不改
  `DataSourceSnapshotStatusTag` 结构与文案、不改列宽 / 行高 / 内边距）；
  **未**改变 Tooltip 单实例、Teleport、锚点定位、`maxWidthPx`、`aria-describedby`
  与关闭时机等既有契约；**未**改变业务状态机、接口参数、查询条件与刷新周期；
  **未**修改后端代码、数据库、ZooKeeper 与 Kafka。
  定向测试与全量前端测试、`vue-tsc`、生产构建全部通过；真实前后端 + 真实浏览器
  在 `1280x800` 与 `1920x1080` 两个视口以真实指针事件验证通过
  （快速直入状态框 20/20、快速横扫、两行来回 40/40、查询后重做、探针 / 源库 /
  查询候选仍保持 320ms 的对照、滚动 / 缩放 / 记录替换关闭均正常）；
  三处临时负向变异均被断言失败并已按字节还原（未入库）。
  **未**新增或删除任何保留标记字面量：模板标记冻结保持 `48/0/43/9`、
  设计决策冻结保持 `66/0`。
  更新后状态：`tooltip_hover_reliability_correction_status=IMPLEMENTED_PENDING_CHATGPT_REVIEW`、
  `project_owner_manual_review_status=CHANGES_REQUIRED_TOOLTIP_HOVER_RELIABILITY_CORRECTION_IMPLEMENTED_PENDING_RECHECK`、
  `project_owner_acceptance_status=PENDING`、
  `shared_component_implementation_status=IMPLEMENTED`、
  `page_migration_status=NOT_STARTED`；下一条唯一入口为
  `CHATGPT_QUERY_LIST_PAGE_SHARED_TOOLTIP_HOVER_RELIABILITY_CORRECTION_REVIEW_FROM_REMOTE_GIT`。
  **纠正完成不等于 ChatGPT 远程复审已通过、不等于项目负责人复检与最终接受已通过、
  不等于任何页面迁移已获授权；本任务不迁移任何页面。**
- 2026-09-17，参考页 Tooltip 悬停可靠性纠正的**补充正式验收**
  （`QUERY-LIST-PAGE-SHARED-TOOLTIP-HOVER-RELIABILITY-SUPPLEMENTAL-FORMAL-ACCEPTANCE-001`）。
  该纠正已由 ChatGPT 从远程 Git 复审为 `APPROVED`；项目负责人在真实运行环境中人工复检
  “快照状态”Tooltip 快速划入 / 扫行现象，结论为 **PASS**。
  本任务在纠正提交 `0a1cd99640a5cfa08280a95c23ca3c7231ea6a73`
  （执行时 `origin/develop` HEAD，`git ls-remote` 与任务基线三方一致）上执行 21 项补充验收：
  原 17 项（`AC-001`～`AC-017`）在当前提交上**重新采集复现**（未沿用历史 PASS 结论）、
  `SA-018` 即时显示可靠性（`1280x800` / `1920x1080` 两视口真实指针事件，快速直入各 `20/20`，
  横扫与相邻两行来回全部通过，首载与查询后各做一轮）、
  `SA-019` key 感知关闭与生命周期（单元 + 真实浏览器：当前 key 取消 / 关闭、过期 key 为 no-op、
  快速 `A→B` 切换时 `A` 的迟到 `mouseleave` 不关闭 `B`、滚动 / 缩放 / 记录替换 / 卸载均正确清理、
  `aria-describedby` 只增删自身 token）、
  `SA-020` 公共默认 `320ms` 冻结（探针端 / 源库 / 查询候选在真实浏览器中保持默认，
  仅“快照状态”为 `0`；非数值、负数、`NaN`、`±Infinity` 一律回落 `320`）、
  `SA-021` 修正范围、文档冻结与项目负责人决策记录。
  定向测试 17 文件 / `390` 用例、全量 `55` 文件 / `990` 用例、`vue-tsc`、生产构建全部通过；
  严格几何零容差 `263/0`（跨实现角色与同角色两种口径）；四个视口 `1280x800` / `1700x920` /
  `1920x1080` / `2560x1440` 回归通过；同屏 Tooltip 宿主恒 ≤ `1`；其他路由
  `scrollbar-gutter` 无泄漏；控制台除验收主动注入的一条 `500` 外无错误；业务请求全部为 `GET`。
  原 `AC-016` 五项负向控制全部重放复现（退出码均非 0），另新增四项修正专项负向控制
  （移除“快照状态”`delayMs:0`、`hide(key)` 退回无条件关闭、给探针端加 `delayMs:0`、
  几何 `+0.001px` 注入）同样全部复现；所有文件型变异还原后与基线**逐字节相同**，
  未进入暂存区 / 提交 / 证据源文件。
  本轮**未**修改任何生产代码、测试代码、依赖、锁文件、SQL 或配置（全部零 diff）；
  模板标记冻结保持 `48/0/43/9`、设计决策冻结保持 `66/0`。
  更新后状态：`tooltip_hover_reliability_correction_status=IMPLEMENTED_AND_CHATGPT_REVIEW_APPROVED`、
  `project_owner_manual_tooltip_recheck_status=PASS`、
  `supplemental_formal_acceptance_task=QUERY-LIST-PAGE-SHARED-TOOLTIP-HOVER-RELIABILITY-SUPPLEMENTAL-FORMAL-ACCEPTANCE-001`、
  `supplemental_formal_acceptance_execution_status=PASS`、
  `supplemental_formal_acceptance_review_status=PENDING_CHATGPT_REMOTE_GIT_REVIEW`、
  `project_owner_final_acceptance_status=PENDING`、
  `page_migration_status=NOT_STARTED`；下一条唯一入口为
  `CHATGPT_QUERY_LIST_PAGE_SHARED_TOOLTIP_HOVER_RELIABILITY_SUPPLEMENTAL_FORMAL_ACCEPTANCE_REVIEW_FROM_REMOTE_GIT`。
  **补充验收执行通过不等于 ChatGPT 远程复审已通过、不等于项目负责人最终接受已通过、
  不等于任何页面迁移已获授权；本任务不迁移任何页面。**
- 2026-09-17，上述补充正式验收的 **R1 纯文档与证据纠正**
  （`QUERY-LIST-PAGE-SHARED-TOOLTIP-HOVER-RELIABILITY-SUPPLEMENTAL-FORMAL-ACCEPTANCE-001-R1`）。
  ChatGPT 对 R0 提交 `7077b839c51250778e7462d39c92deba69e88e09` 的远程 Git 复审结论为
  `CHANGES_REQUIRED_FOUR_DOCUMENT_EVIDENCE_CORRECTIONS_ONLY`（仅四类文档 / 证据问题）。
  R1 只定向纠正这四类问题：① 如实披露 R0 提交使用了 `-c core.hooksPath=.git/hooks`
  ——该参数覆盖了 Git 默认的 `$GIT_DIR/hooks` 查找路径，属**已发生的过程偏差**，
  仓库活动 hook 数为 0 故无实际 hook 被跳过，但**不得**再写成"未覆盖 / 未绕过 hooks"；
  ② 把误写的参考页名称"数据同步进度"纠正为**"源库快照状态"**
  （"数据同步进度"仅为后续迁移的优先试点候选）；③ 把 `git status --short` 拆分为两个明确采集时点，
  并补齐 R0 最终提交的完整范围（3 个基线文档 + 1 个报告 + 11 个证据文件 = 15 个文件）；④ 纠正
  两处文字错误（报告首行标题语的衍字、以及把定向测试数量误述为高于记载）。
  R1 **未**重跑 21 项验收、测试、构建、浏览器验证或负向控制，**未**修改生产代码 / 测试代码 /
  依赖 / 配置 / SQL，**未**改变 21/21 PASS 的执行事实；模板标记冻结保持 `48/0/43/9`、
  设计决策冻结保持 `66/0`。
  ```text
  chatgpt_supplemental_formal_acceptance_r0_review_status=CHANGES_REQUIRED_FOUR_DOCUMENT_EVIDENCE_CORRECTIONS_ONLY
  supplemental_formal_acceptance_r1_correction_task=QUERY-LIST-PAGE-SHARED-TOOLTIP-HOVER-RELIABILITY-SUPPLEMENTAL-FORMAL-ACCEPTANCE-001-R1
  supplemental_formal_acceptance_r1_correction_status=APPLIED_PENDING_CHATGPT_R1_REVIEW
  supplemental_formal_acceptance_execution_status=PASS_UNCHANGED_21_OF_21
  acceptance_rerun_status=NOT_RUN_NOT_REQUIRED_DOCUMENT_CORRECTION_ONLY
  project_owner_final_acceptance_status=PENDING
  page_migration_status=NOT_STARTED
  ```
  **R1 纠正不等于 ChatGPT R1 复审已通过、不等于项目负责人最终接受已通过、
  不等于任何页面迁移已获授权；本任务不迁移任何页面。**
- 2026-09-17，**公共组件与“源库快照状态”参考页等价接入的最终接受收口**
  （`QUERY-LIST-PAGE-SHARED-COMPONENT-FINAL-ACCEPTANCE-CLOSEOUT-001`）。
  ChatGPT 已从远程 Git 对补充验收 R1 纠正提交
  `84086446ae9cfa4dce5a92b47832cb63f9c722a2` 复审为 `APPROVED`。
  项目负责人本次明确给出最终接受决定，原话逐字记录如下：
  ```text
  我确认公共组件及“源库快照状态”参考页最终验收通过，可以执行最终接受收口；暂不授权其他页面迁移。
  ```
  本任务为**纯文档收口**：**未**重跑原 17 项或补充 21 项验收、**未**重跑负向控制、
  **未**执行测试 / 构建 / 浏览器验证、**未**启动或停止任何服务、**未**访问数据库 /
  ZooKeeper / Kafka，**未**修改任何生产代码 / 测试代码 / 依赖 / 锁文件 / SQL / 配置，
  **未**修改任何既有报告或证据（逐字节不变）。
  计数口径：原正式验收 17 项；补充正式验收 21 项，且**包含**原 17 项在纠正后提交上的
  重新重放，两者是**包含关系而非并列关系**，**不得**相加累计成“独立用例总数”；
  最终权威验收覆盖为补充验收 `21/21` PASS，原 `17/17` 作为历史验收阶段事实保留。
  冻结计数保持：模板标记 `48/0/43/9`、设计决策 `66/0`。
  本文件顶部状态块与历史各节为各自时点的历史记录，保留不动；
  下方状态块为本基线文档**当前权威状态**：

  ```text
  shared_component_design_status=APPROVED
  shared_component_implementation_status=IMPLEMENTED_ACCEPTED
  shared_component_formal_acceptance_status=ACCEPTED
  shared_component_formal_acceptance_execution_status=PASS
  shared_component_original_acceptance_case_count=17
  shared_component_original_acceptance_pass_count=17
  shared_component_supplemental_acceptance_case_count=21
  shared_component_supplemental_acceptance_pass_count=21
  shared_component_supplemental_acceptance_review_status=APPROVED
  tooltip_hover_reliability_correction_status=IMPLEMENTED_ACCEPTED
  project_owner_manual_tooltip_recheck_status=PASS
  reference_page_name=源库快照状态
  reference_page_path=/monitor/data-source-state
  reference_page_equivalent_integration_status=IMPLEMENTED_ACCEPTED
  shared_component_project_owner_acceptance_status=APPROVED
  shared_component_final_acceptance_status=ACCEPTED_BY_PROJECT_OWNER
  shared_component_completion_status=COMPLETED
  project_owner_final_acceptance_decision=APPROVED
  project_owner_final_acceptance_date=2026-09-17
  pending_project_owner_acceptance=NO
  page_migration_status=NOT_STARTED
  page_migration_authorization_status=NOT_GRANTED
  pilot_page_selection_status=NOT_DECIDED
  current_next_entry=NONE_SHARED_COMPONENT_FINAL_ACCEPTED_AND_CLOSED_NO_PAGE_MIGRATION_AUTHORIZED
  ```

  边界：本次最终接受**只**覆盖公共组件设计、公共组件实现、“源库快照状态”参考页的
  等价接入、Tooltip 悬停可靠性纠正及对应正式 / 补充正式验收；
  `page_migration_status` 保持 `NOT_STARTED`、`page_migration_authorization_status`
  保持 `NOT_GRANTED`、`pilot_page_selection_status` 保持 `NOT_DECIDED`。
  项目负责人**暂不授权其他页面迁移**；“数据同步进度”仍只是未来的**优先试点候选**，
  **未被选定**；`query_list_page_template_implementation_status` 保持 `NOT_STARTED`。
  上述唯一入口**仅**表示公共组件与参考页接入已经接受并关闭，
  **不表示**其他页面或整个项目完成。R0 提交使用 `-c core.hooksPath=.git/hooks`
  的过程偏差继续如实保留（`r0_process_deviation_status=RECORDED`），
  不因最终接受而删除或弱化。
