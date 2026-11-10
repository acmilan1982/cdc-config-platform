# 公共列表管理页模板 · 能力盘点与范围草案

```text
list_management_page_template_document_status=DRAFT_PENDING_OWNER_CONFIRMATION
list_management_page_template_baseline_status=NOT_APPROVED
task_scope=PHASE_1_INVENTORY_AND_SCOPE_DRAFT_ONLY
task_code=PUBLIC-LIST-MANAGEMENT-TEMPLATE-INVENTORY-AND-SCOPE-DRAFT-001
inventory_source_commit=6560c73fb71aa5b8441de4a57fe777d7810b12da
product_code_change_status=NONE
page_migration_status=NOT_STARTED_BY_THIS_TASK
owner_scope_approval_status=PENDING
```

> 本文件是[README.md](./README.md)的配套盘点。全部“建议提取”“建议形态”“推荐第二页”
> **均未被批准**，不得引用为现行规则。所有路径与行号均基于固定 SHA
> `6560c73fb71aa5b8441de4a57fe777d7810b12da`。

## 1. 盘点方法与判定口径

### 1.1 证据分层

| 标记 | 含义 |
|---|---|
| **源码现行事实** | 在固定 SHA 的源码／CSS 中可直接核验，附路径与行号 |
| **已有基线** | 来自三套既有模板或 Feature 现行基线，附基线位置 |
| **本次建议** | 本次盘点提出、**尚未批准**的提取范围、形态或第二页推荐 |

### 1.2 分类定义

| 分类 | 含义 |
|---|---|
| **直接复用** | 既有公共能力已覆盖，本模板只规定用法，不新增代码 |
| **本期提取** | 建议在第二阶段提取为新的公共能力（本任务不实施） |
| **可选扩展** | 有跨页价值，但本期不做，留作后续独立评估 |
| **业务专属** | 含业务语义或页面差异，应留在 Feature 页面 |
| **暂不提取** | 本期仅固化契约与检查项，不新增公共代码 |

### 1.3 “本期”与“后续”

- **本期** = 第一阶段之外、待负责人确认后的**第二阶段最小提取**；
- **后续** = 第三阶段及更晚的独立任务；
- 任何“本期提取”在获批前都只是建议，**不是**现行规则。

## 2. 能力矩阵总表

| # | 能力 | 现行实现位置 | 公共化状态 | 分类 | 建议形态 | 阶段 |
|---|---|---|---|---|---|---|
| C1 | 页面骨架 | `query-list/QueryListPageShell.vue` | 已实现、正式验收、两页接入 | 直接复用 | Vue 组件（既有） | 已完成 |
| C2 | 搜索栏 | `QueryListQueryPanel` + `QueryListActions` + 页面字段组 | 容器/按钮已实现；字段组页面重复 | 直接复用 + 本期提取（字段组 CSS） | 既有组件 + 纯 CSS opt-in | 第二阶段 |
| C3 | 结果工具栏 | `QueryListResultPanel` 槽位 + 页面摘要/新增按钮 | 面板已实现；摘要与按钮页面重复 | 直接复用 + 本期提取（摘要/按钮 CSS） | 既有组件 + 纯 CSS opt-in | 第二阶段 |
| C4 | 无分页表格 | `list-table-visual.css` + `lt-main-table` | 已实现、正式验收、两页接入 | 直接复用 | 纯 CSS + 可选辅助类 | 已完成 |
| C5 | 行操作菜单 | `lt-row-action__*` 外观 + 页面 `ElDropdown` | 仅三点外观公共化；菜单与忙碌状态页面实现 | 直接复用 + 可选扩展 | 既有 CSS + 用法契约 | 第三阶段评估 |
| C6 | 新增／编辑弹窗 | `create-edit-dialog-visual.css` | 公共 CSS 已实现、代码复审通过；仅探针接入 | 直接复用（CSS）；暂不提取（Vue 包装） | 既有 CSS + 令牌 | 第三阶段评估 |
| C7 | 二次确认 | 两页 `ElMessageBox.confirm` | 未公共化 | 暂不提取 | 契约 + 使用示例 | 无 |
| C8 | 状态标签 | 两页私有胶囊／`el-tag` | 未公共化 | 业务专属（几何预设属可选扩展） | 页面实现 | 无 |
| C9 | 请求流程 | 两页序列令牌、忙碌集合、提交守卫 | 未公共化 | 暂不提取 | 契约 + 检查项 | 无 |
| C10 | 列表刷新 | 两页保存/启停/删除后重载与稳定 ID 重选 | 未公共化 | 暂不提取 | 契约 + 检查项 | 无 |
| C11 | 公共验收 | 无统一框架 | 未建立 | 本期建立（文档） | 分层验收清单 | 第二阶段起 |

## 3. 逐项盘点

### C1 页面骨架

**源码现行事实**

- `frontend/src/components/query-list/QueryListPageShell.vue:2` 根节点 `.ql-page`；
  **默认槽内容逐一成为 `.ql-page` 直接子节点，不生成任何包装层**（同文件注释）。
- 样式：`gap: 12px`、`padding: 14px 16px`、`border-radius: 10px`、透明背景；
  标题 `20px/650/#09090b`，说明 `13px/#71717a`。
