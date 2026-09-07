# 实现执行报告 DATA-SOURCE-SNAPSHOT-STATUS-UI-ADJUSTMENT-IMPLEMENTATION-001-R1

- Feature：`data-source-snapshot-status`（源库快照状态）
- 任务性质：本轮 UI 调整实现的 R1 极小定向修订（ChatGPT 对初版实现提交 `1fa26fe69e109cdebf74262b22243da6f2588570` 独立复审 `CHANGES_REQUIRED` 两项阻断的修复）：R1-01 Tooltip 单行优先/极端换行/目标切换防旧坐标闪现；R1-02 真实浏览器动态交互证据补齐。不改已批准业务语义、不调整接口/API/SQL/数据库结构或产品只读边界、不执行正式验收、不将功能自行标记为已接受。
- 执行日期：2026-09-07
- 分支：`develop`
- 任务基准提交：`1fa26fe69e109cdebf74262b22243da6f2588570`（本地 HEAD、`origin/develop`、远程 `refs/heads/develop` 一致，ahead/behind=`0/0`）
- 批准内容基准：`575723711ca39d7761df308c1c99b1e6e957cf70`（本轮 UI 调整需求/验收/设计批准内容基准；`DATA-SOURCE-SNAPSHOT-STATUS-UI-ADJUSTMENT-BASELINE-APPROVAL-001`，批准日期 2026-09-07）
- 初版 UI 调整实现任务：`DATA-SOURCE-SNAPSHOT-STATUS-UI-ADJUSTMENT-IMPLEMENTATION-001`（提交 `1fa26fe...`）
- 对应规则：Tooltip 现行规则（内容优先单行，仅当完整内容物理宽度超过安全视口才换行，保证全文可读且不越界）、`DSS-REQ-070/071`、`DSS-AC-072/076/077/078/079`、DESIGN §19/§20、UI §13/§14
- 结果状态：`IMPLEMENTED_ADJUSTMENT_PENDING_REVIEW`（R1 已实现、待 ChatGPT 从远程 Git 对 R1 结果独立复审与人工页面验收；不代表代码复审通过、不代表正式验收或人工验收已执行或通过，不等于 `IMPLEMENTED_ACCEPTED`）

## 1. Git 起始现场与工作区保护

- 任务开始时执行只读核验：`git status --short`、`git branch --show-current`、`git rev-parse HEAD`、`git ls-remote origin refs/heads/develop`。
- 起始分支 `develop`；本地 `HEAD`、`origin/develop`、远程 `refs/heads/develop` 均为任务基准提交 `1fa26fe69e109cdebf74262b22243da6f2588570`，ahead/behind=`0/0`。
- 工作区在本任务开始前已存在与本 Feature 无关的既有修改（`frontend/index.html`、`frontend/src/config/menu.ts`、多个 layout 文件、`frontend/src/stores/app.ts`、`frontend/src/styles/global.css`、`agent-env.sh`、`.claude/settings.local.json`、已删除的 `docs/database/*` 旧报告、大量未跟踪 `docs/agent-prompts/*` 等），全部保留原样；未执行 `reset`/`clean`/`checkout`/`stash`/强推/宽泛暂存，未覆盖、未暂存、未提交任何无关 hunk。
- 未读取、未修改 `topic-offset` 或“数据同步进度”相关源码、测试、文档或证据；未把其代码当模板或引入依赖。
- 全程禁止操作 `develop` 以外分支。

## 2. 任务范围与白名单核验

### 2.1 允许修改的源码/测试（R1 §8.1，仅在确有必要时修改）

实际修改：

- `frontend/src/views/data-source-run-state/tooltip/SnapshotTooltipHost.vue`（R1-01：删除固定 `420px` 上限、单行优先；目标切换先回不可见定位态再按新锚点一次性定位）
- `frontend/src/views/data-source-run-state/tooltip/SnapshotTooltipHost.spec.ts`（新增，4 测试：测量后显示于期望坐标、单实例 Host 恒 1 无原生 `title`、A→B 切换先隐藏后按 B 定位、target→null 移除）
- `frontend/src/views/data-source-run-state/tooltip/tooltipPosition.spec.ts`（新增单行优先宽 Tooltip 不越界 2 测试，共 10 测试）

