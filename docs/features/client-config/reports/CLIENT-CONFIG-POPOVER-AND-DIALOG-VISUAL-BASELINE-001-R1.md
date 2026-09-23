# 探针端管理 `+N` 清单与新增／编辑弹窗视觉调整 · 第三轮草案 R1 定向纠错执行报告

> 任务代码：`CLIENT-CONFIG-POPOVER-AND-DIALOG-VISUAL-BASELINE-001-R1`
> 任务类型：纯文档（第三轮 `+N` 清单与新增／编辑弹窗视觉调整**草案 R1 定向纠错**）
> 分支：`develop`
> 起始提交：`a585071d86eeee47dbd8d986fdb6f90b32161033`
> 上游门禁：ChatGPT 从远程 Git 对 R0 草案提交 `a585071d86eeee47dbd8d986fdb6f90b32161033` 的独立复审，结论 `CHANGES_REQUIRED`（三处）
> 下一入口：`CHATGPT_REMOTE_CLIENT_CONFIG_POPOVER_AND_DIALOG_VISUAL_BASELINE_R1_REVIEW`
> 本任务为纯文档，**不实现代码、不执行正式验收、不作出项目负责人目测通过或最终接受结论**；R1 纠错 **≠** 已批准 **≠** 已实现 **≠** 已验收。

---

## 1. 门禁与基线

```text
branch=develop
expected_base_commit=a585071d86eeee47dbd8d986fdb6f90b32161033
actual_base_commit=a585071d86eeee47dbd8d986fdb6f90b32161033
adjustment_baseline_status=APPROVED
adjustment_implementation_status=IMPLEMENTED_PENDING_USER_ACCEPTANCE
adjustment2_baseline_status=APPROVED
adjustment2_approval_status=APPROVED_BY_PROJECT_OWNER
adjustment2_implementation_status=IMPLEMENTED_PENDING_USER_ACCEPTANCE
adjustment2_implementation_status_at_completion=IMPLEMENTED_PENDING_CHATGPT_REVIEW  # 历史值保留
adjustment3_baseline_status=DRAFT_PENDING_USER_REVIEW
adjustment3_approval_status=NOT_APPROVED
adjustment3_implementation_status=NOT_STARTED
adjustment3_formal_acceptance_execution_status=NOT_RUN
existing_feature_implementation_status=IMPLEMENTED_PENDING_USER_ACCEPTANCE
formal_acceptance_execution_status=NOT_RUN
PENDING_USER_CONFIRMATION=0
template_level_page_migration_status=NOT_STARTED
template_level_page_migration_authorization_status=NOT_GRANTED
template_level_pilot_page_selection_status=NOT_DECIDED
next_entry=CHATGPT_REMOTE_CLIENT_CONFIG_POPOVER_AND_DIALOG_VISUAL_BASELINE_R1_REVIEW
```

- 本地 `HEAD` = `a585071d86eeee47dbd8d986fdb6f90b32161033`，与提示词所记 R0 结果提交一致；工作区起点除下述既有无关修改外干净。
- 任务开始时已存在、**全程未修改/未暂存/未提交**的无关修改：已修改的 `.claude/settings.local.json`、未跟踪的 `docs/prompts/**`。
- 未执行 `git pull` / `fetch` / `merge` / `rebase` / `reset` / `clean` / `stash` / `checkout --`；未改写历史；未强推；未自解分叉。
- **状态分层说明**：本轮 R1 **只**修订 `CCFG-AC-113` 的验收步骤与各文件作为**当前**值的第二轮实现状态/入口，并追加时序说明；**不**改写第一轮/第二轮已批准基线与两轮实现事实，**不**批准第三轮草案。第二轮实现完成时点历史值 `IMPLEMENTED_PENDING_CHATGPT_REVIEW`、旧报告与历史下一入口原文**照实保留**。

## 2. 实际文件清单

### 2.1 本任务变更文件（白名单内，6 个）

