# ARCHITECTURE — 系统架构（项目级基线）

> 文档状态：`APPROVED`
> 批准任务：PROJECT-BASELINE-APPROVAL-CLOSEOUT-001
> 批准日期：2026-08-27
> 批准内容提交：b054718130bbe922f2e26b79b3ee946290949ef1
> 批准依据：ChatGPT 第二轮复审 PASS + 用户明确正式批准
> 恢复任务：PROJECT-BASELINE-AND-DOCUMENTATION-RECOVERY-001
> 恢复日期：2026-08-27
> 恢复任务执行基线：6dc22ecd67b7268ae3ee4761f5412c1e7b50ce5c
> 恢复草案首次入库提交：a6f51f8a8ff984bc946a4e2ccaccbf56692722fe
> 本轮修订任务：PROJECT-BASELINE-DOCUMENTATION-REVIEW-FIX-001（结果提交见本轮实施报告）
> 来源：服务器既有候选（docs/baseline/ 未提交文件，原 BASELINE-001/002 与 DATABASE-CODE-MAPPING-001 Phase 2 固化）+ 恢复任务修订 + 本轮复审修订，对齐当前代码与已批准数据库基线
> 首次草拟：2026-08-12

基线日期: 2026-08-27（恢复草案，历史草稿 2026-08-12）
基线来源: `BASELINE-001` 盘点 + R1/R2 修订 → `BASELINE-002` → `DATABASE-CODE-MAPPING-001` Phase 2 固化 → 本任务恢复并修订
维护触发: 技术栈升级、模块重组、重大架构变更、数据库对象/映射/关系变更（详见 §4.9）

---

## 1. 项目定位

CDC配置管理平台是一个 **Oracle CDC配置维护和运行监控Web平台**，不替代现有CDC同步程序。

功能分为两大模块（产品/项目目标范围）：
- 配置管理（4项）：数据源管理、客户端配置、数据订阅、服务端配置
- 运行监控（7项，含大屏）：CDC节点状态、数据源运行状态、Topic偏移量、日志查询、故障监控、故障历史、数据同步统计大屏

菜单 Git 事实与本地候选：Git 已提交菜单为 **2 组 10 项**（配置管理 4 + 运行监控 6，不含大屏入口）；大屏 standalone 路由 `/large-screen` 已提交；大屏菜单入口仅存在于工作区未提交的 `menu.ts` 修改中（本地候选，未提交），不作为 Git 可复核事实。

来源: CLAUDE.md、menu.ts（Git 已提交 10 项 / 工作区本地候选 11 项）、router/index.ts、docs/product/modules.md

---

## 2. 技术架构总览

```
浏览器 (Vue 3 SPA)
  ├── /api/* → Vite Dev Proxy → localhost:8080 (开发)
  └── / → SPA静态资源，由Spring Boot serve (当前部署方式)

Spring Boot 2.7.18 (Tomcat, Port 8080)
  ├── MyBatis-Plus 3.5.3.1 → Oracle 19c (192.168.174.65:1521)
  ├── Curator 2.13.0 → ZK 3.4.14
  └── 内置统计调度器 (ThreadPoolTaskScheduler)
```

### 2.1 后端分层

```
Controller (@RestController) → Service (@Service) → Mapper (BaseMapper<T>)
         ↓                          ↓
     VO/DTO/Query              Entity (→ Oracle Table)
```

公共组件层: `ApiResponse<T>`, `PageResult<T>`, `BusinessException`, `GlobalExceptionHandler`

### 2.2 前端分层

```
Views (页面组件) → API/Services (axios封装) → Backend API
    ↓
Components (可复用组件) + Stores (Pinia状态管理)
    ↓
Router (Vue Router 4) + Layouts (MainLayout)
```

来源: 代码包结构、03_CURRENT_IMPLEMENTATION_AUDIT.md

---

## 3. 模块关系

### 3.1 后端模块

