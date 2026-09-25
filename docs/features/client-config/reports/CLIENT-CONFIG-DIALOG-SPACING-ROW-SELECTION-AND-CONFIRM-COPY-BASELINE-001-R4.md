# 探针端管理弹窗间距、启停确认文案与列表单行选中调整 · 基线草案 R4 历史复审入口纠错 执行报告

> 任务代码：`CLIENT-CONFIG-DIALOG-SPACING-ROW-SELECTION-AND-CONFIRM-COPY-BASELINE-001-R4`
> 任务类型：纯文档（仅纠正 R3 新增的历史复审入口**拼写**，**不**改动任何业务定义、计数事实与已确认产品决定）
> 分支：`develop`
> 起始提交：`5bca41a0028ce3addeda2597bdec4af8766ff447`（第五轮 R3 证据计数勘误提交）
> R0 报告（**本任务不修改**，仅作历史证据）：`docs/features/client-config/reports/CLIENT-CONFIG-DIALOG-SPACING-ROW-SELECTION-AND-CONFIRM-COPY-BASELINE-001.md`
> R1 报告（**本任务不修改**，仅作历史证据）：`docs/features/client-config/reports/CLIENT-CONFIG-DIALOG-SPACING-ROW-SELECTION-AND-CONFIRM-COPY-BASELINE-001-R1.md`
> R2 报告（**本任务不修改**，仅作历史证据）：`docs/features/client-config/reports/CLIENT-CONFIG-DIALOG-SPACING-ROW-SELECTION-AND-CONFIRM-COPY-BASELINE-001-R2.md`
> R3 报告（**本任务不修改**，仅作历史证据）：`docs/features/client-config/reports/CLIENT-CONFIG-DIALOG-SPACING-ROW-SELECTION-AND-CONFIRM-COPY-BASELINE-001-R3.md`
> 下一入口：`CHATGPT_REMOTE_CLIENT_CONFIG_DIALOG_SPACING_ROW_SELECTION_CONFIRM_COPY_BASELINE_R4_REVIEW`
> 本任务不修改代码、不执行正式验收、不改写 R0～R3 报告与历史定义原文、不改变三项已确认产品决定，不作出「本轮已复审／已批准／已实现／已验收」结论。

---

## 1. 门禁与基线

```text
branch=develop
expected_base_commit=5bca41a0028ce3addeda2597bdec4af8766ff447
actual_base_commit=5bca41a0028ce3addeda2597bdec4af8766ff447
origin_develop=5bca41a0028ce3addeda2597bdec4af8766ff447
remote_refs_heads_develop=5bca41a0028ce3addeda2597bdec4af8766ff447
ahead_behind(origin/develop...HEAD)=0/0
r3_remote_review_result=CHANGES_REQUIRED
r4_correction_count=15
adjustment5_baseline_status=DRAFT_PENDING_USER_REVIEW
adjustment5_approval_status=NOT_APPROVED
adjustment5_implementation_status=NOT_STARTED
adjustment5_formal_acceptance_execution_status=NOT_RUN
git_commit_authorized=仅限本次白名单文档
git_push_authorized=仅限本次白名单文档普通推送至 origin/develop
```

- 当前分支为 `develop`，本地 `HEAD`、`origin/develop` 与远程 `refs/heads/develop` 三者一致（`5bca41a`），ahead/behind 为 `0/0`，无分叉、无冲突，未触发停线条件。
- 任务开始前已存在的无关工作区内容**保持原样、未修改、未暂存**：` M .claude/settings.local.json` 与未跟踪的 `docs/prompts/**`。
- **R3 复审结论**：ChatGPT 从远程 Git 对 R3 提交 `5bca41a` 的复审结论为 `CHANGES_REQUIRED`。复审**通过**了 R3 的计数勘误（编号格 26/26、映射格 32/32、合计 58/58 正确），并确认**四类业务定义行未变**；**唯一**须修正的是 R3 在四份 Feature 文档新增的 **15** 处**历史复审入口错拼**（R4-01），**不**要求改动任何定义行，也**不**要求重新设计三项已确认产品决定。
- 开工时核实的四类定义计数为 需求 `CCFG-REQ-001~147`（147）、验收 `CCFG-AC-001~146`（146）、设计 `CCFG-DESIGN-001~082`（82）、界面 `CCFG-UI-001~070`（70），均连续唯一无缺号。

## 2. 实际变更文件

