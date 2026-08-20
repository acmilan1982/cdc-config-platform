# 日志查询逻辑查询设计（DESIGN）

## 1. 文档元数据与状态

| 项目 | 值 |
|---|---|
| 正式功能标识 | `log-query` |
| 目标文档 | `docs/features/log-query/DESIGN.md` |
| 文档状态 | `DRAFT_PENDING_USER_REVIEW` |
| 对应需求状态 | `APPROVED`（R2、R2.1、R2.2 完整修订已用户人工复审批准） |
| 实现状态 | `NOT_STARTED`（现有页面仍为占位页，本文不构成任何已实现声明） |
| 依据需求 | `docs/features/log-query/REQUIREMENTS.md` |
| 关联契约 | `docs/features/log-query/API.md`（两文档使用同一游标、翻页与字段隔离方案） |
| 创建日期 | 2026-08-20 |
| 关联任务 | `LOG-QUERY-API-DESIGN-001`（初版）、`LOG-QUERY-API-DESIGN-001-R1`（定向修订）、`LOG-QUERY-API-DESIGN-001-R1.1`（微型一致性修订） |

修订记录：

- `LOG-QUERY-API-DESIGN-001`：初版，创建两份设计文档（均为 `DRAFT_PENDING_USER_REVIEW / NOT_STARTED`）。
- `LOG-QUERY-API-DESIGN-001-R1`：修正四类设计缺陷（列表接口改 POST、前端游标栈模型、`CDC_LOG_ID` 内部数值绑定、数据源一次全表读取）、游标条件指纹规范化、将 12 项待确认设计转为已确认设计决策、同步一致性。修订完成仍为 `DRAFT_PENDING_USER_REVIEW / NOT_STARTED`，等待用户最终复审。
- `LOG-QUERY-API-DESIGN-001-R1.1`：微型一致性修订，仅完成：(1) 数据源名称字段可空性补正（`sourceDataSourceName` / `targetDataSourceName` 改为可选，原始数据源 ID 为 NULL 时名称省略并显示 `--`）；(2) 相同签名密钥下普通服务重启不使游标失效，只有密钥轮换、密钥配置改变、版本不兼容或篡改才可能使旧游标失效；(3) 重取上一页只保证按相同固定排序与边界谓词重新查询目标页，不保证返回内容与首次访问该页时完全一致。修订完成仍为 `DRAFT_PENDING_USER_REVIEW / NOT_STARTED`，等待用户最终复审。

本文定义应用结构、请求流程和逻辑 SQL。本文**不确定**最终分区粒度、子分区、最终索引、生产 DDL 或最终执行计划（LQ-DB-07 / 08 / 09、LQ-NONGOAL-18）。

## 2. 设计边界与输入

- 已批准业务输入：时间必填且默认当前自然日、半开区间、7 天公式、固定 100 条、双字段游标、`CDC_LOG_ID` 字符串传输、Oracle 19c+、`TARGET_TIME` 为第一层 `RANGE` 分区键（LQ-FILTER-52~57、LQ-PAGE-20~28、LQ-DB-06 / 07、LQ-TIME-04）。
- 物理延期项：一级 RANGE 粒度、是否子分区、最终索引名称/数量/列序/本地全局属性、生产 DDL、最终执行计划与性能验收，均等待约 40 个数据源完成首次全量后按真实分布确定（LQ-DB-08 / 09 / 12、LQ-PERF-14）。
- 程序必须与最终物理粒度、子分区和索引形态解耦；不引用具体分区名称，不硬编码依赖分区结构的逻辑（LQ-DB-01、§12）。
- 菜单在最终物理设计与生产等价性能验收完成前必须保持隐藏（LQ-DB-14、AC-74）。

## 3. 应用分层与职责

包根：`com.bsoft.cdcconfig.logquery`（沿用仓库 `datasource`、`jobfailure`、`largescreen` 分层风格）。资源 XML：`src/main/resources/mapper/logquery/LogQueryMapper.xml`（`application.yml` 已配置 `mapper-locations: classpath:mapper/**/*.xml`）。

| 编号 | 层/类（草案） | 职责 | 边界 |
|---|---|---|---|
| LQ-DESIGN-01 | `controller/LogQueryController` | 协议接入、URL 绑定、基础白名单校验、委托 Service；`@Tag` / `@Operation` / `@Parameter` Swagger 注解 | 不做业务规则判断，不拼 SQL |
| LQ-DESIGN-02 | `dto/LogListQuery` | JSON 请求体绑定（`@RequestBody`），数组为 JSON 数组 | 只承载原始输入；不含 `pageSize` |
| LQ-DESIGN-03 | `service/LogQueryService` + `impl/LogQueryServiceImpl` | 条件规范化、时间半开区间与 7 天公式、日志类型白名单、数据源一次读取与映射、游标校验、`CDC_LOG_ID` 十进制校验与数值转换、结果组装 | 无状态；不持有会话 |
| LQ-DESIGN-04 | `mapper/LogQueryMapper` + `LogQueryMapper.xml` | 只接受已验证的固定表枚举与绑定参数；实现列表/详情/原始消息三类独立查询 | 不允许客户端字符串触达表名 |
| LQ-DESIGN-05 | `enums/LogTypeEnum` | 白名单值到固定表名的唯一封闭映射 | 见 §4 |
| LQ-DESIGN-06 | `vo/LogListResponse`、`vo/LogListVO`、`vo/LogDetailVO`、`vo/RawMessageVO`、`vo/DataSourceOptionsVO`、`vo/DataSourceOptionVO` | 响应组装 | `cdcLogId`、`offset` 为 String；`CDC_LOG_ID` 由 Service 在 VO/游标编码边界转为十进制字符串 |
| LQ-DESIGN-07 | `exception/LogQueryErrorCode` | 错误码常量与返回 `BusinessException` 的静态工厂（风格同 `JobFailureErrorCode`） | 码值已确认（LQ-DESIGN-160） |
| LQ-DESIGN-08 | `cursor/LogCursorCodec` | 不透明游标编解码与验签 | 密钥来自后端配置 |
| LQ-DESIGN-09 | `cursor/LogQueryFingerprint` | 条件指纹规范化（固定字段顺序 JSON）与 SHA-256 | 生成/校验同一规则 |
| LQ-DESIGN-10 | 前端 Tab 状态 | 表单/已生效条件/列表/请求游标栈/当前页游标状态/加载/错误，两个 Tab 各自独立 | 后端无会话（LQ-TAB-01~08） |

