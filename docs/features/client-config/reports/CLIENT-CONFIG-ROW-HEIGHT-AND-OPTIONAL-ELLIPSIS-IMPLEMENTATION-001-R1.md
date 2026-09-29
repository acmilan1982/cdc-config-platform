# 第七轮行高与三点入口可选样式实现 R1 · 真实 100%/125% 浏览器缩放核对报告

- 任务编号：`CLIENT-CONFIG-ROW-HEIGHT-AND-OPTIONAL-ELLIPSIS-IMPLEMENTATION-001-R1`
- 任务类型：**前端验证/bug核对类任务（本轮实际只补证据，无产品代码改动）**
- 分支：`develop`
- 起始提交（base）：`d93f838be359d71ef373082a6c3a62046912b1a1`（实现任务 `...IMPLEMENTATION-001` 结果提交）
- 依据：`docs/prompts/client-config/CLIENT-CONFIG-ROW-HEIGHT-AND-OPTIONAL-ELLIPSIS-IMPLEMENTATION-001-R1-Agent-Prompt.md`
- 核对对象：`CCFG-AC-155~157`／`CCFG-DESIGN-088~089`／`CCFG-UI-076~077` 所涉公共 opt-in 三点入口与 `/config/client` 主列表行高在**真实浏览器页面缩放**下的表现
- 现行下一入口：`CHATGPT_REMOTE_CLIENT_CONFIG_ROW_HEIGHT_AND_OPTIONAL_ELLIPSIS_IMPLEMENTATION_R1_REVIEW`

---

## 1. 授权与复审意见勘误

- 实现任务 `...IMPLEMENTATION-001` 的既有浏览器证据（`measure-after.mjs`）用 **`1152×720` 较窄视口**模拟 1440×900 下的“125% 缩放等效”。该等效视口证据**只**能证明**窄布局**表现，**不能**单独证明**真实浏览器页面缩放**表现；`CCFG-AC-156` 要求的是**实际 125% 浏览器缩放**下的观察。R1 据此**优先补齐真实缩放证据**。
- **复审意见勘误（记录在案）**：上一轮 ChatGPT 复审最初还把“三点入口缺禁用态样式”列为当前页面缺陷；经项目负责人追问后**已撤回该阻塞理由**。现行探针页**三点触发器本身无禁用场景**（提交处理中禁用的是**菜单条目**）。R1 **未**为凑状态禁用三点入口、**未**改变任何业务行为。
- 模板中的三点入口是**显式 opt-in 可选能力**：使用表格模板的页面**完全可以不启用**。数据源管理页现行“更多”**文字**入口**不在**本任务迁移；R1 **未**把所有表格改成三点入口、**未**修改已批准的模板业务边界。
- **本轮结论：真实缩放复测未出现可复现缺陷，因此未修改任何产品代码**（遵循“若真实缩放通过，**不**为形成代码 diff 而改业务代码”）。

## 2. 门禁与基线

```text
branch=develop
expected_base_commit=d93f838be359d71ef373082a6c3a62046912b1a1
actual_base_commit=d93f838be359d71ef373082a6c3a62046912b1a1
origin_develop=d93f838be359d71ef373082a6c3a62046912b1a1
remote_refs_heads_develop=d93f838be359d71ef373082a6c3a62046912b1a1
ahead_behind(origin/develop...HEAD)=0/0
definition_rows=REQ 154 / AC 157 / DESIGN 89 / UI 77
```

- 当前分支为 `develop`，本地 `HEAD`、`origin/develop` 与远程 `refs/heads/develop` **三者一致**（`d93f838`），ahead/behind `0/0`，无分叉。
- 任务开始前已存在的**无关**工作区内容**保持原样、未修改、未暂存、未提交**：` M .claude/settings.local.json`、未跟踪的 `docs/prompts/**` 与 `runtime-logs/**`。
- 已按 §3 读取适用 `CLAUDE.md`、第七轮已批准条款（`CCFG-AC-155~157`／`CCFG-DESIGN-088~089`／`CCFG-UI-076~077`）、公共模板 §12、实现报告与既有脱敏证据。
- **未**停止项目负责人正在运行的前端 / 后端服务；浏览器核对复用既有开发服务（`http://127.0.0.1:5173`）。本任务为**虚拟显示 + 无头/有头浏览器**核对另起进程，核对完成后**只清理本任务创建的进程**。

