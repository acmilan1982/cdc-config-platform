# 数据订阅 Feature 数据库设计基线（DATABASE）

## 1. 元数据与状态

| 项目 | 值 |
|---|---|
| Feature 中文名称 | 数据订阅 |
| Feature 标识 | `data-subscription` |
| 文档状态 | `DRAFT_PENDING_USER_REVIEW`（数据库设计草案，尚未获正式复审批准） |
| 实现状态 | `NOT_STARTED` |
| 验收执行状态 | 126 条全部 `NOT_RUN` |
| 任务编号 | `DATA-SUBSCRIPTION-DESIGN-BASELINE-001` |
| 创建日期 | 2026-08-30 |

## 2. 物理现状

本 Feature 复用现有表结构，**不新增任何 DDL**。物理事实引用已批准数据库基线（`docs/database/`）：

- `CDC_DATA_SUBSCRIBE` 单表物理基线：`docs/database/tables/CDC_DATA_SUBSCRIBE.md`（`APPROVED`）。
- `CDC_DATA_SOURCE` 单表物理基线：`docs/database/tables/CDC_DATA_SOURCE.md`（`APPROVED`）。
- 数据库 Schema 总览：`docs/database/SCHEMA.md`；数据画像：`docs/database/DATA_PROFILE.md`。

### 2.1 `CDC_DATA_SUBSCRIBE` 字段（权威基线，仅列本 Feature 使用与读写相关的字段）

| 字段 | Oracle类型 | 长度/精度 | 可空 | 字段注释 | 本 Feature 角色 |
|---|---|---|---|---|---|
| DATA_SUB_ID | VARCHAR2 | 32 | N | 代理主键，程序自动生成，无任何业务含义 | 主键 `PK_CDC_DATA_SUBSCRIBE`（PRIMARY KEY、ENABLED、NOT DEFERRABLE IMMEDIATE） |
| DATA_SUB_DESC | VARCHAR2 | 255 | Y | 订阅描述 | 用户填写，必填 |
| DATA_FROM_SOURCE_ID | VARCHAR2 | 1024 | Y | 源库（业务库），可填多个（异常），英文逗号分隔 | 单源库（正常记录）；多值=异常 |
| DATA_TO_SOURCE_ID | VARCHAR2 | 1024 | Y | 目标库，可填多个，英文逗号分隔 | 多值弱引用 |
| DATA_SOURCE_TABLE | CLOB | 约 4000 | Y | 源库需同步的表，单表格式 `DATA_SOURCE_ID.schema.表名`，逗号分隔 | 源表清单 |
| DATA_SOURCE_COMMENT | CLOB | 约 4000 | Y | 源表注释（遗留） | 新增 NULL，编辑保持原值，页面不展示 |
| DATA_TARGET_TABLE | CLOB | 约 4000 | Y | 暂时没用（遗留） | 新增 NULL，编辑保持原值 |
| DATA_TARGET_COMMENT | CLOB | 约 4000 | Y | 暂时没用（遗留） | 新增 NULL，编辑保持原值 |
| INSERT_TIME | DATE | — | Y | 插入时间 | 新增=SYSDATE |
| UPDATE_TIME | DATE | — | Y | 更新时间 | 编辑=SYSDATE；新增=NULL |
| DELETE_TIME | DATE | — | Y | 删除时间 | 不维护（物理删除） |
| FG_ACTIVE | VARCHAR2 | 1 | Y | 启用标志 0/1 | 新增固定 '1'；列表只查 '1'；不提供启停 |

