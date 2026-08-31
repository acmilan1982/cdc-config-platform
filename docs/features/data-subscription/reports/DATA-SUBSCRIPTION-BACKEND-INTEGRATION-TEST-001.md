# 数据订阅后端真实数据库集成测试报告

- 任务编号：`DATA-SUBSCRIPTION-BACKEND-INTEGRATION-TEST-001`
- 任务类型：数据订阅后端真实数据库集成验证（真实源 Oracle 元数据、真实 HTTP、真实增删改查闭环）
- 分支：`develop`
- 基准提交：`2bfc9c3777dab27df6564725a4a6c2837ccb174e`
- 报告时间：2026-08-31

---

## 1. 任务结论

依据已批准的数据订阅功能基线（`docs/features/data-subscription/` 下 REQUIREMENTS、ACCEPTANCE、DESIGN、API、UI、DATABASE）、任务提示词 `docs/prompts/data-subscription/DATA-SUBSCRIPTION-BACKEND-INTEGRATION-TEST-001-AGENT-PROMPT.md`，本次后端真实数据库集成测试全部按提示词 §3–§7 完成：

- **10 项 API 全部通过真实 HTTP 调用验证**（`api_http_passed_count=10/10`），外部响应结构符合已批准 API 契约（`data` 为对象、`data.dataSubId` 为 32 位无连字符 UUID、列表 `items + queryWarnings`、错误 `code + validationErrors` 等）。
- **真实源 Oracle `112-source-19c` 元数据验证通过**：Schema API 返回 `filterMode=ORACLE_MAINTAINED`，可订阅普通表 Schema 为 `CDC_USER`、`SPT_HIS_2023`；表 API 返回普通表且保持 Oracle 原始大小写；只读交叉核验无视图、物化视图、同义词泄漏；保存前批量复核对不存在表返回结构化 `40330`。
- **新增→详情→编辑打开→删除预览→PRESERVE→REPLACE→物理删除→删除后 40430 全闭环通过**（§5.4 步骤 1–8）。
- **异常与后端防护场景全部通过**（§5.5）：空描述/空源库/空目标库/空源表、英文逗号/句点保留字符 `40316`（指出完整名称）、不存在/停用/类别错误数据源、不存在表、重复目标/重复源表、历史多源库异常记录直接插入后的列表警示与详情/编辑/删除五类拒绝；删除不存在返回 `40430`；全程未引入并发令牌、行锁、内容指纹、并发比较。
- **数据安全与恢复全部通过（§4）**：订阅表已用显式列清单在单一事务内从备份 `CDC_DATA_SUBSCRIBE_2026_08_31` 恢复，恢复后行数 12=12、双向 MINUS=0、主键无缺失无多余、CLOB 逐列一致、本任务测试订阅 ID 全部清除；临时目标记录 `DSUB-IT-20260831-001/002` 已按精确 ID 删除并验证剩余 0 行；备份表未被修改。
- **自动化与构建（§6）**：数据订阅模块自动化测试 7 个测试类 **138/138 通过**；`mvn package -DskipTests` **BUILD SUCCESS**；完整测试当前 HEAD 与基准 `2bfc9c3` 独立 worktree 同命令对照均为 **860 个，3 失败 + 1 错误**（同一批依赖开发库实时数据/运行态的既有环境性失败），**新增失败 = 0**。
- **服务与外部系统边界（§7）**：仅启动/停止 `cdc-config` 后端；不启动前端；不操作 sync-client/Kafka/ZooKeeper；任务结束无遗留 java 进程（恢复至开始前状态）。

- 任务状态：**SUCCESS**（业务验证、恢复、清理全部通过）。
- 状态边界：本任务只是后端真实数据库集成验证，**不代表前端实现，不代表 126 条正式验收通过**。

## 2. 环境与 Git 基线

