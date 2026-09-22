# 列表表格视觉模板 · 已批准基线

```text
list_table_visual_template_document_status=APPROVED
list_table_visual_template_design_status=BASELINE_APPROVED
chatgpt_remote_r1_review_status=REVIEW_PASS
blocking_finding_count=0
project_owner_approval_status=APPROVED
project_owner_approval_date=2026-09-21
approval_scope=BASELINE_CONTENT_ONLY
approved_baseline_source_commit=575379895c4c57fd3df7e0d0ce27c1f6841d2f17
shared_implementation_design_status=APPROVED
shared_implementation_design_approval_status=APPROVED
shared_implementation_status=IMPLEMENTED_ACCEPTED
reference_page_name=数据源管理
reference_page_path=/config/data-source
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
current_next_entry=NONE_SHARED_IMPLEMENTATION_FINAL_ACCEPTED_AND_CLOSED_NO_PAGE_MIGRATION_AUTHORIZED
final_acceptance_scope=SHARED_IMPLEMENTATION_AND_DATA_SOURCE_REFERENCE_PAGE_INTEGRATION_ONLY
```

```text
task_code=LIST-TABLE-VISUAL-TEMPLATE-BASELINE-001
task_type=DOCS_ONLY_PROJECT_BASELINE_DRAFT
branch=develop
base_commit_id=10b1d3e39d03dbb78ea409d486f1f3e80c12fc3e
reference_page=数据源管理
reference_route=/config/data-source
new_baseline_path=docs/baseline/list-table-visual-template/
```

批准证据链：

```text
R0 基线提交=52207283660a1aa76e5cd7a2b303ed5c97e9f32f
R1 定向修订提交=575379895c4c57fd3df7e0d0ce27c1f6841d2f17
ChatGPT 远程 R1 复审=REVIEW_PASS
blocking_finding_count=0
项目负责人批准日期=2026-09-21
批准范围=BASELINE_CONTENT_ONLY
批准收口任务=LIST-TABLE-VISUAL-TEMPLATE-BASELINE-APPROVAL-CLOSEOUT-001
```

> 本目录由**纯文档任务** `LIST-TABLE-VISUAL-TEMPLATE-BASELINE-001` 建立，
> 经 R1 定向修订与 ChatGPT 远程 Git 复审后，由**项目负责人**批准。
> 上述建立与修订任务**未创建任何 CSS、Vue 组件、Composable、TypeScript 类型或路由元数据**，
> **未修改** `frontend/**`、`backend/**`、测试代码、配置、依赖或锁文件，
> **未修改**数据源管理页面或任何其他页面，
> **未运行**测试、构建、浏览器或任何服务，
> **未访问**数据库 / ZooKeeper / Kafka / 业务源库 / 目标库。
>
> `list_table_visual_template_document_status=APPROVED` **只表示**本目录的
> **模板基线内容已批准**（`approval_scope=BASELINE_CONTENT_ONLY`）。
>
> **批准基线 ≠ 批准详细设计 ≠ 批准实现 ≠ 批准参考页接入 ≠ 批准页面迁移**：
> `shared_implementation_design_status` 已由独立批准收口任务推进为 `APPROVED`
> （`shared_implementation_design_approval_status=APPROVED`，
> `approval_scope=SHARED_IMPLEMENTATION_DETAILED_DESIGN_ONLY`）——
> 该值**只**表示**公共实现详细设计文档已获批准**。
>
> `shared_implementation_status` 与 `reference_page_integration_status` 已由独立实施任务
> `LIST-TABLE-VISUAL-TEMPLATE-SHARED-IMPLEMENTATION-AND-DATA-SOURCE-REFERENCE-INTEGRATION-001`
> 落地，经项目负责人于 2026-09-22 目测通过（`project_owner_visual_review_status=PASS`，
> 页面入口 `http://192.168.174.70:5173/config/data-source`），并由独立正式验收任务
> `LIST-TABLE-VISUAL-TEMPLATE-SHARED-IMPLEMENTATION-FORMAL-ACCEPTANCE-001` 完成**本地正式验收**
> （`formal_acceptance_execution_status=EXECUTED_PASSED_LOCAL`，14/14 PASS，
> `fail=0 / blocked=0 / not_run=0`），再由独立收口任务
> `LIST-TABLE-VISUAL-TEMPLATE-SHARED-IMPLEMENTATION-FINAL-ACCEPTANCE-CLOSEOUT-001`
> 记录 ChatGPT 对正式验收提交
> `8501416e750c7eb8547c7f922b1bed3545c7cb17` 的复审结论
> （`REVIEW_PASS`、`blocking_finding_count=0`），项目负责人于 2026-09-22
> **最终接受并关闭**该实现。因此 `shared_implementation_status` /
> `reference_page_integration_status` 当前为 `IMPLEMENTED_ACCEPTED`，
> `final_acceptance_status` 为 `ACCEPTED_BY_PROJECT_OWNER`，
> `shared_implementation_completion_status=COMPLETED`，
> `pending_project_owner_acceptance=NO`。
>
> **本次最终接受范围仅限**「列表表格视觉模板**公共实现** + 数据源管理**参考页等价接入**」
> （`final_acceptance_scope=SHARED_IMPLEMENTATION_AND_DATA_SOURCE_REFERENCE_PAGE_INTEGRATION_ONLY`）；
> 本次接受**不代表**批准探针端管理、数据订阅或任何其他业务页面迁移。
> `page_migration_status` 保持 `NOT_STARTED`，
> `page_migration_authorization_status` 保持 `NOT_GRANTED`；
> 任何页面迁移仍须**独立评估、独立授权、独立实施和验收**。
> `PAGE_MIGRATION_STARTED` 等词**仅用于否定性边界说明**。
>
> 批准证据链（详细设计）：
>
> ```text
> R0 设计提交=d7ae5af54e62bba20373681f9f55fc7fb67f39a7
> R1 定向修订提交=f8d84657e939a4b02316457b543976a847b0775b
> R2 定向修订提交=e72264de14a9483aae5593435f818ea65c5116e0
> ChatGPT 远程 R2 复审=REVIEW_PASS
> blocking_finding_count=0
> 项目负责人详细设计批准日期=2026-09-21
> 详细设计批准范围=SHARED_IMPLEMENTATION_DETAILED_DESIGN_ONLY
> 批准收口任务=LIST-TABLE-VISUAL-TEMPLATE-SHARED-IMPLEMENTATION-DESIGN-APPROVAL-CLOSEOUT-001
> ```
>
> **未经项目负责人后续再次明确批准，不得修改任何代码。**

