# 数据源管理 —— API 设计基线草案（API.md）

> 文档状态：`APPROVED`
> 需求状态：`APPROVED`
> 验收标准状态：`APPROVED`
> 实现状态：`NOT_STARTED`
> 设计任务：`DATA-SOURCE-DESIGN-BASELINE-001`
> 授权基准提交：`c24bbb826b252f06f75ec05bcac77e94a9871019`
> 创建日期：2026-08-29
> 批准任务：`DATA-SOURCE-DESIGN-APPROVAL-CLOSEOUT-001`
> 批准日期：2026-08-29
> 批准依据提交：`fdb9ecaf5bc24373e586d853b4174d1a9cd8bbfc`

---

## 0. 声明与边界

- 本设计已获用户正式批准（批准任务 `DATA-SOURCE-DESIGN-APPROVAL-CLOSEOUT-001`，批准日期 2026-08-29，批准依据提交 `fdb9ecaf5bc24373e586d853b4174d1a9cd8bbfc`），成为数据源管理 Feature 当前正式设计基线；不再处于"草案等待批准"状态。
- 设计批准**不代表**代码已实现、构建通过、验收执行或生产可用。
- 106 条验收用例仍全部为 `NOT_RUN`。
- 本设计不改变任何已批准 `DS-REQ`/`DS-AC`；不新增 DDL、锁、权限、认证或自动刷新等未批准能力。
- 本设计不修改代码、测试、构建文件、配置、菜单、路由、历史候选或任何已批准项目/数据库基线。

### 0.1 批准声明

- 用户已正式批准初版、R1、R2 共同形成的完整设计与契约内容；本文件成为数据源管理 Feature 当前正式设计基线。
- 允许下一阶段基于已批准需求、验收标准和四份设计基线生成实现任务提示词。
- 批准设计**不代表**：代码已经实现；后端或前端构建已经通过；服务已经启动或联调完成；数据库或 ZooKeeper 已被访问；任何 SQL/DDL 已执行；任何一条验收用例已经执行或通过；功能已经生产可用。
- 106 条验收用例继续全部为 `NOT_RUN`，不得写成 `PASS`/`FAIL`/`BLOCKED`。
- 实现状态继续为 `NOT_STARTED`。
- 第一版仍无数据库 DDL、主键/唯一约束/索引变更；批准本文档不等于批准执行数据库变更。

### 0.2 批准链

1. 需求及验收批准收口：`fed87640e007967ece60c1dad5e83438e2bc4672`
2. 基线影响同步及 R1：`3f8747b7aff076f06fc8fdad214e1f14e0013afe`、`c24bbb826b252f06f75ec05bcac77e94a9871019`
3. 设计草案初版：`f7ea3eb2a1343a0600deb86404ce6775a810dce9`
4. 设计 R1：`3b6496b6a2312450fd69be2edbbd287ceb756810`
5. 设计 R2 与最终复审通过基准：`fdb9ecaf5bc24373e586d853b4174d1a9cd8bbfc`
6. 用户最终批准与本批准收口任务：`DATA-SOURCE-DESIGN-APPROVAL-CLOSEOUT-001`

本文件不伪造独立 ChatGPT 报告，仅陈述本批准收口任务已收到的复审结论（基于 `fdb9ecaf...` 的 `REVIEW_PASS`）与用户批准事实。

---

## 1. 目标接口总表（§7.1）

> 复用既有 `/api/data-sources` 根路径。除旧的分页/启停/一对一 EXTEND 语义外，路径命名尽量保持兼容；所有路径、HTTP 方法与兼容处理见 §6。

