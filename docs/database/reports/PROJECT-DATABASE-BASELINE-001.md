# 实施报告：PROJECT-DATABASE-BASELINE-001（建立项目级数据库基线）

> 文档状态：`DRAFT_PENDING_USER_REVIEW`
> 执行日期：2026-08-26
> 数据库环境：Oracle 19c 开发库（192.168.174.65:1521/prod.enmotech.com），Schema `CDC`
> 任务提示词：`docs/prompts/database/PROJECT-DATABASE-BASELINE-001-PROMPT.md`
> 任务性质：数据库只读核验 + 项目级数据库文档重构（纯文档任务）

---

## 1. Git 开始状态和授权基线

| 项 | 值 |
|---|---|
| 当前分支 | `develop` |
| 授权基线提交（base_commit_id） | `4703cf06e64c20034126a0e54d9ea7621eca0950` |
| 本地 HEAD | `4703cf06e64c20034126a0e54d9ea7621eca0950`（= 授权基线） |
| origin/develop | `4703cf06e64c20034126a0e54d9ea7621eca0950` |
| ahead / behind | `0 0` |

开始前已确认：分支为 `develop`；本地 HEAD 与 `origin/develop` 均为授权基线；无分叉；全程不使用 force push、不改写历史。

## 2. 最终实际使用表清单、数量及确定方法

确定方法：生产代码扫描（Entity `@TableName`、Mapper XML、JdbcTemplate、动态 SQL、定时任务、Service 直接表访问）→ 与既有代码—数据库映射资料交叉核对 → 真实数据库只读元数据反向核验存在性、对象类型与字段。

最终实际使用表共 **14 张**，与任务确认清单精确一致，未增加、未减少：

| # | 表名 | 主键 | 表类型 | 当前代码入口 |
|---|---|---|---|---|
| 1 | CDC_DATA_SOURCE | PK_CDC_DATA_SOURCE | TABLE | DataSource 实体（基础配置/订阅/日志/大屏多模块） |
| 2 | CDC_DATA_SOURCE_EXTEND | 无 | TABLE | DataSourceExtend 实体（数据源管理，1:1 扩展） |
| 3 | CDC_DATA_SUBSCRIBE | 无（D01） | TABLE | DataSubscribeEntity 实体（订阅管理） |
| 4 | CDC_CLIENT_MULTIPLE | PK_CDC_CLIENT_MULTIPLE | TABLE | CdcClientMultiple 实体（探针注册） |
| 5 | CDC_LOG_CORRECT | PK_CDC_LOG_CORRECT | TABLE | LogQueryMapper.xml 动态表 + 大屏 JdbcTemplate LogBatchReader |
| 6 | CDC_LOG_ERROR | PK_CDC_LOG_ERROR | TABLE | LogQueryMapper.xml 动态表 + 大屏 JdbcTemplate LogBatchReader |
| 7 | CDC_JOB_FAILURE_EVENT | PK_CDC_JOB_FAILURE_EVENT | TABLE | JobFailureEvent 实体（故障监控） |
| 8 | CDC_JOB_FAILURE_HANDLE_LOG | PK_CDC_JOB_FAILURE_HANDLE_LOG | TABLE | JobFailureHandleLog 实体（故障监控） |
| 9 | CDC_STATS_CUMULATIVE_OVERVIEW | PK (TASK_CODE) | TABLE | CumulativeOverviewEntity 实体（大屏统计） |
| 10 | CDC_STATS_DAILY_OVERVIEW | PK (TASK_CODE, STAT_DATE) | TABLE | DailyOverviewEntity 实体（大屏统计） |
| 11 | CDC_STATS_DIM_CUMULATIVE | PK (TASK_CODE, DIM_TYPE, DIM_VALUE) | TABLE | DimCumulativeEntity 实体（大屏统计） |
| 12 | CDC_STATS_DIM_DAILY | PK (TASK_CODE, DIM_TYPE, DIM_VALUE, STAT_DATE) | TABLE | DimDailyEntity 实体（大屏统计） |
| 13 | CDC_STATS_TASK_CONFIG | PK_CDC_STATS_TASK_CONFIG | TABLE | StatsTaskConfigEntity 实体（大屏统计配置） |
| 14 | CDC_STATS_WATERMARK | PK (TASK_CODE, LOG_TYPE) | TABLE | StatsWatermarkEntity 实体（大屏统计水位） |