| 项目 | 值 |
|---|---|
| 当前分支 | `develop` |
| 本地 HEAD | `2bfc9c3777dab27df6564725a4a6c2837ccb174e`（= 基准提交，后端实现 R1 结果提交） |
| 远程 `origin/develop` | 与基准一致，ahead/behind=`0 0`（未触发 `BLOCKED_BASE_CHANGED`） |
| 后端 R1 代码复审 | `APPROVED`（ChatGPT 对 `2bfc9c3...` 正式复审结论） |
| 环境预检 | JDK 8（`/usr/java/latest`）、Maven `/usr/local/maven`、Oracle Instant Client `/opt/oracle/instantclient`、`agent-env.sh` 加载成功 |
| `git status --short` | 保存完整开始快照；存在大量任务前既有已修改与未跟踪内容（`frontend/**`、`docs/agent-prompts/**`、`docs/database/TASK*` 删除、`.claude/settings.local.json`、`agent-env.sh` 等），全部原样保留，未清理、未覆盖、未暂存、未提交 |

核验命令：

```bash
git branch --show-current   # develop
git rev-parse HEAD          # 2bfc9c3777dab27df6564725a4a6c2837ccb174e
git status --short
```

## 3. 数据库预检结果（只读，不含秘密）

### 3.1 连接与实例

- 连接账号：`CDC`（项目开发库普通可读写账号，CLAUDE.md §11 授权）。
- 数据库：`192.168.174.65:1521/prod.enmotech.com`（Oracle 19c），实例标识 `snoopy-linux`，默认 Schema `CDC`。
- 目标表归属：`CDC.CDC_DATA_SOURCE`、`CDC.CDC_DATA_SUBSCRIBE`、`CDC.CDC_DATA_SUBSCRIBE_2026_08_31` 三表均存在且归属 `CDC`。

### 3.2 订阅表与备份表一致性（测试前）

- 两表均 12 列，列名、顺序、数据类型、可空性完全一致（见 §9 显式列清单）。
- 测试前 `CDC_DATA_SUBSCRIBE` 行数 = **12**，`CDC_DATA_SUBSCRIBE_2026_08_31` 行数 = **12**。
- 双向集合差异（标量列 MINUS）均为 **0**；四列 CLOB（`DATA_SOURCE_TABLE/DATA_SOURCE_COMMENT/DATA_TARGET_TABLE/DATA_TARGET_COMMENT`）经 `DBMS_LOB.COMPARE` 逐行比对差异为 **0**。
- 测试前已确认备份表可作恢复权威来源。

### 3.3 真实源库 `112-source-19c`

- `CDC_DATA_SOURCE.DATA_SOURCE_ID='112-source-19c'` 存在，`FG_ACTIVE='1'`，`DATA_SOURCE_CATEGORY` 存储为小写 `source`（options 按 `UPPER(category)='SOURCE'` 匹配，兼容小写，见 §4.1）。
- 机构：孝感市第一人民医院；主机/服务/账号用于只读元数据连接，口令仅内存持有、未落盘、未输出。
- 只读访问范围：Schema 列表、普通表列表、数据字典（`ALL_TABLES/ALL_USERS/ALL_MVIEWS/ALL_VIEWS/ALL_SYNONYMS`）。

### 3.4 `CDC_DATA_SOURCE` 临时目标记录所需字段

- 通过 `ALL_TAB_COLUMNS` 查明非空字段：`DATA_SOURCE_ID`(32B)、`DATA_SOURCE_ORG`(64B)、`DATA_SOURCE_HOST`(64B)、`DATA_SOURCE_PORT`(64B)、`DATA_SOURCE_USER_NAME`(64B)、`DATA_SOURCE_PASSWORD`(64B)、`DATA_SOURCE_TYPE`(32B)、`DATA_SOURCE_SERVICE_NAME`(64B)；`DATA_SOURCE_CATEGORY`、`FG_ACTIVE`、`DATA_SOURCE_NAME`、`DATA_SOURCE_BIZ_ATTR`、`DATA_SOURCE_DOMAIN`、`SOURCE_APP`、三个时间列均可空。
- 所有列为 **BYTE 长度语义**，`NLS_CHARACTERSET=AL32UTF8`；测试 INSERT 未携带超长中文字段，避免 `ORA-12899`。
- 临时目标 ID 前缀 `DSUB-IT-20260831-`，插入前按精确 ID 确认不存在，不与既有记录冲突。

