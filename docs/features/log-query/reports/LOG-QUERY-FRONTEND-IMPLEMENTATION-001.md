# 实现报告：LOG-QUERY-FRONTEND-IMPLEMENTATION-001

## 1. 任务结论与状态边界

| 维度 | 状态 |
|---|---|
| 任务编号 | `LOG-QUERY-FRONTEND-IMPLEMENTATION-001` |
| 工作分支 | `develop` |
| 授权基线 | `e78263bd00fde7cb495a355ec03b79157c1e0648` |
| 后端实现状态 | `IMPLEMENTED_ACCEPTED` |
| 前端实现状态 | `IMPLEMENTED_PENDING_REVIEW` |
| 功能整体状态 | `IN_PROGRESS` |
| 验收状态 | `NOT_RUN` |
| 菜单状态 | `VISIBLE`（人工当次指令覆盖提示词默认的 `HIDDEN_UNTIL_PHYSICAL_AND_PERFORMANCE_ACCEPTANCE`） |

前端“日志查询”页面已完成实现并本地验证通过（`vue-tsc --noEmit` 与 `vite build` 成功）。本任务只授权实现，不授权前端实现批准收口、整体功能验收、菜单开放、物理数据库设计或生产部署；以上事项等待 ChatGPT 从 GitHub 复审后再由人工推进。

> **菜单可见性人工指令覆盖：** 任务提示词默认要求“左侧菜单继续隐藏”（`HIDDEN_UNTIL_PHYSICAL_AND_PERFORMANCE_ACCEPTANCE`）。提交前发现 `menu.ts`/`Sidebar.vue` 存在既有未提交重叠内容，向人工报告后，人工当次明确指令为“不要隐藏菜单，全部展示出来”。据此本任务**不实施菜单隐藏**：日志查询菜单项按基线保持可见（无需修改 `menu.ts`/`Sidebar.vue`），路由 `/monitor/log-query` 直访仍然可用。本报告第 12 节与机器可读结果中的 `menu_status` 均按人工指令记为 `VISIBLE`。

## 2. Git 开始状态与既有工作区保护

任务开始前执行并记录：

```text
当前分支：develop
HEAD：e78263bd00fde7cb495a355ec03b79157c1e0648
暂存区：空
```

任务开始快照中已存在大量既有现场修改与未跟踪文件（`.claude/settings.local.json`、`agent-env.sh`、`frontend/index.html`、`frontend/src/config/menu.ts`、`frontend/src/layouts/HeaderBar.vue`、`MainLayout.vue`、`Sidebar.vue`、`frontend/src/stores/app.ts`、`frontend/src/styles/global.css`，以及仓库根目录与 `docs/**` 的多个未跟踪 Markdown/过程材料）。上述既有现场在本任务全程保持原样，未清理、未覆盖、未移动、未删除、未暂存、未提交。

任务全程未执行 `git reset`、`git checkout --`、`git restore`、`git clean`、`git stash`、rebase、merge、force push；未使用 `git add .`/`-A`/`--all`/`commit -a`。

**菜单重叠处理（重要）：** 任务提示词默认要求“最小日志查询菜单可见性调整”（隐藏菜单项）。提交前发现本任务需修改的 `frontend/src/config/menu.ts` 与 `frontend/src/layouts/Sidebar.vue` 在任务开始前已携带既有未提交内容（`menu.ts` 中的“数据同步统计大屏”菜单项与“故障监控”图标调整；`Sidebar.vue` 的视觉主题重构，且其依赖的 `global.css` 修改与新增 `theme.css` 等主题文件均未提交）。因 Git 按文件整体暂存，若纳入这两个文件会把任务外既有增量混入本提交，且侧栏主题依赖在干净检出下不完整。据此向人工报告后，人工当次明确指令为“不要隐藏菜单，全部展示出来”。最终处理：本任务**不实施菜单隐藏**，不修改、不暂存、不提交 `menu.ts` 与 `Sidebar.vue`，二者及其既有内容原样保留在工作区。除本次提交的本任务文件外，未暂存或提交任何其他既有现场文件。

## 3. 前端现状盘点与复用点

