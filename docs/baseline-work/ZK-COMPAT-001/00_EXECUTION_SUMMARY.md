# 00_EXECUTION_SUMMARY — ZK-COMPAT-001 / R1 / R2 执行摘要

## 任务标识

- 任务编号：ZK-COMPAT-001 (原), ZK-COMPAT-001-R1 (修订), ZK-COMPAT-001-R2 (证据补齐)
- 任务目标：Curator 2.13.0 依赖统一、项目应用层验证、报告证据补齐
- 执行日期：2026-08-11
- 前置任务：ZK-ENV-001（ZK 环境配置与只读连接验证）

## Git 现场

| 项目 | 值 |
|---|---|
| 分支 | develop |
| 任务开始 HEAD | 8822795f55e3d6e39d273551194a51908aa1a337 |
| 任务结束 HEAD | 8822795f55e3d6e39d273551194a51908aa1a337（一致，未提交） |

**git status --short 已修改文件（未跟踪文件仅列出相关项）：**

```
M .claude/settings.local.json
 M CLAUDE.md
 M agent-env.sh
 M backend/pom.xml
 M backend/src/main/resources/application-dev.yml
 M frontend/src/config/menu.ts
?? docs/baseline-work/ZK-COMPAT-001/
   (5 reports: 00-03 revised, 04 new)
```

**pom.xml 完整 diff（前置任务 + R1 注释修正）：**

```diff
-        <curator.version>4.3.0</curator.version>
-        <zookeeper.version>3.5.6</zookeeper.version>
+        <curator.version>2.13.0</curator.version>
+        <zookeeper.version>3.4.14</zookeeper.version>

-        <!-- ZooKeeper (match production 3.5.6) -->
+        <!-- ZooKeeper (match production 3.4.14) -->
```

**application-dev.yml diff（前置任务 ZK-ENV-001，R2 未修改）：**

```diff
-    connect-string: ${CDC_ZK_CONNECT:192.168.174.51:2181}
+    connect-string: ${CDC_ZK_CONNECT:10.19.16.111:2181}
```

**ZK-COMPAT-001/ 报告 diff**：所有 5 份报告均为 untracked（新增），git diff 无输出。

## 执行结果

**状态：PASS — 各层独立验证通过，报告证据已补齐**

## 阶段性结果

| 阶段 | 名称 | 结果 |
|---|---|---|
| 0 | 任务开始协议 | PASS |
| 1 | 修改前依赖审计 | PASS — 依赖树已统一，无 curator-recipes |
| 2 | pom.xml 修改 | PASS — 仅 1 处注释修正 |
| 3 | 修改后依赖验证 | PASS — 所有 Curator 2.13.0，无 4.3.0 |
| 4 | 构建与测试 | 见下文测试结果 |
| 5 | 写路径审计 | PASS — 严格只读 |
| 6 | 应用层验证 | PASS — 全链路通过 |
| 7 | R2 证据补齐 | DONE — 5 份报告修订 |

## 构建结果

| 阶段 | 命令 | 结果 | 退出码 | 说明 |
|---|---|---|---|---|
| compile | `mvn clean compile` | PASS | 0 | 132 源文件，仅 1 处已存在 deprecation 警告 |
| test | `mvn test` | PRE-EXISTING_FAILURE | 1 | 2 个测试类失败，均经 HEAD 基线确认为预存 |
| | | | | （基线 HEAD=8822795, Curator 4.3.0/ZK 3.5.6, 相同失败）|
| package with tests | `mvn clean package` | FAIL | 1 | 因预存测试失败阻塞 |
| package with skipped tests | `mvn clean package -DskipTests` | PASS | 0 | JAR 生成成功 |

## 测试统计（来自 Surefire XML 报告）

**总数**：31 测试类，396 测试用例

| 指标 | 数值 |
|---|---|
| Tests run | 396 |
| Failures | 2 |
| Errors | 9 |
| Skipped | 0 |
| 成功用例 | 385 |
| 失败测试类 | 2 |
| 失败测试用例 | 11 (2 failures + 9 errors) |

**失败测试类详情**：

| 测试类 | tests | failures | errors | 失败原因 |
|---|---|---|---|---|
| OracleDateMappingTest | 2 | 1 | 0 | `oracleDateToLocalDateTime_viaJdbcTemplate_shouldMapCorrectly` — AssertionFailedError: expected 27 but was 30。该测试启动完整 Spring Boot 上下文，连接 Oracle 执行 JdbcTemplate 查询，DATE 列返回值与硬编码预期不符 |
| JobFailureServiceTest | 25 | 1 | 9 | 1 failure: `summaryShouldReturnAllFgActiveLogicalJobs` — 预期 >=2 条 FG_ACTIVE=1 记录，实际数据库中不足。9 errors: `NoSuchElementException: No value present` — 查询返回空 Optional |

