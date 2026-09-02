# 数据同步进度 Feature 接口契约草案（API）

## 1. 元数据与状态

| 项目 | 值 |
|---|---|
| Feature 中文名称 | 数据同步进度 |
| Feature 标识 | `topic-offset` |
| 目标文档 | `docs/features/topic-offset/API.md` |
| 文档状态 | `DRAFT_PENDING_USER_REVIEW`（接口契约草案，等待 ChatGPT/用户复审） |
| 设计任务编号 | `TOPIC-OFFSET-DESIGN-001` |
| 依据 | `REQUIREMENTS.md`（`APPROVED`）、`ACCEPTANCE.md`（`APPROVED`）、`DATABASE.md`（`APPROVED`）、`DESIGN.md`（本套草案） |
| 起始基线提交 | `a9916eaabc3187e4273d336343fe687c2e55fabf` |
| 创建日期 | 2026-09-02 |

本契约只定义**只读查询接口**；不包含任何新增/编辑/删除/Offset 重置/重新消费/跳过/从头消费/导出/Kafka 写接口（TOFF-REQ-008/011/122）。

## 2. 接口总览

| # | 方法 | 路径 | 用途 | 对应 |
|---|---|---|---|---|
| 1 | GET | `/api/monitor/topic-offset/offsets` | 按条件分页查询断点列表（含 total、unparseableTotal、行映射） | 首次进入/条件查询/翻页/手工刷新/自动刷新/返回恢复均调此接口 |
| 2 | GET | `/api/monitor/topic-offset/candidates` | 读取最新候选配置（客户端/源库/目标库，含停用） | 下拉候选与最新配置映射 |

- 前缀遵循仓库既有 Controller 直写 `/api/...` 惯例（如 `/api/job-failure`）。
- 断点表唯一访问在接口 1 的只读 SQL；配置表唯一访问在接口 1（行映射）与接口 2（候选）。均只 `SELECT`。

## 3. 通用约定

### 3.1 统一响应信封（沿用 `ApiResponse<T>`）

```json
{ "code": 200, "message": "success", "data": { }, "timestamp": "2026-09-02T10:00:00" }
```

- `code=200` 表示成功；业务错误 HTTP 仍为 200，`code` 取非 200 业务码，`message` 为可展示消息（沿用 `GlobalExceptionHandler`/`BusinessException`）。错误码见 §7。
- 全字段默认 `non_null` 序列化：第一版无值的字段以 `null` 明确表达（Kafka 三列），不输出 0（TOFF-REQ-066）。

### 3.2 数值与时间均为字符串

- `NEXT_OFFSET`、未来 Kafka 末端位置、待消费数量在**接口链路必须为 JSON 字符串**（TOFF-REQ-076、TOFF-REQ-078、TOFF-REQ-080），禁止作为 JSON number 输出；示例见 §4 与 §6。
- 断点更新时间输出 `yyyy-MM-dd HH:mm:ss` 字符串，值为 Oracle `DATE` 的存库钟面时间，不做时区换算（TOFF-REQ-084、TOFF-REQ-124）。
- 行唯一标识：`SERVER_ID + KAFKA_TOPIC`（TOFF-REQ-083），由两个字段共同表达；接口不提供“序号”业务键。

### 3.3 鉴权现状边界

与仓库其他 `/api` 接口一致：沿用平台既有登录/网关鉴权方式，本设计不新增鉴权机制。

### 3.4 只读与参数

- 两个接口都只读、无副作用；请求不产生任何写库/Kafka/外呼。
- 多值用**同一查询参数名重复**编码：`clientId=A&clientId=B`；前端用 `paramsSerializer`（先例 `src/api/subscription.ts`）。
- 全部参数可选；不带任何结构化条件即“全部 + 空表名”缺省查询（TOFF-REQ-023/024/034）。

## 4. 接口明细

### 4.1 `GET /api/monitor/topic-offset/offsets` — 分页查询断点列表

用途：按已生效条件返回第 `pageNum` 页记录、`total`、`unparseableTotal`，并按当次最新配置完成行映射（TOFF-REQ-052/092/020）。首次查询/条件查询/翻页/手工刷新/自动刷新/返回恢复统一调用，语义一致。

请求参数（query）：

