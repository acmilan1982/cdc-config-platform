# 02_READ_ONLY_COMPATIBILITY_VERIFICATION — ZK-COMPAT-001-R2 只读兼容性验证

## 1. 验证策略

| 层 | 验证内容 | 方式 |
|---|---|---|
| 依赖层 | 版本差异、依赖链、传递依赖 | mvn dependency:tree, effective-pom, build-classpath |
| 审计层 | ZK 代码写路径审计 | rg 扫描 create/setData/delete 等 |
| 探针层 | 纯 Curator 只读探针 | 独立 Java 程序（ZK-COMPAT-001） |
| 构建层 | 编译/测试/打包 | mvn clean compile, test, package |
| 配置层 | application-dev.yml 占位符解析 + 真实 Bean 方法 | SnakeYAML 解析 + System.getenv() + ZooKeeperConfig.curatorFramework() |
| 链路层 | 项目完整读链路（runtime classpath） | ConfigVerifier.java（mktemp 临时目录） |

## 2. 写路径审计

审计范围：`backend/src/main/java/com/bsoft/cdcconfig/monitor/zookeeper/`

| 搜索模式 | 结果 |
|---|---|
| `create(` (ZK 写) | 未发现 |
| `setData` | 未发现 |
| `delete(` | 未发现 |
| `createContainers` | 未发现 |
| `transaction(` | 未发现 |
| `PersistentNode` | 未发现 |
| `PersistentEphemeralNode` | 未发现 |
| `ServiceDiscovery` | 未发现 |
| `NodeCache` | 未发现 |
| `PathChildrenCache` | 未发现 |
| `CuratorCache` | 未发现 |

只读操作确认：

| 文件 | 操作 |
|---|---|
| ZooKeeperConfig.java | `CuratorFrameworkFactory.builder()...build()` + `start()` |
| ZooKeeperReadOnlyClient.java | `checkExists()`, `getChildren()`, `getData()`, `isAlive()` |
| ZooKeeperMonitorServiceImpl.java | 通过 ReadOnlyClient 读取 IP/status/alive/jobs/SCN |

**审计结论：严格只读。**

## 3. 构建验证

### 3.1 compile

```
mvn clean compile
结果: BUILD SUCCESS, 退出码 0
编译: 132 源文件, 0 错误
警告: LogBatchReader.java 使用已弃用 API（预存，与 Curator/ZK 无关）
```

### 3.2 test

```
mvn test
结果: BUILD FAILURE, 退出码 1
统计: tests=396, failures=2, errors=9, skipped=0
成功: 385
```

失败类详情（来自 Surefire XML）：

| 测试类 | tests | failures | errors | 类型 |
|---|---|---|---|---|
| OracleDateMappingTest | 2 | 1 | 0 | org.opentest4j.AssertionFailedError: expected: <27> but was: <30> |
| JobFailureServiceTest | 25 | 1 | 9 | 1× AssertionFailedError (FG_ACTIVE 数据不足) + 9× NoSuchElementException (查询无结果) |

**HEAD 基线隔离验证**（mktemp + git archive HEAD=8822795, Curator 4.3.0/ZK 3.5.6）：

```
OracleDateMappingTest: tests=2 failures=1 errors=0 — 相同失败
JobFailureServiceTest: tests=25 failures=1 errors=9 — 相同失败
总: tests=27 failures=2 errors=9 — 与 Current 完全一致
```

两个测试类失败均与 Curator/ZK 版本无关，判定为 **PRE-EXISTING_FAILURE**。

失败原因归因：

- **OracleDateMappingTest**：测试启动完整 `@SpringBootTest` 上下文，通过 JdbcTemplate 查询 Oracle DATE 列，返回值（30）与硬编码预期（27）不符。需要 Oracle 数据验证和修正，与 Curator/ZK 无关。
- **JobFailureServiceTest**：9 个 error 均为 `NoSuchElementException: No value present`（查询返回空结果）；1 个 failure 为预期 >=2 条 FG_ACTIVE=1 记录不满足。均需数据库有特定测试数据，与 Curator/ZK 无关。

### 3.3 package with tests

```
mvn clean package
结果: BUILD FAILURE
原因: 预存测试失败阻塞（非 Curator/ZK 导致）
```

