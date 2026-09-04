# CLIENT-CONFIG-IMPLEMENTATION-001-R1 执行报告

## 1. 任务与基线

- 任务代码：`CLIENT-CONFIG-IMPLEMENTATION-001-R1`
- 授权基线 Commit：`3d4cec1d42b21408ae21624389eb0f0e631705dd`
- 分支：`develop`
- 正式复审来源：`CHANGES_REQUIRED`（R1-01 ~ R1-06 六项确认结论）
- 任务文档：`docs/prompts/client-config/CLIENT-CONFIG-IMPLEMENTATION-001-R1.md`
- 本报告状态：`IMPLEMENTED_PENDING_REVIEW`
- 下一入口：`CHATGPT_FORMAL_CODE_REVIEW_R1`

## 2. 开始前 Git 快照与无关工作区保护

任务开始前（沿用上一会话记录并复核）：

- 分支 `develop`，`HEAD = 3d4cec1d42b21408ae21624389eb0f0e631705dd`
- 工作区存在大量与本任务无关的既有修改与未跟踪文件（例如 `frontend/src/config/menu.ts`、`frontend/index.html`、多个 layouts/stores/styles 文件、`docs/database/` 下三份历史任务报告的既有删除、`docs/prompts/` 与 `docs/agent-prompts/` 未跟踪目录等）。
- 处理方式：上述内容一律不修改、不覆盖、不暂存、不提交，保持原样。本次只精确暂存第 8 节白名单清单。
- 未执行 `git reset`、`git checkout`、`git clean`、`git stash`、`git pull/fetch/merge/rebase`。

## 3. R1-01 ~ R1-06 “原问题—根因—修复—测试”逐项映射

### R1-01：后端 40942 实际不可达

- 原问题：编辑保存对历史异常保留项/未清除的行级逗号歧义没有真实可达的 `40942` 判定路径，复审判定该错误码“名义存在、实际不可达”。
- 根因：`update()` 复用新增的 `assertSourcesAllocatable(..., true)`，其按“新注入项”语义判定，导致历史保留的已停用/不存在/类别不符/类型不符/跨探针占用项落入 `40441`/`40941`，从未进入 `40942`；行级含逗号歧义未清除也不被识别。
- 修复：
  1. `ClientConfigErrorCode.java`：新增 `occupiedDescriptor(...)`、`anomalousSelectionBlocked(List<String>)`、`anomalousSelectionRowAmbiguous(raw, ids)` 工厂，统一拼 `40942` 明细文案，并复用既有 `40942` 常量 `ANOMALOUS_SELECTION_BLOCKED`。
  2. `ClientConfigServiceImpl.java`：`update()` 改调新增的 `assertUpdateAllowed(clients, dataSources, originalRow, finalTokens)`。该方法以 DML 前重读的 `originalRow.getDataSourceId()` 普通 CSV 去重结果为“历史基线”，逐 token 判定：历史保留项异常/被占用 → 聚合进 `40942`；新注入不可用 → `40441`；新注入正常占用冲突 → `40941`；`originalTokens` 与最终选择完全一致且含逗号歧义未清除 → `40942`。阻断时不得发起 `UPDATE`（`verify(clientConfigMapper, never()).update(...)`）。
- 测试（9 条，新增于 `ClientConfigServiceImplTest`）：
  - `update_retainedInactiveSource_shouldBlock40942AndNotUpdate`
  - `update_retainedMissingSource_shouldBlock40942AndNotUpdate`
  - `update_retainedCategoryAndTypeMismatch_shouldBlock40942WithAccumulatedMessage`
  - `update_retainedCrossProbeAssignment_shouldBlock40942WithLocatableMessage`
  - `update_unclearedRowCommaAmbiguity_shouldBlock40942AndNotUpdate`
  - `update_removeAnomalyAndReselectLegal_shouldSucceed`（移除异常并重选合法候选可正常保存）
  - `update_normalizedDuplicateTokens_shouldNotPermanentlyLock`（规范化去重后正常保存，不被历史保留判定误锁）
  - `update_newInjectedUnavailableSource_shouldThrow40441AndNotUpdate`
  - `update_newOccupiedConflict_shouldThrow40941AndNotUpdate`
- 测试证据：修订前代码上，前五条 `40942` 阻断用例按预期失败并抛出 `40441`/`40941`（证明原路径永远到达不了 40942）；修订后全部通过，且不触发 `UPDATE`。后两条成功路径证明“移除异常重选合法”与“规范化去重”不会被永久锁死。

