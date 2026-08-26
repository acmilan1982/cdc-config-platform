# 批准报告：PROJECT-DATABASE-BASELINE-APPROVAL-001（项目级数据库基线正式批准收口）

> 文档状态：`APPROVED`
> 批准任务：PROJECT-DATABASE-BASELINE-APPROVAL-001
> 批准日期：2026-08-26
> 批准基线提交：35ca45d3fab23ac95c5fb42c6623cfb7589ce82a
> 数据库环境：Oracle 19c 开发库（192.168.174.65:1521/prod.enmotech.com），Schema `CDC`
> 任务性质：纯文档批准状态收口（不重新设计或修改任何数据库事实）

---

## 1. 批准任务与授权基线

- 批准任务：`PROJECT-DATABASE-BASELINE-APPROVAL-001`
- 批准日期：2026-08-26
- 授权基线提交：`35ca45d3fab23ac95c5fb42c6623cfb7589ce82a`
- 开始状态：当前分支 `develop`；本地 HEAD 与 `origin/develop` 均等于授权基线；ahead/behind `0 0`。

## 2. 连续任务与提交链

| 阶段 | 提交 | 结论 |
|---|---|---|
| 初版建立 | `4d98f9f0da5d7bc8e8314a6fbe071a8c619837a8` | `DRAFT_PENDING_USER_REVIEW` |
| R1 事实与边界修订 | `935786498173a3ead6e56851f248303ebf75b3f7` | 完成 R1-01～R1-07 |
| R2 一致性修订 | `35ca45d3fab23ac95c5fb42c6623cfb7589ce82a` | ChatGPT 复审 `REVIEW_PASS` |

项目负责人已授权继续执行正式批准收口。

## 3. ChatGPT 最终复审结论

```text
REVIEW_PASS
```

## 4. 批准范围

共 21 份现行数据库基线文档，全部由 `DRAFT_PENDING_USER_REVIEW` 统一收口为 `APPROVED`：

### 4.1 总体文档（7 份）

- `docs/database/README.md`
- `docs/database/SCHEMA.md`
- `docs/database/RELATIONS.md`
- `docs/database/CODE_VALUES.md`
- `docs/database/DATA_PROFILE.md`
- `docs/database/VERIFICATION.md`
- `docs/database/CHANGELOG.md`

### 4.2 单表文档（14 份）

- `docs/database/tables/CDC_DATA_SOURCE.md`
- `docs/database/tables/CDC_DATA_SOURCE_EXTEND.md`
- `docs/database/tables/CDC_DATA_SUBSCRIBE.md`
- `docs/database/tables/CDC_CLIENT_MULTIPLE.md`
- `docs/database/tables/CDC_LOG_CORRECT.md`
- `docs/database/tables/CDC_LOG_ERROR.md`
- `docs/database/tables/CDC_JOB_FAILURE_EVENT.md`
- `docs/database/tables/CDC_JOB_FAILURE_HANDLE_LOG.md`
- `docs/database/tables/CDC_STATS_CUMULATIVE_OVERVIEW.md`
- `docs/database/tables/CDC_STATS_DAILY_OVERVIEW.md`
- `docs/database/tables/CDC_STATS_DIM_CUMULATIVE.md`
- `docs/database/tables/CDC_STATS_DIM_DAILY.md`
- `docs/database/tables/CDC_STATS_TASK_CONFIG.md`
- `docs/database/tables/CDC_STATS_WATERMARK.md`

## 5. 使用表清单与数量（14 张）

| # | 表名 |
|---|---|
| 1 | CDC_DATA_SOURCE |
| 2 | CDC_DATA_SOURCE_EXTEND |
| 3 | CDC_CLIENT_MULTIPLE |
| 4 | CDC_DATA_SUBSCRIBE |
| 5 | CDC_LOG_CORRECT |
| 6 | CDC_LOG_ERROR |
| 7 | CDC_JOB_FAILURE_EVENT |
| 8 | CDC_JOB_FAILURE_HANDLE_LOG |
| 9 | CDC_STATS_CUMULATIVE_OVERVIEW |
| 10 | CDC_STATS_DAILY_OVERVIEW |
| 11 | CDC_STATS_DIM_CUMULATIVE |
| 12 | CDC_STATS_DIM_DAILY |
| 13 | CDC_STATS_TASK_CONFIG |
| 14 | CDC_STATS_WATERMARK |

