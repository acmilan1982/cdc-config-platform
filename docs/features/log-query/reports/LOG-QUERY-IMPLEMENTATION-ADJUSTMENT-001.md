# LOG-QUERY-IMPLEMENTATION-ADJUSTMENT-001 实现报告

- 任务编号：`LOG-QUERY-IMPLEMENTATION-ADJUSTMENT-001`（初版，历史）
- R1 修订任务编号：`LOG-QUERY-IMPLEMENTATION-ADJUSTMENT-001-R1`（当前，见 §18）
- 开发分支：`develop`
- 初版任务开始前 Commit ID（授权基线）：`ea3c1bc6bbe2bc86e9bb081807a7255a12d1040c`
- R1 授权基线提交：`56a85779767045d80f5ad39d3e28532a3ab8c6a0`
- 控制文档：`docs/prompts/log-query/LOG-QUERY-IMPLEMENTATION-ADJUSTMENT-001-PROMPT.md`（初版）、`docs/prompts/log-query/LOG-QUERY-IMPLEMENTATION-ADJUSTMENT-001-R1-PROMPT.md`（R1）
- 报告日期：2026-08-21（初版）；2026-08-24（R1）

> **历史标记**：§1~§17 记录初版 `LOG-QUERY-IMPLEMENTATION-ADJUSTMENT-001` 的实现过程与结果，作为历史数据，不与 R1 当前累计结果混写。R1 修订内容见 §18。

---

## 1. 任务背景、批准基线与实现范围

### 1.1 任务背景

本任务是日志查询功能的可用性调整（availability adjustment）：在既有日志查询实现基础上，新增后端功能开关配置与状态接口，前端在未启用时展示"功能暂未开放"占位页，已启用时正常进入查询页；并同步补齐后端/前端自动化测试、实现报告、干净提交验证与推送。

### 1.2 批准基线

本任务严格执行以下五份 `APPROVED` 功能基线（均未修改，见 §15）：

| 基线文件 | 职责 |
|---|---|
| `docs/features/log-query/REQUIREMENTS.md` | 需求基线 |
| `docs/features/log-query/API.md` | 接口基线 |
| `docs/features/log-query/DESIGN.md` | 设计基线 |
| `docs/features/log-query/UI.md` | 界面基线 |
| `docs/features/log-query/ACCEPTANCE.md` | 验收基线 |

### 1.3 实现范围

- 后端：`cdc.log-query.enabled` 配置（默认 `false`、fail-closed）、`GET /api/log-query/status` 状态接口；原四接口不增加开关判断。
- 前端：`getLogQueryStatus()` API（请求级 30 秒超时）、四态页面（状态检测中 / 状态失败 / 未开放 / 正常）、同路由再次点击完整重新初始化、重置修正、数据源四态降级一致化、"全部"与具体值双向互斥。
- 自动化测试：后端 9 项 + 前端测试框架（Vitest + Vue Test Utils + jsdom）与 13 项覆盖。
- 报告、干净提交验证、提交推送。

---

## 2. Git 开始状态及任务前工作区保护

### 2.1 开始状态

- 分支：`develop`
- HEAD / base：`ea3c1bc6bbe2bc86e9bb081807a7255a12d1040c`
- 与 `origin/develop` 一致，ahead/behind 为 `0 0`。

### 2.2 任务前既有工作区内容（用户资产，本任务不改动、不暂存、不提交）

任务开始前工作区已存在以下与日志查询无关的用户改动/未跟踪文件，本任务全程保持原样：

- 前端主题与布局文件：`frontend/index.html`、`frontend/src/config/menu.ts`、`frontend/src/layouts/HeaderBar.vue`、`frontend/src/layouts/MainLayout.vue`、`frontend/src/layouts/Sidebar.vue`（部分）、`frontend/src/stores/app.ts`、`frontend/src/styles/global.css`。
- 环境与本地配置：`.claude/settings.local.json`、`agent-env.sh`。
- 未跟踪过程文档：`docs/prompts/`、仓库根目录若干 `*.md`、`docs/baseline/`（历史遗留未跟踪目录）。

其中 `frontend/src/layouts/Sidebar.vue` 是"既有用户改动 + 本任务最小补丁"重叠文件。处理方式见 §11。

---

## 3. 后端状态配置与接口实现

### 3.1 配置绑定（fail-closed）

`backend/src/main/java/com/bsoft/cdcconfig/logquery/config/LogQueryProperties.java` 新增：

```java
/** enabled 来自 ${CDC_LOG_QUERY_ENABLED:false}，默认关闭、fail-closed。 */
private boolean enabled = false;

public boolean isEnabled() { return enabled; }
public void setEnabled(boolean enabled) { this.enabled = enabled; }
```

`backend/src/main/resources/application-dev.yml` 在 `cdc.log-query` 下新增：

```yaml
enabled: ${CDC_LOG_QUERY_ENABLED:false}
```

- 默认 `false`，未设置环境变量时功能关闭；
- 环境变量绑定 `CDC_LOG_QUERY_ENABLED` 支持 `true/false`；
- `cursorSecret` 的绑定与 fail-closed 行为未作任何改动。

### 3.2 状态接口

新增 VO `backend/src/main/java/com/bsoft/cdcconfig/logquery/vo/LogQueryStatusVO.java`：

```java
public class LogQueryStatusVO {
    private boolean enabled;
    // 无参构造、boolean 构造、isEnabled()/setEnabled()
}
```

`LogQueryService` 新增方法 `LogQueryStatusVO getLogQueryStatus();`。

