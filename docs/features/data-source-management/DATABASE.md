# 数据源管理 —— 数据库设计基线（DATABASE.md）

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
- **本设计不需要任何 DDL**；不连接数据库、不执行 SQL。

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

## 1. 物理结构引用（§9.1）

本 Feature 只使用两张已批准物理表；物理结构、字段、约束、索引、数据画像全部引用已批准数据库基线（`docs/database/tables/CDC_DATA_SOURCE.md`、`docs/database/tables/CDC_DATA_SOURCE_EXTEND.md`），**不重新查询数据库**。

### 1.1 `CDC_DATA_SOURCE`（主数据源）

| 列 | Oracle 类型 | 可空 | 说明 | 映射字段 |
|---|---|---|---|---|
| `DATA_SOURCE_ID` | VARCHAR2(32) | N（主键） | 业务主键 | `dataSourceId` |
| `DATA_SOURCE_NAME` | VARCHAR2(30) | Y | 名称 | `dataSourceName` |
| `DATA_SOURCE_CATEGORY` | VARCHAR2(30) | Y | SOURCE/TARGET；存量存在大小写混用（已批准基线），目标写入统一大写、读取忽略大小写识别 | `dataSourceCategory` |
| `DATA_SOURCE_TYPE` | VARCHAR2(32) | N | ORACLE/MYSQL/DORIS | `dataSourceType` |
| `DATA_SOURCE_HOST` | VARCHAR2(64) | N | 主机 | `host` |
| `DATA_SOURCE_PORT` | VARCHAR2(64) | N | 端口（物理字符串；API 层为数值端口，持久化边界做 `Integer ↔ 十进制字符串` 转换，不 DDL） | `port` |
| `DATA_SOURCE_USER_NAME` | VARCHAR2(64) | N | 用户 | `userName` |
| `DATA_SOURCE_PASSWORD` | VARCHAR2(64) | N | 密码（明文存储，已批准） | `password`（仅请求/内部） |
| `DATA_SOURCE_SERVICE_NAME` | VARCHAR2(64) | N | Service Name/数据库名 | `serviceName` |
| `DATA_SOURCE_ORG` | VARCHAR2(64) | N | 机构，新增=名称、编辑保留 | `dataSourceOrg`（隐藏） |
| `SOURCE_APP` | VARCHAR2(20) | Y | 保留原值 | `sourceApp`（隐藏） |
| `DATA_SOURCE_DOMAIN` | VARCHAR2(32) | Y | 保留原值 | `dataSourceDomain`（隐藏） |
| `DATA_SOURCE_BIZ_ATTR` | VARCHAR2(2000) | Y | 业务属性（JSON 文本原样） | `bizAttr` |
| `FG_ACTIVE` | VARCHAR2(1) | Y | 有效标记 | `fgActive`（隐藏） |
| `INSERT_TIME` / `UPDATE_TIME` / `DELETE_TIME` | DATE | Y | 时间字段 | 不暴露 |

索引（已批准物理事实）：主键 `PK_CDC_DATA_SOURCE`、`IDX_CDC_DATA_SOURCE_ID_ACTIVE`、`IDX_CDC_DATA_SOURCE_NAME`、`IDX_CDC_LOG_CORRECT_ORG`、`IDX_CDS_ACTIVE`。

### 1.2 `CDC_DATA_SOURCE_EXTEND`（源库到目标库的命名策略）

| 列 | Oracle 类型 | 可空 | 说明 | 映射字段 |
|---|---|---|---|---|
| `DATA_SOURCE_ID` | VARCHAR2(32) | Y | 源库 ID（弱逻辑引用） | `sourceDataSourceId` |
| `TABLE_NAMING_STRATEGY` | VARCHAR2(32) | Y | 策略 | `tableNamingStrategy` |
| `TABLE_NAME_PREFIX` | VARCHAR2(128) | Y | 前缀 | `tableNamePrefix` |
| `TABLE_NAME_SUFFIX` | VARCHAR2(128) | Y | 后缀 | `tableNameSuffix` |
| `TARGET_DATA_SOURCE_ID` | VARCHAR2(128) | Y | 目标库 ID（弱逻辑引用，业务必填） | `targetDataSourceId` |

**无主键、无唯一约束、无索引、无外键、无分区、无 LOB**（已批准物理事实）。逻辑唯一组合 `(DATA_SOURCE_ID, TARGET_DATA_SOURCE_ID)` 由后端保存前查询校验（`DS-REQ-064`/`065`）。