## 4. 10 项 API 真实 HTTP 验证结果

后端按项目标准方式启动，仅绑定 `127.0.0.1:8080`（测试进程，结束后已停止）。以下全部通过真实 HTTP（curl）调用外部响应结构，未只调用 Service 层。

| # | 端点 | 真实请求 | 响应摘要 |
|---|---|---|---|
| 1 | `GET /api/subscriptions/options` | `curl http://127.0.0.1:8080/api/subscriptions/options` | 200；启用 SOURCE 候选含 `112-source-19c`（机构 孝感市第一人民医院）、`5905f1ce...`、`my-19c`；TARGET 候选含本任务临时目标与既有目标 |
| 2 | `GET /api/subscriptions` | 无条件 + 带条件多次 | 200；仅返回 `FG_ACTIVE='1'` 订阅，按 `NVL(UPDATE_TIME, INSERT_TIME)` 倒序；`items + queryWarnings` 结构正确 |
| 3 | `GET /api/subscriptions/{dataSubId}` | 详情回显 | 200（详情字段正确）；删除后 40430 |
| 4 | `GET /api/subscriptions/metadata/schemas?dataSourceId=112-source-19c` | 真实源 | 200；`filterMode=ORACLE_MAINTAINED`；schemas=[`CDC_USER`,`SPT_HIS_2023`] |
| 5 | `GET /api/subscriptions/metadata/tables?dataSourceId=112-source-19c&schema=SPT_HIS_2023` | 真实源 | 200；9 张普通表，保持 Oracle 原始大小写（§5） |
| 6 | `POST /api/subscriptions` | 真实源 + 真实表 + 2 临时目标 | 200；`data` 为对象，`data.dataSubId=5353219e816748a18077667a70b92f6d`（32 位无连字符 UUID） |
| 7 | `GET /api/subscriptions/{dataSubId}/edit` | 编辑打开 | 200；源表检查 `sourceTableCheck=CHECKED`，表按 Schema 分组回显 |
| 8 | `PUT /api/subscriptions/{dataSubId}` | PRESERVE + REPLACE 两次 | 均 200（§6） |
| 9 | `GET /api/subscriptions/{dataSubId}/delete-preview` | 删除预览 | 200；`schemaCount=1`、`tableCount=2`，目标清单正确 |
| 10 | `DELETE /api/subscriptions/{dataSubId}` | 物理删除 | 200；删除后该 `DATA_SUB_ID` 在库中影响行数为 0 |

**HTTP 总数：10/10 通过**（`api_http_passed_count=10`，`api_http_total_count=10`）。异常场景下错误码亦通过真实 HTTP 断言（§7、§8）。

### 4.1 options 源库/目标库语义

- options 使用 `UPPER(DATA_SOURCE_CATEGORY)` + `FG_ACTIVE='1'` 过滤并按 `dataSourceId` 升序，兼容数据库中 `112-source-19c` 存储的小写 `source`。
- 本任务新增的临时 TARGET `DSUB-IT-20260831-001/002` 作为目标候选返回。

### 4.2 候选与列表查询（含 OR/AND 与字面精确匹配）

在测试期间存在的启用订阅（`FG_ACTIVE='1'`）上验证（行 `3000`：源 `112-source-19c` → 目标 `company-target-doris-v4`；历史多源异常测试行：源 `S01,S02` → 目标 `DSUB-IT-20260831-001`）：

