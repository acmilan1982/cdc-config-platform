# 查询列表页公共组件 · 详细设计（草案，待复审）

```text
shared_component_design_status=DRAFT_PENDING_CHATGPT_AND_PROJECT_OWNER_REVIEW
query_list_page_template_document_status=APPROVED
query_list_page_template_implementation_status=NOT_STARTED
shared_component_implementation_status=NOT_STARTED
page_migration_status=NOT_STARTED
reference_feature_status=FINAL_ACCEPTED_AND_CLOSED
design_task=QUERY-LIST-PAGE-SHARED-COMPONENT-DESIGN-001
design_base_commit_id=44d2605f5fa0529f472a6e3b189cd5b88f38a5dd
r1_correction_task=QUERY-LIST-PAGE-SHARED-COMPONENT-DESIGN-001-R1
r1_correction_base_commit_id=106bb41c83c9dfd6f19b323cd68bd1b347193f80
chatgpt_r0_shared_component_design_review_status=CHANGES_REQUIRED_CONTRACT_EQUIVALENCE_CORRECTIONS_ONLY
r1_contract_equivalence_correction_status=APPLIED_PENDING_CHATGPT_R1_REVIEW
```

> 设计任务：`QUERY-LIST-PAGE-SHARED-COMPONENT-DESIGN-001`
> 分支：`develop`
> 本轮为**纯设计任务**：**未创建任何组件、Composable、路由元数据或样式**，
> **未修改“源库快照状态”页面**，**未迁移任何页面**，**未执行任何测试、构建或浏览器验证**。

## 0. 本文件的标记与边界

### 0.1 唯一标记

本文件全文只使用**一个**标记：

```text
SHARED_COMPONENT_DESIGN_DECISION_DRAFT
```

含义：**本轮设计任务给出的草案结论**。所有组件命名、目录、Props / Slots / Emits、
类型、令牌、路由元数据与阶段划分均属此标记，**均未实现**，**尚未批准**。

本文件**不使用** `README.md` §5 定义的三类标记，以避免与本目录既有四份文档的
标记计数产生歧义。本文件描述参考实现现状时写“参考实现事实”，引用已批准模板规范时
写“模板规范（`README.md` §5.2）”，两者均为**引用**，不新增标记实例。

### 0.2 事实来源与核验方式

本文件所有“参考实现事实”均在本轮基准提交
`44d2605f5fa0529f472a6e3b189cd5b88f38a5dd` 的**真实源码**中逐条读取核验，
不依据模板文档转述，不依据旧提示词，不依据记忆。

本轮实际读取的文件（只读）：

| 范围 | 文件 |
| --- | --- |
| 参考页面 | `frontend/src/views/data-source-run-state/DataSourceRunStatePage.vue` |
| 参考页面组件 | `.../components/{DataSourceSnapshotQueryBar,DataSourceSnapshotToolbar,DataSourceSnapshotTable,DataSourceSnapshotStatusTag}.vue` |
| 参考页面行为 | `.../composables/useDataSourceSnapshot.ts` |
| 参考页面 Tooltip | `.../tooltip/{SnapshotTooltipHost.vue,useSnapshotTooltip.ts,tooltipPosition.ts}` |
| 参考页面工具 | `.../utils/{selection.ts,format.ts,rowKey.ts}` |
| 布局与路由 | `frontend/src/layouts/MainLayout.vue`、`frontend/src/layouts/MainLayout.spec.ts`、`frontend/src/router/index.ts` |
| 对照页面一 | `frontend/src/views/topic-offset/**`（页面、3 组件、composable、utils） |
| 对照页面二 | `frontend/src/views/log-query/**`（页面、5 组件、composable） |
| 目录与命名 | `frontend/src/components/**`、`frontend/src/views/*/components/**`、`frontend/src/views/*/composables/**`、`frontend/src/types/**`、`frontend/package.json` |

### 0.3 本轮不做的事

- 不创建组件、Composable、测试、样式、路由元数据；
- 不修改 `frontend/**`、`backend/**`、`tests/**`、`docs/features/**`；
- 不修改“源库快照状态”页面代码，不重开其已接受的 Feature 状态；
- 不迁移“数据同步进度”或任何其他页面；
- 不执行测试、构建、浏览器几何回归；
- 不把本草案写成“已批准”“已实现”“已迁移”。

---

## 7.1 目标、非目标与适用范围

### 7.1.1 目标

`SHARED_COMPONENT_DESIGN_DECISION_DRAFT` —— 本设计要回答的问题，以及本轮给出的答案：

| 问题 | 本轮答案位置 |
| --- | --- |
| 已批准基线中的候选组件，哪些保留、哪些合并、哪些延后、哪些否决 | §6 决策矩阵 |
| 最终建议名称、目录与职责边界 | §7.3 |
| 每个组件的 Props / Slots / Emits / 类型 / 默认行为 | §7.4 |
| 哪些状态由公共组件持有、哪些必须留在 Feature | §7.8 |
| 单实例 Tooltip 机制如何统一 | §7.6 |
| Loading 指示器与按钮固定宽度如何复用且几何稳定 | §7.5 |
| `scrollbar-gutter: stable` 如何显式启用 | §7.7 |
| 样式令牌、作用域、响应式与可访问性 | §7.9 / §7.10 |
| 分阶段实施，避免过度抽象 | §7.11 |
| 接入后如何证明业务行为与几何等价 | §7.12 |

### 7.1.2 非目标

`SHARED_COMPONENT_DESIGN_DECISION_DRAFT`：

1. **不实现**任何组件或 Composable；
2. **不启用**任何路由元数据，**不修改** `MainLayout.vue` 或 `router/index.ts`；
3. **不把**“源库快照状态”改为使用公共组件；
4. **不迁移**任何页面，**不评估**迁移顺序（迁移顺序已在 `MIGRATION.md` 批准）；
5. **不定义**按钮高度基线（参考实现未定义统一高度，模板也不定义，见 §7.5.4）；
6. **不引入**新依赖、新构建步骤、新测试框架；
7. **不新增**全局样式、全局指令或全局插件；
8. **不改变**参考实现任何已接受的视觉与交互（唯一例外见 §7.5.5、§7.6.7）。

### 7.1.3 适用范围

`SHARED_COMPONENT_DESIGN_DECISION_DRAFT` —— 本设计与已批准模板保持一致，只面向
**只读查询列表页**：顶部查询条件 + 结果表格为主体的页面形态。带增删改的配置管理页、
详情页、大屏页、向导页不在范围内。

---

## 7.2 现状代码事实清单（基准提交 `44d2605f…`）

### 7.2.1 页面结构与容器

`SHARED_COMPONENT_DESIGN_DECISION_DRAFT`（参考实现事实核验）：

| 项 | 参考实现（`data-source-run-state`） | 对照页面（`topic-offset`） |
| --- | --- | --- |
| 页面根 | `.dss-page`：`display:flex; flex-direction:column; gap:12px; padding:14px 16px; background:transparent; border-radius:10px` | `.toff-page`：`display:flex; flex-direction:column; gap:4px` |
| 页头 | `.dss-page-header`：`.dss-title`（`margin:0` / 20px / 650 / `letter-spacing:-0.01em` / `color:var(--dss-text,#09090b)`）+ `.dss-desc`（`margin:4px 0 0` / 13px / `color:var(--dss-text-muted,#71717a)` / `line-height:1.5`） | `.toff-header`：`.toff-title`（20px / 600），**无描述**，另有 `.toff-progress-notice` 信息块 |
| 查询区容器 | `.dss-card.dss-query-card`：`background: var(--dss-embedded)=#f4f4f5`、`border-radius:8px`、`box-shadow:none`、`padding:10px 16px` | **无卡片容器**：`.toff-query-bar` 仅 `display:flex; flex-wrap:wrap; align-items:center; gap:8px 14px` |
| 查询字段组 | 恰好 **3** 个 `.dss-q-group`（探针端 / 源库 / 快照状态） | **4** 个 `.toff-q-group`（客户端 / 源库 / 目标库 / 表名，其中表名为输入框） |
| 结果区容器 | `.dss-card.dss-result-card`；头部 `.dss-result-card__header`（`flex; align-items:center; justify-content:space-between; gap:12px 16px; flex-wrap:wrap; padding:12px 16px 2px`） | **无卡片容器**；`.toff-toolbar`（`flex; justify-content:space-between; align-items:center; flex-wrap:wrap; gap:8px 12px; margin:8px 0`） |
| 错误提示槽 | `.dss-result-error-slot`：`min-height:22px; padding:0 16px`——**预留高度**避免提示出现时位移 | 无预留槽，提示直接插入工具栏 |
| 表格外层 | `.dss-table-wrap`：**仅** `width:100%; overflow-x:auto` | 无独立外层，表格直接渲染 |

核验结论：参考页面与对照页面在**骨架形状**上一致（页头 → 查询区 → 结果区），
但**视觉实现差异显著**（卡片 vs 无卡片、间距 12px vs 4px、字重 650 vs 600）。
这直接决定了 §7.3 的组件边界与 §7.9 的令牌设计：**共享的是契约与几何，不是像素**。

`SHARED_COMPONENT_DESIGN_DECISION_DRAFT` —— **两层内边距必须同时保留**：
`.dss-page` 自带**内层**页面内边距 `padding:14px 16px`（连同 `border-radius:10px`、
`background:transparent`），而 §7.2.7 所述 `MainLayout .content-area` 的
`padding:16px 20px` 是**外层**布局内边距。两者是**两层不同的事实**，
**不得合并口径**，也**不得**用外层 padding 替代页面壳的内部 padding。

### 7.2.2 查询 / 重置 / 刷新按钮的固定宽度与 Loading 几何

`SHARED_COMPONENT_DESIGN_DECISION_DRAFT`（参考实现事实核验）：

| 按钮 | 选择器 | 固定宽度 | 高度 | 四个宽度值同锁 | Loading 指示器 |
| --- | --- | --- | --- | --- | --- |
| 查询 | `.dss-q-actions .dss-query-btn` | `62px` | `height:30px`（显式） | 是（`width` / `min-width` / `max-width` / `flex-basis`） | `.dss-btn-spinner`，`position:absolute; left:2px`，常驻节点，仅切 `opacity` / `visibility` |
| 重置 | `.dss-q-actions .dss-reset-btn` | `62px` | `height:30px`（显式） | 是 | 无 |
| 立即刷新 | `.dss-refresh-group .dss-refresh-btn` | `110px` | **未显式设置高度** | 是 | `.dss-btn-spinner`，`position:absolute; left:3px`，常驻节点 |

核验要点：

1. 三个固定值是**宽度**，不是高度；**参考实现不存在统一的按钮高度基线**
   （查询/重置显式 `30px`，立即刷新未设高度，由 Element Plus 默认值决定）。
2. 指示器为**常驻 DOM 节点**，只切换 `opacity` + `visibility`，
   且 `position:absolute` 脱离按钮内容流——因此显隐**不触发重排**、不推移文字、不改变外框。
3. **两处私有实现的 `left` 偏移不同**：查询按钮 `2px`，刷新按钮 `3px`。
   这是必须收敛的重复实现，但收敛方式受到“已接受视觉不得变更”的约束（见 §7.5.5）。
4. 按钮文字为**独立固定居中节点**（`.dss-action-label`），按钮本身
   `inline-flex + justify-content:center`，因此指示器出现不会改变文字坐标。

### 7.2.3 结果区右侧刷新信息组

`SHARED_COMPONENT_DESIGN_DECISION_DRAFT`（参考实现事实核验）——
`DataSourceSnapshotToolbar.vue` 的顺序与几何设施：

| 顺序 | 元素 | 几何稳定设施 |
| --- | --- | --- |
| 1 | `.dss-countdown-ring`（16px SVG，`aria-hidden`） | `stroke-dasharray="40.84"`；只改 `stroke-dashoffset`，尺寸恒定 |
| 2 | `.dss-countdown-seconds`（`60→0` / `--`） | `width / min-width / max-width / flex-basis` 四值同锁 `2ch` + `text-align:right` |
| 3 | `.dss-countdown-unit`（`秒后自动刷新`） | `white-space:nowrap` |
| 4 | `.dss-refresh-sep`（1px × 14px 分隔符） | 固定像素 |
| 5 | `.dss-refresh-time`：前缀 `最近成功刷新：` + 定宽时间值槽 | 槽内常驻不可见常量占位 `88:88:88`（`visibility:hidden` + `aria-hidden`），真实值 `.dss-refresh-time-actual` 绝对定位于槽左上 |
| 6 | `.dss-refresh-btn`（110px，常驻指示器） | 见 §7.2.2 |

整组 `.dss-refresh-group` 为 `inline-flex; gap:8px; flex:0 0 auto; white-space:nowrap`
——**不可拆散的单一逻辑组**。

对照页面 `OffsetToolbar.vue` 的事实差异：使用字面量文本 `60 秒自动刷新`、普通
`.toff-dot` 点状指示、Element Plus 默认 `:loading`、**无固定宽度**、
**无倒计时环**、**无定宽时间槽**，且左侧摘要（`共 N 条`）与右侧组处于同一 flex 行。

### 7.2.4 表格横向溢出与长文本

`SHARED_COMPONENT_DESIGN_DECISION_DRAFT`（参考实现事实核验）：

- `.dss-table-wrap { width:100%; overflow-x:auto }`——**仅两条声明**；
- `el-table` 自身 `.dss-table { width:100%; min-width:1175px }`，`min-width` 由
  **业务列宽之和**决定（`70 + 170 + 285 + 140 + 170 + 170 + 170`），属 Feature 专属；
- 长文本：`.dss-cell-main { flex:0 1 auto; min-width:0; overflow:hidden; text-overflow:ellipsis; white-space:nowrap }`；
- 字段级截断由 Feature 工具 `displayField()` / `truncateCodePoints()` 完成
  （按 Unicode code point 计 20，追加 ASCII 三点）；
- 对照页面 `OffsetTable.vue` **没有**独立的外层溢出容器，单元格结构完全不同
  （`.toff-sync-cell` / `.toff-sync-line` / `.toff-seg` 等）。

### 7.2.5 两套 Tooltip 实现

`SHARED_COMPONENT_DESIGN_DECISION_DRAFT`（参考实现事实核验）：

| # | 实现 | 位置 | 触发方式 | 定位算法 |
| --- | --- | --- | --- | --- |
| 1 | 页面级单实例 Host | `tooltip/SnapshotTooltipHost.vue` + `tooltip/useSnapshotTooltip.ts` | 表格单元格 `mouseenter`，键为 `client-` / `source-` / `status-` + `rowKey` | `tooltip/tooltipPosition.ts`：**锚点矩形**算法（`TooltipAnchor{top,left,width,height,bottom,right}`，优先上方，水平居中，`EDGE_GAP=8`、`VIEWPORT_MARGIN=8`，夹取到视口） |
| 2 | 查询栏下拉候选项 Tooltip | `DataSourceSnapshotQueryBar.vue` 内 `.dss-q-tt` + 文档级捕获 `mouseover` / `mouseout` 委派 | `data-dss-client-id` 属性锚定，仅长描述显示 | **无独立定位函数**：内联 `position:fixed` + 由事件坐标推导 |

同时核验发现第三处相关实现：`frontend/src/views/topic-offset/utils/tooltipPosition.ts`
是**指针跟随**算法（`PointerPoint`、`TIP_GAP=14`、`TIP_SAFETY_MARGIN=8`、
`TIP_DEFAULT_MAX_WIDTH=340`），与参考页面的**锚点矩形**算法**函数签名与语义均不同**，
**不是同一工具的重复副本**。但对照页面当前**未使用**该函数渲染自定义 Tooltip，
其候选项使用原生 `title` 属性。

核验结论（对 §7.6 有决定性影响）：

1. 参考页面**确实**存在同一能力的两套实现，需要收敛为**一个机制**；
2. “一个机制”指**单实例语义 + 一套锚点定位算法**，**不**指把锚点矩形算法与
   指针跟随算法强行合并——两者解决不同问题，合并会产出双模式 API；
3. 对照页面没有自定义 Tooltip 实例，因此统一机制不会与该页面产生冲突。

### 7.2.6 `useDataSourceSnapshot` 行为事实

`SHARED_COMPONENT_DESIGN_DECISION_DRAFT`（参考实现事实核验）：