- 槽位：`header`、`description`、`header-extra`、默认槽；props：`title`、`description`；
  无 emits、无 `defineExpose`。

**已有基线**

- `docs/baseline/query-list-page-template/README.md`：共享组件已正式验收；
  变更记录载明 2026-09-17 最终接受收口，补充验收 `21/21` PASS。
- 页面级接入：数据源管理（2026-09-18 授权 / 2026-09-19 记录）、
  探针端管理（2026-09-22 授权 / 2026-09-23 实现），见同目录 `MIGRATION.md`。

**分类：直接复用。** 本模板不新增骨架组件，不复制 `.ql-page` 样式。
页面必须保持“普通态三个直接子节点”的结构契约，不得再包一层容器。

**兼容风险：** 若页面自行增加包装层，会破坏 `.ql-page` 的子节点契约与既有测试；
后续验证需检查真实 DOM 层级。

### C2 搜索栏

**源码现行事实**

- 容器：`QueryListQueryPanel.vue:2-6`，`.ql-q-panel__flow` 为
  `display:flex; flex-wrap:wrap; gap:8px 14px`；`actions` 槽作为**一个** flex item 渲染。
- 按钮：`QueryListActions.vue:27-59` 的 props：`queryText`、`resetText`、
  `queryWidthPx`（默认 62）、`resetWidthPx`（默认 62）、`queryLoading`、`busy`、
  `heightPx`（默认不输出高度）。`queryLoading` **只**控制查询按钮的常驻指示器；
  `busy` 才是“任一请求在途”的功能阻断，通过 `aria-disabled` + 早返回实现，
  **不**设置 `disabled` 属性（`:83-89`）。
- 事件：`query`（查询按钮 `click` 且 `!busy`）、`reset`（重置按钮 `click` 且 `!busy`）。
- 宽度：查询/重置按钮 `width/min-width/max-width/flex-basis` 四值同锁（`widthLock`，`:71-80`）。
- 探针页：`ClientConfigPage.vue:10-32`，两个字段（输入 `300px`、下拉 `150px`），
  输入框 `@keyup.enter="onQuery"`（`:18`）。
- 数据源页：`DataSourcePage.vue:11-58`，四个字段（输入 `180px`、角色下拉 `140px`），
  三个输入框均 `@keyup.enter="onQuery"`（`:20/31/52`）。
- 字段组为页面私有：探针 `.cc-q-group/.cc-q-label`（`ClientConfigPage.vue:1534/1541`）；
  数据源 `.ds-q-group/.ds-q-label`（`DataSourcePage.vue:1665/1672`）。
  两处均为 `inline-flex; align-items:center; gap:6px` + 标签 `13px` 常规色、`nowrap`，
  数值一致但无公共来源。
- 回车查询是**页面绑定**，不是组件能力。
- 重置语义是**页面策略**：两页都只清空查询控件，**不发起请求**、不改已应用条件与当前结果
  （探针 `:705-711`；数据源 `:608-611`）。
- 已应用条件与草稿分离：探针 `appliedKeyword/appliedStatus`，数据源 `effectiveQuery`。

**已有基线**

- `docs/baseline/query-list-page-template/SHARED_COMPONENT_DESIGN.md` 明确：
  重置默认只发 `reset`，是否查询由调用方决定；`busy` 时两个事件都不触发。

**分类：**

- 容器、按钮、常量：**直接复用**；
- 字段组排版（标签 + 控件）：**本期提取（纯 CSS）**；
- 回车触发、重置语义、已应用条件快照：**业务专属**，由页面实现并以契约约束。

**本次建议形态**

- 新增显式 opt-in 类（名称仅为建议）：`.lmt-q-field`（`inline-flex`、居中、`gap:6px`）、
  `.lmt-q-label`（`13px`、常规文字色、`nowrap`）。固定字面量，不新增令牌。
- 不新增 Vue 组件；控件类型与宽度继续由页面提供。
- 在契约中固化：输入框回车触发查询；重置只清草稿不发请求；
  查询使用“已应用条件快照”，不在请求进行中读取未提交的草稿值。

**输入／输出／扩展点：** 公共层只提供类与排版；页面提供控件、宽度、字段名、
回车绑定与查询快照。无事件、无插槽新增。

**默认行为与允许差异：** 默认横向流式排列、整体换行；不同页面的字段数量、控件类型、
宽度、下拉选项均允许不同。

**兼容风险：** 新类必须只影响显式挂载的字段组；不得改动 `QueryListQueryPanel`
的 gap/换行；不得把字段宽度写入公共层。需在真实浏览器验证窄视口换行与对齐。

### C3 结果工具栏

**源码现行事实**

- `QueryListResultPanel.vue:2-18`：DOM 顺序固定为
  `header → error-slot → divider → body`；`summary` 与 `toolbar` 两个槽位；
  props `summaryText`、`errorText`、`variant`。
- 探针页：摘要 `.cc-result-count`（`ClientConfigPage.vue:1557-1561`），
  新增按钮 `.cc-btn-add`（`:1563-1590`，`#09090b/#27272a/#18181b`，
  `:not(.is-disabled)` 只改正常态），图标间距 `.cc-btn-icon`（`:1592-1595`）。
