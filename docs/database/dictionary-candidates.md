# 字典分类分析

> 最近更新：2026-07-03（根据项目负责人答复更新）

## 明确字典

### 1. CDC_DATA_SOURCE.DATA_SOURCE_TYPE

- **注释**：数据库类型-目前只支持源库：oracle,目标库:mysql,doris
- **当前值分布**：ORACLE(10), DORIS(3), MYSQL(2)
- **字典值**：ORACLE, MYSQL, DORIS

### 2. CDC_DATA_SOURCE.DATA_SOURCE_CATEGORY

- **注释**：源表还是目标表，取值source/target（程序已转为大写）
- **项目负责人确认**：最好都是大写，程序中已把该字段的值都转成大写
- **字典值**：SOURCE, TARGET
- **注意**：当前数据库样本仍有大小写混用，但程序层已兼容

### 3. CDC_DATA_SOURCE_RUN_STATE.SNAPSHOT_STATUS

- **注释**：SNAPSHOT_COMPLETED / SNAPSHOT_RUNNING
- **字典值**：SNAPSHOT_COMPLETED, SNAPSHOT_RUNNING

### 4. CDC_LOG_CORRECT.INSTRUCTION_TYPE / CDC_LOG_ERROR.INSTRUCTION_TYPE

- **注释（CDC_LOG_CORRECT）**：c：新增  u：更新  d：删除  r：新增  ddl:表结构更新
- **项目负责人确认**：c 表示 create（增量数据），r 表示 read（快照数据），都是同步到目标库的数据。通过 Debezium 从 Oracle 读取，r=快照数据，c=增量数据
- **字典值**：
  - `c`：create，增量新增
  - `r`：read，快照读取
  - `u`：update，更新
  - `d`：delete，删除
  - `ddl`：表结构变更

### 5. CDC_LOG_CORRECT.RESULT_CODE / CDC_LOG_ERROR.RESULT_CODE

- **注释（CDC_LOG_CORRECT）**：0表示执行成功，1表示执行出现异常
- **字典值**：0 (成功), 1 (异常)

### 6. FG_ACTIVE（多表通用）

- **注释**：
  - CDC_CLIENT_MULTIPLE：探针是否启用
  - CDC_DATA_SOURCE：是否可用标记位-删除或停用后该值为0，正常为1
  - CDC_DATA_SUBSCRIBE：当前记录是否启用标志，0：不启用 1：启用
  - CDC_SERVER：当前中心端是否启动
- **字典值**：0 (停用/不启用), 1 (启用/正常/启动)

### 7. CDC_SERVER_CONFIG.IS_EDITABLE

- **注释**：当前配置项是否可编辑
- **字典值**：0 (不可编辑), 1 (可编辑)

## 候选字典

### 8. CDC_DATA_SOURCE_EXTEND.TABLE_NAMING_STRATEGY

- **当前值**：TABLE_MERGE(4), CUSTOM_PREFIX_SUFFIX(5)
- **分类**：候选字典（注释未列出完整取值，仍需确认是否封闭）

### 9. CDC_SERVER_CONFIG.CONFIG_KEY / CONFIG_VALUE

- **CONFIG_KEY 候选值集合**：server-log-topic-name, monitor-metric-topic-name, snapshotBatchSize, raw-message-storage-strategy, tableRowDeleteStrategy, auto-create-table, auto-expand-column-length, realtime-insert-batch-enabled-database-types
- **raw-message-storage-strategy** 的 CONFIG_VALUE：注释提及 NONE/PLAIN/COMPRESS，当前值为 PLAIN（候选字典）
- **tableRowDeleteStrategy** 的 CONFIG_VALUE：注释提及 DELETE/DELETE_FLAG，当前值为 DELETE（候选字典）
- **分类**：候选字典（CONFIG_KEY 是否封闭未确认）

## 普通业务字段

### 10. CDC_DATA_SOURCE.SOURCE_APP

- **当前值**：全部为 `his应用`（15条）
- **分类**：普通业务字段（理论自由输入）

### 11. CDC_DATA_SUBSCRIBE.DATA_SUB_DESC

- **注释**：订阅描述
- **分类**：普通业务字段（用户自由输入）

### 12. CDC_CLIENT_MULTIPLE.CLIENT_ID / CDC_DATA_SOURCE.DATA_SOURCE_ID / CDC_SERVER.SERVER_ID

- **分类**：普通业务字段（用户定义的标识符）

### 13. CDC_SERVER_CONFIG.CONFIG_DESC

- **注释**：配置项描述
- **分类**：普通业务字段（配置说明文本）

## 不需要关注的字段（项目负责人确认）

| 表名 | 字段 | 说明 |
|------|------|------|
| CDC_DATA_SOURCE | DATA_SOURCE_DOMAIN | 暂时不用 |
| CDC_DATA_SOURCE | DATA_SOURCE_PASSWORD | 不用加密 |
| CDC_DATA_SUBSCRIBE | DATA_TARGET_TABLE | 暂时没用，可以不管 |
| CDC_DATA_SUBSCRIBE | DATA_TARGET_COMMENT | 暂时没用，可以不管 |
| CDC_LOG_CORRECT | RESULT_DETAIL | 暂时不用 |
| CDC_SERVER | DATA_SOURCE_ID | 暂时不用 |

## 总结

| 类型 | 数量 | 说明 |
|------|------|------|
| 明确字典 | 7 | 注释明确或项目负责人已确认值域 |
| 候选字典 | 2 | TABLE_NAMING_STRATEGY、CONFIG_KEY/CONFIG_VALUE |
| 普通业务字段 | 多 | 用户自由输入 |
| 不关注字段 | 6 | 项目负责人确认暂时不用 |
