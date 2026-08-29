# DATA-SOURCE-IMPLEMENTATION-001-R1 执行报告

- 任务编号：DATA-SOURCE-IMPLEMENTATION-001-R1
- 日期：2026-08-30
- 分支：`develop`
- 授权基准提交：`b00918ecc897e7a86815f334eb7d0dbb405a525d`
- 前置实现提交：`496e6d27280075f185797e6b51790ac9a5773c3d`
- 当前状态：`IMPLEMENTED_PENDING_REVIEW`

> 本报告是 Agent 执行记录，不是复审通过或用户批准。正式验收未执行，106 条 `DS-AC` 用例状态仍全部为 `NOT_RUN`。
> 本报告不重写、不删除原初版报告 `DATA-SOURCE-IMPLEMENTATION-001.md`，仅新增本文件，并如实纠正原报告中的不准确表述（见 §5）。

---

## 1. 任务开始前 Git 现场与无关工作区保护

- 任务开始前 HEAD：`b00918ecc897e7a86815f334eb7d0dbb405a525d`
- origin/develop：`b00918ecc897e7a86815f334eb7d0dbb405a525d`
- `git ls-remote origin develop`：`b00918ecc897e7a86815f334eb7d0dbb405a525d`
- ahead/behind：`0 0`

任务开始前工作区已存在多处与本任务无关的修改（`docs/agent-prompts/**` 未跟踪提示词、`docs/database/**` 三个历史报告删除、前端 `index.html`/`menu.ts`/layouts/stores/styles 调整、`.claude/settings.local.json`、`agent-env.sh` 等）。本任务对这些无关内容一律保持原样：不修改、不覆盖、不暂存、不提交。最终提交路径仅包含本任务 §3 授权范围文件。

## 2. 读取的批准基线与机械计数

已完整读取：

- `CLAUDE.md`、`agent-env.sh`
- `docs/baseline/` 六份正式项目级基线（PROJECT / ENVIRONMENT / ARCHITECTURE / DEVELOPMENT_RULES / PROJECT_STATUS / DOMAIN_GLOSSARY）
- `docs/baseline/FEATURE_DEVELOPMENT_AND_ADJUSTMENT_PROCESS.md`
- `docs/features/data-source-management/REQUIREMENTS.md`、`DESIGN.md`、`API.md`、`UI.md`、`DATABASE.md`、`ACCEPTANCE.md`
- `docs/database/README.md`、`SCHEMA.md`、`RELATIONS.md`、`tables/CDC_DATA_SOURCE.md`、`tables/CDC_DATA_SOURCE_EXTEND.md`
- 原初版执行报告 `docs/features/data-source-management/reports/DATA-SOURCE-IMPLEMENTATION-001.md`
- 当前 datasource 前后端实现与测试

机械计数：

- 验收用例总数：106；`DS-AC` 状态全部 `NOT_RUN`
- 目标接口数：13（Controller 恰好暴露 13 个数据源接口，无 enable/disable、无分页）

## 3. 十项复审问题逐项修复证据

