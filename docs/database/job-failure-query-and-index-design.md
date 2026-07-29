# Job 故障恢复——查询 SQL 与索引设计

> 任务编号：045 阶段 B
> 设计日期：2026-07-29
> 数据库：Oracle 19c
> 框架：MyBatis-Plus 3.5.3.1, JDK 8

---

## 1. 架构决策：数据库查询 vs Java 组装

### 1.1 方案对比

| 维度 | 方案 A: DB 完成全部链路计算 | 方案 B: DB 查基础数据 + Java 组装（推荐） |
|------|--------------------------|--------------------------------------|
| 实现方式 | 递归 CTE / CONNECT BY + 窗口函数 | Mapper 返回关联 List，Service 层构建对象图 |
| SQL 复杂度 | 高（单条 SQL 可能 100+ 行） | 低（5-8 条简单 SQL） |
| 可测试性 | 差（核心逻辑在 SQL 内，难以单元测试） | 好（核心算法在 Java，可纯单元测试） |
| 可维护性 | 差（Oracle 方言，后续迁移困难） | 好（Service 层纯 Java，无 DB 方言依赖） |
| 性能 | 理论上一次 IO | 多次 IO 但数据量小（单客户端 10-100 条事件） |
| 调试 | 困难 | 容易 |
| 扩展性 | 差（加字段或改规则需改 SQL） | 好（Java 重构容易） |
| N+1 风险 | 低 | 需注意（通过批量查询规避） |

### 1.2 推荐方案

**方案 B — 数据库查询基础数据，Java 内存组装故障链和状态。**

原因：
1. 当前数据量极小（1 事件 + 5 日志），未来增长也不会很大（单个逻辑 Job 的业务周期内故障事件不会超过百级）
2. Java Service 层的算法可以编写单元测试，不依赖数据库
3. 项目使用 MyBatis-Plus，多表关联查询简单
4. JDK 8 下递归 CTE 的调试和维护成本远高于 Java 代码
5. 避免 N+1：在 Mapper 层使用 `IN` 或 `EXISTS` 批量查询

---

## 2. 五类查询 SQL 设计

### 2.1 API-1: 主页面客户端和 Job 汇总

#### 查询概览

此接口需要三个维度的数据：
1. 所有活跃客户端的逻辑 Job 列表
2. 每个逻辑 Job 的最近故障事件
3. 客户端级别的正常/异常统计

#### SQL-1a: 拉取所有逻辑 Job 及其最近故障事件

```sql
-- 获取每个逻辑 Job 的最新事件（含状态判定所需信息）
SELECT
    e.CLIENT_ID,
    e.DATA_SOURCE_ID,
    e.ID           AS LAST_EVENT_ID,
    e.FAILED_JOB_ID AS LAST_FAILED_JOB_ID,
    e.FAILURE_TIME AS LAST_FAILURE_TIME,
    e.EVENT_RESULT,
    e.CREATED_AT
FROM CDC_JOB_FAILURE_EVENT e
WHERE (e.CLIENT_ID, e.DATA_SOURCE_ID, e.FAILURE_TIME) IN (
    SELECT CLIENT_ID, DATA_SOURCE_ID, MAX(FAILURE_TIME)
    FROM CDC_JOB_FAILURE_EVENT
    GROUP BY CLIENT_ID, DATA_SOURCE_ID
);
```

#### SQL-1b: 批量获取最新事件的最近处理日志

```sql
-- 对 SQL-1a 返回的 LAST_EVENT_ID 列表，批量查最新日志
SELECT
    l.FAILURE_EVENT_ID,
    l.HANDLE_STAGE,
    l.HANDLE_TIME,
    l.NEW_JOB_ID,
    l.ATTEMPT_NO,
    l.RESTART_COUNT_TOTAL,
    l.NEXT_RESTART_TIME,
    l.RESTART_START_TIME,
    l.CREATED_AT
FROM CDC_JOB_FAILURE_HANDLE_LOG l
WHERE (l.FAILURE_EVENT_ID, l.HANDLE_TIME) IN (
    SELECT FAILURE_EVENT_ID, MAX(HANDLE_TIME)
    FROM CDC_JOB_FAILURE_HANDLE_LOG
    WHERE FAILURE_EVENT_ID IN (:eventIds)
    GROUP BY FAILURE_EVENT_ID
);
```

