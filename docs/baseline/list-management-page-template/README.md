# 公共列表管理页模板 · 组合入口与范围（第一步范围已确认）

```text
list_management_page_template_document_status=PHASE_1_SCOPE_CONFIRMED
list_management_page_template_baseline_status=NOT_APPROVED
task_scope=PHASE_1_SCOPE_APPROVAL_CLOSEOUT_DOC_ONLY
task_code=PUBLIC-LIST-MANAGEMENT-TEMPLATE-SCOPE-APPROVAL-CLOSEOUT-001
original_inventory_task_code=PUBLIC-LIST-MANAGEMENT-TEMPLATE-INVENTORY-AND-SCOPE-DRAFT-001
inventory_source_commit=6560c73fb71aa5b8441de4a57fe777d7810b12da
r0_result_commit=03e4bffa49e3a74300a7c604969130473017a631
r1_result_commit=1550aac92f13d47bade188ade46d8524cec51c64
r2_result_commit=5695a2de345ae66e0d34081b7f1b7b033675a1f1
owner_scope_confirmation_status=CONFIRMED_LINE_BY_LINE_SIX_OF_SIX
owner_scope_confirmation_date=2026-11-11
phase_1_scope_status=CONFIRMED
phase_2_first_reference_page=/config/client
phase_2_implementation_status=NOT_STARTED
phase_2_acceptance_status=NOT_EXECUTED
phase_3_candidate_status=CANDIDATE_NOT_AUTHORIZED
branch=develop
product_code_change_status=NONE
page_migration_status=NOT_STARTED_BY_THIS_TASK
next_entry=SEPARATE_PHASE_2_IMPLEMENTATION_TASK
```

> 本目录承载**第一阶段：盘点与范围确认**。项目负责人已于 `2026-11-11`
> 逐行确认六项范围（R2 草案锚点 `5695a2de345ae66e0d34081b7f1b7b033675a1f1`），
> 第一步范围状态为 `CONFIRMED`。模板基线仍为 `NOT_APPROVED`，**不是**实施设计，
> **不构成**任何页面迁移授权；第二阶段实现与验收均**未开始**。
>
> 本收口为**纯文档任务**：**未修改**产品代码、CSS、Vue 组件、测试、依赖、配置、
> 业务基线定义或既有验收状态；**未迁移**任何页面；**未运行**测试、构建、浏览器、
> 业务接口或数据库操作；**未启停**任何服务；**未访问** ZooKeeper / Kafka / 业务源库或目标库。
> 文中不能由静态源码或既有基线直接证明的运行效果，均列入后续验证项，**不写成已通过**。

## 0. 第一步范围总表（负责人已确认）

> 下表为项目负责人于 `2026-11-11` 逐行确认的六项范围（R2 草案锚点
> `5695a2de345ae66e0d34081b7f1b7b033675a1f1`）。逐项证据、源码行号与详细契约仍以
> [INVENTORY-AND-SCOPE.md](./INVENTORY-AND-SCOPE.md) 为准；模板基线仍为 `NOT_APPROVED`，
> 第二阶段实现与验收均未开始。

