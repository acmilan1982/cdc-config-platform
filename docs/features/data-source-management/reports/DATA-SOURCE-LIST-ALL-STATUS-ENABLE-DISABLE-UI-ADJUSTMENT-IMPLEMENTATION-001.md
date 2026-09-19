# DATA-SOURCE-LIST-ALL-STATUS-ENABLE-DISABLE-UI-ADJUSTMENT-IMPLEMENTATION-001 执行报告

- 任务编号：`DATA-SOURCE-LIST-ALL-STATUS-ENABLE-DISABLE-UI-ADJUSTMENT-IMPLEMENTATION-001`
- 日期：2026-09-19
- 分支：`develop`
- 任务性质：已批准调整基线（`DS-REQ-139~177` / `DS-AC-141~182` / DESIGN §13 / API §11 / UI §11 / DATABASE §9）的前后端实现、自动化测试、构建与实现状态回写
- 授权基准提交：`30259806b785bc38ef25c88852f07b4c4402649c`（调整基线批准收口）
- 结果提交：本报告所在提交（具体 Commit ID 与推送核验见任务结果块 `result_commit_id` / `push_status`）
- Push 状态：普通推送至 `origin/develop`；未强推、未改写历史

> 本报告是 Agent 执行记录，**不是**复审通过、项目负责人批准或正式验收结论。
> 统一状态：`adjustment_baseline_status=APPROVED`、`implementation_status=IMPLEMENTED_PENDING_USER_REVIEW`、`implementation_authorization_status=GRANTED_IN_THIS_TASK`、`formal_acceptance_execution_status=NOT_RUN`、`new_adjustment_acceptance_status=ALL_NOT_RUN`。
> 自动化测试通过**不是**正式执行 `DS-AC-141~182`：这 42 条调整验收仍全部 `NOT_RUN`，本任务未将其改写为任何其他状态。
> 未置 `IMPLEMENTED_ACCEPTED` / `ACCEPTED` / 生产可用。

---

## 1. 任务开始前 Git 与环境现场

| 项目 | 值 |
|---|---|
| 任务开始前 `HEAD` | `30259806b785bc38ef25c88852f07b4c4402649c` |
| 分支 | `develop` |
| ahead/behind | `0 0`（相对 `origin/develop`） |

- 实际基线提交与提示词预期一致；远程未出现触及本 Feature 或公共查询列表组件的新提交。
- 工作区存在**任务外**既有改动：` M .claude/settings.local.json`、未跟踪 `?? docs/prompts/`。这两项与本任务无关，全程**未修改、未覆盖、未暂存、未提交**，保持原样。

环境（全部使用服务器预装版本，未安装或升级任何基础环境）：

| 项目 | 值 |
|---|---|
| JDK | 1.8.0_202（`/usr/java/latest`） |
| Maven | 3.8.8（`/usr/local/maven`） |
| Node | v24.17.0（`/opt/node`） |
| npm | 11.13.0 |

实现未使用高于 Java 8 的语言特性（未使用 `var`、模式匹配 `instanceof`、`switch` 表达式、文本块等）。

## 2. 实际修改文件

后端（主代码 7、测试 2）：

| 文件 | 增/删 |
|---|---|
| `backend/src/main/java/com/bsoft/cdcconfig/datasource/controller/DataSourceController.java` | +18 / -0 |
| `backend/src/main/java/com/bsoft/cdcconfig/datasource/converter/DataSourceConverter.java` | +1 |
| `backend/src/main/java/com/bsoft/cdcconfig/datasource/exception/DataSourceErrorCode.java` | +11 |
| `backend/src/main/java/com/bsoft/cdcconfig/datasource/service/DataSourceService.java` | +4 |
| `backend/src/main/java/com/bsoft/cdcconfig/datasource/service/impl/DataSourceNamingStrategyServiceImpl.java` | +1 / -1 |
| `backend/src/main/java/com/bsoft/cdcconfig/datasource/service/impl/DataSourceServiceImpl.java` | +77 / -0 |
| `backend/src/main/java/com/bsoft/cdcconfig/datasource/vo/DataSourceListVO.java` | +4 |
| `backend/src/test/java/com/bsoft/cdcconfig/datasource/controller/DataSourceControllerTest.java` | +54 |
| `backend/src/test/java/com/bsoft/cdcconfig/datasource/service/DataSourceServiceTest.java` | +212 |

