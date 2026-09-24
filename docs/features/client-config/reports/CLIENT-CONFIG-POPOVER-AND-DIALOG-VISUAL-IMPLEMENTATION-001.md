# 探针端管理 `+N` 清单与新增／编辑弹窗视觉调整 · 独立实现任务执行报告

> 任务代码：`CLIENT-CONFIG-POPOVER-AND-DIALOG-VISUAL-IMPLEMENTATION-001`
> 任务类型：前端实现（`/config/client` 单页 `+N` 清单与新增／编辑弹窗视觉调整）
> 分支：`develop`
> 起始提交：`cf0817f23c77190275b7f58c755c4e2c4619adc9`
> 上游门禁：ChatGPT 远程 R1 复审 `APPROVED`；项目负责人 2026-09-23 批准第三轮视觉调整基线（`adjustment3_approved_reviewed_commit=1df0ef7b4e3717d9b980e9aa9cc1f8e4f036f244`），批准收口提交 `cf0817f23c77190275b7f58c755c4e2c4619adc9`
> 下一入口：`CHATGPT_REMOTE_CLIENT_CONFIG_POPOVER_AND_DIALOG_VISUAL_IMPLEMENTATION_REVIEW`
> 本任务不执行正式验收，不作出项目负责人目测通过或最终接受结论。

---

## 1. 门禁与基线

```text
branch=develop
expected_base_commit=cf0817f23c77190275b7f58c755c4e2c4619adc9
actual_base_commit=cf0817f23c77190275b7f58c755c4e2c4619adc9
baseline_approval_status=APPROVED
adjustment3_approved_reviewed_commit=1df0ef7b4e3717d9b980e9aa9cc1f8e4f036f244
adjustment3_implementation_status(before)=NOT_STARTED
adjustment3_implementation_status(after)=IMPLEMENTED_PENDING_CHATGPT_REVIEW
page_level_authorization_status=GRANTED_FOR_CONFIG_CLIENT_ONLY
git_commit_authorized=false
git_push_authorized=false
```

- 本地 `HEAD` 与任务预期起始提交一致；工作区除本任务目标文件外，另有任务开始前即存在的 `.claude/settings.local.json` 修改与未跟踪的 `docs/prompts/**`。
- 本次用户明确授权**进入代码实现**，但**未**授权 `git add` / `git commit` / `git push`；全部改动停留在工作区，未暂存、未提交、未推送。
- 未执行 `git pull` / `fetch` / `merge` / `rebase` / `reset` / `clean` / `stash` / `checkout --`，未改写历史，未强推。

## 2. 实际文件清单

### 2.1 代码与测试（允许修改的白名单内）

| 文件 | 变更性质 |
|---|---|
| `frontend/src/views/client-config/ClientConfigPage.vue` | 第三轮五组视觉调整实现（`+N` 清单两级信息与自然增高、弹窗尺寸与数据源区、配置项名称令牌、主提交按钮、菜单条目字重） |
| `frontend/src/views/client-config/ClientConfigPage.spec.ts` | 移除已过时的 `320px`/内部滚动断言，新增第三轮定向组件回归（本文件 122 例） |

未新增其他定向测试文件；未修改两个公共模板实现、数据源管理参考页、路由/菜单、前端 API 类型与接口、后端代码、数据库对象、DDL 或构建依赖。

### 2.2 当前状态文档（最小同步）

| 文件 | 变更性质 |
|---|---|
| `docs/features/client-config/README.md` | 当前实现状态、导航、新增 §1.8 第三轮实现记录 |
| `docs/features/client-config/REQUIREMENTS.md` | 元数据实现状态与任务编号、§7.12 现行状态与追加时序说明 |
| `docs/features/client-config/ACCEPTANCE.md` | 元数据实现状态与任务编号、§1.7 状态块、§2 状态口径、§3 计数说明、§6 变更记录追加 |
| `docs/features/client-config/DESIGN.md` | 元数据实现状态、§15 状态分层与追加时序说明、§16 变更记录追加 |
| `docs/features/client-config/UI.md` | 元数据实现状态与当前下一入口、§17 状态分层与追加时序说明、§18 变更记录追加 |