白名单内但经确认无需改动、保持零差异：`useSnapshotTooltip.ts`、`useSnapshotTooltip.spec.ts`、`tooltipPosition.ts`、`components/DataSourceSnapshotTable.spec.ts`（现有断言已覆盖 records 变化关闭等生命周期；R1 修复均在 Host/position 层，上述文件零差异）。

### 2.2 允许新增/更新的文档与证据（R1 §8.2）

- `docs/features/data-source-snapshot-status/README.md`（仅同步 R1 实现待复审状态与报告/证据入口）
- `docs/features/README.md`（仅同步本 Feature 一行与变更记录）
- `docs/features/data-source-snapshot-status/reports/DATA-SOURCE-SNAPSHOT-STATUS-UI-ADJUSTMENT-IMPLEMENTATION-001-R1.md`（本文件，新增）
- `docs/features/data-source-snapshot-status/evidence/DATA-SOURCE-SNAPSHOT-STATUS-UI-ADJUSTMENT-IMPLEMENTATION-001-R1/**`（新增，浏览器证据与测试/构建日志）

### 2.3 强制零差异文件（R1 §8.3）核验结果

相对任务基准提交 `1fa26fe...`，`git diff` 实测：

- `REQUIREMENTS.md`、`ACCEPTANCE.md`、`DESIGN.md`、`UI.md`、`API.md`、`DATABASE.md`：**整文件零差异**（未触及任何 `DSS-REQ-*`/`DSS-AC-*` 业务表行，80 条验收全部保持 `NOT_RUN`）
- 初版 UI 调整实现报告 `…/reports/DATA-SOURCE-SNAPSHOT-STATUS-UI-ADJUSTMENT-IMPLEMENTATION-001.md` 及初版证据目录 `…/evidence/DATA-SOURCE-SNAPSHOT-STATUS-UI-ADJUSTMENT-IMPLEMENTATION-001/`：**整文件零差异**
- 全部后端源码/测试/config、所有公共前端代码/路由/菜单/依赖、`frontend/src/services/http.ts`、`frontend/src/api/*` 与其他 Feature：**零差异**

### 2.4 明确不改

`frontend/src/services/http.ts`、API 文件、查询/刷新组件与 composable 请求逻辑；`useDataSourceSnapshot.ts` 请求状态机不重构；不引入 Element Plus 多实例 Tooltip、原生 `title`、ellipsis/裁切/滚动条隐藏内容；不加生产调试入口。浏览器验证未发现新的真实功能缺陷，无需越出 R1 范围修复。

## 3. 环境与前置检查

- 分支 `develop`；本 Feature 前端白名单代码均处于该分支工作区。
- 前置检查通过：`node -v`/`npm -v`/`git` 正常；Vite dev server（PID 4615，监听 `0.0.0.0:5173`，`/api/*` 代理后端）与后端（PID 4592，`java -jar …-1.0.0-SNAPSHOT.jar`，监听 `127.0.0.1:8080`）运行中（复用既有服务）。
- 任务类型为前端开发：执行 Tooltip 专项测试、Feature 专项测试、前端全量测试、`vue-tsc`＋Vite 构建、真实浏览器开发验证；不运行 Maven（后端未改，不把“未运行后端测试”写成通过）。

## 4. R1-01 Tooltip 修复前后差异

### 4.1 单行优先 / 极端换行（§5.1）

修复前（初版 `SnapshotTooltipHost.vue`）：

```css
max-width: min(420px, calc(100vw - 16px));
width: max-content;
white-space: pre-line;
overflow-wrap: anywhere;
```

固定 `420px` 上限导致 1920px 宽屏下的长 `CLIENT_DESC`（自然宽度 1832px）提前换成多行。

修复后：

```css
max-width: calc(100vw - 16px);   /* 无固定 420px；安全视口上限，border-box 计入 padding/border */
width: max-content;               /* 内容自然宽度在安全视口内则单行 */
box-sizing: border-box;
white-space: pre-line;
overflow-wrap: anywhere;          /* 仅当达到安全视口上限的极端长内容断行，不横向越界 */
```