`LogQueryServiceImpl#getLogQueryStatus()` 仅读取配置，不访问数据库、Mapper、JdbcTemplate 或 ZooKeeper：

```java
@Override
public LogQueryStatusVO getLogQueryStatus() {
    return new LogQueryStatusVO(properties.isEnabled());
}
```

控制器新增端点：

```java
@Operation(summary = "功能开关状态", description = "返回日志查询功能是否已启用，仅读配置不访问数据库")
@GetMapping("/status")
public ApiResponse<LogQueryStatusVO> status() {
    return ApiResponse.success(logQueryService.getLogQueryStatus());
}
```

### 3.3 错误码

未新增任何错误码，无 `403`、无功能关闭类错误码。

---

## 4. 原四接口不受开关控制的证据

原四接口（`data-source-options`、`logs/search`、`logs/{logType}/{cdcLogId}/detail`、`logs/{logType}/{cdcLogId}/raw-message`）的控制器、服务与 Mapper 实现中均未增加 `enabled` 判断。

证据：

- `LogQueryController`：只有新增的 `/status` 端点读取状态；原四接口代码路径不变。
- `LogQueryServiceImpl`：`getLogQueryStatus()` 之外的各方法不读取 `properties.isEnabled()`。
- 静态检查测试 `LogQueryStaticCheckTest` 覆盖：
  1. 状态端点不访问数据库 / ZooKeeper；
  2. 控制器中除 `/status` 外不存在 `enabled` 开关判断；
  3. 代码库不引入 `403` / feature-closed 错误码。

---

## 5. 前端四态页面与初始化流程

### 5.1 状态 API

`frontend/src/api/logQuery.ts` 新增：

```ts
const REQUEST_TIMEOUT = 30000

export async function getLogQueryStatus(): Promise<ApiResponse<LogQueryStatusVO>> {
  const res = await http.get<ApiResponse<LogQueryStatusVO>>('/api/log-query/status', { timeout: REQUEST_TIMEOUT })
  return res.data
}
```

- 请求级 `30000ms` 超时，覆盖全局 `http.ts` 默认 10 秒，不修改全局默认值，不影响其他功能；
- 无自动重试。

### 5.2 页面四态（`LogQueryPage.vue`）

`loadStatus()` 使用 `statusToken` 令牌管理在途请求，旧响应不得覆盖新状态：

1. `statusLoading`：展示"状态检测中"；
2. `statusError`（状态接口失败）：固定文案"功能状态获取失败 / 暂时无法获取日志查询功能状态，请刷新页面或稍后重新进入。"，无"重新检测"按钮、不自动重试；
3. `enabled=false`：展示"日志查询功能暂未开放 / 当前环境尚未启用日志查询功能。如需使用，请联系系统管理员。"，不初始化两 Tab，不调用原四接口；
4. `enabled=true`：进入正常页面。

### 5.3 enabled=true 初始化顺序

`initNormal()`：

1. `activeTab = 'error'`；
2. `errorTab.reinitialize()`、`correctTab.reinitialize()`（两 Tab 状态全清）；
3. `loadOptions()` 加载数据源候选（按页面代次丢弃旧响应）；
4. `errorTab.initialQuery()` 对当前自然日错误日志默认首查；
5. 正确日志仅在首次切换到正确 Tab 时才首查（`onTabSwitch` 判断 `initialQueryAttempted`）。

---

## 6. "全部"互斥与请求边界

### 6.1 双向互斥

`frontend/src/views/log-query/components/selection.ts` 提供 `normalizeSelection(prev, next)`：

- 点击"全部"：只保留"全部"（取消全部已选具体值）；
- 选择任一具体值：去掉"全部"；
- 清空全部具体值：恢复"全部"，避免空白态。

`LogQueryFilter.vue` 在 `onSourceChange` / `onTargetChange` 中调用该函数（自 `selection.ts` 导入）。

### 6.2 请求边界

`useLogQueryTab#buildApplied()` 将 `ALL_DATA_SOURCE` 哨兵映射为 `null`，提交请求时不携带具体数据源 ID 数组、不拼接全部候选 ID；空数组不生成 `IN` 条件（`LogQueryMapperXmlCheckTest` 断言 XML 中的空数组守卫）。

---

## 7. 同路由再次点击重新初始化机制

`frontend/src/views/log-query/reinitBus.ts` 提供页面级事件总线：

```ts
const handlers = new Set<ReinitHandler>()
export function onLogQueryReinit(handler: ReinitHandler): () => void { ... }
export function triggerLogQueryReinit(): void { for (const handler of [...handlers]) handler() }
```

`Sidebar.vue`（本任务最小补丁）在 `el-menu` 上挂载 `@select="onMenuSelect"`：

```ts
function onMenuSelect(index: string) {
  if (index === '/monitor/log-query' && route.path === '/monitor/log-query') {
    triggerLogQueryReinit()
  }
}
```

`:router="true"` 下同路由再次点击不会重挂载组件，因此通过事件总线通知 `LogQueryPage`。

`LogQueryPage#fullReinit()`：

1. `pageGeneration += 1`（作废两 Tab 与候选在途请求）；
2. `statusToken += 1`（作废状态在途请求）；
3. 两 Tab `reinitialize()`；
4. 关闭并清理详情/原始消息弹窗；
5. 清空候选列表、选项错误与加载态；
6. 恢复默认错误日志 Tab；
7. 重新调用 `loadStatus()`。

`onMounted` 注册 `onLogQueryReinit(fullReinit)`，`onUnmounted` 注销并递增代次。

