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
| 任务编号 | `DATA-SOURCE-SNAPSHOT-STATUS-REQUIREMENTS-BASELINE-001` |
| 任务类型 | 纯文档——需求与验收草案（只建立功能级文档并提交、推送；严禁进入设计、编码、数据库访问或运行服务阶段） |
| 授权基线提交 | `72b305a8e4134d10f514920c215b9647fb7d9e3b`（任务开始时 `origin/develop` 最新提交，本地 HEAD 与其一致，ahead/behind=0/0） |
| 创建日期 | 2026-09-05 |
| 需求来源 | 项目负责人已确认的产品决策（任务提示词 §6）+ 已核验数据库只读复核报告（`docs/database/reports/DATA-SOURCE-SNAPSHOT-STATUS-DATABASE-VERIFICATION-001.md`）+ 既有 Feature 文档结构/术语约定（`topic-offset`、`client-config` 等仅作结构参考，不复制其业务规则） |

文档事实边界声明：

- 用户已确认的业务规则在本文件中作为需求事实记录（`DSS-REQ-*`）。
- 仓库现状（路由、菜单标题、占位页、无后端访问链路）作为 AS-IS 事实记录，并标注来源。
- `CDC_DATA_SOURCE_RUN_STATE` 数据库物理事实全部引用已提交数据库只读复核报告（见 §3），本文件不重新查询数据库。
- 项目负责人尚未单独决定、本文件依据平台一致性提出推荐方案的细节，一律标记为 `DRAFT_PROPOSAL_PENDING_USER_REVIEW` 并集中列入 §11，不伪装成已确认事实。
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
- 连接或调用 sync-client、Kafka、ZooKeeper/TongZK；访问本表之外的数据或执行 DDL/DML；
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
| DSS-REQ-015 | 允许使用 LEFT JOIN 补充探针端描述和源库 ORG 等展示信息；JOIN 只补充展示信息，绝不能改变 RUN_STATE 驱动的数据行集合，也不产生任何写副作用。 |

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
| DSS-REQ-022 | 查询区只保留三个条件：探针端、源库、快照状态；不提供时间范围、在线状态、健康状态、关键字或其他未批准条件。 |
| DSS-REQ-023 | 首次进入页面自动查询全部，无需点击“查询”按钮。 |
| DSS-REQ-024 | 三个查询条件的候选仅来源于当前 RUN_STATE 实际记录及其可选展示信息；不把没有 RUN_STATE 记录的探针端或源库加入候选。 |
| DSS-REQ-025 | 查询不得因为关联配置缺失或停用而排除 RUN_STATE 行；条件命中只作用于 RUN_STATE 原始记录及其可解析/可展示的补充信息。 |

> 三个查询控件是单选还是多选、是否包含显式“全部”、快照状态候选如何归并未知状态，尚未由项目负责人指定；草案建议见 §11 `DSS-PROP-001/002`，不写入已确认需求。

## 11. 列表字段

| 编号 | 需求 |
|---|---|
| DSS-REQ-026 | 序号为当前完整结果集内的稳定显示序号，不是业务主键；行的唯一标识为 `CLIENT_ID + DATA_SOURCE_ID`。 |
| DSS-REQ-027 | 列表固定七列，顺序为：序号、探针端、源库、快照状态、快照启动时间、快照完成时间、记录更新时间。 |
| DSS-REQ-028 | “探针端”列必须展示原始 `CLIENT_ID`；关联成功时可补充展示 `CLIENT_DESC`。 |
| DSS-REQ-029 | “源库”列优先展示关联的源库 ORG；同时必须保证用户能够查看原始 `DATA_SOURCE_ID`。 |
| DSS-REQ-030 | “快照状态”列以中文状态标签展示，同时必须保证用户能够查看数据库原始状态值（如 `SNAPSHOT_RUNNING`）。 |
| DSS-REQ-031 | “快照启动时间”展示 `SNAPSHOT_LAST_SEEN_AT`；值为 NULL 时显示 `--`。 |
| DSS-REQ-032 | “快照完成时间”展示 `SNAPSHOT_COMPLETED_AT`；值为 NULL 时显示 `--`。 |
| DSS-REQ-033 | “记录更新时间”展示 `UPDATED_AT`。 |
| DSS-REQ-034 | 列表不设置操作列；不提供详情、编辑、删除、跳转或任何写操作入口。 |

## 12. 状态映射与未知状态

| 编号 | 需求 |
|---|---|
| DSS-REQ-035 | `SNAPSHOT_RUNNING` 状态展示为“快照进行中”。 |
| DSS-REQ-036 | `SNAPSHOT_COMPLETED` 状态展示为“快照已完成”。 |
| DSS-REQ-037 | 数据库对 `SNAPSHOT_STATUS` 没有建立封闭取值 Check 约束（已核验数据库事实）；实现必须宽容处理未知状态。 |
| DSS-REQ-038 | 未知状态的记录仍然展示；以与两种已知状态清晰区分的“未知状态”视觉标签呈现，并展示数据库原始状态值；未知标签最终采用灰色或橙色属于后续 UI 设计决策，需求只要求与已知状态清晰区分。 |
| DSS-REQ-039 | 未知状态不得造成整个接口或页面报错，也不得被丢弃或改写为已知状态。 |
| DSS-REQ-040 | 当前开发库没有 `SNAPSHOT_COMPLETED` 真实样例；需求与验收不依赖开发库天然存在该样例，`SNAPSHOT_COMPLETED` 场景通过受控测试数据构造（构造授权见 §20）。 |