扫描未发现上述清单之外的生产运行时数据库访问。残留的 `CdcClient` 实体（映射 `CDC_CLIENT`）为废弃代码，不在生产访问路径中；`CDC_CLIENT` 已由项目负责人确认今后不再使用，不进入本基线候选清单，不创建 `tables/CDC_CLIENT.md`。全部 14 表均为 CDC Schema 自有的 TABLE 类型、非分区表，数据库层无物理外键。

## 3. 真实数据库连接的环境标识（不含密码）

| 项 | 值 |
|---|---|
| 数据库类型/版本 | Oracle Database 19c Enterprise Edition（19.3.0.0.0） |
| 主机:端口 | 192.168.174.65:1521 |
| Service Name | prod.enmotech.com |
| Schema / 用户 | CDC |
| 字符集 | NLS_CHARACTERSET=AL32UTF8；NLS_NCHAR_CHARACTERSET=AL16UTF16 |
| 时区 | DBTIMEZONE=+00:00；SESSIONTIMEZONE=+08:00 |
| 会话 NLS | LANGUAGE=AMERICAN / TERRITORY=AMERICA / DATE_FORMAT=DD-MON-RR |
| 连接方式 | SQL*Plus 只读连接，命令见 `CLAUDE.md` §11；本文件不输出连接密码 |

## 4. 执行的元数据查询类别和数据画像类别

元数据查询（全部只读，Oracle 数据字典）：

- 表清单与对象元数据：`ALL_TABLES`、`ALL_OBJECTS`（LEFT JOIN 取 `LAST_DDL_TIME`）、`ALL_TAB_COMMENTS`、`ALL_COL_COMMENTS`
- 字段结构：`ALL_TAB_COLUMNS`（数据类型、长度、精度、可空性、默认值）
- 约束：`ALL_CONSTRAINTS`、`ALL_CONS_COLUMNS`（主键、唯一、Check、外键、非空）
- 索引：`ALL_INDEXES`、`ALL_IND_COLUMNS`、`ALL_IND_EXPRESSIONS`（唯一性、类型、字段顺序、ASC/DESC、状态）
- 分区与 LOB：`ALL_PART_TABLES`、`ALL_TAB_PARTITIONS`、`ALL_LOBS`
- 触发器/序列/视图/物化视图/过程/函数：数据字典存在性核验（14 表范围内本次未发现）
- 数据库版本与环境：`V$VERSION`、`V$NLS_PARAMETERS`

数据画像查询（全部只读）：

- 小表精确 `SELECT COUNT(*)`
- 大表统计信息（`ALL_TABLES.NUM_ROWS`、`LAST_ANALYZED`）
- 码值分布（`SELECT ... GROUP BY` 受控查询）
- 结构特征（LOB 段、CHUNK、TABLESPACE）核验

所有查询均为只读；未修改任何数据库对象、数据或统计信息。

## 5. 每张表的核验结果

14 张表均完成字段结构、约束、索引、分区、LOB、注释、`LAST_DDL_TIME` 的完整只读核验，并已写入 `tables/CDC_XXX.md` 单表基线。要点：

