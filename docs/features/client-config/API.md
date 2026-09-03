# 探针端管理 Feature 接口契约（API）

## 1. 元数据与文档状态

| 项目 | 值 |
|---|---|
| Feature 中文名称 | 探针端管理 |
| Feature 标识 | `client-config` |
| 既有路由 | `/config/client`（保持不变） |
| 目标文档 | `docs/features/client-config/API.md` |
| 文档状态 | `DRAFT_PENDING_USER_REVIEW`（设计草案，尚未经 ChatGPT 正式复审与项目负责人批准；不得写成已批准基线） |
| 实现状态 | `NOT_STARTED`（本契约只定义目标接口，不代表任何接口已经实现） |
| 任务编号 | `CLIENT-CONFIG-DESIGN-BASELINE-001`（阶段 4 设计基线，纯文档） |
| 依据需求 | `CCFG-REQ-001~090`（`APPROVED`） |
| 依据验收 | `CCFG-AC-001~076`（全部 `NOT_RUN`） |
| 基线提交 | `cecfdd5478df8b82ba39c083553ea8dd7ead48e8` |
| 创建日期 | 2026-09-03 |
| 设计编号 | `CCFG-API-001 ~ CCFG-API-014`，连续、唯一、不可复用 |
| PENDING_USER_CONFIRMATION | `0` |
| 配套文档 | `DESIGN.md`（逻辑与数据流）、`UI.md`（交互）、`DATABASE.md`（SQL 与事务） |

## 2. 统一调用规约

| 设计编号 | 设计决定 | 覆盖需求 | 覆盖验收 |
|---|---|---|---|
| CCFG-API-001 | 所有接口位于统一前缀 `/api/clients` 之下（前端 Vite 代理 `/api` → 后端 `127.0.0.1:8080`）。响应统一使用项目 `ApiResponse<T>` 包装：`{ code:int, message:string, data:T|null, timestamp:string(ISO)`。成功 `code=200`、`message="success"`；业务失败通过 `BusinessException` 抛出，由 `GlobalExceptionHandler` 以 HTTP 200 + `ApiResponse.fail(code,message)` 返回（`data=null`）；`MethodArgumentNotValidException`/`ConstraintViolationException`/`MethodArgumentTypeMismatchException` → HTTP 400、`code=400`；未捕获异常 → HTTP 500、`code=500`、`message="服务器内部错误"`。前端统一以 `code===200` 判定成功，否则展示 `message`。 | CCFG-REQ-085、CCFG-REQ-086 | CCFG-AC-071、CCFG-AC-072 |
| CCFG-API-002 | 字段与 JSON 命名：业务字段统一 lowerCamelCase（`clientId`、`clientDesc`、`dataSourceIds`、`fgActive`…）；所有探针 ID 与数据源 ID 均以 JSON 字符串传输，绝不进入 `Number`；时间戳等显示用字段由前端格式化，接口不返回本页面不需要的字段。 | CCFG-REQ-090 | CCFG-AC-073 |
| CCFG-API-003 | 最小接口集合固定为下列 7 个（E1~E7），不提供分页接口、批量删除、批量启停、详情页、连接测试、进程控制或额外通用 CRUD。编辑打开所需数据由 E1 列表行（含完整数据源视图与异常）与 E2 候选接口共同完成，**不**另设详情 GET。 | CCFG-REQ-003、CCFG-REQ-087、CCFG-REQ-088、CCFG-REQ-089、CCFG-REQ-090 | CCFG-AC-003、CCFG-AC-073、CCFG-AC-074、CCFG-AC-075、CCFG-AC-076 |

### 接口清单（E1~E7）

