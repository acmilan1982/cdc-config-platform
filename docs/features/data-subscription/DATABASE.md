# 数据订阅 Feature 数据库设计基线（DATABASE）

## 1. 元数据与状态

| 项目 | 值 |
|---|---|
| Feature 中文名称 | 数据订阅 |
| Feature 标识 | `data-subscription` |
| 文档状态 | `DRAFT_PENDING_USER_REVIEW`（数据库设计草案，尚未获得项目负责人或 ChatGPT 正式复审批准） |
| 实现状态 | `NOT_STARTED`（本任务为纯文档设计基线 R1 定向修订，不涉及任何业务代码实现） |
| 验收执行状态 | 126 条全部 `NOT_RUN` |
| 任务编号 | `DATA-SUBSCRIPTION-DESIGN-BASELINE-001-R1`（R1 定向修订；首版任务 `DATA-SUBSCRIPTION-DESIGN-BASELINE-001` 结果提交 `610401575938ba32f13fa635493f991bdfae81b6`） |
| 依据的已批准需求基线 | `docs/features/data-subscription/REQUIREMENTS.md`（`APPROVED`，107 条，当前版本为点号保留分隔符调整批准版本，批准依据提交 `bb8716c26d5181edf84ba1f07d4e60e8f1c1918a`） |
| 依据的已批准验收基线 | `docs/features/data-subscription/ACCEPTANCE.md`（`APPROVED`，126 条，全部 `NOT_RUN`） |
| 创建日期 | 2026-08-30 |
| R1 修订日期 | 2026-08-30 |

说明：本文件是数据库设计草案，**不是正式批准的设计基线**。R1 只修正 ChatGPT 正式复审（`CHANGES_REQUIRED`）发现的问题并把已批准点号规则同步进来；本文件不表示设计已批准、功能已实现、部署或验收完成。本 Feature **不执行也不授权任何 DDL**。

## 2. 物理现状

本 Feature 复用现有表结构，**不新增任何 DDL**。物理事实引用已批准数据库基线（`docs/database/`）：

- `CDC_DATA_SUBSCRIBE` 单表物理基线：`docs/database/tables/CDC_DATA_SUBSCRIBE.md`（`APPROVED`）。
- `CDC_DATA_SOURCE` 单表物理基线：`docs/database/tables/CDC_DATA_SOURCE.md`（`APPROVED`）。
- 数据库 Schema 总览：`docs/database/SCHEMA.md`；数据画像：`docs/database/DATA_PROFILE.md`。

### 2.1 `CDC_DATA_SUBSCRIBE` 字段（权威基线，仅列本 Feature 使用与读写相关的字段）

| 字段 | Oracle类型 | 长度/精度 | 可空 | 字段注释 | 本 Feature 角色 |
|---|---|---|---|---|---|
| DATA_SUB_ID | VARCHAR2 | 32 | N | 代理主键，程序自动生成，无任何业务含义 | 主键 `PK_CDC_DATA_SUBSCRIBE`（PRIMARY KEY、ENABLED、NOT DEFERRABLE IMMEDIATE）；专用实体 `@TableId(value="DATA_SUB_ID", type=IdType.INPUT)`（R1 结论，见 §4.3 与 API §8.1） |
| DATA_SUB_DESC | VARCHAR2 | 255 | Y | 订阅描述 | 用户填写，必填 |
| DATA_FROM_SOURCE_ID | VARCHAR2 | 1024 | Y | 源库（业务库），可填多个（异常），英文逗号分隔 | 单源库（正常记录）；多值=异常 |
| DATA_TO_SOURCE_ID | VARCHAR2 | 1024 | Y | 目标库，可填多个，英文逗号分隔 | 多值弱引用 |
| DATA_SOURCE_TABLE | CLOB | 约 4000 | Y | 源库需同步的表，单表格式 `DATA_SOURCE_ID.schema.表名`，逗号分隔 | 源表清单（结构化为 `SourceTableInput[]` 保存，后端拼回） |
| DATA_SOURCE_COMMENT | CLOB | 约 4000 | Y | 源表注释（遗留） | 新增 NULL，编辑保持原值，页面不展示 |
| DATA_TARGET_TABLE | CLOB | 约 4000 | Y | 暂时没用（遗留） | 新增 NULL，编辑保持原值 |
| DATA_TARGET_COMMENT | CLOB | 约 4000 | Y | 暂时没用（遗留） | 新增 NULL，编辑保持原值 |
| INSERT_TIME | DATE | — | Y | 插入时间 | 新增=SYSDATE |
| UPDATE_TIME | DATE | — | Y | 更新时间 | 编辑=SYSDATE；新增=NULL |
| DELETE_TIME | DATE | — | Y | 删除时间 | 不维护（物理删除） |
| FG_ACTIVE | VARCHAR2 | 1 | Y | 启用标志 0/1 | 新增固定 '1'；列表只查 '1'；不提供启停 |