## 1. 本模板的目标

`LIST_TABLE_TEMPLATE_APPROVED` —— 本模板要回答的问题：一个页面的**主列表表格**
（表头、正文、间距、边框、行高策略、长文本与扩展边界）应当遵循什么**项目级视觉与结构纪律**，
使得多个页面的主列表在视觉上收敛，同时**不**剥夺业务页面自己的列定义、状态语义与交互。

本模板**不是**另一套完整页面模板。它只覆盖“表格”这一层，**不**覆盖页面标题、查询区、
结果区外壳、刷新工具栏与请求交互——那些属于 `query-list-page-template`（见 §5）。

## 2. 适用范围

`LIST_TABLE_TEMPLATE_APPROVED`：

- 适用对象：**页面的主列表表格**——即页面结果区中承载该页面主要业务记录集的
  那一张 `el-table`；
- 主要参考实现：**数据源管理主列表**（`/config/data-source`，
  `frontend/src/views/data-source/DataSourcePage.vue`）；
- 适用前提：该主列表是页面的**记录浏览主体**，而不是弹窗内的临时编辑表、
  详情页的子表、确认对话框表格或大屏/复合视图内的嵌表。

## 3. 不适用范围

`LIST_TABLE_TEMPLATE_APPROVED`——以下**不在**本模板自动覆盖范围内：

- **弹窗内表格**（新建/编辑弹窗、命名策略弹窗等）；
- **详情子表**（详情页中随主记录展开的从属表格）；
- **确认表格**（保存/删除前展示待变更项的确认清单）；
- **大屏/复合视图**（看板卡片内嵌表、多客户端卡片列表等）；
- **非 `el-table` 的展示型列表**。

以上形态如需纳入，必须**逐项独立评估**并**独立授权**，不得由本模板自动扩张覆盖。

`LIST_TABLE_TEMPLATE_APPROVED`——本模板**明确不**规定：

- 页面标题、查询区、结果区外壳、刷新工具栏、请求交互（属 `query-list-page-template`）；
- 业务列的名称、数量、顺序、列宽与 `min-width`；
- 数据获取、loading/错误处理、分页策略；
- 行操作按钮、固定列的取舍；
- 状态标签的配色与文案；
- **序号列**（是否存在、列宽、编号算法、对齐、字号、颜色、等宽数字）；
- **空态**（文案、层级、是否区分“无数据”与“查询无结果”）。

## 4. 主要参考实现

`LIST_TABLE_REFERENCE_FACT` —— 本模板以**数据源管理主列表**为主要参考实现。

```text
reference_page=数据源管理
reference_route=/config/data-source
reference_file=frontend/src/views/data-source/DataSourcePage.vue
reference_table_class=.data-table
```

参考实现当前事实的完整清单见 `UI.md` §1。参考实现是**事实来源**，
**不是**强制规范：本模板从参考实现中**提取**可复用的视觉纪律（见 `UI.md` §2），
其余部分**必须保留**为数据源管理 Feature 专属（见 `UI.md` §3）。

`LIST_TABLE_REFERENCE_FACT` —— 参考实现的事实**只在基准提交
`10b1d3e39d03dbb78ea409d486f1f3e80c12fc3e` 的真实源码中核验**，
不依据旧提示词、不依据记忆、不依据 Element Plus 默认印象。

## 5. 与查询列表页模板的关系

`LIST_TABLE_TEMPLATE_APPROVED` —— 本模板与 `query-list-page-template`（qlpt）是
**正交、可组合的两层能力**，**不是**彼此的替代或子集：

| 层 | 目录 | 职责 |
| --- | --- | --- |
| 页面模板层 | `docs/baseline/query-list-page-template/` | 页面标题、查询区、结果区外壳、刷新工具栏、请求交互 |
| 表格视觉模板层 | 本目录 | 列表主表的表头、正文、间距、边框、行高策略、长文本与扩展边界 |

- 两层**正交**：一个页面可以只适用其中一层，也可以两层都适用；
- 两层**可组合**：页面按**独立评估结果**决定是否组合使用两种模板；
- 本模板**不并入** `query-list-page-template`，也**不**改写其已批准规范；
  qlpt 明确把自己的适用范围限定为**只读查询列表页**，本模板不扩大其范围；
- 本模板**不**抽取 qlpt 已有的页面壳层/查询区/结果区/刷新工具栏能力，
  也**不**重复定义它们；
