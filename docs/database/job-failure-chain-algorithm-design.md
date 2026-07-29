# Job 故障恢复——故障链算法设计

> 任务编号：045 阶段 B
> 设计日期：2026-07-29
> 依据：真实 DDL、样例数据、页面规格 v1.2（044 冻结版）

---

## 1. 执行摘要

本文档定义以下核心算法的完整判定规则和实现路径：

1. **故障过程识别**：如何将多条 CDC_JOB_FAILURE_EVENT 归并为同一次故障过程
2. **物理 Job 演变链构建**：如何追溯 FAILED_JOB_ID → NEW_JOB_ID 关系
3. **Job 当前状态计算**：2 种状态（正常 / 恢复中）
4. **故障过程状态计算**：5 种状态（已恢复 / 等待重启 / 重启中 / 恢复失败 / 流程异常）
5. **异常链检测**：分叉、断链、环、多父节点、重复边
6. **faultRootId 方案**：稳定的故障过程唯一标识
7. **时间与统计字段计算**：首次失败时间、最近处理时间、最终恢复时间、持续时间、失败事件数、重启次数

**核心理念：数据库查询基础数据，Java 内存组装故障链和状态。**

---

## 2. 核心数据结构定义

### 2.1 逻辑 Job

```
逻辑 Job = (CLIENT_ID, DATA_SOURCE_ID)
```

由两个字段联合唯一确定，对应 ZK 路径 `/bsoft-cdc/clients/{CLIENT_ID}/jobs/{DATA_SOURCE_ID}`。

### 2.2 一次完整故障过程

一次故障过程由同属于一个逻辑 Job 的、按时间相邻的失败事件组成的**连通图**。

定义：同一逻辑 Job 下，通过 `NEW_JOB_ID` → `FAILED_JOB_ID` 关系可达的所有 CDC_JOB_FAILURE_EVENT 记录，构成一次故障过程。

**起点判定**：
- 某条事件的 `FAILED_JOB_ID` 在前序事件中从未作为 `NEW_JOB_ID` 出现过
- 即该事件不是任何已知事件重启后的产物

**终点判定**：
- 存在 `HANDLE_STAGE = STABLE_CHECK_PASSED` 的处理日志 → **已闭环**
- 不存在 STABLE_CHECK_PASSED → **未闭环**（仍在进行中）

### 2.3 物理 Job 演变链

```
初始物理 Job → 后续物理 Job → 当前/最终物理 Job
```

- **初始物理 Job ID**：故障过程中第一个失败事件的 FAILED_JOB_ID
- **中间物理 Job ID**：每个事件的 FAILED_JOB_ID，以及日志中的 NEW_JOB_ID
- **当前/最终物理 Job ID**：
  - 未闭环：最新事件的日志中最新的 NEW_JOB_ID
  - 已闭环：最后一个 STABLE_CHECK_PASSED 日志中的 NEW_JOB_ID

---

## 3. 故障过程归并算法（FaultProcessGrouper）

### 3.1 输入

指定逻辑 Job `(CLIENT_ID, DATA_SOURCE_ID)` 下的所有 CDC_JOB_FAILURE_EVENT，按 FAILURE_TIME ASC 排序。

### 3.2 算法步骤

```
Step 1: 构建 NEW_JOB_ID → FAILED_JOB_ID 反向索引
        遍历所有事件的所有处理日志，收集 (NEW_JOB_ID, EVENT_ID) 映射

Step 2: 从最早事件开始 BFS/DFS 构建连通子图
        对每个事件：
          - 如果 FAILED_JOB_ID 匹配到某个 NEW_JOB_ID，则属于同一故障过程的后续节点
          - 如果 FAILED_JOB_ID 未匹配到任何 NEW_JOB_ID，则是新故障过程的起点

Step 3: 每个连通子图 = 一次故障过程
        按 FAILURE_TIME ASC 对子图内事件排序

Step 4: 每个故障过程的 rootEvent = 子图中最早的事件
        faultRootId = rootEvent.ID（见第 8 节）
```

### 3.3 复杂度分析

- **时间复杂度**: O(E + V)，其中 E = 事件数，V = NEW_JOB_ID 边数
- **空间复杂度**: O(E)，存储反向索引
- **最坏场景**: 每个事件都是独立的故障过程（没有 NEW_JOB_ID 匹配）

