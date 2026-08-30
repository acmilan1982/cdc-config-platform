# CHANGELOG — 数据库结构历史（项目数据库物理基线）

> 文档状态：`APPROVED`
> 批准任务：PROJECT-DATABASE-BASELINE-APPROVAL-001
> 批准日期：2026-08-26
> 批准基线提交：35ca45d3fab23ac95c5fb42c6623cfb7589ce82a
> 核验时间：2026-08-26
> 数据库：Oracle 19c 开发库（192.168.174.65:1521/prod.enmotech.com）
> Schema：CDC
> 说明：本文件记录**数据库结构**的已确认变化历史，区分“已在数据库发生并核验（仅限有明确依据，变更日期可证或经项目负责人确认）”“仅在历史资料声称、本次无法确认”“候选物理设计（待独立决策，未实施，不得写成事实）”。LAST_DDL_TIME 仅证明最后一次 DDL 时间，不能据此推断变更内容与日期，故不将当前物理结构登记为有准确日期的历史变更。本基线任务仅创建文档，**未对数据库做任何结构变更**。

---

## 1. 已在数据库发生并核验的 DDL/DML 事实

### 1.1 有明确确认依据的历史变更

| 日期 | 对象 | 变化 | 环境 | 依据 | 数据库是否真实执行 | 本次文档核验状态 |
|---|---|---|---|---|---|---|
| 历史（早于本次核验，经项目负责人确认） | CDC_CLIENT_MULTIPLE | 历史存在重复记录（21→3 条），经项目负责人清理（DML）；CLIENT_ID 设为主键（DDL）；本次核验主键 `PK_CDC_CLIENT_MULTIPLE` 存在 | 开发库 CDC | 白名单历史资料 + 项目负责人确认 + ALL_CONSTRAINTS | 是（历史发生） | 核验通过（主键存在） |

### 1.2 当前物理事实（变更日期不可证）

以下为当前物理事实，由真实数据库只读核验确认；变更日期与变更内容无从考证，不登记为有准确日期的历史变更：

- 14 张使用表当前字段/约束/索引/注释以 `SCHEMA.md` 与 `tables/` 为准；`ALL_OBJECTS.LAST_DDL_TIME` 仅证明最后一次 DDL 时间，不能据此推断变更内容。
- CDC_LOG_CORRECT / CDC_LOG_ERROR：当前表注释“同步正确日志表 / 同步错误日志表”；CDC_LOG_ERROR 当前含 3 个非主键索引（INSTRUCTION_TYPE / INSERT_TIME+SOURCE_DATA_SOURCE_ID / TARGET_TIME+SOURCE_DATA_SOURCE_ID+SOURCE_SCHEMA_NAME）。
- CDC_JOB_FAILURE_EVENT / CDC_JOB_FAILURE_HANDLE_LOG：当前含详细表注释（事件表/处理记录表语义）。
- 6 张 CDC_STATS_* 统计结果/配置/水位表：当前表注释（总览/维度/配置/水位语义）。
- CDC_DATA_SOURCE_EXTEND 当前含字段 `TARGET_DATA_SOURCE_ID`（VARCHAR2(128)，当前代码 Entity 未映射；字段含义见 RELATIONS R15）。

> 以上均非本次任务执行的 DDL；本次任务未执行任何数据库写操作。

## 2. 仅在历史资料声称、本次无法确认的变化

| 资料 | 声称 | 本次核验结果 | 状态 |
|---|---|---|---|
| `docs/database/open-questions.md`（历史 DB-Q 确认记录） | CDC_DATA_SUBSCRIBE 的 DATA_SUB_ID 主键“已验证” | 2026-08-26 首次核验未发现主键（D01/P4）；2026-08-30 定向只读核验 `ALL_CONSTRAINTS`/`ALL_INDEXES` 确认主键 `PK_CDC_DATA_SUBSCRIBE`（`DATA_SUB_ID`）存在：PRIMARY KEY、ENABLED、NOT DEFERRABLE IMMEDIATE，对应唯一索引 NORMAL/UNIQUE/VALID（LAST_DDL_TIME 2026-08-28 17:36:20） | 已确认（2026-08-30 只读核验 `DATABASE_VERIFIED`）：主键 `PK_CDC_DATA_SUBSCRIBE`（`DATA_SUB_ID`）确已建立，历史“已验证”记载成立；原 P4 关闭判定（2026-08-26 误判为旧资料错误）与 D01 待决策状态一并更新 |
| `docs/database/table-detail.md`（2026-07-03 快照） | 旧 10 表白名单（含 CDC_SERVER/SERVER_CONFIG/TOPIC_OFFSET/RUN_STATE 等）及部分字段类型记录 | 本次核验确认当前生产代码仅使用 14 张表；部分旧字段类型记录（如 RESULT_CODE/OFFSET）需以本次核验为准（NUMBER(10)） | 旧资料部分过时，已历史化；差异见报告 |

