# 任务执行报告：数据订阅需求与验收基线（DATA-SUBSCRIPTION-REQUIREMENTS-BASELINE-001）

## 1. 任务元数据与最终状态

| 项目 | 值 |
|---|---|
| 任务编号 | `DATA-SUBSCRIPTION-REQUIREMENTS-BASELINE-001` |
| 任务性质 | 需求与验收基线、数据库物理事实定向核验、纯文档任务 |
| 最终状态 | `SUCCESS` |
| 分支 | `develop` |
| 基准提交（base_commit_id） | `a98811c5c7aab1df7685231982c06ed339253008` |
| 结果提交（result_commit_id） | 见 §3（提交并推送后回填） |
| 远程提交（remote_commit_id） | 见 §3（推送后回填） |
| ahead/behind | 见 §3 |

## 2. 开始前工作区状态及既有修改保护情况

执行开始前记录（`git branch --show-current` / `git status --short` / `git rev-parse HEAD`）：

- 当前分支：`develop`。
- 本地 HEAD：`a98811c5c7aab1df7685231982c06ed339253008`。
- `origin/develop`：`a98811c5c7aab1df7685231982c06ed339253008`（本地与远程一致，`git rev-list --left-right --count origin/develop...HEAD` = `0 0`）。
- 开始前工作区存在大量与本任务无关的既有修改与未跟踪文件（如 `.claude/settings.local.json`、`agent-env.sh`、`frontend/src/**`、`docs/agent-prompts/**`、`docs/database/TASK3/4*` 删除、`docs/features/large-screen/` 未跟踪目录等）。

本任务遵守脏工作区保护规则：

- 未清理、回滚、覆盖、暂存或提交任何任务开始前已存在的修改。
- 本任务目标文件（新建 `docs/features/data-subscription/REQUIREMENTS.md`、`ACCEPTANCE.md`、报告；已跟踪未修改的 `docs/database/tables/CDC_DATA_SUBSCRIBE.md`、`docs/database/SCHEMA.md`、`docs/database/DATA_PROFILE.md`、`docs/database/CHANGELOG.md`）在开始前均无既有修改，可直接安全编辑。
- 未使用 `git add .`、`git add -A` 等全量暂存命令；只逐文件暂存本任务授权文件。
- 未执行任何破坏性 Git 命令。

## 3. 分支、基准提交、结果提交、远程提交与 ahead/behind

| 项目 | 值 |
|---|---|
| 分支 | `develop` |
| 基准提交（base_commit_id） | `a98811c5c7aab1df7685231982c06ed339253008`（执行时实际 `origin/develop` 最新提交） |
| 结果提交（result_commit_id） | 包含本报告自身的最终 Commit ID 无法在同一 Commit 内自洽生成，故本报告只记录授权基准提交；最终 `result_commit_id`、`remote_commit_id`、`ahead_behind` 在控制台 `AGENT_TASK_RESULT` 中输出，推送后由人工/ChatGPT 直接核验远程提交一致性。本报告不保留任何伪装成实际值的尖括号占位符。 |

## 4. 实际读取的基线、代码和数据库对象

### 4.1 项目级正式基线

- `docs/baseline/PROJECT.md`
- `docs/baseline/ENVIRONMENT.md`
- `docs/baseline/ARCHITECTURE.md`
- `docs/baseline/DEVELOPMENT_RULES.md`
- `docs/baseline/PROJECT_STATUS.md`
- `docs/baseline/DOMAIN_GLOSSARY.md`

### 4.2 数据库物理基线

- `docs/database/README.md`
- `docs/database/SCHEMA.md`
- `docs/database/DATA_PROFILE.md`
- `docs/database/CHANGELOG.md`
- `docs/database/tables/CDC_DATA_SUBSCRIBE.md`
- `docs/database/tables/CDC_DATA_SOURCE.md`（类别/连接字段引用）

### 4.3 现有 Feature 基线格式

- `docs/features/data-source-management/REQUIREMENTS.md`（格式与状态规则）
- `docs/features/data-source-management/ACCEPTANCE.md`（验收编号/状态模型/追踪矩阵格式）
- `docs/features/README.md`（Feature 索引，`data-subscribe` 当前状态 `BASELINE_NOT_ESTABLISHED`）

### 4.4 真实代码（只读）

