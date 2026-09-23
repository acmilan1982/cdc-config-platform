# 探针端管理 Feature（client-config）导航与状态

## 1. Feature 身份

| 项目 | 值 |
|---|---|
| 用户可见名称 | 探针端管理（页面标题、菜单、面包屑已统一为“探针端管理”；路由 `meta.title`、`menu.ts` 与页面标题均为该名称，更名已实施） |
| Feature 内部标识 | `client-config`（内部目录标识不变） |
| 既有路由 | `/config/client`（保持不变） |
| 既有实现事实 | `IMPLEMENTED_PENDING_USER_ACCEPTANCE`（既有页面与后端 CRUD 已实现并通过自动化与真实页面复验，**尚待项目负责人验收**；来源见 `reports/CLIENT-CONFIG-LIST-UI-ADJUSTMENT-001-R2.md`、`reports/CLIENT-CONFIG-USER-ACCEPTANCE-PREPARATION-001-R1.md`；本节此前“占位实现、实现未开始”表述已随本节更新纠正，历史章节不改写） |
| 实现状态 | 分层口径：`existing_feature_implementation_status=IMPLEMENTED_PENDING_USER_ACCEPTANCE`（既有 Feature 实现已完成、尚待项目负责人验收）；`adjustment_implementation_status=NOT_STARTED`（**仅指**本轮页面级调整实现尚未开始，**不**代表既有实现状态） |
| 正式验收执行 | `formal_acceptance_execution_status=NOT_RUN`（全部 89 条验收用例未执行，含既有 76 条与本轮新增 13 条） |
| 本轮调整任务编号 | `CLIENT-CONFIG-QUERY-LIST-AND-LIST-TABLE-ADJUSTMENT-BASELINE-001`（R1 修订：`-001-R1`；R2 证据纠错：`-001-R2`；R3 最小纠错：`-001-R3`；批准收口：`CLIENT-CONFIG-QUERY-LIST-AND-LIST-TABLE-ADJUSTMENT-BASELINE-APPROVAL-CLOSEOUT-001`） |
| 本轮调整基线状态 | `adjustment_baseline_status=APPROVED`（经 ChatGPT 远程 R3 复审 `APPROVED` 后由项目负责人于 2026-09-22 批准；批准前为 `DRAFT_PENDING_USER_REVIEW`） |
| 本轮调整批准状态 | `adjustment_approval_status=APPROVED_BY_PROJECT_OWNER`；`adjustment_approval_date=2026-09-22`；`adjustment_approved_reviewed_commit=5066c761f8a9400d5841222cb73b0c03f56a82d0` |
| 本轮调整实现状态 | `adjustment_implementation_status=NOT_STARTED`（**仅指**批准后的页面级调整尚未实施；批准基线**不**等于已实现） |
| 本轮正式验收执行状态 | `formal_acceptance_execution_status=NOT_RUN`（新增 `CCFG-AC-077~089` 亦全部 `NOT_RUN`） |

### 1.1 本轮页面级调整分层状态（2026-09-22，R1 修订；同日批准收口后更新为 `APPROVED`）

本轮任务 `CLIENT-CONFIG-QUERY-LIST-AND-LIST-TABLE-ADJUSTMENT-BASELINE-001`（R1：`-001-R1`，纯文档）按项目负责人已明确确认的 9 项页面调整决定、以及 R1 新增的两项冻结决定（行选中能力整体取消、历史异常 `FG_ACTIVE` 红色 `异常：{原始值}`），为 `/config/client` 单页建立页面级调整基线。该基线经 R2 证据纠错、R3 最小纠错后，已由 ChatGPT 从远程 Git 复审（R3 结论 `APPROVED`）并由项目负责人于 2026-09-22 批准收口。当前分层状态如下：

```text
existing_feature_implementation_status=IMPLEMENTED_PENDING_USER_ACCEPTANCE
adjustment_baseline_status=APPROVED
adjustment_approval_status=APPROVED_BY_PROJECT_OWNER
adjustment_approval_date=2026-09-22
adjustment_approved_reviewed_commit=5066c761f8a9400d5841222cb73b0c03f56a82d0
adjustment_implementation_status=NOT_STARTED
formal_acceptance_execution_status=NOT_RUN
PENDING_USER_CONFIRMATION=0
next_entry=CHATGPT_REMOTE_BASELINE_APPROVAL_CLOSEOUT_R2_REVIEW
```

