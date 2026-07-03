# 表结构详情

## 1. CDC_CLIENT_MULTIPLE（探针/客户端）

### 基本信息

- 记录数：21
- 字段数：4
- 主键：无
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
| Check (NOT NULL) | SYS_C0041473 | CLIENT_ID | ENABLED |
| Check (NOT NULL) | SYS_C0041474 | FG_ACTIVE | ENABLED |

### 索引

无显式索引（无主键、无普通索引）。

### 样例数据特征

- CLIENT_ID：格式如 `hosp-001`, `hosp-002`, `hosp001-home`，用于标识探针实例
- DATA_SOURCE_ID：可为单个值或逗号分隔的多个值，如 `199-source,5905f1ce83024410836b40ca0ebfc446`
- FG_ACTIVE：取值 `0`（19条）或 `1`（2条）
- 存在空 DATA_SOURCE_ID 的记录（如 hosp099, hosp-003 等）

### 已确认

- 探针注册表，记录每个探针客户端及其关联的数据源
- CLIENT_ID 可重复（21条记录中有重复的 CLIENT_ID）
- DATA_SOURCE_ID 支持逗号分隔的多值

### 待确认

- CLIENT_ID 重复是故意的（多环境配置）还是数据冗余
- 无主键，CLIENT_ID 不唯一，业务上如何区分记录

---

## 2. CDC_DATA_SOURCE（数据源配置）

### 基本信息

- 记录数：15
- 字段数：17
- 主键：DATA_SOURCE_ID (PK_CDC_DATA_SOURCE)
- 唯一约束：无
- 外键：无
- 表注释：(乱码，仅存"???")

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
| 13 | DATA_SOURCE_DOMAIN | VARCHAR2 | 32 | Y | - | 域名 |
| 14 | DATA_SOURCE_CATEGORY | VARCHAR2 | 30 | Y | - | 源表还是目标表，取值source/target，大小写都行 |
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

### 样例数据特征

- DATA_SOURCE_ID：格式有 UUID 式（如 `5905f1ce83024410836b40ca0ebfc446`）和业务名式（如 `199-source`, `target-doris-v4`）
- DATA_SOURCE_TYPE 分布：ORACLE(10), DORIS(3), MYSQL(2)
- DATA_SOURCE_CATEGORY：source(2), target(8), SOURCE(5) — 存在大小写不一致
- SOURCE_APP：全部为 `his应用`（15条）
- FG_ACTIVE：0(13), 1(2)
- DELETE_TIME：全部为 NULL（无软删除记录）
- DATA_SOURCE_BIZ_ATTR：仅 `target-doris-v4` 有值（JSON格式Doris配置）

### 已确认

- 核心数据源配置表，存储源库和目标库连接信息
- 密码以明文存储（DATA_SOURCE_PASSWORD 字段）
- DATA_SOURCE_CATEGORY 注释说"大小写都行"，但实际存在 source/SOURCE 混用

### 待确认

- 表注释原始内容已丢失（数据库存储为字面值"???"）
- DATA_SOURCE_CATEGORY 大小写不一致是否需要统一
- 明文密码存储是否符合安全规范

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

### 样例数据特征

- TABLE_NAMING_STRATEGY：TABLE_MERGE(4), CUSTOM_PREFIX_SUFFIX(5)
- 当策略为 CUSTOM_PREFIX_SUFFIX 时，PREFIX 和 SUFFIX 有值（如 `DLS_011_V2022_01_` 和 `_fucking`）
- 当策略为 TABLE_MERGE 时，PREFIX 和 SUFFIX 为空
- 9条记录中有7条 DATA_SOURCE_ID 能与 CDC_DATA_SOURCE 匹配，2条不能匹配

### 已确认

- 是 CDC_DATA_SOURCE 的扩展表，存储目标表命名策略
- 无主键，无外键，结构关系仅通过注释和字段命名推断
- 与 CDC_DATA_SOURCE 的关系：高可信候选（注释明确说明，7/9数据可匹配）

### 待确认

- 为什么无主键约束
- 2条无法匹配 CDC_DATA_SOURCE 的记录（mock7, mock8）是否为孤立数据
- SUFFIX 值 `_fucking` 疑似测试占位数据

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

### 样例数据特征

- 仅1条记录：CLIENT_ID=`hosp-002`, DATA_SOURCE_ID=`5905f1ce83024410836b40ca0ebfc446`, 状态= SNAPSHOT_COMPLETED
- 快照时间：2026-07-02（最近一次快照）
- SNAPSHOT_STATUS 当前仅观察到 SNAPSHOT_COMPLETED（字段注释列出 SNAPSHOT_COMPLETED / SNAPSHOT_RUNNING）

### 已确认

- 记录每个探针对每个数据源的快照运行状态
- 复合主键 (CLIENT_ID, DATA_SOURCE_ID) 保证唯一
- 仅1条记录，可能为开发/测试环境

