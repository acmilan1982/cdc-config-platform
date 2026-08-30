# 任务执行报告：数据订阅设计基线 R1 定向修订（DATA-SUBSCRIPTION-DESIGN-BASELINE-001-R1）

## 1. 任务编号、复审来源与状态

| 项目 | 值 |
|---|---|
| 任务编号 | `DATA-SUBSCRIPTION-DESIGN-BASELINE-001-R1` |
| 前序设计任务 | `DATA-SUBSCRIPTION-DESIGN-BASELINE-001`（结果提交 `610401575938ba32f13fa635493f991bdfae81b6`） |
| 点号需求调整批准收口提交 | `4747b036490e146885c339fb1e9c86d9c8ee3de5`（本任务基准提交） |
| 复审来源 | ChatGPT 对设计草案提交 `6104015...` 的正式设计复审，结论 `CHANGES_REQUIRED` |
| 任务性质 | 纯文档设计基线 R1 定向修订（修正 ChatGPT 正式复审发现项 + 同步已批准点号规则；**不得修改业务代码、不访问数据库、不执行 DDL/DML**） |
| Feature | 数据订阅（`data-subscription`） |
| 最终状态 | `SUCCESS`（本报告记录的是设计基线 R1 定向修订收口结果；**本报告不声称设计已批准、功能已实现或验收已通过**） |
| 分支 | `develop` |
| 基准提交（base_commit_id） | `4747b036490e146885c339fb1e9c86d9c8ee3de5` |
| 结果提交（result_commit_id） | 见控制台 `AGENT_TASK_RESULT`（本报告不预先伪造尚未产生的提交号） |
| 远程提交（remote_commit_id） | 见控制台 `AGENT_TASK_RESULT` |
| ahead/behind | 见控制台 `AGENT_TASK_RESULT` |
| commit_status / push_status | 见控制台 `AGENT_TASK_RESULT` |

收口后状态：`requirements_status=APPROVED`、`acceptance_status=APPROVED`、`design_status=DRAFT_PENDING_USER_REVIEW`（四份设计文档仍为草案，待重新正式复审）、`implementation_status=NOT_STARTED`、`acceptance_execution_status=NOT_RUN`（126 条全部 `NOT_RUN`）。

## 2. 分支、基准提交、结果提交、远程提交与 ahead/behind

- 分支：`develop`。
- 基准提交（base_commit_id）：`4747b036490e146885c339fb1e9c86d9c8ee3de5`（任务开始前本地 HEAD 与 `origin/develop` 一致，ahead/behind = `0 0`）。
- 结果提交 / 远程提交 / ahead/behind / commit_status / push_status：本任务 Commit 与 Push 结果在控制台 `AGENT_TASK_RESULT` 结果块输出，不在本报告中伪造尚未产生的提交号（遵循既有报告约定）。

## 3. 开始前工作区状态与既有修改保护结果

执行开始前记录（`git branch --show-current` / `git status --short` / `git rev-parse HEAD` / `git rev-parse origin/develop` / `git rev-list --left-right --count origin/develop...HEAD` / `git show --stat --oneline 4747b03...`）：

- 当前分支：`develop`。
- 本地 HEAD：`4747b036490e146885c339fb1e9c86d9c8ee3de5`。
- `origin/develop`：`4747b036490e146885c339fb1e9c86d9c8ee3de5`（与本地一致，ahead/behind = `0 0`）。
- 开始前工作区存在大量与本任务无关的既有修改与未跟踪文件（如 `.claude/settings.local.json`、`agent-env.sh`、`frontend/src/**`、`docs/agent-prompts/**`、`docs/database/TASK3/4*` 删除、`docs/features/app-shell/` 与 `docs/features/large-screen/` 未跟踪目录等），本任务未清理、未回滚、未覆盖、未暂存、未提交任何既有修改。
- 本任务 5 个拟修改文件（DESIGN.md、API.md、UI.md、DATABASE.md、docs/features/README.md）与 1 个拟新增文件（本报告）在开始前均无未提交修改，可安全处理。
- 未使用 `git add .`、`git add -A` 等全量暂存；只逐文件暂存本任务授权文件。
- 未执行任何破坏性 Git 命令。

