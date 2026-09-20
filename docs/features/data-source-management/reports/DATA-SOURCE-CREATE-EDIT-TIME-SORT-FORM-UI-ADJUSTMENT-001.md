# DATA-SOURCE-CREATE-EDIT-TIME-SORT-FORM-UI-ADJUSTMENT-001 执行报告

- 任务编号：`DATA-SOURCE-CREATE-EDIT-TIME-SORT-FORM-UI-ADJUSTMENT-001`
- 日期：2026-09-20
- 分支：`develop`
- 任务性质：已批准调整基线（`DS-REQ-178~188` / `DS-AC-183~199` / DESIGN §15 / API §13 / UI §13 / DATABASE §11）的前后端实现、自动化测试、构建与实现状态回写
- 授权基准提交：`81c20816032824f7a23b2277ded96514ebccc556`
- 结果提交：本报告所在提交（具体 Commit ID 与推送核验见任务结果块 `result_commit_id` / `remote_commit_id` / `ahead_behind`）
- Push 状态：普通推送至 `origin/develop`；未强推、未改写历史

> 本报告是 Agent 执行记录，**不是**复审通过、项目负责人批准或正式验收结论。
> 统一状态：`adjustment_document_status=APPROVED`、`adjustment_baseline_status=APPROVED`、`implementation_authorization_status=GRANTED_IN_THIS_TASK`、`implementation_status=IMPLEMENTED_PENDING_USER_REVIEW`、`formal_acceptance_execution_status=NOT_RUN`、`new_adjustment_acceptance_status=ALL_NOT_RUN`。
> 自动化测试通过**不是**正式执行 `DS-AC-183~199`：这 17 条调整验收仍全部 `NOT_RUN`，本任务未将其改写为任何其他状态。
> 未置 `IMPLEMENTED_ACCEPTED` / `ACCEPTED` / 生产可用。数据源管理 Feature 整体正式验收状态**仍未**、且**不得**改为 `ACCEPTED`。

---

## 1. 任务开始前 Git 与环境现场

| 项目 | 值 |
|---|---|
| 任务开始前 `HEAD` | `81c20816032824f7a23b2277ded96514ebccc556` |
| 分支 | `develop` |
| ahead/behind | `0 0`（相对 `origin/develop`） |
| 远程 `refs/heads/develop` | 与本地 `HEAD` 一致 |

- 实际基线提交与提示词授权基准一致。
- 工作区存在**任务外**既有改动：` M .claude/settings.local.json`、未跟踪 `?? docs/prompts/`。这两项属于用户现场，与本任务无关，全程**未修改、未覆盖、未回滚、未暂存、未提交**，保持原样。

环境（全部使用服务器预装版本，未安装、未升级、未替换任何基础环境）：

| 项目 | 值 |
|---|---|
| JDK | 1.8.0_202（`/usr/java/latest`） |
| Maven | 3.8.8（`/usr/local/maven`） |
| Node | v24.17.0（`/opt/node`） |
| npm | 11.13.0 |

实现未使用高于 Java 8 的语言特性（未使用 `var`、模式匹配 `instanceof`、`switch` 表达式、文本块等）。
前端本轮**未**执行 `npm install` / `npm ci`（`node_modules` 已存在），**未**修改 `package.json` 与锁文件。

## 2. 实际修改文件

后端（主代码 2、测试 3）：

| 文件 | 增/删 |
|---|---|
| `backend/src/main/java/com/bsoft/cdcconfig/datasource/mapper/DataSourceMapper.java` | +18 / -0 |
| `backend/src/main/java/com/bsoft/cdcconfig/datasource/service/impl/DataSourceServiceImpl.java` | +10 / -3 |
| `backend/src/test/java/com/bsoft/cdcconfig/datasource/service/DataSourceServiceTest.java` | +194 / -5 |
| `backend/src/test/java/com/bsoft/cdcconfig/datasource/service/DataSourceNamingStrategyServiceTest.java` | +45 / -0 |
| `backend/src/test/java/com/bsoft/cdcconfig/datasource/DataSourcePasswordLogSecurityTest.java` | +2 / -2 |