- 与 qlpt 的交叉引用仅在对方 `README.md` / `MIGRATION.md` 中以**最小、追加式、
  非规范重写**方式建立，且**未**改变其冻结标记计数（见 `MIGRATION.md` §5）。

## 6. 覆盖边界：只覆盖页面主列表表格

`LIST_TABLE_TEMPLATE_APPROVED` —— 本模板的作用对象**只有页面主列表表格**。

仓库内全部 `el-table` 使用点的盘点矩阵见 `MIGRATION.md`。矩阵中的**非主列表表格**
（弹窗表格、详情子表、确认表、大屏/复合表）被显式归入
`EXCLUDED_NON_MAIN_TABLE` 或 `NEEDS_SEPARATE_EVALUATION`，
**不**由本模板自动覆盖。

## 7. 事实分层与标记（批准态）

`LIST_TABLE_TEMPLATE_APPROVED` —— 本目录的**规范性文档**（`README.md` / `DESIGN.md` /
`UI.md` / `MIGRATION.md`）当前使用**三个**标记，彼此**不重叠**，任何一处措辞必须能
对应到其中一类。

### 7.1 `LIST_TABLE_REFERENCE_FACT`

含义：**参考实现当前事实**——只能在基准提交
`10b1d3e39d03dbb78ea409d486f1f3e80c12fc3e` 的真实源码中直接验证的内容。

**不得**把参考事实写成模板规范。该标记的语义在批准前后**不变**。

### 7.2 `LIST_TABLE_TEMPLATE_APPROVED`

含义：**已批准的模板规则**——本目录四份规范性文档中的**当前有效规则**。

这些规则经 ChatGPT 远程 Git R1 复审（`REVIEW_PASS`、`blocking_finding_count=0`），
并由项目负责人于 2026-09-21 批准（`approval_scope=BASELINE_CONTENT_ONLY`），
**作为后续公共实现详细设计必须遵守的基线**。

`LIST_TABLE_TEMPLATE_APPROVED` —— 批准的是**基线规则**，**不是**实现方案：

- `DESIGN.md` §8 的候选实现方案在**本基线任务当时**未定案（见该节 §8.5）；
  其唯一技术结论由**独立详细设计** `SHARED_COMPONENT_DESIGN.md` 作出：
  候选 §8.4 组合方式（显式根类 CSS 预设 + 有限 CSS 自定义属性令牌）**唯一采纳**，
  §8.1 / §8.2 **部分采纳**为其两半，§8.3 **被否决**；
  该结论已经 ChatGPT 远程 R2 复审 `REVIEW_PASS` 与项目负责人批准
  （`approval_scope=SHARED_IMPLEMENTATION_DETAILED_DESIGN_ONLY`，见 §8、§9），
  并已由独立实施任务**落地**、经项目负责人于 2026-09-22 目测通过、通过本地正式验收，
  并由项目负责人于 2026-09-22 **最终接受并关闭**
  （`formal_acceptance_execution_status=EXECUTED_PASSED_LOCAL`，
  `shared_implementation_status=IMPLEMENTED_ACCEPTED`）；
- 公共实现详细设计**已批准**（`shared_implementation_design_status=APPROVED`，
  `..._approval_status=APPROVED`）；公共实现已按该设计落地、通过本地正式验收并经项目负责人最终接受
  （`shared_implementation_status=IMPLEMENTED_ACCEPTED`，
  `final_acceptance_status=ACCEPTED_BY_PROJECT_OWNER`）；
- 数据源管理**主列表**已作为参考页接入公共实现并经项目负责人最终接受
  （`reference_page_integration_status=IMPLEMENTED_ACCEPTED`）；
- **没有任何**业务页面获得迁移授权（`NOT_GRANTED`）。

规则批准**不等于**通过正式验收，**正式验收通过（本地）也不等于**项目负责人最终接受；
本目录所记录的最终接受，范围**仅限**公共实现与数据源管理参考页等价接入，
**不**包含探针端管理、数据订阅或任何其他业务页面迁移。

### 7.3 `LIST_TABLE_PROPOSED_NOT_IMPLEMENTED`

含义：**未被采纳、尚未实现的候选**，以及**未来尚未执行的任务 / 建议**。
例如：`DESIGN.md` §8 中被**否决**的候选（§8.3 Vue 轻包装组件）、
未来逐页迁移的评估事项（见 `MIGRATION.md`）。

**已采纳并已落地**的实现事实**必须**使用**参考事实标记**（见 §7.1），
**不得**再被笼统归入本标记，具体包括：

- `DESIGN.md` §8 中**部分采纳**并作为组合方案落地的 §8.1、§8.2；
- **唯一采纳且已实现**的 §8.4 组合方式；
- 公共目录布局与令牌命名（已由详细设计确定并由实现任务落地）。

**不得**把候选实现写成已实现（`IMPLEMENTED`），也**不得**把候选实现方案
写成已批准的实现设计。

> 阅读约定：凡描述当前**真实源码、已批准选择结果与已落地实现事实**的内容
> 必须标注 `LIST_TABLE_REFERENCE_FACT`；
> 凡描述当前已批准模板规则的必须标注 `LIST_TABLE_TEMPLATE_APPROVED`；
> 凡描述**未被采纳 / 尚未实现**的候选，或未来尚未执行的任务与建议，
> 必须标注 `LIST_TABLE_PROPOSED_NOT_IMPLEMENTED`。

