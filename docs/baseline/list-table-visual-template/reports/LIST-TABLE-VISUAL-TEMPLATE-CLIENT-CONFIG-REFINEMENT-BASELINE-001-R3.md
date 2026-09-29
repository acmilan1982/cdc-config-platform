# 列表表格视觉模板参照修正草案 R3 定向纠错 · 执行报告

## 1. 任务身份与停点

```text
task_code=LIST-TABLE-VISUAL-TEMPLATE-CLIENT-CONFIG-REFINEMENT-BASELINE-001-R3
task_type=DOCS_ONLY_TARGETED_CORRECTION_FACT_MARKER_AND_TIME_POINT
branch=develop
base_commit_id=732d6df12215f0036f27dcbe8367bbb172f1fd47
```

- 类型：**纯文档定向纠错**。本轮**只**修正 `LIST-TABLE-VISUAL-TEMPLATE-CLIENT-CONFIG-REFINEMENT-BASELINE-001-R2`
  远程文档复审（`CHANGES_REQUIRED`）指出的**两处**问题：`SHARED_COMPONENT_DESIGN.md` §12.1 的
  **参考事实段**覆盖了**尚未实现**的禁用态视觉；§12.3 在参考事实标记下把**调整前测量与设计阶段讨论**
  误写成**现行事实**。
- **不**实施新样式、**不**批准 `SHARED_COMPONENT_DESIGN.md` §13 新可选契约、**不**改任何代码 / 测试 / 共享 CSS、
  **不**修改任何验收定义行 / 状态格、**不**执行验收。
- 纠错完成后停在 `CHATGPT_REMOTE_LIST_TABLE_VISUAL_TEMPLATE_CLIENT_CONFIG_REFINEMENT_BASELINE_R3_REVIEW`；
  **不**自行宣布 R3 复审通过、草案已批准或模板级迁移获授权。

## 2. 门禁与基准（开工前）

- 当前分支 `develop`；本地 HEAD 与 `origin/develop`、远程 `refs/heads/develop` 三方均为
  `732d6df12215f0036f27dcbe8367bbb172f1fd47`；`git rev-list --left-right --count origin/develop...HEAD` = `0 0`（无分叉）。
- 开工前已存在的无关工作区更改（**未**暂存、**未**提交、**未**覆盖）：`.claude/settings.local.json`（`M`）、
  `docs/prompts/`（`??`）、`runtime-logs/`（`??`）。
- 只读核对的真实事实（**未修改**）：
  - `frontend/src/styles/list-table/list-table-visual.css` —— 仅含受 `.lt-main-table` 限定的
    `td.el-table__cell.lt-row-action__cell`（`padding: 9.5px 0`）与 `.lt-row-action__ellipsis`
    （`28×28px`、圆角 `6px`、主色、`:hover`、`:focus-visible` 内嵌 `outline-offset: -2px`）两条 opt-in 规则；
    **无**任何禁用态视觉规则；
  - `docs/features/client-config/ACCEPTANCE.md` §4 状态格：`CCFG-AC-010` = **`PASS`**、
    `CCFG-AC-155` = **`BLOCKED`**、`CCFG-AC-156` = **`BLOCKED`**、`CCFG-AC-157` = **`BLOCKED`**；
    §1.24 第七轮统计 `PASS 70 / FAIL 0 / BLOCKED 72 / NOT_RUN 15`（合计 157）；
  - `docs/features/client-config/reports/CLIENT-CONFIG-ROW-HEIGHT-AND-OPTIONAL-ELLIPSIS-IMPLEMENTATION-001.md`
    与其 `evidence/…-001/`、`…-001-R1/`（真实 `100%`／`125%` 缩放证据）—— 调整前探针常规行 `53px`、
    参考页 `48px`；调整后常规可比行 `1440×900`／`1920×1080` 各 15 条约 `48 CSS px`（逐条差值 `0`）、
    真实 `125%` 缩放约 `47.8 CSS px`、歧义行 `S15` `52px`／`51.8px`（自适应观察组）。

## 3. R3 只修正的两处

### 3.1 R3-01：§12.1 禁用态职责与事实标记

R2 已把「禁用态视觉规则尚未实现」独立标为候选未实现标记，**方向正确**；但紧随其后的参考事实段末句
又写「公共层**只**在该禁用状态**存在且被页面显式启用**时**负责**其**通用视觉呈现**」，使**未实现**的
公共规则重新混入**现行实现事实**。

