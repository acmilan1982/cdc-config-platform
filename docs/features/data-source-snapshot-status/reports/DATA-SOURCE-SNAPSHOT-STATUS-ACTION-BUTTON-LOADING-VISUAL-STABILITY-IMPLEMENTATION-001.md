# 实现执行报告 DATA-SOURCE-SNAPSHOT-STATUS-ACTION-BUTTON-LOADING-VISUAL-STABILITY-IMPLEMENTATION-001

- Feature：`data-source-snapshot-status`（源库快照状态）
- 任务性质：前端正式实现（“查询”与“立即刷新”两个操作按钮 Loading 视觉稳定性）+ 自动化测试 + 类型检查 + 生产构建 + 真实浏览器开发自测 + 实现状态文档同步；**不执行正式验收、不做最终收口**
- 执行日期：2026-09-14
- 分支：`develop`（任务在独立 worktree 的 `detached HEAD` 上执行）
- 任务起始提交：`9f06725d23d66e845cb5ab1d8d8d4f151401893b`（本地 HEAD 与 `origin/develop`、远程 `refs/heads/develop` 一致，ahead/behind=`0/0`）
- 批准内容基准提交：`c4d5c096a7428d7f5be1af0d776c53655dd86e26`（`DATA-SOURCE-SNAPSHOT-STATUS-ACTION-BUTTON-LOADING-VISUAL-STABILITY-BASELINE-APPROVAL-001`，批准日期 2026-09-14）
- 对应需求/验收：`DSS-REQ-088`/`DSS-REQ-089`（REQUIREMENTS §21.9）；`DSS-AC-108~113`（ACCEPTANCE §4.23，本任务结束时仍全部 `NOT_RUN`）
- 对应设计/界面：`DESIGN.md` §31、`UI.md` §25
- 结果状态：`IMPLEMENTED_ADJUSTMENT_PENDING_REVIEW`、`code_review_status=PENDING_CHATGPT_REVIEW`、`human_visual_interaction_review_status=NOT_RUN`、`browser_verification_status=DEV_SELF_TEST_DONE`（不代表代码复审通过、不代表人工视觉/交互检查已执行、不代表正式验收已执行或通过，不等于 `IMPLEMENTED_ACCEPTED`/`ACCEPTED`/`COMPLETED`）

## 1. Git 起始现场与工作区保护

- 任务开始时执行：`git status --short`、`git branch --show-current`、`git rev-parse HEAD`、`git log`、`git ls-remote`（证据 `evidence/.../git/01-base-status.txt`）。
- 起始提交 `9f06725d23d66e845cb5ab1d8d8d4f151401893b`；位于独立 worktree `/agent/dss-abl-impl-001`（`detached HEAD`），**未**在主 worktree 上实现。
- 主 worktree `/agent/cdc-config-platform` 保持 `develop@4222b0a` 及其约 116 项既有修改；本任务**未进入、未清理、未暂存、未提交、未覆盖**其中任何内容。
- 本任务未执行 `reset`/`clean`/`checkout`/`stash`/`rebase`/force push；未使用 `git add .`/`git add -A`。
- `git diff --check` 结果 CLEAN（退出码 0，证据 `evidence/.../git/02-diff-and-scope.txt`）。

## 2. 任务范围与白名单

### 2.1 实际修改（源码与测试）

| 文件 | 变更量 | 说明 |
|---|---|---|
| `frontend/src/views/data-source-run-state/components/DataSourceSnapshotQueryBar.vue` | +61 / -3 | “查询”按钮去掉 `:loading`，改为私有常驻指示器 + 独立标签节点，定宽 62px |
| `frontend/src/views/data-source-run-state/components/DataSourceSnapshotToolbar.vue` | +55 / -5 | “立即刷新”按钮同方案，定宽 110px |
| `frontend/src/views/data-source-run-state/components/DataSourceSnapshotQueryBar.spec.ts` | +112 / -4 | 断言切换到私有指示器 + `aria-busy` + 静态样式契约 |
| `frontend/src/views/data-source-run-state/components/DataSourceSnapshotToolbar.spec.ts` | +113 / -5 | 同上，含 busy 期间不二次 emit 的用例 |
| `frontend/src/views/data-source-run-state/DataSourceRunStatePage.spec.ts` | +20 / -9 | **经项目负责人明确授权**扩展的页面级 spec：原 6 处 `is-loading` 断言替换为新契约断言 |

