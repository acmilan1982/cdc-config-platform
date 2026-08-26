# CDC_STATS_DIM_DAILY — 大屏维度每日结果表

> 文档状态：`DRAFT_PENDING_USER_REVIEW`
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
| 表用途 | 大屏维度每日结果表：按任务代码 + 维度类型 + 维度值 + 统计日期保存当日成功/错误/总条数（不保存机构名称） |
| 表类型 | 普通堆表（NON-PARTITIONED） |
| 主键 | `PK_CDC_STATS_DIM_DAILY`（`TASK_CODE`, `DIM_TYPE`, `DIM_VALUE`, `STAT_DATE`） |
| 外键 | 无 |
| 分区 | 无 |
| LOB | 无 |
| 当前读写属性 | 读 + 写（大屏统计调度写入，大屏 API 只读） |
| 表注释 | 大屏维度每日结果表（不保存机构名称） |
| LAST_DDL_TIME | 2026-08-06 |

---

## 2. 字段结构

| # | 字段名 | Oracle类型 | 字符长度 | 精度/小数 | 可空 | 默认值 | 字段注释 |
|---|---|---|---|---|---|---|---|
| 1 | TASK_CODE | VARCHAR2 | 64 | — | N | — | 任务代码 |
| 2 | DIM_TYPE | VARCHAR2 | 20 | — | N | — | 维度类型：SOURCE_DATA_SOURCE=源数据源 TARGET_DB=目标库 TABLE=同步表 |
| 3 | DIM_VALUE | VARCHAR2 | 256 | — | N | — | 维度值（数据源ID / 目标库ID / CHR(31)分隔的表组合键 / 保留值） |
| 4 | STAT_DATE | DATE | 7 | — | N | — | 统计日期（Asia/Shanghai自然日，TRUNC(COALESCE(TARGET_TIME, INSERT_TIME))） |
| 5 | SUCCESS_COUNT | NUMBER | 20 | 20/0 | N | — | 当日成功条数 |
| 6 | ERROR_COUNT | NUMBER | 20 | 20/0 | N | — | 当日错误条数 |
| 7 | TOTAL_COUNT | NUMBER | 20 | 20/0 | N | — | 当日总条数（SUCCESS_COUNT + ERROR_COUNT） |
| 8 | LAST_BATCH_ID | VARCHAR2 | 64 | — | Y | — | 最后更新批次ID |
| 9 | CREATE_TIME | DATE | 7 | — | N | — | 记录创建时间 |
| 10 | UPDATE_TIME | DATE | 7 | — | N | — | 记录最后更新时间 |

---

## 3. 约束

| 类型 | 名称 | 字段 | 状态 |
|---|---|---|---|
| PRIMARY KEY | PK_CDC_STATS_DIM_DAILY | TASK_CODE (1), DIM_TYPE (2), DIM_VALUE (3), STAT_DATE (4) | ENABLED |
| CHECK | CK_CDC_STATS_DD_CONSISTENCY | TOTAL_COUNT = SUCCESS_COUNT + ERROR_COUNT | ENABLED |
| CHECK | CK_CDC_STATS_DD_ERROR | ERROR_COUNT >= 0 | ENABLED |
| CHECK | CK_CDC_STATS_DD_SUCCESS | SUCCESS_COUNT >= 0 | ENABLED |
| CHECK | CK_CDC_STATS_DD_TOTAL | TOTAL_COUNT >= 0 | ENABLED |
| CHECK | CK_CDC_STATS_DD_TYPE | DIM_TYPE IN ('SOURCE_DATA_SOURCE', 'TARGET_DB', 'TABLE') | ENABLED |
| CHECK (NOT NULL) | SYS_C0043110 | TASK_CODE | ENABLED |
| CHECK (NOT NULL) | SYS_C0043111 | DIM_TYPE | ENABLED |
| CHECK (NOT NULL) | SYS_C0043112 | DIM_VALUE | ENABLED |
| CHECK (NOT NULL) | SYS_C0043113 | STAT_DATE | ENABLED |
| CHECK (NOT NULL) | SYS_C0043114 | SUCCESS_COUNT | ENABLED |
| CHECK (NOT NULL) | SYS_C0043115 | ERROR_COUNT | ENABLED |
| CHECK (NOT NULL) | SYS_C0043116 | TOTAL_COUNT | ENABLED |
| CHECK (NOT NULL) | SYS_C0043117 | CREATE_TIME | ENABLED |
| CHECK (NOT NULL) | SYS_C0043118 | UPDATE_TIME | ENABLED |

无 UNIQUE、无 FOREIGN KEY 约束。

## 4. 索引

| 名称 | 唯一性 | 类型 | 字段（顺序） | 状态 |
|---|---|---|---|---|
| PK_CDC_STATS_DIM_DAILY | UNIQUE | NORMAL | TASK_CODE (1), DIM_TYPE (2), DIM_VALUE (3), STAT_DATE (4) | VALID |
| IDX_CDS_DIM_DA_TYPE_DATE | NONUNIQUE | NORMAL | TASK_CODE (1), DIM_TYPE (2), STAT_DATE (3) | VALID |

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
| Entity | `largescreen/stats/entity/DimDailyEntity.java` | `@TableName("CDC_STATS_DIM_DAILY")`（无 @TableId） | — |
| Mapper | `largescreen/stats/mapper/DimDailyMapper.java` | mergeIncrement（MERGE） | 写 |
| Mapper | `largescreen/stats/mapper/LargeScreenMapper.java` | selectDimDailyByType / selectMinUpdateTime | 只读 |
| 大屏统计 | `largescreen/stats/algorithm/StatsResultWriter.java` | 调度内合并写入（与 WATERMARK 同事务） | 写 |
| 大屏统计 | `largescreen/stats/service/impl/LargeScreenServiceImpl.java` | 读取维度每日供大屏 API | 只读 |

---

## 9. 已知结构差异、历史兼容与待确认项

- D06：`DimDailyEntity` 无 `@TableId` 注解（复合主键仅在数据库层约束）；当前统计调度使用自定义 MERGE 语句写入，不依赖 MyBatis-Plus 主键逻辑。属代码侧差异，见既有映射资料。
- 本表除主键外另有普通索引 `IDX_CDS_DIM_DA_TYPE_DATE`（TASK_CODE, DIM_TYPE, STAT_DATE），为维度每日按类型/日期检索提供支持。
- `DIM_VALUE` 语义依赖 DIM_TYPE（数据源ID / 目标库ID / CHR(31)分隔表组合键 / 保留值）；`STAT_DATE` 为自然日口径，为功能级业务规则，详见大屏统计功能基线。

## 10. 文档级变更记录

| 日期 | 变更 | 依据 |
|---|---|---|
| 2026-08-26 | 建立单表物理基线（DRAFT_PENDING_USER_REVIEW） | PROJECT-DATABASE-BASELINE-001 只读核验 |
