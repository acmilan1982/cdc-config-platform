# Job 故障恢复——表数据结构分析

> 任务编号：045 阶段 B
> 分析日期：2026-07-29
> 数据库：Oracle 19c (192.168.174.65:1521/prod.enmotech.com, CDC schema)
> 分析基础：DDL、元数据视图、真实样例数据
> 先决分析：job-failure-record-analysis.md (001)、040-job-failure-data-association-and-closure-analysis.md

---

## 1. 执行摘要

对 `CDC_JOB_FAILURE_EVENT` 和 `CDC_JOB_FAILURE_HANDLE_LOG` 两张表进行了完整结构分析、约束和索引核验、真实数据质量检查。核心结论：

| 结论 | 置信度 | 证据 |
|------|--------|------|
| 两表通过 `FAILURE_EVENT_ID` 形成 1:N 关联，无 DB 外键约束 | **确定** | 字段注释 + 数据验证 |
| 逻辑 Job = CLIENT_ID + DATA_SOURCE_ID | **确定** | ZK 节点路径 + RUN_STATE 复合主键 |
| DATA_SOURCE_ID 可直接 JOIN CDC_DATA_SOURCE 获取名称 | **确定** | 真实数据匹配 |
| 物理 Job 链通过 FAILED_JOB_ID → NEW_JOB_ID 串联 | **高** | 单步链已验证；多步链由字段约束推断 |
| 当前仅 1 条事件 + 5 条日志，均为同一次完整恢复 | **事实** | COUNT(*) 实时验证 |
| 两表仅主键索引，数据增长后需补充业务索引 | **确定** | DDL + ALL_IND_COLUMNS |
| CREATED_AT 声明 `DEFAULT null NOT NULL` | **确定** | DDL 语句 |

---

## 2. CDC_JOB_FAILURE_EVENT（作业失败事件表）

### 2.1 DDL

```sql
CREATE TABLE CDC_JOB_FAILURE_EVENT (
    ID              NUMBER(19)       NOT NULL ENABLE,
    CLIENT_ID        VARCHAR2(64 CHAR) NOT NULL ENABLE,
    DATA_SOURCE_ID   VARCHAR2(64 CHAR) NOT NULL ENABLE,
    FAILED_JOB_ID    VARCHAR2(64 CHAR) NOT NULL ENABLE,
    FAILURE_TIME     DATE             NOT NULL ENABLE,
    FLINK_STATUS     VARCHAR2(32 CHAR),
    FAILURE_REASON   VARCHAR2(1000 CHAR),
    FAILURE_DETAIL   CLOB,
    EVENT_RESULT     VARCHAR2(32 CHAR) NOT NULL ENABLE,
    IGNORE_REASON    VARCHAR2(1000 CHAR),
    CREATED_AT       DATE             DEFAULT null NOT NULL ENABLE,
    CONSTRAINT PK_CDC_JOB_FAILURE_EVENT PRIMARY KEY (ID)
);
```

表注释：「作业失败事件表：记录 Flink job 失败回调事件本身，每次失败回调写入一条事件记录。该表只描述失败事件是否有效、失败原因和事件初步处理结果，不记录重启过程。」

### 2.2 字段字典

| # | 字段 | Oracle 类型 | 可空 | 默认值 | 注释 |
|---|------|------------|------|--------|------|
| 1 | ID | NUMBER(19) | N | — | 主键，程序统一 ID 生成器生成 |
| 2 | CLIENT_ID | VARCHAR2(64) | N | — | 客户端 ID（sync-client 实例） |
| 3 | DATA_SOURCE_ID | VARCHAR2(64) | N | — | 业务数据源 ID |
| 4 | FAILED_JOB_ID | VARCHAR2(64) | N | — | 失败的 Flink Job ID |
| 5 | FAILURE_TIME | DATE | N | — | 失败发生时间 |
| 6 | FLINK_STATUS | VARCHAR2(32) | Y | — | Flink 作业状态，通常为 FAILED |
| 7 | FAILURE_REASON | VARCHAR2(1000) | Y | — | 失败原因摘要 |
| 8 | FAILURE_DETAIL | CLOB | Y | — | 完整异常堆栈 |
| 9 | EVENT_RESULT | VARCHAR2(32) | N | — | 事件处理结果：ACCEPTED / IGNORED_INVALID / IGNORED_STALE |
| 10 | IGNORE_REASON | VARCHAR2(1000) | Y | — | 忽略原因 |
| 11 | CREATED_AT | DATE | N | null | 记录创建时间（DB SYSDATE） |