## 4. 实际修改/新增文件

修改（授权范围内 5 个）：

1. `docs/features/data-subscription/DESIGN.md`
2. `docs/features/data-subscription/API.md`
3. `docs/features/data-subscription/UI.md`
4. `docs/features/data-subscription/DATABASE.md`
5. `docs/features/README.md`（仅 `data-subscription` 一行与变更记录）

新增（授权范围内 1 个）：

6. `docs/features/data-subscription/reports/DATA-SUBSCRIPTION-DESIGN-BASELINE-001-R1.md`（本报告）

未修改：`REQUIREMENTS.md`、`ACCEPTANCE.md`、所有既有报告、`docs/baseline/`、`docs/database/`、`docs/features/large-screen/`、任何 Java/Vue/TypeScript/JavaScript/SQL/配置/测试文件、其他 Feature 文档。

## 5. ChatGPT 发现项逐项“修订前→修订后”

| # | 发现项 | 修订前（`6104015...`） | 修订后（本任务） |
|---|---|---|---|
| 1 | 并发保护必须原子 | “普通 SELECT → 指纹比较 → 按主键 UPDATE/DELETE”，并声称事务可避免 TOCTOU | R1 统一为 `SELECT ... FOR UPDATE` → 行锁内计算并比较 versionToken → 匹配后 UPDATE/DELETE → 提交释放锁；明确普通 `selectById()` 不锁行（DESIGN §5.2、DATABASE §4.4/§5.2） |
| 2 | 查询 OR/AND 分组 | MyBatis-Plus 伪代码把源库与目标库条件放入同一 OR 容器 | 两个独立 `and(sourceGroup)` / `and(targetGroup)`，组间 AND、组内 OR；给出四种条件组合等价形态；token 匹配改为 `INSTR(','\|\|col\|\|',', ','\|\|#{token}\|\|',') > 0` 字面匹配（DESIGN §7.1、DATABASE §4.1） |
| 3 | `sourceTables` 唯一契约 | API 同时描述 `Schema.表名`、`DATA_SOURCE_ID.Schema.表名` 与后端补前缀三种形式 | 保存请求唯一类型 `SourceTableInput[]`（每项 `{schemaName, tableName}`）；后端以 `dataFromSourceId` 为唯一源库拼成 `DATA_SOURCE_ID.Schema.表名`；新增固定 `REPLACE`，编辑 `PRESERVE\|REPLACE`（DESIGN §3.3/§3.4/§4.2、API §4.6/§4.8、UI §5、DATABASE §4.4） |
| 4 | 删除令牌获取链路 | DELETE 要求 `versionToken` 但列表不返回，链路无法闭环 | 新增 `GET /api/subscriptions/{dataSubId}/delete-preview`，API 能力 9→10；删除预览只读配置库、不连接源 Oracle、返回删除确认信息与 versionToken；DELETE 以 JSON 请求体回传令牌（DESIGN §3.7、API §2/§4.9/§4.10、UI §7.5、DATABASE §4.5） |
| 5 | `DATA_SUB_ID` 与 MyBatis-Plus 策略 | 声称默认 `IdType.NONE`（不自动生成） | 依据 `pom.xml`（3.5.3.1）与 `MyBatisPlusConfig`（未配置全局 id-type）确认 `DbConfig.idType` 默认为 `ASSIGN_ID`；修正为 `@TableId(value = "DATA_SUB_ID", type = IdType.INPUT)`，Service 在 INSERT 前 `UUID.randomUUID().toString().replace("-", "")`（DESIGN §2.2、API §8.1、DATABASE §4.3） |
| 6 | 章节引用与追踪完整性 | DESIGN 追踪引用不存在的 `UI §9.x`、`DATABASE §10.x` 等 | 以 R1 后真实标题重新生成全部引用；107 条追踪全部指向真实章节；四份文档交叉引用零无效（DESIGN §8、§19 验证） |
| 7 | 同步已批准点号规则 | 点号规则未进入四份设计文档或仍标“待需求确认” | 四份文档同步：两个结构句点为正常分隔符；组件内部英文逗号/句点禁止用于新增/编辑；查询候选允许含保留字符存量 ID；维护候选/Schema/表禁选并说明原因；后端保存再次拒绝；历史不隐藏、正常点号不误判、不可解析保留并警告（DESIGN §4.2、API §3.1/§4.1/§4.6、UI §2.1/§5/§6、DATABASE §2.1/§3） |
| 8 | 非系统 Schema 判定 | 静态黑名单宣称满足“非系统 Schema” | 能力分层方案：优先 `ALL_USERS.ORACLE_MAINTAINED='N'` 过滤（12c+，需权限验证）；不支持时用集中可测试的系统 Schema 排除清单回退并说明限制；接口返回 `filterMode=ORACLE_MAINTAINED\|FALLBACK_EXCLUSION_LIST`（DESIGN §6.3、API §4.4、DATABASE §4.8） |

