# 表关系分析

## 已确认关系

数据库层面不存在任何外键约束。以下关系基于字段注释、数据匹配和命名规范确认。

### 1. CDC_DATA_SOURCE_EXTEND → CDC_DATA_SOURCE

- **证据**：字段注释明确写明"对应CDC_DATA_SOURCE表的DATA_SOURCE_ID，原则上与CDC_DATA_SOURCE表的记录一对一"
- **数据验证**：9条记录中7条DATA_SOURCE_ID能在CDC_DATA_SOURCE中找到匹配
- **关系类型**：1:1 扩展关系（高可信候选）
- **关联字段**：DATA_SOURCE_ID
- **置信度**：高可信候选（注释明确，数据大部分可匹配）

### 2. CDC_SERVER_CONFIG → CDC_SERVER

- **证据**：SERVER_ID 关联，8条配置全部属于 Server001
- **数据验证**：8/8条记录的SERVER_ID能在CDC_SERVER中找到匹配
- **关系类型**：N:1（多个配置项属于一个Server）
- **关联字段**：SERVER_ID
- **置信度**：已确认

### 3. CDC_TOPIC_OFFSET → CDC_SERVER

- **证据**：SERVER_ID 关联
- **数据验证**：1/1条记录的SERVER_ID能在CDC_SERVER中找到匹配
- **关系类型**：N:1（多个topic offset记录属于一个Server）
- **关联字段**：SERVER_ID
- **置信度**：已确认

## 候选关系

### 4. CDC_CLIENT_MULTIPLE → CDC_DATA_SOURCE

- **证据**：DATA_SOURCE_ID 字段注释"探针采集的数据源id"
- **数据验证**：部分 DATA_SOURCE_ID 为逗号分隔的多值，12条单值记录可匹配
- **关系类型**：N:M（一个探针可关联多个数据源，一个数据源可被多个探针采集）
- **关联字段**：DATA_SOURCE_ID（但为逗号分隔多值，非标准外键）
- **置信度**：高可信候选
- **注意**：DATA_SOURCE_ID 支持逗号分隔，无法使用标准SQL JOIN

### 5. CDC_DATA_SOURCE_RUN_STATE → CDC_CLIENT_MULTIPLE

- **证据**：CLIENT_ID 字段注释"探针id"，与 CDC_CLIENT_MULTIPLE.CLIENT_ID 同名
- **数据验证**：RUN_STATE的CLIENT_ID `hosp-002` 在 CDC_CLIENT_MULTIPLE 中存在
- **关系类型**：N:1（每个运行状态记录属于一个探针，但需与DATA_SOURCE_ID组合）
- **关联字段**：CLIENT_ID
- **置信度**：高可信候选

### 6. CDC_DATA_SOURCE_RUN_STATE → CDC_DATA_SOURCE

- **证据**：DATA_SOURCE_ID 字段注释"数据源id(源库id)"
- **数据验证**：RUN_STATE的DATA_SOURCE_ID在CDC_DATA_SOURCE中存在
- **关系类型**：N:1
- **关联字段**：DATA_SOURCE_ID
- **置信度**：高可信候选

### 7. CDC_DATA_SUBSCRIBE → CDC_DATA_SOURCE (from)

- **证据**：DATA_FROM_SOURCE_ID 字段存储源数据源ID
- **数据验证**：部分可匹配 CDC_DATA_SOURCE.DATA_SOURCE_ID
- **关系类型**：N:1
- **关联字段**：DATA_FROM_SOURCE_ID
- **置信度**：高可信候选

### 8. CDC_DATA_SUBSCRIBE → CDC_DATA_SOURCE (to)

- **证据**：DATA_TO_SOURCE_ID 字段存储目标数据源ID，支持逗号分隔多值
- **数据验证**：部分可匹配 CDC_DATA_SOURCE.DATA_SOURCE_ID
- **关系类型**：N:M（支持逗号分隔多值）
- **关联字段**：DATA_TO_SOURCE_ID
- **置信度**：高可信候选

### 9. CDC_SERVER → CDC_DATA_SOURCE

- **证据**：DATA_SOURCE_ID 字段，现存数据的值 `a31a1a6e542747ea8bcbfb12bd43b6b9` 可在 CDC_DATA_SOURCE 中找到
- **数据验证**：1/1匹配
- **关系类型**：N:1
- **关联字段**：DATA_SOURCE_ID
- **置信度**：高可信候选

### 10. CDC_LOG_ERROR / CDC_LOG_CORRECT → CDC_DATA_SOURCE

- **证据**：SOURCE_DATA_SOURCE_ID 和 TARGET_DATA_SOURCE_ID 字段
- **数据验证**：无法充分验证（LOG_CORRECT 为空，LOG_ERROR 仅1条）
- **关系类型**：N:1（每条日志关联一个源数据源和一个目标数据源）
- **置信度**：低可信候选

## 无法确认关系

### 11. CDC_LOG_CORRECT ↔ CDC_LOG_ERROR

- **关系类型**：结构镜像表（字段结构几乎相同）
- **推断**：同一CDC操作的成功日志写入 LOG_CORRECT，失败日志写入 LOG_ERROR
- **无法确认原因**：无外键约束，LOG_CORRECT 为空，无法通过数据交叉验证

### 12. CDC_DATA_SUBSCRIBE → CDC_CLIENT_MULTIPLE

- **推断**：可能通过 DATA_SUB_ID 或其他字段间接关联
- **无法确认原因**：CDC_DATA_SUBSCRIBE 全部字段无注释，无法推断关联方式

## 整体关系概述

```
CDC_CLIENT_MULTIPLE (探针)          CDC_DATA_SOURCE (数据源)
       |                                    |
       | CLIENT_ID                           | DATA_SOURCE_ID
       v                                    v
CDC_DATA_SOURCE_RUN_STATE (运行状态)    CDC_DATA_SOURCE_EXTEND (扩展配置)
       |                                    |
       | DATA_SOURCE_ID                      | DATA_SOURCE_ID
       v                                    v
       +---------- CDC_DATA_SUBSCRIBE (订阅) ----------+
                  |                          |
                  | DATA_FROM_SOURCE_ID       | DATA_TO_SOURCE_ID
                  v                          v
            [源数据源]                  [目标数据源]

CDC_SERVER (服务端)
    |
    +--- CDC_SERVER_CONFIG (配置项)
    +--- CDC_TOPIC_OFFSET (Topic偏移量)
    |
    v
[目标数据源] (via DATA_SOURCE_ID)

CDC_LOG_CORRECT (成功日志) --结构镜像--> CDC_LOG_ERROR (错误日志)
```

## ZooKeeper 运行监控模块

CDC_TOPIC_OFFSET 表从命名和结构判断，其功能与传统 ZooKeeper 中存储的 Kafka Consumer Group Offset 类似：

- **数据来源**：数据库（本系统自身）
- **性质**：只读运行监控
- **不对应本次 Oracle 配置表分析**中的配置类表关系
