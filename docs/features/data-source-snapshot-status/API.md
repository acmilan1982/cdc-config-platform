# 源库快照状态 Feature 接口设计草案（API）

## 1. 元数据与文档状态

| 项目 | 值 |
|---|---|
| Feature 中文名称 | 源库快照状态 |
| Feature 标识 | `data-source-snapshot-status`（Feature 文档目录标识；任务代码前缀 `DATA-SOURCE-SNAPSHOT-STATUS`） |
| 所属模块 | 运行监控 |
| 既有路由 | `/monitor/data-source-state`（保持既有值不变；仅前端路由，与后端接口路径无关） |
| 目标文档 | `docs/features/data-source-snapshot-status/API.md`（接口设计草案） |
| 配套设计文档 | `DESIGN.md`（总设计入口）、`UI.md`（界面设计草案）、`DATABASE.md`（数据库查询设计草案） |
| 文档状态 | `DRAFT_PENDING_USER_REVIEW`（设计草案，尚未批准） |
| requirements_status | `APPROVED`（`docs/features/data-source-snapshot-status/REQUIREMENTS.md`，`DSS-REQ-001~065` 共 65 条） |
| acceptance_status | `APPROVED`（`docs/features/data-source-snapshot-status/ACCEPTANCE.md`，`DSS-AC-001~068` 共 68 条，全部 `NOT_RUN`） |
| design_status | `DRAFT_PENDING_USER_REVIEW`（本文件与 DESIGN.md / UI.md / DATABASE.md 均为草案，未批准） |
| implementation_status | `NOT_STARTED`（本设计不编码；当前仓库不存在下述任何接口实现，见 DESIGN §3） |
| acceptance_execution_status | `NOT_RUN`（本设计不执行验收；68 条 `DSS-AC-*` 全部保持 `NOT_RUN`） |
| pending_user_confirmation_count | `0`（与 DESIGN.md §15.2 一致；无待确认接口设计项） |
| 设计任务编号 | `DATA-SOURCE-SNAPSHOT-STATUS-DESIGN-BASELINE-001`（纯文档设计草案建立） |
| 创建日期 | 2026-09-05 |

接口身份：后端接口资源路径使用与前端源码目录一致的命名 `data-source-run-state`（`GET /api/monitor/data-source-run-state/list`），与用户可见名称“源库快照状态”解耦——后者只用于页面/菜单/路由元数据标题/面包屑（UI §10）；接口路径不是用户可见文案。

任务边界声明：本文件只定义**只读查询接口设计**，不定义任何写接口；不编码、不执行测试或验收、不访问数据库；接口与 JSON 契约是“待实现契约”，不是当前已实现的事实（DESIGN §3 已盘点当前后端无 RUN_STATE 访问链路）。

## 2. API 设计状态与通用约定

1. **方法约束**：本 Feature 只允许 `GET`。任何 POST/PUT/PATCH/DELETE 或带请求体的请求均不在设计范围；Controller 只暴露只读查询端点，不存在任何可触发数据库写入的方法路径（DSS-REQ-011/012/013、DESIGN §11、AC-010/011）。
2. **统一响应体**：沿用既有 `common/api/ApiResponse<T>`：
   ```json
   { "code": 200, "message": "success", "data": { ... }, "timestamp": "2026-09-05 14:20:33" }
   ```
   - `code=200`、`message="success"` 表示业务成功；`data` 为查询结果对象。
   - `timestamp` 为后端生成的服务端时间（以既有 `ApiResponse` 实现口径为准；本 Feature 不做新约定）。
3. **错误处理**（沿用既有 `GlobalExceptionHandler`）：
   - 业务错误（参数校验失败）经 `BusinessException` 以 **HTTP 200** + 业务错误体返回（见 §8），供页面统一读取 `code`。
   - 参数类型不匹配等由框架解析失败：HTTP 400。
   - 未预期异常：兜底 HTTP 500 `"服务器内部错误"`（脱敏，DSS-REQ-064）。
   - 任何错误消息不得含内部堆栈、SQL、无关数据或敏感信息。
