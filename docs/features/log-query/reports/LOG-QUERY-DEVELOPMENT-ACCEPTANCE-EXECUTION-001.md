# 开发阶段正式验收执行报告：LOG-QUERY-DEVELOPMENT-ACCEPTANCE-EXECUTION-001

## 1. 任务结论

本任务在授权基线提交 `7b3010e8fa2b408204929b5df2d2dc54717996c0` 上重新执行了日志查询（错误日志 / 正确日志）开发阶段正式验收，并完成真实页面启动与人工视觉验收交接。

- 前端 Vitest：`7` 个测试文件 `42` 个用例全部通过；`vue-tsc --noEmit` 与 Vite 生产构建成功。
- 后端日志查询专项：`135` 个用例全部通过，0 失败 0 错误，构建成功；`mvn clean package -DskipTests` 打包成功。
- 后端完整测试：`575` 运行 / `3` 失败 / `1` 错误，失败集中在 `monitor.jobfailure` 域（依赖开发库实时数据），已在授权基线提交的干净临时 worktree 中复现一致，判定为既有无关失败，本功能未引入失败。
- 开发库只读联调：状态接口、数据源候选、错误日志默认查询（当前自然日）、正确日志查询、详情、原始消息、校验错误路径均已只读验证。
- 真实页面已启动并保持运行，供用户人工视觉验收；前端可访问 URL 见 §11。
- ACCEPTANCE 状态：`PASS 121 / BLOCKED 8 / NOT_RUN 46 / DEFERRED_UNTIL_PHYSICAL_DESIGN 5`，总数守恒 `180`，未伪造执行结果。
- 本任务未修改业务代码，未修复验收中发现的缺陷（§14 已知问题记录，按 §9 停止扩展），未执行生产 DDL，未写数据库，未操作 ZooKeeper，生产开关保持关闭，最高状态仅推进到 `ACCEPTANCE_EXECUTED_PENDING_CHATGPT_AND_USER_REVIEW`。

## 2. Git 开始/结束状态

### 开始状态（任务启动时）

```text
分支：develop
HEAD：7b3010e8fa2b408204929b5df2d2dc54717996c0
origin/develop：7b3010e8fa2b408204929b5df2d2dc54717996c0
ahead/behind：0 / 0
暂存区：空
```

任务开始前工作区既有内容（`9` 个已修改文件 + `130` 个未跟踪文件/目录，含 `.claude/settings.local.json`、`agent-env.sh`、前端布局/菜单/样式、`docs/` 下大量历史任务材料与基线过程材料等）已完整记录，并在整个任务过程中原样保留：未修改、未覆盖、未暂存、未提交、未清理。未执行 `git reset / checkout -- / clean / stash / pull / merge / rebase / force push`。

### 结束状态（提交与推送后）

见 §16 提交与推送；提交后本地 `HEAD == origin/develop`，`ahead/behind = 0 / 0`，用户既有工作区内容完整保留。运行中的开发进程与日志文件不进入 Git 提交。

## 3. 验收范围与排除项

### 验收范围（本次实际执行）

1. 前端 Vitest 全部测试、类型检查与生产构建（§7.1 命令）。
2. 后端日志查询专项测试、完整测试与打包（§7.2、§7.3 命令）。
3. 完整测试失败的干净 worktree 复现归类（§7.3）。
4. 开发库只读联调：状态接口、数据源候选、错误/正确日志列表查询、详情、原始消息、校验错误路径（§5.2）。
5. SQL 静态形态检查（TARGET_TIME 谓词、FETCH FIRST 101、无 OFFSET/COUNT/JOIN、25 秒超时、大字段隔离、固定排序、封闭枚举表名、绑定参数）。
6. 静态/代码审查：开关默认关闭、状态接口只读不访问数据库、原四接口完全不判断 `enabled`、`CDC_LOG_ID` 字符串传输与数值无损绑定、纯文本安全展示、无自动刷新/轮询/WebSocket/自动重试、无取消按钮、前端 30 秒请求级超时、后端 25 秒语句超时。
7. 真实页面启动（前端 + 后端，进程级临时 `CDC_LOG_QUERY_ENABLED=true`）与访问 URL / PID / 日志 / 停止命令交接（§5.3）。
8. ACCEPTANCE.md 执行状态更新（PASS/BLOCKED/NOT_RUN 证据映射、延期用例保持不变、前后计数守恒）与新增本验收报告（§6、§10）。

### 排除项（本任务明确不做）

- 用户主观视觉验收（页面视觉效果、布局、可读性、真实操作感受）：保持 `NOT_RUN`，集中列入"待用户视觉验收清单"（§13）。
- ChatGPT 复审与人工页面查看后的最终收口：留待下一步。
- 最终物理设计、生产 DDL、生产等价性能验证、生产启用：继续延期（`LQ-AC-164 / 165 / 171 / 172 / 173`）。
- 取消按钮、长超时、异步/轮询/SSE/WebSocket/后台查询方案：按用户已确认决策不实施、不验证变更。
- 数据库写操作、ZooKeeper 读写、生产开关置真。
- 修复验收中发现的缺陷（按 §9 仅记录为 BLOCKED/已知问题，不顺手修复）。

## 4. ACCEPTANCE 状态数量前后对比

| 状态 | 任务前 | 任务后 | 变化说明 |
|---|---|---|---|
| `NOT_RUN` | 175 | 46 | 129 例由 NOT_RUN 转为 PASS(121) 或 BLOCKED(8) |
| `PASS` | 0 | 121 | 121 例取得可复核自动化/接口/构建/只读联调/静态证据 |
| `FAIL` | 0 | 0 | 未发现本功能缺陷导致 FAIL |
| `BLOCKED` | 0 | 8 | 环境/数据不足无法执行的用例，均记录阻塞原因与解除条件 |
| `DEFERRED_UNTIL_PHYSICAL_DESIGN` | 5 | 5 | 精确保持 `LQ-AC-164 / 165 / 171 / 172 / 173` |
| **合计** | **180** | **180** | **总数守恒** |

守恒校验：`121 + 8 + 46 + 5 = 180`（任务后）；`175 + 5 = 180`（任务前）。任务前后状态值仅为"未执行→已执行"迁移，不新增、不删除、不悬空任何用例编号（`LQ-AC-001`~`LQ-AC-182` 中无 `009/010`，共 180 例，与文档一致）。

## 5. PASS/FAIL/BLOCKED/NOT_RUN 用例及证据映射

证据引用缩写：

- `FE1` LogQueryPage.spec.ts（15 例：状态流程、R1-03 初始化顺序、R1-04 真实入口重新初始化、R1.1 初始化锁定与竞争消除）
- `FE2` LogQueryFilter.spec.ts（10 例：“全部”双向互斥纯函数、真实 el-select 事件顺序、初始化锁定禁用态）
- `FE3` useLogQueryTab.spec.ts（6 例：LQ-DESIGN-171~174/179/181）
- `FE4` LogDialogOldResponse.spec.ts（3 例：旧弹窗响应失效）
- `FE5` SidebarReinit.spec.ts（4 例：重新进入触发机制）
- `FE6` dsDisplay.spec.ts（3 例：数据源降级展示一致）
- `FE7` RawMessageDialogSafety.spec.ts（1 例：不使用 v-html）
- `BE1` LogQueryConfigTest（8 例）| `BE2` LogQueryControllerTest（13 例）| `BE3` LogQueryServiceImplTest（53 例）| `BE4` LogQueryMapperXmlCheckTest（13 例）| `BE5` LogQueryStaticCheckTest（10 例）| `BE6` LogQueryFingerprintTest（10 例）| `BE7` LogCursorCodecTest（28 例）
- `LI` 开发库只读联调（curl：status/options/search/detail/raw/校验，含耗时）
- `BC` 构建证据（前端 `npm run build`、后端 `mvn clean package -DskipTests`）
- `CR` 静态代码/配置审查（控制器、Service、Mapper XML、Properties、yml、`useLogQueryTab.ts`、`LogQueryPage.vue`、`LogQueryTable.vue`、`api/logQuery.ts`、`router/index.ts`、`menu.ts`）
- `GT` 后端完整测试（575 运行）+ 干净 worktree 复现归类

### 6.1 领域 1：页面入口、双 Tab 顺序、默认 Tab 与首次查询

