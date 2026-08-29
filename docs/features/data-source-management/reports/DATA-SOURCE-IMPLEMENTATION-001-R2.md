# DATA-SOURCE-IMPLEMENTATION-001-R2 执行报告

- 任务编号：DATA-SOURCE-IMPLEMENTATION-001-R2
- 日期：2026-08-30
- 分支：`develop`
- 授权基准提交：`cd258b2f88802dfaacd253e577e35924d05bc93f`
- 前置实现提交：`eca58e6`（server-config 验收收口）
- 当前状态：`IMPLEMENTED_PENDING_REVIEW`

> 本报告是 Agent 执行记录，不是复审通过或用户批准。正式验收未执行，106 条 `DS-AC` 用例状态仍全部为 `NOT_RUN`。
> 本报告不重写、不删除原初版与 R1 报告，仅新增本文件，并如实纠正 R1 报告中“固定线程池/有界执行器”类表述（见 §5）。

---

## 1. 任务开始前 Git 现场与无关工作区保护

- 任务开始前 HEAD：`cd258b2f88802dfaacd253e577e35924d05bc93f`
- origin/develop：`cd258b2f88802dfaacd253e577e35924d05bc93f`
- `git ls-remote origin develop`：`cd258b2f88802dfaacd253e577e35924d05bc93f`
- ahead/behind：`0 0`

任务开始前工作区已存在多处与本任务无关的修改（`docs/agent-prompts/**` 未跟踪提示词、`docs/database/**` 三个历史报告删除、前端 `index.html`/`menu.ts`/layouts/stores/styles 调整、`.claude/settings.local.json`、`agent-env.sh` 等）。本任务对这些无关内容一律保持原样：不修改、不覆盖、不暂存、不提交。最终提交路径仅包含本任务 §3 授权范围文件。

## 2. 读取的批准基线与机械计数

已完整读取：

- `CLAUDE.md`、`agent-env.sh`
- `docs/baseline/` 六份正式项目级基线（PROJECT / ENVIRONMENT / ARCHITECTURE / DEVELOPMENT_RULES / PROJECT_STATUS / DOMAIN_GLOSSARY）
- `docs/baseline/FEATURE_DEVELOPMENT_AND_ADJUSTMENT_PROCESS.md`
- `docs/features/data-source-management/REQUIREMENTS.md`、`DESIGN.md`、`API.md`、`UI.md`、`DATABASE.md`、`ACCEPTANCE.md`
- 原初版执行报告 `DATA-SOURCE-IMPLEMENTATION-001.md` 与 R1 报告 `DATA-SOURCE-IMPLEMENTATION-001-R1.md`
- 当前 `backend/src/main/java/com/bsoft/cdcconfig/datasource/connection/**` 及其测试
- 当前 `frontend/src/views/data-source/DataSourcePage.vue` 与 `dataSource.spec.ts`

机械计数：

- 验收用例总数：106；`DS-AC` 状态全部 `NOT_RUN`
- 目标接口数：13（Controller 恰好暴露 13 个数据源接口，无 enable/disable、无分页）
- 需求数：109

## 3. 四类残留问题逐项修复证据

### 3.1 后端连接超时执行器并非有界，且可能被不可中断 JDBC 永久耗尽（FIXED）

根因：

- R1 使用 `Executors.newFixedThreadPool(2, ...)`，其内部是**无界队列**，不能称为有界执行器；
- `Future.cancel(true)` 只发线程中断，不能保证 `DriverManager.getConnection` 或 JDBC 驱动立即响应中断；
- 两个不可中断连接尝试可长期占满两个工作线程，此后所有请求只进入无界队列并在调用方超时，产生持续饥饿与队列增长；
- 执行器没有 Spring 生命周期关闭方法，daemon 线程不能替代资源关闭；
- 旧测试在超时后主动释放 latch，无法识别“任务忽略中断、工作线程被耗尽”的真实风险。

实际修复（`connection/ConnectionTester.java`）：

1. 改用明确有界的 `ThreadPoolExecutor`：核心/最大线程 2、`ArrayBlockingQueue<Runnable>(2)`、daemon 线程工厂（`cdc-connection-test`）、`AbortPolicy`。`submit` 捕获 `RejectedExecutionException` 返回脱敏结果“连接失败：连接繁忙”，不无限创建线程、不无限排队。
2. Spring Bean 销毁路径 `@PreDestroy public void shutdown()` → `shutdownNowQuietly()`：`AtomicBoolean` CAS 保证只关一次，`executor.shutdownNow()` 后 `awaitTermination(5s)`，中断则恢复线程中断位。`close()` 仍为包可见测试辅助关闭，但不是生产唯一关闭路径。
3. 仍不调用 `DriverManager.setLoginTimeout`，不修改 JVM 全局 JDBC 状态。
4. Oracle 与 MySQL/Doris 均配置连接/读取级单请求超时属性，通过 `Properties` 传入当前临时连接（`JdbcConnectionFactory.open` 合并进 `DriverManager.getConnection(url, info)`），不写全局设置、不写应用连接池：
   - MySQL/Doris：`connectTimeout`、`socketTimeout`（毫秒）
   - Oracle：`oracle.net.CONNECT_TIMEOUT`、`oracle.jdbc.ReadTimeout`（毫秒）