| 文件 | 变更类型 | 说明 |
|---|---|---|
| `docs/features/client-config/reports/CLIENT-CONFIG-DIALOG-SPACING-ROW-SELECTION-AND-CONFIRM-COPY-BASELINE-001-R4.md` | **新增** | 本报告（逐文件记录 15 处历史入口错拼纠正的复核依据） |
| `docs/features/client-config/README.md` | 修改 | §1.11 补 R4 定向修订条目与 R4 改动范围条目、§2 导航四处文档状态单元现行下一入口同步为 R4、§5 把 R3 设为历史下一入口并新增「当前下一入口（R4）」；并纠正其中 7 处历史入口错拼 |
| `docs/features/client-config/REQUIREMENTS.md` | 修改 | §1 与元数据现行下一入口同步为 R4（R3／R2／R1／R0 入口转历史）、§10 变更记录新增 R4 行；并纠正其中 1 处历史入口错拼；**未修改任何需求定义行** |
| `docs/features/client-config/ACCEPTANCE.md` | 修改 | §1.9 分层状态块现行下一入口同步为 R4、补 R4 纠错行与前言 R4 标注、§6 变更记录新增 R4 行；**未修改任何验收定义行**（本文件该轮未发生错拼，仅同步导航／记录） |
| `docs/features/client-config/DESIGN.md` | 修改 | 元数据与第五轮分层行（§1／§17）现行下一入口同步为 R4（R3／R2／R1／R0 入口转历史）、§18 变更记录新增 R4 行；并纠正其中 4 处历史入口错拼；**未修改任何设计定义行** |
| `docs/features/client-config/UI.md` | 修改 | 元数据与第五轮分层行现行下一入口同步为 R4（R3／R2／R1／R0 入口转历史）、§20 变更记录新增 R4 行；并纠正其中 3 处历史入口错拼；**未修改任何界面定义行** |

**未修改**：`docs/features/client-config/API.md`、`DATABASE.md`、`docs/baseline/**`（含两套查询／列表视觉模板的 README／SHARED_COMPONENT_DESIGN／MIGRATION）、`docs/features/README.md`、任何历史报告（**含 R0、R1、R2、R3 报告**）、`docs/prompts/**`、前后端代码与测试、`CLAUDE.md`、`agent-env.sh`、参考页 `frontend/src/views/data-source/DataSourcePage.vue`、数据库对象与构建依赖。

## 3. 唯一纠错：15 处历史复审入口错拼（R4-01）

本任务为**纯文档拼写纠错**，**不**改动任何业务定义、**不**改动任何验收／设计／界面／需求定义行，**不**改变 R3 的计数事实与三项已确认产品决定。

### 3.1 事实来源与独立复核

不以任务提示词为准，直接以起始 Git 对象为准复算：

- 在起始工作区对五份 Feature 文档按文件统计**错误前缀**（历史复审入口前缀中在 `ROW_SELECTION_CONFIRM_COPY_BASELINE` 处**多余写入 `_AND_`**）的出现数，得 **15** 处；
- 对**起始提交 `5bca41a` 之前的 R2 提交 `9b729ec`** 同法统计，得**错误前缀 0 处** → 证实全 15 处均由 R3 新增，R4 独立复核数与提示词逐文件表**一致**。

| 文件 | R3 新增的错拼处数 |
|---|---:|
| `README.md` | 7 |
| `REQUIREMENTS.md` | 1 |
| `DESIGN.md` | 4 |
| `UI.md` | 3 |
| `ACCEPTANCE.md` | 0 |
| **合计** | **15** |

### 3.2 纠正结果

R4 **仅**将这 15 处错误历史入口的**前缀拼写**纠正为正确形式（移除多余 `_AND_`），**不改**其后缀与其余文字；纠正后五份文档**错误前缀出现数 15→0**。逐文件实际纠正数：`README.md` **7**、`REQUIREMENTS.md` **1**、`DESIGN.md` **4**、`UI.md` **3**、`ACCEPTANCE.md` **0**（本文件该轮未发生错拼，仅同步导航／记录）。

### 3.3 正确历史入口字面值（按事实核对，不虚构）

分别核对**实际历史任务的入口**字面值，均以历史报告为证：

| 轮次 | 正确入口 | 依据 |
|---|---|---|
| R0 | `CHATGPT_REMOTE_CLIENT_CONFIG_DIALOG_SPACING_ROW_SELECTION_CONFIRM_COPY_BASELINE_REVIEW`（无 `_R*` 后缀） | R0 报告 |
| R1 | `CHATGPT_REMOTE_CLIENT_CONFIG_DIALOG_SPACING_ROW_SELECTION_CONFIRM_COPY_BASELINE_R1_REVIEW` | R1 报告 |
| R2 | `CHATGPT_REMOTE_CLIENT_CONFIG_DIALOG_SPACING_ROW_SELECTION_CONFIRM_COPY_BASELINE_R2_REVIEW` | R2 报告 |
| R3 | `CHATGPT_REMOTE_CLIENT_CONFIG_DIALOG_SPACING_ROW_SELECTION_CONFIRM_COPY_BASELINE_R3_REVIEW`（R3 当前入口，本就正确，保持确切值） | R3 报告 |