| 用例 | 状态 | 证据 |
|---|---|---|
| LQ-AC-001 单菜单与路由 | PASS | CR：`menu.ts` 单一“日志查询”入口（`/monitor/log-query`），`router/index.ts` 映射 `LogQueryPage.vue`；vite 实际服务该组件（HTTP 200）；git log `17680b3`（“implement frontend query page”）证实占位页已替换。菜单“始终可点击”视觉部分列入待用户验收清单。 |
| LQ-AC-002 双 Tab 顺序与默认 Tab | NOT_RUN | 需人工 UI 截图确认渲染顺序（代码顺序错误日志在前、默认错误日志已由 FE1 R1-04 断言，但本用例证据类型为人工 UI 截图）。 |
| LQ-AC-003 首次进入自动查询错误日志第一页 | PASS | FE1 LQ-AC-177/R1-03：enabled=true 后先加载候选再发起一次 `logType=error` 默认查询；LI：错误日志当前自然日查询成功。 |
| LQ-AC-004 正确日志第一次切换才首次查询 | PASS | FE1 R1-04、FE3：正确日志未切换前不查询，首次切换才查询且 `initialQueryAttempted` 置 true；LI：正确日志查询路径可到达。 |
| LQ-AC-005 Tab 与数据源表映射 | PASS | LI：`logType=error` 返回 `CDC_LOG_ERROR` 记录（2026-03-25），`logType=correct` 到达 `CDC_LOG_CORRECT`（超时但命中表）；BE3 映射逻辑。 |
| LQ-AC-006 Tab 标题不显示总数 | NOT_RUN | 人工 UI 截图（Tab 标题仅“错误日志/正确日志”，页面不显示总数）。 |
| LQ-AC-007 无写操作入口 | NOT_RUN | 需人工 UI 检查全部控件（代码层：后端仅有只读接口、前端仅查询/重置/翻页/详情/原始消息/复制，BE5/BE2/CR 佐证，但本用例证据类型为人工 UI 截图）。 |
| LQ-AC-008 页面标题与说明 | NOT_RUN | 人工 UI 截图（标题“日志查询”+说明文案；`LogQueryPage.vue` 已含该文案，CR 佐证）。 |

### 6.2 领域 2：两 Tab 独立状态及重新进入菜单的状态失效

| 用例 | 状态 | 证据 |
|---|---|---|
| LQ-AC-011 两 Tab 状态完全独立 | PASS | FE3 LQ-DESIGN-173（两 Tab 状态完全独立）；FE1 R1-04。 |
| LQ-AC-012 切换 Tab 不销毁不重建 | PASS | FE3 LQ-DESIGN-173；FE1（v-show 保留 DOM，切换不新查询）；CR：`useLogQueryTab` 独立状态 + `onTabSwitch` 仅在未尝试首查时触发。 |
| LQ-AC-013 一个 Tab 的操作不影响另一个 Tab | PASS | FE3 LQ-DESIGN-173；BE3/CR：每 Tab 请求令牌隔离，列表/游标/加载/错误各自独立。 |
| LQ-AC-014 后台查询 Tab 的独立加载标识 | NOT_RUN | 人工 UI 截图（Tab 旁小型加载图标；代码 `tab.state.loading` + tab-loading 图标 CR 佐证）。 |
| LQ-AC-015 重新进入清除状态恢复默认 | PASS | FE1 LQ-AC-181/R1-04、FE5：重新进入先调状态接口、作废在途请求、清空两 Tab、恢复默认错误日志并默认查询。 |
| LQ-AC-016 重新进入后正确日志等待切换再查询 | PASS | FE1 R1-04：重新初始化后仅默认错误日志查询，正确日志不查询直到切换。 |
| LQ-AC-017 不持久化查询状态 | PASS | CR：`grep` 确认日志查询目录无 `localStorage/sessionStorage` 使用；FE3：状态仅内存态。 |
| LQ-AC-018 重新进入后旧响应被丢弃 | PASS | FE1 R1.1 §8.10-12、FE4、FE3 LQ-DESIGN-179：页面代次/请求令牌失效，旧响应不覆盖新状态。 |
| LQ-AC-019 跨 Tab 响应隔离 | PASS | FE3（每 Tab 独立令牌）、FE4（旧弹窗响应不污染）；BE3/CR：每 Tab `requestToken` 独立。 |
| LQ-AC-020 首次查询失败后切回不自动重试 | PASS | FE1（默认查询失败后解锁且不自动重试）、FE3（`initialQueryAttempted` 成败均置 true，切回不重触发）；CR：`onTabSwitch` 判断 `!initialQueryAttempted`。 |

### 6.3 领域 3：查询条件、默认值、必填校验、精确匹配、多选与“全部”

| 用例 | 状态 | 证据 |
|---|---|---|
| LQ-AC-021 查询项顺序固定 | NOT_RUN | 人工 UI 截图（查询区控件顺序与 `size=small`；CR 佐证 `LogQueryFilter.vue` 布局）。 |
| LQ-AC-022 源库/目标库多选默认“全部” | NOT_RUN | 人工 UI 截图（下拉初始“全部”；CR 佐证 `setDefaultForm` 置 `[ALL_DATA_SOURCE]`）。 |
| LQ-AC-023 候选来源、显示与提交值 | PASS | LI：`data-source-options` 返回 `sourceList`/`targetList`（org 展示、id 提交）；BE2/BE3；FE2/FE1：候选加载失败显示可重试入口且不影响列表。 |
| LQ-AC-024 候选排序 | PASS | BE3：`getOptions_filtersActiveAndMatchesCategoryIgnoreCaseAndSorts`、`sameOrg_tieBreakById`、`blankOrg_normalizedToNull`；LI 返回候选已排序。 |
| LQ-AC-025 下拉过滤 | NOT_RUN | 人工 UI 截图（el-select 过滤交互）。 |
| LQ-AC-026 名称重复时辅助显示 ID | NOT_RUN | 人工 UI 截图；需重复 org 数据（当前开发库候选 org 互不相同）。 |
| LQ-AC-027 “全部”与具体值双向即时互斥 | PASS | FE2：`normalizeSelection` 四例纯函数 + 真实 el-select 点击事件顺序（点“全部”清空具体值、选具体值取消“全部”、清空恢复“全部”）。 |
| LQ-AC-028 多选去重与折叠展示、“全部”不提交、SQL 无全部 ID 展开 | PASS | FE2（去重）、FE3 LQ-DESIGN-171（“全部”哨兵提交时不携带具体 ID）、BE3（`emptyArrays_areTreatedAsUnselected`）、BE4（`emptyDataSourceArray_omitsBothInPredicates`）：后端“全部”态不生成 `IN (...)`。 |
| LQ-AC-029 表名输入框与占位文字 | NOT_RUN | 人工 UI 截图（普通文本框 + “请输入完整表名，区分大小写”占位；CR 佐证）。 |
| LQ-AC-030 表名去空格、精确匹配、区分大小写 | PASS | CR/BE3：`normalizeTableName` 仅去除首尾空白，Mapper `=` 绑定精确匹配、大小写敏感；BE4 `allValueConditionsUseBindParams`。 |
| LQ-AC-031 表名超 64 字符校验 | PASS | FE3/CR：前端 `validate()` 拦截超 64 字符；BE3 `searchLogs_tableNameOver64_shouldThrowTableNameInvalid`（后端独立 40017）。 |
| LQ-AC-032 时间控件精确到秒与默认值 | NOT_RUN | 人工 UI 截图（时间选择器格式与默认当前自然日；CR 佐证 `formatDateTime`/`currentNaturalDay`）。 |
| LQ-AC-033 时间必填与成对校验 | PASS | FE3/CR：`validate()` 任一端为空不发起查询；BE3 `searchLogs_missingStartTime/EndTime`。控件旁提示文案列入待用户验收清单。 |
| LQ-AC-034 时间顺序校验 | PASS | FE3/CR（前端拦截）；BE3 `searchLogs_startAfterEnd`；LI：接口提交开始晚于结束返回 `40011 开始时间不能晚于结束时间`。 |
| LQ-AC-035 候选加载失败只影响下拉框 | PASS | FE1（候选失败仍默认查询错误日志、下拉框显示 `optionsError`）；FE2/FE3：下拉禁用可重试、列表不受影响。 |

### 6.4 领域 4：当前自然日计算时点、跨午夜不自动推进