前端（源码 3、测试 2）：

| 文件 | 增/删 |
|---|---|
| `frontend/src/types/dataSource.ts` | +2 |
| `frontend/src/api/dataSource.ts` | +20 |
| `frontend/src/views/data-source/DataSourcePage.vue` | +304 / -109 |
| `frontend/src/api/dataSource.spec.ts` | +23 |
| `frontend/src/views/data-source/dataSource.spec.ts` | +357 |

文档（状态回写 7 + 本报告 1）：

`docs/features/data-source-management/README.md`、`REQUIREMENTS.md`、`ACCEPTANCE.md`、`DESIGN.md`、`API.md`、`UI.md`、`DATABASE.md`，以及本报告文件。

**未修改**（逐项核验）：`frontend/src/components/query-list/**`（公共查询列表组件零修改）、`GlobalExceptionHandler.java`、其他 Feature 的业务代码与基线、数据库迁移/DDL/初始化数据脚本、Maven/npm 依赖与锁文件、运行环境配置、构建生成物与打包产物。

## 3. 前端实现摘要

### 3.1 结果区与查询控件（`DS-REQ-139`~`DS-REQ-149`）

- **重置语义**：`onReset()` 只把草稿控件 `query` 复位为 `{ id: '', name: '', host: '', category: '' }`，**不触发任何请求**，**不改动**已生效条件 `effectiveQuery`（`DS-REQ-141`）。
- **结果区左上角**：`#summary` 只展示 `数据源列表` + `共 n 条`（`DS-REQ-142`）。
- **序号列**：新增首列 `序号`（`width: 70`，居中），渲染 `{{ $index + 1 }}`（`span.ds-seq`）（`DS-REQ-143`）。
- **主机列收窄**：`主机` 列 `min-width` 由原值下调为 `110`；`数据源ID` 列 `min-width="140"` 并保留 `show-overflow-tooltip`（`DS-REQ-144`）。

### 3.2 列表视觉对齐 `/monitor/data-source-state`（`DS-REQ-145`~`DS-REQ-149`）

行高、基础字号、DS-ID 字号、角色标签（`el-tag`）视觉均在**页面作用域**内以页面级样式覆盖实现；仅使用页面作用域选择器（`.data-source-page …`），**未**引入 `:root` 级或全局变量覆盖，**未**修改公共组件（`DS-REQ-149`）。

### 3.3 全部状态展示与行状态标识（`DS-REQ-150`~`DS-REQ-159`、`DS-REQ-160`~`DS-REQ-167`）

- 列表展示**全部** `CDC_DATA_SOURCE` 记录（前端不再依赖 `FG_ACTIVE='1'` 结果集），`DataSourceRow` 新增必填字段 `fgActive: string | null`，原值直传。
- 行标识：`isInactive(row) => row.fgActive === '0'`；`isAbnormal(row) => row.fgActive !== '1' && row.fgActive !== '0'`；`abnormalMark(row)` 输出 `异常（原始值=NULL）` 或 `异常（原始值=X）`，`停用` 行输出 `停用` 标记。

### 3.4 逐行启用/停用与维护边界（`DS-REQ-168`~`DS-REQ-175`）

- **操作菜单分场景**（`DS-REQ-168`）：
  - 正常行（`fgActive='1'`）：业务入口（源库 `目标库命名策略` / 目标库 `业务属性`）→ 分隔线 → `停用` → 分隔线 → 危险色 `删除`；
  - 停用行（`fgActive='0'`）：业务入口 → 分隔线 → `启用`（`ds-more-warning`）→ 分隔线 → 危险色 `删除`，**保留既有维护能力**（`DS-REQ-160`~`DS-REQ-167`）；
  - 异常行（`NULL`/非 `0`/`1`）：菜单**只有** `停用` 一项（显式归一化），不提供业务入口与删除（`DS-REQ-166`、`DS-REQ-167`）。
