# 源库快照状态 Feature 需求草案（REQUIREMENTS）

## 1. 元数据与文档状态

| 项目 | 值 |
|---|---|
| Feature 中文名称 | 源库快照状态（页面、菜单、路由元数据标题、面包屑最终统一使用的用户可见名称；实现任务 `DATA-SOURCE-SNAPSHOT-STATUS-IMPLEMENTATION-001` 已将 `menu.ts` 本页标题行与 `router/index.ts` 本页标题元数据更新为“源库快照状态”并替换占位页，见 Feature README §6） |
| Feature 标识 | `data-source-snapshot-status`（Feature 文档目录标识；任务代码前缀 `DATA-SOURCE-SNAPSHOT-STATUS`） |
| 所属模块 | 运行监控 |
| 既有路由 | `/monitor/data-source-state`（保持既有值不变） |
| 前端源码目录 | `frontend/src/views/data-source-run-state/`（保留既有目录名；命名映射见 README §6） |
| 前端现状 | `frontend/src/views/data-source-run-state/DataSourceRunStatePage.vue` 已由占位页替换为正式“源库快照状态”实现页（实现任务后事实，见 Feature README §6） |
| 后端现状 | 已新增针对 `CDC_DATA_SOURCE_RUN_STATE` 的只读访问链路 `GET /api/monitor/data-source-run-state/list`（实现任务后事实，见 Feature README §6） |
| 目标文档 | `docs/features/data-source-snapshot-status/REQUIREMENTS.md` |
| 文档状态 | `DRAFT_ADJUSTMENT_PENDING_USER_REVIEW`（当前版为验收前 UI 调整草案 `DATA-SOURCE-SNAPSHOT-STATUS-UI-ADJUSTMENT-BASELINE-001`，建立在已批准需求/验收/设计基线之上；已批准基线保留为历史，**批准基线不自动批准本轮调整草案**，见本表“调整草案关系”与 §1 文档事实边界声明） |
| requirements_status | `DRAFT_ADJUSTMENT_PENDING_USER_REVIEW`（当前调整版本；已批准版本保留为历史） |
| acceptance_status | `DRAFT_ADJUSTMENT_PENDING_USER_REVIEW`（当前调整版本，见 `ACCEPTANCE.md`；已批准版本保留为历史） |
| 实现状态 | `IMPLEMENTED_ADJUSTMENT_PENDING`（implementation_status=IMPLEMENTED_ADJUSTMENT_PENDING；既有实现 `DATA-SOURCE-SNAPSHOT-STATUS-IMPLEMENTATION-001`/`-R1` 已完成，但**本轮 UI 调整尚未实现**，待 ChatGPT 对本调整草案正式复审且项目负责人批准后另立实现，见 Feature README §9/§10） |
| 验收执行状态 | `NOT_RUN`（acceptance_execution_status=NOT_RUN；既有 68 条 `DSS-AC-001~068` 与本调整新增 `DSS-AC-069~080` 全部 `NOT_RUN`，正式验收未执行） |
| 设计状态 | `DESIGN.md`/`UI.md` 当前调整版本为 `DRAFT_ADJUSTMENT_PENDING_USER_REVIEW`（本轮调整草案，见对应文档）；`API.md`/`DATABASE.md` 保持已批准（`APPROVED`）且本轮**整文件零差异**（本轮不改接口、SQL、表结构、数据库访问与产品只读边界） |
| pending_user_review | `YES`（本轮为验收前 UI 调整草案，待 ChatGPT 正式复审与项目负责人审阅，pending_user_review=YES） |
| 正式批准版本 | `DATA-SOURCE-SNAPSHOT-STATUS-REQUIREMENTS-BASELINE-APPROVAL-001`（项目负责人明确“批准”驱动的需求与验收基线批准收口） |
| 批准链 | R0 需求与验收草案建立 → R1 定向修订 → R2 最小定向修订 → R3 极小定向修订 → ChatGPT 对 R3 结果正式复审 `APPROVED`（R3 结果提交 `4234af73db2190098f3dcd219319a4281fdabafd`）→ 项目负责人随后明确回复“批准” |
| 批准依据提交 | `4234af73db2190098f3dcd219319a4281fdabafd`（ChatGPT 对 R3 结果正式复审 `APPROVED` 的 R3 结果提交；本批准收口以该提交为批准内容基准） |
| 批准日期 | 2026-09-05 |
| 初版任务编号 | `DATA-SOURCE-SNAPSHOT-STATUS-REQUIREMENTS-BASELINE-001`（初版需求与验收草案建立） |
| 本版（R1）任务编号 | `DATA-SOURCE-SNAPSHOT-STATUS-REQUIREMENTS-BASELINE-001-R1`（ChatGPT 正式复审 `CHANGES_REQUIRED` 后的纯文档定向修订；历史版本） |
| 本版（R2）任务编号 | `DATA-SOURCE-SNAPSHOT-STATUS-REQUIREMENTS-BASELINE-001-R2`（ChatGPT 对 R1 结果正式复审 `CHANGES_REQUIRED` 后的纯文档最小定向修订；历史版本） |
| 本版（R3）任务编号 | `DATA-SOURCE-SNAPSHOT-STATUS-REQUIREMENTS-BASELINE-001-R3`（ChatGPT 对 R2 结果正式复审 `CHANGES_REQUIRED` 后的纯文档极小定向修订：只修正验收草案 `DSS-AC-024` 文字、不改任何需求业务语义；历史版本，其后经批准收口为 `APPROVED`） |
| 任务类型 | 纯文档——需求与验收草案及 R1/R2/R3 定向修订（只修订功能级文档并提交、推送；严禁进入设计、编码、数据库访问或运行服务阶段） |
| 初版授权基线提交 | `72b305a8e4134d10f514920c215b9647fb7d9e3b`（初版任务开始时 `origin/develop` 最新提交） |
| 本版（R1）授权基线提交 | `91eb2209a99a65ef1d433c2fb1c815a1abcd5bd5`（R1 任务开始时 `origin/develop` 最新提交，本地 HEAD 与其一致，ahead/behind=0/0；历史基线） |
| 本版（R2）授权基线提交 | `0476c40a49f1a7aa6d48fe58194c92982276fd60`（R2 任务开始时 `origin/develop` 最新提交，本地 HEAD 与其一致，ahead/behind=0/0；历史基线） |
| 本版（R3）授权基线提交 | `5c58af6b0a378c8534ebc0b76eaa7bc75b6a847a`（R3 任务开始时 `origin/develop` 最新提交，本地 HEAD 与其一致，ahead/behind=0/0；历史基线） |
| 本版（UI 调整草案）任务编号 | `DATA-SOURCE-SNAPSHOT-STATUS-UI-ADJUSTMENT-BASELINE-001`（验收前 UI 调整草案建立；ChatGPT 对实现 R1 提交 `37825272c25c8a2d8a595ff0d5c25c6349186663` 代码复审 `CHANGES_REQUIRED` 后，项目负责人提出更完整的 UI 调整，本轮在已批准基线之上建立**纯文档调整草案**；未实现、未执行正式验收、未批准） |
| 本版（UI 调整草案）授权基线提交 | `37825272c25c8a2d8a595ff0d5c25c6349186663`（本任务开始时 `origin/develop` 最新提交，本地 HEAD 与其一致，ahead/behind=0/0） |
| 调整草案关系 | 已批准需求/验收基线（正式批准版本 `DATA-SOURCE-SNAPSHOT-STATUS-REQUIREMENTS-BASELINE-APPROVAL-001`，批准内容基准提交 `4234af73db2190098f3dcd219319a4281fdabafd`）与已批准设计基线（`DATA-SOURCE-SNAPSHOT-STATUS-DESIGN-BASELINE-APPROVAL-001`）保留为历史；**批准基线不自动批准本轮调整草案**——本调整草案须经 ChatGPT 对本调整基线草案正式复审 `APPROVED` 且项目负责人明确回复“批准”后方能成为新基线。本轮只调整展示内容/Tooltip/刷新布局/busy 视觉状态，不改接口、SQL、表结构、数据库访问与产品只读边界（API.md/DATABASE.md 整文件零差异）。下一入口为 ChatGPT 对本调整草案正式复审（不是直接实现） |
| 文档版本 | 批准收口版（2026-09-05；在 R3 极小定向修订版基础上，ChatGPT 对 R3 结果正式复审 `APPROVED`（R3 结果提交 `4234af73db2190098f3dcd219319a4281fdabafd`）、项目负责人随后明确“批准”，需求与验收基线状态收口为 `APPROVED`，正式批准版本 `DATA-SOURCE-SNAPSHOT-STATUS-REQUIREMENTS-BASELINE-APPROVAL-001`；业务零变化——需求 `DSS-REQ-001~065` 仍 65 条、验收 `DSS-AC-001~068` 仍 68 条且全部 `NOT_RUN`；批准的是需求与验收标准基线，不代表设计已完成、功能已实现、验收已执行或通过；该版本为历史批准版本，2026-09-07 本轮 UI 调整草案在其之上建立，批准不自动延伸到本轮调整） |
| 创建日期 | 2026-09-05（初版）；本版 R1、R2、R3 修订及批准收口同日 |
| 需求来源 | 项目负责人已确认的产品决策（任务提示词 §6）+ 已核验数据库只读复核报告（`docs/database/reports/DATA-SOURCE-SNAPSHOT-STATUS-DATABASE-VERIFICATION-001.md`）+ 既有 Feature 文档结构/术语约定（`topic-offset`、`client-config` 等仅作结构参考，不复制其业务规则）；本版 R1 依据 ChatGPT 正式复审意见（`CHANGES_REQUIRED`，R1-01~R1-03）与项目负责人已确认的 8 项交互方案、刷新工具栏稳定性要求、最新“重置不查询”决定（任务提示词 §5~§7）定向修订；本版 R2 依据 ChatGPT 对 R1 结果正式复审意见（`CHANGES_REQUIRED`，R2-01/R2-02）定向消除两个剩余歧义（任务提示词 §5~§6）；本版 R3 依据 ChatGPT 对 R2 结果正式复审意见（`CHANGES_REQUIRED`）极小定向修订验收草案 `DSS-AC-024` 文字（只指向“成功刷新却不更新最近成功刷新时间”的验收矛盾，任务提示词 §4~§6），不改变任何需求业务语义 |

