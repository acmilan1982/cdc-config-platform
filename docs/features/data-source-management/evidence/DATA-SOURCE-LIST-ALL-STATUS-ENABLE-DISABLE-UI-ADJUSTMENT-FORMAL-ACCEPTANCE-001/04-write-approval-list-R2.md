# 正式验收 001 —— 写库审批清单 R2（阶段 A 修订版，取代 R1）

> 任务：`DATA-SOURCE-LIST-ALL-STATUS-ENABLE-DISABLE-UI-ADJUSTMENT-FORMAL-ACCEPTANCE-001`
> 阶段：A（只读准备 + 审批清单修订；**尚未执行任何写操作**）
> 状态：`WAITING_FOR_PROJECT_OWNER_DATABASE_WRITE_APPROVAL`
> 修订依据：项目负责人对 R1 清单的 **R2** 修订要求（2 项）
> 修订时间：2026-09-20
> 关系：本文件**取代** `04-write-approval-list-R1.md`；R1 与初版保留为修订过程证据。

---

## R2 对照

| # | R1 内容 | R2 修订 |
|---|---|---|
| 1 | 清理 `DELETE` 使用**固定**预期行数：`EXTEND` 固定 `1` 或 `2`、主表固定 `13` | 清理事务**先按精确白名单查询当前实际存在数量，再删除**；要求 `DELETE` 影响行数**等于删除前实际数量**；`EXTEND` 允许实际数量 **0~2**，主表允许实际数量 **0~14**。不再固定 `1`/`2`/`13`，确保任务在**任意阶段失败**时仍能完成清理 |
| 2 | 缺陷处置含“按白名单恢复并报告”等**未列出完整 SQL/API** 的恢复动作 | **删除全部此类未列明的恢复操作**。接口意外写入/删除时：保存证据 → 判定 `FAIL` → 停止依赖该记录的后续用例 → 最终**仅执行已批准的精确定白名单清理**。任何额外恢复操作**必须重新申请审批** |

其余部分（`RUN_TAG`、13+1 条创建清单、状态构造 SQL、写 API 完整请求体、执行顺序、既有数据保护证明）与 R1 一致，未改动。

---

## 1. RUN_TAG 与全部拟创建主键

`RUN_TAG = FACC001`（验收开始前库内前缀匹配数为 0，见 `02-preexisting-data-protection-snapshot.md §4`）

**累计创建 14 条** = 初始 13 条 + `DS-AC-182` 创建 1 条。

## 2. 验收数据角色 → 对应 `DS-AC`

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

> 全任务累计创建 = **14**；不存在目标（`DS-AC-173`）使用**不创建**的 `FACC001-NOPE-999`。

---

## 3. 初始创建请求体（13 条，完整）

`POST /api/data-sources`

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
- 缺陷处置：见 §9。
- `password` 为一次性哑值（11 字符），全库不复用、不写入任何证据文件；`192.0.2.0/24` 为保留文档网段（`TEST-NET-1`），不可路由。

---

## 4. 全部写 API 完整清单

### 4.1 `DS-AC-160` —— 编辑停用源库

| 项 | 值 |
|---|---|
| 方法 / 路径 | `PUT /api/data-sources/FACC001-SRC-OFF` |
| 脱敏请求体 | `{ "dataSourceId": "FACC001-SRC-OFF", "dataSourceName": "FACC001源库停用R1", "dataSourceCategory": "SOURCE", "dataSourceType": "ORACLE", "host": "127.0.0.1", "port": 1, "userName": "fac001u", "serviceName": "fac001svc" }`（**`password` 缺席**） |
| 影响 | `CDC_DATA_SOURCE` **1 行 UPDATE**；`FG_ACTIVE` **保持 `'0'`**；`DATA_SOURCE_ORG`/`SOURCE_APP`/`DATA_SOURCE_DOMAIN`/时间字段保持原值 |
| 预期业务码 | `code=200`，`data="FACC001-SRC-OFF"` |

### 4.2 `DS-AC-162` —— 保存业务属性（停用目标库）

| 项 | 值 |
|---|---|
| 方法 / 路径 | `PUT /api/data-sources/FACC001-TGT-OFF/biz-attr` |
| 脱敏请求体 | `{ "bizAttr": "{\"fac001\":\"ds-ac-162\"}" }` |
| 影响 | `CDC_DATA_SOURCE` **1 行 UPDATE**，仅 `DATA_SOURCE_BIZ_ATTR`；`FG_ACTIVE` 不变（仍 `'0'`） |
| 预期业务码 | `code=200`，`data=null` |

### 4.3 `DS-AC-164` —— 编辑弹窗内测试连接（安全失败路径）

