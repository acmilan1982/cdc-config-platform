# 第二轮验收前 UI 调整草案执行报告 DATA-SOURCE-SNAPSHOT-STATUS-UI-ADJUSTMENT-BASELINE-002

## 1. 任务信息

| 项目 | 值 |
|---|---|
| 任务编号 | `DATA-SOURCE-SNAPSHOT-STATUS-UI-ADJUSTMENT-BASELINE-002` |
| 任务类型 | `DOCUMENT_DRAFT_ADJUSTMENT`（纯文档、第二轮验收前 UI 调整草案建立；不实现、不批准、不执行验收） |
| Feature | 源库快照状态（slug `data-source-snapshot-status`） |
| 所属模块 | 运行监控 |
| 既有路由 | `/monitor/data-source-state`（保持既有值不变） |
| 前端源码目录 | `frontend/src/views/data-source-run-state/`（保持既有目录名不变） |
| 任务状态 | `COMPLETED`（第二轮调整草案建立并入库；草案未批准、第二轮调整未实现、未执行正式验收） |
| 驱动事实 | 项目负责人对第一轮 UI 调整实现 R1（提交 `5933ec29dce5f20b3d34aa101de4c8f9a884b93a`）对应的当前预览页面进行人工检查，结论为需要继续调整（human_visual_review_status=`CHANGES_REQUIRED`）；本轮只围绕任务提示词 §4 四类已确认调整范围建立纯文档草案 |
| 本任务授权基线提交（base） | `5933ec29dce5f20b3d34aa101de4c8f9a884b93a`（本任务开始时 `origin/develop` 最新提交；本地 HEAD 与其一致，ahead/behind=0/0；同为此前第一轮 UI 调整实现 R1 结果提交） |
| 执行分支 | `develop` |
| 本报告是否自引用本次结果提交 | 否（本报告不预填尚未产生的 result_commit_id；结果提交与推送结果见任务提交记录与本任务机器可读输出 `AGENT_TASK_RESULT`） |
| 历史基线 | 已批准需求/验收基线（正式批准版本 `DATA-SOURCE-SNAPSHOT-STATUS-REQUIREMENTS-BASELINE-APPROVAL-001`，批准内容基准提交 `4234af73db2190098f3dcd219319a4281fdabafd`，2026-09-05）、已批准设计基线（`DATA-SOURCE-SNAPSHOT-STATUS-DESIGN-BASELINE-APPROVAL-001`，批准内容基准提交 `61117a62f44d39f7c548ebcb650891abf91b9b8c`，2026-09-06）与第一轮 UI 调整批准版本（正式批准版本 `DATA-SOURCE-SNAPSHOT-STATUS-UI-ADJUSTMENT-BASELINE-APPROVAL-001`，批准内容基准提交 `575723711ca39d7761df308c1c99b1e6e957cf70`，2026-09-07，已由实现任务 `...-UI-ADJUSTMENT-IMPLEMENTATION-001` 及其 R1 落地、实现 R1 提交 `5933ec2...` 经 ChatGPT 独立代码与证据复审 `APPROVED`）；全部保留为历史，历史基线不自动批准本轮调整草案 |

## 2. 任务范围与目标

在第一轮 UI 调整批准并实现的版本之上，把项目负责人已确认的四类调整规则（任务提示词 §4，无待人工决策项）落地为**第二轮纯文档调整草案**，形成可复审、可审阅的 REQUIREMENTS/ACCEPTANCE/DESIGN/UI 调整版与同步后的两个 README。本任务：

