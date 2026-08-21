# 日志查询 API 契约设计（API）

## 1. 文档元数据与状态

| 项目 | 值 |
|---|---|
| 正式功能标识 | `log-query` |
| 目标文档 | `docs/features/log-query/API.md` |
| 文档状态 | `DRAFT_PENDING_USER_REVIEW`（初版、R1、R1.1 完整 API 与逻辑查询设计此前已用户最终人工复审批准；`LOG-QUERY-BASELINE-ADJUSTMENT-001` 新增功能开放状态接口并调整开放边界，本次调整待用户复审） |
| 对应需求状态 | `DRAFT_PENDING_USER_REVIEW`（`LOG-QUERY-BASELINE-ADJUSTMENT-001` 定向修订待用户复审） |
| 实现状态 | `IN_PROGRESS`（后端既有四接口 `IMPLEMENTED_ACCEPTED`；前端初版 `IMPLEMENTED_PENDING_REVIEW`；本次状态接口及相应交互修订尚未实现） |
| 依据需求 | `docs/features/log-query/REQUIREMENTS.md` |
| 创建日期 | 2026-08-20 |
| 关联任务 | `LOG-QUERY-API-DESIGN-001`（初版）、`LOG-QUERY-API-DESIGN-001-R1`（定向修订）、`LOG-QUERY-API-DESIGN-001-R1.1`（微型一致性修订）、`LOG-QUERY-BASELINE-ADJUSTMENT-001`（功能开放状态接口调整） |
| 最新批准日期 | `2026-08-20` |
| 最新批准任务 | `LOG-QUERY-API-DESIGN-APPROVAL-001` |
| 最新批准范围 | `LOG-QUERY-API-DESIGN-001 + R1 + R1.1 完整 API 与逻辑查询设计` |

修订记录：

- `LOG-QUERY-API-DESIGN-001`：初版，创建两份设计文档（均为 `DRAFT_PENDING_USER_REVIEW / NOT_STARTED`）。
- `LOG-QUERY-API-DESIGN-001-R1`：修正四类设计缺陷（列表接口改 POST、前端游标栈模型、`CDC_LOG_ID` 内部数值绑定、数据源一次全表读取）、游标条件指纹规范化、将 12 项待确认设计转为已确认设计决策、同步一致性。修订完成仍为 `DRAFT_PENDING_USER_REVIEW / NOT_STARTED`，等待用户最终复审。
- `LOG-QUERY-API-DESIGN-001-R1.1`：微型一致性修订，仅完成：(1) 数据源名称字段可空性补正（`sourceDataSourceName` / `targetDataSourceName` 改为可选，原始数据源 ID 为 NULL 时名称省略并显示 `--`）；(2) 相同签名密钥下普通服务重启不使游标失效，只有密钥轮换、密钥配置改变、版本不兼容或篡改才可能使旧游标失效；(3) 重取上一页只保证按相同固定排序与边界谓词重新查询目标页，不保证返回内容与首次访问该页时完全一致。修订完成仍为 `DRAFT_PENDING_USER_REVIEW / NOT_STARTED`，等待用户最终复审。
- `LOG-QUERY-API-DESIGN-APPROVAL-001`（2026-08-20）：用户已最终人工复审并批准初版、R1、R1.1 形成的完整 API 与逻辑查询设计，执行正式批准收口。本文档状态由 `DRAFT_PENDING_USER_REVIEW` 转为 `APPROVED`，实现状态仍为 `NOT_STARTED`。当前文档成为日志查询功能的正式 API 设计基线；可以进入 UI 详细设计、ACCEPTANCE 详细验收设计、前后端业务代码开发、Mapper 逻辑 SQL 实现、自动化测试与开发库功能验证；不代表 UI、ACCEPTANCE 已批准，不代表代码已实现或功能已验收，不代表最终分区、子分区、索引、生产 DDL 或生产等价性能已确定/通过；最终验证完成前，日志查询菜单必须保持隐藏（历史规则，“菜单必须保持隐藏”已被 `LOG-QUERY-BASELINE-ADJUSTMENT-001` 废止，改为“菜单始终显示、开关控制页面是否进入查询功能”）。
- `LOG-QUERY-BASELINE-ADJUSTMENT-001`（2026-08-21）：依据用户对日志查询功能开放方式及 ChatGPT 前端复审问题的最新确认，新增功能开放状态接口 `GET /api/log-query/status`（LQ-API-16、LQ-API-114 ~ 119），接口数量由 4 调整为 5；明确原四接口完全不检查开关、不新增“功能未开放”错误码；同步“全部”请求边界与数据源降级展示。本文档状态由 `APPROVED` 调整为 `DRAFT_PENDING_USER_REVIEW`，本次调整待用户复审；已有后端四接口实现 `IMPLEMENTED_ACCEPTED`，前端初版 `IMPLEMENTED_PENDING_REVIEW`，本次状态接口尚未实现。

本文只定义 API 契约，不代表接口已经实现或验收通过。本文档状态为 `DRAFT_PENDING_USER_REVIEW`：`LOG-QUERY-BASELINE-ADJUSTMENT-001` 本次调整待用户复审；复审批准前，本次调整不视为已批准，也不代表已有后端/前端实现已经符合本次新基线。最终物理数据库设计（分区粒度、子分区、索引、生产 DDL、最终执行计划）不在本文范围内。

## 2. 设计依据与追踪方式

- 本文所有业务规则均以已批准的 `REQUIREMENTS.md` 为唯一来源，通过需求编号引用建立追踪关系，不复制整份需求。
- 本文只确定「API 契约」与「逻辑查询边界」；最终分区粒度、子分区、最终索引形态、生产 DDL 与最终执行计划仍属于延期项（LQ-DB-07 / 08 / 09、LQ-NONGOAL-18）。
- 本文档此前已经批准，是日志查询功能的正式 API 设计基线；`LOG-QUERY-BASELINE-ADJUSTMENT-001` 新增状态接口并调整开放边界，当前文档状态为 `DRAFT_PENDING_USER_REVIEW`，本次调整待用户复审；复审批准前，后续开发不得把状态接口及相应开放控制视为已批准。

## 3. 总体约定