## 3. 待独立决策的候选物理设计（`PENDING_DECISION`，未实施、不得写成事实）

| 编号 | 对象 | 候选内容 | 当前物理事实 | 状态 |
|---|---|---|---|---|
| D03 | CDC_JOB_FAILURE_EVENT | 是否为 CLIENT_ID / DATA_SOURCE_ID / FAILURE_TIME 等查询字段补索引 | 仅主键索引 | `PENDING_DECISION`（候选物理设计，未经正式批准，不承诺实施或排期） |
| D04 | CDC_JOB_FAILURE_HANDLE_LOG | 是否为 FAILURE_EVENT_ID / CLIENT_ID / DATA_SOURCE_ID 补索引 | 仅主键索引 | `PENDING_DECISION`（候选物理设计，未经正式批准，不承诺实施或排期） |

原 R01（是否约束每数据源一条扩展配置，一对一必填目标）已由已批准数据源管理 Feature 基线关闭：当前决定为第一版不新增主键、唯一约束、索引或任何 DDL；`(DATA_SOURCE_ID, TARGET_DATA_SOURCE_ID)` 逻辑联合唯一由后端保存前查询校验。本关闭仅为文档基线调整，**未改变数据库结构**，不得写成数据库结构已经改变。

原 D01（是否将 DATA_SUB_ID 设置为主键）已关闭：`CDC_DATA_SUBSCRIBE.DATA_SUB_ID` 已成为数据库真实主键（`PK_CDC_DATA_SUBSCRIBE`，PRIMARY KEY、ENABLED、NOT DEFERRABLE IMMEDIATE，唯一有效索引；2026-08-30 只读核验 `DATABASE_VERIFIED`，LAST_DDL_TIME 2026-08-28 17:36:20），不再作为候选物理设计。该主键由项目侧 DDL 建立（2026-08-28），本任务未执行任何 DDL；本关闭仅为文档基线修正，数据库结构本身无变化。

## 4. 文档级变更记录

| 日期 | 变更 | 依据 |
|---|---|---|
| 2026-08-26 | 建立数据库结构历史基线（DRAFT_PENDING_USER_REVIEW）；本任务不产生数据库结构变化 | PROJECT-DATABASE-BASELINE-001 只读核验 |
| 2026-08-26 | R1：修正结构历史边界（LAST_DDL_TIME 不证变更内容）；SUBSCRIBE 主键冲突关闭为 P4；候选物理设计状态改为 PENDING_DECISION | PROJECT-DATABASE-BASELINE-001-R1 修订 |
| 2026-08-26 | 批准：项目级数据库基线正式批准收口（APPROVED） | PROJECT-DATABASE-BASELINE-APPROVAL-001 批准 |
| 2026-08-27 | 只读核验并建立 CDC_SERVER、CDC_SERVER_CONFIG 两张表候选基线（DATABASE-BASELINE-SERVER-CONFIG-001）；本批准任务将两张表纳入已批准物理基线（DATABASE-BASELINE-SERVER-CONFIG-APPROVAL-001，候选事实来源提交 `175558173ce6703542e4b626aace5ceef2841ece`）；本次未执行任何 DDL、DML，未改变数据库结构或数据；此项为文档基线变化，不是数据库物理变化 | DATABASE-BASELINE-SERVER-CONFIG-001（候选）+ DATABASE-BASELINE-SERVER-CONFIG-APPROVAL-001（批准） |
| 2026-08-29 | 已批准数据源管理 Feature 规则同步：原 R01 候选物理设计（是否约束每数据源一条扩展配置/一对一必填目标）由 `PENDING_DECISION` 关闭，明确旧候选已被已批准 Feature 规则取代；记录当前决定：第一版不新增主键、唯一约束、索引或 DDL，`(DATA_SOURCE_ID, TARGET_DATA_SOURCE_ID)` 逻辑联合唯一由后端查询校验；不改写任何已发生 DDL/DML 历史；数据库结构未改变 | DATA-SOURCE-BASELINE-IMPACT-ALIGNMENT-001（已批准业务规则向权威数据库基线同步；纯文档任务，数据库物理结构无变化） |
| 2026-08-30 | 定向核验并修正主键物理基线：确认 `CDC_DATA_SUBSCRIBE.DATA_SUB_ID` 已是数据库真实主键（`PK_CDC_DATA_SUBSCRIBE`，PRIMARY KEY、ENABLED、NOT DEFERRABLE IMMEDIATE，唯一有效索引，LAST_DDL_TIME 2026-08-28 17:36:20）；§2 SUBSCRIBE 历史冲突行更新为“历史‘已验证’记载成立”，§3 原 D01 由 `PENDING_DECISION` 关闭并注明主键由项目侧 DDL 建立；不改写任何其他已发生 DDL/DML 历史；数据库结构未改变 | DATA-SUBSCRIPTION-REQUIREMENTS-BASELINE-001（只读核验 `DATABASE_VERIFIED`；纯文档基线修正，未执行任何 DDL） |