```
com.bsoft.cdcconfig
├── common/          # ApiResponse, PageResult, BusinessException, GlobalExceptionHandler
├── config/          # CORS, MyBatis-Plus, OpenAPI (SpringDoc), SpaForwardFilter
├── health/          # HealthController — GET /api/health
├── datasource/      # DataSourceController — /api/data-sources CRUD + 启停
├── monitor/
│   ├── zookeeper/   # ZooKeeperMonitorController — /api/monitor/zookeeper
│   └── jobfailure/  # JobFailureController — /api/job-failure (含algorithm包)
├── logquery/        # LogQueryController — /api/log-query (游标分页 + XML Mapper)
└── largescreen/
    └── stats/       # LargeScreenController — /api/large-screen (含stats包)
```

### 3.2 前端模块

```
src/
├── api/             # API层: monitor.ts, jobFailure.ts, largeScreen.ts, logQuery.ts
├── stores/          # Pinia状态: app.ts
├── router/          # Vue Router: 15条 Route Record（1条根路径重定向 + 14条具名页面路由）
├── config/          # menu.ts: Git 已提交菜单 2组10项；工作区本地候选含大屏入口（11项，未提交）
├── layouts/         # MainLayout.vue, HeaderBar.vue, Sidebar.vue
├── components/      # PlaceholderPage.vue、ClientCard.vue等可复用组件
├── views/
│   ├── cdc-node-status/     # ZK客户端监控页
│   ├── monitor/job-failure/ # 故障监控页（index/detail/history/history-list + 子组件）
│   ├── large-screen/        # 数据同步统计大屏（Left/Center/Right + mock-data.ts）
│   ├── log-query/           # 日志查询页（components/composables + 测试）
│   ├── data-source/         # DataSourcePage (占位，后端CRUD已完成)
│   └── ...                  # 其余5个占位页面
```

---

## 4. 数据架构

### 4.1 数据库对象清单

当前管理平台生产代码实际使用 **14 张数据库表**，按功能域分组如下。

**数据源管理（2 张）**：

| 表 | 行数 | 读写 | 说明 |
|---|---|---|---|
| CDC_DATA_SOURCE | 19 | 读+写（CRUD+启停） | 数据源主表，DATA_SOURCE_ID 为业务主键 |
| CDC_DATA_SOURCE_EXTEND | 10 | 读+写（随 DataSource 联写，旧候选实现） | 源库到目标库的命名策略（目标表命名策略：前缀/后缀/合并策略）；源库 0..N，第一版由后端保存前校验逻辑联合唯一，不新增 DDL |

**Job 故障监控（3 张）**：

| 表 | 行数（开发库 2026-08-26） | 读写 | 说明 |
|---|---|---|---|
| CDC_JOB_FAILURE_EVENT | 28 | 只读（sync-client 写入） | 故障事件记录，含 CLOB 详情的 FAILURE_DETAIL |
| CDC_JOB_FAILURE_HANDLE_LOG | 116 | 只读（sync-client 写入） | 故障处理记录，18 字段完整链路 |
| CDC_CLIENT_MULTIPLE | 7 | 只读（人工维护） | 客户端/探针列表，DATA_SOURCE_ID 为逗号分隔多值弱逻辑引用 |

**日志源数据（2 张，两条只读链路）**：

`CDC_LOG_CORRECT` 与 `CDC_LOG_ERROR` 为同步日志表，管理平台只读，存在两条独立读路径：① 日志查询页经 `LogQueryMapper` + `mapper/logquery/LogQueryMapper.xml` 游标分页只读检索；② 大屏增量统计经 `LogBatchReader`（JdbcTemplate）批量读取并在内存聚合。不得将两张日志表概括为"仅通过 JdbcTemplate 读取"。

| 表 | 行数 | 读写 | 说明 |
|---|---|---|---|
| CDC_LOG_CORRECT | ~3,819,479 | 只读（日志查询 XML 游标分页 + 大屏统计 JdbcTemplate） | 同步正确日志，日志查询源数据 + 统计源数据 |
| CDC_LOG_ERROR | 442 | 只读（同上双路径） | 同步错误日志，日志查询源数据 + 统计源数据 |