> `DataSourceRunStatePage.spec.ts` **不在任务 §7 的 4 文件白名单内**。因该文件是页面级测试且原有断言直接依赖被本方案移除的 `is-loading` 实现，为保持测试与实现一致，已在任务执行中向项目负责人明确请示并取得 **“授权更新该 spec（推荐）”** 的明确授权后才修改；该授权仅覆盖该文件的断言同步，未扩大到任何其他页面/组件/业务代码。

### 2.2 强制零差异对象（逐一核验为零，证据 `evidence/.../git/03-zero-diff-scope.txt`）

`backend/`、`docs/baseline/`、`CLAUDE.md`、`frontend/package.json`、`frontend/package-lock.json`、`frontend/src/api/`、`frontend/src/router/`、`frontend/src/styles/`、`frontend/src/types/`、`frontend/src/views/data-source-run-state/useDataSourceSnapshot.ts`、`.../DataSourceRunStatePage.vue`、`.../components/DataSourceSnapshotTable.vue`、`.../components/DataSourceSnapshotSelects.vue`、其他组件/utils/tooltip、其他 Feature 前端代码、SQL、运行配置、`.gitignore`、既有报告与既有证据目录、任务提示词 Markdown —— 全部 `ZERO`。

未跟踪文件仅新增证据目录本身，无 `dist/` 等构建产物。

## 3. 实现映射（含旧实现删除项）

### 3.1 “查询”按钮 Loading 视觉稳定性（`DSS-REQ-088` / `DSS-AC-108/109/112/113`）

- 旧实现（删除）：`<el-button :loading="queryLoading">查询</el-button>` —— 依赖 Element Plus 默认 Loading 图标，`is-loading` 期间图标进入内容流，导致文字被推挤、按钮宽度随状态变化。
- 新实现：`el-button` 去掉 `:loading` 绑定，内部放两个并列节点 ——
  - `<span class="dss-btn-spinner" :class="{ 'is-visible': queryLoading }" aria-hidden="true">`：Feature 私有、常驻 DOM、`position:absolute` 落在左侧留白区；
  - `<span class="dss-action-label">查询</span>`：独立标签节点，四态文字恒为 `查询`。
- 静态样式契约：`.dss-q-actions .dss-query-btn { position: relative; width:62px; min-width:62px; max-width:62px; flex-grow:0; flex-shrink:0; flex-basis:62px; box-sizing:border-box; height:30px; }`；原有 `background`/`border-color`/`color`/`font-weight`/`border-radius`/`padding`/hover/focus 观感全部保留。
- 状态切换只改指示器的 `visibility`/`opacity`，不改变按钮框、不改变内容宽度、不改变相邻控件位置。

### 3.2 “立即刷新”按钮 Loading 视觉稳定性（`DSS-REQ-089` / `DSS-AC-110/111/112/113`）

- 同方案；保留既有 `width:110px; box-sizing:border-box`，并补齐 `min-width`/`max-width`/`flex-grow`/`flex-shrink`/`flex-basis` 为 `110px`（`width` 仍为首个声明）。
- “刷新信息组”（倒计时环 + 倒计时文本 + 分隔符 + “最近成功刷新 HH:mm:ss” + 按钮）保持整体不可拆分；本任务未改动其结构。

### 3.3 可访问性与状态独立性（`DSS-AC-112`）

