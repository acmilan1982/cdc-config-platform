# Job Failure Monitoring — 功能基线

> 故障监控模块当前功能的唯一事实来源。
> 当其他文档与本基线冲突时，以本基线和当前代码为准。

---

## 1. 文档元信息

| 项目 | 值 |
|------|-----|
| 文档状态 | 当前有效 |
| 最后更新 | 2026-07-31 |
| 最终核查 | 2026-07-31 TASK 050 |
| 对应分支 | `develop` |
| 对应 commit | （模块功能基线提交，见交接文档） |
| 模块状态 | 当前版本正式完成 |
| 事实来源 | 当前代码实现、数据库表结构、已验收页面 |

---

## 2. 模块定位与边界

### 2.1 定位

- 模块属于**运行监控**（菜单组：`运行监控`）
- 页面为**只读监控**功能，不提供新增、编辑、删除操作
- 面向用户的文案统一使用"故障"，底层代码保留 `FAILURE`/`failed`/`restart` 等内部命名

### 2.2 数据边界

当前核心数据仅来自两张表：

- `CDC_JOB_FAILURE_EVENT`（故障事件表）
- `CDC_JOB_FAILURE_HANDLE_LOG`（处理记录表）

两表通过 `FAILURE_EVENT_ID` = `ID` 形成一对多关联，无数据库外键约束。

明确不读取：

- ZooKeeper（任何路径）
- `CDC_DATA_SOURCE_RUN_STATE` 或其他 RUN_STATE 表
- `CDC_CLIENT`（已废弃，使用 `CDC_CLIENT_MULTIPLE`）

辅助读取（仅用于名称查找）：

- `CDC_CLIENT_MULTIPLE` — 客户端名称（`CLIENT_DESC`）
- `CDC_DATA_SOURCE` — 数据源名称（`DATA_SOURCE_NAME`）

### 2.3 能力范围

- Overview 页面：以客户端卡片分组展示所有逻辑 Job 的故障汇总
- 故障详情页：展示最近一次故障过程的完整信息
- 历史故障查看：在详情页底部按时间范围查阅历史故障过程
- CLOB 懒加载：按需加载故障详情和错误明细长文本

---

## 3. 核心业务概念

### 3.1 逻辑 Job

```
逻辑 Job = (CLIENT_ID, DATA_SOURCE_ID)
```

两个字段联合唯一确定一个"业务库"。主集合来源为 `CDC_CLIENT_MULTIPLE` 表中 `FG_ACTIVE = '1'` 的记录。

### 3.2 物理 Job ID

Flink 作业的唯一标识（32 位 hex 字符串），存储在 `FAILED_JOB_ID` 和 `NEW_JOB_ID` 字段中。一次故障过程中可能产生多个物理 Job ID（失败 → 重启 → 新 Job）。

### 3.3 故障事件

`CDC_JOB_FAILURE_EVENT` 中的一条记录，代表一次 Flink Job 失败回调。关键字段：

- `FAILED_JOB_ID`：失败的物理 Job ID
- `FAILURE_TIME`：失败发生时间
- `EVENT_RESULT`：事件处理结果（ACCEPTED / IGNORED_INVALID / IGNORED_STALE）

### 3.4 故障过程

一次故障过程由同属于一个逻辑 Job 的、通过 `NEW_JOB_ID` → `FAILED_JOB_ID` 关系可达的所有故障事件组成的连通图。

- **起点**：某事件的 `FAILED_JOB_ID` 在前序事件中从未作为 `NEW_JOB_ID` 出现过
- **终点**：存在 `HANDLE_STAGE = STABLE_CHECK_PASSED` 的处理日志则为已闭环；不存在则为未闭环
- **faultRootId**：故障过程中第一条事件（按 FAILURE_TIME ASC）的 `ID`

归并算法：`FaultProcessGrouper` 以 BFS 在 NEW_JOB_ID → FAILED_JOB_ID 边构成的图中找出所有连通分量，每个分量即一个故障过程。

### 3.5 处理日志

`CDC_JOB_FAILURE_HANDLE_LOG` 中的一条记录，对应故障事件处理流程中的一个阶段。关键字段：

- `HANDLE_STAGE`：处理阶段枚举
- `HANDLE_TIME`：处理动作发生时间
- `NEW_JOB_ID`：重启后的新 Job ID
- `ATTEMPT_NO`：重启尝试次数

