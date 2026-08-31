# 数据订阅 Feature 接口设计基线（API）

## 1. 元数据与状态

| 项目 | 值 |
|---|---|
| Feature 中文名称 | 数据订阅 |
| Feature 标识 | `data-subscription` |
| 文档状态 | `DRAFT_PENDING_USER_REVIEW`（接口设计草案，尚未获得项目负责人或 ChatGPT 正式复审批准） |
| 设计正式复审状态 | `PENDING_R4_REVIEW`（R1 正式复审结论 `CHANGES_REQUIRED`；R2 定向修订已完成且四项修订目标通过正式复核；R3 已按已批准“取消并发保护”需求统一删除版本令牌与并发错误码并完成定向修订；R4 为四文档设计基线统一执行状态元数据定向收口，本文件 API 业务设计在 R4 中零语义变化，但作为四文档设计基线的一部分，当前统一等待 ChatGPT 对 R4-R1 结果提交正式复审） |
| 实现状态 | `NOT_STARTED`（本任务为纯文档设计基线 R3 定向修订，不涉及任何业务代码实现） |
| 验收执行状态 | 126 条全部 `NOT_RUN` |
| 任务编号 | `DATA-SUBSCRIPTION-DESIGN-BASELINE-001-R3`（R3 定向修订；前序 R2 任务 `DATA-SUBSCRIPTION-DESIGN-BASELINE-001-R2` 结果提交 `026417e7e907b0fd23e8812024a260f119c993cc`；R1 任务 `DATA-SUBSCRIPTION-DESIGN-BASELINE-001-R1` 结果提交 `3609548238c9fede745f5291e258469ab7b78167`；首版任务 `DATA-SUBSCRIPTION-DESIGN-BASELINE-001` 结果提交 `610401575938ba32f13fa635493f991bdfae81b6`） |
| 依据的已批准需求基线 | `docs/features/data-subscription/REQUIREMENTS.md`（`APPROVED`，107 条 `DSUB-REQ-001` ~ `DSUB-REQ-107`，当前正式批准版本为“取消并发保护”需求调整版本，Git 基线提交 `8331fbb6e17b8e2165b788d972f651aa980bf227`） |
| 依据的已批准验收基线 | `docs/features/data-subscription/ACCEPTANCE.md`（`APPROVED`，126 条 `DSUB-AC-001` ~ `DSUB-AC-126`，全部 `NOT_RUN`；当前版本为“取消并发保护”验收标准调整版本，Git 基线提交 `8331fbb6e17b8e2165b788d972f651aa980bf227`） |
| 创建日期 | 2026-08-30 |
| R1 修订日期 | 2026-08-30 |
| R2 修订日期 | 2026-08-31 |
| R3 修订日期 | 2026-08-31 |

说明：本文件是接口设计草案，**不是正式批准的设计基线**。R1 已修正 ChatGPT 正式复审（`CHANGES_REQUIRED`）发现的主要问题并同步已批准点号规则；R2 统一修正剩余四项（三类查询语义、元数据 API query 参数、物化视图显式排除、`DSUB-FP-V1` 字节级指纹）并同步含逗号查询批准基线；R3 按已正式批准并收口的“取消并发保护”需求（`DSUB-REQ-097/098/099/103`）删除编辑打开/删除预览响应与 PUT/DELETE 请求中的 `versionToken`、删除指纹算法引用与锁内比较、删除 `40910 CONCURRENT_MODIFIED` 错误码，编辑保存与物理删除改为普通主键更新/删除。删除 `DSUB-FP-V1` 相关接口契约不是否定 R2 的技术正确性，而是同步新的正式需求。R3 定向修订已完成，但本文件尚未获得 ChatGPT 正式设计复审批准，不表示设计已批准、功能已实现、部署或验收完成。

### 1.1 设计依据

- 统一响应结构：`ApiResponse<T>`（`code` / `message` / `data` / `timestamp`；`code=200` 表示成功，失败时 `code` 为业务错误码，HTTP 状态为 200，见 §7）。该结构来自项目既有 `common/api/ApiResponse.java`，本 Feature 沿用。
- 异常处理：`BusinessException(code, message)`（项目既有 `common/exception/BusinessException.java` / `GlobalExceptionHandler.java`）：业务异常以 HTTP 200 + `fail(code, message)` 返回；参数校验失败（`@Validated` 等）返回 HTTP 400；未捕获异常返回 HTTP 500（内部堆栈不会暴露给前端）。批量失效项的结构化返回使用 `SubscriptionValidationException`（继承 `BusinessException`），以 `data` 携带 `validationErrors`（见 §4.6/§7）。
- 路径风格：`@RestController` + `@RequestMapping("/api/subscriptions")` + SpringDoc `@Operation`/`@Tag`，与 `DataSourceController`（`/api/data-sources`）、`ServerConfigController`（`/api/server-config`）一致。
- **本 Feature API 尚未实现**，本文件为设计草案；实现阶段按正式复审结论落地，不得直接照搬其他项目接口。

## 2. 接口总览

| # | 方法 | 路径 | 用途 |
|---|---|---|---|
| 1 | GET | `/api/subscriptions/options` | 查询源库/目标库启用候选（一次返回两类） |
| 2 | GET | `/api/subscriptions` | 查询全部启用订阅（可带源库/目标库多选条件，无分页） |
| 3 | GET | `/api/subscriptions/{dataSubId}` | 查询订阅详情 |
| 4 | GET | `/api/subscriptions/metadata/schemas?dataSourceId=<原始字符串>` | 查询源库可访问且含普通表的非系统 Schema |
| 5 | GET | `/api/subscriptions/metadata/tables?dataSourceId=<原始字符串>&schema=<原始字符串>` | 按源库与 Schema 查询普通表 |
| 6 | POST | `/api/subscriptions` | 新增订阅 |
| 7 | GET | `/api/subscriptions/{dataSubId}/edit` | 打开编辑所需数据与已选 Schema/表回显 |
| 8 | PUT | `/api/subscriptions/{dataSubId}` | 编辑保存 |
| 9 | GET | `/api/subscriptions/{dataSubId}/delete-preview` | 删除预览（删除确认所需最新信息） |
| 10 | DELETE | `/api/subscriptions/{dataSubId}` | 物理删除 |

