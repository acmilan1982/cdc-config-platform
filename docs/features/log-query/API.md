# 日志查询 API 契约设计（API）

## 1. 文档元数据与状态

| 项目 | 值 |
|---|---|
| 正式功能标识 | `log-query` |
| 目标文档 | `docs/features/log-query/API.md` |
| 文档状态 | `DRAFT_PENDING_USER_REVIEW` |
| 对应需求状态 | `APPROVED`（R2、R2.1、R2.2 完整修订已用户人工复审批准） |
| 实现状态 | `NOT_STARTED`（现有页面仍为占位页，本文不构成任何已实现声明） |
| 依据需求 | `docs/features/log-query/REQUIREMENTS.md` |
| 创建日期 | 2026-08-20 |
| 关联任务 | `LOG-QUERY-API-DESIGN-001` |

本文只定义 API 契约，不代表接口已经实现或验收通过。最终物理数据库设计（分区粒度、子分区、索引、生产 DDL、最终执行计划）不在本文范围内。

## 2. 设计依据与追踪方式

- 本文所有业务规则均以已批准的 `REQUIREMENTS.md` 为唯一来源，通过需求编号引用建立追踪关系，不复制整份需求。
- 本文只确定「API 契约」与「逻辑查询边界」；最终分区粒度、子分区、最终索引形态、生产 DDL 与最终执行计划仍属于延期项（LQ-DB-07 / 08 / 09、LQ-NONGOAL-18）。
- 本文完成后仍须等待用户人工复审，不得自行进入编码（LOG-QUERY-API-DESIGN-001 §二）。

## 3. 总体约定

| 编号 | 规则 |
|---|---|
| LQ-API-01 | URL 风格沿用项目现有 `/api/<feature>` 方式（如 `/api/data-sources`、`/api/job-failure`），本功能统一使用 `/api/log-query` 前缀。 |
| LQ-API-02 | 所有接口使用项目统一响应体 `ApiResponse<T>`：`{ code: int, message: String, data: T, timestamp: String }`；成功 `code=200`、`message="success"`。 |
| LQ-API-03 | 业务错误一律通过 `BusinessException` 抛出，由 `GlobalExceptionHandler` 映射为 HTTP 200 + `ApiResponse.fail(code, message)`（项目既有 `DataSourceErrorCode`、`JobFailureErrorCode` 相同风格）。 |
| LQ-API-04 | 参数绑定、类型错误、`@Valid` 校验失败由 `GlobalExceptionHandler` 映射为 HTTP 400；未捕获异常映射为 HTTP 500，`message="服务器内部错误"`。 |
| LQ-API-05 | 项目 `spring.jackson.default-property-inclusion=non_null`：JSON 输出默认省略 null 字段。空值字段以「字段缺失」形式出现，前端必须把缺失字段等同于 null 处理并渲染为 `--`（LQ-LIST-25）；布尔型 `hasLogDetail`、`hasRawMessage`、`hasNext` 恒为真值型，不受省略影响。 |
| LQ-API-06 | 时间字段统一为字符串格式 `yyyy-MM-dd HH:mm:ss`，精确到秒，不携带时区后缀，不转换为 UTC（LQ-FILTER-58 / 59、LQ-TIME-01 / 02）。 |
| LQ-API-07 | `CDC_LOG_ID` 在所有 JSON 请求与响应（列表记录 ID、下一页/上一页游标、日志详情请求、原始消息请求）中一律以字符串传输；前端不得转为 JavaScript Number（LQ-PAGE-27 / 28、AC-44）。 |
| LQ-API-08 | 日志类型使用固定白名单枚举值 `error`、`correct`（大小写敏感，全小写）；服务端在固定表枚举上映射为 `CDC_LOG_ERROR` / `CDC_LOG_CORRECT`。API 不得暴露可由客户端控制的表名（§六 5.3、LQ-SCOPE-06）。 |
| LQ-API-09 | 列表页容量固定 100，服务端强制；请求契约不含 `pageSize`，服务端不读取任何页容量输入，始终按「取 101 条判 `hasNext`，返回 100 条」执行。 |
| LQ-API-10 | 日志查询接口只读，不提供新增、修改、删除、重试、忽略、提醒等写操作（LQ-SCOPE-08）。 |

## 4. 接口清单

