# 列表表格视觉模板公共实现 · 详细设计（已批准）

```text
list_table_visual_template_document_status=APPROVED
list_table_visual_template_design_status=BASELINE_APPROVED
project_owner_approval_status=APPROVED
project_owner_approval_date=2026-09-21
approval_scope=BASELINE_CONTENT_ONLY
approved_baseline_source_commit=575379895c4c57fd3df7e0d0ce27c1f6841d2f17
baseline_approval_closeout_commit=7b16919ea9a7ac2a1196e302e987e5e355689c31
baseline_approval_closeout_r1_commit=e8eb68e368313aa501eb5f7158f6e95975b2077b

shared_implementation_design_status=APPROVED
shared_implementation_design_approval_status=APPROVED
shared_implementation_status=IMPLEMENTED_ACCEPTED
reference_page_integration_status=IMPLEMENTED_ACCEPTED
project_owner_visual_review_status=PASS
project_owner_visual_review_date=2026-09-22
formal_acceptance_execution_status=EXECUTED_PASSED_LOCAL
formal_acceptance_pass_count=14
formal_acceptance_fail_count=0
formal_acceptance_blocked_count=0
formal_acceptance_not_run_count=0
chatgpt_remote_formal_acceptance_review_status=REVIEW_PASS
chatgpt_remote_formal_acceptance_review_blocking_finding_count=0
chatgpt_remote_formal_acceptance_reviewed_commit=8501416e750c7eb8547c7f922b1bed3545c7cb17
shared_implementation_project_owner_acceptance_status=APPROVED
final_acceptance_status=ACCEPTED_BY_PROJECT_OWNER
shared_implementation_completion_status=COMPLETED
project_owner_final_acceptance_decision=APPROVED
project_owner_final_acceptance_date=2026-09-22
pending_project_owner_acceptance=NO
page_migration_status=NOT_STARTED
page_migration_authorization_status=NOT_GRANTED
candidate_inventory_status=COMPLETED_APPROVED_AS_BASELINE_INVENTORY
final_acceptance_scope=SHARED_IMPLEMENTATION_AND_DATA_SOURCE_REFERENCE_PAGE_INTEGRATION_ONLY
current_next_entry=NONE_SHARED_IMPLEMENTATION_FINAL_ACCEPTED_AND_CLOSED_NO_PAGE_MIGRATION_AUTHORIZED

design_task=LIST-TABLE-VISUAL-TEMPLATE-SHARED-IMPLEMENTATION-DESIGN-001
design_task_type=DOCS_ONLY_SHARED_IMPLEMENTATION_DETAILED_DESIGN
design_base_commit_id=e8eb68e368313aa501eb5f7158f6e95975b2077b
design_revision_chain=d7ae5af54e62bba20373681f9f55fc7fb67f39a7(R0)_f8d84657e939a4b02316457b543976a847b0775b(R1)_e72264de14a9483aae5593435f818ea65c5116e0(R2)
chatgpt_remote_r2_review=REVIEW_PASS
blocking_finding_count=0
project_owner_design_approval_status=APPROVED
project_owner_design_approval_date=2026-09-21
approval_scope=SHARED_IMPLEMENTATION_DETAILED_DESIGN_ONLY
approved_design_source_commit=e72264de14a9483aae5593435f818ea65c5116e0
reference_source_commit=10b1d3e39d03dbb78ea409d486f1f3e80c12fc3e
selected_implementation_architecture=EXPLICIT_ROOT_CLASS_CSS_PRESET_WITH_LIMITED_CSS_CUSTOM_PROPERTY_TOKENS
selected_implementation_architecture_status=APPROVED
introduces_vue_wrapper_component=NO
adds_extra_dom_layer=NO
```

> 本文件是**公共实现详细设计**，已对已批准基线的四个候选方案作出**唯一、可实施、
> 可验证、可回滚**的设计结论，并经 ChatGPT 远程 Git R2 复审 `REVIEW_PASS`
> 与项目负责人于 `2026-09-21` 批准
> （`approval_scope=SHARED_IMPLEMENTATION_DETAILED_DESIGN_ONLY`）。
>
> `shared_implementation_design_status=APPROVED`
> **只表示**本详细设计**文档**已获批准。在**详细设计批准当时**，它**不表示**：
> 公共代码已实现、任何公共文件/类名/令牌已存在、
> 数据源管理参考页已接入、任何页面已迁移、正式验收已执行。
>
> **随后该设计已由独立实现任务落地**：公共层与数据源管理参考页等价接入均已实现
> （`LIST-TABLE-VISUAL-TEMPLATE-SHARED-IMPLEMENTATION-AND-DATA-SOURCE-REFERENCE-INTEGRATION-001`），
> 且项目负责人已于 `2026-09-22` **目测通过**
> （`project_owner_visual_review_status=PASS`，页面入口
> `http://192.168.174.70:5173/config/data-source`）。
> 随后独立正式验收任务
> `LIST-TABLE-VISUAL-TEMPLATE-SHARED-IMPLEMENTATION-FORMAL-ACCEPTANCE-001`
> 已执行**本地正式验收**：14/14 PASS，
> `formal_acceptance_execution_status=EXECUTED_PASSED_LOCAL`
> （`fail=0 / blocked=0 / not_run=0`）；
> 再经独立收口任务
> `LIST-TABLE-VISUAL-TEMPLATE-SHARED-IMPLEMENTATION-FINAL-ACCEPTANCE-CLOSEOUT-001`
> 记录 ChatGPT 对正式验收提交
> `8501416e750c7eb8547c7f922b1bed3545c7cb17` 的复审结论
> （`REVIEW_PASS`、`blocking_finding_count=0`），项目负责人于 `2026-09-22`
> **最终接受并关闭**该实现：
> `shared_implementation_status` / `reference_page_integration_status` 为
> `IMPLEMENTED_ACCEPTED`，`final_acceptance_status=ACCEPTED_BY_PROJECT_OWNER`。
> **本次最终接受范围仅限**公共实现与数据源管理参考页等价接入，
> **不**代表批准探针端管理、数据订阅或其他任何业务页面迁移；
> 页面迁移仍 `NOT_STARTED` / `NOT_GRANTED`。
> 本文件的下述设计伪代码与阶段清单保留为**已批准设计依据**，
> 其中“未来阶段一”一类措辞描述的是**设计当时**的规划，**已**由上述独立任务落地。
>
> 本次设计批准**当时明确不覆盖**：创建 `frontend/src/styles/list-table/` 或任何代码文件、
> 修改 `DataSourcePage.vue` 或任何测试文件、公共实现开工、参考页接入开工、
> 任何业务页面迁移、正式验收执行、生产可用。
>
> 设计任务**当时未创建**任何 CSS / Vue / Composable / TypeScript / 路由文件，
> **未修改** `frontend/**`、`backend/**`、测试、配置、依赖或锁文件，
> **未修改**任何业务页面，**未运行**测试、构建或浏览器验证，
> **未访问**数据库 / ZooKeeper / Kafka / 业务源库 / 目标库。
>
> **未经项目负责人后续再次明确批准，不得修改任何代码。**

## 0. 本文件的标记与边界

### 0.1 唯一标记

`LIST_TABLE_SHARED_DESIGN_APPROVED` —— 本文件全文只使用**一个**当前设计决策标记：

```text
LIST_TABLE_SHARED_DESIGN_APPROVED
```

含义：**已经形成唯一详细设计结论，并已经 ChatGPT 远程 R2 复审 `REVIEW_PASS`
及项目负责人批准**（`approval_scope=SHARED_IMPLEMENTATION_DETAILED_DESIGN_ONLY`）。

该标记**只**描述**详细设计文档**的批准状态。在**详细设计批准当时**，它**不**表示：

- 公共实现已开始（当时 `shared_implementation_status=NOT_STARTED`）；
- 数据源管理参考页已接入（当时 `reference_page_integration_status=NOT_STARTED`）；
- 任何页面已迁移（`page_migration_status=NOT_STARTED / NOT_GRANTED`）；
- 测试或构建已执行、正式验收已完成。

随后公共实现与数据源管理参考页接入已由独立实施任务落地，
经项目负责人于 2026-09-22 目测通过，由独立正式验收任务完成本地正式验收
（`formal_acceptance_execution_status=EXECUTED_PASSED_LOCAL`，14/14 PASS），
并由项目负责人于 2026-09-22 **最终接受并关闭**
（`shared_implementation_status` / `reference_page_integration_status` 为
`IMPLEMENTED_ACCEPTED`，`final_acceptance_status=ACCEPTED_BY_PROJECT_OWNER`）；
页面迁移仍 `NOT_STARTED / NOT_GRANTED`。

本文件**不**复用模板基线标记冒充详细设计已批准——
模板基线标记属四份规范文档，描述的是**模板规则**的批准，两者**不得**合并为模糊状态。
已批准基线的三类标记（参考事实 / 已批准模板规则 / 候选未实现）亦属四份规范文档，
本文件引用它们时只写“已批准模板规则（`README.md` §7.2）”等**引用语**，
**不**新增这三类标记实例，因此**不改变**四份规范文档的计数（**现行**为 `28 / 0 / 43 / 7`，核验见
`README.md` §7.4；历史时点值见 §11.3 与 §12.8 各**带日期**的复测记录）。

**第七轮可选扩展的标记口径（2026-09-29，R2 纠正后）** —— 本文件 §12「行内三点入口 opt-in」可选扩展
的**设计基线已批准**、其 **opt-in 代码已落地**并接入 `/config/client` 主列表。按 `README.md` §7.3 的阅读约定
（**已批准选择结果**与**已落地实现事实**必须标注参考事实标记），§12 中描述**现行源码事实与已批准设计取值**的
内容**统一标注** `LIST_TABLE_REFERENCE_FACT`（该标记的**定义**在 `README.md` §7.1／§7.3，本次**只引用、不重定义**）；
**仍未被实现**的内容（三点入口触发器的**禁用态视觉规则**）标注 `LIST_TABLE_PROPOSED_NOT_IMPLEMENTED`。
**§13 分层契约经 `2026-09-29` 批准后**：其**已批准的设计契约**改用本文件唯一的批准态设计标记
（其字面量见 §11.2 的拼接构造式），其**公共实现的状态**据实标注参考事实标记——**批准态与代码状态分列，不混同**。
（该实现在 `2026-09-29` 批准时**尚不存在**；随后由独立任务 `LIST-TABLE-OPTIONAL-SINGLE-ROW-HIGHLIGHT-PUBLIC-IMPLEMENTATION-001`
于 `2026-09-30` 落地，并经 ChatGPT 从远程 Git 对该实现提交的**独立只读代码复审**结论 `APPROVED`，
**现行**状态为 `IMPLEMENTED_PENDING_USER_ACCEPTANCE`（已实现且代码复审通过、尚待项目负责人接受或采用决定），
见 §13.3。其**辅助类**现行计数由 `2` 变为 `4`。）
**不再**因「代码待远程复审」把**已落地事实**标为候选未实现——
`IMPLEMENTED_PENDING_CHATGPT_REVIEW` 是**复审状态**，**不**等于 `NOT_IMPLEMENTED`（`README.md` §7.3）。
该标记例外**只**落在 §12、§13.3（其实现状态）与本节／§11 的说明文字中：§1~§10 已批准详细设计正文**仍只使用**
本文件唯一的批准态设计标记（其字面量见 §11.2 的拼接构造式）；§13.3／§13.4 两处经 `2026-09-29` 批准由
候选未实现标记改标本标记，故本文件该标记**现行计数为 `81`**（原 `79`，见 §12.8 通道 2）；
四份规范文档的核验命令（`README.md` §7.4）**不扫描本文件**。§12／§13 的参考事实标记与候选未实现标记
**独立**核算（见 §12.8），与四份规范文档计数及本文件批准态设计标记计数**互不混算**。

**第七轮可选扩展的历史与批准链（2026-09-29，摘要）** —— 本扩展经 `...-BASELINE-001` R0 `9381703…`、
R1 `938e720…` 两次从远程 Git 复核均 `CHANGES_REQUIRED`，R2 `59617b4…` 经 ChatGPT 从远程 Git 独立复核
`APPROVED`，项目负责人于 2026-09-29 批准其**设计基线**（R2 修订后口径；**批准对象是设计基线，
不是实现**）；随后由独立实现任务
`CLIENT-CONFIG-ROW-HEIGHT-AND-OPTIONAL-ELLIPSIS-IMPLEMENTATION-001` 落地代码（见下段）。
各轮拟议文本、旧计数（如 `lt_internal_helper_class_count` 阶段一 `0`）与当时「尚未实现」说明属
**时点历史**，保留在既有历史报告；**现行**取值见下段与 §12.7／§12.8。

**第七轮可选扩展 opt-in 代码实现（2026-09-29；`CLIENT-CONFIG-ROW-HEIGHT-AND-OPTIONAL-ELLIPSIS-IMPLEMENTATION-001`）**
`LIST_TABLE_REFERENCE_FACT` —— 承第七轮设计基线批准收口，由探针端管理 Feature 侧的前端实现任务按**已批准设计文本**落地本 §12 的
opt-in 扩展：在 `frontend/src/styles/list-table/list-table-visual.css` 新增仅受 `.lt-main-table` 根类限定的
`lt-row-action__cell`（操作列 `td`）与 `lt-row-action__ellipsis`（三点触发器）两条规则
（命中区约 `28×28px`、行内居中、圆角 `6px`、既有主色、hover、`:focus-visible` 内嵌焦点环、光标、行高协同），
并同步更新 `frontend/src/styles/list-table/list-table-visual.spec.ts` 静态断言 #11 为「**先剔除根类**
再断言辅助类集合」的可实现口径（断言 #2／#3／#6 **不变**）。据此，本 §12 状态由
`DESIGN_BASELINE_APPROVED_IMPLEMENTATION_NOT_STARTED` 更新为
**`DESIGN_BASELINE_APPROVED_IMPLEMENTATION_IMPLEMENTED_PENDING_CHATGPT_REVIEW`**：
**现行** `lt_token_count` 仍为 **9**（默认不新增 `--lt-*` 令牌）、`lt_internal_helper_class_count`
由 `0` 变为 **2**（仅 `{lt-row-action__cell, lt-row-action__ellipsis}`，其他 `lt-` 类仍禁止）。
**该实现完成 ≠ 远程代码复审通过 ≠ 已目测 ≠ 已正式验收**；本模板整体状态与授权边界**不变**：
`shared_implementation_status`／`reference_page_integration_status` 仍 `IMPLEMENTED_ACCEPTED`、
`final_acceptance_status` 仍 `ACCEPTED_BY_PROJECT_OWNER`、`page_migration_status` 仍 `NOT_STARTED`、
`page_migration_authorization_status` 仍 `NOT_GRANTED`、`pilot_page_selection_status` 仍 `NOT_DECIDED`；
数据源管理「更多」→三点迁移仍属**另一会话、另一独立任务**。

> **复审状态同步（2026-09-30 追加，不改写以上实现时点表述）**：上段「`IMPLEMENTED_PENDING_CHATGPT_REVIEW`
> （待远程复审）」是**实现提交时点**的真实历史值。其后，项目负责人转交 ChatGPT 对 R0 `d93f838…` 与
> R1 `aa942dc1…` 的**远程独立只读代码复审**结论为 **`APPROVED`**（复审时点 2026-09-30，固定区间
> `a042df0…..d93f838…` 与 `d93f838…..aa942dc1…`）。据此 **§12 现行实现状态**已更新为
> `IMPLEMENTED_PENDING_USER_ACCEPTANCE`（**已实现且代码复审通过、仍待项目负责人最终接受或正式验收**），
> 上述历史值保留为 `list_table_row_action_opt_in_extension_implementation_submission_status`。
> 该复审**只**覆盖 §12 与第七轮行高的代码复审，**不**表示 157 条正式验收整体通过、**不**表示 §12.1
> 禁用态视觉已实现、**不**授权任何页面迁移。详见 §12.8 末段。
>
> **现行计数与 §13 状态更新（2026-09-30 追加）**：§13.3 公共可选单行固定高亮实现落地后，
> **现行** `lt_internal_helper_class_count` 由 **2** 变为 **4**（`{lt-row-action__cell,
> lt-row-action__ellipsis, lt-row-highlight, lt-row-highlight__row}`），`lt_token_count` 仍 **9**；
> §13 公共实现状态见 §13.3（现行 `IMPLEMENTED_PENDING_USER_ACCEPTANCE`，即已实现且远程代码复审通过）。
> 上述 §12 段落中的 `2` 为**该实现时点值**，**不**回写。
>
> **§13 页面接入现状（2026-09-30 追加）**：经项目负责人**页面级**授权，`/config/client`（探针端管理）**主列表**
> 已接入 §13.3 公共可选单行固定高亮预设（表级 `.lt-row-highlight` 与根类并列 + 行级
> `.lt-row-highlight__row`），页面私有高亮视觉规则已移除，外观由公共预设唯一承担；
> 其**接入代码**已经 ChatGPT 从远程 Git 独立只读代码复审、结论 `APPROVED`（2026-09-30，区间
> `ebf34d9…..5cb8079…`），项目负责人亦于 2026-09-30 反馈「我试了，页面功能没问题」；现行分层状态见 §13.3
> （`..._page_integration_status=PARTIAL_CLIENT_CONFIG_MAIN_LIST_ONLY_ADOPTED_REVIEW_APPROVED_OWNER_FEEDBACK_OK_PENDING_FORMAL_ACCEPTANCE`，
> **仍待正式验收**）。**其余任何页面**（含
> `/config/data-source`）**未被授权**接入，仍零挂载。这是**页面的可选采用**，**不**改变模板默认行为，
> **不**扩大公共 CSS 的默认生效范围；模板级迁移状态（`page_migration_status=NOT_STARTED` 等）
> 与模板级 `current_next_entry` **仍为原值**（**另一状态层**，见 §6）。

历史状态说明：本文件在**收口前**的草案阶段使用带 `_DRAFT` 后缀的草案标记；
该字面量**仍逐字保留**在 R0 / R1 / R2 三份历史执行报告中，属**历史事实**，
**不得**回写、改名或全局替换（详见 §11.4）。本文件**当前正文内不再出现**该草案字面量。

**模板定向整理（2026-09-29，`LIST-TABLE-VISUAL-TEMPLATE-CLIENT-CONFIG-REFINEMENT-BASELINE-001`，纯文档草案）**
—— 本任务以已实现、经项目负责人目测认可的 `/config/client` 主列表为参照整理模板现行规则与可选能力，
**删除**五份规范正文中面向现行规则的**过期示例**，并新增本文件 §13「现行基础规则与可选扩展分层契约」
（**尚待审批**，`DRAFT_PENDING_USER_REVIEW`）。标记复算：四份规范文档
（`REFERENCE_FACT / DRAFT / APPROVED / PROPOSED` 顺序）`27 / 0 / 42 / 8`、
本文件批准态标记仍 `79`、本文件候选未实现标记 `23`（§12 内 `18`、§13 内 `2`、其它说明 `3`）。
本任务**不**改变模板整体状态与授权边界：`page_migration_status` 仍 `NOT_STARTED`、
`page_migration_authorization_status` 仍 `NOT_GRANTED`、`pilot_page_selection_status` 仍 `NOT_DECIDED`；
**不**改数据源管理页（其「更多」→三点改造仍属**另一独立任务**）。

**模板整理 R1 定向纠错（2026-09-29，`LIST-TABLE-VISUAL-TEMPLATE-CLIENT-CONFIG-REFINEMENT-BASELINE-001-R1`，纯文档草案）**
—— ChatGPT 对 R0 提交 `0b43a444ab002ea21c1fe7ad4884b241c950b317` 的远程文档复审结论为
`CHANGES_REQUIRED`，要求**只**就地修正三处：① 把 §12.7 由「拟修订契约」正文改写为**现行可执行契约**，
并压缩 §0.1／§12 的 R0／R1／R2 历史为摘要；② 统一 §12.1 与 §13.2 的**禁用态**两级职责
（是否 / 何时禁用由 Feature 决定，可观察禁用态的通用视觉由公共层负责；现行 CSS 尚无禁用视觉规则，
据实记为**设计契约、尚未实现、尚未验收**）；③ 把 §13.5「已按…收窄」等表述改为**拟议、待批准后生效**
的准确时序。上述修正**不**改任何已批准规则、**不**改标记实例计数与模板级迁移状态；
§13 新增可选契约仍为 `DRAFT_PENDING_USER_REVIEW`。本轮**未**改数据源管理页；
`/config/data-source` 迁移状态仍 `NOT_STARTED`／`NOT_GRANTED`。

**模板整理 R2 标记口径纠错（2026-09-29，`LIST-TABLE-VISUAL-TEMPLATE-CLIENT-CONFIG-REFINEMENT-BASELINE-001-R2`，纯文档草案）**
—— ChatGPT 对 R1 提交 `e4c16df7459440b5a9390830c06f0525a934f9b4` 的远程文档复审结论为
`CHANGES_REQUIRED`：**已落地的实现事实仍被标为候选未实现**（与 `README.md` §7.3「已落地事实必须用参考事实标记」
直接冲突）。R2 **只**做标记语义的最小纠错：把 §12 中描述**现行源码事实与已批准设计取值**的内容
（已落地 CSS 规则、显式 opt-in 挂载、测试断言、令牌数 `9`、辅助类数 `2`）由
`LIST_TABLE_PROPOSED_NOT_IMPLEMENTED` 改标为 `LIST_TABLE_REFERENCE_FACT`；把**仍未实现**的
三点入口触发器**禁用态视觉规则**与**尚待批准**的 §13 分层契约**拆为独立句／段**并保留
`LIST_TABLE_PROPOSED_NOT_IMPLEMENTED`；同时删除 `README.md` §8 等处「因为待复审所以仍按候选未实现标记引用」
的推导。**不**改任何已批准规则、**不**实施新样式、**不**批准 §13 新可选契约，模板级迁移状态**不变**
（`page_migration_status=NOT_STARTED` 等）；**不**改数据源管理页。

### 0.2 事实来源与核验方式

本文件所有“参考实现事实”均在**真实源码**中逐条读取核验，基准提交：

```text
reference_source_commit=10b1d3e39d03dbb78ea409d486f1f3e80c12fc3e
```

（该提交与已批准基线 `UI.md` / `MIGRATION.md` 声明的基准提交一致；
设计任务基准提交 `e8eb68e368313aa501eb5f7158f6e95975b2077b` 相对它
**未修改** `frontend/**`，见 §2.7。）

本轮实际读取的文件（**全部只读**）：

