# 需求与验收草案 R3 极小定向修订执行报告 DATA-SOURCE-SNAPSHOT-STATUS-REQUIREMENTS-BASELINE-001-R3

## 1. 任务信息

| 项目 | 值 |
|---|---|
| 任务编号 | `DATA-SOURCE-SNAPSHOT-STATUS-REQUIREMENTS-BASELINE-001-R3` |
| 任务类型 | `CHATGPT_REVIEW_DRIVEN_DOCUMENT_MINIMAL_REVISION`（纯文档极小定向修订；ChatGPT 对 R2 结果正式复审初版结论 `CHANGES_REQUIRED` 后修订） |
| Feature | 源库快照状态（slug `data-source-snapshot-status`） |
| 所属模块 | 运行监控 |
| 任务状态 | `COMPLETED`（R3 极小定向修订完成并入库；需求/验收仍为未批准草案，未实现、未执行验收） |
| 初版（R0）任务 | `DATA-SOURCE-SNAPSHOT-STATUS-REQUIREMENTS-BASELINE-001`（授权基线提交 `72b305a8e4134d10f514920c215b9647fb7d9e3b`） |
| R1 任务 | `DATA-SOURCE-SNAPSHOT-STATUS-REQUIREMENTS-BASELINE-001-R1`（结果提交见 R1 报告与 Git 历史） |
| R2 任务 | `DATA-SOURCE-SNAPSHOT-STATUS-REQUIREMENTS-BASELINE-001-R2`（结果提交见 R2 报告与 Git 历史） |
| R3 授权基线提交（base） | `5c58af6b0a378c8534ebc0b76eaa7bc75b6a847a`（R3 任务开始时 `origin/develop` 最新提交；本地 HEAD 与其一致，ahead/behind=0/0） |
| 执行分支 | `develop` |
| 本报告是否自引用本次结果提交 | 否（本报告不预填尚未产生的 result_commit_id；结果提交与推送结果见任务提交记录与本任务机器可读输出 `AGENT_TASK_RESULT`） |

## 2. 任务范围与目标

对 `docs/features/data-source-snapshot-status/` 下的需求与验收草案执行 R3 极小定向修订，只修正 ChatGPT 对 R2 结果正式复审后指出的唯一验收矛盾（`DSS-AC-024`），不新增/删除/重编号任何需求或验收，不批准基线，不进入设计、实现或验收执行阶段：

- **唯一业务目标**：修正 `DSS-AC-024` 中“成功刷新却不更新最近成功刷新时间”的验收矛盾，并明确刷新成功不能替换“已应用查询条件”。

本任务不改变任何需求业务规则。`REQUIREMENTS.md` 的 65 条 `DSS-REQ-*` 业务行与 `ACCEPTANCE.md` 除 `DSS-AC-024` 外的 67 条验收业务行相对授权基线必须逐字节不变。

## 3. 环境与前置检查

| 检查项 | 结果 |
|---|---|
| 当前目录 | `/agent/cdc-config-platform`（Git 仓库） |
| 当前分支 | `develop` |
| R3 任务开始前 Commit ID | `5c58af6b0a378c8534ebc0b76eaa7bc75b6a847a` |
| `origin/develop` | `5c58af6b0a378c8534ebc0b76eaa7bc75b6a847a` |
| `git ls-remote origin refs/heads/develop` | `5c58af6b0a378c8534ebc0b76eaa7bc75b6a847a` |
| ahead/behind | `0/0`（本地 HEAD 与 `origin/develop` 一致，无分叉，可安全快进） |
| 与本任务无关的既有工作区修改 | 存在大量用户既有未提交内容；保持原样，未清理、未覆盖、未暂存、未提交，未使用任何破坏性 Git 命令 |
| 环境预检 | 纯文档任务；不要求后端/前端/数据库/ZooKeeper 环境启动（验证矩阵 `NOT_APPLICABLE`） |

## 4. 允许修改范围（白名单，5 个文件）

| 序号 | 文件 | 操作 |
|---|---|---|
| 1 | `docs/features/data-source-snapshot-status/ACCEPTANCE.md` | 修改（只修正 `DSS-AC-024` 及 R3 版本/变更记录） |
| 2 | `docs/features/data-source-snapshot-status/REQUIREMENTS.md` | 修改（65 条业务行逐字节不变，只更新 R3 非业务元数据） |
| 3 | `docs/features/data-source-snapshot-status/README.md` | 修改（最小 R3 状态同步） |
| 4 | `docs/features/README.md` | 修改（仅本 Feature 最小 R3 同步） |
| 5 | `docs/features/data-source-snapshot-status/reports/DATA-SOURCE-SNAPSHOT-STATUS-REQUIREMENTS-BASELINE-001-R3.md` | 新增（本报告） |

严禁修改 R0/R1/R2 报告、数据库只读复核报告、任何设计文档、代码、测试、配置或其他文件。实际 diff 仅包含上述 5 个文件。

## 5. 唯一需要修正的验收矛盾与落地

### 5.1 问题事实

