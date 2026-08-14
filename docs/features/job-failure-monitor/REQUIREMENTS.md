# Job 失败事件监控需求基线

## 1. 文档目的

本文件定义 Job 失败事件监控功能的**可执行、可验收的业务规则**。与 [README.md](README.md)（功能概览与实现导航）配合使用。

本文记录经过人工确认的当前业务需求基线。当前实现与本文不一致时，应记录为实现差距；未经人工批准，不得以当前代码覆盖或改变需求基线。需求发生正式变更时，应先完成人工确认，再更新需求基线及相关实现。

**文档分工：**

- `REQUIREMENTS.md`（本文件）：当前正式业务需求依据；
- `README.md`：当前功能定位、实现概览、代码位置和实现差距；
- 当前代码：用于核实现状，不能未经批准覆盖需求基线；
- 实现差距：代码尚未满足正式需求的事实记录。

## 2. 适用范围

- **功能**：Job 失败事件监控的概览、详情、历史查询和 CLOB 懒加载
- **数据**：四张数据库表 — `CDC_JOB_FAILURE_EVENT`、`CDC_JOB_FAILURE_HANDLE_LOG`、`CDC_CLIENT_MULTIPLE`、`CDC_DATA_SOURCE`
- **用户**：CDC 运维和开发人员
- **约束**：只读监控，不提供写操作

## 3. 术语与业务对象

| 编号 | 术语 | 定义 |
|---|---|---|
| JFM-TERM-001 | 逻辑 Job | `(CLIENT_ID, DATA_SOURCE_ID)` 二元组，唯一确定一个"业务库"。主集合来源于 `CDC_CLIENT_MULTIPLE` 表中 `FG_ACTIVE='1'` 的记录 |
| JFM-TERM-002 | 物理 Job ID | Flink 作业的 32 位 hex 唯一标识，存储在 `FAILED_JOB_ID` 和 `NEW_JOB_ID` 字段中。与 ZK jobName 是两套独立标识体系 |
| JFM-TERM-003 | 故障事件 | `CDC_JOB_FAILURE_EVENT` 中的一条记录，代表一次 Flink Job 失败回调 |
| JFM-TERM-004 | 处理日志 | `CDC_JOB_FAILURE_HANDLE_LOG` 中的一条记录，对应处理流程中的一个阶段 |
| JFM-TERM-005 | 故障过程 | 同属一个逻辑 Job 的、通过 `NEW_JOB_ID`→`FAILED_JOB_ID` 关系可达的所有故障事件组成的连通分量 |
| JFM-TERM-006 | faultRootId | 故障过程中第一条事件（按 `FAILURE_TIME ASC`）的 `ID` |
| JFM-TERM-007 | 恢复尝试 | 以一次 `RESTART_STARTED` 处理日志为标志的重启尝试 |

## 4. 页面层级

页面按照以下层级组织数据展示：

```
客户端 → 采集任务 → 失败时间 → 失败处理过程
```

| 编号 | 规则 | 说明 |
|---|---|---|
| JFM-HIER-001 | 第一层：客户端，来源 `CDC_CLIENT_MULTIPLE`（FG_ACTIVE='1'） | 概览页按客户端分组卡片 |
| JFM-HIER-002 | 第二层：采集任务，来源 `CDC_DATA_SOURCE`（FG_ACTIVE='1'） | 每张卡片内按数据源展示业务库表格 |
| JFM-HIER-003 | 第三层：失败时间，来源 `CDC_JOB_FAILURE_EVENT` | 表格中展示最近故障时间，详情页展示事件时间线 |
| JFM-HIER-004 | 第四层：失败处理过程，来源 `CDC_JOB_FAILURE_HANDLE_LOG` | 详情页展示处理时间线、重启尝试和恢复结果 |

## 5. 数据来源与边界

### 5.1 四张表及其职责

| 编号 | 规则 | 说明 |
|---|---|---|
| JFM-DATA-001 | 故障事实数据来自 `CDC_JOB_FAILURE_EVENT` 和 `CDC_JOB_FAILURE_HANDLE_LOG` | Mapper 只读访问。两张表记录原则为只插入、不更新、不删除，由 CDC 同步程序维护 |
| JFM-DATA-002 | 客户端展示范围来自 `CDC_CLIENT_MULTIPLE` | 提供客户端标识、名称和 FG_ACTIVE 过滤 |
| JFM-DATA-003 | 采集任务展示范围来自 `CDC_DATA_SOURCE` | 提供数据源标识、名称和 FG_ACTIVE 过滤 |
| JFM-DATA-004 | `CDC_CLIENT` 表已废弃，不作为当前有效设计对象 | 使用 `CDC_CLIENT_MULTIPLE` |

职责区分：

- 故障事实、失败次数、重启过程、恢复过程和故障链计算，以两张故障表（`CDC_JOB_FAILURE_EVENT`、`CDC_JOB_FAILURE_HANDLE_LOG`）为依据；
- 两张配置表（`CDC_CLIENT_MULTIPLE`、`CDC_DATA_SOURCE`）用于确定展示对象、关联层级和补充名称；
- 管理平台仅查询展示，不负责写入。

### 5.2 启用范围过滤

| 编号 | 规则 | 说明 |
|---|---|---|
| JFM-FILTER-001 | `CDC_CLIENT_MULTIPLE` 须过滤 `FG_ACTIVE = '1'` | 只展示启用客户端 |
| JFM-FILTER-002 | `CDC_DATA_SOURCE` 须过滤 `FG_ACTIVE = '1'` | 只展示启用数据源 【在故障监控概览页范围内已被 §6.5 的页面例外规则替代，不再作为本页面现行规则/验收标准；其他功能场景不受影响（依据 JFM-ADJ-038、JFM-ADJ-040、JFM-ADJ-043、JFM-ACCEPT-049、JFM-ACCEPT-050）】 |
| JFM-FILTER-003 | 停用客户端不进入页面展示范围 | — |
| JFM-FILTER-004 | 停用数据源不作为采集任务展示 | — 【在故障监控概览页范围内已被 §6.5 的页面例外规则替代，不再作为本页面现行规则/验收标准；其他功能场景不受影响（依据 JFM-ADJ-038、JFM-ADJ-040、JFM-ADJ-043、JFM-ACCEPT-049、JFM-ACCEPT-050）】 |

适用范围说明：

- “只展示 `FG_ACTIVE = '1'` 的数据源”仍是其他功能和页面的一般规则；
- 故障监控概览页是明确的局部例外：以 `CDC_CLIENT_MULTIPLE.DATA_SOURCE_ID` 的配置内容为展示全集，拆分后的每个非空 ID，无论 `CDC_DATA_SOURCE` 中记录是否存在、`FG_ACTIVE` 为何值，都必须显示；
- 客户端过滤规则 `CDC_CLIENT_MULTIPLE.FG_ACTIVE = '1'` 不变，停用客户端仍不展示。

当前实现状态：JFM-FILTER-001 已实现（`JobFailureServiceImpl` 第 76 行）。JFM-FILTER-002 与 JFM-FILTER-004 仅在故障监控概览页范围内由 §6.5 页面例外规则替代（详见 §19 GAP-FILTER-001）。

### 5.3 明确不读取的数据源

| 编号 | 规则 | 说明 |
|---|---|---|
| JFM-DATA-005 | 不读取 ZooKeeper（任何路径） | 后端 `JobFailureServiceImpl` 和 `ZooKeeperMonitorServiceImpl` 无交叉引用 【在故障监控概览页范围内已被 §6.7 的 ZooKeeper 运行状态融合需求局部替代，不再作为本页面现行规则；其他功能场景不受影响（依据 JFM-ADJ-073、JFM-ADJ-075、JFM-ADJ-092）】 |
| JFM-DATA-006 | 不读取 `CDC_DATA_SOURCE_RUN_STATE` 或其他 RUN_STATE 表 | 无相关 Mapper 或 JdbcTemplate 访问 |
| JFM-DATA-007 | Flink Job ID 与 ZK jobName 不建立关联查询 | 两套独立标识体系 |

## 6. 概览页需求

### 6.1 客户端卡片

| 编号 | 规则 | 说明 |
|---|---|---|
| JFM-PAGE-001 | 以客户端卡片分组展示所有逻辑 Job 的故障汇总 | 卡片按客户端 ID 分组 |
| JFM-PAGE-002 | 客户端卡片标题展示：`CLIENT_ID \| Job 总数 N \| 正常 N \| 异常 N` | 正常数 = 状态为"正常"的 Job 数；异常数 = 状态为"恢复中"的 Job 数 |
| JFM-PAGE-003 | 首次加载时所有客户端卡片默认展开 | 后续用户手动展开/折叠状态优先 |
| JFM-PAGE-004 | 自动刷新和手动刷新保持用户当前的展开/折叠状态 | 不因刷新强制改变展开状态 |
| JFM-PAGE-005 | 查询或重置后，对新结果重新采用"全部展开"默认状态 | 旧展开状态被清除 |
| JFM-PAGE-006 | 异常客户端卡片优先排序，同状态按 clientId 字母序 | `overallStatus === '异常'` 的卡片排在前面 |
| JFM-PAGE-007 | 无匹配结果时展示明确空状态 | `el-empty` 组件，"暂无匹配的故障记录" |

### 6.2 业务库表格

| 编号 | 规则 | 说明 |
|---|---|---|
| JFM-TABLE-001 | 表格严格 7 列，顺序固定 | 数据源 ID、数据源名称、Job 当前状态、最近故障时间、最近恢复时间、故障期间恢复尝试、操作 【已被本轮调整替代：改为 6 列，见 §6.3.5】 |
| JFM-TABLE-002 | 不展示"当前物理 Job ID" | 已从表格移除 |
| JFM-TABLE-003 | 不展示"失败事件数" | 已从表格移除（使用"故障期间恢复尝试"替代） |
| JFM-TABLE-004 | 数据源 ID 使用等宽字体 `<code>` 展示 | 便于运维识别 【已被本轮调整替代：数据源 ID 列移除，见 §6.3.5】 |
| JFM-TABLE-005 | 长文本截断并省略号展示 | 数据源名称等字段 【已被本轮调整修订：作用对象改为"业务库（DATA_SOURCE_ORG）"，见 §6.3.5】 |

### 6.3 概览页调整需求（本轮已确认 · 已实现并验收）

> **需求状态**：`baseline_status: APPROVED`（已批准），`implementation_status: IMPLEMENTED_ACCEPTED`（已实现并验收）。
> 本节的功能要求已实现并验收：查询区（删除"数据源 ID"查询条件）、业务库六列表格、业务库字段改显示 `DATA_SOURCE_ORG`、Tooltip 承载 `DATA_SOURCE_ID`、Summary 新增 `dataSourceOrg` 接口字段及既有交互（展开/折叠、刷新状态保持、排序、详情跳转等）均已实现，并通过技术核验与人工页面验收。
> 客户端卡片的精确视觉一致性已由 §6.6 替代/扩展，并已由 Commit `4993400cebc145dd1fa69de1d1de8733e4568a2e` 实现，通过技术核验与人工页面验收。
> §6.4 列出的旧规则在对应功能实现并验收后即告作废。

#### 6.3.1 调整背景

概览页当前以"数据源 ID + 数据源名称"作为业务库的标识与名称，其中 `CDC_DATA_SOURCE.DATA_SOURCE_NAME` 对运维定位不够直观。经用户确认，本轮将业务库展示字段改为更贴近业务含义的 `CDC_DATA_SOURCE.DATA_SOURCE_ORG`，并删除独立的"数据源 ID"查询条件与表格列，改由 Tooltip 承载 `DATA_SOURCE_ID`，同时将客户端卡片视觉效果与"CDC 节点状态"页面协调。