- 主键事实：`DATA_SUB_ID` 为数据库真实主键（`PK_CDC_DATA_SUBSCRIBE`，只读核验 `DATABASE_VERIFIED`）；生产库部署由用户自行负责，不属于本 Feature DDL 范围。
- 无触发器、无序列、无物理外键（`CDC_DATA_SUBSCRIBE` / `CDC_DATA_SOURCE` 均无）。
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
| DATA_SUB_ID | 后端生成 32 位无连字符 UUID 后写入（TBD-01，DESIGN/API §8.1） | 保持不变 | 返回（供详情/编辑/删除使用） | 删除条件（主键） |
| DATA_SUB_DESC | 写入用户填写值 | 写入新值 | 返回 | — |
| DATA_FROM_SOURCE_ID | 写入唯一源库 ID（单值，无英文逗号，`DSUB-REQ-008`） | 同新增 | 返回；多值记录标为异常（`DSUB-REQ-010`） | — |
| DATA_TO_SOURCE_ID | 写入去重后目标库 ID，英文逗号拼接（`DSUB-REQ-013`） | 同新增 | 返回；列表 token 匹配条件 | — |
| DATA_SOURCE_TABLE | 写入去重后 `DATA_SOURCE_ID.Schema.表名`，英文逗号拼接（`DSUB-REQ-015/016`） | 同新增（未变时保持原值用于有限编辑） | 返回解析后分组/计数 | — |
| DATA_SOURCE_COMMENT | 写 `NULL`（`DSUB-REQ-023`） | 保持原值，不主动清空（`DSUB-REQ-023`） | 不返回、不展示（`DSUB-REQ-051`） | — |
| DATA_TARGET_TABLE | 写 `NULL`（`DSUB-REQ-024`） | 保持原值（`DSUB-REQ-024`） | 不返回、不展示 | — |
| DATA_TARGET_COMMENT | 写 `NULL`（`DSUB-REQ-025`） | 保持原值（`DSUB-REQ-025`） | 不返回、不展示 | — |
| INSERT_TIME | `SYSDATE`（数据库当前时间，`DSUB-REQ-026`） | 保持不变（`DSUB-REQ-027/096`） | 返回 | — |
| UPDATE_TIME | `NULL`（`DSUB-REQ-026`） | `SYSDATE`（`DSUB-REQ-027/096`） | 返回；列表排序 `NVL(UPDATE_TIME, INSERT_TIME)` | — |
| DELETE_TIME | 不写 | 不写 | — | 不写（物理删除，`DSUB-REQ-021/101`） |
| FG_ACTIVE | 固定 `'1'`（`DSUB-REQ-020`） | 不变（不提供启停） | 列表只查 `'1'`（`DSUB-REQ-020`） | — |

- `INSERT_TIME`/`UPDATE_TIME` 使用 Oracle `SYSDATE`（数据库当前时间），而非应用服务器时间，确保“数据库当前时间”语义（`DSUB-REQ-026/027`）。
- 目标库 ID 集合与源表集合在写入前统一按 §3.1 解析规则规范化（去空格、去空 token、去重、稳定拼接）。

### 3.1 多值字段规范化（后端统一实现）

1. 按英文逗号拆分；
2. 每个 token 去除首尾空白；空 token 丢弃；
3. 记录内去重（表标识、目标库 ID）；
4. 按首次出现顺序稳定拼接回英文逗号分隔。

## 4. SQL 与持久化设计

> 所有 SQL 使用参数绑定（`#{...}` / `{0}`），禁止字符串拼接生成 SQL。以下为参数化 SQL / MyBatis-Plus 等价设计（MyBatis-Plus `apply` 中的 `{0}` 为绑定参数）。

### 4.1 列表查询（只查启用、无分页、默认排序、token 精确匹配）

```sql
SELECT DATA_SUB_ID, DATA_SUB_DESC, DATA_FROM_SOURCE_ID, DATA_TO_SOURCE_ID,
       DATA_SOURCE_TABLE, INSERT_TIME, UPDATE_TIME
FROM CDC_DATA_SUBSCRIBE
WHERE FG_ACTIVE = '1'
  AND (
       ',' || DATA_FROM_SOURCE_ID || ',' LIKE '%,' || {sourceId0} || ',%'   -- 多个源库 OR
    OR ',' || DATA_FROM_SOURCE_ID || ',' LIKE '%,' || {sourceId1} || ',%'
  )
  AND (
       ',' || DATA_TO_SOURCE_ID || ',' LIKE '%,' || {targetId0} || ',%'     -- 多个目标库 OR
    OR ',' || DATA_TO_SOURCE_ID || ',' LIKE '%,' || {targetId1} || ',%'
  )
ORDER BY NVL(UPDATE_TIME, INSERT_TIME) DESC
```

- `FG_ACTIVE = '1'` 只查启用（`DSUB-REQ-020`）。
- 无分页（`DSUB-REQ-030`）。
- 源库条件组 OR、目标库条件组 OR、两组 AND（`DSUB-REQ-034`）。
- CSV token 匹配用 `',' || col || ',' LIKE '%,' || token || ',%'`：两侧补逗号后按完整 token 匹配，避免 `%ID%` 子串误匹配（如 `S01` 不会误匹配 `S012`）。token 已校验不含英文逗号。
- 默认排序 `NVL(UPDATE_TIME, INSERT_TIME) DESC`（`DSUB-REQ-028/031`）。

MyBatis-Plus 等价伪代码：