文档事实边界声明：

- 用户已确认的业务规则在本文件中作为需求事实记录（`DSS-REQ-*`）。
- 仓库现状（路由、菜单标题、占位页、无后端访问链路）作为 AS-IS 事实记录，并标注来源。
- `CDC_DATA_SOURCE_RUN_STATE` 数据库物理事实全部引用已提交数据库只读复核报告（见 §3），本文件不重新查询数据库。
- 本文件 R1 版已取消全部 `DRAFT_PROPOSAL_PENDING_USER_REVIEW` 草案建议（原 `DSS-PROP-001~008`）：8 项交互方案已由项目负责人确认并吸收到相应 `DSS-REQ-*` / `DSS-AC-*`，`pending_user_confirmation_count=0`；已批准版本为历史（正式批准版本 `DATA-SOURCE-SNAPSHOT-STATUS-REQUIREMENTS-BASELINE-APPROVAL-001`，批准内容基准提交 `4234af73db2190098f3dcd219319a4281fdabafd`），批准的是需求与验收标准基线，不代表设计已完成、功能已实现、验收已执行或通过（`pending_user_confirmation_count=0` 不等于 `IMPLEMENTED_ACCEPTED`）。
- 本版为验收前 UI 调整草案（`DATA-SOURCE-SNAPSHOT-STATUS-UI-ADJUSTMENT-BASELINE-001`，2026-09-07）：在已批准基线之上定向修订展示内容/Tooltip/刷新布局/busy 视觉状态相关既有需求行（`DSS-REQ-028/029/050`，修订说明见 §21.1）并新增独立需求行（`DSS-REQ-066~071`，见 §21）；已批准基线保留为历史，**批准基线不自动批准本轮调整草案**，本轮 `requirements_status`/`acceptance_status`/`design_status(DESIGN/UI)` 当前调整版本为 `DRAFT_ADJUSTMENT_PENDING_USER_REVIEW`、实现状态为 `IMPLEMENTED_ADJUSTMENT_PENDING`、`pending_user_review=YES`、`pending_user_confirmation_count=0`；本轮不改接口、SQL、表结构、数据库访问与产品只读边界（`API.md`/`DATABASE.md` 整文件零差异）。
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
| DSS-REQ-028 | “探针端”列必须展示原始 `CLIENT_ID`；表格内只显示原始 `CLIENT_ID`（单行、超出列宽省略号），不再把 `CLIENT_DESC` 同行或次行展示；完整 `CLIENT_DESC` 经悬停 Tooltip 展示，描述为空时不弹空 Tooltip；探针配置缺失时仍显示原始 `CLIENT_ID` 且异常提示能表达“探针端配置缺失”，停用保留轻量异常说明（本轮展示规则修订见 §21.1；列宽与文本规则见 `DSS-REQ-069`）。 |
| DSS-REQ-029 | “源库”列单行展示：正常关联且 `ORG`（`DATA_SOURCE_ORG`）非空时只显示源库 `ORG`（单行、超出列宽省略号），悬停以 Tooltip 展示完整 `ORG`，不以原始 `DATA_SOURCE_ID` 作为正常行 Tooltip 的默认内容；源库配置缺失或 `ORG` 为空时回退显示原始 `DATA_SOURCE_ID`（不得显示空白），Tooltip 展示完整原始 ID 与对应异常说明；停用、类别非 SOURCE 等既有轻量异常语义继续保留（异常提示形式见 §13 `DSS-REQ-045`）。不采用两行 ORG＋ID 布局（本轮展示规则修订见 §21.1；列宽与文本规则见 `DSS-REQ-069`）。 |
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
| DSS-REQ-050 | 页面提供“60 秒自动刷新＋立即刷新”。自动刷新与“立即刷新”始终沿用最近一次成功查询确立的“已应用查询条件”，不使用尚未点击“查询”的界面选择条件；即使用户已经修改或重置界面条件、或按新条件点击“查询”后失败都一样——失败的新条件不会成为刷新依据，刷新继续沿用上一次成功查询的条件（见 `DSS-REQ-023/061`）。刷新工具栏“立即刷新”按钮采用稳定宽度：刷新在途时可显示加载图标，但图标出现/消失不得改变按钮宽度，不得造成按钮前“60 秒自动刷新｜最近成功刷新：…”等文字位置移动，工具栏整体不得因刷新在途状态发生明显水平位移。（验收前 UI 调整草案在既有稳定宽度基础上扩展：刷新工具栏归入结果卡片头部右侧不可拆散“刷新逻辑组”整体靠右展示、窄宽度下整体换行不得只把“立即刷新”挤到下一行；只有真正发起当前请求的操作呈现加载反馈；刷新在途时“查询”不闪动；详见新增 `DSS-REQ-068/071` 与 §21.1。） |
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