| 项 | 事实 |
| --- | --- |
| 请求类别 | `RequestKind = 'initial' \| 'retry' \| 'query' \| 'manual' \| 'restore' \| 'auto'` |
| 建立性类别 | `ESTABLISHING = {initial, retry, query}`——只有这三类成功才升级 `appliedCriteria` |
| 刷新类类别 | `REFRESHING = {manual, restore, auto}`——只点亮刷新视觉，不遮罩表格 |
| 草稿 / 已应用条件 | `appliedCriteria: AppliedCriteria`（Feature 类型），初值三项“全部”；查询区草稿由 `DataSourceSnapshotQueryBar` 内部持有 |
| 单飞行 | `busy = computed(() => requestKind !== null)`；`launch()` 在 `disposed \|\| busy \|\| hidden` 时**直接返回**（不排队、不补发） |
| 防旧覆盖 | `const seq = ++latestSeq`；提交前校验 `disposed \|\| seq !== latestSeq` |
| 失败保留 | 从未成功 → `firstLoadError` 整区错误态；有成功现场 → `refreshError` 内联提示，**保留旧 records 与旧 appliedCriteria** |
| 自动刷新 | `AUTO_REFRESH_INTERVAL_MS = 60_000`；真实调度**唯一来源**为 `setTimeout`；1s `setInterval` 仅刷新投影（`autoRefreshRemainingSeconds` / `autoRefreshProgress`），绝不触发请求 |
| 可见性 | 隐藏：`stopTimer()` + `freezeCountdown()` + `autoRefreshPaused=true` + 清 `pendingVisibilityRefresh`；恢复：忙则置一次性 `pendingVisibilityRefresh`，空闲则立即按 `appliedCriteria` 补发一次（`restore`，从未成功则 `retry`） |
| 销毁 | `destroy()` 置 `disposed`、清计时器与标志，拒绝迟到写入 |
| 重置语义 | “重置”只重置查询区草稿，**不发起查询**（写在 `DataSourceSnapshotQueryBar.onReset()`） |

对照页面 `useTopicOffset.ts` 的事实差异（**对 §6 的延后结论至关重要**）：

- 并发模型不同：`acceptedSeq` + **“最新用户意图槽位”**（新意图覆盖旧等待意图），
  且 `offsets` 与候选刷新在**同一 busy 内串行 await**；
- 请求类别不同：`'initial' | 'retry' | 'query' | 'page' | 'manual' | 'restore' | 'auto'`
  （多出 `page` 翻页）；
- 状态归属不同：`appliedCriteria` 与结果存在 **Pinia store**（`useTopicOffsetStore`）中，
  而非 composable 实例内；
- 定时器不同：使用 `setInterval`，且有 `lastFailedCriteria`——**无倒计时投影**；
- 重试策略不同：`useTopicOffset(notify)` 接受一个提示回调，失败通知方式与参考实现不同。

### 7.2.7 真实滚动容器与稳定滚动条槽

`SHARED_COMPONENT_DESIGN_DECISION_DRAFT`（参考实现事实核验）：

- 真实纵向滚动容器是**布局层**的 `MainLayout.vue` 中的 `.content-area`：
  `flex:1; padding:16px 20px; overflow-y:auto; background-color:#f0f2f5`；
- 稳定滚动条槽声明为 `.content-area.dss-stable-gutter { scrollbar-gutter: stable }`；
- 启用判据是**硬编码路由名**：`const isDataSourceRunState = computed(() => route.name === 'DataSourceRunState')`，
  模板上 `:class="{ 'dss-stable-gutter': isDataSourceRunState }"`；
- `scrollbar-gutter` 在样式块中**恰好出现一次**，基础 `.content-area` 规则内**不含**该属性；
- **只有** `/monitor/data-source-state` 启用，其余 12 条路由计算值为 `auto`；
- `MainLayout.spec.ts` 已把上述事实**固化为断言**（见 §7.7.5 的风险记录）。

### 7.2.8 公共目录与命名惯例

`SHARED_COMPONENT_DESIGN_DECISION_DRAFT`（参考实现事实核验）：

| 目录 | 现状 |
| --- | --- |
| `frontend/src/components/` | 仅 `monitor/ClientCard.vue` 与 `PlaceholderPage.vue`；`monitor/` 是唯一的领域子目录先例 |
| `frontend/src/composables/` | **不存在** |
| `frontend/src/views/*/components/` | 6 个页面各自私有的 PascalCase `.vue` 组件 |
| `frontend/src/views/*/composables/` | 4 个页面各自私有的 `use*.ts` |
| 命名惯例 | 组件 PascalCase `.vue`；Composable `useXxx.ts`；工具 `camelCase.ts`；Feature 私有样式前缀 `.dss-*` / `.toff-*` / `.filter-*` 等 |

结论：建议的 `frontend/src/components/query-list/` 与
`frontend/src/composables/query-list/` **均为新目录**，但 `components/<domain>/` 已有先例；
`composables/` 顶层目录为**新增惯例**，必须在 §7.3.3 说明其必要性。

---

## 6. 组件决策矩阵

### 6.1 十项候选的唯一结论

`SHARED_COMPONENT_DESIGN_DECISION_DRAFT` —— 对已批准基线中的每个候选项给出
**恰好一个**结论。结论取值：

- `KEEP_FOR_FIRST_IMPLEMENTATION`（阶段一实现）
- `MERGE_INTO_ANOTHER_COMPONENT`（合并进另一组件）
- `DEFER_UNTIL_SECOND_CONSUMER`（接口设计完整，等第二个消费者再抽取）
- `REJECT_AS_UNNECESSARY_ABSTRACTION`（否决）

| # | 候选名 | 最终建议名 | 结论 | 理由（源码证据） | 阶段一实现 | 参考页面对应代码 | 对第二个页面的潜在价值 | 主要风险 |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| 1 | `QueryListPageShell.vue` | `QueryListPageShell.vue` | `KEEP_FOR_FIRST_IMPLEMENTATION` | 两个已核验页面的骨架形状一致（页头 → 查询区 → 结果区）；页头排版与段落节奏目前只在参考页面定义一次（`.dss-page`/`.dss-title`/`.dss-desc`）；组件对业务零知识 | 是 | `.dss-page` + `.dss-page-header` + `.dss-title` / `.dss-desc` | `topic-offset` 的 `.toff-page`/`.toff-header`/`.toff-title` 可等价替换；信息块走 `#header-extra` | 退化为薄包装（仅 3 行 CSS）→ §7.4.1 以“契约边界 + 禁止生长”约束 |
| 2 | `QueryPanel.vue` | `QueryListQueryPanel.vue` | `KEEP_FOR_FIRST_IMPLEMENTATION` | 三个查询页（DSS / topic-offset / log-query）都有“N 个字段组 + 操作按钮同处一行、整体换行”的形态；字段组**作为整体换行**、操作组**不被拆散**是需要被固定下来的契约 | 是 | `.dss-card.dss-query-card` + `.dss-query-bar` 的 flex 换行 | topic-offset 无卡片，可通过 `variant` 与令牌降为无底色 | 把 `el-form :inline`（log-query）误纳入 → 组件只提供流式容器，不强制表单机制 |
| 3 | `QueryActions.vue` | `QueryListActions.vue` | `KEEP_FOR_FIRST_IMPLEMENTATION` | 固定宽度 62/62 + 四值同锁 + 常驻指示器 + 独立居中文字节点，是**几何稳定契约**的载体；若由调用方自行提供按钮则契约无法保证 | 是 | `.dss-q-actions` / `.dss-query-btn` / `.dss-reset-btn` / `.dss-btn-spinner` | topic-offset 现在是裸 `el-button`（无锁宽、`:loading` 默认指示器），可获得与参考页面同级的稳定性 | 非标准文案被机械套用 `62px` → §7.4.3 规定必须显式给定宽度 |
| 4 | `ResultPanel.vue` | `QueryListResultPanel.vue` | `KEEP_FOR_FIRST_IMPLEMENTATION` | 结果卡片头部（`space-between` + `flex-wrap` + `gap:12px 16px`）与**预留高度错误槽**（`min-height:22px`）是几何稳定的关键设施，且与业务无关 | 是 | `.dss-card.dss-result-card` + `__header` / `__divider` / `__body` + `.dss-result-error-slot` | topic-offset 的 `.toff-toolbar` 可等价替换，并获得预留错误槽 | Slot 过宽导致壳化 → §7.4.4 限定 4 个槽 |
| 5 | `RefreshToolbar.vue` | `QueryListRefreshToolbar.vue` | `KEEP_FOR_FIRST_IMPLEMENTATION` | 承载第二处几何稳定机制（110px + 常驻指示器 + `2ch` 秒槽 + 常量占位时间槽 + 不可拆散组）；纯展示，无状态机 | 是 | `DataSourceSnapshotToolbar.vue` 全部 | topic-offset 可获得固定宽度与定宽时间槽；**无自动刷新的页面不传倒计时即可不渲染该段** | Props 过多 / 强制倒计时 → §7.4.5 以 `countdown: null` 表示“本页无自动刷新” |
| 6 | `StableTableContainer.vue` | ——（并入 `QueryListResultPanel.vue` 的 `#body`） | `MERGE_INTO_ANOTHER_COMPONENT` | 源码核验：参考实现对应物 `.dss-table-wrap` **仅** `width:100%; overflow-x:auto` 两条声明，无独立契约、无可配置项；单独成组件属薄包装 | 否（并入 #4） | `.dss-table-wrap` | 无独立价值；作为结果面板正文区默认样式已足够 | 业务列宽（`min-width:1175px`）被误并入公共层 → §7.4.4 明确列宽留 Feature |
| 7 | `SingleTooltip.vue` | `QueryListTooltipHost.vue` + `useQueryListTooltip.ts` | `KEEP_FOR_FIRST_IMPLEMENTATION` | 参考实现已有完整机制（Host + composable + 锚点定位），且存在**两处同类实现**必须收敛；对应组件是“同屏最多 1 个”的唯一承载者 | 是 | `tooltip/SnapshotTooltipHost.vue` + `tooltip/useSnapshotTooltip.ts` + `tooltip/tooltipPosition.ts` | topic-offset 未来若需要长文本 Tooltip，可直接复用；当前用原生 `title`，不冲突 | 把指针跟随算法强行并入 → §7.6.2 明确只统一锚点矩形算法与单实例语义 |
| 8 | `useAppliedQuery` | `useQueryListAppliedQuery` | `DEFER_UNTIL_SECOND_CONSUMER` | 参考实现的 `appliedCriteria`/`hasSuccess` 内嵌于 `useDataSourceSnapshot.ts`；对照页面把生效条件放在 **Pinia store**。两者**状态归属模型不同**；阶段一抽取须同时改写已接受页面的状态机 | 否 | `useDataSourceSnapshot.ts` 的 `appliedCriteria`/`hasSuccess`/`commitSuccess` + `utils/selection.ts` | 接口已完整设计（§7.8.4）；第二个消费者出现后再抽取 | 抽取即重写已验收页面 → 见 §7.11 偏离说明与 §7.12 判定面 |
| 9 | `useSingleFlightRequest` | `useQueryListSingleFlightRequest` | `DEFER_UNTIL_SECOND_CONSUMER` | 参考实现为“`requestKind` 六类派生视觉 + `busy` 门禁 + `latestSeq` 令牌 + `pendingVisibilityRefresh` 联动 + 定时器耦合”；对照页面为“`acceptedSeq` + 最新用户意图槽位 + 候选串行 await”。**两者是不同状态机**，共同内核需在双消费者下才能验证 | 否 | `useDataSourceSnapshot.ts` 的 `launch`/`run`/`onRequestFinally` | 接口已完整设计（§7.8.5） | 抽取范围过大，等价性判定面不可控 |
| 10 | `useVisibleAutoRefresh` | `useQueryListVisibleAutoRefresh` | `DEFER_UNTIL_SECOND_CONSUMER` | 参考实现为 `setTimeout` 单一 deadline + 1s 投影秒表 + 隐藏冻结 + 恢复一次性补发；对照实现为 `setInterval` + `lastFailedCriteria`，**且无倒计时投影**。两者时钟模型与恢复策略不同 | 否 | `useDataSourceSnapshot.ts` 的 `scheduleNext` / `refreshCountdownDisplay` / `freezeCountdown` / `visibilityChanged` | 接口已完整设计（§7.8.6） | 抽取会改动已验收的倒计时与补发语义 |

### 6.2 计数与覆盖

`SHARED_COMPONENT_DESIGN_DECISION_DRAFT`：

```text
candidate_component_count=10
keep_for_first_implementation_count=6
merge_into_another_component_count=1
defer_until_second_consumer_count=3
reject_as_unnecessary_abstraction_count=0
sum_count=10
candidate_decision_coverage_status=COMPLETE_ALL_10_CANDIDATES_DECIDED
```

### 6.3 与推荐方向的差异说明（不机械照抄）

`SHARED_COMPONENT_DESIGN_DECISION_DRAFT` —— 本轮结论与已批准基线中的
推荐方向基本一致，但有**一处明确偏离**，理由如下：

**偏离项**：基线文档把“稳定表格容器”列为展示组件层的一个独立候选项；
本轮源码核验后结论为 `MERGE_INTO_ANOTHER_COMPONENT`。

**证据**：参考实现对应物 `.dss-table-wrap` 在
`DataSourceSnapshotTable.vue` 中**只有两条声明**（`width:100%`、`overflow-x:auto`），
既无可配置项，也无独立行为；对照页面 `OffsetTable.vue` **根本没有**该外层容器。

**权衡**：把它单独成组件会产出一个“只套一层 div + 两条 CSS”的薄包装，
违反“不得伪造复用”的原则；而把它并入结果面板正文区，
既保留了横向溢出能力，又让结果面板的“头部 / 提示 / 分隔 / 正文”四段成为一个完整契约。

**残余风险与缓解**：并入后，正文区默认 `overflow-x:auto` 会作用于所有使用者；
缓解方式是该默认行为以令牌开放（`--ql-result-body-overflow-x`），
不使用横向滚动的页面可显式设为 `visible`。

**其余九项**：与推荐方向一致，且每项的结论都已在 §6.1 中给出源码级证据，
不是对推荐方向的复述。

---

## 7.3 最终建议的目录结构与命名

### 7.3.1 建议结构

`SHARED_COMPONENT_DESIGN_DECISION_DRAFT`：

```text
frontend/src/components/query-list/
├── QueryListPageShell.vue
├── QueryListQueryPanel.vue
├── QueryListActions.vue
├── QueryListResultPanel.vue
├── QueryListRefreshToolbar.vue
├── QueryListTooltipHost.vue
├── types.ts                     # 公共类型（供调用方与测试引用）
└── index.ts                     # 统一导出（可选，见 §7.3.4）

frontend/src/composables/query-list/
└── useQueryListTooltip.ts       # 单实例 Tooltip 控制器
```

未列出的文件**不得**在阶段一创建。特别注意：

- 三个被延后的行为 Composable（`useQueryListAppliedQuery` /
  `useQueryListSingleFlightRequest` / `useQueryListVisibleAutoRefresh`）
  **不得**创建占位文件、**不得**以空壳或仅类型文件的形式伪装成阶段一产物；
  它们的接口只存在于**本文件**§7.8；
- `.spec.ts` 测试文件按阶段一实现任务的需要创建，**本设计任务不创建任何测试文件**。

### 7.3.2 命名规则

`SHARED_COMPONENT_DESIGN_DECISION_DRAFT`：

| 对象 | 规则 | 示例 |
| --- | --- | --- |
| 目录 | 小写 kebab-case，领域名 | `query-list` |
| 组件文件 | PascalCase `.vue`，`QueryList` 前缀 | `QueryListResultPanel.vue` |
| Composable 文件 | `use` + PascalCase，`useQueryList` 前缀 | `useQueryListTooltip.ts` |
| 公共类型 | 同一 `QueryList` 前缀 + 语义后缀 | `QueryListTooltipTarget` |
| CSS 类名 | `ql-` 前缀 + BEM 式双下划线 | `ql-result-panel__header` |
| CSS 自定义属性 | `--ql-` 前缀 | `--ql-page-gap` |
| 事件名 | 小写单词动词，不冒泡语义 | `query`、`reset`、`refresh` |

`QueryList` 前缀的必要性：本仓库已有 6 个页面私有组件目录，
`frontend/src/components/` 下同时存在通用组件（`PlaceholderPage.vue`）与
领域组件（`monitor/ClientCard.vue`）；显式前缀可在搜索与代码审查时
一眼区分“查询列表页公共层”与“页面私有组件”，避免与
`DataSourceSnapshot*` / `Offset*` / `LogQuery*` 命名空间混淆。

### 7.3.3 为什么新增 `frontend/src/composables/query-list/`

`SHARED_COMPONENT_DESIGN_DECISION_DRAFT` —— 源码核验显示
`frontend/src/composables/` **当前不存在**，4 个 Composable 全部位于各自
页面的 `views/*/composables/` 下。新增顶层 `composables/` 的理由：

1. 公共 Composable 不属于任何页面，放在 `views/` 下会在语义上错误归因；
2. 阶段一只有**一个**公共 Composable（`useQueryListTooltip`），
   若与组件同放 `components/query-list/` 会混淆“组件”与“逻辑”两种产物类型；
3. 顶层 `composables/` 是 Vue 生态的通行惯例，成本低、可发现性高。

若项目负责人认为应避免新增顶层目录，替代方案是把
`useQueryListTooltip.ts` 放在 `components/query-list/` 内并同时在
`index.ts` 导出——两种方案**不得同时存在**。本设计**推荐**方案为
新增 `frontend/src/composables/query-list/`。

### 7.3.4 为什么没有超级组件，也没有薄包装

`SHARED_COMPONENT_DESIGN_DECISION_DRAFT`：

- **没有超级组件**：`QueryListPageShell` 只持骨架与留白，
  `QueryListQueryPanel` 只持查询区容器，`QueryListResultPanel` 只持结果区容器，
  三者互不嵌套、互不依赖；任何组件都**不**知道查询字段、接口、参数或列定义。
  页面通过**平铺组合**这四个组件构成三段式结构，而不是套一层“万能页面组件”。
