# RELATIONS — 跨表关系（项目数据库物理基线）

> 文档状态：`APPROVED`
> 批准任务：PROJECT-DATABASE-BASELINE-APPROVAL-001
> 批准日期：2026-08-26
> 批准基线提交：35ca45d3fab23ac95c5fb42c6623cfb7589ce82a
> 核验时间：2026-08-26
> 数据库：Oracle 19c 开发库（192.168.174.65:1521/prod.enmotech.com）
> Schema：CDC
> 元数据来源：真实数据库只读核验（ALL_CONSTRAINTS / ALL_CONS_COLUMNS，外键核验）+ 代码路径扫描 + 已批准文档 + 数据匹配核验
> 本文件是跨表关系的权威依据。关系分级记录，禁止仅凭字段名相似自行推断。

---

## 1. 物理外键

**本次核验在 14 张使用表上未发现任何物理 FOREIGN KEY 约束。**

14 张使用表**不设置物理外键**，这是项目确认的架构决策。数据库不强制保证引用完整性；各写入方和读取方必须在代码层处理空引用、孤立引用与无效引用。只读数据核验仅描述核验时点的实际状态，不构成持续完整性保证。

## 2. 逻辑关系分级汇总

| 确认状态 | 数量 | 编号 |
|---|---|---|
| 已确认（由代码直接关系、批准文档或项目负责人明确确认） | 12 | R01～R11、R15 |
| 高度可信（字段/类型/数据一致，但缺少代码、批准文档或负责人明确确认） | 3 | R12～R14 |
| 待用户确认 | 0 | — |

## 3. 已确认逻辑关系（R01～R11、R15）