| 能力 | 确认决定 |
| --- | --- |
| 1. 页面骨架、搜索栏 | 复用现有骨架、查询区和查询／重置按钮。提取字段组排版，提供默认对齐、组内间距与整组换行，字段数量、宽度和默认值由页面决定。普通文本查询框直接用现有基础控件，页面决定查询字段和匹配方式。选择已有数据源或探针端时使用下拉框，允许选择多个对象的列表筛选使用多选下拉框。两类选择器列为公共控件候选，在实际使用它们的页面验证后再决定封装。候选来源、角色与状态筛选由页面负责，保留各页“全部”语义。文本查询框按回车等同点击查询，下拉展开时回车确认选项，中文输入法选字期间的回车用于确认文字。重置恢复页面默认条件，等下一次显式查询再更新已应用条件与列表。 |
| 2. 结果区、新增按钮 | 复用现有结果面板，左侧摘要、右侧按需放操作入口。提取结果摘要与右侧新增主按钮的公共样式。条数口径、文案、图标、可见和禁用条件及点击行为由页面决定。 |
| 3. 主表格 | 复用主表格表头、间距与内容驱动行高。主表格操作列中，用来展开一组行操作的入口统一使用水平三点图标。直接操作如“编辑”“查看”按页面需求展示。沿用现有三点样式，保留点击区域、键盘打开和读屏可识别的“更多操作”名称。单行高亮按需采用，列、选中、双击编辑与分页由页面决定。探针端管理已使用三点。数据源管理的文字“更多”记入后续接入计划，替换时保留原菜单项、顺序、禁用条件与业务行为。 |
| 4. 行操作、二次确认 | 统一菜单防误触、取消确认不发写入请求、确认未决或执行期间同一操作防重。菜单项、确认文案、可用条件与操作锁定范围由页面决定。公共菜单与确认框组件暂缓提取。 |
| 5. 新增／编辑主弹窗 | 按需复用现有字段标签、保存按钮和错误提示视觉。表单布局、校验、保存与关闭顺序由页面负责。测试连接、业务属性、命名策略等按对应功能实现。 |
| 6. 状态标签、列表刷新 | 状态以文字表达，颜色辅助识别。迟到的旧响应不得覆盖新结果。状态判定、异常展示、刷新时机、失败后保留或清空结果以及是否重选由页面决定。公共状态标签与公共请求逻辑暂缓提取。 |

**本期新增实现口径：** 第二步最小实现仍为三项显式 opt-in 纯 CSS
（查询字段组排版、结果摘要、新增按钮），不新建 Vue 组件或 composable。
数据源／探针端选择器只列为公共控件候选，不在本阶段提取；待实际使用它们的页面
验证后再决定封装。公共菜单、确认框、状态标签与请求逻辑继续暂缓。

**新页面使用示例（示意，非现行代码）：**

```vue
<QueryListPageShell title="…" description="…">
  <QueryListQueryPanel>
    <!-- 字段组排版：第二阶段拟提取 .lmt-q-field / .lmt-q-label -->
    <div class="lmt-q-field"><span class="lmt-q-label">关键字</span><el-input … /></div>
    <template #actions>
      <!-- 查询/重置按钮：query-list 模板直接复用；探针页当前仅传 query-loading -->
      <QueryListActions :query-loading="listLoading" @query="onQuery" @reset="onReset" />
    </template>
  </QueryListQueryPanel>
  <QueryListResultPanel>
    <!-- 结果摘要：第二阶段拟提取 .lmt-result-count -->
    <template #summary><span class="lmt-result-count">共 {{ rows.length }} 条</span></template>
    <!-- 新增主按钮：第二阶段拟提取 .lmt-add-button -->
    <template #toolbar><el-button class="lmt-add-button" @click="openCreate">新增</el-button></template>
    <!-- 表头/间距/行高：list-table 模板直接复用 -->
    <template #body><el-table :class="LT_MAIN_TABLE_CLASS" … /></template>
  </QueryListResultPanel>
</QueryListPageShell>

<!-- 新增／编辑主弹窗：ced 模板按需直接复用 -->
<el-dialog class="ced-dialog" …> … <el-button class="ced-submit" …>保存</el-button></el-dialog>
```

三套既有模板与三项拟提取样式的组合关系：页面骨架／查询区／结果面板来自
`query-list-page-template`，表格视觉来自 `list-table-visual-template`，弹窗视觉来自
`create-edit-dialog-visual-template`；三项 `lmt-*` 类只在第二阶段提取后按需 opt-in，
未启用页面零命中。完整组合结构与唯一维护位置见 §3。

**示例旁的行为说明：**

