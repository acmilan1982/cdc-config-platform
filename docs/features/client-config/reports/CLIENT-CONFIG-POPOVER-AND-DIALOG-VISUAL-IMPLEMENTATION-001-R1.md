# 探针端管理 `+N` 弹层视口裁切定向修复 · R1 执行报告

> 任务代码：`CLIENT-CONFIG-POPOVER-AND-DIALOG-VISUAL-IMPLEMENTATION-001-R1`
> 任务类型：前端定向修复（`/config/client` 单页 `+N` 弹层视口裁切）
> 分支：`develop`
> 起始提交：`cf0817f23c77190275b7f58c755c4e2c4619adc9`
> 上游门禁：ChatGPT 远程 R1 复审结论为“初次浏览器报告承认裁切，不满足 `CCFG-REQ-115`/`CCFG-DESIGN-055`/`CCFG-AC-110` 的完整可读要求”，据此下达本 R1 任务
> 上一份报告（**原样保留、不回写**）：`docs/features/client-config/reports/CLIENT-CONFIG-POPOVER-AND-DIALOG-VISUAL-IMPLEMENTATION-001.md`
> 下一入口：`WORKTREE_DIFF_REVIEW_CLIENT_CONFIG_POPOVER_AND_DIALOG_VISUAL_IMPLEMENTATION_R1`（工作区差异审阅入口；未经单独授权不得 Commit／Push）
> 本任务不执行正式验收，不作出项目负责人目测通过或最终接受结论。

---

## 1. 门禁与基线

```text
branch=develop
expected_base_commit=cf0817f23c77190275b7f58c755c4e2c4619adc9
actual_base_commit=cf0817f23c77190275b7f58c755c4e2c4619adc9
baseline_approval_status=APPROVED
adjustment3_approved_reviewed_commit=1df0ef7b4e3717d9b980e9aa9cc1f8e4f036f244
adjustment3_implementation_status=IMPLEMENTED_PENDING_CHATGPT_REVIEW（保持不变；本 R1 仅修复裁切，未变更批准状态）
page_level_authorization_status=GRANTED_FOR_CONFIG_CLIENT_ONLY
git_add_authorized=false
git_commit_authorized=false
git_push_authorized=false
```

- 本地 `HEAD` 与任务预期起始提交一致。工作区除本任务目标文件外，另有**任务开始前即存在**的 `.claude/settings.local.json` 修改与未跟踪的 `docs/prompts/**`（二者全程未修改、未暂存、未提交）。
- 本次用户**未**授权 `git add` / `git commit` / `git push`；全部改动停留在工作区，**未暂存、未提交、未推送**。
- 未执行 `git pull` / `fetch` / `merge` / `rebase` / `reset` / `clean` / `stash` / `checkout --`，未改写历史，未强推。

## 2. 初次报告承认的裁切（证据保留，不回写）

初次实现任务 `CLIENT-CONFIG-POPOVER-AND-DIALOG-VISUAL-IMPLEMENTATION-001` 的浏览器只读核对在“残留风险”一节如实记录：

```text
fixture=9 条数据源，锚定首行，视口 1440x900
  → 弹层 placement=top（未翻转），popper top=-147 ~ -192，底部=358
  → 9 项中 6 项完全可见；第 0~2 项被视口上边界裁切
fixture=9 条，锚定首行，视口 1920x1080
  → placement 翻转为 bottom，9 项全部完整可见
```

R1 以独立浏览器几何脚本在同一桩数据下**复现并量化**了该裁切（见 §4 的“修复前”列）。**初次报告原样保留，不改写为“从未裁切”。** 该裁切违反 `CCFG-REQ-115`（弹层在普通视口内内容必须完整可读、靠近视口边缘不得被无意裁切）、`CCFG-DESIGN-055`（普通视口内容完整可读）与 `CCFG-AC-110`（完整可读），不能判为通过或无阻塞风险。

## 3. 根因定位（真实浏览器实测，非推测）

