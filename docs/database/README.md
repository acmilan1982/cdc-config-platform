# 数据库文档总入口（CDC 配置管理平台）

> 文档状态：`APPROVED`
> 批准任务：PROJECT-DATABASE-BASELINE-APPROVAL-001
> 批准日期：2026-08-26
> 批准基线提交：35ca45d3fab23ac95c5fb42c6623cfb7589ce82a
> 核验时间：2026-08-26
> 数据库：Oracle 19c 开发库（192.168.174.65:1521/prod.enmotech.com）
> Schema：CDC
> 建立任务：PROJECT-DATABASE-BASELINE-001（只读核验 + 文档基线）

---

## 1. 文档目的与适用范围

本目录是 CDC 配置管理平台的**数据库结构权威文档入口**。登记 16 张已批准单表物理基线的物理结构、跨表关系、公共码值、数据现状与规模画像，以及可复用的只读核验方法。分层为：**14 张当前生产代码实际访问表 + 2 张已批准、待 `server-config` Feature 实现使用表（`CDC_SERVER`、`CDC_SERVER_CONFIG`）**。适用范围：本平台的数据库分析、设计、开发、修复、测试、文档与运维准备工作。

## 2. 数据库、Schema 与环境边界

- Oracle Database 19c Enterprise（19.3.0.0.0），Schema `CDC`，开发库 `192.168.174.65:1521/prod.enmotech.com`。
- 文档基于真实数据库只读核验；**数据库是物理事实来源，文档是已核验快照**。发现不一致时以数据库为准并更新文档。
- 环境事实（字符集 AL32UTF8、DBTIMEZONE +00:00 等）见 `SCHEMA.md` §1；开发库当前数据为瞬时快照，不代表生产常态（见 `DATA_PROFILE.md`）。

## 3. 文档职责与导航

| 文档 | 职责 |
|---|---|
| [SCHEMA.md](SCHEMA.md) | Schema 整体概览：数据库环境事实、16 张已批准单表基线总清单（14 张当前访问 + 2 张已批准待 Feature 实现）、对象（视图/序列/触发器/物化视图/存储过程）情况、物理外键总体情况、未使用/已废弃/待分析对象分类 |
| [tables/](tables/) | 16 张单表物理基线，一表一文件（`CDC_XXX.md`），见 §4 索引 |
| [RELATIONS.md](RELATIONS.md) | 跨表关系：物理外键、逻辑关系 R01～R16、逗号分隔多值弱引用、失败 Job ID 链 |
| [CODE_VALUES.md](CODE_VALUES.md) | 项目级公共码值：FG_ACTIVE、DATA_SOURCE_TYPE/CATEGORY、命名策略、日志指令/结果码、事件/阶段枚举、统计结果表码值 |
| [VERIFICATION.md](VERIFICATION.md) | 可复用的 Oracle 只读元数据核验查询与文档自检清单 |
| [CHANGELOG.md](CHANGELOG.md) | 数据库结构历史：已发生并核验的 DDL/DML、历史声称但未确认、计划/延期物理设计 |
| [DATA_PROFILE.md](DATA_PROFILE.md) | 数据现状与负责人规模画像：精确/估算行数、负责人确认的硬上限与量级、完整性核验、待确认项 |
| [reports/](reports/) | 基线实施报告与批准收口报告，记录核验过程、冲突与结论（`PROJECT-DATABASE-BASELINE-001.md`、`DATABASE-BASELINE-SERVER-CONFIG-001.md`、`DATABASE-BASELINE-SERVER-CONFIG-APPROVAL-001.md`） |

## 4. 表索引（16 张已批准单表物理基线）

### 4.1 当前生产代码实际访问表（14 张）