### 3.6 恢复尝试

一次"恢复尝试"由一条 `HANDLE_STAGE = RESTART_STARTED` 的处理日志界定。`FaultProcessGroup.countRestarts()` 统计该组内所有 `RESTART_STARTED` 日志数量。

### 3.7 物理 Job 链

通过 `FAILED_JOB_ID → NEW_JOB_ID` 关系串联的物理 Job ID 序列。`JobChainBuilder` 从事件和日志中构建链，链中每个节点标记类型：

- `INITIAL`：初始失败的 Job
- `INTERMEDIATE`：中间重启的 Job
- `CURRENT`：当前运行的 Job（如果仍在恢复中）
- `FINAL`：最终恢复的 Job（如果已闭环）

### 3.8 组织关系

```
客户端（CLIENT_ID）
  └── 业务库/逻辑 Job（CLIENT_ID + DATA_SOURCE_ID）
        └── 故障过程（faultRootId）
              ├── 故障事件（CDC_JOB_FAILURE_EVENT 记录）
              │     └── 处理日志（CDC_JOB_FAILURE_HANDLE_LOG 记录）
              └── 物理 Job 链
```

---

## 4. 数据模型与索引

### 4.1 两张核心表

详见 [数据模型与表结构分析](../../database/job-failure-table-data-analysis.md)。核心字段摘要：

**CDC_JOB_FAILURE_EVENT**：

| 字段 | 类型 | 关键用途 |
|------|------|---------|
| ID | NUMBER(19) PK | 事件 ID，关联日志表 |
| CLIENT_ID | VARCHAR2(64) | 客户端 ID |
| DATA_SOURCE_ID | VARCHAR2(64) | 数据源 ID |
| FAILED_JOB_ID | VARCHAR2(64) | 失败的物理 Job ID |
| FAILURE_TIME | DATE | 失败发生时间 |
| EVENT_RESULT | VARCHAR2(32) | ACCEPTED / IGNORED_INVALID / IGNORED_STALE |
| FAILURE_DETAIL | CLOB | 完整异常堆栈（懒加载） |

**CDC_JOB_FAILURE_HANDLE_LOG**：

| 字段 | 类型 | 关键用途 |
|------|------|---------|
| ID | NUMBER(19) PK | 日志 ID |
| FAILURE_EVENT_ID | NUMBER(19) | 关联事件 ID |
| HANDLE_STAGE | VARCHAR2(64) | 处理阶段枚举 |
| HANDLE_TIME | DATE | 处理发生时间 |
| NEW_JOB_ID | VARCHAR2(64) | 重启后的新 Job ID |
| ATTEMPT_NO | NUMBER(10) | 尝试次数 |
| ERROR_DETAIL | CLOB | 错误详情（懒加载） |

### 4.2 索引

两表当前均**仅包含主键索引和 LOB 索引**，无业务索引。数据量增长后需补充 `(CLIENT_ID, DATA_SOURCE_ID, FAILURE_TIME)` 和 `(FAILURE_EVENT_ID, HANDLE_TIME)` 等索引。

### 4.3 时间字段

所有 DATE 类型精确到秒，无时区信息。服务器时区 `Asia/Shanghai`。前端展示格式 `yyyy-MM-dd HH:mm:ss`。

### 4.4 长文本

- `FAILURE_DETAIL`（CLOB）：事件失败详情，通过 API-5 懒加载
- `ERROR_DETAIL`（CLOB）：处理错误详情，通过 API-5 懒加载
- 后端截断阈值为 65535 字符

---

## 5. Overview 最终基线

### 5.1 路由

- 路径：`/monitor/job-failure`
- 路由名称：`JobFailure`
- 页面文件：`frontend/src/views/monitor/job-failure/index.vue`

### 5.2 查询与刷新区域

| 功能 | 实现 |
|------|------|
| 客户端 ID 下拉 | 多选，支持"全部"，与具体客户端互斥 |
| 数据源 ID 输入 | 文本输入，前端子串匹配 |
| Job 当前状态下拉 | 全部 / 正常（值为"正常运行"）/ 恢复中 |
| 查询按钮 | 触发 `doQuery()`（过滤器响应式自动生效） |
| 重置按钮 | 清空所有过滤条件，展开状态重置为全部展开 |
| 自动刷新 | 下拉选择：1 分钟 / 60 分钟 / 360 分钟 |
| 手动刷新 | 按钮 + loading 状态，保持当前展开状态 |
| 最后刷新时间 | 显示最近一次成功刷新时间 |

