# 查询下拉固定宽度基线草案执行报告（`DATA-SOURCE-SNAPSHOT-STATUS-SELECT-POPPER-FIXED-WIDTH-BASELINE-001`）

## 1. 任务与授权来源

- 任务编号：`DATA-SOURCE-SNAPSHOT-STATUS-SELECT-POPPER-FIXED-WIDTH-BASELINE-001`
- 任务类型：**纯文档查询下拉弹层（popper）固定宽度基线草案**（不实现、不执行正式验收、不代替项目负责人批准文档）
- 分支：`develop`
- 授权基线提交（任务开始时 `origin/develop` 最新提交）：`2a9a271690bfdc68b16772268e84928a33abdeda`
- 原型宽度决策来源（隔离视觉原型任务）：`DATA-SOURCE-SNAPSHOT-STATUS-SELECT-POPPER-FIXED-WIDTH-PROTOTYPE-001`（隔离 worktree `/agent/dss-select-popper-fixed-width-proto-001`，基准提交同为 `2a9a271690bfdc68b16772268e84928a33abdeda`）
- 授权来源：本任务提示词 `docs/prompts/data-source-snapshot-status/DATA-SOURCE-SNAPSHOT-STATUS-SELECT-POPPER-FIXED-WIDTH-BASELINE-001.md`（该提示词本身不属于允许提交范围，不提交）。

## 2. 驱动事实

| 事实 | 值 |
|---|---|
| 项目负责人对隔离原型宽度的决策 | `APPROVED_BY_PROJECT_OWNER`（口径：“我检查过了，没有问题”／“批准，按照你的方案执行吧”） |
| `prototype_width_decision_status` | `APPROVED_BY_PROJECT_OWNER` |
| 查询控件交互调整实现状态（既有分层事实） | `IMPLEMENTED_ADJUSTMENT_PENDING_REVIEW` |
| 项目负责人 `5173` 人工检查结论（既有分层事实） | `project_owner_visual_review_status=CHANGES_REQUIRED` |
| `formal_acceptance_status` | `NOT_RUN`（本草案调整前 103 条，调整后 107 条全部 `NOT_RUN`） |

> 说明：项目负责人批准的是**隔离原型 `5174` 的宽度选择**，不是本 Feature 文档。本文档当前为**待复审草案**（`DRAFT_PENDING_CHATGPT_REVIEW_AND_PROJECT_OWNER_APPROVAL`），既未被批准、也尚未在 `5173` 正式实现。

## 3. 根因诊断（原型阶段已定位）

1. 三个查询下拉使用 Element Plus `el-select`，`popper-class` 同时落在**两个**元素上：
   - 外层 `div.el-popper.is-pure.is-light.el-tooltip.el-select__popper.<Feature 私有 popper class>`——**可见边界**，承载 1px 边框；
   - 内层 `div.el-select-dropdown.is-multiple.<Feature 私有 popper class>`——承载 Element Plus 内联 `min-width`（触发控件宽 − 2），并按内容自适应。
2. 基线（`2a9a271`）外层 popper 宽度由内容决定；Element Plus 规则 `.el-select-dropdown__item.is-selected { font-weight: 700 }` 与定宽 flex 组合，使**选中更长选项时 popper 变宽**，几何随所选内容跳变。
3. 因此固定对象必须是**外层的可见边界**，而不是内层 dropdown、也不是触发控件；只锁内层或被内层 `min-width` 顶开都不成立。

## 4. 规则决策（本轮固化并冻结为草案的规则）

### 4.1 三档固定宽度与视口安全上界（`DSS-REQ-087`）

| 下拉 | 固定宽度 | 视口安全上界 |
|---|---|---|
| 探针端 / client | `480px` | `min(480px, calc(100vw - 16px))` |
| 源库 / source | `400px` | `min(400px, calc(100vw - 16px))` |
| 快照状态 / status | `240px` | `min(240px, calc(100vw - 16px))` |

- 固定对象：Feature 私有 `popper-class` 对应的**外层 `.el-popper` 可见边界**。
- 外层同时锁定 `width`/`min-width`/`max-width`；内层 dropdown 自适应外层、自动填满，**不两层都锁同一 border-box 宽度**。
- 作用域限定 Feature 私有命名空间内，最小特异度；不使用 `!important`、不做全局 Element Plus 覆盖。

### 4.2 宽度不变性（`DSS-AC-104`/`DSS-AC-105`）

- 以下状态**不得**改变 popper 宽度：选择、取消、清空/重置、多选、折叠标签、展开/闭合、Tooltip 显示/隐藏、滚动条出现、选中项由短变长或由长变短。
- 选中项 `font-weight: 700` 保留（既有已批准展示规则），但**不得**改变 popper 宽度。
- 小视口下以上界 `calc(100vw - 16px)` 收敛；不产生横向滚动、不产生溢出。

### 4.3 不变契约

