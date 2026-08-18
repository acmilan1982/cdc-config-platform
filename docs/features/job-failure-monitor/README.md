# Job 失败事件监控（job-failure-monitor）

## 1. 功能名称

**Job 失败事件监控**（菜单和页面标题："故障监控"）。

## 2. 功能定位

属于 CDC 配置管理平台"运行监控"模块下的**只读故障追踪**功能。展示 CDC Job 从失败、处理、重启到恢复稳定的完整过程，不执行重启、修改或删除操作。

## 3. 页面观察层级

页面按照以下层级展示：

```
客户端 → 采集任务 → 失败时间 → 失败处理过程
```

| 层级 | 数据来源 | 说明 |
|---|---|---|
| 客户端 | `CDC_CLIENT_MULTIPLE` | 提供客户端标识和展示范围 |
| 采集任务 | `CDC_DATA_SOURCE` | 在本功能中对应数据源，显示数据源名称 |
| 失败时间 | `CDC_JOB_FAILURE_EVENT` | 提供 Job 失败事件事实 |
| 失败处理过程 | `CDC_JOB_FAILURE_HANDLE_LOG` | 提供失败处理过程记录 |

## 4. 数据来源

### 4.1 四张表及其职责

本功能使用四张数据库表：

| 表 | 职责 | 访问方式 |
|---|---|---|
| `CDC_CLIENT_MULTIPLE` | 提供客户端标识和客户端展示范围 | MyBatis-Plus BaseMapper，只读 |
| `CDC_DATA_SOURCE` | 提供采集任务（数据源）标识和名称 | MyBatis-Plus BaseMapper，只读 |
| `CDC_JOB_FAILURE_EVENT` | 提供 Job 失败事件事实（故障时间、事件结果等） | MyBatis-Plus BaseMapper，只读 |
| `CDC_JOB_FAILURE_HANDLE_LOG` | 提供失败处理过程记录（处理阶段、新 Job ID、尝试次数等） | MyBatis-Plus BaseMapper，只读 |

职责区分：

- 故障事实、失败次数、重启过程、恢复过程和故障链计算，以 `CDC_JOB_FAILURE_EVENT` 和 `CDC_JOB_FAILURE_HANDLE_LOG` 两张故障表为依据；
- `CDC_CLIENT_MULTIPLE` 和 `CDC_DATA_SOURCE` 用于确定展示对象、关联层级和补充名称；
- 两张故障表的记录原则为**只插入，不更新，不删除**（由 CDC 同步程序负责写入）。管理平台仅查询展示。

### 4.2 启用范围过滤

客户端只展示启用的记录：

| 表 | 过滤字段 | 过滤值 |
|---|---|---|
| `CDC_CLIENT_MULTIPLE` | `FG_ACTIVE` | `'1'` |

规则：

- 只展示启用客户端（`CDC_CLIENT_MULTIPLE.FG_ACTIVE = '1'`）；
- 停用客户端不进入页面展示范围。

数据源展示存在概览页局部例外（详见 REQUIREMENTS.md §5.2、§6.5）：故障监控概览页以 `CDC_CLIENT_MULTIPLE.DATA_SOURCE_ID` 的配置内容为展示全集，按英文逗号拆分的每个非空 ID 无论 `CDC_DATA_SOURCE` 中是否存在、`FG_ACTIVE` 为何值都必须显示；存在但未激活显示红字 `(数据源未激活)`，不存在显示红字 `无效数据源`。其他功能场景仍按 `CDC_DATA_SOURCE.FG_ACTIVE = '1'` 的一般过滤规则。

### 4.3 当前实现状态

- 已实现：`CDC_CLIENT_MULTIPLE` 的 `FG_ACTIVE = '1'` 过滤（`JobFailureServiceImpl`）；
- 概览页多数据源拆分与异常数据源展示已实现并验收，`CDC_DATA_SOURCE` 的 `FG_ACTIVE` 过滤在概览页范围内由页面例外规则替代（见 §6.5），不再作为概览页缺陷（详见 REQUIREMENTS.md §19 GAP-FILTER-001）。

### 4.4 明确不读取的数据源

- ZooKeeper 业务节点数据（在概览页范围内除外：只读判断客户端/Job `alive` 临时节点存在性，用于在线/离线运行状态，见 §8.1）
- `CDC_DATA_SOURCE_RUN_STATE` 或其他 RUN_STATE 表
- `CDC_CLIENT` 表（已废弃）

## 5. 数据操作边界

**严格只读：**

- 不向任何业务表写入数据；
- 概览页只读判断 ZooKeeper `alive` 临时节点存在性（客户端/Job 在线状态），不写 ZooKeeper、不创建或删除任何 ZK 节点；其他 ZK 路径不读取；
- 不提供重启、停止、修改或删除操作。

**ZooKeeper 运行状态读取路径**（根路径为当前配置/示例 `/bsoft-cdc`，运行时以 `GET /api/monitor/zookeeper/health` 返回的 `rootPath` 为准）：

```text
/bsoft-cdc/clients/{clientId}/alive
/bsoft-cdc/clients/{clientId}/jobs/{jobCode}/alive
```