| # | 复审问题 | 状态 | 修复证据 |
|---|---|---|---|
| 4.1 | 连接测试倒计时必须是真正请求期限 | FIXED | 请求发起时（`testing.value = true` 后、`await testDataSourceConnection` 前）即调用 `startCountdownTimer(token)`，显示“测试连接中，剩余 10 秒”并逐秒递减到 0；到 0 显示“连接超时”并 `testToken += 1` 使迟到响应失效；提前返回立即 `clearTestTimer()`；测试中 `testing` 防重复点击；不进入任何“重试冷却倒计时”；后端脱敏 `message` 直接展示，不拼接前缀。组件测试用可控未决 Promise 与 fake timers 验证倒计时、提前响应、超时、迟到响应忽略、字段修改/关闭失效与计时器清理、测试中不重复发请求、无重复前缀 |
| 4.2 | 编辑必须通过详情接口加载最新数据 | FIXED | “编辑”按钮与双击行都进入同一 `openEdit`，保存 `originalDataSourceId` 快照，调用 `loadEditorDetail(row.dataSourceId)` 走 `GET /api/data-sources/{id}`；加载期间 `editorLoading` 使保存/测试不可用；业务失败/网络失败可见，不静默使用列表数据；`detailToken` 代次隔离迟到详情响应；密码仍只呈现独立固定星号未修改状态 |
| 4.3 | 主编辑弹窗和命名策略编辑必须完整实现未保存确认 | FIXED | 两个弹窗均建立打开/加载完成后的规范化快照；任一字段或密码编辑状态变化后，取消、右上角关闭、ESC、遮罩关闭走同一确认逻辑；保存成功标记干净后关闭不弹二次确认；保存失败保留输入；密码星号为独立视觉状态，聚焦/失焦不误标已修改；命名策略新增/编辑切换、关闭时脏数据均需确认；拒绝确认保持原表单与弹窗 |
| 4.4 | 命名策略弹窗信息与列必须与 UI 基线一致 | FIXED | 弹窗标题显示源库 ID 与源库名称；表格列严格为目标库 ID、目标库名称、数据库类型、命名策略、前缀、后缀、操作；数据库类型显示批准代码（ORACLE/MYSQL/DORIS）；既有新增/编辑/删除/无分页行为不变；对应渲染测试覆盖 |
| 4.5 | 所有删除和写操作必须有稳定的防重复提交 | FIXED | 主记录删除用 `deletingId`、命名策略删除用 `namingDeletingId` 操作级 pending guard；同一操作进行中不弹确认、不发第二个请求、按钮 loading/disabled；命名策略保存期间阻止删除等冲突请求；请求结束正确释放，失败保留可重试能力；deferred Promise 验证快速连续点击只发一个请求 |
| 4.6 | 后端连接测试单次总计 10 秒且不污染全局 JDBC 状态 | FIXED | 移除 `DriverManager.setLoginTimeout`；`ConnectionTester` 以固定 daemon 线程池（`cdc-connection-test`）执行探测，`Future.get(timeoutMs)` 施加强制总期限 10 秒，连接与查询共用同一期限；超时 `cancel(true)`；包可见构造器 `ConnectionTester(ConnectionFactory, Duration)` 供毫秒级测试期限；Connection/Statement/ResultSet 全部 try-with-resources；异常遍历 cause 链分类认证/超时/不可达，其余通用脱敏；不泄露密码、URL 与堆栈 |
| 4.7 | 更新请求、ID 修改、名称唯一性与枚举大小写 | FIXED | `DataSourceUpdateDTO.dataSourceId` `@NotBlank` 必填；前端 `DataSourceUpdateRequest.dataSourceId` 必填；ID 是否修改按原始字符串 `equals` 精确比较（`DS01`→`ds01` 视为大小写修改允许）；查重忽略大小写并排除当前原记录，覆盖全表不限于 `FG_ACTIVE='1'`；新增/编辑类别与类型只接受大写枚举，小写拒绝；读取存量小写类别忽略大小写规范化并 `UPPER(...)` 兼容 |
| 4.8 | 连接测试跨字段校验不得滥用业务码 40002 | FIXED | `TestConnectionDTO` 增加类级约束 `@RequireOriginalIdWhenNoPassword`（有 password 可不带原 ID；无 password 必须带原 ID），触发 `MethodArgumentNotValidException` → 统一 HTTP 400 / `code=400`；Service 防御路径用 `BusinessException(400, ...)`，不使用 40002；`originalDataSourceId` 存在但无有效旧记录时按批准契约返回业务错误 |
| 4.9 | 命名策略 DML 行数异常错误边界 | FIXED | 新增/编辑 DML 影响行数不等于 1 → `50000`（事务回滚）；删除 DML 影响行数不等于 1 → `50001`（事务回滚）；`40401` 仅用于原逻辑键 `COUNT(*) == 0`；`40903` 仅用于 `COUNT(*) >= 2`；删除 DML 失败断言从 `40401` 修订为 `50001`，覆盖新增/编辑/删除三分支测试 |
| 4.10 | 按已批准设计拆分命名策略服务职责 | FIXED | 新增 `DataSourceNamingStrategyService` 接口与 `DataSourceNamingStrategyServiceImpl`（`@Service`），只写 `CDC_DATA_SOURCE_EXTEND`；Controller 四个命名策略接口改调该服务；主服务 `DataSourceServiceImpl` 不再含命名策略逻辑；角色校验、目标显示名称/类型只读查询 `CDC_DATA_SOURCE` 并批量查询无 N+1；13 个 HTTP 接口、DTO/VO 契约、事务语义、错误码不变 |

