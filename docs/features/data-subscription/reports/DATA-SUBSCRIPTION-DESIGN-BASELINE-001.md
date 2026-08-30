# 任务执行报告：数据订阅设计基线草案建立（DATA-SUBSCRIPTION-DESIGN-BASELINE-001）

## 1. 任务编号、性质与状态

| 项目 | 值 |
|---|---|
| 任务编号 | `DATA-SUBSCRIPTION-DESIGN-BASELINE-001` |
| 前序任务 | `DATA-SUBSCRIPTION-REQUIREMENTS-BASELINE-APPROVAL-001-R1` |
| 前序结果提交 | `2f186344874967758f2666b3419a58d3366a4459` |
| 任务性质 | 纯文档设计基线草案建立（不修改业务代码、不访问数据库写入、不执行 DDL） |
| Feature | 数据订阅（`data-subscription`） |
| 最终状态 | `SUCCESS`（本报告记录的是本任务设计草案落盘结果；**本报告自身不把设计草案写成已批准**） |
| 分支 | `develop` |
| 基准提交（base_commit_id） | `2f186344874967758f2666b3419a58d3366a4459` |
| 结果提交（result_commit_id） | 见控制台 `AGENT_TASK_RESULT`（本报告不预先伪造尚未产生的提交号） |
| 远程提交（remote_commit_id） | 见控制台 `AGENT_TASK_RESULT` |
| ahead/behind | 见控制台 `AGENT_TASK_RESULT` |
| commit_status / push_status | 见控制台 `AGENT_TASK_RESULT` |

设计基线状态：`DESIGN / API / UI / DATABASE` 四份文档均为 `DRAFT_PENDING_USER_REVIEW`；实现状态保持 `NOT_STARTED`；126 条验收保持 `NOT_RUN`；需求/验收基线保持 `APPROVED`。

## 2. 分支、基准提交、结果提交、远程提交与 ahead/behind

- 分支：`develop`。
- 基准提交（base_commit_id）：`2f186344874967758f2666b3419a58d3366a4459`（任务开始前本地 HEAD 与 `origin/develop` 一致）。
- 结果提交 / 远程提交 / ahead/behind / commit_status / push_status：本任务 Commit 与 Push 结果在控制台 `AGENT_TASK_RESULT` 结果块输出，不在本报告中伪造尚未产生的提交号（遵循既有报告约定）。

## 3. 开始前工作区状态与既有修改保护结果

执行开始前记录（`git branch --show-current` / `git status --short` / `git rev-parse HEAD` / `git rev-parse origin/develop` / `git rev-list --left-right --count origin/develop...HEAD` / `git show --stat --oneline 2f186344874967758f2666b3419a58d3366a4459`）：

- 当前分支：`develop`。
- 本地 HEAD：`2f186344874967758f2666b3419a58d3366a4459`。
- `origin/develop`：`2f186344874967758f2666b3419a58d3366a4459`（与本地一致，ahead/behind = `0 0`）。
- 开始前工作区存在大量与本任务无关的既有修改与未跟踪文件（如 `.claude/settings.local.json`、`agent-env.sh`、`frontend/src/**`、`docs/agent-prompts/**`、`docs/database/TASK3/4*` 删除、`docs/features/large-screen/` 未跟踪目录等），本任务未清理、未回滚、未覆盖、未暂存、未提交任何既有修改。
- 本任务 5 个拟新增文件（DESIGN.md、API.md、UI.md、DATABASE.md、本报告）与 1 个拟修改文件（docs/features/README.md）在开始前均无未提交修改，可安全处理。
- 未使用 `git add .`、`git add -A` 等全量暂存；只逐文件暂存本任务授权文件。
- 未执行任何破坏性 Git 命令。

## 4. 阅读的权威文档与真实代码清单

权威文档（完整或定向阅读）：