| 编号 | 规则 |
|---|---|
| LQ-API-01 | URL 风格沿用项目现有 `/api/<feature>` 方式（如 `/api/data-sources`、`/api/job-failure`），本功能统一使用 `/api/log-query` 前缀。 |
| LQ-API-02 | 所有接口使用项目统一响应体 `ApiResponse<T>`：`{ code: int, message: String, data: T, timestamp: String }`；成功 `code=200`、`message="success"`。 |
| LQ-API-03 | 业务错误一律通过 `BusinessException` 抛出，由 `GlobalExceptionHandler` 映射为 HTTP 200 + `ApiResponse.fail(code, message)`（项目既有 `DataSourceErrorCode`、`JobFailureErrorCode` 相同风格）。 |
| LQ-API-04 | 参数绑定、类型错误、`@Valid` 校验失败由 `GlobalExceptionHandler` 映射为 HTTP 400；未捕获异常映射为 HTTP 500，`message="服务器内部错误"`。 |
| LQ-API-05 | 项目 `spring.jackson.default-property-inclusion=non_null`：JSON 输出默认省略 null 字段。空值字段以「字段缺失」形式出现，前端必须把缺失字段等同于 null 处理并渲染为 `--`（LQ-LIST-25）；布尔型 `hasLogDetail`、`hasRawMessage`、`hasNext` 恒为真值型，不受省略影响。 |
| LQ-API-06 | 时间字段统一为字符串格式 `yyyy-MM-dd HH:mm:ss`，精确到秒，不携带时区后缀，不转换为 UTC（LQ-FILTER-58 / 59、LQ-TIME-01 / 02）。 |
| LQ-API-07 | `CDC_LOG_ID` 在所有 JSON 请求与响应（列表记录 ID、游标载荷、日志详情请求、原始消息请求）以及 HTTP 路径中一律以十进制字符串传输；前端不得转为 JavaScript Number（LQ-PAGE-27 / 28、AC-44）。内部按数值绑定执行，见 §6.6。 |
| LQ-API-08 | 日志类型使用固定白名单枚举值 `error`、`correct`（大小写敏感，全小写）；服务端在固定表枚举上映射为 `CDC_LOG_ERROR` / `CDC_LOG_CORRECT`。API 不得暴露可由客户端控制的表名（LQ-SCOPE-06）。 |
| LQ-API-09 | 列表页容量固定 100，服务端强制；请求契约不含 `pageSize`，服务端不读取任何页容量输入，始终按「取 101 条判 `hasNext`，返回 100 条」执行。 |
| LQ-API-10 | 日志查询接口只读，不提供新增、修改、删除、重试、忽略、提醒等写操作（LQ-SCOPE-08）。 |

## 4. 接口清单

| 编号 | 方法 | URL | 用途 |
|---|---|---|---|
| LQ-API-11 | GET | `/api/log-query/data-source-options` | 一次返回源库与目标库下拉候选 |
| LQ-API-12 | POST | `/api/log-query/logs/search` | 查询错误/正确日志列表（首查、下一页、上一页共用） |
| LQ-API-13 | GET | `/api/log-query/logs/{logType}/{cdcLogId}/detail` | 按日志类型与 `CDC_LOG_ID` 获取日志详情 |
| LQ-API-14 | GET | `/api/log-query/logs/{logType}/{cdcLogId}/raw-message` | 按日志类型与 `CDC_LOG_ID` 获取原始消息 |
| LQ-API-16 | GET | `/api/log-query/status` | 返回当前功能开放状态（`data.enabled`），不读取数据库 |

| 编号 | 规则 |
|---|---|
| LQ-API-15 | 列表查询唯一确定为 `POST /api/log-query/logs/search`，`Content-Type: application/json`，查询条件由 `LogListQuery` 以 JSON 请求体经 `@RequestBody` 承载。理由：请求可能包含两组多选 ID、两个表名、时间范围和签名游标，GET 查询串存在浏览器、代理、网关或服务器 URL 长度差异风险。POST 只用于承载只读查询条件，不改变接口只读语义（LQ-SCOPE-08）。 |
| LQ-API-114 | 功能开放状态接口 `GET /api/log-query/status` 只读、无请求参数，响应 `data` 为 `LogQueryStatusVO`：`enabled`（boolean，必填），即当前后端配置 `cdc.log-query.enabled`（`CDC_LOG_QUERY_ENABLED`）解析结果；默认 `false`（fail-closed）。统一响应使用项目既有 `ApiResponse<T>`。 |
| LQ-API-115 | 状态接口不读取数据库、不操作数据库或 ZooKeeper，只返回当前配置解析后的 `enabled`。 |
| LQ-API-116 | 状态接口请求级前端超时仍为 30 秒，不自动重试；失败或超时前端进入“功能状态获取失败”独立错误态并提供手动“重新检测”（见 UI 基线）。 |
| LQ-API-117 | 不新增“功能未开放”业务错误码（不新增 40310 或其他功能关闭错误码）；状态接口正常返回 `code=200`，开放状态以 `data.enabled` 表达。 |
| LQ-API-118 | 原四接口（LQ-API-11 ~ 14）完全不检查 `enabled` 开关：不拦截、不返回 403、不新增业务错误码、不增加数据库访问保护；`enabled=false` 时仅是前端页面不得主动调用这四个接口，直接调用仍按原契约执行（见 REQUIREMENTS LQ-OPEN-07）。 |
| LQ-API-119 | `cdc.log-query.enabled` 只控制前端页面使用流程，不是认证、鉴权或接口安全控制；本文不把该配置描述成权限、安全控制或接口封禁。 |

设计决策（单一方案，不保留多选）：数据源候选使用 **一个接口一次返回 source+target 两份列表**（LQ-API-11），不拆成两个接口。理由：

1. 候选全部来自同一张 `CDC_DATA_SOURCE`（约 100 条以内），一次请求只读取一次该表；
2. 两个 Tab 的源/目标候选集合相同（按类别全局划分，不随日志类型变化），共享同一份数据；
3. 单接口减少一次往返，与「数据源读取一次」的设计取向一致；
4. 仓库现有数据源接口为通用 CRUD，不存在按类别拆分的候选接口先例，单接口是最小契约。

日志类型固定枚举映射（LQ-API-08）：

| 白名单值 | 服务端映射表 | 说明 |
|---|---|---|
| `error` | `CDC_LOG_ERROR` | 错误日志 Tab |
| `correct` | `CDC_LOG_CORRECT` | 正确日志 Tab |

其余任何值由服务端拒绝，返回 `LOG_TYPE_INVALID`（见 §10）。

## 5. 数据源候选接口

### 5.1 请求

| 编号 | 规则 |
|---|---|
| LQ-API-20 | `GET /api/log-query/data-source-options`，无请求参数。 |

### 5.2 响应 `data` 结构

`DataSourceOptionsVO`：

| 字段 | 类型 | 必填 | 说明 |
|---|---|---|---|
| `sourceList` | `DataSourceOptionVO[]` | 是 | 源库候选，按 `DATA_SOURCE_ORG` 排序 |
| `targetList` | `DataSourceOptionVO[]` | 是 | 目标库候选，按 `DATA_SOURCE_ORG` 排序 |

`DataSourceOptionVO`：

| 字段 | 类型 | 必填 | 说明 |
|---|---|---|---|
| `id` | String | 是 | `DATA_SOURCE_ID`（提交值） |
| `org` | String | 否 | `DATA_SOURCE_ORG`（显示值）；为 NULL/空串时前端显示“未定义名称”，同时保留 `id` 辅助识别（与列表降级规则 LQ-API-64 一致） |

