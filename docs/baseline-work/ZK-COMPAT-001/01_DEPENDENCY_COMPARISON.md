# 01_DEPENDENCY_COMPARISON — ZK-COMPAT-001-R2 依赖对比分析

## 1. 版本属性

| 属性 | HEAD (8822795, 已提交) | Current Workspace (R2 验证) |
|---|---|---|
| curator.version | 4.3.0 | 2.13.0 |
| zookeeper.version | 3.5.6 | 3.4.14 |
| Spring Boot | 2.7.18 | 2.7.18（不变） |

## 2. 实际解析版本（R2 实测）

### 2.1 Runtime classpath（includeScope=runtime）

```
mvn dependency:build-classpath -DincludeScope=runtime
```

| Jar | 版本 | 来源 |
|---|---|---|
| curator-framework-2.13.0.jar | 2.13.0 | 直接声明 |
| curator-client-2.13.0.jar | 2.13.0 | 传递（curator-framework） |
| zookeeper-3.4.14.jar | 3.4.14 | 直接声明 |

- curator-test: **不在 runtime classpath**（test scope）
- curator-recipes: **不在 runtime classpath**（未声明）
- Curator 4.3.0: **不在 runtime classpath**

### 2.2 Test classpath（default scope）

```
mvn dependency:build-classpath
```

| Jar | 版本 | 来源 |
|---|---|---|
| curator-framework-2.13.0.jar | 2.13.0 | 直接声明 |
| curator-client-2.13.0.jar | 2.13.0 | 传递 |
| curator-test-2.13.0.jar | 2.13.0 | 直接声明（test scope） |
| zookeeper-3.4.14.jar | 3.4.14 | 直接声明 |

- curator-recipes: **不在 test classpath**（未声明、未解析）
- Curator 4.3.0: **不在 test classpath**

## 3. curator-recipes 不存在确认

ZK-COMPAT-001 原报告称 "curator-recipes 4.3.0 与 curator-framework 2.13.0 跨版本混用"。R1/R2 三次独立验证均确认 **该结论不成立**。

| 验证方式 | 结果 |
|---|---|
| `mvn dependency:tree -Dincludes=org.apache.curator` | 仅 curator-framework 2.13.0 + curator-client 2.13.0 + curator-test 2.13.0 |
| `mvn dependency:tree \| grep recipes` | 无输出 |
| `mvn dependency:build-classpath` (runtime + test) | 无 curator-recipes jar |
| Java `Class.forName("org.apache.curator.framework.recipes.leader.LeaderLatch")` | ClassNotFoundException |
| pom.xml 全文搜索 | 无 "curator-recipes" 字符串 |

**准确表述**：当前实际解析的 Curator 组件均为 2.13.0；curator-recipes 未声明、未解析、未加载。

## 4. 完整依赖树（Current Workspace, R2 实测）

```
com.bsoft:cdc-config-platform-backend:jar:1.0.0-SNAPSHOT
├── org.apache.curator:curator-framework:jar:2.13.0:compile
│   └── org.apache.curator:curator-client:jar:2.13.0:compile
├── org.apache.zookeeper:zookeeper:jar:3.4.14:compile
│   ├── org.slf4j:slf4j-api:jar:1.7.36:compile
│   ├── org.slf4j:slf4j-reload4j:jar:1.7.36:compile
│   ├── log4j:log4j:jar:1.2.17:compile
│   ├── jline:jline:jar:0.9.94:compile
│   ├── org.apache.yetus:audience-annotations:jar:0.5.0:compile
│   └── io.netty:netty:jar:3.10.6.Final:compile
└── org.apache.curator:curator-test:jar:2.13.0:test
    ├── org.javassist:javassist:jar:3.18.1-GA:test
    └── com.google.guava:guava:jar:16.0.1:compile
```

## 5. 传递依赖分析

| 组件 | 版本 | 来源 | Scope | 风险 |
|---|---|---|---|---|
| Netty | 3.10.6.Final | ZK 3.4.14 (compile) | compile | org.jboss.netty 命名空间，与 Netty 4.x 无冲突 |
| SLF4J | 1.7.36 | ZK 3.4.14 (compile) | compile | Spring Boot 2.7.18 管理，版本统一 |
| Guava | 16.0.1 | curator-test 2.13.0 (test) | compile (transitive) | 仅 test classpath 可见，不影响生产部署 |
| log4j | 1.2.17 | ZK 3.4.14 (compile) | compile | 已停止维护，登记为后续依赖治理事项（本任务不修改） |
| jline | 0.9.94 | ZK 3.4.14 (compile) | compile | ZK CLI 使用，项目不直接调用 |
| audience-annotations | 0.5.0 | ZK 3.4.14 (compile) | compile | 仅注解，无运行时影响 |

## 6. pom.xml 修改记录

### 前置任务修改（属性值，R2 未修改）

```diff
-        <curator.version>4.3.0</curator.version>
-        <zookeeper.version>3.5.6</zookeeper.version>
+        <curator.version>2.13.0</curator.version>
+        <zookeeper.version>3.4.14</zookeeper.version>
```

### R1 修改（注释修正，R2 未修改）

```diff
-        <!-- ZooKeeper (match production 3.5.6) -->
+        <!-- ZooKeeper (match production 3.4.14) -->
```

### 无其他修改

- curator-framework 依赖声明：无修改（使用 `${curator.version}` 属性）
- zookeeper 依赖声明：无修改（使用 `${zookeeper.version}` 属性）
- curator-test 依赖声明：无修改（使用 `${curator.version}` 属性）
- exclusion 配置：无修改
- dependencyManagement：无修改

## 7. effective-pom Curator/ZK 相关

```
属性:
  curator.version=2.13.0
  zookeeper.version=3.4.14

直接依赖:
  curator-framework:${curator.version} [exclude zookeeper] → 2.13.0 compile
  zookeeper:${zookeeper.version} → 3.4.14 compile
  curator-test:${curator.version} [test, exclude zookeeper] → 2.13.0 test

dependencyManagement (来自 spring-boot-starter-parent 2.7.18):
  spring-integration-zookeeper:5.5.20 (managed, 未被使用)
```