| 表 | 用途摘要 | 单表文档 |
|---|---|---|
| CDC_DATA_SOURCE | 数据源配置主表（源库/目标库） | [tables/CDC_DATA_SOURCE.md](tables/CDC_DATA_SOURCE.md) |
| CDC_DATA_SOURCE_EXTEND | 数据源扩展配置（目标表命名策略） | [tables/CDC_DATA_SOURCE_EXTEND.md](tables/CDC_DATA_SOURCE_EXTEND.md) |
| CDC_CLIENT_MULTIPLE | 客户端（探针）注册表 | [tables/CDC_CLIENT_MULTIPLE.md](tables/CDC_CLIENT_MULTIPLE.md) |
| CDC_DATA_SUBSCRIBE | 订阅配置表 | [tables/CDC_DATA_SUBSCRIBE.md](tables/CDC_DATA_SUBSCRIBE.md) |
| CDC_LOG_CORRECT | 同步正确日志表 | [tables/CDC_LOG_CORRECT.md](tables/CDC_LOG_CORRECT.md) |
| CDC_LOG_ERROR | 同步错误日志表 | [tables/CDC_LOG_ERROR.md](tables/CDC_LOG_ERROR.md) |
| CDC_JOB_FAILURE_EVENT | 作业失败事件表 | [tables/CDC_JOB_FAILURE_EVENT.md](tables/CDC_JOB_FAILURE_EVENT.md) |
| CDC_JOB_FAILURE_HANDLE_LOG | 作业失败处理记录表 | [tables/CDC_JOB_FAILURE_HANDLE_LOG.md](tables/CDC_JOB_FAILURE_HANDLE_LOG.md) |
| CDC_STATS_CUMULATIVE_OVERVIEW | 大屏累计总览结果表 | [tables/CDC_STATS_CUMULATIVE_OVERVIEW.md](tables/CDC_STATS_CUMULATIVE_OVERVIEW.md) |
| CDC_STATS_DAILY_OVERVIEW | 大屏每日总览结果表 | [tables/CDC_STATS_DAILY_OVERVIEW.md](tables/CDC_STATS_DAILY_OVERVIEW.md) |
| CDC_STATS_DIM_CUMULATIVE | 大屏维度累计结果表 | [tables/CDC_STATS_DIM_CUMULATIVE.md](tables/CDC_STATS_DIM_CUMULATIVE.md) |
| CDC_STATS_DIM_DAILY | 大屏维度每日结果表 | [tables/CDC_STATS_DIM_DAILY.md](tables/CDC_STATS_DIM_DAILY.md) |
| CDC_STATS_TASK_CONFIG | 大屏统计任务配置表 | [tables/CDC_STATS_TASK_CONFIG.md](tables/CDC_STATS_TASK_CONFIG.md) |
| CDC_STATS_WATERMARK | 大屏统计水位表 | [tables/CDC_STATS_WATERMARK.md](tables/CDC_STATS_WATERMARK.md) |

> 自校验：上表 14 张 = 当前生产代码实际访问表，每张恰好一个 `tables/表名.md`。

### 4.2 已批准、待 `server-config` Feature 实现使用表（2 张）

以下 2 张表已于 2026-08-27 建立并批准单表物理基线，但当前管理平台生产代码尚未访问；它们已从“历史提及但当前生产代码未使用（待分析）”分类移出（见 `SCHEMA.md` §5），纳入已批准物理基线。**两表批准不等于 `server-config` Feature 已实现**；Feature 实现后再按实际代码事实调整分类。

| 表 | 用途摘要 | 单表文档 |
|---|---|---|
| CDC_SERVER | 中心端登记表（当前 1 行，主键 SERVER_ID；由 sync-server 启动时插入，管理平台不维护） | [tables/CDC_SERVER.md](tables/CDC_SERVER.md) |
| CDC_SERVER_CONFIG | 中心端配置项表（当前 8 行，主键 ID_SERVER_CONFIG；未来 Feature 只更新可编辑记录的 CONFIG_VALUE） | [tables/CDC_SERVER_CONFIG.md](tables/CDC_SERVER_CONFIG.md) |

> 自校验：14 张当前访问 + 2 张已批准待实现 = 16 张已批准单表物理基线，每张恰好一个 `tables/表名.md`。

## 5. Agent 标准读取顺序

1. 本文件（README）→ 明确文档结构与导航；
2. `SCHEMA.md` → 表总清单与对象概览；
3. 按需读取 `tables/CDC_XXX.md` → 单表物理结构（含 14 张当前访问表与 2 张已批准待实现表 `CDC_SERVER` / `CDC_SERVER_CONFIG`）；
4. 跨表分析时读 `RELATIONS.md`；
5. 码值/字段取值读 `CODE_VALUES.md`；
6. 数据规模/画像读 `DATA_PROFILE.md`；
7. 结构变化历史读 `CHANGELOG.md`；
8. 核验方法/自检读 `VERIFICATION.md`；
9. 专项核验过程与冲突读 `reports/PROJECT-DATABASE-BASELINE-001.md`、`reports/DATABASE-BASELINE-SERVER-CONFIG-001.md`、`reports/DATABASE-BASELINE-SERVER-CONFIG-APPROVAL-001.md`。

## 6. 必须重新读库核验的触发条件

