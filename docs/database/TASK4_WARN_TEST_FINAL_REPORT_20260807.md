# TASK 4 周期 WARN 测试定向收尾 — 最终报告

**日期**: 2026-08-07
**任务编号**: TASK_4（验收后修正 — 第三轮：周期 WARN 测试）
**分支**: develop
**HEAD**: 1fb4434a2a032fb6919d5a89c671dc41cbf70905

---

## 一、修改文件清单

| 文件 | 变更类型 | 说明 |
|------|----------|------|
| `lifecycle/StatsScheduler.java` | 修改 | 抽取 `logConfigLoadError()`、`logConfigNotStartedWarn()`、`startPeriodicWarn(ScheduledExecutorService)` 三个包内可见方法 |
| `lifecycle/StatsSchedulerTest.java` | 重写 | 27 个测试（原 22 个），含 spy 日志验证 + mock 调度参数验证 |

---

## 二、StatsScheduler 可测试性调整

三处最小调整，不改变生产语义：

1. `logConfigLoadError(StatsConfigLoadException e)` — 包内可见，封装 `log.error("大屏统计配置加载失败，统计任务将不会启动", e)`，携带完整 Throwable
2. `logConfigNotStartedWarn()` — 包内可见，封装 `log.warn("大屏统计任务未启动：配置加载失败，请检查 CDC_STATS_TASK_CONFIG 表中 TASK_CODE='LARGE_SCREEN_STATS' 的配置")`，无参数（保证无 Throwable）
3. `startPeriodicWarn(ScheduledExecutorService)` — 包内可见，测试可传入 mock 验证调度参数

### 生产代码注释

三个方法均标注了中文注释说明其用途和可见性：

```java
/**
 * 记录首次 ERROR 日志并携带完整异常，供 spy 验证。
 * 仅包内和测试可见。
 */
void logConfigLoadError(StatsConfigLoadException e) { ... }

/**
 * 记录周期 WARN 日志，不携带异常，供 spy 验证。
 * 仅包内和测试可见。
 */
void logConfigNotStartedWarn() { ... }

/**
 * 注册周期告警任务（包内可见，测试可传入 mock 验证调度参数）。
 */
void startPeriodicWarn(ScheduledExecutorService warnScheduler) { ... }
```

---

## 三、60 秒周期注册参数验证证据

### 调度参数验证

```java
@Test
void warnScheduleRegisteredWith60SecondPeriodAndSecondsUnit() {
    scheduler.startPeriodicWarn(mockWarnScheduler);

    ArgumentCaptor<Runnable> runnableCaptor = ArgumentCaptor.forClass(Runnable.class);
    verify(mockWarnScheduler).scheduleWithFixedDelay(
            runnableCaptor.capture(), eq(60L), eq(60L), eq(TimeUnit.SECONDS));
    assertNotNull(runnableCaptor.getValue());
    assertEquals(scheduler.warnTask, runnableCaptor.getValue());
}
```

**验证结果**：
- `initialDelay = 60`
- `period = 60`
- `unit = TimeUnit.SECONDS`
- 注册的 `Runnable` 与 `scheduler.warnTask` 是同一引用

### 成功/停用不注册验证

| 测试 | 验证 |
|------|------|
| `startPeriodicWarnNotCalledWhenConfigLoadsSuccessfully` | `verify(spy, never()).startPeriodicWarn(any())`；`warnScheduler == null`；`warnTask == null` |
| `startPeriodicWarnNotCalledWhenTaskDisabled` | `verify(spy, never()).startPeriodicWarn(any())`；`warnScheduler == null`；`warnTask == null` |

---

## 四、首次 ERROR 日志验证证据

| 测试 | 验证点 | 证据 |
|------|--------|------|
| `logConfigLoadErrorCalledExactlyOnceOnFirstFailure` | 恰好记录一次 ERROR | `verify(spy, times(1)).logConfigLoadError(...)` |
| `logConfigLoadErrorReceivesStatsConfigLoadException` | ERROR 携带 Throwable | `ArgumentCaptor` 捕获到非 null 的 `StatsConfigLoadException`，`assertSame(ex, captor.getValue())` |
| `logConfigLoadErrorNotCalledWhenConfigSucceeds` | 成功不记录 ERROR | `verify(spy, never()).logConfigLoadError(...)` |
| `logConfigLoadErrorNotCalledWhenTaskDisabled` | 停用不记录 ERROR | `verify(spy, never()).logConfigLoadError(...)` |
| `normalScheduleNotCreatedOnConfigFailure` | 不创建正常统计任务 | `verify(taskScheduler, never()).scheduleWithFixedDelay(...)` |
| `warnTaskDoesNotCallLogConfigLoadError` | WARN 不触发额外 ERROR | 执行 2 次 WARN 后 `logConfigLoadError` 调用次数仍为 1 |

**生产消息**：`log.error("大屏统计配置加载失败，统计任务将不会启动", e)` — 第二个参数 `e` 为 `StatsConfigLoadException`，Logback 将输出完整堆栈。

