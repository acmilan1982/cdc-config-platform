# 数据源管理 —— API 设计基线（API.md）

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

> **本轮新草案接口增量提示（§11，`DRAFT_PENDING_USER_REVIEW`）**：本轮拟新增 2 个独立启停接口（`PUT /api/data-sources/{id}/enable`、`PUT /api/data-sources/{id}/disable`），接口数量由 13 增至 **15**（详见 §11.1）。§11 为**未批准、未实现**的草案；本表 13 个接口的路径、契约与既有结论**逐字冻结、未修改**。同时 §4.1 的“后端固定 `FG_ACTIVE='1'` 过滤”与 `DataSourceListVO` 不含 `fgActive` 两处结论，以及 §5.2 中 `50002` 的“废弃”状态、§6.1 中两条启停接口的“**删除**”处理，均由 §11 局部替代（替代边界见 §11.7），未在此处静默改写。

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

> **本轮新草案局部替代提示（§11，`DRAFT_PENDING_USER_REVIEW`）**：上两处结论被局部替代——① “后端固定 `FG_ACTIVE='1'` 过滤”改为“**返回 `CDC_DATA_SOURCE` 全部记录，不过滤 `FG_ACTIVE`**”（`DS-REQ-150`）；② 响应字段清单**新增** `fgActive`（返回**原始值**，`'1'`/`'0'`/`NULL`/其他历史值均原样返回，不静默归一化）（`DS-REQ-151`/`DS-REQ-154`）。**不被替代**：不含密码等敏感字段、不含时间字段与 `sourceApp` 的结论继续有效（`DS-REQ-181` 重申）；`port` 为 number、`dataSourceCategory` 规范化的结论继续有效；无分页、`DATA_SOURCE_ID` 升序、三条件模糊查询与 `category` 过滤继续有效。详细契约见 §11.2。

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

> **本轮新草案对 `50002` 的局部替代提示（§11，`DRAFT_PENDING_USER_REVIEW`）**：本轮恢复启用/停用能力（`DS-REQ-168`~`DS-REQ-173`），因此 `50002`（`STATUS_FAILED`）**由“废弃码”恢复为“生效码”**，语义收敛为“启停接口 `UPDATE` 影响行数 ≠ 1（保存/状态操作失败），事务回滚”（见 §11.4）。上表“废弃原因”描述的是**历史**结论，本轮不作改写；`40004`（`EXTEND_REQUIRED`）的废弃结论**继续有效**、不受本轮影响。本轮**唯一新增**业务码为 `40250`（非法状态，仅 `enable` 遇到 `NULL`/非 `0`/`1` 时返回），其余启停错误一律复用既有码。

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

> **本轮新草案局部替代提示（§11，`DRAFT_PENDING_USER_REVIEW`）**：上表两条 `PUT /api/data-sources/{id}/enable`、`PUT /api/data-sources/{id}/disable` 的“**删除**”处理，被 `DS-REQ-168`~`DS-REQ-173` **局部替代**为“**保留路径风格、重新提供能力**”，但语义收敛为“**只更新主表 `FG_ACTIVE` 的独立接口**（启用写 `'1'`、停用写 `'0'`），不联写、不级联、不访问源库、不操作进程/ZK/Kafka”（§11.1/§11.3）。替代边界：旧候选实现对这两条接口的**旧语义**（一对一 EXTEND 联写等）仍按原结论**移除**；本表其余各行（无分页列表替换、详情收敛、新增/编辑/删除不联写）**继续有效**，不被本轮替代。

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

---

## 9. 角色查询参数（`APPROVED`，`IMPLEMENTED_PENDING_USER_REVIEW`）

