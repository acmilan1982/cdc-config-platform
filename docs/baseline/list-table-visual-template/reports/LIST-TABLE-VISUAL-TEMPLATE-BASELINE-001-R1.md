# LIST-TABLE-VISUAL-TEMPLATE-BASELINE-001-R1 执行报告

- 任务编号：`LIST-TABLE-VISUAL-TEMPLATE-BASELINE-001-R1`
- 任务性质：`DOCS_ONLY_TARGETED_CORRECTION`（**纯文档定向修订**）
- 日期：2026-09-21
- 分支：`develop`
- 基准提交：`52207283660a1aa76e5cd7a2b303ed5c97e9f32f`
- ChatGPT 远程 R0 复审结论：`CHANGES_REQUIRED`
- 本报告为**新增**文件；原 R0 报告
  `LIST-TABLE-VISUAL-TEMPLATE-BASELINE-001.md` **未被修改**，作为历史过程证据保留。

> 本任务**只**修正 ChatGPT 远程 Git 复审确认的三处文档口径问题。
> **未**重新设计模板、**未**修改代码、**未**实施公共能力、**未**接入参考页、
> **未**迁移任何页面。

---

## 1. 基准与 Git 现场

```text
branch=develop
base_commit_id=52207283660a1aa76e5cd7a2b303ed5c97e9f32f
HEAD(before)=52207283660a1aa76e5cd7a2b303ed5c97e9f32f
origin/develop(before)=52207283660a1aa76e5cd7a2b303ed5c97e9f32f
git ls-remote origin refs/heads/develop (before)=52207283660a1aa76e5cd7a2b303ed5c97e9f32f
rev-list --left-right --count HEAD...origin/develop (before) = 0	0
```

- 任务开始前工作区已有的 `.claude/settings.local.json`（修改）与 `docs/prompts/`（未跟踪）
  属用户现场，本任务**未**修改、**未**暂存、**未**提交、**未**回滚。

## 2. 三项修正

### 2.1 序号列职责口径统一

**原冲突**：`UI.md` §2 第 6 项把“序号列为窄列、居中、等宽弱化数字”列为可提升的
公共草案规则；`DESIGN.md` §7 又把序号列特殊排版列为 Feature 专属、不得提升为公共业务语义。

**修正结论**（`LIST_TABLE_TEMPLATE_DRAFT`）：

1. 是否存在序号列，由各 Feature 决定；
2. 序号列的宽度、编号算法、是否居中、字号、颜色、等宽数字等具体排版，**默认属 Feature**；
3. 公共模板**不得**要求所有主列表必须具有序号列；
4. 公共模板**不得**默认注入数据源管理现有的
   `width=70` / `align=center` / `font-size:13px` / `color:#71717a` /
   `font-variant-numeric:tabular-nums`；
5. 后续详细设计如认为序号列样式具有复用价值，只能作为**可选扩展能力**另行评估，
   不得在本基线草案中提前定案。

**落点**：

- `UI.md` §1.5（数据源管理序号列**参考实现事实**）**原样保留**；
- `UI.md` §2 原有的“序号列纪律”条目**删除**，并在同处新增“明确不纳入公共规则”段，
  写明上述结论；
- `DESIGN.md` §2 保留职责表新增“序号列”行，§7 序号列条目补充具体维度，
  并新增一段与 §2 一致的口径说明；
- 未新增公共序号组件、CSS 类、变量或 Props；未修改数据源管理源码。

### 2.2 空态职责口径统一

**原冲突**：`UI.md` §2 第 9 项规定主表空态采用“两级文案”；
`DESIGN.md` §2 把空态文案及单行/两级层级列为 Feature 保留职责。

**修正结论**（`LIST_TABLE_TEMPLATE_DRAFT`）：

1. 空态文案、文案层级、是否区分“无数据”与“查询无结果”，均由 Feature 决定；
2. 公共表格视觉模板**不得**规定所有主列表必须使用两级空态；
3. 数据源管理现有两级空态仅作为**参考实现事实**保留；
4. 后续详细设计如需提供空态视觉扩展点，应另行设计，
   不得内置业务文案或强制单行 / 两级结构。

**落点**：

- `UI.md` §1.8（数据源管理两级空态**参考实现事实**）**原样保留**；
- `UI.md` §2 原有的“空态纪律”条目**删除**，并在同处新增“明确不纳入公共规则”段，
  写明上述结论；
- `DESIGN.md` §2 空态行细化为“空态文案、层级（单行 / 两级）、
  是否区分‘无数据’与‘查询无结果’”，并新增与 §2 一致的口径说明段；
- `README.md` §3“明确不规定”清单补充“序号列”与“空态”两项，使三份文档边界一致；
- **未**修改 `query-list-page-template` 的结果区或空态契约。

### 2.3 README 状态表述修正

**原表述**（不可成立）：

```text
APPROVED / IMPLEMENTED / ACCEPTED / PAGE_MIGRATION_STARTED
均未被写入本目录任何文档
```

这些字面量已作为**否定性说明**出现在本目录文档中，故原表述不成立。

**修正后**：

```text
上述词仅用于否定性边界说明，均未被设置为本目录的当前状态、批准结论、实现结论、验收结论或页面迁移状态。
```

**落点**：`README.md` 文件头引用块（原“均**未被写入**本目录任何文档”一句）。

修正后仍明确保持以下状态（**未**改为 `APPROVED` / `IMPLEMENTED` / `ACCEPTED` /
`PAGE_MIGRATION_STARTED`）：