- **没有薄包装**：唯一被判定为薄包装的候选项（稳定表格容器）
  已按 §6.3 合并进结果面板，而不是保留一层空壳；
  其余六项保留的组件，每一项都至少承载了**一个可被断言的不变量**
  （骨架间距 / 字段组整体换行与操作组不拆散 / 固定宽度与常驻指示器 /
  预留错误槽与头部换行 / 不可拆散刷新组与定宽时间槽 / 同屏最多 1 个 Tooltip）。

---

## 7.4 各组件的完整公共契约

`SHARED_COMPONENT_DESIGN_DECISION_DRAFT` —— 以下 TypeScript 接口为**设计草案**，
用于固定契约语义，**不得**被视为已存在的类型定义。
类型中的注释即语义约定；默认值即“调用方不传时的行为”。

### 7.4.1 `QueryListPageShell.vue`

**职责**：页面外壳。渲染页头（标题 + 可选描述 + 可选补充区）与页面主体的纵向间距，
业务零知识。

```ts
/** 页面外壳。不持有任何业务状态；无内建请求行为。 */
interface QueryListPageShellProps {
  /** 页面标题。空字符串且未提供 #header 时，页头区不渲染（供未来无标题页面使用）。 */
  title?: string
  /**
   * 页面描述。未提供或为空时不渲染描述行；不注入任何业务文案。
   * 提供 #description 槽时以槽为准。
   */
  description?: string
}

interface QueryListPageShellSlots {
  /** 标题行整体替换（逃生舱）。使用后调用方自行负责排版一致性。 */
  header?: () => unknown
  /** 描述行替换（不替换标题）。 */
  description?: () => unknown
  /** 页头下方的补充内容（例如信息提示块）。位于描述之后、主体之前。 */
  'header-extra'?: () => unknown
  /** 页面主体。调用方在其中平铺查询面板与结果面板。 */
  default?: () => unknown
}

interface QueryListPageShellEmits {
  // 无
}
```

| 契约项 | 内容 |
| --- | --- |
| 渲染结构 | `div.ql-page > (header.ql-page__header > (title, description, extra)) + div.ql-page__body > slot` |
| 默认值 | `title = ''`、`description = ''`；均空且无 `#header` → 不渲染 `header` 节点 |
| 暴露方法 | **无**（不 `defineExpose`） |
| 拥有 | **页面内层内边距**（`padding`）、页面圆角与背景、页面段落纵向间距，以及页头标题/描述的排版与配色——参考实现的 `.dss-page` **自带**这些值 |
| 不拥有 | **外层**布局内边距（属 `MainLayout` 的 `.content-area`，与页面壳内层 padding 是两层事实）；查询字段；卡片视觉（属面板组件）；任何请求与状态 |
| 必需 Props | 无 |
| Slot 必需性 | 全部可选；`default` 为唯一实际必需内容 |

**CSS 契约**（`--ql-*` 的默认值**取参考实现现状值**，可被调用方覆盖）：

```text
--ql-page-gap               默认 12px            页面段落纵向间距
--ql-page-padding           默认 14px 16px       页面内层内边距（参考实现 `.dss-page` 现状值）
--ql-page-radius            默认 10px            页面圆角
--ql-page-background        默认 transparent     页面背景

--ql-title-margin           默认 0               标题外边距
--ql-title-size             默认 20px            标题字号
--ql-title-weight           默认 650             标题字重
--ql-title-letter-spacing   默认 -0.01em         标题字距
--ql-title-color            默认 #09090b         标题色（参考实现 `--dss-text` 现状值）

--ql-desc-margin            默认 4px 0 0         描述外边距
--ql-desc-size              默认 13px            描述字号
--ql-desc-color             默认 #71717a         描述色（参考实现 `--dss-text-muted` 现状值）
--ql-desc-line-height       默认 1.5             描述行高
```

**不得以“调用方以后可以覆盖”为由保留错误默认值**：上述值就是参考实现现状值，
必须作为阶段一默认值直接采用。页面壳的内层 `padding:14px 16px` **不能**由
`MainLayout .content-area` 的外层 `padding:16px 20px` 替代（见 §7.2.1）。

**可访问性契约**：`.ql-page__title` 使用 `<h2>`（与参考实现一致），
页面主标题层级不改变；`#header-extra` 内容的语义由调用方负责（例如 `role="note"`）。

**为什么必须限制成长**：该组件是最容易退化为超级组件的候选项。
阶段一约束为**只接受上表 Props/Slots**；后续若出现“加一个 prop 就能少写一个页面”
的需求，必须另立任务评估，不得在本组件内扩张。

### 7.4.2 `QueryListQueryPanel.vue`

**职责**：查询条件区容器。提供字段组的**流式换行**区域与**操作区位置**，
并提供可选的嵌入式卡片视觉。

```ts
interface QueryListQueryPanelProps {
  /**
   * 视觉变体。'card' = 嵌入式卡片（参考实现现状：背景 #F4F4F5 / 圆角 8px / 无阴影 / padding 10px 16px）；
   * 'plain' = 透明（无背景无圆角），供无卡片页面使用。
   * 默认 'card'。
   */
  variant?: 'card' | 'plain'
}

interface QueryListQueryPanelSlots {
  /** 字段组。调用方自行放入 .ql-q-group 或任意等价结构。 */
  default?: () => unknown
  /**
   * 操作区。渲染在字段组之后的同一流中。
   * 查询/重置两个按钮在操作组内部**永不拆散**；操作组作为**一个** flex item，
   * 在容器宽度不足时**允许整体换到下一行**。
   */
  actions?: () => unknown
}

interface QueryListQueryPanelEmits {
  // 无
}
```

| 契约项 | 内容 |
| --- | --- |
| 渲染结构 | `div.ql-q-panel(.ql-q-panel--plain)? > div.ql-q-panel__flow > slot + slot[name=actions]` |
| 换行契约 | 字段组**整体换行**（每个字段组自身 `flex: 0 0 auto`，内部 `inline-flex` 且不换行）；`.ql-q-panel__flow` 为 `flex-wrap: wrap` |
| 操作组契约 | `.ql-q-panel__actions` 为 `flex: 0 0 auto`（**内部两个按钮永不拆散、不可被压缩**）；操作组作为**一个** flex item，在容器宽度不足时**允许整体换到下一行** |
| 暴露方法 | **无** |
| 不拥有 | 字段的标签、控件、宽度、候选来源；操作按钮本体（由 `QueryListActions` 或调用方提供）；任何请求 |
| 必需 Props | 无（`variant` 默认 `'card'`） |

**CSS 契约**：

```text
--ql-q-panel-gap           默认 8px 14px   字段组之间的行列间距
--ql-q-panel-padding       默认 10px 16px  仅 variant='card' 生效
--ql-q-panel-bg            默认 #F4F4F5    仅 variant='card' 生效；'plain' 下置为 transparent
--ql-q-panel-radius        默认 8px
--ql-q-group-control-width 默认 不定义     字段控件宽度属 Feature，公共层不设默认值
```

**明确不设置**：控件宽度（参考实现的 `240px` / `300px` / `200px` 是
该 Feature 的字段宽度，**不是**模板值，公共层不得提供默认宽度）。

**可访问性契约**：字段组的标签关联由调用方负责（`<label>` 或 `aria-label`）；
本组件不生成任何 `label`，不接管焦点。

### 7.4.3 `QueryListActions.vue`

**职责**：“查询 / 重置”操作区，并**由本组件渲染两个按钮本体**，
以保证固定宽度与 Loading 几何稳定契约不被调用方的自定义按钮破坏。

```ts
interface QueryListActionsProps {
  /** 查询按钮文案。默认 '查询'。 */
  queryText?: string
  /** 重置按钮文案。默认 '重置'。 */
  resetText?: string
  /**
   * 查询按钮固定宽度（px）。默认 62。
   * 非标准文案（字数 ≠ 2 的中文，或含图标/多词英文）时调用方**必须**显式给定
   * 实测或约定的宽度；本组件**不**做任何自动宽度计算或测量。
   */
  queryWidthPx?: number
  /** 重置按钮固定宽度（px）。默认 62。非标准文案同上。 */
  resetWidthPx?: number
  /** 仅“查询”按钮显示 Loading 指示器。默认 false。 */
  queryLoading?: boolean
  /** 任一实际请求在途：两个按钮均被功能阻断。默认 false。 */
  busy?: boolean
  /**
   * 可选的显式高度（px）。**本属性没有公共默认值**：未传时公共组件**不输出**
   * 任何 `height` 样式，也不能被解释为模板高度基线（见 §7.5.4）。
   * 参考页面阶段一等价接入时**显式传入 `30`**，以继承参考实现现状值、保持零像素变化。
   */
  heightPx?: number
}

interface QueryListActionsEmits {
  /** 查询按钮被激活（点击 / Enter / Space）且未被阻断。 */
  query: []
  /** 重置按钮被激活且未被阻断。 */
  reset: []
}
```

| 契约项 | 内容 |
| --- | --- |
| 渲染结构 | `div.ql-actions > (el-button.ql-actions__query[primary] > span.ql-btn-spinner + span.ql-action-label) + (el-button.ql-actions__reset > span.ql-action-label)` |
| 按钮本体的唯一结论 | **由本组件渲染查询与重置两个按钮**。理由：固定宽度四值同锁、常驻指示器、独立居中文字节点三者必须同时成立才构成几何稳定契约；若由调用方提供按钮，契约无法保证 |
| 宽度锁定 | 查询与重置按钮均 `width / min-width / max-width / flex-basis` 四值同锁为各自 `*WidthPx`，`flex-grow:0; flex-shrink:0; box-sizing:border-box` |
| 指示器 | 常驻 DOM 节点，默认 `opacity:0; visibility:hidden`；`queryLoading` 时置为可见。仅切换这两个属性，**不增删节点、不改尺寸** |
| 指示器颜色 | `border: 2px solid currentColor` + `border-top-color: transparent`——**继承按钮文字色**，公共层**不得**硬编码任何颜色，以保证参考实现的“深色查询按钮上的白色指示器”与“白色刷新按钮上的深灰指示器”同时成立 |
| 指示器偏移 | 由 `--ql-btn-spinner-inset` 提供，默认 `2px`；参考实现的刷新按钮沿用其历史值 `3px`（见 §7.5.5） |
| 阻断语义 | `busy` 时两个按钮均加 `aria-disabled="true"`，点击处理函数**入口处直接返回**，**外观不变**（不置灰、不改变几何） |
| 禁用策略 | 仅“被功能阻断”，**不使用** `disabled` 属性（避免 Element Plus 的禁用态改变外观与几何） |
| 暴露方法 | **无** |
| 不拥有 | “重置是否触发查询”的策略（默认只发 `reset` 事件，是否查询由调用方决定，与参考实现“重置不查询”一致）；请求本身；错误文案 |
| 必需 Props | 无 |
| Emits 触发时机 | `query`：查询按钮 `click` 且 `!busy`；`reset`：重置按钮 `click` 且 `!busy`。两者均不在 `busy` 时触发 |
| 换行口径（唯一表述） | 查询/重置两个按钮在操作组内部**永不拆散**；操作组作为**一个** flex item，在容器宽度不足时**允许整体换到下一行** |

**非标准文案规则**（对应模板 UI §2.7）：

1. 默认 `62px` **只**适用于 2 个中文字的“查询 / 重置”；
2. 其他文案必须显式传入 `queryWidthPx` / `resetWidthPx`；
3. 公共层**不得**提供任何自动测量、自动拉伸或内容自适应宽度；
4. 若同一页面两个按钮需要不同宽度，各自独立传入。

**CSS 契约**：

```text
--ql-actions-gap                 默认 8px            两按钮间距
--ql-actions-radius              默认 6px            两按钮圆角
--ql-actions-font-weight         默认 500            两按钮字重
--ql-actions-query-bg            默认 #09090b        查询按钮底色
--ql-actions-query-border        默认 #09090b        查询按钮边框色（与底色同值）
--ql-actions-query-fg            默认 #ffffff        查询按钮文字色
--ql-actions-query-bg-hover      默认 #27272a        查询按钮 hover/focus 底色
--ql-actions-query-border-hover  默认 #27272a        查询按钮 hover/focus 边框色
--ql-actions-query-fg-hover      默认 #ffffff        查询按钮 hover/focus 文字色
--ql-actions-query-padding       默认 0 16px         查询按钮水平内边距
--ql-actions-reset-bg            默认 #e4e4e7        重置按钮底色
--ql-actions-reset-border        默认 transparent    重置按钮边框色
--ql-actions-reset-fg            默认 #3f3f46        重置按钮文字色
--ql-actions-reset-bg-hover      默认 #d9d9dd        重置按钮 hover/focus 底色
--ql-actions-reset-border-hover  默认 transparent    重置按钮 hover/focus 边框色
--ql-actions-reset-fg-hover      默认 #3f3f46        重置按钮 hover/focus 文字色
--ql-actions-reset-padding       默认 0 14px         重置按钮水平内边距
--ql-btn-spinner-inset           默认 2px            Spinner 左偏移（见 §7.5.5）
（按钮高度不设令牌；由**可选** heightPx prop 表达，公共层无默认高度，见 §7.5.4）
```

样式规则（均为组件 scoped 内的 `ql-` 命名空间）：

```text
.ql-actions                  display:inline-flex; align-items:center; gap:var(--ql-actions-gap,8px); flex:0 0 auto
.ql-actions .ql-actions__query / __reset
                             width / min-width / max-width / flex-basis 四值同锁；flex-grow:0; flex-shrink:0; box-sizing:border-box
.ql-actions__query           背景 var(--ql-actions-query-bg,#09090b)；
                             边框 1px solid var(--ql-actions-query-border,#09090b)；
                             文字 var(--ql-actions-query-fg,#ffffff)；
                             字重 var(--ql-actions-font-weight,500)；圆角 var(--ql-actions-radius,6px)；
                             padding var(--ql-actions-query-padding,0 16px)
.ql-actions__query:hover / :focus-visible
                             背景 var(--ql-actions-query-bg-hover,#27272a)；
                             边框 1px solid var(--ql-actions-query-border-hover,#27272a)；
                             文字 var(--ql-actions-query-fg-hover,#ffffff)
.ql-actions__reset           背景 var(--ql-actions-reset-bg,#e4e4e7)；
                             边框 1px solid var(--ql-actions-reset-border,transparent)；
                             文字 var(--ql-actions-reset-fg,#3f3f46)；
                             字重 var(--ql-actions-font-weight,500)；圆角 var(--ql-actions-radius,6px)；
                             padding var(--ql-actions-reset-padding,0 14px)
.ql-actions__reset:hover / :focus-visible
                             背景 var(--ql-actions-reset-bg-hover,#d9d9dd)；
                             边框 1px solid var(--ql-actions-reset-border-hover,transparent)；
                             文字 var(--ql-actions-reset-fg-hover,#3f3f46)
.ql-action-label             white-space:nowrap（独立固定居中文字节点）
.ql-btn-spinner              见 §7.5.3；颜色一律 currentColor，公共层不硬编码
```

上述全部色值由公共 `--ql-*` 令牌承载并在组件 scoped 内声明，
**不依赖 Element Plus 默认主题碰巧相同**，也**不得**通过 `.dss-*` 选择器
从外部穿透覆盖（含 `:hover` / `:focus-visible` 两态）。

**可访问性契约**：`queryLoading` 时按钮 `aria-busy="true"`；指示器节点
`aria-hidden="true"`；文字节点内容在四态（空闲 / Loading / 成功 / 失败）下
**恒定不变**；键盘 Enter / Space 与焦点行为由 `el-button` 原生提供。
查询按钮的 `type="primary"` **仅供 `el-button` 内部语义使用**，其全部视觉由
上表 `--ql-*` 令牌显式钉死（含 `:hover` / `:focus-visible`），
**不得**依赖 Element Plus 默认主题色（见 §7.9.5 的深度选择器限制）。

### 7.4.4 `QueryListResultPanel.vue`

**职责**：结果区卡片容器。提供头部（左摘要 + 右工具栏）、可选提示槽（**预留高度**）、
分隔与正文区（含横向溢出能力，已并入原“稳定表格容器”候选项）。

```ts
interface QueryListResultPanelProps {
  /** 左侧摘要文本（例如 “共 N 条”）。为空且无 #summary 槽时不渲染左区。 */
  summaryText?: string
  /** 内联收敛提示文本（例如刷新失败提示）。为空时不渲染提示内容，但**槽位高度保留**。 */
  errorText?: string
  /** 视觉变体。'card' = 结果卡片（参考实现现状）；'plain' = 无卡片。默认 'card'。 */
  variant?: 'card' | 'plain'
}

interface QueryListResultPanelSlots {
  /** 头部左区替换。 */
  summary?: () => unknown
  /** 头部右区（例如 QueryListRefreshToolbar）。 */
  toolbar?: () => unknown
  /** 提示槽内容替换（仍处于预留高度容器内）。 */
  error?: () => unknown
  /** 正文区。业务表格连同其列定义、分页、空状态文案一并放入。 */
  body?: () => unknown
}

interface QueryListResultPanelEmits {
  // 无
}
```

