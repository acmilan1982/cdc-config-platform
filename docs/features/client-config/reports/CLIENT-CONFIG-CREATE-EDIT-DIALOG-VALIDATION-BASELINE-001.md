# 探针端管理新增／编辑弹窗校验与交互调整 · 基线草案建立执行报告

> 任务代码：`CLIENT-CONFIG-CREATE-EDIT-DIALOG-VALIDATION-BASELINE-001`
> 任务类型：纯文档（仅为 `/config/client` 新增／编辑探针弹窗建立页面级调整**草案**）
> 分支：`develop`
> 起始提交：`cb9009a88a1fa4abb2b65a4ea850c5e881e46529`
> 上一时点远程复审：ChatGPT 从远程 Git 复审第三轮实现提交 `6cf7a554b457ed6c8edb827ef1971054df3354fb`（代码与 R1 裁切修复通过，整次提交文档复审 `CHANGES_REQUIRED`），其后 README 文档纠错已以普通提交 `cb9009a88a1fa4abb2b65a4ea850c5e881e46529` 提交并推送（父提交 `6cf7a554`，本报告不预造该纠错的复审结论）
> 下一入口：`CHATGPT_REMOTE_CLIENT_CONFIG_CREATE_EDIT_DIALOG_VALIDATION_BASELINE_REVIEW`
> 本任务不修改代码、不执行正式验收、不宣称本轮已实现或获批准，不作出项目负责人目测通过或最终接受结论。

---

## 1. 门禁与基线

```text
branch=develop
expected_base_commit=cb9009a88a1fa4abb2b65a4ea850c5e881e46529
actual_base_commit=cb9009a88a1fa4abb2b65a4ea850c5e881e46529
origin_develop=cb9009a88a1fa4abb2b65a4ea850c5e881e46529
ahead_behind(origin/develop...HEAD)=0/0
baseline_approval_status=APPROVED(第三轮及以前)
adjustment4_baseline_status=DRAFT_PENDING_USER_REVIEW
adjustment4_approval_status=NOT_APPROVED
adjustment4_implementation_status=NOT_STARTED
adjustment4_formal_acceptance_execution_status=NOT_RUN
page_level_authorization_status=GRANTED_FOR_CONFIG_CLIENT_CREATE_EDIT_DIALOG_ONLY
git_commit_authorized=仅限本次白名单文档
git_push_authorized=仅限本次白名单文档普通推送至 origin/develop
```

- 当前分支为 `develop`，本地 `HEAD`、`origin/develop` 与远程 `refs/heads/develop` 三者一致（`cb9009a8`），ahead/behind 为 `0/0`，无分叉、无冲突，未触发任务提示词中的停线条件。
- 任务开始前已存在的无关工作区内容**保持原样、未修改、未暂存**：` M .claude/settings.local.json` 与未跟踪的 `docs/prompts/**`。
- 检查线索中的第三轮实现提交 `6cf7a554b457ed6c8edb827ef1971054df3354fb` 与 README 纠错提交 `cb9009a88a1fa4abb2b65a4ea850c5e881e46529` 均已作为历史事实核对，`cb9009a8` 为本次任务起始提交。

## 2. 实际变更文件

| 文件 | 变更类型 | 说明 |
|---|---|---|
| `docs/features/client-config/REQUIREMENTS.md` | 修改 | 新增 §7.13 与 `CCFG-REQ-123~136`（14 条）、3 条定向修订、§8 编号核验与合计、§10 变更记录、§11 后续入口登记、metadata |
| `docs/features/client-config/ACCEPTANCE.md` | 修改 | 新增 §1.8 分层状态块与 `CCFG-AC-118~135`（18 条）、§2/§3 编号、§4 用例行（全部 `NOT_RUN`）、§5 覆盖矩阵、§6 变更记录 |
| `docs/features/client-config/DESIGN.md` | 修改 | 新增 §16 与 `CCFG-DESIGN-061~071`（11 条）、`CCFG-DESIGN-059` 定向修订标注、§12.1/§12.2/§11/metadata、`## 16 变更记录`→`## 17` |
| `docs/features/client-config/UI.md` | 修改 | 新增 §18 与 `CCFG-UI-050~059`（10 条）、`CCFG-UI-013`/`-015`/`-017` 定向修订标注、§14/metadata、`## 18 变更记录`→`## 19`；`§17` 编号保留（被 `DESIGN.md` 引用） |
| `docs/features/client-config/README.md` | 修改 | 新增 §1.9 第四轮草案分层状态块、§1 metadata 两行、§2 导航同步（README 自身与四份文档状态单元）、新增报告行、§4 当前状态条目与滞后状态值说明、§5 新当前入口 |
| `docs/features/client-config/reports/CLIENT-CONFIG-CREATE-EDIT-DIALOG-VALIDATION-BASELINE-001.md` | 新增 | 本报告 |