当 HANDLE_TIME 存在重复时，辅助使用 `MAX(ID)` 确保唯一。

#### SQL-1c: 获取数据源名称

```sql
SELECT DATA_SOURCE_ID, DATA_SOURCE_NAME
FROM CDC_DATA_SOURCE
WHERE DATA_SOURCE_ID IN (:dataSourceIds);
```

#### SQL-1d: 从 CDC_DATA_SOURCE_RUN_STATE 补全逻辑 Job 列表

```sql
SELECT CLIENT_ID, DATA_SOURCE_ID, UPDATED_AT
FROM CDC_DATA_SOURCE_RUN_STATE
WHERE (CLIENT_ID, DATA_SOURCE_ID) IN (
    SELECT CLIENT_ID, DATA_SOURCE_ID FROM CDC_CLIENT_MULTIPLE
    CROSS JOIN ... -- 根据业务需求决定是否拉取全量或仅活跃
);
```

#### Java 组装路径

```
1. 查询 RUN_STATE 获取全量逻辑 Job 列表
2. 查询 DATA_SOURCE 获取名称映射
3. 查询最近事件 (SQL-1a)，左连接到逻辑 Job
4. 批量查询最新日志 (SQL-1b)
5. Service 层组装 ClientSummaryVO：
   - 按 CLIENT_ID 分组
   - 每组计算 normalCount, abnormalCount
   - 每个逻辑 Job 填入 Job 当前状态、最近失败时间等
```

**无 N+1 验证**: 步骤 1-4 各 1 次查询，共 4 次。

---

### 2.2 API-2: 最近一次故障详情

#### 查询概览

需要 5 个子查询，全部对单个逻辑 Job 的最近一次故障过程。

#### SQL-2a: 获取最近事件（故障过程锚点）

```sql
SELECT * FROM CDC_JOB_FAILURE_EVENT
WHERE CLIENT_ID = :clientId
  AND DATA_SOURCE_ID = :dataSourceId
ORDER BY FAILURE_TIME DESC
FETCH FIRST 1 ROWS ONLY;
```

注意：Oracle 12c+ 支持 `FETCH FIRST`。如项目兼容更早版本，可用 `ROWNUM`。

#### SQL-2b: 追溯整个故障过程的所有事件

已有上一步的最近事件后，按第 3.2 节算法在 Java 中反向追踪：

```
1. 取最近事件的 FAILED_JOB_ID
2. 查询 NEW_JOB_ID 匹配该 FAILED_JOB_ID 的事件 (前行事件)
3. 递归直到无匹配（即到达链首）
4. 再从链首正向追索所有后续事件
```

对应的批量 SQL：

```sql
-- 正向：通过 NEW_JOB_ID 查后续事件
SELECT * FROM CDC_JOB_FAILURE_EVENT
WHERE CLIENT_ID = :clientId
  AND DATA_SOURCE_ID = :dataSourceId
  AND FAILED_JOB_ID IN (:newJobIdList);
```

```sql
-- 反向：查 FAILED_JOB_ID 被哪些 NEW_JOB_ID 匹配
SELECT DISTINCT e.*
FROM CDC_JOB_FAILURE_EVENT e
JOIN CDC_JOB_FAILURE_HANDLE_LOG l ON l.FAILURE_EVENT_ID = e.ID
WHERE e.CLIENT_ID = :clientId
  AND e.DATA_SOURCE_ID = :dataSourceId
  AND l.NEW_JOB_ID = :failedJobId;
```

#### SQL-2c: 批量获取所有事件的处理日志

```sql
SELECT * FROM CDC_JOB_FAILURE_HANDLE_LOG
WHERE FAILURE_EVENT_ID IN (:eventIds)
ORDER BY HANDLE_TIME ASC, ID ASC;
```

#### SQL-2d: 获取数据源基本信息

```sql
SELECT d.DATA_SOURCE_ID, d.DATA_SOURCE_NAME, d.DATA_SOURCE_ORG
FROM CDC_DATA_SOURCE d
WHERE d.DATA_SOURCE_ID = :dataSourceId;
```

#### SQL-2e: 补全客户端信息