| # | 方法 | 路径 | 说明 | 关联 DS-REQ | 关联 DS-AC |
|---|---|---|---|---|---|
| 1 | GET | `/api/data-sources` | 无分页列表（三条件模糊查询） | 001,002,005,006,007,008,010,011,012 | 004,005,006,011~019 |
| 2 | GET | `/api/data-sources/{id}` | 主数据源详情（不含真实密码） | 043 | 048 |
| 3 | POST | `/api/data-sources` | 新增数据源 | 004,015,019,020,021~034,037,106 | 020,024~037,038,041,105 |
| 4 | PUT | `/api/data-sources/{originalId}` | 编辑数据源（`originalId`=编辑前原 ID） | 016,019~041,043~046,106 | 020,021,024~037,039,042~051,105 |
| 5 | DELETE | `/api/data-sources/{id}` | 删除数据源（只物理删主表当前记录） | 092~097 | 087~092 |
| 6 | POST | `/api/data-sources/test-connection` | 测试连接（临时连接，返回脱敏结果） | 048~061,106 | 053~064,103,104,105 |
| 7 | GET | `/api/data-sources/target-options` | 目标库候选下拉选项 | 076,083 | 076,086 |
| 8 | GET | `/api/data-sources/{id}/biz-attr` | 业务属性读取 | 082,083,084,085 | 065,066 |
| 9 | PUT | `/api/data-sources/{id}/biz-attr` | 业务属性保存（只更新 `DATA_SOURCE_BIZ_ATTR`） | 086,087,088,089,109 | 067,068,069,070,101 |
| 10 | GET | `/api/data-sources/{sourceId}/naming-strategies` | 命名策略列表（无分页） | 071,072,073 | 072,073 |
| 11 | POST | `/api/data-sources/{sourceId}/naming-strategies` | 命名策略新增 | 064,065,067,074,076,077,078,079,080,106 | 074~082,084,105 |
| 12 | PUT | `/api/data-sources/{sourceId}/naming-strategies/{originalTargetId}` | 命名策略编辑（`originalTargetId`=原目标库 ID） | 064,065,067,074,078,079,080,081,106 | 078,079,080,081,084,085,105 |
| 13 | DELETE | `/api/data-sources/{sourceId}/naming-strategies/{targetId}` | 命名策略删除（只删对应 EXTEND 行） | 064,081 | 083 |

**路由规则说明**：`/api/data-sources/test-connection`、`/api/data-sources/target-options` 为字面量段，Spring MVC 的字面量路径优先级恒高于模板路径 `/api/data-sources/{id}`，因此不会与 `{id}` 冲突（与声明顺序无关）；实现时仍应保持静态段先声明。所有 ID 均按字符串传输。

**接口数量**：13 个。

---

## 2. 组合逻辑键接口（§7.2）

`CDC_DATA_SOURCE_EXTEND` 无物理主键、无唯一约束（已批准物理基线）。命名策略记录的定位必须使用原始逻辑键 `(DATA_SOURCE_ID, TARGET_DATA_SOURCE_ID)`，**不使用不存在的记录 ID，不伪造主键**。

| 操作 | 定位方式 | 请求携带 |
|---|---|---|
| 列表 | `GET .../{sourceId}/naming-strategies`，`sourceId` 即 `DATA_SOURCE_ID` | 无 |
| 新增 | 无（新增） | 新逻辑键：`sourceDataSourceId`（路径）+ `targetDataSourceId`（请求体，新目标库） |
| 编辑 | `PUT .../{sourceId}/naming-strategies/{originalTargetId}` | 原逻辑键：路径 `sourceId` + `originalTargetId`（原目标库 ID）；请求体携带**新目标库 ID** `targetDataSourceId`（若未切换目标库则与原目标 ID 相同） |
| 删除 | `DELETE .../{sourceId}/naming-strategies/{targetId}` | 原逻辑键：路径 `sourceId` + `targetId` |

**编辑时切换目标库的语义**：前端把"原目标库 ID"放在路径 `originalTargetId`，把"新目标库 ID"放在请求体 `targetDataSourceId`。后端先按 `(sourceId, originalTargetId)` 定位当前策略行，再校验"新逻辑键"不与已有其他行冲突（编辑排除当前行）。这满足 `DS-REQ-064`（逻辑键唯一）与 `DS-REQ-041` 同类的"只改目标行、不伪造主键"约束。

**计数语义（严格区分新增与编辑/删除）**：
- **新增**：按**新逻辑键** `(sourceId, targetDataSourceId)` 全量计数：0 行 → 允许执行 `INSERT`；1 行 → `40902` 逻辑键重复；≥2 行 → `40903` 存量多条异常；插入后校验受影响行数=1，否则回滚。新增流程不返回 `40401`。
- **编辑/删除（按逻辑键定位）**：要求匹配**恰好一行**：
  - 0 行 → `40401` 命名策略不存在；
  - ≥2 行 → `40903` 存量多条异常，阻止操作（与 `DS-REQ-066`/`067` 一致，不清理存量）。
  编辑时若新目标 ID 与原目标 ID 忽略大小写相同，不把当前行误判为重复；若逻辑键变化，按新逻辑键查重并排除原记录（0 行允许更新、1 行 → `40902`、≥2 行 → `40903`）。

---

## 3. 密码契约（§7.3）