- `{clientId}` 来自启用的 `CDC_CLIENT_MULTIPLE.CLIENT_ID`；
- `{jobCode}` 为 `CDC_CLIENT_MULTIPLE.DATA_SOURCE_ID` 按英文逗号拆分后的单个数据源 ID；
- `alive` 为临时节点，只判断存在性（存在=在线，不存在=离线），不读取其内容；
- 复用现有只读 ZooKeeper 客户端，不创建第二套连接。

## 6. 与其他功能的职责关系

| 功能 | 职责 | 与本功能的关系 |
|---|---|---|
| **zk-node-monitor**（ZK 节点监控） | ZK 实时在线状态和 SCN 监控 | 职责互补：ZK 监控展示 ZK 节点级运行信息；本功能概览页只读判断客户端/Job `alive` 节点存在性以补充"运行状态"，并继续展示数据库中的故障事件和处理链路。Flink Job ID 与 ZK jobName 是两套独立标识体系，不交叉引用 |
| **large-screen**（数据同步统计大屏） | 基于 CDC 日志的增量统计可视化 | 职责分离：大屏展示统计聚合数据，本功能追踪故障生命周期 |
| **数据源/客户端/订阅配置管理** | CDC 配置数据的 CRUD 维护 | 职责分离：本功能只读监控，配置管理读写数据库 |

## 7. 关键代码位置

所有路径为仓库相对路径。

### 7.1 后端 — 接口与服务

| 层次 | 文件 | 职责 |
|---|---|---|
| Controller | `backend/src/main/java/com/bsoft/cdcconfig/monitor/jobfailure/controller/JobFailureController.java` | REST Controller，5 个 API 端点 |
| Service 接口 | `backend/src/main/java/com/bsoft/cdcconfig/monitor/jobfailure/service/JobFailureService.java` | 服务接口定义 |
| Service 实现 | `backend/src/main/java/com/bsoft/cdcconfig/monitor/jobfailure/service/impl/JobFailureServiceImpl.java` | 核心编排：加载数据、调用算法管线、构建 VO |

#### 7.1.1 后端 — ZooKeeper 运行状态融合（runtime）

| 层次 | 文件 | 职责 |
|---|---|---|
| 运行状态读取 | `backend/src/main/java/com/bsoft/cdcconfig/monitor/jobfailure/runtime/JobRuntimeStatusReader.java` | 按 ZK `alive` 节点存在性判断客户端/Job 在线状态；客户端离线时短路，不读取其 Job `alive` |
| 运行状态快照 | `backend/src/main/java/com/bsoft/cdcconfig/monitor/jobfailure/runtime/JobRuntimeSnapshot.java` | 一次运行状态读取的结果快照，供 Summary 与数据库故障事实组合展示 |

### 7.2 后端 — 数据访问

| 层次 | 文件 | 职责 |
|---|---|---|
| 事件 Mapper | `backend/src/main/java/com/bsoft/cdcconfig/monitor/jobfailure/mapper/JobFailureEventMapper.java` | `CDC_JOB_FAILURE_EVENT` 表只读访问 |
| 日志 Mapper | `backend/src/main/java/com/bsoft/cdcconfig/monitor/jobfailure/mapper/JobFailureHandleLogMapper.java` | `CDC_JOB_FAILURE_HANDLE_LOG` 表只读访问 |
| 客户端 Mapper | `backend/src/main/java/com/bsoft/cdcconfig/monitor/jobfailure/mapper/CdcClientMultipleMapper.java` | `CDC_CLIENT_MULTIPLE` 表只读访问 |
| 数据源 Mapper | `backend/src/main/java/com/bsoft/cdcconfig/datasource/mapper/DataSourceMapper.java` | `CDC_DATA_SOURCE` 表只读访问（来自 datasource 模块） |

### 7.3 后端 — 实体

| 层次 | 文件 | 职责 |
|---|---|---|
| 故障事件实体 | `backend/src/main/java/com/bsoft/cdcconfig/monitor/jobfailure/entity/JobFailureEvent.java` | `@TableName("CDC_JOB_FAILURE_EVENT")` |
| 处理日志实体 | `backend/src/main/java/com/bsoft/cdcconfig/monitor/jobfailure/entity/JobFailureHandleLog.java` | `@TableName("CDC_JOB_FAILURE_HANDLE_LOG")` |
| 客户端实体 | `backend/src/main/java/com/bsoft/cdcconfig/monitor/jobfailure/entity/CdcClientMultiple.java` | `@TableName("CDC_CLIENT_MULTIPLE")` |
| 数据源实体 | `backend/src/main/java/com/bsoft/cdcconfig/datasource/entity/DataSource.java` | `@TableName("CDC_DATA_SOURCE")`，含 `fgActive` 字段 |

### 7.4 后端 — VO、Query、Enum