- 触发控件保持既有尺寸 240/300/200 × 32px。
- 四字段 `CLIENT_ID`/`CLIENT_DESC`/`DATA_SOURCE_ORG`/`DATA_SOURCE_ID` 的 trim＋20 Unicode 码点截断、`CLIENT_DESC` Tooltip（完整原文）、选项完整 `value` 与查询语义**不变**。
- API/DB/后端/请求状态机**不变**（本规则为纯前端 popper 几何规则）。
- **取代/扩展关系**：本草案扩展 `DSS-REQ-084`（既有“固定外部几何”规则）的范围到 Teleport 外层 popper，**不改写 `DSS-REQ-084` 本体**；既有 `DSS-REQ-001~086`、`DSS-AC-001~103` 业务行零变化。

## 5. 原型证据（设计验证证据，非正式验收）

来源：隔离原型任务 `DATA-SOURCE-SNAPSHOT-STATUS-SELECT-POPPER-FIXED-WIDTH-PROTOTYPE-001`（worktree `/agent/dss-select-popper-fixed-width-proto-001`，仅改 `frontend/src/views/data-source-run-state/components/DataSourceSnapshotQueryBar.vue` 与 Feature 私有样式；**未提交、本任务未触碰**）。证据位于该 worktree 的 `runtime-logs/DATA-SOURCE-SNAPSHOT-STATUS-SELECT-POPPER-FIXED-WIDTH-PROTOTYPE-001/`：

| 证据 | 结论 |
|---|---|
| `state-matrix-summary.json`（真实浏览器 CDP 测量，4 档视口 × 状态 A–M，每态 ≥5 次重复） | `target`＝client 480 / source 400 / status 240；`global` 各下拉 `popW` 全状态全视口 `min=max=median` 且 `spread=0`、`meetsTarget=true`；全部状态 `popW.spread` 非零项**计 0**；触发控件恒为 240/300/200 |
| 视口安全上界 | `containment.total=720`、`outOfViewport=[]`（无越界/无溢出） |
| `regression.json` | 选择/取消/清空/重置/Tooltip 等交互产生请求 **0**；「查询」产生 **恰好 1** 个 `GET /api/monitor/data-source-run-state/list?clientId=<完整原始值>`（`queryRawValuePresent=true`）；`interactionNonGet=[]`；console **error 0** |
| `regression.json` → `otherRoutes` | `/config/data-source`、`/monitor/cdc-node`、`/monitor/topic-offset`、`/large-screen` 均 `popperNodes=0`、`featureRulesPresent=0`（无泄漏） |
| `screenshots/`（90 张）＋ `screenshots.sha256` | 4 档视口（1280×800/1700×920/1920×1080/2560×1440）多状态截图 |
| `build-test.log` | `Test Files 13 passed (13)`、`Tests 241 passed (241)`；`npm run build` 成功（仅既有 chunk 体积告警） |
| `01-source-diff.patch`、`git-state.txt` | 原型改动范围与 Git 现场；基线 `2a9a271690bfdc68b16772268e84928a33abdeda` |

> 状态口径：上述浏览器/测试/构建结果**仅为原型设计验证证据**，**不得写成正式验收 `PASS`**；`5174` 原型不等于 `5173` 正式实现。

## 6. 编号增量与追踪结果

| 项目 | 调整前 | 调整后 |
|---|---|---|
| 需求编号 | `DSS-REQ-001~086`（86 条） | `DSS-REQ-001~087`（87 条，新增草案 `DSS-REQ-087`） |
| 验收编号 | `DSS-AC-001~103`（103 条） | `DSS-AC-001~107`（107 条，新增草案 `DSS-AC-104~107`） |
| 验收状态 | 全部 `NOT_RUN` | 全部 `NOT_RUN`、`acceptance_not_run_count=107` |
| 需求 → 设计落点矩阵 | 86/86 | 87/87 |
| 验收 → 设计落点矩阵 | 103/103 | 107/107 |

新增需求 → 验收映射（双向，见 `ACCEPTANCE.md` §5）：

| 需求 | 验收 |
|---|---|
| `DSS-REQ-087` | `DSS-AC-104`、`DSS-AC-105`、`DSS-AC-106`、`DSS-AC-107` |

## 7. 文件范围（本轮允许并实际修改的文件）

