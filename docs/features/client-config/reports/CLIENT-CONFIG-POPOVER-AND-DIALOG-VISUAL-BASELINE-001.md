# 探针端管理 `+N` 清单与新增／编辑弹窗视觉调整 · 基线草案建立执行报告

> 任务代码：`CLIENT-CONFIG-POPOVER-AND-DIALOG-VISUAL-BASELINE-001`
> 任务类型：纯文档（第三轮 `/config/client` `+N` 清单与新增／编辑弹窗视觉调整**基线草案**）
> 分支：`develop`
> 起始提交：`fecf5a06d90c690b5ee984a9e487f05322e1dd70`
> 上游依据：项目负责人已明确确认的**四项调整决定**（本轮提示词 §“项目负责人确认的调整”四项）
> 上游门禁：本轮为**草案建立**，**不存在**已批准的上游门禁；第一轮 `adjustment_baseline_status=APPROVED`、第二轮 `adjustment2_baseline_status=APPROVED` 保持真实不改写
> 下一入口：`CHATGPT_REMOTE_CLIENT_CONFIG_POPOVER_AND_DIALOG_VISUAL_BASELINE_REVIEW`
> 本任务为纯文档，**不实现代码、不执行正式验收、不作出项目负责人目测通过或最终接受结论**；草案建立 **≠** 已批准 **≠** 已实现 **≠** 已验收。

---

## 1. 门禁与基线

```text
branch=develop
expected_base_commit=fecf5a06d90c690b5ee984a9e487f05322e1dd70
actual_base_commit=fecf5a06d90c690b5ee984a9e487f05322e1dd70
adjustment_baseline_status=APPROVED
adjustment_implementation_status=IMPLEMENTED_PENDING_USER_ACCEPTANCE
adjustment2_baseline_status=APPROVED
adjustment2_approval_status=APPROVED_BY_PROJECT_OWNER
adjustment2_implementation_status=IMPLEMENTED_PENDING_CHATGPT_REVIEW
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
next_entry=CHATGPT_REMOTE_CLIENT_CONFIG_POPOVER_AND_DIALOG_VISUAL_BASELINE_REVIEW
```

- 本地 `HEAD` = `fecf5a06d90c690b5ee984a9e487f05322e1dd70`，与提示词所记撰写时点远程 `develop` 一致；工作区起点除下述既有无关修改外干净。
- 任务开始时已存在、**全程未修改/未暂存/未提交**的无关修改：已修改的 `.claude/settings.local.json`、未跟踪的 `docs/prompts/**`。
- 已按 `CLAUDE.md` §3.1 完整读取六份项目级基线，按 §3.2 读取本 Feature 功能级基线，按 §3.4 读取查询列表页模板三份基线文档（`README.md`/`SHARED_COMPONENT_DESIGN.md`/`MIGRATION.md`）——因本轮涉及 `+N` 弹层与弹窗的**公共交互表现层**调整。
- 未执行 `git pull` / `fetch` / `merge` / `rebase` / `reset` / `clean` / `stash` / `checkout --`；未改写历史；未强推。
- **状态分层说明**：本轮**只**新增第三轮草案状态（`adjustment3_*`），**不**改写第一轮/第二轮已批准基线与两轮实现事实；第三轮 `adjustment3_baseline_status=DRAFT_PENDING_USER_REVIEW` 表示**仅建立草案**，与已批准的前两轮状态并存，互不覆盖。

## 2. 实际文件清单

### 2.1 本任务变更文件（白名单内，6 个）

| 文件 | 变更性质 |
|---|---|
| `docs/features/client-config/REQUIREMENTS.md` | 新增 §7.12 与 `CCFG-REQ-113~122`（10 条）；`CCFG-REQ-016` 目标标注修订；§8 计数与编号核验；§1 元数据；§10 变更记录追加 |
| `docs/features/client-config/ACCEPTANCE.md` | 新增 §1.7 分层状态块与 `CCFG-AC-105~117`（13 条）；`CCFG-AC-011` 目标标注修订；元数据、§2/§3/§5 计数与覆盖；§6 变更记录追加 |
| `docs/features/client-config/DESIGN.md` | 新增 §15 与 `CCFG-DESIGN-054~060`（7 条）；§16 变更记录追加；§1 元数据、§11/§12 追踪矩阵同步；原 §15 变更记录重编号为 §16 |
| `docs/features/client-config/UI.md` | 新增 §17 与 `CCFG-UI-043~049`（7 条）；`CCFG-UI-009`/`CCFG-UI-024` 目标标注修订；§1 元数据、§14 关联矩阵同步；原 §17 变更记录重编号为 §18 |
| `docs/features/client-config/README.md` | §1 Feature 身份表新增第三轮四行；新增 §1.7 草案块；§2 导航状态与报告表；§4/§5 追加记录 |
| `docs/features/client-config/reports/CLIENT-CONFIG-POPOVER-AND-DIALOG-VISUAL-BASELINE-001.md` | 本报告（新建） |