| # | 来源对象.字段 | 目标对象.字段 | 关系类型 | 可空 | 使用场景/关联方式 | 维护方 | 代码证据 | 数据核验（开发库 2026-08-26） |
|---|---|---|---|---|---|---|---|---|
| R01 | CDC_DATA_SOURCE_EXTEND.DATA_SOURCE_ID | CDC_DATA_SOURCE.DATA_SOURCE_ID | 目标业务基数：一对一必填（每个数据源应有且仅有一条扩展配置）；当前物理：无唯一约束和外键，数据源到扩展物理上允许 0..N；扩展记录到数据源表现为多对一弱逻辑引用，并可能出现孤立引用 | Y | DataSourceServiceImpl 联操作（create 双 insert，delete 双 delete）；findExtend 通过 selectOne(ROWNUM=1) 查询 | 管理平台 | DataSourceServiceImpl.create/update/delete 均在 @Transactional 内操作两表 | 0 空值；1 组重复（同 ID 共 3 行）、2 条孤立、部分数据源无扩展记录，均为人工构造容错测试场景；行数见 DATA_PROFILE.md §1.1 |
| R02 | CDC_DATA_SUBSCRIBE.DATA_FROM_SOURCE_ID | CDC_DATA_SOURCE.DATA_SOURCE_ID | 多值弱逻辑引用（逗号分隔字符串） | Y | LargeScreenServiceImpl 维度映射 | 人工维护 / 管理平台只读 | 字段注释 + LargeScreenServiceImpl | 12/12 行每行至少一个 token 可匹配（共 12 个 token）；行数见 DATA_PROFILE.md §1.1 |
| R03 | CDC_DATA_SUBSCRIBE.DATA_TO_SOURCE_ID | CDC_DATA_SOURCE.DATA_SOURCE_ID | 多值弱逻辑引用（逗号分隔字符串） | Y | 同上 | 人工维护 / 管理平台只读 | 同上 | 12/12 行每行至少一个 token 可匹配（共 13 个 token）；行数见 DATA_PROFILE.md §1.1 |
| R04 | CDC_CLIENT_MULTIPLE.DATA_SOURCE_ID | CDC_DATA_SOURCE.DATA_SOURCE_ID | 多值弱逻辑引用（逗号分隔字符串） | Y | LargeScreenMapper.selectActiveClientDataSources 查询活跃客户端关联的数据源 | 人工维护 / 管理平台只读 | LargeScreenMapper @Select + LargeScreenServiceImpl | 7/7 行每行至少一个 token 可匹配（共 12 个 token）；行数见 DATA_PROFILE.md §1.1 |
| R05 | CDC_LOG_CORRECT.SOURCE_DATA_SOURCE_ID | CDC_DATA_SOURCE.DATA_SOURCE_ID | 多对一 | Y | 日志统计维度聚合（DIM_TYPE='SOURCE_DATA_SOURCE'） | sync-server → Kafka → sync-log 写入 / 管理平台只读 | LogBatchReader + DimKeyBuilder + DimType.SOURCE_DATA_SOURCE | 全量 DISTINCT 值 0 不匹配；行数为估算，见 DATA_PROFILE.md §1.2 |
| R06 | CDC_LOG_CORRECT.TARGET_DATA_SOURCE_ID | CDC_DATA_SOURCE.DATA_SOURCE_ID | 多对一 | Y | 日志统计维度聚合（DIM_TYPE='TARGET_DB'） | 同上 | 同上 | 全量 0 空值，0 不匹配 DISTINCT 值；行数为估算，见 DATA_PROFILE.md §1.2 |
| R07 | CDC_LOG_ERROR.SOURCE_DATA_SOURCE_ID | CDC_DATA_SOURCE.DATA_SOURCE_ID | 多对一 | Y | 错误日志统计 | sync-server → Kafka → sync-log 写入 / 管理平台只读 | DimKeyBuilder 同一算法处理 CORRECT/ERROR | 0 空值、0 孤立（442 行全非空且匹配）；行数见 DATA_PROFILE.md §1.1 |
| R08 | CDC_LOG_ERROR.TARGET_DATA_SOURCE_ID | CDC_DATA_SOURCE.DATA_SOURCE_ID | 多对一 | Y | 错误日志统计 | 同上 | 同上 | 0 空值、0 孤立；行数见 DATA_PROFILE.md §1.1 |
| R09 | CDC_JOB_FAILURE_EVENT.CLIENT_ID | CDC_CLIENT_MULTIPLE.CLIENT_ID | 多对一 | N | JobFailureServiceImpl 按 clientId 筛选故障事件，并 JOIN 获取 active client 的 dataSourceIds | sync-client 写入 / 管理平台只读 | JobFailureServiceImpl.loadAndAssemble 中 .in(JobFailureEvent::getClientId, clientIds) | 0 空值 0 孤立；行数见 DATA_PROFILE.md §1.1 |
| R10 | CDC_JOB_FAILURE_EVENT.DATA_SOURCE_ID | CDC_DATA_SOURCE.DATA_SOURCE_ID | 多对一 | N | JobFailureServiceImpl 按 dataSourceId 筛选故障事件，并通过 selectBatchIds 获取数据源名称 | sync-client 写入 / 管理平台只读 | JobFailureServiceImpl.loadAndAssemble 中 .eq(JobFailureEvent::getDataSourceId, dataSourceId)；loadDataSourceNames 中 dataSourceMapper.selectBatchIds | 0 空值 0 孤立；行数见 DATA_PROFILE.md §1.1 |
| R11 | CDC_JOB_FAILURE_HANDLE_LOG.FAILURE_EVENT_ID | CDC_JOB_FAILURE_EVENT.ID | 多对一（反向：一个故障事件对应多条处理日志） | N | JobFailureServiceImpl 按事件 ID 列表批量获取处理日志 | sync-client 写入 / 管理平台只读 | JobFailureServiceImpl.loadLogsByEventIds 中 .in(JobFailureHandleLog::getFailureEventId, eventIds) | 0 空值 0 孤立；行数见 DATA_PROFILE.md §1.1 |
| R15 | CDC_DATA_SOURCE_EXTEND.TARGET_DATA_SOURCE_ID | CDC_DATA_SOURCE.DATA_SOURCE_ID | 多对一弱逻辑引用（业务语义目标库，应 DATA_SOURCE_CATEGORY='TARGET'） | Y | 字段含义由项目负责人 2026-08-26 明确确认；当前代码未映射该字段、无代码级 JOIN；无物理外键、无类别约束 | 管理平台（EXTEND 联写维护该行；TARGET_DATA_SOURCE_ID 字段当前代码未映射） | 项目负责人 2026-08-26 明确确认字段含义（目标库）；无代码级 JOIN | 10 行中 2 行非空（2 个不同值），均匹配 category=target，0 孤立（定向核验） |