在**真实无头 Chrome**中，以同一桩数据复现 1440×900 首行 9 项场景，读取弹层与参照元素的实际几何后定位根因如下。

### 3.1 实测几何（修复前）

```text
viewport=1440x900  placement(top)  上述首选方向
+ N 触发器(pill)  rect.top = 370.5   →  锚点上方可用空间 spaceAbove = 370.5px
                                     →  锚点下方可用空间 spaceBelow = 509.5px
弹层(popper) 物理高度 h = 524.2px；含 Popper 默认 12px offset 后需 536.2px
→ 上、下两个方向都放不下完整清单
→ Popper 的 flip 找不到可用候选，**保持** placement=top
→ 实测 popper.getBoundingClientRect().top = -166.2（视口上缘溢出 166.2px），9 项中仅 6 项完整可见
```

- 弹层**自身物理高度**（524.2px）小于视口高度（900px），即该场景不是“弹层比视口还高”的极端情形；矛盾在于锚点上方只有 370.5px、下方的 509.5px 也放不下 536.2px。
- 同时确认**不是页面 CSS 造成**：`.cc-full-list` computed `max-height: none`、`overflow-y: visible`、`scrollHeight == clientHeight`（无内部滚动），条目也**未被**隐藏（9 项全部渲染）。

### 3.2 机制根因

- Element Plus `2.14.2`（依赖 `@popperjs/core 2.11.8`）在 `popper/src/composables/use-content.mjs` 用 `buildPopperOptions(props, [arrowModifier, eventListenerModifier])` 组装修饰符；其 `popper/src/utils.mjs` 的 `genModifiers` 对 `preventOverflow` **只传 `padding`**，`altAxis` 留在 Popper 默认值 `false`。
- Popper v2 的 `preventOverflow` 中轴映射为 `Le(e) { return ['top','bottom'].indexOf(e) >= 0 ? 'x' : 'y' }`：对 `top`/`bottom` 定位，`mainAxis` 管的是**水平**轴，竖直方向的实际贴边避让由 `altAxis` 控制。EP 未开 `altAxis`，因此**竖直方向从不做贴边避让**。
- 结果：首选 `top` 放不下 → `flip` 的候选 `bottom` 也放不下 → Popper 回落保持 `top` 且不在竖直方向避让 → 内容被视口上缘裁切。这正是初次报告记录的现象。
- 佐证：以构建产物为对象的变体对照（仅替换 `popper-options` 绑定值，逐一实测）显示，唯一能消除该裁切的是**开启 `altAxis`**；仅加 `flip`、仅设 `boundary: 'viewport'`、`padding: 300`、`tether: true` 等均无改善。1920×1080 下方可用 689.5px，`flip` 足以翻转到 `bottom`，故该视口在修复前即 9/9 可见。

## 4. 修复内容与采用的定位参数

在 `/config/client` 页内做**最小修复**，只调整 `+N` 弹层的 Popper 碰撞处理，**保留 `placement="top"` 作为首选方向**，不触碰点击语义、数据顺序、两行内容、异常/歧义文案、标签与主表行高，也**未**给 `.cc-full-list` 或其父层加入固定最大高度、内部滚动、overflow 裁切或隐藏条目。

`frontend/src/views/client-config/ClientConfigPage.vue`：

```html
<el-popover
  v-if="hiddenCount(row) > 0"
  placement="top"
  :width="380"
  trigger="click"
  :popper-options="FULL_LIST_POPPER_OPTIONS"
  @show="clearTip"
>
```

```ts
type FullListPopperModifier = { name: string; options?: Record<string, unknown> }

const FULL_LIST_POPPER_OPTIONS: { modifiers: FullListPopperModifier[] } = {
  modifiers: [
    {
      name: 'preventOverflow',
      options: {
        boundary: 'viewport',
        rootBoundary: 'viewport',
        mainAxis: true,
        altAxis: true,
        tether: false,
        padding: 8,
      },
    },
  ],
}
```

**实际采用的定位参数**

