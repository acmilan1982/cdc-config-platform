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

> **本轮新草案局部替代提示（§9，`DRAFT_PENDING_USER_REVIEW`）**：本表以下单元格被本轮**局部替代**，替代边界与新版操作矩阵见 §9.2。
> - “列表”行 WHERE 条件中的 `FG_ACTIVE='1'` → 改为**不过滤 `FG_ACTIVE`**（返回全部记录），仍然 `ORDER BY DATA_SOURCE_ID ASC`（`DS-REQ-150`）。
> - “详情”“编辑”“删除”“业务属性读”“业务属性保存”“策略列表”“策略新增”“策略编辑”“策略删除”“连接测试”各行 WHERE 条件中的 `FG_ACTIVE='1'`，对**主记录自身**改为“`'1'` 或 `'0'` 均可，`NULL`/非 `0`/`1` 拒绝并返回 `40400`”（`DS-REQ-155`~`DS-REQ-162`）。
> - “新增”行写入字段 `FG_ACTIVE('1')`、以及“编辑”行“`FG_ACTIVE` 保留”**不变**（`DS-REQ-176`）。
> - “目标候选”行 `FG_ACTIVE='1' AND UPPER(DATA_SOURCE_CATEGORY)='TARGET'` **不作替代、继续有效**（`DS-REQ-159`）。

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

> **本轮新草案局部替代提示（§9，`DRAFT_PENDING_USER_REVIEW`）**：本节以下两条结论被**局部替代**。
> 1. “**`FG_ACTIVE='1'` 固定过滤**：列表、详情、编辑、删除、业务属性、目标候选、命名策略关联查询均只触及 `FG_ACTIVE='1'` 记录；主记录不存在或非 `'1'` 一律视为不存在并返回 `40400`（`DS-REQ-002`）”**局部替代**为：**列表**不按 `FG_ACTIVE` 过滤（返回全部记录，`DS-REQ-150`）；**详情/编辑/删除/业务属性/源库命名策略/编辑态连接测试**对**自身主记录**接受 `'1'` 与 `'0'`（`'0'` 不再视为不存在，`DS-REQ-155`~`DS-REQ-158`），`NULL`/非 `0`/`1` 仍拒绝并返回 `40400`（`DS-REQ-162`）。**目标候选**的 `FG_ACTIVE='1'` 过滤**不作替代、继续有效**（`DS-REQ-159`）。
> 2. 本节“角色限定查询”中“不存在或非 `'1'` → `40400`”的两处表述，同样按上述边界**局部替代**（`'0'` 改为放行；`NULL`/非 `0`/`1` 仍 `40400`）；角色校验本身（业务属性须 `TARGET`、命名策略入口须 `SOURCE`）**不放宽**。新目标库校验 `FG_ACTIVE='1' AND UPPER(DATA_SOURCE_CATEGORY)='TARGET'` 与 `40005` **不作替代、继续有效**。
> 其余结论（忽略大小写模糊/精确比较、命名策略组合键查重、trim、默认 ID 升序、角色大小写兼容、逻辑键计数检查、不新增索引）**全部继续有效**。新版 WHERE 条件与启停写入边界见 §9.2、§9.3。

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

---

## 8. 本轮列表首页调整的数据库变化声明（`APPROVED`，实现后无数据库变化）

> 状态：`APPROVED`。本轮调整基线分层状态：

```text
adjustment_database_status=APPROVED
adjustment_baseline_status=APPROVED
implementation_status=IMPLEMENTED_PENDING_USER_REVIEW
implementation_authorization_status=GRANTED_IN_THIS_TASK
formal_acceptance_execution_status=NOT_RUN
new_adjustment_acceptance_status=ALL_NOT_RUN
```

