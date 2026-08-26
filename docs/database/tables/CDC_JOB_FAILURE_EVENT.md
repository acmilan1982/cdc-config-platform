# CDC_JOB_FAILURE_EVENT — 作业失败事件表

> 文档状态：`DRAFT_PENDING_USER_REVIEW`
> 核验时间：2026-08-26
> 数据库：Oracle 19c 开发库（192.168.174.65:1521/prod.enmotech.com）
> Schema：CDC
> 元数据来源：真实数据库只读核验（ALL_TABLES / ALL_TAB_COLUMNS / ALL_COL_COMMENTS / ALL_CONSTRAINTS / ALL_INDEXES / ALL_OBJECTS）
> 关联代码模块 / Feature：Job故障监控（`monitor/jobfailure`）
> 数据维护方：写入方为 CDC 同步链路外部组件（失败事件上报）；当前项目后端代码仅只读

---

## 1. 基本信息

| 项 | 值 |
|---|---|
| 表用途 | 作业失败事件表：记录 Flink job 失败回调事件本身，每次失败回调写入一条事件记录。只描述失败事件是否有效、失败原因和事件初步处理结果，不记录重启过程 |
| 表类型 | 普通堆表（NON-PARTITIONED） |
| 主键 | `PK_CDC_JOB_FAILURE_EVENT`（`ID`） |
| 外键 | 无 |
| 分区 | 无 |
| LOB | 有（1 个 CLOB 字段 FAILURE_DETAIL，见 §6） |
| 当前读写属性 | 只读（管理平台 Job故障监控模块）；写入方为外部失败事件上报组件 |
| 表注释 | 作业失败事件表：记录 Flink job 失败回调事件本身，每次失败回调写入一条事件记录。该表只描述失败事件是否有效、失败原因和事件初步处理结果，不记录重启过程。 |
| LAST_DDL_TIME | 2026-07-27 |

---

## 2. 字段结构

| # | 字段名 | Oracle类型 | 字符长度 | 精度/小数 | 可空 | 默认值 | 字段注释 |
|---|---|---|---|---|---|---|---|
| 1 | ID | NUMBER | 19 | 19/0 | N | — | 主键ID，由程序统一ID生成器生成，不依赖数据库自增。 |
| 2 | CLIENT_ID | VARCHAR2 | 64 | — | N | — | 客户端ID，表示发生失败事件的 sync-client 实例。 |
| 3 | DATA_SOURCE_ID | VARCHAR2 | 64 | — | N | — | 业务数据源ID，表示失败 job 所属的业务库或数据源。 |
| 4 | FAILED_JOB_ID | VARCHAR2 | 64 | — | N | — | 失败的 Flink Job ID，来自 JobFailureZkReporter 监听到的失败 job。 |
| 5 | FAILURE_TIME | DATE | 7 | — | N | — | 失败发生时间，程序接收到失败事件并构造事件记录时的时间。 |
| 6 | FLINK_STATUS | VARCHAR2 | 32 | — | Y | — | Flink 作业状态，当前失败事件写入时通常为 FAILED。 |
| 7 | FAILURE_REASON | VARCHAR2 | 1000 | — | Y | — | 失败原因摘要，保存异常根因摘要，便于列表页快速展示。 |
| 8 | FAILURE_DETAIL | CLOB | 4000 | — | Y | — | 完整失败异常详情，保存完整异常堆栈或截断后的安全堆栈内容，用于详情页排查。 |
| 9 | EVENT_RESULT | VARCHAR2 | 32 | — | N | — | 失败事件初步处理结果。枚举值：ACCEPTED=有效失败事件，后续进入自动重启流程；IGNORED_INVALID=无效失败事件，例如 dataSourceId 或 failedJobId 为空；IGNORED_STALE=旧 job 回调事件，当前 runtime 已不再指向该 job。 |
| 10 | IGNORE_REASON | VARCHAR2 | 1000 | — | Y | — | 失败事件被忽略的原因。仅 EVENT_RESULT 为 IGNORED_INVALID 或 IGNORED_STALE 时通常有值。 |
| 11 | CREATED_AT | DATE | 7 | — | N | — | 记录创建时间，由数据库 SYSDATE 写入，表示该事件记录入库时间。 |

---

## 3. 约束