## 4. 修改/新增文件清单

### 后端主代码（`backend/src/main/java/com/bsoft/cdcconfig/datasource/`）

修改：

- `connection/ConnectionTester.java` —— 总期限执行器、cause 链分类、无 `setLoginTimeout`、包可见测试构造器、`@Autowired` 主构造器
- `connection/JdbcConnectionFactory.java` —— 移除全局 `DriverManager.setLoginTimeout`
- `controller/DataSourceController.java` —— 命名策略四接口改调 `DataSourceNamingStrategyService`
- `dto/DataSourceUpdateDTO.java` —— `dataSourceId` 必填
- `dto/TestConnectionDTO.java` —— 类级跨字段约束 `@RequireOriginalIdWhenNoPassword`
- `enums/DataSourceCategoryEnum.java`、`enums/DataSourceTypeEnum.java` —— 严格大写校验
- `service/DataSourceService.java`、`service/impl/DataSourceServiceImpl.java` —— 移除命名策略职责、防御校验 `BusinessException(400, ...)`、名称唯一性覆盖全表

新增：

- `dto/RequireOriginalIdWhenNoPassword.java`
- `dto/RequireOriginalIdWhenNoPasswordValidator.java`
- `service/DataSourceNamingStrategyService.java`
- `service/impl/DataSourceNamingStrategyServiceImpl.java`

### 后端测试（`backend/src/test/java/com/bsoft/cdcconfig/datasource/`）

修改：

- `connection/DataSourceConnectionTesterTest.java` —— 重构为毫秒级总期限测试（15 例）
- `controller/DataSourceControllerTest.java` —— 命名策略 mock 独立服务；补 400 校验用例（19 例）
- `service/DataSourceServiceTest.java` —— 同步主服务职责（41 例）

新增：

- `service/DataSourceNamingStrategyServiceTest.java` —— 命名策略服务独立测试（25 例）

### 前端

修改：

- `frontend/src/views/data-source/DataSourcePage.vue` —— 4.1~4.5 全部 UI 修复
- `frontend/src/views/data-source/dataSource.spec.ts` —— 补齐识别上述问题的组件测试（39 例）
- `frontend/src/types/dataSource.ts` —— `DataSourceUpdateRequest.dataSourceId` 必填

`frontend/src/api/dataSource.ts`、`frontend/src/api/dataSource.spec.ts` 本轮未变更（其契约已满足 §4.7 前端必填要求，`dataSource.spec.ts` 中 10 例仍通过）。

### 报告

- `docs/features/data-source-management/reports/DATA-SOURCE-IMPLEMENTATION-001-R1.md`（本文件）

## 5. 对原报告不准确表述的纠正

原报告 `DATA-SOURCE-IMPLEMENTATION-001.md` 存在以下不准确表述，本次核实后的事实如下：

| # | 原报告表述 | 本次核实后的事实 |
|---|---|---|
| 1 | §3 “Controller 仅暴露查询接口” | 前置旧 Controller 并非仅暴露查询接口，而是存在旧增删改/启停/扩展等候选接口 |
| 2 | §6 “业务属性：扩展表 `bizAttr` 以 JSON 文本存取” | `DATA_SOURCE_BIZ_ATTR` 位于 `CDC_DATA_SOURCE` 主表，不是 `DataSourceExtend` 的映射内容 |
| 3 | §6 “新增/更新落库 `FG_ACTIVE='1'` 固定值” | 新增固定写 `FG_ACTIVE='1'`，编辑保持原值，不能统称新增/编辑均固定写入 |
| 4 | §6 “连接测试……建立临时连接并回滚释放” | 当前连接测试资源关闭不等于“事务回滚”，原报告无依据写“回滚释放” |
| 5 | §7 “编辑时密码默认留空表示不修改” | 编辑密码视觉状态是固定星号，不是“默认空”；真实密码仍不回传 |
| 6 | §10 “数据库访问：`NONE`” | 全量测试实际通过既有测试只读访问 Oracle 开发库，`database_access_status` 如实记录为 `READ_ONLY_BY_EXISTING_TESTS`，`database_write_status=NONE` |
| 7 | §10 “ZooKeeper 访问：`NONE`” | 为确认 ZK 不可达实际发起了只读连接探测（`zkCli ls /bsoft-cdc` 超时失败），`zookeeper_access_status` 记录为失败的只读连接尝试 `READ_ATTEMPT_FAILED` |
| 8 | §12 “结果 Commit：`496e6d2`” | 初版实现实际使用功能提交加报告 SHA 回填提交共两次（`496e6d2` 功能提交 + `b00918e` 回填提交），R1 只记录事实，不改写历史 |