- **历史状态与当前状态必须区分（不得删除或伪装 R0/R1/R2/R3 记录）**：本轮新增/修订条款在批准前曾为 `DRAFT_PENDING_USER_REVIEW`；R1 阶段 ChatGPT 对 R0 的复审结论为 `CHANGES_REQUIRED`、R2 阶段对 R1 为 `CHANGES_REQUIRED`、R3 阶段对 R2 为 `CHANGES_REQUIRED`，R3 结果随后获 ChatGPT `APPROVED` 并由项目负责人批准。当前 `adjustment_baseline_status=APPROVED` 只表示**页面调整基线**获批，**不**表示页面已实现、已目测、已测试或验收已通过。
- **不得抹除旧实现事实**：本 Feature 的既有实际实现状态为 `IMPLEMENTED_PENDING_USER_ACCEPTANCE`（既有实现已完成、尚待项目负责人验收），该事实保持原样、**不**因本轮页面调整改写；只有**本轮页面级调整实现**为 `NOT_STARTED`。
- **验收分层**：全部 89 条（既有 76 条 `CCFG-AC-001~076` + 本轮新增 13 条 `CCFG-AC-077~089`）**全部 `NOT_RUN`**。不得把本轮调整基线批准写成“已实现”“已测试”或“验收通过”。
- **页面级授权 ≠ 模板级全局授权（2026-09-22 批准收口后口径）**：项目负责人**已授予** `/config/client` 的**页面级选择性接入授权**（查询列表页模板侧采用页面壳/查询面板/操作区/结果面板四组件、**不**接入刷新工具栏；列表表格视觉模板侧仅覆盖本页**主列表**，不含新增/编辑弹窗与弹窗内控件）。本次批准收口**不新增、不扩大**该授权范围；该页面级授权与本次页面调整基线批准**均不等于**本轮实现已授权或已完成。两套公共模板的**模板级全局迁移状态**（`page_migration_status=NOT_STARTED`、`page_migration_authorization_status=NOT_GRANTED`、`pilot_page_selection_status=NOT_DECIDED`）**保持不变**，**其他页面未被授权**。
- **待确认项清零**：`PENDING_USER_CONFIRMATION=0`；行单选/选中行高亮/“已选择：{探针ID}”取消与异常 `FG_ACTIVE` 红色 `异常：{原始值}` 均为项目负责人本轮已冻结决定，不再作为待确认项、风险项或实现自由度。

### 1.2 本轮页面级调整基线批准收口（2026-09-22，纯文档）

| 项目 | 值 |
|---|---|
| 批准任务编号 | `CLIENT-CONFIG-QUERY-LIST-AND-LIST-TABLE-ADJUSTMENT-BASELINE-APPROVAL-CLOSEOUT-001` |
| 证据链 | R0 草案提交 `fba09d17a471f7a4d1c7e56c07cfe9e6d1420dd1` → R1 修订提交 `2c2b2a71fcd049a68f86339d225f659af69e81c3` → R2 证据纠错提交 `5e0731aef0e36c1be9b87eba660e9b8c4a052555` → R3 最小纠错提交 `5066c761f8a9400d5841222cb73b0c03f56a82d0` |
| ChatGPT 复审对象 / 结论 | 远程提交 `5066c761f8a9400d5841222cb73b0c03f56a82d0`；结论 `APPROVED` |
| 项目负责人批准 | 于 2026-09-22 明确回复原话：`批准本轮探针端管理页面调整基线` |
| 批准对象 | `CCFG-REQ-091~103` 及本轮对既有需求的定向修订；`CCFG-AC-077~089` 及本轮对既有验收的定向修订；`CCFG-DESIGN-038~046` 及相关定向修订；`CCFG-UI-027~035` 及相关定向修订；R1 冻结的两项项目负责人决定（取消行单选/选中高亮/“已选择：{探针ID}”；异常 `FG_ACTIVE` 红色 `异常：{原始值}`，异常行“更多”仅含“停用”和“删除”）。**仅限** `/config/client` 单页，**不**扩大到 API、数据库契约、其他页面或模板级全局迁移 |
| 状态变化 | 仅 `adjustment_baseline_status` 由 `DRAFT_PENDING_USER_REVIEW` 变为 `APPROVED`（并记录 `adjustment_approval_status=APPROVED_BY_PROJECT_OWNER`） |
| 保持不变的计数与状态 | 需求/验收/设计/UI 定义 103/89/46/35；89 条验收全部 `NOT_RUN`；覆盖 103/103；`PENDING_USER_CONFIRMATION=0`；`adjustment_implementation_status=NOT_STARTED`；`formal_acceptance_execution_status=NOT_RUN` |
| 下一入口 | 2026-09-22 批准收口时的**历史入口**：`CHATGPT_REMOTE_BASELINE_APPROVAL_CLOSEOUT_REVIEW`（该远程复审已完成并返回 `CHANGES_REQUIRED`，由 R1/R2 纠错任务承接）；**当前下一入口**为 `CHATGPT_REMOTE_BASELINE_APPROVAL_CLOSEOUT_R2_REVIEW`（只有该复审通过后，才进入独立页面调整实现任务） |

## 2. 文档导航