> 批准链（2026-09-19）：初版草案提交 `01680ee527b8e35cd4afd84c4789b862d34f7a77` → R1 修订提交 `c3fd460bea64a14ccc7b52a554194a133330e29d` → ChatGPT 远程 Git R1 复审结论 `REVIEW_PASS` → 项目负责人 2026-09-19 明确回复“批准这轮调整基线” → 批准收口提交 `178b7a0cb5ae2b467847ba940615d1b80a323da2`（任务 `DATA-SOURCE-LIST-PAGE-SELECTIVE-QUERY-LIST-INTEGRATION-APPROVAL-CLOSEOUT-001`）。
> 批准只代表本节的“无数据库变化声明”随本轮调整基线**正式成立**：本轮实现已由 `DATA-SOURCE-LIST-PAGE-SELECTIVE-QUERY-LIST-INTEGRATION-IMPLEMENTATION-001` 完成（实现状态 `IMPLEMENTED_PENDING_USER_REVIEW`，实现授权 `GRANTED_IN_THIS_TASK`），实现后**仍无数据库变化**；**不代表**已测试、已验收或生产可用，本轮新增 `DS-AC-116~140`（25 条）仍全部 `NOT_RUN`。

- 任务：`DATA-SOURCE-LIST-PAGE-SELECTIVE-QUERY-LIST-INTEGRATION-BASELINE-001`。
- **本轮无任何数据库变化**：不新增/修改/删除表、列、主键、唯一约束、索引、序列、视图或触发器；**无任何 DDL**；不改变现有数据库对象。
- 新增的“角色”查询条件仅对既有 `DATA_SOURCE_CATEGORY` 列增加一个**可选**过滤条件，沿用本文件 §4 既有的 `UPPER(DATA_SOURCE_CATEGORY)` 大小写兼容比较；不新增列、不改写存量数据、不清洗存量数据。
- 本节“无数据库变化声明”的当前事实：已随本轮调整基线**正式批准**，且本轮实现已完成（实现状态 `IMPLEMENTED_PENDING_USER_REVIEW`）；本轮实现未访问数据库、未执行任何 SQL/DDL/DML，实现后仍无数据库变化。批准本节**不等于**批准执行任何数据库变更——本轮不存在任何待执行的数据库变更。
- 本轮新增验收 `DS-AC-116~140` 均为 `NOT_RUN`；既有正式复验统计 `PASS=113/FAIL=0/BLOCKED=2/NOT_RUN=0`（阻塞 `DS-AC-104`/`DS-AC-108`）逐字保留。

### 8.1 批准收口变更记录（2026-09-19）

- 2026-09-19；
- §8 章节标题由 `本轮列表首页调整的数据库变化声明（DRAFT_PENDING_USER_REVIEW）` 收口为 `本轮列表首页调整的数据库变化声明（APPROVED）`，并补充本轮调整基线分层状态与完整批准链；
- “本轮为纯文档草案任务”的表述修正为当前事实：本节“无数据库变化声明”已随本轮调整基线正式批准，同时保持未实现、未验收、无数据库变化；
- §8 数据库技术结论**零变化**：无表/列/主键/唯一约束/索引/序列/视图/触发器变化、无 DDL、角色查询只复用既有 `DATA_SOURCE_CATEGORY`、沿用 `UPPER(DATA_SOURCE_CATEGORY)` 大小写兼容比较、不清洗不改写存量数据、未访问数据库且未执行 SQL/DDL/DML；
- §0~§7 既有正文、历史状态与批准链**逐字冻结、未修改**；
- 依据任务 `DATA-SOURCE-LIST-PAGE-SELECTIVE-QUERY-LIST-INTEGRATION-APPROVAL-CLOSEOUT-001-R1`（对批准收口遗漏 `DATABASE.md §8` 状态的定向修订；纯文档任务；未修改任何业务代码/测试/依赖/配置/SQL；未访问数据库/ZK/Kafka；未启动服务）。

### 8.2 实现状态回写（2026-09-19，任务 `DATA-SOURCE-LIST-PAGE-SELECTIVE-QUERY-LIST-INTEGRATION-IMPLEMENTATION-001`）

