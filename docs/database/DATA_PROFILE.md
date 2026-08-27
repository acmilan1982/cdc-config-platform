# DATA_PROFILE — 数据现状与负责人规模画像（项目数据库物理基线）

> 文档状态：`APPROVED`
> 批准任务：PROJECT-DATABASE-BASELINE-APPROVAL-001
> 批准日期：2026-08-26
> 批准基线提交：35ca45d3fab23ac95c5fb42c6623cfb7589ce82a
> 核验时间：2026-08-26
> 数据库：Oracle 19c 开发库（192.168.174.65:1521/prod.enmotech.com）
> Schema：CDC
> 说明：本文档是**数据画像**，不是结构基线。区分信息类型：`OBSERVED_EXACT`（数据库精确查询）、`OBSERVED_ESTIMATED`（统计信息/受控估算）、`CONFIRMED_HARD_LIMIT`（负责人确认的业务硬上限）、`CONFIRMED_EXPECTED_SCALE`（负责人确认的典型/可能量级，不构成严格上限）、`UNVERIFIED_ASSUMPTION`（未核验假设）、`PENDING_CONFIRMATION`（待项目负责人确认）、`PENDING_DECISION`（待独立设计决策）。所有当前记录数均带环境（开发库）与时间点（2026-08-26），不代表生产常态。禁止记录密码、RAW_MESSAGE、LOG_DETAIL 或敏感业务原文。

---

## 1. 当前表行数快照

### 1.1 小表精确计数（`OBSERVED_EXACT`，开发库 2026-08-26）

以下为 `SELECT COUNT(*)` 精确统计（小表、成本可接受）：

| 表名 | 精确行数 | 查询口径 | 是否持续变化 |
|---|---|---|---|
| CDC_CLIENT_MULTIPLE | 7 | COUNT(*) | 低频变化（≤20 硬上限，见 §2） |
| CDC_DATA_SOURCE | 19 | COUNT(*) | 低频变化 |
| CDC_DATA_SOURCE_EXTEND | 10 | COUNT(*) | 低频变化 |
| CDC_DATA_SUBSCRIBE | 12 | COUNT(*) | 低频变化 |
| CDC_JOB_FAILURE_EVENT | 28 | COUNT(*) | 随失败事件增长 |
| CDC_JOB_FAILURE_HANDLE_LOG | 116 | COUNT(*) | 随失败处理流程增长 |
| CDC_LOG_ERROR | 442 | COUNT(*) | 随同步错误增长（见 §2 量级预期） |
| CDC_STATS_CUMULATIVE_OVERVIEW | 1 | COUNT(*) | 低频变化（按任务代码一行） |
| CDC_STATS_DAILY_OVERVIEW | 3 | COUNT(*) | 随自然日新增 |
| CDC_STATS_DIM_CUMULATIVE | 13 | COUNT(*) | 随维度新增 |
| CDC_STATS_DIM_DAILY | 17 | COUNT(*) | 随维度+日期新增 |
| CDC_STATS_TASK_CONFIG | 1 | COUNT(*) | 低频变化（配置，启动时读取一次） |
| CDC_STATS_WATERMARK | 2 | COUNT(*) | 低频变化（CORRECT/ERROR 各一） |

### 1.2 大表估算（`OBSERVED_ESTIMATED`）

| 表名 | 估算行数 | 口径 | 依据 | 是否持续变化 |
|---|---|---|---|---|
| CDC_LOG_CORRECT | ≈ 3,819,479 | ALL_TABLES.NUM_ROWS 统计信息 | LAST_ANALYZED 2026-08-12；未做大表全表 COUNT | 持续增长（同步正确日志） |

> 成本原则：CDC_LOG_CORRECT 为大规模日志表，按统计信息估算；若需精确值需另行评估成本与授权。个别小表统计信息陈旧（如 ALL_TABLES.NUM_ROWS 对 CDC_LOG_ERROR=1、CDC_STATS_DAILY_OVERVIEW=2、CDC_STATS_DIM_DAILY=13），精确计数以 §1.1 为准。

### 1.3 已批准待实现表快照（`OBSERVED_EXACT`，开发库 2026-08-27）

以下为 2026-08-27 只读核验（DATABASE-BASELINE-SERVER-CONFIG-001）的精确 `COUNT(*)` 与定向核验结果：