- 文本查询框回车等同点击查询；下拉展开时回车确认选项；中文输入法选字期间的回车只确认文字。
- 重置恢复页面默认条件；已应用条件与列表在下一次显式查询时更新。
- 成组行操作入口统一使用水平三点，沿用现有样式并保留点击区域、键盘打开与读屏“更多操作”名称；
  “编辑”“查看”等直接操作按页面展示；单行高亮按需采用。
- 状态以文字表达、颜色辅助；迟到的旧响应不得覆盖新结果。
- 数据源与探针端选择器为公共控件候选，实际使用页面验证后再决定是否封装。

**三阶段完成条件：**

1. **第一阶段（已完成）**：范围表、使用示例、交互约定与三阶段计划完成；负责人于
   `2026-11-11` 逐行确认六项范围（R2 锚点 `5695a2de345ae66e0d34081b7f1b7b033675a1f1`）。
   代码实现与验收均未开始。
2. **第二阶段**：只新增三项显式 opt-in 纯 CSS（字段组排版、结果摘要、新增主按钮），
   不新增 Vue 组件或 composable；探针端管理（`/config/client`）作为首个参考页完成视觉归并、
   删除四项私有同义规则，并按现有页面做视觉及行为等价验证；静态契约测试、零泄漏断言、
   `npm run build`（已含 `vue-tsc --noEmit`）、真实浏览器等价核对通过，并通过独立远程代码复审
   与负责人页面接受。选择器候选、公共菜单／确认框／状态标签／请求逻辑不在本阶段提取。
3. **第三阶段**：负责人在第二阶段收口后确认数据源管理主列表的接入范围；该页仍为
   三项样式复用验证候选，不与其他改动捆绑。其“更多”改三点、主弹窗接入 `ced-dialog`
   分别记录、各自独立授权、实现、复审与验收；替换“更多”时保留原菜单项、顺序、
   禁用条件与业务行为。数据订阅保留为备选。

## 1. 目标与非目标

### 1.1 目标

为**带新增／编辑流程的配置管理主列表页**建立一份**组合式**公共模板：

1. 统一**页面骨架、搜索栏、结果工具栏、无分页主表格、行操作入口、新增／编辑主弹窗**的外观；
2. 明确这些元素的**交互契约**：查询与重置语义、行操作事件隔离、重复提交与失败反馈、
   保存后的列表刷新、稳定 ID 重选、关闭顺序等；
3. 让公共层只承担**跨页可复现、无业务语义**的部分，业务判断继续留在 Feature 页面；
4. 用最小改动复用既有三套公共能力，**不另建一套平行视觉系统**。

### 1.2 非目标

- 不建设**万能 CRUD 组件**、低代码引擎、表单元数据驱动或权限框架；
- 不把 API 地址、业务字段、错误码（如 `40941`）、`FG_ACTIVE` 数值、ID 唯一性、
  描述字节限制、自动描述算法、启停运行含义、数据库事务或业务权限放入公共层；
- 不为假设需求建设**虚拟滚动**、分页器或自动刷新；
- 不在本阶段统一各页面的**业务专属流程**（数据源连接测试、业务属性、命名策略等）；
- 不修改、不重解释、不扩展现有三套模板的已批准规则；如确需修改，另立基线维护任务。

## 2. 可直接复用的三套能力（已核实状态）

下表状态均以各模板**当前权威收口块**为准；具体样式与组件契约继续以对应旧目录为唯一来源。