| 参数 | 值 | 说明 |
|---|---|---|
| `placement` | `top` | 首选方向**不变** |
| `preventOverflow.boundary` | `viewport` | 碰撞边界显式定为视口 |
| `preventOverflow.rootBoundary` | `viewport` | 根边界为视口 |
| `preventOverflow.mainAxis` | `true` | `top`/`bottom` 下为**水平**轴贴边（默认即 true） |
| `preventOverflow.altAxis` | `true` | **关键**：`top`/`bottom` 下为**竖直**轴贴边避让，EP 默认 `false`（根因） |
| `preventOverflow.tether` | `false` | 避让时不拉伸参照元素（此处无副作用，仅明确不启用 tether） |
| `preventOverflow.padding` | `8` | 与视口边缘保留 8px 安全间距 |
| 其余 | 未改动 | 未新增 `flip` 修饰符（实测冗余，故移除）；未改 EP 其它默认修饰符 |

行为结果：`placement="top"` 仍为首选方向；顶部放不下由既有 `flip` 翻转到 `bottom`；两个方向都放不下时由 `preventOverflow`（`altAxis: true`）沿竖直方向贴边避让，把整份清单收进视口内可读。

## 5. 复验证据（真实无头 Chrome 几何断言）

### 5.1 断言脚本与运行方式

脚本为 R1 临时交付物，位于 `/tmp/ccvis/r1-popover.mjs`（**仓库外**，未写入仓库、未提交）。它启动一个只读静态服务（服务 `frontend/dist`）并以桩数据替换 `/api/**`，随后用系统 Google Chrome 无头模式经 CDP 驱动，逐场景点击 `+N` 并读取真实几何。

```bash
# 前置：已构建 dist（npm run build）
cd /tmp/ccvis && node r1-popover.mjs
# 结果 JSON： /tmp/ccvis/r1/r1-report.json
# 截图：     /tmp/ccvis/r1/r1-<scenario>-<WxH>.png
```

核心断言表达式（节选自脚本 `MEASURE`）：

```js
const r = el.getBoundingClientRect()                       // 每个条目
fullyVisible: r.top >= 0 && r.bottom <= window.innerHeight // 条目是否完整可见
popper.getBoundingClientRect()                             // 弹层 top/bottom/height
popper.getAttribute('data-popper-placement')               // 实测 placement
getComputedStyle(list).maxHeight / overflowY               // 清单是否仍无内部滚动
list.scrollHeight / list.clientHeight                      // 是否有内部滚动
popperOverflowTop  = Math.min(0, popperRect.top)
popperOverflowBottom = Math.max(0, popperRect.bottom - innerHeight)
```

脚本对每个场景断言“9/9（或 5/5、6/6）条目完整可见、popper 上下溢出均为 0、清单 `max-height:none`/`overflow-y:visible`/无内部滚动”。

### 5.2 复验结果

| 场景（桩数据） | 视口 | 修复前 placement / 完整可见 / 上溢 | 修复后 placement | popper top→bottom | 完整可见 | 上溢/下溢 | 清单 max-height / overflow-y / 内部滚动 |
|---|---|---|---|---|---|---|---|
| 首行 9 项（普通） | 1440×900 | `top` / 6/9 / 166.2px | **`top`** | 7.8 → 532 | **9/9** | 0 / 0 | none / visible / 否 |
| 首行 9 项（普通） | 1920×1080 | `bottom` / 9/9 / 0 | `bottom` | 403 → 927.2 | 9/9 | 0 / 0 | none / visible / 否 |
| 首行 9 项（长 ID + 无机构名 + 异常/冲突文案） | 1440×900 | `top` / 5/9 / 239.78px | **`top`** | 8.22 → 606 | **9/9** | 0 / 0 | none / visible / 否 |
| 底边 9 项 | 1440×900 | `top` / 9/9 / 0 | `top` | 49.8 → 574 | 9/9 | 0 / 0 | none / visible / 否 |
| 底边 9 项 | 1920×1080 | `top` / 9/9 / 0 | `top` | 229.8 → 754 | 9/9 | 0 / 0 | none / visible / 否 |
| 常见 5 项 | 1440×900 | `top` / 5/5 / 0 | `top` | 52.11 → 358 | 5/5 | 0 / 0 | none / visible / 否 |
| 常见 6 项 | 1440×900 | `bottom` / 6/6 / 0 | `bottom` | 403 → 763.47 | 6/6 | 0 / 0 | none / visible / 否 |
| 贴近视口底边 9 项（pill y=847.5，下方仅 32.5px） | 1440×900 | — | **`top`** | 310.8 → 835 | **9/9** | 0 / 0 | none / visible / 否 |
| 贴近视口底边 9 项 | 1920×1080 | — | `top` | 310.8 → 835 | 9/9 | 0 / 0 | none / visible / 否 |