| 表名 | 核验要点 |
|---|---|
| CDC_DATA_SOURCE | 17 字段；PK_CDC_DATA_SOURCE；4 个非主键索引；8 个 NOT NULL；DATA_SOURCE_CATEGORY 大小写混用为当前事实；DATA_SOURCE_PASSWORD 明文（负责人确认不加密）；DATA_SOURCE_DOMAIN 暂不使用；LAST_DDL_TIME 2026-07-02 |
| CDC_DATA_SOURCE_EXTEND | 5 字段（含数据库存在但代码未映射的 TARGET_DATA_SOURCE_ID）；无约束（D02）；无索引；含容错测试数据（重复/孤立/缺失）；LAST_DDL_TIME 2026-07-14 |
| CDC_DATA_SUBSCRIBE | 12 字段；4 个 CLOB；**无主键（D01，与历史资料冲突，见 §10）**；写入方未在本项目代码中发现；LAST_DDL_TIME 2026-07-14 |
| CDC_CLIENT_MULTIPLE | 4 字段；PK_CDC_CLIENT_MULTIPLE；DATA_SOURCE_ID 逗号分隔多值；总记录 ≤ 20 为负责人确认硬上限；LAST_DDL_TIME 2026-07-03 |
| CDC_LOG_CORRECT | 16 字段；PK 仅 1 个索引；RAW_MESSAGE 为 CLOB；RESULT_CODE/OFFSET 为 NUMBER(10)；大表（≈381.9 万行，估算）；LAST_DDL_TIME 2026-08-06 |
| CDC_LOG_ERROR | 16 字段；PK + 3 个非主键索引（IDX_CDC_LOG_ERROR_TYPE / IDX_LOG_ERROR_TARGET_SRC / IDX_LOG_ERROR_TS_SRC_SCHEMA）；RAW_MESSAGE 为 CLOB；442 行全为 INSTRUCTION_TYPE='d'、RESULT_CODE=1；量级预期十万/百万/千万（非硬上限）；LAST_DDL_TIME 2026-08-06 |
| CDC_JOB_FAILURE_EVENT | 11 字段；PK_CDC_JOB_FAILURE_EVENT；FAILURE_DETAIL CLOB；无非主键索引（D03）；写入方未在本项目代码中发现；LAST_DDL_TIME 2026-07-27 |
| CDC_JOB_FAILURE_HANDLE_LOG | 18 字段；PK_CDC_JOB_FAILURE_HANDLE_LOG；ERROR_DETAIL CLOB；无非主键索引（D04）；写入方未在本项目代码中发现；LAST_DDL_TIME 2026-07-27 |
| CDC_STATS_CUMULATIVE_OVERVIEW | 7 字段；PK (TASK_CODE)；CK 范围约束；实体缺 `@TableId`（D06）；1 行；LAST_DDL_TIME 2026-08-06 |
| CDC_STATS_DAILY_OVERVIEW | 8 字段；PK (TASK_CODE, STAT_DATE)；CK 范围约束；3 行；LAST_DDL_TIME 2026-08-06 |
| CDC_STATS_DIM_CUMULATIVE | 9 字段；PK (TASK_CODE, DIM_TYPE, DIM_VALUE)；CK 范围约束；13 行；LAST_DDL_TIME 2026-08-06 |
| CDC_STATS_DIM_DAILY | 10 字段；PK (TASK_CODE, DIM_TYPE, DIM_VALUE, STAT_DATE)；1 个非主键索引；17 行；LAST_DDL_TIME 2026-08-06 |
| CDC_STATS_TASK_CONFIG | 12 字段；PK (TASK_CODE)；7 个 CK 范围约束；1 行（TASK_CODE=LARGE_SCREEN_STATS，ENABLED=1）；LAST_DDL_TIME 2026-08-06 |
| CDC_STATS_WATERMARK | 8 字段；PK (TASK_CODE, LOG_TYPE)；CK 范围约束；CAS 条件更新；2 行（CORRECT/ERROR 各一）；LAST_DDL_TIME 2026-08-06 |

## 6. 精确计数、估算统计和未执行统计的区分及原因