---

## 8. 重置及数据源降级修正

### 8.1 重置修正

`useLogQueryTab#reset()`：`setDefaultForm()` 并清空 `validationError`，但保留 `applied`、`items`、`requestCursorStack`、游标与分页状态（`useLogQueryTab.spec.ts` LQ-DESIGN-172 覆盖）。

### 8.2 数据源四态降级一致化

`frontend/src/views/log-query/components/dsDisplay.ts` 提供 `dsCellText` / `dsTooltipText` / `dsDetailText`，统一四态降级：

- 有名称且名称不等于 ID → `名称`；
- 有名称但名称等于 ID → 视为无名称；
- 无名称 → `未定义名称`；
- 重名 → 追加 `（ID）`。

列表单元格、悬浮提示、详情弹窗三处展示一致，杜绝 `ID（ID）` 重复。

`LogQueryTable.vue` 与 `LogDetailDialog.vue` 改为委托 `dsDisplay`。

---

## 9. 前端测试框架选择、依赖版本与原因

仓库此前无前端测试框架，本任务按控制文档 §6.2 授权选型并安装最小 devDependencies。

### 9.1 环境核对

- Vue 3.4、Vite 5.1、TypeScript 严格模式、Node/npm 由 `agent-env.sh` 提供。
- 兼容性组合：Vitest 1.6.1 + Vue Test Utils 2.4.11 + jsdom 24.1.3。

### 9.2 依赖变更（`frontend/package.json` + 锁文件）

```jsonc
"devDependencies": {
  "@vue/test-utils": "^2.4.11",
  "jsdom": "^24.1.3",
  "vitest": "^1.6.1"
}
```

新增脚本：

```jsonc
"test": "vitest run"
```

未引入与本任务无关的测试或构建工具。

### 9.3 测试配置

- `frontend/vitest.config.ts`：`vitest/config` + Vue 插件 + `@`→`src` 别名 + `jsdom` 环境 + `setupFiles`。
- `frontend/src/test/setup.ts`：`ResizeObserver` / `matchMedia` polyfill。
- 组合式/组件/页面级测试拆分：
  - `composables/useLogQueryTab.spec.ts`（6 项）；
  - `components/LogQueryFilter.spec.ts`（4 项，`selection.ts` 互斥）；
  - `components/dsDisplay.spec.ts`（2 项，四态降级）；
  - `components/RawMessageDialogSafety.spec.ts`（1 项，无 `v-html`）；
  - `LogQueryPage.spec.ts`（4 项，四态流程）。

---

## 10. 后端与前端测试清单、数量和结果

### 10.1 后端日志查询相关测试（107 项全部通过）

| 测试类 | 数量 | 结果 |
|---|---|---|
| `LogQueryConfigTest` | 8 | 通过（含 3 项 enabled 绑定：默认 false、true、false） |
| `LogQueryControllerTest` | 13 | 通过（含 2 项状态接口 HTTP 结构） |
| `LogQueryServiceImplTest` | 53 | 通过（含 2 项状态服务） |
| `LogQueryMapperXmlCheckTest` | 13 | 通过（含空数组不生成 IN） |
| `LogQueryStaticCheckTest` | 10 | 通过（含无开关判断、无 DB/ZK、无 403） |
| `LogQueryFingerprintTest` | 10 | 通过 |

合计：`Tests run: 107, Failures: 0, Errors: 0, Skipped: 0`。

后端 9 项测试要求覆盖：
1. `enabled` 默认 `false`；
2. `enabled=true` / `false` 配置读取；
3. 状态接口 HTTP 方法、路径与响应结构；
4. 状态服务不访问 Mapper / DB / ZooKeeper；
5. `enabled=false` 时原四接口仍可正常调用（无开关拦截）；
6. 无 403 / feature-closed 错误码；
7. 既有日志查询测试全部通过；
8. 空数据源数组不生成 `IN`；
9. `mvn clean package -DskipTests` 通过。

### 10.2 前端自动化测试（17 项全部通过）

| 测试文件 | 数量 | 覆盖 |
|---|---|---|
| `composables/useLogQueryTab.spec.ts` | 6 | 全部哨兵不携带 ID；重置保留列表/条件/游标；两 Tab 独立；三页游标与失败原子性；旧请求丢弃；`cdcLogId` 字符串往返 |
| `components/LogQueryFilter.spec.ts` | 4 | "全部"与具体值双向互斥；清空恢复"全部" |
| `components/dsDisplay.spec.ts` | 2 | 名称=ID 视为缺失；四态跨单元格/提示/详情一致 |
| `components/RawMessageDialogSafety.spec.ts` | 1 | 原始消息纯文本、无 `v-html` |
| `LogQueryPage.spec.ts` | 4 | enabled=false 未开放且不调原四接口；enabled=true 加载候选+错误日志默认查询；状态失败固定页无"重新检测"无重试；再次点击菜单重新初始化 |

合计：`Test Files 5 passed (5)`、`Tests 17 passed (17)`。

13 项前端覆盖要求逐项对应：互斥、请求不携带全部 ID、重置、两 Tab 独立、三页游标、再次点击重新初始化、enabled=false 未开放、enabled=true 默认查询、状态失败页、旧请求失效、四态降级、`cdcLogId` 字符串往返、原始消息纯文本安全展示。

### 10.3 测试执行命令

- 后端日志查询测试：`cd backend && mvn -Dtest='LogQuery*' test`
- 前端测试：`cd frontend && npm test`

---

