# 查询列表页模板基线 · 迁移（批准版）

> 文档状态：`APPROVED`
> 批准任务：`QUERY-LIST-PAGE-TEMPLATE-BASELINE-APPROVAL-001`
> 批准日期：2026-09-16
> 建立任务：`QUERY-LIST-PAGE-TEMPLATE-BASELINE-001`
> 基准提交：`83ff5c1ff80190459a4849eb74617cd4760db26e`

事实分层标记含义见 `README.md` §5。

> 本文件是**已批准迁移计划**，**尚未执行**任何迁移。当前状态：
> `page_migration_status=NOT_STARTED`、
> `shared_component_implementation_status=IMPLEMENTED_FORMAL_ACCEPTANCE_EXECUTED_PENDING_CHATGPT_REVIEW`。

---

## 1. 迁移前评估（逐页检查清单）

`TEMPLATE_RULE_APPROVED` —— 任何页面在考虑套用本模板前，**必须**逐条回答
以下问题并形成书面结论。任一问题无明确答案时，不得开始迁移。

| # | 问题 | 影响 |
| --- | --- | --- |
| 1 | 页面是**只读查询**还是**配置管理**？ | 配置管理页含写操作，不在模板主体内（见 §5） |
| 2 | 是否**首次进入自动查询**？ | 决定是否需要 `initial` 类首载与大态 Loading |
| 3 | 是否**分页**？页码还是游标？页大小？ | 分页策略由 Feature 决定，模板不统一 |
| 4 | 是否**自动刷新**？周期多少？ | 决定是否需要倒计时与刷新工具栏 |
| 5 | 是否需要**失败保留旧结果**？ | 决定错误处理形态（整区错误 vs 内联提示） |
| 6 | 是否需要**已选择 / 已应用条件分离**？ | 决定是否需要“只有成功才升级”纪律 |
| 7 | 是否存在**长文本与 Tooltip**？ | 决定是否需要单实例 Tooltip 机制 |
| 8 | 是否存在**页面纵向滚动条切换**？ | 决定是否需要稳定滚动条槽 |
| 9 | 是否**适合启用稳定滚动条槽**？ | 若容器宽度变化会引起列位移，则适合 |
| 10 | 是否含**新增 / 编辑 / 删除**等模板之外的操作？ | 含则须明确该部分**不纳入**模板改造范围 |
| 11 | 是否有**已正式接受的功能基线需要保护**？ | 有则须先确定等价性回归方案（见 §4） |

### 1.1 对照页面的初步分类（只读检查结论）

`REFERENCE_IMPLEMENTATION_FACT` —— 本任务对以下三个代表性页面做了只读检查，
仅用于区分“可通用 / 只属只读监控 / 必须留在 Feature / 不适合套用”：

| 页面 | 路由 | 只读/配置 | 分页 | 自动刷新 | 初步分类 |
| --- | --- | --- | --- | --- | --- |
| 数据同步进度 | `/monitor/topic-offset` | 只读 | 是（固定 `150`/页，页码控件） | 是 | **优先试点候选**（结构最接近参考实现） |
| 日志查询 | `/monitor/log-query` | 只读 | 是（游标分页） | 否（显式查询） | 部分适用：双 Tab、初始化锁定、游标分页属 Feature 专属 |
| 数据源管理 | `/config/data-source` | 配置管理（含新增/编辑/删除） | 未使用分页控件 | 否 | **不适合直接套用**：含写操作与行级操作列 |

`TEMPLATE_RULE_APPROVED` —— 上述分类仅为**评估起点**，
**不得**把对照页面当前的个别实现自动提升为模板规则。例如：

- “数据同步进度”的固定 `150` 条/页**不是**模板默认页大小；
- “日志查询”的双 Tab 与初始化锁定**不是**模板要求的结构；
- “数据源管理”的 `el-card` + 行内 `el-form` 查询区**不是**模板推荐的查询区形态。

---

## 2. 推荐迁移顺序

`TEMPLATE_RULE_APPROVED` —— 推荐顺序如下（**已经批准，但尚未执行**）：

1. **建立模板基线**（本任务）。
2. **单独完成公共组件详细设计**：在模板基线获批后，先做一次纯设计任务，
   确定组件边界、命名、Props/Slots/事件与样式隔离方案；**不写代码**。