| 编号 | 方法 | URL | 用途 |
|---|---|---|---|
| LQ-API-11 | GET | `/api/log-query/data-source-options` | 一次返回源库与目标库下拉候选 |
| LQ-API-12 | GET | `/api/log-query/logs` | 查询错误/正确日志列表（首查、下一页、上一页共用） |
| LQ-API-13 | GET | `/api/log-query/logs/{logType}/{cdcLogId}/detail` | 按日志类型与 `CDC_LOG_ID` 获取日志详情 |
| LQ-API-14 | GET | `/api/log-query/logs/{logType}/{cdcLogId}/raw-message` | 按日志类型与 `CDC_LOG_ID` 获取原始消息 |

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
| LQ-API-20 | 无请求参数。 |

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
| `org` | String | 是 | `DATA_SOURCE_ORG`（显示值） |

### 5.3 规则

| 编号 | 规则 |
|---|---|
| LQ-API-21 | 候选只包含 `FG_ACTIVE=1` 且 `UPPER(TRIM(DATA_SOURCE_CATEGORY))='SOURCE'`（源库）或 `'TARGET'`（目标库）的数据源（LQ-FILTER-11 / 31、LQ-DATA-05）。 |
| LQ-API-22 | 排序字段固定为 `DATA_SOURCE_ORG`（LQ-FILTER-13 / 33）。 |
| LQ-API-23 | 候选接口一次请求只读取一次 `CDC_DATA_SOURCE`；同一请求内完成源/目标两份列表的内存过滤。 |
| LQ-API-24 | 候选加载失败只影响下拉框；已生效列表查询与详情/原始消息不受影响。前端对候选失败提供可重试入口。 |

## 6. 列表查询接口

### 6.1 请求 `GET /api/log-query/logs`

查询对象 `LogListQuery`（GET 查询参数绑定，沿用仓库 `HistoryQuery` / `FaultHistoryListQuery` 风格）。数组以重复参数传递，例如 `sourceDataSourceIds=DS1&sourceDataSourceIds=DS2`。

| 字段 | 类型 | 必填 | 说明 |
|---|---|---|---|
| `logType` | String | 是 | `error` / `correct` 白名单 |
| `sourceDataSourceIds` | String[] | 否 | 源库多选 `DATA_SOURCE_ID`；空数组等同未选择 |
| `sourceTableName` | String | 否 | 源表名，精确匹配、区分大小写 |
| `targetDataSourceIds` | String[] | 否 | 目标库多选 `DATA_SOURCE_ID`；空数组等同未选择 |
| `targetTableName` | String | 否 | 目标表名，精确匹配、区分大小写 |
| `startTime` | String | 是 | `yyyy-MM-dd HH:mm:ss`，包含端点 |
| `endTime` | String | 是 | `yyyy-MM-dd HH:mm:ss`，包含端点 |
| `cursor` | String | 否 | 上一页/下一页游标；首查不携带 |

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
| LQ-API-36 | 空数组等同未选择，不得传递“全部”等魔法 ID；对应条件为空时后端不生成该字段过滤谓词（LQ-FILTER-17 / 37、LQ-FILTER-73）。 |
| LQ-API-37 | `sourceTableName`、`targetTableName` 去除首尾空白后长度不得超过 64 字符，否则 `TABLE_NAME_INVALID`（LQ-FILTER-23 / 43）。只做首尾空白规范化；不修改中间空格、不转换大小写、不做 `UPPER()` / `LOWER()` / `LIKE` / 通配符（LQ-FILTER-21 / 22 / 41 / 42、LQ-NONGOAL-08 / 09）。 |
| LQ-API-38 | 已选源库/目标库 ID 必须存在于当前有效候选集合（启用且类别匹配），否则 `DATA_SOURCE_IDS_INVALID`（LQ-VALID-03）。 |
| LQ-API-39 | `pageSize` 不在契约中；服务端忽略任何传入的 `pageSize`，恒为固定 100 逻辑（取 101 判 `hasNext`、返回 100）。 |
| LQ-API-40 | 四类可选条件均在必填 `TARGET_TIME` 范围基础上以 `AND` 组合；四条件全空时允许仅按时间范围查询固定排序第一页（LQ-FILTER-70 ~ 75、LQ-PERF-08）。 |

### 6.3 响应 `data` 结构

`LogListResponse`：

| 字段 | 类型 | 必填 | 说明 |
|---|---|---|---|
| `items` | `LogListVO[]` | 是 | 当前页列表，最多 100 条；可能为空数组 |
| `hasNext` | boolean | 是 | 是否有下一页 |
| `nextCursor` | String | 否 | 取到第 101 条时返回（边界为第 100 条记录的 `TARGET_TIME` 与 `CDC_LOG_ID`）；无下一页时字段省略 |