- **只调整前端展示层规则**（表格铺满结果卡片与列弹性、探针端列展示简化、源库列展示简化、探针端查询下拉框长度与文本截断）；不改变接口、SQL、表结构、数据库访问与产品只读边界（`API.md`/`DATABASE.md` 整文件零差异），不改 `clientRef.state`/`sourceRef.state`/`sourceRole`/候选生成去重/排序/时间格式等既有契约。
- 在 `REQUIREMENTS.md` 就地定向修订受影响的既有需求行（`DSS-REQ-022/024/028/029/041/042/043/044/045/069/070`）并从 `DSS-REQ-072` 起连续新增 `DSS-REQ-072~075`；在 `ACCEPTANCE.md` 就地定向修订受影响的既有用例（`DSS-AC-020/022/026/027/038/039/040/041/042/073/074/075/076/077/080`）并从 `DSS-AC-081` 起连续新增 `DSS-AC-081~086`。
- 在 `DESIGN.md` 新增 `§22 第二轮 UI 调整草案设计记录`（22.1~22.9），在 `UI.md` 新增 `§16 第二轮 UI 调整草案界面规则`（16.1~16.9），并把受影响历史章节（DESIGN §19/§19.4/§19.5、UI §13/§13.4/§13.5/§13.8、§14/§15）标注为第一轮时点（历史）与被第二轮取代声明；第一轮批准并实现的内容保留为历史。
- 需求由 71 条扩至 75 条（`DSS-REQ-001~075`）；验收由 80 条扩至 86 条（`DSS-AC-001~086`），全部保持 `NOT_RUN`（acceptance_not_run_count=86）。
- 明确历史基线保留为历史，历史基线不自动批准本轮调整草案；下一入口为 ChatGPT 对本第二轮调整草案独立正式复审（不是直接实现）。

## 3. 环境与前置检查

| 检查项 | 结果 |
|---|---|
| 当前目录 | `/agent/cdc-config-platform`（Git 仓库） |
| 当前分支 | `develop` |
| 本任务开始前 Commit ID | `5933ec29dce5f20b3d34aa101de4c8f9a884b93a` |
| `origin/develop` | `5933ec29dce5f20b3d34aa101de4c8f9a884b93a` |
| `git ls-remote origin refs/heads/develop` | `5933ec29dce5f20b3d34aa101de4c8f9a884b93a` |
| ahead/behind | `0/0`（本地 HEAD 与 `origin/develop` 一致，无分叉，可安全快进） |
| 与本任务无关的既有工作区修改 | 存在大量用户既有未提交内容（前端布局/菜单/大屏、agent-env.sh、数据库与 agent 过程文档等）；保持原样，未清理、未覆盖、未暂存、未提交，未使用任何破坏性 Git 命令 |
| 环境预检 | 纯文档任务；不要求后端/前端/数据库/ZooKeeper 环境启动（验证矩阵 `NOT_APPLICABLE`） |

## 4. 允许修改范围（白名单，7 个文件）

1. `docs/features/data-source-snapshot-status/REQUIREMENTS.md`（修改）
2. `docs/features/data-source-snapshot-status/ACCEPTANCE.md`（修改）
3. `docs/features/data-source-snapshot-status/DESIGN.md`（修改）
4. `docs/features/data-source-snapshot-status/UI.md`（修改）
5. `docs/features/data-source-snapshot-status/README.md`（修改）
6. `docs/features/README.md`（修改）
7. `docs/features/data-source-snapshot-status/reports/DATA-SOURCE-SNAPSHOT-STATUS-UI-ADJUSTMENT-BASELINE-002.md`（新增，本文件）

`API.md`、`DATABASE.md` 必须整文件零差异；所有源代码、测试代码、配置、图片和既有证据必须零修改。

## 5. 本轮调整规则逐项落点（四类已确认范围）

本轮规则以任务提示词 §4 的文字规则为唯一调整权威，落点以 DESIGN §22 各小节（设计记录）与 UI §16 各小节（界面规则）为现行表述。第一轮批准并实现的版本（DESIGN §19/§20/§21、UI §13/§14/§15）保留为历史；与本轮冲突处以本轮为现行规则。

### 5.1 表格铺满结果卡片与列弹性（REQ-072；D§22.2、U§16.2）

- 现行规则取消第一轮实现残留的表格容器固定 `width:1145px`（不得保留）；表格在结果卡片正文可用宽度上铺满，右边缘贴合正文右侧边界、不留截图所示大块空白，且不引起结果卡片头部（左摘要/右刷新逻辑组）位移。
- 列宽模型改为五列固定＋探针端/源库两列弹性：固定列 序号 `70px`（居中）、快照状态 `130px`（居中）、三时间各 `165px`（左对齐，固定格式与空值不变）；弹性列 探针端最小 `170px`、源库最小 `280px`（源库明显宽于探针端、单行）。
- 五固定列合计 `695px`＋两弹性列最小 `450px`＝表格最小总宽 `1145px`；卡片正文 >`1145px` 时剩余宽度全部在两弹性列按 `170:280` 相对权重吸收（等价 Element Plus `min-width`/table layout），固定列不参与宽屏分配；窄屏 `<1145px` 允许表格容器横向滚动，不压缩固定时间列、不换行挤压主要文本。
- 目标视口约 `1440×900`/`1920×1080` 及负责人当前截图宽度下右边缘贴合、无大块空白、头部不位移。只改前端布局，不改排序/序号/行键/空值/状态标签/时间格式。验收 `DSS-AC-073/080/081`。

