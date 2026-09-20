# 正式验收 001 —— 写库审批清单 R1（阶段 A 修订版）

> 任务：`DATA-SOURCE-LIST-ALL-STATUS-ENABLE-DISABLE-UI-ADJUSTMENT-FORMAL-ACCEPTANCE-001`
> 阶段：A（只读准备 + 审批清单修订；**尚未执行任何写操作**）
> 状态：`WAITING_FOR_PROJECT_OWNER_DATABASE_WRITE_APPROVAL`
> 修订依据：项目负责人对本清单初版的 R1 修订要求（4 项）
> 修订时间：2026-09-20

## R1 修订摘要

| # | 初版问题 | R1 处置 |
|---|---|---|
| 1 | `FACC001-NEW182` 在初始创建与 `DS-AC-182` 中**重复创建**（重复 ID） | 初始只创建 **13** 条，**不含** `FACC001-NEW182`；该记录**只在 `DS-AC-182` 执行时**通过 `POST /api/data-sources` 创建。全任务累计创建仍为 **14**，最终主表清理仍为 **13** |
| 2 | 清理 SQL 使用 `LIKE 'FACC001%'` 前缀范围删除 | 改为**精确主键白名单** `IN (…)`；清理前先只读 `SELECT` 列出将删除的精确主键并与创建清单比对，出现清单外主键则**禁止删除并停止报告** |
| 3 | 多条写 API 缺少完整脱敏请求体 | 逐项补齐（见 §4） |
| 4 | 状态构造缺少初始状态保护与事务控制 | 三条 `UPDATE` 增加 `AND FG_ACTIVE='1'` 保护，置于**单一受控事务**；逐条核对影响行数，全部一致才 `COMMIT`，任一不一致立即 `ROLLBACK`；清理同样显式 `COMMIT`/`ROLLBACK`；**禁止依赖 SQL*Plus 会话退出的隐式提交**（`SET EXITCOMMIT OFF`） |

---

## 1. RUN_TAG 与全部拟创建主键

`RUN_TAG = FACC001`（验收开始前库内前缀匹配数为 0，见 `02-preexisting-data-protection-snapshot.md §4`）

**累计创建 14 条** = 初始 13 条 + `DS-AC-182` 创建 1 条。

## 2. 验收数据角色 → 对应 `DS-AC`（修订后）

### 2.1 初始创建（13 条，`POST /api/data-sources`）

| # | `DATA_SOURCE_ID` | 角色/类型 | 接口返回初始 `FG_ACTIVE` | 状态构造后 | 承载用例 |
|---|---|---|---|---|---|
| 1 | `FACC001-SRC-ON` | 启用源库 | `'1'` | `'1'`（不变） | 145（自建长主机 39 字符）、153、156、172（enable 幂等）、182 |
| 2 | `FACC001-SRC-OFF` | 停用源库 | `'1'` | `'0'` | 151、153、156、159、160、163、164、170、172（disable 幂等）、176 |
| 3 | `FACC001-SRC-DEL` | 删除专用源库 | `'1'` | `'0'` | 161（专用物理删除，不复用） |
| 4 | `FACC001-TGT-ON` | 启用目标库 | `'1'` | `'1'`（不变） | 157、163（命名策略有效新目标）、178 |
| 5 | `FACC001-TGT-ON2` | 启用目标库 2 | `'1'` | `'1'`（不变） | 163（第二策略行，供“新增/编辑/删除”循环） |
| 6 | `FACC001-TGT-OFF` | 停用目标库 | `'1'` | `'0'` | 152、153、157、162（业务属性）、178（不得作为候选） |
| 7 | `FACC001-SRC-NULL` | 异常源库（原值 `NULL`） | `'1'` | `NULL` →（末段归一化）`'0'` | 152、153、158、166、167、170（拒绝）、165/171（归一化） |
| 8 | `FACC001-TGT-BAD` | 异常目标库（非 `0`/`1`，值 `X`） | `'1'` | `'X'` →（末段归一化）`'0'` | 152、153、158、166、167、170（拒绝）、165/171（归一化） |
| 9 | `FACC001-SM-E1` | 启用准备源库 | `'1'` | `'0'` | 168、170（enable 成功） |
| 10 | `FACC001-SM-D1` | 停用准备源库 | `'1'` | `'1'`（不变） | 168、171（disable 成功） |
| 11 | `FACC001-CONC-1` | 并发专用源库 | `'1'` | `'1'`（不变） | 174 |
| 12 | `FACC001-UI-A` | 界面停用专用源库 | `'1'` | `'1'`→`'0'`（界面操作） | 155、176 |
| 13 | `FACC001-UI-B` | 界面启用专用源库 | `'1'` | `'0'`（构造）→`'1'`（界面操作） | 155、176 |

