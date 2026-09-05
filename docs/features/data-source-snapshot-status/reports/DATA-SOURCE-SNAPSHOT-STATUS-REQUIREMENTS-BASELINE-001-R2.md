# 需求与验收草案 R2 最小定向修订执行报告 DATA-SOURCE-SNAPSHOT-STATUS-REQUIREMENTS-BASELINE-001-R2

## 1. 任务信息

| 项目 | 值 |
|---|---|
| 任务编号 | `DATA-SOURCE-SNAPSHOT-STATUS-REQUIREMENTS-BASELINE-001-R2` |
| 任务类型 | `CHATGPT_REVIEW_DRIVEN_DOCUMENT_MINIMAL_REVISION`（纯文档最小定向修订；ChatGPT 对 R1 结果正式复审初版结论 `CHANGES_REQUIRED` 后修订） |
| Feature | 源库快照状态（slug `data-source-snapshot-status`） |
| 所属模块 | 运行监控 |
| 任务状态 | `COMPLETED`（R2 最小定向修订完成并入库；需求/验收仍为未批准草案，未实现、未执行验收） |
| 初版（R0）任务 | `DATA-SOURCE-SNAPSHOT-STATUS-REQUIREMENTS-BASELINE-001`（授权基线提交 `72b305a8e4134d10f514920c215b9647fb7d9e3b`） |
| R1 任务 | `DATA-SOURCE-SNAPSHOT-STATUS-REQUIREMENTS-BASELINE-001-R1`（结果提交见 R1 报告与 Git 历史） |
| R2 授权基线提交（base） | `0476c40a49f1a7aa6d48fe58194c92982276fd60`（R2 任务开始时 `origin/develop` 最新提交；本地 HEAD 与其一致，ahead/behind=0/0） |
| 执行分支 | `develop` |
| 本报告是否自引用本次结果提交 | 否（本报告不预填尚未产生的 result_commit_id；结果提交与推送结果见任务提交记录与本任务机器可读输出 `AGENT_TASK_RESULT`） |

## 2. 任务范围与目标

对 `docs/features/data-source-snapshot-status/` 下的需求与验收草案执行 R2 最小定向修订，只消除 ChatGPT 对 R1 结果正式复审后剩余的两个歧义，不新增需求或验收编号，不批准基线，不进入设计、实现或验收执行阶段：

1. **R2-01**：明确用户按新条件查询失败后，“已应用查询条件”应如何处理；
2. **R2-02**：明确查询或刷新失败后，60 秒自动刷新如何继续计时与重试。

本任务只修订文档草案，不改动 R1 已确认的其他业务规则。

## 3. 环境与前置检查

| 检查项 | 结果 |
|---|---|
| 当前目录 | `/agent/cdc-config-platform`（Git 仓库） |
| 当前分支 | `develop` |
| R2 任务开始前 Commit ID | `0476c40a49f1a7aa6d48fe58194c92982276fd60` |
| `origin/develop` | `0476c40a49f1a7aa6d48fe58194c92982276fd60` |
| `git ls-remote origin refs/heads/develop` | `0476c40a49f1a7aa6d48fe58194c92982276fd60` |
| ahead/behind | `0/0`（本地 HEAD 与 `origin/develop` 一致，无分叉，可安全快进） |
| 与本任务无关的既有工作区修改 | 存在大量用户既有未提交内容；保持原样，未清理、未覆盖、未暂存、未提交，未使用任何破坏性 Git 命令 |
| 环境预检 | 纯文档任务；不要求后端/前端/数据库/ZooKeeper 环境启动（验证矩阵 `NOT_APPLICABLE`） |

## 4. 允许修改范围（白名单，5 个文件）

| 序号 | 文件 | 操作 |
|---|---|---|
| 1 | `docs/features/data-source-snapshot-status/README.md` | 修改（最小状态同步） |
| 2 | `docs/features/data-source-snapshot-status/REQUIREMENTS.md` | 修改 |
| 3 | `docs/features/data-source-snapshot-status/ACCEPTANCE.md` | 修改 |
| 4 | `docs/features/README.md` | 修改（仅本 Feature 最小同步） |
| 5 | `docs/features/data-source-snapshot-status/reports/DATA-SOURCE-SNAPSHOT-STATUS-REQUIREMENTS-BASELINE-001-R2.md` | 新增（本报告） |

