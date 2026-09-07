# 验收前 UI 调整基线 R1 极小定向修订执行报告 DATA-SOURCE-SNAPSHOT-STATUS-UI-ADJUSTMENT-BASELINE-001-R1

## 1. 任务信息

| 项目 | 值 |
|---|---|
| 任务编号 | `DATA-SOURCE-SNAPSHOT-STATUS-UI-ADJUSTMENT-BASELINE-001-R1` |
| 任务类型 | `DOCUMENT_MINIMAL_REVISION`（纯文档、极小定向修订；不实现、不批准、不执行验收） |
| Feature | 源库快照状态（slug `data-source-snapshot-status`） |
| 所属模块 | 运行监控 |
| 分支 | `develop` |
| 授权基线提交（base） | `dc1d5285a541dd799521a778e5d00996ea0b4222`（本任务开始时本地 HEAD、`origin/develop`、`git ls-remote origin refs/heads/develop` 三者一致，ahead/behind=`0/0`，无分叉） |
| 任务状态 | `COMPLETED`（R1 极小定向修订已入库并推送；草案仍未批准、本轮调整仍未实现、验收仍未执行） |
| 驱动事实 | ChatGPT 对 UI 调整草案结果提交 `dc1d5285...` 正式复审结论 `CHANGES_REQUIRED`（初版只规定“只有发起当前请求的操作显示对应加载反馈”，但未明确 `auto`/`restore` 在途时“立即刷新”按钮是否显示 loading，而既有实现把 `manual/auto/restore` 共用 `refreshing`，会直接导致两种实现解释）；项目负责人已明确确认任务提示词 §4 的六类请求视觉映射 |
| 原调整报告 | `docs/features/data-source-snapshot-status/reports/DATA-SOURCE-SNAPSHOT-STATUS-UI-ADJUSTMENT-BASELINE-001.md`（R0 报告，本任务**整文件零差异**保留） |
| 本报告是否自引用本次结果提交 | 否（本报告不预填尚未产生的 result_commit_id；结果提交与推送结果见任务提交记录与本任务机器可读输出 `AGENT_TASK_RESULT`） |

## 2. 任务范围与目标

在 R0 验收前 UI 调整草案（`DATA-SOURCE-SNAPSHOT-STATUS-UI-ADJUSTMENT-BASELINE-001`）之上做**唯一一项 R1 极小定向修订**：消除 `auto`（60 秒自动刷新）与 `restore`（页面恢复可见后立即或延后单次刷新）在途时“立即刷新”按钮是否显示 loading 的歧义。R1 只把项目负责人已确认的六类请求视觉映射收口为 REQUIREMENTS/ACCEPTANCE/DESIGN/UI 四份文档的唯一现行规则；初版其余全部业务规则保持不变。

本任务为**纯文档任务**：

- 不改任何前后端代码、测试、配置、图片与既有证据；`API.md`/`DATABASE.md` 整文件零差异。
- 不读取或修改 `topic-offset`，不创建公共组件或项目级模板。
- 不连接或操作数据库，不执行任何 DML/DDL；不访问 ZooKeeper/Kafka，不操作 sync-client/sync-server；不启动/停止/重启服务；不运行构建、测试、浏览器验证或正式验收。
- 不把调整草案写成 `APPROVED`/`PASS`/`ACCEPTED`/`IMPLEMENTED_ACCEPTED`；不改动旧批准历史与其他 Feature 状态。

## 3. 环境与前置检查

| 检查项 | 结果 |
|---|---|
| 当前目录 | `/agent/cdc-config-platform`（Git 仓库） |
| 当前分支 | `develop` |
| 本任务开始前 Commit ID | `dc1d5285a541dd799521a778e5d00996ea0b4222` |
| `origin/develop` | `dc1d5285a541dd799521a778e5d00996ea0b4222` |
| `git ls-remote origin refs/heads/develop` | `dc1d5285a541dd799521a778e5d00996ea0b4222` |
| ahead/behind | `0/0`（本地 HEAD 与 `origin/develop` 一致，无分叉） |
| 与本任务无关的既有工作区修改 | 存在大量用户既有未提交内容（前端布局/菜单/大屏等）；保持原样，未清理、未覆盖、未暂存、未提交，未使用任何破坏性 Git 命令 |
| 白名单目标文件是否有任务前既有修改 | 六个既有白名单文件在任务开始前相对 `dc1d528...` 全部零修改（干净），可直接安全编辑 |
| 环境预检 | 纯文档任务；不要求后端/前端/数据库/ZooKeeper 环境启动（验证矩阵 `NOT_APPLICABLE`） |

## 4. 唯一修订与项目负责人已确认的六类请求视觉映射

