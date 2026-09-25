# 探针端管理弹窗间距、启停确认文案与列表单行选中调整 · 基线草案 R3 证据计数勘误（含对 R2 报告的 errata／override）执行报告

> 任务代码：`CLIENT-CONFIG-DIALOG-SPACING-ROW-SELECTION-AND-CONFIRM-COPY-BASELINE-001-R3`
> 任务类型：纯文档（对 R2 **报告**的一处**证据计数口径**作**定向勘误**，**不**改动任何业务定义、**不**重新设计三项已确认产品决定）
> 分支：`develop`
> 起始提交：`9b729ec07f5903656365f704acef38261a136c53`（第五轮 R2 定向纠错提交）
> R0 报告（**本任务不修改**，仅作历史证据）：`docs/features/client-config/reports/CLIENT-CONFIG-DIALOG-SPACING-ROW-SELECTION-AND-CONFIRM-COPY-BASELINE-001.md`
> R1 报告（**本任务不修改**，仅作历史证据）：`docs/features/client-config/reports/CLIENT-CONFIG-DIALOG-SPACING-ROW-SELECTION-AND-CONFIRM-COPY-BASELINE-001-R1.md`
> R2 报告（**本任务不修改**，仅作历史证据；本报告对其中两处 `58/58` 表述作 errata／override）：`docs/features/client-config/reports/CLIENT-CONFIG-DIALOG-SPACING-ROW-SELECTION-AND-CONFIRM-COPY-BASELINE-001-R2.md`
> 下一入口：`CHATGPT_REMOTE_CLIENT_CONFIG_DIALOG_SPACING_ROW_SELECTION_CONFIRM_COPY_BASELINE_R3_REVIEW`
> 本任务不修改代码、不执行正式验收、不改写 R0／R1／R2 报告与历史定义原文、不改变三项已确认产品决定，不作出「本轮已复审／已批准／已实现／已验收」结论。

---

## 1. 门禁与基线

```text
branch=develop
expected_base_commit=9b729ec07f5903656365f704acef38261a136c53
actual_base_commit=9b729ec07f5903656365f704acef38261a136c53
origin_develop=9b729ec07f5903656365f704acef38261a136c53
remote_refs_heads_develop=9b729ec07f5903656365f704acef38261a136c53
ahead_behind(origin/develop...HEAD)=0/0
r2_remote_review_result=CHANGES_REQUIRED
r3_correction_count=1
adjustment5_baseline_status=DRAFT_PENDING_USER_REVIEW
adjustment5_approval_status=NOT_APPROVED
adjustment5_implementation_status=NOT_STARTED
adjustment5_formal_acceptance_execution_status=NOT_RUN
git_commit_authorized=仅限本次白名单文档
git_push_authorized=仅限本次白名单文档普通推送至 origin/develop
```

- 当前分支为 `develop`，本地 `HEAD`、`origin/develop` 与远程 `refs/heads/develop` 三者一致（`9b729ec`），ahead/behind 为 `0/0`，无分叉、无冲突，未触发停线条件。
- 任务开始前已存在的无关工作区内容**保持原样、未修改、未暂存**：` M .claude/settings.local.json` 与未跟踪的 `docs/prompts/**`。
- **R2 复审结论**：ChatGPT 从远程 Git 对 R2 提交 `9b729ec` 的复审结论为 `CHANGES_REQUIRED`。复审**通过**了静态检查项——六文件白名单、连续编号 需求 147／验收 146／设计 82／界面 70、146 条验收用例全部 `NOT_RUN`，且确认**双击验收规则与 R2 的业务定义均无问题**；**唯一**须修正的是 R2 **报告**的一处**证据计数口径**（R3-01），**不**要求改动任何定义行，也**不**要求重新设计三项已确认产品决定。
- 开工时核实的四类定义计数为 需求 `CCFG-REQ-001~147`（147）、验收 `CCFG-AC-001~146`（146）、设计 `CCFG-DESIGN-001~082`（82）、界面 `CCFG-UI-001~070`（70），均连续唯一无缺号。