规则落实：删除固定 `420px` 最大宽度限制；Tooltip 自然内容宽度未超过安全视口 `calc(100vw - 16px)` 时保持单行；仅当自然宽度确实超过安全视口才换行；极端长连续串经 `overflow-wrap:anywhere` 在安全视口内断行、无横向越界；`box-sizing:border-box` 保证 padding/border 计入宽度计算不越界；保留全文（无 ellipsis/裁切/滚动条）；约 `320ms` 延迟、即时关闭、`pointer-events:none`、关闭事件与页面级单实例语义不变；不引入 Element Plus 多实例 Tooltip 或原生 `title`。

### 4.2 目标切换禁止旧坐标闪现（§5.2）

修复前：`watch(target)` 在有目标时直接 `applyLayout()`，新内容在 B 新位置测量完成前可能短暂沿用 A 旧坐标（旧锚点残影）。

修复后（`SnapshotTooltipHost.vue` script 部分）：

```ts
watch(
  () => props.target,
  (target) => {
    // 目标变化立即回到不可见定位态（visibility:hidden），再测量新尺寸并按新锚点一次性定位；
    // 未改变定位态下 DOM 仍参与布局，offsetWidth/Height 仍反映当前内容真实尺寸（border-box 含 padding/border）。
    posStyle.value = 'visibility:hidden'
    if (target) void applyLayout()
  },
  { flush: 'post', immediate: true },
)
```

行为：目标从 A 快速切换 B 后 Host 立即进入不可见定位态；`applyLayout()` 在 `nextTick()` 后读当前内容 offsetWidth/Height 与 `window.innerWidth/innerHeight`，经 `computeTooltipPlacement(target.anchor,…)` 计算后一次性写 `left…top…` 显示于 B 锚点。目标为空、页面隐藏、滚动、resize、数据替换和卸载仍即时关闭；快速扫过多行 DOM 与视觉上始终最多 1 个 Tooltip，不出现旧坐标残影。

## 5. R1-01 真实浏览器测量

取证：Headless Chrome 148 + puppeteer-core；页面 `http://127.0.0.1:5173/monitor/data-source-state`；数据为开发库既有只读样例（最长 `CLIENT_DESC` 152 字）。详见 `evidence/…/R1/browser/tooltip-single-line-1920.png`、`tooltip-extreme-wrap.png`、`tooltip-switch-position.json`、`summary.md`。

- **普通长文本（1920×1080）**：152 字 `CLIENT_DESC` 自然宽度 **1832px**（> 原 420px 上限、< 安全视口 1920−16）；最终 Tooltip `w=1832 h=34`、**单行（lines=1）**、`overflowH=false`、`inVp=true`（left 8 / right 1840，与视口左、右各留 8px 安全间距）——不再被 420px 截断换行。
- **极端长文本（1280 视口）**：安全视口 = `1280−16 = 1264px`；自然宽度超安全视口，最终 Tooltip `w=1264 h=53`、**2 行换行（lines=2）**、`overflowH=false`、`inVp=true`，全文可读不越界——仅此极端场景换行。
- **A→B 切换防旧坐标闪现（1920×1080）**：在 A（长描述 `client-desc`）与 B（状态原始值 `status`）之间快速扫 6+ 轮；任意采样时刻 `maxConcurrentHosts=1`、无 2 Host 采样；切 B 后 reveal 前 `count=0`（隐藏态）、reveal 后 `count=1` 且 rect `left=749 top=637`（B 锚点新位置）；结论 `staleGhostDuringSwitch=false`、`settledOnlyAtB=true`——无旧坐标残影、DOM/视觉单实例。

## 6. R1-02 六类请求唯一视觉映射（真实浏览器）

页面只读；浏览器层仅对列表 GET `GET /api/monitor/data-source-run-state/list` 做“延迟放行”截获在途视觉或注入一次 HTTP 500 制造失败态，取证后随脚本退出自动撤销（`request-visual-mapping.json`、`console-network-summary.json` 中逐条标记 `expected`），不修改生产代码、不篡改 Vue 内部 ref。auto 用真实 ~60s 自动周期；restore 用第二标签页 `document.visibilityState` 隐藏→恢复触发产品 `visibilityChanged` 的 restore 分支。