4. **时间与字符编码**：响应统一 UTF-8；三个 DATE 字段以 Oracle `TO_CHAR(col,'YYYY-MM-DD HH24:MI:SS')` 结果字符串透传（即文本 `YYYY-MM-DD HH:mm:ss`，如 `2026-08-17 17:28:46`），不做服务端时区二次转换（DESIGN §5.7、DATABASE §9）。
5. **JSON null 表达**：全局 Jackson 配置 `default-property-inclusion: non_null`，因此需要在 JSON 中显式表达 `null` 的可空字段（`snapshotLastSeenAt`、`snapshotCompletedAt`、`clientRef.desc`、`sourceRef.org`、`sourceRef.category`）必须在对应 VO 字段上加 `@JsonInclude(Include.ALWAYS)`，不改全局配置（同 topic-offset `TopicOffsetItemVO` 惯例，DESIGN §3.2）。**所有 JSON 示例中的 `null` 都是显式字段**，不是字段缺失。
6. **只读语义**：接口只返回查询结果；返回中无任何可触发写、无任何“操作/执行”指令字段；`UPDATED_AT` 等时间字段仅作展示，**不作为健康/在线推断依据**（DSS-REQ-010/056、AC-009/053）。本接口不返回 `CDC_DATA_SOURCE` 密码或任何无关敏感字段（DESIGN §11、DATABASE §10）。

## 3. 只读接口清单与 HTTP 约定

| # | 方法 | 路径 | 职责 | 说明 |
|---|---|---|---|---|
| 1 | `GET` | `/api/monitor/data-source-run-state/list` | 一次性返回“已过滤+固定排序的列表记录”与“RUN_STATE 全量派生的查询候选”，供首次加载、条件查询、自动/手工刷新与恢复可见刷新共用 | 唯一接口；响应 `data` 内嵌 `records + candidates`（DESIGN §5.8/§6） |

- 无独立候选接口、无独立“刷新”接口、无 `detail`/`delete`/`update`/`create` 等任何其他端点（DESIGN §6.1“单接口”决策、§15.1-1）。
- **查询/刷新 HTTP 层复用同一接口**：首次加载、点击“查询”、自动刷新、“立即刷新”、失败重试、恢复可见都调用同一 `GET .../list`；区分仅存在于前端状态语义（参数来源、成功后是否升级“已应用查询条件”），见 §4（DSS-REQ-050/054、DESIGN §7/§8）。
- 校验失败与参数超限在 §8 以业务错误码返回；HTTP 200 业务体与 HTTP 400/500 的分工见 §2。
- Mapper/SQL 层只读保证（显式列、无 `SELECT *`、无写关键字、不读密码）见 DATABASE §10 与 DESIGN §11；Controller/Service 无任何写方法可调用路径（DESIGN §11，AC-010/049/012）。

## 4. 查询参数定义与“全部”传输语义

### 4.1 参数清单

| 参数名 | 类型/出现 | 取值 | 说明 |
|---|---|---|---|
| `clientId` | `String`，可重复 | 探针端原始 `CLIENT_ID` 具体值 | 多选；重复时在服务层去重 |
| `sourceId` | `String`，可重复 | 源库原始 `DATA_SOURCE_ID` 具体值 | 多选；重复时在服务层去重 |
| `status` | `String`，可重复 | 仅 `RUNNING`/`COMPLETED`/`UNKNOWN` | 状态 token（归一类别，非数据库原值）；重复时去重 |

