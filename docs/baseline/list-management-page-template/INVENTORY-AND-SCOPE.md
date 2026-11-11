# 公共列表管理页模板 · 能力盘点与第一步范围（第三步数据源页已接入，待复审与视觉验收）

```text
list_management_page_template_document_status=PHASE_3_IMPLEMENTED_PENDING_REMOTE_REVIEW_AND_OWNER_VISUAL_ACCEPTANCE
list_management_page_template_baseline_status=NOT_APPROVED
task_scope=PHASE_3_DATA_SOURCE_THREE_STYLE_ADOPTION
task_code=PUBLIC-LIST-MANAGEMENT-TEMPLATE-PHASE-3-DATA-SOURCE-ADOPTION-001
original_inventory_task_code=PUBLIC-LIST-MANAGEMENT-TEMPLATE-INVENTORY-AND-SCOPE-DRAFT-001
inventory_source_commit=6560c73fb71aa5b8441de4a57fe777d7810b12da
r0_result_commit=03e4bffa49e3a74300a7c604969130473017a631
r1_result_commit=1550aac92f13d47bade188ade46d8524cec51c64
r2_result_commit=5695a2de345ae66e0d34081b7f1b7b033675a1f1
owner_scope_confirmation_status=CONFIRMED_LINE_BY_LINE_SIX_OF_SIX
owner_scope_confirmation_date=2026-11-11
phase_1_scope_status=CONFIRMED
phase_2_first_reference_page=/config/client
phase_2_implementation_status=IMPLEMENTED
phase_2_implementation_task_code=PUBLIC-LIST-MANAGEMENT-TEMPLATE-PHASE-2-IMPLEMENTATION-001
phase_2_implementation_commit=e1880494a50d7ad9842b4db9026963efc84e6441
phase_2_implementation_base_commit=4809577c3ee4733780052a674c54d9cecb215ef2
phase_2_style_entry=frontend/src/styles/list-management/list-management-visual.css
phase_2_probe_adoption=CLASSES_BOUND_OLD_PRIVATE_RULES_REMOVED
phase_2_remote_code_review_status=APPROVED
phase_2_remote_code_review_reviewer=CHATGPT
phase_2_remote_code_review_date=2026-11-11
phase_2_remote_code_review_target_commit=e1880494a50d7ad9842b4db9026963efc84e6441
phase_2_owner_visual_acceptance_status=PASSED
phase_2_owner_visual_acceptance_date=2026-11-11
phase_2_owner_visual_acceptance_scope=/config/client_THREE_SHARED_STYLES_AND_PAGE_PRESENTATION
phase_2_acceptance_status=NOT_EXECUTED
phase_2_closeout_status=CLOSED
owner_phase_3_scope_confirmation_status=CONFIRMED_THREE_STYLES_ONLY
owner_phase_3_scope_confirmation_date=2026-11-11
phase_3_candidate_status=SELECTED_AND_AUTHORIZED_FOR_THREE_STYLES
phase_3_scope_decision_status=CONFIRMED_THREE_STYLES_ONLY
phase_3_implementation_status=IMPLEMENTED
phase_3_implementation_task_code=PUBLIC-LIST-MANAGEMENT-TEMPLATE-PHASE-3-DATA-SOURCE-ADOPTION-001
phase_3_implementation_commit=RECORDED_IN_TASK_RESULT_OUTPUT
phase_3_implementation_base_commit=0030a1c74776a37e41fec905a880af9eab831395
phase_3_adoption_page=/config/data-source
phase_3_adoption_scope=THREE_SHARED_STYLES_ONLY
phase_3_adoption_status=CLASSES_BOUND_OLD_PRIVATE_RULES_REMOVED
phase_3_remote_code_review_status=PENDING
phase_3_owner_visual_acceptance_status=NOT_EXECUTED
phase_3_closeout_status=NOT_CLOSED
product_code_change_status=PHASE_3_THREE_STYLE_ADOPTION_ONLY
page_migration_status=NOT_STARTED
next_entry=PHASE_3_REMOTE_CODE_REVIEW_AND_OWNER_VISUAL_ACCEPTANCE
```

> 本文件是[README.md](./README.md)的配套盘点。第一步六项范围已由项目负责人于
> `2026-11-11` 逐行确认（R2 草案锚点 `5695a2de345ae66e0d34081b7f1b7b033675a1f1`）；
> 第二步最小实现提交 `e1880494a50d7ad9842b4db9026963efc84e6441`（基线
> `4809577c3ee4733780052a674c54d9cecb215ef2`）已在探针端管理落地，ChatGPT 远端只读代码
> 复审通过，项目负责人于 `2026-11-11` 对 `/config/client` 三项共用样式及页面呈现反馈
> 视觉验收通过，第二步据此收口（详见 README §0.1–§0.2）。
>
> 项目负责人已确认第三步只验证数据源管理 `/config/data-source` 主列表的三项样式；
> 本轮已按该范围接入同一公共样式、删除四项私有同义规则，当前为**已实现、待远端复审
> 与负责人视觉验收**（详见 README §0.3）。其余候选形态与候选页仍未被批准，不得引用为
> 现行规则。第一步源码证据的路径与行号基于固定 SHA
> `6560c73fb71aa5b8441de4a57fe777d7810b12da`；第二、三步实现事实以现行源码为准。
>
> **口径区分：** `phase_2_acceptance_status` 保持 `NOT_EXECUTED`，表示未单独开展
> “独立正式验收执行”，不得解读为已通过；第二步负责人视觉验收另以
> `phase_2_owner_visual_acceptance_status=PASSED` 独立记录。第三步的
> `phase_3_remote_code_review_status=PENDING`、`phase_3_owner_visual_acceptance_status=NOT_EXECUTED`
> 同样不得预写通过。
>
> 两步均只涉及三项显式 opt-in 纯 CSS、页面类替换与静态测试；未迁移页面结构或业务行为，
> 未改变任何已批准模板、页面迁移状态或既有 Feature 验收状态。

## 1. 盘点方法与判定口径

### 1.1 证据分层

| 标记 | 含义 |
|---|---|
| **源码现行事实** | 在固定 SHA 的源码／CSS 中可直接核验，附路径与行号 |
| **已有基线** | 来自三套既有模板或 Feature 现行基线，附基线位置 |
| **本次建议** | 盘点提出的形态、候选或后续推荐；除已确认的六项范围外**尚未批准** |

### 1.2 分类定义