> 状态：`APPROVED`。本轮调整基线分层状态：`adjustment_api_status=APPROVED`、`adjustment_baseline_status=APPROVED`、`implementation_status=IMPLEMENTED_PENDING_USER_REVIEW`、`implementation_authorization_status=GRANTED_IN_THIS_TASK`、`formal_acceptance_execution_status=NOT_RUN`、`new_adjustment_acceptance_status=ALL_NOT_RUN`。本节为任务 `DATA-SOURCE-LIST-PAGE-SELECTIVE-QUERY-LIST-INTEGRATION-BASELINE-001` 形成的 API 设计基线，**已获批准**，并已由 `DATA-SOURCE-LIST-PAGE-SELECTIVE-QUERY-LIST-INTEGRATION-IMPLEMENTATION-001` 实现，**尚未验收**。
> 批准链（2026-09-19）：初版草案提交 `01680ee527b8e35cd4afd84c4789b862d34f7a77` → R1 修订提交 `c3fd460bea64a14ccc7b52a554194a133330e29d` → ChatGPT 远程 Git R1 复审结论 `REVIEW_PASS` → 项目负责人 2026-09-19 明确回复“批准这轮调整基线”；批准任务 `DATA-SOURCE-LIST-PAGE-SELECTIVE-QUERY-LIST-INTEGRATION-APPROVAL-CLOSEOUT-001`。
> 实现**不代表**已验收或生产可用：实现状态为 `IMPLEMENTED_PENDING_USER_REVIEW`；实现落在 `DataSourceQuery`、`DataSourceController`（局部 `@ExceptionHandler`）与 `DataSourceServiceImpl`，未修改 `GlobalExceptionHandler`。
> 本节只对 `GET /api/data-sources` 列表接口**追加一个可选参数**；§4.1 既有三参数、无分页结构、响应字段与 `FG_ACTIVE='1'` 过滤等结论**继续有效**，不被替代。
> 关联需求 `DS-REQ-128`；关联验收 `DS-AC-120`~`DS-AC-124`、`DS-AC-139`（全部 `NOT_RUN`）。

### 9.1 参数定义

`GET /api/data-sources` 在既有 `id` / `name` / `host` 之外，追加可选查询参数：

| 参数 | 类型 | 必填 | 合法值 | 说明 |
|---|---|---|---|---|
| `category` | string | 否 | 精确大写 `SOURCE` / `TARGET` | 按数据源角色过滤；**缺席、`null`、空字符串或仅空白 = 不做角色限制（“全部”）**；非空值**不自动转大写** |

- **命名依据**：当前列表查询对象为 `DataSourceQuery { id, name, host }`，项目既有习惯为“短小写单词”参数名；领域与代码中的角色术语为 `dataSourceCategory`/`DataSourceCategory`（规范化值 `SOURCE`/`TARGET`），故取 `category`。项目代码与数据库列中不存在名为 `role` 的术语，故**不采用** `role`。
- **归一化（绑定后、Bean Validation 前）**：先 `trim()` 去除首尾空白；`null` 或 trim 后空字符串统一转为 `null`，表示“全部”；非空值**不自动转大写**，只接受精确大写 `SOURCE` / `TARGET`。
- **取值来源**：必须使用规范化代码 `SOURCE` / `TARGET`；**不得**使用中文展示值（“源库/目标库”）作为查询值。后端沿用既有 `UPPER(DATA_SOURCE_CATEGORY)` 大小写兼容比较执行过滤（`DATABASE.md` §4）。
- **组合语义**：`category` 与任一非空文本条件 **AND** 组合；文本条件继续遵守 trim 与 `UPPER(col) LIKE UPPER('%'||?||'%')` 忽略大小写包含规则（§4.1、`DATABASE.md` §4）。
- **数据库影响**：无。不新增列、索引、约束或任何 DDL；仅对既有 `DATA_SOURCE_CATEGORY` 列增加一个可选过滤条件。

### 9.2 非法值行为与异常链路（R1 冻结方案）

非法值（例如 `category=FOO`、`category=source`）的处理**沿用当前统一参数校验契约**，与既有字段校验路径一致（§5.1）：

| 场景 | HTTP | code | 结构 |
|---|---|---|---|
| 非法 `category`（非精确大写 `SOURCE`/`TARGET`） | 400 | 400 | `ApiResponse.fail(400, "<字段级消息>")`：优先取 `category` 字段校验消息（如“角色仅支持 SOURCE 或 TARGET”），无法提取字段消息时使用明确的通用参数错误消息 |