### 5.3 规则

| 编号 | 规则 |
|---|---|
| LQ-API-21 | 候选只包含启用且类别匹配的数据源：`FG_ACTIVE='1'`（字符串 `'1'`，依据仓库 `DataSource` 实体 `FG_ACTIVE` 的 String 类型与值语义），类别按 `trim + equalsIgnoreCase('SOURCE'/'TARGET')` 等价语义在内存判断（LQ-FILTER-11 / 31、LQ-DATA-05）。 |
| LQ-API-22 | 排序字段固定为 `DATA_SOURCE_ORG`（LQ-FILTER-13 / 33）；为 NULL/空串的 `DATA_SOURCE_ORG` 按“未定义名称”稳定显示，仍按原始值排序。 |
| LQ-API-23 | 候选接口每次请求恰好读取一次 `CDC_DATA_SOURCE` 全表（四列，见 §5.4），在内存过滤后拆分为 `sourceList` / `targetList`，并分别按 `DATA_SOURCE_ORG` 排序。不保留 SQL 过滤与内存过滤双方案。 |
| LQ-API-24 | 候选加载失败只影响下拉框；已生效列表查询与详情/原始消息不受影响。前端对候选失败提供可重试入口。 |

### 5.4 数据源全表一次读取（统一 SQL）

列表请求与候选接口共用同一张全表读取结果集语义（各请求各自执行一次，不跨请求共享）：

```sql
SELECT
    DATA_SOURCE_ID,
    DATA_SOURCE_ORG,
    DATA_SOURCE_CATEGORY,
    FG_ACTIVE
FROM CDC_DATA_SOURCE
```

| 编号 | 规则 |
|---|---|
| LQ-API-25 | 每个列表请求恰好执行一次上述全表查询；候选接口每次请求也恰好执行一次。使用同一结果在内存建立全量 ID→名称映射，并同时建立有效 source/target 候选 ID 集合用于校验列表查询条件（LQ-DATA-01 / 02 / 05、LQ-VALID-03）。 |
| LQ-API-26 | 名称映射读取所有行，不受 `FG_ACTIVE` 启停状态与类别限制（LQ-DATA-06）；下拉候选及已选 ID 校验只接受启用且类别匹配的数据源。两类使用同一结果的两种视图，不可混为一谈（LQ-API-66）。 |
| LQ-API-27 | `FG_ACTIVE` 必须按真实字段类型与值语义判断（仓库 `DataSource` 实体为 String，启用值为 `'1'`），文档不以字符串 `'1'` 与数值 `1` 两套未确认写法并存。 |

## 6. 列表查询接口

### 6.1 请求 `POST /api/log-query/logs/search`

`Content-Type: application/json`。查询对象 `LogListQuery` 以 JSON 请求体经 `@RequestBody` 绑定。

| 字段 | 类型 | 必填 | 说明 |
|---|---|---|---|
| `logType` | String | 是 | `error` / `correct` 白名单 |
| `sourceDataSourceIds` | String[] | 否 | 源库多选 `DATA_SOURCE_ID`；空数组 `[]` 等同未选择 |
| `sourceTableName` | String | 否 | 源表名，精确匹配、区分大小写；空文本 `null` 等同未选择 |
| `targetDataSourceIds` | String[] | 否 | 目标库多选 `DATA_SOURCE_ID`；空数组 `[]` 等同未选择 |
| `targetTableName` | String | 否 | 目标表名，精确匹配、区分大小写；空文本 `null` 等同未选择 |
| `startTime` | String | 是 | `yyyy-MM-dd HH:mm:ss`，包含端点 |
| `endTime` | String | 是 | `yyyy-MM-dd HH:mm:ss`，包含端点 |
| `cursor` | String | 否 | 上一页/下一页游标；首查不携带或为 `null` |

示例（即 R1 采用的正式请求示例）：

```json
{
  "logType": "error",
  "sourceDataSourceIds": ["DS_SRC_001", "DS_SRC_002"],
  "sourceTableName": "T_ORDER",
  "targetDataSourceIds": ["DS_TGT_001"],
  "targetTableName": null,
  "startTime": "2026-08-14 00:00:00",
  "endTime": "2026-08-20 23:59:59",
  "cursor": null
}
```

对外契约：**页面结束时间 `endTime` 是包含端点**；后端在 Service 层统一将 `endTime` 加 1 秒转换为 `endExclusive`，SQL 使用半开区间 `TARGET_TIME >= startTime AND TARGET_TIME < endExclusive`（LQ-FILTER-57）。

### 6.2 请求校验规则

| 编号 | 规则 |
|---|---|
| LQ-API-30 | 后端独立执行全部校验，不得因前端已校验而省略（LQ-FILTER-67、LQ-VALID-04 / 07）。 |
| LQ-API-31 | `logType` 必须命中白名单 `error` / `correct`，否则 `LOG_TYPE_INVALID`。 |
| LQ-API-32 | `startTime` 与 `endTime` 必须同时存在且格式为 `yyyy-MM-dd HH:mm:ss`，缺失或解析失败返回 `TIME_RANGE_REQUIRED`（LQ-FILTER-53 / 54）。 |
| LQ-API-33 | 解析后 `startTime` 不得晚于 `endTime`，否则 `TIME_ORDER_INVALID`（LQ-FILTER-55）。 |
| LQ-API-34 | `endExclusive = endTime + 1 秒`；`endExclusive - startTime <= 7 × 24 小时`，超过返回 `TIME_SPAN_EXCEEDED`（LQ-FILTER-56 / 57、AC-12）。完整选择连续 7 个自然日为合法边界值。 |
| LQ-API-35 | `sourceDataSourceIds`、`targetDataSourceIds` 每个数组最大 100 个元素（依据 `CDC_DATA_SOURCE` 全表约 100 条的安全上限，见 LQ-DATA-01）；数组元素必须为非空字符串且格式合法，否则 `DATA_SOURCE_IDS_INVALID`。多选去重后再进入查询（LQ-FILTER-18 / 38、LQ-VALID-05）。 |
| LQ-API-36 | “全部”是前端表单状态，不作为数据源 ID 传输；处于“全部”状态时前端省略对应数组或传空数组 `[]`，后端不生成对应字段的 `IN (...)` 谓词（LQ-FILTER-17 / 37、LQ-FILTER-73）；禁止把候选列表中的所有 ID 拼接成 `IN (...)` 来模拟“全部”，仅在选择具体数据源时使用绑定参数 `IN` 查询。 |
| LQ-API-37 | `sourceTableName`、`targetTableName` 去除首尾空白后长度不得超过 64 字符，否则 `TABLE_NAME_INVALID`（LQ-FILTER-23 / 43）。只做首尾空白规范化；不修改中间空格、不转换大小写、不做 `UPPER()` / `LOWER()` / `LIKE` / 通配符（LQ-FILTER-21 / 22 / 41 / 42、LQ-NONGOAL-08 / 09）。空文本视为未选择。 |
| LQ-API-38 | 已选源库/目标库 ID 必须存在于当前请求内构建的有效候选集合（启用且类别匹配，见 LQ-API-25 / 26），否则 `DATA_SOURCE_IDS_INVALID`（LQ-VALID-03）。 |
| LQ-API-39 | 请求契约不含 `pageSize`，服务端不读取任何页容量输入。若框架收到未知字段，按项目统一未知字段策略处理（Spring Boot Jackson 默认忽略未知 JSON 属性），不为 `pageSize` 建立专门规则。 |
| LQ-API-40 | 四类可选条件均在必填 `TARGET_TIME` 范围基础上以 `AND` 组合；四条件全空时允许仅按时间范围查询固定排序第一页（LQ-FILTER-70 ~ 75、LQ-PERF-08）。 |