## 2. 实际变更文件

| 文件 | 变更类型 | 说明 |
|---|---|---|
| `docs/features/client-config/reports/CLIENT-CONFIG-DIALOG-SPACING-ROW-SELECTION-AND-CONFIRM-COPY-BASELINE-001-R3.md` | **新增** | 本报告（对 R2 报告 §4.2／§4.3 两处 `58/58` 映射单元表述作 errata／override，并给出 32／26／58 独立复核证据） |
| `docs/features/client-config/REQUIREMENTS.md` | 修改 | 元数据与§1 现行下一入口同步为 R3（R2／R1／R0 入口转历史）、§10 变更记录新增 R3 行；**未修改任何需求定义行** |
| `docs/features/client-config/ACCEPTANCE.md` | 修改 | 元数据与§1.9 分层状态块现行下一入口同步为 R3（R2／R1／R0 入口转历史）、§1.9 补 R3 勘误行、§6 变更记录新增 R3 行；**未修改任何验收定义行** |
| `docs/features/client-config/DESIGN.md` | 修改 | 元数据与第五轮分层行（§1／§17）现行下一入口同步为 R3（R2／R1／R0 入口转历史）、§18 变更记录新增 R3 行；**未修改任何设计定义行** |
| `docs/features/client-config/UI.md` | 修改 | 元数据与第五轮分层行现行下一入口同步为 R3（R2／R1／R0 入口转历史）、§20 变更记录新增 R3 行；**未修改任何界面定义行** |
| `docs/features/client-config/README.md` | 修改 | §1.11 补 R3 定向修订条目与 R3 改动范围条目、§2 导航新增 R3 报告行并同步四处文档状态单元为现行下一入口 R3、§5 把 R2 设为历史下一入口并新增「当前下一入口（R3）」 |

**未修改**：`docs/features/client-config/API.md`、`DATABASE.md`、`docs/baseline/**`（含两套查询／列表视觉模板的 README／SHARED_COMPONENT_DESIGN／MIGRATION）、`docs/features/README.md`、任何历史报告（**含 R0、R1、R2 报告**）、`docs/prompts/**`、前后端代码与测试、`CLAUDE.md`、`agent-env.sh`、参考页 `frontend/src/views/data-source/DataSourcePage.vue`、数据库对象与构建依赖。

## 3. 证据计数勘误（R3-01，本任务唯一纠错）

本任务为**纯文档计数勘误**，**不**改动任何业务定义、**不**改动任何验收／设计／界面／需求定义行，**不**改变三项已确认产品决定。修订方式为：**只新增**本 R3 报告作 errata／override，并在五份 Feature 文档同步**现行复审入口／导航／追加变更记录**。

### 3.1 R2 报告原文（被本报告覆盖的两处表述）

R2 报告在 §4.2、§4.3（及 §8「R0→R1 勘误事实」行）把 R0→R1 的逐字保持单元一律记为“**映射单元 `58/58`**”：

> “**映射保持：成立。** 所有引用／映射单元 **58/58** 逐字一致——R1 报告“尾部（引用）映射列逐字节保留”在**映射列**这一半上是事实。”（R2 报告 §4.2）
> “应表述为：**“映射列 58/58 逐字保持；正文 26 行中 17 行为纯追加、9 行为含删除的局部替换……”**”（R2 报告 §4.3）

**本条更正：`58` 是对两个不同类别单元的合计，不能单独称为“映射（列）单元 58/58”。**

### 3.2 统计方法与单元定义

以 R0 `3f1fdd423df4377c59c73dad968d65b592b5e717` 与 R1 `43016ffcf57b602100ddc94d26b4aba6ccf6262e` 的实际 Git 对象为准，对四份定义表格逐行提取 `CCFG-*` **定义行**（首格**恰为**编号的行；排除变更记录、追踪矩阵等也含编号的行），剥离 `**【…】**` 标注与 `**` 加粗、去空白后分类计数：