| 文档 | 职责 | 状态 |
|---|---|---|
| `README.md`（本文件） | Feature 定位、文档导航与状态 | 已随 Feature 基线状态更新（2026-09-03）；R1 定向修订同步（2026-09-04）；并发口径调整草案同步（2026-09-04）；并发口径调整 R1 定向修订同步（2026-09-04）；并发口径调整批准收口同步（2026-09-04）；设计并发口径调整同步（2026-09-04）；设计并发口径调整批准收口同步（2026-09-04）；页面级调整草案同步（2026-09-22）；页面级调整草案 R1 偏差修正同步（2026-09-22）；页面级调整基线批准收口同步（2026-09-22） |
| `REQUIREMENTS.md` | 需求基线（`CCFG-REQ-001~090` 已批准；本轮新增 `CCFG-REQ-091~103` 已随本轮页面调整基线于 2026-09-22 批准） | `APPROVED`（2026-09-03 曾 `APPROVED`，因并发口径调整于 2026-09-04 转为待复审草案：取消旧需求的并发“最多一个成功”强承诺（`LOCK TABLE ... WAIT 5` 是后续未批准设计草案的方案，本轮已过时），改为尽力写前检查 + 已接受并发边界；首版调整结果经 ChatGPT 正式复审 `CHANGES_REQUIRED`（R1-01~R1-04），R1 定向修订完成后，ChatGPT 对 R1 结果提交 `f2a4d7d...` 正式复审 `APPROVED`，项目负责人于 2026-09-04 明确回复“批准”，经并发口径调整批准收口重新收口为 `APPROVED`；批准的是需求基线，不代表功能已实现或验收已通过；调整前批准历史见 §1.1，本轮批准信息见 §1.2）——**本轮页面级调整基线（2026-09-22，已批准）**：新增 §1.3 分层状态块与 §7.10（`CCFG-REQ-091~103`，13 条），定向修订 `CCFG-REQ-011/020/021/022/023/025/028/029/034/042`；新增部分与修订部分已随本轮页面调整基线于 2026-09-22 批准（批准前为 `DRAFT_PENDING_USER_REVIEW`），实现仍为 `NOT_STARTED`、验收仍为 `NOT_RUN`；`CCFG-REQ-001~090` 主体历史批准链保留不改写 |
| `ACCEPTANCE.md` | 验收标准（`CCFG-AC-001~089`，全部 `NOT_RUN`） | `APPROVED`（2026-09-03 曾 `APPROVED`，因并发口径调整于 2026-09-04 转为待复审草案，首版调整结果经 ChatGPT 正式复审 `CHANGES_REQUIRED`、R1 定向修订完成后，ChatGPT 对 R1 结果提交 `f2a4d7d...` 正式复审 `APPROVED`、项目负责人于 2026-09-04 明确回复“批准”，经并发口径调整批准收口重新收口为 `APPROVED`；批准的是验收标准，不是验收执行结果；76 条用例仍全部 `NOT_RUN`）——**本轮页面级调整基线（2026-09-22，已批准）**：新增 §1.3 分层状态块与 `CCFG-AC-077~089`（13 条），R0 定向修订 `CCFG-AC-002/009/016/017/018/019/021/022/023/025/026/032`，**R1 修正后的本轮修订用例清单为** `CCFG-AC-002/009/016/017/018/019/020/021/022/023/025/026/032/082/087/088/089`（17 条，含 R0 漏记的 `016`/`023` 与 R1 追加项，见 `ACCEPTANCE.md` §1.4）；验收由 76 条增至 **89 条**，需求→验收覆盖 **103/103（100%）**，**89 条执行状态全部为 `NOT_RUN`** |
| `DESIGN.md` | 逻辑设计（`CCFG-DESIGN-001~037` 已批准；本轮新增 `CCFG-DESIGN-038~046` 已随本轮页面调整基线于 2026-09-22 批准，含并发/锁方案、追踪矩阵） | `APPROVED`（2026-09-03 设计草案；初版正式设计复审结论 `CHANGES_REQUIRED`，2026-09-04 R1 已定向修订；同日设计并发口径定向调整任务 `CLIENT-CONFIG-DESIGN-CONCURRENCY-ADJUSTMENT-001` 按已重新批准的需求并发口径完成设计调整（移除该过时表锁方案）；调整结果经 ChatGPT 对提交 `ba7c5e9...` 正式复审（`CHATGPT_FORMAL_DESIGN_CONCURRENCY_ADJUSTMENT_REVIEW`）结论 `APPROVED`，项目负责人于 2026-09-04 明确回复“批准”，经批准收口任务 `CLIENT-CONFIG-DESIGN-CONCURRENCY-ADJUSTMENT-APPROVAL-001` 收口为 `APPROVED`、`PENDING_USER_CONFIRMATION=0`，可用于后续实现；批准的是设计基线，不代表代码已实现、已测试或验收已执行通过）——**本轮页面级调整基线（2026-09-22，已批准）**：新增 §13 与 `CCFG-DESIGN-038~046`（9 条），§12 追踪矩阵更新为 103/103 与 89/89；新增部分已随本轮页面调整基线于 2026-09-22 批准（批准前为 `DRAFT_PENDING_USER_REVIEW`），实现仍为 `NOT_STARTED`；`CCFG-DESIGN-001~037` 业务定义原文保留不改写，仅 `CCFG-DESIGN-021` 追加一条“入口位置由 §13 取代”的定向修订标注（语义不变） |
| `API.md` | 接口契约（`CCFG-API-001~020`，接口 E1~E7、错误码表） | `APPROVED`（2026-09-03 设计草案；初版正式设计复审结论 `CHANGES_REQUIRED`，2026-09-04 R1 已定向修订；同日设计并发口径定向调整任务 `CLIENT-CONFIG-DESIGN-CONCURRENCY-ADJUSTMENT-001` 按已重新批准的需求并发口径完成设计调整（移除该过时错误码方案）；调整结果经 ChatGPT 对提交 `ba7c5e9...` 正式复审（`CHATGPT_FORMAL_DESIGN_CONCURRENCY_ADJUSTMENT_REVIEW`）结论 `APPROVED`，项目负责人于 2026-09-04 明确回复“批准”，经批准收口任务 `CLIENT-CONFIG-DESIGN-CONCURRENCY-ADJUSTMENT-APPROVAL-001` 收口为 `APPROVED`、`PENDING_USER_CONFIRMATION=0`，可用于后续实现；批准的是设计基线，不代表代码已实现、已测试或验收已执行通过，实现状态仍 `NOT_STARTED`） |
| `UI.md` | 界面设计（`CCFG-UI-001~026` 已批准；本轮新增 `CCFG-UI-027~035` 已随本轮页面调整基线于 2026-09-22 批准，布局/交互/文案） | `APPROVED`（2026-09-03 设计草案；初版正式设计复审结论 `CHANGES_REQUIRED`，2026-09-04 R1 已定向修订；同日设计并发口径定向调整任务 `CLIENT-CONFIG-DESIGN-CONCURRENCY-ADJUSTMENT-001` 按已重新批准的需求并发口径完成设计调整（移除该过时文案方案）；调整结果经 ChatGPT 对提交 `ba7c5e9...` 正式复审（`CHATGPT_FORMAL_DESIGN_CONCURRENCY_ADJUSTMENT_REVIEW`）结论 `APPROVED`，项目负责人于 2026-09-04 明确回复“批准”，经批准收口任务 `CLIENT-CONFIG-DESIGN-CONCURRENCY-ADJUSTMENT-APPROVAL-001` 收口为 `APPROVED`、`PENDING_USER_CONFIRMATION=0`，可用于后续实现；批准的是设计基线，不代表代码已实现、已测试或验收已执行通过）——**本轮页面级调整基线（2026-09-22，已批准）**：新增 §15 与 `CCFG-UI-027~035`（9 条），`CCFG-UI-004/005/006/018/022/024` 部分口径被取代或收窄（原文保留不改写）；**R1（2026-09-22）**：冻结项目负责人两项决定——取消“删除所选”后**行单选/选中行高亮/“已选择：{探针ID}”整体取消**、历史异常 `FG_ACTIVE` 展示为**紧跟探针 ID 的红色 `异常：{原始值}`**（`CCFG-UI-031/035`），并定向清理 `CCFG-UI-004/005/006/032` 的旧行选中表述；新增部分已随本轮页面调整基线于 2026-09-22 批准（批准前为 `DRAFT_PENDING_USER_REVIEW`），实现仍为 `NOT_STARTED`，本轮 `PENDING_USER_CONFIRMATION=0` |
| `DATABASE.md` | 数据库使用设计（`CCFG-DB-001~022`，SQL 形态/事务锁矩阵） | `APPROVED`（2026-09-03 设计草案；初版正式设计复审结论 `CHANGES_REQUIRED`，2026-09-04 R1 已定向修订；同日设计并发口径定向调整任务 `CLIENT-CONFIG-DESIGN-CONCURRENCY-ADJUSTMENT-001` 按已重新批准的需求并发口径完成设计调整（移除该过时事务锁方案）；调整结果经 ChatGPT 对提交 `ba7c5e9...` 正式复审（`CHATGPT_FORMAL_DESIGN_CONCURRENCY_ADJUSTMENT_REVIEW`）结论 `APPROVED`，项目负责人于 2026-09-04 明确回复“批准”，经批准收口任务 `CLIENT-CONFIG-DESIGN-CONCURRENCY-ADJUSTMENT-APPROVAL-001` 收口为 `APPROVED`、`PENDING_USER_CONFIRMATION=0`，可用于后续实现；批准的是设计基线，不代表代码已实现、已测试或验收已执行通过，实现状态仍 `NOT_STARTED`，76 条验收仍全部 `NOT_RUN`） |
| `reports/CLIENT-CONFIG-REQUIREMENTS-BASELINE-001.md` | 需求与验收草案建立执行报告 | 已建立 |
| `reports/CLIENT-CONFIG-REQUIREMENTS-BASELINE-001-R1.md` | R1 定向修订执行报告 | 已建立 |
| `reports/CLIENT-CONFIG-REQUIREMENTS-BASELINE-APPROVAL-001.md` | 需求与验收基线批准收口执行报告 | 已建立 |
| `reports/CLIENT-CONFIG-DESIGN-BASELINE-001.md` | 设计基线草案建立执行报告 | 已建立 |
| `reports/CLIENT-CONFIG-DESIGN-BASELINE-001-R1.md` | 设计基线 R1 定向修订（正式复审 `CHANGES_REQUIRED`）执行报告 | 已建立（2026-09-04） |
| `reports/CLIENT-CONFIG-CONCURRENCY-REQUIREMENTS-ADJUSTMENT-001.md` | 并发口径定向调整草案（纯文档）执行报告 | 已建立（2026-09-04） |
| `reports/CLIENT-CONFIG-CONCURRENCY-REQUIREMENTS-ADJUSTMENT-001-R1.md` | 并发口径调整 R1 定向修订（正式复审 `CHANGES_REQUIRED`）执行报告 | 已建立（2026-09-04） |
| `reports/CLIENT-CONFIG-CONCURRENCY-REQUIREMENTS-ADJUSTMENT-APPROVAL-001.md` | 并发口径调整批准收口执行报告 | 已建立（2026-09-04） |
| `reports/CLIENT-CONFIG-DESIGN-CONCURRENCY-ADJUSTMENT-001.md` | 设计并发口径调整（正式需求并发口径重新批准驱动）执行报告 | 已建立（2026-09-04） |
| `reports/CLIENT-CONFIG-DESIGN-CONCURRENCY-ADJUSTMENT-APPROVAL-001.md` | 设计并发口径调整批准收口执行报告 | 已建立（2026-09-04） |
| `reports/CLIENT-CONFIG-QUERY-LIST-AND-LIST-TABLE-ADJUSTMENT-BASELINE-001.md` | 页面级查询列表页模板 + 列表表格视觉模板选择性接入调整基线草案执行报告 | 已建立（2026-09-22） |
| `reports/CLIENT-CONFIG-QUERY-LIST-AND-LIST-TABLE-ADJUSTMENT-BASELINE-001-R1.md` | 页面级调整基线草案 R1 偏差修正（ChatGPT 对 R0 复审 `CHANGES_REQUIRED` 驱动，含项目负责人两项冻结决定）执行报告 | 已建立（2026-09-22） |
| `reports/CLIENT-CONFIG-QUERY-LIST-AND-LIST-TABLE-ADJUSTMENT-BASELINE-001-R2.md` | R1 报告证据纠错（ChatGPT 对 R1 复审 `CHANGES_REQUIRED` 驱动的追加式证据纠错）执行报告 | 已建立（2026-09-22） |
| `reports/CLIENT-CONFIG-QUERY-LIST-AND-LIST-TABLE-ADJUSTMENT-BASELINE-001-R3.md` | R2 报告摘要最小证据纠错（ChatGPT 对 R2 复审 `CHANGES_REQUIRED` 驱动）执行报告 | 已建立（2026-09-22） |
| `reports/CLIENT-CONFIG-QUERY-LIST-AND-LIST-TABLE-ADJUSTMENT-BASELINE-APPROVAL-CLOSEOUT-001.md` | 页面级调整基线批准收口（项目负责人批准驱动，`APPROVED`）执行报告 | 已建立（2026-09-22） |

