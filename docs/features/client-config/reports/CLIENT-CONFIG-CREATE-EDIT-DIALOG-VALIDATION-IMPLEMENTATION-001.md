# CLIENT-CONFIG-CREATE-EDIT-DIALOG-VALIDATION-IMPLEMENTATION-001 执行报告

第四轮“新增／编辑探针弹窗校验与交互调整”已批准基线的**前端实现**执行报告。

## 1. 任务身份与现场

| 项目 | 值 |
|---|---|
| 任务编号 | `CLIENT-CONFIG-CREATE-EDIT-DIALOG-VALIDATION-IMPLEMENTATION-001` |
| 任务类型 | 前端实现（仅 `/config/client` 新增／编辑弹窗） |
| 分支 | `develop` |
| 起始提交 | `b35ea6974adad3f61b6599de0c8b48f124125ae6`（第四轮基线批准收口结果提交） |
| 任务开始时 `origin/develop` | `b35ea6974adad3f61b6599de0c8b48f124125ae6` |
| 任务开始时本地与远程分歧 | `git rev-list --left-right --count origin/develop...HEAD` = `0 0`（无分叉、远程未推进） |
| 依据已批准基线 | `adjustment4_baseline_status=APPROVED`、`adjustment4_approval_status=APPROVED_BY_PROJECT_OWNER`、`adjustment4_approval_date=2026-09-24`、`adjustment4_approved_reviewed_commit=9daf03848d53008d3ac73e6a43c1368fa5d72750` |
| 任务开始时已存在的无关工作区修改 | `.claude/settings.local.json`（**未触碰**）、未跟踪 `docs/prompts/**`（**未触碰、未提交**） |

任务开始前已按 §3 读取 `docs/baseline/` 六份正式项目级基线与 `docs/features/client-config/` 下 `README.md`、`REQUIREMENTS.md`、`ACCEPTANCE.md`、`DESIGN.md`、`UI.md`、`API.md`、`DATABASE.md`；未读取 `docs/baseline-work/` 过程材料（无歧义追溯需要）。

## 2. 实现范围

| 类别 | 文件 | 说明 |
|---|---|---|
| 代码（修改） | `frontend/src/views/client-config/ClientConfigPage.vue` | 字段级校验反馈、主按钮口径、数据源提示与反馈区稳定空间、弹窗居中与标签右对齐、ID／描述长度与截断 |
| 测试（修改） | `frontend/src/views/client-config/ClientConfigPage.spec.ts` | 迁移既有的“预先禁用”断言、新增第四轮定向测试 |
| 文档 | `docs/features/client-config/{README,REQUIREMENTS,ACCEPTANCE,DESIGN,UI}.md` | 仅当前状态／导航／非定义行执行说明同步 |
| 文档（新增） | `docs/features/client-config/reports/CLIENT-CONFIG-CREATE-EDIT-DIALOG-VALIDATION-IMPLEMENTATION-001.md` | 本报告 |

**明确未修改**：主列表、`+N` 弹层、`/config/data-source` 数据源管理参考页（`frontend/src/views/data-source/DataSourcePage.vue`）、两套公共模板实现与模板级全局状态、路由／菜单、前端 API 类型与接口、后端代码、`API.md`、`DATABASE.md`、`docs/baseline/**`、`docs/features/README.md`、历史报告、`docs/prompts/**`、数据库对象、ZooKeeper、Kafka、构建依赖与 `.claude/settings.json`。未新增同目录辅助文件（不需要）。

代码变更规模：`ClientConfigPage.vue` +347/−? （`git diff --stat` 记为 347 行变更）、`ClientConfigPage.spec.ts` +422 行；两文件合计 `705 insertions(+), 64 deletions(-)`。

## 3. 逐条实现映射（REQ → 落点）

### 3.1 A. 字段级校验（`CCFG-REQ-123~125`）