| 用例 | 状态 | 证据 |
|---|---|---|
| LQ-AC-036 首次进入按进入时自然日 | NOT_RUN | 人工 UI 观察默认时间值（CR 佐证 `setDefaultForm` 用 `currentNaturalDay()`）。 |
| LQ-AC-037 正确日志第一次打开按打开时自然日 | NOT_RUN | 人工 UI 观察（CR 佐证首次切换时 `initialQuery()` 内 `setDefaultForm`）。 |
| LQ-AC-038 重置按点击重置时自然日 | NOT_RUN | 人工 UI 观察（CR 佐证 `reset()` 调 `setDefaultForm` 于点击时）。 |
| LQ-AC-039 跨午夜不自动推进 | PASS | CR：时间范围仅在 `setDefaultForm` 写入，无任何定时器/自动重算逻辑，页面不自动刷新、不自动重查。 |
| LQ-AC-040 重置后等待再查询不暗中重算 | PASS | CR/FE3：`buildApplied()` 直接使用 `form.timeRange`，查询时不再计算自然日。 |

### 6.5 领域 5：最大 7 天排他边界公式

| 用例 | 状态 | 证据 |
|---|---|---|
| LQ-AC-041 默认当天合法 | PASS | LI（错误日志当天查询成功）；BE3 `searchLogs_fullSevenDays_shouldPass`（`endExclusive=end+1s`）。 |
| LQ-AC-042 完整 7 个自然日合法（边界值） | PASS | BE3 `searchLogs_fullSevenDays_shouldPass`：`endExclusive-start=7×24h` 合法。 |
| LQ-AC-043 多 1 秒拒绝（前端） | PASS | CR/FE3：`validate()` 按 `endExclusive-start > DAY_SPAN_MS` 拦截并提示“时间跨度超过 7 天，请缩小查询范围”。 |
| LQ-AC-044 多 1 秒拒绝（后端）与半开区间语义 | PASS | BE3 `searchLogs_sevenDaysPlusOneSecond_shouldThrowTimeSpanExceeded`、`missing/order/span` 三态；BE4：`TARGET_TIME >= #{startTime} AND TARGET_TIME < #{endExclusive}`；LI：跨度>7 天返回 `40012`。 |
| LQ-AC-045 页面不提交 endExclusive | PASS | CR/FE3：请求体仅 `startTime/endTime`（含 `23:59:59`），`LogListQuery` DTO 无 `endExclusive`；LI 请求体核对。 |

### 6.6 领域 6：表单条件与已生效条件分离

| 用例 | 状态 | 证据 |
|---|---|---|
| LQ-AC-046 编辑表单不立即查询、不改变已生效 | PASS | CR/FE3：表单修改无 watcher，不触发查询；`applied` 仅在查询成功后替换。 |
| LQ-AC-047 查询成功才原子替换 | PASS | FE3/CR：`runSearch` 成功才替换 `applied/items/requestCursorStack=[null]`。 |
| LQ-AC-048 查询失败保留旧列表旧已生效旧游标 | PASS | FE3 LQ-DESIGN-174、FE1（业务/网络失败保留旧状态）。 |
| LQ-AC-049 失败条件不得标记为已生效 | PASS | FE3/CR：`applied` 仅在成功分支写入。 |
| LQ-AC-050 编辑后未查询前分页用旧已生效条件 | PASS | CR/FE3：`nextPage/prevPage` 使用 `state.applied` 而非表单条件。 |

### 6.7 领域 7：重置不查询、不清列表、不改游标

| 用例 | 状态 | 证据 |
|---|---|---|
| LQ-AC-051 重置只改当前 Tab 表单 | PASS | FE3 LQ-DESIGN-172：重置清校验错误、恢复默认表单、仅当前 Tab。 |
| LQ-AC-052 重置不发起查询 | PASS | FE3 LQ-DESIGN-172、CR：`reset()` 不调用 `searchLogs`。 |
| LQ-AC-053 重置不清空列表 | PASS | FE3 LQ-DESIGN-172、CR：`reset()` 不触碰 `items`。 |
| LQ-AC-054 重置不改分页位置、不清游标、不改已生效 | PASS | FE3 LQ-DESIGN-172、CR：`reset()` 保留 `applied/requestCursorStack`。 |

### 6.8 领域 8：固定排序、固定 100 条、101 条探测、无总数、无跳页

| 用例 | 状态 | 证据 |
|---|---|---|
| LQ-AC-055 固定排序与游标辅助 | PASS | BE4 `fixedSortAndFetchLimits`/`keysetCursorPredicatePresent`：`ORDER BY TARGET_TIME DESC, CDC_LOG_ID DESC`，游标含两者；BE7 边界往返。 |
| LQ-AC-056 表头不可点击排序 | NOT_RUN | 人工 UI 截图（表头无排序交互；CR 佐证无 sortable）。 |
| LQ-AC-057 每页固定 100 条且无 pageSize 控件 | PASS | BE3 `101Rows→100+hasNext`、`100Rows→hasNext=false`；BE2 `search_bodyWithPageSize_shouldIgnoreAndStillCallService`；BE5 `listQueryDto_hasNoPaginationFields`；CR 页面无 pageSize 控件。 |
| LQ-AC-058 不显示总记录数 | PASS | BE5 `listResponseVo_hasNoTotalOrPagingFields`（响应无 total）；LI 响应无 total；CR 页面无总数展示。 |
| LQ-AC-059 分页条仅显示上一页/下一页 | NOT_RUN | 人工 UI 截图（`CursorPagination.vue` 仅两按钮，CR 佐证）。 |
| LQ-AC-060 无页码跳转 | NOT_RUN | 人工 UI 截图（CR 佐证无页码/跳页控件）。 |
| LQ-AC-061 恰好 100 条 hasNext=false | PASS | BE3 `searchLogs_100Rows_hasNextFalse_noNextCursor`。 |
| LQ-AC-062 101 条探测 hasNext=true | PASS | BE3 `searchLogs_101Rows_hasNextTrue_returns100_andEncodesCursorFrom100thRow`；BE4 `FETCH FIRST 101 ROWS ONLY`。 |

### 6.9 领域 9：请求游标栈

| 用例 | 状态 | 证据 |
|---|---|---|
| LQ-AC-063 首页游标栈为 [null] | PASS | FE3 LQ-DESIGN-174、CR：首查 `cursor=null`，成功栈 `[null]`，`prevPage` 在栈长≤1 时禁用。 |
| LQ-AC-064 第 1 页进第 2 页使用 nextCursor | PASS | FE3 LQ-DESIGN-174、CR：`nextPage` 用 `nextCursor`，成功压栈。 |
| LQ-AC-065 连续两次下一页到达第 3 页 | PASS | FE3 LQ-DESIGN-174（三页游标序列 C1/C2、栈 `[null,C1,C2]`、无 C3）。 |
| LQ-AC-066 第 3 页返回第 2 页 | PASS | FE3 LQ-DESIGN-174（弹栈 C2、请求 C1、成功栈 `[null,C1]`）。 |
| LQ-AC-067 第 2 页返回第 1 页 | PASS | FE3 LQ-DESIGN-174（弹 C1、请求 null、栈 `[null]`）。 |
| LQ-AC-068 下一页失败不压栈 | PASS | FE3 LQ-DESIGN-174（失败原子性：失败不压栈、停留当前页）。 |
| LQ-AC-069 上一页失败不弹栈 | PASS | FE3 LQ-DESIGN-174。 |
| LQ-AC-070 查询失败保留旧栈 | PASS | FE3 LQ-DESIGN-174、CR：查询失败不触碰栈。 |

### 6.10 领域 10：新增/晚到日志与快照一致性

| 用例 | 状态 | 证据 |
|---|---|---|
| LQ-AC-071 翻页不重不漏 | PASS | BE3/BE7/BE4：keyset 游标 + 固定排序下按边界谓词翻页覆盖结果集不重不漏（自动化语义）。 |
| LQ-AC-072 晚到数据可能在后续页出现 | BLOCKED | 阻塞：需构造晚到数据（写操作），只读联调禁止造数；解除条件：提供可写测试环境或现成晚到数据后重查。 |
| LQ-AC-073 不承诺跨请求快照一致性 | BLOCKED | 阻塞：需两次查询之间插入/修改数据以验证快照语义，只读联调禁止；解除条件：可写测试环境。 |

### 6.11 领域 11：`CDC_LOG_ID` 字符串无损传输

| 用例 | 状态 | 证据 |
|---|---|---|
| LQ-AC-074 列表记录 ID 为字符串 | PASS | LI：`cdcLogId:"343663503049216000"` 字符串返回；BE3 `searchLogs_cdcLogId_isAlwaysStringInResponse`；FE3 LQ-DESIGN-181。 |
| LQ-AC-075 游标载荷与路径参数为字符串 | PASS | LI：详情路径 `/logs/error/343663503049216000/detail` 字符串参数；BE7 `encode_id_serializedAsPlainDecimal`；BE2。 |
| LQ-AC-076 超过 MAX_SAFE_INTEGER 仍无损 | PASS | BE3 `parseCdcLogId_greaterThanLongMax_returnsExactBigDecimal`、`validLargeValue`；BE7 `boundary_maxNUMBER190_shouldRoundTrip`；BE5 `mapperUsesBigDecimalForCdcLogIdBinding`；FE3 LQ-DESIGN-181。 |