**未**修改 `API.md`、`DATABASE.md`、`docs/features/README.md`、任何既有/历史报告、`docs/baseline/**` 六份项目级基线与两套模板的 `README`/`SHARED_COMPONENT_DESIGN`/`MIGRATION`、数据源管理参考页。

### 2.3 新增报告

| 文件 | 说明 |
|---|---|
| `docs/features/client-config/reports/CLIENT-CONFIG-POPOVER-AND-DIALOG-VISUAL-IMPLEMENTATION-001.md` | 本报告（新增） |

## 3. 设计映射（已批准条款 → 实现）

| 已批准条款 | 实现落点 | 结果 |
|---|---|---|
| `CCFG-DESIGN-054` / `CCFG-UI-043` / `CCFG-REQ-113`/`114` | `+N` 清单项改为**两级信息**：主信息 `.cc-full-org` 渲染完整 `DATA_SOURCE_ORG`；次信息 `.cc-full-id` 前缀 `数据源 ID：` + 完整 `DATA_SOURCE_ID`，两行 `display: block` 分行 | 已实现 |
| `CCFG-DESIGN-054` / `CCFG-UI-043` / `CCFG-REQ-114` | `hasOrg(ds)` 为假时以原始 `DATA_SOURCE_ID` 作为**主信息**渲染，且**不**输出次信息行（不重复两遍） | 已实现 |
| `CCFG-AC-107` / `CCFG-AC-108` | 项级异常与冲突探针信息保留在**项内** `.cc-full-bad`（红色），逗号歧义行 `.cc-full-note` 文案与事实边界逐字保留；清单仍遍历 `row.dataSources`（**原存储顺序**），异常项**不隐藏** | 已实现 |
| `CCFG-DESIGN-055` / `CCFG-UI-044` / `CCFG-REQ-115` | **移除** `.cc-full-list` 的 `max-height: 320px` 与 `overflow-y: auto`；清单按内容自然增高；项间以 `.cc-full-item + .cc-full-item { border-top: 1px solid #f0f0f0 }` 浅分隔线区分；未以其他选择器或内联样式重新引入内部滚动或固定最大高度 | 已实现（无内部滚动） |
| `CCFG-DESIGN-055` / `CCFG-UI-044` / `CCFG-REQ-016` | 触发方式仍为点击 `+N`（`trigger="click"`）、`+N` 计数不变、主表行高不变、单标签悬停 Tooltip 不变；边缘避让/翻转沿用既有 Popper（见 §4.4 风险） | 保留 |
| `CCFG-DESIGN-056` / `CCFG-UI-045` / `CCFG-REQ-116` | `<el-dialog class="cc-dialog">` 宽度 `680px` → `900px`，并新增 `:deep(.cc-dialog) { max-width: calc(100vw - 48px) }` 保留左右安全间距；窄视口按可用空间收缩、**不**横向溢出；标题/关闭/取消/主提交在窄视口可见可操作 | 已实现 |
| `CCFG-DESIGN-057` / `CCFG-UI-045` / `CCFG-REQ-117` | `.cc-opt-list` 与 `.cc-pane--chosen .cc-chosen-list` 最大高度 `200px` → `260px`（保留 `overflow-y: auto`）；`.cc-pane--options { flex: 1.15 }` / `.cc-pane--chosen { flex: 1 }` 使“可选数据源”略宽于“已选”；候选来源、可搜索字段、`COMMA_IN_ID`/`OCCUPIED` 置灰与提示、编辑自排除语义零改动 | 已实现 |
| `CCFG-DESIGN-058` / `CCFG-UI-046` / `CCFG-REQ-119` | `.cc-form-label` 对齐参考页标签令牌 `font-size: 14px; font-weight: 500; color: #3f3f46`；**未**设置 `font-family`（沿用默认无衬线字体族）；未套用主表探针 ID 的等宽粗体；必填红星 `.cc-form-label::before` 与校验语义保留；改动限于本页 scoped 样式 | 已实现 |
| `CCFG-DESIGN-059` / `CCFG-UI-047` / `CCFG-REQ-120` | 主提交按钮加 `class="cc-dialog-submit"`；以 `.cc-dialog-submit:not(.is-disabled)` 限定正常态 `#09090b` 实心底与边框、`#ffffff` 文字、`border-radius: 6px`、`font-weight: 500`；Hover/聚焦 `#27272a`、按下 `#18181b`；禁用态与 loading 态**不**被正常态覆盖；仅该按钮改色（取消/自动生成/修改探针 ID 未加该 class）；未新增全局样式、未使用 `!important` | 已实现 |
| `CCFG-DESIGN-060` / `CCFG-UI-048` / `CCFG-REQ-121` | 主提交按钮文案保持 `{{ mode === 'edit' ? '保存' : '创建' }}`（新增“创建”、编辑“保存”），未改动任何按钮文案 | 保留 |
| `CCFG-DESIGN-060` / `CCFG-UI-049` / `CCFG-REQ-122` | 非 scoped 的 `.cc-more-popper .el-dropdown-menu__item` 增加 `font-weight: 400`，使“删除”与“启用／停用”字重一致（不再加粗）；红色文字、上方分隔线、Hover/焦点反馈、三点入口、事件边界、二次确认与 API 语义不变 | 已实现 |
| 既有回归（`CCFG-REQ-` 既有条目） | 首次自动查询、默认 ID 降序、不分页、关键词与状态过滤、重置仅恢复控件、双击行编辑、探针 ID 键盘 Enter/Space 编辑、探针 ID 三态标识、行级忙碌、异常行安全菜单、`+N` 计数与点击触发、单标签悬停 Tooltip、弹窗搜索/置灰/选择/移除/校验阻断/未保存关闭确认 | 保留 |

