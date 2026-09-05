# 源库快照状态 Feature 需求草案（REQUIREMENTS）

## 1. 元数据与文档状态

| 项目 | 值 |
|---|---|
| Feature 中文名称 | 源库快照状态（页面、菜单、路由元数据标题、面包屑最终统一使用的用户可见名称；当前菜单、路由元数据与占位页标题仍为“数据源运行状态”，更名尚未实施） |
| Feature 标识 | `data-source-snapshot-status`（Feature 文档目录标识；任务代码前缀 `DATA-SOURCE-SNAPSHOT-STATUS`） |
| 所属模块 | 运行监控 |
| 既有路由 | `/monitor/data-source-state`（保持既有值不变） |
| 前端源码目录 | `frontend/src/views/data-source-run-state/`（保留既有目录名；命名映射见 README §6） |
| 前端现状 | `frontend/src/views/data-source-run-state/DataSourceRunStatePage.vue` 为 `PlaceholderPage` 占位页（AS-IS 事实） |
| 后端现状 | 当前没有针对 `CDC_DATA_SOURCE_RUN_STATE` 的后端访问链路（AS-IS 事实） |
| 目标文档 | `docs/features/data-source-snapshot-status/REQUIREMENTS.md` |
| 文档状态 | `DRAFT_PENDING_USER_REVIEW`（需求草案，未批准、未实现、未执行验收） |
| requirements_status | `DRAFT_PENDING_USER_REVIEW` |
| acceptance_status | `DRAFT_PENDING_USER_REVIEW`（见 `ACCEPTANCE.md`） |
| 实现状态 | `NOT_STARTED`（implementation_status=NOT_STARTED） |
| 验收执行状态 | `NOT_RUN`（acceptance_execution_status=NOT_RUN） |
| 设计状态 | `NOT_STARTED`（design_status=NOT_STARTED；DESIGN.md / API.md / UI.md / DATABASE.md 均未建立） |
| pending_user_review | `YES` |
| 初版任务编号 | `DATA-SOURCE-SNAPSHOT-STATUS-REQUIREMENTS-BASELINE-001`（初版需求与验收草案建立） |
| 本版（R1）任务编号 | `DATA-SOURCE-SNAPSHOT-STATUS-REQUIREMENTS-BASELINE-001-R1`（ChatGPT 正式复审 `CHANGES_REQUIRED` 后的纯文档定向修订；历史版本） |
| 本版（R2）任务编号 | `DATA-SOURCE-SNAPSHOT-STATUS-REQUIREMENTS-BASELINE-001-R2`（ChatGPT 对 R1 结果正式复审 `CHANGES_REQUIRED` 后的纯文档最小定向修订；历史版本） |
| 本版（R3）任务编号 | `DATA-SOURCE-SNAPSHOT-STATUS-REQUIREMENTS-BASELINE-001-R3`（ChatGPT 对 R2 结果正式复审 `CHANGES_REQUIRED` 后的纯文档极小定向修订：只修正验收草案 `DSS-AC-024` 文字、不改任何需求业务语义；本版为最新修订后草案） |
| 任务类型 | 纯文档——需求与验收草案及 R1/R2/R3 定向修订（只修订功能级文档并提交、推送；严禁进入设计、编码、数据库访问或运行服务阶段） |
| 初版授权基线提交 | `72b305a8e4134d10f514920c215b9647fb7d9e3b`（初版任务开始时 `origin/develop` 最新提交） |
| 本版（R1）授权基线提交 | `91eb2209a99a65ef1d433c2fb1c815a1abcd5bd5`（R1 任务开始时 `origin/develop` 最新提交，本地 HEAD 与其一致，ahead/behind=0/0；历史基线） |
| 本版（R2）授权基线提交 | `0476c40a49f1a7aa6d48fe58194c92982276fd60`（R2 任务开始时 `origin/develop` 最新提交，本地 HEAD 与其一致，ahead/behind=0/0；历史基线） |
| 本版（R3）授权基线提交 | `5c58af6b0a378c8534ebc0b76eaa7bc75b6a847a`（R3 任务开始时 `origin/develop` 最新提交，本地 HEAD 与其一致，ahead/behind=0/0） |
| 文档版本 | R3 极小定向修订版（2026-09-05；本版为纯文档极小定向修订：只修正验收草案 `DSS-AC-024` 中“成功刷新却不更新最近成功刷新时间”的文字矛盾，并明确刷新成功不得替换“已应用查询条件”——只有用户点击“查询”且查询成功才允许替换；不改变任何需求业务语义；编号与计数不变——需求仍 65 条、验收仍 68 条、全部 `NOT_RUN`；`pending_user_confirmation_count=0`；仍为未批准草案，待 ChatGPT 对 R3 结果正式复审） |
| 创建日期 | 2026-09-05（初版）；本版 R1、R2、R3 修订同日 |
| 需求来源 | 项目负责人已确认的产品决策（任务提示词 §6）+ 已核验数据库只读复核报告（`docs/database/reports/DATA-SOURCE-SNAPSHOT-STATUS-DATABASE-VERIFICATION-001.md`）+ 既有 Feature 文档结构/术语约定（`topic-offset`、`client-config` 等仅作结构参考，不复制其业务规则）；本版 R1 依据 ChatGPT 正式复审意见（`CHANGES_REQUIRED`，R1-01~R1-03）与项目负责人已确认的 8 项交互方案、刷新工具栏稳定性要求、最新“重置不查询”决定（任务提示词 §5~§7）定向修订；本版 R2 依据 ChatGPT 对 R1 结果正式复审意见（`CHANGES_REQUIRED`，R2-01/R2-02）定向消除两个剩余歧义（任务提示词 §5~§6）；本版 R3 依据 ChatGPT 对 R2 结果正式复审意见（`CHANGES_REQUIRED`）极小定向修订验收草案 `DSS-AC-024` 文字（只指向“成功刷新却不更新最近成功刷新时间”的验收矛盾，任务提示词 §4~§6），不改变任何需求业务语义 |