## 6. 点号批准规则同步结果

- 依据：`REQUIREMENTS.md` / `ACCEPTANCE.md` 当前为点号保留分隔符批准版本（ChatGPT 正式复审 `APPROVED`，批准依据提交 `bb8716c...`）。
- 四份设计文档已同步（DESIGN §4.2、API §3.1/§4.1/§4.6、UI §2.1/§5/§6、DATABASE §2.1/§3）：
  - 两个英文句点是 `DATA_SOURCE_ID.Schema.表名` 三段结构的正常分隔符，正常结构不误判为异常；
  - 数据源 ID、Schema 名、表名组件内部不得含英文逗号或英文句点；第一版无引号、转义符或长度前缀协议；
  - 查询下拉仍允许选择含保留字符的存量数据源以查询历史订阅；
  - 新增/编辑候选中含保留字符的数据源显示为禁用项并标注“名称含协议保留字符，不能用于订阅配置”；
  - Schema/表对象含保留字符时显示但不可选择并说明原因；
  - 后端保存必须再次拒绝；目标库 ID 同样禁止句点；
  - 历史记录不隐藏；无法解析内容保留原始值并警告；编辑保存前必须修复，不能借 `PRESERVE` 绕过；
  - 多源库异常无操作的优先规则不变。
- 该规则不再标为“待需求确认”或“设计自行增加”，已与批准需求一致（`dot_delimiter_design_status=ALIGNED_APPROVED_REQUIREMENTS`）。

## 7. 并发原子性方案

- 版本令牌（内容指纹）：DESIGN §5.1 统一指纹规范——基于 `DATA_SUB_ID`、`DATA_SUB_DESC`、`DATA_FROM_SOURCE_ID`、`DATA_TO_SOURCE_ID`、`DATA_SOURCE_TABLE`、`DATA_SOURCE_COMMENT`、`DATA_TARGET_TABLE`、`DATA_TARGET_COMMENT`、`INSERT_TIME`、`UPDATE_TIME`；每字段“字段名 + null 标记 + UTF-8 字节长度 + UTF-8 内容”无歧义编码；CLOB 读全文；DATE 统一 epoch millis；SHA-256 小写十六进制 64 字符；不新增版本列、触发器或 DDL。
- 原子行锁：编辑保存与物理删除在 `@Transactional` 内使用专用 Mapper `SELECT ... FOR UPDATE` 锁当前行 → 锁内指纹比较 → 匹配后 UPDATE/DELETE → 提交释放锁（DESIGN §5.2、DATABASE §4.4/§4.5/§5.2、API §4.8/§4.10）。
- 外部源库校验与锁定记录的正确性：进入事务锁定后必须再次比较打开编辑时的版本令牌；记录在外部校验期间发生变化则令牌不匹配并拒绝写入（DESIGN §5.2）。
- 四份文档口径一致；不再出现“普通 selectById + @Transactional 即可避免竞态”的表述（`concurrency_design_status=ATOMIC_ROW_LOCK`）。

## 8. 查询 OR/AND 和 token 匹配方案

