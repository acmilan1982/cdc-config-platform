> **HISTORICAL_SUPERSEDED（历史文档，已被取代）**
>
> 本文件为历史快照，已由 PROJECT-DATABASE-BASELINE-001 数据库基线取代（取代日期 2026-08-26）。文件保留原貌仅供追溯，不得作为当前事实直接引用；与现行数据库/代码不一致处以新基线为准。
> 新权威文档：`docs/database/CODE_VALUES.md`（公共码值）、`docs/database/RELATIONS.md`（跨表关系）、`docs/database/SCHEMA.md`（使用范围）、`docs/database/DATA_PROFILE.md`（规模与确认项）；业务规则以对应 Feature 功能基线为准。
> 本快照为 2026-07-03 确认记录，其中旧 10 表使用范围（含 CDC_SERVER 等）已过时；主键状态等与本次核验存在差异（如 CDC_DATA_SUBSCRIBE 当前无主键）需以新基线为准。

---

# 已确认数据库业务规则

> 来源：DATABASE_ANALYSIS_001 问题答复
> 确认日期：2026-07-03

## 1. 表使用状态

| 表名 | 状态 | 说明 |
|------|------|------|
| CDC_CLIENT_MULTIPLE | 使用中 | 探针注册表，CLIENT_ID 为主键 |
| CDC_DATA_SOURCE | 使用中 | 数据源配置主表，含源库和目标库 |
| CDC_DATA_SOURCE_EXTEND | 使用中 | 数据源扩展表，与 CDC_DATA_SOURCE 1:1 |
| CDC_DATA_SOURCE_RUN_STATE | 使用中 | 由外部程序维护，当前程序只读 |
| CDC_DATA_SUBSCRIBE | 使用中 | 数据订阅配置表 |
| CDC_LOG_CORRECT | 使用中 | 成功CDC日志，当前为空（历史清空） |
| CDC_LOG_ERROR | 使用中 | 失败CDC日志，当前仅1条（历史清空） |
| CDC_SERVER | 使用中 | 中心端注册表 |
| CDC_SERVER_CONFIG | 使用中 | 中心端配置项键值表 |
| CDC_TOPIC_OFFSET | 使用中 | Kafka消费偏移量记录表 |

## 2. 主键与唯一性规则

| 表名 | 主键 | 字段 | 说明 |
|------|------|------|------|
| CDC_CLIENT_MULTIPLE | PK_CDC_CLIENT_MULTIPLE | CLIENT_ID | CLIENT_ID 唯一，不可重复 |
| CDC_DATA_SOURCE | PK_CDC_DATA_SOURCE | DATA_SOURCE_ID | |
| CDC_DATA_SOURCE_EXTEND | 无 | — | 与 CDC_DATA_SOURCE 为 1:1 业务关系，但无数据库级约束 |
| CDC_DATA_SOURCE_RUN_STATE | PK_CDC_DS_RUN_STATE | CLIENT_ID, DATA_SOURCE_ID | 复合主键 |
| CDC_DATA_SUBSCRIBE | PK_CDC_DATA_SUBSCRIBE | DATA_SUB_ID | 代理主键，程序自动生成，无业务含义 |
| CDC_LOG_CORRECT | PK_CDC_LOG_CORRECT | CDC_LOG_ID | |
| CDC_LOG_ERROR | PK_CDC_LOG_ERROR | CDC_LOG_ID | |
| CDC_SERVER | PK_CDC_SERVER | SERVER_ID | 不同中心端标识符不能重复 |
| CDC_SERVER_CONFIG | PK_CDC_SERVER_CONFIG | ID_SERVER_CONFIG | |
| CDC_TOPIC_OFFSET | PK_CDC_TOPIC_OFFSET | SERVER_ID, KAFKA_TOPIC | 复合主键 |

## 3. 表间关系

所有关系均为业务逻辑关系，数据库层面不存在外键约束。

### 数据库约束关系

无。

### 业务逻辑关系（已确认）

| 关系 | 类型 | 关联字段 | 说明 |
|------|------|----------|------|
| CDC_DATA_SOURCE_EXTEND → CDC_DATA_SOURCE | 1:1 | DATA_SOURCE_ID | 一对一扩展关系 |
| CDC_SERVER_CONFIG → CDC_SERVER | N:1 | SERVER_ID | |
| CDC_TOPIC_OFFSET → CDC_SERVER | N:1 | SERVER_ID | |
| CDC_DATA_SUBSCRIBE → CDC_DATA_SOURCE (from) | N:M | DATA_FROM_SOURCE_ID | 逗号分隔多值 |
| CDC_DATA_SUBSCRIBE → CDC_DATA_SOURCE (to) | N:M | DATA_TO_SOURCE_ID | 逗号分隔多值 |
| CDC_CLIENT_MULTIPLE → CDC_DATA_SOURCE | N:M | DATA_SOURCE_ID | 逗号分隔多值 |
| CDC_DATA_SOURCE_RUN_STATE → CDC_CLIENT_MULTIPLE | N:1 | CLIENT_ID | |
| CDC_DATA_SOURCE_RUN_STATE → CDC_DATA_SOURCE | N:1 | DATA_SOURCE_ID | |
| CDC_LOG_CORRECT → CDC_DATA_SOURCE | N:1 | SOURCE_DATA_SOURCE_ID, TARGET_DATA_SOURCE_ID | |
| CDC_LOG_ERROR → CDC_DATA_SOURCE | N:1 | SOURCE_DATA_SOURCE_ID, TARGET_DATA_SOURCE_ID | |

### 已否定的候选关系