- **多选序列化**：axios 默认把数组序列化为 `clientId[]=...`，必须由前端 api 封装层用 `paramsSerializer` 手工生成 `clientId=A&clientId=B` 形式（复用 topic-offset 已验证做法，DESIGN §3.1）；后端以 `@RequestParam(required=false) List<String>` 绑定。
- **“全部”传输语义（结论）**：某一维未传参数、或传参但归一后为空 ⇒ 该维“不设过滤（全部）”，服务层对该维不筛选。**“全部”永远不以哨兵值传参**（`__ALL__` 只在界面草稿层存在，绝不落网，DESIGN §7.2、UI §3）。
- 空值规则：服务层对每个具体值先 `trim()`；trim 后为空串的项丢弃；归一后为空集合视为“该维全部”。
- 大小写规则：`clientId`/`sourceId` 按**原始值精确匹配**（不做大小写改写，与数据库存储一致；DATABASE §12 说明宽容处理原则）；`status` 只接受白名单大写 token `RUNNING/COMPLETED/UNKNOWN`。
- 长度/数量限制：任一维具体值数量 ≤ `MAX_FILTER_IDS=200`（常量类 `DataSourceRunStateConstants`，DESIGN §4.2；覆盖 ~100 行规模下单维全部候选余量，纯防御，超限抛 `41001`，DSS-REQ-020 规模假设下不会自然触发）。
- 非法值处理：`status` 出现白名单外 token（含把数据库原值如 `SNAPSHOT_RUNNING` 当 token 传入）⇒ 抛 `41002`（§8）；`clientId`/`sourceId` 不校验取值集合（候选之外的合法 ID 仅返回空命中，属成功空结果，非错误）。
- 各维独立：`clientId`、`sourceId`、`status` 三参数互不依赖，可任意组合；全部缺省即“三项全部”。

### 4.2 过滤语义（服务层，与 §5 展示一致）

同一维多个值为 **OR**（`clientId`：命中任一；`status`：命中任一 token），不同维之间为 **AND**；空维不过滤。`status` 各 token 的命中判据复用 DESIGN §5.3：

| token | 命中条件（作用于 `SNAPSHOT_STATUS` 原始值） |
|---|---|
| `RUNNING` | `raw == 'SNAPSHOT_RUNNING'` |
| `COMPLETED` | `raw == 'SNAPSHOT_COMPLETED'` |
| `UNKNOWN` | `raw != 'SNAPSHOT_RUNNING' && raw != 'SNAPSHOT_COMPLETED'` |

过滤只作用于 RUN_STATE 原始行；**与关联配置缺失/停用/类别异常无关**（DSS-REQ-025，AC-023）。未知 token 命中与展示分类共用同一 `classify()`，保证“选未知筛出的行 = 展示为未知的行”（DESIGN §5.3/§5.5）。

### 4.3 查询 vs 刷新（同一接口、不同前端语义）

- HTTP 层两者完全一致，均 `GET .../list`。
- **点击“查询”**：以点击瞬间捕获的“请求快照”（去哨兵后的条件）作为参数；**仅成功（含成功空结果）**才把该快照升级为“已应用查询条件”（DESIGN §7.3，AC-024）。
- **自动/立即/恢复可见刷新**：参数恒取自“已应用查询条件”（非界面草稿），无论成功失败都**不替换**“已应用查询条件”（DESIGN §7.3/§8 E8/E9/E12，AC-024）。
- 同一请求，后端不区分调用来源；无 `kind`、`source` 等多余参数（避免把前端状态机语义泄漏进接口）。

## 5. 列表与候选响应模型

响应体 `data`（即 `SnapshotStatusListVO`，DESIGN §5.8）：

```jsonc
{
  "records": [ SnapshotStatusItemVO, ... ],      // 过滤+排序后的行；数组顺序即前端“序号”顺序
  "candidates": {                                // CandidateGroupVO
    "clients":  [ ClientCandidateVO, ... ],
    "sources":  [ SourceCandidateVO, ... ],
    "statuses": [ "RUNNING", "COMPLETED", "UNKNOWN"? ]
  }
}
```

### 5.1 `records` 每项 `SnapshotStatusItemVO`（字段逐项定义见 §6）

### 5.2 `candidates` 三子结构

