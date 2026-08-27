# DOMAIN_GLOSSARY — 领域词汇表（项目级基线）

> 文档状态：`DRAFT_PENDING_USER_REVIEW`
> 恢复任务：PROJECT-BASELINE-AND-DOCUMENTATION-RECOVERY-001
> 恢复日期：2026-08-27
> 恢复任务执行基线：6dc22ecd67b7268ae3ee4761f5412c1e7b50ce5c
> 恢复草案首次入库提交：a6f51f8a8ff984bc946a4e2ccaccbf56692722fe
> 本轮修订任务：PROJECT-BASELINE-DOCUMENTATION-REVIEW-FIX-001（结果提交见本轮实施报告）
> 来源：服务器既有候选（docs/baseline/ 未提交文件，原 BASELINE-001/002 与 DATABASE-CODE-MAPPING-001 Phase 2 固化）+ 恢复任务修订 + 本轮复审修订，对齐当前代码与已批准数据库基线
> 首次草拟：2026-08-12

基线日期: 2026-08-27（恢复草案，历史草稿 2026-08-12）
基线来源: `BASELINE-001` + R1/R2 修订 → `BASELINE-002` → `DATABASE-CODE-MAPPING-001` Phase 2 固化
维护触发: 新增业务模块、表结构变更、术语口径调整

---

## 基础概念

### CDC
**Change Data Capture（变更数据捕获）**。指通过读取数据库日志（如Oracle Redo Log）捕获数据变更的技术。本项目是CDC配置的管理和运行监控平台，不替代已有CDC同步程序。

来源: 项目名、Oracle CDC表命名约定、CLAUDE.md §1

### 数据源 (DataSource)
**源库或目标库的连接配置**。包含主机、端口、Service Name、用户名、密码、分类（DATA_SOURCE_CATEGORY）、类型（DATA_SOURCE_TYPE）等信息。数据库对应 `CDC_DATA_SOURCE` 表，主键为 DATA_SOURCE_ID（VARCHAR2业务主键），扩展信息存储在 `CDC_DATA_SOURCE_EXTEND`（1:1关系）。

来源: DataSource实体、CDC_DATA_SOURCE表、docs/pages/data-source-management.md

### 客户端 (Client)
**CDC同步客户端实例**。每个客户端对应一个物理或逻辑同步进程，在ZooKeeper中以 `/bsoft-cdc/clients/{clientId}` 节点表示。当前管理平台生产代码通过 `CDC_CLIENT_MULTIPLE` 表访问客户端信息（DATA_SOURCE_ID 以逗号分隔多值弱逻辑引用存储）。`CDC_CLIENT` 表已废弃，不作为当前有效设计对象。

来源: ZK节点模型、CDC_CLIENT_MULTIPLE表、ZooKeeperMonitorServiceImpl、DATABASE-CODE-MAPPING-001

### Job
**采集任务（数据同步作业）**。每个Client下可包含多个Job，每个Job对应一个具体的同步任务。在ZK中以 `/bsoft-cdc/clients/{clientId}/{jobName}` 节点表示，包含 `alive`（临时节点）、`scn`（SCN值）、`scnUpdateTime` 等子节点。

来源: ZK节点模型、ZooKeeperJobVO、NodeDataParser

---

## ZooKeeper节点模型

### alive (ZK临时节点)
**ZooKeeper Ephemeral节点，表示Client或Job的在线状态**。如果alive节点存在，表示对应实体当前在线运行；如果alive节点消失（连接断开），表示离线。监控规则采用"alive-first"原则：先检查alive存在性，再读取其他节点。

来源: ZK节点树文档、ZooKeeperReadOnlyClient

### SCN
**System Change Number（Oracle系统变更号）**。标识Oracle数据库的一致性变更点。Job的SCN值从ZK的 `scn` 子节点读取，独立于alive状态——即使Job停止运行，其SCN值也会保留。

来源: ZooKeeperJobVO.scn字段、CDC_DATA_SOURCE_SCN表

### 监控根路径
**ZK监控操作限定于 `/bsoft-cdc/clients`**。不读取 `/bsoft-cdc/servers` 和 `/bsoft-cdc/signals`。

来源: CLAUDE.md §14.5、ZooKeeperMonitorServiceImpl.listClients()

---

## 数据库核心概念

