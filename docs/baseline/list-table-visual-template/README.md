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

含义：**当前真实源码中可直接验证的事实**——包括**参考实现事实**（基准提交
`10b1d3e39d03dbb78ea409d486f1f3e80c12fc3e` 的真实源码）与**已批准选择结果 / 已落地实现事实**
（如 `DESIGN.md` §5 的实测行高、§8 的最终结论、`SHARED_COMPONENT_DESIGN.md` §12 的现行 opt-in 取值）。

**不得**把参考事实写成模板规范。该标记的语义在批准前后**不变**；其完整判定口径见 §7.3 的阅读约定
（**已批准选择结果**与**已落地实现事实**与参考实现事实同属本标记）。

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
- 公共目录布局与令牌命名（已由详细设计确定并由实现任务落地）；
- `SHARED_COMPONENT_DESIGN.md` §12 中**已落地**的 opt-in 取值（已落地 CSS 规则、显式 opt-in 挂载、
  现行测试断言 #11、令牌数 `9`、辅助类数 `2`）。

**代码复审状态 ≠ 尚未实现**：`IMPLEMENTED_PENDING_CHATGPT_REVIEW` 一类值只描述**复审进度**，
**不**表示实现事实「尚未实现」，**不得**据此把已落地事实改标为候选未实现标记。
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

当前规范性文档计数（**每次改动后从文件复算**，见 §11 变更记录）：

| 标记 | 批准前 | 批准收口时 | 实现落地后 | 整理后（2026-09-29） | **R2 纠正后（2026-09-29）** |
| --- | --- | --- | --- | --- | --- |
| `LIST_TABLE_REFERENCE_FACT` | 22 | 22 | 26 | 27 | **28** |
| `LIST_TABLE_TEMPLATE_APPROVED` | 0 | 42 | 42 | 42 | **42** |
| `LIST_TABLE_PROPOSED_NOT_IMPLEMENTED` | 11 | 11 | 7 | 8 | **8** |

历史口径变更（`22 / 0 / 42 / 11` → `26 / 0 / 42 / 7`）：
参考事实标记 `+4`（22→26）、候选未实现标记 `-4`（11→7），
已批准模板规则标记与草案态标记均不变（42 / 0）。

本任务整理后口径（`26 / 0 / 42 / 7` → `27 / 0 / 42 / 8`）：
`DESIGN.md` §5 新增一行**实测参考事实**（两页可比常规行约 `48 CSS px`）→ 参考事实 `+1`（26→27）；
`DESIGN.md` §7 新增**最小定向修订草案**（尚待远程复审 / 负责人批准）→ 候选未实现 `+1`（7→8）；
已批准模板规则标记与草案态标记不变（42 / 0），核验命令见上。

**R2 标记口径纠正后口径（`27 / 0 / 42 / 8` → `28 / 0 / 42 / 8`）**：
本节 §8 中**已落地**的 opt-in 事实说明改标为**参考事实标记** → 参考事实 `+1`（27→28）；
已批准模板规则标记、候选未实现标记与草案态标记均不变（42 / 8 / 0）。
`SHARED_COMPONENT_DESIGN.md` §12 中同批**已落地／已批准事实**亦由候选未实现标记改标参考事实标记，
其独立计数见该文件 §12.8，**不**并入本节四份文档口径。

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

**计数通道与 §12／§13 可选扩展（R2 纠正，2026-09-29）** —— 本节的四份文档计数**只**扫描
`README.md` / `DESIGN.md` / `UI.md` / `MIGRATION.md`，**不**扫描
`SHARED_COMPONENT_DESIGN.md`。该文件 §12「已批准设计基线、已落地实现、待远程复审的可选扩展」中，
**已落地／已批准的事实**按本节 §7.3 的阅读约定标注**参考事实标记**，**未实现**的禁用态视觉与**待批准**的
§13 分层契约标注**候选未实现标记**（两者均只引用、不重定义）。这两类在该文件内的**独立**计数见
`SHARED_COMPONENT_DESIGN.md` §12.8，**不**并入本节
（四份文档计数**现行**为 `28 / 0 / 42 / 8`，见 §7.4 计数表末列）；
「是否并入本节计数」**不再**留为未决项——**不并入**，另列独立通道。各标记通道
（四份文档 / 本文件批准态设计标记 / 该文件参考事实标记 / 该文件候选未实现标记）**严格不混算**：

