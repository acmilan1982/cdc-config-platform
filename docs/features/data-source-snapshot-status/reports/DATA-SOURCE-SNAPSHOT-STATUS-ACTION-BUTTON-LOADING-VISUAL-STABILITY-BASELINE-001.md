# 基线草案报告 DATA-SOURCE-SNAPSHOT-STATUS-ACTION-BUTTON-LOADING-VISUAL-STABILITY-BASELINE-001

- Feature：`data-source-snapshot-status`（源库快照状态）
- 任务编号：`DATA-SOURCE-SNAPSHOT-STATUS-ACTION-BUTTON-LOADING-VISUAL-STABILITY-BASELINE-001`
- 任务性质：**纯文档调整基线草案**（操作按钮 Loading 视觉稳定性）。不实现前端代码、不执行正式验收、不修改既有 107 条验收结果、不替代 ChatGPT 复审或项目负责人批准
- 执行日期：2026-09-14
- 分支：`develop`
- 任务基准提交：`f3d383eb8b37b422033481a51acd89f0f28900cc`
- 隔离工作区：`/agent/dss-action-button-loading-baseline-001`（自 `f3d383e` 全新创建，detached HEAD 起始）
- 结果状态：文档草案已建立并校验通过；`action_button_loading_visual_stability_document_status=DRAFT_PENDING_CHATGPT_REVIEW_AND_PROJECT_OWNER_APPROVAL`、`action_button_loading_visual_stability_implementation_status=PENDING_FORMAL_IMPLEMENTATION_ON_5173`、`action_button_loading_visual_stability_acceptance_status=NOT_RUN`。**不代表本轮调整已实现、正式验收已执行或通过，不等于 `IMPLEMENTED_ACCEPTED`/`PASS`/`ACCEPTED`**

## 1. Git 起始现场与工作区保护

- 任务开始时执行 `git status --short`、`git branch --show-current`、`git rev-parse HEAD`、`git ls-remote`。
- `origin/develop` 与远程 `refs/heads/develop` 均为任务基准提交 `f3d383eb8b37b422033481a51acd89f0f28900cc`，与任务文档给定基准一致，未触发停线。
- 主工作区 `/agent/cdc-config-platform` 本地 `develop` 为 `4222b0a24b927aca6f62ff348fd8549b73d4156c`（落后远程），并带有本任务开始前已存在的 116 项无关修改；该状态为已知状态，**未修复、未触碰**：未在其上执行 `pull`/`checkout`/`reset`/`stash`/`clean`/构建/启动服务/暂存任何文件。
- 全部文档编辑只在自 `f3d383e` 全新创建的隔离工作区 `/agent/dss-action-button-loading-baseline-001` 内进行；未进入、未复用、未清理任何既有原型/正式实现/验收工作区。
- 全程未对 `develop` 以外分支进行任何写操作；未执行 `push --force`、未改写历史。

### 1.1 工作区保护证明

- 主工作区 HEAD 任务前后一致：`4222b0a24b927aca6f62ff348fd8549b73d4156c`，分支 `develop`，`git status --short` 行数 116（任务前后一致）。
- `git worktree list` 任务前 39 项、任务后 40 项，新增项唯一且为本任务隔离工作区 `/agent/dss-action-button-loading-baseline-001`；无既有工作区被删除、切换或修改。

## 2. 用户观察到的现象与根因

### 2.1 用户观察（接受后缺陷反馈）

- **“立即刷新”按钮**：按钮框宽度已固定为 `110px`，但 Element Plus 默认 Loading 图标**进入正常内容流**，使按钮文字在 Loading 期间发生水平位移。
- **“查询”按钮**：按钮只有 `height: 30px; padding: 0 16px;`、**无固定宽度**，Element Plus 默认 Loading 图标既使文字水平位移、又**临时撑宽按钮框**。
- 两个按钮的**功能本身正确**；本轮范围仅为按钮 Loading 几何稳定性，**不重写业务逻辑**。

### 2.2 已确认根因（文档侧核验）