**大屏统计 — 调度写入（5 张，含水位）**：

| 表 | 行数 | 读写 | 说明 |
|---|---|---|---|
| CDC_STATS_CUMULATIVE_OVERVIEW | 1 | 写（MERGE）+读 | 累计总览统计 |
| CDC_STATS_DAILY_OVERVIEW | 3 | 写（MERGE）+读 | 每日总览统计 |
| CDC_STATS_DIM_CUMULATIVE | 13 | 写（MERGE）+读 | 维度累计统计 |
| CDC_STATS_DIM_DAILY | 17 | 写（MERGE）+读 | 维度每日统计 |
| CDC_STATS_WATERMARK | 2 | 读+写（CAS） | 统计水位（CORRECT/ERROR 独立），无 @TableId |

**大屏统计 — API 读取（额外 1 张 + 跨域复用）**：

| 表 | 行数 | 读写 | 说明 |
|---|---|---|---|
| CDC_DATA_SUBSCRIBE | 12 | 只读 | 订阅配置，用于大屏维度映射。目标规则 DATA_SUB_ID 应为主键，当前未设置 |

**任务配置（1 张，纯后端调度）**：

| 表 | 行数 | 读写 | 说明 |
|---|---|---|---|
| CDC_STATS_TASK_CONFIG | 1 | 只读 | 统计任务配置（TASK_CODE='LARGE_SCREEN_STATS'） |

大屏统计 API 读取链路共计访问 8 张表（上述 4 张结果表 + WATERMARK + CCM + SUBSCRIBE + DATA_SOURCE），调度读取 4 张源表（TASK_CONFIG + LOG_CORRECT + LOG_ERROR + WATERMARK），调度写入 5 张结果表（含 WATERMARK CAS 更新）。

已废弃对象 `CDC_CLIENT` 不在上述清单中，不作为当前有效设计对象。

> 详细证据：`docs/baseline-work/DATABASE-CODE-MAPPING-001/01_USED_DATABASE_OBJECTS.md`、`02_DATABASE_CODE_MATRIX.md`

### 4.2 数据访问层映射

| 访问方式 | 数量 | 说明 |
|---|---|---|
| Entity 类 | 12 | 对应 12 张有 Entity 的表（CDC_LOG_CORRECT、CDC_LOG_ERROR 无 Entity） |
| BaseMapper 接口 | 12 | 继承 MyBatis-Plus BaseMapper，提供 CRUD |
| 纯查询 Mapper | 1 | `LargeScreenMapper`，仅使用 @Select 注解 SQL，不继承 BaseMapper |
| Mapper 接口合计 | 13 | |
| JdbcTemplate 直接访问 | 2 张表 | CDC_LOG_CORRECT、CDC_LOG_ERROR（无 Entity/BaseMapper） |
| Mapper XML 文件 | 1 | `mapper/logquery/LogQueryMapper.xml`（日志查询游标分页），其余 SQL 通过注解或 BaseMapper 实现 |

> 详细证据：`docs/baseline-work/DATABASE-CODE-MAPPING-001/02_DATABASE_CODE_MATRIX.md`

### 4.3 数据流（端到端）

```
CDC_LOG_CORRECT/ERROR (源日志表)
    │
    ▼
StatsScheduler (ApplicationReadyEvent触发, 从CDC_STATS_TASK_CONFIG读取配置)
    │
    ▼
StatsRoundRunner (加锁, 计算安全上界)
    │
    ▼
RoundExecutor (交替处理CORRECT/ERROR, 逐批执行)
    │
    ▼
BatchTransactionExecutor (@Transactional: 读日志→聚合→写结果→CAS水位)
    │
    ▼
CDC_STATS_CUMULATIVE_OVERVIEW / DAILY_OVERVIEW / DIM_CUMULATIVE / DIM_DAILY
    │
    ▼
LargeScreenController (GET /api/large-screen/dashboard)
    │
    ▼
LargeScreenPage.vue (ECharts大屏, 60s轮询, CSS scale自适应)
```