- 未改写、未虚构任何历史任务编号；错拼处仅作**前缀拼写**纠正，后缀（R0／`_R1_REVIEW`／`_R2_REVIEW`／`_R3_REVIEW`）与所指历史任务保持不变。
- 未对无关的 `AND` 字符串（如任务代码 `CLIENT-CONFIG-DIALOG-SPACING-ROW-SELECTION-AND-CONFIRM-COPY-BASELINE-001-*` 中的 `-AND-`）执行任何全局替换。

## 4. 现行下一入口统一为 R4

- 五份 Feature 文档的**现行下一入口**统一为 `CHATGPT_REMOTE_CLIENT_CONFIG_DIALOG_SPACING_ROW_SELECTION_CONFIRM_COPY_BASELINE_R4_REVIEW`；R3 入口（`_R3_REVIEW`）及更早的 R0／R1／R2 入口在当前状态块中按事实标为**历史入口**，字面值准确。
- 历史变更记录行中各自所属轮次的旧入口仍保留，字面值经核对准确（不因本轮同步而改写为 R4）。
- **不改**任何定义行。

## 5. 定义行逐字节保真（相对 R3）

对四份定义表格**逐行**对齐 R3 提交 `5bca41a` 与本任务工作区，**定义行**（首格恰为编号的行）比对结果：

| 文档 | 定义行数 | 相对 `5bca41a` |
|---|---|---|
| `REQUIREMENTS.md` | `CCFG-REQ-001~147`（147） | **逐字节零变化**（changed=0、added=0、removed=0） |
| `ACCEPTANCE.md` | `CCFG-AC-001~146`（146） | **逐字节零变化**（changed=0、added=0、removed=0；含 `CCFG-AC-142/143/145`） |
| `DESIGN.md` | `CCFG-DESIGN-001~082`（82） | **逐字节零变化**（changed=0、added=0、removed=0） |
| `UI.md` | `CCFG-UI-001~070`（70） | **逐字节零变化**（changed=0、added=0、removed=0） |

- 本任务对各文档的改动**仅限**现行下一入口／导航／追加变更记录等**说明性文字**与 15 处历史入口前缀拼写，未触及任何定义行／映射行；R3 的编号格 26/26、映射格 32/32、合计 58/58 事实**不变**。

## 6. 编号、覆盖与验收状态

| 文档 | 总数 | 连续唯一 | 映射矩阵 |
|---|---|---|---|
| `REQUIREMENTS.md` | **147**（`001~147`） | 是 | — |
| `ACCEPTANCE.md` | **146**（`001~146`） | 是 | §5 需求覆盖 147 行 |
| `DESIGN.md` | **82**（`001~082`） | 是 | §12.1 = 147 行、§12.2 = 146 行 |
| `UI.md` | **70**（`001~070`） | 是 | §14 关联矩阵（说明性文字）；70 个 `CCFG-UI-*` 编号全部登记于 `DESIGN.md` §12.1，覆盖 147/147 与 146/146 |

- 覆盖关系 需求→设计→界面→验收 **147/147**、需求→验收 **147/147**；R4 **未**新增／删除／重排任何编号，覆盖**未回退**。
- 全文件 `CCFG-AC-001~146`（**146** 条）**全部为 `NOT_RUN`**；`adjustment5_formal_acceptance_execution_status=NOT_RUN`。
- `PENDING_USER_CONFIRMATION=0`；`adjustment5_baseline_status=DRAFT_PENDING_USER_REVIEW`、`adjustment5_approval_status=NOT_APPROVED`、`adjustment5_implementation_status=NOT_STARTED`、`adjustment5_formal_acceptance_execution_status=NOT_RUN`；项目负责人已确认调整方向，但**尚未批准第五轮文档基线**。
- **历史层不改写**：第一至第四轮已批准基线与各轮实现事实逐条保留。

## 7. 未修改文件与未执行项

**未修改**：见 §2 末尾列表（含 `API.md`、`DATABASE.md`、`docs/baseline/**`、`docs/features/README.md`、历史报告含 R0～R3 报告、`docs/prompts/**`、前后端代码与测试、参考页）。

**未执行项（本任务明确不做）**：