**纠正**：参考事实段**只**写**现行已成立**的业务职责与代码事实——菜单、权限、**是否 / 何时禁用**由
Feature 决定，且**现行探针端三点触发器未出现可观察的禁用场景**（现行被禁用者是**菜单项**）；
引用公共视觉职责时**只**指向上一段的**待实现设计契约**（`拟`由公共样式契约负责、**未来设计职责**、
**非**现行事实）。候选段继续明确：现行 CSS 无该规则、属**设计契约、尚未实现、尚未验收**、
`CCFG-AC-157` 仍 `BLOCKED`，**不**为现行探针三点触发器强造禁用情形。§13.2 交叉引用同步澄清
「**拟**由公共层负责（**未来设计职责**，**非**现行实现事实）」。

### 3.2 R3-02：§12.3 行高与验收的时点

R2 的 §12.3 在参考事实标记下称探针常规行约 `53px`、`CCFG-AC-010`「现行 `BLOCKED`」，并写
「可选做法」「待验证方案」，把**调整前测量与设计阶段讨论**误写成**现行事实**。

**纠正**：

1. 明确 `53px` 是**第七轮行高调整前**的历史测量，同期数据源参考页约 `48px`，差值为布局分析的**历史依据**；
   **该 `53px` 不是探针端现行常规行高**。
2. 另立**现行已实现**盒模型与测量段：opt-in 操作单元格 `9.5px 0` 纵向内边距补偿、触发器 `28×28px`、
   常规可比行在**真实 `100%` 缩放**下 `1440×900` 与 `1920×1080` 各 15 条约 `48 CSS px`（逐条差值 `0`，
   预置容差 ≤ `1` CSS px）、**真实 `125%` 缩放**下约 `47.8 CSS px`；异常／歧义与长内容行仍**内容驱动**、
   不强制等高（歧义行 `S15` `52px`／`51.8px` 归自适应观察组）。缩放测值以**真实缩放**证据为准，
   **不**以窄视口模拟替代真实缩放。
3. 另立**现行验收状态**段：`CCFG-AC-010` 现行状态格为 **`PASS`**（第七轮定向验收按现行有效定义独立重判，
   `BLOCKED → PASS`）；`CCFG-AC-155~157` 现行状态格为 **`BLOCKED`**；出处 `ACCEPTANCE.md` §4／§1.24；
   **本轮不新跑验收、不修改任何验收状态格**。
4. 把「可选做法／`:has()`／`overflow: visible` 待验证」等**设计阶段**内容归入**历史推导**；
   现行采用的内边距补偿与盒内 `outline-offset: -2px` 按真实代码／浏览器证据表述（`LIST_TABLE_REFERENCE_FACT`
   只覆盖**已落地事实与准确标注的历史测量**，**不**覆盖仍称「待验证」的未来方案）。
5. §12.5 仅作**同一时点澄清**（该清单原为设计阶段拟核对项，均已由实现阶段真实浏览器核对覆盖）。

## 4. 逐文件改动与旧 → 新位置

实际改动 **3** 个既有文件 + **1** 个新建报告；`DESIGN.md`、`UI.md` **未**改动（在允许范围内、非必需）。

### 4.1 `SHARED_COMPONENT_DESIGN.md`

