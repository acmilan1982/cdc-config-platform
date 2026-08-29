# SCHEMA — CDC Schema 整体概览（项目数据库物理基线）

> 文档状态：`APPROVED`
> 批准任务：PROJECT-DATABASE-BASELINE-APPROVAL-001
> 批准日期：2026-08-26
> 批准基线提交：35ca45d3fab23ac95c5fb42c6623cfb7589ce82a
> 核验时间：2026-08-26
> 数据库：Oracle 19c 开发库（192.168.174.65:1521/prod.enmotech.com）
> Schema：CDC
> 元数据来源：真实数据库只读核验（ALL_TABLES / ALL_TAB_COLUMNS / ALL_COL_COMMENTS / ALL_CONSTRAINTS / ALL_INDEXES / ALL_OBJECTS / ALL_LOBS / ALL_TAB_PARTITIONS / DATABASE_PROPERTIES / V$VERSION / V$NLS_PARAMETERS）
> 本文件是数据库结构权威入口之一；单表物理结构见 `tables/` 下 16 个单表基线文件（14 张当前访问表 + 2 张已批准待实现表）。

---

## 1. 数据库环境事实

| 项 | 值 |
|---|---|
| 数据库版本 | Oracle Database 19c Enterprise Edition Release 19.0.0.0.0（Version 19.3.0.0.0） |
| Schema | CDC（普通可读写开发账号，本任务仅做只读核验） |
| NLS_CHARACTERSET（数据库字符集） | AL32UTF8 |
| NLS_NCHAR_CHARACTERSET（国家字符集） | AL16UTF16 |
| DBTIMEZONE | +00:00 |
| SESSIONTIMEZONE（本只读会话） | +08:00 |
| 会话 NLS 参数（本只读会话，随客户端 NLS_LANG 变化） | NLS_LANGUAGE=AMERICAN，NLS_TERRITORY=AMERICA，NLS_DATE_FORMAT=DD-MON-RR |

> 说明：数据库字符集与 DBTIMEZONE 为数据库级事实，可可靠核验。会话级 NLS 参数随连接环境变化，不作为程序运行环境的固定事实。时间字段（DATE）口径与程序侧 Asia/Shanghai 自然日等业务规则属功能级约定，见对应功能基线，不在此展开。

---

## 2. 当前实际使用表总清单（14 张）

下表为当前生产代码实际访问、已建立单表物理基线的 14 张表。主键栏注明数据库层主键；数据维护方栏区分管理平台写入、外部同步程序写入、人工维护及待确认。