```bash
# 独立通道：SHARED_COMPONENT_DESIGN.md 的参考事实标记与候选未实现标记
# 用字符串拼接构造字面量，避免核验命令自身被计入
ref_marker="LIST_TABLE_REFERENCE_""FACT"
cand_marker="LIST_TABLE_PROPOSED_""NOT_IMPLEMENTED"
grep -ohF "$ref_marker"  docs/baseline/list-table-visual-template/SHARED_COMPONENT_DESIGN.md | wc -l
grep -ohF "$cand_marker" docs/baseline/list-table-visual-template/SHARED_COMPONENT_DESIGN.md | wc -l
```

## 8. 文档导航

| 文件 | 内容 |
| --- | --- |
| `README.md` | 本文件：状态、目标、范围、参考实现、与 qlpt 的关系、标记分层、导航与变更记录 |
| `DESIGN.md` | 模板职责与 Feature 保留职责、启用与作用域隔离、行高与长文本策略、候选实现方案对比（**基线任务当时不定案**；下游已选 §8.4 并已落地，**目测已通过并通过本地正式验收**） |
| `UI.md` | 参考实现主表当前事实、可提升为已批准模板规则的视觉内容、必须保留为 Feature 专属的内容 |
| `MIGRATION.md` | 全量 `el-table` 使用点盘点矩阵、候选分类、逐页独立评估与授权要求 |
| `SHARED_COMPONENT_DESIGN.md` | **公共实现详细设计（已批准）**：四个候选的唯一结论、公共契约、Feature 保护项、参考页等价接入清单、验证与回滚设计（`approval_scope=SHARED_IMPLEMENTATION_DETAILED_DESIGN_ONLY`；**批准的是设计文档**，该设计随后已由独立实施任务落地，**目测已通过**，**本地正式验收已通过，并已由项目负责人最终接受**）。**§12 为例外**：行内三点入口 opt-in **可选扩展**——其**设计基线**已于 2026-09-29 经 ChatGPT 远程复审 `APPROVED`、项目负责人批准（**R2 修订后口径**）；其**代码实现**已由独立任务 `CLIENT-CONFIG-ROW-HEIGHT-AND-OPTIONAL-ELLIPSIS-IMPLEMENTATION-001` 落地、`/config/client` 主列表接入，**代码复审状态**为 **`IMPLEMENTED_PENDING_CHATGPT_REVIEW`（待远程复审）**；其**已落地的现行事实**按 §7.3 阅读约定标注**参考事实标记**（**不**因待复审而标为候选未实现），其独立计数见 §12.8） |
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

**已批准设计基线、已实现待远程复审的可选扩展（第七轮 · 2026-09-29）** —— `SHARED_COMPONENT_DESIGN.md` §12
「行内三点入口 opt-in」是列表表格视觉模板的一项**显式启用（opt-in）可选扩展**，来源为探针端管理
第七轮调整任务 `CLIENT-CONFIG-ROW-HEIGHT-AND-OPTIONAL-ELLIPSIS-BASELINE-001`。其时序：R0 草案
`9381703…` 远程复审 `CHANGES_REQUIRED` → R1 `938e720…` 远程复审 `CHANGES_REQUIRED` →
R2 `59617b4…` 经 ChatGPT **从远程 Git 独立复审 `APPROVED`** → 项目负责人于 **2026-09-29 批准**；
**批准对象为该扩展的设计基线（R2 修订后口径），不是实现**。因此：

- **设计基线已批准**：§12 的 opt-in 契约（确定类名 `lt-row-action__cell`／
  `lt-row-action__ellipsis`、受 `.lt-main-table` 限定、**默认不新增 `--lt-*` 令牌**、约 `28px` 命中区、
  `6px` 圆角、既有主色）按已批准设计文本解析；