| 场景 | 请求字段 | 响应字段 | 后端行为 |
|---|---|---|---|
| 新增 | `password` **必填** | 不含密码 | 校验 ≤64，trim 后写入 |
| 编辑（密码未修改） | `password` **缺席**（请求体不含该字段） | 详情不含真实密码 | 保留数据库原密码 |
| 编辑（密码已修改） | `password` 为 trim 后新密码 | 详情不含真实密码 | 覆盖原密码 |
| 测试连接（新增） | 使用请求体中的表单密码 | — | 临时连接使用该密码 |
| 测试连接（编辑未改密码） | `password` 缺席，携带 `originalDataSourceId`（编辑前原主键） | — | 后端只按 `originalDataSourceId` 定位 `FG_ACTIVE='1'` 记录并读取持久化原密码，仅本次临时连接使用；表单中可编辑的 `dataSourceId` 不得用于读取旧密码 |
| 测试连接（编辑已改密码） | `password` 为 trim 后新密码 | — | 临时连接使用该密码 |

- 掩码 `*********` 仅为前端 UI 状态；**前端绝不提交该字符串**，后端也不把任何字符串当作"保留旧密码"的魔法哨兵（`DS-REQ-044`/`046`/`045`）。
- 任何响应（列表、详情、业务属性、命名策略、测试连接）均不含密码或敏感连接串（`DS-REQ-042`/`043`/`047`/`107`）。
- 测试连接读取持久化密码仅发生在后端临时连接构建阶段，不进入日志、响应、异常（`DS-REQ-051`/`052`）。
- `originalDataSourceId` 与表单可编辑 `dataSourceId` 语义分离：前者为打开编辑弹窗时的原始主键（只读，用于定位记录与读取持久化密码），后者为用户可修改的新值（用于最终保存）。测试连接未改密码时只按 `originalDataSourceId` 读取旧密码。

---

## 4. 请求/响应字段（§7.4）

### 4.0 通用响应结构

所有接口（除测试连接失败结果外）统一返回：

```json
{
  "code": 200,
  "message": "success",
  "data": { ... },
  "timestamp": "2026-08-29T10:00:00"
}
```

- 成功：HTTP 200，`code=200`。
- 业务失败：HTTP 200，`code=业务码`（见 §5），`data=null`。
- 参数校验失败：HTTP 400，`code=400`。
- 未知异常：HTTP 500，`code=500`，`message="服务器内部错误"`。

### 4.1 GET /api/data-sources（列表）

请求参数（query，均可选，忽略大小写模糊，多条件 AND，先 trim）：

| 参数 | 类型 | 必填 | 说明 |
|---|---|---|---|
| `id` | string | 否 | 数据源 ID 模糊 |
| `name` | string | 否 | 数据源名称模糊 |
| `host` | string | 否 | 主机地址模糊 |

不接受 `pageNum`/`pageSize` 等分页参数；后端固定 `FG_ACTIVE='1'` 过滤、按 `DATA_SOURCE_ID` 升序。

响应 `data`：直接为数组，**非分页结构**：

```json
[
  {
    "dataSourceId": "DS01",
    "dataSourceName": "源库A",
    "dataSourceCategory": "SOURCE",
    "dataSourceType": "ORACLE",
    "host": "10.0.0.1",
    "port": 1521,
    "serviceName": "prod",
    "userName": "cdc"
  }
]
```

- 不含密码、`dataSourceOrg`、`bizAttr`、`dataSourceDomain`、`fgActive`、时间字段、`sourceApp`（`DS-REQ-011`/`012`）。
- `port` 为 JSON number；`dataSourceCategory` 为规范化 `SOURCE`/`TARGET`（后端忽略大小写识别存量后输出）。

### 4.2 GET /api/data-sources/{id}（详情）

响应 `data`：

```json
{
  "dataSourceId": "DS01",
  "dataSourceName": "源库A",
  "dataSourceCategory": "SOURCE",
  "dataSourceType": "ORACLE",
  "host": "10.0.0.1",
  "port": 1521,
  "serviceName": "prod",
  "userName": "cdc"
}
```

不含真实密码（`DS-REQ-043`）；前端据此初始化为"密码未修改"状态。`port` 为 JSON number；`dataSourceCategory` 为规范化 `SOURCE`/`TARGET`。后端按 `DATA_SOURCE_ID=? AND FG_ACTIVE='1'` 定位；`id` 不存在或 `FG_ACTIVE!='1'`（视为不存在）→ `40400`。

### 4.3 POST /api/data-sources（新增）

请求体：

```json
{
  "dataSourceId": "DS01",
  "dataSourceName": "源库A",
  "dataSourceCategory": "SOURCE",
  "dataSourceType": "ORACLE",
  "host": "10.0.0.1",
  "port": 1521,
  "userName": "cdc",
  "password": "secret",
  "serviceName": "prod"
}
```