| 分类 | 含义 |
|---|---|
| **直接复用** | 既有公共能力已覆盖，本模板只规定用法，不新增代码 |
| **本期提取** | 第二阶段提取为新的公共能力；已由探针页与数据源页显式接入 |
| **可选扩展** | 有跨页价值，但本期不做，留作后续独立评估 |
| **业务专属** | 含业务语义或页面差异，应留在 Feature 页面 |
| **暂不提取** | 本期仅固化契约与检查项，不新增公共代码 |

### 1.3 “本期”与“后续”

- **本期** = 第三步数据源管理主列表的**三项样式复用验证**（已实现，待复审与视觉验收）；
- **后续** = 数据源“更多”改三点、主弹窗接入 `ced-dialog` 及其他页面的独立任务；
- 三项 CSS 与统一交互约定已由负责人确认；选择器、公共菜单、确认框、状态标签与请求逻辑
  仍为候选或暂缓项，未获实施授权。

## 2. 能力矩阵总表

| # | 能力 | 现行实现位置 | 公共化状态 | 分类 | 目标形态 | 阶段 |
|---|---|---|---|---|---|---|
| C1 | 页面骨架 | `query-list/QueryListPageShell.vue` | 6 组件 + 1 composable 已实现；权威验收 21/21；参考页 + 两页页面级接入 | 直接复用 | Vue 组件（既有） | 已完成（范围已确认） |
| C2 | 搜索栏 | `QueryListQueryPanel` + `QueryListActions` + 页面字段组 | 容器/按钮已实现；字段组已收敛到公共 CSS（探针页） | 直接复用 + 第二阶段提取（字段组 CSS，已落地） | 既有组件 + 纯 CSS opt-in；选择器候选 | 第二阶段已收口；第三步数据源页已接入（待复审与验收） |
| C3 | 结果工具栏 | `QueryListResultPanel` 槽位 + 页面摘要/新增按钮 | 面板已实现；摘要与按钮已收敛到公共 CSS（探针页） | 直接复用 + 第二阶段提取（摘要/按钮 CSS，已落地） | 既有组件 + 纯 CSS opt-in | 第二阶段已收口；第三步数据源页已接入（待复审与验收） |
| C4 | 无分页表格 | `list-table-visual.css` + `lt-main-table` | 基础 + DS 参考页 14/14 最终接受；可选三点/单行高亮已实现、复审 `APPROVED`，探针页面级接入、待接受 | 直接复用 | 纯 CSS + 可选辅助类；成组入口统一三点 | 已完成（复用） |
| C5 | 行操作菜单 | `lt-row-action__*` 外观 + 页面 `ElDropdown` | 仅三点外观公共化；菜单与忙碌状态页面实现 | 直接复用 + 用法契约（成组入口统一三点） | 既有 CSS + 用法契约 | 第三阶段评估（DS 替换单独记录） |
| C6 | 新增／编辑弹窗 | `create-edit-dialog-visual.css` | 公共 CSS 已实现、代码复审 `APPROVED`；仅探针页面级接入且接入复审通过；模板正式验收 `NOT_EXECUTED`；Vue `NOT_CREATED` | 直接复用（CSS，按需）；暂不提取（Vue 包装） | 既有 CSS + 令牌 | 第三阶段评估（DS 弹窗单独记录） |
| C7 | 二次确认 | 两页 `ElMessageBox.confirm` | 未公共化 | 暂不提取（统一契约） | 契约 + 使用示例 | 无（契约已确认） |
| C8 | 状态标签 | 两页私有胶囊／`el-tag` | 未公共化 | 业务专属（状态文字优先、颜色辅助；公共标签暂缓） | 页面实现 | 无（展示纪律已确认） |
| C9 | 请求流程 | 两页序列令牌、忙碌集合、提交守卫 | 未公共化 | 暂不提取（统一契约） | 契约 + 检查项 | 无（契约已确认） |
| C10 | 列表刷新 | 两页保存/启停/删除后重载与稳定 ID 重选 | 未公共化 | 暂不提取（统一契约） | 契约 + 检查项 | 无（契约已确认） |
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

- `frontend/src/components/query-list/index.ts` 导出 **6 个公共组件**
  （`QueryListPageShell`、`QueryListQueryPanel`、`QueryListActions`、
  `QueryListResultPanel`、`QueryListRefreshToolbar`、`QueryListTooltipHost`）
  与 **1 个 Tooltip composable**（`useQueryListTooltip`，位于
  `frontend/src/composables/query-list/useQueryListTooltip.ts`）。
- `docs/baseline/query-list-page-template/README.md` 后文 2026-09-17
  最终接受收口块为**当前权威状态**：原正式验收 17/17 为历史阶段事实，
  补充正式验收 **21/21 PASS**，二者是包含关系（补充验收包含原 17 项重放），
  **不得相加**；参考页为「源库快照状态」（`/monitor/data-source-state`）；
  项目负责人最终接受 `ACCEPTED_BY_PROJECT_OWNER`；
  `page_migration_status=NOT_STARTED`、`page_migration_authorization_status=NOT_GRANTED`。
- 页面级接入：数据源管理（2026-09-18 授权 / 2026-09-19 记录）、
  探针端管理（2026-09-22 授权 / 2026-09-23 实现），见同目录 `MIGRATION.md`；
  两页接入是**页面级事实**，不改变模板级迁移状态。

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
- 字段组原为页面私有（接入前形态）：探针 `.cc-q-group/.cc-q-label`、
  数据源 `.ds-q-group/.ds-q-label`；两处均为 `inline-flex; align-items:center; gap:6px`
  + 标签 `13px` 常规色、`nowrap`，数值一致但无公共来源。第二、三阶段已分别改用
  `.lmt-q-field/.lmt-q-label` 公共类并删除私有规则（见 §5、§5.1）。
- 回车查询是**页面绑定**，不是组件能力。
- 重置语义是**页面策略**：两页都只清空查询控件，**不发起请求**、不改已应用条件与当前结果
  （探针 `:705-711`；数据源 `:608-611`）。
- 已应用条件与草稿分离：探针 `appliedKeyword/appliedStatus`，数据源 `effectiveQuery`。

**已有基线**

- `docs/baseline/query-list-page-template/SHARED_COMPONENT_DESIGN.md` 明确：
  重置默认只发 `reset`，是否查询由调用方决定；`busy` 时两个事件都不触发。

**分类（2026-11-11 已确认）：**