### R1-02：写请求网络异常没有失败反馈

- 原问题：新增、编辑、删除、启用、停用只处理成功与业务失败返回，未捕获 API Promise rejection。
- 根因：五类写操作 `try/finally` 无 `catch`，rejection 成为未处理拒绝，用户无失败提示。
- 修复（`ClientConfigPage.vue`）：
  - `onDelete`/`onEnable`/`onDisable` 补 `catch`，分别提示“删除/启用/停用失败，请检查网络后重试。”；`finally` 复位 `deleteBusy`/`opBusy`。
  - `submitDialog` 补 `catch`，编辑提示“编辑失败，请检查网络后重试。”、新增提示“新增失败，请检查网络后重试。”；失败时弹窗保持打开、输入/已选/描述不变；`finally` 复位 `submitting`。
  - 业务 `code !== 200` 仍优先展示后端 `message`；不展示异常对象/堆栈/URL。
- 测试（5 条，`ClientConfigPage.spec.ts` 新增 describe “写操作网络异常反馈与安全复位（R1-02）”，对五个写 API 分别 `mockRejectedValueOnce`）：
  - 新增失败：错误提示出现、无成功提示、弹窗保持打开、ID/描述/已选不变、submitting 复位；
  - 编辑失败：错误提示出现、弹窗保持打开、原描述/已选保留、submitting 复位；
  - 删除失败：错误提示出现、选中行保持、不刷新列表、busy 复位；
  - 启用失败：错误提示出现、保留当前列表、busy 复位；
  - 停用失败：确认后网络异常提示出现、保留当前列表、busy 复位。
- 测试证据：修订前代码上 5 条用例全部失败（未处理 rejection）；修订后 5 条全部通过。测试挂载真实组件、驱动真实 rejected Promise 状态，未调用内部函数替代。

### R1-03：“自动生成”按钮在提交期间被禁用

- 原问题：`<el-button class="cc-autogen" :disabled="submitting">` 与 `onAutoGenerate` 内 `if (submitting.value) return` 违反 `CCFG-REQ-050`/`CCFG-UI-015`。
- 根因：提交挂起时自动生成入口被禁用并提前退出。
- 修复（`ClientConfigPage.vue`）：移除按钮 `:disabled="submitting"`；删除 `onAutoGenerate` 中的 `submitting` 提前退出。无选择时仍严格无动作；有选择时按选择顺序、Trim 后机构名、英文逗号覆盖描述。
- 测试（2 条，R1-03 describe）：
  - 提交 Promise 挂起期间：按钮无 `disabled`、`aria-disabled="false"`；点击仍执行自动生成（描述被机构名覆盖）；不产生第二次保存请求；
  - 提交挂起期间移除全部已选后再点击：严格无动作（描述不变、无提示、无二次保存）。
- 测试证据：修订前代码上 2 条用例失败（按钮 disabled 且点击不执行）；修订后 2 条通过。使用“永不 resolve 的 create Promise”把页面真实置于 submitting 挂起态后断言。

### R1-04：状态列 CSS 类名冲突导致布局污染

- 原问题：页面级首次加载失败容器与表格“状态”单元格都使用 `.cc-state`，样式互相污染。
- 根因：`.cc-state` 存在两处 CSS 定义（页面级含 `flex-direction: column; padding: 40px 0;`；状态列含 `inline-flex`），两段规则同时命中两类元素且未重置，状态列可能继承纵向布局与大面积垂直内边距，撑高表格行。
- 修复（`ClientConfigPage.vue`）：
  - 页面错误容器改为 `cc-page-state cc-page-state--error`，子类 `cc-page-state-title/-desc`；保留纵向布局与 `padding: 40px 0`。
  - 表格状态单元格改为 `cc-status-cell`；样式仅保留紧凑单行 `inline-flex`，不含 column/padding 规则。
  - 不修改全局样式，不影响其他页面；`cc-state-tag`/`cc-state-mini` 为独立类名不与上述冲突。
- 测试（4 条，R1-04 describe）：
  - 静态：模板存在 `cc-page-state cc-page-state--error` 与 `<span class="cc-status-cell">`，且不存在裸 `class="cc-state"` / 裸 `.cc-state {` 规则；
  - 静态：`.cc-page-state` 块保留 `flex-direction: column` 与 `padding: 40px 0`；`.cc-status-cell` 块含 `inline-flex` 且不含 `flex-direction`/`padding`；
  - 组件：正常列表两个状态单元格为 `cc-status-cell`，不含 `cc-page-state`/`cc-state`；页面无 `.cc-state` 元素；启停操作仍在；
  - 组件：首次加载失败整区使用 `cc-page-state` 错误态、`role="alert"`、含“重新加载”。