## 6. 验证结果

### 后端数据源定向测试（全部通过）

| 测试类 | 数量 | 结果 |
|---|---|---|
| DataSourceControllerTest | 19 | PASS |
| DataSourceConnectionTesterTest | 15 | PASS |
| DataSourceServiceTest | 41 | PASS |
| DataSourceNamingStrategyServiceTest | 25 | PASS |
| **合计** | **100** | **PASS** |

### 后端全量测试（授权基线对比）

在 `9717272f4e3002e86758d9049b23f358112bbfb4` 的临时 detached worktree 以相同环境与命令复现 `mvn clean test` 作为基准：

| 项 | 授权基线（9717272 临时 detached worktree） | 当前 develop 工作区 |
|---|---|---|
| 测试总数 | 638 | 705 |
| Failures | 3 | 3 |
| Errors | 17 | 17 |
| 失败总数 | 20 | 20 |

方法级对比：两轮失败方法集合**完全一致**（20 个方法，`diff` 为空，见下方方法清单）。测试总数差异 638→705（+67）恰为本次数据源测试新增：`(19-10)+(41-23)+25+15 = 67`。

失败原因分类逐项一致：

- 17 个：`BusinessException: ZooKeeper 连接失败，将在 60 秒重试`（JobFailureServiceTest，ZK 10.19.16.111 当前不可达，`zkCli` 只读探活超时，属环境性）
- 1 个：`expected: <40006> but was: <40401>`（JobFailureServiceTest.failureDetail_eventNotInFaultProcess_shouldThrow，Oracle 开发库数据漂移）
- 1 个：`expected: <1> but was: <4>`（JobFailureServiceTest.latestFaultShouldHaveCorrectRestartCount，同上）
- 1 个：`expected: <27> but was: <30>`（OracleDateMappingTest.oracleDateToLocalDateTime_viaJdbcTemplate_shouldMapCorrectly，开发库 `CDC_JOB_FAILURE_EVENT` 数据漂移）

结论：当前全量测试没有出现授权基准中不存在的新失败；全部 20 个失败均可在授权基准复现，且与本任务数据源管理功能无关。本任务运行只依赖 Oracle 开发库，不要求 ZooKeeper 可用；本任务未启动、未修复 ZooKeeper。

20 个失败方法（基准与当前一致）：

```
oracleDateToLocalDateTime_viaJdbcTemplate_shouldMapCorrectly
errorDetailByLogId_shouldReturnContent
errorDetail_logNotInFaultProcess_shouldThrow
errorDetail_nullErrorDetail_shouldReturnNullContent
errorDetail_wrongFaultRootForLogsFaultProcess_shouldThrow
existingClosedJobShouldReturnNormalStatus
failureDetailByEvent_shouldReturnContent
failureDetail_eventNotInFaultProcess_shouldThrow
latestFaultShouldHaveCorrectRestartCount
processDetailShouldReturnResultForExistingRoot
summaryShouldHaveClientNameFromCdcClientMultiple
summaryShouldHaveCorrectFieldsForExistingJob
summaryShouldMarkDataSourceActive
summaryShouldMarkDataSourceExists
summaryShouldNotContainClobContent
summaryShouldNotTriggerNPlusOne
summaryShouldResolveDataSourceNameFromConfig
summaryShouldResolveDataSourceOrgFromConfig
summaryShouldReturnAllFgActiveLogicalJobs
summaryShouldReturnJobStatusForAllRecords
```

