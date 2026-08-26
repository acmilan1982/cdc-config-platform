# 实施报告：PROJECT-DATABASE-BASELINE-001（建立项目级数据库基线）

> 文档状态：`APPROVED`
> 批准任务：PROJECT-DATABASE-BASELINE-APPROVAL-001
> 批准日期：2026-08-26
> 批准基线提交：35ca45d3fab23ac95c5fb42c6623cfb7589ce82a
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

---

# R1 修订附录（PROJECT-DATABASE-BASELINE-001-R1）

> 文档状态：`DRAFT_PENDING_USER_REVIEW`
> 修订任务：PROJECT-DATABASE-BASELINE-001-R1（ChatGPT 复审驱动的数据库基线修订，纯文档任务）
> 执行日期：2026-08-26
> 任务提示词：`docs/prompts/database/PROJECT-DATABASE-BASELINE-001-R1-PROMPT.md`
> 说明：本附录独立追加于初始实施报告之后，不覆盖初始版本；初始报告 §1～§16 保持历史原貌。

## R1-1. Git 开始状态和授权基线

| 项 | 值 |
|---|---|
| 当前分支 | `develop` |
| 授权基线提交（base_commit_id） | `4d98f9f0da5d7bc8e8314a6fbe071a8c619837a8`（PROJECT-DATABASE-BASELINE-001 结果提交） |
| 本地 HEAD（开始） | `4d98f9f0da5d7bc8e8314a6fbe071a8c619837a8`（= 授权基线） |
| origin/develop（开始） | `4d98f9f0da5d7bc8e8314a6fbe071a8c619837a8` |
| ahead / behind（开始） | `0 0` |

开始前已确认：分支为 `develop`；本地 HEAD 与 `origin/develop` 均为授权基线，授权基线之后无新提交、无分叉；用户工作区既有修改保持原样。

## R1-2. 项目负责人确认事实（2026-08-26）

| # | 确认内容 | 落地位置 |
|---|---|---|
| 5.1 | 14 张使用表不设置物理外键为项目确认的架构决策；数据库不强制保证引用完整性；各写入方和读取方必须在代码层处理空引用、孤立引用与无效引用；只读数据核验仅为核验时点实际状态，不构成持续完整性保证 | README §10、SCHEMA §4、RELATIONS §1/§4、单表文档 §8 |
| 5.2 | CDC_DATA_SUBSCRIBE 由人工维护；当前管理平台仅只读；后续计划单独开发 CRUD 尚未实现（作为未来 Feature 规划/边界，非当前能力） | SCHEMA §2/§6、SUBSCRIBE 单表文档、DATA_PROFILE §7.3 |
| 5.3 | CDC_JOB_FAILURE_EVENT 与 CDC_JOB_FAILURE_HANDLE_LOG 均由 sync-client 进程写入；管理平台仅只读 | SCHEMA §2/§6、JFE/JHL 单表文档、RELATIONS 维护方 |
| 5.4 | EXTEND.TARGET_DATA_SOURCE_ID 业务语义为目标库（DATA_SOURCE_CATEGORY='TARGET'），为无物理外键、无类别约束的弱逻辑引用；新增独立编号关系 R15 | RELATIONS §4 R15、§5.3、§7 图；EXTEND 单表文档；DATA_PROFILE §5 |
| 5.5 | STATS_TASK_CONFIG.UPDATED_BY 为可选修改人标识，无固定维护规则 | TASK_CONFIG 单表文档 §9 |

## R1-3. ChatGPT 复审问题（R1-01～R1-07）处理记录