```sql
SELECT CLIENT_ID, CLIENT_DESC FROM CDC_CLIENT_MULTIPLE
WHERE CLIENT_ID = :clientId;
```

#### Java 组装路径

```
1. 查最近事件 (SQL-2a) → 确定链尾
2. 反向追踪找链首 → 正向展开完整故障过程 (SQL-2b, 最多 2-3 轮)
3. 批量查所有日志 (SQL-2c)
4. 查数据源名称 (SQL-2d)
5. 查客户端描述 (SQL-2e)
6. Service 层组装 LatestFaultResponse：
   - FaultSummary (第一层 5 列，第二层 4 列)
   - JobChain (物理 Job 演变链)
   - EventCard[] (按时间倒序展示)
   - 每个 EventCard 的处理时间线
   - AnomalySummary (如存在异常链)
```

**无 N+1 验证**: 步骤 1-5 各 1 次查询，共 5 次。步骤 2 的反向追踪最多 2-3 轮，每轮 1 次批量查询。

---

### 2.3 API-3: 历史故障摘要

#### 查询概览

时间范围过滤 + 未闭环强制置顶 + 最大数量保护。

#### SQL-3a: 获取所有故障过程的首事件（作为摘要）

```sql
-- 先获取所有事件及其 NEW_JOB_ID 被匹配的情况
-- 用于判定故障过程边界
SELECT
    e.ID,
    e.CLIENT_ID,
    e.DATA_SOURCE_ID,
    e.FAILED_JOB_ID,
    e.FAILURE_TIME,
    e.EVENT_RESULT,
    e.CREATED_AT
FROM CDC_JOB_FAILURE_EVENT e
WHERE e.CLIENT_ID = :clientId
  AND e.DATA_SOURCE_ID = :dataSourceId
ORDER BY e.FAILURE_TIME DESC;
```

```sql
-- 获取所有事件的 NEW_JOB_ID 映射（用于判定链连接）
SELECT l.FAILURE_EVENT_ID, l.NEW_JOB_ID
FROM CDC_JOB_FAILURE_HANDLE_LOG l
WHERE l.FAILURE_EVENT_ID IN (:eventIds)
  AND l.NEW_JOB_ID IS NOT NULL;
```

#### SQL-3b: 获取每个故障过程最新日志（判定是否闭环）

```sql
SELECT
    l.FAILURE_EVENT_ID,
    l.HANDLE_STAGE,
    l.HANDLE_TIME,
    l.NEW_JOB_ID,
    l.ATTEMPT_NO,
    l.RESTART_COUNT_TOTAL
FROM CDC_JOB_FAILURE_HANDLE_LOG l
WHERE l.FAILURE_EVENT_ID IN (:eventIds)
ORDER BY l.HANDLE_TIME DESC, l.ID DESC;
```

Java 中对每个事件取第一条日志作为"最新日志"。

#### Java 组装路径

```
1. 查该逻辑 Job 所有事件 (SQL-3a)
2. 查所有 NEW_JOB_ID 映射 (SQL-3b)
3. 在内存中按 FaultProcessGrouper 算法构建故障过程列表
4. 应用时间范围过滤（默认 1d，可选 1w/1m）
5. 未闭环过程不受时间范围限制，始终置顶
6. 截断到 maxFaults（默认 50）
7. 统计每个故障过程的失败事件数、重启次数
8. 组装 HistoryResponse：
   - unclosedFaults[] (置顶)
   - closedFaults[] (按首次失败时间倒序)
   - truncated: boolean
```

**无 N+1 验证**: 步骤 1-2 各 1 次查询，共 2 次。

---

### 2.4 API-4: 指定故障详情

#### 查询

复用 API-2 的 SQL-2b、SQL-2c、SQL-2d，但使用 `faultRootId` 定位故障过程。

```sql
-- 以 faultRootId 为首事件，正向展开故障过程
-- Step 1: 获取首事件
SELECT * FROM CDC_JOB_FAILURE_EVENT WHERE ID = :faultRootId;

-- Step 2: 从首事件正向追踪（同 API-2 的 SQL-2b）
SELECT * FROM CDC_JOB_FAILURE_EVENT
WHERE CLIENT_ID = :clientId
  AND DATA_SOURCE_ID = :dataSourceId
  AND FAILED_JOB_ID IN (:newJobIdList);
```