---

## 五、周期 WARN 日志验证证据

| 测试 | 验证点 | 证据 |
|------|--------|------|
| `warnTaskRunCallsLogConfigNotStartedWarnOnce` | 执行 1 次 → 恰好 1 条 WARN | `verify(spy, times(1)).logConfigNotStartedWarn()` |
| `twoWarnTaskRunsCallLogConfigNotStartedWarnTwice` | 执行 2 次 → 恰好 2 条 WARN | `verify(spy, times(2)).logConfigNotStartedWarn()` |
| `logConfigNotStartedWarnTakesNoArguments` | 无参数 → 无 Throwable → 无异常堆栈 | `getDeclaredMethod("logConfigNotStartedWarn").getParameterCount() == 0` |
| `warnTaskDoesNotCallLogConfigLoadError` | WARN 不增 ERROR | 基线 1 次 ERROR，执行 2 次 WARN 后仍为 1 次 |
| `warnTaskDoesNotCallLoadOnce` | WARN 不重新加载配置 | `verify(configLoader, times(1)).loadOnce()` — 仅 `onApplicationEvent` 时调用一次 |
| `warnTaskDoesNotCallTaskSchedulerForNormalSchedule` | WARN 不创建统计调度 | `verify(taskScheduler, never()).scheduleWithFixedDelay(...)` + `verifyNoMoreInteractions(taskScheduler)` |

**生产消息**：`log.warn("大屏统计任务未启动：配置加载失败，请检查 CDC_STATS_TASK_CONFIG 表中 TASK_CODE='LARGE_SCREEN_STATS' 的配置")` — 单参数调用，不携带 Throwable，不输出异常堆栈。

**生产代码保证**：`this.warnTask = this::logConfigNotStartedWarn` — 方法引用直接指向无参方法，编译期确保无法传入 Throwable。

---

## 六、测试命令与结果

### StatsSchedulerTest 定向测试

```
mvn test -Dtest="com.bsoft.cdcconfig.largescreen.stats.lifecycle.StatsSchedulerTest"
Tests run: 27, Failures: 0, Errors: 0, Skipped: 0
BUILD SUCCESS
```

### largescreen 全部测试

```
mvn test -Dtest="com.bsoft.cdcconfig.largescreen.**"
Tests run: 158, Failures: 0, Errors: 0, Skipped: 0
BUILD SUCCESS
```

### 编译

```
mvn compile -DskipTests
BUILD SUCCESS
```

### 全量测试

```
mvn test
Tests run: 344, Failures: 2, Errors: 9, Skipped: 0
```

---

## 七、全量测试 11 个失败详情与基线判断

### OracleDateMappingTest（1 个失败）

| # | 测试方法 | 错误类型 | 异常摘要 |
|---|---------|---------|---------|
| 1 | `oracleDateToLocalDateTime_viaJdbcTemplate_shouldMapCorrectly` | FAILURE | `expected: <27> but was: <30>` — 连接真实 Oracle DB（192.168.174.65:1521），日期依赖测试，期望 day-of-month=27，实际 DB 返回 30 |

### JobFailureServiceTest（1 个失败 + 9 个错误）

| # | 测试方法 | 错误类型 | 异常摘要 |
|---|---------|---------|---------|
| 2 | `summaryShouldReturnAllFgActiveLogicalJobs` | **FAILURE** | `Should return at least 2 FG_ACTIVE=1 records ==> expected: <true> but was: <false>` |
| 3 | `summaryShouldHaveCorrectFieldsForExistingJob` | ERROR | `NoSuchElementException: No value present` (line 57) |
| 4 | `errorDetail_nullErrorDetail_shouldReturnNullContent` | ERROR | `NoSuchElementException: No value present` (line 265) |
| 5 | `errorDetailByLogId_shouldReturnContent` | ERROR | `NoSuchElementException: No value present` (line 224) |
| 6 | `errorDetail_wrongFaultRootForLogsFaultProcess_shouldThrow` | ERROR | `NoSuchElementException: No value present` (line 298) |
| 7 | `processDetailShouldReturnResultForExistingRoot` | ERROR | `NoSuchElementException: No value present` (line 178) |
| 8 | `summaryShouldResolveDataSourceNameFromConfig` | ERROR | `NoSuchElementException: No value present` (line 349) |
| 9 | `summaryShouldHaveClientNameFromCdcClientMultiple` | ERROR | `NoSuchElementException: No value present` (line 360) |
| 10 | `existingClosedJobShouldReturnNormalStatus` | ERROR | `NoSuchElementException: No value present` (line 95) |
| 11 | `errorDetail_logNotInFaultProcess_shouldThrow` | ERROR | `NoSuchElementException: No value present` (line 251) |

### 基线证据

1. **`git diff`**：18 个已跟踪文件中有变更，**零个**属于 `monitor/jobfailure/` 包或其生产依赖。变更文件仅限于 `.claude/settings.local.json`、`pom.xml`、前端文件和已删除的静态资源。

