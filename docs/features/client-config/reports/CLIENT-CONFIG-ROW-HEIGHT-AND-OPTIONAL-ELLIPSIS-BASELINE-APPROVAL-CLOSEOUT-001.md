# 探针端管理主列表行高与三点入口可选样式 · 基线批准收口执行报告

> 任务代码：`CLIENT-CONFIG-ROW-HEIGHT-AND-OPTIONAL-ELLIPSIS-BASELINE-APPROVAL-CLOSEOUT-001`
> 任务类型：**纯文档批准收口**（记录项目负责人对 R2 修订后第七轮 Feature 基线草案及其 `list-table-visual-template` 三点入口 opt-in 扩展设计基线的批准；**不**改前端代码／测试／共享 CSS、**不**实施页面调整、**不**运行浏览器实测／测试／构建、**不**执行正式验收）
> 分支：`develop`
> 起始提交（= 本地 HEAD = `origin/develop` = 远程 `refs/heads/develop`）：`59617b4cee03fe1642417cb85005b339ab0015ab`
> 触发事实：R2 提交 `59617b4` 经 ChatGPT **从远程 Git 独立复审、结论 `APPROVED`**，项目负责人随后于 **2026-09-29 明确回复“批准”**，本轮据此把第七轮分层收口为 `APPROVED`。
> 下一入口：`CHATGPT_REMOTE_CLIENT_CONFIG_ROW_HEIGHT_AND_OPTIONAL_ELLIPSIS_BASELINE_APPROVAL_CLOSEOUT_REVIEW`
> 本任务**只做纯文档批准收口**：**批准对象是设计基线（非实现）**，**不**对任何验收项作出新判定，**不**宣布页面已实现、已目测或已验收。

---

## 1. 门禁与基线

```text
branch=develop
expected_base_commit=59617b4cee03fe1642417cb85005b339ab0015ab
actual_base_commit=59617b4cee03fe1642417cb85005b339ab0015ab
origin_develop=59617b4cee03fe1642417cb85005b339ab0015ab
remote_refs_heads_develop=59617b4cee03fe1642417cb85005b339ab0015ab
ahead_behind(origin/develop...HEAD)=0/0
r0_remote_review_verdict=CHANGES_REQUIRED
r1_remote_review_verdict=CHANGES_REQUIRED
r2_remote_review_verdict=APPROVED
project_owner_approval_reply=批准（2026-09-29）
adjustment7_baseline_status=APPROVED
adjustment7_approval_status=APPROVED_BY_PROJECT_OWNER
adjustment7_approval_date=2026-09-29
adjustment7_approved_reviewed_commit=59617b4cee03fe1642417cb85005b339ab0015ab
adjustment7_implementation_status=NOT_STARTED
adjustment7_formal_acceptance_execution_status=NOT_RUN
formal_acceptance_execution_status=NOT_RUN
git_commit_authorized=仅限本次白名单文档
git_push_authorized=仅限本次白名单文档普通推送至 origin/develop（禁止强推）
```

- 当前分支为 `develop`，本地 `HEAD`、`origin/develop` 与远程 `refs/heads/develop` 三者一致（`59617b4`），ahead/behind 为 `0/0`，无分叉、无冲突，未触发停线条件；任务提示词给出的预期起始提交 `59617b4` 与现场真实 Git 对象一致。
- 任务开始前已存在的无关工作区内容**保持原样、未修改、未暂存**：` M .claude/settings.local.json` 与未跟踪的 `docs/prompts/**`、`runtime-logs/**`。
- 开工时四类定义计数为 需求 `CCFG-REQ-154`／验收 `CCFG-AC-157`／设计 `CCFG-DESIGN-089`／界面 `CCFG-UI-077`；本收口**不**新增、**不**删除、**不**复用任何编号。
- 环境：本任务为**纯文档**任务，按 `CLAUDE.md` §15 验证矩阵不适用构建；**未**运行测试／构建／lint／浏览器；**未**启停任何服务；**未**访问或写入数据库／ZooKeeper／Kafka。

## 2. 实际变更文件

