# 探针端管理 AC-090 / AC-157 定向只读验收报告

> 任务编号：`CLIENT-CONFIG-DISABLED-APPLICABILITY-TARGETED-READONLY-ACCEPTANCE-001`
> 分支：`develop`
> 开工基线：`16bccbd65aa78dea206a3944e220ad50d7d822f9`
> 性质：**真实浏览器只读定向验收**（不执行 157 条整体正式验收，不写业务数据）
> 范围：**仅** `/config/client` 及其新增弹窗、行菜单

---

## 1. 门禁与版本

| 项 | 实测值 |
|---|---|
| 分支 | `develop` |
| 开工 `HEAD` | `16bccbd65aa78dea206a3944e220ad50d7d822f9` |
| `origin/develop` | `16bccbd65aa78dea206a3944e220ad50d7d822f9` |
| 远端 `refs/heads/develop` | `16bccbd65aa78dea206a3944e220ad50d7d822f9` |
| 分叉 | 无（三方一致，无 ahead/behind） |
| 既有无关工作区条目 | ` M .claude/settings.local.json`、`?? docs/prompts/`、`?? runtime-logs/`（保持原样，未暂存、未提交） |
| 前端 | 既有 Vite dev server，pid `8141`，`0.0.0.0:5173`，提供工作区 HEAD 源码；未构建、未重启 |
| 后端 | 既有 Spring Boot jar，pid `8120`，`:8080`；未重启；本任务不依赖后端写入 |
| 浏览器 | 无头 Chromium `147.0.7727.15`（playwright-core），`--no-sandbox`，`deviceScaleFactor=1` |
| 工具链 | Node `v24.17.0`、npm `11.13.0`、JDK `1.8.0_202` |
| 构建/测试 | **未运行**（本任务不授权，且属文档/只读验收） |
| 数据库/ZooKeeper/Kafka | **未访问、未写入** |

产物一致性限制：后端 jar 的 mtime 与 SHA-256 已记录于 `env-and-version.txt`，但**不以时间戳单独证明源码与产物一致**；本任务观察均来自前端渲染，未对后端行为作源码等价性断言。前端为 Vite dev 直接提供工作区源码，观察对象与 HEAD 一致（沿用既往只读轮次的观察方式）。

---

## 2. 方法与证据分层

- **浏览器观察（本轮）**：1 个只读探针 `probe-disabled-applicability.mjs`，两视口（1440×900 / 1920×1080），在**首次导航前**对浏览器上下文安装 `/api/**` 非 GET 阻断。仅执行悬停、真实 Tab、鼠标按下/释放、打开并关闭弹窗、打开并关闭行菜单。
- **历史复用**：AC-090 的参考页并排对照与点击弹窗、AC-157 的未启用页零变化、125% 缩放/焦点观察，均复用已入仓证据，本轮**不重跑、不跨页**。
- **源码推导**：公共 CSS 作用域、页面模板绑定、菜单归属、QueryListActions 与 DataSourcePage 的提交未变更性，通过只读源码与 `git log/diff` 核对。
- **未执行腿**：跨页访问（本轮禁止）；业务写入/启停/删除最终确认（超出只读边界）；禁用态制造（适用性说明明确禁止）。

---

## 3. 逐步骤矩阵

图例：**本轮**＝本次只读浏览器观察；**历史**＝复用已入仓证据；**源码**＝只读源码/提交推导。

### 3.1 `CCFG-AC-090`

