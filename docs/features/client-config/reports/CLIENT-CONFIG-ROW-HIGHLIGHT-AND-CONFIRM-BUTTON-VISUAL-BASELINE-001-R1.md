# 探针端管理行高亮与启停确认按钮视觉调整 · 基线草案 R1 定向纠错 执行报告

> 任务代码：`CLIENT-CONFIG-ROW-HIGHLIGHT-AND-CONFIRM-BUTTON-VISUAL-BASELINE-001-R1`
> 任务类型：纯文档（仅将 ChatGPT 对 R0 草案的 `CHANGES_REQUIRED` 三处事实／可执行性问题作**定向修订**，**不**改动两项已确认视觉方向、**不**进入代码实现、**不**执行验收）
> 分支：`develop`
> 起始提交：`4ec52b404e08731b7a2fa8c22d59d30b4fcadcd7`（第六轮基线草案 R0 提交）
> R0 报告（**本任务不修改**，仅作历史证据，其失效表述由本报告 §3.2 errata／override 表承接）：`docs/features/client-config/reports/CLIENT-CONFIG-ROW-HIGHLIGHT-AND-CONFIRM-BUTTON-VISUAL-BASELINE-001.md`
> 现行下一入口：`CHATGPT_REMOTE_CLIENT_CONFIG_ROW_HIGHLIGHT_AND_CONFIRM_BUTTON_VISUAL_BASELINE_R1_REVIEW`
> 本任务不修改代码、测试与构建产物，不启动服务，不访问数据库／ZooKeeper／Kafka，不执行正式验收，不改写 R0 报告与第一至第五轮历史报告，不改变两项已确认视觉方向，不作出「本轮已复审／已批准／已实现／已验收」结论。

---

## 1. 门禁与基线

```text
branch=develop
expected_base_commit=4ec52b404e08731b7a2fa8c22d59d30b4fcadcd7
actual_base_commit=4ec52b404e08731b7a2fa8c22d59d30b4fcadcd7
origin_develop=4ec52b404e08731b7a2fa8c22d59d30b4fcadcd7
remote_refs_heads_develop=4ec52b404e08731b7a2fa8c22d59d30b4fcadcd7
ahead_behind(origin/develop...HEAD)=0/0
r0_remote_review_result=CHANGES_REQUIRED
r1_correction_count=3
adjustment6_baseline_status=DRAFT_PENDING_USER_REVIEW
adjustment6_approval_status=NOT_APPROVED
adjustment6_implementation_status=NOT_STARTED
adjustment6_formal_acceptance_execution_status=NOT_RUN
git_commit_authorized=仅限本次白名单文档
git_push_authorized=仅限本次白名单文档普通推送至 origin/develop
```

- 当前分支为 `develop`，本地 `HEAD`、`origin/develop` 与远程 `refs/heads/develop` 三者一致（`4ec52b4`），ahead/behind 为 `0/0`，无分叉、无冲突，未触发停线条件。
- 任务开始前已存在的无关工作区内容**保持原样、未修改、未暂存**：` M .claude/settings.local.json` 与未跟踪的 `docs/prompts/**`、`runtime-logs/**`。
- **R0 复审结论**：ChatGPT 从远程 Git 对 R0 提交 `4ec52b4` 的远程**基线文档**复审结论为 `CHANGES_REQUIRED`。复审**接受**第六轮新增编号与映射（`CCFG-REQ-148~152`／`CCFG-AC-147~154`／`CCFG-DESIGN-083~087`／`CCFG-UI-071~075`）、既有定义行保护与两项产品方向；**仅**须修正**三处**事实／可执行性问题（R1-01／R1-02／R1-03），**不**要求改动编号、映射与既有定义行。
- 开工时核实的四类定义计数为 需求 `CCFG-REQ-001~152`（152）、验收 `CCFG-AC-001~154`（154）、设计 `CCFG-DESIGN-001~087`（87）、界面 `CCFG-UI-001~075`（75），均连续唯一无缺号。

## 2. 实际变更文件