文档事实边界声明：

- 用户已确认的业务规则在本文件中作为需求事实记录（`DSS-REQ-*`）。
- 仓库现状（路由、菜单标题、占位页、无后端访问链路）作为 AS-IS 事实记录，并标注来源。
- `CDC_DATA_SOURCE_RUN_STATE` 数据库物理事实全部引用已提交数据库只读复核报告（见 §3），本文件不重新查询数据库。
- 本文件 R1 版已取消全部 `DRAFT_PROPOSAL_PENDING_USER_REVIEW` 草案建议（原 `DSS-PROP-001~008`）：8 项交互方案已由项目负责人确认并吸收到相应 `DSS-REQ-*` / `DSS-AC-*`，`pending_user_confirmation_count=0`；本文件仍是未批准草案（最新为 R3 修订版），待 ChatGPT 对 R3 结果正式复审（`pending_user_confirmation_count=0` 不等于 `APPROVED`）。
- 本文件不得自行增加 sync-client 控制、写能力、时间区间分析、Kafka/ZooKeeper 接入等超出已确认范围的实现；不得把“后续可扩展”写成第一版必须实现。

## 2. Feature 定位与术语

### 2.1 Feature 定位

“源库快照状态”属于 CDC 配置管理平台“运行监控”模块，是一个**绝对只读**的初始快照状态监控页面。页面读取数据库表 `CDC_DATA_SOURCE_RUN_STATE`，展示“探针端＋源库”组合处于源库初始快照的哪个阶段（快照进行中 `SNAPSHOT_RUNNING` / 快照已完成 `SNAPSHOT_COMPLETED`）与三个时间字段。页面只展示 RUN_STATE 中真实存在的记录，不补行、不推断虚拟状态，对表数据严格只读。

### 2.2 术语

| 术语 | 说明 |
|---|---|
| 源库快照状态 | 页面与菜单的正式名称；内部 Feature 目录标识继续使用 `data-source-snapshot-status`，路由保持 `/monitor/data-source-state`。 |
| 探针端 | `CDC_CLIENT_MULTIPLE.CLIENT_ID` 标识的同步探针进程（`sync-client` 用自身 `client_id` 命中记录）。本列表“探针端”列展示 RUN_STATE 记录的 `CLIENT_ID` 原始值。 |
| 源库 | `CDC_DATA_SOURCE` 中类别为源库（SOURCE）的数据源，以 `DATA_SOURCE_ID` 标识。本列表“源库”列优先展示关联源库 ORG，并保证可查看原始 `DATA_SOURCE_ID`。 |
| CDC_DATA_SOURCE_RUN_STATE | 记录“探针端＋源库”组合初始快照状态的表；由 sync-client 维护，`cdc-config` 对其绝对只读。 |
| 快照进行中 | 原始状态值 `SNAPSHOT_RUNNING` 的中文展示。 |
| 快照已完成 | 原始状态值 `SNAPSHOT_COMPLETED` 的中文展示。 |
| 未知状态 | 数据库 `SNAPSHOT_STATUS` 取值不在已确认集合内的状态；宽容展示、不报错、不丢弃。 |
| sync-client | 同步探针进程，从源库读取数据并写入 Kafka 业务 Topic；按 `CDC_DATA_SOURCE_RUN_STATE` 决定是否执行初始快照。本仓库不含其源码。 |
| 虚拟状态 | “未开始”“待快照”“尚无快照记录”等由本页面推断生成的状态；本 Feature 不生成。 |
| 界面选择条件 | 查询区控件当前显示的值；用户修改或重置时可变化，不代表已生效的查询。 |
| 已应用查询条件 | 当前表格、自动刷新与“立即刷新”实际使用的查询条件组。页面初始化时初始化为三项默认“全部”并立即以此发起首次自动查询；此后仅当用户点击“查询”且该次查询成功返回（包括成功返回 0 条空结果）时，点击瞬间形成的“请求快照”才升级为新的“已应用查询条件”。按新条件查询失败时，“已应用查询条件”保持最近一次成功查询确立的条件不变，不使用尚未提交的界面选择条件。 |
| 请求快照 | 用户点击“查询”的瞬间对其界面选择条件复制得到的一组条件值；本次查询使用该快照发起。即使该请求进行期间界面控件再被修改，成功时升级为“已应用查询条件”的仍是请求开始时的快照，不是请求结束时控件的值。 |

## 3. 数据来源与已核验数据库事实

本 Feature 引用的 `CDC_DATA_SOURCE_RUN_STATE` 数据库事实，全部以已提交数据库只读复核报告为权威依据，本任务不重新查询数据库：

```text
docs/database/reports/DATA-SOURCE-SNAPSHOT-STATUS-DATABASE-VERIFICATION-001.md
```

已核验数据库事实摘要（来自上述报告；`OBSERVED_DATABASE`，非本 Feature 目标、非数据库强约束）：