- **扩展代码已实现、待远程复审**（`LIST_TABLE_REFERENCE_FACT`）：该 opt-in 扩展已由独立实现任务
  `CLIENT-CONFIG-ROW-HEIGHT-AND-OPTIONAL-ELLIPSIS-IMPLEMENTATION-001` 落地——公共层
  `frontend/src/styles/list-table/list-table-visual.css` 新增仅受 `.lt-main-table` 限定的
  `lt-row-action__cell`／`lt-row-action__ellipsis` 两条规则，`/config/client` **主列表**显式接入，
  静态断言 #11 更新为「先剔除根类再断言辅助类集合」（#2／#3／#6 不变）。据此，**现行**
  `lt_internal_helper_class_count` 为 **2**（`lt_token_count` 仍 **9**）。其**代码复审状态**为
  `IMPLEMENTED_PENDING_CHATGPT_REVIEW`（**待远程复审**）——复审状态**不**等于「尚未实现」，故本节按
  §7.3 阅读约定标注**参考事实标记**，**不**再按候选未实现标记引用；独立计数口径见
  `SHARED_COMPONENT_DESIGN.md` §12.8；
- 该扩展**不**改变本模板任何**已批准规则**与模板级状态，也**不**改变 §9 的阶段路径与授权边界
  （`page_migration_status` 仍 `NOT_STARTED`、`page_migration_authorization_status` 仍 `NOT_GRANTED`、
  `pilot_page_selection_status` 仍 `NOT_DECIDED`）。

> **历史与批准链（2026-09-29，摘要）**：R0 `9381703…`、R1 `938e720…` 从远程 Git 复核均
> `CHANGES_REQUIRED` → R2 `59617b4…` 经 ChatGPT 从远程 Git 独立复核 `APPROVED` → 项目负责人批准
> 该扩展的**设计基线**（R2 修订后口径，**批准对象是设计基线，不是实现**）。R2 曾把 §12.7 #11 的
> 示例判定表达式（会误命中根类 `.lt-main-table`）收敛为「先剔除根类再断言辅助类集合」的可实现口径，
> 该文本现已在实现任务中落地。各轮拟议文本、旧计数（`lt_internal_helper_class_count` 阶段一 `0`、
> 辅助类 `2` 曾为未来值）与当时「尚未实现」说明保留在既有历史报告。
> **实现完成 ≠ 远程代码复审通过 ≠ 项目负责人目测 ≠ 正式验收通过**；数据源管理「更多」→三点迁移
> 仍属**另一会话、另一独立任务**。**本模板整体状态不变**：`shared_implementation_status`／
> `reference_page_integration_status` 仍 `IMPLEMENTED_ACCEPTED`、`final_acceptance_status` 仍
> `ACCEPTED_BY_PROJECT_OWNER`。

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
- 本模板**不**为行高、字号或颜色预设**对所有表格的权威值**，也**不**以固定像素行高统一各页；
  对参考源码未显式定义的值，按**内容驱动**与 Feature 局部覆盖处理——`2026-09-29` 已对两页
  可比常规行完成**只读浏览器量测**（常规行约 `48 CSS px`，见 `DESIGN.md` §5），
  **不再**以“继承现状、待详细设计 / 浏览器量测确认”作为未决占位；
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
- 2026-09-29，新增**待复审的可选扩展草案**章节
  （`SHARED_COMPONENT_DESIGN.md` §12「待复审的可选扩展草案：行内三点入口 opt-in」，
  来源为探针端管理第七轮调整草案任务
  `CLIENT-CONFIG-ROW-HEIGHT-AND-OPTIONAL-ELLIPSIS-BASELINE-001`，纯文档任务）：
  项目负责人于 2026-09-29 确认产品方向——把行内三点入口的**外观与通用可访问性**
  提炼为公共列表表格视觉模板的**显式启用（opt-in）可选能力**，不成为所有主列表的默认入口。
  该草案在 `SHARED_COMPONENT_DESIGN.md` 内以**候选未实现标记**标注（标记定义见本文件 §7.3），
  **未**获 ChatGPT 远程复审、**未**获项目负责人基线批准、**未**实现；
  本模板的四份规范文档计数保持 `26 / 0 / 42 / 7` 不变（该草案位于
  `SHARED_COMPONENT_DESIGN.md`，不属该计数口径），
  `SHARED_COMPONENT_DESIGN.md` 的批准态设计标记计数亦保持 `79` 不变。
  **本次产品方向确认 ≠ 扩展草案已获远程复审或基线批准**；
  `page_migration_status` 保持 `NOT_STARTED`、
  `page_migration_authorization_status` 保持 `NOT_GRANTED`、
  `pilot_page_selection_status` 保持 `NOT_DECIDED`，
  下一入口保持 `NONE_SHARED_IMPLEMENTATION_FINAL_ACCEPTED_AND_CLOSED_NO_PAGE_MIGRATION_AUTHORIZED`
  （该草案的复审属**探针端管理 Feature 侧**的文档复审入口，不构成本模板的下一步）。
  本任务为**纯文档**草案建立：未修改代码、共享 CSS、测试、配置、依赖、锁文件、证据或历史报告。
