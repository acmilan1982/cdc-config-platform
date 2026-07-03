# 待确认问题清单（闭环记录）

> 任务编号：DATABASE_ANALYSIS_001
> 闭环日期：2026-07-03
> 问题总数：14
> 已确认：13 | 部分确认：1

---

## DB-Q-001

- **原问题**：CDC_LOG_CORRECT 表是否仍在生产中使用？空表原因是什么？
- **涉及表**：CDC_LOG_CORRECT, CDC_LOG_ERROR
- **项目负责人答复**：两表均仍在使用。CDC_LOG_CORRECT 保存已成功同步到目标库的数据记录。CDC_LOG_ERROR 保存未能正常同步到目标库的数据记录。当前为空是因为表空间不够且日志量大，之前被清空。
- **最终状态**：已确认
- **最终结论**：两表仍在生产使用，分别存储成功和失败的CDC同步日志。空表/少量数据是因为历史清空操作。
- **对后续开发的影响**：CDC操作日志页面需同时支持查询 CDC_LOG_CORRECT（成功日志）和 CDC_LOG_ERROR（错误日志）。
- **是否需要后续专项任务**：否

---

## DB-Q-002

- **原问题**：CLIENT_ID 是否应唯一？当前重复数据是否需要清理？是否需要添加主键约束？
- **涉及表**：CDC_CLIENT_MULTIPLE
- **项目负责人答复**：CLIENT_ID 是主键。已删除多余记录，并把 CLIENT_ID 设为主键。
- **最终状态**：已确认
- **最终结论**：CLIENT_ID 为主键，当前3条记录均唯一。
- **对后续开发的影响**：探针管理页面可直接使用 CLIENT_ID 作为唯一标识。
- **是否需要后续专项任务**：否

---

## DB-Q-003

- **原问题**：
  1. DATA_SUB_ID 是否应作为主键？
  2. DATA_SOURCE_COMMENT 和 DATA_TARGET_COMMENT 的用途是什么？
  3. CLOB 字段是否存储 JSON 格式数据，还是纯文本表名列表？
  4. 该表是否需要添加主键约束？
- **涉及表**：CDC_DATA_SUBSCRIBE
- **项目负责人答复**：
  - 每个字段已增加注释
  - DATA_SUB_ID 已设为主键
  - DATA_SOURCE_COMMENT 是源表的表注释
  - DATA_TARGET_COMMENT 字段忽略不计
  - CLOB 字段纯文本
- **最终状态**：部分确认
- **已确认内容**：
  - DATA_SUB_ID 是代理主键，程序自动生成，无业务含义
  - DATA_SOURCE_COMMENT 与 DATA_SOURCE_TABLE 一一对应
  - DATA_TARGET_TABLE 和 DATA_TARGET_COMMENT 暂时不用
  - CLOB 字段存储纯文本（非JSON）
  - DATA_FROM_SOURCE_ID / DATA_TO_SOURCE_ID 支持逗号分隔多值
- **剩余未确认内容**：无（所有字段注释已补全，可通过注释确定字段含义）
- **后续限制**：
  - DATA_TARGET_TABLE 和 DATA_TARGET_COMMENT 暂不纳入页面开发
  - DATA_SOURCE_COMMENT 需作为源表注释字段展示

---

## DB-Q-004

- **原问题**：CDC_SERVER 表各字段的确切含义是什么？是否需要添加主键约束？
- **涉及表**：CDC_SERVER
- **项目负责人答复**：已添加注释，已重读确认。SERVER_ID 是主键，不同中心端标识符不能重复。DATA_SOURCE_ID 暂时不用。
- **最终状态**：已确认
- **最终结论**：
  - SERVER_ID：每个中心端进程的标识符（PK）
  - SERVER_DESC：中心端进程描述符
  - DATA_SOURCE_ID：暂时不用
  - FG_ACTIVE：当前中心端是否启动
