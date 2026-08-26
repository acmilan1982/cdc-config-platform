# CODE_VALUES — 项目级公共码值（项目数据库物理基线）

> 文档状态：`APPROVED`
> 批准任务：PROJECT-DATABASE-BASELINE-APPROVAL-001
> 批准日期：2026-08-26
> 批准基线提交：35ca45d3fab23ac95c5fb42c6623cfb7589ce82a
> 核验时间：2026-08-26
> 数据库：Oracle 19c 开发库（192.168.174.65:1521/prod.enmotech.com）
> Schema：CDC
> 元数据来源：真实数据库只读核验（ALL_COL_COMMENTS / ALL_CONSTRAINTS 码值枚举 + 只读码值分布统计）+ 代码枚举扫描
> 说明：观测值均为开发库 2026-08-26 瞬时分布，不代表生产常态；见 `DATA_PROFILE.md`。Feature 级局部过滤/展示例外只做引用提示，不写为项目级全局规则。

---

## 1. FG_ACTIVE（通用启用/有效标记）

| 适用表 | 字段 | 标准值 | 实际观测值（开发库 2026-08-26） | 项目级含义 | 来源与确认状态 |
|---|---|---|---|---|---|
| CDC_DATA_SOURCE | FG_ACTIVE | 1=正常；0=删除/停用 | 0：13，1：6 | 是否可用标记位，删除或停用后为 0，正常为 1 | 字段注释 + 观测 |
| CDC_CLIENT_MULTIPLE | FG_ACTIVE | 1=启用；0=停用 | 0：4，1：3 | 探针是否启用 | 字段注释 + 观测 |
| CDC_DATA_SUBSCRIBE | FG_ACTIVE | 1=启用；0=不启用 | 0：11，1：1 | 订阅记录是否启用 | 字段注释 + 观测 |

> 各表语义一致但注释措辞不同；代码按各模块业务过滤（如 JobFailure 只读 FG_ACTIVE='1' 的活跃客户端）。观测值含开发库停用存量，不代表标准分布。

## 2. DATA_SOURCE_TYPE（数据源类型）

| 适用表 | 字段 | 标准值 | 实际观测值 | 项目级含义 | 来源与确认状态 |
|---|---|---|---|---|---|
| CDC_DATA_SOURCE | DATA_SOURCE_TYPE | 源库：ORACLE；目标库：MYSQL、DORIS | ORACLE：12，DORIS：5，MYSQL：2 | 数据库类型，目前只支持源库 oracle，目标库 mysql、doris | 字段注释 + 观测；代码 DataSourceTypeEnum |

## 3. DATA_SOURCE_CATEGORY（源/目标类别）

| 适用表 | 字段 | 标准值 | 历史兼容值 | 实际观测值 | 来源与确认状态 |
|---|---|---|---|---|---|
| CDC_DATA_SOURCE | DATA_SOURCE_CATEGORY | SOURCE / TARGET（目标规则统一大写） | 大小写混用（source/target/SOURCE） | target：10，SOURCE：5，source：4 | 字段注释“取值 source/target，大小写都行” + 项目负责人确认目标规则统一大写，程序层做大小写兼容；当前存量仍大小写混用（当前事实） |

## 4. TABLE_NAMING_STRATEGY（目标表命名策略）

| 适用表 | 字段 | 标准值 | 实际观测值 | 项目级含义 | 来源与确认状态 |
|---|---|---|---|---|---|
| CDC_DATA_SOURCE_EXTEND | TABLE_NAMING_STRATEGY | CUSTOM_PREFIX_SUFFIX / TABLE_MERGE | CUSTOM_PREFIX_SUFFIX：6，TABLE_MERGE：4 | 当前业务库在目标库表的命名策略 | 观测 + 代码 TableNamingStrategyEnum |

## 5. INSTRUCTION_TYPE（日志指令类型）

| 适用表 | 字段 | 标准值 | 实际观测值 | 项目级含义 | 来源与确认状态 |
|---|---|---|---|---|---|
| CDC_LOG_CORRECT | INSTRUCTION_TYPE | c / u / d / r / ddl | 本次核验未采集（正确日志不按该字段单独统计，行量大） | c：新增  u：更新  d：删除  r：新增  ddl：表结构更新 | 字段注释 |
| CDC_LOG_ERROR | INSTRUCTION_TYPE | c / u / d / r / ddl | d：442 | 同上 | 字段注释 + 观测 |

> 注：注释中同时出现“c：新增”与“r: 新增”，为标准值中两值语义重叠的历史注释事实；不调整数据库注释，语义解释以功能基线为准。

## 6. RESULT_CODE（日志处理结果码）

