# 新增／编辑业务弹窗公共视觉模板 · 设计基线草案

```text
create_edit_dialog_visual_template_document_status=DRAFT_PENDING_USER_REVIEW
create_edit_dialog_visual_template_baseline_status=NOT_APPROVED
create_edit_dialog_visual_template_approval_status=NOT_APPROVED
implementation_status=IMPLEMENTATION_NOT_STARTED
page_adoption_authorization_status=PAGE_ADOPTION_NOT_AUTHORIZED
public_css_status=NOT_CREATED
public_vue_component_status=NOT_CREATED
current_next_entry=CHATGPT_REMOTE_CREATE_EDIT_DIALOG_VISUAL_TEMPLATE_BASELINE_DRAFT_R2_REVIEW
```

```text
task_code=CREATE-EDIT-DIALOG-VISUAL-TEMPLATE-BASELINE-DRAFT-001
task_type=DOCS_ONLY_TEMPLATE_BASELINE_DRAFT
branch=develop
base_commit_id=d5c12f376a50fe7602edec146bdc8d4ebb8d9507
new_baseline_path=docs/baseline/create-edit-dialog-visual-template/
scope=CREATE_EDIT_BUSINESS_MAIN_DIALOG_ONLY
candidate_capabilities=LABEL_TYPOGRAPHY_AND_ALIGNMENT,BLACK_PRIMARY_SUBMIT_BUTTON,FIELD_ERROR_FEEDBACK,DIALOG_CONTAINER_AND_RESPONSIVE,A11Y_AND_INTERACTION_BOUNDARY
```

> 本目录由**纯文档任务** `CREATE-EDIT-DIALOG-VISUAL-TEMPLATE-BASELINE-DRAFT-001` 建立，
> 为**新增／编辑业务主弹窗**建立**可复审的设计契约草案**。
> 本任务**未创建任何 CSS、Vue 组件、Composable、TypeScript 类型或路由元数据**，
> **未修改** `frontend/**`、`backend/**`、测试代码、配置、依赖或锁文件，
> **未修改**任何业务页面，
> **未运行**测试、构建、浏览器或任何服务，
> **未访问**数据库 / ZooKeeper / Kafka / 业务源库 / 目标库。
>
> **文档设计草案 ≠ 公共 CSS 已存在 ≠ Vue 组件已存在 ≠ 基线已批准 ≠ 页面已接入 ≠ 正式验收通过。**
> 本目录所有状态均为**草案态**：`DRAFT_PENDING_USER_REVIEW` / `NOT_APPROVED` /
> `IMPLEMENTATION_NOT_STARTED` / `PAGE_ADOPTION_NOT_AUTHORIZED`。
> 这些是**本弹窗模板草案自身**的状态，**不改变**列表表格视觉模板、
> 查询列表页模板、探针端管理与数据源管理各自的现有状态。
>
> **复审时序**：R0 草案提交 `ad7a4b741714a229a8a8a250f8ee960447e33355` 已由 ChatGPT **从远程 Git**
> 独立复审，结论 `CHANGES_REQUIRED`（两处阻塞：差异值的缺省口径、真实可执行的回退路径）。
> R1（纯文档定向纠错）已针对这两处修改 `DESIGN.md`／`MIGRATION.md` 并新增 R1 报告；
> R1 复审结论为 `CHANGES_REQUIRED`（**仅导航不一致**：本目录与 `docs/baseline/README.md`
> 的 `current_next_entry` 仍写 R0／R1 入口），该**导航遗留经 R2 纠正**。
> R0、R1 入口仅作**历史**保留，**不再**占 `current_next_entry`。
> **R1 尚未获批**——`CHANGES_REQUIRED` **不**等于 R1 已获 `APPROVED`。
>
> 下一入口：`CHATGPT_REMOTE_CREATE_EDIT_DIALOG_VISUAL_TEMPLATE_BASELINE_DRAFT_R2_REVIEW`——
> 由 ChatGPT **从远程 Git** 对 R0→R1→R2 整体草案做独立复审，通过后再由**项目负责人批准**，
> 然后**另立**公共实现任务与各页选择性接入任务。

---

## 1. 本模板的目标

把两个业务页面**新增／编辑主弹窗**中**已经各自重复存在、且规格可比对一致**的共性视觉，
收敛为**一份可选择性接入（显式 opt-in）的公共视觉契约**，用于：

- 消除**同义视觉规则**的重复副本（同一套标签排版与主提交按钮规格在两页各写一遍）；
- 为后续新页面提供一致、可复审的默认外观；
- 明确**公共视觉**与**Feature 专属业务行为**的边界，避免模板静默覆盖业务语义。

本模板**只**覆盖**新增／编辑业务主弹窗**（页面主入口的 `el-dialog`）。
**不**承载任何业务语义、校验规则、请求时序或权限。

## 2. 适用范围

- 面向**新增／编辑业务主弹窗**的**视觉层**：配置项标签排版、主提交按钮视觉、
  字段错误反馈的**视觉呈现**、弹窗容器的安全边距与内容滚动原则、基础可访问性视觉要求。
