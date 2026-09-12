# DSS-AC-065 R1 阶段 A 完整 SQL 审批包

- 任务编号：`DATA-SOURCE-SNAPSHOT-STATUS-FORMAL-ACCEPTANCE-001-R1`
- 阶段：`A`（只读预检 + 完整 SQL 方案；**未执行任何 DML**）
- 目标数据库：Oracle 19c **development**（项目 `CLAUDE.md` §11 指定的开发库）
- 连接：`192.168.174.65:1521/prod.enmotech.com`
- Schema / 连接用户：`CDC`（`phaseA-identity.txt`：`CURRENT_USER=CDC`、`DB_NAME=prod`）
- **唯一写入对象**：`CDC_DATA_SOURCE_RUN_STATE`
- 独立任务前缀：`dss-fa065-r1-`
- 前置条件（只读核对，见 `phaseA-*.txt`）：
  - 三张相关表该前缀命中数 **0**；
  - 7 个目标复合主键在执行前**均不存在**（0 冲突）；
  - 表结构核对：6 列、复合主键 `PK_CDC_DS_RUN_STATE(CLIENT_ID, DATA_SOURCE_ID)`、4 个 NOT NULL 检查约束、无触发器。

## 1. 预计影响行数

| 项 | 数量 |
|---|---|
| 计划 `INSERT` 行数 | **7** |
| 计划 `DELETE` 行数 | **7**（每个精确复合主键 1 行） |
| 配置表写入 | **0**（不写 `CDC_CLIENT_MULTIPLE`、`CDC_DATA_SOURCE`） |
| DDL / TRUNCATE / UPDATE / MERGE / 匿名 PL/SQL / 存储过程 | **0** |

## 2. `INSERT` 完整方案（7 行，仅 `CDC_DATA_SOURCE_RUN_STATE`）

字段顺序：`(CLIENT_ID, DATA_SOURCE_ID, SNAPSHOT_STATUS, SNAPSHOT_LAST_SEEN_AT, SNAPSHOT_COMPLETED_AT, UPDATED_AT)`
时间字面量统一使用 `TO_DATE('<值>','YYYY-MM-DD HH24:MI:SS')`。

| # | CLIENT_ID | DATA_SOURCE_ID | SNAPSHOT_STATUS | SNAPSHOT_LAST_SEEN_AT | SNAPSHOT_COMPLETED_AT | UPDATED_AT | 场景（提示词 §7.2） |
|---|---|---|---|---|---|---|---|
| S1 | `hosp-007` | `112-source-19c` | `SNAPSHOT_COMPLETED` | `2026-09-12 20:58:00` | `2026-09-12 20:58:30` | `2026-09-12 20:58:30` | ①正常关联 → 已完成 |
| S2 | `hosp-002` | `112-source-19c` | `SNAPSHOT_FA065_UNKNOWN` | `2026-09-12 20:57:00` | `NULL` | `2026-09-12 20:57:00` | ②正常关联 → 未知状态 |
| S3 | `dss-fa065-r1-client-orphan` | `112-source-19c` | `SNAPSHOT_RUNNING` | `2026-09-12 20:56:00` | `NULL` | `2026-09-12 20:56:00` | ③孤立探针端 |
| S4 | `hosp-0061` | `dss-fa065-r1-source-orphan` | `SNAPSHOT_COMPLETED` | `2026-09-12 20:55:00` | `2026-09-12 20:55:30` | `2026-09-12 20:55:30` | ④孤立源库 |
| S5 | `CCFG-AC-R1-OFF` | `112-source-19c` | `SNAPSHOT_RUNNING` | `2026-09-12 20:54:00` | `NULL` | `2026-09-12 20:54:00` | ⑤既有停用探针配置（`FG_ACTIVE='0'`） |
| S6 | `CCFG-AC-R1-ON` | `199-source` | `SNAPSHOT_RUNNING` | `2026-09-12 20:53:00` | `NULL` | `2026-09-12 20:53:00` | ⑥既有停用源库配置（`FG_ACTIVE='0'`） |
| S7 | `hosp-012` | `company-target-doris-v4` | `SNAPSHOT_RUNNING` | `NULL` | `NULL` | `2026-09-12 20:52:00` | ⑦既有非 SOURCE 类别数据源（`category='target'`） |