### 待确认

- 为何只有1条运行状态记录（是否应该覆盖所有探针-数据源组合）
- SNAPSHOT_RUNNING 状态未在现有数据中出现

---

## 5. CDC_DATA_SUBSCRIBE（数据订阅配置）

### 基本信息

- 记录数：9
- 字段数：12
- 主键：无
- 唯一约束：无
- 外键：无
- 表注释：(无)

### 字段明细

| # | 字段名 | 数据类型 | 长度 | 可为空 | 默认值 | 注释 |
|---|--------|----------|------|--------|--------|------|
| 1 | DATA_SUB_ID | VARCHAR2 | 32 | N | - | (无注释) |
| 2 | DATA_SUB_DESC | VARCHAR2 | 255 | Y | - | (无注释) |
| 3 | DATA_FROM_SOURCE_ID | VARCHAR2 | 1024 | Y | - | (无注释) |
| 4 | DATA_TO_SOURCE_ID | VARCHAR2 | 1024 | Y | - | (无注释) |
| 5 | DATA_SOURCE_TABLE | CLOB | 4000 | Y | - | (无注释) |
| 6 | DATA_SOURCE_COMMENT | CLOB | 4000 | Y | - | (无注释) |
| 7 | DATA_TARGET_TABLE | CLOB | 4000 | Y | - | (无注释) |
| 8 | DATA_TARGET_COMMENT | CLOB | 4000 | Y | - | (无注释) |
| 9 | INSERT_TIME | DATE | 7 | Y | - | (无注释) |
| 10 | UPDATE_TIME | DATE | 7 | Y | - | (无注释) |
| 11 | DELETE_TIME | DATE | 7 | Y | - | (无注释) |
| 12 | FG_ACTIVE | VARCHAR2 | 1 | Y | - | (无注释) |

### 约束

| 类型 | 名称 | 字段 | 状态 |
|------|------|------|------|
| Check (NOT NULL) | SYS_C0041443 | DATA_SUB_ID | ENABLED |

### 索引

| 名称 | 类型 | 唯一性 | 字段 | 状态 |
|------|------|--------|------|------|
| SYS_IL0000106847C00005$$ | LOB | UNIQUE | (LOB索引) | VALID |
| SYS_IL0000106847C00006$$ | LOB | UNIQUE | (LOB索引) | VALID |
| SYS_IL0000106847C00007$$ | LOB | UNIQUE | (LOB索引) | VALID |
| SYS_IL0000106847C00008$$ | LOB | UNIQUE | (LOB索引) | VALID |

### 样例数据特征

- 所有12个字段均无注释
- 4个CLOB字段：DATA_SOURCE_TABLE, DATA_SOURCE_COMMENT, DATA_TARGET_TABLE, DATA_TARGET_COMMENT
- DATA_FROM_SOURCE_ID 和 DATA_TO_SOURCE_ID 关联 CDC_DATA_SOURCE.DATA_SOURCE_ID
- DATA_TO_SOURCE_ID 支持逗号分隔多值（如 `target-doris-v3,target-doris-v4`）
- FG_ACTIVE：0(8), 1(1)
- DELETE_TIME：全部为 NULL
- DATA_SOURCE_TABLE 存储源表全限定名（如 `5905f1ce83024410836b40ca0ebfc446.DEV_EHRVIEW.OPT_RECORD`）

### 已确认

- 数据订阅配置表，定义从哪个数据源的哪些表同步到哪个目标数据源
- 无主键，DATA_SUB_ID 应为业务主键（通过 NOT NULL Check 约束确保非空）
- 4个 CLOB 字段存储表名和注释，可能包含多行/多表信息

### 待确认

- 全部字段注释缺失，每个字段的业务含义需要项目负责人确认
- 无主键约束，DATA_SUB_ID 是否应保证唯一
- DATA_SOURCE_COMMENT 和 DATA_TARGET_COMMENT 的出现规律和作用
- CLOB字段是否可能存储JSON或结构化数据

---

## 6. CDC_LOG_CORRECT（正常执行日志）

### 基本信息

- 记录数：0（空表）
- 字段数：16
- 主键：CDC_LOG_ID (PK_CDC_LOG_CORRECT)
- 唯一约束：无
- 外键：无
- 表注释：(乱码，仅存"???")

### 字段明细

| # | 字段名 | 数据类型 | 长度 | 可为空 | 默认值 | 注释 |
|---|--------|----------|------|--------|--------|------|
| 1 | CDC_LOG_ID | VARCHAR2 | 32 | N | - | 主键 |
| 2 | INSTRUCTION_TYPE | VARCHAR2 | 8 | Y | - | c：新增  u：更新  d：删除  r: 新增  ddl:表结构更新 |
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
| 15 | SOURCE_SCHEMA_NAME | VARCHAR2 | 64 | Y | - | 源-模式名 to lei |
| 16 | RAW_MESSAGE | BLOB | 4000 | Y | - | 原始消息（注：字段注释为空，类型为BLOB） |

