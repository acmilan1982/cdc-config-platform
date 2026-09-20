# 08 — 精确白名单清理与既有数据保护快照复算

任务编号：`DATA-SOURCE-LIST-ALL-STATUS-ENABLE-DISABLE-UI-ADJUSTMENT-FORMAL-ACCEPTANCE-001`
依据：`04-write-approval-list-R2.md` §6（步骤 0 只读比对 + 步骤 1 受保护清理事务）
执行时间：2026-09-20 13:45 ~ 13:50（本地）
`RUN_TAG`：`FACC001`

---

## 1. 步骤 0 —— 删除前只读白名单比对（R2 §6.1）

### 1.1 `CDC_DATA_SOURCE_EXTEND` 精确白名单

```sql
SELECT DATA_SOURCE_ID, TARGET_DATA_SOURCE_ID FROM CDC_DATA_SOURCE_EXTEND
 WHERE DATA_SOURCE_ID = 'FACC001-SRC-OFF'
   AND TARGET_DATA_SOURCE_ID IN ('FACC001-TGT-ON','FACC001-TGT-ON2');
```

实际结果（1 行，落在允许区间 0~2 内）：

```text
FACC001-SRC-OFF|FACC001-TGT-ON
```

补充审计（扩大谓词，覆盖“源或目标任一为 FACC001”的全部 EXTEND 行，确认不存在白名单外残留）：

```sql
SELECT DATA_SOURCE_ID || ' -> ' || TARGET_DATA_SOURCE_ID
  FROM CDC_DATA_SOURCE_EXTEND
 WHERE DATA_SOURCE_ID LIKE 'FACC001%' OR TARGET_DATA_SOURCE_ID LIKE 'FACC001%';
```

实际结果：仅 `FACC001-SRC-OFF -> FACC001-TGT-ON` 一行 → **白名单外 FACC001 关联记录 = 0**。

### 1.2 `CDC_DATA_SOURCE` 精确白名单

实际结果（13 行，落在允许区间 0~14 内；`FACC001-SRC-DEL` 已由 `DS-AC-161` 物理删除，故不在结果中——符合预期）：

```text
FACC001-CONC-1
FACC001-NEW182
FACC001-SM-D1
FACC001-SM-E1
FACC001-SRC-NULL
FACC001-SRC-OFF
FACC001-SRC-ON
FACC001-TGT-BAD
FACC001-TGT-OFF
FACC001-TGT-ON
FACC001-TGT-ON2
FACC001-UI-A
FACC001-UI-B
```

### 1.3 白名单完整性反查（必须为 0）

```sql
SELECT DATA_SOURCE_ID FROM CDC_DATA_SOURCE
 WHERE DATA_SOURCE_ID LIKE 'FACC001%'
   AND DATA_SOURCE_ID NOT IN (<R2 §6 精确白名单 14 个主键>);
```

实际结果：**0 行** → 不存在创建清单外的主键。满足 R2 §6.1「出现清单外主键则禁止删除」的放行条件。

### 1.4 步骤 0 计数

| 键 | 值 |
|---|---|
| `MAIN_ALL` | 47 |
| `MAIN_FACC001_LIKE` | 13 |
| `EXT_ALL` | 11 |
| `EXT_FACC001` | 1 |

原始输出：`/tmp/fa001/audit/cleanup-step0.log`、`/tmp/fa001/audit/cleanup-ext-audit.log`

---

## 2. 步骤 1 —— 受保护清理事务（R2 §6.2，逐字执行）

执行内容为 R2 §6.2 已批准的完整 PL/SQL（`SET EXITCOMMIT OFF`；先 `SELECT COUNT(*)` 取删除前实际数量 `c_ext`/`c_main`；范围校验 `c_ext ≤ 2`、`c_main ≤ 14`；按关联依赖逆序先删 `EXTEND` 后删主表；要求 `n_ext = c_ext`、`n_main = c_main`；全部通过才 `COMMIT`，任一不符 `ROLLBACK` + `RAISE`）。

实际执行结果：

```text
PL/SQL procedure successfully completed.
```

- 无 `RAISE_APPLICATION_ERROR`（未触发 `-20021/-20022/-20023/-20024`）；
- 即：删除前实际数量在允许区间内，且**实际影响行数与删除前实际数量完全一致**；
- 事务已 `COMMIT`。

由于 §6.2 事务只在实际删除行数等于删除前实际数量时才提交，且事后残留计数为 0（§3），可推得实际影响行数：`EXTEND = 1`、主表 `= 13`。

原始输出：`/tmp/fa001/audit/cleanup-step1.log`

---

## 3. 清理后残留与行数核对

| 检查项 | 期望 | 实际 | 结论 |
|---|---|---|---|
| `CDC_DATA_SOURCE` 白名单/`FACC001%` 残留 | 0 | **0** | PASS |
| `CDC_DATA_SOURCE_EXTEND` 白名单关联残留（`DATA_SOURCE_ID LIKE 'FACC001%'`） | 0 | **0** | PASS |
| `CDC_DATA_SOURCE_EXTEND` 关联残留（`TARGET_DATA_SOURCE_ID LIKE 'FACC001%'`） | 0 | **0** | PASS |
| `CDC_DATA_SOURCE` 总行数 | 34（验收前） | **34** | PASS |
| `CDC_DATA_SOURCE_EXTEND` 总行数 | 10（验收前） | **10** | PASS |

原始输出：`/tmp/fa001/audit/counts-post-cleanup.log`

---

## 4. 既有数据保护快照复算（逐字节比对）

### 4.1 方法

验收前（2026-09-20 13:10，Phase B 任何写入之前）已用**固定查询**导出两张全行快照至本地基线文件：