| 层 | 权威入口 | 已核实状态 | 本模板复用范围 |
|---|---|---|---|
| 页面／查询层 | [query-list-page-template](../query-list-page-template/README.md) · [组件设计](../query-list-page-template/SHARED_COMPONENT_DESIGN.md) | 6 个公共组件 + 1 个 Tooltip composable；参考页「源库快照状态」（`/monitor/data-source-state`）等价接入；**最终权威验收口径 21/21 PASS**（原 17/17 为历史阶段，二者是包含关系，不得相加）；项目负责人 2026-09-17 最终接受；页面迁移 `NOT_STARTED` / `NOT_GRANTED` | 页面骨架、查询区、查询/重置按钮、结果区外壳；可选刷新工具栏与 Tooltip 宿主 |
| 表格视觉层 | [list-table-visual-template](../list-table-visual-template/README.md) · [共享实现设计](../list-table-visual-template/SHARED_COMPONENT_DESIGN.md) | 基线内容 `APPROVED`；公共实现与**数据源管理主列表**参考页接入 14/14 PASS，2026-09-22 项目负责人最终接受并关闭；**可选三点入口 / 单行高亮**：公共实现已落地、代码复审 `APPROVED`，`/config/client` 页面级接入，现行 `IMPLEMENTED_PENDING_USER_ACCEPTANCE`（未正式验收）；页面迁移 `NOT_STARTED` / `NOT_GRANTED` | `.lt-main-table` + 9 个 `--lt-*` 令牌；**可选**三点入口外观、**可选**单行固定高亮 |
| 弹窗视觉层 | [create-edit-dialog-visual-template](../create-edit-dialog-visual-template/README.md) | 设计 2026-09-30 批准；公共 CSS 已实现且**代码复审 `APPROVED`**；Vue 组件 `NOT_CREATED`；仅 `/config/client` 新增／编辑主弹窗获页面级授权并接入、接入复审 `APPROVED`；负责人人工测试 `NO_ISSUE_REPORTED`（**非**正式验收）；**正式验收 `NOT_EXECUTED`** | `ced-dialog` 根类 + 7 个辅助类 + 17 个 `--ced-*` 令牌；不建 Vue 包装 |

三项独立事实：同一页面「已接入查询组件」「已接入表格视觉」「已接入弹窗视觉」互不等价，
任一模板的最终接受**不**自动传播为其他模板或页面的验收结论。

> **历史入口与已完成工作：** 三套旧模板各自的状态块与 `current_next_entry`
> 属于它们自身的治理流程（部分为历史复审入口）。本模板**不以任何旧入口作为第二阶段前置**，
> 只依赖上表已核实的现行状态。已完成的工作不再重复审批；尚待决策的事项见 §10。

## 3. 三套能力在同一管理页上的组合方式

```text
QueryListPageShell
 ├─ QueryListQueryPanel
 │    ├─ 查询字段组（标签 + 控件）            ← 页面排版；已确认第二阶段收敛为纯 CSS（未实施）
 │    └─ QueryListActions                    ← 直接复用（查询 / 重置）
 └─ QueryListResultPanel
      ├─ summary / toolbar 槽
      │    ├─ 结果摘要文字                   ← 页面；已确认第二阶段收敛为纯 CSS（未实施）
      │    └─ 新增主按钮                     ← 页面；已确认第二阶段收敛为纯 CSS（未实施）
      └─ body → el-table.lt-main-table       ← 直接复用
           ├─ 行操作列 lt-row-action__cell   ← 可选直接复用
           ├─ 三点触发器 lt-row-action__ellipsis （可选）
           └─ 行高亮 lt-row-highlight*       （可选）
新增／编辑主弹窗 el-dialog.ced-dialog + ced-* ← 直接复用（不建 Vue 包装）
```

**组合示例（示意，非现行代码）：**

```vue
<QueryListPageShell title="…" description="…">
  <QueryListQueryPanel>
    <div class="lmt-q-field"><span class="lmt-q-label">关键字</span><el-input … /></div>
    <template #actions>
      <!-- 探针端管理当前仅传 query-loading；busy 为可选阻断，页面未使用时不传 -->
      <QueryListActions :query-loading="listLoading"
                        @query="onQuery" @reset="onReset" />
    </template>
  </QueryListQueryPanel>
  <QueryListResultPanel>
    <template #summary><span class="lmt-result-count">共 {{ rows.length }} 条</span></template>
    <template #toolbar><el-button class="lmt-add-button" @click="openCreate">新增</el-button></template>
    <template #error>
      <template v-if="loadError">
        <span>{{ loadError }}</span><el-button link @click="reload">重试</el-button>
      </template>
    </template>
    <template #body><el-table :class="LT_MAIN_TABLE_CLASS" … /></template>
  </QueryListResultPanel>
</QueryListPageShell>

<el-dialog class="ced-dialog" …> … <el-button class="ced-submit" …>保存</el-button></el-dialog>
```