## 4. 高度可信逻辑关系（R12～R14）

| # | 来源对象.字段 | 目标对象.字段 | 关系类型 | 可空 | 证据 | 数据核验（开发库 2026-08-26） |
|---|---|---|---|---|---|---|
| R12 | CDC_STATS_WATERMARK.TASK_CODE | CDC_STATS_TASK_CONFIG.TASK_CODE | 多对一（反向：一项任务配置对应多条水位） | N | StatsWatermarkMapper + StatsTaskConfigMapper 使用相同 TASK_CODE='LARGE_SCREEN_STATS'；数据确认 1 个 TASK_CODE 对应 2 条水位（CORRECT+ERROR） | 1 个 TASK_CODE 对 2 条水位（定向核验） |
| R13 | CDC_JOB_FAILURE_HANDLE_LOG.CLIENT_ID | CDC_CLIENT_MULTIPLE.CLIENT_ID | 多对一 | N | 与 JOB_FAILURE_EVENT.CLIENT_ID 语义相同、类型一致、值可匹配 | 0 空值 0 孤立；行数见 DATA_PROFILE.md §1.1 |
| R14 | CDC_JOB_FAILURE_HANDLE_LOG.DATA_SOURCE_ID | CDC_DATA_SOURCE.DATA_SOURCE_ID | 多对一 | N | 与 JOB_FAILURE_EVENT.DATA_SOURCE_ID 语义相同、类型一致、值可匹配 | 0 空值 0 孤立；行数见 DATA_PROFILE.md §1.1 |

> 完整性/孤立语义：已确认与高度可信关系均标注定向数据核验（0 空值、0 孤立或 token 级匹配），数据核验仅描述核验时点的实际状态（开发库 2026-08-26），行数快照统一见 `DATA_PROFILE.md`。数据库不设置物理外键（已确认架构决策），不强制保证引用完整性；各写入方和读取方须在代码层兼容空引用、孤立引用与无效引用，详见单表文档 §9 与功能基线。

## 5. 特殊关系（非传统外键）

### 5.1 逗号分隔多值弱逻辑引用

以下字段使用逗号分隔字符串存储多个引用值，代码层通过字符串 split 解析，无法使用标准 SQL JOIN。整体业务关系接近多对多，但不是传统外键或关系表。数据库不保证每个 token 均有效，个别 token 可能无法匹配，具体容错由业务代码负责。

| 来源字段 | 目标表 | 使用位置 | 解析方式 |
|---|---|---|---|
| CDC_CLIENT_MULTIPLE.DATA_SOURCE_ID | CDC_DATA_SOURCE | LargeScreenMapper.selectActiveClientDataSources | 代码层 .split(",") |
| CDC_DATA_SUBSCRIBE.DATA_FROM_SOURCE_ID | CDC_DATA_SOURCE | LargeScreenServiceImpl 维度映射 | 逗号分隔 |
| CDC_DATA_SUBSCRIBE.DATA_TO_SOURCE_ID | CDC_DATA_SOURCE | LargeScreenServiceImpl 维度映射 | 逗号分隔 |

定向核验（开发库 2026-08-26）确认每条记录的逗号分隔值中至少存在一个可匹配 token，但不声称全部 token 均有效。

### 5.2 失败 Job ID 链（非外键，代码内链式关联）