| 文件 | 变更类型 | 说明 |
|---|---|---|
| `docs/features/client-config/reports/CLIENT-CONFIG-ROW-HIGHLIGHT-AND-CONFIRM-BUTTON-VISUAL-BASELINE-001-R1.md` | **新增** | 本报告（含 §3.2 R0 报告 errata／override 表） |
| `docs/features/client-config/REQUIREMENTS.md` | 修改 | 同步第五轮实现 R1 远程代码复审事实与 `IMPLEMENTED_PENDING_USER_ACCEPTANCE`（元数据与本轮实现状态）、第六轮现行下一入口改为 R1 入口、§7.14 追加 R1 时序更正、§7 追加第六轮 R1 定向纠错说明、§10 变更记录新增 R1 行；修订 `CCFG-REQ-150`（R1-03）、`CCFG-REQ-152`（R1-02） |
| `docs/features/client-config/ACCEPTANCE.md` | 修改 | §1.9 分层状态块与下一入口同步、§1.10 前言与下一入口同步为 R1 入口并新增 R1 纠错行、§2 第五轮口径与累计声明同步、§6 变更记录新增 R1 行；修订 `CCFG-AC-151`／`CCFG-AC-152`（R1-03）、`CCFG-AC-154`（R1-02） |
| `docs/features/client-config/DESIGN.md` | 修改 | 元数据「第五轮调整实现状态」行与 §1 实现状态行（第五轮子句）同步为 `IMPLEMENTED_PENDING_USER_ACCEPTANCE` 与 R1 `APPROVED` 事实、第五轮入口归档、第六轮现行入口改 R1 入口、§17 第五轮状态分层同步、§18 状态块追加 R1 纠错说明、§19 变更记录新增 R1 行并为第五轮实现 R1 行补时序标注；修订 `CCFG-DESIGN-085`／`CCFG-DESIGN-086`（R1-03）、`CCFG-DESIGN-087`（R1-02） |
| `docs/features/client-config/UI.md` | 修改 | 元数据「第五轮…调整分层」行同步、§19 第五轮状态分层同步、§20 状态块追加 R1 纠错说明、§21 变更记录新增 R1 行并为第五轮实现 R1 行补时序标注；修订 `CCFG-UI-074`（R1-03）、`CCFG-UI-075`（R1-02） |
| `docs/features/client-config/README.md` | 修改 | §1.11 状态块值／入口与状态边界／实现记录／下一入口同步为 R1 事实、§1.12 标题与 next_entry 与下一入口同步为 R1 入口并新增 R1 定向纠错与改动范围条目、§2 四处文档状态单元格与新增 R1 报告导航行、§4 三条当前状态条目同步、§5 第五轮实现 R1 历史入口与第六轮当前下一入口同步 |

**未修改**：`docs/features/client-config/API.md`、`DATABASE.md`、`docs/baseline/**`（含六份项目级基线与两套查询／列表视觉模板的 README／SHARED_COMPONENT_DESIGN／MIGRATION）、`docs/features/README.md`、任何历史报告（**含第六轮 R0 报告与第一至第五轮全部报告**）、`docs/prompts/**`、前后端代码与测试、`CLAUDE.md`、`agent-env.sh`、`.claude/settings.json`、`.claude/skills/**`、参考页 `frontend/src/views/data-source/DataSourcePage.vue`、数据库对象与构建依赖。

## 3. R1-01 第五轮实现 R1 远程代码复审事实同步

### 3.1 事实

- ChatGPT 从远程 Git 对第五轮实现 R1 结果提交 `b609303b77dbde6a97fb6905a0b7b9c6fa0c6d25` 的远程**代码**复审**已完成、结论 `APPROVED`；项目负责人随后对第五轮页面**六项行为**做过实际页面目测、反馈与预期一致。
- 上述均为**事实记录**，**不**等于 146 条正式验收已执行或被改判，也**不**代表探针端管理功能已最终接受。
- 第五轮实现状态**现行值**按仓库既有命名口径更新为 `adjustment5_implementation_status=IMPLEMENTED_PENDING_USER_ACCEPTANCE`（已过 ChatGPT 代码复审、等待项目负责人最终接受）；第五轮已批准基线 `adjustment5_baseline_status=APPROVED` 与其已实现事实**不回退**。
- 原 `CHATGPT_REMOTE_CLIENT_CONFIG_DIALOG_SPACING_ROW_SELECTION_CONFIRM_COPY_IMPLEMENTATION_R1_REVIEW` 入口**已完成并降为历史入口**。
- 第六轮现行下一入口改为 `CHATGPT_REMOTE_CLIENT_CONFIG_ROW_HIGHLIGHT_AND_CONFIRM_BUTTON_VISUAL_BASELINE_R1_REVIEW`；R0 入口 `..._BASELINE_REVIEW` 已完成、结论 `CHANGES_REQUIRED`，降为历史入口。
- `adjustment6_*` 保持 `DRAFT_PENDING_USER_REVIEW`／`NOT_APPROVED`／`NOT_STARTED`／`NOT_RUN`；154 条验收仍全部 `NOT_RUN`。

### 3.2 R0 报告 errata／override 表（不改写 R0 报告，以本表承接）

