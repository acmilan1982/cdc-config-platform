> **HISTORICAL_SUPERSEDED（历史文档，已被取代）**
>
> 本文件为历史快照，已由 PROJECT-DATABASE-BASELINE-001 数据库基线取代（取代日期 2026-08-26）。文件保留原貌仅供追溯，不得作为当前事实直接引用；与现行数据库/代码不一致处以新基线为准。
> 新权威文档：`docs/database/tables/` 下 14 张单表物理基线（如 `tables/CDC_DATA_SOURCE.md`）、`docs/database/SCHEMA.md`。
> 本快照为 2026-07-03 记录，含旧 10 表（CDC_SERVER / CDC_SERVER_CONFIG / CDC_TOPIC_OFFSET / CDC_DATA_SOURCE_RUN_STATE 等）与当时记录数/类型；字段类型以本次核验为准（如 CDC_LOG_*.RESULT_CODE/OFFSET 为 NUMBER(10)），主键/约束/索引以单表基线为准。

---

# 表结构详情

> 最近更新：2026-07-03（根据项目负责人答复更新）

## 1. CDC_CLIENT_MULTIPLE（探针/客户端）

### 基本信息

- 记录数：3（已从21条去重）
- 字段数：4
- 主键：CLIENT_ID (PK_CDC_CLIENT_MULTIPLE)
- 唯一约束：无
- 外键：无
- 表注释：(无)

### 字段明细

| # | 字段名 | 数据类型 | 长度 | 可为空 | 默认值 | 注释 |
|---|--------|----------|------|--------|--------|------|
| 1 | CLIENT_ID | VARCHAR2 | 32 | N | - | 探针id |
| 2 | CLIENT_DESC | VARCHAR2 | 256 | Y | - | 探针描述 |
| 3 | DATA_SOURCE_ID | VARCHAR2 | 1000 | Y | - | 探针采集的数据源id，可以有多个id，id之间用英文逗号分隔 |
| 4 | FG_ACTIVE | VARCHAR2 | 1 | N | - | 探针是否启用 |

### 约束

| 类型 | 名称 | 字段 | 状态 |
|------|------|------|------|
| Primary Key | PK_CDC_CLIENT_MULTIPLE | CLIENT_ID | ENABLED |
| Check (NOT NULL) | SYS_C0041473 | CLIENT_ID | ENABLED |
| Check (NOT NULL) | SYS_C0041474 | FG_ACTIVE | ENABLED |

### 索引

| 名称 | 类型 | 唯一性 | 字段 | 状态 |
|------|------|--------|------|------|
| PK_CDC_CLIENT_MULTIPLE | NORMAL | UNIQUE | CLIENT_ID | VALID |

### 样例数据

当前仅3条记录：hosp-001, hosp-002, hosp-006。

### 已确认

- CLIENT_ID 是主键，每条记录唯一
- 项目负责人已清理重复记录（21→3条）
- DATA_SOURCE_ID 支持逗号分隔多值

### 待确认

- 无

---

## 2. CDC_DATA_SOURCE（数据源配置）

### 基本信息

- 记录数：15
- 字段数：17
- 主键：DATA_SOURCE_ID (PK_CDC_DATA_SOURCE)
- 唯一约束：无
- 外键：无
- 表注释：数据源，包括源库，目标库

### 字段明细