- 条件分组：源库条件非空时建立独立 `and(sourceGroup)`；目标库条件非空时建立独立 `and(targetGroup)`；两组之间 `AND`、组内 `OR`；两组不得放入同一 OR 容器；只有源库条件时只生成源库组；只有目标库条件时只生成目标库组；两者都空时不生成过滤组（返回全部启用记录）。
- 四种组合等价形态：仅源库组 / 仅目标库组 / 两者都有 / 两者都无，均已在 DATABASE §4.1 给出。
- CSV token 精确匹配：`INSTR(',' || col || ',', ',' || #{token} || ',') > 0` 字面匹配，不受 `%`、`_` 等 LIKE 通配符影响；禁止 `%ID%` 子串匹配；存量含逗号 ID 按完整字符串字面匹配定位历史记录（DATABASE §4.1、DESIGN §7.1、API §4.2）。
- 结果：`query_grouping_status=CORRECT_OR_AND`。

## 9. sourceTables 唯一契约

- 保存请求（POST/PUT）中 `sourceTables` 唯一类型为 `SourceTableInput[]`（每项仅 `schemaName` + `tableName`，不重复携带源库 ID）。
- 后端以 `dataFromSourceId` 为唯一源库校验并拼成数据库格式 `DATA_SOURCE_ID.Schema.表名` 持久化。
- 源库 ID、Schema、表名均校验英文逗号与组件内部英文句点保留字符；Schema/表名保持 Oracle 原始大小写；重复判定用 `(schemaName, tableName)` 精确组合。
- POST 新增固定 `sourceSelectionMode=REPLACE`（省略按 REPLACE 处理）；PUT 编辑 `sourceSelectionMode=PRESERVE | REPLACE`：
  - `PRESERVE`：不提交 `sourceTables`；`dataFromSourceId` 与锁定后的当前记录完全一致；UPDATE 不写 `DATA_SOURCE_TABLE`，原始 CLOB 逐字保留；
  - `REPLACE`：必须提交结构化 `sourceTables`；必须成功连接源 Oracle 并按 Schema 批量校验；UPDATE 写入重新构造的完整表清单；
  - 后端不能只相信前端模式：锁行后结合当前记录、版本令牌与请求字段验证模式合法性；原源库停用/不存在或原配置含保留字符无效项时不能借 `PRESERVE` 绕过。
- 响应展示使用 `tablesBySchema` / `rawUnparseableTables` 结构，不把保存请求的 `sourceTables` 与展示字符串混为同一类型（DESIGN §4.2、API §4.6/§4.8、UI §5/§7、DATABASE §4.4）。
- 结果：`source_tables_contract_status=STRUCTURED_UNIFIED`。

## 10. 删除预览和版本令牌链路

- 新增删除预览能力 `GET /api/subscriptions/{dataSubId}/delete-preview`；API 能力由 9 个调整为 10 个（API §2）。
- 删除预览：只读取配置库，不连接源 Oracle；返回删除确认所需最新信息（订阅 ID、描述、源库、Schema 数、表数、目标库、异常提示）与基于当前完整记录生成的 `versionToken`；多源库异常记录拒绝预览（`40353`）；记录不存在返回 `40430`。
- 删除流程闭环：点击列表“删除”先调删除预览，成功后再展示确认弹窗；用户确认后 `DELETE` 以 JSON 请求体回传预览令牌（`axios.delete(url, { data: { versionToken } })`，唯一约定）；DELETE 事务内 `SELECT ... FOR UPDATE` 锁行 → 指纹比较 → 匹配则删除；预览后记录被修改 → 锁行后指纹不匹配 → `40910` 拒绝。
- 不复用会连接源 Oracle 的“编辑打开”接口获取删除令牌（DESIGN §3.7、API §4.9/§4.10、UI §7.5、DATABASE §4.5）。
- 结果：`delete_token_flow_status=DELETE_PREVIEW_COMPLETE`。

## 11. MyBatis-Plus ID 策略修正依据