```text
document_status=DRAFT_PENDING_USER_REVIEW
design_status=BASELINE_DRAFT_ONLY
shared_implementation_design_status=NOT_STARTED
shared_implementation_status=NOT_STARTED
reference_page_integration_status=NOT_STARTED
formal_acceptance_execution_status=NOT_RUN
page_migration_status=NOT_STARTED
page_migration_authorization_status=NOT_GRANTED
```

## 3. 序号列最终职责

`LIST_TABLE_TEMPLATE_DRAFT` —— **默认属 Feature**：是否存在、列宽、编号算法、
是否居中、字号、颜色、等宽数字排版均由各 Feature 决定；公共模板不要求主列表必须有序号列，
也不默认注入数据源管理的既有序号列数值。数据源管理当前序号列样式只作为
**参考实现事实**保留（`UI.md` §1.5），不是公共默认规则。

## 4. 空态最终职责

`LIST_TABLE_TEMPLATE_DRAFT` —— **默认属 Feature**：空态文案、层级（单行 / 两级）、
是否区分“无数据”与“查询无结果”均由各 Feature 决定；公共模板不规定必须使用两级空态。
数据源管理当前两级空态只作为**参考实现事实**保留（`UI.md` §1.8），不是公共默认规则。

## 5. README 状态表述修正结果

- 删除原“均未被写入本目录任何文档”的不成立表述；
- 改为：“`APPROVED` / `IMPLEMENTED` / `ACCEPTED` / `PAGE_MIGRATION_STARTED` 等词
  **仅用于否定性边界说明**（例如“不得把草案写成已批准”），均**未**被设置为本目录的
  当前状态、批准结论、实现结论、验收结论或页面迁移状态。”
- 草案状态块逐字不变。

## 6. 修改文件清单

```text
changed_files=docs/baseline/list-table-visual-template/README.md,docs/baseline/list-table-visual-template/UI.md,docs/baseline/list-table-visual-template/DESIGN.md,docs/baseline/list-table-visual-template/reports/LIST-TABLE-VISUAL-TEMPLATE-BASELINE-001-R1.md
```

- 修改（3）：`README.md`、`UI.md`、`DESIGN.md`；
- 新增（1）：本报告 `LIST-TABLE-VISUAL-TEMPLATE-BASELINE-001-R1.md`；
- **未**修改 R0 报告（`LIST-TABLE-VISUAL-TEMPLATE-BASELINE-001.md`）与 `MIGRATION.md`；
- **未**修改 `query-list-page-template/**`；**未**修改 `frontend/**`、`backend/**`、
  `docs/features/**`、测试代码、配置、依赖或锁文件。

## 7. 标记计数修订前后

```text
marker_count_before=32/38/13
marker_count_after=34/47/15
marker_count_change_reason=正文修订（UI.md §2 改写、DESIGN.md §2/§7 补充、README.md §3 与状态表述修改）和新增本 R1 报告
```

`LIST_TABLE_REFERENCE_FACT` / `LIST_TABLE_TEMPLATE_DRAFT` /
`LIST_TABLE_PROPOSED_NOT_IMPLEMENTED` 三个标记均**未**被删除或重命名；
计数变化仅因正文修订与新增报告，且已同步到 `README.md` §7.4 的真实结果。

## 8. 计数实测（核验命令）

在仓库根执行：

```bash
for m in LIST_TABLE_REFERENCE_FACT LIST_TABLE_TEMPLATE_DRAFT LIST_TABLE_PROPOSED_NOT_IMPLEMENTED; do
  printf "%-36s %s\n" "$m" "$(grep -roF "$m" docs/baseline/list-table-visual-template/ | wc -l)"
done
```

实测结果：

```text
marker_count_after=34/47/15
```

## 9. 冻结不变量（未改动）

```text
candidate_inventory_status=UNCHANGED_15_USAGES_14_FILES
REFERENCE_PAGE=1 / CANDIDATE_HIGH=4 / CANDIDATE_MEDIUM=3 / CANDIDATE_LOW=0
EXCLUDED_NON_MAIN_TABLE=6 / NEEDS_SEPARATE_EVALUATION=1
reference_page=数据源管理（参考页事实不变）
与 query-list-page-template 正交、可组合、互不自动授权（关系不变）
query_list_template_change_status=NONE
query_list_template_frozen_marker_status=UNCHANGED（48/43/9 与 66 未变）
```

## 10. 状态与下一入口

```text
document_status=DRAFT_PENDING_USER_REVIEW
design_status=BASELINE_DRAFT_ONLY
shared_implementation_design_status=NOT_STARTED
shared_implementation_status=NOT_STARTED
reference_page_integration_status=NOT_STARTED
formal_acceptance_execution_status=NOT_RUN
page_migration_status=NOT_STARTED
page_migration_authorization_status=NOT_GRANTED
```

```text
next_step=CHATGPT_REMOTE_GIT_LIST_TABLE_VISUAL_TEMPLATE_BASELINE_R1_REVIEW_THEN_PROJECT_OWNER_APPROVAL
```

## 11. 明确未执行事项

- 未修改 `frontend/**`、`backend/**`、`docs/features/**`、测试代码、配置、依赖或锁文件；
- 未新建 CSS / Vue 组件 / Composable / TS 类型 / 路由元数据；
- 未编写 `SHARED_COMPONENT_DESIGN.md`；未为公共实现选择最终技术方案；
- 未接入或修改数据源管理参考页；未迁移任何页面；未生成任何页面迁移实施任务；
- 未运行测试或构建；未启动 / 停止 / 重启服务；未调用 HTTP 接口；
- 未访问或写入数据库；未访问 ZooKeeper / Kafka / 业务源库 / 目标库；
- 未修改、暂存或提交任务外文件（`.claude/settings.local.json`、`docs/prompts/`）。