各场景实测 `window.innerHeight`：1440×900 → 900；1920×1080 → 1080。弹层物理高度：普通 9 项 524.2px、长 ID/异常 9 项 597.78px、5 项 305.89px、6 项 360.47px。

**结论：1440×900 首行 9 项裁切已消除**（`placement=top`，popper top=7.8，9/9 完整可见，上溢 0）；长 ID/异常文案场景同样由 5/9 提升到 9/9；底边、常见 5～6 项与贴近底边场景保持全部完整可见。所有场景 `.cc-full-list` 仍为 `max-height: none`、`overflow-y: visible`、无内部滚动，**未**引入固定最大高度、内部滚动、overflow 裁切或隐藏条目。

### 5.3 截图（临时位置，非验收）

```text
/tmp/ccvis/r1/r1-nineFirstPlain-1440x900.png
/tmp/ccvis/r1/r1-nineFirstPlain-1920x1080.png
/tmp/ccvis/r1/r1-nineFirstStress-1440x900.png
/tmp/ccvis/r1/r1-nineBottomPlain-1440x900.png
/tmp/ccvis/r1/r1-nineBottomPlain-1920x1080.png
/tmp/ccvis/r1/r1-fiveFirst-1440x900.png
/tmp/ccvis/r1/r1-sixFirst-1440x900.png
/tmp/ccvis/r1/r1-nineNearBottom-1440x900.png
/tmp/ccvis/r1/r1-nineNearBottom-1920x1080.png
```

**证据边界**：以上为**浏览器桩数据**下的几何证据，**只**证明本次模拟场景；数据来自接口桩而非真实开发库，本任务未查询数据库。**不构成项目负责人目测，不构成正式验收**。截图为临时位置，不作为正式验收物。

## 6. 自动化验证与构建

### 6.1 回归护栏（新增）

`frontend/src/views/client-config/ClientConfigPage.spec.ts` 新增两条用例（**jsdom 无法计算 Popper 实际定位**，故为**配置/绑定层面**的护栏，不冒充真实翻转；真实定位行为由 §5 浏览器几何断言作为可执行证据）：

- 组件用例：`ElPopover` 的 `placement` 仍为 `top`，且 `popperOptions.modifiers` 中的 `preventOverflow` 显式声明 `altAxis: true`、`boundary: 'viewport'`、`rootBoundary: 'viewport'`、`tether: false`；
- 静态用例：SFC 绑定 `:popper-options="FULL_LIST_POPPER_OPTIONS"`、常量含 `altAxis: true` 与 `boundary: 'viewport'`，且 `.cc-full-list` 仍无专属规则块（不借固定最大高度/内部滚动“解决”高度）。

### 6.2 定向测试（Vitest）

```text
命令：npx vitest run src/views/client-config/ClientConfigPage.spec.ts
结果：Test Files 1 passed (1)；Tests 124 passed (124)；Duration 29.24s
（原 122 例 + 本轮新增 2 例）
```

### 6.3 全量前端测试

```text
命令：npm test
结果：Test Files 57 passed (57)；Tests 1104 passed (1104)；Duration 96.39s
（原 1102 例 + 本轮新增 2 例）
```

### 6.4 前端构建