| 表名 | 精确行数 | 查询口径 | 说明 |
|---|---|---|---|
| CDC_SERVER | 1 | COUNT(*) | 中心端登记表；当前唯一记录为 `Server001`；写入方为 `sync-server` 启动登记（负责人确认，本仓库不可验证实现），管理平台不维护 |
| CDC_SERVER_CONFIG | 8 | COUNT(*) | 中心端配置项表；8 条全部归属 `Server001` |

配置数据定向核验（2026-08-27）：

| 检查项 | 结论 |
|---|---|
| `CDC_SERVER_CONFIG.SERVER_ID` 为 NULL | 0 |
| 找不到对应中心端的孤立引用 | 0（所有 `SERVER_ID` 均能在 `CDC_SERVER` 中找到） |
| 同一中心端下重复 `CONFIG_KEY` | 0（数据库无对应唯一约束，当前无重复为数据事实） |
| `CONFIG_KEY` 为 NULL | 0 |
| `IS_EDITABLE` 取值分布 | `1` 六条、`0` 两条 |

> 以上为开发库瞬时快照（2026-08-27），不代表生产常态，也不代表数据库允许值全集；`IS_EDITABLE` 取值分布不等于数据库合法值全集（无 CHECK 约束，见 `tables/CDC_SERVER_CONFIG.md`）。

---

## 2. 项目负责人确认的规模描述

| 表名 | 内容 | 性质 | 来源 | 确认日期 | 含义 |
|---|---|---|---|---|---|
| CDC_CLIENT_MULTIPLE | 总记录数一定不会超过 20 条 | `CONFIRMED_HARD_LIMIT` | 项目负责人 | 2026-08-26 | 当前业务模型下的业务硬上限 |
| CDC_LOG_ERROR | 记录数可能为十万、百万、千万级别不等 | `CONFIRMED_EXPECTED_SCALE` | 项目负责人 | 2026-08-26 | 典型/可能量级；**明确不构成“最大千万条”的硬上限** |

> 迁移说明：上述两条为本次任务用户明确确认。从已批准文档迁移的其他规模描述若无法证明已批准，一律标为待确认，不擅自升级为负责人确认。

---

## 3. 写入链、增长方式与保留特征

| 表/对象 | 观测与假设 | 性质 |
|---|---|---|
| CDC_LOG_CORRECT / CDC_LOG_ERROR | 写入链 `sync-server → Kafka → sync-log → CDC_LOG_CORRECT / CDC_LOG_ERROR` 为已确认业务事实（见日志查询 Feature 基线）；按数据变更持续写入，为流水型增长；当前开发库行数见 §1（OBSERVED_EXACT / ESTIMATED，2026-08-26） | 已确认业务事实 + `OBSERVED_*` |
| CDC_LOG_CORRECT / CDC_LOG_ERROR | 归档/清理/保留时长目前**无统一规则**，代码与资料未确认，不得推断 | 未建立规则（不得写成假设或事实） |
| CDC_STATS_* 结果表 | 由大屏统计调度按批次 MERGE 更新，行数随维度/自然日缓慢增长 | `OBSERVED_EXACT`（当前规模）+ 长期增长为观测 |
| CDC_JOB_FAILURE_EVENT / HANDLE_LOG | 随失败事件与处理流程增长，当前规模小（28/116） | `OBSERVED_EXACT` |

---

## 4. 空值、码值分布与数据倾斜（`OBSERVED_EXACT`，开发库 2026-08-26）