| 字段 | 类型 | 元素字段 | 语义与生成 |
|---|---|---|---|
| `clients` | `array` | `ClientCandidateVO { id, desc, active }` | 由本次读取的 **RUN_STATE 全量行**按 `CLIENT_ID` 去重派生（过滤之前），补充 `CDC_CLIENT_MULTIPLE` 展示信息；按 `id` 升序 |
| `sources` | `array` | `SourceCandidateVO { id, org, active }` | 由全量行按 `DATA_SOURCE_ID` 去重派生，补充源库 ORG/启停；按 `org`（空值后置）→ `id` 升序 |
| `statuses` | `array` | 状态 token `String` | 恒含 `RUNNING`、`COMPLETED`（顺序固定）；**仅当**全量行中存在 `classify()=='UNKNOWN'` 的行时追加 `UNKNOWN`（DESIGN §6.1，AC-022） |

- `active` 语义：命中配置且 `FG_ACTIVE=='1'` 为 `true`，否则 `false`（停用/缺失都非启用；是否“缺失”由 `records` 内 `clientRef/sourceRef.state=NOT_FOUND` 表达，候选不区分）。
- **候选为何不被当前筛选结果收窄（结论）**：`candidates` 与 `records` 由**同一次请求内同一次全量 `selectAll()` 的快照**派生（DESIGN §5.1/§6）；`records = f(全量, 条件)`、`candidates = g(全量)`，候选在过滤前从全量行计算。因此即便当前筛到“运行中”子集，探针/源库候选仍覆盖全量出现项；未知候选与未知行分类一致；无跨请求候选/列表时序偏差（DSS-REQ-024，DESIGN §6.2/§6.3，AC-022）。
- 空结果成功：`records=[]` 时 `candidates` 仍由本次全量行派生——若全量本身为空则 `clients/sources` 为空且 `statuses=[RUNNING,COMPLETED]`（AC-022 ③、AC-057）；若仅是筛空则 `records=[]` 而候选非空（DESIGN §6.2）。

### 5.3 VO 命名映射（与 DESIGN §4.2 一致）

| Java VO | JSON（data 内） |
|---|---|
| `SnapshotStatusListVO` | `{ records, candidates }` |
| `SnapshotStatusItemVO` | `records[]` 元素（§6） |
| `ClientRefVO` | `clientRef` |
| `SourceRefVO` | `sourceRef` |
| `CandidateGroupVO` | `candidates` |
| `ClientCandidateVO` / `SourceCandidateVO` | `candidates.clients[]` / `candidates.sources[]` |

## 6. 列表项字段逐项定义（`SnapshotStatusItemVO`）

| JSON 字段 | 类型/null | 定义 | 来源 | 约束/注释 |
|---|---|---|---|---|
| `clientId` | `String` | 探针端原始 `CLIENT_ID` | `CDC_DATA_SOURCE_RUN_STATE.CLIENT_ID` | 恒展示，绝不改写（DSS-REQ-028） |
| `clientRef` | `object` | `{ state, desc }` | `CDC_CLIENT_MULTIPLE` 只读关联 | `state∈{ACTIVE,INACTIVE,NOT_FOUND}`；`desc`=配置 `CLIENT_DESC`（可 null，`@JsonInclude(ALWAYS)` 显式 null）（DESIGN §5.6） |
| `sourceId` | `String` | 源库原始 `DATA_SOURCE_ID` | `...RUN_STATE.DATA_SOURCE_ID` | 恒保留；Tooltip 展示用原始 ID（DSS-REQ-029） |
| `sourceRef` | `object` | `{ state, org, category, sourceRole }` | `CDC_DATA_SOURCE` 只读关联 | `state∈{ACTIVE,INACTIVE,NOT_FOUND}`；`org`=ORG（可 null 显式 null）；`category`=trim+upper 归一类别（NOT_FOUND 时为 null）；`sourceRole=(category=='SOURCE')`（DESIGN §5.6、DSS-REQ-043/044） |
| `snapshotStatus` | `String` | `SNAPSHOT_STATUS` **数据库原始值**（如 `SNAPSHOT_RUNNING`） | `...RUN_STATE.SNAPSHOT_STATUS` | 保留原值，供未知状态/任意行查看原始值（DSS-REQ-030/038/039） |
| `statusCategory` | `String` | 归一类别 token `RUNNING`/`COMPLETED`/`UNKNOWN` | 服务层 `classify(snapshotStatus)` | 只读推导；不写库（DESIGN §5.5） |
| `snapshotLastSeenAt` | `String`/`null` | 快照启动时间 | `...RUN_STATE.SNAPSHOT_LAST_SEEN_AT`（DATE→TO_CHAR） | null（数据库 NULL）→ JSON 显式 null → UI `--`（DSS-REQ-031/055，DATABASE §9） |
| `snapshotCompletedAt` | `String`/`null` | 快照完成时间 | `...RUN_STATE.SNAPSHOT_COMPLETED_AT` | 同上（DSS-REQ-032） |
| `updatedAt` | `String` | 记录更新时间 | `...RUN_STATE.UPDATED_AT`（非空） | 恒字符串；UI 格式函数对 null 仍兜底 `--`（DSS-REQ-033/055）；不用于健康推断 |