- 2026-09-29，第七轮草案 **R1 定向纠错**（`CLIENT-CONFIG-ROW-HEIGHT-AND-OPTIONAL-ELLIPSIS-BASELINE-001-R1`，
  纯文档）——ChatGPT 从远程 Git 对 R0 草案提交
  `9381703cf63d0e91ce5ee39cee28f907e21972ca` 的复审结论为 `CHANGES_REQUIRED`，
  其第 ④ 项要求把 `SHARED_COMPONENT_DESIGN.md` §12 的未决清单收敛为**具体可复审的拟修订契约**。
  本 R1 在 §12 收敛：确定 opt-in 类名 `lt-row-action__cell`（操作列 `td`）与
  `lt-row-action__ellipsis`（三点触发器，均受 `.lt-main-table` 限定）、**默认不新增 `--lt-*` 令牌**
  （保持 9 令牌）、写出 §7.1 断言 #6/#11 的**拟**修订文本与 §4.3/§4.4 的**生效时**计数
  （`lt_token_count=9` 不变、`lt_internal_helper_class_count` 生效时 `0→2`）、
  区分「表格行高不得固定」与「触发器自身约 28×28px 命中区」、给出批准路径。
  **拟修订值 ≠ 现值**；§4.3/§4.4/§7.1/§7.2 的已批准旧断言仍为现行事实，
  该扩展**未**获复审、**未**获批准、**未**实现。计数口径在 §7.4 与
  `SHARED_COMPONENT_DESIGN.md` §12.8 明确为**三条独立通道**（四份文档 `26 / 0 / 42 / 7` /
  本文件批准态设计标记 `79` / §12 候选未实现标记独立统计），**不混算**；
  因此本次 R1 后四份文档计数仍 `26 / 0 / 42 / 7`、本文件批准态 `79` 均**不变**。
  `page_migration_status` 保持 `NOT_STARTED`、
  `page_migration_authorization_status` 保持 `NOT_GRANTED`。
  本 R1 为**纯文档**纠错：未修改代码、共享 CSS、测试、配置、依赖、锁文件、证据或历史报告。
- 2026-09-29，第七轮草案 **R2 定向纠错**（`CLIENT-CONFIG-ROW-HEIGHT-AND-OPTIONAL-ELLIPSIS-BASELINE-001-R2`，
  纯文档）——ChatGPT 从远程 Git 对 R1 提交
  `938e7202980cf898fe5c6d1194715e3a004f994a` 的复审结论为 `CHANGES_REQUIRED`，
  其第 ② 项指出 `SHARED_COMPONENT_DESIGN.md` §12.7 拟议断言 #11 的示例判定表达式
  `new Set(css().match(/\.lt-[\w-]+/g))` **本身会命中根类** `.lt-main-table`，与「辅助类恰好两个」
  不符。本 R2 **只**修 §12.7 拟议 #11 的**拟议文档文本**：把判定写成**先剔除根类**
  （`const helperClasses = allClasses.filter((name) => name !== '.lt-main-table').sort()`；
  `expect(helperClasses).toEqual(['.lt-row-action__cell', '.lt-row-action__ellipsis'])`）
  或使用含根类的**三元素**允许集合，**不得**让检查表达式实际计入三类；
  helper 数维持**拟批准后且独立实现时** `0 → 2`、**现行仍 `0`**；九个 `--lt-*` 令牌不变，
  断言 #2/#3 与 #6 的 R1 结论不变。本 R2 **不**修改
  `frontend/src/styles/list-table/list-table-visual.spec.ts` 的现行测试代码或已批准断言；
  §12 候选未实现标记（通道 3）R2 后复测仍 `23`（R1 时点值保留为时点证据），
  四份文档 `26 / 0 / 42 / 7` 与本文件批准态设计标记 `79` 均**不变**。
  `page_migration_status` 保持 `NOT_STARTED`、`page_migration_authorization_status` 保持 `NOT_GRANTED`。
  本 R2 为**纯文档**纠错：未修改代码、共享 CSS、测试、配置、依赖、锁文件、证据或历史报告。