合并说明：源库/目标库候选合并为单个 `options` 接口（第 1 个），因为列表页查询区与新增/编辑弹窗都需要两类候选，一次返回避免两次往返；列表不分页（第 2 个）；元数据两个接口（第 4、5 个）在 R2 改用 query 参数承载 `dataSourceId`/`schema`（原 `GET /metadata/{dataSourceId}/schemas/{schema}/tables` 路径变量草案无法可靠承载含 `/`、`#`、`?`、空格等合法特殊字符的 Oracle quoted identifier，即使 `encodeURIComponent`，`%2F` 也可能被 Servlet 容器或反向代理拒绝或提前解码；R2 只保留 query 参数版本，不设计兼容双路径）；`{dataSubId}` 仍可作为路径变量，因为订阅主键为 32 位十六进制 UUID（见 §8.1），恒为安全的 32 位十六进制字符。删除采用“删除预览 + 物理删除”两步闭环：列表点击“删除”先调 `delete-preview` 获取最新删除确认信息，确认后 DELETE 按主键直接物理删除（DESIGN §3.7，流程见 §4.9/§4.10）。

## 3. 通用约定

### 3.1 字符串 ID

- 所有 ID（`dataSubId`、`dataSourceId`、schema、table 名）按字符串传输，前端不得做数字转换；Oracle `NUMBER` 不在本 Feature 中出现，但统一遵守“字符串 ID”规则，避免 JS 安全整数问题（见 DESIGN §6）。
- URL 路径中仅 `{dataSubId}` 是路径变量（后端生成的 32 位十六进制 UUID，安全字符，无需编码）。元数据接口的 `dataSourceId` 与 `schema` 使用 query 参数（Spring `@RequestParam String`），前端用 axios `params` 对象传参、不手工拼接 query string，前后端均按原始字符串传输、保持大小写、不做 URL 路径段拆分；schema/表名区分大小写、可能含特殊字符，query 参数比路径变量更能可靠承载（见 §2 合并说明）。
- 保留字符边界：数据源 ID、Schema 名、表名含英文逗号 `,` 或组件内部英文句点 `.` 的对象不允许用于新增/编辑订阅（已批准点号规则，见 §4.6 与 DESIGN §4.2）；新增/编辑候选在 UI 层显示为禁用并说明原因（UI §5/§6）。查询候选仍允许选择含保留字符的存量数据源用于查询历史订阅（UI §2.1）。

### 3.2 时间格式

- 时间字段（`insertTime` / `updateTime`）统一为 ISO-8601 字符串（`yyyy-MM-dd'T'HH:mm:ss`，服务端 Asia/Shanghai），与项目既有序列化一致；空值返回 `null`。

### 3.3 鉴权现状边界

- 本 Feature 不设计认证/授权（`DSUB-REQ` 范围外“用户认证/权限管理”）；沿用项目当前无鉴权的现状，不虚构登录态或权限模型。如项目后续引入统一鉴权，本接口路径随之统一接入，本设计不预先假设。

### 3.4 敏感字段

- 响应中**不包含** `CDC_DATA_SOURCE.DATA_SOURCE_PASSWORD`、JDBC 连接串或任何源库连接敏感信息；源库元数据访问只在后端发起，前端不接触连接信息（DESIGN §7.2）。

## 4. 接口明细

### 4.1 `GET /api/subscriptions/options` — 查询源库/目标库启用候选

用途：列表查询区与新增/编辑弹窗的源库/目标库下拉候选。

请求：无参数。

响应：

```json
{
  "code": 200,
  "message": "success",
  "data": {
    "sources": [
      { "dataSourceId": "S01", "dataSourceOrg": "机构A" }
    ],
    "targets": [
      { "dataSourceId": "T01", "dataSourceOrg": "机构B" }
    ]
  },
  "timestamp": "2026-08-30T10:00:00"
}
```

字段说明：

| 字段 | 类型 | 说明 |
|---|---|---|
| data.sources | SourceOptionVO[] | 源库候选 |
| data.targets | TargetOptionVO[] | 目标库候选 |
| dataSourceId | string | 数据源 ID（主键） |
| dataSourceOrg | string | 数据源机构（候选主要展示文字，`DSUB-REQ-059`） |

- 候选规则（`DSUB-REQ-033/058/064`，规则唯一来源见 §8 TBD-02 结论）：
  - 源库候选：`FG_ACTIVE='1' AND UPPER(DATA_SOURCE_CATEGORY)='SOURCE'`；
  - 目标库候选：`FG_ACTIVE='1' AND UPPER(DATA_SOURCE_CATEGORY)='TARGET'`；
  - 均按 `DATA_SOURCE_ID` ASC 排序；不包含停用或不存在的数据源。
- 查询候选边界：本接口同样作为查询区候选来源；即使某个存量数据源 ID 含保留字符（英文逗号或英文句点），仍返回并允许选用于查询历史订阅，不得因保留字符导致无法定位历史记录（`DSUB-REQ-033`）。前端对“维护候选”与“查询候选”的处理不同（UI §2.1 与 UI §5 区分说明）。
- 响应规模：源库候选约 50～100（前端以可搜索下拉承载，不平铺卡片）；目标库候选通常 ≤5。
- 错误：无业务失败路径（查询数据源失败按 §7 通用错误处理）。

### 4.2 `GET /api/subscriptions` — 查询启用订阅列表

用途：列表页查询（首次进入无条件 + 条件过滤）。

请求参数（query）：

| 参数 | 类型 | 必填 | 说明 |
|---|---|---|---|
| sourceIds | string[] | 否 | 源库 ID 多选，之间 `OR` |
| targetIds | string[] | 否 | 目标库 ID 多选，之间 `OR` |

- 数据库只执行单一查询读取全部 `FG_ACTIVE='1'` 订阅，按 `NVL(UPDATE_TIME, INSERT_TIME) DESC` 排序（SQL 见 DATABASE.md §4.1）；源库组、目标库组的过滤在**服务层 Java** 完成：源库条件之间 `OR`、目标库条件之间 `OR`、两组之间 `AND`，过滤后保持数据库排序的相对顺序（`DSUB-REQ-034`；算法见 DESIGN §7.1）。不得把源库组与目标库组放入同一个 `OR` 容器。
- 无条件时返回全部启用订阅（`DSUB-REQ-029`）。
- 无分页（`DSUB-REQ-030`），一次返回全部。
- **三类匹配语义（`DSUB-REQ-034`，已批准；统一 null-safe 契约见 DESIGN §4.9 / DATABASE §4.1）**：
  - **不含英文逗号的查询 ID（普通/仅含句点）**：存储值经 `splitTrimDropEmpty` 归一化后，按完整 token 字面精确匹配（`matchCsvNormal`；Java `String.equals`，大小写敏感；`%`、`_`、反斜杠、句点、正则字符按字面处理；禁止 `%ID%` 子串匹配；`S01` 不匹配 `S012`）。仅含英文句点（不含英文逗号）的 ID 适用本精确规则。存储值 `NULL`/空白解析为空集合，与任意查询 ID 都不匹配。
  - **含英文逗号的查询 ID**：定义为“历史兼容可能匹配”（`matchCsvComma`）——无法识别逗号归属，只能在原始 CSV 字段中查找与候选字面值相同、分隔边界完整的连续片段（`queryAtomic` 是 `storedAtomic` 的连续子序列），返回“可能匹配记录集合”，允许不可消除的假阳性，不得为消除假阳性而静默丢弃可能相关的历史记录。
  - 候选经 `splitTrimDropEmpty` 拆分后若没有任何非空原子片段（`NULL`/空白），后端拒绝该查询参数并返回参数校验错误（HTTP 400），不得退化为匹配全部。