前端（源码 1、测试 1）：

| 文件 | 增/删 |
|---|---|
| `frontend/src/views/data-source/DataSourcePage.vue` | +41 / -3 |
| `frontend/src/views/data-source/dataSource.spec.ts` | +181 / -4 |

文档（状态回写 7 + 本报告 1）：

| 文件 | 增/删 |
|---|---|
| `docs/features/data-source-management/REQUIREMENTS.md` | +49 / -0 |
| `docs/features/data-source-management/ACCEPTANCE.md` | +45 / -1 |
| `docs/features/data-source-management/DESIGN.md` | +93 / -0 |
| `docs/features/data-source-management/API.md` | +75 / -0 |
| `docs/features/data-source-management/UI.md` | +99 / -0 |
| `docs/features/data-source-management/DATABASE.md` | +82 / -0 |
| `docs/features/data-source-management/README.md` | +31 / -6 |
| `docs/features/data-source-management/reports/DATA-SOURCE-CREATE-EDIT-TIME-SORT-FORM-UI-ADJUSTMENT-001.md` | 本报告 |

**未修改**（逐项核验）：`frontend/src/components/query-list/**`（公共查询列表组件零修改）、视图之外的其他 Feature 代码与基线、`CDC_DATA_SOURCE_EXTEND` 既有业务语义、数据库迁移/DDL/初始化数据脚本、Maven/npm 依赖与锁文件、运行环境配置。

## 3. 后端实现摘要

### 3.1 新增时以数据库时间写入两个时间字段（`DS-REQ-178`、`DS-REQ-179`）

`DataSourceMapper` 新增注解 SQL 方法，在**同一条 `INSERT`** 中以 Oracle `SYSDATE` 写入 `INSERT_TIME` 与 `UPDATE_TIME`：

```java
@Insert("INSERT INTO CDC_DATA_SOURCE ("
        + "DATA_SOURCE_ID, DATA_SOURCE_NAME, DATA_SOURCE_CATEGORY, DATA_SOURCE_TYPE, "
        + "DATA_SOURCE_ORG, DATA_SOURCE_HOST, DATA_SOURCE_PORT, DATA_SOURCE_USER_NAME, "
        + "DATA_SOURCE_PASSWORD, DATA_SOURCE_SERVICE_NAME, FG_ACTIVE, "
        + "INSERT_TIME, UPDATE_TIME"
        + ") VALUES ("
        + "#{dataSourceId}, #{dataSourceName}, #{dataSourceCategory}, #{dataSourceType}, "
        + "#{dataSourceOrg}, #{dataSourceHost}, #{dataSourcePort}, #{dataSourceUserName}, "
        + "#{dataSourcePassword}, #{dataSourceServiceName}, #{fgActive}, "
        + "SYSDATE, SYSDATE"
        + ")")
int insertWithSysdate(DataSource entity);
```

- 时间来源为**数据库侧 `SYSDATE`**，不取 JVM 时间（`DataSource` 实体的时间字段在创建路径**不赋任何值**，由 SQL 直接写入），也**不依赖**列默认值。
- `DataSourceServiceImpl.create` 由 `dataSourceMapper.insert(ds)` 改为 `dataSourceMapper.insertWithSysdate(ds)`；`FG_ACTIVE='1'` 语义、去重校验、类型校验、密码处理等全部不变。
- **未**新增触发器，**未**新增索引，**未**变更表结构或列约束。

### 3.2 成功的修改操作在同一条 `UPDATE` 中刷新 `UPDATE_TIME`（`DS-REQ-180`~`DS-REQ-182`）

