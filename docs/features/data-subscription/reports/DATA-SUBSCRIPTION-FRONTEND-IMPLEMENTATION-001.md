# 实现报告：DATA-SUBSCRIPTION-FRONTEND-IMPLEMENTATION-001

## 1. 任务结论与状态边界

| 维度 | 状态 |
|---|---|
| 任务编号 | `DATA-SUBSCRIPTION-FRONTEND-IMPLEMENTATION-001` |
| 工作分支 | `develop` |
| 授权基线 | `8041ba66f99e7e666d8ac80145aeeae18995cdfc` |
| 后端实现状态 | `APPROVED`（ChatGPT 正式代码复审 `APPROVED`；真实数据库集成验证 `APPROVED`） |
| 前端实现状态 | `IMPLEMENTED_PENDING_REVIEW` |
| 功能整体状态 | `IMPLEMENTED_PENDING_FRONTEND_REVIEW` |
| 验收状态 | `NOT_RUN`（126 条正式验收未执行） |

数据订阅前端已完成完整实现并通过本地自动化测试、前端构建、后端订阅回归与真实浏览器只读视觉联调。本任务只授权实现，不授权前端实现批准收口、正式验收或大屏调整；以上事项等待 ChatGPT 对前端实现结果提交进行正式代码与视觉复审后再由人工推进。

## 2. Git 开始状态与既有工作区保护

任务开始前执行并记录：

```text
当前分支：develop
HEAD：8041ba66f99e7e666d8ac80145aeeae18995cdfc
工作区：存在 114 项既有无关修改/未跟踪文件，本任务全程保持原样
```

任务开始快照中已存在大量既有现场修改与未跟踪文件（`.claude/settings.local.json`、`agent-env.sh`、`frontend/index.html`、`frontend/src/config/menu.ts`、`frontend/src/layouts/**`、`frontend/src/stores/app.ts`、`frontend/src/styles/global.css`、`docs/**` 多个未跟踪过程材料，以及 `docs/database/` 下 3 个已删除文件）。上述既有现场在本任务全程保持原样，未清理、未覆盖、未移动、未删除、未暂存、未提交。

任务全程未执行 `git reset`、`git checkout --`、`git restore`、`git clean`、`git stash`、rebase、merge、force push；未使用 `git add .`/`-A`/`--all`/`commit -a`。仅逐文件暂存本任务授权范围内的 18 个文件（16 个前端实现文件 + 本报告 + README 索引更新）。

## 3. 前端现状盘点与复用点

- 前端技术栈：Vue 3.4 + TypeScript（strict）+ Element Plus + Axios + Vue Router 4 + Vite + Vitest + @vue/test-utils。
- HTTP 封装：复用 `frontend/src/services/http.ts` 与项目统一 `ApiResponse<T>`，不新建另一套 HTTP 客户端；查询/详情/metadata 使用查询超时，保存/删除使用写请求超时，不修改全局 HTTP 默认值。
- 路由 `/config/subscribe`、路由名 `DataSubscribe`、菜单“数据订阅”均保持既有值不变，本任务不修改路由与菜单。
- 拖动模块复用既有 `frontend/src/views/data-source/draggableDialog.ts`（仅标题栏可拖、viewport 受限、重开居中已由该模块保证，本任务只做接线并测试调用）。
- 六份正式基线（REQUIREMENTS/ACCEPTANCE/DESIGN/API/UI/DATABASE）、后端实现报告与真实数据库集成测试报告已完整阅读；前端严格按其字段与语义对接。

## 4. 实际新增/修改文件及用途

新增：