### 20.1 R1 本次测试数据授权例外（任务级，2026-09-06）

在实现修复任务 `DATA-SOURCE-SNAPSHOT-STATUS-IMPLEMENTATION-001-R1` 的本会话中，项目负责人明确授权：对负责人所指数据库（经只读证据核验为本项目内网库：`DB_NAME=prod`、数据库主机 `snoopy-linux`、Schema=`CDC`，仅此一个含 `CDC_DATA_SOURCE_RUN_STATE` 的连接）执行测试 `INSERT` 并 `COMMIT`，测试后**保留不还原**；不再逐条申请。授权只覆盖以下三表：

- `CDC_DATA_SOURCE_RUN_STATE`（新增 29 条合成运行态）
- `CDC_CLIENT_MULTIPLE`（新增 5 条停用探针配置）
- `CDC_DATA_SOURCE`（新增 5 条停用源配置）

数据使用本任务独立前缀 `dssr1-0906-`，全部独立合成主键；只新增、不 `UPDATE/DELETE` 已有记录，不 `TRUNCATE`、不 DDL、不授权其它表、无触发器写入；新增配置均 `FG_ACTIVE='0'`、描述含“快照页测试，请勿启用”、连接字段为不可用合成值且绝不连接。此为**本任务 Agent 测试数据权限记录，不是产品写能力**；本页后端/前端仍严格只读。该例外不扩散到其它任务或其它表；§20 其它历史约束仍适用。执行证据见实现报告 `reports/DATA-SOURCE-SNAPSHOT-STATUS-IMPLEMENTATION-001-R1.md` 与 `evidence/DATA-SOURCE-SNAPSHOT-STATUS-IMPLEMENTATION-001-R1/db/`。