| 定义行 | 实现落点 |
|---|---|
| `CCFG-REQ-123` / `CCFG-AC-118` / `CCFG-DESIGN-061` / `CCFG-UI-050` | 新增状态 `idFieldError`／`descFieldError`／`sourceFieldError` 与模板 ref `idControlEl`／`descControlEl`／`sourceControlEl`；`validateClientId()`／`validateDesc()`／`sourceFieldInvalid` 分别产出各字段错误；模板中 `.cc-field--error` 触发控件红框、其下 `.cc-field-feedback` 内 `.cc-field-error`（`role="alert"`）就地显示红字。`submitDialog()` 一次调用三项校验（非提前 return 的逐项短路），逐字段呈现错误后 `focusFirstError()` 在 `nextTick` 后聚焦第一个错误控件（不可聚焦时 `scrollIntoView({ block: 'nearest' })`，包裹 try/catch）。三个 `watch`（`clientIdDraft`／`clientDescDraft`／`chosen` deep）在**该字段已有错误**时只重算／清除该字段错误，不影响其他字段 |
| `CCFG-REQ-123` / `CCFG-AC-119` / `CCFG-DESIGN-061` / `CCFG-UI-052` | 业务校验失败路径**不再**调用 `ElMessage`，且不对同一错误重复弹顶端消息；顶层提示仅保留：提交成功（`ElMessage.success`）、无法归属字段的服务端业务错误、网络异常 |
| `CCFG-REQ-125` / `CCFG-AC-121` / `CCFG-DESIGN-063` / `CCFG-UI-052` | `ID_ERROR_CODES = new Set([40100, 40101, 40940])`、`DESC_ERROR_CODES = new Set([40102])`、`SOURCE_ERROR_CODES = new Set([40103, 40104, 40105, 40941])`；`applyServerFieldError(code, message)` 命中即写入对应字段错误并返回 `true`，未命中返回 `false` 由 `submitDialog()` 走 `ElMessage.error`。错误码取自 `API.md` §9 既有契约，**未**新增或修改任何错误码、接口或后端行为 |

### 3.2 B. 主按钮、数据源提示与布局稳定（`CCFG-REQ-124`、`CCFG-REQ-126~128`）

| 定义行 | 实现落点 |
|---|---|
| `CCFG-REQ-124` / `CCFG-AC-120` / `CCFG-DESIGN-062` / `CCFG-UI-051` | 主按钮 `:disabled="submitting"`、`:loading="submitting"`，**不再**由表单完整性预先禁用；常态 `disabled=false`、黑色 `rgb(9,9,11)`／白字／6px／500；`.cc-dialog-submit:not(.is-disabled)` 承载常态样式（既有 hover／focus／active 保留），禁用与 loading 态仍由 Element Plus 呈现、不被正常态规则覆盖；`submitDialog()` 首行守卫 `if (mode === null || submitting) return` 实现防重复；取消／自动生成／“修改探针 ID”外观与行为未改，按钮文案仍为 `创建`／`保存` |
| `CCFG-REQ-126` / `CCFG-AC-122` / `CCFG-DESIGN-064` / `CCFG-UI-053` | `sourceFeedback` 计算属性：`chosen.length === 0` 时返回 `{ text: '至少选择 1 个数据源', tone: submitAttempted ? 'error' : 'neutral' }`，否则返回 `null`。模板 `.cc-field-feedback__text` 以 `tone === 'error' ? 'cc-field-error' : 'cc-field-hint'` 切换红色／中性灰；选中任一即隐藏，全部移除后按 `submitAttempted` 正确恢复灰或红 |
| `CCFG-REQ-127` / `CCFG-AC-123` / `CCFG-DESIGN-065` / `CCFG-UI-054` | 点击提交时 `submitAttempted = true`，未选数据源即转红色错误且 `.cc-split--error` 使 `.cc-pane` 显红框；`resetDialog()` 清除 `submitAttempted` 与三处字段错误，故关闭重开为新会话（未尝试提交 → 中性灰） |
| `CCFG-REQ-128` / `CCFG-AC-124/125` / `CCFG-DESIGN-066` / `CCFG-UI-055` | `.cc-field-feedback { min-height: 20px; margin-top: 2px }`、`overflow: visible`；`.cc-field-feedback__text { overflow-wrap: anywhere; line-height: 1.4 }` 使长文案完整换行、不硬裁剪；反馈区始终占位，状态切换不改变弹窗高度。窄视口沿用既有 `.cc-form { max-height: calc(100vh - 240px); overflow-y: auto }` 受控滚动规则，未新增或放宽 |

### 3.3 C. 弹窗定位与配置项名称（`CCFG-REQ-129~130`）