```text
命令：npm run build（= vue-tsc --noEmit && vite build）
结果：成功（vue-tsc 无错误、vite 构建通过），built in 16.67s
产物：dist/assets/ClientConfigPage-BFRqXEjt.js 22.66 kB (gzip 9.25 kB)
      dist/assets/ClientConfigPage-BUuBaQE7.css 9.82 kB (gzip 2.17 kB)
既有告警：仅 index-*.js(1,047.59 kB) / LargeScreenPage-*.js(1,141.31 kB) 超过 500 kB 的既有分包告警，属任务开始前已存在的现象
```

## 7. 定义行与边界核验

```text
requirement_definition_rows_changed=0   （122 条，base=122 / worktree=122，逐字节 IDENTICAL）
acceptance_definition_rows_changed=0    （117 条，base=117 / worktree=117，逐字节 IDENTICAL）
design_definition_rows_changed=0        （60 条，base=60 / worktree=60，逐字节 IDENTICAL）
ui_definition_rows_changed=0            （49 条，base=49 / worktree=49，逐字节 IDENTICAL）
acceptance_not_run_count=117
requirements_acceptance_coverage=122/122
formal_acceptance_execution_status=NOT_RUN
```

- 定义行核验方法：以 `git show cf0817f23c77190275b7f58c755c4e2c4619adc9:<path>` 与工作区文件分别抽取定义行，按编号逐条逐字节比较，四族均为 `IDENTICAL`、编号连续、无新增/删除/改动。
- `CCFG-AC-001~117` 共 **117** 条执行状态**全部** `NOT_RUN`（未出现被改写为 `PASS`/`FAIL`）。
- `git diff --check`：无空白/冲突标记错误。
- 五份 Feature 文档仅追加**最少的时序说明**（§8），已批准基线与定义行**逐字节不变**。
- `API.md`、`DATABASE.md`、`docs/features/README.md`、所有既有/历史报告、`docs/baseline/**` 六份项目级基线与两套模板三件套：**零变化**。
- 模板级全局状态不变：`page_migration_status=NOT_STARTED`、`page_migration_authorization_status=NOT_GRANTED`、`pilot_page_selection_status=NOT_DECIDED`；数据源管理参考页未修改。
- 后端代码、数据库对象、DDL、ZooKeeper / Kafka：**零访问、零写入**。
- `.claude/settings.local.json`（任务开始前已修改）与 `docs/prompts/**`（未跟踪）：全程**未修改、未暂存、未提交**。

## 8. 文档同步（最小时序说明）

在五份 Feature 文档的第三轮章节按既有约定追加**时序说明**，仅记录 R1 修复事实与现行入口，**不改写**任何已批准基线或历史表述，**不**改变 122/117/60/49 定义行：

| 文件 | 追加位置 |
|---|---|
| `README.md` | §1.8 实现记录追加 R1 修复条与现行入口 |
| `REQUIREMENTS.md` | §7.12 时序说明追加 R1 |
| `ACCEPTANCE.md` | §1.7 时序说明追加 R1 |
| `DESIGN.md` | §15 时序说明追加 R1 |
| `UI.md` | §17 时序说明追加 R1 |

## 9. 未执行项、残留限制与下一入口

未执行（且本任务不作出结论）：

- 正式验收执行（117 条全部 `NOT_RUN`）。
- 项目负责人真实页面目测与最终接受。
- 后端构建/测试（后端与接口不变，按验证矩阵 `NOT_APPLICABLE`）。
- 真实开发库数据下的视觉核对（数据经接口桩注入）。

残留限制（如实记录）：

- 若某条探针的数据源数量极大，使弹层**自身物理高度超过整个视口**，则任何定位修饰符都无法让整份清单在视口内完整显示；本场景实测未出现（最长 9 项 597.78px < 900px）。此属数据与几何的物理上限，本任务**未**通过引入内部滚动或固定最大高度规避，也**未**修改产品规则。
- 桩数据场景仅覆盖本脚本列出的组合，不代表真实数据全部分布。