- 主键事实：`DATA_SUB_ID` 为数据库真实主键（`PK_CDC_DATA_SUBSCRIBE`，只读核验 `DATABASE_VERIFIED`）；生产库部署由用户自行负责，不属于本 Feature DDL 范围。
- 无触发器、无序列、无物理外键（`CDC_DATA_SUBSCRIBE` / `CDC_DATA_SOURCE` 均无）；本 Feature 不新增。
- 历史数据行数（当前开发库 12 行等）为瞬时画像，**不得写成永久业务规则**（`DATA_PROFILE.md` 说明）。
- `DATA_FROM_SOURCE_ID` / `DATA_TO_SOURCE_ID` / `DATA_SOURCE_TABLE` 为应用层逗号分隔协议，不得写成数据库约束（REQUIREMENTS §4）。

### 2.2 `CDC_DATA_SOURCE` 中本 Feature 使用的字段

| 字段 | Oracle类型 | 可空 | 用途 |
|---|---|---|---|
| DATA_SOURCE_ID | VARCHAR2(32) | N | 主键；弱引用匹配 |
| DATA_SOURCE_ORG | VARCHAR2(64) | N | 列表/详情/候选展示（机构名称） |
| DATA_SOURCE_HOST/PORT/SERVICE_NAME/USER_NAME/PASSWORD/TYPE | — | N | 源库元数据访问连接信息（仅后端使用，口令不落前端/日志） |
| DATA_SOURCE_CATEGORY | VARCHAR2(30) | Y | 类别 source/target（大小写混用为当前事实；目标规则统一大写） |
| FG_ACTIVE | VARCHAR2(1) | Y | 启用标志；候选与校验要求 = '1' |

## 3. 字段读写矩阵

| 字段 | 新增 | 编辑 | 查询 | 删除 |
|---|---|---|---|---|
| DATA_SUB_ID | 后端生成 32 位无连字符 UUID 后写入（R1 结论 `IdType.INPUT`，API §8.1，SQL 见 §4.3） | 保持不变 | 返回（供详情/编辑/删除使用） | 删除条件（主键） |
| DATA_SUB_DESC | 写入用户填写值 | 写入新值 | 返回 | — |
| DATA_FROM_SOURCE_ID | 写入唯一源库 ID（单值，无英文逗号/英文句点，`DSUB-REQ-008`） | 同新增；`PRESERVE` 模式要求与锁定后的当前记录一致 | 返回；多值记录标为异常（`DSUB-REQ-010`） | — |
| DATA_TO_SOURCE_ID | 写入去重后目标库 ID，英文逗号拼接（`DSUB-REQ-013`） | 同新增 | 返回；列表 token 匹配条件 | — |
| DATA_SOURCE_TABLE | 写入去重后 `DATA_SOURCE_ID.Schema.表名`，英文逗号拼接（`DSUB-REQ-015/016`） | **`REPLACE` 模式**写入重新构造的完整表清单；**`PRESERVE` 模式不写该字段**，原始 CLOB 逐字保留（`DSUB-REQ-093/096`，§4.4） | 返回解析后分组/计数 | — |
| DATA_SOURCE_COMMENT | 写 `NULL`（`DSUB-REQ-023`） | 保持原值，不主动清空（`DSUB-REQ-023`） | 不返回、不展示（`DSUB-REQ-051`） | — |
| DATA_TARGET_TABLE | 写 `NULL`（`DSUB-REQ-024`） | 保持原值（`DSUB-REQ-024`） | 不返回、不展示 | — |
| DATA_TARGET_COMMENT | 写 `NULL`（`DSUB-REQ-025`） | 保持原值（`DSUB-REQ-025`） | 不返回、不展示 | — |
| INSERT_TIME | `SYSDATE`（数据库当前时间，`DSUB-REQ-026`） | 保持不变（`DSUB-REQ-027/096`） | 返回 | — |
| UPDATE_TIME | `NULL`（`DSUB-REQ-026`） | `SYSDATE`（`DSUB-REQ-027/096`） | 返回；列表排序 `NVL(UPDATE_TIME, INSERT_TIME)` | — |
| DELETE_TIME | 不写 | 不写 | — | 不写（物理删除，`DSUB-REQ-021/101`） |
| FG_ACTIVE | 固定 `'1'`（`DSUB-REQ-020`） | 不变（不提供启停） | 列表只查 `'1'`（`DSUB-REQ-020`） | — |

