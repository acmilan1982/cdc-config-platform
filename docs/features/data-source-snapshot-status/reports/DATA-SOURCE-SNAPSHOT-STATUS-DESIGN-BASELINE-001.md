# 设计基线草案建立执行报告 DATA-SOURCE-SNAPSHOT-STATUS-DESIGN-BASELINE-001

## 1. 任务信息

| 项目 | 值 |
|---|---|
| 任务编号 | `DATA-SOURCE-SNAPSHOT-STATUS-DESIGN-BASELINE-001` |
| 任务类型 | `DESIGN_BASELINE_DRAFT_CREATION`（纯文档设计基线草案建立） |
| Feature | 源库快照状态（slug `data-source-snapshot-status`） |
| 所属模块 | 运行监控 |
| 任务状态 | `COMPLETED`（四份设计草案已建立，design_status=`DRAFT_PENDING_USER_REVIEW`；设计未批准、功能未实现、验收未执行） |
| 设计任务授权基线提交 | `38da355f16438ad0d9156acdd667e9258fe89141`（本任务开始时 `origin/develop` 最新提交；本地 HEAD 与其一致，ahead/behind=0/0） |
| 批准内容基准 | `4234af73db2190098f3dcd219319a4281fdabafd`（已批准需求/验收的批准内容基准，正式批准版本 `DATA-SOURCE-SNAPSHOT-STATUS-REQUIREMENTS-BASELINE-APPROVAL-001`） |
| 依据需求 | `REQUIREMENTS.md`（`DSS-REQ-001~065`，已批准，本任务未改动） |
| 依据验收 | `ACCEPTANCE.md`（`DSS-AC-001~068` 全部 `NOT_RUN`，已批准，本任务未改动） |
| 数据库事实依据 | `docs/database/reports/DATA-SOURCE-SNAPSHOT-STATUS-DATABASE-VERIFICATION-001.md`（已提交数据库只读复核报告，提交 `72b305a`；本任务未访问数据库） |
| 执行分支 | `develop` |
| 本报告是否自引用本次结果提交 | 否（本报告不预填尚未产生的 result_commit_id；结果提交与推送结果见任务提交记录与本任务机器可读输出 `AGENT_TASK_RESULT`） |

## 2. 任务范围与目标

把已经项目负责人批准的需求与验收基线（65 条 `DSS-REQ-001~065`、68 条 `DSS-AC-001~068` 全部 `NOT_RUN`）转换为四份**可复审、可实现、可测试的设计草案**：

- `DESIGN.md`（总设计入口：架构、读取流程、状态机、并发、追踪矩阵、设计决策）
- `API.md`（只读接口设计草案：唯一 `GET /api/monitor/data-source-run-state/list`、参数、响应模型、错误码）
- `UI.md`（界面设计草案：查询区、七列表格、状态/异常视觉、工具栏、可访问性、命名映射）
- `DATABASE.md`（数据库查询设计草案：三表投影、保行、分类、排序、只读契约、测试 DML 授权边界）

约束与边界：

- **不改变任何已批准业务规则**；`REQUIREMENTS.md`/`ACCEPTANCE.md` 及其全部 `DSS-REQ-*`/`DSS-AC-*` 业务行相对批准内容基准 `4234af7` 保持逐字节零差异。
- 设计草案建立不等于设计已批准；design_status 只能是 `DRAFT_PENDING_USER_REVIEW`，不得写成 `APPROVED`。
- 功能不得写成 `IMPLEMENTED`/`IMPLEMENTED_PENDING_REVIEW`/`IMPLEMENTED_ACCEPTED`；68 条验收保持全部 `NOT_RUN`。
- 不编码、不执行测试/构建/验收、不访问或操作数据库/ZooKeeper/Kafka/sync-client、不启停服务。

## 3. 环境与前置检查

