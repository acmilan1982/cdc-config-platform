# 第七轮定向验收与负责人目测记录报告

- 任务编号：`CLIENT-CONFIG-ROUND7-TARGETED-ACCEPTANCE-AND-VISUAL-RECORD-001`
- 任务类型：**验收记录 + 定向只读验收判定类**（只处理 `CCFG-AC-010/155/156/157` 四条；**不是** 157 条整体收口，**不是**模板清理，**不是**数据源页改造）
- 分支：`develop`
- 起始提交（base）：`aa942dc1a4d82d85e6933e8b0977f8736f8c5196`
- 依据：`docs/prompts/client-config/CLIENT-CONFIG-ROUND7-TARGETED-ACCEPTANCE-AND-VISUAL-RECORD-001-Agent-Prompt.md`
- 现行下一入口：`CHATGPT_REMOTE_CLIENT_CONFIG_ROUND7_TARGETED_ACCEPTANCE_AND_VISUAL_RECORD_REVIEW`

---

## 1. 门禁与环境

```text
branch=develop
expected_base_commit=aa942dc1a4d82d85e6933e8b0977f8736f8c5196
actual_base_commit=aa942dc1a4d82d85e6933e8b0977f8736f8c5196
origin_develop=aa942dc1a4d82d85e6933e8b0977f8736f8c5196
remote_refs_heads_develop=aa942dc1a4d82d85e6933e8b0977f8736f8c5196
ahead_behind(origin/develop...HEAD)=0/0
definition_rows=REQ 154 / AC 157 / DESIGN 89 / UI 77
```

- 当前分支 `develop`；本地 `HEAD`、`origin/develop` 与远程 `refs/heads/develop` **三者一致**（`aa942dc`），ahead/behind `0/0`，无分叉。首轮 `git ls-remote` 出现一次 `Connection reset`（瞬时网络），重试即返回远程 `aa942dc`，**不代表**远程有差异。
- 任务开始前已存在的**无关**工作区内容**保持原样、未修改、未暂存、未提交**：` M .claude/settings.local.json`、未跟踪的 `docs/prompts/**` 与 `runtime-logs/**`。未执行 `git reset/clean/stash/rebase/checkout`。
- **服务与版本**：仓库已在运行的前端 Vite `0.0.0.0:5173`（PID `2943`）与后端 Spring Boot `0.0.0.0:8080`（PID `2885`，`java -jar backend/target/...-SNAPSHOT.jar`）。前端为**开发服务器**，按磁盘源码即时提供当前 `HEAD` 内容；`git status` 显示 `frontend/src` 无改动，故所提供页面即 `aa942dc` 源码。后端 `jar` 构建时间（`2026-09-22`）晚于后端源码最后提交（`2026-09-20`），与本轮无关。**未停止既有服务**，也未为本任务新增常驻服务进程（浏览器为一次性无头进程，运行结束即退出）。
- **零写边界**：所有页面导航前在网络层拦截，`/api/**` 的 `GET/HEAD/OPTIONS` 放行、`POST/PUT/PATCH/DELETE` 一律 `abort('blockedbyclient')` 并计数。探针 A~D 合计**非 GET 拦截计数 = 0**。未提交任何有效新增／编辑表单，未点击启停／删除最终确认，未创建夹具，未访问或写入数据库／ZooKeeper／Kafka，未运行全量单测／构建，未重启既有服务。
- 已按 `CLAUDE.md` §3 读取适用项目级基线与第七轮已批准条款，并复核既有可追溯证据（第七轮实现 `d93f838`、真实缩放核对 `aa942dc`、正式验收执行 R0~R5、只读补测 001/001-R1）。

## 2. 负责人目测记录的准确范围

- 记录来源：项目负责人于 **2026-09-29** 的两句反馈，原话为：
  1. 「我目测了，表格高度与“数据源管理”的表格高度一致」
  2. 「我人工测试过了，没有问题了。」