| 编号 | 问题 | 处理 |
|---|---|---|
| R1-01 | “必须重新读库核验”触发条件过宽 | README §6 收窄为 7 类定向场景，并补充“普通业务规则调整、前端开发、后端非结构性开发、常规单元测试不得仅因涉及数据库强制重连”；VERIFICATION §11 同步 |
| R1-02 | 无物理外键表述不统一 | 统一为“不设置物理外键是项目确认的架构决策；引用完整性不由数据库保证；代码必须做容错；只读数据核验仅描述核验时点实际状态”，删除“全部关系由代码和数据核验保证”等表述 |
| R1-03 | 关系文档混入数据快照（LOG_ERROR 1→442、JFE 25→28、JHL 104→116） | RELATIONS 数据核验列只保留定向完整性结论并标注环境/日期，行数统一引用 DATA_PROFILE；DATA_PROFILE §5 更新为 2026-08-26 定向核验结果并新增 R15 核验行 |
| R1-04 | 结构历史边界（LAST_DDL_TIME 不证变更内容；“5 张大屏统计表”应为 6 张 CDC_STATS_* 表；CLIENT_MULTIPLE DML 清理与 PK DDL 区分；EXTEND 列存在非可证日期变更；D01/R01/D03/D04 未批准项不得写 DEFERRED） | CHANGELOG §1 重构为“有明确确认依据的历史变更”+“当前物理事实（变更日期不可证）”；候选物理设计状态改为 PENDING_DECISION |
| R1-05 | 日志表写入链与保留策略混为一谈 | DATA_PROFILE §3 拆分：写入链（sync-server → Kafka → sync-log）为已确认业务事实；归档/清理/保留时长无统一规则、不得推断 |
| R1-06 | 初始 5 项待确认（P1～P5） | 按 §5.2～§5.5 与数据库物理事实关闭；pending_user_confirmation_count=0；SUBSCRIBE 主键历史冲突按“旧资料错误”关闭，未来主键归 D01 独立决策 |
| R1-07 | 清理当前基线中的 CDC_CLIENT（无 MULTIPLE）现行描述 | README/SCHEMA 当前描述已删除；不创建 tables/CDC_CLIENT.md；不进入 14 表清单；历史化旧文档与初始报告保留历史正文；Java Entity/Mapper 属独立任务、不在此范围 |

## R1-4. 定向数据库只读关系核验（R1）

执行针对性只读关系核验（开发库 2026-08-26），未重读全部 14 张表结构：

- 小表行数快照：EXTEND=10、SUBSCRIBE=12、CLIENT_MULTIPLE=7、LOG_ERROR=442、JFE=28、JHL=116。
- EXTEND.TARGET_DATA_SOURCE_ID：10 行中 2 行非空（2 个不同值），均匹配 DATA_SOURCE_CATEGORY='TARGET'，0 孤立。
- 逗号分隔 token：CCM.DATA_SOURCE_ID=12 token、SUB.DATA_FROM=12、SUB.DATA_TO=13，均“每行至少一个 token 可匹配”。
- LOG_ERROR：SOURCE/TARGET 均非空（442/442），TARGET 0 孤立。
- JFE：CLIENT_ID→CCM、DATA_SOURCE_ID→DS 均 0 空值 0 孤立（28 行）。
- JHL：FAILURE_EVENT_ID→JFE.ID、CLIENT_ID→CCM、DATA_SOURCE_ID→DS 均 0 空值 0 孤立（116 行）。

全部为 SELECT / WITH...SELECT / 数据字典与受控聚合查询，未执行任何写操作；敏感字段（RAW_MESSAGE / LOG_DETAIL / 密码）未读取输出。

## R1-5. 修改文件清单（12 个）

- `docs/database/README.md`
- `docs/database/SCHEMA.md`
- `docs/database/RELATIONS.md`
- `docs/database/DATA_PROFILE.md`
- `docs/database/CHANGELOG.md`
- `docs/database/VERIFICATION.md`
- `docs/database/tables/CDC_DATA_SUBSCRIBE.md`
- `docs/database/tables/CDC_JOB_FAILURE_EVENT.md`
- `docs/database/tables/CDC_JOB_FAILURE_HANDLE_LOG.md`
- `docs/database/tables/CDC_DATA_SOURCE_EXTEND.md`
- `docs/database/tables/CDC_STATS_TASK_CONFIG.md`
- `docs/database/reports/PROJECT-DATABASE-BASELINE-001.md`（本文件）