字段规则（全部字符串 trim，唯一例外 `bizAttr` 不在此接口）：

| 字段 | 必填 | 类型/长度 | 值域/格式 |
|---|---|---|---|
| `dataSourceId` | 是 | string ≤32 | 仅 `[A-Za-z0-9_-]` |
| `dataSourceName` | 是 | string ≤30 | — |
| `dataSourceCategory` | 是 | string | `SOURCE` / `TARGET` |
| `dataSourceType` | 是 | string | 源库仅 `ORACLE`；目标库 `ORACLE`/`MYSQL`/`DORIS` |
| `host` | 是 | string ≤64 | IP/域名/主机名 |
| `port` | 是 | int | 1–65535 |
| `userName` | 是 | string ≤64 | — |
| `password` | 是 | string ≤64 | 新增必填 |
| `serviceName` | 是 | string ≤64 | — |

- 类别字段只接受 `SOURCE`/`TARGET`，后端保存为统一大写（`DS-REQ-023`）；`port` 为 JSON number / Java `Integer`，后端 DTO 独立校验整数 1..65535，持久化边界做 `Integer ↔ 十进制字符串` 转换（数据库列 `VARCHAR2(64)`，不 DDL，见 `DATABASE.md` §1.1）。

后端：校验必填/长度/值域/角色-类型联动/ID+名称查重；插入 `CDC_DATA_SOURCE` 时写 `FG_ACTIVE='1'`、`DATA_SOURCE_ORG=DATA_SOURCE_NAME`，不写其他表。响应 `data` 为新记录 `dataSourceId`。

### 4.4 PUT /api/data-sources/{originalId}（编辑）

`originalId` = 编辑前原 `DATA_SOURCE_ID`（用于定位主表当前记录；ID 可修改，见 `DS-REQ-021`）。前端在打开编辑弹窗时单独保存不可编辑的 `originalDataSourceId`（即 `originalId`）；表单中的 `dataSourceId` 为可修改的新值，不作为读取持久化旧密码的定位键（测试连接见 §4.6）。

请求体：同 §4.3，但 **`password` 可缺席**（未修改时缺席，见 §3）；`dataSourceId` 若改变表示修改 ID；类别只接受 `SOURCE`/`TARGET` 并保存统一大写。

后端：按原 ID 且 `FG_ACTIVE='1'` 定位主表当前记录；`originalId` 不存在或 `FG_ACTIVE!='1'`（视为不存在）→ `40400`，不更新。UPDATE 的 WHERE 与受影响行数校验保证只操作该有效记录。只更新主表当前记录；隐藏字段保留原值（`dataSourceOrg`、`sourceApp`、`dataSourceDomain`、`fgActive`、时间字段）；修改 ID 只改主表、不同步 EXTEND 或其他表（`DS-REQ-038`~`041`）。查重排除当前记录（`DS-REQ-035`）。响应 `data` 为编辑后 `dataSourceId`。

### 4.5 DELETE /api/data-sources/{id}（删除）

路径参数 `id` = `DATA_SOURCE_ID`。后端只允许物理删除 `DATA_SOURCE_ID=? AND FG_ACTIVE='1'` 的当前记录；`id` 不存在或 `FG_ACTIVE!='1'`（视为不存在）→ `40400`。这仍是物理删除，不是修改 `FG_ACTIVE`（`DS-REQ-092`/`093`/`097`）。不检查/不级联 EXTEND 或其他表（`DS-REQ-094`/`095`）。响应 `data=null`。

### 4.6 POST /api/data-sources/test-connection（测试连接）

请求体（编辑未改密码场景示例：`password` 缺席，携带 `originalDataSourceId`）：

```json
{
  "originalDataSourceId": "DS01",
  "dataSourceType": "ORACLE",
  "host": "10.0.0.1",
  "port": 1521,
  "userName": "cdc",
  "serviceName": "prod"
}
```

- `dataSourceId`：可缺席（新增场景亦可不带，仅为上下文），**不得用作读取持久化密码的定位键**。
- `originalDataSourceId`：可缺席（新增场景缺席，此时 `password` 必填）；编辑未改密码场景**必填**，后端只按它定位 `FG_ACTIVE='1'` 记录并读取持久化密码（`DS-REQ-051`/`052`）。
- `password`：可缺席（编辑未改密码场景缺席，此时必须携带 `originalDataSourceId`）；新增场景必填；编辑已改密码场景为 trim 后新密码。
- `port` 为 JSON number（Java `Integer`），1..65535；字段校验与 §4.3 一致；非法类型 → `40002`；按 `originalDataSourceId` 定位不到 `FG_ACTIVE='1'` 记录 → `40400`。