**行操作入口约定：** 用于展开一组行操作的入口统一使用水平三点图标，沿用
`list-table-visual-template` 的现有三点样式与点击区域，并保留键盘打开与读屏可识别的
“更多操作”名称；“编辑”“查看”等直接操作按页面需求展示，单行高亮按需启用。
数据源管理的文字“更多”替换列入后续接入计划，替换时保留原菜单项、顺序、禁用条件与业务行为。

**唯一维护位置原则：**

- 页面骨架、查询按钮、结果卡片的结构与基础视觉，唯一来源是 `query-list-page-template`；
- 表头、正文、三点入口、单行高亮的视觉，唯一来源是 `list-table-visual-template`；
- 弹窗标签、主提交按钮、字段反馈的视觉，唯一来源是 `create-edit-dialog-visual-template`；
- 本模板只维护“管理页特有的少量重复件”（查询字段组、结果摘要、新增按钮）及其**组合用法**；
- 同一规则不得在两个模板或页面中并存副本；迁移时应删除页面私有同义规则。

## 4. 现状缺口

- 没有一份“管理页如何组合上述三套能力”的**唯一契约**（本文件即候选）；
- 查询字段组排版（标签 + 控件）、结果摘要文字、结果工具栏“新增”主按钮在两页各写一份，
  数值相同但无公共来源；
- 行操作入口已统一为成组操作使用水平三点，但**触发器与菜单项忙碌状态、事件隔离、
  危险项呈现**仍只有页面级实现，公共表格层只提供三点**外观与用法契约**；
- 数据源／探针端下拉选择器尚未公共化，已列为公共控件候选，待实际使用页面验证后再决定封装；
- 数据源管理主弹窗仍使用页面私有标签与主提交按钮规则，未接入 `ced-dialog`；
- 两页的错误处理与刷新语义**有意不同**（失败保留旧行 vs 清空旧行），不能直接抽成同一行为；
- 页面私有 Tooltip、`+N` 打包、行选中、双击编辑等均属 Feature，公共层尚无对应组件。

## 5. 第二阶段最小提取范围（已确认，未实施）

仅提取**三项共用纯 CSS**，不新增 Vue 组件、composable 或运行时代码。
数据源／探针端选择器只列为公共控件候选，不在本阶段提取；待实际使用它们的页面
验证后再决定封装。

| 项 | 已确认 opt-in 类 | 归属与复用入口 |
|---|---|---|
| 查询字段组排版 | `.lmt-q-field` / `.lmt-q-label` | 放入新建的 `list-management` 纯 CSS 预设；提供默认对齐、组内间距与整组换行（标签与控件作为整体换行）；**换行位置沿用 `QueryListQueryPanel` 既有 flex-wrap 契约**，不新增容器、不改其 gap |
| 结果摘要文字 | `.lmt-result-count` | 继续通过 `QueryListResultPanel` 的 `summaryText` 或 `summary` 槽渲染，仅替换文字样式 |
| 新增主按钮 | `.lmt-add-button` | 继续放在 `toolbar` 槽；仅视觉，文案、图标、loading、禁用条件由页面提供 |

**复用入口与样式归属：**

- 三项类只挂到显式 opt-in 的元素；未启用页面零命中、零泄漏；
- 公共预设只拥有这三项视觉，不重写 `.ql-*`、`.lt-*`、`.ced-*` 任何规则；
- 字段宽度、控件类型、字段数量、摘要文案、按钮行为仍由页面提供；
- 数据源／探针端选择器不在本阶段新增公共实现；只有在实际使用页面完成验证后，
  才单独评估是否封装为公共控件。