| 项 | 值 |
|---|---|
| 方法 / 路径 | `POST /api/data-sources/test-connection` |
| 脱敏请求体 | `{ "originalDataSourceId": "FACC001-SRC-OFF", "dataSourceType": "ORACLE", "host": "127.0.0.1", "port": 1, "userName": "fac001u", "serviceName": "fac001svc" }`（**`password` 缺席**） |
| 影响 | **任何表 0 行**（不写业务数据、不入连接池、不触碰真实源库/目标库） |
| 预期结果 | HTTP 200，`data.success=false`，脱敏 message；**不抛业务异常**、不含堆栈/密码 |

### 4.4 `DS-AC-163` —— 停用源库命名策略列表/新增/编辑/删除

| 项 | 方法 / 路径 | 脱敏请求体 | 影响 | 预期码 |
|---|---|---|---|---|
| 列表 | `GET /api/data-sources/FACC001-SRC-OFF/naming-strategies` | 无请求体 | 0 行 | `code=200` |
| 新增 A | `POST /api/data-sources/FACC001-SRC-OFF/naming-strategies` | `{ "targetDataSourceId": "FACC001-TGT-ON", "tableNamingStrategy": "CUSTOM_PREFIX_SUFFIX", "tableNamePrefix": "fac001_", "tableNameSuffix": "_t" }` | `CDC_DATA_SOURCE_EXTEND` **1 行 INSERT** | `code=200` |
| 新增 B | `POST /api/data-sources/FACC001-SRC-OFF/naming-strategies` | `{ "targetDataSourceId": "FACC001-TGT-ON2", "tableNamingStrategy": "CUSTOM_PREFIX_SUFFIX", "tableNamePrefix": "fac001_", "tableNameSuffix": "_t2" }` | `CDC_DATA_SOURCE_EXTEND` **1 行 INSERT** | `code=200` |
| 编辑 B | `PUT /api/data-sources/FACC001-SRC-OFF/naming-strategies/FACC001-TGT-ON2` | `{ "targetDataSourceId": "FACC001-TGT-ON2", "tableNamingStrategy": "CUSTOM_PREFIX_SUFFIX", "tableNamePrefix": "fac001r1_", "tableNameSuffix": "_t2r1" }` | `CDC_DATA_SOURCE_EXTEND` **1 行 UPDATE** | `code=200` |
| 删除 B | `DELETE /api/data-sources/FACC001-SRC-OFF/naming-strategies/FACC001-TGT-ON2` | **无请求体** | `CDC_DATA_SOURCE_EXTEND` **1 行 DELETE** | `code=200` |
| 候选核验 | `GET /api/data-sources/target-options` | 无请求体 | 0 行 | `code=200`（`FACC001-SRC-OFF` 不出现） |

### 4.5 `DS-AC-167` —— 对异常记录的写入口（预期全部被拒绝）

| 项 | 方法 / 路径 | 脱敏请求体 | 影响 | 预期码 |
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

### 4.6 `DS-AC-182` —— 新增 + 编辑

| 项 | 方法 / 路径 | 脱敏请求体 | 影响 | 预期码 |
|---|---|---|---|---|
| 新增 | `POST /api/data-sources` | `{ "dataSourceId": "FACC001-NEW182", "dataSourceName": "FACC001新增编辑", "dataSourceCategory": "SOURCE", "dataSourceType": "ORACLE", "host": "192.0.2.20", "port": 1521, "userName": "fac001u", "password": "<MASKED-11CHARS>", "serviceName": "fac001svc" }` | `CDC_DATA_SOURCE` **1 行 INSERT**；`FG_ACTIVE` = `'1'` | `code=200` |
| 编辑 | `PUT /api/data-sources/FACC001-NEW182` | `{ "dataSourceId": "FACC001-NEW182", "dataSourceName": "FACC001新增编辑R1", "dataSourceCategory": "SOURCE", "dataSourceType": "ORACLE", "host": "192.0.2.20", "port": 1522, "userName": "fac001u", "serviceName": "fac001svc" }`（**`password` 缺席**） | `CDC_DATA_SOURCE` **1 行 UPDATE**；`FG_ACTIVE` 仍 `'1'` | `code=200` |

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

## 5. 状态构造 SQL（单一受控事务 + 初始状态保护，完整语句）

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
  WHEN OTHERS THEN ROLLBACK; RAISE;
