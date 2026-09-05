# 需求与验收草案 R1 定向修订执行报告 DATA-SOURCE-SNAPSHOT-STATUS-REQUIREMENTS-BASELINE-001-R1

## 1. 任务信息

| 项目 | 值 |
|---|---|
| 任务编号 | `DATA-SOURCE-SNAPSHOT-STATUS-REQUIREMENTS-BASELINE-001-R1` |
| 任务类型 | `CHATGPT_REVIEW_DRIVEN_DOCUMENT_REVISION`（纯文档定向修订；ChatGPT 正式复审初版草案结论 `CHANGES_REQUIRED` 后修订） |
| Feature | 源库快照状态（slug `data-source-snapshot-status`） |
| 所属模块 | 运行监控 |
| 任务状态 | `COMPLETED`（R1 定向修订完成并入库；需求/验收仍为未批准草案，未实现、未执行验收） |
| 初版（R0）任务 | `DATA-SOURCE-SNAPSHOT-STATUS-REQUIREMENTS-BASELINE-001`（授权基线提交 `72b305a8e4134d10f514920c215b9647fb7d9e3b`） |
| R1 授权基线提交（base） | `91eb2209a99a65ef1d433c2fb1c815a1abcd5bd5`（R1 任务开始时 `origin/develop` 最新提交；本地 HEAD 与其一致，ahead/behind=0/0） |
| 执行分支 | `develop` |
| 本报告是否自引用本次结果提交 | 否（本报告不预填尚未产生的 result_commit_id；结果提交与推送结果见任务提交记录与本任务机器可读输出 `AGENT_TASK_RESULT`） |

## 2. 任务范围与目标

对 `docs/features/data-source-snapshot-status/` 下的需求与验收草案执行 R1 定向修订：

1. 修正 R0 文档 3 个确定问题（R1-01~R1-03）；
2. 把项目负责人已确认的 8 项交互方案（任务提示词 §6）与刷新工具栏稳定性要求（§7）正式纳入需求与验收草案；
3. 准确落实“查询区重置不立即查询”的最新决定。

本任务只修订文档草案，不批准基线，不进入设计、实现或验收执行阶段。

## 3. 环境与前置检查

| 检查项 | 结果 |
|---|---|
| 当前目录 | `/agent/cdc-config-platform`（Git 仓库） |
| 当前分支 | `develop` |
| R1 任务开始前 Commit ID | `91eb2209a99a65ef1d433c2fb1c815a1abcd5bd5` |
| `origin/develop` | `91eb2209a99a65ef1d433c2fb1c815a1abcd5bd5` |
| `git ls-remote origin refs/heads/develop` | `91eb2209a99a65ef1d433c2fb1c815a1abcd5bd5` |
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
| 5 | `docs/features/data-source-snapshot-status/reports/DATA-SOURCE-SNAPSHOT-STATUS-REQUIREMENTS-BASELINE-001-R1.md` | 新增（本报告） |

严禁修改 R0 执行报告、数据库只读复核报告、任何设计文档、代码、测试、配置或其他文件。实际 diff 仅包含上述 5 个文件。

## 5. 三个确定问题的处理

### R1-01：消除“不得访问本表之外数据”的自相矛盾

- `REQUIREMENTS.md` §4.2 范围外原表述“访问本表之外的数据或执行 DDL/DML”与 §21 明确非目标原表述“访问本表以外的数据或对象”已定向改写，与 §7 允许“只读关联 `CDC_CLIENT_MULTIPLE`、`CDC_DATA_SOURCE` 补充展示”的事实统一。
- 统一边界写入 `DSS-REQ-015`（§7）：不访问与本功能无关的数据；允许只读访问 `CDC_DATA_SOURCE_RUN_STATE`，并允许只读关联 `CDC_CLIENT_MULTIPLE`、`CDC_DATA_SOURCE` 补充展示与关联异常判断；关联表绝对只读，且不得改变以 RUN_STATE 为驱动的行集合；不得扩大到任何其他表。
- 已同步检查 REQUIREMENTS/ACCEPTANCE/README，消除同类冲突；未扩大到任何其他表。

### R1-02：修正 `DSS-AC-065` 超出测试 DML 授权