14 张表均为普通堆表（非分区表），数据库层无物理外键（0 个）。

## 6. 逻辑关系清单与数量（15 条）

### 6.1 已确认关系（12 条：R01～R11、R15）

| # | 来源对象.字段 | 目标对象.字段 |
|---|---|---|
| R01 | CDC_DATA_SOURCE_EXTEND.DATA_SOURCE_ID | CDC_DATA_SOURCE.DATA_SOURCE_ID |
| R02 | CDC_DATA_SUBSCRIBE.DATA_FROM_SOURCE_ID | CDC_DATA_SOURCE.DATA_SOURCE_ID |
| R03 | CDC_DATA_SUBSCRIBE.DATA_TO_SOURCE_ID | CDC_DATA_SOURCE.DATA_SOURCE_ID |
| R04 | CDC_CLIENT_MULTIPLE.DATA_SOURCE_ID | CDC_DATA_SOURCE.DATA_SOURCE_ID |
| R05 | CDC_LOG_CORRECT.SOURCE_DATA_SOURCE_ID | CDC_DATA_SOURCE.DATA_SOURCE_ID |
| R06 | CDC_LOG_CORRECT.TARGET_DATA_SOURCE_ID | CDC_DATA_SOURCE.DATA_SOURCE_ID |
| R07 | CDC_LOG_ERROR.SOURCE_DATA_SOURCE_ID | CDC_DATA_SOURCE.DATA_SOURCE_ID |
| R08 | CDC_LOG_ERROR.TARGET_DATA_SOURCE_ID | CDC_DATA_SOURCE.DATA_SOURCE_ID |
| R09 | CDC_JOB_FAILURE_EVENT.CLIENT_ID | CDC_CLIENT_MULTIPLE.CLIENT_ID |
| R10 | CDC_JOB_FAILURE_EVENT.DATA_SOURCE_ID | CDC_DATA_SOURCE.DATA_SOURCE_ID |
| R11 | CDC_JOB_FAILURE_HANDLE_LOG.FAILURE_EVENT_ID | CDC_JOB_FAILURE_EVENT.ID |
| R15 | CDC_DATA_SOURCE_EXTEND.TARGET_DATA_SOURCE_ID | CDC_DATA_SOURCE.DATA_SOURCE_ID |

### 6.2 高度可信关系（3 条：R12～R14）

| # | 来源对象.字段 | 目标对象.字段 |
|---|---|---|
| R12 | CDC_STATS_WATERMARK.TASK_CODE | CDC_STATS_TASK_CONFIG.TASK_CODE |
| R13 | CDC_JOB_FAILURE_HANDLE_LOG.CLIENT_ID | CDC_CLIENT_MULTIPLE.CLIENT_ID |
| R14 | CDC_JOB_FAILURE_HANDLE_LOG.DATA_SOURCE_ID | CDC_DATA_SOURCE.DATA_SOURCE_ID |

### 6.3 汇总

- 已确认关系：12 条（R01～R11、R15）；
- 高度可信关系：3 条（R12～R14）；
- 待确认关系：0 条；
- 项目负责人待确认项：0 项（`pending_user_confirmation_count=0`）。

## 7. 数据画像时间点边界

`DATA_PROFILE.md` 中所有当前记录数、码值分布与规模描述均带环境（开发库）与时间点（2026-08-26），区分 `OBSERVED_EXACT` / `OBSERVED_ESTIMATED` / `CONFIRMED_HARD_LIMIT` / `CONFIRMED_EXPECTED_SCALE` / `UNVERIFIED_ASSUMPTION` / `PENDING_CONFIRMATION` / `PENDING_DECISION`。数据画像不构成永久事实，不代表生产常态；2026-08-26 的行数与码值分布是核验时点快照，不是不可变化的事实。

## 8. 未批准、未实现的边界

以下内容继续保持未批准或未实现状态：