#### 6.3.2 调整范围与非范围

| 编号 | 规则 | 说明 |
|---|---|---|
| JFM-ADJ-001 | 本轮只调整概览页 `/monitor/job-failure` | 其余页面与逻辑不调整 |
| JFM-ADJ-002 | 本轮明确不调整：故障过程详情页、故障归并/主链识别/物理 Job 链算法、Job 当前状态判断规则、历史故障、CLOB 懒加载、数据库表结构、ZooKeeper、`CDC_DATA_SOURCE_RUN_STATE`、自动刷新选项与默认值、客户端排序规则、客户端首次展开及刷新保持展开状态的规则 | 这些行为保持现状 |

#### 6.3.3 查询区域规则

| 编号 | 规则 | 说明 |
|---|---|---|
| JFM-ADJ-003 | 删除"数据源 ID"查询条件 | 替代旧规则 JFM-QUERY-002 |
| JFM-ADJ-004 | 查询区域只保留：客户端、Job 当前状态、查询、重置 | — |
| JFM-ADJ-005 | 客户端多选、"全部"与具体客户端互斥、Job 状态选项及现有查询/重置语义保持不变 | 复用旧规则 JFM-QUERY-001、JFM-QUERY-003 |

#### 6.3.4 客户端卡片视觉与交互规则

| 编号 | 规则 | 说明 |
|---|---|---|
| JFM-ADJ-006 | 每个客户端继续作为独立分组卡片展示，外层卡片视觉效果参照当前"CDC 节点状态"页面的客户端卡片 | 只参考视觉语言 【已被本轮 §6.6 进一步明确为"同一套视觉语言与视觉令牌"，详见 JFM-ADJ-061】 |
| JFM-ADJ-007 | 使用与"CDC 节点状态"协调的圆角、边框、背景、阴影、间距和标题层级 | 视觉令牌协调 【已被本轮 §6.6 进一步明确，详见 JFM-ADJ-061】 |
| JFM-ADJ-008 | 正常客户端与异常客户端保留清晰但不过度突兀的状态差异 | — |
| JFM-ADJ-009 | 卡片标题继续显示客户端 ID、Job 总数、正常数和异常数 | 复用旧规则 JFM-PAGE-002 |
| JFM-ADJ-010 | 保留展开/折叠能力；首次加载时全部展开；自动刷新和手动刷新后保持用户人工展开/折叠状态 | 复用旧规则 JFM-PAGE-003、JFM-PAGE-004 |
| JFM-ADJ-011 | 异常客户端优先，同状态按客户端 ID 升序 | 复用旧规则 JFM-PAGE-006 |
| JFM-ADJ-012 | 只参考视觉语言，不复制"CDC 节点状态"的在线、离线、IP、PID、ZooKeeper 路径等业务内容；不得为卡片效果引入 ZooKeeper 数据或修改故障监控数据边界 | — |

#### 6.3.5 业务库表格列定义

删除独立的"数据源 ID"列，表格由 7 列调整为 6 列（替代旧规则 JFM-TABLE-001）：

| 顺序 | 列名 | 规则 |
|---|---|---|
| 1 | 业务库 | 显示 `CDC_DATA_SOURCE.DATA_SOURCE_ORG` |
| 2 | Job 当前状态 | 保持现有规则 |
| 3 | 最近故障时间 | 保持现有规则 |
| 4 | 最近恢复时间 | 保持现有规则 |
| 5 | 故障期间恢复尝试 | 保持现有规则 |
| 6 | 操作 | 保持现有"查看"规则 |

| 编号 | 规则 | 说明 |
|---|---|---|
| JFM-ADJ-013 | 表格严格 6 列，顺序如上固定 | 替代旧规则 JFM-TABLE-001（原 7 列） |
| JFM-ADJ-014 | 第 1 列"业务库"显示 `CDC_DATA_SOURCE.DATA_SOURCE_ORG` | 替代旧"数据源名称"列 |

#### 6.3.6 业务库显示与 DATA_SOURCE_ID 规则

| 编号 | 规则 | 说明 |
|---|---|---|
| JFM-ADJ-015 | `DATA_SOURCE_ORG` 有值 → 原样显示字段值；`DATA_SOURCE_ORG` 为空 → 前端显示"未定义名称" | 兜底文案仅前端展示，不写回数据库 【已被本轮 §6.5.2 修订：补充未激活数据源红色后缀与无效数据源红字场景】 |
| JFM-ADJ-016 | 不判断 `DATA_SOURCE_ORG` 是否重复、不去重、不合并记录 | 重复值原样展示；继续有效，并扩展至无效数据源场景（见 §6.5.2 JFM-ADJ-036、JFM-ADJ-045） |
| JFM-ADJ-017 | 鼠标悬停在业务库名称或"未定义名称"上时，Tooltip 显示对应的 `DATA_SOURCE_ID` | Tooltip 文案为 `数据源 ID：<实际值>` 【已被本轮 §6.5.3 扩展：Tooltip 规则扩展至无效数据源，见 JFM-ADJ-047】 |
| JFM-ADJ-018 | `DATA_SOURCE_ID` 继续用于行标识、数据关联和详情跳转；不得从后端响应或内部业务逻辑中删除 `dataSourceId` | — |

#### 6.3.7 数据来源与接口契约

| 编号 | 规则 | 说明 |
|---|---|---|
| JFM-ADJ-019 | 概览页主要显示字段改为 `CDC_DATA_SOURCE.DATA_SOURCE_ORG`；不得继续使用 `CDC_DATA_SOURCE.DATA_SOURCE_NAME` 作为本页面业务库名称 | — |
| JFM-ADJ-020 | Summary 响应应使用语义明确的 `dataSourceOrg` 字段，映射 `CDC_DATA_SOURCE.DATA_SOURCE_ORG`；`dataSourceId` 保留 | 新增字段，见 §14 【已被本轮 §6.5.5 扩展：增加多 ID 展开与存在性/激活状态契约】 |
| JFM-ADJ-021 | 不得把现有 `dataSourceName` 静默改成 `DATA_SOURCE_ORG` 的含义；如 `dataSourceName` 仍被其他代码使用，允许为兼容保留，但故障概览页不再展示它 | — |
| JFM-ADJ-022 | `DATA_SOURCE_ORG` 为空时由前端显示"未定义名称"，不写回数据库；本任务和后续实现均不执行数据库写操作 | — |

#### 6.3.8 不回归规则

以下现有行为不得因本轮调整发生回归：

| 编号 | 规则 |
|---|---|
| JFM-ADJ-023 | 只展示启用客户端（`CDC_CLIENT_MULTIPLE.FG_ACTIVE='1'`）对应的逻辑 Job |
| JFM-ADJ-024 | Job 当前状态仍为"正常/恢复中"的现有口径 |
| JFM-ADJ-025 | 最近故障时间、最近恢复时间和恢复尝试次数的现有计算规则 |
| JFM-ADJ-026 | 无数据时使用 `—`；无故障过程时不提供"查看"；点击"查看"仍进入对应客户端和数据源的故障详情 |
| JFM-ADJ-027 | 自动刷新、手动刷新、最后刷新时间 |
| JFM-ADJ-028 | 请求失败时保留最近一次成功数据；空结果和首次加载失败状态 |
| JFM-ADJ-029 | 故障监控只读边界 |

#### 6.3.9 本轮可执行验收标准

| 编号 | 检查项 |
|---|---|
| JFM-ACCEPT-036 | 查询区域不含"数据源 ID"条件，仅含客户端、Job 当前状态、查询、重置 |
| JFM-ACCEPT-037 | 业务库表格为 6 列，顺序为业务库 / Job 当前状态 / 最近故障时间 / 最近恢复时间 / 故障期间恢复尝试 / 操作 |
| JFM-ACCEPT-038 | 业务库列显示 `DATA_SOURCE_ORG`；有值原样显示，空值显示"未定义名称" 【已被本轮 §6.5 修订：补充未激活与无效数据源场景，见 JFM-ACCEPT-049/050/051】 |
| JFM-ACCEPT-039 | 业务库名称或"未定义名称"悬停 Tooltip 显示 `数据源 ID：<实际值>` 【已被本轮 §6.5 扩展：四类记录 Tooltip 均显示实际 ID，见 JFM-ACCEPT-052】 |
| JFM-ACCEPT-040 | `DATA_SOURCE_ORG` 重复值原样展示，不去重不合并 【继续有效，见 JFM-ACCEPT-048】 |
| JFM-ACCEPT-041 | 概览页不再展示 `DATA_SOURCE_NAME`；Summary 响应包含 `dataSourceOrg` 且保留 `dataSourceId` 【已被本轮 §6.5 扩展：增加多 ID 展开与存在性/激活契约，见 JFM-ACCEPT-053】 |
| JFM-ACCEPT-042 | 客户端卡片视觉效果与"CDC 节点状态"协调（圆角、边框、背景、阴影、间距、标题层级），正常/异常差异清晰不过度 【已被本轮 §6.6 更精确的验收标准替代/扩展，详见 JFM-ACCEPT-057 ～ JFM-ACCEPT-063】 |
| JFM-ACCEPT-043 | 卡片标题仍显示客户端 ID、Job 总数、正常数、异常数；首次加载全展开，刷新保持人工展开/折叠状态 |
| JFM-ACCEPT-044 | 异常客户端优先，同状态按客户端 ID 升序 |
| JFM-ACCEPT-045 | 未引入 ZooKeeper 数据；故障监控数据边界不变；只读边界不变 |

### 6.4 被本轮调整替代的旧规则

以下旧规则自本轮调整实现并验收通过后作废，不得与新规则同时作为有效要求存在：

| 旧规则 | 内容 | 替代/修订 |
|---|---|---|
| JFM-QUERY-002 | "数据源 ID"查询条件（下拉，从 API 动态提取，精确匹配） | 删除，见 §6.3.3 |
| JFM-TABLE-001 | 表格严格 7 列（含"数据源 ID""数据源名称"列） | 修订为 6 列，见 §6.3.5 |
| JFM-TABLE-004 | "数据源 ID"列使用等宽字体 `<code>` 展示 | 删除（该列移除），见 §6.3.5 |
| JFM-TABLE-005 | "数据源名称"长文本截断省略号展示 | 修订：截断规则保留，作用对象由"数据源名称"改为"业务库（DATA_SOURCE_ORG）" |
| 页面展示 `CDC_DATA_SOURCE.DATA_SOURCE_NAME` | 概览页"数据源名称"列及 Summary `dataSourceName` 字段用于概览展示 | 概览页不再展示，见 §6.3.7 |
| 旧式客户端卡片视觉 | 客户端卡片当前 `el-card` 左侧色条（`border-left`）式视觉 | 修订为参照"CDC 节点状态"视觉，见 §6.3.4 |

### 6.5 多数据源展开与异常数据源展示规则（本轮已确认 · 已实现并验收）