## 21. 本轮 UI 调整草案新增需求（DSS-REQ-066 ~ DSS-REQ-071）

> 本节为验收前 UI 调整草案 `DATA-SOURCE-SNAPSHOT-STATUS-UI-ADJUSTMENT-BASELINE-001` 在**已批准需求/验收/设计基线之上**新增的独立需求行（编号自 `DSS-REQ-066` 起连续）。已批准基线（正式批准版本 `DATA-SOURCE-SNAPSHOT-STATUS-REQUIREMENTS-BASELINE-APPROVAL-001`，批准内容基准提交 `4234af73db2190098f3dcd219319a4281fdabafd`；设计批准版本 `DATA-SOURCE-SNAPSHOT-STATUS-DESIGN-BASELINE-APPROVAL-001`）保留为历史；**批准基线不自动批准本轮调整草案**。本节只围绕“页面三块结构 / 结果卡片头部 / 固定列宽与文本 / 页面级单实例 Tooltip / busy 视觉隔离”建立新规则，不改动 `API.md`/`DATABASE.md` 契约与本表之外任何业务行。

| 编号 | 需求 |
|---|---|
| DSS-REQ-066 | 页面自上而下形成三个有明显视觉分隔的区域：① **页面标题与功能说明区**——标题仍为“源库快照状态”，功能说明表达“展示探针端与源库组合的初始快照阶段状态、页面只读”，不得增加在线、健康、同步进度等推断；标题与功能说明同属页面顶层语义区，功能说明以清楚但不过度抢眼的信息提示形态呈现；② **独立查询卡片**——含探针端、源库、快照状态三个多选条件与查询、重置按钮，有独立白色容器（边框/圆角/合理内边距）与上下区域的间距；③ **独立结果卡片**——卡片头部为结果摘要/提示与刷新工具栏，卡片主体为七列表格；结果卡片头部与表格主体之间以清晰但轻量的分隔。页面不再把标题、查询、刷新、表格挤在一个无层级的连续平面中；页面背景、卡片边框、圆角、阴影、间距与现有 app-shell 和 Element Plus 浅色企业后台风格协调（`DSS-REQ-062` 不变）。本表数据规模与不分页边界不变：最多约 100 行、继续不分页（`DSS-REQ-020/021` 不变），不得因为视觉参考图含分页而增加分页。 |
| DSS-REQ-067 | 结果卡片头部左侧展示当前成功结果总数：`共 {records.length} 条`；如当前结果含未知状态，可在左侧以轻量橙色提示 `其中 {unknownCount} 条未知状态`，计数为 0 时不显示；该提示只统计接口返回记录的 `statusCategory=UNKNOWN`，不推断健康或错误。既有行内关联异常提示继续保留，不在头部扩展复杂的多类别汇总。 |
| DSS-REQ-068 | 结果卡片头部右侧把“灰色状态圆点（正在刷新时蓝色动态，但文字仍是主要信息载体）／`60 秒自动刷新`／分隔符／`最近成功刷新：HH:mm:ss`（从未成功为 `--`）／‘立即刷新’按钮”作为一个**不可拆散的整体**靠右展示，组成“刷新逻辑组”；刷新逻辑组在宽度不足时整体换行，不得只把“立即刷新”按钮挤到下一行；“立即刷新”按钮保持稳定宽度，加载图标出现/消失不得移动按钮本身、按钮前方文案或最近成功刷新时间；刷新失败提示放在不推动刷新逻辑组关键元素的稳定槽位，出现/消失不得造成工具栏明显水平跳动（`DSS-REQ-050` 既有稳定宽度要求继续成立）。 |
| DSS-REQ-069 | 七列及顺序保持不变（`DSS-REQ-027`），采用固定列宽：序号 `70px`（居中）、探针端 `170px`（左对齐、单行）、源库 `280px`（左对齐、单行，**必须明显宽于探针端列**）、快照状态 `130px`（居中）、快照启动时间/快照完成时间/记录更新时间各 `165px`（固定格式 `YYYY-MM-DD HH:mm:ss`、空值 `--`）。规则：① 三个时间字段长度固定，使用固定列宽承载，避免把多余空间平均分配给时间列；② 必要时允许表格容器横向滚动，不能通过换行挤压时间或主要文本；③ 探针端列在表格内只显示原始 `CLIENT_ID`（不再把 `CLIENT_DESC` 同行或次行展示），超出列宽单行省略号，悬停显示完整 `CLIENT_DESC`，描述为空时不弹空 Tooltip；④ 探针配置缺失时仍显示原始 `CLIENT_ID`，Tooltip/异常提示必须能表达“探针端配置缺失”，停用配置仍保留轻量异常说明；⑤ 源库列正常关联且 `ORG` 非空时只显示 `DATA_SOURCE_ORG`，超出列宽单行省略号，悬停显示完整 `DATA_SOURCE_ORG`，不再以原始 `DATA_SOURCE_ID` 作为正常行 Tooltip 的默认内容；⑥ 源库配置缺失或 `ORG` 为空时回退显示原始 `DATA_SOURCE_ID`（不得显示空白），Tooltip 显示完整原始 ID 及对应异常说明，停用、类别非 SOURCE 等既有轻量异常语义继续保留；⑦ 不改变状态排序、时间排序、状态映射、序号规则、行键、空值规则和“不补行”边界（`DSS-REQ-016~018/026/031~033/035~049` 等不变）。 |
| DSS-REQ-070 | 页面任意时刻最多只能显示 **1 个 Tooltip**，范围覆盖本页面所有表格 Tooltip（探针端描述、完整源库 `ORG`、未知状态原始值、探针/源库缺失/停用/类别异常等图标说明）。行为：① 快速横向或纵向扫过多行时，新触发项出现前必须立即关闭旧 Tooltip，不允许同时残留多个；② 离开触发区域、表格数据替换、滚动、窗口缩放、页面隐藏或卸载时关闭 Tooltip；③ Tooltip 不可交互（non-enterable / `pointer-events:none`），避免鼠标进入 Tooltip 后遗留；④ 统一短暂显示延迟（约 300~350ms）并即时关闭，不得仅依赖多个独立 Tooltip 各自的延迟；⑤ 采用页面级受控“当前 Tooltip”标识或单一 Tooltip Host，不得让多实例各自持有可并存的显示状态；⑥ 表格中不得混用可能与受控 Tooltip 同时出现的原生 `title` 浏览器提示；⑦ Tooltip 优先单行展示，如完整内容物理宽度超过安全视口，才允许在该极端情况下换行以保证全文可读与不越界；⑧ 对视口四边做边界避让，不超出可视区、不被表格容器裁切。 |
| DSS-REQ-071 | 保持单飞行、忙碌抑制、不并发、不排队、不补发等既有业务规则不变（`DSS-REQ-053/054`）。busy 视觉隔离规则：① 只有真正发起当前请求的操作呈现对应加载反馈——手工立即刷新时仅“立即刷新”显示加载反馈；条件查询时不得让“立即刷新”产生虚假的加载反馈；② 手工/自动/恢复可见刷新在途时，“查询”仍不可发起请求，但其文字、颜色、尺寸和位置不得闪动，不得呈现被点击或被置灰闪变的外观；同时必须阻止鼠标与键盘触发，并提供正确的 `aria-disabled` 语义；③ 查询或其它请求在途时，“立即刷新”不可发起第二个请求，非发起按钮不得表现得像被点击；④ 不能通过允许并发、取消当前请求后偷换为查询、排队查询或静默补发来解决视觉问题；⑤ 后续实现应证明：点击“立即刷新”时网络层只有一次按当前“已应用查询条件”发出的刷新请求，没有额外的查询请求。 |

