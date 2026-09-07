# 实现执行报告 DATA-SOURCE-SNAPSHOT-STATUS-UI-ADJUSTMENT-IMPLEMENTATION-001

- Feature：`data-source-snapshot-status`（源库快照状态）
- 任务性质：前端只读 UI 调整实现（页面结构、结果卡片头部、七列固定列宽与单元格文本、页面级单实例受控 Tooltip、六类请求唯一视觉映射与 busy 视觉隔离），含专项/全量测试、真实浏览器开发验证与证据归档
- 执行日期：2026-09-07
- 分支：`develop`
- 任务起始提交：`19e405bc2c88b091abe1c04229daa37a7d4175d1`（本地 HEAD 与 `origin/develop`、远程 `refs/heads/develop` 一致，ahead/behind=`0/0`）
- UI 调整批准内容基准：`575723711ca39d7761df308c1c99b1e6e957cf70`
- 正式批准版本：`DATA-SOURCE-SNAPSHOT-STATUS-UI-ADJUSTMENT-BASELINE-APPROVAL-001`（批准日期 2026-09-07）
- 对应设计/界面：`DESIGN.md` §19/§20、`UI.md` §13/§14、`DSS-REQ-066~071`、定向修订 `DSS-REQ-028/029/050`、验收 `DSS-AC-069~080`
- 结果状态：`IMPLEMENTED_ADJUSTMENT_PENDING_REVIEW`（本轮 UI 调整已实现、待 ChatGPT 独立代码与证据复审与人工页面验收；不代表代码复审通过、不代表正式验收或人工验收已执行或通过，不等于 `IMPLEMENTED_ACCEPTED`）

## 1. Git 起始现场与工作区保护

- 任务开始时执行：`git status --short`、`git branch --show-current`、`git rev-parse HEAD`、`git log`、`git ls-remote`。
- 起始分支 `develop`；本地 HEAD、`origin/develop`、远程 `refs/heads/develop` 均为 `19e405bc2c88b091abe1c04229daa37a7d4175d1`，ahead/behind=`0/0`。
- 工作区在本任务开始前已存在与当前 Feature 无关的既有修改（`frontend/index.html`、`frontend/src/config/menu.ts`、多个 layout 文件、`frontend/src/stores/app.ts`、`frontend/src/styles/global.css`、`agent-env.sh`、`.claude/settings.local.json`、已删除的 `docs/database/*` 旧报告、大量未跟踪 `docs/agent-prompts/*` 等），全部保留原样；未执行 `reset`/`clean`/`checkout`/`stash`/强推/宽泛暂存，未覆盖、未暂存、未提交任何无关 hunk。
- 未读取、未修改 `topic-offset` 的源码、测试、文档或证据；未把其代码当模板或引入依赖。
- 全程禁止操作 `develop` 以外分支。

## 2. 任务范围与白名单

### 2.1 允许修改/新增范围（实际使用）

前端实现（白名单 `frontend/src/views/data-source-run-state/**`）：

修改：

- `frontend/src/views/data-source-run-state/DataSourceRunStatePage.vue`
- `frontend/src/views/data-source-run-state/components/DataSourceSnapshotQueryBar.vue`
- `frontend/src/views/data-source-run-state/components/DataSourceSnapshotQueryBar.spec.ts`
- `frontend/src/views/data-source-run-state/components/DataSourceSnapshotStatusTag.vue`
- `frontend/src/views/data-source-run-state/components/DataSourceSnapshotTable.vue`
- `frontend/src/views/data-source-run-state/components/DataSourceSnapshotTable.spec.ts`
- `frontend/src/views/data-source-run-state/components/DataSourceSnapshotToolbar.vue`
- `frontend/src/views/data-source-run-state/components/DataSourceSnapshotToolbar.spec.ts`
- `frontend/src/views/data-source-run-state/composables/useDataSourceSnapshot.ts`
- `frontend/src/views/data-source-run-state/composables/useDataSourceSnapshot.spec.ts`

新增：