## 3. 允许修改范围与实际变更

实际变更（仅文档与脱敏证据，**无**产品代码 / 测试 / 共享 CSS 改动）：

- 新增 `docs/features/client-config/reports/CLIENT-CONFIG-ROW-HEIGHT-AND-OPTIONAL-ELLIPSIS-IMPLEMENTATION-001-R1.md`（本报告）。
- 新增脱敏证据包 `docs/features/client-config/reports/evidence/CLIENT-CONFIG-ROW-HEIGHT-AND-OPTIONAL-ELLIPSIS-IMPLEMENTATION-001-R1/`：
  `README.md`、`zoom-real-100-125.mjs`、`zoom-helper-extension/{manifest.json,sw.js}`、`real-zoom-results.json`、`real-zoom-summary.json`、`focus-ring-pixels.json`、`SHA256SUMS.txt`。
- `docs/features/client-config/README.md`：仅同步**现行实现复审状态 / 导航 / 追加执行记录**（追加 R1 执行记录、报告导航行、当前下一入口），**不改**任何业务定义行。

**未修改**：`frontend/**`（含 `list-table-visual.css`／`list-table-visual.spec.ts`／`ClientConfigPage.vue`／`ClientConfigPage.spec.ts`）、`/config/data-source` 参考页、后端、`API.md`／`DATABASE.md`、`docs/baseline/` 六份项目级基线、两套共享模板（`docs/baseline/list-table-visual-template/**` 与 `query-list-page-template/**`）状态与页面迁移状态、历史报告、`docs/prompts/**`、`runtime-logs/**`、`.claude/**`、`CLAUDE.md`、`agent-env.sh`。未访问或写入数据库／ZooKeeper／Kafka。

> 说明：因本轮**仅补验证**，未修改五份 Feature 文档中的业务定义部分与模板文档；仅改动必要的 `README.md` 状态/导航入口与新增报告/证据。

## 4. 真实缩放设置与生效证明

### 4.1 为什么必须另建证据

- 既有证据的“125% 缩放等效”= 把视口改成 `1152×720`。它与**真实页面缩放**在三个可观测维度上不同：真实缩放**同时**改变 `devicePixelRatio`（1 → 1.25）与 CSS 视口宽度；等效窄视口只改后者、`devicePixelRatio` 仍为 1。
- 因此 R1 **不**采信任何“只改 viewport / 只改 `deviceScaleFactor` / 只做 CSS `transform: scale()`”的做法。

### 4.2 设置方法与生效证据

- **浏览器**：Playwright 随附的**无品牌 Chromium**（Chrome for Testing `147.0.0.0`）。系统安装的**有品牌 Google Chrome 会忽略 `--load-extension`**（实测日志 `"--load-extension is not allowed in Google Chrome, ignoring."`），**不可**用于本证据。
- **缩放通路**：加载一个**未打包 MV3 辅助扩展**（`zoom-helper-extension/`，仅 `tabs` 权限、无网络 / 无页面访问 / 无存储；`sw.js` 不含任何逻辑），由 CDP 驱动其 Service Worker 调用 **`chrome.tabs.setZoom()`** —— 即浏览器缩放 UI 所使用的**按标签 / 按站点页面缩放**通路。
- **固定显示环境**：`Xorg :99` 虚拟显示 `1440×900`；浏览器窗口固定在 `(0,0)`、尺寸 `1440×900`，全过程窗口不变。
- **可核查生效证据**（`real-zoom-summary.json.zoomLegs`、`.toggle`）：