| 请求类型 | 触发 | 实际请求次数 | 表格遮罩 | 重试按钮 loading | 查询按钮 loading | 立即刷新 loading | 刷新圆点激活 | 对照批准基线 |
|---|---|---|---|---|---|---|---|---|
| `initial` | 页面挂载自动首次查询 | 1 | ✓（仅 initial 遮罩） | — | ✗ | ✗ | ✗ | 唯一遮罩 initial，查询/刷新稳定 |
| `retry` | 错误卡“重新加载” | 1（triggers=1） | ✗ | ✓（仅 retry） | ✗ | ✗ | ✗ | 仅重试按钮 loading |
| `query` | 点击“查询” | 1（triggers=1） | ✗ | — | ✓（仅 query） | ✗ | ✗ | 仅查询按钮 loading |
| `manual` | 点击“立即刷新” | 1（triggers=1） | ✗ | — | ✗ | ✓（仅 manual） | ✓ | 立即刷新 loading＋圆点激活 |
| `restore` | 隐藏→恢复可见补发 | 1（triggers=1） | ✗ | — | ✗ | ✗ | ✓ | 仅圆点激活；两按钮外观稳定 |
| `auto` | 60s 自动周期（实测 wait 57851ms） | 1（triggers=1） | ✗ | — | ✗ | ✗ | ✓ | 仅圆点激活；两按钮外观稳定 |

各在途状态：非发起控件（query/立即刷新）不显示 loading，以 `aria-disabled="true"`（busy 语义标记）防御鼠标与键盘，不改变外观；圆点灰色 `#c0c4cc` → 激活 `#409eff` 仅 inflight；数据行在途保留。完整逐项记录（每类 inflight/post 快照：按钮文字/颜色/背景/边框/x/y/w/h/loading/aria-disabled、圆点状态、遮罩计数、行数、最近成功刷新）见 `request-visual-mapping.json`，与批准基线唯一映射完全一致。

## 7. R1-02 请求次数、重置零请求与刷新几何

- **手动单请求**（`manual-refresh-single-request.json` + `manual-refresh-inflight.png`/`manual-refresh-success.png`）：点击一次“立即刷新”，网络层**恰好新增 1 次**按已应用条件（三项“全部”→URL 无参数）发出的列表请求；无额外查询/取消偷换/排队/补发；“查询”按钮 loading 全程 false，文字/颜色/尺寸/位置逐项不变（`queryButtonAppearanceStable=true`），`aria-disabled` busy 语义单独断言。manual 在途：仅“立即刷新”loading＋圆点激活，表格不遮罩、30 行保留；成功后按钮/圆点复位、最近成功刷新时间更新。
- **auto/restore 仅圆点**（`auto-restore-dot-only.json` + `restore-dot-only.png`/`auto-dot-only.png`）：restore（真实第二标签页隐藏→恢复）与 auto（真实等满 60s，实测 57975ms）各自 idle/inflight/post 采样：仅圆点 `is-active` 且变蓝，查询/立即刷新两按钮 loading 全程 false、视觉字段逐项相等、数据行在途保留；`restore`/`auto` 触发的确进入产品 restore/auto 分支（未篡改 Vue ref）。
- **重置零请求**（`reset-no-request.json`）：先形成“快照状态=未知状态（UNKNOWN）”非“全部”条件并查询应用（结果 6 条），点击“重置”：三下拉恢复“全部”，重置前后请求计数 **2→2（增量 0）**，已应用条件与当前结果不被重置替换、最近刷新时间保留。
- **刷新几何稳定**（`refresh-geometry.json`）：对 `idle→manual loading→success` 与 `idle→manual loading→failure`（HTTP 500）两条序列记录“立即刷新”按钮、刷新逻辑组、前方说明文字、最近成功刷新时间、错误槽位与正文区关键 x/y/w/h：全序列 **delta=0**；失败内联提示（`刷新失败，将在约 60 秒后自动重试`）出现在稳定错误槽位，不推动任何关键元素（AC-072）。