**首个采用页与回归范围：**

- 首个参考页：探针端管理（`/config/client`），**只做视觉归并**，
  并按现有页面做视觉及行为等价验证；
- 删除页面私有同义规则（`.cc-q-group` / `.cc-q-label` / `.cc-result-count` / `.cc-btn-add`），
  避免双视觉来源；
- 回归重点：文本查询回车、下拉回车、输入法选字回车、重置默认条件与已应用条件更新时机、
  行选中与双击、三点菜单事件隔离、请求防重、确认与关闭顺序、失败保留策略、
  AC-138 条件占位、AC-091/088 异常原值与 ID 省略；
- 探针页已有的 157 条正式验收结论**不得**被本模板复用或重述为模板验收。

**本期继续暂缓：** 二次确认组件、状态标签视觉、行操作菜单 Vue 组件、
请求 composable（含单飞、已应用条件、自动刷新）。它们只以**契约与使用示例**约束，
不新增公共代码。

### 5.1 交互约定（已确认，非本期代码）

**统一约定（2026-11-11 已确认）：**

- 文本查询框回车等同点击查询；下拉展开时回车确认选项；中文输入法选字期间的回车只确认文字；
- 重置恢复页面默认条件；已应用条件与列表在下一次显式查询时更新；
- 行操作菜单的触发器与菜单必须阻止 `click` / `dblclick` 冒泡，避免误触行选中或双击编辑；
- 取消二次确认必须**零写入**；
- 同一操作在请求在途或确认未决时不得重复提交；
- 旧响应必须被序列令牌丢弃，不得覆盖新结果；
- 请求已发出但结果未知时不得自动重发；
- 状态以文字表达，颜色辅助识别。

**必须按页面契约表达（不得在公共层统一）：**

回车与重置按上述统一约定执行；下表只列各页有意不同的部分。

| 项 | 探针端管理 | 数据源管理 |
|---|---|---|
| 忙碌粒度 | 按行集合 `busyClientIds`，只锁当前行，其他行可并发操作 | 菜单项按行禁用；启停/删除**处理函数另有全局守卫**（`statusBusyId` / `deletingId` 任一非空即拒绝），删除菜单项全局禁用 |
| 失败处理 | 保留上一次成功结果，仅错误槽提示并可重试 | 清空旧行并显示错误 |
| 重选 | 仅启停成功的重载携带本次目标 ID，按最新成功结果重选 | 无行选中/重选，重载已应用条件 |
| 锁定范围 | 行级；触发器不禁用 | 行级 + 全局写操作守卫 |

详细契约与检查项见 [INVENTORY-AND-SCOPE.md](./INVENTORY-AND-SCOPE.md) §3 C5/C9/C10 与 §4。

## 6. 第三阶段复用验证候选（未授权）

- **候选**：数据源管理（`/config/data-source`）**主列表**，用于验证第二阶段三项样式
  在第二个真实管理页的复用；只评估这三项，不改变业务行为。
- **接入范围确认时点**：第二阶段完成并通过独立复审／负责人接受后，再确认数据源主列表
  的接入范围。
- **分别记录、独立决定**（不与三项样式验证捆绑）：
  1. 数据源“更多”文字入口改为公共三点入口——替换时保留原菜单项、顺序、禁用条件与
     业务行为，并保留点击区域、键盘打开和读屏“更多操作”名称；需页面级授权与验收；
  2. 数据源新增／编辑主弹窗接入既有 `ced-dialog` CSS——需保留 EP 表单校验、
     全局错误区等业务差异，并删除页面私有同义规则。
- **备选**：数据订阅（`/config/subscribe`）——结构改造面更大，留作后续候选。
- 数据源管理仅是**候选页**，当前**未获迁移授权**；任何迁移仍需逐页独立评估、授权、实施与验收。

## 7. 三阶段计划