- 容器、按钮、常量：**直接复用**；
- 字段组排版（标签 + 控件）：**第二阶段提取（纯 CSS，已在探针页落地，第二步已收口）**；
- 文本查询控件：**直接复用现有基础控件**，查询字段与匹配方式由页面决定；
- 数据源／探针端选择器：**公共控件候选**——选择已有数据源或探针端时用下拉框，
  允许选择多个对象的列表筛选用多选下拉框；两类选择器待实际使用它们的页面验证后
  再决定是否封装，本阶段不提取；
- 来源／角色／状态候选与各页“全部”语义、回车绑定、重置默认值与已应用条件快照：
  **业务专属**，由页面实现，并按统一交互约定约束（见 [README.md](./README.md) §5.1）。

**已落地提取形态（第二、三阶段）**

- 公共源：`frontend/src/styles/list-management/list-management-visual.css`；
- 新增显式 opt-in 类：`.lmt-q-field`（`inline-flex`、垂直居中、`gap:6px`）、
  `.lmt-q-label`（`13px`、常规文字色、`nowrap`）。固定字面量，不新增令牌。
- 接入页：探针端管理（第二阶段）、数据源管理（第三阶段，已实现待复审与验收）；
  两页均替换各自私有字段组类并删除私有规则，字段宽度仍留页面。
- 字段组排版提供**默认对齐、组内间距与整组换行**：标签与控件作为一个 flex 项整体换行，
  不拆开；换行位置仍由 `QueryListQueryPanel` 既有 `flex-wrap:wrap; gap:8px 14px` 决定，
  公共 CSS 不改写其 gap 或换行方式。
- 不新增 Vue 组件或容器；字段数量、宽度、默认值与控件类型继续由页面提供。

**统一交互约定（已确认，非公共代码）**

- 文本查询框按回车等同点击查询；
- 下拉展开时回车确认选项；
- 中文输入法选字期间的回车只用于确认文字，不触发查询；
- 重置恢复页面默认条件，不在重置时立即查询；已应用条件与列表在下一次显式查询时更新；
- 查询使用“已应用条件快照”，不在请求进行中读取未提交的草稿值。

**输入／输出／扩展点：** 公共层只提供类与排版；页面提供控件、宽度、字段名、下拉选项、
回车绑定与查询快照。无事件、无插槽新增。

**默认行为与允许差异：** 默认横向流式排列、整组换行；不同页面的字段数量、控件类型、
宽度、下拉选项、来源/角色/状态候选及“全部”含义均允许不同。

**兼容风险：** 新类必须只影响显式挂载的字段组；不得改动 `QueryListQueryPanel`
的 gap/换行；不得把字段宽度写入公共层。需在真实浏览器验证窄视口换行与对齐。
选择器公共化需另立评估，不能在第二阶段顺手封装。

### C3 结果工具栏

**源码现行事实**

- `QueryListResultPanel.vue:2-18`：DOM 顺序固定为
  `header → error-slot → divider → body`；`summary` 与 `toolbar` 两个槽位；
  props `summaryText`、`errorText`、`variant`。
- 探针页（第一步固定 SHA 事实）：摘要 `.cc-result-count`（`ClientConfigPage.vue:1557-1561`），
  新增按钮 `.cc-btn-add`（`:1563-1590`，`#09090b/#27272a/#18181b`，
  `:not(.is-disabled)` 只改正常态），图标间距 `.cc-btn-icon`（`:1592-1595`）。
  第二阶段已把摘要与按钮替换为 `.lmt-result-count` / `.lmt-add-button`，图标间距仍留页面。
- 数据源页（接入前形态）：摘要 `.ds-result-count`、新增按钮 `.ds-add-button`，
  数值与状态选择器与探针页一致；第三阶段已替换为 `.lmt-result-count` / `.lmt-add-button`
  并删除私有规则（见 §5.1）。
- 两页在 `toolbar` 槽放“新增”主按钮；本阶段不接入自动刷新工具栏
  （两页均无自动刷新需求，`QueryListRefreshToolbar` 保持可选）。

**分类（2026-11-11 已确认）：**

- 结果面板结构与槽位：**直接复用**（左侧摘要、右侧按需放操作入口）；
- 摘要文字样式、新增主按钮视觉：**第二阶段提取（纯 CSS）；已由探针页与数据源页显式接入**；
- 自动刷新工具栏：**暂不提取**（只适用于只读查询页的 opt-in 能力，本模板不默认启用）。

**已落地提取形态（第二、三阶段）**

- 公共源：`frontend/src/styles/list-management/list-management-visual.css`；
- 接入页：探针端管理（第二阶段）、数据源管理（第三阶段，已实现待复审与验收）；
  两页均保留各自摘要文案、按钮图标与点击行为，仅替换视觉类并删除私有规则。

- 结构不新增：结果摘要继续使用 `QueryListResultPanel` 既有 `summaryText` prop
  或 `summary` 槽渲染，新增按钮继续放在 `toolbar` 槽；公共层只替换文字／按钮视觉。
- `.lmt-result-count`（`14px/600/主文字色`）；
- `.lmt-add-button`（`#09090b` 常态、`#27272a` hover/focus、`#18181b` active、
  圆角 `6px`、字重 `500`，` :not(.is-disabled)` 限定正常态）。
- 固定字面量、显式 opt-in，不新增令牌；条数口径、文案、图标、可见与禁用条件、
  点击行为均由页面提供。

**输入／输出／扩展点：** 无 props/emits；页面通过 `summary`/`toolbar` 槽组合。

**默认行为与允许差异：** 摘要文案（“共 N 条”）与条数口径由页面决定；
新增按钮是否出现、是否 loading、何时禁用由页面决定。

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

**已有基线（分层记录，互不替代）**

- **表格基础 + 数据源参考页**：公共实现与数据源管理主列表等价接入，
  本地正式验收 `14 PASS / 0 FAIL / 0 BLOCKED / 0 NOT_RUN`，
  ChatGPT 远程复审 `REVIEW_PASS`，项目负责人 2026-09-22 最终接受并关闭。
- **可选三点入口**（`lt-row-action__cell` / `lt-row-action__ellipsis`）：
  设计基线 2026-09-29 批准；公共实现已落地；`/config/client` 主列表页面级接入；
  代码复审 `APPROVED`（2026-09-30）；现行实现状态
  `IMPLEMENTED_PENDING_USER_ACCEPTANCE`（**未**正式验收）。
- **可选单行固定高亮**（`lt-row-highlight` / `lt-row-highlight__row`）：
  设计基线 2026-09-29 批准；公共实现已落地、代码复审 `APPROVED`（2026-09-30），
  状态 `IMPLEMENTED_PENDING_USER_ACCEPTANCE`；`/config/client` 主列表页面级接入，
  接入代码复审 `APPROVED`、负责人反馈页面无问题（**非**正式验收）。