- 一次查询包含任意含逗号候选时，响应 `queryWarnings` 返回歧义条件；无歧义条件时 `queryWarnings=[]`。警告不是错误，不阻断查询。
- 默认排序：`NVL(UPDATE_TIME, INSERT_TIME) DESC`（`DSUB-REQ-028/031`）。

响应（`data` 为对象，含 `items` 与 `queryWarnings`；**本接口唯一响应类型**，UI 不得再把 `data` 当数组）：

```json
{
  "code": 200,
  "message": "success",
  "data": {
    "items": [
      {
        "dataSubId": "9f3f...32hex",
        "dataSubDesc": "机构A到机构B全量订阅",
        "anomalyMultiSource": false,
        "source": { "dataSourceId": "S01", "dataSourceOrg": "机构A", "status": "NORMAL" },
        "sourceTableCount": 128,
        "tablesBySchema": [
          { "schema": "SCHEMA_A", "tables": ["TABLE_1", "TABLE_2"] }
        ],
        "rawUnparseableTables": [],
        "targets": [
          { "dataSourceId": "T01", "dataSourceOrg": "机构B", "status": "NORMAL" }
        ],
        "updateTime": "2026-08-30T10:00:00",
        "insertTime": "2026-08-29T09:00:00"
      }
    ],
    "queryWarnings": [
      { "type": "AMBIGUOUS_COMMA_ID", "field": "sourceIds", "value": "A,B", "message": "含逗号的数据源 ID 只能进行历史兼容可能匹配，结果可能包含歧义记录" }
    ]
  },
  "timestamp": "2026-08-30T10:00:00"
}
```

字段说明：

| 字段 | 类型 | 说明 |
|---|---|---|
| data.items | SubscriptionRowVO[] | 过滤后的订阅行（数据库排序后的相对顺序） |
| data.queryWarnings | QueryWarning[] | 本次查询的歧义条件清单；无歧义条件时为 `[]` |
| queryWarnings[].type | enum | 歧义类型，当前唯一值 `AMBIGUOUS_COMMA_ID`（含逗号数据源 ID 历史兼容可能匹配） |
| queryWarnings[].field | string | 歧义条件所属参数名：`sourceIds` / `targetIds` |
| queryWarnings[].value | string | 含逗号的原始候选 ID |
| queryWarnings[].message | string | 用户可见警告文案（“含逗号的数据源 ID 只能进行历史兼容可能匹配，结果可能包含歧义记录”） |
| data.items[].dataSubId | string | 订阅 ID（字符串，`DSUB-REQ-036` 不在首层列表单独占列，但供详情/编辑/删除使用） |
| data.items[].dataSubDesc | string | 订阅描述 |
| data.items[].anomalyMultiSource | boolean | 多源库异常记录标志（`DSUB-REQ-010`；异常记录整行警示且无操作） |
| data.items[].source | SourceRefVO \| null | 主源库展示；异常记录时为 null（不承诺首个源库） |
| data.items[].source.dataSourceOrg | string \| null | 机构名称；已停用显示 ORG 并标记“已停用”，不存在显示原始 ID 并标记“不存在”（`DSUB-REQ-042`） |
| data.items[].source.status | enum | `NORMAL` / `INACTIVE` / `NOT_FOUND` |
| data.items[].sourceTableCount | number | 源表数量“共 N 张”：按英文逗号拆分、trim、丢弃空 token 后统计**所有非空 token**（含当前无法解析的历史 token），不访问源 Oracle（`DSUB-REQ-038`；DESIGN §4.5） |
| data.items[].tablesBySchema | SchemaTableGroup[] | 按 Schema 分组的可解析表清单，供悬停逐行显示与行内渲染；一次返回避免悬停 N+1（订阅记录规模小） |
| data.items[].rawUnparseableTables | string[] | `DATA_SOURCE_TABLE` 无法解析的原始 token，行内警示展示；空数组表示全部可解析 |
| data.items[].targets | TargetRefVO[] | 目标库展示（独立标签；机构名称为主、ID 悬停，`DSUB-REQ-037/039/042`） |
| data.items[].updateTime / insertTime | string \| null | 更新时间 / 创建时间；`updateTime` 为 null 时前端回退展示 `insertTime` 并标记“创建时间”（`DSUB-REQ-040`） |

- 每行目标库数量通常 1～5（`DSUB-REQ-065`）。
- 空结果：`data.items` 返回空数组，前端显示“暂无符合条件的订阅记录”（`DSUB-REQ-034`）。
- 错误：数据库查询失败按 §7 通用错误处理；本接口不连接源 Oracle。

### 4.3 `GET /api/subscriptions/{dataSubId}` — 订阅详情

用途：查看详情弹窗（`DSUB-REQ-044~051`）。

请求：`{dataSubId}` 路径参数。

响应：

```json
{
  "code": 200,
  "message": "success",
  "data": {
    "dataSubId": "9f3f...32hex",
    "dataSubDesc": "机构A到机构B全量订阅",
    "source": { "dataSourceId": "S01", "dataSourceOrg": "机构A", "status": "NORMAL" },
    "tablesBySchema": [
      { "schema": "SCHEMA_A", "tables": ["TABLE_1", "TABLE_2"] }
    ],
    "rawUnparseableTables": [],
    "targets": [
      { "dataSourceId": "T01", "dataSourceOrg": "机构B", "status": "NORMAL" }
    ],
    "insertTime": "2026-08-29T09:00:00",
    "updateTime": "2026-08-30T10:00:00",
    "warnings": []
  },
  "timestamp": "2026-08-30T10:00:00"
}
```

字段说明：

| 字段 | 类型 | 说明 |
|---|---|---|
| dataSubId / dataSubDesc | string | 订阅 ID / 描述（`DSUB-REQ-047`） |
| source | SourceRefVO | 源库机构名称与数据源 ID（`DSUB-REQ-047`） |
| tablesBySchema | SchemaTableGroup[] | 按 Schema 分组的可解析表清单（`DSUB-REQ-047/049`）；`schema` 保持原始大小写 |
| rawUnparseableTables | string[] | `DATA_SOURCE_TABLE` 无法解析的原始 token，单独分区展示并带警告（`DSUB-REQ-050`）；正常三段格式（含两个结构句点）不被误判为异常；空数组表示全部可解析 |
| targets | TargetRefVO[] | 各目标库机构名称与数据源 ID（`DSUB-REQ-047`） |
| insertTime / updateTime | string \| null | 创建时间 / 更新时间（`DSUB-REQ-047`） |
| warnings | string[] | 已停用/不存在数据源、字段格式异常等警告文案（`DSUB-REQ-048`） |