### 21.1 本轮对已批准需求行的定向修订说明

本轮在已批准基线之上对下列既有需求行做**展示/交互层面的定向修订**（原批准文字保留于批准历史基线、批准内容基准提交 `4234af73db2190098f3dcd219319a4281fdabafd` 与 git 历史；本文件当前为调整草案，修订文字仅在 ChatGPT 对本调整草案正式复审 `APPROVED` 且项目负责人明确批准后才成为新基线）：

| 既有需求行 | 修订点 | 新增/配套规则落点 |
|---|---|---|
| `DSS-REQ-028`（探针端列） | 表格内只显示原始 `CLIENT_ID`，不再把 `CLIENT_DESC` 同行或次行展示；完整描述经悬停 Tooltip 展示（为空不弹空） | `DSS-REQ-069③/070`；UI 调整草案 §13 |
| `DSS-REQ-029`（源库列） | 正常关联且 ORG 非空只显示 `ORG`，悬停展示完整 `ORG`（不以原始 ID 作正常行 Tooltip）；配置缺失或 ORG 为空回退原始 `DATA_SOURCE_ID`（不空白）并带异常说明 | `DSS-REQ-069⑤⑥/070`；UI 调整草案 §13 |
| `DSS-REQ-050`（刷新工具栏） | 在既有“立即刷新稳定宽度”基础上扩展为结果卡片头部右侧不可拆散“刷新逻辑组”（整体右对齐、窄宽度整体换行、失败提示稳定槽位），并落实“仅发起操作呈现加载反馈 / 刷新在途查询不闪动” | `DSS-REQ-068/071`；UI 调整草案 §13 |

> 既有 `DSS-REQ-001~065` 中除上述三行外，其余业务行相对批准内容基准**整文件不变**；本轮不改动任何与本轮无关的业务行。

## 22. 明确非目标

下列内容属于本 Feature 明确不实现或不推断的范围（作为范围边界记录；凡可判定的“禁止”行为已编码进 §5~§20 相应 `DSS-REQ-*`）：

- 对 RUN_STATE 的任何产品写能力，或对运行侧（sync-client）的启停、通知、重新快照控制；
- 展示或推断 sync-client 在线/健康/离线、增量采集是否正常、当前同步进度；
- 从配置表补行、生成“未开始/待快照”等虚拟状态；
- 分页、时间范围、在线/健康/关键字等未批准查询；
- 依据时间字段计算超时/异常/离线/长期运行；
- 除明确允许的只读访问（`CDC_DATA_SOURCE_RUN_STATE`）与只读关联（`CDC_CLIENT_MULTIPLE`、`CDC_DATA_SOURCE`）之外的其他数据访问；执行任何 DDL/DML 或其他表写行为（本任务不访问数据库）；
- 本草案任务不进入设计、不实现代码、不执行验收。

## 23. 草案建议处置（R1：原 DSS-PROP-001~008 已全部决策并吸收）