### 2.2 `DS-AC-182` 执行时创建（1 条，`POST /api/data-sources`）

| # | `DATA_SOURCE_ID` | 角色/类型 | 说明 |
|---|---|---|---|
| 14 | `FACC001-NEW182` | 新增/编辑专用源库 | 仅在 `DS-AC-182` 执行时创建（接口默认写 `FG_ACTIVE='1'`），随后 `PUT` 编辑；编辑后 `FG_ACTIVE` 仍为 `'1'` |

> 全任务累计创建 = **14**；`FACC001-SRC-DEL` 已于 `DS-AC-161` 物理删除，故最终主表清理 = **13**。
> 不存在目标（`DS-AC-173`）使用**不创建**的 `FACC001-NOPE-999`。

---

## 3. 初始创建请求体（13 条，完整）

`POST /api/data-sources`

模板（各记录字段取值见下表；`password` 为一次性哑值 11 字符，全库不复用、不写入任何证据文件）：

```json
{ "dataSourceId": "<ID>", "dataSourceName": "<NAME>", "dataSourceCategory": "<SOURCE|TARGET>",
  "dataSourceType": "ORACLE", "host": "<HOST>", "port": <PORT>,
  "userName": "fac001u", "password": "<MASKED-11CHARS>", "serviceName": "fac001svc" }
```

| # | ID | NAME | CATEGORY | HOST | PORT |
|---|---|---|---|---|---|
| 1 | `FACC001-SRC-ON` | `FACC001源库启用` | SOURCE | `fac001-src-on.host.internal.example.corp` | 1521 |
| 2 | `FACC001-SRC-OFF` | `FACC001源库停用` | SOURCE | `127.0.0.1` | 1 |
| 3 | `FACC001-SRC-DEL` | `FACC001源库删除` | SOURCE | `192.0.2.11` | 1521 |
| 4 | `FACC001-TGT-ON` | `FACC001目标启用` | TARGET | `192.0.2.12` | 1521 |
| 5 | `FACC001-TGT-ON2` | `FACC001目标启用2` | TARGET | `192.0.2.13` | 1521 |
| 6 | `FACC001-TGT-OFF` | `FACC001目标停用` | TARGET | `192.0.2.14` | 1521 |
| 7 | `FACC001-SRC-NULL` | `FACC001源库空值` | SOURCE | `192.0.2.15` | 1521 |
| 8 | `FACC001-TGT-BAD` | `FACC001目标异常值` | TARGET | `192.0.2.16` | 1521 |
| 9 | `FACC001-SM-E1` | `FACC001启用准备` | SOURCE | `192.0.2.17` | 1521 |
| 10 | `FACC001-SM-D1` | `FACC001停用准备` | SOURCE | `192.0.2.18` | 1521 |
| 11 | `FACC001-CONC-1` | `FACC001并发专用` | SOURCE | `192.0.2.19` | 1521 |
| 12 | `FACC001-UI-A` | `FACC001界面停用` | SOURCE | `192.0.2.21` | 1521 |
| 13 | `FACC001-UI-B` | `FACC001界面启用` | SOURCE | `192.0.2.22` | 1521 |

- 影响：`CDC_DATA_SOURCE` **各 1 行 INSERT**（合计 13 行）；其他表 0 行。
- 预期：HTTP 200，`code=200`，`data` = 新记录 `dataSourceId`；`DATA_SOURCE_ORG` = `DATA_SOURCE_NAME`。
- 缺陷保护：任一创建返回非成功码或写入非 `FACC001%` 主键 → 立即停止，记录 FAIL，按 §6 白名单清理已创建记录。

> `192.0.2.0/24` 为保留文档网段（`TEST-NET-1`），不可路由，不会被真实连接。