- `backend/src/main/java/com/bsoft/cdcconfig/largescreen/stats/entity/DataSubscribeEntity.java`（`@TableName("CDC_DATA_SUBSCRIBE")`、`@TableId("DATA_SUB_ID")`、12 字段映射）
- `backend/src/main/java/com/bsoft/cdcconfig/largescreen/stats/mapper/DataSubscribeMapper.java`（`extends BaseMapper<DataSubscribeEntity>`）
- `backend/src/main/java/com/bsoft/cdcconfig/largescreen/stats/service/impl/LargeScreenServiceImpl.java`（按 `FG_ACTIVE='1'` 读取订阅配置；`DATA_SOURCE_TABLE` 按换行符拆分位置见 §11）
- `backend/src/main/java/com/bsoft/cdcconfig/datasource/connection/ConnectionTester.java`（动态 JDBC 连接能力）
- `backend/src/main/java/com/bsoft/cdcconfig/datasource/service/impl/DataSourceServiceImpl.java`（类别匹配：`UPPER(DATA_SOURCE_CATEGORY) = 'TARGET'`）
- `backend/src/main/java/com/bsoft/cdcconfig/datasource/entity/DataSource.java`
- `frontend/src/router/index.ts`（`/config/subscribe`，name `DataSubscribe`）
- `frontend/src/config/menu.ts`（菜单“数据订阅”）
- `frontend/src/views/data-subscribe/DataSubscribePage.vue`（PlaceholderPage 占位页）

### 4.5 真实数据库对象（只读核验）

- `CDC_DATA_SUBSCRIBE` 表、`DATA_SUB_ID` 主键约束、主键索引、LAST_DDL_TIME（见 §6）。

## 5. 数据库访问、写入、DDL 状态

- 数据库访问：`READ_ONLY_VERIFIED`（仅执行定向只读 SELECT 查询 `ALL_CONSTRAINTS`、`ALL_INDEXES`、`ALL_IND_COLUMNS`、`ALL_OBJECTS`）。
- 数据库写入：`NONE`。
- DDL：`NONE`。
- 未创建测试记录、未修正数据、未提交/回滚/锁定业务数据；未在文档、报告、提交信息或控制台输出任何数据库口令、完整连接串或敏感数据。

## 6. `DATA_SUB_ID` 主键证据与状态

状态：**`DATABASE_VERIFIED`**（只读核验通过）。

只读核验 SQL（Oracle 数据字典，`ALL_CONSTRAINTS`/`ALL_IND_COLUMNS`/`ALL_INDEXES`/`ALL_OBJECTS`）证据：

| 检查项 | 核验结果 |
|---|---|
| 主键约束 | `PK_CDC_DATA_SUBSCRIBE`，类型 PRIMARY KEY（P），ENABLED，NOT DEFERRABLE IMMEDIATE；列 `DATA_SUB_ID`（position 1） |
| 主键索引 | `PK_CDC_DATA_SUBSCRIBE`：NORMAL、UNIQUE、VALID（表空间 USERS），列 `DATA_SUB_ID` |
| LAST_DDL_TIME | 表 `CDC_DATA_SUBSCRIBE` 与索引 `PK_CDC_DATA_SUBSCRIBE` 均为 2026-08-28 17:36:20（对象 VALID） |
| 数据完整性 | 此前基线 `DATA_PROFILE.md` §5 记录：`DATA_SUB_ID` 12 行 0 空值 0 重复（保留不变） |

结论：`DATA_SUB_ID` 是数据库真实主键，已按任务 §5.2 定向修正 `CDC_DATA_SUBSCRIBE.md`、`SCHEMA.md`、`DATA_PROFILE.md`、`CHANGELOG.md` 中的过期主键描述，并关闭原 D01。

## 7. 新增和修改文件清单

新增文件：

- `docs/features/data-subscription/REQUIREMENTS.md`
- `docs/features/data-subscription/ACCEPTANCE.md`
- `docs/features/data-subscription/reports/DATA-SUBSCRIPTION-REQUIREMENTS-BASELINE-001.md`

修改文件（仅定向修正过期主键描述及其直接衍生内容）：

- `docs/database/tables/CDC_DATA_SUBSCRIBE.md`（§1 主键、§2 字段注释、§3 约束、§4 索引、§9 D01 关闭、§10 变更记录）
- `docs/database/SCHEMA.md`（§2 行 4 主键列、§8 变更记录）
- `docs/database/DATA_PROFILE.md`（§7.2 D01 关闭、§7.3 P4 更新、§9 变更记录）
- `docs/database/CHANGELOG.md`（§2 SUBSCRIBE 历史冲突行更新、§3 D01 关闭、§4 变更记录）

