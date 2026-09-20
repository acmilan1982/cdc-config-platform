# 04 — 精确写入计划（`RUN_TAG=FACC002`）与零碰撞证据

> 任务：`DATA-SOURCE-CREATE-EDIT-TIME-SORT-FORM-UI-ADJUSTMENT-FORMAL-ACCEPTANCE-001`
> 分支 `develop`，工作树 `/agent/cdc-temp-ds-formui-formal-001` @ `db1cfda7c8e10ddd5faa2a119e7550059a687d05`
> 本文件在**任何 DML 之前**固化。授权：项目负责人已明确授权 Agent 对数据库读写，**仅限本 Agent 自行创建的数据**。

## 1. 写入前零碰撞核验（只读，已执行）

| 检查 | SQL | 结果 |
|---|---|---|
| 主表 `FACC002` 命名空间 | `SELECT COUNT(*) FROM CDC_DATA_SOURCE WHERE DATA_SOURCE_ID LIKE 'FACC002%'` | **0** |
| 延伸表 `FACC002` 命名空间 | `SELECT COUNT(*) FROM CDC_DATA_SOURCE_EXTEND WHERE DATA_SOURCE_ID LIKE 'FACC002%' OR TARGET_DATA_SOURCE_ID LIKE 'FACC002%'` | **0** |
| 上一轮 `FACC001` 残留 | `SELECT COUNT(*) FROM CDC_DATA_SOURCE WHERE DATA_SOURCE_ID LIKE 'FACC001%'` | **0** |
| 计划排序用时间戳 `2026-09-19 08:00:00` 是否已被既有行占用（`UPDATE_TIME`） | `SELECT COUNT(*) FROM CDC_DATA_SOURCE WHERE UPDATE_TIME = TO_DATE('2026-09-19 08:00:00','YYYY-MM-DD HH24:MI:SS')` | **0** |
| 既有存量基线 | `CDC_DATA_SOURCE`=36 行、`CDC_DATA_SOURCE_EXTEND`=10 行（详见 `02-preexisting-data-protection-snapshot.md`） | 已固化 |

> 结论：13 个计划主键**全部不存在**，允许进入写入阶段。若执行时发现任一计划主键已存在，立即停止并报告 `BLOCKED`。

## 2. 受控数据清单（13 个主键，白名单唯一来源）

### 2.1 必须经真实「新增」流程创建（7 条）

| # | 主键 | 创建通道 | 用途用例 |
|---|---|---|---|
| 1 | `FACC002-SRC-NEW` | 真实 HTTP `POST /api/data-sources` | `DS-AC-183`、`DS-AC-184` |
| 2 | `FACC002-SRC-EN1` | 真实 HTTP `POST /api/data-sources` | `DS-AC-185`（幂等 enable） |
| 3 | `FACC002-SRC-DIS1` | 真实 HTTP `POST /api/data-sources` | `DS-AC-186`（非幂等 disable） |
| 4 | `FACC002-TGT-BIZ` | 真实 HTTP `POST /api/data-sources` | `DS-AC-187`（业务属性成功/失败） |
| 5 | `FACC002-SRC-NAME` | 真实 HTTP `POST /api/data-sources` | `DS-AC-188`（命名策略，源） |
| 6 | `FACC002-TGT-NAME` | 真实 HTTP `POST /api/data-sources` | `DS-AC-188`（命名策略，目标） |
| 7 | `FACC002-UI-NEW` | **真实浏览器** `http://192.168.174.70:5173/config/data-source` 新增弹窗提交 | `DS-AC-195`、`DS-AC-196` |

新增请求体（`DataSourceCreateDTO`）统一字段，仅 `dataSourceId`/`dataSourceName`/`dataSourceCategory`/`serviceName` 随记录变化：

```json
{
  "dataSourceId": "FACC002-…",
  "dataSourceName": "FACC002-…",
  "dataSourceCategory": "SOURCE 或 TARGET",
  "dataSourceType": "ORACLE",
  "host": "127.0.0.1",
  "port": 1521,
  "userName": "facc002",
  "password": "Facc002-Pw-<短标识>",
  "serviceName": "facc002.local"
}
```

- 新增路径由 `DataSourceMapper.insertWithSysdate` 显式写入 `INSERT_TIME = SYSDATE, UPDATE_TIME = SYSDATE`（**同一条 INSERT**），新增后 `FG_ACTIVE = '1'`。
- 记录仅写库，**不建立真实连接**（`test-connection` 是独立端点，本计划不调用）。

### 2.2 需精确预置状态的记录（6 条，**一个受控事务**）

| # | 主键 | `FG_ACTIVE` | `INSERT_TIME` | `UPDATE_TIME` | 用途用例 |
|---|---|---|---|---|---|
| 8 | `FACC002-SRC-EN0` | `'0'` | `2026-09-19 07:30:00` | `2026-09-19 08:00:00` | `DS-AC-185`（非幂等 enable） |
| 9 | `FACC002-SRC-DIS0` | `'0'` | `2026-09-19 07:45:00` | `2026-09-19 08:00:00` | `DS-AC-186`（幂等 disable，**零 DML**，时间用于排序证据） |
| 10 | `FACC002-SRC-BAD` | `NULL`（异常态） | `2026-09-19 07:50:00` | `2026-09-19 08:00:00` | `DS-AC-186`（异常态归一化 disable） |
| 11 | `FACC002-SORT-NULL` | `'1'` | `NULL` | `NULL` | `DS-AC-189`、`DS-AC-190`（NULLS LAST） |
| 12 | `FACC002-SORT-A` | `'1'` | `2026-09-19 08:00:00` | `2026-09-19 08:00:00` | `DS-AC-189`、`DS-AC-191` |
| 13 | `FACC002-SORT-B` | `'1'` | `2026-09-19 08:00:00` | `2026-09-19 08:00:00` | `DS-AC-189`、`DS-AC-191` |