- 根目录 `CLAUDE.md`。
- `docs/baseline/`：`PROJECT.md`、`ENVIRONMENT.md`、`ARCHITECTURE.md`、`DEVELOPMENT_RULES.md`、`PROJECT_STATUS.md`、`DOMAIN_GLOSSARY.md`。
- `docs/features/README.md`。
- `docs/features/data-subscription/`：`REQUIREMENTS.md`（APPROVED）、`ACCEPTANCE.md`（APPROVED）、`reports/DATA-SUBSCRIPTION-REQUIREMENTS-BASELINE-001.md`、`...-001-R1.md`、`...-APPROVAL-001.md`。
- `docs/database/`：`SCHEMA.md`、`DATA_PROFILE.md`、`tables/CDC_DATA_SUBSCRIBE.md`、`tables/CDC_DATA_SOURCE.md`。
- `docs/features/FEATURE_DEVELOPMENT_AND_ADJUSTMENT_PROCESS.md`。

真实代码只读核验（`rg` / Read）：

- 前端：`frontend/src/config/menu.ts`（订阅菜单项）、`frontend/src/router/index.ts`（订阅路由）、`frontend/src/views/data-subscribe/DataSubscribePage.vue`（占位页）、`frontend/src/api/dataSource.ts`（API 封装模式）、`frontend/src/types/dataSource.ts`（类型模式）、`frontend/src/services/http`（axios 封装引用）。
- 后端：`datasource/controller/DataSourceController.java`（Controller/API 模式）、`datasource/service/impl/DataSourceServiceImpl.java`（目标库规则 `UPPER(DATA_SOURCE_CATEGORY)='TARGET'`、`requireTargetRecord`/`assertTypeCompatible` 大小写兼容、列表/详情/CRUD 模式）、`datasource/exception/DataSourceErrorCode.java`、`datasource/enums/DataSourceCategoryEnum.java`、`datasource/connection/ConnectionTester.java` + `ConnectionFactory.java`（动态 JDBC 连接、超时属性、脱敏消息）、`datasource/entity/DataSource.java`。
- `largescreen/stats/entity/DataSubscribeEntity.java`（`@TableId("DATA_SUB_ID")` 无 IdType）、`largescreen/stats/executor/BatchTransactionExecutor.java`（`UUID.randomUUID().toString()` 先例）。
- `config/MyBatisPlusConfig.java`（无全局 id-type 配置）。
- `common/api/ApiResponse.java`、`common/exception/BusinessException.java`、`GlobalExceptionHandler.java`（统一响应与异常）。
- `serverconfig/controller/ServerConfigController.java`、`serverconfig/exception/ServerConfigErrorCode.java`（已实现 Feature 的分层与错误码模式）。
- `docs/database/tables/CDC_DATA_SUBSCRIBE.md`、`CDC_DATA_SOURCE.md`（字段/约束/索引/无触发器/无序列）。

## 5. 当前实现事实摘要

- 前端为 `PlaceholderPage` 占位页（`views/data-subscribe/DataSubscribePage.vue`）；菜单/路由已存在（`/config/subscribe`），无任何订阅管理业务能力。
- 后端无 `cdc-config` 写入 `CDC_DATA_SUBSCRIBE` 的实现；该表当前由人工维护；仅大屏统计模块只读消费（`largescreen/stats`）。
- `CDC_DATA_SUBSCRIBE` 主键 `PK_CDC_DATA_SUBSCRIBE`（`DATA_SUB_ID` VARCHAR2(32) NOT NULL）为数据库真实主键（`DATABASE_VERIFIED`）；无触发器、无序列、无默认值。
- `CDC_DATA_SOURCE.DATA_SOURCE_CATEGORY` 存量大小写混用（target=10、SOURCE=5、source=4，开发库瞬时画像）；目标规则统一大写，程序已做大小写兼容。

## 6. 新增/修改文件清单

新增：

1. `docs/features/data-subscription/DESIGN.md`
2. `docs/features/data-subscription/API.md`
3. `docs/features/data-subscription/UI.md`
4. `docs/features/data-subscription/DATABASE.md`
5. `docs/features/data-subscription/reports/DATA-SUBSCRIPTION-DESIGN-BASELINE-001.md`（本报告）

修改：

6. `docs/features/README.md`（仅 `data-subscription` 一行与变更记录定向更新）

未修改：REQUIREMENTS、ACCEPTANCE、所有既有报告、`docs/baseline/`、`docs/database/`、`docs/features/large-screen/`、任何代码与测试文件。

## 7. 四份设计文档内容摘要