| 编号 | 规则 |
|---|---|
| LQ-DESIGN-11 | Controller 只做协议接入和基础校验；Service 负责条件规范化、时间半开区间、日志类型白名单、数据源映射、游标校验和结果组装；Mapper/Repository 只接受已验证的固定表枚举和绑定参数（LQ-API-30 ~ 40）。 |
| LQ-DESIGN-12 | 列表、日志详情、原始消息必须是三类独立查询，不得合并读取大字段（§9）。 |
| LQ-DESIGN-13 | 后端保持无会话状态；Tab 表单、已生效条件和请求游标栈由前端管理（LQ-TAB-01~12、LQ-VALID-06）。 |
| LQ-DESIGN-14 | `CDC_LOG_ID` 采用「外部字符串、内部数值」单一绑定规则：HTTP 路径、JSON 字段、游标载荷均为十进制字符串；Service 收到后校验十进制格式与 `NUMBER(19,0)` 范围，转换为不丢精度数值类型（建议 `BigDecimal`，scale=0，或与项目 Oracle NUMBER 映射一致的无损类型）后传给 Mapper；SQL 绑定数值参数，不使用 VARCHAR 到 NUMBER 的隐式转换；读取后在与 VO/游标编码边界转回十进制字符串（LQ-API-97 / 98）。 |
| LQ-DESIGN-15 | 若 MyBatis 使用 `${tableName}` 选择固定表名，`tableName` 只能由服务端封闭枚举 `LogTypeEnum` 产生（`CDC_LOG_ERROR` / `CDC_LOG_CORRECT`）。 |
| LQ-DESIGN-16 | 用户输入永远无法到达 `${}`：HTTP 层 Controller 对 `logType` 做白名单校验（非 `error` / `correct` 直接拒绝 `LOG_TYPE_INVALID`）→ Service 经 `LogTypeEnum` 枚举查找（未命中即抛业务异常）→ Mapper 只收到枚举产生的常量。任何其他值在到达 SQL 之前即被拒绝。 |
| LQ-DESIGN-17 | 该白名单模式已有仓库先例：`largescreen` 的 `SafeUpperIdProvider` 与 `LogBatchReader` 均用 `ALLOWED_TABLES = {CDC_LOG_CORRECT, CDC_LOG_ERROR}` 白名单后才允许 `SELECT ... FROM <table>`。日志查询沿用同一信任边界。 |
| LQ-DESIGN-18 | `cdcLogId` 十进制校验：1~19 位十进制字符串且数值在 `NUMBER(19,0)` 范围内；非法直接拒绝。 |
| LQ-DESIGN-19 | 详情与原始消息路径参数 `cdcLogId` 非法（非十进制或越界）按框架风格返回 HTTP 400（LQ-API-04 / 99），与业务错误 `LOG_RECORD_NOT_FOUND`（40410）区分：前者是参数格式错误，后者是记录不存在。 |

## 4. 日志类型与固定表映射

`LogTypeEnum`（草案）：

| 白名单值 | 枚举名 | 固定表 | Tab |
|---|---|---|---|
| `error` | `ERROR` | `CDC_LOG_ERROR` | 错误日志 |
| `correct` | `CORRECT` | `CDC_LOG_CORRECT` | 正确日志 |

| 编号 | 规则 |
|---|---|
| LQ-DESIGN-20 | 只允许上述两个白名单值；其余值一律拒绝（LQ-API-08 / 84）。 |
| LQ-DESIGN-21 | 两张表字段结构相同，页面采用共用的查询、列表与详情交互规范（LQ-SCOPE-07 / 10）。 |
| LQ-DESIGN-22 | 严禁客户端直接传表名或把任意字符串拼入 SQL；API 层只暴露 `logType`（LQ-API-08）。 |

## 5. 列表查询流程

每次列表请求（首查、点击查询、下一页、上一页）按固定步骤执行：

