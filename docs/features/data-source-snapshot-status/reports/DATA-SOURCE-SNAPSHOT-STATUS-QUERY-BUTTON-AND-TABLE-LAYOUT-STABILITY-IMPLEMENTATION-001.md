# 源库快照状态查询按钮与表格布局稳定性实现报告

- **任务编号**：`DATA-SOURCE-SNAPSHOT-STATUS-QUERY-BUTTON-AND-TABLE-LAYOUT-STABILITY-IMPLEMENTATION-001`
- **任务类型**：前端实现 + 开发自测（在 `5173` 正式前端落地已批准基线的两条最小定向改动）
- **执行日期**：2026-09-15
- **分支**：`develop`
- **基线**：`branch=develop`、`base_commit_id=9ba4e75fb8fae8f34ce41b3693eb0ea759ba4366`
- **隔离工作树**：`/agent/dss-query-button-table-layout-implementation-001`（detached，`HEAD=9ba4e75fb8fae8f34ce41b3693eb0ea759ba4366`）

> **本任务不等于正式验收。** 本任务只完成已批准内容在 `5173` 真实前端的代码实现与开发自测，**不执行** `DSS-AC-114~118` 正式验收、**不作**代码复审通过结论、**不替代**项目负责人人工视觉交互复核、**不作**最终接受收口、**不清理**任何 worktree。`DSS-AC-114~118` 五条新增验收仍全部 `NOT_RUN`。

---

## 1. 基线链

| 环节 | 任务编号 | 提交 |
|---|---|---|
| 内容基准（已批准实现内容） | `DATA-SOURCE-SNAPSHOT-STATUS-QUERY-BUTTON-AND-TABLE-LAYOUT-STABILITY-BASELINE-001-R1` | `46d8aeb3fc3ec332788933635c47936592b70b1e` |
| 文档批准收口 | `DATA-SOURCE-SNAPSHOT-STATUS-QUERY-BUTTON-AND-TABLE-LAYOUT-STABILITY-BASELINE-APPROVAL-001` | `9ba4e75fb8fae8f34ce41b3693eb0ea759ba4366` |
| 本任务起点（实现基线） | 本任务 | `9ba4e75fb8fae8f34ce41b3693eb0ea759ba4366` |

- `document_status=APPROVED`；实现前 `implementation_status=PENDING_FORMAL_IMPLEMENTATION_ON_5173`。
- 任务开始时已执行 `git fetch origin develop` 与 `git ls-remote origin refs/heads/develop`，远程 `develop` 严格等于 `9ba4e75fb8fae8f34ce41b3693eb0ea759ba4366`，无漂移；未执行 pull/merge/rebase 或切换任何其他基线。
- 覆盖的需求/验收条目：`DSS-REQ-090`（查询/重置成对固定宽度，扩展 `DSS-REQ-088` 口径）、`DSS-REQ-091`（真实主内容滚动容器稳定 scrollbar gutter），对应新增验收 `DSS-AC-114~118`。

---

## 2. 真实结构定位与落点选择

`frontend/src/layouts/MainLayout.vue` 的既有真实结构：

```
MainLayout.vue
└─ .main-layout
   └─ .layout-right
      ├─ HeaderBar
      └─ .content-area  ← 真实页面纵向滚动容器（既有 overflow-y: auto）
         └─ .content-card
            └─ <router-view>
               └─ DataSourceRunStatePage.vue
```

**根因（§5.2 明确要求精确，不得错误归因）**：查询结果行数变化 → `.content-area` 纵向滚动条出现/消失 → 该容器可用 `clientWidth` 变化 → Element Plus 表格按弹性策略重新分配列宽 → 表头列与数据列水平位移。

**落点结论**：`.content-area` 就是真实页面纵向滚动容器，稳定槽位必须加在它上面。**不得**把 gutter 加到 `.dss-page`、结果卡片、表格或其他子节点——这些节点没有真实页面滚动能力，在其上声明 `scrollbar-gutter` 不会消除位移。`overflow-y: auto` 保持既有值不变。

---

## 3. 代码改动（精确 diff）

改动严格限定在 §6 白名单内的两个业务源文件、两个测试文件。

### 3.1 `frontend/src/views/data-source-run-state/components/DataSourceSnapshotQueryBar.vue`（+13）

`.dss-q-actions .dss-reset-btn` 新增固定几何四值锁与稳定盒模型：