| 范围 | 文件 |
| --- | --- |
| 工程与构建 | `frontend/package.json`、`frontend/vite.config.ts`、`frontend/src/main.ts` |
| 全局样式 | `frontend/src/styles/global.css` |
| 参考实现 | `frontend/src/views/data-source/DataSourcePage.vue` |
| 参考实现测试保护 | `frontend/src/views/data-source/dataSource.spec.ts` |
| 共享层先例 | `frontend/src/components/query-list/**`（含 `query-list-spinner.css`、`shared-layer.spec.ts`、`index.ts`、6 个 `.vue`） |
| 共享层先例 | `frontend/src/composables/query-list/**` |
| 未启用使用点 | `frontend/src/views/client-config/ClientConfigPage.vue`、`frontend/src/views/data-subscribe/DataSubscribePage.vue`、`frontend/src/views/data-source-run-state/components/DataSourceSnapshotTable.vue`、`frontend/src/views/topic-offset/components/OffsetTable.vue`、`frontend/src/views/server-config/ServerConfigPage.vue`、`frontend/src/views/log-query/components/LogQueryTable.vue`、`frontend/src/views/monitor/job-failure/history-list.vue` |
| 构建插件行为 | `frontend/node_modules/@vitejs/plugin-vue/dist/index.mjs`（只读，用于核实 §2.3） |

### 0.3 本轮不做的事

`LIST_TABLE_SHARED_DESIGN_APPROVED` —— 本任务**不**：

- 创建任何 CSS / Vue / Composable / TypeScript / 路由文件；
- 修改 `frontend/**`、`backend/**`、`docs/features/**`、`query-list-page-template/**`；
- 修改测试、配置、依赖或锁文件；
- 接入数据源管理参考页，或修改任何业务页面；
- 迁移任何页面，或预先选择首个迁移对象；
- 运行代码格式化器、测试、构建、服务或 HTTP 调用；
- 把公共实现写为已实现，或把参考页接入、正式验收、页面迁移写为已开始/已完成；
- 修改任务外工作区内容（`.claude/settings.local.json`、`docs/prompts/`）。

当前状态分层（不得混读、不得合并为笼统的“已完成”）：

```text
详细设计                     已批准（APPROVED）
公共实现                     IMPLEMENTED_ACCEPTED —— 已实现、目测通过、本地正式验收通过、经项目负责人最终接受并关闭（2026-09-22）
数据源管理参考页接入         IMPLEMENTED_ACCEPTED —— 已接入、目测通过、本地正式验收通过、经项目负责人最终接受并关闭（2026-09-22）
正式验收                     EXECUTED_PASSED_LOCAL —— 已执行并通过（14/14 PASS）；ACCEPTED_BY_PROJECT_OWNER，最终接受已作出
页面迁移                     NOT_STARTED / NOT_GRANTED —— 未开始、未授权
```

（“详细设计 已批准”是**该收口任务**的结果；公共实现与参考页接入的状态
由**后续独立实施任务**推进，目测结论由**目测收口任务**回写，最终接受由**最终验收收口任务**回写，
见本文件导语与 §11。）

---

## 1. 目标、非目标与适用范围

### 1.1 目标

`LIST_TABLE_SHARED_DESIGN_APPROVED` —— 本设计要回答的问题，以及本轮给出的答案：

| 问题 | 本轮答案位置 |
| --- | --- |
| 四个候选方案中选哪一个，其余三个为什么拒绝 | §3 |
| 是否引入 Vue 包装组件、是否新增 DOM 层 | §3.4 |
| 未来要创建哪些文件、放在哪里 | §4.1 |
| 业务页面如何显式启用 | §4.2 |
| 类名、命名空间与 Element Plus 交互边界 | §4.3 |
| 公共视觉令牌的逐项默认值、来源与可覆盖性 | §4.4 |
| Feature 覆盖哪些、禁止覆盖哪些、优先级如何 | §4.5 |
| 如何做到显式启用与零全局泄漏 | §4.6 |
| 哪些内容必须留在 Feature | §5 |
| 数据源管理参考页未来如何逐项等价接入 | §6 |
| 后续实现阶段的验证矩阵与回滚方法 | §7 / §9 |
| 阶段如何拆分，为什么本轮不选首个迁移页 | §8 |

### 1.2 非目标

`LIST_TABLE_SHARED_DESIGN_APPROVED`：

1. **不实现**任何样式文件、常量模块或组件；
2. **不接入**数据源管理参考页，**不修改**其任何 DOM、类名或样式；
3. **不迁移**任何页面，**不预先选择**探针端管理、数据订阅或任何其他页面作为首个迁移对象；
4. **不引入**新依赖、新构建步骤、新测试框架、CSS Module、CSS-in-JS 或预处理器；
5. **不新增**全局样式、全局指令、全局插件或路由元数据；
6. **不定义**任何已批准基线未覆盖的视觉值（§4.4 明确逐项处置）；
7. **不把**“序号列”“空态”“ID 强调”“停用/异常胶囊”“状态标签配色”提升为公共默认规则。

### 1.3 适用范围

`LIST_TABLE_SHARED_DESIGN_APPROVED` —— 本设计与已批准基线一致，只面向**页面的主列表表格**：

- **适用**：页面结果区中承载该页面主要业务记录集的那一张 `el-table`；
- **不适用**（已批准基线 `README.md` §3）：弹窗内表格、详情子表、确认表格、
  大屏/复合视图内嵌表、非 `el-table` 的展示型列表。

本设计**不**扩大该范围，也**不**为上述不适用形态预留隐式入口（§4.2 禁止项）。

---

## 2. 现状代码事实与工程能力核验

### 2.1 参考实现主表的局部样式事实

`LIST_TABLE_SHARED_DESIGN_APPROVED` —— 参考实现
`frontend/src/views/data-source/DataSourcePage.vue` 中，与“表格视觉模板”相关的
局部样式**只有以下 4 个规则组**（全部位于第 1656 行开始的 `<style scoped>` 块内）：

| # | 位置 | 选择器 | 声明 |
| --- | --- | --- | --- |
| 1 | 1761–1766 | `.data-table` | `width: 100%`；`--el-table-border-color: #f4f4f5`；`--el-table-header-text-color: #71717a`；`--el-table-header-bg-color: #ffffff` |
| 2 | 1768–1773 | `.data-table :deep(.el-table__header th .cell)` | `font-size: 12px`；`font-weight: 600`；`color: #71717a`；`letter-spacing: 0.01em` |
| 3 | 1775–1777 | `.data-table :deep(td.el-table__cell)` | `padding: 12px 0` |
| 4 | 1779–1781 | `.data-table :deep(th.el-table__cell)` | `padding: 11px 0` |

同一 SFC 内其余所有样式均属**业务专属**，不属本模板（清单见 §6 第 2 项）：
`.ds-*`、`.empty-state*`、`.data-table :deep(.el-tag|.el-tag--warning|.el-tag--success)`、
`.naming-*`、`.strategy-*`、`.editor-*`、`.row-more*`、`.biz-attr-*`、
以及第 2050 行**非 scoped** 的 `.ds-more-popper` 全局块。

`LIST_TABLE_SHARED_DESIGN_APPROVED` —— 表格元素本身（第 81–85 行）为：

```html
<el-table :data="rows" class="data-table" @row-dblclick="onRowDoubleClick">
```

- 唯一类名 `data-table`，**未**声明 `border` / `stripe` / `size` / `height` / `max-height` /
  `row-key` / 多选列 / 排序 / 分页 / `v-loading`；
- `v-loading="loading"` 挂在外层 `QueryListResultPanel`，**不在**表格上。

### 2.2 全仓 `el-table` 使用点与业务类名前缀

`LIST_TABLE_SHARED_DESIGN_APPROVED` —— 复核命令与实测结果（与已批准基线一致，**不变量**）：

```bash
grep -rnP '<el-table(?![-_])' frontend/src --include=*.vue | wc -l   # 15
grep -rlP '<el-table(?![-_])' frontend/src --include=*.vue | wc -l   # 14
```

`LIST_TABLE_SHARED_DESIGN_APPROVED` —— 现有业务表格根类前缀（**必须回避**）：

```text
.data-table      前端 DataSourcePage.vue 主表（参考实现）
.naming-table    前端 DataSourcePage.vue 命名策略弹窗表
.cc-table        ClientConfigPage.vue 主表
.config-table    ServerConfigPage.vue 主表（位于 el-card 内）
.dss-table       DataSourceSnapshotTable.vue 主表
.toff-table      OffsetTable.vue 主表
```

未命名的表格（`DataSubscribePage.vue`、`LogQueryTable.vue`、`history-list.vue`
及 6 个大屏/弹窗/子表）**没有**表格根类，只有行内属性。

### 2.3 共享 CSS 的消费能力：真实插件行为核验

这是本设计**唯一带技术风险**的环节，因此以真实构建插件的源码行为为唯一依据，
不凭印象推断。

`LIST_TABLE_SHARED_DESIGN_APPROVED` —— 已在
`frontend/node_modules/@vitejs/plugin-vue/dist/index.mjs` 中逐行核实：

1. `<style scoped src="…">` 的**外部文件内容会被读取**并作为样式模块代码
   （`load` 钩子：`if (query.vue) { if (query.src) return fs.readFileSync(filename, 'utf-8') }`）；
2. 该内容会走**与内联样式块完全相同**的编译路径
   （`transform` 钩子 `query.type === 'style'` → `transformStyle(...)`）；
3. `transformStyle` 调用 `compileStyleAsync({ source: code, scoped: block.scoped, id: 'data-v-<id>' })`，
   即 `scoped` 标记与内联块**同源**；
4. `src` 经 `pluginContext.resolve(src, descriptor.filename)` 解析，
   因此 **Vite 的 `resolve.alias` 对 `<style src>` 同样生效**。

**结论**：在**外部普通 `.css` 文件**中编写 `:deep(...)`、并以
`<style scoped src="…">` 引用，会被正确编译为带作用域属性的选择器；
`@/styles/…` 与 `./relative.css` 两种写法均可解析。

`LIST_TABLE_SHARED_DESIGN_APPROVED` —— 仓库内**已有同形态先例**（qlpt 阶段一已实现并验收）：

```text
frontend/src/components/query-list/query-list-spinner.css
  ← QueryListActions.vue      <style scoped src="./query-list-spinner.css">
  ← QueryListRefreshToolbar.vue <style scoped src="./query-list-spinner.css">
```

`shared-layer.spec.ts` 明确断言该形态的契约是“**一份来源被两个消费者引用**”，
而**不是**“两份副本内容一致”。本设计沿用同一形态。

`LIST_TABLE_SHARED_DESIGN_APPROVED` —— 与先例的**唯一差别**：qlpt 的
`query-list-spinner.css` 刻意**不含** `:deep(...)`（`shared-layer.spec.ts` 断言
`not.toMatch(/!important|:deep\(|::v-deep/)`），因此先例**未**证明 `:deep(...)`
在外部文件中的行为。本设计不据此推断，而是回到 §2.3 第 1–4 条**插件源码事实**：
`:deep(...)` 的变换发生在 `compileStyle` 阶段，与样式来源（内联 / 外部文件）无关。

`LIST_TABLE_SHARED_DESIGN_APPROVED` —— 若实现阶段仍出现与本节不符的行为，属**设计前置事实失效**：
实现任务必须**停止**并报告，**不得**在未重新评审的情况下改用全局样式绕行。

### 2.4 样式令牌与作用域约定现状

`LIST_TABLE_SHARED_DESIGN_APPROVED` —— 全仓现状（只读实测）：

```text
CSS Module              不存在
CSS 预处理器            不存在（无 lang="scss" / less / stylus）
全局样式文件            仅 frontend/src/styles/global.css（通配符 reset + html/body/#app）
样式令牌前缀            --el-*（Element Plus）、--dss-*（源库快照状态页）以及若干局部单值变量
公共共享 CSS 源         frontend/src/components/query-list/query-list-spinner.css（唯一先例）
SFC 作用域              所有页面样式使用 <style scoped>；仅 DataSourcePage.vue 第 2050 行
                        与 OffsetTable.vue 第 396 行各有一个非 scoped 块（均限定在自建 popper 类内）
路径别名                vite.config.ts: resolve.alias['@'] = <repo>/frontend/src
```

`LIST_TABLE_SHARED_DESIGN_APPROVED` —— `lt-` 前缀（类名与 `--lt-` 令牌）经全仓检索
**未被占用**，与 `.data-table` / `.dss-*` / `.toff-*` / `.cc-*` / `.config-table` /
`ql-*` **无交集**。

### 2.5 现有测试框架能力边界

`LIST_TABLE_SHARED_DESIGN_APPROVED` —— 必须如实区分“能校验”与“不能校验”，
不得让设计依赖做不到的验证：

| 能力 | 结论 | 依据 |
| --- | --- | --- |
| 断言类名是否存在 | **能**（`@vue/test-utils` 挂在 jsdom 下） | `dataSource.spec.ts` 大量 `.find('.ds-seq')` 断言 |
| 断言 SFC **源码文本**中的声明 | **能**（`readFileSync` + 正则） | `dataSource.spec.ts` 的 `scopedStyleBlock()`、`shared-layer.spec.ts` 全文 |
| 断言**外部 `.css` 文件**文本 | **能**（同上，先例 `spinnerCss()`） | `shared-layer.spec.ts` |
| 断言 `:deep(...)` 选择器**文本**存在与被限定 | **能** | 同上 |
| 断言**计算样式** | **不能** | jsdom **不实现**层叠与布局；vitest 环境为 `jsdom`，无 `matchMedia` 级别样式引擎；`shared-layer.spec.ts` 因此全部改为源码文本断言 |
| 断言几何矩形（`getBoundingClientRect`） | **不能**（jsdom 一律返回 0） | 同上 |
| 断言构建产物 CSS 文本 | **能**（构建后读取 `dist/assets/*.css`） | 属阶段一实现任务的构建产物检查 |
| 断言真实浏览器计算样式与几何 | **能**，但**必须**在阶段一由**真实浏览器**执行，**不是** vitest | qlpt 已批准的等价接入口径 |

`LIST_TABLE_SHARED_DESIGN_APPROVED` —— 其中以下六项属**运行时事实**，
一律**不得**写成 jsdom / vitest 能够直接证明的结论，
**必须**由**真实浏览器**承接（§7.4 / §7.5），本条与 §7.2 / §7.4 / §7.5 **同口径**：

```text
1. `--lt-*` **自定义属性本身**是否有值（被覆盖 → 读到 Feature 声明值；未覆盖 → 为空）；
   以及**消费属性**的最终计算值是否取到覆盖值或 `var(--lt-*, fallback)` 默认值；
2. CSS 变量的最终计算值；
3. Feature 覆盖是否实际只影响目标表格；
4. 同页另一张未覆盖表格的计算样式是否未受影响；
5. 公共规则在给定页面上的实际匹配数（含负向页面「应为 0」）；
6. 元素几何、行高与外接矩形是否相同。
```

`LIST_TABLE_SHARED_DESIGN_APPROVED` —— 由此产生一条**硬约束**：
本模板的“视觉等价”**不能**用单元测试证明，只能用
“源码文本静态契约 + 真实浏览器计算样式逐值比对”**两段合成**证明。
§7 的验证矩阵据此分层，不得把两者混为一谈。

### 2.6 参考实现的既有测试保护

`LIST_TABLE_SHARED_DESIGN_APPROVED` —— `frontend/src/views/data-source/dataSource.spec.ts`
（2734 行）已固化的、与本模板**相关**的断言（未来接入时**必须继续通过**）：

| 断言 | 位置 |
| --- | --- |
| 表头列文案与顺序（序号 / 数据源ID / … / 操作） | 第 896–916 行 |
| 第一列序号按行序 1..n 渲染 | 第 896–916 行 |
| `.data-table .el-table__header-wrapper th` 选择器可用（**依赖 `data-table` 类名继续存在**） | 第 899–901 行 |
| 长文本列保留 `show-overflow-tooltip` | 第 612 行 |
| 角色标签、停用/异常标识语义 | 第 625–694 行 |
| 行双击打开编辑 | 第 1292–1301 行 |
| SFC `<style scoped>` 块可被正则提取（`scopedStyleBlock()`） | 第 932–942 行 |
| `:deep(.editor-dialog …)` 限定性断言（存在性口径） | 第 945–952 行 |

`LIST_TABLE_SHARED_DESIGN_APPROVED` —— **关键推论**：第 899–901 行的
`.data-table .el-table__header-wrapper th` 断言要求参考页**继续保留**
`class="data-table"`；因此公共启用**必须**是**追加**一个类，而**不是**替换原类（见 §4.2、§6 第 3 项）。

### 2.7 基准提交相对关系

`LIST_TABLE_SHARED_DESIGN_APPROVED` —— `reference_source_commit`（`10b1d3e`）与
设计任务 `design_base_commit_id`（`e8eb68e`）之间，`frontend/**` **零改动**：

```bash
git diff --quiet 10b1d3e39d03dbb78ea409d486f1f3e80c12fc3e e8eb68e368313aa501eb5f7158f6e95975b2077b -- frontend
# 退出码 0
```

因此 §2.1 的行号与声明对**当前**工作区同样成立。

---

## 3. 四个候选方案的逐项复核与唯一结论

### 3.1 复核表

`LIST_TABLE_SHARED_DESIGN_APPROVED` —— 对已批准基线 `DESIGN.md` §8.1–§8.4 的四个候选
逐项复核，**每项给出采纳或拒绝**，不再并列：

| 候选 | 能否承载 §2.1 的 4 个规则组 | 能否做到显式启用 | 能否零全局泄漏 | 能否受控覆盖 | 结论 |
| --- | --- | --- | --- | --- | --- |
| 8.1 显式 CSS 预设（纯类名） | 能（含 `:deep`） | 能 | 能 | **弱**——覆盖只能靠 Feature **重写整条规则**，无法枚举、无法检测漂移 | **部分采纳**（作为组合的一半，见 §3.2） |
| 8.2 CSS 变量（纯令牌） | **不能**——变量只能承载“值”，无法承载“选择器”；`th/td` 内边距与表头 `.cell` 排版必须有选择器才能落地 | 能 | 能 | 强 | **部分采纳**（作为组合的另一半，见 §3.2） |
| 8.3 Vue 轻包装组件 | 能 | 能 | 能 | 中 | **拒绝**（§3.3） |
| 8.4 组合方式（预设类 + 有限令牌） | 能 | 能 | 能 | 强 | **采纳**（唯一结论，见 §3.2） |

### 3.2 唯一结论

`LIST_TABLE_SHARED_DESIGN_APPROVED` —— 本设计选择**候选 8.4：组合方式**，并给出准确形态名称：

```text
selected_implementation_architecture=
  EXPLICIT_ROOT_CLASS_CSS_PRESET_WITH_LIMITED_CSS_CUSTOM_PROPERTY_TOKENS
```

准确术语（**不得**简称为“组件”，也**不得**称为 CSS Module）：

- **不是一个 Vue 组件**，**不是** Composable，**不是** 指令，**不是** 插件；
- 是**一个普通 CSS 样式预设源文件** + **一个常量模块**：
  以**显式根类**承担“选择器纪律”，以**有限 CSS 自定义属性**承担“受控覆盖”；
- 消费方式是**业务页面在自身 SFC 内以 `<style scoped src>` 显式引用**，
  并在 `el-table` 根元素上**显式追加**公共根类。

> 本文件沿用仓库既有文件名 `SHARED_COMPONENT_DESIGN.md`（与其他基线目录命名一致），
> 但**内容不是**组件设计，术语以本节为准。文件名不构成“这是一个组件”的结论。

### 3.3 为什么拒绝另外三种

`LIST_TABLE_SHARED_DESIGN_APPROVED`：

- **拒绝 8.1（纯预设、无令牌）**：§4.4 中的 9 项视觉值必须可被 Feature
  **逐项、可枚举**地覆盖；纯类名方案下，Feature 若只想改表头字号，
  就必须**整条复制** `.lt-main-table :deep(.el-table__header th .cell)` 规则
  并与公共规则竞争同特异性（§4.5 的“加载顺序陷阱”）。这会退化为基线段已警示的
  “容易退化为复制粘贴”，并让“覆盖点数量有限且命名清晰”**无法被断言**。
- **拒绝 8.2（纯令牌、无预设）**：CSS 自定义属性只能承载值，**不能**承载选择器。
  §2.1 的规则组 2/3/4 必须落在 `:deep(.el-table__header th .cell)`、
  `td.el-table__cell`、`th.el-table__cell` 上，纯令牌方案**无法表达这三条规则**，
  因而**无法承载已批准基线 `UI.md` §2 的表头排版、上下留白与表头背景纪律**——
  即无法覆盖本模板的核心职责。故作为独立方案**不成立**。
- **拒绝 8.3（Vue 轻包装组件）**：
  1. **会侵入 `el-table` 的对外契约面**——包装组件必须重新声明
     `data` / `empty` / `default` 等插槽、`row-dblclick` 等事件，并处理 `ref` 转发，
     任何一项遗漏即改变参考实现行为；参考页依赖 `@row-dblclick`、
     `#empty` 两级空态、10 个业务列与 `show-overflow-tooltip`，风险面不可接受；
  2. **与 qlpt 已批准结论直接冲突**——qlpt `SHARED_COMPONENT_DESIGN.md` §7.3.4
     已在同类问题上作出“**没有超级组件，也没有薄包装**”的批准结论
     （唯一薄包装候选已被合并进结果面板）。除非能证明本模板的组件
     **至少承载一个可断言的不变量**，否则同一仓库内会出现两套相反判据；
     而本模板的全部不变量（宽度 / 表头排版 / 内边距 / 边框色）都能由
     类名 + 令牌**完整表达**，组件**不新增任何不变量**，属典型的薄包装；
  3. **增加一层间接**——包装组件要么引入额外 DOM 节点（破坏表格几何与
     `fixed` 列基准），要么只做 `v-bind="$attrs"` 透传（即纯薄包装）。
- **不选择“两种方案都保留”**：基线 `DESIGN.md` §8.5 要求最终**定案**，
  本设计据此**只**交付 §3.2 的单一形态；同时存在 CSS 预设与包装组件
  会立刻产生 §4.5 的优先级与加载顺序歧义。

### 3.4 是否引入组件 / 是否新增 DOM 层 / 如何透传 `el-table` 契约

`LIST_TABLE_SHARED_DESIGN_APPROVED`：

- `introduces_vue_wrapper_component=NO`；
- `adds_extra_dom_layer=NO`——公共层**不渲染任何节点**；
  它只在**已有的** `el-table` 根元素上追加一个类名，并只通过
  CSS 自定义属性沿用该元素自带的样式层。因此
  **DOM 树、节点数、层级深度与接入前逐节点相同**，`fixed` 列与几何基准不受影响；