| 文件 | 变更性质 |
|---|---|
| `docs/features/client-config/ACCEPTANCE.md` | `CCFG-AC-113` 步骤定向修订（新增/编辑两模式分开核对）；§1 元数据、§1.6 表行、§1.6 下一入口、§1.7 状态块与前言、§2 计数与现行状态；§6 变更记录追加 |
| `docs/features/client-config/REQUIREMENTS.md` | §1 元数据与任务编号、§7.11 现行状态、§7.12 前言、§1.2 下一入口；§10 变更记录追加（**未修改任何需求定义行**） |
| `docs/features/client-config/DESIGN.md` | §1 元数据、§14 现行状态、§15 前言、§13 时序说明；§16 变更记录追加（**未修改任何设计定义行**） |
| `docs/features/client-config/UI.md` | §1 元数据、§1.5 时序说明、§16 现行状态/时序说明、§17 标题与前言；§18 变更记录追加（**未修改任何界面定义行**） |
| `docs/features/client-config/README.md` | §1 身份表行、§1.4/§1.6/§1.7 状态块与说明、§2 文档导航、§4 当前状态、§5 下一入口（历史入口降级 + 新增现行入口段） |
| `docs/features/client-config/reports/CLIENT-CONFIG-POPOVER-AND-DIALOG-VISUAL-BASELINE-001-R1.md` | 本报告（新建） |

五份 Feature 文档仅修订**当前状态、导航、时序说明**与 `CCFG-AC-113`，并**追加**执行记录；未改写任何历史报告、未修改 `API.md`/`DATABASE.md`/`docs/features/README.md`/`docs/baseline/**`/`docs/prompts/**`。

### 2.2 明确未触碰（保护范围）

| 范围 | 结果 |
|---|---|
| R0 历史报告 `reports/CLIENT-CONFIG-POPOVER-AND-DIALOG-VISUAL-BASELINE-001.md` | **未修改**（其 §4.2 计数措辞按 errata 声明处理，见 §4） |
| 所有更早历史报告 `docs/features/client-config/reports/**` | **未修改** |
| 前端/后端业务代码与测试 | 未修改（本任务不实现代码） |
| 数据源管理参考页 `frontend/src/views/data-source/DataSourcePage.vue` | **未修改** |
| `API.md`、`DATABASE.md` | **未修改** |
| 两套公共模板与全局预设 `docs/baseline/**` | **未修改**；模板级三状态**未变** |
| `CLAUDE.md`、`agent-env.sh`、六份项目级基线、`docs/features/README.md`、`docs/prompts/**` | **均未修改** |
| `.claude/settings.local.json` | 任务开始前已存在修改，**保持原样**、未暂存、未提交 |

## 3. 三项 R1 纠错处置

| # | ChatGPT `CHANGES_REQUIRED` 项 | 处置 | 落点 |
|---|---|---|---|
| 1 | `CCFG-AC-113` 验收步骤不可执行：要求“新增模式下核对探针 ID 锁定与经‘修改探针 ID’解锁修改”，而页面中“修改探针 ID”仅在 `mode === 'edit'` 时出现 | **仅定向修订该验收定义行的步骤**：**新增模式**核对 ID 输入框**可直接填写**（该模式不出现“修改探针 ID”开关、不显示“（已锁定）”）；**编辑模式**核对 ID 输入框**默认锁定**（显示“（已锁定）”），点击“修改探针 ID”**解锁**后可修改、再点击“取消修改”恢复锁定；自动生成、候选搜索、已选项展示与移除、异常回显、保存前校验阻断、未保存关闭确认等原验收目标**逐项保留**。**未**修改页面行为来迁就错误步骤 | `ACCEPTANCE.md` `CCFG-AC-113` 定义行 + §4/§6 现行说明追加 R1 修正原因 |
| 2 | R0 报告 §4.2 证据计数错误（“103 行新增（113~122）”） | **不回写 R0 历史报告**；在本报告 §4 以 errata 声明覆盖关系：正确为 **10 条新增需求定义行（`113~122`）加 1 条修改的既有定义行（`016`）**；“变更行数 12”是另一口径的 diff 行数，见 §4 | 本报告 §4 |
| 3 | 第二轮当前状态与入口过期 | 五份 Feature 文档中作为**当前**值的 `adjustment2_implementation_status` 统一改为 `IMPLEMENTED_PENDING_USER_ACCEPTANCE`（第二轮实现已完成并经 ChatGPT 从远程 Git 对实现提交 `fecf5a06d90c690b5ee984a9e487f05322e1dd70` 独立代码复审通过，**当前等待项目负责人页面目测/接受，尚未最终接受页面**）；现行下一入口统一为 `CHATGPT_REMOTE_CLIENT_CONFIG_POPOVER_AND_DIALOG_VISUAL_BASELINE_R1_REVIEW`；已完成入口（第二轮代码复审、R0 草案复审、第二轮基线批准收口）降级为**历史入口**并追加时序说明；保留完成时点 `IMPLEMENTED_PENDING_CHATGPT_REVIEW` 与历史原文 | 五份 Feature 文档的当前状态/入口/时序说明；本报告 §1 |