### 6.3 响应 `data` 结构

`LogListResponse`：

| 字段 | 类型 | 必填 | 说明 |
|---|---|---|---|
| `items` | `LogListVO[]` | 是 | 当前页列表，最多 100 条；可能为空数组 |
| `hasNext` | boolean | 是 | 是否有下一页 |
| `nextCursor` | String | 否 | 取到第 101 条时返回（边界为第 100 条记录的 `TARGET_TIME` 与 `CDC_LOG_ID`）；无下一页时字段省略 |

`LogListVO`（每行）。必填性依据数据库可空性与需求的 `--` 展示规则（LQ-LIST-25）；无法从仓库确认可空性的字段一律标为可选，前端对缺失字段渲染 `--`：

| 字段 | 类型 | 必填 | 说明 |
|---|---|---|---|
| `cdcLogId` | String | 是 | 记录唯一标识、游标辅助字段、详情/原始消息查询依据（LQ-LIST-14）；十进制字符串 |
| `sourceDataSourceId` | String | 否 | 日志中的 `SOURCE_DATA_SOURCE_ID` 原始值；NULL 时省略，前端显示 `--` |
| `sourceDataSourceName` | String | 否 | 源库显示名称（映射规则见 §8）；原始 ID 为 NULL 或映射无可用名称时省略，前端显示 `--` |
| `sourceTableName` | String | 否 | 源表名；NULL 时省略，前端显示 `--` |
| `targetDataSourceId` | String | 否 | 日志中的 `TARGET_DATA_SOURCE_ID` 原始值；NULL 时省略，前端显示 `--` |
| `targetDataSourceName` | String | 否 | 目标库显示名称；原始 ID 为 NULL 或映射无可用名称时省略，前端显示 `--` |
| `targetTableName` | String | 否 | 目标表名；NULL 时省略，前端显示 `--` |
| `instructionType` | String | 否 | 指令类型，原样显示不转换；NULL 时省略，前端显示 `--` |
| `logSummary` | String | 否 | `LOG_DETAIL` 的有界摘要，最大 300 字符（已确认决策 LQ-API-90-A，见 §6.5）；`LOG_DETAIL` 为 NULL 时省略，前端显示 `--` |
| `hasLogDetail` | boolean | 是 | 是否存在 `LOG_DETAIL` 内容（存在则日志详情按钮可用） |
| `hasRawMessage` | boolean | 是 | 是否存在 `RAW_MESSAGE` 内容（存在则原始消息按钮可用） |
| `offset` | String | 否 | Kafka 偏移量，按字符串传输（见 §6.5）；NULL 时省略，前端显示 `--` |
| `sourceTime` | String | 否 | 采集时间，`yyyy-MM-dd HH:mm:ss`；NULL 时省略，前端显示 `--` |
| `kafkaEnqueueTime` | String | 否 | 进入链路时间；NULL 时省略，前端显示 `--` |
| `targetTime` | String | 是 | 同步到目标表时间；按已批准需求视为非空，恒返回 |
| `insertTime` | String | 否 | 日志落盘时间；NULL 时省略，前端显示 `--` |

### 6.4 返回约束

| 编号 | 规则 |
|---|---|
| LQ-API-41 | 返回 `items` / `hasNext` / `nextCursor`，**不返回** `total`、`totalPages`、页码或任何跳页信息（LQ-PAGE-04 / 05 / 06、LQ-PERF-04）。 |
| LQ-API-42 | 列表绝不包含完整 `LOG_DETAIL`、`RAW_MESSAGE` 或 `RESULT_DETAIL`（LQ-DETAIL-03、LQ-PERF-02、LQ-NONGOAL-15 / 16）。 |
| LQ-API-43 | 列表不执行 `COUNT(*)`、不使用 `OFFSET` 深分页（LQ-PERF-03 / 05）。 |
| LQ-API-44 | 列表固定排序 `TARGET_TIME DESC, CDC_LOG_ID DESC`，禁止用户表头排序（LQ-PAGE-20 / 21）。 |

### 6.5 摘要与数字字段

| 编号 | 规则 |
|---|---|
| LQ-API-45 | `logSummary` 最大长度为 **300 字符**（Unicode 码点），由服务端在 SQL 中通过 `SUBSTR(LOG_DETAIL, 1, 300)` 截取。该值位于需求上限“建议不超过 500 字符”之内（LQ-DETAIL-04），为已确认设计决策（LQ-API-90-A）。 |
| LQ-API-46 | Oracle `SUBSTR` 按字符语义截取（非字节），与需求无关的字节问题不适用；截取窗口内的换行、空格、缩进原样保留，前端以 CSS 单行省略显示（`white-space: nowrap` 折叠换行为空格），不通过 Tooltip 展示完整异常（LQ-LIST-27）。 |
| LQ-API-47 | `offset` 按字符串传输。`OFFSET` 列真实类型尚未从生产 DDL 确认；开发前从仓库现有表结构/映射确认数据库真实类型，JSON 对外暂按字符串传输，不依赖生产最终物理 DDL（已确认决策 LQ-API-90-H）。 |
| LQ-API-48 | `hasLogDetail` / `hasRawMessage` 由服务端在数据库侧用对 LOB 长度/空值的轻量判定计算（`LENGTH(列) > 0` 或等价判定；Oracle 空串即 NULL，`LENGTH(NULL)` 为 NULL），避免把完整 CLOB 传入应用，满足“返回是否存在标记但不读取完整内容”（LQ-DETAIL-11）。本文不宣称任何表达式在未经执行计划或性能验证时一定零成本（LQ-PERF-14）。 |

### 6.6 `CDC_LOG_ID` 外部字符串、内部数值绑定

