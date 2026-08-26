# CDC_STATS_TASK_CONFIG — 大屏统计任务配置表

> 文档状态：`DRAFT_PENDING_USER_REVIEW`
> 核验时间：2026-08-26
> 数据库：Oracle 19c 开发库（192.168.174.65:1521/prod.enmotech.com）
> Schema：CDC
> 元数据来源：真实数据库只读核验（ALL_TABLES / ALL_TAB_COLUMNS / ALL_COL_COMMENTS / ALL_CONSTRAINTS / ALL_INDEXES / ALL_OBJECTS）
> 关联代码模块 / Feature：大屏统计（`largescreen/stats`）
> 数据维护方：人工维护（调度配置，启动时读取一次，修改后重启生效）

---

## 1. 基本信息

| 项 | 值 |
|---|---|
| 表用途 | 大屏统计任务配置表：保存统计任务参数（启用标识、启动延迟、固定间隔、安全延迟、批大小、最大批数、最大运行时长），应用启动时读取一次 |
| 表类型 | 普通堆表（NON-PARTITIONED） |
| 主键 | `PK_CDC_STATS_TASK_CONFIG`（`TASK_CODE`） |
| 外键 | 无 |
| 分区 | 无 |
| LOB | 无 |
| 当前读写属性 | 只读（应用启动时读取）；由人工维护配置 |
| 表注释 | 大屏统计任务配置表（启动时读取一次，修改后重启生效） |
| LAST_DDL_TIME | 2026-08-06 |

---

## 2. 字段结构

| # | 字段名 | Oracle类型 | 字符长度 | 精度/小数 | 可空 | 默认值 | 字段注释 |
|---|---|---|---|---|---|---|---|
| 1 | TASK_CODE | VARCHAR2 | 64 | — | N | — | 任务代码，主键 |
| 2 | TASK_NAME | VARCHAR2 | 128 | — | N | — | 任务中文名称 |
| 3 | ENABLED | NUMBER | 1 | 1/0 | N | — | 启用标识：0=禁用 1=启用 |
| 4 | STARTUP_DELAY_MINUTES | NUMBER | 6 | 6/0 | N | — | 应用启动后首次执行延迟（分钟） |
| 5 | SCHEDULE_INTERVAL_MINUTES | NUMBER | 6 | 6/0 | N | — | 两次执行的固定间隔（分钟） |
| 6 | SAFETY_DELAY_MINUTES | NUMBER | 6 | 6/0 | N | — | 数据安全延迟（分钟），本轮不处理生成时间位于最近N分钟内的雪花ID |
| 7 | BATCH_SIZE | NUMBER | 10 | 10/0 | N | — | 每张日志表单批最大处理条数 |
| 8 | MAX_BATCHES_PER_RUN | NUMBER | 6 | 6/0 | N | — | 单轮最多执行批数（每张日志表各自上限） |
| 9 | MAX_RUN_DURATION_SECONDS | NUMBER | 10 | 10/0 | N | — | 单轮最长执行时间（秒），整轮共享 |
| 10 | CREATE_TIME | DATE | 7 | — | N | — | 记录创建时间 |
| 11 | UPDATE_TIME | DATE | 7 | — | N | — | 记录最后更新时间 |
| 12 | UPDATED_BY | VARCHAR2 | 64 | — | Y | — | 修改人标识 |

---

## 3. 约束

