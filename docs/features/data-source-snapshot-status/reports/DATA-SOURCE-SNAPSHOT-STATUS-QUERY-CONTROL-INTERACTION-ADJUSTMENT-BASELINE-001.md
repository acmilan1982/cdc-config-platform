# 查询控件交互调整草案执行报告（`DATA-SOURCE-SNAPSHOT-STATUS-QUERY-CONTROL-INTERACTION-ADJUSTMENT-BASELINE-001`）

## 1. 任务与授权来源

- 任务编号：`DATA-SOURCE-SNAPSHOT-STATUS-QUERY-CONTROL-INTERACTION-ADJUSTMENT-BASELINE-001`
- 任务类型：**纯文档查询控件交互调整草案**（不实现、不执行正式验收、不代替项目负责人批准草案）
- 分支：`develop`
- 授权基线提交（任务开始时 `origin/develop` 最新提交）：`ba309ea8b469e3796ab08ed87c6ccb8c6d5bb253`
- 原正式实现提交（R2～R7 视觉方案应用到 `5173` 的结果提交）：`3ec9cbf6487eacff004212fb3aca3064c3bd18cc`
- 已批准视觉内容基准（R2～R7 隔离视觉原型设计固化批准内容基准）：`e67b2ecc3897c3e83597126e259ee4c19349a66a`
- 授权来源：本任务提示词 `docs/prompts/data-source-snapshot-status/DATA-SOURCE-SNAPSHOT-STATUS-QUERY-CONTROL-INTERACTION-ADJUSTMENT-BASELINE-001.md`（该提示词本身不属于允许提交范围，不提交）。

## 2. 驱动事实

| 事实 | 值 |
|---|---|
| `formal_5173_code_review_status` | `APPROVED`（ChatGPT 已从 Git 对 R2～R7 正式实现代码独立复审通过） |
| `project_owner_visual_review_status` | `CHANGES_REQUIRED`（项目负责人 `5173` 人工页面检查结论） |
| `formal_acceptance_status` | `NOT_RUN` |
| `formal_acceptance_not_run_count` | `95`（本草案调整前；调整后为 `103`） |

## 3. 项目负责人确认的问题（问题原话）

项目负责人对 `5173` 正式实现页面人工检查后确认三类查询控件交互问题：

1. **查询区下拉宽度随所选内容变化** —— 选中项长短不同时下拉控件宽度发生跳变，导致查询栏几何不稳定。
2. **四个展示字段缺少统一字段级截断** —— 探针端 `CLIENT_ID`/`CLIENT_DESC`、源库端 `DATA_SOURCE_ORG`/`DATA_SOURCE_ID` 各自没有统一的字符上限，超长文本会撑开控件、引发换行或遮挡后续字段。
3. **`CLIENT_DESC` 截断后需可读回全文** —— 描述被截断后，用户需要能通过悬停 Tooltip 看到完整原始描述。

## 4. 规则决策（本轮确立的统一口径）

### 4.1 字段级截断（`DSS-REQ-085`）

- 统一 `truncate(value, 20)`：按 **Unicode 码点**计数（`CJK`/emoji 各计 1 个码点，禁止拆开代理对）；`≤20` 返回原始值；`>20` 返回前 `20` 个码点 + 英文 `...`。
- 探针端展示：`truncate(CLIENT_ID, 20)（truncate(CLIENT_DESC, 20)）`；源库端展示：`truncate(DATA_SOURCE_ORG, 20)（truncate(DATA_SOURCE_ID, 20)）`。
- 空值规则：`CLIENT_DESC` 为 `null`/空/纯空白时不产生空括号；源库端 `ORG` 为空/空白/配置缺失时按既有 `DSS-REQ-074` 先用原始 `DATA_SOURCE_ID` 回退、再套 `truncate(...,20)`，同样不产生空括号。
- 边界：恰好 `20` 码点显示完整、不追加 `...`；`≥21` 码点显示前 `20` 码点 + `...`。
- 候选下拉项与可见选中项使用同一 `truncate` 结果，同一原始值两处显示完全相同。
- **仅显示态**：选项 `value`、查询参数、已应用查询条件、请求语义一律保留完整原始 ID；`CSS text-overflow` 仅作最后兜底。