| 编号 | 步骤 |
|---|---|
| LQ-DESIGN-30 | 校验日志类型：`logType` 白名单 → 解析固定表名（§4）。 |
| LQ-DESIGN-31 | 校验时间：`startTime` / `endTime` 存在且格式合法 → 顺序校验 → 将 `endTime` 加 1 秒转换为 `endExclusive` → 校验 `endExclusive - startTime <= 7 × 24 小时`（LQ-FILTER-52~57）。 |
| LQ-DESIGN-32 | 校验可选条件：表名首尾空白规范化且 ≤64 字符；源库/目标库数组 ≤100 且元素合法；多选去重（LQ-VALID-04 / 05）。 |
| LQ-DESIGN-33 | 校验游标（如提供）：签名/版本/`logType`/条件指纹（§7）；非法或失配拒绝（LQ-API-54）。 |
| LQ-DESIGN-34 | 恰好读取一次 `CDC_DATA_SOURCE` 全表（`DATA_SOURCE_ID`、`DATA_SOURCE_ORG`、`DATA_SOURCE_CATEGORY`、`FG_ACTIVE`，§6.4），用同一结果在内存构建全量 `Map<DATA_SOURCE_ID, DATA_SOURCE_ORG>` 名称映射与有效 source/target 候选 ID 集合（`FG_ACTIVE='1'` 且类别 `trim + equalsIgnoreCase` 匹配）；校验已选源/目标 ID 属于对应候选集合（LQ-DATA-01 / 05 / 06、LQ-VALID-03、LQ-API-25 / 26）。 |
| LQ-DESIGN-35 | 固化本次请求有效条件（时间半开区间 + 可选谓词 + 游标边界谓词）。 |
| LQ-DESIGN-36 | 执行固定日志表上的轻量列表 SQL，`FETCH FIRST 101 ROWS ONLY`（§6.1）。 |
| LQ-DESIGN-37 | 取到 101 条则 `hasNext=true`、`nextCursor` 为第 100 条记录的边界、只返回前 100 条；取到 ≤100 条则 `hasNext=false`、`nextCursor` 省略（LQ-API-58）。 |
| LQ-DESIGN-38 | 在内存映射源库/目标库名称（LQ-DATA-02），组装响应；同一请求内只读一次数据源全表，无 N+1、无大表 JOIN（LQ-DATA-03 / 04）。 |

历史日志引用失效或不存在的数据源 ID 的降级显示：名称映射基于全量 `CDC_DATA_SOURCE`；原始 `SOURCE_DATA_SOURCE_ID` / `TARGET_DATA_SOURCE_ID` 为 NULL 时，对应 ID 与名称均省略，前端显示 `--`，不得回退为字符串 `"null"`、空串或“未定义名称”；原始 ID 非 NULL 时，不存在对应数据源记录则回退显示日志原始 `DATA_SOURCE_ID`，存在但名称为空显示“未定义名称”（LQ-DATA-07 ~ 09、LQ-API-64）。候选校验（已选 ID 必须在有效候选集合）与历史名称展示（全量映射）不可混为一谈（LQ-API-66）。

## 6. 逻辑 SQL

以下 SQL 均为参数化伪 SQL / MyBatis 风格动态 SQL，用于描述逻辑查询契约，**不是最终 DDL，也不是性能方案**。所有值条件使用绑定参数；`${tableName}` 仅来自 §4 封闭枚举。`CDC_LOG_ID` 相关绑定使用不丢精度数值类型（建议 `BigDecimal`），不使用 VARCHAR 到 NUMBER 隐式转换。

### 6.1 列表首查 SQL

```sql
SELECT
    CDC_LOG_ID,
    SOURCE_DATA_SOURCE_ID,
    SOURCE_TABLE_NAME,
    TARGET_DATA_SOURCE_ID,
    TARGET_TABLE_NAME,
    INSTRUCTION_TYPE,
    SUBSTR(LOG_DETAIL, 1, 300) AS LOG_DETAIL_SUMMARY,
    CASE WHEN LENGTH(LOG_DETAIL) > 0 THEN 1 ELSE 0 END  AS HAS_LOG_DETAIL,
    CASE WHEN LENGTH(RAW_MESSAGE) > 0 THEN 1 ELSE 0 END  AS HAS_RAW_MESSAGE,
    OFFSET,
    SOURCE_TIME,
    KAFKA_ENQUEUE_TIME,
    TARGET_TIME,
    INSERT_TIME
FROM ${tableName}
WHERE TARGET_TIME >= #{startTime}
  AND TARGET_TIME <  #{endExclusive}
  -- 以下四类条件按非空动态追加
  <if test="sourceDataSourceIds != null and !sourceDataSourceIds.isEmpty()">
    AND SOURCE_DATA_SOURCE_ID IN
    <foreach collection="sourceDataSourceIds" item="id" open="(" separator="," close=")">#{id}</foreach>
  </if>
  <if test="sourceTableName != null and sourceTableName != ''">
    AND SOURCE_TABLE_NAME = #{sourceTableName}
  </if>
  <if test="targetDataSourceIds != null and !targetDataSourceIds.isEmpty()">
    AND TARGET_DATA_SOURCE_ID IN
    <foreach collection="targetDataSourceIds" item="id" open="(" separator="," close=")">#{id}</foreach>
  </if>
  <if test="targetTableName != null and targetTableName != ''">
    AND TARGET_TABLE_NAME = #{targetTableName}
  </if>
ORDER BY TARGET_TIME DESC, CDC_LOG_ID DESC
FETCH FIRST 101 ROWS ONLY
```

### 6.2 下一页 SQL（追加游标边界谓词）

```sql
WHERE TARGET_TIME >= #{startTime}
  AND TARGET_TIME <  #{endExclusive}
  -- 其余四类条件同上
  AND (
         TARGET_TIME <  #{cursorTargetTime}
      OR (TARGET_TIME = #{cursorTargetTime} AND CDC_LOG_ID < #{cursorCdcLogId})
  )
ORDER BY TARGET_TIME DESC, CDC_LOG_ID DESC
FETCH FIRST 101 ROWS ONLY
```

### 6.3 列表 SQL 约束