### 4.4 统计配置

配置存储在 `CDC_STATS_TASK_CONFIG` 表（TASK_CODE=LARGE_SCREEN_STATS）：

| 参数 | 默认值 | 说明 |
|---|---|---|
| startupDelayMinutes | - | 应用启动后延迟启动调度 |
| scheduleIntervalMinutes | 60 | 调度周期间隔 |
| safetyDelayMinutes | - | 计算安全上界的延迟时间 |
| batchSize | 200000 | 初始批量大小，DynamicBatchSizeManager动态调整 [50000, 500000] |
| maxBatchesPerRun | - | 单轮最大批次数 |
| maxRunDurationSeconds | - | 单轮最大运行时长 |

### 4.5 源数据表

- `CDC_LOG_CORRECT`: 同步正确日志。约 381 万行（2026-08-26 数据画像估算），数据量持续变化。
- `CDC_LOG_ERROR`: 同步错误日志。442 行（2026-08-26 数据画像），数据量持续变化。

### 4.6 统计结果表

4张结果表（见 DOMAIN_GLOSSARY 统计表体系）+ 水位表（CORRECT/ERROR独立水位，CAS乐观锁更新）

### 4.7 逻辑数据关系

当前系统使用 **逻辑外键**（代码层引用 + 数据一致性核验），数据库层面无 FOREIGN KEY 约束。共记录 15 条关系（R01～R15）：已确认 12 条、高度可信 3 条、待确认 0 条。不建立物理外键是架构决策，不是缺陷。

**已确认关系（12 条）**：

| # | 来源 → 目标 | 关系类型 | 可空 | 维护方 |
|---|---|---|---|---|
| R01 | CDC_DATA_SOURCE_EXTEND.DATA_SOURCE_ID → CDC_DATA_SOURCE.DATA_SOURCE_ID | `DATA_SOURCE_ID` 到源库的多对一弱逻辑引用；反向一个源库 0..N 条命名策略；`(DATA_SOURCE_ID, TARGET_DATA_SOURCE_ID)` 为逻辑联合唯一组合，第一版仅由后端保存前校验，不新增 DDL | Y | 管理平台（旧候选实现双表联写，待改造） |
| R02 | CDC_DATA_SUBSCRIBE.DATA_FROM_SOURCE_ID → CDC_DATA_SOURCE.DATA_SOURCE_ID | 多值弱逻辑引用（逗号分隔） | Y | 同步程序/管理平台只读 |
| R03 | CDC_DATA_SUBSCRIBE.DATA_TO_SOURCE_ID → CDC_DATA_SOURCE.DATA_SOURCE_ID | 多值弱逻辑引用（逗号分隔） | Y | 同步程序/管理平台只读 |
| R04 | CDC_CLIENT_MULTIPLE.DATA_SOURCE_ID → CDC_DATA_SOURCE.DATA_SOURCE_ID | 多值弱逻辑引用（逗号分隔） | Y | 同步程序/管理平台只读 |
| R05 | CDC_LOG_CORRECT.SOURCE_DATA_SOURCE_ID → CDC_DATA_SOURCE.DATA_SOURCE_ID | 多对一 | Y | 同步程序 |
| R06 | CDC_LOG_CORRECT.TARGET_DATA_SOURCE_ID → CDC_DATA_SOURCE.DATA_SOURCE_ID | 多对一 | Y | 同步程序 |
| R07 | CDC_LOG_ERROR.SOURCE_DATA_SOURCE_ID → CDC_DATA_SOURCE.DATA_SOURCE_ID | 多对一 | Y | 同步程序 |
| R08 | CDC_LOG_ERROR.TARGET_DATA_SOURCE_ID → CDC_DATA_SOURCE.DATA_SOURCE_ID | 多对一 | Y | 同步程序 |
| R09 | CDC_JOB_FAILURE_EVENT.CLIENT_ID → CDC_CLIENT_MULTIPLE.CLIENT_ID | 多对一 | N | 管理平台只读 |
| R10 | CDC_JOB_FAILURE_EVENT.DATA_SOURCE_ID → CDC_DATA_SOURCE.DATA_SOURCE_ID | 多对一 | N | 管理平台只读 |
| R11 | CDC_JOB_FAILURE_HANDLE_LOG.FAILURE_EVENT_ID → CDC_JOB_FAILURE_EVENT.ID | 多对一 | N | 管理平台只读 |
| R15 | CDC_DATA_SOURCE_EXTEND.TARGET_DATA_SOURCE_ID → CDC_DATA_SOURCE.DATA_SOURCE_ID | 目标库弱逻辑引用：一条策略对应一个业务必填目标库，一个目标库可被多个源库策略引用；数据库仍无外键/类别约束 | Y | 管理平台（EXTEND 联写维护该行；TARGET_DATA_SOURCE_ID 字段当前代码未映射，属待改造） |