### 7.4 标记计数：规范正文与历史报告分层

`LIST_TABLE_TEMPLATE_APPROVED` —— 批准收口后，标记计数必须**分层**解释，
**不得**再把“整个目录中出现的草案态字面量数量”当作“当前规范仍处于草案”的判断依据：

- **当前规范性文档**（四份，见 §8 导航）：使用批准态规则标记；
- **历史报告**（`reports/LIST-TABLE-VISUAL-TEMPLATE-BASELINE-001.md`、
  `reports/LIST-TABLE-VISUAL-TEMPLATE-BASELINE-001-R1.md`）：
  保留其产生时的**草案态规则标记**与 `DRAFT_PENDING_USER_REVIEW` /
  `BASELINE_DRAFT_ONLY` 等历史状态值；这些只代表**当时阶段**的真实状态，
  **不参与**当前规范状态判断，且**不得**修改历史报告来消除这些标记。

当前规范性文档计数（**实现落地后复算**，见 §11 的 R2 变更记录）：

| 标记 | 批准前 | 批准收口时 | 当前（实现落地后） |
| --- | --- | --- | --- |
| `LIST_TABLE_REFERENCE_FACT` | 22 | 22 | 26 |
| `LIST_TABLE_TEMPLATE_APPROVED` | 0 | 42 | 42 |
| `LIST_TABLE_PROPOSED_NOT_IMPLEMENTED` | 11 | 11 | 7 |

当前口径变更来源（`22 / 0 / 42 / 11` → `26 / 0 / 42 / 7`）：
参考事实标记 `+4`（22→26）、候选未实现标记 `-4`（11→7），
已批准模板规则标记与草案态标记均不变（42 / 0）。

`+4 / -4` 来自 `DESIGN.md` 中**四处**原本承担“已采纳候选 / 已决策技术形态”内容、
却仍被标为候选未实现的段落，改为标注**参考事实标记**
（文档导语、§4、§8 总导语、§8.5 对比小结），**不是**靠重复或堆叠标记凑数。

草案态规则标记在**规范正文**中计数为 `0`：该字面量只保留在历史报告中。

核验命令（只统计四份规范性文档，在仓库根执行）：

```bash
core_docs=(
  docs/baseline/list-table-visual-template/README.md
  docs/baseline/list-table-visual-template/DESIGN.md
  docs/baseline/list-table-visual-template/UI.md
  docs/baseline/list-table-visual-template/MIGRATION.md
)

for m in \
  LIST_TABLE_REFERENCE_FACT \
  LIST_TABLE_TEMPLATE_APPROVED \
  LIST_TABLE_PROPOSED_NOT_IMPLEMENTED
do
  printf "%-38s %s\n" "$m" "$(grep -ohF "$m" "${core_docs[@]}" | wc -l)"
done

# 草案态规则标记在规范正文中应清零；用字符串拼接写出，避免该字面量本身出现在规范正文
draft_marker="LIST_TABLE_TEMPLATE_""DRAFT"
grep -ohF "$draft_marker" "${core_docs[@]}" | wc -l   # 期望 0
```

本目录标记与 `query-list-page-template` 的冻结计数**互不影响**：
两套标记字面量前缀不同、目录不同，**不共享**计数。

## 8. 文档导航