| 层次 | 文件 | 职责 |
|---|---|---|
| 概览 VO | `backend/src/main/java/com/bsoft/cdcconfig/monitor/jobfailure/vo/JobFailureSummaryVO.java` | 概览页响应，含 `latestRecoveryTime` |
| 详情 VO | `backend/src/main/java/com/bsoft/cdcconfig/monitor/jobfailure/vo/FaultProcessDetailVO.java` | 故障过程详情响应 |
| 摘要 VO | `backend/src/main/java/com/bsoft/cdcconfig/monitor/jobfailure/vo/FaultProcessSummaryVO.java` | 历史故障过程摘要 |
| 链节点 VO | `backend/src/main/java/com/bsoft/cdcconfig/monitor/jobfailure/vo/JobChainVO.java` | 物理 Job 链节点 |
| 事件卡片 VO | `backend/src/main/java/com/bsoft/cdcconfig/monitor/jobfailure/vo/EventCardVO.java` | 故障事件卡片 |
| 时间线 VO | `backend/src/main/java/com/bsoft/cdcconfig/monitor/jobfailure/vo/HandleTimelineVO.java` | 处理时间线条目 |
| 异常 VO | `backend/src/main/java/com/bsoft/cdcconfig/monitor/jobfailure/vo/AnomalyVO.java` | 数据异常描述 |
| CLOB VO | `backend/src/main/java/com/bsoft/cdcconfig/monitor/jobfailure/vo/ClobDetailVO.java` | CLOB 懒加载响应 |
| 概览查询 | `backend/src/main/java/com/bsoft/cdcconfig/monitor/jobfailure/query/JobFailureSummaryQuery.java` | 概览查询参数 |
| 历史查询 | `backend/src/main/java/com/bsoft/cdcconfig/monitor/jobfailure/query/HistoryQuery.java` | 历史查询参数（含 `@DateTimeFormat`） |
| 记录状态枚举 | `backend/src/main/java/com/bsoft/cdcconfig/monitor/jobfailure/enums/RecordStatus.java` | 9 种内部记录状态（见 §11.2） |
| 过程结果枚举 | `backend/src/main/java/com/bsoft/cdcconfig/monitor/jobfailure/enums/FaultProcessResult.java` | 3 种内部过程结果（见 §11.2） |
| 异常类型枚举 | `backend/src/main/java/com/bsoft/cdcconfig/monitor/jobfailure/enums/AnomalyType.java` | 6 种异常类型 |
| 事件有效性枚举 | `backend/src/main/java/com/bsoft/cdcconfig/monitor/jobfailure/enums/EventValidity.java` | 事件有效性 |
| CLOB 字段枚举 | `backend/src/main/java/com/bsoft/cdcconfig/monitor/jobfailure/enums/ClobFieldType.java` | CLOB 字段类型 |
| 错误码 | `backend/src/main/java/com/bsoft/cdcconfig/monitor/jobfailure/exception/JobFailureErrorCode.java` | 统一错误码和异常工厂 |

### 7.5 后端 — 算法包（`algorithm/`，13 个类）

| 类 | 文件 | 职责 |
|---|---|---|
| `FaultEventModel` | `backend/src/main/java/com/bsoft/cdcconfig/monitor/jobfailure/algorithm/FaultEventModel.java` | 故障事件领域模型，含 `isInvalid()`/`isStale()`/`isMainChainEligible()` |
| `FaultLogModel` | `backend/src/main/java/com/bsoft/cdcconfig/monitor/jobfailure/algorithm/FaultLogModel.java` | 处理日志领域模型，含 `isStableCheckPassed()`/`isSubmitSucceeded()`/`isRestartStarted()` |
| `FaultProcessGrouper` | `backend/src/main/java/com/bsoft/cdcconfig/monitor/jobfailure/algorithm/FaultProcessGrouper.java` | 事件分组：BFS 在 NEW_JOB_ID→FAILED_JOB_ID 图上找连通分量 |
| `FaultProcessGroup` | `backend/src/main/java/com/bsoft/cdcconfig/monitor/jobfailure/algorithm/FaultProcessGroup.java` | 单个故障过程的聚合容器，含 `countRestarts()` |
| `MainChainFilter` | `backend/src/main/java/com/bsoft/cdcconfig/monitor/jobfailure/algorithm/MainChainFilter.java` | 主链/排除链分类 |
| `JobChainBuilder` | `backend/src/main/java/com/bsoft/cdcconfig/monitor/jobfailure/algorithm/JobChainBuilder.java` | 物理 Job 链构建 |
| `JobChainNode` | `backend/src/main/java/com/bsoft/cdcconfig/monitor/jobfailure/algorithm/JobChainNode.java` | Job 链节点（含 `ChainNodeType` 枚举） |
| `FaultProcessAssembler` | `backend/src/main/java/com/bsoft/cdcconfig/monitor/jobfailure/algorithm/FaultProcessAssembler.java` | 管线编排：grouper→filter→builder→resolver→detector |
| `AnomalyDetector` | `backend/src/main/java/com/bsoft/cdcconfig/monitor/jobfailure/algorithm/AnomalyDetector.java` | 数据异常检测（分叉、断链、环、多父等） |
| `AnomalyInfo` | `backend/src/main/java/com/bsoft/cdcconfig/monitor/jobfailure/algorithm/AnomalyInfo.java` | 异常信息值对象 |
| `RecordStatusResolver` | `backend/src/main/java/com/bsoft/cdcconfig/monitor/jobfailure/algorithm/RecordStatusResolver.java` | 内部记录状态解析：按最新 handle_stage 判定 RecordStatus |
| `FaultProcessResultResolver` | `backend/src/main/java/com/bsoft/cdcconfig/monitor/jobfailure/algorithm/FaultProcessResultResolver.java` | 内部过程结果解析：按 STABLE_CHECK_PASSED 和异常判定 |
| `TimeCalculator` | `backend/src/main/java/com/bsoft/cdcconfig/monitor/jobfailure/algorithm/TimeCalculator.java` | 时间计算工具（持续时长、恢复时间） |