| 编号 | 规则 |
|---|---|
| LQ-API-97 | `CDC_LOG_ID` 采用「外部字符串、内部数值」单一绑定规则：HTTP 路径、JSON 字段、游标载荷中的 `CDC_LOG_ID` 一律为十进制字符串（LQ-API-07）；后端收到后校验十进制格式和 `NUMBER(19,0)` 范围；Service / Mapper 查询参数转换为无损数值类型（建议 `BigDecimal`，scale=0，或与项目 Oracle NUMBER 映射一致的无损类型）；列表从数据库读取 `CDC_LOG_ID` 后，在响应与游标编码边界转换为十进制字符串。 |
| LQ-API-98 | SQL 中 `CDC_LOG_ID = #{cdcLogId}`、`CDC_LOG_ID < #{cursorCdcLogId}` 必须绑定 Oracle 数值参数（如 `BigDecimal`），不得依赖 VARCHAR 到 NUMBER 的隐式转换；不得对 `CDC_LOG_ID` 列使用 `TO_CHAR`、`CAST` 等函数；前端始终只把 ID 当字符串。不擅自断言 Java `long` 足以覆盖任意 `NUMBER(19,0)`，除非仓库已证明 ID 生成范围永远不超过 `Long.MAX_VALUE`。 |
| LQ-API-99 | 详情与原始消息路径参数 `cdcLogId` 若非法（非 1~19 位十进制字符串或超出 `NUMBER(19,0)` 范围）返回 HTTP 400（框架风格，LQ-API-04），与业务错误 `LOG_RECORD_NOT_FOUND`（HTTP 200 + 40410）明确区分：前者是参数格式错误，后者是记录不存在。 |

## 7. 游标协议

| 编号 | 规则 |
|---|---|
| LQ-API-50 | 采用 **服务端可验证的不透明游标**（唯一方案，不留多选）。游标由前端原样保存与回传，前端不解码、不解析其内容。 |
| LQ-API-51 | 游标载荷包含：版本 `v`、日志类型 `lt`、条件指纹 `fp`、边界 `TARGET_TIME`（`yyyy-MM-dd HH:mm:ss`）、边界 `CDC_LOG_ID`（十进制字符串）。 |
| LQ-API-52 | 编解码格式：载荷为 UTF-8 JSON 的 `base64url`（无填充）编码，格式为 `payload + "." + HMAC-SHA256(secret, payload)` 十六进制签名，HMAC 覆盖载荷的原始 base64url 文本。签名使用常量时间比较。签名密钥来自后端持久化配置，不硬编码、不入 DTO、不入库、不出接口。服务使用相同签名密钥重启或重新部署时，旧游标仍可正常验签；只有密钥轮换、密钥配置改变、游标版本不兼容或游标被篡改时，旧游标才可能失效。验签失败返回 `CURSOR_INVALID`，页面提示用户重新查询第一页。不承诺游标永久有效。不得引入服务端游标会话、缓存或游标数据库表。 |
| LQ-API-53 | 条件指纹 `fp`：对规范化条件 JSON（固定字段顺序、UTF-8、时间统一秒级 `yyyy-MM-dd HH:mm:ss`、数据源 ID 数组去重后按字典序升序排序、空数组统一为 `[]`、空文本统一为 `null`）的字节计算 SHA-256，取小写十六进制。生成与校验必须使用同一规范化规则（见 `DESIGN.md` §7.1）。不使用未经转义的分隔符拼接字符串。 |
| LQ-API-54 | 服务端校验顺序：拆解 `payload.signature` → base64url 解码 → 验签（常量时间比较）→ 校验版本 → 校验 `lt` 与请求 `logType` 一致 → 用当前请求条件重算 `fp` 并比对。任何一步失败：格式/签名/版本失败返回 `CURSOR_INVALID`；日志类型或指纹不一致返回 `CURSOR_CONDITION_MISMATCH`。密钥轮换、密钥配置改变、版本不兼容或篡改导致旧游标失效时按验签失败处理为 `CURSOR_INVALID`。 |
| LQ-API-55 | 游标只支持“向后（更旧）”翻页；上一页由前端游标栈重新发送前一页的请求游标实现，服务端不实现反向排序（见 §7.1）。 |
| LQ-API-56 | 上一页唯一方案（与 `DESIGN.md` §7.2 / §7.3 一致）：前端为每个 Tab 维护 **已访问页面各自的请求游标栈**，栈顶对应当前页；`requestCursorStack[0] = null` 表示第 1 页请求无游标。当前页请求游标始终等于栈顶；当前响应的 `nextCursor` 单独保存在当前页状态中，不得在尚未进入下一页时提前压入栈。状态转换见 §7.1 表格。 |
| LQ-API-57 | 首查不携带 `cursor`（栈为 `[null]`）；下一页请求携带当前页响应保存的 `nextCursor`；上一页请求携带弹出栈顶后新的栈顶游标（第 2 页返回第 1 页时为 `null`）。 |
| LQ-API-58 | `hasNext` 精确定义：服务端取 101 条，取到 101 条则 `hasNext=true`、`nextCursor` 为第 100 条记录的边界；取到 ≤100 条则 `hasNext=false`、`nextCursor` 省略。 |
| LQ-API-59 | 重复发送目标页的请求游标，会按照相同的固定排序和边界谓词重新查询目标页；在持续写入或晚到数据场景下，**不保证返回内容与首次访问该页时完全一致**，也不承诺跨请求数据库快照一致性。晚到且排序位置落入后续页的数据可能在后续页出现，新插入且排序位置位于第一页之前的数据不会自动进入已显示列表（LQ-PAGE-25 语义下的“不重不漏”以固定排序与边界谓词为准）。 |
| LQ-API-60 | `CDC_LOG_ID` 在 JSON/路径/游标载荷中一律为字符串，Service 校验后以不丢精度数值类型（建议 `BigDecimal`）执行绑定，不使用隐式转换（§6.6、LQ-API-97 / 98）。 |

### 7.1 前端游标栈精确状态转换

唯一模型：每个 Tab 的游标栈只保存“已访问页面各自的请求游标”，栈顶对应当前页。精确状态转换：

| 动作 | 请求游标 | 成功后的游标栈 |
|---|---|---|
| 首次查询第1页 | `null` | `[null]` |
| 第1页进入第2页 | 第1页响应的 `C1` | `[null, C1]` |
| 第2页进入第3页 | 第2页响应的 `C2` | `[null, C1, C2]` |
| 第3页返回第2页 | 弹出 `C2` 后使用新的栈顶 `C1` | `[null, C1]` |
| 第2页返回第1页 | 弹出 `C1` 后使用新的栈顶 `null` | `[null]` |

失败原子性：