未修改：`CODE_VALUES.md`（复核无需变更）；14 张表数量与 14 个单表文件保持不变；未新增/删除任何字段描述。

## R1-6. 自检结果

按任务 §9 的 15 项自检全部通过：修改范围仅限授权文档；14 张使用表与 14 个单表文件数量不变；当前基线无 CDC_CLIENT 现行描述或死代码路径（历史化旧文档与初始报告除外）；无“代码路径与数据核验保证引用完整性”“SUBSCRIBE 写入方待确认”“Job 两表写入方待确认”“TARGET_DATA_SOURCE_ID 含义待确认”“UPDATED_BY 维护待确认”等遗留表述；RELATIONS 新增 R15 且编号/计数/图一致；关系核验数据带环境+日期且无旧混用数字；CHANGELOG 无 LAST_DDL_TIME 推导历史；未批准物理设计均为 PENDING_DECISION；README 重新读库触发条件已收窄；日志写入链与保留策略分离；P1～P5 关闭、pending_user_confirmation_count=0；无密码/RAW_MESSAGE/LOG_DETAIL/敏感业务原文；无业务代码、配置、Feature 文档、数据库写、DDL、ZooKeeper 变更；`git diff --check` 通过；Markdown 链接/表格/标题/相对路径一致。

## R1-7. 未执行修改声明

- **数据库写操作 / DDL**：均未执行（`database_write_status=NONE`、`ddl_status=NONE`）。
- **ZooKeeper / 业务进程**：未读写、未启停（`zookeeper_status=NONE`）。
- **业务代码**：未修改任何 Java/XML/Vue/TypeScript/YAML/POM/package/测试文件（`business_code_change_status=NONE`）。
- **Feature 文档 / 项目根 README / 历史化旧文档正文**：未修改（`feature_document_change_status=NONE`）。
- **数据库文档状态**：保持 `DRAFT_PENDING_USER_REVIEW`，未标记 `APPROVED`。

## R1-8. Git 提交、推送与后续边界

- 暂存范围：仅本 R1 修改的 `docs/database/` 授权文件。
- 提交信息：`docs(database): correct baseline facts and ownership`。
- 推送：普通 `git push origin develop`，禁止 force push；推送后核验本地 HEAD 与 origin/develop 一致、ahead/behind `0 0`。
- 实际 result_commit_id / remote_commit_id / ahead_behind：以最终机器可读结果（AGENT_TASK_RESULT）为准。
- 后续边界：R1 任务在推送后停止；下一步仅限 ChatGPT 复审与用户批准；不进入 Feature 设计、代码实现或数据库整改。

---

# R2 修订附录（PROJECT-DATABASE-BASELINE-001-R2）

> 本附录为独立 R2 微型一致性修订记录。初版与 R1 历史正文保持原样；现行事实以本附录及最新版各基线文档为准，如与历史段落不一致，由本附录明确取代。

## R2-1. 任务与授权基线

- 任务编号：`PROJECT-DATABASE-BASELINE-001-R2`
- 授权基线提交：`935786498173a3ead6e56851f248303ebf75b3f7`（本地 HEAD 与 `origin/develop` 一致，ahead/behind `0 0`）
- 任务性质：纯文档微型一致性修订；未连接数据库、未执行数据库写操作、DDL、ZooKeeper、构建、测试或业务代码修改。

## R2-2. 三项复审修订逐项结果

### R2-01：修正 SCHEMA 总体访问边界

`SCHEMA.md §3` 已由“当前 14 张使用表的读写均走项目后端代码”修正为：

> 当前管理平台对 14 张使用表的访问入口走项目后端代码（MyBatis-Plus / JdbcTemplate / Mapper XML），不依赖 CDC Schema 下数据库存储过程完成这些访问；部分表同时由外部进程或人工维护，具体写入边界见 §6 与各单表文档。

保持“管理平台不依赖数据库存储过程完成其访问”的已核验结论不变；视图、序列、触发器、物化视图、过程、函数与作业的物理核验结果不变；同步核对 §2 表清单与 §6 维护方总则。

