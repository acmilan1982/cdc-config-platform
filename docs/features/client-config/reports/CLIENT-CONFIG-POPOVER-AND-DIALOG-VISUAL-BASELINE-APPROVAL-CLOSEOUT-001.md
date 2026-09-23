# 探针端管理 `+N` 清单与新增／编辑弹窗视觉调整 · 第三轮基线批准收口执行报告

> 任务代码：`CLIENT-CONFIG-POPOVER-AND-DIALOG-VISUAL-BASELINE-APPROVAL-CLOSEOUT-001`
> 任务类型：纯文档（第三轮 `+N` 清单与新增／编辑弹窗视觉调整**文档基线批准收口**）
> 分支：`develop`
> 起始提交：`1df0ef7b4e3717d9b980e9aa9cc1f8e4f036f244`
> 上游门禁：ChatGPT 从远程 Git 对 R1 结果提交 `1df0ef7b4e3717d9b980e9aa9cc1f8e4f036f244` 的独立复审，结论 `APPROVED`
> 批准来源：项目负责人于 2026-09-23 明确回复“批准”
> 下一入口：`CHATGPT_REMOTE_CLIENT_CONFIG_POPOVER_AND_DIALOG_VISUAL_BASELINE_APPROVAL_CLOSEOUT_REVIEW`
> 本任务为纯文档，**不实现代码、不执行正式验收、不作出项目负责人目测通过或最终接受结论**；基线批准 **≠** 已实现 **≠** 已目测 **≠** 已验收。

---

## 1. 授权来源与门禁基线

```text
branch=develop
expected_base_commit=1df0ef7b4e3717d9b980e9aa9cc1f8e4f036f244
actual_base_commit=1df0ef7b4e3717d9b980e9aa9cc1f8e4f036f244
remote_develop_head_before=1df0ef7b4e3717d9b980e9aa9cc1f8e4f036f244
adjustment_baseline_status=APPROVED
adjustment_implementation_status=IMPLEMENTED_PENDING_USER_ACCEPTANCE
adjustment2_baseline_status=APPROVED
adjustment2_approval_status=APPROVED_BY_PROJECT_OWNER
adjustment2_implementation_status=IMPLEMENTED_PENDING_USER_ACCEPTANCE
adjustment3_baseline_status=APPROVED
adjustment3_approval_status=APPROVED_BY_PROJECT_OWNER
adjustment3_approval_date=2026-09-23
adjustment3_approved_reviewed_commit=1df0ef7b4e3717d9b980e9aa9cc1f8e4f036f244
adjustment3_implementation_status=NOT_STARTED
adjustment3_formal_acceptance_execution_status=NOT_RUN
existing_feature_implementation_status=IMPLEMENTED_PENDING_USER_ACCEPTANCE
formal_acceptance_execution_status=NOT_RUN
PENDING_USER_CONFIRMATION=0
template_level_page_migration_status=NOT_STARTED
template_level_page_migration_authorization_status=NOT_GRANTED
template_level_pilot_page_selection_status=NOT_DECIDED
next_entry=CHATGPT_REMOTE_CLIENT_CONFIG_POPOVER_AND_DIALOG_VISUAL_BASELINE_APPROVAL_CLOSEOUT_REVIEW
```

- **授权来源**：项目负责人于 2026-09-23 明确回复“批准”，批准对象是第三轮 `/config/client` 的 `+N` 清单及新增／编辑探针弹窗视觉调整**文档基线**。
- **复审对象与结论**：ChatGPT 已从远程 Git 复审 R1 结果提交 `1df0ef7b4e3717d9b980e9aa9cc1f8e4f036f244`，结论 `APPROVED`（R1 纠错通过）。
- 本地 `HEAD` = `1df0ef7b4e3717d9b980e9aa9cc1f8e4f036f244`，与提示词所记 R1 结果提交一致；工作区起点除下述既有无关修改外干净。
- 任务开始时已存在、**全程未修改/未暂存/未提交**的无关修改：已修改的 `.claude/settings.local.json`、未跟踪的 `docs/prompts/**`。
- 未执行 `git pull` / `fetch` / `merge` / `rebase` / `reset` / `clean` / `stash` / `checkout --`；未改写历史；未强推；未自解分叉。
- **状态分层说明**：本次批准只把第三轮**文档基线**由草案收口为 `APPROVED`，**不**改变任何定义行、**不**把任何验收用例改为通过、**不**表示第三轮调整已实现或已验收；第一轮、第二轮已批准基线与三轮实现事实保持真实、不改写、不抹除。

## 2. 白名单与变更范围

### 2.1 本任务变更文件（白名单内，6 个）

