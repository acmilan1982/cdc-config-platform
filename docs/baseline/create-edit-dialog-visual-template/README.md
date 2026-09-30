# 新增／编辑业务弹窗公共视觉模板 · 设计基线已批准；公共 CSS 已实现、代码复审通过；首个页面（探针端新增／编辑主弹窗）已接入、待远程复审与负责人目测

```text
create_edit_dialog_visual_template_document_status=APPROVED
create_edit_dialog_visual_template_baseline_status=APPROVED
create_edit_dialog_visual_template_approval_status=APPROVED_BY_PROJECT_OWNER
create_edit_dialog_visual_template_approval_date=2026-09-30
create_edit_dialog_visual_template_approved_reviewed_commit=45ce16dffbf2747abeb75d4d6c43bc57165043c8
implementation_status=PUBLIC_CSS_IMPLEMENTED_VUE_NOT_CREATED
public_css_status=IMPLEMENTED_FIRST_PAGE_ADOPTED_PENDING_REMOTE_REVIEW
public_css_code_review_status=APPROVED
public_css_code_review_date=2026-09-30
public_css_code_review_objects=c8785e18dc3014396cf45534315ab0f10dbbe94d,8434b884904a34bed51a2d8364e217efb605f06c
public_css_code_review_scope=PURE_CSS_PRESET_ROOT_CLASS_OPT_IN_17_TOKENS_REAL_EP_STATE_FIX_ZERO_PAGE_ADOPTION
public_css_status_before_review=IMPLEMENTED_PENDING_CHATGPT_REMOTE_CODE_REVIEW
page_adoption_authorization_status=PAGE_ADOPTION_AUTHORIZED_CLIENT_CONFIG_CREATE_EDIT_MAIN_DIALOG_ONLY
page_adoption_decision_status=DECIDED_AND_GRANTED_FOR_CLIENT_CONFIG_CREATE_EDIT_MAIN_DIALOG_ONLY
page_adoption_implementation_status=IMPLEMENTED_PENDING_CHATGPT_REMOTE_REVIEW_AND_OWNER_VISUAL_CHECK
public_vue_component_status=NOT_CREATED
formal_acceptance_execution_status=NOT_EXECUTED
migrated_page_count=1
migrated_page_count_scope=REAL_BUSINESS_PAGES_WITH_CED_DIALOG_ROOT_CLASS_OPT_IN
registered_token_count=17
current_next_entry=CHATGPT_REMOTE_CREATE_EDIT_DIALOG_CLIENT_CONFIG_FIRST_ADOPTION_R1_REVIEW
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

> 本目录由**纯文档任务** `CREATE-EDIT-DIALOG-VISUAL-TEMPLATE-BASELINE-DRAFT-001`（R0）建立，
> 为**新增／编辑业务主弹窗**建立可复审的设计契约；经 R1／R2 定向纠错后，
> 该**设计基线已由项目负责人于 2026-09-30 批准**（`approval_status=APPROVED_BY_PROJECT_OWNER`）。
> 建立与纠错任务**未创建任何 CSS、Vue 组件、Composable、TypeScript 类型或路由元数据**，
> **未修改** `frontend/**`、`backend/**`、测试代码、配置、依赖或锁文件，
> **未修改**任何业务页面，
> **未运行**测试、构建、浏览器或任何服务，
> **未访问**数据库 / ZooKeeper / Kafka / 业务源库 / 目标库。
>
> **公共 CSS 已实现 ≠ 已通过远程代码复审 ≠ Vue 组件已存在 ≠ 页面已接入 ≠ 正式验收通过。**
> 批准范围**只**覆盖**文档设计契约**。公共 CSS 预设由独立实现任务
> `CREATE-EDIT-DIALOG-VISUAL-TEMPLATE-PUBLIC-CSS-IMPLEMENTATION-001` 落地为**纯 CSS** 公共能力，
> 并经 R1 定向纠错（`...-R1`）：**代码复审状态为「已实现、代码复审通过」**
> （`public_css_code_review_status=APPROVED`，复审日期 `2026-09-30`，复审对象 R0 `c8785e1`／R1 `8434b88`）。
> **Vue 组件仍未创建**（`NOT_CREATED`）；项目负责人已就**首个页面**作出采用决定——**仅** `/config/client`
> （探针端管理）**新增／编辑业务主弹窗**接入（`page_adoption_authorization_status=PAGE_ADOPTION_AUTHORIZED_CLIENT_CONFIG_CREATE_EDIT_MAIN_DIALOG_ONLY`、
> `page_adoption_decision_status=DECIDED_AND_GRANTED_FOR_CLIENT_CONFIG_CREATE_EDIT_MAIN_DIALOG_ONLY`），
> 该接入**已实现、待远程代码复审与负责人目测**（`page_adoption_implementation_status=IMPLEMENTED_PENDING_CHATGPT_REMOTE_REVIEW_AND_OWNER_VISUAL_CHECK`，`migrated_page_count=1`）；
> **其余任何页面仍未被授权**；**未做正式验收**（`formal_acceptance_execution_status=NOT_EXECUTED`）。
> 本弹窗模板自身状态**不改变**列表表格视觉模板、
> 查询列表页模板、探针端管理与数据源管理各自的现有状态。
> **代码复审通过 ≠ 页面接入代码复审通过 ≠ 正式验收通过**；模板级**未选定试点**（`pilot_page_selection_status=NOT_DECIDED`），
> **仅**上述单页获**页面级**采用授权。
>
> **时态说明**：正文中标注「**拟议**」「拟议缺省」等字样的**设计项**，
> 自 2026-09-30 批准后即为**已批准的设计契约**。按实现分层**逐项**收敛为：
> **公共 CSS、类名、令牌登记与静态契约测试已实现**（纯 CSS 公共能力，含隔离合成夹具真实 Element Plus 浏览器证据，
> 见 `reports/`），并**已通过远程代码复审**（`public_css_code_review_status=APPROVED`，`2026-09-30`）；
> **Vue 公共组件仍未创建**（`NOT_CREATED`）；**单页接入已实现**（`/config/client` 新增／编辑主弹窗，
> `page_adoption_authorization_status=PAGE_ADOPTION_AUTHORIZED_CLIENT_CONFIG_CREATE_EDIT_MAIN_DIALOG_ONLY`，`migrated_page_count=1`，
> 采用决定 `DECIDED_AND_GRANTED_FOR_CLIENT_CONFIG_CREATE_EDIT_MAIN_DIALOG_ONLY`，**待远程复审与负责人目测**）；
> **正式验收未执行**。
> 旧文中的「拟议」「未创建」字样若描述**已落地**的 CSS／类名／令牌／测试，
> 一律以本节分层口径为准（历史报告按原文保留）。R0／R1／R2 在**历史时点**的
> `DRAFT_PENDING_USER_REVIEW`、`NOT_APPROVED` 与复审 `CHANGES_REQUIRED`／`APPROVED`，
> 以及 R0 公共实现复审 `CHANGES_REQUIRED`／R1 `APPROVED` 之前的 `IMPLEMENTED_PENDING_CHATGPT_REMOTE_CODE_REVIEW`，
> **保留时序、不机械全局替换**，亦不回写历史报告。
>
> **设计基线复审时序**：R0 提交 `ad7a4b741714a229a8a8a250f8ee960447e33355` 远程复审 `CHANGES_REQUIRED`（两处阻塞：
> 差异值的缺省口径、真实可执行的回退路径）；R1 提交 `b8ba2f6cab713326a1fdd70a875b743c5190cbe4`
> 定向纠错后远程复审 `CHANGES_REQUIRED`（**仅导航不一致**）；R2 提交
> `45ce16dffbf2747abeb75d4d6c43bc57165043c8` 远程复审 **`APPROVED`**，随后由项目负责人于
> **2026-09-30** 批准。**R2 获远程复审通过并不表示负责人在 R2 提交当时已批准**——批准时点另记 2026-09-30。
>
> **公共 CSS 代码复审时序**：实现提交 `c8785e18dc3014396cf45534315ab0f10dbbe94d`（R0）远程代码复审
> `CHANGES_REQUIRED`（17 vs 15 令牌口径、现行文档时态自相矛盾、真实 EP 状态证据不足）；
> R1 纠错提交 `8434b884904a34bed51a2d8364e217efb605f06c` 远程代码复审 **`APPROVED`**（时点 `2026-09-30`）。
> 现行状态：`public_css_status=IMPLEMENTED_FIRST_PAGE_ADOPTED_PENDING_REMOTE_REVIEW`、`public_css_code_review_status=APPROVED`。
> **公共代码复审通过不等于页面接入已通过复审，也不等于正式验收通过；其余页面采用为独立决定。**
>
> **首个页面接入时序**：`public_css_code_review` `APPROVED` 后，项目负责人决定**先**让 `/config/client`
> （探针端管理）**新增／编辑业务主弹窗**接入本模板；接入任务 `CREATE-EDIT-DIALOG-CLIENT-CONFIG-FIRST-ADOPTION-001`
> 起始提交 `ab4d49766d089c741159c2c86861f6af7e74b29b`，**仅**改该页组件及其测试、同步本模板与 Feature 现行状态块、
> 新增实施报告与脱敏证据（见 `docs/features/client-config/reports/CLIENT-CONFIG-CREATE-EDIT-DIALOG-FIRST-ADOPTION-001.md`），
> **未**改公共 CSS、**未**接入其他页面、**未**做正式验收。接入状态记为
> `page_adoption_implementation_status=IMPLEMENTED_PENDING_CHATGPT_REMOTE_REVIEW_AND_OWNER_VISUAL_CHECK`
> （**已实现、待远程代码复审和负责人目测**），**不**写成已接受或正式验收 `PASS`。
>
> 实现分层：公共 CSS 预设已落地（含静态契约测试与隔离合成夹具真实 Element Plus 浏览器证据，见 `reports/`），
> 且**已通过远程代码复审**。**Vue 组件仍未创建**；公共实现任务**未修改任何业务页面**
> （页面接入在该实现任务时点未授权；其后首个页面接入见上「首个页面接入时序」）。
>
> **页面接入复审时序**：R0 接入提交 `d878c3d7c95b482ee47b2d08571531cbad3b06fd` 经 ChatGPT 从远程 Git
> 复审（区间 `ab4d49766d089c741159c2c86861f6af7e74b29b..d878c3d7c95b482ee47b2d08571531cbad3b06fd`）结论为
> `CHANGES_REQUIRED`——**产品代码接入、测试与只读浏览器证据未发现需改代码的阻塞项**，
> 但模板设计契约仍有「页面接入未授权」等过时**现行**表述；该纯文档口径矛盾已由 R1 定向纠错任务
> `CREATE-EDIT-DIALOG-CLIENT-CONFIG-FIRST-ADOPTION-001-R1` 修正（**不**重跑代码验收、**不**做负责人目测）。
> **R0 复审 `CHANGES_REQUIRED` 不等于整个接入已 `APPROVED`。**
>
> 下一入口：`CHATGPT_REMOTE_CREATE_EDIT_DIALOG_CLIENT_CONFIG_FIRST_ADOPTION_R1_REVIEW`——
> 由 ChatGPT 从远程 Git 对 R1 纠错后的**首个页面接入**代码区间作独立只读**代码复审**；
> 模板级「页面迁移/试点」历史键语义为**模板级批量迁移**，与本次**单页接入**不同层，**保持原措辞**；
> 其余页面接入仍须**独立评估、独立授权**，本目录**不授权**任何其他页面接入。
> **R1 纠错提交并推送 ≠ R1 远程复审通过 ≠ 项目负责人已目测 ≠ 正式验收通过。**

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
| **拟议（设计推断）** | 本设计**提出**的公共契约、类名、令牌、可选能力 | 批准后即为**已批准设计契约**；**须**逐项标注其当前实现状态（**已实现／仍未实现**），**不得**把**仍未实现**项包装为「两页已实现」或「已落地」。公共 CSS／类名／令牌登记／静态契约测试现为**已实现，且已通过远程代码复审**（`public_css_code_review_status=APPROVED`）；Vue 组件仍 `NOT_CREATED` |

- 本任务**不**引入与列表表格模板相同的 `LIST_TABLE_*` 标记通道；本目录使用
  `create_edit_dialog_visual_template_*` 前缀的状态键（见文首）与本节的「现行事实／拟议」分区。
- **已落地**的候选能力（公共 CSS 工件、7 个 `ced-*` 辅助类、17 个 `--ced-*` 令牌登记、静态契约测试）
  标注为**已批准设计、已实现，且已通过远程代码复审（纯 CSS 公共能力）**，其存在性**不再是** `NOT_CREATED`。
- **仍未创建**项（Vue 公共组件）标注为 `NOT_CREATED`；**页面级采用授权**现为
  `PAGE_ADOPTION_AUTHORIZED_CLIENT_CONFIG_CREATE_EDIT_MAIN_DIALOG_ONLY`（**仅** `/config/client`
  新增／编辑主弹窗，`migrated_page_count=1`，**待远程代码复审与负责人目测**）；**其余页面仍未授权**，
  模板级批量迁移与试点仍未决定（`pilot_page_selection_status=NOT_DECIDED`）。

## 5. 证据来源（两页实际位置）

| 页面 | 组件 | 主新增／编辑弹窗 | 已批准条款（Feature 基线） |
|---|---|---|---|
| 探针端管理（**已接入**） | `frontend/src/views/client-config/ClientConfigPage.vue` | `<el-dialog class="cc-dialog ced-dialog" width="900px">`（根类 `ced-dialog` 已挂；`width="900px"` 经 EP `--el-dialog-width` 生效） | `docs/features/client-config/{REQUIREMENTS,ACCEPTANCE,DESIGN,UI}.md`：`CCFG-REQ-116/119/120/123/124/128/130/137/138`、`CCFG-UI-045/046/047/050/051/055/057`、`CCFG-DESIGN-056/059/061/062/066/068/072/073` |
| 数据源管理 | `frontend/src/views/data-source/DataSourcePage.vue` | `<el-dialog class="editor-dialog" width="620px">`（约 190 行） | `docs/features/data-source-management/REQUIREMENTS.md`：`DS-REQ-185/186/187`（及该 Feature 已批准基线） |

详细的一致与差异见 `DESIGN.md` 与 `MIGRATION.md`；公共契约（已批准设计、已实现）见 `SHARED_COMPONENT_DESIGN.md`；视觉规格见 `UI.md`。

## 6. 文档导航

| 文件 | 职责 |
|---|---|
| `README.md`（本文件） | 任务边界、证据来源、文档导航、状态分层与下一入口 |
| `DESIGN.md` | 可复用能力、显式 opt-in 契约、公共／Feature 归属与实现方案选择 |
| `UI.md` | 候选视觉规格、状态矩阵、响应式与可访问性 |
| `SHARED_COMPONENT_DESIGN.md` | 未来实现边界、作用域／零泄漏约束、可选能力与不变量 |
| `MIGRATION.md` | 两页各自现状、选择性接入步骤，以及**首个页面接入与其他页面未授权**的分层时序 |
| `reports/CREATE-EDIT-DIALOG-VISUAL-TEMPLATE-BASELINE-DRAFT-001.md` | R0 历史快照：事实／推断分层、来源映射、冲突与待审点、变更清单、保护核验与下一入口 |
| `reports/CREATE-EDIT-DIALOG-VISUAL-TEMPLATE-BASELINE-DRAFT-001-R1.md` | R1 定向纠错：两处阻塞、旧→新文本／位置、保护核验与下一入口（对 R0 不准确结论作勘误，不回写 R0） |
| `reports/CREATE-EDIT-DIALOG-VISUAL-TEMPLATE-BASELINE-APPROVAL-CLOSEOUT-001.md` | 批准收口：门禁、R0→R1→R2 复审时序、项目负责人原话、批准对象与边界、状态旧→新、文件清单、保护核验与下一入口 |
| `reports/CREATE-EDIT-DIALOG-VISUAL-TEMPLATE-PUBLIC-CSS-IMPLEMENTATION-001.md` | 公共 CSS 实现：范围与实现取舍、类名／令牌清单、静态契约测试、隔离合成夹具浏览器证据、变更文件、零影响核验、未执行项与下一入口 |
| `reports/evidence/CREATE-EDIT-DIALOG-VISUAL-TEMPLATE-PUBLIC-CSS-IMPLEMENTATION-001/` | 上述实现的脱敏可复算浏览器证据（合成夹具、CDP 驱动、计算样式原始输出） |
| `reports/CREATE-EDIT-DIALOG-VISUAL-TEMPLATE-PUBLIC-CSS-IMPLEMENTATION-001-R1.md` | R1 定向纠错：三处复审发现、旧→新文本／位置、令牌逐一消费点、真实 EP 状态矩阵、零接入核验与下一入口（对 R0 不准确结论作勘误，不回写 R0） |
| `reports/evidence/CREATE-EDIT-DIALOG-VISUAL-TEMPLATE-PUBLIC-CSS-IMPLEMENTATION-001-R1/` | R1 实现的脱敏可复算浏览器证据（真实 Element Plus 样式 + 真实 Vue/EP 组件 DOM、CDP 驱动、计算样式与命中规则原始输出） |
| `reports/CREATE-EDIT-DIALOG-VISUAL-TEMPLATE-PUBLIC-CSS-REVIEW-STATUS-SYNC-001.md` | 代码复审状态同步：门禁、复审来源与固定区间 R0→R1、状态旧→新、未变层、文件清单、静态核验、未执行项与下一入口 |
| `../../features/client-config/reports/CLIENT-CONFIG-CREATE-EDIT-DIALOG-FIRST-ADOPTION-001.md` | **首个页面接入**（Feature 侧交叉引用报告）：`/config/client` 新增／编辑主弹窗接入本模板的门禁、视觉归属 before→after、测试与浏览器证据、零写计数、定义与状态保护、未执行项与下一入口 |
| `../../features/client-config/reports/CLIENT-CONFIG-CREATE-EDIT-DIALOG-FIRST-ADOPTION-001-R1.md` | **首个页面接入 R1 定向纠错**（纯文档）：R0 接入复审 `CHANGES_REQUIRED` 的过时「页面接入未授权」现行表述纠正、逐位置旧→新表、现行/历史分层、定义与状态格保护、未执行项与 R1 下一入口 |

## 7. 与其他模板的关系

- 与 `list-table-visual-template`（**表格层**）和 `query-list-page-template`（**页面层**）**正交**：
  本模板覆盖**弹窗层**。三者**不**互相并入、**不**互相扩大适用范围。
- 本模板的组织方法（分层状态、显式 opt-in、零泄漏、文档导航、草案与批准态隔离）
  **借鉴**自上述既有模板，但**不**复用其标记、类名或令牌命名空间。

## 8. 边界声明

- **公共 CSS 已实现 ≠ 已通过远程代码复审 ≠ 页面接入已通过复审 ≠ 正式验收通过。**
  **公共代码复审通过（`APPROVED`, `2026-09-30`）≠ 页面接入代码复审通过 ≠ 正式验收通过。**
- 现行页面级采用授权**仅限** `/config/client`（探针端管理）**新增／编辑业务主弹窗**
  （`page_adoption_authorization_status=PAGE_ADOPTION_AUTHORIZED_CLIENT_CONFIG_CREATE_EDIT_MAIN_DIALOG_ONLY`，
  `migrated_page_count=1`）；**数据源管理（`/config/data-source`）及其弹窗、其他任何页面均未获授权接入**，
  该弹窗模板级批量迁移与试点仍**未作出**（`pilot_page_selection_status=NOT_DECIDED`）。
  将来接入须由项目负责人**单独授权**，并另立实现与验收任务。
- **批准只覆盖设计契约**；公共 CSS 已由独立实现任务落地并**已通过远程代码复审**，
  **Vue 组件仍未创建**。**任何页面**在**获明确授权**前**不得**接入本模板、**不得**据本设计修改。
