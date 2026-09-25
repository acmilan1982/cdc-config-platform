# 探针端管理弹窗间距、启停确认文案与列表单行选中调整 · 基线草案 R1 定向纠错执行报告

> 任务代码：`CLIENT-CONFIG-DIALOG-SPACING-ROW-SELECTION-AND-CONFIRM-COPY-BASELINE-001-R1`
> 任务类型：纯文档（对第五轮 R0 草案的三处一致性问题作**定向纠错**，**不**重新设计三项已确认产品决定）
> 分支：`develop`
> 起始提交：`3f1fdd423df4377c59c73dad968d65b592b5e717`（第五轮 R0 纯文档草案提交）
> R0 报告（**本任务不修改**）：`docs/features/client-config/reports/CLIENT-CONFIG-DIALOG-SPACING-ROW-SELECTION-AND-CONFIRM-COPY-BASELINE-001.md`
> 下一入口：`CHATGPT_REMOTE_CLIENT_CONFIG_DIALOG_SPACING_ROW_SELECTION_CONFIRM_COPY_BASELINE_R1_REVIEW`
> 本任务不修改代码、不执行正式验收、不改写 R0 报告与历史定义原文、不改变三项已确认产品决定，不作出「本轮已复审／已批准／已实现／已验收」结论。

---

## 1. 门禁与基线

```text
branch=develop
expected_base_commit=3f1fdd423df4377c59c73dad968d65b592b5e717
actual_base_commit=3f1fdd423df4377c59c73dad968d65b592b5e717
origin_develop=3f1fdd423df4377c59c73dad968d65b592b5e717
remote_refs_heads_develop=3f1fdd423df4377c59c73dad968d65b592b5e717
ahead_behind(origin/develop...HEAD)=0/0
r0_remote_review_result=CHANGES_REQUIRED
r1_correction_count=3
adjustment5_baseline_status=DRAFT_PENDING_USER_REVIEW
adjustment5_approval_status=NOT_APPROVED
adjustment5_implementation_status=NOT_STARTED
adjustment5_formal_acceptance_execution_status=NOT_RUN
git_commit_authorized=仅限本次白名单文档
git_push_authorized=仅限本次白名单文档普通推送至 origin/develop
```

- 当前分支为 `develop`，本地 `HEAD`、`origin/develop` 与远程 `refs/heads/develop` 三者一致（`3f1fdd4`），ahead/behind 为 `0/0`，无分叉、无冲突，未触发停线条件。
- 任务开始前已存在的无关工作区内容**保持原样、未修改、未暂存**：` M .claude/settings.local.json` 与未跟踪的 `docs/prompts/**`。
- **R0 复审结论**：ChatGPT 从远程 Git 对 R0 提交 `3f1fdd4` 的复审结论为 `CHANGES_REQUIRED`。复审**通过**了静态检查项——六文件白名单、连续编号 需求 147／验收 146／设计 82／界面 70、以及 146 条验收用例全部 `NOT_RUN`；仅提出**三处一致性**问题须修正（R1-01／R1-02／R1-03），**不**要求重新设计三项已确认产品决定。
- 开工时核实的四类定义计数为 需求 `CCFG-REQ-001~147`（147）、验收 `CCFG-AC-001~146`（146）、设计 `CCFG-DESIGN-001~082`（82）、界面 `CCFG-UI-001~070`（70），均连续唯一无缺号。

## 2. 实际变更文件