| 分类 | 表 | 值 | 口径与原因 |
|---|---|---|---|
| 精确计数（`OBSERVED_EXACT`，开发库 2026-08-26） | CDC_CLIENT_MULTIPLE / CDC_DATA_SOURCE / CDC_DATA_SOURCE_EXTEND / CDC_DATA_SUBSCRIBE / CDC_JOB_FAILURE_EVENT / CDC_JOB_FAILURE_HANDLE_LOG / CDC_LOG_ERROR / CDC_STATS_CUMULATIVE_OVERVIEW / CDC_STATS_DAILY_OVERVIEW / CDC_STATS_DIM_CUMULATIVE / CDC_STATS_DIM_DAILY / CDC_STATS_TASK_CONFIG / CDC_STATS_WATERMARK | 7 / 19 / 10 / 12 / 28 / 116 / 442 / 1 / 3 / 13 / 17 / 1 / 2 | 小表，`SELECT COUNT(*)` 成本可接受，对基线必要 |
| 估算统计（`OBSERVED_ESTIMATED`） | CDC_LOG_CORRECT | ≈ 3,819,479 | `ALL_TABLES.NUM_ROWS` 统计信息（LAST_ANALYZED 2026-08-12）；大规模日志表，未执行全表 `COUNT(*)`，避免不必要负载 |
| 未执行统计 | 无 | — | 14 张表全部有精确值或估算值，无遗漏 |

说明：个别小表统计信息陈旧（如 ALL_TABLES.NUM_ROWS 对 CDC_LOG_ERROR=1、CDC_STATS_DAILY_OVERVIEW=2、CDC_STATS_DIM_DAILY=13 与精确值不一致），以精确计数为准；当前行数为开发库瞬时快照，不代表生产常态。

## 7. 项目负责人规模描述的迁移结果

| 表名 | 内容 | 性质 | 来源 | 确认日期 | 迁移去向 |
|---|---|---|---|---|---|
| CDC_CLIENT_MULTIPLE | 总记录数一定不会超过 20 条 | `CONFIRMED_HARD_LIMIT` | 项目负责人 | 2026-08-26 | `DATA_PROFILE.md` §2；并写入单表 `tables/CDC_CLIENT_MULTIPLE.md` |
| CDC_LOG_ERROR | 记录数可能为十万、百万、千万级别不等；**明确不构成“最大千万条”的硬上限** | `CONFIRMED_EXPECTED_SCALE` | 项目负责人 | 2026-08-26 | `DATA_PROFILE.md` §2；并写入单表 `tables/CDC_LOG_ERROR.md` |

其他规模描述凡无法证明已批准，一律标为待确认（`PENDING_CONFIRMATION` / `UNVERIFIED_ASSUMPTION`），未擅自升级为负责人确认。

## 8. 新建和修改文档清单

新建（21 个）：

- 入口与总览：`README.md`、`SCHEMA.md`
- 关系与码值：`RELATIONS.md`、`CODE_VALUES.md`
- 核验方法：`VERIFICATION.md`
- 结构历史：`CHANGELOG.md`
- 数据画像：`DATA_PROFILE.md`
- 单表物理基线（14 个）：`tables/CDC_DATA_SOURCE.md`、`tables/CDC_DATA_SOURCE_EXTEND.md`、`tables/CDC_DATA_SUBSCRIBE.md`、`tables/CDC_CLIENT_MULTIPLE.md`、`tables/CDC_LOG_CORRECT.md`、`tables/CDC_LOG_ERROR.md`、`tables/CDC_JOB_FAILURE_EVENT.md`、`tables/CDC_JOB_FAILURE_HANDLE_LOG.md`、`tables/CDC_STATS_CUMULATIVE_OVERVIEW.md`、`tables/CDC_STATS_DAILY_OVERVIEW.md`、`tables/CDC_STATS_DIM_CUMULATIVE.md`、`tables/CDC_STATS_DIM_DAILY.md`、`tables/CDC_STATS_TASK_CONFIG.md`、`tables/CDC_STATS_WATERMARK.md`