- 只读复核事实：`backend/pom.xml` 为 `mybatis-plus.version=3.5.3.1`；`MyBatisPlusConfig.java` 仅配置分页拦截器、未配置全局 id-type；此时 `DbConfig.idType` 默认是 `ASSIGN_ID`；`largescreen/stats/entity/DataSubscribeEntity.java` 现有 `@TableId("DATA_SUB_ID")` 未指定 IdType，大屏场景由全局 `ASSIGN_ID` 规则处理。
- 修正结论：`subscription` 模块专用实体采用 `@TableId(value = "DATA_SUB_ID", type = IdType.INPUT)`；`IdType.INPUT` 表示主键由调用方显式设置，避免跟随全局 `ASSIGN_ID`；Service 在 INSERT 前执行 `UUID.randomUUID().toString().replace("-", "")`；专用 INSERT 使用已设置 ID；数据库主键约束 `PK_CDC_DATA_SUBSCRIBE` 为最终唯一性防线；前端不生成 ID；不新增序列/触发器/默认值；不修改现有大屏实体（DESIGN §2.2、API §8.1、DATABASE §4.3）。
- 结果：`id_strategy_status=UUID32_IDTYPE_INPUT`。

## 12. 章节引用和 107 条追踪检查

- 四份文档以 R1 后真实标题编号重新生成全部内部引用；DESIGN/API/UI/DATABASE 章节结构见各文档。
- DESIGN §8 需求追踪 107 条（`DSUB-REQ-001` ~ `DSUB-REQ-107`）全部映射到 R1 后真实存在的设计章节；自动引用检查方法见 §19 第 20/21 项。
- 结果：`requirements_traceability_status=COMPLETE`、`cross_reference_status=COMPLETE`。

## 13. Schema 过滤方案

- 能力分层方案（DESIGN §6.3、API §4.4、DATABASE §4.8）：
  - 优先：`SELECT DISTINCT t.OWNER FROM ALL_TABLES t JOIN ALL_USERS u ON u.USERNAME = t.OWNER WHERE u.ORACLE_MAINTAINED = 'N'`（实现前须结合实际权限验证 `ALL_USERS.ORACLE_MAINTAINED` 可查询；该列仅 12c+ 可用）；
  - 兼容回退：集中维护、可测试的 Oracle 系统 Schema 排除清单（含 `SYS`、`SYSTEM`、`OUTLN`、`DBSNMP`、`XDB`、`MDSYS` 等）；回退不是“保证完整”的事实，文档说明限制；不允许 SQL 失败后静默返回全部 Schema；后端记录不含敏感信息的回退日志；
  - 接口返回 `filterMode=ORACLE_MAINTAINED|FALLBACK_EXCLUSION_LIST` 供可核验，不展示给普通用户；
  - 不保留“静态黑名单即完全满足非系统 Schema”的表述。
- 结果：`schema_filter_status=CAPABILITY_AWARE`。

## 14. 其他收紧项

- 列表表数量：`DATA_SOURCE_TABLE` 按英文逗号拆分、trim、丢弃空 token；列表“共 N 张”统计**所有非空 token**（含当前无法解析的历史 token），避免详情存在原始异常项但列表数量少算；详情把可解析项与原始异常项分区展示；正常保存只允许全部可解析的结构化对象（DESIGN §4.5、API §4.2/§4.9、UI §2.2）。
- 删除与错误码：新增删除预览错误语义；多源库异常查看/编辑/删除预览/删除错误码命名准确区分（`40352 ANOMALY_NOT_VIEWABLE` / `40350 ANOMALY_NOT_EDITABLE` / `40353 ANOMALY_NOT_PREVIEWABLE` / `40351 ANOMALY_NOT_DELETABLE`）；错误码表恰好 26 条，与摘要“共 26 个业务错误码”一致；保存失败 `50040` 与删除失败 `50041` 区分。
- 唯一失效项结构：批量校验失败统一 HTTP 200 + `code=40300 SUBSCRIPTION_VALIDATION_FAILED`，`data` 携带结构化 `validationErrors`（每项 `{errorCode, field, name, message}`），不再使用“message 汇总或其他方式”等候选契约（API §4.6/§7）。
- 重复提交边界：前端按钮 loading 为首期主要防重复机制；新增使用随机 UUID，主键约束不能阻止同一业务请求被重复提交后形成两条逻辑重复记录；文档准确表述为“防止用户界面重复点击，但网络重试可能形成允许的重复记录；首期未设计请求幂等键”（DESIGN §5.4、API §4.6）。
- 数据源映射最小字段：列表/详情映射数据源用专用 Mapper/投影只查询 `DATA_SOURCE_ID`、`DATA_SOURCE_ORG`、`FG_ACTIVE` 及必要类别字段；不为展示映射通过 `selectBatchIds` 加载含密码完整 Entity；密码仅在 `SourceMetadataService` 建立源 Oracle 连接时按需单条读取（DESIGN §7.4、DATABASE §4.6）。
- 类别规则范围：候选与保存校验使用 `FG_ACTIVE='1' AND UPPER(DATA_SOURCE_CATEGORY)='SOURCE|TARGET'`；subscription 保存请求不包含类别字段，不写 `CDC_DATA_SOURCE.DATA_SOURCE_CATEGORY`；SQL 全部统一 `UPPER(...)` 口径（API §8 TBD-02、DATABASE §4.6）。