| # | 字段名 | 数据类型 | 长度 | 可为空 | 默认值 | 注释 |
|---|--------|----------|------|--------|--------|------|
| 1 | DATA_SOURCE_ID | VARCHAR2 | 32 | N | - | 主键 |
| 2 | DATA_SOURCE_ORG | VARCHAR2 | 64 | N | - | 数据源机构 |
| 3 | DATA_SOURCE_HOST | VARCHAR2 | 64 | N | - | 数据库主机名 |
| 4 | DATA_SOURCE_PORT | VARCHAR2 | 64 | N | - | 数据库端口 |
| 5 | DATA_SOURCE_USER_NAME | VARCHAR2 | 64 | N | - | 数据库用户名 |
| 6 | DATA_SOURCE_PASSWORD | VARCHAR2 | 64 | N | - | 数据库密码 |
| 7 | DATA_SOURCE_TYPE | VARCHAR2 | 32 | N | - | 数据库类型-目前只支持源库：oracle,目标库:mysql,doris |
| 8 | DATA_SOURCE_SERVICE_NAME | VARCHAR2 | 64 | N | - | 数据库服务名 |
| 9 | INSERT_TIME | DATE | 7 | Y | sysdate | 插入时间 |
| 10 | UPDATE_TIME | DATE | 7 | Y | - | 更新时间 |
| 11 | DELETE_TIME | DATE | 7 | Y | - | 删除时间 |
| 12 | FG_ACTIVE | VARCHAR2 | 1 | Y | - | 是否可用标记位-删除或停用后该值为0，正常为1 |
| 13 | DATA_SOURCE_DOMAIN | VARCHAR2 | 32 | Y | - | 域名（暂时不用） |
| 14 | DATA_SOURCE_CATEGORY | VARCHAR2 | 30 | Y | - | 源表还是目标表，取值SOURCE/TARGET，程序中已转为大写 |
| 15 | SOURCE_APP | VARCHAR2 | 20 | Y | - | 源应用 |
| 16 | DATA_SOURCE_NAME | VARCHAR2 | 30 | Y | - | 数据源名称 |
| 17 | DATA_SOURCE_BIZ_ATTR | VARCHAR2 | 2000 | Y | - | 业务属性JSON，目前只在doris类型中生效 |

### 约束

| 类型 | 名称 | 字段 | 状态 |
|------|------|------|------|
| Primary Key | PK_CDC_DATA_SOURCE | DATA_SOURCE_ID | ENABLED |
| Check (NOT NULL) | SYS_C0041424 | DATA_SOURCE_ID | ENABLED |
| Check (NOT NULL) | SYS_C0041425 | DATA_SOURCE_ORG | ENABLED |
| Check (NOT NULL) | SYS_C0041426 | DATA_SOURCE_HOST | ENABLED |
| Check (NOT NULL) | SYS_C0041427 | DATA_SOURCE_PORT | ENABLED |
| Check (NOT NULL) | SYS_C0041428 | DATA_SOURCE_USER_NAME | ENABLED |
| Check (NOT NULL) | SYS_C0041429 | DATA_SOURCE_PASSWORD | ENABLED |
| Check (NOT NULL) | SYS_C0041430 | DATA_SOURCE_TYPE | ENABLED |
| Check (NOT NULL) | SYS_C0041431 | DATA_SOURCE_SERVICE_NAME | ENABLED |

### 索引

| 名称 | 类型 | 唯一性 | 字段 | 状态 |
|------|------|--------|------|------|
| PK_CDC_DATA_SOURCE | NORMAL | UNIQUE | DATA_SOURCE_ID | VALID |
| IDX_CDC_DATA_SOURCE_ID_ACTIVE | NORMAL | NONUNIQUE | DATA_SOURCE_ID, FG_ACTIVE | VALID |
| IDX_CDC_DATA_SOURCE_NAME | NORMAL | NONUNIQUE | DATA_SOURCE_NAME | VALID |
| IDX_CDC_LOG_CORRECT_ORG | NORMAL | NONUNIQUE | DATA_SOURCE_ORG | VALID |
| IDX_CDS_ACTIVE | NORMAL | NONUNIQUE | FG_ACTIVE | VALID |

### 已确认（本次更新）

- 表注释：数据源，包括源库，目标库
- DATA_SOURCE_CATEGORY：统一使用大写，程序已做转换
- DATA_SOURCE_DOMAIN：暂时不用理会
- 密码明文存储：不需要加密
- 该表与 CDC_DATA_SOURCE_EXTEND 为 1:1 关系

### 待确认

- DATA_SOURCE_CATEGORY 当前样本仍存在大小写混用，虽然程序层面已兼容

---

## 3. CDC_DATA_SOURCE_EXTEND（数据源扩展配置）