| 定义行 | 实现落点 |
|---|---|
| `CCFG-REQ-129` / `CCFG-AC-126` / `CCFG-DESIGN-067` / `CCFG-UI-056` | 弹窗保持 `width="900px"`，居中交由 Element Plus 既有机制：`.el-overlay { position: fixed }` + `.el-dialog { margin: var(--el-dialog-margin-top, 15vh) auto 50px }`（左右 auto → 相对 `position: fixed` 的 overlay 居中，overlay 宽度即浏览器可见视口）；`:deep(.cc-dialog) { max-width: calc(100vw - 48px) }` 保留窄视口安全边距。**未**写死任何与侧栏宽度相关的偏移量：本页源文件不出现 `220px`、`64px`，唯一 `calc(100vw` 用法即上述 `max-width` |
| `CCFG-REQ-130` / `CCFG-AC-127` / `CCFG-DESIGN-068` / `CCFG-UI-057` | `.cc-form-label { text-align: right; flex: 0 0 84px; font-size: 14px; font-weight: 500; color: #3f3f46 }`，必填红星 `.cc-form-label::before` 保留；左边缘不强制对齐，右边缘随同一 flex 基准整齐 |

### 3.4 D. 长度、截断与历史数据（`CCFG-REQ-131~134`）

| 定义行 | 实现落点 |
|---|---|
| `CCFG-REQ-131` / `CCFG-AC-128/129` / `CCFG-DESIGN-069` / `CCFG-UI-058`；定向修订 `CCFG-REQ-037` | `ID_MAX_LENGTH = 32`；`clientIdModel` 可写计算的 setter 以 `slice(0, ID_MAX_LENGTH)` 截断，原生 `maxlength="32"` 同步生效（手工输入与粘贴同限）；`ID_PATTERN = /^[A-Za-z0-9][A-Za-z0-9._-]{0,31}$/` 保持首位、字符集与大小写不敏感唯一性口径；非法字符**不**被静默改写，`9bad!` 提交后在 ID 字段下方以字段级错误指出格式问题；编辑默认锁定、`toggleClientIdLock()` 的解锁／取消修改语义保留，解锁后改空 ID 报错、取消修改恢复原 ID 并清除该字段错误 |
| `CCFG-REQ-132` / `CCFG-AC-130/131` / `CCFG-DESIGN-070` / `CCFG-UI-013/059`；定向修订 `CCFG-REQ-039` | `DESC_MAX_CHARS = 256`；`truncateCodePoints(value, max)` 以 `Array.from` 按码点切片，不拆散代理对；`clientDescModel` setter 以同一函数截断（输入与粘贴一致）；文本框提示改为 `探针用途描述（最多 256 个字符）`；`javaTrim()` 仅用于判空、提交使用 `clientDescDraft.value` 原文；前端 `utf8Bytes()`（`TextEncoder`）与后端 `VARCHAR2(1024 BYTE)` 上限**均未**改动，**未**把任何上限改为 256 字节 |
| `CCFG-REQ-133` / `CCFG-AC-132` / `CCFG-DESIGN-070` / `CCFG-UI-015/059`；定向修订 `CCFG-REQ-060` | `onAutoGenerate()`：无已选数据源 → 直接 `return`（严格无动作）；存在缺失机构名 → 沿用既有 `ElMessage.warning` 失败处理；有效时**先**按 `chosen` 原选择顺序依 `DATA_SOURCE_ORG` 拼出完整描述，**再** `truncateCodePoints(generated, 256)` 直接保留前 256 个完整字符写入描述输入框；原“生成完整结果超 1024 字节则失败”分支**已移除**，不弹超长提示、不阻断；顺序／Trim／覆盖规则保留 |
| `CCFG-REQ-134` / `CCFG-AC-133` / `CCFG-DESIGN-071` / `CCFG-UI-059` | `openEdit()` 中 `clientDescDraft.value = truncateCodePoints(row.clientDesc ?? '', DESC_MAX_CHARS)`——仅把前 256 个完整字符回显为本次编辑草稿；列表数据未被写入或篡改，未保存关闭不产生任何写请求；保存则按该草稿走既有更新接口 |

### 3.5 范围与追踪（`CCFG-REQ-135~136`）