## 8. 需求 ID 和验收项数量

- 需求：`DSUB-REQ-001 ~ DSUB-REQ-107`，共 **107** 条。
- 验收：`DSUB-AC-001 ~ DSUB-AC-126`，共 **126** 条，全部初始状态 `NOT_RUN`。
- 验收追踪：每条验收项映射一个或多个需求 ID；覆盖完整性见 `ACCEPTANCE.md` §5。

## 9. 关键需求覆盖摘要

- 生效边界与 sync-client 读取字段（`DSUB-REQ-001~006`）：只维护订阅记录；不操作 sync-client/ZooKeeper/Kafka/进程；增删改后统一提示“重启后生效”。
- 数据模型与存储规则（`DSUB-REQ-007~028`）：主键、单源库/多目标库/多源表协议、表格式 `DATA_SOURCE_ID.Schema.表名`、重复订阅允许、`FG_ACTIVE=1` 过滤、物理删除、时间字段、遗留字段保持。
- 列表页面（`DSUB-REQ-029~043`）：不分页、倒序、双多选查询 OR/AND、6 列、源库/目标库/源表展示、异常记录与异常数据源。
- 查看详情（`DSUB-REQ-044~051`）：居中只读弹窗、不连接源库、按 Schema 分组、异常警告、无法解析内容单独展示。
- 新增/编辑弹窗（`DSUB-REQ-052~080`）：94vw×92vh 可拖动弹窗、源库可搜索单选（四级排序）、目标库平铺多选、Schema 懒加载与缓存、表批量选择、120~240 张规模、无独立“已选源表”面板。
- 新增保存（`DSUB-REQ-081~087`）：后端重校验、一次连接按 Schema 批量校验、失效项拒绝并列出、防重复提交。
- 编辑规则（`DSUB-REQ-088~096`）：回显、断连有限编辑、异常数据源处理、字段保持。
- 并发保护（`DSUB-REQ-097~099`）：版本令牌/快照比较，拒绝覆盖。
- 删除规则（`DSUB-REQ-100~105`）：单源库记录物理删除、二次确认、并发标识。
- 通用与延期项（`DSUB-REQ-106~107`）：脱敏提示、防重复提交、大屏延期项。

## 10. 已发现的现状差异、冲突和待核验项

| 编号 | 事项 | 类型 |
|---|---|---|
| TBD-01 | `DATA_SUB_ID` 新增时具体生成格式 | 后续设计阶段确定 |
| TBD-02 | 源库/目标库类别匹配完整规则与大小写（当前代码事实：目标库匹配使用 `UPPER(DATA_SOURCE_CATEGORY)='TARGET'`） | 技术待核验 |
| TBD-03 | Feature 标识不一致：`docs/features/README.md` 用 `data-subscribe`，本 Feature 目录按任务提示词用 `data-subscription` | 现状差异，需项目负责人确认 |
| TBD-04 | `docs/baseline/ARCHITECTURE.md`、`PROJECT_STATUS.md`、`DOMAIN_GLOSSARY.md` 中残留 `CDC_DATA_SUBSCRIBE`“无主键/D01 PENDING_DECISION”过期描述 | 范围外，需独立授权的基线维护任务处理 |
| TBD-05 | 大屏 `DATA_SOURCE_TABLE` 按换行符拆分实现 | 明确延期项，见 §11 |

## 11. 大屏延期项的只读影响位置（DEFERRED_AFTER_DATA_SUBSCRIPTION_FEATURE_ACCEPTANCE）

`DATA_SOURCE_TABLE` 已确认使用英文逗号分隔，而当前大屏存在按换行符（`\n`）拆分的实现。只读识别的影响位置（**本任务与数据订阅 Feature 实现阶段均不修改**，状态 `DEFERRED_AFTER_DATA_SUBSCRIPTION_FEATURE_ACCEPTANCE`，执行时机为数据订阅 Feature 完成并正式验收后的独立任务）：

| 位置 | 文件 | 说明 |
|---|---|---|
| 订阅表数量统计 | `backend/.../largescreen/stats/service/impl/LargeScreenServiceImpl.java`（`countDistinctSubscribeTables`，`tableClob.split("\n")`） | 大屏订阅表数量统计按换行拆分 |
| 数据流向订阅表数量 | 同上（`buildDataFlows` 调用 `countSubscribedTables`） | 数据流向中的订阅表数量 |
| 订阅表数量方法 | 同上（`countSubscribedTables`，`tableClob.split("\n").length`） | 其他解析 `DATA_SOURCE_TABLE` 的大屏代码 |

