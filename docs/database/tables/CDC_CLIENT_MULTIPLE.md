# CDC_CLIENT_MULTIPLE — 客户端（探针）表

> 文档状态：`DRAFT_PENDING_USER_REVIEW`
> 核验时间：2026-08-26
> 数据库：Oracle 19c 开发库（192.168.174.65:1521/prod.enmotech.com）
> Schema：CDC
> 元数据来源：真实数据库只读核验（ALL_TABLES / ALL_TAB_COLUMNS / ALL_COL_COMMENTS / ALL_CONSTRAINTS / ALL_INDEXES / ALL_OBJECTS）
> 关联代码模块 / Feature：Job故障监控（`monitor/jobfailure`）、大屏统计（`largescreen/stats`）、ZK客户端监控（`monitor/zookeeper`）
> 数据维护方：人工维护（当前管理平台仅只读；后续计划单独开发 CRUD，尚未实现）

---

## 1. 基本信息

| 项 | 值 |
|---|---|
| 表用途 | 客户端（探针）注册表；每个客户端对应一个 CDC 同步进程，在 ZooKeeper 以 `/bsoft-cdc/clients/{clientId}` 表示 |
| 表类型 | 普通堆表（NON-PARTITIONED） |
| 主键 | `PK_CDC_CLIENT_MULTIPLE`（`CLIENT_ID`） |
| 外键 | 无 |
| 分区 | 无 |
| LOB | 无 |
| 当前读写属性 | 管理平台只读、当前人工维护；后续计划单独开发 CRUD，尚未实现 |
| 表注释 | 客户端表 |
| LAST_DDL_TIME | 2026-07-03 14:15:33 |

---

## 2. 字段结构

| # | 字段名 | Oracle类型 | 字符长度 | 精度/小数 | 可空 | 默认值 | 字段注释 |
|---|---|---|---|---|---|---|---|
| 1 | CLIENT_ID | VARCHAR2 | 32 | — | N | — | 探针id |
| 2 | CLIENT_DESC | VARCHAR2 | 256 | — | Y | — | 探针描述 |
| 3 | DATA_SOURCE_ID | VARCHAR2 | 1000 | — | Y | — | 探针采集的数据源id，可以有多个id，id之间用英文逗号分隔（多值弱逻辑引用） |
| 4 | FG_ACTIVE | VARCHAR2 | 1 | — | N | — | 探针是否启用 |

---

## 3. 约束

| 类型 | 名称 | 字段 | 状态 |
|---|---|---|---|
| PRIMARY KEY | PK_CDC_CLIENT_MULTIPLE | CLIENT_ID | ENABLED |
| CHECK (NOT NULL) | SYS_C0041473 | CLIENT_ID | ENABLED |
| CHECK (NOT NULL) | SYS_C0041474 | FG_ACTIVE | ENABLED |

无 UNIQUE、无 FOREIGN KEY 约束。

## 4. 索引

| 名称 | 唯一性 | 类型 | 字段（顺序） | 状态 |
|---|---|---|---|---|
| PK_CDC_CLIENT_MULTIPLE | UNIQUE | NORMAL | CLIENT_ID (1) | VALID |

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
| Entity | `monitor/jobfailure/entity/CdcClientMultiple.java` | `@TableName("CDC_CLIENT_MULTIPLE")`、`@TableId("CLIENT_ID")` | — |
| Mapper | `monitor/jobfailure/mapper/CdcClientMultipleMapper.java` | extends BaseMapper\<CdcClientMultiple\> | 只读 |
| Job故障监控 | `monitor/jobfailure/service/impl/JobFailureServiceImpl.java` | selectList（FG_ACTIVE='1'）获取活跃客户端 | 只读 |
| Job故障监控 | `monitor/jobfailure/service/impl/FaultHistoryServiceImpl.java` | selectList（FG_ACTIVE='1'） | 只读 |
| 大屏统计 | `largescreen/stats/mapper/LargeScreenMapper.java` | selectActiveClientDataSources（FG_ACTIVE='1'） | 只读 |

> 说明：`DATA_SOURCE_ID` 为英文逗号分隔的多值弱逻辑引用，代码按逗号拆分、Trim、忽略空项，不作为普通外键处理。
>
> 边界说明：本表当前由人工维护（项目负责人 2026-08-26 确认），管理平台对 CDC_CLIENT_MULTIPLE 仅只读；后续计划为该表单独开发增删改查（CRUD）功能，当前尚未实现。代码访问入口仍按实际代码记录，只读事实不变。

---

## 9. 已知结构差异、历史兼容与待确认项

- 本项目早期白名单资料中该表曾存在重复记录（21→3 条），后经项目负责人清理并将 CLIENT_ID 设为主键（历史 DDL/DML，已在数据库发生并核验）。本次核验主键存在。
- 项目负责人确认：本表总记录数一定不会超过 20 条，为业务硬上限（`CONFIRMED_HARD_LIMIT`），见 `DATA_PROFILE.md`。

## 10. 文档级变更记录

| 日期 | 变更 | 依据 |
|---|---|---|
| 2026-08-26 | 建立单表物理基线（DRAFT_PENDING_USER_REVIEW） | PROJECT-DATABASE-BASELINE-001 只读核验 |
| 2026-08-26 | R2：数据维护方调整为人工维护（管理平台只读）；边界说明记录后续计划单独开发 CRUD、当前尚未实现 | PROJECT-DATABASE-BASELINE-001-R2 修订 |
