# 源库快照状态 Feature — 查询按钮与表格布局稳定性调整基线草案 执行报告

- 任务编号：`DATA-SOURCE-SNAPSHOT-STATUS-QUERY-BUTTON-AND-TABLE-LAYOUT-STABILITY-BASELINE-001`
- 任务类型：**纯文档调整基线草案**（不实现、不验收、不批准、不做最终接受收口）
- 日期：2026-09-15
- 分支：`develop`
- 基准提交（任务开始前）：`94a84239ae9b617e783f5acf20274e838e11a105`
- 工作方式：独立隔离 worktree `/agent/dss-query-button-table-layout-baseline-001`（detached HEAD，位于上述基准提交），主工作区 `/agent/cdc-config-platform` 与既有 worktree 全程零触碰

---

## 1. 任务目标

把项目负责人已确认方向的两个界面调整冻结为可实现的文字设计，形成本 Feature 的调整基线草案：

1. “查询”与“重置”按钮固定 `62px` 宽，“立即刷新”保持既有 `110px`；
2. 在**真实主内容滚动容器**上、且**仅限本 Feature 路由**作用域内预留稳定纵向滚动条槽位，消除查询结果行数变化引起的表格弹性列与后续列水平位移。

本任务为纯文档产出，**未批准、未实现、未执行任何验收、未做最终接受收口**。

---

## 2. 真实根因（必须精确，不得错误归因）

**根因链**：

1. 查询结果**行数变化**（例如 30 条 → 1 条）使主内容滚动容器的内容高度跨越“出现/消失纵向滚动条”的阈值；
2. 纵向滚动条出现/消失使该容器可用宽度 `clientWidth` 发生变化；
3. Element Plus 表格按容器可用宽度重新分配**弹性列**（探针端、源库）宽度；
4. 探针端等弹性列轻微变化，其后源库/快照状态/时间列随之整体水平位移。

**关于汇总文字“共 N 条”**：汇总文字从“共 30 条”变为“共 1 条”**不是**该位移的直接根因；它至多经由页面高度/滚动条状态与现象间接相关。本草案明确**不得**把汇总文字写成直接根因，也**不得**以修改汇总文字作为修复手段。

---

## 3. 冻结的决定

### 3.1 按钮宽度（`DSS-REQ-090`）

| 按钮 | 冻结宽度 | 说明 |
|---|---|---|
| 查询 | `width = min-width = max-width = flex-basis = 62px` | 四属性同时约束，flex 分配与内容宽度均不能撑开或压缩它 |
| 重置 | `width = 62px`（固定宽度） | **仅**固定宽度；不新增 loading 态、不改变禁用逻辑、不改变点击语义 |
| 立即刷新 | `110px`（既有固定宽度，不变） | 沿用 `DSS-REQ-088`/`DSS-AC-108~113` 已验收口径 |

明确禁止：把查询/重置扩展到 `110px`；把三个按钮统一为同一宽度；只设 `width` 而放任 `min-width`/`max-width`/`flex-basis` 被内容或 flex 分配改写。按钮高度、动作组间距与既有 Loading 视觉稳定性实现（DOM 常驻指示器、标签居中、`aria-busy`、`aria-hidden`、`prefers-reduced-motion`）全部不变。

### 3.2 稳定滚动条槽位（`DSS-REQ-091`）

- 作用对象：本页**真实主内容滚动容器**（不是 Feature 页面根元素、不是结果卡片、不是表格外层框架）。
- 手段：标准 CSS `scrollbar-gutter: stable`（首选）。
- 作用域：**必须**限定本 Feature/本路由（`/monitor/data-source-state`）；**不得**全局应用、**不得**影响其它路由。

明确禁止：伪造滚动内容（空白行、占位块、`min-height`）；JS 宽度监听、`ResizeObserver` 宽度补偿、运行时表格宽度计算、按结果行数切换像素值/样式；全局 `overflow-y: scroll` 作为默认手段。

表格列策略保持既有弹性模型（固定列 + 探针端/源库弹性列），**不得**把所有列冻结为固定像素宽度。

### 3.3 几何判定与机器断言

以结果行数由多到少（滚动条由出现到消失）与由少到多（滚动条由消失到出现）双向全过程为验证场景，下列几何量 delta 必须**严格等于 `0`**（非舍入、非肉眼近似）：主内容滚动容器 `x`/`width`/`clientWidth`；Feature 页面根 `x`/`width`；结果卡片 `x`/`width`；表格外层框架 `x`/`width`；每个表头单元格 `x`/`width`；每个数据列起始 `x`；探针端/源库/快照状态/三个时间列表头中心点。