R0 报告内“已通过”与“仍待推进”**自相矛盾**。按任务约定**不**改写 R0 报告，改由本表逐条给出失效表述、正确事实与现行入口：

| # | R0 报告位置 | 失效表述（原文要点） | 正确事实 | 现行入口 |
|---|---|---|---|---|
| E-1 | R0 报告 §1 门禁状态块 `adjustment5_implementation_status` | `adjustment5_implementation_status=IMPLEMENTED_PENDING_CHATGPT_REVIEW` | `adjustment5_implementation_status=IMPLEMENTED_PENDING_USER_ACCEPTANCE`（第五轮实现 R1 提交 `b609303b77dbde6a97fb6905a0b7b9c6fa0c6d25` 的远程**代码**复审已完成、结论 `APPROVED`，等待项目负责人最终接受） | `CHATGPT_REMOTE_CLIENT_CONFIG_ROW_HIGHLIGHT_AND_CONFIRM_BUTTON_VISUAL_BASELINE_R1_REVIEW` |
| E-2 | R0 报告 §分层状态表「第五轮 `adjustment5_implementation_status`」行 | “`IMPLEMENTED_PENDING_CHATGPT_REVIEW`（**不回退**；**实现 R1 远程代码复审仍待推进**）” | 该远程代码复审**已完成、结论 `APPROVED`**；状态转为 `IMPLEMENTED_PENDING_USER_ACCEPTANCE`，已实现事实**不回退** | 同上 |
| E-3 | R0 报告 §下一入口句 | “`CHATGPT_REMOTE_CLIENT_CONFIG_DIALOG_SPACING_ROW_SELECTION_CONFIRM_COPY_IMPLEMENTATION_R1_REVIEW` **仍待推进**，本轮草案建立后已降为历史入口” | 该入口**已完成、结论 `APPROVED`**（对象为 R1 结果提交 `b609303b77dbde6a97fb6905a0b7b9c6fa0c6d25`），确为**历史入口** | 同上 |

- R0 报告头部“实现 R1 提交 `b609303…` 已通过 ChatGPT 远程代码复审（`APPROVED`）、**尚未**获得项目负责人最终页面接受或正式验收”一句**本身正确**，无需覆盖；失效项**仅**为上表 E-1～E-3（把同一事实写成“仍待推进／仍在审”）。
- 五份可编辑 Feature 文档按上表口径**修订当前状态／导航**，对确属历史时点的文本**保留原文并加时序标注**（如“实现完成时点曾停在远程代码复审入口，属历史时点”；DESIGN／UI 中第五轮实现 R1 任务的变更记录行补注该 `IMPLEMENTED_PENDING_CHATGPT_REVIEW` 为**该时点值**、其后已转 `IMPLEMENTED_PENDING_USER_ACCEPTANCE`）。
- 同步落点：`README.md` §1.11／§1.12／§2／§4／§5，`REQUIREMENTS.md` 元数据与 §7.14 及 §10，`ACCEPTANCE.md` §1.9／§1.10／§2／§6，`DESIGN.md` 元数据（含 §1 实现状态行）与 §17／§18／§19，`UI.md` 元数据与 §19／§20／§21；历史时点表述一律**保留原文 + 时序标注**，不改写。

## 4. R1-02 删除确认框“原有危险色主确认按钮”事实纠正

- 事实来源（只读核对）：`frontend/src/views/client-config/ClientConfigPage.vue` 中删除确认框 `ElMessageBox.confirm` **仅**传入 `type: 'warning'` 与按钮文案“删除／取消”，**未**为其主确认按钮设置任何危险色样式；`type: 'warning'` 不足以支撑“其主确认按钮原为红色／危险色”的断言；列表“更多”菜单中红色的“删除”**条目**是菜单项，**不**等同于删除确认框主按钮。
- 修订后目标口径：删除确认框**维持本轮开始时的实际外观与行为**、**不**被仅作用于启用／停用确认框的按钮样式波及——保留其 `type: 'warning'` 警示语义、既有删除文案与二次确认；本轮**不**改动删除操作、**不**重新设计其危险色；`/config/data-source` 对照为**只读**。
- 落点：`CCFG-REQ-152`（需求）、`CCFG-AC-154`（验收，前置／步骤／期望均可在当前页面构造与目测）、`CCFG-UI-075`（界面）、`CCFG-DESIGN-087`（设计）及相应解释性文字。
- 编号、映射与其余定义行**不变**。

## 5. R1-03 启停确认按钮“处理中态”范围与可执行验收口径