响应 `data`（连接成功与失败均返回该结构，HTTP 200；**失败不抛业务异常**）：

```json
{
  "success": true,
  "message": "连接成功"
}
```

- 成功：`success=true`，`message="连接成功"`（`DS-REQ-058`）。
- 失败（认证失败/超时/不可达/驱动不支持等）：`success=false`，`message` 为脱敏简短原因（如"连接失败：认证失败"），不返回原始堆栈、密码或敏感连接串（`DS-REQ-059`/`107`）。
- 后端 10 秒超时、不重试（`DS-REQ-054`）；一次临时连接、不用应用连接池、探活 `SELECT 1 FROM DUAL`/`SELECT 1`、用完关闭（`DS-REQ-052`/`053`）；不写业务数据（`DS-REQ-061`）。

### 4.7 GET /api/data-sources/target-options（目标库候选）

响应 `data`（`FG_ACTIVE='1' AND DATA_SOURCE_CATEGORY='TARGET'` 的大小写兼容查询的全部记录，返回规范化 `SOURCE`/`TARGET`）：

```json
[
  {
    "dataSourceId": "TG01",
    "dataSourceName": "目标库A",
    "dataSourceType": "ORACLE"
  }
]
```

### 4.8 GET /api/data-sources/{id}/biz-attr（业务属性读取）

响应 `data`：

```json
{
  "dataSourceId": "TG01",
  "bizAttr": "{\"env\":\"dev\"}"
}
```

- `bizAttr` 原样返回，不 trim、不校验 JSON。
- 后端先按 `DATA_SOURCE_ID=? AND FG_ACTIVE='1'` 定位记录；不存在或 `FG_ACTIVE!='1'`（视为不存在）→ `40400`。记录存在且有效后，再校验当前角色为 `TARGET`（按 `UPPER(DATA_SOURCE_CATEGORY)='TARGET'` 识别）；存在且有效但角色不是 TARGET → `40006`。

### 4.9 PUT /api/data-sources/{id}/biz-attr（业务属性保存）

请求体：

```json
{
  "bizAttr": "{\"env\":\"dev\"}"
}
```

- `bizAttr` 可为空字符串；原样保存，不 trim、不校验 JSON（`DS-REQ-086`/`087`/`088`）。
- 后端先按 `DATA_SOURCE_ID=? AND FG_ACTIVE='1'` 定位记录；不存在或 `FG_ACTIVE!='1'`（视为不存在）→ `40400`。记录存在且有效后，再校验当前角色为 `TARGET`（按 `UPPER(DATA_SOURCE_CATEGORY)='TARGET'` 识别）；存在且有效但角色不是 TARGET → `40006`。
- 后端只更新主表当前记录 `DATA_SOURCE_BIZ_ATTR` 一列，不触碰其他字段/表（`DS-REQ-109`）。响应 `data=null`。

### 4.10 GET /api/data-sources/{sourceId}/naming-strategies（命名策略列表）

路径参数 `sourceId` = 源库 `DATA_SOURCE_ID`。后端先按 `DATA_SOURCE_ID=? AND FG_ACTIVE='1'` 定位 `sourceId` 记录；不存在或 `FG_ACTIVE!='1'`（视为不存在）→ `40400`。记录存在且有效后，再校验当前角色为 `SOURCE`（按 `UPPER(DATA_SOURCE_CATEGORY)='SOURCE'` 识别）；存在且有效但角色不是 SOURCE → `40006`。响应 `data`（无分页，按目标库 ID 升序）：

```json
[
  {
    "sourceDataSourceId": "DS01",
    "targetDataSourceId": "TG01",
    "targetDataSourceName": "目标库A",
    "targetDataSourceType": "ORACLE",
    "tableNamingStrategy": "CUSTOM_PREFIX_SUFFIX",
    "tableNamePrefix": "cdc_",
    "tableNameSuffix": "_bak"
  }
]
```

`targetDataSourceName`/`targetDataSourceType` 为展示用派生字段，由后端一次目标库查询映射（避免 N+1，见 `DESIGN.md` §8）。

### 4.11 POST /api/data-sources/{sourceId}/naming-strategies（命名策略新增）

请求体：

```json
{
  "targetDataSourceId": "TG01",
  "tableNamingStrategy": "CUSTOM_PREFIX_SUFFIX",
  "tableNamePrefix": "cdc_",
  "tableNameSuffix": "_bak"
}
```