| 文件 | 变更类型 | 说明 |
|---|---|---|
| `docs/features/client-config/REQUIREMENTS.md` | 修改 | **7** 条既有需求定义行就地追加 `**【R1 定向修订 · 待复审】**`（`CCFG-REQ-020`／`-094`／`-142`／`-143`／`-144`／`-146`／`-147`）、§7.14 前言与关系段落补 R1 说明、§8 编号核验说明段同步、§10 变更记录新增 R1 行、元数据当前状态说明同步 |
| `docs/features/client-config/ACCEPTANCE.md` | 修改 | **6** 条既有验收定义行就地修订（`CCFG-AC-016`／`-141`／`-142`／`-143`／`-145`／`-146`）、§1.9 分层状态块新增 R1 行与下一入口行并补 R1 说明、§1.9 前言／关系段同步、§6 变更记录新增 R1 行 |
| `docs/features/client-config/DESIGN.md` | 修改 | **6** 条既有设计定义行就地修订（`CCFG-DESIGN-040`／`-077`／`-078`／`-079`／`-081`／`-082`）、§17 前言与 R1 说明块、§1 元数据与第五轮状态／下一入口行同步、§18 变更记录新增 R1 行 |
| `docs/features/client-config/UI.md` | 修改 | **7** 条既有界面定义行就地修订（`CCFG-UI-004`／`-005`／`-065`／`-066`／`-067`／`-069`／`-070`）、§19 前言与 R1 说明段、§1 第五轮分层行同步、§20 变更记录新增 R1 行 |
| `docs/features/client-config/README.md` | 修改 | §1.11 补 R1 定向修订条目与 R1 改动范围条目、§2 导航四处文档状态单元同步为「R0 已经复审 `CHANGES_REQUIRED`、现由 R1 承接」并新增 R1 报告行、§5 新增「历史下一入口（R0）」与「当前下一入口（R1）」 |
| `docs/features/client-config/reports/CLIENT-CONFIG-DIALOG-SPACING-ROW-SELECTION-AND-CONFIRM-COPY-BASELINE-001-R1.md` | **新增** | 本报告 |

**未修改**：`docs/features/client-config/API.md`、`DATABASE.md`、`docs/baseline/**`（含两套查询／列表视觉模板的 README／SHARED_COMPONENT_DESIGN／MIGRATION）、`docs/features/README.md`、任何历史报告（**含 R0 报告**）、`docs/prompts/**`、前后端代码与测试、`CLAUDE.md`、`agent-env.sh`、参考页 `frontend/src/views/data-source/DataSourcePage.vue`、数据库对象与构建依赖。

## 3. R1 三处定向纠错的「原文 → 修订后 → 未改变」

三处问题均为**文档一致性**问题，**不**改动任何一项已确认产品决定（① 弹窗约 12px 间距与纵向节奏；② 停用确认文案收窄 + 启用**新增**确认；③ 悬停仅临时高亮、左键固定至多一行、普通重载清除、启停成功后仅在目标仍显示时重新固定）。所有修订均在原定义行**保留原文**前提下就地追加 `**【R1 定向修订 · 待复审】**`，**不**删除历史、**不**伪装为原规则从未存在。

### 3.1 R1-01：单行固定选中的本地表示与「绝对禁止选择概念」冲突

- **原文（R0 及更早）**：`CCFG-REQ-147`／`CCFG-REQ-020`／`CCFG-REQ-094` 等处**绝对禁止**「选择状态／选择键／『当前选中行』概念」；而 `CCFG-REQ-142` 同时要求「点击固定一行、再点取消、点别行切换、启停成功后按稳定探针 ID 重新定位」。对「选择状态」的一刀切禁止使 `CCFG-REQ-142` 无法实现。
- **修订后**：把该绝对禁止**收窄**为仅禁止**旧的批量或业务选择能力**（已选行集合、复选框／多选、选中计数、批量删除、"删除所选"、"已选择：{探针ID}" 文字、后端选择状态）；同时明确**允许**仅在 `/config/client` **当前页面会话内**保存**一个可为空的单个探针 ID**（`selectedClientId` 或同义值）作为固定高亮的**本地**状态，以及该单个值的行点击事件与选中视觉。
- **明确未改变（仍为禁止）**：复选框／多选、已选行集合、选中计数、批量删除、"删除所选"、"已选择：{探针ID}"、后端选择状态；**不**把该 ID 写入 URL／`localStorage`／`sessionStorage`／接口／数据库；该本地状态**不**作为启用／停用／删除入口的前置条件。
- **落点**：`CCFG-REQ-020`／`-094`／`-142`／`-147`、`CCFG-AC-016`／`-141`／`-146`、`CCFG-DESIGN-040`／`-077`／`-082`、`CCFG-UI-004`／`-005`／`-065`／`-070` 及 README／摘要／变更记录。