- `CDC_DATA_SOURCE_RUN_STATE` 是 Oracle CDC Schema 下 `VALID` 状态普通表。
- 六字段：`CLIENT_ID`、`DATA_SOURCE_ID`、`SNAPSHOT_STATUS`、`SNAPSHOT_LAST_SEEN_AT`、`SNAPSHOT_COMPLETED_AT`、`UPDATED_AT`。
- `VARCHAR2` 字段均为 BYTE 语义（`CHAR_USED=B`）。
- 主键 `PK_CDC_DS_RUN_STATE(CLIENT_ID, DATA_SOURCE_ID)`。
- 四个非空字段：`CLIENT_ID`、`DATA_SOURCE_ID`、`SNAPSHOT_STATUS`、`UPDATED_AT`；`SNAPSHOT_LAST_SEEN_AT`、`SNAPSHOT_COMPLETED_AT` 可空。
- 无外键、无触发器、无状态封闭 Check 约束。
- 当前开发库只有 1 条 `SNAPSHOT_RUNNING` 样例（无 `SNAPSHOT_COMPLETED` 样例）；样例数据不是生产数量上限，状态分布不是数据库强约束。
- 当前代码无后端访问链路，前端仍为占位页。

## 4. 功能范围（范围内 / 范围外）

### 4.1 范围内

- 只读查询 `CDC_DATA_SOURCE_RUN_STATE`，按“探针端｜源库｜快照状态”条件筛选，一次加载全部结果、不分页；
- 展示七列列表信息（序号、探针端、源库、快照状态、快照启动时间、快照完成时间、记录更新时间）；
- 快照状态中文映射与未知状态宽容展示；
- 关联（探针端描述、源库 ORG）异常时的轻量兼容提示；
- 固定默认排序；60 秒自动刷新＋立即刷新；页面不可见暂停、恢复后继续；
- 空数据、加载、失败与恢复提示；
- 关联展示只读 LEFT JOIN（仅补充展示信息）。

### 4.2 范围外

- 对 `CDC_DATA_SOURCE_RUN_STATE` 的任何写动作（新增、修改、删除、重置、重新快照、重试、批量），以及任何写接口、写按钮或隐式写行为；
- 判断或展示 sync-client 在线、健康、失联、增量采集状态或同步进度；
- 从配置表补出 RUN_STATE 缺失的组合行；推断“未开始/待快照/尚无快照记录”等虚拟状态；
- 分页、每页条数、翻页控件；
- 时间范围、在线状态、健康状态、关键字等未批准查询条件；
- 操作列、详情、编辑、删除、跳转或任何写操作入口；
- 依据任何时间字段计算“超时/异常/离线/长期运行”；
- 连接或调用 sync-client、Kafka、ZooKeeper/TongZK；
- 除本 Feature 明确允许的只读访问（`CDC_DATA_SOURCE_RUN_STATE`）与只读关联（`CDC_CLIENT_MULTIPLE`、`CDC_DATA_SOURCE` 补充展示与关联异常判断）之外的任何数据访问，以及任何 DDL/DML 或其他表写行为；
- 修改现有菜单、路由、占位页或前后端代码（本任务不改动任何前后端文件）；
- 创建 DESIGN.md / API.md / UI.md / DATABASE.md；
- 访问或操作数据库（本任务不连接数据库）。

## 5. Feature 定位、命名与边界

| 编号 | 需求 |
|---|---|
| DSS-REQ-001 | 用户可见名称统一为“源库快照状态”，覆盖页面标题、菜单、路由元数据标题、面包屑与 Feature 文档命名。 |
| DSS-REQ-002 | Feature 内部标识为 `data-source-snapshot-status`，任务代码前缀为 `DATA-SOURCE-SNAPSHOT-STATUS`；需求编号前缀 `DSS-REQ-`、验收编号前缀 `DSS-AC-`；本功能属于“运行监控”模块。 |
| DSS-REQ-003 | 既有路由 `/monitor/data-source-state` 保持不变；不因 Feature 更名新增、删除、重命名或改挂该路由。 |
| DSS-REQ-004 | 前端既有源码目录 `frontend/src/views/data-source-run-state/` 暂时保留，不做无业务价值的目录重命名；命名映射见 README §6。 |
| DSS-REQ-005 | 后续实现阶段应将菜单、路由元数据、页面标题与面包屑中的“数据源运行状态”更新为“源库快照状态”；本需求草案任务不改动任何前后端文件。 |

## 6. 业务语义与跨程序边界

| 编号 | 需求 |
|---|---|
| DSS-REQ-006 | `CDC_DATA_SOURCE_RUN_STATE` 记录“探针端（`CLIENT_ID`）＋源库（`DATA_SOURCE_ID`）”组合的初始快照状态；`SNAPSHOT_STATUS` 两个已知取值为 `SNAPSHOT_RUNNING`（源库初始快照执行中）与 `SNAPSHOT_COMPLETED`（源库初始快照已完成）。 |
| DSS-REQ-007 | 该记录只表示源库初始快照阶段；不表示 sync-client 当前是否在线、健康、失联，也不表示增量采集是否正常或当前同步进度；页面不得呈现进程健康或同步进度语义。 |
| DSS-REQ-008 | sync-client 启动时读取该表并据此决策（跨程序业务事实，本仓库不实现）：对应记录为 `SNAPSHOT_COMPLETED` 时只对源库做增量采集；没有对应记录时插入 `SNAPSHOT_RUNNING` 并执行快照，完成后更新为 `SNAPSHOT_COMPLETED`；对应记录为 `SNAPSHOT_RUNNING` 时重新执行快照。 |
| DSS-REQ-009 | 当前仓库只包含 `cdc-config`，不包含 sync-client 源码；本 Feature 不修改、不重复实现、不调用 sync-client 逻辑。 |
| DSS-REQ-010 | `SNAPSHOT_COMPLETED` 后该记录通常不再更新；不得使用 `UPDATED_AT` 或其他时间字段推断 sync-client 在线、健康、离线或异常。 |