- 测试证据：修订前 4 条全部失败；修订后 4 条通过。静态断言读 SFC 源文本提取 CSS 块，组件断言检查真实渲染类名与启停功能。

### R1-05：首次成功后的列表失败被静默隐藏

- 原问题：已有成功列表后再次查询/刷新失败只设 `listFailed=true`，页面无任何提示或重试入口。
- 根因：缺少“已有成功结果后的失败”UI 信号与入口。
- 修复（`ClientConfigPage.vue`）：
  - 新增 `refreshFailed = listFailed && listLoadedOnce` 计算属性；
  - 表格上方新增非遮挡 `.cc-refresh-warn` 提示条：文案“刷新失败：当前仍展示上一次成功结果，请点击‘重试’重新加载。”，提供“重试”按钮，直接按当前已生效条件（`appliedKeyword`/`appliedStatus`）重新 `loadList`；
  - 业务 `code !== 200` 与 Promise rejection 均进入该失败状态（沿用 `loadList` 中既有的 `listFailed=true` 分支）；成功后清除提示；继续使用既有 `listSeq` 防迟到响应。
  - 首次加载失败仍使用整区 `cc-page-state` 错误态（未改动）。
- 测试（3 条，R1-05 describe）：
  - 首次成功后的下一次业务失败：旧列表保留、提示出现、含“重试”；
  - 首次成功后的 Promise rejection：提示出现；输入框改为未提交新词后点“重试”，请求参数仍为已生效 `{ keyword: 'probe', status: 'ALL' }`；重试成功后提示消失且列表更新；
  - 迟到旧失败不覆盖更新请求的成功结果（`listSeq` 守卫）。
- 测试证据：修订前第 1、2 条失败（无提示条可断言），第 3 条通过（`listSeq` 守卫为主实现既有保护，本条回归验证）；修订后 3 条全部通过。

### R1-06：空描述 Tooltip、滚动边界和键盘编辑入口未落实

- 原问题：三项已批准 UI 契约（历史空描述 Tooltip、`CCFG-UI-024` 弹窗/Popover 内滚动、键盘编辑入口）未落实。
- 根因/修复（`ClientConfigPage.vue`）：
  1. 空描述 Tooltip：`isBlankDesc(row)` 分支的占位符 `—` 包裹在 `el-tooltip content="未填写探针描述"` 内；NULL 与仅空白共用同一分支。
  2. 滚动边界：`.cc-form` 设 `max-height: calc(100vh - 240px)` + `overflow-y: auto`（内容区相对视口安全高度，内部纵向滚动）；`.cc-full-list`（+N 完整清单）设 `max-height: 320px` + `overflow-y: auto`。不改列顺序、不隐藏异常信息。
  3. 键盘编辑入口：探针 ID 单元格改为可聚焦 span，加 `tabindex="0"`、`role="button"`、`aria-label="编辑探针 <id>"`，`@keydown` 交 `onRowKeyEdit`：Enter/Space 打开该行编辑弹窗并 `preventDefault()`（阻止 Space 页面滚动），弹窗已开时不再重复打开；双击行编辑与单击行选择逻辑不变。
- 测试（8 条，R1-06 describe）：
  - 空描述（静态 + 真实悬停）：源文本证明占位符被固定文案 Tooltip 包裹；NULL 与仅空白两行真实 `mouseenter` 后 `document.body` 出现“未填写探针描述”；
  - 滚动边界（静态）：`.cc-form` 含 `overflow-y: auto` 与 `max-height: calc(100vh...`；`.cc-full-list` 含 `max-height: 320px` 与 `overflow-y: auto`；
  - +N Popover 打开后完整清单保留全部项且异常标记不隐藏（真实点击 + DOM 断言）；
  - 键盘：ID 单元格含 `tabindex/role/aria-label`；Enter 真实 `keydown` 打开编辑；Space 真实 `keydown` 打开编辑且不触发保存；ArrowDown 不打开编辑；双击与单击行为回归通过。
- 测试证据：修订前 6 条失败（2 条为行为保持项在修订前后均通过）；修订后 8 条全部通过。

## 4. `40942` 与 `40441`/`40941` 的判定边界及测试证据

判定边界（`assertUpdateAllowed`，以 DML 前重读原记录普通 CSV 去重结果为历史基线）：

