# CDC_DATA_SUBSCRIBE — 订阅表

> 文档状态：`APPROVED`
> 批准任务：PROJECT-DATABASE-BASELINE-APPROVAL-001
> 批准日期：2026-08-26
> 批准基线提交：35ca45d3fab23ac95c5fb42c6623cfb7589ce82a
> 核验时间：2026-08-26
> 数据库：Oracle 19c 开发库（192.168.174.65:1521/prod.enmotech.com）
> Schema：CDC
> 元数据来源：真实数据库只读核验（ALL_TABLES / ALL_TAB_COLUMNS / ALL_COL_COMMENTS / ALL_CONSTRAINTS / ALL_INDEXES / ALL_OBJECTS）
> 关联代码模块 / Feature：大屏统计（`largescreen/stats`）
> 数据维护方：人工维护（当前管理平台仅只读；后续计划单独开发 CRUD，尚未实现）

---

## 1. 基本信息

| 项 | 值 |
|---|---|
| 表用途 | 订阅配置表：登记某个业务库（源库）到目标库的订阅关系，含源表清单、目标表清单、启停标志 |
| 表类型 | 普通堆表（NON-PARTITIONED） |
| 主键 | `PK_CDC_DATA_SUBSCRIBE`（`DATA_SUB_ID`，VARCHAR2(32)，NOT NULL；PRIMARY KEY、ENABLED、NOT DEFERRABLE IMMEDIATE） |
| 外键 | 无 |
| 分区 | 无 |
| LOB | 有（4 个 CLOB 字段，见 §6） |
| 当前读写属性 | 只读（大屏统计模块按 FG_ACTIVE='1' 读取）；由人工维护；后续计划单独开发 CRUD，尚未实现 |
| 表注释 | 订阅表 |
| LAST_DDL_TIME | 2026-07-14 14:12:16 |

---

## 2. 字段结构

| # | 字段名 | Oracle类型 | 字符长度 | 精度/小数 | 可空 | 默认值 | 字段注释 |
|---|---|---|---|---|---|---|---|
| 1 | DATA_SUB_ID | VARCHAR2 | 32 | — | N | — | 代理主键，程序自动生成，无任何业务含义；已为数据库真实主键（`PK_CDC_DATA_SUBSCRIBE`） |
| 2 | DATA_SUB_DESC | VARCHAR2 | 255 | — | Y | — | 订阅描述 |
| 3 | DATA_FROM_SOURCE_ID | VARCHAR2 | 1024 | — | Y | — | 源库，即业务库，对应 CDC_DATA_SOURCE 表中 DATA_SOURCE_CATEGORY=source 的记录主键，可以填多个，用英文逗号间隔 |
| 4 | DATA_TO_SOURCE_ID | VARCHAR2 | 1024 | — | Y | — | 目标库，对应 CDC_DATA_SOURCE 表中 DATA_SOURCE_CATEGORY=target 的记录主键，可以填多个，用英文逗号间隔 |
| 5 | DATA_SOURCE_TABLE | CLOB | 4000 | — | Y | — | 源库中需要同步的表，单个表格式：DATA_SOURCE_ID.schema.表名，可以填多个，用英文逗号间隔 |
| 6 | DATA_SOURCE_COMMENT | CLOB | 4000 | — | Y | — | 源库中需要同步的表注释，与 DATA_SOURCE_TABLE 对应 |
| 7 | DATA_TARGET_TABLE | CLOB | 4000 | — | Y | — | 暂时没用，可以不管 |
| 8 | DATA_TARGET_COMMENT | CLOB | 4000 | — | Y | — | 暂时没用，可以不管 |
| 9 | INSERT_TIME | DATE | 7 | — | Y | — | 当前记录的插入时间 |
| 10 | UPDATE_TIME | DATE | 7 | — | Y | — | 当前记录的更新时间 |
| 11 | DELETE_TIME | DATE | 7 | — | Y | — | 当前记录的删除时间 |
| 12 | FG_ACTIVE | VARCHAR2 | 1 | — | Y | — | 当前记录是否启用标志，0：不启用   1：启用 |

---

## 3. 约束

| 类型 | 名称 | 字段 | 状态 |
|---|---|---|---|
| PRIMARY KEY | PK_CDC_DATA_SUBSCRIBE | DATA_SUB_ID | ENABLED（NOT DEFERRABLE IMMEDIATE） |
| CHECK (NOT NULL) | SYS_C0041443 | DATA_SUB_ID | ENABLED |

