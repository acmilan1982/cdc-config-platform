# 数据特征分析

> 最近更新：2026-07-03（根据项目负责人答复更新）

## 数据量总览

| 表名 | 记录数 | 有数据 | 备注 |
|------|--------|--------|------|
| CDC_CLIENT_MULTIPLE | 3 | 是 | 已从21条去重至3条（CLIENT_ID 设为主键后） |
| CDC_DATA_SOURCE | 15 | 是 | |
| CDC_DATA_SOURCE_EXTEND | 9 | 是 | 含测试数据（mock7/mock8/mock9） |
| CDC_DATA_SOURCE_RUN_STATE | 1 | 是 | 由其他程序维护，当前程序只读 |
| CDC_DATA_SUBSCRIBE | 9 | 是 | |
| CDC_LOG_CORRECT | 0 | 否 | 因表空间不足已被清空，该表仍在使用 |
| CDC_LOG_ERROR | 1 | 是 | 因表空间不足已被清空，仅剩1条 |
| CDC_SERVER | 1 | 是 | |
| CDC_SERVER_CONFIG | 8 | 是 | |
| CDC_TOPIC_OFFSET | 1 | 是 | 开发环境仅测试1个topic |

## 空值特征

### 含空值的字段

| 表名 | 字段 | 空值数 | 说明 |
|------|------|--------|------|
| CDC_CLIENT_MULTIPLE | DATA_SOURCE_ID | 0 | 去重后所有记录均有数据源 |
| CDC_CLIENT_MULTIPLE | CLIENT_DESC | 0 | 去重后所有记录均有描述 |
| CDC_DATA_SOURCE | DATA_SOURCE_DOMAIN | 15 | 全部为空 — 项目负责人确认"暂时不用" |
| CDC_DATA_SOURCE | DATA_SOURCE_BIZ_ATTR | 14 | 仅 DORIS 类型数据源有值 |
| CDC_DATA_SOURCE_EXTEND | TABLE_NAME_PREFIX | 4 | TABLE_MERGE 策略时为空的4条 |
| CDC_DATA_SOURCE_EXTEND | TABLE_NAME_SUFFIX | 4 | TABLE_MERGE 策略时为空的4条 |
| CDC_SERVER | DATA_SOURCE_ID | 0 | 有值但项目负责人确认"暂时不用" |

### 软删除字段

所有含 DELETE_TIME 字段的表（CDC_DATA_SOURCE、CDC_DATA_SUBSCRIBE）中，DELETE_TIME 全部为 NULL。当前数据集中无软删除记录。

## 取值范围

### FG_ACTIVE 分布

| 表名 | 0（停用） | 1（启用） |
|------|----------|----------|
| CDC_CLIENT_MULTIPLE | 1 | 2 |
| CDC_DATA_SOURCE | 13 | 2 |
| CDC_DATA_SUBSCRIBE | 8 | 1 |
| CDC_SERVER | 0 | 1 |
| **合计** | **22** | **6** |

**特征**（更新后）：CDC_CLIENT_MULTIPLE 去重后由19:2变为1:2。

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

**已确认**：项目负责人确认最好都是大写，程序已将值转为大写。当前大小写混用为历史数据。

### SNAPSHOT_STATUS 分布

| 状态 | 数量 |
|------|------|
| SNAPSHOT_COMPLETED | 1 |

### TABLE_NAMING_STRATEGY 分布

| 策略 | 数量 |
|------|------|
| CUSTOM_PREFIX_SUFFIX | 5 |
| TABLE_MERGE | 4 |

## 时间范围

| 表名 | 最早时间 | 最晚时间 | 说明 |
|------|----------|----------|------|
| CDC_DATA_SOURCE.INSERT_TIME | 2025-07-22 | 2025-11-18 | |
| CDC_DATA_SOURCE_RUN_STATE.UPDATED_AT | - | 2026-07-02 | |
| CDC_TOPIC_OFFSET.UPDATED_AT | - | 2026-06-17 | |
| CDC_LOG_ERROR.INSERT_TIME | - | 2026-03-25 | |

## 异常或冲突数据（含分类）

### 1. DATA_SOURCE_CATEGORY 大小写不一致

- **分类**：历史遗留
- **说明**：当前存在 source、SOURCE、target 三种写法
- **状态**：项目负责人确认统一使用大写，程序已做兼容。存量数据无需修正。

### 2. CDC_DATA_SOURCE_EXTEND 测试数据

- **分类**：测试数据
- **说明**：mock7、mock8、mock9 的 DATA_SOURCE_ID 在 CDC_DATA_SOURCE 中无对应记录
- **状态**：项目负责人确认"不用理会"

### 3. TABLE_NAME_SUFFIX 占位值

- **分类**：测试数据
- **说明**：`_fucking` 出现在5条记录的 TABLE_NAME_SUFFIX 中
- **状态**：项目负责人确认为测试数据，"无需理会"

### 4. CDC_LOG_CORRECT 空表

- **分类**：正常现象
- **说明**：该表仍在使用，当前为空是因为之前表空间不够被清空
- **状态**：已确认

### 5. CDC_LOG_ERROR 仅1条记录

- **分类**：正常现象
- **说明**：同样因表空间不足被清空，剩余1条为清理后新产生的错误
- **状态**：已确认

### 6. CDC_DATA_SOURCE.DATA_SOURCE_DOMAIN 全部为空

- **分类**：暂不处理
- **说明**：15条记录全部为NULL
- **状态**：项目负责人确认"暂时不用理会"，不纳入当前页面开发

## 数据安全注意

- CDC_DATA_SOURCE.DATA_SOURCE_PASSWORD 存储明文数据库密码 — 项目负责人确认"不用加密"
- CDC_LOG_ERROR.RAW_MESSAGE 包含Kafka原始消息JSON（含操作数据）
- CDC_LOG_ERROR.LOG_DETAIL 包含完整Java异常堆栈（含包路径和类名）