下一入口：`WORKTREE_DIFF_REVIEW_CLIENT_CONFIG_POPOVER_AND_DIALOG_VISUAL_IMPLEMENTATION_R1`。当前实现**尚未提交、尚未推送**；需先完成工作区差异审阅，再另行取得独立 Commit/Push 授权后安排 ChatGPT 远程 Git 代码复审。**代码 Agent 不得自行批准实现、不得改写任何正式验收用例为 `PASS`、不得宣布用户目测或最终接受。**

---

```text
AGENT_TASK_RESULT_BEGIN
status=SUCCESS
task_code=CLIENT-CONFIG-POPOVER-AND-DIALOG-VISUAL-IMPLEMENTATION-001-R1
branch=develop
base_commit_id=cf0817f23c77190275b7f58c755c4e2c4619adc9
result_commit_id=NOT_APPLICABLE
env_check_status=SUCCESS
backend_build_status=NOT_APPLICABLE
frontend_build_status=SUCCESS
database_write_status=NOT_REQUESTED
zookeeper_write_status=NOT_REQUESTED
push_status=NOT_APPLICABLE
changed_files=frontend/src/views/client-config/ClientConfigPage.vue,frontend/src/views/client-config/ClientConfigPage.spec.ts,docs/features/client-config/README.md,docs/features/client-config/REQUIREMENTS.md,docs/features/client-config/ACCEPTANCE.md,docs/features/client-config/DESIGN.md,docs/features/client-config/UI.md,docs/features/client-config/reports/CLIENT-CONFIG-POPOVER-AND-DIALOG-VISUAL-IMPLEMENTATION-001-R1.md
error=
AGENT_TASK_RESULT_END
```

---

## 10. 证据勘误（`CLIENT-CONFIG-POPOVER-AND-DIALOG-VISUAL-EVIDENCE-CORRECTION-001` 追加，2026-09-23）

> 本节为**追加**内容。上文 §1~§9 与文末原有 `AGENT_TASK_RESULT` 块**保持原样、不回写**；本节只更正证据表述与脚本行为，不改变任何测量事实、已批准定义行或首页实现状态。

### 10.1 勘误事由与不准确措辞

ChatGPT 审阅未提交差异与本报告后指出：§5.1 把 `/tmp/ccvis/r1-popover.mjs` 描述为“脚本对每个场景断言……”，并暗示结果 JSON 存在 `PASS` 标志，与该脚本的实际行为不符。经复核，确认以下三点**此前的措辞不准确**：

- 旧脚本（SHA-256 `bbb3210ece5ed3048c1be878c490d497c9fa2023e604432bf543590c0ae7c88b`）**只采集**几何指标（`fullyVisible`、`popperOverflowTop/Bottom`、`list.maxHeight/overflowY/scrollHeight/clientHeight` 等），其本身**不构成断言**；§5.1 中“断言”一词是误述。
- 旧脚本末尾为**无条件 `process.exit(0)`**：即使弹层重新被裁切，它也以成功退出，因此**旧脚本的退出码不能作为通过依据**。
- 旧结果 JSON（SHA-256 `db7a9bce5bdfd558c32ca299446ce5ee4b9fb51ff73771e741372d41f8e22492`）**没有逐场景 `PASS/FAIL` 字段**，仅有测量值；§5.1 末段“脚本对每个场景断言……通过”的表述**不成立**。

因此：§5.2 表格中的“修复前/修复后”数值是**真实测量**，但**不能**据旧脚本的退出码或 JSON 结构宣称“断言通过”。本勘误**不**推翻 §2、§3 记录的首轮裁切事实，**不**修改初次报告 `…-IMPLEMENTATION-001.md`，**不**触及任何已批准定义行与首页实现状态。

### 10.2 修正后的脚本与真正的失败退出

在**原始**仓库外脚本上就地加入断言（旧版另存为对照文件）。关键差异：