- `INSERT_TIME`/`UPDATE_TIME` 使用 Oracle `SYSDATE`（数据库当前时间），而非应用服务器时间，确保“数据库当前时间”语义（`DSUB-REQ-026/027`）。
- 目标库 ID 集合与源表集合在写入前统一按 §3.1 解析规则规范化（去空格、去空 token、去重、稳定拼接）。
- 本 Feature 保存请求不包含数据源类别字段，不写 `CDC_DATA_SOURCE.DATA_SOURCE_CATEGORY`（API §8 TBD-02）。

### 3.1 多值字段规范化（后端统一实现）

1. 按英文逗号拆分；
2. 每个 token 去除首尾空白；空 token 丢弃；
3. 记录内去重（表标识、目标库 ID）；
4. 按首次出现顺序稳定拼接回英文逗号分隔。

## 4. SQL 与持久化设计

> 所有 SQL 使用参数绑定（`#{...}` / `{0}`），禁止字符串拼接生成 SQL。以下为参数化 SQL / MyBatis-Plus 等价设计（MyBatis-Plus `apply` 中的 `{0}` 为绑定参数）。

### 4.1 列表查询（只查启用、无分页、正确 OR/AND 分组、token 精确匹配）

CSV token 匹配优先采用**不受 `%`、`_` 等 LIKE 通配符影响的 Oracle 字面匹配**（`INSTR`），禁止未转义的 `LIKE` 导致 ID 中 `%`、`_` 被当成通配符，也禁止 `%ID%` 子串误匹配（如 `S01` 不会误匹配 `S012`）。两侧补逗号后按完整 token 匹配；即使存量数据源 ID 含英文逗号，仍按完整字符串字面匹配定位历史记录（查询候选允许含保留字符的存量 ID，见 DESIGN §4.2）。

两个条件组之间是 `AND`，组内是 `OR`：

```text
(FG_ACTIVE = '1')
AND (source1 OR source2 OR ...)   -- 仅当 sourceIds 非空时生成
AND (target1 OR target2 OR ...)   -- 仅当 targetIds 非空时生成
```

参数化 SQL（源库组与目标库组同时存在的完整形态）：

```sql
SELECT DATA_SUB_ID, DATA_SUB_DESC, DATA_FROM_SOURCE_ID, DATA_TO_SOURCE_ID,
       DATA_SOURCE_TABLE, INSERT_TIME, UPDATE_TIME
FROM CDC_DATA_SUBSCRIBE
WHERE FG_ACTIVE = '1'
  AND (
       INSTR(',' || DATA_FROM_SOURCE_ID || ',', ',' || #{sourceId0} || ',') > 0
    OR INSTR(',' || DATA_FROM_SOURCE_ID || ',', ',' || #{sourceId1} || ',') > 0
  )
  AND (
       INSTR(',' || DATA_TO_SOURCE_ID || ',', ',' || #{targetId0} || ',') > 0
    OR INSTR(',' || DATA_TO_SOURCE_ID || ',', ',' || #{targetId1} || ',') > 0
  )
ORDER BY NVL(UPDATE_TIME, INSERT_TIME) DESC
```

