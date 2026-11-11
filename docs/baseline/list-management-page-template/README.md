# 公共列表管理页模板 · 组合入口与范围草案（R1）

```text
list_management_page_template_document_status=DRAFT_PENDING_OWNER_CONFIRMATION
list_management_page_template_baseline_status=NOT_APPROVED
task_scope=PHASE_1_INVENTORY_AND_SCOPE_DRAFT_ONLY
task_code=PUBLIC-LIST-MANAGEMENT-TEMPLATE-INVENTORY-AND-SCOPE-DRAFT-001-R1
original_inventory_task_code=PUBLIC-LIST-MANAGEMENT-TEMPLATE-INVENTORY-AND-SCOPE-DRAFT-001
inventory_source_commit=6560c73fb71aa5b8441de4a57fe777d7810b12da
r0_result_commit=03e4bffa49e3a74300a7c604969130473017a631
branch=develop
product_code_change_status=NONE
page_migration_status=NOT_STARTED_BY_THIS_TASK
owner_scope_approval_status=PENDING
next_entry=OWNER_CONFIRM_PHASE_2_EXTRACTION_SCOPE_AND_FIRST_REFERENCE_PAGE
```

> 本目录承载**第一阶段：盘点与范围草案**。状态为
> `DRAFT_PENDING_OWNER_CONFIRMATION`，**不是**已批准基线，**不是**实施设计，
> **不构成**任何页面迁移或产品代码变更授权。
>
> 本 R1 为**纯文档定向修订**：**未修改**产品代码、CSS、Vue 组件、测试、依赖、配置、
> 业务基线定义或既有验收状态；**未迁移**任何页面；**未运行**测试、构建、浏览器、
> 业务接口或数据库操作；**未启停**任何服务；**未访问** ZooKeeper / Kafka / 业务源库或目标库。
> 文中不能由静态源码或既有基线直接证明的运行效果，均列入后续验证项，**不写成已通过**。

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
 │    ├─ 查询字段组（标签 + 控件）            ← 页面排版；本期建议收敛为纯 CSS
 │    └─ QueryListActions                    ← 直接复用（查询 / 重置）
 └─ QueryListResultPanel
      ├─ summary / toolbar 槽
      │    ├─ 结果摘要文字                   ← 页面；本期建议收敛为纯 CSS
      │    └─ 新增主按钮                     ← 页面；本期建议收敛为纯 CSS
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
      <QueryListActions :query-loading="listLoading" :busy="listBusy"
                        @query="onQuery" @reset="onReset" />
    </template>
  </QueryListQueryPanel>
  <QueryListResultPanel>
    <template #summary><span class="lmt-result-count">共 {{ rows.length }} 条</span></template>
    <template #toolbar><el-button class="lmt-add-button" @click="openCreate">新增</el-button></template>
    <template #error><span>{{ loadError }}</span><el-button link @click="reload">重试</el-button></template>
    <template #body><el-table :class="LT_MAIN_TABLE_CLASS" … /></template>
  </QueryListResultPanel>
</QueryListPageShell>

