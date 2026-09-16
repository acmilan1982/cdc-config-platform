# 查询列表页模板基线 · 设计（批准版）

> 文档状态：`APPROVED`
> 批准任务：`QUERY-LIST-PAGE-TEMPLATE-BASELINE-APPROVAL-001`
> 批准日期：2026-09-16
> 建立任务：`QUERY-LIST-PAGE-TEMPLATE-BASELINE-001`
> 基准提交：`83ff5c1ff80190459a4849eb74617cd4760db26e`

事实分层标记含义见 `README.md` §5。

> 本文件提出的**所有**组件、Composable、Props、Slots、事件与路由元数据均为
> `PROPOSED_NOT_IMPLEMENTED`：当前代码**不具备**这些能力，本任务**不实现**它们。
> 描述“源库快照状态”现状的内容标注 `REFERENCE_IMPLEMENTATION_FACT`。

---

## 1. 三层设计

`TEMPLATE_RULE_APPROVED` —— 把候选公共能力分为三层，每层明确
“可复用范围”与“必须排除的业务内容”：

| 层级 | 可复用范围 | 必须排除的业务内容 |
| --- | --- | --- |
| 页面壳层 | 标题、说明、查询卡片、结果卡片、统一间距 | 查询字段、接口、业务权限 |
| 展示组件层 | 查询操作区、刷新工具栏、稳定表格容器、单实例 Tooltip | 业务列定义、状态标签语义 |
| 行为组合层 | 已选择/已应用条件、单飞行、失败保留、可见性自动刷新 | API 地址、参数转换、业务错误规则 |

分层意图：

- **页面壳层**只负责“骨架与留白”，对业务零知识；
- **展示组件层**只负责“几何与交互的稳定性”，通过 Slots 接收业务内容；
- **行为组合层**只负责“请求编排的通用纪律”，不关心请求的具体含义。

---

## 2. 候选组件

`PROPOSED_NOT_IMPLEMENTED` —— 以下是候选清单，**均未实现**。

| 候选组件 | 建议职责 | 关键 Slots / Props（示意） |
| --- | --- | --- |
| `QueryListPageShell.vue` | 三段式骨架、标题与说明、卡片与间距 | `#header`、`#query`、`#result`；`title`、`description` |
| `QueryPanel.vue` | 查询条件卡片容器与字段流式布局 | 默认 slot 放条件组；`#actions` 放操作区 |
| `QueryActions.vue` | “查询 / 重置”操作区与稳定按钮几何 | `@query`、`@reset`；`query-loading`、`busy`、`query-text`、`reset-text` |
| `ResultPanel.vue` | 结果卡片容器：头部、提示槽、分隔、正文 | `#summary`、`#toolbar`、`#error`、`#body` |
| `RefreshToolbar.vue` | 自动刷新提示 + 最近成功刷新时间 + 立即刷新 | `last-refresh-text`、`countdown-seconds`、`countdown-progress`、`manual-loading`、`busy`；`@refresh` |
| `StableTableContainer.vue` | 表格外层容器与横向溢出、Loading/空状态占位 | 默认 slot 放业务表格；`overflow-x` 策略 |
| `SingleTooltip.vue` | 页面级单实例 Tooltip Host | `target`（内容 + 锚点 + 唯一键）；内部管理定位与显隐 |

### 2.1 候选组件的强制约束

`TEMPLATE_RULE_APPROVED`：

- 真实组件名称需在**后续设计任务**中结合仓库命名规则确定（上表名称仅为示意）；
- **不得**为了复用而创建“承担所有业务行为”的超级组件；
- **优先采用 Slots** 传入业务字段与表格列；
- 公共组件**不得直接依赖**某个 Feature 的 API、Store 或数据结构；
- 样式必须**局部化或显式启用**，不能泄漏到未迁移页面。

### 2.2 参考实现对照（证明候选不是凭空设计）

`REFERENCE_IMPLEMENTATION_FACT` —— “源库快照状态”当前**逐个页面私有**地实现了上述能力：