| 操作 | 位置 | 实现 | 说明 |
|---|---|---|---|
| 主弹窗「保存」（编辑主表） | `DataSourceServiceImpl.update` | `wrapper.setSql("UPDATE_TIME = SYSDATE")` 与业务字段同一条 `UPDATE` | `INSERT_TIME` 不变 |
| 启用（非幂等分支） | `updateStatusConditionally` | 同一 `wrapper` 追加 `setSql("UPDATE_TIME = SYSDATE")` | 与 `FG_ACTIVE` 同一条 `UPDATE` |
| 停用（含异常状态归一化） | `updateStatusConditionally` | 同上 | `'1'` / `NULL` / 非 `0`/`1` 归一化为 `'0'` 时同一条 `UPDATE` 刷新 |
| 业务属性保存 | `saveBizAttr` | 同一 `LambdaUpdateWrapper` 追加 `.setSql("UPDATE_TIME = SYSDATE")` | 与 `DATA_SOURCE_BIZ_ATTR` 同一条 `UPDATE` |

- **幂等分支不写库**：`enable` 观察到已为 `'1'`、`disable` 观察到已为 `'0'` 时仍为**提前 `return`**，**不执行任何 DML**，**不**为了刷新时间而写库（`DS-REQ-180`）。
- **失败/冲突回滚**：所有写路径方法均为 `@Transactional(rollbackFor = Exception.class)`；受影响行数 ≠ 1 时抛业务异常并回滚，**不残留**时间戳变更。
- **命名策略隔离**：命名策略相关写入只作用于 `CDC_DATA_SOURCE_EXTEND`，**不**触碰 `CDC_DATA_SOURCE.UPDATE_TIME`（`DS-REQ-182`）；该隔离由 `DataSourceNamingStrategyServiceTest` 新增的 3 条 `never()` 断言覆盖。
- **删除语义不变**：删除路径未改动。

### 3.3 列表默认排序（`DS-REQ-183`）

`DataSourceServiceImpl.list` 将原 `wrapper.orderByAsc(DataSource::getDataSourceId)` 替换为显式 Oracle 排序：

```java
wrapper.last("ORDER BY UPDATE_TIME DESC NULLS LAST, "
        + "INSERT_TIME DESC NULLS LAST, "
        + "DATA_SOURCE_ID ASC");
```

- 三个排序键与**必须**的 `NULLS LAST`、结尾 `DATA_SOURCE_ID ASC` 稳定键均显式写出；未使用 MyBatis-Plus `orderBy`（无法表达 `NULLS LAST`）。
- 查询条件、返回字段、全部状态展示、无分页行为**均未改变**；未新增索引；未对存量数据做任何补写或清洗；前端**未**增加次级排序。

## 4. 前端实现摘要（仅新增/编辑主弹窗）

### 4.1 标签对齐与列宽（`DS-REQ-184`）

- 主弹窗 `el-form` 的 `label-position` 由 `left` 改为 `right`，沿用既有 `label-width="120px"`。
- 标签右对齐与输入区左边缘形成一条对齐线；`120px` 固定列宽使输入起始位置在新增/编辑两种模式、必填与非常填项之间保持稳定。
- 样式与结构未影响业务属性弹窗、命名策略弹窗（这两个弹窗保持原有 `left` 对齐与列宽）。

### 4.2 标签文字样式（`DS-REQ-185`）

新增页面内作用域样式，选择器严格限定在 `.editor-dialog` 之内：

```css
:deep(.editor-dialog .el-form-item__label) {
  font-size: 14px;
  font-weight: 500;
  color: #3f3f46;
}
```

- 使用页面默认无衬线字体，**未**套用列表「数据源ID」列的等宽字体、`font-weight: 600` 或 `#09090b`。
- 必填星号沿用 Element Plus 既有 danger 色，未被覆盖。
- 未使用 `:root` 级或全局选择器，**无样式泄漏**。

### 4.3 密码必填标识与真实校验一致（`DS-REQ-186`）

- `el-form-item` 由 `<el-form-item label="密码" prop="password">` 改为 `<el-form-item label="密码" prop="password" :required="!isEdit">`。
- 新增模式：`required=true` → Element Plus 渲染红色必填星号，并与既有 `editorRules` 校验一致（空密码被既有校验阻断）。
- 编辑模式：`required=false` → 无星号、无强制校验，留空表示沿用原密码。
- 通过 Element Plus form-item 能力实现，**未**引入伪星号文本；既有掩码、聚焦/失焦、复用原密码、**不回显**密码的行为全部不变。