- 2026-09-19；
- §8 章节标题由“（`APPROVED`）”改为“（`APPROVED`，实现后无数据库变化）”，状态声明由 `implementation_status=NOT_STARTED`/`implementation_authorization_status=NOT_GRANTED_IN_THIS_TASK`/`acceptance_execution_status=ALL_NOT_RUN` 更新为 `implementation_status=IMPLEMENTED_PENDING_USER_REVIEW`/`implementation_authorization_status=GRANTED_IN_THIS_TASK`/`formal_acceptance_execution_status=NOT_RUN`/`new_adjustment_acceptance_status=ALL_NOT_RUN`（`adjustment_database_status`/`adjustment_baseline_status` 保持 `APPROVED`）；
- §8 数据库技术结论**零变化**：实现仅在服务层新增 `UPPER(DATA_SOURCE_CATEGORY) = {0}` 绑定参数过滤，无表/列/主键/唯一约束/索引/序列/视图/触发器变化、无 DDL、无 DML、不清洗不改写存量数据；
- 实现期间**未访问数据库**、未执行任何 SQL/DDL/DML，未修改数据库配置或 SQL 脚本（`backend` 侧仅 Java 源码与测试变更）；
- 本轮新增验收 `DS-AC-116~140` 仍全部 `NOT_RUN`（`ALL_NOT_RUN`），实现状态未置 `IMPLEMENTED_ACCEPTED`；既有正式复验统计 `PASS=113/FAIL=0/BLOCKED=2/NOT_RUN=0`（阻塞 `DS-AC-104`/`DS-AC-108`）逐字保留；
- §0~§7 与 §8.1 既有正文、历史状态与批准链**逐字冻结、未修改**；
- 依据任务 `DATA-SOURCE-LIST-PAGE-SELECTIVE-QUERY-LIST-INTEGRATION-IMPLEMENTATION-001`（已批准调整基线的前后端实现、自动化测试、构建与实现状态回写；未访问数据库/ZK/Kafka；未启动服务）。

---

## 9. 本轮列表展示全部状态与启用/停用的数据库变化声明（`DRAFT_PENDING_USER_REVIEW`）

> 状态：`DRAFT_PENDING_USER_REVIEW`。本轮草案分层状态：

```text
adjustment_document_status=DRAFT_PENDING_USER_REVIEW
adjustment_baseline_status=DRAFT_PENDING_USER_REVIEW
adjustment_database_status=DRAFT_PENDING_USER_REVIEW
implementation_status=NOT_STARTED
implementation_authorization_status=NOT_GRANTED_IN_THIS_TASK
formal_acceptance_execution_status=NOT_RUN
new_adjustment_acceptance_status=ALL_NOT_RUN
```

- 任务：`DATA-SOURCE-LIST-ALL-STATUS-ENABLE-DISABLE-UI-ADJUSTMENT-BASELINE-001`（纯文档草案）。关联需求 `DS-REQ-150`~`DS-REQ-159`、`DS-REQ-168`~`DS-REQ-171`、`DS-REQ-176`、`DS-REQ-177`；关联验收 `DS-AC-150`~`DS-AC-178`、`DS-AC-182`。
- 本节**尚未**获得项目负责人批准，**未**授权实现，**未**执行任何正式验收。

### 9.1 无数据库变化声明

- **本轮无任何数据库结构变化**：不新增/修改/删除表、列、主键、唯一约束、索引、序列、视图、同义词或触发器；**无任何 DDL**（`DS-REQ-177`）。
- **无存量数据清洗/订正**：不 UPDATE/DELETE 任何存量记录；`FG_ACTIVE` 为 `NULL` 或非 `0`/`1` 的存量异常记录**保持原样**，仅通过页面“停用”显式归一化为 `'0'`（`DS-REQ-161`/`DS-REQ-177`）。
- 新增的 `fgActive` 为**接口响应字段**，直接映射既有物理列 `CDC_DATA_SOURCE.FG_ACTIVE`（`VARCHAR2(1)`，可空），**不新增列**（`DS-REQ-154`）。
- 本轮**不访问**数据库、**不执行**任何 SQL/DDL/DML（纯文档草案任务）。

### 9.2 操作矩阵变化（相对 §2）