```css
.dss-q-actions .dss-reset-btn {
  width: 62px;
  min-width: 62px;
  max-width: 62px;
  flex-grow: 0;
  flex-shrink: 0;
  flex-basis: 62px;
  box-sizing: border-box;
  background: #e4e4e7;          /* 以下既有声明一行未改 */
  border-color: transparent;
  color: var(--dss-text-secondary, #3f3f46);
  font-weight: 500;
  border-radius: 6px;
  height: 30px;
  padding: 0 14px;
}
```

- 最终宽度口径：查询 `62px`、重置 `62px`、立即刷新 `110px`（立即刷新在 `DataSourceSnapshotToolbar.vue`，属零差异文件，未改动）。
- `box-sizing: border-box` 使 `62px` 为含边框外框宽度；`flex-grow: 0` / `flex-shrink: 0` 阻止被 `.dss-q-actions` 拉伸或压缩。
- **未改动**：重置按钮高度 `30px`、padding `0 14px`、颜色、透明边框、`6px` 圆角、与“查询”的 `8px` 间距、点击语义、禁用逻辑。
- **未新增**：重置按钮的 Loading 状态、Loading 指示器节点或 Loading class；既有“查询/立即刷新”的 Loading DOM、颜色与交互一行未改。
- 每个按钮只与自身稳定基线比较；**不要求**“查询”与“重置”共享绝对 `x`。

### 3.2 `frontend/src/layouts/MainLayout.vue`（+22 −1）

模板（`<script setup lang="ts">` 新增 `computed` 与 `useRoute`）：

```vue
<div class="content-area" :class="{ 'dss-stable-gutter': isDataSourceRunState }">
```

```ts
const isDataSourceRunState = computed(() => route.name === 'DataSourceRunState')
```

样式（追加在既有 `.content-area` 规则之后，既有 `.content-area` 声明一行未改）：

```css
.content-area.dss-stable-gutter {
  scrollbar-gutter: stable;
}
```

- 私有 class `dss-stable-gutter` 仅当 `route.name === 'DataSourceRunState'` 时挂载；路由切换时由 Vue 响应式 class 绑定实时增删；其他路由保持浏览器默认行为。
- 通用 `.content-area` **不**声明 `scrollbar-gutter`（无任何无条件 `stable`）。
- **未使用**：`window.innerWidth` / `clientWidth` 计算、`ResizeObserver`、`MutationObserver`、轮询、运行时 padding/margin 宽度补偿。
- **未使用**：`overflow-y: scroll` 永久强制滚动条。
- **未修改**：`router/index.ts`、`App.vue`、全局样式、Element Plus 样式、表格列宽策略、“共 N 条”文案、支持视口下界 `viewport width >= 1280px`。

### 3.3 测试文件

- `frontend/src/layouts/MainLayout.spec.ts`（**新增**，10 个用例）
- `frontend/src/views/data-source-run-state/components/DataSourceSnapshotQueryBar.spec.ts`（**修改**，追加“重置按钮固定几何（`DSS-REQ-091`）”describe 块，92 → 103 个用例）

---

## 4. 测试与构建（真实命令、退出码与统计）

命令均在 `/agent/dss-query-button-table-layout-implementation-001/frontend` 下执行，使用仓库既有 `package.json` 脚本；本任务**未**执行 `npm install`、未新增/调整任何依赖、未修改锁文件。

| # | 范围 | 命令 | 结果 | 退出码 | 日志 |
|---|---|---|---|---|---|
| 1 | QueryBar 定向 | `npx vitest run src/views/data-source-run-state/components/DataSourceSnapshotQueryBar.spec.ts` | `Test Files 1 passed (1)` / `Tests 103 passed (103)` / `15.65s` | `0` | `evidence/.../records/targeted-querybar.txt` |
| 2 | MainLayout 定向 | `npx vitest run src/layouts/MainLayout.spec.ts` | `Test Files 1 passed (1)` / `Tests 10 passed (10)` / `2.28s` | `0` | `records/targeted-mainlayout.txt` |
| 3 | Feature 全量 | `npx vitest run src/views/data-source-run-state` | `Test Files 13 passed (13)` / `Tests 276 passed (276)` / `16.92s` | `0` | `records/feature-datasourcerunstate.txt` |
| 4 | 前端全量 | `npm test`（`vitest run`） | `Test Files 51 passed (51)` / `Tests 875 passed (875)` / `81.25s` | `0` | `records/frontend-full.txt` |
| 5 | 生产构建 | `npm run build` | `✓ built in 15.32s` | `0` | `records/frontend-build.txt` |