### 4.4 创建/保存按钮视觉（`DS-REQ-187`、`DS-REQ-188`）

按钮文案沿用 `{{ isEdit ? '保存' : '创建' }}`，新增专用局部 class `editor-submit-button`，样式限定在 `.editor-dialog` 内且仅覆盖非禁用态：

| 状态 | 值 |
|---|---|
| 正常 | `background/border #09090b`，`color #ffffff`，`border-radius 6px`，`font-weight 500` |
| hover / focus | `background/border #27272a`，`color #ffffff` |
| active | `background/border #18181b`，`color #ffffff` |
| disabled | 不覆盖，沿用 Element Plus 既有禁用视觉 |

- `:not(.is-disabled)` 使禁用态不被改写；`loading` 图标与文字在深色底上可读（`color: #ffffff`）。
- `取消` 按钮、`测试连接` 按钮、业务属性/命名策略弹窗的提交按钮**均未**受影响，**无样式泄漏**。

## 5. 自动化测试

按提示词 §7.3 的顺序执行；本节如实记录**首次失败证据**与修复，不把「首次失败后重跑通过」写成一次通过。

### 5.1 步骤 1：后端定向用例

| 命令 | 结果 |
|---|---|
| `cd backend && mvn -o test -Dtest='DataSourceConnectionTesterTest,DataSourceControllerTest,DataSourceNamingStrategyServiceTest,DataSourcePasswordLogSecurityTest,DataSourceServiceTest'` | **Tests run: 161, Failures: 0, Errors: 0, Skipped: 0**，BUILD SUCCESS |

分项：`DataSourceServiceTest` 70、`DataSourceControllerTest` 37、`DataSourceNamingStrategyServiceTest` 28、`DataSourceConnectionTesterTest` 21、`DataSourcePasswordLogSecurityTest` 5。

新增/扩展用例：

| 用例 | 覆盖 |
|---|---|
| `create_shouldNotAssignTimeFieldsInJava` | 创建路径实体不赋 JVM 时间（`DS-REQ-178`） |
| `createInsertStatement_shouldWriteBothTimesWithSysdateInOneStatement` | 同一条 `INSERT` 内 `SYSDATE, SYSDATE` 写入两个字段（`DS-REQ-178`、`DS-REQ-179`） |
| `update_shouldRefreshUpdateTimeAndKeepInsertTimeUntouched` | 编辑刷新 `UPDATE_TIME`、不动 `INSERT_TIME`（`DS-REQ-180`） |
| `enable_nonIdempotent_shouldRefreshUpdateTime` / `disable_nonIdempotent_shouldRefreshUpdateTime` | 非幂等启停同条 `UPDATE` 刷新（`DS-REQ-180`） |
| `disable_abnormalStatus_shouldRefreshUpdateTime` | 异常状态归一化时刷新（`DS-REQ-180`） |
| `enable_idempotent_shouldNotWriteAnythingIncludingUpdateTime` / `disable_idempotent_shouldNotWriteAnythingIncludingUpdateTime` | 幂等分支零 DML（`DS-REQ-180`） |
| `saveBizAttr_shouldRefreshUpdateTimeInSameUpdate` | 业务属性同条 `UPDATE` 刷新（`DS-REQ-181`） |
| `list_shouldOrderByTimesDescNullsLastThenIdAsc` | 三个排序键 + `NULLS LAST` + 稳定 ID（`DS-REQ-183`） |
| `list_sortAddition_shouldKeepFiltersUnchanged` | 排序变更不影响既有查询条件（`DS-REQ-183`） |
| `DataSourceNamingStrategyServiceTest` 新增 3 条 `never()` 断言 | 命名策略只写扩展表，主表时间字段隔离（`DS-REQ-182`） |

### 5.2 步骤 2：后端安全回归（**首次失败证据**）

**首次运行（保留原始证据）**：2026-09-20 15:21

| 命令 | 结果 |
|---|---|
| `cd backend && mvn -o test -Dtest='!OracleDateMappingTest,!JobFailureServiceTest,!HealthControllerTest,!CdcConfigPlatformApplicationTests'` | **Tests run: 1033, Failures: 0, Errors: 1, Skipped: 0**，**BUILD FAILURE** |

