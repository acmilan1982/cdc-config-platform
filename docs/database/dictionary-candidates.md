# 字典分类分析

## 明确字典

以下字段在注释中明确列出了取值，或取值范围封闭且可验证。

### 1. CDC_DATA_SOURCE.DATA_SOURCE_TYPE

- **注释**：数据库类型-目前只支持源库：oracle,目标库:mysql,doris
- **当前值分布**：ORACLE(10), DORIS(3), MYSQL(2)
- **分类**：明确字典
- **字典值**：ORACLE, MYSQL, DORIS

### 2. CDC_DATA_SOURCE.DATA_SOURCE_CATEGORY

- **注释**：源表还是目标表，取值source/target，大小写都行
- **当前值分布**：source(2), target(8), SOURCE(5)
- **分类**：明确字典
- **字典值**：source, target（大小写不敏感）
- **注意**：存在大小写混用（source/SOURCE），建议统一

### 3. CDC_DATA_SOURCE_RUN_STATE.SNAPSHOT_STATUS

- **注释**：快照状态，SNAPSHOT_COMPLETED/SNAPSHOT_RUNNING
- **当前值分布**：SNAPSHOT_COMPLETED(1)
- **分类**：明确字典
- **字典值**：SNAPSHOT_COMPLETED, SNAPSHOT_RUNNING

### 4. CDC_LOG_CORRECT.INSTRUCTION_TYPE

- **注释**：c：新增  u：更新  d：删除  r: 新增  ddl:表结构更新
- **当前值分布**：无数据（CDC_LOG_CORRECT 为空）
- **分类**：明确字典
- **字典值**：c, u, d, r, ddl

### 5. CDC_LOG_CORRECT.RESULT_CODE

- **注释**：0表示执行成功，1表示执行出现异常
- **当前值分布**：无数据
- **分类**：明确字典
- **字典值**：0 (成功), 1 (异常)

### 6. CDC_CLIENT_MULTIPLE.FG_ACTIVE / CDC_DATA_SOURCE.FG_ACTIVE / CDC_DATA_SUBSCRIBE.FG_ACTIVE / CDC_SERVER.FG_ACTIVE

- **注释（CDC_CLIENT_MULTIPLE）**：探针是否启用
- **注释（CDC_DATA_SOURCE）**：是否可用标记位-删除或停用后该值为0，正常为1
- **当前值分布**：0(40), 1(6)（合计所有表）
- **分类**：明确字典
- **字典值**：0 (停用/删除), 1 (启用/正常)

### 7. CDC_SERVER_CONFIG.IS_EDITABLE

- **注释**：当前配置项是否可编辑
- **当前值分布**：0(2), 1(6)
- **默认值**：1
- **分类**：明确字典
- **字典值**：0 (不可编辑), 1 (可编辑)

## 候选字典

以下字段当前 distinct 值较少或特征明显，但注释缺失或不完整，需项目负责人确认。

### 8. CDC_DATA_SOURCE_EXTEND.TABLE_NAMING_STRATEGY

- **注释**：当前业务库在目标库表的命名策略
- **当前值分布**：TABLE_MERGE(4), CUSTOM_PREFIX_SUFFIX(5)
- **分类**：候选字典
- **候选值**：TABLE_MERGE, CUSTOM_PREFIX_SUFFIX
- **待确认**：是否为封闭枚举，是否还有其他策略值

### 9. CDC_SERVER_CONFIG.CONFIG_KEY

- **注释**：配置项key
- **当前值分布**：8个不同值（每个仅出现1次）
- **分类**：候选字典
- **候选值**：
  - server-log-topic-name
  - monitor-metric-topic-name
  - snapshotBatchSize
  - raw-message-storage-strategy
  - tableRowDeleteStrategy
  - auto-create-table
  - auto-expand-column-length
  - realtime-insert-batch-enabled-database-types
- **待确认**：配置项key集合是否为封闭集合，还是允许任意扩展

### 10. CDC_SERVER_CONFIG.CONFIG_VALUE（按CONFIG_KEY约束）

- **raw-message-storage-strategy**：PLAIN — 注释提到 NONE/PLAIN/COMPRESS（候选字典）
- **tableRowDeleteStrategy**：DELETE — 注释提到 DELETE/DELETE_FLAG（候选字典）
- **auto-create-table**：true — 候选布尔值
- **auto-expand-column-length**：false — 候选布尔值
- **snapshotBatchSize**：500 — 候选数值型（上限500）
- **realtime-insert-batch-enabled-database-types**：doris,oracle — 候选多选字典（可选值：DORIS/MYSQL/ORACLE）

## 普通业务字段

以下字段虽然当前 distinct 值较少，但理论上允许用户自由输入，不属于字典。

### 11. CDC_DATA_SOURCE.SOURCE_APP

- **注释**：源应用
- **当前值**：全部为 `his应用`（15条）
- **分类**：普通业务字段（理论自由输入，非封闭枚举）

### 12. CDC_CLIENT_MULTIPLE.CLIENT_ID

- **注释**：探针id
- **当前值**：用户自定义标识（如 hosp-001, hosp-002）
- **分类**：普通业务字段（用户自定义标识符）

### 13. CDC_DATA_SOURCE.DATA_SOURCE_ID

- **注释**：主键
- **当前值**：UUID 格式或业务名格式
- **分类**：普通业务字段（用户定义标识符）

### 14. CDC_SERVER.SERVER_ID

- **注释**：(无)
- **当前值**：Server001
- **分类**：普通业务字段（用户定义标识符）

### 15. CDC_DATA_SUBSCRIBE.DATA_SUB_ID

- **注释**：(无)
- **当前值**：111, 222, 333, 444, 555, mock7, mock8, mock9, fail-db
- **分类**：普通业务字段（用户定义标识符）

## 总结

| 类型 | 数量 | 说明 |
|------|------|------|
| 明确字典 | 7 | 注释明确或值域封闭 |
| 候选字典 | 3 | 需项目负责人确认 |
| 普通业务字段 | 5+ | 用户自由输入 |