3. **提取公共组件并让“源库快照状态”进行等价接入**：
   先让**参考页面自己**用公共组件，证明公共组件能够复现既有行为。
4. **对参考页面执行严格等价性回归**：按 §4 的要求验证业务语义、几何稳定性与样式隔离。
5. **选择“数据同步进度”作为优先候选试点**：
   最终是否选择该页面作为试点仍需**项目负责人确认**。
6. **试点通过后逐页迁移**：每页一个独立任务。
7. **带 CRUD 的配置管理页面最后评估，不强制迁移**。

第 3 步与第 4 步的顺序不可颠倒：**必须先让参考页面等价接入并通过回归，再谈迁移其他页面。**

---

## 3. 每页独立任务

`TEMPLATE_RULE_APPROVED` —— 硬性要求：

- 每个页面**必须独立建立**调整需求、实现、复审和验收任务；
- **不得**在一个提交中同时抽取公共组件并迁移多个业务页面；
- **不得**批量修改全部查询页；
- 页面迁移失败时应能**定位到单页并安全回退**；
- 未迁移页面必须保持**零影响**（样式、行为、性能均不得改变）。

`REFERENCE_IMPLEMENTATION_FACT` —— 本项目既有实践支持该粒度：
“源库快照状态”的每一轮调整（需求基线 → 批准收口 → 实现 → 复审收口 → 正式验收 → 最终接受收口）
都在**独立任务**与**独立提交**中完成，并逐轮记录状态。迁移应沿用同一节奏。

---

## 4. 已正式接受页面的保护

`REFERENCE_IMPLEMENTATION_FACT` —— “源库快照状态”当前状态：
`reference_feature_status=FINAL_ACCEPTED_AND_CLOSED`，
最终接受收口报告为
`docs/features/data-source-snapshot-status/reports/DATA-SOURCE-SNAPSHOT-STATUS-QUERY-BUTTON-AND-TABLE-LAYOUT-STABILITY-FINAL-ACCEPTANCE-CLOSEOUT-001.md`，
验收统计 `formal_acceptance_pass_count=118`、`fail=0`、`blocked=0`、`not_run=0`。

`TEMPLATE_RULE_APPROVED` —— 未来如果因公共组件化**修改其代码**，必须：

1. 保持 **API 请求和业务语义不变**；
2. 保持 **查询、重置、刷新行为不变**；
3. 保持**按钮宽度及 Loading 几何稳定**
   （查询 `62px` / 重置 `62px` / 立即刷新 `110px`，四值同锁）；
4. 保持**长短结果切换时内容区和全部表头几何稳定**
   （严格 `0` 判定，含主内容容器 `clientWidth`）；
5. 保持 **Tooltip 单实例行为**不变；
6. 保持**其他路由零样式泄漏**（`scrollbar-gutter` 仍只在
   `/monitor/data-source-state` 为 `stable`，其他路由为 `auto`）；
7. **运行源页面相关测试和浏览器几何回归**；
8. 将验证记录为**新的重构等价性回归**，**不能改写旧验收历史**；
9. 若发生**业务行为变化**，必须**重新进入 Feature 调整流程**，
   **不能**称为“纯重构”。

### 4.1 什么算“业务行为变化”

`TEMPLATE_RULE_APPROVED` —— 下列任一情况属于业务行为变化，
必须走 Feature 调整流程而非重构：

- 请求条件、请求次数、请求时机发生变化；
- 失败语义变化（例如原先保留旧结果、改为清表）；
- 自动刷新周期、暂停/恢复策略变化；
- 交互语义变化（例如“重置”从“不查询”变为“查询”）；
- 展示语义变化（例如 Tooltip 内容从原始值改为展示值）；
- 分页/排序/最大返回条数变化。

仅“同样的行为由公共组件承载、渲染结构等价、几何严格不变”才可称为纯重构。

---

## 5. 不纳入迁移范围的页面类型

`TEMPLATE_RULE_APPROVED` —— 以下类型**不强制迁移**：

- 含新增、编辑、删除、启停、批量保存的配置管理页面；
- 详情页、大屏页、多步骤表单页；
- 以图表、时间轴、卡片流为主体的页面；
- 单次操作型页面（无查询条件列表语义）。