- **二次确认**：`onToggleStatus(row, action)` 使用 `ElMessageBox.confirm` 二次确认（`DS-REQ-172`）。
- **行级忙碌**：`statusBusyId` 记录当前处理行，仅该行按钮进入 busy 且不可重复提交；`删除` 项在 `deletingId !== '' || statusBusyId !== ''` 时禁用（`DS-REQ-173`）。
- **成功刷新**：成功后 `ElMessage.success('数据源状态已更新')` 并以 `effectiveSnapshot()`（**已生效条件**）刷新列表（`DS-REQ-174`）。
- **失败保留语义**：失败只提示 `statusErrorMessage(code, message)`，**不**改动结果区行、`共 n 条` 与已生效条件（`DS-REQ-175`）。
- **异常行双击**：`onRowDoubleClick` 对异常行告警并返回，不打开编辑弹窗（异常记录仅允许显式停用归一化）。

### 3.5 “新增数据源”主按钮（`DS-REQ-176`）

`新增数据源` 改为**黑色实心主按钮**（`el-button.ds-add-button`），保留 `Plus` 图标（`el-icon.ds-add-icon`）。

## 4. 后端实现摘要

### 4.1 列表返回全部状态与 `fgActive` 原值（`DS-REQ-150`~`DS-REQ-154`）

- `DataSourceServiceImpl.list` 删除 `wrapper.eq(DataSource::getFgActive, "1")`，保留三条件模糊 + 角色条件 + `ORDER BY DATA_SOURCE_ID ASC`（`DS-REQ-150`、`DS-REQ-151`）。
- `DataSourceListVO` 新增 `private String fgActive;`，`DataSourceConverter.toListVO` 末尾 `vo.setFgActive(ds.getFgActive())`，**原值直传**（`DS-REQ-153`、`DS-REQ-154`）。

### 4.2 可维护记录边界（`DS-REQ-155`~`DS-REQ-158`）

`requireActiveRecord` 重构为 `requireMaintainableRecord`，主记录条件由 `FG_ACTIVE='1'` 改为 `.in(DataSource::getFgActive, "1", "0")`：仅**精确**接受 `'1'`/`'0'`，`NULL`/非 `0`/`1` 仍返回 `40400`。详情 / 编辑 / 删除 / 业务属性读保存 / 编辑态连接测试密码读取与保存全部改用该边界；`DataSourceNamingStrategyServiceImpl.requireSourceRecord` 同步改用 `.in(..., "1", "0")`。

**未放宽**：`targetOptions` 与 `assertValidTarget` **仍保留** `.eq(DataSource::getFgActive, "1")`——目标候选只含 `'1'`，**不作替代**（`DS-REQ-159`）。未使用 `FG_ACTIVE <> '1'`、`IS NOT NULL` 等会放宽到其他历史值的写法。

### 4.3 启用 / 停用接口与冻结状态机（`DS-REQ-168`~`DS-REQ-171`）

`DataSourceService` 新增 `enable(String)` / `disable(String)`；`DataSourceController` 新增 `@PutMapping("/{dataSourceId}/enable")`、`/disable`，返回既有 `ApiResponse` 契约。实现严格实现冻结状态机：

```java
@Transactional(rollbackFor = Exception.class)
public void enable(String dataSourceId) {
    String id = trim(dataSourceId);
    String observedStatus = readRawStatus(id);          // 先读，不按 FG_ACTIVE='1' 过滤
    if ("1".equals(observedStatus)) { return; }         // 幂等成功，不写库
    if (!"0".equals(observedStatus)) {                  // NULL / 非 0/1
        throw DataSourceErrorCode.statusInvalid();      // 40250，不写库
    }
    updateStatusConditionally(id, observedStatus, "1");
}

@Transactional(rollbackFor = Exception.class)
public void disable(String dataSourceId) {
    String id = trim(dataSourceId);
    String observedStatus = readRawStatus(id);
    if ("0".equals(observedStatus)) { return; }         // 幂等成功，不写库
    updateStatusConditionally(id, observedStatus, "0"); // '1' / NULL / 非 0/1 均归一化为 '0'
}
```