| 定义行 | 实现落点 |
|---|---|
| `CCFG-REQ-135` / `CCFG-AC-134` / `CCFG-DESIGN-071` | 改动限于 `/config/client` 新增／编辑弹窗；**编辑历史逗号歧义**与**异常数据源**的既有阻断／提示语义保留，阻断方式由“预先禁用主按钮”改为“点击后就地以字段级错误拒绝写库”，未静默放行、未删除该业务逻辑 |
| `CCFG-REQ-136` / `CCFG-AC-135` / `CCFG-DESIGN-071` | 仅文档登记未来“新增／编辑表单弹窗模板”入口；本轮**未**创建、**未**批准、**未**推广任何模板，本轮无新增 UI 元素 |

## 4. 测试与构建结果

| 项目 | 命令 | 结果 |
|---|---|---|
| 定向测试 | `cd frontend && npm test -- --run src/views/client-config/ClientConfigPage.spec.ts` | **136 passed / 136**（1 个测试文件，49.61s） |
| 全量前端测试 | `cd frontend && npm test` | **1116 passed / 1116**（57 个测试文件全通过，133.83s） |
| 前端构建 | `cd frontend && npm run build`（`vue-tsc --noEmit && vite build`） | **成功**（`✓ built in 19.00s`；仅有既有的 chunk 体积提示，非错误） |
| 空白检查 | `git diff --check -- frontend docs/features/client-config` | 干净（无输出） |

前端无 `type-check`／`lint` 脚本，`build` 已包含 `vue-tsc --noEmit` 类型检查。

### 4.1 定向测试覆盖的第四轮风险项

`describe('第四轮：字段级校验与主按钮口径（CCFG-REQ-123~136）')` 共 11 例，均为**行为断言**（挂载真实组件、触发真实事件、断言真实渲染结果与调用记录），未使用“扫描源字符串”式镜像断言：

1. 新增模式一次提交同时报三项字段错误 → 逐项修正只清除该项 → 最终创建成功（含提交载荷 `{ clientId: 'probe-new', clientDesc: '中心用途', dataSourceIds: ['ds-ok1'] }`）；
2. 提交被阻断时定位到第一个错误字段（`document.activeElement` 为 ID 输入框）；
3. 编辑解锁后改空 ID 报错 → “取消修改”恢复原 ID 并清除该字段错误；
4. 服务端错误码落字段：`40940`→ID、`40102`→描述、`40941`→数据源；`40942` 与 `50000`→保留全局 `ElMessage.error`；
5. 主按钮常态不预禁用 + 提交中防重复（`is-loading` 出现、`disabled` 置位、`mockedCreate` 仅调用一次，用受控 promise 释放）；
6. 数据源提示 灰 → 红 → 隐藏 → 恢复；关闭后重开会话复位为灰；
7. ID 32 位截断 + `maxlength === '32'` + `9bad!` 不被剥离且报格式错误；
8. 描述 256 码点：`'甲'.repeat(300)` 与 `'😀'.repeat(300)` 截断为 256 个完整字符（正则断言无孤立代理项）；256 个汉字可保存成功；
9. 自动生成 `'A'.repeat(150) + ',' + 'B'.repeat(150)` → 保留前 256 字符，无 warning／error；
10. 编辑历史 `'甲'.repeat(300)` → 仅 256 字符草稿、列表原记录不变、关闭不写库、保存发送 `'甲'.repeat(256)`；
11. 编辑历史歧义阻断 → 字段级红色反馈、不落全局提示。

另含 1 例静态口径断言（输入提示文案、`.cc-form-label` 右对齐、`.cc-field-feedback` 非空 `min-height` 且无 `overflow: hidden`、`:deep(.cc-dialog)` 的 `calc(100vw - 48px)`、本页源文件不含 `220px`／`64px`）。

## 5. 真实浏览器核对

本机存在 `/usr/bin/google-chrome`，以**仓库外**临时脚本 `/tmp/ccvis/r4-validate.mjs` 驱动：临时静态服务（端口 5199）提供 `frontend/dist` 构建产物，并用接口桩响应 `/api/clients` 与 `/api/clients/data-source-options`；Chrome 以 `--headless=new --no-sandbox --remote-debugging-port=9335` 启动，经原始 CDP WebSocket（`Target.createTarget` → `attachToTarget(flatten)` → `Runtime.evaluate`／`Page.captureScreenshot`／`Emulation.setDeviceMetricsOverride`）采集几何与样式。**未新增或替换任何浏览器、Playwright／Puppeteer 或服务依赖**，未修改仓库文件；核对用临时进程已随脚本退出。