| 契约项 | 内容 |
| --- | --- |
| 渲染结构 | `div.ql-result-panel(.ql-result-panel--plain)? > header.ql-result-panel__header > (div.ql-result-panel__summary + div.ql-result-panel__toolbar) + div.ql-result-panel__error-slot + div.ql-result-panel__divider + div.ql-result-panel__body > slot[body]` |
| 头部契约 | `display:flex; align-items:center; justify-content:space-between; gap:12px 16px; flex-wrap:wrap`——**整组换行**，右区不被拆散 |
| 提示槽契约 | `min-height: 22px`——**预留高度**，提示出现/消失均不改变后续内容坐标。这是参考实现的关键几何设施，必须保留 |
| 分隔线契约 | `height:1px; background:var(--ql-result-panel-divider-color,#f0f0f1); margin:var(--ql-result-panel-divider-margin,0 16px); flex:0 0 auto`——固定 `1px` 分隔线，位于**提示槽之后、正文之前**，DOM 顺序不可调整。其中 `flex:0 0 auto` 是设计层的**显式刚性声明**：参考实现的该容器为纵向 flex，该声明在参考结构下行为等价、不改变任何像素，属**设计新增的加固**而非参考实现原文 |
| 正文区契约 | `width:100%; min-width:0; box-sizing:border-box; padding:var(--ql-result-panel-body-padding,10px 16px 14px); overflow-x:var(--ql-result-body-overflow-x,auto)`（合并自原“稳定表格容器”候选项） |
| 暴露方法 | **无**（不 `defineExpose`；参考页面通过查询栏的 `defineExpose({ reset })` 暴露重置，属调用方自有能力，不由本组件承载） |
| 不拥有 | 表格列定义与列宽；分页控件与页大小；空状态业务文案；Loading 指令（正文区内的业务表格自行使用 `v-loading`，以保持参考实现的既有视觉完全不变）；任何请求 |
| 必需 Props | 无 |

**CSS 契约**：

```text
--ql-result-panel-bg              默认 #FFFFFF
--ql-result-panel-radius          默认 10px
--ql-result-panel-shadow          默认 0 1px 2px rgba(9,9,11,.04), 0 1px 3px rgba(9,9,11,.03)
--ql-result-panel-header-padding  默认 12px 16px 2px
--ql-result-panel-header-gap      默认 12px 16px
--ql-result-panel-error-min-height 默认 22px
--ql-result-panel-error-padding   默认 0 16px
--ql-result-panel-divider-height   默认 1px
--ql-result-panel-divider-color    默认 #f0f0f1
--ql-result-panel-divider-margin   默认 0 16px
--ql-result-panel-body-padding     默认 10px 16px 14px
--ql-result-panel-body-min-width   默认 0
--ql-result-body-overflow-x        默认 auto
```

**样式规则**（均为组件 scoped 内的 `ql-` 命名空间）：

```text
.ql-result-panel                   variant='card' 时取 --ql-result-panel-bg / radius / shadow
.ql-result-panel__header           display:flex; align-items:center; justify-content:space-between;
                                   gap:var(--ql-result-panel-header-gap,12px 16px); flex-wrap:wrap;
                                   padding:var(--ql-result-panel-header-padding,12px 16px 2px)
.ql-result-panel__summary          flex:0 1 auto; min-width:0
.ql-result-panel__toolbar          flex:0 0 auto（右区不可拆散，整组随头部换行）
.ql-result-panel__error-slot       min-height:var(--ql-result-panel-error-min-height,22px);
                                   padding:var(--ql-result-panel-error-padding,0 16px);
                                   display:flex; align-items:center
.ql-result-panel__divider          height:var(--ql-result-panel-divider-height,1px);
                                   background:var(--ql-result-panel-divider-color,#f0f0f1);
                                   margin:var(--ql-result-panel-divider-margin,0 16px);
                                   flex:0 0 auto
.ql-result-panel__body             width:100%; min-width:var(--ql-result-panel-body-min-width,0);
                                   box-sizing:border-box;
                                   padding:var(--ql-result-panel-body-padding,10px 16px 14px);
                                   overflow-x:var(--ql-result-body-overflow-x,auto)
```

**可访问性契约**：

| 项 | 规则 |
| --- | --- |
| 头部语义 | 头部为 `header` 元素；不赋予 `role="alert"`（提示槽不作为告警区，`role="alert"` 属整区错误态，由 Feature 页面壳决定） |
| 提示槽 | 提示文本可为空；为空时**不渲染文本节点**，但容器与 `min-height` **保留**（几何稳定优先，且空容器不被读屏朗读） |
| 表格语义 | 表格的表头/单元格语义、`aria-*` 属性由正文区内的业务表格（Feature）负责，公共层不介入 |
| 摘要 | 摘要文本随结果变化时，公共层**不**主动设置 `aria-live`（避免打断读屏）；如需播报，由 Feature 显式决定 |
| 焦点 | 面板不获取焦点、不拦截键盘事件、不设置 `tabindex` |

**明确留在 Feature**：表格 `min-width`（参考实现的 `1175px` 是列宽之和）、
列定义、`el-table` 的视觉覆盖变量、表头/单元格内边距调整、状态标签组件。

### 7.4.5 `QueryListRefreshToolbar.vue`

**职责**：结果区右侧**不可拆散的刷新逻辑组**：
倒计时环 → `N 秒后自动刷新` → 分隔符 → `最近成功刷新：HH:mm:ss` → 立即刷新按钮。

```ts
interface QueryListCountdown {
  /** 剩余秒数（60→0）；null 表示当前无已安排周期（显示占位 --）。 */
  seconds: number | null
  /** 剩余比例（1→0）；null 表示无已安排周期（环为空）。 */
  progress: number | null
}

interface QueryListRefreshToolbarProps {
  /**
   * 倒计时投影。传 null 表示**本页不使用自动刷新**：
   * 倒计时环、秒数文本与分隔符**整体不渲染**（不是显示 --）。
   * 这与“有自动刷新但当前无已安排周期”（seconds:null）是两种不同语义。
   */
  countdown: QueryListCountdown | null
  /** 最近成功刷新时间文案；从未成功传 '--'。默认 '--'。 */
  lastRefreshText?: string
  /** 时间前缀标签。默认 '最近成功刷新：'。 */
  lastRefreshLabel?: string
  /** 仅“立即刷新”按钮显示 Loading 指示器。默认 false。 */
  manualLoading?: boolean
  /** 任一实际请求在途：立即刷新被功能阻断。默认 false。 */
  busy?: boolean
  /** 按钮文案。默认 '立即刷新'。 */
  refreshText?: string
  /** 按钮固定宽度（px）。默认 110。非标准文案必须显式传入。 */
  refreshWidthPx?: number
}

interface QueryListRefreshToolbarEmits {
  /** 立即刷新按钮被激活且未被阻断。 */
  refresh: []
}
```

| 契约项 | 内容 |
| --- | --- |
| 渲染结构 | `div.ql-refresh-group > (svg.ql-countdown-ring)? + (span.ql-countdown-text)? + (span.ql-refresh-sep)? + span.ql-refresh-time + el-button.ql-refresh-btn` |
| 不可拆散 | 整组 `display:inline-flex; align-items:center; gap:8px; flex:0 0 auto; white-space:nowrap`；窄宽度下由外层结果面板头部**整组换行** |
| 秒数槽 | `width / min-width / max-width / flex-basis` 四值同锁 `2ch` + `text-align:right` + `font-variant-numeric: tabular-nums`；`60 / 59 / 10 / 9 / 0 / --` 盒宽恒定 |
| 时间值槽 | 相对定位 `inline-block` 容器内：**常驻不可见常量占位** `88:88:88`（`visibility:hidden` + `aria-hidden="true"`）决定槽宽；真实值绝对定位于槽左上。**槽宽不随时间字符串变化** |
| 环 | 16px，`viewBox="0 0 16 16"`，`r=6.5`，`stroke-dasharray` = 周长；只改 `stroke-dashoffset`；`aria-hidden="true"`（装饰性） |
| 按钮 | 固定宽度四值同锁；白底细边框次级视觉（`#FFFFFF` / `1px solid #E4E4E7` / 文字 `#3F3F46` / 圆角 6px）；`focus-visible` 焦点环；常驻指示器 |
| 三态几何稳定 | 空闲 / Loading / 成功态下按钮外框与前方文案、后方元素坐标**均不变** |
| 暴露方法 | **无** |
| 不拥有 | 自动刷新周期数值；是否启用自动刷新（由是否传 `countdown: null` 表达）；请求本身；左侧摘要（属结果面板头部左区） |
| 必需 Props | `countdown`（**必填但允许为 `null`**） |

**`countdown` 的三态语义（唯一结论：必填但可为 `null`）**：

| 取值 | 含义 | 渲染 |
| --- | --- | --- |
| `null` | 该页面**不使用自动刷新** | 倒计时环、秒数文本与分隔符**整体不渲染**（不是显示 `--`） |
| `{seconds:null, progress:null}` | 页面**具备**自动刷新能力，但当前**没有已安排周期** | 环为空、秒数显示占位 `--` |
| object with values | 有已安排周期 | 显示当前投影 |

因此页面**必须显式传入** `countdown` 以表达自身意图，但**允许传 `null`**；
页面无需为无自动刷新的场景伪造 `60`、`--` 或任意占位值。

**CSS 契约**：

```text
--ql-refresh-group-gap       默认 8px                    逻辑组内间隙
--ql-refresh-sep-color       默认 var(--ql-divider,#f0f0f1)  分隔符色
--ql-refresh-sep-height      默认 14px                   分隔符高
--ql-countdown-size          默认 16px                   环直径
--ql-countdown-track         默认 #e4e4e7                环轨道色
--ql-countdown-progress      默认 #2563eb                环进度色
--ql-countdown-stroke        默认 2                      环线宽
--ql-refresh-btn-width       默认 110px                  按钮固定宽度（refreshWidthPx 的默认值来源）
--ql-btn-spinner-inset       默认 2px                    Spinner 左偏移（见 §7.5.5）
（按钮高度不设令牌，保持 Element Plus 默认，见 §7.5.4）
```

样式规则要点（均为组件 scoped 内的 `ql-` 命名空间）：

```text
.ql-refresh-group       display:inline-flex; align-items:center; gap:var(--ql-refresh-group-gap,8px);
                        flex:0 0 auto; white-space:nowrap; font-size:13px
.ql-countdown-seconds   width / min-width / max-width / flex-basis 四值同锁 2ch；
                        text-align:right; font-variant-numeric:tabular-nums
.ql-refresh-time-value  position:relative; display:inline-block; white-space:nowrap
.ql-refresh-time-reserve  visibility:hidden; font-variant-numeric:tabular-nums（常驻占位，决定槽宽）
.ql-refresh-time-actual   position:absolute; left:0; top:0; white-space:nowrap
.ql-refresh-btn         width / min-width / max-width / flex-basis 四值同锁；position:relative
.ql-btn-spinner         见 §7.5.3；颜色一律 currentColor
```

**可访问性契约**：

| 项 | 规则 |
| --- | --- |
| 环 | `aria-hidden="true"`（纯装饰；进度信息由可见秒数文本承载） |
| 秒数文本 | 常驻可见；`60 / 59 / 10 / 9 / 0 / --` 均被读屏按文本朗读，不额外加 `aria-live`（逐秒播报会打断用户） |
| 常量占位 | `.ql-refresh-time-reserve` 为 `visibility:hidden` + `aria-hidden="true"`（不可见、不朗读、但必须占位） |
| 时间前缀 | 前缀文本与时间值处于同一文本流，读屏可连读为一句 |
| 按钮 Loading | `aria-busy="true"`；指示器 `aria-hidden="true"`；文字节点内容恒定 |
| 被阻断 | `aria-disabled="true"` + 点击入口早退；**外观不变**；**不使用** `disabled` |
| 焦点 | 按钮可见焦点环（参考实现为 `focus-visible` 局部环）；组内其它元素不可聚焦 |

### 7.4.6 `QueryListTooltipHost.vue` + `useQueryListTooltip.ts`

完整机制、时序与关闭规则见 §7.6；本节只列面向调用方的契约摘要。

```ts
interface QueryListTooltipHostProps {
  /** 当前目标；null 时不渲染任何 DOM。 */
  target: QueryListTooltipTarget | null
}
// 无 Slots、无 Emits、无暴露方法。
// 控制器 useQueryListTooltip() 的签名见 §7.6.1。
```

**CSS 契约**：

```text
--ql-tooltip-z-index     默认 3000
--ql-tooltip-max-width   默认 calc(100vw - 16px)   视口安全上限（**始终生效**，见下）
--ql-tooltip-padding     默认 6px 10px
--ql-tooltip-radius      默认 4px
--ql-tooltip-bg          默认 #ffffff
--ql-tooltip-border      默认 1px solid #dcdfe6
--ql-tooltip-shadow      默认 0 2px 12px rgba(0,0,0,.12)
--ql-tooltip-color       默认 #303133
--ql-tooltip-font-size   默认 13px
--ql-tooltip-line-height 默认 1.5
```

样式规则要点：

```text
.ql-tooltip   position:fixed; box-sizing:border-box; width:max-content;
              max-width:var(--ql-tooltip-max-width,calc(100vw - 16px));
              white-space:pre-line; overflow-wrap:anywhere; pointer-events:none
```

**调用方内容上限（`maxWidthPx`）**：统一 Host、控制器与定位算法**不代表**强制统一
所有调用方的内容宽度。当前事实是：

```text
table_tooltip_max_width=calc(100vw - 16px)
query_candidate_tooltip_max_width=min(480px, calc(100vw - 16px))
```

因此宿主支持调用方传入可选内容上限：表格 Tooltip **省略** `maxWidthPx`；
查询候选 Tooltip 传 `480`，最终宽度为 `min(480px, calc(100vw - 16px))`。
详见 §7.6.1 的 `QueryListTooltipShowOptions` 与 §7.6.4。

**可访问性契约**：

| 项 | 规则 |
| --- | --- |
| 语义 | 根元素 `role="tooltip"`；内容对读屏可见（不设 `aria-hidden`） |
| 不可交互 | `pointer-events:none`——不拦截鼠标、不可聚焦、不参与 Tab 序列 |
| 触发可达性 | 控制器不区分触发方式（鼠标 / 焦点 / 程序调用）；是否提供键盘触发由调用方决定（见 §7.6.6） |
| `Escape` | 控制器在页面级关闭事件组内提供 `Escape` 关闭（可绑定开关控制，见 §7.6.6） |
| 全文可读 | 内容优先单行；仅当自然宽度超过安全视口时换行，换行后不横向越界 |
| 无残留 | `target: null` 时不渲染 DOM；销毁时清定时器与状态，不跨路由保留 |

### 7.4.7 契约汇总表

| 组件 | 必需 Props | Slots | Emits | 暴露方法 | 是否渲染业务按钮 |
| --- | --- | --- | --- | --- | --- |
| `QueryListPageShell` | 无 | `header` / `description` / `header-extra` / default | 无 | 无 | 否 |
| `QueryListQueryPanel` | 无 | default / `actions` | 无 | 无 | 否 |
| `QueryListActions` | 无 | 无 | `query` / `reset` | 无 | **是（查询 + 重置）** |
| `QueryListResultPanel` | 无 | `summary` / `toolbar` / `error` / `body` | 无 | 无 | 否 |
| `QueryListRefreshToolbar` | `countdown`（可 `null`） | 无 | `refresh` | 无 | **是（立即刷新）** |
| `QueryListTooltipHost` | `target` | 无 | 无 | 无 | 否 |

**暴露方法的统一结论**：六个组件**一律不提供 `defineExpose`**。
参考页面当前的 `defineExpose({ reset })`（查询栏）与 `defineExpose({ reset, draft })`
（对照页面查询栏）属于**页面自有交互**，公共组件不替代、不承载；
若未来确有跨组件的命令式调用需求，必须另立任务并给出必要性论证。

---

## 7.5 Loading 与按钮固定几何

### 7.5.1 固定宽度值

`SHARED_COMPONENT_DESIGN_DECISION_DRAFT` —— 公共层的默认固定宽度**取参考实现现状值**：

```text
query_button_reference_fixed_width_px=62
reset_button_reference_fixed_width_px=62
refresh_button_reference_fixed_width_px=110
```

三者均为**宽度**，不是高度。锁定方式统一为
`width / min-width / max-width / flex-basis` **四值同锁** +
`flex-grow: 0; flex-shrink: 0; box-sizing: border-box`。

### 7.5.2 几何稳定的三个必要条件

`SHARED_COMPONENT_DESIGN_DECISION_DRAFT`：

1. **按钮外框不变**：四值同锁 + 禁止拉伸/压缩；
2. **文字不移动**：按钮内为 `inline-flex + justify-content:center`，
   文字为**独立固定节点**（`.ql-action-label`），其内容在四态下恒定；
3. **指示器不占位**：指示器为**常驻**节点，`position:absolute` 脱离内容流，
   仅切换 `opacity` / `visibility`。

三者**必须同时成立**。任何只做其中一部分的实现都会在某个状态下产生位移，
因此不得把任一项列为“可选”。

### 7.5.3 统一 Spinner 槽

`SHARED_COMPONENT_DESIGN_DECISION_DRAFT`：