`LogListVO`（每行）：

| 字段 | 类型 | 必填 | 说明 |
|---|---|---|---|
| `cdcLogId` | String | 是 | 记录唯一标识、游标辅助字段、详情/原始消息查询依据（LQ-LIST-14） |
| `sourceDataSourceId` | String | 是 | 日志中的 `SOURCE_DATA_SOURCE_ID` 原始值 |
| `sourceDataSourceName` | String | 是 | 源库显示名称（映射规则见 §8），可为“未定义名称”或回退的原始 ID |
| `sourceTableName` | String | 是 | 源表名 |
| `targetDataSourceId` | String | 是 | 日志中的 `TARGET_DATA_SOURCE_ID` 原始值 |
| `targetDataSourceName` | String | 是 | 目标库显示名称 |
| `targetTableName` | String | 是 | 目标表名 |
| `instructionType` | String | 是 | 指令类型，原样显示不转换 |
| `logSummary` | String | 是 | `LOG_DETAIL` 的有界摘要，最大 300 字符（见 §6.5） |
| `hasLogDetail` | boolean | 是 | 是否存在 `LOG_DETAIL` 内容（存在则日志详情按钮可用） |
| `hasRawMessage` | boolean | 是 | 是否存在 `RAW_MESSAGE` 内容（存在则原始消息按钮可用） |
| `offset` | String | 是 | Kafka 偏移量，按字符串传输（见 §6.5） |
| `sourceTime` | String | 否 | 采集时间，`yyyy-MM-dd HH:mm:ss` |
| `kafkaEnqueueTime` | String | 否 | 进入链路时间 |
| `targetTime` | String | 否 | 同步到目标表时间（业务视为非空） |
| `insertTime` | String | 否 | 日志落盘时间 |

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
| LQ-API-45 | `logSummary` 最大长度为 **300 字符**（Unicode 码点），由服务端在 SQL 中通过 `SUBSTR(LOG_DETAIL, 1, 300)` 截取。该值位于需求上限“建议不超过 500 字符”之内（LQ-DETAIL-04），属于设计草案，**待用户复审**。 |
| LQ-API-46 | Oracle `SUBSTR` 按字符语义截取（非字节），与需求无关的字节问题不适用；截取窗口内的换行、空格、缩进原样保留，前端以 CSS 单行省略显示（`white-space: nowrap` 折叠换行为空格），不通过 Tooltip 展示完整异常（LQ-LIST-27）。 |
| LQ-API-47 | `offset` 按字符串传输。`OFFSET` 列真实类型尚未从生产 DDL 确认，为避免 JavaScript 精度丢失采用与 `CDC_LOG_ID` 一致的安全传输（LQ-API-07），具体列类型 **待用户确认**。 |
| LQ-API-48 | `hasLogDetail` / `hasRawMessage` 由服务端用 `LENGTH(列) > 0` 计算（Oracle 空串即 NULL，`LENGTH(NULL)` 为 NULL），不读取完整内容，满足“返回是否存在标记但不读取完整内容”（LQ-DETAIL-11）。 |

## 7. 游标协议