| 编号 | 方法与路径 | 用途 | 写库 | 需表级互斥锁 |
|---|---|---|---|---|
| E1 | `GET /api/clients` | 列表查询 | 否 | 否 |
| E2 | `GET /api/clients/data-source-options` | 新增/编辑的数据源候选与占用 | 否 | 否 |
| E3 | `POST /api/clients` | 新增 | 是（INSERT，`FG_ACTIVE='1'`） | 是 |
| E4 | `PUT /api/clients/{originalClientId}` | 编辑 | 是（原子 UPDATE） | 是 |
| E5 | `DELETE /api/clients/{clientId}` | 删除 | 是（物理 DELETE） | 否 |
| E6 | `PUT /api/clients/{clientId}/enable` | 启用 | 是（UPDATE `FG_ACTIVE='1'`） | 是 |
| E7 | `PUT /api/clients/{clientId}/disable` | 停用 | 是（UPDATE `FG_ACTIVE='0'`） | 否 |

> 静态路径 `data-source-options` 与 `{clientId}` 动态段不冲突：二者方法不同（E2 为 GET），仓库映射按“方法+路径”解析；`clientId` 因格式约束不含 `/`，可直接作为路径段。

## 3. 列表查询

| 设计编号 | 设计决定 | 覆盖需求 | 覆盖验收 |
|---|---|---|---|
| CCFG-API-002 | `GET /api/clients`。Query：`keyword`（可选，字符串，查询前 Trim；空串按无关键词处理）；`status`（可选，取值 `ALL`/`ENABLED`/`DISABLED`，缺省 `ALL`；非法值由枚举解析失败映射为 HTTP 400、`code=400`）。读取边界：按条件读取 `CDC_CLIENT_MULTIPLE` 安全字段 + 一次读取 `CDC_DATA_SOURCE` 安全字段（见 DATABASE.md）；无表锁；响应 `data = ClientListVO`。成功示例见 §3.2，失败示例见 §8。 | CCFG-REQ-002、CCFG-REQ-003、CCFG-REQ-005、CCFG-REQ-006、CCFG-REQ-007、CCFG-REQ-009、CCFG-REQ-078 | CCFG-AC-002、CCFG-AC-003、CCFG-AC-004、CCFG-AC-005、CCFG-AC-006、CCFG-AC-008、CCFG-AC-065 |
| CCFG-API-009 | `ClientListVO { items: ClientListItemVO[] }`；`ClientListItemVO { clientId:string; clientDesc:string; status:"ENABLED"\|"DISABLED"\|"ABNORMAL"; fgActive:string; dataSourceCount:number; items:DataSourceViewItemVO[] }`。`dataSourceCount` = 该行去重后非空数据源数；`items` 为按“异常项优先、组内保持原存储顺序”稳定投影后的展示视图（顺序不影响库中内容）。`DataSourceViewItemVO { dataSourceId:string; org:string\|null; dataSourceName:string\|null; anomalies:string[]; conflictClientIds:string[] }`；`anomalies` 元素取自稳定枚举 `INACTIVE`/`NOT_FOUND`/`COMMA_IN_ID`/`DUPLICATE_IN_ROW`/`ASSIGNED_TO_MULTIPLE_CLIENTS`；`org`/`dataSourceName` 可空（找不到时仍须能回显原始 ID）。 | CCFG-REQ-011、CCFG-REQ-017、CCFG-REQ-019、CCFG-REQ-029、CCFG-REQ-033、CCFG-REQ-062、CCFG-REQ-079、CCFG-REQ-080、CCFG-REQ-087 | CCFG-AC-009、CCFG-AC-013、CCFG-AC-015、CCFG-AC-022、CCFG-AC-025、CCFG-AC-050、CCFG-AC-066、CCFG-AC-067、CCFG-AC-073 |

### 3.1 成功响应示例

```json
{
  "code": 200,
  "message": "success",
  "data": {
    "items": [
      {
        "clientId": "probe-001",
        "clientDesc": "中心医院探针",
        "status": "ENABLED",
        "fgActive": "1",
        "dataSourceCount": 3,
        "items": [
          { "dataSourceId": "ds_oracle_011", "org": "中心医院", "dataSourceName": "HIS 主库", "anomalies": [], "conflictClientIds": [] },
          { "dataSourceId": "ds_oracle_099", "org": "停用机构", "dataSourceName": "旧库", "anomalies": ["INACTIVE"], "conflictClientIds": [] },
          { "dataSourceId": "ds_oracle_077", "org": "分院", "dataSourceName": "分院库", "anomalies": ["ASSIGNED_TO_MULTIPLE_CLIENTS"], "conflictClientIds": ["probe-hosp-007"] }
        ]
      }
    ]
  },
  "timestamp": "2026-09-03T10:00:00.123"
}
```