| 位置 | 旧表述性质 | 新表述 | 证据 |
| --- | --- | --- | --- |
| §12.1 候选段（禁用态视觉） | 「由公共样式契约负责」 | 「**拟**由公共样式契约负责（**未来设计职责**，**非**现行实现事实）」 | CSS 无禁用态规则 |
| §12.1 参考事实段末句 | 「公共层只在该禁用状态存在且被页面显式启用时负责其通用视觉呈现」 | 只写现行事实（现行三点触发器**无可观察禁用场景**）+ 指向上一段**待实现设计契约** | `ACCEPTANCE.md` §1.24 `CCFG-AC-157`；CSS |
| §12.3 首段 | 参考事实标记下称探针常规行约 `53px`、`CCFG-AC-010` 现行 `BLOCKED` | 明确 `53px` 为**调整前历史测量**（同期参考页 `48px`）；**不是**现行值 | 实现任务报告 §4.3／§5.2 |
| §12.3 新增两段 | —（原无独立现行测量／验收段） | 新增**现行已实现盒模型与测量**段（`9.5px 0`、`28×28px`、约 `48 CSS px`、真实 `100%`／`125%` 缩放、歧义行 `52px`）与**现行验收状态**段（`CCFG-AC-010` `PASS`、`CCFG-AC-155~157` `BLOCKED`） | 实现任务报告 + `evidence/…-001/`、`…-001-R1/`；`ACCEPTANCE.md` §4／§1.24 |
| §12.3「设计主张 + 三条 bullet」段 | 参考事实标记下写「可选做法」「不采用」 | 改为无标记的**历史设计推导**段（可选做法已落地为现行 `9.5px 0`；不采用项仍未采用） | 实现任务报告 §4.3 |
| §12.3「已知阻力…待验证 `:has()`」段 | 参考事实标记下写「待验证方案」 | 改为**已知阻力与现行终解**（内边距补偿 + 盒内 `outline-offset: -2px`）；`overflow: visible` 备选归**历史推导** | CSS + R1 真实缩放证据 |
| §12.3「边界强调」段 | 「行高补偿（若有）…必须真实浏览器核对」 | 改为现行已完成核对（含真实缩放）的表述 | 实现任务报告 §5.2 |
| §12.5 标题 + 首段 | 「（设计已批准、已实现待远程复审）」+「待验证项」 | 「（设计已批准；实现阶段已核对）」+ 明示原为设计阶段拟核对项、均已由实现阶段核对覆盖 | 实现任务报告 §5.2 |
| §13.2 禁用态职责段 | 「由公共层负责」 | 「**拟**由公共层负责（**未来设计职责**，**非**现行实现事实）」 | §12.1 一致口径 |
| §12.8 标题 + 末段 | 「R2 标记纠正后收敛」 | 标题加「R3 定向纠错后复测」；新增 R3 复测段（四通道实测） | 逐文件复算 |

### 4.2 `README.md`

- §11 变更记录追加 **R3 定向纠错**条目：记录两处纠错、四通道计数（四份文档 `28 / 0 / 42 / 8` 不变、
  `SHARED_COMPONENT_DESIGN.md` 参考事实 `24 → 25`、候选未实现 `10` 不变）、边界与下一入口。

### 4.3 `MIGRATION.md`

- 追加「模板整理任务 **R3 定向纠错**追加记录」：记录 R3-01／R3-02 两处纠正、四通道计数、
  errata／override 口径、R2 入口已成历史入口、以及「提交与推送成功 ≠ 远程复审通过」边界。

### 4.4 新建报告

- 本文件 `reports/LIST-TABLE-VISUAL-TEMPLATE-CLIENT-CONFIG-REFINEMENT-BASELINE-001-R3.md`。

## 5. 标记计数（逐文件复算，非硬编码）

**通道 1：四份规范文档**（`README.md`／`DESIGN.md`／`UI.md`／`MIGRATION.md`，**不**扫描本文件）

| 文件 | `REFERENCE_FACT` | `TEMPLATE_APPROVED` | `PROPOSED_NOT_IMPLEMENTED` |
| --- | --- | --- | --- |
| `README.md` | 7 | 16 | 5 |
| `DESIGN.md` | 5 | 14 | 1 |
| `UI.md` | 12 | 8 | 0 |
| `MIGRATION.md` | 4 | 4 | 2 |
| **合计** | **28** | **42** | **8** |

- R2 时点 `28 / 0 / 42 / 8`（顺序：参考事实 / 草案态 / 已批准规则 / 候选未实现）；
  **R3 后仍为 `28 / 0 / 42 / 8`**——**不变**（R3 未改四份文档任何标记实例）。

**通道 2：本文件批准态设计标记**（`LIST_TABLE_SHARED_DESIGN_APPROVED`）
—— **`79`**（**不变**；R3 未新增／删除任何批准态设计标记实例）。

**通道 3：本文件参考事实标记**（`LIST_TABLE_REFERENCE_FACT`）—— **`25`**（R2 时点 `24`，`+1`）。
分布：§12 节内 `17` 处（节导语 + §12.1×2 + §12.2×4 + **§12.3×5** + §12.4×2 + §12.5×1 + §12.7×1），
其余 `8` 处为 §0.1／§11.2／§11.3／§12.8 的说明文字与核验命令。
`+1` 来自 §12.3 拆分出**现行已实现盒模型与测量**段与**现行验收状态**段（`4 → 5` 处），
均为**已落地事实**，属参考事实标记口径。