## 15. 126 条验收设计覆盖结果

- `ACCEPTANCE.md` 126 条 `DSUB-AC-001` ~ `DSUB-AC-126` 覆盖 13 个领域（§4.1 生效边界与 sync-client 字段、§4.2 数据模型与存储规则、§4.3 列表页面与查询、§4.4 异常记录与异常数据源展示、§4.5 查看详情、§4.6 新增/编辑弹窗交互与源库搜索、§4.7 目标库选择、§4.8 Schema 与表选择、§4.9 新增保存规则、§4.10 编辑规则、§4.11 并发保护、§4.12 删除规则、§4.13 通用交互、安全与延期项）。
- 四份设计文档（DESIGN/API/UI/DATABASE）已对各领域给出实现层设计支撑：生效边界与 sync-client（DESIGN §2.2、UI §4）、数据模型与存储（DATABASE §2/§3/§4）、列表与查询（UI §2、API §4.1/§4.2、DATABASE §4.1）、异常展示（UI §2.2、DESIGN §4.7/§4.8）、查看详情（UI §3、API §4.3）、新增/编辑弹窗与搜索（UI §4/§5、API §4.1/§4.6）、目标库选择（UI §5）、Schema 与表选择（UI §6、API §4.4/§4.5、DATABASE §4.8）、新增保存（API §4.6、DATABASE §4.3）、编辑（API §4.8、DATABASE §4.4、UI §7.1-§7.4）、并发保护（DESIGN §5、DATABASE §5、API §4.8/§4.10）、删除（API §4.9/§4.10、DATABASE §4.5、UI §7.5）、通用交互/安全/延期（DESIGN §6/§7、UI §8）。
- 结果：`acceptance_design_coverage_status=COMPLETE`。设计覆盖不等于验收通过；126 条仍全部 `NOT_RUN`。

## 16. Requirements/Acceptance 零改动

- `REQUIREMENTS.md`（107 条）与 `ACCEPTANCE.md`（126 条）相对基准提交 `4747b03...` **零 diff**；文档状态均保持 `APPROVED`；126 条验收全部 `NOT_RUN`（0 条非 `NOT_RUN`）。
- 本任务未触碰任何需求行或验收行；未改变任何已批准需求或验收标准。

## 17. 状态保护和大屏延期

- 需求状态保持 `APPROVED`；验收标准状态保持 `APPROVED`；设计状态保持 `DRAFT_PENDING_USER_REVIEW`（四份设计文档 R1 后仍为草案，待重新正式复审）；实现状态保持 `NOT_STARTED`；验收执行状态保持 126 条 `NOT_RUN`。
- 大屏调整状态保持 `DEFERRED_AFTER_DATA_SUBSCRIPTION_FEATURE_ACCEPTANCE`（`DSUB-REQ-107`）；未修改 `docs/features/large-screen/` 任何文件（`large_screen_adjustment_status=DEFERRED_AFTER_DATA_SUBSCRIPTION_FEATURE_ACCEPTANCE`）。