- 2026-09-29，第七轮可选扩展**设计基线批准收口**
  （`CLIENT-CONFIG-ROW-HEIGHT-AND-OPTIONAL-ELLIPSIS-BASELINE-APPROVAL-CLOSEOUT-001`，纯文档）——
  R0 `9381703…`、R1 `938e720…` 远程复审均 `CHANGES_REQUIRED`，R2 `59617b4cee03fe1642417cb85005b339ab0015ab`
  经 ChatGPT **从远程 Git 独立复审 `APPROVED`**，项目负责人于 2026-09-29 批准。
  本收口据此把 `SHARED_COMPONENT_DESIGN.md` §12 的状态由「待复审草案」更新为
  **设计基线已批准、扩展代码尚未实现**：§12 的 opt-in 契约按**已批准设计文本**解析
  （确定类名 `lt-row-action__cell`／`lt-row-action__ellipsis`、受 `.lt-main-table` 限定、
  默认不新增 `--lt-*` 令牌、约 28px 命中区、6px 圆角、既有主色），但**本期无任何共享 CSS /
  测试断言 / 页面接入**因该扩展改变，仍以候选未实现标记引用。**批准的是设计基线，不是实现**：
  现行 9 个 `--lt-*` 令牌、内部 helper 类 `0` 与 §4/§7 契约保持**原值**，
  拟实施时辅助类 `2` 为**未来值**；四份规范文档计数仍 `26 / 0 / 42 / 7`、
  本文件批准态设计标记仍 `79`、§12 候选未实现标记（通道 3）本收口复测仍 `23`，
  三条通道**不混算**。`page_migration_status` 保持 `NOT_STARTED`、
  `page_migration_authorization_status` 保持 `NOT_GRANTED`、
  `pilot_page_selection_status` 保持 `NOT_DECIDED`；本模板
  `current_next_entry` 仍为
  `NONE_SHARED_IMPLEMENTATION_FINAL_ACCEPTED_AND_CLOSED_NO_PAGE_MIGRATION_AUTHORIZED`
  （第七轮扩展属探针端管理 Feature 侧，其复审入口不构成本模板的下一步）。
  本收口为**纯文档**：未修改代码、共享 CSS、测试、配置、依赖、锁文件、证据或历史报告。
  （该条为**当时时点**记录；其中「仍以候选未实现标记引用」的推导已由 2026-09-29 的
  **R2 标记口径纠正推翻**，现行口径以 §7.3 与下方 R2 条目为准。）
- 2026-09-29，第七轮可选扩展 **opt-in 代码实现**（`CLIENT-CONFIG-ROW-HEIGHT-AND-OPTIONAL-ELLIPSIS-IMPLEMENTATION-001`，
  前端实现任务，由探针端管理 Feature 侧发起）——按已批准设计文本在
  `frontend/src/styles/list-table/list-table-visual.css` 落地仅受 `.lt-main-table` 根类限定的
  `lt-row-action__cell`（操作列 `td`）与 `lt-row-action__ellipsis`（三点触发器）两条 opt-in 规则
  （命中区约 `28×28px`、圆角 `6px`、既有主色、hover、`:focus-visible` 内嵌焦点环、光标、行高协同），
  并同步更新 `list-table-visual.spec.ts` 静态断言 #11 为「**先剔除根类**再断言辅助类集合」的可实现口径
  （断言 #2／#3／#6 **不变**）。据此，**现行** `lt_token_count` 仍为 **9**（默认不新增 `--lt-*` 令牌）、
  `lt_internal_helper_class_count` 由 `0` 变为 **2**（仅 `{lt-row-action__cell, lt-row-action__ellipsis}`，
  其他 `lt-` 类仍禁止）。**该扩展代码实现状态为「已完成、待远程复审」**（`IMPLEMENTED_PENDING_CHATGPT_REVIEW`，
  属探针端管理 Feature 侧复审入口，**不**改本模板 `current_next_entry`）。**本模板整体状态不变**：
  `shared_implementation_status` 与 `reference_page_integration_status` 仍 `IMPLEMENTED_ACCEPTED`、
  `final_acceptance_status` 仍 `ACCEPTED_BY_PROJECT_OWNER`；`page_migration_status` 仍 `NOT_STARTED`、
  `page_migration_authorization_status` 仍 `NOT_GRANTED`、`pilot_page_selection_status` 仍 `NOT_DECIDED`；
  四份规范文档计数仍 `26 / 0 / 42 / 7`、本文件批准态设计标记仍 `79`，三条通道**不混算**。
  **实现完成 ≠ 远程代码复审通过 ≠ 已目测 ≠ 已正式验收**；数据源管理「更多」→三点迁移仍属**另一会话、另一独立任务**。