- 数据源页：摘要 `.ds-result-count`（`DataSourcePage.vue:1692-1696`），
  新增按钮 `.ds-add-button`（`:1698-1719`），数值与状态选择器与探针页一致。
- 两页在 `toolbar` 槽放“新增”主按钮；本阶段不接入自动刷新工具栏
  （两页均无自动刷新需求，`QueryListRefreshToolbar` 保持可选）。

**分类：**

- 结果面板结构与槽位：**直接复用**；
- 摘要文字样式、新增主按钮视觉：**本期提取（纯 CSS）**；
- 自动刷新工具栏：**暂不提取**（只适用于只读查询页的 opt-in 能力，本模板不默认启用）。

**本次建议形态**

- `.lmt-result-count`（`14px/600/主文字色`）；
- `.lmt-add-button`（`#09090b` 常态、`#27272a` hover/focus、`#18181b` active、
  圆角 `6px`、字重 `500`，` :not(.is-disabled)` 限定正常态）。
- 固定字面量、显式 opt-in，不新增令牌；按钮文案、图标、禁用条件、点击行为由页面提供。

**输入／输出／扩展点：** 无 props/emits；页面通过 `summary`/`toolbar` 槽组合。

**默认行为与允许差异：** 摘要文案（“共 N 条”）由页面决定；新增按钮是否存在、
是否 loading、何时禁用由页面决定。

**兼容风险：** 不得把所有 `el-button--primary` 全局改黑；必须限定 opt-in 类；
禁用态沿用 Element Plus 既有视觉；焦点轮廓不得被移除。

### C4 无分页表格

**源码现行事实**

- `frontend/src/styles/list-table/list-table-visual.css`：根类 `.lt-main-table` +
  9 个 `--lt-*` 令牌；表头 `12px/600/#71717a/0.01em`；
  正文 `td` 纵向内边距 `12px 0`、表头 `th` `11px 0`；公共层**不声明**令牌值。
- 可选三点入口：`lt-row-action__cell`（操作列 `td` 补偿 `9.5px 0`）、
  `lt-row-action__ellipsis`（`28×28`、圆角 `6`、主色、hover `#ecf5ff`、
  `focus-visible` 内嵌描边）。
- 可选单行固定高亮：表级 `lt-row-highlight` + 行级 `lt-row-highlight__row`；
  hover `#f4f4f5`、固定底 `#e1e4e8`、首格左缘 `inset 3px 0 0 #18181b`；
  `current-row` 归零在前、固定行在后。
- 探针页：`:class="[LT_MAIN_TABLE_CLASS, 'lt-row-highlight']"`（`ClientConfigPage.vue:59`），
  `row-class-name` 返回 `lt-row-highlight__row`（`:678-680`），
  `@row-click` / `@row-dblclick`（`:63-64`）。
- 数据源页：`:class="['data-table', LT_MAIN_TABLE_CLASS]"`（`DataSourcePage.vue:83`），
  仅 `@row-dblclick`（`:84`），无行选中高亮。

**已有基线**

- `docs/baseline/list-table-visual-template/README.md`：公共实现与数据源参考页接入
  已最终接受（2026-09-22），模板级 `page_migration_status=NOT_STARTED`、
  `page_migration_authorization_status=NOT_GRANTED`。
- 探针页对三点入口与单行高亮为**页面级**接入，状态与模板级迁移分开记录。

**分类：直接复用。** 分页／页大小／虚拟滚动／固定行高均为业务选择，
公共层不提供、不默认。

**输入／输出／扩展点：** 页面在 `el-table` 根节点挂根类；
可选挂 `lt-row-highlight` 并通过 `row-class-name` 提供行级类；
其余列定义、行事件、行高由页面负责。

**默认行为与允许差异：** 行高内容驱动；是否选中、双击编辑、固定操作列、
`show-overflow-tooltip`、空状态均允许不同。

**兼容风险：** 固定行高会与内容驱动纪律冲突；`+N`、长异常值、固定右列、
Tooltip 共存需真实浏览器验证；未 opt-in 页面必须零匹配。

### C5 行操作菜单

**源码现行事实**

- 公共层只提供**外观**：三点触发器命中区与交互态、操作单元格纵向补偿；
  不提供菜单、条目、权限、请求或忙碌逻辑。
- 探针页（`ClientConfigPage.vue:200-249`）：操作列 `td` 挂 `lt-row-action__cell`，
  触发器 `cc-more-link lt-row-action__ellipsis`；`ElDropdown` 的 trigger 与菜单
  均 `@click.stop` / `@dblclick.stop`；条目为停用/启用、删除，删除 `divided`；
  **菜单项** `:disabled="rowBusy(row)"`，**触发器本身不禁用**。
- 数据源页（`DataSourcePage.vue:129-183`）：触发器是**文字“更多”+ 箭头**
  （`.row-more`），未使用公共三点类；触发器与菜单阻止冒泡到行双击；
  条目按角色/异常状态动态变化：异常行仅“停用”；正常行按 SOURCE/TARGET 显示
  命名策略/业务属性，再是启用/停用、删除；删除在全局忙碌时禁用。

**分类：**