5. 提交任务到返回结果仍为总计 10 秒上限（`future.get(timeoutMs)`）；连接成功后查询超时基于剩余期限（`max(1, remainingMs/1000)`），不串联成 20 秒。
6. 超时、拒绝或饱和均返回脱敏结果（不泄露密码、完整 URL、异常文本或堆栈），不自动重试。
7. Connection/Statement/ResultSet 在全部可获得引用的路径 try-with-resources 关闭；驱动连接/read 级超时最终释放工作线程，不永久占用。
8. `ConnectionFactory.open` 签名增加 `Properties connectionProperties` 参数（仅 `connection/**` 内部契约），`JdbcConnectionFactory` 实现、`ConnectionTester.probe` 调用；`DataSourceServiceImpl` 仍只依赖 `ConnectionTester.test(...)` 未变签名。

测试证据（`connection/DataSourceConnectionTesterTest.java`，21 例全部 PASS）：

- `executor_shouldBeExplicitlyBounded`：生产执行器队列为 `ArrayBlockingQueue`、容量 2、池大小 2；
- `saturation_shouldFastFailWhenWorkersBusyAndQueueFull`：2 个工作线程阻塞且暂时忽略中断 + 2 个排队任务占满有界队列后，饱和请求 <500ms 快速返回“连接失败：连接繁忙”，证明无界排队被消除；
- `shutdown_shouldStopAcceptingNewTasks`：`shutdown()` 后不再接受任务，且未调用 `open`；
- `close_shouldShutdownExecutor`：测试辅助关闭确实关闭执行器；
- `oracle_shouldPassDriverTimeoutPropertiesToCurrentConnection`：Oracle 连接/read 超时属性实际传给当前连接，且 `Properties` 不含 user/password；
- `mySql_shouldBuildCleanUrlAndPassDriverTimeoutProperties`、`doris_shouldUseMySqlProtocol`：MySQL/Doris `connectTimeout`/`socketTimeout` 实际传入；
- `oracle_queryTimeout_shouldRespectRemainingDeadlineNotFullSeconds`：查询超时基于剩余期限（1 秒期限得到 [1,10) 秒），非完整 10 秒；
- `connectionTester_shouldNotModifyGlobalLoginTimeout`：`DriverManager` 全局 login timeout 前后不变；
- 既有总期限、异常分类（驱动不支持/主机无法解析/超时/无法连接/认证失败/通用失败、cause 链遍历）、资源关闭、无重试用例保持通过。

### 3.2 编辑详情请求在关闭/重开后仍可污染新表单（FIXED）

根因：R1 只在每次 `loadEditorDetail` 开始时递增 `detailToken`。关闭编辑弹窗、打开新增弹窗和组件卸载时没有使详情代次失效；编辑 A 未决 → 关闭 → 打开新增/编辑 B 时，A 的迟到详情仍可能匹配 token 并覆盖新表单、密码状态、快照和加载状态。`openEdit` 也没有清除上一弹窗的 `editorSnapshot` 与旧详情错误。

实际修复（`frontend/src/views/data-source/DataSourcePage.vue`）：

- `openCreate`、`openEdit`、`onEditorClosed`（实际关闭）、`onBeforeUnmount`（组件卸载）均执行 `detailToken.value += 1`，使在途详情请求代次失效；
- `openEdit` 开始加载前清除 `editorSnapshot.value = null` 与旧详情错误，避免沿用上一弹窗快照导致错误脏状态；`onEditorClosed` 同样清除快照；
- 迟到的成功、业务失败、网络失败与 `finally` 均因代次不匹配而不得修改当前新弹窗或已关闭弹窗的表单、快照、错误、密码状态与 loading；
- `originalDataSourceId` 仍只由当前编辑记录决定，新建场景保持为空；
- 详情 API 契约未修改。

测试证据（组件测试新增 3 例，deferred Promise）：

1. 编辑 A 未决 → 关闭 → 打开新增并输入内容 → A 成功迟到，新增表单字段与密码状态不被覆盖；
2. 编辑 A 未决 → 关闭 → 打开编辑 B → A 迟到成功不覆盖 B 详情与 `originalDataSourceId`（保存路径仍用 B）；
3. 编辑 A 未决 → 关闭 → 打开编辑 B → A 迟到失败不覆盖 B 详情与错误区。