```text
.ql-btn-spinner {
  position: absolute;
  left: var(--ql-btn-spinner-inset, 2px);
  top: 50%;
  width: 12px;
  height: 12px;
  margin-top: -6px;
  box-sizing: border-box;
  border-radius: 50%;
  border: 2px solid currentColor;       /* 颜色继承，公共层不硬编码 */
  border-top-color: transparent;
  opacity: 0;
  visibility: hidden;
  animation: ql-action-spin .6s linear infinite;
}
.ql-btn-spinner.is-visible { opacity: 1; visibility: visible; }
```

规则：

- **颜色一律继承 `currentColor`**，公共层不得声明任何具体色值；
  参考实现的“查询按钮（深底）上白色指示器”与“刷新按钮（白底）上深灰指示器”
  因此都自然成立；
- 尺寸（`12px` / `2px` 边框 / `margin-top:-6px`）为公共层默认值，
  与参考实现两处现状一致；
- `prefers-reduced-motion: reduce` 时 `animation: none`，
  **指示器仍静态可见、几何完全稳定**；
- 指示器**不得**通过 `v-if` / `v-show`（`display:none`）切换——
  `display:none` 会触发重排；只允许切换 `opacity` / `visibility`。

### 7.5.4 按钮高度基线

`SHARED_COMPONENT_DESIGN_DECISION_DRAFT`：

```text
button_height_baseline_status=NOT_DEFINED_NOT_CHANGED
```

事实：参考实现中查询/重置按钮**显式** `height:30px`，立即刷新按钮**未设置高度**
（由 Element Plus 默认值决定），**不存在统一高度基线**；
已批准模板规范明确“本模板不定义、不测量、不修改任何按钮高度基线”。

因此本设计：

1. **不定义**统一高度令牌；
2. `QueryListActions` 的 `heightPx` **没有公共默认值**：未传时公共组件
   **不输出任何 `height` 样式**；参考页面阶段一等价接入时**显式传入 `30`**，
   以继承参考实现现状值、保证零像素变化——该 `30` 是**参考页面调用方**的取值，
   **不是**模板按钮高度基线，**不得**被写作“默认 30”或“模板高度基线”；
3. `QueryListRefreshToolbar` 的按钮**不设置** `height`，保持 Element Plus 默认；
4. 若未来需要统一高度，必须作为**独立的视觉调整任务**处理，
   并且属于参考页面的**展示语义变化**，须走 Feature 调整流程（见 `MIGRATION.md` §4.1）。

### 7.5.5 两处历史偏移值的收敛方式（重要）

`SHARED_COMPONENT_DESIGN_DECISION_DRAFT` —— 事实：参考实现的两套私有实现
`left` 偏移不同（查询按钮 `2px`，刷新按钮 `3px`）。

**问题**：若公共层取单一常数值，则必然使其中一个按钮的指示器**移动 1px**。
在已正式接受的页面上，这属于**展示语义/几何的变化**，
按 `MIGRATION.md` §4 的保护要求，**必须**经过 Feature 调整流程，
**不能**在“纯重构”中静默改变。

**本设计的处理**：

1. 公共层使用**一个** `--ql-btn-spinner-inset`，默认 `2px`；
2. 阶段一让参考页面**等价接入**时，刷新工具栏在其局部作用域内显式覆盖
   `--ql-btn-spinner-inset: 3px`，**保留其历史像素**；
3. 两个值是否统一为单一值，**另立视觉调整任务**并走 Feature 调整流程，
   本设计**不决定**统一后的取值；
4. 该 1px 差异**不得**通过保留两套实现来规避——两套实现必须收敛为
   一套机制（一个类名、一份 CSS、一个令牌），差异只由令牌值表达。

这样同时满足两条约束：**机制已收敛**（消除重复实现）与
**已接受视觉不变**（等价接入零像素变化）。

### 7.5.6 统一 ARIA 与阻断规则

`SHARED_COMPONENT_DESIGN_DECISION_DRAFT`：

| 状态 | 语义 |
| --- | --- |
| Loading 在途 | `aria-busy="true"`（仅在该按钮对应的 Loading 为真时） |
| 被功能阻断（`busy`） | `aria-disabled="true"`；点击处理入口直接返回；**外观不变** |
| 指示器节点 | `aria-hidden="true"`（纯装饰，语义由 `aria-busy` 承载） |
| 文字节点 | 内容恒定；不因 Loading 变化而增删文字 |

**注意**：参考实现的刷新按钮已经使用 `aria-busy` + `aria-disabled` 而非
Element Plus 的 `disabled`，公共层必须沿用该做法，**不得**改用 `disabled`
（`disabled` 会改变外观与焦点行为，破坏几何与可访问性等价）。

---

## 7.6 单实例 Tooltip 设计

### 7.6.1 目标数据与控制器契约

`SHARED_COMPONENT_DESIGN_DECISION_DRAFT`：

```ts
/** 锚点矩形（视口坐标系）。 */
interface QueryListTooltipAnchor {
  top: number
  left: number
  width: number
  height: number
  bottom: number
  right: number
}

/** 当前 Tooltip 目标。同一时刻至多一个。 */
interface QueryListTooltipTarget {
  /** 稳定触发键：内容/锚点变化但 key 不变时不重复弹出。 */
  key: string
  /** 展示文案。空字符串语义为“无内容”→ 关闭。 */
  content: string
  /** 锚点矩形。 */
  anchor: QueryListTooltipAnchor
}

interface QueryListTooltipShowOptions {
  key: string
  content: string
  /** 锚点来源：元素（取 getBoundingClientRect）或显式矩形。二者取其一。 */
  el?: HTMLElement
  anchor?: QueryListTooltipAnchor
  /**
   * 调用方内容上限（px）。省略时**仅**使用视口安全上限；
   * 传 480 时使用 min(480px, calc(100vw - 16px))。
   * 必须是有限正数；不接受任意 CSS 字符串。
   */
  maxWidthPx?: number
}

interface UseQueryListTooltipReturn {
  /** 当前目标（响应式）。 */
  current: Ref<QueryListTooltipTarget | null>
  /** 请求显示；内容为空即关闭；新 key 先即时关闭旧项再走统一延迟。 */
  show: (opts: QueryListTooltipShowOptions) => void
  /** 取消延迟并即时关闭。 */
  hide: () => void
  /** 绑定页面级关闭事件（页面/表格滚动、窗口缩放、页面隐藏）。返回解绑函数。 */
  bindGlobalClose: () => () => void
  /** 组件卸载：清定时器并置空，防止卸载后写入。 */
  destroy: () => void
}

/** 统一短暂显示延迟（参考实现事实值）。 */
declare const QUERY_LIST_TOOLTIP_DELAY_MS: 320
```

**按调用方的最大宽度行为**：

- 表格 Tooltip **不传** `maxWidthPx`，仅使用视口安全上限 `calc(100vw - 16px)`；
- 查询候选 Tooltip **传 `480`**，使用 `min(480px, calc(100vw - 16px))`；
- Host 最终宽度**始终**不超过 `calc(100vw - 16px)`；
- **不允许**传入任意 CSS 字符串；数值必须校验为**有限正数**，否则忽略并退回视口安全上限；
- **切换 target 时最大宽度必须随 target 更新**，且新内容完成测量前保持隐藏
  （沿用 §7.6.4 的“先隐藏 → 测量 → 再显示”流程）；
- 仍然**只有一个 Host、一套定位算法**（机制不因内容宽度差异而分裂）。

### 7.6.2 机制唯一性（含“两个定位算法”的处理）

`SHARED_COMPONENT_DESIGN_DECISION_DRAFT` —— 统一范围的**精确边界**：

**统一的部分**：

1. **单实例语义**：页面任意时刻**最多 1 个**自定义 Tooltip；
2. **锚点矩形定位算法**：视口四边避让、优先上方、水平居中、夹取到视口
   （参考实现 `tooltipPosition.ts` 的语义）；
3. **显隐时序**：统一约 320ms 显示延迟；新 key 先即时关闭旧项；
   延迟窗内离开即取消；仅“仍是最新 key”才 reveal；
4. **关闭规则**：页面/表格滚动（`capture`）、窗口 `resize`、
   文档 `visibilitychange`、锚定列表整体更新（调用方 watch 后 `hide()`）、
   组件销毁；
5. **渲染位置与外观**：`Teleport to="body"`、`position:fixed`、
   `pointer-events:none`、`width:max-content`、
   `max-width: calc(100vw - 16px)`、`white-space:pre-line`、
   `overflow-wrap:anywhere`、四边避让。

**不统一的部分（明确记录）**：

- `frontend/src/views/topic-offset/utils/tooltipPosition.ts` 是**指针跟随**算法
  （`PointerPoint` / `TIP_GAP=14` / `TIP_SAFETY_MARGIN=8` / `TIP_DEFAULT_MAX_WIDTH=340`），
  **不并入**公共层。理由：其输入是鼠标坐标而非元素矩形，语义与
  “长文本锚定在触发元素上”不同；强行合并会产出双模式 API 与双套边界规则，
  违反“避免过度抽象”。
- 该算法在对照页面**当前未被使用**渲染自定义 Tooltip（候选项用原生 `title`），
  因此统一后**不产生冲突**，对照页面可继续保留其工具函数。

**“一个机制”的判定标准**：页面内**只有一处** Tooltip Host 组件实例、
**一个**定位算法实现、**一套**关闭事件绑定。

### 7.6.3 参考页面“查询栏候选 Tooltip”的归并路径

`SHARED_COMPONENT_DESIGN_DECISION_DRAFT` —— 参考实现中查询栏的 `.dss-q-tt`
是第二套实现，**必须**归并，归并方式（阶段一实现任务执行，本设计不执行）：

1. 查询栏不再自行渲染 Tooltip DOM；
2. 查询栏沿用其现有的文档级捕获 `mouseover` / `mouseout` 委派，
   命中 `data-dss-client-id` 目标后，调用
   `useQueryListTooltip().show({ key, content, el: target })`；
3. 是否显示（描述为 null、码点长度 ≤ 20、非可见候选/可关闭标签）等
   **业务判定留在查询栏**（Feature 专属），公共层只接收“显示这一段内容在
   这个元素旁边”；
4. 关键路径：公共 `show()` 的 `el` 参数接受**任意**元素，
   因此查询栏与表格可共用同一控制器与同一 Host。

**同一页面内两个触发源共用控制器**时，控制器实例必须**页面唯一**：
建议由页面持有控制器并将其作为 prop 传给查询栏与表格，
或由表格持有（参考实现做法）并对外暴露 `show`；
两种方式**不得同时存在**。本设计**推荐**由**页面**持有，
理由：查询栏与表格是两个兄弟组件，由页面持有可避免兄弟组件间的顺序耦合。

### 7.6.4 Host 组件契约

`SHARED_COMPONENT_DESIGN_DECISION_DRAFT`：

```ts
interface QueryListTooltipHostProps {
  /** 当前目标；null 时不渲染任何 DOM。 */
  target: QueryListTooltipTarget | null
}
```

| 契约项 | 内容 |
| --- | --- |
| 渲染位置 | `Teleport to="body"`——避免被表格 `overflow` 裁切 |
| 根元素 | `div.ql-tooltip`，`role="tooltip"`，`data-ql-tooltip-host="1"`，并携带**页面实例唯一且稳定**的 `id`（供 `aria-describedby` 关联） |
| 最大宽度 | `max-width: min(var(--ql-tooltip-max-width,calc(100vw - 16px)), maxWidthPx)`；未传 `maxWidthPx` 时只用视口安全上限（见 §7.6.1） |
| 定位流程 | 目标变化 → `posStyle` 立即回到 `visibility:hidden` → `nextTick()` → 测量 `offsetWidth`/`offsetHeight` → 计算落点 → 一次性显示；**杜绝新内容沿用旧锚点坐标闪现** |
| 单行策略 | `width:max-content`——内容自然单行；**仅当**自然宽度超过安全视口（`calc(100vw - 16px)`，`border-box` 计入 padding/border）时才换行，换行后仍全文可读、不横向越界 |
| 交互 | `pointer-events:none`——不可交互，不拦截鼠标事件 |
| 读屏关联（`aria-describedby`） | 控制器通过 `el` 显示 Tooltip 时，把 Host 的 `id` 作为**一个 token** 追加到触发元素现有的 `aria-describedby`；**不得覆盖**触发元素已有的 token |
| 关联清理 | `hide()`、target 替换、锚定列表整体更新、路由切换、组件销毁时，**只移除控制器自己添加的 token**，触发元素原有值保持不变；同一页面始终**只有一个** Tooltip id/Host，不跨路由残留 |
| 无 `el` 的显式 anchor | 调用方只传显式 `anchor` 而未传 `el` 时，**调用方自负**建立 `aria-describedby`，或明确该调用仅服务鼠标、**不宣称读屏可达** |
| 无残留 | `target: null` 时不渲染 DOM；不保留任何跨页面状态 |

### 7.6.5 业务内容不得内置

`SHARED_COMPONENT_DESIGN_DECISION_DRAFT`：

- 公共层**不包含**任何 Feature 文案、任何字段名、任何“原始状态/展示状态”的语义；
- 参考实现中表格侧“正文 + Tooltip 正文”是**分别提供**的
  （单元格显示 `displayField()` 截断值，Tooltip 显示另一段文本），
  公共层必须保持这一分离：调用方分别传入单元格文本与 Tooltip `content`；
- 公共层**不得**从单元格文本推导 Tooltip 文本，**不得**在 Tooltip 内追加
  “原始值：”之类前缀——前缀属于 Feature 文案。

### 7.6.6 可访问性

`SHARED_COMPONENT_DESIGN_DECISION_DRAFT`：

| 项 | 设计 |
| --- | --- |
| Host 语义 | `role="tooltip"`；`aria-hidden` 不设置（内容对读屏可见） |
| 触发关联 | 仅给 Host 设置 `role="tooltip"` **不足以**建立读屏关联；必须由控制器把 Host 的唯一 `id` 以 `aria-describedby` **追加 token** 的方式关联到触发元素，并在 hide/target 替换/列表更新/路由切换/销毁时只移除自身 token（详见 §7.6.4） |
| 调用方内容上限 | 查询候选 Tooltip 传 `maxWidthPx=480`；表格 Tooltip 省略（详见 §7.6.1）；读屏可读性不因内容上限而变化 |
| 鼠标 | 触发元素 `mouseenter` → `show()`；`mouseleave` → `hide()` |
| 键盘焦点 | **API 支持**：控制器不区分触发方式，调用方可在 `focus` 事件上调用同一个 `show()`。是否启用由调用方决定 |
| Escape | 控制器提供全局 `Escape` 关闭（绑定在页面级关闭事件组内），**关闭当前 Tooltip 且不影响其它交互** |
| 截断文本可达 | 因延迟显示在 `keydown`/`focus` 场景不适用，调用方应保证被截断的值可通过 Tooltip 之外的途径获得（参考实现已通过 Tooltip 提供全文） |

**重要约束**：参考页面当前**没有**键盘焦点触发，也**没有** `Escape` 关闭。
阶段一为其做等价接入时：

- **键盘焦点触发**：**不新增**（属交互语义变化，须走 Feature 调整流程）；
- **`Escape` 关闭**：属**新增的纯追加可访问性行为**。本设计将其列为
  `DESIGNED`，并要求阶段一实现任务在需求中**显式声明该追加行为**、
  在验收矩阵中覆盖；若该项目负责人认为已接受交互契约不接受任何追加，
  则阶段一可**不启用** `Escape`（控制器通过绑定开关控制），
  并记录为已知可访问性缺口。**不得**在阶段一静默追加。

### 7.6.7 Tooltip 设计状态汇总

```text
single_tooltip_design_status=DESIGNED_SINGLE_INSTANCE_UNIFIED_ANCHOR_RECT_NOT_IMPLEMENTED
tooltip_pointer_following_algorithm_merged=NO_JUSTIFIED_DIFFERENT_SEMANTICS
tooltip_keyboard_trigger_for_reference_page=NOT_ADDED_IN_PHASE_1
tooltip_escape_close=DESIGNED_PHASE_1_REQUIRES_EXPLICIT_DECLARATION
tooltip_table_max_width=calc(100vw - 16px)
tooltip_query_candidate_max_width=min(480px, calc(100vw - 16px))
tooltip_per_target_max_width_status=DESIGNED_CALLER_OPTIONAL_MAXWIDTHPX
tooltip_aria_describedby_status=DESIGNED_PAGE_UNIQUE_ID_TOKEN_ADDITIVE
```

---

## 7.7 稳定滚动条槽的唯一最终方案

### 7.7.1 结论：路由元数据

`SHARED_COMPONENT_DESIGN_DECISION_DRAFT`：

```text
stable_scrollbar_gutter_design_choice=ROUTE_META
stable_scrollbar_gutter_target=MAIN_LAYOUT_CONTENT_AREA
stable_scrollbar_gutter_activation_status=DESIGNED_NOT_IMPLEMENTED
other_route_gutter_leak_status=NOT_APPLICABLE_DOCUMENT_ONLY
```

**唯一最终方案**：路由元数据 `meta.stableScrollbarGutter` 显式声明，
由 `MainLayout.vue` 读取并给真实纵向滚动容器 `.content-area`
加一个**通用、非 Feature 命名**的类。