**三键排序证据设计**（全部落在 §2.2 且运行期间不会被其他用例改动）：
`ORDER BY UPDATE_TIME DESC NULLS LAST, INSERT_TIME DESC NULLS LAST, DATA_SOURCE_ID ASC`

| 期望相对次序 | 行 | 生效键 |
|---|---|---|
| 1 | `FACC002-SORT-A` | 键3（与 B 完全同时刻 → `DATA_SOURCE_ID ASC`） |
| 2 | `FACC002-SORT-B` | 键3 |
| 3 | `FACC002-SRC-DIS0` | 键2（`UPDATE_TIME` 与 A/B 相同、`INSERT_TIME` 更早 → `DESC`） |
| 末位 | `FACC002-SORT-NULL` | 键1（`UPDATE_TIME IS NULL` → `NULLS LAST`） |

- `FACC002-SRC-DIS0` 在 `DS-AC-186` 中走**幂等 disable（零 DML）**，其时间在全程保持不变，因此排序证据在流程任意时点均可复核。
- `2026-09-19 08:00:00` 已被核验为既有 36 行中**不存在**的时间戳（§1），不会与存量行产生并列交叉。

预置 INSERT（**一个受控事务**，只写白名单 6 个主键）：

```sql
INSERT INTO CDC_DATA_SOURCE
  (DATA_SOURCE_ID, DATA_SOURCE_ORG, DATA_SOURCE_HOST, DATA_SOURCE_PORT,
   DATA_SOURCE_USER_NAME, DATA_SOURCE_PASSWORD, DATA_SOURCE_TYPE, DATA_SOURCE_SERVICE_NAME,
   DATA_SOURCE_NAME, DATA_SOURCE_CATEGORY, FG_ACTIVE, INSERT_TIME, UPDATE_TIME)
VALUES
  ('FACC002-SRC-EN0','facc002','127.0.0.1','1521','facc002','Facc002-Pw-<短标识>','ORACLE','facc002-en0.local',
   'FACC002-SRC-EN0','SOURCE','0',
   TO_DATE('2026-09-19 07:30:00','YYYY-MM-DD HH24:MI:SS'), TO_DATE('2026-09-19 08:00:00','YYYY-MM-DD HH24:MI:SS'));
-- 其余 5 条同构，仅列值不同（见 §2.2 表）
```

> `DATA_SOURCE_ORG/PORT` 为 `VARCHAR2`，`'1521'` 以字符串写入（与既有 `VARCHAR2(64)` 列类型一致）。
> `FACC002-SORT-NULL` 的两列显式为 `NULL`（不写默认值），以构造 `NULLS LAST` 证据。

### 2.3 延伸表（`CDC_DATA_SOURCE_EXTEND`）

本任务延伸表**只允许**出现下列唯一组合，且**不预置**，由 `DS-AC-188` 经真实命名策略 API 产生、并在该用例内删除：

| 组合键 | 说明 |
|---|---|
| `(DATA_SOURCE_ID='FACC002-SRC-NAME', TARGET_DATA_SOURCE_ID='FACC002-TGT-NAME')` | `DS-AC-188` 期间存在，用例结束前删除 |

## 3. 预期行数

| 阶段 | `CDC_DATA_SOURCE` | `CDC_DATA_SOURCE_EXTEND` |
|---|---|---|
| 写入前（既有） | 36 | 10 |
| §2.1 新增 6 条（HTTP）后 | 42 | 10 |
| §2.1 新增 1 条（UI）后 | 43 | 10 |
| §2.2 预置 6 条后 | 49 | 10 |
| `DS-AC-188` 建立命名策略期间（峰值） | 49 | 11 |
| `DS-AC-188` 删除命名策略后 | 49 | 10 |
| `DS-AC-187` 失败回滚分支 | 不变（回滚，`UPDATE_TIME` 不变） | 10 |

## 4. 精确清理白名单（`finally` 阶段执行）

主表删除（完整主键，13 个）：

```text
FACC002-SRC-NEW, FACC002-SRC-EN0, FACC002-SRC-EN1, FACC002-SRC-DIS1, FACC002-SRC-DIS0,
FACC002-SRC-BAD, FACC002-TGT-BIZ, FACC002-SRC-NAME, FACC002-TGT-NAME,
FACC002-SORT-NULL, FACC002-SORT-A, FACC002-SORT-B, FACC002-UI-NEW
```

延伸表删除（完整组合键，1 个）：`(FACC002-SRC-NAME, FACC002-TGT-NAME)`（若存在）。

清理事务口径（`SET EXITCOMMIT OFF`）：

1. 同一事务内先统计精确白名单**当前实际数量**；
2. 先 `DELETE CDC_DATA_SOURCE_EXTEND`，再 `DELETE CDC_DATA_SOURCE`；
3. `DELETE` 影响行数必须等于删除前实际数量，否则 `ROLLBACK`；
4. 全部一致才显式 `COMMIT`；
5. **禁止** `LIKE 'FACC002%'` 前缀删除。

## 5. 禁止事项（本任务写入阶段）

- 禁止修改/删除/覆盖写入前已存在的 36 条主表记录与 10 条延伸表记录；
- 禁止 DDL、触发器、存量清洗、批量回填；
- 禁止访问或写入 ZooKeeper、Kafka、业务源库、目标库；
- 禁止 `LIKE` 前缀删除；
- 除上述 13 个主键与 1 个延伸组合键外，不写入任何其他行。