## 18. 数据库、代码、测试和外部系统操作状态

- 数据库访问：`NONE`；数据库写入：`NONE`；DDL/DML：`NONE`。
- 业务代码修改：`NONE`；测试代码修改：`NONE`。
- ZooKeeper：`NONE`；Kafka：`NONE`；`sync-client` 及其他业务进程操作：`NONE`。
- 未运行 Maven、npm 或前后端测试；未启动任何服务；未访问数据库（纯文档任务）。

## 19. 验证命令和结果

| # | 验证项 | 命令/方式 | 结果 |
|---|---|---|---|
| 1 | REQUIREMENTS、ACCEPTANCE 相对 `4747b03...` 零 diff | `git diff 4747b03 -- REQUIREMENTS.md ACCEPTANCE.md` | 零 diff |
| 2 | 需求/验收仍为 `APPROVED` | `grep '^\| 文档状态 \|' REQUIREMENTS.md ACCEPTANCE.md` | `APPROVED` / `APPROVED` |
| 3 | 107/126 数量保持，126 条全部 `NOT_RUN` | `grep -oE 'DSUB-REQ-[0-9]{3}' \| sort -u \| wc -l`；`grep -cE '^\| DSUB-AC-[0-9]{3} \|'`；非 `NOT_RUN` 计数 | 107 / 126 / 0 |
| 4 | DESIGN/API/UI/DATABASE 均为 `DRAFT_PENDING_USER_REVIEW` | `grep '^\| 文档状态 \|'` 四份设计文档 | 全部 `DRAFT_PENDING_USER_REVIEW` |
| 5 | 并发 SQL 明确含 `FOR UPDATE`，无普通 selectById 防竞态错误结论 | `grep FOR UPDATE`；检索“selectById + @Transactional 即可避免” | `FOR UPDATE` 存在；错误结论 0 |
| 6 | 查询伪代码两个独立 AND 组，覆盖四种组合 | 人工审查 DATABASE §4.1 | 通过 |
| 7 | token 匹配不受 LIKE 通配符影响 | `grep INSTR`；人工审查 | 通过（`INSTR(','\|\|col\|\|',', ','\|\|#{token}\|\|',') > 0`） |
| 8 | `sourceTables` 保存请求唯一类型 `SourceTableInput[]` | 逐文件检索保存请求 | 唯一类型 |
| 9 | PRESERVE/REPLACE 在四文档一致 | 逐文件核对 `sourceSelectionMode` | 一致 |
| 10 | API 总览恰好 10 个能力，删除预览令牌链路闭环 | `sed -n '§2' API.md`；人工核对 | 10 个；闭环 |
| 11 | `DATA_SUB_ID` 明确 `IdType.INPUT`，不再声称默认不生成 | `grep IdType.INPUT`；检索“默认不自动生成” | `IdType.INPUT` 存在；“默认不自动生成”仅作否定表述出现 0 次错误结论 |
| 12 | 点号规则与已批准需求一致 | 逐文件核对 `DSUB-REQ-016/017` 与四份设计文档 | 一致 |
| 13 | Schema 过滤含 `ORACLE_MAINTAINED` 优先与回退方案 | `grep ORACLE_MAINTAINED` / `FALLBACK_EXCLUSION_LIST` | 通过 |
| 14 | 列表表数量包含所有非空 token | 人工核对 DESIGN §4.5 / API §4.2 | 通过 |
| 15 | 错误码表数量与摘要一致 | 逐条计数 API §7 错误码表 | 26 条 = 摘要“共 26 个” |
| 16 | 无“message 汇总或其他方式”等候选契约 | 逐文件检索 | 0（仅否定表述出现） |
| 17 | 新增重复提交边界表述准确 | 人工核对 DESIGN §5.4 / API §4.6 | 通过（首期未设计请求幂等键） |
| 18 | 数据源展示映射不加载密码字段 | 人工核对 DESIGN §7.4 / DATABASE §4.6 | 通过（最小字段投影） |
| 19 | subscription 不写数据源类别 | 人工核对 API §8 TBD-02 / DATABASE §4.6 | 通过 |
| 20 | 107 条需求追踪全部指向真实存在章节 | 自动提取引用并与各文档标题比对 | 通过（107 条全部命中） |
| 21 | 四份文档所有交叉引用目标存在 | 自动提取 `文档 §N(.M)` 引用并与标题比对 | 通过（无缺失） |
| 22 | 126 条验收领域均有实现设计支撑 | 13 个领域与四份设计文档逐项核对 | 通过 |
| 23 | 大屏延期状态保持 | `grep DEFERRED_AFTER_DATA_SUBSCRIPTION_FEATURE_ACCEPTANCE` | 保持 |
| 24 | 无敏感信息 | 对 6 个文件执行敏感信息关键词扫描（口令/连接串/内网数据库地址/token 等） | 无 |
| 25 | 代码、测试、项目基线、数据库基线和大屏零 diff | `git diff --name-status` | 无此类文件进入提交（任务开始前已存在的 `docs/database/TASK3/4*` 删除等无关修改保持原样） |
| 26 | Markdown 标题、表格、链接、代码块检查 | 人工审查 + `git diff --check` | 通过 |
| 27 | `git diff --check` | `git diff --check` | exit=0 |
| 28 | `git diff --name-status` 仅含 6 个授权文件 | `git diff --name-status` | 通过 |
| 29 | 逐文件审查 staged diff | 逐文件 `git diff --cached` | 通过 |
| 30 | 提交前后记录 `git status --short` | 提交前后记录 | 无授权文件残留 |
| 31 | 推送后本地 HEAD / origin/develop / 远程一致 | `git rev-parse HEAD` / `git rev-parse origin/develop` | 见控制台结果块 |
| 32 | 推送后 ahead/behind 为 `0 0` | `git rev-list --left-right --count origin/develop...HEAD` | 见控制台结果块 |