### R2-02：R15 调整为已确认关系

- R15 定义：`CDC_DATA_SOURCE_EXTEND.TARGET_DATA_SOURCE_ID -> CDC_DATA_SOURCE.DATA_SOURCE_ID`，业务语义目标库（`DATA_SOURCE_CATEGORY = TARGET`），数据库无物理外键与类别约束。
- 分类调整：高度可信 → 已确认逻辑关系（项目负责人 2026-08-26 明确确认字段含义）。
- 调整前：已确认 11 条（R01～R11）、高度可信 4 条（R12～R15）、待确认 0 条。
- 调整后：已确认 12 条（R01～R11、R15）、高度可信 3 条（R12～R14）、待确认 0 条。
- R15 物理事实、可空性、无代码映射、无物理外键、无类别约束与 2026-08-26 定向核验结果保持不变；编号不变，未重新编号 R12～R15；小型关系图 R15 保持不变。
- 分级含义明确为：已确认 = 由代码直接关系、批准文档或项目负责人明确确认；高度可信 = 字段、类型和数据一致，但缺少代码、批准文档或负责人明确确认。当前代码未映射 `TARGET_DATA_SOURCE_ID` 不改变负责人确认的业务关系分类。

### R2-03：修正 CDC_CLIENT_MULTIPLE 维护方

项目负责人确认：`CDC_CLIENT_MULTIPLE` 与 `CDC_DATA_SUBSCRIBE` 一样当前由人工维护；当前管理平台对其只读；后续会单独开发增删改查（CRUD），当前尚未实现。据此同步：

- `SCHEMA.md`：§2 表清单与 §6 维护方总则中，CDC_CLIENT_MULTIPLE 由“外部同步程序写入”调整为“人工维护（当前管理平台仅只读；后续计划单独开发 CRUD，尚未实现）”；日志表 `sync-server → Kafka → sync-log` 写入链与 Job 两表 `sync-client` 写入方不变。
- `RELATIONS.md`：R04 维护方调整为“人工维护 / 管理平台只读”；R04 字段关系、逗号分隔语义与 2026-08-26 核验结果不变。
- `tables/CDC_CLIENT_MULTIPLE.md`：文档头部数据维护方改为人工维护；当前读写属性明确为“管理平台只读、当前人工维护”；§8 边界说明记录后续计划单独开发 CRUD、当前尚未实现；代码访问入口与只读事实不变；`CONFIRMED_HARD_LIMIT`（总记录数不超过 20 条）、表结构、主键、字段、索引、数据快照与历史记录事实不变。
- `DATA_PROFILE.md`：核对后无 CDC_CLIENT_MULTIPLE 写入方/维护方描述（仅行数快照、硬上限、FG_ACTIVE 分布与逗号 token 匹配核验），按任务要求不修改该文件。

## R2-3. 提示词路径问题（已撤销）

R1 报告记录的提示词路径 `docs/prompts/database/PROJECT-DATABASE-BASELINE-001-R1-PROMPT.md` 经项目负责人确认真实存在于 Agent 服务器，为执行文件；本项已撤销，不属于 R2 修订问题。R1 报告对应路径保持不变，不删除、不修改、不补交 Git。

## R2-4. 实际修改文件（4 个）

- `docs/database/SCHEMA.md`
- `docs/database/RELATIONS.md`
- `docs/database/tables/CDC_CLIENT_MULTIPLE.md`
- `docs/database/reports/PROJECT-DATABASE-BASELINE-001.md`（本文件，追加本 R2 附录）

未修改：`DATA_PROFILE.md`（无维护方描述，无需同步）；其余单表文档、README、CHANGELOG、VERIFICATION、CODE_VALUES、`docs/baseline/**`、`docs/features/**`、项目根 README 及全部业务代码、配置与测试文件。

## R2-5. 自检结果