**四种条件组合（源库/目标库条件均非空、任一为空、两者皆空）的等价形态：**

| 组合 | 生成的 WHERE |
|---|---|
| 仅源库条件 | `WHERE FG_ACTIVE = '1' AND (源库组 OR...)` |
| 仅目标库条件 | `WHERE FG_ACTIVE = '1' AND (目标库组 OR...)` |
| 两者都有 | `WHERE FG_ACTIVE = '1' AND (源库组 OR...) AND (目标库组 OR...)` |
| 两者都无 | `WHERE FG_ACTIVE = '1'`（返回全部启用记录，无过滤组） |

MyBatis-Plus 等价伪代码（源库组与目标库组是**两个独立 `and(...)` 分组**，不得放入同一个 OR 容器）：

```java
LambdaQueryWrapper<DataSubscribe> w = new LambdaQueryWrapper<>();
w.eq(DataSubscribe::getFgActive, "1");
if (!sourceIds.isEmpty()) {
    w.and(g -> {                       // 独立源库组（组内 OR）
        boolean first = true;
        for (String sid : sourceIds) {
            if (first) { g.apply("INSTR(',' || DATA_FROM_SOURCE_ID || ',', ',' || {0} || ',') > 0", sid); first = false; }
            else g.or().apply("INSTR(',' || DATA_FROM_SOURCE_ID || ',', ',' || {0} || ',') > 0", sid);
        }
    });
}
if (!targetIds.isEmpty()) {
    w.and(g -> {                       // 独立目标库组（组内 OR）
        boolean first = true;
        for (String tid : targetIds) {
            if (first) { g.apply("INSTR(',' || DATA_TO_SOURCE_ID || ',', ',' || {0} || ',') > 0", tid); first = false; }
            else g.or().apply("INSTR(',' || DATA_TO_SOURCE_ID || ',', ',' || {0} || ',') > 0", tid);
        }
    });
}
w.orderByDesc(...) // NVL(UPDATE_TIME, INSERT_TIME) DESC 通过 apply("NVL(UPDATE_TIME, INSERT_TIME) DESC") 或自定义排序
```

- `FG_ACTIVE = '1'` 只查启用（`DSUB-REQ-020`）。
- 无分页（`DSUB-REQ-030`）。
- 源库条件组 OR、目标库条件组 OR、两组 AND（`DSUB-REQ-034`；DESIGN §7.1）。
- 默认排序 `NVL(UPDATE_TIME, INSERT_TIME) DESC`（`DSUB-REQ-028/031`）。
- `INSTR` 为字面匹配，不受 `%`、`_` 等通配符影响；token 已校验不含英文逗号（新增/编辑），存量含逗号 ID 按完整字符串匹配定位历史记录。

### 4.2 详情查询

```sql
SELECT * FROM CDC_DATA_SUBSCRIBE WHERE DATA_SUB_ID = ? AND FG_ACTIVE = '1'
```

- 详情只查询启用记录；多源库异常记录不提供详情（`DSUB-REQ-046`，后端先按 §4.7 判定异常）。
- 详情**不连接源 Oracle**（`DSUB-REQ-045`），只读取已保存配置与数据源映射（§4.6 最小投影）。

### 4.3 新增（专用实体 `IdType.INPUT` + 显式 UUID）

设计草案采用专用 Mapper 方法以写入 `SYSDATE`；专用实体主键策略为 `@TableId(value = "DATA_SUB_ID", type = IdType.INPUT)`（R1 结论，依据见 API §8.1）。