> **需求状态**：`baseline_status: APPROVED`（已批准），`implementation_status: IMPLEMENTED_ACCEPTED`（已实现并验收）。
> 本节规则已由 Commit `277e7d314ecafe0845bb4e6e9438b18767cb94c8` 实现，并完成定向后端单元测试、后端打包、前端类型检查与构建、Summary API 实际数据核对、浏览器页面核对与人工页面验收。
> 运行验证确认 `CDC_CLIENT_MULTIPLE.DATA_SOURCE_ID` 不是单个数据源 ID，而是以英文逗号分隔的多个 `CDC_DATA_SOURCE.DATA_SOURCE_ID`。本节将多数据源拆分、未激活数据源与无效数据源的展示规则正式写入基线。

#### 6.5.1 配置字段语义与拆分规则

| 编号 | 规则 | 说明 |
|---|---|---|
| JFM-ADJ-030 | `CDC_CLIENT_MULTIPLE.DATA_SOURCE_ID` 是多个 `CDC_DATA_SOURCE.DATA_SOURCE_ID` 组成的英文逗号分隔字符串，不得把整段字符串当成单个 ID 查询 | — |
| JFM-ADJ-031 | 按英文逗号 `,` 拆分 | — |
| JFM-ADJ-032 | 每个拆分项去除首尾空白 | — |
| JFM-ADJ-033 | 忽略拆分后为空的项 | — |
| JFM-ADJ-034 | 每个非空 `DATA_SOURCE_ID` 在对应客户端卡片中独立形成一条业务库记录 | — |
| JFM-ADJ-035 | 拆分结果以配置字段中的先后顺序为基础 | — |
| JFM-ADJ-036 | 不得因为多个 ID 对应相同的 `DATA_SOURCE_ORG` 而去重、合并或覆盖记录 | 强化旧规则 JFM-ADJ-016 |
| JFM-ADJ-037 | 客户端卡片的 Job 总数应与最终展开出的记录数保持一致 | — |
| JFM-ADJ-038 | 数据源是否激活、是否能在 `CDC_DATA_SOURCE` 中找到，只影响"业务库"列的标识，不得导致该 ID 行被过滤 | — |
| JFM-ADJ-039 | Job 状态、最近故障时间、最近恢复时间、恢复尝试次数等既有字段继续按具体 `(CLIENT_ID, DATA_SOURCE_ID)` 维度关联；没有对应业务数据时沿用既有空值展示语义，不得伪造状态或时间 | — |

边界示例（必须遵守）：

```text
原值：" source-a,source-b, , source-c "
结果：source-a、source-b、source-c，共 3 条记录
```

#### 6.5.2 "业务库"列显示规则

业务库列的显示必须形成无歧义的优先级规则：

| 数据源匹配情况 | FG_ACTIVE | DATA_SOURCE_ORG | 页面"业务库"显示 |
|---|---|---|---|
| 找到记录 | 非 0 | 非空 | 原样显示 `DATA_SOURCE_ORG` |
| 找到记录 | 非 0 | 空值或空白 | 显示 `未定义名称` |
| 找到记录 | 0 | 非空 | 显示 `DATA_SOURCE_ORG`，后接红字 `(数据源未激活)` |
| 找到记录 | 0 | 空值或空白 | 显示 `未定义名称`，后接红字 `(数据源未激活)` |
| 未找到记录 | 不适用 | 不适用 | 整体以红字显示 `无效数据源` |

补充约束：

| 编号 | 规则 |
|---|---|
| JFM-ADJ-040 | 只有后缀 `(数据源未激活)` 使用红色，前面的机构名称或 `未定义名称` 保持正常文字样式 |
| JFM-ADJ-041 | `无效数据源` 整体使用红色 |
| JFM-ADJ-042 | `FG_ACTIVE = 0` 与"在 `CDC_DATA_SOURCE` 中没有记录"是两种不同状态，不得混淆 |
| JFM-ADJ-043 | 未激活数据源和无效数据源均必须保留在表格中 |
| JFM-ADJ-044 | 不得使用 `DATA_SOURCE_NAME` 代替 `DATA_SOURCE_ORG` |
| JFM-ADJ-045 | 机构名称重复时仍逐条显示，不去重 |
| JFM-ADJ-046 | 不得写数据库来修复、补齐或构造数据 |

#### 6.5.3 Tooltip 规则

| 编号 | 规则 | 说明 |
|---|---|---|
| JFM-ADJ-047 | 每一条展开记录的"业务库"单元格都必须支持 Tooltip，显示 `数据源 ID：<拆分后的实际 DATA_SOURCE_ID>` | 正常数据源、未定义名称、未激活数据源、无效数据源全部适用；即使页面显示红字 `无效数据源`，鼠标移入后仍必须看到原始 ID |

#### 6.5.4 后端展开与查询约束

| 编号 | 规则 |
|---|---|
| JFM-ADJ-048 | 多 ID 拆分与逐条 Summary 结果展开必须由后端完成，前端不得把一条 Summary 中的逗号字符串自行拆成多行 |
| JFM-ADJ-049 | 后端必须以拆分后的单个 `DATA_SOURCE_ID` 作为关联键 |
| JFM-ADJ-050 | 对 `CDC_DATA_SOURCE` 必须采用批量查询和内存映射，禁止逐 ID 查询造成 N+1 |
| JFM-ADJ-051 | 批量查询未返回的 ID 仍要生成 Summary 条目，并标记为无效数据源 |
| JFM-ADJ-052 | 不得只保留能在 `CDC_DATA_SOURCE` 中匹配到的 ID |
| JFM-ADJ-053 | 不得读取或写入 ZooKeeper | 【本行约束仅针对 §6.5 多数据源展开实现轮次；在故障监控概览页范围内，§6.7 目标需求实现后将新增对 ZooKeeper `alive` 的只读读取，写 ZooKeeper 仍严格禁止（依据 JFM-ADJ-073、JFM-ADJ-091、JFM-ADJ-094）】 |
| JFM-ADJ-054 | 不得修改数据库 |
| JFM-ADJ-055 | 不得引入 `CDC_DATA_SOURCE_RUN_STATE` |

#### 6.5.5 Summary API 契约

| 编号 | 规则 |
|---|---|
| JFM-ADJ-056 | Summary API 一条返回记录对应一个拆分后的 `DATA_SOURCE_ID` |
| JFM-ADJ-057 | 接口至少保留 `dataSourceId`、`dataSourceName`（兼容保留，概览页不展示）、`dataSourceOrg`、`dataSourceActive` |
| JFM-ADJ-058 | 接口必须提供一种无歧义的方式区分"记录存在 / 不存在"与"激活 / 未激活"，采用 `dataSourceExists` 存在性布尔字段与 `dataSourceActive` 激活状态三态字段组成的组合契约 |
| JFM-ADJ-059 | 禁止通过 `dataSourceOrg == null` 判断记录不存在，因为"记录存在但 `DATA_SOURCE_ORG` 为空"是合法且必须显示 `未定义名称` 的另一种状态 |
| JFM-ADJ-060 | `dataSourceActive` 自本轮起成为正式需求的一部分，不再作为越界字段删除；必须严格遵守下述存在性/激活状态组合契约 |

存在性布尔字段与激活状态三态字段的组合契约：

```text
dataSourceExists: true  = CDC_DATA_SOURCE 中存在对应记录
dataSourceExists: false = CDC_DATA_SOURCE 中不存在对应记录

dataSourceActive: true  = 记录存在且 FG_ACTIVE != 0
dataSourceActive: false = 记录存在且 FG_ACTIVE = 0
dataSourceActive: null  = 记录不存在，不适用
```

#### 6.5.6 多数据源展开可执行验收标准

| 编号 | 检查项 |
|---|---|
| JFM-ACCEPT-046 | `CDC_CLIENT_MULTIPLE.DATA_SOURCE_ID` 按英文逗号拆分、Trim、忽略空项，每个非空 ID 独立返回并显示一条记录 |
| JFM-ACCEPT-047 | 示例 `" source-a,source-b, , source-c "` 最终严格产生 3 条记录，且 ID 正确 |
| JFM-ACCEPT-048 | 多个 ID 对应相同 `DATA_SOURCE_ORG` 时仍逐条显示，不去重、不合并 |
| JFM-ACCEPT-049 | `FG_ACTIVE = 0` 时名称正常显示，仅后缀 `(数据源未激活)` 为红色 |
| JFM-ACCEPT-050 | `FG_ACTIVE = 0` 且 ORG 为空时显示 `未定义名称`，并追加红色 `(数据源未激活)` |
| JFM-ACCEPT-051 | ID 在 `CDC_DATA_SOURCE` 中不存在时仍保留该行，业务库整项显示红色 `无效数据源` |
| JFM-ACCEPT-052 | 正常、未定义、未激活和无效四类记录的 Tooltip 均显示拆分后的实际数据源 ID |
| JFM-ACCEPT-053 | Summary API 一条记录对应一个拆分后的 ID，并能无歧义区分存在、未激活和不存在三种情况 |
| JFM-ACCEPT-054 | 数据源配置采用批量查询，无 N+1；未匹配 ID 不被过滤 |
| JFM-ACCEPT-055 | 客户端卡片 Job 总数与展开后的记录数一致，既有客户端排序、折叠、刷新和详情功能不回归 |
| JFM-ACCEPT-056 | 本轮实现不得写数据库、不得写 ZooKeeper、不得读取 `CDC_DATA_SOURCE_RUN_STATE` |

验收标准必须覆盖以下测试数据组合，允许后续代码任务使用单元测试或 Mock 验证，不得为验证而写数据库：

```text
一个客户端配置 3 个有效 ID
两个 ID 的 DATA_SOURCE_ORG 相同
一个已激活且 ORG 有值
一个未激活且 ORG 有值
一个未激活且 ORG 为空
一个 ID 在 CDC_DATA_SOURCE 中不存在
配置字符串含首尾空格和连续逗号
```

### 6.6 客户端卡片视觉一致性（本轮已确认 · 已实现并验收）

> **需求状态**：`baseline_status: APPROVED`（已批准），`implementation_status: IMPLEMENTED_ACCEPTED`（已实现并验收）。
> 本节目标需求已由 Commit `4993400cebc145dd1fa69de1d1de8733e4568a2e` 实现：故障监控客户端卡片改为与 CDC 节点状态一致的可见灰蓝边框、明确轮廓阴影、高不透明度浅色背景与标题区分隔，并完成前端类型检查与构建、浏览器实页核验；用户已根据真实页面截图人工确认"卡片能够明显分开"的目标达成。
> 本节将 §6.3.4 中 JFM-ADJ-006/007 的"参考、协调"进一步明确为"视觉语言与视觉令牌一致"，并将 §6.3.9 中 JFM-ACCEPT-042 的"视觉协调"验收标准替代/扩展为 JFM-ACCEPT-057 ～ JFM-ACCEPT-063。JFM-ADJ-061～072、JFM-ACCEPT-057～063 的规则语义保持不变。

#### 6.6.1 "视觉一致"的准确含义

故障监控客户端卡片与"CDC 节点状态"客户端卡片采用同一套视觉语言和视觉令牌：

```text
卡片背景
边框颜色与清晰度
圆角
阴影强度与范围
标题区层级
正常/异常状态色
状态圆点
标题文字层级
Hover 反馈
卡片内外间距基准
```

这里的"一致"不是要求两个页面展示相同业务内容，也不是把 CDC 节点卡片简单横向拉伸。故障监控卡片仍保留自己的内容结构：

```text
卡片头部：客户端 ID / Job 总数 / 正常数 / 异常数 / 展开箭头
卡片内容：该客户端的业务库 6 列表格
```

不得复制 CDC 节点状态中的 IP、PID、在线时间、ZK 路径等业务字段。