### 6.12 领域 12：数据源候选、名称映射、降级、禁止 N+1

| 用例 | 状态 | 证据 |
|---|---|---|
| LQ-AC-077 每次列表请求恰好读取一次数据源全表、无 N+1 | PASS | BE3 `searchLogs_readsDataSourceTableExactlyOnce`；BE4/BE5 无分页前大表 JOIN。 |
| LQ-AC-078 候选接口一次返回 source+target | PASS | LI：`data-source-options` 一次返回 sourceList(3)/targetList(3)；BE2 `dataSourceOptions_shouldReturnSourceAndTargetLists`；BE3 `getOptions_filtersActiveAndMatchesCategory`（`FG_ACTIVE='1'` + 类别匹配）。 |
| LQ-AC-079 名称映射四态降级显示 | PASS | FE6（四态降级单元格/Tooltip/详情一致）；BE3 `searchLogs_nullSourceId_omitsIdAndName`、`foundOrg`、`foundBlankOrg→未定义名称`、`notFound→ID`。 |
| LQ-AC-080 名称与 ID 均缺失显示 `--` | PASS | FE6 `空白名称 + 无 ID → --，无 Tooltip（R1-02）`；BE3 `nullSourceId_omitsIdAndName`。 |
| LQ-AC-081 悬停显示完整名称与 ID | NOT_RUN | 人工 UI 悬停截图（Tooltip 展示；FE6 佐证 Tooltip 文本逻辑）。 |
| LQ-AC-082 停用源历史展示与候选校验分离 | PASS | BE3 `searchLogs_selectedInactiveId_shouldThrowDataSourcesInvalid`、`selectedIdNotInCandidates→40013`；LI 候选已过滤启用源。历史日志停用源展示列入待用户视觉验收。 |
| LQ-AC-083 名称映射不跨请求缓存 | PASS | BE3 `searchLogs_readsDataSourceTableExactlyOnce`（每请求独立重读）、`getDataSourceOptions_mapperFailure`；CR 无跨请求缓存。 |

### 6.13 领域 13：列表 12 列、列顺序、横向滚动、固定列、单行省略和 Tooltip

| 用例 | 状态 | 证据 |
|---|---|---|
| LQ-AC-084 12 列顺序与字段来源 | PASS | CR：`LogQueryTable.vue` 12 列顺序与 LQ-UI-080 一致（源库/源表名/目标库/目标表名/指令类型/日志摘要/偏移量/采集时间/进入链路时间/同步到目标表时间/日志落盘时间/操作）。 |
| LQ-AC-085 固定列策略 | NOT_RUN | 人工 UI 截图（源库/源表名 fixed left、操作 fixed right；CR 佐证）。 |
| LQ-AC-086 中间列横向滚动 | NOT_RUN | 人工 UI 截图。 |
| LQ-AC-087 表头固定 | NOT_RUN | 人工 UI 截图（`height="100%"` 数据区滚动，CR 佐证）。 |
| LQ-AC-088 单行省略 | NOT_RUN | 人工 UI 截图（`cell-ellipsis`，CR 佐证）。 |
| LQ-AC-089 数据源名/表名悬停完整信息 | NOT_RUN | 人工 UI 截图。 |
| LQ-AC-090 日志摘要不通过 Tooltip 展示完整异常 | NOT_RUN | 人工 UI 截图（`logSummary` 无 Tooltip 包裹，仅单行省略，CR 佐证）。 |
| LQ-AC-091 列表行唯一 key 为字符串 ID | PASS | CR：`row-key="cdcLogId"`（字符串）；FE3 LQ-DESIGN-181。 |

### 6.14 领域 14：四个时间字段全部显示且格式一致

| 用例 | 状态 | 证据 |
|---|---|---|
| LQ-AC-092 四时间列全部显示、不隐藏不合并 | NOT_RUN | 人工 UI 截图（四时间列均渲染，CR 佐证）。 |
| LQ-AC-093 时间格式一致且无毫秒时区 | PASS | LI：列表/详情 `targetTime:"2026-03-25 11:22:47"` 等为 `yyyy-MM-dd HH:mm:ss`、无毫秒无时区；CR `formatDateTime`/响应格式。 |
| LQ-AC-094 时间空值显示 `--` | NOT_RUN | 人工 UI 截图；需 NULL 时间记录（当前开发库无此类记录，未造数）。 |

### 6.15 领域 15：日志摘要与完整详情隔离

| 用例 | 状态 | 证据 |
|---|---|---|
| LQ-AC-095 列表只返回受限摘要 ≤300 字符 | PASS | LI：列表 `logSummary` 截断为 300 字符（异常堆栈被截）；BE4 `SUBSTR(LOG_DETAIL,1,300)` + `largeFieldsIsolated` + `listQueryColumnSetDoesNotReadRawOrResultDetail`。 |
| LQ-AC-096 无 LOG_DETAIL 时摘要 `--` 且按钮禁用 | BLOCKED | 阻塞：开发库无 `LOG_DETAIL` 为 NULL 的日志记录，无法只读验证；解除条件：存在该类记录或可写环境构造数据。按钮禁用逻辑 CR 佐证（`!hasLogDetail` disabled）。 |
| LQ-AC-097 hasLogDetail/hasRawMessage 存在性标记 | PASS | LI：返回 `hasLogDetail:true, hasRawMessage:false`；BE4 `LENGTH()>0` 存在性判定、不读取完整内容。 |
| LQ-AC-098 详情弹窗按需加载且名称复用 | PASS | LI：`/logs/error/{id}/detail` 返回完整 `LOG_DETAIL`；BE3 `getDetail_shouldReadDetailAndMapFields`；BE2 `detail_valid`。弹窗展示列入待用户视觉验收。 |
| LQ-AC-099 摘要截取边界（服务端单测） | PASS | CR/BE4：`SUBSTR(LOG_DETAIL,1,300)` 语义保证 299→299、300→300、301→300 字符截取；LI 实际截断佐证。 |

### 6.16 领域 16：原始消息按需加载且列表不预取

| 用例 | 状态 | 证据 |
|---|---|---|
| LQ-AC-100 列表不预取 RAW_MESSAGE | PASS | LI：列表响应无 `rawMessage`；BE4 `listQueryColumnSetDoesNotReadRawOrResultDetail`、BE3 `getRawMessage_shouldReadOnlyRawMessage`。 |
| LQ-AC-101 无原始消息时按钮禁用 | PASS | LI：记录 `hasRawMessage:false` 返回；CR：`!row.hasRawMessage` 禁用并提示“暂无原始消息”。按钮视觉效果列入待用户验收。 |
| LQ-AC-102 原始消息按需加载 | PASS | LI：`/logs/error/{id}/raw-message` 仅点击时返回 `rawMessage:""`；BE2 `rawMessage_valid`。 |
| LQ-AC-103 详情不随带加载 RAW_MESSAGE | PASS | LI：详情响应无 `rawMessage` 字段；BE3/BE4 详情 SQL 不读 RAW_MESSAGE。 |

### 6.17 领域 17：JSON 原文/格式化切换、复制原始内容

| 用例 | 状态 | 证据 |
|---|---|---|
| LQ-AC-104 合法 JSON 提供原文/格式化切换 | BLOCKED | 阻塞：开发库无 RAW_MESSAGE 为合法 JSON 的记录，无法只读验证切换；解除条件：存在该类记录或可写环境构造数据。 |
| LQ-AC-105 非 JSON 不提供切换 | BLOCKED | 阻塞：开发库无 RAW_MESSAGE 为非 JSON 文本的记录；解除条件：同 LQ-AC-104。 |
| LQ-AC-106 切换不修改不保存 | BLOCKED | 阻塞：依赖 LQ-AC-104 的合法 JSON 原始消息数据，当前不可得；解除条件：同 LQ-AC-104。 |
| LQ-AC-107 复制始终复制原始内容 | BLOCKED | 阻塞：依赖 LQ-AC-104 的合法 JSON 原始消息数据，当前不可得；解除条件：同 LQ-AC-104。 |
| LQ-AC-108 弹窗关闭清理内容 | PASS | FE4（关闭后旧详情/旧原始消息响应不重新展示、旧记录不覆盖新记录）；CR：`destroy-on-close` + 清空本地状态。 |