| 文件 | 内容 |
| --- | --- |
| `README.md` | 本文件：状态、目标、范围、参考实现、与 qlpt 的关系、标记分层、导航与变更记录 |
| `DESIGN.md` | 模板职责与 Feature 保留职责、启用与作用域隔离、行高与长文本策略、候选实现方案对比（**基线任务当时不定案**；下游已选 §8.4 并已落地，**目测已通过并通过本地正式验收**） |
| `UI.md` | 参考实现主表当前事实、可提升为已批准模板规则的视觉内容、必须保留为 Feature 专属的内容 |
| `MIGRATION.md` | 全量 `el-table` 使用点盘点矩阵、候选分类、逐页独立评估与授权要求 |
| `SHARED_COMPONENT_DESIGN.md` | **公共实现详细设计（已批准）**：四个候选的唯一结论、公共契约、Feature 保护项、参考页等价接入清单、验证与回滚设计（`approval_scope=SHARED_IMPLEMENTATION_DETAILED_DESIGN_ONLY`；**批准的是设计文档**，该设计随后已由独立实施任务落地，**目测已通过**，**本地正式验收已通过，并已由项目负责人最终接受**） |
| `reports/LIST-TABLE-VISUAL-TEMPLATE-BASELINE-001.md` | R0 建立任务的执行报告与校验证据（**历史报告，保留草案态标记，不修改**） |
| `reports/LIST-TABLE-VISUAL-TEMPLATE-BASELINE-001-R1.md` | R1 定向修订执行报告（**历史报告，保留草案态标记，不修改**） |
| `reports/LIST-TABLE-VISUAL-TEMPLATE-BASELINE-APPROVAL-CLOSEOUT-001.md` | 基线内容批准收口报告（历史执行报告，不修改） |
| `reports/LIST-TABLE-VISUAL-TEMPLATE-SHARED-IMPLEMENTATION-DESIGN-001.md` | 详细设计任务（R0）执行报告（**历史报告，保留当时草案态，不修改**） |
| `reports/LIST-TABLE-VISUAL-TEMPLATE-SHARED-IMPLEMENTATION-DESIGN-001-R1.md` | 详细设计 R1 定向修订执行报告（**历史报告，不修改**） |
| `reports/LIST-TABLE-VISUAL-TEMPLATE-SHARED-IMPLEMENTATION-DESIGN-001-R2.md` | 详细设计 R2 定向修订执行报告（**历史报告，不修改**） |
| `reports/LIST-TABLE-VISUAL-TEMPLATE-SHARED-IMPLEMENTATION-DESIGN-APPROVAL-CLOSEOUT-001.md` | 详细设计批准收口报告（历史执行报告，不修改） |
| `reports/LIST-TABLE-VISUAL-TEMPLATE-SHARED-IMPLEMENTATION-AND-DATA-SOURCE-REFERENCE-INTEGRATION-001.md` | 公共实现与数据源管理参考页等价接入执行报告（**历史执行报告，不修改**；其记录的状态为当时的 `IMPLEMENTED_PENDING_USER_REVIEW`） |
| `reports/LIST-TABLE-VISUAL-TEMPLATE-SHARED-IMPLEMENTATION-VISUAL-REVIEW-CLOSEOUT-001.md` | 项目负责人目测通过收口报告（历史执行报告，不修改） |
| `reports/LIST-TABLE-VISUAL-TEMPLATE-SHARED-IMPLEMENTATION-FORMAL-ACCEPTANCE-001.md` | 公共实现与参考页接入**正式验收**执行报告（历史执行报告，不修改；其记录的状态为当时的 `IMPLEMENTED_PENDING_FINAL_ACCEPTANCE`，`EXECUTED_PASSED_LOCAL`，14/14 PASS） |
| `reports/LIST-TABLE-VISUAL-TEMPLATE-SHARED-IMPLEMENTATION-FINAL-ACCEPTANCE-CLOSEOUT-001.md` | **最终验收收口报告**（本任务产出，纯文档）：记录 ChatGPT 对正式验收提交 `8501416e750c7eb8547c7f922b1bed3545c7cb17` 的复审结论 `REVIEW_PASS`、`blocking_finding_count=0` 与项目负责人最终接受决定 |
| `reports/evidence/LIST-TABLE-VISUAL-TEMPLATE-SHARED-IMPLEMENTATION-AND-DATA-SOURCE-REFERENCE-INTEGRATION-001/` | 实现任务等价验证的真实浏览器证据与可复现脚本（`browser/*.json` + `scripts/*.mjs`，历史证据，不修改） |
| `evidence/LIST-TABLE-VISUAL-TEMPLATE-SHARED-IMPLEMENTATION-FORMAL-ACCEPTANCE-001/` | 本次正式验收的证据（`00`–`10`，含逐值等价、fallback/覆盖、负向矩阵、反向控制、隔离回滚） |

`SHARED_COMPONENT_DESIGN.md` 是**已批准的详细设计**：

- 其状态为 `shared_implementation_design_status=APPROVED` /
  `shared_implementation_design_approval_status=APPROVED`；
  该设计的代码已由独立实施任务落地，项目负责人已于 2026-09-22 目测通过，
  通过独立正式验收任务的本地正式验收，并由项目负责人于 2026-09-22 **最终接受并关闭**，
  当前 `shared_implementation_status=IMPLEMENTED_ACCEPTED`，
  `final_acceptance_status=ACCEPTED_BY_PROJECT_OWNER`；
- 该文件沿用仓库既有文件名习惯，但其内容**不是**组件设计——
  唯一结论是一个 **CSS 样式预设 + 有限 CSS 自定义属性令牌**的方案
  （不引入 Vue 包装组件、不新增 DOM 层），准确术语以该文件 §0.1 / §3.2 为准；
- 该文件使用**独立**的设计决策标记（批准态），其计数**不**计入本 README §7.4
  的四份规范文档口径，也**不**包含本文件的草案态规则标记；
- 该设计的**实现**已由后续独立实施任务承担并落地
  （`LIST-TABLE-VISUAL-TEMPLATE-SHARED-IMPLEMENTATION-AND-DATA-SOURCE-REFERENCE-INTEGRATION-001`，
  见 §11 变更记录），目测已通过，通过独立正式验收任务的本地正式验收，
  并已由项目负责人于 2026-09-22 最终接受，当前状态为 `IMPLEMENTED_ACCEPTED`；
  后续任何**代码修改**仍**未经项目负责人再次明确批准不得进行**。

## 9. 后续阶段与授权边界

`LIST_TABLE_TEMPLATE_APPROVED` —— 阶段路径及其当前状态：

| # | 阶段 | 当前状态 |
| --- | --- | --- |
| 1 | ChatGPT 远程 Git 基线复审 | 已完成（R1 复审结论 `REVIEW_PASS`，`blocking_finding_count=0`） |
| 2 | 项目负责人批准基线内容 | 已完成（2026-09-21，`approval_scope=BASELINE_CONTENT_ONLY`） |
| 3 | 公共实现**详细设计**（`SHARED_COMPONENT_DESIGN.md`）与批准 | **已完成**（ChatGPT 远程 R2 复审 `REVIEW_PASS`、`blocking_finding_count=0`；项目负责人于 2026-09-21 批准，`approval_scope=SHARED_IMPLEMENTATION_DETAILED_DESIGN_ONLY`） |
| 4 | 公共实现与数据源管理参考页**等价接入**及**项目负责人目测** | **已实现且目测通过（2026-09-22）**（`project_owner_visual_review_status=PASS`） |
| 5 | 公共实现**正式验收**与最终接受 | **已完成**（本地正式验收 14/14 PASS，`EXECUTED_PASSED_LOCAL`；ChatGPT 远程复审 `REVIEW_PASS`、`blocking_finding_count=0`；项目负责人于 2026-09-22 最终接受并关闭，`final_acceptance_status=ACCEPTED_BY_PROJECT_OWNER`） |
| 6 | 从 `MIGRATION.md` 矩阵中**逐页选择**并**单独授权**迁移 | **未授权**（`page_migration_authorization_status=NOT_GRANTED`） |