| 编号 | 规则 | 说明 |
|---|---|---|
| JFM-ADJ-061 | 故障监控客户端卡片与"CDC 节点状态"客户端卡片采用同一套视觉语言和视觉令牌（卡片背景、边框颜色与清晰度、圆角、阴影强度与范围、标题区层级、正常/异常状态色、状态圆点、标题文字层级、Hover 反馈、卡片内外间距基准） | "一致"指视觉语言与视觉令牌一致，非展示相同业务内容 |
| JFM-ADJ-062 | 故障监控卡片保留自己的内容结构：卡片头部展示客户端 ID / Job 总数 / 正常数 / 异常数 / 展开箭头，卡片内容展示该客户端的业务库 6 列表格；不得复制 CDC 节点状态中的 IP、PID、在线时间、ZK 路径等业务字段 | 不把 CDC 节点卡片简单横向拉伸 |

#### 6.6.2 全宽单列布局

| 编号 | 规则 | 说明 |
|---|---|---|
| JFM-ADJ-063 | 故障监控客户端卡片使用单列纵向布局 | 与 CDC 节点状态的多列网格不同 |
| JFM-ADJ-064 | 每个客户端卡片占据内容区域一整行，宽度为当前容器可用宽度；不因复用 CDC 节点状态视觉而改成多列小卡片 | — |
| JFM-ADJ-065 | 多个客户端按既有规则纵向排列，卡片之间保留稳定、清晰的垂直间距 | — |
| JFM-ADJ-066 | 页面在常用桌面宽度下不应出现由卡片布局引起的横向滚动；表格自身响应式行为沿用现有实现 | — |

#### 6.6.3 卡片边界与层级

| 编号 | 规则 | 说明 |
|---|---|---|
| JFM-ADJ-067 | 卡片必须与页面背景形成可辨识但不过度突兀的明暗和边界差异；相邻客户端即使都处于正常状态，也必须能一眼识别为独立卡片 | — |
| JFM-ADJ-068 | 卡片标题区与内容区应具有清晰的层级和分隔关系 | — |
| JFM-ADJ-069 | 不得再使用在浅色背景上近乎不可见的半透明白色边框作为主要边界，不得仅依赖大范围、低透明度的模糊阴影区分卡片；卡片边界应主要依赖一致的背景、边框、阴影和标题区层级，状态色只作为辅助信息，不要求每个客户端使用不同颜色 | — |

#### 6.6.4 正常与异常状态

| 编号 | 规则 | 说明 |
|---|---|---|
| JFM-ADJ-070 | 正常客户端与异常客户端沿用 CDC 节点状态卡片的状态表达方式，状态差异清晰但不过度强烈；即使所有客户端均正常，卡片边界仍然清楚 | — |
| JFM-ADJ-071 | 异常状态不得只依赖颜色表达，现有"异常"文字和统计数字继续保留；不改变"异常客户端优先，同状态按 clientId 排序"的业务规则 | — |

#### 6.6.5 复用原则

| 编号 | 规则 | 说明 |
|---|---|---|
| JFM-ADJ-072 | 后续实现应优先评估当前 CDC 节点状态客户端卡片是否支持 slot、variant 或可复用的视觉令牌；组件业务耦合较低时可增加全宽变体并复用，组件含大量 CDC 节点专属结构时不得为形式复用把节点业务带入故障监控，此时应复用或提取相同的 CSS 变量、公共类或视觉令牌使最终效果一致；不得维护两套仅"看起来相近"但数值和状态表现不断漂移的卡片样式；后续实现不得为故障监控反向改变 CDC 节点状态页面现有视觉，除非另有明确任务授权 | 复用组件不是硬性要求，但最终视觉必须一致 |

#### 6.6.6 不回归范围

本轮视觉调整不得改变以下既有行为：

```text
查询区只保留客户端和 Job 当前状态
业务库表格严格 6 列
多数据源拆分及配置顺序
DATA_SOURCE_ORG、未定义名称、未激活和无效数据源显示规则
Tooltip 数据源 ID
Job 状态、故障时间、恢复时间、恢复尝试
详情跳转
客户端统计数量
展开/折叠及刷新后状态保持
客户端筛选、Job 状态筛选
异常优先排序
只读边界
```

不得修改后端、API、数据库或 ZooKeeper。

#### 6.6.7 客户端卡片视觉一致性可执行验收标准

| 编号 | 验收标准 |
|---|---|
| JFM-ACCEPT-057 | 故障监控客户端卡片的背景、边框、圆角、阴影、标题层级、状态色和 Hover 效果与当前 CDC 节点状态客户端卡片一致 |
| JFM-ACCEPT-058 | 故障监控保持单列布局，每个客户端卡片占据内容区域一整行，不变成多列小卡片 |
| JFM-ACCEPT-059 | 相邻客户端在全部正常的情况下仍具有清晰边界，卡片与页面背景、标题区与内容区层级可辨识 |
| JFM-ACCEPT-060 | 卡片头部继续展示客户端 ID、Job 总数、正常数、异常数和展开箭头，内部继续展示 6 列业务库表格 |
| JFM-ACCEPT-061 | 展开/折叠、刷新状态保持、筛选、排序、详情跳转和数据源异常标识不回归 |
| JFM-ACCEPT-062 | 实现优先复用同一组件变体或共享视觉令牌；不得复制节点业务字段，不得无授权改变 CDC 节点状态页面 |
| JFM-ACCEPT-063 | 常用桌面宽度下卡片单列全宽显示正常，无由卡片布局引起的页面横向滚动；浏览器控制台无新增错误 |

验收方式（不能只以"CSS 已修改"作为视觉验收证据）：

```text
故障监控与 CDC 节点状态页面并列截图或逐页截图对比
浏览器实页检查边框、背景、阴影、圆角和标题层级
故障监控至少两个相邻正常客户端卡片的边界检查
展开与折叠状态截图
常用桌面宽度检查
代码审查确认复用策略和无业务回归
```

### 6.7 ZooKeeper 运行状态融合（本轮已确认 · 目标需求）

> **需求状态**：`baseline_status: APPROVED`（已批准），`implementation_status: PENDING`（实现待开发）。
> 当前故障监控概览页的客户端和 Job 状态仅来自数据库故障记录：数据库中没有未闭环故障，只能说明"没有正在处理的故障记录"，不能证明实际 `sync-client` 进程或 Job 正在运行，可能出现"进程实际已关闭、页面仍显示绿色正常"的误判。本节将"以 ZooKeeper `alive` 临时节点作为实际运行状态依据，并与数据库故障事实组合展示"正式写入基线，作为后续实现任务的唯一正式依据。
> 本节使故障监控概览页在既有四张表只读基础上，新增对 ZooKeeper `alive` 节点的只读读取；§5.3 JFM-DATA-005、§6.5.4 JFM-ADJ-053、§15 JFM-SAFE-003 中"不读取 ZooKeeper"的既有表述在概览页范围内被本节局部替代，ZooKeeper 写操作仍严格禁止（依据 CLAUDE.md §14）。

#### 6.7.1 运行状态与故障事实的语义区分

| 编号 | 规则 | 说明 |
|---|---|---|
| JFM-ADJ-073 | 必须区分"运行状态"与"故障事实"两类不同语义：运行状态来自 ZooKeeper，表示客户端或 Job 当前是否在线；故障事实来自故障事件表（`CDC_JOB_FAILURE_EVENT`、`CDC_JOB_FAILURE_HANDLE_LOG`），表示故障时间、恢复时间、恢复尝试和详情记录。二者组合展示，不得互相替代 | 数据库无未闭环故障 ≠ 进程/Job 正在运行 |
| JFM-ADJ-074 | ZooKeeper 离线状态不得伪造、插入或修改任何数据库故障记录 | 只读边界不变 |

#### 6.7.2 ZooKeeper 路径与标识规则

| 编号 | 规则 | 说明 |
|---|---|---|
| JFM-ADJ-075 | 固定路径为 `/bsoft-cdc/clients`、`/bsoft-cdc/clients/{clientId}/alive`、`/bsoft-cdc/clients/{clientId}/jobs/{jobCode}/alive`；其中 `bsoft-cdc`、`clients`、`jobs` 为固定名称，`{clientId}` = `CDC_CLIENT_MULTIPLE.CLIENT_ID`，`{jobCode}` = 拆分后的单个 `DATA_SOURCE_ID`；客户端 `alive` 和 Job `alive` 均为临时节点，本功能只判断 `alive` 节点是否存在，不依赖其数据内容 | — |
| JFM-ADJ-076 | `CDC_CLIENT_MULTIPLE.DATA_SOURCE_ID` 继续严格沿用 §6.5 已实现规则：按英文逗号拆分 → Trim → 忽略空项 → 保持配置顺序 → 每个单 ID 对应一个 Job 行和一个 jobCode；严禁把包含英文逗号的整个字段值当成一个 ZK `jobCode` | 复用 JFM-ADJ-030～035 |
| JFM-ADJ-077 | 无效数据源和未激活数据源仍使用该单个 ID 拼接 ZK 路径，不因 `CDC_DATA_SOURCE` 中不存在或 `FG_ACTIVE=0` 而跳过运行状态判断 | — |

#### 6.7.3 状态判定矩阵

| ZK 本轮状态 | 客户端状态 | 是否读取 Job alive | 页面 Job 当前状态 |
|---|---|---|---|
| ZK 无法可靠读取 | 不产生本轮客户端状态 | 不继续展示本轮结果 | 页面统一错误状态，不显示任何客户端卡片 |
| 客户端 alive 不存在 | 离线 | 不读取 | 该客户端全部 Job 显示"离线" |
| 客户端 alive 存在，Job alive 不存在 | 在线 | 已读取并确认不存在 | 对应 Job 显示"离线" |
| 客户端 alive 存在，Job alive 存在 | 在线 | 已读取并确认存在 | 使用数据库故障逻辑计算的当前状态 |

| 编号 | 规则 | 说明 |
|---|---|---|
| JFM-ADJ-078 | `NoNode` 或成功读取后确认 `alive` 不存在，才可以判定"离线" | 不得把读取异常当离线 |
| JFM-ADJ-079 | 客户端 `alive` 不存在时，必须短路，不再读取该客户端任何 Job 的 `alive`；客户端 `alive` 存在时，才按拆分后的单个 `DATA_SOURCE_ID` 读取对应 Job `alive` | — |
| JFM-ADJ-080 | 客户端和 Job 均在线时，ZooKeeper 只证明进程/Job 存活；"正常、恢复中或其他既有故障状态"仍由数据库故障逻辑决定 | — |
| JFM-ADJ-081 | Job 离线优先于数据库计算出的 Job 当前状态：即使数据库侧为"正常"或"恢复中"，只要本轮可靠确认 Job `alive` 不存在，该行当前状态显示"离线"；客户端离线优先于所有 Job 状态；页面 Job 状态不新增"未知" | — |

#### 6.7.4 ZooKeeper 读取失败与 60 秒重试