| 编号 | 规则 |
|---|---|
| LQ-DESIGN-40 | `101` 是服务器固定的 `pageSize(100) + 1`，不得来自不可信字符串拼接；可依据 Oracle 驱动与项目惯例采用安全绑定或服务端固定字面量。 |
| LQ-DESIGN-41 | 所有值条件使用绑定参数；源库、目标库使用安全的 `IN` 参数展开（`foreach`），每个数组已校验 ≤100 元素（LQ-API-35）。 |
| LQ-DESIGN-42 | 表名条件使用 `=` 精确匹配，不得对日志列套 `UPPER()` / `LOWER()` / `LIKE` 或通配符（LQ-FILTER-22 / 42、LQ-NONGOAL-08 / 09）。 |
| LQ-DESIGN-43 | 不执行 `COUNT`；不使用 `OFFSET`；不 JOIN `CDC_DATA_SOURCE`；不读取 `RAW_MESSAGE`、`RESULT_DETAIL` 或完整 `LOG_DETAIL`（LQ-PERF-03 / 05、LQ-API-42 / 43）。 |
| LQ-DESIGN-44 | 摘要若在 Oracle 截取，使用字符语义一致的 `SUBSTR`（`SUBSTR(LOG_DETAIL, 1, 300)`），长度固定为 300（已确认决策 LQ-API-90-A）。`LENGTH(LOG_DETAIL)` / `LENGTH(RAW_MESSAGE)` 返回存在性标记，不读取完整内容（LQ-DETAIL-11、LQ-DESIGN-95）。 |
| LQ-DESIGN-45 | 若同一 `TARGET_TIME` 下存在多条记录，`CDC_LOG_ID` 必须提供严格稳定的第二排序键（LQ-PAGE-24）；排序键必须同时包含 `TARGET_TIME` 与 `CDC_LOG_ID`（LQ-PAGE-23）。 |
| LQ-DESIGN-46 | `startTime` / `endExclusive` / `cursorTargetTime` 以 `java.time.LocalDateTime` 绑定（Oracle `DATE` 语义）；`cursorCdcLogId` 以不丢精度 Oracle 数值类型（建议 `BigDecimal`，scale=0）绑定，不使用 VARCHAR 到 NUMBER 隐式转换。 |
| LQ-DESIGN-55 | 不得对 `CDC_LOG_ID` 列使用 `TO_CHAR`、`CAST` 等函数；`CDC_LOG_ID = #{cdcLogId}`、`CDC_LOG_ID < #{cursorCdcLogId}` 绑定 Oracle 数值参数（LQ-API-98）。 |
| LQ-DESIGN-56 | 列表 SELECT 读取的 `CDC_LOG_ID` 由 Mapper 映射为不丢精度类型，Service 在与 VO 和游标编码边界转为十进制字符串（LQ-API-97）。 |

### 6.4 数据源全表一次读取 SQL（列表名称映射与候选集合）

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
| LQ-DESIGN-47 | 列表请求必须恰好读取一次该结果，用同一结果在内存构建全量 `Map<DATA_SOURCE_ID, DATA_SOURCE_ORG>` 名称映射与有效 source/target 候选 ID 集合；不跨请求缓存（LQ-DATA-01 / 02 / 11、LQ-API-25）。 |
| LQ-DESIGN-48 | 名称映射读取全部数据源记录，不按 `FG_ACTIVE` 和类别过滤（LQ-DATA-06、LQ-API-63）；候选集合只保留启用且类别匹配的数据源。`FG_ACTIVE` 按仓库 `DataSource` 实体的 String 类型与值语义判断，启用值为 `'1'`，不采用数值 `1` 的另一套未确认写法（LQ-API-27）。 |

### 6.5 源/目标候选过滤（候选接口）

候选接口每次请求恰好执行一次 §6.4 的同一张四列全表查询，在内存按类别（`trim + equalsIgnoreCase('SOURCE' / 'TARGET')`）过滤并拆分为 `sourceList` / `targetList`，只保留 `FG_ACTIVE='1'` 的数据源，然后分别按 `DATA_SOURCE_ORG` 排序返回。本设计只保留单一内存过滤方案：不在 SQL 层分别按类别过滤，不提供两条候选 SQL（LQ-API-23）。

| 编号 | 规则 |
|---|---|
| LQ-DESIGN-49 | 候选接口与列表请求使用相同的单次全表读取语义（各请求各自执行一次，不跨请求共享），在内存完成过滤、拆分与排序；结果集合语义唯一。 |

### 6.6 日志详情最小字段 SQL

```sql
SELECT
    CDC_LOG_ID,
    SOURCE_DATA_SOURCE_ID,
    SOURCE_TABLE_NAME,
    TARGET_DATA_SOURCE_ID,
    TARGET_TABLE_NAME,
    INSTRUCTION_TYPE,
    RESULT_CODE,
    OFFSET,
    SOURCE_TIME,
    KAFKA_ENQUEUE_TIME,
    TARGET_TIME,
    INSERT_TIME,
    LOG_DETAIL
FROM ${tableName}
WHERE CDC_LOG_ID = #{cdcLogId}
FETCH FIRST 1 ROWS ONLY
```

| 编号 | 规则 |
|---|---|
| LQ-DESIGN-50 | 详情只读取详情所需字段，含完整 `LOG_DETAIL` 与 `RESULT_CODE`；不读取 `RESULT_DETAIL`，不顺带读取 `RAW_MESSAGE`（LQ-DETAIL-27 / 28、LQ-API-71）。 |
| LQ-DESIGN-51 | `cdcLogId` 参数经十进制与 `NUMBER(19,0)` 范围校验后以 BigDecimal 绑定（LQ-API-97 / 98）；记录不存在返回 `LOG_RECORD_NOT_FOUND`（LQ-API-72 / 88）；路径参数非法返回 HTTP 400（LQ-DESIGN-19）。 |

### 6.7 原始消息最小字段 SQL