1. **编号首格**：每条被改动定义行的**第一格**（定义编号本身）。编号是行身份，逐字保持，按“改动行数”计 1 格／行。
2. **尾部引用／映射单元格**：定义行中**除首格以外**、内容为编号引用的格（形如 `CCFG-XX-nnn` 或以顿号／逗号分隔的编号串），即：
   - `DESIGN.md`／`UI.md` 的**关联需求**、**关联验收**两列；
   - `ACCEPTANCE.md` 的**关联需求**列；
   - `REQUIREMENTS.md` **定义表不设尾部映射列**（表形为 `| ID | 需求描述 |`），故其改动行**不产生**映射格。

3. 两类合计即为 R2 所称的 `58`。

### 3.3 复核结果（独立复算，未照抄提示）

对 R0→R1 的 **26** 条已变更定义行逐格复核，结果如下：

| 类别 | 计数 | 逐类分解 |
|---|---|---|
| 定义编号首格 | **26/26** 逐字一致 | 需求 7 + 验收 6 + 设计 6 + 界面 7 |
| 尾部引用／映射单元格 | **32/32** 逐字一致 | 验收 6×1 + 设计 6×2 + 界面 7×2 |
| **两类合计** | **58/58** | 26 + 32 = 58 |

- 26 条已变更定义行（R2 已列，此处复核不变）：需求 `REQ-020/094/142/143/144/146/147`、验收 `AC-016/141/142/143/145/146`、设计 `DESIGN-040/077/078/079/081/082`、界面 `UI-004/005/065/066/067/069/070`。
- 因此：R2 所称 `58/58` 的**总数**正确，但其**标签**“映射单元／映射列”**错**——58 之中只有 **32** 个是真正的尾部引用／映射格；另 **26** 个是**编号首格**（其中 `REQUIREMENTS.md` 的 7 条改动行**没有**尾部映射列，其可逐字核对的非正文单元就只有编号首格本身）。

### 3.4 errata／override 声明

- **R2 报告 §4.2、§4.3（及 §8「R0→R1 勘误事实」行）关于“引用／映射单元 `58/58`”“映射列 `58/58` 逐字保持”的表述，由本 R3 报告覆盖并更正。**
- **正确事实**：**定义编号首格 `26/26`**（需求 7 + 验收 6 + 设计 6 + 界面 7）；**尾部引用／映射单元格 `32/32`**（验收 6×1 + 设计 6×2 + 界面 7×2）；**两类合计 `58/58`**。`REQUIREMENTS.md` 定义表**不设**尾部映射列。
- R0／R1／R2 报告作为**历史证据原样保留**（不回写、不删除）；本 R3 报告为**追加式**勘误／override，不改动其字节内容。
- 本勘误**仅涉计数口径与文字标签**，**不**触及任何业务规则、**不**触及任何定义行内容。

## 4. 不受此次数字勘误影响的 R2 结论

以下 R2 结论**与本次计数标签勘误无关，继续成立**，本任务**不**作任何改动：

- **26 条已变更定义行的事实本身成立**（清单见 §3.3）；R3 **未**新增／删除／重排任何定义行。
- **原文保真分类成立**：26 行中 **17 行**为“**原文仅插入**”（旧正文为新正文的子序列，纯追加标注／加粗／插字），**9 行**为“含删除的**局部替换**”。R3 复算结果与 R2 **一致**。
- **`CCFG-AC-145` 属整体替换的判定成立**：其**前置条件／步骤／预期**三单元同时被替换（前置由不可构造的“先按关键词查询命中该探针、再启停使其失配”改为可构造的**状态筛选**情形），方向正确；本任务**不**回退该替换、**不**改动 `CCFG-AC-145`。
- **R2 修正的双击验收口径成立**：`CCFG-AC-142` 已改写为四类**可直接执行与判断**的双击结果，`CCFG-AC-143` 已将“行双击编辑”移出行内控件隔离测试、改由 `CCFG-AC-142` 验证。R3 **不**改动 `CCFG-AC-142/143`。
- 上述四项均为 R2 报告已核验**正确**的结论，R3 复审亦**未**发现新问题；R3 的**唯一**改动是 §3 的计数标签更正。

