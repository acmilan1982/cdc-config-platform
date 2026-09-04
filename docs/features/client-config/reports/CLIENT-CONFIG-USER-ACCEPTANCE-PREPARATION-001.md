# 探针端管理 用户验收准备与真实环境联调报告（CLIENT-CONFIG-USER-ACCEPTANCE-PREPARATION-001）

## 1. 任务信息

| 项目 | 值 |
|---|---|
| 任务代码 | `CLIENT-CONFIG-USER-ACCEPTANCE-PREPARATION-001` |
| 任务类型 | `REAL_ENVIRONMENT_INTEGRATION_AND_USER_ACCEPTANCE_PREPARATION` |
| 分支 | `develop` |
| 预期基线提交 | `e1c5116dc166144028b85a00cc59db4ca7c2e319` |
| 实际基线提交 | `e1c5116dc166144028b85a00cc59db4ca7c2e319`（远程 `origin/develop` 一致） |
| 页面 / 路由 | 探针端管理 / `/config/client` |
| 报告路径 | `docs/features/client-config/reports/CLIENT-CONFIG-USER-ACCEPTANCE-PREPARATION-001.md` |
| 上游输入 | ChatGPT 对 `e1c5116...` 完成正式 R1 代码复审，结论 `REVIEW_PASS` |
| 结论 | `CHANGES_REQUIRED`（真实环境启动发现后端无法启动的阻断性集成缺陷，详见 §6/§7；本任务未进入用户可验收状态） |

> 本报告为阻断性发现报告：真实环境联调在“启动 `cdc-config` 后端”第一步即被阻断，后端进程无法启动，
> 因此未执行任何真实 API 联调、未构造任何真实联调数据、未启动前端、未向项目负责人提供可验收页面。

## 2. Git 开始前现场与无关工作区保护（§4）

开始前执行并记录：

- 分支：`develop`；本地 `HEAD = e1c5116dc166144028b85a00cc59db4ca7c2e319`。
- `git fetch origin develop` → 远程 `develop = e1c5116dc166144028b85a00cc59db4ca7c2e319`；
  `git ls-remote origin refs/heads/develop = e1c5116dc166144028b85a00cc59db4ca7c2e319`；
  `git rev-list --left-right --count HEAD...origin/develop = 0  0`。
- 结论：远程 `develop` 与预期基线一致，未触发 `BLOCKED_BASELINE_MOVED`。

任务开始前已存在的无关修改与未跟踪文件（`git status --short` 记录，约 12 个已修改文件 + 百余个未跟踪项）均视为用户资产，
本任务全程未修改、未覆盖、未暂存、未提交，未使用 `git add .` / `git clean` / `git reset --hard` / `git checkout --` / stash。
本任务相对基线仅新增本报告一个文件；其余工作区内容保持开始前原样。

## 3. 基线与实现状态复核（§5）

- 六份 Feature 基线文档状态机械核验：`REQUIREMENTS.md` / `ACCEPTANCE.md` / `DESIGN.md` / `API.md` / `UI.md` / `DATABASE.md` 元数据行均为 `APPROVED`。
- `ACCEPTANCE.md`：表格行 `CCFG-AC-001~076` 共 76 行，状态分布 76 × `NOT_RUN`（无任何 `PASS`/`ACCEPTED`/`FAIL`）；不同状态计数一致。
- 实现报告：`CLIENT-CONFIG-IMPLEMENTATION-001.md`（`IMPLEMENTED_PENDING_REVIEW`）、`CLIENT-CONFIG-IMPLEMENTATION-001-R1.md`
  （R1 收尾，`formal_code_review_status=PENDING_R1_REVIEW`）；上游 ChatGPT 对 `e1c5116...` 复审结论 `REVIEW_PASS`。
- 上述六份基线相对基线提交 `e1c5116...` 无工作区差异；代码/测试在 `e1c5116...` 提交链内一致。

## 4. 自动测试与构建复核（§7）