### 5.3 客户端卡片

- 主集合来源：`CDC_CLIENT_MULTIPLE` 中 `FG_ACTIVE = '1'` 的记录
- 客户端标识：使用 `CLIENT_ID`，**不使用** `CLIENT_DESC` 替代
- 卡片排序：异常客户端在前，同状态按 `CLIENT_ID` 升序
- 卡片标题：`CLIENT_ID | Job 总数 N | 正常 N | 异常 N`
- 异常客户端左侧边框为橙色（`#e6a23c`），正常为灰色

### 5.4 展开/折叠

- **首次加载**：所有客户端卡片默认展开
- **手动折叠/展开**：保留状态，自动刷新和手动刷新不强制改变
- **新出现的客户端**：默认展开
- **已消失的客户端**：展开状态自动清理
- **查询/重置**：重置后全部展开；筛选不破坏现有展开状态
- **离开页面后重新进入**：重新按全部展开初始化

### 5.5 业务库表格（7 列）

| # | 列名 | 数据来源 | 说明 |
|---|------|---------|------|
| 1 | 数据源 ID | `DATA_SOURCE_ID` | monospace 样式 |
| 2 | 数据源名称 | `CDC_DATA_SOURCE.DATA_SOURCE_NAME` | 长文本截断 + tooltip |
| 3 | Job 当前状态 | 计算字段 | "正常"（绿色 tag）/ "恢复中"（橙色 tag） |
| 4 | 最近故障时间 | `latestFailureTime` | 格式 `yyyy-MM-dd HH:mm:ss`，无不显示 `—` |
| 5 | 最近恢复时间 | `latestRecoveryTime` | 同上，恢复中时显示 `—` |
| 6 | 故障期间恢复尝试 | `latestRestartCount` | 显示 `N 次`，无故障时 `—` |
| 7 | 操作 | `latestFaultRootId` | 有故障记录时显示"查看"链接，否则 `—` |

已删除不再展示的列：当前物理 Job ID、失败事件数。

### 5.6 文案规范（Overview 页面）

| 面向用户文案 | 内部字段/变量 |
|-------------|-------------|
| 最近故障时间 | `latestFailureTime` |
| 故障事件 | `failureEvent`（内部） |
| 故障状态 | `jobStatus` |
| 故障期间恢复尝试 | `latestRestartCount`（显示 `N 次`） |

数据库字段、Java 属性、接口 JSON 字段不受前端文案影响。

### 5.7 无数据/异常处理

- 无历史故障：时间显示 `—`，恢复尝试显示 `—`，"查看"不显示
- 恢复中：最近恢复时间显示 `—`
- 空结果：`<el-empty>` 组件
- 加载失败：错误状态 + 重试按钮
- 接口异常：保留上一次成功数据，不覆盖

---

## 6. 故障详情页最终基线

### 6.1 路由

- 路径：`/monitor/job-failure/detail`
- 路由名称：`JobFailureDetail`
- 页面文件：`frontend/src/views/monitor/job-failure/detail.vue`
- 进入方式：Overview "查看"按钮 → `window.open(router.resolve({name:'JobFailureDetail', query:{clientId, dataSourceId}}).href, '_blank')`

### 6.2 页面结构（从上到下）

| 区域 | 组件 | 说明 |
|------|------|------|
| 故障概览 | `FaultProcessOverview.vue` | clientId, dataSourceId, faultRootId, 首次故障时间, 最后处理时间, 记录状态, 恢复尝试次数, 异常告警 |
| 物理 Job 链 | `PhysicalJobChain.vue` | 单行横向滚动，红色/绿色节点标记，正序排列，`recovered` 属性控制颜色 |
| 主链事件 | `FailureEventList.vue` | 事件表格，ID 截断（前6...后8），无复制按钮 |
| 排除事件 | `FailureEventList.vue` | 仅非空时显示 |
| 处理过程 | `RestartCards.vue` | RESTART_STARTED 为界分组为卡片，升序排列，绿色/红色标记 |
| 故障历史 | `FaultHistory.vue` | 时间范围下拉（1天/1周/1月），不分页（pageSize=1000），当前行高亮 |