- 三点**外观**：**直接复用**；
- 触发器事件隔离、菜单项集合/顺序/权限/忙碌：**业务专属**；
- 菜单项危险/警示色调预设：**可选扩展**（两页存在重复颜色，
  但 Popper 为页面命名空间，暂不提取）；
- 公共 Vue 菜单组件：**暂不提取**。

**本次建议形态（契约，不新增组件）**

- 行操作菜单由页面使用 `ElDropdown` 实现；
- 触发器与菜单必须阻止 `click` / `dblclick` 冒泡，避免误触行选中或双击编辑；
- **触发器禁用**与**菜单项禁用**分开判断：触发器是否可点由页面决定；
  菜单项在行级请求在途时禁用，其他行不受影响；
- 危险项（删除）与警示项（停用/启用）文案与颜色由页面决定；
- 公共层不保存选中行、不监听点击、不发起请求。

**兼容风险：** 把数据源“更多”改为三点属于视觉变更，需页面级授权与验收；
不得在迁移中改变菜单条目或业务顺序；键盘操作与焦点返回需真实浏览器验证。

### C6 新增／编辑弹窗

**源码现行事实**

- 公共 CSS：`frontend/src/styles/dialog/create-edit-dialog-visual.css`；
  根类 `ced-dialog`（`max-width: calc(100vw - var(--ced-dialog-safety-inset))`）、
  7 个辅助类、17 个 `--ced-*` 令牌；公共层不声明令牌值；
  不承载校验、请求、关闭时序、权限。
- 探针页：`<el-dialog class="cc-dialog ced-dialog" width="900px">`
  （`ClientConfigPage.vue:259`）；主提交 `cc-dialog-submit ced-submit`（`:412`）；
  页面在非 scoped 块设置 4 个 Feature 令牌（`:2176-2180`）：
  `--ced-label-column-width:84px`、`--ced-label-gap:12px`、
  `--ced-dialog-safety-inset:48px`、`--ced-submit-bg-loading:#3f3f46`。
- 数据源页：`<el-dialog class="editor-dialog" width="620px">`
  （`DataSourcePage.vue:197`）；EP `el-form` + `label-width="120px"`；
  页面私有标签样式（`:1861-1865`）与主提交按钮色序（`:1724-1743`），
  未挂 `ced-dialog`。
- 业务专属流程：连接测试 10 秒倒计时、密码掩码与“已修改”判定、
  未保存关闭确认、ID 锁定/修改、字段级错误与焦点、全局错误区等，全部在页面。

**已有基线**

- `docs/baseline/create-edit-dialog-visual-template/README.md`：
  设计基线 2026-09-30 批准；公共 CSS 已实现并代码复审 `APPROVED`；
  **Vue 组件 `NOT_CREATED`**；仅 `/config/client` 新增／编辑主弹窗获页面级授权并接入；
  **正式验收 `NOT_EXECUTED`**；数据源管理弹窗**未授权**。

**分类：**

- 公共 CSS、辅助类、令牌：**直接复用**；
- Vue 包装组件：**暂不提取**（`NOT_CREATED`，且尚无收益/兼容证据）；
- 表单载体、字段、校验、请求、关闭时序：**业务专属**。

**输入／输出／扩展点：** 根类 + 辅助类（`ced-form-label`、`ced-label-row`、
`ced-required-mark`、`ced-submit`、`ced-field-feedback`、`ced-field-error`、
`ced-field--error`）+ Feature 令牌；页面提供值、字段与行为。

**默认行为与允许差异：** 标签排版与主提交按钮视觉在两页可比对一致；
表单载体、标签列宽、错误模型、全局错误区、弹窗宽度、loading 配色允许不同。

**兼容风险：** 接入时必须删除页面私有同义规则，避免双视觉来源；
私有表单与 EP 表单的标签类不同；字段反馈最小占位是**有条件**策略
（AC-138 经验：两行占位不能保证任意长错误高度不变）；
异常原值必须可辨认，ID 正文负责省略（AC-091/088 经验）。

### C7 二次确认

**源码现行事实**

- 两页均使用 `ElMessageBox.confirm`：
  探针启停带 `customClass: 'cc-confirm--enable' / 'cc-confirm--disable'`
  （`ClientConfigPage.vue:812/845`），并有页面私有确认按钮色序（`:2251-2295`）；
  删除使用默认确认框（`:871`）。
- 数据源启停与删除使用默认确认框（`DataSourcePage.vue:656/689`）；
  业务属性/命名策略的放弃修改确认同样使用 `ElMessageBox.confirm`。
- 行级忙碌在**发起确认前**即占位，避免确认未决时重复弹框
  （数据源 `:649-662`、`:683-695`；探针 `busyClientIds`）。

**分类：暂不提取。**

理由：确认框承载业务语义（启用/停用/删除、可恢复性、颜色语气）、
请求时序与忙碌占位；公共化会迫使不同业务共享同一文案/颜色/时序。
`ElMessageBox` 本身已是公共基础，无需再包一层组件。

**本次建议形态：契约 + 使用示例**

- 取消确认必须**零写入**；
- 请求在途或确认未决时不得再次弹确认或重复提交；
- 请求已发出但结果未知时不得自动重发；
- 失败时保留可恢复状态，不凭空改变选中/固定行；
- 危险项与警示项的文案、颜色、按钮顺序由 Feature 决定。