第 1、2、3 步完成**只**意味着**模板基线内容**与**详细设计文档**已批准；
第 4 步的产出是**已落地且目测通过的实现与等价验证证据**；
第 5 步的**正式验收**已由独立任务在本地执行并通过，**最终接受已由项目负责人作出**；
第 6 步**未授权**，**不得**把上述不同层级合并成模糊的“已完成”。
**批准详细设计 ≠ 批准实现 ≠ 目测通过 ≠ 通过正式验收（本地） ≠ 项目负责人最终接受 ≠ 批准页面迁移。**

当前唯一下一入口：

```text
next_step=NONE_SHARED_IMPLEMENTATION_FINAL_ACCEPTED_AND_CLOSED_NO_PAGE_MIGRATION_AUTHORIZED
```

`LIST_TABLE_PROPOSED_NOT_IMPLEMENTED` —— 公共实现最终接受后**没有**自动开启的后续任务；
未来如要迁移页面，**必须**另立提示词并获得项目负责人单独授权，
**未经项目负责人再次明确批准不得修改任何代码**，也**不得**选择或迁移其他业务页面。

`LIST_TABLE_TEMPLATE_APPROVED` —— 授权边界：在**项目负责人明确授权之前**，
**不得**实施迁移、**不得**更新任何页面的迁移状态、**不得**为任何具体页面
（包括探针端管理、数据订阅）预先生成实施任务。
本次最终接受**不代表**批准探针端管理、数据订阅或其他任何业务页面迁移。
`MIGRATION.md` 的候选优先级**不等于**项目负责人批准的迁移顺序；
未来实际迁移页面**可能多于两个**。

## 10. 使用本模板的注意事项

- 本模板的**基线规则已批准**，可作为新建或调整页面主列表时的**评估依据**；
- **规则批准 ≠ 实现通过验收**：公共实现已落地并经 Agent 侧等价验证、项目负责人目测通过、
  本地正式验收通过，并已由项目负责人最终接受，状态为 `IMPLEMENTED_ACCEPTED`，
  仅数据源管理主列表接入；
- 数据源管理当前视觉是**参考实现**，**不得**自动上升为全部页面必须遵守的既定规范；
- 参考实现的列定义、状态标签语义、行操作、固定列、双击行为均属其 Feature 专属；
- 本模板**未**定义、**未**测量、**未**修改任何行高、字号或颜色的“权威值”；
  凡参考源码未显式定义的值，均标注为“继承现状、待详细设计/浏览器量测确认”；
- 后续页面必须**逐页评估**，不能批量无差别套用。

## 11. 变更记录

- 2026-09-21，建立列表表格视觉模板基线草案
  （`LIST-TABLE-VISUAL-TEMPLATE-BASELINE-001`，纯文档任务）。
- 2026-09-21，R1 定向修订（`LIST-TABLE-VISUAL-TEMPLATE-BASELINE-001-R1`，纯文档任务）：
  统一“序号列”与“空态”职责口径（默认属 Feature，参考实现事实保留，不作为公共默认规则）；
  修正本文件状态表述为准确口径。详见 `reports/LIST-TABLE-VISUAL-TEMPLATE-BASELINE-001-R1.md`。
- 2026-09-21，基线内容批准收口
  （`LIST-TABLE-VISUAL-TEMPLATE-BASELINE-APPROVAL-CLOSEOUT-001`，纯文档任务）：
  ChatGPT 远程 R1 复审 `REVIEW_PASS`、`blocking_finding_count=0`，项目负责人批准**基线内容**
  （`approval_scope=BASELINE_CONTENT_ONLY`）；四份规范性文档状态改为
  `APPROVED` / `BASELINE_APPROVED`，当前有效规则标记统一为
  `LIST_TABLE_TEMPLATE_APPROVED`；标记计数改为“规范正文 / 历史报告”分层口径。
  公共实现详细设计、公共实现、参考页接入与页面迁移**均未批准**。
  详见 `reports/LIST-TABLE-VISUAL-TEMPLATE-BASELINE-APPROVAL-CLOSEOUT-001.md`。
- 2026-09-21，公共实现详细设计草案产出
  （`LIST-TABLE-VISUAL-TEMPLATE-SHARED-IMPLEMENTATION-DESIGN-001`，纯文档任务）：
  新增 `SHARED_COMPONENT_DESIGN.md`（**草案，待 ChatGPT 复审与项目负责人批准**），
  对 `DESIGN.md` §8 的四个候选作出**唯一结论**
  （显式根类 CSS 预设 + 有限 CSS 自定义属性令牌；**不**引入 Vue 包装组件、
  **不**新增 DOM 层）；四份规范性文档状态块增加
  `shared_implementation_design_status=DRAFT_PENDING_CHATGPT_AND_PROJECT_OWNER_REVIEW`
  与 `shared_implementation_design_approval_status=NOT_APPROVED`。
  公共实现、参考页接入与页面迁移**仍全部未开始/未授权**；
  已批准基线标记计数 `22 / 0 / 42 / 11` 与候选盘点 `15 / 14` **均未改变**（当时实测）。
  详见 `reports/LIST-TABLE-VISUAL-TEMPLATE-SHARED-IMPLEMENTATION-DESIGN-001.md`。