### 5.2 探针端列展示简化（REQ-073；D§22.3、U§16.3）

- 主内容始终为原始 `CLIENT_ID`，单行、超出弹性列宽省略号；Tooltip 仅当完整 `CLIENT_DESC` 非空时经页面级单实例 Tooltip 展示，空/不可得时不弹，不出现“配置已经停用”“探针端配置缺失”等异常说明。
- 删除探针端列全部黄色异常图标（启用/非启用/`NOT_FOUND`/描述为空任意行均无黄色符号）。
- 展示层只额外判断 `FG_ACTIVE`：`'1'` 仅显示 `CLIENT_ID`；非 `'1'`（含 `'0'` 及宽容归一非启用值）显示 `CLIENT_ID`＋一个空格＋红色普通文字“停用”（非图标/按钮/链接/不新增列）；`NOT_FOUND` 仅显示原始 `CLIENT_ID`（缺失静默）。
- 不改接口既有 `clientRef.state`、后端映射与数据库读取规则。验收 `DSS-AC-026/038/040/074/082`。

### 5.3 源库列展示简化（REQ-074；D§22.4、U§16.4）

- 正常关联且 `DATA_SOURCE_ORG` 非空：主内容只显示 ORG（单行 ellipsis），悬停 Tooltip 只显示完整 ORG，不以原始 ID 作为正常行 Tooltip 默认内容；`NOT_FOUND` 或 ORG 空：主内容回退完整原始 `DATA_SOURCE_ID`（单行 ellipsis，不空白），Tooltip 显示完整原始 ID。
- 删除源库列全部黄色异常图标；Tooltip 不追加“配置缺失/配置停用/类别非 SOURCE”异常说明；停用/类别异常/缺失仍保留 RUN_STATE 行并按 ORG/回退 ID 展示，源库列不出现红色“停用”（红色“停用”仅用于探针端非启用）。
- 不改 `sourceRef.state`、`sourceRole`、后端映射、候选来源或数据库读取规则。验收 `DSS-AC-027/039/040/041/075/083`。

### 5.4 探针端查询下拉框长度与文本截断、宽度约束（REQ-075；D§22.5、U§16.5）

- 候选 option 展示为 `CLIENT_ID（CLIENT_DESC）`，两段确定性截断且只影响展示：ID/描述各最多展示前 20 个 Unicode code point，超出追加英文 `...`；按 code point（禁止 UTF-16 code unit 拆开代理对）；描述为空不显示空括号。
- option `value` 仍为完整原始 `CLIENT_ID`，点击提交完整值；API/响应/候选去重/已应用条件/ghost 均用完整值；不新增 `filterable`/远程搜索。
- 闭合后已选标签宽度约束 ellipsis；下拉项单行（先逻辑截断再 CSS `text-overflow:ellipsis` 兜底）。
- 宽度约束：探针端控件建议 `240px`、面板目标最大 `480px`；源库控件建议 `300px`、面板目标最大 `560px`；快照状态控件约 `200px`；均不超 `calc(100vw - 16px)` 安全视口；专属 `popper-class` 用 Feature 命名空间、不污染全局。
- “全部”完整显示；ghost 应用同 ID 截断但保留“不在候选内”语义。验收 `DSS-AC-020/022/084/085`。

### 5.5 页面级单实例 Tooltip 与展示矩阵（第二轮现行；D§22.6/§22.7、U§16.6/§16.7）

- §19.5/§13.5 的页面级单实例受控 Tooltip 状态模型继续为现行规则，第二轮不改状态模型；覆盖范围按展示矩阵收窄（探针端完整 `CLIENT_DESC`、源库完整 ORG 或完整回退原始 ID、未知快照完整原始值），删除异常图标/异常说明触发项后仍满足“任意采样时刻至多 1 个”、未知原始值 Tooltip 不回退（`DSS-AC-086`）。
- 展示矩阵与 Tooltip 内容来源汇总、黄色异常图标全部取消等第二轮现行表述见 DESIGN §22.6/UI §16.6。

## 6. 需求/验收新计数与追踪

