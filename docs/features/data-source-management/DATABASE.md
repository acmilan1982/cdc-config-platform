# 数据源管理 —— 数据库设计基线草案（DATABASE.md）

> 文档状态：`DRAFT_PENDING_USER_REVIEW`
> 需求状态：`APPROVED`
> 验收标准状态：`APPROVED`
> 实现状态：`NOT_STARTED`
> 设计任务：`DATA-SOURCE-DESIGN-BASELINE-001`
> 授权基准提交：`c24bbb826b252f06f75ec05bcac77e94a9871019`
> 创建日期：2026-08-29

---

## 0. 声明与边界

- 本设计为**草案**，Agent 不能批准设计；草案等待 ChatGPT 复审与用户最终批准。
- 设计草案**不代表**代码已实现、构建通过、验收执行或生产可用。
- 106 条验收用例仍全部为 `NOT_RUN`。
- 本设计不改变任何已批准 `DS-REQ`/`DS-AC`；不新增 DDL、锁、权限、认证或自动刷新等未批准能力。
- 本设计不修改代码、测试、构建文件、配置、菜单、路由、历史候选或任何已批准项目/数据库基线。
- **本设计不需要任何 DDL**；不连接数据库、不执行 SQL。

---

## 1. 物理结构引用（§9.1）

本 Feature 只使用两张已批准物理表；物理结构、字段、约束、索引、数据画像全部引用已批准数据库基线（`docs/database/tables/CDC_DATA_SOURCE.md`、`docs/database/tables/CDC_DATA_SOURCE_EXTEND.md`），**不重新查询数据库**。

### 1.1 `CDC_DATA_SOURCE`（主数据源）

| 列 | Oracle 类型 | 可空 | 说明 | 映射字段 |
|---|---|---|---|---|
| `DATA_SOURCE_ID` | VARCHAR2(32) | N（主键） | 业务主键 | `dataSourceId` |
| `DATA_SOURCE_NAME` | VARCHAR2(30) | Y | 名称 | `dataSourceName` |
| `DATA_SOURCE_CATEGORY` | VARCHAR2(30) | Y | SOURCE/TARGET | `dataSourceCategory` |
| `DATA_SOURCE_TYPE` | VARCHAR2(32) | N | ORACLE/MYSQL/DORIS | `dataSourceType` |
| `DATA_SOURCE_HOST` | VARCHAR2(64) | N | 主机 | `host` |
| `DATA_SOURCE_PORT` | VARCHAR2(64) | N | 端口（物理字符串） | `port` |
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
- **列映射与 `API.md`/`UI.md`/`DESIGN.md` 保持一致**（camelCase ↔ 数据库列）。

---

## 2. 操作矩阵（§9.2）

| 操作 | 读取字段 | 写入字段 | WHERE 条件 | 事务 | 禁止触碰 |
|---|---|---|---|---|---|
| 列表 | 展示列（§1.1 映射） | 无 | `FG_ACTIVE='1'` + 三条件模糊 + `ORDER BY DATA_SOURCE_ID ASC` | 只读 | 密码/ORG/BIZ_ATTR/DOMAIN/FG_ACTIVE/时间/SOURCE_APP 不外泄 |
| 详情 | 展示列 | 无 | `DATA_SOURCE_ID=?`（主键定位） | 只读 | 密码不返回 |
| 新增 | — | `DATA_SOURCE_ID,NAME,CATEGORY,TYPE,HOST,PORT,USER_NAME,PASSWORD,SERVICE_NAME,FG_ACTIVE('1'),ORG(=NAME)` | 插入主表 | `@Transactional` | 不写 EXTEND；不写 SOURCE_APP/DOMAIN/BIZ_ATTR |
| 编辑 | 当前记录隐藏字段原值 | 主表当前记录编辑字段；`DATA_SOURCE_ID` 可改 | `DATA_SOURCE_ID = originalId`（编辑前原 ID） | `@Transactional` | 不更新 EXTEND/其他表；ORG/SOURCE_APP/DOMAIN/FG_ACTIVE/时间保留；修改 ID 不同步引用 |
| 删除 | — | 物理删除主表当前记录 | `DATA_SOURCE_ID=?` | `@Transactional` | 不检查/不级联 EXTEND/其他表；不经 `FG_ACTIVE` |
| 业务属性读 | `DATA_SOURCE_BIZ_ATTR` | 无 | `DATA_SOURCE_ID=?` | 只读 | 其他列不动 |
| 业务属性保存 | — | `DATA_SOURCE_BIZ_ATTR`（原样） | `DATA_SOURCE_ID=?` | `@Transactional` | 只更新该一列，不触碰其他字段/表 |
| 目标候选 | 展示列 | 无 | `FG_ACTIVE='1' AND DATA_SOURCE_CATEGORY='TARGET'` | 只读 | — |
| 策略列表 | EXTEND 全量 + 目标库名称/类型映射 | 无 | `DATA_SOURCE_ID=?`（EXTEND） | 只读 | 不读取/暴露密码 |
| 策略新增 | — | `DATA_SOURCE_ID, TARGET_DATA_SOURCE_ID, TABLE_NAMING_STRATEGY, PREFIX, SUFFIX` | 插入 EXTEND | `@Transactional` | 不写主表/其他表 |
| 策略编辑 | 当前行 | 当前行策略字段 + 目标库（可改） | `DATA_SOURCE_ID=? AND TARGET_DATA_SOURCE_ID=?`（原逻辑键） | `@Transactional` | 不写主表/其他表 |
| 策略删除 | — | 物理删除当前 EXTEND 行 | `DATA_SOURCE_ID=? AND TARGET_DATA_SOURCE_ID=?`（原逻辑键） | `@Transactional` | 不清理存量多条 |
| 连接测试 | 编辑未改密码时读取持久化密码 | 无（不写业务数据） | 一次性临时连接 | 无事务 | 不写任何业务表；不进入应用连接池 |