全量前端测试自基线起即为全绿（51 文件 / 875 用例），本任务未引入任何失败，因此不存在需要复现的既有基线失败，也未修复任何范围外问题。

### 4.1 测试断言覆盖要点

- **QueryBar（§7.1）**：“查询”按钮 `width`/`min-width`/`max-width`/`flex-basis` 均为 `62px`；“重置”按钮四属性均为 `62px`，且**删除任一属性或改变其取值都会使测试失败**；动作组不拉伸/压缩两个按钮；重置无 Loading DOM、无 Loading class、无 Loading 状态输入；点击重置仍只恢复三个“全部”且不发查询；“查询”按钮既有 Loading DOM、ARIA 与文字稳定性测试零回归。
- **MainLayout（§7.2）**：在**单个已挂载实例**上通过 `router.push` 真实切换路由——`DataSourceRunState` 下 `.content-area` 带 Feature 私有 class；切到其他 7 个具名路由及一个无名路由后 class 移除；切回后恢复；该私有 class 的 scoped CSS 真实声明 `scrollbar-gutter: stable`；通用 `.content-area` 无无条件 `stable`；无 `overflow-y: scroll`、无 observer、无运行时宽度补偿。**不是**两个互不相关的静态字符串快照。

---

## 5. 真机 Chromium 验证

### 5.1 版本证明（不以 HTTP 200 代替）

- `frontend_port=5173`（`--host 0.0.0.0 --port 5173 --strictPort`，**未**漂移到 5174）、`backend_port=8080`、`page_url=http://192.168.174.70:5173/monitor/data-source-state`。
- 启动前已检查 5173/5174/8080 的监听 PID、命令行、用户与 `/proc/<PID>/cwd`，无未知或其他项目占用，未执行模糊 kill。
- 进程归属证明：`port_5173_pid=20567`（`node .../frontend/node_modules/.bin/vite`，cwd `.../frontend`，`cwd_matches_worktree=yes`）、`port_8080_pid=20509`（`java -jar target/cdc-config-platform-backend-1.0.0-SNAPSHOT.jar --server.port=8080`，cwd `.../backend`，`cwd_matches_worktree=yes`）。
- 工作树 HEAD 证明：`head=9ba4e75fb8fae8f34ce41b3693eb0ea759ba4366`。
- **所服务源码字节证明**（Vite `?raw` 模块还原后与工作树文件逐字节比对）：

| 文件 | 本地字节 | 服务字节 | sha256（本地 = 服务） | `byte_identical` |
|---|---|---|---|---|
| `src/layouts/MainLayout.vue` | `2321` | `2321` | `49068b959e98556e160989ece5a2cfca7660b89afba30fec006b285aed6aa01d` | `true` |
| `src/views/data-source-run-state/components/DataSourceSnapshotQueryBar.vue` | `26563` | `26563` | `3406bc326bf205aaa444dea3ef2bd30558498cea7e28f98c6ecf2e902b8ab4be` | `true` |

- 服务端模块图与 scoped 样式：`module_transformed_gutter_class_occurrences=2`、`scoped_style_contains_scrollbar_gutter_stable=true`、`scoped_style_contains_gutter_selector=true`、`scoped_style_unconditional_stable_on_content_area=false`。
- 证据：`records/browser-version-proof.txt`、`versions/version-proof.txt`（脚本 `scripts/version-proof.sh` 可独立重放）。
- 浏览器：`Google Chrome 148.0.7778.167`（系统 `/usr/bin/google-chrome`），Node `v24.17.0`，**零 npm 依赖** CDP 客户端（本仓库任何位置均未安装 playwright/puppeteer）。`versions/cdp-version.json`、`versions/chrome-version.txt`、`versions/node-version.txt`。

### 5.2 四视口 × 长短结果（真实页面 GET 查询）

视口：`1280x800`、`1700x920`、`1920x1080`、`2560x1440`（`devicePixelRatio=1`）。

- 长结果：缺省查询，真实 `30` 行，`.content-area` 出现真实纵向滚动需求。
- 短结果：真实筛选条件 `clientId=hosp-012`，真实 `1` 行，`.content-area` 无纵向溢出。
- 采样方式 `samplingMode=REAL_PAGE_GET_QUERY`；**未**删除 DOM 行、**未**伪造 CSS 高度、**未**修改响应、**未** monkey-patch `fetch`、**未**裁剪截图。

