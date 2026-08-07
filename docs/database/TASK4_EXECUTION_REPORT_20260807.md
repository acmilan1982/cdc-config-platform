# TASK 4 最终执行报告

**日期**: 2026-08-07
**任务编号**: TASK_4
**分支**: develop
**HEAD**: 1fb4434a2a032fb6919d5a89c671dc41cbf70905

---

## 1. 总体结论

TASK 4 实施完成。所有 153 个 stats 相关测试通过（0 失败、0 错误），编译成功。含 3 项验收后修正。未连接数据库、未执行 UPDATE、未提交、未推送。

---

## 2. 实际修改的文件清单

### 新增生产源码（8 个）

| 文件 | 职责 |
|------|------|
| `lifecycle/StatsConfigLoadException.java` | 配置加载失败异常 |
| `lifecycle/RoundRunStatus.java` | 运行结果枚举：EXECUTED / SKIPPED_LOCKED / FAILED |
| `lifecycle/RoundRunResult.java` | 运行结果值对象 |
| `lifecycle/StatsTaskConfigLoader.java` | 三态状态机（NOT_ATTEMPTED/LOADED/FAILED）配置加载 |
| `lifecycle/SafeUpperIdProvider.java` | 双流 MAX 查询 + 安全上限计算 |
| `lifecycle/DynamicBatchSizeManager.java` | 每流动态批大小管理（initialize + adjust） |
| `lifecycle/StatsRoundRunner.java` | 锁→安全上限→批大小→RoundExecutor→调整→释放 |
| `lifecycle/StatsScheduler.java` | ApplicationReadyEvent 调度 + 周期 WARN |

### 修改生产文件（6 个）

| 文件 | 修改内容 |
|------|---------|
| `config/StatsConfig.java` | 新增 `statsTaskScheduler()` Bean |
| `executor/RoundExecutor.java` | 签名改为 `executeRound(config, correctSafeUpperId, errorSafeUpperId, correctBatchSize, errorBatchSize)`；移除内部 safeUpperId 计算；使用参数 batchSize 替代 `config.getBatchSize()` |
| `dto/RoundResult.java` | `safeUpperId` → `correctSafeUpperId` + `errorSafeUpperId`；保留 `@Deprecated getSafeUpperId()` 兼容 |
| `reader/LogBatchReader.java` | 新增 `readBatchStreaming(tableName, lowerId, upperId, batchSize, Consumer)` 流式方法 |
| `algorithm/BatchAggregator.java` | 新增 `aggregateStreaming(taskCode, logType, Consumer<Consumer<LogRecordProjection>>)` 流式聚合方法 |
| `executor/BatchTransactionExecutor.java` | 切换到流式路径（`aggregateStreaming()` + `readBatchStreaming()`），移除 `List<LogRecordProjection>` 局部变量 |

### 新增测试文件（5 个）

| 文件 | 测试数 |
|------|--------|
| `lifecycle/StatsTaskConfigLoaderTest.java` | 11 |
| `lifecycle/SafeUpperIdProviderTest.java` | 8 |
| `lifecycle/DynamicBatchSizeManagerTest.java` | 12 |
| `lifecycle/StatsRoundRunnerTest.java` | 12 |
| `lifecycle/StatsSchedulerTest.java` | 11 |

### 修改测试文件（2 个）

| 文件 | 修改内容 |
|------|---------|
| `executor/RoundExecutorTest.java` | 所有 8 个测试适配新签名 + 新增 `perStreamBatchSizesUsed`、`safeUpperIdsPreservedFromParameters` |
| `executor/BatchTransactionExecutorTest.java` | 全部 5 个测试改为 Mock `aggregateStreaming()` + `Consumer` 参数 |

---

## 3. 关键实现说明

### 配置加载

三态状态机：`NOT_ATTEMPTED → LOADED`（成功）或 `NOT_ATTEMPTED → FAILED`（失败）。

- `synchronized(lock)` 确保并发只有一个线程执行首次 DB 查询
- FAILED 后直接抛缓存异常，不查数据库
- Loader 不记录任何日志

### 日志职责分离

- **Loader**：不记录日志，只包装并抛出异常
- **Scheduler**：首次捕获时记录 `log.error(...)` 和完整堆栈
- 之后每 60 秒只输出无堆栈 `log.warn(...)`
- daemon `ScheduledExecutorService` 单线程，JVM 退出时自动终止

### 动态批大小

- `initialize(config.getBatchSize())` 线程安全幂等
- 相同参数重复调用安全返回
- 不同参数重复调用抛出 `IllegalStateException`
- 未初始化时 `get()` / `adjust()` 抛出 `IllegalStateException`
- `adjust()` 从调用方显式传入 `maxBatchesPerRun`，不硬编码