- `frontend/src/views/data-source-run-state/components/DataSourceSnapshotQueryBar.vue` 的“查询”按钮使用 `:loading="queryLoading"`，且未固定宽度。
- `frontend/src/views/data-source-run-state/components/DataSourceSnapshotToolbar.vue` 的“立即刷新”按钮使用 `:loading="manualLoading"`，已具 `width: 110px; box-sizing: border-box;`。
- 两者均依赖 Element Plus 默认 `loading` 的**内容布局**：默认 Loading 图标作为按钮内容的一部分参与内容流，从而推动文字、并在无固定宽度时撑宽按钮框。

`default_loading_icon_flow_root_cause_status=DOCUMENTED`

## 3. 统一设计方向（已由项目负责人批准，实现必须按此执行）

两个按钮统一采用“**相对定位按钮容器 + 独立固定居中标签节点 + Feature 私有绝对定位 Loading 节点**”结构。

1. 两个按钮**均不得**让 Element Plus 默认 Loading 图标进入正常内容流。
2. 按钮文字在空闲 / Loading / 成功 / 失败四种状态下**恒为 `查询` / `立即刷新`**；**禁止**“查询中…”/“刷新中…”等动态文案。
3. 文字位于**独立、固定居中**的标签节点；Loading 指示器位于 Feature 私有节点/样式中，**绝对定位**在文字左侧空白区，**不属于按钮内容宽度**。
4. 指示器**只改变可见性/透明度/旋转，永不改变几何**；优先采用“**常驻节点 + 状态切换**”避免重排。
5. “立即刷新”按钮框固定 `110px`，**不回退**。
6. “查询”按钮框固定为**已接受版本（`f3d383e`）真实空闲宽度实测值 `62px`**（见 §4）。
7. 实现必须在 Feature 私有命名空间内同时锁定两个按钮的 `width`/`min-width`/`max-width`/`flex-basis`；**不得**全局覆盖 Element Plus。
8. 实现可脱离 Element Plus 默认 `loading` 的内容布局，但必须保留准确的 `aria-busy`、既有 `aria-disabled` 与事件防重复保护。
9. 指示器为纯视觉元素、`aria-hidden="true"`、不产生重复读屏播报；`prefers-reduced-motion: reduce` 下可停止旋转但必须保持静态可见且几何完全稳定。
10. 不改动既有颜色/边框/圆角/字重/高度/hover/focus/disabled 样式，不改动查询栏响应式换行规则。

`feature_private_overlay_spinner_rule_status=DOCUMENTED`、`label_center_invariance_rule_status=DOCUMENTED`、`loading_state_independence_rule_status=DOCUMENTED`

## 4. “查询”按钮固定宽度基准测量（只读，真实 Chromium）

### 4.1 测量口径

- 目标页面：`http://127.0.0.1:5173/monitor/data-source-state`（`title=CDC 配置管理平台`）。
- 测量方式：真实 Chromium（headless，`--force-device-scale-factor=1`）经 DevTools Protocol `Runtime.evaluate` 执行 `getBoundingClientRect()`，读前强制布局刷新（`void document.documentElement.offsetHeight`）；再读取 `offsetWidth`/`clientWidth` 与 `getComputedStyle`。
- 视口：`1280×800`、`1700×920`、`1920×1080`、`2560×1440`（四档正式支持视口）。
- 采样：每视口 **6 次**，共 **24 次**。
- 只读性：测量脚手架仅回放**已接受版本**的空成功响应（`evidence/DATA-SOURCE-SNAPSHOT-STATUS-FORMAL-ACCEPTANCE-001/http/11-empty-success.json`），未访问后端、Oracle、ZooKeeper 或 Kafka。

### 4.2 测量结果

| 视口 | 采样数 | 空闲宽度去重集合 | `clientWidth` | 文字 | 文字节点宽×高 |
|---|---|---|---|---|---|
| 1280×800 | 6 | `{62}` | 60 | `查询` | 28×14 |
| 1700×920 | 6 | `{62}` | 60 | `查询` | 28×14 |
| 1920×1080 | 6 | `{62}` | 60 | `查询` | 28×14 |
| 2560×1440 | 6 | `{62}` | 60 | `查询` | 28×14 |