**未修改**：`docs/features/client-config/API.md`、`DATABASE.md`、`docs/baseline/**`（含两套模板 README／SHARED_COMPONENT_DESIGN／MIGRATION）、`docs/features/README.md`、任何历史报告、`docs/prompts/**`、前后端代码与测试、`CLAUDE.md`、`agent-env.sh`、参考页 `frontend/src/views/data-source/DataSourcePage.vue`、数据库对象与构建依赖。

## 3. 新旧定义编号与逐项覆盖

编号策略为**在既有最大编号之后连续追加**（不复用、不重排历史编号），并逐项建立 需求 ↔ 设计 ↔ UI ↔ 验收 映射：

| 需求（`REQUIREMENTS.md` §7.13） | 设计（`DESIGN.md` §16） | UI（`UI.md` §18） | 验收（`ACCEPTANCE.md` §4） |
|---|---|---|---|
| `CCFG-REQ-123` 字段级校验反馈（红框 + 正下方红字、一次校验全部、定位首个错误、修正即清除、取消顶端临时消息） | `CCFG-DESIGN-061` | `CCFG-UI-050` | `CCFG-AC-118`、`CCFG-AC-119` |
| `CCFG-REQ-124` 主提交按钮始终黑色可点击、未选数据源不预先禁用、请求中防重复且加载态不跳色 | `CCFG-DESIGN-062` | `CCFG-UI-051` | `CCFG-AC-120` |
| `CCFG-REQ-125` 可归属字段错误与全局错误边界 | `CCFG-DESIGN-063` | `CCFG-UI-052` | `CCFG-AC-121` |
| `CCFG-REQ-126` 未选数据源中性灰色说明“至少选择 1 个数据源”、选后隐藏、全取消恢复 | `CCFG-DESIGN-064` | `CCFG-UI-053` | `CCFG-AC-122` |
| `CCFG-REQ-127` 提交尝试后转红色错误与状态恢复 | `CCFG-DESIGN-065` | `CCFG-UI-054` | `CCFG-AC-123` |
| `CCFG-REQ-128` 字段反馈区稳定空间、不硬裁剪、窄视口边界 | `CCFG-DESIGN-066` | `CCFG-UI-055` | `CCFG-AC-124`、`CCFG-AC-125` |
| `CCFG-REQ-129` 弹窗相对浏览器可见视口水平居中 | `CCFG-DESIGN-067` | `CCFG-UI-056` | `CCFG-AC-126` |
| `CCFG-REQ-130` 配置项名称统一右对齐 | `CCFG-DESIGN-068` | `CCFG-UI-057` | `CCFG-AC-127` |
| `CCFG-REQ-131` 探针 ID 输入／粘贴上限 32 位与字段级格式报错 | `CCFG-DESIGN-069` | `CCFG-UI-058` | `CCFG-AC-128`、`CCFG-AC-129` |
| `CCFG-REQ-132` 探针描述 256 字符输入上限与输入提示 | `CCFG-DESIGN-070` | `CCFG-UI-013`、`CCFG-UI-059` | `CCFG-AC-130` |
| `CCFG-REQ-133` “自动生成”保留前 256 字符的新旧时序 | `CCFG-DESIGN-070` | `CCFG-UI-059` | `CCFG-AC-131`、`CCFG-AC-132` |
| `CCFG-REQ-134` 编辑历史记录仅回显前 256 字符草稿 | `CCFG-DESIGN-071` | `CCFG-UI-059` | `CCFG-AC-133` |
| `CCFG-REQ-135` 共通规则与页面边界 | `CCFG-DESIGN-071` | —（页面边界不新增界面条目） | `CCFG-AC-134` |
| `CCFG-REQ-136` 后续“表单弹窗模板”入口登记（仅登记） | `CCFG-DESIGN-071` | `CCFG-UI-059` | `CCFG-AC-135` |

编号总数（当前值）：