### 约束

| 类型 | 名称 | 字段 | 状态 |
|------|------|------|------|
| Primary Key | PK_CDC_LOG_CORRECT | CDC_LOG_ID | ENABLED |
| Check (NOT NULL) | SYS_C0041444 | CDC_LOG_ID | ENABLED |

### 索引

| 名称 | 类型 | 唯一性 | 字段 | 状态 |
|------|------|--------|------|------|
| PK_CDC_LOG_CORRECT | NORMAL | UNIQUE | CDC_LOG_ID | VALID |
| SYS_IL0000106857C00016$$ | LOB | UNIQUE | (RAW_MESSAGE BLOB索引) | VALID |

### 已确认

- 当前为空表（0条记录）
- 与 CDC_LOG_ERROR 结构几乎完全相同，用于分别存储成功和失败的CDC操作日志
- 注：INSTRUCTION_TYPE 注释中 `r` 和 `c` 均标注为"新增"，含义重叠

### 待确认

- 表注释原始内容已丢失
- 当前为空是由开发环境决定，还是该表已不再使用
- INSTRUCTION_TYPE 中 `r` 的具体含义（与 `c` 的区别）
- RAW_MESSAGE 为 BLOB 类型（CDC_LOG_ERROR 中为 CLOB），两表结构差异的原因

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
| 2 | INSTRUCTION_TYPE | VARCHAR2 | 8 | Y | - | (无注释) |
| 3 | SOURCE_TIME | DATE | 7 | Y | - | (无注释) |
| 4 | TARGET_TIME | DATE | 7 | Y | - | (无注释) |
| 5 | INSERT_TIME | DATE | 7 | Y | - | (无注释) |
| 6 | LOG_DETAIL | VARCHAR2 | 4000 | Y | - | (无注释) |
| 7 | SOURCE_DATA_SOURCE_ID | VARCHAR2 | 32 | Y | - | (无注释) |
| 8 | TARGET_DATA_SOURCE_ID | VARCHAR2 | 32 | Y | - | (无注释) |
| 9 | SOURCE_TABLE_NAME | VARCHAR2 | 64 | Y | - | (无注释) |
| 10 | TARGET_TABLE_NAME | VARCHAR2 | 64 | Y | - | (无注释) |
| 11 | RESULT_DETAIL | VARCHAR2 | 2000 | Y | - | (无注释) |
| 12 | RESULT_CODE | NUMBER | 22 | Y | - | (无注释) |
| 13 | OFFSET | NUMBER | 22 | Y | - | (无注释) |
| 14 | KAFKA_ENQUEUE_TIME | DATE | 7 | Y | - | (无注释) |
| 15 | SOURCE_SCHEMA_NAME | VARCHAR2 | 64 | Y | - | 源-模式名 to lei |
| 16 | RAW_MESSAGE | CLOB | 4000 | Y | - | 原始消息 |

### 约束

| 类型 | 名称 | 字段 | 状态 |
|------|------|------|------|
| Primary Key | PK_CDC_LOG_ERROR | CDC_LOG_ID | ENABLED |
| Check (NOT NULL) | SYS_C0041446 | CDC_LOG_ID | ENABLED |

### 索引

| 名称 | 类型 | 唯一性 | 字段 | 状态 |
|------|------|--------|------|------|
| PK_CDC_LOG_ERROR | NORMAL | UNIQUE | CDC_LOG_ID | VALID |
| IDX_CDC_LOG_ERROR_TYPE | NORMAL | NONUNIQUE | INSTRUCTION_TYPE | VALID |
| IDX_LOG_ERROR_TARGET_SRC | NORMAL | NONUNIQUE | INSERT_TIME, SOURCE_DATA_SOURCE_ID | VALID |
| IDX_LOG_ERROR_TS_SRC_SCHEMA | NORMAL | NONUNIQUE | TARGET_TIME, SOURCE_DATA_SOURCE_ID, SOURCE_SCHEMA_NAME | VALID |
| SYS_IL0000106861C00016$$ | LOB | UNIQUE | (RAW_MESSAGE LOB索引) | VALID |

### 样例数据特征

- 仅1条记录：INSTRUCTION_TYPE=`d`（删除操作），RESULT_CODE=1（异常）
- LOG_DETAIL 包含完整Java异常堆栈（Flink CDC 任务异常）
- RAW_MESSAGE 包含JSON格式的Kafka原始消息（含op、schema、table、before/after等CDC字段）
- 错误原因：`single delete failed: FAILED: missing primary key value`

### 已确认