## 4. 验证证据（真实执行结果）

### 4.1 定向组件测试（Vitest）

```text
命令：npx vitest run src/views/client-config/ClientConfigPage.spec.ts
结果：Test Files 1 passed (1)；Tests 122 passed (122)；Duration 29.18s
```

覆盖要点（本轮新增/替换部分）：

- 原“清单最大高度 320px / 内部滚动”静态断言已**删除**，改为断言 `.cc-full-list` 不存在 `max-height`/`overflow-y` 规则、全文不再出现 `max-height: 320px`，同时确认 `.cc-form` 与候选区仍保留受控滚动；
- `+N` 清单两级信息：主信息为机构名称、次信息为 `数据源 ID：…`，两者分行；`hasOrg` 为假时仅原始 ID 且无次信息行；
- 项级异常/冲突信息与逗号歧义提示文案保留；清单顺序为原存储顺序、异常项不隐藏；
- 弹窗新增/编辑文案“创建”/“保存”与 `cc-dialog-submit` 存在性，以及“取消”“自动生成”“修改探针 ID”**未**携带该 class；
- 禁用边界：未选数据源时提交被阻断；
- `width="900px"` 已生效、`680px` 不再出现、`max-width: calc(100vw - 48px)` 存在；
- `.cc-form-label` 令牌（`14px`/`500`/`#3f3f46`）；
- `.cc-dialog-submit:not(.is-disabled)` 配色与 hover/active，且未使用 `!important`；
- `.cc-full-org`/`.cc-full-id` 为 `display: block`、`.cc-full-item + .cc-full-item` 分隔线；
- 左右分栏比例与列表高度 > 200px，同时 `.cc-opt-list` 保留 `overflow-y: auto`；
- 共享菜单条目 `font-weight: 400` 与 `.cc-more-danger` 颜色。