若后续确需统一视觉，应另立任务评估，**不得**以“套用查询列表页模板”为名
改动其业务行为。

---

## 6. 后续任务代码

`PROPOSED_NOT_IMPLEMENTED` —— 以下任务代码在本文件中**仅作记录**，
本任务**不创建、不执行**：

```text
QUERY-LIST-PAGE-SHARED-COMPONENT-DESIGN-001
QUERY-LIST-PAGE-SHARED-COMPONENT-IMPLEMENTATION-001
QUERY-LIST-PAGE-SHARED-COMPONENT-FORMAL-ACCEPTANCE-001
TOPIC-OFFSET-QUERY-LIST-TEMPLATE-MIGRATION-001
```

已批准的推进节奏：

| 顺序 | 任务代码 | 产出 | 是否写代码 |
| --- | --- | --- | --- |
| 1 | （本任务）`QUERY-LIST-PAGE-TEMPLATE-BASELINE-001` | 四份模板文档 | 否 |
| 2 | `QUERY-LIST-PAGE-SHARED-COMPONENT-DESIGN-001` | 公共组件详细设计 | 否 |
| 3 | `QUERY-LIST-PAGE-SHARED-COMPONENT-IMPLEMENTATION-001` | 组件实现 + 参考页面等价接入 | 是 |
| 4 | `QUERY-LIST-PAGE-SHARED-COMPONENT-FORMAL-ACCEPTANCE-001` | 等价性正式验收 | 否 |
| 5 | `TOPIC-OFFSET-QUERY-LIST-TEMPLATE-MIGRATION-001` | 数据同步进度试点迁移 | 是（最终是否选择该页面仍需项目负责人确认） |

### 6.1 第 2 步（公共组件详细设计）的进度状态

上表第 2 步 `QUERY-LIST-PAGE-SHARED-COMPONENT-DESIGN-001` 的本质是**纯设计、
不写代码**。其进度状态记为：

```text
shared_component_design_phase_status=APPROVED_IMPLEMENTATION_NOT_STARTED
shared_component_design_status=APPROVED
shared_component_design_approval_status=COMPLETED
shared_component_design_approval_task=QUERY-LIST-PAGE-SHARED-COMPONENT-DESIGN-APPROVAL-001
shared_component_design_approval_date=2026-09-16
shared_component_design_path=docs/baseline/query-list-page-template/SHARED_COMPONENT_DESIGN.md
```

含义与边界（必须严格按此理解，不得扩张）：

- 该阶段已产出一份详细设计并**已获批准**：ChatGPT 对 R0 草案的复审结论为
  `CHANGES_REQUIRED_CONTRACT_EQUIVALENCE_CORRECTIONS_ONLY`
  （架构方向通过，仅需纠正契约等价性），R1 纠正任务
  （`QUERY-LIST-PAGE-SHARED-COMPONENT-DESIGN-001-R1`）已应用该纠正；
  ChatGPT 对 R1 的复审结论为
  `CHANGES_REQUIRED_FOUR_CONTRACT_CLOSURE_CORRECTIONS`
  （架构方向继续通过，仅需关闭四处契约闭环缺口），R2 纠正任务
  （`QUERY-LIST-PAGE-SHARED-COMPONENT-DESIGN-001-R2`）已应用该纠正并提交
  （`6f3c3517821d4b7e43300180033c5b5ef7c628f9`）；
  ChatGPT 对 R2 提交的独立复审结论为 `APPROVED`，批准收口任务
  （`QUERY-LIST-PAGE-SHARED-COMPONENT-DESIGN-APPROVAL-001`，`2026-09-16`）
  已把该设计收口为 `APPROVED`；
- **设计已批准**只表示契约与架构结论可以据以开工，它**本身不实现任何内容**：
  该阶段**未**实现公共组件、**未**新增 Composable、**未**新增路由元数据、
  **未**修改任何业务页面、**未**迁移任何页面；
