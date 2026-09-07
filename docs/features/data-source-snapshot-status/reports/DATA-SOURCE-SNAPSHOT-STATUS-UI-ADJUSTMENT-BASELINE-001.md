# 验收前 UI 调整基线草案执行报告 DATA-SOURCE-SNAPSHOT-STATUS-UI-ADJUSTMENT-BASELINE-001

## 1. 任务信息

| 项目 | 值 |
|---|---|
| 任务编号 | `DATA-SOURCE-SNAPSHOT-STATUS-UI-ADJUSTMENT-BASELINE-001` |
| 任务类型 | `DOCUMENT_DRAFT_ADJUSTMENT`（纯文档、验收前 UI 调整基线草案建立；不实现、不批准、不执行验收） |
| Feature | 源库快照状态（slug `data-source-snapshot-status`） |
| 所属模块 | 运行监控 |
| 既有路由 | `/monitor/data-source-state`（保持既有值不变） |
| 前端源码目录 | `frontend/src/views/data-source-run-state/`（保持既有目录名不变） |
| 任务状态 | `COMPLETED`（调整草案建立并入库；草案未批准、未实现、未执行正式验收） |
| 驱动事实 | ChatGPT 对实现 R1 提交 `37825272c25c8a2d8a595ff0d5c25c6349186663` 代码复审结论 `CHANGES_REQUIRED`（表格长文本可读性、浏览器证据不足）；项目负责人随后提出更完整的 UI 调整 |
| 本任务授权基线提交（base） | `37825272c25c8a2d8a595ff0d5c25c6349186663`（本任务开始时 `origin/develop` 最新提交；本地 HEAD 与其一致，ahead/behind=0/0） |
| 执行分支 | `develop` |
| 本报告是否自引用本次结果提交 | 否（本报告不预填尚未产生的 result_commit_id；结果提交与推送结果见任务提交记录与本任务机器可读输出 `AGENT_TASK_RESULT`） |
| 旧批准基线 | 已批准需求/验收基线（正式批准版本 `DATA-SOURCE-SNAPSHOT-STATUS-REQUIREMENTS-BASELINE-APPROVAL-001`，批准内容基准提交 `4234af73db2190098f3dcd219319a4281fdabafd`，2026-09-05）与已批准设计基线（`DATA-SOURCE-SNAPSHOT-STATUS-DESIGN-BASELINE-APPROVAL-001`，批准内容基准提交 `61117a62f44d39f7c548ebcb650891abf91b9b8c`，2026-09-06）；两者保留为历史，批准旧基线不自动批准本轮调整草案 |

## 2. 任务范围与目标

在已批准需求/验收/设计基线之上，把项目负责人已确认的 UI 调整规则（任务提示词 §5）落地为**纯文档调整草案**，形成可复审、可审阅的 REQUIREMENTS/ACCEPTANCE/DESIGN/UI 调整版与同步后的两个 README。本任务：

- **只调整展示内容/Tooltip/刷新布局/busy 视觉状态相关设计**；不改变接口、SQL、表结构、数据库访问与产品只读边界（`API.md`/`DATABASE.md` 整文件零差异）。
- 在 `REQUIREMENTS.md` 就地定向修订受影响的既有需求行（`DSS-REQ-028/029/050`）并从 `DSS-REQ-066` 起连续新增 `DSS-REQ-066~071`；在 `ACCEPTANCE.md` 就地定向修订受影响的既有用例（`DSS-AC-026/027/068`）并从 `DSS-AC-069` 起连续新增 `DSS-AC-069~080`。
- 在 `DESIGN.md` 新增 `§19 本轮 UI 调整草案设计记录`（19.1~19.8），在 `UI.md` 新增 `§13 本轮 UI 调整草案`（13.1~13.8）并就地修订旧展示陈述。
- 需求由 65 条扩至 71 条（`DSS-REQ-001~071`）；验收由 68 条扩至 80 条（`DSS-AC-001~080`），全部保持 `NOT_RUN`。
- 明确旧批准基线保留为历史，批准旧基线不自动批准本轮调整草案；下一入口为 ChatGPT 对本调整草案正式复审（不是直接实现）。

## 3. 环境与前置检查

| 检查项 | 结果 |
|---|---|
| 当前目录 | `/agent/cdc-config-platform`（Git 仓库） |
| 当前分支 | `develop` |
| 本任务开始前 Commit ID | `37825272c25c8a2d8a595ff0d5c25c6349186663` |
| `origin/develop` | `37825272c25c8a2d8a595ff0d5c25c6349186663` |
| `git ls-remote origin refs/heads/develop` | `37825272c25c8a2d8a595ff0d5c25c6349186663` |
| ahead/behind | `0/0`（本地 HEAD 与 `origin/develop` 一致，无分叉，可安全快进） |
| 与本任务无关的既有工作区修改 | 存在大量用户既有未提交内容（前端布局/菜单/大屏等）；保持原样，未清理、未覆盖、未暂存、未提交，未使用任何破坏性 Git 命令 |
| 环境预检 | 纯文档任务；不要求后端/前端/数据库/ZooKeeper 环境启动（验证矩阵 `NOT_APPLICABLE`） |