END;
/
```

- 目标表：`CDC_DATA_SOURCE`；预计影响 **5 + 1 + 1 = 7 行**（3 条语句）。
- 三条语句在**同一受控事务**内；**逐条**实际影响行数必须与预计**完全一致**；全部一致才 `COMMIT`；任一不一致立即 `ROLLBACK` 并报告。
- `SET EXITCOMMIT OFF`：**禁止**依赖 SQL*Plus 会话退出时的隐式提交；唯一提交点为块内 `COMMIT`。
- `AND FG_ACTIVE='1'`：任务新建记录经接口创建后预期均为 `'1'`，该保护确保不会误改任何非预期状态的记录。

---

## 6. 清理 SQL（R2 修订：先查实际数量，再删除，影响行数须等于删除前实际数量）

### 6.1 步骤 0（**只读**，删除前必须执行，用于报告与白名单比对）

```sql
SELECT DATA_SOURCE_ID, TARGET_DATA_SOURCE_ID
  FROM CDC_DATA_SOURCE_EXTEND
 WHERE DATA_SOURCE_ID = 'FACC001-SRC-OFF'
   AND TARGET_DATA_SOURCE_ID IN ('FACC001-TGT-ON','FACC001-TGT-ON2');

SELECT DATA_SOURCE_ID
  FROM CDC_DATA_SOURCE
 WHERE DATA_SOURCE_ID IN ('FACC001-SRC-ON','FACC001-SRC-OFF','FACC001-SRC-DEL','FACC001-TGT-ON',
   'FACC001-TGT-ON2','FACC001-TGT-OFF','FACC001-SRC-NULL','FACC001-TGT-BAD','FACC001-SM-E1',
   'FACC001-SM-D1','FACC001-CONC-1','FACC001-NEW182','FACC001-UI-A','FACC001-UI-B');
```

将结果**逐条与创建清单（§2）比对**：出现**清单外主键** → **禁止删除**，停止并报告。

### 6.2 步骤 1（受保护清理事务，完整 PL/SQL）

```sql
SET EXITCOMMIT OFF
DECLARE
  c_ext  PLS_INTEGER;   -- 删除前 EXTEND 实际存在数量
  c_main PLS_INTEGER;   -- 删除前主表实际存在数量
  n_ext  PLS_INTEGER;   -- EXTEND 实际删除行数
  n_main PLS_INTEGER;   -- 主表实际删除行数
BEGIN
  -- ① 先按精确白名单查询当前实际存在数量
  SELECT COUNT(*) INTO c_ext
    FROM CDC_DATA_SOURCE_EXTEND
   WHERE DATA_SOURCE_ID = 'FACC001-SRC-OFF'
     AND TARGET_DATA_SOURCE_ID IN ('FACC001-TGT-ON','FACC001-TGT-ON2');

  SELECT COUNT(*) INTO c_main
    FROM CDC_DATA_SOURCE
   WHERE DATA_SOURCE_ID IN ('FACC001-SRC-ON','FACC001-SRC-OFF','FACC001-SRC-DEL','FACC001-TGT-ON',
     'FACC001-TGT-ON2','FACC001-TGT-OFF','FACC001-SRC-NULL','FACC001-TGT-BAD','FACC001-SM-E1',
     'FACC001-SM-D1','FACC001-CONC-1','FACC001-NEW182','FACC001-UI-A','FACC001-UI-B');

  -- ② 允许范围：EXTEND 0~2；主表 0~14
  IF c_ext  > 2  THEN RAISE_APPLICATION_ERROR(-20021, 'EXT_PRENOTCHECK_EXPECTED_0_TO_2_GOT_'  || c_ext);  END IF;
  IF c_main > 14 THEN RAISE_APPLICATION_ERROR(-20022, 'MAIN_PRENOTCHECK_EXPECTED_0_TO_14_GOT_' || c_main); END IF;

  -- ③ 按外键/关联依赖逆序删除（先 EXTEND 后主表）
  DELETE FROM CDC_DATA_SOURCE_EXTEND
   WHERE DATA_SOURCE_ID = 'FACC001-SRC-OFF'
     AND TARGET_DATA_SOURCE_ID IN ('FACC001-TGT-ON','FACC001-TGT-ON2');
  n_ext := SQL%ROWCOUNT;

  DELETE FROM CDC_DATA_SOURCE
   WHERE DATA_SOURCE_ID IN ('FACC001-SRC-ON','FACC001-SRC-OFF','FACC001-SRC-DEL','FACC001-TGT-ON',
     'FACC001-TGT-ON2','FACC001-TGT-OFF','FACC001-SRC-NULL','FACC001-TGT-BAD','FACC001-SM-E1',
     'FACC001-SM-D1','FACC001-CONC-1','FACC001-NEW182','FACC001-UI-A','FACC001-UI-B');
  n_main := SQL%ROWCOUNT;

  -- ④ 要求影响行数等于删除前实际数量
  IF n_ext  <> c_ext  THEN RAISE_APPLICATION_ERROR(-20023, 'EXT_DELETED_'  || n_ext  || '_PRENOTCOUNT_' || c_ext);  END IF;
  IF n_main <> c_main THEN RAISE_APPLICATION_ERROR(-20024, 'MAIN_DELETED_' || n_main || '_PRENOTCOUNT_' || c_main); END IF;

  COMMIT;