| 文件 | 变更性质 |
|---|---|
| `docs/features/client-config/README.md` | §1 身份表第三轮四行、§1.4 现行状态块 `next_entry`、§1.6 时序说明现行入口、§1.7 标题/前言/状态块/要点、§2 文档导航行、§4 当前状态追加批准收口条目、§5 现行与历史下一入口（R1 入口降级为历史） |
| `docs/features/client-config/REQUIREMENTS.md` | §1 元数据与任务编号、§7.12 现行状态与前言、§1.2 下一入口；§10 变更记录追加（**未修改任何需求定义行**） |
| `docs/features/client-config/ACCEPTANCE.md` | §1 元数据与任务编号、§1.7 标题/前言/状态行/下一入口、§2 现行状态、§3 覆盖表行；§6 变更记录追加（**未修改任何验收定义行**） |
| `docs/features/client-config/DESIGN.md` | §1 元数据、§13 时序说明、§15 标题与前言；§16 变更记录追加（**未修改任何设计定义行**） |
| `docs/features/client-config/UI.md` | §1 元数据、§16 时序说明与现行状态、§17 标题与前言、§1/§1.4 现行入口；§18 变更记录追加（**未修改任何界面定义行**） |
| `docs/features/client-config/reports/CLIENT-CONFIG-POPOVER-AND-DIALOG-VISUAL-BASELINE-APPROVAL-CLOSEOUT-001.md` | 本报告（新建） |

五份 Feature 文档只修订**当前状态、导航、现行下一入口**并**追加**变更记录；未改写任何历史报告。

### 2.2 明确未触碰（保护范围）

| 范围 | 结果 |
|---|---|
| R0 历史报告 `reports/CLIENT-CONFIG-POPOVER-AND-DIALOG-VISUAL-BASELINE-001.md` | **未修改**（含其 §4.2 计数措辞，按 R1 报告的 errata 声明处理） |
| R1 历史报告 `reports/CLIENT-CONFIG-POPOVER-AND-DIALOG-VISUAL-BASELINE-001-R1.md` | **未修改** |
| 所有更早历史报告 `docs/features/client-config/reports/**` | **未修改** |
| 前端/后端业务代码与测试 | 未修改（本任务不实现代码） |
| 数据源管理参考页 `frontend/src/views/data-source/DataSourcePage.vue` | **未修改**，未访问 |
| `API.md`、`DATABASE.md` | **未修改** |
| 两套公共模板与全局预设 `docs/baseline/**` | **未修改**；模板级三状态**未变** |
| `CLAUDE.md`、`agent-env.sh`、六份项目级基线、`docs/features/README.md`、`docs/prompts/**` | **均未修改** |
| `.claude/settings.local.json` | 任务开始前已存在修改，**保持原样**、未暂存、未提交 |

## 3. 批准收口内容（分项对应提示词要求）

| # | 要求 | 落点 |
|---|---|---|
| 1 | 记录 `adjustment3_baseline_status=APPROVED`、`adjustment3_approval_status=APPROVED_BY_PROJECT_OWNER`、批准日期 `2026-09-23`、批准依据复审对象 `1df0ef7...`、复审结论 `APPROVED`；批准范围仅为 R1 修正后的第三轮文档定义；旧草案与 R0/R1 复审阶段状态/入口保留为带时序的历史记录 | 五份文档的第三轮状态段与 §5/§1.7 现行入口段 |
| 2 | 记录 `adjustment3_implementation_status=NOT_STARTED`、`adjustment3_formal_acceptance_execution_status=NOT_RUN`；全文件 117 条验收均仍 `NOT_RUN`；第一轮、第二轮已批准基线不重批，第二轮 `IMPLEMENTED_PENDING_USER_ACCEPTANCE` 不变；不声称用户已最终接受任何页面 | 五份文档第三轮状态段、`ACCEPTANCE.md` §2/§3、README §4 |
| 3 | 第三轮已确定的界面口径原样保留（`+N` 两级信息与自然增高、弹窗约 900px 与数据源区调整、标签与主按钮对齐数据源管理、菜单“删除”不加粗）；限定 `/config/client`，不改 `/config/data-source` 或全局模板状态 | 定义行**逐字节未改**；README §1.7 四项调整叙述保留原样 |
| 4 | 在状态段与变更记录追加批准收口说明，使“批准的是调整基线，尚未实现第三轮调整”一眼可见；原有定义行不改字节；保留 R1 修订后的 `CCFG-AC-113` 与 R0 对 `CCFG-REQ-016`/`CCFG-AC-011`/`CCFG-UI-009/024` 的定向标注；不回写历史报告 | 五份文档变更记录新增 2026-09-23 批准收口行 + §4/§1.7 显式“批准的是调整基线，尚未实现”表述 |
| 5 | 更新现行下一入口为 `CHATGPT_REMOTE_CLIENT_CONFIG_POPOVER_AND_DIALOG_VISUAL_BASELINE_APPROVAL_CLOSEOUT_REVIEW`，R1 复审入口降级为历史入口；不在本任务启动实现或宣布正式验收 | 五份文档现行入口段、README §5、各文件状态块 |

四项已确认产品决定**不重新设计**，本轮**不**改动任何定义行。

## 4. 静态校验证据