| 文件 | 变更类型 | 说明 |
|---|---|---|
| `docs/features/client-config/README.md` | 修改 | §1.13 追加第七轮批准收口段（六项 `adjustment7_*` 键、批准对象、历史入口降级、现行下一入口）；§2 导航新增本报告行并同步 README 行；§4 追加批准收口条目；§5 将 R2 入口降为**历史下一入口**并新增 **批准收口当前下一入口** |
| `docs/features/client-config/REQUIREMENTS.md` | 修改 | §7.16 标题更新为先 R1/R2 纠错、后批准收口；追加 **R2 定向纠错**与**批准收口**两段说明；§8 编号表行与第七轮说明更新；§10 变更记录追加批准收口行 |
| `docs/features/client-config/ACCEPTANCE.md` | 修改 | 新增 §1.22 **批准收口状态块**（批准依据与时序、批准对象、六项 `adjustment7_*`、状态保护、历史入口、未执行项、边界、报告、下一入口）；§3 编号表行更新；§6 变更记录追加批准收口行 |
| `docs/features/client-config/DESIGN.md` | 修改 | §19 标题更新；追加 **R2 定向纠错**与**批准收口**段落；§20 变更记录追加 R2 行与批准收口行 |
| `docs/features/client-config/UI.md` | 修改 | §21 标题更新；追加 **R2 定向纠错**与**批准收口**段落；§22 变更记录追加 R2 行与批准收口行 |
| `docs/baseline/list-table-visual-template/README.md` | 修改 | §7.4／§8 现行说明更新为「已批准设计基线、尚未实现的可选扩展」；§8 待复审段落改写为批准收口口径（含 R2 修正并入获批基线）；§11 变更记录追加批准收口行 |
| `docs/baseline/list-table-visual-template/SHARED_COMPONENT_DESIGN.md` | 修改 | §0.1／§11.1／§11.3 说明更新；§12 标题、引言与状态块由「待复审草案」更新为**设计基线已批准、扩展代码未实现**（新增设计批准元数据键、`R2_CORRECTED_APPROVED`）；§12.2／§12.3／§12.4／§12.5／§12.7 措辞对齐；§12.8 追加批准收口后复测说明 |
| `docs/features/client-config/reports/CLIENT-CONFIG-ROW-HEIGHT-AND-OPTIONAL-ELLIPSIS-BASELINE-APPROVAL-CLOSEOUT-001.md` | 新增 | 本报告 |

**未修改**：`docs/features/client-config/API.md`、`DATABASE.md`；四族定义行（`CCFG-REQ-*`／`CCFG-AC-*`／`CCFG-DESIGN-*`／`CCFG-UI-*` **编号、数量与逐行文本**）；`CCFG-AC-010` 的定义、前置、操作、预期与历史时序追注（状态格仍 `BLOCKED`）；`CCFG-AC-155~157`（仍 `NOT_RUN`）；R0／R1／R2 报告 `reports/CLIENT-CONFIG-ROW-HEIGHT-AND-OPTIONAL-ELLIPSIS-BASELINE-001*.md`；`frontend/src/styles/list-table/**`（含 `list-table-visual.spec.ts` 现行断言代码）；`docs/baseline/` 六份**项目级**基线、`docs/baseline/query-list-page-template/**`、模板 `DESIGN.md`／`UI.md`／`MIGRATION.md`；`docs/features/README.md`、`docs/prompts/**`、`docs/features/client-config/reports/evidence/**`；前端与后端代码、测试、共享 CSS；参考页 `/config/data-source`；`CLAUDE.md`、`agent-env.sh`、`.claude/**` 与 `.claude/settings.local.json`。

## 3. 定义行与状态保护