| 检查项 | 结果 |
|---|---|
| 当前目录 | `/agent/cdc-config-platform`（Git 仓库） |
| 当前分支 | `develop` |
| 本任务开始前 Commit ID（base） | `38da355f16438ad0d9156acdd667e9258fe89141` |
| `origin/develop`（本地跟踪引用） | `38da355f16438ad0d9156acdd667e9258fe89141` |
| ahead/behind | `0/0`（本地 HEAD 与 `origin/develop` 一致，无分叉） |
| 与本任务无关的既有工作区修改 | 存在大量用户既有未提交内容（110+ 项）；保持原样，未清理、未覆盖、未暂存、未提交，未使用任何破坏性 Git 命令 |
| 环境预检 | 纯文档任务；不要求后端/前端/数据库/ZooKeeper 环境（验证矩阵 `NOT_APPLICABLE`） |

## 4. 允许修改范围（白名单，7 个文件）

| 序号 | 文件 | 操作 |
|---|---|---|
| 1 | `docs/features/data-source-snapshot-status/DESIGN.md` | 新增（总设计草案，546 行） |
| 2 | `docs/features/data-source-snapshot-status/API.md` | 新增（接口设计草案，319 行） |
| 3 | `docs/features/data-source-snapshot-status/UI.md` | 新增（界面设计草案，307 行） |
| 4 | `docs/features/data-source-snapshot-status/DATABASE.md` | 新增（数据库查询设计草案，211 行） |
| 5 | `docs/features/data-source-snapshot-status/README.md` | 修改（设计草案状态与文档导航同步） |
| 6 | `docs/features/README.md` | 修改（仅本 Feature 设计草案事实同步） |
| 7 | `docs/features/data-source-snapshot-status/reports/DATA-SOURCE-SNAPSHOT-STATUS-DESIGN-BASELINE-001.md` | 新增（本报告） |

严禁修改 `REQUIREMENTS.md`、`ACCEPTANCE.md`、R0/R1/R2/R3 需求草案报告、批准收口报告、数据库只读复核报告、任何前后端代码、测试、依赖、构建配置、SQL/XML 或静态资源。实际 diff 仅包含上述 7 个文件。

## 5. 设计草案产出摘要

### 5.1 四份设计文档的关键设计决策（DESIGN §15.1，共 12 项已定决策，不推给项目负责人）

1. **唯一只读接口** `GET /api/monitor/data-source-run-state/list`，响应内嵌 `records+candidates`（DESIGN §5.8/§6、API §3）。
2. **全量读取 + 服务层过滤**（非动态 SQL WHERE），保证候选不被筛选收窄且响应内行集/候选同快照（DESIGN §5.1/§6）。
3. **时间以 SQL `TO_CHAR` 字符串透传**（`YYYY-MM-DD HH:mm:ss`）、JSON 显式 null、UI `--`（DESIGN §5.7、API §5、DB §9）。
4. **状态分类 `classify`**（token `RUNNING`/`COMPLETED`/`UNKNOWN`）统一用于筛选/展示/候选；原始值 `SNAPSHOT_RUNNING`/`SNAPSHOT_COMPLETED`（DESIGN §5.5、DB §5）。
5. **关联异常标志**：探针端/源库映射状态 `ACTIVE`/`INACTIVE`/`NOT_FOUND`，源库另含 `sourceRole`，类别大小写不敏感归一、非 SOURCE 仅弱提示不丢行（DESIGN §5.6）。
6. **状态候选**恒含 `RUNNING`/`COMPLETED`，未知状态候选仅在确有未知行时动态出现，候选来自 RUN_STATE 全量、不被筛选收窄（DESIGN §6.1、DB §6）。
7. **前端 store 持“上次成功现场”**、composable 持“单飞行 + seq + 计时器瞬态”，两阶段查询条件（界面选择条件/已应用查询条件）用哨兵草稿模型（DESIGN §7）。
8. **计时器在每次真实请求结束后重启完整 60 秒（成败皆然）**；被抑制触发不重置计时、页面不可见停止计时且不保留剩余秒数、恢复可见立即刷新后重启完整周期（DESIGN §7.5/§8）。
9. **包/类名**置于 `monitor/datasourcerunstate` 并选用不与既有 Mapper 撞名的类名（`RunStateClientMapper`/`RunStateDataSourceMapper`/`DataSourceRunStateMapper`），规避 `@MapperScan` bean-name 冲突（DESIGN §4.2）。
10. **错误码** `41001/41002`（`41xxx` 段当前无模块占用）（DESIGN §4.1、API §8）。
11. **行键** = `clientId + '\x00' + dataSourceId`（NUL 分隔，复用 topic-offset rowKey 方案）；序号前端按排序结果生成（DESIGN §15.1-11、API §6）。
12. **不分页**：页面一次加载全部记录，不出现 `pageNum/pageSize/pages/total` 字段（API §6）。