### 3.3 倒计时必须显示 0，消息测试必须使用真实 API 契约（FIXED）

根因：R1 在计数减到 0 的同一同步回调里立即 `testing=false`，模板因此不会实际渲染“剩余 0 秒”；测试只在 10 秒后断言“连接超时”，没有验证 0 秒显示。失败消息测试 mock `认证失败` 并断言页面不包含 `连接失败：认证失败`，与 API 契约相反，无法证明“没有重复前缀”。

实际修复：

- 到 0 时结果文案稳定展示“剩余 0 秒 / 连接超时”，满足批准 `10,9,...,0` 且不延长实际 10 秒期限；同时 `testToken += 1`，迟到响应不得覆盖超时结果；`testing=false` 后测试按钮恢复可用；
- 生产代码仍直接展示后端完整脱敏消息，不自行拼接前缀。

测试证据（组件测试）：

- 倒计时测试逐项覆盖 10、9、1、0 与超时状态：0 秒显示“剩余 0 秒 / 连接超时”、按钮恢复可用、迟到成功响应被忽略；
- 失败消息测试 mock 后端真实消息 `连接失败：认证失败`：页面恰好显示一次该完整消息，且断言不存在 `连接失败：连接失败：认证失败`。

### 3.4 防重复状态必须覆盖“等待确认”阶段；命名策略保存期间冻结表单（FIXED）

根因：R1 的主记录删除与命名策略删除都在确认框 resolve 后才设置 pending，因此第一个确认框尚未处理时第二次调用仍能再次弹确认；现有测试的确认 Promise 立即 resolve，未覆盖该窗口。命名策略保存期间表单控件仍可编辑，成功响应会清空请求期间用户输入的新内容。

实际修复（`frontend/src/views/data-source/DataSourcePage.vue`）：

- `onDelete`、`onDeleteNaming` 通过初始 guard 后立即设置 `deletingId` / `namingDeletingId`；确认取消、确认异常、请求成功或失败的所有路径都释放状态；
- 等待第一个确认结果期间再次触发不再弹第二个确认、不发请求；确认后按钮保持 loading/disabled 直到请求结束；
- `namingSaving` 时禁用目标库选择、策略单选框、前缀/后缀输入（`TABLE_MERGE` 既有禁用条件合并）；编辑/删除/保存/取消入口已按 `namingSaving` 禁用；保存失败后恢复编辑，保存成功按既有规则重置并刷新。

测试证据（组件测试新增 3 例）：

- 主记录删除确认未决（reject 型 confirm Promise）：重复触发只弹一个确认、不发请求；取消后释放状态并允许重新尝试成功删除；
- 命名策略删除确认未决：重复触发只弹一个确认、不发请求；取消后释放状态并允许重新尝试；
- 命名策略保存期间冻结表单：目标库选择 `is-disabled`、策略单选输入 disabled、前后缀输入 disabled；保存失败后全部恢复可编辑且表单保留 CUSTOM 值。

## 4. 修改/新增文件清单

### 后端主代码（`backend/src/main/java/com/bsoft/cdcconfig/datasource/connection/`）

修改：

- `ConnectionFactory.java` —— `open` 签名增加驱动级 `Properties connectionProperties`，注释明确每连接属性范围
- `JdbcConnectionFactory.java` —— 按新签名实现，合并 `connectionProperties` 后 `DriverManager.getConnection(url, info)`
- `ConnectionTester.java` —— 有界 `ThreadPoolExecutor` + AbortPolicy、`@PreDestroy shutdown` 生命周期、Oracle/MySQL/Doris 驱动级超时属性、剩余期限查询超时、饱和脱敏失败、cause 链脱敏分类

### 后端测试（`backend/src/test/java/com/bsoft/cdcconfig/datasource/connection/`）

修改：

- `DataSourceConnectionTesterTest.java` —— 21 例：新增有界队列、饱和快速失败、生命周期关闭、驱动超时属性、剩余期限查询超时、login timeout 不变等用例；沿用毫秒级可注入期限与 fake factory，不连真实数据库、不真实等待 10 秒

### 前端

修改：

- `frontend/src/views/data-source/DataSourcePage.vue` —— 3.2 详情代次隔离、3.3 0 秒展示、3.4 确认阶段防重与命名保存冻结
- `frontend/src/views/data-source/dataSource.spec.ts` —— 45 例：新增详情关闭/重开隔离（3）、0 秒与真实消息契约（2 改 2 新，净增 2）、删除/命名删除确认未决与命名冻结（3）

### 报告

- `docs/features/data-source-management/reports/DATA-SOURCE-IMPLEMENTATION-001-R2.md`（本文件）