```sql
INSERT INTO CDC_DATA_SUBSCRIBE
  (DATA_SUB_ID, DATA_SUB_DESC, DATA_FROM_SOURCE_ID, DATA_TO_SOURCE_ID,
   DATA_SOURCE_TABLE, DATA_SOURCE_COMMENT, DATA_TARGET_TABLE, DATA_TARGET_COMMENT,
   INSERT_TIME, UPDATE_TIME, DELETE_TIME, FG_ACTIVE)
VALUES
  (#{dataSubId}, #{dataSubDesc}, #{dataFromSourceId}, #{dataToSourceId},
   #{dataSourceTable}, NULL, NULL, NULL,
   SYSDATE, NULL, NULL, '1')
```

- `DATA_SUB_ID`：Service 在 INSERT 前执行 `UUID.randomUUID().toString().replace("-", "")` 显式设置；`IdType.INPUT` 表示主键由调用方显式设置，避免跟随全局 `ASSIGN_ID`；专用 INSERT 使用已设置 ID；数据库主键约束 `PK_CDC_DATA_SUBSCRIBE` 为最终唯一性防线（API §8.1）。
- `INSERT_TIME=SYSDATE`（数据库当前时间）、`UPDATE_TIME=NULL`（`DSUB-REQ-026`）。
- 遗留字段新增写 `NULL`（`DSUB-REQ-023/024/025`）。
- `FG_ACTIVE='1'`（`DSUB-REQ-020`）。
- 受影响行数必须 = 1，否则 `50040`（事务内回滚）。

### 4.4 编辑（原子行锁 + PRESERVE/REPLACE 语义）

并发采用**内容指纹比较**（DESIGN §5.1），不新增版本列；并发保护必须**原子**（普通 `SELECT` 和 `selectById()` 不锁行，仅靠 `@Transactional` 不能避免 TOCTOU 竞态，DESIGN §5.2）。更新流程在事务内：

```sql
-- 1) 如需源 Oracle 实时校验（REPLACE 模式），先在配置库事务外完成（DESIGN §6.4）
-- 2) 进入配置库 @Transactional 方法，使用专用 Mapper 锁当前行：
SELECT ...
FROM CDC_DATA_SUBSCRIBE
WHERE DATA_SUB_ID = #{dataSubId}
FOR UPDATE;

-- 3) 服务层对锁定后的当前完整记录计算内容指纹（DESIGN §5.1），与请求 versionToken 比较；
--    不匹配 → 40910 并回滚；匹配继续。
--    外部源库校验与锁定记录之间的正确性：进入事务锁定后必须再次比较打开编辑时的版本令牌；
--    若记录在外部校验期间发生变化，令牌不匹配并拒绝写入（DESIGN §5.2）。

-- 4a) REPLACE 模式：写入重新构造的完整表清单
UPDATE CDC_DATA_SUBSCRIBE
SET DATA_SUB_DESC = #{dataSubDesc},
    DATA_FROM_SOURCE_ID = #{dataFromSourceId},
    DATA_TO_SOURCE_ID = #{dataToSourceId},
    DATA_SOURCE_TABLE = #{dataSourceTable},
    UPDATE_TIME = SYSDATE
WHERE DATA_SUB_ID = #{dataSubId};

-- 4b) PRESERVE 模式：不设置 DATA_SOURCE_TABLE，原始 CLOB 逐字保留（DSUB-REQ-093/096）
UPDATE CDC_DATA_SUBSCRIBE
SET DATA_SUB_DESC = #{dataSubDesc},
    DATA_FROM_SOURCE_ID = #{dataFromSourceId},
    DATA_TO_SOURCE_ID = #{dataToSourceId},
    UPDATE_TIME = SYSDATE
WHERE DATA_SUB_ID = #{dataSubId};
```

- `UPDATE_TIME = SYSDATE`（`DSUB-REQ-027`）。
- `INSERT_TIME`、`DATA_SUB_ID` 不变；遗留字段保持原值（更新语句不 set 它们，`DSUB-REQ-096`）。
- `PRESERVE` 模式：请求 `dataFromSourceId` 必须与锁定后的当前记录完全一致（后端校验）；`DATA_SOURCE_TABLE` 不写、不因解析/排序被意外重写（DESIGN §3.5）。
- 受影响行数必须 = 1；0 行 → 记录不存在 → `40430`（`DSUB-REQ-104`）。
- 重读（锁行）与更新在同一 `@Transactional` 内；提交后释放行锁。