### 流式聚合

生产路径不产生中间 `List<LogRecordProjection>`：

```
executeBatch() @Transactional
  ├─ readCurrentWatermark()
  ├─ aggregateStreaming(taskCode, logType, sourceProvider)
  │    └─ sourceProvider.accept(rowConsumer)
  │         └─ readBatchStreaming(tableName, lowerId, upperId, batchSize, rowConsumer)
  │              └─ RowCallbackHandler: 逐行 → consumer.accept(record)
  │                   └─ 单次遍历累计到四类 Map
  ├─ mergeAll()
  ├─ casUpdate()
  └─ 提交
```

旧 `readBatch()` / `aggregate()` 方法暂时保留供测试调用，生产代码不调用，不存在运行期切换。

### 无优雅关闭

- 无 `@PreDestroy`
- 无 `stopping` 状态
- 无 `ScheduledFuture.cancel(false)`
- 无 `waitForTasksToCompleteOnShutdown` / `awaitTerminationSeconds`
- 按 `kill -9` 设计：Oracle 事务原子性保证数据安全

---

## 4. 配置加载失败处理

1. Loader 抛出 `StatsConfigLoadException`（不记录日志）
2. Scheduler 捕获 → `log.error("...", e)` 一次（完整堆栈）
3. 启动 daemon `ScheduledExecutorService("cdc-stats-config-warn")`
4. 每 60s `log.warn("Stats scheduling not started: config load failed, check CDC_STATS_TASK_CONFIG")` 无堆栈
5. 不影响应用其他功能（`ApplicationReadyEvent` 内 try-catch）
6. daemon 线程随 JVM 退出自动终止

---

## 5. 动态批大小算法

| 条件 | 动作 | 范围 |
|------|------|------|
| `!caughtUp && !failed && batchCount >= maxBatchesPerRun && !time_limit` | 该流 +10000 | 上限 500000 |
| `timeLimit && batchCount > 0 && !failed && !caughtUp` | 该流 -10000 | 下限 50000 |
| caughtUp / failed / empty(batchCount==0) / lock-skipped | 不调整 | — |

- 初始值：`config.getBatchSize()`（200000）
- 步长：10000
- CORRECT / ERROR 各自独立判断，互不影响
- 仅内存，不持久化
- 重启后从数据库配置值重新初始化

---

## 6. 调度与软耗时控制

- **触发**：`ApplicationReadyEvent` → 加载配置 → 初始化动态批大小 → 启动调度
- **延迟**：`config.getStartupDelayMinutes()` × 60s = 10min
- **间隔**：`config.getScheduleIntervalMinutes()` × 60s = 60min（固定延迟，从完成开始计算）
- **软上限**：`config.getMaxRunDurationSeconds()` = 900s
- **检查点**：每批完成后 `clock.millis() >= roundDeadline`
- **已在执行的批次不中断**
- **线程池**：`ThreadPoolTaskScheduler`，poolSize=1，前缀 `cdc-stats-`
- **互斥**：`AtomicBoolean` CAS，重叠触发返回 `SKIPPED_LOCKED`
- **异常隔离**：调度 Runnable 最外层 try-catch，单轮失败不终止后续调度

---

## 7. kill -9 恢复语义

```
单批事务原子性 (@Transactional)
  ├─ 聚合结果 MERGE 和水位 CAS 在同一事务中
  ├─ 提交: 结果 + 水位一起持久化
  ├─ 回滚: 结果 + 水位一起撤销（Oracle 自动）
  └─ 重启: 从最后成功水位继续（MERGE 幂等、CAS 去重）
```

不依赖任何关闭回调保证正确性。

---

## 8. 测试清单

### 配置加载测试（11 个）

| 测试 | 断言 |
|------|------|
| `loadOnceCalledTwiceOnlyQueriesDbOnce` | 第二次不调 Mapper |
| `validConfigReturnsImmutableSnapshot` | 字段匹配，isLoaded()=true |
| `configNotFoundThrowsException` | StatsConfigLoadException，isFailed()=true |
| `multipleConfigRowsThrowsException` | StatsConfigLoadException |
| `disabledTaskLoadsSuccessfully` | enabled=0 正常返回 |
| `nullNumericFieldThrowsException` | null 字段 → 异常 |
| `outOfRangeValueThrows` | validate() 失败 → 异常 |
| `failedStateThrowsCachedExceptionWithoutQueryingDb` | 失败后再调不查 DB，抛同一实例 |
| `configNotReloadedDuringRuntime` | getConfig() 返回同一引用 |
| `concurrentLoadOnceOnlyOneDbQuery` | 10 线程并发 → 1 次 DB 查询 |
| `concurrentLoadOnceFailureCachesException` | 5 线程并发失败 → 1 次 DB 查询，全部收到异常 |