| 组合 | 请求参数 | 期望 | 结果 |
|---|---|---|---|
| 无条件列表 | 无 | 仅启用订阅，倒序 | 200，2 行，新插入行在前 |
| 源库组内 OR | `sourceIds=112-source-19c&sourceIds=S01` | 源匹配任一候选 → 2 行 | 200，2 行 |
| 目标库组内 OR | `targetIds=company-target-doris-v4&targetIds=DSUB-IT-20260831-001` | 目标匹配任一候选 → 2 行 | 200，2 行 |
| 两组 AND | `sourceIds=112-source-19c&targetIds=company-target-doris-v4` | 源与目标同时匹配 → 1 行 | 200，1 行（`3000`） |
| 两组 AND（交叉） | `sourceIds=112-source-19c&targetIds=DSUB-IT-20260831-001` | 无行 | 200，0 行 |
| 字面精确匹配 | `sourceIds=S012` | 短 ID 不得误匹配 `S01` → 0 行 | 200，0 行 |
| 含逗号候选警示 | `sourceIds=S01,S02` | 历史兼容可能匹配 + `queryWarnings` | 200，命中异常行 1 行，`queryWarnings` 含 `AMBIGUOUS_COMMA_ID`（field=sourceIds、value=`S01,S02`） |

**说明**：查询候选按 HTTP 参数原始值原子解析（`getParameterValues` 不切分逗号），源库多选组内 OR、目标库组内 OR、两组之间 AND 在服务层 Java 完成；含逗号候选进入历史兼容可能匹配并产生 `queryWarnings`（`items + queryWarnings` 语义），与已批准 API 契约一致。查询重置属于前端行为，本任务未伪造前端验收。

## 5. 真实源 Oracle 元数据与物化视图排除

- **Schema API**：成功连接 `112-source-19c`，使用 `ORACLE_MAINTAINED` 能力模式（`ALL_USERS.ORACLE_MAINTAINED='N'`），返回 `filterMode=ORACLE_MAINTAINED`，schemas=[`CDC_USER`,`SPT_HIS_2023`]，均为当前账号可访问且至少有一张可订阅普通表的非系统 Schema。
- **表 API**：选择 `SPT_HIS_2023` 调用表 API，返回 9 张普通表并保持 Oracle 原始大小写：
  `OPT_FEE, OPT_FEEDETAIL, OPT_HANDLEDETAIL, OPT_HANDLEDETAIL_EXE, OPT_RECORD, OPT_REGISTER, PT_EXAMINATION_DETAIL, PT_EXAMINATION_RECORD, PT_EXAMINATION_SUMMARY`。
  响应时间约 1.33s。
- **物化视图/视图/同义词排除交叉核验（只读）**：针对返回 Schema 执行 `ALL_MVIEWS`、`ALL_VIEWS`、`ALL_SYNONYMS` 只读查询，交叉核验返回结果无视图、物化视图、同义词泄漏；物化视图在 Schema 列表、表清单、保存前批量复核三处 SQL 中均按 `ALL_MVIEWS.MVIEW_NAME/CONTAINER_NAME` 显式排除。
- 新增/编辑测试的源表均从表 API 返回结果中选择（`OPT_FEE/OPT_REGISTER/OPT_FEEDETAIL`），未手工猜表名。
- 未记录连接口令、完整 JDBC 连接串或其他敏感信息。

## 6. 新增→详情→编辑→删除闭环（§5.4）

测试订阅 `5353219e816748a18077667a70b92f6d`（POST 返回）。

