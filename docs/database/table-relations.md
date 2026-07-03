# 表关系分析

> 最近更新：2026-07-03（根据项目负责人答复更新）

## 已确认关系

数据库层面不存在外键约束。以下关系基于字段注释、数据匹配和项目负责人确认。

### 1. CDC_DATA_SOURCE_EXTEND → CDC_DATA_SOURCE（1:1）

- **证据**：
  - 字段注释明确写明"对应CDC_DATA_SOURCE表的DATA_SOURCE_ID，原则上与CDC_DATA_SOURCE表的记录一对一"
  - 项目负责人确认：正常情况下是 1:1 关系
- **关联字段**：DATA_SOURCE_ID
- **置信度**：已确认
- **注意**：无数据库级外键约束，存在测试数据（mock7/mock8等）不匹配

### 2. CDC_SERVER_CONFIG → CDC_SERVER（N:1）

- **证据**：SERVER_ID 关联
- **关联字段**：SERVER_ID
- **置信度**：已确认

### 3. CDC_TOPIC_OFFSET → CDC_SERVER（N:1）

- **证据**：SERVER_ID 关联，KAFKA_TOPIC 记录每个中心端的 topic 消费位置
- **关联字段**：SERVER_ID
- **置信度**：已确认

### 4. CDC_DATA_SUBSCRIBE → CDC_DATA_SOURCE（from 方向）

- **证据**：DATA_FROM_SOURCE_ID 注释"源库，即业务库，对应CDC_DATA_SOURCE表中，DATA_SOURCE_CATEGORY=source的记录主键"
- **关联字段**：DATA_FROM_SOURCE_ID（支持逗号分隔多值）
- **置信度**：已确认
- **关系类型**：一个订阅可关联多个源数据源

### 5. CDC_DATA_SUBSCRIBE → CDC_DATA_SOURCE（to 方向）

- **证据**：DATA_TO_SOURCE_ID 注释"目标库，对应CDC_DATA_SOURCE表中，DATA_SOURCE_CATEGORY=target的记录主键"
- **关联字段**：DATA_TO_SOURCE_ID（支持逗号分隔多值）
- **置信度**：已确认
- **关系类型**：一个订阅可关联多个目标数据源

### 6. CDC_CLIENT_MULTIPLE → CDC_DATA_SOURCE（N:M）

- **证据**：DATA_SOURCE_ID 注释"探针采集的数据源id，可以有多个id，id之间用英文逗号分隔"
- **关联字段**：DATA_SOURCE_ID（逗号分隔多值）
- **置信度**：已确认
- **注意**：由于多值存储，无法使用标准SQL JOIN

### 7. CDC_DATA_SOURCE_RUN_STATE → CDC_CLIENT_MULTIPLE（N:1）

- **证据**：CLIENT_ID 关联
- **关联字段**：CLIENT_ID
- **置信度**：已确认

### 8. CDC_DATA_SOURCE_RUN_STATE → CDC_DATA_SOURCE（N:1）

- **证据**：DATA_SOURCE_ID 关联
- **关联字段**：DATA_SOURCE_ID
- **置信度**：已确认

### 9. CDC_LOG_CORRECT / CDC_LOG_ERROR → CDC_DATA_SOURCE

- **证据**：SOURCE_DATA_SOURCE_ID 和 TARGET_DATA_SOURCE_ID 字段
- **关联字段**：SOURCE_DATA_SOURCE_ID, TARGET_DATA_SOURCE_ID
- **置信度**：已确认（项目负责人确认两表均在使用中）

## 候选关系

（无）

## 无法确认关系

### 10. CDC_SERVER → CDC_DATA_SOURCE

- **关联字段**：DATA_SOURCE_ID
- **原因**：项目负责人答复"暂时不用"，当前值 `a31a1a6e542747ea8bcbfb12bd43b6b9` 虽可匹配 CDC_DATA_SOURCE，但程序不使用此关联
- **结论**：此字段当前不承载业务关系

## 整体关系图

```
CDC_CLIENT_MULTIPLE (探针) ──────┐
       │ CLIENT_ID (PK)          │ DATA_SOURCE_ID (逗号分隔多值)
       v                         v
CDC_DATA_SOURCE_RUN_STATE ←── CDC_DATA_SOURCE (数据源)
  (PK: CLIENT_ID + DS_ID)        │ DATA_SOURCE_ID (PK)
                                 │
                    ┌────────────┼────────────┐
                    │            │            │
                    v            v            v
          CDC_DATA_SOURCE    CDC_DATA_      CDC_DATA_
          _EXTEND (1:1)      SUBSCRIBE      SUBSCRIBE
                             (from)         (to)

CDC_SERVER (中心端) ─────────────┐
       │ SERVER_ID (PK)          │
       ├── CDC_SERVER_CONFIG     │
       └── CDC_TOPIC_OFFSET      │
                                 │
CDC_LOG_CORRECT (成功日志) ──────┤
CDC_LOG_ERROR   (错误日志) ──────┘
  └── SOURCE_DATA_SOURCE_ID → CDC_DATA_SOURCE
  └── TARGET_DATA_SOURCE_ID → CDC_DATA_SOURCE
```

## ZooKeeper 运行监控模块

CDC_TOPIC_OFFSET 表功能与传统 ZooKeeper 中存储的 Kafka Consumer Group Offset 类似，以数据库表替代 ZooKeeper 存储。

- **数据来源**：数据库（本系统自身）
- **性质**：只读运行监控
- **不对应本次 Oracle 配置表分析**中的配置类表关系
