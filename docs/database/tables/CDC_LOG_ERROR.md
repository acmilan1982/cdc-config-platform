# CDC_LOG_ERROR — 同步错误日志表

> 文档状态：`DRAFT_PENDING_USER_REVIEW`
> 核验时间：2026-08-26
> 数据库：Oracle 19c 开发库（192.168.174.65:1521/prod.enmotech.com）
> Schema：CDC
> 元数据来源：真实数据库只读核验（ALL_TABLES / ALL_TAB_COLUMNS / ALL_COL_COMMENTS / ALL_CONSTRAINTS / ALL_INDEXES / ALL_OBJECTS）
> 关联代码模块 / Feature：大屏统计（`largescreen/stats`，JdbcTemplate 直读）、日志查询（`logquery`）
> 数据维护方：外部 CDC 同步程序写入；管理平台只读

---

## 1. 基本信息

| 项 | 值 |
|---|---|
| 表用途 | 同步错误日志表：记录 CDC 源库到目标库同步失败或出现异常的每一条数据日志（含偏移量、时间戳、错误详情等） |
| 表类型 | 普通堆表（NON-PARTITIONED） |
| 主键 | `PK_CDC_LOG_ERROR`（`CDC_LOG_ID`） |
| 外键 | 无 |
| 分区 | 无 |
| LOB | 有（1 个 CLOB 字段 RAW_MESSAGE，见 §6） |
| 当前读写属性 | 只读（管理平台）；由外部 CDC 同步程序写入 |
| 表注释 | 同步错误日志表 |
| LAST_DDL_TIME | 2026-08-06 |

---

## 2. 字段结构

| # | 字段名 | Oracle类型 | 字符长度 | 精度/小数 | 可空 | 默认值 | 字段注释 |
|---|---|---|---|---|---|---|---|
| 1 | CDC_LOG_ID | NUMBER | 19 | 19/0 | N | — | 主键 |
| 2 | INSTRUCTION_TYPE | VARCHAR2 | 8 | — | Y | — | c：新增   u：更新  d：删除   r: 新增   ddl:表结构更新 |
| 3 | SOURCE_TIME | DATE | 7 | — | Y | — | LOGMNR挖掘到源数据的时间 |
| 4 | TARGET_TIME | DATE | 7 | — | Y | — | 源数据尝试落盘到目标库的时间 |
| 5 | INSERT_TIME | DATE | 7 | — | Y | — | 当前日志落盘的时间 |
| 6 | LOG_DETAIL | VARCHAR2 | 4000 | — | Y | — | 日志详情，包括落盘的内容，操作结果(成功或是错误详细)，该字段考虑压缩 |
| 7 | SOURCE_DATA_SOURCE_ID | VARCHAR2 | 32 | — | Y | — | 源库的 数据源 id |
| 8 | TARGET_DATA_SOURCE_ID | VARCHAR2 | 32 | — | Y | — | 目标库的 数据源 id |
| 9 | SOURCE_TABLE_NAME | VARCHAR2 | 64 | — | Y | — | 源库的 表名 |
| 10 | TARGET_TABLE_NAME | VARCHAR2 | 64 | — | Y | — | 目标库的 表名 |
| 11 | RESULT_DETAIL | VARCHAR2 | 2000 | — | Y | — | 暂时不用 |
| 12 | RESULT_CODE | NUMBER | 10 | 10/0 | Y | — | 0表示执行成功，1表示执行出现异常 |
| 13 | OFFSET | NUMBER | 10 | 10/0 | Y | — | 当前数据在kafka上的偏移量 |
| 14 | KAFKA_ENQUEUE_TIME | DATE | 7 | — | Y | — | 数据进入Kafka的时间（数据进入链路） |
| 15 | SOURCE_SCHEMA_NAME | VARCHAR2 | 64 | — | Y | — | 源-模式名 to lei |
| 16 | RAW_MESSAGE | CLOB | 4000 | — | Y | — | 原始消息 |

---

## 3. 约束

| 类型 | 名称 | 字段 | 状态 |
|---|---|---|---|
| PRIMARY KEY | PK_CDC_LOG_ERROR | CDC_LOG_ID | ENABLED |
| CHECK (NOT NULL) | SYS_C0041446 | CDC_LOG_ID | ENABLED |

