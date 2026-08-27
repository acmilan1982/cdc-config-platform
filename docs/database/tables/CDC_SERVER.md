# CDC_SERVER — 中心端登记表（项目数据库物理基线）

> 文档状态：`APPROVED`
> 批准任务：DATABASE-BASELINE-SERVER-CONFIG-APPROVAL-001
> 批准日期：2026-08-27
> 候选事实来源提交：175558173ce6703542e4b626aace5ceef2841ece
> 批准依据：ChatGPT 复审“有条件通过” + 用户/负责人批准收口
> 候选基线任务：DATABASE-BASELINE-SERVER-CONFIG-001（真实数据库只读核验 + 文档基线）
> 核验时间：2026-08-27
> 数据库：Oracle 19c 开发库（192.168.174.65:1521/prod.enmotech.com）
> Schema：CDC
> 元数据来源：真实数据库只读核验（ALL_TABLES / ALL_TAB_COLUMNS / ALL_COL_COMMENTS / ALL_CONSTRAINTS / ALL_INDEXES / ALL_OBJECTS / ALL_DEPENDENCIES / COUNT(*) 等）
> 关联代码模块 / Feature：无（当前仓库无生产代码访问；仅占位路由与占位页提及表名，见 §8）
> 数据维护方：`sync-server` 启动时插入（`CONFIRMED_BY_OWNER`；当前仓库无法验证其实现，见 §8）

> 正式定位：已批准单表物理基线。当前管理平台不维护 `CDC_SERVER` 记录；未来 `server-config` Feature 读取该表以确定唯一中心端并用于异常判断（`FUTURE_FEATURE_TARGET`，尚未实现，见 §8）。本表批准纳入已批准物理基线，不改变“当前生产代码实际访问 14 张表”的事实分层（详见 `docs/database/README.md` 与 `SCHEMA.md`）。

---

## 1. 基本信息

| 项 | 值 |
|---|---|
| 表用途 | 中心端登记表：登记每个中心端进程及其基本属性（负责人确认：中心端实际为独立进程 `sync-server`） |
| 表类型 | 普通堆表（NON-PARTITIONED） |
| 主键 | `PK_CDC_SERVER`（`SERVER_ID`） |
| 外键 | 无（本项目不使用物理外键；与 `CDC_SERVER_CONFIG` 为逻辑关系，见 §9） |
| 分区 | 无（本次核验 `ALL_TAB_PARTITIONS` 未发现，`ALL_TABLES.PARTITIONED=NO`） |
| LOB | 无 |
| 当前读写属性 | 只读（当前仓库无写入路径；写入方为 `sync-server`，负责人确认，仓库不可验证） |
| 表注释 | 中心端 |
| 对象状态 | TABLE / VALID |
| LAST_DDL_TIME | 2026-07-03 |

---

## 2. 字段结构

| # | 字段名 | Oracle类型 | 字符长度 | 精度/小数 | 可空 | 默认值 | 字段注释 |
|---|---|---|---|---|---|---|---|
| 1 | SERVER_ID | VARCHAR2 | 32 | — | N | — | 每个中心端进程的标识符，每个中心端程序在其配置文件中，都预设一个标识符，不同的中心端，标识符不能重复 |
| 2 | SERVER_DESC | VARCHAR2 | 256 | — | Y | — | 中心端进程描述符 |
| 3 | DATA_SOURCE_ID | VARCHAR2 | 32 | — | Y | — | 暂时不用 |
| 4 | FG_ACTIVE | VARCHAR2 | 1 | — | Y | — | 当前中心端是否启动 |

说明（均为 `OBSERVED_DATABASE`）：

- 字段顺序为 `ALL_TAB_COLUMNS.COLUMN_ID` 顺序。
- `SERVER_ID` 为 NOT NULL 且是主键；数据库未提供其他字段的 NOT NULL 或 CHECK 约束（见 §3）。
- `DATA_SOURCE_ID` 字段注释为“暂时不用”，但当前唯一一条记录填有值（`a31a1a6e542747ea8bcbfb12bd43b6b9`，长度 32）。字段当前可空、无默认值；注释语义与当前数据并存，本文档只如实记录，见 §10。

---

## 3. 约束

| 类型 | 名称 | 字段 | 状态 |
|---|---|---|---|
| PRIMARY KEY | PK_CDC_SERVER | SERVER_ID | ENABLED |

- 无 UNIQUE（除主键外）、无 FOREIGN KEY、无 CHECK 约束（`ALL_CONSTRAINTS` 仅返回主键）。
- 表中不存在把“只有一个中心端”作为数据库约束的任何物理定义；当前仅有一条记录属于开发库数据事实（`OBSERVED_DATABASE`），与负责人确认的“当前以及可见的将来只有一个中心端”（`CONFIRMED_BY_OWNER`）一致，但不得理解为数据库已强制唯一。

---

## 4. 索引

| 名称 | 唯一性 | 类型 | 字段（顺序） | 状态 |
|---|---|---|---|---|
| PK_CDC_SERVER | UNIQUE | NORMAL | SERVER_ID (1) | VALID |

- 无表达式索引（`ALL_IND_EXPRESSIONS` 未发现）。
- 无其他普通索引。

---

## 5. 分区