### 7.1 DESIGN.md

- 元数据与状态（`DRAFT_PENDING_USER_REVIEW`、`NOT_STARTED`、126 条 `NOT_RUN`）。
- 当前事实与目标架构：占位现状、推荐后端包结构（`subscription` 模块）与前端目录结构、与数据源模块/源库元数据/`CDC_DATA_SUBSCRIBE` 的依赖关系、不通知 sync-client 的生效边界。
- 核心流程：首次进入与查询、详情、新增、编辑正常路径、断连有限编辑、异常数据源修复、删除与并发、多源库异常只展示。
- 领域解析和规范化：逗号多值拆分/去空格/去重/稳定拼接、`DATA_SOURCE_ID.Schema.表名` 解析校验与异常保留、大小写保持、表数量只依赖 `DATA_SOURCE_TABLE`、遗留字段规则、多源库异常识别、停用/不存在映射。
- 并发与幂等：内容指纹版本令牌（SHA-256，无新列）、并发场景处理、事务边界与受影响行数检查。
- 源 Oracle 元数据访问：连接信息使用、连接管理、Schema 范围、表批量加载与保存前批量复核、目标库只选不连。
- 安全/性能/可观测性：参数化 SQL、口令/连接串/堆栈脱敏、不分页规模边界、240 张表性能、loading/防重复提交/超时、日志敏感字段边界。
- 需求追踪：`DSUB-REQ-001` ~ `DSUB-REQ-107` 全量映射（见 §8）。

### 7.2 API.md

- 9 个能力接口总览：options、列表、详情、Schema 列表、表列表、新增、编辑打开（回显+版本令牌）、编辑保存、物理删除。
- 每个接口的方法/路径/用途、参数必填、字段类型、字符串 ID 规则、示例 JSON、校验、鉴权现状边界、事务边界、错误码/消息、并发冲突、源库连接失败与失效项响应、敏感字段不返回。
- 查询语义汇总（OR/OR/AND、不分页、重置纯前端、token 精确匹配、默认排序）。
- 与数据库字段映射、业务错误码表（40310~50041）、TBD-01/TBD-02 设计草案结论。

### 7.3 UI.md

- 列表页（查询区、列顺序、源表“共 N 张”悬停、目标库标签、停用/不存在展示、多源库异常整行警示、loading/空/失败状态）。
- 查看详情（居中只读弹窗、不连接源 Oracle、按 Schema 分组、限高滚动、可解析/异常分区展示、不展示遗留字段）。
- 新增/编辑弹窗总体布局（94vw×92vh、标题栏拖动、无右侧已选面板、防重复提交、保存成功提示）。
- 表单顶部（描述必填、源库可搜索单选下拉及排序/高亮/选中态、目标库紧凑复选卡片）。
- Schema 与表选择区（左 Schema 右表格、缓存、搜索、全选/只看已选/清空、已选数量展示、120~240 张表规模）。
- 编辑和删除状态（回显、断连有限编辑、异常数据源、并发冲突、删除确认）。
- 视觉状态规格（默认/悬停/选中/禁用/加载/错误/警告/空状态，沿用 Element Plus 与既有设计令牌）。

### 7.4 DATABASE.md

- 物理现状：`CDC_DATA_SUBSCRIBE`/`CDC_DATA_SOURCE` 权威字段事实、主键、无触发器/序列/外键、无 DDL。
- 字段读写矩阵：11 个字段在新增/编辑/查询/删除下的行为，含遗留字段与时间字段规则。
- SQL 与持久化设计：列表（只查启用、无分页、默认排序、token 精确匹配 `',' || col || ',' LIKE '%,' || token || ',%'`）、详情、新增（`SYSDATE`）、带并发条件更新、带并发条件物理删除、受影响行数检查、数据源候选/映射、Schema/表批量查询（MyBatis-Plus 等价伪代码）。
- 事务与并发：新增/编辑/删除事务边界、先校验后写入、指纹并发比较、`UPDATE_TIME` 为空处理、不存在与冲突区分、无版本列。
- 无 DDL 结论：第一版复用现有表结构，不新增表/列/索引/约束/触发器/序列；性能索引建议仅作未来独立评估项。