场景矩阵：3 个视口（1440×900、1920×1080、1024×720）× 侧栏展开／收起 × 5 个状态（idle、multierror、valid、loading、done）= 30 个场景，其中 24 个为弹窗打开状态、6 个为关闭后。

结论 `BROWSER_VERIFIED_HEADLESS`，关键读数（本次 fresh 运行，`/tmp/ccvis/r4/r4v-results.json`）：

| 核对项 | 读数 |
|---|---|
| 弹窗相对可见视口水平居中 | 24 个弹窗打开场景 `dialogCenterDelta` **全部为 0**（1440／1920／1024 × 展开／收起） |
| 弹窗宽度与 overlay 定位 | 弹窗宽度 **900**（全部）；`.el-overlay` 计算 `position: fixed`；`max-width` 随视口为 `1392px`／`1872px`／`976px`（＝视口 − 48） |
| 字段级错误数量 | idle **0**、multierror **3**、valid **0** |
| 控件红框 | multierror 下 ID 与描述控件 `box-shadow: rgb(245, 108, 108) 0px 0px 0px 1px inset`；数据源区 `.cc-pane` `border-color: rgb(245, 108, 108)` |
| 错误文字颜色 | `rgb(245, 108, 108)` |
| 数据源提示 | idle → `{"text":"至少选择 1 个数据源","color":"rgb(144, 147, 153)"}`（中性灰）；multierror → 同文案 `rgb(245, 108, 108)`（红）；valid → 隐藏（`null`） |
| 反馈区稳定空间 | `.cc-field-feedback` 全部为 `min-height: 20px`、`overflow: visible` |
| 布局不跳动 | 同一视口内 idle／multierror／valid／loading 四态的 dialog／footer 底边**完全一致**（footer 底边 1440×900 = 606.16、1920×1080 = 633.16、1024×720 = 579.16） |
| 配置项名称右对齐 | 三个标签 `text-align: right`、右边缘一致（1440×900 均为 370） |
| 主按钮常态 | `disabled=false`、class 不含 `is-disabled`、`bg: rgb(9, 9, 11)`、`radius: 6px`、`weight: 500`、`color: rgb(255, 255, 255)` |
| 提交中防重复 | 6 个双击场景对应 6 次写请求（`writes = 6`），未出现重复提交 |
| 窄视口可操作性 | 1024×720 下标题与底部按钮均在视口内（footer 底边 579.16 < 720） |

### 5.1 加载态配色的解释差异（**待项目负责人目测确认**）

loading 场景实测主按钮为 `bg: rgb(160, 207, 255)`、`radius: 4px`、class 含 `is-disabled is-loading`——即 Element Plus 既有加载外观。本实现**未**覆盖该外观，依据为：`CCFG-UI-047`（本轮未被修订的保留条款）要求“禁用态与 loading 态**沿用 Element Plus 既有视觉且不被正常态规则覆盖**（以 `:not(.is-disabled)` 类限定）”，且 `CCFG-UI-051` 要求“加载态**不得**在蓝色与黑色之间跳色”；本实现把“跳色”理解为**闪烁／来回跳变**（当前以 `:not(.is-disabled)` 作用域使加载态单次稳定呈现，无跳变）。

若把“不得在蓝色与黑色之间跳色”理解为“加载态也须为黑色”，则会与同轮保留的“沿用 Element Plus 既有视觉”相冲突。本报告按**保留条款口径**实现，并将此解释差异照实登记为**待项目负责人目测确认项**，未擅自改判已批准基线。项目负责人若判定加载态需为黑色，应由独立的基线纠错任务处理。

## 6. 定义行完整性与状态边界

| 校验项 | 结果 |
|---|---|
| `CCFG-REQ` 定义行（`^\| CCFG-REQ-NNN \|`） | 136 行，相对 `b35ea697` **逐字节零变化** |
| `CCFG-AC` 定义行 | 135 行，相对 `b35ea697` **逐字节零变化** |
| `CCFG-DESIGN` 定义行 | 71 行，相对 `b35ea697` **逐字节零变化** |
| `CCFG-UI` 定义行 | 59 行，相对 `b35ea697` **逐字节零变化** |
| 验收执行状态 | `CCFG-AC-001~135` 共 135 行，其中 `NOT_RUN` **135/135**，无任何 `PASSED`／`FAILED`／`BLOCKED` |