按任务 §10 的 16 项自检全部通过：`git diff --check` 通过；修改文件均在白名单内；无业务代码、Feature 文档、配置或测试差异；SCHEMA 不再声称 14 张表全部读写均由当前项目后端完成；SCHEMA §2 表清单与 §6 维护方总则均将 CDC_CLIENT_MULTIPLE 标为人工维护；RELATIONS 汇总为已确认 12 条（R01～R11、R15）、高度可信 3 条（R12～R14）、待确认 0 条；R15 保持原编号、字段关系、物理边界与核验数据；R04 维护方为人工维护；CDC_CLIENT_MULTIPLE.md 不再出现“外部同步程序写入”等错误现行表述；未来 CRUD 明确为尚未实现；≤20 硬上限保持不变；R1 提示词路径保持不变；14 张表、15 条关系、P1～P5 关闭与 `pending_user_confirmation_count=0` 保持不变；未恢复任何 CDC_CLIENT 现行信息；所有现行状态仍为 `DRAFT_PENDING_USER_REVIEW`；Markdown 表格、标题、数量、相对链接一致。

## R2-6. 未执行修改声明

- **数据库读/写 / DDL**：均未执行（`database_read_status=NONE`、`database_write_status=NONE`、`ddl_status=NONE`）。
- **ZooKeeper / 业务进程**：未读写、未启停（`zookeeper_status=NONE`）。
- **业务代码 / 配置 / 测试 / 构建**：未修改、未执行（`business_code_change_status=NONE`）；Feature 文档未修改（`feature_document_change_status=NONE`）。
- **数据库文档状态**：保持 `DRAFT_PENDING_USER_REVIEW`，未标记 `APPROVED`。

## R2-7. Git 提交、推送与后续边界

- 暂存范围：仅本 R2 修改的 4 个白名单文件。
- 提交信息：`docs(database): correct relation and ownership classification`。
- 推送：普通 `git push origin develop`，禁止 force push；推送后核验本地 HEAD 与 origin/develop 一致、ahead/behind `0 0`。
- 实际 result_commit_id / remote_commit_id / ahead_behind：以最终机器可读结果（AGENT_TASK_RESULT）为准。
- 后续边界：R2 任务在推送后停止；当前状态仍为 `DRAFT_PENDING_USER_REVIEW`，下一步仅限 ChatGPT 复审与用户批准；不进入基线批准、Feature 设计、CRUD 实现、业务代码清理或数据库整改。

---

# 批准收口附录（PROJECT-DATABASE-BASELINE-APPROVAL-001）

> 本附录为项目级数据库基线正式批准收口记录。初版、R1、R2 历史正文保持原貌；本附录明确：现行基线状态已由 `DRAFT_PENDING_USER_REVIEW` 收口为 `APPROVED`，取代历史状态，但不改写历史执行事实。

## AP-1. 批准任务与元数据

- 批准任务：`PROJECT-DATABASE-BASELINE-APPROVAL-001`
- 批准日期：2026-08-26
- 授权基线提交：`35ca45d3fab23ac95c5fb42c6623cfb7589ce82a`（本地 HEAD 与 `origin/develop` 一致，ahead/behind `0 0`）
- 提交链：初版 `4d98f9f0da5d7bc8e8314a6fbe071a8c619837a8` → R1 `935786498173a3ead6e56851f248303ebf75b3f7` → R2 `35ca45d3fab23ac95c5fb42c6623cfb7589ce82a`
- ChatGPT 最终复审结论：`REVIEW_PASS`
- 批准范围：7 份总体文档 + 14 份单表文档（共 21 份现行数据库基线文档），全部统一为 `APPROVED`

## AP-2. 批准内容

- 当前开发库只读核验得到的物理结构快照（主键、约束、索引、字段类型、可空性、注释、LOB、分区状态）；
- 当前生产代码实际使用的 14 张表范围，一张表一个文件的组织形式；
- 15 条跨表逻辑关系及“项目不设置物理外键”的架构决策；数据库不保证引用完整性、代码必须处理空引用/孤立引用/无效引用的规则；
- 数据维护方与当前管理平台读写边界；
- 公共码值和带时间点的数据画像（开发库 2026-08-26 瞬时状态，不代表生产常态）；
- `CDC_CLIENT_MULTIPLE ≤ 20` 的负责人硬上限；
- `CDC_LOG_ERROR` 可能达到十万、百万、千万级且不是硬上限；
- 一般 Feature 优先读取批准文档、仅在明确触发条件下定向重新读库的规则。