**后续验证：** 确认框按钮点击、ESC/遮罩取消的零写计数、重复点击、
慢请求与超时，需真实后端与故障注入，不能仅静态判断。

### C8 状态标签

**源码现行事实**

- 探针：停用胶囊 `.cc-inactive-mark`（`ClientConfigPage.vue:1650-1668`，
  `#fee2e2/#991b1b`）；异常标识 `.cc-abnormal-mark`（`:1670-1687`，
  `#fee2e2/#b91c1c`，`flex:0 0 auto`、不省略，文案 `异常：{原值}`）；
  数据源标签三态 `cc-dstag--ok|neutral|bad`（页面私有）。
- 数据源：停用胶囊 `.ds-inactive-mark`（`DataSourcePage.vue:1799-1814`，
  数值同探针）；异常标识 `.ds-abnormal-mark`（`:1817-1832`，琥珀
  `#fef3c7/#b45309`）；角色 `el-tag` 视觉（`:1835-1853`）。
- 数据订阅：异常行通过 `row-class-name` 加 `.anomaly-row`（页面样式），无胶囊。

**分类：业务专属。** 状态集合、判定条件、文案、颜色语义、是否可操作
均属 Feature；公共层不预设 `FG_ACTIVE` 或任何状态码。

**可选扩展（后续）：** 若第三个页面出现相同的“停用/异常胶囊几何”，
可再评估纯 CSS 几何预设；本期不做。

**必须保留的展示纪律（来自既有修复经验）**

- 异常原值必须可辨认，**不得**静默显示为“停用”（AC-091/088 经验）；
- 状态文字本身承载语义，不只靠颜色；
- 窄列时由 ID 正文省略，异常标识不收缩、不省略；
- 不把“含 `FG_ACTIVE`”当作自动启用某套公共样式的充分条件。

**验证：** 长异常值、窄列、真实数据三态、空白/NULL/缺字段样本，
必须真实浏览器 + 真实响应核对。

### C9 请求流程

**源码现行事实**

| 行为 | 探针端管理 | 数据源管理 |
|---|---|---|
| 列表序列守卫 | `listSeq`，迟到响应不回写 | `listToken`，迟到响应不回写 |
| 失败处理 | **保留上一次成功结果**，仅错误槽提示并可重试（`:760-771`） | **清空旧行**并显示错误（`:559-583`） |
| 行级忙碌 | `busyClientIds` 集合，按行独立 | `statusBusyId` / `deletingId` 单值 |
| 保存防重 | `submitting` 守卫 | `saving` + `editorLoading` 守卫 |
| 详情/测试防重 | 弹窗内单次打开 | `detailToken`、`testToken`、10 秒倒计时 |
| 关闭顺序 | 未保存确认 → 再关闭 | 未保存确认 → 再关闭；业务弹窗同样 |
| 成功后 | 重载列表；启停成功可按稳定 ID 重选 | 重载当前已应用条件 |

**已有基线**

- `query-list-page-template` 的公共组件设计明确把
  `useQueryListAppliedQuery`、`useQueryListSingleFlightRequest`、
  `useQueryListVisibleAutoRefresh` 列为**暂缓**，未实现。

**分类：暂不提取。**

理由：两页在“失败是否保留旧结果”“重选意图”“行级 vs 页级忙碌”上**有意不同**，
没有证据支持一个统一行为；函数名相似不等于契约相同。公共层若强行统一，
会改变已验收页面的业务语义。

**本次建议形态：交互契约 + 实现检查项**

- 同一列表同一时刻只允许一个“最新请求”回写；
- 旧响应必须被序列令牌丢弃，不覆盖新结果；
- 请求已发出但结果未知时**不得自动重发**；
- 取消确认零写入；失败反馈保留可恢复状态；
- 成功刷新使用“已应用条件快照”，不读取未提交草稿；
- 稳定 ID 重选必须是**本次请求私有**的意图，不跨请求共享；
- 行级操作只锁当前行，不阻塞其他行。

**后续验证：** 延迟响应乱序、失败/超时、重复点击、确认未决、成功后立即再查询，
需故障注入 + 真实后端；静态阅读不能证明。

### C10 列表刷新

**源码现行事实**

- 两页均在保存、启停、删除成功后重载列表；
- 探针 `loadList(reselectTarget)`：普通重载清空固定选中；
  仅启停成功触发的重载携带目标 ID，按“仍在最新结果中且可见”重选
  （`ClientConfigPage.vue:738-760`）；
- 数据源使用 `effectiveSnapshot()` 重载当前已应用条件（`DataSourcePage.vue:1170/1185`），
  无行选中/重选；
- 两页均无自动刷新控件；`QueryListRefreshToolbar` 未接入。

**分类：暂不提取。** 刷新时机、失败保留策略、重选语义均属页面；
公共 `RefreshToolbar` 只服务于只读查询页的 opt-in 自动刷新，不应成为管理页默认。

**契约：**

- 刷新必须有序列守卫，迟到响应不得复活过期选择；
- 普通查询/重载清空选择；行状态变更成功后的重选只能是本次意图；
- 失败/取消不改变现有选择；不把重选意图存入跨请求共享变量；
- 选中 ID 只存页面会话，不写 URL、浏览器存储、接口或数据库。

