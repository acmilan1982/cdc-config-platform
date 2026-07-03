# 数据特征分析

## 数据量总览

| 表名 | 记录数 | 有数据 | 备注 |
|------|--------|--------|------|
| CDC_CLIENT_MULTIPLE | 21 | 是 | |
| CDC_DATA_SOURCE | 15 | 是 | |
| CDC_DATA_SOURCE_EXTEND | 9 | 是 | |
| CDC_DATA_SOURCE_RUN_STATE | 1 | 是 | |
| CDC_DATA_SUBSCRIBE | 9 | 是 | |
| CDC_LOG_CORRECT | 0 | 否 | 空表 |
| CDC_LOG_ERROR | 1 | 是 | |
| CDC_SERVER | 1 | 是 | |
| CDC_SERVER_CONFIG | 8 | 是 | |
| CDC_TOPIC_OFFSET | 1 | 是 | |
| **合计** | **66** | | CDC_LOG_CORRECT 为空 |

## 空值特征

### 含空值的字段

| 表名 | 字段 | 空值数 | 说明 |
|------|------|--------|------|
| CDC_CLIENT_MULTIPLE | DATA_SOURCE_ID | 5 | 5个探针未关联数据源 |
| CDC_CLIENT_MULTIPLE | CLIENT_DESC | 3 | 3条记录无描述 |
| CDC_DATA_SOURCE | DATA_SOURCE_DOMAIN | 15 | 全部为空 |
| CDC_DATA_SOURCE | DATA_SOURCE_CATEGORY | 0 | 无空值（但有大小写混用） |
| CDC_DATA_SOURCE | DATA_SOURCE_NAME | 0 | 无空值 |
| CDC_DATA_SOURCE | DATA_SOURCE_BIZ_ATTR | 14 | 仅1条有值（target-doris-v4） |
| CDC_DATA_SOURCE_EXTEND | TABLE_NAME_PREFIX | 4 | TABLE_MERGE策略时为空的4条 |
| CDC_DATA_SOURCE_EXTEND | TABLE_NAME_SUFFIX | 4 | TABLE_MERGE策略时为空的4条 |

### 软删除字段

所有含 DELETE_TIME 字段的表（CDC_DATA_SOURCE、CDC_DATA_SUBSCRIBE）中，DELETE_TIME 全部为 NULL。当前数据集中无软删除记录。

## 取值范围

### FG_ACTIVE 分布

| 表名 | 0（停用/删除） | 1（启用） |
|------|---------------|----------|
| CDC_CLIENT_MULTIPLE | 19 | 2 |
| CDC_DATA_SOURCE | 13 | 2 |
| CDC_DATA_SUBSCRIBE | 8 | 1 |
| CDC_SERVER | 0 | 1 |
| **合计** | **40** | **6** |

**特征**：绝大多数配置记录处于停用/未启用状态（87%为0）。

### DATA_SOURCE_TYPE 分布

| 类型 | 数量 | 占比 |
|------|------|------|
| ORACLE | 10 | 67% |
| DORIS | 3 | 20% |
| MYSQL | 2 | 13% |

### DATA_SOURCE_CATEGORY 分布

| 类别 | 数量 | 说明 |
|------|------|------|
| target | 8 | 目标库 |
| SOURCE | 5 | 源库（大写） |
| source | 2 | 源库（小写） |

**注意**：大小写不一致，共7个源库（SOURCE+source），8个目标库（target）。

### SNAPSHOT_STATUS 分布

| 状态 | 数量 |
|------|------|
| SNAPSHOT_COMPLETED | 1 |

仅1条运行状态记录，状态为已完成。SNAPSHOT_RUNNING 未在当前数据中出现。

### TABLE_NAMING_STRATEGY 分布

| 策略 | 数量 |
|------|------|
| CUSTOM_PREFIX_SUFFIX | 5 |
| TABLE_MERGE | 4 |

### INSTRUCTION_TYPE（错误日志）

| 类型 | 数量 | 含义 |
|------|------|------|
| d | 1 | 删除操作 |

## 时间范围

（基于 DATE 类型字段的当前数据）

| 表名 | 最早时间 | 最晚时间 | 说明 |
|------|----------|----------|------|
| CDC_DATA_SOURCE.INSERT_TIME | 2025-07-22 | 2025-11-18 | 数据源创建时间跨度约4个月 |
| CDC_DATA_SOURCE.UPDATE_TIME | 2025-07-29 | 2025-12-01 | 最近更新在2025年12月 |
| CDC_DATA_SUBSCRIBE.INSERT_TIME | 2025-09-18 | 2025-11-30 | 订阅创建时间 |
| CDC_DATA_SUBSCRIBE.UPDATE_TIME | 2025-09-19 | 2026-04-14 | 最近更新在2026年4月 |
| CDC_DATA_SOURCE_RUN_STATE.UPDATED_AT | - | 2026-07-02 | 最近状态更新 |
| CDC_TOPIC_OFFSET.UPDATED_AT | - | 2026-06-17 | 最近偏移量更新 |
| CDC_LOG_ERROR.INSERT_TIME | - | 2026-03-25 | 错误日志时间 |

## 异常或冲突数据

### 1. DATA_SOURCE_CATEGORY 大小写不一致

字段注释说明"大小写都行"，但实际存在 `source` 和 `SOURCE` 混用。虽然注释表明程序兼容，但从数据规范角度属于不一致。

### 2. CDC_DATA_SOURCE_EXTEND 孤立记录

`mock7` 和 `mock8` 两条记录在 CDC_DATA_SOURCE_EXTEND 中存在，但在 CDC_DATA_SOURCE 中无对应记录（或有对应但 DATA_SOURCE_ID 不匹配）。

### 3. CDC_DATA_SUBSCRIBE 引用不存在的目标数据源

`target-mysql-5`（被 DATA_SUB_ID=444 引用）在 CDC_DATA_SOURCE 中不存在。可能是测试残留或数据源已被删除。

### 4. CDC_CLIENT_MULTIPLE 重复 CLIENT_ID

存在多个重复的 CLIENT_ID（如 `hosp-002` 出现2次，`hosp-003` 出现3次）。无主键约束，无法从数据库层面区分。

### 5. CDC_DATA_SOURCE_EXTEND SUFFIX 占位数据

`_fucking` 作为 TABLE_NAME_SUFFIX 出现在5条记录中，明显为测试占位数据，非生产配置。

### 6. CDC_LOG_CORRECT 空表

该表设计用于存储正常的CDC执行日志，但当前完全为空。可能原因：
- 开发环境无实际CDC任务运行
- 日志已过期清理
- 该表功能已被替代

### 7. CDC_DATA_SOURCE.DATA_SOURCE_DOMAIN 全部为空

15条记录中该字段全部为 NULL，可能该字段尚未使用或已废弃。

## 可能已废弃但无法确认的内容

| 项 | 说明 |
|----|------|
| CDC_LOG_CORRECT 表 | 空表，无法确认是否仍在使用 |
| CDC_DATA_SOURCE.DATA_SOURCE_DOMAIN | 全部为空 |
| CDC_LOG_CORRECT.RESULT_DETAIL | 字段注释"暂时不用" |
| CDC_DATA_SOURCE_EXTEND SUFFIX `_fucking` | 明显测试占位数据 |

## 数据安全注意

- CDC_DATA_SOURCE.DATA_SOURCE_PASSWORD 存储明文数据库密码（15条记录可见）
- CDC_LOG_ERROR.RAW_MESSAGE 包含Kafka原始消息JSON（含操作数据）
- CDC_LOG_ERROR.LOG_DETAIL 包含完整Java异常堆栈（含包路径和类名）