- 明确测试数据写授权仅适用于项目配置 Oracle 开发库中的 `CDC_DATA_SOURCE_RUN_STATE`，绝不授权修改 `CDC_CLIENT_MULTIPLE`、`CDC_DATA_SOURCE` 或其他表。
- `ACCEPTANCE.md` §4.16 `DSS-AC-065` 及相关说明（§1 声明、§4 表前注）已改写：`SNAPSHOT_COMPLETED`、未知状态、孤立探针端、孤立源库可仅通过操作 RUN_STATE 构造；“关联配置停用”“源库类别异常”等场景仅当开发库已存在合适只读关联配置时，才通过新增/修改 RUN_STATE 引用该既有配置执行真实数据库验收；否则使用后端自动化测试、前端 Mock/组件测试验证。
- 所有 RUN_STATE 测试 DML 仍遵守原 `DSS-REQ-065` 的备份、恢复、逐行一致核验、禁 DDL、禁生产库等全部边界。

### R1-03：正式建立“界面选择条件—提交查询—刷新”的双状态语义

- `REQUIREMENTS.md` §10 需求表与 §2.2 术语新增“界面选择条件”“已应用查询条件”定义；`DSS-REQ-023`/`DSS-REQ-025` 落实首次自动查询、修改不自动查询、点击“查询”才应用、查询区“重置”只恢复“全部”且不查询/不清表/不改已应用条件、重置后点击“查询”才查询全部等规则。
- `DSS-REQ-050`/`DSS-REQ-051`/`DSS-REQ-054` 落实自动刷新与“立即刷新”始终沿用已应用查询条件、页面不可见暂停、恢复可见立即按已应用条件刷新一次并在该次请求结束后重新开始 60 秒计时、不得产生重叠请求。
- `ACCEPTANCE.md` §4.5 `DSS-AC-024` 完整验证五行为（修改条件不查询、点击查询才应用、重置只恢复全部且不查询、重置后自动/立即刷新仍用旧的已应用条件、重置后点击查询才查询全部）。
- 查询区“重置”与对 RUN_STATE 的“重置状态/重新快照”已在 `DSS-REQ-025` 明确区分：前者为允许的纯前端条件复位，后者为仍明确禁止的产品写操作；文档用词已避免混淆。

## 6. 8 项已确认交互方案与刷新工具栏稳定性落地

8 项决策（任务提示词 §6.1~§6.8）与刷新工具栏稳定性（§7）已并入既有需求/验收行（优先修订、未无故拆号增号）：

| 决策 | 并入需求 | 并入验收 |
|---|---|---|
| 三项多选控件＋“全部”互斥＋同条件或/条件间且、候选来自 RUN_STATE | `DSS-REQ-022/024` | `DSS-AC-020/022/023` |
| 未知状态候选动态出现与筛选 | `DSS-REQ-024/038` | `DSS-AC-022` |
| 源库单行＋Tooltip 原始 ID | `DSS-REQ-029` | `DSS-AC-027` |
| 状态标签颜色（蓝/绿/橙）＋文字 | `DSS-REQ-035/036/038/063` | `DSS-AC-032/033/035/037/061` |
| 时间格式 `YYYY-MM-DD HH:mm:ss`、空值 `--` | `DSS-REQ-055` | `DSS-AC-052` |
| 查询/刷新失败保留旧结果、提示收敛、最近成功刷新时间、失败脱敏、在途不闪烁 | `DSS-REQ-061/064` | `DSS-AC-058` |
| 关联异常弱提示（单元格内小图标/弱文字＋Tooltip、无专门异常列） | `DSS-REQ-045` | `DSS-AC-042` |
| 恢复可见立即按已应用条件刷新、重启 60 秒计时 | `DSS-REQ-051/054` | `DSS-AC-048/051` |
| 刷新工具栏稳定宽度 | `DSS-REQ-050` | `DSS-AC-068`（新增） |

原 `DSS-PROP-001~008` 草案建议已全部决策并吸收为正式需求/验收行，`pending_user_confirmation_count=0`；删除“待用户复审的草案建议”待决策表述，处置映射记录于 `REQUIREMENTS.md` §22。

## 7. 编号与计数核验

- 需求编号：`DSS-REQ-001`~`DSS-REQ-065`，共 **65** 条，连续唯一（R1 未增号）。
- 验收编号：`DSS-AC-001`~`DSS-AC-068`，共 **68** 条，连续唯一，全部 `NOT_RUN`。
  - R1 新增 `DSS-AC-068`（刷新工具栏稳定宽度）：该已确认交互此前无任何可折叠的既有验收用例，属不可避免增补；编号连续唯一，需求引用 `DSS-REQ-050`、`DSS-REQ-061` 均真实存在；README/REQUIREMENTS/ACCEPTANCE/Feature 总索引计数已同步为 68。