- 设计批准当时 `shared_component_implementation_status` 为 `NOT_STARTED`、
  `page_migration_status` 为 `NOT_STARTED`、
  `query_list_page_template_implementation_status` 为 `NOT_STARTED`；
  此后公共组件实现任务（`QUERY-LIST-PAGE-SHARED-COMPONENT-IMPLEMENTATION-001`
  及其纠正 `…-001-R1`）与正式验收任务
  （`QUERY-LIST-PAGE-SHARED-COMPONENT-FORMAL-ACCEPTANCE-001`）均由**独立任务与独立授权**
  执行；`shared_component_implementation_status` 现为
  `IMPLEMENTED_FORMAL_ACCEPTANCE_EXECUTED_PENDING_CHATGPT_REVIEW`，
  `page_migration_status` 与 `query_list_page_template_implementation_status`
  仍为 `NOT_STARTED`；
- 任何页面迁移**仍不得启动**，除非有**独立任务与独立授权**；
  **设计获批不等于已授权实现，实现并验收通过也不等于已授权页面迁移**；
- 本批准**不改变**“具体试点页面仍需项目负责人另行确认”的既有边界。

---

## 7. 当前有效下一步

```text
next_step=CHATGPT_QUERY_LIST_PAGE_SHARED_TOOLTIP_HOVER_RELIABILITY_CORRECTION_REVIEW_FROM_REMOTE_GIT
```

公共组件详细设计任务（`QUERY-LIST-PAGE-SHARED-COMPONENT-DESIGN-001`）已产出草案
`SHARED_COMPONENT_DESIGN.md`；ChatGPT 对 R0 的复审结论为
“架构方向通过、只需纠正契约等价性”，R1 纠正任务
（`QUERY-LIST-PAGE-SHARED-COMPONENT-DESIGN-001-R1`）已应用该纠正；
ChatGPT 对 R1 的复审结论为
`CHANGES_REQUIRED_FOUR_CONTRACT_CLOSURE_CORRECTIONS`，R2 纠正任务
（`QUERY-LIST-PAGE-SHARED-COMPONENT-DESIGN-001-R2`）已应用该四项契约闭环纠正，
其结果提交为 `6f3c3517821d4b7e43300180033c5b5ef7c628f9`；
ChatGPT 对 R2 的独立复审结论为 `APPROVED`，批准收口任务
（`QUERY-LIST-PAGE-SHARED-COMPONENT-DESIGN-APPROVAL-001`，`2026-09-16`）
已把该设计收口为 `APPROVED`。

公共组件实现任务 `QUERY-LIST-PAGE-SHARED-COMPONENT-IMPLEMENTATION-001`
及其纠正 `…-001-R1` 已由独立授权任务执行完毕，参考页“源库快照状态”已**等价接入**
公共组件（**未**迁移第二个页面）；随后独立正式验收任务
`QUERY-LIST-PAGE-SHARED-COMPONENT-FORMAL-ACCEPTANCE-001` 已执行本轮正式验收。
该入口**不表示** ChatGPT 远程复审已经通过、**也不表示**已经选择或迁移任何页面。
该正式验收执行的 ChatGPT 远程复审结论为
`CHANGES_REQUIRED_TWO_DOCUMENT_EVIDENCE_CORRECTIONS_ONLY`（仅两处验收文档内部数字不一致）；
纯文档 R1 纠正任务（`QUERY-LIST-PAGE-SHARED-COMPONENT-FORMAL-ACCEPTANCE-001-R1`）
已定向应用该两处纠正，**未**重跑验收、**未**执行测试/构建/浏览器验证、**未**修改实现或测试。