```
[ERROR] Errors:
[ERROR]   DataSourcePasswordLogSecurityTest.createAndUpdatePaths_doNotLeakRandomSentinelPassword:146 » Business
[ERROR] Tests run: 1033, Failures: 0, Errors: 1, Skipped: 0
```

**根因（本任务导致，非既有缺陷）**：该用例类为创建路径打桩了**变更前**的 `dataSourceMapper.insert(any(DataSource.class))`。本任务把服务的创建调用改为 `insertWithSysdate(...)` 后，Mockito 对未打桩的 `insertWithSysdate` 返回 `int` 默认值 `0`，服务因 `rows != 1` 抛 `DataSourceErrorCode.saveFailed()`（`BusinessException`），用例失败。用例意图（验证哨兵密码不泄漏）未变，是**打桩目标随被调用方法迁移**导致的失败。

**修复**（`backend/src/test/java/com/bsoft/cdcconfig/datasource/DataSourcePasswordLogSecurityTest.java`，+2 / -2）：两处打桩目标由 `insert` 改为 `insertWithSysdate`：

- L145：`when(dataSourceMapper.insertWithSysdate(any(DataSource.class))).thenReturn(1);`（创建成功路径）
- L208：`when(dataSourceMapper.insertWithSysdate(any(DataSource.class))).thenThrow(new RuntimeException("driver error with password=" + sentinel));`（未知异常脱敏路径——若只改前一处，此处 `thenThrow` 会被绕过、断言形同虚设，故一并修正）

**修复后重跑**：

| 命令 | 结果 |
|---|---|
| `cd backend && mvn -o test -Dtest='!OracleDateMappingTest,!JobFailureServiceTest,!HealthControllerTest,!CdcConfigPlatformApplicationTests'` | **Tests run: 1033, Failures: 0, Errors: 0, Skipped: 0**，BUILD SUCCESS |
| 步骤 1 定向用例重跑 | **Tests run: 161, Failures: 0, Errors: 0, Skipped: 0**，BUILD SUCCESS |

#### 未运行的后端测试及理由

被排除的 4 个测试类**与上一轮实现任务完全一致，未扩大排除范围**：`CdcConfigPlatformApplicationTests`、`HealthControllerTest`（启动完整 Spring 上下文并以 `initMethod="start"` 启动 Curator 客户端，会连接 ZooKeeper）、`OracleDateMappingTest`、`JobFailureServiceTest`（直连真实 Oracle 开发库）。排除理由与提示词「自动化测试不得连接真实数据库 / ZooKeeper / Kafka」直接相关；其余 1033 条用例均为 Mockito 桩或静态检查。

### 5.3 步骤 3：后端打包

| 命令 | 结果 |
|---|---|
| `cd backend && mvn -o clean package -DskipTests` | **BUILD SUCCESS**（`Total time: 14.111 s`） |

产物：`/agent/cdc-config-platform/backend/target/cdc-config-platform-backend-1.0.0-SNAPSHOT.jar`（47,741,868 B）。
`-DskipTests` 仅跳过用例执行，**测试编译仍执行**；未因构建失败修改任何范围外代码。

> 最终交付/启动使用的 jar 在全部源码编辑完成后重新构建，与本报告所述最终提交的源码一致（第 3 步在最终源码状态下重跑，结果同为 BUILD SUCCESS）。

### 5.4 步骤 4：前端定向用例

| 命令 | 结果 |
|---|---|
| `cd frontend && npm run test -- src/views/data-source/dataSource.spec.ts` | **Test Files 1 passed (1)** / **Tests 106 passed (106)** |

新增用例（`describe('新增/编辑主弹窗表单与按钮视觉调整（DS-REQ-184~188）')`）：