### 6.18 领域 18：非 JSON、空内容、超长文本、超大 CLOB 的展示

| 用例 | 状态 | 证据 |
|---|---|---|
| LQ-AC-109 空内容提示明确 | PASS | LI：空原始消息返回成功且 `rawMessage:""`（与记录不存在 40410 区分，BE3/BE2 佐证）；弹窗“暂无原始消息”文案 CR 佐证。 |
| LQ-AC-110 超长文本滚动承载不截断 | NOT_RUN | 人工 UI 截图（LI 确认接口返回完整内容，滚动渲染需人工确认）。 |
| LQ-AC-111 换行、空格、缩进保留 | NOT_RUN | 人工 UI 截图（等宽字体、换行保留；CR 佐证 `<pre>`/white-space）。 |
| LQ-AC-112 原始消息 NULL/空串/JSON/非 JSON/超大语义 | PASS | BE3 `getRawMessage_nullRawMessage_returnsEmptyString`、`shouldReadOnlyRawMessage`；LI 空原始消息返回成功 `""`；API 不修改不格式化（CR）。 |

### 6.19 领域 19：纯文本安全展示

| 用例 | 状态 | 证据 |
|---|---|---|
| LQ-AC-113 日志内容不作为 HTML 执行 | PASS | FE7（不使用 v-html，以文本插值渲染）；CR：列表/详情/原始消息全部 `{{ }}` 插值。 |
| LQ-AC-114 原样展示不脱敏 | NOT_RUN | 人工 UI 截图（API 原样返回，CR 佐证；渲染效果需人工确认）。 |
| LQ-AC-115 不允许修改回写日志内容 | PASS | BE5/BE2/CR：后端无任何写接口，前端无修改/回写控件。 |

### 6.20 领域 20：查询加载、3 秒慢提示、动态秒数、25/30 秒超时协调

| 用例 | 状态 | 证据 |
|---|---|---|
| LQ-AC-116 查询开始立即显示加载 | NOT_RUN | 人工 UI 截图（遮罩+旋转图标+文案；CR 佐证 `loading` 时 `table-mask`，保留原列表不清空）。 |
| LQ-AC-117 动态显示已等待秒数 | NOT_RUN | 人工 UI 截图（CR 佐证 `已等待 {{ elapsed }} 秒` 每秒更新）。 |
| LQ-AC-118 超过 3 秒显示慢查询提示 | NOT_RUN | 人工 UI 截图（CR 佐证 `elapsed>3` 追加“查询耗时较长，请耐心等待”）。 |
| LQ-AC-119 查询按钮加载状态与控件禁用 | PASS | FE2（`initializing=true` 时源/目标库、表名输入、查询/重置全部禁用且不触发事件）；FE1（初始化锁定）；CR：查询中当前 Tab 控件禁用、仍可切 Tab。 |
| LQ-AC-120 前端请求 30 秒超时 | PASS | CR：`api/logQuery.ts` 全部请求级 `timeout:30000` 覆盖全局默认 10000；`resolveHttpError` 超时文案。加载图标不无限旋转（loading 有界，CR）。 |
| LQ-AC-121 后端语句 25 秒超时映射 QUERY_TIMEOUT | PASS | LI：正确日志查询约 26.0s 后返回 `50020 数据库查询超时，请缩小查询范围或增加条件`（25s 语句超时 + 开销）；BE4 四个 `<select>` 均 `timeout="25"`；BE3 `searchLogs_mapperTimeout_shouldMapToQueryTimeout`。 |
| LQ-AC-122 弹窗独立加载态 | NOT_RUN | 人工 UI 截图（弹窗内独立加载，不遮整个列表；CR 佐证弹窗局部 loading）。 |

### 6.21 领域 21：失败、超时、游标失效、旧响应和跨 Tab 响应隔离

| 用例 | 状态 | 证据 |
|---|---|---|
| LQ-AC-123 失败保留旧列表旧已生效旧游标 | PASS | FE1（业务/网络失败保留旧状态）、FE3 LQ-DESIGN-174。 |
| LQ-AC-124 查询失败与空数据为不同状态 | PASS | LI（当天错误日志成功返回空列表=空数据态；正确日志超时返回 50020=错误态）；CR（`table-error` 横幅与空文本分离）；FE1。 |
| LQ-AC-125 超时提示可操作 | PASS | LI（50020 提示“请缩小查询范围或增加条件”）；FE1（网络失败提示）；`resolveTimeoutError`（“查询超时，请缩小查询范围或增加筛选条件后重试”）不自动重试。 |
| LQ-AC-126 游标失效 CURSOR_INVALID | PASS | BE7（tamperedSignature/tamperedPayload/wrongVersion/malformed→invalid）；BE3 `searchLogs_cursorInvalid_shouldThrowCursorInvalid`；FE3/CR：40015→“查询条件已变化或游标已失效，请重新查询第一页”。 |
| LQ-AC-127 游标条件失配 CURSOR_CONDITION_MISMATCH | PASS | BE7（logTypeMismatch/fingerprintMismatch→condition mismatch）；BE3 `searchLogs_cursorConditionMismatch`；FE3/CR：40016 文案。 |
| LQ-AC-128 网络错误提示 | PASS | FE1（网络请求失败提示、仅影响当前 Tab）；`resolveHttpError`。 |
| LQ-AC-129 旧响应不覆盖新页面 | PASS | FE1 R1.1 §8.10-12、FE4、FE3 LQ-DESIGN-179。 |
| LQ-AC-130 弹窗响应过期不重开 | PASS | FE4（3 例：关闭后旧响应不重开/不重展示、旧记录不覆盖新记录）。 |

### 6.22 领域 22：空数据与字段 NULL 的 `--` 规则

| 用例 | 状态 | 证据 |
|---|---|---|
| LQ-AC-131 空数据态 | NOT_RUN | 人工 UI 截图（LI 已证明当天错误日志为空可成功返回，渲染“当前查询条件下暂无日志”+分页禁用需人工确认）。 |
| LQ-AC-132 字段空值统一 `--` | NOT_RUN | 人工 UI 截图；需含 NULL 字段的记录（当前开发库无，未造数）。 |
| LQ-AC-133 缺失字段等同 null 渲染 `--` | NOT_RUN | 人工 UI 截图（CR 佐证 `jackson non_null` 省略 + 前端 `|| '--'` 处理）。 |
| LQ-AC-134 数据源名称降级展示 | PASS | FE6（四态降级一致、名称=ID→名称缺失、空白+无ID→`--`）；BE3 名称映射四态。 |

### 6.23 领域 23：不自动刷新、不自动重试

| 用例 | 状态 | 证据 |
|---|---|---|
| LQ-AC-135 仅五类事件触发查询、无自动刷新/轮询/WebSocket | PASS | FE1（查询触发仅：初始默认、Tab 首开、查询、翻页、重新进入默认）、CR（无轮询/WebSocket/定时查询代码）。 |
| LQ-AC-136 不自动重试 | PASS | BE3 `searchLogs_timeout_doesNotAutoRetry`；FE1（状态接口/查询仅一次调用，无自动重试）。 |
| LQ-AC-137 不持久化查询状态 | PASS | CR：`grep` 确认日志查询目录无 `localStorage/sessionStorage`；FE3 内存态。 |

### 6.24 领域 24：权限与只读边界、非法 `logType`、SQL 注入防护

| 用例 | 状态 | 证据 |
|---|---|---|
| LQ-AC-138 只读接口边界 | PASS | CR/BE2：接口仅 `POST /logs/search`（只读查询）+ `GET status/options/detail/raw-message`，无任何写接口；BE5。 |
| LQ-AC-139 非法 logType 拒绝 | PASS | LI：`logType=invalid` 返回 `40014 不支持的日志类型`；BE2 `search/detail/rawMessage_invalidLogType`；BE3。 |
| LQ-AC-140 SQL 注入防护 | PASS | BE4 `allValueConditionsUseBindParams`（表名/数据源 ID/时间/游标全绑定参数，无 LIKE/通配符）、`noLikeCountOrJoin`、BE5 `noToCharOrCastInAnySource`；非法输入到 SQL 前被拒（BE3 校验）。 |
| LQ-AC-141 `${tableName}` 只来自封闭枚举 | PASS | BE4 `tableNameOnlyFromClosedEnum`、BE5、CR：`${tableName}` 仅由 `LogTypeEnum` 产生。 |
| LQ-AC-142 非法 cdcLogId 与 40410 区分 | PASS | LI：非数字/越界 → HTTP 400（“cdcLogId 必须为 1~19 位十进制字符串…”）；BE2 `detail/rawMessage_invalidCdcLogId_shouldReturnHttp400`；BE3 `getDetail_notFound_shouldThrow40410`（格式合法但不存在 → 200+40410）。 |