- 编号连续性、唯一性与计数一致性已脚本核验通过（REQ 65/65、AC 68/68，全部 `NOT_RUN`）。

## 8. 追踪与一致性校验

| 验证项 | 结果 |
|---|---|
| 正向覆盖（每条 `DSS-REQ-001~065` 至少一个 `DSS-AC` 覆盖） | 通过（65/65） |
| 反向引用（每条 `DSS-AC` 关联需求均为已存在编号） | 通过（引用均在 `DSS-REQ-001~065` 内，无悬空） |
| `DSS-AC-024` 完整验证重置五行为 | 通过（修改不查询/点击查询才应用/重置只恢复全部且不查询/重置后自动与立即刷新仍用旧已应用条件/重置后点击查询才查询全部） |
| 待用户复审草案建议 | 0（原 `DSS-PROP-001~008` 已全部决策吸收；§22 处置表列示去向） |
| 越权状态词检查（APPROVED/IMPLEMENTED/PASS/ACCEPTED 作为当前状态） | 通过（仅以“未批准/不等于已批准/否定/历史基线”等限定出现，未误用作当前状态） |
| 残留草案表述检查 | 通过（搜索无把 8 项方案写成 pending/proposal 的现行文字；“重置后立即查询全部”旧表述已清除；自动/立即刷新使用已应用条件无歧义；“禁止访问所有其他表”与“允许两张只读关联表”无冲突；无“修改其他配置表构造验收数据”越权文字） |
| 跨文档计数一致性（README/REQUIREMENTS/ACCEPTANCE/Feature 总索引） | 通过（65 需求 / 68 验收，全部 `NOT_RUN`，0 项待确认） |

## 9. 状态边界

修订后仍保持：

- `requirements_status=DRAFT_PENDING_USER_REVIEW`
- `acceptance_status=DRAFT_PENDING_USER_REVIEW`
- `implementation_status=NOT_STARTED`
- `acceptance_execution_status=NOT_RUN`
- `design_status=NOT_STARTED`
- 所有 `DSS-AC-*`（含新增 `DSS-AC-068`）状态为 `NOT_RUN`
- `pending_user_confirmation_count=0`

未写成 `APPROVED`、`IMPLEMENTED`、`PASS`、`ACCEPTED`，也未暗示需求已正式批准。R1 完成后的下一入口为 **ChatGPT 对 R1 结果进行正式复审**；不是设计或实现。

## 10. 未执行事项

- 未进入设计阶段；未创建/修改 `DESIGN.md`/`API.md`/`UI.md`/`DATABASE.md`。
- 未实现或修改任何前后端代码、测试、依赖或构建配置；页面仍为占位页。
- 未执行任何验收（全部 `DSS-AC-*` 保持 `NOT_RUN`）。
- 未访问数据库、未执行 DML/DDL、未操作 ZooKeeper/TongZK、Kafka、sync-client，未启动/停止/重启任何服务。
- 工作区既有与本任务无关的未提交修改保持原样，未纳入本次提交。
- R0 执行报告、数据库只读复核报告等白名单外文件未改动。

## 11. 结果汇总

| 输出字段 | 值 |
|---|---|
| 任务状态 | `COMPLETED`（R1 定向修订完成；草案未批准、未实现、未执行验收） |
| 任务编号 | `DATA-SOURCE-SNAPSHOT-STATUS-REQUIREMENTS-BASELINE-001-R1` |
| 分支 | `develop` |
| base_commit_id | `91eb2209a99a65ef1d433c2fb1c815a1abcd5bd5` |
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
| reset_behavior_status | `DOCUMENTED_NO_QUERY_UNTIL_SEARCH` |
| database_access_status | `NONE` |
| database_write_status | `NONE` |
| code_change_status | `NONE` |
| push_status | 按任务 §10 已普通推送至 `origin/develop`（非强推）；推送后本地 HEAD、`origin/develop`、远程 `refs/heads/develop` 三者一致，ahead/behind=0/0，详见任务提交记录与本任务机器可读输出 |
| 变更文件 | 白名单 5 个文件（见 §4） |

下一入口：**ChatGPT 对 R1 定向修订结果（`REQUIREMENTS.md` 与 `ACCEPTANCE.md` R1 修订版草案）进行正式复审**，随后由项目负责人审阅/批准需求与验收草案；批准后再进入设计阶段。本任务（R1）不得继续批准需求、创建设计、实现功能或执行验收。
