# 正式验收 001 —— 既有数据保护快照（阶段 A，验收开始前）

> 任务：`DATA-SOURCE-LIST-ALL-STATUS-ENABLE-DISABLE-UI-ADJUSTMENT-FORMAL-ACCEPTANCE-001`
> 口径：`DATABASE.md §1` 两张已批准物理表 + 只读关联表
> 连接：`CLAUDE.md §11` 已授权 Oracle 19c 开发库（`CDC` Schema）
> 采集方式：**只读 `SELECT`**，未执行任何 DML/DDL
> 采集时间：2026-09-20（阶段 A，任何写操作之前）

## 1. `CDC_DATA_SOURCE`

| 指标 | 值 |
|---|---|
| 总行数 | **34** |
| 不同 `DATA_SOURCE_ID` 数 | **34**（主键唯一，无重复） |
| `FG_ACTIVE` 分布 | `'0'`=**19**、`'1'`=**15**、`NULL`=**0**、其他非 `0`/`1`=**0** |
| `DATA_SOURCE_CATEGORY` 分布 | `SOURCE`=17、`source`=4、`TARGET`=1、`target`=11、`NULL`=1（存量大小写混用，与方法一致） |
| 主键集合有序摘要 | `SHA256(LISTAGG(DATA_SOURCE_ID ORDER BY DATA_SOURCE_ID))` = `B423922DBB14932CB492A1B4B83F9DAEEE22085B0BED2C58D15B968DE3972830` |
| 非敏感内容摘要 | `SHA256(LISTAGG(ID#NAME#CATEGORY#TYPE#HOST#PORT#USER_NAME#SERVICE_NAME#FG_ACTIVE ORDER BY ID))` = `371FC202A0ECC112CBFDEC4E1781536FEB4F5EB3A48B73B896896709E2F76B03` |
| 主机长度画像 | 最短 11、最长 **15**（存量无“较长主机”样本，`DS-AC-145` 需任务自建长主机记录） |

> 摘要口径：`DATA_SOURCE_PASSWORD`、`DATA_SOURCE_ORG`、`DATA_SOURCE_BIZ_ATTR`、`DATA_SOURCE_DOMAIN`、`SOURCE_APP`、时间字段**不纳入**内容摘要（敏感或与验收无关），仅在行数/主键摘要层面保护。

## 2. `CDC_DATA_SOURCE_EXTEND`

| 指标 | 值 |
|---|---|
| 总行数 | **10** |
| 不同逻辑键 `(DATA_SOURCE_ID, TARGET_DATA_SOURCE_ID)` 数 | **8** |
| 逻辑键摘要 | `SHA256(LISTAGG(DATA_SOURCE_ID##TARGET_DATA_SOURCE_ID ORDER BY ...))` = `D05A6E6F7EB0181F79148C7F5814E14CF9EC418D04D4A2B2021B9388E88CF213` |
| 存量多条异常（只读记录，**不清理**） | `DATA_SOURCE_ID='199-source'` 且 `TARGET_DATA_SOURCE_ID` 为 `NULL`，共 **3** 行（`DATABASE.md §3`/`DS-REQ-066`：存量不清理） |

## 3. 只读关联表行数（回归对比基线）

| 表 | 行数 |
|---|---|
| `CDC_CLIENT_MULTIPLE` | 16 |
| `CDC_DATA_SUBSCRIBE` | 12 |
| `CDC_DATA_SOURCE_RUN_STATE` | 30 |
| `CDC_DATA_SOURCE_SCN` | 0 |
| `CDC_PROBE` | 1 |
| `CDC_CLIENT` | 7 |

## 4. 任务自建记录清单（阶段 A 事实：为空）

| 检查 | 结果 |
|---|---|
| `CDC_DATA_SOURCE` 中 `DATA_SOURCE_ID LIKE 'FACC001%'` | **0** |
| `CDC_DATA_SOURCE_EXTEND` 中 `DATA_SOURCE_ID LIKE 'FACC001%' OR TARGET_DATA_SOURCE_ID LIKE 'FACC001%'` | **0** |

即：`RUN_TAG=FACC001` 在验收开始前**未被占用**，本任务尚未创建任何记录。

## 5. 验收结束后必须复现的口径

1. 重复本文 §1~§3 全部查询；
2. 证明 `CDC_DATA_SOURCE` 与 `CDC_DATA_SOURCE_EXTEND` 在**排除本任务 `FACC001%` 记录后**的行数、主键摘要、内容摘要与本文**完全一致**；
3. 证明 §3 各关联表行数与本文一致；
4. 证明 `FACC001%` 残留计数为 **0**。