| 视口 | 状态 | 行数 | `clientWidth` | `scrollHeight` | `clientHeight` | 私有 class | `scrollbarGutter` | 真实纵向滚动需求 |
|---|---|---|---|---|---|---|---|---|
| 1280x800 | LONG | 30 | `1045` | `1881` | `752` | true | `stable` | true |
| 1280x800 | SHORT | 1 | `1045` | `752` | `752` | true | `stable` | false |
| 1700x920 | LONG | 30 | `1465` | `1841` | `872` | true | `stable` | true |
| 1700x920 | SHORT | 1 | `1465` | `872` | `872` | true | `stable` | false |
| 1920x1080 | LONG | 30 | `1685` | `1841` | `1032` | true | `stable` | true |
| 1920x1080 | SHORT | 1 | `1685` | `1032` | `1032` | true | `stable` | false |
| 2560x1440 | LONG | 30 | `2325` | `1841` | `1392` | true | `stable` | true |
| 2560x1440 | SHORT | 1 | `2325` | `1392` | `1392` | true | `stable` | false |

**关键观察**：同一视口下 LONG 与 SHORT 的 `clientWidth` **完全相同**（`1045` / `1465` / `1685` / `2325`），而 `scrollHeight` 从 `1881` 降到 `752`（长结果真实溢出、短结果无溢出）。这正是 `scrollbar-gutter: stable` 预留槽位、使滚动条出现/消失不改变 `clientWidth` 的直接证据。

三按钮宽度在全部 8 个采样中恒为 查询 `62` / 重置 `62` / 立即刷新 `110`。

原始未舍入几何：`browser/raw-geometry.json`；截图：`browser/screenshots/*.png`（8 张）；采样日志：`records/browser-sampler.txt`。

### 5.3 §9.4 硬断言与机器判定

判定程序 `scripts/geometry-judge.mjs` 是**纯函数模块**（无 I/O、无页面依赖），从原始未舍入值重算，**严格使用 `=== 0`，不设任何容差**，不做 `toFixed` / `Math.round`。

| 视口 | `content_area_rect_delta` (x,y,w,h) | `content_area_client_width_delta` | 查询/重置/刷新 自矩形 delta | `query_actions_rect_delta` | 表头 7 单元格 x delta | 表头 7 单元格 width delta |
|---|---|---|---|---|---|---|
| 1280x800 | `0,0,0,0` | `0` | 各 `0,0,0,0` | `0,0,0,0` | `[0,0,0,0,0,0,0]` | `[0,0,0,0,0,0,0]` |
| 1700x920 | `0,0,0,0` | `0` | 各 `0,0,0,0` | `0,0,0,0` | `[0,0,0,0,0,0,0]` | `[0,0,0,0,0,0,0]` |
| 1920x1080 | `0,0,0,0` | `0` | 各 `0,0,0,0` | `0,0,0,0` | `[0,0,0,0,0,0,0]` | `[0,0,0,0,0,0,0]` |
| 2560x1440 | `0,0,0,0` | `0` | 各 `0,0,0,0` | `0,0,0,0` | `[0,0,0,0,0,0,0]` | `[0,0,0,0,0,0,0]` |

判定结果：`checks=114 passed=114 failed=0`，`JUDGEMENT=PASS`。证据：`browser/judgement.json`、`records/browser-judgement.txt`。

判定同时覆盖：四视口 × 两状态采样数 4/4；重置按钮四属性计算值必锁 `62px`；长/短两态均存在路由私有 class 且计算值 `stable`；长态确有真实纵向滚动需求且 `overflow-y=auto`；表头 7 单元格存在且宽度非零、标签一致；§9.5 路由隔离 4 探针；§9.5 重置语义；§9.5 在途帧稳定性。

### 5.4 §9.5 路由隔离与交互回归

路由隔离（4 探针）：

| 路径 | 期望私有 class | 实际 | `scrollbar-gutter` 计算值 | `overflow-y` | `className` |
|---|---|---|---|---|---|
| `/config/data-source` | false | false | `auto` | `auto` | `content-area` |
| `/config/client` | false | false | `auto` | `auto` | `content-area` |
| `/monitor/cdc-node` | false | false | `auto` | `auto` | `content-area` |
| `/monitor/data-source-state` | true | true | `stable` | `auto` | `content-area dss-stable-gutter` |