### 1.3 设计约束声明

- **本设计不需要 DDL**：不新增/修改主键、唯一约束、索引、外键、字段、注释、触发器、序列（`DS-REQ-108`）。
- **不清洗存量数据**：存量异常（如同一逻辑键多条）不处理、不清洗（`DS-REQ-066`）。
- **区分物理可空与业务必填**：`TARGET_DATA_SOURCE_ID` 物理可空，但业务上每条命名策略必填（`DS-REQ-078`）；`DATA_SOURCE_CATEGORY` 物理可空，但页面/后端必填（`DS-REQ-023`）。
- **端口转换**：API 层 `port` 为 JSON number / Java `Integer`，持久化边界显式执行 `Integer ↔ 十进制字符串` 转换；数据库列 `VARCHAR2(64)` 物理事实不变，不修改字段、不 DDL（`DS-REQ-027`）。
- **角色大小写兼容**：`DATA_SOURCE_CATEGORY` 存量存在大小写混用；目标写入统一大写，读取/条件查询使用大小写兼容比较（`UPPER(col)=?`），仅兼容既有大小写，不放宽到其他非法值（`DS-REQ-023`）。
- **列映射与 `API.md`/`UI.md`/`DESIGN.md` 保持一致**（camelCase ↔ 数据库列）。

---

## 2. 操作矩阵（§9.2）

| 操作 | 读取字段 | 写入字段 | WHERE 条件 | 事务 | 禁止触碰 |
|---|---|---|---|---|---|
| 列表 | 展示列（§1.1 映射） | 无 | `FG_ACTIVE='1'` + 三条件模糊 + `ORDER BY DATA_SOURCE_ID ASC` | 只读 | 密码/ORG/BIZ_ATTR/DOMAIN/FG_ACTIVE/时间/SOURCE_APP 不外泄 |
| 详情 | 展示列 | 无 | `DATA_SOURCE_ID=? AND FG_ACTIVE='1'`（不存在或非 `'1'` 视为不存在 → `40400`） | 只读 | 密码不返回 |
| 新增 | — | `DATA_SOURCE_ID,NAME,CATEGORY,TYPE,HOST,PORT,USER_NAME,PASSWORD,SERVICE_NAME,FG_ACTIVE('1'),ORG(=NAME)` | 插入主表 | `@Transactional` | 不写 EXTEND；不写 SOURCE_APP/DOMAIN/BIZ_ATTR |
| 编辑 | 当前记录隐藏字段原值 | 主表当前记录编辑字段；`DATA_SOURCE_ID` 可改 | `DATA_SOURCE_ID = originalId AND FG_ACTIVE='1'`（编辑前原 ID；非 `'1'` 视为不存在不更新 → `40400`；UPDATE 受影响行数须为 1） | `@Transactional` | 不更新 EXTEND/其他表；ORG/SOURCE_APP/DOMAIN/FG_ACTIVE/时间保留；修改 ID 不同步引用 |
| 删除 | — | 物理删除主表当前记录 | `DATA_SOURCE_ID=? AND FG_ACTIVE='1'`（非 `'1'` 视为不存在 → `40400`） | `@Transactional` | 只允许物理删除该有效记录（不是修改 `FG_ACTIVE`）；不检查/不级联 EXTEND/其他表 |
| 业务属性读 | `DATA_SOURCE_BIZ_ATTR` | 无 | `DATA_SOURCE_ID=? AND UPPER(DATA_SOURCE_CATEGORY)='TARGET'`（记录须 `FG_ACTIVE='1'`） | 只读 | 其他列不动；角色不符拒绝（`40006`） |
| 业务属性保存 | — | `DATA_SOURCE_BIZ_ATTR`（原样） | `DATA_SOURCE_ID=? AND UPPER(DATA_SOURCE_CATEGORY)='TARGET'`（记录须 `FG_ACTIVE='1'`） | `@Transactional` | 只更新该一列，不触碰其他字段/表；角色不符拒绝（`40006`） |
| 目标候选 | 展示列 | 无 | `FG_ACTIVE='1' AND UPPER(DATA_SOURCE_CATEGORY)='TARGET'` | 只读 | — |
| 策略列表 | EXTEND 全量 + 目标库名称/类型映射 | 无 | `DATA_SOURCE_ID=?`（EXTEND）；`sourceId` 记录须 `FG_ACTIVE='1' AND UPPER(DATA_SOURCE_CATEGORY)='SOURCE'` | 只读 | 不读取/暴露密码；角色不符拒绝（`40006`） |
| 策略新增 | — | `DATA_SOURCE_ID, TARGET_DATA_SOURCE_ID, TABLE_NAMING_STRATEGY, PREFIX, SUFFIX` | 插入 EXTEND；`sourceId` 记录不存在或非 `'1'` → `40400`，存在且有效但非 `SOURCE` → `40006`；新目标库无效（不存在/未启用/非 TARGET）→ `40005`；按新逻辑键全量计数：0 行允许 INSERT、1 行 → `40902`、≥2 行 → `40903`；插入后受影响行数须为 1 | `@Transactional` | 不写主表/其他表；新增流程不返回 `40401` |
| 策略编辑 | 当前行 | 当前行策略字段 + 目标库（可改） | 原逻辑键 `DATA_SOURCE_ID=? AND TARGET_DATA_SOURCE_ID=?`；先 `COUNT(*)`：0 行 → `40401`、≥2 行 → `40903`、恰好 1 才 DML，DML 后校验受影响行数=1；新目标与原目标忽略大小写相同不误判重复；逻辑键变化按新逻辑键查重排除原记录（0 行允许更新、1 行 → `40902`、≥2 行 → `40903`） | `@Transactional` | 不写主表/其他表；`sourceId` 不存在或非 `'1'` → `40400`，非 SOURCE → `40006`；新目标库无效 → `40005` |
| 策略删除 | — | 物理删除当前 EXTEND 行 | 原逻辑键 `DATA_SOURCE_ID=? AND TARGET_DATA_SOURCE_ID=?`；先 `COUNT(*)`：0 行 → `40401`、≥2 行 → `40903`、恰好 1 才 DML，DML 后校验受影响行数=1 | `@Transactional` | 不清理存量多条；`sourceId` 不存在或非 `'1'` → `40400`，非 SOURCE → `40006` |
| 连接测试 | 编辑未改密码时按 `originalDataSourceId` 定位 `FG_ACTIVE='1'` 记录读取持久化密码 | 无（不写业务数据） | 一次性临时连接 | 无事务 | 不写任何业务表；不进入应用连接池；表单可编辑 `dataSourceId` 不用于读取旧密码 |