已批准模板规范中的候选二（页面壳 Props）**被否决**，理由见 §7.7.4。
本轮**不实现**，只确定方案与接口形态。

### 7.7.2 `RouteMeta` 类型扩展建议

`SHARED_COMPONENT_DESIGN_DECISION_DRAFT`（设计草案，**未创建**）：

```ts
// frontend/src/router/index.ts（或独立的类型增强文件）
import 'vue-router'

declare module 'vue-router' {
  interface RouteMeta {
    /** 既有字段（现状事实）。 */
    title?: string
    group?: string
    standalone?: boolean
    /**
     * 稳定滚动条槽显式启用开关。
     * true  → 真实纵向滚动容器保留稳定滚动条槽（scrollbar-gutter: stable）
     * 省略 / false → 浏览器默认（scrollbar-gutter: auto）
     * 未声明的路由一律保持 auto，不得成为全局默认。
     */
    stableScrollbarGutter?: boolean
  }
}
```

核验事实：当前仓库**不存在**任何 `RouteMeta` 增强
（`declare module 'vue-router'` 零处匹配）；13 条路由均使用
`meta: { title, group }`（`LargeScreen` 另有 `standalone: true`）。
因此该类型增强属**新增**，须在阶段一实现任务中创建。

### 7.7.3 `MainLayout` 计算语义建议

`SHARED_COMPONENT_DESIGN_DECISION_DRAFT`（设计草案，**未实现**）：

```ts
// 语义描述（非最终代码）
const stableScrollbarGutter = computed(() => route.meta.stableScrollbarGutter === true)
```

- 严格使用 `=== true`：避免 `undefined`、字符串、任意 truthy 值被误判启用；
- 模板：`.content-area` 上 `:class="{ 'is-stable-gutter': stableScrollbarGutter }"`；
- 样式：`.content-area.is-stable-gutter { scrollbar-gutter: stable }`；
- **通用类名**：建议 `is-stable-gutter`（不出现 Feature 名、不出现 `dss-`、
  不出现路由名）；
- 基础 `.content-area` 规则**不得**包含 `scrollbar-gutter`；
- 不得使用全局 `overflow-y: scroll`、JS 宽度补偿、`ResizeObserver`、
  `setInterval` / `requestAnimationFrame` 轮询、`clientWidth` / `innerWidth` 测量
  或任何内联宽度写入；
- `scrollbar-gutter` 在样式块中应**恰好出现一次**（便于静态断言）。

### 7.7.4 设计理由（为什么是路由元数据）

`SHARED_COMPONENT_DESIGN_DECISION_DRAFT`：

1. **真实滚动容器的位置**：源码核验显示，承载页面纵向滚动的容器是
   **`MainLayout.vue` 中的 `.content-area`**，它是页面组件（例如
   `DataSourceRunStatePage.vue`）的**祖先**。页面壳 Props 只能作用于页面自身的
   子树，**无法**控制祖先容器；要让页面壳影响祖先，只能反向耦合
   （子组件去查找/修改祖先 DOM，或通过 `provide`/全局状态上抛），
   这与“公共层不得有副作用、不得反向依赖”的原则冲突；
2. **逐路由显式选择**：路由元数据天然是“逐路由”的，声明位置与生效位置
   一一对应，可被静态检索与逐路由断言；
3. **未声明的路由保持默认**：`route.meta.stableScrollbarGutter !== true` 时
   不加类，计算样式为 `auto`，满足“未声明页面保持浏览器默认行为”；
4. **不得成为全局默认**：开关只在元数据显式写 `true` 时生效，
   不存在任何“默认开启”的路径；
5. **与既有架构一致**：`MainLayout.vue` 已经承担“读取路由信息决定容器表现”
   的角色（当前是硬编码路由名），本方案只是把判据从**硬编码名称**
   换成**显式声明**，改动面最小。

### 7.7.5 关键风险记录：`MainLayout.spec.ts` 已固化现有实现

`SHARED_COMPONENT_DESIGN_DECISION_DRAFT`（参考实现事实核验）——
`frontend/src/layouts/MainLayout.spec.ts`（225 行）当前把以下内容写成**断言**：

| 断言内容 | 与本设计的关系 |
| --- | --- |
| `const GUTTER_CLASS = 'dss-stable-gutter'` | 通用类名一旦改为 `is-stable-gutter`，该常量**必须**同步更新 |
| `const TARGET_ROUTE_NAME = 'DataSourceRunState'` | 判据改为路由元数据后，该常量所表达的测试意图**必须**改为“设置 `meta.stableScrollbarGutter`” |
| 对 7 条其他命名路由逐一断言**不含**该类 | 测试意图可保留（改为断言未声明元数据的路由不启用） |
| 断言源码包含 `route.name === 'DataSourceRunState'` | **必须**改为断言读取 `route.meta.stableScrollbarGutter` |
| 断言 `dss-stable-gutter` 在代码中出现恰好 1 次、在样式中恰好 1 次 | **必须**改为对新通用类名的同型断言 |
| 断言 `.content-area.dss-stable-gutter` 声明 `scrollbar-gutter: stable` | 选择器字符串**必须**同步更新 |
| 断言 `scrollbar-gutter` 恰好出现 1 次、基础规则不含该属性、无 `.content-card` gutter 规则 | **不变**（与类名无关） |
| 断言不存在 `overflow-y: scroll`、`ResizeObserver`、`setInterval`、`setTimeout`、`requestAnimationFrame`、`resize` 监听、`clientWidth` / `innerWidth` / `getBoundingClientRect` / `offsetWidth` 赋值、宽度写入 | **不变**（禁止项保持不变） |
| 断言零非 scoped `<style>` 块；`.content-area` 保持 `flex:1` / `padding:16px 20px` / `overflow-y:auto` / `background-color:#f0f2f5` | **不变** |

**结论**：从硬编码路由名切换到路由元数据，**必然**要求阶段一实现任务
同步更新 `MainLayout.spec.ts`。这不是“顺手改测试”，而是**实现方案变更的一部分**，
必须在阶段一任务的需求与验收中显式列出，并保留全部既有禁止项断言
（禁止项一条都不得删除）。

### 7.7.6 行为定义

`SHARED_COMPONENT_DESIGN_DECISION_DRAFT`：

| 场景 | 行为 |
| --- | --- |
| 启用（`meta.stableScrollbarGutter === true`） | `.content-area` 获得 `is-stable-gutter` 类；计算样式 `scrollbar-gutter: stable`；纵向滚动条出现/消失不改变内容可用宽度 |
| 未启用（省略 / `false` / 非 `true`） | 不加类；计算样式 `scrollbar-gutter: auto`（浏览器默认） |
| 路由切换 | 由 `route.meta` 响应式派生，同一实例内切换路由时类名**同步**增删；不残留、不延迟 |
| 极窄视口 / 不支持 `scrollbar-gutter` 的浏览器 | **优雅降级**：属性被忽略，行为回落到浏览器默认（滚动条出现/消失仍会改变可用宽度）。这是**可接受的降级**，不得为此引入 JS 补偿 |
| SSR | **不适用**（本平台为纯前端 SPA，无 SSR）。记录为非目标 |
| 服务端渲染 / 静态导出 | 同上，不适用 |

### 7.7.7 后续测试要点（阶段一实现任务用，本设计不执行）

`SHARED_COMPONENT_DESIGN_DECISION_DRAFT`：

1. 声明 `meta.stableScrollbarGutter: true` 的路由 → `.content-area` 计算样式
   `scrollbar-gutter` 为 `stable`；
2. 其余全部命名路由 → 为 `auto`；
3. 同一布局实例内路由切换（启用 ↔ 未启用）→ 类名响应式增删，无残留；
4. 名称未声明的新增路由 → 默认 `auto`（防回归）；
5. 源码静态断言：`scrollbar-gutter` 恰好出现一次；基础 `.content-area` 不含该属性；
   零非 scoped `<style>` 块；上述全部禁止项（`overflow-y: scroll`、
   `ResizeObserver`、宽度测量与写入等）继续为零；
6. **反向控制**：构造一个“错误实现”（例如默认给所有路由加类，
   或使用 JS 补偿宽度），断言既有严格断言会以非零退出码失败。

### 7.7.8 明确仍然禁止

`SHARED_COMPONENT_DESIGN_DECISION_DRAFT` —— 与已批准模板规范一致，本方案
**仍然禁止**：

- 全局 `overflow-y: scroll`；
- JS 宽度补偿；
- `ResizeObserver` / `MutationObserver` 补偿；
- 伪造空白行或占位块；
- 把所有表格列固定为像素宽度以掩盖布局变化；
- 把该能力描述为“固定表头”或“横向滚动条”能力；
- 同时存在两个“最终方案”。

---

## 7.8 状态归属表

### 7.8.1 归属取值

`SHARED_COMPONENT_DESIGN_DECISION_DRAFT`：

- `FEATURE`：必须由具体业务页面/Feature 持有；
- `PRESENTATIONAL_COMPONENT`：由本文档定义的展示组件内部持有（视觉瞬时状态）；
- `SHARED_COMPOSABLE`：由公共 Composable 持有（阶段一仅 Tooltip 控制器落地）；
- `LAYOUT_OR_ROUTER`：由布局层或路由层持有。

### 7.8.2 状态归属表

| 状态 | 归属 | 说明 |
| --- | --- | --- |
| 查询草稿（用户当前选择，可能未提交） | `FEATURE` | 参考实现中由查询栏组件内部持有；草稿的语义（含“全部”哨兵）是 Feature 规则 |
| 已应用条件 | `FEATURE` | 参考实现中由 `useDataSourceSnapshot.ts` 持有；对照页面放在 Pinia store。两者不同，公共层不接管 |
| 当前成功结果（records / 列表数据） | `FEATURE` | 数据类型与业务含义均属 Feature |
| 查询 Loading（大态，可遮罩） | `FEATURE` | 由 `requestKind === 'query'`（及 `initial` / `retry`）派生 |
| 刷新 Loading（轻态，不遮罩） | `FEATURE` | 由 `requestKind ∈ {manual, restore, auto}` 派生 |
| 请求类别（`requestKind` 等） | `FEATURE` | 参考实现六类 / 对照页面七类，类别集合本身是 Feature 决定 |
| 首次加载错误（从未成功） | `FEATURE` | 错误形态与文案属 Feature |
| 刷新错误（内联收敛提示） | `FEATURE` | 文案属 Feature；公共层只提供预留高度的展示槽 |
| 最近成功刷新时间 | `FEATURE` | 取值与格式化（`HH:mm:ss` / `--`）属 Feature 工具 |
| 自动刷新 deadline | `FEATURE` | 单一事实来源；公共层阶段一不接管 |
| 倒计时展示投影（剩余秒 / 比例） | `FEATURE`（投影由公共组件**渲染**） | 状态在 Feature，渲染在 `QueryListRefreshToolbar`（`countdown` prop） |
| 页面可见性 | `FEATURE` | 参考实现由页面在 `onMounted`/`onUnmounted` 绑定 `visibilitychange` 并转发给 composable |
| Tooltip 目标（当前 1 个） | `SHARED_COMPOSABLE` | 阶段一唯一落地的公共状态持有者（`useQueryListTooltip`）；**页面唯一实例**，页面销毁即清空，**不跨路由保留** |
| 稳定滚动条槽启用开关 | `LAYOUT_OR_ROUTER` | 由 `route.meta.stableScrollbarGutter` 声明，`MainLayout` 读取 |
| 按钮 Loading 视觉（指示器显隐） | `PRESENTATIONAL_COMPONENT`（由 prop 驱动） | 组件只做“显隐投影”，真值来自 Feature 的 `requestKind` 派生 |
| Tooltip 延迟定时器 / 关闭事件绑定 | `SHARED_COMPOSABLE` | 由 `useQueryListTooltip` 内部持有并在卸载时清理 |

### 7.8.3 阶段一的边界结论

`SHARED_COMPONENT_DESIGN_DECISION_DRAFT`：

```text
behavior_composable_first_implementation_status=DEFERRED_ALL_THREE
```

- `useQueryListAppliedQuery`：**延后**。接口见 §7.8.4；
- `useQueryListSingleFlightRequest`：**延后**。接口见 §7.8.5；
- `useQueryListVisibleAutoRefresh`：**延后**。接口见 §7.8.6；
- **唯一**在阶段一落地的公共状态持有者是 `useQueryListTooltip`。

**延后的核心理由**（源码证据，非机械照抄）：

1. 参考页面已**正式接受**（`FINAL_ACCEPTED_AND_CLOSED`，`118/118` 通过）。
   抽取这三个 Composable 会**同时重写**该页面的请求状态机、
   条件升级纪律与定时器/可见性编排——判定面覆盖
   六类请求、单飞行门禁、令牌防覆盖、失败保留、隐藏冻结、恢复补发、
   倒计时投影一致性；
2. 对照页面（`topic-offset`）的状态机与参考实现**确实不同**
   （意图槽位 vs 单飞行直接拒绝；Pinia store vs composable 实例；
   `setInterval` vs `setTimeout` + 投影秒表；七类请求 vs 六类），
   因此“共同内核”目前**没有第二个消费者可验证**；
3. 阶段一的首要目标按迁移计划是**证明视觉与结构等价**，
   不是同时重构成熟状态机。

**若要推翻该结论（即在阶段一抽取）**，必须同时满足：

- 提供**比延后更安全**的证据：例如已在双消费者下证明两个状态机的
  输入/输出/时序完整同构，且逐条给出差异映射；
- 提供**逐项等价性验证方案**：为 12 类状态中的每一项给出
  “抽取前观测 → 抽取后观测 → 判定方式”，并覆盖
  请求次数、请求时机、失败语义、周期与恢复策略；
- 上述内容须作为独立任务评审，不得在阶段一实现中顺带进行。

### 7.8.4 `useQueryListAppliedQuery` 接口草案（延后）

`SHARED_COMPONENT_DESIGN_DECISION_DRAFT`：

```ts
interface UseQueryListAppliedQueryOptions<TCriteria, TDraft> {
  /** 初始已应用条件（由调用方给出业务默认值）。 */
  initial: TCriteria
  /** 初始草稿（可选；不提供则由调用方自行持有草稿）。 */
  initialDraft?: TDraft
  /** 草稿 → 请求条件的纯函数，由调用方提供（业务规则）。 */
  toCriteria: (draft: TDraft) => TCriteria
  /** 条件相等判定，由调用方提供（顺序无关性由调用方决定）。 */
  equals?: (a: TCriteria, b: TCriteria) => boolean
}

interface UseQueryListAppliedQueryReturn<TCriteria, TDraft> {
  /** 已应用条件（只读投影）。 */
  applied: Ref<TCriteria>
  /** 是否曾经成功。 */
  hasSuccess: Ref<boolean>
  /** 仅在请求成功后调用：提交新条件（两阶段提交的第二阶段）。 */
  commit: (criteria: TCriteria) => void
  /** 草稿（仅当提供 initialDraft 时）。 */
  draft?: Ref<TDraft>
  /** 用已应用条件还原草稿（“重置”语义由调用方决定是否同时触发查询）。 */
  resetDraft: () => void
}
```

**职责**：维护“草稿条件”与“已应用条件”的分离；**只有成功才升级**已应用条件。
**禁止承担**：发起请求；决定请求参数格式；决定草稿的初始业务含义；
“重置是否查询”的策略。

### 7.8.5 `useQueryListSingleFlightRequest` 接口草案（延后）

`SHARED_COMPONENT_DESIGN_DECISION_DRAFT`：

```ts
type QueryListRequestKind = string  // 由调用方定义类别集合

interface UseQueryListSingleFlightRequestOptions<TReq, TRes, TKind extends QueryListRequestKind> {
  /** 实际执行函数，由调用方提供。 */
  execute: (kind: TKind, request: TReq) => Promise<TRes>
  /** 成功判定，由调用方提供（例如 res.code !== 200 视为失败）。 */
  isSuccess: (res: TRes) => boolean
  /** 请求结束后的收口回调（启动下一周期、补发等），由调用方提供。 */
  onFinally?: () => void
  /** 门禁谓词：除 busy 外的额外抑制条件（例如页面隐藏）。 */
  isBlocked?: () => boolean
}

interface UseQueryListSingleFlightRequestReturn<TReq, TRes, TKind extends QueryListRequestKind> {
  /** 当前在途请求类别；空闲为 null。 */
  requestKind: Ref<TKind | null>
  /** 任一请求在途。 */
  busy: ComputedRef<boolean>
  /** 发起请求：busy / 被阻断 / 已销毁时直接返回（不排队、不补发）。 */
  launch: (kind: TKind, request: TReq) => void
  /** 卸载：置销毁位，拒绝迟到写入。 */
  destroy: () => void
}
```

**职责**：同屏至多一个实际请求在途；在途期间新触发被抑制；
以令牌防止旧响应覆盖新响应；卸载后拒绝迟到写入。
**禁止承担**：API 地址；业务错误文案；重试策略；自动刷新周期决策。

### 7.8.6 `useQueryListVisibleAutoRefresh` 接口草案（延后）

`SHARED_COMPONENT_DESIGN_DECISION_DRAFT`：