- 本任务**只**同步 `adjustment4_implementation_status=IMPLEMENTED_PENDING_CHATGPT_REVIEW`；`adjustment4_baseline_status` 保持 `APPROVED`，`adjustment4_approval_status`／`approval_date`／`approved_reviewed_commit` 保持批准收口值不变。
- 前几轮实现事实（`existing_feature_implementation_status`／`adjustment_implementation_status`／`adjustment2_implementation_status` 均为 `IMPLEMENTED_PENDING_USER_ACCEPTANCE`，`adjustment3_implementation_status=IMPLEMENTED_PENDING_CHATGPT_REVIEW`）保持真实、未改写。
- 批准收口时点的 `NOT_STARTED` 与旧 `next_entry` 表述均按“历史时点、照实保留”处理，未改写历史。
- 本任务**不**执行正式验收、**不**宣称任何用例通过、**不**宣称项目负责人已目测或已接受页面。

## 7. 未验证项与遗留

| 项目 | 状态 | 说明 |
|---|---|---|
| 项目负责人页面目测 | **未执行** | 需项目负责人在实际页面确认视觉效果与交互，尤以第 5.1 节加载态配色解释差异为先 |
| 正式验收执行 | **未执行** | `CCFG-AC-118~135` 18 条连同全文件 135 条仍全部 `NOT_RUN` |
| 真实后端数据联调 | **未覆盖** | 浏览器核对使用**接口桩注入的伪造响应**，非真实后端；真实 E1/E2/E4/E5 链路与真实错误码返回未在浏览器中验证（错误码落字段由单元测试以桩响应覆盖） |
| 真实 32 位／256 字符落库 | **未覆盖** | 未对真实业务数据做任何写操作（任务禁止）；后端 `VARCHAR2(1024 BYTE)` 与 UTF-8 校验未在真实库中触发 |
| 加载态配色最终口径 | **待项目负责人判定** | 见第 5.1 节 |
| 通用“新增／编辑表单弹窗模板” | **未创建** | 须在本轮页面实现经项目负责人实际目测认可后另开任务提炼 |

## 8. 状态分层（本任务完成时点）

```text
existing_feature_implementation_status=IMPLEMENTED_PENDING_USER_ACCEPTANCE
adjustment_baseline_status=APPROVED
adjustment_implementation_status=IMPLEMENTED_PENDING_USER_ACCEPTANCE
adjustment2_baseline_status=APPROVED
adjustment2_implementation_status=IMPLEMENTED_PENDING_USER_ACCEPTANCE
adjustment3_baseline_status=APPROVED
adjustment3_approval_status=APPROVED_BY_PROJECT_OWNER
adjustment3_implementation_status=IMPLEMENTED_PENDING_CHATGPT_REVIEW
adjustment4_baseline_status=APPROVED
adjustment4_approval_status=APPROVED_BY_PROJECT_OWNER
adjustment4_approval_date=2026-09-24
adjustment4_approved_reviewed_commit=9daf03848d53008d3ac73e6a43c1368fa5d72750
adjustment4_implementation_status=IMPLEMENTED_PENDING_CHATGPT_REVIEW
adjustment4_formal_acceptance_execution_status=NOT_RUN
formal_acceptance_execution_status=NOT_RUN
PENDING_USER_CONFIRMATION=0
next_entry=CHATGPT_REMOTE_CLIENT_CONFIG_CREATE_EDIT_DIALOG_VALIDATION_IMPLEMENTATION_REVIEW
```

## 9. 数据与外部系统写操作

| 系统 | 状态 |
|---|---|
| 数据库写操作 | `NOT_REQUESTED`（本任务未执行任何 SQL，未连接数据库） |
| ZooKeeper 写操作 | `NOT_REQUESTED`（未连接 ZooKeeper） |
| Kafka | `NOT_REQUESTED`（未连接 Kafka） |
| 后端代码／构建 | 不适用（前端任务，未运行 Maven） |

## 10. 下一步

`CHATGPT_REMOTE_CLIENT_CONFIG_CREATE_EDIT_DIALOG_VALIDATION_IMPLEMENTATION_REVIEW`：由 ChatGPT **从远程 Git** 对本实现结果提交做独立**代码**复审。该复审通过**不等于**已目测、已验收或已获项目负责人接受；项目负责人后续仍须对实际页面做目测。对“新增／编辑表单弹窗通用模板”仅保留后续入口，须在本轮页面实现经项目负责人实际目测认可后另开任务提炼。