本次核验未发现分区（`ALL_TAB_PARTITIONS` 无记录，`ALL_TABLES.PARTITIONED=NO`）。

## 6. LOB

无 LOB 字段（`ALL_TAB_COLUMNS` 中无 LOB 类型列）。

## 7. 触发器 / 序列 / 视图 / 依赖对象

- 触发器：本次核验未发现（`ALL_TRIGGERS` 无记录）。
- 序列：本次核验未发现。
- 视图：本次核验未发现。
- 其他依赖对象：本次核验未发现直接依赖对象（`ALL_DEPENDENCIES`）。
- 无数据库层自动插入时间、自动更新时间等触发器行为。

---

## 8. 当前代码访问入口与读写边界

仓库代码只读核验结果（`OBSERVED_CODE`）：

| 层 | 文件 | 内容 | 读写属性 |
|---|---|---|---|
| 前端路由 | `frontend/src/router/index.ts` | 路由 `/config/server`（name `ServerConfig`，title “服务端配置”，group “配置管理”）指向占位页 | 占位 |
| 前端页面 | `frontend/src/views/server-config/ServerConfigPage.vue` | 占位页（`PlaceholderPage`），info 文本提及“CDC_SERVER、CDC_SERVER_CONFIG”，无任何数据访问 | 占位 |
| 前端构建产物 | `backend/src/main/resources/static/assets/ServerConfigPage-BLgdPsG8.js` | 提交进仓库的既有 Vite 构建产物，仅含占位页字符串 | 构建产物 |

- 未发现任何 Java Entity、Mapper、Service、Controller、XML Mapper 或 SQL 访问 `CDC_SERVER`。
- `sync-server` 不在当前仓库中（全仓 `rg` 仅在 `docs/**` 命中）。负责人确认 `CDC_SERVER` 记录由 `sync-server` 启动时插入、记录已存在时不重复插入（`CONFIRMED_BY_OWNER`），但**当前仓库无法验证该启动插入实现**；不得把负责人说明写成已由本仓库代码验证。
- 管理平台不为 `CDC_SERVER` 提供独立维护页面，也不允许通过本功能维护其记录（`CONFIRMED_BY_OWNER`）。

读写边界结论：

- 数据库物理事实：表存在、可读；当前仓库无写路径（`OBSERVED_CODE`）。
- 负责人确认事实：写方为 `sync-server` 启动登记；管理平台不维护（`CONFIRMED_BY_OWNER`）。
- 未来目标：后续“中心端配置”Feature 只维护 `CDC_SERVER_CONFIG` 的既有记录，不新增、删除 `CDC_SERVER` 记录（`FUTURE_FEATURE_TARGET`）。

---

## 9. 与 CDC_SERVER_CONFIG 的关系

| 项 | 值 |
|---|---|
| 关系 | 一对多（一个中心端拥有多条配置），负责人确认（`CONFIRMED_BY_OWNER`） |
| 关联字段 | `CDC_SERVER.SERVER_ID` ↔ `CDC_SERVER_CONFIG.SERVER_ID` |
| 物理外键 | 无（`ALL_CONSTRAINTS` 中 `CDC_SERVER`/`CDC_SERVER_CONFIG` 均无类型 `R` 约束） |
| 关系性质 | 仅逻辑关系，无物理外键强制（项目架构决策，非缺陷） |
| 开发库当前数据 | `CDC_SERVER` 1 条记录（`Server001`），`CDC_SERVER_CONFIG` 8 条记录全部挂到 `Server001`；无孤儿引用（见 `CDC_SERVER_CONFIG.md` §10） |

---

## 10. 已知结构差异、待确认项与观察项

- `DATA_SOURCE_ID` 字段注释为“暂时不用”，但当前唯一一条记录填有值（`OBSERVED_DATABASE`）。字段含义与当前数据的关系未由数据库或当前仓库说明，是否纳入未来 Feature 维护范围留待需求阶段确认（`FUTURE_SCOPE_RECONFIRMATION`，未来边界，非当前待确认项）。
- 当前仅一条中心端记录属开发库数据事实，数据库未强制单中心端；若未来出现多中心端，管理平台维护边界需在 `server-config` Feature 需求阶段重新确认（`FUTURE_SCOPE_RECONFIRMATION`，未来边界，非当前待确认项）。
- 当前 `PENDING_USER_CONFIRMATION` 数量为 0；以上均为未来边界前瞻说明，不构成本基线的当前待确认项。

---

## 11. 文档级变更记录

| 日期 | 变更 | 依据 |
|---|---|---|
| 2026-08-27 | 建立单表候选补充基线（DRAFT_PENDING_USER_REVIEW） | DATABASE-BASELINE-SERVER-CONFIG-001 真实数据库只读核验 |
| 2026-08-27 | 批准：纳入项目级数据库物理基线（APPROVED） | DATABASE-BASELINE-SERVER-CONFIG-APPROVAL-001 批准收口（ChatGPT 复审有条件通过） |

> 批准收口与事实分层见 `docs/database/reports/DATABASE-BASELINE-SERVER-CONFIG-APPROVAL-001.md` 与 `docs/database/reports/DATABASE-BASELINE-SERVER-CONFIG-001.md`。