- **Props / Slots / Events / Ref / 类型全部无需透传，因为不存在中间层**：
  `<el-table ...>` 仍是**原生的 Element Plus 表格**，
  业务页面继续直接声明 `:data`、`:span-method`、`#empty`、`#default`、`@row-dblclick`、
  `ref` 等，Element Plus 自身的类型（`ElTable` 的 props/slots/emits 类型）
  与 `defineExpose` 行为**完全不变**；
- **唯一被附加的对外面是类名**：`class="data-table lt-main-table"`。
  不新增 prop、不新增 emit、不新增 slot、不新增类型声明。

### 3.5 为什么不与 qlpt 公共组件形成超级组件或职责重叠

`LIST_TABLE_SHARED_DESIGN_APPROVED` —— 两层按已批准基线 `README.md` §5 正交：

| 维度 | qlpt 公共层（已批准、已实现） | 本模板公共层（本详细设计） |
| --- | --- | --- |
| 覆盖对象 | 页面层：标题 / 查询区 / 结果区 / 刷新工具栏 / 请求交互 | 表格层：表头 / 正文 / 间距 / 边框 / 行高策略 / 长文本边界 |
| 产物形态 | 6 个 Vue 组件 + 1 个 composable + 1 个共享 CSS | **1 个共享 CSS 预设 + 1 个常量模块**（**无**组件、**无**逻辑） |
| 是否渲染节点 | 是（页面骨架与容器） | **否**（不渲染任何节点） |
| 对 `el-table` 的处置 | **留在 Feature**（qlpt 明确不覆盖 `el-table` 内部结构类） | **新开一层**，且只由 Feature 显式选择是否套用 |

`LIST_TABLE_SHARED_DESIGN_APPROVED` —— 因此：

- 本模板**不**并入 `QueryListResultPanel`，**不**改写其契约，
  **不**向 qlpt 公共层注入表格样式；qlpt 公共组件**不会**自动获得表格视觉模板；
- 二者**没有**共享的类名、令牌或文件，`ql-*` 与 `lt-*` 前缀**无交集**；
- 复用参考实现里的一行 `<style scoped src>` 写法属**形态借鉴**，
  **不构成**职责重叠；qlpt 的 `query-list-spinner.css`
  **不**被本模板引用，本模板的文件**不**被 qlpt 引用。

### 3.6 显式启用、零全局泄漏与最小回滚的落地方式（结论概述）

`LIST_TABLE_SHARED_DESIGN_APPROVED` —— 三者的实现方式（细节见 §4.2 / §4.6 / §9.2）：

- **显式启用**：页面在自身 SFC 中**写一行** `<style scoped src="…">`，
  并在**该表格的 `el-table` 根元素**上追加公共根类。
  两处都必须在页面源码中显式出现，不存在任何全局或隐式入口；
- **零全局泄漏**：预设源文件**不含**任何无前缀选择器、**不含** `:root` / `html` / `body` /
  `*` 规则、**不含**非 scoped 块；全部 `:deep(...)` 由公共根类限定；
  令牌**不由公共层定义**（只在下游 `var(--lt-…, 默认值)` 内联回退中出现），
  因此未启用页面上这些令牌**未被声明（自定义属性读数为空）**，
  其表格的消费属性也不受公共规则影响；
- **最小回滚**：删除页面源码中的**一个类名**与**一行 `<style scoped src>`**
  即可完全失效，**无运行时状态、无缓存、无注册表**；
  在提交层面，回滚**一个**“参考页接入提交”即可（§9.2）。

---

## 4. 公共契约

### 4.1 未来文件布局

`LIST_TABLE_SHARED_DESIGN_APPROVED` —— 阶段一需创建的精确路径
（**设计任务当时未创建**；随后已由独立实施任务按此布局创建，当前
`shared_implementation_status=IMPLEMENTED_ACCEPTED`）：

```text
frontend/src/styles/list-table/
├── list-table-visual.css    # 唯一的公共预设样式源（根类 + :deep 内部规则）
└── index.ts                 # 公共常量模块：根类名常量与令牌名清单（不含任何样式）
```

`LIST_TABLE_SHARED_DESIGN_APPROVED` —— 布局理由与边界：

- 选择 `frontend/src/styles/` 而非 `frontend/src/components/`：
  本产物**不是组件**，放进 `components/` 会在语义上错误归因
  （对照 qlpt 选择 `composables/` 的同一条理由）；
  `frontend/src/styles/` **已存在**（仅含 `global.css`），
  在其下新增一个领域子目录，**未**引入仓库中不存在的新层级；
- **不新增** `frontend/src/composables/` 下的任何文件（本模板**无**逻辑产物）；
- **不新增** `frontend/src/types/` 下的文件（公共类型面只有 §4.1 的两个常量，
  常量模块本身即类型来源，无需再分一层）；
- **阶段一文件数上限为 2**。`.spec.ts` 测试文件由阶段一实现任务按需创建，
  **不**出现在本设计的“未来公共产物”列表中（测试属实现任务产物，不是公共契约）；
- 除上述 2 个文件外，**不得**为凑形态创建空文件、别名文件、占位文件或 barrel 再导出。

### 4.2 显式启用方式

`LIST_TABLE_SHARED_DESIGN_APPROVED` —— 以下为**设计伪代码**（**已批准设计依据**）。
该接入随后**已**由独立实施任务落地，经项目负责人于 2026-09-22 目测通过，
通过本地正式验收，并由项目负责人最终接受并关闭
（`reference_page_integration_status=IMPLEMENTED_ACCEPTED`）；
下方伪代码保留以说明**设计意图**，接入的**实际形态**以真实源码与实现报告为准：

```vue
<!-- frontend/src/views/data-source/DataSourcePage.vue（设计伪代码；实际接入已由独立实施任务落地） -->
<script setup lang="ts">
import { LT_MAIN_TABLE_CLASS } from '@/styles/list-table'
</script>

<template>
  <!-- 唯一改动点一：在 el-table 根元素上「并列追加」公共根类 -->
  <el-table
    :data="rows"
    :class="['data-table', LT_MAIN_TABLE_CLASS]"
    @row-dblclick="onRowDoubleClick"
  >
    <!-- 列定义、#empty 两级空态、show-overflow-tooltip、fixed="right" 全部保持原样 -->
  </el-table>
</template>

<!-- 唯一改动点二：显式引用公共预设源（显式启用，非全局） -->
<style scoped src="@/styles/list-table/list-table-visual.css"></style>

<style scoped>
  /* Feature 专属规则原样保留（.ds-* / .el-tag / .empty-state / 弹窗 / 命名策略等）；
     仅删除被公共层「等价替代」的 4 个规则组（§2.1） */
</style>
```

`LIST_TABLE_SHARED_DESIGN_APPROVED` —— 契约要点：

| 项 | 规则 |
| --- | --- |
| import 方式 | 类名常量：`import { LT_MAIN_TABLE_CLASS } from '@/styles/list-table'`；样式：`<style scoped src="@/styles/list-table/list-table-visual.css">`（也可使用从具体消费 SFC 所在目录正确解析到公共 CSS 文件的相对路径；该路径随消费 SFC 位置而变，**不是**所有消费页面都可直接使用的固定路径） |
| 模板根类 | `lt-main-table`，且**必须**声明在 `el-table` 的**根元素**上 |
| 导出名称 | `LT_MAIN_TABLE_CLASS`（根类名常量）、`LT_TABLE_VISUAL_TOKENS`（令牌名只读清单） |
| 是否保留 Feature 原类名 | **必须保留**（参考页 `data-table` 被既有测试断言依赖，见 §2.6） |
| 一个表格能否同时带公共类与业务类 | **允许且推荐**——这正是分层的实现方式；两者**只允许**各自声明自己的属性（§4.5） |
| `el-table` 上的绑定方式 | `:class="['<业务类>', LT_MAIN_TABLE_CLASS]"` 或 `class="<业务类> lt-main-table"`，二者等价 |

`LIST_TABLE_SHARED_DESIGN_APPROVED` —— **禁止的隐式启用方式**（任一出现即视为设计违规）：

```text
1. 在 frontend/src/styles/global.css 或 main.ts 中 import / @import 公共预设；
2. 新增非 scoped 的 <style> 块承载公共预设；
3. 通过全局指令、全局插件、app.mixin 或 Element Plus 主题覆盖自动套用；
4. 通过路由元数据 / 路由名 / 文件路径规则“自动识别主列表并套用”；
5. 把公共根类放在 el-table 的祖先容器上（祖先上声明 width 与 EP 令牌会落错元素）；
6. 在 .data-table / .dss-* / .toff-* / .cc-* / .config-table 等业务选择器上
   复制公共规则，或让公共规则“顺带”命中这些前缀。
```

### 4.3 类名与命名空间

`LIST_TABLE_SHARED_DESIGN_APPROVED`：

| 对象 | 规则 | 阶段一取值 |
| --- | --- | --- |
| 公共根类 | `lt-` + kebab-case 语义名 | `lt-main-table`（常量 `LT_MAIN_TABLE_CLASS`） |
| 常量模块导出键 | `LT_` + SCREAMING_SNAKE | `LT_MAIN_TABLE_CLASS`、`LT_TABLE_VISUAL_TOKENS` |
| CSS 自定义属性前缀 | `--lt-` | 见 §4.4 的 9 个令牌 |
| 内部辅助类命名规则 | 若未来确需，必须为 `lt-<block>__<element>`（BEM 双下划线），且**必须**经独立评审 | **内部辅助类数量 = 2**（`lt-row-action__cell`、`lt-row-action__ellipsis`，均受 `.lt-main-table` 限定；实现前阶段一为 `0`，见 §12.7） |
| 禁止选择的业务类名前缀 | `.data-table`、`.naming-table`、`.dss-*`、`.toff-*`、`.cc-*`、`.config-table`、`.ds-*`、`.empty-*`、`.query-*`、`.q-*` | 公共源文件中**不得**出现上述任一字符串 |
| 与 Element Plus 内部类的交互边界 | 只允许在**公共根类限定**下使用 `:deep(...)` 命中 `el-table__header th .cell`、`td.el-table__cell`、`th.el-table__cell`；**不得**命中 `el-table__row`、`el-table__body`、选中态、hover 态或任何业务状态类；**不得**定义 `.el-*` 类本身 | 见 §4.4 与 §4.6 |

`LIST_TABLE_SHARED_DESIGN_APPROVED` —— 本模板的全部已批准**基础**纪律（宽度 / 表头排版 / 上下内边距 /
边框色 / 表头背景）**只需要**根类 + EP 令牌 + 3 条 `:deep` 规则即可完整表达，不需要任何内部辅助类；
“状态标记不得改变行高”属**禁止性纪律**（公共层不固定行高、不约束单元格内容），
也不需要任何类名（`UI.md` §3.6 的胶囊几何属 Feature，§5 已列为禁止提升项）。
**现行** `lt_internal_helper_class_count = 2`（仅 `{lt-row-action__cell, lt-row-action__ellipsis}`，
均受 `.lt-main-table` 限定，来自 §12 的 opt-in 可选扩展），`lt_token_count` 仍 `9`；
实现前阶段一计数为 `0`（历史）。现行静态断言口径见 §12.7 与
`frontend/src/styles/list-table/list-table-visual.spec.ts` #11。

### 4.4 公共视觉令牌表

`LIST_TABLE_SHARED_DESIGN_APPROVED` —— 以下是**全部** 9 个公共令牌，
逐项给出默认值、来源、使用选择器、是否允许 Feature 覆盖及覆盖方式。

**公共层声明的值均为参考实现既有事实**（§2.1），**不**新增任何未经量测的视觉值。

| # | 令牌 | 公共默认值 | 来源（参考实现事实） | 使用选择器 | Feature 能否覆盖 | 覆盖方式 |
| --- | --- | --- | --- | --- | --- | --- |
| 1 | `--lt-table-width` | `100%` | §2.1 规则组 1 `width: 100%` | `.lt-main-table` | **能** | 在业务类上声明 `--lt-table-width` |
| 2 | `--lt-border-color` | `#f4f4f5` | §2.1 规则组 1 `--el-table-border-color` | `.lt-main-table`（→ `--el-table-border-color`） | **能** | 同上 |
| 3 | `--lt-header-bg-color` | `#ffffff` | §2.1 规则组 1 `--el-table-header-bg-color` | `.lt-main-table`（→ `--el-table-header-bg-color`） | **能** | 同上 |
| 4 | `--lt-header-text-color` | `#71717a` | §2.1 规则组 1 与规则组 2（两处同值） | `.lt-main-table`（→ `--el-table-header-text-color`）与表头 `.cell` 的 `color` | **能** | 同上（一处覆盖，两处同时生效） |
| 5 | `--lt-header-font-size` | `12px` | §2.1 规则组 2 | 表头 `.cell` 的 `font-size` | **能** | 同上 |
| 6 | `--lt-header-font-weight` | `600` | §2.1 规则组 2 | 表头 `.cell` 的 `font-weight` | **能** | 同上 |
| 7 | `--lt-header-letter-spacing` | `0.01em` | §2.1 规则组 2 | 表头 `.cell` 的 `letter-spacing` | **能** | 同上 |
| 8 | `--lt-header-cell-padding` | `11px 0` | §2.1 规则组 4 | `:deep(th.el-table__cell)` | **能** | 同上 |
| 9 | `--lt-body-cell-padding` | `12px 0` | §2.1 规则组 3 | `:deep(td.el-table__cell)` | **能** | 同上 |

`LIST_TABLE_SHARED_DESIGN_APPROVED` —— 公共源文件中的消费形态
（**已批准设计依据**；该文件随后已由独立实施任务创建）：

```css
/* frontend/src/styles/list-table/list-table-visual.css（设计伪代码；实际实现见真实源码） */
.lt-main-table {
  width: var(--lt-table-width, 100%);
  --el-table-border-color: var(--lt-border-color, #f4f4f5);
  --el-table-header-text-color: var(--lt-header-text-color, #71717a);
  --el-table-header-bg-color: var(--lt-header-bg-color, #ffffff);
}

.lt-main-table :deep(.el-table__header th .cell) {
  font-size: var(--lt-header-font-size, 12px);
  font-weight: var(--lt-header-font-weight, 600);
  color: var(--lt-header-text-color, #71717a);
  letter-spacing: var(--lt-header-letter-spacing, 0.01em);
}

.lt-main-table :deep(td.el-table__cell) {
  padding: var(--lt-body-cell-padding, 12px 0);
}

.lt-main-table :deep(th.el-table__cell) {
  padding: var(--lt-header-cell-padding, 11px 0);
}
```

`LIST_TABLE_SHARED_DESIGN_APPROVED` —— **公共层不定义令牌本身**：
`--lt-*` 只出现在 `var(--lt-…, 默认值)` 的**内联回退**中，
**不**在 `.lt-main-table`、`:root`、`html`、`body` 上声明 `--lt-*: 值`。
这一条是 §4.5 优先级无歧义的**唯一前提**，也是 qlpt 已实现先例
（`left: var(--ql-btn-spinner-inset, 2px)` + 页面局部 `'--ql-btn-spinner-inset': '3px'`）的同款做法。

`LIST_TABLE_SHARED_DESIGN_APPROVED` —— 对**未在参考实现中显式定义**的 15 项评估清单，
逐项必须落到三种处置之一，**不得凭印象编造**：

| 评估项 | 处置 | 理由 |
| --- | --- | --- |
| 表格宽度 | **由公共层定义**（令牌 1） | 参考实现显式声明，且属已批准规则（`UI.md` §2.5） |
| Element Plus 表格边框色 | **由公共层定义**（令牌 2） | 参考实现显式声明（`UI.md` §2.3） |
| 表头背景 | **由公共层定义**（令牌 3） | 参考实现显式声明（`UI.md` §2.2） |
| 表头文字色 | **由公共层定义**（令牌 4） | 参考实现两处显式同值 |
| 表头字号 | **由公共层定义**（令牌 5） | 参考实现显式声明 |
| 表头字重 | **由公共层定义**（令牌 6） | 参考实现显式声明 |
| 表头字距 | **由公共层定义**（令牌 7） | 参考实现显式声明 |
| 表头单元格纵向内边距 | **由公共层定义**（令牌 8） | 参考实现显式声明 `11px 0`（含横向 0） |
| 正文单元格纵向内边距 | **由公共层定义**（令牌 9） | 参考实现显式声明 `12px 0`（含横向 0） |
| 正文基础字号与颜色 | **不由公共层定义，继续继承 Element Plus 当前行为** | 参考实现**未**显式定义；公共层若给默认值即等于**新增**一个全站视觉值，超出基线授权（`UI.md` §2 末段：可提取 ≠ 数值可直接成为公共默认值） |
| 行高 | **不由公共层定义** | 已批准规则为“默认不固定行高、由内容驱动”（`DESIGN.md` §5、`UI.md` §2.6）；公共层**不**声明 `line-height` / `height` / `max-height`，也**不**为固定行高的 Feature 例外提供令牌（该例外属 Feature 自担，`UI.md` §3.7） |
| hover 色 | **不由公共层定义，继续继承 Element Plus 当前行为** | 参考实现**未**显式定义（`UI.md` §1.2 注）；且属 `DESIGN.md` §7 的“hover 态配色**不得**未经评估抽成公共语义” |
| 横向内边距 | **由公共层定义，但已并入令牌 8 / 9 的 `0`**（`11px 0` / `12px 0`），**不**单设令牌 | 参考实现把横向显式置 `0`；`UI.md` §2.4 明确“横向由列定义决定”，故不再单独暴露横向令牌 |
| 长文本省略 | **不由公共层定义** | 参考实现依赖 Element Plus 内建 `show-overflow-tooltip`（`UI.md` §1.9）；属字段语义，`DESIGN.md` §6 明确“Tooltip 由字段语义决定” |
| Tooltip | **不由公共层定义** | 同上；且 Tooltip 机制与延迟属 Feature（`DESIGN.md` §6.5、`UI.md` §3.8 相邻口径） |

`LIST_TABLE_SHARED_DESIGN_APPROVED` —— 汇总计数（可断言）：

```text
lt_token_count=9
lt_internal_helper_class_count=2      # 含 §12 opt-in 的 lt-row-action__cell / lt-row-action__ellipsis
lt_shared_declared_value_count=9      # 全部来自 §2.1 参考实现事实
lt_new_invented_visual_value_count=0
```

> **计数说明**：`lt_internal_helper_class_count` 实现前阶段一为 `0`；经第七轮 opt-in 扩展（§12）实现后
> **现行**为 `2`（`lt_token_count` 仍 `9`）。阶段一时点值属历史，保留在既有报告。

### 4.5 Feature 覆盖契约

`LIST_TABLE_SHARED_DESIGN_APPROVED`：

**（1）Feature 能覆盖哪些令牌**

仅 §4.4 表中的 9 个 `--lt-*` 令牌。覆盖粒度**一处一处**，例如
“本页表头字号改为 `13px`”只需声明 `--lt-header-font-size: 13px`。

**（2）哪些规则禁止覆盖**

```text
1. 禁止 Feature 自行声明 .lt-main-table 的 width / --el-table-* / :deep(th|td.el-table__cell) /
   表头 .cell 排版——这 4 组规则的声明权归公共层，Feature 只通过 --lt-* 传值；
2. 禁止 Feature 用 !important 覆盖公共层任一规则；
3. 禁止 Feature 在公共源文件所在作用域之外「扩展」公共规则（例如新增
   .lt-main-table :deep(.el-table__row) 之类规则）——需要新纪律时必须走独立评审，
   不得由业务页面就地扩张；
4. 禁止 Feature 覆盖其他 Feature 的覆盖点（覆盖点只作用于本页表格子树）。
```

**（3）覆盖声明放在哪里**

在**该页面自己的** `<style scoped>` 块内，选择器为**该表格的业务根类**
（如 `.data-table`），声明 `--lt-*` 的值。**不得**写入 `global.css`、
**不得**写入公共源文件、**不得**写入其他页面。

**（4）优先级（公共默认值 / 公共类 / Feature 类 / Element Plus 变量）**

`LIST_TABLE_SHARED_DESIGN_APPROVED` —— 由于 §4.4 的“公共层不定义令牌本身”前提，
优先级是**单一确定**的，不依赖任何声明顺序：

```text
--lt-* 的最终值 = Feature 在最近祖先上声明的值
                  （公共层从不声明 --lt-*，因此不存在竞争者）
公共默认值      = var(--lt-*, 默认值) 的内联回退，仅在无任何声明时生效
--el-table-*    = 仅由公共层在 .lt-main-table 上声明，值取自 --lt-* 或内联回退
业务类          = 只声明 Feature 专属属性与 --lt-* 覆盖，不声明公共层拥有的属性
Element Plus    = 仅在其自身未被公共层声明的表格令牌上继续生效（正文色、hover 等）
```

**（5）如何避免依赖偶然的 CSS 加载顺序**

`LIST_TABLE_SHARED_DESIGN_APPROVED` —— 这是本设计相对基线候选的**关键改进**，
必须显式写清，因为“公共类与业务类在同一元素上”天然存在同特异性竞争：

- **已消除的竞争**：公共层**不**声明 `--lt-*` 的值，因此“Feature 覆盖令牌”
  与“公共默认值”之间**根本不存在**同属性竞争，顺序无关；
- **必须靠纪律消除的竞争**：4 个规则组（宽度 / EP 令牌 / 表头排版 / 内边距）
  在同一元素上只能有**一个发表者**。若 Feature 保留自己的一份
  （如参考页原 `.data-table :deep(td.el-table__cell)`），
  它与公共规则**同特异性**（均为 `类[data-v-x] + td.el-table__cell` = `(0,3,1)`），
  此时**只有加载顺序**能决定结果——这正是必须禁止的。
  因此：**接入时 Feature 必须删除被公共层等价替代的规则**，
  **不得**保留同义副本（§6 第 1 项）。这是**接入验收的硬性检查项**；
- **不依赖顺序的验证方式**：§7.6 的“覆盖点唯一性静态断言”要求
  公共源文件与参考页源码中，同一属性**只有一处声明**发表者。

**（6）如何检测覆盖泄漏到其他页面**

`LIST_TABLE_SHARED_DESIGN_APPROVED`：

1. 覆盖声明必须写在**业务根类**限定下（`.data-table { --lt-*: … }`），
   而业务根类是**页面级唯一**的，因此作用域天然限定在该表格子树；
2. **静态检查**：覆盖只出现在该页 SFC 的 `<style scoped>` 内，
   不出现于 `global.css` / 公共源文件 / 其他页面；