| 操作 | 新版 WHERE 条件（变化部分） | 写入字段 | 变化来源 |
|---|---|---|---|
| 列表 | **取消** `FG_ACTIVE='1'`；保留三条件模糊 + 角色条件 + `ORDER BY DATA_SOURCE_ID ASC` | 无 | `DS-REQ-150` |
| 详情 | `DATA_SOURCE_ID=? AND FG_ACTIVE IN ('1','0')`（不存在、或 `FG_ACTIVE` 为 `NULL`/非 `0`/`1` → `40400`） | 无 | `DS-REQ-158` |
| 编辑 | `DATA_SOURCE_ID = originalId AND FG_ACTIVE IN ('1','0')`；UPDATE 受影响行数须为 1 | 编辑字段；**`FG_ACTIVE` 不写、保持原值**（`'0'` 保存后仍 `'0'`） | `DS-REQ-155`、`DS-REQ-176` |
| 删除 | `DATA_SOURCE_ID=? AND FG_ACTIVE IN ('1','0')`；DELETE 受影响行数须为 1；仍为物理删除 | 物理删除 | `DS-REQ-156` |
| 业务属性读/保存 | `DATA_SOURCE_ID=? AND UPPER(DATA_SOURCE_CATEGORY)='TARGET' AND FG_ACTIVE IN ('1','0')` | 仅 `DATA_SOURCE_BIZ_ATTR` | `DS-REQ-156` |
| 策略列表/新增/编辑/删除（`sourceId` 校验） | `sourceId` 记录须 `FG_ACTIVE IN ('1','0') AND UPPER(DATA_SOURCE_CATEGORY)='SOURCE'` | 仅 `CDC_DATA_SOURCE_EXTEND` | `DS-REQ-156` |
| 编辑态连接测试（未改密码时读取持久化密码） | 按 `originalDataSourceId` 定位 `FG_ACTIVE IN ('1','0')` 记录读取密码 | 无 | `DS-REQ-157` |
| **启用**（新增操作） | 先读 `DATA_SOURCE_ID` 当前记录（不按 `FG_ACTIVE='1'` 过滤）：`'0'` → 条件 `UPDATE ... AND FG_ACTIVE='0'` 写 `'1'`；`'1'` → 幂等成功不写；`NULL`/非 `0`/`1` → `40250` 不写；记录不存在 → `40400` 不写 | `FG_ACTIVE` 一列 | `DS-REQ-168`、`DS-REQ-170` |
| **停用**（新增操作） | 先读 `DATA_SOURCE_ID` 当前记录（不按 `FG_ACTIVE='1'` 过滤）：`'1'` → 条件 `UPDATE ... AND FG_ACTIVE='1'` 写 `'0'`；`'0'` → 幂等成功不写；`NULL`/非 `0`/`1` → 使用 §9.3 的 NULL-safe 原状态匹配条件执行条件 `UPDATE` 写 `'0'` 归一化（`NULL` 用 `FG_ACTIVE IS NULL`，非空异常值用 `FG_ACTIVE=:observedStatus`）；记录不存在 → `40400` 不写 | `FG_ACTIVE` 一列 | `DS-REQ-168`、`DS-REQ-170` |
| 目标候选（**不变**） | `FG_ACTIVE='1' AND UPPER(DATA_SOURCE_CATEGORY)='TARGET'` | 无 | `DS-REQ-159`（不作替代） |
| 新增（**不变**） | 插入主表，`FG_ACTIVE` 写 `'1'` | 同 §2 | `DS-REQ-176` |

- “`FG_ACTIVE IN ('1','0')`”是本轮为表达便利采用的书写形式；实现可用等价条件（如 `FG_ACTIVE = '1' OR FG_ACTIVE = '0'`），语义相同：**仅** `'1'` 与 `'0'` 被接受。不得使用 `FG_ACTIVE <> '1'`、`FG_ACTIVE IS NOT NULL` 等会**放宽**到其他历史值的写法。
- `NULL`/非 `0`/`1` 记录的处置**按接口分场景冻结**：
  - **非启停维护接口**（详情、编辑、删除、业务属性读/保存、源库命名策略列表/新增/编辑/删除、编辑态连接测试）：主记录仅接受 `'1'`/`'0'`，`NULL`/非 `0`/`1` 一律视为非法并返回 `40400`。
  - **`enable`**：`NULL`/非 `0`/`1` 返回 `40250`，**不写库**。
  - **`disable`**：`NULL`/非 `0`/`1` **不**返回 `40250`，改用 §9.3 的 NULL-safe 原状态匹配条件执行 `UPDATE`，显式归一化为 `'0'`。