- **共同边界**：以上均为公共实现或**页面级**接入事实；
  模板级 `page_migration_status=NOT_STARTED`、
  `page_migration_authorization_status=NOT_GRANTED`，未授权任何其他页面迁移。

**分类（2026-11-11 已确认）：直接复用。** 表头、间距与内容驱动行高沿用既有模板；
分页／页大小／虚拟滚动／固定行高均为业务选择，公共层不提供、不默认。

**行操作入口约定（2026-11-11 已确认）：**

- 操作列中用于**展开一组行操作**的入口统一使用**水平三点图标**，沿用既有
  `lt-row-action__cell` / `lt-row-action__ellipsis` 样式，保留点击区域、键盘打开，
  以及读屏可识别的“更多操作”名称；
- “编辑”“查看”等**直接操作**按页面需求展示，不必包进三点菜单；
- 探针端管理已使用三点；数据源管理的文字“更多”记入后续接入计划，替换时
  **保留原菜单项、顺序、禁用条件与业务行为**（见 §6.2）；
- 单行高亮按需启用；列、选中、双击编辑与分页由页面决定。

**输入／输出／扩展点：** 页面在 `el-table` 根节点挂根类；
可选挂 `lt-row-highlight` 并通过 `row-class-name` 提供行级类；
其余列定义、行事件、行高由页面负责。

**默认行为与允许差异：** 行高内容驱动；是否选中、双击编辑、固定操作列、
`show-overflow-tooltip`、空状态均允许不同。

**兼容风险：** 固定行高会与内容驱动纪律冲突；`+N`、长异常值、固定右列、
Tooltip 共存需真实浏览器验证；未 opt-in 页面必须零匹配。三点替换属视觉变更，
需页面级授权与键盘可达性验证。

### C5 行操作菜单

**源码现行事实**

- 公共层只提供**外观**：三点触发器命中区与交互态、操作单元格纵向补偿；
  不提供菜单、条目、权限、请求或忙碌逻辑。
- 探针页（`ClientConfigPage.vue:200-249`）：操作列 `td` 挂 `lt-row-action__cell`，
  触发器 `cc-more-link lt-row-action__ellipsis`，带 `role="button"`、
  `tabindex="0"` 与 `aria-label`；`ElDropdown` 的 trigger 与菜单
  均 `@click.stop` / `@dblclick.stop`；条目为停用/启用、删除，删除 `divided`；
  **菜单项** `:disabled="rowBusy(row)"`，**触发器本身不禁用**；
  处理函数 `onEnable/onDisable/onDelete` 均以 `if (rowBusy(row)) return` 做**行级**守卫，
  其他行操作不被阻塞。
- 数据源页（`DataSourcePage.vue:129-183`）：触发器是**文字“更多”+ 箭头**
  （`.row-more`），未使用公共三点类，也未设置 `tabindex` / `role`；
  触发器与弹层均 `@click.stop` / `@dblclick.stop`；
  条目按角色/异常状态动态变化：异常行仅“停用”；正常行按 SOURCE/TARGET 显示
  命名策略/业务属性，再是启用/停用、删除；停用/启用菜单项按 `rowBusy(row)` 禁用，
  **删除菜单项在 `deletingId` 或 `statusBusyId` 任一非空时全局禁用**；
  `onToggleStatus` 与 `onDelete` 处理函数另有**全局守卫**
  （任一忙碌 ID 非空即拒绝，`:649` / `:683`），因此数据源页的写操作是
  行级提示 + 全局串行，而不是完全并发的行级忙碌。

**分类（2026-11-11 已确认）：**

- 三点**外观**与成组入口统一三点：**直接复用**；
- 触发器事件隔离、菜单项集合/顺序/文案/可用条件/忙碌与锁定范围：**业务专属**；
- 菜单项危险/警示色调预设：**可选扩展**（两页存在重复颜色，
  但 Popper 为页面命名空间，暂不提取）；
- 公共 Vue 菜单组件、公共确认框组件：**暂不提取**（仅以契约约束）。

**已确认契约（不新增组件）**

- 行操作菜单由页面使用 `ElDropdown` 实现；成组入口统一使用水平三点；
- **统一防误触**：触发器与菜单必须阻止 `click` / `dblclick` 冒泡，
  避免误触行选中或双击编辑；
- **取消二次确认不发写入请求**；确认未决或执行期间同一操作防重；
- **触发器禁用**与**菜单项禁用**分开判断，且**并发粒度按页面契约**：
  探针页为纯行级（只锁当前行，其他行可并发）；数据源页为行级提示 + 写处理函数全局守卫
  （`statusBusyId` / `deletingId` 任一非空即拒绝）。公共层不得把其中一种写成唯一规则；
- 触发器是否可键盘聚焦也按页面：探针三点触发器可聚焦；数据源“更多”当前不可聚焦，
  若改为三点应一并评估键盘可达性；
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
  **Vue 组件 `NOT_CREATED`**；仅 `/config/client` 新增／编辑主弹窗获**页面级**授权，
  接入已实现且接入代码复审 `APPROVED`；项目负责人人工测试反馈 `NO_ISSUE_REPORTED`
  （**非**正式验收、**不**构成任何 AC 的 `PASS`）；
  模板独立**正式验收 `NOT_EXECUTED`**；数据源管理弹窗**未授权**。

**分类（2026-11-11 已确认）：**

- 公共 CSS、辅助类、令牌：**直接复用（按需）**——按需复用现有字段标签、
  保存按钮和错误提示视觉；
- Vue 包装组件：**暂不提取**（`NOT_CREATED`，且尚无收益/兼容证据）；
- 表单布局、字段、校验、保存与关闭顺序、请求，以及测试连接、业务属性、命名策略等：
  **业务专属**，按对应功能实现。

数据源管理弹窗接入 `ced-dialog` 属第三阶段可独立决定的后续项，不与第二阶段三项样式
捆绑（见 §6.2）；本阶段不实施。

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

**分类（2026-11-11 已确认）：暂不提取（公共确认框组件暂缓）。**

理由：确认框承载业务语义（启用/停用/删除、可恢复性、颜色语气）、
请求时序与忙碌占位；公共化会迫使不同业务共享同一文案/颜色/时序。
`ElMessageBox` 本身已是公共基础，无需再包一层组件。

**已确认契约 + 使用示例**