### FG_ACTIVE
**逻辑启用标志**。出现在多张业务表（CDC_DATA_SOURCE、CDC_CLIENT_MULTIPLE等）中，值为1表示逻辑启用。不同于物理删除（DELETE_TIME软删除）。

来源: DB字段、DataSourceServiceImpl

### CLOB
**Character Large Object（Oracle大文本类型）**。本项目用于存储故障详情（FAILURE_DETAIL字段），在前端采用懒加载方式（3行展开→按需请求 `/api/job-failure/clob`）。

来源: JobFailureEvent实体、JobFailureController

### 数据订阅 (DataSubscribe)
**源表到目标表的同步订阅关系**。数据库对应 `CDC_DATA_SUBSCRIBE` 表，定义哪个源表的哪些数据同步到哪个目标表。

来源: CDC_DATA_SUBSCRIBE表、DataSubscribeEntity

### 快照 (Snapshot)
**数据源同步的某个时间点状态**。存储在 `CDC_DATA_SOURCE_RUN_STATE` 表中，记录某个Client/DataSource组合在特定时刻的运行快照信息。

来源: CDC_DATA_SOURCE_RUN_STATE表

---

## 同步链路与日志术语

### sync-client
**CDC 同步客户端进程**。负责具体数据同步作业的运行，将故障事件写入 CDC_JOB_FAILURE_EVENT、故障处理记录写入 CDC_JOB_FAILURE_HANDLE_LOG（R09～R11 维护方），并在 ZooKeeper 注册在线状态。管理平台对其写入的数据只读。

来源: RELATIONS.md（R09～R11 维护方）、ARCHITECTURE.md §4.8

### sync-server
**CDC 同步服务端进程**。负责日志生成与投递，正确日志/错误日志经 Kafka 由 sync-log 写入 CDC_LOG_CORRECT / CDC_LOG_ERROR（R05～R08 维护方）。管理平台对两张日志表只读，通过两条读路径读取：日志查询经 LogQueryMapper XML 游标分页，大屏增量统计经 JdbcTemplate 批量读取 + 内存聚合。

来源: RELATIONS.md（R05～R08 维护方）、ARCHITECTURE.md §4.8

### sync-log
**CDC 日志写入组件**。将同步日志（正确/错误）落库到 CDC_LOG_CORRECT / CDC_LOG_ERROR 的环节，是日志统计源数据的写入方。

来源: RELATIONS.md（R05～R08 维护方）、ARCHITECTURE.md §4.3

### 探针 (Probe)
**与客户端实例同义的口径**，出现在 CDC_CLIENT_MULTIPLE 的客户端/探针列表语义中。当前文档统一以"客户端"为主术语，"探针"作为等价口径引用。

来源: ARCHITECTURE.md §4.1、CDC_CLIENT_MULTIPLE

### 正确日志 (Correct Log)
**同步成功的日志记录**。存储在 CDC_LOG_CORRECT 表，是大屏增量统计的源数据之一，同时供日志查询页只读检索。两条读路径：日志查询经 LogQueryMapper XML 游标分页，大屏统计经 JdbcTemplate 批量读取 + 内存聚合。

来源: CDC_LOG_CORRECT、ARCHITECTURE.md §4.1/§4.5

### 错误日志 (Error Log)
**同步失败的日志记录**。存储在 CDC_LOG_ERROR 表，是大屏增量统计的源数据之一，同时供日志查询页只读检索。读取路径与正确日志相同（日志查询 XML 游标分页 + 大屏统计 JdbcTemplate）。

来源: CDC_LOG_ERROR、ARCHITECTURE.md §4.1/§4.5

### Topic
**Kafka 消息主题**。日志链路中同步日志经 Kafka 按 Topic 组织投递（sync-server → Kafka → sync-log）。运行监控中的"Topic偏移量"页对应 Kafka Topic 消费偏移量监控。

来源: menu.ts、docs/product/modules.md、RELATIONS.md（R05～R08 链路）

### Offset (偏移量)
**Kafka 消息消费位置**。Topic 偏移量监控关注消费组在各 Topic 上的消费进度。

来源: menu.ts、docs/product/modules.md

### 源库 / 目标库
**数据源的两类角色**。源库为变更数据来源，目标库为数据同步去向；由 DATA_SOURCE_CATEGORY 区分（SOURCE/TARGET）。数据订阅（DATA_SUBSCRIBE）通过 DATA_FROM_SOURCE_ID / DATA_TO_SOURCE_ID 表达源库→目标库订阅关系。