| 项目 | 命令 | 结果 |
|---|---|---|
| 后端定向测试 | `mvn test -Dtest='ClientConfigServiceImplTest,ClientConfigControllerTest,ClientConfigDataUtilTest,ClientConfigStaticContractTest'` | `Tests run: 89, Failures: 0, Errors: 0, Skipped: 0` → `89/89` |
| 后端构建 | `mvn clean package -DskipTests` | `BUILD SUCCESS`（产物 `cdc-config-platform-backend-1.0.0-SNAPSHOT.jar`） |
| 前端全量测试 | `npm test`（vitest run） | `Test Files 36 passed (36)`，`Tests 553 passed (553)` → `553/553` |
| 前端构建 | `npm run build` | `✓ built in 29.06s`（仅有既有 chunk>500kB 警告，非阻断） |
| 空白/冲突检查 | `git diff --check`、`git diff --cached --check` | 均通过（rc=0） |

自动测试与构建全部通过。未修改任何代码或测试来迁就上述结果。

## 5. 数据库只读核验（§6.1，未做任何写入）

使用项目既有开发库连接（`192.168.174.65:1521/prod.enmotech.com`，用户 `CDC`，Schema `CDC`）执行只读核验：

- 会话身份：`db_user=CDC`，`db_name=prod`，`current_schema=CDC`。
- 四张对象均存在：`CDC_DATA_SOURCE`、`CDC_CLIENT_MULTIPLE`、`CDC_DATA_SOURCE_2026_09_01`、`CDC_CLIENT_MULTIPLE_2026_09_05`。
- 备份可用性与列结构：当前表与对应备份表列结构完全一致，可支持行级对照。
  - `CDC_CLIENT_MULTIPLE` 与备份：`CLIENT_ID VARCHAR2(32) NN`、`CLIENT_DESC VARCHAR2(1024) NULL`、`DATA_SOURCE_ID VARCHAR2(1024) NULL`、`FG_ACTIVE VARCHAR2(1) NN`。
  - `CDC_DATA_SOURCE` 与备份：列集一致（未打印密码等敏感列内容）。
- 记录数（只读）：

| 表 | 记录数 |
|---|---|
| `CDC_DATA_SOURCE`（当前） | 20 |
| `CDC_DATA_SOURCE_2026_09_01`（备份） | 19 |
| `CDC_CLIENT_MULTIPLE`（当前） | 7 |
| `CDC_CLIENT_MULTIPLE_2026_09_05`（备份） | 7 |

- `CDC_CLIENT_MULTIPLE.CLIENT_DESC` 元数据确认为 `VARCHAR2(1024 BYTE)`（`DATA_LENGTH=1024`），与已批准 `1024 BYTE` 口径一致。
- 既有测试前缀：以安全列核验当前两表全部记录，未发现任何 `CCFG-AC-` 前缀，前缀空闲、无冲突。
- 备份核验结论：无阻断，未触发 `BLOCKED_BACKUP_VERIFICATION`。

> 观察记录（不影响本任务结论）：真实表中 `CDC_CLIENT_MULTIPLE.DATA_SOURCE_ID` 物理列宽为 `VARCHAR2(1024)`；
> 已批准业务口径按序列化结果 `<=1000 BYTE` 应用层校验（`40105`），物理余量不构成口径差异。

## 6. 真实环境联调阻断：`cdc-config` 后端无法启动（§8/§10 前置阻断）

### 6.1 复现步骤（本项目 README 既有标准启动方式）

```bash
cd /agent/cdc-config-platform/backend
mvn clean package -DskipTests          # 成功
java -jar target/cdc-config-platform-backend-1.0.0-SNAPSHOT.jar   # 启动失败
```

（README 记录的“方式一 `mvn spring-boot:run` / 方式二 `java -jar ...`”加载同一 Spring 上下文与 `dev` profile，
方式二启动失败即代表标准开发启动失败。）

### 6.2 失败现象

Spring 上下文初始化被取消（`cancelling refresh attempt`），`Application run failed`。核心异常链：

```text
Error creating bean with name 'jobFailureServiceImpl' ...
→ bean 'jobFailureEventMapper' ... bean property 'sqlSessionFactory'
→ BeanCreationException: Error creating bean with name 'sqlSessionFactory'
  (MybatisPlusAutoConfiguration)
→ BeanInstantiationException: Failed to instantiate [org.apache.ibatis.session.SqlSessionFactory]
→ org.apache.ibatis.type.TypeException: The alias 'DataSourceOptionVO' is already mapped
  to the value 'com.bsoft.cdcconfig.logquery.vo.DataSourceOptionVO'.
```