- `readRawStatus` 按 `DATA_SOURCE_ID` 读取当前记录及原始 `FG_ACTIVE`；记录不存在 → `40400`（`DataSourceErrorCode.notFound`），**不执行 DML**。
- **条件 `UPDATE` 带原状态条件**（`updateStatusConditionally`）：

```java
LambdaUpdateWrapper<DataSource> wrapper = new LambdaUpdateWrapper<>();
wrapper.eq(DataSource::getDataSourceId, dataSourceId);
if (observedStatus == null) { wrapper.isNull(DataSource::getFgActive); }   // NULL 只匹配 NULL
else { wrapper.eq(DataSource::getFgActive, observedStatus); }              // 非空异常值精确匹配
wrapper.set(DataSource::getFgActive, targetStatus);
int rows = dataSourceMapper.update(null, wrapper);
if (rows != 1) { throw DataSourceErrorCode.statusFailed(); }               // 50002 并回滚
```

- 只更新 `FG_ACTIVE` **一列**；不级联扩展表 / 客户端 / 订阅；不访问源库；不操作进程 / ZooKeeper / Kafka。
- **并发**：`disable` 对 `NULL`/非 `0`/`1` **不**返回 `40250`，走 NULL-safe 原状态匹配归一化为 `'0'`；受影响行数 ≠ 1（含读取后被改变导致 `0` 行）→ `50002` 并回滚；不加锁、不引入乐观版本列、不重试、不改判成功（`DS-REQ-171`）。

### 4.4 错误码（`DS-REQ-170`、`DS-REQ-171`）

`DataSourceErrorCode` 新增 `STATUS_INVALID = 40250`（消息「数据源状态异常，不可启用，请先停用以归一化状态」）与 `STATUS_FAILED = 50002`（消息「状态更新失败，请重试」）及工厂方法 `statusInvalid()` / `statusFailed()`。全局 `@RestControllerAdvice` 将 `BusinessException` 映射为 HTTP 200 + `body.code` 业务码。

## 5. 自动化测试

### 5.1 前端

| 范围 | 命令 | 结果 |
|---|---|---|
| 定向用例 | `cd frontend && npm run test -- src/views/data-source/dataSource.spec.ts src/api/dataSource.spec.ts` | `2 passed (2)` / **105 passed (105)**（页面 94 + API 11） |
| 全量套件 | `cd frontend && npm run test` | `56 passed (56)` / **1029 passed (1029)** |

新增/扩展用例覆盖点：

- `dataSource.spec.ts` 新增 `describe('行状态标识与逐行启用/停用（DS-REQ-160~173）')`（11 条）：标记渲染（无标记 / `停用` / `异常（原始值=X）` / `异常（原始值=NULL）`）、正常行菜单含 `停用`、停用行菜单含 `启用`、异常行菜单**只有** `停用`、异常行双击不打开编辑弹窗、停用/启用成功流程与 `已生效条件` 刷新断言、取消确认不发起调用、失败保留列表与 `共 n 条`、`40250`/`40400` 消息分支、行级 busy 单请求、待确认去重与重试、busy 期间删除项禁用。
- `dataSource.spec.ts` 新增 `describe('列表视觉调整：序号列、主机列宽与黑色主按钮（UI §11.1~11.6）')`（2 条）：表头顺序 `['序号','数据源ID','数据源名称','角色','类型','主机','端口','Service Name/数据库名','用户名','操作']` 与 `.ds-seq` 序号值；`.ds-add-button` 与 `.ds-add-icon svg` 存在。
- 重置语义迁移：`重置只清空控件、不改变已生效条件；自动刷新仍用原生效快照`——断言重置发起 0 个请求、控件被清空、随后的自动刷新仍使用原生效快照（负向断言 `not.toHaveBeenLastCalledWith({})`）。
- `api/dataSource.spec.ts` 新增 enable/disable 契约用例，`okRows()` 夹具补充 `fgActive: '1'`。