---

## 4. 全部写 API 完整清单（R1 补齐）

### 4.1 `DS-AC-160` —— 编辑停用源库

| 项 | 值 |
|---|---|
| 方法 / 路径 | `PUT /api/data-sources/FACC001-SRC-OFF` |
| 脱敏请求体 | `{ "dataSourceId": "FACC001-SRC-OFF", "dataSourceName": "FACC001源库停用R1", "dataSourceCategory": "SOURCE", "dataSourceType": "ORACLE", "host": "127.0.0.1", "port": 1, "userName": "fac001u", "serviceName": "fac001svc" }`（**`password` 缺席**） |
| 影响 | `CDC_DATA_SOURCE` **1 行 UPDATE**；`FG_ACTIVE` **保持 `'0'`**；`DATA_SOURCE_ORG`/`SOURCE_APP`/`DATA_SOURCE_DOMAIN`/时间字段保持原值 |
| 预期业务码 | `code=200`，`data="FACC001-SRC-OFF"` |
| 缺陷处置 | 若 `FG_ACTIVE` 被改为 `'1'` 或写入多余列 → **停止**，记 `FAIL`，用 §6 白名单范围内 SQL 恢复本任务记录原值，并在报告如实记录 |

### 4.2 `DS-AC-162` —— 保存业务属性（停用目标库）

| 项 | 值 |
|---|---|
| 方法 / 路径 | `PUT /api/data-sources/FACC001-TGT-OFF/biz-attr` |
| 脱敏请求体 | `{ "bizAttr": "{\"fac001\":\"ds-ac-162\"}" }` |
| 影响 | `CDC_DATA_SOURCE` **1 行 UPDATE**，仅 `DATA_SOURCE_BIZ_ATTR`；`FG_ACTIVE` 不变（仍 `'0'`） |
| 预期业务码 | `code=200`，`data=null` |
| 缺陷处置 | 若其他列被改动 → **停止**，记 `FAIL`，按白名单恢复并报告 |

### 4.3 `DS-AC-164` —— 编辑弹窗内测试连接（安全失败路径）

| 项 | 值 |
|---|---|
| 方法 / 路径 | `POST /api/data-sources/test-connection` |
| 脱敏请求体 | `{ "originalDataSourceId": "FACC001-SRC-OFF", "dataSourceType": "ORACLE", "host": "127.0.0.1", "port": 1, "userName": "fac001u", "serviceName": "fac001svc" }`（**`password` 缺席**，后端按 `originalDataSourceId` 读取持久化密码） |
| 影响 | **任何表 0 行**（不写业务数据、不入连接池、不触碰真实源库/目标库） |
| 预期结果 | HTTP 200，`data.success=false`，脱敏 message（如“连接失败：…”）；**不抛业务异常**、不含堆栈/密码 |
| 缺陷处置 | 若产生任何写入 → **停止**，记 `FAIL`，按白名单清理并报告 |

### 4.4 `DS-AC-163` —— 停用源库命名策略列表/新增/编辑/删除

| 项 | 方法 / 路径 | 脱敏请求体 | 影响 | 预期业务码 |
|---|---|---|---|---|
| 列表 | `GET /api/data-sources/FACC001-SRC-OFF/naming-strategies` | 无请求体 | 0 行 | `code=200` |
| 新增 A | `POST /api/data-sources/FACC001-SRC-OFF/naming-strategies` | `{ "targetDataSourceId": "FACC001-TGT-ON", "tableNamingStrategy": "CUSTOM_PREFIX_SUFFIX", "tableNamePrefix": "fac001_", "tableNameSuffix": "_t" }` | `CDC_DATA_SOURCE_EXTEND` **1 行 INSERT** | `code=200` |
| 新增 B | `POST /api/data-sources/FACC001-SRC-OFF/naming-strategies` | `{ "targetDataSourceId": "FACC001-TGT-ON2", "tableNamingStrategy": "CUSTOM_PREFIX_SUFFIX", "tableNamePrefix": "fac001_", "tableNameSuffix": "_t2" }` | `CDC_DATA_SOURCE_EXTEND` **1 行 INSERT** | `code=200` |
| 编辑 B | `PUT /api/data-sources/FACC001-SRC-OFF/naming-strategies/FACC001-TGT-ON2` | `{ "targetDataSourceId": "FACC001-TGT-ON2", "tableNamingStrategy": "CUSTOM_PREFIX_SUFFIX", "tableNamePrefix": "fac001r1_", "tableNameSuffix": "_t2r1" }` | `CDC_DATA_SOURCE_EXTEND` **1 行 UPDATE** | `code=200` |
| 删除 B | `DELETE /api/data-sources/FACC001-SRC-OFF/naming-strategies/FACC001-TGT-ON2` | **无请求体** | `CDC_DATA_SOURCE_EXTEND` **1 行 DELETE** | `code=200` |
| 候选核验 | `GET /api/data-sources/target-options` | 无请求体 | 0 行 | `code=200`（`FACC001-SRC-OFF` 不出现） |