### 4.2 下拉固定宽度与内部收缩（`DSS-REQ-084`）

- 固定宽度：探针端 `240px`、源库端 `300px`、快照状态 `200px`。
- 在初始“全部”、选中项最短、选中项最长、短↔长切换、多选并 `collapse-tags`、取消最长选项、清空回“全部”、重置、面板开/关、Tooltip 显示/隐藏等状态下宽度均不变，且其后字段组与 `查询`/`重置` 按钮的 `x` 坐标不得移动。
- 候选文本变长不得引入额外换行。
- 实现前**必须先在真实浏览器定位测量**（禁止猜测式全局 CSS）：`.dss-select`、`.el-select__wrapper`、`.el-select__selection`、`.el-select__selected-item`、`.dss-q-group` 以及动作按钮的几何前后差异。
- 修复范围限定 Feature 命名空间（`.dss-*` + `<style scoped>`），不改通用查询列表页基线、不改全局 `Element Plus` 主题；典型做法为外层锁定 `width`/`min-width`/`max-width`/`flex-basis`、内层 `min-width: 0`。

### 4.3 `CLIENT_DESC` Tooltip（`DSS-REQ-086`）

- 仅当原始 `CLIENT_DESC` 码点长度 `> 20` 时出现；作用于候选悬停与可见选中项悬停两处。
- 内容仅显示**完整未截断的原始 `CLIENT_DESC`**；不显示 `CLIENT_ID`、不显示拼接串、不为源库端字段提供该 Tooltip；表格 Tooltip 与既有已批准源库表格 Tooltip（完整原始 `DATA_SOURCE_ID` only）不变。
- 原始值 `null`/空/纯空白或 `≤20` 码点时不出现。
- 安全最大宽度 `480px` 或 `min(480px, calc(100vw - 16px))`，自然换行；同一时刻至多一个可见实例、不堆叠、离开即隐藏；`+N` 沿用 `Element Plus` 既有语义。
- 显示/隐藏不得改变下拉宽度、查询区高度或其他控件位置。

### 4.4 统一处理原因与不变契约

- 三类问题同属查询区几何与文本呈现的耦合问题：只锁宽不截断则内部 `flex` 子项仍被撑开，只截断不锁外部几何则控件仍可能抖动，Tooltip 显隐又依赖截断判定。故以一个统一口径（“按码点判定超限 + 固定像素锁定外部几何”）一次落地。
- 接口请求语义与刷新状态机、表格、背景、状态标签与源库表格 Tooltip 业务设计**零变化**（对应 `DSS-REQ-023/025/050~054/071`）。

## 5. 编号增量与追踪结果

| 项目 | 调整前 | 调整后 |
|---|---|---|
| 需求编号 | `DSS-REQ-001~083`（83 条） | `DSS-REQ-001~086`（86 条，新增草案 `DSS-REQ-084~086`） |
| 验收编号 | `DSS-AC-001~095`（95 条） | `DSS-AC-001~103`（103 条，新增草案 `DSS-AC-096~103`） |
| 验收状态 | 全部 `NOT_RUN` | 全部 `NOT_RUN`、`acceptance_not_run_count=103` |
| 需求 → 设计落点矩阵 | 83/83 | 86/86 |
| 验收 → 设计落点矩阵 | 95/95 | 103/103 |

新增需求/验收映射（双向，见 `ACCEPTANCE.md` §5）：

| 需求 | 验收 |
|---|---|
| `DSS-REQ-084` | `DSS-AC-096`、`DSS-AC-097`、`DSS-AC-103` |
| `DSS-REQ-085` | `DSS-AC-098`、`DSS-AC-099`、`DSS-AC-103` |
| `DSS-REQ-086` | `DSS-AC-100`、`DSS-AC-101`、`DSS-AC-102`、`DSS-AC-103` |

既有需求业务行的定向取代/扩展（见 `REQUIREMENTS.md` §21.7）：`DSS-REQ-075` → `DSS-REQ-084`/`085`；`DSS-REQ-022`/`DSS-REQ-024` → `DSS-REQ-084`/`085`；`DSS-REQ-028` → `DSS-REQ-086`；`DSS-REQ-070` → `DSS-REQ-086`。

## 6. 文件范围（本轮允许修改并实际修改的文件）