- `frontend/src/views/data-source-run-state/DataSourceRunStatePage.spec.ts`
- `frontend/src/views/data-source-run-state/components/DataSourceSnapshotStatusTag.spec.ts`
- `frontend/src/views/data-source-run-state/tooltip/SnapshotTooltipHost.vue`
- `frontend/src/views/data-source-run-state/tooltip/tooltipPosition.ts`
- `frontend/src/views/data-source-run-state/tooltip/tooltipPosition.spec.ts`
- `frontend/src/views/data-source-run-state/tooltip/useSnapshotTooltip.ts`
- `frontend/src/views/data-source-run-state/tooltip/useSnapshotTooltip.spec.ts`

文档状态同步（仅实现状态/实现记录/报告导航/下一入口，允许白名单内最小同步）：

- `docs/features/data-source-snapshot-status/README.md`
- `docs/features/data-source-snapshot-status/REQUIREMENTS.md`
- `docs/features/data-source-snapshot-status/ACCEPTANCE.md`
- `docs/features/data-source-snapshot-status/DESIGN.md`
- `docs/features/data-source-snapshot-status/UI.md`
- `docs/features/README.md`（仅 `data-source-snapshot-status` 行与本任务记录）

新增报告与证据：

- `docs/features/data-source-snapshot-status/reports/DATA-SOURCE-SNAPSHOT-STATUS-UI-ADJUSTMENT-IMPLEMENTATION-001.md`（本文件）
- `docs/features/data-source-snapshot-status/evidence/DATA-SOURCE-SNAPSHOT-STATUS-UI-ADJUSTMENT-IMPLEMENTATION-001/**`

### 2.2 明确未修改

- `frontend/src/services/http.ts`、`frontend/src/api/dataSourceSnapshot.ts`
- `frontend/src/types/dataSourceSnapshot.ts`（本任务内部展示类型可复用既有定义，未改动）
- 其它 Feature、公共组件、公共样式、路由、菜单、`package.json`/lock 文件及依赖版本
- 全部后端代码与测试
- `API.md`、`DATABASE.md` 与 UI 调整初版/R1/批准收口三份基线报告（整文件零差异）

## 3. 环境与前置检查

- 分支：`develop`；本 Feature 前端白名单代码均已处于该分支工作区。
- 前置检查通过：`command -v node/npm/git/claude`、`node -v`/`npm -v` 正常；Vite dev server 与既有后端运行中（复用既有服务，见 §12）。
- 任务类型为前端开发：按验证矩阵执行前端专项与全量测试、`vue-tsc`＋Vite 构建；不运行 Maven（后端未改，本任务不把“未运行后端测试”写成后端测试通过）。

## 4. 需求与设计落点摘要（UI 调整）

| 需求 | 验收 | 落点 |
|---|---|---|
| `DSS-REQ-066` | `DSS-AC-069` | 页头语义区＋独立查询卡片＋独立结果卡片三块清晰分区；页面根/卡片容器 `.dss-page-header`/`.dss-query-card`/`.dss-result-card` |
| `DSS-REQ-067` | `DSS-AC-070` | 结果卡片头部左侧 `共 N 条`（始终）＋`其中 N 条未知状态`（`statusCategory=UNKNOWN>0` 才显示，轻量橙色，不推断健康/错误）；仅统计接口返回类别 |
| `DSS-REQ-068` | `DSS-AC-071/072` | 结果卡片头部右侧不可拆散刷新逻辑组：刷新状态圆点→`60 秒自动刷新`→分隔符→`最近成功刷新：HH:mm:ss`（未成功 `--`）→固定宽度“立即刷新”；整体靠右、窄宽度整组换行；三态几何稳定与失败提示稳定槽位 |
| `DSS-REQ-069`（修订 `REQ-028/029`） | `DSS-AC-073/074/075` | 七列固定列宽 `70/170/280/130/165/165/165`（序号中、探针端左、源库左明显宽于探针端、状态中、三时间左）；探针端仅原始 `CLIENT_ID` 单行省略；源库正常仅 ORG 单行省略、缺失/ORG 空回退原始 `DATA_SOURCE_ID`；时间 `YYYY-MM-DD HH:mm:ss`/`--`；表格可横向滚动不拉宽时间列；无原生 `title` |
| `DSS-REQ-070` | `DSS-AC-076/077` | 页面级单实例受控 Tooltip Host（探针端描述/完整 ORG/回退原始 ID＋异常/未知状态原始值/异常提示图标，统一覆盖全部表格 Tooltip） |
| `DSS-REQ-071` | `DSS-AC-078/079` | `initial/retry/query/manual/auto/restore` 六类请求唯一视觉映射与 busy 视觉隔离（详见 §6） |