| 编号 | 规则 |
|---|---|
| LQ-API-50 | 采用 **服务端可验证的不透明游标**（唯一方案，不留多选）。游标由前端原样保存与回传，前端不解码、不解析其内容。 |
| LQ-API-51 | 游标载荷包含：版本 `v`、日志类型 `lt`、条件指纹 `fp`、边界 `TARGET_TIME`（`yyyy-MM-dd HH:mm:ss`）、边界 `CDC_LOG_ID`（字符串）。 |
| LQ-API-52 | 编解码格式：载荷为 UTF-8 JSON 的 `base64url`（无填充）编码，格式为 `payload + "." + HMAC-SHA256(secret, payload)` 十六进制签名。签名密钥由后端配置持有（不入 DTO、不入库、不出接口）。 |
| LQ-API-53 | 条件指纹 `fp`：对请求的规范化条件串（`logType`、`startTime`、`endExclusive`、去重排序后的 `sourceDataSourceIds`、`sourceTableName`、去重排序后的 `targetDataSourceIds`、`targetTableName`）计算 SHA-256，取小写十六进制。生成与校验必须使用同一规范化规则（见 `DESIGN.md` §7）。 |
| LQ-API-54 | 服务端校验顺序：拆解 `payload.signature` → base64url 解码 → 验签（常量时间比较）→ 校验版本 → 校验 `lt` 与请求 `logType` 一致 → 用当前请求条件重算 `fp` 并比对。任何一步失败：格式/签名/版本失败返回 `CURSOR_INVALID`；日志类型或指纹不一致返回 `CURSOR_CONDITION_MISMATCH`。 |
| LQ-API-55 | 游标只支持“向后（更旧）”翻页；上一页由前端游标栈重新发送前一页的请求游标实现，服务端不实现反向排序（见 LQ-API-56）。 |
| LQ-API-56 | 上一页唯一方案（与 `DESIGN.md` §7 一致）：前端为每个 Tab 保存**每一页请求当时使用的游标**（第 1 页为 null）；点击上一页时重新发送前一页的请求游标，服务端只实现向后翻页谓词。因 keyset 排序确定，重复发送同一游标可稳定重取上一页内容。不得引入反向排序或破坏固定排序。 |
| LQ-API-57 | 首查不携带 `cursor`；下一页请求携带上一响应返回的 `nextCursor`；上一页请求携带前端游标栈中前一页的请求游标。 |
| LQ-API-58 | `hasNext` 精确定义：服务端取 101 条，取到 101 条则 `hasNext=true`、`nextCursor` 为第 100 条记录的边界；取到 ≤100 条则 `hasNext=false`、`nextCursor` 省略。 |
| LQ-API-59 | 在持续写入场景下，keyset 游标保证排序边界和不因 OFFSET 漂移，但**不承诺跨多个请求的数据库一致性快照**；晚到且排序位置落入后续页的数据可能在后续页出现，新插入且排序位置位于第一页之前的数据不会自动进入已显示列表（LQ-PAGE-25 语义下的“不重不漏”以固定排序与边界谓词为准）。 |
| LQ-API-60 | `CDC_LOG_ID` 全程避免精度丢失：请求参数、游标载荷、响应字段均以字符串传输（LQ-API-07）。 |

## 8. 数据源名称映射（列表）

| 编号 | 规则 |
|---|---|
| LQ-API-61 | 每次列表请求（首查、点击查询、下一页、上一页）都重新读取一次 `CDC_DATA_SOURCE` 全表，在该请求内构建 `DATA_SOURCE_ID -> DATA_SOURCE_ORG` 内存映射；不跨请求缓存（LQ-DATA-01 / 02 / 11）。 |
| LQ-API-62 | 一次列表请求只能读取一次数据源全表；禁止按日志行逐行查数据源（禁止 N+1），不在分页前与超大日志表做大表关联（LQ-DATA-03 / 04、LQ-PERF-07）。 |
| LQ-API-63 | 历史名称映射读取全部数据源记录，不按 `FG_ACTIVE` 过滤（LQ-DATA-06）。 |
| LQ-API-64 | 降级显示规则（LQ-DATA-07 ~ 09）：找到数据源且 `DATA_SOURCE_ORG` 有值 → 显示该名称；找到数据源但 `DATA_SOURCE_ORG` 为空 → 显示“未定义名称”；找不到数据源记录 → 显示日志中的原始 `DATA_SOURCE_ID`。 |
| LQ-API-65 | 响应同时返回原始 ID 与显示名称（`sourceDataSourceId` + `sourceDataSourceName`），前端据此展示与继续操作；悬停内容由前端组合完整名称与完整 ID（LQ-DATA-10）。 |
| LQ-API-66 | 名称映射只作用于列表展示，不参与 SQL 过滤；历史日志引用的已停用、类别变化或已缺失数据源 ID 不影响列表返回（降级为 LQ-API-64 规则），但作为“已选过滤条件”的提交 ID 仍必须通过 LQ-API-38 的候选校验。候选校验与历史名称展示不可混为一谈。 |

## 9. 日志详情与原始消息接口

### 9.1 详情接口

`GET /api/log-query/logs/{logType}/{cdcLogId}/detail`

