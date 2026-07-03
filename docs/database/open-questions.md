# 待确认问题清单

> 最近更新：2026-07-03（根据项目负责人答复更新）

## 问题状态总览

| 编号 | 涉及表 | 问题摘要 | 状态 |
|------|--------|----------|------|
| DB-Q-001 | CDC_LOG_CORRECT, CDC_LOG_ERROR | 两表是否仍在使用及空表原因 | 已确认 |
| DB-Q-002 | CDC_CLIENT_MULTIPLE | CLIENT_ID 唯一性和主键 | 已确认（已修复） |
| DB-Q-003 | CDC_DATA_SUBSCRIBE | 字段注释和主键缺失 | 已确认（已修复） |
| DB-Q-004 | CDC_SERVER | 字段注释和主键缺失 | 待进一步核实 |
| DB-Q-005 | CDC_TOPIC_OFFSET | 字段注释和NEXT_OFFSET含义 | 已确认（已修复） |
| DB-Q-006 | CDC_DATA_SOURCE | DATA_SOURCE_CATEGORY 大小写 | 已确认 |
| DB-Q-007 | CDC_DATA_SOURCE_EXTEND | mock7/mock8 孤立数据 | 已确认（测试数据） |
| DB-Q-008 | CDC_DATA_SOURCE | DATA_SOURCE_DOMAIN 全空 | 已确认（暂时不用） |
| DB-Q-009 | CDC_LOG_CORRECT | INSTRUCTION_TYPE c/r 区别 | 已确认（c=增量, r=快照） |
| DB-Q-010 | CDC_LOG_CORRECT | RAW_MESSAGE BLOB vs CLOB | 已确认（已修复为CLOB） |
| DB-Q-011 | CDC_DATA_SOURCE_EXTEND | _fucking 后缀 | 已确认（测试数据） |
| DB-Q-012 | CDC_DATA_SOURCE | 密码明文存储 | 已确认（不用加密） |
| DB-Q-013 | CDC_DATA_SOURCE | 表注释丢失 | 已确认（已修复） |
| DB-Q-014 | CDC_DATA_SOURCE_RUN_STATE | 仅1条运行状态记录 | 已确认（开发环境特性） |

---

## DB-Q-001（已确认）✓

- **涉及表**：CDC_LOG_CORRECT, CDC_LOG_ERROR
- **答复**：两表均仍在使用。CDC_LOG_CORRECT 保存已成功同步到目标库的数据。CDC_LOG_ERROR 保存未成功同步的数据。当前为空/少量数据是由于表空间不够且日志量大，之前被清空。
- **文档更新**：已在 table-detail.md、data-characteristics.md 中更新

---

## DB-Q-002（已确认）✓

- **涉及表**：CDC_CLIENT_MULTIPLE
- **答复**：CLIENT_ID 是主键。已删除多余记录（21→3条），CLIENT_ID 已设为主键（PK_CDC_CLIENT_MULTIPLE）。
- **数据库变更**：已验证 PK 存在，记录已去重为3条
- **文档更新**：已在 table-list.md、table-detail.md、data-characteristics.md 中更新

---

## DB-Q-003（已确认）✓

- **涉及表**：CDC_DATA_SUBSCRIBE
- **答复**：
  - 所有字段已添加注释
  - DATA_SUB_ID 已设为主键（PK_CDC_DATA_SUBSCRIBE），为程序自动生成的代理主键
  - DATA_SOURCE_COMMENT 是源表的表注释，与 DATA_SOURCE_TABLE 对应
  - DATA_TARGET_COMMENT 字段忽略不计
  - CLOB 字段为纯文本
- **数据库变更**：已验证 PK 存在，12个字段注释已完善
- **文档更新**：已在 table-detail.md、dictionary-candidates.md 中更新

---

## DB-Q-004（待进一步核实）⚠

- **涉及表**：CDC_SERVER
- **已确认事实**：
  - 字段注释已添加（4个字段）
  - SERVER_ID 已设为主键（PK_CDC_SERVER）
  - 项目负责人答复：CDC_SERVER 已添加注释，请重读
- **状态**：项目负责人标记为"待进一步核实"
- **分析文档已基于现有注释更新，但该问题的最终确认状态仍为未完成**
- **当前推断（基于新注释）**：
  - SERVER_ID：每个中心端进程的标识符
  - SERVER_DESC：中心端进程描述符
  - DATA_SOURCE_ID：暂时不用
  - FG_ACTIVE：当前中心端是否启动

---

## DB-Q-005（已确认）✓