```ts
interface UseQueryListVisibleAutoRefreshOptions {
  /** 周期毫秒数，由调用方给出（例如 60_000）。 */
  intervalMs: number
  /** 到期触发回调（不发请求本身，只通知调用方“该刷新了”）。 */
  onDue: () => void
  /** 恢复可见时的补发回调；返回 false 表示本次不补发。 */
  onRestore?: () => boolean
}

interface UseQueryListVisibleAutoRefreshReturn {
  /** 剩余秒数投影（60→0 上舍入）；无已安排周期为 null。 */
  remainingSeconds: Ref<number | null>
  /** 剩余比例投影（1→0）；无已安排周期为 null。 */
  progress: Ref<number | null>
  /** 是否处于隐藏暂停。 */
  paused: Ref<boolean>
  /** 每次真实请求结束后调用：重启完整周期。 */
  restart: () => void
  /** 可见性变更（封装文档事件）。 */
  setHidden: (hidden: boolean) => void
  /** 卸载：清定时器。 */
  destroy: () => void
}
```

**职责**：维护一个**真实**的周期定时器；以**唯一 deadline** 派生展示投影；
隐藏时停表并冻结投影（**不假走**）；恢复可见时按策略补发一次。
**禁止承担**：决定周期数值；决定“补发还是等待”；发起请求本身。

---

## 7.9 样式隔离与令牌

### 7.9.1 类名前缀与作用域

`SHARED_COMPONENT_DESIGN_DECISION_DRAFT`：

| 项 | 规则 |
| --- | --- |
| 类名前缀 | 一律 `ql-`（例如 `ql-page`、`ql-result-panel__header`、`ql-btn-spinner`） |
| 冲突检查 | 全仓现有前缀 `.dss-*` / `.toff-*` / `.filter-*` / `.monitor-*` 等与 `ql-` 无交集 |
| 样式作用域 | 所有组件样式使用 `<style scoped>` |
| 全局样式 | 公共层**不新增**任何全局样式、不新增非 scoped `<style>` 块 |
| Element Plus 深度选择器 | **仅**在确有必要时使用（例如按钮内部节点），且必须写在 `scoped` 内并用本组件根类限定（`.ql-actions :deep(.el-button)`），**禁止**在公共层出现不带 `ql-` 限定的 `:deep(...)` |
| `.dss-*` 迁移 | `ql-*` 类名**不得**在公共层中引用、选择或覆盖 `.dss-*`；`.dss-*` **不得**提升为全局选择器 |
| 令牌作用域 | `--ql-*` 定义在组件根元素上，**不**定义在 `:root` 或 `body` |

### 7.9.2 令牌清单（建议名称 / 默认值 / 可覆盖层）

`SHARED_COMPONENT_DESIGN_DECISION_DRAFT`：

| 令牌 | 默认值 | 可覆盖层 | 说明 |
| --- | --- | --- | --- |
| `--ql-page-gap` | `12px` | 页面根 / 组件根 | 页面段落纵向间距 |
| `--ql-page-padding` | `14px 16px` | 页面根 | 页面内层内边距（参考实现 `.dss-page` 现状值） |
| `--ql-page-radius` | `10px` | 页面根 | 页面圆角 |
| `--ql-page-background` | `transparent` | 页面根 | 页面背景 |
| `--ql-title-margin` | `0` | 页面根 | 标题外边距 |
| `--ql-title-size` | `20px` | 页面根 | 标题字号 |
| `--ql-title-weight` | `650` | 页面根 | 标题字重 |
| `--ql-title-letter-spacing` | `-0.01em` | 页面根 | 标题字距 |
| `--ql-title-color` | `#09090b` | 页面根 | 标题色（参考实现 `--dss-text` 现状值） |
| `--ql-desc-margin` | `4px 0 0` | 页面根 | 描述外边距 |
| `--ql-desc-size` | `13px` | 页面根 | 描述字号 |
| `--ql-desc-color` | `#71717a` | 页面根 | 描述色（参考实现 `--dss-text-muted` 现状值） |
| `--ql-desc-line-height` | `1.5` | 页面根 | 描述行高 |
| `--ql-q-panel-gap` | `8px 14px` | 组件根 | 字段组行列间距 |
| `--ql-q-panel-padding` | `10px 16px` | 组件根 | 仅 `variant='card'` |
| `--ql-q-panel-bg` | `#F4F4F5` | 组件根 | 仅 `variant='card'` |
| `--ql-q-panel-radius` | `8px` | 组件根 | 卡片圆角 |
| `--ql-result-panel-bg` | `#FFFFFF` | 组件根 | 结果卡片底色 |
| `--ql-result-panel-radius` | `10px` | 组件根 | 结果卡片圆角 |
| `--ql-result-panel-shadow` | `0 1px 2px rgba(9,9,11,.04), 0 1px 3px rgba(9,9,11,.03)` | 组件根 | 结果卡片阴影 |
| `--ql-result-panel-header-padding` | `12px 16px 2px` | 组件根 | 头部内边距 |
| `--ql-result-panel-header-gap` | `12px 16px` | 组件根 | 头部行列间距 |
| `--ql-result-panel-error-min-height` | `22px` | 组件根 | **预留错误槽高度（关键几何设施）** |
| `--ql-result-panel-error-padding` | `0 16px` | 组件根 | 错误槽内边距 |
| `--ql-result-panel-divider-height` | `1px` | 组件根 | 头部/提示槽与正文之间的分隔线高度 |
| `--ql-result-panel-divider-color` | `#f0f0f1` | 组件根 | 分隔线颜色 |
| `--ql-result-panel-divider-margin` | `0 16px` | 组件根 | 分隔线左右缩进 |
| `--ql-result-panel-body-padding` | `10px 16px 14px` | 组件根 | 正文区内边距 |
| `--ql-result-panel-body-min-width` | `0` | 组件根 | 正文区最小宽度（允许收缩，不撑破容器） |
| `--ql-result-body-overflow-x` | `auto` | 组件根 | 正文区横向溢出策略（合并自表格容器） |
| `--ql-actions-gap` | `8px` | 组件根 | 查询/重置按钮间距 |
| `--ql-actions-radius` | `6px` | 组件根 | 查询/重置按钮圆角 |
| `--ql-actions-font-weight` | `500` | 组件根 | 查询/重置按钮字重 |
| `--ql-actions-query-bg` | `#09090b` | 组件根 | 查询按钮底色 |
| `--ql-actions-query-border` | `#09090b` | 组件根 | 查询按钮边框色 |
| `--ql-actions-query-fg` | `#ffffff` | 组件根 | 查询按钮文字色 |
| `--ql-actions-query-bg-hover` | `#27272a` | 组件根 | 查询按钮 hover/focus 底色 |
| `--ql-actions-query-border-hover` | `#27272a` | 组件根 | 查询按钮 hover/focus 边框色 |
| `--ql-actions-query-fg-hover` | `#ffffff` | 组件根 | 查询按钮 hover/focus 文字色 |
| `--ql-actions-query-padding` | `0 16px` | 组件根 | 查询按钮水平内边距 |
| `--ql-actions-reset-bg` | `#e4e4e7` | 组件根 | 重置按钮底色 |
| `--ql-actions-reset-border` | `transparent` | 组件根 | 重置按钮边框色 |
| `--ql-actions-reset-fg` | `#3f3f46` | 组件根 | 重置按钮文字色 |
| `--ql-actions-reset-bg-hover` | `#d9d9dd` | 组件根 | 重置按钮 hover/focus 底色 |
| `--ql-actions-reset-border-hover` | `transparent` | 组件根 | 重置按钮 hover/focus 边框色 |
| `--ql-actions-reset-fg-hover` | `#3f3f46` | 组件根 | 重置按钮 hover/focus 文字色 |
| `--ql-actions-reset-padding` | `0 14px` | 组件根 | 重置按钮水平内边距 |
| `--ql-btn-spinner-inset` | `2px` | 组件根 | Spinner 左偏移（见 §7.5.5） |
| `--ql-tooltip-z-index` | `3000` | 组件根 | Tooltip 层级 |
| `--ql-tooltip-max-width` | `calc(100vw - 16px)` | 组件根 | Tooltip 视口安全上限（始终生效）；调用方可用 `maxWidthPx` 进一步收窄（见 §7.6.1） |

### 7.9.3 可成为令牌的尺寸 vs 必须留在 Feature 的尺寸

`SHARED_COMPONENT_DESIGN_DECISION_DRAFT`：

**可成为公共令牌**（与业务无关、且是几何契约的一部分）：

- 结果卡片与查询卡片的**留白/背景/圆角/阴影**；
- 结果卡片头部的**行列间距**、**预留错误槽高度**与**头部/正文之间的分隔线几何**；
- 结果卡片**正文区的内边距与 `min-width`**；
- 刷新逻辑组的**间隙**与**分隔符**尺寸；
- 按钮的**固定宽度**、**Spinner 偏移**以及查询/重置按钮的**完整视觉（底色/边框/文字/圆角/字重/padding 与 hover·focus 两态）**；
- 页面**内层内边距、圆角、背景**、段落**纵向间距**与标题/描述**排版与配色**。

**必须留在 Feature**（业务决定，公共层不得给默认值）：

- 查询字段的**控件宽度**（参考实现的 `240px` / `300px` / `200px`，
  对照页面的 `200px`）；
- 查询字段的**数量、名称、顺序**；
- 表格**列宽**与 `min-width`（参考实现 `1175px` 为列宽之和）；
- **分页**控件形态、页大小、最大返回条数；
- 状态标签的**配色与文案**；
- 时间列**空值占位**文案（参考实现 `--`）；
- 失败提示**文案**（参考实现 `刷新失败，将在约 60 秒后自动重试`）。

### 7.9.4 如何证明对未迁移页面零样式泄漏

`SHARED_COMPONENT_DESIGN_DECISION_DRAFT`（阶段一验收要点，本设计只设计不执行）：

1. **静态**：公共层无全局样式块；`--ql-*` 未定义在 `:root`/`body`；
   全部 `:deep()` 均带 `ql-` 限定；
2. **计算样式逐路由断言**：对**全部**路由逐一取计算样式，
   断言未使用公共组件的页面在 `scrollbar-gutter`、以及公共令牌相关属性上
   与接入前**逐值相同**；
3. **令牌不泄漏**：未使用公共组件的页面，`--ql-*` 应**不可解析**（未定义）；
4. **反向控制**：构造“把 `--ql-*` 定义在 `:root`”或“添加全局样式块”的错误实现，
   断言零泄漏检查会以**非零退出码**失败。

### 7.9.5 Element Plus 深度选择器限制

`SHARED_COMPONENT_DESIGN_DECISION_DRAFT`：

- 允许在 `scoped` 内使用 `:deep()`，但**必须**由本组件根类限定；
- **禁止**在公共层新增全局 popper 类（例如 `.el-popper.ql-*`）。
  参考实现的 popper 宽度规则（`.el-popper.dss-client-popper` 等）
  属于该 Feature 的**字段宽度**业务，留在 Feature；
- **禁止**在公共层覆盖 `el-table` 的内部结构类
  （`el-table__cell` 内边距、表头 `.cell` 排版等），这些属 Feature。

---

## 7.10 响应式与可访问性

### 7.10.1 响应式

`SHARED_COMPONENT_DESIGN_DECISION_DRAFT`：

| 项 | 规则 |
| --- | --- |
| 字段组换行 | **整组**换行：每个字段组自身 `flex: 0 0 auto` 且内部 `inline-flex` + `nowrap`，不允许标签与控件被拆到两行 |
| 控件内容不得撑宽布局 | 控件宽度由 Feature 指定固定值（四值同锁）；本设计**不**引入按内容自适应宽度 |
| 查询 / 重置操作组 | `flex: 0 0 auto`；**查询/重置两个按钮在操作组内部永不拆散**；操作组作为**一个** flex item，在容器宽度不足时**允许整体换到下一行** |
| 右侧刷新组 | 整体靠右、`flex: 0 0 auto`、`nowrap`；窄宽度下由结果面板头部**整组换行**，不把其中某个元素单独挤到下一行 |
| 结果面板头部 | `flex-wrap: wrap` + `justify-content: space-between`；左右两区各自为不可拆散单元 |
| 表格横向滚动 | **允许**按业务需要横向滚动（列宽由 Feature 决定）；本设计不承诺“所有列始终可见” |
| 稳定滚动条槽 | 见 §7.7；属**纵向**滚动容器能力，与横向滚动无关 |

### 7.10.2 可访问性

`SHARED_COMPONENT_DESIGN_DECISION_DRAFT`：

| 项 | 规则 |
| --- | --- |
| 键盘操作 | 查询 / 重置 / 立即刷新按钮均可通过 Tab 聚焦、Enter / Space 激活（由 `el-button` 原生行为提供） |
| 焦点可见 | 公共层必须保留可见焦点样式；参考实现的刷新按钮使用 `focus-visible` 局部焦点环，公共层沿用 |
| `aria-busy` | 仅在该按钮对应的 Loading 为真时置 `true` |
| 被阻断（`busy`） | `aria-disabled="true"` + 点击入口早退；**外观不变**；**不使用** `disabled` 属性 |
| 指示器 | `aria-hidden="true"` |
| 装饰图形 | 倒计时环 `aria-hidden="true"` |
| 常量占位 | 时间值槽的常量占位 `88:88:88` 为 `visibility:hidden` + `aria-hidden="true"`（不可见但占位，且不被读屏朗读） |
| 页面标题 | `<h2>`（与参考实现一致） |
| 错误区 | 无成功现场的整区错误使用 `role="alert"`（参考实现做法，公共层不接管，属 Feature 页面壳的用法） |
| 信息提示 | `#header-extra` 内容由调用方赋予 `role="note"` 等语义 |
| Tooltip 键盘访问 | 见 §7.6.6（API 支持；参考页面阶段一不新增键盘触发；`Escape` 关闭需显式声明） |
| 文本截断可达 | 截断的完整值必须可通过某种途径获得（Tooltip 或等价手段）；公共层不负责生成该途径 |
| `prefers-reduced-motion` | Spinner 旋转、环的过渡等**非必要动效**在该偏好下关闭，但指示器仍静态可见、几何完全稳定 |

### 7.10.3 非 Spinner 动效边界

`SHARED_COMPONENT_DESIGN_DECISION_DRAFT`：

- 公共层**不引入**任何新的过渡动画；
- 参考实现已明确：倒计时环为**逐秒离散**递减，**无填充式补间**，
  以避免周期重置瞬间的“倒转”观感——公共层保持该做法；
- `prefers-reduced-motion: reduce` 下：Spinner 停止旋转但保持静态可见；
  环的过渡置 `none`，但仍显示准确数字与静态进度。

---

## 7.11 阶段一范围

### 7.11.1 阶段一必须完成

`SHARED_COMPONENT_DESIGN_DECISION_DRAFT`：

1. 创建 6 个展示组件：`QueryListPageShell`、`QueryListQueryPanel`、
   `QueryListActions`、`QueryListResultPanel`、`QueryListRefreshToolbar`、
   `QueryListTooltipHost`；
2. 创建公共类型 `types.ts`（Tooltip 目标/锚点、倒计时投影等）；
3. 创建统一 Tooltip 控制器 `frontend/src/composables/query-list/useQueryListTooltip.ts`；
4. 把该 Feature 的**两处私有 Loading 几何样式**收敛到公共展示层
   （一个类名、一份 CSS、一个令牌；历史 1px 偏移由令牌局部覆盖保留，见 §7.5.5）；
5. 把稳定滚动条槽的判据从**硬编码路由名**改为**显式路由元数据**
   （新增 `RouteMeta.stableScrollbarGutter`，`MainLayout` 改用 `=== true` 派生，
   并同步更新 `MainLayout.spec.ts` 中受影响的断言，**保留全部禁止项断言**）；
6. 让“源库快照状态”作为**唯一**参考页面进行**等价接入**：
   页面结构与视觉零像素变化、业务语义零变化；其中页面壳必须复现参考页面
   **内层**内边距 `14px 16px`、圆角 `10px`、背景 `transparent`、段落纵向间距 `12px`，
   以及标题（`margin:0` / `20px` / `650` / `-0.01em` / `#09090b`）与描述
   （`margin:4px 0 0` / `13px` / `#71717a` / `1.5`）的完整排版事实——
   这些值**不能**由 `MainLayout .content-area` 的外层 padding 替代（见 §7.2.1、§7.4.1）；
7. 保持 `useDataSourceSnapshot.ts` 的成熟请求状态机与全部 Feature 业务语义
   **完全不变**（六类请求、单飞行、失败保留、隐藏冻结、恢复补发、
   倒计时投影、重置不查询）；
8. 为阶段一产物补齐最小必要测试（组件契约、Tooltip 单实例、几何稳定断言）。

### 7.11.2 阶段一明确不做

`SHARED_COMPONENT_DESIGN_DECISION_DRAFT`：

1. **不迁移**“数据同步进度”或任何其他页面；
2. **不实现**三个被延后的行为 Composable（不创建文件、不建占位）；
3. **不改变**参考页面已接受的视觉（唯一需要显式声明的是 §7.6.6 的
   `Escape` 关闭，若启用）；
4. **不定义**按钮高度基线；
5. **不引入**新依赖、全局样式、全局指令或全局插件；
6. **不修改** `docs/baseline/` 下六份项目级基线；
7. **不修改**本目录四份已批准模板文档的规范内容
   （阶段一完成后如需更新状态，另立文档任务）。