```sql
SELECT CDC_LOG_ID, RAW_MESSAGE
FROM ${tableName}
WHERE CDC_LOG_ID = #{cdcLogId}
FETCH FIRST 1 ROWS ONLY
```

| 编号 | 规则 |
|---|---|
| LQ-DESIGN-52 | 原始消息只读取 `RAW_MESSAGE` 及最小标识，不顺带读取完整日志详情或其他大字段（LQ-API-75）。 |
| LQ-DESIGN-53 | `cdcLogId` 非法返回 HTTP 400（LQ-DESIGN-19）；记录不存在返回 `LOG_RECORD_NOT_FOUND`；记录存在但 `RAW_MESSAGE` 为 NULL/空串时，Service 归一化为空字符串返回（空内容与记录不存在互不混淆，LQ-API-76）。 |
| LQ-DESIGN-54 | `RAW_MESSAGE` 原样返回，不修改、不格式化、不保存（LQ-API-77）。 |

## 7. 游标与上一页

与 `API.md` §7 使用同一个唯一方案：**服务端签名不透明游标 + 规范化 JSON 条件指纹 + 前端请求游标栈实现上一页（服务端仅向后翻页）**。

### 7.1 游标生成与验证

| 编号 | 规则 |
|---|---|
| LQ-DESIGN-60 | 载荷 JSON：`{"v":1,"lt":"<logType>","fp":"<sha256-hex>","t":"<yyyy-MM-dd HH:mm:ss>","id":"<cdcLogId>"}`；编码为 UTF-8 JSON 的 `base64url`（无填充）。 |
| LQ-DESIGN-61 | 签名 = `HMAC-SHA256(secret, payload_base64url 原始文本)` 十六进制；游标 = `payload + "." + signature`。签名使用常量时间比较。密钥来自后端持久化配置（如 `cdc.log-query.cursor-secret`），不硬编码、不入 DTO、不入库、不出接口。服务使用相同密钥重启或重新部署时，旧游标仍可正常验签；只有密钥轮换、密钥配置改变、游标版本不兼容或游标被篡改时，旧游标才可能失效。验签失败返回 `CURSOR_INVALID`，页面提示用户重新查询第一页。不承诺游标永久有效。不得引入服务端游标会话、缓存或游标数据库表。 |
| LQ-DESIGN-62 | 条件指纹：对规范化条件 JSON 的字节计算 SHA-256 小写十六进制。规范化规则（生成与校验使用同一规则）：字段顺序固定为 `logType, startTime, endExclusive, sourceDataSourceIds, sourceTableName, targetDataSourceIds, targetTableName`；时间为秒级 `yyyy-MM-dd HH:mm:ss`；数据源 ID 数组去重后按字典序升序排序；空数组统一为 `[]`；空文本统一为 `null`；JSON 序列化使用固定字段顺序与 UTF-8。不使用未经转义的分隔符拼接字符串。示例（仅示意字段顺序与空值语义，实际以规范化器输出为准）：`{"logType":"error","startTime":"2026-08-14 00:00:00","endExclusive":"2026-08-21 00:00:00","sourceDataSourceIds":["DS_SRC_001","DS_SRC_002"],"sourceTableName":"T_ORDER","targetDataSourceIds":["DS_TGT_001"],"targetTableName":null}`。 |
| LQ-DESIGN-63 | 验证步骤：按最后一个 `.` 拆解 → base64url 解码 → 重算并常量时间比较签名 → 校验 `v==1` → 校验 `lt` 与请求 `logType` 一致 → 用当前请求条件重算 `fp` 比对。失败分类见 `LQ-API-54`（`CURSOR_INVALID` / `CURSOR_CONDITION_MISMATCH`）。 |

### 7.2 前端每个 Tab 的请求游标栈模型

唯一模型：每个 Tab 的游标栈只保存“已访问页面各自的请求游标”，栈顶对应当前页。

| 编号 | 规则 |
|---|---|
| LQ-DESIGN-64 | 每个 Tab 维护 `requestCursorStack`：`requestCursorStack[0] = null`，表示第 1 页请求无游标；栈顶始终等于当前页请求游标；当前响应的 `nextCursor` 单独保存在当前页状态中，不得在尚未进入下一页时提前压入栈（LQ-API-56 / 57）。 |
| LQ-DESIGN-65 | 下一页：请求游标取当前页响应保存的 `nextCursor`；请求成功前不得永久压栈；成功后压入该 `nextCursor`；请求失败仍停留当前页，栈不变（LQ-API-110）。 |
| LQ-DESIGN-66 | 上一页：不得在请求成功前永久弹栈；先计算目标栈（弹出栈顶），用新的栈顶作为请求游标，成功后整体替换为目标栈；请求失败，当前页和原栈保持不变（LQ-API-111）。 |
| LQ-DESIGN-67 | 当前页单独保存该页响应的 `hasNext`、`nextCursor`。没有上一页的判断为栈长度等于 1；没有下一页的判断为当前响应 `hasNext=false`（LQ-API-112）。 |
| LQ-DESIGN-68 | 点击“查询”成功后原子重置为 `[null]`；失败保留旧栈。两个 Tab 各自维护独立栈（LQ-API-113）。 |
| LQ-DESIGN-69 | 重复发送目标页的请求游标，会按照相同的固定排序和边界谓词重新查询目标页；在持续写入或晚到数据场景下，不保证返回内容与首次访问该页时完全一致，也不承诺跨请求一致性快照（LQ-API-59）。 |

### 7.3 请求序列示例