| 用例 | 覆盖 |
|---|---|
| `新增弹窗标签宽度 120px 且右对齐` | `DS-REQ-184` / `DS-AC-192` |
| `编辑弹窗沿用同一表单：标签仍右对齐 120px，测试连接条不随模式偏移` | `DS-AC-193` |
| `标签样式为 14px/500/#3f3f46、默认无衬线字体且限定在 .editor-dialog` | `DS-REQ-185` / `DS-AC-194` |
| `新增模式密码带 Element Plus 必填标识，编辑模式不带` | `DS-REQ-186` / `DS-AC-195`~`196` |
| `新增模式空密码被既有校验阻断` | `DS-AC-195` |
| `编辑模式不显示必填标识且未修改密码可保存、请求不含 password` | `DS-AC-196` |
| `创建/保存按钮使用专用局部 class，取消与测试连接按钮不受影响` | `DS-REQ-187`~`188` / `DS-AC-197`~`199` |
| `提交按钮四态黑色视觉限定在 .editor-dialog 且仅覆盖非禁用态` | `DS-REQ-187`~`188` |
| `业务属性弹窗提交按钮不复用主弹窗专用 class（无样式泄漏）` | `DS-AC-199` |
| `三个业务弹窗：主弹窗右对齐、其余左对齐，固定列宽与必填标识稳定` | 回归 |

并发/视觉相关断言说明：SFC 的 `scoped` 样式在本项目 vitest/jsdom 运行中**不会**被注入（未开启 `css: true`），故样式断言采用「读取 SFC 源码 + 解析 `<style>` 块」的静态校验，而非计算样式断言——这一点在报告中如实标注，不表示视觉已通过。

#### 前端测试编写的两处如实记录

1. **`scopedStyleBlock` 取值方式（测试编写期修正，非既有用例回归）**：新用例需要读取 `DataSourcePage.vue` 的 `<style>` 块，最初使用 `import.meta.url` 解析路径，在 vitest/jsdom 下它不是 `file:` URL，抛 `ERR_INVALID_URL_SCHEME`；改为 `resolve(process.cwd(), 'src/views/data-source/DataSourcePage.vue')` 后通过。
2. **既有断言的定向变更（任务批准的变更）**：既有用例中针对**编辑弹窗**断言 `el-form--label-left` 的期望，按 `DS-REQ-184`（主弹窗改右对齐）更新为 `el-form--label-right`；仅限主弹窗，业务属性/命名策略弹窗仍断言左对齐。该变更是本轮已批准调整的直接结果，非放宽断言。

### 5.5 步骤 5：前端全量用例

| 命令 | 结果 |
|---|---|
| `cd frontend && npm run test` | **Test Files 56 passed (56)** / **Tests 1041 passed (1041)** |

既有用例无一失败；本轮未导致任何其他 Feature 回归。

### 5.6 步骤 6：前端构建

| 命令 | 结果 |
|---|---|
| `cd frontend && npm run build`（`vue-tsc --noEmit && vite build`） | **BUILD SUCCESS**（`✓ built in 20.31s`，`DataSourcePage-S5VnyctG.js 29.71 kB`） |

仅有既有的 chunk >500 kB 体积提示（与本轮变更无关）。`package.json` 中**不存在** `type-check` / `lint` 脚本（类型检查已折入 `build` 的 `vue-tsc --noEmit`），故按项目实际脚本执行 `test` 与 `build`。

### 5.7 结果汇总

| # | 步骤 | 命令 | 结果 | 判定 |
|---|---|---|---|---|
| 1 | 后端定向 | `mvn -o test -Dtest='DataSourceConnectionTesterTest,DataSourceControllerTest,DataSourceNamingStrategyServiceTest,DataSourcePasswordLogSecurityTest,DataSourceServiceTest'` | 161 / 0 / 0 / 0 | SUCCESS |
| 2 | 后端安全回归 | `mvn -o test -Dtest='!OracleDateMappingTest,!JobFailureServiceTest,!HealthControllerTest,!CdcConfigPlatformApplicationTests'` | 首次 1033 / 0 / **1** → 修复后 1033 / 0 / 0 | SUCCESS（含一次任务导致的失败并已修复） |
| 3 | 后端打包 | `mvn -o clean package -DskipTests` | BUILD SUCCESS | SUCCESS |
| 4 | 前端定向 | `npm run test -- src/views/data-source/dataSource.spec.ts` | 1 file / 106 | SUCCESS |
| 5 | 前端全量 | `npm run test` | 56 files / 1041 | SUCCESS |
| 6 | 前端构建 | `npm run build` | BUILD SUCCESS | SUCCESS |