- **异常类型**：`GET` 请求中 `@ModelAttribute` 的绑定/字段校验错误按 **`BindException`** 处理；**不得**再声称由 `MethodArgumentNotValidException` 承接（该绑定路径不产生该异常）。
- **校验约束**：归一化为空值后，以**允许 `null`** 的字段约束校验非空值，例如 `@Pattern(regexp = "SOURCE|TARGET", message = "角色仅支持 SOURCE 或 TARGET")`；Bean Validation 对 `null` 不判失败，故“全部”合法。
- **改动边界（冻结）**：在 `DataSourceController` 增加**功能局部**的 `@ExceptionHandler(BindException.class)`（与既有局部 `@ExceptionHandler(HttpMessageNotReadableException.class)` 同构）；**不得**扩大为全局异常处理器改造。该局部处理器返回既有统一错误结构（HTTP 400 / 业务码 400 / 字段级消息），**不泄露堆栈或内部实现细节**。
- **回归风险（须在实现阶段验证）**：`MethodArgumentNotValidException extends BindException`，而控制器局部 `@ExceptionHandler` 优先级高于 `@RestControllerAdvice`；该局部处理器必须保持既有请求体校验错误（`"field: msg; field: msg"` 拼接）的字段级消息语义，不得回归。
- **不新增业务错误码**。理由：§5.2 明确将既有 `40001`（角色非法）限定为“**仅用于新增/编辑主表请求中 `dataSourceCategory` 非 `SOURCE`/`TARGET`**”，不适用于列表查询参数；列表查询参数属“请求参数校验失败”范畴，应走上述 `BindException` → HTTP 400 / `code=400` 的统一契约。
- **不得静默转换**：不得把 `source` / `target` 等非法值自动转大写为合法值。
- **本轮不改代码**：本 R1 只冻结实现方案，不实际修改 `DataSourceQuery`、`DataSourceController` 或任何异常处理代码。若实现阶段统一响应类字段名与“code/message”称谓不同，应使用仓库实际字段名，但必须保持 HTTP 400、业务码 400 与字段级消息语义。
- 该设计保持与 `DS-AC-105` 确立的“非法参数返回 HTTP 400 而非 500”方向一致，并避免在只读查询路径上引入 CRUD 语义的业务码。

### 9.3 与 §4.1 的差异摘要

| 项目 | §4.1（既有 `APPROVED`） | §9（本轮草案） |
|---|---|---|
| 查询参数 | `id` / `name` / `host`（均可选） | 追加可选 `category`（`SOURCE`/`TARGET`）；三者不变 |
| 角色限制 | 无 | `category` 缺席/`null`/空/仅空白 = 全部；提供时按精确大写规范化代码过滤 |
| 分页 | 不接受 `pageNum`/`pageSize` | **不变**（继续不接受） |
| 响应结构 | 数组、非分页 | **不变** |
| `FG_ACTIVE` 过滤与排序 | `FG_ACTIVE='1'`、按 `DATA_SOURCE_ID` 升序 | **不变** |
| 校验失败 | §5.1 统一契约 | `category` 非法按 `BindException` 走同一契约（HTTP 400 / `code=400` / 字段级消息） |

### 9.4 需求追踪（`DS-REQ-128`）

| 需求 | 落点 |
|---|---|
| DS-REQ-128 | §9.1（可选参数、缺席/`null`/空/仅空白=全部、非空仅精确大写 `SOURCE`/`TARGET`、不自动转大写、命名一致性）、§9.2（归一化时机、允许 `null` 的 `@Pattern`、`BindException` 异常链路、控制器局部处理器边界、字段级消息与通用兜底、回归风险、不新增业务码、本轮不改代码）、§9.3（无数据库结构变化、校验失败口径） |

### 9.5 变更记录（R1 定向修订）

| 日期 | 变更 | 依据 |
|---|---|---|
| 2026-09-19 | R1 定向修订（ChatGPT 远程独立复审）：§9.1 明确归一化顺序（`trim()` → 空转 `null` → 不自动转大写）与“精确大写 `SOURCE`/`TARGET`”取值；§9.2 由按 `MethodArgumentNotValidException` 承接改为按 **`BindException`** 承接，补充允许 `null` 的 `@Pattern(regexp="SOURCE|TARGET")` 约束、`DataSourceController` 功能局部 `@ExceptionHandler(BindException.class)` 的改动边界与统一错误结构（HTTP 400 / `code=400` / 优先 `category` 字段消息 + 通用兜底 / 不泄露堆栈）、`MethodArgumentNotValidException extends BindException` 的局部处理器优先级回归风险、以及“本轮只冻结方案、不改代码”；§9.3 同步校验失败口径。§9 参数名、无分页、无数据库结构变化等结论未变 | DATA-SOURCE-LIST-PAGE-SELECTIVE-QUERY-LIST-INTEGRATION-BASELINE-001-R1（ChatGPT 远程复审定向修订；纯文档任务） |