## 8. 七列表头像素宽度测量

- `column-widths.json`：1440×900 与 1920×1080 两视口下用 `Emulation.setDeviceMetricsOverride(deviceScaleFactor=1)` 测量 7 列表头像素宽，均为 **70/170/280/130/165/165/165**（`序号/探针端/源库/快照状态/快照启动时间/快照完成时间/记录更新时间`），每列 delta=0、无亚像素偏差；表宽/滚动宽 1145（1440 视口下表内横向滚动、不拉宽时间列；1920 视口无横向滚动）。截图见 `column-widths.json`（DOM 度量，非截图判读）。

## 9. 测试、类型检查、构建与原始日志

- **Tooltip 专项测试**（`frontend/` 下 `npx vitest run src/views/data-source-run-state/tooltip`）：3 文件 **28/28** 通过（`useSnapshotTooltip.spec.ts` 14、`SnapshotTooltipHost.spec.ts` 4、`tooltipPosition.spec.ts` 10）。
- **Feature 专项测试**（`src/views/data-source-run-state`）：13 文件 **126/126** 通过。
- **前端全量测试**（`npm test`，`vitest run`）：51 文件 **732/732** 通过（既有前端基准之上无删除/跳过/筛选/弱化）。
- **类型检查与构建**：`vue-tsc --noEmit` 通过；`vite build` 成功（`✓ built in 21.36s`；chunk 体积提示为既有非阻断警告，与本次改动无关）。
- 原始输出：`evidence/…/R1/frontend/{targeted-test.txt,feature-test.txt,full-test.txt,typecheck-build.txt}`。

## 10. 浏览器证据目录与逐项索引

证据目录：`docs/features/data-source-snapshot-status/evidence/DATA-SOURCE-SNAPSHOT-STATUS-UI-ADJUSTMENT-IMPLEMENTATION-001-R1/browser/`

| 文件 | 对应规则/要求 | 实测与结论 |
|---|---|---|
| `tooltip-single-line-1920.png` | R1-01；批准基线“内容优先单行” | 1920×1080 悬停 152 字长 `CLIENT_DESC`；单行 w1832/h34、lines=1、不越界、全文可读 |
| `tooltip-extreme-wrap.png` | R1-01 极端换行 | 1280 视口（安全视口 1264px）同 152 字；w1264/h53、2 行、overflowH=false、in-viewport |
| `tooltip-switch-position.json` | R1-01 A→B 防旧坐标 | 扫 6+ 轮任意采样 Host ≤1；staleGhostDuringSwitch=false、settledOnlyAtB=true |
| `column-widths.json` | 7 列固定列宽实测 | 1440/1920 均 70/170/280/130/165/165/165、delta=0 |
| `request-visual-mapping.json` | DSS-REQ-071 六类唯一视觉映射 | 逐类 inflight/post 记录，与批准基线完全一致；每类触发恰 1 次列表请求 |
| `manual-refresh-inflight.png` / `manual-refresh-success.png` / `manual-refresh-single-request.json` | 单击单请求＋按钮不闪动 | 恰新增 1 次按已应用条件请求；查询按钮 loading/外观稳定；在途与成功终态截图 |
| `restore-dot-only.png` / `auto-dot-only.png` / `auto-restore-dot-only.json` | auto/restore 仅圆点 | 仅圆点激活变蓝，两按钮 loading 全程 false、外观稳定；auto 真实等满 60s |
| `reset-no-request.json` | “重置”不查询 | 重置前后请求计数 2→2 增量 0；已应用条件与结果不被重置替换 |
| `refresh-geometry.json` | 刷新几何稳定（AC-072） | idle→loading→success 与→failure 两序列关键 x/y/w/h 全 delta=0；失败提示不推动布局 |
| `console-network-summary.json` | console/网络汇总 | 列表请求 200/200/500(注入)/200；注入 500 后收敛内联错误、无全局弹窗、无未处理 Promise；唯一 console error 为注入 500 的资源记录(expected) |
| `summary.md` | 证据清单说明 | 浏览器/视口/页面地址/服务信息/每份证据对应规则/操作与结论，区分真实后端与浏览器层临时拦截 |