- 前端技术栈：Vue 3.4 + TypeScript（strict）+ Element Plus + Pinia + Axios + Vue Router 4 + Vite，路径别名 `@` → `frontend/src`。
- `package.json` scripts 仅含 `dev`、`build`、`preview`；`build` = `vue-tsc --noEmit && vite build`。仓库无独立 test、lint、type-check 脚本，无前端测试框架。
- HTTP 封装：`frontend/src/services/http.ts`，全局默认超时 10000ms，响应拦截器不拆包（返回 `res`），HTTP 错误统一 `ElMessage.error` 后 reject；业务错误以 HTTP 200 + `ApiResponse.code` 返回。
- 复用范式：查询区 `.query-area` 浅灰圆角 + `el-form :inline`；表格 `el-table size="small" border`；弹窗 `el-dialog width="800px" top="5vh" destroy-on-close`；`el-tooltip placement="top"`；复制使用 `navigator.clipboard` + `ElMessage`。日志查询全部遵循上述既有范式。
- 路由 `/monitor/log-query` 已存在并指向 `@/views/log-query/LogQueryPage.vue`（占位页），无需路由改动；占位页被替换为真实页面。
- 菜单定义在 `frontend/src/config/menu.ts`，`MenuItem` 无可见性字段；`Sidebar.vue` 渲染 `menuGroups` 且支持 `resolveIcon` 图标解析。日志查询项已存在于“运行监控”组。
- 五份批准基线、后端报告已完整阅读；已接受后端四个接口的请求/响应字段与 `API.md` 一致（核对项详见第 14 节）。

## 4. 实际新增/修改文件及用途

新增：

| 文件 | 用途 |
|---|---|
| `frontend/src/types/logQuery.ts` | 日志查询 API 类型（`LogListQuery`、`LogListResponse`、`LogListVO`、`LogDetailVO`、`RawMessageVO`、`DataSourceOptionsVO`、`LogType`）。`cdcLogId`/`offset` 全程字符串。 |
| `frontend/src/api/logQuery.ts` | 四个接口封装：`fetchDataSourceOptions`、`searchLogs`、`fetchLogDetail`、`fetchRawMessage`；全部使用请求级 `timeout: 30000`。 |
| `frontend/src/views/log-query/composables/useLogQueryTab.ts` | 每 Tab 独立状态机（表单、已生效条件、列表、游标栈、hasNext/nextCursor、loading/error/elapsed、initialQueryAttempted、请求令牌），以及时间格式化、当前自然日、业务/HTTP 错误文案等纯函数。 |
| `frontend/src/views/log-query/components/LogQueryFilter.vue` | 查询区：源库/目标库多选下拉（“全部”互斥）、源/目标表名输入、时间范围、逐字段校验提示、查询/重置、候选失败重试入口。 |
| `frontend/src/views/log-query/components/LogQueryTable.vue` | 12 列固定序列表格、固定左/右列、中间横向滚动、纵向滚动、加载遮罩/错误条/空数据态、行操作按钮。 |
| `frontend/src/views/log-query/components/CursorPagination.vue` | 仅“上一页/下一页”两个按钮，无任何页码/总数/页次。 |
| `frontend/src/views/log-query/components/LogDetailDialog.vue` | 日志详情弹窗：按需加载、字段展示、完整 LOG_DETAIL 纯文本、复制、独立 loading/error/retry、请求序号防过期响应。 |
| `frontend/src/views/log-query/components/RawMessageDialog.vue` | 原始消息弹窗：按需加载、JSON 检测、原文/格式化切换、复制原文、关闭清理、独立 loading/error/retry。 |
| `docs/features/log-query/reports/LOG-QUERY-FRONTEND-IMPLEMENTATION-001.md` | 本报告。 |

修改：

| 文件 | 用途 |
|---|---|
| `frontend/src/views/log-query/LogQueryPage.vue` | 占位页替换为真实页面：页面代次、双 Tab 独立状态、候选加载、弹窗编排、首次进入错误日志自动首查、正确日志首切首查。 |

> 菜单可见性：按人工指令不实施隐藏，`frontend/src/config/menu.ts`、`frontend/src/layouts/Sidebar.vue` 不在本任务修改/提交范围（见第 2 节）。

## 5. API 接入与 30 秒超时