1. **新增**：源 `112-source-19c`、Schema `SPT_HIS_2023`、表 `OPT_FEE,OPT_REGISTER`、目标 `DSUB-IT-20260831-001,002`、描述「集成测试-新增订阅-20260831」。
2. **POST 响应**：`code=200`，`data` 为对象（非裸字符串），`data.dataSubId=5353219e816748a18077667a70b92f6d`（32 位无连字符 UUID）。
3. **数据库字段只读核对**：`FG_ACTIVE='1'`；`DATA_FROM_SOURCE_ID='112-source-19c'`（单源库）；`DATA_TO_SOURCE_ID='DSUB-IT-20260831-001,DSUB-IT-20260831-002'`（英文逗号分隔）；`DATA_SOURCE_TABLE='112-source-19c.SPT_HIS_2023.OPT_FEE,112-source-19c.SPT_HIS_2023.OPT_REGISTER'`（`DATA_SOURCE_ID.Schema.表名`，多表英文逗号分隔，大小写保持）；`DATA_SUB_DESC` 正确；遗留可空字段（`DATA_SOURCE_COMMENT/DATA_TARGET_TABLE/DATA_TARGET_COMMENT` 等）按规则为空/NULL；`INSERT_TIME` 已写入、`UPDATE_TIME` 新建时为空。
4. **详情 / 编辑打开 / 删除预览回显**：详情字段正确；编辑打开 `sourceTableCheck=CHECKED`、表按 Schema 分组；删除预览 `schemaCount=1`、`tableCount=2`、目标清单正确。
5. **PRESERVE 编辑**：仅修改描述（「集成测试-PRESERVE编辑-20260831」）与目标库（改为仅 `DSUB-IT-20260831-002`），`sourceSelectionMode=PRESERVE`；返回 200。数据库核对：`DATA_SOURCE_TABLE` **未变化**（仍为 `...OPT_FEE,...OPT_REGISTER`），描述/目标库已更新，`UPDATE_TIME` 已写入。
6. **REPLACE 编辑**：修改真实源表选择（改为 `OPT_FEE,OPT_FEEDETAIL`）、恢复两个目标库、描述（「集成测试-REPLACE编辑-20260831」），`sourceSelectionMode=REPLACE`；返回 200。数据库核对：`DATA_SOURCE_TABLE` **正确重建**为 `112-source-19c.SPT_HIS_2023.OPT_FEE,112-source-19c.SPT_HIS_2023.OPT_FEEDETAIL`。
7. **物理删除**：`DELETE` 返回 200；数据库核对该 `DATA_SUB_ID` 已不存在（行数 0），删除影响行数语义正确（单行）。
8. **删除后查看**：`GET /api/subscriptions/{dataSubId}` 返回 `40430`。

## 7. 异常与后端防护（§5.5）

以下异常场景均通过真实 HTTP 构造并在不破坏既有数据前提下完成（均为本任务测试数据，最终由统一恢复清除）：

| 场景 | 期望错误 | 结果 |
|---|---|---|
| 空描述 | `40300`+`40310`（dataSubDesc） | 通过 |
| 空源库 | `40300`+`40312`（dataFromSourceId） | 通过 |
| 空目标库 | `40300`+`40313`（dataToSourceIds） | 通过 |
| 空源表 | `40300`+`40314`（sourceTables） | 通过 |
| 源库含英文逗号 `A,B` | `40300`+`40316`，name=`A,B`（完整名称，非 `40312`） | 通过 |
| 源库含英文句点 `S.01` | `40300`+`40316`，name=`S.01` | 通过 |
| 源库不存在 `NO-SUCH-SOURCE-IT` | `40300`+`40320` | 通过 |
| 源库停用 `199-source`（`FG_ACTIVE='0'`） | `40300`+`40320` | 通过 |
| 源库类别错误（临时目标作源） | `40300`+`40322` | 通过 |
| 目标库不存在 | `40300`+`40321` | 通过 |
| 目标库类别错误（真源作目标） | `40300`+`40323` | 通过 |
| 重复目标库 | `40300`+`40318` | 通过 |
| 重复源表 | `40300`+`40317` | 通过 |
| 源表不存在（真实 Schema 中混入不存在的表） | `40300`+`40330`，仅失效项报错 | 通过 |
| 删除不存在记录 | `40430` | 通过 |

**历史多源库异常记录直接插入的防护闭环**（提示词 §5.5）：向 `CDC_DATA_SUBSCRIBE` 直接插入一条启用的历史多源库异常记录（`DATA_FROM_SOURCE_ID='S01,S02'`，`FG_ACTIVE='1'`）：

| 操作 | 期望 | 结果 |
|---|---|---|
| 列表（含逗号候选查询 `sourceIds=S01,S02`） | 命中该行 + `queryWarnings` 警示 | 通过 |
| 详情 | `40352`（多源库异常记录不支持查看） | 通过 |
| 编辑打开 | `40350` | 通过 |
| 编辑保存 | `40350` | 通过 |
| 删除预览 | `40353` | 通过 |
| 物理删除 | `40351` | 通过 |