| 项 | 旧版 | 修正后 |
|---|---|---|
| 每场景判据 | 无（仅采集指标） | 10 条断言（见 10.3） |
| 结果 JSON | 仅测量数组 | 含每场景 `pass`/`checks`/`failures` 与顶层 `allPass`/`exitCode`/`tolerancePx` |
| 进程退出码 | 无条件 `0` | `0` 全通过；`1` 存在失败场景或场景数不符；`2` 脚本自身异常 |
| 失败/异常时清理 | 无保护 | `try/catch/finally` 保证关闭 WebSocket、结束 Chrome、关闭临时静态服务器后再退出 |

真实命令（**在既有已构建 `dist` 上运行**；本任务未重跑 Vitest、全量测试或构建，因为本轮**未改动任何源码**，构建产物仍对应工作区）：

```bash
cd /tmp/ccvis && RUN_TAG=r1corr TMP_DIR=/tmp/ccvis/r1 node r1-popover.mjs
# 实测进程退出码：0
```

### 10.3 每场景断言（10 条，容差 `tolerancePx = 1`）

1. 弹层仍由点击触发——**点击前弹层不占任何盒子**（Element Plus 会预渲染 `display:none`、零尺寸、`aria-hidden="true"` 的弹层节点，故不以“DOM 中不存在该节点”为判据）；
2. 点击后弹层已打开且可见（`data-popper-placement` 存在，弹层宽高 > 0）；
3. 页面仅有一个 `+N` 触发器（`.cc-more` 计数为 1，点击目标明确）；
4. 清单条目数符合期望（首行/底边 9 项、常见 5/6 项），数据项未丢失；
5. 每项四边均在视口内：`top >= -1`、`bottom <= innerHeight + 1`、`left >= -1`、`right <= innerWidth + 1`；
6. 弹层 `top/bottom` 在视口内（上溢/下溢均为 0）；
7. 清单 `max-height` 为 `none`；
8. 清单 `overflow-y` 为 `visible`；
9. 清单 `scrollHeight` 与 `clientHeight` 一致（无内部滚动）；
10. 每个条目文本非空。

补充如实记录：第 1 条最初写成“点击前 DOM 中不存在 `.cc-full-list`”，实测因 Element Plus 预渲染而**误判为 FAIL**；已按上述“点击前不占盒子”重写。该细节说明这些断言并非恒真式。

### 10.4 九场景结果（修正后脚本真实运行）

```text
ASSERTION SUMMARY: 9/9 场景 PASS
exit=0 （全部场景通过）
失败条件总数 = 0
```

| 场景 | 视口 | placement | 弹层 top→bottom | 完整可见/总数 | 上溢/下溢 | max-height | overflow-y | scrollH/clientH | 结果 |
|---|---|---|---|---|---|---|---|---|---|
| nineFirstPlain | 1440×900 | `top` | 7.8 → 532 | 9/9 | 0 / 0 | none | visible | 490/490 | PASS |
| nineFirstPlain | 1920×1080 | `bottom` | 403 → 927.2 | 9/9 | 0 / 0 | none | visible | 490/490 | PASS |
| nineFirstStress | 1440×900 | `top` | 8.22 → 606 | 9/9 | 0 / 0 | none | visible | 564/564 | PASS |
| nineBottomPlain | 1440×900 | `top` | 49.8 → 574 | 9/9 | 0 / 0 | none | visible | 490/490 | PASS |
| nineBottomPlain | 1920×1080 | `top` | 229.8 → 754 | 9/9 | 0 / 0 | none | visible | 490/490 | PASS |
| fiveFirst | 1440×900 | `top` | 52.11 → 358 | 5/5 | 0 / 0 | none | visible | 272/272 | PASS |
| sixFirst | 1440×900 | `bottom` | 403 → 763.47 | 6/6 | 0 / 0 | none | visible | 326/326 | PASS |
| nineNearBottom | 1440×900 | `top` | 310.8 → 835 | 9/9 | 0 / 0 | none | visible | 490/490 | PASS |
| nineNearBottom | 1920×1080 | `top` | 310.8 → 835 | 9/9 | 0 / 0 | none | visible | 490/490 | PASS |