- **适用范围（严格限定）**：仅记为**第七轮实际页面目测与人工操作无问题的反馈**，落在项目负责人**本人实际观察范围**内的**主观确认**。
- **不适用于**：
  - **不**代表项目负责人对 **157 条验收**作出整体验收接受决定；
  - **不**替代任何单条 AC 的**前置、步骤与证据**；
  - **不**构成 `CCFG-AC-010/155/156/157` 中任一子步骤的取证；
  - `CCFG-AC-010` 的定义、前置、操作与预期**均不含**负责人目测项，故本次目测**不**作为其判定依据。

## 3. 四族编号与差异边界核验

| 族 | 现行最大值 | 计数 | 本轮是否改动定义行 |
|---|---|---|---|
| REQ | `CCFG-REQ-154` | 154 | 否 |
| AC | `CCFG-AC-157` | 157 | 否（仅更新 4 条**状态格**） |
| DESIGN | `CCFG-DESIGN-089` | 89 | 否 |
| UI | `CCFG-UI-077` | 77 | 否 |

- 四条文件定义编号范围连续、唯一、无跳号、无重号，与任务开工时点一致；除本任务有证据改判的 **4 个状态格**外，`ACCEPTANCE.md` §4 其余状态格**原样**。
- 验收四态相加 = 157（见 §6 前后统计）。

## 4. 逐 ID 判定矩阵

| 用例 | 改判前 | 改判后 | 判定 | 证据性质 | 关键缺口 / 说明 |
|---|---|---|---|---|---|
| `CCFG-AC-010` | `BLOCKED` | **`PASS`** | 全部现行有效前置/步骤/预期均有可追溯实测证据 | 既有证据复核 + **本轮只读补测** | 无（历史“约 58～64px”不构成理由） |
| `CCFG-AC-155` | `NOT_RUN` | **`BLOCKED`** | 对照组已覆盖；自适应观察组**缺“超长内容行”样本** | 既有证据复核 + **本轮只读补测** | `超长内容行` 样本及证据键 = `null` |
| `CCFG-AC-156` | `NOT_RUN` | **`BLOCKED`** | 只读步骤已覆盖；**写路径**回归项不可实测 | 既有证据复核 + **本轮只读补测** | `启用/停用`重选、写操作触发的列表重载竞态 |
| `CCFG-AC-157` | `NOT_RUN` | **`BLOCKED`** | ①②③⑤ 已覆盖；`disabled` 子项**不可观察** | 既有证据复核 + **本轮只读补测** | 三点触发器 `disabled` 无可构造场景（建议独立基线澄清） |

### 4.1 `CCFG-AC-010`（`CCFG-REQ-013`）

逐步骤核验（**现行有效**口径；原文“约 58～64px”为已被 `CCFG-REQ-106`／`CCFG-DESIGN-049` 取代的历史绝对像素口径，**不**作为 `PASS`/`BLOCKED` 理由）：

| 子项 | 现行有效要求 | 证据位置 / 键 | 结果 |
|---|---|---|---|
| 前置 | 库内存在含 **6～7** 个数据源的探针 | 本轮探针 B `byWidth.*` 第 13 行 `tagTotal=7`；既有 `accG#098` `total=7/direct=1/plus=+6` | COVERED |
| 步骤 | 调整浏览器宽度并观察“采集数据源”列 | 本轮探针 B：同一样本 `1920→5/+2`、`1440→1/+6`、`900→1/+6`；既有只读补测 `probeA` 五宽度（`1920/1440/1280/1100/900`） | COVERED |
| 预期 | 单行机构名称标签展示 | 本轮探针 A `heightHistogram={48:15,52:1}`（常规行恒单行）；既有 `accG#010` `singleLine` | COVERED |
| 预期 | 按可用宽度自适应决定直接展示数量 | 本轮探针 B 同一样本跨宽度直接展示数 `5→1→1` 变化 | COVERED |
| 预期 | 6～7 源时单行**最多直接展示 6**、其余以**准确 `+N`** 表示 | 本轮探针 B `tagVisible ≤ 6` 且 `plusMatchesHidden=true`（`+N` = 未展示数）；既有 `accG#010` `max6Rule/plusAccurate` | COVERED |
| 预期 | 不撑高整行、不裁切、无第二行/滚动条/越界 | 常规行恒 `48px`、无换行；既有 `accG#010` `noOverflow/overflowProp=hidden`；只读补测 `containerOverflowX_all=false`、`fitsInside_all=true` | COVERED |