一般 Feature 分析、设计和开发，应优先读取已批准且未过期的项目级数据库文档（本目录）及相关 Feature 数据库补充文档，不强制重新连接数据库。只有出现以下任一情形，才必须**定向**重新读库核验：

1. 已知或怀疑发生 DDL（新增/修改字段、约束、索引、注释、分区）；
2. `LAST_DDL_TIME`、字段、约束、索引、注释、分区等元数据可能已变化；
3. 相关文档标记为 `PENDING_REVERIFY`；
4. 目标表或字段未进入现有基线；
5. 代码、文档与数据库事实冲突；
6. 执行数据库物理设计、DDL 设计、数据库专项验收或生产准备；
7. 用户明确要求重新核验。

普通业务规则调整、前端开发、后端非结构性开发、常规单元测试，不得仅因“涉及数据库”就强制重新连接数据库。

## 7. 文档状态定义

| 状态 | 含义 |
|---|---|
| `VERIFIED` | 已按真实数据库核验（当前文档为 `APPROVED`，2026-08-26 批准） |
| `PENDING_REVERIFY` | 需重新读库核验 |
| `HISTORICAL_SUPERSEDED` | 旧文档已被本基线取代，保留历史原貌并指向新权威文档 |
| `DOCUMENTED_NOT_USED` | 数据库存在但当前生产代码未使用（见 `SCHEMA.md` §5） |

> 本项目数据库基线：14 张当前访问表于 2026-08-26 经 PROJECT-DATABASE-BASELINE-APPROVAL-001 批准；2 张已批准待实现表（`CDC_SERVER`、`CDC_SERVER_CONFIG`）于 2026-08-27 经 DATABASE-BASELINE-SERVER-CONFIG-APPROVAL-001 批准。当前已批准单表物理基线共 16 张，统一为 `APPROVED`。

## 8. 元数据与数据画像更新规则

- 结构变更（DDL）后必须重新读库核验并更新对应单表文档、`SCHEMA.md`、`CHANGELOG.md`；
- 数据画像（行数、码值分布）仅在有据可查的观测后更新 `DATA_PROFILE.md`，并保留环境与时间点；
- 不得把开发库瞬时数据描述成生产常态。

## 9. 敏感数据禁止记录规则

- 禁止记录：数据库连接密码、`DATA_SOURCE_PASSWORD` 字段值、`RAW_MESSAGE`、`LOG_DETAIL` 及任何敏感业务原文；
- 禁止输出任何字段的密码值或大字段原文；
- 违反视为基线事故，需立即更正。

## 10. 与 Feature 文档、代码和真实数据库的权威边界

- 数据库结构以真实数据库为准（本目录为已核验快照）；
- 16 张已批准单表物理基线范围内**均不设置物理外键**（14 张当前访问表为项目确认的架构决策，`CDC_SERVER`、`CDC_SERVER_CONFIG` 亦经只读核验确认无物理外键）；数据库不强制保证引用完整性，各写入方和读取方必须在代码层处理空引用、孤立引用与无效引用（详见 `RELATIONS.md` §1）；
- 业务规则、Feature 级设计与代码行为以 `docs/features/` 与 `docs/baseline/` 为准；本目录只登记物理结构、代码访问入口与读写边界，不复制 Feature 详细设计；
- 本目录历史文档（`HISTORICAL_SUPERSEDED`）仅作追溯，不视为当前事实；
- 本目录的修改必须遵循项目 CLAUDE.md 与任务授权，禁止在本目录记录未经核验的推断。

## 11. 文档级变更记录

| 日期 | 变更 | 依据 |
|---|---|---|
| 2026-08-26 | 建立数据库文档总入口（DRAFT_PENDING_USER_REVIEW） | PROJECT-DATABASE-BASELINE-001 只读核验 |
| 2026-08-26 | R1：收窄重新读库触发条件；补充无物理外键架构决策；移除 CDC_CLIENT 现行说明；更新关系编号为 R01～R15 | PROJECT-DATABASE-BASELINE-001-R1 修订 |
| 2026-08-26 | 批准：项目级数据库基线正式批准收口（APPROVED） | PROJECT-DATABASE-BASELINE-APPROVAL-001 批准 |
| 2026-08-27 | 新增 2 张已批准待实现表（CDC_SERVER、CDC_SERVER_CONFIG）：单表基线由 14 增至 16，14+2 分层；关系编号更新为 R01～R16；无物理外键说明覆盖 16 张 | DATABASE-BASELINE-SERVER-CONFIG-001（候选）+ DATABASE-BASELINE-SERVER-CONFIG-APPROVAL-001（批准） |
