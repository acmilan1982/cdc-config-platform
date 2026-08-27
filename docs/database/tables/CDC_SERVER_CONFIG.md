# CDC_SERVER_CONFIG — 中心端配置项表（候选补充基线）

> 文档状态：`DRAFT_PENDING_USER_REVIEW`
> 候选基线任务：DATABASE-BASELINE-SERVER-CONFIG-001
> 核验时间：2026-08-27
> 数据库：Oracle 19c 开发库（192.168.174.65:1521/prod.enmotech.com）
> Schema：CDC
> 元数据来源：真实数据库只读核验（ALL_TABLES / ALL_TAB_COLUMNS / ALL_COL_COMMENTS / ALL_CONSTRAINTS / ALL_INDEXES / ALL_OBJECTS / ALL_DEPENDENCIES / COUNT(*) 等）
> 关联代码模块 / Feature：无（当前仓库无生产代码访问；仅占位路由与占位页提及表名，见 §8）
> 数据维护方：未来“中心端配置”Feature 只维护既有记录中 `IS_EDITABLE` 允许编辑行的 `CONFIG_VALUE`（`CONFIRMED_BY_OWNER` / `FUTURE_FEATURE_TARGET`；当前未实现）

> 本文档为**候选补充基线**，尚未获批准。批准前不得视为正式项目级数据库基线的一部分；现有 14 表总基线、关系、码值、画像和变更记录均未因本文档改变。

---

## 1. 基本信息

| 项 | 值 |
|---|---|
| 表用途 | 中心端配置项表：存放中心端进程的配置项（key/value + 可编辑标记） |
| 表类型 | 普通堆表（NON-PARTITIONED） |
| 主键 | `PK_CDC_SERVER_CONFIG`（`ID_SERVER_CONFIG`） |
| 外键 | 无（本项目不使用物理外键；通过 `SERVER_ID` 与 `CDC_SERVER` 构成逻辑关系） |
| 分区 | 无（本次核验 `ALL_TAB_PARTITIONS` 未发现，`ALL_TABLES.PARTITIONED=NO`） |
| LOB | 无 |
| 当前读写属性 | 只读（当前仓库无读写路径；未来 Feature 才允许受控修改 `CONFIG_VALUE`） |
| 表注释 | 无（`ALL_TAB_COMMENTS` 未返回注释） |
| 对象状态 | TABLE / VALID |
| LAST_DDL_TIME | 2026-08-27 |

---

## 2. 字段结构

| # | 字段名 | Oracle类型 | 字符长度 | 精度/小数 | 可空 | 默认值 | 字段注释 |
|---|---|---|---|---|---|---|---|
| 1 | ID_SERVER_CONFIG | VARCHAR2 | 32 | — | N | — | 记录id |
| 2 | SERVER_ID | VARCHAR2 | 32 | — | Y | — | 服务端id |
| 3 | CONFIG_DESC | VARCHAR2 | 1024 | — | Y | — | 配置项描述 |
| 4 | CONFIG_KEY | VARCHAR2 | 64 | — | Y | — | 配置项key |
| 5 | CONFIG_VALUE | VARCHAR2 | 64 | — | Y | — | 配置项value |
| 6 | IS_EDITABLE | CHAR | 1 | — | Y | 1 | 当前配置项是否可编辑 |

说明（均为 `OBSERVED_DATABASE`）：

- 字段顺序为 `ALL_TAB_COLUMNS.COLUMN_ID` 顺序。
- 只有 `ID_SERVER_CONFIG` 为 NOT NULL（主键 + `SYS_C0043138`）；其余字段均可空、无默认值（`IS_EDITABLE` 除外，见下）。
- `IS_EDITABLE` 物理类型为 `CHAR(1)`、可空、默认值 `1`（`DATA_DEFAULT='1'`），字段注释“当前配置项是否可编辑”。数据库未对其建立 CHECK 约束（见 §3）；不得仅凭当前取值分布推断其合法值全集。

---

## 3. 约束