MyBatis-Plus 等价伪代码：

```java
// 事务内
DataSubscribe current = mapper.selectByIdForUpdate(dataSubId); // 专用 Mapper：SELECT ... FOR UPDATE
if (current == null) throw SubscriptionErrorCode.notFound();
if (!fingerprint(current).equals(versionToken)) throw SubscriptionErrorCode.concurrentModified();
LambdaUpdateWrapper<DataSubscribe> u = new LambdaUpdateWrapper<>();
u.eq(DataSubscribe::getDataSubId, dataSubId)
 .set(DataSubscribe::getDataSubDesc, dto.getDataSubDesc())
 .set(DataSubscribe::getDataFromSourceId, dto.getDataFromSourceId())
 .set(DataSubscribe::getDataToSourceId, join(dto.getDataToSourceIds()));
if (dto.getSourceSelectionMode() == REPLACE) {
    u.set(DataSubscribe::getDataSourceTable, joinFull(dto.getSourceTables())); // 以 dataFromSourceId 拼成 DATA_SOURCE_ID.Schema.表名
}
u.setSql("UPDATE_TIME = SYSDATE");
int rows = mapper.update(null, u);
if (rows != 1) throw SubscriptionErrorCode.saveFailed();
```

### 4.5 物理删除（删除预览不锁行；DELETE 锁行并比较）

```sql
-- 删除预览（GET delete-preview）：只读配置库，不锁行、不连接源 Oracle，
-- 返回删除确认信息 + 基于当前完整记录计算的 versionToken（API §4.9 / DESIGN §3.7）
SELECT DATA_SUB_ID, DATA_SUB_DESC, DATA_FROM_SOURCE_ID, DATA_TO_SOURCE_ID,
       DATA_SOURCE_TABLE, INSERT_TIME, UPDATE_TIME
FROM CDC_DATA_SUBSCRIBE
WHERE DATA_SUB_ID = ? AND FG_ACTIVE = '1';

-- 物理删除（DELETE）：事务内锁行 → 指纹比较 → 删除
-- 1) SELECT ... FOR UPDATE 锁当前行
-- 2) 对锁定后的当前完整记录计算内容指纹，与删除预览返回的 versionToken 比较；不匹配 → 40910
-- 3) 匹配后删除
DELETE FROM CDC_DATA_SUBSCRIBE WHERE DATA_SUB_ID = ?;
```

- 物理删除，不更新 `FG_ACTIVE`（`DSUB-REQ-021/101`）。
- 删除预览不锁行：预览阶段不持有行锁；真正删除时 DELETE 才在事务内 `SELECT ... FOR UPDATE` 锁行并比较令牌。预览后记录被修改 → DELETE 锁行后指纹不匹配 → `40910` 拒绝（`DSUB-REQ-103`）。
- 受影响行数必须 = 1；0 行 → `40430`（“订阅记录不存在或已被删除”，`DSUB-REQ-104`）。
- 多源库异常记录无删除入口，DELETE 对异常记录返回 `40351`（API §7）。

### 4.6 数据源候选与引用映射（最小字段投影）

```sql
-- 源库候选（TBD-02：UPPER(DATA_SOURCE_CATEGORY)='SOURCE'，与目标库规则对称）
SELECT DATA_SOURCE_ID, DATA_SOURCE_ORG
FROM CDC_DATA_SOURCE
WHERE FG_ACTIVE = '1'
  AND UPPER(DATA_SOURCE_CATEGORY) = 'SOURCE'
ORDER BY DATA_SOURCE_ID;

-- 目标库候选
SELECT DATA_SOURCE_ID, DATA_SOURCE_ORG
FROM CDC_DATA_SOURCE
WHERE FG_ACTIVE = '1'
  AND UPPER(DATA_SOURCE_CATEGORY) = 'TARGET'
ORDER BY DATA_SOURCE_ID;
```