## 4. 允许修改范围（白名单，7 个文件）

1. `docs/features/data-source-snapshot-status/REQUIREMENTS.md`（修改）
2. `docs/features/data-source-snapshot-status/ACCEPTANCE.md`（修改）
3. `docs/features/data-source-snapshot-status/DESIGN.md`（修改）
4. `docs/features/data-source-snapshot-status/UI.md`（修改）
5. `docs/features/data-source-snapshot-status/README.md`（修改）
6. `docs/features/README.md`（修改）
7. `docs/features/data-source-snapshot-status/reports/DATA-SOURCE-SNAPSHOT-STATUS-UI-ADJUSTMENT-BASELINE-001.md`（新增，本文件）

`API.md`、`DATABASE.md` 必须整文件零差异；所有源代码、测试代码、配置、图片和既有证据必须零修改。

## 5. 本轮调整规则逐项落点

本轮规则以任务提示词 §5 的文字规则为唯一调整权威（负责人提供的“数据同步进度”图片是 ChatGPT 生成的目标效果图，并非当前 Git 实现截图；本任务不把 `topic-offset` 代码误认为已落地模板，也不修改 `topic-offset`）。

### 5.1 页面总体结构：三块清晰分区（U§13.2、D§19.2）

页面形成三个有明显视觉分隔的区域：① 页面标题与功能说明语义区（标题“源库快照状态”＋功能说明，保持只读语义）；② 独立查询卡片（探针端/源库/快照状态三多选＋查询/重置，独立白色容器/边框/圆角/间距，沿用现有设计令牌）；③ 独立结果卡片（头部为结果摘要与刷新工具栏，主体为七列表格）。本 Feature 最多约 100 行，继续不分页。

### 5.2 结果卡片头部（U§13.2/§13.3、D§19.2/§19.3）

- 左摘要：`共 {records.length} 条`；未知状态数>0 时追加轻量橙色 `其中 {unknownCount} 条未知状态`（仅统计 `statusCategory=UNKNOWN`），为 0 时不显示。
- 右侧不可拆散刷新逻辑组：灰色状态圆点（正在刷新蓝色动态，文字仍是主要信息载体）＋`60 秒自动刷新`＋分隔符＋`最近成功刷新：HH:mm:ss`（从未成功 `--`）＋“立即刷新”按钮，整体右对齐；宽度不足整组换行，不得只把按钮挤到下一行。
- “立即刷新”稳定宽度，加载图标出现/消失不移动按钮、前方文案或最近刷新时间；失败提示放在稳定槽位，出现/消失不造成工具栏明显水平跳动。

### 5.3 七列固定列宽与文本内容（U§13.4、D§19.4；修订 REQ-028/029）

列宽：序号 `70px`（居中）、探针端 `170px`（左对齐单行）、源库 `280px`（左对齐单行，明显宽于探针端）、快照状态 `130px`（居中）、三时间各 `165px`（`YYYY-MM-DD HH:mm:ss`，空值 `--`）。时间列宽固定，避免平均分配多余空间；必要时表格容器横向滚动，不换行挤压。

- 探针端列：表格内只显示原始 `CLIENT_ID`，不再把 `CLIENT_DESC` 同行/次行展示；超出列宽单行省略号；悬停 Tooltip 显示完整 `CLIENT_DESC`，描述为空时不弹空 Tooltip。
- 探针配置缺失仍显示原始 `CLIENT_ID`；Tooltip/异常提示表达“探针端配置缺失”；停用配置保留轻量异常说明。
- 源库列：正常关联且 `ORG` 非空时只显示 `DATA_SOURCE_ORG`，超出列宽单行省略号；悬停 Tooltip 显示完整 `DATA_SOURCE_ORG`，不再以原始 `DATA_SOURCE_ID` 作为正常行 Tooltip 默认内容。
- 源库配置缺失或 `ORG` 为空：回退显示原始 `DATA_SOURCE_ID`，不得空白；Tooltip 显示完整原始 ID 及对应异常说明。停用、类别非 SOURCE 等既有轻量异常语义保留。
- 不改变状态排序、时间排序、状态映射、序号规则、行键、空值规则和“不补行”边界。

### 5.4 页面级单实例受控 Tooltip（U§13.5、D§19.5；修订 REQ-050）

页面任意时刻最多显示 1 个 Tooltip，覆盖探针端描述、完整源库 ORG、未知状态原始值、缺失/停用/类别异常图标说明。状态模型采用页面级受控当前 Tooltip：`currentTooltip = { key, content, anchor, placement } | null`，单一 Tooltip Host。要求：