## 4. 数据源候选

| 设计编号 | 设计决定 | 覆盖需求 | 覆盖验收 |
|---|---|---|---|
| CCFG-API-003 | `GET /api/clients/data-source-options`。Query：`excludeClientId`（可选，字符串；编辑时传当前记录**原探针 ID**，用于“自排除”，新增时不传）。读取边界：读取 `CDC_DATA_SOURCE` 安全字段 + `CDC_CLIENT_MULTIPLE` 全量占用（用于标记占用），无表锁。响应 `data = DataSourceOptionVO[]`。候选范围 = `FG_ACTIVE='1'` 且 `UPPER(DATA_SOURCE_CATEGORY)='SOURCE'` 且 `UPPER(DATA_SOURCE_TYPE)='ORACLE'` 的 `CDC_DATA_SOURCE` 记录；`selectable=false` 两种情况：`notSelectableReason="COMMA_IN_ID"`（该数据源 ID 含英文逗号）或 `="OCCUPIED"`（其规范化 ID 已被 `excludeClientId` 以外的探针分配，`occupiedByClientIds` 列出全部占用探针 ID）。`DataSourceOptionVO { dataSourceId:string; org:string; dataSourceName:string; selectable:boolean; notSelectableReason:"COMMA_IN_ID"\|"OCCUPIED"\|null; occupiedByClientIds:string[] }`。当前编辑记录自己已选且健康的项因自排除而保持 `selectable=true`。 | CCFG-REQ-061、CCFG-REQ-063、CCFG-REQ-064、CCFG-REQ-065、CCFG-REQ-066、CCFG-REQ-067、CCFG-REQ-062 | CCFG-AC-049、CCFG-AC-051、CCFG-AC-052、CCFG-AC-053、CCFG-AC-054、CCFG-AC-055、CCFG-AC-050 |
| CCFG-API-003 | 无候选与失败语义：候选数为 0 → 返回空数组 `data=[]`（前端据此显示“无可用项”）；搜索由前端在已加载候选上本地过滤（机构名称/数据源名称/ID 不区分大小写包含），候选加载失败为接口层异常（前端展示加载失败三态，见 UI.md）。 | CCFG-REQ-067 | CCFG-AC-055 |

### 4.1 成功响应示例

```json
{
  "code": 200,
  "message": "success",
  "data": [
    { "dataSourceId": "ds_oracle_011", "org": "中心医院", "dataSourceName": "HIS 主库", "selectable": true, "notSelectableReason": null, "occupiedByClientIds": [] },
    { "dataSourceId": "ds_oracle_012,legacy", "org": "含逗号机构", "dataSourceName": "历史库", "selectable": false, "notSelectableReason": "COMMA_IN_ID", "occupiedByClientIds": [] },
    { "dataSourceId": "ds_oracle_077", "org": "分院", "dataSourceName": "分院库", "selectable": false, "notSelectableReason": "OCCUPIED", "occupiedByClientIds": ["probe-hosp-007"] }
  ],
  "timestamp": "2026-09-03T10:00:00.123"
}
```

## 5. 新增

