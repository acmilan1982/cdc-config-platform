# Job 故障恢复——待确认问题清单

> 任务编号：045 阶段 B
> 分析日期：2026-07-29
> 原则：只记录无法从真实结构和数据得出结论、且会影响开发的问题

---

## Q1: 多事件故障过程场景暂无法用真实数据验证

### 问题

当前开发库仅 1 条 CDC_JOB_FAILURE_EVENT + 5 条 CDC_JOB_FAILURE_HANDLE_LOG，均为同一次单事件恢复流程。以下场景的算法通行性已通过字段约束和业务语义完成逻辑推演，但**缺少真实多事件数据回归验证**：

- 多事件串联故障过程（FAILED_JOB_ID → NEW_JOB_ID 链长 > 1）
- 分叉、多父节点、环、断链等异常链
- 同一逻辑 Job 存在多个未闭环故障过程
- ATTEMPT_NO > 1 的重试场景
- RESTART_COUNT_TOTAL 跨事件累计

### 影响

- 算法设计文档中的构造案例（案例 2-4）逻辑自洽，但实际数据中可能存在未预见的边界
- FaultProcessGrouper 基于 BFS/DFS 连通子图，在真实多边场景下是否正确归并待确认

### 可选方案

| 方案 | 说明 |
|------|------|
| A: 等待生产数据自然积累 | 不阻塞开发，在集成测试阶段用真实数据回归 |
| B: 手工插入测试数据 | 需 DBA 审批 INSERT 权限，可精确覆盖边界场景 |
| C: 单元测试 + 构造数据集 | Service 层算法用纯 Java 单元测试覆盖，不依赖数据库 |

### Agent 推荐

**A + C 组合**。Service 层算法设计为纯 Java POJO（FaultProcessGrouper、JobChainBuilder、AnomalyDetector），可以用构造的 List<Event> 和 List<Log> 进行完整单元测试覆盖，不依赖数据库。开发完成后，待生产数据积累（预计上线 1-2 周内会出现多事件场景），再进行真实数据回归。方案 B 可作为备选，当开发联调阶段仍无多事件数据时再申请。

---

## Q2: 重启次数统计口径——RESTART_COUNT_TOTAL vs COUNT(DISTINCT ATTEMPT_NO)

### 问题

重启次数有两种可能的统计口径：

| 口径 | 数据来源 | 说明 |
|------|----------|------|
| RESTART_COUNT_TOTAL | 日志表字段，NUMBER(19) | 当前值 = 1，理论上跨事件累计 |
| COUNT(DISTINCT ATTEMPT_NO) | 日志表字段，NUMBER(10) | 当前值 = 1，同一事件内去重 |

当前数据两者一致（均为 1），无法判断：多事件故障过程中 RESTART_COUNT_TOTAL 是全局累计还是单事件累计，也无法判断失败事件数 ≠ 重启次数时（如 IGNORED 事件不触发重启）哪个口径更准确。

### 影响

- 页面历史列表和详情中的"重启次数"列
- 如果选择 RESTART_COUNT_TOTAL 但它是单事件累计，跨事件故障过程的重启次数会偏小

### 可选方案

| 方案 | 说明 |
|------|------|
| A: 优先取最新日志的 RESTART_COUNT_TOTAL | 假设后端每次重启都更新该字段为全局累计值 |
| B: 按故障过程计算 COUNT(DISTINCT ATTEMPT_NO) | 不依赖 RESTART_COUNT_TOTAL，完全由 Java 计算 |
| C: 两者都算，不一致时标记数据异常 | 增加复杂度，且当前数据无法测试不一致场景 |

### Agent 推荐

**B**。按故障过程内 COUNT(DISTINCT ATTEMPT_NO WHERE ATTEMPT_NO > 0) 计算。理由：
1. 不依赖 RESTART_COUNT_TOTAL 的语义假设
2. 失败事件数与重启次数不等的场景下更准确
3. 可在 Java 内存直接计算，不增加 SQL 复杂度
4. 如果后续确认 RESTART_COUNT_TOTAL 是可靠的全局累计值，可以切换为直接读取（性能更优）

---

## Q3: ATTEMPT_NO 和 NEW_JOB_ID 的可空性对状态判定的影响

### 问题

- ATTEMPT_NO 可为 NULL（当前 JOB_FAILURE_RECEIVED 阶段即为 NULL）
- NEW_JOB_ID 可为 NULL（当前仅 NEW_JOB_SUBMIT_SUCCEEDED 和 STABLE_CHECK_PASSED 有值）
- 某些 HANDLE_STAGE 可能不产生 NEW_JOB_ID（如 JOB_FAILURE_IGNORED_*、SCHEDULED_RESTART_SKIPPED、NEW_JOB_SUBMIT_FAILED）

### 影响

- JobChainBuilder 需要处理 NEW_JOB_ID = NULL 的日志条目（跳过而非报错）
- 重启次数统计需要排除 ATTEMPT_NO = NULL 的记录
- "当前物理 Job ID"的计算：如果最新日志没有 NEW_JOB_ID，需回退到 FAILED_JOB_ID