| 项 | 值 |
|---|---|
| requirements_status | `DRAFT_ADJUSTMENT_PENDING_USER_REVIEW`（当前第二轮调整版本） |
| acceptance_status | `DRAFT_ADJUSTMENT_PENDING_USER_REVIEW`（当前第二轮调整版本） |
| requirements_count | `75`（`DSS-REQ-001~075`；既有批准/第一轮批准 `DSS-REQ-001~071` 71 条 + 本轮新增 `DSS-REQ-072~075` 4 条；就地修订 `DSS-REQ-022/024/028/029/041/042/043/044/045/069/070`） |
| acceptance_count | `86`（`DSS-AC-001~086`；既有批准/第一轮批准 `DSS-AC-001~080` 80 条 + 本轮新增 `DSS-AC-081~086` 6 条；就地修订 `DSS-AC-020/022/026/027/038/039/040/041/042/073/074/075/076/077/080`） |
| acceptance_not_run_count | `86`（全部 `NOT_RUN`） |
| requirements_acceptance_coverage | `75/75`（需求→设计/界面落点全覆盖，DESIGN §14.2/UI §9 同步） |
| acceptance_reverse_reference_status | `COMPLETE`（验收→设计/界面落点 86/86，反向引用均在 `DSS-REQ-001~075` 内，无悬空） |
| pending_user_review | `YES` |
| pending_user_confirmation_count | `0` |

六份受影响文档（REQUIREMENTS/ACCEPTANCE/DESIGN/UI/Feature README/Feature 总索引）的状态、计数、下一入口保持一致的第二轮草案口径。

## 7. 状态迁移与历史保留

本轮统一迁移为（任务提示词 §7）：

- requirements/acceptance/design/UI 当前第二轮版本：`DRAFT_ADJUSTMENT_PENDING_USER_REVIEW`
- implementation：`IMPLEMENTED_ADJUSTMENT_PENDING`（既有实现与第一轮 UI 调整实现均已存在，但第二轮调整尚未实现）
- formal acceptance：`NOT_RUN`
- human visual acceptance：`NOT_RUN`
- human_visual_review_status：`CHANGES_REQUIRED`（项目负责人对第一轮 UI 调整实现 R1 对应预览页人工检查结论，为驱动本轮草案的事实；保持 `CHANGES_REQUIRED` 直至人工页面验收给出接受结论）
- pending_user_review：`YES`
- pending_user_confirmation_count：`0`
- acceptance_not_run_count：`86`

历史保留：需求/验收批准版、设计批准版、第一轮 UI 调整批准版（含其实现与 R1 结果 `5933ec2...`）全部保留为历史；历史基线不自动批准本轮调整草案。本轮调整草案须经 ChatGPT 对本第二轮草案独立正式复审 `APPROVED` 且项目负责人明确回复“批准”后方能成为新基线。

## 8. API/DATABASE/代码零差异证明

| 对象 | 结果 |
|---|---|
| `docs/features/data-source-snapshot-status/API.md` | 整文件零差异（未修改；git diff 核验为空） |
| `docs/features/data-source-snapshot-status/DATABASE.md` | 整文件零差异（未修改；git diff 核验为空） |
| 后端源码/测试/配置 | 零修改（无相关文件进入提交） |
| 前端源码/测试/配置/图片/既有证据 | 零修改（无相关文件进入提交） |
| 历史报告与历史批准记录 | 未删除、未覆盖、未改写（白名单外一律不纳入提交） |

## 9. 残留冲突扫描结果（任务提示词 §9）

对 REQUIREMENTS/ACCEPTANCE/DESIGN/UI/两处 README 全文执行下列短语作为“当前规则”的扫描，消除与第二轮现行规则冲突的残留表述（第一轮批准并实现的历史章节保留其批准事实但已在 DESIGN §19.4/§19.5、UI §13.4/§13.5/§13.8 等处标注“第二轮取代声明/第一轮时点数值（历史）”）；扫描与标注结果：