```java
LambdaQueryWrapper<DataSubscribe> w = new LambdaQueryWrapper<>();
w.eq(DataSubscribe::getFgActive, "1");
if (!sourceIds.isEmpty() || !targetIds.isEmpty()) {
    w.and(g -> {
        boolean first = true;
        for (String sid : sourceIds) {
            if (first) { g.apply("',' || DATA_FROM_SOURCE_ID || ',' LIKE '%,' || {0} || ',%'", sid); first = false; }
            else g.or().apply("',' || DATA_FROM_SOURCE_ID || ',' LIKE '%,' || {0} || ',%'", sid);
        }
        for (String tid : targetIds) {
            if (first) { g.apply("',' || DATA_TO_SOURCE_ID || ',' LIKE '%,' || {0} || ',%'", tid); first = false; }
            else g.or().apply("',' || DATA_TO_SOURCE_ID || ',' LIKE '%,' || {0} || ',%'", tid);
        }
    });
}
w.orderByDesc(...) // NVL(UPDATE_TIME, INSERT_TIME) DESC 通过 apply("NVL(UPDATE_TIME, INSERT_TIME) DESC") 或自定义排序
```

### 4.2 详情查询

```sql
SELECT * FROM CDC_DATA_SUBSCRIBE WHERE DATA_SUB_ID = ? AND FG_ACTIVE = '1'
```

- 详情只查询启用记录；多源库异常记录不提供详情（`DSUB-REQ-046`，后端先按 §4.7 判定异常）。

### 4.3 新增

设计草案采用专用 Mapper 方法以写入 `SYSDATE`：

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

- `DATA_SUB_ID` 由服务层生成 32 位无连字符 UUID（TBD-01，API §8.1）。
- `INSERT_TIME=SYSDATE`（数据库当前时间）、`UPDATE_TIME=NULL`（`DSUB-REQ-026`）。
- 遗留字段新增写 `NULL`（`DSUB-REQ-023/024/025`）。
- `FG_ACTIVE='1'`（`DSUB-REQ-020`）。
- 受影响行数必须 = 1，否则 `50040`（事务内回滚）。

### 4.4 编辑（带并发条件更新）

并发采用**内容指纹比较**（DESIGN §5.1），不新增版本列。更新流程在事务内：

```sql
-- 1) 事务内重读当前行（锁当前记录）
SELECT * FROM CDC_DATA_SUBSCRIBE WHERE DATA_SUB_ID = ?;

-- 2) 服务层重算内容指纹（DESIGN §5.1），与请求 versionToken 比较；不匹配 → 40910

-- 3) 匹配后更新
UPDATE CDC_DATA_SUBSCRIBE
SET DATA_SUB_DESC = #{dataSubDesc},
    DATA_FROM_SOURCE_ID = #{dataFromSourceId},
    DATA_TO_SOURCE_ID = #{dataToSourceId},
    DATA_SOURCE_TABLE = #{dataSourceTable},
    UPDATE_TIME = SYSDATE
WHERE DATA_SUB_ID = #{dataSubId}
```

- `UPDATE_TIME = SYSDATE`（`DSUB-REQ-027`）。
- `INSERT_TIME`、`DATA_SUB_ID` 不变；遗留字段保持原值（更新语句不 set 它们，`DSUB-REQ-096`）。
- 受影响行数必须 = 1；0 行 → 记录不存在 → `40430`（`DSUB-REQ-104`）。
- 重读与更新在同一 `@Transactional` 内，避免 TOCTOU 竞态。

MyBatis-Plus 等价伪代码：

```java
// 事务内
DataSubscribe current = mapper.selectById(dataSubId);
if (current == null) throw SubscriptionErrorCode.notFound();
if (!fingerprint(current).equals(versionToken)) throw SubscriptionErrorCode.concurrentModified();
LambdaUpdateWrapper<DataSubscribe> u = new LambdaUpdateWrapper<>();
u.eq(DataSubscribe::getDataSubId, dataSubId)
 .set(DataSubscribe::getDataSubDesc, dto.getDataSubDesc())
 .set(DataSubscribe::getDataFromSourceId, dto.getDataFromSourceId())
 .set(DataSubscribe::getDataToSourceId, join(dto.getDataToSourceIds()))
 .set(DataSubscribe::getDataSourceTable, join(dto.getSourceTables()))
 .setSql("UPDATE_TIME = SYSDATE");
int rows = mapper.update(null, u);
if (rows != 1) throw SubscriptionErrorCode.saveFailed();
```

### 4.5 物理删除（带并发条件）

```sql
-- 1) 事务内重读当前行 → 指纹比较（不匹配 → 40910）
-- 2) 匹配后删除
DELETE FROM CDC_DATA_SUBSCRIBE WHERE DATA_SUB_ID = ?
```

- 物理删除，不更新 `FG_ACTIVE`（`DSUB-REQ-021/101`）。
- 受影响行数必须 = 1；0 行 → `40430`（“订阅记录不存在或已被删除”，`DSUB-REQ-104`）。

### 4.6 数据源候选与引用映射

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