| 编号 | 规则 |
|---|---|
| LQ-API-110 | 点击下一页时，请求游标取当前页响应保存的 `nextCursor`；请求成功前不得永久压栈；请求失败，仍停留当前页，栈不变。 |
| LQ-API-111 | 点击上一页时，不得在请求成功前永久弹栈；可以先计算目标栈（弹出栈顶），成功后整体替换；请求失败，当前页和原栈保持不变。 |
| LQ-API-112 | 当前页单独保存该页响应的 `hasNext`、`nextCursor`。没有上一页的判断为栈长度等于 1；没有下一页的判断为当前响应 `hasNext=false`。 |
| LQ-API-113 | 点击“查询”成功后原子重置为 `[null]`；失败保留旧栈。两个 Tab 各自维护独立栈。 |

## 8. 数据源名称映射（列表）

| 编号 | 规则 |
|---|---|
| LQ-API-61 | 每次列表请求（首查、点击查询、下一页、上一页）都重新读取一次 `CDC_DATA_SOURCE` 全表（四列，见 LQ-API-25），在该请求内构建 `DATA_SOURCE_ID -> DATA_SOURCE_ORG` 内存映射并同时建立候选集合；不跨请求缓存（LQ-DATA-01 / 02 / 11）。 |
| LQ-API-62 | 一次列表请求只能读取一次数据源全表；禁止按日志行逐行查数据源（禁止 N+1），不在分页前与超大日志表做大表关联（LQ-DATA-03 / 04、LQ-PERF-07）。 |
| LQ-API-63 | 历史名称映射读取全部数据源记录，不按 `FG_ACTIVE` 和类别过滤（LQ-DATA-06）。 |
| LQ-API-64 | 降级显示规则（LQ-DATA-07 ~ 10 / 13 / 14），列表、Tooltip 与详情统一：名称和 ID 均缺失 → 显示 `--`，不显示 Tooltip；名称缺失但 ID 存在 → 单元格只显示 ID，Tooltip 只显示“数据源 ID：{ID}”，详情只显示一次 ID；名称存在且 ID 存在 → 单元格显示名称，Tooltip 显示完整名称和“数据源 ID：{ID}”，详情展示名称与 ID；数据源记录存在但 `DATA_SOURCE_ORG` 为空 → 显示“未定义名称”，Tooltip 同时显示 ID。不得出现 Tooltip 显示值与单元格降级值矛盾，不得出现 `ID（ID）` 重复展示；不得回退为字符串 `"null"`。 |
| LQ-API-65 | 响应同时返回原始 ID 与显示名称（`sourceDataSourceId` + `sourceDataSourceName`），前端据此组合单元格与 Tooltip 展示；两者均为空时不显示 Tooltip；名称映射和降级只影响展示，不改变查询条件（LQ-DATA-14）。 |
| LQ-API-66 | 名称映射只作用于列表展示，不参与 SQL 过滤；历史日志引用的已停用、类别变化或已缺失数据源 ID 不影响列表返回（降级为 LQ-API-64 规则），但作为“已选过滤条件”的提交 ID 仍必须通过 LQ-API-38 的候选校验。候选校验与历史名称展示不可混为一谈。 |

## 9. 日志详情与原始消息接口

### 9.1 详情接口

`GET /api/log-query/logs/{logType}/{cdcLogId}/detail`

| 编号 | 规则 |
|---|---|
| LQ-API-70 | `logType` 白名单校验；`cdcLogId` 必须为 1~19 位十进制字符串且在 `NUMBER(19,0)` 范围内，非法返回 HTTP 400（LQ-API-99）。详情与原始消息请求通过固定 `logType + cdcLogId` 精确查询，**不是列表查询，不要求携带时间范围**（LQ-DETAIL-20 / 30）。 |
| LQ-API-71 | 详情只读取详情所需字段：`CDC_LOG_ID`、`SOURCE_DATA_SOURCE_ID`、`SOURCE_TABLE_NAME`、`TARGET_DATA_SOURCE_ID`、`TARGET_TABLE_NAME`、`INSTRUCTION_TYPE`、`RESULT_CODE`、`OFFSET`、`SOURCE_TIME`、`KAFKA_ENQUEUE_TIME`、`TARGET_TIME`、`INSERT_TIME`、完整 `LOG_DETAIL`；不读取 `RESULT_DETAIL`，不顺带读取 `RAW_MESSAGE`（LQ-DETAIL-27 / 28）。 |
| LQ-API-72 | 记录不存在返回 `LOG_RECORD_NOT_FOUND`（HTTP 200 + 业务码）。 |
| LQ-API-73 | 响应 `data` 结构 `LogDetailVO`：`cdcLogId`（必填，String）、`sourceDataSourceId`、`sourceTableName`、`targetDataSourceId`、`targetTableName`、`instructionType`、`resultCode`、`offset`、`sourceTime`、`kafkaEnqueueTime`、`targetTime`、`insertTime`、`logDetail`（完整内容）。时间字段为 `yyyy-MM-dd HH:mm:ss` 字符串；`cdcLogId`、`offset` 为字符串。除 `cdcLogId`、`targetTime` 外字段按数据库可空性标为可选，缺失时前端渲染 `--`（与列表规则一致，LQ-LIST-25）。 |
| LQ-API-74 | 详情弹窗展示“源库名称和 ID”“目标库名称和 ID”，名称复用发起弹窗的列表行已返回的 `sourceDataSourceName` / `targetDataSourceName`；当名称缺失（原始 ID 为 NULL 或映射无可用名称）时弹窗对应位置显示 `--`；本接口不重新读取数据源表、不返回名称（已确认决策 LQ-API-90-E）。 |

### 9.2 原始消息接口

`GET /api/log-query/logs/{logType}/{cdcLogId}/raw-message`

| 编号 | 规则 |
|---|---|
| LQ-API-75 | 原始消息只读取 `RAW_MESSAGE` 及响应所必需的最小标识（`CDC_LOG_ID`），不顺带读取完整日志详情或其他大字段。 |
| LQ-API-76 | `cdcLogId` 非法（非十进制或越界）返回 HTTP 400（LQ-API-99）；记录不存在返回 `LOG_RECORD_NOT_FOUND`；记录存在但 `RAW_MESSAGE` 为 NULL 或空串时，返回成功且 `rawMessage` 为空字符串（空内容与记录不存在互不混淆）。 |
| LQ-API-77 | `RAW_MESSAGE` 为 NULL、空串、合法 JSON、非 JSON 或超大文本时，API 一律**原样返回**，不修改、不格式化、不保存数据库内容；JSON 合法性判断与“原文/格式化”切换由前端负责（LQ-DETAIL-33 ~ 37）。 |
| LQ-API-78 | 响应 `data` 结构 `RawMessageVO`：`cdcLogId`（String）、`rawMessage`（String，可为空串）。 |
| LQ-API-79 | “复制原文”始终复制未格式化的原始内容；弹窗关闭后前端清理持有内容（LQ-DETAIL-35 / 36 / 39）。 |