## 8. 107 条需求追踪覆盖结果

`DESIGN.md` §8 需求追踪表已完整映射 `DSUB-REQ-001` ~ `DSUB-REQ-107`（107 条，连续、唯一），每条至少映射到一个具体章节（DESIGN/API/UI/DATABASE），无“全部覆盖”式空泛表述。核对结果：107 条全部有设计覆盖，无遗漏。

## 9. 126 条验收可实现性/可测试性复核结果

- `ACCEPTANCE.md` 126 条（`DSUB-AC-001` ~ `DSUB-AC-126`，连续、唯一，全部 `NOT_RUN`）按 13 个领域分类（§4.1~§4.13：生效边界、数据模型、列表查询、异常展示、详情、弹窗交互、目标库选择、Schema 与表选择、新增保存、编辑、并发、删除、通用交互与延期项）。
- 设计覆盖复核：四份设计文档已覆盖每个验收领域对应需求的实现层决策（DESIGN 流程/解析/并发、API 接口与错误码、UI 交互状态、DATABASE 读写与事务）。验收用例当前不执行（`NOT_RUN`），本任务只复核“可实现性/可测试性”，不判定通过/失败。

## 10. TBD-01、TBD-02 的核验依据与设计草案结论

### 10.1 TBD-01：`DATA_SUB_ID` 生成方式

核验依据：

- `CDC_DATA_SUBSCRIBE.DATA_SUB_ID`：VARCHAR2(32)、NOT NULL、主键 `PK_CDC_DATA_SUBSCRIBE`；无默认值、无触发器、无序列（已批准数据库基线 `tables/CDC_DATA_SUBSCRIBE.md`）。
- `largescreen/stats/entity/DataSubscribeEntity.java`：`@TableId("DATA_SUB_ID")` 未指定 IdType。
- `config/MyBatisPlusConfig.java`：仅注册 `PaginationInnerInterceptor`，无全局 id-type → MyBatis-Plus 默认 `IdType.NONE`（不自动生成）。
- 项目内未发现 snowflake 生成器（`SnowflakeIdBoundaryCalculator` 仅计算时间→ID 边界，不生成）；存在 `UUID.randomUUID().toString()` 先例（`BatchTransactionExecutor`）。
- Oracle 无相关默认值/序列/触发器证据。

设计草案结论：**新增时由后端 Service 生成 32 位无连字符 UUID**（`UUID.randomUUID().toString().replace("-", "")`），恰好 32 字符满足 `VARCHAR2(32)`；在 `INSERT` 前设置；碰撞由主键约束兜底（重复插入抛主键冲突并回滚）。前端不感知、不生成、不展示 ID 生成逻辑。测试边界：长度 32、十六进制格式、调用不重复；构造已存在 ID 验证主键冲突被正确拒绝。

### 10.2 TBD-02：源库/目标库类别匹配规则

核验依据：

- `CDC_DATA_SOURCE.DATA_SOURCE_CATEGORY`：VARCHAR2(30)，注释“取值 source/target，大小写都行（目标规则为统一大写，程序已做兼容）”。
- 真实代码：`DataSourceServiceImpl.targetOptions()` 用 `UPPER(DATA_SOURCE_CATEGORY) = 'TARGET'` + `FG_ACTIVE='1'`；`DataSourceNamingStrategyServiceImpl` 第 216 行同规则；`requireTargetRecord` 用 `"TARGET".equalsIgnoreCase(...)`；`assertTypeCompatible` 用 `"SOURCE".equalsIgnoreCase(...)`；`DataSourceCategoryEnum.isValid` 仅接受大写，`normalize` 统一大写。
- 数据画像：`DATA_SOURCE_CATEGORY` 大小写混用（target=10、SOURCE=5、source=4，开发库瞬时画像）。

设计草案结论：**源库候选/校验** `UPPER(DATA_SOURCE_CATEGORY)='SOURCE'` 且 `FG_ACTIVE='1'`；**目标库候选/校验** `UPPER(DATA_SOURCE_CATEGORY)='TARGET'` 且 `FG_ACTIVE='1'`；候选查询、保存校验、`options` 接口使用同一规则。内存比较（读取存量）用 `equalsIgnoreCase`；输入 trim 后统一大写（复用 `normalize`）。空值不匹配任何类别。