R2 的 `DSS-AC-024` 第④步正确规定：新条件查询失败时，“最近成功刷新时间”不更新。但第⑤步随后触发自动刷新或“立即刷新”，该刷新按旧的“已应用查询条件”**成功返回**时，R2 仍写成“也不更新最近成功刷新时间”。这与已批准为草案事实的统一规则冲突：

- `DSS-REQ-054`：任何成功查询或刷新都更新最近成功刷新时间；
- `DSS-REQ-061`：失败不更新，成功才更新；
- `DSS-AC-057/058/068`：成功更新，失败或被抑制触发不更新。

### 5.2 R3 采用的修订口径（落地于 `DSS-AC-024` 预期结果列）

1. 第④步新条件（候选 C）查询失败：不替换已应用查询条件、保留旧数据、界面控件保留候选 C、失败提示脱敏收敛、“最近成功刷新时间”不更新（语义保持）。
2. 第⑤步明确按旧“已应用条件”（候选 A）触发的自动/立即刷新**成功返回**：仍使用已应用条件（候选 A）、不使用界面中失败未提交的新条件（候选 C）、不替换不改变已应用条件、按本次成功刷新结果更新表格、“最近成功刷新时间”更新为本次成功刷新完成时间、请求结束后重新开始完整 60 秒周期。
3. 第②步、第⑧步等明确成功的刷新步骤与统一规则一致：成功刷新更新表格与最近成功刷新时间、但永远不替换已应用查询条件。
4. 只有用户点击“查询”且该次查询成功返回（含成功返回 0 条空结果），才用该次请求快照替换已应用查询条件。
5. 自动刷新和“立即刷新”无论成功失败都不得从界面选择条件生成或替换已应用查询条件。
6. `DSS-AC-024` 末句替换为 R3 授权基线的无歧义口径（见 5.3）。

### 5.3 `DSS-AC-024` 总结句改写

删除 R2 中含义不准确的“全过程中‘已应用查询条件’仅在查询/刷新成功后替换或更新”，改为：

> 只有用户点击“查询”且查询成功，才允许用该次请求快照替换“已应用查询条件”；自动刷新和“立即刷新”无论成功或失败都不得改变“已应用查询条件”。成功刷新只按既有已应用条件更新表格数据、最近成功刷新时间，并从请求结束后重新开始完整 60 秒周期。

### 5.4 元数据与变更记录同步

- `ACCEPTANCE.md`：§1 元数据更新为 R3（R1/R2 列为历史版，新增本版 R3 任务编号与授权基线 `5c58af6`，文档版本更新为“R3 极小定向修订版”）；§7 追加 R3 变更记录行，明确其余 67 条验收业务行相对授权基线零变化。
- `REQUIREMENTS.md`：§1 元数据更新为 R3（R2 列为历史版，新增本版 R3 任务编号/授权基线，文档版本、创建日期、需求来源追加 R3 说明）；事实边界声明与 §22 草建议题处置说明由 R2 复审入口更新为 R3；§24 追加 R3 变更记录行，说明 R3 只修验收文字、不改任何需求语义；65 条 `DSS-REQ-*` 业务行未改动。
- Feature `README.md` 与 `docs/features/README.md`：最小 R3 状态同步（身份/验收/当前阶段、文档导航状态、报告清单新增 R3 报告、§8 决议摘要追加 R3、下一流程入口更新为 ChatGPT 对 R3 结果正式复审）。

## 6. 本轮未改变的既有决策

R1/R2 内容保持业务语义不变：页面严格只读、无任何 RUN_STATE 写能力；仅展示实际存在记录、不补行；不分页、预计最多约 100 条；查询条件仅探针端/源库/快照状态三项多选、显式“全部”、同项“或”、跨项“且”；候选只来源于 RUN_STATE 实际记录、未知状态候选仅在真实存在未知值时出现；首次进入自动查询全部、修改条件不自动查询、重置只恢复全部且不查询；自动刷新与“立即刷新”使用已应用条件；“已应用查询条件”的请求快照、失败保留旧条件、仅成功（含成功空结果）才升级、在途改条件成功后升级请求开始时快照等语义全部保持；源库列单行 ORG＋Tooltip 原始 ID；RUNNING 蓝、COMPLETED 绿、未知橙且同时有文字；时间格式 `YYYY-MM-DD HH:mm:ss`、空值 `--`；异常为单元格弱提示/小图标＋Tooltip、不新增异常列；“立即刷新”按钮稳定宽度；每次实际请求结束无论成败重启完整 60 秒、失败后约 60 秒自动重试、被抑制触发不单独重置计时、不可见停止且不保留剩余秒数复用、恢复可见立即刷新后重启；默认排序、字段、无操作列、未知状态兼容、关联异常兼容均不变；测试数据 DML 权限仍仅限开发库 `CDC_DATA_SOURCE_RUN_STATE`、其他表只读。

## 7. 编号与计数核验