无 UNIQUE（唯一性由主键隐含）、无 FOREIGN KEY 约束。原 D01（SUBSCRIBE 无主键）已关闭：`DATA_SUB_ID` 已成为数据库真实主键（主键约束 `PK_CDC_DATA_SUBSCRIBE` 于 2026-08-28 建立，2026-08-30 只读核验 `DATABASE_VERIFIED`）。

## 4. 索引

主键索引 `PK_CDC_DATA_SUBSCRIBE`（`DATA_SUB_ID`）：NORMAL、UNIQUE、VALID（表空间 USERS）。

## 5. 分区

本次核验未发现分区。

## 6. LOB

| 字段名 | LOB段 | 表空间 | CHUNK |
|---|---|---|---|
| DATA_SOURCE_TABLE | SYS_LOB0000106847C00005$$ | USERS | 8192 |
| DATA_SOURCE_COMMENT | SYS_LOB0000106847C00006$$ | USERS | 8192 |
| DATA_TARGET_TABLE | SYS_LOB0000106847C00007$$ | USERS | 8192 |
| DATA_TARGET_COMMENT | SYS_LOB0000106847C00008$$ | USERS | 8192 |

## 7. 触发器 / 序列 / 视图 / 依赖对象

- 触发器：本次核验未发现。
- 序列：本次核验未发现。
- 视图：本次核验未发现。
- 物理外键：无。

---

## 8. 当前代码访问入口与读写边界

| 层 | 文件 | 操作 | 读写属性 |
|---|---|---|---|
| Entity | `largescreen/stats/entity/DataSubscribeEntity.java` | `@TableName("CDC_DATA_SUBSCRIBE")`、`@TableId("DATA_SUB_ID")` | — |
| Mapper | `largescreen/stats/mapper/DataSubscribeMapper.java` | extends BaseMapper\<DataSubscribeEntity\> | 只读 |
| 大屏统计 | `largescreen/stats/service/impl/LargeScreenServiceImpl.java` | selectList（FG_ACTIVE='1'）获取全部活跃订阅配置用于维度映射 | 只读 |

> 说明：`DATA_FROM_SOURCE_ID`、`DATA_TO_SOURCE_ID` 为英文逗号分隔的多值弱逻辑引用，分别弱引用 CDC_DATA_SOURCE 中 category=source / category=target 的记录主键，不作为普通外键处理。

---

## 9. 已知结构差异、历史兼容与待决策项

- D01 已关闭：`DATA_SUB_ID` 已成为数据库真实主键（`PK_CDC_DATA_SUBSCRIBE`，2026-08-30 只读核验 `DATABASE_VERIFIED`）。历史资料声称 DATA_SUB_ID 主键“已验证”曾被误判为旧资料错误（P4），实际该主键已于 2026-08-28 建立；本任务定向核验确认其为当前物理事实，不再作为待决策项。
- `DATA_SOURCE_TABLE` 等 4 个 CLOB 字段在代码中如何解析（逗号拆分、表清单解析）由大屏统计模块消费；当前基线仅登记物理结构，解析规则详见对应功能基线。
- 数据维护：本表由人工维护（当前管理平台仅只读）；后续计划单独开发 CRUD，尚未实现。当前项目后端代码未发现对该表的写入口。

## 10. 文档级变更记录

| 日期 | 变更 | 依据 |
|---|---|---|
| 2026-08-26 | 建立单表物理基线（DRAFT_PENDING_USER_REVIEW） | PROJECT-DATABASE-BASELINE-001 只读核验 |
| 2026-08-26 | R1：数据维护方修订为人工维护；删除“写入方待确认”；D01 状态改为 PENDING_DECISION | PROJECT-DATABASE-BASELINE-001-R1 修订 |
| 2026-08-26 | 批准：项目级数据库基线正式批准收口（APPROVED） | PROJECT-DATABASE-BASELINE-APPROVAL-001 批准 |
| 2026-08-30 | 定向核验并修正主键物理基线：`DATA_SUB_ID` 已成为数据库真实主键（`PK_CDC_DATA_SUBSCRIBE`，PRIMARY KEY、ENABLED、NOT DEFERRABLE IMMEDIATE；唯一有效索引；LAST_DDL_TIME 2026-08-28 17:36:20）；关闭 D01；§1/§2/§3/§4 同步更新 | DATA-SUBSCRIPTION-REQUIREMENTS-BASELINE-001（只读核验 `DATABASE_VERIFIED`；纯文档基线修正，未执行任何 DDL） |