## 11. 跨文档一致性检查

- 四份文档使用相同 API 路径（`/api/subscriptions/...`）、DTO 字段名（`dataSubId`/`dataSubDesc`/`dataFromSourceId`/`dataToSourceIds`/`sourceTables`/`versionToken`）、错误码（40310~50041）、状态与术语。
- UI 操作均有对应 API 与后端处理；API 字段均能映射到数据库字段或明确派生字段（见 API.md §6 映射表）。
- 数据库并发设计（内容指纹，DATABASE.md §5）与 API 版本令牌（`versionToken`）一致。
- 源库断连有限编辑在 DESIGN §3.5、UI §7.3、API §4.8、DATABASE §4.4 一致。
- 历史异常记录边界（多源库异常、不可解析内容）在四份文档一致。
- 新增/编辑遗留字段规则一致（新增 NULL、编辑保持原值）。
- 查询重置语义一致（重置只清空表单，不调用查询 API）。
- 目标库只选择不连接在 DESIGN §6.5、API §4.4、DATABASE §4.8 一致。
- 无任何设计结论与 107 条需求或 126 条验收冲突。

## 12. 需求/验收基线零改动检查

- `REQUIREMENTS.md`、`ACCEPTANCE.md` 相对 `2f186344874967758f2666b3419a58d3366a4459` 零 diff（验证见 §17）。
- 既有 5 份报告零 diff；`docs/baseline/`、`docs/database/`、大屏文档零 diff。
- 未改变需求/验收编号、数量与状态。

## 13. 实现状态和验收状态保护

- 实现状态：`NOT_STARTED`（REQUIREMENTS/ACCEPTANCE 保持不变；无任何业务代码改动）。
- 验收执行状态：126 条全部 `NOT_RUN`。
- 设计状态：DESIGN/API/UI/DATABASE 均为 `DRAFT_PENDING_USER_REVIEW`，未写成 `APPROVED`；本任务未批准设计。

## 14. 大屏延期项保护

- 大屏调整状态保持 `DEFERRED_AFTER_DATA_SUBSCRIPTION_FEATURE_ACCEPTANCE`（`DSUB-REQ-107`）。
- 未修改大屏业务代码；未修改 `docs/features/large-screen/` 任何文件；未设计本 Feature 阶段修改大屏解析逻辑；延期项不作为本 Feature 验收阻断项。

## 15. 数据库访问、写入、DDL/DML 状态

- 数据库访问：`NONE`。TBD-01/TBD-02 与字段物理事实已由已批准数据库基线与真实代码充分确认，无需只读核验。
- 数据库写入：`NONE`；DDL/DML：`NONE`。
- 未连接任何源 Oracle 读取业务数据。

## 16. 业务代码、测试代码、ZooKeeper、Kafka、进程操作状态

- 业务代码修改：`NONE`；测试代码修改：`NONE`。
- ZooKeeper：`NONE`；Kafka：`NONE`；`sync-client` 及其他业务进程操作：`NONE`。
- 未运行 Maven、npm 或前后端测试；未启动任何服务（纯文档任务）。

## 17. 验证命令和结果