- 影响合计：EXTEND 2 `INSERT` + 1 `UPDATE` + 1 `DELETE`；主表 0 行。
- 缺陷处置：若 `FACC001-SRC-OFF` 因停用而被判 `40400`（而非放行）→ 记 `FAIL` 并停止该用例；已创建的 EXTEND 行按 §6 精确白名单清理。

### 4.5 `DS-AC-167` —— 对异常记录的写入口（预期全部被拒绝）

| 项 | 方法 / 路径 | 脱敏请求体 | 影响 | 预期业务码 |
|---|---|---|---|---|
| 详情 | `GET /api/data-sources/FACC001-SRC-NULL` | 无请求体 | 0 行 | `40400` |
| 编辑 | `PUT /api/data-sources/FACC001-SRC-NULL` | `{ "dataSourceId": "FACC001-SRC-NULL", "dataSourceName": "FACC001源库空值", "dataSourceCategory": "SOURCE", "dataSourceType": "ORACLE", "host": "192.0.2.15", "port": 1521, "userName": "fac001u", "serviceName": "fac001svc" }`（**`password` 缺席**） | 0 行 | `40400` |
| 删除 | `DELETE /api/data-sources/FACC001-SRC-NULL` | **无请求体** | 0 行 | `40400` |
| 业务属性读 | `GET /api/data-sources/FACC001-TGT-BAD/biz-attr` | 无请求体 | 0 行 | `40400` |
| 业务属性写 | `PUT /api/data-sources/FACC001-TGT-BAD/biz-attr` | `{ "bizAttr": "{\"fac001\":\"ds-ac-167\"}" }` | 0 行 | `40400` |
| 命名策略列表 | `GET /api/data-sources/FACC001-SRC-NULL/naming-strategies` | 无请求体 | 0 行 | `40400` |
| 命名策略新增 | `POST /api/data-sources/FACC001-SRC-NULL/naming-strategies` | `{ "targetDataSourceId": "FACC001-TGT-ON", "tableNamingStrategy": "CUSTOM_PREFIX_SUFFIX", "tableNamePrefix": "fac001x_", "tableNameSuffix": "_x" }` | 0 行 | `40400` |
| 命名策略编辑 | `PUT /api/data-sources/FACC001-SRC-NULL/naming-strategies/FACC001-TGT-ON` | `{ "targetDataSourceId": "FACC001-TGT-ON", "tableNamingStrategy": "CUSTOM_PREFIX_SUFFIX", "tableNamePrefix": "fac001y_", "tableNameSuffix": "_y" }` | 0 行 | `40400` |
| 命名策略删除 | `DELETE /api/data-sources/FACC001-SRC-NULL/naming-strategies/FACC001-TGT-ON` | **无请求体** | 0 行 | `40400` |

- **预期全部 0 行写入**；异常行唯一允许的写操作是归一化停用（`DS-AC-165`/`171`）。
- 缺陷处置：若任一操作返回成功码或产生写入 → **立即停止该用例**，记 `FAIL`，保留数据库前后只读证据，按 §6 白名单恢复本任务记录（不触碰既有数据），并在报告中如实记录。

### 4.6 `DS-AC-182` —— 新增 + 编辑