本任务为**纯文档任务**，按 `CLAUDE.md` §15 验证矩阵：后端构建 `NOT_APPLICABLE`、前端构建 `NOT_APPLICABLE`、数据库连接 `NOT_APPLICABLE`、ZooKeeper 连接 `NOT_APPLICABLE`。仅执行**静态核验**。

### 4.1 定义行逐字节核验（相对起始提交 `1df0ef7`）

以 `git show 1df0ef7:<path>` 与工作区同名定义行做**按 ID 的逐行内容比对**（python3，正则按 `CCFG-<族>-<编号>` 匹配器行）：

| 家族 | 起始行数 | 现行行数 | 逐字节相同 | 变更行 | 新增 | 删除 |
|---|---|---|---|---|---|---|
| `CCFG-REQ-*` | 122 | 122 | **122** | 0 | 0 | 0 |
| `CCFG-AC-*` | 117 | 117 | **117** | 0 | 0 | 0 |
| `CCFG-DESIGN-*` | 60 | 60 | **60** | 0 | 0 | 0 |
| `CCFG-UI-*` | 49 | 49 | **49** | 0 | 0 | 0 |

- 四类定义行变更数均为 **0**；编号连续、唯一、不新增/删除/重排，无跳号、无重号。
- R1 修订后的 `CCFG-AC-113` 与 R0 定向标注的 `CCFG-REQ-016`、`CCFG-AC-011`、`CCFG-UI-009`、`CCFG-UI-024` **均未回退**（标注与原文均在）。

### 4.2 计数、覆盖与执行状态核验

```text
需求 CCFG-REQ-001~122   = 122
验收 CCFG-AC-001~117    = 117（全部 NOT_RUN）
设计 CCFG-DESIGN-001~060 = 60
界面 CCFG-UI-001~049    = 49
需求→验收覆盖 = 122/122
PENDING_USER_CONFIRMATION=0
```

- **117 条验收执行状态全部为 `NOT_RUN`**（`grep` 计数 117 条 `NOT_RUN`、0 条非 `NOT_RUN`），本次批准未把任何用例改为通过；`formal_acceptance_execution_status=NOT_RUN` 未变。
- 第三轮 `adjustment3_implementation_status=NOT_STARTED`、`adjustment3_formal_acceptance_execution_status=NOT_RUN`；未宣称任何页面被项目负责人最终接受，未宣称第三轮已实现或已验收。

### 4.3 白名单与空白核验

- `git status --short` 仅显示 5 个白名单内 Feature 文档为已修改（`M`）+ 本报告为新增（`??`，位于白名单目录 `docs/features/client-config/reports/`）；另有任务开始前既存的无关修改 `.claude/settings.local.json`（未触碰）与未跟踪 `docs/prompts/`（未触碰）。
- `git diff --check` 无空白/行尾错误。

### 4.4 当前字段与历史记录核验

- 五份文档中作为**当前**值的第三轮字段统一为 `adjustment3_baseline_status=APPROVED`、`adjustment3_approval_status=APPROVED_BY_PROJECT_OWNER`；草案期 `DRAFT_PENDING_USER_REVIEW` 与复审期 `CHANGES_REQUIRED`、`NOT_APPROVED` 以“曾为/历史记录”措辞保留，未改写历史。
- 各文件**现行下一入口**统一指向 `CHATGPT_REMOTE_CLIENT_CONFIG_POPOVER_AND_DIALOG_VISUAL_BASELINE_APPROVAL_CLOSEOUT_REVIEW`；R1 复审入口与 R0 草案复审入口降级为**历史入口**。
- 两套模板的模板级全局状态（`NOT_STARTED`/`NOT_GRANTED`/`NOT_DECIDED`）**未变**；数据源管理参考页未被修改。

## 5. 未执行项与下一入口

- 未执行任何测试、构建、浏览器核对或服务启停（纯文档任务；按验证矩阵均为 `NOT_APPLICABLE`）。
- 未执行正式验收（117 条 `CCFG-AC-*` 全部 `NOT_RUN`），未作出项目负责人目测通过或最终接受结论。
- 未访问/修改数据库、ZooKeeper、Kafka（`database_write_status=NOT_REQUESTED`、`zookeeper_write_status=NOT_REQUESTED`）。
- 未访问、未修改 `/config/data-source` 的实现与状态。
- 未改 `API.md`/`DATABASE.md`，未新增/调整依赖。
- **本次批准只收口文档基线**：`adjustment3_baseline_status=APPROVED`、`adjustment3_implementation_status=NOT_STARTED`、`adjustment3_formal_acceptance_execution_status=NOT_RUN`。
- 下一入口：`CHATGPT_REMOTE_CLIENT_CONFIG_POPOVER_AND_DIALOG_VISUAL_BASELINE_APPROVAL_CLOSEOUT_REVIEW`（本次批准收口结果的远程复审入口；只有该复审通过后才安排第三轮代码实现任务，**不是**直接进入实现或验收执行）。
