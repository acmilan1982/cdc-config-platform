# 探针端管理 后端启动别名冲突修复报告（CLIENT-CONFIG-BACKEND-STARTUP-ALIAS-COLLISION-FIX-001）

## 1. 任务信息

| 项目 | 值 |
|---|---|
| 任务代码 | `CLIENT-CONFIG-BACKEND-STARTUP-ALIAS-COLLISION-FIX-001` |
| 任务类型 | `TARGETED_BACKEND_STARTUP_FIX` |
| 分支 | `develop` |
| 预期基线提交 | `40215770485fc8e0e03bb9c98737c2d759dce0b9` |
| 实际基线提交 | `40215770485fc8e0e03bb9c98737c2d759dce0b9`（远程 `origin/develop` 一致） |
| 正式复审输入 | `CHANGES_REQUIRED`（ChatGPT 对 `4021577...` 验收准备报告复审后要求修复后端启动阻断） |
| 报告路径 | `docs/features/client-config/reports/CLIENT-CONFIG-BACKEND-STARTUP-ALIAS-COLLISION-FIX-001.md` |
| 结论 | 修复完成并通过真实 JAR 启动验证，`IMPLEMENTED_PENDING_REVIEW`，等待 ChatGPT 正式代码复审 |

> 本报告仅修复后端启动阻断，未恢复用户验收执行、未创建验收数据、未修改需求或设计。
> 本报告按规范不写入“包含本报告的最终 Commit ID”，最终提交 ID 仅在 Push 后于控制台结果块输出。

## 2. Git 开始前现场与无关工作区保护（§3）

开始前执行并记录：

- 分支：`develop`；本地 `HEAD = 40215770485fc8e0e03bb9c98737c2d759dce0b9`。
- `git fetch origin develop` → 远程 `develop = 40215770485fc8e0e03bb9c98737c2d759dce0b9`；
  `git ls-remote origin refs/heads/develop = 40215770485fc8e0e03bb9c98737c2d759dce0b9`；
  `git rev-list --left-right --count HEAD...origin/develop = 0  0`。
- 结论：远程 `develop` 与预期基线一致，未触发 `BLOCKED_BASELINE_MOVED`。

任务开始前已存在的无关修改与未跟踪文件（`git status --short` 记录：`.claude/settings.local.json`、`agent-env.sh`、
`docs/database/TASK3/TASK4` 三份被删文档、`frontend/*` 若干布局/主题文件，以及百余个未跟踪项）均视为用户资产。
本任务全程未修改、未覆盖、未暂存、未提交这些内容，未使用 `git add .` / `git clean` / `git reset --hard` /
`git checkout --` / stash / rebase / force push。除白名单文件外，任务结束时的未授权区差异与开始前快照逐项一致。

## 3. 阻断根因与独立复现（§4 红灯证据）

- 根因（继承 `CLIENT-CONFIG-USER-ACCEPTANCE-PREPARATION-001` 结论，本次以真实运行时别名注册路径复现）：
  `application.yml` 的 `mybatis-plus.type-aliases-package: com.bsoft.cdcconfig` 按**简单类名**递归注册别名，
  主源树存在两个同名简单类：
  - `com.bsoft.cdcconfig.logquery.vo.DataSourceOptionVO`（既有，log-query 特性）；
  - `com.bsoft.cdcconfig.clientconfig.model.vo.DataSourceOptionVO`（client-config 特性）。
  第二个同别名注册触发 `TypeException`，`SqlSessionFactory` 初始化失败，阻断整个后端启动。

- 生产代码改名之前，新增运行时别名注册回归测试 `ClientConfigTypeAliasIntegrationTest`（真实
  `TypeAliasRegistry.registerAliases(包名)` 递归注册路径，不连接 DB、不启动 Spring、不依赖外部系统），
  修复前运行：

```text
mvn test -Dtest='ClientConfigTypeAliasIntegrationTest' -DfailIfNoTests=false
```

- 修复前结果（红灯，作为修改前证据，非最终断言）：

```text
org.apache.ibatis.type.TypeException: The alias 'DataSourceOptionVO' is already mapped
  to the value 'com.bsoft.cdcconfig.logquery.vo.DataSourceOptionVO'.
    at ClientConfigTypeAliasIntegrationTest.java:29
Tests run: 1, Failures: 0, Errors: 1, Skipped: 0
BUILD FAILURE
```

  红灯异常与生产启动根因（`The alias 'DataSourceOptionVO' is already mapped to the value
  'com.bsoft.cdcconfig.logquery.vo.DataSourceOptionVO'.`）逐字一致，证明回归测试确实经由真实 MyBatis
  别名注册机制复现生产冲突，而非字符串搜索。