修改（5 个，历史化标记）：`table-list.md`、`table-detail.md`、`table-relations.md`、`data-characteristics.md`、`confirmed-business-rules.md`（追加 `HISTORICAL_SUPERSEDED` 说明，正文保留原貌）。

实施报告：本文件 `reports/PROJECT-DATABASE-BASELINE-001.md`。

## 9. 旧文档历史化处理

- 处理对象：`table-list.md`、`table-detail.md`、`table-relations.md`、`data-characteristics.md`、`confirmed-business-rules.md`。
- 方式：文件保留、不改名、不删除；开头追加 `HISTORICAL_SUPERSEDED` 说明（含取代任务 PROJECT-DATABASE-BASELINE-001、取代日期 2026-08-26、指向新权威文档、警示不得作为当前事实直接引用）；原历史正文保持原貌，不把旧时间点记录改写为当前事实。
- 断链检查：仓库内对旧文档的引用均指向仍然存在的文件，未制造断链；其他执行报告、开放问题、专项算法/索引设计文档保持历史原貌。

## 10. 数据库—代码—历史文档冲突清单

| # | 冲突 | 分类 | 处理 |
|---|---|---|---|
| C1 | `open-questions.md` 声称 CDC_DATA_SUBSCRIBE 主键“已验证”，本次真实库核验**无主键** | 历史文档 vs 数据库物理事实 | 以数据库物理事实为准；单表文档记录为 D01，标 `PENDING_USER_CONFIRMATION` |
| C2 | 历史分析中的 10 表白名单（含 CDC_SERVER / CDC_TOPIC_OFFSET 等）已不在当前 14 表使用范围 | 历史文档 vs 代码现状 | 以当前代码扫描为准；旧文档已历史化，对象归入 `SCHEMA.md` §5 排除/待分析区 |
| C3 | `CDC_DATA_SOURCE_EXTEND.TARGET_DATA_SOURCE_ID` 数据库存在但当前代码未映射 | 数据库 vs 代码 | 记录为已确认字段，含义待确认；`PENDING_USER_CONFIRMATION` |
| C4 | `CDC_DATA_SOURCE.DATA_SOURCE_CATEGORY` 大小写混用（target/SOURCE/source） | 数据现状 vs 业务规则（统一大写） | 记录当前事实；目标规则写入 `CODE_VALUES.md`，存量数据无需修正 |
| C5 | `CDC_DATA_SOURCE_RUN_STATE`、`CDC_SERVER` 等早期对象当前代码是否使用存在历史差异 | 历史文档 vs 代码现状 | 以代码扫描为准；相关表不在 14 表内，归入排除区 |

冲突均不影响 14 表物理基线正确性，可清晰记录为待确认项，未静默选边。

## 11. 待用户确认项（`PENDING_USER_CONFIRMATION`）

| # | 项 | 说明 |
|---|---|---|
| P1 | 写入方 | CDC_DATA_SUBSCRIBE、CDC_JOB_FAILURE_EVENT、CDC_JOB_FAILURE_HANDLE_LOG 的写入方未在本项目后端代码中发现，需确认维护方 |
| P2 | 字段含义 | CDC_DATA_SOURCE_EXTEND.TARGET_DATA_SOURCE_ID 含义待确认（数据库存在、代码未映射） |
| P3 | 维护约定 | CDC_STATS_TASK_CONFIG.UPDATED_BY 由谁维护待确认 |
| P4 | 历史冲突 | `open-questions.md` 声称 SUBSCRIBE 主键“已验证”与本次核验“无主键”冲突（见 C1） |
| P5 | 对象范围 | `SCHEMA.md` §5 中历史/待分析对象是否仍属当前项目范围，需确认（CDC_CLIENT 已确认废弃除外） |

`pending_user_confirmation_count = 5`。

## 12. 敏感信息检查结果