#### Java 组装

与 API-2 完全复用，仅入口从"找最近事件"变为"以指定 eventId 为首事件"。响应结构相同，仅标题从"最近一次故障"改为"故障详情 (#faultRootId)"。

---

### 2.5 API-5: 大字段详情

#### SQL

```sql
-- 失败事件 CLOB
SELECT ID, FAILURE_DETAIL FROM CDC_JOB_FAILURE_EVENT WHERE ID = :eventId;

-- 处理日志 CLOB
SELECT ID, ERROR_DETAIL FROM CDC_JOB_FAILURE_HANDLE_LOG WHERE ID = :logId;
```

#### Java 处理

```java
// ClobService.java 伪代码
public ClobDetailResponse getClobDetail(Long recordId, String fieldType) {
    // 白名单校验
    if (!ALLOWED_FIELDS.contains(fieldType)) {
        throw new BusinessException("不支持的大字段类型");
    }
    // FAILURE_DETAIL
    if ("FAILURE_DETAIL".equals(fieldType)) {
        CdcJobFailureEvent event = eventMapper.selectById(recordId);
        return new ClobDetailResponse(event.getId(), "FAILURE_DETAIL",
                event.getFailureDetail(), event.getFailureDetail().length());
    }
    // ERROR_DETAIL
    if ("ERROR_DETAIL".equals(fieldType)) {
        CdcJobFailureHandleLog log = logMapper.selectById(recordId);
        return new ClobDetailResponse(log.getId(), "ERROR_DETAIL",
                log.getErrorDetail(),
                log.getErrorDetail() != null ? log.getErrorDetail().length() : 0);
    }
}
```

**允许的大字段白名单**: `FAILURE_DETAIL`, `ERROR_DETAIL`。前端不可传入任意表名或列名。

---

## 3. Oracle 方言注意事项

### 3.1 分页与行限制

Oracle 12c+ 支持:
```sql
FETCH FIRST 50 ROWS ONLY
```

如项目目标环境为 Oracle 12c 以下，回退到:
```sql
SELECT * FROM (SELECT a.*, ROWNUM rn FROM (...) a WHERE ROWNUM <= 50) WHERE rn > 0
```

### 3.2 时间类型

Oracle DATE 精确到秒。`SYSDATE - 1` 表示 24 小时前。使用 JDBC 参数化查询:

```java
// 最近一天的过滤
Timestamp oneDayAgo = Timestamp.from(Instant.now().minus(1, ChronoUnit.DAYS));
PreparedStatement ps = conn.prepareStatement("... WHERE FAILURE_TIME >= ?");
ps.setTimestamp(1, oneDayAgo);
```

### 3.3 CLOB 读取

MyBatis-Plus 自动映射 CLOB → String。需确认 JDBC 驱动版本支持。
如遇到大 CLOB (>4KB)，考虑在 Mapper 中使用 `@Select` + `ResultHandler` 流式读取。

---

## 4. 索引设计

### 4.1 现有索引

| 表 | 索引 | 列 | 类型 |
|----|------|-----|------|
| CDC_JOB_FAILURE_EVENT | PK_CDC_JOB_FAILURE_EVENT | ID | 主键 |
| CDC_JOB_FAILURE_HANDLE_LOG | PK_CDC_JOB_FAILURE_HANDLE_LOG | ID | 主键 |

仅主键 + LOB 索引。**两表均无业务索引。**

### 4.2 建议索引清单

#### IDX-01: 事件表 — 按逻辑 Job 查询（必须）

```sql
CREATE INDEX IDX_FEVT_CLIENT_DS
ON CDC_JOB_FAILURE_EVENT (CLIENT_ID, DATA_SOURCE_ID, FAILURE_TIME DESC);
```

| 维度 | 说明 |
|------|------|
| 支撑接口 | API-1, API-2, API-3, API-4 |
| 支撑 SQL | SQL-1a, SQL-2a, SQL-3a |
| 选择性 | 高（(CLIENT_ID, DATA_SOURCE_ID) 对唯一确定逻辑 Job） |
| 与现有索引重复 | 否 |
| 写入影响 | 低（失败事件写入频率远低于查询频率） |
| 空间影响 | 低（当前 1 条，未来预期单日 <100 条） |
| 优先级 | **必须** |