## 4. 方案选择及理由（§2）

采用已批准确定方案：

1. 保持 `logquery.vo.DataSourceOptionVO` 完全不变；
2. 将 client-config 侧 `DataSourceOptionVO` 重命名为 `ClientConfigDataSourceOptionVO`；
3. 同步修改 client-config 主代码与测试中全部类型引用；
4. JSON 字段、E2 接口路径、响应结构、字段顺序与业务语义保持不变（Java 类名为内部实现，不构成接口契约变更）；
5. 增加真实调用 MyBatis 类型别名注册机制的回归测试；
6. 修复后构建可执行 JAR 并按项目真实方式启动，证明 Spring 上下文与 `SqlSessionFactory` 成功初始化。

不采用的理由：

- **不改全局 `type-aliases-package`**：该配置为平台级公共配置，缩窄或删除会影响 log-query、largescreen 等其他
  特性对所有 VO 的按名解析，属于超出本任务授权的全局改动；
- **不使用 `@Alias`**：只对单个冲突类显式命名是绕行而非消除“两个包各有一个同名简单类”这一结构性问题，
  未来同包新增同名类仍会复发，且掩盖根因；
- **不移动/不重命名 log-query 侧类**：log-query 为既有已验收特性，变更其类名影响面大于新增侧，违反最小影响；
- **不排除 MyBatis 自动配置**：会让服务“假启动”，掩盖真实缺陷，无修复价值；
- **不以 `@WebMvcTest`、编译或单元测试成功代替真实启动**：这些路径不引导 `SqlSessionFactory`，
  正是冲突未被早期发现的盲区（见验收准备报告 §6.3）。

## 5. 旧类到新类及所有引用映射（§5）

| 变更 | 文件 |
|---|---|
| 删除 + 新增（git mv） | `clientconfig/model/vo/DataSourceOptionVO.java` → `clientconfig/model/vo/ClientConfigDataSourceOptionVO.java` |
| 引用更新 | `clientconfig/controller/ClientConfigController.java`（import、`dataSourceOptions` 返回类型） |
| 引用更新 | `clientconfig/service/ClientConfigService.java`（import、方法签名） |
| 引用更新 | `clientconfig/service/impl/ClientConfigServiceImpl.java`（import、方法签名、局部变量、`new`） |
| 引用更新 | 测试 `ClientConfigStaticContractTest`（import、`responseModels_shouldNotCarryPasswordField` 的 `.class` 列表项） |
| 引用更新 | 测试 `controller/ClientConfigControllerTest`（import、2 处 `new`） |
| 引用更新 | 测试 `service/ClientConfigServiceImplTest`（import、6 处类型使用） |
| 新增 | 测试 `ClientConfigTypeAliasIntegrationTest`（真实别名注册回归测试） |

- 类成员（字段、构造、getter/setter、序列化表现、Javadoc）除类名外零改动。
- 改名后全仓库扫描：旧 `com.bsoft.cdcconfig.clientconfig.model.vo.DataSourceOptionVO` 引用计数 = **0**；
  `logquery.vo.DataSourceOptionVO` 相关文件零改动（`git status` 对 `logquery` 目录零差异）。
- 前端、7 个接口、数据模型字段名、MyBatis 全局配置均未改动。

## 6. TDD 修复后绿灯证据（§4/§6.1）

生产代码改名与引用更新完成后，同一回归测试再运行：

```text
mvn test -Dtest='ClientConfigTypeAliasIntegrationTest' -DfailIfNoTests=false
Tests run: 1, Failures: 0, Errors: 0, Skipped: 0
BUILD SUCCESS
```

- 测试最终断言期待无冲突并通过：`logquery.vo.DataSourceOptionVO` 别名唯一存在；
  client-config 侧按 `ClientConfigDataSourceOptionVO` 可解析，注册无冲突。

## 7. 新回归测试使用的真实 MyBatis 注册路径

- 测试直接使用 `org.apache.ibatis.type.TypeAliasRegistry`：
  - `registry.registerAliases("com.bsoft.cdcconfig.logquery.vo");`
  - `registry.registerAliases("com.bsoft.cdcconfig.clientconfig.model.vo");`
  - 该注册与 MyBatis-Plus `type-aliases-package` 启动时使用的别名注册路径一致（按包递归、按简单类名注册，
    通过 `DefaultVFS`/`ResolverUtil` 扫描 classpath，运行日志可见真实包扫描与类解析过程）。
  - `registry.resolveAlias("DataSourceOptionVO")` 断言唯一指向 logquery 侧；
    `registry.resolveAlias("ClientConfigDataSourceOptionVO")` 断言 client-config 侧可解析。