- 快速扫过多行时，新触发项出现前立即关闭旧 Tooltip，不允许同时残留多个；
- 离开触发区、表格数据替换、滚动、窗口缩放、页面隐藏或卸载时关闭；
- Tooltip 不可交互（pointer-events none），避免鼠标进入 Tooltip 后遗留；
- 统一短暂显示延迟约 300~350ms、即时关闭；不依赖多实例各自延迟；
- 表格中不混用原生 `title`；Tooltip 优先单行，极端超宽允许换行以全文可读且不越界；对视口四边边界避让，不被表格容器裁切。

### 5.5 查询与刷新按钮的 busy 视觉隔离（U§13.6、D§19.6；修订 REQ-050）

- 单飞行、忙碌抑制、不并发、不排队、不补发等既有业务规则保持不变。
- 只有真正发起当前请求的操作呈现对应加载反馈：手工立即刷新仅“立即刷新”显示加载反馈；条件查询不使“立即刷新”产生虚假加载反馈。
- 手工/自动/恢复可见刷新在途时，“查询”仍不可发起请求，但文字/颜色/尺寸/位置不闪动；同时阻止鼠标与键盘触发并提供正确 `aria-disabled`。
- 查询或其它请求在途时“立即刷新”不可发起第二个请求；非发起按钮不得表现得像被点击。
- 后续实现应证明点击“立即刷新”时网络层只有一次按当前已应用条件发出的刷新请求。

### 5.6 未来列表页模板边界（本轮不落地）

本任务只调整本 Feature 草案，不创建项目级模板文档，不修改“数据同步进度”或其他页面，不提前抽取公共组件。实现、代码复审、负责人目测通过后再另立任务提炼为项目级列表页 UI 标准。

## 6. 需求/验收新计数与追踪

| 项 | 值 |
|---|---|
| requirements_status | `DRAFT_ADJUSTMENT_PENDING_USER_REVIEW`（当前调整版本） |
| acceptance_status | `DRAFT_ADJUSTMENT_PENDING_USER_REVIEW`（当前调整版本） |
| requirements_count | `71`（`DSS-REQ-001~071`；既有批准 `DSS-REQ-001~065` 65 条 + 本轮新增 `DSS-REQ-066~071` 6 条；就地修订 `DSS-REQ-028/029/050`） |
| acceptance_count | `80`（`DSS-AC-001~080`；既有批准 `DSS-AC-001~068` 68 条 + 本轮新增 `DSS-AC-069~080` 12 条；就地修订 `DSS-AC-026/027/068`） |
| acceptance_not_run_count | `80`（全部 `NOT_RUN`） |
| traceability_status | `COMPLETE`（需求→设计落点矩阵 71/71、验收→设计落点矩阵 80/80；反向引用无悬空，自检通过） |
| pending_user_review | `YES` |
| pending_user_confirmation_count | `0` |

六份受影响文档（REQUIREMENTS/ACCEPTANCE/DESIGN/UI/Feature README/Feature 总索引）的状态、计数、下一入口保持一致的调整草案口径。

## 7. 状态迁移与旧批准历史保留

本轮统一迁移为（任务提示词 §4.6）：

- requirements/acceptance/UI/DESIGN 当前调整版本：`DRAFT_ADJUSTMENT_PENDING_USER_REVIEW`
- implementation：`IMPLEMENTED_ADJUSTMENT_PENDING`（旧实现 `DATA-SOURCE-SNAPSHOT-STATUS-IMPLEMENTATION-001`/`-R1` 已存在，但本轮调整尚未实现）
- formal acceptance：`NOT_RUN`
- human visual acceptance：`NOT_RUN`
- pending_user_review：`YES`
- pending_user_confirmation_count：`0`

旧批准基线（需求/验收批准版 `...REQUIREMENTS-BASELINE-APPROVAL-001`、设计批准版 `...DESIGN-BASELINE-APPROVAL-001`）保留为历史；批准旧基线不自动批准本轮调整草案。本轮调整草案须经 ChatGPT 对本调整基线草案正式复审 `APPROVED` 且项目负责人明确回复“批准”后方能成为新基线。

## 8. API/DATABASE/代码零差异证明

| 对象 | 结果 |
|---|---|
| `docs/features/data-source-snapshot-status/API.md` | 整文件零差异（未修改；git diff 核验为空） |
| `docs/features/data-source-snapshot-status/DATABASE.md` | 整文件零差异（未修改；git diff 核验为空） |
| 后端源码/测试/配置 | 零修改（无相关文件进入提交） |
| 前端源码/测试/配置/图片/既有证据 | 零修改（不修改 `topic-offset` 等 `.vue` 参考文件；无相关文件进入提交） |
| 历史报告与历史批准记录 | 未删除、未覆盖、未改写（白名单外一律不纳入提交） |