### 基本信息

- 记录数：9
- 字段数：4
- 主键：无
- 唯一约束：无
- 外键：无
- 表注释：(无)

### 字段明细

| # | 字段名 | 数据类型 | 长度 | 可为空 | 默认值 | 注释 |
|---|--------|----------|------|--------|--------|------|
| 1 | DATA_SOURCE_ID | VARCHAR2 | 32 | Y | - | 数据源id，对应CDC_DATA_SOURCE表的DATA_SOURCE_ID，原则上与CDC_DATA_SOURCE表的记录一对一 |
| 2 | TABLE_NAMING_STRATEGY | VARCHAR2 | 32 | Y | - | 当前业务库在目标库表的命名策略 |
| 3 | TABLE_NAME_PREFIX | VARCHAR2 | 128 | Y | - | 目标表的前缀 |
| 4 | TABLE_NAME_SUFFIX | VARCHAR2 | 128 | Y | - | 目标表的后缀 |

### 约束

无显式约束。

### 索引

无显式索引。

### 已确认（本次更新）

- 与 CDC_DATA_SOURCE 为 1:1 关系
- mock7、mock8 等为测试数据，不用理会
- `_fucking` 后缀为测试数据内容，无需理会

### 待确认

- 无主键，与 CDC_DATA_SOURCE 的 1:1 关系无法通过数据库约束保证

---

## 4. CDC_DATA_SOURCE_RUN_STATE（数据源运行状态）

### 基本信息

- 记录数：1
- 字段数：6
- 主键：CLIENT_ID, DATA_SOURCE_ID (复合主键 PK_CDC_DS_RUN_STATE)
- 唯一约束：无
- 外键：无
- 表注释：(无)

### 字段明细

| # | 字段名 | 数据类型 | 长度 | 可为空 | 默认值 | 注释 |
|---|--------|----------|------|--------|--------|------|
| 1 | CLIENT_ID | VARCHAR2 | 64 | N | - | 探针id |
| 2 | DATA_SOURCE_ID | VARCHAR2 | 64 | N | - | 数据源id(源库id) |
| 3 | SNAPSHOT_STATUS | VARCHAR2 | 32 | N | - | 快照状态，SNAPSHOT_COMPLETED/SNAPSHOT_RUNNING |
| 4 | SNAPSHOT_LAST_SEEN_AT | DATE | 7 | Y | - | 快照任务启动时间 |
| 5 | SNAPSHOT_COMPLETED_AT | DATE | 7 | Y | - | 快照任务完成时间 |
| 6 | UPDATED_AT | DATE | 7 | N | - | 当前记录更新时间 |

### 约束

| 类型 | 名称 | 字段 | 状态 |
|------|------|------|------|
| Primary Key | PK_CDC_DS_RUN_STATE | CLIENT_ID, DATA_SOURCE_ID | ENABLED |
| Check (NOT NULL) | SYS_C0041433 | CLIENT_ID | ENABLED |
| Check (NOT NULL) | SYS_C0041434 | DATA_SOURCE_ID | ENABLED |
| Check (NOT NULL) | SYS_C0041435 | SNAPSHOT_STATUS | ENABLED |
| Check (NOT NULL) | SYS_C0041436 | UPDATED_AT | ENABLED |

### 索引

| 名称 | 类型 | 唯一性 | 字段 | 状态 |
|------|------|--------|------|------|
| PK_CDC_DS_RUN_STATE | NORMAL | UNIQUE | CLIENT_ID, DATA_SOURCE_ID | VALID |

### 已确认（本次更新）

- 该表由另外的程序插入，当前程序只读即可
- 仅1条记录是开发环境特性，有几条都是正常的

---

## 5. CDC_DATA_SUBSCRIBE（数据订阅配置）

### 基本信息

- 记录数：9
- 字段数：12
- 主键：DATA_SUB_ID (PK_CDC_DATA_SUBSCRIBE)
- 唯一约束：无
- 外键：无
- 表注释：(无)

### 字段明细