- 全程不连接数据库、不启动 Spring、不依赖外部系统；红灯只作修复前证据，最终断言期待成功。

## 8. 定向测试、构建与 diff 检查结果（§6.1）

| 项目 | 命令 | 结果 |
|---|---|---|
| clientconfig 定向全套 | `mvn test -Dtest='ClientConfigTypeAliasIntegrationTest,ClientConfigServiceImplTest,ClientConfigControllerTest,ClientConfigDataUtilTest,ClientConfigStaticContractTest'` | `Tests run: 90, Failures: 0, Errors: 0, Skipped: 0` → `90/90`（ServiceImpl 55 + Controller 17 + DataUtil 10 + StaticContract 7 + 新回归 1） |
| 后端构建 | `mvn clean package -DskipTests` | `BUILD SUCCESS`（产物 `cdc-config-platform-backend-1.0.0-SNAPSHOT.jar`） |
| 空白/冲突检查 | `git diff --check`、`git diff --cached --check` | 均通过（rc=0） |

前端代码零差异，本任务不要求重复执行前端 553 条测试；报告记为
`NOT_RUN_NOT_AFFECTED_ALREADY_PASS_AT_4021577_BASELINE`。

## 9. JAR 真实启动、8080 监听、只读 HTTP/API 验证（§6.2）

启动前现场：`8080` 无监听；无既有后端 Java 进程。

使用本次构建产物按项目 README 标准方式启动：

```bash
java -jar target/cdc-config-platform-backend-1.0.0-SNAPSHOT.jar
```

（启动进程 PID = `16757`，日志落于任务临时目录 `/tmp/ccfg-fix-001/backend-start.log`，不提交 Git。）

- 启动日志核验：
  - `The profile "dev" is active`；
  - 全程 **0** 次 `The alias 'DataSourceOptionVO' is already mapped`；
  - MyBatis-Plus `3.5.3.1` banner 正常；Hikari `HikariPool-1 - Start completed`（数据源连接池就绪，
    `SqlSessionFactory` 随 MyBatis-Plus 自动配置成功初始化）；
  - 启动期真实只读查询 `SELECT ... FROM CDC_STATS_TASK_CONFIG ... Total: 1` 成功；
  - `Tomcat started on port(s): 8080 (http) with context path ''`；
  - `Started CdcConfigPlatformApplication in 17.451 seconds`；
  - 日志无 `ERROR`；个别 `WARN` 均为 largescreen 实体缺 `@TableId` 的既有良性提示，与本次修复无关。
- `SqlSessionFactory` 成功初始化的判据：Spring 上下文完整启动（失败路径正是 `sqlSessionFactory` Bean 创建失败），
  且启动后经 MyBatis Mapper 完成真实只读 SELECT。
- `8080` 实际监听：`ss -ltnp` 显示 `*:8080 ... java pid=16757`。

只读 HTTP/API 验证（本机 `curl --noproxy '*'`）：

| 请求 | 结果 |
|---|---|
| `GET /`（welcome 页，稳定只读入口） | `HTTP 200` |
| `GET /api/clients`（E1 列表，进入真实 Mapper/数据库只读查询） | `HTTP 200`，`{"code":200,"message":"success","data":{...}}`，返回真实探针行（hosp-012 等）与行内数据源视图 |
| `GET /api/clients/data-source-options`（E2 候选，重命名 VO 的真实 HTTP 序列化） | `HTTP 200`，`data[]` 字段 `dataSourceId/org/dataSourceName/selectable/notSelectableReason/occupiedByClientIds` 与批准 CCFG-API-006 schema 一致，证明类名重命名未改变 JSON 契约 |

全程未打印任何密码、连接串口令或敏感数据源字段。

## 10. 启动前后 PID/端口状态及精确停止结果

| 阶段 | 状态 |
|---|---|
| 启动前 | `8080` 无监听；无后端 Java 进程 |
| 启动后 | `8080` 监听，Java 主进程 PID `16757`（本次任务启动的唯一后端进程） |
| 验证后 | `kill -TERM 16757`；进程正常退出（约 16 s 优雅关闭）；`8080` 恢复无监听；无残留 `java -jar` 进程 |
| 停止方式 | 仅停止本次启动的精确 PID `16757`，未按名称批量杀 Java 进程 |

## 11. 数据库写入、DDL、ZK/Kafka/其他程序状态（§6.2/§7）