| 文件 | 变更 |
|---|---|
| `docs/features/data-source-snapshot-status/README.md` | 新增本轮草案元数据行与 2026-09-10 提示、更新 §10 下一入口 |
| `docs/features/data-source-snapshot-status/REQUIREMENTS.md` | 新增 §21.6（`DSS-REQ-084~086`）、§21.7（取代/扩展说明），更新 §1/§24/§25 计数与状态 |
| `docs/features/data-source-snapshot-status/ACCEPTANCE.md` | 新增 §4.21（`DSS-AC-096~103`，全部 `NOT_RUN`），更新 §1/§3/§5/§6/§7 计数与映射 |
| `docs/features/data-source-snapshot-status/DESIGN.md` | 新增 §26，§1 元数据更新，§14.2 → 86/86、§14.3 → 103/103 |
| `docs/features/data-source-snapshot-status/UI.md` | 新增 §20（查询控件交互调整草案界面规则），§1 元数据更新 |
| `docs/features/README.md` | 最小同步：`data-source-snapshot-status` 行下一入口与变更记录新增一行 |
| `docs/features/data-source-snapshot-status/reports/DATA-SOURCE-SNAPSHOT-STATUS-QUERY-CONTROL-INTERACTION-ADJUSTMENT-BASELINE-001.md` | 本报告（新增） |

零差异约束（已遵守）：

- `docs/features/data-source-snapshot-status/API.md`、`DATABASE.md`：**整文件逐字节零差异**。
- `frontend/**`、`backend/**`：**零差异**。
- 既有历史报告：**逐字节不变**（未修改、未删除、未新增历史报告）。
- 未提交本任务提示词、runtime logs、截图、构建产物、依赖目录或临时文件。

## 7. Git 结果

- 提交与推送按外层 `AGENT_TASK_RESULT` 记录为准（本报告不预先编造最终提交哈希）。
- 使用全新隔离 worktree `/agent/dss-query-ctl-001`（detached HEAD，基准 `ba309ea8b469e3796ab08ed87c6ccb8c6d5bb253`），保护主工作区与 `5174` prototype worktree、`5173` 正式实现 worktree 的既有修改。
- 只暂存本任务允许范围内的 7 个文件；单次普通提交（无 amend、无 force）；推送 `origin/develop`；推送前重新 fetch 校验基线未前移，推送后校验本地 HEAD 与 `origin/develop` 一致、ahead/behind 0/0。

## 8. 未执行事项

- **未实现**本轮草案：`query_control_interaction_adjustment_implementation_status=PENDING_APPROVAL_AND_IMPLEMENTATION`，`5173` 未落地本轮调整。
- **未执行正式验收**：`formal_acceptance_status=NOT_RUN`，103 条 `DSS-AC-001~103` 全部 `NOT_RUN`、`acceptance_not_run_count=103`；未把任何开发自测写成 `PASS`。
- **未代替项目负责人批准草案**：`query_control_interaction_adjustment_status=DRAFT_PENDING_USER_REVIEW`、`pending_user_review=YES`、`pending_user_confirmation_count=0`。
- **未回退既有事实**：保留 `formal_5173_code_review_status=APPROVED` 与 R2～R7 已批准视觉内容、已进 `5173` 的实现事实。
- 未访问数据库、ZooKeeper、Kafka；未启动或停止服务；未执行 Maven/npm 构建；未做浏览器验证。

## 9. 分层状态与下一入口

- `query_control_interaction_adjustment_status=DRAFT_PENDING_USER_REVIEW`
- `query_control_interaction_adjustment_implementation_status=PENDING_APPROVAL_AND_IMPLEMENTATION`
- `project_owner_visual_review_status=CHANGES_REQUIRED`
- `formal_5173_code_review_status=APPROVED`
- `formal_acceptance_status=NOT_RUN`、`acceptance_not_run_count=103`
- `pending_user_review=YES`、`pending_user_confirmation_count=0`
- 下一入口：`CHATGPT_BASELINE_REVIEW_FROM_GIT_THEN_PROJECT_OWNER_APPROVAL`（ChatGPT 从远程 Git 对本草案基线独立复审，复审通过后由项目负责人决定是否批准；批准前不得开始实现）。