- 说明：`CCFG-AC-098` 的「**恰好 6 源**」样本要求属 **`CCFG-AC-098` 独有**，**不**移植到本条；`CCFG-AC-155` 的 `NOT_RUN` **不**作为本条缺口。
- 结论：本条**现行有效**前置、步骤与预期**全部**有可追溯实测证据且达预期，`BLOCKED`→`PASS`。

### 4.2 `CCFG-AC-155`（`CCFG-REQ-153`）

| 子项 | 定义要求 | 证据位置 / 键 | 结果 |
|---|---|---|---|
| 前置 | 两页正常加载；存在常规单行记录 | 本轮探针 A/B：`/config/client` 16 行；参考页 `/config/data-source` 36 行 | COVERED |
| 前置 | ≥1 条**含红/绿标签**的普通单行 | 本轮探针 B：红/绿标签常规行均 `48px`；既有实现证据 `tagTone=ok/bad` | COVERED |
| 前置 | ≥1 条**异常/歧义提示行** | 本轮探针 B 第 15 行 `ambiguousMarker=true`（`52px`） | COVERED |
| 前置 | ≥1 条**超长内容行**（供自适应观察组） | — | **未覆盖（无样本）** |
| 步骤①（对照组） | 同一浏览器/100% 缩放/≥1440×900 与 1920×1080 各 ≥3 条可比常规行、`getBoundingClientRect().height` 原始值 | 本轮探针 A/B（`1440×900`、`1920×1080`，15 条常规行 `48px`）；既有实现证据 `diffSummary` 逐条差值 `0` CSS px | COVERED |
| 步骤②（自适应组） | 另测异常/歧义提示行**与超长内容行** | 歧义行 `52px` 已测；**超长内容行未测** | **PARTIAL** |
| 预期①（对照组） | 逐条差值绝对值 ≤1 CSS px（预置、逐条、不取平均）；无固定行高；未牺牲 ID 三态/标签/歧义提示/`+N`/固定操作列/焦点可见性 | 既有实现证据 `maxAbsDiff=0`；`frontend/src/styles/list-table/list-table-visual.css` 无固定 `tr` 高度、无 `!important`；本轮探针 A：ID/标签/`+N`/固定操作列/焦点均在 | COVERED |
| 预期②（自适应组） | 仅判无裁切/无重叠/无意外换行、内容完整 | 仅歧义行可判（`52px`、无裁切）；超长内容行**无从判** | **PARTIAL** |

- 残余缺口：**“超长内容行”样本缺失**（`/config/client` 全部 16 行在 `1920×1080`/`1440×900`/`900×800` 均为单行且常规行恒 `48px`，无换行、无额外撑高；数据库无该类样本，且本任务**不构造数据**）。该组**不得**以推断或负责人笼统目测判 `PASS`。
- 结论：有已执行部分但关键前置/步骤缺口 → **`BLOCKED`**。

### 4.3 `CCFG-AC-156`（`CCFG-REQ-153`）