## 11. 完整后端套件既有失败的对比证据

### 11.1 完整套件结果

`mvn test`：`Tests run: 575, Failures: 3, Errors: 1, Skipped: 0`（BUILD FAILURE）。

失败全部位于 `com.bsoft.cdcconfig.monitor.jobfailure`（与日志查询无关的功能包），为依赖开发库实时数据的既有已知无关失败：

| 测试 | 期望 | 实际 |
|---|---|---|
| `OracleDateMappingTest.oracleDateToLocalDateTime_viaJdbcTemplate_shouldMapCorrectly` | 27 | 30 |
| `JobFailureServiceTest.latestFaultShouldHaveCorrectRestartCount` | 1 | 4 |
| `JobFailureServiceTest.failureDetail_eventNotInFaultProcess_shouldThrow` | 40006 | 40401 |
| `JobFailureServiceTest.failureDetailByEvent_shouldReturnContent` | — | `BusinessException: 故障过程不存在或已被排除: faultRootId=341473352776552448` |

### 11.2 与基线对比证据

在 `ea3c1bc`（HEAD，即授权基线）创建 detached 临时 worktree，仅运行 `OracleDateMappingTest,JobFailureServiceTest`，结果与完整套件**完全一致**：

```
Tests run: 30, Failures: 3, Errors: 1, Skipped: 0  (BUILD FAILURE)
OracleDateMappingTest...: expected <27> but was <30>
JobFailureServiceTest...: expected <40006> but was <40401>
JobFailureServiceTest...: expected <1> but was <4>
JobFailureServiceTest...: BusinessException: 故障过程不存在或已被排除: faultRootId=341473352776552448
```

结论：上述 4 项失败在授权基线即存在，与本次改动无关，非本任务引入。临时 worktree 已删除，主工作区不受影响。

---

## 12. 后端和前端构建结果

### 12.1 后端

`cd backend && mvn clean package -DskipTests` → `BUILD SUCCESS`。

### 12.2 前端

`cd frontend && npm run build`（`vue-tsc --noEmit && vite build`）→ 通过（`✓ built in 19.73s`；仅存在与本次改动无关的既有 chunk 体积警告）。

### 12.3 前端静态检查

- 无 `v-html`（`RawMessageDialog.vue` 使用文本插值；仅测试文件断言其不存在）；
- 无自动轮询、自动刷新、页面级重试按钮、页码/页次/总数/OFFSET；
- `setInterval` 仅用于查询耗时展示（`startElapsed`），非数据自动刷新；
- 全部 5 个日志查询请求（status、options、search、detail、raw-message）均为请求级 `timeout=30000`。

---

## 13. 干净提交验证结果

§7.3：使用 detached 临时 worktree 对"仅包含授权基线 + 本任务暂存/提交内容"执行验证。

### 13.1 方法

1. 构造临时索引：`read-tree HEAD` + `update-index --cacheinfo`（Sidebar.vue 使用"HEAD + 本任务最小补丁" blob）+ `add` 其余 30 个本任务文件，得到仅含本任务 31 个文件的提交内容；
2. `git diff --cached HEAD --binary` 生成补丁；
3. `git worktree add --detach` 创建临时 worktree，`git apply --index` 应用补丁；
4. 前端 `node_modules` 符号链接到主工作区（依赖相同 package.json/锁文件）；
5. 执行验证后删除 worktree。

### 13.2 结果

| 验证项 | 结果 |
|---|---|
| 前端测试（clean 内容） | `Tests 17 passed (17)` |
| 前端构建（clean 内容） | `BUILD SUCCESS` |
| 后端日志查询测试（clean 内容） | `Tests run: 107, Failures: 0, Errors: 0` |
| 后端打包（clean 内容） | `mvn clean package -DskipTests` → `BUILD SUCCESS` |

主工作区在验证前后保持不变：`HEAD=ea3c1bc`、真实索引未暂存任何内容、用户既有改动保持原样。临时 worktree 已删除并 `worktree prune`。

---

## 14. 实际变更文件

本任务提交内容共 31 个文件 + 本报告：

### 后端（11 个）

- `backend/src/main/java/com/bsoft/cdcconfig/logquery/config/LogQueryProperties.java`（改）
- `backend/src/main/java/com/bsoft/cdcconfig/logquery/vo/LogQueryStatusVO.java`（新增）
- `backend/src/main/java/com/bsoft/cdcconfig/logquery/service/LogQueryService.java`（改）
- `backend/src/main/java/com/bsoft/cdcconfig/logquery/service/impl/LogQueryServiceImpl.java`（改）
- `backend/src/main/java/com/bsoft/cdcconfig/logquery/controller/LogQueryController.java`（改）
- `backend/src/main/resources/application-dev.yml`（改）
- `backend/src/test/java/com/bsoft/cdcconfig/logquery/LogQueryStaticCheckTest.java`（改）
- `backend/src/test/java/com/bsoft/cdcconfig/logquery/config/LogQueryConfigTest.java`（改）
- `backend/src/test/java/com/bsoft/cdcconfig/logquery/controller/LogQueryControllerTest.java`（改）
- `backend/src/test/java/com/bsoft/cdcconfig/logquery/mapper/LogQueryMapperXmlCheckTest.java`（改）
- `backend/src/test/java/com/bsoft/cdcconfig/logquery/service/LogQueryServiceImplTest.java`（改）

### 前端（20 个）