| 设计编号 | 设计决定 | 覆盖需求 | 覆盖验收 |
|---|---|---|---|
| CCFG-API-004 | `POST /api/clients`。Body：`CreateClientRequest { clientId:string(必填); clientDesc:string(必填); dataSourceIds:string[](必填,≥1) }`。后端对 `clientId`/`clientDesc`/每个 `dataSourceIds` 元素做 Trim；`dataSourceIds` 去空项、按规范化结果去重（保留首次出现顺序），随后序列化为单逗号无空格字符串待写。写入边界：单个短事务 + 表级互斥锁 + 锁内全量权威校验（探针 ID ASCII 大小写不敏感唯一；全部拟保存数据源唯一分配且均为可用候选）→ `INSERT` 且 `FG_ACTIVE='1'`，行数必须为 1。成功 `code=200`、`message="success"`（`data=null`）；失败按 §8 错误码返回。重复提交语义：不提供幂等键；同一 `clientId` 二次成功提交会被 ID 唯一校验拒绝（`40940`），天然避免重复行。 | CCFG-REQ-041、CCFG-REQ-037、CCFG-REQ-038、CCFG-REQ-039、CCFG-REQ-040、CCFG-REQ-043、CCFG-REQ-071、CCFG-REQ-085 | CCFG-AC-028、CCFG-AC-029、CCFG-AC-030、CCFG-AC-031、CCFG-AC-033、CCFG-AC-034、CCFG-AC-058、CCFG-AC-071 |

### 5.1 请求与成功响应示例

```json
{
  "clientId": "probe-002",
  "clientDesc": "分院探针",
  "dataSourceIds": ["ds_oracle_021", "ds_oracle_022"]
}
```

```json
{ "code": 200, "message": "success", "data": null, "timestamp": "2026-09-03T10:01:00.000" }
```

## 6. 编辑

| 设计编号 | 设计决定 | 覆盖需求 | 覆盖验收 |
|---|---|---|---|
| CCFG-API-005 | `PUT /api/clients/{originalClientId}`。Path：`originalClientId`（当前记录**原探针 ID**，Trim 后用于定位与自排除）。Body：`UpdateClientRequest { clientId:string(必填,最终值); clientDesc:string(必填); dataSourceIds:string[](必填,≥1) }`。写入边界：同一短事务 + 表级互斥锁；先按 `originalClientId` 定位原记录（找不到 → `40440`），在锁内按最终 `clientId` 执行格式与 ASCII 大小写不敏感唯一校验（自排除 `originalClientId`，允许自身仅大小写调整），按全部拟保存数据源做唯一分配与可用性校验（自排除 `originalClientId`），随后一次性原子 `UPDATE`（探针 ID、描述、数据源序列化值），行数必须为 1，失败整笔回滚。不级联其他表/进程/ZK/Kafka。保存只提交最终 `clientDesc` 文本，后端按必填/Trim/`1024 BYTE` 校验，不重新生成、不比较其是否等于机构组合。重复/幂等语义：重复提交同一最终状态按同一事务规则再次执行（若最终状态与原状态一致仍允许，若与已有他行冲突则拒绝）。 | CCFG-REQ-044、CCFG-REQ-045、CCFG-REQ-046、CCFG-REQ-047、CCFG-REQ-048、CCFG-REQ-049、CCFG-REQ-059、CCFG-REQ-066、CCFG-REQ-073 | CCFG-AC-035、CCFG-AC-036、CCFG-AC-037、CCFG-AC-038、CCFG-AC-039、CCFG-AC-040、CCFG-AC-054、CCFG-AC-060、CCFG-AC-033 |

### 6.1 请求与成功响应示例

```
PUT /api/clients/probe-001
```

```json
{
  "clientId": "PROBE-001",
  "clientDesc": "中心医院探针（更名后）",
  "dataSourceIds": ["ds_oracle_011", "ds_oracle_012"]
}
```

```json
{ "code": 200, "message": "success", "data": null, "timestamp": "2026-09-03T10:02:00.000" }
```

## 7. 删除、启用、停用