> 时间格式均为 `YYYY-MM-DD HH:mm:ss`（由 SQL `TO_CHAR` 保证）；三个时间字段只作展示，接口绝不据其推断健康/超时/离线（DSS-REQ-010/056/057、AC-009/053/054）。

### 6.1 序号与行键（DSS-REQ-026，AC-019）

- **序号前端生成，不是接口字段**：前端按 `records` 数组顺序从 `1` 递增生成稳定显示“序号”，服务端不返回 `seq/serialNo`（避免持久化语义）。刷新/重新查询后序号随新结果重新编号（“当前完整结果集内稳定显示序号”，非业务主键）。
- **行键**：前端用 `clientId + '\x00' + dataSourceId`（NUL 分隔，`String.fromCharCode(0)`）作为 `el-table` 的 `row-key`，无歧义区分复合组合（`CLIENT_ID`/`DATA_SOURCE_ID` 本身不允许含 NUL；复用 topic-offset `rowKey` 方案，DESIGN §15.1-11）。行唯一标识为 `CLIENT_ID + DATA_SOURCE_ID`，接口通过复合主键保证无重复对（DATABASE §3）。

### 6.2 无分页契约（DSS-REQ-020/021，AC-018）

- 请求无 `pageNum`/`pageSize`；响应**不得出现** `pageNum`/`pageSize`/`pages`/`total`/`hasMore` 等任何分页字段。
- `records` 一次性返回全部符合条件行（规模 ≤ ~100，DESIGN §5.1/§11）；无客户端二次拉取/翻页。
- 无排序参数、无表头排序字段（DSS-REQ-049）；`records` 顺序由服务层固定排序决定（DESIGN §5.4）。

## 7. 示例请求与响应

以下示例以“接口契约”表述；`data` 结构与 §5/§6 完全一致。示例中的时间与 ID 均为说明性取值，非当前数据库实时断言（DESIGN §2/§10 未验证实时数据）。

### 7.1 成功·有数据（三项“全部”）

```
GET /api/monitor/data-source-run-state/list
```

```json
{
  "code": 200,
  "message": "success",
  "timestamp": "2026-09-05 14:20:33",
  "data": {
    "records": [
      {
        "clientId": "hosp-012",
        "clientRef": { "state": "ACTIVE", "desc": "HIS 探针示例" },
        "sourceId": "112-source-19c",
        "sourceRef": { "state": "ACTIVE", "org": "示例医院源库", "category": "SOURCE", "sourceRole": true },
        "snapshotStatus": "SNAPSHOT_RUNNING",
        "statusCategory": "RUNNING",
        "snapshotLastSeenAt": "2026-08-17 17:28:46",
        "snapshotCompletedAt": null,
        "updatedAt": "2026-08-17 17:28:46"
      }
    ],
    "candidates": {
      "clients": [ { "id": "hosp-012", "desc": "HIS 探针示例", "active": true } ],
      "sources": [ { "id": "112-source-19c", "org": "示例医院源库", "active": true } ],
      "statuses": [ "RUNNING", "COMPLETED" ]
    }
  }
}
```

