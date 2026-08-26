# CDC_DATA_SOURCE — 数据源配置主表

> 文档状态：`APPROVED`
> 批准任务：PROJECT-DATABASE-BASELINE-APPROVAL-001
> 批准日期：2026-08-26
> 批准基线提交：35ca45d3fab23ac95c5fb42c6623cfb7589ce82a
> 核验时间：2026-08-26
> 数据库：Oracle 19c 开发库（192.168.174.65:1521/prod.enmotech.com）
> Schema：CDC
> 元数据来源：真实数据库只读核验（ALL_TABLES / ALL_TAB_COLUMNS / ALL_COL_COMMENTS / ALL_CONSTRAINTS / ALL_INDEXES / ALL_OBJECTS）
> 关联代码模块 / Feature：数据源管理（`datasource`）、Job故障监控（`monitor/jobfailure`）、大屏统计（`largescreen/stats`）、日志查询（`logquery`）
> 数据维护方：管理平台（`DataSourceServiceImpl` CRUD + 启停）

---

## 1. 基本信息

| 项 | 值 |
|---|---|
| 表用途 | 数据源配置主表，同时登记源库（SOURCE）与目标库（TARGET） |
| 表类型 | 普通堆表（NON-PARTITIONED） |
| 主键 | `PK_CDC_DATA_SOURCE`（`DATA_SOURCE_ID`） |
| 外键 | 无（本项目不使用物理外键） |
| 分区 | 无（本次核验 `ALL_TAB_PARTITIONS` 未发现） |
| LOB | 无 |
| 当前读写属性 | 读 + 写（管理平台 CRUD + 启停；其他模块只读） |
| 表注释 | 数据源，包括源库，目标库 |
| LAST_DDL_TIME | 2026-07-02 14:47:20 |

---

## 2. 字段结构

| # | 字段名 | Oracle类型 | 字符长度 | 精度/小数 | 可空 | 默认值 | 字段注释 |
|---|---|---|---|---|---|---|---|
| 1 | DATA_SOURCE_ID | VARCHAR2 | 32 | — | N | — | 主键 |
| 2 | DATA_SOURCE_ORG | VARCHAR2 | 64 | — | N | — | 数据源机构 |
| 3 | DATA_SOURCE_HOST | VARCHAR2 | 64 | — | N | — | 数据库主机名 |
| 4 | DATA_SOURCE_PORT | VARCHAR2 | 64 | — | N | — | 数据库端口 |
| 5 | DATA_SOURCE_USER_NAME | VARCHAR2 | 64 | — | N | — | 数据库用户名 |
| 6 | DATA_SOURCE_PASSWORD | VARCHAR2 | 64 | — | N | — | 数据库密码（明文，项目负责人确认不加密） |
| 7 | DATA_SOURCE_TYPE | VARCHAR2 | 32 | — | N | — | 数据库类型-目前只支持源库：oracle，目标库：mysql、doris |
| 8 | DATA_SOURCE_SERVICE_NAME | VARCHAR2 | 64 | — | N | — | 数据库服务名 |
| 9 | INSERT_TIME | DATE | 7 | — | Y | — | 插入时间 |
| 10 | UPDATE_TIME | DATE | 7 | — | Y | — | 更新时间 |
| 11 | DELETE_TIME | DATE | 7 | — | Y | — | 删除时间（软删除标记） |
| 12 | FG_ACTIVE | VARCHAR2 | 1 | — | Y | — | 是否可用标记位-删除或停用后该值为0，正常为1 |
| 13 | DATA_SOURCE_DOMAIN | VARCHAR2 | 32 | — | Y | — | 域名（项目负责人确认暂时不用） |
| 14 | DATA_SOURCE_CATEGORY | VARCHAR2 | 30 | — | Y | — | 源表还是目标表，取值 source/target，大小写都行（目标规则为统一大写，程序已做兼容） |
| 15 | SOURCE_APP | VARCHAR2 | 20 | — | Y | — | 源应用 |
| 16 | DATA_SOURCE_NAME | VARCHAR2 | 30 | — | Y | — | 数据源名称 |
| 17 | DATA_SOURCE_BIZ_ATTR | VARCHAR2 | 2000 | — | Y | — | 业务属性JSON，目前只在doris类型中生效（含 table_model/column_model/key_columns 等） |

---

## 3. 约束