### 3.2 R1-02：`CCFG-AC-145` 前置条件不可构造

- **原文（R0）**：前置示例为「先按关键词查询命中该探针，再启停使其不再满足条件」——但启用／停用**不改变**探针 ID 或探针描述，关键词命中状态不会被启停改变，该前置**不可构造**。
- **修订后**：替换为可执行的**状态筛选**情形——当当前生效状态筛选为「启用」时**停用**该探针，或当前生效筛选为「停用」时**启用**该探针；成功后按当前生效条件重载时目标行不再出现，故其余固定选中必须清除。**保留**「全部」筛选下的情形（启停成功后目标仍在结果中，须固定该行）。
- **明确未改变**：不改后端过滤／排序；不新增刷新按钮；「全部／仍显示／已过滤／取消／失败／删除」各分支一致性口径不变。
- **落点**：`CCFG-AC-145`、`CCFG-REQ-146`、`CCFG-DESIGN-081`、`CCFG-UI-069`。

### 3.3 R1-03：探针 ID 普通左键单击与编辑入口未区分

- **原文（R0）**：`CCFG-AC-143` 把「点击探针 ID 编辑入口」与三点触发器、下拉、确认弹窗并列，要求其**不得**改变选中。但探针 ID 的**普通左键单击**本身就是普通行内容点击；编辑由**行双击**或**ID 聚焦后 Enter／Space** 触发，原文把两者混为一谈。
- **修订后**：明确**探针 ID 文字／所在普通单元格的普通左键单击属「普通行内容」**，按单行固定选中规则切换，**不**排除在选中范围外；**仅** **Enter／Space 键盘编辑**与**行双击编辑**进入编辑弹窗，且进入编辑时**不得**因事件传播意外连带二次选中／取消。三点触发器、下拉菜单、确认弹窗（含遮罩按钮）、`+N` 等**真行内交互控件**保持隔离。
- **明确未改变**：`CCFG-UI-067` 需隔离的「真行内交互控件」**不含**探针 ID 普通单击；双击行编辑与 ID 键盘编辑入口继续保留。
- **落点**：`CCFG-REQ-142`／`-143`／`-144`、`CCFG-AC-141`／`-142`／`-143`、`CCFG-DESIGN-078`／`-079`、`CCFG-UI-065`／`-066`／`-067`。

## 4. 逐 ID 相对 `3f1fdd4` 的实际修改

所有被修改的既有定义行均为**就地追加／最小措辞收窄**，原定义行的原文描述与尾部映射列**逐字节保留**，仅在原文之后追加标注或对明确冲突的短语作最小替换。

### 4.1 `REQUIREMENTS.md`（7 条）

| 条款 | R1 实际修改 |
|---|---|
| `CCFG-REQ-020` | 绝对禁止「选择状态／选择键／『当前选中行』」收窄为禁止**旧的批量或业务选择能力**；追加「允许页面会话内单个可为空 `selectedClientId` 本地状态」口径 |
| `CCFG-REQ-094` | 同口径收窄（「仍为取消、不得恢复」范围收窄为禁止旧的批量／业务选择能力） |
| `CCFG-REQ-142` | 追加「固定选中可表示为一个可为空的单个探针 ID 本地状态」；明确 ID 文字／所在普通单元格左键单击属「普通行内容」 |
| `CCFG-REQ-143` | 明确普通左键单击 ID 与 **Enter／Space 键盘编辑**、**行双击编辑**区分；进入编辑不得连带二次选中 |
| `CCFG-REQ-144` | 「其他行内交互控件」限定为「**真行内交互控件**」（`+N`、Tooltip 触发器等），不含 ID 普通单击 |
| `CCFG-REQ-146` | 补「**含状态筛选为『全部』时目标仍在结果中**」；「当前查询条件」→「当前**状态筛选**生效条件」 |
| `CCFG-REQ-147` | 「明确不恢复」收窄为「**旧的批量或业务选择能力**」并追加 R1 允许口径；声明不删除历史、不伪装为以前即允许单行固定高亮 |