### 6.3 记录状态

| 后端枚举 | 页面展示 |
|----------|---------|
| `RECOVERY_RECORDED` | 已恢复（绿色） |
| `NOT_CLOSED` | 记录未闭环（橙色） |
| `DATA_ANOMALY` | 数据异常（红色） |

### 6.4 排序规则

- 物理 Job 链：按时间正序
- 主链事件：按故障时间排序
- 处理过程（RestartCards）：按业务发生顺序（升序）
- 故障历史：按首次故障时间倒序（最新在前）

### 6.5 ID 截断规则

长度 ≤ 16 字符：完整显示；长度 > 16：取前 6 字符 + `…` + 后 8 字符。

### 6.6 故障历史

- 位置：详情页底部
- 接口：API-3（`/api/job-failure/history/{clientId}/{dataSourceId}`）
- 时间范围：最近一天 / 一周 / 一月
- 不分页：pageSize=1000，不显示分页控件
- 点击某行调用 API-4 刷新详情区域
- 当前查看的行高亮显示

### 6.7 CLOB 加载

- 组件：`ClobDetailDialog.vue`
- 接口：API-5
- 以 dialog 方式展示 monospace 文本
- 支持复制按钮

---

## 7. 统计、状态与时间计算规则

### 7.1 Job 当前状态判断

```
IF 无故障事件 → "正常运行"
IF 最新故障过程的所有日志中存在 STABLE_CHECK_PASSED → "正常运行"
ELSE → "恢复中"
```

实现位置：`JobFailureServiceImpl.querySummary()` 第 158-170 行。

### 7.2 最近故障如何选择

取该逻辑 Job 下所有事件按 FAILURE_TIME ASC 排列，通过 `FaultProcessAssembler` 组装为故障过程组列表，取最后一个组（`groups.get(groups.size() - 1)`）作为最新故障过程。

### 7.3 最近故障时间

最新故障过程中第一条事件（按 FAILURE_TIME ASC）的 `failureTime`。

### 7.4 最近恢复时间

遍历最新故障过程的所有处理日志，找到第一条 `HANDLE_STAGE = STABLE_CHECK_PASSED` 的日志，取其 `HANDLE_TIME`。未找到时返回 `null`（前端显示 `—`）。

实现位置：`JobFailureServiceImpl.querySummary()` 第 159-170 行。

### 7.5 故障期间恢复尝试计数

`FaultProcessGroup.countRestarts()` 统计该组内所有 `RESTART_STARTED` 处理日志数量。前端显示为 `N 次`。

### 7.6 故障持续时间

`(lastHandleTime 或 STABLE_CHECK_PASSED 的 handleTime) - firstFailureTime`。由 `TimeCalculator` 计算。

### 7.7 记录状态与事件结果的区别

- **记录状态**（`RecordStatus`）：表示整个故障过程的记录完整性
- **事件结果**（`EventValidity`）：表示单条事件的处理有效性（ACCEPTED / IGNORED_INVALID / IGNORED_STALE）

### 7.8 物理 Job 链构建

`JobChainBuilder` 从事件和日志中提取所有物理 Job ID，按出现顺序构建节点链。节点类型由位置和故障闭环状态决定。

### 7.9 同业务库多次故障隔离

通过 `FaultProcessGrouper` 的 BFS 连通分量算法隔离。不同故障过程之间无 NEW_JOB_ID → FAILED_JOB_ID 的传递关系。

---

## 8. API 清单

所有接口前缀：`/api/job-failure`

| # | 方法 | 路径 | 说明 |
|---|------|------|------|
| API-1 | GET | `/summary` | 全量逻辑 Job 故障汇总 |
| API-2 | GET | `/latest/{clientId}/{dataSourceId}` | 最近一次故障过程详情 |
| API-3 | GET | `/history/{clientId}/{dataSourceId}` | 历史故障过程分页 |
| API-4 | GET | `/process/{faultRootId}` | 指定故障过程详情 |
| API-5 | GET | `/clob/{faultRootId}/{clobField}/{recordId}` | CLOB 长文本懒加载 |

### API-1: Summary