| 页面缩放 | `chrome.tabs.getZoom()` | `devicePixelRatio` | `innerWidth×innerHeight` | `outerWidth×outerHeight` | 命中区 CSS px | 命中区物理 px |
|---|---|---|---|---|---|---|
| 100% | `1` | `1` | `1439×812` | `1439×899` | `28×28` | `28×28` |
| 125% | `1.25` | `1.25` | `1151×650` | `1439×899` | `28×28` | `35×35` |

- 同一窗口内 `100% → 125% → 100%` 往返：`getZoom` 与 `devicePixelRatio` 同步 `1/1 → 1.25/1.25 → 1/1`，`outerWidth` 恒为 `1439`（窗口未动）。
- 另：缩放不改变命中区的 **CSS** 尺寸（仍 `28×28`），但改变其**物理像素**尺寸（`28 → 35`）——这正是真实缩放与窄视口的本质区别。
- 涉及页面缩放的单位说明：125% 下 Chrome 对 `outline-width` / `outline-offset` 上报 `1.6px / -1.6px`，按 `×devicePixelRatio` 折算仍为 **2px / -2px**（报告单位随缩放变化，**不是**尺寸变化）。

### 4.3 为什么像素证据用真实屏幕捕获

- Chrome `Page.captureScreenshot`（CDP）在缩放 `Z` 下只能覆盖 `innerWidth/dpr` 个 CSS px（125% 实测 `1151/1.25 = 920.8` CSS px ≈ CSS 视口左侧 ~80%），`captureBeyondViewport` 与 `clip.scale` **均不改变**该边界。
- 三点入口位于**贴右边缘的固定操作列**（125% 触发器中线约 CSS `x≈969`），**落在** `920.8` 之外，**任何 CDP 截图都取不到**。
- 故像素证据改用**真实显示捕获**：`gnome-screenshot -f`（X11 根窗口真实物理像素），以**注入的定标色标**自标定 `screen = origin + css × devicePixelRatio`（`originY ≈ 87` 物理像素 = 浏览器窗口装饰高）。该限制与后果记入 `real-zoom-summary.json.cdpCaptureLimitation`。

## 5. 逐项观测

### 5.1 三点入口命中区与交互（真实缩放）

- 命中区 `28×28px`、圆角 `6px`、主色 `rgb(64,158,255)`、hover 浅底 `rgb(236,245,255)`（100% 与 125% 一致）。
- 入口位于**本行操作单元格**内（`boxWithinCell=true`、`boxInsideRow=true`），**不**与相邻行重叠（`linkOverlapsNextRow=false`）。
- 点击第 1 行触发器菜单为 `["停用","删除"]`；**命中盒下方 2 CSS px** 处点击**不**打开菜单（`noMisTriggerBelowHitBox=true`）；第 2 行触发器打开的是**第 2 行自己的**菜单 `["启用","删除"]`（`row1AndRow2MenusDiffer=true`），**无跨行误触**。
- **固定操作列滚动**（125%）：横向可滚（`scrollWidth 1026 > clientWidth 775`），`scrollLeft` 到 `251.2` 后触发器仍在视口内（`left 968.8 / right 996.8 < innerWidth 1151`）、`display:flex`、`visibility:visible`。

### 5.2 键盘焦点与内嵌焦点环（是否被 `.cell{overflow:hidden}` 裁切）

- **真实键盘 `Tab`** 可达：100% 第 `7` 步、125% 第 `8` 步到达三点入口（`tabReached=true`）。
- `:focus-visible` 计算样式 `outline: solid 2px rgb(64,158,255)` + `outline-offset: -2px`（**内嵌**）；`.cell` 的 `overflow` 仍为 `hidden`。
- **物理像素探针**（`focus-ring-pixels.json`）：