| # | 表名 | 表注释 | 主键 | 表类型 | 当前用途 | 读写属性 | 数据维护方 | 单表文档 |
|---|---|---|---|---|---|---|---|---|
| 1 | CDC_DATA_SOURCE | 数据源，包括源库，目标库 | PK_CDC_DATA_SOURCE（DATA_SOURCE_ID） | 普通堆表 | 数据源配置主表（源库/目标库登记） | 读 + 写 | 管理平台（DataSourceServiceImpl CRUD+启停） | [CDC_DATA_SOURCE.md](tables/CDC_DATA_SOURCE.md) |
| 2 | CDC_DATA_SOURCE_EXTEND | （无注释） | 无 | 普通堆表 | 源库到目标库的命名策略（目标表命名策略：前缀/后缀/合并策略） | 读 + 写 | 管理平台（旧候选实现随 CDC_DATA_SOURCE 联写；批准目标为源库 0..N，第一版无 DDL） | [CDC_DATA_SOURCE_EXTEND.md](tables/CDC_DATA_SOURCE_EXTEND.md) |
| 3 | CDC_CLIENT_MULTIPLE | 客户端表 | PK_CDC_CLIENT_MULTIPLE（CLIENT_ID） | 普通堆表 | 客户端（探针）注册表 | 只读 | 人工维护（当前管理平台仅只读；后续计划单独开发 CRUD，尚未实现） | [CDC_CLIENT_MULTIPLE.md](tables/CDC_CLIENT_MULTIPLE.md) |
| 4 | CDC_DATA_SUBSCRIBE | 订阅表 | 无 | 普通堆表 | 订阅配置（源库→目标库订阅关系） | 只读 | 人工维护（当前管理平台仅只读；后续计划单独开发 CRUD，尚未实现） | [CDC_DATA_SUBSCRIBE.md](tables/CDC_DATA_SUBSCRIBE.md) |
| 5 | CDC_LOG_CORRECT | 同步正确日志表 | PK_CDC_LOG_CORRECT（CDC_LOG_ID） | 普通堆表 | 同步正确日志（大屏统计源数据/日志查询） | 只读 | 外部 CDC 同步程序写入 | [CDC_LOG_CORRECT.md](tables/CDC_LOG_CORRECT.md) |
| 6 | CDC_LOG_ERROR | 同步错误日志表 | PK_CDC_LOG_ERROR（CDC_LOG_ID） | 普通堆表 | 同步错误日志（大屏统计源数据/日志查询） | 只读 | 外部 CDC 同步程序写入 | [CDC_LOG_ERROR.md](tables/CDC_LOG_ERROR.md) |
| 7 | CDC_JOB_FAILURE_EVENT | 作业失败事件表 | PK_CDC_JOB_FAILURE_EVENT（ID） | 普通堆表 | Flink job 失败回调事件记录 | 只读 | sync-client 进程写入（管理平台仅只读） | [CDC_JOB_FAILURE_EVENT.md](tables/CDC_JOB_FAILURE_EVENT.md) |
| 8 | CDC_JOB_FAILURE_HANDLE_LOG | 作业失败处理记录表 | PK_CDC_JOB_FAILURE_HANDLE_LOG（ID） | 普通堆表 | 失败事件处理流程各阶段记录 | 只读 | sync-client 进程写入（管理平台仅只读） | [CDC_JOB_FAILURE_HANDLE_LOG.md](tables/CDC_JOB_FAILURE_HANDLE_LOG.md) |
| 9 | CDC_STATS_CUMULATIVE_OVERVIEW | 大屏累计总览结果表 | PK_CDC_STATS_CUM_OVERVIEW（TASK_CODE） | 普通堆表 | 大屏累计总览统计结果 | 读 + 写 | 管理平台大屏统计调度（MERGE） | [CDC_STATS_CUMULATIVE_OVERVIEW.md](tables/CDC_STATS_CUMULATIVE_OVERVIEW.md) |
| 10 | CDC_STATS_DAILY_OVERVIEW | 大屏每日总览结果表 | PK_CDC_STATS_DAILY_OVERVIEW（TASK_CODE, STAT_DATE） | 普通堆表 | 大屏每日总览统计结果 | 读 + 写 | 管理平台大屏统计调度（MERGE） | [CDC_STATS_DAILY_OVERVIEW.md](tables/CDC_STATS_DAILY_OVERVIEW.md) |
| 11 | CDC_STATS_DIM_CUMULATIVE | 大屏维度累计结果表（不保存机构名称） | PK_CDC_STATS_DIM_CUMULATIVE（TASK_CODE, DIM_TYPE, DIM_VALUE） | 普通堆表 | 大屏维度累计统计结果 | 读 + 写 | 管理平台大屏统计调度（MERGE） | [CDC_STATS_DIM_CUMULATIVE.md](tables/CDC_STATS_DIM_CUMULATIVE.md) |
| 12 | CDC_STATS_DIM_DAILY | 大屏维度每日结果表（不保存机构名称） | PK_CDC_STATS_DIM_DAILY（TASK_CODE, DIM_TYPE, DIM_VALUE, STAT_DATE） | 普通堆表 | 大屏维度每日统计结果 | 读 + 写 | 管理平台大屏统计调度（MERGE） | [CDC_STATS_DIM_DAILY.md](tables/CDC_STATS_DIM_DAILY.md) |
| 13 | CDC_STATS_TASK_CONFIG | 大屏统计任务配置表（启动时读取一次，修改后重启生效） | PK_CDC_STATS_TASK_CONFIG（TASK_CODE） | 普通堆表 | 大屏统计任务调度参数 | 只读 | 人工维护（启动时读取一次） | [CDC_STATS_TASK_CONFIG.md](tables/CDC_STATS_TASK_CONFIG.md) |
| 14 | CDC_STATS_WATERMARK | 大屏统计水位表（CORRECT/ERROR 独立水位） | PK_CDC_STATS_WATERMARK（TASK_CODE, LOG_TYPE） | 普通堆表 | 大屏统计增量断点水位 | 读 + 写 | 管理平台大屏统计调度（CAS） | [CDC_STATS_WATERMARK.md](tables/CDC_STATS_WATERMARK.md) |