| 文档 | 原最大编号 | 本轮新增 | 现最大编号 | 总数 |
|---|---|---|---|---|
| `REQUIREMENTS.md` | `CCFG-REQ-122` | 14（`123~136`） | `CCFG-REQ-136` | **136** |
| `ACCEPTANCE.md` | `CCFG-AC-117` | 18（`118~135`） | `CCFG-AC-135` | **135** |
| `DESIGN.md` | `CCFG-DESIGN-060` | 11（`061~071`） | `CCFG-DESIGN-071` | **71** |
| `UI.md` | `CCFG-UI-049` | 10（`050~059`） | `CCFG-UI-059` | **59** |

覆盖关系：需求→设计→UI→验收 **136/136**，需求→验收 **136/136**；`DESIGN.md` §12.1 追加 `CCFG-REQ-123~136` 映射行、§12.2 追加 `CCFG-AC-118~135` 映射行，`ACCEPTANCE.md` §5 追加 14 行需求覆盖行并对 `CCFG-REQ-037`/`-039`/`-060` 行补充本轮归属。

**覆盖到的交互面**（任务要求逐项）：初始中性提示（`CCFG-REQ-126`/`AC-122`）、选后消失（同）、全取消恢复（`CCFG-REQ-127`/`AC-123`）、提交后变红（同）、弹窗稳定性（`CCFG-REQ-128`/`AC-124`/`AC-125`）、32／256 输入与截断（`CCFG-REQ-131`/`-132`/`AC-128~130`）、历史记录（`CCFG-REQ-134`/`AC-133`）、按钮状态（`CCFG-REQ-124`/`AC-120`）、编辑模式（`CCFG-REQ-131`/`AC-129`）、居中（`CCFG-REQ-129`/`AC-126`）、窄视口（`CCFG-REQ-128`/`AC-125`、`CCFG-REQ-129`/`AC-126`）。

## 4. 已批准基线与本轮草案的分层状态

- **历史已批准层（保持真实、不改写）**：`adjustment_baseline_status=APPROVED`、`adjustment2_baseline_status=APPROVED`、`adjustment3_baseline_status=APPROVED`；`adjustment3_approval_status=APPROVED_BY_PROJECT_OWNER`（`adjustment3_approved_reviewed_commit=1df0ef7b4e3717d9b980e9aa9cc1f8e4f036f244`）。
- **既有实现事实层（保持真实、不改写）**：`existing_feature_implementation_status`/`adjustment_implementation_status`/`adjustment2_implementation_status` 均为 `IMPLEMENTED_PENDING_USER_ACCEPTANCE`；`adjustment3_implementation_status=IMPLEMENTED_PENDING_CHATGPT_REVIEW`（第三轮实现任务完成时点的真实值）。
- **本轮草案层（本次建立）**：`adjustment4_baseline_status=DRAFT_PENDING_USER_REVIEW`、`adjustment4_approval_status=NOT_APPROVED`、`adjustment4_implementation_status=NOT_STARTED`、`adjustment4_formal_acceptance_execution_status=NOT_RUN`。
- `PENDING_USER_CONFIRMATION=0`；两份既有查询／列表视觉模板的模板级全局状态保持不变。

**口径区分**：本任务结果是「**已建立草案**」，既**不是**「已实现」，也**不是**「已正式验收」，本轮**不**产生项目负责人批准。

## 5. 被定向修订的条款（原文保留、可追踪）

均在原定义行追加 `**【本轮（第四轮）定向修订 · 待批准】**` 标注，**原文不改写、不伪装成从未存在**：

| 文档 | 条款 | 修订方向 | 承接条目 |
|---|---|---|---|
| `REQUIREMENTS.md` | `CCFG-REQ-037` | 探针 ID 由“无输入长度上限”收敛为输入／粘贴最多 32 位并以字段级错误指出格式问题 | `CCFG-REQ-131` |
| `REQUIREMENTS.md` | `CCFG-REQ-039` | 探针描述由无界面字符上限收敛为最多 256 字符（Unicode 完整字符），保留后端 UTF-8 `<=1024` 字节校验 | `CCFG-REQ-132` |
| `REQUIREMENTS.md` | `CCFG-REQ-060` | “自动生成”由“生成完整结果超 1024 字节则失败”改为“先生成完整描述、再直接保留前 256 字符后执行字节检查”的**新旧时序** | `CCFG-REQ-133` |
| `DESIGN.md` | `CCFG-DESIGN-059` | 主提交按钮 `:disabled="saveBlockReason !== null || submitting"` 中由 `saveBlockReason` 引起的**预先禁用**被取代（保留 `:loading="submitting"` 防重复提交） | `CCFG-DESIGN-062` |
| `UI.md` | `CCFG-UI-013` | 字段错误由页面顶端临时消息改为字段级反馈；描述输入上限与输入提示变更 | `CCFG-UI-050`、`CCFG-UI-058`、`CCFG-UI-059` |
| `UI.md` | `CCFG-UI-015` | “自动生成”超过 1024 字节失败的③分支改为截断后再做字节检查 | `CCFG-UI-059` |
| `UI.md` | `CCFG-UI-017` | “数据源为 0 → 禁止保存”的预先禁用口径改为“按钮始终可点击、点击后显示字段级错误” | `CCFG-UI-051` |