R1 唯一问题：初版已正确规定“只有真正发起当前请求的操作显示对应加载反馈；非发起按钮不得闪动或产生被点击错觉”，但没有明确 `auto`/`restore` 在途时“立即刷新”按钮是否显示 loading。既有实现把 `manual/auto/restore` 共用 `refreshing`，因此该歧义会直接导致两种实现解释。R1 只消除这一歧义，其余业务规则全部不变。

项目负责人已确认的六类请求视觉映射（本任务作为唯一现行规则写入需求、验收与设计）：

| 请求类型 | 触发来源 | 页面视觉反馈 |
|---|---|---|
| `initial` | 页面首次进入自动加载 | 表格区域显示 loading；“查询”与“立即刷新”按钮外观稳定，不显示 loading |
| `retry` | 首次加载失败后点击“重新加载” | 只有错误区“重新加载”按钮显示 loading；“查询”与“立即刷新”不显示 loading |
| `query` | 用户点击“查询” | 只有“查询”按钮显示 loading；“立即刷新”外观稳定且不显示 loading |
| `manual` | 用户点击“立即刷新” | 只有“立即刷新”按钮显示 loading，刷新状态圆点变蓝并呈刷新动态；“查询”外观稳定且不显示 loading |
| `auto` | 60 秒自动刷新 | 只有刷新状态圆点变蓝并呈刷新动态；“查询”与“立即刷新”按钮外观稳定，均不显示 loading |
| `restore` | 页面恢复可见后立即或延后单次刷新 | 只有刷新状态圆点变蓝并呈刷新动态；“查询”与“立即刷新”按钮外观稳定，均不显示 loading |

对所有六类请求统一适用：① `busy` 功能语义不变（任一实际请求在途期间，新查询和新刷新都不可发起，鼠标与键盘均不能产生第二个请求）；② 单飞行、不并发、不排队、不补发不变，恢复可见既有的一次性延后补发规则不变；③ 非本次请求发起控件不得显示 loading、变灰闪动、按压动画或其他“好像被点击”的反馈；④ 被功能性抑制但视觉保持稳定的按钮必须具正确 `aria-disabled` 语义，并同时阻止鼠标和键盘激活；⑤ 刷新状态圆点表示所有刷新类请求（`manual/auto/restore`）在途，颜色不是唯一信息载体；⑥ `initial/retry/query` 不得错误点亮刷新状态圆点；⑦ 不得通过允许并发、取消当前请求后切换操作、排队、静默补发来实现视觉隔离。

## 5. 允许修改范围（白名单，7 个文件）

1. `docs/features/data-source-snapshot-status/REQUIREMENTS.md`（修改）
2. `docs/features/data-source-snapshot-status/ACCEPTANCE.md`（修改）
3. `docs/features/data-source-snapshot-status/DESIGN.md`（修改）
4. `docs/features/data-source-snapshot-status/UI.md`（修改）
5. `docs/features/data-source-snapshot-status/README.md`（修改）
6. `docs/features/README.md`（修改）
7. `docs/features/data-source-snapshot-status/reports/DATA-SOURCE-SNAPSHOT-STATUS-UI-ADJUSTMENT-BASELINE-001-R1.md`（新增，本文件）

原报告 `...UI-ADJUSTMENT-BASELINE-001.md` 必须保持不变；`API.md`、`DATABASE.md` 必须整文件零差异。全部代码、测试、配置、图片和既有证据必须零差异。

## 6. 本轮 R1 落点逐项

### 6.1 REQUIREMENTS.md

- 仅定向澄清 `DSS-REQ-071`（§21），写入 §4 六类请求完整视觉映射并保留原单飞行/忙碌抑制/不并发/不排队/不补发语义与网络层单请求证明目标。
- `DSS-REQ-001~070` 业务行相对 `dc1d528...` **逐字节零差异**（已用 `git show HEAD:... | grep -E '^| DSS-REQ-'` 排除 `DSS-REQ-071` 后 diff 为空核验）。
- 需求数量保持 `71`，不新增 `DSS-REQ-072`；状态保持 `DRAFT_ADJUSTMENT_PENDING_USER_REVIEW`、实现 `IMPLEMENTED_ADJUSTMENT_PENDING`。
- §25 追加 R1 文档变更记录；旧批准历史未改动。

### 6.2 ACCEPTANCE.md