### 3.4 通用性说明

当前真实数据仅 1 条事件（单节点连通图），算法基于字段约束和业务语义推演。**多事件串联、分叉等场景的算法通行性已通过逻辑推演验证，待实际数据出现后进行回归确认。**

---

## 4. 物理 Job 演变链构建算法（JobChainBuilder）

### 4.1 输入

一次故障过程中的所有事件（按 FAILURE_TIME ASC）及其所有处理日志。

### 4.2 算法步骤

```
Step 1: 收集链节
        遍历每个事件的每条日志（按 HANDLE_TIME ASC, ID ASC）：
          - 如果 FAILED_JOB_ID 尚未出现在链中，追加到链
          - 遍历过程中首次出现的 NEW_JOB_ID，追加到链
  
Step 2: 标记当前/最终节点
        - 如果故障已闭环：最后一个 NEW_JOB_ID（来自 STABLE_CHECK_PASSED）标记为 "当前"
        - 如果故障未闭环：最新的 NEW_JOB_ID 或最后的 FAILED_JOB_ID 标记为 "当前"
  
Step 3: 检测边异常（见第 6 节）
```

### 4.3 输出

```
[初始JobID] → [中间JobID_1] → ... → [当前/最终JobID]
```

每个节点包含：
- `jobId`: 物理 Job ID
- `type`: INITIAL / INTERMEDIATE / CURRENT / FINAL
- `anomaly`: 是否存在关联异常

---

## 5. 状态计算规则

### 5.1 Job 当前状态（2 种，页面顶层展示）

| 最近故障过程状态 | Job 当前状态 | 说明 |
|-----------------|------------|------|
| 已恢复 | **正常** | 当前不存在未闭环故障过程 |
| 等待重启 | **恢复中** | |
| 重启中 | **恢复中** | |
| 恢复失败 | **恢复中** | |
| 流程异常 | **恢复中** | |
| 无故障记录 | **正常** | 仅表示没有未闭环故障，不证明 Job 在运行 |

**计算入口**: `JobStatusResolver.resolve(faultProcesses)`

```
// 伪代码
if (faultProcesses.isEmpty()) return NORMAL;
if (faultProcesses.stream().allMatch(fp -> fp.status == RECOVERED)) return NORMAL;
return RECOVERING;
```

注意：
- 同一逻辑 Job 出现多个未闭环故障过程 → 显示"恢复中"，前端附加数据异常提示
- "正常"不等于已验证物理 Job 正在运行

### 5.2 故障过程状态（5 种，故障过程层面）

每种状态给出可执行的**字段级判定条件**：

#### 已恢复 (RECOVERED)

判定条件（全部满足）：
1. 故障过程中存在 `HANDLE_STAGE = STABLE_CHECK_PASSED` 的日志
2. 该日志的 HANDLE_TIME 是所有处理日志中的最晚时间
3. 后续没有新的失败事件（同一逻辑 Job 没有 FAILURE_TIME > STABLE_CHECK_PASSED 的 HANDLE_TIME 的事件）

#### 等待重启 (WAITING_RESTART)

判定条件（全部满足）：
1. 不存在 STABLE_CHECK_PASSED
2. 最新事件的处理日志最后一条 `HANDLE_STAGE` 是以下之一：
   - `JOB_FAILURE_RECEIVED`
   - `RESTART_SCHEDULED`
3. 如果 `RESTART_SCHEDULED` 的 `NEXT_RESTART_TIME` 已经过去，仍判定为等待重启（超时交由前端展示）

#### 重启中 (RESTARTING)

判定条件（全部满足）：
1. 不存在 STABLE_CHECK_PASSED
2. 最新事件的处理日志最后一条 `HANDLE_STAGE` 是以下之一：
   - `RESTART_STARTED`
   - `NEW_JOB_SUBMIT_SUCCEEDED`
3. 之后没有新的失败事件

注意：`NEW_JOB_SUBMIT_SUCCEEDED` 后，新 Job 仍需通过稳定检查才算恢复。

#### 恢复失败 (RECOVERY_FAILED)

判定条件（任一满足）：
1. 最新事件的处理日志中存在 `HANDLE_STAGE = NEW_JOB_SUBMIT_FAILED`
2. 最新事件的处理日志中存在 `SCHEDULED_RESTART_SKIPPED`
3. 最新事件被 `IGNORED`（EVENT_RESULT = IGNORED_*）