### 5.2 跨文档统一契约（DESIGN §14.1，四份文档共同遵守）

| 契约 | 值 |
|---|---|
| 接口 | `GET /api/monitor/data-source-run-state/list`（1 个 GET 端点） |
| 查询参数 | `clientId`/`sourceId`/`status`（List，省略 = 全部） |
| 状态 token | `RUNNING`/`COMPLETED`/`UNKNOWN` |
| 原始状态值 | `SNAPSHOT_RUNNING`/`SNAPSHOT_COMPLETED` |
| 中文标签 | 快照进行中 / 快照已完成 / 未知状态 |
| 时间格式 | `YYYY-MM-DD HH:mm:ss`；JSON 显式 null；UI `--` |
| 关联映射状态 | `ACTIVE`/`INACTIVE`/`NOT_FOUND`（源库另含 `sourceRole`） |
| 错误码 | `41001`（筛选 ID 超上限 200）/ `41002`（非法状态值） |
| 行键 | `clientId + '\x00' + dataSourceId`（NUL 分隔） |
| 候选范围 | 来自 RUN_STATE 全量、不被筛选收窄 |
| 刷新状态机 | 两阶段条件 + 请求快照 + 60 秒计时，完全贯彻 `DSS-REQ-022~025/050~054/058~061` |
| 排序 | 状态 `RUNNING(0)<UNKNOWN(1)<COMPLETED(2)`，同状态 `UPDATED_AT DESC`，再按 `CLIENT_ID`、`DATA_SOURCE_ID` 升序稳定（DB §8） |

### 5.3 数据表与读写边界（DATABASE §3）

`CDC_DATA_SOURCE_RUN_STATE`（由 sync-client 维护，`cdc-config` 绝对只读，只允许 `SELECT`）；`CDC_CLIENT_MULTIPLE`、`CDC_DATA_SOURCE` 仅可选 LEFT JOIN 补充探针端/源库展示信息，绝不改变 RUN_STATE 驱动的行集合，也绝不因 JOIN 失败而隐藏 RUN_STATE 原始行。物理表事实（6 字段、复合主键、无外键）一律以已提交数据库只读复核报告为权威依据，本任务不重新查询数据库。测试数据 DML 的未来授权仅限开发库、仅 `CDC_DATA_SOURCE_RUN_STATE`、备份/恢复、禁 DDL/其他表/生产（`DSS-REQ-065`，DB §13），属后续测试任务前置授权，本任务不执行。

## 6. 状态边界（草案建立后）

| 输出字段 | 值 |
|---|---|
| requirements_status | `APPROVED`（保持，65 条业务行相对批准内容基准逐字节零差异） |
| acceptance_status | `APPROVED`（保持，68 条业务行全部 `NOT_RUN`、逐字节零差异） |
| design_status | `DRAFT_PENDING_USER_REVIEW`（四份设计草案已建立、未批准） |
| implementation_status | `NOT_STARTED`（页面仍为占位，后端仍无 RUN_STATE 访问链路） |
| acceptance_execution_status | `NOT_RUN`（保持） |
| pending_user_review | `NO` |
| pending_user_confirmation_count | `0`（DESIGN §15.2：0 项待确认设计项） |
| requirements_design_coverage | 65/65（DESIGN §14.2） |
| acceptance_design_coverage | 68/68（DESIGN §14.3） |
| design_document_count | 4 |
| api_endpoint_count | 1 |
| 验收用例状态 | `DSS-AC-001~068` 共 68 条全部 `NOT_RUN`（保持） |

必须反复明确：

> 设计草案已建立不等于设计已批准；本任务不批准设计、不实现代码、不执行验收。功能仍为占位（`NOT_STARTED`），68 条验收仍全部 `NOT_RUN`。当前状态不是 `IMPLEMENTED`/`PASS`/`ACCEPTED`/`IMPLEMENTED_ACCEPTED`，也未把“设计草案已建立”写成“设计已批准”。

## 7. 各文件落地

