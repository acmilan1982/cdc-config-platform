# CDC_DATA_SOURCE_EXTEND — 源库到目标库的命名策略表

> 文档状态：`APPROVED`
> 批准任务：PROJECT-DATABASE-BASELINE-APPROVAL-001
> 批准日期：2026-08-26
> 批准基线提交：35ca45d3fab23ac95c5fb42c6623cfb7589ce82a
> 核验时间：2026-08-26
> 数据库：Oracle 19c 开发库（192.168.174.65:1521/prod.enmotech.com）
> Schema：CDC
> 元数据来源：真实数据库只读核验（ALL_TABLES / ALL_TAB_COLUMNS / ALL_COL_COMMENTS / ALL_CONSTRAINTS / ALL_INDEXES / ALL_OBJECTS）
> 关联代码模块 / Feature：数据源管理（`datasource`）
> 数据维护方：管理平台（`DataSourceServiceImpl` 随 CDC_DATA_SOURCE 联写）

---

## 1. 基本信息

| 项 | 值 |
|---|---|
| 表用途 | 源库到目标库的命名策略（目标表命名策略：前缀/后缀/合并策略）；源库 0..N，第一版由后端保存前校验逻辑联合唯一，不新增 DDL |
| 表类型 | 普通堆表（NON-PARTITIONED） |
| 主键 | 无（当前物理事实；第一版不新增主键/唯一约束/索引/DDL） |
| 外键 | 无 |
| 分区 | 无 |
| LOB | 无 |
| 当前读写属性 | 读 + 写（随 CDC_DATA_SOURCE 联写；其他模块只读） |
| 表注释 | 无 |
| LAST_DDL_TIME | 2026-07-14 14:12:16 |

---

## 2. 字段结构

| # | 字段名 | Oracle类型 | 字符长度 | 精度/小数 | 可空 | 默认值 | 字段注释 |
|---|---|---|---|---|---|---|---|
| 1 | DATA_SOURCE_ID | VARCHAR2 | 32 | — | Y | — | 数据源id，对应 CDC_DATA_SOURCE 表的 DATA_SOURCE_ID，原则上与 CDC_DATA_SOURCE 表记录一对一 |
| 2 | TABLE_NAMING_STRATEGY | VARCHAR2 | 32 | — | Y | — | 当前业务库在目标库表的命名策略 |
| 3 | TABLE_NAME_PREFIX | VARCHAR2 | 128 | — | Y | — | 目标表的前缀 |
| 4 | TABLE_NAME_SUFFIX | VARCHAR2 | 128 | — | Y | — | 目标表的后缀 |
| 5 | TARGET_DATA_SOURCE_ID | VARCHAR2 | 128 | — | Y | — | （无数据库注释；字段含义已确认，见 §9） |

> 备注：列 5 `TARGET_DATA_SOURCE_ID` 为本次核验新增发现的字段；既有 `docs/database/table-detail.md`（2026-07-03 快照）仅记录 4 列，且当前代码 `DataSourceExtend` 实体也未映射该列。字段含义已由项目负责人 2026-08-26 确认（目标库弱逻辑引用，见 `RELATIONS.md` R15），详见 §9。

> 批准业务语义（不是数据库注释）：`CDC_DATA_SOURCE_EXTEND` 为源库到目标库的命名策略；`DATA_SOURCE_ID` 表示源库，一个源库可有 0..N 条策略；`TARGET_DATA_SOURCE_ID` 表示业务必填目标库，一个目标库可被多个源库策略引用。`DATA_SOURCE_ID` 字段的数据库原注释“原则上与 CDC_DATA_SOURCE 表记录一对一”为旧表注释/旧意图，不代表已批准规则；`(DATA_SOURCE_ID, TARGET_DATA_SOURCE_ID)` 为逻辑联合唯一组合，第一版仅由后端保存前查询校验，数据库不新增主键/唯一约束/索引/DDL。见 `docs/features/data-source-management/REQUIREMENTS.md`。

---

## 3. 约束

本次核验未发现任何约束（无 PRIMARY KEY、UNIQUE、CHECK、FOREIGN KEY）。这是当前物理事实；已批准第一版明确不新增主键、唯一约束、索引或任何 DDL（原映射资料 D02“EXTEND 无约束，高严重度”不再作为“一对一未约束”的缺陷，见 §9）。