| # | 字段名 | 数据类型 | 长度 | 可为空 | 默认值 | 注释 |
|---|--------|----------|------|--------|--------|------|
| 1 | DATA_SUB_ID | VARCHAR2 | 32 | N | - | 代理主键，程序自动生成，无任何业务含义 |
| 2 | DATA_SUB_DESC | VARCHAR2 | 255 | Y | - | 订阅描述 |
| 3 | DATA_FROM_SOURCE_ID | VARCHAR2 | 1024 | Y | - | 源库，即业务库，对应CDC_DATA_SOURCE表中，DATA_SOURCE_CATEGORY=source的记录主键，可以填多个，用英文逗号间隔 |
| 4 | DATA_TO_SOURCE_ID | VARCHAR2 | 1024 | Y | - | 目标库，对应CDC_DATA_SOURCE表中，DATA_SOURCE_CATEGORY=target的记录主键，可以填多个，用英文逗号间隔 |
| 5 | DATA_SOURCE_TABLE | CLOB | 4000 | Y | - | 源库中，需要同步的表，单个表的格式：DATA_SOURCE_ID.schema.表名，可以填多个，用英文逗号间隔 |
| 6 | DATA_SOURCE_COMMENT | CLOB | 4000 | Y | - | 源库中，需要同步的表注释，与DATA_SOURCE_TABLE对应 |
| 7 | DATA_TARGET_TABLE | CLOB | 4000 | Y | - | 暂时没用，可以不管 |
| 8 | DATA_TARGET_COMMENT | CLOB | 4000 | Y | - | 暂时没用，可以不管 |
| 9 | INSERT_TIME | DATE | 7 | Y | - | 当前记录的插入时间 |
| 10 | UPDATE_TIME | DATE | 7 | Y | - | 当前记录的更新时间 |
| 11 | DELETE_TIME | DATE | 7 | Y | - | 当前记录的删除时间 |
| 12 | FG_ACTIVE | VARCHAR2 | 1 | Y | - | 当前记录是否启用标志，0：不启用 1：启用 |

### 约束

| 类型 | 名称 | 字段 | 状态 |
|------|------|------|------|
| Primary Key | PK_CDC_DATA_SUBSCRIBE | DATA_SUB_ID | ENABLED |
| Check (NOT NULL) | SYS_C0041443 | DATA_SUB_ID | ENABLED |

### 索引

| 名称 | 类型 | 唯一性 | 字段 | 状态 |
|------|------|--------|------|------|
| PK_CDC_DATA_SUBSCRIBE | NORMAL | UNIQUE | DATA_SUB_ID | VALID |
| SYS_IL0000106847C00005$$ | LOB | UNIQUE | (LOB索引) | VALID |
| SYS_IL0000106847C00006$$ | LOB | UNIQUE | (LOB索引) | VALID |
| SYS_IL0000106847C00007$$ | LOB | UNIQUE | (LOB索引) | VALID |
| SYS_IL0000106847C00008$$ | LOB | UNIQUE | (LOB索引) | VALID |

### 已确认（本次更新）

- DATA_SUB_ID 是主键，程序自动生成的代理主键
- DATA_SOURCE_COMMENT 是源表的表注释，与 DATA_SOURCE_TABLE 对应
- DATA_TARGET_TABLE 和 DATA_TARGET_COMMENT 暂时不用，可以不管
- CLOB 字段存储纯文本，非JSON
- DATA_FROM_SOURCE_ID / DATA_TO_SOURCE_ID 支持逗号分隔多值

### 待确认

- 无

---

## 6. CDC_LOG_CORRECT（正常执行日志）

### 基本信息

- 记录数：0（已确认：因表空间不足被清空，该表仍在使用）
- 字段数：16
- 主键：CDC_LOG_ID (PK_CDC_LOG_CORRECT)
- 唯一约束：无
- 外键：无
- 表注释：(乱码，仅存"???")

### 字段明细