- 列表/详情映射 `DATA_FROM_SOURCE_ID`/`DATA_TO_SOURCE_ID` 的 token → 机构名称：用 `selectBatchIds`（MyBatis-Plus）按 `DATA_SOURCE_ID` 批量读取 `CDC_DATA_SOURCE` 的 `DATA_SOURCE_ID + DATA_SOURCE_ORG + FG_ACTIVE`，在内存映射；缺失 → `NOT_FOUND`，`FG_ACTIVE != '1'` → `INACTIVE`（`DSUB-REQ-042`）。
- 候选/保存校验使用**同一类别规则**（TBD-02，API §8.2）。

### 4.7 多源库异常判定

```sql
-- 启用记录 DATA_FROM_SOURCE_ID 拆分 token 数 >= 2 → 多源库异常（DSUB-REQ-010）
-- 判定在服务层完成：split(DATA_FROM_SOURCE_ID, ',').length >= 2
```

### 4.8 源库 Oracle 元数据批量查询（外部源库，只读）

经 `SourceMetadataService` 对源库执行（只读、参数化、复用 `ConnectionFactory`）：

```sql
-- Schema 列表（普通表、非系统 Schema；排除清单见 DESIGN §6.3）
SELECT DISTINCT OWNER FROM ALL_TABLES
WHERE OWNER NOT IN ('SYS','SYSTEM', /* 系统 Schema 排除清单 */ ...)
ORDER BY OWNER;

-- 某 Schema 普通表
SELECT TABLE_NAME FROM ALL_TABLES WHERE OWNER = :schema ORDER BY TABLE_NAME;

-- 保存前批量复核（一次连接，按 Schema 批量）
SELECT OWNER, TABLE_NAME FROM ALL_TABLES WHERE OWNER IN (:schemaA, :schemaB, ...);
```

- 目标库只选择、不连接（`DSUB-REQ-068`）。
- 保存校验一次源库连接、按 Schema 批量复核（`DSUB-REQ-084`；DESIGN §6.4）。

## 5. 事务与并发

### 5.1 事务边界

| 操作 | 事务边界 | 说明 |
|---|---|---|
| 新增 | `@Transactional`（配置库写入） | 源库/表校验（外部源库只读连接）在配置库事务外先完成；校验通过后再进入 CDC 配置库事务写入 |
| 编辑 | `@Transactional`（配置库写入） | 事务内重读当前行 → 指纹比较 → `UPDATE`；受影响行数校验 |
| 删除 | `@Transactional`（配置库写入） | 事务内重读当前行 → 指纹比较 → `DELETE`；受影响行数校验 |

- 源库/表校验（外部 Oracle）与 CDC 配置库写入不在同一数据库事务（跨库无法用本地事务），二者按“先校验后写入”的顺序执行；校验失败不进入写入。

### 5.2 并发设计（无版本列）

- 编辑打开返回内容指纹版本令牌（DESIGN §5.1 / API §4.7）；保存/删除回传。
- 指纹包含全部业务字段 + `INSERT_TIME`/`UPDATE_TIME`，不单独依赖 `UPDATE_TIME`（`DSUB-REQ-099`：人工直接维护数据库不一定同步更新时间）。
- 无版本列、无触发器、无新列（§5.3）。
- 并发比较在事务内重读当前行后进行，避免读-改-写竞态。
- `UPDATE_TIME` 为空的处理：新增记录 `UPDATE_TIME=NULL`，列表排序用 `NVL(UPDATE_TIME, INSERT_TIME)`；指纹计算含 `INSERT_TIME`，`UPDATE_TIME` 为空不影响指纹稳定性（同一记录前后指纹计算口径一致）。
- 记录不存在与并发冲突区分：重读返回空 → `40430`（不存在）；重读有记录但指纹不匹配 → `40910`（并发冲突）。

### 5.3 无 DDL 结论

- 本 Feature 第一版**复用现有表结构，不执行任何 DDL**：不新增表、列、索引、约束、触发器、序列（DESIGN §6 总原则 9；REQUIREMENTS 无 DDL 授权）。
- 若设计识别出潜在性能索引建议（例如 `FG_ACTIVE` 或 `NVL(UPDATE_TIME, INSERT_TIME)` 排序相关索引），**只能作为未来独立评估项**，不能写成已批准变更，也不能在本任务执行。
- 现有索引足以支撑：主键索引 `PK_CDC_DATA_SUBSCRIBE`（`DATA_SUB_ID`）；订阅记录规模小、列表不分页，扫描可接受。

---

*文档状态：`DRAFT_PENDING_USER_REVIEW`。本文件为数据库设计基线草案，未获正式复审批准；本 Feature 未执行也不授权任何 DDL。*