| 类型 | 名称 | 字段 | 状态 |
|---|---|---|---|
| PRIMARY KEY | PK_CDC_SERVER_CONFIG | ID_SERVER_CONFIG | ENABLED |
| CHECK (NOT NULL) | SYS_C0043138 | ID_SERVER_CONFIG | ENABLED |

- 无 UNIQUE（除主键外）、无 FOREIGN KEY。
- 无其他 CHECK 约束；`IS_EDITABLE` 不受数据库 Check 约束，其取值校验只能依赖未来 Feature 应用层规则（`FUTURE_FEATURE_TARGET`）。
- 数据库不存在 `(SERVER_ID, CONFIG_KEY)` 唯一约束；当前数据无重复配置项 key，属数据事实（`OBSERVED_DATABASE`），不是数据库强制唯一。

---

## 4. 索引

| 名称 | 唯一性 | 类型 | 字段（顺序） | 状态 |
|---|---|---|---|---|
| PK_CDC_SERVER_CONFIG | UNIQUE | NORMAL | ID_SERVER_CONFIG (1) | VALID |

- 无表达式索引（`ALL_IND_EXPRESSIONS` 未发现）。
- 无 `SERVER_ID`、`CONFIG_KEY` 上的普通索引；按 `SERVER_ID` 关联查询时依赖全表扫描（当前表为小表，本次核验 8 行）。

---

## 5. 分区

本次核验未发现分区（`ALL_TAB_PARTITIONS` 无记录，`ALL_TABLES.PARTITIONED=NO`）。

## 6. LOB

无 LOB 字段。

## 7. 触发器 / 序列 / 视图 / 依赖对象

- 触发器：本次核验未发现。
- 序列：本次核验未发现。
- 视图：本次核验未发现。
- 其他依赖对象：本次核验未发现。
- 无数据库层自动插入时间、自动更新时间等触发器行为。

---

## 8. 当前代码访问入口与读写边界

仓库代码只读核验结果（`OBSERVED_CODE`）：

| 层 | 文件 | 内容 | 读写属性 |
|---|---|---|---|
| 前端路由 | `frontend/src/router/index.ts` | 路由 `/config/server`（name `ServerConfig`，title “服务端配置”，group “配置管理”）指向占位页 | 占位 |
| 前端页面 | `frontend/src/views/server-config/ServerConfigPage.vue` | 占位页（`PlaceholderPage`），info 文本提及“CDC_SERVER、CDC_SERVER_CONFIG”，无任何数据访问 | 占位 |
| 前端构建产物 | `backend/src/main/resources/static/assets/ServerConfigPage-BLgdPsG8.js` | 提交进仓库的既有 Vite 构建产物，仅含占位页字符串 | 构建产物 |

- 未发现任何 Java Entity、Mapper、Service、Controller、XML Mapper 或 SQL 访问 `CDC_SERVER_CONFIG`。
- 当前仓库不存在中心端配置 Feature 的查询或批量保存接口（`OBSERVED_CODE`）。

维护边界（负责人确认事实，`CONFIRMED_BY_OWNER`）：

1. 后续“中心端配置”Feature 只维护 `CDC_SERVER_CONFIG` 的既有记录，**禁止新增、删除**。
2. 只有 `IS_EDITABLE` 表示当前配置项是否允许编辑；只有 `IS_EDITABLE` 允许编辑的记录才能修改。
3. 可编辑记录也**只允许修改 `CONFIG_VALUE`**，其他字段均只读。
4. `CONFIG_VALUE` 到目前为止不包含敏感内容，不要求脱敏；这只是当前业务事实，不代表以后永远不得增加敏感配置。
5. 上述第 1–3 项为未来 Feature 目标（`FUTURE_FEATURE_TARGET`），不是当前已实现的代码事实。

---

## 9. 与 CDC_SERVER 的关系