项目负责人在“源库快照状态”页人工复检时发现 Tooltip **悬停可靠性**问题
（30+ 条记录下快速移入 / 快速扫行时“快照状态”Tooltip 有时不显示），要求定向纠正；
被人工独立授权的前置纠正任务
`QUERY-LIST-PAGE-SHARED-TOOLTIP-HOVER-RELIABILITY-CORRECTION-001`（`2026-09-17`）
已完成该纠正：`show()` 新增可选 `delayMs`（公共默认仍为
`QUERY_LIST_TOOLTIP_DELAY_MS=320`，**仅**“快照状态”一处显式传 `0`，
探针端 / 源库 / 查询候选继续使用公共默认），`hide()` 新增可选 `key` 参数
（无参仍是全局关闭；带 key 只关闭/取消该 key 自身，过期 key 为 no-op），
每个鼠标触发器在进入与离开使用同一稳定 key；**未**放大“快照状态”命中区、
**未**改变列宽 / 行高 / 单元格内边距、**未**改变任何视觉与业务契约。
该缺陷**不是**公共组件抽取引入的：抽取前提交
`94a84239ae9b617e783f5acf20274e838e11a105` 的
`frontend/src/views/data-source-run-state/tooltip/useSnapshotTooltip.ts`
中已存在同一“320ms 连续停留”机制。契约细节见
`SHARED_COMPONENT_DESIGN.md` §7.6.8。
纠正后状态：`tooltip_hover_reliability_correction_status=IMPLEMENTED_PENDING_CHATGPT_REVIEW`、
`project_owner_manual_review_status=CHANGES_REQUIRED_TOOLTIP_HOVER_RELIABILITY_CORRECTION_IMPLEMENTED_PENDING_RECHECK`、
`shared_component_implementation_status=IMPLEMENTED`、
`formal_acceptance_execution_status=PASS_17_OF_17`。

边界继续保持：本文件保持 `page_migration_status=NOT_STARTED`，
`shared_component_implementation_status` 现为
`IMPLEMENTED_FORMAL_ACCEPTANCE_EXECUTED_PENDING_CHATGPT_REVIEW`。在 ChatGPT 远程复审
与项目负责人接受完成之前：**不得**迁移任何页面、**不得**让参考页之外的页面接入公共组件、
**不得**把任何 `NOT_STARTED` 状态改写为 `FINAL_ACCEPTED` 或 `FINAL_ACCEPTED_AND_CLOSED`。
**正式验收执行通过不等于远程复审通过、不等于项目负责人最终接受**；
**本轮悬停可靠性纠正完成也不等于项目负责人复检已通过**；
并且**具体采用哪个页面作为首个迁移试点，仍需项目负责人另行确认**。

## 迁移状态补充（`2026-09-17`）

悬停可靠性纠正（`QUERY-LIST-PAGE-SHARED-TOOLTIP-HOVER-RELIABILITY-CORRECTION-001`）
已由 ChatGPT 从远程 Git 复审为 `APPROVED`；项目负责人在真实运行环境中人工复检
“快照状态”Tooltip，结论为 **PASS**。在此之上，补充正式验收任务
`QUERY-LIST-PAGE-SHARED-TOOLTIP-HOVER-RELIABILITY-SUPPLEMENTAL-FORMAL-ACCEPTANCE-001`
在纠正提交 `0a1cd99640a5cfa08280a95c23ca3c7231ea6a73` 上执行 21 项补充验收
（原 17 项重放 + `SA-018` 即时显示可靠性 + `SA-019` key 感知关闭与生命周期 +
`SA-020` 公共默认 `320ms` 冻结 + `SA-021` 范围与文档冻结），执行结论为 `PASS`。
该任务为纯验收加记录任务，**未**修改任何生产代码、测试代码、依赖、锁文件、SQL 或配置。

```text
tooltip_hover_reliability_correction_status=IMPLEMENTED_AND_CHATGPT_REVIEW_APPROVED
project_owner_manual_tooltip_recheck_status=PASS
supplemental_formal_acceptance_task=QUERY-LIST-PAGE-SHARED-TOOLTIP-HOVER-RELIABILITY-SUPPLEMENTAL-FORMAL-ACCEPTANCE-001
supplemental_formal_acceptance_execution_status=PASS
supplemental_formal_acceptance_review_status=PENDING_CHATGPT_REMOTE_GIT_REVIEW
project_owner_final_acceptance_status=PENDING
page_migration_status=NOT_STARTED
```

边界继续保持：本文件保持 `page_migration_status=NOT_STARTED`。
**补充验收执行通过不等于远程复审通过、不等于项目负责人最终接受**；
**项目负责人人工复查 PASS 仅针对“快照状态”Tooltip 快速划入现象，不构成最终接受**；
本节**未**写入本节之上所列的四个收口标记串；
在 ChatGPT 远程复审与项目负责人接受完成之前：**不得**迁移任何页面、
**不得**让参考页之外的页面接入公共组件、**不得**把任何 `NOT_STARTED` 状态改写为收口态。
下一条唯一入口为
`CHATGPT_QUERY_LIST_PAGE_SHARED_TOOLTIP_HOVER_RELIABILITY_SUPPLEMENTAL_FORMAL_ACCEPTANCE_REVIEW_FROM_REMOTE_GIT`。