| 关系 | 原因 |
|------|------|
| CDC_SERVER.DATA_SOURCE_ID → CDC_DATA_SOURCE | 项目负责人确认"暂时不用" |

## 4. 字段含义

### 已确认的字段含义（补充注释后）

**CDC_DATA_SUBSCRIBE**（12个字段均已补充注释）：

| 字段 | 含义 |
|------|------|
| DATA_SUB_ID | 代理主键，程序自动生成，无任何业务含义 |
| DATA_SUB_DESC | 订阅描述 |
| DATA_FROM_SOURCE_ID | 源库（业务库），对应 DATA_SOURCE_CATEGORY=SOURCE 的记录主键，支持逗号分隔多值 |
| DATA_TO_SOURCE_ID | 目标库，对应 DATA_SOURCE_CATEGORY=TARGET 的记录主键，支持逗号分隔多值 |
| DATA_SOURCE_TABLE | 需同步的源表，格式 DATA_SOURCE_ID.schema.表名，支持逗号分隔多值 |
| DATA_SOURCE_COMMENT | 源表注释，与 DATA_SOURCE_TABLE 一一对应 |
| DATA_TARGET_TABLE | 暂时不用 |
| DATA_TARGET_COMMENT | 暂时不用 |
| INSERT_TIME | 记录插入时间 |
| UPDATE_TIME | 记录更新时间 |
| DELETE_TIME | 记录删除时间 |
| FG_ACTIVE | 启用标志：0=不启用，1=启用 |

**CDC_SERVER**（4个字段均已补充注释）：

| 字段 | 含义 |
|------|------|
| SERVER_ID | 每个中心端进程的标识符（PK），不同中心端不能重复 |
| SERVER_DESC | 中心端进程描述符 |
| DATA_SOURCE_ID | 暂时不用 |
| FG_ACTIVE | 当前中心端是否启动 |

**CDC_TOPIC_OFFSET**（4个字段均已补充注释）：

| 字段 | 含义 |
|------|------|
| SERVER_ID | 中心端标识符 |
| KAFKA_TOPIC | 中心端从 Kafka 读取的 topic |
| NEXT_OFFSET | 下一条待消费消息的 offset |
| UPDATED_AT | 记录更新时间 |

### 不纳入当前开发的字段

| 表名 | 字段 | 原因 |
|------|------|------|
| CDC_DATA_SOURCE | DATA_SOURCE_DOMAIN | 暂时不用 |
| CDC_DATA_SUBSCRIBE | DATA_TARGET_TABLE | 暂时不用 |
| CDC_DATA_SUBSCRIBE | DATA_TARGET_COMMENT | 暂时不用 |
| CDC_LOG_CORRECT | RESULT_DETAIL | 暂时不用 |
| CDC_SERVER | DATA_SOURCE_ID | 暂时不用 |

## 5. 字典与状态值

### 明确字典

| 字典 | 取值 | 说明 |
|------|------|------|
| DATA_SOURCE_TYPE | ORACLE, MYSQL, DORIS | 数据库类型 |
| DATA_SOURCE_CATEGORY | SOURCE, TARGET | 统一使用大写，程序已做转换 |
| SNAPSHOT_STATUS | SNAPSHOT_COMPLETED, SNAPSHOT_RUNNING | 快照状态 |
| INSTRUCTION_TYPE | c(增量create), r(快照read), u(更新), d(删除), ddl(表结构变更) | Debezium操作类型 |
| RESULT_CODE | 0(成功), 1(异常) | |
| FG_ACTIVE | 0(停用/不启用), 1(启用/启动) | 多表通用 |
| IS_EDITABLE | 0(不可编辑), 1(可编辑) | |

### 候选字典（仍待确认是否封闭）

| 字典 | 当前取值 |
|------|----------|
| TABLE_NAMING_STRATEGY | TABLE_MERGE, CUSTOM_PREFIX_SUFFIX |
| CONFIG_KEY (CDC_SERVER_CONFIG) | 当前8个值，详见 table-detail.md |

## 6. 数据保留与清理原则

- **CDC_LOG_CORRECT / CDC_LOG_ERROR**：因表空间不足可被清空。清空后不影响系统正常运行。
- **CDC_DATA_SOURCE_EXTEND**：存在测试数据（mock7/mock8/mock9），无需清理。
- **CDC_DATA_SOURCE_EXTEND.TABLE_NAME_SUFFIX**：`_fucking` 为测试占位数据，无需理会。
- **DELETE_TIME**：当前所有记录 DELETE_TIME 均为 NULL，无软删除记录。
- **CDC_DATA_SOURCE.DATA_SOURCE_PASSWORD**：明文存储，不加密。

## 7. 页面开发约束

1. **CDC_DATA_SOURCE_RUN_STATE**：只读展示，不提供增删改操作。
2. **CDC_DATA_SOURCE.DATA_SOURCE_DOMAIN**：不纳入数据源管理页面。
3. **CDC_DATA_SUBSCRIBE.DATA_TARGET_TABLE / DATA_TARGET_COMMENT**：不纳入订阅管理页面。
4. **CDC_SERVER.DATA_SOURCE_ID**：不纳入中心端管理页面。
5. **DATA_SOURCE_CATEGORY**：表单输入自动转为大写。
6. **CDC_DATA_SOURCE_EXTEND**：作为 CDC_DATA_SOURCE 的 1:1 子表单设计。
7. **CDC_LOG_CORRECT / CDC_LOG_ERROR**：操作日志页面需同时支持两张表的查询。

## 8. 后续专项任务

当前无待后续专项任务。所有14个问题已闭环。
