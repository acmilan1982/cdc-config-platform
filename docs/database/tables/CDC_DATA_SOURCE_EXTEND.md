# CDC_DATA_SOURCE_EXTEND — 数据源扩展配置表

> 文档状态：`DRAFT_PENDING_USER_REVIEW`
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
| 表用途 | 数据源扩展配置（目标表命名策略：前缀/后缀/合并策略） |
| 表类型 | 普通堆表（NON-PARTITIONED） |
| 主键 | 无（目标规则为与 CDC_DATA_SOURCE 1:1，当前无数据库级约束） |
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

---

## 3. 约束

本次核验未发现任何约束（无 PRIMARY KEY、UNIQUE、CHECK、FOREIGN KEY）。该差异对应既有映射资料中的 D02（EXTEND 无约束，高严重度）。

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

> 说明：代码面对多条扩展记录时使用 `ROWNUM=1` 取第一条，结果不确定；容错策略由后续数据源管理功能任务决定。

---

## 9. 已知结构差异、历史兼容与待决策项

- D02：该表无主键、无唯一约束、无索引（当前物理事实）。目标规则为“每个数据源应有且仅有一条扩展配置（一对一必填）”，当前物理结构未强制；是否增加唯一约束属 `PENDING_DECISION`（候选物理设计，未经正式批准，不承诺实施或排期）。
- 当前开发库存在人工构造的容错测试场景：重复 DATA_SOURCE_ID（同一 ID 3 行）、孤立记录（引用不到 CDC_DATA_SOURCE）、缺失扩展记录（部分数据源无扩展行）。属测试构造数据，不固化为正常业务基数（见 `DATA_PROFILE.md`）。
- `TARGET_DATA_SOURCE_ID`（列 5）：字段含义已由项目负责人 2026-08-26 确认——业务语义为目标库（DATA_SOURCE_CATEGORY='TARGET'），为无物理外键、无类别约束的单值弱逻辑引用（见 `RELATIONS.md` R15）。当前代码 Entity 未映射该字段、无代码级 JOIN；引用方代码须兼容目标缺失、停用或类别不符等引用情况，容错由业务代码负责。

## 10. 文档级变更记录

| 日期 | 变更 | 依据 |
|---|---|---|
| 2026-08-26 | 建立单表物理基线（DRAFT_PENDING_USER_REVIEW） | PROJECT-DATABASE-BASELINE-001 只读核验 |
| 2026-08-26 | R1：TARGET_DATA_SOURCE_ID 含义确认（R15）；删除“含义待确认”；D02 状态改为 PENDING_DECISION | PROJECT-DATABASE-BASELINE-001-R1 修订 |