- 2026-09-29，**模板定向整理草案**（`LIST-TABLE-VISUAL-TEMPLATE-CLIENT-CONFIG-REFINEMENT-BASELINE-001`，纯文档草案）
  —— 以已实现、经项目负责人目测认可的 `/config/client` 主列表为参照，整理本模板现行规则与可选能力，
  **删除**五份规范正文中面向现行规则的**过期示例**（`UI.md` §3.5 探针 `#ecf5ff` 选中态、§3.7 探针“显式固定
  `height: 60px`”、§1.2 / §1.9 “继承现状、待详细设计 / 浏览器量测确认”占位；`DESIGN.md` §7 选中态具体示例；
  `README.md` §10 行高占位口径），并新增 `SHARED_COMPONENT_DESIGN.md` §13「现行基础规则与可选扩展分层契约」
  （含能力契约表、单行固定高亮**可选契约**）。标记复算：四份规范文档 `27 / 0 / 42 / 8`、
  本文件批准态设计标记 `79`、`SHARED_COMPONENT_DESIGN.md` 候选未实现标记 `23`（§12 内 `18` 处、§13 内 `2` 处、
  其它说明 `3` 处）——候选未实现标记**净变化 `0`**（§12.6 两处草案示例改写为**现行接入事实**后迁出 `-2`，§13 新增 `+2`）。**本任务新增的可选契约状态为 `DRAFT_PENDING_USER_REVIEW`**，
  下一入口 `CHATGPT_REMOTE_LIST_TABLE_VISUAL_TEMPLATE_CLIENT_CONFIG_REFINEMENT_BASELINE_REVIEW`
  （**该入口后经远程复审 `CHANGES_REQUIRED`，已为历史入口**，由下方 R1 记录接续）；
  **模板整体状态不变**（`page_migration_status=NOT_STARTED` 等），**不**改数据源管理页。详见同目录 `reports/LIST-TABLE-VISUAL-TEMPLATE-CLIENT-CONFIG-REFINEMENT-BASELINE-001.md`。
- 2026-09-29，**模板整理 R1 定向纠错**（`LIST-TABLE-VISUAL-TEMPLATE-CLIENT-CONFIG-REFINEMENT-BASELINE-001-R1`，
  纯文档草案）——ChatGPT 从远程 Git 对 R0 提交 `0b43a444ab002ea21c1fe7ad4884b241c950b317`
  的文档复审结论为 `CHANGES_REQUIRED`；本 R1 **只**就地修正三处：① 移除现行规范中的实施前示例
  （`SHARED_COMPONENT_DESIGN.md` §12.7 由「拟修订契约」改写为**现行可执行契约**；§4.3／§4.4／§7.1 的
  旧 `0` / 未来值就地收敛为现行值；`README.md` §8 的「扩展代码尚未实现、尚未生效」改写为现行事实）；
  ② 统一禁用态两级职责（§12.1 与 §13.2；现行 CSS 尚无禁用视觉规则，据实记为**设计契约、尚未实现、尚未验收**）；
  ③ 把 §13.5／`DESIGN.md` §7 的「已按…收窄」改为**拟议、待批准后生效**。标记复算三条通道**均不变**
  （四份规范文档 `27 / 0 / 42 / 8`、本文件批准态设计标记 `79`、`SHARED_COMPONENT_DESIGN.md`
  候选未实现标记 `23`）；R1 **未**增删任何标记实例。R0 报告的「17 项过期示例已清理」过宽结论由
  R1 报告以 **errata／override** 承接（§12.7 等遗留示例由 R1 处理，**不**回写 R0 报告）。
  §13 新增可选契约仍为 `DRAFT_PENDING_USER_REVIEW`；本轮草案链下一入口为
  `CHATGPT_REMOTE_LIST_TABLE_VISUAL_TEMPLATE_CLIENT_CONFIG_REFINEMENT_BASELINE_R1_REVIEW`；
  本模板级 `current_next_entry` 仍为
  `NONE_SHARED_IMPLEMENTATION_FINAL_ACCEPTED_AND_CLOSED_NO_PAGE_MIGRATION_AUTHORIZED`。
  **模板整体状态不变**（`page_migration_status=NOT_STARTED` 等），**不**改数据源管理页。详见同目录
  `reports/LIST-TABLE-VISUAL-TEMPLATE-CLIENT-CONFIG-REFINEMENT-BASELINE-001-R1.md`。