| 设计编号 | 设计决定 | 覆盖需求 | 覆盖验收 |
|---|---|---|---|
| CCFG-API-006 | `DELETE /api/clients/{clientId}`。Path：`clientId`（待删探针 ID）。写入边界：短事务内物理 `DELETE` 该记录，不做任何关联检查，行数必须为 1；重复删除第二次定位不到 → `40440`。删除成功后前端刷新列表并清空选中。 | CCFG-REQ-026、CCFG-REQ-027、CCFG-REQ-028 | CCFG-AC-020、CCFG-AC-021 |
| CCFG-API-007 | `PUT /api/clients/{clientId}/enable`。Path：`clientId`。写入边界：单个短事务 + 表级互斥锁；锁内重读目标记录，若 `fgActive` 非 `0/1` → `40240`；执行与新增/编辑相同的全部数据源唯一分配校验（自排除目标记录自身），仅重复分配冲突阻断（`40941`），其他数据源异常（停用/不存在/含逗号）不阻断；成功后仅把 `FG_ACTIVE` 更新为 `1`，行数必须为 1。不弹确认由前端处理。 | CCFG-REQ-031、CCFG-REQ-032、CCFG-REQ-034、CCFG-REQ-035、CCFG-REQ-072、CCFG-REQ-083 | CCFG-AC-022、CCFG-AC-024、CCFG-AC-026、CCFG-AC-027、CCFG-AC-059 |
| CCFG-API-008 | `PUT /api/clients/{clientId}/disable`。Path：`clientId`。写入边界：短事务内仅把目标记录 `FG_ACTIVE` 更新为 `0`，行数必须为 1；非 `0/1` 记录允许停用；历史数据源异常不阻断。二次确认由前端负责。 | CCFG-REQ-030、CCFG-REQ-032、CCFG-REQ-035、CCFG-REQ-083 | CCFG-AC-023、CCFG-AC-024、CCFG-AC-027 |

### 7.1 成功响应示例（三者同形）

```json
{ "code": 200, "message": "success", "data": null, "timestamp": "2026-09-03T10:03:00.000" }
```

## 8. 错误码表

> 业务失败均以 HTTP 200 + 业务 `code` 返回（复用项目 `BusinessException` → `GlobalExceptionHandler` 规约）；HTTP 400/500 仅用于框架级结构/类型/未知异常。以下错误码区间不与现有各模块冲突（`DataSource 40001~50001`、`JobFailure 40005~50010`、`LogQuery`、`ServerConfig`、`Subscription`、`TopicOffset`、`ZooKeeper` 均已占用；本 Feature 使用 `40xxx/4044x/4094x/5005x` 区间内自由号段）。

| 编号 | 错误码 | 常量名 | HTTP | 分类 | message（可直接展示，不泄露 SQL/堆栈） |
|---|---|---|---|---|---|
| CCFG-API-012 | 400 | `PARAM_INVALID` | 400 | 参数结构/类型 | 由全局处理生成（`字段: 原因`；`参数类型错误: 参数名`） |
| CCFG-API-012 | 40100 | `CLIENT_ID_REQUIRED` | 200 | 探针 ID | 探针 ID 不能为空。 |
| CCFG-API-012 | 40101 | `INVALID_CLIENT_ID` | 200 | 探针 ID | 探针 ID 格式不正确：须为 1~32 位字母、数字、点、下划线或连字符，且以字母或数字开头。 |
| CCFG-API-012 | 40102 | `INVALID_CLIENT_DESC` | 200 | 探针描述 | 探针描述不能为空，或去除首尾空白后超过 1024 字节（UTF-8）。 |
| CCFG-API-012 | 40103 | `DATA_SOURCE_REQUIRED` | 200 | 数据源 | 采集数据源不能为空，至少选择 1 个数据源。 |
| CCFG-API-012 | 40104 | `INVALID_DATA_SOURCE_ID` | 200 | 数据源 | 数据源 ID 格式非法（含英文逗号或非法字符）。 |
| CCFG-API-012 | 40105 | `DATA_SOURCE_IDS_TOO_LONG` | 200 | 数据源 | 数据源序列化结果超过 1000 字节（UTF-8），请减少选择。 |
| CCFG-API-012 | 40240 | `ILLEGAL_CLIENT_STATE` | 200 | 状态 | 探针当前状态不允许该操作。 |
| CCFG-API-012 | 40440 | `CLIENT_NOT_FOUND` | 200 | 探针 | 探针不存在或已被删除。 |
| CCFG-API-012 | 40441 | `DATA_SOURCE_UNAVAILABLE` | 200 | 数据源 | 数据源不存在、已停用或类别/类型不符。 |
| CCFG-API-012 | 40940 | `CLIENT_ID_CONFLICT` | 200 | 探针 ID | 探针 ID 已存在冲突（不区分大小写），请更换探针 ID。 |
| CCFG-API-012 | 40941 | `DATA_SOURCE_OCCUPIED` | 200 | 数据源 | 数据源“{机构名称}（{数据源ID}）”已分配给探针：{冲突探针ID，顿号分隔，全部列出}，不能重复分配。（无法取得机构名称时省略“机构名称（”部分，形如：数据源（{数据源ID}）已分配给探针：{...}） |
| CCFG-API-012 | 40942 | `ANOMALOUS_SELECTION_BLOCKED` | 200 | 历史异常 | 存在异常数据源，编辑保存被阻断，请先移除异常数据源后再保存。 |
| CCFG-API-012 | 50050 | `LOCK_WAIT_TIMEOUT` | 200 | 并发 | 系统繁忙，等待配置数据锁超时，请稍后重试。 |
| CCFG-API-012 | 50051 | `SAVE_FAILED` | 200 | 写入 | 保存失败，请稍后重试。 |
| CCFG-API-012 | 50052 | `DELETE_FAILED` | 200 | 写入 | 删除失败，请稍后重试。 |