- 连接密码：`VERIFICATION.md` 不输出连接密码（连接命令引用 `CLAUDE.md` §11）。
- 字段密码值：全文未记录 `DATA_SOURCE_PASSWORD` 等字段的实际值；仅记录字段名、类型与“明文存储”这一结构事实。
- 业务敏感原文：未记录 `RAW_MESSAGE`、`LOG_DETAIL` 的实际内容；仅以字段名/类型/注释形式引用。
- 样例数据：单表文档不记录具体样例行；`DATA_PROFILE.md` 仅记录码值分布聚合，不记录敏感原文。
- 结果：**通过**。

## 13. 链接和结构一致性检查结果

- 14 张目标表与 `SCHEMA.md` 当前使用清单精确一致；`tables/` 下恰好 14 个文件，不存在 `tables/CDC_CLIENT.md`。
- 每个单表文件字段集合、顺序、类型、可空性、主键、约束、索引字段顺序与真实库核验结果一致（已在编写时逐表交叉核对）。
- `README.md`、`SCHEMA.md`、`RELATIONS.md` 与单表相对链接全部可解析，无断链。
- 新文档状态均为 `DRAFT_PENDING_USER_REVIEW`，无 `APPROVED` 状态标记（精确匹配 `文档状态：\`APPROVED\`` 为零）。
- 旧文档历史标识与新文档链接正确。
- `git diff --check` 通过；新文档无尾部空白。
- Markdown 表格、标题、相对链接与文件命名一致；14 个单表文件均为统一 10 节模板。

## 14. 数据库写操作、DDL、ZooKeeper 和业务代码均未执行/修改的声明

本任务执行过程中：

- **数据库写操作**：未执行（`database_write_status=NONE`）。全部操作为只读 SELECT / WITH...SELECT / 数据字典查询；未执行 INSERT/UPDATE/DELETE/MERGE，未执行 LOCK TABLE，未修改统计信息。
- **DDL**：未执行（`ddl_status=NONE`）。未创建/修改/删除任何表、索引、分区、约束、注释；本次“建立文档”不构成数据库结构变化。
- **ZooKeeper**：未读写（`zookeeper_status=NONE`）。
- **业务进程**：未启动、停止或重启。
- **业务代码**：未修改任何 Java/XML/Vue/TypeScript/YAML/POM/package/测试文件（`business_code_change_status=NONE`）。
- **Feature 文档/README/提示词**：未修改（`feature_document_change_status=NONE`）。`docs/features/log-query/ACCEPTANCE.md` 的 ChatGPT 复审遗留问题未处理。

## 15. Git 提交、推送和 ahead/behind 结果

- 开始状态：base_commit_id=`4703cf06e64c20034126a0e54d9ea7621eca0950`，HEAD 与 origin/develop 一致，ahead/behind `0 0`。
- 暂存范围：仅 `docs/database/**` 中本任务文件（21 个新建 + 5 个历史化修改 + 本报告）；不包含用户工作区既有变更（3 个已删除的 TASK3/TASK4 报告、4 个用户新增文档及其他无关文件）。
- 提交信息：`docs(database): establish project database baseline`。
- 推送：普通 `git push origin develop`，禁止 force push。
- 推送后核验要求：`git rev-parse HEAD` 与 `git rev-parse origin/develop` 一致，`git rev-list --left-right --count HEAD...origin/develop` 为 `0 0`；本任务目标文件不留未提交差异，用户工作区内容保持原样。
- 实际 result_commit_id / remote_commit_id / ahead_behind：以最终机器可读结果（AGENT_TASK_RESULT）为准。

## 16. 下一步

仅限 **ChatGPT 复审** 与 **用户批准**：

- 提交文档供 ChatGPT 复审数据库基线一致性与完整性；
- 由用户（项目负责人）批准后，方可把文档状态从 `DRAFT_PENDING_USER_REVIEW` 更新为 `APPROVED`；
- 本任务结束后不得自行进入 Feature 设计、代码实现或生产数据库调整阶段。