## 10. 本轮调整变更记录（2026-09-19）

- 2026-09-19；
- 新增 §9「角色查询参数草案（`DRAFT_PENDING_USER_REVIEW`，未实现）」；
- §0~§8 既有 `APPROVED` API 基线逐字冻结、未修改；
- 实现状态仍为 `NOT_STARTED`（本轮为纯文档草案，未修改任何 `.vue`/`.ts`/`.java`/测试/依赖/配置/SQL，未访问数据库/ZK/Kafka，未启动服务）；
- 本轮新增验收 `DS-AC-116~140` 均为 `NOT_RUN`；既有正式复验统计 `PASS=113/FAIL=0/BLOCKED=2/NOT_RUN=0` 逐字保留；
- 依据任务 `DATA-SOURCE-LIST-PAGE-SELECTIVE-QUERY-LIST-INTEGRATION-BASELINE-001`；
- R1 定向修订见 §9.5（ChatGPT 远程复审四项问题之 `category` 归一化/校验/异常映射；`DS-REQ-128` 编号与数量未变）。
- 2026-09-19 批准收口（任务 `DATA-SOURCE-LIST-PAGE-SELECTIVE-QUERY-LIST-INTEGRATION-APPROVAL-CLOSEOUT-001`）：§9 章节标题与状态声明由 `DRAFT_PENDING_USER_REVIEW` 收口为 `APPROVED`（`adjustment_api_status=APPROVED`）；记录批准链（初版草案提交 `01680ee5...` → R1 修订提交 `c3fd460b...` → ChatGPT 远程 Git R1 复审 `REVIEW_PASS` → 项目负责人 2026-09-19 明确回复“批准这轮调整基线”）；§9.1~§9.4 技术正文与 R1 冻结方案（`category` 归一化、允许 `null` 的 `@Pattern`、`BindException` → 控制器局部 `@ExceptionHandler` → HTTP 400 / `code=400` / 字段级消息、不新增业务码、不自动转大写、本轮不改代码）**零变化**；§0~§8 既有 `APPROVED` API 基线逐字冻结；实现状态仍为 `NOT_STARTED`、实现授权 `NOT_GRANTED_IN_THIS_TASK`、本轮新增验收 `DS-AC-116~140` 仍全部 `NOT_RUN`；既有统计 `PASS=113/FAIL=0/BLOCKED=2/NOT_RUN=0` 逐字保留。
- 2026-09-19 实现状态回写（任务 `DATA-SOURCE-LIST-PAGE-SELECTIVE-QUERY-LIST-INTEGRATION-IMPLEMENTATION-001`）：§9 章节标题改为“（`APPROVED`，`IMPLEMENTED_PENDING_USER_REVIEW`）”，状态声明由 `implementation_status=NOT_STARTED`/`implementation_authorization_status=NOT_GRANTED_IN_THIS_TASK`/`acceptance_execution_status=ALL_NOT_RUN` 更新为 `implementation_status=IMPLEMENTED_PENDING_USER_REVIEW`/`implementation_authorization_status=GRANTED_IN_THIS_TASK`/`formal_acceptance_execution_status=NOT_RUN`/`new_adjustment_acceptance_status=ALL_NOT_RUN`；实现按 §9 已批准契约落地：`DataSourceQuery` 新增可选 `category`（`trim()` → 空转 `null` → 不自动转大写）、`@Pattern(regexp="SOURCE|TARGET")` 允许 `null`、`DataSourceController` 增加局部 `@ExceptionHandler(BindException.class)` 返回 HTTP 400 / `code=400` / 字段级消息、`DataSourceServiceImpl` 列表过滤使用 `UPPER(DATA_SOURCE_CATEGORY) = {0}` 绑定参数；§9.1~§9.5 技术正文**零变化**，`GlobalExceptionHandler` 无 diff，未新增业务码；本轮新增验收 `DS-AC-116~140` 仍全部 `NOT_RUN`（`ALL_NOT_RUN`），实现状态未置 `IMPLEMENTED_ACCEPTED`；既有统计 `PASS=113/FAIL=0/BLOCKED=2/NOT_RUN=0` 逐字保留；未访问数据库/ZK/Kafka；未启动服务。