### 7.6 前端

| 层次 | 文件 | 职责 |
|---|---|---|
| 路由 | `frontend/src/router/index.ts` | 路由配置：概览、最近故障详情、指定历史故障过程详情（复用 `detail.vue`） |
| 概览页 | `frontend/src/views/monitor/job-failure/index.vue` | 故障监控总览：客户端卡片、表格、筛选、自动刷新 |
| 详情页 | `frontend/src/views/monitor/job-failure/detail.vue` | 故障过程详情：概览、Job 链、事件、重启卡片、历史 |
| 故障概览 | `frontend/src/views/monitor/job-failure/components/FaultProcessOverview.vue` | 故障概览网格，含硬编码 `RECOVERY_RECORDED → '已恢复'` 映射 |
| Job 链 | `frontend/src/views/monitor/job-failure/components/PhysicalJobChain.vue` | 物理 Job 链：单行横向滚动，红/绿标记 |
| 事件列表 | `frontend/src/views/monitor/job-failure/components/FailureEventList.vue` | 事件列表：ID 截断（≤16 完整，>16 前6…后8） |
| 重启卡片 | `frontend/src/views/monitor/job-failure/components/RestartCards.vue` | 恢复尝试卡片：按 RESTART_STARTED 分组 |
| 历史故障 | `frontend/src/views/monitor/job-failure/components/FaultHistory.vue` | 历史故障：时间范围下拉（最近一天/最近一周/最近一个月），固定 `pageSize=1000` |
| CLOB 弹窗 | `frontend/src/views/monitor/job-failure/components/ClobDetailDialog.vue` | CLOB 详情弹窗：按需加载，复制按钮 |
| API 模块 | `frontend/src/api/jobFailure.ts` | 5 个后端 API 的 axios 封装 |
| 类型定义 | `frontend/src/types/jobFailure.ts` | TypeScript 接口定义 |

> 注：`HandleTimeline.vue` 和 `JobFailureSummaryTable.vue` 保留在代码中但已不被使用。

### 7.7 路由与菜单

| 配置 | 文件 | 路径 | 说明 |
|---|---|---|---|
| 路由 | `frontend/src/router/index.ts` | `/monitor/job-failure` | 概览页，路由组 `运行监控` |
| 路由 | `frontend/src/router/index.ts` | `/monitor/job-failure/detail` | 最近一次故障详情页，接收 `clientId`、`dataSourceId` 查询参数 |
| 路由 | `frontend/src/router/index.ts` | `/monitor/job-failure/process/:faultRootId` | 指定历史故障过程详情页，路由名 `JobFailureProcessDetail`，复用 `detail.vue` |
| 菜单 | `frontend/src/config/menu.ts` | `/monitor/job-failure` | 菜单项："故障监控"，图标 `Monitor`，位于 `运行监控` 组 |

前端页面路由与后端 API 路径相互独立，不得混写：最近故障详情前端路由 `/monitor/job-failure/detail?clientId=<clientId>&dataSourceId=<dataSourceId>` 调用 Latest API `/api/job-failure/latest/{clientId}/{dataSourceId}`；指定过程前端路由 `/monitor/job-failure/process/:faultRootId` 调用 Process API `/api/job-failure/process/{faultRootId}`。历史"查看"与"故障监控"首页入口均指向上述详情路由，不提供独立菜单入口。

### 7.8 测试

| 文件 | 类型 | 覆盖范围 |
|---|---|---|
| `backend/src/test/java/com/bsoft/cdcconfig/monitor/jobfailure/service/JobFailureServiceTest.java` | 集成测试 | 5 个 API 全路径 |
| `backend/src/test/java/com/bsoft/cdcconfig/monitor/jobfailure/algorithm/AnomalyDetectorTest.java` | 单元测试 | 异常检测 |
| `backend/src/test/java/com/bsoft/cdcconfig/monitor/jobfailure/algorithm/MainChainFilterTest.java` | 单元测试 | 主链过滤 |
| `backend/src/test/java/com/bsoft/cdcconfig/monitor/jobfailure/algorithm/FaultProcessGrouperTest.java` | 单元测试 | 事件分组 |
| `backend/src/test/java/com/bsoft/cdcconfig/monitor/jobfailure/algorithm/FaultProcessAssemblerTest.java` | 单元测试 | 管线编排 |
| `backend/src/test/java/com/bsoft/cdcconfig/monitor/jobfailure/algorithm/RecordStatusResolverTest.java` | 单元测试 | 状态解析 |
| `backend/src/test/java/com/bsoft/cdcconfig/monitor/jobfailure/algorithm/TestDataFactory.java` | 测试工具 | 测试数据工厂 |
| `backend/src/test/java/com/bsoft/cdcconfig/monitor/jobfailure/compat/OracleDateMappingTest.java` | 集成测试 | Oracle DATE 映射 |