## 7. 产品读写边界（严格只读）

| 编号 | 需求 |
|---|---|
| DSS-REQ-011 | `CDC_DATA_SOURCE_RUN_STATE` 由 sync-client 进程维护；最终交付的 `cdc-config` 对该表严格只读。 |
| DSS-REQ-012 | 页面和后端只提供查询；不提供新增、修改、删除、重置、重新快照、重试或批量操作。 |
| DSS-REQ-013 | 不增加任何写接口、写按钮或隐式写行为；后端不得提供任何针对该表的写能力。 |
| DSS-REQ-014 | 页面刷新（自动或手工）只重新查询数据库，不改变任何数据。 |
| DSS-REQ-015 | 允许使用 LEFT JOIN 补充探针端描述和源库 ORG 等展示信息；JOIN 只补充展示信息，绝不能改变 RUN_STATE 驱动的数据行集合，也不产生任何写副作用。本功能不访问与本功能无关的数据；允许只读访问 `CDC_DATA_SOURCE_RUN_STATE`，并允许只读关联 `CDC_CLIENT_MULTIPLE`、`CDC_DATA_SOURCE` 补充展示与关联异常判断。关联表绝对只读，且不得改变以 RUN_STATE 为驱动的行集合；不得扩大到任何其他表。 |

## 8. 页面数据集边界

| 编号 | 需求 |
|---|---|
| DSS-REQ-016 | 列表只展示 `CDC_DATA_SOURCE_RUN_STATE` 中实际存在的记录。 |
| DSS-REQ-017 | 表中没有记录的“探针端＋源库”组合不展示；不得根据 `CDC_CLIENT_MULTIPLE`、`CDC_DATA_SOURCE` 或其他配置表补出缺失行。 |
| DSS-REQ-018 | 不推断或生成“未开始”“待快照”“尚无快照记录”等虚拟状态。 |
| DSS-REQ-019 | 即使关联的探针端或源库配置缺失、停用或异常，RUN_STATE 原始记录仍必须保留展示；不得因 INNER JOIN 或 WHERE 条件被过滤。 |

## 9. 数据规模与不分页

| 编号 | 需求 |
|---|---|
| DSS-REQ-020 | 生产规模预期最多约 100 条记录（规模假设）；页面与接口必须能一次完整加载该规模的数据，不引入分页。 |
| DSS-REQ-021 | 页面一次加载全部符合条件的记录；不分页，不提供每页条数和翻页控件。 |

## 10. 查询条件

| 编号 | 需求 |
|---|---|
| DSS-REQ-022 | 查询区只保留三个条件：探针端、源库、快照状态；不提供时间范围、在线状态、健康状态、关键字或其他未批准条件。三个控件均为多选控件，每项默认选中显式“全部”；每个条件都提供显式“全部”选项，“全部”与该条件的任一具体候选互斥（由“全部”切换为任一具体候选即自动清除“全部”；改选“全部”即清除该条件已选具体候选）。同一条件内选择多个具体候选时为“或”；不同条件之间为“且”。 |
| DSS-REQ-023 | 页面初始化时将三项默认“全部”初始化为首组“已应用查询条件”，并立即以该条件发起首次自动查询。此后用户修改任一界面选择条件时不自动发起查询，当前表格与“已应用查询条件”均保持不变。用户点击“查询”时，必须对点击瞬间的界面选择条件形成“请求快照”，并使用该快照发起查询；仅当该次查询成功返回（包括成功返回 0 条空结果）时，该请求快照才升级为新的“已应用查询条件”，同时以成功结果替换当前表格并更新最近成功刷新时间。按新条件查询失败时：新条件不得升级为“已应用查询条件”，保留上一次成功结果与上一次“已应用查询条件”，界面控件仍保留用户当前选择的新条件以便再次点击“查询”，后续自动刷新与“立即刷新”继续使用旧的“已应用查询条件”。若用户在请求进行期间又修改界面控件，成功后升级的是该次请求开始时捕获的条件快照，不是请求结束时控件可能已变成的值。 |
| DSS-REQ-024 | 三个查询条件的候选仅来源于当前 RUN_STATE 实际记录及其可选展示信息；探针端、源库候选只取 RUN_STATE 中真实出现者，未在 RUN_STATE 中出现的探针端或源库不得加入候选。快照状态候选为“快照进行中”“快照已完成”；只有当前候选数据中真实存在未知 `SNAPSHOT_STATUS` 时，状态条件才出现“未知状态”。选择“未知状态”筛选所有不属于 `SNAPSHOT_RUNNING`、`SNAPSHOT_COMPLETED` 的原始状态；未知状态记录仍保留并可查看数据库原始值。 |
| DSS-REQ-025 | 查询不得因为关联配置缺失或停用而排除 RUN_STATE 行；条件命中只作用于 RUN_STATE 原始记录及其可解析/可展示的补充信息。查询区的“重置”按钮与对 RUN_STATE 数据执行“重置状态/重新快照”是两种不同操作：前者是允许的纯前端条件复位（把三个界面选择条件恢复为“全部”，不发起查询、不清空或替换当前表格、不改变已应用查询条件）；后者仍是明确禁止的产品写操作（见 §7）。按新条件查询失败后“重置”规则不变：仍只把界面选择条件复位为三项“全部”，不发起查询、不清空表格、不把失败的新条件或“全部”升级为“已应用查询条件”；“已应用查询条件”只会在后续一次成功点击“查询”（或首次查询成功）后按 `DSS-REQ-023` 被替换。 |