- 本收口**不**新增／删除／复用任何编号，四族编号总数保持 `CCFG-REQ-001~154`（154 条）、`CCFG-AC-001~157`（157 条）、`CCFG-DESIGN-001~089`（89 条）、`CCFG-UI-001~077`（77 条），连续、唯一。
- 逐 ID 比对基准 `59617b4`：四族**定义行逐字节零变化**（本轮改动**只**落在各文档的**第七轮状态区、导航、编号对照表行描述与追加变更记录**等非定义文字）。
- `CCFG-AC-010` **状态格保持 `BLOCKED`**，其 R2 归属纠正口径与「待独立按现行有效定义逐步骤重新判定」表述**不变**；`CCFG-AC-155~157` **保持 `NOT_RUN`**。**第七轮基线批准不自动把任何验收项置为 `PASS`。**
- R1 冻结的 **≤1 CSS px 容差**与常规／异常行分组口径、R2 修正的**模板拟议断言 #11 根类剔除**口径均**不被重写**。
- 覆盖核验**保持** `154/154` 与 `157/157`。

## 4. 分层状态（批准收口后）

```text
adjustment7_baseline_status=APPROVED
adjustment7_approval_status=APPROVED_BY_PROJECT_OWNER
adjustment7_approval_date=2026-09-29
adjustment7_approved_reviewed_commit=59617b4cee03fe1642417cb85005b339ab0015ab
adjustment7_implementation_status=NOT_STARTED
adjustment7_formal_acceptance_execution_status=NOT_RUN
formal_acceptance_execution_status=NOT_RUN
PENDING_USER_CONFIRMATION=0
```

- 本收口把 `adjustment7_baseline_status` 由 `DRAFT_PENDING_USER_REVIEW` 置为 `APPROVED`、`adjustment7_approval_status` 由 `NOT_APPROVED` 置为 `APPROVED_BY_PROJECT_OWNER`；`adjustment7_implementation_status` 仍 `NOT_STARTED`、`adjustment7_formal_acceptance_execution_status` 仍 `NOT_RUN`。
- **批准对象**：R2 修订后的第七轮 Feature 基线草案**及其 `list-table-visual-template` 三点入口 opt-in 扩展设计**；**不**是 R0／R1 未纠正版本，**不**是代码实现，**不**是页面目测或正式验收结论。
- **R1／R2 的复审为前置事实**：R0 `9381703…`、R1 `938e720…` 远程复审均 `CHANGES_REQUIRED`，R2 `59617b4…` 复审 `APPROVED`；历史入口 `..._R2_REVIEW` 记为**已完成、结论 `APPROVED` 的历史入口**，**不**回写 R0／R1／R2 报告。

## 5. 模板侧：已批准设计基线 vs 已实现状态（严格区分）

`docs/baseline/list-table-visual-template/` 的两份文档**只**更新 §12 相关的**状态说明与元数据**：

- **设计基线已批准**：§12 的 opt-in 契约按**已批准设计文本**解析（确定类名 `lt-row-action__cell`／`lt-row-action__ellipsis`、受 `.lt-main-table` 限定、默认不新增 `--lt-*` 令牌、约 `28px` 命中区、`6px` 圆角、既有主色）。状态块更新为：

```text
list_table_row_action_opt_in_extension_status=DESIGN_BASELINE_APPROVED_IMPLEMENTATION_NOT_STARTED
list_table_row_action_opt_in_extension_design_approval_status=APPROVED_BY_PROJECT_OWNER
list_table_row_action_opt_in_extension_design_approval_date=2026-09-29
list_table_row_action_opt_in_extension_approved_reviewed_commit=59617b4cee03fe1642417cb85005b339ab0015ab
list_table_row_action_opt_in_extension_implemented=NO
list_table_row_action_opt_in_contract_revision=R2_CORRECTED_APPROVED
```

- **扩展代码尚未实现、尚未生效**：本期**没有**任何共享 CSS／测试断言／页面接入因该扩展改变；§12 的 opt-in 规则**不是**当前共享 CSS、**不是**现行测试断言、**不是**任何页面迁移事实，仍以 `LIST_TABLE_PROPOSED_NOT_IMPLEMENTED` 引用（该标记按 `README.md` §7.3 覆盖「尚未实现」的候选，其**定义**仍在 §7.3，§12 **只引用、不重定义**）。
- **原 §4／§7 契约与现行实现保持原值**：现行 **9** 个 `--lt-*` 令牌、内部 helper 类 **0**、主表根类 `lt-main-table` 的 §4.3／§4.4／§7.1／§7.2 契约**不变**；拟实施时辅助类 `2` 为**未来值**。
- **未改变授权边界**：`page_migration_status=NOT_STARTED`、`page_migration_authorization_status=NOT_GRANTED`、`pilot_page_selection_status=NOT_DECIDED`；数据源管理“更多”文字入口改三点仍为**另一会话、另一任务**。
- 模板 `current_next_entry` **保持** `NONE_SHARED_IMPLEMENTATION_FINAL_ACCEPTED_AND_CLOSED_NO_PAGE_MIGRATION_AUTHORIZED`（第七轮扩展属探针端管理 Feature 侧，其复审入口不构成本模板的下一步）。