| 文件 | 用途 |
|---|---|
| `frontend/src/api/subscription.ts` | 10 项订阅 API 封装（options/list/detail/schemas/tables/create/edit/update/delete-preview/delete），路径变量统一 `encodeURIComponent`，metadata 走 axios `params`，多选参数由 axios 序列化为重复参数形式 |
| `frontend/src/types/subscription.ts` | 订阅相关 VO/DTO 类型：列表、详情、options、schema/table 元数据、edit 回显、删除预览、`ValidationErrorsVO`、`PRESERVE\|REPLACE` 保存 DTO（不含任何并发令牌/指纹/快照版本字段） |
| `frontend/src/views/data-subscribe/DataSubscribePage.vue` | 列表页：源库/目标库多选查询、查询歧义警告 banner、表格（描述/源库/源表/目标库/更新时间/操作）、多源异常整行警示、新增/详情/编辑/删除弹窗编排 |
| `frontend/src/views/data-subscribe/components/SubscribeDetailDialog.vue` | 详情只读弹窗：描述、ID、源库、按 Schema 分组的表清单、不可解析片段警示、目标库、时间、warnings |
| `frontend/src/views/data-subscribe/components/SubscribeFormDialog.vue` | 新增/编辑共用近全屏可移动弹窗：顶部表单、中间固定摘要、左 Schema 右表格高容量源表选择器、异常/有限编辑 banner、脏关闭二次确认、40300 校验逐条展示 |
| `frontend/src/views/data-subscribe/components/SourceTableSelector.vue` | 左 Schema / 右表格选择器：自动加载、按 Schema 懒加载+会话缓存、搜索/全选/只看已选/清空当前 Schema、保留字符禁用、请求代际防串扰 |
| `frontend/src/views/data-subscribe/components/SubscribeDeleteDialog.vue` | 删除预览→确认弹窗：预览成功才显示确认、物理删除不可恢复提示、重启生效提示、40430 处理、防双击 |
| `frontend/src/views/data-subscribe/composables/useSubscribeForm.ts` | 表单模型/脏判断/PRESERVE/REPLACE 载荷计算的纯函数 composable（无 Element Plus/网络依赖，便于单元测试） |
| `frontend/src/views/data-subscribe/utils/subscriptionFormat.ts` | 源库四级搜索排序、关键字高亮分段、保留字符判定、机构名/ID 展示、选中摘要计数等纯函数 |
| 上述文件对应 `.spec.ts`（8 个测试文件） | 行为级自动化测试，覆盖提示词 §10 的 19 项最低要求 |

修改：

| 文件 | 用途 |
|---|---|
| `frontend/src/views/data-subscribe/DataSubscribePage.vue` | 由占位页替换为完整实现 |

## 5. API 接入与状态模型

- 10 项 API 全部封装并实际调用；路径变量 `encodeURIComponent`；metadata 的 `dataSourceId`/`schema` 通过 axios `params` 传递保持原始大小写。
- 列表读取 `data.items` 与 `data.queryWarnings`，不把 `data` 当数组；POST 成功读取 `data.dataSubId`，不按裸字符串处理。
- `40300` 的 `data.validationErrors` 建立唯一结构化类型 `ValidationErrorsVO` 并在弹窗内逐条展示。
- 多选参数：测试证明多个 `sourceIds`/`targetIds` 经 axios 生成后端可识别的重复参数，不序列化为单个 JSON 字符串或错误 CSV（`src/api/subscription.spec.ts`）。
- 全链路不定义、不传输 `versionToken`/指纹/快照版本/行锁等并发字段。

## 6. 列表页实现

- 查询区仅“源库”“目标库”两个多选下拉与“查询”“重置”按钮；候选来自 options，主文字为机构名，辅助显示数据源 ID；含逗号 ID 仍可选且展示歧义警告，不禁用不隐藏。
- 点击“查询”才更新已生效条件并请求；请求中按钮 loading 防重复点击；重置只清空表单，不请求、不改变上次列表与 `queryWarnings`；首次进入自动以空条件查询。
- 表格列顺序固定：订阅描述、源库、源表、目标库、更新时间、操作；不分页、无表头排序；不显示 `DATA_SUB_ID` 列。
- 源表显示“共 N 张”，Tooltip 内逐行展示 `Schema.表名`，不可解析 token 单独警示分区并限高内部滚动。
- 目标库紧凑 Tag，超过折叠阈值只展示前若干并显示 `+N`，点击展开/收起；Tooltip 展示全部机构名与 ID。
- 更新时间有 `UPDATE_TIME` 显示更新时间，否则回退 `INSERT_TIME` 并标记“创建时间”。
- 多源库异常整行警示色，显示“配置异常：该记录包含多个源库，请直接维护数据库”，操作列不渲染入口。
- 列表接口失败显示脱敏错误与重试，不清空用户已输入的查询表单。