| 设计编号 | 设计决定 | 覆盖需求 | 覆盖验收 |
|---|---|---|---|
| CCFG-API-012 | 错误触发归类：结构/字段缺失或类型不符 → HTTP 400 `code=400`；`clientId` 空 → `40100`；格式不符 → `40101`；描述空或超 1024 BYTE → `40102`；数据源为空 → `40103`；数据源 ID 协议非法 → `40104`；序列化超 1000 BYTE → `40105`；非 `0/1` 状态被请求启用等非法状态操作 → `40240`；定位不到 → `40440`；数据源不存在/停用/类别或类型不符 → `40441`；ID 大小写不敏感冲突 → `40940`；数据源已被其他探针占用（携带全部冲突探针 ID，满足 `CCFG-REQ-075/076` 的可解析信息）→ `40941`；编辑保存因历史异常被阻断 → `40942`；锁等待超时（`ORA-30006`）→ `50050` 并回滚；写行数异常/其他保存失败 → `50051`/删除 → `50052`。 | CCFG-REQ-075、CCFG-REQ-076、CCFG-REQ-081、CCFG-REQ-082、CCFG-REQ-086 | CCFG-AC-062、CCFG-AC-063、CCFG-AC-068、CCFG-AC-069、CCFG-AC-072 |

### 8.1 失败响应示例

```json
{
  "code": 40941,
  "message": "数据源“中心医院（ds_oracle_011）”已分配给探针：probe-hosp-007，不能重复分配。",
  "data": null,
  "timestamp": "2026-09-03T10:04:00.000"
}
```

## 8A. 请求模型（DTO）与校验

| 设计编号 | 设计决定 | 覆盖需求 | 覆盖验收 |
|---|---|---|---|
| CCFG-API-010 | 请求模型固定为：`CreateClientRequest { clientId:string(必填); clientDesc:string(必填); dataSourceIds:string[](必填,≥1) }`（新增 E3）；`UpdateClientRequest { clientId:string(必填,最终值); clientDesc:string(必填); dataSourceIds:string[](必填,≥1) }`（编辑 E4，`originalClientId` 走 E4 路径参数，不入 body）。`dataSourceIds` 传有序数组，Trim/去空/去重/序列化为 CSV 由后端完成。两个请求模型均不含状态字段、启停控件、描述生成模式或其他业务字段；表单/编辑打开所需最新数据由 E1 行 + E2 候选共同完成，不设详情 GET。 | CCFG-REQ-036、CCFG-REQ-041、CCFG-REQ-042、CCFG-REQ-051 | CCFG-AC-028、CCFG-AC-031、CCFG-AC-032、CCFG-AC-042 |