> 说明：其中静态样式断言用于补充可测试令牌，**不**代表浏览器计算样式或正式验收结论；浏览器计算样式另见 §4.4。

### 4.2 全量前端测试

```text
命令：npm test
结果：Test Files 57 passed (57)；Tests 1102 passed (1102)；Duration 100.94s
```

### 4.3 前端构建

```text
命令：npm run build（= vue-tsc --noEmit && vite build）
结果：成功（vue-tsc 无错误、vite 构建通过），built in 17.05s
产物：dist/assets/ClientConfigPage-CjFPZKhj.js 22.50 kB (gzip 9.18 kB)
既有告警：仅 `index-*.js`(1,047.59 kB) / `LargeScreenPage-*.js`(1,141.31 kB) 超过 500 kB 的既有分包告警，属任务开始前已存在的现象
```

构建后 `git status --short` 未新增任何受版本控制的部署产物变更。

### 4.4 真实浏览器只读核对

```text
browser_readonly_review_status=BROWSER_VERIFIED_HEADLESS
browser=system Google Chrome (playwright-core 1.59.1，复用既有 /root/.hermes 依赖，未安装新工具)
browser_viewports=1440x900, 1920x1080, 1100x800, 900x700
data_source=route-intercepted API stubs（未访问数据库；未构造真实库数据）
```

**核验方法**：以真实浏览器加载 `/config/client`，用 `context.route` 按 `pathname` 前缀拦截 `/api/**` 返回构造的探针列表与数据源候选，测量**浏览器计算样式与几何**并截图。**限制与诚实边界**：列表与候选数据来自**接口桩**而非真实开发库；本任务**未**查询数据库。

按需求分组实测结果：

**需求 1 — `+N` 清单内容（`CCFG-REQ-113`/`114`）**

```text
.cc-full-list 项数=9
item0 org="北京协和医院"  id="数据源 ID：hosp-001"
item2 org="no-org-x"     id=null          （机构名为空：仅主信息，无重复次信息行）
item3 org="重复项医院"    bad="行内重复"
item5 org="冲突医院"      bad="已分配给其他探针：hosp-900"
item8 org="长ID医院"      id="数据源 ID：a-very-long-data-source-id-for-wrap-check-0001"
项间分隔（自第 2 项起） border-top = 1px solid rgb(240, 240, 240)
```

- 顺序与原始 `rawDataSourceIds` 一致（`hosp-001, hosp-002, no-org-x, dup-x, hosp-003, multi-x, hosp-004, hosp-005, a-very-long-…`），异常项**未**被隐藏或提前；含逗号歧义行 `.cc-full-note` 实测文案为“以下为普通 CSV 解析的展示结果（行级含逗号歧义），非已确定分配。”。

**需求 2 — `+N` 弹层高度（`CCFG-REQ-115`）**

```text
.cc-full-list computed max-height = none
.cc-full-list computed overflow-y = visible
scrollHeight = clientHeight = 516   （无内部滚动）
```

- 未以其他选择器或内联样式重新引入内部滚动或固定最大高度；弹窗与候选区的受控滚动**未**被误删（`.cc-opt-list` computed `max-height: 260px`、`overflow-y: auto`）。

**需求 3 — 新增／编辑弹窗（`CCFG-REQ-116`/`117`）**

```text
1440x900（参考）：dialog width=900
1100x800：width=900, left=100, right=1000；scrollWidth=1100=innerWidth（无横向溢出）
  footer top=667 bottom=715 inViewport=true
900x700：width=852 (=100vw-48), left=24, right=876；scrollWidth=900=innerWidth（无横向溢出）
  submit left=800 right=860 inViewport=true；close left=828 right=876 inViewport=true
左右分栏：options=413px / chosen=361px（“可选数据源”略宽于“已选”）
.cc-opt-list max-height=260px overflow-y=auto（可见高度较调整前 200px 增加）
编辑模式 dialog 标题=编辑探针、主提交文案=保存
```