**通道 4：本文件候选未实现标记**（`LIST_TABLE_PROPOSED_NOT_IMPLEMENTED`）—— **`10`**（**不变**）。
分布：§12.1 **禁用态视觉** `1`、§13 内 `2`、其余 `7` 处为 §0.1／§11.2／§11.3／§12.8 的说明文字与核验命令。

各通道**严格不混算**。候选盘点不变量 `el_table_usage_count=15` / `el_table_file_count=14` **不变**。

**可复现核验命令**（在仓库根执行）：

```bash
docs=docs/baseline/list-table-visual-template

# 通道 1：四份规范文档（不扫描本文件）
for m in LIST_TABLE_REFERENCE_FACT LIST_TABLE_TEMPLATE_APPROVED LIST_TABLE_PROPOSED_NOT_IMPLEMENTED; do
  printf "%-38s %s\n" "$m" "$(grep -ohF "$m" "$docs"/{README,DESIGN,UI,MIGRATION}.md | wc -l)"
done
# 期望 28 / 42 / 8

# 通道 2：本文件批准态设计标记（拼接构字避免自计）
approved_marker="LIST_TABLE_SHARED_DESIGN_""APPROVED"
grep -ohF "$approved_marker" "$docs/SHARED_COMPONENT_DESIGN.md" | wc -l   # 期望 79

# 通道 3：本文件参考事实标记
ref_marker="LIST_TABLE_REFERENCE_""FACT"
grep -ohF "$ref_marker" "$docs/SHARED_COMPONENT_DESIGN.md" | wc -l      # 期望 25

# 通道 4：本文件候选未实现标记
cand_marker="LIST_TABLE_PROPOSED_""NOT_IMPLEMENTED"
grep -ohF "$cand_marker" "$docs/SHARED_COMPONENT_DESIGN.md" | wc -l     # 期望 10

# 草案态规则标记在四份规范正文中应清零
draft_marker="LIST_TABLE_TEMPLATE_""DRAFT"
grep -ohF "$draft_marker" "$docs"/{README,DESIGN,UI,MIGRATION}.md | wc -l   # 期望 0
```

## 6. errata / override（对 R0／R1／R2 关于现行事实结论的纠正）

- R2 报告与 `SHARED_COMPONENT_DESIGN.md` §12.1／§12.3、`README.md` §11 中
  **「§12.1 参考事实段可包含公共层对禁用态外观的负责」**与
  **「§12.3 在参考事实标记下称探针常规行约 `53px`、`CCFG-AC-010` 现行 `BLOCKED`」**的结论**失效**。
  自 R3 起：§12.1 参考事实段**只**覆盖现行已成立事实（现行三点触发器无可观察禁用场景），
  禁用态外观属**待实现设计契约**；§12.3 明确 `53px` 为**调整前历史测量**，现行常规可比行约 `48 CSS px`，
  现行验收状态为 `CCFG-AC-010` `PASS`、`CCFG-AC-155~157` `BLOCKED`。
- R0／R1／R2 报告**原样保留、不回写**；本报告以 **errata／override** 方式承接，并说明历史时点值
  （四份文档 `28 / 0 / 42 / 8`、本文件参考事实 `24`、候选未实现 `10`）为**当时实测**，
  与 R3 现行值（四份文档 `28 / 0 / 42 / 8`、参考事实 `25`、候选未实现 `10`）**区分**。
- 本轮**只**修正该「**事实标记覆盖未实现项**」与「**调整前测量／设计阶段措辞被写成现行事实**」两类问题；
  R1／R2 已修正的其他结论（禁用态两级职责的**分界**、§12.7 #11 判定、§7.3 阅读约定）**维持**，本轮不重复改动。

## 7. 状态分层（草拟 / 已批准 / 已实现 / 待验收 / 验收状态）