## 8. 页面与能力概览

### 8.1 概览页（Overview）

- **查询区**：客户端（多选下拉）、Job 当前状态（正常/恢复中/离线）、查询/重置按钮（无"数据源 ID"查询条件）
- **自动刷新**：1 分钟 / 60 分钟 / 360 分钟可选，显示最后刷新时间
- **客户端卡片**：按客户端分组，全宽单列，头部显示 `[在线/离线状态圆点 + 文字] 客户端 ID 展开/折叠箭头`（不显示 Job 总数/正常/异常）
- **数据源表格**：严格 6 列（数据源、Job 当前状态、最近故障时间、最近恢复时间、故障期间恢复尝试、操作）；"数据源"列显示 `DATA_SOURCE_ORG`（空值显示"未定义名称"，未激活加红字 `(数据源未激活)`，无记录显示红字 `无效数据源`），悬停 Tooltip 显示完整 `DATA_SOURCE_ID`
- **首次加载**：所有卡片默认展开
- **刷新行为**：保持用户当前的展开/折叠状态
- **卡片排序**：离线客户端 → 在线且存在异常/恢复中 Job → 在线但存在离线 Job → 在线全部正常 → 同层按 clientId 升序
- **详情入口**：仅当存在最近故障时，点击"查看"进入该数据源最近一次故障的详情页（同标签页导航）
- **无故障处理**：无历史故障时，故障相关字段显示 `—`，不显示详情入口
- **ZooKeeper 运行状态融合**：概览页同时使用数据库故障事实与 ZooKeeper `alive` 运行状态；客户端 `alive` 不存在 → 该客户端离线、其下所有 Job 显示"离线"并短路 Job alive 读取；客户端在线、某 Job `alive` 不存在 → 该 Job 显示"离线"；客户端与 Job 均在线 → 使用数据库故障逻辑计算的状态；页面不引入"未知"状态
- **ZK 连接失败错误态**：Summary 无法可靠读取 ZK 时页面进入统一错误态，不把读取异常判定成所有客户端离线，也不显示任何客户端卡片、统计或上次成功的旧数据；等待期间动态显示"ZooKeeper 连接失败，将在 {N} 秒后重试"（60～1 秒），到点重试期间显示"正在重新连接 ZooKeeper…"，失败后重新从 60 秒开始；感叹号柔和呼吸动画（`prefers-reduced-motion: reduce` 下关闭动画、保留完整信息）；60 秒自动重试、顶部手动刷新（点击立即重试）与页面常规自动刷新周期相互独立且共享请求在途保护；成功后清除错误态并恢复客户端卡片
- **集群连接目标诊断**：ZK 错误态倒计时下方通过 `GET /api/monitor/zookeeper/health` 展示运行时生效的完整"集群地址"（connectString）与"根路径"（rootPath），单错误生命周期只请求一次；集群连接串展示全部逗号分隔地址，不表示某一台是"当前连接节点"，也不据此断言单台服务宕机；加载失败或空值有降级显示（"未配置"/"连接配置信息获取失败"）；`health.connected` 不覆盖 Summary 错误态；页面不展示 health 内部错误消息与敏感配置；两个字段提供复制按钮，复制完整原始值（HTTPS/localhost 安全上下文优先使用 Clipboard API，局域网 HTTP 非安全上下文使用同步临时 textarea + `document.execCommand('copy')` 兼容回退——仅作为当前局域网 HTTP 部署的兼容回退路径，不作为全局推荐方案），成功/失败有反馈、同类提示合并、临时 DOM 会清理且不影响倒计时和请求

### 8.2 详情页（Detail）

- **两种访问模式**：同一个 `detail.vue` 支持两种模式——最近一次故障（前端路由 `/monitor/job-failure/detail?clientId=<clientId>&dataSourceId=<dataSourceId>`，调用 Latest API `/api/job-failure/latest/{clientId}/{dataSourceId}`）与指定历史故障过程（前端路由 `/monitor/job-failure/process/:faultRootId`，路由名 `JobFailureProcessDetail`，调用 Process API `/api/job-failure/process/{faultRootId}`）。前端页面路由与后端 API 路径相互独立
- **故障概览**：2×3 网格（客户端、数据源、本次故障处理结果 / 首次失败时间、最近处理时间、处理概况）；根事件 ID 不占用网格，只在详情页标题展示（过长缩略 + Tooltip 完整 + 复制按钮）
- **Job 重启轨迹**：单行横向滚动，红色（异常标记）/绿色（正常）节点
- **故障发生明细**：主链事件表格，5 列（故障事件 ID、发生故障的 Job ID、故障时间、事件处理结果、操作），ID 截断（≤16 字符完整显示，>16 字符显示前6…后8）；未计入本次故障的事件单独成表展示
- **恢复尝试卡片**：以 `RESTART_STARTED` 日志为界分组，每组一张卡片，绿色（含 STABLE_CHECK_PASSED）/红色（无），升序排列
- **故障历史**：时间范围下拉（最近一天/最近一周/最近一个月），不显示传统分页组件，所选范围内的全部符合条件记录必须可见；"查看"为真实链接，普通点击在当前标签页打开指定过程，支持浏览器原生 Ctrl/Cmd+单击、中键、右键菜单新开标签页，URL 可复制、可刷新、可后退/前进，打开后回到详情顶部
- **精确 ID**：历史链接、路由参数与 Process API 请求均使用 `faultRootIdText` 精确字符串，不经 JavaScript number 中转，超出安全整数范围的根事件 ID 仍逐字符精确
- **CLOB 详情**：弹窗按需加载，支持复制

