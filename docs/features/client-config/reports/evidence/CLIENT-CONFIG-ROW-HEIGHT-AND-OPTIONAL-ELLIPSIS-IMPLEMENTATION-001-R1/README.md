# 第七轮行高与三点入口可选样式实现 R1 · 真实 100%/125% 浏览器缩放证据索引（脱敏）

本目录为任务 `CLIENT-CONFIG-ROW-HEIGHT-AND-OPTIONAL-ELLIPSIS-IMPLEMENTATION-001-R1` 的**脱敏、可追溯**证据。

## 本轮定位与复审意见勘误

- 实现任务 `...IMPLEMENTATION-001`（`d93f838be359d71ef373082a6c3a62046912b1a1`）的既有证据用 `1152×720` **较窄视口**模拟 1440×900 下的“125% 缩放等效”，只能证明**窄布局**表现，**不能**证明**真实浏览器页面缩放**表现；`CCFG-AC-156` 要求的是后者。R1 因此**优先补齐真实 100% 与 125% 页面缩放证据**。
- **勘误**：上一轮 ChatGPT 复审最初还把“三点入口缺禁用态样式”列为缺陷；经项目负责人追问后已**撤回**该项。现行探针页**三点触发器本身无禁用场景**（提交处理中禁用的是**菜单条目**）。R1 **未**为凑状态禁用三点入口、**未**改变业务行为。
- 数据源管理 `/config/data-source` 的“更多”**文字**入口**不在**本任务迁移；该页在本轮为**只读对照**、文件**未修改**。
- **本轮无任何产品代码改动**：真实缩放复测未出现可复现缺陷，故不为形成 diff 而改业务代码。

## 关键结论（一句话）

真实浏览器页面缩放 100% 与 125% 下，`/config/client` 主列表**实际启用**的三点入口命中区、hover、打开/关闭菜单、跨行隔离、固定操作列滚动表现与**内嵌焦点环四边完整可见**均通过；常规行高只随缩放取整（48 → 47.8 CSS px），**未**因入口额外撑高；只读对照页 `/config/data-source` 结构、行高与“更多”文字入口**零变化**。

## 真实缩放机制与生效证明（区别于“等效视口”）

- **机制**：加载一个**未打包 MV3 辅助扩展**（`zoom-helper-extension/`，仅 `tabs` 权限、无网络/无页面访问/无存储），由 CDP 驱动其 Service Worker 调用 **`chrome.tabs.setZoom()`**——与浏览器缩放 UI 相同的**按标签/按站点页面缩放**通路。`sw.js` 自身不含任何逻辑。
- **浏览器**：Playwright 随附的**无品牌 Chromium**（Chrome for Testing `147.0.0.0`）。系统安装的**有品牌 Google Chrome 会忽略 `--load-extension`**（实测 `"--load-extension is not allowed in Google Chrome, ignoring."`），无法用于本证据。
- **固定窗口/显示环境**：`Xvfb/Xorg :99` 虚拟显示 `1440×900`，浏览器窗口固定在 `(0,0)`、尺寸 `1440×900`（`windowRequested=1440×900`），全过程中**窗口尺寸不变**。
- **可核查生效证据**（`real-zoom-summary.json.zoomLegs`、`.toggle`）：

| 页面缩放 | `chrome.tabs.getZoom()` | `devicePixelRatio` | `innerWidth` | `outerWidth` | 命中区 CSS px | 命中区物理 px |
|---|---|---|---|---|---|---|
| 100% | `1` | `1` | `1439` | `1439` | `28×28` | `28×28` |
| 125% | `1.25` | `1.25` | `1151` | `1439` | `28×28` | `35×35` |