- 候选与保存校验使用**同一类别规则**（`FG_ACTIVE='1' AND UPPER(DATA_SOURCE_CATEGORY)='SOURCE|TARGET'`；API §8 TBD-02）。
- 列表/详情映射 `DATA_FROM_SOURCE_ID`/`DATA_TO_SOURCE_ID` 的 token → 机构名称：使用专用 Mapper/投影**只查询 `DATA_SOURCE_ID`、`DATA_SOURCE_ORG`、`FG_ACTIVE`（及必要的类别字段）**，在内存映射；缺失 → `NOT_FOUND`，`FG_ACTIVE != '1'` → `INACTIVE`（`DSUB-REQ-042`）。**不应**为展示映射通过 `selectBatchIds` 加载包含密码的完整 `DataSource` Entity；密码仅在 `SourceMetadataService` 建立源 Oracle 连接时按需单条读取（DESIGN §7.4）。

### 4.7 多源库异常判定

```sql
-- 启用记录 DATA_FROM_SOURCE_ID 拆分 token 数 >= 2 → 多源库异常（DSUB-REQ-010）
-- 判定在服务层完成：split(DATA_FROM_SOURCE_ID, ',').length >= 2
```

### 4.8 源库 Oracle 元数据批量查询（外部源库，只读）

经 `SourceMetadataService` 对源库执行（只读、参数化、复用 `ConnectionFactory`；DESIGN §6）。

**Schema 列表（能力分层过滤，DESIGN §6.3）：**

```sql
-- 1) Oracle 支持 ORACLE_MAINTAINED 且账号可查询时（优先）：
SELECT DISTINCT t.OWNER
FROM ALL_TABLES t
JOIN ALL_USERS u ON u.USERNAME = t.OWNER
WHERE u.ORACLE_MAINTAINED = 'N'
ORDER BY t.OWNER;

-- 2) 不支持该列或无权限时（兼容回退）：集中维护、可测试的 Oracle 系统 Schema 排除清单
--    （含 SYS、SYSTEM、OUTLN、DBSNMP、XDB、MDSYS 等），基于 ALL_TABLES 过滤并排除清单；
--    回退不是“保证完整”的事实，须记录不含敏感信息的回退日志；不允许 SQL 失败后静默返回全部 Schema。
SELECT DISTINCT OWNER FROM ALL_TABLES
WHERE OWNER NOT IN (/* 系统 Schema 排除清单 */)
ORDER BY OWNER;
```

```sql
-- 某 Schema 普通表
SELECT TABLE_NAME FROM ALL_TABLES WHERE OWNER = :schema ORDER BY TABLE_NAME;

-- 保存前批量复核（一次连接，按 Schema 批量；DSUB-REQ-084）
SELECT OWNER, TABLE_NAME FROM ALL_TABLES WHERE OWNER IN (:schemaA, :schemaB, ...);
```

- Schema 必须来自 `ALL_TABLES`，天然只保留至少含一张普通表的可访问 Schema；`ALL_TABLES` 天然排除视图、物化视图、同义词。
- 表名保持源 Oracle 原始大小写（`DSUB-REQ-016`）。
- 目标库只选择、不连接（`DSUB-REQ-068`）。
- 保存校验一次源库连接、按 Schema 批量复核，禁止逐表连接（`DSUB-REQ-084`；DESIGN §6.4）。

## 5. 事务与并发

### 5.1 事务边界

| 操作 | 事务边界 | 说明 |
|---|---|---|
| 新增 | `@Transactional`（配置库写入） | 源库/表校验（外部源库只读连接）在配置库事务外先完成；校验通过后再进入 CDC 配置库事务写入 |
| 编辑 | `@Transactional`（配置库写入） | 事务内 `SELECT ... FOR UPDATE` 锁当前行 → 指纹比较 → UPDATE（REPLACE/PRESERVE 语义见 §4.4）；受影响行数校验 |
| 删除 | `@Transactional`（配置库写入） | 事务内 `SELECT ... FOR UPDATE` 锁当前行 → 指纹比较 → DELETE；受影响行数校验 |
| 删除预览 | 无写事务（只读） | 只读配置库，不锁行、不连接源 Oracle（§4.5 / API §4.9） |