### 安全上限测试（8 个）

| 测试 | 断言 |
|------|------|
| `safeUpperIdIsMinOfMaxLogIdAndTimeBoundary` | maxLogId=1000 < timeBoundary → safe=1000 |
| `safeUpperIdClampedByTimeBoundary` | maxLogId > timeBoundary → safe=timeBoundary |
| `emptyTableReturnsSafeUpperIdZero` | maxLogId=0/null → safe=0 |
| `nullMaxIdTreatedAsZero` | queryForObject null → safe=0 |
| `correctAndErrorMaxIdsQueriedSeparately` | 两次 JdbcTemplate 调用 |
| `timeBoundaryUsesSnowflakeIdBoundaryCalculator` | 验证 maxIdAt 调用 |
| `invalidTableNameThrows` | 非法表名 → IllegalArgumentException |
| `fieldsAreAccessible` | correctMaxLogId/errorMaxLogId/timeBoundary 可访问 |

### 动态批大小测试（19 个）

| 测试 | 断言 |
|------|------|
| `notInitializedThrowsOnGet` | get → IllegalStateException |
| `notInitializedThrowsOnAdjust` | adjust → IllegalStateException |
| `initializeSetsBothStreamsToSameValue` | 200000 == 200000 |
| `initializeIsIdempotentWithSameValue` | 同参数不抛异常 |
| `initializeThrowsWithDifferentValue` | 异参数 → IllegalStateException |
| `increaseWhenBacklogAndBatchLimitReached` | 10 批 + notCaughtUp → +10000 |
| `noAdjustWhenCaughtUp` | caughtUp → 不变 |
| `noIncreaseWhenFailed` | failed → 不变 |
| `noIncreaseForEmptyBatch` | empty → 不变 |
| `increaseUsesPassedMaxBatchesPerRun` | 使用参数值判断，不硬编码 |
| `correctCausesTimeoutAndStillHasBacklogOnlyCorrectDecreases` | 仅 CORRECT -10000 |
| `errorCausesTimeoutAndStillHasBacklogOnlyErrorDecreases` | 仅 ERROR -10000 |
| `caughtUpStreamDoesNotDecreaseWhenOtherStreamCausesTimeout` | 已追平流不降 |
| `streamWithZeroBatchesDoesNotDecreaseWhenTimeout` | 0 批流不降 |
| `emptyStreamDoesNotDecreaseWhenTimeout` | 空批流不降 |
| `bothStreamsDecreaseWhenBothHaveBacklogAndTimeout` | 两流均 -10000 |
| `decreaseDoesNotGoBelowMinimum` | 不低于 50000 |
| `increaseDoesNotExceedMaximum` | 不超过 500000 |
| `failedStreamDoesNotDecreaseWhenTimeout` | 失败流不降 |

### 编排与互斥测试（12 个）

| 测试 | 断言 |
|------|------|
| `lockAcquiredRoundExecutes` | RoundExecutor 被调用 |
| `lockHeldReturnsSkippedLocked` | 并发 → SKIPPED_LOCKED |
| `lockReleasedAfterSuccess` | runRound → 可再次进入 |
| `lockReleasedAfterSafeUpperIdException` | 异常后锁释放 |
| `lockReleasedAfterRoundExecutorException` | 异常后锁释放 |
| `dynamicBatchSizeAdjustedAfterRound` | adjust() 被调用 |
| `safeUpperIdComputationFailureReturnsFailed` | 不调用 RoundExecutor |
| `executedStatusHasRoundResult` | getRoundResult() != null |
| `failedStatusHasNullRoundResult` | getRoundResult() == null |
| `uninitializedBatchSizeManagerReturnsFailedAndReleasesLock` | 未初始化 → FAILED，锁释放，不调 RoundExecutor |
| `lockCanBeReacquiredAfterSafeUpperIdFailure` | 异常后锁可重获取 |
| `lockCanBeReacquiredAfterRoundExecutorFailure` | 异常后锁可重获取 |

### 调度测试（22 个）

