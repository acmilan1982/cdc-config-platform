# 07 — 清理、残留核验与存量基线复算

> 任务：`DATA-SOURCE-CREATE-EDIT-TIME-SORT-FORM-UI-ADJUSTMENT-FORMAL-ACCEPTANCE-001`　`RUN_TAG=FACC002`
> 结论：清理按**完整主键白名单**在一个事务内完成并显式 `COMMIT`；两表 `FACC002` 残留 = **0**；存量 36 + 10 条记录的规范化快照与写入前**逐字节一致**。

## 1. 清理前只读复核（`pre-cleanup-check.log`）

| 检查 | 结果 |
|---|---|
| `CDC_DATA_SOURCE` 中 `FACC002%` 实际行数 | **13** |
| 其中与 13 键精确白名单匹配的行数 | **13**（二者相等 → 不存在白名单外的 `FACC002` 行） |
| `CDC_DATA_SOURCE_EXTEND` 中 `FACC002%` 行数 | **0**（命名策略组合键已在 `DS-AC-188` 内删除） |
| 写入前已有记录 | 未被列入删除白名单，**不参与**本次清理 |

13 个实际主键：`FACC002-SORT-A`、`FACC002-SORT-B`、`FACC002-SORT-NULL`、`FACC002-SRC-BAD`、`FACC002-SRC-DIS0`、`FACC002-SRC-DIS1`、`FACC002-SRC-EN0`、`FACC002-SRC-EN1`、`FACC002-SRC-NAME`、`FACC002-SRC-NEW`、`FACC002-TGT-BIZ`、`FACC002-TGT-NAME`、`FACC002-UI-NEW`。

> 清理**未使用** `LIKE 'FACC002%'` 前缀删除；删除条件为 13 个完整主键的 `IN` 列表，延伸表为完整组合键 `(DATA_SOURCE_ID='FACC002-SRC-NAME', TARGET_DATA_SOURCE_ID='FACC002-TGT-NAME')`。

## 2. 清理事务（`cleanup.sql` / `cleanup.log`）

口径：`SET EXITCOMMIT OFF`；同一事务内先统计白名单当前实际数量 → 先删延伸表、再删主表 → 校验影响行数 → 一致才显式 `COMMIT`。

```text
EXT_BEFORE=0
MAIN_BEFORE=13
EXT_DELETED=0
MAIN_DELETED=13
DECISION=COMMIT
```

- `MAIN_DELETED(13) = MAIN_BEFORE(13)`、`EXT_DELETED(0) = EXT_BEFORE(0)` → 行数一致，`COMMIT`。
- 若任一处不一致，PL/SQL 分支会执行 `ROLLBACK` 并输出 `DECISION=ROLLBACK count mismatch`（本次未触发）。

## 3. 清理后残留核验（同一脚本尾部只读查询）

| 检查 | 结果 |
|---|---|
| `CDC_DATA_SOURCE` 中 `FACC002%` 残留 | **0** |
| `CDC_DATA_SOURCE_EXTEND` 中 `FACC002%` 残留 | **0** |
| `CDC_DATA_SOURCE` 总行数 | **36**（= 写入前基线） |
| `CDC_DATA_SOURCE_EXTEND` 总行数 | **10**（= 写入前基线） |

## 4. 存量基线复算（与写入前逐字节比对）

用**与写入前完全相同的脚本** `snap-main.sql`（同排序、同 `TO_CHAR` 日期格式、同 `NVL(…,'\N')` 空值标记、同 `RAWTOHEX(STANDARD_HASH(…,'SHA256'))` 口径）重新导出并重算：

| 文件 | 行数 | 重算 SHA-256 | 与写入前比对 |
|---|---|---|---|
| `main-norm.tsv` | 36 | `4d03107b1ec39a0ea7c4ee2d4e2fb8710670c2309610c417ce4b0e767ad6be0e` | **IDENTICAL** |
| `ext-norm.tsv` | 10 | `a377a6bf22c14458137c79527c4de88f86e4ceb802b3c7c9fd8cdc66c66fd78d` | **IDENTICAL** |
| `main-rowhashes.txt` | 36 | `915a1073dd3b26376477dd4702486152d726e88bef24c8041f2950056c2b09b0` | **IDENTICAL** |
| `ext-rowhashes.txt` | 10 | `a53fe567732ebb9f7c16e1629e0d72ed55be98bfba7658d549430b7d18da6386` | **IDENTICAL** |

> 规范化覆盖**全部业务列**（主表 17 列含密码列、延伸表 5 列），因此该比对同时证明**密码列亦未被改动**。

## 5. 存量分布复核

| 指标 | 写入前基线 | 清理后实测 | 判定 |
|---|---|---|---|
| `FG_ACTIVE='0'` | 19 | **19** | 一致 |
| `FG_ACTIVE='1'` | 17 | **17** | 一致 |
| `FG_ACTIVE` 为 `NULL` / 其他 | 0 / 0 | **0 / 0** | 一致 |
| 类别 `SOURCE/source/TARGET/target/NULL` | 18/4/2/11/1 | **18/4/2/11/1** | 一致 |
| `INSERT_TIME IS NULL` | 0 | **0** | 一致 |
| `UPDATE_TIME IS NULL` | 10 | **10** | 一致 |
| 两者同时 `NULL` | 0 | **0** | 一致 |

## 6. 只读关联表复核（本任务从不写入）

| 表 | 写入前基线 | 清理后实测 | 判定 |
|---|---|---|---|
| `CDC_CLIENT_MULTIPLE` | 16 | **16** | 一致 |
| `CDC_DATA_SUBSCRIBE` | 12 | **12** | 一致 |
| `CDC_DATA_SOURCE_RUN_STATE` | 30 | **30** | 一致 |
| `CDC_DATA_SOURCE_SCN` | 0 | **0** | 一致 |
| `CDC_PROBE` | 1 | **1** | 一致 |
| `CDC_CLIENT` | 7 | **7** | 一致 |

## 7. 意外写入/删除检查

| 检查 | 结果 |
|---|---|
| 是否修改/删除过写入前已存在的记录 | **否**（全部列级 SHA-256 比对一致） |
| 是否发生白名单外的写入 | **否**（清理前 `FACC002%` 实际行数 = 白名单行数 = 13） |
| 是否执行过 DDL / 触发器 / 存量清洗 / 批量回填 | **否**（`USER_TRIGGERS` 计数 0，索引仅既有 5 个） |
| 是否访问或写入 ZooKeeper / Kafka / 业务源库 / 目标库 | **否** |
| 失败分支是否留下部分写入 | **否**（`DS-AC-187` 超长业务属性 `ORA-12899`，整条 UPDATE 回滚） |

## 8. 原始文件留存（不入 Git）

含密码列的全量导出与运行日志均留在未提交目录：

```text
/agent/cdc-temp-ds-formui-001/logs/FACC002/           （写入前快照）
/agent/cdc-temp-ds-formui-001/logs/FACC002/recheck/   （清理后复算快照）
/agent/cdc-temp-ds-formui-001/logs/FACC002/*.log      （运行与用例日志，已被 .gitignore 覆盖）
```

仓库内只记录 SHA-256 与比对结论。