---

## 3. 更新和删除边界（§9.3）

- **修改主表 ID 不更新任何引用**：`UPDATE CDC_DATA_SOURCE SET DATA_SOURCE_ID=:new WHERE DATA_SOURCE_ID=:originalId AND FG_ACTIVE='1'`；`originalId` 不存在或非 `'1'` 视为不存在返回 `40400`，不更新；UPDATE 受影响行数须为 1，否则回滚；不更新 `CDC_DATA_SOURCE_EXTEND.DATA_SOURCE_ID`、`TARGET_DATA_SOURCE_ID` 或其他表（`DS-REQ-041`）。
- **删除数据源不检查、不级联**：`DELETE FROM CDC_DATA_SOURCE WHERE DATA_SOURCE_ID=? AND FG_ACTIVE='1'`；不存在或非 `'1'` 视为不存在返回 `40400`；DELETE 受影响行数须为 1，否则回滚；这仍是物理删除，不是修改 `FG_ACTIVE`（`DS-REQ-092`/`097`）；不检查/不删除/不更新 EXTEND 或其他表关联数据；被目标引用不阻塞（`DS-REQ-093`~`095`）。
- **删除策略按原始逻辑组合键删除当前 EXTEND 行**：`DELETE FROM CDC_DATA_SOURCE_EXTEND WHERE DATA_SOURCE_ID=? AND TARGET_DATA_SOURCE_ID=?`（`DS-REQ-081`）。
- **确定性 WHERE 与多行异常防护（目标设计不使用 `ROWNUM=1`）**：因 `CDC_DATA_SOURCE_EXTEND` 无物理主键，**不使用** MyBatis-Plus 依赖单一主键的不可控单记录更新/删除（`updateById`/`deleteById`），也**不使用 `ROWNUM=1`** 把多条匹配截断为一行。
  - **新增**：按**新逻辑键** `(sourceId, targetDataSourceId)` 全量计数——0 行 → 允许执行 `INSERT`；1 行 → `40902` 逻辑键重复；≥2 行 → `40903` 存量多条异常阻止操作。插入后校验受影响行数恰好为 1，否则抛保存异常并回滚。新增流程不返回 `40401`（`DS-REQ-064`/`067`）。
  - **编辑/删除**：先按**原逻辑组合键**执行 `COUNT(*)`（或等价的全量计数）区分 0、1、≥2：0 行 → `40401` 不存在；≥2 行 → `40903` 存量多条异常阻止操作；只有计数**恰好为 1** 才允许 DML；DML 使用完整原逻辑键 WHERE，执行后校验受影响行数恰好为 1，否则抛出业务异常并依赖事务回滚。编辑时若新目标 ID 与原目标 ID 忽略大小写相同，不把当前行误判为重复；若逻辑键变化，按新逻辑键查重并排除原记录（0 行允许更新、1 行 → `40902`、≥2 行 → `40903`）（`DS-REQ-064`/`067`/`081`）。