不改：接口、请求/响应字段、状态归类、排序、候选、时间与 null、行键、错误码、单飞行忙碌抑制、请求快照/两阶段条件、计时器、恢复可见补发、读取边界；页面每次进入三项“全部”自动查询、离开销毁；只读不写、不补行、最多约 100 行不分页。

## 5. 前端实现清单与每项 UI 调整落点

- `DataSourceRunStatePage.vue`：页面根容器改为三块分区（页头语义区 `.dss-page-header`、独立查询卡片 `.dss-query-card`、独立结果卡片 `.dss-result-card`）；结果卡片内部 = `.dss-result-card__header`（左 `.dss-summary` 摘要＋右刷新逻辑组）＋ `.dss-result-card__divider` 轻量分隔 ＋ `.dss-result-card__body`（唯一表格）；卡片沿用 Element Plus/浅色设计令牌（白底/圆角/边框/阴影/间距），不引入新视觉体系。
- `components/DataSourceSnapshotQueryBar.vue`：作为独立查询卡片内容（探针端/源库/快照状态三多选＋查询/重置），配合“查询”按钮不闪动（仅在 `query` 在途时其按钮 loading）；查询/重置语义不变（重置只复位三项“全部”不请求）。
- `components/DataSourceSnapshotToolbar.vue`：刷新逻辑组在结果卡片头部右侧（顺序固定、整体一个 flex/flow 项靠右）；固定宽度“立即刷新”，loading 图标固定尺寸槽位；idle/loading/failure 三态几何稳定、失败提示稳定槽位；busy 期间非发起控件视觉稳定，以 `aria-disabled`＋事件层同时防御鼠标与键盘，不依赖会产生外观变化的原生 disabled 样式；网络层保证点击“立即刷新”仅一次按已应用条件刷新、不额外查询。
- `components/DataSourceSnapshotTable.vue`：七列固定列宽与列内容按批准规则；探针端单元格仅 `CLIENT_ID` 单行省略、源库单元格仅 ORG 单行省略、缺失/ORG 空回退原始 ID、时间固定格式/`--`、无原生 `title`；单元格/图标上以 `data-tt-kind` 触发键向页面级单实例 Tooltip 提交内容；`records` 变化时关闭 Tooltip（watch）。本组件为页面唯一表格并持有唯一 Tooltip Host（`SnapshotTooltipHost :target="ttCurrent"`），从而保证页面任意时刻最多 1 个 Tooltip。
- `components/DataSourceSnapshotStatusTag.vue`：快照状态标签只承担颜色＋文字（颜色非唯一信息载体）；不再私自创建独立 Tooltip；未知状态原始值经唯一 Tooltip Host 展示（触发键 `status-*`）。
- `composables/useDataSourceSnapshot.ts`：以唯一在途请求来源 `requestKind` 派生六类请求的派生视觉标志（详见 §6）；既有业务抑制（busy/单飞行/不并发/不排队/不补发）、请求快照/两阶段条件、计时器与恢复可见一次性延后补发规则不变。
- `tooltip/`（新增，仅当前 Feature 目录）：`useSnapshotTooltip.ts`（单实例控制器）、`tooltipPosition.ts`（视口四边避让定位）、`SnapshotTooltipHost.vue`（单一 Teleport Host）。

## 6. 六类请求唯一视觉映射实现方式

`useDataSourceSnapshot.ts` 保留唯一在途请求来源 `requestKind`（取值 `initial/retry/query/manual/auto/restore`），并以派生标志驱动视觉；`busy = requestKind !== null`（任一实际请求在途时新查询/刷新被功能阻断、自动触发被抑制，鼠标与键盘均不能制造第二请求）：