| 文件 | 变更 |
|---|---|
| `docs/features/data-source-snapshot-status/REQUIREMENTS.md` | 新增 §21.8（`DSS-REQ-087`）与取代/扩展说明；更新 §1 元数据、§24 计数/状态、§25 变更记录 |
| `docs/features/data-source-snapshot-status/ACCEPTANCE.md` | 新增 §4.22（`DSS-AC-104~107`，全部 `NOT_RUN`）；更新 §1/§3/§5/§6/§7 计数与双向映射 |
| `docs/features/data-source-snapshot-status/DESIGN.md` | 新增 §27；更新 §1 元数据、§14.2 → 87/87、§14.3 → 107/107 |
| `docs/features/data-source-snapshot-status/UI.md` | 新增 §21 界面规则；更新 §1 元数据 |
| `docs/features/data-source-snapshot-status/README.md` | 更新 §5 导航行、自述行、新增报告行；§8/§10 记录诊断、隔离原型与项目负责人原型批准、草案待复审、`5173` 未实现、下一入口 |
| `docs/features/README.md` | `data-source-snapshot-status` 行同步本轮草案事实；变更记录新增一行 |
| `docs/features/data-source-snapshot-status/API.md` | 仅 §1 组合计数（86→87、103→107）与分层状态/下一入口同步＋一条纯前端 popper 几何规则说明；业务契约与 §9 映射表**逐字节不变** |
| `docs/features/data-source-snapshot-status/DATABASE.md` | 仅 §1 组合计数与分层状态/下一入口同步＋一条说明；业务正文**逐字节不变** |
| `docs/features/data-source-snapshot-status/reports/DATA-SOURCE-SNAPSHOT-STATUS-SELECT-POPPER-FIXED-WIDTH-BASELINE-001.md` | 本报告（新增） |

零差异约束（已遵守）：

- `frontend/**`、`backend/**`、SQL、config、测试、证据目录：**零差异**（本任务不改代码）。
- `DSS-REQ-001~086` 与 `DSS-AC-001~103` 业务行：**逐字节零变化**。
- `API.md`/`DATABASE.md` 接口路径、方法、参数、响应字段、DTO/VO、错误码、映射表、SQL、表结构、字段、索引、约束、关联、排序、只读边界：**逐字节零变化**。
- 原型 worktree `/agent/dss-select-popper-fixed-width-proto-001`：**未触碰、未提交、未清理**；主工作区与 `5173` 正式实现 worktree 既有修改：**未触碰**。
- 未提交本任务提示词、runtime logs、截图、构建产物、依赖目录或临时文件。
- 历史记录保留历史语境，不回写。

## 8. Git 结果

- 提交与推送按外层 `AGENT_TASK_RESULT` 记录为准（本报告不预先编造最终提交哈希）。
- 使用全新隔离 docs worktree `/agent/dss-popper-width-baseline-001`（detached HEAD，基准 `2a9a271690bfdc68b16772268e84928a33abdeda`）。
- 只暂存本任务允许范围内的文档与新增报告；单次普通提交（无 amend、无 force）；推送 `origin/develop`；推送前重新 fetch 校验基线未前移，推送后校验本地 HEAD 与 `origin/develop` 一致、ahead/behind 0/0。

## 9. 未执行事项

- **未在 `5173` 实现**：`popper_width_formal_5173_implementation_status=PENDING_FORMAL_IMPLEMENTATION_ON_5173`；原型代码未复制进 `5173`。
- **未执行正式验收**：`formal_acceptance_status=NOT_RUN`，107 条 `DSS-AC-001~107` 全部 `NOT_RUN`、`acceptance_not_run_count=107`；未把任何原型/开发自测写成 `PASS`。
- **未代替项目负责人批准文档**：`popper_width_document_status=DRAFT_PENDING_CHATGPT_REVIEW_AND_PROJECT_OWNER_APPROVAL`、`pending_user_review=NO`、`pending_user_confirmation_count=0`；未把草案写成 `APPROVED`。
- **未做代码复审**：`popper_width_formal_code_review_status=NOT_RUN`。
- 未运行测试/构建/浏览器验证；未启动或停止 `5173`/`5174`/`8080`；未访问数据库、ZooKeeper、Kafka；未创建通用 `QUERY-LIST-PAGE-UI-PATTERN`。

## 10. 分层状态与下一入口

- `prototype_width_decision_status=APPROVED_BY_PROJECT_OWNER`
- `popper_width_document_status=DRAFT_PENDING_CHATGPT_REVIEW_AND_PROJECT_OWNER_APPROVAL`
- `popper_width_formal_5173_implementation_status=PENDING_FORMAL_IMPLEMENTATION_ON_5173`
- `popper_width_formal_code_review_status=NOT_RUN`
- `formal_acceptance_status=NOT_RUN`、`acceptance_not_run_count=107`
- `human_formal_5173_review_status=NOT_RUN_FOR_THIS_ADJUSTMENT`
- `existing_requirements_business_row_change_status=ZERO`、`existing_acceptance_business_row_change_status=ZERO`
- `pending_user_review=NO`、`pending_user_confirmation_count=0`
- 下一入口：`CHATGPT_POPPER_WIDTH_BASELINE_REVIEW_FROM_GIT_THEN_PROJECT_OWNER_DOCUMENT_APPROVAL`（ChatGPT 从远程 Git 对本草案独立复审，复审通过后由项目负责人决定是否批准；批准前不得开始 `5173` 正式实现）。