- **对后续开发的影响**：中心端管理页面仅需关注 SERVER_ID、SERVER_DESC、FG_ACTIVE，DATA_SOURCE_ID 不纳入页面。
- **是否需要后续专项任务**：否

---

## DB-Q-005

- **原问题**：NEXT_OFFSET 是指下一个待消费的offset还是已消费的最后一个offset？为何只有1条记录？
- **涉及表**：CDC_TOPIC_OFFSET
- **项目负责人答复**：
  - NEXT_OFFSET 表示下一条待消费消息的 offset
  - 每个中心端消费 Kafka 数百个 topic，该表记录每个 topic 的消费位置
  - 当前仅1条记录是因为开发环境只测试了1个 topic
- **最终状态**：已确认
- **最终结论**：NEXT_OFFSET 为下一条待消费 offset。生产环境会有数百条记录。
- **对后续开发的影响**：Topic 偏移量监控页面需按中心端和 topic 维度展示，支持大量记录的查询和分页。
- **是否需要后续专项任务**：否

---

## DB-Q-006

- **原问题**：source/SOURCE 大小写不一致是否需要修正？程序层面是否真的对大小写不敏感？
- **涉及表**：CDC_DATA_SOURCE
- **涉及字段**：DATA_SOURCE_CATEGORY
- **项目负责人答复**：最好都是大写。程序中已把该字段的值都转成了大写。
- **最终状态**：已确认
- **最终结论**：统一使用大写 SOURCE / TARGET。程序层已处理大小写兼容。
- **对后续开发的影响**：前端新增/编辑时自动转为大写。数据库存量数据的大小写不一致为历史遗留，可保留。
- **是否需要后续专项任务**：否

---

## DB-Q-007

- **原问题**：CDC_DATA_SOURCE_EXTEND 中 mock7、mock8 是否为测试数据？是否需要清理或补充 CDC_DATA_SOURCE 中的对应记录？
- **涉及表**：CDC_DATA_SOURCE, CDC_DATA_SOURCE_EXTEND
- **项目负责人答复**：正常情况下 CDC_DATA_SOURCE 与 CDC_DATA_SOURCE_EXTEND 是 1:1 关系。表中存在测试数据，不用理会。
- **最终状态**：已确认
- **最终结论**：两表为 1:1 关系（业务约束，非数据库约束）。mock7/mock8/mock9 为测试数据，可忽略。
- **对后续开发的影响**：数据源管理页面的扩展配置部分需按 1:1 关系设计。测试数据不影响功能开发。
- **是否需要后续专项任务**：否

---

## DB-Q-008

- **原问题**：DATA_SOURCE_DOMAIN 字段是否仍在设计中？全部为NULL是否正常？
- **涉及表**：CDC_DATA_SOURCE
- **涉及字段**：DATA_SOURCE_DOMAIN
- **项目负责人答复**：该字段暂时不用理会。
- **最终状态**：暂不处理
- **最终结论**：当前版本不启用该字段。
- **对后续开发的影响**：数据源管理页面不纳入 DATA_SOURCE_DOMAIN 字段。
- **是否需要后续专项任务**：否

---

## DB-Q-009

- **原问题**：INSTRUCTION_TYPE 中 c（新增）和 r（新增）的区别是什么？
- **涉及表**：CDC_LOG_CORRECT, CDC_LOG_ERROR
- **涉及字段**：INSTRUCTION_TYPE
- **项目负责人答复**：c 表示 create（增量数据），r 表示 read（快照数据）。同步到目标库的数据都通过 Debezium 从 Oracle 读取，r=快照数据，c=增量数据。
- **最终状态**：已确认
- **最终结论**：
  - `c`：create — Debezium 增量数据
  - `r`：read — Debezium 快照数据
  - `u`：update — 更新
  - `d`：delete — 删除
  - `ddl`：表结构变更