字段规则：

| 字段 | 必填 | 类型/长度 | 说明 |
|---|---|---|---|
| `targetDataSourceId` | 是 | string ≤32（业务） | 必须为有效目标库（`FG_ACTIVE='1' AND CATEGORY='TARGET'`，否则 `40005`）；物理列 `VARCHAR2(128)` 事实见 `DATABASE.md` §1.2 |
| `tableNamingStrategy` | 是 | string | `TABLE_MERGE` / `CUSTOM_PREFIX_SUFFIX` |
| `tableNamePrefix` | 否* | string ≤128 | `TABLE_MERGE` 时清空；`CUSTOM_PREFIX_SUFFIX` 时必填 |
| `tableNameSuffix` | 否* | string ≤128 | 同上 |

*必填规则按策略联动（`DS-REQ-079`/`080`）；前后缀 trim。后端先按 `DATA_SOURCE_ID=? AND FG_ACTIVE='1'` 校验 `sourceId` 记录：不存在或非 `'1'` → `40400`；存在且有效但角色不是 `SOURCE` → `40006`。再校验新目标库 `targetDataSourceId`：不存在、`FG_ACTIVE!='1'` 或不是 `TARGET` 一律 → `40005`（不使用 `40006`）。然后按**新逻辑键** `(sourceId, targetDataSourceId)` 全量计数：0 行允许执行 `INSERT`；已存在 1 条 → `40902`；已存在多条 → `40903`。插入后校验受影响行数=1，否则回滚。新增流程不返回 `40401`。响应 `data=null`。

### 4.12 PUT /api/data-sources/{sourceId}/naming-strategies/{originalTargetId}（命名策略编辑）

请求体：同 §4.11，其中 `targetDataSourceId` 为**新目标库 ID**（未切换则与原值相同）。后端先按 `DATA_SOURCE_ID=? AND FG_ACTIVE='1'` 校验 `sourceId` 记录：不存在或非 `'1'` → `40400`；存在且有效但角色不是 `SOURCE` → `40006`。新目标库校验失败（不存在、未启用或不是 TARGET）一律 → `40005`。按原逻辑键 `(sourceId, originalTargetId)` 先执行 `COUNT(*)`：0 行 → `40401`；≥2 行 → `40903`；只有计数恰好为 1 才执行 DML，且 DML 后校验受影响行数=1。若新目标 ID 与原目标 ID 忽略大小写相同，不把当前行误判为重复；若逻辑键变化，按新逻辑键 `(sourceId, targetDataSourceId)` 查重并排除原记录（0 行允许更新；1 行 → `40902`；≥2 行 → `40903`）。响应 `data=null`。

### 4.13 DELETE /api/data-sources/{sourceId}/naming-strategies/{targetId}（命名策略删除）

路径参数为原逻辑键。后端先按 `DATA_SOURCE_ID=? AND FG_ACTIVE='1'` 校验 `sourceId` 记录：不存在或非 `'1'` → `40400`；存在且有效但角色不是 `SOURCE` → `40006`。按原逻辑键 `(sourceId, targetId)` 先执行 `COUNT(*)`：0 行 → `40401`；≥2 行 → `40903`（不清理存量）；只有计数恰好为 1 才执行 DML，且 DML 后校验受影响行数=1。响应 `data=null`。

---

## 5. 错误契约（§7.5）

### 5.1 通用 HTTP 状态与结构（结合真实 `ApiResponse`/`GlobalExceptionHandler`）

| 场景 | HTTP | code | 结构 |
|---|---|---|---|
| 成功 | 200 | 200 | `ApiResponse`，`message="success"` |
| 业务异常（`BusinessException`） | 200 | 业务码 | `ApiResponse.fail(业务码, 业务消息)` |
| Bean 校验（`MethodArgumentNotValidException`/`ConstraintViolationException`） | 400 | 400 | 校验字段消息 |
| 参数类型不匹配 | 400 | 400 | `参数类型错误: <name>` |
| 未知异常 | 500 | 500 | `服务器内部错误` |

> 注意：`GlobalExceptionHandler` 对 `BusinessException` 以 `log.warn` 记录 `code` 与 `message`。因此业务消息必须**不含密码、敏感连接串或堆栈**，确保日志不泄露（`DS-REQ-047`/`107`）。测试连接失败不抛业务异常，走 §4.6 的脱敏结果对象。

### 5.2 业务码清单（复用 + 新增 + 废弃）

**复用现有码：**