- `frontend/package.json`（改，新增 `test` 脚本与 devDependencies）
- `frontend/package-lock.json`（改）
- `frontend/vitest.config.ts`（新增）
- `frontend/src/test/setup.ts`（新增）
- `frontend/src/types/logQuery.ts`（改，新增 `LogQueryStatusVO`）
- `frontend/src/api/logQuery.ts`（改，新增 `getLogQueryStatus`）
- `frontend/src/views/log-query/LogQueryPage.vue`（改，四态流程）
- `frontend/src/views/log-query/reinitBus.ts`（新增）
- `frontend/src/views/log-query/composables/useLogQueryTab.ts`（改，`reinitialize`、重置修正）
- `frontend/src/views/log-query/composables/useLogQueryTab.spec.ts`（新增）
- `frontend/src/views/log-query/LogQueryPage.spec.ts`（新增）
- `frontend/src/views/log-query/components/selection.ts`（新增）
- `frontend/src/views/log-query/components/dsDisplay.ts`（新增）
- `frontend/src/views/log-query/components/dsDisplay.spec.ts`（新增）
- `frontend/src/views/log-query/components/LogQueryFilter.vue`（改）
- `frontend/src/views/log-query/components/LogQueryFilter.spec.ts`（新增）
- `frontend/src/views/log-query/components/LogQueryTable.vue`（改）
- `frontend/src/views/log-query/components/LogDetailDialog.vue`（改）
- `frontend/src/views/log-query/components/RawMessageDialogSafety.spec.ts`（新增）
- `frontend/src/layouts/Sidebar.vue`（改，提交内容 = HEAD + 本任务最小补丁）

### 报告

- `docs/features/log-query/reports/LOG-QUERY-IMPLEMENTATION-ADJUSTMENT-001.md`（本文件，新增）

### 重叠脏文件处理说明（Sidebar.vue）

`Sidebar.vue` 提交内容仅包含本任务最小补丁：

1. `el-menu` 增加 `@select="onMenuSelect"`；
2. `import { triggerLogQueryReinit } from '@/views/log-query/reinitBus'`；
3. `onMenuSelect` 函数（同路由再次点击日志查询菜单时触发重新初始化）。

任务前用户既有改动（主题化重构：iconMap、CSS 变量、折叠逻辑移除、品牌文案等）保留在工作区，不进入本任务提交。提交后工作区中 `Sidebar.vue` 仍显示为有未提交差异（即用户既有内容），属预期。

`menu.ts`、`HeaderBar.vue`、`MainLayout.vue`、`stores/app.ts`、`global.css`、`index.html` 等为用户既有改动，本任务未修改、未暂存、未提交。

---

## 15. 五份批准基线未修改的证明

`git status --short -- docs/features/log-query/` 输出为空；`git diff --stat -- REQUIREMENTS.md API.md DESIGN.md UI.md ACCEPTANCE.md` 无输出。五份批准基线文件无任何 diff。

---

## 16. 数据库、ZooKeeper、DDL、物理设计和生产开关声明

- 数据库：本任务未执行任何数据库查询、写入、DDL、执行计划或压测（`database_read_status=NONE`、`database_write_status=NONE`、`ddl_status=NONE`）。
- ZooKeeper：本任务未读取或操作 ZooKeeper（`zookeeper_write_status=NONE`）。
- 物理设计：最终 RANGE 粒度、子分区、索引、生产 DDL 均未设计或执行（`physical_design_status=DEFERRED`）。
- 生产开关：未将生产环境 `CDC_LOG_QUERY_ENABLED` 置为 `true`（`production_enable_status=DISABLED_PENDING_PHYSICAL_AND_PERFORMANCE_ACCEPTANCE`）。

---

## 17. 未完成项与下一步边界

### 17.1 已完成

- 后端状态配置与接口实现；
- 前端四态页面、重新初始化、重置与降级修正；
- 后端 9 项自动化测试（107 项日志查询测试通过）；
- 前端测试框架与 13 项覆盖（17 项测试通过）；
- 前后端构建与干净提交验证通过；
- 完整套件既有失败与基线对比证据。

### 17.2 下一步边界（仅限 ChatGPT 代码复审）

推送成功后本任务立即停止。下一步仅为 ChatGPT 代码复审：

- 不自行执行正式验收；
- 不更新五份批准基线状态；
- 不将实现标记为 `IMPLEMENTED_ACCEPTED` / `COMPLETED` / `ACCEPTED` / 验收 `PASS`；
- 不将生产开关置为 `true`。

### 17.3 状态

- 五份基线：`APPROVED`
- 后端调整实现：`IMPLEMENTED_PENDING_REVIEW`
- 前端调整实现：`IMPLEMENTED_PENDING_REVIEW`
- 整体实现：`IMPLEMENTED_PENDING_REVIEW`
- 正式验收执行：`NOT_RUN`
- 生产启用：`DISABLED_PENDING_PHYSICAL_AND_PERFORMANCE_ACCEPTANCE`

---

## 18. R1 修订章节（LOG-QUERY-IMPLEMENTATION-ADJUSTMENT-001-R1）

> 本章为 ChatGPT 对提交 `56a8577` 的复审问题定向修订的当前累计结果。历史初版数据见 §1~§17。

### 18.1 任务定位与复审结论

- 任务编号：`LOG-QUERY-IMPLEMENTATION-ADJUSTMENT-001-R1`
- 前序实现任务：`LOG-QUERY-IMPLEMENTATION-ADJUSTMENT-001`，前序提交 `56a85779767045d80f5ad39d3e28532a3ab8c6a0`
- 任务性质：前后端实现复审问题定向修订
- 复审结论：R1-01~R1-05 五项问题全部修复并通过回归；后端生产代码无需修改（仅运行既有日志查询测试记录证据）。
- 本任务只修复复审问题，不重新设计需求、不执行正式验收、不批准实现、不确定数据库物理设计、不启用生产功能。