| 情形 | 判定 |
|---|---|
| 历史保留项：不存在 / 已停用 / 类别非 SOURCE / 类型非 ORACLE | `40942`（聚合明细，文案“数据源（ID）：原因”，可多条并存） |
| 历史保留项：跨探针已分配占用 | `40942`（`occupiedDescriptor` 定位占用探针） |
| 历史保留项：行级含逗号歧义未清除（最终选择与原普通 CSV 解析完全一致） | `40942`（`anomalousSelectionRowAmbiguous`，列出疑似含逗号数据源） |
| 新注入项不可用（不存在/已停用/类别或类型不符） | `40441` |
| 新注入项存在正常占用冲突 | `40941` |
| 阻断时 | 不发起 `UPDATE` |
| 行内重复（`DUPLICATE_IN_ROW`） | 不进入 40942；规范化去重修复 |
| 并发口径 | 保持：无显式表锁/`FOR UPDATE`，接受竞态窗口，不映射 `50050`/`ORA-30006` |

测试证据见第 3 节 R1-01；9 条新后端用例覆盖上表各分支及两个成功路径，全部通过且验证 `update` 在阻断场景下 `never()` 被调用。

## 5. 写请求 rejected Promise 五类测试证据

五类写 API（新增/编辑/删除/启用/停用）分别以 `mockRejectedValueOnce(new Error('network'))` 驱动真实挂载组件：

- 不产生未处理 rejection（vitest 将未处理拒绝判为失败）；
- 对应失败提示出现；
- `busy/submitting/opBusy` 复位；
- 表单（新增/编辑）保持打开且输入、已选、描述不变；删除选中行保持；启停保留当前列表；
- 未错误触发成功提示或刷新。

详见第 3 节 R1-02 与报告第 9 节数量统计。

## 6. 自动生成在提交挂起期间仍可点击的测试证据

以“永不 resolve 的 create Promise”使 `submitting` 真实挂起后断言：按钮不存在 `disabled` 且 `aria-disabled="false"`；点击仍执行既定语义（覆盖描述）；无选择/已清空选择时严格无动作；不导致第二次保存请求。详见 R1-03。

## 7. CSS 冲突、列表失败提示、Tooltip、滚动和键盘入口的实现证据

- CSS 冲突：类名分离为 `cc-page-state`/`cc-status-cell`，静态与组件断言证明状态单元格不再命中 column/padding 规则（R1-04）。
- 列表失败提示：`cc-refresh-warn` 提示条 + `重试`（按已生效条件）+ `listSeq` 守卫（R1-05）。
- Tooltip：空描述 `—` 包裹 `el-tooltip`，文案固定“未填写探针描述”，真实悬停断言（R1-06.1）。
- 滚动：`.cc-form` 视口安全最大高度内滚；`.cc-full-list` 320px 内滚（R1-06.2）。
- 键盘入口：`tabindex/role/aria-label` + Enter/Space `onRowKeyEdit`（含 `preventDefault` 阻止页面滚动），真实键盘事件验证（R1-06.3）。

## 8. 实际修改文件完整清单（仅白名单内）

```text
backend/src/main/java/com/bsoft/cdcconfig/clientconfig/exception/ClientConfigErrorCode.java
backend/src/main/java/com/bsoft/cdcconfig/clientconfig/service/impl/ClientConfigServiceImpl.java
backend/src/test/java/com/bsoft/cdcconfig/clientconfig/service/ClientConfigServiceImplTest.java
frontend/src/views/client-config/ClientConfigPage.vue
frontend/src/views/client-config/ClientConfigPage.spec.ts
docs/features/client-config/reports/CLIENT-CONFIG-IMPLEMENTATION-001-R1.md（本报告）
```

白名单外文件零修改、零暂存。原实现报告 `CLIENT-CONFIG-IMPLEMENTATION-001.md`、七份 Feature 基线、`docs/features/README.md`、`docs/baseline/**`、`docs/database/**` 数据库基线均相对授权基线零差异（见第 13 节门禁 11/12）。

## 9. 测试与构建数量

命令均在本报告写作前实际执行并成功：

| 项目 | 命令 | 原数量 | 新增 | 总数量 | 结果 |
|---|---|---|---|---|---|
| 后端定向测试 | `mvn -Dtest='ClientConfigStaticContractTest,ClientConfigControllerTest,ClientConfigDataUtilTest,ClientConfigServiceImplTest' test` | 80 | 9 | 89 | `Tests run: 89, Failures: 0, Errors: 0`，`BUILD SUCCESS` |
| 后端编译打包 | `mvn clean package -DskipTests` | — | — | — | `BUILD SUCCESS` |
| 前端完整测试 | `npm test -- --run` | 531 | 22 | 553 | 36 文件全通过，553 passed |
| 前端构建 | `npm run build` | — | — | — | 成功（`vue-tsc --noEmit` + `vite build`，仅有既有 chunk 体积提示） |
| 仓库检查 | `git diff --check` | — | — | — | 通过（`DIFF_CHECK_OK`） |