| 事项 | 状态 | 本轮是否改变 |
| --- | --- | --- |
| 本模板基线内容 | `APPROVED` / `BASELINE_APPROVED` | 否 |
| 公共实现详细设计 | `APPROVED` | 否 |
| 公共实现 + 数据源参考页接入 | `IMPLEMENTED_ACCEPTED` / `ACCEPTED_BY_PROJECT_OWNER` | 否 |
| 第七轮 §12 opt-in 设计基线 | 项目负责人 2026-09-29 批准 | 否 |
| 第七轮 §12 opt-in **代码实现** | `IMPLEMENTED_PENDING_CHATGPT_REVIEW`（待远程复审） | 否（仅改文本口径） |
| §12.1 **禁用态视觉规则** | 设计契约、**尚未实现、尚未验收**（`CCFG-AC-157` 仍 `BLOCKED`） | 否 |
| §13 分层契约 / 单行固定高亮可选契约 | `DRAFT_PENDING_USER_REVIEW`（**未**批准） | 否 |
| `CCFG-AC-010` 验收状态格 | **`PASS`**（第七轮定向验收重判） | 否（只读核对，未改状态格） |
| `CCFG-AC-155` / `CCFG-AC-156` / `CCFG-AC-157` 状态格 | **`BLOCKED`** / **`BLOCKED`** / **`BLOCKED`** | 否（只读核对，未改状态格） |
| 第七轮 157 条统计 | `PASS 70 / FAIL 0 / BLOCKED 72 / NOT_RUN 15` | 否 |
| 模板级 `page_migration_status` / `page_migration_authorization_status` / `pilot_page_selection_status` | `NOT_STARTED` / `NOT_GRANTED` / `NOT_DECIDED` | 否 |

## 8. 未执行项与边界

- **未**运行测试 / 构建 / 浏览器验收，**未**启停服务，**未**访问 DB / ZooKeeper / Kafka（纯文档任务，验证矩阵 `NOT_APPLICABLE`）。
- **未**修改 `frontend/**`、`backend/**`、共享 CSS / 测试、`docs/features/**`、历史报告或证据、
  `docs/prompts/**`、项目级基线、配置；**未**实施数据源管理页「更多」→三点迁移；**未**改弹窗模板。
- **未**修改任何验收定义行 / 状态格（`CCFG-AC-010` 仍 `PASS`、`CCFG-AC-155~157` 仍 `BLOCKED`），
  **未**新跑验收；本轮对验收状态的陈述均为**只读核对**，**不**构成新验收结果。
- 探针端第七轮 157 条验收统计（`PASS 70 / FAIL 0 / BLOCKED 72 / NOT_RUN 15`）**未**改变。
- 提交与推送成功 **≠** 远程复审通过 **≠** 草案获批 **≠** 模板级迁移获授权。

## 9. 下一入口

```text
next_step=CHATGPT_REMOTE_LIST_TABLE_VISUAL_TEMPLATE_CLIENT_CONFIG_REFINEMENT_BASELINE_R3_REVIEW
```

- 模板级 `current_next_entry` 仍为
  `NONE_SHARED_IMPLEMENTATION_FINAL_ACCEPTED_AND_CLOSED_NO_PAGE_MIGRATION_AUTHORIZED`（不变）。
- R2 入口 `..._R2_REVIEW`、R1 入口 `..._R1_REVIEW`、R0 入口 `..._BASELINE_REVIEW`
  均已因 `CHANGES_REQUIRED` 成为**历史**入口。

## 10. 机器可读摘要

> 本报告在提交前**不**预填自指的 `result_commit_id` / `push_status`；该两项真实值在任务最终回复中报告。

```text
AGENT_TASK_RESULT_BEGIN
status=SUCCESS
task_code=LIST-TABLE-VISUAL-TEMPLATE-CLIENT-CONFIG-REFINEMENT-BASELINE-001-R3
branch=develop
base_commit_id=732d6df12215f0036f27dcbe8367bbb172f1fd47
result_commit_id=(提交后在最终回复中报告)
env_check_status=SUCCESS
backend_build_status=NOT_APPLICABLE
frontend_build_status=NOT_APPLICABLE
database_write_status=NOT_REQUESTED
zookeeper_write_status=NOT_REQUESTED
push_status=(推送后在最终回复中报告)
changed_files=docs/baseline/list-table-visual-template/README.md,docs/baseline/list-table-visual-template/SHARED_COMPONENT_DESIGN.md,docs/baseline/list-table-visual-template/MIGRATION.md,docs/baseline/list-table-visual-template/reports/LIST-TABLE-VISUAL-TEMPLATE-CLIENT-CONFIG-REFINEMENT-BASELINE-001-R3.md
error=
AGENT_TASK_RESULT_END
```