| code | 含义 | 触发 |
|---|---|---|
| 40400 | 数据源不存在 | 主详情/编辑/删除/业务属性/测试连接/命名策略的 `sourceId`（或 `{id}`/`originalDataSourceId`）对应记录不存在，或该主记录 `FG_ACTIVE!='1'`（按批准规则视为不存在） |
| 40900 | 数据源 ID 重复 | 新增/编辑 ID 查重冲突（`DS-REQ-032`/`035`） |
| 40901 | 数据源名称重复 | 新增/编辑名称查重冲突（`DS-REQ-033`/`035`） |
| 40001 | 角色非法 | 仅用于新增/编辑主表请求中 `dataSourceCategory` 非 `SOURCE`/`TARGET` |
| 40002 | 数据库类型非法 | 类型非 `ORACLE`/`MYSQL`/`DORIS` 或与角色不匹配 |
| 40003 | 命名策略无效 | `tableNamingStrategy` 非 `TABLE_MERGE`/`CUSTOM_PREFIX_SUFFIX` |
| 50000 | 保存失败 | 新增/编辑/业务属性/命名策略写入异常 |
| 50001 | 删除失败 | 删除主数据源/命名策略异常 |

**新增码：**

| code | 含义 | 触发 |
|---|---|---|
| 40005 | 目标库无效 | 命名策略新增/编辑请求中的 `targetDataSourceId` 不存在、`FG_ACTIVE!='1'` 或角色不是 `TARGET`；新目标库校验失败一律使用 `40005`，不得使用 `40006` |
| 40006 | 数据源角色不适用于当前操作 | 业务属性接口中的主记录存在且有效但角色不是 `TARGET`；命名策略接口中的 `sourceId` 主记录存在且有效但角色不是 `SOURCE`。目标候选列表只是过滤并返回有效 TARGET，不存在"某条目标候选角色不符返回 40006"的场景 |
| 40401 | 命名策略不存在 | 按逻辑键编辑/删除定位不到记录 |
| 40902 | 命名策略逻辑键重复 | 新增/编辑使 `(sourceId, targetDataSourceId)` 与已有行重复 |
| 40903 | 命名策略存量多条异常 | 按逻辑键定位出现 ≥2 行（保存/编辑/删除被阻止，不清理存量） |

**业务码优先级（互斥）**：
- `40400`：主记录不存在或 `FG_ACTIVE!='1'`（按批准规则视为不存在）——主详情/编辑/删除/业务属性/测试连接/命名策略的 `sourceId`。
- `40006`：主记录存在且有效，但角色不适用于当前操作——业务属性须 `TARGET`、命名策略入口须 `SOURCE`。
- `40005`：命名策略新增/编辑的新目标库无效（不存在、未启用或不是 TARGET），一律 `40005`，不使用 `40006`。
- `40001`：仅用于新增/编辑主表请求中 `dataSourceCategory` 值非法。

**废弃码（旧候选语义随目标需求移除）：**

| code | 旧含义 | 废弃原因 |
|---|---|---|
| 40004 | 扩展配置不能为空（`EXTEND_REQUIRED`） | 一对一必填 EXTEND 语义被 `DS-REQ-062`/`063` 取代（源库 0..N 命名策略） |
| 50002 | 状态操作失败（`STATUS_FAILED`） | 启用/停用能力移除（`DS-REQ-003`/`091`） |

### 5.3 场景 → 码/消息

| 场景 | 结果 |
|---|---|
| 数据源不存在或 inactive（主详情/编辑/删除/业务属性/测试连接/命名策略 `sourceId` 定位） | HTTP 200，`40400`，消息"数据源不存在: <id>" |
| ID/名称重复 | HTTP 200，`40900`/`40901`，消息"数据源ID已存在: <id>"/"数据源名称已存在: <name>" |
| 字段校验失败（必填/超长/非法值域） | HTTP 400，`400`，字段级消息 |
| 角色—类型非法 | HTTP 200，`40001`/`40002`，消息"数据源类别只能为SOURCE或TARGET"/"数据库类型只能为ORACLE、MYSQL或DORIS" |
| 命名策略逻辑键重复 | HTTP 200，`40902`，消息如"该源库到该目标库的命名策略已存在" |
| 命名策略存量多条异常 | HTTP 200，`40903`，消息如"检测到重复命名策略数据，保存被阻止" |
| 目标库无效（命名策略新增/编辑的新目标库不存在、未启用或非 TARGET） | HTTP 200，`40005`，消息"目标库无效或已停用" |
| 数据源角色不适用于当前操作（主记录有效但角色非本次操作所需：业务属性须 TARGET、命名策略入口须 SOURCE） | HTTP 200，`40006`，消息"数据源角色不适用于当前操作" |
| 保存/删除失败 | HTTP 200，`50000`/`50001`，通用失败消息 |
| 测试连接失败 | HTTP 200，`data.success=false` + 脱敏消息（不抛业务异常） |
| 未知异常 | HTTP 500，`500`，"服务器内部错误" |