该异常记录随 §10 最终统一恢复清除。

**未执行项及原因**：

- **物化视图（`40331`）保存拒绝**：`NOT_RUN_WITH_REASON`。真实源可访问 Schema（`CDC_USER`、`SPT_HIS_2023`）中不存在任何物化视图（`ALL_MVIEWS` 查询为空），且任务禁止 DDL，无法安全构造真实物化视图；不存在表（`40330`）路径已覆盖同分类的“不可订阅对象”拒绝语义。物化视图三处排除谓词已由自动化测试（`SourceMetadataServiceImplTest.mviewExclusion_presentInAllThreeSqlConstants` 及分类测试）与只读交叉核验覆盖。
- **视图/同义词等不可订阅对象保存拒绝**：同样 `NOT_RUN_WITH_REASON`（可访问 Schema 内 `ALL_VIEWS/ALL_SYNONYMS` 均为空，无法构造真实样例）。

**并发边界**：全程未引入、未验证任何并发令牌、行锁、内容指纹、并发字段比较（符合“取消并发保护”产品边界）；未使用 `FOR UPDATE`、无版本字段、无 `40910`。

## 8. 数据安全与恢复（§4）

### 8.1 测试前只读预检

- 确认当前连接用户/数据库实例/表归属（§3.1）；三表均存在。
- 读取两表列名、顺序、类型、可空性，确认可用显式列清单恢复（§9）。
- 记录测试前 `CDC_DATA_SUBSCRIBE`=12 行、备份表=12 行；双向集合差异与 CLOB 比对均 0（§3.2）。
- 确认 `112-source-19c` 存在、`FG_ACTIVE='1'`、类别按已批准规则为 SOURCE（§3.3）。
- 查明 `CDC_DATA_SOURCE` 非空字段后构造临时目标 INSERT，未盲目拼接；临时目标 ID 与既有记录不冲突（§3.4）。

### 8.2 临时目标记录与清理

- 新增 2 条临时目标（`TARGET`、`FG_ACTIVE='1'`、机构名称明确标记“数据订阅集成测试临时目标”）：
  - `DSUB-IT-20260831-001`
  - `DSUB-IT-20260831-002`
- 插入前按精确 ID 检查不存在；未复制或暴露任何密码/真实生产连接信息。
- 测试结束按精确 ID 删除并验证剩余 **0** 行。
- **说明（测试数据编码伪影，非后端缺陷）**：options/详情等 API 响应中，两条临时目标的机构名称以乱码形式显示（如 `鏁版嵁璁㈤槄...`），而真实源机构（孝感市第一人民医院）及既有目标机构显示正常。根因是测试临时记录经 sqlplus 会话写入时字符集转换不一致（UTF-8 字节被按其他字符集写入），属于本任务测试数据编码伪影，不影响后端读取既有数据的能力；临时记录已删除，订阅表已恢复，无残留影响。报告如实记录该现象。

### 8.3 `CDC_DATA_SUBSCRIBE` 恢复

- 恢复前：`CDC_DATA_SUBSCRIBE`=13 行（12 基线 + 1 条本任务历史多源异常测试行），备份表=12 行。
- 单一事务恢复 SQL（显式列清单，无 `SELECT *`，无 `TRUNCATE`，不修改备份表）：

```sql
DELETE FROM CDC_DATA_SUBSCRIBE;
INSERT INTO CDC_DATA_SUBSCRIBE
  (DATA_SUB_ID, DATA_SUB_DESC, DATA_FROM_SOURCE_ID, DATA_TO_SOURCE_ID, DATA_SOURCE_TABLE,
   DATA_SOURCE_COMMENT, DATA_TARGET_TABLE, DATA_TARGET_COMMENT, INSERT_TIME, UPDATE_TIME,
   DELETE_TIME, FG_ACTIVE)
SELECT DATA_SUB_ID, DATA_SUB_DESC, DATA_FROM_SOURCE_ID, DATA_TO_SOURCE_ID, DATA_SOURCE_TABLE,
       DATA_SOURCE_COMMENT, DATA_TARGET_TABLE, DATA_TARGET_COMMENT, INSERT_TIME, UPDATE_TIME,
       DELETE_TIME, FG_ACTIVE
FROM CDC_DATA_SUBSCRIBE_2026_08_31;
```