> 三个查询控件采用多选＋显式“全部”、“全部”互斥、同条件内“或”与条件间“且”、未知状态候选动态出现、以及“界面选择条件 / 已应用查询条件”双状态与“重置不查询”规则，均属项目负责人已确认方案，已并入上表 `DSS-REQ-022~025`（R1 决策落地），不再作为待复审草案建议保留。

## 11. 列表字段

| 编号 | 需求 |
|---|---|
| DSS-REQ-026 | 序号为当前完整结果集内的稳定显示序号，不是业务主键；行的唯一标识为 `CLIENT_ID + DATA_SOURCE_ID`。 |
| DSS-REQ-027 | 列表固定七列，顺序为：序号、探针端、源库、快照状态、快照启动时间、快照完成时间、记录更新时间。 |
| DSS-REQ-028 | “探针端”列必须展示原始 `CLIENT_ID`；关联成功时可补充展示 `CLIENT_DESC`。 |
| DSS-REQ-029 | “源库”列单行展示：关联成功时优先显示源库 `ORG`，原始 `DATA_SOURCE_ID` 通过 Tooltip 展示；关联不到源库时直接显示原始 `DATA_SOURCE_ID`，并提供轻量异常提示（异常提示形式见 §13 `DSS-REQ-045`）。不采用两行 ORG＋ID 布局。 |
| DSS-REQ-030 | “快照状态”列以中文状态标签展示，同时必须保证用户能够查看数据库原始状态值（如 `SNAPSHOT_RUNNING`）。 |
| DSS-REQ-031 | “快照启动时间”展示 `SNAPSHOT_LAST_SEEN_AT`；值为 NULL 时显示 `--`。 |
| DSS-REQ-032 | “快照完成时间”展示 `SNAPSHOT_COMPLETED_AT`；值为 NULL 时显示 `--`。 |
| DSS-REQ-033 | “记录更新时间”展示 `UPDATED_AT`。 |
| DSS-REQ-034 | 列表不设置操作列；不提供详情、编辑、删除、跳转或任何写操作入口。 |

## 12. 状态映射与未知状态

| 编号 | 需求 |
|---|---|
| DSS-REQ-035 | `SNAPSHOT_RUNNING` 状态展示为“快照进行中”，蓝色状态标签。 |
| DSS-REQ-036 | `SNAPSHOT_COMPLETED` 状态展示为“快照已完成”，绿色状态标签。 |
| DSS-REQ-037 | 数据库对 `SNAPSHOT_STATUS` 没有建立封闭取值 Check 约束（已核验数据库事实）；实现必须宽容处理未知状态。 |
| DSS-REQ-038 | 未知状态的记录仍然展示；以橙色“未知状态”标签呈现，并展示数据库原始状态值；颜色必须与两种已知状态清晰区分。状态与未知信息不能只靠颜色表达，必须同时有文字（中文标签或数据库原始值，见 §18 `DSS-REQ-063`）。 |
| DSS-REQ-039 | 未知状态不得造成整个接口或页面报错，也不得被丢弃或改写为已知状态。 |
| DSS-REQ-040 | 当前开发库没有 `SNAPSHOT_COMPLETED` 真实样例；需求与验收不依赖开发库天然存在该样例，`SNAPSHOT_COMPLETED` 场景通过受控测试数据构造（构造授权见 §20）。 |

## 13. 关联异常兼容

| 编号 | 需求 |
|---|---|
| DSS-REQ-041 | `CLIENT_ID` 找不到对应探针端时，仍展示原始 `CLIENT_ID`，并提供轻量异常提示。 |
| DSS-REQ-042 | `DATA_SOURCE_ID` 找不到对应数据源时，仍展示原始 `DATA_SOURCE_ID`，并提供轻量异常提示。 |
| DSS-REQ-043 | 关联的探针端或源库已停用时，RUN_STATE 行仍展示，并可标识“配置已停用”。 |
| DSS-REQ-044 | 关联源库类别不是 SOURCE、类别大小写异常或其他配置异常时，RUN_STATE 行仍展示并提供轻量提示。 |
| DSS-REQ-045 | 关联异常提示采用单元格内小图标或弱提示文字呈现，并通过 Tooltip 解释；不新增专门的异常列。提示只描述配置关联事实，不把快照状态改判成失败，也不触发任何数据库修复或写行为。 |

## 14. 排序

| 编号 | 需求 |
|---|---|
| DSS-REQ-046 | 默认排序固定：先 `SNAPSHOT_RUNNING`，再未知状态，后 `SNAPSHOT_COMPLETED`。 |
| DSS-REQ-047 | 同一状态组内按 `UPDATED_AT` 倒序。 |
| DSS-REQ-048 | `UPDATED_AT` 并列时，使用 `CLIENT_ID`、`DATA_SOURCE_ID` 作为确定性排序键。 |
| DSS-REQ-049 | 页面不提供用户自定义表头排序。 |

## 15. 刷新