非定义行改动：元数据当前状态说明行、§7.14 前言块、§7.14 关系段落、§8 编号核验说明段、§10 新增 R1 变更记录行。

### 4.2 `ACCEPTANCE.md`（6 条）

| 条款 | R1 实际修改 |
|---|---|
| `CCFG-AC-016` | 排除口径收窄为「**旧的批量或业务选择能力**」 |
| `CCFG-AC-141` | 新增步骤 ⑥ 与预期 ⑥：**左键单击探针 ID 文字**（普通单元格）属普通行内容、按固定选中切换 |
| `CCFG-AC-142` | 追加 R1 说明：双击编辑与单击选中的协调口径（R1-03） |
| `CCFG-AC-143` | 步骤 ⑤ 改为对 ID 的 **Enter／Space 键盘编辑**与**行双击编辑**（**非普通左键单击**）；隔离对象改为「真行内交互控件」 |
| `CCFG-AC-145` | 前置由不可构造的「关键词查询后再启停失配」替换为**状态筛选**情形；预期同步「含『全部』」「状态筛选」 |
| `CCFG-AC-146` | 排除口径收窄为「**旧的批量或业务选择能力**」 |

非定义行改动：§1.9 前言段、§1.9 状态块新增 R1 行与下一入口行、§1.9 关系段、§1.6 状态说明段、§6 新增 R1 变更记录行。

### 4.3 `DESIGN.md`（6 条）

| 条款 | R1 实际修改 |
|---|---|
| `CCFG-DESIGN-040` | 「取消全部选择能力」收窄为禁止旧的批量／业务选择能力 |
| `CCFG-DESIGN-077` | 补「固定选中实现为一个可为空的单个探针 ID（`selectedClientId` 或同义值）的页面会话内本地状态」 |
| `CCFG-DESIGN-078` | 追加 R1 说明（ID 普通单击与编辑入口的事件协调） |
| `CCFG-DESIGN-079` | 「其他行内交互控件」限定为「**真行内交互控件**」 |
| `CCFG-DESIGN-081` | 补「含状态筛选为『全部』时目标仍在结果中」；「当前查询条件」→「当前**状态筛选**生效条件」 |
| `CCFG-DESIGN-082` | 「不恢复」收窄为「**旧的批量或业务选择能力**」并补单个本地 ID 口径 |

非定义行改动：元数据实现状态行、§1 第五轮状态行与下一入口行、§17 前言、§17 R1 说明块、§18 新增 R1 变更记录行。

### 4.4 `UI.md`（7 条）

| 条款 | R1 实际修改 |
|---|---|
| `CCFG-UI-004` | 工具栏「删除所选」等取消口径收窄为禁止旧的批量／业务选择能力 |
| `CCFG-UI-005` | 行单选／选中行高亮口径收窄；补「探针 ID 普通单击属普通行内容」并指向 `CCFG-UI-065`／`066` |
| `CCFG-UI-065` | 补「固定选中实现为一个可为空的单个探针 ID 的页面会话内本地状态」与 ID 单击归属 |
| `CCFG-UI-066` | 追加 R1 说明（ID 普通单击 vs Enter／Space 与双击编辑） |
| `CCFG-UI-067` | 隔离对象限定为「**真行内交互控件**」（`+N`、Tooltip 触发器等），不含 ID 普通单击 |
| `CCFG-UI-069` | 与 `CCFG-AC-145`／`CCFG-DESIGN-081`／`CCFG-REQ-146` 对齐为**状态筛选**情形（含「全部」分支） |
| `CCFG-UI-070` | 「不恢复」收窄为「**旧的批量或业务选择能力**」并补单个本地 ID 口径 |

非定义行改动：§1 第五轮分层行、§19 前言、§19 R1 说明段、§20 新增 R1 变更记录行。

### 4.5 `README.md`