## 7. 详情弹窗

- 正常记录点击“查看”打开居中只读弹窗；多源库异常无入口。
- 显示订阅描述、订阅 ID、源库机构名+ID、源表总数、目标库机构名+ID、创建时间、更新时间。
- 表清单按 Schema 分组、区域限高内部滚动；`rawUnparseableTables` 单独警示分区；数据源停用/不存在及其他 warnings 显示警告。
- 加载中/加载失败明确状态，失败可重试；不展示遗留并发字段。

## 8. 新增/编辑共用近全屏弹窗

- 尺寸 `94vw`，浏览器可视区约束，标题栏与底部操作区固定、中部自适应内部滚动；复用既有 `draggableDialog`（仅标题栏可拖、viewport 受限、每次打开居中、关闭后不记忆位置）。
- 顶部表单：描述必填 ≤255；源库为可搜索单选下拉，搜索 trim 后同时匹配 ID/机构，排序严格为 ID 完全匹配→ID 前缀→ID 模糊→机构模糊，ID 匹配不区分大小写，命中高亮，无结果提示“未找到匹配的源库”。
- 目标库紧凑复选卡片平铺，选中蓝框浅蓝背景+勾选，同时显示机构名与 ID；至少选一个。
- 固定摘要“已选择：X 个源库 · X 个 Schema · X 个表 · X 个目标库”，Schema 数只统计至少选一张表的 Schema。
- 维护候选 ID 含英文逗号或句点的源库/目标库仍显示但禁用，并解释协议保留字符原因。

## 9. 左 Schema/右表格高容量源表选择器

- 选择源库自动加载 Schema；点击 Schema 首次加载表并在弹窗会话内缓存，重复切换不重复请求。
- Schema 与表加载失败显示错误和“重试加载”；当前 Schema 内表名不区分大小写模糊搜索。
- 支持全选当前搜索结果、清除搜索、只看已选、清空当前 Schema（二次确认）；切换 Schema/搜索/只看已选时其他 Schema 与当前已选项始终保留。
- 已选表通过复选框与整行浅蓝背景体现，无重复状态列；Schema 行显示“已选 N 张”，当前 Schema 显示“共 N 张，已选 N 张”。
- 表头固定、内容区滚动；自动化测试覆盖 120/240 张规模下数量、选择与过滤正确。
- Schema/表名含英文逗号或组件内部英文句点时仍展示但禁用、灰显并说明原因。
- 切换源库：未选表直接换；已选表二次确认，取消恢复原源库与全部缓存/已选表，确认后清空 Schema、表缓存、当前 Schema、搜索条件与全部已选表再加载新源库；请求代际 `sourceGen`/`seq` 防止旧请求晚返回污染新源库状态。

## 10. 编辑特殊状态

- 编辑打开自动加载原记录全部已选 Schema 并回显选中表（`preloadSchemas`），不只加载第一个 Schema。
- 源库及源表集合相对基线未变时保存 `PRESERVE` 且不提交 `sourceTables`；任一变化时 `REPLACE` 并提交完整结构化 `sourceTables`；集合比较与顺序无关（`tableKey` 排序后逐项比较）。
- `invalidTables`、`rawUnparseableTables`、异常数据源均显示警告不静默取消；异常已选表回显勾选不丢失。
- `sourceReachable=false` 或 `sourceTableCheck=UNREACHABLE` 进入有限编辑：源库与源表控件禁用，只可修改描述与目标库，只允许 `PRESERVE`，并提示“当前使用已保存源表配置，未完成源库实时校验”。
- 多源库异常记录无编辑入口；不实现任何并发冲突提示。

## 11. 删除流程