```text
/tmp/fa001-baseline/main.tsv     (CDC_DATA_SOURCE，17 列，按 DATA_SOURCE_ID 排序)
/tmp/fa001-baseline/extend.tsv   (CDC_DATA_SOURCE_EXTEND，5 列，按 DATA_SOURCE_ID 排序)
```

清理后用**同一查询**重新导出并逐字节 `diff`：

```bash
sqlplus -S 'CDC/CDC@//192.168.174.65:1521/prod.enmotech.com' @dump2-main.sql
sqlplus -S 'CDC/CDC@//192.168.174.65:1521/prod.enmotech.com' @dump2-ext.sql
diff /tmp/fa001-baseline/main.tsv   /tmp/fa001/audit/main-now.tsv
diff /tmp/fa001-baseline/extend.tsv /tmp/fa001/audit/extend-now.tsv
```

### 4.2 结果

```text
MAIN DIFF: identical      （67 行，无任何差异）
EXTEND DIFF: identical    （10 行，无任何差异）
```

SHA-256（前后一致）：

| 文件 | SHA-256 |
|---|---|
| `CDC_DATA_SOURCE` 全行快照 | `bdfa619b65147018321913cec91cf121b84ecf77c701d5c710b589e455fa5a4e` |
| `CDC_DATA_SOURCE_EXTEND` 全行快照 | `7cdeebcb656a0daf6c0d56b12f81102f845c9081e6350ab25c99c980d5a7770b` |

**结论：既有 34 条主表记录与 10 条延伸表记录，逐字节与验收前完全一致（含全部字段、含未变更的时间戳与密码列）。既有数据未被修改或删除。**

说明：`main.tsv` 为 67 个物理行而主表为 34 行，原因是既有数据中 3 行的 `DATA_SOURCE_BIZ_ATTR` 字段内含换行符（JSON 多行文本），这些换行在导出中形成额外物理行；`INSTR(...,CHR(10))>0` 计数为 3 已核实。该结构在前后两次导出中完全相同，不影响逐字节一致性结论。

### 4.3 关于快照文档中“内容摘要”字面量的不可复现性（如实报告）

`02-preexisting-data-protection-snapshot.md` 记录的**主键摘要** `B423922D…2830` 与**内容摘要** `371FC202…6B03`、以及 EXTEND 摘要 `D05A6E6F…F213`，其当时的计算口径未随快照记录。本次按常见口径（`LISTAGG` 有序拼接后 `STANDARD_HASH(...,'SHA256')`）复算得到不同字面量（主键 `CD12E7A4…F099`），因此**这些字面量本身不可复现**，不作为本次一致性判定依据。

本次一致性判定改用**更强且可复现**的口径：同期基线全行导出文件 + `diff` 逐字节一致 + SHA-256 相同（§4.1/§4.2）。该口径不依赖摘要算法口径的记录，且证据文件（基线 TSV）保存在本地可复核。此差异按 §10 如实报告，不掩盖。

---

## 5. 关联只读表核对（保持不变）

| 表 | 验收前 | 清理后 | 结论 |
|---|---|---|---|
| `CDC_CLIENT_MULTIPLE` | 16 | 16 | 不变 |
| `CDC_DATA_SUBSCRIBE` | 12 | 12 | 不变 |
| `CDC_DATA_SOURCE_RUN_STATE` | 30 | 30 | 不变 |
| `CDC_DATA_SOURCE_SCN` | 0 | 0 | 不变 |
| `CDC_PROBE` | 1 | 1 | 不变 |
| `CDC_CLIENT` | 7 | 7 | 不变 |

这些表在本任务中**从未被写入**（§7.1 未授权写入），仅为只读快照。

---

## 6. `FG_ACTIVE` 分布复算

| 值 | 验收前 | 清理后 |
|---|---|---|
| `'1'` | 15 | **15** |
| `'0'` | 19 | **19** |
| `NULL` | 0 | **0** |
| 其他非 `0/1` | 0 | **0** |
| 合计 | 34 | **34** |

与 `02-preexisting-data-protection-snapshot.md` 记录的分布完全一致。

---

## 7. 清理结论

**完全清理，残留为 0，既有数据逐字节一致。**

- 删除范围严格限定 R2 §6 精确主键白名单，未使用 `LIKE` 前缀删除、未执行任何 DDL、未扩大主键白名单；
- 删除前完成只读比对，未出现清单外主键；
- 未执行任何 R2 清单外的恢复性 SQL/API（R2 §9）；
- 既有异常数据（`199-source` 的 3 行 NULL 目标关联）保持原样，未被清洗；
- 遗留（非本任务、不清理）：无。

---

## 8. 证据文件

| 文件 | 内容 |
|---|---|
| `/tmp/fa001/audit/cleanup-step0.log` | 步骤 0 只读白名单比对原始输出 |
| `/tmp/fa001/audit/cleanup-ext-audit.log` | EXTEND 全量 FACC001 关联反查 |
| `/tmp/fa001/audit/cleanup-step1.log` | 步骤 1 清理事务执行输出 |
| `/tmp/fa001/audit/counts-post-cleanup.log` | 清理后行数与 FG 分布复算 |
| `/tmp/fa001/audit/main-now.tsv`、`extend-now.tsv` | 清理后全行导出（含敏感列，仅本地留存，**未入库**） |
| `/tmp/fa001-baseline/main.tsv`、`extend.tsv` | 验收前全行基线（仅本地留存，**未入库**） |

> 依据 §11，含密码列的全行导出文件**不进入仓库**，仓库内只记录 SHA-256 与比对结论。