### 7.2 成功·按条件过滤（多值 + 状态）

```
GET /api/monitor/data-source-run-state/list?clientId=hosp-012&clientId=hosp-013&status=RUNNING&status=UNKNOWN
```

同一维多值为 OR，跨维 AND；`records` 只含命中的行，`candidates` 仍由全量行派生（不被本次条件收窄）。

### 7.3 成功·空结果（成功空态，非失败）

```
GET /api/monitor/data-source-run-state/list?status=COMPLETED
```

```json
{
  "code": 200,
  "message": "success",
  "data": {
    "records": [],
    "candidates": {
      "clients": [ { "id": "hosp-012", "desc": "HIS 探针示例", "active": true } ],
      "sources": [ { "id": "112-source-19c", "org": "示例医院源库", "active": true } ],
      "statuses": [ "RUNNING", "COMPLETED" ]
    }
  }
}
```

`records=[]` 属**成功**（DSS-REQ-060/AC-057）；前端据此展示空态并允许把该次点击“查询”的快照升级为已应用条件、更新最近成功刷新时间。

### 7.4 未知状态行（宽容展示）

`snapshotStatus` 为数据库原值（示例 `SNAPSHOT_READY`，为说明 UNKNOWN 用，非数据库强约束值）：

```json
{
  "clientId": "hosp-014",
  "clientRef": { "state": "ACTIVE", "desc": null },
  "sourceId": "src-abnormal-01",
  "sourceRef": { "state": "ACTIVE", "org": "异常类别源库", "category": "SOURCE", "sourceRole": true },
  "snapshotStatus": "SNAPSHOT_READY",
  "statusCategory": "UNKNOWN",
  "snapshotLastSeenAt": null,
  "snapshotCompletedAt": "2026-08-18 09:00:00",
  "updatedAt": "2026-08-18 09:01:02"
}
```

此时 `candidates.statuses` 含 `UNKNOWN`（追加在 `RUNNING, COMPLETED` 之后）。接口不因未知值报错、不丢弃、不改写（DSS-REQ-037/039，AC-034/035/037）。

### 7.5 关联异常行（行保留，映射状态表达）

```json
{
  "clientId": "orphan-client-01",
  "clientRef": { "state": "NOT_FOUND", "desc": null },
  "sourceId": "ds-disabled-01",
  "sourceRef": { "state": "INACTIVE", "org": null, "category": "SOURCE", "sourceRole": true },
  "snapshotStatus": "SNAPSHOT_COMPLETED",
  "statusCategory": "COMPLETED",
  "snapshotLastSeenAt": "2026-08-18 08:00:00",
  "snapshotCompletedAt": "2026-08-18 08:02:00",
  "updatedAt": "2026-08-18 08:02:00"
}
```

行不因关联缺失/停用/类别异常被过滤；异常仅以 `clientRef/sourceRef.state` 表达，前端渲染轻提示（DSS-REQ-019/041~045，AC-017/038~042，UI §5.4）。`state=NOT_FOUND` 时 `org/category` 显式 null、`sourceRole=false`。

### 7.6 参数错误（业务错误体，HTTP 200）

`status` 传白名单外 token：

```
GET /api/monitor/data-source-run-state/list?status=RUNNING&status=FORBIDDEN_STATE
```

```json
{ "code": 41002, "message": "快照状态取值非法", "data": null, "timestamp": "2026-09-05 14:21:00" }
```

任一维具体值数量超 `MAX_FILTER_IDS=200`：

```json
{ "code": 41001, "message": "查询参数数量超过限制", "data": null, "timestamp": "2026-09-05 14:21:01" }
```

### 7.7 参数类型不匹配 / 服务错误

- 框架解析失败（如本应为多值的参数被重复绑定冲突、类型不匹配）：HTTP 400（消息脱敏）。
- 未预期异常：兜底 HTTP 500 `"服务器内部错误"`（脱敏，DSS-REQ-064，AC-062）；页面按“失败保留旧数据/首次失败态”处理（UI §7）。

