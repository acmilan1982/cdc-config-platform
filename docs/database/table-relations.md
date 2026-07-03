# 表关系分析

> 最近更新：2026-07-03（根据项目负责人答复更新）

## 数据库约束关系

数据库层面不存在任何外键约束。

## 业务逻辑关系（已确认）

以下关系均基于字段注释、数据匹配和项目负责人确认，但数据库层面未建立外键约束。

### 1. CDC_DATA_SOURCE_EXTEND → CDC_DATA_SOURCE（1:1）

- **关系类型**：业务逻辑关系
- **关联字段**：DATA_SOURCE_ID
- **说明**：正常情况下两表记录一对一。字段注释和项目负责人双重确认。
- **数据库约束**：无外键
- **异常数据**：mock7/mock8/mock9 为测试数据

### 2. CDC_SERVER_CONFIG → CDC_SERVER（N:1）

- **关系类型**：业务逻辑关系
- **关联字段**：SERVER_ID
- **数据库约束**：无外键

### 3. CDC_TOPIC_OFFSET → CDC_SERVER（N:1）

- **关系类型**：业务逻辑关系
- **关联字段**：SERVER_ID
- **数据库约束**：无外键

### 4. CDC_DATA_SUBSCRIBE → CDC_DATA_SOURCE（from 方向）

- **关系类型**：业务逻辑关系
- **关联字段**：DATA_FROM_SOURCE_ID → DATA_SOURCE_ID (WHERE DATA_SOURCE_CATEGORY='SOURCE')
- **注意**：DATA_FROM_SOURCE_ID 支持逗号分隔多值，无法使用标准SQL JOIN
- **数据库约束**：无外键

### 5. CDC_DATA_SUBSCRIBE → CDC_DATA_SOURCE（to 方向）

- **关系类型**：业务逻辑关系
- **关联字段**：DATA_TO_SOURCE_ID → DATA_SOURCE_ID (WHERE DATA_SOURCE_CATEGORY='TARGET')
- **注意**：DATA_TO_SOURCE_ID 支持逗号分隔多值，无法使用标准SQL JOIN
- **数据库约束**：无外键

### 6. CDC_CLIENT_MULTIPLE → CDC_DATA_SOURCE（N:M）

- **关系类型**：业务逻辑关系
- **关联字段**：DATA_SOURCE_ID（逗号分隔多值）→ DATA_SOURCE_ID
- **注意**：多值存储，无法使用标准SQL JOIN
- **数据库约束**：无外键

### 7. CDC_DATA_SOURCE_RUN_STATE → CDC_CLIENT_MULTIPLE（N:1）

- **关系类型**：业务逻辑关系
- **关联字段**：CLIENT_ID
- **数据库约束**：无外键

### 8. CDC_DATA_SOURCE_RUN_STATE → CDC_DATA_SOURCE（N:1）

- **关系类型**：业务逻辑关系
- **关联字段**：DATA_SOURCE_ID
- **数据库约束**：无外键

### 9. CDC_LOG_CORRECT / CDC_LOG_ERROR → CDC_DATA_SOURCE

- **关系类型**：业务逻辑关系
- **关联字段**：SOURCE_DATA_SOURCE_ID, TARGET_DATA_SOURCE_ID
- **数据库约束**：无外键

## 候选关系

（无）

## 无法确认关系

### 10. CDC_SERVER → CDC_DATA_SOURCE

- **关联字段**：DATA_SOURCE_ID
- **原因**：项目负责人确认 DATA_SOURCE_ID"暂时不用"。现有值虽可匹配但程序不使用此关联。
- **结论**：不承载当前业务关系，不纳入页面开发。

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