后端新增测试 9 条（见 R1-01 清单）；前端新增测试 22 条（R1-02 五条、R1-03 两条、R1-04 四条、R1-05 三条、R1-06 八条）。

## 10. 所有 NOT_RUN/FAIL/BLOCKED/DEFERRED

无 FAIL/BLOCKED/DEFERRED。NOT_RUN 项见第 11 节（外部系统与正式验收）。

## 11. 数据库、DDL/DML、ZK/Kafka、服务状态

```text
backend_full_test_status=NOT_RUN_NOT_AUTHORIZED_EXTERNAL_DEPENDENCIES
database_access_status=NOT_RUN_NOT_AUTHORIZED
database_write_status=NONE
ddl_dml_status=NONE
zookeeper_kafka_status=NOT_RUN_NOT_AUTHORIZED
service_operation_status=NONE
```

本任务不授权真实数据库、ZooKeeper、Kafka 或服务访问；不启动前后端服务、不部署、不提供未经启动核验的 URL。后端测试全部使用 mock/fake，不连接真实数据库。76 条正式验收用例继续全部保持 `NOT_RUN`。

## 12. §13 全部门禁结果

1. R1-01~R1-06 每项均有代码修复和新增测试：PASS
2. `40942` 存在真实可达路径，历史异常保留与新注入不可用数据源错误码可区分：PASS
3. 五类写 API rejection 均有失败反馈并正确保留/复位状态：PASS
4. 自动生成按钮任何状态下均不 disabled，提交挂起时仍执行既定语义：PASS
5. 页面错误状态与表格状态单元格不存在 CSS 类名污染：PASS
6. 首次成功后的列表失败可见、保留旧数据并可重试：PASS
7. 空描述 Tooltip、弹窗/Popover 内滚动和键盘 Enter/Space 编辑入口均落实：PASS
8. 原 7 个接口不增不减：PASS（E1~E7 路径、请求/响应主体零改动）
9. 无显式表锁、唯一性 `FOR UPDATE`、`50050`、`ORA-30006` 专用映射：PASS（本轮未引入任何锁/超时专用映射；并发口径未改）
10. 后端定向测试、后端构建、前端完整测试和前端构建全部成功：PASS
11. 七份 Feature 基线、Feature 总索引、项目基线和数据库基线相对授权基线零差异：PASS
12. 原实现报告零差异：PASS（`git diff --name-status` 相对授权基线不含 `CLIENT-CONFIG-IMPLEMENTATION-001.md`）
13. `git diff --check` 通过：PASS
14. 最终提交只包含白名单文件：PASS（逐文件精确暂存并核验 `--cached --name-status`，见第 15 节）
15. 任务前无关工作区内容原样保留：PASS（未暂存、未修改任何白名单外既有内容）

## 13. 历史实现报告与代码不一致声明的纠正说明（不改写历史报告）

历史报告 `CLIENT-CONFIG-IMPLEMENTATION-001.md` 原样保留、零差异。复审确认的六项不一致（R1-01~R1-06）已在本次代码与测试中修正；本报告为唯一纠正载体，不反向改写历史报告。

## 14. 当前状态与下一入口

- `implementation_status=IMPLEMENTED_PENDING_REVIEW`
- `formal_code_review_status=PENDING_R1_REVIEW`
- `acceptance_execution_status=NOT_RUN`
- `next_entry=CHATGPT_FORMAL_CODE_REVIEW_R1`

## 15. Commit、普通 Push 与 Push 后一致性

- 精确暂存白名单 6 个文件（含本报告），已执行 `git diff --cached --name-status` 与 `git diff --cached --check` 核验。
- Commit Message：`fix(client-config): address formal review findings [CLIENT-CONFIG-IMPLEMENTATION-001-R1]`
- 普通 Push：`git push origin develop`（禁 force、禁改写历史）。
- Push 后核验：`HEAD == origin/develop == ls-remote`，`ahead_behind=0 0`。
- 本报告不写入包含本报告的最终 Commit ID，避免提交自引用；最终 ID 仅在 Push 后控制台结果块输出。