## 6. 三通道标记计数

| 通道 | 口径 | 批准收口后实测 | 与 R2 比较 |
|---|---|---|---|
| 通道 1 | 四份规范文档（`README`／`DESIGN`／`UI`／`MIGRATION`） | `LIST_TABLE_REFERENCE_FACT=26` / 草案态规则标记 `0` / `LIST_TABLE_TEMPLATE_APPROVED=42` / `LIST_TABLE_PROPOSED_NOT_IMPLEMENTED=7` | **不变** |
| 通道 2 | `SHARED_COMPONENT_DESIGN.md` 批准态设计标记 | `79` | **不变** |
| 通道 3 | `SHARED_COMPONENT_DESIGN.md` 候选未实现标记（独立统计） | `23`（§12 节内 `20` 处，其它说明 `3` 处） | **不变**（收口未新增／删除任何候选标记实例） |

- **候选标记未实现计数 `23` ≠ 已实现样式计数**：该 `23` 为「尚未实现的候选」标记实例数，**不得**被误读为已落地共享 CSS 的样式数；真正的现行实现样式为 9 个令牌、内部 helper 类 `0`。
- R0 时点值「§12 内 `15`／含 §0.1 为 `16`／文件总计 `18`」与 R1／R2 时点值 `23` **均保留为时点证据**，本节按收口后实际内容**重新核算**、不硬编码旧值。

## 7. 验收状态

| 指标 | 收口前（R2 后） | 收口后 |
|---|---|---|
| `PASS` | 69 | 69 |
| `FAIL` | 0 | 0 |
| `BLOCKED` | 70 | 70 |
| `NOT_RUN` | 18 | 18 |
| 合计 | 157 | **157** |

- 本收口**不新增用例**；`CCFG-AC-001~157` 的执行状态格**零变化**（`CCFG-AC-010` 仍 `BLOCKED`，`CCFG-AC-155~157` 仍 `NOT_RUN`）。
- 汇总经 `ACCEPTANCE.md` §4 逐行机读核验：`PASS` **69** / `FAIL` **0** / `BLOCKED` **70** / `NOT_RUN` **18** = **157**。
- **第七轮基线批准不等于任何验收项自动通过**；`formal_acceptance_execution_status` 仍为 `NOT_RUN`，**项目负责人尚未作出整体验收接受决定**。

## 8. 风险

- **批准 ≠ 实现 ≠ 目测 ≠ 验收**：本轮批准的是设计基线；行高一致性（≤1 CSS px 容差）与三点入口 opt-in 的落地仍须由后续**独立实现任务**在真实浏览器实测判定，`CCFG-AC-155~157` 仍 `NOT_RUN`。
- **`CCFG-AC-010` 待独立重判**：本条现行状态属既有验收执行记录，需由**未来独立任务**按现行有效定义与既有证据作正式逐步骤重新判定；本收口**不**预设结论。
- **契约修订面**：opt-in 扩展若实现，仍须同步修订 §7.1 断言 #2/#3/#6/#11 与 §4.3／§4.4 计数，**须经独立评审**；本轮**只**更新状态说明，**不**改现行断言代码。
- **范围面**：本轮**不**触碰数据源管理参考页，**不**改任何代码／共享 CSS／测试。

## 9. 未修改文件与未执行项