### 后端打包

- `mvn clean test`：BUILD FAILURE（仅上述 20 个既存无关失败，经授权基准例外确认无新增）
- `mvn clean package -DskipTests`：BUILD SUCCESS

### 前端测试

`npm test -- --run`（vitest run）：15 个文件、201 个用例全部 PASS。含 `dataSource.spec.ts`（39 例）、`api/dataSource.spec.ts`（10 例）及既有 log-query/server-config 回归。

### 前端构建

`npm run build`（vue-tsc --noEmit && vite build）：通过。

### 机械检查结果

| # | 检查项 | 结果 |
|---|---|---|
| 1 | 六份批准 Feature 文档相对授权基准零 diff | PASS |
| 2 | `docs/baseline/**` 零 diff；`docs/database/**` 存在 3 个任务开始前无关删除（历史报告），保持原样未提交 | 部分 PASS（无关删除已保留） |
| 3 | 106 条 `DS-AC` 状态全部 `NOT_RUN` | PASS |
| 4 | Controller 恰好暴露 13 个数据源接口；无 enable/disable | PASS |
| 5 | 列表请求/返回无分页字段/结构 | PASS |
| 6 | 源码目标路径无 `ROWNUM=1` | PASS |
| 7 | 响应 VO 不含密码；前端未修改密码时字段缺席；日志不含密码/URL | PASS |
| 8 | `DataSourceUpdateDTO.dataSourceId` 必填；前端 `DataSourceUpdateRequest.dataSourceId` 必填 | PASS |
| 9 | 前端 countdown 在请求期间发生（非响应后冷却） | PASS |
| 10 | 不存在 `DriverManager.setLoginTimeout` | PASS |
| 11 | `git diff --check` 通过 | PASS |
| 12 | 最终暂存/提交路径全部属于 §3 授权范围 | PASS |
| 13 | 任务开始前无关工作区内容保持原样 | PASS |

### 环境访问状态

- 数据库访问：`READ_ONLY_BY_EXISTING_TESTS`（全量测试的既有测试只读访问 Oracle 开发库；未执行手动 SQL/写操作/DDL/数据修复）
- 数据库写操作：`NONE`
- DDL：`NONE`
- ZooKeeper 访问：`READ_ATTEMPT_FAILED`（只读 `zkCli ls /bsoft-cdc` 连接超时；全量测试中 17 个 ZK 依赖用例只读连接尝试失败）
- 服务启动/停止：`NONE`
- 真实连接测试：`NOT_RUN`
- 外部验收/人工视觉验收：未执行

## 7. 未执行事项

- 106 条正式验收用例未执行，状态保持 `NOT_RUN`（本轮单元/组件测试不构成正式人工验收）
- 未做人工视觉/真实环境验收
- 未修改数据库结构、数据或外部服务配置
- 未修改六份批准基线、`docs/baseline/**`、`docs/database/**`、原初版报告、`backend/pom.xml`

## 8. 结果 Commit、Push 与远端一致性

- 结果 Commit：SELF（本提交，提交后以控制台/结果块 SHA 为准）
- Push 状态：见本任务结果块
- 推送后核验：`HEAD == origin/develop == git ls-remote origin develop`，ahead/behind = `0 0`
- 授权基准对比证据：使用授权基准 `9717272` 的临时 detached worktree 以相同环境与命令复现 `mvn clean test`（638 例，3 Failures + 17 Errors），与当前（705 例，3 Failures + 17 Errors）方法级与原因级完全一致，无新增失败；本任务数据源定向测试 100 例全部通过；`mvn clean package -DskipTests` 成功；前端 201 例测试与构建全部通过。

## 9. 状态与下一步

- 当前状态：`IMPLEMENTED_PENDING_REVIEW`
- 下一步固定为：`CHATGPT_CODE_REVIEW_R1`（用户把本报告与控制台摘要交给 ChatGPT，从远端 Git 读取实际提交、代码、测试与报告进行独立复审）
- 本报告不代表复审通过或用户批准