- 适用对象为**显式选择接入**的页面：未接入页面**零影响**（零挂载、零选择器命中）。

## 3. 不适用范围（排除范围）

- **启用／停用／删除确认框**（危险语义确认框）不在本模板内；
- 数据源管理的**业务属性弹窗**、**表命名策略弹窗**等**子弹窗**不在本模板内；
- **列表表格视觉模板**（`list-table-visual-template`）与**查询列表页模板**
  （`query-list-page-template`）不在本模板内；三者正交、不互相并入；
- **API、后端、数据库、现行业务校验、提交／关闭时序**均不在本模板内；
- **不**把探针端管理弹窗的全部专用布局（双栏数据源选择器、候选／已选区、
  “自动生成”“修改探针 ID”、锁定提示等）当作**所有弹窗的默认值**。

## 4. 事实分层与标记

本目录严格区分两类内容，**不得混同**：

| 层 | 含义 | 书写要求 |
|---|---|---|
| **现行事实** | 可由**两页实际源码／已批准条款**直接核验 | 必须给出**两页各自的代码／条款位置**；不做推及全项目的概括 |
| **拟议（设计推断）** | 本草案**提出**的公共契约、类名、令牌、可选能力 | 必须显式标注「**拟议**」；**不得**包装为「两页已实现」或「已批准」 |

- 本任务**不**引入与列表表格模板相同的 `LIST_TABLE_*` 标记通道；本目录使用
  `create_edit_dialog_visual_template_*` 前缀的草案状态键（见文首）与本节的「现行事实／拟议」分区。
- 任何**未实现**的候选能力（公共 CSS、类名、CSS 令牌、静态断言、Vue 组件）
  一律标注为**拟议**，其存在性为 `NOT_CREATED`。

## 5. 证据来源（两页实际位置）

| 页面 | 组件 | 主新增／编辑弹窗 | 已批准条款（Feature 基线） |
|---|---|---|---|
| 探针端管理 | `frontend/src/views/client-config/ClientConfigPage.vue` | `<el-dialog class="cc-dialog" width="900px">`（约 257 行） | `docs/features/client-config/{REQUIREMENTS,ACCEPTANCE,DESIGN,UI}.md`：`CCFG-REQ-116/119/120/123/124/128/130/137/138`、`CCFG-UI-045/046/047/050/051/055/057`、`CCFG-DESIGN-056/059/061/062/066/068/072/073` |
| 数据源管理 | `frontend/src/views/data-source/DataSourcePage.vue` | `<el-dialog class="editor-dialog" width="620px">`（约 190 行） | `docs/features/data-source-management/REQUIREMENTS.md`：`DS-REQ-185/186/187`（及该 Feature 已批准基线） |

详细的一致与差异见 `DESIGN.md` 与 `MIGRATION.md`；公共契约拟议见 `SHARED_COMPONENT_DESIGN.md`；候选视觉规格见 `UI.md`。

## 6. 文档导航

| 文件 | 职责 |
|---|---|
| `README.md`（本文件） | 任务边界、证据来源、文档导航、状态分层与下一入口 |
| `DESIGN.md` | 可复用能力、显式 opt-in 契约、公共／Feature 归属与实现方案选择 |
| `UI.md` | 候选视觉规格、状态矩阵、响应式与可访问性 |
| `SHARED_COMPONENT_DESIGN.md` | 未来实现边界、作用域／零泄漏约束、可选能力与不变量 |
| `MIGRATION.md` | 两页各自现状、未来选择性接入步骤与未授权状态 |
| `reports/CREATE-EDIT-DIALOG-VISUAL-TEMPLATE-BASELINE-DRAFT-001.md` | R0 历史快照：事实／推断分层、来源映射、冲突与待审点、变更清单、保护核验与下一入口 |
| `reports/CREATE-EDIT-DIALOG-VISUAL-TEMPLATE-BASELINE-DRAFT-001-R1.md` | R1 定向纠错：两处阻塞、旧→新文本／位置、保护核验与下一入口（对 R0 不准确结论作勘误，不回写 R0） |

## 7. 与其他模板的关系

- 与 `list-table-visual-template`（**表格层**）和 `query-list-page-template`（**页面层**）**正交**：
  本模板覆盖**弹窗层**。三者**不**互相并入、**不**互相扩大适用范围。
- 本模板的组织方法（分层状态、显式 opt-in、零泄漏、文档导航、草案与批准态隔离）
  **借鉴**自上述既有模板，但**不**复用其标记、类名或令牌命名空间。

## 8. 边界声明

- **草案通过远程复审 ≠ 获批 ≠ 公共实现已存在 ≠ 任何页面已接入 ≠ 正式验收通过。**
- 本目录**不**授权任何页面接入；`PAGE_ADOPTION_NOT_AUTHORIZED` 的含义是
  **两页均未获授权接入本模板**。将来接入须由项目负责人**单独授权**，并另立实现与验收任务。
- 未经项目负责人**再次明确批准**，**不得**据本草案创建任何公共 CSS、Vue 组件或修改任何页面。