| 缩放 | 命中盒（物理 px） | 盒内环像素 | 盒外像素 | 盒外最大外溢 | 四边覆盖率 上/下/左/右 | 四边完整可见 |
|---|---|---|---|---|---|---|
| 100% | `28×28` | `246` | `0` | `0` | `.857/.857/.857/.857` | `true` |
| 125% | `35×35` | `302` | `27` | `1` | `.886/.886/.943/.829` | `true` |

- 125% 的 `27` 个“盒外”像素**全部**落在盒子**左侧紧邻的 1 个物理像素列**（`ringOutsideSides={left:27, right:0, top:0, bottom:0}`，`ringOutsideMaxDevicePx=1`）。根因：125% 下元素左边界落在**半个物理像素**上（CSS `x=841.2 → 1051.5` 物理 px），严格整数盒（`1052`）把元素**自身半覆盖的边缘列**判为“盒外”。这是**半像素量化**，**不是**焦点环逸出、更**不是**被裁切（若被 `.cell` 裁切，裁切侧覆盖率会显著为 0，而实测四边覆盖率均 ≥ `0.83`）。
- **四边 / 四角均在**：`focus-ring-pixels.json` 的 ASCII 图显示两缩放下的描边为**闭合圆角矩形**。
- **结论**：`:focus-visible` 描边**内嵌**、四边完整可见，**未**被 `.cell{overflow:hidden}` 裁切。
- 附注（避免误读）：三点**图形本身**为当前色（主色蓝），故“蓝色像素”同时含描边与图形；裁切判定取自**周长覆盖率与包围盒**，而非蓝色像素总数（盒内图形像素另记 `blueDevicePixelsInterior`：100% `51`、125% `113`）。

### 5.3 行高、标签、`+N`、ID 标记

- `/config/client` 共 16 行：**15 条常规行** 100% 均为 `48` CSS px、125% 均为 `47.8` CSS px（差 `0.2` = 缩放取整，**未**因入口额外撑高）；**1 条歧义行** 100% `52` / 125% `51.8`（自适应观察组，不强制等高）。
- 标签完整且两缩放一致：红 `bad` 8 / 绿 `ok` 3 / 无标签 5。
- ID 标记：16 行**全部**有 ID 标记（`idMarkPresentAll=true`）；停用标记 14 行、异常标记 1 行、歧义行计数提示 `（展示）` 1 行。
- `+N` 动态槽位完整：100% 出现 `+3`/`+6`；125% 出现 `+4`/`+6`/`+2`。差异原因：**CSS 视口变窄后装得下的数据源标签更少**，`+N` 相应增多——属既有**动态布局**预期行为，**非**缺陷、**非**裁切。
- 表头 `th` 虽同样携带 `class-name`，公共规则以 `td.el-table__cell` 限定，其计算内边距仍 `11px`。

### 5.4 只读对照页 `/config/data-source`（未启用页，零变化）

| 缩放 | 行数 | `lt-row-action__cell` | `lt-row-action__ellipsis` | `.row-more` | 入口文本 | 常规行高 |
|---|---|---|---|---|---|---|
| 100% | `36` | `0` | `0` | `36` | `更多` | `48` |
| 125% | `36` | `0` | `0` | `36` | `更多` | `47.8` |

- 该页仍为“更多”**文字**入口、**未**挂 opt-in 类；常规行高与 100% 基线一致（仅缩放取整）；文件**未修改**。
- **版本确认**：浏览器核对全程使用**当前工作区未修改的**前端服务（`git status` 显示 `frontend/**` 无改动），故截图对应本提交（`d93f838`）代码版本，不存在“版本不明截图”问题。

## 6. 零写

- **打开页面前**在网络层安装拦截：`/api/**` 的 `GET/HEAD/OPTIONS` 放行，`POST/PUT/PATCH/DELETE` 一律 `abort('blockedbyclient')` 并计数。
- 本轮实测**非 GET 拦截计数 = `0`**（`real-zoom-summary.json.writesBlocked=0`）；未访问或写入数据库 / ZooKeeper / Kafka；未执行业务写操作。

## 7. 缺口与偏差（如实记录）