### 7.11.3 偏离说明

`SHARED_COMPONENT_DESIGN_DECISION_DRAFT` —— 与已批准基线的推荐方向相比，
阶段一有**两处**需显式记录的偏离，均已在上文给出理由：

| 偏离 | 内容 | 理由位置 |
| --- | --- | --- |
| 1 | 原“稳定表格容器”候选项**不单独实现**，并入结果面板正文区 | §6.3 |
| 2 | 阶段一**不抽取**三个行为 Composable，仅完成接口设计 | §7.8.3 |

其余推荐方向（优先做页面壳层、查询/结果容器、稳定按钮几何、
单实例 Tooltip、路由级显式启用；Feature 专属状态标签留在 Feature）
**全部采纳**，且均在 §6.1 中给出了源码级证据。

---

## 7.12 后续实现与验收矩阵（本轮只设计，不执行）

`SHARED_COMPONENT_DESIGN_DECISION_DRAFT` —— 下表为**阶段一实现任务**应执行的
验证项清单。**本设计任务不执行其中任何一项**。

### 7.12.1 功能与回归

| # | 验证项 | 判定方式 | 本轮状态 |
| --- | --- | --- | --- |
| 1 | 参考页面既有定向测试**全部通过** | `npm test` 中 `data-source-run-state` 相关用例 | `NOT_RUN_DOCUMENT_DESIGN_ONLY` |
| 2 | 前端全量测试通过 | `npm test` | `NOT_RUN_DOCUMENT_DESIGN_ONLY` |
| 3 | 前端构建通过 | `npm run build`（含 `vue-tsc --noEmit`） | `NOT_RUN_DOCUMENT_DESIGN_ONLY` |
| 4 | 查询 / 重置按钮固定宽度 | 断言计算宽度为 `62px` / `62px`（四值同锁） | `NOT_RUN_DOCUMENT_DESIGN_ONLY` |
| 5 | 立即刷新按钮固定宽度 | 断言计算宽度为 `110px` | `NOT_RUN_DOCUMENT_DESIGN_ONLY` |
| 6 | Loading 前后按钮与相邻元素矩形严格 `0` 变化 | 严格 `0`（不取整）；负向注入 `≥0.001px` 必须使断言以非零退出码失败 | `NOT_RUN_DOCUMENT_DESIGN_ONLY` |
| 7 | 长短结果切换时内容区、各表头列、按钮矩形严格 `0` 变化 | 含主内容容器 `clientWidth`；严格 `0` 判定 | `NOT_RUN_DOCUMENT_DESIGN_ONLY` |
| 8 | 四个正式视口 | `1280×800`、`1700×920`、`1920×1080`、`2560×1440` | `NOT_RUN_DOCUMENT_DESIGN_ONLY` |
| 9 | 同屏最多 1 个 Tooltip | 同时 hover 两个触发源，断言页面内 `[data-ql-tooltip-host]` 至多 1 个 | `NOT_RUN_DOCUMENT_DESIGN_ONLY` |
| 10 | 长文本 Tooltip 单行且不出界 | 断言不换行（宽度 ≤ 安全视口）或安全换行后四边均在视口内 | `NOT_RUN_DOCUMENT_DESIGN_ONLY` |
| 11 | 首载 / 查询 / 刷新 / 失败保留 / 隐藏暂停 / 恢复补发语义不变 | 与接入前的既有断言逐条对齐 | `NOT_RUN_DOCUMENT_DESIGN_ONLY` |
| 12 | 无非 GET 写请求 | 请求日志中断言无 `POST`/`PUT`/`PATCH`/`DELETE` | `NOT_RUN_DOCUMENT_DESIGN_ONLY` |
| 13 | 其他路由 `scrollbar-gutter` 无泄漏 | 逐路由计算样式断言 | `NOT_RUN_DOCUMENT_DESIGN_ONLY` |
| 14 | 负向控制可使严格几何断言非零退出 | 注入错误实现，断言检查失败 | `NOT_RUN_DOCUMENT_DESIGN_ONLY` |
| 15 | 页面壳矩形与排版逐值不变 | 断言等价接入后 `.ql-page` 的 `padding` / `border-radius` / `background` / `row-gap` 与标题/描述的 `margin` / `font-size` / `font-weight` / `letter-spacing` / `color` / `line-height` 与接入前**逐值相同**（`14px 16px` / `10px` / `transparent` / `12px`；`0` / `20px` / `650` / `-0.01em` / `#09090b`；`4px 0 0` / `13px` / `#71717a` / `1.5`） | `NOT_RUN_DOCUMENT_DESIGN_ONLY` |
| 16 | 结果面板四段结构与 divider/正文几何 | 断言存在 `header` / `error-slot` / `divider` / `body` 四段且顺序不变；divider 为 `1px` / `#f0f0f1` / `margin 0 16px`；正文 `padding 10px 16px 14px` 且 `min-width:0` | `NOT_RUN_DOCUMENT_DESIGN_ONLY` |
| 17 | 查询/重置按钮完整视觉与可选高度 | 断言 `:hover` / `:focus-visible` 两态下底色、边框、文字色与参考实现一致；`heightPx` 未传时**不输出 `height`**，参考页显式传 `30` 时计算高度为 `30px` | `NOT_RUN_DOCUMENT_DESIGN_ONLY` |
| 18 | Tooltip 按调用方的最大宽度 | 断言查询候选 Tooltip 宽度 ≤ `min(480px, calc(100vw - 16px))`；表格 Tooltip 宽度 ≤ `calc(100vw - 16px)`；切 target 时宽度随内容上限更新 | `NOT_RUN_DOCUMENT_DESIGN_ONLY` |
| 19 | Tooltip `aria-describedby` 关联 | 断言通过 `el` 显示时触发元素新增一个 Host `id` token；`hide()` / 销毁后只移除该 token，触发元素原有 `aria-describedby` 值不变；同一页面 Tooltip `id`/Host 唯一 | `NOT_RUN_DOCUMENT_DESIGN_ONLY` |

### 7.12.2 环境边界

| # | 项 | 判定 |
| --- | --- | --- |
| 20 | 数据库写操作 | `0` |
| 21 | ZooKeeper 主动访问 | `0` |
| 22 | Kafka 访问 | `0` |

### 7.12.3 严格几何判定口径

`SHARED_COMPONENT_DESIGN_DECISION_DRAFT` —— 沿用参考实现已冻结的口径：

- 判定阈值为**严格 `0`**（不做像素取整、不设容差）；
- 观测对象包括：按钮外框 `x/y/width/height`、按钮相邻元素的
  `x/y/width/height`、主内容容器 `clientWidth`、各表头列的
  `x/y/width/height`；
- 必须提供**反向控制**：注入 `≥0.001px` 的位移或错误的实现方式，
  断言必须以**非零退出码**失败，以证明断言非空转。

---

## 7.13 风险与回滚

### 7.13.1 风险清单

`SHARED_COMPONENT_DESIGN_DECISION_DRAFT`：

| # | 风险 | 影响 | 缓解 |
| --- | --- | --- | --- |
| 1 | **过度抽象** | 产出薄包装或超级组件，增加维护成本却不减少重复 | §7.3.4 的“每一保留项至少一个可断言不变量”+ §7.4.1 的禁止生长约束；已据此把 1 项合并 |
| 2 | **Slot API 过宽** | 调用方可以绕过契约，几何稳定性失效 | 每个组件槽数量封顶（壳 4 / 查询面板 2 / 结果面板 4）；Actions 与 RefreshToolbar **不开放**按钮槽（由组件自渲染按钮） |
| 3 | **Slot API 过窄** | 页面无法表达自身业务，被迫改公共层 | 保留 `header` / `error` / `summary` 等逃生舱；逃生舱使用后调用方负责一致性 |
| 4 | **共享 CSS 泄漏** | 未迁移页面视觉被改变 | §7.9.1 的 `ql-` 前缀 + 全 scoped + 令牌挂在组件根 + §7.9.4 的逐路由计算样式断言 |
| 5 | **Tooltip 定位降级** | 极端视口下 Tooltip 越界或不可读 | 四边避让 + `max-width: calc(100vw - 16px)` + 超限换行 + `overflow-wrap:anywhere`；`Teleport to="body"` 避免裁切 |
| 6 | **Element Plus DOM 结构耦合** | EP 升级导致 `:deep()` 选择器失效、几何位移 | 公共层 `:deep()` 仅限按钮内部节点且带 `ql-` 限定；**禁止**在公共层覆盖 `el-table` 内部结构 |
| 7 | **路由元数据类型遗漏** | `meta.stableScrollbarGutter` 未纳入 `RouteMeta`，TS 报错或被静默忽略 | §7.7.2 明确 `declare module 'vue-router'` 增强；`=== true` 严格判定 |
| 8 | **已接受参考页面行为漂移** | 违反 `MIGRATION.md` §4 的保护要求 | §7.11.1 第 6、7 项：等价接入、状态机不变；§7.12 的逐条语义回归；两处需显式声明的追加行为（§7.5.5 的 1px 覆盖、§7.6.6 的 `Escape`） |
| 9 | **`MainLayout.spec.ts` 断言与实现变更不同步** | 阶段一改判据后既有断言失败或被误删 | §7.7.5 逐条列出必须同步的断言与**必须保留**的禁止项断言；§7.12 第 13、14 项覆盖 |
| 10 | **一次性抽取行为 Composable 导致判定面过大** | 等价性回归无法收敛，已接受页面的状态机被重写 | §7.8.3 结论为**延后**；若推翻，须满足该节列出的两项更安全证据要求 |
| 11 | **指示器 1px 偏移统一引发视觉变更** | 已接受页面的 Loading 视觉被改变 | §7.5.5：机制收敛 + 令牌局部保留历史值；统一另立视觉调整任务走 Feature 调整流程 |
| 12 | **非标准文案被机械套用 62px** | 文案溢出或被裁切 | §7.4.3 规则 1–4：默认值只适用于 2 个中文字；其他文案必须显式传宽度；不提供自动测量 |
| 13 | **按钮高度被无意定义为基线** | 违反已批准模板规范 | §7.5.4：不定义统一高度令牌；`heightPx` **无公共默认值**，未传时不输出 `height`；参考页面显式传 `30` 仅为继承现状；`button_height_baseline_status=NOT_DEFINED_NOT_CHANGED` |
| 14 | **阶段一顺带迁移其他页面** | 破坏“每页独立任务”纪律，无法定位失败 | §7.11.2 第 1 项：阶段一只做参考页面等价接入 |
| 15 | **页面壳内层内边距被误归给布局层** | 公共页面壳丢失 `padding:14px 16px`、圆角与本页标题/描述配色，等价接入后页面几何与排版变化 | §7.2.1、§7.4.1：`.dss-page` 自带内层 `padding` 与 `border-radius`，与 `MainLayout .content-area` 的外层 `padding` 是两层事实，不得合并口径；§7.12.1 第 15 项逐值断言 |
| 16 | **结果面板分隔线与正文几何缺失** | 头部/正文之间缺少 1px 分隔线或正文内边距变化，产生像素位移 | §7.4.4 的四段渲染结构与 divider/body 令牌；§7.12.1 第 16 项断言 |
| 17 | **统一 Tooltip 丢失调用方内容宽度或读屏关联** | 查询候选 Tooltip 由 `480px` 变为整视口宽；`role="tooltip"` 无触发关联，读屏不可达 | §7.6.1 的 `maxWidthPx`（表格省略、查询候选传 `480`）与 §7.6.4 的 `aria-describedby` token 生命周期；§7.12.1 第 18、19 项断言 |

### 7.13.2 回滚设计

`SHARED_COMPONENT_DESIGN_DECISION_DRAFT`：

1. **回滚粒度**：阶段一实现任务必须组织为“**先新增公共层，再等价接入参考页面**”
   两个可独立回退的提交单元。若接入后出现不可接受的等价性问题，
   回滚**接入提交**即可让参考页面回到原实现，而公共层可以保留（未被使用，
   对未迁移页面零影响）。
2. **回滚方式**：**一次普通 revert**（`git revert <接入提交>`）即可恢复参考页面
   原始实现；**不得**使用 `reset --hard`、`checkout .`、`clean -f`、
   `stash` 或任何改写历史的操作。
3. **回滚前置条件**：因为公共层与接入是分离的提交，
   回滚接入不会牵连 `MainLayout`、路由元数据等其他变更；
   但**路由元数据与 `MainLayout.spec.ts` 的改动与接入提交绑定**，
   回滚时必须一并回退（或保留元数据但把参考路由的声明改回原判据——
   两者只能择一，**不得**同时保留半套）。
4. **回滚验证**：回滚后必须重新通过参考页面既有定向测试与前端构建，
   并确认参考页面视觉与业务语义回到接入前状态。
5. **本设计任务不执行任何回滚**，只记录回滚设计。

---

## 8. 与四份已批准模板文档的关系

`SHARED_COMPONENT_DESIGN_DECISION_DRAFT` —— 本文件是四份已批准模板文档的
**下游详细设计草案**：

- 四份模板文档仍是**已批准基线**，本文件**不修改**其规范内容；
- 本文件对候选清单的结论是**逐项带证据的细化**，其中一处结论与基线
  候选表的建议并列方式不同（见 §6.3），但**不否定**基线候选表的
  存在意义与分层结论；
- 四份模板文档新增的最小导航与状态指引见各自文件；
- 本文件的状态为 `DRAFT_PENDING_CHATGPT_AND_PROJECT_OWNER_REVIEW`，
  **未批准**、**未实现**。

---

## 9. R1 契约等价性纠正记录

`SHARED_COMPONENT_DESIGN_DECISION_DRAFT` —— 本节记录 R1
（`QUERY-LIST-PAGE-SHARED-COMPONENT-DESIGN-001-R1`，基准提交
`106bb41c83c9dfd6f19b323cd68bd1b347193f80`）对 R0 草案所做的**契约等价性纠正**。

```text
shared_component_architecture_direction_status=APPROVED
candidate_decision_status=PRESERVED_APPROVED
route_meta_design_status=PRESERVED_APPROVED
implementation_authorization_status=NOT_GRANTED
```

本轮**只**纠正以下五项契约缺口，**不改变**架构方向、候选取舍、路由元数据方案与
阶段划分：

| # | 纠正 | 位置 |
| --- | --- | --- |
| 1 | `QueryListPageShell` 未完整承载参考页面几何与排版事实（R0 错误地把页面内边距归给 `MainLayout`；标题/描述配色写错） | §7.2.1、§7.4.1、§7.9.2、§7.11.1、§7.12.1 第 15 项、§7.13.1 风险 15 |
| 2 | `QueryListResultPanel` 缺少 divider、正文 padding 与 `min-width:0` 契约 | §7.4.4、§7.9.2、§7.12.1 第 16 项、§7.13.1 风险 16 |
| 3 | `QueryListActions` 未完整定义参考按钮视觉，并把 `30px` 写成公共默认高度 | §7.4.3、§7.5.4、§7.9.2、§7.12.1 第 17 项、§7.13.1 风险 13 |
| 4 | 统一 Tooltip 丢失查询候选 Tooltip 的 `480px` 最大宽度，且缺少触发元素与 Tooltip 的读屏关联 | §7.4.6、§7.6.1、§7.6.4、§7.6.6、§7.6.7、§7.9.2、§7.12.1 第 18、19 项、§7.13.1 风险 17 |
| 5 | 内部不一致：`countdown` 必填性、重复标题/重复状态行、操作组换行表述 | §7.4.2、§7.4.3、§7.4.5、§7.4.7、§7.8.2、§7.10.1 |

以下结论在 R1 中**保持不变**（其权威取值仍只在 §6.1、§7.5.1、§7.5.4、§7.7、§7.8.3
给出，本节不重复声明，以免产生第二处事实来源）：

- 候选决策计数 10 / 6 / 1 / 3 / 0（见 §6.1：`candidate_component_count`、
  `keep_for_first_implementation_count`、`merge_into_another_component_count`、
  `defer_until_second_consumer_count`、`reject_as_unnecessary_abstraction_count`）；
- 稳定滚动条槽的唯一方案仍为**路由元数据**、目标仍为 `MainLayout` 内容区域（见 §7.7.1、§7.7.2）；
- 三个行为 Composable 阶段一**全部延后**（见 §7.8.3）；
- 按钮高度基线状态仍为**未定义、未改变**（见 §7.5.4）；
- 三个固定宽度参考值仍为 `62 / 62 / 110`（见 §7.5.1）。

本文件继续只使用 `SHARED_COMPONENT_DESIGN_DECISION_DRAFT` 一个标记，
**未使用** `README.md` §5 的四类保留标记。R1 仍是**纯文档纠正任务**：
**未创建任何组件、Composable、路由元数据或样式**，**未修改“源库快照状态”页面**，
**未迁移任何页面**，**未执行任何测试、构建或浏览器验证**。

R1 完成后仍需 **ChatGPT 从远程 Git 复审**，随后由**项目负责人**决定是否批准；
在此之前 `shared_component_implementation_status`、`page_migration_status`、
`query_list_page_template_implementation_status` 仍为 `NOT_STARTED`，
**不得**实现公共组件、**不得**让参考页面接入公共组件、**不得**迁移任何页面。