- 除上表列出的变化外，§2 其余行的读取字段、写入字段、事务与“禁止触碰”结论**继续有效**。

### 9.3 启停写入边界（新增）

- **先读取**：`enable` 与 `disable` 均在同一事务内**先按 `DATA_SOURCE_ID` 读取主表当前记录及其原始 `FG_ACTIVE`**（**不**按 `FG_ACTIVE='1'` 过滤）；记录不存在 → `40400`，**不执行 DML**；只读本表该记录，**不访问**源库、**不访问** ZooKeeper/Kafka、**不操作**进程。
- **最多一条 `UPDATE`**：**每次非幂等状态变更最多执行一条 `UPDATE`；允许在 `UPDATE` 前执行状态读取**。接口全程**不保证**只有一条 SQL。
- **条件 `UPDATE`（必须带原状态条件）**：非幂等路径的 `UPDATE` 必须同时匹配 `DATA_SOURCE_ID` 与**本事务开始时读取到的原始 `FG_ACTIVE`**（含 `NULL` 正确匹配）。等价伪 SQL：

```sql
UPDATE CDC_DATA_SOURCE
SET FG_ACTIVE = :targetStatus
WHERE DATA_SOURCE_ID = :dataSourceId
  AND (
        FG_ACTIVE = :observedStatus
        OR (FG_ACTIVE IS NULL AND :observedStatus IS NULL)
      )
```

- **`observedStatus` 的原状态匹配**：`observedStatus` 为 `NULL` 时**只**匹配数据库 `NULL`；`observedStatus` 为 `'X'` 等**非空异常值**时通过 `FG_ACTIVE = :observedStatus` **精确匹配**；**不得**把所有异常状态统一写成 `FG_ACTIVE IS NULL`（`IS NULL` 无法匹配非空异常值，会导致异常记录停用归一化遗漏）。
- **不得**退化为无状态条件的 `UPDATE CDC_DATA_SOURCE SET FG_ACTIVE='0' WHERE DATA_SOURCE_ID=?`——无状态条件 SQL 会破坏“当前已为 `'0'` 时不执行 DML”的幂等约束，也无法独立区分“目标不存在”与“已经为 `'0'`”，并可能让读取后的旧请求覆盖新状态。状态机（`enable`/`disable` 各分支）见 `DESIGN.md` §13.5 与 `API.md` §11.3。
- **只更新 `FG_ACTIVE` 一列**；不修改任何其他列；**不级联** `CDC_DATA_SOURCE_EXTEND`、客户端、订阅或任何其他表；**不访问**源库；**不操作**进程/ZooKeeper/Kafka（`DS-REQ-168`/`DS-REQ-169`）。
- **影响行数与并发（完全冻结）**：非幂等路径的条件 `UPDATE` 受影响行数为 `1` → 成功；**不为 `1`（包括读取后被其他请求改变导致 `0` 行）→ `50002`（`STATUS_FAILED`）并回滚当前事务**，不留中间状态（`DS-REQ-171`；错误码见 `API.md` §11.4）。**不**引入重试、再次读取后改判成功、悲观锁、乐观版本列或新的错误码。重复目标状态**只有**在本事务首次读取时已处于目标状态，才按幂等成功处理。并发相反请求的最终数据库状态允许为其中一个请求的目标值；发生条件 `UPDATE` 冲突的请求返回 `50002`。**不加锁**、**不使用**乐观版本列（`DS-REQ-171`）。

### 9.4 局部替代声明清单

| # | 被替代的既有数据库结论 | 替代需求 | 边界 |
|---|---|---|---|
| 1 | §2“列表”行 WHERE 中的 `FG_ACTIVE='1'` | `DS-REQ-150` | 只取消列表过滤；ORDER BY 与三条件/角色条件不变 |
| 2 | §2 详情/编辑/删除/业务属性/策略/连接测试各行 WHERE 中“非 `'1'` 视为不存在” | `DS-REQ-155`~`DS-REQ-158` | 只对**自身主记录**放行 `'0'`；`NULL`/非 `0`/`1` 仍 `40400`；角色校验与密码保护不放宽 |
| 3 | §4“`FG_ACTIVE='1'` 固定过滤”条 | `DS-REQ-150`~`DS-REQ-159` | 同上；**目标候选过滤不作替代** |
| 4 | §4“角色限定查询”中两处“非 `'1'` → `40400`” | `DS-REQ-158` | 同上；`40006` 角色不符语义不变；`40005` 新目标库校验不变 |