### 18.2 五项问题根因与修复方式

#### 18.2.1 R1-01（阻断）"全部"真实组件交互仍然错误

- **根因**：`LogQueryFilter.vue` 使用 `v-model` + `@change`。Element Plus 多选框在触发 `change` 前已更新 `v-model`，`onSourceChange`/`onTargetChange` 中传入 `normalizeSelection(props.form.sourceDataSourceIds, val)` 的"旧值"实际已是新值，导致已选 `[A, B]` 时点击"全部"，新值 `[A, B, __ALL__]` 被同时当作 prev 与 next，误判为"原来已含全部"，最终返回 `[A, B]`，"全部"被取消、具体值未清除。
- **修复方式**：源库与目标库两个多选改为受控组件——`:model-value="form.sourceDataSourceIds"` + `@update:model-value="onSourceChange"`（目标库同理）。`@update:model-value` 触发时 `props.form.sourceDataSourceIds` 仍为点击前的真实旧值，`normalizeSelection(prev, next)` 得以按真实前后值互斥。`selection.ts` 的纯函数逻辑未改动。
- **修复后的真实行为**：具体值 → 点击"全部" → 仅剩"全部"；"全部" → 选任一具体值 → 取消"全部"仅保留具体值；清空全部具体值 → 恢复"全部"；多个具体值去重；"全部"哨兵仅存在于前端表单；查询请求处于"全部"时省略数组（`buildApplied` 映射为 `null`）；不发送全部候选 ID；后端空数组不生成 `IN`、具体 ID 才生成绑定参数 `IN`；不为日志表 NULL 数据源字段增加特殊兼容分支。

#### 18.2.2 R1-02 数据源降级展示边界

- **根因**：`dsDisplay.ts` 的"未定义名称"分支未校验数据源 ID 是否存在，"空白名称 + ID 也缺失"被错误显示为"未定义名称"。
- **修复方式**：`dsCellText` / `dsTooltipText` / `dsDetailText` 三处统一——"未定义名称"仅在"确认存在数据源 ID 且名称为空白"时使用；名称与 ID 均缺失（含空白名称 + 无 ID）单元格与详情为 `--`，Tooltip 返回空（不渲染）。名称缺失但 ID 存在只显示一次 ID；名称等于 ID（后端未匹配回退）不出现 `ID（ID）`。

#### 18.2.3 R1-03 enabled=true 初始化顺序

- **根因**：`initNormal()` 以两个 `void` 并发启动候选加载与错误日志默认查询，与已批准 LQ-DESIGN-177"按顺序加载数据源选项并默认查询错误日志第一页"不一致。
- **修复方式**：`initNormal()` 改为 `async`：重置两 Tab → 捕获本次页面代次 → `await loadOptions()` 等待候选加载结束 → 若页面代次仍有效且 `enabled=true` 仍成立，再执行错误日志默认查询。候选失败只影响下拉框（展示候选失败状态）、不阻止默认查询；重新进入导致页面代次变化时旧初始化链不触发默认查询；不增加自动重试、轮询或自动刷新。

#### 18.2.4 R1-04 同路由当前菜单重新初始化测试必须覆盖真实入口

- **根因**：既有测试直接调用 `triggerLogQueryReinit()`，只证明事件总线处理器工作，未证明 `Sidebar.vue` 再次点击当前菜单的真实触发路径。
- **修复方式**：新增 `frontend/src/views/log-query/SidebarReinit.spec.ts`，挂载真实 `Sidebar.vue`（内存路由 + Element Plus），验证：当前路由 `/monitor/log-query` 再次点击"日志查询"触发重新初始化事件；点击其他菜单不触发；当前路由不是日志查询时第一次进入不被误判；非日志查询路由点击其他菜单也不触发。页面侧补充集成测试，验证真实入口事件后清空两 Tab、关闭弹窗、重新调用状态接口并重跑默认错误日志查询。

#### 18.2.5 R1-05 旧弹窗响应失效测试

- **根因**：既有自动化测试只覆盖列表旧请求，未覆盖详情与原始消息弹窗的旧响应失效。
- **修复方式**：新增 `frontend/src/views/log-query/components/LogDialogOldResponse.spec.ts`，使用 deferred Promise 的真实组件测试：详情弹窗在响应返回前关闭，旧响应返回后弹窗保持关闭、旧详情不重新展示；原始消息弹窗执行同类测试；"旧记录请求晚于新记录请求返回"时旧响应不覆盖新记录。

### 18.3 修改文件与关键实现

- `frontend/src/views/log-query/components/LogQueryFilter.vue`（改）：源/目标多选改受控 `:model-value` + `@update:model-value`，真实旧值参与互斥。
- `frontend/src/views/log-query/components/dsDisplay.ts`（改）：降级边界修正，"未定义名称"仅限确认有 ID。
- `frontend/src/views/log-query/LogQueryPage.vue`（改）：`initNormal()` 顺序化 + 页面代次/enabled 二次校验。
- `frontend/src/views/log-query/components/LogQueryFilter.spec.ts`（改）：新增真实 `el-select` 多选组件事件顺序测试（源库/目标库"全部"互斥、取消、清空恢复、去重）。
- `frontend/src/views/log-query/components/dsDisplay.spec.ts`（改）：补充"空白名称 + 无 ID → `--` 无 Tooltip"边界断言。
- `frontend/src/views/log-query/LogQueryPage.spec.ts`（改）：新增 R1-03 顺序初始化 3 项测试 + R1-04 页面真实入口反应测试。
- `frontend/src/views/log-query/SidebarReinit.spec.ts`（新增）：Sidebar 真实入口 4 项测试。
- `frontend/src/views/log-query/components/LogDialogOldResponse.spec.ts`（新增）：两类弹窗旧响应失效 3 项测试。
- `docs/features/log-query/reports/LOG-QUERY-IMPLEMENTATION-ADJUSTMENT-001.md`（本文件，R1 章节）。