---

## 3. 更新和删除边界（§9.3）

- **修改主表 ID 不更新任何引用**：`UPDATE CDC_DATA_SOURCE SET DATA_SOURCE_ID=:new WHERE DATA_SOURCE_ID=:originalId`；不更新 `CDC_DATA_SOURCE_EXTEND.DATA_SOURCE_ID`、`TARGET_DATA_SOURCE_ID` 或其他表（`DS-REQ-041`）。
- **删除数据源不检查、不级联**：`DELETE FROM CDC_DATA_SOURCE WHERE DATA_SOURCE_ID=?`；不检查/不删除/不更新 EXTEND 或其他表关联数据；被目标引用不阻塞（`DS-REQ-092`~`095`）。
- **删除策略按原始逻辑组合键删除当前 EXTEND 行**：`DELETE FROM CDC_DATA_SOURCE_EXTEND WHERE DATA_SOURCE_ID=? AND TARGET_DATA_SOURCE_ID=?`（`DS-REQ-081`）。
- **确定性 WHERE 与多行异常防护**：因 `CDC_DATA_SOURCE_EXTEND` 无物理主键，**不使用** MyBatis-Plus 依赖单一主键的不可控单记录更新/删除（`updateById`/`deleteById`）。策略新增/编辑/删除均先以**确定性 WHERE** 定位（返回受影响行数与行数校验），并要求匹配恰好一行；0 行 → `40401`，≥2 行 → `40903` 阻止操作。
- **存量多条不清理**：若同一组合已有多条，保存被阻止并明确提示（`DS-REQ-067`），不清理存量（`DS-REQ-066`）。

---

## 4. 查询与唯一校验（§9.4）

- **忽略大小写模糊查询（Oracle）**：对数据源 ID/名称/主机使用 `UPPER(col) LIKE UPPER('%' || ? || '%') ESCAPE '\'`，对查询值中的 `%`、`_` 转义为字面量，先 trim 参数后绑定。
- **忽略大小写精确查重（Oracle）**：ID/名称查重使用 `UPPER(col) = UPPER(?)`；编辑排除当前记录（`DATA_SOURCE_ID <> ?`）（`DS-REQ-032`/`033`/`035`）。
- **命名策略组合键查重**：`UPPER(DATA_SOURCE_ID) = UPPER(?) AND UPPER(TARGET_DATA_SOURCE_ID) = UPPER(?)`（与主表 ID 忽略大小写唯一保持一致）；编辑排除当前行。
- **trim 参数**：所有字符串参数在绑定前 trim（唯一例外 `DATA_SOURCE_BIZ_ATTR`）（`DS-REQ-031`/`088`）。
- **`FG_ACTIVE='1'` 固定过滤**：列表、详情、业务属性、目标候选、命名策略关联查询均只触及 `FG_ACTIVE='1'` 记录（`DS-REQ-002`）。
- **默认 ID 升序**：列表 `ORDER BY DATA_SOURCE_ID ASC`（`DS-REQ-010`）。
- **目标候选过滤**：`FG_ACTIVE='1' AND DATA_SOURCE_CATEGORY='TARGET'`（`DS-REQ-076`）。
- **不得直接承诺新增索引**：本设计不新增索引/DDL；查询基于现有已批准索引与 ≤100 行小规模数据，性能由表规模与现有结构保证（`DESIGN.md` §8）。

---

## 5. 数据安全（§9.5）

- **密码读取/写入/测试边界**：
  - 写入：新增/编辑仅在主表 `DATA_SOURCE_PASSWORD` 列；编辑未改密码时请求体缺席、后端不动该列。
  - 读取：列表/详情/业务属性/命名策略任何响应**不读取、不返回**密码。
  - 测试：编辑未改密码场景后端在临时连接构建阶段读取持久化密码，仅用于本次临时连接，不入日志/响应/异常（`DS-REQ-051`/`052`）。
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

- 字段映射、逻辑组合键、错误码、事务/删除边界与 `DESIGN.md`、`API.md`、`UI.md` 保持一致。