**HEAD 基线对比**（mktemp + git archive HEAD=8822795, Curator 4.3.0/ZK 3.5.6）：

```
OracleDateMappingTest: tests=2 failures=1 errors=0 — 相同失败
JobFailureServiceTest: tests=25 failures=1 errors=9 — 相同失败
HEAD total: tests=27 failures=2 errors=9 — 与 Current 完全一致
```

两个测试类失败均与 Curator/ZK 版本无关，为 PRE-EXISTING_FAILURE。

## Runtime / Test classpath 分离

| 项目 | Runtime CP (includeScope=runtime) | Test CP (default scope) |
|---|---|---|
| curator-framework | 2.13.0 | 2.13.0 |
| curator-client | 2.13.0 | 2.13.0 |
| curator-test | **不在** | 2.13.0 |
| curator-recipes | **不在** | **不在** |
| Curator 4.3.0 | **无** | **无** |
| zookeeper | 3.4.14 | 3.4.14 |

curator-recipes 当前未声明、未解析、未加载。

## 项目配置解析验证

加载方式：SnakeYAML 解析 `application-dev.yml`，正则表达式解析 `${VAR:default}` 占位符，以 `System.getenv()` 取值。

| 配置项 | 原始值 | 解析后 |
|---|---|---|
| connect-string | `${CDC_ZK_CONNECT:10.19.16.111:2181}` | `10.19.16.111:2181` |
| root-path | `${CDC_ZK_ROOT:/bsoft-cdc}` | `/bsoft-cdc` |
| session-timeout-ms | `30000` | `30000` |
| connection-timeout-ms | `15000` | `15000` |

CDC_ZK_CONNECT 和 CDC_ZK_ROOT 由 `agent-env.sh` 提供，解析后的值与正式配置一致。

## 各层独立结论

| 层 | 结果 | 说明 |
|---|---|---|
| 依赖解析层 | PASS | 所有 Curator 2.13.0, ZK 3.4.14, 无跨版本混用 |
| runtime classpath 层 | PASS | curator-framework/client 2.13.0, zookeeper 3.4.14, 无 curator-test, 无 Curator 4.3.0 |
| test classpath 层 | PASS | 含 curator-test 2.13.0, curator-recipes 不存在 |
| 编译层 | PASS | 132 源文件，0 错误 |
| 测试层 | PRE-EXISTING_FAILURE | 2 类 11 用例失败，经 HEAD 基线确认为预存，与 Curator/ZK 无关 |
| 跳过测试的打包层 | PASS | `mvn clean package -DskipTests` 成功 |
| 项目配置解析层 | PASS | application-dev.yml 解析 → 占位符解析 → ZooKeeperConfig 注入 → curatorFramework() 调用 |
| 项目 Bean 层 | PASS | ZooKeeperConfig.curatorFramework() 真实方法创建 CuratorFrameworkImpl |
| Client 层 | PASS | ZooKeeperReadOnlyClient (checkExists/getChildren/getData) 全部成功 |
| Service 层 | PASS | ZooKeeperMonitorServiceImpl.getClients() 成功，69ms，partialFailure=false |
| 安全层 | PASS | 全过程无 ZK 写操作；log4j 1.2.17 由 ZK 3.4.14 传递引入，属于已停止维护的遗留风险，登记为后续依赖治理事项 |
| Git 范围层 | PASS | R2仅修改docs/baseline-work/ZK-COMPAT-001/下5份报告；application-dev.yml、menu.ts等工作区修改均为R2开始前既有修改，R2未修改、未覆盖，完整保留。 |

## R2 验证命令摘要

```
# 临时目录
mktemp -d → /tmp/tmp.otcdlxdKGY

# 编译（runtime classpath）
javac -cp "target/classes:$RUNTIME_CP" -d $TMP ConfigVerifier.java

# 运行（runtime classpath）
java -cp "$TMP:target/classes:$RUNTIME_CP" ConfigVerifier
退出码: 0

# 配置加载方式
SnakeYAML → application-dev.yml → cdc.zookeeper.* → System.getenv() 解析 ${VAR:default}

# Bean 创建方式
ZooKeeperConfig.setXxx(resolved_values) → zkConfig.curatorFramework() (真实 @Bean 方法)

# Client/Service 构造
new ZooKeeperReadOnlyClient(client, zkConfig)
new NodeDataParser()
new MonitorConfig() → setScnStaleThresholdHours(24)
new ZooKeeperMonitorServiceImpl(zkClient, parser, monitorConfig) → getClients()

# 客户端关闭
client.close() → Session closed, exit code 0
```

## 未执行操作

- 未修改 pom.xml（除 R1 注释修正）
- 未修改业务代码、测试代码、配置文件、前端代码
- 未操作数据库
- 未写入 ZooKeeper
- 未启动完整 Spring Boot 应用
- 未 commit，未 push
- 临时验证目录位于/tmp，未写入项目工作区，不属于交付文件。