后端生产代码无改动。`Sidebar.vue` 未改动（`onMenuSelect`/`triggerLogQueryReinit` 已于前序提交 `56a8577` 落地；当前工作区差异为用户既有主题改动，本任务不暂存、不提交）。

### 18.4 前端自动化测试（33 项全部通过）

| 测试文件 | 数量 | 覆盖 |
|---|---|---|
| `composables/useLogQueryTab.spec.ts` | 6 | "全部"哨兵不携带 ID；重置保留列表/条件/游标；两 Tab 独立；三页游标与失败原子性；旧请求丢弃；`cdcLogId` 字符串往返 |
| `components/LogQueryFilter.spec.ts` | 8 | 纯函数互斥 4 项 + 真实多选组件事件顺序 4 项（源/目标"全部"、取消"全部"、清空恢复、去重） |
| `components/dsDisplay.spec.ts` | 3 | 名称=ID 视为缺失；四态三处一致；"空白名称 + 无 ID → `--` 无 Tooltip"（R1-02） |
| `components/RawMessageDialogSafety.spec.ts` | 1 | 原始消息纯文本、无 `v-html` |
| `components/LogDialogOldResponse.spec.ts` | 3 | 详情弹窗旧响应失效；原始消息弹窗旧响应失效；旧记录不覆盖新记录（R1-05） |
| `SidebarReinit.spec.ts` | 4 | 日志查询当前菜单真实触发；其他菜单不触发；首次进入不误判；非日志查询路由点击其他菜单不触发（R1-04） |
| `LogQueryPage.spec.ts` | 8 | enabled=false 不调原四接口；enabled=true 默认查询；状态失败页无"重新检测"无重试；再次点击重新初始化；候选加载完成后再默认查询；候选失败仍可默认查询；重新进入旧链不触发；真实入口页面反应（R1-03/04） |

合计：`Test Files 7 passed (7)`、`Tests 33 passed (33)`。

R1 §7 的 18 项前端覆盖要求全部落实：真实多选组件事件顺序（源/目标）、"全部"→具体、清空恢复、"全部"请求不携带数组、降级边界两态、候选加载顺序、候选失败不阻塞、旧初始化链失效、Sidebar 真实入口、其他菜单/首次进入不误触发、详情/原始消息旧响应失效、旧记录不覆盖新记录、原 13 类批准场景继续通过、状态失败页无按钮无重试、enabled=false 不调原四接口。

### 18.5 后端回归与测试（135 项日志查询测试全部通过；无生产代码改动）

按 R1 §6 回归确认：

- `cdc.log-query.enabled` 默认 `false`，外部 `true/false` 绑定正确（`LogQueryConfigTest` 3 项绑定断言通过）。
- `GET /api/log-query/status` 只读配置：`getLogQueryStatus()` 仅返回 `properties.isEnabled()`，不调用 Mapper/JdbcTemplate/SqlSession/ZooKeeper（`LogQueryStaticCheckTest` 静态断言通过）。
- 原四接口不判断开关：控制器、服务、Mapper 无 `enabled` 门控；`enabled=false` 时直接调用仍执行原契约（`LogQueryStaticCheckTest` 断言控制器不出现 `isEnabled(`；`LogQueryControllerTest`/`LogQueryServiceImplTest` 通过）。
- 未新增 403、40310、FEATURE_CLOSED、NOT_OPEN 等错误（`LogQueryStaticCheckTest` 断言通过）。
- 空数据源数组不生成 `IN`（XML `<if ...!isEmpty()>` 守卫，`LogQueryMapperXmlCheckTest` 断言通过）。
- 具体数据源 ID 才生成绑定参数 `IN`（XML `<foreach>#{id}</foreach>`，`LogQueryMapperXmlCheckTest` 断言通过）。
- 不为 NULL 数据源字段添加特殊兼容 SQL（XML 无 NVL/OR IS NULL 等兼容分支）。

日志查询测试执行：`mvn -Dtest='com.bsoft.cdcconfig.logquery.**' test`

| 测试类 | 数量 | 结果 |
|---|---|---|
| `LogQueryConfigTest` | 8 | 通过 |
| `LogQueryControllerTest` | 13 | 通过 |
| `LogQueryServiceImplTest` | 53 | 通过 |
| `LogQueryMapperXmlCheckTest` | 13 | 通过 |
| `LogQueryStaticCheckTest` | 10 | 通过 |
| `LogQueryFingerprintTest` | 10 | 通过 |
| `LogCursorCodecTest` | 28 | 通过 |

合计：`Tests run: 135, Failures: 0, Errors: 0, Skipped: 0`，`BUILD SUCCESS`。

本任务未重跑完整后端套件；前序 §11 已记录完整套件 `575 run / 3 fail + 1 error` 为 `monitor.jobfailure` 依赖开发库实时数据的既有无关失败，R1 未引入新失败。