| # | 字段名 | 数据类型 | 长度 | 可为空 | 默认值 | 注释 |
|---|--------|----------|------|--------|--------|------|
| 1 | CDC_LOG_ID | VARCHAR2 | 32 | N | - | 主键 |
| 2 | INSTRUCTION_TYPE | VARCHAR2 | 8 | Y | - | c：增量新增  u：更新  d：删除  r：快照读取  ddl:表结构更新 |
| 3 | SOURCE_TIME | DATE | 7 | Y | - | LOGMNR挖掘到源数据的时间 |
| 4 | TARGET_TIME | DATE | 7 | Y | - | 源数据落盘到目标库的时间 |
| 5 | INSERT_TIME | DATE | 7 | Y | - | 当前日志落盘的时间 |
| 6 | LOG_DETAIL | VARCHAR2 | 4000 | Y | - | 日志详情，包括落盘的内容，操作结果(成功或是错误详细)，该字段考虑压缩 |
| 7 | SOURCE_DATA_SOURCE_ID | VARCHAR2 | 32 | Y | - | 源库的数据源id |
| 8 | TARGET_DATA_SOURCE_ID | VARCHAR2 | 32 | Y | - | 目标库的数据源id |
| 9 | SOURCE_TABLE_NAME | VARCHAR2 | 64 | Y | - | 源库的表名 |
| 10 | TARGET_TABLE_NAME | VARCHAR2 | 64 | Y | - | 目标库的表名 |
| 11 | RESULT_DETAIL | VARCHAR2 | 2000 | Y | - | 暂时不用 |
| 12 | RESULT_CODE | NUMBER | 22 | Y | - | 0表示执行成功，1表示执行出现异常 |
| 13 | OFFSET | NUMBER | 22 | Y | - | 偏移量 |
| 14 | KAFKA_ENQUEUE_TIME | DATE | 7 | Y | - | 数据进入Kafka的时间（数据进入链路） |
| 15 | SOURCE_SCHEMA_NAME | VARCHAR2 | 64 | Y | - | 源-模式名 |
| 16 | RAW_MESSAGE | CLOB | 4000 | Y | - | 原始消息（已从 BLOB 更新为 CLOB） |

### 约束

| 类型 | 名称 | 字段 | 状态 |
|------|------|------|------|
| Primary Key | PK_CDC_LOG_CORRECT | CDC_LOG_ID | ENABLED |
| Check (NOT NULL) | SYS_C0041444 | CDC_LOG_ID | ENABLED |

### 索引

| 名称 | 类型 | 唯一性 | 字段 | 状态 |
|------|------|--------|------|------|
| PK_CDC_LOG_CORRECT | NORMAL | UNIQUE | CDC_LOG_ID | VALID |
| SYS_IL0000106857C00016$$ | LOB | UNIQUE | (RAW_MESSAGE LOB索引) | VALID |

### 已确认（本次更新）

- 该表仍在使用，保存已成功同步到目标库的数据记录
- 当前为空是因为表空间不够且日志量大，之前被清空
- INSTRUCTION_TYPE：c=create（增量数据），r=read（快照数据），u=更新，d=删除，ddl=表结构更新
- RAW_MESSAGE 类型已从 BLOB 更新为 CLOB，与 CDC_LOG_ERROR 一致
- RESULT_DETAIL：暂时不用

### 待确认

- 表注释仍为 "???"，原始内容已丢失

---

## 7. CDC_LOG_ERROR（错误日志）

### 基本信息

- 记录数：1
- 字段数：16
- 主键：CDC_LOG_ID (PK_CDC_LOG_ERROR)
- 唯一约束：无
- 外键：无
- 表注释：(无)

### 字段明细