| 原子前置 / 步骤 / 预期 | 既有证据（文件 + 真实 JSON 键 + 采集提交/时点） | 本次补采 | 结果与限制 |
|---|---|---|---|
| 前置：目标功能已实现并部署；可进入探针端管理页 | 本轮页面成功加载 16 行列表；源码 `ClientConfigPage.vue` @ `d878c3d` | 两视口导航 | **满足**（本轮） |
| 前置：已登录且当前用户具备新增权限 | 无权限模型；本轮页面可进入、按钮可点击；适用性说明 2026-11-03 | 源代码核对 + 本轮点击 | **满足**：以“无权限限制”解释，不虚构权限开关 |
| 默认外观：黑色实心、白/浅色文字、圆角/字重与参考页一致 | 历史 `SUPPLEMENT-001/per-id-results.json` → `per_id[id=CCFG-AC-090].observed.default`、`.hover_focus`、`.reference_identical=true`（base `bec9beb`，报告提交 `2026-09-28`） | 本轮 `ac090.default`（两视口） | **满足**：`rgb(9,9,11)` 底/边框、`rgb(255,255,255)` 字、`6px`、`500`、`14px`（本轮） |
| Hover 视觉 | 历史同上 `hover_focus.bg = rgb(39,39,42)` | 本轮 `ac090.hover`（`matchesHover=true`） | **满足**：`rgb(39,39,42)` 底/边框、白字（本轮） |
| 真实 Tab 键盘聚焦 | 历史 `SUPPLEMENT-001` AC-090 键盘聚焦步骤 | 本轮 `ac090.keyboardFocus`（`reachedByTab=true`） | **满足**：真实 Tab 到达；聚焦态 `rgb(39,39,42)`，可见 outline（本轮） |
| 按下态 | `REQ-104` 定义参考页按下 `#18181b`；`VISUAL-FOLLOWUP-BASELINE-001-V2` 记录参考值 | 本轮 `ac090.active`（鼠标按下期间读取） | **满足**：`rgb(24,24,27)` = `#18181b`（本轮，新增覆盖） |
| 加号图标、文案不变 | 历史 `SUPPLEMENT-001` 点击步骤；源码 `.cc-btn-icon` + `Plus` | 本轮 `ac090.default.hasSvgIcon=true`、`text=新增探针` | **满足**（本轮） |
| 结果区头部最右侧位置不变 | 历史 `ac090.default`/`click_opens_dialog` | 本轮 `isLastInToolbar=true`、`rect.right == toolbarRight`、`panelRight/headerRight` 一致 | **满足**：1440 右缘 `1368`（工具栏 `1368`）、1920 右缘 `1848`（工具栏 `1848`）（本轮） |
| 点击打开新增弹窗且行为不变 | 历史 `AC090.clickOpensDialog` | 本轮 `ac090.clickOpensDialog` | **满足**：弹窗可见、标题“新增探针”；仅关闭未提交（本轮） |
| “查询”“重置”外观不因本轮调整改变 | `QueryListActions.vue` 自 `d1cd3b1`（2026-09-17）未改；`cc-btn-add` 样式自 `fecf5a0`（2026-09-23） | 本轮 `ac090.queryReset` | **满足**：查询 `rgb(9,9,11)`/白/6px/62×32；重置 `rgb(228,228,231)`/`rgb(63,63,70)`/透明边框/6px/62×32；均不含 `cc-btn-add`、无 disabled（本轮） |
| 与参考页“新增数据源”并排比对 | 历史 `SUPPLEMENT-001` probeD `AC090.ref` + `reference_identical=true`；参考页源码 `.ds-add-button` 取值 `#09090b/#ffffff/6px/500`、`:hover/:focus #27272a`、`:active #18181b`；`DataSourcePage.vue` 自 `c6d752c`（2026-09-22）未改 | **本轮不访问参考页** | **满足（历史复用）**：参考页自采集以来未变，取值与客户端一致；本轮不制造跨页证据 |
| 禁用态子项 | 适用性说明 2026-11-03；源码无 `:disabled`/权限门 | 未构造 | **不适用**：不单独证明 PASS，也不永久阻塞；未来真实引入时重新验收 |

### 3.2 `CCFG-AC-157`