严禁修改 R0/R1 执行报告、数据库只读复核报告、任何设计文档、代码、测试、配置或其他文件。实际 diff 仅包含上述 5 个文件。

## 5. R2-01：新条件查询失败后“已应用查询条件”的处理（仅成功才替换）

### 5.1 统一口径

- “已应用查询条件”初始化为页面加载时的三项默认“全部”，并立即以该条件发起首次自动查询。
- 首次自动查询失败：无历史成功结果，显示首次加载失败状态与“重新加载”入口；“已应用查询条件”仍为三项“全部”；后续重新加载或自动重试仍使用三项“全部”。
- 首次查询后，用户修改界面选择条件不自动查询，当前结果与“已应用查询条件”均不变。
- 用户点击“查询”时对点击瞬间的界面选择条件形成请求快照，并仅以该快照发起查询。
- 只有查询成功返回（含成功返回 0 条空结果）时，请求快照才升级为新的“已应用查询条件”，同时以成功结果替换当前表格并更新最近成功刷新时间。
- 新条件查询失败：不升级已应用条件；保留上一次成功结果与上一次已应用条件；界面控件保留用户当前新条件便于再次点击“查询”；后续自动刷新与“立即刷新”继续使用旧的已应用条件；显示收敛、脱敏的失败提示；最近成功刷新时间不更新。
- 请求在途期间用户又修改界面控件：成功后升级的是请求开始时捕获的条件快照，不是请求结束时控件可能已经变成的值。
- 查询区“重置”既有规则不变：只把界面选择条件恢复为三项“全部”，不发起请求、不改变表格、不改变已应用条件；重置后再次点击“查询”且成功，三项“全部”才成为新的已应用条件。

### 5.2 落地位置

- `REQUIREMENTS.md`：§2.2 术语（“已应用查询条件”改为“查询成功后才替换；首次初始化为全部”口径，补充“请求快照”定义）；`DSS-REQ-023/025`（查询条件双状态与点击“查询”请求快照、仅成功升级）、`DSS-REQ-059`（首次查询失败保持三项“全部”）、`DSS-REQ-060`（成功返回 0 条属成功）、`DSS-REQ-061`（失败保留旧数据与旧已应用条件、界面保留新选择、刷新沿用旧条件）。删除“成功提交给查询流程”等可能指请求成功发出而非响应成功的模糊表述。
- `ACCEPTANCE.md`：扩展 `DSS-AC-021`（首次自动查询成功与首次失败均验证：失败仍保持初始“全部”已应用条件，重试/自动重试仍按“全部”）、`DSS-AC-024`（完整双状态序列扩展为 ①~⑩：修改不查询、自动/立即刷新用旧已应用条件、点击“查询”用请求快照、在途改条件成功后升级请求快照而非控件现值、新条件查询失败不升级/保留旧结果/保留界面新选择/刷新仍旧/最近成功时间不更新、成功后升级、重置不查询、刷新仍旧、点击查询全部才应用、空结果视为成功替换），`DSS-AC-024` 关联需求增补 `DSS-REQ-061`；`DSS-AC-056`（首次加载失败“已应用条件”仍为三项“全部”、重试按“全部”）、`DSS-AC-057`（成功返回 0 条属成功：升级条件、更新最近成功刷新时间、重启周期）、`DSS-AC-058`（刷新失败保留数据与已应用条件 C、最近成功时间不更新、后续刷新仍按 C）。
- Feature `README.md` §8：新增 R2-01 决议摘要；§1 状态行、§5 导航行、§9/§10 同步。

## 6. R2-02：失败后的 60 秒计时与自动重试（每次实际请求结束后重启完整周期）

### 6.1 统一口径

- 页面可见时，每一次实际发出的查询或刷新请求结束后，无论成功还是失败，都从请求结束时重新开始一个完整 60 秒自动刷新周期。
- 刷新失败：保留最近一次成功数据；保留已应用查询条件；最近成功刷新时间不更新；失败提示收敛且脱敏；60 秒后按已应用条件正常自动重试，不停止、不立即无间隔重试。
- 查询成功返回空结果属于成功：允许更新已应用条件、表格空态与最近成功刷新时间，并从请求结束后重新计时 60 秒。
- 请求在途时不得发起重叠请求；因已有请求在途而被抑制的自动或手工触发不视为一次实际请求，不单独重置计时。
- 页面不可见时停止/取消自动刷新计时，不再使用“保留剩余计时状态/恢复旧剩余秒数”的表述。
- 请求在途期间页面变为不可见：该请求允许正常结束并按既有成功/失败规则处理，但页面不可见期间不启动新的 60 秒计时。
- 页面恢复可见后立即按已应用条件发起一次刷新；该请求无论成功还是失败，结束后都重新开始完整 60 秒周期。
- 最近成功刷新时间只在查询/刷新成功后更新，任何失败或被抑制的触发都不得更新时间。