- 接入已批准四接口：`GET /api/log-query/data-source-options`、`POST /api/log-query/logs/search`、`GET /api/log-query/logs/{logType}/{cdcLogId}/detail`、`GET /api/log-query/logs/{logType}/{cdcLogId}/raw-message`。
- 统一 `ApiResponse<T>`；成功判定 `code === 200`；`logType` 仅 `error`/`correct`；`cdcLogId`、`offset` 全程字符串处理，未转 JavaScript `Number`。
- 所有日志查询请求显式请求级 `timeout: 30000`（`frontend/src/api/logQuery.ts` 内 `REQUEST_TIMEOUT = 30000`），未修改 `http.ts` 全局 10 秒默认值，无自动重试。
- 业务错误码映射：`40015/40016` → “查询条件已变化或游标已失效，请重新查询第一页”；其余业务错误透出后端 `message`；HTTP/网络/超时错误 → 明确可操作文案（超时与网络失败区分）。
- 列表请求体只携带 `logType`、可选源/目标数组、可选源/目标表名、`startTime`、`endTime`、`cursor`；不含 `pageSize`、页码或 total；前端只提交包含端点的 `endTime`，不提交 `endExclusive`。

## 6. 双 Tab 独立状态机

- `useLogQueryTab(logType, getGeneration)` 为每 Tab 独立维护：`form`、`applied`、`items`、`requestCursorStack`、`hasNext`、`nextCursor`、`loading`、`error`、`validationError`、`initialQueryAttempted`、`elapsed`。
- 每 Tab 独立请求令牌 `requestToken`；页面级代次 `pageGeneration`（组件重挂载递增）。旧代次/旧令牌响应一律丢弃（先比较令牌再比较代次），防止旧响应覆盖新页面、另一 Tab 或已关闭弹窗。
- 表单修改不立即查询；仅“查询”成功后原子替换 `applied`、`items`、游标栈（`mode: 'query'` 与 `'initial'` 均重置栈为 `[null]`）；失败保留旧条件、旧列表、旧游标。
- 首次进入仅自动查询错误日志；正确日志第一次切换时才触发其首次查询（`initialQueryAttempted` 在触发后置 `true`，无论成败，切回已触发 Tab 不自动重试）。Tab 切换使用 `v-show` 保留两 Tab 的 DOM 与状态，互不覆盖。
- 不使用 LocalStorage、SessionStorage 或其他持久化；浏览器刷新/离开返回后两 Tab 状态全部失效并恢复默认错误日志首查。

## 7. 查询/重置与当前自然日规则

- 查询项顺序固定：源库、源表名、目标库、目标表名、同步到目标库时间范围、查询、重置；字段标签置于控件上方，全部 `size="small"`。
- 源库/目标库为 `el-select multiple filterable`，顶部固定“全部”选项；选择具体值时自动取消“全部”，选择“全部”时清空具体值（互斥），清空后恢复“全部”；“全部”哨兵 `__ALL__` 只存在于表单，提交时映射为不携带该数组条件。
- 候选显示 `org`，为 NULL/空串显示“未定义名称”，同名或空名称候选辅助显示 `DATA_SOURCE_ID`；候选加载失败只禁用下拉框并给出“重新加载”入口，不清除已生效列表。
- 源/目标表名精确文本输入，trim 后 ≤64 字符，超长在控件下方提示并禁止发起查询；不模糊、不转换大小写。
- 时间范围精确到秒、必填；默认当前自然日 `00:00:00`–`23:59:59`。前端校验完整性、顺序、`endTime + 1s - startTime ≤ 7×24h`。当前自然日在三个时点分别计算：首次进入页面（错误日志）、第一次打开正确日志 Tab、点击重置。
- “重置”只修改当前 Tab 表单（源/目标库恢复“全部”、表名清空、时间按点击时当前自然日重算），不查询、不清列表、不改游标、不切 Tab。
- 分页使用当前 Tab 已生效 `applied` 条件，不读取未生效表单。

## 8. 游标栈及失败原子性

- 固定每页 100 条（后端固定，前端无 pageSize 控件）；分页条只显示“上一页”“下一页”，不显示任何页码、页次、总数。
- 首页游标栈 `[null]`；下一页成功后压入当前页 `nextCursor`；上一页弹出栈顶后用新栈顶作请求游标，成功后整体替换为目标栈。
- 下一页失败不压栈、上一页失败不弹栈，当前页与旧数据保持不变。
- `hasNext=false` 时“下一页”禁用；栈长 `<=1` 时“上一页”禁用；加载期间两按钮禁用。