## 10. 统一错误与超时

### 10.1 错误码

`LogQueryErrorCode` 按项目 `JobFailureErrorCode` / `DataSourceErrorCode` 工厂方法风格设计（常量 + 返回 `BusinessException` 的静态工厂）。码段避开既有 40001~40007、40400~40403、40900~40901、50000、50010，码值为已确认设计决策（LQ-API-90-K）。

| 编号 | 常量 | 码值 | 触发场景 |
|---|---|---|---|
| LQ-API-80 | `TIME_RANGE_REQUIRED` | 40010 | `startTime` / `endTime` 缺失或格式非法 |
| LQ-API-81 | `TIME_ORDER_INVALID` | 40011 | `startTime > endTime`（不完整/顺序错误） |
| LQ-API-82 | `TIME_SPAN_EXCEEDED` | 40012 | `endExclusive - startTime > 7 × 24 小时` |
| LQ-API-83 | `DATA_SOURCE_IDS_INVALID` | 40013 | 数据源 ID 数组数量超限、元素非法或不在有效候选集合 |
| LQ-API-84 | `LOG_TYPE_INVALID` | 40014 | `logType` 非 `error` / `correct` |
| LQ-API-85 | `CURSOR_INVALID` | 40015 | 游标格式非法、验签失败（含密钥轮换后旧游标失效）或版本不支持 |
| LQ-API-86 | `CURSOR_CONDITION_MISMATCH` | 40016 | 游标 `logType` 或条件指纹与当前请求不一致 |
| LQ-API-87 | `TABLE_NAME_INVALID` | 40017 | 表名长度超限或格式非法 |
| LQ-API-88 | `LOG_RECORD_NOT_FOUND` | 40410 | 详情/原始消息记录不存在（与路径参数 `cdcLogId` 非法返回 HTTP 400 区分，见 LQ-API-99） |
| LQ-API-89 | `QUERY_TIMEOUT` | 50020 | 数据库语句超时（Service 捕获超时异常映射为业务码） |
| LQ-API-90 | `DATABASE_ACCESS_FAILED` | 50021 | 数据库访问失败 |

> 本功能**不新增“功能未开放”业务错误码**：不新增 40310 或其他功能关闭错误码。`enabled=false` 时前端不主动调用原四接口（LQ-API-118），状态接口正常返回 `code=200`，开放状态以 `data.enabled` 表达（LQ-API-117）。

### 10.2 超时职责与先后关系

| 编号 | 规则 |
|---|---|
| LQ-API-91 | 前端对日志查询相关请求显式设置 `timeout=30000ms`，覆盖全局 `http.ts` 的 `10000ms`（前端实现阶段必须包含的改造点，本任务不改代码）；这是“前端与后端统一 30 秒目标”的落点（LQ-LOAD-30），为已确认设计决策（LQ-API-90-I）。 |
| LQ-API-92 | 后端数据库语句超时目标 25 秒（低于前端 30 秒），通过 JDBC `queryTimeout` / MyBatis 语句超时配置；超时后 Service 捕获并映射为 `QUERY_TIMEOUT`（50020），保证浏览器停止等待前数据库已经中止（LQ-LOAD-31），为已确认设计决策（LQ-API-90-J）。 |
| LQ-API-93 | Hikari `connection-timeout=10000ms` 是连接获取超时，不是语句执行超时；池大小为 5，日志查询接口不做长事务。 |
| LQ-API-94 | 查询超时与失败**不自动重试**（LQ-LOAD-33）。 |
| LQ-API-95 | 3 秒“查询耗时较长”慢查询提示由前端基于同一请求自行展示（LQ-LOAD-14），API 不承担该提示。 |
| LQ-API-96 | 前端请求开始即显示加载状态；30 秒超时后结束本次加载并显示可操作错误；失败保留旧表单、旧已生效条件、旧列表与旧游标（LQ-LOAD-35 / 36）。 |

## 11. 示例

### 11.1 数据源候选响应

```json
{
  "code": 200,
  "message": "success",
  "data": {
    "sourceList": [
      { "id": "DS_SRC_001", "org": "业务库-订单" },
      { "id": "DS_SRC_002", "org": "业务库-会员" }
    ],
    "targetList": [
      { "id": "DS_TGT_001", "org": "数仓ODS" }
    ]
  },
  "timestamp": "2026-08-20T10:00:00.123"
}
```

### 11.2 首次列表查询请求与响应

请求：

```http
POST /api/log-query/logs/search
Content-Type: application/json

{
  "logType": "error",
  "sourceDataSourceIds": ["DS_SRC_001"],
  "sourceTableName": "T_ORDER",
  "targetDataSourceIds": ["DS_TGT_001"],
  "targetTableName": "ODS_ORDER",
  "startTime": "2026-08-20 00:00:00",
  "endTime": "2026-08-20 23:59:59",
  "cursor": null
}
```

响应（`CDC_LOG_ID` 为字符串；时间字段为 `yyyy-MM-dd HH:mm:ss`；null 字段省略）：

```json
{
  "code": 200,
  "message": "success",
  "data": {
    "items": [
      {
        "cdcLogId": "7755033852453421056",
        "sourceDataSourceId": "DS_SRC_001",
        "sourceDataSourceName": "业务库-订单",
        "sourceTableName": "T_ORDER",
        "targetDataSourceId": "DS_TGT_001",
        "targetDataSourceName": "数仓ODS",
        "targetTableName": "ODS_ORDER",
        "instructionType": "INSERT",
        "logSummary": "同步订单数据成功",
        "hasLogDetail": true,
        "hasRawMessage": false,
        "offset": "123456789012",
        "sourceTime": "2026-08-20 10:00:00",
        "kafkaEnqueueTime": "2026-08-20 10:00:01",
        "targetTime": "2026-08-20 10:00:02",
        "insertTime": "2026-08-20 10:00:03"
      }
    ],
    "hasNext": true,
    "nextCursor": "eyJ2IjoxLCJsdCI6ImVycm9yIiwiZnAiOiI5Y2I0ZGYwM...e6a9"
  },
  "timestamp": "2026-08-20T10:00:00.123"
}
```

### 11.3 带多选条件与下一页游标的请求

请求：

```http
POST /api/log-query/logs/search
Content-Type: application/json

{
  "logType": "error",
  "sourceDataSourceIds": ["DS_SRC_001", "DS_SRC_002"],
  "sourceTableName": "T_ORDER",
  "targetDataSourceIds": ["DS_TGT_001"],
  "targetTableName": null,
  "startTime": "2026-08-14 00:00:00",
  "endTime": "2026-08-20 23:59:59",
  "cursor": "eyJ2IjoxLCJsdCI6ImVycm9yIiwiZnAiOiI5Y2I0ZGYwM...e6a9"
}
```