### 3.4 package with skipped tests

```
mvn clean package -DskipTests
结果: BUILD SUCCESS, 退出码 0
产物: backend/target/cdc-config-platform-backend-1.0.0-SNAPSHOT.jar
```

## 4. 项目配置解析验证（R2 新增）

### 4.1 验证方式

临时程序 `ConfigVerifier.java`（mktemp 目录 /tmp/tmp.otcdlxdKGY），使用 runtime classpath：

1. SnakeYAML 解析 `src/main/resources/application-dev.yml`
2. 正则表达式 `${VAR:default}` → `System.getenv(VAR)` 或 `default`
3. 解析值注入 `ZooKeeperConfig` 对象
4. 调用 `ZooKeeperConfig.curatorFramework()` 真实 @Bean 工厂方法
5. 无 Spring 容器、无 DataSource、无 MyBatis、无定时任务

### 4.2 编译与运行

```
javac -cp "target/classes:$RUNTIME_CP" -d $TMP ConfigVerifier.java → 退出码 0
java -cp "$TMP:target/classes:$RUNTIME_CP" ConfigVerifier → 退出码 0
```

### 4.3 配置解析结果

| 配置项 | 原始占位符 | 解析值 |
|---|---|---|
| connect-string | `${CDC_ZK_CONNECT:10.19.16.111:2181}` | `10.19.16.111:2181` |
| root-path | `${CDC_ZK_ROOT:/bsoft-cdc}` | `/bsoft-cdc` |
| session-timeout-ms | `30000` | `30000` |
| connection-timeout-ms | `15000` | `15000` |

环境变量 CDC_ZK_CONNECT 和 CDC_ZK_ROOT 由 `agent-env.sh` 提供。

### 4.4 分层验证结果

| 步骤 | 验证内容 | 结果 |
|---|---|---|
| 1 | application-dev.yml 解析 | YAML loaded: true |
| 2 | 占位符解析 | connect=10.19.16.111:2181, root=/bsoft-cdc |
| 3 | ZooKeeperConfig 注入 | PASS |
| 4 | curatorFramework() Bean 方法 | 返回 CuratorFrameworkImpl |
| 5 | 连接建立 | blockUntilConnected 73ms, CONNECTED |
| 6 | ZooKeeperReadOnlyClient | clientsPathExists=true, clientCount=1 |
| 7 | NodeDataParser | 构造成功 |
| 8 | getClients() | source=/bsoft-cdc/clients, clientCount=1, partialFailure=false, 69ms |
| 9 | 客户端关闭 | Session closed, 正常 |
| 10 | 进程退出码 | 0 |

## 5. 纯 Curator 探针（ZK-COMPAT-001）

Current Workspace (Curator 2.13.0 + ZK 3.4.14):

| 步骤 | 操作 | 结果 |
|---|---|---|
| 1 | Build CuratorFramework | PASS |
| 2 | blockUntilConnected(30s) | PASS, ~85ms |
| 3-9 | checkExists/getChildren/getData | 全部 PASS |

退出码：0

## 6. Runtime 版本证据（来自 ProtectionDomain/CodeSource）

| 组件 | Jar | Implementation-Version |
|---|---|---|
| Curator Framework | curator-framework-2.13.0.jar | (manifest 未声明) |
| Curator Client | curator-client-2.13.0.jar | (manifest 未声明) |
| ZooKeeper Client | zookeeper-3.4.14.jar | 3.4.14-4c25d480e66aadd371de8bd2fd8da255ac140bcf |
| Curator Recipes | ClassNotFoundException | 不在 classpath |

Java: 1.8.0_202 (Oracle Corporation)

## 7. 数据保护

验证输出仅含：客户端数量、布尔状态、readStatus、partialFailure、byte length、stat version。业务节点数据（名称、IP、Job ID、SCN、机构名称）均未出现在控制台或报告中。

## 8. ZK 写操作确认

全过程执行的操作：checkExists, getChildren, getData, close。无 create, setData, delete, transaction 或其他写操作。

## 9. 安全风险

log4j 1.2.17 由 ZooKeeper 3.4.14 传递引入，属于已停止维护的遗留风险。本任务不扩大范围修改，登记为后续依赖治理事项。