**高度可信关系（3 条）**：字段类型和值域一致，数据核验 0 空值 0 孤立，但缺少代码级 JOIN 证据直接证明。

| # | 来源 → 目标 | 关系类型 | 可空 |
|---|---|---|---|
| R12 | CDC_STATS_WATERMARK.TASK_CODE → CDC_STATS_TASK_CONFIG.TASK_CODE | 多对一 | N |
| R13 | CDC_JOB_FAILURE_HANDLE_LOG.CLIENT_ID → CDC_CLIENT_MULTIPLE.CLIENT_ID | 多对一 | N |
| R14 | CDC_JOB_FAILURE_HANDLE_LOG.DATA_SOURCE_ID → CDC_DATA_SOURCE.DATA_SOURCE_ID | 多对一 | N |

**特殊关系**：

- **逗号分隔多值弱逻辑引用**（R02/R03/R04）：以逗号分隔字符串存储多个引用值，代码层通过 `.split(",")` 解析，无法使用标准 SQL JOIN。R1 核验确认每条记录至少存在一个可匹配 token。
- **失败 Job ID 链**：CDC_JOB_FAILURE_EVENT.FAILED_JOB_ID 是 Flink 实际 Job ID，不保存在 ZooKeeper 中。ZK 路径 `/bsoft-cdc/clients/{clientId}/{jobName}` 中的 `jobName` 是另一套标识，两者不建立直接逻辑关系。FAILED_JOB_ID 与 NEW_JOB_ID 在 algorithm 包中用于构建作业间故障链。
- **统计水位关系**（R12）：1 个 TASK_CODE 对应 2 条水位记录（CORRECT + ERROR），多对一。
- **源库到目标库命名策略**（R01/R15）：`CDC_DATA_SOURCE_EXTEND` 为源库到目标库的命名策略；`DATA_SOURCE_ID` 表示源库（一个源库 0..N 条策略），`TARGET_DATA_SOURCE_ID` 表示业务必填目标库（一条策略对应一个目标库，一个目标库可被多个源库策略引用）；数据库无物理外键/类别约束。`(DATA_SOURCE_ID, TARGET_DATA_SOURCE_ID)` 为逻辑联合唯一组合，第一版仅由未来后端保存前查询校验，不新增主键、唯一约束、索引或任何 DDL。目标库选择仅来自 `FG_ACTIVE='1' AND DATA_SOURCE_CATEGORY='TARGET'`（Feature 业务规则，不是数据库物理约束）。当前代码 Entity 未映射 `TARGET_DATA_SOURCE_ID`、无代码级 JOIN、`ROWNUM=1` 取单条，均属待改造旧实现。**已批准目标维护边界（尚未实现）**：修改 `CDC_DATA_SOURCE.DATA_SOURCE_ID` 只修改主表当前记录，不同步修改 `CDC_DATA_SOURCE_EXTEND.DATA_SOURCE_ID`、`TARGET_DATA_SOURCE_ID` 或其他表任何引用；删除源库或目标库只物理删除 `CDC_DATA_SOURCE` 当前记录，不检查、不删除、不更新、不级联处理 `CDC_DATA_SOURCE_EXTEND` 或其他表；删除单条命名策略只物理删除对应的 `CDC_DATA_SOURCE_EXTEND` 行。当前代码的 ID 同步、双表联写/级联删除仍是旧候选实现，尚未满足以上目标边界。