此延期项不得成为数据订阅 Feature 的验收阻断项（`ACCEPTANCE.md` `DSUB-AC-121/122`）。

## 12. 验证命令与结果

| 验证项 | 命令/方式 | 结果 |
|---|---|---|
| Git 现场 | `git branch --show-current`、`git status --short`、`git rev-parse HEAD`、`git rev-parse origin/develop`、`git rev-list --left-right --count origin/develop...HEAD` | `develop`；HEAD 与 origin/develop 一致；`0 0` |
| 数据库主键只读核验 | SQL*Plus 只读查询 `ALL_CONSTRAINTS`/`ALL_IND_COLUMNS`/`ALL_INDEXES`/`ALL_OBJECTS` | `DATABASE_VERIFIED` |
| Markdown 结构 | 章节编号、表格与内部链接检查 | 通过（见 §13 后续补充命令） |
| 需求 ID 唯一性 | `DSUB-REQ-001~107` 全量枚举检查 | 见 §13 |
| 验收项到需求 ID 映射完整性 | 每条 `DSUB-AC` 关联需求检查 | 见 §13 |
| 授权文件范围 | 提交内容逐文件审计 | 仅含本任务授权文件 |
| `git diff --check` | 空白错误检查 | 见 §13 |
| 提交前后 `git status --short` | 提交范围核对 | 见 §13 |

## 13. 最终验证补充

提交前已执行以下补充验证：

- 需求 ID 唯一性：`REQUIREMENTS.md` 中 `DSUB-REQ-001 ~ DSUB-REQ-107` 共 107 条，唯一、无重复、连续。
- 验收项计数：`ACCEPTANCE.md` 中 `DSUB-AC-001 ~ DSUB-AC-126` 共 126 条，唯一（§5 覆盖校验中重复出现属引用，非定义重复）、连续。
- 验收项到需求 ID 映射完整性：`comm` 双向对比确认——所有 107 条 `DSUB-REQ` 均在 `ACCEPTANCE.md` 中被至少一条 `DSUB-AC` 引用；`ACCEPTANCE.md` 引用的全部 `DSUB-REQ` 均在 `REQUIREMENTS.md` 定义，无悬空引用。
- Markdown 结构：`grep` 扫描确认两个新文档无尾随空白；表格管道（`|`）数量一致；内部链接（`tables/CDC_DATA_SUBSCRIBE.md`、`ACCEPTANCE.md`、`REQUIREMENTS.md`）均指向真实存在文件。
- `git diff --check`：对 4 个修改的数据库基线文件执行，无空白错误（exit=0）。
- 授权文件范围：仅暂存并提交本任务授权文件（见 §7）；其余既有修改与未跟踪文件保持原样。

## 14. 是否修改业务代码、测试代码

- 业务代码修改：`NONE`。
- 测试代码修改：`NONE`。
- 未修改 `docs/features/large-screen/` 任何文件；未修改数据订阅 README/DESIGN/API/UI（本 Feature 目录尚无这些文件）；未修改任何 SQL 脚本。

## 15. 是否操作 ZooKeeper、Kafka、业务服务

- ZooKeeper：`NONE`。
- Kafka：`NONE`。
- 业务服务/进程启停：`NONE`。

## 16. 推送结果和远程一致性证据

本任务已获用户明确授权提交并推送 `origin/develop`。推送执行与远程一致性核验安排如下：

- 提交后、推送前核对：当前分支 `develop`、本地 HEAD、`origin/develop`、ahead/behind。
- 推送命令：普通 `git push origin develop`，禁止 force push。
- 推送后核验：`git rev-parse HEAD` 与 `git rev-parse origin/develop` 一致；`git rev-list --left-right --count origin/develop...HEAD` 为 `0 0`。
- 最终 `result_commit_id`、`remote_commit_id`、`ahead_behind`、`commit_status`、`push_status` 在控制台 `AGENT_TASK_RESULT` 中输出，供人工/ChatGPT 直接核验远程提交一致性。

---

*报告生成：DATA-SUBSCRIPTION-REQUIREMENTS-BASELINE-001（纯文档任务）。*