| 编号 | 规则 | 说明 |
|---|---|---|
| JFM-ADJ-082 | 以下情况不得解释成客户端或 Job 离线：ZooKeeper 无法连接、会话失效、连接中断、读取超时、读取必需 `alive` 状态时发生异常、本轮无法可靠完成运行状态快照的其他错误；除明确的 `NoNode`/节点不存在结果外，读取异常必须进入页面统一错误状态 | — |
| JFM-ADJ-083 | ZK 无法可靠读取时，页面必须：①显示固定文案"ZooKeeper 连接失败，将在 60 秒重试"；②不显示任何客户端卡片；③不显示上一次成功读取的客户端卡片或旧运行状态；④已存在的前端旧数据必须清除或隐藏，不得以"数据可能不是最新"形式继续展示；⑤不把任何客户端或 Job 显示为离线、正常、恢复中或未知；⑥不显示基于旧结果的客户端/业务库统计数量；⑦60 秒后自动重新读取，不要求用户手动操作；⑧允许保留手动"刷新/立即重试"入口，但不得代替固定的 60 秒自动重试；⑨重试成功后解除错误状态、展示最新完整结果，并恢复用户当前选择的正常自动刷新周期；⑩错误期间不得叠加多个定时器或产生并发重复请求，组件卸载时必须清理重试定时器 | 视觉语言参考"CDC 节点状态"错误提示，但本规则更严格：不保留上次成功数据。在 ZK 读取失败场景下，本规则替代 §6.3.8 JFM-ADJ-028 与 §8 JFM-QUERY-007 中"请求失败保留旧数据"的一般规则，ZK 失败必须清除旧数据 |

#### 6.7.5 客户端卡片头部规则

| 编号 | 规则 | 说明 |
|---|---|---|
| JFM-ADJ-084 | 客户端卡片头部在客户端 ID 之前显示客户端运行状态：`[状态圆点 在线/离线] 客户端 ID｜Job 总数｜正常｜异常｜展开箭头`。客户端 `alive` 存在 → 绿色状态圆点和"在线"；客户端 `alive` 不存在 → 红色状态圆点和"离线"。在线/离线只表示客户端 `alive` 状态，不使用某个 Job 的 alive 反推客户端在线/离线 | — |
| JFM-ADJ-085 | 不增加"Job 在线数""Job 离线数"或"Job 未知数"统计；现有 Job 总数、正常数、异常数继续表示既有故障数据维度，不改成运行状态数量；在线客户端即使存在离线 Job，客户端头部仍显示"在线" | — |
| JFM-ADJ-086 | 在线客户端沿用已经人工验收的当前卡片效果；离线客户端使用与 CDC 节点状态协调的离线表达：红色圆点、红色"离线"文字和克制的离线辅助背景/边界；离线不得只靠颜色表达，必须有"离线"文字；不改变全宽单列布局、卡片间距和已经验收的边界效果 | — |

#### 6.7.6 Job 表格与数据库事实

| 编号 | 规则 | 说明 |
|---|---|---|
| JFM-ADJ-087 | "Job 当前状态"新增正式状态"离线"：客户端离线 → 该客户端所有 Job 显示"离线"；客户端在线、某 Job 离线 → 该 Job 显示"离线"；客户端和 Job 均在线 → 显示数据库故障逻辑计算的状态。"离线"标签必须有清晰的非绿色视觉表达，并与"正常""恢复中"等状态可区分 | — |
| JFM-ADJ-088 | Job 显示"离线"时，只覆盖"Job 当前状态"列；最近故障时间、最近恢复时间、故障期间恢复尝试、操作列、存在故障记录时的"查看"入口及详情内容继续按数据库事实展示，不清空、不伪造。业务库显示、`DATA_SOURCE_ORG`、`未定义名称`、红字 `(数据源未激活)`、红字 `无效数据源` 和 `DATA_SOURCE_ID` Tooltip 全部保持不变 | — |

#### 6.7.7 筛选规则

| 编号 | 规则 | 说明 |
|---|---|---|
| JFM-ADJ-089 | "Job 当前状态"筛选新增"离线"，不新增"未知"。最终显示状态决定筛选归属：客户端离线导致的所有 Job 归入"离线"；客户端在线但 Job alive 不存在的 Job 归入"离线"；只有客户端和 Job 都在线时，才按数据库故障状态归入"正常""恢复中"等既有选项。选择"正常"不得返回最终显示为"离线"的 Job；选择"离线"必须同时覆盖上述两类离线 Job；重置恢复"全部"；筛选不得改变客户端配置顺序或 Job 配置顺序 | — |

#### 6.7.8 客户端排序

| 编号 | 规则 | 说明 |
|---|---|---|
| JFM-ADJ-090 | 客户端卡片排序优先级调整为：①客户端离线；②客户端在线且存在异常/恢复中 Job；③客户端在线、无异常/恢复中 Job，但存在离线 Job；④客户端在线且全部 Job 正常；⑤同一层级按 clientId 升序。排序判断使用最终展示状态，但不得把 Job 离线反推为客户端离线 | — |

#### 6.7.9 接口与实现边界

| 编号 | 规则 | 说明 |
|---|---|---|
| JFM-ADJ-091 | 后端提供无歧义的 ZooKeeper 可用性、客户端在线状态和单 Job 在线状态契约，不得通过前端猜测节点状态；成功结果中的客户端和 Job 在线状态使用明确布尔语义，不需要页面展示的"未知"状态；ZK 整体/本轮状态读取失败必须能与"所有 alive 节点均不存在"明确区分；失败响应不得携带可被前端继续显示的旧客户端卡片结果 | — |
| JFM-ADJ-092 | 优先复用现有 CDC 节点状态的 Curator/ZooKeeper 连接、路径配置、健康检查和读取能力；不得为故障监控重复创建不受管理的 ZooKeeper 客户端或维护第二套连接配置 | — |
| JFM-ADJ-093 | 单次 Summary/状态刷新不得对同一路径重复读取；客户端离线时必须跳过其 Job 路径读取；数据规模虽小（客户端通常不超过 10、每客户端数据源通常不超过 5），仍应避免无界并发、重复连接和明显的重复读取 | — |
| JFM-ADJ-094 | 页面和接口继续保持只读：禁止写数据库、写 ZooKeeper、创建或删除 ZK 节点；不改变"只展示启用客户端 `CDC_CLIENT_MULTIPLE.FG_ACTIVE='1'`"的现行规则；本轮只调整故障监控概览页，不改变 CDC 节点状态页面、故障详情页和历史页 | — |

后续实现可在代码分析后选择扩展 Summary 契约或增加专用组合响应，但必须满足上述最终语义，不得提前武断指定不符合现有架构的类名。预计受影响：API-1 `/summary` 的响应契约（新增客户端/Job 在线状态语义）或新增专用组合响应，以及后端 `JobFailureSummaryVO`/前端 `JobFailureSummaryVO` 类型。兼容原则：不破坏既有 Summary 字段，不改变 `dataSourceExists`/`dataSourceActive` 契约。

#### 6.7.10 不回归规则

新增 ZooKeeper 状态融合不得回归：查询区现有布局；业务库 6 列表格；多数据源拆分与顺序；无效、未激活及空 ORG 显示；Tooltip 数据源 ID；数据库故障时间、恢复时间、恢复尝试和详情；展开/折叠及刷新后状态保持；自动刷新选择；当前卡片全宽单列视觉；客户端和数据源一般过滤规则；数据库与 ZooKeeper 只读边界。

#### 6.7.11 ZooKeeper 运行状态融合可执行验收标准

| 编号 | 验收标准 |
|---|---|
| JFM-ACCEPT-064 | ZK 路径拼接和单 `DATA_SOURCE_ID` jobCode 正确（`/bsoft-cdc/clients/{clientId}/alive`、`/bsoft-cdc/clients/{clientId}/jobs/{jobCode}/alive`） |
| JFM-ACCEPT-065 | 客户端离线时跳过 Job alive 读取，该客户端全部 Job 显示"离线" |
| JFM-ACCEPT-066 | 客户端在线、Job 离线时只对应 Job 显示"离线" |
| JFM-ACCEPT-067 | 客户端和 Job 在线时继续使用数据库故障状态（正常/恢复中等） |
| JFM-ACCEPT-068 | ZK 读取异常（连接失败/超时等）不被误判为离线，进入页面统一错误状态 |
| JFM-ACCEPT-069 | ZK 失败时显示固定文案"ZooKeeper 连接失败，将在 60 秒重试"，无任何客户端卡片，无旧数据 |
| JFM-ACCEPT-070 | 失败后 60 秒自动重试，成功后解除错误状态、恢复正常刷新周期且无重复定时器 |
| JFM-ACCEPT-071 | 客户端头部在线/离线位于 clientId 前，且不增加 Job 在线/离线/未知数量统计 |
| JFM-ACCEPT-072 | Job 状态筛选"离线"语义正确且无"未知"选项 |
| JFM-ACCEPT-073 | 客户端排序符合离线→异常/恢复中→部分 Job 离线→全部正常→clientId |
| JFM-ACCEPT-074 | Job 离线时其他数据库列与详情入口不丢失 |
| JFM-ACCEPT-075 | 无效/未激活数据源和 Tooltip 不回归 |
| JFM-ACCEPT-076 | 未重复创建 ZK 客户端、客户端离线时确实无 Job 路径读取 |
| JFM-ACCEPT-077 | 前后端测试与构建、浏览器实页、ZK 可用/不可用场景验证 |
| JFM-ACCEPT-078 | 全程无数据库和 ZooKeeper 写操作 |

不得通过写数据库或写 ZooKeeper 人为构造测试状态。优先使用当前真实环境；缺失场景使用单元测试、Mock Curator/读取抽象或前端组件测试覆盖。

## 7. 详情页需求

### 7.1 故障概览

| 编号 | 规则 | 说明 |
|---|---|---|
| JFM-DETAIL-001 | 故障概览网格展示：客户端、业务库、故障根事件、首次失败时间、最近处理时间、重启次数、当前处理状态 | 4 列网格布局 |
| JFM-DETAIL-002 | 故障过程状态使用 5 种对外状态之一（非内部状态直接透传） | 见 §9 |

### 7.2 物理 Job 链

| 编号 | 规则 | 说明 |
|---|---|---|
| JFM-DETAIL-003 | 物理 Job 链单行横向滚动，每个节点用红/绿标记 | 红色 = 有异常标记，绿色 = 正常 |
| JFM-DETAIL-004 | 节点类型：INITIAL（初始）、INTERMEDIATE（中间）、CURRENT（当前）、FINAL（最终） | `JobChainNode.ChainNodeType` |

### 7.3 事件列表

| 编号 | 规则 | 说明 |
|---|---|---|
| JFM-DETAIL-005 | 事件列表 ID 截断规则：≤16 字符完整显示，>16 字符显示前6…后8 | `formatTruncatedId()` |
| JFM-DETAIL-006 | 事件列表无复制按钮 | — |
| JFM-DETAIL-007 | IGNORED_INVALID 和 IGNORED_STALE 事件归入排除事件列表 | `FaultEventModel.isMainChainEligible()` 返回 false |

### 7.4 恢复尝试卡片

| 编号 | 规则 | 说明 |
|---|---|---|
| JFM-DETAIL-008 | 恢复尝试卡片以 `RESTART_STARTED` 日志为界分组 | 每组一张卡片 |
| JFM-DETAIL-009 | 恢复尝试卡片按时间升序排列 | 初始故障卡片在最前 |
| JFM-DETAIL-010 | 含 `STABLE_CHECK_PASSED` 日志的卡片为绿色，无则为红色 | 绿色表示该次尝试最终成功恢复 |

### 7.5 故障历史

