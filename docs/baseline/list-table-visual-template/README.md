# 列表表格视觉模板 · 基线草案

```text
list_table_visual_template_document_status=DRAFT_PENDING_USER_REVIEW
list_table_visual_template_design_status=BASELINE_DRAFT_ONLY
shared_implementation_design_status=NOT_STARTED
shared_implementation_status=NOT_STARTED
reference_page_integration_status=NOT_STARTED
formal_acceptance_execution_status=NOT_RUN
page_migration_status=NOT_STARTED
page_migration_authorization_status=NOT_GRANTED
candidate_inventory_status=COMPLETED_PENDING_USER_REVIEW
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

> 本目录由**纯文档任务** `LIST-TABLE-VISUAL-TEMPLATE-BASELINE-001` 建立。
> 该任务**未创建任何 CSS、Vue 组件、Composable、TypeScript 类型或路由元数据**，
> **未修改** `frontend/**`、`backend/**`、测试代码、配置、依赖或锁文件，
> **未修改**数据源管理页面或任何其他页面，
> **未运行**测试、构建、浏览器或任何服务，
> **未访问**数据库 / ZooKeeper / Kafka / 业务源库 / 目标库。
>
> `list_table_visual_template_document_status=DRAFT_PENDING_USER_REVIEW`
> **只表示**草案正文已产出、**等待项目负责人审阅**，
> **不表示**已批准、**不表示**已实现、**不表示**任何页面已迁移。
> `APPROVED` / `IMPLEMENTED` / `ACCEPTED` / `PAGE_MIGRATION_STARTED`
> 均**未被写入**本目录任何文档。

## 1. 本模板的目标

`LIST_TABLE_TEMPLATE_DRAFT` —— 本模板要回答的问题：一个页面的**主列表表格**
（表头、正文、间距、边框、行高策略、长文本与扩展边界）应当遵循什么**项目级视觉与结构纪律**，
使得多个页面的主列表在视觉上收敛，同时**不**剥夺业务页面自己的列定义、状态语义与交互。

本模板**不是**另一套完整页面模板。它只覆盖“表格”这一层，**不**覆盖页面标题、查询区、
结果区外壳、刷新工具栏与请求交互——那些属于 `query-list-page-template`（见 §5）。

## 2. 适用范围

`LIST_TABLE_TEMPLATE_DRAFT`：

- 适用对象：**页面的主列表表格**——即页面结果区中承载该页面主要业务记录集的
  那一张 `el-table`；
- 主要参考实现：**数据源管理主列表**（`/config/data-source`，
  `frontend/src/views/data-source/DataSourcePage.vue`）；
- 适用前提：该主列表是页面的**记录浏览主体**，而不是弹窗内的临时编辑表、
  详情页的子表、确认对话框表格或大屏/复合视图内的嵌表。

## 3. 不适用范围

`LIST_TABLE_TEMPLATE_DRAFT`——以下**不在**本模板自动覆盖范围内：

- **弹窗内表格**（新建/编辑弹窗、命名策略弹窗等）；
- **详情子表**（详情页中随主记录展开的从属表格）；
- **确认表格**（保存/删除前展示待变更项的确认清单）；
- **大屏/复合视图**（看板卡片内嵌表、多客户端卡片列表等）；
- **非 `el-table` 的展示型列表**。

以上形态如需纳入，必须**逐项独立评估**并**独立授权**，不得由本模板自动扩张覆盖。

`LIST_TABLE_TEMPLATE_DRAFT`——本模板**明确不**规定：

- 页面标题、查询区、结果区外壳、刷新工具栏、请求交互（属 `query-list-page-template`）；
- 业务列的名称、数量、顺序、列宽与 `min-width`；
- 数据获取、loading/错误处理、分页策略；
- 行操作按钮、固定列的取舍；
- 状态标签的配色与文案。

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

`LIST_TABLE_TEMPLATE_DRAFT` —— 本模板与 `query-list-page-template`（qlpt）是
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

`LIST_TABLE_TEMPLATE_DRAFT` —— 本模板的作用对象**只有页面主列表表格**。

仓库内全部 `el-table` 使用点的盘点矩阵见 `MIGRATION.md`。矩阵中的**非主列表表格**
（弹窗表格、详情子表、确认表、大屏/复合表）被显式归入
`EXCLUDED_NON_MAIN_TABLE` 或 `NEEDS_SEPARATE_EVALUATION`，
**不**由本模板自动覆盖。

## 7. 三类事实分层与唯一标记

本目录全文只使用**三个**标记，彼此**不重叠**，任何一处措辞必须能对应到其中一类。

### 7.1 `LIST_TABLE_REFERENCE_FACT`

含义：**参考实现当前事实**——只能在基准提交
`10b1d3e39d03dbb78ea409d486f1f3e80c12fc3e` 的真实源码中直接验证的内容。

**不得**把参考事实写成模板规范。

### 7.2 `LIST_TABLE_TEMPLATE_DRAFT`

含义：**本草案提出的模板规则**——尚未经 ChatGPT 远程复审与项目负责人批准。

**不得**把草案规范写成已批准（`APPROVED`）。草案规范在本阶段
**不具有强制规范效力**（见 `../DEVELOPMENT_RULES.md`）。

### 7.3 `LIST_TABLE_PROPOSED_NOT_IMPLEMENTED`

含义：**候选实现与后续建议**——包括候选 CSS 预设、CSS 变量、Vue 轻包装、
组合方式、目录与令牌命名等。

**不得**把候选实现写成已实现（`IMPLEMENTED`）。

> 阅读约定：凡描述当前代码行为的内容必须标注 `LIST_TABLE_REFERENCE_FACT`；
> 凡描述本草案规则的必须标注 `LIST_TABLE_TEMPLATE_DRAFT`；
> 凡描述未来实现或后续任务的必须标注 `LIST_TABLE_PROPOSED_NOT_IMPLEMENTED`。

### 7.4 标记计数（本草案冻结基线）

本目录建立时，三个标记的出现次数如下（含本文件 §7 中作为定义出现的实例）；
后续修订必须**显式**记录计数变化：

| 标记 | 计数 |
| --- | --- |
| `LIST_TABLE_REFERENCE_FACT` | 32 |
| `LIST_TABLE_TEMPLATE_DRAFT` | 38 |
| `LIST_TABLE_PROPOSED_NOT_IMPLEMENTED` | 13 |

核验命令（在仓库根执行）：

```bash
for m in LIST_TABLE_REFERENCE_FACT LIST_TABLE_TEMPLATE_DRAFT LIST_TABLE_PROPOSED_NOT_IMPLEMENTED; do
  printf "%-36s %s\n" "$m" "$(grep -roF "$m" docs/baseline/list-table-visual-template/ | wc -l)"
done
```

本目录标记与 `query-list-page-template` 的冻结计数**互不影响**：
两套标记字面量前缀不同、目录不同，**不共享**计数。

## 8. 文档导航

| 文件 | 内容 |
| --- | --- |
| `README.md` | 本文件：状态、目标、范围、参考实现、与 qlpt 的关系、标记分层、导航与变更记录 |
| `DESIGN.md` | 模板职责与 Feature 保留职责、启用与作用域隔离、行高与长文本策略、候选实现方案对比（不定案） |
| `UI.md` | 参考实现主表当前事实、可提升为草案规则的视觉内容、必须保留为 Feature 专属的内容 |
| `MIGRATION.md` | 全量 `el-table` 使用点盘点矩阵、候选分类、逐页独立评估与授权要求 |
| `reports/LIST-TABLE-VISUAL-TEMPLATE-BASELINE-001.md` | 本任务的执行报告与校验证据 |

**本目录当前不包含 `SHARED_COMPONENT_DESIGN.md`**：公共实现形态尚未经过详细设计
与批准，因此本轮不产出该文件。待基线与实现形态获批后，由**后续独立任务**创建。

## 9. 后续阶段与授权边界

`LIST_TABLE_PROPOSED_NOT_IMPLEMENTED` —— 本阶段之后的路径（**均未开始**）：

1. 本基线草案经 ChatGPT 远程 Git 复审；
2. 项目负责人批准基线；
3. 公共实现**详细设计**（未来 `SHARED_COMPONENT_DESIGN` 类任务）与批准；
4. 公共实现与数据源管理参考页**等价接入**；
5. 公共实现**正式验收**与最终接受；
6. 从 `MIGRATION.md` 矩阵中**逐页选择**并**单独授权**迁移。

当前唯一下一入口：

```text
next_step=CHATGPT_REMOTE_GIT_LIST_TABLE_VISUAL_TEMPLATE_BASELINE_REVIEW_THEN_PROJECT_OWNER_APPROVAL
```

`LIST_TABLE_TEMPLATE_DRAFT` —— 授权边界：在**项目负责人明确授权之前**，
**不得**实施迁移、**不得**更新任何页面的迁移状态、**不得**为任何具体页面
（包括探针端管理、数据订阅）预先生成实施任务。
`MIGRATION.md` 的候选优先级**不等于**项目负责人批准的迁移顺序；
未来实际迁移页面**可能多于两个**。

## 10. 使用本模板草案的注意事项

- 本模板当前是**草案**，**不具有强制规范效力**；
- 数据源管理当前视觉是**参考实现**，**不得**自动上升为全部页面必须遵守的既定规范；
- 参考实现的列定义、状态标签语义、行操作、固定列、双击行为均属其 Feature 专属；
- 本模板**未**定义、**未**测量、**未**修改任何行高、字号或颜色的“权威值”；
  凡参考源码未显式定义的值，均标注为“继承现状、待详细设计/浏览器量测确认”；
- 后续页面必须**逐页评估**，不能批量无差别套用。

## 11. 变更记录

- 2026-09-21，建立列表表格视觉模板基线草案
  （`LIST-TABLE-VISUAL-TEMPLATE-BASELINE-001`，纯文档任务）。