- **取消二次确认不发写入请求**（零写入）；
- **确认未决或执行期间同一操作防重**：请求在途或确认未决时不得再次弹确认或重复提交；
- 请求已发出但结果未知时不得自动重发；
- 失败时保留可恢复状态，不凭空改变选中/固定行；
- 菜单项、确认文案、可用条件与操作锁定范围由页面决定；
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

**分类（2026-11-11 已确认）：业务专属。** 状态以文字表达、颜色辅助识别；
状态集合、判定条件、文案、颜色语义、是否可操作均属 Feature 页面；公共层不预设
`FG_ACTIVE` 或任何状态码。公共状态标签视觉**暂缓提取**，仅记录展示纪律。

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
| 行级忙碌 | `busyClientIds` 集合，按行独立，无全局守卫 | 菜单项按行禁用，但 `onToggleStatus` / `onDelete` 有**全局守卫**：`statusBusyId` / `deletingId` 任一非空即拒绝，写操作全局串行 |
| 保存防重 | `submitting` 守卫 | `saving` + `editorLoading` 守卫 |
| 详情/测试防重 | 弹窗内单次打开 | `detailToken`、`testToken`、10 秒倒计时 |
| 关闭顺序 | 未保存确认 → 再关闭 | 未保存确认 → 再关闭；业务弹窗同样 |
| 成功后 | 重载列表；启停成功可按稳定 ID 重选 | 重载当前已应用条件 |

**已有基线**

- `query-list-page-template` 的公共组件设计明确把
  `useQueryListAppliedQuery`、`useQueryListSingleFlightRequest`、
  `useQueryListVisibleAutoRefresh` 列为**暂缓**，未实现。

**分类（2026-11-11 已确认）：暂不提取（统一契约 + 实现检查项，不新增公共代码）。**

理由：两页在“失败是否保留旧结果”“重选意图”“行级 vs 页级忙碌”上**有意不同**，
没有证据支持一个统一行为；函数名相似不等于契约相同。公共层若强行统一，
会改变已验收页面的业务语义。公共请求逻辑**暂缓提取**。

**已确认统一约定（不新增公共代码）：**

- 同一列表同一时刻只允许一个“最新请求”回写；
- 迟到的旧响应必须被序列令牌丢弃，不覆盖新结果；
- 请求已发出但结果未知时**不得自动重发**；
- 取消二次确认必须**零写入**；
- 请求在途或确认未决时不得重复提交、不得重复弹确认；
- 文本查询框回车等同点击查询；下拉展开时回车确认选项；中文输入法选字期间的回车
  只确认文字；
- 重置恢复页面默认条件，不立即查询；已应用条件与列表在下一次显式查询时更新。

**必须按页面契约表达，不得在公共层统一：**

- **失败处理**：探针保留上一次成功结果；数据源清空旧行并显示错误；
- **忙碌粒度与锁定范围**：探针纯行级；数据源行级菜单提示 + 写处理函数全局守卫；
- **重选意图**：探针仅启停成功的重载携带本次目标 ID，按最新成功结果重选；
  数据源无行选中/重选；普通查询/重载清空选择的规则也由各页契约决定；
- **成功刷新**：两页均使用“已应用条件快照”重载，但快照结构与触发时机由页面拥有；
- 稳定 ID 重选必须是**本次请求私有**的意图，不跨请求共享。

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

**分类（2026-11-11 已确认）：暂不提取（统一契约 + 实现检查项）。**
刷新时机、失败后保留或清空结果、是否重选均属页面；公共请求逻辑**暂缓提取**；
公共 `RefreshToolbar` 只服务于只读查询页的 opt-in 自动刷新，不应成为管理页默认。

**契约（通用部分 + 页面部分）：**

- **通用**：刷新必须有序列守卫，迟到的旧响应不得覆盖新结果；
  不把重选意图存入跨请求共享变量；
- **页面契约**：探针普通查询/重载清空选择，仅启停成功的重载携带本次目标 ID，
  失败/取消不改变现有选择；数据源无行选中，失败时清空旧行。两页不得互相套用；
- 选中 ID（若页面有）只存页面会话，不写 URL、浏览器存储、接口或数据库。

**后续验证：** 并发查询 + 启停 + 删除的真实竞态；稳定 ID 在结果中消失/出现；
分页（当前无分页）未来若引入需重新评估。

### C11 公共验收

**分类：本期建立（文档）。**

本模板不新增运行时代码即可建立分层验收框架，建议第二阶段起使用：

| 层 | 检查 | 是否可在本阶段完成 |
|---|---|---|
| 静态契约 | 路径/类名/令牌/opt-in 数量、零全局覆盖、零 `!important` | 是（文档核对） |
| 结构测试 | 组件渲染层级、DOM 顺序、槽位、属性 | 第二阶段（代码任务） |
| 构建 | `npm run build`（脚本已含 `vue-tsc --noEmit` + `vite build`）；`npm test` / `npx vitest run <定向文件>`；当前无独立 `type-check` / `lint` 脚本 | 第二阶段 |
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
| 字段组默认对齐、组内间距、整组换行（第二阶段已落地） | 字段数量、宽度、默认值、查询字段与匹配方式 |
| 结果卡片结构、错误槽与分隔线 | 错误码解释、错误文案、失败保留/清空策略 |
| 结果摘要与新增主按钮视觉（第二阶段已落地） | 条数口径、文案、图标、可见/禁用条件、点击行为 |
| 表格基础视觉、内容驱动行高、可选三点外观、可选单行高亮 | 列定义、选中、双击编辑、分页、行事件 |
| 成组入口统一三点、点击区域、键盘打开、ARIA“更多操作”名称 | 菜单项集合/顺序/文案/可用条件/锁定范围、业务行为 |
| 弹窗标签、主提交按钮、错误提示视觉（按需） | 表单布局、校验规则、保存/关闭顺序、业务专属流程 |
| 统一回车与重置语义 | 页面默认条件、已应用条件快照、下一次显式查询时机 |
| 状态以文字表达、颜色辅助 | 状态判定、异常展示、颜色语义 |
| 显式 opt-in 类与有限令牌 | 业务权限、启停/删除语义、确认文案 |
| 零泄漏与未启用页零影响 | 稳定 ID、重选意图、重复提交防护、并发竞态 |
| 数据源／探针端选择器候选（未封装） | 来源/角色/状态候选、多选筛选、“全部”语义 |

### 4.2 唯一维护位置