| 对象 | 观测 | 性质 |
|---|---|---|
| CDC_DATA_SOURCE.DATA_SOURCE_TYPE | ORACLE=12，DORIS=5，MYSQL=2 | `OBSERVED_EXACT` |
| CDC_DATA_SOURCE.DATA_SOURCE_CATEGORY | target=10，SOURCE=5，source=4（大小写混用，当前事实；目标规则统一大写） | `OBSERVED_EXACT` |
| CDC_DATA_SOURCE.FG_ACTIVE | 0=13，1=6（开发库停用存量多） | `OBSERVED_EXACT` |
| CDC_CLIENT_MULTIPLE.FG_ACTIVE | 0=4，1=3 | `OBSERVED_EXACT` |
| CDC_DATA_SUBSCRIBE.FG_ACTIVE | 0=11，1=1（开发库多为停用记录） | `OBSERVED_EXACT` |
| CDC_LOG_ERROR.INSTRUCTION_TYPE | d=442（当前开发库全为删除指令） | `OBSERVED_EXACT` |
| CDC_LOG_ERROR.RESULT_CODE | 1=442 | `OBSERVED_EXACT` |
| CDC_JOB_FAILURE_EVENT.EVENT_RESULT / FLINK_STATUS | ACCEPTED=28，FAILED=28 | `OBSERVED_EXACT` |
| CDC_JOB_FAILURE_HANDLE_LOG.HANDLE_STAGE | RESTART_SCHEDULED=28，NEW_JOB_SUBMIT_SUCCEEDED=28，JOB_FAILURE_RECEIVED=28，RESTART_STARTED=28，STABLE_CHECK_PASSED=4 | `OBSERVED_EXACT` |
| CDC_STATS_* 码值 | 见 `CODE_VALUES.md` §9（DIM_TYPE/LOG_TYPE/ENABLED/TASK_CODE） | `OBSERVED_EXACT` |

> 以上为开发库瞬时分布，不代表生产常态；Feature 级过滤（如只读活跃记录）与全局码值规则见 `CODE_VALUES.md`。

---

## 5. 数据完整性核验结论（只读定向核验，开发库 2026-08-26）

> 数据核验仅描述核验时点的实际状态，不构成持续完整性保证；行数快照见 §1。

| 检查项 | 结论 |
|---|---|
| CDC_DATA_SOURCE_EXTEND.DATA_SOURCE_ID | 10 行 0 空值；1 组重复（同 ID 3 行）；2 条孤立；13 个数据源无扩展记录——均为人工构造容错测试场景，非待清理异常 |
| CDC_DATA_SOURCE_EXTEND.TARGET_DATA_SOURCE_ID | 10 行中 2 行非空（2 个不同值），均匹配 DATA_SOURCE_CATEGORY='TARGET'，0 孤立 |
| CDC_DATA_SUBSCRIBE.DATA_SUB_ID | 12 行 0 空值 0 重复 |
| 逗号分隔字段 token 匹配 | CDC_CLIENT_MULTIPLE.DATA_SOURCE_ID（12 token）、DATA_FROM_SOURCE_ID（12 token）、DATA_TO_SOURCE_ID（13 token）均“每行至少一个 token 可匹配”，不证明 token 级完整性 |
| CDC_LOG_CORRECT 数据源引用 | SOURCE/TARGET_DATA_SOURCE_ID 全量 DISTINCT 值 0 不匹配；行数为估算，见 §1.2 |
| CDC_LOG_ERROR 数据源引用 | SOURCE/TARGET 均非空 0 空值；TARGET 0 孤立（442 行，见 §1.1） |
| JFE 引用 | CLIENT_ID→CCM、DATA_SOURCE_ID→DS：28 行 0 空值 0 孤立 |
| JHL 引用 | FAILURE_EVENT_ID→JFE.ID、CLIENT_ID→CCM、DATA_SOURCE_ID→DS：116 行 0 空值 0 孤立 |
| JFE.FAILED_JOB_ID | 非空（Flink 实际 Job ID，不在 ZK 保存） |

---

## 6. CLOB / 大字段画像（结构事实，不记录原文）

| 表 | CLOB 字段 | 说明 |
|---|---|---|
| CDC_DATA_SUBSCRIBE | DATA_SOURCE_TABLE / DATA_SOURCE_COMMENT / DATA_TARGET_TABLE / DATA_TARGET_COMMENT | 存订阅表清单与注释（逗号分隔结构） |
| CDC_JOB_FAILURE_EVENT | FAILURE_DETAIL | 完整失败异常详情（堆栈或截断安全堆栈） |
| CDC_JOB_FAILURE_HANDLE_LOG | ERROR_DETAIL | 处理动作异常详情 |
| CDC_LOG_CORRECT / CDC_LOG_ERROR | RAW_MESSAGE | 原始消息；LOG_DETAIL 为 VARCHAR2(4000) 日志详情 |

> 禁止记录上述字段的业务原文。LOG_DETAIL 字段注释注明“该字段考虑压缩”（历史设计意图，未核验是否实施）。

---

## 7. 待确认项与待决策项

