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
| 需求基线 | `DRAFT_PENDING_USER_REVIEW`（第一版需求草案，未批准；见 `REQUIREMENTS.md`） |
| 验收标准 | `DRAFT_PENDING_USER_REVIEW`（第一版验收标准草案，未批准；见 `ACCEPTANCE.md`；全部 `DSS-AC-*` 状态为 `NOT_RUN`） |
| 实现状态 | `NOT_STARTED` |
| 验收执行状态 | `NOT_RUN` |
| 设计状态 | `NOT_STARTED`（DESIGN.md / API.md / UI.md / DATABASE.md 均未建立） |
| 当前阶段 | 需求与验收草案待用户（及 ChatGPT 正式复审）审阅，未进入设计、实现或验收执行 |

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
| `README.md`（本文件） | Feature 定位、命名映射、文档导航与状态 | 已随本任务建立（2026-09-05） |
| `REQUIREMENTS.md` | 需求草案（`DSS-REQ-001~065`） | `DRAFT_PENDING_USER_REVIEW`（未批准、未实现） |
| `ACCEPTANCE.md` | 验收标准草案（`DSS-AC-001~067`，全部 `NOT_RUN`） | `DRAFT_PENDING_USER_REVIEW`（未批准、未执行） |
| `DESIGN.md` / `API.md` / `UI.md` / `DATABASE.md` | 设计基线 | 未建立（`NOT_STARTED`） |
| `reports/DATA-SOURCE-SNAPSHOT-STATUS-REQUIREMENTS-BASELINE-001.md` | 本任务（需求与验收草案建立）执行报告 | 已建立（本任务） |
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

## 8. 当前开放事项与草案建议

- 需求与验收草案待用户审阅，待 ChatGPT 正式复审。
- 三个查询条件（探针端、源库、快照状态）采用单选还是多选、是否包含显式“全部”尚未由项目负责人指定。
- 加载态、刷新失败保留旧结果、最近成功刷新时间、手工刷新按钮加载表现、状态标签颜色、Tooltip/轻量异常提示形式、时间展示格式等实现与交互细节尚未指定。
- 以上各项在本 Feature 中以 `DRAFT_PROPOSAL_PENDING_USER_REVIEW` 标记，并集中列入 `REQUIREMENTS.md` “待用户复审的草案建议”章节，不伪装成已确认事实。
- 数据库对该表测试数据 DML 的未来授权（仅限开发库、仅本表、备份/恢复、禁 DDL/其他表/生产）已精确记录于 `REQUIREMENTS.md`；本草案任务不访问数据库。

## 9. 当前阶段与声明

- 本 Feature 当前状态：`requirements_status=DRAFT_PENDING_USER_REVIEW`、`acceptance_status=DRAFT_PENDING_USER_REVIEW`、`implementation_status=NOT_STARTED`、`acceptance_execution_status=NOT_RUN`、`design_status=NOT_STARTED`、`pending_user_review=YES`。
- 需求草案与验收标准草案**均未批准**：不代表功能已实现、不代表验收已执行或通过。
- 功能**未实现**：页面仍为占位，后端无访问链路。
- 验收**未执行**：`DSS-AC-*` 全部 `NOT_RUN`。
- 不得把本 README 中“目标/后续实现阶段”描述为当前已实现事实，不得写成 `APPROVED`、`IMPLEMENTED`、`PASS`、`ACCEPTED` 或验收通过。

## 10. 下一流程入口

下一入口为 **ChatGPT 对 `REQUIREMENTS.md` 与 `ACCEPTANCE.md` 草案进行正式复审**，随后由项目负责人审阅/批准需求与验收草案；批准后再进入设计阶段（DESIGN/API/UI/DATABASE）。本任务本身不进入设计，不实现代码，不执行验收。