| 原子前置 / 步骤 / 预期 | 既有证据（文件 + 真实 JSON 键 + 采集提交/时点） | 本次补采 | 结果与限制 |
|---|---|---|---|
| 前置：目标功能已实现并部署；`/config/client` 可访问 | 本轮列表 16 行正常渲染；源码 `/client-config/ClientConfigPage.vue` | 两视口导航 | **满足**（本轮） |
| 前置：可访问至少一个**未启用**该能力的其他主列表页（只读对照） | 历史 `ROUND7` → `AC157_not_enabled_page_datasource`（base `aa942dc`，2026-09-30）：36 行、opt-in 计数 0、仍为“更多”文字入口 | **本轮不跨页** | **满足（历史复用）**：`DataSourcePage.vue` 自 `c6d752c`（2026-09-22）未改，见 §5 |
| ① 外观：图标容器与实际命中区、对齐、圆角、色值、光标 | 历史 `ROUND7` → `AC155_156_client_1440x900`（28×28、6px、主色、居中、盒内） | 本轮 `ac157.structure.trigger` | **满足**：28×28、6px、`rgb(64,158,255)`、`cursor:pointer`、`boxInsideCell/Row=true`、`vCentered=true`（本轮） |
| ① Hover | 历史 `AC157_entry_hover`：`rgb(236,245,255)`、主色、pointer | 本轮 `ac157.hover` | **满足**：`rgb(236,245,255)`、`rgb(64,158,255)`、pointer（本轮） |
| ① Focus-visible | 历史 `IMPLEMENTATION-001-R1` `real-zoom-summary.json` → `focus.100`（`outline 2px solid rgb(64,158,255)`, offset `-2px`） | 本轮 `ac157.keyboard.focusVisible` | **满足**：2px 实线主色、offset `-2px`（本轮） |
| ① 真实键盘可达 | 历史 R1 真实缩放/焦点观察 | 本轮 `ac157.keyboard.reachedByTab=true` | **满足**：真实 Tab 到达 `SPAN[role=button]`（本轮） |
| ① 可访问名称 | 历史源码 `:aria-label` | 本轮 `ariaLabelMasked=更多操作：<ID>` | **满足**：名称存在，真实 ID 已脱敏（本轮） |
| ① `disabled` 状态 | 适用性说明 2026-11-03；源码无 `disabled`/`aria-disabled`；行忙碌禁用菜单项 | 未构造 | **不适用**：菜单项禁用不等于触发器禁用；不单独判 PASS、不永久阻塞 |
| ② 未启用页计算样式与启用前逐项一致 | 历史 `ROUND7` → `AC157_not_enabled_page_datasource`：36 行全 48px、`optInCellCount=0`、`optInEllipsisCount=0`、`rowMoreCount=72`、`hasMoreText=true`、末列 padding `12px`、单元高 `23`、`overflow:hidden` | **本轮不跨页** | **满足（历史复用）**：页面源码未变；公共 CSS 新增规则均双重限定，见 §5 |
| ③ 显式 opt-in、无全局 EP 覆盖、无页面名硬编码、无 `!important` | 历史 `ROUND7` → `AC157_optin_style_check`：4 条规则全部 `.lt-main-table` 限定、`anyImportant=false` | 本轮 `sourceChecks.optInRules` | **满足**：本轮运行态同样恰 4 条，全部 `.lt-main-table[data-v-…]` 限定，`hasImportant=false`；源码无页面名选择器（本轮 + 源码） |
| ④ 公共层未接管菜单/权限/启停删除语义/请求时序/行选中/定位/异常语义 | 源码：菜单项由 `ClientConfigPage.vue` 渲染、命令与权限逻辑在页面 | 本轮 `ac157.featureOwnership`（`publicLayerInjectsMenu=false`）；菜单项“停用/删除”可见且启用 | **满足（源码推导 + 本轮观察）**：公共 CSS 只提供外观；菜单与业务语义仍由 Feature 控制 |
| ⑤ 28px 未成为所有主列表强制最小行高 | 历史 `ROUND7` 未启用页 36 行全 48px | 本轮 `/config/client` 行高直方图 `{48:15, 52:1}` | **满足**：行高内容驱动，未固定为 28px；未启用页历史保持 48px（本轮 + 历史） |
| 模板迁移状态、页面迁移授权、试点选择均不变；`/config/data-source` 未迁移 | `SHARED_COMPONENT_DESIGN.md` §12：`page_migration_status=NOT_STARTED`、`page_migration_authorization_status=NOT_GRANTED`、`pilot_page_selection_status=NOT_DECIDED`、参考页仍为“更多”文字入口 | 只读文档/源码核对 | **满足（源码/文档推导）**：本任务未翻转任何状态 |
| 三点入口为可选能力，应用模板可不采用 | `SHARED_COMPONENT_DESIGN.md` §12 显式可选契约 | 只读文档核对 | **满足（源码/文档推导）** |

补充（仅按需引用，不重复制造证据）：历史 125% 真实缩放观察为——100% 严格盒内；125% 存在紧邻左边界 1 物理像素列的 27 像素量化结果（严格口径 `false`、1 物理像素容差 `true`）。本轮未重跑缩放腿。

---

## 4. 禁用子项适用性

依据 `CLIENT-CONFIG-DISABLED-STATE-APPLICABILITY-BASELINE-UPDATE-001`（生效 2026-11-03；定义落在 `ACCEPTANCE.md` §4、`DESIGN-047/089`、`UI-036/076`）：