- 无请求参数
- 返回 `List<JobFailureSummaryVO>`
- 以 `CDC_CLIENT_MULTIPLE` (FG_ACTIVE=1) 为主集合
- 每条记录包含 clientId, clientName, dataSourceId, dataSourceName, jobStatus, latestFailureTime, latestRecoveryTime, latestEventId, latestFaultRootId, latestRestartCount, eventCountInWindow

### API-2: Latest Fault

- 路径参数：clientId, dataSourceId
- 返回 `FaultProcessDetailVO`（完整故障过程详情）
- 自动定位最新故障过程
- 逻辑 Job 无故障时返回错误

### API-3: History

- 路径参数：clientId, dataSourceId
- Query 参数：startTime, endTime, pageNum, pageSize
- 返回 `PageResult<FaultProcessSummaryVO>`
- 按首次故障时间倒序排列
- 时间范围由前端的 time range 选择器转换为 startTime/endTime 传入

### API-4: Process Detail

- 路径参数：faultRootId
- 返回 `FaultProcessDetailVO`（与 API-2 相同结构）
- 验证 faultRootId 对应的首事件属于有效的故障过程
- faultRootId 不存在或不在主链中时返回 404

### API-5: CLOB

- 路径参数：faultRootId, clobField, recordId
- clobField 枚举：`FAILURE_EVENT_FAILURE_DETAIL` / `FAILURE_HANDLE_LOG_ERROR_DETAIL`
- 服务端验证 recordId 属于该 faultRootId 对应的故障过程
- 返回 `ClobDetailVO`（contentType, content, contentLength, truncated）

### 空值语义

- `latestRecoveryTime = null`：尚未恢复或无法确定恢复时间
- `latestFailureTime = null`：无故障记录
- `latestFaultRootId = null`：无故障过程

---

## 9. 前后端关键代码位置

### 9.1 前端

| 文件 | 职责 |
|------|------|
| `frontend/src/router/index.ts:58-68` | 路由定义（2 条） |
| `frontend/src/config/menu.ts:29` | 菜单项（"故障监控"） |
| `frontend/src/types/jobFailure.ts` | TypeScript 类型定义 |
| `frontend/src/api/jobFailure.ts` | API 调用模块（5 个方法） |
| `frontend/src/views/monitor/job-failure/index.vue` | Overview 页面 |
| `frontend/src/views/monitor/job-failure/detail.vue` | 详情页面 |
| `frontend/src/views/monitor/job-failure/components/FaultProcessOverview.vue` | 故障概览 |
| `frontend/src/views/monitor/job-failure/components/PhysicalJobChain.vue` | 物理 Job 链 |
| `frontend/src/views/monitor/job-failure/components/FailureEventList.vue` | 事件列表 |
| `frontend/src/views/monitor/job-failure/components/RestartCards.vue` | 恢复尝试卡片 |
| `frontend/src/views/monitor/job-failure/components/FaultHistory.vue` | 故障历史 |
| `frontend/src/views/monitor/job-failure/components/ClobDetailDialog.vue` | CLOB 弹窗 |
| `frontend/src/views/monitor/job-failure/components/HandleTimeline.vue` | 时间线（已被 RestartCards 替代，保留在代码中） |
| `frontend/src/views/monitor/job-failure/components/JobFailureSummaryTable.vue` | 汇总表组件（已被内联替代，保留在代码中） |

### 9.2 后端