- 源库/表校验（外部 Oracle）与 CDC 配置库写入不在同一数据库事务（跨库无法用本地事务），二者按“先校验后写入”的顺序执行；校验失败不进入写入。进入事务锁定后必须再次比较打开编辑时的版本令牌，防止外部校验结果应用到不同版本的配置记录（DESIGN §5.2）。

### 5.2 并发设计（原子行锁 + 内容指纹，无版本列）

- 编辑打开返回内容指纹版本令牌（DESIGN §5.1 / API §4.7）；删除预览返回版本令牌（API §4.9）；保存/删除回传。
- **原子行锁**：编辑保存与物理删除在事务内通过专用 Mapper 执行 `SELECT ... FOR UPDATE` 锁当前行，锁内计算并比较指纹，匹配后 UPDATE/DELETE，提交后释放锁（DESIGN §5.2）。普通 `SELECT` / `selectById()` 不锁行，不得再声称仅靠 `@Transactional` 即可避免竞态。
- **指纹字段与无歧义编码**（DESIGN §5.1，四份文档统一口径）：
  - 指纹基于完整当前记录中会影响编辑/删除判断的字段：`DATA_SUB_ID`、`DATA_SUB_DESC`、`DATA_FROM_SOURCE_ID`、`DATA_TO_SOURCE_ID`、`DATA_SOURCE_TABLE`、`DATA_SOURCE_COMMENT`、`DATA_TARGET_TABLE`、`DATA_TARGET_COMMENT`、`INSERT_TIME`、`UPDATE_TIME`；
  - 每个字段采用“字段名 + null 标记 + UTF-8 字节长度 + UTF-8 内容”的无歧义编码，不允许简单字符串拼接造成字段边界碰撞（例如 `A`+`BC` 与 `AB`+`C` 不得产生相同指纹）；
  - CLOB 字段读取完整内容参与指纹；
  - DATE 字段统一转换为明确的时间值表示（epoch millis），四处文档口径一致；
  - 对规范化字节串做 SHA-256，输出小写十六进制 64 字符；
  - 令牌只用于并发检测，不是安全凭证；
  - 人工只改时间字段触发保守冲突仍可接受（提示刷新后重新编辑），不是漏报。
- 无版本列、无触发器、无新列（§5.3）。
- `UPDATE_TIME` 为空的处理：新增记录 `UPDATE_TIME=NULL`，列表排序用 `NVL(UPDATE_TIME, INSERT_TIME)`；指纹计算含 `INSERT_TIME`，`UPDATE_TIME` 为空不影响指纹稳定性（同一记录前后指纹计算口径一致）。
- 记录不存在与并发冲突区分：锁行重读返回空 → `40430`（不存在）；有记录但指纹不匹配 → `40910`（并发冲突）。

### 5.3 无 DDL 结论

- 本 Feature 第一版**复用现有表结构，不执行任何 DDL**：不新增表、列、索引、约束、触发器、序列（DESIGN §6；REQUIREMENTS 无 DDL 授权）。
- 若设计识别出潜在性能索引建议（例如 `FG_ACTIVE` 或 `NVL(UPDATE_TIME, INSERT_TIME)` 排序相关索引），**只能作为未来独立评估项**，不能写成已批准变更，也不能在本任务执行。
- 现有索引足以支撑：主键索引 `PK_CDC_DATA_SUBSCRIBE`（`DATA_SUB_ID`）；订阅记录规模小、列表不分页，扫描可接受。

---

*文档状态：`DRAFT_PENDING_USER_REVIEW`。本文件为数据库设计基线草案（R1 定向修订版），未获正式复审批准，不代表设计已批准、功能已实现或验收通过；本 Feature 未执行也不授权任何 DDL。*