## 9. 接口概览

| API | 方法 | 路径 | 说明 |
|---|---|---|---|
| API-1 | GET | `/api/job-failure/summary` | 故障汇总：按逻辑 Job 返回最新故障概况 |
| API-2 | GET | `/api/job-failure/latest/{clientId}/{dataSourceId}` | 最新故障：指定逻辑 Job 的最近一次故障过程详情 |
| API-3 | GET | `/api/job-failure/history/{clientId}/{dataSourceId}` | 历史故障：按时间范围查询，需 `startTime`/`endTime` |
| API-4 | GET | `/api/job-failure/process/{faultRootId}` | 故障过程详情：按 `faultRootId` 查询任意一次故障过程 |
| API-5 | GET | `/api/job-failure/clob/{faultRootId}/{clobField}/{recordId}` | CLOB 内容：按需懒加载，`recordId` 用于校验记录归属 |
| API-6 | GET | `/api/monitor/zookeeper/health` | ZooKeeper 连接健康检查：只读返回运行时生效的集群地址（connectString）、根路径（rootPath）与连接状态，供概览页 ZK 错误态诊断展示 |

所有接口均返回 `ApiResponse<T>` 统一响应格式（code/message/data）。

> 注：Summary API（API-1）的响应除数据库故障事实外，还携带 ZooKeeper 运行状态融合结果（客户端/Job 在线、离线）；`/api/monitor/zookeeper/health`（API-6）单独提供连接目标与健康信息，不读取业务节点数据。

## 10. 核心业务对象

### 10.1 逻辑 Job

```
逻辑 Job = (CLIENT_ID, DATA_SOURCE_ID)
```

两个字段联合唯一确定一个"数据源"（即概览页展示的数据源对象）。主集合来源为 `CDC_CLIENT_MULTIPLE` 表中 `FG_ACTIVE = '1'` 的记录。

### 10.2 物理 Job ID

Flink 作业的唯一标识（32 位 hex 字符串），存储在 `FAILED_JOB_ID` 和 `NEW_JOB_ID` 字段中。一次故障过程中可能产生多个物理 Job ID（失败 → 重启 → 新 Job）。

与 ZK 中的 `jobName` 是两套独立标识体系，不建立直接逻辑关系。

### 10.3 故障事件

`CDC_JOB_FAILURE_EVENT` 中的一条记录，代表一次 Flink Job 失败回调。关键字段：`FAILED_JOB_ID`（失败的物理 Job ID）、`FAILURE_TIME`（失败发生时间）、`EVENT_RESULT`（ACCEPTED / IGNORED_INVALID / IGNORED_STALE）。

### 10.4 故障过程

一次故障过程由同属于一个逻辑 Job 的、通过 `NEW_JOB_ID` → `FAILED_JOB_ID` 关系可达的所有故障事件组成的连通图。

- **起点**：某事件的 `FAILED_JOB_ID` 在前序事件中从未作为 `NEW_JOB_ID` 出现过
- **终点**：存在 `HANDLE_STAGE = STABLE_CHECK_PASSED` 的处理日志则为已闭环；不存在则为未闭环
- **faultRootId**：故障过程中第一条事件（按 `FAILURE_TIME ASC`）的 `ID`

### 10.5 处理日志

`CDC_JOB_FAILURE_HANDLE_LOG` 中的一条记录，对应故障事件处理流程中的一个阶段。关键阶段：

- `RESTART_STARTED`：开始执行重启
- `NEW_JOB_SUBMIT_SUCCEEDED`：新 Job 已提交成功，进入稳定观察
- `STABLE_CHECK_PASSED`：稳定性检查通过，故障过程正式闭环

## 11. 状态体系（概述）

### 11.1 状态层次

本功能的状态分为四个层次：

| 层次 | 状态体系 | 数量 | 用途 |
|---|---|---|---|
| 对外 Job 当前状态 | 正常、恢复中、离线 | 3 种 | 概览页和接口面向用户展示；"离线"由 ZooKeeper `alive` 临时节点存在性判定（客户端/Job alive 不存在），页面不引入"未知"状态 |
| 对外故障过程状态 | 流程异常、恢复失败、重启中、等待重启、已恢复 | 5 种 | 详情页和接口面向用户展示 |
| 内部计算结果 | `FaultProcessResult` | 3 种 | 后端内部计算 |
| 内部记录状态 | `RecordStatus` | 9 种 | 处理日志和流程阶段识别 |