| 适用表 | 字段 | 标准值 | 实际观测值 | 项目级含义 | 来源与确认状态 |
|---|---|---|---|---|---|
| CDC_LOG_CORRECT | RESULT_CODE | 0=成功；1=异常 | 本次核验未采集（行量大） | 0 表示执行成功，1 表示执行出现异常 | 字段注释 |
| CDC_LOG_ERROR | RESULT_CODE | 0=成功；1=异常 | 1：442 | 同上 | 字段注释 + 观测 |

## 7. JOB_FAILURE_EVENT 事件相关码值

| 适用表 | 字段 | 标准值（枚举） | 实际观测值 | 项目级含义 | 来源与确认状态 |
|---|---|---|---|---|---|
| CDC_JOB_FAILURE_EVENT | EVENT_RESULT | ACCEPTED / IGNORED_INVALID / IGNORED_STALE | ACCEPTED：28 | 失败事件初步处理结果：ACCEPTED=有效失败事件进入自动重启流程；IGNORED_INVALID=无效失败事件；IGNORED_STALE=旧 job 回调事件 | 字段注释（标准枚举）+ 观测 |
| CDC_JOB_FAILURE_EVENT | FLINK_STATUS | 通常为 FAILED | FAILED：28 | Flink 作业状态，当前失败事件写入时通常为 FAILED | 字段注释 + 观测 |

## 8. JOB_FAILURE_HANDLE_LOG 处理阶段（HANDLE_STAGE）

| 适用表 | 字段 | 标准值（枚举，10 个阶段） | 实际观测值 | 项目级含义 | 来源与确认状态 |
|---|---|---|---|---|---|
| CDC_JOB_FAILURE_HANDLE_LOG | HANDLE_STAGE | JOB_FAILURE_RECEIVED、JOB_FAILURE_IGNORED_INVALID、JOB_FAILURE_IGNORED_STALE、DUPLICATED_EVENT_IGNORED、RESTART_SCHEDULED、SCHEDULED_RESTART_SKIPPED、RESTART_STARTED、NEW_JOB_SUBMIT_SUCCEEDED、NEW_JOB_SUBMIT_FAILED、STABLE_CHECK_PASSED | RESTART_SCHEDULED：28，NEW_JOB_SUBMIT_SUCCEEDED：28，JOB_FAILURE_RECEIVED：28，RESTART_STARTED：28，STABLE_CHECK_PASSED：4 | 处理阶段枚举，见字段注释 | 字段注释（标准枚举）+ 观测 |

## 9. 大屏统计结果表码值

| 适用表 | 字段 | 标准值（CHECK/注释枚举） | 实际观测值 | 项目级含义 | 来源与确认状态 |
|---|---|---|---|---|---|
| CDC_STATS_TASK_CONFIG | ENABLED | 0=禁用；1=启用（CHECK：ENABLED IN (0,1)） | 1：1 | 任务启用标识 | CHECK 约束 + 观测 |
| CDC_STATS_TASK_CONFIG | TASK_CODE | 任务代码（主键） | LARGE_SCREEN_STATS：1 | 当前唯一任务代码 | 主键 + 观测 |
| CDC_STATS_WATERMARK | LOG_TYPE | CORRECT / ERROR（CHECK：LOG_TYPE IN ('CORRECT','ERROR')） | ERROR：1，CORRECT：1 | 日志类型：正确日志/错误日志，独立水位 | CHECK 约束 + 观测 |
| CDC_STATS_DIM_CUMULATIVE | DIM_TYPE | SOURCE_DATA_SOURCE / TARGET_DB / TABLE（CHECK：DIM_TYPE IN (...)） | TABLE：9，TARGET_DB：2，SOURCE_DATA_SOURCE：2 | 维度类型：源数据源/目标库/同步表 | CHECK 约束 + 观测 |
| CDC_STATS_DIM_DAILY | DIM_TYPE | 同上（CHECK） | TABLE：10，SOURCE_DATA_SOURCE：4，TARGET_DB：3 | 同上 | CHECK 约束 + 观测 |

> DIM_TYPE / LOG_TYPE / ENABLED 为数据库 CHECK 强约束；EVENT_RESULT、HANDLE_STAGE 等以字段注释枚举为项目级标准，数据库未加 CHECK。

## 10. Feature 局部例外引用提示（非项目级全局规则）

- Job失败监控“仅展示活跃客户端”的 FG_ACTIVE='1' 过滤、大屏“活跃订阅”过滤等属 Feature 局部展示例外，不写为全局码值规则；需要时以对应 Feature 基线为准。

## 11. 文档级变更记录

| 日期 | 变更 | 依据 |
|---|---|---|
| 2026-08-26 | 建立项目级公共码值基线（DRAFT_PENDING_USER_REVIEW） | PROJECT-DATABASE-BASELINE-001 只读核验 |
| 2026-08-26 | 批准：项目级数据库基线正式批准收口（APPROVED） | PROJECT-DATABASE-BASELINE-APPROVAL-001 批准 |