> 详细证据：`docs/baseline-work/DATABASE-CODE-MAPPING-001/03_LOGICAL_RELATIONSHIPS.md`

### 4.8 关系维护边界

管理平台对以下数据 **只读，不负责写入或维护**：

| 数据对象 | 实际写入方 | 管理平台角色 |
|---|---|---|
| CDC_CLIENT_MULTIPLE | 人工维护 | 只读（Job 故障监控 + 大屏统计 API） |
| CDC_DATA_SUBSCRIBE | 人工维护 | 只读（大屏统计维度映射） |
| CDC_LOG_CORRECT / CDC_LOG_ERROR | sync-server → Kafka → sync-log 写入 | 只读，两条读路径：日志查询（LogQueryMapper XML 游标分页）+ 大屏统计（JdbcTemplate 批量读取 + 内存聚合） |
| CDC_JOB_FAILURE_EVENT | sync-client 写入 | 只读（故障监控） |
| CDC_JOB_FAILURE_HANDLE_LOG | sync-client 写入 | 只读（故障监控） |
| R09～R11 对应关系 | sync-client 写入 | 只读，不负责维护该关系 |

大屏统计调度任务（StatsScheduler）负责写入 4 张统计结果表和 CAS 更新 WATERMARK 表，这部分由管理平台自身维护。

### 4.9 维护触发条件

以下变更发生时，必须同步更新本架构文档及相关基线：

- 新增或删除生产代码实际使用的数据库表/字段；
- 新增、修改或删除 Entity、Mapper、Service 中涉及数据库访问的代码；
- 新增、修改或删除逻辑关系（含维护方变更）；
- 链路状态变化（如占位页变为完整实现、新 Controller/API 上线）。

> 详细证据：`docs/baseline-work/DATABASE-CODE-MAPPING-001/00_EXECUTION_SUMMARY.md`

来源: DATABASE-CODE-MAPPING-001 第一阶段 (01～04)、stats包、LogBatchReader、StatsTaskConfigLoader

---

## 5. ZK监控数据模型

### 5.1 节点树

```
/bsoft-cdc/clients/
  └── {clientId}/
      ├── alive (临时节点，在线标识)
      └── {jobName}/
          ├── alive (临时节点)
          ├── scn (SCN值)
          └── scnUpdateTime
```

### 5.2 监控规则

- 监控范围: `/bsoft-cdc/clients`（仅clients，不读取servers/signals）
- 操作约束: 严格只读 — `ZooKeeperReadOnlyClient`仅暴露 `getChildren()` 和 `getData()`
- 在线判定: alive-first规则（先检查alive临时节点存在性）
- SCN处理: SCN值独立于alive状态，Job停止后保留SCN值
- SCN过期: 24小时阈值，可环境变量覆盖

### 5.3 API响应模型

```
ZooKeeperClientMonitorResponse
  └── List<ZooKeeperClientVO>
        ├── clientId, alive, displayName...
        └── List<ZooKeeperJobVO>
              ├── jobName, alive, scn, scnUpdateTime, displayName...
```

来源: ZooKeeperMonitorController、ZooKeeperReadOnlyClient、NodeDataParser

---

## 6. Job故障监控数据模型

### 6.1 数据库表