### 可选方案

| 方案 | 说明 |
|------|------|
| A: 所有算法对 NULL 做防御性处理 | 编码成本略高，但健壮 |
| B: 仅在已知可为 NULL 的阶段处理 | 风险：未来新增 HANDLE_STAGE 可能引入新的 NULL 场景 |

### Agent 推荐

**A**。所有涉及 ATTEMPT_NO、NEW_JOB_ID、RESTART_COUNT_TOTAL 的算法统一采用防御性处理：NULL 值跳过不参与计算，不抛异常。理由：HANDLE_STAGE 枚举共 10 个值，当前仅 5 个有数据，剩余 5 个的实际字段填充行为未知。

---

## Q4: 未观测到的 HANDLE_STAGE 枚举值的行为

### 问题

以下 5 个 HANDLE_STAGE 枚举值在当前数据中**从未出现**：

| HANDLE_STAGE | 触发条件 | 关键字段填充行为 |
|-------------|----------|----------------|
| JOB_FAILURE_IGNORED_INVALID | EVENT_RESULT = IGNORED_INVALID | 未知 |
| JOB_FAILURE_IGNORED_STALE | EVENT_RESULT = IGNORED_STALE | 未知 |
| DUPLICATED_EVENT_IGNORED | 重复事件 | 未知 |
| SCHEDULED_RESTART_SKIPPED | 跳过重启 | 未知 |
| NEW_JOB_SUBMIT_FAILED | 新 Job 提交失败 | 未知 |

### 影响

- 故障过程状态判定中"恢复失败"依赖 NEW_JOB_SUBMIT_FAILED 和 SCHEDULED_RESTART_SKIPPED
- 未知这些阶段是否会同时产生其他日志（如先 SCHEDULED 后 SKIPPED）
- 未知 IGNORED 事件是否会写入日志表以及写入哪些字段

### 可选方案

| 方案 | 说明 |
|------|------|
| A: 按字段注释和枚举语义设计判定逻辑 | 当前算法设计已采用此方案 |
| B: 在代码中构造这些场景触发真实数据 | 需要能控制 Flink Job 状态和回调 |
| C: 预留日志记录，上线后观察 | 在异常链检测中标记"未识别的 HANDLE_STAGE" |

### Agent 推荐

**A + C**。当前算法已按字段注释和枚举语义完成判定逻辑设计。同时建议在 AnomalyDetector 中增加一条规则：遇到算法设计文档中未列出的 HANDLE_STAGE 时，记录 WARN 日志但不中断流程，待线上观察后补充判定规则。

---

## Q5: CREATED_AT 的 DEFAULT null NOT NULL 语义

### 问题

两张表的 CREATED_AT 字段 DDL 均为：

```sql
CREATED_AT DATE DEFAULT null NOT NULL ENABLE
```

`DEFAULT null` + `NOT NULL` 是一个矛盾声明。实际数据中该字段有值（2026-07-27 19:18:41），说明应用层在 INSERT 时显式赋值。如果某条件 INSERT 语句未包含 CREATED_AT，Oracle 会报错（NOT NULL 约束违反），而不是使用 DEFAULT。

### 影响

- 对 Java 开发无实质影响（MyBatis-Plus 插入时会赋值）
- 如果未来有手工 SQL 插入或数据迁移，需注意显式赋值
- 不阻塞当前任务

### 可选方案

| 方案 | 说明 |
|------|------|
| A: 保持现状 | 应用层已正确处理，不修改 DDL |
| B: 修改为 DEFAULT SYSDATE NOT NULL | 更规范，但需要 ALTER TABLE（不在本轮范围） |

### Agent 推荐

**A**。当前行为对业务无影响，且 ALTER TABLE 超出本轮只读边界。可在独立 DDL 优化任务中与其他表结构改进一并处理。

---

## Q6: ERROR_DETAIL CLOB 始终为空

### 问题

当前 5 条处理日志的 ERROR_DETAIL 全部为空（NULL）。这意味着：
- API-5 的 ERROR_DETAIL 查询在当前数据下返回空
- 无法验证 CLOB 读取性能和序列化行为
- 无法确定 ERROR_DETAIL 的实际最大长度

### 影响

- 前端"错误详情"入口在当前数据下显示"暂无信息"
- FAILURE_DETAIL 已验证（10,929 字符），可作为 CLOB 读取性能参考
- 不阻塞开发，但联调时需关注

### 可选方案

| 方案 | 说明 |
|------|------|
| A: 复用 FAILURE_DETAIL 的 CLOB 读取逻辑 | 两者都是 CLOB，处理方式一致 |
| B: 等待生产环境 ERROR_DETAIL 出现后验证 | 不阻塞 |

### Agent 推荐

**A**。ERROR_DETAIL 和 FAILURE_DETAIL 使用相同的 ClobService 和白名单机制处理，无需特殊适配。前端在值为空时显示"暂无信息"即可。