验证视口 `1280×800`、`1700×920`、`1920×1080`、`2560×1440`；正式支持最窄宽度 `1280px`。断言须为机器可执行几何断言，通过时子进程退出码为 `0`，并对注入 `0.001px` 的负向位移返回**非零**失败退出码（证明断言模块可失败）。

---

## 4. 计数与追踪

| 项目 | 值 |
|---|---|
| 新增需求 | `DSS-REQ-090`、`DSS-REQ-091` |
| 需求累计 | `DSS-REQ-001~091` 共 **91 条** |
| 新增验收 | `DSS-AC-114`、`DSS-AC-115`、`DSS-AC-116`、`DSS-AC-117`、`DSS-AC-118` |
| 验收累计 | `DSS-AC-001~118` 共 **118 条**，其中本轮 5 条全部 `NOT_RUN` |
| 需求 ↔ 验收映射 | `DSS-REQ-090` ↔ `DSS-AC-114`/`DSS-AC-117`；`DSS-REQ-091` ↔ `DSS-AC-115`/`DSS-AC-116`/`DSS-AC-117`/`DSS-AC-118` |
| 需求 → 设计落点 | `DESIGN.md` §14.2 覆盖 **91/91**，无悬空 |
| 验收 → 设计落点 | `DESIGN.md` §14.3 覆盖 **118/118**，无悬空 |
| 落点位置 | `REQUIREMENTS.md` §21.10、`ACCEPTANCE.md` §4.24、`DESIGN.md` §38、`UI.md` §32 |
| 既有范围 | `DSS-AC-001~113` 保持 `PASS 113 / FAIL 0 / BLOCKED 0 / NOT_RUN 0`，业务行与状态列逐字节不变 |

分层状态（本轮）：

```text
accepted_scope_acceptance_status=PASS_113
query_button_and_table_layout_stability_solution_direction_status=APPROVED_BY_PROJECT_OWNER
query_button_and_table_layout_stability_document_status=DRAFT_PENDING_CHATGPT_REVIEW_AND_PROJECT_OWNER_APPROVAL
query_button_and_table_layout_stability_implementation_status=PENDING_FORMAL_IMPLEMENTATION_ON_5173
query_button_and_table_layout_stability_code_review_status=NOT_RUN
query_button_and_table_layout_stability_acceptance_status=NOT_RUN
query_button_and_table_layout_stability_acceptance_not_run_count=5
pending_user_review=YES
pending_user_confirmation_count=0
next_entry=CHATGPT_QUERY_BUTTON_AND_TABLE_LAYOUT_STABILITY_BASELINE_REVIEW_FROM_GIT_THEN_PROJECT_OWNER_DOCUMENT_APPROVAL
```

本轮**不得**写成 `APPROVED`/`IMPLEMENTED`/`PASS`/`ACCEPTED`/`COMPLETED` 或最终收口。

---

## 5. 变更文件清单

| 文件 | 变更内容 |
|---|---|
| `docs/features/README.md` | Feature 索引：`data-source-snapshot-status` 行的下一入口更新为本轮当前直接值（原值降级为 2026-09-15 历史）、§下一步“唯一活跃入口”段落改以本轮草案为当前入口、新增 2026-09-15 变更记录行、清理陈旧当前直接值标记 |
| `docs/features/data-source-snapshot-status/README.md` | §1 新增本轮“文档分层状态”与“草案下一入口”行；需求/验收计数与 `pending_user_review` 更新为当前直接值；§10 下一入口更新；新增 2026-09-15 变更记录；历史值显式限定 |
| `docs/features/data-source-snapshot-status/REQUIREMENTS.md` | 新增 §21.10（`DSS-REQ-090~091`）与 §1/§24/§25 同步；需求累计 91 |
| `docs/features/data-source-snapshot-status/ACCEPTANCE.md` | 新增 §4.24（`DSS-AC-114~118`，全部 `NOT_RUN`）、§5 矩阵新增行与覆盖说明、§6/§7 同步；验收累计 118 |
| `docs/features/data-source-snapshot-status/DESIGN.md` | 新增 §38（含根因、冻结按钮/ gutter 设计、禁止方案、弹性列保持、几何与机器断言、待实现场景、不变契约）；§14.2 更新为 91/91、§14.3 更新为 118/118（仅追加行、既有映射行逐字节不变）；§1/变更记录同步 |
| `docs/features/data-source-snapshot-status/UI.md` | 新增 §32 界面规则章节；§1 新增本轮分层状态与下一入口行；历史值显式限定 |
| `docs/features/data-source-snapshot-status/API.md` | 仅同步 §1 分层状态/计数/下一入口与“不涉及接口契约变化”说明；业务契约与 §9 映射表逐字节不变 |
| `docs/features/data-source-snapshot-status/DATABASE.md` | 仅同步 §1 分层状态/计数/下一入口与“不涉及数据库契约变化”说明；数据库查询设计业务正文逐字节不变 |
| `docs/features/data-source-snapshot-status/reports/DATA-SOURCE-SNAPSHOT-STATUS-QUERY-BUTTON-AND-TABLE-LAYOUT-STABILITY-BASELINE-001.md` | 本报告（新增） |