- 2026-09-29，**模板整理 R2 标记口径纠正**（`LIST-TABLE-VISUAL-TEMPLATE-CLIENT-CONFIG-REFINEMENT-BASELINE-001-R2`，
  纯文档草案）—— ChatGPT 从远程 Git 对 R1 提交 `e4c16df7459440b5a9390830c06f0525a934f9b4`
  的文档复审结论为 `CHANGES_REQUIRED`：**已落地实现事实仍被标为候选未实现**。本 R2 **只**纠正标记语义：
  把 `SHARED_COMPONENT_DESIGN.md` §12 中**已落地／已批准事实**（已落地 CSS 规则、显式 opt-in 挂载、
  测试断言、令牌数 `9`、辅助类数 `2`）由候选未实现标记改标为**参考事实标记**；把**未实现**的
  §12.1 禁用态视觉与**待批准**的 §13 分层契约拆为独立句／段并保留候选未实现标记；删除本节 §8
  及 `SHARED_COMPONENT_DESIGN.md` 中「因为待复审所以仍按候选未实现标记引用」的推导。
  标记复算：四份规范文档 `27 / 0 / 42 / 8` → **`28 / 0 / 42 / 8`**（§8 已落地事实改标，参考事实 `+1`）；
  本文件批准态设计标记 `79`（**不变**）；`SHARED_COMPONENT_DESIGN.md` 参考事实标记 `24`（新增独立通道）、
  候选未实现标记 `23 → 10`。**不**改任何已批准规则、**不**实施新样式、**不**批准 §13 新可选契约；
  §13 仍为 `DRAFT_PENDING_USER_REVIEW`；模板级状态**不变**（`page_migration_status=NOT_STARTED` 等）；
  §12.1 禁用态视觉仍属**设计契约、尚未实现、尚未验收**（`CCFG-AC-157` 仍 `BLOCKED`）；
  **不**改数据源管理页。草案链下一入口改为
  `CHATGPT_REMOTE_LIST_TABLE_VISUAL_TEMPLATE_CLIENT_CONFIG_REFINEMENT_BASELINE_R2_REVIEW`
  （R1 入口经远程复审 `CHANGES_REQUIRED`，已为历史入口）。详见同目录
  `reports/LIST-TABLE-VISUAL-TEMPLATE-CLIENT-CONFIG-REFINEMENT-BASELINE-001-R2.md`。