- **AC-090**：当前无新增权限模型，页面没有可观察的“新增探针”按钮禁用态；“无数据源可选”会打开弹窗展示空候选，而非禁用按钮。按钮禁用子项**记为不适用**。
- **AC-157**：三点触发器本身无业务禁用条件；行级忙碌时被禁用者是**下拉菜单项**，菜单项禁用不等于触发器禁用。触发器 `disabled` 子项**记为不适用**；公共触发器禁用视觉尚未实现。
- **判定规则**：子项不适用**不单独**证明整条 `PASS`，也**不永久**阻塞整条；其他全部适用要求被覆盖后由本独立验收任务判定。本任务**未**添加 `disabled`、**未**修改 DOM/CSS/业务逻辑制造状态。
- **未来**：真实引入可观察禁用条件时，须先完成设计批准、公共实现与页面接入，再由独立验收任务重新取证。

---

## 5. 历史证据复用明细与可复用性

| 证据 | 路径与键 | 采集提交/时点 | 观察范围 | 本轮可复用性判断 |
|---|---|---|---|---|
| AC-090 参考页对照/点击弹窗 | `reports/evidence/CLIENT-CONFIG-FORMAL-ACCEPTANCE-READONLY-SUPPLEMENT-001/per-id-results.json` → `per_id[id=CCFG-AC-090].observed.{default,hover_focus,reference_identical,click_opens_dialog}`；脚本 `probeD.mjs`，键 `AC090.client`/`AC090.ref`/`AC090.clickOpensDialog` | base `bec9beb`；报告提交 `2026-09-28 22:20` | `/config/client` + 只读参考页 `/config/data-source` | 参考页源码自 `c6d752c`（2026-09-22）未改；`QueryListActions.vue` 自 `d1cd3b1` 未改；可用 |
| AC-157 opt-in/未启用页零变化 | `reports/evidence/CLIENT-CONFIG-ROUND7-TARGETED-ACCEPTANCE-AND-VISUAL-RECORD-001/round7-targeted-readonly-results.json` → `AC157_optin_style_check`、`AC157_entry_hover`、`AC157_not_enabled_page_datasource`、`AC155_156_client_1440x900` | base `aa942dc`；2026-09-30 | `/config/client` + 只读 `/config/data-source` | `DataSourcePage.vue` 自 `c6d752c` 未改；`aa942dc..HEAD` 的公共 CSS 仅新增 38 行，全部以 `.lt-main-table.lt-row-highlight` 双重限定；`ClientConfigPage.vue` 后续变化属本页自身，未触及未启用页；可用 |
| 125% 缩放/焦点 | `reports/evidence/CLIENT-CONFIG-ROW-HEIGHT-AND-OPTIONAL-ELLIPSIS-IMPLEMENTATION-001-R1/real-zoom-summary.json` → `zoomLegs.{100,125}`、`focus.{100,125}` | 第七轮实现 R1 | `/config/client` 真实浏览器缩放 | 仅引用，不重跑；与本轮焦点样式一致 |
| 行高对照 | `reports/evidence/CLIENT-CONFIG-ROW-HEIGHT-AND-OPTIONAL-ELLIPSIS-IMPLEMENTATION-001/row-height-results.json` → `diffSummary`、`zeroWrite` | 第七轮实现 | `/config/client` + 参考页 | 仅引用 48px 参考口径 |

可复用性结论：未启用页源码在两组历史证据采集后未发生变化；公共 CSS 的后续新增不匹配未启用页（其页面从未挂载 `lt-row-highlight`）；因此历史“零变化”证据在本轮 HEAD 仍成立。本轮**未**为补证而访问任何其他功能页面。

---

## 6. 本次只读补采与网络拦截

- 脚本：`reports/evidence/CLIENT-CONFIG-DISABLED-APPLICABILITY-TARGETED-READONLY-ACCEPTANCE-001/probe-disabled-applicability.mjs`
- 运行命令：

```bash
PLAYWRIGHT_CORE_DIR=/root/.hermes/hermes-agent/node_modules/playwright-core \
node docs/features/client-config/reports/evidence/CLIENT-CONFIG-DISABLED-APPLICABILITY-TARGETED-READONLY-ACCEPTANCE-001/probe-disabled-applicability.mjs
```

- 结果：`disabled-applicability-results.json`；`writeInterception.installedBeforeNavigation=true`，策略为 `/api/**` GET/HEAD/OPTIONS 放行、其余 `abort('blockedbyclient')` 并计数；**`nonGetAttempts=0`，`attempts=[]`**。
- 动作边界：仅导航、悬停、真实 Tab、鼠标按下/释放（释放后打开新增弹窗，随后仅关闭）、打开并关闭行菜单；**未**填写有效新增/编辑表单、**未**提交、**未**点击启停/删除最终确认、**未**选择菜单命令。
- 网络计数含义：`nonGetAttempts=0` 仅证明本探针浏览器会话未发出非 GET `/api/**` 请求，**不等于**对后端全部请求日志或数据库层的独立审计；本任务亦未声称网络计数证明库级零写。