| 文件 | 职责 |
|------|------|
| `backend/src/main/java/.../controller/JobFailureController.java` | REST Controller（5 个端点） |
| `backend/src/main/java/.../service/JobFailureService.java` | Service 接口 |
| `backend/src/main/java/.../service/impl/JobFailureServiceImpl.java` | Service 实现（汇总、详情、历史、CLOB） |
| `backend/src/main/java/.../algorithm/FaultProcessAssembler.java` | 故障过程组装编排器 |
| `backend/src/main/java/.../algorithm/FaultProcessGrouper.java` | 故障过程归并（BFS 连通分量） |
| `backend/src/main/java/.../algorithm/MainChainFilter.java` | 主链事件过滤 |
| `backend/src/main/java/.../algorithm/JobChainBuilder.java` | 物理 Job 链构建 |
| `backend/src/main/java/.../algorithm/AnomalyDetector.java` | 异常检测 |
| `backend/src/main/java/.../algorithm/RecordStatusResolver.java` | 记录状态解析 |
| `backend/src/main/java/.../algorithm/FaultProcessResultResolver.java` | 故障过程结果解析 |
| `backend/src/main/java/.../algorithm/TimeCalculator.java` | 时间计算工具 |
| `backend/src/main/java/.../algorithm/FaultProcessGroup.java` | 故障过程组模型 |
| `backend/src/main/java/.../algorithm/FaultEventModel.java` | 故障事件模型 |
| `backend/src/main/java/.../algorithm/FaultLogModel.java` | 处理日志模型 |
| `backend/src/main/java/.../mapper/JobFailureEventMapper.java` | 事件表 Mapper |
| `backend/src/main/java/.../mapper/JobFailureHandleLogMapper.java` | 日志表 Mapper |
| `backend/src/main/java/.../mapper/CdcClientMultipleMapper.java` | 客户端主数据 Mapper |
| `backend/src/main/java/.../entity/JobFailureEvent.java` | 事件实体 |
| `backend/src/main/java/.../entity/JobFailureHandleLog.java` | 日志实体 |
| `backend/src/main/java/.../vo/` | 7 个 VO 类 |
| `backend/src/main/java/.../query/` | HistoryQuery, JobFailureSummaryQuery |
| `backend/src/main/java/.../enums/` | RecordStatus, FaultProcessResult, EventValidity, AnomalyType, ClobFieldType |
| `backend/src/test/java/.../jobfailure/` | 单元测试（Grouper, Assembler, Filter, StatusResolver, Service） |

### 9.3 数据库脚本

无独立 SQL 脚本文件。表结构见 `docs/database/job-failure-table-data-analysis.md` 中的 DDL。

---

## 10. 页面文案规范

面向用户统一使用"故障"：

| 页面位置 | 文案 |
|---------|------|
| 菜单/页面标题 | 故障监控 |
| 详情页标题 | 故障过程详情 |
| 表头 | 最近故障时间 |
| 表头 | 故障期间恢复尝试 |
| 标签 | 故障事件 |
| 标签 | 故障状态 |

底层保持现有命名：

- 数据库表名：`CDC_JOB_FAILURE_EVENT`、`CDC_JOB_FAILURE_HANDLE_LOG`
- Java 类/字段：`JobFailure*`、`FAILURE_*`、`failed*`
- 接口 JSON 字段：`latestFailureTime`、`latestRestartCount`
- 日志和错误消息：沿用 `failure` / `FAILED`

---

## 11. 刷新、排序、空数据与长文本规则

### 11.1 刷新

| 项目 | 值 |
|------|-----|
| 默认刷新频率 | 3600 秒（60 分钟） |
| 可选频率 | 60 / 3600 / 21600 秒 |
| 自动刷新行为 | 静默更新数据，保持展开状态，requestId 防竞态 |
| 手动刷新 | 带 loading 状态，保持展开状态 |
| 最后刷新时间 | 每次成功请求后更新 |

### 11.2 排序

| 区域 | 排序方向 |
|------|---------|
| 客户端卡片 | 异常在前 → clientId 升序 |
| 业务库表格 | 按数据源 ID |
| 物理 Job 链 | 正序 |
| 主链事件 | 按故障时间 |
| 恢复尝试卡片 | 升序 |
| 故障历史 | 首次故障时间倒序 |

### 11.3 空数据

| 场景 | 行为 |
|------|------|
| 无故障记录时的时间字段 | `—`（em dash，U+2014） |
| 无故障记录时的恢复尝试 | `—` |
| 无故障记录时的操作 | 不显示"查看"按钮，显示 `—` |
| 恢复中的最近恢复时间 | `—` |
| 空结果集 | `<el-empty description="暂无匹配的故障记录" />` |
| 接口失败 + 无缓存数据 | `<el-empty description="数据加载失败" />` + 重试按钮 |
| 接口失败 + 有缓存数据 | 保留上次数据（不覆盖），不显示错误状态 |

### 11.4 长文本

- Overview 表格：数据源名称过长时 CSS `text-overflow: ellipsis`，tooltip 显示完整内容
- 详情页 ID：按截断规则（≤16 完整，>16 前6…后8）
- CLOB 内容：通过 `ClobDetailDialog` 懒加载，monospace pre 块，支持复制

---

## 12. 已完成、冻结与明确不做

### 12.1 已完成并验收