<el-dialog class="ced-dialog" …> … <el-button class="ced-submit" …>保存</el-button></el-dialog>
```

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
- 行操作入口的**触发器与菜单项忙碌状态、事件隔离、危险项呈现**只有页面级实现，
  公共表格层只提供三点**外观**；
- 数据源管理主弹窗仍使用页面私有标签与主提交按钮规则，未接入 `ced-dialog`；
- 两页的错误处理与刷新语义**有意不同**（失败保留旧行 vs 清空旧行），不能直接抽成同一行为；
- 页面私有 Tooltip、`+N` 打包、行选中、双击编辑等均属 Feature，公共层尚无对应组件。

## 5. 第二阶段最小提取建议（未批准）

仅提取**三项共用纯 CSS**，不新增 Vue 组件、composable 或运行时代码。

| 项 | 建议 opt-in 类 | 归属与复用入口 |
|---|---|---|
| 查询字段组排版 | `.lmt-q-field` / `.lmt-q-label` | 放入新建的 `list-management` 纯 CSS 预设；**换行沿用 `QueryListQueryPanel` 既有 flex-wrap 契约**，不新增容器、不改其 gap |
| 结果摘要文字 | `.lmt-result-count` | 继续通过 `QueryListResultPanel` 的 `summaryText` 或 `summary` 槽渲染，仅替换文字样式 |
| 新增主按钮 | `.lmt-add-button` | 继续放在 `toolbar` 槽；仅视觉，文案、图标、loading、禁用条件由页面提供 |

**复用入口与样式归属：**

- 三项类只挂到显式 opt-in 的元素；未启用页面零命中、零泄漏；
- 公共预设只拥有这三项视觉，不重写 `.ql-*`、`.lt-*`、`.ced-*` 任何规则；
- 字段宽度、控件类型、字段数量、摘要文案、按钮行为仍由页面提供。

**首个采用页与回归范围：**

- 首个参考页：探针端管理（`/config/client`），**只做视觉归并，业务行为不变**；
- 删除页面私有同义规则（`.cc-q-group` / `.cc-q-label` / `.cc-result-count` / `.cc-btn-add`），
  避免双视觉来源；
- 回归重点：查询/重置、回车、行选中与双击、三点菜单事件隔离、请求防重、
  确认与关闭顺序、失败保留策略、AC-138 条件占位、AC-091/088 异常原值与 ID 省略；
- 探针页已有的 157 条正式验收结论**不得**被本模板复用或重述为模板验收。

**本期继续暂缓：** 二次确认组件、状态标签视觉、行操作菜单 Vue 组件、
请求 composable（含单飞、已应用条件、自动刷新）。它们只以**契约与使用示例**约束，
不新增公共代码。

### 5.1 交互约定（分类记录，非本期代码）

**可记录为通用约定（两页已具备或明确要求）：**

- 行操作菜单的触发器与菜单必须阻止 `click` / `dblclick` 冒泡，避免误触行选中或双击编辑；
- 取消二次确认必须**零写入**；
- 同一操作在请求在途或确认未决时不得重复提交；
- 旧响应必须被序列令牌丢弃，不得覆盖新结果；
- 请求已发出但结果未知时不得自动重发。

**必须按页面契约表达（不得在公共层统一）：**

| 项 | 探针端管理 | 数据源管理 |
|---|---|---|
| 忙碌粒度 | 按行集合 `busyClientIds`，只锁当前行，其他行可并发操作 | 菜单项按行禁用；启停/删除**处理函数另有全局守卫**（`statusBusyId` / `deletingId` 任一非空即拒绝），删除菜单项全局禁用 |
| 失败处理 | 保留上一次成功结果，仅错误槽提示并可重试 | 清空旧行并显示错误 |
| 查询回车 | 输入框绑定 `@keyup.enter` | 三个输入框分别绑定 `@keyup.enter` |
| 重置 | 只清空查询控件，不发请求、不改已应用条件 | 同左 |
| 重选 | 仅启停成功的重载携带本次目标 ID，按最新成功结果重选 | 无行选中/重选，重载已应用条件 |
| 锁定范围 | 行级；触发器不禁用 | 行级 + 全局写操作守卫 |

详细契约与检查项见 [INVENTORY-AND-SCOPE.md](./INVENTORY-AND-SCOPE.md) §3 C5/C9/C10 与 §4。

## 6. 第三阶段复用验证建议（未批准）

- **首选**：数据源管理（`/config/data-source`）**主列表**，用于验证第二阶段三项样式
  在第二个真实管理页的复用；只评估这三项，不改变业务行为。
- **可独立决定的后续项**（不与上述三项捆绑）：
  1. 数据源“更多”文字入口改为公共三点入口——可见视觉变化，需页面级授权与验收；
  2. 数据源新增／编辑主弹窗接入既有 `ced-dialog` CSS——需保留 EP 表单校验、
     全局错误区等业务差异，并删除页面私有同义规则。
- **备选**：数据订阅（`/config/subscribe`）——结构改造面更大，留作后续候选。
- 数据源管理仅是**候选页**，当前**未获迁移授权**；任何迁移仍需逐页独立评估、授权、实施与验收。

**确认时点：** 第二阶段提取范围与首个参考页由负责人**本轮一次确认**；
第三阶段候选与范围在**第二阶段完成并通过独立复审／负责人接受后**再单独确认，
避免把两阶段决策捆绑。

## 7. 三阶段计划

### 第一阶段（本任务，已完成草案并完成 R1 修订）

- 只读盘点、能力矩阵、第二页候选比较、范围草案与组合契约；
- 状态 `DRAFT_PENDING_OWNER_CONFIRMATION`；
- 不写产品代码、不迁移页面、不运行验证。

### 第二阶段（待负责人确认后另立任务）

1. 新增**显式 opt-in 纯 CSS**：查询字段组排版、结果摘要文字、结果工具栏新增主按钮；
2. 不新增 Vue 组件（继续复用六个查询组件 + 三套 CSS）；
3. 在**探针端管理**作为首个参考页消除对应私有重复规则，业务行为不变；
4. 静态契约测试、零泄漏断言、构建与真实浏览器等价核对；
5. 独立远程代码复审与负责人页面接受。

### 第三阶段（待第二阶段收口后单独确认候选）

- 在**第二个真实管理页**验证三项样式的复用；
- 推荐候选：数据源管理主列表；其“更多”改三点、主弹窗接 `ced-dialog` 为可独立决定的后续项；
- 业务属性、命名策略、连接测试等**业务专属流程不进模板**；
- 每页独立授权、独立实现、独立复审与验收。

## 8. 本任务明确未做

- 未创建任何 CSS、Vue 组件、composable、TypeScript 类型或测试；
- 未修改 `frontend/**`、`backend/**`、依赖、锁文件、配置或业务基线；
- 未迁移任何页面，未更新任何页面的迁移状态；
- 未运行 `npm test`、`npm run build`、浏览器、业务接口或数据库操作；
- 未启停服务，未访问 ZooKeeper / Kafka。

## 9. 文档导航

| 文件 | 职责 |
|---|---|
| `README.md`（本文件） | 组合入口、三套能力状态、组合示例、二期提取建议、交互约定、三阶段计划、待确认清单 |
| [INVENTORY-AND-SCOPE.md](./INVENTORY-AND-SCOPE.md) | 11 项能力矩阵、逐项证据、职责边界、探针预计改动、第二页比较、验证命令与完成标准、待决事项、源码索引 |

## 10. 待负责人确认（本轮一次确认即可）

**本轮需要确认（第二阶段与首个参考页）：**

1. **提取范围**：是否批准第二阶段只新增三项纯 CSS（查询字段组排版、结果摘要、新增主按钮），
   不新建 Vue 组件、不新增 composable？推荐：**批准**。
2. **首个参考页**：是否确认第二阶段以探针端管理（`/config/client`）为参考页，
   只做视觉归并、业务行为不变，并以其现有行为做等价回归？推荐：**确认**。
3. **暂缓项**：是否同意本轮不提取请求 composable、二次确认组件、状态标签视觉、
   行操作菜单组件，只固化契约与使用示例？推荐：**同意**。

**下一阶段再确认（不阻塞本轮）：**

4. **第三阶段候选**：推荐数据源管理主列表验证三项样式；“更多”改三点、
   主弹窗接入 `ced-dialog` 分别作为可独立决定的后续项。请在**第二阶段收口后**确认是否采用及范围。

## 11. 边界声明

- 本文档是**草案**；所有“建议提取”“建议形态”“推荐候选”均**未被批准**，
  不得被引用为现行项目规则；
- 未批准前不得据此创建公共代码、修改页面或更新任何迁移状态；
- 静态盘点不能证明真实键盘行为、焦点顺序、几何布局、后端结果或写路径；
  这些必须在后续阶段以真实浏览器／真实后端分别验证，且不得把未运行项写成 `PASS`。