- 2026-09-21，公共实现详细设计批准收口
  （`LIST-TABLE-VISUAL-TEMPLATE-SHARED-IMPLEMENTATION-DESIGN-APPROVAL-CLOSEOUT-001`，纯文档任务）：
  ChatGPT 远程 R2 复审 `REVIEW_PASS`、`blocking_finding_count=0`，项目负责人批准**详细设计**
  （`approval_scope=SHARED_IMPLEMENTATION_DETAILED_DESIGN_ONLY`）；
  四份规范性文档状态块改为 `shared_implementation_design_status=APPROVED`
  / `shared_implementation_design_approval_status=APPROVED`；
  `SHARED_COMPONENT_DESIGN.md` 当前规范正文的设计决策标记统一转换为**已批准态**
  （草案标记 `0` / 已批准标记 `79`；该标记的定义域**只有** `SHARED_COMPONENT_DESIGN.md`
  一份文档，本文件及其他三份规范文档**不含**该字面量）。
  在详细设计批准收口当时，**批准详细设计 ≠ 批准实现**：公共实现、参考页接入与页面迁移
  **当时仍全部未开始/未授权**；已批准基线标记计数 `22 / 0 / 42 / 11` 与候选盘点 `15 / 14` 未改变（当时实测）。
  详见 `reports/LIST-TABLE-VISUAL-TEMPLATE-SHARED-IMPLEMENTATION-DESIGN-APPROVAL-CLOSEOUT-001.md`。
- 2026-09-22，公共实现与数据源管理参考页等价接入
  （`LIST-TABLE-VISUAL-TEMPLATE-SHARED-IMPLEMENTATION-AND-DATA-SOURCE-REFERENCE-INTEGRATION-001`，
  代码实现任务，分两个可独立回滚的提交）：
  新增公共视觉预设 `frontend/src/styles/list-table/list-table-visual.css` 与其常量/契约模块
  （`index.ts`、`list-table-visual.spec.ts`）；数据源管理**主列表**追加公共类 `lt-main-table`
  并以 `<style scoped src>` 引入公共预设，删除被逐值等价替代的四组局部基础规则；
  `shared_implementation_status` 与 `reference_page_integration_status` 推进为
  `IMPLEMENTED_PENDING_USER_REVIEW`；`formal_acceptance_execution_status` 保持 `NOT_RUN`，
  `page_migration_status` 保持 `NOT_STARTED`、`page_migration_authorization_status` 保持 `NOT_GRANTED`，
  `shared_implementation_design_status` 保持 `APPROVED`。
  本次实现**不等于**通过正式验收：`formal_acceptance_execution_status` 为 `NOT_RUN`，
  最终接受**尚未决定**；页面迁移仍 `NOT_STARTED` / `NOT_GRANTED`。
  详见 `reports/LIST-TABLE-VISUAL-TEMPLATE-SHARED-IMPLEMENTATION-AND-DATA-SOURCE-REFERENCE-INTEGRATION-001.md`。
- 2026-09-22，候选标记语义由**实现前口径**校正为**实现后真实口径**
  （`LIST-TABLE-VISUAL-TEMPLATE-SHARED-IMPLEMENTATION-AND-DATA-SOURCE-REFERENCE-INTEGRATION-001-R2`，
  纯文档定向修订）：
  ChatGPT 远程 R1 复审结论 `CHANGES_REQUIRED`、`blocking_finding_count=1`；
  九份权威文档的主状态对齐本身**已通过**（`r1_current_status_alignment_status=PASS`），
  唯一阻断问题是 `DESIGN.md` §8 仍把**已采纳并已实现**的候选事实
  继续归入候选未实现标记的“当前未实现”语义，与已批准的
  `SHARED_COMPONENT_DESIGN.md` §3 对比表直接冲突。
  本次将 `DESIGN.md` 中**四处**原本承担“已采纳候选 / 已决策技术形态”内容的段落
  （文档导语、§4、§8 总导语、§8.5 对比小结）由候选未实现标记改为**参考事实标记**，
  并在 §8.1–§8.4 各节标题下补记**最终结论**：§8.1 / §8.2 **部分采纳**
  为组合方案的两半、§8.3 **被否决、未实现**、§8.4 **唯一采纳并已实现**
  （`IMPLEMENTED_PENDING_USER_REVIEW`，仍待项目负责人目测与正式验收）。
  当前规范性文档计数随之由 `22 / 0 / 42 / 11` 变为 `26 / 0 / 42 / 7`
  （参考事实标记 `+4`、候选未实现标记 `-4`，已批准模板规则标记与草案态标记均不变）。
  本文件 §11 与各历史报告中标注了**实现前时点**的 `22 / 0 / 42 / 11`
  保留不改，只代表当时真实状态。
  代码、测试、服务、原实现报告、R1 报告与浏览器证据**均未改动**。
  详见 `reports/LIST-TABLE-VISUAL-TEMPLATE-SHARED-IMPLEMENTATION-AND-DATA-SOURCE-REFERENCE-INTEGRATION-001-R2.md`。