五份 Feature 文档仅**追加**本轮草案定义、**目标标注**4 条既有定义行、同步计数/覆盖/状态与追加执行记录；未改写任何历史报告、未修改 `API.md`/`DATABASE.md`/`docs/features/README.md`/`docs/baseline/**`/`docs/prompts/**`。

### 2.2 明确未触碰（保护范围）

| 范围 | 结果 |
|---|---|
| 前端/后端业务代码与测试 | 未修改（本任务不实现代码） |
| 数据源管理参考页 `frontend/src/views/data-source/DataSourcePage.vue` | **未修改**（本轮仅作视觉对照来源） |
| `API.md`、`DATABASE.md` | **未修改**（接口与数据库契约不变） |
| 两套公共模板与全局预设 `docs/baseline/query-list-page-template/**`、`docs/baseline/list-table-visual-template/**` | **未修改**；模板级 `page_migration_status=NOT_STARTED`、`page_migration_authorization_status=NOT_GRANTED`、`pilot_page_selection_status=NOT_DECIDED` **未变** |
| `CLAUDE.md`、`agent-env.sh`、六份项目级基线、`docs/features/README.md`、历史报告、`docs/prompts/**` | **均未修改** |
| `.claude/settings.local.json` | 任务开始前已存在修改，**保持原样**、未暂存、未提交 |

## 3. 设计映射（四项已确认调整 → 需求/验收/设计/UI 四层）

| 调整项 | 需求 | 验收 | 设计 | UI |
|---|---|---|---|---|
| ① `+N` 弹层清单项两级内容 | `CCFG-REQ-113`、`CCFG-REQ-114`（口径保持） | `CCFG-AC-105`、`CCFG-AC-106`、`CCFG-AC-107`、`CCFG-AC-108` | `CCFG-DESIGN-054` | `CCFG-UI-043` |
| ① `+N` 弹层自然增高、无内部滚动 | `CCFG-REQ-115`（定向修订 `CCFG-REQ-016`） | `CCFG-AC-109`（定向修订 `CCFG-AC-011`）、`CCFG-AC-110` | `CCFG-DESIGN-055` | `CCFG-UI-044` |
| ② 新增／编辑弹窗放大与数据源区调整 | `CCFG-REQ-116`、`CCFG-REQ-117` | `CCFG-AC-111`、`CCFG-AC-112` | `CCFG-DESIGN-056`、`CCFG-DESIGN-057` | `CCFG-UI-045` |
| ② 弹窗既有功能不变 | `CCFG-REQ-118` | `CCFG-AC-113` | `CCFG-DESIGN-060`（不改项与回归边界） | `CCFG-UI-013`~`CCFG-UI-017`（既有） |
| ③ 配置项名称对齐数据源管理 | `CCFG-REQ-119` | `CCFG-AC-114` | `CCFG-DESIGN-058` | `CCFG-UI-046` |
| ③ 主提交按钮对齐数据源管理 | `CCFG-REQ-120` | `CCFG-AC-115` | `CCFG-DESIGN-059` | `CCFG-UI-047` |
| ③ 文案保持“创建”／“保存” | `CCFG-REQ-121` | `CCFG-AC-116` | `CCFG-DESIGN-060` | `CCFG-UI-048` |
| ④ 操作菜单“删除”不加粗 | `CCFG-REQ-122` | `CCFG-AC-117` | `CCFG-DESIGN-060` | `CCFG-UI-049` |

四层映射连续、无缺口；需求→验收覆盖 **122/122**，验收→设计覆盖 **117/117**。

## 4. 验证证据

本任务为**纯文档任务**，按 `CLAUDE.md` §15 验证矩阵：后端构建 `NOT_APPLICABLE`、前端构建 `NOT_APPLICABLE`、数据库连接 `NOT_APPLICABLE`、ZooKeeper 连接 `NOT_APPLICABLE`。仅执行**静态核验**。

### 4.1 环境预检

```text
command -v git   → OK
git --version    → git version 2.x
locale           → UTF-8
env_check_status=SUCCESS
```

（未涉及后端/前端/数据库/ZooKeeper 任务类型所需环境项。）

### 4.2 定义行逐字节核验（相对起始提交 `fecf5a06`）

以 `git show fecf5a06:<path> | grep -E '^\| <PREFIX>-[0-9]+ \|'` 与工作区同名行做集合比对：

| 家族 | 起始提交行数 | 当前行数 | 变更行数 | 结论 |
|---|---|---|---|---|
| `CCFG-REQ-*` | 112 | 122 | 12 | 103 行新增（113~122）+ `CCFG-REQ-016` 目标标注（1 行改） |
| `CCFG-AC-*` | 104 | 117 | 15 | 13 行新增（105~117）+ `CCFG-AC-011` 目标标注（1 行改） |
| `CCFG-DESIGN-*` | 53 | 60 | 7 | 7 行新增（054~060），**零**既有行修改 |
| `CCFG-UI-*` | 42 | 49 | 11 | 7 行新增（043~049）+ `CCFG-UI-009`/`CCFG-UI-024` 目标标注（2 行改） |