| 检查短语（作为当前规则） | 结果 |
|---|---|
| 表格固定 `width:1145px` / 七列全部固定列宽 | `REMOVED_FROM_CURRENT_RULE`（现行规则改表格铺满＋五固定列＋探针端/源库两弹性列，见 REQUIREMENTS §21.2/§21.3、DESIGN §22.2、UI §16.2） |
| 探针端列缺失/停用黄色异常图标或 Tooltip 异常说明 | `REMOVED_FROM_CURRENT_RULE`（现行规则删除探针端全部黄色图标、Tooltip 仅完整 `CLIENT_DESC`，见 DESIGN §22.3、UI §16.3） |
| 探针端非启用黄色图标 | `REMOVED_FROM_CURRENT_RULE`（现行规则非启用 `FG_ACTIVE` 为红字普通文字“停用”，非图标） |
| 源库缺失/停用/类别异常黄色图标或 Tooltip 异常说明 | `REMOVED_FROM_CURRENT_RULE`（现行规则删除源库黄色图标与异常 Tooltip 说明，ORG/回退原始 ID 展示，见 DESIGN §22.4、UI §16.4） |
| 正常源库行 Tooltip 默认原始 `DATA_SOURCE_ID` | `REMOVED_FROM_CURRENT_RULE`（现行规则正常行 Tooltip 只显示完整 ORG，见 REQUIREMENTS §21.2/§21.3、DESIGN §22.4、UI §16.4） |
| 探针端候选 option 无界完整 `CLIENT_DESC` / 下拉面板被长选项撑开无上限 | `REMOVED_FROM_CURRENT_RULE`（现行规则 ID/描述各 20 Unicode 字符＋`...` 截断并设控件/面板宽度上限，见 REQUIREMENTS §21.2/§21.3、DESIGN §22.5、UI §16.5） |
| 黄色异常图标承载 Tooltip（单实例 Tooltip 覆盖异常图标说明） | `REMOVED_FROM_CURRENT_RULE`（异常图标已全部取消，Tooltip 覆盖范围收窄，见 REQUIREMENTS §21.2/§21.3、DESIGN §22.6/§22.7、UI §16.6/§16.7） |

历史章节内经标注允许保留的批准事实（如第一轮时点“需求 71/71、验收 80/80”“七列固定列宽”“黄色图标”等）仅作历史记录，不构成当前规则；当前计数与现行规则以 REQUIREMENTS §1/§21.2、ACCEPTANCE §1/§4.19、DESIGN §1/§22、UI §1/§16 与两处 README 为准。

## 10. 未执行事项

- 未实现或修改任何前后端代码、测试、依赖、构建配置、SQL/XML 或静态资源；第二轮调整尚未实现（`implementation_status=IMPLEMENTED_ADJUSTMENT_PENDING`）。
- 未批准调整草案（REQUIREMENTS/ACCEPTANCE/DESIGN/UI 当前第二轮版本均保持 `DRAFT_ADJUSTMENT_PENDING_USER_REVIEW`）；未把草案写成 `APPROVED`/`PASS`/`ACCEPTED`/`IMPLEMENTED_ACCEPTED`，未把第一轮实现完成状态写成已接受。
- 未执行任何正式验收或人工页面验收（全部 `DSS-AC-001~086` 保持 `NOT_RUN`、acceptance_not_run_count=86）；未把人工页面检查结论 `CHANGES_REQUIRED` 改写为通过。
- 未访问或操作数据库，未执行任何 SELECT/DML/DDL；未操作 ZooKeeper、Kafka、sync-client、sync-server；未启动/停止/重启任何服务。
- 未运行浏览器联调、前后端构建或测试（纯文档任务，验证矩阵 `NOT_APPLICABLE`）。
- 未创建公共组件或项目级模板文档；未修改白名单外文件；未暂存或提交用户既有修改。

## 11. 工作区既有修改保护

工作区存在大量与本任务无关的用户既有未提交内容（如前端 `menu.ts`/`HeaderBar.vue`/`MainLayout.vue`/`Sidebar.vue`/`app.ts`/`global.css`/大屏相关、`agent-env.sh`、数据库与 agent 过程文档、任务报告等）。本任务未清理、未覆盖、未暂存、未提交这些内容，仅逐个暂存白名单内且确由本任务产生的 7 个文件；未使用任何破坏性 Git 命令。

## 12. Git 提交与推送结果

- 提交信息：`docs(source-snapshot): draft second-round UI adjustment baseline [DATA-SOURCE-SNAPSHOT-STATUS-UI-ADJUSTMENT-BASELINE-002]`（普通提交，未 amend、未强推）。
- 推送：普通推送至 `origin/develop`（非强推）。推送后核对本地 HEAD、`origin/develop`、`git ls-remote origin refs/heads/develop` 三者一致，ahead/behind=`0/0`。
- 结果提交 ID 见任务提交记录与本任务机器可读输出 `AGENT_TASK_RESULT`（本报告不自引用）。