- 现行流程事实：启用／停用确认为“点击主确认按钮后确认框**先关闭**、随后才调用启用／停用接口”，因此**不存在**“接口请求处理中仍显示该确认框主按钮”的用户可观察阶段；以延迟接口构造该弹窗按钮“处理中态”**不可执行**，把不可见状态判为通过／失败**不可采信**。
- 修订后口径：`CCFG-AC-151`／`CCFG-AC-152` 的步骤与期望改为**直接**观察主确认按钮**正常／悬停／按下／键盘焦点**四态，并在点击确认后核对**确认框关闭、写请求次数（一次确认只写一次、取消不发写请求）与既有交互边界**；**不**构造、**不**判定不可见的“处理中态”。
- 适用范围说明落点：`CCFG-REQ-150`、`CCFG-DESIGN-085`、`CCFG-DESIGN-086`、`CCFG-UI-074`。若组件在**确实出现**的加载／禁用等真实状态下，其主按钮视觉**同样不得**跳蓝、样式矩阵须覆盖该态；但**不**得为此新增 `beforeClose`、**不**得改变“确认关闭”与“发请求”的先后顺序、**不**得扩展功能——本轮**只改视觉**。
- 代码事实优先：本纠正以当前 Git 中的页面代码为准（页面未使用 `customClass`／`beforeClose`／`loading`，亦无 `.el-message-box` 样式），未发现代码与现行文档的其他冲突。

## 6. 定义行逐字节保真（相对 R0 提交 `4ec52b4`）

对四份定义表格**逐行**提取（首格恰为编号的行，含需求／验收／设计／界面定义行及 `DESIGN.md` §12.1／§12.2、`ACCEPTANCE.md` §5 映射行），对齐 R0 提交 `4ec52b4` 与本任务工作区：

| 文档 | 定义行数（工作区） | 相对 `4ec52b4` | 允许并实际修订的行 |
|---|---|---|---|
| `REQUIREMENTS.md` | `CCFG-REQ-001~152`（152） | changed=**2**、added=0、removed=0 | `CCFG-REQ-150`、`CCFG-REQ-152` |
| `ACCEPTANCE.md` | `CCFG-AC-001~154`（154，另有 152 条 REQ 映射行） | changed=**3**、added=0、removed=0 | `CCFG-AC-151`、`CCFG-AC-152`、`CCFG-AC-154` |
| `DESIGN.md` | `CCFG-DESIGN-001~087`（87，另有 152／154 条映射行） | changed=**3**、added=0、removed=0 | `CCFG-DESIGN-085`、`CCFG-DESIGN-086`、`CCFG-DESIGN-087` |
| `UI.md` | `CCFG-UI-001~075`（75） | changed=**2**、added=0、removed=0 | `CCFG-UI-074`、`CCFG-UI-075` |

- **实际修订行合计 10 条**，**恰好等于**允许清单（`CCFG-REQ-150/152`、`CCFG-AC-151/152/154`、`CCFG-DESIGN-085/086/087`、`CCFG-UI-074/075`）；其余**全部**定义行与映射行相对 `4ec52b4` **逐字节零变化**，既无新增、亦无删除或重排。
- 六轮编号首格、映射列与 `NOT_RUN` 状态列**未被误改**（映射行 changed=0）。

## 7. 编号、覆盖与验收状态分层

| 文档 | 总数 | 连续唯一 | 映射矩阵 |
|---|---|---|---|
| `REQUIREMENTS.md` | **152**（`001~152`） | 是 | — |
| `ACCEPTANCE.md` | **154**（`001~154`） | 是 | §5 需求覆盖 152 行 |
| `DESIGN.md` | **87**（`001~087`） | 是 | §12.1 = 152 行、§12.2 = 154 行 |
| `UI.md` | **75**（`001~075`） | 是 | 关联矩阵（说明性文字）；75 个 `CCFG-UI-*` 编号全部登记于 `DESIGN.md` §12.1，覆盖 152/152 与 154/154 |

- 覆盖关系 需求→设计→界面→验收 **152/152**、需求→验收 **152/152**；R1 **未**新增／删除／重排任何编号，覆盖**未回退**。
- 全文件 `CCFG-AC-001~154`（**154** 条）**全部为 `NOT_RUN`**；`adjustment6_formal_acceptance_execution_status=NOT_RUN`。
- `PENDING_USER_CONFIRMATION=0`；`adjustment6_baseline_status=DRAFT_PENDING_USER_REVIEW`、`adjustment6_approval_status=NOT_APPROVED`、`adjustment6_implementation_status=NOT_STARTED`、`adjustment6_formal_acceptance_execution_status=NOT_RUN`（五份文档口径一致）。
- **分层不被混淆**：第五轮已批准基线 `adjustment5_baseline_status=APPROVED` 与其已实现事实**不回退**；其实现状态按 R1-01 更新为 `IMPLEMENTED_PENDING_USER_ACCEPTANCE`（等待项目负责人最终接受）；第一至第四轮已批准基线与各轮实现事实逐条保留。