#### 流程异常 (ABNORMAL)

判定条件（任一满足）：
1. 同一逻辑 Job 存在多个未闭环故障过程
2. 异常链检测发现分叉、断链、环或多父节点（见第 6 节）
3. 时间倒置（FAILURE_TIME > 下一条日志的 HANDLE_TIME）
4. 数据缺失导致无法判定其他状态

**状态优先级**: 流程异常 > 恢复失败 > 重启中 > 等待重启 > 已恢复

当多个条件同时满足时，取优先级最高的状态。

---

## 6. 异常链检测算法（AnomalyDetector）

### 6.1 检测项

| 异常类型 | 定义 | 检测方法 | 前端展示 |
|----------|------|---------|---------|
| **分叉** | 一个 NEW_JOB_ID 匹配到 2+ 条事件 | GROUP BY NEW_JOB_ID, COUNT(*) >= 2 | "异常链"标签 + 红色左边框 |
| **多父节点** | 一个 FAILED_JOB_ID 匹配到 2+ 个 NEW_JOB_ID | 同一事件的 FAILED_JOB_ID 被多条日志的 NEW_JOB_ID 指向 | "异常链"标签 |
| **断链** | FAILED_JOB_ID 在前序事件中无匹配的 NEW_JOB_ID（非首节点） | 链中非首节点的 FAILED_JOB_ID 不在前驱 NEW_JOB_ID 集合中 | "检测到物理 Job 连接断开" |
| **环** | Job ID 链形成闭环 | 遍历时检测到已访问节点 | "检测到物理 Job ID 循环" |
| **重复边** | 同一个 (FAILED_JOB_ID, NEW_JOB_ID) 出现多次 | 边集合去重检测 | 不影响展示，仅日志记录 |
| **孤立处理日志** | 日志的 FAILURE_EVENT_ID 不存在 | NOT EXISTS 查询 | 忽略该日志，不影响故障判定 |

### 6.2 分叉处理策略

当 `NEW_JOB_ID` 匹配到多个后续事件时：
- 取最早的后续事件作为主链
- 分支事件保留可见，但在异常摘要中标注
- 分支事件本身归属为独立的故障过程（异常链标记）或被关联到主故障过程

### 6.3 异常链导致的页面展示

- 异常事件卡片：红色 3px 左边框
- 卡片摘要区：红色"异常链"标签
- 展开卡片：显示"检测到物理 Job 分叉：该新 Job ID 匹配到 N 个后续失败事件"及"查看异常详情"入口
- 异常链事件默认展开
- **不将整张卡片染成大面积深红色**

---

## 7. 时间与统计计算

### 7.1 时间字段

| 字段 | 计算规则 | 缺失回退 |
|------|----------|---------|
| **首次失败时间** | 故障过程中最早事件的 FAILURE_TIME | 不可缺失（NOT NULL 字段） |
| **最近处理时间** | MAX(该故障过程所有日志的 HANDLE_TIME) | 回退到 CREATED_AT |
| **最终恢复时间** | 故障闭环时 STABLE_CHECK_PASSED 日志的 HANDLE_TIME | 未闭环时显示 `--` |
| **已闭环持续时间** | 最终恢复时间 - 首次失败时间 | — |
| **未闭环持续时间** | NOW() - 首次失败时间 | — |

### 7.2 统计字段

| 字段 | 计算规则 | 数据来源 |
|------|----------|---------|
| **失败事件数** | COUNT(故障过程中事件的 ID) | CDC_JOB_FAILURE_EVENT |
| **重启次数** | COUNT(DISTINCT 日志中 ATTEMPT_NO > 0 的记录) 或 最新日志的 RESTART_COUNT_TOTAL | CDC_JOB_FAILURE_HANDLE_LOG |

注意：**失败事件数与重启次数不一定相等**。每次失败可能触发或不触发重启（取决于 EventResult），单次重启可能覆盖多条处理日志。

### 7.3 前端展示规则

- 时间缺失或结果为负 → 显示 `--`
- 未闭环故障的持续时间 → 显示动态时长 + 标注"持续中"
- 时间尚未产生 → 统一显示 `--`