- 2026-09-29，**模板整理 R3 定向纠错**（`LIST-TABLE-VISUAL-TEMPLATE-CLIENT-CONFIG-REFINEMENT-BASELINE-001-R3`，
  纯文档）—— ChatGPT 从远程 Git 对 R2 提交 `732d6df12215f0036f27dcbe8367bbb172f1fd47`
  的文档复审结论为 `CHANGES_REQUIRED`，指出两处：① `SHARED_COMPONENT_DESIGN.md` §12.1 的
  **参考事实段**仍声称公共层「已负责」禁用态外观，把**尚未实现**的公共规则混入现行实现事实；
  ② §12.3 在参考事实标记下把**调整前**的 `53px` 测量、`CCFG-AC-010` 现行 `BLOCKED` 与
  设计阶段「可选做法／待验证」措辞误写成**现行事实**。本 R3 就这两处定向改写：
  §12.1 参考事实段只写现行已成立的职责与代码事实（现行三点触发器**无可观察禁用场景**），
  引用公共视觉职责时只指向上一段的**待实现设计契约**，并在 §13.2 交叉引用处澄清「拟负责／未来设计职责」；
  §12.3 明确 `53px` 属**调整前历史测量**（同期参考页约 `48px`），另立**现行已实现**盒模型与测量
  （opt-in 单元格 `9.5px 0`、触发器 `28×28px`、常规可比行约 `48 CSS px`、真实 `100%`／`125%` 缩放）
  与**现行验收状态**（`CCFG-AC-010` 状态格 `PASS`、`CCFG-AC-155~157` `BLOCKED`）段，
  把「可选做法／`:has()`／`overflow: visible` 待验证」等设计阶段内容归入**历史推导**；
  §12.5 仅作同一时点澄清。标记复算：四份规范文档 `28 / 0 / 42 / 8`（**不变**）；
  本文件批准态设计标记 `79`（**不变**）；`SHARED_COMPONENT_DESIGN.md` 参考事实标记 `24 → 25`、
  候选未实现标记 `10`（**不变**）。**不**改任何已批准规则、**不**实施新样式、**不**批准 §13 新可选契约、
  **不**改任何验收状态格或新跑验收；§13 仍为 `DRAFT_PENDING_USER_REVIEW`；
  §12.1 禁用态视觉仍属**设计契约、尚未实现、尚未验收**（`CCFG-AC-157` 仍 `BLOCKED`）；
  模板级状态**不变**（`page_migration_status=NOT_STARTED` 等）；**不**改数据源管理页。
  草案链下一入口改为
  `CHATGPT_REMOTE_LIST_TABLE_VISUAL_TEMPLATE_CLIENT_CONFIG_REFINEMENT_BASELINE_R3_REVIEW`
  （R2 入口经远程复审 `CHANGES_REQUIRED`，已为历史入口）。详见同目录
  `reports/LIST-TABLE-VISUAL-TEMPLATE-CLIENT-CONFIG-REFINEMENT-BASELINE-001-R3.md`。
- 2026-09-29，**模板整理 R4 焦点环证据表述纠错**（`LIST-TABLE-VISUAL-TEMPLATE-CLIENT-CONFIG-REFINEMENT-BASELINE-001-R4`，
  纯文档，单点纠错）—— ChatGPT 从远程 Git 对 R3 提交 `d6b09d811d46cb02310ae22eed661860e84652ce`
  的文档复审结论为 `CHANGES_REQUIRED`：`SHARED_COMPONENT_DESIGN.md` §12.3 对真实 `125%` 缩放焦点环的
  「外侧无描边像素」表述较原始证据更**绝对**。本 R4 **只**改这一处：把该绝对说法**分缩放**改写——
  真实 `100%` 严格盒内、盒外蓝色物理像素 `0`（`ringFullyInsideHitBoxStrict=true`）；真实 `125%` 命中盒约
  `35×35` 物理像素（`28×28` CSS × `dpr 1.25`），严格整数盒判定 `false`、盒外计数 `27`，**全部**落在盒子
  **左侧紧邻的 1 个物理像素列**（`ringOutsideMaxDevicePx=1`，1 物理像素容差判定 `true`），该边缘列由元素
  左边界落在**半个物理像素**上的**量化归类**造成，**不是**产品可见的焦点环逸出；四边完整可见、未被
  `.cell{overflow: hidden}` 裁切之结论按 R1 报告原文核对并保留。标记复算：四份规范文档 `28 / 0 / 42 / 8`
  （**不变**）；本文件批准态设计标记 `79`（**不变**）；`SHARED_COMPONENT_DESIGN.md` 参考事实标记 `25`、
  候选未实现标记 `10`（均**不变**，R4 仅改既有参考事实段内部措辞）。R4 **未**修改 R3 其它结论
  （§12.1 职责分层、调整前 `53px` 与现行可比行约 `48 CSS px`、`CCFG-AC-010` 现行 `PASS`、§13 待批准）；
  **不**改任何已批准规则、**不**实施新样式、**不**批准 §13 新可选契约、**不**改任何验收状态格或新跑验收；
  模板级状态**不变**；**不**改数据源管理页。草案链下一入口改为
  `CHATGPT_REMOTE_LIST_TABLE_VISUAL_TEMPLATE_CLIENT_CONFIG_REFINEMENT_BASELINE_R4_REVIEW`
  （R3 入口经远程复审 `CHANGES_REQUIRED`，已为历史入口）。详见同目录
  `reports/LIST-TABLE-VISUAL-TEMPLATE-CLIENT-CONFIG-REFINEMENT-BASELINE-001-R4.md`。