- CDC错误日志表，结构与 CDC_LOG_CORRECT 高度相似
- 相比 CDC_LOG_CORRECT 多了3个普通索引（用于查询性能优化）
- RAW_MESSAGE 类型为 CLOB（不同于 CDC_LOG_CORRECT 的 BLOB）
- 日志包含 Flink CDC 任务的完整错误堆栈和Kafka原始消息

### 待确认

- 大部分字段注释缺失，业务含义需参考 CDC_LOG_CORRECT 的同名字段
- INDEX 设计差异的原因（LOG_ERROR 有3个业务索引，LOG_CORRECT 没有）

---

## 8. CDC_SERVER（服务端注册）

### 基本信息

- 记录数：1
- 字段数：4
- 主键：无
- 唯一约束：无
- 外键：无
- 表注释：(无)

### 字段明细

| # | 字段名 | 数据类型 | 长度 | 可为空 | 默认值 | 注释 |
|---|--------|----------|------|--------|--------|------|
| 1 | SERVER_ID | VARCHAR2 | 32 | Y | - | (无注释) |
| 2 | SERVER_DESC | VARCHAR2 | 256 | Y | - | (无注释) |
| 3 | DATA_SOURCE_ID | VARCHAR2 | 32 | Y | - | (无注释) |
| 4 | FG_ACTIVE | VARCHAR2 | 1 | Y | - | (无注释) |

### 约束

无。

### 索引

无。

### 样例数据特征

- 仅1条记录：SERVER_ID=`Server001`, DATA_SOURCE_ID=`a31a1a6e542747ea8bcbfb12bd43b6b9`, FG_ACTIVE=1
- SERVER_DESC：`服务端注册自: Server001 IP: 3.3.0.168, 192.168.174.1, 10.0.0.4, 192.168.100.1, 192.168.1.130`

### 已确认

- CDC Server 注册表，记录服务端实例及其关联的目标数据源
- 所有字段无注释

### 待确认

- 全部字段注释缺失
- 无主键约束，SERVER_ID 是否应作为主键
- DATA_SOURCE_ID 引用哪个数据源

---

## 9. CDC_SERVER_CONFIG（服务端配置项）

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
| 6 | IS_EDITABLE | CHAR | 1 | Y | '1' | 当前配置项是否可编辑 |

### 约束

| 类型 | 名称 | 字段 | 状态 |
|------|------|------|------|
| Primary Key | PK_CDC_SERVER_CONFIG | ID_SERVER_CONFIG | ENABLED |

### 索引

| 名称 | 类型 | 唯一性 | 字段 | 状态 |
|------|------|--------|------|------|
| PK_CDC_SERVER_CONFIG | NORMAL | UNIQUE | ID_SERVER_CONFIG | VALID |

### 样例数据（8条配置项）

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

### 已确认

- CDC Server 运行时配置的键值存储
- 通过 SERVER_ID 关联 CDC_SERVER
- 配置项涵盖：Kafka topic、快照、消息存储策略、删除策略、自动建表、批量写入
- 全部8条配置项关联 Server001

### 待确认

- 配置项是否可能随版本增加或变化
- IS_EDITABLE 标记为1的配置项，是否允许通过配置界面动态修改

---

## 10. CDC_TOPIC_OFFSET（Kafka Topic偏移量）

### 基本信息

- 记录数：1
- 字段数：4
- 主键：SERVER_ID, KAFKA_TOPIC (复合主键 PK_CDC_TOPIC_OFFSET)
- 唯一约束：无
- 外键：无
- 表注释：(无)

### 字段明细

| # | 字段名 | 数据类型 | 长度 | 可为空 | 默认值 | 注释 |
|---|--------|----------|------|--------|--------|------|
| 1 | SERVER_ID | VARCHAR2 | 64 | N | - | (无注释) |
| 2 | KAFKA_TOPIC | VARCHAR2 | 512 | N | - | (无注释) |
| 3 | NEXT_OFFSET | NUMBER | 22(19,0) | N | - | (无注释) |
| 4 | UPDATED_AT | DATE | 7 | N | - | (无注释) |

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

### 样例数据特征

- 仅1条记录：SERVER_ID=`Server001`, KAFKA_TOPIC=`hosp-006.5905f1ce...`, NEXT_OFFSET=1712011
- KAFKA_TOPIC 格式：`{探针ID}.{数据源ID}.{Schema}.{Table}.{目标数据源ID}`
- UPDATED_AT：2026-06-17（最近一次偏移量更新时间）

### 已确认

- 记录每个Server对每个Kafka Topic的消费偏移量
- KAFKA_TOPIC 命名规则揭示其对应特定 CDC 订阅任务
- 属于 ZooKeeper 运行监控替代方案（基于数据库记录offset）

### 待确认

- 所有字段注释缺失
- 为何只有1条offset记录（是否正常）