- `initialLoading = kind === 'initial'` → 仅表格区域 loading；查询/立即刷新稳定、不显示 loading；刷新圆点不激活
- `retryLoading = kind === 'retry'` → 仅错误区“重新加载”按钮 loading；查询/立即刷新稳定；刷新圆点不激活
- `queryLoading = kind === 'query'` → 仅“查询”按钮 loading；表格不遮罩；立即刷新稳定；刷新圆点不激活
- `manualLoading = kind === 'manual'` → 仅“立即刷新”按钮 loading；刷新圆点变蓝动态；查询稳定
- `refreshIndicatorActive = kind in {manual, restore, auto}` → 仅刷新圆点变蓝动态（`auto`/`restore` 时查询与立即刷新均稳定、不显示 loading）

非发起控件不因全局 busy 变灰/闪动/按压；禁用语义以不改变外观的方式呈现（`aria-disabled`＋事件入口同时防御鼠标与键盘）。不再使用笼统 `refreshing` 直接驱动“立即刷新”loading；也不通过允许并发、取消改发、排队或静默补发实现视觉隔离。专项测试逐类断言上述映射并断言点击“立即刷新”网络层仅一次刷新请求。

## 7. 页面级单实例 Tooltip 架构与清理事件

- 状态模型：`useSnapshotTooltip()` 维护唯一 `current = { key, content, anchor } | null`（`key` 为稳定触发键：`client-desc-<rowKey>`/`source-main-<rowKey>`/`status-<rowKey>`/异常图标键等）；`show()` 提交新 key 前先 `hide()`（先关后开，即时），再走统一延迟 `SNAPSHOT_TOOLTIP_DELAY_MS = 320ms`；内容为空即关闭、不弹空 Tooltip；`hide()` 取消延迟并即时关闭。
- 锚点取样：`anchor`（触发元素视口矩形）在 `show`（鼠标进入提交）时刻取样；后续滚动/resize/records 替换等位置失效事件由全局关闭覆盖，延迟窗内不依赖触发元素存活（同时规避宿主表格在 jsdom 中于 hover 重建单元格导致旧节点失连的测试环境问题）。
- 单一 Host：`SnapshotTooltipHost.vue` 用 `<Teleport to="body">` 承载唯一 `.dss-single-tooltip[data-tt-host="1"]`，`pointer-events:none`（不可交互、不遗留），内容默认单行，仅当物理宽度超安全视口才换行；`tooltipPosition.ts` 做视口四边避让（不越界、不被表格容器裁切）。
- 关闭事件（`bindGlobalClose()` 返回解绑函数）：`window` scroll（捕获阶段覆盖表格容器滚动）、`window` resize、`document` visibilitychange、组件卸载（`destroy()` 清定时器置空，防卸载后 setState）、表格 `records` 变化（watch）——统一置空并清延迟/定位任务。无原生 `title`、无多个独立 Element Plus Tooltip 实例残留。
- 触发接入：表格单元格/图标在 mouseenter 提交内容、mouseleave 调 `hide`；状态标签组件不私自创建 Tooltip，未知状态原始值经同一 Host 展示。

## 8. 测试与构建

### 8.1 专项测试（当前 Feature 目录）

命令：`cd frontend && npx vitest run src/views/data-source-run-state`

结果：**12 个测试文件全部通过，120/120**（含三块分区与结果卡片头部、摘要显隐、刷新逻辑组结构与几何稳定、七列固定列宽、CLIENT_ID/ORG 与回退展示、单行省略与无原生 `title`、单实例 Tooltip 恒为 1 与快速 key 切换/延迟取消/离开关闭/records/scroll/resize/hidden/unmount 清理、状态标签不建独立 Tooltip、六类请求视觉逐类断言、busy 期间非发起控件稳定且 `aria-disabled` 正确与鼠标键盘均不产生第二请求、点击立即刷新仅一次刷新请求、查询/重置/失败保留/计时器/可见性无回归）。

### 8.2 前端全量测试

命令：`cd frontend && npm test`（`vitest run`）