- 本接口**不连接源 Oracle**（`DSUB-REQ-045`），只读取已保存配置和数据源映射。
- 多源库异常记录不提供查看入口，前端不调用本接口（`DSUB-REQ-046`；后端对异常记录详情请求返回 `40352`，见 §7）。
- 不展示 `DATA_SOURCE_COMMENT`、`DATA_TARGET_TABLE`、`DATA_TARGET_COMMENT`（`DSUB-REQ-051`）。
- 错误：记录不存在 → `40430`；多源库异常 → `40352`。

### 4.4 `GET /api/subscriptions/metadata/schemas` — 源库 Schema 列表

用途：新增/编辑弹窗中选择源库后自动加载 Schema（`DSUB-REQ-069/070`）。

请求参数（query）：

| 参数 | 类型 | 必填 | 说明 |
|---|---|---|---|
| dataSourceId | string | 是 | 源库 ID（原始字符串，Spring `@RequestParam String`，前端 axios `params` 对象传参、不手工拼接 query string，不做 URL 路径段拆分） |

响应：

```json
{
  "code": 200,
  "message": "success",
  "data": {
    "dataSourceId": "S01",
    "filterMode": "ORACLE_MAINTAINED",
    "schemas": ["SCHEMA_A", "SCHEMA_B"]
  },
  "timestamp": "2026-08-30T10:00:00"
}
```

字段说明：

| 字段 | 类型 | 说明 |
|---|---|---|
| dataSourceId | string | 源库 ID |
| filterMode | enum | 本次 Schema 过滤实际采用的模式：`ORACLE_MAINTAINED`（`ALL_USERS.ORACLE_MAINTAINED='N'` 优先模式）或 `FALLBACK_EXCLUSION_LIST`（系统 Schema 排除清单兼容回退）。该标识用于可核验性，不展示给普通用户（DESIGN §6.3） |
| schemas | string[] | 非系统 Schema 列表（当前账号可访问、包含普通表） |

- Schema 范围：当前账号可访问、包含普通表、非系统 Schema；不展示空 Schema、系统 Schema、视图、物化视图、同义词（`DSUB-REQ-069`；能力分层过滤 + 物化视图显式排除方案见 DESIGN §6.3）。
- 目标库只选择、不连接；本接口只接受源库 ID（类别为 SOURCE 且 `FG_ACTIVE=1` 的记录，后端校验，否则 `40322`/`40320`）。
- 错误：源库不存在/停用 → `40320`；类别不符 → `40322`；源库连接失败 → `40340`（脱敏）；Schema 加载失败 → `40341`。

### 4.5 `GET /api/subscriptions/metadata/tables` — 按 Schema 查询普通表

用途：点击 Schema 后加载该 Schema 的普通表（`DSUB-REQ-070/072`）。

请求参数（query）：

| 参数 | 类型 | 必填 | 说明 |
|---|---|---|---|
| dataSourceId | string | 是 | 源库 ID（原始字符串，区分大小写） |
| schema | string | 是 | Schema 名（原始字符串，区分大小写，可能含特殊字符；query 参数比路径变量更能可靠承载） |

响应：

```json
{
  "code": 200,
  "message": "success",
  "data": { "dataSourceId": "S01", "schema": "SCHEMA_A", "tables": ["TABLE_1", "TABLE_2"] },
  "timestamp": "2026-08-30T10:00:00"
}
```

- 表范围：普通表，不含视图、物化视图、同义词（`DSUB-REQ-069`）；物化视图必须按 DESIGN §6.3 统一谓词显式排除（`ALL_TABLES` 不会天然排除物化视图）。
- 表名保持源 Oracle 原始大小写（`DSUB-REQ-016`）。
- 保留字符处理：Schema/表名含英文逗号或组件内部英文句点的对象仍由本接口返回，但前端渲染为不可选择并明确说明协议保留字符原因，不得静默隐藏（`DSUB-REQ-017`；UI §6）。
- 缓存：前端在弹窗会话内缓存本接口结果，切换 Schema 不重复请求；加载失败显示明确错误并提供“重试加载”（`DSUB-REQ-070`）。
- 错误：同 §4.4（`40320`/`40322`/`40340`/`40341`）。

### 4.6 `POST /api/subscriptions` — 新增订阅

用途：新增订阅记录（`DSUB-REQ-081~087`）。

请求体：

```json
{
  "dataSubDesc": "机构A到机构B全量订阅",
  "dataFromSourceId": "S01",
  "dataToSourceIds": ["T01"],
  "sourceSelectionMode": "REPLACE",
  "sourceTables": [
    { "schemaName": "SCHEMA_A", "tableName": "TABLE_1" },
    { "schemaName": "SCHEMA_A", "tableName": "TABLE_2" }
  ]
}
```

字段说明：

| 字段 | 类型 | 必填 | 校验 |
|---|---|---|---|
| dataSubDesc | string | 是 | 非空；≤255（与数据库字段长度一致，`DSUB-REQ-022`） |
| dataFromSourceId | string | 是 | 恰好一个源库 ID（`DSUB-REQ-008/057`）；不得含英文逗号或英文句点（已批准点号规则） |
| dataToSourceIds | string[] | 是 | ≥1，去重（`DSUB-REQ-013/057`）；每个为目标库 ID，不得含英文逗号或英文句点 |
| sourceSelectionMode | enum | 否 | **新增恒为 `REPLACE`**：该字段对 POST 可选，省略即按 `REPLACE` 处理；新增 DTO 不接受 `PRESERVE`。为保持契约唯一，前端保存新增时始终按 REPLACE 语义提交（UI §5） |
| sourceTables | SourceTableInput[] | 是 | ≥1（`DSUB-REQ-057`）；每项仅 `schemaName` + `tableName`，不重复携带源库 ID（`sourceTables` 唯一类型为 `SourceTableInput[]`，见 DESIGN §4.2）；后端以 `dataFromSourceId` 为唯一源库校验并拼成数据库格式 `DATA_SOURCE_ID.Schema.表名`；schemaName/tableName 保持源 Oracle 原始大小写；数据源 ID、Schema 名、表名不得含英文逗号或组件内部英文句点（`DSUB-REQ-017`）；重复判定用 `(schemaName, tableName)` 精确组合（`DSUB-REQ-017/018`） |