- 数据库访问方式：仅通过应用启动期与只读接口的真实 `SELECT`（只读授权范围），未执行任何 DML/DDL；
  未对当前表、备份表做任何行级写入；未创建/修改/清理任何用户验收夹具；未连接 Oracle 源/目标业务库；
  未打印密码或完整凭据。`database_access_status=READ_ONLY`、`database_write_status=NONE`、`ddl_status=NONE`。
- ZooKeeper / Kafka：Agent 未直接连接、读取、写入或操作（`NOT_RUN_NOT_AUTHORIZED`）。后端进程自身启动时
  按应用正常行为发起 ZooKeeper 只读注册/监听连接（既有逻辑），非 Agent 驱动操作。
- 其它程序：未启动、停止或操作 `sync-client`/`sync-server`/`sync-log`/`sync-monitor`；仅启动并停止本仓库
  `cdc-config` 后端（本次构建产物）。

## 12. 六份批准基线与 76 条正式验收状态零差异

- `docs/features/client-config/` 六份批准基线（REQUIREMENTS/ACCEPTANCE/DESIGN/API/UI/DATABASE）相对基线提交
  `4021577...` 工作区零差异（未出现在任何 git 变更中）。
- `ACCEPTANCE.md` 的 76 条 `CCFG-AC-001~076` 状态未改写，仍全为 `NOT_RUN`；本任务未执行、未恢复
  `CLIENT_CONFIG_USER_ACCEPTANCE_PREPARATION`，未宣布任何正式验收通过。
- 白名单外相对基线的工作区差异与任务开始前快照逐项一致（均为既有用户资产），本任务未引入任何白名单外改动。

## 13. 实际变更文件、Commit、Push 与远程一致性（§8/§10）

仅精确暂存白名单内实际变更（逐文件，未用 `git add .`）：

```text
backend/src/main/java/com/bsoft/cdcconfig/clientconfig/model/vo/DataSourceOptionVO.java          （删除，git mv 源）
backend/src/main/java/com/bsoft/cdcconfig/clientconfig/model/vo/ClientConfigDataSourceOptionVO.java（新增）
backend/src/main/java/com/bsoft/cdcconfig/clientconfig/controller/ClientConfigController.java
backend/src/main/java/com/bsoft/cdcconfig/clientconfig/service/ClientConfigService.java
backend/src/main/java/com/bsoft/cdcconfig/clientconfig/service/impl/ClientConfigServiceImpl.java
backend/src/test/java/com/bsoft/cdcconfig/clientconfig/ClientConfigStaticContractTest.java
backend/src/test/java/com/bsoft/cdcconfig/clientconfig/controller/ClientConfigControllerTest.java
backend/src/test/java/com/bsoft/cdcconfig/clientconfig/service/ClientConfigServiceImplTest.java
backend/src/test/java/com/bsoft/cdcconfig/clientconfig/ClientConfigTypeAliasIntegrationTest.java
docs/features/client-config/reports/CLIENT-CONFIG-BACKEND-STARTUP-ALIAS-COLLISION-FIX-001.md
```

- 提交前核验：上述白名单文件为相对基线全部新增/变更；`logquery` 目录零差异；六份批准基线零差异；
  76 条验收仍全 `NOT_RUN`；`git diff --cached --check` 通过。
- Commit Message：`fix(client-config): resolve MyBatis type alias collision [CLIENT-CONFIG-BACKEND-STARTUP-ALIAS-COLLISION-FIX-001]`
- Push：普通 Push 到 `origin/develop`（非 force）。Push 后本地 `HEAD == origin/develop == git ls-remote`，
  ahead/behind = `0 0`。
- 最终 Commit ID 按规范不在本报告内自引用；Push 后于控制台结果块输出。

## 14. 明确表述

**正式验收状态仍为 `NOT_RUN`，等待项目负责人亲自验收。** 本次为针对性后端启动修复：将 client-config 侧
`DataSourceOptionVO` 重命名为 `ClientConfigDataSourceOptionVO` 消除与 log-query 的同名，新增真实 MyBatis
别名注册回归测试，修复后构建可执行 JAR 并真实启动成功（`SqlSessionFactory` 初始化、8080 监听、E1/E2 只读接口
返回规范响应），后端启动阻断解除。本任务未恢复用户验收、未创建验收数据、未修改需求/设计/API/UI/数据库设计。
实现状态 `IMPLEMENTED_PENDING_REVIEW`，下一入口为 `CHATGPT_FORMAL_STARTUP_FIX_CODE_REVIEW`。