- 需求编号：`DSS-REQ-001`~`DSS-REQ-065`，共 **65** 条，连续唯一（R3 未增删改号）。
- 验收编号：`DSS-AC-001`~`DSS-AC-068`，共 **68** 条，连续唯一，全部 `NOT_RUN`（R3 未增删改号，未新增 `DSS-AC-069`）。
- 编号连续性、唯一性与计数一致性已脚本核验通过（REQ 65/65、AC 68/68，全部 `NOT_RUN`）。

## 8. 业务行零差异核验（相对授权基线 `5c58af6`）

| 验证项 | 结果 |
|---|---|
| 需求业务行：`REQUIREMENTS.md` 全部 `| DSS-REQ-` 行逐字节比对 | `ZERO`（65 行零差异） |
| 验收业务行：`ACCEPTANCE.md` 全部 `| DSS-AC-` 行剔除 `DSS-AC-024` 后逐字节比对 | `ZERO`（67 行零差异） |
| `DSS-AC-024` 行 | 预期结果列定向修订成功；操作·输入列与前置/编号/状态/关联需求不变；其余列未改动 |

## 9. 追踪与一致性校验

| 验证项 | 结果 |
|---|---|
| 正向覆盖（每条 `DSS-REQ-001~065` 至少一个 `DSS-AC` 覆盖） | 通过（65/65） |
| 反向引用（每条 `DSS-AC` 关联需求均为已存在编号） | 通过（引用均在 `DSS-REQ-001~065` 内，无悬空） |
| §5 需求—验收追踪矩阵 | 保持完整；本轮未改变任何映射（R3 未增删改号、未改关联需求） |
| 越权状态词检查（APPROVED/IMPLEMENTED/PASS/ACCEPTED 作为当前状态） | 通过（仅以“未批准/不等于已批准/否定/历史基线/下一步”等限定出现，未误用作当前状态） |
| 修订目标残留检查 | 通过（全文搜索已消除：`DSS-AC-024` 第⑤步“成功刷新也不更新时间”的错误表述；“全过程中‘已应用查询条件’仅在查询/刷新成功后替换或更新”旧口径；保留第④步失败不更新、第②⑧⑤步成功刷新更新表格与最近成功刷新时间但不替换已应用条件、只有“查询成功”才替换已应用条件的语义） |
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

未写成 `APPROVED`、`IMPLEMENTED`、`PASS`、`ACCEPTED`，也未暗示需求已正式批准。R3 完成后的下一入口为 **ChatGPT 对 R3 结果进行正式复审**；不是批准、设计或实现。

## 11. 未执行事项

- 未进入设计阶段；未创建/修改 `DESIGN.md`/`API.md`/`UI.md`/`DATABASE.md`。
- 未实现或修改任何前后端代码、测试、依赖或构建配置；页面仍为占位页。
- 未执行任何验收（全部 `DSS-AC-*` 保持 `NOT_RUN`）。
- 未访问数据库、未执行 DML/DDL、未操作 ZooKeeper/TongZK、Kafka、sync-client，未启动/停止/重启任何服务。
- 工作区既有与本任务无关的未提交修改保持原样，未纳入本次提交。
- R0/R1/R2 执行报告、数据库只读复核报告等白名单外文件未改动。

## 12. 结果汇总

| 输出字段 | 值 |
|---|---|
| 任务状态 | `COMPLETED`（R3 极小定向修订完成；草案未批准、未实现、未执行验收） |
| 任务编号 | `DATA-SOURCE-SNAPSHOT-STATUS-REQUIREMENTS-BASELINE-001-R3` |
| 分支 | `develop` |
| base_commit_id | `5c58af6b0a378c8534ebc0b76eaa7bc75b6a847a` |
| requirements_status | `DRAFT_PENDING_USER_REVIEW` |
| acceptance_status | `DRAFT_PENDING_USER_REVIEW` |
| implementation_status | `NOT_STARTED` |
| acceptance_execution_status | `NOT_RUN` |
| design_status | `NOT_STARTED` |
| requirements_count | 65 |
| acceptance_count | 68 |
| acceptance_not_run_count | 68 |
| pending_user_confirmation_count | 0 |
| requirements_business_rows_diff | `ZERO` |
| acceptance_non_ac024_business_rows_diff | `ZERO` |
| traceability_status | `COMPLETE` |
| successful_refresh_timestamp_status | `UPDATED_ON_SUCCESS` |
| refresh_applied_condition_mutation_status | `UNCHANGED` |
| database_access_status | `NONE` |
| database_write_status | `NONE` |
| code_change_status | `NONE` |
| push_status | 按任务 §8 已普通推送至 `origin/develop`（非强推）；推送后本地 HEAD、`origin/develop`、远程 `refs/heads/develop` 三者一致，ahead/behind=0/0，详见任务提交记录与本任务机器可读输出 |
| 变更文件 | 白名单 5 个文件（见 §4） |

下一入口：**ChatGPT 对 R3 极小定向修订结果（`REQUIREMENTS.md` 与 `ACCEPTANCE.md` R3 修订版草案）进行正式复审**，随后由项目负责人审阅/批准需求与验收草案；批准后再进入设计阶段。本任务（R3）不得继续批准需求、创建设计、实现功能或执行验收。