- §1.11：补「R1 定向修订 · 待复审」条目（三处纠错）与「R1 改动范围」条目；原「只恢复视觉单行定位，不恢复批量能力」条目收窄为「**旧的批量或业务选择能力**」。
- §2 导航：`REQUIREMENTS.md`／`ACCEPTANCE.md`／`DESIGN.md`／`UI.md` 四处状态单元把「草案**尚未**经 ChatGPT 远程复审」同步为「已复审、结论 `CHANGES_REQUIRED`、现由 R1 承接」；新增 R1 报告行。
- §5：原第五轮 R0 入口降为「**历史下一入口**」并注明其复审结论 `CHANGES_REQUIRED`；新增「**当前下一入口**（R1 定向纠错起）」。

**R0 报告未被修改**：`reports/CLIENT-CONFIG-DIALOG-SPACING-ROW-SELECTION-AND-CONFIRM-COPY-BASELINE-001.md` 保持原样；如某份 Feature 文档某处无需改动，本报告已在此说明，未作空改动。

## 5. 分层状态与计数

### 5.1 分层状态（五份文档一致）

```text
adjustment5_baseline_status=DRAFT_PENDING_USER_REVIEW
adjustment5_approval_status=NOT_APPROVED
adjustment5_implementation_status=NOT_STARTED
adjustment5_formal_acceptance_execution_status=NOT_RUN
PENDING_USER_CONFIRMATION=0
```

- **历史已批准层（保持真实、不改写）**：`adjustment_baseline_status`／`adjustment2_baseline_status`／`adjustment3_baseline_status`／`adjustment4_baseline_status` 均为 `APPROVED`（第四轮批准依据提交 `9daf03848d53008d3ac73e6a43c1368fa5d72750`）。
- **既有实现事实层（保持真实、不改写）**：既有实现与第一／二轮实现在 `IMPLEMENTED_PENDING_USER_ACCEPTANCE`；第三轮与第四轮实现在 `IMPLEMENTED_PENDING_CHATGPT_REVIEW`（第四轮实现 R1 提交 `0c30b150343853c29ddf0329496dee3272d14cc0` 已经 ChatGPT 远程代码复审通过，**尚未**项目负责人最终页面接受或正式验收）。
- **口径区分**：R1 结果为「**草案已定向纠错**」，既**不是**「已复审通过」（待 ChatGPT R1 复审），也**不是**「已批准」，更**不是**「已实现／已验收」；项目负责人在会话中确认三项调整**不等于**本轮草案已批准。

### 5.2 编号与覆盖

| 文档 | 总数 | 连续唯一 | §12／§14／§5 矩阵 |
|---|---|---|---|
| `REQUIREMENTS.md` | **147**（`001~147`） | 是 | — |
| `ACCEPTANCE.md` | **146**（`001~146`） | 是 | §5 需求覆盖 147 行 |
| `DESIGN.md` | **82**（`001~082`） | 是 | §12.1 = 147 行、§12.2 = 146 行 |
| `UI.md` | **70**（`001~070`） | 是 | §14 界面映射 70 行，覆盖 147/147 与 146/146 |

- 覆盖关系 需求→设计→界面→验收 **147/147**、需求→验收 **147/147**；R1 **未**新增／删除／重排任何编号。

## 6. 验收状态

- 全文件 `CCFG-AC-001~146`（146 条）**全部为 `NOT_RUN`**（逐行核对状态列，146/146 命中 `NOT_RUN`）。
- `adjustment5_formal_acceptance_execution_status=NOT_RUN`；`formal_acceptance_execution_status=NOT_RUN`。
- R1 **未**把任何用例标记为执行或通过；**未**运行正式验收；R1 仅修订判定文本，**不**改变 `NOT_RUN` 计数。

## 7. 未修改文件与未执行项

**未修改**：见 §2 末尾列表（含 `API.md`、`DATABASE.md`、`docs/baseline/**`、`docs/features/README.md`、历史报告含 R0 报告、`docs/prompts/**`、前后端代码与测试、参考页）。

**未执行项（本任务明确不做）**：