R0 初版 §22“待用户复审的草案建议”所列 8 项 `DSS-PROP-*` 已在 R1 中全部由项目负责人确认并吸收为正式需求/验收行，本版不再保留任何待用户复审草案建议（`pending_user_confirmation_count=0`）。`pending_user_confirmation_count=0` 不等于 `IMPLEMENTED_ACCEPTED`：本版需求与验收基线已批准（ChatGPT 对 R3 结果正式复审 `APPROVED`，项目负责人随后明确“批准”，批准内容基准提交 `4234af73db2190098f3dcd219319a4281fdabafd`）；批准的是需求与验收标准基线，不代表设计已完成、功能已实现、验收已执行或通过。下一入口为设计基线建立。

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

## 24. 需求数量与编号核验

- 需求编号：`DSS-REQ-001`～`DSS-REQ-071`，共 **71** 条，编号连续唯一（`DSS-REQ-001~065` 为已批准基线既有行；`DSS-REQ-066~071` 为本轮 UI 调整草案新增行，见 §21）。
- 验收编号：`DSS-AC-001`～`DSS-AC-080`，共 **80** 条，全部 `NOT_RUN`（见 `ACCEPTANCE.md`；既有 `DSS-AC-001~068` 为已批准基线既有用例，其中 `DSS-AC-068` 覆盖刷新工具栏稳定宽度；本轮调整草案新增 `DSS-AC-069~080`，见 `ACCEPTANCE.md` §4.18）。
- 每条需求至少被一个验收用例覆盖，每条验收用例引用已存在需求编号（见 `ACCEPTANCE.md` 验收表格“关联需求”列与 §5 追踪矩阵；本轮新增需求/验收行已纳入追踪矩阵，正反向引用均无悬空）。
- 已批准基线（需求/验收正式批准版本 `DATA-SOURCE-SNAPSHOT-STATUS-REQUIREMENTS-BASELINE-APPROVAL-001`，批准内容基准 `4234af73db2190098f3dcd219319a4281fdabafd`；设计批准版本 `DATA-SOURCE-SNAPSHOT-STATUS-DESIGN-BASELINE-APPROVAL-001`）保留为历史。本轮为验收前 UI 调整草案：`REQUIREMENTS.md`/`ACCEPTANCE.md` 与 `DESIGN.md`/`UI.md` 当前调整版本为 `DRAFT_ADJUSTMENT_PENDING_USER_REVIEW`、实现状态 `IMPLEMENTED_ADJUSTMENT_PENDING`（既有实现存在、本轮调整尚未实现）、正式验收执行状态 `NOT_RUN`（`DSS-AC-001~080` 全部 `NOT_RUN`）、人工页面验收 `NOT_RUN`；不存在把本轮调整草案写成已批准、已实现或已验收，或把开发自测/实现完成写成正式验收已执行、`PASS/ACCEPTED`、`IMPLEMENTED_ACCEPTED` 的越权当前状态。
- 待用户复审草案建议：**0** 项（`pending_user_confirmation_count=0`；原 `DSS-PROP-001~008` 已全部决策并吸收，见 §23）。`pending_user_review=YES`（本轮为待 ChatGPT 正式复审与项目负责人审阅的 UI 调整草案），但 `pending_user_confirmation_count=0` 不等同于 `IMPLEMENTED_ACCEPTED`。

## 25. 文档级变更记录