## 11. 启用/停用接口与列表状态字段（`DRAFT_PENDING_USER_REVIEW`，未实现）

> 本轮草案分层状态：`adjustment_document_status=DRAFT_PENDING_USER_REVIEW`、`adjustment_baseline_status=DRAFT_PENDING_USER_REVIEW`、`implementation_status=NOT_STARTED`、`implementation_authorization_status=NOT_GRANTED_IN_THIS_TASK`、`formal_acceptance_execution_status=NOT_RUN`、`new_adjustment_acceptance_status=ALL_NOT_RUN`。
>
> 任务：`DATA-SOURCE-LIST-ALL-STATUS-ENABLE-DISABLE-UI-ADJUSTMENT-BASELINE-001`（纯文档草案）。关联需求 `DS-REQ-150`~`DS-REQ-173`，关联验收 `DS-AC-150`~`DS-AC-178`、`DS-AC-181`。本节只冻结契约，**不实现**；§0~§10 既有结论**逐字冻结**。

### 11.1 接口增量

| # | 方法 | 路径 | 说明 | 关联 DS-REQ |
|---|---|---|---|---|
| 14 | PUT | `/api/data-sources/{dataSourceId}/enable` | 启用：只把主表 `FG_ACTIVE` 写为 `'1'` | 168,169,170,171 |
| 15 | PUT | `/api/data-sources/{dataSourceId}/disable` | 停用：只把主表 `FG_ACTIVE` 写为 `'0'`（异常状态归一化为 `'0'`） | 168,169,170,171 |

- 无请求体（`PUT` 空 body）；`dataSourceId` 为路径参数，按字符串传输（与既有 ID 契约一致）。
- 响应沿用既有统一结构 `ApiResponse`：成功为 `code=0`（或项目既有成功码）且 `data.success=true`；失败按 §11.4 错误契约。
- 路径风格与既有 `/api/data-sources/**` 一致；两条均为字面量后缀段，不与 `/api/data-sources/{id}` 冲突（后者为 `GET`，方法不同，且后缀段不同）。

### 11.2 列表接口状态字段（`GET /api/data-sources`）