**自校验：上表 14 行 = 任务确认的 14 张表，每张恰好一个单表文件。**

### 2.1 已批准、待 `server-config` Feature 实现使用表（2 张）

以下 2 张表已于 2026-08-27 建立并批准单表物理基线，但当前生产代码尚未访问（见 §7 权威边界与 `tables/` 下对应文档）。主键栏注明数据库层主键；数据维护方区分外部进程写入与未来 Feature 维护。

| # | 表名 | 表注释 | 主键 | 表类型 | 当前用途 | 读写属性 | 数据维护方 | 单表文档 |
|---|---|---|---|---|---|---|---|---|
| 15 | CDC_SERVER | 中心端 | PK_CDC_SERVER（SERVER_ID） | 普通堆表 | 中心端登记（当前开发库 1 行，主键 SERVER_ID） | 只读（当前仓库无写路径） | `sync-server` 启动时插入（负责人确认，本仓库不可验证实现）；管理平台不维护 | [CDC_SERVER.md](tables/CDC_SERVER.md) |
| 16 | CDC_SERVER_CONFIG | （无注释） | PK_CDC_SERVER_CONFIG（ID_SERVER_CONFIG） | 普通堆表 | 中心端配置项（当前开发库 8 行，全部归属 Server001） | 只读（当前仓库无读写路径） | 未来 `server-config` Feature 只更新可编辑记录的 CONFIG_VALUE（未实现） | [CDC_SERVER_CONFIG.md](tables/CDC_SERVER_CONFIG.md) |

> 自校验：§2 的 14 张当前访问表 + §2.1 的 2 张已批准待实现表 = **16 张已批准单表物理基线**，每张恰好一个单表文件。当前仓库实际访问仍为 14 张；两表批准不等于 Feature 已实现，Feature 实现后再按实际代码事实调整分类。

---

## 3. 当前使用的视图、序列、触发器、物化视图、存储过程等对象

本次核验（ALL_OBJECTS / 业务对象定向核验）结论：

- 视图：**本次核验未发现** 属于当前 14 张使用表的视图；CDC Schema 下存在 2 个视图，见 §5 排除/待分析区。
- 序列：**本次核验未发现**（14 张使用表均未使用数据库序列；主键由程序统一 ID 生成器生成）。
- 触发器：**本次核验未发现**（14 张使用表均无触发器）。
- 物化视图：当前 14 张使用表无相关物化视图；CDC Schema 下存在 `MV_CDC_STATS`，见 §5。
- 存储过程 / 函数 / 作业：当前管理平台对 14 张使用表的访问入口走项目后端代码（MyBatis-Plus / JdbcTemplate / Mapper XML），不依赖 CDC Schema 下数据库存储过程完成这些访问；部分表同时由外部进程或人工维护，具体写入边界见 §6 与各单表文档。CDC Schema 下存在 7 个 PROCEDURE、1 个 FUNCTION、8 个 JOB（数据库调度作业），均不在本项目后端调用范围，列入 §5 排除区，未逐一对业务含义核验。

---

## 4. 数据库层物理外键总体情况

**本次核验在 16 张已批准单表物理基线范围内均未发现任何物理 FOREIGN KEY 约束。**

- 14 张当前访问表：2026-08-26 只读核验（PROJECT-DATABASE-BASELINE-001）未发现物理外键；
- 2 张已批准待实现表（`CDC_SERVER`、`CDC_SERVER_CONFIG`）：2026-08-27 只读核验（DATABASE-BASELINE-SERVER-CONFIG-001）同样未发现物理外键。

16 张已批准表范围内**均不设置物理外键**，这是项目确认的架构决策。数据库不强制保证引用完整性；各写入方和读取方必须在代码层处理空引用、孤立引用与无效引用。只读数据核验仅描述核验时点的实际状态，不构成持续完整性保证。跨表关系定义见 `RELATIONS.md`。