| 测试 | 断言 |
|------|------|
| `applicationReadyStartsScheduling` | scheduleWithFixedDelay 被调用 |
| `initialDelayMatchesConfig` | startupDelay=10min |
| `intervalMatchesConfig` | 60min |
| `disabledConfigDoesNotSchedule` | enabled=0 不调度 |
| `configLoadExceptionCaughtAndDoesNotPropagate` | 异常不传播 |
| `configLoadExceptionLoggedOnceByScheduler` | 不启动调度 |
| `doubleStartupOnlySchedulesOnce` | 两次事件 → 一次调度 |
| `runnableSurvivesExceptionAndRunsAgain` | 第一次异常，第二次仍执行 |
| `exceptionDoesNotEscapeRunnable` | RuntimeException 不传播 |
| `noPreDestroyAnnotationOnScheduler` | 无 @PreDestroy |
| `safeRunRoundReturnsWhenConfigIsNull` | getConfig()=null 不 NPE |
| `batchSizeManagerInitializedWhenTaskEnabled` | initialize(config.getBatchSize()) 被调用 |
| `batchSizeManagerNotInitializedWhenTaskDisabled` | enabled=0 不调 initialize |
| `batchSizeManagerNotInitializedWhenConfigLoadFails` | 加载失败不调 initialize |
| `periodicWarnSchedulerCreatedOnConfigFailure` | warnScheduler != null |
| `periodicWarnTaskCreatedOnConfigFailure` | warnTask != null |
| `warnTaskExecutionDoesNotThrow` | warnTask.run() 不抛异常 |
| `twoWarnTaskExecutionsDoNotThrow` | 两次 run() 不抛异常 |
| `warnTaskDoesNotCallLoadOnce` | 不额外调 loadOnce |
| `warnTaskDoesNotCallTaskScheduler` | 不调 taskScheduler |
| `noWarnSchedulerWhenConfigLoadsSuccessfully` | 成功加载 → warnScheduler=null |
| `noWarnSchedulerWhenTaskDisabled` | disabled → warnScheduler=null |

### TASK 3 回归测试

- `RoundExecutorTest`：9 个测试，全部适配新签名通过
- `BatchTransactionExecutorTest`：5 个测试，全部改为 Mock 流式路径通过
- `BatchAggregatorTest`：18 个测试未修改，全部通过
- 其余 TASK 3 测试：全部通过

---

## 9. 编译与测试结果

**编译**：
```
mvn compile -DskipTests
BUILD SUCCESS
```

**TASK 3 + TASK 4 全部测试**：
```
mvn test -Dtest="com.bsoft.cdcconfig.largescreen.**"
Tests run: 153, Failures: 0, Errors: 0, Skipped: 0
BUILD SUCCESS
```

**全量测试**：
```
mvn test
Tests run: 339, Failures: 2, Errors: 9, Skipped: 0
```
11 个失败来自 `JobFailureServiceTest`（10 个）和 `OracleDateMappingTest`（1 个），均为预存问题，非 TASK 4 引入。

---

## 10. 合规检查

| 检查项 | 结果 |
|--------|------|
| 硬编码批数 10 | 未发现 |
| 硬编码耗时 180/900 | 未发现 |
| @PreDestroy / shutdown / cancel(false) | 未发现（仅在注释中提及不存在） |
| awaitTerminationSeconds | 未发现 |
| List 批量读取生产调用 | 未发现（executor 中无 `readBatch(` 调用） |
| 旧 aggregate() 生产调用 | 未发现（executor 中无 `.aggregate(` 调用） |
| 运行期配置刷新 | 未发现 |
| 重复扫描日志表 | 未发现（单次查询单遍聚合） |
| 数据库 UPDATE | 未执行 |
| maxBatchesPerRun 硬编码 | 未发现（从 config 显式传入） |
| maxRunDurationSeconds 硬编码 | 未发现（从 config 读取） |

---

## 11. 未执行事项

- 未连接任何真实数据库
- 未执行 `MAX_RUN_DURATION_SECONDS=900` 数据库 UPDATE（属于独立人工审批操作，不计入 TASK 4）
- 未启动后端应用连接真实外部环境
- 未启动前端
- 未修改大屏前端页面
- 未提交 Git
- 未推送 Git
- 未执行 TASK 6 真实 Oracle 验证

---

## 12. 风险、遗留问题和 TASK 6 验证项

1. **流式读取 Oracle 行为**：需在 TASK 6 真实 Oracle 环境中验证：
   - 单批耗时（200K-500K 行流式读取 + 聚合 + MERGE + CAS）
   - 数据库连接占用时长（ResultSet 游标保持到批次完成）
   - JVM 内存压力（不再持有完整 List，但聚合 Map 随记录数增长）
   - 网络开销（fetchSize=500）
   - ORA-01555 快照过旧异常

2. **并发 loadOnce**：已通过 Mockito 并发测试验证，真实环境需确认 `synchronized(lock)` 在 Spring 容器下的行为

