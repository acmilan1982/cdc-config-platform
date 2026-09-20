# 02 — 既有数据保护快照（任何写入之前）

> 任务：`DATA-SOURCE-CREATE-EDIT-TIME-SORT-FORM-UI-ADJUSTMENT-FORMAL-ACCEPTANCE-001`
> 采集方式：**只读 `SELECT`**，未执行任何 DML/DDL
> 采集时点：2026-09-20（本机 17:06，任何写入之前）
> 连接：`CLAUDE.md §11` 已授权 Oracle 19c 开发库（`CDC` Schema，`192.168.174.65:1521/prod.enmotech.com`）

## 1. `CDC_DATA_SOURCE`

| 指标 | 值 |
|---|---|
| 总行数 | **36**（**按实际记录，不预设为 34**） |
| 不同 `DATA_SOURCE_ID` 数 | **36**（主键唯一） |
| `FG_ACTIVE` 分布 | `'0'`=**19**、`'1'`=**17**、`NULL`=**0**、其他非 `0`/`1`=**0** |
| `DATA_SOURCE_CATEGORY` 分布 | `SOURCE`=18、`source`=4、`TARGET`=2、`target`=11、`NULL`=1（存量大小写混用） |
| `INSERT_TIME IS NULL` | **0** |
| `UPDATE_TIME IS NULL` | **10** |
| 两者同时 `NULL` | **0** |

## 2. `CDC_DATA_SOURCE_EXTEND`

| 指标 | 值 |
|---|---|
| 总行数 | **10** |
| 列结构 | `DATA_SOURCE_ID, TABLE_NAMING_STRATEGY, TABLE_NAME_PREFIX, TABLE_NAME_SUFFIX, TARGET_DATA_SOURCE_ID`（5 列，均可空） |

## 3. 只读关联表行数（回归对比基线）

| 表 | 行数 |
|---|---|
| `CDC_CLIENT_MULTIPLE` | 16 |
| `CDC_DATA_SUBSCRIBE` | 12 |
| `CDC_DATA_SOURCE_RUN_STATE` | 30 |
| `CDC_DATA_SOURCE_SCN` | 0 |
| `CDC_PROBE` | 1 |
| `CDC_CLIENT` | 7 |

这些表本任务**从不写入**，仅作只读快照。

## 4. 规范化快照与 SHA-256（可复现口径）

### 4.1 规范化规则（**长度安全**，不依赖 `LISTAGG` 4000 字节上限）

- 按主键稳定排序：`CDC_DATA_SOURCE` 按 `DATA_SOURCE_ID`；`CDC_DATA_SOURCE_EXTEND` 按 `(DATA_SOURCE_ID, TARGET_DATA_SOURCE_ID, TABLE_NAMING_STRATEGY, TABLE_NAME_PREFIX, TABLE_NAME_SUFFIX)`。
- **显式日期格式**：`TO_CHAR(<date>, 'YYYY-MM-DD HH24:MI:SS')`。
- **显式 NULL 标记**：`NVL(<col>, '\N')`；`BIZ_ATTR` 内的 `CR`/`LF` 显式转义为 `\r`/`\n` 以保证行边界稳定。
- 覆盖**全部业务列**（17 列主表 / 5 列延伸表，含密码列）。
- 逐行规范化串 → `RAWTOHEX(STANDARD_HASH(<串>, 'SHA256'))`；两列导出文件为其有序拼接。

### 4.2 快照文件 SHA-256（依据 A）

| 文件 | 行数 | SHA-256 |
|---|---|---|
| `main-norm.tsv`（`CDC_DATA_SOURCE` 全列规范化，TAB 分隔） | 36 | `4d03107b1ec39a0ea7c4ee2d4e2fb8710670c2309610c417ce4b0e767ad6be0e` |
| `ext-norm.tsv`（`CDC_DATA_SOURCE_EXTEND` 全列规范化） | 10 | `a377a6bf22c14458137c79527c4de88f86e4ceb802b3c7c9fd8cdc66c66fd78d` |
| `main-rowhashes.txt`（逐行 SHA-256，主键序） | 36 | `915a1073dd3b26376477dd4702486152d726e88bef24c8041f2950056c2b09b0` |
| `ext-rowhashes.txt`（逐行 SHA-256，组合键序） | 10 | `a53fe567732ebb9f7c16e1629e0d72ed55be98bfba7658d549430b7d18da6386` |

### 4.3 依据 B（逐行哈希聚合）

`main-rowhashes.txt` 是 36 条逐行 SHA-256 的有序清单，其自身的 SHA-256（§4.2 第 3 行）即为**全表内容聚合指纹**。清理后重新导出并按同一规则重算，两者必须完全一致。

> **口径修正说明（相对上一轮验收 001）**：上一轮快照文档曾记录 `LISTAGG` 拼接后的摘要字面量，但其口径未随文档固化、事后**不可复现**（上一轮已如实报告）。本轮改用上述**逐行哈希 + 文件级 SHA-256** 口径，完全可复现、无长度上限。

### 4.4 原始文件留存

含密码列的全行导出文件**不进入 Git**，仅保留在未提交目录：

```text
/agent/cdc-temp-ds-formui-001/logs/FACC002/main-norm.tsv
/agent/cdc-temp-ds-formui-001/logs/FACC002/ext-norm.tsv
/agent/cdc-temp-ds-formui-001/logs/FACC002/main-rowhashes.txt
/agent/cdc-temp-ds-formui-001/logs/FACC002/ext-rowhashes.txt
```

仓库内只记录 SHA-256 与比对结论。

## 5. `RUN_TAG` 零碰撞检查（写入前）

| 检查 | 结果 |
|---|---|
| `CDC_DATA_SOURCE` 中 `DATA_SOURCE_ID LIKE 'FACC002%'` | **0** |
| `CDC_DATA_SOURCE_EXTEND` 中 `DATA_SOURCE_ID LIKE 'FACC002%'` 或 `TARGET_DATA_SOURCE_ID LIKE 'FACC002%'` | **0** |
| `CDC_DATA_SOURCE` 中上一轮 `FACC001%` 残留 | **0** |

即：`RUN_TAG=FACC002` 命名空间**未被占用**，本任务写入前库中不存在任何 `FACC002` 记录。

## 6. 验收结束后必须复现的口径

1. 重复 §1~§3 全部查询；
2. 用**同一查询**重新导出 §4.2 四个文件并重算 SHA-256，必须与 §4.2 **逐字节一致**；
3. 证明两个表中本任务精确白名单残留为 **0**；
4. 证明 §3 各只读关联表行数与本文一致。