进程随后退出；`8080` 端口无监听；无残留后端进程。完整启动日志保留于任务临时目录（未提交 Git）。

### 6.3 根因分析

- `application.yml` 配置 `mybatis-plus.type-aliases-package: com.bsoft.cdcconfig`，MyBatis-Plus 启动时按**简单类名**递归注册别名。
- 后端主源树 `com.bsoft.cdcconfig` 下存在**同名简单类** `DataSourceOptionVO` 两个：
  - `com.bsoft.cdcconfig.logquery.vo.DataSourceOptionVO`（log-query 特性，提交 `afdfc88` 引入）；
  - `com.bsoft.cdcconfig.clientconfig.model.vo.DataSourceOptionVO`（client-config 特性，提交 `3d4cec1`，即 `CLIENT-CONFIG-IMPLEMENTATION-001` 新增）。
- 第二个同别名注册触发 `TypeException`，`SqlSessionFactory` 初始化失败，进而整个 Spring 上下文启动失败。
- 全后端主源扫描核对：`DataSourceOptionVO` 是**唯一**同名重复简单类，说明 client-config 新增该 VO 前应用可正常启动；
  本缺陷由 client-config 实现提交 `3d4cec1` 引入，并在 `e1c5116`（R1）仍存在（R1 未触碰该 VO）。
- 未被更早发现的解释：client-config 测试为 `@WebMvcTest` 切片（不引导 MyBatis `SqlSessionFactory`）；
  后端全量测试此前记录为 `NOT_RUN_NOT_AUTHORIZED_EXTERNAL_DEPENDENCIES`（见实现报告），未在真实启动路径暴露该冲突。

### 6.4 影响范围

- 影响**整个平台**后端（不止 `/config/client`）：任何特性、任何页面均无法由该后端提供服务。
- 直接阻断本任务 §8 真实 API 联调、§9 验收数据准备、§10 服务启动与可访问 URL 交付。

## 7. 本任务结论与 76 条验收分类

- 因 §6 阻断，§8 的 12 个真实接口联调场景**全部未执行**（`BLOCKED_NOT_RUN`），无任何真实 API 证据。
- §9 用户人工验收数据**未构造**（无服务可承载，且按安全原则未留任何夹具）。
- §10 服务与 URL：后端启动失败、未启动前端、未提供访问 URL、`external_access_status` 不适用。
- 对 `ACCEPTANCE.md` 76 条 `CCFG-AC-*`：正式状态一律保持 `NOT_RUN`（本任务未改写任何状态）。
  本任务三段分类（§11）结果：**76 条全部 `NOT_COVERED`**，唯一原因 = 后端启动阻断（`e1c5116` 基线不可启动）。
  89 条后端定向 + 553 条前端测试仅构成单元/组件层证据，不满足任何真实接口或人工视觉验收证据要求，不能据此把任一用例标为
  `AUTOMATED_EVIDENCE_READY`（对应实现路径未被真实运行证实）或 `READY_FOR_USER_VISUAL_CHECK`。
- 无 `PASS`、无 `ACCEPTED`、无 `IMPLEMENTED_ACCEPTED` 表述。

## 8. 数据库写入与测试数据处理（§6.2/§6.3）

- 已按 §6.2 在任务临时草稿中列出 DML 计划与拟用 `CCFG-AC-` 夹具清单（13 个拟插入数据源行、若干拟建探针行、清理顺序）。
- **实际执行：零 DML**。真实环境联调因后端启动阻断，未到任何写库步骤；当前表 `CDC_DATA_SOURCE` / `CDC_CLIENT_MULTIPLE` 相对开始前
  逐行零写入、零修改、零删除；两张备份表全程只读。
- 无任何待清理测试数据；无需恢复 SQL。

## 9. 服务状态与访问 URL（§10）