| # | 字段名 | 数据类型 | 长度 | 可为空 | 默认值 | 注释 |
|---|--------|----------|------|--------|--------|------|
| 1 | CDC_LOG_ID | VARCHAR2 | 32 | N | - | (无注释) |
| 2 | INSTRUCTION_TYPE | VARCHAR2 | 8 | Y | - | (无注释) — 含义同 CDC_LOG_CORRECT：c=增量,u=更新,d=删除,r=快照,ddl=表结构 |
| 3 | SOURCE_TIME | DATE | 7 | Y | - | (无注释) |
| 4 | TARGET_TIME | DATE | 7 | Y | - | (无注释) |
| 5 | INSERT_TIME | DATE | 7 | Y | - | (无注释) |
| 6 | LOG_DETAIL | VARCHAR2 | 4000 | Y | - | (无注释) |
| 7 | SOURCE_DATA_SOURCE_ID | VARCHAR2 | 32 | Y | - | (无注释) |
| 8 | TARGET_DATA_SOURCE_ID | VARCHAR2 | 32 | Y | - | (无注释) |
| 9 | SOURCE_TABLE_NAME | VARCHAR2 | 64 | Y | - | (无注释) |
| 10 | TARGET_TABLE_NAME | VARCHAR2 | 64 | Y | - | (无注释) |
| 11 | RESULT_DETAIL | VARCHAR2 | 2000 | Y | - | (无注释) — 暂时不用 |
| 12 | RESULT_CODE | NUMBER | 22 | Y | - | (无注释) — 0=成功, 1=异常 |
| 13 | OFFSET | NUMBER | 22 | Y | - | (无注释) |
| 14 | KAFKA_ENQUEUE_TIME | DATE | 7 | Y | - | (无注释) |
| 15 | SOURCE_SCHEMA_NAME | VARCHAR2 | 64 | Y | - | 源-模式名 |
| 16 | RAW_MESSAGE | CLOB | 4000 | Y | - | 原始消息 |

### 已确认（本次更新）

- 该表仍在使用，保存未能正常同步到目标库的数据记录
- 结构与 CDC_LOG_CORRECT 相同（RAW_MESSAGE 类型已统一为 CLOB）
- INSTRUCTION_TYPE、RESULT_CODE 等字段含义参考 CDC_LOG_CORRECT 同名字段

---

## 8. CDC_SERVER（中心端注册）

### 基本信息

- 记录数：1
- 字段数：4
- 主键：SERVER_ID (PK_CDC_SERVER)
- 唯一约束：无
- 外键：无
- 表注释：(无)

### 字段明细

| # | 字段名 | 数据类型 | 长度 | 可为空 | 默认值 | 注释 |
|---|--------|----------|------|--------|--------|------|
| 1 | SERVER_ID | VARCHAR2 | 32 | N | - | 每个中心端进程的标识符，每个中心端程序在其配置文件中，都预设一个标识符，不同的中心端，标识符不能重复 |
| 2 | SERVER_DESC | VARCHAR2 | 256 | Y | - | 中心端进程描述符 |
| 3 | DATA_SOURCE_ID | VARCHAR2 | 32 | Y | - | 暂时不用 |
| 4 | FG_ACTIVE | VARCHAR2 | 1 | Y | - | 当前中心端是否启动 |

### 约束

| 类型 | 名称 | 字段 | 状态 |
|------|------|------|------|
| Primary Key | PK_CDC_SERVER | SERVER_ID | ENABLED |

### 索引

| 名称 | 类型 | 唯一性 | 字段 | 状态 |
|------|------|--------|------|------|
| PK_CDC_SERVER | NORMAL | UNIQUE | SERVER_ID | VALID |

### 已确认

- CDC Server 注册表，记录每个中心端进程
- SERVER_ID 是主键，不同中心端标识符不能重复
- SERVER_DESC：中心端进程描述符
- DATA_SOURCE_ID 暂时不用
- FG_ACTIVE：当前中心端是否启动

---

## 9. CDC_SERVER_CONFIG（中心端配置项）

（无变化，结构保持不变）

### 基本信息

- 记录数：8
- 字段数：6
- 主键：ID_SERVER_CONFIG (PK_CDC_SERVER_CONFIG)
- 唯一约束：无
- 外键：无
- 表注释：(无)

### 字段明细