### 11.4 日志详情请求与响应

请求：

```text
GET /api/log-query/logs/error/7755033852453421056/detail
```

响应：

```json
{
  "code": 200,
  "message": "success",
  "data": {
    "cdcLogId": "7755033852453421056",
    "sourceDataSourceId": "DS_SRC_001",
    "sourceTableName": "T_ORDER",
    "targetDataSourceId": "DS_TGT_001",
    "targetTableName": "ODS_ORDER",
    "instructionType": "INSERT",
    "resultCode": "SUCCESS",
    "offset": "123456789012",
    "sourceTime": "2026-08-20 10:00:00",
    "kafkaEnqueueTime": "2026-08-20 10:00:01",
    "targetTime": "2026-08-20 10:00:02",
    "insertTime": "2026-08-20 10:00:03",
    "logDetail": "同步订单数据成功\ninsert into T_ORDER ..."
  },
  "timestamp": "2026-08-20T10:00:01.456"
}
```

### 11.5 原始消息为 JSON 的响应

```json
{
  "code": 200,
  "message": "success",
  "data": {
    "cdcLogId": "7755033852453421056",
    "rawMessage": "{\"op\":\"INSERT\",\"schema\":\"ODS_ORDER\"}"
  },
  "timestamp": "2026-08-20T10:00:02.789"
}
```

原始消息为 NULL 或空串：

```json
{
  "code": 200,
  "message": "success",
  "data": { "cdcLogId": "7755033852453421056", "rawMessage": "" },
  "timestamp": "2026-08-20T10:00:02.789"
}
```

原始消息为非 JSON（如多行异常文本）时，`rawMessage` 原样返回，前端按纯文本展示，不执行格式化切换（LQ-DETAIL-37）。

### 11.6 校验失败示例

时间缺失（`startTime` 缺失）：

```json
{
  "code": 40010,
  "message": "同步到目标库时间范围必须填写开始与结束时间",
  "timestamp": "2026-08-20T10:00:05.000"
}
```

超过 7 天（`endExclusive - startTime > 7 × 24 小时`）：

```json
{
  "code": 40012,
  "message": "时间跨度超过 7 天，请缩小查询范围",
  "timestamp": "2026-08-20T10:00:05.000"
}
```

### 11.7 功能开放状态接口

```text
GET /api/log-query/status
```

```json
{
  "code": 200,
  "message": "success",
  "data": {
    "enabled": false
  },
  "timestamp": "2026-08-21T10:00:00.000"
}
```

`enabled=false` 表示当前环境未启用日志查询功能，前端显示未开放页且不主动调用原四接口；`enabled=true` 时前端正常初始化（LQ-API-114 ~ 118）。

## 12. 已确认设计决策

以下设计已经用户确认，由 `LOG-QUERY-API-DESIGN-001` 的待确认项转为正式设计决策（追踪编号沿用原编号）：

| 编号 | 确认结论 |
|---|---|
| LQ-API-90-A | `logSummary` 摘要最大长度固定 300 字符（需求上限 500 内）。 |
| LQ-API-90-B | 游标采用服务端 HMAC 签名不透明游标 + 条件指纹，条件指纹按规范化 JSON 计算（§7、LQ-API-53）；签名密钥入后端配置。 |
| LQ-API-90-C | 上一页采用“前端游标栈 + 服务端仅向后翻页”，游标栈模型与失败原子性按 §7.1 修正后算法。 |
| LQ-API-90-D | 数据源候选为单接口一次返回 source+target，每次请求单次全表读取并按 §5.4 内存过滤。 |
| LQ-API-90-E | 详情/原始消息接口复用列表行名称，不重新读取数据源表。 |
| LQ-API-90-F | `logType` 取值 `error` / `correct`（大小写敏感）。 |
| LQ-API-90-G | 数据源 ID 数组最大 100 个元素。 |
| LQ-API-90-H | `OFFSET` 对外 JSON 暂按字符串；开发前从仓库现有表结构/映射确认数据库真实类型，不依赖生产最终物理 DDL。 |
| LQ-API-90-I | 日志查询前端请求单独使用 30 秒超时，覆盖全局 `http.ts` 10 秒。 |
| LQ-API-90-J | 后端数据库语句超时 25 秒，前端 30 秒。 |
| LQ-API-90-K | 错误码采用 40010~40017 / 40410 / 50020~50021。 |
| LQ-API-90-L | 后端 Mapper 采用 MyBatis XML 固定表 `${}` + 固定表枚举。 |

## 13. 与已批准需求的一致性

- 时间必填、默认当前自然日、半开区间与 7 天公式：与 LQ-FILTER-52~57、LQ-VALID-04、AC-12 一致。
- 固定 100 条、双字段游标、无总数/无 OFFSET：与 LQ-PAGE-01~10、LQ-PERF-01~06 一致。
- `CDC_LOG_ID` 字符串传输（外部字符串、内部数值绑定）：与 LQ-PAGE-27 / 28、AC-44 一致。
- 数据源一次读取、禁 N+1、降级显示：与 LQ-DATA-01~11、LQ-PERF-07 一致。
- 三类字段隔离（列表摘要/详情/原始消息）：与 LQ-DETAIL-03 / 20 / 27 / 28 / 32、LQ-PERF-02 一致。
- 30 秒超时、不自动重试、失败保留旧状态：与 LQ-LOAD-30~37 一致。
- 详情与原始消息不携带时间范围：与 LQ-DETAIL-20 / 30 一致。
- 功能开放状态接口 `GET /api/log-query/status`：`enabled` 默认 `false`、不读数据库、30 秒超时、不新增“功能未开放”错误码：与 REQUIREMENTS LQ-OPEN-02 / 05 / 06、LQ-API-114 ~ 117 一致。
- 原四接口完全不检查开关、`enabled=false` 仅前端不主动调用、直接调用仍按原契约：与 REQUIREMENTS LQ-OPEN-03 / 07、LQ-API-118 / 119 一致。
- “全部”为前端表单状态、省略数组/空数组、后端不生成 `IN` 谓词、禁止拼接全部 ID：与 REQUIREMENTS LQ-FILTER-16 ~ 18 / 36 ~ 38 / 76、LQ-API-36 一致。
- 数据源降级展示四态统一、不矛盾、无 `ID（ID）`：与 REQUIREMENTS LQ-DATA-07 ~ 10 / 13 / 14、LQ-API-64 / 65 一致。
- 本文不给出最终分区/子分区/索引 DDL，不把候选索引写成已批准方案；物理设计、生产 DDL 与性能验收仍延期，菜单始终显示，生产环境 `CDC_LOG_QUERY_ENABLED` 在全部阻断项通过并获批前保持 `false`：与 LQ-DB-06~14、LQ-OPEN-04、AC-74 一致。