| 动作 | 请求游标 | 成功后的游标栈 |
|---|---|---|
| 首次查询第1页 | `null` | `[null]` |
| 第1页进入第2页 | 第1页响应的 `C1` | `[null, C1]` |
| 第2页进入第3页 | 第2页响应的 `C2` | `[null, C1, C2]` |
| 第3页返回第2页（上一页） | 弹出 `C2` 后新的栈顶 `C1` | `[null, C1]` |
| 第2页返回第1页（上一页） | 弹出 `C1` 后新的栈顶 `null` | `[null]` |

### 7.4 状态替换与失效

| 编号 | 规则 |
|---|---|
| LQ-DESIGN-70 | 点击“查询”：生成候选条件快照 → 首查成功后才**原子替换**已生效条件、列表与请求游标栈（栈重置为 `[null]`）；失败或超时保留旧列表、旧已生效条件与旧游标栈（LQ-TAB-30 ~ 34）。 |
| LQ-DESIGN-71 | 点击“重置”：只修改当前 Tab 的表单条件（时间恢复点击重置时所在自然日），不发起查询、不清列表、不改已生效条件、不改游标栈（LQ-TAB-40 / 41）。 |
| LQ-DESIGN-72 | 重新进入页面：清除两个 Tab 全部临时状态与游标，恢复默认表单，默认打开错误日志并自动首查（LQ-TAB-50 ~ 52）。 |
| LQ-DESIGN-73 | 旧响应失效：重新进入、Tab 切换或新查询时，用页面代次 + 每 Tab 请求令牌丢弃过期响应；错误日志响应不得写入正确日志状态（LQ-TAB-54 ~ 56、LQ-LOAD-38 / 39）。 |

## 8. 数据源名称映射与降级

| 编号 | 规则 |
|---|---|
| LQ-DESIGN-80 | 列表请求读取一次 `CDC_DATA_SOURCE` 全表（四列），构建 `Map<DATA_SOURCE_ID, DATA_SOURCE_ORG>`（LQ-DATA-01 / 02、LQ-API-61）。 |
| LQ-DESIGN-81 | 显示规则：原始数据源 ID 为 NULL → 对应 ID 与名称均省略，前端显示 `--`（不得回退为字符串 `"null"`、空串或“未定义名称”）；原始 ID 非 NULL 且找到且 `DATA_SOURCE_ORG` 有值 → 显示该名称；找到但为空 → “未定义名称”；未找到 → 显示日志原始 `DATA_SOURCE_ID`（LQ-DATA-07 ~ 09、LQ-API-64）。 |
| LQ-DESIGN-82 | 悬停显示完整名称与完整 ID，只有当对应 ID 或名称存在时才由前端组合展示，两者均为空时不显示 Tooltip（LQ-DATA-10、LQ-API-65）。 |
| LQ-DESIGN-83 | 已选过滤 ID 的校验基于候选集合（启用且类别匹配）；历史名称展示基于全量映射；两者由同一次全表读取产生但语义不同，不可混为一谈（LQ-API-66）。 |

## 9. 大字段隔离

| 编号 | 读取路径 | 读取内容 | 说明 |
|---|---|---|---|
| LQ-DESIGN-90 | 列表 | 轻字段 + `SUBSTR(LOG_DETAIL,1,300)` 摘要 + LOB 存在性标记 | 不读完整 `LOG_DETAIL`、不读 `RAW_MESSAGE`、不读 `RESULT_DETAIL` |
| LQ-DESIGN-91 | 日志详情 | 完整 `LOG_DETAIL` + 详情所需字段 | 不读 `RESULT_DETAIL`、不读 `RAW_MESSAGE` |
| LQ-DESIGN-92 | 原始消息 | 只读 `RAW_MESSAGE` + 最小标识 | 不读完整日志详情 |

| 编号 | 规则 |
|---|---|
| LQ-DESIGN-93 | 该隔离避免每页 100 行批量搬运 `VARCHAR2(4000)`/CLOB 大字段，保证弹窗按需加载（LQ-DETAIL-20 / 30 / 32）。 |
| LQ-DESIGN-94 | 不得建议列表预取 `RAW_MESSAGE`；列表摘要最大 300 字符（已确认决策 LQ-API-90-A）。 |
| LQ-DESIGN-95 | `hasLogDetail` / `hasRawMessage` 用 Oracle 对 LOB 长度/空值的轻量判定计算（`LENGTH(列) > 0` 或等价判定），避免把完整 CLOB 传入应用；本文不宣称任何表达式在未经执行计划或性能验证时一定零成本（LQ-API-48、LQ-PERF-14）。 |

## 10. 并发、数据变化与一致性

| 编号 | 规则 |
|---|---|
| LQ-DESIGN-100 | 日志持续追加时，双字段 keyset 游标避免 OFFSET 因新插入造成的大范围漂移（LQ-PAGE-02 / 25）。 |
| LQ-DESIGN-101 | 已经晚到但 `TARGET_TIME` 落在旧边界之前的数据，可能在后续页出现（keyset 向后扫描天然包含）。 |
| LQ-DESIGN-102 | 新插入且排序位置位于当前第一页之前的数据，不会自动插入已显示列表；用户需重新点击查询（LQ-LOAD-02、LQ-API-59）。 |
| LQ-DESIGN-103 | 多页请求不保证同一数据库快照；重复发送目标页的请求游标按相同固定排序和边界谓词重新查询，不保证返回内容与首次访问该页时完全一致；不得承诺跨请求快照一致性（LQ-API-59）。 |
| LQ-DESIGN-104 | 不做自动刷新、轮询、WebSocket 与自动重试（LQ-LOAD-01 / 33、LQ-NONGOAL-13）。 |