| 表 | 行数（开发库 2026-08-26） | 用途 |
|---|---|---|
| CDC_JOB_FAILURE_EVENT | 28 | 故障事件记录（含CLOB详情的FAILURE_DETAIL） |
| CDC_JOB_FAILURE_HANDLE_LOG | 116 | 故障处理记录（18字段完整链路） |
| CDC_CLIENT_MULTIPLE | 7 | 客户端多数据源（DATA_SOURCE_ID为逗号分隔多值弱逻辑引用） |

### 6.2 核心算法 (algorithm包, 13个类)

```
EventFetcher (读取事件)
    ↓
FaultProcessGrouper (事件分组→故障根识别)
    ↓
JobChainBuilder → MainChainFilter (物理Job链构建+主链过滤)
    ↓
FaultProcessAssembler (故障过程组装)
    ↓
AnomalyDetector + RecordStatusResolver + TimeCalculator (辅助)
    ↓
FaultResultResolver (结果解析)
```

### 6.3 状态系统

- Job当前状态: RUNNING / STOPPED (2种)
- 故障过程状态: 5种（由提示词043 V1.2规格修订引入）

### 6.4 API端点

| 端点 | 功能 |
|---|---|
| GET /api/job-failure/summary | 故障总览（按client分组，7列表格） |
| GET /api/job-failure/latest/{clientId}/{dataSourceId} | 最新故障 |
| GET /api/job-failure/history/{clientId}/{dataSourceId} | 历史故障（时间范围查询，替代分页） |
| GET /api/job-failure/process/{faultRootId} | 故障过程详情 |
| GET /api/job-failure/clob/{faultRootId}/{clobField}/{recordId} | CLOB字段懒加载（3行→按需展开） |

来源: algorithm包、JobFailureController、CDC_JOB_FAILURE_*表

---

## 7. 前端路由与布局

### 7.1 路由定义（共 15 条 Route Record：1 条根路径重定向 + 14 条具名页面路由）

Route Record 清单:

| 路径 | 页面 | 特性 |
|---|---|---|
| / | 重定向到 /config/data-source | - |
| /config/data-source | 数据源管理 | 占位页（后端CRUD已完成） |
| /config/client | 客户端配置 | 占位页 |
| /config/subscribe | 数据订阅 | 占位页 |
| /config/server | 服务端配置 | 占位页 |
| /monitor/cdc-node | CDC节点状态 | MainLayout |
| /monitor/data-source-state | 数据源运行状态 | 占位页 |
| /monitor/topic-offset | Topic 偏移量 | 占位页 |
| /monitor/log-query | 日志查询 | MainLayout |
| /monitor/job-failure | 故障监控总览 | MainLayout |
| /monitor/job-failure/detail | 故障过程详情 | MainLayout |
| /monitor/job-failure/history | 故障历史 | MainLayout |
| /monitor/job-failure/history/list | 数据源故障历史 | MainLayout |
| /monitor/job-failure/process/:faultRootId | 故障过程详情（动态） | MainLayout |
| /large-screen | 数据同步统计大屏 | **standalone（绕过MainLayout全屏渲染）** |

### 7.2 大屏独立路由

`meta.standalone=true` → `App.vue` 条件渲染：standalone路由全屏，否则包裹 MainLayout (HeaderBar + Sidebar + router-view)。

### 7.3 布局组件

- `App.vue`: 根组件，standalone判断
- `MainLayout.vue`: HeaderBar + Sidebar + `<router-view>`
- `Sidebar.vue`: 基于 menu.ts 渲染两组菜单，支持折叠
- `HeaderBar.vue`: 应用名称 + 版本号 (Pinia store)

来源: router/index.ts、App.vue、menu.ts

---

## 8. 部署形态

**当前部署方式**: Spring Boot内嵌Tomcat serve前端SPA静态资源。前端构建产物复制到 `backend/src/main/resources/static/assets/`，JAR包包含全部前端资源。