3. **计算样式检查**：其他 14 个使用点的 `--lt-*` 必须**未被声明（读数为空）**、
   且表格相关计算样式（消费属性最终值）与接入前**逐值相同**（§7.5 负向页面矩阵）；
4. **反向控制**：故意把覆盖写到 `:root` 时，零泄漏检查**必须非零退出**（§7.6）。

**（7）如何回滚单个 Feature 的启用**

删除该页面的**一行 `<style scoped src>`** 与该表格上的**一个类名**即可，
并恢复被等价替代的 4 组本地规则（§9.2）。无运行时状态、无注册、无缓存。

### 4.6 作用域与零泄漏规则

`LIST_TABLE_SHARED_DESIGN_APPROVED` —— 公共源文件必须满足以下**可执行**规则
（每条都在 §7.1 有对应静态断言）：

```text
L1  不出现裸 el-table / .el-table / .el-table__cell / .el-table__header / .el-table__row
    选择器；一切 Element Plus 内部选择器都必须由 .lt-main-table 前置限定；
L2  不出现 :root / html / body / * 上的任何规则或令牌声明；
L3  不出现非 scoped 用法（源文件只以 <style scoped src> 消费；文件中不得含
    <style> 标签本身，也不得被 global.css / main.ts 引入）；
L4  不出现 --lt- 的「值声明」（只允许出现在 var(--lt-…, 默认值) 内联回退中）；
L5  不出现任一禁止业务前缀（.data-table / .naming-table / .dss- / .toff- / .cc- /
    .config-table / .ds- / .empty- / .query- / .q-）；
L6  不出现业务文案、业务列名、状态语义词（“数据源”“快照”“同步对象”“停用”“异常”
    “SOURCE”“TARGET”等）、也不出现颜色语义命名（success/warning/danger）；
L7  不出现路由元数据、页面自动识别、或任何 JS/TS 运行时副作用（源文件是纯 CSS）；
L8  不出现 !important。
```

`LIST_TABLE_SHARED_DESIGN_APPROVED` —— 由此得到的**零泄漏性质**：

| 未启用对象 | 为什么不受影响 |
| --- | --- |
| 弹窗表 / 详情子表 / 确认表 / 大屏内嵌表 | 它们不带公共根类，公共规则**不匹配**；且 L1/L3 保证不存在全局规则兜底 |
| 其余 13 个 `el-table` 使用点 | 同上（阶段一**只**接入参考页，见 §8） |
| qlpt 公共组件渲染的表格容器 | 公共规则只作用于表格**自身**元素及其内部 `th/td`；`QueryListResultPanel` 是表格的祖先，**不**匹配 `.lt-main-table` |
| 全站其他页面 | 公共源文件只被显式引用的页面加载；即便被打包进同一 CSS 文件，`[data-v-*]` 属性限定也使其**不可能**命中其他页面 |
| 未启用页面的 `--lt-*` | 公共层不声明 `--lt-*`（L4），未启用页面也无 Feature 声明 → 令牌**未被声明（读数为空）**，消费属性同样不匹配公共规则 |

`LIST_TABLE_SHARED_DESIGN_APPROVED` —— **负向验证设计**：在不添加公共根类时，
公共样式在某节点上的**匹配规则数必须为 0**，且其表格相关计算样式与基准**逐值相同**
（§7.5 / §7.6）。

---

## 5. 必须保护的 Feature 专属内容

`LIST_TABLE_SHARED_DESIGN_APPROVED` —— 公共层**不得**吸收以下内容
（已批准基线 `DESIGN.md` §2 / §7、`UI.md` §3、任务提示词 §9 一致）。
本设计**逐项确认不纳入**，且**不为其预留公共默认值或公共类名**：

```text
1.  业务列名称、顺序、prop、width、min-width 与表格整体 min-width；
2.  序号列是否存在及其专属排版（width/align/字号/颜色/tabular-nums）；
3.  空态文案、层级及「无数据 / 查询无结果」的区分；
4.  排序、分页、Loading 与错误处理（含 Loading 挂载在表格还是外层容器）；
5.  行双击、行点击、选择、批量操作；
6.  固定列的取舍与方向；
7.  数据源 ID 的等宽加粗强调（14px/600/#09090b/mono/tabular-nums）；
8.  「停用 / 异常」胶囊的几何与配色；
9.  SOURCE / TARGET 角色标签语义与配色；
10. 选中态、异常态、hover 业务语义（选择语义、异常判定与行级状态变更联动）；
11. 哪些字段启用 Tooltip 及其触发延迟；
12. qlpt 页面壳层、查询区、结果区、刷新工具栏与请求状态。
```

`LIST_TABLE_SHARED_DESIGN_APPROVED` —— 公共层**只**提供：

```text
(a) 已批准的视觉基础纪律：宽度 / 表头排版与背景 / 上下内边距 / 边框色 / 行高边界；
(b) 受控覆盖能力：9 个 --lt-* 令牌（§4.4）与 §4.5 的覆盖契约。
```

`LIST_TABLE_SHARED_DESIGN_APPROVED` —— 特别是：
**序号列与空态**在本设计中被明确**排除**（`DESIGN.md` §2 / §7、`UI.md` §2 的
“默认属 Feature”结论）。它们**不**出现在 §4.4 的令牌表中，
**不**出现在 §4.1 的文件布局中，**不**获得任何 `lt-` 类名。
若未来认为其具有复用价值，只能作为**可选扩展能力**另行评估与独立授权，
**不得**在本设计中被提前定案。

---

## 6. 数据源管理参考页等价接入设计

`LIST_TABLE_SHARED_DESIGN_APPROVED` —— 本节为**后续独立实现任务**的逐项迁移清单
（**设计任务当时不执行**）；该接入随后**已**由独立实施任务落地，
经项目负责人于 2026-09-22 目测通过，通过本地正式验收，并由项目负责人最终接受并关闭
（`reference_page_integration_status=IMPLEMENTED_ACCEPTED`，
`project_owner_visual_review_status=PASS`，
`formal_acceptance_execution_status=EXECUTED_PASSED_LOCAL`）。
下方条目保留为**已批准设计依据**，实际接入结果见真实源码与实现报告。

**1. 应由公共层承载的现有 `.data-table` 规则（自 Feature 删除；已按此执行）**

| 位置 | 选择器 | 移交后由谁声明 |
| --- | --- | --- |
| 1761–1766 | `.data-table`（`width` + 3 个 `--el-table-*`） | 公共层 `.lt-main-table`（消费令牌 1–4） |
| 1768–1773 | `.data-table :deep(.el-table__header th .cell)` | 公共层（消费令牌 4–7） |
| 1775–1777 | `.data-table :deep(td.el-table__cell)` | 公共层（消费令牌 9） |
| 1779–1781 | `.data-table :deep(th.el-table__cell)` | 公共层（消费令牌 8） |

**2. 必须继续留在 Feature scoped 样式中的规则**

```text
.data-table :deep(.el-tag) / :deep(.el-tag--warning) / :deep(.el-tag--success)   1849–1867
.ds-seq                                                                         1784–1788
.ds-id-cell / .ds-id-text                                                       1790–1810
.ds-inactive-mark / .ds-abnormal-mark                                           1813–1846
.naming-table                                                                   1942–1944
.empty-state / .empty-state .empty-main / .empty-state .empty-sub              1947–1963
:deep(.naming-dialog) / .strategy-cards / 其余弹窗与表单规则                    1965 起
.row-more / .row-more-icon / .ds-add-icon / .load-error / .ds-q-* / .ds-* 等    1656–1941 区间
非 scoped 块 .ds-more-popper …（第 2050 行起，限定在自建 popper 类内）            2050–2069
```

**3. 原有 `class="data-table"` 是否保留**

**必须保留**。依据：① 上述 Feature 规则全部以 `.data-table` 限定；
② `dataSource.spec.ts` 第 899–901 行断言 `.data-table .el-table__header-wrapper th`
可用；③ 公共层**禁止**选择业务前缀（§4.3）。
接入形态为**并列追加**：`class="data-table lt-main-table"`。

**4. 公共启用标记如何与原业务类并存**

同一 `el-table` 根元素上并存两个类；各自只声明自己的属性：

```text
.lt-main-table  → width / --el-table-border-color / --el-table-header-text-color /
                  --el-table-header-bg-color / 表头 .cell 排版 / th·td 上下内边距
.data-table     → .ds-* / .empty-* / .el-tag 覆盖 / 弹窗与表单相关规则
```

二者**不得**声明同一属性（§4.5 第 5 项的硬性检查项）。

**5. 不得变化的 DOM、列定义、Slots、Events、双击编辑、固定操作列与业务标签**

```text
DOM 树与节点数：接入前后逐节点相同（公共层不渲染任何节点，§3.4）
10 列列定义与顺序、width / min-width、show-overflow-tooltip：不变
#empty 两级空态（.empty-state / .empty-main / .empty-sub）与文案分支：不变
@row-dblclick（含异常行归一化提示分支）：不变
操作列 fixed="right"、width 110、更多菜单与危险/警示色：不变
角色标签 el-tag type 映射与两类配色：不变
停用/异常标识判定与「显示真实原值」语义：不变
序号列 width 70 / align center / .ds-seq 排版：不变
v-loading 挂载位置（外层 QueryListResultPanel，**不在**表格上）：不变
```

**6. 接入前后必须逐值等价的计算样式清单**

```text
表格根元素：width
表格根元素：--el-table-border-color / --el-table-header-text-color / --el-table-header-bg-color
表头单元格 .cell：font-size / font-weight / color / letter-spacing
th.el-table__cell：padding-top / padding-right / padding-bottom / padding-left
td.el-table__cell：padding-top / padding-right / padding-bottom / padding-left
表头行与首行 td 的 offsetHeight
表格根元素 getBoundingClientRect 的 x / y / width / height
```

**7. 接入前后必须一致的表头、正文、边框与几何尺寸**

```text
表头行高度：接入前后严格 0 变化
首行正文高度：接入前后严格 0 变化
表格外接矩形（x / y / width / height）：接入前后严格 0 变化
边框线颜色与视觉宽度：接入前后逐值相同（--el-table-border-color 取值不变）
表头背景：接入前后逐值相同
单元格左右内边距：接入前后均为 0（令牌 8 / 9 的横向分量）
长文本列省略与 Tooltip 行为：不变（公共层不介入）
视口：1440×900 与 1920×1080；页面缩放 100%
判定阈值：严格 0，不做像素取整、不设容差（沿用参考实现已冻结口径）
```

**8. 如何证明没有影响命名策略弹窗内的第二个 `el-table`**

```text
(a) 该表格根元素为 class="naming-table"，**不带** lt-main-table →
    公共规则的选择器 .lt-main-table[data-v-*] **不匹配**，匹配规则数为 0；
(b) 该表格当前**没有**任何 :deep(th|td.el-table__cell) 或表头 .cell 规则
    （实测：仅有 .naming-table { margin-bottom: 4px }），
    因此接入前后它应**继续完整继承 Element Plus 默认表格视觉**，与接入前逐值相同；
(c) 验收时对该表格在 1440×900 下取 §6 第 6 项同一组计算样式，断言与接入前逐值相同；
(d) 断言该表格的 el-table 根元素 className **不含** lt-main-table。
```

**9. 如何证明没有影响其他 13 个未启用使用点**

```text
(a) 阶段一**只**修改 DataSourcePage.vue 一个业务文件；其余使用点源码零改动
    （git diff 白名单可证）；
(b) 对 §7.5 负向页面矩阵中的每一张表，断言其 el-table 根元素 className
    不含 lt-main-table、且公共规则匹配数为 0；
(c) 对同一组计算样式断言与接入前逐值相同；
(d) 断言构建产物中公共选择器**全部**带有公共根类或作用域属性限定，
    不存在可命中它们的全局规则（§7.3）。
```

**10. 如何一键回滚参考页接入**

回滚粒度：**一个**“参考页接入提交”。操作是一次普通
`git revert <接入提交>`（**不得**使用 `reset --hard` / `checkout .` / `clean -f` /
`stash`）。回滚后必须：

```text
(a) 参考页恢复 §2.1 的 4 组本地规则与原始 class 列表，视觉与业务语义回到接入前；
(b) 其他页面无任何变化（本接入未触及它们）；
(c) 无残留：公共类名、<style scoped src> 行、未使用的 import 全部消失；
(d) 前端测试与构建继续通过（dataSource.spec.ts 全绿）；
(e) 公共层文件可保留（未被引用，对未启用页面零影响），也可同批移除，
    两种择一即可，**不得**只留半套引用。
```

---

## 7. 测试与验收设计（本设计只设计，不执行）

`LIST_TABLE_SHARED_DESIGN_APPROVED` —— 以下为**阶段一实现任务**应执行的验证矩阵。
**本设计任务不执行其中任何一项**。分层依据见 §2.5（jsdom 不能做层叠与几何断言）。

### 7.1 静态契约测试（可在 vitest 中执行）

`LIST_TABLE_SHARED_DESIGN_APPROVED` —— 建议新增
`frontend/src/styles/list-table/list-table-visual.spec.ts`（阶段一创建，**本轮不创建**），
断言对象为**源码文本**（先例：`shared-layer.spec.ts`）：

| # | 断言 | 判定 |
| --- | --- | --- |
| 1 | 公共根类/导出键存在 | `LT_MAIN_TABLE_CLASS === 'lt-main-table'`；常量模块可导出 |
| 2 | 必需视觉令牌存在且**恰好 9 个** | `LT_TABLE_VISUAL_TOKENS` 长度 9，名称与 §4.4 逐一相符 |
| 3 | 每个令牌都带内联默认值且默认值与 §4.4 一致 | 源文件中逐一匹配 `var(--lt-…, <默认值>)` |
| 4 | 公共层**不声明** `--lt-*` 的值 | 源文件中不存在 `--lt-…:` 形式的声明（不匹配 `--lt-[\w-]+\s*:`） |
| 5 | 禁止的全局选择器不存在 | 无裸 `.el-table` / `.el-table__cell` / `.el-table__header` / `.el-table__row`；无 `:root` / `html` / `body` / `*` 规则 |
| 6 | 全部 `:deep(...)` 均由 `.lt-main-table` 限定 | 每条含 `:deep(` 的规则，其头部必须含 `.lt-main-table` |
| 7 | 禁止的业务类名前缀不存在 | 无 `.data-table` / `.naming-table` / `.dss-` / `.toff-` / `.cc-` / `.config-table` / `.ds-` / `.empty-` / `.query-` / `.q-` |
| 8 | 不含业务文案、业务列名或状态语义 | 无“数据源/快照/同步对象/停用/异常/SOURCE/TARGET/success/warning/danger”等 |
| 9 | 未引入路由元数据或页面自动识别 | 源文件为纯 CSS（无 `@import`、无 `.vue`、无 `router`、无 `meta.`） |
| 10 | 无 `!important` | 断言为 0 |
| 11 | 内部辅助类数量为 2 | 源文件中除 `.lt-main-table` 外，`lt-` 类选择器**只允许**已登记的 opt-in 集合 `{.lt-row-action__cell, .lt-row-action__ellipsis}` |
| 12 | 单一来源 | 全 `frontend/src` 中承载这些规则的 CSS 源**只有该文件一处**（先例同款扫描） |

> **现行口径**：上表 #11 为**现行**断言（实现前阶段一为 `0`）：`#11` 先剔除根类 `.lt-main-table`，
> 再断言辅助类集合 `= {.lt-row-action__cell, .lt-row-action__ellipsis}`
> （`frontend/src/styles/list-table/list-table-visual.spec.ts` #11；该单来源约束把二者视为同一辅助元素
> 的两个命名空间元素）；#2（令牌恰好 `9` 个）／#3（默认值逐一相符）／#6（`:deep` 由根类限定）**不变**。

### 7.2 组件或单元测试（可在 vitest 中执行）

`LIST_TABLE_SHARED_DESIGN_APPROVED` —— 本节**只**包含 jsdom 能**可靠**验证的内容：
**DOM 结构、类名、源码声明、组件契约与既有交互**。
凡涉及 CSS 自定义属性解析、层叠结果、选择器实际匹配数或几何的结论，
按 §2.5 归入 §7.4 / §7.5 的**真实浏览器**验证，**不得**写在本节。

| # | 断言 | 性质 |
| --- | --- | --- |
| 1 | 显式启用时表格根元素 className **同时含**业务类与公共类 | DOM 类名结构 |
| 2 | 未启用时，表格根元素 className **不含**公共类；且源码及节点上**不存在**该表格的 `--lt-*` Feature 覆盖声明 | DOM 类名 + 源码静态结构（**不涉及 CSS 求值**） |
| 3 | Feature 覆盖以**静态结构**受检：覆盖声明出现在预期源码（消费 SFC 的 scoped 块）或预期表格节点的作用域内，且**未**对其他表格节点重复声明 | 源码/节点静态结构（**不判定实际生效范围**） |
| 4 | Props / Slots / Events / Ref 行为不被破坏：`@row-dblclick`、`#empty`、`show-overflow-tooltip`、`fixed="right"`、`data` 渲染与 `ref` 均保持 | 组件契约 |
| 5 | 数据源管理**原有全部交互测试保持通过**（`dataSource.spec.ts` 真跑，不弱化、不删除断言） | 既有交互保护 |
| 6 | `dataSource.spec.ts` 的 `scopedStyleBlock()` 仍能提取到 scoped 块（即保留一个 scoped 块，`<style scoped src>` 不会取代它） | 既有测试兼容性 |

`LIST_TABLE_SHARED_DESIGN_APPROVED` —— 本节**明确不**断言（改由 §7.4 / §7.5 承接）：
`--lt-*` **自定义属性本身是否有值**、**消费属性**的最终计算值、
Feature 覆盖是否**实际只影响当前表格**、
同页**另一张**未覆盖表格的计算样式是否未受影响、元素几何 / 行高 / 外接矩形是否相同。

### 7.3 构建产物检查（阶段一，构建后读取产物）

`LIST_TABLE_SHARED_DESIGN_APPROVED`：

| # | 断言 |
| --- | --- |
| 1 | 产物 CSS 中公共选择器全部带有 `.lt-main-table` 前置或作用域属性限定 |
| 2 | 产物中**不出现**裸 `.el-table__cell` / `.el-table__header` 全局规则 |
| 3 | 产物中**不出现** `:root` / `body` 上的 `--lt-*` 声明 |
| 4 | 产物中公共规则**只**在公共根类节点下可匹配（可用选择器文本 + 结构双重判定） |
| 5 | `npm run build`（含 `vue-tsc --noEmit`）通过 |

### 7.4 真实浏览器计算样式（阶段一，真实浏览器，非 vitest）

`LIST_TABLE_SHARED_DESIGN_APPROVED` —— 见 §6 第 6/7 项的逐值清单，至少覆盖：
`width`；`--el-table-border-color`；`--el-table-header-text-color`；
`--el-table-header-bg-color`；表头 `font-size / font-weight / color / letter-spacing`；
`th / td` 上下内边距；表头高度、首行高度与表格外接矩形；
长文本省略与 Tooltip 行为不变；视口 `1440×900` 与 `1920×1080`；页面缩放 `100%`。
判定阈值**严格 0**，并提供**反向控制**（注入 `≥0.001px` 位移必须使断言非零退出）。

`LIST_TABLE_SHARED_DESIGN_APPROVED` —— 本节**同时承接** §2.5 / §7.2 移出的
**Feature 覆盖隔离**类运行时事实，均为**真实浏览器**判定，**不是** vitest：

| # | 运行时断言 | 期望 |
| --- | --- | --- |
| A | Feature **显式覆盖的令牌**：其**消费属性**（如覆盖的是内边距令牌，则判 `th/td` 的 `padding`）生效 | 逐值等于预期覆盖值 |
| B | 同页**另一张未覆盖**表格（如同文件内的 `.naming-table` 弹窗表）计算样式**未受影响** | 与基准逐值相同 |
| C | **未被覆盖的令牌**：其**消费属性**经 `var(--lt-xxx, 默认值)` 取得公共默认值 | 逐值与 §4.4 默认值相同 |
| D | 移除 Feature 覆盖后，目标表格的**消费属性回到公共默认值** | 与未覆盖基准逐值相同 |
| E | Feature **显式覆盖的令牌本身**：`getComputedStyle(target).getPropertyValue('--lt-xxx')` | 读到 **Feature 声明值**（**仅限被覆盖的那几个令牌**） |
| F | **未被覆盖的令牌本身**：`getComputedStyle(target).getPropertyValue('--lt-xxx')` | **为空**——这是**正确**结果，**不得**判为失败 |

`LIST_TABLE_SHARED_DESIGN_APPROVED` —— 上表把**两个不同层级**严格拆开，
不得混为一谈（这是本轮修订的核心）：

```text
（一）自定义属性「本身」是否被声明
      覆盖令牌   → 读到 Feature 声明值（E）
      未覆盖令牌 → 为空（F）——因为公共层从不声明 --lt-*（§4.4 / §4.6 L4）
（二）「消费属性」的最终计算值
      无论令牌本身是否被声明，消费属性恒为：
      有覆盖 → 覆盖值（A）；无覆盖 → var(--lt-*, fallback) 的公共默认值（C / D）
```

`LIST_TABLE_SHARED_DESIGN_APPROVED` —— 由此产生一条**判定纪律**：

```text
不得以「--lt-* 非空」作为「模板是否已启用」的通用判据。
已启用 lt-main-table 但无 Feature 覆盖的表格上，9 个 --lt-* 读取为空是设计预期，
其视觉仍来自公共 fallback 默认值；
「是否启用模板」只由根元素 className 是否含 lt-main-table 判定（§7.2 第 1/2 项）。
```

`LIST_TABLE_SHARED_DESIGN_APPROVED` —— 与之配套的**架构约束**（不得为迎合断言而改动）：
**不得**让公共层在 `.lt-main-table` 上预先声明 9 个 `--lt-*` 默认值，
那会引入「公共声明 vs Feature 声明」的同属性竞争，破坏 §4.5（4）的
加载顺序无关原则。

### 7.5 负向页面矩阵（阶段一，真实浏览器）

`LIST_TABLE_SHARED_DESIGN_APPROVED` —— 至少选取：

```text
1. 数据源管理命名策略弹窗表（.naming-table，同文件内第二张 el-table）
2. 探针端管理主表（.cc-table）
3. 数据订阅主表（无表格根类）
4. 源库快照状态主表（.dss-table）
5. 数据同步进度主表（.toff-table）
6. 一个弹窗/详情子表（如服务配置保存确认表或故障事件子表）
7. 日志查询主表与故障历史下钻列表（补充，可选）
```