**后续验证：** 并发查询 + 启停 + 删除的真实竞态；稳定 ID 在结果中消失/出现；
分页（当前无分页）未来若引入需重新评估。

### C11 公共验收

**分类：本期建立（文档）。**

本模板不新增运行时代码即可建立分层验收框架，建议第二阶段起使用：

| 层 | 检查 | 是否可在本阶段完成 |
|---|---|---|
| 静态契约 | 路径/类名/令牌/opt-in 数量、零全局覆盖、零 `!important` | 是（文档核对） |
| 结构测试 | 组件渲染层级、DOM 顺序、槽位、属性 | 第二阶段（代码任务） |
| 构建 | `npm run build`、`type-check`、`lint` | 第二阶段 |
| 真实浏览器 | 几何、行高、焦点、窄视口、零泄漏计算样式 | 第二阶段 |
| 行为等价 | 查询/重置、双击/选中、菜单隔离、防重、关闭顺序 | 第二阶段（真实后端/故障注入） |
| 页面级回归 | 已接受 Feature 用例（如 `DS-AC-141~182`） | 第三阶段，逐页 |
| 负责人目测 | 指定页面、指定时点 | 第三阶段 |
| 正式验收 | 独立任务、独立范围 | 仅在被明确授权时 |

**完成标准：** 每一层都要有可复算证据；**未运行不得写 `PASS`**；
静态检查不得替代真实键盘/焦点/几何/后端结果。

## 4. 公共层与页面层职责

### 4.1 职责边界

| 公共层负责 | 页面负责 |
|---|---|
| 页面骨架、查询容器、查询/重置按钮的几何与视觉 | API 地址、请求参数、字段映射 |
| 结果卡片结构、错误槽与分隔线 | 错误码解释、错误文案、失败保留/清空策略 |
| 表格基础视觉、可选三点外观、可选单行高亮 | 列定义、状态语义、行事件、选中规则 |
| 弹窗标签排版、主提交按钮视觉、字段反馈**视觉** | 表单载体、校验规则、字段级反馈模型、提交/关闭时序 |
| 显式 opt-in 类与有限令牌 | 业务权限、启停/删除语义、确认文案 |
| 零泄漏与未启用页零影响 | 稳定 ID、重选意图、重复提交防护、并发竞态 |

### 4.2 唯一维护位置

| 规则 | 唯一维护位置 |
|---|---|
| `.ql-page` / `.ql-q-panel` / `.ql-actions` / `.ql-result-panel` | `frontend/src/components/query-list/*` |
| `.lt-main-table` / `--lt-*` / `lt-row-action__*` / `lt-row-highlight*` | `frontend/src/styles/list-table/list-table-visual.css` |
| `.ced-dialog` / `ced-*` / `--ced-*` | `frontend/src/styles/dialog/create-edit-dialog-visual.css` |
| 查询字段组、结果摘要、新增按钮（**建议新增**） | 第二阶段新建的 `list-management` 纯 CSS 预设（尚不存在） |

页面**不得**保留与上述来源同义的私有副本；迁移时删除私有规则，
而不是两套并存。

## 5. 探针端管理预计接入改动（第二阶段，未实施）

探针端管理已是最接近目标的页面，第二阶段若获批，预计**只做视觉归并**：

| 现状 | 预计改动 | 业务行为 |
|---|---|---|
| `.cc-q-group/.cc-q-label` 私有字段组 | 改用建议的公共字段组类 | 不变 |
| `.cc-result-count` 私有摘要 | 改用建议的公共摘要类 | 不变 |
| `.cc-btn-add` 私有新增按钮 | 改用建议的公共新增按钮类 | 不变 |
| `.cc-inactive-mark` 等状态胶囊 | **本期不动**（业务专属） | 不变 |
| 三点入口、单行高亮 | 已接公共层，**不动** | 不变 |
| `ced-dialog` 弹窗 | 已接公共层，**不动** | 不变 |
| 页面私有 Tooltip `.cc-single-tip` | **本期不动**；未使用 `QueryListTooltipHost`，记录为差异 | 不变 |
| `+N` 打包、ID 三态、异常标识、行选中、双击编辑 | **不动** | 不变 |

**必须保留：** 157 条验收已覆盖的行为、AC-138 的条件占位、AC-091/088 的异常原值
与 ID 省略、菜单事件隔离、请求防重、取消零写。该页面任何改动都必须另立任务，
做等价回归并由负责人目视；本任务**不授权**该改动。

## 6. 第二页候选比较（第三阶段，未授权）

### 6.1 评估口径

候选必须同时满足：

1. 有**管理主列表**（新增/编辑/删除或状态变更），不是纯只读监控页；
2. 有**新增/编辑主弹窗**或可明确拆分的主流程；
3. 主列表**无分页**或分页不阻断模板复用；
4. 业务专属流程可以与主列表/主弹窗**分开评估**。

### 6.2 候选 A：数据源管理（`/config/data-source`）

**源码与基线事实**

- `DataSourcePage.vue` 已接入 `QueryListPageShell/QueryPanel/Actions/ResultPanel`
  （`:5-58`）与 `lt-main-table`（`:83`）；