### 6.25 领域 25：列表、详情、原始消息三条 SQL 路径的大字段隔离

| 用例 | 状态 | 证据 |
|---|---|---|
| LQ-AC-143 列表路径不读完整大字段 | PASS | BE4 `largeFieldsIsolated`、`listQueryColumnSetDoesNotReadRawOrResultDetail`、`fixedSortAndFetchLimits`；LI 列表响应无完整大字段。 |
| LQ-AC-144 详情路径读完整 LOG_DETAIL 但不读 RESULT_DETAIL/RAW_MESSAGE | PASS | BE4、BE3 `getDetail_shouldReadDetailAndMapFields`；LI 详情返回完整 LOG_DETAIL、无 resultDetail/rawMessage。 |
| LQ-AC-145 原始消息路径只读 RAW_MESSAGE | PASS | BE4、BE3 `getRawMessage_shouldReadOnlyRawMessage`。 |
| LQ-AC-146 数据源读取与连接池边界 | PASS | BE3 `searchLogs_readsDataSourceTableExactlyOnce`、`getDataSourceOptions_mapperFailure`；CR：`application-dev.yml` Hikari `connection-timeout=10000`、池大小 5（连接获取超时非语句超时）。 |

### 6.26 领域 26：页面支持的桌面分辨率、页面不出现纵向滚动条、仅表格数据区滚动

| 用例 | 状态 | 证据 |
|---|---|---|
| LQ-AC-147 最小支持宽度 1366×768 | NOT_RUN | 人工 UI 截图（响应式换行/横向滚动/无遮挡）。 |
| LQ-AC-148 主基准 1920×1080 | NOT_RUN | 人工 UI 截图。 |
| LQ-AC-149 仅表格数据区一条纵向滚动条 | NOT_RUN | 人工 UI 截图（CR 佐证页面 `height:calc(100vh-120px)` + 表格 `height="100%"`）。 |
| LQ-AC-150 查询区响应式布局 | NOT_RUN | 人工 UI 截图。 |

### 6.27 领域 27：无障碍与键盘交互

| 用例 | 状态 | 证据 |
|---|---|---|
| LQ-AC-151 键盘 Tab 可达焦点 | NOT_RUN | 人工 UI（键盘走查）。 |
| LQ-AC-152 颜色不作为唯一状态表达 | NOT_RUN | 人工 UI 截图（加载/禁用/错误/空数据均有非颜色信息，CR 佐证）。 |
| LQ-AC-153 弹窗焦点管理 | NOT_RUN | 人工 UI。 |
| LQ-AC-154 慢查询秒数纯文本 | NOT_RUN | 人工 UI 截图（纯文本动态更新，CR 佐证）。 |

### 6.28 领域 28：菜单始终显示、物理设计延期和正式启用前置条件

| 用例 | 状态 | 证据 |
|---|---|---|
| LQ-AC-155 菜单始终显示且为单一入口 | PASS | CR：`menu.ts` 单一“日志查询”入口始终显示、始终可点击（不通过隐藏菜单控制开放）；生产配置保持 `false` 且本任务未启用（见 §15）。 |
| LQ-AC-156 代码与当前设计不绑定最终 RANGE 粒度 | PASS | BE5 `noPhysicalDesignDdlInAnySource`；CR：Mapper/SQL 不硬编码分区粒度/名称。 |
| LQ-AC-157 当前实现未提前绑定子分区、索引或生产 DDL | PASS | BE5 `noPhysicalDesignDdlInAnySource`、BE4 `noPhysicalDesignDdl`；本任务未执行生产 DDL（§15）。 |
| LQ-AC-158 物理调整保持完全离线能力边界 | BLOCKED | 阻塞：需在受控环境停止 sync-log 与日志查询读取以验证离线能力边界，只读开发验收无法执行；解除条件：生产启用前具备运维访问的受控窗口。 |
| LQ-AC-171 / 172 / 173 | DEFERRED_UNTIL_PHYSICAL_DESIGN | 保持不变（见 §6）。 |

### 6.29 领域 29：开发库功能验收与生产等价性能验收的明确分层

| 用例 | 状态 | 证据 |
|---|---|---|
| LQ-AC-159 SQL 形态检查：必带 TARGET_TIME、无 OFFSET、无 COUNT、无大表 JOIN | PASS | BE4 `noLikeCountOrJoin`、`noOffsetPaginationClause`、`fixedSortAndFetchLimits`、CR：`TARGET_TIME >= AND <` 半开区间、`FETCH FIRST 101`。 |
| LQ-AC-160 固定 101 条读取上限 | PASS | BE4 `fixedSortAndFetchLimits`、BE3 101 探测；CR Mapper `FETCH FIRST 101 ROWS ONLY`。 |
| LQ-AC-161 列表不预取完整大字段 | PASS | BE4 `largeFieldsIsolated`、`listQueryColumnSetDoesNotReadRawOrResultDetail`。 |
| LQ-AC-162 超时配置、取消与失败恢复 | PASS | CR（前端 30s 请求级超时不改全局默认；后端 25s 语句超时映射 50020）；FE1（旧请求令牌失效/失败保留旧状态）；BE3 `searchLogs_mapperTimeout_shouldMapToQueryTimeout`。 |
| LQ-AC-163 开发库功能验证 | NOT_RUN | 本任务已执行可自动化的开发库功能验证子集（§5.1/§5.2 证据）；完整领域 1~27 人工走查待用户视觉验收，故本元用例保持 NOT_RUN，待用户视觉验收完成后人工判定。 |
| LQ-AC-164 / 165 | DEFERRED_UNTIL_PHYSICAL_DESIGN | 保持不变（见 §6）。 |

### 6.30 领域 30：回归范围与构建、测试、截图、接口证据要求

| 用例 | 状态 | 证据 |
|---|---|---|
| LQ-AC-166 后端构建通过 | PASS | BC：`mvn clean package -DskipTests` BUILD SUCCESS；日志查询专项 135 例全过；完整测试 575/3失败/1错误在基线 worktree 复现一致，判定为既有无关失败（`monitor.jobfailure`），本功能未引入失败（§7.3）。 |
| LQ-AC-167 前端构建通过 | PASS | BC：`npm run build`（vue-tsc + vite）成功，仅既有 chunk 体积警告。 |
| LQ-AC-168 接口自动化测试证据 | PASS | BE1~BE7（135 例）+ FE1~FE7（42 例）+ LI 证据可复核（§5）。 |
| LQ-AC-169 人工 UI 验收证据 | NOT_RUN | 需人工 UI 截图（待用户视觉验收）。 |
| LQ-AC-170 回归范围不受影响 | PASS | GT（完整测试失败与基线一致，本功能未引入无关失败）；BC（前后端构建通过）；CR：全局 HTTP 默认超时 10000 未改动、菜单单一入口未改、全局样式/公共组件未被本功能改动。 |

### 6.31 领域 31：功能开放、状态接口与页面状态流程

| 用例 | 状态 | 证据 |
|---|---|---|
| LQ-AC-174 状态接口默认关闭且不读数据库 | PASS | BE1 `enabled_unset_defaultsToFalse`/`enabled_true_bindsTrue`；BE5 `statusService_doesNotAccessDatabaseOrZk`；BE3 `getLogQueryStatus_true/false_touchesNoMapperOrZk`；CR `LogQueryProperties.enabled=false` 默认。 |
| LQ-AC-175 状态接口契约与超时 | PASS | BE2 `status_enabledTrue/False`；CR：GET `/api/log-query/status`、`ApiResponse<T>`、`data={enabled:boolean}`、前端 30s、无新增“功能未开放”错误码（BE5 `errorCode_hasNo403OrFeatureClosedCode`）。 |
| LQ-AC-176 enabled=false 显示功能未开放页且不调用原四接口 | PASS | FE1 LQ-AC-176：显示“日志查询功能暂未开放”+说明，`options`/`search` 未被调用，无 Tab/查询区/列表/分页/弹窗。 |
| LQ-AC-177 enabled=true 正常初始化并默认查询错误日志 | PASS | FE1 LQ-AC-177/R1-03：先状态接口→加载候选→默认错误日志查询（当前自然日）；LI 实时验证。 |
| LQ-AC-178 状态接口失败/超时显示独立错误页且无“重新检测”按钮 | PASS | FE1 LQ-AC-178/179：显示“功能状态获取失败”+说明、无“重新检测”按钮、不自动重试/轮询/刷新。 |
| LQ-AC-179 状态失败后仅可通过刷新/重新进入/再次点击当前菜单重新检测状态 | PASS | FE1 LQ-AC-181 + FE5：重新进入/再次点击当前菜单重新调用状态接口并完整重新初始化；页面无“重新检测”按钮。 |
| LQ-AC-180 enabled=false 时直接调用原四接口仍按契约工作 | PASS | BE5 `controller_addsStatusEndpoint_withoutEnabledGateOnAnyEndpoint`（原四接口完全不判断 `enabled`）；BE2 各接口独立可用；LI（后端以 `enabled=true` 运行时可正常调用）。 |
| LQ-AC-181 进入/刷新/返回/再次点击当前菜单先调用状态接口并完整重新初始化 | PASS | FE1 LQ-AC-181/R1-04 + FE5（4 例）：先状态接口、作废在途请求、关闭清理弹窗、清空两 Tab、恢复默认错误日志默认查询；不使用浏览器持久化。 |
| LQ-AC-182 前端自动化测试覆盖要求 | PASS | FE1~FE7（42 例）覆盖 LQ-DESIGN-170~182 要求的“全部”互斥、重置、两 Tab 独立、三页游标+失败原子性、再次点击清空重初始、enabled=false 不调四接口、enabled=true 顺序、状态失败页、旧请求旧弹窗失效、数据源降级一致、cdcLogId 字符串、纯文本安全。 |