| 规则 | 唯一维护位置 |
|---|---|
| `.ql-page` / `.ql-q-panel` / `.ql-actions` / `.ql-result-panel` | `frontend/src/components/query-list/*` |
| `.lt-main-table` / `--lt-*` / `lt-row-action__*` / `lt-row-highlight*` | `frontend/src/styles/list-table/list-table-visual.css` |
| `.ced-dialog` / `ced-*` / `--ced-*` | `frontend/src/styles/dialog/create-edit-dialog-visual.css` |
| 查询字段组、结果摘要、新增按钮（已由探针页与数据源页显式接入） | `frontend/src/styles/list-management/list-management-visual.css` |

页面**不得**保留与上述来源同义的私有副本；迁移时删除私有规则，
而不是两套并存。

## 5. 探针端管理接入改动（第二阶段，已落地并收口）

探针端管理已是最接近目标的页面，第二阶段在此页**只做视觉归并**：

| 现状（第一步固定 SHA） | 已实施改动 | 业务行为 |
|---|---|---|
| `.cc-q-group/.cc-q-label` 私有字段组 | 已改用公共字段组类（`.lmt-q-field`/`.lmt-q-label`），删除私有规则 | 不变 |
| `.cc-result-count` 私有摘要 | 已改用公共摘要类（`.lmt-result-count`），删除私有规则 | 不变 |
| `.cc-btn-add` 私有新增按钮 | 已改用公共新增按钮类（`.lmt-add-button`），删除私有规则 | 不变 |
| 数据源／探针端下拉与多选下拉选择器 | 保持页面现有控件；公共化候选，不在本阶段提取 | 不变 |
| `.cc-inactive-mark` 等状态胶囊 | **本期不动**（业务专属） | 不变 |
| 三点入口、单行高亮 | 已接公共层，**不动** | 不变 |
| `ced-dialog` 弹窗 | 已接公共层，**不动** | 不变 |
| 页面私有 Tooltip `.cc-single-tip` | **本期不动**；未使用 `QueryListTooltipHost`，记录为差异 | 不变 |
| `+N` 打包、ID 三态、异常标识、行选中、双击编辑 | **不动** | 不变 |

**复用入口与样式归属：**

- 只新增三项显式 opt-in 纯 CSS 类；继续复用现有 6 个查询组件与三套旧 CSS，
  不新增 Vue 组件、composable 或容器；
- 公共源 `frontend/src/styles/list-management/list-management-visual.css` 只拥有
  “查询字段组排版、结果摘要、新增主按钮”三项视觉，未重写或复制
  `.ql-*`、`.lt-*`、`.ced-*` 规则；
- 字段组换行沿用 `QueryListQueryPanel` 既有 flex-wrap 契约，不改其 gap；
  结果摘要继续走 `QueryListResultPanel` 的 `summaryText`/`summary` 槽；
  新增按钮继续走 `toolbar` 槽；
- 探针页删除 `.cc-q-group` / `.cc-q-label` / `.cc-result-count` / `.cc-btn-add`
  四项私有同义规则，避免双来源；其他页面不挂新类即零命中、零泄漏。

**回归范围：** 文本查询回车、下拉回车、输入法选字回车、重置默认条件与已应用条件
更新时机、行选中与双击、三点菜单事件隔离、请求防重、确认取消零写入、
失败保留旧结果、稳定 ID 重选、AC-138 条件占位、AC-091/088 异常原值与 ID 省略；
构建与真实浏览器视觉等价。

**第二阶段实际验证（2026-11-11）：**

- 静态契约 `frontend/src/styles/list-management/list-management-visual.spec.ts`：
  四个类唯一来源、旧私有同义规则移除、非探针页零泄漏；
- 任务相关定向 Vitest 195/195 通过（`list-management-visual.spec.ts` 9 +
  `ClientConfigPage.spec.ts` 186）；`npm run build`（含 `vue-tsc --noEmit`）通过；
- 相邻 `create-edit-dialog-visual.spec.ts` 在基线 `4809577` 已存在 2 项静态断言失败
  （Feature 令牌清单与导入扫描），与本次改动无关，未修复，另行报告；
- 真实浏览器 1280×800 与 900×800：与基线（起始提交 `4809577`）规范化几何/样式
  JSON 零差异，探针页截图逐字节一致；未接入页 `/config/data-source` 的 `lmt-*`
  零命中且截图一致；
- 行为等价：文本框回车触发查询、重置不立即查询、新增入口打开/取消关闭、
  三点菜单不固定行且点击外部关闭，均与基线一致；
- 输入法选字回车与下拉回车未在本次浏览器环境单独复现，列为既有交互基线项，
  不重新声明为本次验证通过。

**第二步复审与视觉验收（2026-11-11）：**

- ChatGPT 已对实现提交 `e1880494a50d7ad9842b4db9026963efc84e6441` 做远端只读代码复审，
  结论 `APPROVED`；复审范围为字段组排版、结果摘要、新增按钮样式的等价提取，
  以及探针端管理页的接入和样式作用域；
- 项目负责人对探针端管理 `/config/client` 的三项共用样式及页面呈现明确反馈
  **视觉验收通过**（`phase_2_owner_visual_acceptance_status=PASSED`）；
- 以上为负责人视觉验收与 Agent 技术验证，**不是**独立正式验收执行；
  `phase_2_acceptance_status` 保持 `NOT_EXECUTED`；
- 第二步据此收口（`phase_2_closeout_status=CLOSED`），模板整体基线仍为 `NOT_APPROVED`。

**必须保留：** 157 条验收已覆盖的行为、AC-138 的条件占位、AC-091/088 的异常原值
与 ID 省略、菜单事件隔离、请求防重、取消零写。该页面任何后续改动都必须另立任务，
做等价回归并由负责人目视；本次第二阶段改动已按此执行并完成复审与视觉验收收口。

### 5.1 数据源管理接入改动（第三阶段，已实现，待复审与视觉验收）

项目负责人已确认第三步只验证数据源管理主列表的三项样式复用。本轮在该页**只做视觉归并**，
不改查询结构、表格、弹窗或业务行为：

| 数据源页原私有类 | 已实施改动 | 业务行为 |
|---|---|---|
| `.ds-q-group` / `.ds-q-label` 私有字段组 | 改用 `.lmt-q-field` / `.lmt-q-label`，删除私有规则；`.ds-q-input` 180px 与 `.ds-q-category` 140px 宽度保留 | 不变 |
| `.ds-result-count` 私有摘要 | 改用 `.lmt-result-count`，删除私有规则；摘要文案保留 | 不变 |
| `.ds-add-button` 私有新增按钮 | 改用 `.lmt-add-button`，删除四态私有规则；`.ds-add-icon` 图标间距、按钮文案、插槽与点击行为保留 | 不变 |
| 文字“更多”入口 | **本期不动**；改三点为后续独立决定 | 不变 |
| 新增/编辑主弹窗 `editor-dialog` | **本期不动**；接入 `ced-dialog` 为后续独立决定 | 不变 |
| 查询/重置/错误处理、表格、各项业务操作 | **不动** | 不变 |