- “变更行数”= `diff` 中 `<`/`>` 行合计；`CCFG-REQ-016`/`CCFG-AC-011`/`CCFG-UI-009`/`CCFG-UI-024` 四条为提示词明确授权的**目标标注修订**（保留原文、追加标注），其余既有定义行**逐字节零变化**。
- 新增编号均追加在各自既有最大编号之后，历史编号未重排、未复用、无跳号、无重号。

### 4.3 计数与覆盖核验

```text
需求 CCFG-REQ-001~122  = 122（新增 §7.12 CCFG-REQ-113~122，10 条）
验收 CCFG-AC-001~117   = 117（新增 CCFG-AC-105~117，13 条；全部 NOT_RUN）
设计 CCFG-DESIGN-001~060 = 60（新增 §15 CCFG-DESIGN-054~060，7 条）
界面 CCFG-UI-001~049   = 49（新增 §17 CCFG-UI-043~049，7 条）
需求→验收覆盖 = 122/122
验收→设计覆盖 = 117/117
PENDING_USER_CONFIRMATION=0
```

- **117 条验收执行状态全部为 `NOT_RUN`**，未改为通过；`formal_acceptance_execution_status=NOT_RUN` 未变。
- 既有 104 条 `NOT_RUN` 的执行状态**未被本轮改写**。

### 4.4 白名单与空白校验收

- `git status --short` 仅显示 5 个白名单内 Feature 文档为已修改（`M`）+ 本报告为新增（`??`，位于 `docs/features/client-config/reports/` 白名单目录）；另有任务开始前既存的无关修改 `.claude/settings.local.json`（未触碰）与未跟踪 `docs/prompts/`（未触碰）。
- `git diff --check` 无空白/行尾错误。

### 4.5 目标标注保留原文核验（抽查）

| 标注条目 | 原分句保留 | 承接条目 | 生效边界 |
|---|---|---|---|
| `CCFG-REQ-016` | “可设置最大高度并在内部滚动”原文逐字保留 | `CCFG-REQ-115`（§7.12） | 标注注明**待批准、未生效**，未获批前实现仍以现行已批准规则为准 |
| `CCFG-AC-011` | “可限高并在内部滚动”原文逐字保留 | `CCFG-AC-109` | 同上 |
| `CCFG-UI-009` | 原文逐字保留 | `CCFG-UI-044`（§17） | 同上 |
| `CCFG-UI-024` | 原文逐字保留；仅“`+N` Popover 清单设最大高度内滚”分句被标注取代，弹窗内部滚动与 Tooltip 单实例分句**保持有效** | `CCFG-UI-044` | 同上；并显式声明 `CCFG-UI-044` 的“无内部滚动”**仅**作用于 `+N` 弹层 |

## 5. 定义行与边界核验

| 核验项 | 结果 |
|---|---|
| `CCFG-REQ-*` 既有定义行（112 条） | 除授权目标标注的 `CCFG-REQ-016` 外**逐字节零变化** |
| `CCFG-AC-*` 既有定义行（104 条） | 除授权目标标注的 `CCFG-AC-011` 外**逐字节零变化** |
| `CCFG-DESIGN-*` 既有定义行（53 条） | **逐字节零变化** |
| `CCFG-UI-*` 既有定义行（42 条） | 除授权目标标注的 `CCFG-UI-009`/`CCFG-UI-024` 外**逐字节零变化** |
| 117 条验收执行状态 | 全部保持 `NOT_RUN`，**未**改为通过 |
| 历史报告 | `docs/features/client-config/reports/**` 既有报告**未修改** |
| 数据源管理参考页 | `frontend/src/views/data-source/DataSourcePage.vue` **未修改** |
| 两套公共模板与全局预设 | **未修改**；模板级 `NOT_STARTED`/`NOT_GRANTED`/`NOT_DECIDED` 未变 |
| 保护文件 | `CLAUDE.md`、`agent-env.sh`、`docs/features/README.md`、`API.md`、`DATABASE.md`、`docs/baseline/` 六份项目级基线、`docs/prompts/**`、`.claude/settings.local.json` **均未修改** |
| `git diff --check` | 无空白/行尾错误 |

## 6. 未执行项与下一入口

- 未执行任何测试、构建、浏览器核对或服务启停（纯文档任务；按验证矩阵均为 `NOT_APPLICABLE`）。
- 未执行正式验收（117 条 `CCFG-AC-*` 全部 `NOT_RUN`），未作出项目负责人目测通过或最终接受结论。
- 未访问/修改数据库、ZooKeeper、Kafka（`database_write_status=NOT_REQUESTED`、`zookeeper_write_status=NOT_REQUESTED`）。
- 未改 `API.md`/`DATABASE.md`，未新增/调整依赖。
- **本轮草案尚未获批、尚未实现**：`adjustment3_baseline_status=DRAFT_PENDING_USER_REVIEW`、`adjustment3_approval_status=NOT_APPROVED`、`adjustment3_implementation_status=NOT_STARTED`。
- 下一入口：`CHATGPT_REMOTE_CLIENT_CONFIG_POPOVER_AND_DIALOG_VISUAL_BASELINE_REVIEW`（草案远程复审入口，**不是**直接进入实现）。
