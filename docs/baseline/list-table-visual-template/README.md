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
shared_implementation_status=NOT_STARTED
reference_page_integration_status=NOT_STARTED
formal_acceptance_execution_status=NOT_RUN
page_migration_status=NOT_STARTED
page_migration_authorization_status=NOT_GRANTED
candidate_inventory_status=COMPLETED_APPROVED_AS_BASELINE_INVENTORY
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
> 该值**只**表示**公共实现详细设计文档已获批准**，
> **不**表示公共实现已开始、参考页已接入或任何页面已迁移；
> `shared_implementation_status`、`reference_page_integration_status`
> 仍保持 `NOT_STARTED`，`formal_acceptance_execution_status` 保持 `NOT_RUN`，
> `page_migration_status` 保持 `NOT_STARTED`，
> `page_migration_authorization_status` 保持 `NOT_GRANTED`。
> 本目录**未**被设置为实现结论、验收结论或页面迁移状态；
> `IMPLEMENTED` / `ACCEPTED` / `PAGE_MIGRATION_STARTED` 等词
> **仅用于否定性边界说明**。
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

- `DESIGN.md` §8 的候选实现方案在**本基线**中**仍未定案**（见该节 §8.5）；
  其唯一技术结论由**独立详细设计** `SHARED_COMPONENT_DESIGN.md` 作出，
  该结论（候选 §8.4 组合方式：显式根类 CSS 预设 + 有限 CSS 自定义属性令牌）
  已经 ChatGPT 远程 R2 复审 `REVIEW_PASS` 与项目负责人批准
  （`approval_scope=SHARED_IMPLEMENTATION_DETAILED_DESIGN_ONLY`，见 §8、§9）；
- 公共实现详细设计**已批准**（`shared_implementation_design_status=APPROVED`，
  `..._approval_status=APPROVED`）；但公共实现本身**仍未开始**（`NOT_STARTED`）；
- 数据源管理参考页**尚未接入**任何公共实现（`NOT_STARTED`）；
- **没有任何**业务页面获得迁移授权（`NOT_GRANTED`）。

规则批准**不等于**代码已经实现，**不等于**任何页面已经接入，
**也不等于**公共实现已开工。

### 7.3 `LIST_TABLE_PROPOSED_NOT_IMPLEMENTED`

含义：**候选实现与后续建议**——包括候选 CSS 预设、CSS 变量、Vue 轻包装、
组合方式、目录与令牌命名等。

**不得**把候选实现写成已实现（`IMPLEMENTED`），也**不得**把候选实现方案
写成已批准的实现设计。

> 阅读约定：凡描述当前代码行为的内容必须标注 `LIST_TABLE_REFERENCE_FACT`；
> 凡描述当前已批准模板规则的必须标注 `LIST_TABLE_TEMPLATE_APPROVED`；
> 凡描述未来实现或后续任务的必须标注 `LIST_TABLE_PROPOSED_NOT_IMPLEMENTED`。

### 7.4 标记计数：规范正文与历史报告分层

`LIST_TABLE_TEMPLATE_APPROVED` —— 批准收口后，标记计数必须**分层**解释，
**不得**再把“整个目录中出现的草案态字面量数量”当作“当前规范仍处于草案”的判断依据：

- **当前规范性文档**（四份，见 §8 导航）：使用批准态规则标记；
- **历史报告**（`reports/LIST-TABLE-VISUAL-TEMPLATE-BASELINE-001.md`、
  `reports/LIST-TABLE-VISUAL-TEMPLATE-BASELINE-001-R1.md`）：
  保留其产生时的**草案态规则标记**与 `DRAFT_PENDING_USER_REVIEW` /
  `BASELINE_DRAFT_ONLY` 等历史状态值；这些只代表**当时阶段**的真实状态，
  **不参与**当前规范状态判断，且**不得**修改历史报告来消除这些标记。

当前规范性文档计数（批准收口后实测）：

| 标记 | 批准前 | 批准后（当前） |
| --- | --- | --- |
| `LIST_TABLE_REFERENCE_FACT` | 22 | 22 |
| `LIST_TABLE_TEMPLATE_APPROVED` | 0 | 42 |
| `LIST_TABLE_PROPOSED_NOT_IMPLEMENTED` | 11 | 11 |

草案态规则标记在**规范正文**中的批准后计数为 `0`：该字面量只保留在历史报告中。

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
| `DESIGN.md` | 模板职责与 Feature 保留职责、启用与作用域隔离、行高与长文本策略、候选实现方案对比（不定案） |
| `UI.md` | 参考实现主表当前事实、可提升为已批准模板规则的视觉内容、必须保留为 Feature 专属的内容 |
| `MIGRATION.md` | 全量 `el-table` 使用点盘点矩阵、候选分类、逐页独立评估与授权要求 |
| `SHARED_COMPONENT_DESIGN.md` | **公共实现详细设计（已批准）**：四个候选的唯一结论、公共契约、Feature 保护项、参考页等价接入清单、验证与回滚设计（`approval_scope=SHARED_IMPLEMENTATION_DETAILED_DESIGN_ONLY`；**批准的是设计文档，不是实现**） |
| `reports/LIST-TABLE-VISUAL-TEMPLATE-BASELINE-001.md` | R0 建立任务的执行报告与校验证据（**历史报告，保留草案态标记，不修改**） |
| `reports/LIST-TABLE-VISUAL-TEMPLATE-BASELINE-001-R1.md` | R1 定向修订执行报告（**历史报告，保留草案态标记，不修改**） |
| `reports/LIST-TABLE-VISUAL-TEMPLATE-BASELINE-APPROVAL-CLOSEOUT-001.md` | 基线内容批准收口报告（历史执行报告，不修改） |
| `reports/LIST-TABLE-VISUAL-TEMPLATE-SHARED-IMPLEMENTATION-DESIGN-001.md` | 详细设计任务（R0）执行报告（**历史报告，保留当时草案态，不修改**） |
| `reports/LIST-TABLE-VISUAL-TEMPLATE-SHARED-IMPLEMENTATION-DESIGN-001-R1.md` | 详细设计 R1 定向修订执行报告（**历史报告，不修改**） |
| `reports/LIST-TABLE-VISUAL-TEMPLATE-SHARED-IMPLEMENTATION-DESIGN-001-R2.md` | 详细设计 R2 定向修订执行报告（**历史报告，不修改**） |
| `reports/LIST-TABLE-VISUAL-TEMPLATE-SHARED-IMPLEMENTATION-DESIGN-APPROVAL-CLOSEOUT-001.md` | 详细设计批准收口报告（本次） |

