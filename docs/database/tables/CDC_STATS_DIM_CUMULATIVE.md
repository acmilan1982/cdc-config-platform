# CDC_STATS_DIM_CUMULATIVE — 大屏维度累计结果表

> 文档状态：`APPROVED`
> 批准任务：PROJECT-DATABASE-BASELINE-APPROVAL-001
> 批准日期：2026-08-26
> 批准基线提交：35ca45d3fab23ac95c5fb42c6623cfb7589ce82a
> 核验时间：2026-08-26
> 数据库：Oracle 19c 开发库（192.168.174.65:1521/prod.enmotech.com）
> Schema：CDC
> 元数据来源：真实数据库只读核验（ALL_TABLES / ALL_TAB_COLUMNS / ALL_COL_COMMENTS / ALL_CONSTRAINTS / ALL_INDEXES / ALL_OBJECTS）
> 关联代码模块 / Feature：大屏统计（`largescreen/stats`）
> 数据维护方：管理平台大屏统计调度（`StatsResultWriter` MERGE upsert）

---

## 1. 基本信息

| 项 | 值 |
|---|---|
| 表用途 | 大屏维度累计结果表：按任务代码 + 维度类型 + 维度值保存全历史累计成功/错误/总条数（不保存机构名称） |
| 表类型 | 普通堆表（NON-PARTITIONED） |
| 主键 | `PK_CDC_STATS_DIM_CUMULATIVE`（`TASK_CODE`, `DIM_TYPE`, `DIM_VALUE`） |
| 外键 | 无 |
| 分区 | 无 |
| LOB | 无 |
| 当前读写属性 | 读 + 写（大屏统计调度写入，大屏 API 只读） |
| 表注释 | 大屏维度累计结果表（不保存机构名称） |
| LAST_DDL_TIME | 2026-08-06 |

---

## 2. 字段结构

| # | 字段名 | Oracle类型 | 字符长度 | 精度/小数 | 可空 | 默认值 | 字段注释 |
|---|---|---|---|---|---|---|---|
| 1 | TASK_CODE | VARCHAR2 | 64 | — | N | — | 任务代码 |
| 2 | DIM_TYPE | VARCHAR2 | 20 | — | N | — | 维度类型：SOURCE_DATA_SOURCE=源数据源 TARGET_DB=目标库 TABLE=同步表 |
| 3 | DIM_VALUE | VARCHAR2 | 256 | — | N | — | 维度值（数据源ID / 目标库ID / CHR(31)分隔的表组合键 / 保留值） |
| 4 | SUCCESS_COUNT | NUMBER | 20 | 20/0 | N | — | 全历史累计成功条数 |
| 5 | ERROR_COUNT | NUMBER | 20 | 20/0 | N | — | 全历史累计错误条数 |
| 6 | TOTAL_COUNT | NUMBER | 20 | 20/0 | N | — | 全历史累计总条数（SUCCESS_COUNT + ERROR_COUNT） |
| 7 | LAST_BATCH_ID | VARCHAR2 | 64 | — | Y | — | 最后更新批次ID |
| 8 | CREATE_TIME | DATE | 7 | — | N | — | 记录创建时间 |
| 9 | UPDATE_TIME | DATE | 7 | — | N | — | 记录最后更新时间 |

---

## 3. 约束

| 类型 | 名称 | 字段 | 状态 |
|---|---|---|---|
| PRIMARY KEY | PK_CDC_STATS_DIM_CUMULATIVE | TASK_CODE (1), DIM_TYPE (2), DIM_VALUE (3) | ENABLED |
| CHECK | CK_CDC_STATS_DC_CONSISTENCY | TOTAL_COUNT = SUCCESS_COUNT + ERROR_COUNT | ENABLED |
| CHECK | CK_CDC_STATS_DC_ERROR | ERROR_COUNT >= 0 | ENABLED |
| CHECK | CK_CDC_STATS_DC_SUCCESS | SUCCESS_COUNT >= 0 | ENABLED |
| CHECK | CK_CDC_STATS_DC_TOTAL | TOTAL_COUNT >= 0 | ENABLED |
| CHECK | CK_CDC_STATS_DC_TYPE | DIM_TYPE IN ('SOURCE_DATA_SOURCE', 'TARGET_DB', 'TABLE') | ENABLED |
| CHECK (NOT NULL) | SYS_C0043096 | TASK_CODE | ENABLED |
| CHECK (NOT NULL) | SYS_C0043097 | DIM_TYPE | ENABLED |
| CHECK (NOT NULL) | SYS_C0043098 | DIM_VALUE | ENABLED |
| CHECK (NOT NULL) | SYS_C0043099 | SUCCESS_COUNT | ENABLED |
| CHECK (NOT NULL) | SYS_C0043100 | ERROR_COUNT | ENABLED |
| CHECK (NOT NULL) | SYS_C0043101 | TOTAL_COUNT | ENABLED |
| CHECK (NOT NULL) | SYS_C0043102 | CREATE_TIME | ENABLED |
| CHECK (NOT NULL) | SYS_C0043103 | UPDATE_TIME | ENABLED |

无 UNIQUE、无 FOREIGN KEY 约束。

## 4. 索引

| 名称 | 唯一性 | 类型 | 字段（顺序） | 状态 |
|---|---|---|---|---|
| PK_CDC_STATS_DIM_CUMULATIVE | UNIQUE | NORMAL | TASK_CODE (1), DIM_TYPE (2), DIM_VALUE (3) | VALID |

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
| Entity | `largescreen/stats/entity/DimCumulativeEntity.java` | `@TableName("CDC_STATS_DIM_CUMULATIVE")`（无 @TableId） | — |
| Mapper | `largescreen/stats/mapper/DimCumulativeMapper.java` | mergeIncrement（MERGE） | 写 |
| Mapper | `largescreen/stats/mapper/LargeScreenMapper.java` | selectDimCumulativeByType / selectTop10* / selectMinUpdateTime | 只读 |
| 大屏统计 | `largescreen/stats/algorithm/StatsResultWriter.java` | 调度内合并写入（与 WATERMARK 同事务） | 写 |
| 大屏统计 | `largescreen/stats/service/impl/LargeScreenServiceImpl.java` | 读取维度累计供大屏 API | 只读 |

---

## 9. 已知结构差异、历史兼容与待确认项

- D06：`DimCumulativeEntity` 无 `@TableId` 注解（复合主键仅在数据库层约束）；当前统计调度使用自定义 MERGE 语句写入，不依赖 MyBatis-Plus 主键逻辑。属代码侧差异，见既有映射资料。
- `DIM_VALUE` 语义依赖 DIM_TYPE（数据源ID / 目标库ID / CHR(31)分隔表组合键 / 保留值），`CHR(31)` 为组合键分隔符，为功能级业务规则，详见大屏统计功能基线。
- `DIM_TYPE` 有数据库 CHECK 约束限定取值；`DIM_VALUE` 弱逻辑引用 CDC_DATA_SOURCE.DATA_SOURCE_ID（SOURCE_DATA_SOURCE 维度时）。

## 10. 文档级变更记录

| 日期 | 变更 | 依据 |
|---|---|---|
| 2026-08-26 | 建立单表物理基线（DRAFT_PENDING_USER_REVIEW） | PROJECT-DATABASE-BASELINE-001 只读核验 |
| 2026-08-26 | 批准：项目级数据库基线正式批准收口（APPROVED） | PROJECT-DATABASE-BASELINE-APPROVAL-001 批准 |