#### IDX-02: 日志表 — 按事件关联查询（必须）

```sql
CREATE INDEX IDX_FHDL_EVENT_ID
ON CDC_JOB_FAILURE_HANDLE_LOG (FAILURE_EVENT_ID, HANDLE_TIME, ID);
```

| 维度 | 说明 |
|------|------|
| 支撑接口 | API-2, API-3, API-4 |
| 支撑 SQL | SQL-2c, SQL-3b |
| 选择性 | 高（每个事件平均 3-5 条日志） |
| 与现有索引重复 | 否 |
| 写入影响 | 低 |
| 空间影响 | 低 |
| 优先级 | **必须** |

#### IDX-03: 日志表 — NEW_JOB_ID 查询（建议）

```sql
CREATE INDEX IDX_FHDL_NEW_JOB_ID
ON CDC_JOB_FAILURE_HANDLE_LOG (NEW_JOB_ID, FAILURE_EVENT_ID);
```

| 维度 | 说明 |
|------|------|
| 支撑接口 | API-2, API-4 |
| 支撑 SQL | SQL-2b（反向追踪） |
| 选择性 | 中等（仅部分日志有 NEW_JOB_ID） |
| 与现有索引重复 | 否 |
| 写入影响 | 低 |
| 空间影响 | 低 |
| 优先级 | **建议**（数据量增长后必要） |

#### IDX-04: 事件表 — CLIENT_ID 单独索引（暂缓）

不推荐。当前数据量下 IDX-01 已覆盖 CLIENT_ID 前缀查询。若未来出现仅按 CLIENT_ID 查询的场景，再考虑单列索引。

#### IDX-05: 事件表 — FAILURE_TIME 索引（暂缓）

不推荐。事件量极小且主要查询由 (CLIENT_ID, DATA_SOURCE_ID) 驱动。若未来出现按时间范围跨客户端查询的需求，再考虑。

### 4.3 索引执行优先级

| 顺序 | 索引 | 何时执行 |
|------|------|---------|
| 1 | IDX-01 (事件表逻辑Job查询) | 后端开发启动前 |
| 2 | IDX-02 (日志表关联) | 后端开发启动前 |
| 3 | IDX-03 (NEW_JOB_ID) | 数据量 > 100 事件时或后端联调阶段 |

### 4.4 不建议的操作

- **函数索引**（如 `LOWER(CLIENT_ID)` 或 `TRUNC(FAILURE_TIME)`）：不需要。CLIENT_ID 已精确匹配，FAILURE_TIME 使用 JDBC 参数化查询
- **分区表**：当前数据量不满足分区前提（通常 > 百万行）
- **额外的 NOT NULL 约束**：表结构已定义
- **复合索引中的冗余列**：以上建议已考虑前缀选择性

---

## 5. SQL 验证记录

### 5.1 已执行只读验证

| SQL 模式 | 验证结果 | 备注 |
|----------|---------|------|
| 全事件 COUNT(*) | 通过 (1 row) | SQL-1a 等价查询 |
| 全日志 COUNT(*) | 通过 (5 rows) | SQL-2c 等价查询 |
| 事件按 CLIENT_ID+DATA_SOURCE_ID 分组 | 通过 | SQL-1a 逻辑验证 |
| 日志 JOIN 事件 | 通过 (5 rows) | SQL-2c 逻辑验证 |
| NEW_JOB_ID 查后续事件 | 通过 (0 rows, 仅 1 事件) | SQL-2b 逻辑验证 |
| CDC_DATA_SOURCE 匹配 | 通过 (my-19c → oracle-业务库33) | SQL-2d 逻辑验证 |
| 时间范围查询 | 通过 | `FAILURE_TIME >= SYSDATE - 1` 逻辑验证 |

### 5.2 未验证项（数据不足）

- 多事件故障过程的链追踪（待数据增长）
- 异常链检测（当前无异常数据）
- 大 CLOB 读取性能（当前 10,929 字符，在正常范围）

---

> 本次仅设计 SQL 和索引建议，未执行任何建索引语句或 DDL。