### 7.1 待项目负责人确认项（`PENDING_CONFIRMATION`）

当前 **0 项**。原 P1～P5 已按项目负责人 2026-08-26 确认结论关闭（见 §7.3）。

### 7.2 待独立设计决策项（`PENDING_DECISION`）

以下为候选物理设计项，未经正式批准，不承诺实施或排期：

| 编号 | 对象 | 事项 | 当前物理事实 |
|---|---|---|---|
| D01 | CDC_DATA_SUBSCRIBE | 是否将 DATA_SUB_ID 设置为主键 | 无主键、无唯一约束、无索引 |
| R01 | CDC_DATA_SOURCE_EXTEND | 是否约束每数据源一条扩展配置（一对一必填目标） | 无唯一约束/外键，物理允许 0..N，存在测试构造的重复/孤立/缺失 |
| D03 | CDC_JOB_FAILURE_EVENT | 是否为 CLIENT_ID / DATA_SOURCE_ID / FAILURE_TIME 等查询字段补索引 | 仅主键索引 |
| D04 | CDC_JOB_FAILURE_HANDLE_LOG | 是否为 FAILURE_EVENT_ID / CLIENT_ID / DATA_SOURCE_ID 补索引 | 仅主键索引 |

### 7.3 原 P1～P5 关闭记录（项目负责人 2026-08-26 确认）

| 原编号 | 事项 | 关闭依据 |
|---|---|---|
| P1 | SUBSCRIBE / JFE / JHL 写入方 | SUBSCRIBE 人工维护（管理平台仅只读，后续 CRUD 计划尚未实现）；JFE/JHL 由 sync-client 进程写入，管理平台仅只读 |
| P2 | EXTEND.TARGET_DATA_SOURCE_ID 含义 | 业务语义为目标库（category='TARGET'），为无类别约束的弱逻辑引用；代码未映射该字段 |
| P3 | STATS_TASK_CONFIG.UPDATED_BY 维护约定 | 可选修改人标识，无固定维护规则 |
| P4 | SUBSCRIBE 主键历史冲突 | 当前物理事实为无主键；历史“已验证”为旧资料错误；是否增加主键属 D01 独立决策 |
| P5 | SCHEMA §5 对象范围 | 当前基线范围为 14 张使用表；其余对象按 `DOCUMENTED_NOT_USED` / 范围外登记，不阻塞基线批准 |

## 8. 数据特征对通用设计的影响提示

- CDC_LOG_CORRECT 为大规模表：统计/查询需按时间范围与索引引导（TARGET_TIME 等），避免全表扫描；精确 COUNT 需评估成本。
- CDC_LOG_ERROR 量级可达十万/百万/千万（非硬上限）：相关查询/保留策略需按此量级设计。
- 大小写混用字段（DATA_SOURCE_CATEGORY）与多值逗号分隔字段：程序层需做兼容与容错（代码已做）。
- 开发库存在人工构造容错测试数据（EXTEND 重复/孤立/缺失），统计口径需排除或说明。

## 9. 文档级变更记录

| 日期 | 变更 | 依据 |
|---|---|---|
| 2026-08-26 | 建立数据现状与规模画像（DRAFT_PENDING_USER_REVIEW） | PROJECT-DATABASE-BASELINE-001 只读核验 + R1 数据核验 + 项目负责人确认 |
| 2026-08-26 | R1：拆分日志写入链与保留规则；更新数据完整性核验结论（含 R15）；关闭 P1～P5 并新增 PENDING_DECISION | PROJECT-DATABASE-BASELINE-001-R1 修订 |
| 2026-08-26 | 批准：项目级数据库基线正式批准收口（APPROVED） | PROJECT-DATABASE-BASELINE-APPROVAL-001 批准 |
| 2026-08-27 | 新增 §1.3 已批准待实现表快照（CDC_SERVER 精确 1 行、CDC_SERVER_CONFIG 精确 8 行，全部归属 Server001；IS_EDITABLE 1=6、0=2；SERVER_ID NULL 0、孤立引用 0、同中心端重复 CONFIG_KEY 0）；明确为开发库瞬时画像，不代表生产常态与数据库允许值全集 | DATABASE-BASELINE-SERVER-CONFIG-001（候选）+ DATABASE-BASELINE-SERVER-CONFIG-APPROVAL-001（批准） |