1. **观察窗口与既有 100% 对照组的视口宽度一致而非同一窗口**：R1 用 `1440×900` 固定窗口；125% 下 `innerWidth` 为 `1151`（非整 `1152`，差 1 为亚像素/滚动条取整）。**R1 不**以新缩放数据替代或放宽已提交的 100% 对照组逐样本 **≤1 CSS px** 验收口径；125% 仅为 `CCFG-AC-156` 的**补充腿**，**不**混入 `CCFG-AC-155` 的 100% 对照组。
2. **125% 焦点环有 1 物理像素量化的“盒外”计数**：已定位为半像素量化（见 §5.2），非产品缺陷；严格口径与 1 物理像素容差口径**并列记录**，未隐藏原始数值。
3. **像素证据依赖 X11 根窗口截图**：因 CDP 截图在 125% 覆盖不到右固定列（见 §4.3）。该限制已写入证据 JSON，**不**以文件名或说明文字冒充 CDP 通过。
4. **`+N` 数量随缩放变化**：属动态布局预期，记录但不判缺陷。
5. **未执行项**：正式验收（157 条）、项目负责人页面目测、ChatGPT 远程 R1 复审。
6. **未**做的替代捷径：未把 `1152×720` 等效视口 / 仅改 `deviceScaleFactor` / CSS `transform: scale()` 结论混入本证据。

## 8. 定义行完整性与状态边界

- **定义行完整性**：`CCFG-REQ-001~154`（154）、`CCFG-AC-001~157`（157）、`CCFG-DESIGN-001~089`（89）、`CCFG-UI-001~077`（77）四类定义行相对 `d93f838` 按 `id → 行文本` 去重集合比对，**逐字节零变化**（四类 `identical=true`，无新增/删除、无行文本差异）。
- **验收状态**：157 条统计仍为 `PASS` **69** / `FAIL` **0** / `BLOCKED` **70** / `NOT_RUN` **18**，**状态格零变化**；`CCFG-AC-010` 保持 `BLOCKED`（待独立重判）；`CCFG-AC-155~157` 保持 `NOT_RUN`。浏览器核对**不是**正式验收，**未**据此把任何 `NOT_RUN` 翻为 `PASS`。
- **状态分层**：第七轮基线批准状态不变（`adjustment7_baseline_status=APPROVED`、`adjustment7_approval_status=APPROVED_BY_PROJECT_OWNER`、`adjustment7_approved_reviewed_commit=59617b4cee03fe1642417cb85005b339ab0015ab`）；`adjustment7_implementation_status` **保持 `IMPLEMENTED_PENDING_CHATGPT_REVIEW`**（本轮无代码改动，不推进也不回退）；`adjustment7_formal_acceptance_execution_status=NOT_RUN`。
- **模板侧**：`list-table-visual-template` 的整体状态、`current_next_entry` 与计数通道**不变**（本轮未改模板文档）；opt-in 代码实现状态仍为「已完成、待远程复审」。
- **范围边界**：**未**修改 `/config/data-source`、后端、`API.md`／`DATABASE.md`、`docs/baseline/` 六份项目级基线、两套共享模板、历史报告、`docs/prompts/**`、`runtime-logs/**`、`.claude/**`；**未**访问或写入数据库／ZooKeeper／Kafka；**未**创建共享新增／编辑弹窗模板。`git diff --check` 干净。

## 9. 测试与构建适用性

- 本轮**无产品代码 / 测试 / 共享 CSS / 构建配置改动**，按验证矩阵**不需要**重跑全量测试与构建（提示词亦明确“无代码修改时无需为了本轮重跑全量测试与构建；应运行证据脚本或完成等效的真实浏览器核对并报告结果”）。
- 实际执行的是**真实浏览器缩放证据脚本** `zoom-real-100-125.mjs`（退出码 `0`），其产物为上述 JSON 与截图。
- **不适用**项如实标注：`backend_build_status=NOT_APPLICABLE`、`frontend_build_status=NOT_APPLICABLE`（未改前端源码；证据脚本运行非 `npm run build`）。