## 8. 未修改文件与未执行项

**未修改**：见 §2 末尾列表（含 `API.md`、`DATABASE.md`、`docs/baseline/**`、`docs/features/README.md`、历史报告含第六轮 R0 报告、`docs/prompts/**`、前后端代码与测试、参考页、`.claude/settings*.json`、`agent-env.sh`、`CLAUDE.md`）。

**未执行项（本任务明确不做）**：

- 未运行测试、Vitest、Maven 测试；未运行前后端构建、类型检查、lint。
- 未启动或停止任何服务；未做浏览器核对；未做远程代码复审。
- 未执行正式验收；未访问数据库、ZooKeeper、Kafka。
- 未修改代码、配置、数据库对象；未创建或推广通用弹窗模板；未新增全局 Element Plus 覆盖。
- 未改写任何历史定义行原文；未回写 R0 报告与第一至第五轮报告。

## 9. 静态检查结果

| 检查项 | 命令／方法 | 结果 |
|---|---|---|
| 分支与提交 | `git branch --show-current`、`git rev-parse HEAD`、`git ls-remote origin refs/heads/develop` | `develop`；本地／`origin/develop`／远程三者均为 `4ec52b4`，`0/0` |
| 空白／冲突标记 | `git diff --check` | 干净（退出码 0） |
| 变更白名单 | `git status --short` | 仅 5 份白名单 Feature 文档被修改 + 新增 1 份 R1 报告；未跟踪 `docs/prompts/`、`runtime-logs/` 与预先存在的 ` M .claude/settings.local.json`（与本任务无关，未暂存） |
| 四类总数 | 逐文档提取 `CCFG-REQ/AC/DESIGN/UI` 编号并校验 `seq` | 需求 **152**、验收 **154**、设计 **87**、界面 **75**，均唯一连续无缺号 |
| `NOT_RUN` 计数 | 统计 `^\| CCFG-AC-\d{3} \| <状态> \|` 行 | 154 行用例、154 行 `NOT_RUN`（全部未执行） |
| 映射完整性 | 统计 `ACCEPTANCE.md` §5、`DESIGN.md` §12.1／§12.2 映射行，并核对 75 个 `CCFG-UI-*` 是否均登记于 §12.1 | §5 = 152、§12.1 = 152、§12.2 = 154；75 个 UI 编号无缺项；覆盖 152/152 与 154/154 |
| 定义行零改动（除允许清单） | 逐文件对齐 `4ec52b4` 提取定义行／映射行按编号比对 | 修改仅 10 行（见 §6），added=0、removed=0，其余逐字节一致 |
| R0 报告未改写 | 核对 R0 报告内容 | 未修改；其失效表述由本报告 §3.2 承接 |
| 状态口径 | 全文检索 `adjustment5_*`、`adjustment6_*`、`PENDING_USER_CONFIRMATION`、`NOT_RUN` | 第五轮 `baseline=APPROVED`／`implementation=IMPLEMENTED_PENDING_USER_ACCEPTANCE`；第六轮 `DRAFT_PENDING_USER_REVIEW`／`NOT_APPROVED`／`NOT_STARTED`／`NOT_RUN`；`PENDING_USER_CONFIRMATION=0` |
| 现行入口一致 | 五份文档检索 `..._BASELINE_R1_REVIEW` | 第六轮现行下一入口统一为 `CHATGPT_REMOTE_CLIENT_CONFIG_ROW_HIGHLIGHT_AND_CONFIRM_BUTTON_VISUAL_BASELINE_R1_REVIEW`；R0 入口与第五轮实现 R1 入口均标为历史 |

## 10. 下一入口

本任务为**纯文档 R1 定向纠错**，唯一结果提交后进入：

```text
next_entry=CHATGPT_REMOTE_CLIENT_CONFIG_ROW_HIGHLIGHT_AND_CONFIRM_BUTTON_VISUAL_BASELINE_R1_REVIEW
```

- 远程**基线文档**复审**通过**后，**仍须项目负责人另行批准第六轮基线**，才能另行进入代码实现；R1 复审通过**不**等于草案已批准、已实现或已验收。
- 本任务**停在 R1 远程基线文档复审**，**不**进入批准收口、**不**进入代码实现、**不**执行正式验收。