## 6. 状态回写与未执行项

七份权威文档在不改写历史正文和历史状态的前提下**追加**了本轮调整章节（`README` §2.4 / `REQUIREMENTS` §24 / `ACCEPTANCE` §4.18 / `DESIGN` §15+§16 / `API` §13+§14 / `UI` §13+§14 / `DATABASE` §11+§12），登记 `DS-REQ-178~188` 与 `DS-AC-183~199`（17 条，全部 `NOT_RUN`），并各新增一条 2026-09-20 变更记录：

```text
adjustment_document_status=APPROVED
adjustment_baseline_status=APPROVED
implementation_authorization_status=GRANTED_IN_THIS_TASK
implementation_status=IMPLEMENTED_PENDING_USER_REVIEW
formal_acceptance_execution_status=NOT_RUN
new_adjustment_acceptance_status=ALL_NOT_RUN
```

- **未重编号、未删除、未改写**任何既有需求、验收用例、步骤、预期结果或历史统计。
- 既有正式复验统计 `PASS=113/FAIL=0/BLOCKED=2/NOT_RUN=0`（阻塞 `DS-AC-104`/`DS-AC-108`）**逐字保留**；`DS-AC-116~140`（25 条）与 `DS-AC-141~182`（42 条 `PASS`）状态**未改**。
- 数据源管理 Feature 整体正式验收状态**未改**为 `ACCEPTED`。

未执行项：

- `DS-AC-183~199`（17 条）**全部未执行**，仍为 `NOT_RUN`；自动化测试与构建通过不构成正式验收执行；
- 未访问数据库、ZooKeeper、Kafka、业务源库或目标库；
- 未执行任何 `SELECT` / DML / DDL / 匿名 PL/SQL，未直接或间接修改任何数据（`database_access_status=NONE`）；
- 未新增触发器、索引、表字段或约束变更，未对存量时间字段做补写或清洗；
- 未修改依赖或锁文件，未执行 `npm install` / `npm ci`；
- 未执行 ZooKeeper 读写。

## 7. 核验结论

| 核验项 | 结论 | 证据 |
|---|---|---|
| 新增复用同一条 `INSERT` 写入两时间字段、取数据库时间 | 是 | `DataSourceMapper.insertWithSysdate` 的 `SYSDATE, SYSDATE`；用例 `createInsertStatement_shouldWriteBothTimesWithSysdateInOneStatement` |
| 创建路径不取 JVM 时间、不依赖列默认值 | 是 | 用例 `create_shouldNotAssignTimeFieldsInJava`；实体时间字段无赋值 |
| 编辑保存刷新 `UPDATE_TIME` 且 `INSERT_TIME` 不变 | 是 | 用例 `update_shouldRefreshUpdateTimeAndKeepInsertTimeUntouched` |
| 启用/停用（含异常归一化）刷新 `UPDATE_TIME` | 是 | 3 条用例；`updateStatusConditionally` 同条 `UPDATE` 追加 `setSql` |
| 幂等启停零 DML、不为刷新时间写库 | 是 | 2 条「不写任何内容」用例 |
| 业务属性保存刷新 `UPDATE_TIME` | 是 | `saveBizAttr_shouldRefreshUpdateTimeInSameUpdate` |
| 失败/冲突回滚不残留时间变更 | 是 | `@Transactional(rollbackFor = Exception.class)`；`rows != 1` 抛异常 |
| 命名策略不改主表时间字段 | 是 | `DataSourceNamingStrategyServiceTest` 3 条 `never()` 断言 |
| 列表默认排序三键 + `NULLS LAST` + 稳定 ID | 是 | 用例 `list_shouldOrderByTimesDescNullsLastThenIdAsc` |
| 排序变更不改查询条件/字段/分页/全部状态展示 | 是 | 用例 `list_sortAddition_shouldKeepFiltersUnchanged` |
| 无新索引、无存量补写、无 DDL | 是 | 变更文件清单不含 SQL/DDL；DATABASE §11 零数据库变化声明 |
| 主弹窗 120px 右对齐，不受模式影响 | 是 | 2 条用例断言 `label-width` 与 `el-form--label-right` |
| 标签 14px/500/#3f3f46、无衬线、限定 `.editor-dialog` | 是 | 源码 `:deep(.editor-dialog .el-form-item__label)` + 静态样式用例 |
| 新增密码必填星号、编辑非必填无星号 | 是 | `:required="!isEdit"`；3 条用例（含空密码阻断与编辑流程） |
| 现有掩码/聚焦/复用/不回显行为不变 | 是 | 编辑模式用例断言请求不含 `password` |
| 按钮四态视觉 + 文案 + 局部限定 | 是 | 2 条用例；`:not(.is-disabled)` |
| 取消/测试连接/其他弹窗按钮不受影响 | 是 | 2 条「无样式泄漏」用例 |
| 公共查询列表组件零修改 | 是 | `frontend/src/components/query-list/**` 无 diff |
| 其他 Feature 与公共组件无回归 | 是 | 前端全量 1041 通过；后端 1033 通过 |
| 新调整验收仍全部 `NOT_RUN` | 是 | `ACCEPTANCE.md §4.18` 17 行状态未改 |
| 外部系统零访问、数据库零写入 | 是 | 未运行 4 个外部系统测试类；无 DB/ZK/Kafka 连接 |