内部状态（3+9）用于后端计算和阶段识别，不得未经映射直接作为对外最终状态。

### 11.2 内部状态定义（代码证据）

**`FaultProcessResult`**（定义文件：`backend/src/main/java/com/bsoft/cdcconfig/monitor/jobfailure/enums/FaultProcessResult.java`）：

| 枚举值 | 中文标签 | 代码语义 |
|---|---|---|
| `RECOVERY_RECORDED` | 已记录恢复 | 存在 `STABLE_CHECK_PASSED` 且无数据异常 |
| `NOT_CLOSED` | 记录未闭环 | 无 `STABLE_CHECK_PASSED` 且无数据异常 |
| `DATA_ANOMALY` | 数据异常 | 存在结构异常（分叉/断链/环/多父等） |

**`RecordStatus`**（定义文件：`backend/src/main/java/com/bsoft/cdcconfig/monitor/jobfailure/enums/RecordStatus.java`）：

| 枚举值 | 中文标签 | 触发 handle_stage |
|---|---|---|
| `WAITING_RESTART` | 等待重启 | `RESTART_SCHEDULED` |
| `RESTARTING` | 正在重启 | `RESTART_STARTED` |
| `STABILITY_OBSERVING` | 稳定观察中 | `NEW_JOB_SUBMIT_SUCCEEDED` |
| `RECOVERY_RECORDED` | 已记录恢复 | `STABLE_CHECK_PASSED` |
| `SUBMIT_FAILED` | 本次提交失败 | `NEW_JOB_SUBMIT_FAILED` |
| `RESTART_SKIPPED` | 计划已跳过 | `SCHEDULED_RESTART_SKIPPED` |
| `IGNORED` | 已忽略 | `JOB_FAILURE_IGNORED_INVALID` / `*_STALE` / `DUPLICATED_EVENT_IGNORED` |
| `NOT_CLOSED` | 记录未闭环 | `JOB_FAILURE_RECEIVED` 且无 `STABLE_CHECK_PASSED` |
| `DATA_ANOMALY` | 数据异常 | 存在结构异常 |

主要使用位置：
- `RecordStatusResolver.resolve()` — 按最新 handle_stage 判定 RecordStatus
- `FaultProcessResultResolver.resolve()` — 按 STABLE_CHECK_PASSED 和异常判定 FaultProcessResult
- `JobFailureServiceImpl.toDetailVO()` / `toSummaryVO()` — 将内部状态写入 VO 并直接返回前端

### 11.3 外部状态到内部状态的映射（需求，优先级顺序）

| 优先级 | 对外状态 | 判定条件 | 使用的内部证据 | 当前实现 |
|---|---|---|---|---|
| 1 | `流程异常` | 存在结构异常 | `DATA_ANOMALY` | 已实现但直接透传内部枚举 |
| 2 | `已恢复` | 存在 `STABLE_CHECK_PASSED`，无异常 | `RECOVERY_RECORDED` | 已实现但直接透传内部枚举 |
| 3 | `等待重启` | 最新处理阶段为 `RESTART_SCHEDULED` | `WAITING_RESTART` | 内部状态已产生，映射层未实现 |
| 4 | `重启中` | 最新阶段为 `RESTART_STARTED` 或 `NEW_JOB_SUBMIT_SUCCEEDED` | `RESTARTING` 或 `STABILITY_OBSERVING` | 内部状态已产生，映射层未实现 |
| 5 | `恢复失败` | 正式精确判定条件待实现，不得使用"其他情况"兜底 | `SUBMIT_FAILED`、`RESTART_SKIPPED`、部分 `NOT_CLOSED` 仅为候选证据，不足以唯一确定"恢复失败" | GAP-STATUS-003 |

### 11.4 关键语义边界

- `NEW_JOB_SUBMIT_SUCCEEDED` 只表示新 Job 已提交并进入稳定观察，**不能直接认定为"已恢复"**；
- `NEW_JOB_SUBMIT_SUCCEEDED` 后未出现 `STABLE_CHECK_PASSED` **不等于"恢复失败"**，此时应映射为"重启中"；
- 只有 `STABLE_CHECK_PASSED` 才构成正式恢复闭环，对应"已恢复"状态。

### 11.5 当前实现的状态透传问题

代码中 `FaultProcessResult`（3 种）和 `RecordStatus`（9 种）通过 VO 直接返回前端：
- `JobFailureServiceImpl.toDetailVO()` 第 450-456 行：`vo.setRecordStatus(status.name())` + `vo.setFaultProcessResult(result.name())`
- 前端 `FaultProcessOverview.vue` 硬编码 `RECOVERY_RECORDED → '已恢复'`，其余状态透传 `recordStatusLabel`
- 前端 `FaultHistory.vue` 同上的硬编码映射

这导致页面显示的是内部状态的直接中文映射（如"已记录恢复""记录未闭环""本次提交失败"等），而非 5 种正式对外状态。

**当前代码尚未实现统一的内部→对外映射层**，五种对外状态在代码中并未严格互斥——`SUBMIT_FAILED`、`RESTART_SKIPPED`、`NOT_CLOSED` 等内部状态各自独立对外返回，未合并为统一的"恢复失败"。五种状态必须互斥是正式需求（见 REQUIREMENTS.md §9.4.1），当前实现尚未满足。