| 候选组件 | 参考实现中的对应物（Feature 私有，未公共化） |
| --- | --- |
| `QueryListPageShell.vue` | `DataSourceRunStatePage.vue` 的 `.dss-page` / `.dss-page-header` / `.dss-card` 结构 |
| `QueryPanel.vue` | `.dss-card.dss-query-card` |
| `QueryActions.vue` | `DataSourceSnapshotQueryBar.vue` 中的 `.dss-q-actions` |
| `ResultPanel.vue` | `.dss-card.dss-result-card` 与 `.dss-result-card__header` / `__divider` / `__body` |
| `RefreshToolbar.vue` | `DataSourceSnapshotToolbar.vue` |
| `StableTableContainer.vue` | `DataSourceSnapshotTable.vue` 的 `.dss-table-wrap` |
| `SingleTooltip.vue` | `tooltip/SnapshotTooltipHost.vue` + `tooltip/useSnapshotTooltip.ts` |

> 这些对应物都在 `frontend/src/views/data-source-run-state/` 的 Feature 私有命名空间
> （`.dss-*`）内，**没有任何公共组件存在**。

### 2.3 参考实现的组件化难点（后续设计任务必须处理）

`REFERENCE_IMPLEMENTATION_FACT` —— 当前参考实现存在两处**同类能力重复实现**，
抽取公共组件时必须收敛：

1. **单实例 Tooltip**：页面级 `SnapshotTooltipHost`（表格）与查询栏
   `.dss-q-tt`（下拉候选项）是两个独立实现。模板只要求“同屏最多 1 个”，
   组件化时应评估是否合并为一个机制。
2. **Loading 指示器**：`DataSourceSnapshotQueryBar.vue` 的 `.dss-btn-spinner`
   （`left: 2px`）与 `DataSourceSnapshotToolbar.vue` 的 `.dss-btn-spinner`
   （`left: 3px`）是两套私有样式。

这两点是**参考实现的现状描述**，不是模板要求的形态；具体如何收敛由后续
公共组件设计任务决定。

### 2.4 候选组件不得承担的内容

`TEMPLATE_RULE_APPROVED` —— 候选公共组件**不得**承担：

- 任何具体查询字段的渲染逻辑；
- 任何 API 调用、参数拼接或响应解析；
- 任何业务列定义或列宽；
- 任何状态标签的颜色/文案映射；
- 任何写操作（新增/编辑/删除/启停）；
- 任何 Feature 专属的错误提示文案。

### 2.5 候选清单与详细设计草案的关系

**本节候选清单保持为已批准基线输入**：它定义了页面壳层 / 展示组件层 / 行为组合层
三层划分、候选名称示意与强制约束，是本目录仍然有效的正式结论。

后续的**公共组件详细设计草案** `SHARED_COMPONENT_DESIGN.md`（状态
`DRAFT_PENDING_CHATGPT_AND_PROJECT_OWNER_REVIEW`，**尚未批准、尚未实现**）
在此基础上逐个候选给出**唯一结论**（保留实现 / 合并 / 延后 / 否决）、
最终建议名称与目录、完整 Props / Slots / Emits 契约、样式令牌、
稳定滚动条槽的唯一方案与阶段一范围。

两者关系必须按以下口径理解，不得混用：

- 本节的候选条目是**基线的候选池**，不是最终组件清单；
- 最终建议名称、职责边界与取舍理由以草案为准，但草案**尚未批准**，
  因此在其获批之前**不得**据以开始实现；
- 草案**未**修改本节任何已批准内容，也**未**修改本文件集其余三份文档的规范内容；
- 无论草案结论如何，本节 §2.1 的强制约束（不得创建超级组件、优先 Slots、
  不得依赖某个 Feature 的 API / Store / 数据结构、样式必须局部化或显式启用）
  **继续有效**。

---

## 3. 候选 Composable

`PROPOSED_NOT_IMPLEMENTED` —— 以下是候选清单，**均未实现**。

### 3.1 `useAppliedQuery`

| 项 | 内容 |
| --- | --- |
| 输入 | 初始条件（可为空条件）、一个把草稿转换为请求条件的纯函数（由调用方提供） |
| 输出 | 当前草稿条件、已应用条件、`hasSuccess`、提交草稿的方法、重置草稿的方法 |
| 职责 | 维护“草稿条件”与“已应用条件”的分离；只有**成功**请求才升级已应用条件 |
| **禁止**承担 | 发起请求；决定请求参数格式；决定初始条件的具体业务含义；“重置是否查询”的策略（由页面/Feature 决定） |