| 编号 | 需求 |
|---|---|
| DSS-REQ-050 | 页面提供“60 秒自动刷新＋立即刷新”。自动刷新与“立即刷新”始终沿用最近一次成功查询确立的“已应用查询条件”，不使用尚未点击“查询”的界面选择条件；即使用户已经修改或重置界面条件、或按新条件点击“查询”后失败都一样——失败的新条件不会成为刷新依据，刷新继续沿用上一次成功查询的条件（见 `DSS-REQ-023/061`）。刷新工具栏“立即刷新”按钮采用稳定宽度：刷新在途时可显示加载图标，但图标出现/消失不得改变按钮宽度，不得造成按钮前“60 秒自动刷新｜最近成功刷新：…”等文字位置移动，工具栏整体不得因刷新在途状态发生明显水平位移。 |
| DSS-REQ-051 | 页面不可见时停止/取消自动刷新计时，不保留可恢复的“剩余秒数”，该期间不发起自动刷新、不启动新的 60 秒计时；页面重新可见后立即按“已应用查询条件”发起一次刷新，并在该次请求结束后（无论成功或失败）重新开始一个完整 60 秒周期（见 `DSS-REQ-054`）。若某请求在页面变为不可见前已在途，该请求允许正常结束并按成功/失败规则处理，但页面不可见期间不启动新的计时。 |
| DSS-REQ-052 | 自动刷新和手工刷新只重新读取数据库；不写数据库，不改变任何数据。 |
| DSS-REQ-053 | 前一次刷新请求未结束时不得发起下一次重叠请求。因已有请求在途而被抑制的自动或手工触发不视为一次实际请求，不单独重置计时（见 `DSS-REQ-054`）。 |
| DSS-REQ-054 | 页面可见时，每一次实际发出的查询或刷新请求结束后，无论成功还是失败，都从请求结束时重新开始一个完整的 60 秒自动刷新周期。刷新失败后不停止自动刷新、也不立即无间隔重试；60 秒后按“已应用查询条件”正常自动重试一次。查询成功返回 0 条空结果属于成功：同样允许更新“已应用查询条件”、展示空态、更新最近成功刷新时间，并从请求结束后重新计时 60 秒。请求在途时不发起重叠请求；因已有请求在途而被抑制的自动或手工触发不视为一次实际请求，不单独重置计时。页面不可见时停止/取消自动刷新计时，不保留可恢复的剩余秒数；若请求在页面变为不可见前已在途，该请求允许正常结束并按成功/失败规则处理，但页面不可见期间不启动新的 60 秒计时。页面恢复可见后立即按“已应用查询条件”发起一次刷新；该请求结束后（无论成功或失败）重新开始完整 60 秒周期。最近成功刷新时间只在查询/刷新成功后更新，任何失败或被抑制的触发都不得更新时间（见 `DSS-REQ-061`）。 |

## 16. 时间字段边界

| 编号 | 需求 |
|---|---|
| DSS-REQ-055 | 三个时间字段（`SNAPSHOT_LAST_SEEN_AT`、`SNAPSHOT_COMPLETED_AT`、`UPDATED_AT`）统一展示为 `YYYY-MM-DD HH:mm:ss`；空值显示 `--`（NULL 展示另见 `DSS-REQ-031/032`）；展示格式化不得改变其业务时间值。 |
| DSS-REQ-056 | 不根据任何时间字段计算或呈现“超时”“异常”“离线”“长期运行”等状态。 |
| DSS-REQ-057 | 不因为 `SNAPSHOT_RUNNING` 持续时间长而自动显示为错误或警告。 |

## 17. 加载、空数据、失败与恢复

| 编号 | 需求 |
|---|---|
| DSS-REQ-058 | 首次加载在途时提供加载反馈，进行中不造成表格明显闪烁。 |
| DSS-REQ-059 | 首次自动查询失败（当前无历史成功结果）时展示首次加载失败状态和“重新加载”入口；“已应用查询条件”仍为默认三项“全部”，重新加载或自动重试仍使用三项“全部”；不得把失败展示成空数据或成功状态（见 `DSS-REQ-023`）。 |
| DSS-REQ-060 | 查询结果为零时展示空数据提示，不得展示成接口错误。成功返回 0 条空结果属于成功：允许把本次请求快照升级为新的“已应用查询条件”、展示空态并更新最近成功刷新时间，并从请求结束后重新计时 60 秒（见 `DSS-REQ-023/054`）。 |
| DSS-REQ-061 | 页面必须区分“加载成功、加载失败、空结果、进行中”等状态，失败与空结果不得互相伪装。已有成功结果时，查询（含按新条件点击“查询”）或刷新失败均保留最近一次成功数据、不清空表格，且“已应用查询条件”保持最近一次成功查询确立的条件不变；失败提示必须收敛，不得连续堆叠相同失败消息；失败不更新最近成功刷新时间（该时间只在查询/刷新成功后更新）；失败信息必须脱敏（见 §19 `DSS-REQ-064`）；刷新在途不得造成表格明显闪烁。自动刷新在失败后按 `DSS-REQ-054` 在 60 秒后按“已应用查询条件”正常自动重试，不停止、不立即无间隔重试；被在途抑制的触发不更新时间。 |

## 18. 可访问性与基础视觉

| 编号 | 需求 |
|---|---|
| DSS-REQ-062 | 页面采用与现有 app-shell 和 Element Plus 体系一致的企业管理后台浅色风格。 |
| DSS-REQ-063 | 快照状态、未知状态与关联异常提示不以颜色作为唯一信息载体；必须同时有文字表达（中文标签或数据库原始值）。 |

## 19. 安全、日志与敏感数据边界

| 编号 | 需求 |
|---|---|
| DSS-REQ-064 | 后端返回与页面展示的失败信息必须脱敏：不暴露内部堆栈、无关数据或敏感信息；日志不记录本表之外或与查询无关的敏感内容；任何查询路径都不产生对本表或其他表的写操作。 |

## 20. 测试数据 DML 授权与恢复

项目负责人已明确授权：后续开发、测试和验收任务可以操作 `CDC_DATA_SOURCE_RUN_STATE` 的开发库测试数据，用于构造真实场景。该授权精确记录为下列边界，本草案任务不访问数据库、不执行任何 DML。