- 同一窗口内 `100% → 125% → 100%` 往返，`chrome.tabs.getZoom` 与 `devicePixelRatio` 同步变为 `1/1` → `1.25/1.25` → `1/1`，`outerWidth` 恒为 `1439`。
- 由此：**页面缩放同时改变 `devicePixelRatio`（1 → 1.25）与 CSS 视口宽度（1439 → 1151），而窗口/物理像素不变**。这与下列三者有本质区别，**均不构成本证据**：
  - 只把 viewport 改成 `1152×720`（`devicePixelRatio` 仍为 1，等价窄布局）；
  - 只改 `deviceScaleFactor`（不改变页面缩放与 CSS 视口）；
  - 只做 CSS `transform: scale(...)`（不改变布局视口与命中区 CSS 尺寸）。
- 125% 下 `28 CSS px` 命中区落在 **`35` 物理像素**上——这正是“真实缩放（改物理像素密度）”与“窄视口（只改 CSS 布局宽度）”的分水岭。

## 为什么像素证据用的是真实屏幕截图而非浏览器截图

- Chrome `Page.captureScreenshot`（CDP）在页面缩放 `Z` 下**只能覆盖 `innerWidth/dpr` 个 CSS px**（125% 实测 `1151/1.25 = 920.8` CSS px ≈ CSS 视口的左侧 80%），`captureBeyondViewport` 与 `clip.scale` **均不改变**该边界。
- 三点入口位于**贴右边缘的固定操作列**（125% 下触发器中线约在 CSS `x≈969`），**落在**上述 `920.8` 之外，故**任何 CDP 截图都取不到它**。
- 因此像素证据改用**真实显示捕获**：`gnome-screenshot -f`（X11 根窗口，真实物理像素），并以**注入的定标色标**自标定映射 `screen = origin + css × devicePixelRatio`（`originY ≈ 87` 物理像素 = 浏览器窗口装饰高度）。该限制与后果记录在 `real-zoom-summary.json.cdpCaptureLimitation`。

## 内容

| 文件 | 说明 |
|---|---|
| `zoom-real-100-125.mjs` | 主证据脚本：真实缩放设置（扩展 SW + `chrome.tabs.setZoom`）、`100%→125%→100%` 往返证明、逐行测量、真实键盘 Tab 焦点计算样式、真实屏幕捕获的焦点环像素探针、hover、打开/关闭菜单、跨行与固定列探针、只读对照页核对 |
| `zoom-helper-extension/manifest.json`、`zoom-helper-extension/sw.js` | 辅助扩展（`tabs` 权限；`sw.js` 不读写任何内容，仅提供 `chrome.tabs.setZoom` 可调用的扩展上下文） |
| `real-zoom-results.json` | 合并的机读结果（脱敏）：`100`/`125` 两套完整逐行/逐探针原值与缩放证明 |
| `real-zoom-summary.json` | **可快速复审**的脱敏摘要：缩放生效证明、往返序列、焦点计算样式、焦点环简表、hover、固定列、点击/跨行、标签与 `+N`/ID 标记、行高、对照页 |
| `focus-ring-pixels.json` | 焦点环**物理像素**专项：四边/四角覆盖、环包围盒、盒内外像素计数、以及 1 字符/CSS px 的 ASCII 图（两缩放） |
| `SHA256SUMS.txt` | 仓库外原始产物（整屏截图等）与仓库内文件的完整 SHA-256 |

## 逐项观测（真实缩放）

### 1. 三点入口命中区与交互

- 命中区 `28×28px`、圆角 `6px`、主色 `rgb(64,158,255)`、hover 浅底 `rgb(236,245,255)`（100% 与 125% 一致）。
- 入口位于**本行操作单元格**内（`boxWithinCell=true`、`boxInsideRow=true`），**不**与相邻行重叠（`linkOverlapsNextRow=false`）。
- 点击第 1 行触发器的菜单为 `["停用","删除"]`；**命中盒下方 2 CSS px** 处点击**不**打开菜单（`noMisTriggerBelowHitBox=true`）；点击第 2 行触发器打开的是**第 2 行自己的**菜单 `["启用","删除"]`（`row1AndRow2MenusDiffer=true`），**无跨行误触**。
- **固定操作列滚动**（125%）：横向可滚（`scrollWidth 1026 > clientWidth 775`），`scrollLeft` 到 `251.2` 后触发器仍在视口内（`left 968.8 / right 996.8 < innerWidth 1151`）、`display:flex`、`visibility:visible`。