- 全部 `CLIENT_ID` / `DATA_SOURCE_ID` ≤ 64 BYTE；`SNAPSHOT_STATUS` ≤ 32 BYTE；四个 NOT NULL 字段均有值。
- 随后执行 **一次 `COMMIT`** 使 7 行生效，供真实 API / 浏览器补验使用。
- 完整脚本：`insert.sql`。

## 3. 清理（恢复）完整方案（7 条精确复合主键 `DELETE`）

**禁止**使用 `LIKE` 或全表删除；每条清理使用完整 `CLIENT_ID = ? AND DATA_SOURCE_ID = ?`：

```sql
DELETE FROM CDC_DATA_SOURCE_RUN_STATE WHERE CLIENT_ID='hosp-007'                   AND DATA_SOURCE_ID='112-source-19c';
DELETE FROM CDC_DATA_SOURCE_RUN_STATE WHERE CLIENT_ID='hosp-002'                   AND DATA_SOURCE_ID='112-source-19c';
DELETE FROM CDC_DATA_SOURCE_RUN_STATE WHERE CLIENT_ID='dss-fa065-r1-client-orphan' AND DATA_SOURCE_ID='112-source-19c';
DELETE FROM CDC_DATA_SOURCE_RUN_STATE WHERE CLIENT_ID='hosp-0061'                  AND DATA_SOURCE_ID='dss-fa065-r1-source-orphan';
DELETE FROM CDC_DATA_SOURCE_RUN_STATE WHERE CLIENT_ID='CCFG-AC-R1-OFF'             AND DATA_SOURCE_ID='112-source-19c';
DELETE FROM CDC_DATA_SOURCE_RUN_STATE WHERE CLIENT_ID='CCFG-AC-R1-ON'              AND DATA_SOURCE_ID='199-source';
DELETE FROM CDC_DATA_SOURCE_RUN_STATE WHERE CLIENT_ID='hosp-012'                   AND DATA_SOURCE_ID='company-target-doris-v4';
COMMIT;
```

- 完整脚本：`delete.sql`；随后 **一次 `COMMIT`**。

## 4. 风险与缓解

| 风险 | 缓解 |
|---|---|
| 误删既有行 | 删除条件为**精确复合主键**，且执行前已核验 7 个主键**原本不存在**（`precondition` / `phaseA-*`），清理只会移除本任务插入的行 |
| 前缀冲突 | 前缀 `dss-fa065-r1-` 在三张表执行前命中 **0** |
| 误写配置表 | SQL 中**没有**任何针对 `CDC_CLIENT_MULTIPLE` / `CDC_DATA_SOURCE` 的写语句 |
| 恢复失败 | §8.3 无条件优先恢复；恢复后用**全表逐字节比较 + 行数/主键集合/状态分布/NULL 计数/内容摘要**核对；不一致即 `FAILED_DATABASE_RESTORE_MISMATCH` |
| 时间字段语义 | 使用显式 `TO_DATE` 字面量，不依赖隐式转换 |

## 5. 失败时的恢复顺序

1. 立即对 7 个精确复合主键各执行一次 `DELETE`；
2. `COMMIT`；
3. 校验前缀剩余行数 = 0、7 个主键均不存在；
4. 与任务前导出**逐字节比较**（`run_state` / `client_multiple` / `data_source`）；
5. 核对行数、主键集合、状态分布、NULL 计数、内容摘要一致；
6. 三者任一不一致 → 停线报告，不 Commit/Push。

## 6. 任务前后全表逐行比对方法

- **手段**：只读导出（`snapshot.sql`，三条 spool）→ 任务前导出存为 `database/*_before.txt`；
- **比较**：`cmp` 逐字节比较（sha256 记录），另加 `ora_hash(listagg(...))` 内容摘要与主键集合摘要；
- **字段**：`CLIENT_ID|DATA_SOURCE_ID|SNAPSHOT_STATUS|SNAPSHOT_LAST_SEEN_AT|SNAPSHOT_COMPLETED_AT|UPDATED_AT`（NULL 记 `~NULL~`），按 `CLIENT_ID, DATA_SOURCE_ID` 稳定排序；
- **脱敏**：`CDC_DATA_SOURCE` 导出**排除** `DATA_SOURCE_USER_NAME` / `DATA_SOURCE_PASSWORD` / `DATA_SOURCE_HOST` / `DATA_SOURCE_PORT` / `DATA_SERVICE_NAME` 等敏感列。
