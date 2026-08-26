# CDC_STATS_WATERMARK — 大屏统计水位表

> 文档状态：`APPROVED`
> 批准任务：PROJECT-DATABASE-BASELINE-APPROVAL-001
> 批准日期：2026-08-26
> 批准基线提交：35ca45d3fab23ac95c5fb42c6623cfb7589ce82a
> 核验时间：2026-08-26
> 数据库：Oracle 19c 开发库（192.168.174.65:1521/prod.enmotech.com）
> Schema：CDC
> 元数据来源：真实数据库只读核验（ALL_TABLES / ALL_TAB_COLUMNS / ALL_COL_COMMENTS / ALL_CONSTRAINTS / ALL_INDEXES / ALL_OBJECTS）
> 关联代码模块 / Feature：大屏统计（`largescreen/stats`）
> 数据维护方：管理平台大屏统计调度（`WatermarkCasUpdater` CAS 更新）

---

## 1. 基本信息

| 项 | 值 |
|---|---|
| 表用途 | 大屏统计水位表：按任务代码 + 日志类型（CORRECT/ERROR）保存已统计到的最后日志ID及累计处理条数，作为增量统计的断点水位 |
| 表类型 | 普通堆表（NON-PARTITIONED） |
| 主键 | `PK_CDC_STATS_WATERMARK`（`TASK_CODE`, `LOG_TYPE`） |
| 外键 | 无 |
| 分区 | 无 |
| LOB | 无 |
| 当前读写属性 | 读 + 写（CAS 乐观锁更新；大屏 API 只读） |
| 表注释 | 大屏统计水位表（CORRECT/ERROR 独立水位） |
| LAST_DDL_TIME | 2026-08-06 |

---

## 2. 字段结构

| # | 字段名 | Oracle类型 | 字符长度 | 精度/小数 | 可空 | 默认值 | 字段注释 |
|---|---|---|---|---|---|---|---|
| 1 | TASK_CODE | VARCHAR2 | 64 | — | N | — | 任务代码 |
| 2 | LOG_TYPE | VARCHAR2 | 10 | — | N | — | 日志类型：CORRECT=正确日志 ERROR=错误日志 |
| 3 | LAST_LOG_ID | NUMBER | 19 | 19/0 | N | — | 已成功统计到的最后一条CDC_LOG_ID |
| 4 | LAST_BATCH_ID | VARCHAR2 | 64 | — | Y | — | 最后成功批次标识 |
| 5 | LAST_BATCH_TIME | DATE | 7 | — | Y | — | 最后批次完成时间 |
| 6 | TOTAL_PROCESSED | NUMBER | 20 | 20/0 | N | — | 累计已处理日志条数 |
| 7 | CREATE_TIME | DATE | 7 | — | N | — | 记录创建时间 |
| 8 | UPDATE_TIME | DATE | 7 | — | N | — | 记录最后更新时间 |

---

## 3. 约束

| 类型 | 名称 | 字段 | 状态 |
|---|---|---|---|
| PRIMARY KEY | PK_CDC_STATS_WATERMARK | TASK_CODE (1), LOG_TYPE (2) | ENABLED |
| CHECK | CK_CDC_STATS_WM_LAST_LOG_ID | LAST_LOG_ID >= 0 | ENABLED |
| CHECK | CK_CDC_STATS_WM_LOG_TYPE | LOG_TYPE IN ('CORRECT', 'ERROR') | ENABLED |
| CHECK | CK_CDC_STATS_WM_TOTAL_PROC | TOTAL_PROCESSED >= 0 | ENABLED |
| CHECK (NOT NULL) | SYS_C0043063 | TASK_CODE | ENABLED |
| CHECK (NOT NULL) | SYS_C0043064 | LOG_TYPE | ENABLED |
| CHECK (NOT NULL) | SYS_C0043065 | LAST_LOG_ID | ENABLED |
| CHECK (NOT NULL) | SYS_C0043066 | TOTAL_PROCESSED | ENABLED |
| CHECK (NOT NULL) | SYS_C0043067 | CREATE_TIME | ENABLED |
| CHECK (NOT NULL) | SYS_C0043068 | UPDATE_TIME | ENABLED |

无 UNIQUE、无 FOREIGN KEY 约束。

## 4. 索引

| 名称 | 唯一性 | 类型 | 字段（顺序） | 状态 |
|---|---|---|---|---|
| PK_CDC_STATS_WATERMARK | UNIQUE | NORMAL | TASK_CODE (1), LOG_TYPE (2) | VALID |

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
| Entity | `largescreen/stats/entity/StatsWatermarkEntity.java` | `@TableName("CDC_STATS_WATERMARK")`（无 @TableId） | — |
| Mapper | `largescreen/stats/mapper/StatsWatermarkMapper.java` | BaseMapper + @Update CAS（UPDATE ... WHERE LAST_LOG_ID=#{oldId}） | 读 + 写 |
| 算法 | `largescreen/stats/algorithm/WatermarkCasUpdater.java` | readCurrentWatermark(selectOne) + casUpdate（乐观锁） | 读 + 写 |
| 大屏统计 | `largescreen/stats/service/impl/LargeScreenServiceImpl.java` | selectWatermarks 用于 dataStatus 判定 | 只读 |

> 说明：`LAST_LOG_ID` 为已统计日志的水位（对应 CDC_LOG_CORRECT/CDC_LOG_ERROR 的 CDC_LOG_ID），写侧使用 CAS 乐观锁（携带旧值条件更新）保证并发安全；`TASK_CODE` 弱逻辑引用 CDC_STATS_TASK_CONFIG.TASK_CODE（高度可信，多对一）。

---

## 9. 已知结构差异、历史兼容与待确认项

- D06：`StatsWatermarkEntity` 无 `@TableId` 注解（复合主键 TASK_CODE + LOG_TYPE 仅在数据库层约束）；写侧使用自定义 CAS UPDATE，不依赖 MyBatis-Plus 主键逻辑。属代码侧差异，见既有映射资料。
- `LOG_TYPE` 有数据库 CHECK 约束限定 CORRECT/ERROR；水位与日志表 CDC_LOG_CORRECT/CDC_LOG_ERROR 的 CDC_LOG_ID 单调递增（雪花ID，SafeUpperIdProvider 取 MAX），为功能级业务规则，详见大屏统计功能基线。
- 一致性依赖：`TOTAL_PROCESSED` 为累计已处理日志条数，随 CAS 更新递增；`LAST_LOG_ID` 与日志表当前最大 ID 的差距反映待统计增量。

## 10. 文档级变更记录

| 日期 | 变更 | 依据 |
|---|---|---|
| 2026-08-26 | 建立单表物理基线（DRAFT_PENDING_USER_REVIEW） | PROJECT-DATABASE-BASELINE-001 只读核验 |
| 2026-08-26 | 批准：项目级数据库基线正式批准收口（APPROVED） | PROJECT-DATABASE-BASELINE-APPROVAL-001 批准 |