| 编号 | 规则 | 说明 |
|---|---|---|
| JFM-HIST-001 | 故障历史使用时间范围下拉选择：最近一天 / 最近一周 / 最近一个月 | 三个固定选项 |
| JFM-HIST-002 | 不显示传统分页组件（无页码、无每页条数选择器） | — |
| JFM-HIST-003 | 所选时间范围内的全部符合条件记录必须可见 | 不得因 pageSize 限制静默截断 |
| JFM-HIST-004 | 故障历史当前查看的行高亮 | `highlight-current-row` |
| JFM-HIST-005 | `RECOVERY_RECORDED` 状态在历史列表中显示为"已恢复" | 该映射为临时前端硬编码，正式映射应由统一映射层实现 |

当前实现状态：JFM-HIST-002 和 JFM-HIST-003 尚未完全实现（见 §19 GAP-HISTORY-001）。

## 8. 查询与筛选需求

| 编号 | 规则 | 说明 |
|---|---|---|
| JFM-QUERY-001 | 客户端筛选：多选下拉，支持"全部"互斥逻辑 | 选"全部"时清空其他选择，选具体客户端时移除"全部" |
| JFM-QUERY-002 | 数据源 ID 筛选：下拉，选项从 API 数据中动态提取 | `<el-select>`，精确匹配 【已被本轮调整替代：删除数据源 ID 查询条件，见 §6.3.3】 |
| JFM-QUERY-003 | Job 当前状态筛选：全部 / 正常 / 恢复中 | 单选下拉 |
| JFM-QUERY-004 | 自动刷新频率：1 分钟 / 60 分钟 / 360 分钟 | 后端不提供数据变更通知，依赖轮询 |
| JFM-QUERY-005 | 自动刷新不修改当前查询条件 | 仅重新请求数据 |
| JFM-QUERY-006 | 刷新期间禁用刷新按钮 | `refreshing` 标志控制 `disabled` |
| JFM-QUERY-007 | 刷新失败保留旧数据，不切换到错误状态 | 只有首次加载失败才展示错误页 |

## 9. 对外状态体系

### 9.1 状态层次

本功能的状态分为四个层次：

| 层次 | 状态体系 | 数量 | 用途 |
|---|---|---|---|
| 对外 Job 当前状态 | 正常、恢复中 | 2 种 | 概览页和接口面向用户展示 |
| 对外故障过程状态 | 流程异常、恢复失败、重启中、等待重启、已恢复 | 5 种 | 详情页和接口面向用户展示 |
| 内部计算结果 | `FaultProcessResult` | 3 种 | 后端内部计算 |
| 内部记录状态 | `RecordStatus` | 9 种 | 处理日志和流程阶段识别 |

内部状态（3+9）用于后端计算和阶段识别，不得未经映射直接作为对外最终状态。

### 9.2 内部状态定义（代码证据）

`FaultProcessResult` 定义文件：`backend/src/main/java/com/bsoft/cdcconfig/monitor/jobfailure/enums/FaultProcessResult.java`

| 枚举值 | 中文标签 | 代码语义 |
|---|---|---|
| `RECOVERY_RECORDED` | 已记录恢复 | 故障过程中存在 `STABLE_CHECK_PASSED` 日志且无数据异常 |
| `NOT_CLOSED` | 记录未闭环 | 故障过程无 `STABLE_CHECK_PASSED` 日志且无数据异常 |
| `DATA_ANOMALY` | 数据异常 | 故障过程存在结构异常（分叉/断链/环/多父等） |

`RecordStatus` 定义文件：`backend/src/main/java/com/bsoft/cdcconfig/monitor/jobfailure/enums/RecordStatus.java`

| 枚举值 | 中文标签 | 触发条件（handle_stage） |
|---|---|---|
| `WAITING_RESTART` | 等待重启 | `RESTART_SCHEDULED` |
| `RESTARTING` | 正在重启 | `RESTART_STARTED` |
| `STABILITY_OBSERVING` | 稳定观察中 | `NEW_JOB_SUBMIT_SUCCEEDED` |
| `RECOVERY_RECORDED` | 已记录恢复 | `STABLE_CHECK_PASSED` |
| `SUBMIT_FAILED` | 本次提交失败 | `NEW_JOB_SUBMIT_FAILED` |
| `RESTART_SKIPPED` | 计划已跳过 | `SCHEDULED_RESTART_SKIPPED` |
| `IGNORED` | 已忽略 | `JOB_FAILURE_IGNORED_INVALID` / `JOB_FAILURE_IGNORED_STALE` / `DUPLICATED_EVENT_IGNORED` |
| `NOT_CLOSED` | 记录未闭环 | `JOB_FAILURE_RECEIVED` 且无 `STABLE_CHECK_PASSED` |
| `DATA_ANOMALY` | 数据异常 | 存在结构异常（分叉/断链/环/多父等） |

主要使用位置：
- `RecordStatusResolver.resolve()` — 按最新处理日志的 handle_stage 判定 RecordStatus
- `FaultProcessResultResolver.resolve()` — 按是否存在 STABLE_CHECK_PASSED 和异常判定 FaultProcessResult
- `JobFailureServiceImpl.toDetailVO()` / `toSummaryVO()` — 将内部状态写入 VO 并直接返回前端
- `FaultProcessOverview.vue` — 前端硬编码 `RECOVERY_RECORDED → '已恢复'`，其余透传 `recordStatusLabel`
- `FaultHistory.vue` — 同上硬编码映射

相关测试：`RecordStatusResolverTest.java`

### 9.3 对外 Job 当前状态

| 编号 | 条件 | 结果 | 说明 |
|---|---|---|---|
| JFM-STATUS-001 | 逻辑 Job 无任何故障事件 | `正常` | 各时间字段和恢复尝试显示 `—` |
| JFM-STATUS-002 | 最近故障过程存在 `STABLE_CHECK_PASSED` 日志 | `正常` | 最近恢复时间 = 该日志的 `HANDLE_TIME` |
| JFM-STATUS-003 | 最近故障过程不存在 `STABLE_CHECK_PASSED` 日志 | `恢复中` | 最近恢复时间显示 `—` |

以上两条状态当前代码中由 `JobFailureServiceImpl.querySummary()` 直接判定（第 158-174 行），判定逻辑与需求一致。

### 9.4 对外故障过程状态

#### 9.4.1 互斥与优先级要求

五种对外故障过程状态必须满足：

- 同一个故障过程在同一时点只能得到一个对外过程状态；
- 五种状态必须互斥；
- 判定必须基于当前代码中实际存在的事件、记录状态和链路结果；
- 判定必须具有明确优先级。

**上述互斥性是正式需求，当前代码尚未实现统一映射层，五种对外状态在代码中并未严格互斥。** `SUBMIT_FAILED`、`RESTART_SKIPPED`、`NOT_CLOSED` 等内部状态各自独立对外返回，未合并为统一的"恢复失败"，也未按优先级执行互斥判定。该需求在当前实现中尚未满足（见 §19 GAP-STATUS-001、GAP-STATUS-002、GAP-STATUS-003）。

#### 9.4.2 可验证的映射（按优先级排列）

| 优先级 | 对外状态 | 判定条件 | 代码证据 | 当前实现 |
|---|---|---|---|---|
| 1 | `流程异常` | 故障过程存在结构异常（分叉、断链、环、多父等） | `FaultProcessResultResolver.resolve()` 和 `RecordStatusResolver.resolve()` 均在 `hasAnomalies=true` 时返回 `DATA_ANOMALY` | 已实现（但通过内部枚举直接对外返回，未经映射层） |
| 2 | `已恢复` | 故障过程中存在 `STABLE_CHECK_PASSED` 处理日志，且无结构异常 | `FaultProcessResultResolver.resolve()` 在无异常且存在 STABLE_CHECK_PASSED 时返回 `RECOVERY_RECORDED` | 已实现（同上） |
| 3 | `等待重启` | 故障过程无结构异常、无 STABLE_CHECK_PASSED，且最新处理阶段为 `RESTART_SCHEDULED` | `RecordStatusResolver.resolve()` 在 stage=RESTART_SCHEDULED 时返回 `WAITING_RESTART` | 内部状态已产生，但统一映射层未实现 |
| 4 | `重启中` | 故障过程无结构异常、无 STABLE_CHECK_PASSED，且最新处理阶段为 `RESTART_STARTED` 或 `NEW_JOB_SUBMIT_SUCCEEDED` | `RecordStatusResolver.resolve()` 在 stage=RESTART_STARTED 时返回 `RESTARTING`，stage=NEW_JOB_SUBMIT_SUCCEEDED 时返回 `STABILITY_OBSERVING` | 内部状态已产生，但统一映射层未实现 |
| 5 | `恢复失败` | 正式精确判定条件待实现。`SUBMIT_FAILED`、`RESTART_SKIPPED`、部分 `NOT_CLOSED` 仅为候选证据，从当前代码无法唯一确定"恢复失败"的精确判定条件，不得使用"其他情况"兜底 | 代码存在 `SUBMIT_FAILED`（NEW_JOB_SUBMIT_FAILED）、`RESTART_SKIPPED`（SCHEDULED_RESTART_SKIPPED）、`NOT_CLOSED`（JOB_FAILURE_RECEIVED 无后续），但尚无统一的"恢复失败"判定规则 | 正式需求待实现映射（见 §19 GAP-STATUS-003） |

#### 9.4.3 关键语义边界

| 编号 | 规则 | 说明 |
|---|---|---|
| JFM-STATUS-004 | `NEW_JOB_SUBMIT_SUCCEEDED` 只表示新 Job 已提交并进入稳定观察，不能直接认定为"已恢复" | 对应内部 `STABILITY_OBSERVING`，对外映射为"重启中" |
| JFM-STATUS-005 | 只有 `STABLE_CHECK_PASSED` 才构成正式恢复闭环，对应"已恢复"状态 | — |
| JFM-STATUS-006 | 无故障历史的逻辑 Job 不产生故障过程状态 | — |
| JFM-STATUS-007 | `NEW_JOB_SUBMIT_SUCCEEDED` 后未出现 `STABLE_CHECK_PASSED` 不等于"恢复失败" | 此时内部状态为 `STABILITY_OBSERVING`，对外应映射为"重启中"；不得与 `SUBMIT_FAILED` 场景混淆 |

#### 9.4.4 内部状态到对外状态的映射（需求规格）

以下映射表定义正式需求。优先级列表示判定顺序，高优先级先匹配。

| 优先级 | 对外状态 | 判定条件 | 使用的内部证据 |
|---|---|---|---|
| 1 | `流程异常` | 故障过程存在结构异常 | `FaultProcessResult.DATA_ANOMALY` 或 `RecordStatus.DATA_ANOMALY` |
| 2 | `已恢复` | 故障过程中存在 `STABLE_CHECK_PASSED`，且无结构异常 | `FaultProcessResult.RECOVERY_RECORDED` |
| 3 | `等待重启` | 无结构异常、无 `STABLE_CHECK_PASSED`，最新处理阶段为 `RESTART_SCHEDULED` | `RecordStatus.WAITING_RESTART` |
| 4 | `重启中` | 无结构异常、无 `STABLE_CHECK_PASSED`，最新处理阶段为 `RESTART_STARTED` 或 `NEW_JOB_SUBMIT_SUCCEEDED` | `RecordStatus.RESTARTING` 或 `RecordStatus.STABILITY_OBSERVING` |
| 5 | `恢复失败` | 正式精确判定条件待实现，不得使用"其他情况"兜底 | `RecordStatus.SUBMIT_FAILED`、`RecordStatus.RESTART_SKIPPED`、部分 `RecordStatus.NOT_CLOSED` 仅为候选证据，不足以唯一确定"恢复失败" |