- **四档视口空闲宽度 24/24 次均一致，实测值 `62px`**，符合任务“四档空闲值必须一致”的前置条件，未触发停线。
- 几何自洽：`62px`（border-box）= 文字 `28px` + 左右 padding `0 16px`（`32px`）+ 左右边框 `2×1px`；`clientWidth = 62 − 2 = 60`。
- 实时页计算样式与 `f3d383e` 源码声明一致：`height=30px`、`padding-left/right=16px`、`border=1px`、`box-sizing=border-box`、`font-size=14px`、`font-weight=500`，且 `width=62px`/`min-width=auto`/`max-width=none`/`flex=0 1 auto`（即**未固定宽度**，与根因分析一致）。
- 同法只读复核“立即刷新”：四档视口 **24/24 全部 `110px`**（`clientWidth=108`，文字 `立即刷新`），印证既有 `110px` 基线未回退。

`query_button_idle_measured_width_px=62`、`query_button_width_measurement_status=MEASURED_OK_FROM_BASE_COMMIT_INSTANCE`、`refresh_button_fixed_width_px=110`

### 4.3 页面来源（对应基准提交）证明

- 被测源码 blob：`frontend/src/views/data-source-run-state/components/DataSourceSnapshotQueryBar.vue`，`git show f3d383eb8b37b422033481a51acd89f0f28900cc:<path> | sha256sum` = `e1744f72b65721680c70e482340d2163603b79b53be7535265e1af936084df6c`。
- 运行实例所服务的模块（经 DevTools Protocol 抓取、Vite 开发态编译产物）sha256 = `73d375e436e55441e0cfbf812f46b574e0c474206cea04e1bc275219fce1840e`，内容含该按钮的 `class: "dss-query-btn"`。
- 结论链：运行实例由**自 `f3d383e` 全新创建的隔离工作区**启动 → 所服务模块含该基准提交的按钮类名 → 对应源码 blob 哈希可复核 → 实时页计算样式（`height 30px`/`padding 0 16px`/无固定宽度）与 `f3d383e` 源码声明逐项吻合。据此判定测量页来源可信对应基准提交，未触发 `查询按钮固定宽度待可信基准测量` 停线。
- 测量完成后，本次临时启动的实例（Vite + 只读响应脚手架 + Chromium）**已全部停止**，相关端口已确认释放；临时启动授权已完全收尾。

### 4.4 测量证据留存说明

测量原始产物（`measure.json` sha256 `2debd3f460a905590ec3cc5ff5ec06cb5e575a7898ae727dd9f9152731146711`、`measure-refresh.json` sha256 `4827647ddad4ca4eb1f678ddacaa760897205900bd3bbd2338b715c289887263`、四档截图、测量脚本）按任务 §8 白名单**不落库**，仅留存于会话临时目录；本报告以哈希与数值引用其结论。

## 5. 新增需求与验收编号及追踪

### 5.1 新增需求（REQUIREMENTS.md §21.9）

| 编号 | 内容摘要 |
|---|---|
| `DSS-REQ-088` | “查询”按钮 Loading 视觉稳定性（四状态零位移、宽度固定 `62px`、恒文案 `查询`、独立居中标签、指示器不进入内容流、`aria-busy`/`aria-disabled`/防重复保留、`aria-hidden` 纯视觉、reduced-motion 静态可见） |
| `DSS-REQ-089` | “立即刷新”按钮 Loading 视觉稳定性（同上口径，宽度固定既有 `110px`、不回退） |

需求编号自 `DSS-REQ-088` 起**连续追加、唯一、不复用**，调整后合计 `DSS-REQ-001~089` 共 **89** 条。

### 5.2 新增验收（ACCEPTANCE.md §4.23，全部 `NOT_RUN`）

| 编号 | 状态 | 关联需求 |
|---|---|---|
| `DSS-AC-108` | `NOT_RUN` | `DSS-REQ-088`（“查询”按钮框稳定性） |
| `DSS-AC-109` | `NOT_RUN` | `DSS-REQ-088`（“查询”文字与指示器稳定性） |
| `DSS-AC-110` | `NOT_RUN` | `DSS-REQ-089`（“立即刷新”按钮框稳定性） |
| `DSS-AC-111` | `NOT_RUN` | `DSS-REQ-089`（“立即刷新”文字与指示器稳定性） |
| `DSS-AC-112` | `NOT_RUN` | `DSS-REQ-088, DSS-REQ-089`（可访问性、状态独立与请求语义） |
| `DSS-AC-113` | `NOT_RUN` | `DSS-REQ-088, DSS-REQ-089`（四档视口与相邻布局回归） |