- **存量多条不清理**：若同一组合已有多条，保存被阻止并明确提示（`DS-REQ-067`），不清理存量（`DS-REQ-066`）。

---

## 4. 查询与唯一校验（§9.4）

- **忽略大小写模糊查询（Oracle）**：对数据源 ID/名称/主机使用 `UPPER(col) LIKE UPPER('%' || ? || '%') ESCAPE '\'`，对查询值中的 `%`、`_` 转义为字面量，先 trim 参数后绑定。
- **忽略大小写精确查重（Oracle）**：ID/名称查重使用 `UPPER(col) = UPPER(?)`；编辑排除当前记录（`DATA_SOURCE_ID <> ?`）（`DS-REQ-032`/`033`/`035`）。
- **命名策略组合键查重**：`UPPER(DATA_SOURCE_ID) = UPPER(?) AND UPPER(TARGET_DATA_SOURCE_ID) = UPPER(?)`（与主表 ID 忽略大小写唯一保持一致）；编辑排除当前行。
- **trim 参数**：所有字符串参数在绑定前 trim（唯一例外 `DATA_SOURCE_BIZ_ATTR`）（`DS-REQ-031`/`088`）。
- **`FG_ACTIVE='1'` 固定过滤**：列表、详情、编辑、删除、业务属性、目标候选、命名策略关联查询均只触及 `FG_ACTIVE='1'` 记录；主记录不存在或非 `'1'` 一律视为不存在并返回 `40400`（`DS-REQ-002`）。
- **默认 ID 升序**：列表 `ORDER BY DATA_SOURCE_ID ASC`（`DS-REQ-010`）。
- **目标候选过滤**：`FG_ACTIVE='1' AND UPPER(DATA_SOURCE_CATEGORY)='TARGET'`（大小写兼容，`DS-REQ-076`）。
- **角色大小写兼容**：新增/编辑只接受 `SOURCE`/`TARGET` 并保存统一大写；读取历史记录时对 `DATA_SOURCE_CATEGORY` 忽略大小写识别并向前端返回规范化 `SOURCE`/`TARGET`；角色条件查询统一使用大小写兼容比较（如 `UPPER(DATA_SOURCE_CATEGORY)='TARGET'`），仅为兼容存量大小写，不放宽到其他非法值（`DS-REQ-023`）。
- **角色限定查询**：业务属性读取/保存仅针对存在且有效的 `FG_ACTIVE='1'` 记录并校验角色为 `TARGET`（不存在或非 `'1'` → `40400`；存在且有效但角色非 TARGET → `40006`）；命名策略列表/新增/编辑/删除仅针对 `sourceId` 对应存在且有效的 `FG_ACTIVE='1'` 记录并校验角色为 `SOURCE`（不存在或非 `'1'` → `40400`；存在且有效但角色非 SOURCE → `40006`），新目标库须 `FG_ACTIVE='1' AND UPPER(DATA_SOURCE_CATEGORY)='TARGET'`，无效一律 → `40005`（`DS-REQ-069`/`076`/`082`）。
- **命名策略逻辑键计数检查**：新增按**新逻辑键**全量计数（0 行允许 INSERT；1 行 → `40902`；≥2 行 → `40903`），插入后校验受影响行数=1；编辑先按**原逻辑键** `COUNT(*)`（0 → `40401`；≥2 → `40903`；恰好 1 才继续），若逻辑键变化再按新逻辑键查重并排除原记录（0 行允许更新、1 行 → `40902`、≥2 行 → `40903`）；删除按原逻辑键 `COUNT(*)` 恰好为 1 才执行 DML，DML 后校验受影响行数=1（`DS-REQ-064`/`067`）。
- **不得直接承诺新增索引**：本设计不新增索引/DDL；查询基于现有已批准索引与 ≤100 行小规模数据，性能由表规模与现有结构保证（`DESIGN.md` §8）。