- 2026-09-22，项目负责人目测通过收口
  （`LIST-TABLE-VISUAL-TEMPLATE-SHARED-IMPLEMENTATION-VISUAL-REVIEW-CLOSEOUT-001`，纯文档任务）：
  ChatGPT 远程 R2 复审结论 `REVIEW_PASS`、`blocking_finding_count=0`；
  项目负责人于 `2026-09-22` 打开
  `http://192.168.174.70:5173/config/data-source` 目测复核，结论为“没啥问题”，
  正式记录 `project_owner_visual_review_status=PASS`（`project_owner_visual_review_date=2026-09-22`）。
  公共实现与参考页接入状态由 `IMPLEMENTED_PENDING_USER_REVIEW` 推进为
  `IMPLEMENTED_PENDING_FORMAL_ACCEPTANCE`（**目测通过 ≠ 正式验收**）：
  `formal_acceptance_execution_status` 保持 `NOT_RUN`、
  `final_acceptance_status=NOT_ACCEPTED_PENDING_FORMAL_ACCEPTANCE`，
  `page_migration_status` 保持 `NOT_STARTED`、
  `page_migration_authorization_status` 保持 `NOT_GRANTED`，
  `shared_implementation_design_status` 保持 `APPROVED`。
  目测结论**不**表示正式验收已执行、**不**表示已作最终接受决定、**不**表示生产可用，
  也**不**授权迁移任何其他业务页面。
  下一入口改为**单独授权的正式验收任务**（需另立提示词并获项目负责人单独授权）。
  代码、测试、配置、依赖、锁文件、证据与历史报告**均未改动**。
  详见 `reports/LIST-TABLE-VISUAL-TEMPLATE-SHARED-IMPLEMENTATION-VISUAL-REVIEW-CLOSEOUT-001.md`。
- 2026-09-22，公共实现与参考页接入**正式验收**（
  `LIST-TABLE-VISUAL-TEMPLATE-SHARED-IMPLEMENTATION-FORMAL-ACCEPTANCE-001`）：
  以 `b36c521`（实现在 `284b263`，`backend/frontend` 零差异）为受验对象，
  基准服务由接入前提交 `ae6439b` 的隔离临时副本提供（与正式工作树分离端口），
  执行 `LTVT-FA-001`～`014` 共 14 条，结果 **14 PASS / 0 FAIL / 0 BLOCKED / 0 NOT_RUN**。
  严格 0 差异保持（1440×900 / 1920×1080 计算样式与几何均为 0）；
  fallback/覆盖 A–F 通过；`.naming-table` 与负向页面矩阵隔离通过；
  反向控制 6 项（含 1 项保真对照）全部符合预期，违规项均以非零退出或判定失败报告；
  隔离回滚验证通过（参考页接入可独立回退，公共层保留且未启用页面零影响）。
  状态推进为 `formal_acceptance_execution_status=EXECUTED_PASSED_LOCAL`、
  `shared_implementation_status` / `reference_page_integration_status` 为
  `IMPLEMENTED_PENDING_FINAL_ACCEPTANCE`、
  `final_acceptance_status=NOT_ACCEPTED_PENDING_PROJECT_OWNER`，
  页面迁移保持 `NOT_STARTED` / `NOT_GRANTED`，详细设计保持 `APPROVED`。
  **本地正式验收 ≠ 项目负责人最终接受**：下一步先由 ChatGPT 复审远程正式验收提交，
  再由项目负责人决定是否最终接受并执行独立收口。
  本任务未修改业务代码、测试、配置、依赖、锁文件或历史报告。
  详见 `reports/LIST-TABLE-VISUAL-TEMPLATE-SHARED-IMPLEMENTATION-FORMAL-ACCEPTANCE-001.md`。
- 2026-09-22，公共实现与参考页接入**最终验收收口**
  （`LIST-TABLE-VISUAL-TEMPLATE-SHARED-IMPLEMENTATION-FINAL-ACCEPTANCE-CLOSEOUT-001`，
  纯文档任务）：
  ChatGPT 对正式验收提交 `8501416e750c7eb8547c7f922b1bed3545c7cb17` 的远程 Git 复审结论为
  `REVIEW_PASS`、`blocking_finding_count=0`；项目负责人于 2026-09-22 作出**最终接受**决定：
  `final_acceptance_status=ACCEPTED_BY_PROJECT_OWNER`、
  `shared_implementation_completion_status=COMPLETED`、
  `project_owner_final_acceptance_decision=APPROVED`、
  `pending_project_owner_acceptance=NO`；
  公共实现与参考页接入状态由 `IMPLEMENTED_PENDING_FINAL_ACCEPTANCE` 推进为
  `IMPLEMENTED_ACCEPTED`；下一入口置为
  `NONE_SHARED_IMPLEMENTATION_FINAL_ACCEPTED_AND_CLOSED_NO_PAGE_MIGRATION_AUTHORIZED`。
  **本次最终接受范围仅限**「列表表格视觉模板**公共实现** + 数据源管理**参考页等价接入**」，
  **不**代表批准探针端管理、数据订阅或其他任何业务页面迁移；
  `page_migration_status` 保持 `NOT_STARTED`、
  `page_migration_authorization_status` 保持 `NOT_GRANTED`，
  `shared_implementation_design_status` 保持 `APPROVED`。
  本任务为**纯文档**收口：未修改代码、测试、配置、依赖、锁文件、证据或历史报告。
  详见 `reports/LIST-TABLE-VISUAL-TEMPLATE-SHARED-IMPLEMENTATION-FINAL-ACCEPTANCE-CLOSEOUT-001.md`。