`REFERENCE_IMPLEMENTATION_FACT` —— 参考实现中对应的现状已分布在多处：
`useDataSourceSnapshot.ts` 持有 `appliedCriteria` 与 `hasSuccess`；
`utils/selection.ts` 提供 `defaultCriteria()` / `buildCriteriaFromDraft()` /
`draftFromCriteria()` / `criteriaEqual()` / `normalizeDimension()`；
“重置只恢复草稿、不查询”的语义写在 `DataSourceSnapshotQueryBar.vue` 的 `onReset()`。

### 3.2 `useSingleFlightRequest`

| 项 | 内容 |
| --- | --- |
| 输入 | 一个执行函数（由调用方提供），可选超时/错误分类钩子 |
| 输出 | `busy`、`requestKind`（或等价标签）、请求实例令牌、失败保留旧结果的写入纪律 |
| 职责 | 同一时刻至多一个实际请求在途；在途期间新触发被抑制，不排队、不补发；以令牌防止旧响应覆盖新响应；组件卸载后拒绝迟到写入 |
| **禁止**承担 | API 地址；业务错误文案；重试策略；自动刷新周期的决策 |

`REFERENCE_IMPLEMENTATION_FACT` —— 参考实现中的现状：
`useDataSourceSnapshot.ts` 内以 `requestKind` 表达“唯一在途请求来源”，
`busy = requestKind !== null`；`launch()` 在 `disposed || busy || hidden` 时直接返回；
`run()` 用 `latestSeq` 令牌防止旧响应覆盖；`destroy()` 置 `disposed` 拒绝迟到写入。

### 3.3 `useVisibleAutoRefresh`

| 项 | 内容 |
| --- | --- |
| 输入 | 周期毫秒数、触发回调、一个读取“当前应使用条件”的函数 |
| 输出 | 剩余秒数投影、剩余比例投影、暂停标记、可见性变更处理方法、销毁方法 |
| 职责 | 维护一个真实的周期定时器；以**唯一事实来源**（单一 deadline）派生展示投影；页面隐藏时停表并冻结投影（不假走）；恢复可见时按策略补发一次 |
| **禁止**承担 | 决定周期数值（由 Feature 传入）；决定“补发还是等待”；发起请求本身 |

`REFERENCE_IMPLEMENTATION_FACT` —— 参考实现中的现状：
`useDataSourceSnapshot.ts` 以 `setTimeout` 为唯一真实调度，
`countdownTimer`（`setInterval` 1s）只做**投影刷新**，绝不触发请求；
`AUTO_REFRESH_INTERVAL_MS = 60_000`；
`freezeCountdown()` 在隐藏时停秒表并丢弃 `nextFireDeadline`（保留现值，不假走）；
`pendingVisibilityRefresh` 保证“多次可见合并为一次补发”。

### 3.4 三类结论的区分

`TEMPLATE_RULE_APPROVED` —— 使用候选 Composable 时，必须区分：

| 类别 | 含义 |
| --- | --- |
| 模板建议 | 上表“职责 / 禁止承担”所描述的通用纪律 |
| 当前参考实现事实 | 参考实现**当前确实如此实现**（见各候选下 `REFERENCE_IMPLEMENTATION_FACT`） |
| 具体业务页面决定 | 周期数值、是否自动刷新、是否补发、初始条件、重置语义、错误文案等 |

**模板建议不构成对任何页面的强制改造要求。**

---

## 4. 状态模型

`TEMPLATE_RULE_APPROVED` —— 推荐的查询列表页状态模型包含：

| 状态 | 含义 |
| --- | --- |
| 当前选择条件 | 用户在查询区当前的选择（草稿），可能尚未提交 |
| 已应用条件 | 最近一次**成功**请求所确立的条件 |
| 当前成功结果 | 最近一次成功请求返回的数据 |
| 查询请求状态 | 查询类请求的在途/空闲（大态，可能遮罩表格） |
| 刷新请求状态 | 刷新类请求的在途/空闲（轻态，不遮罩表格） |
| 最近成功刷新时间 | 最近一次成功收到并判成功的时刻 |
| 页面可见性 | 页面当前是否可见 |
| 自动刷新配置 | 周期、是否启用 |