当前实现状态：统一的内部→对外映射层尚未实现。前端通过硬编码 `RECOVERY_RECORDED → '已恢复'` 做部分映射，其余状态直接透传 `recordStatusLabel`（见 §19 GAP-STATUS-001、GAP-STATUS-002、GAP-STATUS-003）。

## 10. Job 链构造规则

| 编号 | 规则 | 说明 |
|---|---|---|
| JFM-CHAIN-001 | 关联字段为 `FAILED_JOB_ID` 和 `NEW_JOB_ID` | 处理日志的 `NEW_JOB_ID` 可能指向后续事件的 `FAILED_JOB_ID` |
| JFM-CHAIN-002 | 使用 BFS 在 NEW_JOB_ID→FAILED_JOB_ID 边上找出所有连通分量 | `FaultProcessGrouper` |
| JFM-CHAIN-003 | 起点判定：`FAILED_JOB_ID` 在前序事件中从未作为 `NEW_JOB_ID` 出现过 | 无前驱的节点为起点 |
| JFM-CHAIN-004 | 终点判定：存在 `HANDLE_STAGE = STABLE_CHECK_PASSED` 的处理日志则为已闭环 | 否则为未闭环 |
| JFM-CHAIN-005 | faultRootId = 故障过程中按 `FAILURE_TIME ASC` 排序的第一条事件的 `ID` | 同一故障过程中的所有事件共享同一个 faultRootId |
| JFM-CHAIN-006 | `BROKEN_CHAIN` 节点类型另有标记 | 断链节点仍需展示 |

## 11. 重启与恢复口径

| 编号 | 规则 | 说明 |
|---|---|---|
| JFM-RESTART-001 | 重启次数 = 故障过程中 `RESTART_STARTED` 日志的总数 | `FaultProcessGroup.countRestarts()` |
| JFM-RESTART-002 | 概览页"故障期间恢复尝试"来自同一次最近故障 | 不跨故障过程拼接 |
| JFM-RESTART-003 | 最近恢复时间 = 最近故障过程中 `STABLE_CHECK_PASSED` 日志的 `HANDLE_TIME` | 来自 `TimeCalculator.recoveryTime()` |
| JFM-RESTART-004 | `NEW_JOB_SUBMIT_SUCCEEDED` 表示新 Job 已提交成功，进入稳定观察 | 不等于"已完全恢复" |
| JFM-RESTART-005 | `STABLE_CHECK_PASSED` 表示稳定性检查通过，故障过程正式闭环 | 可安全认定为恢复完成 |

## 12. 异常链处理

| 编号 | 规则 | 说明 |
|---|---|---|
| JFM-ANOMALY-001 | 检测 6 种异常类型：FORK、MULTI_PARENT、BROKEN_CHAIN、LOOP、DUPLICATE_EDGE、ORPHAN_LOG | `AnomalyDetector` |
| JFM-ANOMALY-002 | 异常链仍然展示，不隐藏不跳过 | 用户需要看到完整链路 |
| JFM-ANOMALY-003 | BFS 使用已访问集合防止无限遍历 | `visited` Set |
| JFM-ANOMALY-004 | 存在数据异常时内部 `FaultProcessResult` 可能被设为 `DATA_ANOMALY`，对外映射为 `流程异常` | `FaultProcessResultResolver` → 映射层 |
| JFM-ANOMALY-005 | IGNORED_INVALID 和 IGNORED_STALE 事件不参与主链 | 归入排除事件列表（excluded events） |
| JFM-ANOMALY-006 | IGNORED_* 事件不参与有效故障链统计 | `FaultEventModel.isMainChainEligible()` 返回 false |
| JFM-ANOMALY-007 | 异常信息通过 `AnomalyVO` 列表随详情接口返回 | 前端在故障概览区域展示 |

## 13. CLOB 大字段加载

| 编号 | 规则 | 说明 |
|---|---|---|
| JFM-CLOB-001 | CLOB 字段不在列表接口中一次性全部返回 | API-1/API-2/API-3 返回的 detail 字段为截断或省略 |
| JFM-CLOB-002 | CLOB 通过 API-5 按需懒加载 | `GET /api/job-failure/clob/{faultRootId}/{clobField}/{recordId}` |
| JFM-CLOB-003 | CLOB 加载需验证 recordId 归属于指定 faultRootId 的故障过程 | `JobFailureErrorCode.RECORD_NOT_IN_FAULT_PROCESS` |
| JFM-CLOB-004 | CLOB 弹窗展示加载中、错误、空内容三种状态 | `ClobDetailDialog.vue` |
| JFM-CLOB-005 | CLOB 弹窗提供一键复制功能 | `el-button` + `navigator.clipboard` |

## 14. 接口需求

| 编号 | API | 方法 | 路径 | 说明 |
|---|---|---|---|---|
| JFM-API-001 | API-1 | GET | `/api/job-failure/summary` | 故障汇总。将 `CDC_CLIENT_MULTIPLE.DATA_SOURCE_ID` 按英文逗号拆分为单个 ID，按 `(CLIENT_ID, 拆分后的单个 DATA_SOURCE_ID)` 展开，返回每个逻辑 Job 的最新故障概况。响应类型：`List<JobFailureSummaryVO>`。包含 clientId、clientName、dataSourceId、dataSourceName、dataSourceOrg、dataSourceActive、dataSourceExists、jobStatus、latestFailureTime、latestFaultRootId、latestRestartCount、eventCountInWindow、latestRecoveryTime |
| JFM-API-002 | API-2 | GET | `/api/job-failure/latest/{clientId}/{dataSourceId}` | 最新故障。返回指定逻辑 Job 的最近一次故障过程详情。响应类型：`FaultProcessDetailVO` |
| JFM-API-003 | API-3 | GET | `/api/job-failure/history/{clientId}/{dataSourceId}` | 历史故障。需 `startTime`/`endTime`（格式 `yyyy-MM-dd'T'HH:mm:ss`）。所选时间范围内的全部符合条件记录必须可见。响应类型：`PageResult<FaultProcessSummaryVO>` |
| JFM-API-004 | API-4 | GET | `/api/job-failure/process/{faultRootId}` | 故障过程详情。按 faultRootId 查询任意一次历史故障过程。响应类型：`FaultProcessDetailVO` |
| JFM-API-005 | API-5 | GET | `/api/job-failure/clob/{faultRootId}/{clobField}/{recordId}` | CLOB 内容。clobField 取值：`failureDetail` 或 `errorDetail`。响应类型：`ClobDetailVO` |

所有接口均返回 `ApiResponse<T>` 统一响应格式（code/message/data）。

> **概览页接口字段调整（本轮已确认 · 已实现并验收）**：API-1 `/summary` 的响应类型 `JobFailureSummaryVO` 需新增 `dataSourceOrg` 字段（映射 `CDC_DATA_SOURCE.DATA_SOURCE_ORG`），用于概览页"业务库"列；`dataSourceId` 保留。现有 `dataSourceName` 字段允许为兼容保留，但概览页不再展示（见 §6.3.7）。

> **多数据源展开与存在性契约（本轮已确认 · 已实现并验收）**：API-1 `/summary` 的每条返回记录对应一个拆分后的单个 `DATA_SOURCE_ID`（拆分规则见 §6.5.1）。`JobFailureSummaryVO` 需新增 `dataSourceExists` 字段，并与 `dataSourceActive` 共同构成无歧义的存在性/激活状态组合契约：`dataSourceExists: true/false` 区分记录在 `CDC_DATA_SOURCE` 中是否存在；`dataSourceActive: true/false/null` 区分记录存在时的激活状态（null 表示记录不存在、不适用）。禁止通过 `dataSourceOrg == null` 判断记录不存在（详见 §6.5.5）。

## 15. 只读与安全约束

| 编号 | 规则 | 说明 |
|---|---|---|
| JFM-SAFE-001 | 页面为只读监控，不提供新增、编辑、删除操作 | 无写操作按钮、无表单 |
| JFM-SAFE-002 | 后端接口全部为 GET 方法 | 无 POST/PUT/PATCH/DELETE |
| JFM-SAFE-003 | 不读取 ZooKeeper（CLAUDE.md §14） | 后端无 ZK 只读客户端调用 【在故障监控概览页范围内已被 §6.7 的 ZooKeeper 运行状态融合需求局部替代，不再作为本页面现行规则；ZK 只读仍遵循 CLAUDE.md §14 只读约束，其他功能场景不受影响（依据 JFM-ADJ-073、JFM-ADJ-092、JFM-ADJ-094）】 |
| JFM-SAFE-004 | 不读取 RUN_STATE 表 | 数据边界限定为四张表 |
| JFM-SAFE-005 | 面向用户文案统一使用"故障"，不使用"失败" | 概览页表头、标签、提示语 |
| JFM-SAFE-006 | 不修改数据库表结构、索引或数据 | 写操作需人工审批 |

## 16. 性能与可用性要求

| 编号 | 规则 | 说明 |
|---|---|---|
| JFM-PERF-001 | 两张故障表仅有主键索引 | 未来数据增长需补充业务索引（`CLIENT_ID`、`DATA_SOURCE_ID`、`FAILURE_TIME`） |
| JFM-PERF-002 | 自动刷新默认间隔为 60 分钟 | 后端不提供实时推送 |
| JFM-PERF-003 | 故障历史按时间范围查询，不设 pageSize 硬编码上限 | 数据量增长后需评估是否需要后端调整查询策略 |

## 17. 验收标准