- 点击删除先请求 delete-preview；预览成功后才显示确认。
- 确认内容含描述、源库、Schema 数、表数、目标库、物理删除不可恢复提示、重启相关 sync-client 后生效提示。
- 用户确认后调用 DELETE（无请求体）；成功刷新列表并只提示一次重启生效信息。
- `40430` 显示“记录不存在或已被删除”并刷新列表；预览/删除请求期间按钮 loading、防重复触发；多源库异常无删除入口。

## 12. 自动化测试结果

| 测试文件 | 用例数 | 结果 |
|---|---|---|
| `src/api/subscription.spec.ts` | 17 | PASS |
| `src/views/data-subscribe/utils/subscriptionFormat.spec.ts` | 20 | PASS |
| `src/views/data-subscribe/composables/useSubscribeForm.spec.ts` | 7 | PASS |
| `src/views/data-subscribe/components/SourceTableSelector.spec.ts` | 10 | PASS |
| `src/views/data-subscribe/components/SubscribeDetailDialog.spec.ts` | 4 | PASS |
| `src/views/data-subscribe/components/SubscribeDeleteDialog.spec.ts` | 7 | PASS |
| `src/views/data-subscribe/components/SubscribeFormDialog.spec.ts` | 15 | PASS |
| `src/views/data-subscribe/DataSubscribePage.spec.ts` | 11 | PASS |
| 数据订阅合计 | **91** | PASS |
| 前端全量 `npm test` | **326（23 个测试文件）** | PASS |

自动化测试为行为级（Vitest + Vue Test Utils），无真实数据库依赖；覆盖提示词 §10 的 19 项最低要求（API 封装与多选序列化、首次查询/点击查询/重置语义、列表状态、目标折叠、详情分组、源库四级搜索与高亮、目标卡片、Schema 懒加载与缓存与防串扰、全选/只看已选/清空、120/240 规模、新增必填与 REPLACE、编辑回显与 PRESERVE/REPLACE、有限编辑与异常源表、换源确认/取消、脏关闭二次确认、拖动接线、删除预览→确认→DELETE、loading/防重复与无并发字段、DOM 结构无最右侧面板）。

## 13. 构建与后端回归结果

| 验证项 | 结果 |
|---|---|
| 数据订阅前端定向测试 | PASS（91 用例） |
| 前端全量 `npm test` | PASS（326 用例 / 23 文件） |
| `npm run build`（`vue-tsc --noEmit && vite build`） | PASS |
| 后端数据订阅模块测试 | PASS（`SubscriptionServiceImplTest` 53 + `SourceMetadataServiceImplTest` 17 + `SubscriptionCsvHelperTest` 25 + `DataSourceTableParserTest` 11 = 106 用例） |
| `mvn clean package` | FAILED（4 个既有无关失败，见下） |
| `git diff --check` | PASS |

**后端 `mvn clean package` 失败说明（既有、无关、本任务不负责修复）：** 全量 `mvn clean package` 共 860 个测试，4 个失败/错误全部位于与本任务无关的既有模块，且为共享开发库数据漂移导致的集成测试失败，与本任务零关联：

- `com.bsoft.cdcconfig.monitor.jobfailure.compat.OracleDateMappingTest`（1 失败）：`@SpringBootTest` 直连真实 Oracle，`SELECT ... WHERE ROWNUM = 1` 断言首行 `FAILURE_TIME = 2026-07-27 19:17:24`，当前共享开发库首行日期已变化（`expected: <27> but was: <30>`），属数据漂移。
- `com.bsoft.cdcconfig.monitor.jobfailure.service.JobFailureServiceTest`（2 失败 + 1 错误）：`@SpringBootTest` 直连真实 Oracle，断言依赖硬编码 `EXISTING_EVENT_ID = 341473352776552448L` 及对应重启次数/错误码，当前共享开发库中该故障记录状态已变化（`expected: <1> but was: <4>`、`expected: <40006> but was: <40401>`、`故障过程不存在或已被排除: faultRootId=341473352776552448`）。

证据：`git status --short backend/` 为空（本任务零后端改动）；单独重跑 `JobFailureServiceTest` 结果与全量一致（非执行顺序污染）。按 CLAUDE.md §16.5 与任务授权范围（禁止修改后端业务/测试代码），本任务不修复上述失败，如实记录。本任务“证明前端未破坏后端”通过：后端文件零改动 + 数据订阅模块 106 用例全绿。