其他路由既无私有 class、计算值也未被全局强制为 `stable`（为 `auto`），切回目标路由后恢复——无样式泄漏。

重置语义与交互回归：

- 初始自动查询正常；条件查询得到短结果（1 行）。
- 重置只恢复条件、**不**立即发请求（`listRequestsImmediatelyAfterReset=0`，重置后仍为 1 行，三个筛选恢复为“全部”）；重置后点击“查询”恢复长结果（30 行，`listRequestsDeltaOnPostResetQuery=1`）。
- 在途帧稳定性：`42` 帧采样，“查询”按钮矩形逐字段完全一致，文字恒为 `查询`；“重置”文字恒为 `重置`；“立即刷新”文字恒为 `立即刷新`，且**未**因查询 Loading 而出现刷新按钮指示器（`refreshSpinnerVisible` 全帧为 false）。
- `consoleErrors=[]`（0）；网络 `total=238`、`nonGet=[]`（0 个非 GET 请求，页面无写操作）、`listApiGetCount=13`。
- 既有单飞、查询下拉固定宽度、长文本截断、Tooltip 均无回归（对应既有测试在全量 875 用例中全绿）。

### 5.5 §10 负向自证

- 真实运行：`judge-run.mjs`（无注入）→ `checks=114 passed=114 failed=0`，`JUDGEMENT=PASS`，子进程退出码 `0`。
- 负向自证：`judge-run.mjs --inject-px 0.001` 向 `longSamples[0].contentArea.rect.x` 注入 `+0.001px`（`220` → `220.001`），**共用同一纯判定函数**：

```
checks=114 passed=113 failed=1
FAIL [1280x800] content_area_rect_delta_zero :: {"x":-0.0010000000000047748,"y":0,"width":0,"height":0}
NEGATIVE_CONTROL_JUDGEMENT=FAIL
```

子进程退出码 `1`（真实非零）。构造数据已标注 `NEGATIVE-CONTROL` 与 `DO-NOT-USE-AS-EVIDENCE`。证明判定程序不是“只打印差值恒返回 0”。证据：`records/strict-harness-exit-codes.txt`、`browser/judgement-negative-control.json`、`records/browser-negative-control.txt`。

---

## 6. 数据库 / ZooKeeper / Kafka

- `database_access_status=READ_ONLY_FOR_PAGE_VERIFICATION`：页面通过后端执行真实只读查询（`listApiGetCount=13`），未执行任何 DML/DDL，未构造测试数据。
- `database_write_status=ZERO`；`zookeeper_environment_status=AVAILABLE`；`feature_zookeeper_dependency=NONE`；`task_initiated_zookeeper_operation_status=NONE`（未主动执行 ZK CLI、未读写节点或 ACL）；`kafka_access_status=NONE`。
- 后端后台组件若自然建立 ZK 会话，仅作为应用后台行为记录，**不**写成该页面的依赖。

---

## 7. 文档状态同步与冻结边界

### 7.1 8 份入口文档状态

`docs/features/README.md` 与 `docs/features/data-source-snapshot-status/{README,REQUIREMENTS,ACCEPTANCE,DESIGN,UI,API,DATABASE}.md` 已统一同步为：

```text
query_button_and_table_layout_stability_document_status=APPROVED
query_button_and_table_layout_stability_implementation_status=IMPLEMENTED_ADJUSTMENT_PENDING_REVIEW
query_button_and_table_layout_stability_code_review_status=PENDING_CHATGPT_REVIEW
query_button_and_table_layout_stability_human_visual_interaction_review_status=NOT_RUN
query_button_and_table_layout_stability_acceptance_status=NOT_RUN
query_button_and_table_layout_stability_acceptance_not_run_count=5
pending_user_review=NO
pending_user_confirmation_count=0
current_next_entry=CHATGPT_QUERY_BUTTON_AND_TABLE_LAYOUT_STABILITY_IMPLEMENTATION_REVIEW_FROM_GIT_THEN_PROJECT_OWNER_VISUAL_INTERACTION_REVIEW
```