**需求 4 — 弹窗字体与主按钮（`CCFG-REQ-119`/`120`/`121`）**

```text
labels: 探针 ID / 探针描述 / 采集数据源
        均为 font-size 14px, font-weight 500, color rgb(63, 63, 70)
        font-family = -apple-system, BlinkMacSystemFont, "Segoe UI", … （页面默认无衬线族，未套 monospace）
主提交按钮：
  禁用态 bg=rgb(160,207,255) radius=4px，提示“至少选择 1 个数据源”，文本“创建”
  选中 1 项后 bg=rgb(9,9,11) color=rgb(255,255,255) border=rgb(9,9,11) radius=6px weight=500
  hover bg=rgb(39,39,42) border=rgb(39,39,42)
  非禁用选择器生效；取消 / 修改探针 ID **未**携带 cc-dialog-submit（未变黑）
```

**需求 5 — 操作菜单（`CCFG-REQ-122`）**

```text
popper class = "el-popper is-pure is-light el-tooltip el-dropdown__popper cc-more-popper"
停用（cc-more-warning）font-weight=400 color=rgb(180, 83, 9)
删除（cc-more-danger）  font-weight=400 color=rgb(245, 108, 108)
删除项的 previousElementSibling = "el-dropdown-menu__item--divided"（上方分隔线由独立 li 承载）
```

**残留风险（如实记录，未处置）**

```text
fixture=9 条数据源，锚定首行，视口 1440x900
  → 弹层 placement=top（未翻转），popper top=-147 ~ -192，底部=358
  → 9 项中 6 项完全可见；第 0~2 项被视口上边界裁切
fixture=9 条，锚定首行，视口 1920x1080
  → placement 翻转为 bottom，9 项全部完整可见
fixture=6 / 4 条，锚定首行，视口 1440x900
  → placement=top，全部完整可见
fixture=9 条，14 行列表、pill 位于视口底边附近，1440x900 与 1920x1080
  → placement 均翻转为 top，9 项全部完整可见
```

- 结论：在 1440×900 下、清单较长且锚点靠近视口**顶部**时，Popover 两侧都放不下，Popper **保持** `placement=top`，内容被视口上边界裁切约 147～192px（约 6/9 项完全可见）。
- 已批准基线 `CCFG-UI-044` 明确**禁止**重新引入内部滚动或固定最大高度，并要求“沿用既有 placement 与避让/翻转行为”。因此本实现**未**自行新增自定义定位/高度兜底，仅如实记录为风险与待确认点：基线同时记录生产常见每个探针约 5～6 个数据源，该典型规模在 1440×900 下实测**全部完整可见**；只有在单探针数据源数显著超过 6 且弹层位于视口顶部时才会触及该裁切。
- 该风险**不**由本任务自行判定为不满足验收（`CCFG-AC-110` 的具体口径需由复审/验收方裁定），本报告不作出该用例通过或失败的结论。

**核对工具限制（如实记录）**

- 本环境无可用的真实开发库数据参与视觉核对，全部数据经接口桩注入；1440×900 / 1920×1080 的真实几何与样式为浏览器计算值，但**不是**项目负责人目测，**不是**正式验收。
- 弹层“再次点击关闭”的测量在探测脚本中不稳定（部分用例残留上一次弹层），**未**作为本轮证据使用；本轮新增判据不涉及关闭语义（点击展开与既有开关语义未改动）。
- 未伪造任何截图或视觉通过结论。

## 5. 定义行与边界核验

```text
requirement_definition_rows_changed=0   （122 条，base=122 / worktree=122，逐字节 IDENTICAL）
acceptance_definition_rows_changed=0    （117 条，base=117 / worktree=117，逐字节 IDENTICAL）
design_definition_rows_changed=0        （60 条，base=60 / worktree=60，逐字节 IDENTICAL）
ui_definition_rows_changed=0            （49 条，base=49 / worktree=49，逐字节 IDENTICAL）
acceptance_not_run_count=117
requirements_acceptance_coverage=122/122
formal_acceptance_execution_status=NOT_RUN
```