来源: CDC_DATA_SOURCE、RELATIONS.md（R02/R03、R15）

---

## Job故障监控领域

### 故障事件 (FaultEvent)
**一次作业失败记录**。存储在 `CDC_JOB_FAILURE_EVENT` 表，包含失败时间、FLINK状态、失败原因、失败详情（CLOB）、事件结果等信息。

来源: JobFailureEvent实体

### 处理记录 (HandleLog)
**一次故障处理动作的记录**。存储在 `CDC_JOB_FAILURE_HANDLE_LOG` 表，包含18个字段，记录故障从发生到恢复的完整处理链路。

来源: JobFailureHandleLog实体

### 故障过程 (FaultProcess)
**从首次失败到恢复的完整生命周期**。由algorithm包中FaultProcessGrouper将多个故障事件按规则分组为同一个故障过程，再由FaultProcessAssembler组装为完整的故障过程对象。

来源: algorithm包、FaultProcessGrouper

### 故障根 (FaultRoot)
**故障链的起始事件**。FaultProcessGrouper通过规则识别一个故障过程中最早的事件作为"故障根"，后续所有事件属于该故障根的衍生。

来源: FaultProcessGrouper、FaultRoot字段

### 物理Job链 (PhysicalJobChain)
**一个数据源下所有物理Job的拓扑关系链**。由JobChainBuilder构建，MainChainFilter过滤出主链，支持多个物理Job之间的依赖关系分析。

来源: JobChainBuilder、MainChainFilter

### 两级状态系统
**Job当前状态（2种）+ 故障过程状态（5种）**。Job当前状态为RUNNING或STOPPED；故障过程状态为更细粒度的故障生命周期状态。此设计由提示词043（V1.2规格修订）引入。

来源: docs/pages/job-runtime-failure-recovery-spec.md

---

## 大屏增量统计领域

### 水位 (Watermark)
**统计已处理到的日志ID位置**。存储在 `CDC_STATS_WATERMARK` 表，按TASK_CODE区分不同统计任务，CORRECT和ERROR日志各有独立水位。

来源: StatsWatermarkEntity、CDC_STATS_WATERMARK表

### CAS (Compare-And-Swap)
**乐观锁更新水位**。WatermarkCasUpdater使用CAS策略更新水位值，避免并发调度执行时的水位覆盖问题。

来源: WatermarkCasUpdater.java

### 安全延迟 (SafetyDelay)
**避免读取未完全写入的日志的延迟时间**。在计算本批次可读取的日志ID上界时，从当前时间减去安全延迟时间，确保不读取可能还在写入中的日志行。

来源: SafeUpperIdProvider、CDC_STATS_TASK_CONFIG.safetyDelayMinutes

### 安全上界 (SafeUpperId)
**当前时间 - 安全延迟对应的Snowflake ID**。每轮统计的日志ID读取上限，由SnowflakeIdBoundaryCalculator基于当前时间和安全延迟计算。

来源: SnowflakeIdBoundaryCalculator.java

### 批量 (Batch)
**一次事务处理的日志行数**。BatchTransactionExecutor在一次 `@Transactional` 内完成：读取日志 → 聚合统计 → 写入结果表 → CAS更新水位。批量大小由DynamicBatchSizeManager动态调整（范围50,000-500,000，步长10,000）。

来源: BatchTransactionExecutor、DynamicBatchSizeManager

### 轮次 (Round)
**一次调度执行的所有批次**。RoundExecutor管理一轮统计的完整生命周期：获取安全上界 → 交替处理CORRECT/ERROR日志 → 逐批执行直到批次数上限、时长上限或追平。

来源: RoundExecutor、CDC_STATS_TASK_CONFIG（maxBatchesPerRun, maxRunDurationSeconds）

### 维度 (Dim)
**按数据源、客户端、订阅等维度的统计聚合**。DimKeyBuilder和DimType定义统计维度，结果写入CDC_STATS_DIM_CUMULATIVE和CDC_STATS_DIM_DAILY表。

来源: DimKeyBuilder、DimType

### 追平 (Caught-up)
**水位已达到安全上界**。当BatchTransactionExecutor发现当前水位已等于或超过安全上界时，返回EMPTY状态，当前轮次结束，等待下一调度周期。

来源: BatchTransactionExecutor、commit 3863a09（追平边界修复）

---

## 统计表体系