验证它们在**未显式启用**时：公共规则匹配数 `0`、
`--lt-*` **实际未被声明（读数为空）**、
§6 第 6 项计算样式（消费属性最终值）与基准**逐值相同**、
且构建产物不存在可命中它们的全局规则。

`LIST_TABLE_SHARED_DESIGN_APPROVED` —— 本节是 §2.5 / §7.2 移出的
「未启用页面 `--lt-*` 读数为空」「公共规则实际匹配数为 `0`」「未启用页计算样式不变」
三项运行时事实的**唯一承接处**；这三项**不得**回写为 vitest 结论。

`LIST_TABLE_SHARED_DESIGN_APPROVED` —— **边界的完整口径**（三态必须并列写清，
不得只写其中一态，也不得把「令牌非空」当作启用判据）：

| 状态 | `--lt-*` 自定义属性本身 | 消费属性的最终值 |
| --- | --- | --- |
| 未启用页面、无 Feature 声明 | **为空** | 不匹配公共规则，维持基准 |
| 已启用 `lt-main-table`、**无** Feature 覆盖 | **同样为空**（公共层从不声明） | 取 `var(--lt-*, fallback)` 的**公共默认值**（§4.4） |
| 已启用且**显式覆盖某个令牌** | **仅被覆盖的该令牌**读到 Feature 值；其余仍为空 | 被覆盖项取覆盖值；其余取公共默认值 |

### 7.6 覆盖点与零泄漏的反向控制

`LIST_TABLE_SHARED_DESIGN_APPROVED`：

| # | 反向控制 | 期望 |
| --- | --- | --- |
| 1 | 故意把 `--lt-*` 声明到 `:root` | 零泄漏检查**非零退出** |
| 2 | 新增一个非 scoped 的 `<style>` 块承载公共规则 | 静态契约测试**非零退出** |
| 3 | 故意让参考页保留被公共层替代的同义规则 | “同一属性单一发表者”检查**非零退出** |
| 4 | 故意注入 `≥0.001px` 几何位移 | 计算样式/几何断言**非零退出** |
| 5 | 故意在公共源文件里写裸 `.el-table__cell` | 静态契约测试**非零退出** |

### 7.7 回滚验证

`LIST_TABLE_SHARED_DESIGN_APPROVED` —— 按 §9.2 执行回滚后必须满足：
参考页恢复接入前状态；其他页面无变化；无残留令牌与未使用 import；
前端测试与构建继续通过。回滚验证与接入验证使用**同一组**计算样式清单，
以保证可比。

---

## 8. 实现阶段拆分

`LIST_TABLE_SHARED_DESIGN_APPROVED` —— 阶段拆分如下
（设计任务当时**未执行任何阶段**；**阶段一随后已由独立实施任务落地**，
经项目负责人于 2026-09-22 目测通过，由独立正式验收任务完成本地正式验收，
并由项目负责人于 2026-09-22 最终接受并关闭
（`formal_acceptance_execution_status=EXECUTED_PASSED_LOCAL`，
`final_acceptance_status=ACCEPTED_BY_PROJECT_OWNER`）；阶段二仍未授权）：

### 8.1 阶段一：公共实现 + 数据源管理参考页等价接入

**已由独立任务**（另立提示词、独立授权）执行；该提示词授权：

```text
1. 创建 §4.1 的两个公共文件（样式源 + 常量模块）；
2. 创建 §7.1 / §7.2 的公共实现测试；
3. 数据源管理参考页显式接入（追加根类 + 一行 <style scoped src>）；
4. 移除被公共层等价替代的 4 组局部基础样式（§6 第 1 项）；
5. 保留全部 Feature 专属样式（§6 第 2 项）；
6. 执行自动化测试、前端构建、真实浏览器逐值等价验证与负向矩阵；
7. 正式验收与最终接受（另立验收任务）。
```

阶段一**明确不做**：不迁移任何其他页面；不修改 qlpt 任何文件与状态；
不修改四份已批准模板文档的规范内容（除状态块同步另立任务外）；
不引入新依赖、全局样式、路由元数据。

### 8.2 阶段二：逐页迁移

`LIST_TABLE_SHARED_DESIGN_APPROVED` —— 只有阶段一完成**正式验收与最终接受**后，
才能从 `MIGRATION.md` 的矩阵中逐页选择。每个页面必须
**单独提示词、单独授权、单独实现、单独目测、单独验收**。

`LIST_TABLE_SHARED_DESIGN_APPROVED` —— 本详细设计**不预先选择**探针端管理、数据订阅
或任何其他页面作为首个迁移对象。`MIGRATION.md` 的
`CANDIDATE_HIGH` 排序**不等于**项目负责人批准的迁移顺序，
`page_migration_authorization_status` 继续保持 `NOT_GRANTED`。

---

## 9. 风险与回滚

### 9.1 风险清单

`LIST_TABLE_SHARED_DESIGN_APPROVED`：

| # | 风险 | 影响 | 缓解 |
| --- | --- | --- | --- |
| 1 | 外部文件中的 `:deep(...)` 未被作用域编译 | 公共规则退化为全局规则，污染全站 | §2.3 已用插件源码逐条核实；若实现阶段与此不符，**停止并报告**，**不得**改用全局样式绕行 |
| 2 | Feature 保留同义规则导致同特异性竞争 | 依赖加载顺序，等价性不可重复 | §4.5 第 5 项：单一发表者硬性检查；§6 第 1 项要求删除同义副本；§7.6 反向控制 3 |
| 3 | 公共层声明 `--lt-*` 的值 | 与 Feature 覆盖形成同属性竞争 | §7.1 断言 4：源文件中不得出现 `--lt-…:` 声明 |
| 4 | 公共根类放到 `el-table` 祖先上 | `width` 落错元素；表格宽度失效 | §4.2 禁止项 5；§7.2 断言 1 断言类在表格根元素上 |
| 5 | 误把序号列/空态/ID 强调/胶囊提升为公共规则 | 跨页面语义污染 | §5 逐项排除；§7.1 断言 8 禁止状态语义词；`DESIGN.md` §7、`UI.md` §3 为批准依据 |
| 6 | 覆盖点无上限增长，退化为“第二套业务样式” | 契约失效、无法回滚 | §4.5 第 2 项禁止扩张；覆盖点必须写在业务根类下且**只含 `--lt-*` 声明**；§7.1 断言 11 |
| 7 | Element Plus 升级导致 `:deep` 选择器失效 | 表头排版与内边距静默丢失 | 只命中 3 个最小结构选择器（`th .cell` / `th.el-table__cell` / `td.el-table__cell`），并纳入 §7.4 的等价验证；升级时重跑同一清单 |
| 8 | 参考页接入顺带改动业务行为 | 已接受 Feature 漂移 | §6 第 5 项不得变化清单；§7.2 断言 5 要求原有交互测试全绿 |
| 9 | 未启用页面被间接影响 | 违反基线 §3 第 5 项 | §7.5 负向矩阵 + §7.3 构建产物检查 + §7.6 反向控制 |
| 10 | 阶段一顺带迁移其他页面 | 破坏“每页独立任务”纪律 | §8.1 明确不做；§8.2 需先验收 |
| 11 | 公共层新增未在 §4.4 中的视觉值 | 越权定义全站视觉 | §4.4 的 15 项逐项处置表；`lt_new_invented_visual_value_count=0` 为可断言事实 |

### 9.2 回滚设计

`LIST_TABLE_SHARED_DESIGN_APPROVED`：

1. **回滚粒度**：阶段一实现任务必须组织为两个可独立回退的提交单元——
   “**新增公共层**”与“**参考页等价接入**”。回滚接入提交即可让参考页回到原实现，
   公共层可保留（未被引用，对未启用页面零影响）；
2. **回滚方式**：一次普通 `git revert <接入提交>`。
   **不得**使用 `reset --hard`、`checkout .`、`clean -f`、`stash` 或任何改写历史的操作；
3. **回滚前置条件**：本设计**不引入**路由元数据、全局样式或构建配置改动，
   因此回滚不牵连其他变更（与 qlpt 阶段一需同时回退路由元数据的情形不同）；
4. **回滚验证**：回滚后重新通过参考页定向测试与前端构建，
   并按 §7.7 确认视觉与业务语义回到接入前状态；
5. **本设计任务不执行任何回滚**，只记录回滚设计。

---

## 10. 与四份已批准模板文档的关系

`LIST_TABLE_SHARED_DESIGN_APPROVED` —— 本文件是四份已批准模板文档的**下游详细设计**：

- 四份模板文档仍是**已批准基线**（`APPROVED` / `BASELINE_APPROVED`），
  本文件**不修改**其规范内容，也**不改变**其标记计数（**现行**为 `28 / 0 / 43 / 7`，核验见 `README.md` §7.4）；
- 本文件对候选清单的结论（§3）是**逐项带证据的定案**，
  与基线 `DESIGN.md` §8“不定案”的状态**不是矛盾**：
  基线的“不定案”约束的是**基线任务自身**，并明确把定案交给
  “后续 `SHARED_COMPONENT_DESIGN` 类任务”；本文件正是该任务，
  其结论已获 ChatGPT 远程 R2 复审 `REVIEW_PASS` 与项目负责人批准；
- 四份模板文档新增的最小状态同步与导航见各自文件（§15 范围）；
  `DESIGN.md` §8 **只新增**指向本详细设计的交叉引用，
  **不**把候选方案改写为已批准实现方案；
- 本文件详细设计状态为 `APPROVED`（`approval_scope=SHARED_IMPLEMENTATION_DETAILED_DESIGN_ONLY`）；
  公共实现与参考页接入随后已由独立实施任务落地，经项目负责人于 2026-09-22 目测通过，
  由独立正式验收任务完成本地正式验收，并由项目负责人于 2026-09-22 最终接受并关闭
  （`shared_implementation_status=IMPLEMENTED_ACCEPTED`、
  `reference_page_integration_status=IMPLEMENTED_ACCEPTED`，
  `project_owner_visual_review_status=PASS`，
  `formal_acceptance_execution_status=EXECUTED_PASSED_LOCAL`，
  `final_acceptance_status=ACCEPTED_BY_PROJECT_OWNER`）；
  本次最终接受范围**仅限**公共实现与数据源管理参考页等价接入；
  页面迁移**仍未授权**（`NOT_STARTED` / `NOT_GRANTED`）；
  **未经项目负责人再次明确批准，不得修改任何代码。**

---

## 11. 设计决策标记与计数

### 11.1 标记

`LIST_TABLE_SHARED_DESIGN_APPROVED` —— 本文件全文只使用该一个标记（§0.1）。

**例外（2026-09-29，R2 纠正后；§13 批准收口后更新，见 §0.1）**：§12 可选扩展的**已落地／已批准事实**按 `README.md` §7.3
统一标注 `LIST_TABLE_REFERENCE_FACT`，**未实现**的禁用态视觉标注
`LIST_TABLE_PROPOSED_NOT_IMPLEMENTED`；§13 经 `2026-09-29` 批准后，其**已批准设计契约**改用本文件批准态
设计标记、其**尚不存在的公共实现**据实标注参考事实标记。§1~§10 已批准设计正文的“唯一标记”口径**不变**；
§13.3／§13.4 两处经 `2026-09-29` 批准由候选未实现标记改标本批准态设计标记，故 §11.2 核验命令的
计数由 `79` 增至 `81`（见 §12.8 通道 2）。
现行状态以 §12 状态块与 §12.8 复测记录为准（见 §0.1）。

**§12／§13 各项整理（2026-09-29，R2 纠正后；§13 批准收口后更新）**：§12 各轮整理（收敛契约、实现落地、模板定向整理、
R1 纠错、R2 标记纠正）**未**新增或删除任何批准态设计标记实例（§12 各轮整理后本标记计数仍 `79`）；§13 经
`2026-09-29` 批准后 §13.3／§13.4 两处由候选未实现标记改标本标记，**现行计数 `81`**（见 §12.8 通道 2）。§12／§13 的
参考事实标记与候选未实现标记计数口径与实测值见 §12.8（**独立**于四份规范文档与本文件批准态设计标记两条通道）。

本文件**不**复用模板基线标记冒充详细设计已批准：
模板基线标记（四份规范文档中的 `LIST_TABLE_TEMPLATE_APPROVED`）描述的是
**模板规则**的批准，与本文件的**详细设计**批准是**两个独立状态**，
**不得**合并、替代或推导。

`LIST_TABLE_SHARED_DESIGN_APPROVED` —— 该字面量的**标记定义域只有本文件**：

- 四份已批准规范文档（`README.md` / `DESIGN.md` / `UI.md` / `MIGRATION.md`）
  **不含**该字面量（其**现行**计数为 `28 / 0 / 43 / 7`，核验见 `README.md` §7.4）；
- 标记计数以**本文件**为唯一定义域，避免与其他目录的冻结计数产生歧义；
- **计数口径说明**：本计数只统计**本文件内作为设计决策标记使用**的实例。
  任务提示词与执行报告中对本标记的**引用**（如在计数表中复述该字面量）
  属**过程材料**，不构成规范文件中的标记实例，不计入本计数，
  也不改变四份规范文档的冻结计数。

### 11.2 计数与核验命令

`LIST_TABLE_SHARED_DESIGN_APPROVED` —— 实测计数（见 §11.3）。
核验命令用**字符串拼接**构造字面量，避免核验命令自身的文本被计入：

```bash
approved_marker="LIST_TABLE_SHARED_DESIGN_""APPROVED"
grep -ohF "$approved_marker" \
  docs/baseline/list-table-visual-template/SHARED_COMPONENT_DESIGN.md | wc -l

draft_marker="LIST_TABLE_SHARED_DESIGN_""DRAFT"
grep -ohF "$draft_marker" \
  docs/baseline/list-table-visual-template/SHARED_COMPONENT_DESIGN.md | wc -l   # 期望 0
```

同时复核四份已批准规范文档的计数与候选盘点不变量：

```bash
core_docs=(
  docs/baseline/list-table-visual-template/README.md
  docs/baseline/list-table-visual-template/DESIGN.md
  docs/baseline/list-table-visual-template/UI.md
  docs/baseline/list-table-visual-template/MIGRATION.md
)
for m in LIST_TABLE_REFERENCE_FACT LIST_TABLE_TEMPLATE_APPROVED \
         LIST_TABLE_PROPOSED_NOT_IMPLEMENTED
do
  printf "%-38s %s\n" "$m" "$(grep -ohF "$m" "${core_docs[@]}" | wc -l)"
done

draft_marker="LIST_TABLE_TEMPLATE_""DRAFT"
grep -ohF "$draft_marker" "${core_docs[@]}" | wc -l   # 期望 0

grep -rnP '<el-table(?![-_])' frontend/src --include=*.vue | wc -l   # 期望 15
grep -rlP '<el-table(?![-_])' frontend/src --include=*.vue | wc -l   # 期望 14
```

### 11.3 实测计数（2026-09-21 时点快照，批准收口后复测；**现行**四通道计数见 §12.8）

> 本节为**逐轮时点快照**：下列数值均属**对应日期**的实测，**不代表现行值**；**现行**四通道计数见 §12.8 的现行段
> 与 `README.md` §7.4。下文各段虽按轮次记录，均属**历史实测**，其“仍／不变”指**相对上一段该时点**而言。

```text
LIST_TABLE_SHARED_DESIGN_APPROVED（本文件·规范正文，2026-09-21 时点）  = 79
草案标记（本文件·规范正文，2026-09-21 时点）           = 0
已批准标记（四份规范文档）                             = 0
LIST_TABLE_REFERENCE_FACT（四份规范文档）              = 22
LIST_TABLE_TEMPLATE_DRAFT（四份规范文档）              = 0
LIST_TABLE_TEMPLATE_APPROVED（四份规范文档）           = 42
LIST_TABLE_PROPOSED_NOT_IMPLEMENTED（四份规范文档）    = 11
el_table_usage_count                                  = 15
el_table_file_count                                   = 14
```

`LIST_TABLE_SHARED_DESIGN_APPROVED` —— 上述计数为**实测值**，
非人为堆叠：每个标记实例都对应本文件中一个**真实的设计决策段落**。

**计数口径（不得混算）**：

- “本文件·规范正文”**只统计本文件正文**，不包含 R0 / R1 / R2 三份历史报告；
- 目录级 `grep -r` 若覆盖 `reports/`，会额外命中历史报告中的**草案字面量**，
  那是**历史事实**，**不得**与正文计数相加，也**不得**作为批准判断依据。

本标记 —— **计数变更说明（逐轮实测，非硬编码）**：

```text
R0（提交 d7ae5af）  草案标记 = 71
R1（提交 f8d8465）  草案标记 = 75   （+4）
R2（提交 e72264d）  草案标记 = 79   （+4）
收口（本次）        草案标记 = 0，已批准标记 = 79（1:1 转换）
```

- **R1 `+4` 来源**（测试分层修订）：§2.5 运行时事实清单、
  §7.2 分层口径说明、§7.4 Feature 覆盖隔离表、§7.5 承接归属说明，**各 `+1`**；
- **R2 `+4` 来源**（自定义属性 / fallback 语义修订）：§7.4
  「两个不同层级严格拆开」说明块、§7.4「判定纪律」块、
  §7.4「架构约束」块、§7.5「边界的完整口径」三态表，**各 `+1`**。

复核方式：`79` 个实例分布在 `79` 个**互不相同**的行上（每行恰 `1` 个），
不存在同句叠加凑数的情形。四份规范文档的 `22 / 0 / 42 / 11` **未受影响**。

**目测收口后复测（2026-09-22）**：目测通过收口**未**新增或删除任何标记实例
（只同步该阶段状态），因此**该时点**本文件与四份规范文档的计数与上表**逐值相同**：
本文件已批准标记 `79` / 草案态 `0`；
四份规范文档参考事实标记 `26`、草案态规则标记 `0`、
已批准模板规则标记 `42`、候选未实现标记 `7`；候选盘点 `15 / 14`。
上表（2026-09-21）的 `22 / 0 / 42 / 11` 是**实现前时点**的历史实测，保留不改；
**该时点（2026-09-22）**规范计数为 `26 / 0 / 42 / 7`；**现行**计数见 §12.8 与 `README.md` §7.4。

**模板定向整理后复测（2026-09-29，`LIST-TABLE-VISUAL-TEMPLATE-CLIENT-CONFIG-REFINEMENT-BASELINE-001`）**：
本任务整理五份规范正文（删除过期示例、`DESIGN.md` §5 新增实测参考事实、`DESIGN.md` §7 新增最小定向修订草案、
本文件 §13 新增分层契约），标记实例**有增无删**，从文件复算（非硬编码）为：
四份规范文档 `27 / 0 / 42 / 8`（参考事实 `+1`、候选未实现 `+1`）；
本文件已批准标记 `79`、草案态 `0`（**不变**）；本文件候选未实现标记 `23`
（§12 内 `18` 处、§13 内 `2` 处、§0.1／§11.2／§11.3 说明文字共 `3` 处；较上段时点值**净变化 `0`**——
§12.6 两处草案示例改写为现行接入事实后迁出 `-2`，§13 新增 `+2`）。
候选盘点 `15 / 14` **不变**。时点值 `26 / 0 / 42 / 7` 与候选未实现标记 `23` 保留为历史实测，**不回写**。

**第七轮待复审草案加入后复测（2026-09-29）**：新增 §12 只引入候选未实现标记的实例，
**未**新增、删除或改动任何批准态设计标记实例，故本文件已批准标记仍为 `79`、草案态 `0`；
四份规范文档 `26 / 0 / 42 / 7` 亦不变（核验命令见 §12.8）。§12 的候选标记实例数见 §12.8。

**第七轮 R1 定向纠错后复测（2026-09-29）**：§12 收敛为拟修订契约**只**改写 §12 文字，
**未**新增、删除或改动任何批准态设计标记实例，故本文件已批准标记仍 `79`、草案态 `0`；
四份规范文档 `26 / 0 / 42 / 7` 亦不变。§12 候选未实现标记的独立实测值（R1 后）
见 §12.8 通道 3；R0 的时点实测值保留不改。三条计数通道**严格不混算**。

**第七轮可选扩展设计基线批准收口后复测（2026-09-29）**：批准收口**只**改写 §12 与本节／§0.1 的
**状态说明与元数据**，**未**新增、删除或改动任何批准态设计标记实例，故本文件已批准标记仍 `79`、
草案态 `0`；四份规范文档 `26 / 0 / 42 / 7` 亦不变。§12 因**扩展代码尚未实现**，仍以候选未实现
标记引用，通道 3 复测值见 §12.8（本收口复测仍 `23`）。**设计基线获批 ≠ 扩展代码已实现或已生效。**

**第七轮 opt-in 代码实现后复测（2026-09-29）**：独立实现任务
`CLIENT-CONFIG-ROW-HEIGHT-AND-OPTIONAL-ELLIPSIS-IMPLEMENTATION-001` **只**落地 §12 已批准设计文本
（公共样式新增两条根类限定规则、`/config/client` 主列表接入、断言 #11 按 R2 口径更新），
**未**新增、删除或改动任何批准态设计标记实例，故本文件已批准标记仍 `79`、草案态 `0`；
四份规范文档 `26 / 0 / 42 / 7` 亦不变。§12 因实现**尚未经远程复审通过、亦未获项目负责人目测**，
仍**暂**以候选未实现标记引用，通道 3 复测值见 §12.8（本实现后复测仍 `23`）。
**实现完成 ≠ 远程代码复审通过 ≠ 已目测 ≠ 已正式验收。**

### 11.4 历史报告中的草案字面量（逐字保留，不回写）

`LIST_TABLE_SHARED_DESIGN_APPROVED` —— 本次批准收口**只**转换**本文件正文**中的标记，
**不**触碰任何历史记录：

| 文件 | 内容性质 | 本任务处置 |
| --- | --- | --- |
| `reports/LIST-TABLE-VISUAL-TEMPLATE-SHARED-IMPLEMENTATION-DESIGN-001.md` | R0 设计任务执行报告（当时为草案状态） | **逐字保留，未修改** |
| `reports/LIST-TABLE-VISUAL-TEMPLATE-SHARED-IMPLEMENTATION-DESIGN-001-R1.md` | R1 定向修订报告 | **逐字保留，未修改** |
| `reports/LIST-TABLE-VISUAL-TEMPLATE-SHARED-IMPLEMENTATION-DESIGN-001-R2.md` | R2 定向修订报告 | **逐字保留，未修改** |
| `reports/LIST-TABLE-VISUAL-TEMPLATE-BASELINE-001*.md` 等更早报告 | 基线阶段报告 | **逐字保留，未修改** |