## 5. 定义行逐字节保真（相对 R2）

对四份定义表格**逐行**对齐 R2 提交 `9b729ec` 与本任务工作区，**定义行**（首格恰为编号的行）比对结果：

| 文档 | 定义行数 | 相对 `9b729ec` |
|---|---|---|
| `REQUIREMENTS.md` | `CCFG-REQ-001~147`（147） | **逐字节零变化**（changed=0、added=0、removed=0） |
| `ACCEPTANCE.md` | `CCFG-AC-001~146`（146） | **逐字节零变化**（changed=0、added=0、removed=0；含 `CCFG-AC-142/143/145`） |
| `DESIGN.md` | `CCFG-DESIGN-001~082`（82） | **逐字节零变化**（changed=0、added=0、removed=0） |
| `UI.md` | `CCFG-UI-001~070`（70） | **逐字节零变化**（changed=0、added=0、removed=0） |

- 本任务对各文档的改动**仅限**元数据／现行下一入口／导航／追加变更记录等**说明性文字**，未触及任何定义行；**未**新增／删除／重排任何定义行、映射行或验收用例。

## 6. 编号、覆盖与验收状态

| 文档 | 总数 | 连续唯一 | 映射矩阵 |
|---|---|---|---|
| `REQUIREMENTS.md` | **147**（`001~147`） | 是 | — |
| `ACCEPTANCE.md` | **146**（`001~146`） | 是 | §5 需求覆盖 147 行 |
| `DESIGN.md` | **82**（`001~082`） | 是 | §12.1 = 147 行、§12.2 = 146 行 |
| `UI.md` | **70**（`001~070`） | 是 | §14 关联矩阵（说明性文字）；70 个 `CCFG-UI-*` 编号全部登记于 `DESIGN.md` §12.1，覆盖 147/147 与 146/146 |

- 覆盖关系 需求→设计→界面→验收 **147/147**、需求→验收 **147/147**；R3 **未**新增／删除／重排任何编号，覆盖**未回退**。
- 全文件 `CCFG-AC-001~146`（**146** 条）**全部为 `NOT_RUN`**（逐行核对状态列，146/146 命中 `NOT_RUN`）；`adjustment5_formal_acceptance_execution_status=NOT_RUN`。
- `PENDING_USER_CONFIRMATION=0`；`adjustment5_baseline_status=DRAFT_PENDING_USER_REVIEW`、`adjustment5_approval_status=NOT_APPROVED`、`adjustment5_implementation_status=NOT_STARTED`、`adjustment5_formal_acceptance_execution_status=NOT_RUN`。
- **历史层不改写**：第一至第四轮已批准基线与各轮实现事实逐条保留；第四轮实现 R1 提交 `0c30b15` 的远程代码复审通过事实照实登记，其「尚未目测／尚未正式验收」边界明示。

## 7. 未修改文件与未执行项

**未修改**：见 §2 末尾列表（含 `API.md`、`DATABASE.md`、`docs/baseline/**`、`docs/features/README.md`、历史报告含 R0／R1／R2 报告、`docs/prompts/**`、前后端代码与测试、参考页）。

**未执行项（本任务明确不做）**：

- 未运行测试、Vitest、Maven 测试；未运行前后端构建、类型检查、lint。
- 未启动或停止任何服务；未做浏览器核对。
- 未执行正式验收；未访问数据库、ZooKeeper、Kafka。
- 未修改代码、配置、数据库对象；未创建或推广通用弹窗模板。
- 未改写任何历史定义行原文；未回写 R0／R1／R2 报告；未改写第一至第四轮已批准基线与各轮实现事实。

## 8. 静态检查结果