## 11. 超时、取消与失败恢复

| 编号 | 规则 |
|---|---|
| LQ-DESIGN-110 | 前端请求开始立即显示加载动画，3 秒后追加“查询耗时较长，请耐心等待”提示，动态显示已等待秒数（LQ-LOAD-10 ~ 14）。 |
| LQ-DESIGN-111 | 30 秒超时后结束本次加载并显示可操作错误（LQ-LOAD-30 / 32）；后端数据库语句超时 25 秒并映射 `QUERY_TIMEOUT`（LQ-API-92，已确认决策 LQ-API-90-J）。 |
| LQ-DESIGN-112 | 后端与数据库查询配置相互协调的超时（前端 30 秒 > 后端语句 25 秒），保证浏览器停止等待前数据库已经中止（LQ-LOAD-31）。 |
| LQ-DESIGN-113 | 能取消则取消旧请求；不能取消则用页面代次和每 Tab 请求令牌丢弃过期响应（LQ-TAB-54 ~ 56）。 |
| LQ-DESIGN-114 | 失败保留旧表单、旧已生效条件、旧列表和旧游标栈；新查询失败与“查询成功但无数据”必须区分（LQ-VALID-01 / 02、LQ-LOAD-35 ~ 37）。 |
| LQ-DESIGN-115 | 不自动重试；超时提示用户缩小查询范围或增加条件（LQ-LOAD-33 / 34）。 |

## 12. 与物理设计解耦

| 编号 | 规则 |
|---|---|
| LQ-DESIGN-120 | 应用 SQL 只依赖逻辑表名（`CDC_LOG_ERROR` / `CDC_LOG_CORRECT`）、字段、必填 `TARGET_TIME` 范围和稳定排序键；不引用具体分区名称，不硬编码依赖分区粒度的逻辑（LQ-DB-01）。 |
| LQ-DESIGN-121 | `TARGET_TIME` 第一层 `RANGE` 分区键是已批准边界；RANGE 粒度、子分区、索引本地/全局形态和最终 DDL 待约 40 个数据源完成首次全量后按真实分布确定（LQ-DB-07 / 08 / 09 / 12）。 |
| LQ-DESIGN-122 | 后续离线重组分区与索引不应改变 API、DTO、查询条件或业务 SQL 语义（LQ-DB-10）。 |
| LQ-DESIGN-123 | 逻辑访问路径需求（供后续 SQL/索引设计输入，**不构成已批准索引 DDL**）：(a) 必填时间范围下的 `TARGET_TIME` 范围扫描；(b) `TARGET_TIME DESC, CDC_LOG_ID DESC` 固定排序（对应复合索引候选，延期）；(c) `CDC_LOG_ID` 精确点查（详情/原始消息）；(d) `SOURCE_DATA_SOURCE_ID` / `TARGET_DATA_SOURCE_ID` 在时间范围内等值/`IN`；(e) `SOURCE_TABLE_NAME` / `TARGET_TABLE_NAME` 时间范围内等值。 |
| LQ-DESIGN-124 | 菜单在最终物理设计和生产等价性能验收完成前必须隐藏；全部验证通过后方可开放（LQ-DB-14、AC-74）。 |

## 13. 测试设计要点

只写测试场景，不创建测试代码（已确认决策 LQ-API-90-L：Mapper 采用 MyBatis XML 固定表 `${}` + 固定表枚举，决定测试可在 SQL/接口两层展开）。

| 编号 | 场景 |
|---|---|
| LQ-DESIGN-130 | 默认当前自然日：首查请求不带时间时按进入时自然日生成 `00:00:00`~`23:59:59`（服务端校验拒绝缺失时间，前端负责默认生成，二者都要测）。 |
| LQ-DESIGN-131 | 完整 7 个自然日合法（`endExclusive - startTime = 7×24h`）；超过 1 秒拒绝（`TIME_SPAN_EXCEEDED`）。 |
| LQ-DESIGN-132 | 四类可选条件的单独与组合查询；四条件全空时仅按时间范围查固定排序第一页。 |
| LQ-DESIGN-133 | 表名大小写敏感精确匹配；同一名称不同大小写返回不同结果；超 64 字符拒绝。 |
| LQ-DESIGN-134 | 多选 `IN` 去重；空数组等同未选择；非法/非候选 ID 拒绝（`DATA_SOURCE_IDS_INVALID`）。 |
| LQ-DESIGN-135 | 同一 `TARGET_TIME` 多行时 `CDC_LOG_ID` 提供稳定第二排序；翻页不重不漏。 |
| LQ-DESIGN-136 | `CDC_LOG_ID` 超过 JavaScript `MAX_SAFE_INTEGER` 的字符串传输与精确回传；示例 `7755033852453421056`；外部字符串与内部 BigDecimal（scale=0）绑定不丢精度，不使用隐式转换。 |
| LQ-DESIGN-137 | 100 / 101 条的 `hasNext` 边界：100 条 → false；101 条 → true 且 `nextCursor` 为第 100 条边界。 |
| LQ-DESIGN-138 | 请求游标栈：连续 3 页下一页后 2 次上一页回到首页；第 3 页返回第 2 页请求游标为 `C1`，第 2 页返回第 1 页请求游标为 `null`，栈结构与请求游标正确回退（修正 off-by-one）。 |
| LQ-DESIGN-139 | 两 Tab 独立状态：正确日志切换不影响错误日志，反之亦然。 |
| LQ-DESIGN-140 | 数据源已停用/缺失映射：停用源的历史日志仍可展示（回退名称），但停用源不可作为新候选选中；原始数据源 ID 为 NULL 时对应 ID 与名称均省略并显示 `--`。 |
| LQ-DESIGN-141 | 详情与原始消息大字段隔离：列表请求不读取完整 `LOG_DETAIL` / `RAW_MESSAGE`；详情不读 `RESULT_DETAIL` / `RAW_MESSAGE`；原始消息只读 `RAW_MESSAGE`。 |
| LQ-DESIGN-142 | `RAW_MESSAGE` 为 NULL / 空串 / 合法 JSON / 非 JSON / 超大文本时的响应语义；空内容与记录不存在互不混淆。 |
| LQ-DESIGN-143 | 30 秒超时、旧响应失效和失败保留旧列表：超时后列表不变、错误提示明确；过期响应不覆盖新页面状态。 |
| LQ-DESIGN-144 | SQL 注入防护：`logType` / `${tableName}` 只能来自封闭枚举；表名、`IN`、时间全部绑定参数；非法输入在到达 SQL 前被拒绝。 |
| LQ-DESIGN-145 | 翻页失败原子性：下一页失败不压栈、上一页失败不弹栈，当前页与游标栈保持不变；查询失败保留旧栈。 |
| LQ-DESIGN-146 | `cdcLogId` 非法格式/越界：路径参数非十进制或超出 `NUMBER(19,0)` 返回 HTTP 400，与 `LOG_RECORD_NOT_FOUND`（40410）区分。 |
| LQ-DESIGN-147 | 数据源全表 4 列单次读取：列表请求与候选接口各自恰好一次读取；名称映射不过滤、候选过滤，`FG_ACTIVE` 按字符串 `'1'` 判断；无 N+1、无跨请求缓存。 |
| LQ-DESIGN-148 | 规范化 JSON 条件指纹：字段顺序固定、时间秒级、数组去重排序、空数组 `[]` / 空文本 `null` 语义固定；生成与校验一致，接口与游标校验对同一请求的指纹一致。 |
| LQ-DESIGN-149 | 游标密钥语义：服务使用相同签名密钥重启后旧游标仍可正常验签；密钥轮换、密钥配置改变、版本不兼容或篡改后旧游标失效并返回 `CURSOR_INVALID`，页面提示重新查询第一页。 |