### 5.2 后端

| 范围 | 命令 | 结果 |
|---|---|---|
| 定向用例 | `cd backend && mvn -o -Dtest=DataSourceControllerTest,DataSourceServiceTest,DataSourceNamingStrategyServiceTest,DataSourcePasswordLogSecurityTest test` | **123**，Failures 0，Errors 0，Skipped 0，BUILD SUCCESS |
| 不依赖外部系统的全部用例 | `cd backend && mvn -o -Dtest='!OracleDateMappingTest,!JobFailureServiceTest,!HealthControllerTest,!CdcConfigPlatformApplicationTests' test` | **1016**，Failures 0，Errors 0，Skipped 0，BUILD SUCCESS（2:09 min） |

新增/扩展用例（`DataSourceServiceTest` 59 条、`DataSourceControllerTest` 34 条）：

| 用例 | 覆盖 |
|---|---|
| 列表相关用例追加 `assertFalse(sql.contains("FG_ACTIVE"))` | 列表取消 `FG_ACTIVE` 过滤（`DS-REQ-150`） |
| 可维护边界用例（`.in("1","0")`） | 详情/编辑/删除/业务属性/策略/连接测试仅接受 `'1'`/`'0'`，`NULL`/非 `0`/`1` → `40400` |
| `enable` × 6 / `disable` × 6（服务层） | 状态机各分支：幂等不写、`'0'`→`'1'` 条件 `UPDATE`、`'1'`→`'0'` 条件 `UPDATE`、`NULL`/非 `0`/`1` 的 `40250`（enable）与归一化（disable）、不存在 `40400`、行数 ≠ 1 → `50002` |
| `enable_shouldSucceed` / `disable_shouldSucceed` | 控制器 200 + `success` |
| `enable_invalidStatus_shouldReturn40250` | 异常值启用 → `40250` |
| `disable_statusConflict_shouldReturn50002` | 条件 `UPDATE` 冲突 → `50002` |
| `enable_notFound_shouldReturn40400` | 记录不存在 → `40400` |

#### 未运行的后端测试及理由

后端完整测试套件（`mvn clean test` 全量）**未运行**，理由：以下 4 个 `@SpringBootTest` 类会在启动 Spring 上下文时连接真实外部系统，与提示词 §7.3「严禁为了测试而连接或写入真实数据库、ZooKeeper、Kafka」直接冲突：

| 未运行用例类 | 未运行理由 |
|---|---|
| `CdcConfigPlatformApplicationTests` | 启动完整上下文（`dev` profile）：`ZooKeeperConfig.curatorFramework()` 以 `initMethod="start"` 启动 Curator 客户端，会连接 ZooKeeper |
| `HealthControllerTest` | 同上（`RANDOM_PORT` 完整上下文） |
| `OracleDateMappingTest` | 直连真实 Oracle 开发库，查询真实表 `CDC_JOB_FAILURE_EVENT` 的时间列并断言已知值 |
| `JobFailureServiceTest` | 直连真实 Oracle 开发库，断言真实数据 |

已改以「排除上述 4 类」的方式运行其余全部 1016 条用例（见上表），并确认其余测试均为 Mockito 桩或静态检查，`src/test/resources` 不存在，测试中的 `10.1.1.1`、`localhost:2181` 等地址均为桩数据而非真实连接。

#### 首次运行的抖动（如实记录）

后端子集**首次**运行时出现 1 例失败：`ZooKeeperMonitorServiceTest.shouldNotSetScnStaleWhenExactlyAtThreshold:883 expected: <null> but was: <true>`。该用例类与本任务变更范围（`com.bsoft.cdcconfig.datasource.**`）无关，属时间阈值敏感的既有用例。排查与证据：