| 项 | 方法 / 路径 | 脱敏请求体 | 影响 | 预期业务码 |
|---|---|---|---|---|
| 新增 | `POST /api/data-sources` | `{ "dataSourceId": "FACC001-NEW182", "dataSourceName": "FACC001新增编辑", "dataSourceCategory": "SOURCE", "dataSourceType": "ORACLE", "host": "192.0.2.20", "port": 1521, "userName": "fac001u", "password": "<MASKED-11CHARS>", "serviceName": "fac001svc" }` | `CDC_DATA_SOURCE` **1 行 INSERT**；`FG_ACTIVE` = `'1'` | `code=200`，`data="FACC001-NEW182"` |
| 编辑 | `PUT /api/data-sources/FACC001-NEW182` | `{ "dataSourceId": "FACC001-NEW182", "dataSourceName": "FACC001新增编辑R1", "dataSourceCategory": "SOURCE", "dataSourceType": "ORACLE", "host": "192.0.2.20", "port": 1522, "userName": "fac001u", "serviceName": "fac001svc" }`（**`password` 缺席**） | `CDC_DATA_SOURCE` **1 行 UPDATE**；`FG_ACTIVE` 仍 `'1'` | `code=200` |

- 只读核对：新增后 `FG_ACTIVE='1'`；编辑后 `FG_ACTIVE` 仍 `'1'`（状态只能经独立启停接口改变，`DS-REQ-176`）。
- 缺陷处置：若编辑改变了 `FG_ACTIVE` → 记 `FAIL`，停止，按白名单恢复并报告。

### 4.7 启停接口与 DELETE（无请求体）

| 方法 / 路径 | 请求体 | 影响 |
|---|---|---|
| `PUT /api/data-sources/{dataSourceId}/enable` | **无请求体** | 非幂等路径 `CDC_DATA_SOURCE` 1 行 UPDATE（仅 `FG_ACTIVE`）；幂等路径 0 行；异常值路径 0 行 |
| `PUT /api/data-sources/{dataSourceId}/disable` | **无请求体** | 非幂等路径 1 行 UPDATE（仅 `FG_ACTIVE`）；幂等路径 0 行 |
| `DELETE /api/data-sources/{id}` | **无请求体** | 1 行物理 DELETE（`DS-AC-161`） |
| `DELETE /api/data-sources/{sourceId}/naming-strategies/{targetId}` | **无请求体** | `CDC_DATA_SOURCE_EXTEND` 1 行 DELETE |

启停逐用例目标（全部为 `FACC001%` 记录）：

| 用例 | 调用 | 预期影响 |
|---|---|---|
| 155/176 | `PUT …/FACC001-UI-A/disable`、`PUT …/FACC001-UI-B/enable` | 各 1 行 |
| 168/170 | `PUT …/FACC001-SM-E1/enable` | 1 行（`'0'`→`'1'`） |
| 168/171 | `PUT …/FACC001-SM-D1/disable` | 1 行（`'1'`→`'0'`） |
| 172 | `PUT …/FACC001-SRC-ON/enable`（当前 `'1'`）、`PUT …/FACC001-SRC-OFF/disable`（当前 `'0'`） | **各 0 行**（幂等，需用运行日志/SQL 证明未执行 DML） |
| 166/170 | `PUT …/FACC001-SRC-NULL/enable`、`PUT …/FACC001-TGT-BAD/enable` | **0 行**，返回 `40250` |
| 165/171 | `PUT …/FACC001-SRC-NULL/disable`、`PUT …/FACC001-TGT-BAD/disable` | 各 1 行（归一化为 `'0'`） |
| 173 | `PUT …/FACC001-NOPE-999/enable`、`…/disable` | **0 行**，返回 `40400` |
| 174 | 并发 `PUT …/FACC001-CONC-1/enable` + `…/disable` | ≤1 行，收敛到其中一个目标值；冲突方返回 `50002` |
| 161 | `DELETE /api/data-sources/FACC001-SRC-DEL` | 1 行物理 DELETE |
| 160 | `PUT /api/data-sources/FACC001-SRC-OFF` | 见 §4.1 |

---

## 5. 拟执行的 SQL / PLSQL（完整语句）

### 5.1 状态构造（**单一受控事务**，含初始状态保护）