实现前旧值 `implementation_status=PENDING_FORMAL_IMPLEMENTATION_ON_5173` 与 `code_review_status=NOT_RUN` 均已保留为带日期、带任务编号（`DATA-SOURCE-SNAPSHOT-STATUS-QUERY-BUTTON-AND-TABLE-LAYOUT-STABILITY-IMPLEMENTATION-001`）、标注“已处理”“不构成当前直接值”的历史值，**不再**充当无条件的当前值。原实现任务入口已降级为历史值，当前 `next_entry` 指向 ChatGPT 从远程 Git 的实现复审 + 项目负责人人工视觉交互复核。

### 7.2 §13 冻结证明（相对基准 `9ba4e75fb8fae8f34ce41b3693eb0ea759ba4366`）

| 冻结项 | 结果 |
|---|---|
| `DSS-REQ-001~091` 需求业务行 | `91/91` 逐字节相同（diff 0） |
| `DSS-AC-001~118` 验收业务行与状态列 | `118/118` 逐字节相同（diff 0） |
| 验收统计 | 仍为 `PASS 113 / FAIL 0 / BLOCKED 0 / NOT_RUN 5` |
| `DSS-AC-114~118` | 五条全部 `NOT_RUN` |
| DESIGN §14.2 / §14.3 映射行 | 逐字节相同，追踪 `91/91`、`118/118` |
| DESIGN §38 / UI §32 已批准业务正文 | 逐字节相同（仅更新状态、实现记录与下一入口） |
| API / DATABASE 契约正文 | 逐字节相同 |
| 既有报告与证据 | 零差异 |

`docs/` 全部 diff 切片仅落在每份文档的 3 处：分层状态行、下一入口行、文档尾部追加的实现记录块。无任何需求/验收业务行、映射行、设计正文或契约正文被改动。

---

## 8. Git 与工作树

- 起点与终点均在本任务隔离 worktree（detached `9ba4e75fb8fae8f34ce41b3693eb0ea759ba4366`），未进入、修改、reset、stash、clean 或删除主工作树 `/agent/cdc-config-platform` 及其他任何既有 worktree。
- 任务前后已以程序方式比对全部既有 worktree 的路径、HEAD、分支/detached 状态与修改数，均保持不变。
- 本任务提示词 Markdown **未**提交进项目仓库。

### 8.1 变更文件（白名单）

**业务源（2）**

- `frontend/src/layouts/MainLayout.vue`
- `frontend/src/views/data-source-run-state/components/DataSourceSnapshotQueryBar.vue`

**测试（2）**

- `frontend/src/layouts/MainLayout.spec.ts`（新增）
- `frontend/src/views/data-source-run-state/components/DataSourceSnapshotQueryBar.spec.ts`

**入口文档（8）**

- `docs/features/README.md`
- `docs/features/data-source-snapshot-status/README.md`
- `docs/features/data-source-snapshot-status/REQUIREMENTS.md`
- `docs/features/data-source-snapshot-status/ACCEPTANCE.md`
- `docs/features/data-source-snapshot-status/DESIGN.md`
- `docs/features/data-source-snapshot-status/UI.md`
- `docs/features/data-source-snapshot-status/API.md`
- `docs/features/data-source-snapshot-status/DATABASE.md`

**新报告（1）**

- `docs/features/data-source-snapshot-status/reports/DATA-SOURCE-SNAPSHOT-STATUS-QUERY-BUTTON-AND-TABLE-LAYOUT-STABILITY-IMPLEMENTATION-001.md`

**新证据（32 个文件，约 1.36 MiB）**

- `docs/features/data-source-snapshot-status/evidence/DATA-SOURCE-SNAPSHOT-STATUS-QUERY-BUTTON-AND-TABLE-LAYOUT-STABILITY-IMPLEMENTATION-001/**`

**零差异**：`backend/**`、SQL、配置、依赖与锁文件；`frontend/src/router/index.ts`、`frontend/src/App.vue`、`DataSourceRunStatePage.vue`、`DataSourceSnapshotToolbar.vue`、`DataSourceSnapshotTable.vue`、`useDataSourceSnapshot.ts`、`frontend/src/types/**`、`frontend/src/api/**`、`frontend/src/styles/**`、`frontend/package.json`、`frontend/package-lock.json`。未新增白名单外文件，未制造无谓差异。

### 8.2 证据可重放性