- 未运行测试、Vitest、Maven 测试；未运行前后端构建、类型检查、lint。
- 未启动或停止任何服务；未做浏览器核对。
- 未执行正式验收；未访问数据库、ZooKeeper、Kafka。
- 未修改代码、配置、数据库对象；未创建通用弹窗模板。
- 未改写任何历史定义行原文；未回写 R0 报告；未改写第一至第四轮已批准基线与各轮实现事实。

## 8. 静态检查结果

| 检查项 | 命令／方法 | 结果 |
|---|---|---|
| 分支与提交 | `git branch --show-current`、`git rev-parse HEAD`、`git ls-remote origin refs/heads/develop` | `develop`；本地／`origin/develop`／远程三者均为 `3f1fdd4`，`0/0` |
| 空白／冲突标记 | `git diff --check` | 干净（退出码 0） |
| 变更白名单 | `git status --short` | 仅 5 份白名单文档 + 新增 1 份 R1 报告；未跟踪 `docs/prompts/` 与预先存在的 ` M .claude/settings.local.json`（与本任务无关，未暂存） |
| 编号连续唯一 | 逐文档提取 `CCFG-REQ/AC/DESIGN/UI` 编号并比对 `seq` | 需求 001~147、验收 001~146、设计 001~082、界面 001~070，均唯一连续无缺号 |
| `NOT_RUN` 计数 | 统计 `ACCEPTANCE.md` 中 `^\| CCFG-AC-\d{3} ` 行及其状态列 | 146 行用例、146 行 `NOT_RUN`（全部未执行） |
| 映射完整性 | 统计 `DESIGN.md` §12.1／§12.2、`ACCEPTANCE.md` §5、`UI.md` §14 映射行 | §12.1 = 147、§12.2 = 146、§5 = 147、§14 = 70；覆盖 147/147 与 146/146 |
| 定义行差异边界 | `git diff -U0` 逐文件统计被改动的 `\| CCFG-*` 定义行 | 恰为 需求 7 条（`020/094/142/143/144/146/147`）、验收 6 条（`016/141/142/143/145/146`）、设计 6 条（`040/077/078/079/081/082`）、界面 7 条（`004/005/065/066/067/069/070`）；无其他既有定义行被改动 |
| 原文保真 | 逐条核对被改定义行的原文描述与映射列 | 原定义行原文与尾部映射列逐字节保留，仅追加标注或对明确冲突短语作最小替换；无历史删除、无“原规则从未存在”伪装 |
| 状态口径 | 全文检索 `adjustment5_*`、`PENDING_USER_CONFIRMATION`、`NOT_RUN` | 五份文档均为 `DRAFT_PENDING_USER_REVIEW`／`NOT_APPROVED`／`NOT_STARTED`／`NOT_RUN`、`PENDING_USER_CONFIRMATION=0`，未混用「已批准／已实现／已验收」 |
| 历史分层不被改写 | 核对四轮基线状态与各轮实现事实 | 第一~第四轮已批准基线与各轮实现事实逐条保留；第四轮实现 R1 提交 `0c30b15` 的远程代码复审通过事实照实登记，其「尚未目测／尚未正式验收」边界明示 |
| R0 报告完整性 | 核对 R0 报告 mtime／内容 | 未修改 |

## 9. 下一入口

- `next_entry=CHATGPT_REMOTE_CLIENT_CONFIG_DIALOG_SPACING_ROW_SELECTION_CONFIRM_COPY_BASELINE_R1_REVIEW`
- 复审对象：本 R1 结果提交（从远程 Git 读取）；复审要点为 §3 三处纠错的「原文／修订／未改变」对照、§4 逐 ID 修改清单与原文保真、§5 计数与状态口径、§6 验收 `NOT_RUN` 保持。
- **远程文档复审通过后仍需项目负责人批准本轮草案**，才能另行进入本轮代码实现；**不得**在复审与批准前进入实现，也**不得**把本 R1 写成已批准、已实现、已目测或已验收。
- `blocker`：无（任务范围内无阻塞；本轮停在本复审入口等待基线复审与项目负责人批准）。