## 14. 浏览器视觉联调（只读）

- 启动已批准后端（`mvn spring-boot:run`，端口 8080）与本次前端（`npm run dev`，Vite，绑定 `0.0.0.0:5173`），Vite `/api` 代理至 `http://127.0.0.1:8080`。
- 使用真实浏览器（Playwright + 本机 Chrome）访问 `http://192.168.174.70:5173/config/subscribe` 完成只读联调：

| 检查项 | 结果 |
|---|---|
| 首次自动查询空条件列表渲染（孝感市第一人民医院、112-source-19c、共 9 张、目标 doirs库、+折叠） | PASS |
| 详情弹窗：描述、Schema 分组表、不可解析/警告区 | PASS |
| 新增弹窗：布局、固定摘要、源库搜索（输入 `112` 命中 `112-source-19c`）、选中源库、Schema 自动加载（`SPT_HIS_2023`）、目标卡片（3 张）、点击 Schema 加载 9 张表 | PASS |
| 脏表单关闭二次确认（“表单有未保存的修改”） | PASS |
| 编辑弹窗：打开即回显源库 `112-source-19c`、多 Schema 预加载、9 张已选表回显，无有限编辑 banner | PASS |
| 删除弹窗：预览展示描述/源库/Schema 数/表数/目标库、物理删除不可恢复提示、重启生效提示，未最终确认 | PASS |
| 浏览器控制台 | 无 console error / pageerror |

- 截图证据（**仅存 `/tmp`，未提交 Git**）：`/tmp/cdc_01_list.png`、`/tmp/cdc_02_detail.png`、`/tmp/cdc_03_create_form.png`、`/tmp/cdc_04_create_picked.png`、`/tmp/cdc_05_schema_tables.png`、`/tmp/cdc_06_dirty_confirm.png`、`/tmp/cdc_07_edit_echo.png`、`/tmp/cdc_08_delete_preview.png`（均为 1600×1000 PNG）。

### 服务运行信息

- 前端 Vite：PID `28157`，监听 `0.0.0.0:5173`；访问 URL `http://192.168.174.70:5173/config/subscribe`；停止命令 `kill 28157`（父进程 npm PID `28145`）。
- 后端 Spring Boot：PID `28205`，监听 `*:8080`；健康检查 `http://192.168.174.70:8080/api/health`；停止命令 `kill 28205`（mvn 包装进程 PID `28090/28091`）。
- 两服务保持运行供人工通过 Windows IDEA 验收；本任务未影响已有业务进程。

## 15. 数据库/ZooKeeper/外部操作状态

- 数据库访问：仅通过只读接口（列表/详情/metadata/delete-preview/edit 回显）执行 `SELECT` 级只读联调，`database_access_status=READ_ONLY`。
- `database_write_status=NONE`、`ddl_status=NONE`：本任务不对数据库执行任何新增/编辑/删除/DDL。
- `zookeeper_access_status=NONE`、`kafka_operation_status=NONE`、`sync_client_operation_status=NONE`。

## 16. 未执行项及原因

- 未执行前端实现批准收口、126 条正式验收（`NOT_RUN`）、大屏调整（`DEFERRED_AFTER_DATA_SUBSCRIPTION_FEATURE_ACCEPTANCE`）；等待 ChatGPT 对前端实现结果提交进行正式代码与视觉复审。
- 未执行真实 UI 写入闭环（新增/编辑/删除落库）；本任务视觉联调默认只读，写入闭环留给后续独立前后端联调/正式验收任务。
- 未修改 `docs/baseline/` 六份正式项目级基线、数据订阅六份已批准基线与数据库基线、后端业务/测试代码、路由/菜单/全局布局/全局样式/共享 HTTP 拦截器、大屏代码。
- 未添加任何新前端依赖。

## 17. 下一步

唯一下一入口：ChatGPT 对前端实现结果提交进行正式代码与视觉复审。复审前不得执行正式验收或大屏调整。