- 定义行核验方法：以 `git show cf0817f23c77190275b7f58c755c4e2c4619adc9:<path>` 与工作区文件分别抽取 `^| CCFG-<前缀>-<数字> |` 起始的定义行，按编号逐条逐字节比较，四族结果均为 `IDENTICAL`、编号 `1..N` 连续，无新增、无删除、无改动（含第三轮 `CCFG-REQ-113~122`、`CCFG-AC-105~117`、`CCFG-DESIGN-054~060`、`CCFG-UI-043~049` 与更早的定向标注行）。
- `CCFG-AC-001~117` 共 **117** 条执行状态**全部** `NOT_RUN`（`grep` 计数 117/117；未出现被改写为 `PASS`/`FAIL` 的状态值）。
- `git diff --check`：无空白/冲突标记错误。
- `API.md`、`DATABASE.md`、`docs/features/README.md`、所有既有与历史报告、`docs/baseline/**` 六份项目级基线及两套模板三件套：**零变化**。
- 模板级全局状态保持不变：`page_migration_status=NOT_STARTED`、`page_migration_authorization_status=NOT_GRANTED`、`pilot_page_selection_status=NOT_DECIDED`；页面级授权**不新增、不扩大**。数据源管理参考页**未修改**。
- 后端代码、数据库对象、DDL、ZooKeeper / Kafka：**零访问、零写入**（`database_write_status=NOT_REQUESTED`、`zookeeper_write_status=NOT_REQUESTED`）。
- `.claude/settings.local.json`（任务开始前已修改）与 `docs/prompts/**`（未跟踪）：全程**未修改、未暂存、未提交**；本报告未写入 `docs/prompts/**`。

## 6. 未执行项与下一入口

未执行（且本任务不作出结论）：

- 正式验收执行（117 条全部 `NOT_RUN`）；正式验收不得由本任务改写为 `PASS`。
- 项目负责人真实页面目测与最终接受。
- 后端构建/后端测试（后端代码与接口不变，按验证矩阵 `NOT_APPLICABLE`）。
- 真实开发库数据下的视觉核对（本轮数据经接口桩注入，见 §4.4 限制）。

待确认/风险：`+N` 清单在 1440×900 下、清单较长且弹层位于视口顶部时的裁切问题（§4.4）。

下一入口：`CHATGPT_REMOTE_CLIENT_CONFIG_POPOVER_AND_DIALOG_VISUAL_IMPLEMENTATION_REVIEW`，由 ChatGPT 从远程 Git 对本实现提交做独立复审；**代码 Agent 不得自行批准实现、不得改写任何正式验收用例为 `PASS`、不得宣布用户目测或最终接受**。

---

```text
AGENT_TASK_RESULT_BEGIN
status=SUCCESS
task_code=CLIENT-CONFIG-POPOVER-AND-DIALOG-VISUAL-IMPLEMENTATION-001
branch=develop
base_commit_id=cf0817f23c77190275b7f58c755c4e2c4619adc9
result_commit_id=NOT_APPLICABLE
env_check_status=SUCCESS
backend_build_status=NOT_APPLICABLE
frontend_build_status=SUCCESS
database_write_status=NOT_REQUESTED
zookeeper_write_status=NOT_REQUESTED
push_status=NOT_APPLICABLE
changed_files=frontend/src/views/client-config/ClientConfigPage.vue,frontend/src/views/client-config/ClientConfigPage.spec.ts,docs/features/client-config/README.md,docs/features/client-config/REQUIREMENTS.md,docs/features/client-config/ACCEPTANCE.md,docs/features/client-config/DESIGN.md,docs/features/client-config/UI.md,docs/features/client-config/reports/CLIENT-CONFIG-POPOVER-AND-DIALOG-VISUAL-IMPLEMENTATION-001.md
error=
AGENT_TASK_RESULT_END
```