---

## 7. 逐条判定与统计

### 7.1 `CCFG-AC-090` → `PASS`

适用前置/步骤/预期均有本轮观察或历史复用证据：默认/Hover/真实 Tab/按下/图标文案/最右位置/点击弹窗/查询重置；参考页并排对照复用历史 `reference_identical=true` 且参考页源码未变；禁用子项按适用性说明为不适用，未构造。**无适用项缺失，无产品反例。**

### 7.2 `CCFG-AC-157` → `PASS`

适用外观/可访问性/opt-in 作用域/公共层边界/28px 非强制行高均有本轮观察或源码推导；未启用页零变化与迁移状态复用历史证据并核对源码未变；禁用子项为不适用；三点入口可选性由 §12 契约保持。**无适用项缺失，无产品反例。**

### 7.3 统计

| 状态 | 本轮前 | 本轮后 |
|---|---:|---:|
| PASS | 78 | **80** |
| FAIL | 0 | **0** |
| BLOCKED | 64 | **62** |
| NOT_RUN | 15 | **15** |
| 合计 | 157 | **157** |

`changed_ids = [CCFG-AC-090, CCFG-AC-157]`。其余 **155** 个状态格不变；四族计数保持 `REQ154 / AC157 / DESIGN89 / UI77`。

**本任务只是两条 AC 的定向只读验收，不是 157 条整体正式验收。**

---

## 8. 限制与未执行项

- **跨页对照**：本轮未访问 `/config/data-source` 或其他页面；AC-090 参考页对照与 AC-157 未启用页零变化仅复用历史证据，并已核对页面源码未变、公共 CSS 后续新增被双重限定。
- **禁用态**：未制造、未截图、未写成实际验收；按 2026-11-03 适用性说明记为不适用。
- **写路径**：未执行新增/编辑提交、启停、删除、确认框最终确认；写授权状态 `NOT_REQUESTED`。
- **构建与测试**：未运行 `mvn`、`npm run build`、lint、类型检查或测试套件。
- **服务**：未重启、未停止既有前后端；未启动同步采集进程。
- **产物一致性**：jar 的 mtime/SHA-256 已记录，但不作为源码等价性证明。
- **125% 缩放**：仅引用历史观察，未重跑。

---

## 9. 服务与临时进程

| 服务 | PID | 监听 | 处理 |
|---|---:|---|---|
| 后端（既有） | `8120` | `*:8080` | **保留运行**；未重启、未停止 |
| 前端 Vite（既有） | `8141` | `0.0.0.0:5173` | **保留运行**；未重启、未停止 |

本轮浏览器为临时隔离上下文，探针结束后已关闭；未遗留额外浏览器进程。停止既有服务可按项目既有约定执行（本任务不代为停止）：`kill 8120`、`kill 8141`。

---

## 10. 变更文件

| 路径 | 变更 |
|---|---|
| `docs/features/client-config/ACCEPTANCE.md` | 新增 §1.29 状态块与 §6 变更记录；**仅** `CCFG-AC-090`、`CCFG-AC-157` 两格 `BLOCKED→PASS` |
| `docs/features/client-config/README.md` | 新增 §1.23 当前事实、§2 导航行、§4 条目、§5 现行下一入口 |
| `docs/features/client-config/reports/CLIENT-CONFIG-DISABLED-APPLICABILITY-TARGETED-READONLY-ACCEPTANCE-001.md` | 本报告 |
| `docs/features/client-config/reports/evidence/CLIENT-CONFIG-DISABLED-APPLICABILITY-TARGETED-READONLY-ACCEPTANCE-001/` | `probe-disabled-applicability.mjs`、`disabled-applicability-results.json`、`env-and-version.txt`、`README.md`、`SHA256SUMS.txt` |

未改动：产品源码、测试、共享 CSS、依赖、配置、模板基线、其他功能文档、历史报告与历史证据。

---

## 11. 下一入口

`CHATGPT_REMOTE_CLIENT_CONFIG_DISABLED_APPLICABILITY_TARGETED_READONLY_ACCEPTANCE_REVIEW`

**定向只读验收 ≠ 写授权 ≠ 157 条整体验收通过 ≠ 批准其他页面接入或迁移；提交/推送成功不代表远程复审通过。**