### 第一阶段（已完成范围确认，2026-11-11）

- 只读盘点、能力矩阵、第二页候选比较、范围表、组合示例与交互约定；
- 项目负责人于 `2026-11-11` 逐行确认六项范围（R2 锚点
  `5695a2de345ae66e0d34081b7f1b7b033675a1f1`）；
- 第一步范围状态 `CONFIRMED`；模板基线仍 `NOT_APPROVED`；
- 代码实现与验收均未开始，未迁移页面。

### 第二阶段（最小实现，未开始；另立任务）

1. 新增**显式 opt-in 纯 CSS**：查询字段组排版、结果摘要文字、结果工具栏新增主按钮；
2. 不新增 Vue 组件（继续复用六个查询组件 + 三套 CSS）；
3. 在**探针端管理**作为首个参考页消除对应私有重复规则，按现有页面做视觉及行为等价验证；
4. 记录并验证统一回车与重置约定；数据源／探针端选择器保持候选，不在本阶段提取；
5. 静态契约测试、零泄漏断言、构建与真实浏览器等价核对；
6. 独立远程代码复审与负责人页面接受。

### 第三阶段（第二阶段收口后确认接入范围）

- 在**第二个真实管理页**验证三项样式的复用；数据源管理主列表仍为候选；
- 其“更多”改三点、主弹窗接 `ced-dialog` 分别记录、独立决定；
- 替换“更多”时保留原菜单项、顺序、禁用条件与业务行为；
- 业务属性、命名策略、连接测试等**业务专属流程不进模板**；
- 每页独立授权、独立实现、独立复审与验收。

## 8. 本收口明确未做

- 未创建或修改任何 CSS、Vue 组件、composable、TypeScript 类型或测试；
- 未修改 `frontend/**`、`backend/**`、依赖、锁文件、配置或业务基线；
- 未开始第二阶段实现，未执行任何验收；
- 未迁移任何页面，未更新任何页面的迁移状态；
- 未运行 `npm test`、`npm run build`、浏览器、业务接口或数据库操作；
- 未启停服务，未访问 ZooKeeper / Kafka；
- 三套既有模板文档与六份项目级基线仅作只读依据。

## 9. 文档导航

| 文件 | 职责 |
|---|---|
| `README.md`（本文件） | 已确认范围总表、组合入口、三套能力状态、组合示例与行为说明、二期提取范围、交互约定、三阶段计划、确认记录 |
| [INVENTORY-AND-SCOPE.md](./INVENTORY-AND-SCOPE.md) | 11 项能力矩阵、逐项证据、职责边界、探针预计改动、第二页比较、验证命令与完成标准、待决事项、源码索引 |

## 10. 第一步范围确认记录（已完成）

项目负责人已于 `2026-11-11` 逐行确认 §0 的六项范围，覆盖页面骨架／搜索栏、
结果区／新增按钮、主表格、行操作／二次确认、新增／编辑主弹窗、状态标签／列表刷新。

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

**下一步：** 另立第二阶段实现任务，按 §5 三项 CSS 与探针端参考页执行；完成并通过
独立复审／负责人接受后，再确认第三阶段数据源主列表的接入范围。数据源／探针端选择器
仍为公共控件候选，待实际使用页面验证后再决定封装。

## 11. 边界声明

- 第一步六项范围已确认，但模板基线仍为 `NOT_APPROVED`；本收口**不构成**第二阶段实现
  或页面迁移授权，第二阶段需另立任务；
- 三项 CSS 与统一交互约定为已确认范围，**尚未实施**；选择器、公共菜单、确认框、
  状态标签与请求逻辑仍为候选或暂缓项；
- 数据源管理主列表仅为第三阶段候选，未获迁移授权；
- 静态盘点不能证明真实键盘行为、焦点顺序、几何布局、后端结果或写路径；
  这些必须在后续阶段以真实浏览器／真实后端分别验证，且不得把未运行项写成 `PASS`。