### 2.3 约束与索引

| 类型 | 名称 | 列 | 状态 |
|------|------|-----|------|
| Primary Key | PK_CDC_JOB_FAILURE_EVENT | ID | ENABLED |
| LOB Index | SYS_IL0000112022C00008$$ | FAILURE_DETAIL | VALID |

**当前仅主键索引和 LOB 索引，无任何业务索引。**

### 2.4 当前数据量

| 指标 | 值 |
|------|-----|
| 总行数 | 1 |
| 最早 CREATED_AT | 2026-07-27 19:18:41 |
| 最晚 CREATED_AT | 2026-07-27 19:18:41 |

### 2.5 枚举值分布

**EVENT_RESULT**（来自字段注释，当前仅 ACCEPTED 有数据）：

| 值 | 含义 | 数量 |
|------|------|------|
| ACCEPTED | 有效失败事件，进入自动重启流程 | 1 |
| IGNORED_INVALID | 无效失败事件 (dataSourceId/failedJobId 为空) | 0 |
| IGNORED_STALE | 旧 job 回调，当前 runtime 不再指向该 job | 0 |

### 2.6 与业务主表的关联

| 字段 | 关联表 | 关联字段 | 验证状态 |
|------|--------|---------|---------|
| CLIENT_ID | CDC_CLIENT_MULTIPLE | CLIENT_ID | hosp-006 存在于此表 |
| DATA_SOURCE_ID | CDC_DATA_SOURCE | DATA_SOURCE_ID (PK) | my-19c → oracle-业务库33 |
| DATA_SOURCE_ID + CLIENT_ID | CDC_DATA_SOURCE_RUN_STATE | 复合主键 | hosp-006 + my-19c = SNAPSHOT_COMPLETED |

---

## 3. CDC_JOB_FAILURE_HANDLE_LOG（作业失败处理记录表）

### 3.1 DDL

```sql
CREATE TABLE CDC_JOB_FAILURE_HANDLE_LOG (
    ID                     NUMBER(19)       NOT NULL ENABLE,
    FAILURE_EVENT_ID       NUMBER(19)       NOT NULL ENABLE,
    CLIENT_ID              VARCHAR2(64 CHAR) NOT NULL ENABLE,
    DATA_SOURCE_ID         VARCHAR2(64 CHAR) NOT NULL ENABLE,
    FAILED_JOB_ID          VARCHAR2(64 CHAR) NOT NULL ENABLE,
    ATTEMPT_NO             NUMBER(10),
    HANDLE_STAGE           VARCHAR2(64 CHAR) NOT NULL ENABLE,
    HANDLE_TIME            DATE             NOT NULL ENABLE,
    CONSECUTIVE_FAILURES   NUMBER(10),
    RESTART_COUNT_TOTAL    NUMBER(19),
    RESTART_DELAY_SECONDS  NUMBER(10),
    NEXT_RESTART_TIME      DATE,
    RESTART_START_TIME     DATE,
    RESTART_END_TIME       DATE,
    NEW_JOB_ID             VARCHAR2(64 CHAR),
    ERROR_DETAIL           CLOB,
    REMARK                 VARCHAR2(1000 CHAR),
    CREATED_AT             DATE             DEFAULT null NOT NULL ENABLE,
    CONSTRAINT PK_CDC_JOB_FAILURE_HANDLE_LOG PRIMARY KEY (ID)
);
```

表注释：「作业失败处理记录表：记录某个失败事件进入处理流程后的各阶段动作，包括接收、忽略、调度重启、开始重启、新 job 提交、提交失败、稳定检查通过等。一个失败事件可以对应多条处理记录。」

### 3.2 字段字典