**路由支持**: SpaForwardFilter 将非 `/api/`、非静态资源请求转发至 `index.html`，支持 Vue Router history 模式。

**开发模式**: Vite Dev Server (5173) + 代理 `/api` → `localhost:8080`。

此为当前实现方式，非永久架构决定。未来可选方案: CI/CD构建、前后端分离部署。

来源: SpaForwardFilter.java、vite.config.ts、application.yml

---

## 9. 已知技术债与限制

| 项目 | 说明 |
|---|---|
| 前端测试刚起步 | 已有 vitest（npm test，log-query 等含组件测试），无 lint 脚本 |
| 前端chunk过大 | LargeScreenPage 1.14MB, index 1.04MB（内网可接受） |
| XML Mapper 极少 | 仅 mapper/logquery/LogQueryMapper.xml（游标分页），其余 SQL 通过注解/BaseMapper |
| 部分Entity缺@TableId | DimCumulativeEntity/DimDailyEntity/StatsWatermarkEntity无@TableId，MyBatis-Plus WARN（差异 D06） |
| CDC_DATA_SUBSCRIBE 无主键 | 目标规则 DATA_SUB_ID 为主键，当前数据库仅 CHECK NOT NULL 约束，代码使用 selectList 不受影响（差异 D01） |
| CDC_DATA_SOURCE_EXTEND 无约束 | 当前物理事实为无主键/唯一约束/索引；已批准第一版明确不新增 DDL（原差异 D02 不再作为“一对一未约束”的高严重度缺陷）；旧后端 `ROWNUM=1` 取单条、未映射 `TARGET_DATA_SOURCE_ID` 属待改造代码差距；重复/孤立/缺失为人工构造容错测试场景 |
| 无认证机制 | 当前无认证，CORS仅dev profile启用 |
| ZK连接验证 | 10.19.16.111:2181 已验证 TCP 可达、会话建立成功（ZK-ENV-001）；192.168.174.51:2181 为旧配置不可达 |
| Curator/ZK依赖兼容性 | pom.xml 已提交 Curator 2.13.0 / ZK 3.4.14，与服务端 3.4.14 的 Java/Curator 层兼容性待应用层独立验证（CLI 只读已验证） |

---

## 10. 文档级变更记录

| 日期 | 变更 | 依据 |
|---|---|---|
| 2026-08-29 | 数据源管理 Feature 已批准规则同步：`CDC_DATA_SOURCE_EXTEND` 由“通用扩展配置、一对一必填”更新为“源库到目标库的命名策略，源库 0..N”；R01 更新为 `DATA_SOURCE_ID` 到源库的多对一弱逻辑引用（反向一个源库 0..N 条策略）；R15 明确一条策略对应一个业务必填目标库、一个目标库可被多个源库策略引用；记录逻辑联合唯一组合 `(DATA_SOURCE_ID, TARGET_DATA_SOURCE_ID)` 仅由后端保存前校验、第一版不新增 DDL；§9 D02 不再描述为“一对一未约束”高严重度缺陷；数据库物理事实与当前旧代码事实保留 | DATA-SOURCE-BASELINE-IMPACT-ALIGNMENT-001（已批准业务规则向权威项目基线同步；纯文档任务，数据库物理结构和当前代码无变化） |
| 2026-08-29 | R1 修订：§4.7“源库到目标库命名策略”补充已批准目标维护边界（修改数据源 ID 只改 `CDC_DATA_SOURCE` 主表当前记录、删除源库/目标库只删主表当前记录且不级联、删除单条命名策略只删对应 `CDC_DATA_SOURCE_EXTEND` 行）；明确上述边界尚未实现、当前 ID 同步/双表联写/级联删除仍为旧候选实现（待改造）；§4.1/§4.7/§9 数据库物理事实与表数、关系数不变 | DATA-SOURCE-BASELINE-IMPACT-ALIGNMENT-001-R1（ChatGPT 复审 CHANGES_REQUIRED 定向修订；纯文档任务） |