## 9. 字段校验与后端权威校验

| 设计编号 | 设计决定 | 覆盖需求 | 覆盖验收 |
|---|---|---|---|
| CCFG-API-011 | 探针 ID：Trim 后非空；长度与格式由正则 `^[A-Za-z0-9][A-Za-z0-9._-]{0,31}$`（隐含 1~32 位）一次性判定；ASCII 大小写不敏感唯一性（编辑按 `originalClientId` 排除自身；仅自身大小写调整且无其他冲突时允许）。后端保存前为最终权威，前端可提前预校验。 | CCFG-REQ-037、CCFG-REQ-038 | CCFG-AC-029、CCFG-AC-030 |
| CCFG-API-011 | 探针描述：Trim 后非空；UTF-8 字节数 `<=1024`（`StandardCharsets.UTF_8` 计字节）；后端为最终防线，前端 `TextEncoder` 预校验。 | CCFG-REQ-039、CCFG-REQ-059 | CCFG-AC-033 |
| CCFG-API-011 | 数据源：`dataSourceIds` 至少 1 个；每个元素 Trim、去空；同一请求内去重（保留首次出现）；按规范化 ID 精确比较做跨记录唯一分配（不折叠大小写）；序列化结果 `<=1000 BYTE`；每个拟保存数据源必须为可用候选（存在、`FG_ACTIVE='1'`、`SOURCE`、`ORACLE`、ID 不含逗号），否则 `40441`；已由他人占用则 `40941`。 | CCFG-REQ-040、CCFG-REQ-068、CCFG-REQ-071、CCFG-REQ-074 | CCFG-AC-034、CCFG-AC-056、CCFG-AC-058、CCFG-AC-061 |

## 10. 幂等、重复提交与加载语义

| 设计编号 | 设计决定 | 覆盖需求 | 覆盖验收 |
|---|---|---|---|
| CCFG-API-013 | 前端对 E3/E4/E5/E6/E7 在请求进行中置 `SUBMITTING` 并禁用触发控件（防重复提交）；接口层天然语义：新增重复提交被 `40940` 拒绝、编辑/启停对相同最终状态可安全重复、删除重复返回 `40440`。接口不提供额外幂等键，不提供自动刷新。 | CCFG-REQ-085 | CCFG-AC-071 |
| CCFG-API-014 | 范围边界：接口不得返回密码等敏感字段；不提供分页；不触发进程/ZK/Kafka/源库连接/Schema 读取；页面反馈不承诺“实时生效”。以上以契约测试断言（见 DESIGN.md §10）。 | CCFG-REQ-087、CCFG-REQ-088、CCFG-REQ-089、CCFG-REQ-090 | CCFG-AC-073、CCFG-AC-074、CCFG-AC-075、CCFG-AC-076 |

## 11. 关联矩阵

- 逐接口/逐模型/逐错误码的“覆盖需求 / 覆盖验收”已在上方各设计编号表内给出；完整 REQ→设计项、AC→设计项总矩阵见 `DESIGN.md` §12（本文件设计项以其 `CCFG-API-*` 编号出现并被纳入总矩阵，保证 90/90 需求、76/76 验收可追踪）。
- 本文件所有 `CCFG-API-*` 编号在其表内均有唯一一行，引用可解析。

## 12. 变更记录

| 日期 | 变更 | 依据 |
|---|---|---|
| 2026-09-03 | 新建 `docs/features/client-config/API.md`：接口 E1~E7（`CCFG-API-001~014`）、响应/请求模型、校验规则与错误码表，文档状态 `DRAFT_PENDING_USER_REVIEW`，`PENDING_USER_CONFIRMATION=0` | CLIENT-CONFIG-DESIGN-BASELINE-001（阶段 4 设计基线；纯文档任务，未实现、未执行验收） |