### R1 纯文档与证据纠正（`2026-09-17`）

ChatGPT 对补充验收 R0 提交 `7077b839c51250778e7462d39c92deba69e88e09` 的远程 Git 复审结论为
`CHANGES_REQUIRED_FOUR_DOCUMENT_EVIDENCE_CORRECTIONS_ONLY`。R1 纠正任务
`QUERY-LIST-PAGE-SHARED-TOOLTIP-HOVER-RELIABILITY-SUPPLEMENTAL-FORMAL-ACCEPTANCE-001-R1`
只定向纠正四类文档 / 证据问题（R0 hooks 路径覆盖事实披露、参考页名称、
`git status --short` 采集时点、两处文字错误），**未**重跑验收、测试、构建或浏览器验证，
**未**修改任何生产代码 / 测试代码 / 依赖 / 配置 / SQL，
**未**改变补充验收 21/21 PASS 的执行事实。

参考页边界再次明确：本轮公共组件的**参考页**是**"源库快照状态"**
（`/monitor/data-source-state`）；"数据同步进度"（`/monitor/topic-offset`）
只是后续迁移的**优先试点候选**，不是本轮参考页。

```text
chatgpt_supplemental_formal_acceptance_r0_review_status=CHANGES_REQUIRED_FOUR_DOCUMENT_EVIDENCE_CORRECTIONS_ONLY
supplemental_formal_acceptance_r1_correction_task=QUERY-LIST-PAGE-SHARED-TOOLTIP-HOVER-RELIABILITY-SUPPLEMENTAL-FORMAL-ACCEPTANCE-001-R1
supplemental_formal_acceptance_r1_correction_status=APPLIED_PENDING_CHATGPT_R1_REVIEW
supplemental_formal_acceptance_execution_status=PASS_UNCHANGED_21_OF_21
acceptance_rerun_status=NOT_RUN_NOT_REQUIRED_DOCUMENT_CORRECTION_ONLY
project_owner_final_acceptance_status=PENDING
page_migration_status=NOT_STARTED
```

**R1 纠正不等于远程复审通过、不等于项目负责人最终接受**；边界与上一节一致，
`page_migration_status` 保持 `NOT_STARTED`，**未**选择试点页面、**未**启动任何页面迁移。

### 最终接受收口（`2026-09-17`）

ChatGPT 已从远程 Git 对补充验收 R1 纠正提交
`84086446ae9cfa4dce5a92b47832cb63f9c722a2` 复审为 `APPROVED`。
项目负责人随后明确给出最终接受决定，原话逐字记录：

```text
我确认公共组件及“源库快照状态”参考页最终验收通过，可以执行最终接受收口；暂不授权其他页面迁移。
```

收口任务 `QUERY-LIST-PAGE-SHARED-COMPONENT-FINAL-ACCEPTANCE-CLOSEOUT-001`
为**纯文档收口**：**未**重跑验收、**未**执行测试 / 构建 / 浏览器验证、
**未**启动或停止任何服务、**未**访问数据库 / ZooKeeper / Kafka、
**未**修改任何生产代码 / 测试代码 / 依赖 / 锁文件 / SQL / 配置，
既有报告与证据**逐字节不变**。

计数口径必须明确：原正式验收 17 项；补充正式验收 21 项，且**包含**原 17 项在纠正后提交上的
重新重放（另加 `SA-018`～`SA-021`）。两者是**包含关系而非并列关系**，
**不得**相加累计成“独立用例总数”。最终权威验收覆盖为补充验收 `21/21` PASS，
原 `17/17` 作为历史验收阶段事实保留。冻结计数保持：模板标记 `48/0/43/9`、
设计决策 `66/0`。

本文件上方各节为各自时点的历史记录，保留不动；下方状态块为本文件**当前权威状态**：

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

