# 03 — 数据库元数据与 `RUN_TAG`

> 任务：`DATA-SOURCE-CREATE-EDIT-TIME-SORT-FORM-UI-ADJUSTMENT-FORMAL-ACCEPTANCE-001`
> `RUN_TAG`：`FACC002`　| 采集方式：只读 `SELECT`（`ALL_TAB_COLUMNS` / `ALL_CONSTRAINTS`）
> 采集时点：2026-09-20（写入之前）

## 1. `CDC.DATA_SOURCE`（`CDC_DATA_SOURCE`）物理列

| # | 列 | 类型 | 可空 |
|---|---|---|---|
| 1 | `DATA_SOURCE_ID` | `VARCHAR2(32)` | N |
| 2 | `DATA_SOURCE_ORG` | `VARCHAR2(64)` | N |
| 3 | `DATA_SOURCE_HOST` | `VARCHAR2(64)` | N |
| 4 | `DATA_SOURCE_PORT` | `VARCHAR2(64)` | N |
| 5 | `DATA_SOURCE_USER_NAME` | `VARCHAR2(64)` | N |
| 6 | `DATA_SOURCE_PASSWORD` | `VARCHAR2(64)` | N |
| 7 | `DATA_SOURCE_TYPE` | `VARCHAR2(32)` | N |
| 8 | `DATA_SOURCE_SERVICE_NAME` | `VARCHAR2(64)` | N |
| 9 | `INSERT_TIME` | `DATE` | Y |
| 10 | `UPDATE_TIME` | `DATE` | Y |
| 11 | `DELETE_TIME` | `DATE` | Y |
| 12 | `FG_ACTIVE` | `VARCHAR2(1)` | Y |
| 13 | `DATA_SOURCE_DOMAIN` | `VARCHAR2(32)` | Y |
| 14 | `DATA_SOURCE_CATEGORY` | `VARCHAR2(30)` | Y |
| 15 | `SOURCE_APP` | `VARCHAR2(20)` | Y |
| 16 | `DATA_SOURCE_NAME` | `VARCHAR2(30)` | Y |
| 17 | `DATA_SOURCE_BIZ_ATTR` | `VARCHAR2(2000)` | Y |

约束：`PK_CDC_DATA_SOURCE`（列 1 为主键），列 1~8 各有 `NOT NULL` 检查约束。**无** `INSERT_TIME`/`UPDATE_TIME` 默认值，**无**触发器。Oracle `DATE` **秒级**精度。

> §7 关键推论：`DATA_SOURCE_BIZ_ATTR` 上限 **2000 字节**。对 Agent 自有记录写入 **>2000** 长度的业务属性可使**同一条 UPDATE 在数据库层确定性失败**（`ORA-12899`），用于 `DS-AC-187` 的失败回滚分支；无需 DDL/触发器。

## 2. `CDC.DATA_SOURCE_EXTEND`（`CDC_DATA_SOURCE_EXTEND`）物理列

| # | 列 | 类型 | 可空 |
|---|---|---|---|
| 1 | `DATA_SOURCE_ID` | `VARCHAR2(32)` | Y |
| 2 | `TABLE_NAMING_STRATEGY` | `VARCHAR2(32)` | Y |
| 3 | `TABLE_NAME_PREFIX` | `VARCHAR2(128)` | Y |
| 4 | `TABLE_NAME_SUFFIX` | `VARCHAR2(128)` | Y |
| 5 | `TARGET_DATA_SOURCE_ID` | `VARCHAR2(128)` | Y |

> 该表**无**主键/唯一约束（`DATABASE.md §3`/`DS-REQ-066`：逻辑唯一由后端保存前校验承担）。删除与清理按**完整组合键**精确匹配，不使用 `LIKE` 前缀。

## 3. `RUN_TAG` 与命名空间占用

| 项 | 值 |
|---|---|
| `RUN_TAG` | `FACC002` |
| 主键命名规则 | `FACC002-…`（≤32 字符，仅 `A-Za-z0-9_-`，满足 DTO `@Pattern`） |
| 写入前 `FACC002%` 占用（主表） | **0** |
| 写入前 `FACC002%` 占用（延伸表） | **0** |
| 上一轮 `FACC001%` 残留 | **0** |

## 4. 本任务写入边界（与 §11 一致）

- 只允许写入**本任务清单内、`FACC002-` 前缀、由本 Agent 创建**的记录；
- **禁止**修改/删除/覆盖任何写入前已存在的 36 条主表记录与 10 条延伸表记录；
- **禁止** DDL、触发器、存量清洗、批量回填；
- **禁止**访问或写入 ZooKeeper、Kafka、业务源库、目标库；
- 清理只允许使用**完整主键白名单**，**禁止** `LIKE 'FACC002%'` 前缀删除。