EXCEPTION
  WHEN OTHERS THEN
    ROLLBACK;
    RAISE;
END;
/
```

**R2 要点**

| 项 | 规则 |
|---|---|
| 数量来源 | `SELECT COUNT(*)`（精确白名单谓词）在**同一事务内、删除前**执行 |
| `EXTEND` 允许实际数量 | **0 ~ 2** |
| 主表允许实际数量 | **0 ~ 14** |
| `DELETE` 约束 | 影响行数**必须等于**删除前实际数量（`n_ext = c_ext`、`n_main = c_main`），否则 `ROLLBACK` |
| 提交 | 全部通过才 `COMMIT`；任一不符立即 `ROLLBACK` |
| 隐式提交 | `SET EXITCOMMIT OFF`，不依赖会话退出时的隐式提交/回滚 |
| 删除范围 | **精确主键白名单 `IN (…)`**，不使用 `LIKE` 前缀删除 |
| 任意阶段失败 | 因不固定预期数量，任务在**任意阶段失败**后仍可完成清理（数量可为 0） |

清理**不使用**任何未列明的恢复 SQL；若残留不为 0，报告完整主键与原因，**不得**谎报清理成功。

---

## 7. 创建 / 状态构造 / 并发 / 删除 / 清理顺序

1. 只读基线复核（按快照口径复算 34/10 行与摘要）；
2. `POST` **创建 13 条**主记录（**不含** `FACC001-NEW182`）；
3. 执行 §5 **状态构造**（单事务，逐条核对 → `COMMIT`/`ROLLBACK`）；
4. `POST` 新增 2 条命名策略；
5. 只读核验四类状态齐备（`'1'`/`'0'`/`NULL`/`X`）；
6. 按 `DS-AC-141 → 182` **顺序执行**（异常记录的“拒绝类” 166/167/170 **先于**“归一化类” 165/171）；
7. `DS-AC-182` 时 `POST` 创建 `FACC001-NEW182` 并 `PUT` 编辑；
8. `DS-AC-161` 物理删除 `FACC001-SRC-DEL`；
9. 清理：§6.1 只读比对通过后，执行 §6.2 受保护清理事务；
10. 残留计数归零 + 保护快照复算比对；
11. 按精确 PID 停止临时前后端服务；
12. 报告与最小状态回写；
13. Commit + Push。

---

## 8. 风险与既有数据保护

- 全部 DML 限定 `FACC001` 精确主键；状态构造含 `AND FG_ACTIVE='1'` 保护与逐条影响行数核对；清理含“删除前实际数量”核对；均由 `ROLLBACK` 兜底。
- `DS-AC-175`：使用**既有定向自动化测试 + 实现路径审计**作为补充证据，并**明确标注为非真实 HTTP 证据**；不改代码、不碰存量、不制造不安全竞态。
- `DS-AC-174`：仅用 `FACC001-CONC-1`；`50002` 属预期。
- `DS-AC-177`：仅在浏览器网络层拦截目标启停请求制造失败，不破坏开发环境。
- `DS-AC-164`：仅使用回环失败路径，不连接真实源库/目标库。
- 既有数据不变证明：快照复算（排除 `FACC001%` 后逐字一致）+ 关联只读表行数（16/12/30/0/1/7）+ 零 DDL 审计（Git 差异 + 元数据前后快照 + 运行 SQL 审计）。

---

## 9. 异常处置规则（R2 修订，取代 R1）

**统一规则（适用于本清单全部写 API / SQL）**：当任何接口或语句出现**未预期的写入或删除**（例如本应 `40400`/`40250`/0 行却发生写入，或本应写入却影响行数不符）时：

1. **保存证据**：HTTP 请求/响应原文（脱敏）、运行日志、数据库只读前后快照；
2. **判定 `FAIL`**：该 `DS-AC` 记为 `FAIL`，并如实记录；
3. **停止依赖该记录的后续用例**：受影响及后续依赖该记录状态的用例不再执行（记为 `NOT_RUN` 或按真实情况记录，并说明原因）；不继续扩大影响；
4. **不执行任何清单外的恢复操作**：本清单**未列出**任何恢复类 SQL/API；
5. **最终仅执行 §6 已批准的精确白名单清理**；
6. 如需任何**额外恢复操作**（含“按白名单恢复原值”“重新构造状态”等），**必须重新申请审批**，未获批不得执行。

> 说明：本规则已删除 R1 中的“按白名单恢复并报告”等未列明完整 SQL/API 的动作。需求侧不再授权任何计划外写库行为。