| 项 | 值 |
|---|---|
| 后端启动尝试 | `java -jar target/cdc-config-platform-backend-1.0.0-SNAPSHOT.jar` → 失败退出（§6） |
| 后端 PID / 端口 | 启动进程 `15084`（Java 主进程）已退出；`8080` 无监听 |
| 后端日志 | `/tmp/ccfg-ac-prep-001/backend.log`（任务临时目录，未提交） |
| 前端 | 未启动（后端不可用则页面无法联调，按 §14.7 停止） |
| 用户访问 URL | 不适用（服务未运行）；`external_access_status=NOT_APPLICABLE_BLOCKED` |

## 10. 失败、阻断与未覆盖项汇总

1. **阻断（主）**：`cdc-config` 后端在基线 `e1c5116` 无法启动——MyBatis-Plus 别名冲突 `DataSourceOptionVO`
   （`clientconfig.model.vo` 与 `logquery.vo`），根因与影响见 §6。→ 结论 `CHANGES_REQUIRED`。
2. 未覆盖：§8 全部 12 场景、§9 验收数据、§10 页面交付、76 条 `CCFG-AC-*` 真实/视觉证据（§7）。
3. 其余：无测试失败、无构建失败、无 `git diff --check` 失败、无数据库门禁阻断。

## 11. 安全与边界声明

- 数据库：仅对授权两张当前表做只读查询；未对任何表执行 DML/DDL；两张备份表只读未写；未连接任何 Oracle 源/目标业务库；
  未执行任何数据源连接测试；未打印密码或完整凭据。
- ZooKeeper / Kafka：全程未读取、未写入、未连接（`NOT_RUN_NOT_AUTHORIZED`）。
- 其它程序：未启动、停止或操作 `sync-client`/`sync-server`/`sync-log`/`sync-monitor`；仅尝试启动本仓库 `cdc-config` 后端（失败）。
- 未修改任何业务代码、测试代码、配置文件或已批准 Feature 基线；未改写任何正式验收状态。

## 12. 修复方向（仅分析，供后续独立修复任务采用，本任务不实施）

后端若需恢复可启动，需另立修复任务处理同别名冲突。可选方向（供 ChatGPT 复审与修复任务裁决，均为代码/配置改动，超出本任务授权）：

1. 重命名 client-config 侧 VO（如 `DataSourceOptionVO` → `ClientConfigDataSourceOptionVO`）并同步其引用（含 E2 契约测试断言），
   消除与 log-query 的同名；
2. 或对其中一个 VO 使用 MyBatis `@Alias(...)` 显式别名，避免简单类名冲突；
3. 修复应附带一个可引导 MyBatis `SqlSessionFactory`（真实或最小 MyBatis 上下文）的启动冒烟测试，防止回归，
   弥补 `@WebMvcTest` 切片不引导该工厂的盲区；相关全量/启动验证需在修复任务中按授权执行。

## 13. 变更文件、Commit、Push 与远程一致性

- 相对基线 `e1c5116...`，本任务仅新增本报告一个文件；无其它工作区差异被提交。
- 提交范围：仅精确暂存 `docs/features/client-config/reports/CLIENT-CONFIG-USER-ACCEPTANCE-PREPARATION-001.md`。
- 提交前核验：六份基线状态未变；`ACCEPTANCE.md` 76 条仍全为 `NOT_RUN`；staged 仅本报告；`git diff --cached --check` 通过。
- Commit Message：`docs(client-config): report backend startup blocker [CLIENT-CONFIG-USER-ACCEPTANCE-PREPARATION-001]`
- Push：普通 push 到 `origin/develop`（非 force）。Push 后本地 `HEAD == origin/develop == git ls-remote`，ahead/behind = `0 0`。

> 本报告按规范不写入“包含本报告的最终 Commit ID”（避免自引用）；最终提交 ID 仅在 Push 后于控制台结果块输出。

## 14. 明确表述

**正式验收状态仍为 `NOT_RUN`，等待项目负责人亲自验收。** 本次真实环境联调因 `cdc-config` 后端在基线
`e1c5116...` 无法启动而阻断，未形成可验收页面，未保留任何用户待验收数据，任务结论为 `CHANGES_REQUIRED`，
等待 ChatGPT 复审后另立后端启动修复任务，再进行真实 API 联调与用户验收准备。