- 4 项候选物理设计保持 `PENDING_DECISION`：`D01`（CDC_DATA_SUBSCRIBE.DATA_SUB_ID 是否加主键）、`R01`（CDC_DATA_SOURCE_EXTEND 是否加一对一唯一约束）、`D03`（CDC_JOB_FAILURE_EVENT 是否加查询索引）、`D04`（CDC_JOB_FAILURE_HANDLE_LOG 是否加查询索引）；
- `CDC_CLIENT_MULTIPLE` CRUD 尚未实现（计划中）；
- `CDC_DATA_SUBSCRIBE` CRUD 尚未实现（计划中）；
- 任何数据库整改未批准或未排期；
- 任何 DDL、分区、索引或生产库变更未执行；
- `CDC_CLIENT` 死代码未清理，且不进入现行数据库基线；
- Feature 级数据库特殊规则未自动批准；
- 数据库所有未使用对象不自动进入当前项目范围。

## 9. 保持不变的当前事实

- 当前使用表：14 张；逻辑关系：15 条；
- 已确认关系 12 条、高度可信关系 3 条、待确认关系 0 条；
- 物理外键：0；14 张表均为非分区表；
- `CDC_CLIENT` 不进入现行数据库基线；
- `CDC_CLIENT_MULTIPLE`：人工维护、管理平台当前只读、未来 CRUD 尚未实现；
- `CDC_DATA_SUBSCRIBE`：人工维护、管理平台当前只读、未来 CRUD 尚未实现；
- Job 两表（CDC_JOB_FAILURE_EVENT / CDC_JOB_FAILURE_HANDLE_LOG）：`sync-client` 写入、管理平台只读；
- 日志表（CDC_LOG_CORRECT / CDC_LOG_ERROR）：`sync-server → Kafka → sync-log` 写入；
- `CDC_STATS_TASK_CONFIG.UPDATED_BY`：无固定维护规则；
- 日志表归档、清理和保留周期：当前无统一规则；
- R1 提示词路径属于 Agent 服务器执行现场，保持不变。

## 10. 不包含内容声明

本批准收口为纯文档任务，不包含业务代码、Feature 实现、数据库整改、DDL 或生产变更：

- 数据库读/写 / DDL：均未执行（`database_read_status=NONE`、`database_write_status=NONE`、`ddl_status=NONE`）；
- ZooKeeper / 业务进程：未读写、未启停（`zookeeper_status=NONE`）；
- 业务代码 / 配置 / 测试 / 构建：未修改、未执行（`business_code_change_status=NONE`）；
- Feature 文档 / 项目基线：未修改（`feature_document_change_status=NONE`）。

## 11. 状态与历史记录处理

- 21 份现行数据库基线文档顶部状态统一为 `APPROVED`，并补充批准任务、批准日期、批准基线提交元数据；
- 初版、R1、R2 历史正文中的 `DRAFT_PENDING_USER_REVIEW`、旧待确认项和旧状态保持原样，未批量替换；
- 5 份历史化旧文档（`table-detail.md`、`confirmed-business-rules.md`、`table-list.md`、`table-relations.md`、`data-characteristics.md`）继续保持 `HISTORICAL_SUPERSEDED`；
- 批准只改变现行基线状态，不改写历史执行事实；当前状态取代历史状态。

## 12. 后续数据库文档维护及重新核验规则

- 批准后，Agent 通常应优先读取批准后的数据库文档，不必为普通 Feature 开发反复读取数据库元数据；
- 仅在 README `docs/database/README.md` §6 明确触发的条件（如结构变更 DDL、发现文档与数据库不一致等）下，才定向重新读库核验并更新对应文档；
- 数据库结构变更（DDL）后必须重新读库核验，并更新对应单表文档、`SCHEMA.md`、`CHANGELOG.md`；
- 数据画像（行数、码值分布）仅在有据可查的观测后更新 `DATA_PROFILE.md`，保留环境与时间点；
- 候选物理设计决策（D01 / R01 / D03 / D04）仍为 `PENDING_DECISION`，未经批准不得实施；
- 禁止在数据库文档中记录连接密码、字段密码值、`RAW_MESSAGE`、`LOG_DETAIL` 或敏感业务原文。

## 13. Git 提交与推送结果

- 暂存范围：本任务实际修改的 21 份现行数据库基线文档 + 原实施报告 `docs/database/reports/PROJECT-DATABASE-BASELINE-001.md`（追加批准收口附录）+ 本批准报告。
- 提交信息：`docs(database): approve project database baseline`。
- 推送：普通 `git push origin develop`，禁止 force push；推送后核验本地 HEAD 与 origin/develop 一致、ahead/behind `0 0`。
- 实际 result_commit_id / remote_commit_id / ahead_behind：以最终机器可读结果（AGENT_TASK_RESULT）为准。
