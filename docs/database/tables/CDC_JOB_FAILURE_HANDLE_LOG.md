# CDC_JOB_FAILURE_HANDLE_LOG — 作业失败处理记录表

> 文档状态：`DRAFT_PENDING_USER_REVIEW`
> 核验时间：2026-08-26
> 数据库：Oracle 19c 开发库（192.168.174.65:1521/prod.enmotech.com）
> Schema：CDC
> 元数据来源：真实数据库只读核验（ALL_TABLES / ALL_TAB_COLUMNS / ALL_COL_COMMENTS / ALL_CONSTRAINTS / ALL_INDEXES / ALL_OBJECTS）
> 关联代码模块 / Feature：Job故障监控（`monitor/jobfailure`）
> 数据维护方：sync-client 进程写入（项目负责人 2026-08-26 确认）；管理平台仅只读

---

## 1. 基本信息

| 项 | 值 |
|---|---|
| 表用途 | 作业失败处理记录表：记录某个失败事件进入处理流程后的各阶段动作，包括接收、忽略、调度重启、开始重启、新 job 提交、提交失败、稳定检查通过等。一个失败事件可以对应多条处理记录 |
| 表类型 | 普通堆表（NON-PARTITIONED） |
| 主键 | `PK_CDC_JOB_FAILURE_HANDLE_LOG`（`ID`） |
| 外键 | 无 |
| 分区 | 无 |
| LOB | 有（1 个 CLOB 字段 ERROR_DETAIL，见 §6） |
| 当前读写属性 | 只读（管理平台 Job故障监控模块）；写入方为 sync-client 进程（项目负责人 2026-08-26 确认） |
| 表注释 | 作业失败处理记录表：记录某个失败事件进入处理流程后的各阶段动作，包括接收、忽略、调度重启、开始重启、新 job 提交、提交失败、稳定检查通过等。一个失败事件可以对应多条处理记录。 |
| LAST_DDL_TIME | 2026-07-27 |

---

## 2. 字段结构

| # | 字段名 | Oracle类型 | 字符长度 | 精度/小数 | 可空 | 默认值 | 字段注释 |
|---|---|---|---|---|---|---|---|
| 1 | ID | NUMBER | 19 | 19/0 | N | — | 主键ID，由程序统一ID生成器生成，不依赖数据库自增。 |
| 2 | FAILURE_EVENT_ID | NUMBER | 19 | 19/0 | N | — | 关联的失败事件ID，对应 CDC_JOB_FAILURE_EVENT.ID。当前表不使用数据库外键约束，由程序保证关联关系。 |
| 3 | CLIENT_ID | VARCHAR2 | 64 | — | N | — | 客户端ID，冗余自失败事件，便于直接查询处理记录。 |
| 4 | DATA_SOURCE_ID | VARCHAR2 | 64 | — | N | — | 业务数据源ID，表示处理动作所属的业务库或数据源。 |
| 5 | FAILED_JOB_ID | VARCHAR2 | 64 | — | N | — | 失败的 Flink Job ID，表示本次处理流程针对的原失败 job。 |
| 6 | ATTEMPT_NO | NUMBER | 10 | 10/0 | Y | — | 重启尝试次数，当前使用 consecutiveFailures 作为取值；失败连续发生时递增，稳定运行后连续失败次数会被清零。 |
| 7 | HANDLE_STAGE | VARCHAR2 | 64 | — | N | — | 处理阶段。枚举值：JOB_FAILURE_RECEIVED=收到有效失败事件；JOB_FAILURE_IGNORED_INVALID=忽略无效失败事件；JOB_FAILURE_IGNORED_STALE=忽略旧 job 失败事件；DUPLICATED_EVENT_IGNORED=忽略重复失败事件；RESTART_SCHEDULED=已安排自动重启；SCHEDULED_RESTART_SKIPPED=已跳过计划重启；RESTART_STARTED=开始执行重启；NEW_JOB_SUBMIT_SUCCEEDED=新 job 提交成功；NEW_JOB_SUBMIT_FAILED=新 job 提交失败；STABLE_CHECK_PASSED=稳定运行检查通过。 |
| 8 | HANDLE_TIME | DATE | 7 | — | N | — | 处理动作发生时间，由程序写入，表示当前 HANDLE_STAGE 对应动作的发生时间。 |
| 9 | CONSECUTIVE_FAILURES | NUMBER | 10 | 10/0 | Y | — | 当前连续失败次数。稳定运行检查通过后，该计数会被程序清零。 |
| 10 | RESTART_COUNT_TOTAL | NUMBER | 19 | 19/0 | Y | — | 当前累计重启次数。稳定运行后不清零，用于观察该业务数据源历史累计自动重启次数。 |
| 11 | RESTART_DELAY_SECONDS | NUMBER | 10 | 10/0 | Y | — | 本次重启退避延迟秒数。通常在 RESTART_SCHEDULED 阶段有值。 |
| 12 | NEXT_RESTART_TIME | DATE | 7 | — | Y | — | 下次计划重启时间。通常在 RESTART_SCHEDULED 阶段有值。 |
| 13 | RESTART_START_TIME | DATE | 7 | — | Y | — | 本次重启开始时间。通常在 RESTART_STARTED、NEW_JOB_SUBMIT_SUCCEEDED、NEW_JOB_SUBMIT_FAILED 等重启执行阶段有值。 |
| 14 | RESTART_END_TIME | DATE | 7 | — | Y | — | 本次重启结束时间。新 job 提交成功或提交失败时通常有值。 |
| 15 | NEW_JOB_ID | VARCHAR2 | 64 | — | Y | — | 重启后提交的新 Flink Job ID。通常在 NEW_JOB_SUBMIT_SUCCEEDED 和 STABLE_CHECK_PASSED 阶段有值。 |
| 16 | ERROR_DETAIL | CLOB | 4000 | — | Y | — | 当前处理动作的异常详情。通常在 NEW_JOB_SUBMIT_FAILED 或重新调度失败原因记录中有值。 |
| 17 | REMARK | VARCHAR2 | 1000 | — | Y | — | 备注信息，用于记录跳过、忽略、重新调度等补充原因。 |
| 18 | CREATED_AT | DATE | 7 | — | N | — | 记录创建时间，由数据库 SYSDATE 写入，表示该处理记录入库时间。 |