## 13. 关联异常兼容

| 编号 | 需求 |
|---|---|
| DSS-REQ-041 | `CLIENT_ID` 找不到对应探针端时，仍展示原始 `CLIENT_ID`，并提供轻量异常提示。 |
| DSS-REQ-042 | `DATA_SOURCE_ID` 找不到对应数据源时，仍展示原始 `DATA_SOURCE_ID`，并提供轻量异常提示。 |
| DSS-REQ-043 | 关联的探针端或源库已停用时，RUN_STATE 行仍展示，并可标识“配置已停用”。 |
| DSS-REQ-044 | 关联源库类别不是 SOURCE、类别大小写异常或其他配置异常时，RUN_STATE 行仍展示并提供轻量提示。 |
| DSS-REQ-045 | 上述异常提示只描述配置关联事实；不把快照状态改判为失败，也不触发任何数据库修复或写行为。 |

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
| DSS-REQ-050 | 页面提供“60 秒自动刷新＋立即刷新”。 |
| DSS-REQ-051 | 页面不可见时暂停自动刷新；页面重新可见后恢复自动刷新。 |
| DSS-REQ-052 | 自动刷新和手工刷新只重新读取数据库；不写数据库，不改变任何数据。 |
| DSS-REQ-053 | 前一次刷新请求未结束时不得发起下一次重叠请求。 |
| DSS-REQ-054 | 自动刷新周期固定为 60 秒；计时的起点、页面不可见时的计时处理、恢复可见后是否立即刷新一次等细节见 §11 `DSS-PROP-006/008`（草案建议）。 |

## 16. 时间字段边界

| 编号 | 需求 |
|---|---|
| DSS-REQ-055 | 三个时间字段（`SNAPSHOT_LAST_SEEN_AT`、`SNAPSHOT_COMPLETED_AT`、`UPDATED_AT`）按数据库值展示；展示格式/时区/NULL 处理遵循 §11 草案建议与后续设计决定，格式化不得改变其业务时间值。 |
| DSS-REQ-056 | 不根据任何时间字段计算或呈现“超时”“异常”“离线”“长期运行”等状态。 |
| DSS-REQ-057 | 不因为 `SNAPSHOT_RUNNING` 持续时间长而自动显示为错误或警告。 |

## 17. 加载、空数据、失败与恢复

| 编号 | 需求 |
|---|---|
| DSS-REQ-058 | 首次加载在途时提供加载反馈（具体控件形式见 §11 草案建议）。 |
| DSS-REQ-059 | 首次加载失败时展示错误状态和“重新加载”入口；不得把失败展示成空数据或成功状态。 |
| DSS-REQ-060 | 查询结果为零时展示空数据提示；不得展示成接口错误。 |
| DSS-REQ-061 | 页面必须区分“加载成功、加载失败、空结果、进行中”等状态，失败与空结果不得互相伪装；查询/刷新失败时给出可理解的脱敏失败提示（保留旧结果、连续失败提示收敛、最近成功刷新时间等展示细节见 §11 草案建议）。 |

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
- 访问本表以外的数据或对象，执行 DDL/DML（本任务不访问数据库）；
- 本草案任务不进入设计、不实现代码、不执行验收。

## 22. 待用户复审的草案建议

以下实现或交互细节尚未由项目负责人决定，依据现有平台一致性提出推荐草案。统一标记 `DRAFT_PROPOSAL_PENDING_USER_REVIEW`；每一项给出推荐方案、理由与备选影响。凡现有已批准平台规范已明确的可直接继承项，未重复列为问题。