- 未运行测试、Vitest、Maven 测试；未运行前后端构建、类型检查、lint。
- 未启动或停止任何服务；未做浏览器核对。
- 未执行正式验收；未访问数据库、ZooKeeper、Kafka。
- 未修改代码、配置、数据库对象；未创建或推广通用弹窗模板。
- 未改写任何历史定义行原文；未回写 R0～R3 报告。

## 8. 静态检查结果

| 检查项 | 命令／方法 | 结果 |
|---|---|---|
| 分支与提交 | `git branch --show-current`、`git rev-parse HEAD`、`git ls-remote origin refs/heads/develop` | `develop`；本地／`origin/develop`／远程三者均为 `5bca41a`，`0/0` |
| 空白／冲突标记 | `git diff --check` | 干净（退出码 0） |
| 变更白名单 | `git status --short` | 仅 5 份白名单文档 + 新增 1 份 R4 报告；未跟踪 `docs/prompts/` 与预先存在的 ` M .claude/settings.local.json`（与本任务无关，未暂存） |
| **错误历史入口计数（本任务核心）** | 逐文件统计错误前缀（`ROW_SELECTION_CONFIRM_COPY_BASELINE` 处多余 `_AND_`）出现数，并对 R2 提交 `9b729ec` 同法复核 | 起始 15 处（README 7、REQUIREMENTS 1、DESIGN 4、UI 3、ACCEPTANCE 0），起始提交前为 0 → 全由 R3 新增；纠正后 **15→0** |
| 正确历史入口核对 | 对照 R0～R3 报告核对 `_REVIEW`／`_R1_REVIEW`／`_R2_REVIEW`／`_R3_REVIEW` 字面值 | 各历史入口字面值与历史报告一致，未改写、未虚构 |
| 现行入口一致 | 五份文档检索 `..._R4_REVIEW` | 现行下一入口统一为 `CHATGPT_REMOTE_CLIENT_CONFIG_DIALOG_SPACING_ROW_SELECTION_CONFIRM_COPY_BASELINE_R4_REVIEW`；R0～R3 入口标为历史 |
| 编号连续唯一 | 逐文档提取 `CCFG-REQ/AC/DESIGN/UI` 编号并比对 `seq` | 需求 001~147、验收 001~146、设计 001~082、界面 001~070，均唯一连续无缺号 |
| `NOT_RUN` 计数 | 统计 `ACCEPTANCE.md` 中 `^\| CCFG-AC-\d{3} ` 行及其状态列 | 146 行用例、146 行 `NOT_RUN`（全部未执行） |
| 映射完整性 | 统计 `DESIGN.md` §12.1／§12.2、`ACCEPTANCE.md` §5 映射行，并核对 70 个 `CCFG-UI-*` 是否均登记于 §12.1 | §12.1 = 147（含 70 个 UI 编号，无缺项）、§12.2 = 146、§5 = 147；覆盖 147/147 与 146/146 |
| 定义行零改动 | 逐文件对齐 `5bca41a` 提取 `\| CCFG-*` 定义行比对 | 四份文档定义行 **changed=0、added=0、removed=0**（逐字节一致，含 `CCFG-AC-142/143/145`） |
| 状态口径 | 全文检索 `adjustment5_*`、`PENDING_USER_CONFIRMATION`、`NOT_RUN` | 五份文档均为 `DRAFT_PENDING_USER_REVIEW`／`NOT_APPROVED`／`NOT_STARTED`／`NOT_RUN`、`PENDING_USER_CONFIRMATION=0`，未混用「已批准／已实现／已验收」 |
| 历史分层不被改写 | 核对四轮基线状态与各轮实现事实 | 第一~第四轮已批准基线与各轮实现事实逐条保留；第四轮实现 R1 提交 `0c30b15` 的远程代码复审通过事实照实登记，其「尚未目测／尚未正式验收」边界明示 |
| R0／R1／R2／R3 报告完整性 | 核对 R0～R3 报告内容 | 未修改 |

## 9. 下一入口

本任务为**纯文档 R4 历史入口拼写纠错**，唯一结果提交后进入：

```text
next_entry=CHATGPT_REMOTE_CLIENT_CONFIG_DIALOG_SPACING_ROW_SELECTION_CONFIRM_COPY_BASELINE_R4_REVIEW
```

- 远程文档复审**通过**后，**仍须项目负责人另行批准第五轮基线**，才能另行进入代码实现；R4 复审通过**不**等于草案已批准。
- 本报告**不**作出「第五轮已复审／已批准／已实现／已验收」结论；三项已确认产品决定与全部定义行相对 R3 逐字节不变。