| 编号 | 规则 |
|---|---|
| LQ-API-70 | `logType` 白名单校验；`cdcLogId` 必须为 1~19 位十进制字符串。详情与原始消息请求通过固定 `logType + cdcLogId` 精确查询，**不是列表查询，不要求携带时间范围**（LQ-DETAIL-20 / 30）。 |
| LQ-API-71 | 详情只读取详情所需字段：`CDC_LOG_ID`、`SOURCE_DATA_SOURCE_ID`、`SOURCE_TABLE_NAME`、`TARGET_DATA_SOURCE_ID`、`TARGET_TABLE_NAME`、`INSTRUCTION_TYPE`、`RESULT_CODE`、`OFFSET`、`SOURCE_TIME`、`KAFKA_ENQUEUE_TIME`、`TARGET_TIME`、`INSERT_TIME`、完整 `LOG_DETAIL`；不读取 `RESULT_DETAIL`，不顺带读取 `RAW_MESSAGE`（LQ-DETAIL-27 / 28）。 |
| LQ-API-72 | 记录不存在返回 `LOG_RECORD_NOT_FOUND`（HTTP 200 + 业务码）。 |
| LQ-API-73 | 响应 `data` 结构 `LogDetailVO`：`cdcLogId`、`sourceDataSourceId`、`sourceTableName`、`targetDataSourceId`、`targetTableName`、`instructionType`、`resultCode`、`offset`、`sourceTime`、`kafkaEnqueueTime`、`targetTime`、`insertTime`、`logDetail`（完整内容）。时间字段为 `yyyy-MM-dd HH:mm:ss` 字符串；`cdcLogId`、`offset` 为字符串。 |
| LQ-API-74 | 详情弹窗展示“源库名称和 ID”“目标库名称和 ID”，名称复用发起弹窗的列表行已返回的 `sourceDataSourceName` / `targetDataSourceName`；本接口不重新读取数据源表、不返回名称（收口 LQ-DATA-12，属设计决策）。 |

### 9.2 原始消息接口

`GET /api/log-query/logs/{logType}/{cdcLogId}/raw-message`

| 编号 | 规则 |
|---|---|
| LQ-API-75 | 原始消息只读取 `RAW_MESSAGE` 及响应所必需的最小标识（`CDC_LOG_ID`），不顺带读取完整日志详情或其他大字段。 |
| LQ-API-76 | 记录不存在返回 `LOG_RECORD_NOT_FOUND`；记录存在但 `RAW_MESSAGE` 为 NULL 或空串时，返回成功且 `rawMessage` 为空字符串（空内容与记录不存在互不混淆）。 |
| LQ-API-77 | `RAW_MESSAGE` 为 NULL、空串、合法 JSON、非 JSON 或超大文本时，API 一律**原样返回**，不修改、不格式化、不保存数据库内容；JSON 合法性判断与“原文/格式化”切换由前端负责（LQ-DETAIL-33 ~ 37）。 |
| LQ-API-78 | 响应 `data` 结构 `RawMessageVO`：`cdcLogId`（String）、`rawMessage`（String，可为空串）。 |
| LQ-API-79 | “复制原文”始终复制未格式化的原始内容；弹窗关闭后前端清理持有内容（LQ-DETAIL-35 / 36 / 39）。 |

## 10. 统一错误与超时

### 10.1 错误码（草案）

`LogQueryErrorCode` 按项目 `JobFailureErrorCode` / `DataSourceErrorCode` 工厂方法风格设计（常量 + 返回 `BusinessException` 的静态工厂）。码段避开既有 40001~40007、40400~40403、40900~40901、50000、50010。具体数值 **待用户确认**。

| 编号 | 常量 | 码值 | 触发场景 |
|---|---|---|---|
| LQ-API-80 | `TIME_RANGE_REQUIRED` | 40010 | `startTime` / `endTime` 缺失或格式非法 |
| LQ-API-81 | `TIME_ORDER_INVALID` | 40011 | `startTime > endTime`（不完整/顺序错误） |
| LQ-API-82 | `TIME_SPAN_EXCEEDED` | 40012 | `endExclusive - startTime > 7 × 24 小时` |
| LQ-API-83 | `DATA_SOURCE_IDS_INVALID` | 40013 | 数据源 ID 数组数量超限、元素非法或不在有效候选集合 |
| LQ-API-84 | `LOG_TYPE_INVALID` | 40014 | `logType` 非 `error` / `correct` |
| LQ-API-85 | `CURSOR_INVALID` | 40015 | 游标格式非法、验签失败或版本不支持 |
| LQ-API-86 | `CURSOR_CONDITION_MISMATCH` | 40016 | 游标 `logType` 或条件指纹与当前请求不一致 |
| LQ-API-87 | `TABLE_NAME_INVALID` | 40017 | 表名长度超限或格式非法 |
| LQ-API-88 | `LOG_RECORD_NOT_FOUND` | 40410 | 详情/原始消息记录不存在 |
| LQ-API-89 | `QUERY_TIMEOUT` | 50020 | 数据库语句超时（Service 捕获超时异常映射为业务码） |
| LQ-API-90 | `DATABASE_ACCESS_FAILED` | 50021 | 数据库访问失败 |