`evidence/.../scripts/` 下为可独立重放的脚本：`version-proof.sh`（版本与所服务源码字节证明）、`cdp-client.mjs`（零依赖 CDP 客户端）、`sample-browser.mjs`（四视口长短结果真实采样）、`geometry-judge.mjs`（纯判定函数）、`judge-run.mjs`（真实运行与负向自证）、`run-browser-verification.sh`（端到端编排）。原始未舍入 JSON、判定输出、截图与版本证明均已入库。有界文本记录以 `.txt` 形式保留在 `records/` 下（未直接提交持续增长的 `.log`；目录名刻意不使用 `.gitignore` 第 29 行全局忽略的 `logs/`，否则证据无法入库），全部为有界、脱敏、无行尾空白的文本。

---

## 9. 未执行项与下一步

**本任务未执行**：

- `DSS-AC-114~118` 五条新增验收的正式验收执行（仍全部 `NOT_RUN`）。
- 代码复审通过结论（`code_review_status=PENDING_CHATGPT_REVIEW`）。
- 项目负责人人工视觉交互复核（`human_visual_interaction_review_status=NOT_RUN`）。
- 最终接受收口；未写 `IMPLEMENTED_ACCEPTED`。
- 未创建任何后续正式验收任务；未清理任何 worktree。

**当前状态**：`implementation_status=IMPLEMENTED_ADJUSTMENT_PENDING_REVIEW`。

**下一入口**：

```text
CHATGPT_QUERY_BUTTON_AND_TABLE_LAYOUT_STABILITY_IMPLEMENTATION_REVIEW_FROM_GIT_THEN_PROJECT_OWNER_VISUAL_INTERACTION_REVIEW
```

即：ChatGPT 从远程 Git 对本实现做代码复审，再由项目负责人对 `5173` 正式页做人工视觉交互复核；随后另立任务执行 `DSS-AC-114~118` 共 5 条新增验收。

---

## 10. 正式验收环境（保留运行）

| 项 | 值 |
|---|---|
| 前端 PID | `20567` |
| 后端 PID | `20509` |
| 前端命令 | `node node_modules/.bin/vite --host 0.0.0.0 --port 5173 --strictPort`，cwd `/agent/dss-query-button-table-layout-implementation-001/frontend` |
| 后端命令 | `java -jar target/cdc-config-platform-backend-1.0.0-SNAPSHOT.jar --server.port=8080`，cwd `/agent/dss-query-button-table-layout-implementation-001/backend` |
| 验收 URL | `http://192.168.174.70:5173/monitor/data-source-state` |
| 日志目录 | `/tmp/dss-query-button-table-layout-implementation-001/` |
| 停止命令 | `kill 20567 20509` |

两个进程均属于本任务隔离 worktree，`/proc/<PID>/cwd` 已核验；因需供项目负责人人工视觉交互复核，**保持运行**。

---

## 11. ChatGPT R0 复审与 R1 定向纠正记录（2026-09-15，`DATA-SOURCE-SNAPSHOT-STATUS-QUERY-BUTTON-AND-TABLE-LAYOUT-STABILITY-IMPLEMENTATION-001-R1`）

本节由 R1 定向纠正任务**追加**。本文件以上全部原有字节在基准提交 `d77e174a912daf852837c9658f13672918fc766e` 中保持完整前缀、逐字节不变，无删除、无替换、无就地修改（证明见 §11.5）。

### 11.1 ChatGPT 从远程 Git 的 R0 复审结论

- `chatgpt_r0_review_status=CHANGES_REQUIRED_DOCUMENT_TRACEABILITY_AND_CURRENT_STATUS_ONLY`——**仅**要求纠正需求编号引用与文档当前事实；
- `business_implementation_review_status=CORRECT_AND_PRESERVED`——业务实现被判为正确并保留，**不被推翻**；
- `browser_evidence_review_status=APPROVED_FOR_IMPLEMENTATION_REVIEW`——R0 浏览器证据被认可，**不重跑**。

### 11.2 本报告内的需求编号引用错误（只在 R1 记录中说明，**不回改原文字节**）