这些报告产生时的**草案状态、复审结论与标记字面量**属**历史事实**：
它们描述的是**当时**的状态，**不得**因本次批准而全局替换、回写或“修正”为已批准。
读取历史报告时，必须以其**产生时点**的状态理解，不得与当前 `APPROVED` 状态混读。

---

## 12. 已批准设计基线的可选扩展：行内三点入口 opt-in

`LIST_TABLE_REFERENCE_FACT` —— **本节为已批准设计基线的可选扩展**，来源为探针端管理
第七轮调整任务 `CLIENT-CONFIG-ROW-HEIGHT-AND-OPTIONAL-ELLIPSIS-BASELINE-001`。产品方向为：把行内
三点入口的**外观与通用可访问性**提炼为公共列表表格视觉模板的**显式启用（opt-in）可选能力**，
**不**成为所有主列表的默认入口。本节 opt-in 扩展**已落地代码并接入 `/config/client` 主列表**
（公共样式与 §7.1 断言 #11 已实现），**现已成为**共享 CSS 与现行测试断言的一部分；本节各项取值
均为**现行值**（见 §12.7），不再以「拟值」表述。**设计基线**已于 2026-09-29 经项目负责人批准
（见下方状态块），**代码复审状态**为 `APPROVED`（**2026-09-30** 由项目负责人转交的 ChatGPT 远程独立
只读代码复审结论，复审对象为 R0 `d93f838…` 与 R1 `aa942dc1…`，见 §12.8 末段）——即本节已由「已落地、
待远程复审」推进为**已实现且代码复审通过、仍待项目负责人最终接受或正式验收**
（`list_table_row_action_opt_in_extension_implementation_status=IMPLEMENTED_PENDING_USER_ACCEPTANCE`，
其**实现提交时点**的复审待办值 `IMPLEMENTED_PENDING_CHATGPT_REVIEW` 作为**历史值**保留，见下方状态块）——
**复审状态**与**实现事实**两者**分开记载**：复审进度值**不**表示本节规则**尚未实现**，
故本节按 `README.md` §7.3 的阅读约定标注**参考事实标记**，**不**再按候选未实现标记引用。
**本节的落地不**表示任何**其他**页面已迁移（`/config/data-source`「更多」→三点迁移仍属另一会话、另一独立任务）。

**历史（R0／R1／R2 与批准链）** —— 本扩展经 `...-BASELINE-001` R0 `9381703…`、R1 `938e720…`
两次从远程 Git 复核均 `CHANGES_REQUIRED`，R2 `59617b4…` 经 ChatGPT 从远程 Git 独立复核
`APPROVED`；项目负责人于 2026-09-29 批准其**设计基线**（R2 修订后口径，
`approval_scope=..._DESIGN_ONLY`，**批准对象是设计基线，不是实现**）；随后由独立实现任务
`CLIENT-CONFIG-ROW-HEIGHT-AND-OPTIONAL-ELLIPSIS-IMPLEMENTATION-001` 落地代码。各轮拟议文本、
旧计数与当时「尚未实现」说明**保留在既有历史报告**（含
`reports/LIST-TABLE-VISUAL-TEMPLATE-CLIENT-CONFIG-REFINEMENT-BASELINE-001.md`），本节不再重复。

```text
list_table_row_action_opt_in_extension_status=DESIGN_BASELINE_APPROVED_IMPLEMENTATION_IMPLEMENTED_PENDING_USER_ACCEPTANCE
list_table_row_action_opt_in_extension_design_approval_status=APPROVED_BY_PROJECT_OWNER
list_table_row_action_opt_in_extension_design_approval_date=2026-09-29
list_table_row_action_opt_in_extension_approved_reviewed_commit=59617b4cee03fe1642417cb85005b339ab0015ab
list_table_row_action_opt_in_extension_implemented=YES
list_table_row_action_opt_in_extension_implementation_task=CLIENT-CONFIG-ROW-HEIGHT-AND-OPTIONAL-ELLIPSIS-IMPLEMENTATION-001
list_table_row_action_opt_in_extension_implementation_status=IMPLEMENTED_PENDING_USER_ACCEPTANCE
list_table_row_action_opt_in_extension_implementation_submission_status=IMPLEMENTED_PENDING_CHATGPT_REVIEW
list_table_row_action_opt_in_extension_code_review_status=APPROVED
list_table_row_action_opt_in_extension_code_review_date=2026-09-30
list_table_row_action_opt_in_extension_code_review_source=CHATGPT_REMOTE_INDEPENDENT_CODE_REVIEW_RELAYED_BY_PROJECT_OWNER
list_table_row_action_opt_in_extension_code_review_range_main=a042df08f1b29ba580ccd9b17f081352a089a995..d93f838be359d71ef373082a6c3a62046912b1a1
list_table_row_action_opt_in_extension_code_review_range_r1=d93f838be359d71ef373082a6c3a62046912b1a1..aa942dc1a4d82d85e6933e8b0977f8736f8c5196
list_table_row_action_opt_in_contract_revision=R2_CORRECTED_APPROVED
page_migration_status=NOT_STARTED
page_migration_authorization_status=NOT_GRANTED
```

### 12.1 能力边界：提炼什么、不提炼什么

`LIST_TABLE_REFERENCE_FACT` —— 公共层**只**提炼**外观与通用可访问性**：
图标容器与**实际命中区域**、行内对齐、圆角、文字／图标颜色、hover、`focus-visible`、
光标形态，以及与单元格行高的**协同关系**（协同方式见 §12.3）；上述内容均已落地于
`frontend/src/styles/list-table/list-table-visual.css` 的 opt-in 规则。

`LIST_TABLE_PROPOSED_NOT_IMPLEMENTED` —— **禁用态视觉（设计契约，尚未实现、尚未验收）**：
**禁用态的职责分界（两层规则，与 §13.2 一致）**：**是否禁用、何时禁用、权限与业务条件由 Feature
决定**；**当入口存在可观察的禁用状态、且页面显式启用这一可选样式时**，**该禁用态在通用视觉与
可访问性上如何呈现**（禁用色、不可点击光标、禁用时 `focus-visible` 的处理等）**拟由公共样式契约负责**（**未来设计职责**，**非**现行实现事实——现行 CSS 无该规则，见下）。
**不得**据此为现行探针三点触发器强造禁用情形——现行被禁用者是**菜单项**，`CCFG-AC-157` 该子项
仍缺实际观察、状态仍 `BLOCKED`。**实现/验收缺口（据实记录）**：现行
`frontend/src/styles/list-table/list-table-visual.css` **尚未**提供禁用态视觉规则，故该禁用态视觉属
**设计契约，尚未实现、尚未验收**（不得声称已实现或已验收），其实现与验收须由后续独立任务承担。

`LIST_TABLE_REFERENCE_FACT` —— 以下**继续由 Feature 控制**，公共层**不**固化：
菜单项集合与顺序、业务权限与可见性、删除／启停等**语义与文案**、请求时序与幂等、
行点击选中／双击编辑规则、Popover/Dropdown 定位与关闭时机、以及异常／歧义数据的语义与呈现
（如探针 ID 三态、`+N`、标签 Tooltip）。其中「**是否 / 何时禁用**」是 Feature 决定的业务条件；
**现行探针端三点触发器未出现可观察的禁用场景**（现行被禁用者是**菜单项**，见上段与 §13.2）。
至于**若将来**入口出现可观察禁用状态且页面显式 opt-in 时公共层**拟**负责的禁用态**通用视觉与可访问性呈现**，
属**上一段的设计契约**（**尚未实现、尚未验收**），**不**属本段现行事实。

### 12.2 显式 opt-in 的落地方案（确定契约、已实现）

`LIST_TABLE_REFERENCE_FACT` —— 与既有 `lt-main-table` 作用域纪律一致，采用
**显式 opt-in 辅助类 + 不新增令牌**的确定方案，而**不**做全局覆盖。命名与挂载位置为
**已落地的确定值**，**不**保留备选：

| 对象 | 确定取值（现行） | 依据 |
| --- | --- | --- |
| opt-in 操作单元格辅助类 | `lt-row-action__cell`，显式挂载于**操作列的 `td`**（Element Plus 渲染的 `td.el-table__cell`）上 | §4.3「若未来确需内部辅助类，必须为 `lt-<block>__<element>`（BEM 双下划线），且必须经独立评审」 |
| opt-in 三点触发器辅助类 | `lt-row-action__ellipsis`，显式挂载于三点触发器的**可见元素**上 | 同上 |
| 作用域限定 | 两条规则均以 `.lt-main-table` 根类前置限定（形如 `.lt-main-table :deep(td.el-table__cell.lt-row-action__cell)`） | §7.1 断言 #6 |
| `--lt-*` 令牌 | **默认不新增**，令牌数保持 `9`（§4.4 表与 `LT_TABLE_VISUAL_TOKENS` 不变） | §7.1 断言 #2／#3、§4.4 |

`LIST_TABLE_REFERENCE_FACT` —— **命名与挂载依据**：`lt-row-action__cell` 与
`lt-row-action__ellipsis` 采用 `lt-<block>__<element>` BEM 形态（`block=row-action`，
`element=cell`／`ellipsis`），与既有单一根类 `lt-main-table` 不冲突，且不使用任何被禁止的
业务类名前缀（`.cc-` 等，§7.1 断言 #7）。现行实现**未**改名；若**将来**因 Element Plus 实际 DOM
结构或既有 BEM 规则要求改名，必须在**独立任务**中给出依据，并在**所有**引用文档中统一，
**不得**只在代码内悄悄改名。

`LIST_TABLE_REFERENCE_FACT` —— **该 opt-in 视觉变体的默认值（固定字面量，非令牌）**：
命中区约 `28px × 28px`、圆角 `6px`、文字／图标色 `var(--el-color-primary)`、hover 浅底；
这些值**直接写在 opt-in 规则中作为字面量**，**不**通过新 `--lt-*` 令牌暴露。
因此 §7.1 断言 **#2**（令牌恰好 `9` 个）与 **#3**（默认值逐一相符）**无需修订**。
若将来确有可调需求，须在**独立任务**中给出**准确令牌名、默认值、令牌总数**及 #2／#3 的
修订文本，**不得**继续留为二选一。

`LIST_TABLE_REFERENCE_FACT` —— **纵向尺寸的精确边界（消解与 §4.4 行高纪律的表面冲突）**：
公共层**不得**为**表格行**声明固定 `height`／`max-height`／`line-height`
（§4.4「行高 不由公共层定义」纪律**不变**）；但 opt-in 三点触发器**自身**可以声明其
**自己的**约 `28×28px` 盒尺寸（`width`／`height` 或等效内边距）——这是**元素自身**的命中区尺寸，
**不是**对 `tr`／`td` 行高的固定。行高补偿（若有）**只**作用于**显式 opt-in 的操作单元格**，
**不**触及未启用页面与未启用表格，**不**把 `28px` 变成所有主列表的**强制最小行高**。
**不得**把上述纪律笼统写成「公共层绝不声明任何 `height`」，否则与 28×28px 命中区目标冲突。

### 12.3 与「内容驱动行高」共存的技术依据（设计已批准、已实现、代码复审通过）

`LIST_TABLE_REFERENCE_FACT` —— **调整前历史测量（第七轮行高调整前）**：探针端管理主列表常规行曾在
第七轮行高调整**前**实测约 `53px`，同期数据源管理参考页常规行约 `48px`；两者差值 `5px` 可归因于
`28×28px` 三点入口的**布局盒**撑高，是本次布局分析的历史依据（推导：`48 = 23 + 24 + 1`、
`53 = 28 + 24 + 1`，其中 `24` 为已批准预设 `--lt-body-cell-padding: 12px 0` 的上下和）。
**该 `53px` 是调整前的历史测量，不是探针端现行常规行高**（现行值见下段）。

`LIST_TABLE_REFERENCE_FACT` —— **现行已实现盒模型与测量**：公共 opt-in 操作单元格以纵向内边距补偿
`9.5px 0`（`48 = 1(行底边框) + 28(入口盒) + 19(纵向内边距和)`），三点触发器命中区 `28×28px`；
据此，探针端主列表**常规可比行**（单行不折行、无额外高度内容）在**真实 `100%` 缩放**下于所记录的
`1440×900` 与 `1920×1080` 两视口各 15 条实测约 **`48 CSS px`**（逐条与参考页 `48px` 差值 `0`，
预置容差 ≤ `1` CSS px），在**真实 `125%` 缩放**（`deviceScaleFactor 1.25`）下各 15 条实测约
**`47.8 CSS px`**。缩放测值以**真实 `100%`／`125%` 缩放**核对证据为准
（`CLIENT-CONFIG-ROW-HEIGHT-AND-OPTIONAL-ELLIPSIS-IMPLEMENTATION-001-R1`），**不**以窄视口模拟替代真实缩放。
**异常／歧义与长内容行仍内容驱动、不强制等高**：探针端带行级提示的歧义行（`S15`）实测 `52px`（100%）／
`51.8px`（125%），归**自适应观察组**、**未**计入可比集合。测量与证据出处见实现任务报告
`docs/features/client-config/reports/CLIENT-CONFIG-ROW-HEIGHT-AND-OPTIONAL-ELLIPSIS-IMPLEMENTATION-001.md`
及同目录 `evidence/…-001/` 与 `…-001-R1/`。

`LIST_TABLE_REFERENCE_FACT` —— **验收状态（现行，只读核对、非本轮实测）**：`CCFG-AC-010`
**现行状态格为 `PASS`**（第七轮定向验收按现行有效定义独立重判，`BLOCKED → PASS`，依据为该条自证证据）；
`CCFG-AC-155~157` **现行状态格为 `BLOCKED`**（`CCFG-AC-155` 缺“超长内容行”真实样本、
`CCFG-AC-156` 写路径项在只读边界内不可实测、`CCFG-AC-157` 定义含 `disabled` 状态而当前无可观察禁用场景）。
状态格出处：`docs/features/client-config/ACCEPTANCE.md` §4 与 §1.24。**本轮不新跑验收、不修改任何验收状态格。**

**历史设计推导（调整前时点，保留为设计依据，非现行契约）** —— 最初的技术主张是「操作目标约 `28×28px`」与
「内容驱动行高」可以同时成立，前提是把**命中区域**与**行高贡献**分开：
**外层**随行内容节奏、**内层**保留约 `28×28px` 独立命中区。当时列为**可选做法**的
「对**启用该能力的操作单元格**做内边距补偿，使 `23 + 纵向内边距和` 与参考页一致，常规行高**不再**由入口撑开」
**已在第七轮实现任务中采纳并落地**为现行 `9.5px 0` 补偿（现行值见上）；当时**不**采用的
「把命中区缩小到 `23px`；用固定行高掩盖问题；用 `transform/translate/margin-top/padding-top/top`
等**已批准 Feature 规格禁止**在该页标记上使用的位移手段」至今仍未采用。上述「可选做法／须真实浏览器实测」
措辞属**设计阶段推导**，**不**是现行契约；完整过程文本保留在既有历史报告与实现任务报告。

`LIST_TABLE_REFERENCE_FACT` —— **已知阻力与现行终解（据实现与浏览器证据）**：
Element Plus 的单元格 `.cell` 计算样式含 `overflow: hidden`，会裁切溢出式命中区、
也可能裁切 `:focus-visible` 的外描边，故**未**采用「溢出扩张命中区」方向。**现行采用**
**内边距补偿 + 盒内焦点环**：`outline: 2px solid var(--el-color-primary)` 配 `outline-offset: -2px`
（`28×28px` 为 **CSS 命中区**尺寸）。焦点环像素探针（`focus-ring-pixels.json`）分缩放结果：

- **真实 `100%` 缩放**：命中盒 `28×28` 物理像素，描边四边与四角均落在盒内，`blueDevicePixelsOutsideBox=0`、
  `ringOutsideMaxDevicePx=0`、`ringFullyInsideHitBoxStrict=true`（严格判定通过）。
- **真实 `125%` 缩放**：命中盒约 `35×35` **物理**像素（`28×28` CSS px × `dpr 1.25`）；严格整数盒判定为
  `false`、盒外计数 `blueDevicePixelsOutsideBox=27`，**全部**落在盒子**左侧紧邻的 1 个物理像素列**
  （`ringOutsideSides={left:27, right:0, top:0, bottom:0}`、`ringOutsideMaxDevicePx=1`），而
  **1 物理像素容差**判定为 `true`（`ringFullyInsideHitBoxWithin1DevicePx=true`）。该左边缘列源于元素左边界
  落在**半个物理像素**上（CSS `x=969.2 × 1.25 = 1211.5` 物理 px，严格整数盒左边界取 `1212`），严格整数盒
  把元素**自身半覆盖的边缘列**判为“盒外”，属**半像素量化归类**，**不是**产品可见的焦点环逸出。

两缩放下的描边均为**闭合圆角矩形**、**四边完整可见**（周长覆盖率 100% `.857/.857/.857/.857`、
125% `.886/.886/.943/.829`，`ringVisibleOnAllFourSides=true`），**未**被 `.cell{overflow: hidden}` 裁切
（若被裁切，裁切侧覆盖率会显著为 0）。注意区分口径：`28×28px` 是 CSS 命中区，`35×35` 是 125% 下的物理
像素命中盒；「严格盒外计数 `27`」不等于产品可见的焦点环逸出，「1 物理像素容差内」也不等于「严格无盒外像素」。
设计阶段曾列为**待验证备选**的「`:has()` 限定的 `overflow: visible`」**未**被采纳，属**历史推导**，见既有报告。

`LIST_TABLE_REFERENCE_FACT` —— **边界强调**：补偿**只**作用于
**显式 opt-in 的操作单元格**，**不**作用于未启用页面／未启用表格，且该盒模型在
**内容驱动的常规行**内即可完成（现行 `9.5px 0`，见上）。具体数值、溢出裁切、焦点描边、
缩放与窄视口表现已由实现任务的**真实浏览器核对**（含真实 `100%`／`125%` 缩放）记录并留有证据，
**不**以推导冒充实测结论；核对记录见 §12.5 更新段与实现任务报告。

### 12.4 零泄漏论证（设计已批准、已实现、代码复审通过）

`LIST_TABLE_REFERENCE_FACT` —— 未启用页面的**计算样式零变化**，依据：

- opt-in 辅助类只出现在**显式启用**的表格节点上；未启用时新规则的选择器**不匹配**；
- 新令牌只以 `var(--lt-…, 默认值)` 内联回退消费，公共层**不**声明 `--lt-*: 值`（§4.4 纪律不变）；
  **默认不新增令牌**，故零泄漏论证更强；
- **不**做全局 Element Plus 覆盖、**不**硬编码页面名、**不**使用 `!important`。

`LIST_TABLE_REFERENCE_FACT` —— **零泄漏的验证覆盖**（见 §12.7(3)）：
在**未启用**页面的表格根节点上断言辅助类**零匹配**（`lt-row-action__cell`／
`lt-row-action__ellipsis` 均不出现），且未启用表格的 `--lt-*` 覆盖声明**不存在**；
该断言属 `§7.2` 的 DOM 类名 + 源码静态结构层，**不**判定 CSS 求值结果。

### 12.5 需真实浏览器验证的风险清单（设计已批准；实现阶段已核对）

`LIST_TABLE_REFERENCE_FACT` —— 下列风险项原为**设计阶段**拟核对清单（**设计阶段不执行**）；
其中每一项均已由**实现阶段的真实浏览器核对**覆盖，核对结论见下段：
命中区不跨行误触、不被 `overflow` 裁切、不遮挡相邻内容、焦点描边可见、
缩放下稳定、窄视口稳定、行内垂直居中、与固定操作列共存、
与 `+N`／探针 ID 三态／标签 Tooltip 共存。

**实现后更新（2026-09-29）**：上述清单为**设计阶段**表述；
其**实现阶段的真实浏览器核对结果**（行高逐样本实测、`:focus-visible` 像素探针、命中区／居中、
窄视口与缩放下不跨行误触、固定操作列、无业务写请求等，及**验证边界**）记录在
`docs/features/client-config/reports/CLIENT-CONFIG-ROW-HEIGHT-AND-OPTIONAL-ELLIPSIS-IMPLEMENTATION-001.md`
及同目录 `evidence/…-001/` 去敏证据内，**以该实现任务记录为准**。该核对为**会话内浏览器核对**，
**不**等于远程代码复审、**不**等于项目负责人目测、**不**等于正式验收。

### 12.6 现行接入事实（探针端管理主列表）

探针端管理主列表**已显式接入**本 opt-in 扩展，属**现行实现事实**（不是草案示例，也不再以「示例 ≠ 已迁移」表述）：

- `/config/client` **主列表**操作列 `td` 挂 `lt-row-action__cell`、行内三点入口挂 `lt-row-action__ellipsis`
  —— `frontend/src/views/client-config/ClientConfigPage.vue`；
- 对应视觉规则位于公共层 —— `frontend/src/styles/list-table/list-table-visual.css`；
- 静态断言 —— `frontend/src/styles/list-table/list-table-visual.spec.ts`（#11 先剔除根类再断言辅助类集合）。

**弹窗内表格未接入**；菜单项、业务权限、请求时序与（可选）重选规则仍由该 Feature 提供。

> 数据源管理页的「更多」文字入口**未**改动、**未**授权改造：其三点化属**另一独立任务**，
> **不**在本节列作可复制的现行示例（`page_migration_authorization_status=NOT_GRANTED` 不变）。

### 12.7 现行可执行契约（已落地，逐项可复审）

`LIST_TABLE_REFERENCE_FACT` —— 本节给出该 opt-in 扩展的**现行可执行契约**（设计基线已于
2026-09-29 获批，并已由独立实现任务 `CLIENT-CONFIG-ROW-HEIGHT-AND-OPTIONAL-ELLIPSIS-IMPLEMENTATION-001`
落地代码）。下列取值均为**现行值**，已对照公共层源码与静态断言核对；实现前的拟议文本与旧计数
**保留在既有历史报告**，不在本节重复。

**（1）§7.1 静态断言 #6 的现行口径**（现行代码核对：`list-table-visual.spec.ts` #6）：

> 6：全部 `:deep(...)` 均由 `.lt-main-table` 限定——每条含 `:deep(` 的规则，其头部
> **必须**以 `.lt-main-table` 起头；opt-in 规则因复合限定（根类 + 辅助类）仍满足本断言，
> **不**新增例外。

**（2）§7.1 静态断言 #11 的现行口径**（现行代码核对：`list-table-visual.spec.ts` #11）：

> 11：内部辅助类数量为 **2**——源文件中除 `.lt-main-table` 外，`lt-` 类选择器
> **只允许**已登记的 opt-in 集合 `{.lt-row-action__cell, .lt-row-action__ellipsis}`；
> **其他**任何 `lt-` 类选择器仍**禁止**。