---

## 5. 数据安全（§9.5）

- **密码读取/写入/测试边界**：
  - 写入：新增/编辑仅在主表 `DATA_SOURCE_PASSWORD` 列；编辑未改密码时请求体缺席、后端不动该列。
  - 读取：列表/详情/业务属性/命名策略任何响应**不读取、不返回**密码。
  - 测试：编辑未改密码场景请求携带 `originalDataSourceId`、`password` 缺席；后端只按 `originalDataSourceId` 定位 `FG_ACTIVE='1'` 记录，在临时连接构建阶段读取持久化密码，仅用于本次临时连接，不入日志/响应/异常（`DS-REQ-051`/`052`）。
- **禁止日志输出**：不输出密码、完整连接串；业务消息/日志不含敏感信息（`DS-REQ-047`/`107`）。
- **业务属性原样保存**：`DATA_SOURCE_BIZ_ATTR` 原样读写，不 trim、不校验 JSON（`DS-REQ-087`/`088`）。
- **连接测试无业务 DML**：连接测试只建立临时 JDBC 连接并执行 `SELECT 1 FROM DUAL`/`SELECT 1`，不写任何业务数据、不触发任何业务 DML（`DS-REQ-061`/`109`）。
- 本 Feature 不新增任何数据库权限/授权操作。

---

## 6. 追踪（§9.6）

| 数据库操作 | 关联 DS-REQ | 关联 DS-AC | 关联 API |
|---|---|---|---|
| 列表 | 001,002,005,006,007,008,010,011,012 | 004,005,006,011~019 | GET `/api/data-sources` |
| 详情 | 043 | 048 | GET `/api/data-sources/{id}` |
| 新增 | 004,021~034,037,108 | 020,024~037,038,041,105,106 | POST `/api/data-sources` |
| 编辑 | 016,019~041,043~046,108 | 020,021,024~037,039,042~051,105,106 | PUT `/api/data-sources/{originalId}` |
| 删除 | 092~097 | 087~092 | DELETE `/api/data-sources/{id}` |
| 业务属性 | 082,083,086,087,088,089,109 | 065~070,101 | GET/PUT `/api/data-sources/{id}/biz-attr` |
| 目标候选 | 076,083 | 076,086 | GET `/api/data-sources/target-options` |
| 策略列表 | 071,072,073,080 | 072,073 | GET `/api/data-sources/{sourceId}/naming-strategies` |
| 策略新增 | 064,065,067,076,077,078,079,080,108 | 074~082,084,105,106 | POST `/api/data-sources/{sourceId}/naming-strategies` |
| 策略编辑 | 064,065,067,078,079,080,108 | 078~082,084,085,105,106 | PUT `/api/data-sources/{sourceId}/naming-strategies/{originalTargetId}` |
| 策略删除 | 064,081 | 083 | DELETE `/api/data-sources/{sourceId}/naming-strategies/{targetId}` |
| 连接测试 | 052,053,054,061,109 | 057,058,059,060,101,103,104 | POST `/api/data-sources/test-connection` |

- 字段映射、逻辑组合键、错误码、角色大小写兼容与限定、事务/删除边界与 `DESIGN.md`、`API.md`、`UI.md` 保持一致。

---

## 7. 批准收口变更记录（2026-08-29）

- 2026-08-29；
- 文档状态由 `DRAFT_PENDING_USER_REVIEW` 转为 `APPROVED`；
- 技术/产品正文不变；
- 实现状态仍为 `NOT_STARTED`；
- 106 条验收仍为 `NOT_RUN`；
- 依据为本批准任务 `DATA-SOURCE-DESIGN-APPROVAL-CLOSEOUT-001` 及 `fdb9ecaf5bc24373e586d853b4174d1a9cd8bbfc` 最终复审通过基准。