- 主列表用文字“更多”入口（`:129-138`），**未**使用公共三点类；
- 新增/编辑主弹窗为 `editor-dialog`（`:197`），**未**接入 `ced-dialog`；
- 额外业务流：连接测试 10 秒倒计时、业务属性弹窗、目标库命名策略弹窗；
- 已接受调整：`DS-AC-141~182`（42 条）于 2026-09-20 正式验收全部 PASS、
  项目负责人最终接受（见 `docs/features/data-source-management/README.md` §2.3）；
- 列表表格模板以本页为参考页并已最终接受；**页面级迁移授权仍为 `NOT_GRANTED`**。

**适配评估**

- 结构接近度：**最高**；只剩行操作入口、弹窗视觉与本次三项管理页样式未统一；
- 改动面：主列表触发器与弹窗根类/令牌；业务属性/命名策略/连接测试不进入模板；
- 风险：需回归已接受的 DS 行为；把“更多”改三点是可见变化；
  弹窗改用 `ced-dialog` 需保留 EP 表单校验与全局错误区差异。

**结论：推荐作为第三阶段第二页**，范围仅限主列表行操作入口与新增/编辑主弹窗，
其余业务专属流程排除在外。**仅为候选，未获授权。**

### 6.3 候选 B：数据订阅（`/config/subscribe`）

**源码事实**

- `DataSubscribePage.vue`：自建 `.query-card` + `.query-bar`（`:3-60`）、
  自建 `el-table`（`:87-187`）；未接入查询列表组件或 `lt-main-table`；
- 操作列是文字按钮“编辑”“删除”（`:182-183`），无三点菜单；
- 新增/编辑使用独立组件 `SubscribeFormDialog.vue`（897 行），
  删除/详情各用独立确认/详情组件；
- 查询条件为多选源库/目标库，返回 `queryWarnings` 告警；
- 无启用/停用，异常行通过 `row-class-name` 标记；
- 列表模板盘点将其列为 `CANDIDATE_HIGH`，但**未**授权迁移。

**适配评估**

- 结构接近度：中等；需先把查询卡片改为 `QueryListPageShell/QueryPanel`，
  把表格改为 `lt-main-table`，再引入行操作与弹窗视觉；
- 改动面：明显大于数据源；多选筛选、告警、异常行、源表选择器均为业务专属；
- 风险：一次性结构改造容易混入行为变化，回归范围大；
- 价值：能在“未接入过任何公共层的页面”上验证模板可移植性。

**结论：不推荐作为第三阶段首选**；建议在数据源页验证通过后，再作为后续候选。
若负责人的首要目标是“独立验证模板在陌生页面的可移植性”，可改为首选，
但需接受更大改动面与更长验收周期。

### 6.4 其他页面的处置

- 服务端配置（`/config/server`）：行内编辑 + 整卡保存，没有记录级新增/删除，
  不是“列表管理”形态，**不适合**本模板；
- CDC 节点状态、数据同步进度、日志查询、Job 故障：只读监控页，
  不属于写操作管理页，**不适合**；
- 数据源快照状态：只读参考页，不属于本模板范围。

## 7. 验证范围与完成标准

### 7.1 第一阶段（本任务）

只做文档适用检查：

- 路径与符号真实性（逐项对照固定 SHA）；
- 11 项能力分类覆盖、无遗漏；
- 相对链接有效；
- 状态措辞不把草案写成已批准、不把未运行写成 `PASS`；
- `git diff --check` 无空白错误。

**不运行**产品测试、构建、浏览器、业务接口或数据库。

### 7.2 第二阶段（待批准）

- 静态契约测试：新 CSS 仅含 opt-in 选择器、无全局覆盖、无 `!important`、
  令牌/类数量与文档一致；
- 结构测试与构建：`npm run type-check`、`npm run lint`、`npm test`、
  `npm run build`（按任务要求）；
- 真实浏览器：查询字段换行、摘要/按钮状态矩阵、未启用页零泄漏；
- 行为等价：探针页查询/重置、行选中/双击、菜单隔离、请求防重、关闭顺序；
- 独立远程代码复审 + 负责人页面接受。

### 7.3 第三阶段（待批准）

- 第二页选中范围的行为等价回归，含已接受 Feature 用例；
- 真实后端成功/失败/超时响应；
- 写操作（启停/删除/保存）如需数据库写入，必须另行审批；
- 真实键盘/焦点/几何/窄视口验证；
- 独立复审与负责人目测、独立正式验收。

### 7.4 静态分析的边界

静态阅读与文档核对**不能**证明：真实回车/焦点顺序、浏览器几何、
Tooltip 与 `+N` 共存、后端结果、并发竞态、写路径。上述均须在后续阶段运行；
未运行项只能记为 `NOT_RUN` 或后续验证项。

## 8. 待负责人决定事项

以下问题设计为**一次确认**即可进入第二阶段，不需要多轮审批。

1. **最小提取范围**：是否批准第二阶段只新增三项纯 CSS
   （查询字段组排版、结果摘要、新增主按钮），不新建 Vue 组件？
   推荐：**批准**。理由：两页数值已一致、无业务语义、改动小且可单独回退。