## 8. 已知风险与阻塞

1. **后端完整测试未运行**：4 个 `@SpringBootTest` 类依赖真实 Oracle / ZooKeeper，按安全边界跳过；如需在受控环境执行，应由人工明确授权后单独进行。
2. **视觉结论未定**：本任务自动化测试采用源码静态校验，**不构成**页面视觉验收；主弹窗标签对齐/字号/颜色、密码星号、按钮四态需由项目负责人页面目测完成。
3. **前端样式断言为静态校验**：scoped 样式在 vitest/jsdom 下不注入（未开启 `css: true`），故无法在单测中做计算样式断言；这是测试边界，非实现缺陷。
4. **时间来源为数据库时钟**：`INSERT_TIME`/`UPDATE_TIME` 取 Oracle `SYSDATE`，与 JVM 时钟可能存在时区/偏差差异；符合本轮「使用数据库时间」的批准要求，但意味着应用服务器与数据库时钟不一致时，时间语义以数据库为准。
5. **列表排序依赖列排序而非索引**：本轮明确要求**不新增索引**，`ORDER BY UPDATE_TIME/INSERT_TIME DESC NULLS LAST` 在数据量增大后可能产生排序开销；是否优化留待后续独立任务评估。
6. 无阻塞项影响本次实现完成与推送；正式验收执行状态仍为 `NOT_RUN`。

## 9. 下一步

1. 项目负责人对 `http://192.168.174.70:5173/config/data-source` 页面进行目测（停在目测入口，未进入正式验收）；
2. 复审与目测通过后，另行决定是否正式执行 `DS-AC-183~199`（17 条），本任务不代其做任何验收结论；
3. 正式验收执行后方可评估是否更新数据源管理 Feature 的整体验收状态。

---

> 关联文档：
> - 需求 `docs/features/data-source-management/REQUIREMENTS.md` §24（`DS-REQ-178~188`）
> - 验收 `docs/features/data-source-management/ACCEPTANCE.md` §4.18（`DS-AC-183~199`，全部 `NOT_RUN`）
> - 设计 `docs/features/data-source-management/DESIGN.md` §15（变更记录 §16）
> - API `docs/features/data-source-management/API.md` §13（变更记录 §14）
> - UI `docs/features/data-source-management/UI.md` §13（变更记录 §14）
> - 数据库 `docs/features/data-source-management/DATABASE.md` §11（本轮无数据库变化；变更记录 §12）
> - 总览 `docs/features/data-source-management/README.md` §2.4