## 9. 12 列表格、固定列与滚动方案

- 严格 12 列固定顺序：源库、源表名、目标库、目标表名、指令类型、日志摘要、偏移量、采集时间、进入链路时间、同步到目标表时间、日志落盘时间、操作。
- 源库（160px）、源表名（220px）固定左侧；操作（190px）固定右侧；中间列横向滚动；表头不可点击排序。
- 列宽遵循 UI.md §10.2 基线（仅做像素级微调），四个时间列全部显示。
- 普通空值与缺失字段显示 `--`；数据源名、表名过长单行省略，Tooltip 显示完整信息（数据源 Tooltip 含名称与原始 ID）；日志摘要单行省略，不提供完整异常 Tooltip。
- 行 key 使用字符串 `cdcLogId`（`row-key="cdcLogId"`），不使用索引或数值化 ID。
- 页面高度布局：标题/Tab/查询区/分页条固定高度，表格区域 `flex:1; min-height:0` 占剩余高度，`el-table height="100%"` 表头固定、数据区内部纵向滚动；页面根高度 `calc(100vh - 120px)`，在支持分辨率下页面级不出现纵向滚动条，仅表格数据区一条纵向滚动条。
- 操作列提供“日志详情”“原始消息”，按 `hasLogDetail`/`hasRawMessage` 禁用并 Tooltip 提示“暂无日志详情”/“暂无原始消息”。

## 10. 详情/原始消息弹窗及纯文本安全

- 日志详情弹窗：标题“日志详情”，`width="800px"`、`top="5vh"`、`destroy-on-close`；点击后按需调用 detail 接口（不预取）；展示批准字段（CDC 日志 ID、源/目标库名称与 ID、源/目标表名、指令类型、结果码、Kafka 偏移量、四个时间字段、完整 LOG_DETAIL）；名称复用列表行；`RESULT_DETAIL` 不请求不展示；`RAW_MESSAGE` 不顺带请求；独立 loading/error/retry，不影响列表。
- 原始消息弹窗：独立 `el-dialog`，点击后按需调用 raw-message 接口；默认显示原文；合法 JSON 提供“原文/格式化”切换，非 JSON 不提供；复制按钮始终复制数据库原始内容；空字符串显示“暂无原始消息”；超长内容不截断、弹窗内滚动换行；关闭后清空前端持有的消息（`destroy-on-close` + 清空本地状态）。
- 全部日志与原始消息以纯文本展示（`<pre>` + `{{ }}` 插值），全程未使用 `v-html`。
- 两弹窗各自维护请求序号：关闭时递增作废在途响应；页面重挂载后旧实例响应不会重开已关闭弹窗或写入新实例。

## 11. 加载、慢提示、超时、错误与过期响应处理

- 列表查询/翻页期间保留旧列表，表格区域显示半透明遮罩、旋转图标与“正在查询错误日志/正确日志，请稍候”。
- 动态显示已等待秒数；超过 3 秒追加“查询耗时较长，请耐心等待”。
- 查询中当前 Tab 的表单、查询、重置、分页禁用，仍可切换 Tab；后台查询 Tab 标题旁显示小型 loading。
- 30 秒请求级超时结束 loading（`axios` timeout 触发 reject，`resolveHttpError` 给出超时文案）；计时器在请求成功/失败/失效后清理，不允许无限旋转。
- 无自动重试；失败/超时保留旧表单、旧已生效条件、旧列表、旧游标。
- 成功空数据显示“当前查询条件下暂无日志”；失败展示错误条（图标+文案），绝不以空数据态伪装。
- 弹窗错误只在弹窗内展示，不污染列表或其他 Tab。

## 12. 菜单可见性与路由直访

- 路由固定为 `/monitor/log-query`，直访可用（不依赖菜单）。
- 按人工当次指令“不要隐藏菜单，全部展示出来”，本任务不实施菜单隐藏：“日志查询”菜单项在 `menu.ts` 中按基线保持可见，`Sidebar.vue` 不做任何过滤，二者均未修改、未暂存、未提交（见第 2 节）。
- 未删除“日志查询”菜单定义，未改动任何其他菜单项或全局路由语义，未触碰菜单开放阻断链。