- `DESIGN.md`：总设计入口。§1 元数据与文档状态声明；§2 目标边界与状态机概要；§3 现状盘点（AS-IS 事实，不虚构实现）；§4 架构分层与包/类名（避开撞名）；§5 数据模型/状态分类/关联异常标志/时间与格式；§6 候选数据与筛选层；§7 前端状态存放与两阶段条件、计时器；§8 事件表 E1~E16 与刷新状态机；§9 并发与竞态；§10 表头与列；§11 错误与边界；§12 只读与安全；§13 测试数据 DML 授权边界；§14 跨文档一致性清单与需求/验收落点矩阵（65/65、68/68）；§15 12 项已定决策与 0 项待确认。
- `API.md`：唯一只读接口草案。§2 通用约定（HTTP、Jackson、时间、null、错误响应）；§3 端点列表（1 个 GET）；§4 参数（`clientId`/`sourceId`/`status`，省略=全部，上限 200）；§5 响应模型（`SnapshotStatusListVO{records,candidates}`、`SnapshotStatusItemVO`、candidates 结构）；§6 条目字段、序号、行键、不分页；§7 示例（含空、未知状态、关联缺失、失败）；§8 错误码 `41001/41002`。
- `UI.md`：界面草案。§2 页面结构；§3 查询区（三个多选条件、双状态、重置不查询）；§4 表格（七列：序号/探针端/源库/快照状态/快照启动时间/快照完成时间/记录更新时间）；§5 状态与异常视觉（蓝/绿/橙标签、单元格小图标/Tooltip）；§6 刷新工具栏（稳定宽度按钮、不抖动）；§7 加载/空/失败/可见性状态；§8 Tooltip 与可访问性；§10 命名映射（用户可见名“源库快照状态”，路由 `/monitor/data-source-state` 与目录 `views/data-source-run-state/` 保持既有值）。
- `DATABASE.md`：数据库查询草案。§3 三表投影与只读边界；§4 保行等价方案（独立全量只读 SELECT + 服务层内存关联，等价于不丢行的 LEFT JOIN）；§5 状态分类 SQL/服务层口径；§6 候选从全量派生、不被收窄；§7 筛选安全（服务层过滤，不生成动态 WHERE）；§8 排序；§9 `TO_CHAR` 时间格式化；§10 Mapper 显式列名；§11 性能（无需新索引）；§12 异常/日志容忍；§13 只读契约与测试 DML 授权分离。
- Feature `README.md`：§1 design_status 更新为 `DRAFT_PENDING_USER_REVIEW`、当前阶段/实现状态/验收执行状态更新为草案已建立口径；§5 文档导航把 DESIGN 拆为 DESIGN/API/UI/DATABASE 四行并新增本报告行；§8 追加设计草案建立说明；§9 状态声明补充设计仅草案；§10 下一入口更新为 ChatGPT 对设计草案正式复审。
- `docs/features/README.md`：仅同步 `data-source-snapshot-status` 当前状态（基线覆盖增加 DESIGN/API/UI/DATABASE；col4/col5 增补设计草案 `DRAFT_PENDING_USER_REVIEW` 说明；col6 增补设计草案建立报告与设计落点完整说明；col7/col8 当前缺口与下一入口更新），并追加该 Feature 设计草案建立变更记录；不改变其他 Feature 的任何事实或状态。

## 8. 编号、计数与追踪校验