既有 `CCFG-UI-045`／`CCFG-UI-046`／`CCFG-UI-024` 的口径经核对**继续有效**，未因本轮被取代；**既有验收定义行零修订**（`CCFG-AC-001~117` 逐字节零变化）。

## 6. 验收状态

- 本轮新增 `CCFG-AC-118~135`（18 条）**全部为 `NOT_RUN`**，均带 `**【本轮新增 · 第四轮草案 · 待复审】**` 标记。
- 全文件 `formal_acceptance_execution_status=NOT_RUN`：**135 条全部未执行**；`adjustment4_formal_acceptance_execution_status=NOT_RUN`。
- 既有 117 条验收**未假写为通过**，仍全部 `NOT_RUN`；本轮**未**把任何用例标记为执行或通过。

## 7. 未修改文件与未执行项

**未修改**：见 §2 末尾列表（含 `API.md`、`DATABASE.md`、`docs/baseline/**`、历史报告、`docs/prompts/**`、前后端代码与服务、参考页）。

**未执行项（本任务明确不做）**：

- 未运行测试、Vitest、Maven 测试；未运行前后端构建、类型检查、lint。
- 未启动或停止任何服务；未做浏览器核对。
- 未执行正式验收；未访问数据库、ZooKeeper、Kafka。
- 未修改代码、配置、数据库对象。
- 未提前创建或批准“新增／编辑表单弹窗模板”，未声称其他页面已接入。

## 8. 静态检查结果

| 检查项 | 命令／方法 | 结果 |
|---|---|---|
| 分支与提交 | `git branch --show-current`、`git rev-parse HEAD`、`git ls-remote origin refs/heads/develop` | `develop`；三者均为 `cb9009a8`，`0/0` |
| 空白／冲突标记 | `git diff --check` | 干净（退出码 0） |
| 变更白名单 | `git status --short` | 仅 5 份白名单文档 + 未跟踪 `docs/prompts/` 与预先存在的 ` M .claude/settings.local.json`（后者与本任务无关，未暂存） |
| 定义编号唯一性 | 逐文档提取 `CCFG-REQ/AC/DESIGN/UI` 编号 | 最大编号分别为 136／135／71／59，新增段连续且无重号 |
| 映射完整性 | `DESIGN.md` §12.1／§12.2、`ACCEPTANCE.md` §5 行数核对 | 需求 136 行、验收 135 行映射齐备 |
| 状态口径 | 全文检索 `adjustment4_*`、`NOT_RUN`、批准／实现措辞 | 本轮统一为草案 `DRAFT_PENDING_USER_REVIEW`／`NOT_APPROVED`／`NOT_STARTED`／`NOT_RUN`，未混用「已批准／已实现／已验收」 |
| 滞后状态值 | 逐处核对当前值表述 | 已同步 `README.md` §1「正式验收执行」117→135、§4 首轮条目 89→135（均带历史值说明，不改写历史表述）；`DESIGN.md`／`UI.md` 同项计数同步并记录 |

## 9. 下一入口

- `next_entry=CHATGPT_REMOTE_CLIENT_CONFIG_CREATE_EDIT_DIALOG_VALIDATION_BASELINE_REVIEW`
- 复审对象：本草案结果提交（从远程 Git 读取）；复审要点为 §3 定义映射、§5 定向修订、§6 验收状态与状态口径。
- 复审通过并经项目负责人批准后，**另开独立任务**进入本轮代码实现；本轮**不**提前实现、**不**声称模板已建立或获批准。
- `blocker`：无（任务范围内无阻塞；本轮停在本复审入口等待基线复审与项目负责人批准）。