```sql
SET EXITCOMMIT OFF
DECLARE
  n1 PLS_INTEGER; n2 PLS_INTEGER; n3 PLS_INTEGER;
BEGIN
  UPDATE CDC_DATA_SOURCE SET FG_ACTIVE = '0'
   WHERE DATA_SOURCE_ID IN ('FACC001-SRC-OFF','FACC001-SRC-DEL','FACC001-TGT-OFF','FACC001-SM-E1','FACC001-UI-B')
     AND FG_ACTIVE = '1';
  n1 := SQL%ROWCOUNT;
  IF n1 <> 5 THEN RAISE_APPLICATION_ERROR(-20001, 'STATE0_EXPECTED_5_GOT_' || n1); END IF;

  UPDATE CDC_DATA_SOURCE SET FG_ACTIVE = NULL
   WHERE DATA_SOURCE_ID = 'FACC001-SRC-NULL' AND FG_ACTIVE = '1';
  n2 := SQL%ROWCOUNT;
  IF n2 <> 1 THEN RAISE_APPLICATION_ERROR(-20002, 'STATENULL_EXPECTED_1_GOT_' || n2); END IF;

  UPDATE CDC_DATA_SOURCE SET FG_ACTIVE = 'X'
   WHERE DATA_SOURCE_ID = 'FACC001-TGT-BAD' AND FG_ACTIVE = '1';
  n3 := SQL%ROWCOUNT;
  IF n3 <> 1 THEN RAISE_APPLICATION_ERROR(-20003, 'STATEBAD_EXPECTED_1_GOT_' || n3); END IF;

  COMMIT;
EXCEPTION
  WHEN OTHERS THEN
    ROLLBACK;
    RAISE;
END;
/
```

- 目标表：`CDC_DATA_SOURCE`；预计影响 **5 + 1 + 1 = 7 行**（3 条语句）。
- 约束：三条语句在**同一受控事务**内；**逐条**实际影响行数必须与预计**完全一致**；全部一致才 `COMMIT`；任一不一致立即 `ROLLBACK` 并报告。
- `SET EXITCOMMIT OFF`：**禁止**依赖 SQL*Plus 会话退出时的隐式提交；唯一的提交点就是块内的 `COMMIT`。
- `AND FG_ACTIVE='1'`：任务新建记录经接口创建后预期均为 `'1'`；该保护确保不会误改任何非预期状态的记录。

### 5.2 清理（**清理前只读比对 + 单一受控事务**）

**步骤 0（只读，删除前必须执行）**：

```sql
SELECT DATA_SOURCE_ID, TARGET_DATA_SOURCE_ID
  FROM CDC_DATA_SOURCE_EXTEND
 WHERE DATA_SOURCE_ID = 'FACC001-SRC-OFF'
   AND TARGET_DATA_SOURCE_ID IN ('FACC001-TGT-ON','FACC001-TGT-ON2');

SELECT DATA_SOURCE_ID
  FROM CDC_DATA_SOURCE
 WHERE DATA_SOURCE_ID IN (
   'FACC001-SRC-ON','FACC001-SRC-OFF','FACC001-SRC-DEL','FACC001-TGT-ON','FACC001-TGT-ON2',
   'FACC001-TGT-OFF','FACC001-SRC-NULL','FACC001-TGT-BAD','FACC001-SM-E1','FACC001-SM-D1',
   'FACC001-CONC-1','FACC001-NEW182','FACC001-UI-A','FACC001-UI-B');
```

将上述结果**逐条与创建清单比对**：出现**清单外主键** → **禁止删除**，停止并报告。

**步骤 1（精确主键白名单删除）**：

```sql
SET EXITCOMMIT OFF
DECLARE
  n1 PLS_INTEGER; n2 PLS_INTEGER;
BEGIN
  DELETE FROM CDC_DATA_SOURCE_EXTEND
   WHERE DATA_SOURCE_ID = 'FACC001-SRC-OFF'
     AND TARGET_DATA_SOURCE_ID IN ('FACC001-TGT-ON','FACC001-TGT-ON2');
  n1 := SQL%ROWCOUNT;
  IF n1 NOT IN (1, 2) THEN RAISE_APPLICATION_ERROR(-20011, 'EXT_CLEANUP_EXPECTED_1_OR_2_GOT_' || n1); END IF;

  DELETE FROM CDC_DATA_SOURCE
   WHERE DATA_SOURCE_ID IN (
     'FACC001-SRC-ON','FACC001-SRC-OFF','FACC001-SRC-DEL','FACC001-TGT-ON','FACC001-TGT-ON2',
     'FACC001-TGT-OFF','FACC001-SRC-NULL','FACC001-TGT-BAD','FACC001-SM-E1','FACC001-SM-D1',
     'FACC001-CONC-1','FACC001-NEW182','FACC001-UI-A','FACC001-UI-B');
  n2 := SQL%ROWCOUNT;
  IF n2 <> 13 THEN RAISE_APPLICATION_ERROR(-20012, 'MAIN_CLEANUP_EXPECTED_13_GOT_' || n2); END IF;

  COMMIT;
EXCEPTION
  WHEN OTHERS THEN
    ROLLBACK;
    RAISE;
END;
/
```