| 类型 | 名称 | 字段 | 状态 |
|---|---|---|---|
| PRIMARY KEY | PK_CDC_DATA_SOURCE | DATA_SOURCE_ID | ENABLED |
| CHECK (NOT NULL) | SYS_C0041424 | DATA_SOURCE_ID | ENABLED |
| CHECK (NOT NULL) | SYS_C0041425 | DATA_SOURCE_ORG | ENABLED |
| CHECK (NOT NULL) | SYS_C0041426 | DATA_SOURCE_HOST | ENABLED |
| CHECK (NOT NULL) | SYS_C0041427 | DATA_SOURCE_PORT | ENABLED |
| CHECK (NOT NULL) | SYS_C0041428 | DATA_SOURCE_USER_NAME | ENABLED |
| CHECK (NOT NULL) | SYS_C0041429 | DATA_SOURCE_PASSWORD | ENABLED |
| CHECK (NOT NULL) | SYS_C0041430 | DATA_SOURCE_TYPE | ENABLED |
| CHECK (NOT NULL) | SYS_C0041431 | DATA_SOURCE_SERVICE_NAME | ENABLED |

无 UNIQUE、无 FOREIGN KEY 约束。

---

## 4. 索引

| 名称 | 唯一性 | 类型 | 字段（顺序） | 状态 |
|---|---|---|---|---|
| PK_CDC_DATA_SOURCE | UNIQUE | NORMAL | DATA_SOURCE_ID (1) | VALID |
| IDX_CDC_DATA_SOURCE_ID_ACTIVE | NONUNIQUE | NORMAL | DATA_SOURCE_ID (1), FG_ACTIVE (2) | VALID |
| IDX_CDC_DATA_SOURCE_NAME | NONUNIQUE | NORMAL | DATA_SOURCE_NAME (1) | VALID |
| IDX_CDC_LOG_CORRECT_ORG | NONUNIQUE | NORMAL | DATA_SOURCE_ORG (1) | VALID |
| IDX_CDS_ACTIVE | NONUNIQUE | NORMAL | FG_ACTIVE (1) | VALID |

> 说明：`IDX_CDC_LOG_CORRECT_ORG` 名为历史命名，实际建立在 `CDC_DATA_SOURCE.DATA_SOURCE_ORG` 上（非日志表）。

---

## 5. 分区

本次核验未发现分区（`ALL_TAB_PARTITIONS` 无记录，`ALL_TABLES.PARTITIONED=NO`）。

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
| Entity | `datasource/entity/DataSource.java` | `@TableName("CDC_DATA_SOURCE")`、`@TableId("DATA_SOURCE_ID")` | — |
| Mapper | `datasource/mapper/DataSourceMapper.java` | extends BaseMapper\<DataSource\> | CRUD |
| Service | `datasource/service/impl/DataSourceServiceImpl.java` | queryPage/getDetail/create/update/delete/enable/disable（含 CDC_DATA_SOURCE_EXTEND 联写） | 读 + 写 |
| Controller | `datasource/controller/DataSourceController.java` | GET/POST/PUT/DELETE `/api/data-sources` | 读 + 写 |
| Job故障监控 | `monitor/jobfailure/service/impl/JobFailureServiceImpl.java` | selectBatchIds 按 DATA_SOURCE_ID 查询名称/ORG | 只读 |
| Job故障监控 | `monitor/jobfailure/service/impl/FaultHistoryServiceImpl.java` | selectBatchIds 查询数据源信息 | 只读 |
| 大屏统计 | `largescreen/stats/service/impl/LargeScreenServiceImpl.java` | selectBatchIds / selectList | 只读 |
| 日志查询 | `logquery/mapper/LogQueryMapper.xml`（selectAllDataSources） | 全表一次读取（四列），构建名称映射与候选集 | 只读 |

---

## 9. 已知结构差异、历史兼容与待确认项

- 字段 `DATA_SOURCE_CATEGORY` 数据库注释为“取值 source/target，大小写都行”；目标规则（项目负责人确认）为统一大写 `SOURCE/TARGET`，程序层做大小写兼容。当前存量数据仍存在大小写混用（当前事实），见 `DATA_PROFILE.md`。
- 字段 `DATA_SOURCE_PASSWORD` 明文存储，项目负责人确认不加密。本基线及文档禁止输出该字段值。
- 字段 `DATA_SOURCE_DOMAIN`、`DATA_SOURCE_BIZ_ATTR`（非 doris 时）等为历史/预留字段；`DATA_SOURCE_DOMAIN` 项目负责人确认暂时不用。

## 10. 文档级变更记录

| 日期 | 变更 | 依据 |
|---|---|---|
| 2026-08-26 | 建立单表物理基线（DRAFT_PENDING_USER_REVIEW） | PROJECT-DATABASE-BASELINE-001 只读核验 |
| 2026-08-26 | 批准：项目级数据库基线正式批准收口（APPROVED） | PROJECT-DATABASE-BASELINE-APPROVAL-001 批准 |