> `sourceTables` 唯一类型：保存请求中 `sourceTables` 只能是 `SourceTableInput[]`（`{schemaName, tableName}`）。响应展示使用 `tablesBySchema` 等结构，不得把保存请求的 `sourceTables` 与展示字符串混为同一类型。

后端最终校验（前端做基础必填/格式校验，最终以后端为准，`DSUB-REQ-081`）：

1. 描述非空与长度（`40310`/`40311`）；
2. 恰好一个启用且类别为 SOURCE 的源库（`40320`/`40322`）；
3. 至少一个启用且类别为 TARGET 的目标库（`40321`/`40323`）；
4. 至少一张有效源表（`40314`）；
5. 结构化源表属于所选源库、Schema/表存在且账号可访问、格式正确、名称不含英文逗号或组件内部英文句点、记录内不重复（`40315`/`40316`/`40317`/`40330`/`40331`）；
6. 目标库记录内不重复（`40318`）；
7. 允许跨记录重复订阅，不做跨行唯一限制（`DSUB-REQ-009/019`）。

数据源/表校验通过一次源库连接按 Schema 批量完成（`DSUB-REQ-084`；DESIGN §6.4）。

**唯一失效项结构（validationErrors）**：批量校验失败时，不再使用“message 汇总或其他方式”等候选契约。响应统一为 HTTP 200 + `code=40300 SUBSCRIPTION_VALIDATION_FAILED`，`data` 携带结构化 `validationErrors`（每项 `{ errorCode, field, name, message }`），一次列全具体失效项：

```json
{
  "code": 40300,
  "message": "存在 2 个校验失败项，请修正后重试",
  "data": {
    "validationErrors": [
      { "errorCode": "40315", "field": "sourceTables", "name": "SCHEMA_A.TABLE_X", "message": "源表输入结构或 Schema/表名格式非法" },
      { "errorCode": "40316", "field": "sourceTables", "name": "SCHEMA_A.TABLE_1", "message": "名称含协议保留字符（英文逗号或英文句点），不能用于订阅配置" }
    ]
  },
  "timestamp": "2026-08-30T10:00:00"
}
```

`validationErrors` 条目字段：`errorCode`（string，对应 §7 错误码）、`field`（string，`dataSubDesc` / `dataFromSourceId` / `dataToSourceIds` / `sourceTables`）、`name`（string，具体失效名称，如源表标识或目标库 ID）、`message`（string，用户可见文案）。前端逐条展示，用户修正后重试（`DSUB-REQ-085`）。

响应（成功）：

```json
{
  "code": 200,
  "message": "success",
  "data": { "dataSubId": "9f3f...32hex" },
  "timestamp": "2026-08-30T10:00:00"
}
```

- `dataSubId`：后端生成（§8.1 TBD-01 结论）：`@TableId(value = "DATA_SUB_ID", type = IdType.INPUT)` 专用实体 + Service 在 INSERT 前执行 `UUID.randomUUID().toString().replace("-", "")`（32 位无连字符 UUID，`VARCHAR2(32)` 容纳）；前端不感知、不生成（`DSUB-REQ-007`）。
- 事务：`@Transactional`；`INSERT` 受影响行数 = 1，否则 `50040`。
- 重复提交：前端按钮 loading（`DSUB-REQ-086`）；文档边界为“防止用户界面重复点击，但网络重试可能形成允许的重复记录；首期未设计请求幂等键”（DESIGN §5.5）。后端不得虚假声明新增天然幂等。

### 4.7 `GET /api/subscriptions/{dataSubId}/edit` — 编辑打开（回显）

用途：编辑回显原配置与已选 Schema/表（`DSUB-REQ-088/089/097`）；响应不包含 `versionToken`、指纹、快照版本或等效字段（`DSUB-REQ-097`，DESIGN §5.1）。

请求：`{dataSubId}` 路径参数。

响应：

```json
{
  "code": 200,
  "message": "success",
  "data": {
    "dataSubId": "9f3f...32hex",
    "dataSubDesc": "机构A到机构B全量订阅",
    "source": { "dataSourceId": "S01", "dataSourceOrg": "机构A", "status": "NORMAL" },
    "targets": [
      { "dataSourceId": "T01", "dataSourceOrg": "机构B", "status": "NORMAL" }
    ],
    "tablesBySchema": [
      { "schema": "SCHEMA_A", "tables": ["TABLE_1", "TABLE_2"] }
    ],
    "rawUnparseableTables": [],
    "sourceReachable": true,
    "sourceTableCheck": "CHECKED",
    "invalidTables": []
  },
  "timestamp": "2026-08-30T10:00:00"
}
```

字段说明：

| 字段 | 类型 | 说明 |
|---|---|---|
| dataSubId / dataSubDesc / source / targets / tablesBySchema / rawUnparseableTables | — | 回显内容；`source`/`targets` 的 `status` 标记停用/不存在（`DSUB-REQ-094`）；`tablesBySchema` 供前端恢复勾选与浅蓝背景（`DSUB-REQ-089`）；不可解析 token 分区回显并带警告 |
| sourceReachable | boolean | 编辑打开时源 Oracle 是否可达（best-effort 探测；断连时 false） |
| sourceTableCheck | enum | `CHECKED` / `UNREACHABLE` / `SKIPPED`：已与源 Oracle 核对表有效性 / 源库不可达 / 未核对 |
| invalidTables | string[] | 原选择中已删除或不可访问的表（`DSUB-REQ-091`“异常已选表”），非空时前端显示警告且不得静默取消 |

- 源 Oracle 探测为 best-effort：连接失败不阻塞打开，进入有限编辑模式（`DSUB-REQ-093`）；前端据此决定可编辑字段范围（UI §7.3）。
- 多源库异常记录不提供编辑入口，前端不调用本接口（`DSUB-REQ-095`；后端返回 `40350`）。
- 遗留字段不回传（`DSUB-REQ-051`；编辑时后端自动保持原值，`DSUB-REQ-023/024/025/096`）。
- 错误：记录不存在 → `40430`；多源库异常 → `40350`。

### 4.8 `PUT /api/subscriptions/{dataSubId}` — 编辑保存

用途：编辑保存（`DSUB-REQ-090~096/098`）。

请求体：

```json
{
  "dataSubDesc": "机构A到机构B全量订阅",
  "dataFromSourceId": "S01",
  "dataToSourceIds": ["T01"],
  "sourceSelectionMode": "REPLACE",
  "sourceTables": [
    { "schemaName": "SCHEMA_A", "tableName": "TABLE_1" },
    { "schemaName": "SCHEMA_A", "tableName": "TABLE_2" }
  ]
}
```

字段说明：