1. 单类定向运行 `mvn -o -Dtest=ZooKeeperMonitorServiceTest test` 连续 3 次均 **67/67 通过 / BUILD SUCCESS**；
2. 全量排除集重跑 **1016/1016 通过 / BUILD SUCCESS**。

判定为并行负载下的时间阈值抖动，**未修改**该用例、**未放宽**任何断言，按原样如实记录，不把「首次失败后重跑通过」写成一次通过。

### 5.3 构建

| 范围 | 命令 | 结果 |
|---|---|---|
| 前端 | `cd frontend && npm run build`（`vue-tsc --noEmit && vite build`） | **BUILD SUCCESS**（`DataSourcePage-CSHI98lq.js` 29.59 kB；仅有既有的 chunk >500 kB 提示） |
| 后端 | `cd backend && mvn -o clean package -DskipTests` | **BUILD SUCCESS**（`cdc-config-platform-backend-1.0.0-SNAPSHOT.jar`，47,740,568 B） |

后端 `package` 使用 `-DskipTests` 跳过测试执行（理由同上：完整构建会触发外部系统连接），测试编译仍执行。

本任务未导致的既有失败：无。前端 `type-check` / `lint` 脚本在 `package.json` 中不存在（类型检查已折入 `build` 的 `vue-tsc --noEmit`），故按项目实际脚本执行 `test` 与 `build`。

## 6. 状态回写与未执行项

文档只回写实现状态与变更记录，**不改已批准技术正文**（`DS-REQ-139~177`、`DS-AC-141~182` 编号与正文逐字未改）：

```text
adjustment_document_status=APPROVED
adjustment_baseline_status=APPROVED
implementation_status=IMPLEMENTED_PENDING_USER_REVIEW
implementation_authorization_status=GRANTED_IN_THIS_TASK
formal_acceptance_execution_status=NOT_RUN
new_adjustment_acceptance_status=ALL_NOT_RUN
```

- 7 份核心文档（README / REQUIREMENTS / ACCEPTANCE / DESIGN / API / UI / DATABASE）的 §标题与状态块同步更新为「已批准，已实现待目测」，新增实现任务行与变更记录条目；DATABASE.md 新增 §10.5 实现状态回写条目，保留 §9.1 零数据库变化声明、§9.2 操作矩阵、§9.3 启停写入边界正文不变。
- 既有正式复验统计 `PASS=113/FAIL=0/BLOCKED=2/NOT_RUN=0`（阻塞 `DS-AC-104`/`DS-AC-108`）**逐字保留**。

未执行项：

- `DS-AC-141~182`（42 条）**全部未执行**，仍为 `NOT_RUN`；上一轮 `DS-AC-116~140`（25 条）仍全部 `NOT_RUN`；自动化测试通过不构成正式执行；
- 未启动、停止或重启任何服务（无 PID、无 URL）；
- 未访问数据库、ZooKeeper、Kafka、业务源库；
- 未执行任何 SQL / DDL / DML；
- 未修改任何迁移/DDL/初始化数据脚本、依赖或锁文件。

## 7. 核验结论