- **未修改**：见 §2 末尾“未修改”清单。
- **未执行**：浏览器实测／截图、前端构建（`npm run build`／`type-check`／`lint`／`test`）、后端构建（`mvn test`／`package`）、服务启动／停止、数据库（含 SQL*Plus 与任何写操作）、ZooKeeper／Kafka 访问、正式验收、代码或共享 CSS 修改、任何页面动作（含启用／停用／删除确认与创建／编辑提交）。
- 数据库写操作：`NOT_REQUESTED`；ZooKeeper 写操作：`NOT_REQUESTED`。

## 10. 静态检查结果

```text
git diff --check                = 通过（无空白错误）
定义行计数                      = REQ 154 / AC 157 / DESIGN 089 / UI 077（连续、唯一、无新增/删除/复用）
四族定义行                      = 相对 59617b4 逐字节零变化
AC-010 / AC-155~157             = 分别保持 BLOCKED / NOT_RUN
覆盖核验                        = 154/154 与 157/157
验收四态（ACCEPTANCE §4 机读）  = PASS 69 / FAIL 0 / BLOCKED 70 / NOT_RUN 18 = 157
模板四份规范文档标记计数        = 26 / 0 / 42 / 7（不变）
SHARED 批准态设计标记计数       = 79（不变）
SHARED 候选未实现标记（通道3）  = 23（§12 节内 20，其它说明 3；时点值保留）
模板现行实现现值                = lt_token_count 9 / 内部 helper 类 0（不变）
格式与白名单                    = 仅本次 7 个已跟踪文档 + 本报告；未跟踪内容保持原位
```

## 11. 下一入口

```text
next_entry=CHATGPT_REMOTE_CLIENT_CONFIG_ROW_HEIGHT_AND_OPTIONAL_ELLIPSIS_BASELINE_APPROVAL_CLOSEOUT_REVIEW
```

由 ChatGPT **从远程 Git** 对本批准收口结果做独立**文档**复审。**该复审不是代码实现入口**，也**不**代表页面已目测、已实现或已正式验收。

---

## 边界声明（必须显式）

- 本任务**只做纯文档批准收口**：**未**修改前端代码／测试或共享 CSS、**未**实施页面调整、**未**运行浏览器实测／测试／构建、**未**执行正式验收、**未**修改数据源管理参考页。
- **「项目负责人批准基线」不等于**代码已实现、负责人已目测通过或已正式验收通过；**「收口文档已推送」不等于**远程复审已通过或最终接受已完成。
- 本收口**不**宣布整体 `PASS`、**不**宣布正式验收接受、**不**授权创建通用模板、**不**授权任何页面迁移。
- `CCFG-AC-010` 状态格**保持 `BLOCKED`** 且**未作新的验收判定**；`CCFG-AC-155~157` **保持 `NOT_RUN`**；历史原文、时序追注与历史证据**保留可追溯、不回写**。
- `docs/baseline/list-table-visual-template/` 的已批准公共模板旧契约与现行实现**仍是现行事实**；§12 扩展**设计基线已批准、扩展代码未实现、未生效**。
- 模板级 `page_migration_status=NOT_STARTED`、`page_migration_authorization_status=NOT_GRANTED`、`pilot_page_selection_status=NOT_DECIDED` **均不变**。

---

```text
task_code=CLIENT-CONFIG-ROW-HEIGHT-AND-OPTIONAL-ELLIPSIS-BASELINE-APPROVAL-CLOSEOUT-001
task_type=DOCS_ONLY_BASELINE_APPROVAL_CLOSEOUT
branch=develop
base_commit_id=59617b4cee03fe1642417cb85005b339ab0015ab
r0_9381703_remote_review=CHANGES_REQUIRED
r1_938e720_remote_review=CHANGES_REQUIRED
r2_59617b4_remote_review=APPROVED
project_owner_approval_reply=批准
project_owner_approval_date=2026-09-29
adjustment7_baseline_status=APPROVED
adjustment7_approval_status=APPROVED_BY_PROJECT_OWNER
adjustment7_implementation_status=NOT_STARTED
adjustment7_formal_acceptance_execution_status=NOT_RUN
next_entry=CHATGPT_REMOTE_CLIENT_CONFIG_ROW_HEIGHT_AND_OPTIONAL_ELLIPSIS_BASELINE_APPROVAL_CLOSEOUT_REVIEW
```