| 项 | 值 |
|---|---|
| 关系 | 多对一（多条配置属于一个中心端），负责人确认（`CONFIRMED_BY_OWNER`） |
| 关联字段 | `CDC_SERVER_CONFIG.SERVER_ID` ↔ `CDC_SERVER.SERVER_ID` |
| 物理外键 | 无（`ALL_CONSTRAINTS` 中两表均无类型 `R` 约束） |
| 关系性质 | 仅逻辑关系，无物理外键强制（项目架构决策，非缺陷） |
| 配置项标识 | 物理唯一标识为主键 `ID_SERVER_CONFIG`（`OBSERVED_DATABASE`）；业务语义标识为 `CONFIG_KEY`（字段注释“配置项key”，`OBSERVED_DATABASE`） |
| 重复与孤立核验 | 当前 8 条记录全部归属 `Server001`；无孤儿引用、无重复 `CONFIG_KEY`（见 §10） |

---

## 10. 当前数据画像（开发库快照，`OBSERVED_DATABASE`）

核验时间 2026-08-27，精确 `COUNT(*)` 结果：

| 项 | 值 |
|---|---|
| 总记录数 | 8 |
| 归属中心端 | 全部为 `Server001`（按 `SERVER_ID` 分组：`Server001` → 8） |
| `SERVER_ID` 为 NULL 的记录 | 0 |
| 找不到对应中心端的孤立引用 | 0（所有 `SERVER_ID` 均能在 `CDC_SERVER` 中找到） |
| 同一中心端下重复 `CONFIG_KEY` | 0（数据库无对应唯一约束，当前无重复为数据事实） |
| `CONFIG_KEY` 为 NULL 的记录 | 0 |

`IS_EDITABLE` 当前取值分布：

| IS_EDITABLE | 记录数 |
|---|---|
| 1 | 6 |
| 0 | 2 |

配置项 key 清单（与 `IS_EDITABLE` 编辑标记，仅列对编辑规则有价值的信息，未复制全部 `CONFIG_VALUE` 内容）：

| CONFIG_KEY | IS_EDITABLE |
|---|---|
| auto-create-table | 1 |
| auto-expand-column-length | 1 |
| monitor-metric-topic-name | 0 |
| raw-message-storage-strategy | 1 |
| realtime-insert-batch-enabled-database-types | 1 |
| server-log-topic-name | 0 |
| snapshotBatchSize | 1 |
| tableRowDeleteStrategy | 1 |

`CONFIG_VALUE` 样本观察：取值类型为布尔/数字/枚举/主题名等普通配置值（如 `true`/`false`、数值、`PLAIN`、`DELETE`、数据库类型枚举、topic 名），未发现敏感内容。负责人已确认当前 `CONFIG_VALUE` 无敏感内容（`CONFIRMED_BY_OWNER`）。

> 以上全部为开发库当前数据快照，不代表生产常态，也不代表数据库允许值全集。

---

## 11. 已知结构差异、待确认项与观察项

- `IS_EDITABLE` 无数据库 Check 约束：其取值语义（如 `0/1` 之外是否还有其他合法值）只能由未来 Feature 应用层定义（`FUTURE_FEATURE_TARGET`）；当前数据仅出现 `0/1`（`OBSERVED_DATABASE`），不得写成数据库允许值全集。
- `SERVER_ID`、`CONFIG_KEY`、`CONFIG_VALUE`、`CONFIG_DESC` 均无 NOT NULL 约束；未来 Feature 若依赖这些字段必须为应用层提供，需在需求阶段确认（`FUTURE_FEATURE_TARGET` 前瞻）。
- `(SERVER_ID, CONFIG_KEY)` 无数据库唯一约束；若未来业务要求配置项 key 在中心端内唯一，需由需求确认后走独立收口任务（`PENDING_USER_CONFIRMATION` 前瞻，非当前冲突）。
- 无其他待确认项。

---

## 12. 文档级变更记录

| 日期 | 变更 | 依据 |
|---|---|---|
| 2026-08-27 | 建立单表候选补充基线（DRAFT_PENDING_USER_REVIEW） | DATABASE-BASELINE-SERVER-CONFIG-001 真实数据库只读核验 |

> 本文档为候选基线，未获批准；批准流程与后续收口见 `docs/database/reports/DATABASE-BASELINE-SERVER-CONFIG-001.md`。