| 编号 | 主题 | 推荐方案 | 理由 | 备选影响 |
|---|---|---|---|---|
| DSS-PROP-001 | 三个查询控件形态 | 探针端、源库、快照状态均采用单选下拉，并包含显式“全部”特殊选项；默认“全部”＝查询不含该条件。 | 本功能一次展示 ≤100 条且候选源于 RUN_STATE 实际记录，单选＋“全部”已满足筛选诉求，与同属运行监控的轻量只读页交互一致、实现简单。 | 若改多选，需处理“或”语义、候选去重与“全部”切换规则，交互与验收用例增加。 |
| DSS-PROP-002 | 快照状态条件候选 | 候选为“快照进行中”“快照已完成”与“未知状态”三项（未知状态仅在存在未知状态记录时出现），选中“未知状态”筛出 `SNAPSHOT_STATUS` 不属于已确认集合的行。 | 保证未知状态可被用户主动查看与筛出，与宽容未知状态规则一致。 | 若不允许按未知状态筛选，则用户无法只看未知记录，需另行设计查看途径。 |
| DSS-PROP-003 | “源库”列保证查看原始 ID 的展示形式 | 采用两行单元格：第一行展示源库 ORG（无 ORG 时显示“未定义名称”），第二行展示原始 `DATA_SOURCE_ID`；整列仍归于一列“源库”。 | 需求要求“优先展示 ORG，同时保证可查看原始 ID”，两行固定结构比悬浮更直接、不依赖交互发现。 | 若采用悬浮 Tooltip，长列表下查看原始 ID 需逐行悬浮，发现性弱。 |
| DSS-PROP-004 | 状态标签颜色方案 | 快照进行中＝处理色（蓝），快照已完成＝中性（绿或灰），未知状态＝橙色警示弱标签；最终色值由 UI 设计阶段确定。 | 与运行监控浅色体系一致，未知状态需与已知状态清晰区分（DSS-REQ-038）。 | 颜色属于 UI 设计决策，本草案只固化“区分且不唯一依赖颜色”。 |
| DSS-PROP-005 | 时间展示格式 | 三个时间字段展示为 `YYYY-MM-DD HH:mm:ss`（本地时间、到秒），NULL 按 DSS-REQ-031/032 显示 `--`。 | 与已批准运行监控只读页（topic-offset 断点更新时间）格式一致，符合平台公共规范。 | 若平台另有统一时区规范，应以设计阶段决定为准。 |
| DSS-PROP-006 | 加载态与刷新失败展示 | 继承已批准 topic-offset 刷新交互：自动/手工刷新失败保留上一次成功结果，不清空数据；刷新提示收敛，连续失败不逐周期堆叠重复提示；刷新进行中不造成表格明显闪烁。 | topic-offset 同属运行监控只读自动刷新页，交互已被批准，复用可保持平台一致。 | 若要求失败即清空，会失去已有数据，需更多确认。 |
| DSS-PROP-007 | 轻量异常提示与原始值查看形式 | 探针端/源库单元格在配置缺失、停用或类别异常时，以行内弱提示文字或小图标＋悬浮解释呈现；快照状态原始值通过悬浮展示；探针端原始 ID 直接展示。 | 需求要求“轻量异常提示”，行内弱提示/悬浮不打断浏览。 | 悬浮与 Tooltip 具体形态（单实例、延迟、不可驻留）如需要，可复用 topic-offset 已批准 Tooltip 规则。 |
| DSS-PROP-008 | 恢复可见后的刷新行为 | 页面从不可见恢复可见后立即刷新一次并重新开始 60 秒计时。 | 与 topic-offset 已批准行为（TOFF-REQ-107 语义）一致，保证返回页面即拿到较新数据。 | 若恢复可见不立即刷新，数据可能最多滞后 60 秒。 |

## 23. 需求数量与编号核验

- 需求编号：`DSS-REQ-001`～`DSS-REQ-065`，共 **65** 条，编号连续唯一。
- 验收编号：`DSS-AC-001`～`DSS-AC-067`，共 **67** 条，全部 `NOT_RUN`（见 `ACCEPTANCE.md`）。
- 每条需求至少被一个验收用例覆盖，每条验收用例引用已存在需求编号（见 `ACCEPTANCE.md` 验收表格“关联需求”列与 §6 追踪矩阵）。
- 文档状态 `DRAFT_PENDING_USER_REVIEW`，不存在 `APPROVED`、`IMPLEMENTED`、验收 `PASS/ACCEPTED` 等越权状态。
- 待用户复审草案建议：`DSS-PROP-001`～`DSS-PROP-008`，共 **8** 项（`pending_user_confirmation_count=8`）。

## 24. 文档级变更记录

| 日期 | 变更 | 依据 |
|---|---|---|
| 2026-09-05 | 建立“源库快照状态”Feature 需求草案（`DRAFT_PENDING_USER_REVIEW`；requirements_status/acceptance_status=`DRAFT_PENDING_USER_REVIEW`；实现状态 `NOT_STARTED`；验收执行状态 `NOT_RUN`；设计状态 `NOT_STARTED`；`DSS-REQ-001~065` 共 65 条；草案建议 `DSS-PROP-001~008`；全部数据库事实引用已提交数据库只读复核报告 `docs/database/reports/DATA-SOURCE-SNAPSHOT-STATUS-DATABASE-VERIFICATION-001.md`） | DATA-SOURCE-SNAPSHOT-STATUS-REQUIREMENTS-BASELINE-001（纯文档任务；基于项目负责人已确认产品决策 + 已核验数据库只读复核报告；待用户审阅与 ChatGPT 正式复审） |

> 关联文档：验收草案 `docs/features/data-source-snapshot-status/ACCEPTANCE.md`；功能入口与状态 `docs/features/data-source-snapshot-status/README.md`；Feature 总索引 `docs/features/README.md`。