| 字段 | 类型 | 必填 | 说明 |
|---|---|---|---|
| dataSubDesc | string | 是 | 同新增校验 |
| dataFromSourceId | string | 是 | 同新增校验；`PRESERVE` 模式要求与当前记录完全一致 |
| dataToSourceIds | string[] | 是 | 同新增校验 |
| sourceSelectionMode | enum | 是 | `PRESERVE` / `REPLACE`（语义见下，四份文档一致） |
| sourceTables | SourceTableInput[] | REPLACE 必填 / PRESERVE 不提交 | `REPLACE` 必须提交结构化 `SourceTableInput[]`；`PRESERVE` 不提交也不使用该字段 |

`sourceSelectionMode` 语义（DESIGN §3.4，四份文档一致）：

- `PRESERVE`（有限编辑，源表未变）：不提交 `sourceTables`；后端要求请求 `dataFromSourceId` 与当前记录完全一致；UPDATE **不设置 `DATA_SOURCE_TABLE`**，原始 CLOB 逐字保留（DATABASE.md §4.4）。仅允许修改订阅描述与目标库（`DSUB-REQ-093`）。
- `REPLACE`（源表变更）：必须提交结构化 `sourceTables`；必须成功连接源 Oracle 并按 Schema 批量校验（`DSUB-REQ-092`）；UPDATE 写入重新构造的完整表清单。
- 后端不能只相信前端模式：必须结合当前记录和请求字段验证模式合法性（DESIGN §5.2）。
- 如果原源库已停用/不存在或原配置含保留字符无效项，仍必须按已批准需求修复后才能保存，不能借 `PRESERVE` 绕过（`DSUB-REQ-094`）。
- 断连且 `PRESERVE` 时仅允许描述和目标库变化；`DATA_SOURCE_TABLE` 原始内容不因解析/排序被意外重写（DESIGN §3.5）。

- 保存流程：普通读取当前记录完成业务校验（**不锁行**、不比较打开时与保存时的内容）→ 按 `DATA_SUB_ID` 普通 `UPDATE`（DESIGN §5.2）。多个页面用户或人工数据库操作交叉时不提供并发冲突检测，最后一次成功写入生效（`DSUB-REQ-098/099`）。
- 写入语义：`DATA_SUB_ID`、`INSERT_TIME` 保持不变；`UPDATE_TIME` 更新为数据库当前时间；遗留字段保持原值不主动清空（`DSUB-REQ-096`；DATABASE.md §4.4）。
- 事务：`@Transactional`；`UPDATE` 受影响行数必须 = 1（0 行 → `40430`）。
- 响应：`data` 为 `null`，成功 `code=200`。
- 失败时一次性列出具体失效项，使用 §4.6 定义的 `validationErrors` 结构（`DSUB-REQ-085`）。

### 4.9 `GET /api/subscriptions/{dataSubId}/delete-preview` — 删除预览

用途：列表点击“删除”后，先获取删除确认所需的普通只读确认信息（`DSUB-REQ-102`；DESIGN §3.7）。

请求：`{dataSubId}` 路径参数。

响应：

```json
{
  "code": 200,
  "message": "success",
  "data": {
    "dataSubId": "9f3f...32hex",
    "dataSubDesc": "机构A到机构B全量订阅",
    "source": { "dataSourceId": "S01", "dataSourceOrg": "机构A", "status": "NORMAL" },
    "schemaCount": 2,
    "tableCount": 128,
    "targets": [
      { "dataSourceId": "T01", "dataSourceOrg": "机构B", "status": "NORMAL" }
    ],
    "warnings": []
  },
  "timestamp": "2026-08-30T10:00:00"
}
```

字段说明：

| 字段 | 类型 | 说明 |
|---|---|---|
| dataSubId / dataSubDesc | string | 订阅 ID / 描述 |
| source | SourceRefVO | 源库展示（`status` 标记停用/不存在） |
| schemaCount | number | 源表按 Schema 分组后 Schema 数（只统计至少选中一张表的 Schema） |
| tableCount | number | 源表数量：`DATA_SOURCE_TABLE` 非空 token 总数（含不可解析历史 token，与列表“共 N 张”口径一致，DESIGN §4.5） |
| targets | TargetRefVO[] | 目标库展示 |
| warnings | string[] | 异常提示（已停用/不存在数据源等） |

- 本接口**只读取配置库，不连接源 Oracle**（`DSUB-REQ-045/068`）；**不锁行、不返回版本令牌**；预览结果不构成删除时的一致性保证（`DSUB-REQ-103`，DESIGN §5.1/§5.3）。
- 多源库异常记录拒绝预览（`DSUB-REQ-100`；后端返回 `40353`）。
- 记录不存在 → `40430`。
- 删除流程闭环：点击列表“删除”先调本接口，成功后再展示确认弹窗；用户确认后 `DELETE /api/subscriptions/{dataSubId}` 按 `DATA_SUB_ID` 主键直接物理删除，不比较预览后记录是否变化（`DSUB-REQ-103`；UI §7.5，DESIGN §3.7）。

### 4.10 `DELETE /api/subscriptions/{dataSubId}` — 物理删除

用途：按主键物理删除（`DSUB-REQ-100~105`）。

请求：仅路径参数 `{dataSubId}`，**无 JSON 请求体**，不携带版本令牌或其他并发字段（`DSUB-REQ-103`；前端不得再使用 `axios.delete(url, { data: { versionToken } })`）。

- 只允许正常单源库记录删除；多源库异常记录无删除入口（`DSUB-REQ-100`；后端对异常记录返回 `40351`）。
- 物理删除：`DELETE WHERE DATA_SUB_ID = ?`，不得把 `FG_ACTIVE` 更新为 `0`（`DSUB-REQ-021/101`；DATABASE.md §4.5）。
- 删除流程：普通读取当前记录完成业务防护（记录存在、非多源库异常；**不锁行**）→ 按 `DATA_SUB_ID` 普通 `DELETE`（DESIGN §5.3）。预览后记录被其他页面或人工修改，确认删除仍直接按主键删除，不比较、不拒绝（`DSUB-REQ-103`）。
- 事务：`@Transactional`；受影响行数必须 = 1；0 行 → `40430`（“订阅记录不存在或已被删除”，`DSUB-REQ-104`）。
- 响应：`data` 为 `null`，成功 `code=200`。
- 前端：删除前二次确认（展示描述/源库/Schema 数/表数/目标库/不可恢复/重启生效，`DSUB-REQ-102`）；成功后刷新列表并提示重启后生效（`DSUB-REQ-105`）。

## 5. 查询语义汇总