验收编号自 `DSS-AC-108` 起**连续追加、唯一、不复用**，调整后合计 `DSS-AC-001~113` 共 **113** 条。

### 5.3 双向追踪（无悬空）

- `DSS-REQ-088` ↔ `DSS-AC-108` / `DSS-AC-109` / `DSS-AC-112` / `DSS-AC-113`
- `DSS-REQ-089` ↔ `DSS-AC-110` / `DSS-AC-111` / `DSS-AC-112` / `DSS-AC-113`

`DESIGN.md` §14.2 更新为需求 **89/89**、§14.3 更新为验收 **113/113**，原映射行逐字节不变、仅追加新映射。

## 6. 分层状态与统计口径

| 范围 | 状态 |
|---|---|
| 已接受范围（`f3d383e`） | `accepted_feature_implementation_status=IMPLEMENTED_ACCEPTED`、`accepted_feature_formal_acceptance_status=ACCEPTED`、`accepted_feature_acceptance_pass_count=107`；`DSS-AC-001~107` 保持 `PASS 107 / FAIL 0 / BLOCKED 0 / NOT_RUN 0` |
| 本轮草案（2026-09-14） | `solution_direction_status=APPROVED_BY_PROJECT_OWNER`、`document_status=DRAFT_PENDING_CHATGPT_REVIEW_AND_PROJECT_OWNER_APPROVAL`、`implementation_status=PENDING_FORMAL_IMPLEMENTATION_ON_5173`、`acceptance_status=NOT_RUN`、`acceptance_not_run_count=6` |
| 计数 | `requirements_count=89`、`acceptance_count=113`、`pending_user_review=YES`、`pending_user_confirmation_count=0` |

- 统计必须读作“**已接受范围 PASS 107；本轮草案 NOT_RUN 6**”，**不得**写成“113 条已正式验收通过”。
- 项目负责人批准的是**方案方向**，不是这份尚未复审的文档基线。
- 当前统一下一入口：`CHATGPT_ACTION_BUTTON_LOADING_VISUAL_STABILITY_BASELINE_REVIEW_FROM_GIT_THEN_PROJECT_OWNER_APPROVAL`。
- 历史 `NONE_FEATURE_ACCEPTED` 仅在**明确限定**的历史语境下保留，已限定为“**截至 2026-09-14 本轮新增调整提出前的已接受范围入口**”（`REQUIREMENTS.md`、`ACCEPTANCE.md` 各 2 处），不再作为本 Feature 当前统一下一入口。

## 7. 实际修改文件列表（严格等于白名单）

修改（8 份既有入口文档）：

1. `docs/features/README.md`（新增 §下一步 分层状态说明与 2026-09-14 变更记录行）
2. `docs/features/data-source-snapshot-status/README.md`
3. `docs/features/data-source-snapshot-status/REQUIREMENTS.md`（新增 §21.9，更新数量核验 §24 与变更记录 §25）
4. `docs/features/data-source-snapshot-status/ACCEPTANCE.md`（新增 §4.23 与 §5 映射行，更新 §7 变更记录）
5. `docs/features/data-source-snapshot-status/DESIGN.md`（新增 §31，§14.2/§14.3 更新为 89/89、113/113）
6. `docs/features/data-source-snapshot-status/UI.md`（新增 §25）
7. `docs/features/data-source-snapshot-status/API.md`（仅追加 1 行“本轮为纯前端视觉调整草案，接口契约不变”状态行）
8. `docs/features/data-source-snapshot-status/DATABASE.md`（仅追加 1 行“数据库结构、查询设计与只读边界不变”状态行）

新增（1 份报告）：

9. `docs/features/data-source-snapshot-status/reports/DATA-SOURCE-SNAPSHOT-STATUS-ACTION-BUTTON-LOADING-VISUAL-STABILITY-BASELINE-001.md`（本报告）

### 7.1 零代码、零契约改动证明