## 3. Feature 定位

“探针端管理”用于维护 Oracle 表 `CDC_CLIENT_MULTIPLE` 的探针配置（探针 ID、探针描述、采集数据源、启停状态）。`sync-client` 进程用自身 `client_id` 命中 `CLIENT_ID` 相同且 `FG_ACTIVE=1` 的记录并读取其采集数据源。本 Feature 只维护数据库配置，不直接启停、通知进程，不操作 ZooKeeper、Kafka 或 Topic。

## 4. 当前状态

- 旧口径批准历史：需求基线 `REQUIREMENTS.md`（`CCFG-REQ-001~090`，90 条）与验收标准 `ACCEPTANCE.md`（`CCFG-AC-001~076`，76 条）曾于 2026-09-03 获项目负责人正式批准（ChatGPT 对 R1 结果正式复审结论 `APPROVED`，项目负责人明确回复“批准”），旧口径状态为 `APPROVED`。该次批准只覆盖旧口径的并发强保证目标（并发“最多一个成功”强承诺；当时需求只要求后续设计确定事务/锁/原子方案，未批准任何具体表锁语句，`LOCK TABLE ... WAIT 5` 是随后形成、始终未获项目负责人批准的设计草案方案），不代表功能已实现或验收已通过；后续因并发口径调整进入本轮待复审草案状态，经 ChatGPT 对 R1 结果正式复审 `APPROVED` 与项目负责人 2026-09-04 批准后重新收口为 `APPROVED`（见下条）；旧批准不自动批准本轮调整。
- 并发口径调整草案（2026-09-04，`CLIENT-CONFIG-CONCURRENCY-REQUIREMENTS-ADJUSTMENT-001`，纯文档）：按项目负责人明确决定，配置平台不再为保证数据源唯一分配执行 Oracle 显式表锁，取消并发“最多一个成功”强承诺，改为“新增/编辑/启用写入前重新读取 + 尽力写前检查 + 已接受极端并发下两笔先后都成功的边界”；运行侧 `sync-client`/`sync-server` 使用配置时的重复检查为最终防线但不属本 Feature 范围。受影响需求 `CCFG-REQ-038/068/071/072/074/077`、验收 `CCFG-AC-030/056/058/059/061/064`；`REQUIREMENTS.md` 与 `ACCEPTANCE.md` 状态由旧口径 `APPROVED` 调整为 `DRAFT_PENDING_USER_REVIEW`。ChatGPT 对首版调整结果（提交 `6071d7a...`）正式复审结论为 `CHANGES_REQUIRED`（R1-01~R1-04）；R1 定向修订（`CLIENT-CONFIG-CONCURRENCY-REQUIREMENTS-ADJUSTMENT-001-R1`，2026-09-04，对应报告见 §2 导航）已完成；ChatGPT 对 R1 结果提交 `f2a4d7d...` 正式复审结论为 `APPROVED`（`CHATGPT_FORMAL_REQUIREMENTS_ADJUSTMENT_R1_REVIEW`），项目负责人于 2026-09-04 明确回复“批准”，`REQUIREMENTS.md` 与 `ACCEPTANCE.md` 经批准收口任务 `CLIENT-CONFIG-CONCURRENCY-REQUIREMENTS-ADJUSTMENT-APPROVAL-001` 重新收口为 `APPROVED`（对应报告见 §2 导航）；2026-09-03 批准保留为历史，不自动批准本轮调整（本轮依据独立复审与项目负责人明确回复）。
- **【历史记录 · 已被后续实现与收口取代，不代表当前状态】** 设计基线阶段曾记录“实现状态仍为 `NOT_STARTED`：尚未实现任何页面、接口或写库能力；页面/菜单仍为占位，用户可见名称仍为‘客户端配置’”。该表述属**历史事实**（对应设计草案阶段），已由后续实现事实取代：当前 `existing_feature_implementation_status=IMPLEMENTED_PENDING_USER_ACCEPTANCE`，且页面标题、菜单与面包屑已统一为“探针端管理”（见 §1）；仅**本轮页面级调整实现**为 `adjustment_implementation_status=NOT_STARTED`。
- 正式验收执行状态仍为 `formal_acceptance_execution_status=NOT_RUN`：全部 89 条验收用例（既有 76 条 + 本轮新增 13 条）均未执行，不得把已批准需求/验收标准中的目标规则描述为当前已实施事实，不得写成“验收通过”。
- `DESIGN.md`/`API.md`/`UI.md`/`DATABASE.md` 已于 2026-09-03 建立设计基线草案（`CLIENT-CONFIG-DESIGN-BASELINE-001`），状态均为 `DRAFT_PENDING_USER_REVIEW`、`PENDING_USER_CONFIRMATION=0`；当时本 Feature 尚未进入实现阶段，四份文档为草案、其中表锁/锁等待方案从未获项目负责人批准（不得写成原表锁设计曾获批准）；不因建立设计草案而改变已批准需求/验收，也不修改任何数据库基线。因本轮需求并发口径调整（2026-09-04）重新批准后，设计并发口径定向调整任务 `CLIENT-CONFIG-DESIGN-CONCURRENCY-ADJUSTMENT-001`（2026-09-04，纯文档）已从四份设计文档中移除已过时的 `LOCK TABLE ... WAIT 5` 表锁/锁等待错误码（`ORA-30006→50050`）方案并按已重新批准口径调整设计，四份文档整体标记由 `STALE_LOCK_DESIGN_PENDING_DESIGN_REVISION` 更新为 `DESIGN_CONCURRENCY_ADJUSTED_PENDING_FORMAL_REVIEW`（当时仍为 `DRAFT_PENDING_USER_REVIEW`、`PENDING_USER_CONFIRMATION=0`）。该调整结果随后经 ChatGPT 对提交 `ba7c5e9...` 正式复审 `APPROVED`、项目负责人于 2026-09-04 明确回复“批准”，四份设计文档经批准收口任务 `CLIENT-CONFIG-DESIGN-CONCURRENCY-ADJUSTMENT-APPROVAL-001` 收口为 `APPROVED`（见下两条）。
- ChatGPT 对初版设计草案提交 `21f4729c43d146426e8d4f1b2d6b667cfcf160ff` 的正式设计复审结论为 `CHANGES_REQUIRED`（R1-01~R1-09）。`CLIENT-CONFIG-DESIGN-BASELINE-001-R1`（2026-09-04，纯文档）已完成定向修订：API 设计编号重排为 `CCFG-API-001~020` 连续唯一；四文档编号范围同步为 `CCFG-DESIGN-001~037`/`CCFG-API-001~020`/`CCFG-UI-001~026`/`CCFG-DB-001~022`；数据源数组固定“原存储顺序返回 + 前端非持久化前三项投影”单一契约；`CLIENT_DESC` 固定原文保存、Trim 仅判空、按原文计 UTF-8 字节；关键词 LIKE 增加 `\` 字面量转义与 `ESCAPE '\'`；删除未批准的数据源 ID“其他非法字符”限制；补齐 `CATEGORY_MISMATCH`/`TYPE_MISMATCH`、含逗号歧义（`COMMA_PROTOCOL_AMBIGUOUS`）与历史 NULL/空白 `CLIENT_DESC` 契约。修订后四文档状态保持 `DRAFT_PENDING_USER_REVIEW`、`PENDING_USER_CONFIRMATION=0`；受本轮需求并发口径调整影响，正式 R1 设计复审延后；需求调整 R1 结果已获 ChatGPT 正式复审 `APPROVED` 并由项目负责人于 2026-09-04 批准。设计并发口径定向调整任务 `CLIENT-CONFIG-DESIGN-CONCURRENCY-ADJUSTMENT-001`（2026-09-04，纯文档）已从四份设计文档中移除过时的表锁/锁等待错误码方案并按已批准并发口径调整设计（标记 `DESIGN_CONCURRENCY_ADJUSTED_PENDING_FORMAL_REVIEW`，当时仍为 `DRAFT_PENDING_USER_REVIEW`、`PENDING_USER_CONFIRMATION=0`）。对设计并发口径调整结果的正式设计复审（`CHATGPT_FORMAL_DESIGN_CONCURRENCY_ADJUSTMENT_REVIEW`）已于 2026-09-04 完成、结论 `APPROVED`，项目负责人同日明确回复“批准”，四份设计文档经批准收口任务 `CLIENT-CONFIG-DESIGN-CONCURRENCY-ADJUSTMENT-APPROVAL-001` 收口为 `APPROVED`、`PENDING_USER_CONFIRMATION=0`（当前状态见下条）。
- 设计批准收口（2026-09-04，`CLIENT-CONFIG-DESIGN-CONCURRENCY-ADJUSTMENT-APPROVAL-001`，纯文档，对应报告见 §2 导航）：对设计并发口径调整结果的正式设计复审（`CHATGPT_FORMAL_DESIGN_CONCURRENCY_ADJUSTMENT_REVIEW`）对象为提交 `ba7c5e917b1b9d08208c3e1ceb31285407f5fd5e`、结论 `APPROVED`，项目负责人于 2026-09-04 明确回复“批准”；`DESIGN.md`/`API.md`/`UI.md`/`DATABASE.md` 四份设计文档状态已由 `DRAFT_PENDING_USER_REVIEW` 收口为 `APPROVED`、`PENDING_USER_CONFIRMATION=0`，整体标记由 `DESIGN_CONCURRENCY_ADJUSTED_PENDING_FORMAL_REVIEW` 收口为 `APPROVED_READY_FOR_IMPLEMENTATION`，可用于后续实现；37/20/26/22 条设计业务定义相对批准提交逐字零差异，覆盖保持需求 90/90、验收 76/76。批准的是设计基线，不代表代码已实现、已测试或验收已执行通过：实现状态仍为 `NOT_STARTED`，页面/菜单仍为占位、用户可见名称仍为“客户端配置”，76 条验收仍全部 `NOT_RUN`。下一入口为 `CLIENT_CONFIG_IMPLEMENTATION`（见 §5）。
- 基线影响项（如旧资料“客户端配置”“管理平台对 `CDC_CLIENT_MULTIPLE` 只读”“编辑时探针 ID 不可改”等表述、`CLIENT_DESC` 长度 256 与 1024 的数据库基线差异）已在 `REQUIREMENTS.md` §9 记录；其中 `CLIENT_DESC` 真实语义已确认为 `VARCHAR2(1024 BYTE)`，256 与 1024 的已批准数据库基线差异继续作为后续独立数据库基线同步事项保留。
- **【历史记录 · 草案建立阶段，已被 2026-09-22 批准收口取代，不代表当前状态】** 页面级调整草案（2026-09-22，`CLIENT-CONFIG-QUERY-LIST-AND-LIST-TABLE-ADJUSTMENT-BASELINE-001`，纯文档，对应报告见 §2 导航）：按项目负责人已明确确认的 9 项页面调整决定，为 `/config/client` 单页建立“查询列表页模板选择性接入（页面层）”与“列表表格视觉模板接入（主列表）”的调整基线草案。**可见结果**：列顺序改为 序号｜探针 ID｜探针描述｜采集数据源｜数据源数量｜操作（最右固定列）；“新增探针”移到结果区头部最右侧；取消“删除所选”与“状态”列及其行内启停；删除/启停入口改为“操作”列“更多”下拉（`FG_ACTIVE='1'` → 删除/停用；`'0'` → 删除/启用；历史异常 → 仅删除/停用）；探针 ID 后按 `FG_ACTIVE` 三态显示（`'1'` 无标记、`'0'` “停用”标记、其余历史异常红色 `异常：{原始值}`）；本页不提供任何刷新能力。**分层状态（草案阶段）**：该阶段为 `adjustment_baseline_status=DRAFT_PENDING_USER_REVIEW`、`adjustment_implementation_status=NOT_STARTED`、本轮正式验收 `NOT_RUN`；该草案后经 R2/R3 证据纠错并由项目负责人批准收口为 `APPROVED`（见 §1.1、§1.2）。**旧实现事实不被改写**：`existing_feature_implementation_status=IMPLEMENTED_PENDING_USER_ACCEPTANCE` 保留；全部 89 条验收仍 `NOT_RUN`。**本轮不改** `API.md`/`DATABASE.md`（接口与数据库契约不变）、**不改**任何业务代码或测试。**授权分层**：项目负责人**已授予** `/config/client` 的页面级选择性接入授权（查询列表页模板侧四组件、不接入刷新工具栏；列表表格视觉模板侧仅主列表），**该页面级授权与本次基线批准均不代表本轮实现已完成或已验收**；两套模板的**模板级全局状态保持不变**，**其他页面未被授权**。`PENDING_USER_CONFIRMATION=0`：R1 已冻结行选中能力整体取消与异常 `FG_ACTIVE` 红色 `异常：{原始值}` 两项决定（见 §1.1 与 `UI.md` §15）。
- 页面级调整基线批准收口（2026-09-22，`CLIENT-CONFIG-QUERY-LIST-AND-LIST-TABLE-ADJUSTMENT-BASELINE-APPROVAL-CLOSEOUT-001`，纯文档，对应报告见 §2 导航）：ChatGPT 从远程 Git 对 R3 结果提交 `5066c761f8a9400d5841222cb73b0c03f56a82d0` 的复审结论为 `APPROVED`，项目负责人于 2026-09-22 明确回复原话 `批准本轮探针端管理页面调整基线`，本轮页面级调整基线由 `DRAFT_PENDING_USER_REVIEW` 收口为 `APPROVED`（`adjustment_approval_status=APPROVED_BY_PROJECT_OWNER`）。**批准的是页面调整基线，不是代码、测试、目测结果或最终接受**：`existing_feature_implementation_status=IMPLEMENTED_PENDING_USER_ACCEPTANCE` 保持，`adjustment_implementation_status=NOT_STARTED` 保持，89 条验收全部 `NOT_RUN` 保持，覆盖 103/103、`PENDING_USER_CONFIRMATION=0` 保持；`API.md`/`DATABASE.md` 未修改，两套模板的模板级全局状态保持不变。