| 核验项 | 结论 | 证据 |
|---|---|---|
| 重置只复位查询控件、不自动查询 | 是 | 用例断言重置发起 0 请求、控件清空、生效条件不变 |
| 结果区左上角只显示 `共 n 条` | 是 | `#summary` 渲染内容 |
| 新增序号列、主机列收窄 | 是 | 用例断言表头顺序与 `.ds-seq` |
| 行高/字号/DS-ID/角色标签页面作用域对齐 | 是 | 页面级选择器，无 `:root` 覆盖 |
| 列表返回全部状态、`fgActive` 原值直传 | 是 | 服务层删除 `FG_ACTIVE='1'` 过滤；VO/Converter 增加 `fgActive` |
| 停用记录保留既有维护能力 | 是 | 边界改用 `.in("1","0")`，用例覆盖 |
| 异常记录仅允许显式停用归一化 | 是 | 异常行菜单只有 `停用`；双击不打开编辑 |
| 逐行启停 + 二次确认 + 行级忙碌 + 失败保留 | 是 | 前端用例覆盖 |
| 两个新端点严格实现冻结状态机 | 是 | 服务层 12 条 + 控制器 5 条用例；代码见 §4.3 |
| 错误码 `40400` / `40250` / `50002` 正确 | 是 | 用例断言；`DataSourceErrorCode` 新增常量 |
| “新增数据源”为黑色实心主按钮且保留 Plus 图标 | 是 | 用例断言 `.ds-add-button` 与 `.ds-add-icon svg` |
| 公共查询列表组件零修改 | 是 | `frontend/src/components/query-list/**` 无 diff |
| `GlobalExceptionHandler` 无 diff | 是 | 无 diff |
| 其他 Feature / 数据库脚本 / 依赖锁文件无 diff | 是 | 变更文件清单不含之 |
| `DS-REQ`/`DS-AC` 业务正文无 diff | 是 | 仅章节标题、状态声明块、变更记录变化 |
| 新调整验收仍全部 `NOT_RUN` | 是 | `ACCEPTANCE.md §4.17` 42 行状态未改 |
| 外部系统零访问 | 是 | 未运行 4 个外部系统测试类；无 DB/ZK/Kafka 连接 |
| 服务零操作 | 是 | 无进程启停，无 PID/URL |
| 其它路由/Feature 无回归 | 是 | 前端全量 1029 通过；后端 1016 通过 |

## 8. 已知风险与阻塞

1. **后端完整测试未运行**：4 个 `@SpringBootTest` 类依赖真实 Oracle / ZooKeeper，本次按安全边界跳过；若需在受控环境执行，应由人工明确授权后单独进行。
2. **`ZooKeeperMonitorServiceTest` 时间阈值抖动**：全量首次运行出现 1 例失败，单类连续 3 次与全量重跑均通过（见 §5.2）；该用例与本任务无关，保留为已知抖动观察项，未修改。
3. **视觉结论未定**：本任务自动化测试不构成页面视觉验收；UI §11 中与视觉相关的判定（序号列、列宽、行高/字号、角色标签、黑色主按钮）需由项目负责人页面目测完成。
4. **并发语义为「最终收敛 + 冲突报错」**：并发相反请求的最终库状态允许为其中一个请求的目标值，冲突请求返回 `50002`；不加锁、不重试，符合已批准 `DS-REQ-171`。
5. 无阻塞项影响本次实现完成与推送；正式验收执行状态仍为 `NOT_RUN`。

## 9. 下一步

1. ChatGPT 从远程 Git 对本实现提交进行独立复审；
2. 项目负责人对 `/config/data-source` 页面进行目测（停在目测入口，未进入正式验收）；
3. 复审与目测通过后，另行决定是否正式执行 `DS-AC-141~182`（42 条），本任务不代其做任何验收结论。

---

> 关联文档：
> - 需求 `docs/features/data-source-management/REQUIREMENTS.md` §23（`DS-REQ-139~177`）
> - 验收 `docs/features/data-source-management/ACCEPTANCE.md` §4.17（`DS-AC-141~182`，全部 `NOT_RUN`）
> - 设计 `docs/features/data-source-management/DESIGN.md` §13
> - API `docs/features/data-source-management/API.md` §11
> - UI `docs/features/data-source-management/UI.md` §11
> - 数据库 `docs/features/data-source-management/DATABASE.md` §9（本轮无数据库变化）
> - 基线草案/批准收口报告 `reports/DATA-SOURCE-LIST-ALL-STATUS-ENABLE-DISABLE-UI-ADJUSTMENT-BASELINE-001(-R1/-R2).md`、`reports/DATA-SOURCE-LIST-ALL-STATUS-ENABLE-DISABLE-UI-ADJUSTMENT-APPROVAL-CLOSEOUT-001.md`