| # | 字段 | Oracle 类型 | 可空 | 注释 |
|---|------|------------|------|------|
| 1 | ID | NUMBER(19) | N | 主键 |
| 2 | FAILURE_EVENT_ID | NUMBER(19) | N | 关联的失败事件 ID |
| 3 | CLIENT_ID | VARCHAR2(64) | N | 客户端 ID（冗余自事件表） |
| 4 | DATA_SOURCE_ID | VARCHAR2(64) | N | 业务数据源 ID（冗余） |
| 5 | FAILED_JOB_ID | VARCHAR2(64) | N | 失败的 Flink Job ID（冗余） |
| 6 | ATTEMPT_NO | NUMBER(10) | Y | 重启尝试次数 |
| 7 | HANDLE_STAGE | VARCHAR2(64) | N | 处理阶段（见 3.5） |
| 8 | HANDLE_TIME | DATE | N | 处理动作发生时间 |
| 9 | CONSECUTIVE_FAILURES | NUMBER(10) | Y | 当前连续失败次数 |
| 10 | RESTART_COUNT_TOTAL | NUMBER(19) | Y | 累计重启次数 |
| 11 | RESTART_DELAY_SECONDS | NUMBER(10) | Y | 本次重启退避延迟秒数 |
| 12 | NEXT_RESTART_TIME | DATE | Y | 下次计划重启时间 |
| 13 | RESTART_START_TIME | DATE | Y | 本次重启开始时间 |
| 14 | RESTART_END_TIME | DATE | Y | 本次重启结束时间 |
| 15 | NEW_JOB_ID | VARCHAR2(64) | Y | 重启后的新 Flink Job ID |
| 16 | ERROR_DETAIL | CLOB | Y | 当前阶段异常详情 |
| 17 | REMARK | VARCHAR2(1000) | Y | 备注信息 |
| 18 | CREATED_AT | DATE | N | 记录创建时间 |

### 3.3 约束与索引

| 类型 | 名称 | 列 | 状态 |
|------|------|-----|------|
| Primary Key | PK_CDC_JOB_FAILURE_HANDLE_LOG | ID | ENABLED |
| LOB Index | SYS_IL0000112026C00016$$ | ERROR_DETAIL | VALID |

**当前仅主键索引和 LOB 索引，无任何业务索引。**

### 3.4 当前数据量

| 指标 | 值 |
|------|-----|
| 总行数 | 5 |
| 最早 HANDLE_TIME | 2026-07-27 19:17:43 |
| 最晚 HANDLE_TIME | 2026-07-27 19:23:44 |
| 日志:事件比 | 5:1 |

### 3.5 HANDLE_STAGE 枚举分布

| 值 | 含义 | 实际数量 |
|------|------|----------|
| JOB_FAILURE_RECEIVED | 收到有效失败事件 | 1 |
| RESTART_SCHEDULED | 已安排自动重启 | 1 |
| RESTART_STARTED | 开始执行重启 | 1 |
| NEW_JOB_SUBMIT_SUCCEEDED | 新 job 提交成功 | 1 |
| STABLE_CHECK_PASSED | 稳定运行检查通过 | 1 |
| JOB_FAILURE_IGNORED_INVALID | 忽略无效失败事件 | 0 |
| JOB_FAILURE_IGNORED_STALE | 忽略旧 job 失败事件 | 0 |
| DUPLICATED_EVENT_IGNORED | 忽略重复失败事件 | 0 |
| SCHEDULED_RESTART_SKIPPED | 已跳过计划重启 | 0 |
| NEW_JOB_SUBMIT_FAILED | 新 job 提交失败 | 0 |

当前 5 条日志恰好描绘了一次完整的成功恢复流程。

---

## 4. 两表关联关系

```
CDC_JOB_FAILURE_EVENT (1) ──── (N) CDC_JOB_FAILURE_HANDLE_LOG
         ID  ←──────────────────  FAILURE_EVENT_ID
```

- **关联字段**: `CDC_JOB_FAILURE_HANDLE_LOG.FAILURE_EVENT_ID = CDC_JOB_FAILURE_EVENT.ID`
- **约束类型**: 无数据库外键约束（字段注释明确"由程序保证关联关系"）
- **冗余字段**: 日志表冗余了 `CLIENT_ID`、`DATA_SOURCE_ID`、`FAILED_JOB_ID`
- **当前数据完整性**: 无孤立事件、无孤立日志

---

## 5. 真实样例数据

### 5.1 唯一事件记录

| 字段 | 值 |
|------|-----|
| ID | 3400900000000000001 (约) |
| CLIENT_ID | hosp-006 |
| DATA_SOURCE_ID | my-19c |
| FAILED_JOB_ID | 783e7f54d0c2420e8b54add510a0f1c7 |
| FAILURE_TIME | 2026-07-27 19:17:24 |
| FLINK_STATUS | FAILED |
| FAILURE_REASON | oracle.net.ns.NetException: Listener refused... ORA-12514 |
| FAILURE_DETAIL 长度 | 10,929 字符 |
| EVENT_RESULT | ACCEPTED |
| CREATED_AT | 2026-07-27 19:18:41 |

### 5.2 处理日志时间线（5 条）