- 仅定向澄清 `DSS-AC-072`（刷新组在空闲、手工刷新、自动刷新、恢复可见刷新与失败状态下的几何稳定性与按钮 loading 映射，明确 `auto`/`restore` 在途只激活刷新状态圆点、不使“立即刷新”按钮显示 loading）、`DSS-AC-078`（逐项验证 `initial/retry/query/manual/auto/restore` 六类请求视觉映射，特别验证 `auto`/`restore` 不得让“立即刷新”按钮显示 loading）、`DSS-AC-079`（继续验证各种 busy 状态下鼠标/键盘抑制与网络单请求，且 busy 抑制不得改变六类请求的 loading 反馈映射）。
- `DSS-AC-001~071`、`073~077`、`080` 业务行相对 `dc1d528...` **逐字节零差异**（已用 `git show HEAD:... | grep -E '^| DSS-AC-'` 排除 `DSS-AC-072/078/079` 后 diff 为空核验）。
- 验收数量保持 `80`，不新增 `DSS-AC-081`；80 条全部保持 `NOT_RUN`（`acceptance_not_run_count=80`）；§5 需求—验收追踪矩阵零差异。
- §7 追加 R1 变更记录；旧批准历史未改动。

### 6.3 DESIGN.md

- 仅定向修订 §19.3（刷新逻辑组设计）与 §19.6（busy 视觉隔离与请求类型视觉映射设计）与请求类型视觉反馈相关的内容；§19 其余内容与全部旧设计业务规则保持不变。
- §19.6 明确状态模型至少能区分：`requestKind`（或等价的当前请求来源）、`queryLoading = kind === 'query'`、`manualLoading = kind === 'manual'`、`refreshIndicatorActive = kind in {manual, auto, restore}`（以上为语义示例，不强制具体变量名）；设计**不得再用一个笼统 `refreshing` 直接控制“立即刷新”按钮 loading**；初次加载的表格 loading（`initial`）、错误区“重新加载”按钮 loading（`retry`）继续各自独立。

### 6.4 UI.md

- 仅定向修订 §13.3（追加刷新状态圆点语义与刷新类按钮 loading 映射）与 §13.6（改写为六类请求页面视觉反馈唯一现行规则＋统一约束）并在旧 §6.4 消除与六类映射直接冲突的现行表述（原“仅工具栏按钮或说明区显示轻量在途态（如按钮 loading 图标）”改为明确 `auto`/`restore` 只让刷新状态圆点变蓝、不让“立即刷新”按钮显示 loading）。
- 明确 `auto`/`restore` 只激活刷新状态圆点、不让“立即刷新”按钮显示 loading；明确条件查询只有“查询”按钮显示 loading；首次加载和 `retry` 按六类映射处理。
- 页面结构、列宽、Tooltip、结果摘要和其他 UI 草案规则保持不变。

### 6.5 README 与 Feature 总索引

- 只做 R1 完成状态与下一入口的最小同步：Feature README §5 文档导航、报告导航、历史要点、§9 当前态、§10 下一流程入口；总索引 `docs/features/README.md` 运行监控表 data-source-snapshot-status 行的最新证据/当前缺口/下一入口及变更记录。
- 当前调整仍未批准、未实现、未验收；下一入口为 ChatGPT 对 R1 结果提交正式复审（不是直接实现）；不修改其他 Feature 状态。

## 7. 计数、状态与追踪

| 项 | 值 |
|---|---|
| requirements_status | `DRAFT_ADJUSTMENT_PENDING_USER_REVIEW`（当前调整版本，未变） |
| acceptance_status | `DRAFT_ADJUSTMENT_PENDING_USER_REVIEW`（当前调整版本，未变） |
| design_status | `DESIGN.md`/`UI.md` 当前调整版本 `DRAFT_ADJUSTMENT_PENDING_USER_REVIEW`；`API.md`/`DATABASE.md` `APPROVED`（整文件零差异） |
| implementation_status | `IMPLEMENTED_ADJUSTMENT_PENDING`（本轮调整尚未实现，未变） |
| formal_acceptance_execution_status | `NOT_RUN` |
| human_visual_acceptance_status | `NOT_RUN` |
| requirements_count | `71`（`DSS-REQ-001~071`） |
| acceptance_count | `80`（`DSS-AC-001~080`，全部 `NOT_RUN`，`acceptance_not_run_count=80`） |
| pending_user_review | `YES` |
| pending_user_confirmation_count | `0` |
| traceability_status | `COMPLETE`（需求 71、验收 80、设计落点矩阵与追踪矩阵未变、无悬空） |
| request_visual_mapping_status | `COMPLETE`（六类请求映射在 REQUIREMENTS `DSS-REQ-071`、ACCEPTANCE `DSS-AC-072/078/079`、DESIGN §19.3/§19.6、UI §13.3/§13.6 中逐项一致） |
| auto_restore_button_loading_status | `DOT_ONLY_BUTTONS_STABLE`（`auto`/`restore` 只激活刷新状态圆点，“查询”与“立即刷新”按钮外观稳定、均不显示 loading） |

## 8. API/DATABASE/代码/原报告零差异证明