边界继续保持：本次最终接受**只**覆盖公共组件设计、公共组件实现、
“源库快照状态”参考页的等价接入、Tooltip 悬停可靠性纠正及对应正式 / 补充正式验收。
项目负责人**暂不授权其他页面迁移**：`page_migration_status` 保持 `NOT_STARTED`、
`page_migration_authorization_status` 保持 `NOT_GRANTED`、
`pilot_page_selection_status` 保持 `NOT_DECIDED`。
“数据同步进度”（`/monitor/topic-offset`）仍只是后续迁移的**优先试点候选**，
**未被选定**；**不得**让参考页之外的任何页面接入公共组件，
**不得**修改任何其他页面源码或文档状态，**不得**创建页面迁移任务、迁移分支或迁移提交。
上述唯一入口**仅**表示公共组件与参考页接入已经接受并关闭，
**不表示**其他页面或整个项目完成。R0 提交使用 `-c core.hooksPath=.git/hooks`
的过程偏差继续如实保留（`r0_process_deviation_status=RECORDED`）。

---

## 数据源管理列表页选择性接入授权记录（`2026-09-18` 授权 / `2026-09-19` 记录）

本节为**追加**记录，不改写上方任何历史结论与状态块。上方 §1~§7 及
`2026-09-17` 各时点记录的正文保持原样。

### 授权事实

- 授权日期：`2026-09-18`；授权人：项目负责人。
- 授权内容（原文引用）：“数据源管理列表页选择性接入查询列表页公共组件”。
- 授权对象：`数据源管理`（`/config/data-source`）的**第一个主列表页面**，
  且**仅限**“选择性接入”标题与说明（`QueryListPageShell`）、查询条件容器
  （`QueryListQueryPanel`）、查询 / 重置（`QueryListActions`）、结果卡片
  （`QueryListResultPanel`）四个公共组件。
- 授权性质：**页面范围化、业务行为不变**的选择性接入授权，
  属上方 §5“若后续确需统一视觉，应另立任务评估”所指引的**另立任务**路径，
  而**非**模板级“页面迁移”。

### 与上方 §1.1 / §5 既有结论的关系（必须显式记录，不得静默覆盖）

- §1.1 分类表中“数据源管理”一行为 **“不适合直接套用：含写操作与行级操作列”**；
  §5 将“含新增 / 编辑 / 删除的配置管理页面”列为 **不纳入迁移范围**。
- 本轮授权是在上述结论**仍然有效**的前提下，由项目负责人**明确授权**发起的
  页面范围化选择性接入，业务行为（CRUD / 分页 / Tooltip / 请求次数 / 错误语义 /
  空状态 / 列表刷新时机 / 角色规范化 / 删除 / 弹窗）保持不变；
  §1.1 / §5 关于“不适合直接套用”“不纳入迁移范围”的结论**不被改写**，
  本轮不受其自动授权，而是走“另立任务评估 + 项目负责人明确授权”。

### 当前状态（本次记录时点的权威事实）

```text
data_source_list_page_selective_integration_task=DATA-SOURCE-LIST-PAGE-SELECTIVE-QUERY-LIST-INTEGRATION-BASELINE-001
data_source_list_page_selective_integration_authorization_date=2026-09-18
data_source_list_page_selective_integration_authorization_status=GRANTED_BY_PROJECT_OWNER_FOR_THIS_PAGE_ONLY
data_source_list_page_selective_integration_document_status=DRAFT_PENDING_USER_REVIEW
data_source_list_page_selective_integration_implementation_status=NOT_STARTED
data_source_list_page_selective_integration_acceptance_status=ALL_NOT_RUN
```

### 边界（明确不得）

- **不得**把整个查询列表页模板写成已迁移：模板级 `page_migration_status` 保持
  `NOT_STARTED`，`page_migration_authorization_status` 保持 `NOT_GRANTED`，
  `pilot_page_selection_status` 保持 `NOT_DECIDED`。
- **不得**写成“所有页面已授权”：本授权**只**覆盖数据源管理第一个主列表页面。
- **不得**改写“源库快照状态”参考页历史（`2026-09-17` 各时点记录保持不变）。
- **不得**把“数据同步进度”（`/monitor/topic-offset`）误写为已选定试点
  （其 `pilot_page_selection_status` 仍为 `NOT_DECIDED`）。
- **不得**把本轮文档草案写成公共组件或页面已实现：本轮为纯文档任务，
  未修改任何公共组件实现，未修改任何页面源码，未创建迁移分支或迁移提交。