### 7.4 时区约定

| 层级 | 时区 | 说明 |
|------|------|------|
| Oracle DATE | 无时区 | 精确到秒 |
| JDBC 读取 | JVM 默认时区 (Asia/Shanghai) | JDBC 驱动按会话时区转换 |
| 后端存储（DTO） | `java.util.Date` / `java.time.LocalDateTime` | 建议统一使用 LocalDateTime + 约定时区 |
| 前端展示 | Asia/Shanghai | `yyyy-MM-dd HH:mm:ss` |

---

## 8. faultRootId 方案

### 8.1 当前情况

数据库**没有**现成的"故障过程根标识"字段。`ID` 是程序 ID 生成器生成的 NUMBER(19)，每行唯一，不具备故障过程分组语义。

### 8.2 推荐方案

**使用首次失败事件的主键 ID 作为 faultRootId。**

```
faultRootId = 故障过程中 FAILURE_TIME 最早的事件的 ID
```

### 8.3 稳定性分析

| 场景 | 稳定性 | 说明 |
|------|--------|------|
| 已有事件继续触发后续失败 | **稳定** | 事件 ID 不变，faultRootId 不变 |
| 新的重启链开始 | **生成新 faultRootId** | 新分支产生新的首个事件 ID |
| 数据归档或分表 | **可能变化** | 若改用其他 ID 生成策略需重新评估 |
| 跨库或跨环境 | **不保证** | faultRootId 仅在同一数据库实例内有效 |

### 8.4 替代方案（不推荐，列为备选）

- **组合标识**: `CLIENT_ID + DATA_SOURCE_ID + FIRST_FAILURE_TIME` — 可读性好但并发写入时可能不唯一
- **新增字段**: ROOT_FAILURE_ID — 需要 ALTER TABLE，不在当前范围内

### 8.5 结论

**推荐 faultRootId = 首次失败事件 ID**。无需新增字段，稳定且唯一。URL 示例：

```
/monitor/job-failure/{clientId}/{dataSourceId}/fault/{faultRootId}
```

---

## 9. 真实案例验证

### 9.1 案例 1：单次失败后恢复（已闭环）★ 真实数据

| 属性 | 值 |
|------|-----|
| **数据来源** | 真实（唯一记录） |
| **faultRootId** | 3400900000000000001 |
| **CLIENT_ID** | hosp-006 |
| **DATA_SOURCE_ID** | my-19c |
| **事件数** | 1 |
| **日志数** | 5 |
| **重启次数** | 1 (ATTEMPT_NO=1) |
| **失败事件数** | 1 |
| **故障过程状态** | 已恢复 |
| **Job 当前状态** | 正常 |
| **首次失败时间** | 2026-07-27 19:17:24 |
| **最终恢复时间** | 2026-07-27 19:23:44 |
| **最近处理时间** | 2026-07-27 19:23:44 |
| **持续时间** | 6 分 20 秒 |
| **物理 Job 演变链** | 783e7f54... → 1d45cf72... |
| **初始 Job ID** | 783e7f54d0c2420e8b54add510a0f1c7 |
| **最终 Job ID** | 1d45cf72cad04153b9c81409038561d0 |
| **异常链** | 无 |
| **验证状态** | 通过 |

关联路径：
```
EVENT(ID=3400900...) 
  → LOG(JOB_FAILURE_RECEIVED, 19:17:43, HANDLE_LOG_ID=...)
  → LOG(RESTART_SCHEDULED, 19:17:43, ATTEMPT_NO=1, DELAY=60s)
  → LOG(RESTART_STARTED, 19:18:43, ATTEMPT_NO=1)
  → LOG(NEW_JOB_SUBMIT_SUCCEEDED, 19:18:44, NEW_JOB_ID=1d45cf72...)
  → LOG(STABLE_CHECK_PASSED, 19:23:44, NEW_JOB_ID=1d45cf72...)
```

### 9.2 案例 2：多次失败后恢复（已闭环）★ 构造案例