- **对后续开发的影响**：日志页面需正确展示5种操作类型的中文含义。
- **是否需要后续专项任务**：否

---

## DB-Q-010

- **原问题**：RAW_MESSAGE 在两个表中类型不同（BLOB vs CLOB）是有意设计吗？CDC_LOG_CORRECT 中是否需要改为 CLOB？
- **涉及表**：CDC_LOG_CORRECT, CDC_LOG_ERROR
- **涉及字段**：RAW_MESSAGE
- **项目负责人答复**：已把 CDC_LOG_CORRECT 中 RAW_MESSAGE 字段类型更新为 CLOB。
- **最终状态**：已确认
- **最终结论**：两表 RAW_MESSAGE 已统一为 CLOB。
- **对后续开发的影响**：统一按 CLOB 处理，可直接作为文本展示。
- **是否需要后续专项任务**：否

---

## DB-Q-011

- **原问题**：`_fucking` 后缀是否为测试数据？是否需要替换为正式命名后缀？
- **涉及表**：CDC_DATA_SOURCE_EXTEND
- **涉及字段**：TABLE_NAME_SUFFIX
- **项目负责人答复**：为测试数据内容，无需理会。
- **最终状态**：已确认
- **最终结论**：测试占位数据，不影响系统功能。
- **对后续开发的影响**：无需特殊处理。
- **是否需要后续专项任务**：否

---

## DB-Q-012

- **原问题**：数据库密码明文存储是否符合安全规范？是否需要引入加密机制？
- **涉及表**：CDC_DATA_SOURCE
- **涉及字段**：DATA_SOURCE_PASSWORD
- **项目负责人答复**：不用加密。
- **最终状态**：暂不处理
- **最终结论**：保持明文存储，不引入加密机制。
- **对后续开发的影响**：密码字段按普通文本处理即可。
- **是否需要后续专项任务**：否

---

## DB-Q-013

- **原问题**：CDC_DATA_SOURCE 表的原始中文注释内容是什么？是否需要重新添加？
- **涉及表**：CDC_DATA_SOURCE
- **涉及字段**：(表注释)
- **项目负责人答复**：表注释已更新，请重读。（已验证为"数据源，包括源库，目标库"）
- **最终状态**：已确认
- **最终结论**：表注释已恢复正常。CDC_LOG_CORRECT 表注释仍为乱码 "???"。
- **对后续开发的影响**：无直接影响。
- **是否需要后续专项任务**：CDC_LOG_CORRECT 表注释如需要可后续补充。

---

## DB-Q-014

- **原问题**：只存在1条运行状态记录是否正常？运行状态是否应由系统自动维护？
- **涉及表**：CDC_DATA_SOURCE_RUN_STATE
- **项目负责人答复**：该表由另外的程序插入，当前程序只读即可。仅1条记录是开发环境特性，有几条都是正常的。
- **最终状态**：已确认
- **最终结论**：该表由外部程序维护，本系统只读访问。记录数量取决于实际运行状态。
- **对后续开发的影响**：运行状态展示页面对该表只读查询，不提供增删改功能。
- **是否需要后续专项任务**：否

---

## 闭环统计

| 状态 | 数量 | 编号 |
|------|------|------|
| 已确认 | 12 | DB-Q-001, DB-Q-002, DB-Q-004, DB-Q-005, DB-Q-006, DB-Q-007, DB-Q-009, DB-Q-010, DB-Q-011, DB-Q-013, DB-Q-014 |
| 部分确认 | 1 | DB-Q-003 |
| 暂不处理 | 1 | DB-Q-008, DB-Q-012 |
| 已废弃 | 0 | |
| 待后续专项任务 | 0 | |

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
| CDC_DATA_SOURCE 更新表注释为"数据源，包括源库，目标库" | COMMENT | 已验证 |
| CDC_LOG_CORRECT RAW_MESSAGE BLOB→CLOB | DDL | 已验证 |