---

## 5. 数据库存在但当前生产代码未使用 / 禁止使用 / 待分析的对象

以下对象存在于 CDC Schema，但**均不在当前生产代码访问范围内**（代码扫描确认生产数据库表访问恰好为 §2 的 14 张表），不建立单表基线文件，仅在此登记分类。这些对象按 `DOCUMENTED_NOT_USED` / 范围外登记，不阻塞基线批准；是否纳入后续范围由独立决策决定。

### 5.1 历史提及但当前生产代码未使用（待分析）

以下表在旧文档 `table-list.md` / `table-detail.md` 或其他历史资料中出现，但当前生产代码未访问（`DOCUMENTED_NOT_USED` / 待分析）：

| 对象 | 类型 | 历史提及 | 当前代码访问 |
|---|---|---|---|
| CDC_TOPIC_OFFSET | TABLE | 旧 10 表白名单提及 | 无 |
| CDC_DATA_SOURCE_RUN_STATE | TABLE | 旧 10 表白名单提及 | 无 |
| CDC_DATA_SOURCE_SCN | TABLE | 历史资料提及 | 无 |
| CDC_LOG_TOPIC_OFFSET | TABLE | 历史资料提及 | 无 |
| CDC_LOG_ERROR_BAK | TABLE | 历史资料提及（备份表） | 无 |
| CDC_EXECUTION_PLAN | TABLE | 历史资料提及 | 无 |
| CDC_PIPELINE | TABLE | 历史资料提及 | 无 |
| CDC_PIPELINE_RUN_STATE | TABLE | 历史资料提及 | 无 |
| CDC_MONITOR | TABLE | 历史资料提及（表注释乱码，不据此推断） | 无 |
| CDC_PROBE | TABLE | 历史资料提及（表注释乱码，不据此推断） | 无 |
| CDC_PUBLISH | TABLE | 历史资料提及 | 无 |
| CDC_RECONCILIATION | TABLE | 历史资料提及（表注释乱码，不据此推断） | 无 |
| CDC_SCHEDULE | TABLE | 历史资料提及（表注释乱码，不据此推断） | 无 |
| CDC_STAT | TABLE | 历史资料提及（表注释乱码，不据此推断） | 无 |
| CDC_SUBSCRIBEMODE_CONFIG | TABLE | 历史资料提及（表注释乱码，不据此推断） | 无 |
| CDC_ABNORMAL_COUNT_STATS | TABLE | 本次核验发现 | 无 |
| CDC_ORG_SYNC_STATS | TABLE | 本次核验发现 | 无 |
| CDC_SUMMARY_HISTORY_STATS | TABLE | 本次核验发现 | 无 |
| CDC_SYNC_CURRENT_STATS | TABLE | 本次核验发现 | 无 |
| CDC_TABLE_CREATION_LOG | TABLE | 本次核验发现 | 无 |
| MV_CDC_STATS | MATERIALIZED VIEW | 本次核验发现 | 无 |

> 说明：以上对象仅作分类登记，未逐一读取其结构与数据；其中表注释乱码（`??????`）的对象，按规则不基于乱码内容做业务推断。这些对象属于范围外登记，不属于当前项目数据库基线使用范围，不阻塞基线批准。

### 5.2 系统/导出对象（禁止作为业务表使用）

| 对象 | 类型 | 说明 |
|---|---|---|
| SYS_EXPORT_SCHEMA_01 / SYS_EXPORT_SCHEMA_02 / SYS_EXPORT_SCHEMA_03 | TABLE | Data Pump 导出母表（`Data Pump Master Table EXPORT SCHEMA`），为导出操作产生的系统对象，禁止作为业务表使用。 |

---

## 6. 数据维护方与读写边界总则