### 6.2 落地位置

- `REQUIREMENTS.md`：`DSS-REQ-050`（自动/立即刷新沿用已应用条件、请求结束无论成败在页面可见时重启完整周期、失败保留数据与条件、不停止/不立即无间隔重试）、`DSS-REQ-051`（不可见停止/取消计时、在途期间变不可见该请求正常结束但不可见不启动新计时、恢复可见立即刷新后重启完整周期）、`DSS-REQ-053`（无重叠请求、被抑制触发不视为实际请求不单独重置计时）、`DSS-REQ-054`（60 秒周期：页面可见时每次实际请求结束无论成败重启完整周期、空结果成功也重启、最近成功刷新时间仅成功后更新）。删除“计时起点为最近一次成功查询/刷新请求结束”的旧表述。
- `ACCEPTANCE.md`：重写 `DSS-AC-048`（不可见停止/取消且不保留剩余秒数、恢复可见立即刷新且无论成败重启完整周期）、`DSS-AC-050`（被抑制触发不视为实际请求、不单独重置计时，其后首次自动刷新仍在在途请求结束后约 60 秒发生）、`DSS-AC-051`（核心场景 A~D：成功间隔约 60 秒、失败后约 60 秒自动重试且保留数据与条件、被抑制触发不重置、不可见停止不保留剩余秒数、恢复可见刷新后重启）、`DSS-AC-058`（失败后约 60 秒自动重试、最近成功刷新时间仅成功后更新）、`DSS-AC-068`（失败或被抑制触发不更新最近成功刷新时间、失败后约 60 秒自动重试）。
- Feature `README.md` §8：新增 R2-02 决议摘要。

## 7. 本轮未改变的既有决策

除第 5、6 节的精确定义外，R1 内容保持业务语义不变：页面严格只读、无任何 RUN_STATE 写能力；仅展示实际存在记录、不补行；不分页、预计最多约 100 条；查询条件仅探针端/源库/快照状态三项多选、显式“全部”、同项“或”、跨项“且”；候选只来源于 RUN_STATE 实际记录、未知状态候选仅在真实存在未知值时出现；首次进入自动查询全部、修改条件不自动查询、重置只恢复全部且不查询；自动刷新与“立即刷新”使用已应用条件；源库列单行 ORG＋Tooltip 原始 ID；RUNNING 蓝、COMPLETED 绿、未知橙且同时有文字；时间格式 `YYYY-MM-DD HH:mm:ss`、空值 `--`；异常为单元格弱提示/小图标＋Tooltip、不新增异常列；“立即刷新”按钮稳定宽度、加载图标不得引起工具栏水平位移；默认排序、字段、无操作列、未知状态兼容、关联异常兼容均不变；测试数据 DML 权限仍仅限开发库 `CDC_DATA_SOURCE_RUN_STATE`、其他表只读。

## 8. 编号与计数核验

- 需求编号：`DSS-REQ-001`~`DSS-REQ-065`，共 **65** 条，连续唯一（R2 未增删改号）。
- 验收编号：`DSS-AC-001`~`DSS-AC-068`，共 **68** 条，连续唯一，全部 `NOT_RUN`（R2 未增删改号，未新增 `DSS-AC-069`）。
- 编号连续性、唯一性与计数一致性已脚本核验通过（REQ 65/65、AC 68/68，全部 `NOT_RUN`）。

## 9. 追踪与一致性校验