`SHARED_COMPONENT_DESIGN.md` 是**已批准的详细设计**：

- 其状态为 `shared_implementation_design_status=APPROVED` /
  `shared_implementation_design_approval_status=APPROVED`，
  但它**仍不是**已实现代码或生产可用产物——
  `shared_implementation_status` 保持 `NOT_STARTED`；
- 该文件沿用仓库既有文件名习惯，但其内容**不是**组件设计——
  唯一结论是一个 **CSS 样式预设 + 有限 CSS 自定义属性令牌**的方案
  （不引入 Vue 包装组件、不新增 DOM 层），准确术语以该文件 §0.1 / §3.2 为准；
- 该文件使用**独立**的设计决策标记（批准态），其计数**不**计入本 README §7.4
  的四份规范文档口径，也**不**包含本文件的草案态规则标记；
- 该设计的**实现**必须由**后续独立任务**承担，
  且**未经项目负责人再次明确批准不得修改任何代码**。

## 9. 后续阶段与授权边界

`LIST_TABLE_TEMPLATE_APPROVED` —— 阶段路径及其当前状态：

| # | 阶段 | 当前状态 |
| --- | --- | --- |
| 1 | ChatGPT 远程 Git 基线复审 | 已完成（R1 复审结论 `REVIEW_PASS`，`blocking_finding_count=0`） |
| 2 | 项目负责人批准基线内容 | 已完成（2026-09-21，`approval_scope=BASELINE_CONTENT_ONLY`） |
| 3 | 公共实现**详细设计**（`SHARED_COMPONENT_DESIGN.md`）与批准 | **已完成**（ChatGPT 远程 R2 复审 `REVIEW_PASS`、`blocking_finding_count=0`；项目负责人于 2026-09-21 批准，`approval_scope=SHARED_IMPLEMENTATION_DETAILED_DESIGN_ONLY`） |
| 4 | 公共实现与数据源管理参考页**等价接入** | **未开始**（`reference_page_integration_status=NOT_STARTED`） |
| 5 | 公共实现**正式验收**与最终接受 | **未运行**（`formal_acceptance_execution_status=NOT_RUN`） |
| 6 | 从 `MIGRATION.md` 矩阵中**逐页选择**并**单独授权**迁移 | **未授权**（`page_migration_authorization_status=NOT_GRANTED`） |

第 1、2、3 步完成**只**意味着**模板基线内容**与**详细设计文档**已批准；
第 4–6 步**均未开始**，**不得**把上述不同层级合并成模糊的“已完成”。
**批准详细设计 ≠ 批准实现 ≠ 批准参考页接入 ≠ 批准页面迁移。**

当前唯一下一入口：

```text
next_step=PUBLIC_IMPLEMENTATION_AND_REFERENCE_PAGE_EQUIVALENT_INTEGRATION_TASK_PENDING_SEPARATE_PROMPT_AND_PROJECT_OWNER_APPROVAL
```

`LIST_TABLE_PROPOSED_NOT_IMPLEMENTED` —— 下一步**只**允许准备
“公共实现 + 数据源管理参考页等价接入”的**独立任务提示词**并提交**项目负责人确认**；
**未经项目负责人再次明确批准不得修改任何代码**，也**不得**创建公共 CSS/TS 文件、
**不得**接入数据源管理、**不得**选择或迁移其他业务页面。

`LIST_TABLE_TEMPLATE_APPROVED` —— 授权边界：在**项目负责人明确授权之前**，
**不得**实施迁移、**不得**更新任何页面的迁移状态、**不得**为任何具体页面
（包括探针端管理、数据订阅）预先生成实施任务。
`MIGRATION.md` 的候选优先级**不等于**项目负责人批准的迁移顺序；
未来实际迁移页面**可能多于两个**。

## 10. 使用本模板的注意事项

- 本模板的**基线规则已批准**，可作为新建或调整页面主列表时的**评估依据**；
- 但**规则批准 ≠ 实现批准**：公共实现尚未开始，**不得**据此认为已存在公共组件或公共契约；
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
  已批准基线标记计数 `22 / 0 / 42 / 11` 与候选盘点 `15 / 14` **均未改变**。
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
  **批准详细设计 ≠ 批准实现**：公共实现、参考页接入与页面迁移**仍全部未开始/未授权**；
  已批准基线标记计数 `22 / 0 / 42 / 11` 与候选盘点 `15 / 14` **均未改变**。
  详见 `reports/LIST-TABLE-VISUAL-TEMPLATE-SHARED-IMPLEMENTATION-DESIGN-APPROVAL-CLOSEOUT-001.md`。