- **管理平台写入**：CDC_DATA_SOURCE、CDC_DATA_SOURCE_EXTEND（数据源管理 CRUD+启停——当前为**旧候选实现**，双表联写、一对一读取、`ROWNUM=1` 等，未满足已批准源库 0..N 命名策略目标，批准目标第一版无 DDL）；CDC_STATS_CUMULATIVE_OVERVIEW、CDC_STATS_DAILY_OVERVIEW、CDC_STATS_DIM_CUMULATIVE、CDC_STATS_DIM_DAILY、CDC_STATS_WATERMARK（大屏统计调度 MERGE/CAS 写入）。
- **外部同步程序写入**：CDC_LOG_CORRECT、CDC_LOG_ERROR（写入链 `sync-server → Kafka → sync-log`，见日志查询 Feature 基线）；CDC_JOB_FAILURE_EVENT、CDC_JOB_FAILURE_HANDLE_LOG 由 `sync-client` 进程写入（项目负责人 2026-08-26 确认）。
- **人工维护**：CDC_CLIENT_MULTIPLE（客户端登记，当前管理平台仅只读，后续计划单独开发 CRUD，尚未实现）；CDC_DATA_SUBSCRIBE（当前管理平台仅只读，后续计划单独开发 CRUD，尚未实现）；CDC_STATS_TASK_CONFIG（调度配置，启动时读取一次，修改后重启生效）。
- 管理平台对上述全部 14 张表均只读或按上述写入方边界操作；单表文档 §8 列出代码访问入口。

---

## 7. 与项目基线、Feature 文档、代码和真实数据库的权威边界

- 本文件与 `tables/*.md` 为**数据库物理结构权威快照**，状态 `APPROVED`（2026-08-26 批准，PROJECT-DATABASE-BASELINE-APPROVAL-001）。
- 结构以真实数据库为准；文档为已核验快照。发现文档与数据库不一致时，以数据库为准并更新文档。
- 业务规则、代码行为、Feature 级设计以 `docs/features/` 与 `docs/baseline/` 为准；本文件只登记物理结构、代码访问入口与读写边界，不复制 Feature 详细设计。
- 禁止在数据库文档中记录连接密码、字段密码值、RAW_MESSAGE、LOG_DETAIL 或敏感业务原文（见 README §9）。

---

## 8. 文档级变更记录

| 日期 | 变更 | 依据 |
|---|---|---|
| 2026-08-26 | 建立 Schema 整体概览（DRAFT_PENDING_USER_REVIEW） | PROJECT-DATABASE-BASELINE-001 只读核验 |
| 2026-08-26 | R1：修正无物理外键表述；更新 SUBSCRIBE/JFE/JHL 数据维护方；移除 CDC_CLIENT 现行说明并重排 §5 | PROJECT-DATABASE-BASELINE-001-R1 修订 |
| 2026-08-26 | R2：修正 §3 总体访问边界（14 张使用表访问入口走项目后端代码，部分表由外部进程或人工维护）；CDC_CLIENT_MULTIPLE 维护方调整为人工维护（当前管理平台仅只读，后续计划单独开发 CRUD，尚未实现） | PROJECT-DATABASE-BASELINE-001-R2 修订 |
| 2026-08-26 | 批准：项目级数据库基线正式批准收口（APPROVED） | PROJECT-DATABASE-BASELINE-APPROVAL-001 批准 |
| 2026-08-27 | 新增 2 张已批准待实现表（CDC_SERVER、CDC_SERVER_CONFIG）：新增 §2.1 独立小节登记，保持 14+2=16 分层自校验；从 §5.1 排除区移除两表，避免同一对象同时处于批准和排除状态；§4 物理外键总体说明更新为覆盖 16 张已批准表（保留原 14 表核验历史） | DATABASE-BASELINE-SERVER-CONFIG-001（候选）+ DATABASE-BASELINE-SERVER-CONFIG-APPROVAL-001（批准） |
| 2026-08-29 | 已批准数据源管理 Feature 规则同步：§2 中 `CDC_DATA_SOURCE_EXTEND` 当前用途更新为“源库到目标库的命名策略（目标表命名策略）”；§6 管理平台写入说明区分当前旧候选实现（双表联写、一对一读取、`ROWNUM=1` 等）与批准新目标（源库 0..N、第一版无 DDL），禁止把新目标写成已实现；数据库物理结构（字段/约束/索引/可空性）无变化 | DATA-SOURCE-BASELINE-IMPACT-ALIGNMENT-001（已批准业务规则向权威数据库基线同步；纯文档任务，数据库物理结构无变化） |