**接入方式：** `DataSourcePage.vue` 以
`<style scoped src="@/styles/list-management/list-management-visual.css"></style>` 显式引入，
与探针页复用同一公共源；不修改公共样式值，不新增 Vue 组件或容器。
静态契约 `list-management-visual.spec.ts` 的允许接入页由一页扩为两页，分别断言显式引入、
类挂载、旧私有规则移除、公共源唯一与其他页面零泄漏；`dataSource.spec.ts` 仅定向迁移
旧类选择器，原断言保留。

**第三阶段实际验证（2026-11-11）：**

- 定向 Vitest 311/311 通过（`list-management-visual.spec.ts` 9 +
  `ClientConfigPage.spec.ts` 186 + `dataSource.spec.ts` 116）；`npm run build`
  （含 `vue-tsc --noEmit`）通过；
- 真实浏览器 1280×800 与 900×800：与实现前基线（同一后端只读数据，273 条）的规范化
  几何/样式 JSON 除预期类名外零差异，数据源页截图**逐字节一致**；
  1280 四个字段组同排、900 为两行整组换行；摘要位置与外观、新增按钮位置/样式及
  normal/hover/focus/active 四态一致；
- 行为等价：初始列表 GET、文本框回车查询、重置只清空草稿且不立即请求、
  下一次显式查询更新结果、新增弹窗打开并取消关闭，均与基线一致；无数据库写入；
- 回归与隔离：探针端管理 `/config/client` 仍正常挂载 6 个 `lmt-*` 元素，四态不变；
  未接入页 `/monitor/data-source-state` 的 `lmt-*` 零命中；
- 输入法选字回车与下拉回车未在数据源页单独复现，按既有交互基线保留。

**待执行：** 远端只读代码复审、负责人对 `/config/data-source` 的视觉验收。
模板整体基线仍为 `NOT_APPROVED`；本轮不构成其他页面迁移授权。

## 6. 第二页候选比较（第三阶段范围已确认）

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

- 结构接近度：**最高**；已接入查询列表组件与 `lt-main-table`，
  适合直接验证三项样式在该页的复用；
- **第三阶段接入页及范围**：项目负责人已于 `2026-11-11` 明确确认第三步只验证
  数据源管理主列表的三项样式；页面已按该范围接入（见 §5.1），
  第二步本身以探针端管理为首个参考页；
- 首选范围：仅主列表上的三项样式（查询字段组排版、结果摘要、新增主按钮），
  不改变业务行为；业务属性/命名策略/连接测试不进入模板；
- **分别记录、独立决定**（不与三项样式捆绑）：
  1. 文字“更多”改为公共三点入口——可见视觉变化并涉及键盘可达性；替换时
     **保留原菜单项、顺序、禁用条件与业务行为**；
  2. 新增/编辑主弹窗接入既有 `ced-dialog` CSS——需保留 EP 表单校验、全局错误区等
     业务差异，并删除页面私有同义规则；
- 风险：需回归已接受的 DS 行为；上述两项若实施，均需页面级授权与独立验收。

**结论：作为第三阶段第二页**，范围限定为三项样式，其余业务专属流程排除在外；
“更多”改三点、主弹窗接 `ced-dialog` 仍未实施，作为可独立决定的后续项。
**第三步范围已由负责人确认并完成接入（待远端复审与负责人视觉验收）；
页面级迁移授权仍为 `NOT_GRANTED`，本步不构成迁移。**

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

### 7.1 第一阶段（已完成，2026-11-11）

本收口只做文档适用检查：

- 路径与符号真实性（逐项对照固定 SHA `6560c73fb71aa5b8441de4a57fe777d7810b12da`）；
- 11 项能力分类覆盖、无遗漏；
- 相对链接有效、两文档口径一致；
- 状态措辞不把已确认范围写成已实施、不把未运行写成 `PASS`；
- `git diff --check` 无空白错误。

第一步范围已由项目负责人逐行确认（R2 锚点
`5695a2de345ae66e0d34081b7f1b7b033675a1f1`）。**不运行**产品测试、构建、浏览器、
业务接口或数据库。

### 7.2 第二阶段（已收口，2026-11-11）

- **已完成**：静态契约测试（`frontend/src/styles/list-management/list-management-visual.spec.ts`）
  断言三项新 CSS 仅含 opt-in 选择器、无全局覆盖、无 `!important`、类数量与文档一致、
  旧私有同义规则移除、非探针页零泄漏；
- **已完成**：定向测试与构建（按 `frontend/package.json` 实际脚本）：
  任务相关定向用例 195/195 通过（新增静态契约 9 + 探针页 186）；`npm run build`
  （已含 `vue-tsc --noEmit` 类型检查 + `vite build`）通过；
  当前无独立 `lint` / `type-check` 脚本，未虚构命令；
  相邻 `create-edit-dialog-visual.spec.ts` 的 2 项失败在基线 `4809577` 同样存在，
  属既有无关失败，未纳入本次通过口径；
- **已完成**：真实浏览器 1280×800 / 900×800：查询字段整组换行与对齐、
  摘要/按钮状态矩阵、未启用页零泄漏，与基线截图逐字节一致；
- **已完成**：行为等价（只做视觉归并，行为不变）：文本查询回车、重置默认条件与
  已应用条件更新时机、行选中/双击、菜单隔离、关闭顺序；下拉回车与输入法选字回车
  未单独复现，按既有交互基线保留；
- **已完成**：数据源／探针端选择器保持候选，未在本阶段提取；
- **已完成**：ChatGPT 对实现提交 `e1880494a50d7ad9842b4db9026963efc84e6441` 的远端只读
  代码复审 `APPROVED`；
- **已完成**：项目负责人 `2026-11-11` 对 `/config/client` 三项共用样式及页面呈现
  视觉验收通过（`phase_2_owner_visual_acceptance_status=PASSED`）；
- **未执行**：独立正式验收执行（`phase_2_acceptance_status=NOT_EXECUTED`）；
  视觉验收键与正式验收键分别记录，不得合并解读；