结论（限定于本次桩数据）：1440×900 首行 9 项与长 ID/异常文案场景在 `placement=top` 下 **9/9 完整可见、上下溢出 0**；底边、常见 5/6 项与贴近底边场景同样全部完整可见；所有场景清单仍为 `max-height: none`、`overflow-y: visible`、无内部滚动，**未**引入固定最大高度、内部滚动、overflow 裁切或隐藏条目。

### 10.5 失败退出能力的负向对照（证明断言可失败）

为证明修正后脚本**确实会失败**，另用一份**跑完即弃的副本** `/tmp/ccvis/r1-popover.selfcheck-fail.mjs`（仅将首行场景 `expectItems` 由 `9` 改为 `99`，其余逐字节相同）执行同一路径：

```bash
cd /tmp/ccvis && ONLY=nineFirstPlain RUN_TAG=selfcheck2 TMP_DIR=/tmp/ccvis/r1 node r1-popover.selfcheck-fail.mjs
# 实测进程退出码：1
# ASSERTION SUMMARY: 0/2 场景 PASS
# FAIL nineFirstPlain @ 1440x900 :: 清单条目数符合期望（数据项未丢失）  expected=99 actual=9
```

该副本**不属于**交付材料清单，仅作失败能力证据；它未写入仓库。

### 10.6 证据文件（修正后版本，文件名与旧版区分）

| 文件 | 大小(B) | SHA-256 |
|---|---|---|
| `/tmp/ccvis/r1-popover.mjs`（修正后断言脚本） | 21819 | `5ef51e63d354e83b4ee522aad48bfee6de5eb7baca7a2f9a8d86838f42c917e5` |
| `/tmp/ccvis/r1/r1corr-report.json`（修正后原始结果 JSON） | 86651 | `699a4592a6ce2675526123c27d8d17a906eb20805517f8e77d302408af2a744e` |
| `/tmp/ccvis/r1/r1corr-stdout.log`（运行标准输出） | 63900 | `435d6c1343488e7b8ce7af7c7310e066ec67ce828451382bea5ec2112aa13d24` |
| `/tmp/ccvis/r1/r1corr-nineFirstPlain-1440x900.png`（首行 9 项 1440×900） | 123712 | `dc717415433e857354bb546c30d7ec68bed18258a1dbf209c4ce4482b563136c` |
| `/tmp/ccvis/r1/r1corr-nineNearBottom-1440x900.png`（贴近底边 9 项 1440×900） | 140374 | `729f3900a2919f6944b5cf41b7843b54ae27ec8343c5f0413ee7f7327e6b739f` |

旧脚本与旧 JSON **按原样保留、未手改**：`/tmp/ccvis/r1-popover.original.mjs`（`bbb3210ece5ed3048c1be878c490d497c9fa2023e604432bf543590c0ae7c88b`，14115 B）、`/tmp/ccvis/r1/r1-report.original.json`（`db7a9bce5bdfd558c32ca299446ce5ee4b9fb51ff73771e741372d41f8e22492`，58444 B）。

补充事实（如实记录）：修正后重新截取的两张 1440×900 截图与 §5.3 所列旧截图**逐字节相同**（`dc717415…` / `729f3900…`）。这与“同一 `dist` 构建、同一桩数据下渲染确定”相符；同时也可佐证 §5.3 的旧截图确属**修复后**状态。

### 10.7 边界与未变更项

- 证据仍为**接口桩模拟**（静态服务 + 桩 `/api/clients`），**不是**项目负责人目测，**不是**正式验收；`CCFG-AC-001~117` 全部仍为 `NOT_RUN`。
- §2、§3 记录的首轮裁切事实、初次报告、五份 Feature 文档的已批准基线与 122/117/60/49 定义行、首页实现状态：**均未改动**。
- 本节**不**宣称代码已通过 ChatGPT 复审；工作区改动仍**未提交、未推送**，需先由 ChatGPT 审阅完整附件。
- 下一入口：`CHATGPT_LOCAL_DIFF_AND_BROWSER_EVIDENCE_REVIEW`。