- 事务内删除 13 行、插入 12 行；提交前计数校验 `inserted=12 backup=12` 通过后 `COMMIT`；失败路径为 `RAISE_APPLICATION_ERROR` + 会话回滚（本次未触发）。

### 8.4 恢复后验证

| 校验项 | 结果 |
|---|---|
| `CDC_DATA_SUBSCRIBE` 行数 | 12 |
| `CDC_DATA_SUBSCRIBE_2026_08_31` 行数 | 12 |
| 备份 `MINUS` 正表（标量列） | 0 |
| 正表 `MINUS` 备份（标量列） | 0 |
| 主键（`DATA_SUB_ID`）双向差异 | 0 / 0（无缺失、无多余） |
| 四列 CLOB 逐行 `DBMS_LOB.COMPARE`（NULL 归一化） | 0 差异 |
| 本任务测试订阅 ID（`DSUB-IT-%`） | 0 行 |
| 临时目标剩余 | 0 行 |

## 9. 恢复 SQL 使用的显式列清单

`CDC_DATA_SUBSCRIBE` 与备份表列名、顺序、类型、可空性一致（12 列）：

```text
DATA_SUB_ID (VARCHAR2 32, NOT NULL)
DATA_SUB_DESC (VARCHAR2 255)
DATA_FROM_SOURCE_ID (VARCHAR2 1024)
DATA_TO_SOURCE_ID (VARCHAR2 1024)
DATA_SOURCE_TABLE (CLOB)
DATA_SOURCE_COMMENT (CLOB)
DATA_TARGET_TABLE (CLOB)
DATA_TARGET_COMMENT (CLOB)
INSERT_TIME (DATE)
UPDATE_TIME (DATE)
DELETE_TIME (DATE)
FG_ACTIVE (VARCHAR2 1)
```

## 10. 自动化测试、编译与完整测试（§6）

### 10.1 数据订阅模块自动化测试

```text
SubscriptionControllerTest        Tests run: 16,  Failures: 0, Errors: 0
SubscriptionErrorCodeTest         Tests run: 4,   Failures: 0, Errors: 0
SubscriptionCsvHelperTest         Tests run: 25,  Failures: 0, Errors: 0
SubscriptionServiceImplTest       Tests run: 53,  Failures: 0, Errors: 0
SubscriptionConverterTest         Tests run: 12,  Failures: 0, Errors: 0
DataSourceTableParserTest         Tests run: 11,  Failures: 0, Errors: 0
SourceMetadataServiceImplTest     Tests run: 17,  Failures: 0, Errors: 0
--------------------------------------------------------------
模块合计（7 个测试类）            138 个，全部通过
```

### 10.2 编译与打包

```text
mvn package -DskipTests：BUILD SUCCESS
产物：target/cdc-config-platform-backend-1.0.0-SNAPSHOT.jar
```

### 10.3 完整测试与基准对照

当前 HEAD（`2bfc9c3`）与基准 `2bfc9c3` 独立 worktree（`git worktree add --detach /tmp/cdc-baseline 2bfc9c3`）同一命令 `mvn clean package` 对照：

| 项目 | 当前 HEAD | 基准 worktree（`2bfc9c3`） | 说明 |
|---|---|---|---|
| 测试总数 | 860 | 860 | 相同提交 |
| 失败 + 错误 | 3 + 1 | 3 + 1 | 逐项一致 |
| 失败/错误测试 | `OracleDateMappingTest.oracleDateToLocalDateTime_viaJdbcTemplate_shouldMapCorrectly`（期望 27 实得 30）、`JobFailureServiceTest.failureDetail_eventNotInFaultProcess_shouldThrow`（期望 40006 实得 40401）、`JobFailureServiceTest.latestFaultShouldHaveCorrectRestartCount`（期望 1 实得 4）、`JobFailureServiceTest.failureDetailByEvent_shouldReturnContent`（Error） | 与左侧逐项一致 | 依赖开发库实时数据/运行态的既有环境性失败 |
| **新增失败** | **0** | - | 集成测试未修改任何业务代码 |