| 编号 | 检查项 | 验证方法 |
|---|---|---|
| JFM-ACCEPT-001 | 页面层级为"客户端 → 采集任务 → 失败时间 → 失败处理过程" | 浏览器实页验证，核对四层对应关系 |
| JFM-ACCEPT-002 | 客户端来自 `CDC_CLIENT_MULTIPLE` | 代码审查 `CdcClientMultipleMapper` 引用 |
| JFM-ACCEPT-003 | 采集任务及名称来自 `CDC_DATA_SOURCE` | 代码审查 `DataSourceMapper` 引用 |
| JFM-ACCEPT-004 | 失败事件来自 `CDC_JOB_FAILURE_EVENT` | 代码审查 `JobFailureEventMapper` 引用 |
| JFM-ACCEPT-005 | 处理过程来自 `CDC_JOB_FAILURE_HANDLE_LOG` | 代码审查 `JobFailureHandleLogMapper` 引用 |
| JFM-ACCEPT-006 | 客户端必须满足 `FG_ACTIVE = '1'` | 代码审查 `JobFailureServiceImpl` 第 75-76 行 |
| JFM-ACCEPT-007 | 数据源必须满足 `FG_ACTIVE = '1'` | 代码审查 `loadDataSourceNames()` 方法（当前为差距） 【在故障监控概览页范围内已被 §6.5 的页面例外规则替代，不再作为本页面现行规则/验收标准；其他功能场景不受影响（依据 JFM-ADJ-038、JFM-ADJ-040、JFM-ADJ-043、JFM-ACCEPT-049、JFM-ACCEPT-050）】 |
| JFM-ACCEPT-008 | 停用客户端不得展示 | 浏览器验证（需构造停用客户端数据） |
| JFM-ACCEPT-009 | 停用数据源不得作为采集任务展示 | 浏览器验证（当前为差距，需先实现 FG_ACTIVE 过滤） 【在故障监控概览页范围内已被 §6.5 的页面例外规则替代，不再作为本页面现行规则/验收标准；其他功能场景不受影响（依据 JFM-ADJ-038、JFM-ADJ-040、JFM-ADJ-043、JFM-ACCEPT-049、JFM-ACCEPT-050）】 |
| JFM-ACCEPT-010 | Job 对外当前状态只能显示"正常"或"恢复中" | 浏览器实页验证，概览页表格列 |
| JFM-ACCEPT-011 | 故障过程对外只能显示五种正式状态 | 浏览器实页验证，详情页状态标签 |
| JFM-ACCEPT-012 | 内部 `FaultProcessResult` 不得直接作为页面最终状态 | 代码审查 VO 构建和前端渲染 |
| JFM-ACCEPT-013 | 内部 `RecordStatus` 不得未经映射直接作为页面最终状态 | 代码审查 VO 构建和前端渲染 |
| JFM-ACCEPT-014 | 五种过程状态必须互斥 | 代码审查映射层逻辑 |
| JFM-ACCEPT-015 | 状态映射必须具有明确判定优先级 | 代码审查映射层逻辑 |
| JFM-ACCEPT-016 | 异常故障链应显示"流程异常" | 代码审查异常检测→映射管线 |
| JFM-ACCEPT-017 | `NEW_JOB_SUBMIT_SUCCEEDED` 不得直接显示为"已恢复" | 代码审查映射逻辑 |
| JFM-ACCEPT-018 | `STABLE_CHECK_PASSED` 才构成正式恢复闭环 | 代码审查 `FaultProcessResultResolver.resolve()` |
| JFM-ACCEPT-019 | 重启次数等于有效 `RESTART_STARTED` 记录数 | 代码审查 `FaultProcessGroup.countRestarts()` |
| JFM-ACCEPT-020 | `IGNORED_*` 不参与有效故障链统计 | 代码审查 `FaultEventModel.isMainChainEligible()` |
| JFM-ACCEPT-021 | 必须检测分叉、断链、环和多父 | 代码审查 `AnomalyDetector` + 单元测试 |
| JFM-ACCEPT-022 | 概览页按客户端卡片分组，每个卡片显示 Job 总数、正常数、异常数 | 浏览器实页验证，人工核对计数 |
| JFM-ACCEPT-023 | 异常客户端卡片优先排序，同状态按 clientId 字母序 | 浏览器实页验证 |
| JFM-ACCEPT-024 | 首次加载全部展开，折叠后刷新保持状态 | 浏览器交互验证 |
| JFM-ACCEPT-025 | 【已被 JFM-ACCEPT-037 替代】原调整前实现为 7 列，仅用于历史追溯，不再作为本轮验收标准 | 当前实现核对见 README；新验收标准见 §6.3.9 JFM-ACCEPT-037 |
| JFM-ACCEPT-026 | 无故障历史时显示 `—`，无详情入口 | 需构造无故障数据或检查代码逻辑 |
| JFM-ACCEPT-027 | 历史范围选项为"最近一天、最近一周、最近一个月" | 浏览器实页验证，FaultHistory 组件 |
| JFM-ACCEPT-028 | 历史页面不显示传统分页组件（无页码、无每页条数选择器） | 浏览器实页验证 |
| JFM-ACCEPT-029 | 所选时间范围内全部符合条件的记录必须可见 | 浏览器实页验证 + 接口返回核对 |
| JFM-ACCEPT-030 | 固定 `pageSize=1000` 不得造成静默截断 | 代码审查 + 需确认数据量超过 1000 时的行为 |
| JFM-ACCEPT-031 | 列表不得一次性返回全部 CLOB | 代码审查 API-1/API-2/API-3 返回字段 |
| JFM-ACCEPT-032 | CLOB 详情必须按需加载 | 浏览器验证弹窗行为（API-5） |
| JFM-ACCEPT-033 | 5 个 API 接口全部只读 GET，返回 `ApiResponse<T>` 统一格式 | 代码审查 `JobFailureController` |
| JFM-ACCEPT-034 | 空数据状态正确展示 | 浏览器实页验证 |
| JFM-ACCEPT-035 | 当前实现不满足正式需求的部分必须在 README 明确列为实现差距 | 文档审查 README §13 |

## 18. 保留的既有业务规则

以下规则由人工确认并继续保留：

| 编号 | 规则 |
|---|---|
| JFM-KEPT-001 | 重启次数 = 有效 `RESTART_STARTED` 记录数 |
| JFM-KEPT-002 | `NEW_JOB_SUBMIT_SUCCEEDED` = 新 Job 提交成功并进入稳定观察 |
| JFM-KEPT-003 | `STABLE_CHECK_PASSED` = 稳定性检查通过并形成恢复闭环 |
| JFM-KEPT-004 | `IGNORED_*` 不参与有效故障链统计 |
| JFM-KEPT-005 | 异常链检测至少包括分叉、断链、环、多父 |
| JFM-KEPT-006 | 两张故障业务表保持只插入，不更新，不删除 |
| JFM-KEPT-007 | 列表接口不得直接返回全部 CLOB，大字段必须按需加载 |

## 19. 当前实现与需求基线的差距清单

以下清单同时容纳"开放 GAP"与"已解决、仅保留历史追溯的 GAP"。开放差距的解决方式（修代码或调需求）由人工决定，不作为自动修复指令。

| 差距编号 | 类别 | 需求规则 | 当前实现 | 影响 |
|---|---|---|---|---|
| GAP-FILTER-001 | 数据过滤 | JFM-FILTER-002（历史）：`CDC_DATA_SOURCE` 须过滤 `FG_ACTIVE = '1'` 【仅在故障监控概览页范围内由需求例外关闭，不再实施；其他功能场景不受影响】 | 关闭依据 JFM-ADJ-038/040/043、JFM-ACCEPT-049/050。`DataSourceMapper.selectBatchIds()` 未过滤 FG_ACTIVE 不再作为缺陷；新的正确目标是读取 `FG_ACTIVE` 并用于页面标识，不过滤该数据源（见 §6.5.2） | 故障监控概览页不再过滤停用数据源；多数据源展开与异常数据源展示已实现并验收（见 GAP-OVERVIEW-MULTI-DATASOURCE-001，已解决） |
| GAP-STATUS-001 | 对外状态 | JFM-ACCEPT-011/012/013：对外故障过程状态须为 5 种正式状态，内部 `FaultProcessResult` 和 `RecordStatus` 不得直接对外返回 | 代码中 `FaultProcessResult`（3 种）和 `RecordStatus`（9 种）通过 VO 直接返回前端 | 详情页和概览页显示的状态标签为内部状态的直接中文映射（如"已记录恢复""记录未闭环"），不是 5 种正式状态 |
| GAP-STATUS-002 | 状态映射 | §9.4.4 映射表：须实现统一的内部→对外映射层 | 尚未实现统一映射层。前端通过硬编码 `RECOVERY_RECORDED → '已恢复'` 做部分映射，其余状态直接透传 `recordStatusLabel` | 状态映射不完整、不统一，前后端均存在不一致风险 |
| GAP-STATUS-003 | 恢复失败判定 | §9.4.2 优先级 5：须实现"恢复失败"的统一判定规则 | 代码不存在"恢复失败"概念。`SUBMIT_FAILED`、`RESTART_SKIPPED`、部分 `NOT_CLOSED` 仅为候选证据，从当前代码无法唯一确定"恢复失败"的精确判定条件，不得使用"其他情况"兜底 | "恢复失败"对外状态当前无对应实现，用户无法在页面看到该状态 |
| GAP-HISTORY-001 | 历史全量返回 | JFM-HIST-002、JFM-HIST-003：无传统分页组件，所选时间范围内全部记录可见 | 前端固定 `pageSize=1000`（`FaultHistory.vue` 第 148 行），后端服务端分页 | 超过 1000 条时可能静默截断 |
| GAP-OVERVIEW-001 | 概览页调整 | §6.3/§6.6/§6.7：查询区与六列表格、多数据源展开、客户端卡片视觉一致性、ZooKeeper 运行状态融合 | 功能主体（含多数据源展开与异常数据源展示）已实现并通过技术核验与人工页面验收；客户端卡片视觉一致性（§6.6）已由 Commit `4993400cebc145dd1fa69de1d1de8733e4568a2e` 实现并人工验收；ZooKeeper 运行状态融合（§6.7）尚未实现 | 概览页整体收口仍需等待 §6.7 ZooKeeper 运行状态融合实现与人工验收，以及最终 README/基线收口；GAP 在 ZK 状态融合验收通过前保持开放 |
| GAP-OVERVIEW-MULTI-DATASOURCE-001 | 多数据源展开 | §6.5：`CDC_CLIENT_MULTIPLE.DATA_SOURCE_ID` 按英文逗号拆分为多个单 ID 记录、逐条展示，并区分正常、未激活和无效数据源 | 已由 Commit `277e7d314ecafe0845bb4e6e9438b18767cb94c8` 解决：英文逗号拆分、Trim、忽略空项、每个 ID 独立一行、配置顺序、批量查询且无 N+1、`dataSourceExists` 与 `dataSourceActive` 契约、停用数据源红字后缀、无效数据源红字及 Tooltip 均已实现并通过技术核验与人工页面验收 | 已解决/已关闭，仅保留用于历史追溯，已不存在待实现差距 |
| GAP-OVERVIEW-CARD-VISUAL-001 | 客户端卡片视觉一致性 | §6.6：故障监控客户端卡片采用 CDC 节点状态卡片的同一视觉效果，并保持全宽单列 | 已由 Commit `4993400cebc145dd1fa69de1d1de8733e4568a2e` 解决：改为可见灰蓝边框、明确轮廓阴影、高不透明度浅色背景与标题区分隔，完成前端类型检查与构建、浏览器实页核验，并由用户根据真实截图人工确认"卡片能够明显分开"目标达成 | 已解决/已关闭，仅保留用于历史追溯，已不存在待实现差距 |
| GAP-OVERVIEW-ZK-STATUS-001 | ZooKeeper 运行状态融合 | §6.7：以 ZooKeeper `alive` 临时节点作为运行状态依据，与数据库故障事实组合展示，客户端头部显示在线/离线，Job 状态新增"离线"，ZK 失败隐藏旧数据并 60 秒自动重试 | 当前概览页仅基于数据库故障记录展示，尚未读取 ZooKeeper `alive` 状态，无法区分"没有故障记录"与"进程/Job 实际离线" | 需求已批准（APPROVED/PENDING），代码待实现与人工页面验收 |

## 20. 非目标

以下明确不属于本功能当前范围：

- 执行重启、停止或修改操作；
- 读取 ZooKeeper 节点状态；【在故障监控概览页范围内已被 §6.7 纳入范围：读取 ZooKeeper `alive` 临时节点作为运行状态依据；本页之外的 ZooKeeper 业务节点读取仍属非目标】
- 读取 `CDC_DATA_SOURCE_RUN_STATE` 表；
- 用户认证与权限管理；
- 数据写入或配置修改；
- 实时推送（WebSocket/SSE）；
- 前端自动化测试；
- 数据库表结构变更或索引添加；
- 与 ZK jobName 的关联查询。

## 21. 相关文档

- [README.md](README.md) — 功能概览、代码位置、接口一览
- [ARCHITECTURE.md](../../baseline/ARCHITECTURE.md) — 系统架构 §6
- [DOMAIN_GLOSSARY.md](../../baseline/DOMAIN_GLOSSARY.md) — Job 故障监控领域术语
- [PROJECT_STATUS.md](../../baseline/PROJECT_STATUS.md) — 项目状态快照
- [CLAUDE.md](../../../CLAUDE.md) — Agent 开发规范