## 14. 已确认设计决策

以下设计已经用户确认，由 `LOG-QUERY-API-DESIGN-001` 的待确认项转为正式设计决策（追踪编号沿用原编号），与 `API.md` §12 保持一致：

| 编号 | 确认结论 |
|---|---|
| LQ-DESIGN-150 | `logSummary` 摘要最大长度固定 300 字符（需求上限 500 内）。 |
| LQ-DESIGN-151 | 游标采用服务端 HMAC 签名不透明游标 + 条件指纹，条件指纹按 §7.1 规范化 JSON 计算；密钥入后端配置。 |
| LQ-DESIGN-152 | 上一页采用“前端请求游标栈 + 服务端仅向后翻页”，模型与失败原子性按 §7.2 / §7.3 修正后算法。 |
| LQ-DESIGN-153 | 数据源候选为单接口一次返回 source+target，每次请求单次全表读取并按 §6.5 内存过滤。 |
| LQ-DESIGN-154 | 详情/原始消息接口复用列表行名称，不重新读取数据源表。 |
| LQ-DESIGN-155 | `logType` 取值 `error` / `correct`（大小写敏感）。 |
| LQ-DESIGN-156 | 数据源 ID 数组最大 100 个元素。 |
| LQ-DESIGN-157 | `OFFSET` 对外 JSON 暂按字符串；开发前从仓库现有表结构/映射确认数据库真实类型，不依赖生产最终物理 DDL。 |
| LQ-DESIGN-158 | 前端 30 秒超时需覆盖全局 `http.ts` 10 秒（前端改造点）。 |
| LQ-DESIGN-159 | 后端数据库语句超时 25 秒（低于前端 30 秒）。 |
| LQ-DESIGN-160 | 错误码数值（40010~40017 / 40410 / 50020~50021）。 |
| LQ-DESIGN-161 | 后端 Mapper 采用 MyBatis XML 固定表 `${}` + 固定表枚举。 |

## 15. 与 API.md 及已批准需求的一致性

- 接口、URL、HTTP 方法与 `API.md` §4 一致：列表为 `POST /api/log-query/logs/search`，数据源候选、详情、原始消息为 GET。
- DTO/VO 字段、类型、必填性与 `API.md` §5/6/9 一致；列表请求体不含 `pageSize`。
- 时间端点（`endTime` 包含端点 → 后端转 `endExclusive`）与 7 天公式一致。
- 游标格式、校验、上一页策略与 `API.md` §7 一致（服务端签名不透明游标 + 规范化 JSON 条件指纹 + 前端请求游标栈）。
- 页容量固定 100、取 101 条、无总数一致。
- `CDC_LOG_ID` JSON 字符串规则与「外部字符串、内部数值绑定」（BigDecimal 不丢精度、无隐式转换）一致。
- 固定排序与下一页谓词一致。
- 数据源每次列表请求/候选接口各自读取全表一次、禁止 N+1 与大表 JOIN、四列统一读取一致。
- 列表/详情/原始消息三类查询字段隔离一致。
- 30 秒超时与不自动重试一致。
- 固定日志类型到固定表的安全映射一致（含 `${}` 封闭枚举说明）。
- 最终分区、子分区、索引、DDL 仍为延期项；菜单保持隐藏的部署边界一致。
- 两份文档状态均为 `DRAFT_PENDING_USER_REVIEW / NOT_STARTED`，与已批准 `REQUIREMENTS.md` 不冲突。