### 18.6 前后端构建结果

- 前端：`cd frontend && npm run build`（`vue-tsc --noEmit && vite build`）→ 成功（`✓ built in 23.02s`；仅存在与本次改动无关的既有 chunk 体积警告，不作为失败）。
- 后端：`cd backend && mvn clean package -DskipTests` → `BUILD SUCCESS`。

### 18.7 干净提交验证

验证方法（提交后在 detached 临时 worktree 检出结果提交执行）：

1. 在主工作区精确暂存本任务文件，核对暂存 diff 不含用户既有修改；
2. 以固定提交信息 `fix(log-query): correct frontend interaction semantics` 创建主提交；
3. 在 detached 临时 worktree 检出该提交，仅对提交内容重新执行前端测试与构建、后端日志查询测试与打包；
4. 记录结果；删除临时 worktree 不影响主工作区。

首次干净验证发现一处测试缺陷并已修复：

- **缺陷**：`SidebarReinit.spec.ts` 初版挂载 `Sidebar.vue` 时未初始化 Pinia。提交中的 `Sidebar.vue` 使用 `useAppStore()`（`@/stores/app`），干净环境检出提交内容后该测试 4 项失败（`getActivePinia() was called but there was no active Pinia`）。主工作区因存在用户未提交的 `Sidebar.vue` 变体（其已去除 store 引用）而通过，掩盖了该缺陷。
- **修复**：测试 `mount` 的 `global.plugins` 增加 `createPinia()`。`app` store 无副作用（仅三个 ref），该插件对"不含 store 的用户工作区版本"无影响、对"含 store 的提交版本"为必需。修复后主工作区与干净提交内容均为 `33/33` 通过。

修复后重新检出提交内容验证结果：

- 前端：`Test Files 7 passed (7)`、`Tests 33 passed (33)`；`npm run build`（`vue-tsc --noEmit && vite build`）成功。
- 后端日志查询：`Tests run: 135, Failures: 0, Errors: 0, Skipped: 0`，`BUILD SUCCESS`；`mvn clean package -DskipTests` → `BUILD SUCCESS`。
- 提交内容仅包含授权范围内前后端代码与测试、以及本报告；未混入用户既有修改。

### 18.8 未修改五份批准基线

`git status --short -- docs/features/log-query/` 无输出；`git diff --stat -- REQUIREMENTS.md API.md DESIGN.md UI.md ACCEPTANCE.md` 无输出。五份批准基线（REQUIREMENTS/API/DESIGN/UI/ACCEPTANCE）无任何 diff。

### 18.9 数据库、ZooKeeper、DDL、物理设计和生产开关声明

- 数据库：未执行任何数据库查询、写入、DDL、分区、索引或压测（`database_read_status=NONE`、`database_write_status=NONE`、`ddl_status=NONE`）。
- ZooKeeper：未读取或操作 ZooKeeper（`zookeeper_write_status=NONE`）。
- 物理设计：最终 RANGE 粒度、子分区、索引、生产 DDL 均未设计或执行（`physical_design_status=DEFERRED`）。
- 生产开关：未将生产环境 `CDC_LOG_QUERY_ENABLED` 置为 `true`（`production_enable_status=DISABLED_PENDING_PHYSICAL_AND_PERFORMANCE_ACCEPTANCE`）。

### 18.10 状态与下一步边界

- 五份基线：`APPROVED`
- 后端调整实现：`IMPLEMENTED_PENDING_REVIEW`
- 前端调整实现：`IMPLEMENTED_PENDING_REVIEW`
- 整体实现：`IMPLEMENTED_PENDING_REVIEW`
- 正式验收执行：`NOT_RUN`
- 生产启用：`DISABLED_PENDING_PHYSICAL_AND_PERFORMANCE_ACCEPTANCE`

下一步仅为 ChatGPT 代码复审；不执行正式验收、不批准实现、不更新五份基线状态、不将生产开关置为 `true`。

---

```text
AGENT_TASK_RESULT_BEGIN
status=SUCCESS
task_code=LOG-QUERY-IMPLEMENTATION-ADJUSTMENT-001-R1
branch=develop
base_commit_id=56a85779767045d80f5ad39d3e28532a3ab8c6a0
result_commit_id=
remote_commit_id=
requirements_status=APPROVED
api_status=APPROVED
design_status=APPROVED
ui_status=APPROVED
acceptance_status=APPROVED
backend_implementation_status=IMPLEMENTED_PENDING_REVIEW
frontend_implementation_status=IMPLEMENTED_PENDING_REVIEW
overall_implementation_status=IMPLEMENTED_PENDING_REVIEW
acceptance_execution_status=NOT_RUN
backend_test_status=135 log-query tests passed (regression; no production code change)
frontend_test_status=33 tests passed
backend_build_status=SUCCESS
frontend_build_status=SUCCESS
clean_commit_verification_status=SUCCESS
database_read_status=NONE
database_write_status=NONE
zookeeper_write_status=NONE
ddl_status=NONE
physical_design_status=DEFERRED
production_enable_status=DISABLED_PENDING_PHYSICAL_AND_PERFORMANCE_ACCEPTANCE
report_file=docs/features/log-query/reports/LOG-QUERY-IMPLEMENTATION-ADJUSTMENT-001.md
commit_status=REQUESTED_AND_PENDING_EXECUTION
push_status=REQUESTED_AND_PENDING_EXECUTION
changed_files=
ahead_behind=
error=
AGENT_TASK_RESULT_END
```