四项已确认产品决定**不重新设计**，本轮**不**改动任何定义行（`CCFG-AC-113` 除外）。

## 4. Errata：R0 报告 §4.2 计数口径

R0 报告 `reports/CLIENT-CONFIG-POPOVER-AND-DIALOG-VISUAL-BASELINE-001.md` §4.2 表格 `CCFG-REQ-*` 行原文写“**103 行新增（113~122）**”。该表述**错误**，本报告以 errata 声明之，**不**回写 R0 历史报告。

**正确陈述（需求侧，相对起始提交 `fecf5a06d90c690b5ee984a9e487f05322e1dd70`）**：

- **10 条新增定义行**：`CCFG-REQ-113~122`；
- **1 条修改的既有定义行**：`CCFG-REQ-016`（R0 授权的目标标注修订，原文逐字保留、仅追加标注）；
- 既有行数 112 → 现行行数 122，112 + 10 = 122，一致。

**两种口径必须写清楚**：

| 口径 | 含义 | `CCFG-REQ-*` 取值 |
|---|---|---|
| **定义行口径** | 新增的定义行条数 / 修改的定义行条数（按 `CCFG-*` 编号行计） | 新增 **10** 条（`113~122`）+ 修改 **1** 条（`016`） |
| **diff 行数口径** | `git diff` 中 `<`/`>` 行合计（新增行 + 被替换的旧行 + 替换后的新行） | **12** = 新增 10 + 移除 1（旧 `016`）+ 增加 1（新 `016`） |

R0 表格“变更行数 12”本身即 **diff 行数口径**；其错误在于把该行的“新增”文字写成“103 行新增（113~122）”（`103` 与 `113~122` 自相矛盾，且与定义行口径的新增 10 条不符）。

**其余家族计数复核（与 R0 事后核对一致）**：

| 家族 | 起始行数 | 现行行数 | 定义行新增 | 定义行修改 | diff 行数 |
|---|---|---|---|---|---|
| `CCFG-REQ-*` | 112 | 122 | **10**（`113~122`） | **1**（`016`） | 12 |
| `CCFG-AC-*` | 104 | 117 | **13**（`105~117`） | **1**（`011`） | 15 |
| `CCFG-DESIGN-*` | 53 | 60 | **7**（`054~060`） | **0** | 7 |
| `CCFG-UI-*` | 42 | 49 | **7**（`043~049`） | **2**（`009`、`024`） | 11 |

## 5. 验证证据

本任务为**纯文档任务**，按 `CLAUDE.md` §15 验证矩阵：后端构建 `NOT_APPLICABLE`、前端构建 `NOT_APPLICABLE`、数据库连接 `NOT_APPLICABLE`、ZooKeeper 连接 `NOT_APPLICABLE`。仅执行**静态核验**。

### 5.1 定义行逐字节核验（R1 后相对 R0 结果提交 `a585071`）

以 `git show a585071:<path>` 与工作区同名定义行做**按 ID 的逐行内容比对**（python3）：