| 类型 | 名称 | 字段 | 状态 |
|---|---|---|---|
| PRIMARY KEY | PK_CDC_JOB_FAILURE_EVENT | ID | ENABLED |
| CHECK (NOT NULL) | SYS_C0042593 | ID | ENABLED |
| CHECK (NOT NULL) | SYS_C0042594 | CLIENT_ID | ENABLED |
| CHECK (NOT NULL) | SYS_C0042595 | DATA_SOURCE_ID | ENABLED |
| CHECK (NOT NULL) | SYS_C0042596 | FAILED_JOB_ID | ENABLED |
| CHECK (NOT NULL) | SYS_C0042597 | FAILURE_TIME | ENABLED |
| CHECK (NOT NULL) | SYS_C0042599 | EVENT_RESULT | ENABLED |
| CHECK (NOT NULL) | SYS_C0042600 | CREATED_AT | ENABLED |

无 UNIQUE、无 FOREIGN KEY 约束。

## 4. 索引

| 名称 | 唯一性 | 类型 | 字段（顺序） | 状态 |
|---|---|---|---|---|
| PK_CDC_JOB_FAILURE_EVENT | UNIQUE | NORMAL | ID (1) | VALID |

> 说明：仅主键索引。CLIENT_ID / DATA_SOURCE_ID / FAILURE_TIME 等查询条件字段无独立索引，对应既有映射资料中的 D03（高严重度）。

## 5. 分区

本次核验未发现分区。

## 6. LOB

| 字段名 | LOB段 | 表空间 | CHUNK |
|---|---|---|---|
| FAILURE_DETAIL | SYS_LOB0000112022C00008$$ | USERS | 8192 |

## 7. 触发器 / 序列 / 视图 / 依赖对象

- 触发器：本次核验未发现。
- 序列：本次核验未发现。
- 视图：本次核验未发现。
- 物理外键：无。

---

## 8. 当前代码访问入口与读写边界

| 层 | 文件 | 操作 | 读写属性 |
|---|---|---|---|
| Entity | `monitor/jobfailure/entity/JobFailureEvent.java` | `@TableName("CDC_JOB_FAILURE_EVENT")`、`@TableId("ID")` | — |
| Mapper | `monitor/jobfailure/mapper/JobFailureEventMapper.java` | extends BaseMapper\<JobFailureEvent\> | 只读 |
| Job故障监控 | `monitor/jobfailure/service/impl/JobFailureServiceImpl.java` | selectList（clientId/dataSourceId 筛选）、selectById、按 .eq(JobFailureEvent::getDataSourceId) 组装 | 只读 |
| Job故障监控 | `monitor/jobfailure/service/impl/FaultHistoryServiceImpl.java` | 按事件查询历史/详情 | 只读 |

> 说明：`CLIENT_ID` 弱逻辑引用 CDC_CLIENT_MULTIPLE.CLIENT_ID；`DATA_SOURCE_ID` 弱逻辑引用 CDC_DATA_SOURCE.DATA_SOURCE_ID。均无物理外键，由程序保证关联。写入入口未在本项目后端代码中发现（外部失败事件上报组件写入），为 `PENDING_CONFIRMATION`（见 `DATA_PROFILE.md`）。

---

## 9. 已知结构差异、历史兼容与待确认项

- D03：仅主键索引；CLIENT_ID / DATA_SOURCE_ID / FAILURE_TIME 无独立索引。当前数据量小（见 `DATA_PROFILE.md`），索引缺口影响有限；是否补索引另建数据库整改任务。
- 写入方待确认：当前项目后端代码未发现对该表的 INSERT 入口，写入方应为 CDC 同步链路中的失败事件上报组件（`PENDING_CONFIRMATION`，见 `DATA_PROFILE.md`）。
- `EVENT_RESULT` 枚举值 ACCEPTED/IGNORED_INVALID/IGNORED_STALE 与 `FLINK_STATUS` 取值（通常 FAILED）为功能级业务规则，详见 Job故障监控功能基线；本基线只登记物理结构与代码访问入口。

## 10. 文档级变更记录

| 日期 | 变更 | 依据 |
|---|---|---|
| 2026-08-26 | 建立单表物理基线（DRAFT_PENDING_USER_REVIEW） | PROJECT-DATABASE-BASELINE-001 只读核验 |