- 4 个既有环境性失败依赖 `CDC_JOB_FAILURE_EVENT`/`CDC_JOB_FAILURE_HANDLE_LOG` 实时数据与 Oracle 日期映射运行态，与本任务无关；本任务为集成验证任务，未改动任何业务/测试源码。
- `git diff --check`：通过。
- 未引入任何并发令牌、指纹、行锁设计；未新增第三方依赖。

## 11. 服务与外部系统边界（§7）

| 项目 | 状态 |
|---|---|
| `cdc-config` 后端 | 允许为测试启动/停止；启动 PID 16470，监听 `127.0.0.1:8080`；任务结束已停止 |
| 前端 | 未启动 |
| sync-client / sync-server / sync-monitor / sync-log | 未启动、未停止、未重启 |
| Kafka / ZooKeeper | 未连接、未操作 |
| 任务结束进程状态 | 无遗留 java 进程（恢复至开始前状态，符合 §7 要求） |

订阅增删改不会主动通知 sync-client；本任务未验证同步任务或 Kafka Topic 生效。

## 12. 授权文件范围与未改动内容

- 新增授权文件：`docs/features/data-subscription/reports/DATA-SUBSCRIPTION-BACKEND-INTEGRATION-TEST-001.md`（本报告）。
- 未新增集成测试辅助脚本（真实连接参数不允许硬编码入库，故未引入仓库脚本；全部验证经真实 HTTP/只读 sqlplus 完成，命令与证据见报告与任务输出）。
- 未修改 `docs/features/README.md`（与 `001`/`001-R1` 任务既定治理行为一致，README 由后续治理任务统一维护）。
- 未修改任何业务代码、前端代码、批准基线（REQUIREMENTS/ACCEPTANCE/DESIGN/API/UI/DATABASE）、数据库基线、大屏代码、备份表。
- 任务前已存在的全部无关工作区修改均原样保留（`frontend/**`、`docs/agent-prompts/**`、`docs/database/TASK*` 删除、`.claude/settings.local.json`、`agent-env.sh` 等），未清理、未覆盖、未暂存、未提交。
- 任务发现并记录的既有环境性失败（`JobFailureServiceTest` ×3、`OracleDateMappingTest` ×1）为既有缺陷，按规则报告而非顺手修复。

## 13. Git 提交与推送

- 仅逐文件暂存 §12 授权范围文件，禁止 `git add .` / `git add -A`；不 force push。
- Commit message 体现「后端真实数据库集成测试」，不写成整个 Feature 已完成或正式验收通过。
- 普通推送至 `origin/develop`；推送后核验本地 HEAD、远端跟踪分支、远程 develop 一致且 ahead/behind=`0 0`。
- 本报告不含结果提交/远程 SHA（报告本身为提交产物，无法自引用），由 Agent 最终会话输出块在推送完成后给出。

## 14. 状态边界

- 本任务为**后端真实数据库集成验证**，验证的是后端实现（`2bfc9c3`，ChatGPT 复审 `APPROVED`）在真实数据库与真实源 Oracle 下的行为。
- **前端实现状态**：`IN_PROGRESS_FRONTEND_NOT_STARTED`（仍未实现）。
- **正式验收执行状态**：**NOT_RUN**（126 条全部未执行）。
- **大屏适配**：**DEFERRED_AFTER_DATA_SUBSCRIPTION_FEATURE_ACCEPTANCE**（未修改大屏逻辑）。
- 本任务不宣称 Feature 完成，未进行任何验收；本报告不代表前端实现或 126 条正式验收通过。

成功后的下一入口：ChatGPT 对真实数据库集成验证结果正式复核；复核通过后再进入数据订阅前端实现任务。