**现行判定**（`ROOT_CLASS_SELECTOR = '.lt-main-table'`）——先剔除根类再断言辅助类集合：

```ts
const allClasses = [...new Set(css().match(/\.lt-[\w-]+/g) ?? [])]
const helperClasses = allClasses.filter((name) => name !== ROOT_CLASS_SELECTOR).sort()
expect(helperClasses).toEqual(['.lt-row-action__cell', '.lt-row-action__ellipsis'])
expect(allClasses.sort()).toEqual(
  [ROOT_CLASS_SELECTOR, '.lt-row-action__cell', '.lt-row-action__ellipsis'].sort(),
)
```

（两式现行均已落地：`helperClasses` 断言为**先剔除根类**的**两元素**集合；`allClasses` 断言为含根类的
**三元素**允许集合。判定表达式 `css().match(/\.lt-[\w-]+/g)` 的匹配结果**本身包含根类**，
故**必须**如此处理，**不得**写「辅助类恰好两个」却让检查表达式实际计入三类。）
现行 helper 数 `2`；九个 `--lt-*` 令牌与 #2／#3 断言**不变**
（#2 = 令牌恰好 `9` 个；#3 = 每个令牌内联回退与 §4.4 默认值一一相符）。

**（3）§7.2 组件/单元测试的现行覆盖**：在**未启用**页面的表格根节点上断言
辅助类**零匹配**、且未启用表格的 `--lt-*` 覆盖声明**不存在**（DOM 类名 + 源码静态结构，
不判 CSS 求值），与 §12.4 零泄漏论证一致。

**（4）§4.3 现行取值**：「内部辅助类命名规则」行的**现行**取值 = `2`
（`lt-row-action__cell`、`lt-row-action__ellipsis`；实现前阶段一取值为 `0`，历史见既有报告）。

**（5）§4.4 现行计数**：`lt_token_count=9`、`lt_internal_helper_class_count=2`。§4.4
「行高 不由公共层定义」纪律**不变**；opt-in 触发器**自身**的约 `28×28px` 盒尺寸不属表格行高固定（见 §12.2）。

**（6）批准与生效（历史摘要）**：该契约经 ChatGPT 从远程 Git 复审 `APPROVED`（R2 修订后口径）与
项目负责人 2026-09-29 批准**设计基线**后，由**独立实现任务**改写公共样式与静态断言时生效。
R0／R1／R2 各轮拟议文本、复审结论与旧计数见既有历史报告，本节不再重复。

**（7）逐项闭合**：原「待复审问题清单」5 项**全部闭合**——① 命名与默认值 → (1)(2) 与 §12.2；
② #2/#3/#6/#11 现行文本 → (1)(2)(5)（#2/#3 因**不新增令牌**故**不需修订**）；
③ §4.3／§4.4 计数 → (4)(5)；④ 内边距补偿数值与容差 → 与 `CCFG-DESIGN-088`／
`CCFG-REQ-153`／`CCFG-AC-155` 对齐，落实于实现任务的真实浏览器核对（§12.3／§12.5）；
⑤ 候选标记计数口径 → §12.8。**不留**「是否二选一」「是否并入四份文档计数」一类未决项。

**（8）文档/代码边界（现行）**：本契约**已**落地于 `frontend/src/styles/list-table/**` 与
`/config/client` 主列表的**显式**接入（见 §12.6）；`/config/data-source` 迁移状态**未**翻转
（`page_migration_status`／`page_migration_authorization_status` 仍 `NOT_STARTED`／`NOT_GRANTED`），
其三点化仍属**另一独立任务**。实现状态为 **`IMPLEMENTED_PENDING_USER_ACCEPTANCE`**（已实现且
**2026-09-30** 代码复审 `APPROVED`，**仍待项目负责人最终接受或正式验收**；其实现提交时点的复审待办值
`IMPLEMENTED_PENDING_CHATGPT_REVIEW` 为**历史值**）；
**实现完成 ≠ 代码复审通过 ≠ 项目负责人目测 ≠ 正式验收通过**——本处**只**表示代码复审已通过，
**不**表示本节已获项目负责人接受、**不**表示 157 条正式验收完成、**不**表示页面迁移获授权。

### 12.8 计数口径与核验（R2 标记纠正后收敛；R3 定向纠错后复测；R4 焦点环证据表述纠错后复测；批准收口后复测；批准收口 R1 计数分层纠错后复测；第七轮实现复审状态同步后复测）

`LIST_TABLE_REFERENCE_FACT` —— **计数通道严格分开、互不混算**。R2 标记纠正后，本文件 §12 中
**已落地／已批准事实**新增使用**参考事实标记**，故通道由三条扩为四条：

1. **四份规范文档计数**（`README.md` §7.4 口径）：核验命令**只**扫描
   `README.md`／`DESIGN.md`／`UI.md`／`MIGRATION.md` 四份文件，**不扫描本文件**；
   **现行**为 `28 / 0 / 43 / 7`（`DESIGN.md` §7 最小定向修订经 `2026-09-29` 批准后，
   其说明由候选未实现标记改标已批准模板规则：已批准 `42 → 43`、候选未实现 `8 → 7`；
   参考事实 `28` 不变）。
2. **本文件批准态设计标记**（§11.1／§11.2 口径）：核验命令拼接构造字面量、只统计本文件；
   **现行**为 `81`（§13.3／§13.4 两处由候选未实现标记改标本文件批准态设计标记：`79 → 81`）。
3. **本文件参考事实标记**（R2 新增口径，**只统计本文件**）：§12 中描述**现行源码事实与已批准设计取值**
   的内容、以及 §13 中**据现行源码核查**的实现状态（公共层未提供 §13 可选样式），统一标注
   `LIST_TABLE_REFERENCE_FACT`，**独立**统计，**不**并入通道 1 或通道 2；**现行**为 `26`（§13.3 新增 `1`）。
4. **本文件候选未实现标记**（**只统计本文件**）：现仅剩**未实现**的禁用态视觉规则（§12.1）与
   本节／§11 的说明与核验命令，**独立**统计；**现行**为 `8`（§13 契约经批准改标，`10 → 8`）。

**原「是否并入 §7.4 计数」问题已闭合**：本文件的参考事实标记与候选未实现标记**均不**并入四份规范文档的
同名计数；本文件另列独立统计与核验命令。R0／R1 报告中的历史实测值属**时点证据**，保留不回写；
本节末段按**现行**内容**重新核算**、不硬编码旧值。**R1 及更早「因待远程复审故暂不改判为参考事实标记」
的结论，由 R2 依据 `README.md` §7.3 纠正**（复审状态 ≠ 尚未实现）。

```bash
# 通道 1：四份规范文档计数（不扫描本文件）：现行应为 28 / 0 / 43 / 7
core_docs=(docs/baseline/list-table-visual-template/README.md \
           docs/baseline/list-table-visual-template/DESIGN.md \
           docs/baseline/list-table-visual-template/UI.md \
           docs/baseline/list-table-visual-template/MIGRATION.md)
for m in LIST_TABLE_REFERENCE_FACT LIST_TABLE_TEMPLATE_APPROVED LIST_TABLE_PROPOSED_NOT_IMPLEMENTED; do
  printf "%-38s %s\n" "$m" "$(grep -ohF "$m" "${core_docs[@]}" | wc -l)"
done

# 通道 2：本文件批准态设计标记计数：现行应为 81
approved_marker="LIST_TABLE_SHARED_DESIGN_""APPROVED"
grep -ohF "$approved_marker" docs/baseline/list-table-visual-template/SHARED_COMPONENT_DESIGN.md | wc -l

# 通道 3：本文件参考事实标记（R2 新增独立通道，拼接构字避免自计）
ref_marker="LIST_TABLE_REFERENCE_""FACT"
grep -ohF "$ref_marker" docs/baseline/list-table-visual-template/SHARED_COMPONENT_DESIGN.md | wc -l

# 通道 4：本文件候选未实现标记（拼接构字避免自计）
cand_marker="LIST_TABLE_PROPOSED_""NOT_IMPLEMENTED"
grep -ohF "$cand_marker" docs/baseline/list-table-visual-template/SHARED_COMPONENT_DESIGN.md | wc -l
```

实测（2026-09-29，R1 定向纠错后）：通道 1 `26 / 0 / 42 / 7` **不变**（草案态规则标记仍为 `0`）；
通道 2 本文件批准态设计标记 `79` **不变**；通道 3 本文件候选未实现标记全部出现次数为 `23`
（其中 §12 节内 `20` 处，§0.1／§11.2／§11.3 说明文字共 `3` 处）。
R0 实测「§12 内 `15`／含 §0.1 为 `16`／文件总计 `18`」为**时点证据**，**保留不改**
（其中 §11.3 计数块内的引用为对四份规范文档计数的引用）。

实测（2026-09-29，**R2 定向纠错后复测**）：R2 **未**新增／删除任何候选未实现标记实例，
通道 1 `26 / 0 / 42 / 7`、通道 2 本文件批准态设计标记 `79`、通道 3 本文件候选未实现标记
`23`（§12 节内 `20` 处、其它说明 `3` 处）**均不变**；R1 时点值 `23` 保留为时点证据。

实测（2026-09-29，**设计基线批准收口后复测**；**历史时点口径，其「因待复审故暂不改判」结论已由下方 R2 纠正**）：批准收口**只**改写 §12 与 §0.1／§11 的
**状态说明与元数据**，**未**新增／删除任何标记实例，通道 1 `26 / 0 / 42 / 7`、
通道 2 本文件批准态设计标记 `79`、通道 3 本文件候选未实现标记 `23`
（§12 节内 `20` 处、其它说明 `3` 处）**均不变**。**为何获批后仍用候选未实现标记**：
该标记按 `README.md` §7.3 覆盖「**尚未实现**」的候选；本扩展**设计基线虽已批准，
但扩展代码仍未实现、仍未生效**，故其规则仍按候选未实现标记引用，**不**改判为参考事实标记。
待**独立实现任务**落地后，再按当时内容重新核算三条通道（届时 §12 相关规则方可转为
参考事实／已批准实现口径）。

实测（2026-09-29，**opt-in 代码实现后复测**；**历史时点口径，其「暂不改判为参考事实标记」结论已由下方 R2 纠正**）：独立实现任务
`CLIENT-CONFIG-ROW-HEIGHT-AND-OPTIONAL-ELLIPSIS-IMPLEMENTATION-001` 已按本节 (1)(2)(4)(5) 的既定文本
落地：`frontend/src/styles/list-table/list-table-visual.css` 新增仅受 `.lt-main-table` 限定的
`lt-row-action__cell`／`lt-row-action__ellipsis` 两条规则，`/config/client` 主列表操作列 `td` 与三点入口
显式接入，`frontend/src/styles/list-table/list-table-visual.spec.ts` 断言 #11 改为「先剔除根类再断言辅助类
集合」（#2／#3／#6 不变）。复测三条通道：通道 1 四份规范文档 `26 / 0 / 42 / 7`、通道 2 本文件批准态设计标记
`79`、通道 3 本文件候选未实现标记 `23`（§12 节内 `20` 处、其它说明 `3` 处）**均不变**——
本实现任务**未**新增／删除任何标记实例。**为何候选未实现标记仍不改判**：本次实现状态为
`IMPLEMENTED_PENDING_CHATGPT_REVIEW`（**待远程复审**，尚未经远程复审通过，亦未获项目负责人目测），
故按上一段所述既有纪律**暂不**改判为参考事实标记；待远程复审通过后再按当时内容重新核算。
**设计基线批准与整体状态不变**：本模板 `shared_implementation_status`／`reference_page_integration_status`
仍 `IMPLEMENTED_ACCEPTED`、`final_acceptance_status` 仍 `ACCEPTED_BY_PROJECT_OWNER`；
`page_migration_status` 仍 `NOT_STARTED`、`page_migration_authorization_status` 仍 `NOT_GRANTED`。
**实现完成 ≠ 远程代码复审通过 ≠ 项目负责人目测 ≠ 正式验收通过。**

实测（2026-09-29，**模板定向整理任务后复测**，
`LIST-TABLE-VISUAL-TEMPLATE-CLIENT-CONFIG-REFINEMENT-BASELINE-001`）：该任务以已实现、经项目负责人目测认可的
`/config/client` 主列表为参照整理模板并**删除过期示例**，**未**改动 §12 任何规则文本、**未**改判任何标记实例，
但**新增** `DESIGN.md` §5 实测参考事实（`+1`）、`DESIGN.md` §7 最小定向修订草案（`+1`）与本文件 §13 分层契约
（候选未实现标记 `+2`）。复测三条通道：通道 1 四份规范文档 `27 / 0 / 42 / 8`、
通道 2 本文件批准态设计标记 `79`（**不变**）、**通道 3 本文件候选未实现标记 `23`**
（§12 节内 `18` 处、§13 节内 `2` 处、其它说明 `3` 处）——较上段时点值 `23` **净变化 `0`**：
§12.6 两处草案示例改写为**现行接入事实**后迁出 `-2`，本文件 §13 新增 `+2`。
上一段时点值（通道 1 `26 / 0 / 42 / 7`、通道 3 `23`）**保留为历史实测，不回写**。
**边界**：本文件 §13 为**尚待批准**的分层契约草案（`DRAFT_PENDING_USER_REVIEW`），
**不**改变 §12 三点 opt-in 契约、**不**改变任何模板级迁移状态与既有验收结论。

实测（2026-09-29，**模板整理 R1 定向纠错后复测**，
`LIST-TABLE-VISUAL-TEMPLATE-CLIENT-CONFIG-REFINEMENT-BASELINE-001-R1`）：R1 **只**就地修正三处
（§12.7 改写为现行可执行契约、§12.1／§13.2 统一禁用态两级职责、§13.5／`DESIGN.md` §7 改为拟议时序），
并压缩 §0.1／§12 的历史为摘要；**未**新增／删除任何标记实例。复测三条通道：通道 1 四份规范文档
`27 / 0 / 42 / 8`、通道 2 本文件批准态设计标记 `79`、通道 3 本文件候选未实现标记 `23`
（§12 节内 `18` 处、§13 节内 `2` 处、其它说明 `3` 处）**均不变**。
**边界**：§13 可选契约仍为 `DRAFT_PENDING_USER_REVIEW`；第七轮 opt-in 实现状态仍
`IMPLEMENTED_PENDING_CHATGPT_REVIEW`；模板级迁移状态与授权边界**未**翻转。

实测（2026-09-29，**模板整理 R2 标记口径纠正后复测**，
`LIST-TABLE-VISUAL-TEMPLATE-CLIENT-CONFIG-REFINEMENT-BASELINE-001-R2`）：R2 **只**做标记语义纠正——
把 §12 中**已落地／已批准事实**由候选未实现标记改标**参考事实标记**，把**未实现**的禁用态视觉（§12.1）
与**待批准**的 §13 契约保留为候选未实现标记，并删除 `README.md` §8 等处「因待复审仍按候选未实现标记引用」
的推导。复测四条通道：通道 1 四份规范文档 `28 / 0 / 42 / 8`（参考事实 `27 → 28`）；
通道 2 本文件批准态设计标记 `79`（**不变**）；通道 3 本文件参考事实标记 `24`（R2 新增通道）；
通道 4 本文件候选未实现标记 `10`（§12.1 禁用态视觉 `1`、§13 内 `2`、
§0.1／§11.2／§11.3／§12.8 的说明与核验命令 `7`；较 R1 时点 `23` 下降 `13`，因 §12 已落地事实改标）。
**纠正推翻旧纪律**：「因待远程复审故仍按候选未实现标记引用」不再成立——
`IMPLEMENTED_PENDING_CHATGPT_REVIEW` 是**复审状态**，**不**等于 `NOT_IMPLEMENTED`（`README.md` §7.3）。
**边界**：§13 可选契约仍为 `DRAFT_PENDING_USER_REVIEW`；§12.1 禁用态视觉仍属**设计契约、尚未实现、尚未验收**
（`CCFG-AC-157` 仍 `BLOCKED`）；第七轮 opt-in 实现状态仍 `IMPLEMENTED_PENDING_CHATGPT_REVIEW`；
模板级迁移状态与授权边界**未**翻转。**提交与推送成功 ≠ 远程复审通过。**

实测（2026-09-29，**模板整理 R3 定向纠错后复测**，
`LIST-TABLE-VISUAL-TEMPLATE-CLIENT-CONFIG-REFINEMENT-BASELINE-001-R3`）：R3 **只**就地修正两处——
R3-01 §12.1 参考事实段不再声称公共层「已负责」禁用态外观（只指向上一段**待实现设计契约**，并记
现行三点触发器无可观察禁用场景）；R3-02 §12.3 把调整前 `53px`／`CCFG-AC-010` 现行 `BLOCKED` 等
**调整前测量与设计阶段措辞**改为**历史分层**，另立现行盒模型／测量（`9.5px 0`、常规可比行约 `48 CSS px`、
真实 `100%`／`125%` 缩放）与现行验收状态（`CCFG-AC-010` `PASS`、`CCFG-AC-155~157` `BLOCKED`）段，
§12.5 仅作同一时点澄清。复测四条通道：通道 1 四份规范文档 `28 / 0 / 42 / 8`（**不变**，R3 未改四份文档标记）；
通道 2 本文件批准态设计标记 `79`（**不变**）；通道 3 本文件参考事实标记 `24 → 25`
（§12.3 由 `4` 处增为 `5` 处、拆分现行测量与验收状态段，`+1`；该段描述**已落地事实**，属参考事实标记）；
通道 4 本文件候选未实现标记 `10`（**不变**：§12.1 禁用态视觉 `1`、§13 内 `2`、
§0.1／§11.2／§11.3／§12.8 的说明与核验命令 `7`）。
**边界**：§13 可选契约仍为 `DRAFT_PENDING_USER_REVIEW`；§12.1 禁用态视觉仍属**设计契约、尚未实现、尚未验收**
（`CCFG-AC-157` 仍 `BLOCKED`）；`CCFG-AC-010` 现行状态格为 `PASS`（只读核对，R3 未改任何状态格）；
第七轮 opt-in 实现状态仍 `IMPLEMENTED_PENDING_CHATGPT_REVIEW`；模板级迁移状态与授权边界**未**翻转。
**提交与推送成功 ≠ 远程复审通过。**

实测（2026-09-29，**模板整理 R4 焦点环证据表述纠错后复测**，
`LIST-TABLE-VISUAL-TEMPLATE-CLIENT-CONFIG-REFINEMENT-BASELINE-001-R4`）：R4 **只**就地修正一处——
§12.3 的「实测描边四边与四角均落在 `28×28px` 命中区内、外侧无描边像素」是**未经缩放限定的绝对说法**，
与 R1 证据中 **125% 时严格整数盒外 27 个蓝色物理像素**不符；R4 改为**分缩放**陈述（100% 严格盒内、
盒外 `0`；125% 严格判定 `false`、盒外 `27` 且**全部**在左侧紧邻 1 个物理像素列、`ringOutsideMaxDevicePx=1`、
1 物理像素容差判定 `true`），并明确该边缘列由元素左边界落在**半个物理像素**上的**量化归类**造成，
**不是**产品可见的焦点环逸出；四边完整可见、未被 `.cell{overflow: hidden}` 裁切之结论按 R1 报告原文保留。
复测四条通道：通道 1 四份规范文档 `28 / 0 / 42 / 8`（**不变**，R4 未改四份文档标记）；
通道 2 本文件批准态设计标记 `79`（**不变**）；通道 3 本文件参考事实标记 `25`（**不变**，R4 仅改既有参考事实段
内部措辞、未增删标记实例）；通道 4 本文件候选未实现标记 `10`（**不变**）。
**边界**：§13 可选契约仍为 `DRAFT_PENDING_USER_REVIEW`；§12.1 禁用态视觉仍属**设计契约、尚未实现、尚未验收**
（`CCFG-AC-157` 仍 `BLOCKED`）；`CCFG-AC-010` 现行状态格为 `PASS`（只读核对，R4 未改任何状态格）；
第七轮 opt-in 实现状态仍 `IMPLEMENTED_PENDING_CHATGPT_REVIEW`；模板级迁移状态与授权边界**未**翻转。
R4 **未**修改 R3 其它结论（§12.1 职责分层、调整前 `53px` 与现行可比行约 `48 CSS px`、`CCFG-AC-010` 现行 `PASS`、
§13 待批准），**未**重跑浏览器、**未**新增正式验收 PASS。**提交与推送成功 ≠ 远程复审通过。**

实测（2026-09-29，**模板整理批准收口后复测**，
`LIST-TABLE-VISUAL-TEMPLATE-CLIENT-CONFIG-REFINEMENT-BASELINE-APPROVAL-CLOSEOUT-001`）：R4 提交
`aa6285f02c16e6c3806ca2759d21e16b3e0e41b1` 经 ChatGPT 从远程 Git 独立复审结论为 **`APPROVED`**；
项目负责人于 **`2026-09-29`** 在该 R4 修订草案的明确批准语境下回复**「继续」**，授权推进本批准收口。
本次**只做纯文档批准收口**：把参照修正的**设计基线**收口为已批准——`DESIGN.md` §7 最小定向修订由
候选未实现标记改标已批准模板规则、§13 可选契约（§13.3 外观预设与行为边界、§13.4 归属处置）由候选未实现
标记改标本文件批准态设计标记，并据**现行源码核查**把“公共实现尚不存在”标注为参考事实。
复测四条通道（命令实测）：通道 1 四份规范文档 `28 / 0 / 43 / 7`（`DESIGN.md` §7 改标：已批准 `+1`、
候选未实现 `-1`）；通道 2 本文件批准态设计标记 `81`（§13 两处改标，`+2`）；
通道 3 本文件参考事实标记 `26`（§13.3 新增实现状态 `+1`）；通道 4 本文件候选未实现标记 `8`（§13 两处改标，`-2`）。
**边界**：批准**只**覆盖**设计基线**——§13 可选视觉预设的**公共实现仍 `NOT_STARTED`**（公共层未提供该样式，
其他页面**不**自动接入）；§12.1 **禁用态视觉仍属设计契约、尚未实现、尚未验收**（`CCFG-AC-157` 仍 `BLOCKED`）；
§12 三点 opt-in 入口**代码复审状态仍 `IMPLEMENTED_PENDING_CHATGPT_REVIEW`**（**不**因本次 §13 批准而改为已通过）；
`CCFG-AC-010` 现行状态格仍 `PASS`、`CCFG-AC-155~157` 仍 `BLOCKED`（只读核对，本轮**未**改任何状态格）；
`page_migration_status` 仍 `NOT_STARTED`、`page_migration_authorization_status` 仍 `NOT_GRANTED`、
`pilot_page_selection_status` 仍 `NOT_DECIDED`；数据源管理「更多」→三点改造仍属**后续独立任务**。
**批准设计基线 ≠ 公共扩展已实现 ≠ 目测通过 ≠ 正式验收通过 ≠ 批准页面迁移。提交推送成功 ≠ 远程复审通过。**