---

## 3. 约束

| 类型 | 名称 | 字段 | 状态 |
|---|---|---|---|
| PRIMARY KEY | PK_CDC_JOB_FAILURE_HANDLE_LOG | ID | ENABLED |
| CHECK (NOT NULL) | SYS_C0042603 | ID | ENABLED |
| CHECK (NOT NULL) | SYS_C0042604 | FAILURE_EVENT_ID | ENABLED |
| CHECK (NOT NULL) | SYS_C0042605 | CLIENT_ID | ENABLED |
| CHECK (NOT NULL) | SYS_C0042606 | DATA_SOURCE_ID | ENABLED |
| CHECK (NOT NULL) | SYS_C0042607 | FAILED_JOB_ID | ENABLED |
| CHECK (NOT NULL) | SYS_C0042608 | HANDLE_STAGE | ENABLED |
| CHECK (NOT NULL) | SYS_C0042610 | HANDLE_TIME | ENABLED |
| CHECK (NOT NULL) | SYS_C0042611 | CREATED_AT | ENABLED |

无 UNIQUE、无 FOREIGN KEY 约束。

## 4. 索引

| 名称 | 唯一性 | 类型 | 字段（顺序） | 状态 |
|---|---|---|---|---|
| PK_CDC_JOB_FAILURE_HANDLE_LOG | UNIQUE | NORMAL | ID (1) | VALID |

> 说明：仅主键索引。FAILURE_EVENT_ID / CLIENT_ID / DATA_SOURCE_ID 等查询条件字段无独立索引，对应既有映射资料中的 D04（高严重度）。

## 5. 分区

本次核验未发现分区。

## 6. LOB

| 字段名 | LOB段 | 表空间 | CHUNK |
|---|---|---|---|
| ERROR_DETAIL | SYS_LOB0000112026C00016$$ | USERS | 8192 |

## 7. 触发器 / 序列 / 视图 / 依赖对象

- 触发器：本次核验未发现。
- 序列：本次核验未发现。
- 视图：本次核验未发现。
- 物理外键：无。

---

## 8. 当前代码访问入口与读写边界

| 层 | 文件 | 操作 | 读写属性 |
|---|---|---|---|
| Entity | `monitor/jobfailure/entity/JobFailureHandleLog.java` | `@TableName("CDC_JOB_FAILURE_HANDLE_LOG")`、`@TableId("ID")` | — |
| Mapper | `monitor/jobfailure/mapper/JobFailureHandleLogMapper.java` | extends BaseMapper\<JobFailureHandleLog\> | 只读 |
| Job故障监控 | `monitor/jobfailure/service/impl/JobFailureServiceImpl.java` | loadLogsByEventIds 中 .in(JobFailureHandleLog::getFailureEventId, eventIds) | 只读 |
| Job故障监控 | `monitor/jobfailure/service/impl/FaultHistoryServiceImpl.java` | 按事件查询处理记录 | 只读 |

> 说明：`FAILURE_EVENT_ID` 弱逻辑引用 CDC_JOB_FAILURE_EVENT.ID；`CLIENT_ID` 弱逻辑引用 CDC_CLIENT_MULTIPLE.CLIENT_ID；`DATA_SOURCE_ID` 弱逻辑引用 CDC_DATA_SOURCE.DATA_SOURCE_ID（见 `RELATIONS.md` R11/R13/R14）。均无物理外键，引用完整性不由数据库保证，写入方与读取方须在代码层处理空引用、孤立引用与无效引用。写入方为 sync-client 进程（项目负责人 2026-08-26 确认），管理平台仅只读。

---

## 9. 已知结构差异、历史兼容与待决策项

- D04：仅主键索引；FAILURE_EVENT_ID / CLIENT_ID / DATA_SOURCE_ID 无独立索引（当前物理事实）。当前数据量小（见 `DATA_PROFILE.md`），索引缺口影响有限；是否补索引属 `PENDING_DECISION`（候选物理设计，未经正式批准，不承诺实施或排期）。
- `HANDLE_STAGE` 枚举值（JOB_FAILURE_RECEIVED 等 10 个阶段）与重启相关字段的取值时机为功能级业务规则，详见 Job故障监控功能基线；本基线只登记物理结构与代码访问入口。
- 写入方：由 sync-client 进程写入（项目负责人 2026-08-26 确认）；管理平台仅只读，代码层须兼容孤立/无效引用。

## 10. 文档级变更记录

| 日期 | 变更 | 依据 |
|---|---|---|
| 2026-08-26 | 建立单表物理基线（DRAFT_PENDING_USER_REVIEW） | PROJECT-DATABASE-BASELINE-001 只读核验 |
| 2026-08-26 | R1：写入方修订为 sync-client 进程（负责人确认）；删除待确认措辞；D04 状态改为 PENDING_DECISION | PROJECT-DATABASE-BASELINE-001-R1 修订 |