| 验证项 | 命令/方式 | 结果 |
|---|---|---|
| 1 四份设计文档 + 报告已创建、索引已更新 | `ls docs/features/data-subscription/`、`git status --short` | DESIGN/API/UI/DATABASE/报告存在；README 已更新 |
| 2 REQUIREMENTS/ACCEPTANCE/既有报告零 diff | `git diff --stat 2f18634 -- REQUIREMENTS ACCEPTANCE reports` | 零 diff |
| 3 基线/数据库/大屏/代码零 diff | `git diff --name-status` | 仅 6 个授权文件 |
| 4 需求/验收仍 APPROVED | `grep` 文档状态 | APPROVED |
| 5 设计状态全部 DRAFT_PENDING_USER_REVIEW | `grep` 四份文档状态 | 全部 DRAFT_PENDING_USER_REVIEW |
| 6 实现状态全部 NOT_STARTED | `grep NOT_STARTED` | 四份设计文档 + REQUIREMENTS/ACCEPTANCE 均为 NOT_STARTED |
| 7 126 条验收全部 NOT_RUN | `grep NOT_RUN ACCEPTANCE` | 126 条全 NOT_RUN |
| 8 DSUB-REQ-001~107 追踪无遗漏 | `grep -oE DSUB-REQ-[0-9]{3} DESIGN.md \| sort -u` | 107 条连续唯一 |
| 9 API/UI/DATABASE 与 DESIGN 交叉引用一致 | 人工核对 §11 | 通过 |
| 10 TBD-01/02 有证据支持的唯一结论 | 人工核对 §10 | 通过（DESIGN_DRAFT_RESOLVED） |
| 11 无明文口令/完整连接串/敏感数据 | `grep -inE 'password|jdbc:|192.168.174.65'` 四份文档 | 无敏感信息（DESIGN 提及口令时均为“不落日志/不返回”说明） |
| 12 大屏延期状态保持 | `grep DEFERRED_AFTER_DATA_SUBSCRIPTION_FEATURE_ACCEPTANCE` | 保持 |
| 13 无新增 DDL 或实现授权 | 人工核对 DATABASE.md §5.3 | 明确无 DDL |
| 14 Markdown 标题/表格/代码块/链接检查 | 人工审查 + `git diff --check` | 通过 |
| 15 `git diff --check` | `git diff --check` | exit=0 |
| 16 `git diff --name-status` | `git diff --name-status` | 仅 6 个授权文件 |
| 17 逐文件审查 staged diff | 逐文件 `git diff --cached` | 通过 |
| 18 提交前后 `git status --short` | 提交前后记录 | 无授权文件残留未暂存/未提交 |
| 19 推送后本地 HEAD/origin/develop/远程一致 | `git rev-parse HEAD`/`git rev-parse origin/develop` | 见控制台结果块 |
| 20 推送后 ahead/behind 为 0 0 | `git rev-list --left-right --count origin/develop...HEAD` | 见控制台结果块 |

## 18. Commit 与 Push 证据

本任务 Commit 与 Push 结果（result_commit_id / remote_commit_id / ahead/behind / commit_status / push_status）在控制台 `AGENT_TASK_RESULT` 结果块输出。遵循既有报告约定，本报告不预先伪造尚未产生的提交号。

- 提交方式：只逐文件暂存 6 个授权文件（5 新增 + 1 修改），未全量暂存。
- 提交信息体现“设计基线草案”，不暗示设计已批准或功能已实现。
- 普通推送至 `origin/develop`，未 force push。

## 19. 仍需 ChatGPT 正式复审的设计风险或问题

1. **设计草案未批准**：DESIGN/API/UI/DATABASE 四份文档均为 `DRAFT_PENDING_USER_REVIEW`，必须由项目负责人/ChatGPT 正式复审，不得直接视为批准。
2. **版本令牌方案**：内容指纹（SHA-256，含业务字段 + 时间字段，DESIGN §5.1 / DATABASE §5.2）为不新增版本列的并发方案；其保守误报特性（人工仅改时间字段也触发冲突）需复审确认是否接受。
3. **实体复用决策**：订阅模块是否新建 `subscription/entity/DataSubscribe`（推荐，避免模块倒置耦合）还是复用 `largescreen/stats/entity/DataSubscribeEntity`，需复审确认（DESIGN §2.2）。
4. **表标识传输格式**：`sourceTables` 以完整 `DATA_SOURCE_ID.Schema.表名` 传输（API.md §4.6）为设计选择，需复审确认。
5. **元数据 Schema 排除**：系统 Schema 采用维护清单排除（DESIGN §6.3），未依赖 `ORACLE_MAINTAINED`；如源库版本支持可作为补充过滤，需在实现前确认源库版本。
6. **`DELETE_TIME` 不维护**：物理删除不写 `DELETE_TIME`（数据库基线字段仍存在），需复审确认与人工维护既有数据语义无冲突。

---

*报告生成：DATA-SUBSCRIPTION-DESIGN-BASELINE-001（纯文档设计基线草案建立）。设计草案状态为 `DRAFT_PENDING_USER_REVIEW`，未获正式复审批准；本任务不表示数据订阅功能已实现或验收已通过。*