## 5. 下一入口

设计并发口径调整任务 `CLIENT-CONFIG-DESIGN-CONCURRENCY-ADJUSTMENT-001` 已于 2026-09-04 完成（纯文档）：从四份设计草案（`DESIGN.md`/`API.md`/`UI.md`/`DATABASE.md`）中移除已过时的 `LOCK TABLE ... WAIT 5`、`ORA-30006→50050` 及并发“最多一个成功”等设计，按已重新批准的需求并发口径调整设计并发表述（需求与验收已随本轮并发口径调整重新批准，ChatGPT 对 R1 结果提交 `f2a4d7d...` 正式复审 `APPROVED`，项目负责人于 2026-09-04 明确回复“批准”，`REQUIREMENTS.md`/`ACCEPTANCE.md` 已收口为 `APPROVED`）。设计并发口径调整结果已于 2026-09-04 完成正式设计复审与批准收口：ChatGPT 对提交 `ba7c5e9...` 的设计并发口径调整结果正式复审（`CHATGPT_FORMAL_DESIGN_CONCURRENCY_ADJUSTMENT_REVIEW`）结论 `APPROVED`，项目负责人于 2026-09-04 明确回复“批准”，四份设计文档经批准收口任务 `CLIENT-CONFIG-DESIGN-CONCURRENCY-ADJUSTMENT-APPROVAL-001` 收口为 `APPROVED`、`PENDING_USER_CONFIRMATION=0`，整体标记为 `APPROVED_READY_FOR_IMPLEMENTATION`（对应报告见 §2 导航）。下一入口为 `CLIENT_CONFIG_IMPLEMENTATION`：以已批准的需求（90 条）、验收（76 条、全部 `NOT_RUN`）与四份设计（37/20/26/22）为唯一业务基线进入实现阶段；该实现随后已完成（见 §4 既有实现事实 `IMPLEMENTED_PENDING_USER_ACCEPTANCE`），76 条验收保持全部 `NOT_RUN`；不得把已批准设计写成测试已通过或验收已通过。