## 11. 数据库、ZooKeeper、Kafka 与外部系统边界

- 未直接连接数据库，不执行 SELECT/DML/DDL，不 INSERT/UPDATE/DELETE/TRUNCATE；沿用开发库内既有只读样例数据做页面验证，未对数据库 / ZooKeeper / Kafka / 后端做任何写操作。
- 未访问或操作 ZooKeeper、Kafka、sync-client、sync-server。
- 未修改公共 HTTP 错误拦截器或接口契约；后端代码与测试未改；不运行 Maven（不把“未运行后端测试”写成通过）。
- 浏览器层临时拦截仅用于延迟放行（观察在途）或注入一次 HTTP 500（制造失败态），全部归类 `expected`、取证后自动撤销；未修改生产代码、未篡改 Vue ref。

## 12. 文档业务零差异与状态边界

- 相对批准内容基准 `575723711ca39d7761df308c1c99b1e6e957cf70` / 任务基准 `1fa26fe...`：
  - `DSS-REQ-001~071` 共 71 条业务行 **ZERO** 差异；
  - `DSS-AC-001~080` 共 80 条业务行及追踪矩阵 **ZERO** 差异，80 条全部保持 `NOT_RUN`（不写 PASS/FAIL）；
  - DESIGN/UI 已批准业务内容与追踪矩阵 **ZERO** 差异（只同步实现状态/记录/报告导航/下一入口）；
  - `API.md`、`DATABASE.md` 与初版实现报告/初版证据 **整文件 ZERO** 差异。
- 文档状态边界：`requirements_status=APPROVED`、`acceptance_status=APPROVED`、`design_status=APPROVED`、`implementation_status=IMPLEMENTED_ADJUSTMENT_PENDING_REVIEW`、`formal_acceptance_execution_status=NOT_RUN`、`human_visual_acceptance_status=NOT_RUN`、`acceptance_not_run_count=80`、`pending_user_review=NO`、`pending_user_confirmation_count=0`。实现/浏览器自测成功不等于代码复审通过、不等于正式验收或人工验收已执行或通过，不等于 `IMPLEMENTED_ACCEPTED`。

## 13. 服务运行与人工页面验收入口

- Vite dev server：PID `4615`，监听 `0.0.0.0:5173`（`/api/*` 代理到本 Feature 后端只读接口）。
- 后端：PID `4592`，`java -jar backend/target/cdc-config-platform-backend-1.0.0-SNAPSHOT.jar`，监听 `127.0.0.1:8080`（既有只读链路）。
- 预览 URL（供项目负责人人工页面目测，非正式验收）：`http://192.168.174.70:5173/monitor/data-source-state`（对外 200 可达；取证经本机 `127.0.0.1:5173`）。
- 页面保持运行至人工验收完成或要求停止；停止命令：结束 PID 4615 与 4592。

## 14. Git 提交与推送

- 仅逐个暂存白名单实际任务文件（§2.1/§2.2），不暂存用户既有无关修改；`git diff --cached --name-status` 与白名单逐项核对后普通提交，提交信息含任务编号 `…-UI-ADJUSTMENT-IMPLEMENTATION-001-R1`；随后普通推送 `origin/develop`（禁止强推）。
- 推送前再次获取远程状态确认仍可安全普通推送；推送后核验本地 HEAD、`origin/develop`、远程 `refs/heads/develop` 三者一致且 ahead/behind=`0/0`。若推送前远程前进导致无法安全普通推送，停止并报告，不覆盖远程。本次提交/推送结果与最终哈希见本报告外层的 `AGENT_TASK_RESULT` 块（result_commit_id/remote_commit_id/push_status）。

## 15. 状态声明与停止点

- 本实现任务不执行 80 条正式验收，不将实现写成正式接受，不创建项目级列表页模板，不调整其他页面。
- 下一入口：ChatGPT 从远程 Git 独立复审 R1 代码、测试与证据，然后由项目负责人人工查看页面；正式验收由后续独立正式验收任务按本轮调整后验收基线执行。
- 遗留问题/未完成项：无（正式验收与人工页面验收未执行为预期，非缺陷）。