- 第二步已收口（`phase_2_closeout_status=CLOSED`）；模板整体基线仍为 `NOT_APPROVED`。

### 7.3 第三阶段（已实现，待远端复审与负责人视觉验收）

- 项目负责人已确认第三步只验证数据源管理主列表的三项样式：查询字段组排版、
  结果摘要、新增主按钮；页面已按该范围接入，细节与验证见 §5.1；
- **已完成**：定向 Vitest 311/311 通过（公共契约 9 + 探针页 186 + 数据源页 116）；
  `npm run build`（含 `vue-tsc --noEmit`）通过；
- **已完成**：真实浏览器 1280×800 / 900×800 与基线截图逐字节一致（273 行数据）；
  字段组整组换行与对齐、摘要位置与样式、新增按钮普通/悬停/聚焦/按下态、
  探针页不回归、未接入页 `/monitor/data-source-state` 零泄漏；
- **已完成**：行为等价（只做视觉归并）：文本查询回车、重置与查询按钮、
  新增弹窗打开与取消；未做任何数据库写操作；
- **待执行**：ChatGPT 远端只读代码复审；项目负责人对 `/config/data-source` 的视觉验收；
  独立正式验收（`NOT_EXECUTED`，与视觉验收分别记录）；
- “更多”改三点、主弹窗接 `ced-dialog` 未实施，分别独立授权、独立实现、独立验收；
- 真实后端失败/超时响应、键盘焦点顺序全量复现、写操作路径（如启停/删除/保存）
  未在本阶段运行；写操作如需数据库写入必须另行审批；
- 模板整体基线仍为 `NOT_APPROVED`；页面级迁移授权仍为 `NOT_GRANTED`。

### 7.4 静态分析的边界

静态阅读与文档核对**不能**证明：真实回车/焦点顺序、浏览器几何、
Tooltip 与 `+N` 共存、后端结果、并发竞态、写路径。上述均须在后续阶段运行；
未运行项只能记为 `NOT_RUN` 或后续验证项。

## 8. 第一步范围确认记录与后续事项

项目负责人已于 `2026-11-11` 逐行确认六项范围（R2 草案锚点
`5695a2de345ae66e0d34081b7f1b7b033675a1f1`），确认内容见
[README.md](./README.md) §0 总表。据此落定：

1. **第二阶段最小提取范围：已确认** —— 只新增三项显式 opt-in 纯 CSS
   （查询字段组排版、结果摘要、新增主按钮），不新建 Vue 组件、不新增 composable。
2. **首个参考页：已确认** —— `/config/client`（探针端管理），只做视觉归并、
   业务行为不变，按现有页面做视觉及行为等价验证。
3. **暂缓项：已确认** —— 本轮不提取公共菜单组件、确认框组件、状态标签视觉、
   请求 composable，只固化统一契约与使用示例。
4. **选择器候选：已确认** —— 数据源／探针端选择器（含多选下拉筛选）列为公共控件候选，
   在实际使用它们的页面验证后再决定是否封装，本阶段不提取。
5. **第三阶段：已确认（第一步时点为候选）** —— 第一步收口时数据源管理主列表为
   首选候选、接入页与范围待确认；`2026-11-11` 负责人已确认只验证三项样式并完成接入
   （见 §5.1）；其“更多”改三点、主弹窗接 `ced-dialog` 仍未实施、分别记录、独立决定；
   数据订阅保留为备选。

> 下方代码块为第一步收口时的历史快照；第二、三步实现与收口状态以文件头状态块为准。

```text
phase_1_scope_status=CONFIRMED
owner_scope_confirmation_status=CONFIRMED_LINE_BY_LINE_SIX_OF_SIX
owner_scope_confirmation_date=2026-11-11
r2_draft_anchor_commit=5695a2de345ae66e0d34081b7f1b7b033675a1f1
phase_2_minimum_scope=THREE_OPT_IN_CSS_ONLY
phase_2_first_reference_page=/config/client
phase_2_implementation_status=NOT_STARTED
phase_2_acceptance_status=NOT_EXECUTED
phase_3_candidate_status=CANDIDATE_NOT_AUTHORIZED
next_step=SEPARATE_PHASE_2_IMPLEMENTATION_TASK
```

## 9. 已发现的文档与源码时序差异（只记录，不修改）

按任务要求，历史文档与当前源码不一致时**列明事实与影响**，本任务不清洗旧文档。

1. **查询列表页模板 README 头部状态块与后文收口记录存在时序差**：
   头部仍写 `shared_component_*_PENDING`，而文件后部 2026-09-17 最终接受收口块
   为**当前权威状态**：补充验收 `21/21` PASS（包含原 `17/17` 重放，二者不得相加）、
   参考页「源库快照状态」、项目负责人最终接受、迁移 `NOT_GRANTED`。
   本盘点以后文收口块为准，头部旧值属历史快照；是否清理由后续独立文档任务决定。
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
| 公共导出 | `frontend/src/components/query-list/index.ts` | `2-18`（6 组件 + 1 composable） |
| Tooltip composable | `frontend/src/composables/query-list/useQueryListTooltip.ts` | 全文件 |
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

- 第一步六项范围已确认，但**模板基线仍为 `NOT_APPROVED`**；第二步、第三步实现均不构成
  模板整体批准或任何页面迁移授权；
- 三项 CSS 已在探针页与数据源页落地并通过静态契约、定向测试、构建与真实浏览器等价核对
  （见 §5、§5.1）；选择器、公共菜单、确认框、状态标签与请求逻辑仍为候选或暂缓项，未获实施授权；
- 第二步已收口：ChatGPT 远端代码复审 `APPROVED`、项目负责人视觉验收
  `PASSED`（2026-11-11）；**独立正式验收执行仍为 `NOT_EXECUTED`**；
  视觉验收键与正式验收键分别记录，不得互相替代；
- 第三步已实现，**仅为数据源管理主列表的三项样式接入**；远端代码复审 `PENDING`、
  负责人视觉验收 `NOT_EXECUTED`、独立正式验收 `NOT_EXECUTED`；
  “更多”改三点、主弹窗接 `ced-dialog` 未实施；
- 探针端管理的 157 条正式验收**不**传播为本模板或任何其他页面的验收结论；
- 数据源管理为第三步接入页，但**页面级迁移授权仍为 `NOT_GRANTED`**，
  三项样式接入不等于迁移；除探针页与数据源页外无其他页面接入；
- 已执行的运行验证只覆盖探针页与数据源页的三项样式归并及基线等价，不得把未运行项写成通过。