| 编号 | 需求 |
|---|---|
| DSS-REQ-065 | 未来对 `CDC_DATA_SOURCE_RUN_STATE` 执行测试数据 `INSERT/UPDATE/DELETE` 的边界：①仅限项目配置的 Oracle 开发库；②仅在后续任务提示词显式纳入该授权时，Agent 方可对 `CDC_DATA_SOURCE_RUN_STATE` 执行 `INSERT/UPDATE/DELETE`，无需逐条再次确认；③操作前必须完整备份原始数据；④操作后必须恢复到任务开始前状态并验证逐行一致；⑤报告必须记录操作目的、执行范围、备份与恢复证据；⑥不授权 `TRUNCATE`、`ALTER`、`DROP` 或其他 DDL；⑦不授权操作其他数据库表；⑧不授权生产数据库；⑨这只是 Agent 测试数据权限，不是 `cdc-config` 产品写能力。 |

## 21. 明确非目标

下列内容属于本 Feature 明确不实现或不推断的范围（作为范围边界记录；凡可判定的“禁止”行为已编码进 §5~§20 相应 `DSS-REQ-*`）：

- 对 RUN_STATE 的任何产品写能力，或对运行侧（sync-client）的启停、通知、重新快照控制；
- 展示或推断 sync-client 在线/健康/离线、增量采集是否正常、当前同步进度；
- 从配置表补行、生成“未开始/待快照”等虚拟状态；
- 分页、时间范围、在线/健康/关键字等未批准查询；
- 依据时间字段计算超时/异常/离线/长期运行；
- 除明确允许的只读访问（`CDC_DATA_SOURCE_RUN_STATE`）与只读关联（`CDC_CLIENT_MULTIPLE`、`CDC_DATA_SOURCE`）之外的其他数据访问；执行任何 DDL/DML 或其他表写行为（本任务不访问数据库）；
- 本草案任务不进入设计、不实现代码、不执行验收。

## 22. 草案建议处置（R1：原 DSS-PROP-001~008 已全部决策并吸收）

R0 初版 §22“待用户复审的草案建议”所列 8 项 `DSS-PROP-*` 已在 R1 中全部由项目负责人确认并吸收为正式需求/验收行，本版不再保留任何待用户复审草案建议（`pending_user_confirmation_count=0`）。`pending_user_confirmation_count=0` 不等于 `APPROVED`：本版（R3 修订版）仍是草案，需求/验收整体待 ChatGPT 对 R3 结果正式复审，复审后由项目负责人审阅/批准。

| 原草案建议 | 决策结果与去向（需求 / 验收） |
|---|---|
| DSS-PROP-001（三查询控件单选或全部） | 已确认改为“三项多选＋显式全部＋全部与具体候选互斥＋同条件内或/条件间且”，并入 `DSS-REQ-022`；验收 `DSS-AC-020`、`DSS-AC-023` |
| DSS-PROP-002（未知状态候选） | 已确认“未知状态”候选仅在真实存在未知记录时出现，选中后筛出非已确认状态；并入 `DSS-REQ-024`；验收 `DSS-AC-022` |
| DSS-PROP-003（源库列展示原始 ID） | 已确认改为“单行：关联成功优先显示 ORG、Tooltip 展示原始 `DATA_SOURCE_ID`；关联不到直接显示原始 ID 并弱提示”，不采用两行 ORG＋ID 布局；并入 `DSS-REQ-029`；验收 `DSS-AC-027` |
| DSS-PROP-004（状态标签颜色） | 已确认颜色映射：RUNNING 蓝“快照进行中”、COMPLETED 绿“快照已完成”、未知橙“未知状态”并可查看原始值，且不能只靠颜色；并入 `DSS-REQ-035/036/038`；验收 `DSS-AC-032/033/035/037` |
| DSS-PROP-005（时间展示格式） | 已确认统一 `YYYY-MM-DD HH:mm:ss`、空值 `--`、不改变业务时间值；并入 `DSS-REQ-055`；验收 `DSS-AC-052` |
| DSS-PROP-006（加载态与刷新失败） | 已确认刷新失败保留最近一次成功数据、提示收敛、最近成功刷新时间、失败脱敏、刷新在途不闪烁；并入 `DSS-REQ-061`（并 `DSS-REQ-064`）；验收 `DSS-AC-058` |
| DSS-PROP-007（轻量异常提示形式） | 已确认单元格内小图标或弱提示文字＋Tooltip、不新增专门异常列、只描述配置关联事实；并入 `DSS-REQ-045`；验收 `DSS-AC-038~042` |
| DSS-PROP-008（恢复可见立即刷新） | 已确认恢复可见后立即按“已应用查询条件”刷新一次并重启 60 秒计时；并入 `DSS-REQ-051/054`；验收 `DSS-AC-048/051` |

另：刷新工具栏稳定宽度（“立即刷新”稳定宽度、加载图标出现/消失不改变按钮宽度、按钮前文字不位移、工具栏不因刷新在途水平移动）为本 Feature 已确认交互要求，并入 `DSS-REQ-050`，验收 `DSS-AC-068`；不再作为草案建议表述。

## 23. 需求数量与编号核验