## 13. 测试、构建、静态检查及未执行项

- 前端测试：仓库无测试脚本与测试框架，如实记录 `frontend_test_status=NOT_AVAILABLE_IN_REPOSITORY`，未虚构测试通过。
- 类型检查/构建：`npm run build`（= `vue-tsc --noEmit && vite build`）成功，`vue-tsc` 无类型错误，产物正常产出。构建警告仅为本仓库既有的 chunk 体积提示，与本次改动无关。
- `git diff --check` 通过（无空白错误）。
- 静态检索确认：日志查询代码无 `v-html`；无 `pageSize`/`total`/页码/页次/`el-pagination`；无自动刷新/轮询/自动重试/导出/写操作；无表头排序；无 LocalStorage/SessionStorage 持久化；日志查询菜单按人工指令保持可见（未实施任何隐藏机制，`menu.ts`/`Sidebar.vue` 未改动，无 `hidden` 字段）。
- 开发服务器未启动，未进行浏览器视觉验收：本环境无法对页面进行浏览器渲染与人工 UI 验收，本报告不将任何视觉/交互人工验收写成 PASS。路由可加载性以 `vue-tsc` 类型校验与 `vite build` 成功编译为静态依据。
- 未执行：前端实现批准收口、整体功能验收、菜单开放、物理数据库设计与 DDL、生产部署。

## 14. 与五份批准基线和已接受后端的一致性

- 已批准基线 `REQUIREMENTS.md`、`API.md`、`DESIGN.md`、`UI.md`、`ACCEPTANCE.md` 均为 `APPROVED`，本任务未修改其中任何正文或状态，未修改任何 ACCEPTANCE 用例状态。
- 已接受后端接口实际请求/响应与 `API.md` 一致：四个接口路径、`ApiResponse<T>` 结构、`logType` 取值、`cdcLogId`/`offset` 字符串语义、`data-source-options` 的 `sourceList`/`targetList`（`id`/`org`）字段、列表固定 100 条与游标语义、业务错误码，均已按批准契约接入。
- 后端代码、后端测试、后端配置未做任何修改（`backend_change_status=NONE`）。
- 未连接或修改数据库、未执行 DDL、未确定最终分区/子分区/索引方案（`database_read_status=NONE`、`database_write_status=NONE`、`ddl_status=NONE`）。

## 15. Git 精确提交与推送证据

- 开始 HEAD：`e78263bd00fde7cb495a355ec03b79157c1e0648`
- 暂存清单（精确路径 `git add -- <path>`，未使用 `git add .`/`-A`/`--all`）：见第 4 节新增/修改文件；`menu.ts`/`Sidebar.vue` 未暂存。
- `git diff --cached --name-status`、`git diff --cached --check` 执行结果：通过；暂存区仅含本任务文件，无任务外文件。
- 提交信息：`feat(log-query): implement frontend query page`（含 `Co-Authored-By`）
- 推送：普通推送 `develop`，禁止 force。
- 推送后核对：本地 HEAD == `origin/develop`，ahead/behind `0 0`，任务文件无未提交残留，任务前既有工作区内容原样保留。
- 实际提交 ID、远程 `origin/develop` 提交 ID 与结束时 ahead/behind：以最终聊天报告 §17 机器可读结果块为准（`result_commit_id`、`remote_commit_id`、`ahead_behind`）。

## 16. 未修改范围与下一步

- 未修改：五份批准基线、后端代码/测试/配置、其他功能页面、其他菜单项、全局路由语义、`http.ts` 全局默认超时、`PlaceholderPage.vue`、`.claude/settings.json`、`.claude/skills/**`、`docs/baseline/` 六份正式项目级基线。
- `frontend/src/config/menu.ts` 与 `frontend/src/layouts/Sidebar.vue` 未修改、未暂存、未提交；二者在本任务开始前已存在的既有未提交增量（“数据同步统计大屏”菜单项与主题重构等）原样保留在工作区，未纳入本提交（见第 2 节）。
- 下一步（等待人工/ChatGPT 复审后推进，本任务不执行）：前端实现复审修订与批准收口、人工 UI 视觉验收、整体功能验收、菜单开放、物理数据库设计、生产部署。