| 验证项 | 结果 |
|---|---|
| 正向覆盖（每条 `DSS-REQ-001~065` 至少一个 `DSS-AC` 覆盖） | 通过（65/65） |
| 反向引用（每条 `DSS-AC` 关联需求均为已存在编号） | 通过（引用均在 `DSS-REQ-001~065` 内，无悬空） |
| §5 需求—验收追踪矩阵 | 同步：`DSS-AC-024` 关联需求增补 `DSS-REQ-061`，矩阵 `DSS-REQ-061` 行增列 `DSS-AC-024`；编号与计数不变 |
| 越权状态词检查（APPROVED/IMPLEMENTED/PASS/ACCEPTED 作为当前状态） | 通过（仅以“未批准/不等于已批准/否定/历史基线/下一步”等限定出现，未误用作当前状态） |
| 残留歧义文字检查 | 通过（全文搜索已消除：点击“查询”即无条件替换已应用条件的旧表述；查询失败后刷新用哪组条件的歧义；“仅成功请求后才重启计时”的旧表述；失败后停止自动刷新或立即无间隔重试的可能解释；“页面不可见保留剩余计时状态”旧表述；失败时更新最近成功刷新时间的错误表述） |
| 跨文档计数一致性（README/REQUIREMENTS/ACCEPTANCE/Feature 总索引） | 通过（65 需求 / 68 验收，全部 `NOT_RUN`，0 项待确认） |

## 10. 状态边界

修订后仍保持：

- `requirements_status=DRAFT_PENDING_USER_REVIEW`
- `acceptance_status=DRAFT_PENDING_USER_REVIEW`
- `implementation_status=NOT_STARTED`
- `acceptance_execution_status=NOT_RUN`
- `design_status=NOT_STARTED`
- 所有 `DSS-AC-*` 状态为 `NOT_RUN`
- `pending_user_confirmation_count=0`

未写成 `APPROVED`、`IMPLEMENTED`、`PASS`、`ACCEPTED`，也未暗示需求已正式批准。R2 完成后的下一入口为 **ChatGPT 对 R2 结果进行正式复审**；不是批准、设计或实现。

## 11. 未执行事项

- 未进入设计阶段；未创建/修改 `DESIGN.md`/`API.md`/`UI.md`/`DATABASE.md`。
- 未实现或修改任何前后端代码、测试、依赖或构建配置；页面仍为占位页。
- 未执行任何验收（全部 `DSS-AC-*` 保持 `NOT_RUN`）。
- 未访问数据库、未执行 DML/DDL、未操作 ZooKeeper/TongZK、Kafka、sync-client，未启动/停止/重启任何服务。
- 工作区既有与本任务无关的未提交修改保持原样，未纳入本次提交。
- R0/R1 执行报告、数据库只读复核报告等白名单外文件未改动。

## 12. 结果汇总

| 输出字段 | 值 |
|---|---|
| 任务状态 | `COMPLETED`（R2 最小定向修订完成；草案未批准、未实现、未执行验收） |
| 任务编号 | `DATA-SOURCE-SNAPSHOT-STATUS-REQUIREMENTS-BASELINE-001-R2` |
| 分支 | `develop` |
| base_commit_id | `0476c40a49f1a7aa6d48fe58194c92982276fd60` |
| requirements_status | `DRAFT_PENDING_USER_REVIEW` |
| acceptance_status | `DRAFT_PENDING_USER_REVIEW` |
| implementation_status | `NOT_STARTED` |
| acceptance_execution_status | `NOT_RUN` |
| design_status | `NOT_STARTED` |
| requirements_count | 65 |
| acceptance_count | 68 |
| acceptance_not_run_count | 68 |
| pending_user_confirmation_count | 0 |
| traceability_status | `COMPLETE` |
| query_failure_applied_condition_status | `KEEP_PREVIOUS_UNTIL_SUCCESS` |
| refresh_failure_retry_status | `RETRY_AFTER_60_SECONDS` |
| hidden_timer_status | `STOPPED_NO_REMAINING_TIME_REUSE` |
| database_access_status | `NONE` |
| database_write_status | `NONE` |
| code_change_status | `NONE` |
| push_status | 按任务 §10 已普通推送至 `origin/develop`（非强推）；推送后本地 HEAD、`origin/develop`、远程 `refs/heads/develop` 三者一致，ahead/behind=0/0，详见任务提交记录与本任务机器可读输出 |
| 变更文件 | 白名单 5 个文件（见 §4） |

下一入口：**ChatGPT 对 R2 定向修订结果（`REQUIREMENTS.md` 与 `ACCEPTANCE.md` R2 修订版草案）进行正式复审**，随后由项目负责人审阅/批准需求与验收草案；批准后再进入设计阶段。本任务（R2）不得继续批准需求、创建设计、实现功能或执行验收。