- §1 物理结构（含 `FG_ACTIVE VARCHAR2(1)` 可空）、§3 更新/删除边界（物理删除、不级联、受影响行数校验、不使用 `ROWNUM=1`）、§5 数据安全、§8 既有声明**全部继续有效**，不被本轮替代。

### 9.5 追踪

| 数据库结论 | 关联 DS-REQ | 关联 DS-AC |
|---|---|---|
| 列表取消 `FG_ACTIVE` 过滤、`fgActive` 原值直传 | 150,151,152,153,154 | 150,151,152 |
| 停用记录允许读/写维护、保存后仍 `'0'` | 155,156,157,158 | 159,160,161,162,163,164 |
| 异常记录可自 `NULL`/非 `0`/`1` 显式归一化为 `'0'`、其它写操作拒绝 | 160,161,162 | 165,166,167 |
| 启停只写 `FG_ACTIVE`、不级联、不访问外部系统 | 168,169 | 168,169 |
| 启停状态机与错误码（`40400`/`40250`/`50002`） | 170,171 | 170,171,172,173,174,175 |
| 目标候选仍只含 `'1'` | 159 | 178 |
| 零 DDL、零存量清洗、新增写 `'1'`、编辑不改状态 | 176,177 | 182 |

## 10. 本轮调整变更记录

### 10.1 初版草案（2026-09-19，任务 `DATA-SOURCE-LIST-ALL-STATUS-ENABLE-DISABLE-UI-ADJUSTMENT-BASELINE-001`）

- 2026-09-19；
- 新增 §9「本轮列表展示全部状态与启用/停用的数据库变化声明（`DRAFT_PENDING_USER_REVIEW`）」与本节；§2 表后、§4 后分别增加“本轮新草案局部替代提示”，显式给出替代边界，未静默改写 §2/§4 既有单元格；
- §9.1 声明**零数据库结构变化、零存量数据清洗**；`fgActive` 为既有物理列 `CDC_DATA_SOURCE.FG_ACTIVE` 的响应映射，不新增列；
- §9.2 冻结新版操作矩阵（列表取消 `FG_ACTIVE` 过滤；详情/编辑/删除/业务属性/策略/编辑态连接测试对自身主记录放行 `'0'`、拒绝 `NULL`/非 `0`/`1`；新增启用/停用两行；目标候选与新增**不作替代**），并明确禁止使用 `FG_ACTIVE <> '1'` 等会放宽到其他历史值的写法；
- §9.3 冻结启停写入边界：只更新 `FG_ACTIVE` 一列、单条 `UPDATE` 短事务、不级联其他表、不访问源库/进程/ZK/Kafka、受影响行数 ≠ 1 → `50002` 回滚、不加锁且最终收敛；
- §9.4 以四条“局部替代声明”冻结对 §2/§4 的替代边界；
- §1 物理结构、§3 更新/删除边界、§5 数据安全、§8 既有声明逐字冻结、未修改；`DS-REQ-001~138` 编号与正文未改；
- 本轮新增需求 `DS-REQ-139~177`（39 条）与本轮新增验收 `DS-AC-141~182`（42 条）全部为 `NOT_RUN`；上一轮 `DS-AC-116~140`（25 条）仍全部 `NOT_RUN`，未混入本轮统计；
- 既有正式复验统计 `PASS=113/FAIL=0/BLOCKED=2/NOT_RUN=0`（阻塞 `DS-AC-104`/`DS-AC-108`）逐字保留，未置 `IMPLEMENTED_ACCEPTED`；
- 本轮为纯文档草案：未修改任何业务代码/测试/依赖/配置/SQL/锁文件，未访问数据库/ZK/Kafka，未启动服务，未运行 Maven/npm 测试或构建。

### 10.2 R1 定向修订（2026-09-19，任务 `DATA-SOURCE-LIST-ALL-STATUS-ENABLE-DISABLE-UI-ADJUSTMENT-BASELINE-001-R1`）