- §3.3 实现文件清单中写为：`frontend/src/views/data-source-run-state/components/DataSourceSnapshotQueryBar.spec.ts`（**修改**，追加“重置按钮固定几何（`DSS-REQ-091`）”describe 块，92 → 103 个用例）。
- 该引用**错误**：查询/重置按钮固定宽度属于 `DSS-REQ-090`，不属于 `DSS-REQ-091`；**正确值应为 `DSS-REQ-090`**。
- 同一 §3.2、§3.3 中 `frontend/src/layouts/MainLayout.vue` 与 `MainLayout.spec.ts` 的“真实主内容滚动容器稳定 scrollbar gutter”描述对应 `DSS-REQ-091`，该对应关系本来就正确，R1 未改动其业务含义。
- 按 R1“只追加、不改写原文字节”的约束，上述错误引用保留在本节之前的历史字节中；其正确口径以本节为准。

### 11.3 该错误的影响边界

- 只影响**需求编号的文字引用**，不涉及任何可执行逻辑、CSS 声明、断言、测试步骤、fixture 或 mock；
- 不改变业务实现与 CSS（“查询”/“重置”`62px`、“立即刷新”`110px`；`scrollbar-gutter: stable` 仅作用于 `DataSourceRunState` 路由的真实主内容滚动容器 `.content-area`）；
- 不改变 R0 浏览器几何实测结果（四档视口长/短两态 `clientWidth` 逐档完全相等、七列表头 `x`/`width` 差值全 `0`、查询/重置/立即刷新三按钮自矩形差值全 `0`、机器判定 `114/114 PASS`、`0.001px` 负向注入退出码 `1`）；
- 不改变验收基线（既有 `DSS-AC-001~113` 仍 `PASS 113 / FAIL 0 / BLOCKED 0 / NOT_RUN 0`；`DSS-AC-114~118` 仍全部 `NOT_RUN`）。

### 11.4 R1 同时执行的文档当前事实纠正

8 份入口文档（`docs/features/README.md` 与 `docs/features/data-source-snapshot-status/` 下 `README.md`、`REQUIREMENTS.md`、`ACCEPTANCE.md`、`DESIGN.md`、`UI.md`、`API.md`、`DATABASE.md`）中，本轮状态由实现前口径的当前语气改为带日期与任务编号、且注明“已由实现任务处理完毕”的历史事实。当前事实统一为：

```text
query_button_and_table_layout_stability_document_status=APPROVED
query_button_and_table_layout_stability_implementation_status=IMPLEMENTED_ADJUSTMENT_PENDING_REVIEW
query_button_and_table_layout_stability_code_review_status=PENDING_CHATGPT_REVIEW
query_button_and_table_layout_stability_human_visual_interaction_review_status=NOT_RUN
query_button_and_table_layout_stability_acceptance_status=NOT_RUN
query_button_and_table_layout_stability_acceptance_not_run_count=5
pending_user_review=NO
pending_user_confirmation_count=0
```

统一下一入口更新为 `CHATGPT_QUERY_BUTTON_AND_TABLE_LAYOUT_STABILITY_IMPLEMENTATION_R1_REVIEW_FROM_GIT_THEN_PROJECT_OWNER_VISUAL_INTERACTION_REVIEW`；R0 入口 `CHATGPT_QUERY_BUTTON_AND_TABLE_LAYOUT_STABILITY_IMPLEMENTATION_REVIEW_FROM_GIT_THEN_PROJECT_OWNER_VISUAL_INTERACTION_REVIEW` 保留为 2026-09-15 R0 实现提交后的历史入口，已由本 R1 纠正任务处理，不构成当前直接值。

### 11.5 追加写入证明（append-only）

| 项 | 值 |
|---|---|
| 基准提交 | `d77e174a912daf852837c9658f13672918fc766e` |
| 追加前字节数（基准提交） | `23728` |
| 追加前 SHA-256（基准提交） | `4ec9764ccc62b3a1afad5cb2dd67de1d153898e9a396975b8b879364fa2eb9a5` |
| 原有字节为追加后文件的完整前缀 | `true`（逐字节前缀比较证明，见 R1 证据 `scripts/verify-report-append-only.py`） |
| 追加后字节数与 SHA-256 | 记于 R1 证据 `records/append-only-proof.txt`（文件无法内嵌自身哈希，故不写入本文件） |
| `git diff --numstat` 删除行数 | `0` |

R1 未推翻、未重跑 R0 业务实现与浏览器证据；`DSS-AC-114~118` 共 5 条仍全部 `NOT_RUN`。**实现完成不等于代码复审通过、不等于本轮 5 条新增验收已执行、不等于最终接受收口**；本轮以 ChatGPT 从远程 Git 的 R1 实现复审与项目负责人对 `5173` 的人工视觉交互复核为下一入口。