## 12. 异常链处理

### 12.1 检测的异常类型

| 异常类型 | 说明 |
|---|---|
| `FORK` | 一个 `NEW_JOB_ID` 指向多个 `FAILED_JOB_ID`（分叉） |
| `MULTI_PARENT` | 一个 `FAILED_JOB_ID` 被多个 `NEW_JOB_ID` 指向（多父节点） |
| `BROKEN_CHAIN` | `FAILED_JOB_ID` 链中存在无法连接的断点 |
| `LOOP` | 链中出现循环引用 |
| `DUPLICATE_EDGE` | 重复的关联边 |
| `ORPHAN_LOG` | 处理日志无法关联到任何事件 |

### 12.2 处理规则

- 异常链仍然展示，不隐藏不跳过；
- 无限遍历通过 BFS 已访问集合防护；
- 存在异常时，内部 `FaultProcessResult` 可能被设为 `DATA_ANOMALY`，对外映射为 `流程异常`；
- 异常信息通过 `AnomalyVO` 列表随详情接口返回。

### 12.3 IGNORED_* 事件处理

`EVENT_RESULT` 为 `IGNORED_INVALID` 或 `IGNORED_STALE` 的事件：
- 不参与主链（main chain），被归入排除事件列表；
- 不参与有效故障链统计；
- `FaultEventModel.isMainChainEligible()` 返回 `false`。

## 13. 当前实现与需求基线的差距清单

| 差距编号 | 类别 | 需求 | 当前实现 | 影响 |
|---|---|---|---|---|
| GAP-FILTER-001 | 数据过滤 | `CDC_DATA_SOURCE` 须过滤 `FG_ACTIVE = '1'` | `DataSourceMapper.selectBatchIds()` 未添加 FG_ACTIVE 过滤；概览页范围内由页面例外规则替代（§4.2/§4.3），GAP-FILTER-001 在概览页范围已关闭 | 停用数据源可能被展示 |
| GAP-STATUS-001 | 对外状态 | 对外故障过程状态须为 5 种正式状态，内部枚举不得直接对外返回 | 代码中 `FaultProcessResult`（3 种）和 `RecordStatus`（9 种）通过 VO 直接返回前端 | 页面状态标签与正式需求不一致 |
| GAP-STATUS-002 | 状态映射 | 须实现统一的内部→对外映射层 | 前端硬编码 `RECOVERY_RECORDED → '已恢复'`，其余透传 `recordStatusLabel` | 映射不完整、不统一 |
| GAP-STATUS-003 | 恢复失败判定 | 须实现"恢复失败"的统一判定规则 | 代码不存在"恢复失败"概念。`SUBMIT_FAILED`、`RESTART_SKIPPED`、部分 `NOT_CLOSED` 仅为候选证据，从当前代码无法唯一确定"恢复失败"的精确判定条件，不得使用"其他情况"兜底 | "恢复失败"对外状态当前无对应实现 |
| GAP-HISTORY-001 | 历史全量返回 | 无传统分页组件，所选时间范围内全部记录可见 | 前端固定 `pageSize=1000`（`FaultHistory.vue` 第 148 行），后端服务端分页 | 超过 1000 条时可能静默截断 |

> 注：ZooKeeper 运行状态融合（`GAP-OVERVIEW-ZK-STATUS-001`）、集群连接目标诊断（`GAP-OVERVIEW-ZK-CONNECTION-TARGET-001`）、重试倒计时（`GAP-OVERVIEW-ZK-RETRY-COUNTDOWN-001`）与概览整体收口（`GAP-OVERVIEW-001`）均已关闭，关闭原因与历史说明见 REQUIREMENTS.md §19，不再作为未完成差距列入上表。

## 14. 运行与维护约束

- **分支**：仅 `develop` 分支开发
- **数据只读**：不写入任何业务数据
- **ZooKeeper 只读**：概览页只读判断 `alive` 临时节点存在性以补充在线/离线运行状态（客户端离线时短路，不读取其 Job alive），不写 ZooKeeper、不创建或删除节点；本功能其余数据完全基于数据库查询
- **表只插不更不删**：两张故障表由 CDC 同步程序维护，管理平台不得修改
- **无认证**：当前无用户认证机制

## 15. 相关文档

- [REQUIREMENTS.md](REQUIREMENTS.md) — 需求基线（可执行、可验收的业务规则，正式需求依据）
- [ARCHITECTURE.md](../../baseline/ARCHITECTURE.md) — 系统架构（§6 Job 故障监控数据模型）
- [PROJECT.md](../../baseline/PROJECT.md) — 项目总览
- [PROJECT_STATUS.md](../../baseline/PROJECT_STATUS.md) — 项目状态快照
- [DOMAIN_GLOSSARY.md](../../baseline/DOMAIN_GLOSSARY.md) — 领域词汇表（§Job 故障监控领域）
- [DEVELOPMENT_RULES.md](../../baseline/DEVELOPMENT_RULES.md) — 开发规则
- [CLAUDE.md](../../../CLAUDE.md) — Agent 开发规范