---

## 6. 兼容性（§7.6）

### 6.1 当前既有接口（`DataSourceController`，仓库内证据）与目标接口差异

| 现有接口 | 目标处理 |
|---|---|
| `GET /api/data-sources`（分页 `PageResult`） | **替换**为无分页列表（§4.1），删除 `pageNum`/`pageSize` |
| `GET /api/data-sources/{id}`（详情） | 保留路径，返回结构收敛（不含密码），兼容 |
| `POST /api/data-sources`（强校验 `extend` 必填） | **替换**请求体：删除 `dataSourceOrg`、`extend`；新增字段集（§4.3）；不再联写 EXTEND |
| `PUT /api/data-sources/{originalId}`（含 ID 同步/联写） | **替换**请求体与后端行为：只改主表当前记录，不同步/不联写 |
| `DELETE /api/data-sources/{id}`（先删 EXTEND 再删主表） | **替换**后端行为：只物理删主表当前记录，不级联 |
| `PUT /api/data-sources/{id}/enable` | **删除**（无启用/停用能力，`DS-REQ-003`） |
| `PUT /api/data-sources/{id}/disable` | **删除** |
| （无） | **新增**：测试连接、目标候选、业务属性读写、命名策略 CRUD（§4.6~§4.13） |

### 6.2 仓库内调用者扫描

- 后端：`DataSourceController` 是 `/api/data-sources` 的**唯一**后端入口；`backend/src/test/.../DataSourceControllerTest.java` 覆盖旧 7 接口（含 enable/disable），实现阶段须同步适配到目标接口（本任务不修改测试）。
- 前端：当前 `DataSourcePage.vue` 为占位页，路由/菜单保持既有值不变，**无真实调用者**；旧历史候选文档 `docs/api/data-source-api.md` 描述的旧接口将被目标接口取代。
- 本设计只能陈述**仓库内证据**；不声明外部系统无调用者。兼容策略：旧的分页/启停/一对一 EXTEND 接口语义不再提供；如有仓库外调用者，须由用户评估迁移（不在本任务范围）。

### 6.3 契约调整说明（本草案相对旧候选/历史文档）

- **端口类型**：目标契约 `port` 为 JSON number / Java `Integer`（示例 `1521`）；旧候选/历史文档若以字符串形式返回或存储端口属现状差距，实现阶段在持久化边界做 `Integer ↔ 十进制字符串` 转换（数据库列 `VARCHAR2(64)` 不变，不 DDL）。
- **测试连接密码读取**：编辑未改密码场景使用独立字段 `originalDataSourceId` 读取持久化密码，不复用表单可编辑 `dataSourceId`。
- **角色大小写兼容**：写入统一大写、读取忽略大小写规范化为 `SOURCE`/`TARGET`；业务属性/命名策略接口在角色不符时返回 `40006`。

---

## 7. 追踪（§7.7）

- 接口 → DS-REQ / DS-AC 映射见 §1 总表。
- 接口字段命名与 `DESIGN.md`、`UI.md`、`DATABASE.md` 保持同一套 camelCase 字段与数据库列映射（见 `DATABASE.md` §9.1）。
- 密码状态模型（缺席/提供）与 `DESIGN.md` §5、`UI.md` §8.3 一致；逻辑组合键语义与 `DESIGN.md` §4、`DATABASE.md` §9.3 一致；超时/倒计时（10 秒 / 10→0）与 `DESIGN.md` §6、`UI.md` §8.3 一致；错误码与 `DATABASE.md` 操作矩阵一致。

---

## 8. 批准收口变更记录（2026-08-29）

- 2026-08-29；
- 文档状态由 `DRAFT_PENDING_USER_REVIEW` 转为 `APPROVED`；
- 技术/产品正文不变；
- 实现状态仍为 `NOT_STARTED`；
- 106 条验收仍为 `NOT_RUN`；
- 依据为本批准任务 `DATA-SOURCE-DESIGN-APPROVAL-CLOSEOUT-001` 及 `fdb9ecaf5bc24373e586d853b4174d1a9cd8bbfc` 最终复审通过基准。