2. **参考页**：是否确认第二阶段仍以 `/config/client`（探针端管理）为参考页，
   只做视觉归并、不变业务行为？
   推荐：**确认**。理由：该页已验收，归并面最小，适合先证明模板自身。
3. **第二页**：第三阶段优先数据源管理，还是数据订阅？
   推荐：**数据源管理**，范围仅限主列表行操作入口 + 新增/编辑主弹窗，
   业务属性/命名策略/连接测试排除。理由：结构最接近、已接两层公共能力、
   业务专属流程可清晰隔离。数据订阅留作后续。
4. **不提取项**：是否同意本轮**不**提取请求 composable、二次确认组件、
   状态标签视觉、行操作菜单组件，只固化契约与使用示例？
   推荐：**同意**。理由：两页行为有意不同，强行统一会改变已验收语义。

若负责人对第 1 项有不同取舍，请明确保留/删除哪一项；
若对第 3 项选择数据订阅，则第三阶段需先新增“结构改造评估”子任务。

## 9. 已发现的文档与源码时序差异（只记录，不修改）

按任务要求，历史文档与当前源码不一致时**列明事实与影响**，本任务不清洗旧文档。

1. **查询列表页模板 README 头部状态块与后文收口记录存在时序差**：
   头部仍写 `shared_component_*_PENDING`，而文件后部 2026-09-17 最终接受收口记录载明
   补充验收 `21/21` PASS、项目负责人最终接受。本盘点以后文收口记录为现行权威，
   头部旧值属历史快照；是否清理由后续独立文档任务决定。
2. **列表表格模板 `MIGRATION.md` 的探针行是历史盘点**：
   其中“固定行高 60px、批量工具栏、多选选中态”描述的是该盘点时点，
   当前源码已改为内容驱动行高、单行固定高亮、三点入口、无批量工具栏。
   本盘点的 C4/C5 以当前源码为准，**不**依据旧行描述当前行为。
3. **数据源页“更多”入口未迁移**：`list-table` 与 CED 基线均明确记录
   `/config/data-source` 未获授权；当前源码仍是文字“更多”、`editor-dialog`，
   与基线一致。
4. **探针页 Tooltip**：页面使用私有 `.cc-single-tip`（`ClientConfigPage.vue:427-430`、
   `:1806`），**未**使用公共 `QueryListTooltipHost`。这不是缺陷，但说明
   “已接入查询列表组件”不等于“所有子能力都已接入”；本模板不强行统一 Tooltip。

## 10. 源码索引（固定 SHA）

| 对象 | 路径 | 关键行 |
|---|---|---|
| 页面骨架 | `frontend/src/components/query-list/QueryListPageShell.vue` | `2-12`、`41-47` |
| 查询容器 | `frontend/src/components/query-list/QueryListQueryPanel.vue` | `2-6`、`45-49` |
| 查询/重置按钮 | `frontend/src/components/query-list/QueryListActions.vue` | `27-59`、`63-89` |
| 结果面板 | `frontend/src/components/query-list/QueryListResultPanel.vue` | `2-18`、`29-40` |
| 公共导出 | `frontend/src/components/query-list/index.ts` | `2-18` |
| 列表表格 CSS | `frontend/src/styles/list-table/list-table-visual.css` | `10-100` |
| 列表表格常量 | `frontend/src/styles/list-table/index.ts` | `6-16` |
| 弹窗 CSS | `frontend/src/styles/dialog/create-edit-dialog-visual.css` | `21-121` |
| 弹窗常量 | `frontend/src/styles/dialog/index.ts` | `9-55` |
| 探针页 | `frontend/src/views/client-config/ClientConfigPage.vue` | 见 C1-C10 各行 |
| 数据源页 | `frontend/src/views/data-source/DataSourcePage.vue` | 见 C1-C10 各行 |
| 数据订阅页 | `frontend/src/views/data-subscribe/DataSubscribePage.vue` | `3-187`、`200-390` |
| 数据订阅主弹窗 | `frontend/src/views/data-subscribe/components/SubscribeFormDialog.vue` | `1-140`（结构抽样） |
| 探针测试 | `frontend/src/views/client-config/ClientConfigPage.spec.ts` | 全文件 |
| 数据源测试 | `frontend/src/views/data-source/dataSource.spec.ts` | 全文件 |
| 查询组件测试 | `frontend/src/components/query-list/*.spec.ts` | 6 个组件测试 + `shared-layer.spec.ts` |
| 表格静态测试 | `frontend/src/styles/list-table/list-table-visual.spec.ts` | 全文件 |
| 弹窗静态测试 | `frontend/src/styles/dialog/create-edit-dialog-visual.spec.ts` | 全文件 |
| 路由 | `frontend/src/router/index.ts` | `/config/data-source`、`/config/client`、`/config/subscribe`、`/config/server` |

## 11. 边界声明

- 本文件所有分类与建议**未被批准**；未批准前不得创建公共代码、修改页面、
  更新迁移状态或据此安排实施；
- 探针端管理的 157 条正式验收**不**传播为本模板或任何其他页面的验收结论；
- 数据源管理是**候选页**，不是已授权迁移页；
- 本任务未运行任何测试、构建、浏览器、业务接口、数据库或服务操作，
  不得把本文件的静态结论写成运行验证通过。
