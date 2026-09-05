# 源库快照状态 Feature（data-source-snapshot-status）导航与状态

## 1. Feature 身份

| 项目 | 值 |
|---|---|
| 用户可见名称 | 源库快照状态（页面、菜单、路由元数据标题、面包屑最终统一使用的名称；当前 Git 已提交与工作区菜单、路由元数据、占位页标题仍为“数据源运行状态”，更名尚未实施，见 §6） |
| Feature 内部标识 | `data-source-snapshot-status`（Feature 文档目录标识；任务代码前缀 `DATA-SOURCE-SNAPSHOT-STATUS`） |
| 所属模块 | 运行监控 |
| 既有路由 | `/monitor/data-source-state`（保持既有值不变，不因功能更名改 URL） |
| 前端源码目录 | `frontend/src/views/data-source-run-state/`（保留既有目录名，不做无业务价值的目录重命名；命名映射见 §6） |
| 当前实现 | 占位（`frontend/src/views/data-source-run-state/DataSourceRunStatePage.vue` 为 `PlaceholderPage` 占位页，标题“数据源运行状态”；路由已存在；后端当前没有针对 `CDC_DATA_SOURCE_RUN_STATE` 的访问链路） |
| 需求基线 | `DRAFT_PENDING_USER_REVIEW`（需求草案经 R1、R2 定向修订，未批准；见 `REQUIREMENTS.md`） |
| 验收标准 | `DRAFT_PENDING_USER_REVIEW`（验收标准草案经 R1、R2 定向修订，未批准；见 `ACCEPTANCE.md`；全部 `DSS-AC-001~068` 状态为 `NOT_RUN`） |
| 实现状态 | `NOT_STARTED` |
| 验收执行状态 | `NOT_RUN` |
| 设计状态 | `NOT_STARTED`（DESIGN.md / API.md / UI.md / DATABASE.md 均未建立） |
| 待确认草案建议 | 0（`pending_user_confirmation_count=0`；原 `DSS-PROP-001~008` 已全部决策吸收，不等于已批准） |
| 当前阶段 | 需求与验收草案（R2 定向修订版）待 ChatGPT 正式复审与用户审阅/批准，未进入设计、实现或验收执行 |

## 2. Feature 定位

“源库快照状态”是 CDC 配置管理平台“运行监控”模块下的一个**绝对只读**监控页面。页面读取数据库表 `CDC_DATA_SOURCE_RUN_STATE`，展示“探针端（`CLIENT_ID`）＋源库（`DATA_SOURCE_ID`）”组合的**源库初始快照阶段状态**：快照进行中（`SNAPSHOT_RUNNING`）或快照已完成（`SNAPSHOT_COMPLETED`），以及三个时间字段（快照启动时间、快照完成时间、记录更新时间）。

该页面**不**表示 sync-client 是否在线、健康、失联，也不表示增量采集是否正常或当前同步进度。`CDC_DATA_SOURCE_RUN_STATE` 由 `sync-client` 进程维护，`cdc-config`（本仓库交付物）对其严格只读：页面与后端只提供查询，不提供任何新增、修改、删除、重置、重新快照、重试或批量操作。

## 3. 业务背景与用途

1. 每一条记录表达“探针端＋源库”组合的初始快照状态。
2. sync-client 启动时读取该表并据此决策（跨程序业务事实）：对应 `SNAPSHOT_COMPLETED` 只做增量采集；无记录时插入 `SNAPSHOT_RUNNING` 并执行快照，完成后更新为 `SNAPSHOT_COMPLETED`；对应 `SNAPSHOT_RUNNING` 时重新执行快照。
3. 本仓库只包含 `cdc-config`，不包含 sync-client 源码；本 Feature 不修改、不重复实现、不调用 sync-client 逻辑。
4. 记录进入 `SNAPSHOT_COMPLETED` 后通常不再更新；本页面与后端不得用 `UPDATED_AT` 或其他时间字段推断 sync-client 在线、健康、离线或异常。
5. 本页面用于让运维/开发人员查看各“探针端＋源库”组合当前处于哪个初始快照阶段，辅助判断哪些源库已完成初始快照、哪些仍在执行。

## 4. 数据表与读写边界