| HANDLE_STAGE | HANDLE_TIME | ATTEMPT_NO | RESTART_DELAY | 关键信息 |
|-------------|-------------|------------|---------------|----------|
| JOB_FAILURE_RECEIVED | 19:17:43 | — | — | — |
| RESTART_SCHEDULED | 19:17:43 | 1 | 60s | NEXT_RESTART_TIME=19:18:43 |
| RESTART_STARTED | 19:18:43 | 1 | — | 按计划时间准时启动 |
| NEW_JOB_SUBMIT_SUCCEEDED | 19:18:44 | 1 | — | NEW_JOB_ID=1d45cf72... |
| STABLE_CHECK_PASSED | 19:23:44 | 1 | — | 稳定检查在重启 5 分钟后 |

**关键观察**:
- 全程耗时约 6 分钟（失败发生到稳定检查通过）
- HANDLE_TIME 相同时（记录 1、2 均为 19:17:43），可用 `ID` ASC 作为稳定第二排序键
- ATTEMPT_NO=1 贯穿全程，说明这是一次通过的重启
- NEW_JOB_ID 出现在第 4、5 条，可用于追溯物理 Job 链

---

## 6. 数据质量总览

| 检查项 | 结果 | 备注 |
|--------|------|------|
| 孤立事件（无日志） | 0 | — |
| 孤立日志（无事件） | 0 | — |
| 重复事件 | 0 | — |
| CLIENT_ID 无主数据 | 0 | hosp-006 存在于 CDC_CLIENT_MULTIPLE |
| DATA_SOURCE_ID 无主数据 | 0 | my-19c 存在于 CDC_DATA_SOURCE |
| FAILURE_DETAIL 为空 | 0 | 当前记录有 10,929 字符 |
| ERROR_DETAIL 为空 | 5/5 | 当前所有日志的 ERROR_DETAIL 均为空 |
| FAILURE_TIME > CREATED_AT | 是 | 19:17:24 < 19:18:41（正常，先失败后入库） |
| HANDLE_TIME 倒置 | 无 | 严格递增 |
| 多事件场景 | 无 | 仅 1 条事件，无法验证 |
| 异常链场景 | 无 | 无法用真实数据验证 |

---

## 7. 与页面字段的映射

| 页面展示字段 | 数据来源 | 来源表/关联 |
|-------------|----------|------------|
| 客户端 ID | CLIENT_ID | 事件表或日志表 |
| 数据源 ID | DATA_SOURCE_ID | 同上 |
| 数据源名称 | DATA_SOURCE_NAME | CDC_DATA_SOURCE (JOIN) |
| Job 当前状态 | 计算字段 | 基于故障过程状态推导 |
| 故障过程状态 | 计算字段 | 基于 HANDLE_STAGE 推导 |
| 当前物理 Job ID | 最新 NEW_JOB_ID 或 FAILED_JOB_ID | 日志表 NEW_JOB_ID |
| 首次失败时间 | 故障过程首条事件的 FAILURE_TIME | 事件表 |
| 最终恢复时间 | STABLE_CHECK_PASSED 的 HANDLE_TIME | 日志表 |
| 最近处理时间 | 最大 HANDLE_TIME | 日志表 |
| 故障持续时间 | 最终恢复时间 - 首次失败时间 | 计算 |
| 失败事件数 | COUNT(事件.ID) | 事件表 |
| 重启次数 | COUNT(DISTINCT ATTEMPT_NO) 或 RESTART_COUNT_TOTAL | 日志表 |
| 物理 Job 演变链 | FAILED_JOB_ID → NEW_JOB_ID 串联 | 两表 |
| 异常链 | NEW_JOB_ID 匹配多个后续事件 | 算法检测 |
| 数据源机构 | DATA_SOURCE_ORG | CDC_DATA_SOURCE (JOIN) |
| FAILURE_DETAIL | FAILURE_DETAIL (CLOB) | 事件表 |
| ERROR_DETAIL | ERROR_DETAIL (CLOB) | 日志表 |

---

## 8. ORACLE 日期/时区说明

- 事件表和日志表中的所有 DATE 类型均为 Oracle DATE（精确到秒），无时区信息
- 开发库服务器时区：Asia/Shanghai（UTC+8）
- JDBC 连接不强制 session 时区，DATE 读取时使用 JVM 默认时区
- 建议前后端统一约定：所有时间以 `Asia/Shanghai` 存储和展示
- 前端展示格式：`yyyy-MM-dd HH:mm:ss`
- 持续时间计算使用 Java `Duration`，与数据库无关

---

> 本次数据库分析仅执行 SELECT 和元数据查询。无数据库写操作。