| 日期 | 变更 | 依据 |
|---|---|---|
| 2026-09-05 | 建立“源库快照状态”Feature 需求草案（`DRAFT_PENDING_USER_REVIEW`；requirements_status/acceptance_status=`DRAFT_PENDING_USER_REVIEW`；实现状态 `NOT_STARTED`；验收执行状态 `NOT_RUN`；设计状态 `NOT_STARTED`；`DSS-REQ-001~065` 共 65 条；草案建议 `DSS-PROP-001~008`；全部数据库事实引用已提交数据库只读复核报告 `docs/database/reports/DATA-SOURCE-SNAPSHOT-STATUS-DATABASE-VERIFICATION-001.md`） | DATA-SOURCE-SNAPSHOT-STATUS-REQUIREMENTS-BASELINE-001（纯文档任务；基于项目负责人已确认产品决策 + 已核验数据库只读复核报告；待用户审阅与 ChatGPT 正式复审） |
| 2026-09-05 | R1 定向修订需求草案：修正 R1-01（统一“只读访问 RUN_STATE＋只读关联两张配置表”边界，消除“访问本表之外”自相矛盾）与 R1-03 相关需求（建立“界面选择条件/已应用查询条件”双状态与“重置不查询”，并入 `DSS-REQ-022~025`、`DSS-REQ-050~054`）；吸收项目负责人已确认的 8 项交互方案（并入 `DSS-REQ-022/023/024/029/035/036/038/045/051/054/055/061` 等）与刷新工具栏稳定宽度（`DSS-REQ-050`）；删除 `DSS-PROP-001~008` 待复审草案建议（`pending_user_confirmation_count=0`）；验收计数随 `ACCEPTANCE.md` 更新为 68 条；仍为 `DRAFT_PENDING_USER_REVIEW` 未批准草案，待 ChatGPT 对 R1 结果正式复审 | DATA-SOURCE-SNAPSHOT-STATUS-REQUIREMENTS-BASELINE-001-R1（ChatGPT 正式复审 `CHANGES_REQUIRED` 驱动的纯文档定向修订；草案未批准、功能未实现、验收未执行） |
| 2026-09-05 | R2 最小定向修订需求草案（ChatGPT 对 R1 结果正式复审 `CHANGES_REQUIRED`）：R2-01 明确“点击查询用请求快照、仅成功（含成功返回 0 条空结果）才升级已应用查询条件；按新条件查询失败保留旧结果/旧已应用条件/界面保留新条件/后续自动与立即刷新用旧条件/不更新最近成功刷新时间；请求在途再改控件成功升级的是请求开始时的快照”（并入术语与 `DSS-REQ-023/025/050/059/060/061`）；R2-02 明确“页面可见时每次实际请求结束（无论成功/失败）都从请求结束重启完整 60 秒周期；失败后 60 秒按已应用条件自动重试、不停止不立即无间隔；成功空结果同样属成功并重启计时；在途被抑制触发不视为实际请求、不单独重置计时；页面不可见停止计时且不保留剩余秒数、不可见期间不启动新计时；恢复可见立即刷新后无论成败重启完整 60 秒；最近成功刷新时间仅成功后更新”（并入 `DSS-REQ-050/051/053/054/061`）；编号与计数不变（需求 65、验收 68、全部 `NOT_RUN`）；仍为 `DRAFT_PENDING_USER_REVIEW` 未批准草案，待 ChatGPT 对 R2 结果正式复审 | DATA-SOURCE-SNAPSHOT-STATUS-REQUIREMENTS-BASELINE-001-R2（ChatGPT 对 R1 正式复审 `CHANGES_REQUIRED` 驱动的纯文档最小定向修订；草案未批准、功能未实现、验收未执行） |
| 2026-09-05 | R3 极小定向修订需求草案（ChatGPT 对 R2 结果正式复审 `CHANGES_REQUIRED`）：本版不改变任何需求业务规则，只把修订范围限定到验收草案 `DSS-AC-024`——修正该用例“成功刷新却不更新最近成功刷新时间”的验收矛盾，统一为“成功刷新更新‘最近成功刷新时间’但不替换‘已应用查询条件’，只有用户点击‘查询’且查询成功才允许替换”；因此 65 条 `DSS-REQ-*` 业务行相对本版授权基线 `5c58af6` 逐字节不变；编号与计数不变（需求 65、验收 68、全部 `NOT_RUN`）；仍为 `DRAFT_PENDING_USER_REVIEW` 未批准草案，待 ChatGPT 对 R3 结果正式复审 | DATA-SOURCE-SNAPSHOT-STATUS-REQUIREMENTS-BASELINE-001-R3（ChatGPT 对 R2 结果正式复审 `CHANGES_REQUIRED` 驱动的纯文档极小定向修订；草案未批准、功能未实现、验收未执行） |
| 2026-09-05 | 需求与验收基线批准收口：ChatGPT 对 R3 结果（提交 `4234af73db2190098f3dcd219319a4281fdabafd`）正式复审结论 `APPROVED`，项目负责人随后明确回复“批准”；`REQUIREMENTS.md`/`ACCEPTANCE.md` 基线状态由 `DRAFT_PENDING_USER_REVIEW` 收口为 `APPROVED`（正式批准版本 `DATA-SOURCE-SNAPSHOT-STATUS-REQUIREMENTS-BASELINE-APPROVAL-001`，批准内容基准提交 `4234af73db2190098f3dcd219319a4281fdabafd`）；业务零变化——需求仍 65 条 `DSS-REQ-001~065`、验收仍 68 条 `DSS-AC-001~068` 全部 `NOT_RUN`、需求—验收追踪矩阵零差异；实现状态保持 `NOT_STARTED`、设计状态保持 `NOT_STARTED`、验收执行状态保持 `NOT_RUN`；批准的是需求与验收标准基线，不代表设计已完成、功能已实现、验收已执行或通过、也不代表 `IMPLEMENTED_ACCEPTED`；下一入口更新为设计基线建立 | DATA-SOURCE-SNAPSHOT-STATUS-REQUIREMENTS-BASELINE-APPROVAL-001（项目负责人明确批准驱动的需求与验收基线批准收口；纯文档任务，未设计、未实现、未执行验收） |
| 2026-09-06 | 本文件仅同步实现任务 `DATA-SOURCE-SNAPSHOT-STATUS-IMPLEMENTATION-001` 完成后的**当前实现状态与文档级实现记录**（文档级状态同步，不新增/删除/修改任何 `DSS-REQ-*` 需求业务行，相对批准内容基准 `4234af7...` 业务零变化，追踪矩阵零差异）：元数据“前端现状/后端现状/实现状态/设计状态”行更新为已实现（`IMPLEMENTED_PENDING_REVIEW`）与设计已批准事实；实现任务完成占位页替换为正式页、后端新增只读 GET 链路、三多选/七列/60 秒自动刷新等全部按批准需求与设计落地（开发测试 27+62、前端全量 663、构建、真实浏览器联调见实现报告与证据）；需求/验收批准状态不变（`APPROVED`）、68 条验收保持 `NOT_RUN`、正式验收未执行 | DATA-SOURCE-SNAPSHOT-STATUS-IMPLEMENTATION-001（前后端实现；纯文档记录，不改需求业务行、不执行正式验收） |
| 2026-09-06 | 实现修复任务 `DATA-SOURCE-SNAPSHOT-STATUS-IMPLEMENTATION-001-R1` 完成：本文件仅新增 §20.1 任务级测试数据授权例外说明（本行不含任何 `DSS-REQ-*` 业务行变更，65 条 `DSS-REQ-*`/68 条 `DSS-AC-*` 业务行与追踪矩阵相对基准 `d125397` 零差异）；R1-01 在公共 `http.ts` 增加请求级 `skipGlobalErrorPopup` 开关（默认未开启的其它页面错误弹窗行为不变、未删公共拦截器），本页 `fetchSnapshotStatusList` 开启该开关由页面统一脱敏/收敛失败反馈，真实拦截链测试（HTTP500/超时断网/业务码非 200/默认行为不变/60 秒恢复）6 用例通过，前端全量 669/669、构建成功；R1-02 按负责人授权对所指生产库三表执行测试 INSERT＋COMMIT 并保留（RUN_STATE +29、CLIENT_MULTIPLE +5、DATA_SOURCE +5，前缀 `dssr1-0906-`，FG_ACTIVE='0'、连接值不可用绝不连接、不 UPDATE/DELETE 已有行、无 TRUNCATE/DDL/其它表/触发器写入，运行中只读接口读回 30 条），授权例外仅限本任务不扩散；R1-03 补齐 1440×900/1920×1080 浏览器证据（七列/状态标签/三时间/三多选/成功 0 条/重置不请求/真实 HTTP500 保留与恢复/60 秒自动刷新/隐藏暂停/恢复可见/工具栏稳定宽度/边缘 Tooltip，错误仅在 CDP Fetch 层注入）与后端全量测试澄清（`cd backend && mvn clean test`，默认 profile、无筛选/排除/跳过，退出码 1，Tests 1022、Failures 3、Errors 17、Skipped 0，非通过全部集中在既存 `monitor.jobfailure` 模块的 ZooKeeper 不可达与日期映射环境性失败，详见报告与 `evidence/...R1/`）；实现状态保持 `IMPLEMENTED_PENDING_REVIEW`、需求/验收/设计批准状态不变、68 条验收保持 `NOT_RUN`、正式验收未执行 | DATA-SOURCE-SNAPSHOT-STATUS-IMPLEMENTATION-001-R1（复审问题修复与证据补齐；纯文档记录，不改需求业务行、不执行正式验收） |
| 2026-09-07 | 验收前 UI 调整草案 `DATA-SOURCE-SNAPSHOT-STATUS-UI-ADJUSTMENT-BASELINE-001`（纯文档草案，**不自动批准、不实现、不执行验收**）：在既有批准需求之上定向修订展示相关行并在批准编号后连续新增。本文件定向修订 `DSS-REQ-028`（探针端列只显示原始 `CLIENT_ID`、完整 `CLIENT_DESC` 经悬停 Tooltip、不再同行/次行内联展示）、`DSS-REQ-029`（源库列正常关联且 ORG 非空只显示 `DATA_SOURCE_ORG`、悬停显示完整 ORG 而非原始 ID 默认内容、缺失/ORG 空回退显示原始 `DATA_SOURCE_ID` 不空白）、`DSS-REQ-050`（刷新工具栏归入结果卡片头部右侧不可拆散刷新逻辑组、窄宽度整体换行、仅发起操作呈现加载反馈、刷新在途“查询”不闪动，落点并入新增 `DSS-REQ-068/071` 与 §21.1）；新增 `DSS-REQ-066~071` 共 6 条（页面三块清晰分区 `DSS-REQ-066`、结果卡片头部左侧总数＋未知状态轻量提示 `DSS-REQ-067`、右侧不可拆散刷新逻辑组 `DSS-REQ-068`、七列固定列宽 `DSS-REQ-069`、页面级单实例 Tooltip `DSS-REQ-070`、busy 视觉隔离与单请求语义 `DSS-REQ-071`）于新 §21；既有批准业务行其余不变。计数：需求 `DSS-REQ-001~071` 共 71（066-071 为草案新增）、验收随 `ACCEPTANCE.md` 更新为 `DSS-AC-001~080` 共 80 条全部 `NOT_RUN`（草案新增 `DSS-AC-069~080` 见 `ACCEPTANCE.md` §4.18）。状态迁移（草案范围）：`REQUIREMENTS.md`/`ACCEPTANCE.md` 与 `DESIGN.md`/`UI.md` 当前调整版本为 `DRAFT_ADJUSTMENT_PENDING_USER_REVIEW`、实现状态 `IMPLEMENTED_ADJUSTMENT_PENDING`（既有实现存在、本轮调整尚未实现）、正式验收执行 `NOT_RUN`、人工页面验收 `NOT_RUN`、`pending_user_review=YES`、`pending_user_confirmation_count=0`；旧批准版本（需求/验收批准 `4234af73...`、设计批准 `61117a62...`）保留为历史，批准旧基线**不自动批准**本轮调整草案。`API.md`/`DATABASE.md` 本轮不改接口/编号/业务内容，整文件零差异。下一入口为 ChatGPT 对本 UI 调整基线草案的正式复审（不是直接实现）；本轮草案经复审与负责人批准后再另立任务实现 | DATA-SOURCE-SNAPSHOT-STATUS-UI-ADJUSTMENT-BASELINE-001（ChatGPT 对实现 R1 复审 `CHANGES_REQUIRED` 与负责人 UI 调整要求驱动的验收前纯文档调整草案；已批准旧基线作为历史保留，草案未批准、本轮调整未实现、验收未执行） |

> 关联文档：验收草案 `docs/features/data-source-snapshot-status/ACCEPTANCE.md`；功能入口与状态 `docs/features/data-source-snapshot-status/README.md`；Feature 总索引 `docs/features/README.md`。