结果：**50 个测试文件全部通过，726/726**（既有前端基准 46 文件 669；数量不低于基准且全部通过，未删除/跳过/筛选/用宽松断言掩盖失败）。

### 8.3 构建

命令：`cd frontend && npm run build`（`vue-tsc --noEmit && vite build`）

结果：`vue-tsc` 类型检查通过；Vite 构建成功（`✓ built in ~35s`；chunk 体积提示为既有非阻断警告，与本次改动无关）。

## 9. 真实浏览器开发验证与证据索引

- 取证方式：Headless Chrome（`google-chrome` 148，`--headless=new --no-sandbox --disable-gpu --no-proxy-server --remote-debugging-port=9222`）经 CDP `Emulation.setDeviceMetricsOverride`＋`Page.captureScreenshot`＋`Runtime.evaluate` 驱动；页面经 Vite dev server（`0.0.0.0:5173`）访问 `/monitor/data-source-state`，`/api/*` 代理到本 Feature 后端只读接口 `GET /api/monitor/data-source-run-state/list`。取证脚本（不入仓）：`/tmp/cdc_uiadj_capture.mjs`。
- 证据目录：`docs/features/data-source-snapshot-status/evidence/DATA-SOURCE-SNAPSHOT-STATUS-UI-ADJUSTMENT-IMPLEMENTATION-001/browser/`

| 文件 | 内容 |
|---|---|
| `01-load-1440.png` | 1440×900 首次自动查询后整页：页头＋独立查询卡片＋独立结果卡片（30 行） |
| `02-load-1920.png` | 1920×1080 首次自动查询后整页（30 行） |
| `03-tooltip-client-desc.png` | 悬停探针端（CLIENT_ID 省略）单元格，页面级单实例 Tooltip 展示完整长 `CLIENT_DESC` |
| `04-tooltip-status-raw.png` | 悬停快照状态单元格，Tooltip 展示原始 `SNAPSHOT_RUNNING` 等原始状态值 |
| `05-tooltip-single-instance.png` | 快速横向扫过 状态→探针端 两个触发点后，body 中 Tooltip Host 恒为 1 |
| `summary.md` | 证据清单与 DOM 实测说明（视口、三块分区、结果头部左右两组、七列表头、行数/空时间/无原生 title/提示图标数、单实例 Tooltip 实测等） |

DOM 实测要点（摘自 `summary.md`，Headless Chrome 真实测量）：两分辨率下 `.dss-page-header`/`.dss-query-card`/`.dss-result-card` 均存在；结果卡头部直接子元素恰为 2 组（左 `.dss-result-summary`：`共 30 条`＋`其中 6 条未知状态`；右 `.dss-refresh-group`：`60 秒自动刷新`＋`最近成功刷新：HH:mm:ss`＋`立即刷新`）；表头 7 列按序（序号/探针端/源库/快照状态/快照启动时间/快照完成时间/记录更新时间）；`rowCount=30`、`.dss-time-dash=32`、`nativeTitleInTable=0`、`.dss-hint-icon=67`、loading 遮罩与结果错误区未出现；Tooltip 悬停约 420ms 后 Host `count=1`、内容完整、`inViewport=true`，快速扫状态→探针端后 Host 仍 `count=1`（先关后开不残留）。数据为开发库内既有只读样例（30 行含 6 条未知、32 个 `--` 空时间与长描述行）。

说明：六类请求映射、点击立即刷新单请求、`auto/restore` 仅圆点、重置不请求等行为在 §8 专项测试中逐类断言（组件层网络 mock 计数）；真实浏览器层本目录归档三块结构/结果头部左右布局/固定列宽表头/DOM 摘要与单实例 Tooltip 视觉证据。本阶段为开发验证（非正式验收），错误场景若注入仅在 CDP 层、证据中明确标记；页面只读、无写操作；控制台未见本任务引入的 error/warning。

## 10. 数据库、后端与外部系统边界

- 未直接连接数据库，不执行 SELECT/DML/DDL，不 INSERT/UPDATE/DELETE/TRUNCATE，不恢复或清理既有测试数据（沿用开发库内既有只读样例数据做页面验证）。
- 未访问或操作 ZooKeeper、Kafka、sync-client、sync-server。
- 未修改公共 HTTP 错误拦截器或接口契约；后端代码与测试未改；不运行 Maven（不把“未运行后端测试”写成通过）。