| 数据对象 | 用途 | 读写边界 |
|---|---|---|
| `CDC_DATA_SOURCE_RUN_STATE`（Oracle，CDC Schema） | 记录“探针端＋源库”组合的初始快照状态 | 由 sync-client 维护；`cdc-config` 对其**绝对只读**，只允许 `SELECT`，不允许任何 `INSERT/UPDATE/DELETE/MERGE` |
| `CDC_CLIENT_MULTIPLE`、`CDC_DATA_SOURCE`（可选 LEFT JOIN 展示信息） | 仅用于补充探针端描述、源库 ORG 等展示信息 | 只读；JOIN 只补充展示，绝不改变 RUN_STATE 驱动的行集合，也绝不因 JOIN 失败而隐藏 RUN_STATE 原始行 |

数据表物理事实以已提交数据库只读复核报告为权威依据（见 §5），本 Feature 文档不重新查询数据库。

## 5. 文档导航与状态

| 文档 | 职责 | 状态 |
|---|---|---|
| `README.md`（本文件） | Feature 定位、命名映射、文档导航与状态 | 已建立（2026-09-05）；随 R1 修订同步 |
| `REQUIREMENTS.md` | 需求草案（`DSS-REQ-001~065`，R2 定向修订版） | `DRAFT_PENDING_USER_REVIEW`（未批准、未实现） |
| `ACCEPTANCE.md` | 验收标准草案（`DSS-AC-001~068`，全部 `NOT_RUN`，R2 定向修订版） | `DRAFT_PENDING_USER_REVIEW`（未批准、未执行） |
| `DESIGN.md` / `API.md` / `UI.md` / `DATABASE.md` | 设计基线 | 未建立（`NOT_STARTED`） |
| `reports/DATA-SOURCE-SNAPSHOT-STATUS-REQUIREMENTS-BASELINE-001.md` | 本任务（需求与验收草案建立）执行报告 | 已建立（初版） |
| `reports/DATA-SOURCE-SNAPSHOT-STATUS-REQUIREMENTS-BASELINE-001-R1.md` | 本任务（R1 定向修订）执行报告 | 已建立（R1） |
| `reports/DATA-SOURCE-SNAPSHOT-STATUS-REQUIREMENTS-BASELINE-001-R2.md` | 本任务（R2 最小定向修订）执行报告 | 已建立（R2） |
| `docs/database/reports/DATA-SOURCE-SNAPSHOT-STATUS-DATABASE-VERIFICATION-001.md` | `CDC_DATA_SOURCE_RUN_STATE` 数据库只读复核报告（已提交，提交 `72b305a`） | 已建立；本 Feature 的数据库事实一律以该报告为依据 |

## 6. 页面与路由现状（AS-IS 事实）

| 项 | 当前事实 | 目标（后续实现阶段） |
|---|---|---|
| 路由 | `/monitor/data-source-state`（`frontend/src/router/index.ts`，name `DataSourceRunState`） | 保持 `/monitor/data-source-state` 不变 |
| 前端源码目录 | `frontend/src/views/data-source-run-state/DataSourceRunStatePage.vue`（`PlaceholderPage` 占位页） | 目录名保留；页面替换为正式实现 |
| 菜单项 | `frontend/src/config/menu.ts` 中“运行监控”组下“数据源运行状态”（path `/monitor/data-source-state`） | 标题更新为“源库快照状态” |
| 页面标题 | 占位页标题“数据源运行状态”（group 运行监控） | 更新为“源库快照状态” |
| 面包屑/路由元数据 | “数据源运行状态” | 更新为“源库快照状态” |

命名映射（保持既有值，供实现与文档对齐）：路由 `/monitor/data-source-state` ↔ 代码目录 `frontend/src/views/data-source-run-state/` ↔ Feature slug `data-source-snapshot-status` ↔ 用户可见名“源库快照状态”。

当前 `menu.ts`、`HeaderBar.vue`、`MainLayout.vue`、`Sidebar.vue`、`router/index.ts` 等存在工作区未提交修改（用户既有内容），本 Feature 文档不修改、不提交这些文件。

## 7. 数据规模假设

开发环境当前仅 1 条 `SNAPSHOT_RUNNING` 样例；生产规模预期最多约 100 条记录。页面一次加载全部符合条件的记录，不分页、不提供每页条数与翻页控件。该数量与状态分布是规模假设与数据快照事实，不是数据库强约束。

## 8. 已决策交互方案与当前开放状态（R1、R2）