| 规则 | 接口 | 实现 |
|---|---|---|
| 候选仅 `FG_ACTIVE=1` 且类别匹配 | §4.1 | `UPPER(DATA_SOURCE_CATEGORY)` 匹配（§8 TBD-02） |
| 多个源库条件之间 `OR` | §4.2 | 服务层 Java：`DATA_FROM_SOURCE_ID` token 匹配，任一命中 |
| 多个目标库条件之间 `OR` | §4.2 | 服务层 Java：`DATA_TO_SOURCE_ID` token 匹配，任一命中 |
| 源库组与目标库组之间 `AND` | §4.2 | 服务层先分别计算源库组/目标库组 OR，再组间 AND，见 DATABASE.md §4.1 |
| 首次进入无条件查询全部启用订阅 | §4.2 | 无 `sourceIds`/`targetIds` |
| 查询不分页 | §4.2 | 一次返回全部 |
| “重置”是纯前端清空表单，不调用查询 API | §4.2 | 无后端接口 |
| 普通 ID（不含逗号）完整 token 字面精确匹配 | §4.2 | Java `String.equals`，禁止 `%ID%`/LIKE/正则，见 DATABASE.md §4.1 |
| 含逗号 ID 历史兼容可能匹配 | §4.2 | `queryAtomic` 是 `storedAtomic` 的连续子序列，返回可能匹配集合并给出 `queryWarnings`，见 DATABASE.md §4.1 |
| 默认按 `NVL(UPDATE_TIME, INSERT_TIME) DESC` | §4.2 | 单一 SQL `ORDER BY NVL(...) DESC`，见 DATABASE.md §4.1 |

## 6. 与数据库字段映射

| API 字段 | 数据库字段 | 读写 |
|---|---|---|
| dataSubId | `CDC_DATA_SUBSCRIBE.DATA_SUB_ID` | 新增后端生成；查询返回；编辑/删除条件 |
| dataSubDesc | `DATA_SUB_DESC` | 读写 |
| dataFromSourceId | `DATA_FROM_SOURCE_ID` | 读写（单值，异常记录为多值） |
| dataToSourceIds（数组） | `DATA_TO_SOURCE_ID`（英文逗号拼回） | 读写 |
| sourceTables（`SourceTableInput[]`） | `DATA_SOURCE_TABLE`（后端以 `dataFromSourceId` 拼成 `DATA_SOURCE_ID.Schema.表名`，英文逗号拼回） | 读写；`PRESERVE` 模式不写（DATABASE.md §4.4） |
| tablesBySchema / rawUnparseableTables | `DATA_SOURCE_TABLE`（解析后返回） | 读 |
| source.dataSourceOrg / targets[].dataSourceOrg | `CDC_DATA_SOURCE.DATA_SOURCE_ORG` | 读（映射；最小字段投影见 DATABASE.md §4.6） |
| sourceSelectionMode | 非数据库字段 | 仅请求语义：`PRESERVE` 决定不写 `DATA_SOURCE_TABLE` |
| insertTime / updateTime | `INSERT_TIME` / `UPDATE_TIME` | 读写（规则见 DATABASE.md §3） |
| —（遗留字段不暴露） | `DATA_SOURCE_COMMENT` / `DATA_TARGET_TABLE` / `DATA_TARGET_COMMENT` | 新增写 NULL；编辑保持原值 |
| —（启用标志不暴露） | `FG_ACTIVE` | 新增固定写 `'1'`；列表只查 `'1'`；不提供启停 |

- 本 Feature 保存请求不包含数据源类别字段，不写 `CDC_DATA_SOURCE.DATA_SOURCE_CATEGORY`（§8 TBD-02）。

## 7. 业务错误码

使用项目 `BusinessException(code, message)`，HTTP 200 + `fail(code, message)`。错误码集中在 `subscription/exception/SubscriptionErrorCode.java`，独立于 `DataSourceErrorCode` / `ServerConfigErrorCode`。

共 **25 个**业务错误码：

| 错误码 | 名称 | 用户可见消息 | 触发 |
|---|---|---|---|
| 40300 | SUBSCRIPTION_VALIDATION_FAILED | 存在 N 个校验失败项，请修正后重试 | 批量校验存在一个或多个失效项（`data` 携带结构化 `validationErrors`，见 §4.6） |
| 40310 | DESC_EMPTY | 订阅描述不能为空 | 保存时描述为空 |
| 40311 | DESC_TOO_LONG | 订阅描述超过 255 字符上限 | 保存时描述超长 |
| 40312 | SOURCE_REQUIRED | 必须且只能选择一个源库 | 源库缺失/多个 |
| 40313 | TARGET_REQUIRED | 必须至少选择一个目标库 | 目标库为空 |
| 40314 | SOURCE_TABLE_REQUIRED | 必须至少选择一张源表 | 源表为空 |
| 40315 | INVALID_TABLE_FORMAT | 源表输入结构或 Schema/表名格式非法 | 源表输入结构或 Schema/表名格式非法（保存请求唯一契约是结构化 `SourceTableInput{schemaName,tableName}`，完整 `DATA_SOURCE_ID.Schema.表名` 由后端以 `dataFromSourceId` 拼装，不得提示请求应为完整源库ID.Schema.表名） |
| 40316 | NAME_CONTAINS_COMMA_OR_DOT | 数据源ID、Schema名或表名不能包含英文逗号或组件内部英文句点 | 标识含协议保留字符 |
| 40317 | DUPLICATE_TABLE_WITHIN_RECORD | 记录内存在重复源表 | 同一记录重复表标识（`(schemaName, tableName)` 组合重复） |
| 40318 | DUPLICATE_TARGET_WITHIN_RECORD | 记录内存在重复目标库 | 同一记录重复目标库 |
| 40320 | SOURCE_NOT_FOUND_OR_INACTIVE | 源库不存在或已停用 | 源库校验失败 |
| 40321 | TARGET_NOT_FOUND_OR_INACTIVE | 目标库不存在或已停用 | 目标库校验失败 |
| 40322 | SOURCE_CATEGORY_MISMATCH | 源库类别不正确 | 数据源类别非 SOURCE |
| 40323 | TARGET_CATEGORY_MISMATCH | 目标库类别不正确 | 数据源类别非 TARGET |
| 40330 | TABLE_NOT_FOUND_IN_SOURCE | 源表中存在当前源库不存在的表 | 表校验失败 |
| 40331 | TABLE_NOT_ACCESSIBLE | 源表中存在当前账号不可访问的表 | 表访问校验失败 |
| 40340 | SOURCE_CONNECTION_FAILED | 源库连接失败（脱敏分类消息） | 元数据访问/校验连接失败 |
| 40341 | SCHEMA_LOAD_FAILED | Schema/表加载失败（脱敏分类消息） | Schema/表加载失败 |
| 40350 | ANOMALY_NOT_EDITABLE | 多源库异常记录不支持编辑 | 对异常记录编辑 |
| 40351 | ANOMALY_NOT_DELETABLE | 多源库异常记录不支持删除 | 对异常记录删除 |
| 40352 | ANOMALY_NOT_VIEWABLE | 多源库异常记录不支持查看 | 对异常记录查看详情 |
| 40353 | ANOMALY_NOT_PREVIEWABLE | 多源库异常记录不支持删除预览 | 对异常记录删除预览 |
| 40430 | SUBSCRIPTION_NOT_FOUND | 订阅记录不存在或已被删除 | 详情/编辑/删除预览/保存/删除时记录不存在（`DSUB-REQ-104`） |
| 50040 | SAVE_FAILED | 保存失败 | INSERT/UPDATE 受影响行数异常 |
| 50041 | DELETE_FAILED | 删除失败 | DELETE 受影响行数异常 |