| 家族 | 起始行数 | 现行行数 | 逐字节相同 | 变更行 | 新增 | 删除 |
|---|---|---|---|---|---|---|
| `CCFG-REQ-*` | 122 | 122 | **122** | 无 | 0 | 0 |
| `CCFG-AC-*` | 117 | 117 | 116 | **`CCFG-AC-113`（唯一）** | 0 | 0 |
| `CCFG-DESIGN-*` | 60 | 60 | **60** | 无 | 0 | 0 |
| `CCFG-UI-*` | 49 | 49 | **49** | 无 | 0 | 0 |

- 除 `CCFG-AC-113` 外，**需求 122、验收 117（其余 116）、设计 60、UI 49 条定义行相对 `a585071` 逐字节一致**；
- R0 已定向标注的四条旧定义行 `CCFG-REQ-016`、`CCFG-AC-011`、`CCFG-UI-009`、`CCFG-UI-024` **未回退**（标注与原文均在）；
- 编号连续、唯一、不新增/删除/重排；无跳号、无重号。

### 5.2 计数与覆盖核验

```text
需求 CCFG-REQ-001~122   = 122
验收 CCFG-AC-001~117    = 117（全部 NOT_RUN）
设计 CCFG-DESIGN-001~060 = 60
界面 CCFG-UI-001~049    = 49
需求→验收覆盖 = 122/122
验收→设计覆盖 = 117/117
PENDING_USER_CONFIRMATION=0
```

- **117 条验收执行状态全部为 `NOT_RUN`**，R1 未把任何用例改为通过；`formal_acceptance_execution_status=NOT_RUN` 未变。
- 第三轮仍 `adjustment3_baseline_status=DRAFT_PENDING_USER_REVIEW`、`adjustment3_approval_status=NOT_APPROVED`、`adjustment3_implementation_status=NOT_STARTED`。
- 未宣称第二轮用户最终接受或第三轮已批准。

### 5.3 白名单与空白核验

- `git status --short` 仅显示 5 个白名单内 Feature 文档为已修改（`M`）+ 本报告为新增（`??`，位于白名单目录 `docs/features/client-config/reports/`）；另有任务开始前既存的无关修改 `.claude/settings.local.json`（未触碰）与未跟踪 `docs/prompts/`（未触碰）。
- `git diff --check` 无空白/行尾错误。

### 5.4 当前字段与历史记录核验

- 作为**当前**值的 `adjustment2_implementation_status` 五份文档均为 `IMPLEMENTED_PENDING_USER_ACCEPTANCE`；第二轮实现完成时点历史值 `IMPLEMENTED_PENDING_CHATGPT_REVIEW` 与历史下一入口原文**保留**，并以“时序说明（不改写历史）”区分历史与当前。
- 各文件**现行下一入口**统一指向 `CHATGPT_REMOTE_CLIENT_CONFIG_POPOVER_AND_DIALOG_VISUAL_BASELINE_R1_REVIEW`；已完成入口降级为**历史入口**。
- 两套模板的模板级全局状态（`NOT_STARTED`/`NOT_GRANTED`/`NOT_DECIDED`）**未变**。

## 6. 未执行项与下一入口

- 未执行任何测试、构建、浏览器核对或服务启停（纯文档任务；按验证矩阵均为 `NOT_APPLICABLE`）。
- 未执行正式验收（117 条 `CCFG-AC-*` 全部 `NOT_RUN`），未作出项目负责人目测通过或最终接受结论。
- 未访问/修改数据库、ZooKeeper、Kafka（`database_write_status=NOT_REQUESTED`、`zookeeper_write_status=NOT_REQUESTED`）。
- 未改 `API.md`/`DATABASE.md`，未新增/调整依赖。
- **本轮 R1 纠错结果尚未复审、草案尚未获批、尚未实现**：`adjustment3_baseline_status=DRAFT_PENDING_USER_REVIEW`、`adjustment3_approval_status=NOT_APPROVED`、`adjustment3_implementation_status=NOT_STARTED`。
- 下一入口：`CHATGPT_REMOTE_CLIENT_CONFIG_POPOVER_AND_DIALOG_VISUAL_BASELINE_R1_REVIEW`（R1 结果远程复审入口，**不是**直接进入实现）。