### 2. 键盘焦点与内嵌焦点环（是否被 `.cell{overflow:hidden}` 裁切）

- **真实键盘 Tab** 可达：100% 第 `7` 步、125% 第 `8` 步到达三点入口（`tabReached=true`）。
- `:focus-visible` 计算样式为 `outline: solid 2px rgb(64,158,255)` + `outline-offset: -2px`（**内嵌**）。125% 下 Chrome 报出 `1.6px / -1.6px`，按 `×devicePixelRatio` 折算仍为 **2px / -2px**（页面缩放的报告单位，非尺寸变化）。
- **物理像素探针**（`focus-ring-pixels.json`）：

| 缩放 | 命中盒（物理 px） | 盒内环像素 | 盒外像素 | 盒外最大外溢 | 四边覆盖率 上/下/左/右 | 四边完整 |
|---|---|---|---|---|---|---|
| 100% | `28×28` | `246` | `0` | `0` | `0.857 / 0.857 / 0.857 / 0.857` | `true` |
| 125% | `35×35` | `302` | `27` | `1` | `0.886 / 0.886 / 0.943 / 0.829` | `true` |

- 125% 的 `27` 个“盒外”像素**全部**落在盒子**左侧紧邻的 1 个物理像素列**（`ringOutsideSides={left:27,...}`，`ringOutsideMaxDevicePx=1`）。根因：125% 下元素左边界落在**半个物理像素**上（CSS `x=841.2 → 1051.5` 物理 px），严格整数盒（`1052`）把元素**自身半覆盖的边缘列**判为“盒外”；这是**半像素量化**，**不是**焦点环逸出元素。故同时保留严格口径（`ringFullyInsideHitBoxStrict`）与 1 物理像素容差口径（`ringFullyInsideHitBoxWithin1DevicePx=true`）。
- **四边/四角均在**：ASCII 图（`focus-ring-pixels.json.perZoom.*.ring.asciiMap`）显示两缩放下的描边为**闭合圆角矩形**，中部为三点图形。
- 结论：`:focus-visible` 描边**内嵌**于命中盒，四边完整可见，**未**被 `.cell{overflow:hidden}` 裁切。
- 附注：三点**图形本身**为当前色（主色蓝），故“蓝色像素”同时包含描边与图形；因此**裁切判定取自周长覆盖率与包围盒**，而非蓝色像素总数（`blueDevicePixelsInterior` 另记：100% `51`、125% `113`）。

### 3. 行高、标签、`+N` 与 ID 标记

- `/config/client` 共 16 行：**15 条常规行**在 100% 均为 `48` CSS px、125% 均为 `47.8` CSS px（差 `0.2` = 缩放取整，**未**因入口额外撑高）；**1 条歧义行** 100% `52` / 125% `51.8`（自适应观察组，不强制等高）。
- 标签完整且两缩放一致：红 `bad` 8 / 绿 `ok` 3 / 无标签 5。
- ID 标记：16 行**全部**有 ID 标记（`idMarkPresentAll=true`），停用标记 14 行、异常标记 1 行。
- `+N` 动态槽位完整：100% 出现 `+3`/`+6`；125% 出现 `+4`/`+6`/`+2`——CSS 视口变窄后**装得下的标签更少**，`+N` 相应增多，属既有**动态布局**预期行为，**非**缺陷、**非**裁切。
- 表头 `th` 虽同样携带 `class-name`，公共规则以 `td.el-table__cell` 限定，其内边距仍 `11px`。

### 4. 只读对照页 `/config/data-source`（未启用页，零变化）