- **涉及表**：CDC_TOPIC_OFFSET
- **答复**：
  - 字段注释已添加
  - NEXT_OFFSET 表示下一条待消费消息的 offset
  - 每个中心端消费 Kafka 数百个 topic，该表记录每个 topic 的消费位置
  - 当前仅1条记录是开发环境只测试了1个 topic
- **数据库变更**：已验证4个字段注释已完善
- **文档更新**：已在 table-detail.md 中更新

---

## DB-Q-006（已确认）✓

- **涉及表**：CDC_DATA_SOURCE
- **答复**：DATA_SOURCE_CATEGORY 最好都是大写。程序中已把该字段值都转成大写了。
- **文档更新**：已在 dictionary-candidates.md、data-characteristics.md 中更新

---

## DB-Q-007（已确认）✓

- **涉及表**：CDC_DATA_SOURCE, CDC_DATA_SOURCE_EXTEND
- **答复**：CDC_DATA_SOURCE 与 CDC_DATA_SOURCE_EXTEND 正常是 1:1 关系。表中 mock7/mock8 为测试数据，不用理会。
- **文档更新**：已在 table-relations.md、data-characteristics.md 中更新

---

## DB-Q-008（已确认）✓

- **涉及表**：CDC_DATA_SOURCE
- **答复**：DATA_SOURCE_DOMAIN 字段暂时不用理会。
- **文档更新**：已在 dictionary-candidates.md、data-characteristics.md 中更新

---

## DB-Q-009（已确认）✓

- **涉及表**：CDC_LOG_CORRECT
- **答复**：c 表示 create（增量数据），r 表示 read（快照数据）。同步到目标库的数据都通过 Debezium 从 Oracle 读取，r=快照数据，c=增量数据。
- **文档更新**：已在 dictionary-candidates.md、table-detail.md 中更新

---

## DB-Q-010（已确认）✓

- **涉及表**：CDC_LOG_CORRECT
- **答复**：已把 CDC_LOG_CORRECT 中 RAW_MESSAGE 字段类型更新为 CLOB。
- **数据库变更**：已验证 RAW_MESSAGE 类型从 BLOB 变为 CLOB
- **文档更新**：已在 table-detail.md 中更新

---

## DB-Q-011（已确认）✓

- **涉及表**：CDC_DATA_SOURCE_EXTEND
- **答复**：`_fucking` 为测试数据内容，无需理会。
- **文档更新**：已在 data-characteristics.md 中更新

---

## DB-Q-012（已确认）✓

- **涉及表**：CDC_DATA_SOURCE
- **答复**：不用加密。
- **文档更新**：已在 data-characteristics.md 中更新

---

## DB-Q-013（已确认）✓

- **涉及表**：CDC_DATA_SOURCE
- **答复**：CDC_DATA_SOURCE 表注释已更新，请重读。
- **数据库变更**：已验证表注释变为"数据源，包括源库，目标库"（有效 UTF-8 中文）
- **注意**：CDC_LOG_CORRECT 表注释仍为 "???"，未更新
- **文档更新**：已在 table-list.md、table-detail.md 中更新

---

## DB-Q-014（已确认）✓

- **涉及表**：CDC_DATA_SOURCE_RUN_STATE
- **答复**：该表由另外的程序插入，当前程序只读即可。仅1条记录是开发环境特性，有几条都是正常的。
- **文档更新**：已在 table-detail.md、data-characteristics.md 中更新

---

## 待进一步核实

| 编号 | 涉及表 | 问题摘要 |
|------|--------|----------|
| DB-Q-004 | CDC_SERVER | 字段注释已添加，主键已设置，但项目负责人标记为"待进一步核实" |

其他13个问题已全部确认。

## 数据库变更摘要

| 变更 | 类型 | 状态 |
|------|------|------|
| CDC_CLIENT_MULTIPLE 添加主键 PK_CDC_CLIENT_MULTIPLE (CLIENT_ID) | DDL | 已验证 |
| CDC_CLIENT_MULTIPLE 删除重复记录 (21→3) | DML | 已验证 |
| CDC_DATA_SUBSCRIBE 添加主键 PK_CDC_DATA_SUBSCRIBE (DATA_SUB_ID) | DDL | 已验证 |
| CDC_DATA_SUBSCRIBE 添加12个字段注释 | COMMENT | 已验证 |
| CDC_SERVER 添加主键 PK_CDC_SERVER (SERVER_ID) | DDL | 已验证 |
| CDC_SERVER 添加4个字段注释 | COMMENT | 已验证 |
| CDC_TOPIC_OFFSET 添加4个字段注释 | COMMENT | 已验证 |
| CDC_DATA_SOURCE 更新表注释 | COMMENT | 已验证 |
| CDC_LOG_CORRECT RAW_MESSAGE BLOB→CLOB | DDL | 已验证 |