- `frontend/**`、`backend/**`、测试代码、SQL、配置、证据目录、任何既有报告：**零 diff**。
- 本任务提示词 Markdown：**未入库**。
- `API.md` 业务契约与 §9 映射表**逐字节不变**（仅追加 1 行状态行）；`DATABASE.md` 业务正文、SQL、字段、约束、关系与顺序**逐字节不变**（仅追加 1 行状态行）。
- 未修改 `useDataSourceSnapshot` 或任何请求状态机逻辑、API/数据库/后端/ZooKeeper/Kafka 契约；本页**无 ZooKeeper 依赖**。
- 未修改任何其他路由；未新增全局 `.el-button`/`.el-icon`/`.is-loading` 样式覆盖。

## 8. §10 必做校验结果

| # | 校验项 | 结果 |
|---|---|---|
| 1 | `git diff --check` 无空白错误 | **PASS**（输出为空） |
| 2 | `git diff --name-only`/未跟踪文件严格等于白名单 | **PASS**（8 修改 + 1 新增，无越界） |
| 3 | `DSS-REQ-001~089` 连续、唯一、不复用、合计 89 | **PASS**（count=89，min=1，max=89） |
| 4 | `DSS-AC-001~113` 连续、唯一、不复用、合计 113 | **PASS**（count=113，min=1，max=113） |
| 5 | `DSS-AC-001~107` 仍 `PASS 107`；`DSS-AC-108~113` `NOT_RUN 6`；`FAIL`/`BLOCKED` 0 | **PASS**（pass=107、not_run_new=6、fail_blocked=0） |
| 6 | 既有 `DSS-REQ-001~087` 业务行与基准逐字节相同 | **PASS**（0 处不一致） |
| 7 | 既有 `DSS-AC-001~107` 业务行与状态列逐字节相同 | **PASS**（0 处不一致） |
| 8 | `DESIGN.md` 原 §14.2/§14.3 映射行逐字节不变、仅追加；结果 89/89、113/113、无悬空 | **PASS**（基准映射行 0 处缺失；覆盖读作 89/89 与 113/113） |
| 9 | `API.md` 业务契约与映射表逐字节不变；`DATABASE.md` 业务正文逐字节不变 | **PASS**（各仅 1 行追加、0 行删除，去该行后与基准逐字节相同） |
| 10 | `frontend/**`、`backend/**`、测试、SQL、配置、证据、既有报告零 diff | **PASS**（0 处越界） |
| 11 | 当前状态检索不得把本轮草案写成 `APPROVED`/`IMPLEMENTED`/`PASS`/`ACCEPTED`/`COMPLETED`；“113 条已正式验收通过”仅以禁止形式出现 | **PASS**（0 处违规断言） |
| 12 | 历史 `NONE_FEATURE_ACCEPTED` 带日期/任务/“此前已接受范围”限定；当前直接下一入口无冲突 | **PASS**（`REQUIREMENTS.md` 2 处、`ACCEPTANCE.md` 2 处已限定；当前下一入口为新草案入口） |

- `git_diff_check_status=PASS`
- 仓库未提供 Markdown lint / 文档校验工具，故 `documentation_validation_status=NOT_AVAILABLE`（如实记录，不伪报 PASS）；上述 12 项校验由只读比对脚本完成，脚本同时核对了与基准提交的逐字节差异。

## 9. 未执行事项

- 未实现前端代码（“查询”/“立即刷新”按钮的 Loading 视觉稳定性本轮**尚未实现**）。
- 未执行任何正式验收；`DSS-AC-108~113` 全部 `NOT_RUN`；未修改既有 107 条验收结果。
- 未做前端构建/测试、后端构建/测试（纯文档任务）。
- 未启动/停止 `5173`/`5174`/`8080` 常驻服务（§4 的只读测量临时实例已完全收尾、端口已释放）。
- 未访问数据库、ZooKeeper、Kafka（`database_access_status=NONE`、`zookeeper_access_status=NONE`、`kafka_access_status=NONE`）。
- 未开始文档批准收口，未开始前端实现，未开始正式验收。

## 10. 提交与推送一致性