## 5. 对 R1 报告不准确表述的纠正

| # | R1 报告表述 | 本次核实后的事实 |
|---|---|---|
| 1 | §3.1 将执行器描述为“固定线程池”并隐含“有界” | `Executors.newFixedThreadPool` 内部使用**无界队列**，不是有界执行器；R2 才完成真正有界（`ThreadPoolExecutor` + `ArrayBlockingQueue`）与 Spring 生命周期关闭 |
| 2 | §4.6 “固定 daemon 线程池（cdc-connection-test）” | 同义表述，已在 R2 如实纠正：该实现存在无界队列与缺生命周期关闭两个缺陷，均已在 R2 修复 |

R1 中已核实无误的表述不再重复纠正；R2 只记录与四类问题相关的事实修正，不改写 R1 报告。

## 6. 验证结果

### 后端数据源定向测试（全部通过）

| 测试类 | 数量 | 结果 |
|---|---|---|
| DataSourceControllerTest | 19 | PASS |
| DataSourceServiceTest | 41 | PASS |
| DataSourceNamingStrategyServiceTest | 25 | PASS |
| DataSourceConnectionTesterTest | 21 | PASS |
| **合计** | **106** | **PASS** |

### 后端全量测试（授权基线对比）

在 `9717272f4e3002e86758d9049b23f358112bbfb4` 的临时 detached worktree 以相同环境与命令复现 `mvn clean test` 作为基准：

| 项 | 授权基线（9717272 临时 detached worktree） | 当前 develop 工作区 |
|---|---|---|
| 测试总数 | 638 | 711 |
| Failures | 3 | 3 |
| Errors | 17 | 17 |
| 失败总数 | 20 | 20 |

方法级对比：两轮失败方法集合**完全一致**（20 个方法，`diff` 为空）。测试总数差异 638→711（+73）主要来自 R1 数据源测试（+67）与本轮 R2 连接测试新增用例（21-15=+6）。

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

`npm test -- --run`（vitest run）：15 个文件、207 个用例全部 PASS。含 `dataSource.spec.ts`（45 例，R1 39 例 + 本轮 6 例新增）、`api/dataSource.spec.ts`（10 例）及既有 log-query/server-config 回归。

### 前端构建

`npm run build`（vue-tsc --noEmit && vite build）：通过。

### 机械检查结果

| # | 检查项 | 结果 |
|---|---|---|
| 1 | 六份批准 Feature 文档相对授权基准零 diff | PASS |
| 2 | `docs/baseline/**` 零 diff；`docs/database/**` 存在 3 个任务开始前无关删除（历史报告），保持原样未提交 | 部分 PASS（无关删除已保留） |
| 3 | 原初版报告与 R1 报告未修改（git diff 为空） | PASS |
| 4 | 106 条 `DS-AC` 状态全部 `NOT_RUN`；13 接口、109 需求不变 | PASS |
| 5 | 不存在 `DriverManager.setLoginTimeout`、无界 `Executors.newFixedThreadPool`（源码仅注释提及不使用）、分页/启停/DDL/`ROWNUM=1` | PASS |
| 6 | 详情关闭/重开代次测试、0 秒展示测试、真实失败消息测试、未决确认防重测试、命名冻结测试均存在并通过 | PASS |
| 7 | `git diff --check` 通过 | PASS |
| 8 | 最终暂存/提交路径全部属于 §3 授权范围 | PASS |
| 9 | 任务开始前无关工作区内容保持原样 | PASS |

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
- 未修改六份批准基线、`docs/baseline/**`、`docs/database/**`、原初版/R1 报告、`backend/pom.xml`、前端 API/类型/HTTP 封装/依赖/路由/菜单

## 8. 结果 Commit、Push 与远端一致性

- 结果 Commit：SELF（本提交，提交后以控制台/结果块 SHA 为准）
- Push 状态：见本任务结果块
- 推送后核验：`HEAD == origin/develop == git ls-remote origin develop`，ahead/behind = `0 0`
- 授权基准对比证据：使用授权基准 `9717272` 的临时 detached worktree 以相同环境与命令复现 `mvn clean test`（638 例，3 Failures + 17 Errors），与当前（711 例，3 Failures + 17 Errors）方法级与原因级完全一致，无新增失败；本任务数据源定向测试 106 例全部通过；`mvn clean package -DskipTests` 成功；前端 207 例测试与构建全部通过。

## 9. 状态与下一步

- 当前状态：`IMPLEMENTED_PENDING_REVIEW`
- 下一步固定为：`CHATGPT_CODE_REVIEW_R2`（用户把本报告与控制台摘要交给 ChatGPT，从远端 Git 读取实际提交、代码、测试与报告进行独立复审）
- 本报告不代表复审通过或用户批准