- 查询范围：**移除**固定 `FG_ACTIVE='1'` 过滤，返回 `CDC_DATA_SOURCE` 全部记录（`DS-REQ-150`）。
- 其余契约**不变**：三条件忽略大小写模糊包含、`category` 规范化代码过滤、AND 组合、先 `trim`、无分页、`DATA_SOURCE_ID` 升序。
- 响应字段**新增** `fgActive`（原始值直传）：

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
    "userName": "cdc",
    "fgActive": "0"
  }
]
```

- `fgActive` 取值语义：`"1"`=启用、`"0"`=停用、`null`=异常（原值为 `NULL`）、其他字符串=异常（历史非 `0`/`1` 值）；**后端不归一化、不折叠**，页面据此在“数据源 ID”列内渲染标识（`DS-REQ-151`~`DS-REQ-154`）。
- **不新增**独立“状态”列或状态派生字段；仍不含密码、`dataSourceOrg`、`bizAttr`、`dataSourceDomain`、时间字段、`sourceApp`（`DS-REQ-181`）。

### 11.3 启停状态机与写入边界

| 接口 | 当前 `FG_ACTIVE` | 行为 | 结果 |
|---|---|---|---|
| `enable` | `'0'` | `UPDATE ... SET FG_ACTIVE='1'` | 成功 |
| `enable` | `'1'` | 不写入 | 幂等成功（重复目标状态） |
| `enable` | `NULL` / 非 `0`/`1` | 拒绝 | `40250`，不写库 |
| `disable` | `'1'` | `UPDATE ... SET FG_ACTIVE='0'` | 成功 |
| `disable` | `'0'` | 不写入 | 幂等成功（重复目标状态） |
| `disable` | `NULL` / 非 `0`/`1` | `UPDATE ... SET FG_ACTIVE='0'` | 成功（归一化） |

- 事务边界：单条主表记录的**单条 `UPDATE`**，短事务；`enable` 在写入前先读取当前值以实施上表状态机。
- 只更新 `CDC_DATA_SOURCE.FG_ACTIVE` 一列。**不修改**其他字段；**不级联** `CDC_DATA_SOURCE_EXTEND`、客户端、订阅或任何其他表；**不访问**源库；**不操作**进程、ZooKeeper、Kafka（`DS-REQ-168`/`DS-REQ-169`）。
- 并发：**不加锁**、**无乐观版本字段**、**不新增**并发控制；并发或先后请求最终收敛到其中一个请求的目标值；**不承诺**“至多一次成功”（`DS-REQ-171`）。
- 成功响应消息只陈述“状态已更新”，**不得**声称进程已启动/停止或配置已实时生效。

### 11.4 错误契约

| 场景 | HTTP | code | 说明 |
|---|---|---|---|
| 目标主表记录不存在 | 200（既有统一结构） | `40400` | 复用 §5.2 `40400`；事务内无任何写入 |
| 非法状态（仅 `enable`，当前值为 `NULL`/非 `0`/`1`） | 200 | `40250` | **本轮唯一新增业务码**；不写库 |
| 重复目标状态（`enable` 遇 `'1'`、`disable` 遇 `'0'`） | 200 | 成功码 | 幂等成功，不写库、不报错 |
| `UPDATE` 影响行数 ≠ 1 | 200 | `50002` | `STATUS_FAILED`（由“废弃”恢复为生效，见 §5.2 追加说明）；事务回滚，不留中间状态 |
| 其他保存类失败 | 200 | `50000` | 沿用既有 `SAVE_FAILED` 语义 |

**前端消息处理（冻结）**：`40400` → 提示目标不存在并刷新列表；`40250` → 提示状态异常、需先停用归一化并刷新列表；`50002`/`50000` → 提示操作失败、请重试并**保留**当前列表与已应用条件、恢复 busy；成功 → 按**当前已应用查询条件**重新查询（`DS-REQ-172`/`DS-REQ-173`）。错误消息不得泄露堆栈、密码或其他敏感信息（`DS-REQ-181`）。

### 11.5 兼容性增量

| 现有/既有结论 | 本轮处理 |
|---|---|
| §4.1 “后端固定 `FG_ACTIVE='1'` 过滤” | **局部替代**为“返回全部记录”（§11.2） |
| §4.1 `DataSourceListVO` 不含 `fgActive` | **局部替代**为“新增 `fgActive` 原始值字段”（§11.2） |
| §5.2 `50002` 标注“废弃” | **局部替代**为“恢复为生效码，语义=启停 `UPDATE` 影响行数 ≠ 1”（§11.4） |
| §6.1 `PUT /{id}/enable`、`PUT /{id}/disable` 标注“**删除**” | **局部替代**为“保留路径风格并重新提供能力，语义收敛为只更新主表 `FG_ACTIVE`”（§11.1/§11.3） |
| §6.1 `DataSourceControllerTest` 覆盖旧 7 接口（含 enable/disable） | 结论**继续有效**：实现阶段须同步适配（本轮不修改测试代码） |

- 未列出的既有结论**继续有效**；不得把两套接口契约同时作为“当前有效结论”。

### 11.6 需求追踪（`DS-REQ-139`~`DS-REQ-177` 中与 API 相关部分）

| 需求 | 接口落点 |
|---|---|
| DS-REQ-150、DS-REQ-151、DS-REQ-152、DS-REQ-153、DS-REQ-154 | §11.2（列表返回全部记录 + `fgActive` 原始值） |
| DS-REQ-160、DS-REQ-161、DS-REQ-162 | §11.3、§11.4（异常状态只可归一化停用；`enable` 拒绝异常） |
| DS-REQ-168、DS-REQ-169、DS-REQ-170、DS-REQ-171、DS-REQ-172、DS-REQ-173 | §11.1、§11.3、§11.4 |
| DS-REQ-181 | §11.2、§11.4（不返回敏感字段、不泄露敏感信息） |
| DS-REQ-139、DS-REQ-140、DS-REQ-141~149、DS-REQ-155~159、DS-REQ-163~167、DS-REQ-174~177 | §11.7（本轮对 API 无契约影响） |

### 11.7 本轮无 API 契约变化的结论

- 重置语义（`DS-REQ-139`/`DS-REQ-140`）、结果区头部（`DS-REQ-141`）、序号列（`DS-REQ-142`/`DS-REQ-143`）、主机列宽（`DS-REQ-145`）、视觉对齐（`DS-REQ-146`~`DS-REQ-149`）均为**纯前端**结论，**不改变**任何 API 请求或响应契约。
- 停用记录允许维护（`DS-REQ-155`~`DS-REQ-159`）**不放宽**任何既有 API 参数校验或角色校验；受影响的仅是既有接口内部“主记录 `FG_ACTIVE!='1'` ⇒ `40400`”的**状态前置条件**，该条件对**自身主记录**由“必须为 `'1'`”改为“`'0'` 亦放行、异常值仍拒绝”（`DS-REQ-158`）。目标库候选（`GET /target-options`）、命名策略新目标库校验（`40005`）与其他 Feature 候选**仍只接受 `FG_ACTIVE='1'`**（`DS-REQ-159`）。
- “更多”菜单（`DS-REQ-163`~`DS-REQ-167`）与新增按钮视觉（`DS-REQ-174`）为**纯前端**结论。
- 明确不变项（`DS-REQ-175`~`DS-REQ-177`）中，**无分页参数**、**无新增列表字段（除 `fgActive`）**、**无 DDL/无存量清洗**为 API 层结论。

## 12. 本轮调整变更记录

### 12.1 初版草案（2026-09-19，任务 `DATA-SOURCE-LIST-ALL-STATUS-ENABLE-DISABLE-UI-ADJUSTMENT-BASELINE-001`）

- 2026-09-19；
- 新增 §11「启用/停用接口与列表状态字段（`DRAFT_PENDING_USER_REVIEW`，未实现）」与本节；
- §1 接口总表后、§4.1、§5.2、§6.1 分别增加“本轮新草案局部替代提示”，显式给出替代边界，未静默改写既有结论；
- 接口数量：既有 13 个**逐字冻结**；本轮草案拟新增 2 个（`PUT /api/data-sources/{dataSourceId}/enable`、`PUT /api/data-sources/{dataSourceId}/disable`），草案生效后为 15 个；
- 冻结启停状态机（`enable` 只接受 `'0'`；`disable` 接受 `'1'` 并接受异常归一化为 `'0'`；重复目标状态幂等成功且不写库）、写入边界（单条主表 `UPDATE`、不级联、不访问外部系统）、并发结论（不加锁、最终收敛、不承诺至多一次成功）、错误码（复用 `40400`、新增 `40250`、恢复 `50002`、沿用 `50000`）与前端消息处理；
- `GET /api/data-sources` 由“固定 `FG_ACTIVE='1'` 过滤、响应不含 `fgActive`”改为“返回全部记录、响应新增原始 `fgActive`”；
- §0~§10 既有 `APPROVED` API 基线与 §9 技术正文逐字冻结、未修改；`DS-REQ-001~138` 编号与正文未改；
- 本轮新增需求 `DS-REQ-139~177`（39 条）与本轮新增验收 `DS-AC-141~182`（42 条）全部为 `NOT_RUN`；上一轮 `DS-AC-116~140`（25 条）仍全部 `NOT_RUN`，未混入本轮统计；
- 既有正式复验统计 `PASS=113/FAIL=0/BLOCKED=2/NOT_RUN=0`（阻塞 `DS-AC-104`/`DS-AC-108`）逐字保留，未置 `IMPLEMENTED_ACCEPTED`；
- 本轮为纯文档草案：未修改任何 `.java`/`.vue`/`.ts`/测试/依赖/配置/SQL/锁文件，未访问数据库/ZK/Kafka，未启动服务，未运行 Maven/npm 测试或构建。