- 提交范围：仅白名单 9 个路径，逐个 `git add <精确路径>`（未使用 `git add .`/`git add -A`），单个普通 Commit，未 amend、未 rebase、未强推。
- 推送前重新 `git fetch origin develop` 核对远程未前移；以 `HEAD:develop` 普通快进推送。
- 推送后核对本地 HEAD、`origin/develop`、`git ls-remote origin refs/heads/develop` 三者一致，ahead/behind `0/0`。
- 报告内哈希在提交前无法确定者记为 `PENDING_COMMIT_AND_PUSH`；实际值以本次会话最终结果块为准，**未为回填报告追加第二个提交**。

## 11. 后续入口

`next_step=CHATGPT_ACTION_BUTTON_LOADING_VISUAL_STABILITY_BASELINE_REVIEW_FROM_GIT_THEN_PROJECT_OWNER_APPROVAL`


## 12. R1 当前状态一致性纠正补充说明（`DATA-SOURCE-SNAPSHOT-STATUS-ACTION-BUTTON-LOADING-VISUAL-STABILITY-BASELINE-001-R1`，2026-09-14）

> 本节由 R1 纯文档定向纠正任务在 R0 报告正文之后**追加**，不改写、不删除本报告任何既有内容；本节以上全部字节即为 R0 报告原始内容。

- **R0 报告结论不完整之处（更正）**：本报告 §1～§11 当时声称八份入口文档“当前状态已统一”**并不完全**。经 ChatGPT 从远程 Git 复审本报告对应结果提交 `cf6aec1f34a98cb38d113fc8ab681376979b5243`，结论为 `chatgpt_r0_review_status=CHANGES_REQUIRED_CURRENT_STATUS_CONSISTENCY_ONLY`：**八份入口文档顶部当前状态区仍残留旧直接值**——四处 `pending_user_review=NO`（Feature `README.md` 顶部“待确认与审阅”行、`ACCEPTANCE.md`/`DESIGN.md`/`UI.md` 顶部 `pending_user_review` 行）未改为当前的 `YES`；且多处顶部当前状态/当前导航仍把历史入口 `NONE_FEATURE_ACCEPTED`、以及 R0 复审入口 `CHATGPT_ACTION_BUTTON_LOADING_VISUAL_STABILITY_BASELINE_REVIEW_FROM_GIT_THEN_PROJECT_OWNER_APPROVAL` 当作“当前统一下一入口”直接值，使当前状态同时出现两个答案。
- **R0 报告中原本就正确、R1 未改动的部分**：按钮 Loading 方案方向与几何（“查询”`62px`/“立即刷新”`110px`）、需求 89、验收 113、`DSS-REQ-001~089` 与 `DSS-AC-001~113` 业务行、`DSS-AC-001~107` 的 `PASS 107` 状态列、DESIGN §14.2/§14.3 追踪（89/89 与 113/113）、DESIGN §31、UI §25、API/DATABASE 业务契约与正文——以上均为正确内容，R0 报告对此的描述**无需更正**，R1 亦逐字节保持不变。
- **R1 所做的纠正**：仅纠正上述“当前状态双答案”问题——把四处 `pending_user_review` 的当前直接值前置为 `YES`、把原有 `NO` 降级为带“截至 2026-09-14 本轮新增调整提出前”日期限定的历史事实；把八份入口文档顶部当前状态/当前导航的“当前统一下一入口”统一前置为 `CHATGPT_ACTION_BUTTON_LOADING_VISUAL_STABILITY_BASELINE_R1_REVIEW_FROM_GIT_THEN_PROJECT_OWNER_APPROVAL`，并把 `NONE_FEATURE_ACCEPTED`、R0 复审入口统一降级为带日期/任务号限定的历史入口。历史记录未被删除。
- **最终口径**：R1 报告见 `reports/DATA-SOURCE-SNAPSHOT-STATUS-ACTION-BUTTON-LOADING-VISUAL-STABILITY-BASELINE-001-R1.md`；本轮草案仍为 `DRAFT_PENDING_CHATGPT_REVIEW_AND_PROJECT_OWNER_APPROVAL`，未实现（`PENDING_FORMAL_IMPLEMENTATION_ON_5173`）、未验收（`NOT_RUN` 6），当前下一致入口为 `CHATGPT_ACTION_BUTTON_LOADING_VISUAL_STABILITY_BASELINE_R1_REVIEW_FROM_GIT_THEN_PROJECT_OWNER_APPROVAL`。