---

## Q7: 客户端无故障记录时的 API-1 展示

### 问题

API-1（主页面汇总）需要展示所有活跃客户端的逻辑 Job 列表。当前 dev 库：
- CDC_JOB_FAILURE_EVENT 仅涉及 1 个客户端（hosp-006）
- CDC_CLIENT_MULTIPLE 有多个客户端
- CDC_DATA_SOURCE_RUN_STATE 有多个逻辑 Job

无故障记录的客户端/逻辑 Job 应显示"正常"状态，但需要确认：
- 活跃客户端列表的数据源是 CDC_CLIENT_MULTIPLE 还是 RUN_STATE？
- 逻辑 Job 列表是否包含已停止的数据源？

### 影响

- API-1 的 SQL-1d 需要明确数据源
- 页面可能展示大量"正常"的逻辑 Job

### 可选方案

| 方案 | 说明 |
|------|------|
| A: 以 RUN_STATE 为准 | 只展示当前在 RUN_STATE 中有记录的逻辑 Job |
| B: 以 CLIENT_MULTIPLE × DATA_SOURCE 笛卡尔积为准 | 可能展示已下线但未清理的配置 |

### Agent 推荐

**A**。以 CDC_DATA_SOURCE_RUN_STATE 中有记录的 (CLIENT_ID, DATA_SOURCE_ID) 作为逻辑 Job 全集。理由：RUN_STATE 反映 ZK 运行时状态，与"运行监控"的业务语义一致。该方案已在 API-1 的 SQL-1d 设计中采用。

---

## Q8: HANDLE_TIME 重复时的稳定排序

### 问题

真实数据中 JOB_FAILURE_RECEIVED 和 RESTART_SCHEDULED 的 HANDLE_TIME 完全相同（均为 2026-07-27 19:17:43）。Oracle DATE 精确到秒，同一秒内多次写入无法仅靠 HANDLE_TIME 排序。

### 影响

- SQL-1b（最新日志查询）的子查询 `MAX(HANDLE_TIME)` 可能返回多条
- 日志时间线展示顺序可能不稳定

### 可选方案

| 方案 | 说明 |
|------|------|
| A: HANDLE_TIME + ID 复合排序 | 已采用，ID 递增保证稳定性 |
| B: 使用 ROW_NUMBER() OVER (PARTITION BY ... ORDER BY HANDLE_TIME DESC, ID DESC) | Oracle 窗口函数，更精确但稍复杂 |

### Agent 推荐

**A**。已在所有涉及日志排序的 SQL 和算法中使用 `(HANDLE_TIME, ID)` 复合排序键。方案 B 可在需要精确取 TOP 1 的场景中使用。

---

## Q9: JDK 8 下 LocalDateTime 与 Oracle DATE 的兼容性

### 问题

时间计算和 DTO 设计建议使用 `java.time.LocalDateTime`，但需要确认：
- MyBatis-Plus 3.5.3.1 + JDK 8 下 LocalDateTime ↔ Oracle DATE 的自动映射是否正常
- 时区转换是否引入偏移（Oracle DATE 无时区，JDBC 驱动按 JVM 默认时区读取）

### 影响

- 如果 LocalDateTime 映射有问题，需回退到 java.util.Date
- 时间比较和 Duration 计算依赖正确的类型

### 可选方案

| 方案 | 说明 |
|------|------|
| A: 使用 java.util.Date | 兼容性最好，但 API 较旧 |
| B: 使用 java.time.LocalDateTime | 现代 API，但需验证 MyBatis-Plus + Oracle JDBC 驱动兼容性 |
| C: DTO 用 LocalDateTime，Mapper 层用 Date 并在 Service 层转换 | 增加转换层 |

### Agent 推荐

**B，但需在第一个 Mapper 实现后立即验证**。MyBatis-Plus 3.5.3.1 理论上支持 LocalDateTime，且项目可能已有使用先例。建议在实现阶段先写一个简单的 Mapper 查询验证映射，如果失败则回退到方案 A。

---

## Q10: 页面自动刷新与数据一致性

### 问题

API-1 主页面设计为每 30 秒自动刷新。以下场景可能导致短暂的数据不一致：
1. 刷新间隔内新事件入库，页面显示过期状态
2. 两次 API 调用之间数据变更（如 API-1 返回列表后，用户点击进入 API-2，此时事件已更新）

### 影响

- 不阻塞功能，属于 UX 优化层面
- 自动刷新间隔已在 031 任务中设计，非本轮范围

### Agent 推荐

当前设计已可接受。前端刷新间隔和手动刷新按钮已覆盖大部分场景。如需更强一致性，后续可考虑 WebSocket 推送（超出本轮范围）。

---

> 以上问题均不阻塞后端开发启动。Q1-Q4 建议在单元测试和集成测试阶段重点覆盖。Q5-Q10 为边界场景和优化项。