CDC_JOB_FAILURE_EVENT 和 CDC_JOB_FAILURE_HANDLE_LOG 通过 FAILURE_EVENT_ID 和 FAILED_JOB_ID/NEW_JOB_ID 构成作业间故障链。处理日志的 NEW_JOB_ID 可能指向后续故障事件的 FAILED_JOB_ID，形成链式关联。`monitor/jobfailure/algorithm` 中的 FaultProcessGrouper 和 JobChainBuilder 在此基础上构建故障过程模型。

FAILED_JOB_ID 是 Flink 实际 Job ID，**不保存在 ZooKeeper** 中；ZK 路径中的 jobName 是另一套标识，两者不建立直接逻辑关系。

### 5.3 单值弱逻辑引用（无数据库类别约束）

CDC_DATA_SOURCE_EXTEND.TARGET_DATA_SOURCE_ID 是到 CDC_DATA_SOURCE.DATA_SOURCE_ID 的单值弱逻辑引用，业务语义为目标库（DATA_SOURCE_CATEGORY='TARGET'）。数据库无物理外键、无类别约束；当前生产代码未映射该字段、无代码级 JOIN（R15）。引用方代码须兼容目标缺失、停用或类别不符等情况，容错由业务代码负责。

## 6. 无法确认或已废弃关系

- 旧资料中曾存在的 `FAILED_JOB_ID ↔ ZK jobName` 关系已由用户确认不成立（FAILED_JOB_ID 为 Flink Job ID，不在 ZK 保存），不列入有效关系。
- 未发现基于字段名相似但无代码/数据/负责人确认的推断关系；本文件只登记有依据的关系。

## 7. 小型关系图（逻辑引用）

```
CDC_DATA_SOURCE ──< R01（一对一必填目标/物理0..N）── CDC_DATA_SOURCE_EXTEND
CDC_DATA_SOURCE ──< R15（单值弱引用，目标库）──── CDC_DATA_SOURCE_EXTEND
CDC_DATA_SOURCE ──< R02/R03（多值弱引用）────────── CDC_DATA_SUBSCRIBE
CDC_DATA_SOURCE ──< R04（多值弱引用）────────────── CDC_CLIENT_MULTIPLE
CDC_DATA_SOURCE ──< R05/R06/R07/R08（多对一）────── CDC_LOG_CORRECT / CDC_LOG_ERROR
CDC_CLIENT_MULTIPLE ──< R09 ── CDC_JOB_FAILURE_EVENT
CDC_DATA_SOURCE ──────< R10 ── CDC_JOB_FAILURE_EVENT
CDC_JOB_FAILURE_EVENT ──< R11 ── CDC_JOB_FAILURE_HANDLE_LOG
CDC_CLIENT_MULTIPLE ──< R13 ── CDC_JOB_FAILURE_HANDLE_LOG
CDC_DATA_SOURCE ──────< R14 ── CDC_JOB_FAILURE_HANDLE_LOG
CDC_STATS_TASK_CONFIG ──< R12 ── CDC_STATS_WATERMARK
```

> 图中 `<` 表示目标对象到来源对象方向（来源为子表/引用方，目标为主表/被引用方）；箭头不做物理外键含义。

## 8. 文档级变更记录

| 日期 | 变更 | 依据 |
|---|---|---|
| 2026-08-26 | 建立跨表关系基线（DRAFT_PENDING_USER_REVIEW） | PROJECT-DATABASE-BASELINE-001 只读核验 + 代码映射审计 |
| 2026-08-26 | R1：补充 R15（EXTEND.TARGET_DATA_SOURCE_ID→DATA_SOURCE）；维护方与数据核验口径修订 | PROJECT-DATABASE-BASELINE-001-R1 修订 |
| 2026-08-26 | R2：R15 由高度可信调整为已确认逻辑关系（项目负责人确认）；R04 维护方调整为人工维护 / 管理平台只读 | PROJECT-DATABASE-BASELINE-001-R2 修订 |
| 2026-08-26 | 批准：项目级数据库基线正式批准收口（APPROVED） | PROJECT-DATABASE-BASELINE-APPROVAL-001 批准 |