| 对象 | 结果 |
|---|---|
| `docs/features/data-source-snapshot-status/API.md` | 整文件零差异（git diff 核验为空） |
| `docs/features/data-source-snapshot-status/DATABASE.md` | 整文件零差异（git diff 核验为空） |
| 原报告 `...UI-ADJUSTMENT-BASELINE-001.md` | 整文件零差异（git diff 核验为空） |
| 后端/前端源码、测试、配置、图片、既有证据 | 零修改（无相关文件进入提交） |
| `DSS-REQ-001~070` 业务行 | 相对 `dc1d528...` 逐字节零差异（仅 `DSS-REQ-071` 被定向修订） |
| `DSS-AC-001~071/073~077/080` 业务行 | 相对 `dc1d528...` 逐字节零差异（仅 `DSS-AC-072/078/079` 被定向修订） |

## 9. 未执行事项

- 未实现或修改任何前后端代码、测试、依赖、构建配置、SQL/XML 或静态资源；本轮调整仍未实现（`implementation_status=IMPLEMENTED_ADJUSTMENT_PENDING`）。
- 未批准调整草案（REQUIREMENTS/ACCEPTANCE/DESIGN/UI 当前调整版本均保持 `DRAFT_ADJUSTMENT_PENDING_USER_REVIEW`）；未把草案写成 `APPROVED`/`PASS`/`ACCEPTED`/`IMPLEMENTED_ACCEPTED`。
- 未执行任何正式验收或人工页面验收（`DSS-AC-001~080` 全部保持 `NOT_RUN`）。
- 未访问或操作数据库，未执行任何 SELECT/DML/DDL；未操作 ZooKeeper、Kafka、sync-client、sync-server；未启动/停止/重启任何服务。
- 未运行构建、测试或浏览器验证（纯文档任务，验证矩阵 `NOT_APPLICABLE`）。
- 未读取或修改 `topic-offset`，未创建公共组件或项目级模板文档；未修改白名单外文件；未暂存或提交用户既有修改。

## 10. 工作区既有修改保护

工作区存在大量与本任务无关的用户既有未提交内容（前端 `menu.ts`/`HeaderBar.vue`/`MainLayout.vue`/`Sidebar.vue`/`app.ts`/`global.css`/大屏相关、`agent-env.sh`、agent 提示词与过程文档等）。本任务未清理、未覆盖、未暂存、未提交这些内容，仅逐个暂存白名单内且确由本任务产生的 7 个文件 hunk；未使用任何破坏性 Git 命令。

## 11. Git 提交与推送结果

- 提交信息：`docs(source-snapshot): clarify UI request feedback mapping [DATA-SOURCE-SNAPSHOT-STATUS-UI-ADJUSTMENT-BASELINE-001-R1]`（普通提交，未 amend、未强推）。
- 推送：普通推送至 `origin/develop`（非强推）。推送后核对本地 HEAD、`origin/develop`、`git ls-remote origin refs/heads/develop` 三者一致，ahead/behind=`0/0`。
- 结果提交 ID 见任务提交记录与本任务机器可读输出 `AGENT_TASK_RESULT`（本报告不自引用）。

## 12. 结果汇总

| 输出字段 | 值 |
|---|---|
| 任务状态 | `COMPLETED`（验收前 UI 调整草案 R1 极小定向修订完成并入库；草案未批准、本轮调整未实现、验收未执行） |
| 任务编号 | `DATA-SOURCE-SNAPSHOT-STATUS-UI-ADJUSTMENT-BASELINE-001-R1` |
| 分支 | `develop` |
| base_commit_id | `dc1d5285a541dd799521a778e5d00996ea0b4222` |
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
| requirements_unchanged_except_req071 | `YES` |
| acceptance_unchanged_except_ac072_078_079 | `YES` |
| request_visual_mapping_status | `COMPLETE` |
| auto_restore_button_loading_status | `DOT_ONLY_BUTTONS_STABLE` |
| traceability_status | `COMPLETE` |
| api_file_diff | `ZERO` |
| database_file_diff | `ZERO` |
| original_report_diff | `ZERO` |
| code_change_status | `NONE` |
| database_access_status | `NONE` |
| database_write_status | `NONE` |
| ddl_status | `NONE` |
| test_build_status | `NOT_RUN_NOT_APPLICABLE_DOCS_ONLY` |
| browser_verification_status | `NOT_RUN_NOT_APPLICABLE_DOCS_ONLY` |
| push_status | 已普通推送至 `origin/develop`；推送后本地 HEAD、`origin/develop`、远程一致，ahead/behind=`0/0` |
| 变更文件 | 白名单 7 个文件（见 §5） |

下一入口：**ChatGPT 对 R1 结果提交进行正式复审（不是直接实现）**；复审 `APPROVED` 且项目负责人明确批准后，再另立实现任务按 DESIGN §19/UI §13 落地本轮 UI 调整；正式验收（`DSS-AC-001~080` 共 80 条）另立独立正式验收任务执行。本任务完成后立即停止，不继续批准或实现。