## 11. 文档业务零差异与状态边界

- 相对批准内容基准 `575723711ca39d7761df308c1c99b1e6e957cf70`：
  - `DSS-REQ-001~071` 共 **71** 条业务行 **ZERO** 差异（`git diff` 未触及任何 `DSS-REQ-*` 业务表行）；
  - `DSS-AC-001~080` 共 **80** 条业务行及追踪矩阵 **ZERO** 差异，80 条全部保持 `NOT_RUN`（不写 PASS/FAIL）；
  - DESIGN/UI 已批准业务内容与追踪矩阵 **ZERO** 差异（只同步实现状态/记录/报告导航/下一入口）；
  - `API.md`、`DATABASE.md` 与 UI 调整初版/R1/批准收口三份报告 **整文件 ZERO** 差异。
- 文档状态边界：`requirements_status=APPROVED`、`acceptance_status=APPROVED`、`design_status=APPROVED`、`implementation_status=IMPLEMENTED_ADJUSTMENT_PENDING_REVIEW`、`formal_acceptance_execution_status=NOT_RUN`、`human_visual_acceptance_status=NOT_RUN`、`pending_user_review=NO`、`pending_user_confirmation_count=0`。实现完成不等于代码复审通过、不等于正式验收或人工验收已执行或通过，不等于 `IMPLEMENTED_ACCEPTED`。
- 状态同步范围（已执行）：`REQUIREMENTS.md`/`ACCEPTANCE.md`/`DESIGN.md`/`UI.md` 的当前实现状态元数据、当前状态叙述、报告导航与“下一入口”更新为“已实现、待复审”，并追加实现任务文档级记录；各文档中草稿/R1/批准收口的历史变更记录保留其当时 `IMPLEMENTED_ADJUSTMENT_PENDING` 与“尚未实现”表述不变；`README.md`（Feature）同步实现记录/§8 里程碑/§9 状态/§10 下一入口并登记本报告；`docs/features/README.md` 仅同步本 Feature 行与本任务记录。

## 12. 服务运行与人工页面验收入口

- Vite dev server：PID `4615`，监听 `0.0.0.0:5173`（`/api/*` 代理到本 Feature 后端只读接口）。
- 后端：PID `4592`，`java -jar backend/target/cdc-config-platform-backend-1.0.0-SNAPSHOT.jar`，监听 `127.0.0.1:8080`（既有只读链路）。
- 预览 URL（供项目负责人人工页面目测，非正式验收）：`http://192.168.174.70:5173/monitor/data-source-state`
- 页面保持运行至人工验收完成或要求停止；停止命令：结束 PID 4615 与 4592。

## 13. Git 提交与推送

- 仅逐个暂存本任务白名单文件/hunk（§2.1），不暂存用户既有无关修改；检查 staged diff 后普通提交，建议提交信息：`feat(source-snapshot): implement approved UI adjustment [DATA-SOURCE-SNAPSHOT-STATUS-UI-ADJUSTMENT-IMPLEMENTATION-001]`；随后普通推送 `origin/develop`（禁止强推）。
- 推送前若远程前进导致无法安全普通推送，停止并报告，不覆盖远程；推送后验证本地 HEAD、`origin/develop`、远程 `refs/heads/develop` 三者一致且 ahead/behind=`0/0`。本次提交/推送结果与最终哈希见本报告外层的 `AGENT_TASK_RESULT` 块（result_commit_id/remote_commit_id/push_status）。

## 14. 状态声明与停止点

- 本实现任务不执行 80 条正式验收，不将实现写成正式接受，不创建项目级列表页模板，不调整其他页面。
- 下一入口：ChatGPT 独立代码与证据复审，然后由项目负责人人工查看页面；正式验收由后续独立正式验收任务按本轮调整后验收基线执行。
- 遗留问题/未完成项：无（正式验收与人工页面验收未执行为预期，非缺陷）。