### 4.1 推荐行为

`TEMPLATE_RULE_APPROVED`：

1. **只有成功请求才替换已应用条件和结果**；
2. **失败时保留旧结果及旧已应用条件**，只给出收敛的失败提示；
3. 用户尚未提交的新选择**保留在查询区**（草稿与已应用条件分离）；
4. 自动刷新和立即刷新**使用已应用条件**，不使用尚未提交的草稿；
5. 同一数据请求采用**单飞行**或等价的重复请求抑制机制；
6. 是否采用上述行为**仍需在每个 Feature 的需求中确认**——本模板不代替 Feature 需求。

### 4.2 参考实现对照

`REFERENCE_IMPLEMENTATION_FACT` —— “源库快照状态”当前实现与上述推荐的对应关系：

- 六个请求类别：`initial`（首载）、`retry`（重新加载）、`query`（点击查询）、
  `manual`（立即刷新）、`restore`（恢复可见补发）、`auto`（自动刷新）；
- `ESTABLISHING = {initial, retry, query}` 才允许把本次请求条件升级为已应用条件；
- `REFRESHING = {manual, restore, auto}` 只表达轻量刷新，不遮罩表格；
- 首次失败且从未成功 → 整区错误态 `firstLoadError`；
  有成功现场后的失败 → 内联收敛提示 `refreshError`（`刷新失败，将在约 60 秒后自动重试`），
  **保留旧结果**；
- 查询区草稿与 `appliedCriteria` 分离，“重置”只重置草稿；
- 单飞行由 `busy` 统一抑制；自动/手工被抑制的触发**不视为一次实际请求**，不重置计时；
- 自动刷新与“立即刷新”恒按 `appliedCriteria` 取数。

> 上述为 Feature 专属结论（对应 `DSS-REQ-023` / `DSS-REQ-050` / `DSS-REQ-053` /
> `DSS-REQ-054` / `DSS-REQ-059` / `DSS-REQ-060` / `DSS-REQ-061` / `DSS-REQ-071`）。
> 模板只吸收“成功才升级、失败保留、单飞行”这类通用纪律。

---

## 5. 明确不得抽取的内容

`TEMPLATE_RULE_APPROVED` —— 以下内容**必须留在具体 Feature**，
公共组件与 Composable **不得**覆盖：

1. 具体查询字段（字段名、数量、顺序）；
2. 候选项来源（从哪个接口/表取候选、如何去重、如何排序）；
3. 接口地址和参数格式；
4. 表格业务列及列宽；
5. 分页策略（是否分页、页大小、游标或页码）；
6. 最大返回条数；
7. 状态标签业务语义（状态编码到文案与配色的映射）；
8. 新增、编辑、删除、启停及批量保存权限；
9. 数据库读写边界（是否只读、允许哪些写操作）；
10. 自动刷新周期；
11. Feature 专属错误提示与恢复策略。

`REFERENCE_IMPLEMENTATION_FACT` —— 上述第 1、2、3、4、5、6、7、10、11 项在参考实现中
均位于 `frontend/src/views/data-source-run-state/` 内或 `@/api` / `@/types` 的
Feature 专属模块中，例如：

- 查询字段：探针端 / 源库 / 快照状态（`DataSourceSnapshotQueryBar.vue`）；
- 接口：`fetchSnapshotStatusList`（`@/api/dataSourceSnapshot`）；
- 参数：`{ clientId, sourceId, status }`；
- 列宽：`70 / 170 / 285 / 140 / 170 / 170 / 170`（`DataSourceSnapshotTable.vue`）；
- 分页：不分页（`DSS-REQ-021`）；
- 周期：`60_000ms`（`AUTO_REFRESH_INTERVAL_MS`）；
- 失败提示：`刷新失败，将在约 60 秒后自动重试`（`REFRESH_FAIL_MESSAGE`）。

---

## 6. 与 UI 规范的关系

本文件描述**结构与分层**；具体的页面结构、查询区、工具栏、表格、稳定滚动条槽、
响应式与可访问性规范见 `UI.md`。两者对同一事实的口径必须一致。

## 7. 与迁移的关系

迁移的逐页评估清单、推荐顺序、每页独立任务要求、已正式接受页面的保护要求与
后续任务代码见 `MIGRATION.md`。