| 验证项 | 结果 |
|---|---|
| 需求编号 `DSS-REQ-001~065` | 65 条连续唯一（脚本核验通过，未增删改号） |
| 验收编号 `DSS-AC-001~068` | 68 条连续唯一，全部 `NOT_RUN`（脚本核验通过，未增删改号） |
| 需求业务行相对批准内容基准零差异 | `ZERO`（本任务未修改 `REQUIREMENTS.md`） |
| 验收业务行相对批准内容基准零差异 | `ZERO`（本任务未修改 `ACCEPTANCE.md`） |
| DESIGN §14.2 需求落点矩阵覆盖 | 65/65（脚本核验 `DSS-REQ-001~065` 全数出现、无悬空需求） |
| DESIGN §14.3 验收落点矩阵覆盖 | 68/68（脚本核验 `DSS-AC-001~068` 全数出现、无悬空验收；反向引用均在 `DSS-REQ-001~065` 内） |
| 设计落点锚点可解析性 | DESIGN 23 个、API 7 个、UI 29 个、DATABASE 11 个引用锚点全部解析到对应文档既有章节，无悬空锚点 |
| 跨文档计数一致性（四份设计文档 + 两份 README） | 通过（REQ 65 / AC 68 全部 `NOT_RUN` / pending=0 / 接口 1 / 设计文档 4） |
| 越权状态词检查（把设计草案写成设计已批准 / 把功能写成已实现 / 把验收写成 PASS/FAIL/`IMPLEMENTED_ACCEPTED`） | 通过（全文仅以否定/边界限定语境出现） |
| 所有变更文件文本完整性 | 通过（四份新增设计文档在行键代码段曾混入实 NUL 字节，已原位替换为字面 `\x00` 文本并复核为纯 UTF-8 文本，全部变更文件 0 NUL/二进制字节） |

## 9. 未执行事项

- 未批准设计草案（design_status 保持 `DRAFT_PENDING_USER_REVIEW`）；下一入口为 ChatGPT 对四份设计草案正式复审，批准前不进入实现。
- 未实现或修改任何前后端代码、测试、依赖、构建配置、SQL/XML 或静态资源；页面仍为占位页。
- 未执行任何验收（全部 `DSS-AC-*` 保持 `NOT_RUN`）。
- 未访问数据库、未执行 DML/DDL、未操作 ZooKeeper/TongZK、Kafka、sync-client，未启动/停止/重启任何服务。
- 未修改任何 `DSS-REQ-*` 业务行、任何 `DSS-AC-*` 业务行及其 `NOT_RUN` 状态、需求—验收追踪矩阵业务映射；`REQUIREMENTS.md`/`ACCEPTANCE.md` 未改动。
- R0/R1/R2/R3 需求草案报告、批准收口报告、数据库只读复核报告等白名单外文件未改动。
- 工作区既有与本任务无关的未提交修改保持原样，未纳入本次提交。

## 10. 结果汇总

| 输出字段 | 值 |
|---|---|
| 任务状态 | `COMPLETED`（四份设计草案建立完成；设计未批准、功能未实现、验收未执行） |
| 任务编号 | `DATA-SOURCE-SNAPSHOT-STATUS-DESIGN-BASELINE-001` |
| 分支 | `develop` |
| base_commit_id | `38da355f16438ad0d9156acdd667e9258fe89141` |
| requirements_status | `APPROVED` |
| acceptance_status | `APPROVED` |
| design_status | `DRAFT_PENDING_USER_REVIEW` |
| implementation_status | `NOT_STARTED` |
| acceptance_execution_status | `NOT_RUN` |
| requirements_count | 65 |
| acceptance_count | 68 |
| acceptance_not_run_count | 68 |
| design_document_count | 4 |
| api_endpoint_count | 1 |
| requirements_design_coverage | 65/65 |
| acceptance_design_coverage | 68/68 |
| traceability_status | `COMPLETE` |
| pending_user_confirmation_count | 0 |
| requirements_file_diff | `ZERO` |
| acceptance_file_diff | `ZERO` |
| database_access_status | `NONE` |
| database_write_status | `NONE` |
| ddl_status | `NONE` |
| zookeeper_access_status | `NONE` |
| kafka_access_status | `NONE` |
| service_operation_status | `NONE` |
| code_change_status | `NONE` |
| test_build_status | `NOT_RUN`（纯文档任务，验证矩阵 `NOT_APPLICABLE`） |
| push_status | 本任务按治理提示 §14 授权执行 commit + 普通 push 至 `origin/develop`（非强推）；推送后本地 HEAD、`origin/develop`、远程 `refs/heads/develop` 三者一致、ahead/behind=0/0，详见任务提交记录与本任务机器可读输出 |
| 变更文件 | 白名单 7 个文件（见 §4） |

下一入口：**ChatGPT 对四份设计草案（DESIGN.md / API.md / UI.md / DATABASE.md）进行正式复审**；复审通过并由项目负责人批准后，才进入实现阶段。本设计草案任务不得批准设计、实现代码或执行验收。