| # | 字段名 | 数据类型 | 长度 | 可为空 | 默认值 | 注释 |
|---|--------|----------|------|--------|--------|------|
| 1 | ID_SERVER_CONFIG | VARCHAR2 | 32 | N | - | 记录id |
| 2 | SERVER_ID | VARCHAR2 | 32 | Y | - | 服务端id |
| 3 | CONFIG_DESC | VARCHAR2 | 1024 | Y | - | 配置项描述 |
| 4 | CONFIG_KEY | VARCHAR2 | 64 | Y | - | 配置项key |
| 5 | CONFIG_VALUE | VARCHAR2 | 64 | Y | - | 配置项value |
| 6 | IS_EDITABLE | CHAR | 1 | Y | 1 | 当前配置项是否可编辑 |

### 约束

| 类型 | 名称 | 字段 | 状态 |
|------|------|------|------|
| Primary Key | PK_CDC_SERVER_CONFIG | ID_SERVER_CONFIG | ENABLED |

### 配置项清单

| CONFIG_KEY | CONFIG_VALUE | IS_EDITABLE | 描述 |
|------------|-------------|-------------|------|
| server-log-topic-name | cdc.sync.server.logs.v1 | 0 | Kafka日志topic |
| monitor-metric-topic-name | cdc.sync.monitor.metrics.v1 | 0 | Kafka监控topic |
| snapshotBatchSize | 500 | 1 | 全量快照批次大小 |
| raw-message-storage-strategy | PLAIN | 1 | 原始消息存储策略 |
| tableRowDeleteStrategy | DELETE | 1 | 表行删除策略 |
| auto-create-table | true | 1 | 是否自动创建目标表 |
| auto-expand-column-length | false | 1 | 是否自动扩充字段长度 |
| realtime-insert-batch-enabled-database-types | doris,oracle | 1 | 批量写入启用的数据库类型 |

---

## 10. CDC_TOPIC_OFFSET（Kafka Topic偏移量）

### 基本信息

- 记录数：1（开发环境仅测试1个topic，生产环境每个中心端会消费数百个topic）
- 字段数：4
- 主键：SERVER_ID, KAFKA_TOPIC (复合主键 PK_CDC_TOPIC_OFFSET)
- 唯一约束：无
- 外键：无
- 表注释：(无)

### 字段明细

| # | 字段名 | 数据类型 | 长度 | 可为空 | 默认值 | 注释 |
|---|--------|----------|------|--------|--------|------|
| 1 | SERVER_ID | VARCHAR2 | 64 | N | - | 中心端标识符 |
| 2 | KAFKA_TOPIC | VARCHAR2 | 512 | N | - | 中心端从kafka读取的topic |
| 3 | NEXT_OFFSET | NUMBER | 22(19,0) | N | - | topic的下一个offset（下一条待消费消息的offset） |
| 4 | UPDATED_AT | DATE | 7 | N | - | 记录更新时间 |

### 约束

| 类型 | 名称 | 字段 | 状态 |
|------|------|------|------|
| Primary Key | PK_CDC_TOPIC_OFFSET | SERVER_ID, KAFKA_TOPIC | ENABLED |
| Check (NOT NULL) | SYS_C0041466 | SERVER_ID | ENABLED |
| Check (NOT NULL) | SYS_C0041467 | KAFKA_TOPIC | ENABLED |
| Check (NOT NULL) | SYS_C0041468 | NEXT_OFFSET | ENABLED |
| Check (NOT NULL) | SYS_C0041469 | UPDATED_AT | ENABLED |

### 索引

| 名称 | 类型 | 唯一性 | 字段 | 状态 |
|------|------|--------|------|------|
| PK_CDC_TOPIC_OFFSET | NORMAL | UNIQUE | SERVER_ID, KAFKA_TOPIC | VALID |

### 已确认（本次更新）

- NEXT_OFFSET：下一条待消费消息的 offset
- 每个中心端会消费 Kafka 数百个 topic，每条记录对应一个 topic 的消费位置
- 当前仅1条记录是因为开发环境只测试了1个 topic
- 该表记录 Kafka 消费偏移量，替代传统 ZooKeeper 存储方式
