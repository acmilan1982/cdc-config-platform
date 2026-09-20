# 正式验收 001 —— 真实库元数据与 RUN_TAG 冻结（阶段 A）

> 任务：`DATA-SOURCE-LIST-ALL-STATUS-ENABLE-DISABLE-UI-ADJUSTMENT-FORMAL-ACCEPTANCE-001`
> 依据：`§7.3`「先读取元数据再冻结命名，不得猜测长度」
> 采集方式：只读 `ALL_TAB_COLUMNS`

## 1. `CDC_DATA_SOURCE` 真实列元数据

| # | 列 | 类型 | 长度（字符） | 可空 |
|---|---|---|---|---|
| 1 | `DATA_SOURCE_ID` | VARCHAR2 | 32 | N（主键） |
| 2 | `DATA_SOURCE_ORG` | VARCHAR2 | 64 | N |
| 3 | `DATA_SOURCE_HOST` | VARCHAR2 | 64 | N |
| 4 | `DATA_SOURCE_PORT` | VARCHAR2 | 64 | N |
| 5 | `DATA_SOURCE_USER_NAME` | VARCHAR2 | 64 | N |
| 6 | `DATA_SOURCE_PASSWORD` | VARCHAR2 | 64 | N |
| 7 | `DATA_SOURCE_TYPE` | VARCHAR2 | 32 | N |
| 8 | `DATA_SOURCE_SERVICE_NAME` | VARCHAR2 | 64 | N |
| 9 | `INSERT_TIME` | DATE | — | Y |
| 10 | `UPDATE_TIME` | DATE | — | Y |
| 11 | `DELETE_TIME` | DATE | — | Y |
| 12 | `FG_ACTIVE` | VARCHAR2 | **1** | Y |
| 13 | `DATA_SOURCE_DOMAIN` | VARCHAR2 | 32 | Y |
| 14 | `DATA_SOURCE_CATEGORY` | VARCHAR2 | 30 | Y |
| 15 | `SOURCE_APP` | VARCHAR2 | 20 | Y |
| 16 | `DATA_SOURCE_NAME` | VARCHAR2 | 30 | Y |
| 17 | `DATA_SOURCE_BIZ_ATTR` | VARCHAR2 | 2000 | Y |

> 与 `DATABASE.md §1.1` 一致；`FG_ACTIVE` 为 `VARCHAR2(1)` 可空 → 非 `0`/`1` 异常值只能取**单字符**。

## 2. `CDC_DATA_SOURCE_EXTEND` 真实列元数据

| # | 列 | 类型 | 长度（字符） | 可空 |
|---|---|---|---|---|
| 1 | `DATA_SOURCE_ID` | VARCHAR2 | 32 | Y |
| 2 | `TABLE_NAMING_STRATEGY` | VARCHAR2 | 32 | Y |
| 3 | `TABLE_NAME_PREFIX` | VARCHAR2 | 128 | Y |
| 4 | `TABLE_NAME_SUFFIX` | VARCHAR2 | 128 | Y |
| 5 | `TARGET_DATA_SOURCE_ID` | VARCHAR2 | 128 | Y |

> 无主键、无唯一约束（`DATABASE.md §1.2`）。

## 3. RUN_TAG 冻结

```text
RUN_TAG = FACC001
```

- 全部任务自建主键前缀 `FACC001-`；验收开始前库内匹配数为 **0**（见 `02-preexisting-data-protection-snapshot.md §4`）。
- 命名上限核对（全部满足真实列长度）：
  - `DATA_SOURCE_ID` 最长 `FACC001-SRC-NULL` = 16 字符 ≤ 32（允许字符 `[A-Za-z0-9_-]`）；
  - `DATA_SOURCE_NAME` 最长 `FACC001目标库停用` = 14 字符 ≤ 30；
  - `DATA_SOURCE_HOST` 自建长主机 = 39 字符 ≤ 64；
  - `DATA_SOURCE_USER_NAME` 13 字符 ≤ 64、`DATA_SOURCE_SERVICE_NAME` 10 字符 ≤ 64、`DATA_SOURCE_PASSWORD` 11 字符 ≤ 64；
  - `DATA_SOURCE_CATEGORY` 取 `SOURCE`/`TARGET`（≤30）；
  - 异常值取单字符 `X`（`FG_ACTIVE` = `VARCHAR2(1)`）。