- 多源库异常查看/编辑/删除预览/删除的错误码命名准确区分：查看 `40352`、编辑 `40350`、删除预览 `40353`、删除 `40351`，不得用 `ANOMALY_NOT_EDITABLE` 表示查看错误。
- 批量校验失败使用唯一结构化 `validationErrors` 模型（`40300`，见 §4.6）；单点业务错误仍返回对应单码（HTTP 200 + `fail(code, message)`）。
- 源库连接/加载失败消息复用 `ConnectionTester` 脱敏分类，绝不包含密码、连接串、堆栈（DESIGN §7.2）。

## 8. TBD 设计草案结论（闭环）

### 8.1 TBD-01：`DATA_SUB_ID` 生成方式与 MyBatis-Plus ID 策略（设计草案结论，R1 修正依据）

- 依据：MyBatis-Plus 版本为 `3.5.3.1`（`backend/pom.xml`）；`MyBatisPlusConfig.java` 未配置全局 id-type，此时 `DbConfig.idType` 默认是 `ASSIGN_ID`。`@TableId` 未显式指定 IdType 时跟随全局配置；`IdType.NONE` 表示“跟随全局配置”，**不是“默认不自动生成”**。`largescreen/stats/entity/DataSubscribeEntity.java` 现有 `@TableId("DATA_SUB_ID")` 未指定 IdType，在大屏场景由全局 `ASSIGN_ID` 规则处理；本 Feature 新增时主键必须由后端显式生成，因此**不得**沿用无 IdType 的写法。`CDC_DATA_SUBSCRIBE.DATA_SUB_ID` 为 VARCHAR2(32) NOT NULL 主键，无默认值、无触发器、无序列（已批准数据库基线）；项目内存在 `UUID.randomUUID().toString()` 先例（`BatchTransactionExecutor`）。
- 结论：**subscription 模块专用实体**（不修改现有大屏实体）使用：

  ```java
  @TableId(value = "DATA_SUB_ID", type = IdType.INPUT)
  private String dataSubId;
  ```

  - `IdType.INPUT` 表示主键由调用方（Service）显式设置，避免跟随全局 `ASSIGN_ID`；
  - Service 在 INSERT 前执行 `UUID.randomUUID().toString().replace("-", "")`（32 位无连字符十六进制 UUID，满足 `VARCHAR2(32)`）；
  - 专用 INSERT 使用已设置 ID（DATABASE.md §4.3）；
  - 数据库主键约束 `PK_CDC_DATA_SUBSCRIBE` 是最终唯一性防线，重复插入抛主键冲突并回滚；
  - 前端不感知、不生成 ID（`DSUB-REQ-007`）；
  - 不新增数据库序列、触发器或默认值。
- 测试方式：单元测试断言 ID 长度为 32、为十六进制格式、同一调用不重复；集成/异常路径测试构造已存在 ID 验证主键冲突被正确拒绝（设计阶段仅定义测试边界，不运行测试）。
- 引用：DATABASE.md §4.3、DESIGN.md §2.2。

### 8.2 TBD-02：源库/目标库类别匹配规则（设计草案结论，R1 收紧）

- 依据：`CDC_DATA_SOURCE.DATA_SOURCE_CATEGORY` VARCHAR2(30)，数据库注释“取值 source/target，大小写都行（目标规则为统一大写，程序已做兼容）”；真实代码：`DataSourceServiceImpl.targetOptions()` 用 `UPPER(DATA_SOURCE_CATEGORY) = 'TARGET'` + `FG_ACTIVE='1'`；`DataSourceNamingStrategyServiceImpl` 第 216 行同规则；`requireTargetRecord` 用 `"TARGET".equalsIgnoreCase(...)`；`assertTypeCompatible` 用 `"SOURCE".equalsIgnoreCase(...)`；`DataSourceCategoryEnum.isValid` 仅接受大写 `SOURCE/TARGET`，`normalize` 统一大写；`DataSourceServiceImpl.list()` 不按类别过滤（数据源管理列表展示全部启用数据源）；数据画像：`target=10, SOURCE=5, source=4`（大小写混用为当前事实，目标规则统一大写）。
- 结论（候选与保存校验 SQL 一处规则，内存比较一处规则）：
  - **候选查询与保存校验（SQL）**：源库 `FG_ACTIVE='1' AND UPPER(DATA_SOURCE_CATEGORY)='SOURCE'`；目标库 `FG_ACTIVE='1' AND UPPER(DATA_SOURCE_CATEGORY)='TARGET'`。`options` 候选、保存校验使用同一规则；SQL 全部使用 `UPPER(...)`，不混用 `UPPER(TRIM(...))`（当前数据事实中类别值无首尾空格场景，现有代码亦用 `UPPER`）。
  - **内存比较（读取存量映射）**：对已读记录的类别字段用 `equalsIgnoreCase` 比较（`SOURCE` / `TARGET`），兼容存量大小写混用（`requireTargetRecord` 既有模式）。
  - **本 Feature 不写类别**：subscription 保存请求不包含类别字段，不写 `CDC_DATA_SOURCE.DATA_SOURCE_CATEGORY`。
  - 空值/首尾空格：空值不匹配任何类别（`UPPER(NULL)` 不为任何值，候选查询天然排除）；SQL 校验统一 `UPPER(...)` 口径。
  - 该规则同时用于：`DSUB-REQ-033/059/064` 候选、`DSUB-REQ-082` 保存校验。
- 引用：DATABASE.md §4.6、DESIGN.md §6.1。

---

*文档状态：`DRAFT_PENDING_USER_REVIEW`。本文件为接口设计基线草案（R4 定向修订版，R4-R1 完成状态元数据定向收口），未获正式复审批准，不代表设计已批准、功能已实现或验收通过；本文件 API 业务设计在 R4 中零语义变化，但作为四文档设计基线的一部分，当前统一等待 ChatGPT 对 R4-R1 结果提交正式复审；接口尚未实现。*