| 缩放 | 行数 | `lt-row-action__cell` | `lt-row-action__ellipsis` | `.row-more` | 入口文本 | 常规行高 |
|---|---|---|---|---|---|---|
| 100% | `36` | `0` | `0` | `36` | `更多` | `48` |
| 125% | `36` | `0` | `0` | `36` | `更多` | `47.8` |

- 该页仍为“更多”**文字**入口，**未**挂 opt-in 类，两缩放下常规行高与 100% 基线一致（仅缩放取整）；文件**未修改**。

### 5. 零写

- **打开页面前**在网络层拦截：`/api/**` 的 `GET/HEAD/OPTIONS` 放行，`POST/PUT/PATCH/DELETE` 一律 `abort('blockedbyclient')` 并计数。本轮实测**非 GET 拦截计数 = `0`**（`real-zoom-summary.json.writesBlocked=0`）。
- 未访问或写入数据库／ZooKeeper／Kafka；未执行业务写操作。

## 脱敏处理

- `real-zoom-results.json`／`real-zoom-summary.json`／`focus-ring-pixels.json` 中探针业务 ID 一律按行序替换为 `S01..Sn`；元素类名中的 Element Plus 内部列序号 `el-table_<n>_column_<m>` 归一为 `el-table_N_column_N`。
- ID 标记只记**存在与否**，**不**抓取可见 ID 文本。
- **不**含数据库连接信息、内网主机/端口、账号口令或令牌、真实业务数据、原始截图。
- 含真实业务数据的**整屏截图**（`screen-zoom100.png`／`screen-zoom125.png`／`screen-datasource-zoom125.png`／`ring-*-calib.png`）**不入仓**，打包为 `/agent/CLIENT-CONFIG-ROW-HEIGHT-AND-OPTIONAL-ELLIPSIS-IMPLEMENTATION-001-R1-evidence.tar.gz` 供项目负责人在仓库外核对；SHA-256 见 `SHA256SUMS.txt`。

## 复现方式

- 脚本为 ESM，依赖执行环境已有的 Playwright；ESM 从**脚本自身目录**解析 `playwright`，故需把脚本放到与 `node_modules` 同级处执行：

```bash
R1DIR="/agent/cdc-config-platform/docs/features/client-config/reports/evidence/CLIENT-CONFIG-ROW-HEIGHT-AND-OPTIONAL-ELLIPSIS-IMPLEMENTATION-001-R1"
cd /tmp && ln -sfn <playwright-node_modules> ./node_modules     # ESM 不认 NODE_PATH，用软链解析
\cp "$R1DIR/zoom-real-100-125.mjs" /tmp/r1run.mjs
rm -rf /tmp/r1-zoom/out && mkdir -p /tmp/r1-zoom/out
DISPLAY=:99 R1_EXT="$R1DIR/zoom-helper-extension" \
  R1_REPO_OUT="$R1DIR" R1_OUT=/tmp/r1-zoom/out node /tmp/r1run.mjs
```

- 前置：一个 `DISPLAY` 可用的 X 显示（本证据为 `:99`，`1440×900`）、`gnome-screenshot`、以及已运行的开发前端 `http://127.0.0.1:5173`。无品牌 Chromium 由 Playwright 提供；系统有品牌 Chrome **不可**用于本证据。
- 输出：`R1_OUT` 下的原始 JSON 与整屏 PNG（未脱敏），以及 `R1_REPO_OUT` 下的 `real-zoom-results.json`／`real-zoom-summary.json`／`focus-ring-pixels.json`（脱敏）。

## 判定边界

- 浏览器证据为**本机真实 Chromium（真实页面缩放）**（非 jsdom、非 CSS 推导、非等效窄视口）；**不**声称外网可访问性。
- 本证据只支撑**实现层面**的缩放/命中区/焦点/行高/零写事实，**不**等于正式验收结论，也未替代项目负责人目视。
- 浏览器核对**不**得据以把 `CCFG-AC-155~157` 由 `NOT_RUN` 翻为 `PASS`；本轮**未**执行正式验收。