- 指示器恒为 1 个节点且 `aria-hidden="true"`，不产生重复读屏公告。
- 按钮在自身 Loading 期间 `aria-busy="true"`，结束即移除；`aria-disabled` 既有绑定与事件级重复防护保留，未回退。
- `queryLoading` 只点亮“查询”指示器，`manualLoading` 只点亮“立即刷新”指示器；自动刷新/初始加载/失败重试均不点亮任一指示器。
- 未新增/未调用任何 Element Plus 全局覆盖（无 `.el-button`/`.el-icon`/`.is-loading` 全局改写，无 `!important`），未使用 `ResizeObserver`、轮询或任何运行时尺寸测量。

### 3.4 动效（`DSS-AC-113`）

- `@media (prefers-reduced-motion: reduce)` 下指示器 `animation: none`，但**保持静态可见**；几何零位移结论不变。

### 3.5 旧实现删除项汇总

1. 两个 `el-button` 上的 `:loading` 绑定（及其隐式 `is-loading` 类、默认 Loading 图标、`is-loading:before` 遮罩行为）已移除。
2. 旧测试中对 `is-loading`、`.el-icon`、原生 `disabled` 的断言已替换为对私有指示器可见性、标签文字与 `aria-busy`/`aria-disabled` 的断言。
3. 请求状态机、单飞控制、失败保留旧数据、自动刷新与倒计时逻辑**未改动**。

## 4. 逐文件职责

| 文件 | 职责 |
|---|---|
| `DataSourceSnapshotQueryBar.vue` | “查询”按钮 + 查询控件区；承载 62px 定宽与 `queryLoading` 指示器语义 |
| `DataSourceSnapshotToolbar.vue` | 工具栏与“立即刷新”按钮 + 刷新信息组；承载 110px 定宽与 `manualLoading` 指示器语义 |
| `DataSourceSnapshotQueryBar.spec.ts` | 查询按钮契约：无 EP 内容流 Loading、标签恒为 `查询`、常驻指示器、`aria-hidden`、`aria-busy`、62px 静态样式契约、reduced-motion |
| `DataSourceSnapshotToolbar.spec.ts` | 刷新按钮契约：同上 + `110px` + busy 期间不二次 emit `refresh` |
| `DataSourceRunStatePage.spec.ts` | 页面级集成断言同步（经授权的扩围文件）；状态独立性仍由既有页面级测试覆盖 |

## 5. 自动化测试、类型检查与构建

命令均从 `/agent/dss-abl-impl-001/frontend` 执行，原始日志见 `evidence/.../frontend/`。

| 层 | 命令 | 结果 | 原始日志 |
|---|---|---|---|
| 1 目标组件 | `npx vitest run src/views/data-source-run-state/components/DataSourceSnapshotQueryBar.spec.ts src/views/data-source-run-state/components/DataSourceSnapshotToolbar.spec.ts` | 2 文件 / **113 passed** | `01-targeted-component-specs.txt` |
| 2 Feature 全目录 | `npx vitest run src/views/data-source-run-state` | 13 文件 / **259 passed** | `02-feature-data-source-run-state.txt` |
| 3 前端全量 | `npx vitest run` | 50 文件 / **848 passed** | `03-frontend-full-vitest.txt` |
| 4 类型 + 构建 | `npx vue-tsc --noEmit`；`npm run build` | 退出码 0（无输出）；`✓ built in 16.98s` | `04-typecheck-vue-tsc-noEmit.txt`、`05-build-npm-run-build.txt` |

测试层级全部通过，无失败、无跳过。开发自测**不**被写成正式验收 `PASS`。

## 6. 真实浏览器开发验证与证据索引