## 8. 错误码、脱敏消息与 HTTP/业务状态约定

| code | 场景 | message（脱敏示例） | HTTP | 说明 |
|---|---|---|---|---|
| `200` | 成功（含成功空结果） | `success` | 200 | 唯一成功码 |
| `41001` | 某维具体值数量超 `MAX_FILTER_IDS=200` | `查询参数数量超过限制` | 200（业务体） | 防御性上限；~100 行规模不会自然触发（DESIGN §5.2） |
| `41002` | `status` 含白名单外 token（如数据库原值当 token） | `快照状态取值非法` | 200（业务体） | 前端只发 `RUNNING/COMPLETED/UNKNOWN`；防御非法输入（DESIGN §5.2） |
| `400` | 参数类型/绑定不匹配 | 框架默认（脱敏收敛） | 400 | 由 `GlobalExceptionHandler` 收敛 |
| `500` | 未预期异常 | `服务器内部错误` | 500 | 兜底；不暴露堆栈（DSS-REQ-064） |

- 错误码段：`41001/41002` 取自当前未被任何监控模块占用的 `41xxx` 段（DESIGN §4.1/§15.1-10，zookeeper `5001+`、topicoffset `40001+` 等互不重叠）。
- 统一经 `enum DataSourceRunStateErrorCode { CODE(code, message) }`（DESIGN §4.2）声明；`BusinessException(code, message)` 抛出后由 `GlobalExceptionHandler` 返回。
- 消息一律脱敏、收敛（不堆叠敏感/无关信息，DSS-REQ-064，AC-062）；前端对错误消息做展示收敛（UI §7.3）。

## 9. API 与需求/验收映射

本接口是唯一数据通道，全部 65 条需求与 68 条验收的“可复核接口行为”最终都以 `GET /api/monitor/data-source-run-state/list` 的请求/响应契约为载体；下列给出 API 各设计要素对需求/验收的主要承担关系（完整落点矩阵见 DESIGN §14）。

| API 要素（本节） | 主要承担需求 | 主要承担验收 |
|---|---|---|
| §2 只读/无写/统一响应/脱敏/时间不推断健康 | REQ-011/012/013/014/052/055/064 | AC-010/011/012/049/052/062 |
| §3 只读接口清单、无写端点、查询/刷新复用同一 GET | REQ-012/013/014/050 | AC-010/011/049/047 |
| §4 查询参数、多选序列化、“全部”缺省语义、过滤语义、请求快照/已应用条件 | REQ-020/022/023/025/050 | AC-020/021/023/024/047 |
| §5 候选与列表同快照、候选不被筛选收窄、空结果候选 | REQ-020/024/027/034/037 | AC-022/025/034/018 |
| §6 列表项逐字段、序号前端生成、行键、无分页 | REQ-026/027/034/039/049 | AC-019/025/031/046/018 |
| §6/§5 时间透传与显式 null（格式见 DATABASE §9） | REQ-055/010/031/032/033 | AC-052/029/030/009/053 |
| §7 示例响应（未知状态/关联异常/空/参数/服务错误）作为 JSON/时间契约用例基础 | REQ-026/027/035~039 | AC-034/066/028/035/037 |
| §8 错误码与脱敏 | REQ-064 | AC-062 |

> 一致性声明：本文件与 DESIGN.md/UI.md/DATABASE.md 统一使用接口路径 `GET /api/monitor/data-source-run-state/list`、参数 `clientId`/`sourceId`/`status`、状态 token `RUNNING`/`COMPLETED`/`UNKNOWN`、原始值 `SNAPSHOT_RUNNING`/`SNAPSHOT_COMPLETED`、映射状态 `ACTIVE`/`INACTIVE`/`NOT_FOUND`、错误码 `41001/41002`、时间格式 `YYYY-MM-DD HH:mm:ss` 与 JSON 显式 null（DESIGN §14.1）。本文件不虚构任何已存在实现；待确认设计项为 0。