| 子项 | 定义要求 | 证据位置 / 键 | 结果 |
|---|---|---|---|
| 前置 | 已进入 `/config/client`，列表已加载并渲染三点入口 | 本轮探针 A：`rootClassList` 含 `lt-main-table`，16 行均含 `.lt-row-action__ellipsis` | COVERED |
| 步骤① | 入口所在单元格盒模型与行高，确认**不再**撑高常规行 | 本轮探针 A：操作单元格 `lt-row-action__cell`，常规行 `48px`；既有实现证据 `53→48`、`maxAbsDiff=0` | COVERED |
| 步骤② | 量取命中区尺寸与行内垂直居中 | 本轮探针 A：`entryW=entryH=28`、`boxInsideCell=true`、`boxInsideRow=true`、`vCentered=true`；既有真实缩放证据 `28×28` CSS | COVERED |
| 步骤③ | 键盘 Tab 聚焦并核对焦点描边可见性、是否被 `overflow` 裁切 | 本轮探针 A：`tabReached=true`（第 `7` 步）、`outline: solid 2px rgb(64,158,255)` + `offset:-2px`；既有真实缩放物理像素探针：四边完整可见、未被 `.cell{overflow:hidden}` 裁切 | COVERED |
| 步骤④ | 窄视口与缩放（如 125%）下可见/可点击/无遮挡/无跨行误触 | 既有真实缩放证据（`aa942dc`）：`125%` 命中区 `28×28` CSS=`35×35` 物理、固定列滚动后仍可见、命中盒下方 2 CSS px 点击不打开菜单（`noMisTriggerBelowHitBox=true`）、第 2 行菜单与本行不同（`row1AndRow2MenusDiffer=true`）；既有实现证据窄视口 `1024×900` | COVERED |
| 预期 | `28×28px` 命中区、垂直居中；不额外撑高；不缩到 `23px`；不用固定行高掩盖；不跨行误触/不裁切/不遮挡；焦点描边可见（内缩须说明） | 见上；命中区 `28×28`（非 `23`）；`list-table-visual.css` 无固定 `tr` 高度；内嵌（`outline-offset:-2px`）焦点环已说明且物理像素四边完整 | COVERED |
| 回归 | 单击固定选中 / 再次点击取消 / 双击编辑 / 键盘编辑 / 更多菜单事件隔离 / 第六轮悬停与固定配色 | 本轮探针 D：单击固定（`rgb(225,228,232)`）→ 再点取消 → 再点固定 → 点他行转移、悬停不改变固定、悬停 `rgb(244,244,245)`；探针 C：三点入口点击打开菜单 `["停用","删除"]` 且**未**开编辑弹窗/未切换选中，双击行内容进入编辑弹窗（**未**提交）；既有 `AC-100`/`AC-143` 证据（可访问名称、菜单三态、ID `Enter`/`Space` 开编辑） | COVERED（只读部分） |
| 回归 | **`启用/停用`重选**、**列表重载竞态** | — | **未覆盖（写路径）** |

- 残余缺口：`启用/停用`成功后按稳定 ID 重选、以及由写操作触发的列表重载竞态，均需真实写操作，**只读边界内不可实测**；本轮**不**以静态断言替代、**不**下结论。
- 说明：探针 C 的“按 `Esc` 关闭编辑弹窗”在 headless 下未见稳定关闭，属自动化交互边界，**不**据此判定产品缺陷；双击编辑打开本身已确证。
- 结论：有已执行部分但关键（写路径）步骤缺口 → **`BLOCKED`**。

### 4.4 `CCFG-AC-157`（`CCFG-REQ-154`）

| 子项 | 定义要求 | 证据位置 / 键 | 结果 |
|---|---|---|---|
| 前置 | 可访问 `/config/client` 与至少一个**未启用**该能力的其他主列表页 | 本轮探针 A：`/config/client` 与 `/config/data-source` 均正常加载 | COVERED |
| ① 外观 | 命中区域、对齐、圆角、文字/图标色、hover、focus-visible、光标 | 本轮探针 A/B：`28×28`、`6px`、`rgb(64,158,255)`、hover `rgb(236,245,255)`、`pointer`、focus-visible 内嵌环 | COVERED |
| ① disabled 状态 | 核对 `disabled` 状态 | — | **不适用/不可观察** |
| ① 可访问性 | 可访问名称、键盘可达 | 本轮探针 A：`aria-label=更多操作：<ID>`、`role=button`、`tabindex=0`、`tabReached=true`；既有 `AC-100` | COVERED |
| ② 未启用页计算样式 | 与启用前**逐项一致** | 本轮探针 A：`/config/data-source` 36 行恒 `48px`、opt-in 计数 `0`、`更多`文字、末列内边距 `12px/12px`、单元高 `23`、`overflow:hidden`；既有实现证据 `refPagesUnchanged` | COVERED |
| ③ opt-in / 无全局覆盖 / 无硬编码 / 无 `!important` | 显式 opt-in，限定作用域 | 本轮探针 B `scopedStyleCheck`：opt-in 规则**恰 4 条**、`allScopedToMainTable=true`、`anyImportant=false`；`frontend/src/styles/list-table/list-table-visual.css` `!important` 计数 `0`；无页面名硬编码 | COVERED |
| ④ 未启用页 Feature 边界 | 菜单项/权限/删除启停语义/请求时序/行点击选中/Popover 定位/异常数据语义仍属 Feature | 本轮探针 A 对照页零变化；`/config/client` 三点入口仍保留 `cc-more-link` 业务钩子、菜单与事件隔离（探针 C）；**写路径相关语义**（请求时序、删除/启停最终语义）只读**不可全测** | COVERED（只读）/ 写路径部分未覆盖 |
| ⑤ 28px 非强制最小行高 | 未启用页常规行高不受影响 | 本轮探针 A：对照页常规行 `48px`（与启用前一致） | COVERED |