| 表名 | 作用 | 聚合级别 |
|---|---|---|
| CDC_STATS_CUMULATIVE_OVERVIEW | 累计总览统计 | 任务级 |
| CDC_STATS_DAILY_OVERVIEW | 每日总览统计 | 任务×日期 |
| CDC_STATS_DIM_CUMULATIVE | 维度累计统计 | 任务×维度类型×维度值 |
| CDC_STATS_DIM_DAILY | 维度每日统计 | 任务×维度类型×维度值×日期 |
| CDC_STATS_WATERMARK | 统计水位 | 任务×日志类型(CORRECT/ERROR) |
| CDC_STATS_TASK_CONFIG | 统计任务配置 | 任务级(TASK_CODE=LARGE_SCREEN_STATS) |
| CDC_LOG_CORRECT | 同步正确日志（统计源） | 明细级 |
| CDC_LOG_ERROR | 同步错误日志（统计源） | 明细级 |

---

## 数据库—代码映射核心术语

以下术语来自 `DATABASE-CODE-MAPPING-001` 第一阶段，经五次人工验收确认。

### 逻辑关系 (Logical Relationship)
**代码层通过字段值引用 + 数据核验一致所表达的数据库表间关联**。区别于物理外键（FOREIGN KEY 约束），本项目全部使用逻辑关系，不建立物理外键。逻辑关系需由代码证据（JOIN/.eq()/.in() 等）、数据核验（空值/重复/孤立检查）或用户确认支持。

来源: DATABASE-CODE-MAPPING-001 §03

### 物理外键 (Physical Foreign Key)
**数据库层面的 FOREIGN KEY 约束**。本项目当前不建立任何物理外键，这是架构决策而非缺陷。字段间引用通过代码层逻辑关系和业务规则维护。

来源: DATABASE-CODE-MAPPING-001 §03 §5

### 关系维护方 (Relationship Maintainer)
**负责维护特定逻辑关系的系统或角色**。例如 CDC_JOB_FAILURE_EVENT.DATA_SOURCE_ID → CDC_DATA_SOURCE 的关系由 sync-client 写入，管理平台只读且不负责维护；CDC_CLIENT_MULTIPLE、CDC_DATA_SUBSCRIBE 则由人工维护。明确维护方可避免跨系统数据冲突。

来源: DATABASE-CODE-MAPPING-001 §03（R09～R11）、已批准 RELATIONS.md（R02/R03/R04）

### 多值弱逻辑引用 (Multi-Value Weak Logical Reference)
**以逗号分隔字符串在一个字段中存储多个外键引用值**。例如 CDC_CLIENT_MULTIPLE.DATA_SOURCE_ID 存储多个 DATA_SOURCE_ID（如 "source1,source2"）。代码通过 `.split(",")` 解析，无法使用标准 SQL JOIN。核验标准为"每行至少存在一个可匹配 token"，不要求 token 级完整性。

来源: DATABASE-CODE-MAPPING-001 §03 §3.1

### 已确认 / 高度可信 / 待用户确认
**逻辑关系的三种确认等级**：
- **已确认**：有代码级关联证据（JOIN、.eq()、.in() 等）+ 数据核验一致
- **高度可信**：字段名、类型和值域一致，数据核验通过，但缺少代码级 JOIN 证据
- **待用户确认**：缺乏代码和数据证据，需用户提供业务语义确认

不得静默升级确认等级。当前项目关系状态（已批准 RELATIONS.md）：已确认 12 条（R01～R11、R15）、高度可信 3 条（R12～R14）、待确认 0 条。

来源: DATABASE-CODE-MAPPING-001 §03 §4、已批准 RELATIONS.md

### 当前事实 / 目标规则 / 当前差异
**描述数据库对象或代码映射时强制使用的三分法**：
- **当前事实**：代码和数据库当前实际状态
- **目标规则**：已确认的正确业务规则
- **当前差异**：二者尚未一致的部分

示例：CDC_DATA_SOURCE_EXTEND 的当前事实为"无主键、无唯一约束"，目标规则为"每个数据源应有且仅有一条扩展配置（一对一必填）"，当前差异为 D02（高严重度）。

来源: DATABASE-CODE-MAPPING-001 §04

### DATA_SUB_ID
**订阅标识符**。CDC_DATA_SUBSCRIBE 表的业务主键字段（VARCHAR2）。目标规则为应设置为主键，当前数据库仅存在 CHECK NOT NULL 约束，尚未设置 PRIMARY KEY 约束。该差异记为 D01（PENDING_DECISION，处理方式待用户决定）。数据核验时 12 行 0 空值 0 重复。