**当前下一入口（R2 纠错起，覆盖以上历史入口）**：`CHATGPT_REMOTE_BASELINE_APPROVAL_CLOSEOUT_R2_REVIEW`（对象为本次 R2 状态/入口纠错的结果提交；该提交 SHA 由 ChatGPT 从远程 Git 取得，本文件不预造）。本轮页面级调整基线（`CLIENT-CONFIG-QUERY-LIST-AND-LIST-TABLE-ADJUSTMENT-BASELINE-001`，经 R1 修订、R2/R3 证据纠错）已由项目负责人于 2026-09-22 批准（`adjustment_baseline_status=APPROVED`、`adjustment_approval_status=APPROVED_BY_PROJECT_OWNER`，批准依据见 §1.2）；其后批准收口复审（`CHATGPT_REMOTE_BASELINE_APPROVAL_CLOSEOUT_REVIEW`，即 2026-09-22 批准收口设定的入口）已执行并返回 `CHANGES_REQUIRED`，由 R1、R2 纠错任务承接，故该入口属**历史入口**、已被本入口取代。下一步须由 ChatGPT 从远程 Git 对本 R2 纠错结果做独立复审；**只有该复审通过后**，才进入独立页面调整实现任务。**不得**跳过该复审直接进入实现，**不得**把基线批准写成页面已实现、已测试、已目测或验收已通过，**不得**执行正式验收或最终接受。本轮调整实现状态为 `adjustment_implementation_status=NOT_STARTED`，本轮新增 `CCFG-AC-077~089` 与既有 76 条一致保持 `NOT_RUN`（合计 89 条全部 `NOT_RUN`）。页面级选择性接入授权**已授予** `/config/client`，本次批准收口**不新增、不扩大**该授权范围，该授权与基线批准**均不等于**本轮实现已授权或已完成。更早的历史入口 `CHATGPT_REMOTE_BASELINE_R1_REVIEW`（2026-09-22 R1 阶段）保留不改写。