| 参数 | 类型 | 必填 | 默认 | 说明 |
|---|---|---|---|---|
| `clientId` | string（可重复） | 否 | 无 | 解析后第 1 段客户端 ID 精确匹配（不转大小写）；缺省=“全部”（TOFF-REQ-027） |
| `sourceId` | string（可重复） | 否 | 无 | 解析后第 2 段源库 ID 精确匹配；缺省=“全部” |
| `targetId` | string（可重复） | 否 | 无 | 解析后第 5 段目标库 ID 精确匹配；缺省=“全部” |
| `tableName` | string | 否 | 空 | 表名，不区分大小写包含匹配第 4 段；提交前已去首尾空格；`%`/`_`/`\` 按字面（TOFF-REQ-028~031） |
| `pageNum` | int | 否 | 1 | 页码，≥1 |

约束与校验：

- 单维 `clientId/sourceId/targetId` 传入项数 ≤50，超出 `40003`。
- `tableName` 去除首尾空格后长度 ≤200，超出 `40002`。
- `pageNum` 非整数或 <1，返回 `40001`。
- 三个 ID 维度都为空 **且** `tableName` 为空 → 无结构化条件：结果包含无法解析 Topic 行（TOFF-REQ-032）。
- 任一 ID 维度非空或 `tableName` 非空 → 结构化条件生效：无法解析 Topic 不参与匹配（TOFF-REQ-033）。
- 页大小固定服务端 150，不接受分页规格参数（TOFF-REQ-089）；响应 `pageSize` 恒为 150。

响应 `data`：`TopicOffsetPageResult`

```json
{
  "code": 200,
  "message": "success",
  "data": {
    "pageNum": 1,
    "pageSize": 150,
    "total": 8,
    "pages": 1,
    "unparseableTotal": 0,
    "records": [
      {
        "serverId": "Server001",
        "rawTopic": "hosp-012.112-source-19c.SPT_HIS_2023.OPT_FEE.company-target-doris-v4",
        "nextOffset": "2357580",
        "updatedAt": "2026-08-17 17:49:01",
        "kafkaEndOffset": null,
        "pendingCount": null,
        "consumeLag": null,
        "parseable": true,
        "parsed": {
          "clientId": "hosp-012",
          "sourceId": "112-source-19c",
          "schema": "SPT_HIS_2023",
          "table": "OPT_FEE",
          "targetId": "company-target-doris-v4"
        },
        "mapping": {
          "client": { "state": "NOT_FOUND", "id": "hosp-012" },
          "source": { "state": "ACTIVE", "id": "112-source-19c", "org": "源库112" },
          "target": { "state": "INACTIVE", "id": "company-target-doris-v4", "org": "Doris目标库" }
        }
      },
      {
        "serverId": "Server001",
        "rawTopic": "offline.malformed.topic",
        "nextOffset": "42",
        "updatedAt": "2026-08-17 18:00:00",
        "kafkaEndOffset": null,
        "pendingCount": null,
        "consumeLag": null,
        "parseable": false,
        "parsed": null,
        "mapping": null
      }
    ]
  },
  "timestamp": "2026-09-02T10:00:00"
}
```

`data` 字段字典：

| 字段 | 类型 | 说明 |
|---|---|---|
| `pageNum` | int | 当前页 |
| `pageSize` | int | 恒 150 |
| `total` | int | 过滤后全集记录数（TOFF-REQ-092） |
| `pages` | int | 总页数，`total=0` 时为 0 |
| `unparseableTotal` | int | 过滤后全集中无法解析行数（TOFF-REQ-020）；无结构化条件=全表无法解析数，有结构化条件=0（TOFF-REQ-033） |
| `records` | array | 当前页行（≤150） |

`records[]` 行字段：

| 字段 | 类型 | 说明 |
|---|---|---|
| `serverId` | string | 原样 `SERVER_ID`（TOFF-REQ-085） |
| `rawTopic` | string | 原样 `KAFKA_TOPIC`（权威原值，用于悬浮，TOFF-REQ-012/018） |
| `nextOffset` | **string** | `NEXT_OFFSET` 十进制字符串（TOFF-REQ-076、TOFF-REQ-080；无千分位） |
| `updatedAt` | string | `yyyy-MM-dd HH:mm:ss`（TOFF-REQ-084；DB 钟面时间，无时区换算） |
| `kafkaEndOffset` | string\|null | 第一版恒 `null`（Kafka 未接入；未来为字符串，绝不显示 0，TOFF-REQ-064/066/068/076） |
| `pendingCount` | string\|null | 第一版恒 `null`（待消费数量未来口径；TOFF-REQ-069、TOFF-REQ-073、TOFF-REQ-074、TOFF-REQ-078） |
| `consumeLag` | string\|null | 第一版恒 `null`（消费延迟未来口径；TOFF-REQ-070、TOFF-REQ-075） |
| `parseable` | boolean | Topic 是否严格 5 段解析成功 |
| `parsed` | object\|null | 成功时为五段对象（字段见下）；失败为 `null` |
| `mapping` | object\|null | 成功时为三端映射；失败为 `null` |

`parsed` 对象（可解析行，TOFF-REQ-014/054）：`clientId`/`sourceId`/`schema`/`table`/`targetId` 均为 string，分别对应第 1/2/3/4/5 段。`parsed.table` 是表名过滤的判定段（TOFF-REQ-028）。失败行 `parsed=null` 表示**不猜测任何客户端/源库/Schema/表名/目标库**（TOFF-REQ-015/017/062）。

`mapping` 对象（可解析行）：`client`/`source`/`target` 三个映射引用，结构如下（TOFF-REQ-055~059）：

| 字段 | 类型 | 说明 |
|---|---|---|
| `state` | string | `ACTIVE`=存在且启用；`INACTIVE`=存在但停用（FG_ACTIVE≠'1'）；`NOT_FOUND`=配置中不存在该 ID |
| `id` | string | 该段解析出的原始 ID（`NOT_FOUND` 时用于展示原值，TOFF-REQ-058） |
| `org` | string\|null | 仅 `source/target` 且存在时有；`DATA_SOURCE_ORG`（可为空，空则前端显示“未定义名称”，TOFF-REQ-059）。`client` 引用无 `org`（列表只显示客户端 ID） |
| `desc` | string\|null | 仅 `client` 引用携带；候选标签悬浮用（TOFF-REQ-047），行内不使用 |

### 4.2 `GET /api/monitor/topic-offset/candidates` — 候选配置

用途：返回当次最新候选，供三个多选下拉（含停用项）与“ID（配置不存在）”差集判断（TOFF-REQ-040~046/051/052/053）。每次首次/条件查询/翻页/刷新/返回页面都可调用以保持最新（TOFF-REQ-052）。

请求参数：无。

响应 `data`：`CandidateGroup`

```json
{
  "code": 200,
  "message": "success",
  "data": {
    "clients": [
      { "id": "hosp-001", "desc": "市一医院HIS", "active": true },
      { "id": "hosp-002", "desc": "", "active": false }
    ],
    "sources": [
      { "id": "112-source-19c", "org": "源库112", "active": true },
      { "id": "113-source-19c", "org": "", "active": false }
    ],
    "targets": [
      { "id": "company-target-doris-v4", "org": "Doris目标库", "active": true }
    ]
  },
  "timestamp": "2026-09-02T10:00:00"
}
```

`data` 字段字典：

| 字段 | 类型 | 说明 |
|---|---|---|
| `clients` | array | 全部 `CDC_CLIENT_MULTIPLE` 按 `CLIENT_ID` 升序（TOFF-REQ-041/050） |
| `sources` | array | 全部 `UPPER(DATA_SOURCE_CATEGORY)='SOURCE'` 数据源，按 ORG、ID 升序（TOFF-REQ-042/044） |
| `targets` | array | 全部 `UPPER(DATA_SOURCE_CATEGORY)='TARGET'` 数据源，按 ORG、ID 升序（TOFF-REQ-043/044） |

元素字段：

- 客户端 `{ id, desc, active }`：`id=CLIENT_ID`；`desc=CLIENT_DESC`（可为空）；`active=FG_ACTIVE=='1'`（TOFF-REQ-046）。
- 数据源 `{ id, org, active }`：`id=DATA_SOURCE_ID`；`org=DATA_SOURCE_ORG`（可为空，空则前端显示“未定义名称（ID）”，TOFF-REQ-048）；`active=FG_ACTIVE=='1'`。

约束与边界：

- **不过滤启用配置**：停用项仍在列表中，由前端标记“已停用”（TOFF-REQ-045/046）。
- **不从实际 Topic 提取候选**（TOFF-REQ-040）：候选仅来自两张配置表。
- 类别识别大小写不敏感（`SOURCE/source/target`，TOFF-REQ-044、TOFF-AC-044）；类别为空/其它不入对应列表。
- 相同 ID 只出现一次（两表主键唯一 + Map 去重防御，TOFF-REQ-049）。
- “全部”不在此接口返回，由前端固定置于下拉第一项（TOFF-REQ-050）。
- 本接口绝不含 `DATA_SOURCE_PASSWORD` 或任何凭据字段（`DATABASE.md` 安全约束）。

## 5. 查询语义汇总（offsets）

1. **先筛选**（TOFF-REQ-090）：无结构化条件保留全部（含无法解析）；有结构化条件仅匹配可解析行（TOFF-REQ-032/033）；同维“或”、跨维“且”（TOFF-REQ-026）；客户端/源库/目标库精确匹配不转大小写（TOFF-REQ-027）；表名不区分大小写包含第 4 段、首尾空格已去除（TOFF-REQ-028、TOFF-REQ-029、TOFF-REQ-030）；`%`/`_`/`\` 按字面（TOFF-REQ-031）。
2. **再固定排序**：`KAFKA_TOPIC ASC, SERVER_ID ASC`（TOFF-REQ-087/088）。
3. **再分页**：每页 150（TOFF-REQ-089），`total`/`unparseableTotal` 基于过滤后全集（TOFF-REQ-020/092）。
4. 只读：一次请求 = 一次断点表 `SELECT` + 配置表 `SELECT`，无任何 DML（TOFF-REQ-009/011/122）。

## 6. 字段字典与数据库映射

| API 字段 | 数据库来源 | 类型处理 |
|---|---|---|
| `serverId` | `CDC_TOPIC_OFFSET.SERVER_ID` | VARCHAR2 原样 |
| `rawTopic` | `CDC_TOPIC_OFFSET.KAFKA_TOPIC` | VARCHAR2 原样 |
| `nextOffset` | `CDC_TOPIC_OFFSET.NEXT_OFFSET` | NUMBER(19,0) → `TO_CHAR` 字符串 |
| `updatedAt` | `CDC_TOPIC_OFFSET.UPDATED_AT` | DATE → `TO_CHAR(...,'YYYY-MM-DD HH24:MI:SS')` |
| `clientId`（parsed） | 由 `rawTopic` 第 1 段解析 | 纯函数解析，不写库 |
| `sourceId`/`schema`/`table`/`targetId` | 第 2/3/4/5 段 | 同上 |
| 客户端映射 | `CDC_CLIENT_MULTIPLE`（CLIENT_ID/CLIENT_DESC/FG_ACTIVE） | 全部行；FG_ACTIVE='1'→active |
| 源库/目标库映射与候选 | `CDC_DATA_SOURCE`（DATA_SOURCE_ID/ORG/CATEGORY/FG_ACTIVE） | 全部行；UPPER(category) 分流；**不含密码列** |

- 行唯一：`SERVER_ID + KAFKA_TOPIC`（TOFF-REQ-083）。
- JSON 中所有 `NEXT_OFFSET`/未来 Kafka 数值示例均为字符串；Kafka 未接入字段示例为 `null`，与 UI 显示 `—` 的规则一致（TOFF-REQ-066）。

## 7. 业务错误码

沿用 `BusinessException(code,message)` + HTTP 200；模块错误码常量类 `TopicOffsetErrorCode`。范围沿用监控模块 40xxx 风格。

| 错误码 | 名称 | 用户可见消息（示例） | 触发 |
|---|---|---|---|
| 40001 | INVALID_PAGE_NUM | 页码必须为不小于 1 的整数 | `pageNum` 非法 |
| 40002 | TABLE_NAME_TOO_LONG | 表名长度不能超过 200 个字符 | `tableName` 去空格后超长 |
| 40003 | TOO_MANY_FILTER_IDS | 单个筛选维度最多选择 50 个 | 任一 ID 维度项数 >50 |

## 8. 只读约束与追踪

- 无任何写接口；断点/配置 Mapper 无写方法面（TOFF-REQ-011/122、TOFF-AC-005）；本契约不定义 Offset 重置/Kafka 接口（TOFF-REQ-123）。
- 覆盖验收要点：TOFF-AC-003/004/005/006（只读与第一版边界）、TOFF-AC-008（字符串 Offset/SERVER_ID 原样/时间仅格式化）、TOFF-AC-025~042（查询区与过滤）、TOFF-AC-043~053（候选与映射）、TOFF-AC-064/065（序号/行唯一）、TOFF-AC-077~081（Offset 字符串）、TOFF-AC-098（最近刷新时间为前端时间，本接口不返回该值）。
- 接口示例不包含任何数据库密码、连接串、Token 等敏感信息。

## 9. 变更记录

| 日期 | 变更 | 依据 |
|---|---|---|
| 2026-09-02 | 建立本功能接口契约草案（`DRAFT_PENDING_USER_REVIEW`）：2 个只读 GET 接口、请求/响应/字段字典、查询语义、错误码、只读追踪；未实现、未联调、未验收 | TOPIC-OFFSET-DESIGN-001（纯文档设计任务） |