无 UNIQUE、无 FOREIGN KEY 约束。

## 4. 索引

| 名称 | 唯一性 | 类型 | 字段（顺序） | 状态 |
|---|---|---|---|---|
| PK_CDC_LOG_ERROR | UNIQUE | NORMAL | CDC_LOG_ID (1) | VALID |
| IDX_CDC_LOG_ERROR_TYPE | NONUNIQUE | NORMAL | INSTRUCTION_TYPE (1) | VALID |
| IDX_LOG_ERROR_TARGET_SRC | NONUNIQUE | NORMAL | INSERT_TIME (1), SOURCE_DATA_SOURCE_ID (2) | VALID |
| IDX_LOG_ERROR_TS_SRC_SCHEMA | NONUNIQUE | NORMAL | TARGET_TIME (1), SOURCE_DATA_SOURCE_ID (2), SOURCE_SCHEMA_NAME (3) | VALID |

> 说明：本表除主键外还有 3 个普通索引（INSTRUCTION_TYPE / INSERT_TIME+SOURCE_DATA_SOURCE_ID / TARGET_TIME+SOURCE_DATA_SOURCE_ID+SOURCE_SCHEMA_NAME）；而 CDC_LOG_CORRECT 仅有主键索引。两表结构差异为当前事实，见 §9。

## 5. 分区

本次核验未发现分区。

## 6. LOB

| 字段名 | LOB段 | 表空间 | CHUNK |
|---|---|---|---|
| RAW_MESSAGE | SYS_LOB0000106861C00016$$ | USERS | 8192 |

## 7. 触发器 / 序列 / 视图 / 依赖对象

- 触发器：本次核验未发现。
- 序列：本次核验未发现。
- 视图：本次核验未发现。
- 物理外键：无。

---

## 8. 当前代码访问入口与读写边界

| 层 | 文件 | 操作 | 读写属性 |
|---|---|---|---|
| 大屏统计 | `largescreen/stats/lifecycle/SafeUpperIdProvider.java` | JdbcTemplate `SELECT MAX(CDC_LOG_ID)`（ALLOWED_TABLES 白名单） | 只读 |
| 大屏统计 | `largescreen/stats/reader/LogBatchReader.java` | JdbcTemplate 流式读取增量日志行（fetchSize 500，FETCH FIRST） | 只读 |
| 日志查询 | `logquery/mapper/LogQueryMapper.xml` | selectLogList / selectLogDetail / selectRawMessage（`${tableName}` 由 LogTypeEnum 封闭枚举限定为 CDC_LOG_ERROR） | 只读 |
| 日志查询 | `logquery/enums/LogTypeEnum.java` | ERROR → "CDC_LOG_ERROR" 白名单映射 | 只读 |

> 说明：本表无 Entity / Mapper，仅通过 JdbcTemplate 与 LogQueryMapper.xml 直读。管理平台只读；写入方为外部 CDC 同步程序（`LOG_DETAIL`/`RAW_MESSAGE` 为落盘内容/原始消息，基线不输出其内容）。

---

## 9. 已知结构差异、历史兼容与待确认项

- 与 CDC_LOG_CORRECT 相比，本表多 3 个普通索引（见 §4）；两表其余结构一致。属当前事实差异，无历史兼容冲突。
- 既有旧快照 `docs/database/table-detail.md`（2026-07-03）记录 RESULT_CODE/OFFSET 等字段类型需核对；本次核验确认 RESULT_CODE、OFFSET 为 `NUMBER(10)`。
- 字段 `SOURCE_SCHEMA_NAME` 注释含历史遗留字样“to lei”，属历史注释残留，不影响结构；保留原注释。
- 本表当前为小规模（错误日志未大量积累），行数见 `DATA_PROFILE.md`（`OBSERVED_EXACT`）；项目负责人确认其量级上限可能达到十万/百万/千万级（`CONFIRMED_EXPECTED_SCALE`，非硬上限），见 `DATA_PROFILE.md`。

## 10. 文档级变更记录

| 日期 | 变更 | 依据 |
|---|---|---|
| 2026-08-26 | 建立单表物理基线（DRAFT_PENDING_USER_REVIEW） | PROJECT-DATABASE-BASELINE-001 只读核验 |