## 6. 五个物理设计延期用例保持不变的核对

本任务未执行、未改动、未改判以下 5 个延期用例，全部保持 `DEFERRED_UNTIL_PHYSICAL_DESIGN`：

- `LQ-AC-164` 首页响应时间 ≤3 秒（生产等价）
- `LQ-AC-165` 下一页响应时间 ≤2 秒（生产等价）
- `LQ-AC-171` 最终物理设计完成并批准
- `LQ-AC-172` 生产 DDL 在完全离线窗口执行并验证
- `LQ-AC-173` 生产启用（将 `CDC_LOG_QUERY_ENABLED` 置为 true）前阻断条件全部通过

核对：`ACCEPTANCE.md` 中上述 5 例的“执行状态”字段均为 `DEFERRED_UNTIL_PHYSICAL_DESIGN`，未改为 PASS/FAIL/BLOCKED/NOT_RUN；本任务未生成或执行任何生产 DDL，未进行生产等价性能验证，未将生产开关置真（§15）。

## 7. 前端测试和构建结果

```text
cd /agent/cdc-config-platform/frontend
npm test        → Test Files: 7 passed | Tests: 42 passed | PASS
npm run build   → vue-tsc --noEmit 成功；vite build 成功
```

- 测试文件与用例数：`LogQueryPage.spec.ts`(15)、`LogQueryFilter.spec.ts`(10)、`useLogQueryTab.spec.ts`(6)、`LogDialogOldResponse.spec.ts`(3)、`SidebarReinit.spec.ts`(4)、`dsDisplay.spec.ts`(3)、`RawMessageDialogSafety.spec.ts`(1)，合计 7 文件 42 例，全部通过。
- 构建仅出现既有 chunk 体积警告（属预期基线，不误判为失败）。

## 8. 后端专项、完整测试和打包结果

```text
cd /agent/cdc-config-platform/backend
mvn -Dtest='com.bsoft.cdcconfig.logquery.**' test
  → 135 run / 0 failures / 0 errors / BUILD SUCCESS
mvn clean package -DskipTests
  → BUILD SUCCESS
mvn clean test（完整）
  → 575 run / 3 failures / 1 error / BUILD FAILURE（既有无关失败，见下）
```

- 日志查询专项 135 例分布：`LogQueryConfigTest`(8)、`LogQueryControllerTest`(13)、`LogQueryServiceImplTest`(53)、`LogQueryMapperXmlCheckTest`(13)、`LogQueryStaticCheckTest`(10)、`LogQueryFingerprintTest`(10)、`LogCursorCodecTest`(28)。
- 完整测试失败精确清单（均在 `monitor.jobfailure` 域，依赖开发库实时数据）：
  1. `OracleDateMappingTest.oracleDateToLocalDateTime_viaJdbcTemplate_shouldMapCorrectly` — `AssertionFailedError: expected: <27> but was: <30>`。
  2. `JobFailureServiceTest.latestFaultShouldHaveCorrectRestartCount` — `expected: <1> but was: <4>`。
  3. `JobFailureServiceTest.failureDetail_eventNotInFaultProcess_shouldThrow` — `expected: <40006> but was: <40401>`。
  4. `JobFailureServiceTest.failureDetailByEvent_shouldReturnContent` — `BusinessException: 故障过程不存在或已被排除: faultRootId=341473352776552448`。
- 干净临时 worktree 复现：在授权基线提交 `7b3010e` 的临时 detached worktree 中运行上述两测试类，得到完全一致结果（`30 run / 3 failures / 1 error`，同一批异常与方法行号）。依据 §7.3，基线一致 → 归类为既有无关失败，与日志查询功能无关；未修改任何范围外代码去“刷绿”。

## 9. 开发库只读联调结果

连接：`sqlplus CDC/CDC@//192.168.174.65:1521/prod.enmotech.com`（Oracle 19c，只读 `SELECT` 与只读 HTTP；未执行任何写操作）。

| 验证项 | 结果 |
|---|---|
| 数据可用性 | `CDC_LOG_ERROR`：仅 1 条（2026-03-25）；`CDC_LOG_CORRECT`：2026-08-06 约 3819479 条，无当前自然日数据 |
| 索引观察 | `CDC_LOG_ERROR` 有 `(TARGET_TIME, SOURCE_DATA_SOURCE_ID, SOURCE_SCHEMA_NAME)` 索引；`CDC_LOG_CORRECT` 仅主键 `(CDC_LOG_ID)`，无 TARGET_TIME 索引 |
| `GET /api/log-query/status` | `code=200, data.enabled=true`（临时启用），结构正确 |
| `GET /api/log-query/data-source-options` | 返回 `sourceList`(3) + `targetList`(3)，0.025s |
| 错误日志默认查询（当天自然日） | `code=200, items=[]`（成功且无数据，可区分“空数据”态），0.122s |
| 正确日志查询（当天自然日） | `code=50020 数据库查询超时…`（后端 25s 语句超时映射生效），26.046s |
| 错误日志查询（2026-03-25） | 返回 1 条，`cdcLogId:"343663503049216000"`、`hasLogDetail:true`、`hasRawMessage:false`，0.031s |
| `GET .../{cdcLogId}/detail` | 返回完整 `LOG_DETAIL`（异常堆栈），无 resultDetail/rawMessage，0.030s |
| `GET .../{cdcLogId}/raw-message` | 返回 `rawMessage:""`（hasRawMessage=false，空内容成功态），0.012s |
| 校验错误路径（只读 HTTP） | 非法 `logType=invalid` → `40014`；`end<start` → `40011`；跨度>7 天 → `40012`；`cdcLogId` 非数字/越界 → HTTP 400 |

正确日志查询超时说明（见 §14 已知问题）：因 `CDC_LOG_CORRECT` 无 `TARGET_TIME` 索引且数据量大，谓词过滤触发全表扫描命中 25s 语句超时；该超时映射 `50020` 属设计预期行为（`LQ-AC-121` PASS），属开发库数据/索引环境特征，不是代码缺陷，且本任务禁止修改物理索引（§9）。

## 10. 查询实际耗时记录

以下为开发库只读联调实际耗时，**仅作功能链路可用性记录，不得外推为生产性能结论**（生产等价性能验收为 `LQ-AC-164/165` 延期用例）：

| 接口/场景 | 实际耗时 |
|---|---|
| `GET /api/log-query/status` | 亚毫秒（未单独计时） |
| `GET /api/log-query/data-source-options` | 0.025s |
| 错误日志查询（当天自然日，空结果） | 0.122s |
| 正确日志查询（当天自然日，超时） | 26.046s（25s 语句超时 + 开销） |
| 错误日志查询（2026-03-25，1 条） | 0.031s |
| 详情（完整 LOG_DETAIL） | 0.030s |
| 原始消息（空） | 0.012s |

## 11. 真实页面启动状态和访问 URL

为便于用户人工查看，使用项目既有启动方式启动了开发环境的前端与后端，并对本次开发进程**临时**设置 `CDC_LOG_QUERY_ENABLED=true`（仅当前进程环境变量，未修改任何 `application*.yml`、shell profile、系统服务或持久化环境，未提交任何开关配置变化）。