- 需求编号：`DSS-REQ-001`～`DSS-REQ-065`，共 **65** 条，编号连续唯一。
- 验收编号：`DSS-AC-001`～`DSS-AC-068`，共 **68** 条，全部 `NOT_RUN`（见 `ACCEPTANCE.md`；R1 新增 `DSS-AC-068` 覆盖刷新工具栏稳定宽度，无既有可折叠验收用例，编号连续唯一）。
- 每条需求至少被一个验收用例覆盖，每条验收用例引用已存在需求编号（见 `ACCEPTANCE.md` 验收表格“关联需求”列与 §6 追踪矩阵）。
- 文档状态 `DRAFT_PENDING_USER_REVIEW`，不存在 `APPROVED`、`IMPLEMENTED`、验收 `PASS/ACCEPTED` 等越权状态。
- 待用户复审草案建议：**0** 项（`pending_user_confirmation_count=0`；原 `DSS-PROP-001~008` 已全部决策并吸收，见 §22）。

## 24. 文档级变更记录

| 日期 | 变更 | 依据 |
|---|---|---|
| 2026-09-05 | 建立“源库快照状态”Feature 需求草案（`DRAFT_PENDING_USER_REVIEW`；requirements_status/acceptance_status=`DRAFT_PENDING_USER_REVIEW`；实现状态 `NOT_STARTED`；验收执行状态 `NOT_RUN`；设计状态 `NOT_STARTED`；`DSS-REQ-001~065` 共 65 条；草案建议 `DSS-PROP-001~008`；全部数据库事实引用已提交数据库只读复核报告 `docs/database/reports/DATA-SOURCE-SNAPSHOT-STATUS-DATABASE-VERIFICATION-001.md`） | DATA-SOURCE-SNAPSHOT-STATUS-REQUIREMENTS-BASELINE-001（纯文档任务；基于项目负责人已确认产品决策 + 已核验数据库只读复核报告；待用户审阅与 ChatGPT 正式复审） |
| 2026-09-05 | R1 定向修订需求草案：修正 R1-01（统一“只读访问 RUN_STATE＋只读关联两张配置表”边界，消除“访问本表之外”自相矛盾）与 R1-03 相关需求（建立“界面选择条件/已应用查询条件”双状态与“重置不查询”，并入 `DSS-REQ-022~025`、`DSS-REQ-050~054`）；吸收项目负责人已确认的 8 项交互方案（并入 `DSS-REQ-022/023/024/029/035/036/038/045/051/054/055/061` 等）与刷新工具栏稳定宽度（`DSS-REQ-050`）；删除 `DSS-PROP-001~008` 待复审草案建议（`pending_user_confirmation_count=0`）；验收计数随 `ACCEPTANCE.md` 更新为 68 条；仍为 `DRAFT_PENDING_USER_REVIEW` 未批准草案，待 ChatGPT 对 R1 结果正式复审 | DATA-SOURCE-SNAPSHOT-STATUS-REQUIREMENTS-BASELINE-001-R1（ChatGPT 正式复审 `CHANGES_REQUIRED` 驱动的纯文档定向修订；草案未批准、功能未实现、验收未执行） |
| 2026-09-05 | R2 最小定向修订需求草案（ChatGPT 对 R1 结果正式复审 `CHANGES_REQUIRED`）：R2-01 明确“点击查询用请求快照、仅成功（含成功返回 0 条空结果）才升级已应用查询条件；按新条件查询失败保留旧结果/旧已应用条件/界面保留新条件/后续自动与立即刷新用旧条件/不更新最近成功刷新时间；请求在途再改控件成功升级的是请求开始时的快照”（并入术语与 `DSS-REQ-023/025/050/059/060/061`）；R2-02 明确“页面可见时每次实际请求结束（无论成功/失败）都从请求结束重启完整 60 秒周期；失败后 60 秒按已应用条件自动重试、不停止不立即无间隔；成功空结果同样属成功并重启计时；在途被抑制触发不视为实际请求、不单独重置计时；页面不可见停止计时且不保留剩余秒数、不可见期间不启动新计时；恢复可见立即刷新后无论成败重启完整 60 秒；最近成功刷新时间仅成功后更新”（并入 `DSS-REQ-050/051/053/054/061`）；编号与计数不变（需求 65、验收 68、全部 `NOT_RUN`）；仍为 `DRAFT_PENDING_USER_REVIEW` 未批准草案，待 ChatGPT 对 R2 结果正式复审 | DATA-SOURCE-SNAPSHOT-STATUS-REQUIREMENTS-BASELINE-001-R2（ChatGPT 对 R1 正式复审 `CHANGES_REQUIRED` 驱动的纯文档最小定向修订；草案未批准、功能未实现、验收未执行） |
| 2026-09-05 | R3 极小定向修订需求草案（ChatGPT 对 R2 结果正式复审 `CHANGES_REQUIRED`）：本版不改变任何需求业务规则，只把修订范围限定到验收草案 `DSS-AC-024`——修正该用例“成功刷新却不更新最近成功刷新时间”的验收矛盾，统一为“成功刷新更新‘最近成功刷新时间’但不替换‘已应用查询条件’，只有用户点击‘查询’且查询成功才允许替换”；因此 65 条 `DSS-REQ-*` 业务行相对本版授权基线 `5c58af6` 逐字节不变；编号与计数不变（需求 65、验收 68、全部 `NOT_RUN`）；仍为 `DRAFT_PENDING_USER_REVIEW` 未批准草案，待 ChatGPT 对 R3 结果正式复审 | DATA-SOURCE-SNAPSHOT-STATUS-REQUIREMENTS-BASELINE-001-R3（ChatGPT 对 R2 结果正式复审 `CHANGES_REQUIRED` 驱动的纯文档极小定向修订；草案未批准、功能未实现、验收未执行） |

> 关联文档：验收草案 `docs/features/data-source-snapshot-status/ACCEPTANCE.md`；功能入口与状态 `docs/features/data-source-snapshot-status/README.md`；Feature 总索引 `docs/features/README.md`。