- 残余缺口：定义步骤①含 `disabled` 状态，但**当前三点触发器本身无可观察禁用场景**（提交处理中禁用的是**菜单条目**）。本任务**未**人为制造禁用态并写成验收（违反则属伪造证据）。该子项记为**“不适用且无定义可构造场景”**。
- **独立基线澄清建议**（不擅改本条定义）：建议后续独立基线任务明确 `CCFG-AC-157` 步骤①`disabled` 子项的适用范围——或限定为「当且仅当触发器存在可观察禁用场景时才核对」，或改述为「入口外观族中的禁用样式为**可选**能力、当前探针页不适用」。
- 结论：①②③⑤ 已覆盖、④只读部分已覆盖但含写路径未覆盖项、①`disabled` 不可观察 → **`BLOCKED`**。

## 5. 证据键索引

| 用例 | 复用既有证据（文件 / 键） | 本轮只读补测（文件 / 键） |
|---|---|---|
| `CCFG-AC-010` | `reports/evidence/CLIENT-CONFIG-FORMAL-ACCEPTANCE-EXECUTION-001-R5/coverage-matrix.json` → `items[CCFG-AC-010]`；`reports/evidence/CLIENT-CONFIG-FORMAL-ACCEPTANCE-READONLY-SUPPLEMENT-001/per-id-results.json` → `per_id[CCFG-AC-010].observed.widthLegs` | `.../CLIENT-CONFIG-ROUND7-TARGETED-ACCEPTANCE-AND-VISUAL-RECORD-001/round7-targeted-readonly-results.json` → `AC010_client_adaptive_by_width` |
| `CCFG-AC-155` | `reports/evidence/CLIENT-CONFIG-ROW-HEIGHT-AND-OPTIONAL-ELLIPSIS-IMPLEMENTATION-001/row-height-results.json` → `after.client_1440x900.rows`、`diffSummary`、`after.datasource` | 同上 → `AC155_156_client_1440x900`、`AC010_client_adaptive_by_width` |
| `CCFG-AC-156` | 同上实现证据 → `after.client_1440x900.rows[*]`（`linkW/linkH/linkRadius/linkColor/linkCursor/linkBoxInsideRow`）；`...IMPLEMENTATION-001-R1/`（真实 100%/125% 缩放、`focus-ring-pixels.json`、`real-zoom-summary.json`）；只读补测 `-R1/per-id-results.json` → `per_id[CCFG-AC-100]`/`[CCFG-AC-143]` | 同上 → `AC156_focus`、`AC156_regressions_readonly`、`AC156_menu_isolation`、`AC156_dblclick_edit`、`AC156_tab_reaches_ellipsis` |
| `CCFG-AC-157` | 实现证据 → `after.datasource`、`diffSummary.refPagesUnchanged`；`reports/evidence/CLIENT-CONFIG-ROW-HEIGHT-AND-OPTIONAL-ELLIPSIS-IMPLEMENTATION-001-R1/` 只读对照页结论 | 同上 → `AC157_optin_style_check`、`AC157_entry_hover`、`AC157_not_enabled_page_datasource` |