- [x] Overview 页面（index.vue）：客户端卡片 + 7 列表格 + 查询刷新
- [x] 故障详情页（detail.vue）：概览 + Job 链 + 事件 + 处理卡片 + 历史
- [x] 后端 5 个 API（API-1 到 API-5）
- [x] 故障过程归并算法（BFS 连通分量）
- [x] 物理 Job 链构建算法
- [x] 记录状态和故障结果判定算法
- [x] 异常检测算法
- [x] CLOB 懒加载（含安全验证）
- [x] 客户端和数据源名称查询
- [x] 自动刷新（含展开状态保持）
- [x] Overview 文案统一（失败→故障）
- [x] 最近恢复时间字段（后端 + 前端）
- [x] 故障历史（时间范围、不分页）
- [x] 恢复尝试卡片（RestartCards）
- [x] ID 截断（前6…后8）
- [x] 物理 Job 链单行横向滚动
- [x] 前端 vue-tsc + vite build 通过
- [x] 后端 mvn test（179/180 pass） + mvn package 通过

### 12.2 当前冻结

- Overview 页面结构、字段和交互
- 详情页布局、组件和排序
- 后端 API 路径、参数和返回结构
- 数据库表结构
- 相关算法实现

### 12.3 明确不做

- 不提供新增/编辑/删除操作
- 不读取 ZooKeeper 节点
- 不读取 `CDC_DATA_SOURCE_RUN_STATE`
- 不展示"当前物理 Job ID"（Overview）
- 不展示"失败事件数"（Overview）
- 不修改详情页中已验收的物理 Job 链、处理卡片、故障历史
- 不添加新状态枚举值（前端仅显示"正常"/"恢复中"）
- 不修改数据库列名或 Java 字段名以匹配前端文案

### 12.4 已知限制

- 两张表仅有主键索引，数据量增长后查询性能可能下降
- 开发库数据量极少（当前仅 2 个客户端有故障数据）
- 缺少"恢复中"状态的实时数据用于 UI 验证
- `OracleDateMappingTest` 存在 1 个预存日期敏感测试失败（与故障监控无关）

---

## 13. 验证状态

| 验证项 | 结果 | 日期 | 来源 |
|--------|------|------|------|
| 后端 mvn clean package | BUILD SUCCESS | 2026-07-31 | TASK 050 最终验证 |
| 后端 mvn test | 179/180 pass (1 pre-existing: OracleDateMappingTest) | 2026-07-31 | TASK 050 最终验证 |
| 前端 npm run build (vue-tsc + vite) | BUILD SUCCESS | 2026-07-31 | TASK 050 最终验证 |
| API-1 真实数据验证 | 2 条记录，latestRecoveryTime 正确 | 2026-07-31 | 已验证 |
| Overview 页面视觉验收 | 7 列正确，卡片正确，数据源 ID 下拉框，展开/刷新正确 | 2026-07-31 | TASK 048 004 |
| 详情页视觉验收 | 组件正确，排序正确，ID 截断正确 | 2026-07-31 | TASK 048 002 |
| 数据源 ID 下拉框 | el-select 替代 el-input，精确匹配 | 2026-07-31 | TASK 048 004 |

---

## 14. 相关现行文档

| 文档 | 类型 | 说明 |
|------|------|------|
| `docs/database/job-failure-table-data-analysis.md` | 现行 | 表结构 DDL、字段字典、数据质量分析 |
| `docs/database/job-failure-chain-algorithm-design.md` | 现行/参考 | 算法设计，代码实现大致匹配 |
| `docs/database/job-failure-query-and-index-design.md` | 现行/参考 | 查询和索引设计建议 |
| `docs/pages/job-failure-backend-api-spec.md` | **历史** | TASK 045 设计阶段 API 规格，路径和结构与实际不同 |
| `docs/pages/job-runtime-failure-recovery-spec.md` | **历史** | TASK 041 页面规格，早期设计 |
| `docs/pages/job-runtime-failure-recovery-ui-review.md` | **历史** | UI 评审修订记录 |
| `docs/agent-prompts/TASK_04[5-8]*.md` | **历史** | 开发任务提示词 |
| `docs/agent-prompts/033*.md` ~ `044*.md` | **历史** | 早期分析和设计提示词 |

当专题文档与本基线冲突时，以本基线和当前代码为准。

---

> 本基线由 TASK 049 文档收口任务生成，基于 TASK 045-048 全部开发成果。