3. **周期 WARN daemon 线程**：已通过 `scheduler.warnTask.run()` 直接执行验证行为，无需真实等待 60 秒；warnScheduler/warnTask 包内可见字段支持测试

4. **动态批大小实际效果**：已在单元测试中验证边界值，生产环境需观察实际增减频率和效果，必要时调整步长、范围或增加规则

5. **`MAX_RUN_DURATION_SECONDS=900`**：DB 当前值为 180，需人工执行 `UPDATE CDC_STATS_TASK_CONFIG SET MAX_RUN_DURATION_SECONDS=900 WHERE TASK_CODE='LARGE_SCREEN_STATS'`，CHECK 约束 10-3600 已覆盖 900

---

## 13. 设计变化摘要（相对上一版计划）

| 项目 | 实现 |
|------|------|
| Loader 状态机 | NOT_ATTEMPTED / LOADED / FAILED，并发安全 |
| 日志输出 | Loader 无日志；Scheduler 首次 ERROR+堆栈，之后 60s WARN 无堆栈 |
| 动态批大小初始化 | `@Component` 无构造器参数，`initialize()` 线程安全幂等 |
| maxBatchesPerRun | 调用方显式传入，不硬编码 |
| 流式路径 | RowCallbackHandler + Consumer 回调，不产生中间 List |
| 旧 List 路径 | 保留供测试，生产不调用，无运行期切换 |
| 优雅关闭 | 完全删除（无 @PreDestroy / stopping / cancel / awaitTermination） |
| 软耗时上限 | 从 `config.getMaxRunDurationSeconds()` 读取，不硬编码 |
| 数据库变更 | `MAX_RUN_DURATION_SECONDS=900` 为独立人工审批操作 |

---

## 14. 验收后修正（2026-08-07）

基于验收反馈的 3 项小范围修正：

### 修正 1：动态批大小降档改为逐流独立判断

**问题**：原实现 `time_limit_reached` 时无条件两端同时 -10000。

**修正**：每个流独立判断降档条件：`timeLimit && batchCount > 0 && !failed && !caughtUp`。只有本轮实际执行过非空批次且仍有积压的流才降档。

**代码变更**：
- `DynamicBatchSizeManager.java`：删除 `decreaseBoth()`，`adjustStream()` 中降档条件增加 `batchCount > 0` 检查
- `DynamicBatchSizeManagerTest.java`：新增 8 个逐流降档测试（共 19 个），覆盖：单流降档、已追平不降、0 批不降、空批不降、双流降档、下限边界、失败不降

### 修正 2：移除 StatsRoundRunner 自动初始化

**问题**：原实现 `runRound()` 中自动调用 `batchSizeManager.initialize(config.getBatchSize())`，违反单一职责 — 初始化应仅在 StatsScheduler 中完成。

**修正**：
- `StatsRoundRunner.java`：删除自动初始化代码
- `StatsScheduler.java`：构造器注入 `DynamicBatchSizeManager`，在 `onApplicationEvent()` 加载配置成功后调用 `initialize()`
- `StatsRoundRunnerTest.java`：删除 `autoInitializesBatchSizeManager`，新增 `uninitializedBatchSizeManagerReturnsFailedAndReleasesLock`
- `StatsSchedulerTest.java`：构造器增加 `batchSizeManager` mock，新增 3 个初始化验证测试

### 修正 3：补齐周期 WARN 行为测试

**问题**：`StatsScheduler` 配置加载失败后的周期 WARN 机制缺少测试。

**修正**：
- `StatsScheduler.java`：`warnTask` (Runnable) 和 `warnScheduler` (ScheduledExecutorService) 设为包内可见 volatile 字段
- `StatsSchedulerTest.java`：新增 8 个周期 WARN 测试，通过 `scheduler.warnTask.run()` 直接执行验证，无需真实等待 60 秒：
  - `periodicWarnSchedulerCreatedOnConfigFailure`
  - `periodicWarnTaskCreatedOnConfigFailure`
  - `warnTaskExecutionDoesNotThrow`
  - `twoWarnTaskExecutionsDoNotThrow`
  - `warnTaskDoesNotCallLoadOnce`
  - `warnTaskDoesNotCallTaskScheduler`
  - `noWarnSchedulerWhenConfigLoadsSuccessfully`
  - `noWarnSchedulerWhenTaskDisabled`

### 修正后测试结果

```
mvn test -Dtest="com.bsoft.cdcconfig.largescreen.**"
Tests run: 153, Failures: 0, Errors: 0, Skipped: 0
BUILD SUCCESS
```