来源: DATABASE-CODE-MAPPING-001 §01、§05 结论一、已批准数据库基线（差异 D01）

### Flink Job ID / ZK jobName
**两套独立的 Job 标识体系**：
- **Flink Job ID**（CDC_JOB_FAILURE_EVENT.FAILED_JOB_ID）：Flink 实际作业 ID，存储在数据库故障事件表中，不保存在 ZooKeeper。
- **ZK jobName**：ZooKeeper 路径 `/bsoft-cdc/clients/{clientId}/{jobName}` 中的节点名，由同步程序注册。

两者不建立直接逻辑关系，管理平台代码中 JobFailureServiceImpl 和 ZooKeeperMonitorService 无交叉引用。

来源: DATABASE-CODE-MAPPING-001 §05 结论三

### Job失败ID链 (Failure Job ID Chain)
**CDC_JOB_FAILURE_EVENT 中 FAILED_JOB_ID 与 NEW_JOB_ID 构成的作业间故障链**。处理日志的 NEW_JOB_ID 可能指向后续故障事件的 FAILED_JOB_ID，形成链式关联。algorithm 包中的 FaultProcessGrouper 和 JobChainBuilder 在此链基础上构建故障过程模型。

来源: DATABASE-CODE-MAPPING-001 §03 §3.3

---

## 文档体系术语

以下术语用于项目文档与基线体系（见 docs/baseline/、docs/features/、CLAUDE.md §3）。

### Feature (功能)
**一个可独立交付的业务功能**。每个 Feature 在 `docs/features/<feature>/` 下可有 README、REQUIREMENTS、DESIGN、API、UI、DATABASE、ACCEPTANCE 等基线文档。

来源: CLAUDE.md §3.2、docs/features/README.md、FEATURE_DEVELOPMENT_AND_ADJUSTMENT_PROCESS.md

### 基线 (Baseline)
**经过确认并记录下来的结论性事实**。分项目级（docs/baseline/ 六份）与 Feature 级（docs/features/）。正式基线只能由授权任务修改、由用户批准，普通业务任务不得顺手修改，过程材料不得冒充基线。

来源: CLAUDE.md §3、PROJECT.md §6

### 提示词 (Prompt)
**向 Agent 下发的任务说明**（如 docs/prompts/、docs/agent-prompts/）。普通任务级提示词默认不上传 Git；仅长期复用流程、跨会话高风险说明、审计要求等例外可入 Git（DEVELOPMENT_RULES.md §11）。

来源: DEVELOPMENT_RULES.md §11

### Agent 报告 (Agent Report)
**Agent 执行任务的输出报告**。影响现行状态、验收、批准链或重大边界的报告可保留；报告不能替代正式基线。

来源: DEVELOPMENT_RULES.md §11.3

### 复审 (Review)
**对 Agent 产出（草案、报告、实现）进行的人工或独立核查**。项目基线与 Feature 基线在批准前通常需经过复审。

来源: PROJECT-BASELINE-AND-DOCUMENTATION-RECOVERY-001 §22、FEATURE_DEVELOPMENT_AND_ADJUSTMENT_PROCESS.md

### 验收 (Acceptance)
**对实现结果是否符合功能要求的正式确认**。验收通过是 Feature 基线收口的前置条件之一。

来源: FEATURE_DEVELOPMENT_AND_ADJUSTMENT_PROCESS.md、docs/acceptance/

### 批准 (Approval)
**用户对基线/结果的正式确认**。项目级基线由用户批准（如数据库基线 PROJECT-DATABASE-BASELINE-APPROVAL-001），Agent 不得自行批准基线。

来源: CLAUDE.md §3、docs/database/reports/

### Feature 状态编码
**Feature 基线覆盖与状态盘点使用的状态值**：

| 状态 | 含义 |
|---|---|
| NOT_RUN | 未开始 |
| PASS | 已通过（验收/检查通过） |
| FAIL | 未通过（存在问题） |
| BLOCKED | 被阻断（存在阻断条件，需前置处理） |
| DEFERRED | 延期（推迟到后续处理） |

来源: PROJECT-BASELINE-AND-DOCUMENTATION-RECOVERY-001 §8.7、docs/features/README.md 状态口径