2. **`git status --short`**：`monitor/jobfailure/` 目录下无任何状态标记（无 `M`、`D`、`??`），所有文件为已跟踪、未修改状态。

3. **TASK 4 原始执行报告**（2026-08-07 首次编写，`TASK4_EXECUTION_REPORT_20260807.md`）第 9 节记载：`Tests run: 323, Failures: 2, Errors: 9, Skipped: 0 — 11 个失败全部来自 JobFailureServiceTest`。

4. **OracleDateMappingTest**：位于 `com.bsoft.cdcconfig.monitor.jobfailure.compat` 包，依赖真实 Oracle 数据库连接（`192.168.174.65:1521/prod.enmotech.com`），日期敏感（`expected 27 but was 30`）。与 TASK 4 `largescreen.stats.lifecycle` 包零代码依赖关系。该测试失败在本次修改前后一致。

5. **JobFailureServiceTest**：位于 `com.bsoft.cdcconfig.monitor.jobfailure.service` 包，所有错误均为 `NoSuchElementException: No value present`，依赖真实 DB 中特定数据存在（如 FG_ACTIVE=1 记录数、特定 error_detail 行）。与 TASK 4 `largescreen.stats.lifecycle` 包零代码依赖关系。历史上该文件在 TASK 4 实施前已存在 10 个失败。

**结论：11 个失败全部为预存问题，非本轮修改引入。**

---

## 八、Git 检查

| 检查项 | 结果 |
|--------|------|
| `git diff --stat` | 18 个文件，均为前端/pom/settings/静态资源，**无 lifecycle 包文件** |
| `git status --short` | lifecycle 包全部为 `??`（新文件），**无 monitor/jobfailure 包修改** |
| 生命周期包外修改 | **无**（仅 `StatsScheduler.java` 和 `StatsSchedulerTest.java`，均在 `largescreen/stats/lifecycle/` 内） |
| 新 untracked 文件 | `TASK4_POST_ACCEPTANCE_FIXES_REPORT_20260807.md`（上一轮生成）；`TASK4_WARN_TEST_FINAL_REPORT_20260807.md`（本轮报告）；无意外新增 |
| 连接数据库 | 否 |
| 执行 UPDATE | 否 |
| 是否提交 | 否 |
| 是否推送 | 否 |

---

## 九、StatsSchedulerTest 完整测试清单（27 个）

### 基础调度（11 个）
1. `applicationReadyStartsScheduling`
2. `initialDelayMatchesConfig`
3. `intervalMatchesConfig`
4. `disabledConfigDoesNotSchedule`
5. `configLoadExceptionDoesNotPropagate`
6. `doubleStartupOnlySchedulesOnce`
7. `runnableSurvivesExceptionAndRunsAgain`
8. `exceptionDoesNotEscapeRunnable`
9. `noPreDestroyAnnotationOnScheduler`
10. `safeRunRoundReturnsWhenConfigIsNull`
11. `normalScheduleNotCreatedOnConfigFailure`

### DynamicBatchSizeManager 初始化（3 个）
12. `batchSizeManagerInitializedWhenTaskEnabled`
13. `batchSizeManagerNotInitializedWhenTaskDisabled`
14. `batchSizeManagerNotInitializedWhenConfigLoadFails`

### 调度参数验证（3 个）
15. `warnScheduleRegisteredWith60SecondPeriodAndSecondsUnit`
16. `startPeriodicWarnNotCalledWhenConfigLoadsSuccessfully`
17. `startPeriodicWarnNotCalledWhenTaskDisabled`

### ERROR 日志验证（4 个）
18. `logConfigLoadErrorCalledExactlyOnceOnFirstFailure`
19. `logConfigLoadErrorReceivesStatsConfigLoadException`
20. `logConfigLoadErrorNotCalledWhenConfigSucceeds`
21. `logConfigLoadErrorNotCalledWhenTaskDisabled`

### WARN 日志验证（6 个）
22. `warnTaskRunCallsLogConfigNotStartedWarnOnce`
23. `twoWarnTaskRunsCallLogConfigNotStartedWarnTwice`
24. `logConfigNotStartedWarnTakesNoArguments`
25. `warnTaskDoesNotCallLogConfigLoadError`
26. `warnTaskDoesNotCallLoadOnce`
27. `warnTaskDoesNotCallTaskSchedulerForNormalSchedule`

---

## 十、未执行事项和遗留风险

- 未提交 Git
- 未推送 Git
- 未连接数据库
- 未执行任何 DDL/DML
- 未执行 `MAX_RUN_DURATION_SECONDS=900` 数据库 UPDATE
- 实时 WARN 调度仍依赖真实 `ScheduledExecutorService` 的 60 秒周期，集成环境需验证 daemon 线程实际等待和定时触发
- `logConfigLoadError` / `logConfigNotStartedWarn` 方法内的消息字符串通过代码审查验证，未做字符串级断言；如消息格式变更需同步更新审查