| 检查项 | 命令／方法 | 结果 |
|---|---|---|
| 分支与提交 | `git branch --show-current`、`git rev-parse HEAD`、`git ls-remote origin refs/heads/develop` | `develop`；本地／`origin/develop`／远程三者均为 `9b729ec`，`0/0` |
| 空白／冲突标记 | `git diff --check` | 干净（退出码 0） |
| 变更白名单 | `git status --short` | 仅 5 份白名单文档 + 新增 1 份 R3 报告；未跟踪 `docs/prompts/` 与预先存在的 ` M .claude/settings.local.json`（与本任务无关，未暂存） |
| 编号连续唯一 | 逐文档提取 `CCFG-REQ/AC/DESIGN/UI` 编号并比对 `seq` | 需求 001~147、验收 001~146、设计 001~082、界面 001~070，均唯一连续无缺号 |
| `NOT_RUN` 计数 | 统计 `ACCEPTANCE.md` 中 `^\| CCFG-AC-\d{3} ` 行及其状态列 | 146 行用例、146 行 `NOT_RUN`（全部未执行） |
| 映射完整性 | 统计 `DESIGN.md` §12.1／§12.2、`ACCEPTANCE.md` §5 映射行，并核对 70 个 `CCFG-UI-*` 是否均登记于 §12.1 | §12.1 = 147（含 70 个 UI 编号，无缺项）、§12.2 = 146、§5 = 147；覆盖 147/147 与 146/146 |
| 定义行零改动 | 逐文件对齐 `9b729ec` 提取 `\| CCFG-*` 定义行比对 | 四份文档定义行 **changed=0、added=0、removed=0**（逐字节一致，含 `CCFG-AC-142/143/145`） |
| **R0→R1 计数复核（本任务核心）** | 剥离标注／加粗后对 26 条改动定义行分“编号首格”与“尾部引用／映射格”两类独立计数 | 编号首格 **26/26**（REQ 7 + AC 6 + DESIGN 6 + UI 7）；尾部引用／映射格 **32/32**（AC 6×1 + DESIGN 6×2 + UI 7×2；`REQUIREMENTS.md` 无映射列）；合计 **58/58** |
| 状态口径 | 全文检索 `adjustment5_*`、`PENDING_USER_CONFIRMATION`、`NOT_RUN` | 五份文档均为 `DRAFT_PENDING_USER_REVIEW`／`NOT_APPROVED`／`NOT_STARTED`／`NOT_RUN`、`PENDING_USER_CONFIRMATION=0`，未混用「已批准／已实现／已验收」 |
| 现行入口唯一化 | 检索 `..._SPACING_ROW_SELECTION(_AND)_CONFIRM_COPY_BASELINE_R3_REVIEW` | 现行入口统一为 `..._SPACING_ROW_SELECTION_CONFIRM_COPY_BASELINE_R3_REVIEW`；R2／R1／R0 入口均标注为**历史** |
| 历史分层不被改写 | 核对四轮基线状态与各轮实现事实 | 第一~第四轮已批准基线与各轮实现事实逐条保留；第四轮实现 R1 提交 `0c30b15` 的远程代码复审通过事实照实登记，其「尚未目测／尚未正式验收」边界明示 |
| R0／R1／R2 报告完整性 | 核对 R0／R1／R2 报告内容 | 未修改（仅由本 R3 报告追加 errata／override） |

## 9. 下一入口

本任务为**纯文档 R3 证据计数勘误**，唯一结果提交后进入：

```text
next_entry=CHATGPT_REMOTE_CLIENT_CONFIG_DIALOG_SPACING_ROW_SELECTION_CONFIRM_COPY_BASELINE_R3_REVIEW
```

- 远程文档复审**通过**后，**仍须项目负责人另行批准第五轮基线**，才能另行进入代码实现；R3 复审通过**不**等于草案已批准。
- 本报告**不**作出「第五轮已复审／已批准／已实现／已验收」结论；三项已确认产品决定与全部定义行相对 R2 逐字节不变。