### 10.2 超时职责与先后关系

| 编号 | 规则 |
|---|---|
| LQ-API-91 | 前端对日志查询相关请求显式设置 `timeout=30000ms`，覆盖全局 `http.ts` 的 `10000ms`（前端实现阶段必须包含的改造点，本任务不改代码）；这是“前端与后端统一 30 秒目标”的落点（LQ-LOAD-30）。 |
| LQ-API-92 | 后端数据库语句超时目标 25 秒（低于前端 30 秒），通过 JDBC `queryTimeout` / MyBatis 语句超时配置；超时后 Service 捕获并映射为 `QUERY_TIMEOUT`（50020），保证浏览器停止等待前数据库已经中止（LQ-LOAD-31）。具体秒数 **待用户确认**。 |
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

```text
GET /api/log-query/logs?logType=error
&startTime=2026-08-20%2000:00:00&endTime=2026-08-20%2023:59:59
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

```text
GET /api/log-query/logs?logType=error
&sourceDataSourceIds=DS_SRC_001&sourceDataSourceIds=DS_SRC_002
&sourceTableName=T_ORDER
&targetDataSourceIds=DS_TGT_001
&startTime=2026-08-14%2000:00:00&endTime=2026-08-20%2023:59:59
&cursor=eyJ2IjoxLCJsdCI6ImVycm9yIiwiZnAiOiI5Y2I0ZGYwM...e6a9
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

## 12. 待用户确认项

| 编号 | 待确认项 | 说明 |
|---|---|---|
| LQ-API-90-A | `logSummary` 摘要最大长度 300 字符 | 需求上限 500 字符内（LQ-DETAIL-04），本设计取 300，待复审 |
| LQ-API-90-B | 游标采用服务端签名不透明游标 + 条件指纹 | 签名密钥入后端配置，方案待复审 |
| LQ-API-90-C | 上一页采用“前端游标栈 + 服务端仅向后翻页” | 与需求倾向一致，待复审 |
| LQ-API-90-D | 数据源候选为单接口一次返回 source+target | 契约形态待复审 |
| LQ-API-90-E | 详情/原始消息接口复用列表行名称，不重新读取数据源表 | 收口 LQ-DATA-12，待复审 |
| LQ-API-90-F | `logType` 取值 `error` / `correct`（大小写敏感） | 取值待复审 |
| LQ-API-90-G | 数据源 ID 数组最大 100 个元素 | 依据候选规模安全上限，待复审 |
| LQ-API-90-H | `OFFSET` 列真实类型待生产 DDL 确认，JSON 暂按字符串 | 列类型待确认 |
| LQ-API-90-I | 前端 30 秒超时需覆盖全局 `http.ts` 10 秒 | 前端改造点，本任务不改代码 |
| LQ-API-90-J | 后端数据库语句超时 25 秒 | 低于前端 30 秒，秒数待复审 |
| LQ-API-90-K | 错误码数值（40010~40017 / 40410 / 50020~50021） | 码值为草案，待复审 |
| LQ-API-90-L | 后端 Mapper 采用 MyBatis XML 固定表 `${}` + 固定表枚举 | 仓库已有 XML 惯例与白名单先例，待复审 |

## 13. 与已批准需求的一致性

- 时间必填、默认当前自然日、半开区间与 7 天公式：与 LQ-FILTER-52~57、LQ-VALID-04、AC-12 一致。
- 固定 100 条、双字段游标、无总数/无 OFFSET：与 LQ-PAGE-01~10、LQ-PERF-01~06 一致。
- `CDC_LOG_ID` 字符串传输：与 LQ-PAGE-27 / 28、AC-44 一致。
- 数据源一次读取、禁 N+1、降级显示：与 LQ-DATA-01~11、LQ-PERF-07 一致。
- 三类字段隔离（列表摘要/详情/原始消息）：与 LQ-DETAIL-03 / 20 / 27 / 28 / 32、LQ-PERF-02 一致。
- 30 秒超时、不自动重试、失败保留旧状态：与 LQ-LOAD-30~37 一致。
- 详情与原始消息不携带时间范围：与 LQ-DETAIL-20 / 30 一致。
- 本文不给出最终分区/子分区/索引 DDL，不把候选索引写成已批准方案，菜单开放前置条件不变：与 LQ-DB-06~14、LQ-NONGOAL-18、AC-74 一致。