| 类型 | 名称 | 字段 | 状态 |
|---|---|---|---|
| PRIMARY KEY | PK_CDC_STATS_TASK_CONFIG | TASK_CODE | ENABLED |
| CHECK | CK_CDC_STATS_CFG_BATCH | BATCH_SIZE BETWEEN 1000 AND 1000000 | ENABLED |
| CHECK | CK_CDC_STATS_CFG_BATCHES | MAX_BATCHES_PER_RUN BETWEEN 1 AND 100 | ENABLED |
| CHECK | CK_CDC_STATS_CFG_DELAY | SAFETY_DELAY_MINUTES BETWEEN 1 AND 1440 | ENABLED |
| CHECK | CK_CDC_STATS_CFG_DURATION | MAX_RUN_DURATION_SECONDS BETWEEN 10 AND 3600 | ENABLED |
| CHECK | CK_CDC_STATS_CFG_ENABLED | ENABLED IN (0, 1) | ENABLED |
| CHECK | CK_CDC_STATS_CFG_INTERVAL | SCHEDULE_INTERVAL_MINUTES BETWEEN 1 AND 1440 | ENABLED |
| CHECK | CK_CDC_STATS_CFG_START_DELAY | STARTUP_DELAY_MINUTES BETWEEN 0 AND 1440 | ENABLED |
| CHECK (NOT NULL) | SYS_C0043044 | TASK_CODE | ENABLED |
| CHECK (NOT NULL) | SYS_C0043045 | TASK_NAME | ENABLED |
| CHECK (NOT NULL) | SYS_C0043046 | ENABLED | ENABLED |
| CHECK (NOT NULL) | SYS_C0043047 | STARTUP_DELAY_MINUTES | ENABLED |
| CHECK (NOT NULL) | SYS_C0043048 | SCHEDULE_INTERVAL_MINUTES | ENABLED |
| CHECK (NOT NULL) | SYS_C0043049 | SAFETY_DELAY_MINUTES | ENABLED |
| CHECK (NOT NULL) | SYS_C0043050 | BATCH_SIZE | ENABLED |
| CHECK (NOT NULL) | SYS_C0043051 | MAX_BATCHES_PER_RUN | ENABLED |
| CHECK (NOT NULL) | SYS_C0043052 | MAX_RUN_DURATION_SECONDS | ENABLED |
| CHECK (NOT NULL) | SYS_C0043053 | CREATE_TIME | ENABLED |
| CHECK (NOT NULL) | SYS_C0043054 | UPDATE_TIME | ENABLED |

无 UNIQUE、无 FOREIGN KEY 约束。

## 4. 索引

| 名称 | 唯一性 | 类型 | 字段（顺序） | 状态 |
|---|---|---|---|---|
| PK_CDC_STATS_TASK_CONFIG | UNIQUE | NORMAL | TASK_CODE (1) | VALID |

## 5. 分区

本次核验未发现分区。

## 6. LOB

无 LOB 字段。

## 7. 触发器 / 序列 / 视图 / 依赖对象

- 触发器：本次核验未发现。
- 序列：本次核验未发现。
- 视图：本次核验未发现。
- 物理外键：无。

---

## 8. 当前代码访问入口与读写边界

| 层 | 文件 | 操作 | 读写属性 |
|---|---|---|---|
| Entity | `largescreen/stats/entity/StatsTaskConfigEntity.java` | `@TableName("CDC_STATS_TASK_CONFIG")`、`@TableId("TASK_CODE")` | — |
| Mapper | `largescreen/stats/mapper/StatsTaskConfigMapper.java` | extends BaseMapper\<StatsTaskConfigEntity\> | 只读 |
| 大屏统计 | `largescreen/stats/lifecycle/StatsTaskConfigLoader.java` | loadOnce（启动时一次性读取全部任务配置） | 只读 |

> 说明：本表为纯调度配置，应用启动时读取一次，修改后重启生效；其余大屏统计结果表（OVERVIEW/DIM/WATERMARK）的 TASK_CODE 弱逻辑引用本表 TASK_CODE（高度可信，多对一）。

---

## 9. 已知结构差异、历史兼容与待确认项

- 数据库层通过多个 CHECK 约束限定配置取值区间（批大小、批数、延迟、时长、启用标识），为写入方（人工维护）必须遵守的强约束。
- 当前应用读取侧为只读（启动时读取一次），修改后需重启生效；无热更新机制，为功能级设计约定（见大屏统计功能基线）。
- `UPDATED_BY` 为修改人标识，当前可空；是否由人工维护填写由运维约定决定（`UNVERIFIED_ASSUMPTION`，见 `DATA_PROFILE.md`）。

## 10. 文档级变更记录

| 日期 | 变更 | 依据 |
|---|---|---|
| 2026-08-26 | 建立单表物理基线（DRAFT_PENDING_USER_REVIEW） | PROJECT-DATABASE-BASELINE-001 只读核验 |