- 本轮只读补测脚本：`reports/evidence/CLIENT-CONFIG-ROUND7-TARGETED-ACCEPTANCE-AND-VISUAL-RECORD-001/probe-round7-targeted{,-b,-c,-d}.mjs`（脱敏索引见同目录 `README.md`）。
- **无**仓库外原始包（本轮未产生截图或含业务数据的大体积产物，全部证据已脱敏入仓）。

## 6. 写拦截计数与前/后统计

- 写拦截计数（本轮只读浏览器会话）：**非 GET `/api/**` 拦截 = 0**（四次探针合计）。
- 未提交有效新增／编辑表单；未点击启停／删除最终确认；未创建夹具；未访问或写入数据库／ZooKeeper／Kafka。

| 四态 | 改判前 | 改判后 | 变化 |
|---|---|---|---|
| `PASS` | 69 | **70** | `CCFG-AC-010` `BLOCKED`→`PASS` |
| `FAIL` | 0 | **0** | 无（本轮未发现经核实的产品反例） |
| `BLOCKED` | 70 | **72** | `CCFG-AC-155/156/157` `NOT_RUN`→`BLOCKED`（+3）、`CCFG-AC-010` 转出（-1） |
| `NOT_RUN` | 18 | **15** | `CCFG-AC-155/156/157` 转出（-3） |
| **合计** | **157** | **157** | 一致 |

## 7. 残余缺口与分层状态

### 7.1 残余缺口

| 用例 | 缺口 | 可否在只读边界内补齐 |
|---|---|---|
| `CCFG-AC-155` | 自适应观察组缺「超长内容行」真实样本 | 否（需构造数据，本任务不构造） |
| `CCFG-AC-156` | `启用/停用`重选与写操作触发的列表重载竞态 | 否（需写授权） |
| `CCFG-AC-157` | 步骤① `disabled` 子项无可观察场景；④ 含写路径语义 | 否（需构造或写授权）；建议独立基线澄清 |

### 7.2 分层状态（本轮结束时点）

```text
adjustment7_baseline_status=APPROVED
adjustment7_approval_status=APPROVED_BY_PROJECT_OWNER
adjustment7_approved_reviewed_commit=59617b4cee03fe1642417cb85005b339ab0015ab
adjustment7_implementation_status=IMPLEMENTED_PENDING_CHATGPT_REVIEW
adjustment7_formal_acceptance_execution_status=NOT_RUN
formal_acceptance_execution_status=NOT_RUN
```

- 本轮**不**宣布 157 条正式验收整体通过；`FAIL` 为 0 与任何单条上调**均不等于**整体验收接受。项目负责人**尚未**作整体验收接受决定。
- 项目负责人目测记录仅覆盖其**实际观察范围**（`§2`）；模板级 `/config/data-source` 未被迁移，其迁移仍属**另一会话、另一独立任务**。

## 8. 变更文件

- 新建 `docs/features/client-config/reports/CLIENT-CONFIG-ROUND7-TARGETED-ACCEPTANCE-AND-VISUAL-RECORD-001.md`（本报告）。
- 新建 `docs/features/client-config/reports/evidence/CLIENT-CONFIG-ROUND7-TARGETED-ACCEPTANCE-AND-VISUAL-RECORD-001/{README.md,probe-round7-targeted.mjs,probe-round7-targeted-b.mjs,probe-round7-targeted-c.mjs,probe-round7-targeted-d.mjs,round7-targeted-readonly-results.json}`。
- 修改 `docs/features/client-config/ACCEPTANCE.md`（新增 §1.24 状态块、§4 四条状态格、§6 变更记录行）。
- 修改 `docs/features/client-config/README.md`（§1.13 追加本轮事实、§4 现行执行状态、§5 下一入口）。
- **未修改**：任何业务代码、测试、共享 CSS、模板基线、`/config/data-source`、历史报告与历史证据、`docs/baseline/` 六份项目级基线、`API.md`/`DATABASE.md`、`docs/features/README.md`、`docs/prompts/**`、`runtime-logs/**`、`.claude/**`。