---

## 6. 契约与边界

```text
api_contract_change_status=NONE
database_contract_change_status=NONE
database_access_status=NONE
database_write_status=NOT_REQUESTED
zookeeper_write_status=NOT_REQUESTED
feature_zookeeper_dependency=NONE
kafka_access_status=NONE
```

- 前端源码差异：`ZERO`；后端源码差异：`ZERO`；测试代码、SQL、配置、依赖与锁文件差异：`ZERO`。
- 未启动、停止或重启 `5173`、`5174`、`8080` 或任何其它服务；未执行浏览器验证、构建或测试，也未将其写成任何 `PASS`。
- 未修改既有 `DSS-REQ-001~089` 业务行、既有 `DSS-AC-001~113` 任何业务列或状态列、既有 DESIGN 追踪映射行、既有历史报告与既有证据。
- 本报告及本次文档变更不包含账号口令、令牌、Cookie、`Authorization` 头、完整连接串或私钥等凭据信息。

---

## 7. 校验结果

对本次文档变更执行了任务要求的 18 项提交前校验（详见任务机器可读结果块）：

- `git diff --check` 返回 `0`；
- 变更文件集合严格等于任务白名单 9 个路径，且任务提示词 Markdown 本身未被提交；
- 需求编号连续唯一共 91 条（`DSS-REQ-001~091`），无重复、无缺号；
- 验收编号连续唯一共 118 条（`DSS-AC-001~118`），无重复、无缺号；
- `DSS-AC-001~113` 仍全部 `PASS`（`PASS 113 / FAIL 0 / BLOCKED 0 / NOT_RUN 0`）且行内容逐字节不变；
- `DSS-AC-114~118` 全部 `NOT_RUN`；`FAIL=0`、`BLOCKED=0`；
- 既有 `DSS-REQ-001~089` 业务行与 `DSS-AC-001~113` 完整行逐字节不变；
- DESIGN 追踪更新为 `91/91` 与 `118/118`，无悬空；既有 DESIGN 映射行逐字节不变、仅追加；
- 既有已批准业务规则章节、API 业务契约与映射表、DATABASE 业务正文逐字节不变；
- `frontend/**`、`backend/**`、测试、SQL、配置、依赖、锁文件、证据与既有报告零差异；
- 当前直接值口径无陈旧下一入口、无 `NONE_FEATURE_ACCEPTED` 误用、无错误 `pending_user_review=NO`、无“本轮已完成”类冲突；被取代的历史值均已显式限定；
- Markdown lint 工具可用性：`documentation_validation_status=NOT_AVAILABLE`（未发现项目级 Markdown lint 工具，未伪造 `PASS`）。

---

## 8. 明确未执行项

- 未批准本草案文档（不得写成 `APPROVED`）；
- 未在 `5173` 实现本轮调整（不得写成 `IMPLEMENTED`）；
- 未执行 `DSS-AC-114~118`（全部 `NOT_RUN`，不得写成 `PASS`）；
- 未做 Feature 最终接受收口；
- 未修改既有 113 条 `PASS` 结论；
- 未启动、停止或重启任何服务；
- 未清理任何 worktree。

---

## 9. 下一入口

```text
CHATGPT_QUERY_BUTTON_AND_TABLE_LAYOUT_STABILITY_BASELINE_REVIEW_FROM_GIT_THEN_PROJECT_OWNER_DOCUMENT_APPROVAL
```

即：先由 ChatGPT 从远程 Git 独立复审本草案文档，再由项目负责人决定是否批准本草案文档。