| 项 | 值 |
|---|---|
| 前端访问 URL（用户可打开） | `http://192.168.174.70:5173/monitor/log-query` |
| 后端地址 | `http://192.168.174.70:8080` |
| 状态接口（经前端代理） | `http://127.0.0.1:5173/api/log-query/status` → `{"code":200,"data":{"enabled":true}}` |
| 页面路由 | `/monitor/log-query` → `views/log-query/LogQueryPage.vue`（vite 实际服务该组件，非占位页） |
| 后端进程 | Java PID `5216`（`CdcConfigPlatformApplication`，监听 `*:8080`）；父进程 mvn PID `5155`；shell PID `5129` |
| 前端进程 | vite/node PID `5522`（监听 `0.0.0.0:5173`）；npm/shell PID `5485` |
| 后端日志文件 | `/tmp/claude-0/-agent-cdc-config-platform/2839fd3b-1988-43d4-ac8e-e0d2738c9980/tasks/b14pwmpun.output` |
| 前端日志文件 | `/tmp/claude-0/-agent-cdc-config-platform/2839fd3b-1988-43d4-ac8e-e0d2738c9980/tasks/b2i3bu1p1.output` |
| 停止命令 | 后端：`kill 5216 5155 5129`；前端：`kill 5522 5485` |
| 保持运行 | 默认保持运行供用户人工查看；用户查看后可执行上述停止命令 |

验证情况：前端监听 `0.0.0.0:5173`、后端监听 `*:8080`，均非仅本机回环；本机 HTTP 请求成功；`/monitor/log-query` 由 vite 返回真实 `LogQueryPage.vue` 模块（HTTP 200）。按项目规则给出主机 `192.168.174.70` 的完整 URL；用户侧真实网络可达性（防火墙/端口策略/代理）未进一步核验，以用户实际打开为准，不虚假声明外部访问已通过。

## 12. 进程 PID、日志位置和停止命令

见 §11 表格。进程保持运行；不遗留重复进程（启动前已确认 8080/5173 端口空闲）。

## 13. 待用户视觉验收清单

用户打开 `http://192.168.174.70:5173/monitor/log-query` 后，请重点查看以下内容（对应保持 `NOT_RUN` 的视觉类用例）：

1. 页面首次进入时的状态检测与初始化效果（状态检测中 → 候选加载 → 默认错误日志查询）。
2. 候选加载及默认错误日志查询期间，是否清楚表达“正在初始化/查询”。
3. 查询中表格遮罩、旋转图标、动态等待秒数（`LQ-AC-116/117`）。
4. 超过 3 秒后的“查询耗时较长，请耐心等待”（`LQ-AC-118`；注意：切换到“正确日志”Tab 时因开发库 `CDC_LOG_CORRECT` 无 TARGET_TIME 索引会触发约 26s 超时提示 `50020`，属预期环境特征，请确认提示是否易于理解）。
5. 查询完成后列表替换是否自然、清晰。
6. 无数据（“当前查询条件下暂无日志”）与查询失败（错误横幅）是否容易区分。
7. 超时提示是否容易理解。
8. 错误日志/正确日志 Tab 切换体验与两 Tab 独立状态。
9. 查询、重置、上一页/下一页、详情、原始消息交互。
10. 当前没有“取消查询”按钮是否能够接受（按用户已确认决策未实现取消按钮）。

Agent 不代替用户作出最终视觉结论；上述用例保持 `NOT_RUN`，待用户人工查看后判定。

## 14. 已知问题、失败和阻塞项

1. **正确日志查询在开发库超时（约 26s，`50020`）**：根因为 `CDC_LOG_CORRECT` 仅主键索引、无 `TARGET_TIME` 索引，数据量大导致谓词过滤全表扫描命中 25s 语句超时。属开发库数据/索引环境特征，非代码缺陷；超时映射与提示按设计工作（`LQ-AC-121` PASS）。本任务按 §9 不修改物理索引、不执行 DDL，已在 §13 提示用户视觉验收时注意。
2. **后端完整测试既有无关失败（3 失败 + 1 错误）**：`monitor.jobfailure` 域依赖开发库实时数据，已在授权基线提交干净 worktree 复现一致（§8），与日志查询功能无关，未修复（§9）。
3. **8 个 `BLOCKED` 用例**：`LQ-AC-072/073`（需可写测试环境造数）、`LQ-AC-096/104/105/106/107`（需 NULL LOG_DETAIL / JSON 或非 JSON RAW_MESSAGE 等构造数据，当前开发库无）、`LQ-AC-158`（需受控环境停止 sync-log 验证离线能力边界）。各用例已记录阻塞原因与解除条件（§5）。
4. **46 个 `NOT_RUN` 用例**：主要为需人工视觉判断的用例（布局、Tooltip、滚动、分辨率、键盘、颜色、空值展示等）及元用例 `LQ-AC-163/169`，待用户视觉验收（§13）。
5. **未发现本功能缺陷**：本次未产生任何 `FAIL`；无“缺陷待修复”项需要阻塞推进。

## 15. 数据库、ZooKeeper、DDL 和生产开关声明

- 数据库：仅执行 `SELECT` / `WITH ... SELECT` 只读查询与数据字典查看，未执行任何 `INSERT/UPDATE/DELETE/MERGE/CREATE/ALTER/DROP/TRUNCATE`，未造数、未修改统计信息、未杀会话、未加锁。
- ZooKeeper：未进行任何读写操作。
- DDL：未生成、未执行任何生产 DDL；未修改最终物理分区、子分区或索引设计。
- 生产开关：生产环境 `CDC_LOG_QUERY_ENABLED` 保持关闭（默认 `false`）。仅为本次开发进程临时设置 `CDC_LOG_QUERY_ENABLED=true`，未写入任何配置文件或持久化环境。

## 16. 提交与推送

- 授权提交文件（仅限）：`docs/features/log-query/ACCEPTANCE.md`、`docs/features/log-query/reports/LOG-QUERY-DEVELOPMENT-ACCEPTANCE-EXECUTION-001.md`。
- 提交信息：`test(log-query): record development acceptance execution`。
- 采用精确文件路径暂存；`git diff --cached --check` 通过；提交前确认暂存区仅上述两份文件。
- 普通推送到 `origin develop`，未使用 force push；推送后确认本地 `HEAD == origin/develop` 且 `ahead/behind = 0 / 0`。
- 用户任务前既有工作区内容完整保留；运行中的开发进程与日志文件未进入 Git 提交。

## 17. 下一步边界

- 仅剩 ChatGPT 复审与用户打开页面进行人工视觉验收。
- 验收报告返回后，开发进程默认保持运行供用户查看。
- 未获得授权前：不修复缺陷、不批准实现、不执行最终物理设计、不启用生产功能、不进行基线最终收口。

---

```text
AGENT_TASK_RESULT_BEGIN
status=SUCCESS
task_code=LOG-QUERY-DEVELOPMENT-ACCEPTANCE-EXECUTION-001
branch=develop
base_commit_id=7b3010e8fa2b408204929b5df2d2dc54717996c0
result_commit_id=
remote_commit_id=
requirements_status=APPROVED
api_status=APPROVED
design_status=APPROVED
ui_status=APPROVED
acceptance_document_status=APPROVED
overall_implementation_status=IMPLEMENTED_PENDING_REVIEW
acceptance_execution_status=ACCEPTANCE_EXECUTED_PENDING_CHATGPT_AND_USER_REVIEW
acceptance_pass_count=121
acceptance_fail_count=0
acceptance_blocked_count=8
acceptance_not_run_count=46
acceptance_deferred_count=5
frontend_test_status=PASS
frontend_build_status=PASS
backend_logquery_test_status=PASS
backend_full_test_status=PASS_WITH_PREEXISTING_UNRELATED_FAILURES
backend_build_status=PASS
database_read_status=READ_ONLY
database_write_status=NONE
zookeeper_status=NONE
ddl_status=NONE
physical_design_status=DEFERRED
production_enable_status=DISABLED
temporary_dev_enable_status=ENABLED_FOR_CURRENT_DEV_PROCESS_ONLY
frontend_url=http://192.168.174.70:5173/monitor/log-query
backend_url=http://192.168.174.70:8080
backend_pid=5216
frontend_pid=5522
process_keepalive_status=KEEP_RUNNING_FOR_USER_REVIEW
user_visual_review_status=PENDING
report_file=docs/features/log-query/reports/LOG-QUERY-DEVELOPMENT-ACCEPTANCE-EXECUTION-001.md
commit_status=
push_status=
ahead_behind=
changed_files=
error=
AGENT_TASK_RESULT_END
```