## 10. 结论与下一步

- **真实缩放结论**：真实浏览器页面缩放 `100%` 与 `125%` 下，三点入口命中区 / hover / 打开关闭菜单 / 跨行隔离 / 固定操作列滚动 / 入视野，键盘 `Tab` 焦点与**内嵌焦点环四边完整可见**（未被 `.cell{overflow:hidden}` 裁切）均**通过**；常规行高只随缩放取整（`48 → 47.8` CSS px），**未**因入口额外撑高；只读对照页 `/config/data-source` 结构、入口形态与行高**零变化**；**非 GET `/api/**` 拦截计数 0**。
- **未发现可复现的产品缺陷**，故**未做任何产品代码修改**；本轮仅补齐真实缩放证据与文档。
- **下一入口**：`CHATGPT_REMOTE_CLIENT_CONFIG_ROW_HEIGHT_AND_OPTIONAL_ELLIPSIS_IMPLEMENTATION_R1_REVIEW`（由 ChatGPT **从远程 Git** 对 R1 结果做独立复审）。
- **边界**：本 R1 的远程复审通过**仍不等于**项目负责人页面目测，**也不等于** 157 条正式验收完成。

---

```text
AGENT_TASK_RESULT_BEGIN
status=SUCCESS
task_code=CLIENT-CONFIG-ROW-HEIGHT-AND-OPTIONAL-ELLIPSIS-IMPLEMENTATION-001-R1
branch=develop
base_commit_id=d93f838be359d71ef373082a6c3a62046912b1a1
result_commit_id=见任务会话提交结果
env_check_status=SUCCESS
backend_build_status=NOT_APPLICABLE
frontend_build_status=NOT_APPLICABLE
database_write_status=NOT_REQUESTED
zookeeper_write_status=NOT_REQUESTED
push_status=见任务会话推送结果
changed_files=docs/features/client-config/README.md,docs/features/client-config/reports/CLIENT-CONFIG-ROW-HEIGHT-AND-OPTIONAL-ELLIPSIS-IMPLEMENTATION-001-R1.md,docs/features/client-config/reports/evidence/CLIENT-CONFIG-ROW-HEIGHT-AND-OPTIONAL-ELLIPSIS-IMPLEMENTATION-001-R1/README.md,docs/features/client-config/reports/evidence/CLIENT-CONFIG-ROW-HEIGHT-AND-OPTIONAL-ELLIPSIS-IMPLEMENTATION-001-R1/zoom-real-100-125.mjs,docs/features/client-config/reports/evidence/CLIENT-CONFIG-ROW-HEIGHT-AND-OPTIONAL-ELLIPSIS-IMPLEMENTATION-001-R1/zoom-helper-extension/manifest.json,docs/features/client-config/reports/evidence/CLIENT-CONFIG-ROW-HEIGHT-AND-OPTIONAL-ELLIPSIS-IMPLEMENTATION-001-R1/zoom-helper-extension/sw.js,docs/features/client-config/reports/evidence/CLIENT-CONFIG-ROW-HEIGHT-AND-OPTIONAL-ELLIPSIS-IMPLEMENTATION-001-R1/real-zoom-results.json,docs/features/client-config/reports/evidence/CLIENT-CONFIG-ROW-HEIGHT-AND-OPTIONAL-ELLIPSIS-IMPLEMENTATION-001-R1/real-zoom-summary.json,docs/features/client-config/reports/evidence/CLIENT-CONFIG-ROW-HEIGHT-AND-OPTIONAL-ELLIPSIS-IMPLEMENTATION-001-R1/focus-ring-pixels.json,docs/features/client-config/reports/evidence/CLIENT-CONFIG-ROW-HEIGHT-AND-OPTIONAL-ELLIPSIS-IMPLEMENTATION-001-R1/SHA256SUMS.txt
error=
AGENT_TASK_RESULT_END
```