实测（2026-09-29，**批准收口 R1 计数分层纠错后复测**，
`LIST-TABLE-VISUAL-TEMPLATE-CLIENT-CONFIG-REFINEMENT-BASELINE-APPROVAL-CLOSEOUT-001-R1`）：ChatGPT 对批准收口提交
`925c3a89e6841c760f918805e77a01fba1c960e0` 的远程文档复审为 `CHANGES_REQUIRED`，**唯一**阻塞是**当前计数说明仍混入历史计数**。
R1 **只**做计数分层纠错（不改批准范围、状态决定、代码或样式）：§0.1、§10、§11.1 的**现行**四份规范文档计数由过时的
`26 / 0 / 42 / 7` 更正为**现行** `28 / 0 / 43 / 7` 并指向 `README.md` §7.4；§11.3 的时点快照表标签去“当前”歧义
（改为“2026-09-21 时点”）、末尾“当前规范计数”改为“该时点规范计数”，并新增本节**时点快照**总说明。
四条通道**均未因 R1 增删任何标记实例**，命令实测仍与批准收口后**逐值相同**：通道 1 四份规范文档 `28 / 0 / 43 / 7`、
通道 2 本文件批准态设计标记 `81`、通道 3 本文件参考事实标记 `26`、通道 4 本文件候选未实现标记 `8`。
**边界**：R1 **不**改批准对象与状态——设计基线仍 `2026-09-29` 已批准（依据 R4 `aa6285f…` 远程 `APPROVED` +
负责人在批准语境下回复“继续”）；§13 可选高亮**公共实现仍 `NOT_STARTED`**；§12 三点 opt-in 代码复审状态仍
`IMPLEMENTED_PENDING_CHATGPT_REVIEW`；§12.1 禁用态视觉仍未实现/未验收（`CCFG-AC-157` 仍 `BLOCKED`）；模板级页面迁移状态**未**翻转。
**提交推送成功 ≠ 远程复审通过。**

实测（2026-09-30，**第七轮实现复审状态同步后复测**，
`LIST-TABLE-OPTIONAL-ELLIPSIS-IMPLEMENTATION-REVIEW-STATUS-SYNC-001`）：本任务为**纯文档状态同步与证据留痕**
（**不**改业务定义／前后端代码／共享 CSS／测试／数据库），**只**把 §12 opt-in 扩展的**现行复审进度**由
「已落地、待远程复审」同步为「**代码复审已通过、仍待项目负责人最终接受或正式验收**」：据项目负责人转交的
ChatGPT 远程独立只读代码复审结论 **`APPROVED`**（复审对象为 R0 `d93f838be359d71ef373082a6c3a62046912b1a1`
与 R1 `aa942dc1a4d82d85e6933e8b0977f8736f8c5196`，固定区间
`a042df0…..d93f838…` 与 `d93f838…..aa942dc1…`），把**现行**实现状态由
`IMPLEMENTED_PENDING_CHATGPT_REVIEW` 更新为 **`IMPLEMENTED_PENDING_USER_ACCEPTANCE`**，
并把实现提交时点的复审待办值 `IMPLEMENTED_PENDING_CHATGPT_REVIEW` **保留为历史值**
（`list_table_row_action_opt_in_extension_implementation_submission_status`）。**该复审通过只覆盖 §12
与第七轮行高的代码复审**：**不**表示第七轮 157 条正式验收整体通过、**不**表示 §13 公共可选高亮已实现、
**不**表示 §12.1 禁用态视觉已实现、**不**授权任何页面迁移。复测四条通道：通道 1 四份规范文档
`28 / 0 / 43 / 7`（**不变**，本轮**未**改四份规范文档标记）；通道 2 本文件批准态设计标记 `81`（**不变**）；
通道 3 本文件参考事实标记 `26`（**不变**）；通道 4 本文件候选未实现标记 `8`（**不变**）——
本轮**未**新增／删除任何标记实例，`lt_token_count` 仍 **9**、`lt_internal_helper_class_count` 仍 **2**。
**边界**：§13 可选高亮**公共实现仍 `NOT_STARTED`**；§12.1 禁用态视觉仍属**设计契约、尚未实现、尚未验收**
（`CCFG-AC-157` 仍 `BLOCKED`）；第七轮验收逐条状态**未因代码复审翻转**（`CCFG-AC-010` 仍 `PASS`、
`CCFG-AC-155~157` 仍 `BLOCKED`，统计仍 `PASS 70 / FAIL 0 / BLOCKED 72 / NOT_RUN 15`）；
`page_migration_status` 仍 `NOT_STARTED`、`page_migration_authorization_status` 仍 `NOT_GRANTED`、
`pilot_page_selection_status` 仍 `NOT_DECIDED`；数据源管理「更多」→三点改造仍属**后续独立任务**。
**代码复审通过 ≠ 项目负责人目测接受 ≠ 正式验收通过 ≠ 批准页面迁移。**

## 13. 现行基础规则与可选扩展分层契约（设计基线已批准，`2026-09-29`）

> 本节由纯文档任务 `LIST-TABLE-VISUAL-TEMPLATE-CLIENT-CONFIG-REFINEMENT-BASELINE-001`（`2026-09-29`）整理：
> 以已实现、经项目负责人目测认可的 `/config/client` 主列表为参照，把本模板的**现行公共基础**与
> **探针页特有的可选能力**分层。本节新增的可选契约经 ChatGPT 从远程 Git 对 R4 提交
> `aa6285f02c16e6c3806ca2759d21e16b3e0e41b1` 复审 `APPROVED`、项目负责人于 `2026-09-29` 批准后
> **设计基线已批准**；**不**改变 §0–§12 任何已批准规则与既有状态。
> **批准的是设计基线（可选契约的范围与边界），不是实现**：§13 可选视觉预设的**公共实现**已由独立任务
> `LIST-TABLE-OPTIONAL-SINGLE-ROW-HIGHLIGHT-PUBLIC-IMPLEMENTATION-001`（`2026-09-30`）落地，并经 ChatGPT
> 从远程 Git 对该实现提交的**独立只读代码复审**结论 `APPROVED`（`2026-09-30`），现行状态
> `IMPLEMENTED_PENDING_USER_ACCEPTANCE`（**已实现且远程代码复审通过、尚待项目负责人接受或采用决定**；
> 其实现提交时点值为 `IMPLEMENTED_PENDING_CHATGPT_REVIEW`、批准时点值为 `NOT_STARTED`，均属历史，见 §13.3），
> 其他页面**不**自动接入。

### 13.1 分层原则

1. **公共层**只承担**跨页可复现、无业务语义**的视觉纪律（表头 / 正文 / 边框 / 纵向内边距 / 作用域隔离）；
2. **Feature 层**承担一切**业务语义**（选择语义、状态文案、菜单内容、权限、异常判定、请求时序）；
3. 可选能力一律**显式 opt-in**：未启用的页面**零匹配、零泄漏**（沿用 §3 作用域隔离）；
4. 任一可选能力**不**是使用模板的前提——表格可以只用模板而**完全不**使用行内三点入口或单行固定高亮。

### 13.2 能力契约表

| 能力 | 启用条件 | 公共层负责 | Feature 负责 | 未启用页结果 | 验证证据 |
| --- | --- | --- | --- | --- | --- |
| 表头 / 正文排版、边框、纵向内边距 | 页面表格显式挂根类 `lt-main-table` | 表头 `12px/600/#71717a/0.01em`；`td` 纵向内边距 `12px 0`、`th 11px 0`；边框色 `#f4f4f5` | 列定义、字段语义、是否覆盖 | 零匹配，计算样式与启用前逐值相同 | `list-table-visual.spec.ts` #1–#10；正式验收逐值等价 |
| 行高（内容驱动） | 默认，无需额外声明 | 不固定 `tr` 高度；不裁切 / 不压平内容 | 业务上确有差异时可自行固定（须自担风险） | 各页各行按内容自然撑开 | 两页只读浏览器量测：可比常规行约 `48 CSS px`、歧义行 `52px` |
| 行内三点入口（opt-in） | 页面**显式**挂 `lt-row-action__cell`（操作列 `td`）+ `lt-row-action__ellipsis`（触发器） | **仅**命中区盒模型与交互态外观：`28×28px`、圆角 `6px`、主色、`hover`、`:focus-visible` 内嵌焦点环、`cursor`、操作单元格纵向内边距补偿 `9.5px 0`；**当入口存在可观察禁用状态且页面显式启用该可选样式时**，其**禁用态通用视觉与可访问性呈现**（见下段；现行 CSS **尚未**提供该规则，属设计契约、尚未实现验收） | 菜单内容、启停 / 删除、权限、**是否 / 何时禁用**、异常状态、Popover 定位与请求顺序 | 零匹配（`lt-row-action__*` 计数 `0`），可继续用文字“更多”或无操作列 | `list-table-visual.spec.ts` #11（辅助类集合 = `{lt-row-action__cell, lt-row-action__ellipsis}`）、#13（仅 `ClientConfigPage.vue` 挂载）；第七轮只读证据 |
| 单行固定高亮（opt-in，**已批准可选契约**；公共实现已落地、代码复审通过、现行状态 `IMPLEMENTED_PENDING_USER_ACCEPTANCE`） | 页面**自行选择**该选项时启用（**非**默认）：表级 `.lt-row-highlight`（与根类并列）+ 行级 `.lt-row-highlight__row`（页面行类回调提供） | 仅**可选视觉预设**外观（见 §13.3） | 选择语义、选中 ID 存放、与启停 / 删除联动、请求时序 | 不改变该页现行 `hover`；不出现固定高亮 | `list-table-visual.spec.ts` #14（未 opt-in 零泄漏）、#15（固定压过 hover / `current-row`、左缘仅首格）；隔离真实浏览器夹具层叠核对（无业务数据）；第七轮只读回归（单击固定 / 再点取消 / 点他行转移 / 悬停不改固定，均为 `/config/client` Feature 自身实现）；§13.3 页面接入只读真实浏览器核对（`/config/client` 主列表已显式两级 opt-in、外观由公共预设唯一承担，`/config/data-source` 等其余页面零挂载） |

**禁用态的职责分界（与 §12.1 一致）**：**是否禁用、何时禁用、权限与业务条件由 Feature 决定**；
**当入口存在可观察的禁用状态、且页面显式启用这一可选样式时**，其在**通用视觉与可访问性**上如何呈现
**拟由公共层负责**（**未来设计职责**，**非**现行实现事实）。两级规则**不**并存冲突：Feature 决定“**禁用与否**”，公共层只在该状态**存在且被显式启用**
时决定“**长什么样**”。现行探针端管理的被禁用者是**菜单项**，并非三点触发器本身；
`CCFG-AC-157` 该子项仍缺实际观察、状态仍 `BLOCKED`。**现行 `frontend/src/styles/list-table/list-table-visual.css`
尚未提供禁用态视觉规则**，故该禁用态视觉属**设计契约，尚未实现、尚未验收**——不得声称已实现或已验收；
其实现与验收须由后续独立任务承担，且**不**因此给现行探针三点触发器强造禁用情形。

### 13.3 单行固定高亮可选契约

`LIST_TABLE_SHARED_DESIGN_APPROVED` —— 本节可选契约的**设计基线已批准**（`2026-09-29`，依据 R4 提交
`aa6285f02c16e6c3806ca2759d21e16b3e0e41b1` 的远程复审 `APPROVED` 与项目负责人同日批准），
故本节为**已批准的模板可选规则**；**批准的是设计基线（外观预设与行为边界的范围），不是实现**。

**外观预设（可选，非强制值）**：普通行 `hover` `#f4f4f5`、固定行底 `#e1e4e8`、固定行左缘强调 `#18181b`。
上述取值**取自**探针端管理现行实现，供需要该交互的页面作**可选参考**；模板**不**为未启用页改变其现行 `hover`。

**行为边界（若页面选择启用）**：

- 同时最多**一行**固定；单击固定、再次单击取消、点击他行转移；
- **普通查询**与实际**列表重载**发起时**清空**固定；
- 有启用 / 停用等**行级状态变更**且页面**自行选择**该选项时，成功后**只**对**仍在最新结果中且可见**的该 ID 重选；
- 失败 / 取消**不**凭空改变固定；**不**在跨请求共享变量里保留重选意图，防止过期响应复活；
- 选中 ID 的存放、事件隔离与请求时序属 **Feature 的页面会话状态**，**不**写 URL / 浏览器存储 / 接口 / 数据库；
- 行选择**不**作为启停 / 删除的**前置条件**。

**字段边界**：**不**预设所有表都有 `FG_ACTIVE` 字段；更**不**把“含 `FG_ACTIVE`”当作自动启用该选项的充分条件。

`LIST_TABLE_REFERENCE_FACT` —— **实现状态（据现行源码核查）**：该可选视觉预设的**公共实现已落地**。
`frontend/src/styles/list-table/list-table-visual.css` 除基础表格样式与 §12 的
`lt-row-action__cell`／`lt-row-action__ellipsis` 两条规则外，新增**两级显式 opt-in** 的单行固定高亮外观预设：
表级 `.lt-row-highlight`（须与根类 `.lt-main-table` 并列）+ 行级 `.lt-row-highlight__row`
（由消费页面的行类回调提供，公共层**不**推断哪一行被选）。预设沿用本节已批准字面量：普通行 `hover`
`#f4f4f5`、固定行底 `#e1e4e8`、固定行左缘强调 `#18181b`（`inset 3px 0 0 0`，仅首格）；固定行底色覆盖
**整行每个 `td.el-table__cell`**（含固定右操作列 `td`）；`current-row` 归零与固定行规则**同前导段同特异性**
且归零在前，故同时命中时固定行按源码顺序胜出；取消固定后不残留固定底。公共层**只**决定“被显式标记时如何
显示”，**不**保存选中 ID、**不**监听行点击、**不**实现单击固定 / 再点取消 / 转移、**不**发起查询或启停请求、
**不**接管事件隔离 / 权限 / 删除 / `FG_ACTIVE`。公共组件目录仍无通用行选择组件。现行 `/config/client` 的固定
高亮**选择语义、选中 ID 存放与请求时序**仍属**该 Feature 页面自身**的实现；本次经页面级授权，其**主列表外观**
已改为**显式两级 opt-in** 采用本节公共预设（表级类与根类并列、行级类由页面行类回调提供），页面原有的私有
高亮视觉规则已移除，外观由公共预设**唯一承担**；公共层仍**不**接管该页的选择语义或通用行选择逻辑。

本节状态为**设计基线已批准、公共扩展实现已落地且远程代码复审通过**。据此，§13 可选视觉预设的公共实现状态
由实现提交时点的 `IMPLEMENTED_PENDING_CHATGPT_REVIEW`（**历史值**）更新为
**`IMPLEMENTED_PENDING_USER_ACCEPTANCE`**（已实现且远程代码复审通过、**尚待项目负责人接受或采用决定**）：

```text
list_table_optional_single_row_highlight_status=DESIGN_BASELINE_APPROVED_IMPLEMENTATION_IMPLEMENTED_PENDING_USER_ACCEPTANCE
list_table_optional_single_row_highlight_design_approval_status=APPROVED_BY_PROJECT_OWNER
list_table_optional_single_row_highlight_design_approval_date=2026-09-29
list_table_optional_single_row_highlight_implementation_task=LIST-TABLE-OPTIONAL-SINGLE-ROW-HIGHLIGHT-PUBLIC-IMPLEMENTATION-001
list_table_optional_single_row_highlight_implementation_status=IMPLEMENTED_PENDING_USER_ACCEPTANCE
list_table_optional_single_row_highlight_implementation_submission_status=IMPLEMENTED_PENDING_CHATGPT_REVIEW
list_table_optional_single_row_highlight_implementation_initial_status=NOT_STARTED
list_table_optional_single_row_highlight_code_review_status=APPROVED
list_table_optional_single_row_highlight_code_review_date=2026-09-30
list_table_optional_single_row_highlight_code_review_source=CHATGPT_REMOTE_INDEPENDENT_CODE_REVIEW_RELAYED_BY_PROJECT_OWNER
list_table_optional_single_row_highlight_code_review_range=5fa0edd6d6dc13868a085e15c54db0c48f69a763..f35fb5a91fa872402d23a0ce2656a3d3719aa157
list_table_optional_single_row_highlight_page_integration_status=PARTIAL_CLIENT_CONFIG_MAIN_LIST_ONLY_ADOPTED_REVIEW_APPROVED_OWNER_FEEDBACK_OK_PENDING_FORMAL_ACCEPTANCE
list_table_optional_single_row_highlight_page_integration_submission_status=PARTIAL_CLIENT_CONFIG_MAIN_LIST_ONLY_ADOPTED_PENDING_CHATGPT_REVIEW_AND_OWNER_VISUAL_CHECK
list_table_optional_single_row_highlight_page_integration_code_review_status=APPROVED
list_table_optional_single_row_highlight_page_integration_code_review_date=2026-09-30
list_table_optional_single_row_highlight_page_integration_code_review_source=CHATGPT_REMOTE_INDEPENDENT_CODE_REVIEW_RELAYED_BY_PROJECT_OWNER
list_table_optional_single_row_highlight_page_integration_code_review_range=ebf34d970d720aa124dc7a1ea94ba811dcf21584..5cb8079167df82531bd7c02da301def5140e635a
list_table_optional_single_row_highlight_page_integration_owner_feedback_status=OWNER_REPORTED_ACTUAL_PAGE_OPERATION_OK
list_table_optional_single_row_highlight_page_integration_owner_feedback_date=2026-09-30
list_table_optional_single_row_highlight_page_integration_formal_acceptance_status=NOT_RUN
list_table_optional_single_row_highlight_page_integration_task=CLIENT-CONFIG-OPTIONAL-ROW-HIGHLIGHT-PUBLIC-PRESET-ADOPTION-001
lt_token_count=9
lt_internal_helper_class_count=4
```

**该实现完成 ≠ 已目测接受 ≠ 任何页面已迁移 ≠ 已正式验收**（远程代码复审已通过，仅此一项已翻转）。页面接入层面：
经项目负责人**页面级**授权，**仅** `/config/client`（探针端管理）**主列表**采用本节公共预设（弹窗内列表**不**接入）。
其**接入代码**已经 ChatGPT 从远程 Git 对固定区间
`ebf34d970d720aa124dc7a1ea94ba811dcf21584..5cb8079167df82531bd7c02da301def5140e635a` 做**独立只读代码复审**、
结论 **`APPROVED`**（复审时点 **2026-09-30**），项目负责人亦于 2026-09-30 运行实际页面后反馈
「**我试了，页面功能没问题**」——**仅**记录为**本次接入后实际页面人工操作无问题**的反馈，**不**推断负责人已逐项测试、
已批准模板级页面迁移或已对 157 条验收作整体接受决定。据此页面接入**现行分层状态**为
`PARTIAL_CLIENT_CONFIG_MAIN_LIST_ONLY_ADOPTED_REVIEW_APPROVED_OWNER_FEEDBACK_OK_PENDING_FORMAL_ACCEPTANCE`
（已接入、接入代码远程复审 `APPROVED`、负责人已反馈页面操作无问题、**仍待正式验收**；其提交时点值
`..._PENDING_CHATGPT_REVIEW_AND_OWNER_VISUAL_CHECK` 保留为 `..._page_integration_submission_status` **历史值**）。
注意区分两层：**§13 公共实现**与**本次 `/config/client` 主列表接入**各自的一次复审**均已 `APPROVED`**，但两者
**都**只是代码复审结论，**均不等于**项目负责人最终接受或正式验收通过。
**其余任何页面**（含 `/config/data-source`）**未被授权**接入，仍零挂载。本次**未**修改
`DataSourcePage.vue`，**未**改 §12.1 禁用态视觉（仍属设计契约、尚未实现、尚未验收），
也**未**改变模板级迁移状态（`page_migration_status=NOT_STARTED` 等）与模板级 `current_next_entry`。
**页面接入及其代码复审通过 ≠ 正式验收通过；本 Feature 157 条验收状态格未被本任务翻转。**

### 13.4 其余探针页特征的归属

`LIST_TABLE_SHARED_DESIGN_APPROVED` —— 经批准，逐项处置如下：

- **ID 字重 / 等宽强调、状态标签、`+N`、固定操作列、异常提示、双击编辑**：**未**获得“无需探针业务语义且有跨页证据”的支撑，
  **继续归 Feature**，**不**新增到公共基础或可选预设；
- **不**因本任务创建任何新的**共享 Vue 组件**，**不**把**弹窗字段布局**写入表格模板（沿用 §3.4 `introduces_vue_wrapper_component=NO`）。

### 13.5 与既有规则的关系

- **现行已批准规则仍有效**：`DESIGN.md` §7 的“业务语义不得公共化”——**业务语义与 `hover` / 选中态
  不得未经评估就公共化**的纪律**仍然有效**，本节**不**推翻它；
- **已生效的定向修订（`2026-09-29` 批准）**：R0／R1 提出的、把与业务语义**解耦**的**固定高亮视觉**
  列为**显式 opt-in** 的可选视觉预设，即 `DESIGN.md` §7 的**最小定向修订**，经 ChatGPT 从远程 Git 对
  R4 提交 `aa6285f…` 复审 `APPROVED`、项目负责人于 `2026-09-29` 批准后**已生效**：`DESIGN.md` §7
  上列两行的禁令范围**已收窄**为“业务语义不公共化”，**不**排除该可选视觉预设。**收窄的是设计基线**；
  其公共实现已由独立任务（`2026-09-30`）落地、并经远程代码复审 `APPROVED`，现行状态
  `IMPLEMENTED_PENDING_USER_ACCEPTANCE`（见 §13.3）；
  获批前的“拟议 / 尚待批准”表述保留在既有历史报告，**不**回写；
- 本节**不**改变 §12 三点 opt-in 契约，仅将其纳入统一分层契约表；
- 本节**不**改变任何模板级迁移状态（`page_migration_status=NOT_STARTED` 等）与既有验收结论；
- 本节**不**改动 `docs/features/client-config/**`、`docs/features/data-source-management/**`、任何历史报告、
  `docs/prompts/**`、代码 / 测试 / 共享 CSS、`CLAUDE.md` 或配置。
