# CHANGELOG — 数据库结构历史（项目数据库物理基线）

> 文档状态：`DRAFT_PENDING_USER_REVIEW`
> 核验时间：2026-08-26
> 数据库：Oracle 19c 开发库（192.168.174.65:1521/prod.enmotech.com）
> Schema：CDC
> 说明：本文件记录**数据库结构**的已确认变化历史，区分“已在数据库发生并核验”“仅在历史资料声称、本次无法确认”“尚未执行的计划/延期物理设计”。本基线任务仅创建文档，**未对数据库做任何结构变更**。

---

## 1. 已在数据库发生并核验的 DDL/DML 事实

| 日期 | 对象 | 变化 | 环境 | 依据 | 数据库是否真实执行 | 本次文档核验状态 |
|---|---|---|---|---|---|---|
| 2026-07-02~2026-08-06（按 LAST_DDL_TIME） | 14 张使用表 | 各表结构（字段/约束/索引/注释）为当前事实，LAST_DDL_TIME 见各单表文档 §1 | 开发库 CDC | ALL_OBJECTS.LAST_DDL_TIME | 是（历史发生） | 核验通过 |
| 历史（早于本次核验） | CDC_CLIENT_MULTIPLE | 历史存在重复记录（21→3 条），经项目负责人清理并将 CLIENT_ID 设为主键；本次核验主键 `PK_CDC_CLIENT_MULTIPLE` 存在 | 开发库 CDC | 白名单历史资料 + 项目负责人确认 + ALL_CONSTRAINTS | 是（历史发生） | 核验通过（主键存在） |
| 历史（早于本次核验） | CDC_LOG_CORRECT / CDC_LOG_ERROR | 表注释“同步正确日志表 / 同步错误日志表”；CDC_LOG_ERROR 当前含 3 个非主键索引（INSTRUCTION_TYPE / INSERT_TIME+SOURCE_DATA_SOURCE_ID / TARGET_TIME+SOURCE_DATA_SOURCE_ID+SOURCE_SCHEMA_NAME） | 开发库 CDC | ALL_TAB_COMMENTS / ALL_INDEXES | 是（历史发生） | 核验通过 |
| 历史（早于本次核验） | CDC_JOB_FAILURE_EVENT / CDC_JOB_FAILURE_HANDLE_LOG | 详细表注释（事件表/处理记录表语义） | 开发库 CDC | ALL_TAB_COMMENTS | 是（历史发生） | 核验通过 |
| 历史（早于本次核验） | 5 张大屏统计表 | 表注释（总览/维度/配置/水位语义） | 开发库 CDC | ALL_TAB_COMMENTS | 是（历史发生） | 核验通过 |
| 历史（早于本次核验） | CDC_DATA_SOURCE_EXTEND | 新增列 `TARGET_DATA_SOURCE_ID`（VARCHAR2(128)，本次核验发现、当前代码 Entity 未映射） | 开发库 CDC | ALL_TAB_COLUMNS | 是（历史发生） | 核验通过（差异 D02 延伸项，见 §9 单表文档与报告） |

> 以上均非本次任务执行的 DDL；本次任务未执行任何数据库写操作。

## 2. 仅在历史资料声称、本次无法确认的变化

| 资料 | 声称 | 本次核验结果 | 状态 |
|---|---|---|---|
| `docs/database/open-questions.md`（历史 DB-Q 确认记录） | CDC_DATA_SUBSCRIBE 的 DATA_SUB_ID 主键“已验证” | 本次核验 `ALL_CONSTRAINTS`/`ALL_INDEXES` 未发现 SUBSCRIBE 任何主键/唯一约束/索引（D01） | 冲突，列 `PENDING_USER_CONFIRMATION`（见报告冲突清单） |
| `docs/database/table-detail.md`（2026-07-03 快照） | 旧 10 表白名单（含 CDC_SERVER/SERVER_CONFIG/TOPIC_OFFSET/RUN_STATE 等）及部分字段类型记录 | 本次核验确认当前生产代码仅使用 14 张表；部分旧字段类型记录（如 RESULT_CODE/OFFSET）需以本次核验为准（NUMBER(10)） | 旧资料部分过时，已历史化；差异见报告 |

## 3. 尚未执行的计划/延期物理设计（不得写成事实）

| 编号 | 对象 | 计划内容 | 当前物理事实 | 状态 |
|---|---|---|---|---|
| D01 | CDC_DATA_SUBSCRIBE | 将 DATA_SUB_ID 设置为主键 | 无主键、无唯一约束、无索引 | `DEFERRED`（另建数据库整改任务） |
| R01 | CDC_DATA_SOURCE_EXTEND | 目标规则：每数据源一条扩展配置（一对一必填） | 无唯一约束/外键，物理允许 0..N，存在测试构造的重复/孤立/缺失 | `DEFERRED`（另建数据库整改任务） |
| D03 | CDC_JOB_FAILURE_EVENT | 为 CLIENT_ID / DATA_SOURCE_ID / FAILURE_TIME 等查询字段补索引 | 仅主键索引 | `DEFERRED` |
| D04 | CDC_JOB_FAILURE_HANDLE_LOG | 为 FAILURE_EVENT_ID / CLIENT_ID / DATA_SOURCE_ID 补索引 | 仅主键索引 | `DEFERRED` |

## 4. 文档级变更记录

| 日期 | 变更 | 依据 |
|---|---|---|
| 2026-08-26 | 建立数据库结构历史基线（DRAFT_PENDING_USER_REVIEW）；本任务不产生数据库结构变化 | PROJECT-DATABASE-BASELINE-001 只读核验 |