预计影响行数（按实际执行阶段分列）：

| 对象 | 正常完成时 | 提前失败时 |
|---|---|---|
| `CDC_DATA_SOURCE_EXTEND` | 正常完成 `DS-AC-163`（已删除 `FACC001-TGT-ON2` 行）后剩余 **1 行** | 若 `DS-AC-163` 提前失败，清理**最多 2 行**（白名单内 2 条逻辑键） |
| `CDC_DATA_SOURCE` | 正常完成 `DS-AC-161`（已删除 `FACC001-SRC-DEL`）且已创建 `FACC001-NEW182` 后 **13 行** | 失败时按步骤 0 的只读结果重新核算，白名单不变，仅调整预计行数并重新比对 |

- 清理同样为**单一受控事务** + 显式 `COMMIT`/`ROLLBACK`；`SET EXITCOMMIT OFF` 确保不依赖隐式提交。
- 清理**不使用** `LIKE` 前缀范围删除；全部为精确主键白名单。
- 若残留不为 0，报告完整主键与原因，**不得**谎报清理成功。

---

## 6. 创建 / 状态构造 / 并发 / 删除 / 清理顺序（修订后）

1. 只读基线复核（按快照口径复算 34/10 行与摘要）；
2. `POST` **创建 13 条**主记录（**不含** `FACC001-NEW182`）；
3. 执行 §5.1 **状态构造**（单事务，逐条核对 → `COMMIT`/`ROLLBACK`）；
4. `POST` 新增 2 条命名策略；
5. 只读核验四类状态齐备（`'1'`/`'0'`/`NULL`/`X`）；
6. 按 `DS-AC-141 → 182` **顺序执行**（异常记录的“拒绝类” 166/167/170 **先于**“归一化类” 165/171）；
7. `DS-AC-182` 时 `POST` 创建 `FACC001-NEW182` 并 `PUT` 编辑；
8. `DS-AC-161` 物理删除 `FACC001-SRC-DEL`；
9. 清理：步骤 0 只读比对通过后，执行 §5.2 受保护 `DELETE`；
10. 残留计数归零 + 保护快照复算比对；
11. 按精确 PID 停止临时前后端服务；
12. 报告与最小状态回写；
13. Commit + Push。

---

## 7. 风险

- **误改存量**：全部 DML 限定 `FACC001` 精确主键；`AND FG_ACTIVE='1'` 初始状态保护；逐条影响行数核对；`ROLLBACK` 兜底。
- **`DS-AC-175`**：不构造不安全竞态；使用**既有定向自动化测试 + 实现路径审计**作为补充证据，并**明确标注为非真实 HTTP 证据**。
- **`DS-AC-174`**：仅用 `FACC001-CONC-1`；`50002` 属预期行为。
- **`DS-AC-177`**：仅在浏览器网络层拦截目标启停请求制造失败，不破坏开发环境。
- **`DS-AC-164`**：仅使用回环失败路径，不连接真实源库/目标库。
- **清理遗漏**：残留必须为 0；否则报告完整主键与原因。

## 8. 如何证明既有数据没有变化

1. 快照固化于 `02-preexisting-data-protection-snapshot.md`；
2. 验收后以**相同口径**复算，并在排除 `FACC001%` 记录后逐项比对，要求逐字一致；
3. 关联只读表行数前后一致（16/12/30/0/1/7）；
4. 零 DDL 由 Git 差异 + 元数据前后快照 + 运行 SQL 审计共同证明。