## 4. 索引

本次核验未发现任何索引。

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
| Entity | `datasource/entity/DataSourceExtend.java` | `@TableName("CDC_DATA_SOURCE_EXTEND")`（无 @TableId，映射 4 列，未映射 TARGET_DATA_SOURCE_ID） | — |
| Mapper | `datasource/mapper/DataSourceExtendMapper.java` | extends BaseMapper\<DataSourceExtend\> | CRUD |
| Service | `datasource/service/impl/DataSourceServiceImpl.java` | findExtend（selectOne + `ROWNUM=1`）、create/update/delete 时联写 | 读 + 写 |

> 说明：以上为**当前旧代码访问事实**，尚未满足已批准源库 0..N 命名策略目标：代码面对多条策略记录时使用 `ROWNUM=1` 取第一条、Entity 未映射 `TARGET_DATA_SOURCE_ID`、create/update/delete 双表联写。改造由数据源管理 Feature 后续设计/实现任务决定（实现状态 `NOT_STARTED`）。

---

## 9. 已知结构差异、历史兼容与待决策项

- D02：该表无主键、无唯一约束、无索引（当前物理事实）。已批准第一版明确不新增主键、唯一约束、索引或任何 DDL；`(DATA_SOURCE_ID, TARGET_DATA_SOURCE_ID)` 逻辑联合唯一由未来后端保存前查询校验。原“是否增加唯一约束”属 R01 `PENDING_DECISION`，已由已批准数据源管理 Feature 基线关闭，不再作为“一对一未约束”的待决策缺陷。
- 数据快照解释（开发库 2026-08-26 瞬时观测）：同一 `DATA_SOURCE_ID` 多行（同 ID 3 行）在源库 0..N 规则下不必然异常；孤立记录（引用不到 `CDC_DATA_SOURCE`）与空/缺失目标仍由应用层按已批准规则处理（目标库业务必填，目标库选择仅来自 `FG_ACTIVE='1' AND DATA_SOURCE_CATEGORY='TARGET'`）；存量异常数据第一版不清洗。上述均属人工构造容错测试场景，不固化为正常业务基数（见 `DATA_PROFILE.md`）。
- `TARGET_DATA_SOURCE_ID`（列 5）：字段含义已由项目负责人 2026-08-26 确认——业务语义为目标库（DATA_SOURCE_CATEGORY='TARGET'），为无物理外键、无类别约束的目标库弱逻辑引用（见 `RELATIONS.md` R15）。业务上每条策略的目标库必填，但数据库字段仍物理可空。当前代码 Entity 未映射该字段、无代码级 JOIN；引用方代码须兼容目标缺失、停用或类别不符等引用情况，容错由业务代码负责。

## 10. 文档级变更记录

| 日期 | 变更 | 依据 |
|---|---|---|
| 2026-08-26 | 建立单表物理基线（DRAFT_PENDING_USER_REVIEW） | PROJECT-DATABASE-BASELINE-001 只读核验 |
| 2026-08-26 | R1：TARGET_DATA_SOURCE_ID 含义确认（R15）；删除“含义待确认”；D02 状态改为 PENDING_DECISION | PROJECT-DATABASE-BASELINE-001-R1 修订 |
| 2026-08-26 | 批准：项目级数据库基线正式批准收口（APPROVED） | PROJECT-DATABASE-BASELINE-APPROVAL-001 批准 |
| 2026-08-29 | 已批准数据源管理 Feature 规则同步：文档业务名称与表用途更新为“源库到目标库的命名策略”（源库 0..N）；移除“目标规则为与 CDC_DATA_SOURCE 1:1”描述；字段数据库原注释保留，另增“批准业务语义”说明；D02 调整为“无约束为当前物理事实、第一版不新增 DDL、逻辑联合唯一由后端保存前校验”，不再作为“一对一未约束”待决策缺陷；§8 旧访问事实保留并标注未满足批准目标；数据快照按 0..N 规则正确解释；主键/约束/索引/字段结构物理事实不变 | DATA-SOURCE-BASELINE-IMPACT-ALIGNMENT-001（已批准业务规则向权威数据库基线同步；纯文档任务，数据库物理结构无变化） |