## 9. 未执行事项

- 未实现或修改任何前后端代码、测试、依赖、构建配置、SQL/XML 或静态资源；本轮调整尚未实现（`implementation_status=IMPLEMENTED_ADJUSTMENT_PENDING`）。
- 未批准调整草案（requirements/acceptance/design/UI 当前调整版本均保持 `DRAFT_ADJUSTMENT_PENDING_USER_REVIEW`）；未把草案写成 `APPROVED`/`PASS`/`ACCEPTED`/`IMPLEMENTED_ACCEPTED`。
- 未执行任何正式验收或人工页面验收（全部 `DSS-AC-001~080` 保持 `NOT_RUN`）。
- 未访问或操作数据库，未执行任何 SELECT/DML/DDL；未操作 ZooKeeper、Kafka、sync-client、sync-server；未启动/停止/重启任何服务。
- 未运行浏览器联调、前后端构建或测试（纯文档任务，验证矩阵 `NOT_APPLICABLE`）。
- 未创建公共组件或项目级模板文档；未修改白名单外文件；未暂存或提交用户既有修改。

## 10. 工作区既有修改保护

工作区存在大量与本任务无关的用户既有未提交内容（如前端 `menu.ts`/`HeaderBar.vue`/`MainLayout.vue`/`Sidebar.vue`/`app.ts`/`global.css`/大屏相关、`agent-env.sh`、数据库与 agent 过程文档、任务报告等）。本任务未清理、未覆盖、未暂存、未提交这些内容，仅逐个暂存白名单内且确由本任务产生的 7 个文件 hunk；未使用任何破坏性 Git 命令。

## 11. Git 提交与推送结果

- 提交信息：`docs(source-snapshot): draft UI adjustment baseline [DATA-SOURCE-SNAPSHOT-STATUS-UI-ADJUSTMENT-BASELINE-001]`（普通提交，未 amend、未强推）。
- 推送：普通推送至 `origin/develop`（非强推）。推送后核对本地 HEAD、`origin/develop`、`git ls-remote origin refs/heads/develop` 三者一致，ahead/behind=`0/0`。
- 结果提交 ID 见任务提交记录与本任务机器可读输出 `AGENT_TASK_RESULT`（本报告不自引用）。

## 12. 结果汇总

| 输出字段 | 值 |
|---|---|
| 任务状态 | `COMPLETED`（验收前 UI 调整草案建立；草案未批准、未实现、未执行验收） |
| 任务编号 | `DATA-SOURCE-SNAPSHOT-STATUS-UI-ADJUSTMENT-BASELINE-001` |
| 分支 | `develop` |
| base_commit_id | `37825272c25c8a2d8a595ff0d5c25c6349186663` |
| requirements_status | `DRAFT_ADJUSTMENT_PENDING_USER_REVIEW` |
| acceptance_status | `DRAFT_ADJUSTMENT_PENDING_USER_REVIEW` |
| design_status | `DESIGN.md`/`UI.md` `DRAFT_ADJUSTMENT_PENDING_USER_REVIEW`；`API.md`/`DATABASE.md` `APPROVED`（整文件零差异） |
| implementation_status | `IMPLEMENTED_ADJUSTMENT_PENDING` |
| formal_acceptance_execution_status | `NOT_RUN` |
| human_visual_acceptance_status | `NOT_RUN` |
| requirements_count | 71 |
| acceptance_count | 80 |
| acceptance_not_run_count | 80 |
| pending_user_review | `YES` |
| pending_user_confirmation_count | 0 |
| traceability_status | `COMPLETE` |
| api_file_diff | `ZERO` |
| database_file_diff | `ZERO` |
| code_change_status | `NONE` |
| database_access_status | `NONE` |
| database_write_status | `NONE` |
| ddl_status | `NONE` |
| test_build_status | `NOT_RUN_NOT_APPLICABLE_DOCS_ONLY` |
| browser_verification_status | `NOT_RUN_NOT_APPLICABLE_DOCS_ONLY` |
| push_status | 已普通推送至 `origin/develop`；推送后本地 HEAD、`origin/develop`、远程一致，ahead/behind=0/0 |
| 变更文件 | 白名单 7 个文件（见 §4） |

下一入口：**ChatGPT 对本轮验收前 UI 调整草案（`DATA-SOURCE-SNAPSHOT-STATUS-UI-ADJUSTMENT-BASELINE-001`，DRAFT）进行正式复审（不是直接实现）**；复审 `APPROVED` 且项目负责人明确批准后，再另立实现任务按 DESIGN §19/UI §13 落地本轮调整；正式验收（`DSS-AC-001~080` 共 80 条）另立独立正式验收任务执行。本任务完成后立即停止，不继续批准或实现。