本任务不运行 Maven、npm 或前后端测试，不启动服务，不访问数据库（纯文档任务）。

## 20. Commit 与 Push 证据

本任务 Commit 与 Push 结果（result_commit_id / remote_commit_id / ahead/behind / commit_status / push_status）在控制台 `AGENT_TASK_RESULT` 结果块输出。遵循既有报告约定，本报告不预先伪造尚未产生的提交号。

- 提交方式：只逐文件暂存 6 个授权文件（1 新增 + 5 修改），未全量暂存。
- 提交信息体现“设计基线 R1 定向修订”（建议信息：`docs(data-subscription): revise design baselines R1`），不暗示设计批准或功能实现。
- 普通推送至 `origin/develop`，未 force push；推送失败或本地与远程不一致时不得报告 `SUCCESS`。

## 21. 仍需正式复审的风险（不得虚构已批准）

- 本任务只修正 ChatGPT 复审发现项并同步已批准点号规则；**四份设计文档仍为 `DRAFT_PENDING_USER_REVIEW` 草案，未获正式复审批准**。
- R1 完成后必须再次交由 ChatGPT 正式设计复审；正式复审结论可能继续提出新的修订要求。
- 实现阶段（`NOT_STARTED`）尚未开始；126 条验收（全部 `NOT_RUN`）尚未执行。
- 设计草案中仍存在待实现阶段验证的边界（如 `ALL_USERS.ORACLE_MAINTAINED` 列的实际可查询权限、源 Oracle 元数据批量查询的实际连通性、`ConnectionTester` 脱敏分类的落地复用等），需在实现阶段结合实际环境验证，不构成本任务验收通过声明。

本报告不声称设计已批准、功能已实现或验收已通过。

---

*报告生成：DATA-SUBSCRIPTION-DESIGN-BASELINE-001-R1（纯文档设计基线 R1 定向修订）。本任务只修正设计复审发现项并同步已批准点号规则；设计仍为 `DRAFT_PENDING_USER_REVIEW` 草案待重新正式复审，功能未实现，126 条验收未执行。*