| 属性 | 值 |
|------|-----|
| **数据来源** | 构造（基于现有字段枚举和业务逻辑推演） |
| **faultRootId** | 由首次事件的 ID 决定 |
| **CLIENT_ID** | hosp-002 |
| **DATA_SOURCE_ID** | db-his-01 |
| **事件数** | 3 |
| **重启次数** | 2 |
| **失败事件数** | 3 |
| **故障过程状态** | 已恢复 |
| **首次失败时间** | Event#1.FAILURE_TIME |
| **最终恢复时间** | Event#3 的 STABLE_CHECK_PASSED.HANDLE_TIME |
| **物理 Job 演变链** | Job A → Job B → Job C → Job D (最终) |
| **异常链** | 无 |
| **验证状态** | 构造验证，逻辑通过 |

关联路径：
```
Event#1(FAILED_JOB_ID=A, EVENT_RESULT=ACCEPTED)
  → LOG(NEW_JOB_ID=B, NEW_JOB_SUBMIT_SUCCEEDED)
Event#2(FAILED_JOB_ID=B)  ← NEW_JOB_ID=B from Event#1 匹配
  → LOG(NEW_JOB_ID=C, NEW_JOB_SUBMIT_SUCCEEDED)
Event#3(FAILED_JOB_ID=C)  ← NEW_JOB_ID=C from Event#2 匹配
  → LOG(NEW_JOB_ID=D, NEW_JOB_SUBMIT_SUCCEEDED)
  → LOG(STABLE_CHECK_PASSED, NEW_JOB_ID=D)
```

### 9.3 案例 3：等待重启（未闭环）★ 构造案例

| 属性 | 值 |
|------|-----|
| **数据来源** | 构造 |
| **事件数** | 1 |
| **日志数** | 1（仅 JOB_FAILURE_RECEIVED） |
| **故障过程状态** | 等待重启 |
| **Job 当前状态** | 恢复中 |
| **最终恢复时间** | `--` |
| **持续时间** | 动态（持续中） |
| **验证状态** | 构造验证，逻辑通过 |

### 9.4 案例 4：异常链——分叉（如真实数据不存在）★ 构造案例

| 属性 | 值 |
|------|-----|
| **数据来源** | 构造 |
| **检测到** | NEW_JOB_ID=X 匹配到 Event#2 和 Event#3 两个后续失败事件 |
| **故障过程状态** | 流程异常 |
| **异常链标签** | 显示 |
| **前端展示** | "检测到物理 Job 分叉：新 Job ID X 匹配到 2 个后续失败事件" |
| **验证状态** | 构造验证，逻辑通过 |

### 9.5 边界案例：无故障记录

| 属性 | 值 |
|------|-----|
| **CLIENT_ID + DATA_SOURCE_ID** | 在 RUN_STATE 中存在但在 EVENT 中无记录 |
| **Job 当前状态** | 正常（无故障记录） |
| **页面展示** | 数据源正常，无故障恢复历史 |
| **注意** | "正常"仅表示不存在未闭环故障，不等于已验证物理 Job 运行 |

---

## 10. 边界与降级规则

### 10.1 数据缺失降级

| 缺失项 | 降级规则 |
|--------|---------|
| 日志表 HANDLE_TIME 为空 | 该日志条目跳过，不影响其他条目 |
| 事件表 FAILURE_DETAIL 为空 | 详情页显示"无异常详情" |
| 日志表 ERROR_DETAIL 为空 | 正常（大部分日志无错误） |
| CLOB 字段不存在 | 返回 null，前端显示"暂无信息" |
| CDC_DATA_SOURCE 中无匹配数据源 | DATA_SOURCE_NAME 显示 DATA_SOURCE_ID 本身 |
| CDC_CLIENT_MULTIPLE 中无匹配客户端 | CLIENT_ID 直接显示 |

### 10.2 时间异常降级

| 异常 | 处理 |
|------|------|
| FAILURE_TIME > 某条日志 HANDLE_TIME | 时间线仍按 HANDLE_TIME 排列，标记时间水印 |
| 持续时间计算结果为负 | 显示 `--`，且判定为流程异常 |
| CREATED_AT 晚于预期 | 不影响业务计算，仅作为记录时间显示 |

### 10.3 最大数量保护

历史故障过程最大返回数量:
- 默认值: 50（可配置 `cdc.job-failure.history-max-faults=50`）
- 超出时: 返回 truncated=true，前端提示"仅显示最近 50 次故障过程"

---

> 本文档中的构造案例已明确标注。未构造任何示例数据冒充真实数据库数据。