- 三个查询条件（探针端、源库、快照状态）均为多选控件，默认“全部”，“全部”与具体候选互斥，同条件内“或”、条件间“且”；未知状态候选仅在真实存在未知记录时动态出现；已建立“界面选择条件 / 已应用查询条件”双状态，点击“查询”才应用，查询区“重置”只恢复界面三项“全部”且本身不发起查询、不清表、不改已应用条件（已并入 `REQUIREMENTS.md` `DSS-REQ-022~025`，验收 `DSS-AC-020~024`）。
- 源库列单行展示（关联成功优先显示 ORG、Tooltip 展示原始 ID，关联不到直接显示原始 ID 并弱提示）；状态标签蓝（RUNNING“快照进行中”）、绿（COMPLETED“快照已完成”）、橙（未知“未知状态”）且文字＋颜色并存；三个时间字段统一 `YYYY-MM-DD HH:mm:ss`、空值 `--`；查询/刷新失败保留最近一次成功数据、提示收敛、展示最近成功刷新时间、失败脱敏、在途不闪烁；关联异常用单元格内小图标/弱提示文字＋Tooltip、不新增专门异常列；恢复可见后立即按已应用条件刷新一次并重启 60 秒计时；刷新工具栏“立即刷新”按钮稳定宽度、加载图标不改变宽度、文字不位移、工具栏无水平抖动（已并入 `DSS-REQ-029/035/036/038/045/050/051/054/055/061`，验收 `DSS-AC-027/032/033/035/037/042/047/048/051/052/058/068`）。
- 原 8 项 `DRAFT_PROPOSAL_PENDING_USER_REVIEW` 草案建议（`DSS-PROP-001~008`）已全部由项目负责人确认并吸收为正式需求/验收，`pending_user_confirmation_count=0`；处置映射见 `REQUIREMENTS.md` §22。
- R2 最小定向修订（ChatGPT 对 R1 结果正式复审 `CHANGES_REQUIRED` 后）已在既有需求/验收行内消除两个剩余歧义（未增号、未改数）：①“新条件查询失败”：保留上一次成功结果与上一次“已应用查询条件”，新条件不升级、界面控件保留新选择、后续自动/立即刷新仍用旧已应用条件，仅查询成功（含成功返回 0 条空结果）才把点击瞬间捕获的请求快照升级为“已应用查询条件”，首次失败仍保持初始三项“全部”；②“失败后的 60 秒计时”：页面可见时每次实际请求结束（无论成功失败）都从请求结束重新开始完整 60 秒周期，刷新失败约 60 秒后按已应用条件正常自动重试（不停止、不立即无间隔重试），被抑制触发不视为实际请求、不单独重置计时，页面不可见停止计时且不保留剩余秒数复用，恢复可见立即刷新后重启完整周期，“最近成功刷新时间”仅成功后更新。
- 需求与验收草案（R2 定向修订版）仍未批准：待 ChatGPT 对 R2 结果正式复审，复审后由项目负责人审阅/批准；`pending_user_confirmation_count=0` 不等于已批准。
- 数据库对 `CDC_DATA_SOURCE_RUN_STATE` 测试数据 DML 的未来授权（仅限开发库、仅本表、备份/恢复、禁 DDL/其他表/生产）已精确记录于 `REQUIREMENTS.md`；本草案任务不访问数据库。

## 9. 当前阶段与声明

- 本 Feature 当前状态：`requirements_status=DRAFT_PENDING_USER_REVIEW`、`acceptance_status=DRAFT_PENDING_USER_REVIEW`、`implementation_status=NOT_STARTED`、`acceptance_execution_status=NOT_RUN`、`design_status=NOT_STARTED`、`pending_user_review=YES`、`pending_user_confirmation_count=0`。
- 需求草案与验收标准草案**均未批准**：不代表功能已实现、不代表验收已执行或通过；`pending_user_confirmation_count=0` 不等于已批准。
- 功能**未实现**：页面仍为占位，后端无访问链路。
- 验收**未执行**：`DSS-AC-001~068` 全部 `NOT_RUN`。
- 不得把本 README 中“目标/后续实现阶段”描述为当前已实现事实，不得写成 `APPROVED`、`IMPLEMENTED`、`PASS`、`ACCEPTED` 或验收通过。

## 10. 下一流程入口

下一入口为 **ChatGPT 对 R2 定向修订结果（即 `REQUIREMENTS.md` 与 `ACCEPTANCE.md` R2 定向修订版草案）进行正式复审**，随后由项目负责人审阅/批准需求与验收草案；批准后再进入设计阶段（DESIGN/API/UI/DATABASE）。本任务（R2）本身不进入设计，不实现代码，不执行验收。