## 13. 结果汇总

| 输出字段 | 值 |
|---|---|
| 任务状态 | `COMPLETED`（第二轮验收前 UI 调整草案建立；草案未批准、第二轮调整未实现、未执行验收） |
| 任务编号 | `DATA-SOURCE-SNAPSHOT-STATUS-UI-ADJUSTMENT-BASELINE-002` |
| 分支 | `develop` |
| base_commit_id | `5933ec29dce5f20b3d34aa101de4c8f9a884b93a` |
| requirements_status | `DRAFT_ADJUSTMENT_PENDING_USER_REVIEW` |
| acceptance_status | `DRAFT_ADJUSTMENT_PENDING_USER_REVIEW` |
| design_status | `DESIGN.md`/`UI.md` `DRAFT_ADJUSTMENT_PENDING_USER_REVIEW`；`API.md`/`DATABASE.md` `APPROVED`（整文件零差异） |
| implementation_status | `IMPLEMENTED_ADJUSTMENT_PENDING` |
| formal_acceptance_execution_status | `NOT_RUN` |
| human_visual_acceptance_status | `NOT_RUN` |
| human_visual_review_status | `CHANGES_REQUIRED` |
| requirements_count | 75 |
| acceptance_count | 86 |
| acceptance_not_run_count | 86 |
| pending_user_review | `YES` |
| pending_user_confirmation_count | 0 |
| requirements_acceptance_coverage | 75/75 |
| acceptance_reverse_reference_status | `COMPLETE` |
| responsive_table_fill_status | `DOCUMENTED`（表格铺满＋五固定列＋探针/源库两弹性列；DESIGN §22.2、UI §16.2） |
| fixed_flexible_column_status | `DOCUMENTED`（固定 70/130/165×3＋弹性 170/280；最小总宽 1145px） |
| client_tooltip_desc_only_status | `DOCUMENTED`（探针端 Tooltip 仅完整 `CLIENT_DESC`，空不弹） |
| client_yellow_icon_status | `REMOVED_FROM_CURRENT_RULE` |
| client_inactive_red_text_status | `DOCUMENTED`（非启用 `FG_ACTIVE` 红字“停用”普通文本） |
| source_yellow_icon_status | `REMOVED_FROM_CURRENT_RULE` |
| source_tooltip_content_status | `ORG_OR_RAW_ID_FALLBACK_ONLY` |
| client_candidate_truncation_status | `ID20_DESC20_ASCII_DOTS`（Unicode code point） |
| client_source_dropdown_width_status | `CLIENT_SHORTER_THAN_SOURCE`（探针端 240/480、源库 300/560、状态约 200） |
| conflict_residual_scan_status | `COMPLETE`（§9 扫描无现行规则残留冲突） |
| api_file_diff | `ZERO` |
| database_file_diff | `ZERO` |
| code_change_status | `NONE` |
| test_build_status | `NOT_RUN_NOT_APPLICABLE_DOCS_ONLY` |
| browser_verification_status | `NOT_RUN_NOT_APPLICABLE_DOCS_ONLY` |
| database_access_status | `NONE` |
| database_write_status | `NONE` |
| ddl_status | `NONE` |
| zookeeper_access_status | `NONE` |
| kafka_access_status | `NONE` |
| service_operation_status | `NONE` |
| push_status | 已普通推送至 `origin/develop`；推送后本地 HEAD、`origin/develop`、远程一致，ahead/behind=0/0 |
| report_path | `docs/features/data-source-snapshot-status/reports/DATA-SOURCE-SNAPSHOT-STATUS-UI-ADJUSTMENT-BASELINE-002.md` |
| error | 无 |

下一入口：**ChatGPT 对本第二轮验收前 UI 调整草案（`DATA-SOURCE-SNAPSHOT-STATUS-UI-ADJUSTMENT-BASELINE-002`，DRAFT）进行独立正式复审（`pending_user_review=YES`，不是直接实现）**；复审 `APPROVED` 且项目负责人明确批准后，再另立第二轮 UI 调整实现任务按 DESIGN §22/UI §16 落地本轮展示调整；正式验收（`DSS-AC-001~086` 共 86 条）另立独立正式验收任务执行。本任务完成后立即停止，不继续批准或实现。