## AP-3. 数量与分类核验

- 当前使用表：14 张；
- 逻辑关系：15 条（R01～R15）；
- 已确认关系：12 条（R01～R11、R15）；
- 高度可信关系：3 条（R12～R14）；
- 待确认关系：0 条；
- `pending_user_confirmation_count=0`；
- 物理外键：0；14 张表均为非分区表；
- 4 项候选物理设计保持 `PENDING_DECISION` 未批准：D01（SUBSCRIBE 主键）、R01（EXTEND 一对一唯一约束）、D03（JFE 查询索引）、D04（JHL 查询索引）。

## AP-4. 批准边界（不批准、不实现）

- 本批准不代表 `CDC_CLIENT_MULTIPLE` / `CDC_DATA_SUBSCRIBE` CRUD 已经实现（均仍为计划中、尚未实现）；
- 不代表任何数据库整改已批准或排期；
- 不代表任何 DDL、分区、索引或生产库变更已执行；
- 不代表 `CDC_CLIENT` 死代码已清理；
- 不代表 Feature 级数据库特殊规则已自动批准；
- 不代表数据库所有未使用对象都进入当前项目范围；
- 2026-08-26 的数据行数和码值分布不是永久不变事实；
- 开发库数据画像不等同于生产库常态；
- 批准后仍需按 README §6 触发条件重新核验数据库。

## AP-5. 数据画像时间点边界

数据画像所有当前记录数均带环境（开发库）与时间点（2026-08-26），区分 `OBSERVED_EXACT` / `OBSERVED_ESTIMATED` / `CONFIRMED_HARD_LIMIT` / `CONFIRMED_EXPECTED_SCALE` / `UNVERIFIED_ASSUMPTION` / `PENDING_CONFIRMATION` / `PENDING_DECISION`；不构成永久事实，不作为生产常态。

## AP-6. 不包含内容

本批准收口为纯文档任务，不包含业务代码、Feature 实现、数据库整改、DDL 或生产变更；未连接数据库、未执行数据库写操作、DDL、ZooKeeper、构建、测试或业务代码修改（`database_read_status=NONE`、`database_write_status=NONE`、`ddl_status=NONE`、`zookeeper_status=NONE`、`business_code_change_status=NONE`、`feature_document_change_status=NONE`）。

## AP-7. 状态与历史处理

- 21 份现行数据库基线文档顶部状态已统一为 `APPROVED`；
- 初版、R1、R2 历史正文中当时的 `DRAFT_PENDING_USER_REVIEW`、旧待确认项和旧状态保持原样，未批量替换；
- 5 份历史化旧文档（`table-detail.md`、`confirmed-business-rules.md`、`table-list.md`、`table-relations.md`、`data-characteristics.md`）继续保持 `HISTORICAL_SUPERSEDED`；
- 批准只改变现行基线状态，不改写历史执行事实；当前状态取代历史状态。

## AP-8. Git 提交、推送与后续维护

- 暂存范围：本任务实际修改的 21 份现行数据库基线文档 + 本实施报告（追加批准收口附录）。
- 提交信息：`docs(database): approve project database baseline`。
- 推送：普通 `git push origin develop`，禁止 force push；推送后核验本地 HEAD 与 origin/develop 一致、ahead/behind `0 0`。
- 实际 result_commit_id / remote_commit_id / ahead_behind：以最终机器可读结果（AGENT_TASK_RESULT）为准。
- 后续维护：批准后一般 Feature 开发优先读取批准后的数据库文档，仅在 README §6 明确触发条件下定向重新读库；数据库结构变更（DDL）后按现有规则重新读库核验并更新对应文档；候选物理设计决策仍为 `PENDING_DECISION`，未批准不得实施。