- 前端代码由**本任务结果 worktree** `/agent/dss-abl-impl-001` 提供服务（Vite `--host 0.0.0.0 --port 5173`，进程 PID `17227`，cwd `/agent/dss-abl-impl-001/frontend`）；**未**使用主 worktree `4222b0a` 提供服务。
- 浏览器：真实 Chromium（`Chrome/148.0.7778.167`，headless），CDP 驱动；仅在浏览器层拦截单一 `GET /api/monitor/data-source-run-state/list`，**未**为测试在生产代码中加入任何测试开关。
- 视口：`1280×800`、`1700×920`、`1920×1080`、`2560×1440`；每视口 9 个状态（空闲 / 查询 Loading / 查询成功 / 手动 Loading / 手动成功 / 手动 Loading₂ / 手动失败 / 查询 Loading₂ / 查询失败），成功与失败路径均经由可观测的 Loading 状态。

| 验证项 | 结果 | 证据 |
|---|---|---|
| 查询按钮 x/y/w/h 四态最大位移 | `0.0px`（四视口一致；宽度恒 `62px`） | `browser/matrix.json`、`13-browser-analysis.txt` |
| 立即刷新按钮 x/y/w/h 四态最大位移 | `0.0px`（四视口一致；宽度恒 `110px`） | 同上 |
| 两标签中心最大位移 | `0.0px` / `0.0px` | 同上 |
| 邻近控件（查询/重置组）位移 | `0.0px` | 同上 |
| 查询栏高度 / 换行 | 单值（`32px`；`1280×800` 既有换行档 `70px`），子元素顶边一致、Loading 不新增换行 | 同上 |
| 指示器位置/尺寸/重叠 | 常驻 ×1、`aria-hidden=true`、与标签无重叠（间隙 查询 `2px` / 刷新 `11px`） | 同上 |
| 可访问性 | `aria-busy` 仅在自身 Loading 为 `true`；两按钮均未变为原生 `disabled` | 同上 |
| reduced-motion | `animationName=none`、指示器仍静态可见、空闲与 Loading 几何完全一致 | 同上 |
| 状态独立性 | 查询 Loading 不点亮刷新指示器，反之亦然 | 同上 |
| 自动刷新 | 未点亮任一手动指示器（等待 `59553ms`） | 同上 |
| 请求计数 | 总请求 `375`、非 GET `0`、列表 GET `26`、注入失败 `8`；1 次有效点击=1 次 GET；busy 期间 3×(点击立即刷新+点击查询)+2×Enter 仅产生 1 次请求（即开启 busy 的那次） | 同上 |
| 控制台 | 错误 `0` | 同上 |
| 其他路由样式泄漏 | `/monitor/data-source` 上 `dss-*` 节点 `0` | 同上 |
| 回归抽查（§9.5） | 18/18 通过：popper `480/400/240`、探针端 20 code point 截断、`CLIENT_DESC` 完整 Tooltip、短值无 Tooltip、重复查询参数、标签截断 + 原始值、表格单行 Tooltip、失败保留 2 行旧数据 + 失败提示、隐形冻结/恢复计数、恢复仅 1 次 GET | `browser/spot.json`、`14-browser-spot.txt` |
| 截图 | 空闲 / 查询 Loading / 手动 Loading / 查询成功 / 手动失败 / 查询失败（1920×1080） | `browser/shot-*.png` |

唯一非零几何量为刷新信息组左缘 `0.95px`（仅 `1280×800`）：成因是既有“最近成功刷新 HH:mm:ss”文本宽度在 `:11` 与 `:09/:10` 之间的字形宽度差（`140.641px` vs `139.688px`），组为右锚定故右缘位移为 `0`，且与 Loading 状态无关（`16-refresh-group-diagnosis.txt`；分析器已改为断言“右锚定边零位移 + 相同时间戳文本 ⇒ 相同组几何”）。

## 7. 零差异证明