- 依据 ChatGPT 对远程提交 `4ccd6610...` 的 R1 复审结论 `CHANGES_REQUIRED`（3 类阻塞问题），只做对应最小修订；§9.1 零数据库变化声明、§9.4 局部替代清单、操作矩阵对停用/异常记录的允许范围**不变**。
- **§9.2 启停两行重写**：明确两个操作均**先读**当前记录（不按 `FG_ACTIVE='1'` 过滤），非幂等路径使用**带原状态条件**的 `UPDATE`（`enable` 匹配 `'0'`；`disable` 匹配 `'1'` 或 `NULL`/非 `0`/`1` 的原始值）；`'0'`（`disable`）与 `'1'`（`enable`）保持幂等不写；记录不存在 → `40400` 不写。
- **§9.3 重写**：删除无状态条件的 `UPDATE ... WHERE DATA_SOURCE_ID=?`，给出等价伪 SQL（`DATA_SOURCE_ID` + 事务首次读取的原始 `FG_ACTIVE`，含 `NULL` 匹配）；“单条 `UPDATE` 短事务”修正为“**每次非幂等状态变更最多执行一条 `UPDATE`，允许 `UPDATE` 前先读取**”；影响行数 ≠ 1（含读取后被改变导致 `0` 行）→ `50002` 回滚；并发冲突请求返回 `50002`；不引入重试/悲观锁/乐观版本/新错误码。
- §1 物理结构、§2/§4 既有单元格、§3 更新/删除边界、§5 数据安全、§8 既有声明**逐字冻结**；`DS-REQ-001~177` 编号与正文零变化；本轮草案状态仍为 `DRAFT_PENDING_USER_REVIEW`、`implementation_status=NOT_STARTED`、`implementation_authorization_status=NOT_GRANTED_IN_THIS_TASK`、`new_adjustment_acceptance_status=ALL_NOT_RUN`；未访问数据库/ZK/Kafka，未启动服务。

### 10.3 R2 极小修订（2026-09-19，任务 `DATA-SOURCE-LIST-ALL-STATUS-ENABLE-DISABLE-UI-ADJUSTMENT-BASELINE-001-R2`）

- 依据 ChatGPT 对远程 R1 提交 `c4e1048...` 的复审结论 `CHANGES_REQUIRED`（唯一阻塞，两处关联表述错误），只做 §9.2 的最小修订，不重写 §9.3 通用条件。
- **§9.2「停用」行修正**：`NULL`/非 `0`/`1` 不再整体写成 `FG_ACTIVE IS NULL`，改为“使用 §9.3 的 NULL-safe 原状态匹配条件”（`NULL` 用 `FG_ACTIVE IS NULL`，非空异常值用 `FG_ACTIVE=:observedStatus`）；`'0'` 仍幂等不写、记录不存在仍 `40400` 不写。
- **§9.2 错误码说明修正**：删除旧的“`NULL`/非 `0`/`1` 一律视为非法、并把启停接口一并归入 `40250`”整体表述，改为分场景：非启停维护接口 → `40400`；`enable` → `40250` 不写库；`disable` → **不**返回 `40250`，按 NULL-safe 原状态条件归一化为 `'0'`。
- **§9.3 极小交叉引用**：新增一条 `observedStatus` 原状态匹配说明（`NULL` 只匹配 `NULL`；非空异常值经 `FG_ACTIVE = :observedStatus` 精确匹配；禁止统一写成 `FG_ACTIVE IS NULL`）；§9.3 伪 SQL、`50002` 回滚与并发结论**不变**。
- §9.1 零数据库变化声明、§9.4 局部替代清单、§9.5 追踪、§2/§4 既有单元格、§1 物理结构、§3 更新/删除边界、§5 数据安全、§8 既有声明**逐字冻结**；`DS-REQ-001~177` 编号与正文零变化；本轮草案状态仍为 `DRAFT_PENDING_USER_REVIEW`、`NOT_STARTED`、`NOT_GRANTED_IN_THIS_TASK`、`ALL_NOT_RUN`；未访问数据库/ZK/Kafka，未启动服务。