- `DSS-REQ-001~089` 业务行：89 行全部逐字节不变（`git show HEAD:` 对比，`changed=0`）。
- `DSS-AC-001~113` 业务行与状态列：164 行全部逐字节不变，状态列仍为 `PASS 107 / NOT_RUN 6`。
- `DESIGN.md` §14.2 `89/89`、§14.3 `113/113` 映射行与标题：未在任何变更行范围内。
- `DESIGN.md` §31 / `UI.md` §25 按钮业务规则正文：变更行仅为 §1 元数据行、§31/§25 的“状态与边界”段以及文件末尾新增的实现记录；按钮业务规则正文逐字节不变。
- `API.md`：变更行仅为 §1 两行与文件末尾新增实现记录；§9 映射表与全部接口业务契约零变化（`api_contract_change_status=NONE`）。
- `DATABASE.md`：变更行仅为 §1 两行与文件末尾新增实现记录；三表投影/SQL/字段/主键/索引/约束/关联/排序/只读边界零变化（`database_contract_change_status=NONE`），本任务未访问数据库、未执行任何 SQL。
- `backend_code_diff=ZERO`；业务表写操作 `ZERO`；ZooKeeper 访问 `NONE`；Kafka 访问 `NONE`。
- 完整清单见 `evidence/.../git/03-zero-diff-scope.txt`、`04-frozen-region-proof.txt`。

## 8. Git 提交、推送与工作区保护

- 提交前：`git fetch origin develop`（任务 §15 授权）确认 `origin/develop` 仍为 `9f06725d23d66e845cb5ab1d8d8d4f151401893b`；若不一致则停线（本次一致）。
- 仅暂存本任务授权范围内文件（4 个白名单文件 + 经授权的 `DataSourceRunStatePage.spec.ts` + 8 份入口文档 + 本报告 + 新证据目录），未使用 `git add .`/`git add -A`。
- 单次普通 Commit，不做 amend/rebase/二次补丁提交；提交信息：
  `fix(source-snapshot): stabilize action button loading visuals [DATA-SOURCE-SNAPSHOT-STATUS-ACTION-BUTTON-LOADING-VISUAL-STABILITY-IMPLEMENTATION-001]`
- Push 前再次 fetch 复核远程仍为基线提交且可快进，随后 `git push origin HEAD:develop`（普通快进，非 force）。
- 推送后核验：本地 HEAD = `origin/develop` = `git ls-remote origin refs/heads/develop`，ahead/behind=`0/0`。
- 全程未操作 `develop` 以外分支；主 worktree 与全部既有 worktree 保持原样。

## 9. 预览 URL

- 服务：本任务结果 worktree 的 Vite 开发服务器仍在运行（PID `17227`，监听 `0.0.0.0:5173`）。
- 访问地址：`http://192.168.174.70:5173/monitor/data-source-state`
- 停止命令：`kill 17227`
- 日志：`evidence/.../browser/10-vite-dev.txt`（`.log` 原件同目录、内容逐字节相同；`.log` 被仓库 `.gitignore` 第 30 行 `*.log` 忽略，故以逐字节相同 `.txt` 纳入提交）
- 后端：`8080` 未复用、未启动（本次未启动后端；本页开发自测通过浏览器层接口拦截完成，未依赖后端或数据库）。
- 可达性边界：本机 `127.0.0.1:5173` 与 `192.168.174.70:5173` 均返回 HTTP `200`；用户侧网络可达性未由本次自测单独证明，需以项目负责人实际打开为准。

## 10. 下一步入口

- 当前下一入口：`CHATGPT_ACTION_BUTTON_LOADING_VISUAL_STABILITY_IMPLEMENTATION_REVIEW_FROM_GIT_THEN_PROJECT_OWNER_VISUAL_INTERACTION_REVIEW`
- 即：先由 ChatGPT 从远程 Git 对本次提交做独立代码与证据复审，再由项目负责人做人工视觉/交互检查。
- 本任务**未**自宣代码复审通过、**未**执行项目负责人人工检查、**未**正式执行 `DSS-AC-108~113`（该 6 条仍为 `NOT_RUN`），**未**把本轮写成 `IMPLEMENTED_ACCEPTED`/`ACCEPTED`/`COMPLETED`。
