# CLIENT-CONFIG-AC138-DIALOG-LAYOUT-FIX-AND-RETEST-007｜探针弹窗布局修复与复测

- 任务：`CLIENT-CONFIG-AC138-DIALOG-LAYOUT-FIX-AND-RETEST-007`
- 固定基线：`ed41449cba8a6d6738deb4c52f456939999992ef`（`develop`，006-R1 远端复审通过、AC-138 为 FAIL）
- 验收对象：`CCFG-AC-138` / `CCFG-REQ-139`
- 页面范围：仅 `/config/client` 新增／编辑主弹窗
- 证据目录：`docs/features/client-config/reports/evidence/CLIENT-CONFIG-AC138-DIALOG-LAYOUT-FIX-AND-RETEST-007/`
- 现行下一入口：`CHATGPT_REMOTE_CLIENT_CONFIG_AC138_DIALOG_LAYOUT_FIX_AND_RETEST_007_REVIEW`

## 1. 结论

| AC | 判定 | 依据摘要 |
|---|---|---|
| `CCFG-AC-138` | **PASS** | 修复后，在已确认的两个视口（1920×1080、2560×1440，侧栏展开）中，新增与编辑的常规六步序列、两行 40941 长错误出现期间及修正后的弹窗上下左右边、高度与底部按钮坐标变化量全部为 `0`；连续帧采样无“先位移后回弹”；两行文字完整可读未被裁剪；1024×720 回归中弹窗稳定、按钮可命中、受控内部滚动后文字完整可读、无整页横向溢出 |

- `changed_ids=[CCFG-AC-138]`
- 验收统计：**`PASS 153 / FAIL 0 / BLOCKED 4 / NOT_RUN 0 = 157`**（`CCFG-AC-079/087/091/094` 保持 `BLOCKED`）
- 157 条定义、`CCFG-REQ`/`CCFG-DESIGN`/`CCFG-UI` 数量与 Feature 正式接受状态均未变；本轮不宣布 Feature 正式接受。

## 2. 任务边界与修复前复现

### 2.1 复现方法

在固定基线 `ed41449` 的未改工作区上，先临时移除本轮页面局部修复块，确认 Vite 实际返回的
`ClientConfigPage.vue` style 模块**不含** `--ced-feedback-min-height`，再以同一浏览器、同一网络门禁
采集 1K 基线（`results/baseline-repro-1k.json`）；随后恢复修复并确认服务端模块重新包含该令牌。
基线复现只覆盖 1920×1080 的 create/edit，用于证明缺陷真实存在，不作为最终验收计数。

### 2.2 复现结果（1K 1920×1080，侧栏展开）

| 场景 | 六步几何最大变化 | 长错误出现相对基线 | 修正后 | 连续帧最大位移 |
|---|---|---|---|---|
| 新增 | 全 `0` | `dialogBottom/dialogHeight/submitY = +16.37px`，其余 `0` | 全 `0` | `bottom/height/submitY = 16.37px` |
| 编辑 | 全 `0` | 同上 `+16.37px` | 全 `0` | 同上 `16.37px` |

- 新增：常规态弹窗高 `613.19px`；长错误出现时 `629.56px`（+16.37）；清除后回到 `613.19px`。
- 编辑：常规态 `635.58px`；长错误出现时 `651.95px`（+16.37）；清除后回到 `635.58px`。
- 长错误为两行，`feedbackStyle.height = 36.375px`，而公共预设预留 `20px`，差值 `16.375px`
  （实测取整 `16.37px`）。`dialogTop`、水平位置在出现前后未变，但下边与底部按钮确实随内容下移。
- 该结果与 006/R1 记录一致，确认 006 的 FAIL 判定在固定基线上可稳定复现。

## 3. 修复方案

### 3.1 实际改动

仅修改 `frontend/src/views/client-config/ClientConfigPage.vue` 的页面级样式，在采集数据源字段容器下
覆盖公共预设的最小占位令牌：

```css
.cc-source-field > .ced-field-feedback {
  --ced-feedback-min-height: calc(2 * 1.4 * 13px);
}
```

- 行高依据：反馈文字 `13px × 1.4 = 18.2px/行`；两行目标预留 `36.4px`。不是对实测 `16.37px`
  的反向硬补，而是按“两行错误为目标内容”预留。
- 复用能力：公共预设 `.ced-field-feedback` 本就以 `min-height: var(--ced-feedback-min-height, 20px)`
  消费该令牌；本页只覆盖**本字段**的令牌，公共模板 CSS 与全局默认值均未改。
- 作用域：仅“采集数据源”一个字段的反馈区；探针 ID、探针描述两个字段仍保留原有 `20px` 占位。
- 溢出策略：仍为 `min-height` 而非固定 `height`；超过两行时自然换行，由 `.cc-form` 的
  `max-height: calc(100vh - 240px)` 与 `overflow-y: auto` 受控滚动承接；未新增 `overflow` 裁剪、
  未改字体、未省略文案、未固定弹窗高度、未写死侧栏偏移、未用动画掩盖。
- 针对性前端测试：`ClientConfigPage.spec.ts` 新增“第七轮：AC-138 反馈区两行预留”两个用例，校验
  页面块只声明该令牌、不声明固定高度/overflow，公共预设仍以 `min-height: var(--ced-feedback-min-height, 20px)`
  消费，且三项字段反馈占位仍各自独立。

### 3.2 常态留白代价（如实报告）

修复后该字段在**常规态**即按两行预留，反馈区盒高由 `20px` 增至 `36.39px`（浏览器实测
`min-height=36.4px`、文字实测 `36.375px`），1K/2K 常规态弹窗高度相应增加约 `16.39px`
（新增 `613.19 → 629.58`，编辑 `635.58 → 651.97`）。这是以稳定的两行占位换取状态切换零位移的
明确代价；未扩散到其他字段、其他页面或公共模板。1024×720 下表单本就受 `max-height:480px`
约束，预留使常规态表单即可滚动 `29px`（新增）／`52px`（编辑），长错误仍完整可读（见 §7）。

## 4. 环境与运行版本

| 项目 | 实测 |
|---|---|
| 主验收（1K） | `innerWidth=1920`、`innerHeight=1080`，侧栏展开，内容区左边界 `220px` |
| 补充（2K） | `innerWidth=2560`、`innerHeight=1440`，侧栏展开 |
| 回归 | `innerWidth=1024`、`innerHeight=720`，侧栏展开 |
| DPR / 缩放 | `devicePixelRatio=1`；`visualViewport.scale=1`（100%） |
| 浏览器 | Chrome for Testing `147.0.7727.15`，headless（与 006 相同版本） |
| 服务 | 本任务自行启动：后端 PID 4429（`*:8080`）、前端 PID 4495（`0.0.0.0:5173`） |
| 页面入口 | `http://192.168.174.70:5173/config/client` |
| 源码来源 | 工作区 HEAD `ed41449` + 本轮未提交修复；服务端 style 模块已确认含新令牌 |
| 弹窗样式 | `width=900px`；`max-width` 1872 / 2512 / 976px；`max-height=none`；`margin-top` 162 / 216 / 108px |

- 100% 缩放执行；`dialogCentering.viewportCenterDelta=0`、`contentAreaCenterDelta=-110`
  在各视口一致，说明未引入与侧栏宽度相关的写死偏移。
- 详细记录见证据目录 `environment-and-version.txt`。

## 5. 修复后六步稳定性（1K / 2K，create + edit）

步骤：① 打开 → ② 未选数据源的稳定基线 → ③ 选中 1 个 → ④ 全部取消 → ⑤ 提交触发红色字段错误 →
⑥ 修正、错误消除。编辑先在表单内取消初始关联，再建立与新增相同的 0 关联基线；未提交真实修改。
每步在开窗动画结束后采样，并另以连续 `requestAnimationFrame` 帧序列监控红错出现过程。

### 5.1 1920×1080（主验收）

| 场景 | 步骤 | 反馈 / 选中 | 弹窗外框 top–bottom（高） | 底部按钮 x / y | 表单 client/scroll/scrollTop |
|---|---|---|---|---|---|
| 新增 | ① | 灰提示 / 0 | 162–791.58（629.58） | 1334 / 743.58 | 509 / 509 / 0 |
| 新增 | ② | 灰提示 / 0 | 162–791.58（629.58） | 1334 / 743.58 | 509 / 509 / 0 |
| 新增 | ③ | 隐藏 / 1 | 162–791.58（629.58） | 1334 / 743.58 | 509 / 509 / 0 |
| 新增 | ④ | 灰提示 / 0 | 162–791.58（629.58） | 1334 / 743.58 | 509 / 509 / 0 |
| 新增 | ⑤ | 红色错误 / 0 | 162–791.58（629.58） | 1334 / 743.58 | 509 / 509 / 0 |
| 新增 | ⑥ | 隐藏 / 1 | 162–791.58（629.58） | 1334 / 743.58 | 509 / 509 / 0 |
| 编辑 | ① | 初始关联保留 / 1 | 162–813.97（651.97） | 1334 / 765.97 | 532 / 532 / 0 |
| 编辑 | ② | 灰提示 / 0 | 162–813.97（651.97） | 1334 / 765.97 | 532 / 532 / 0 |
| 编辑 | ③ | 隐藏 / 1 | 162–813.97（651.97） | 1334 / 765.97 | 532 / 532 / 0 |
| 编辑 | ④ | 灰提示 / 0 | 162–813.97（651.97） | 1334 / 765.97 | 532 / 532 / 0 |
| 编辑 | ⑤ | 红色错误 / 0 | 162–813.97（651.97） | 1334 / 765.97 | 532 / 532 / 0 |
| 编辑 | ⑥ | 隐藏 / 1 | 162–813.97（651.97） | 1334 / 765.97 | 532 / 532 / 0 |

- 相对②基线的最大绝对变化量（`summary.deltas.maxAbs`，新增与编辑各自）：`dialogTop/Bottom/Left/Right/Height`、
  `submitX/submitY` 全部 `0`。
- 红错出现过程连续帧（各 53 帧）：`dialogTop/Bottom/Height/submitY.maxAbsVsBefore` 全部 `0`。
- 每步提交按钮可命中、弹窗可见、无整页横向溢出。

### 5.2 2560×1440（补充）

| 场景 | 六步几何最大变化 | 常规态弹窗 top–bottom（高） | 底部按钮 x / y | 连续帧最大位移 |
|---|---|---|---|---|
| 新增 | 全 `0` | 216–845.58（629.58） | 1654 / 797.58 | `0` |
| 编辑 | 全 `0` | 216–867.97（651.97） | 1654 / 819.97 | `0` |

六步反馈语气路径与 1K 相同；每步提交按钮可命中、弹窗可见、无整页横向溢出。

## 6. 修复后长错误（40941）与连续帧监控

长文案沿用 006 的同一文案与 005 已入仓的 40941 响应，经应用真实字段错误渲染路径显示；
浏览器内本地回放，未转发后端、未改 DOM/CSS。两行文字行框与可读性如下。

### 6.1 1920×1080 / 2560×1440（create + edit）

| 场景 | 出现前 top–bottom（高） | 出现期间 | 修正后 | 两行行框（top–bottom，宽） | 均在表单可视区 |
|---|---|---|---|---|---|
| 新增 1K | 162–791.58（629.58） | 相同 | 相同 | 692.19–707.19（731.03）；710.38–725.38（140.13） | true / true |
| 编辑 1K | 162–813.97（651.97） | 相同 | 相同 | 714.58–729.58（731.03）；732.77–747.77（140.13） | true / true |
| 新增 2K | 216–845.58（629.58） | 相同 | 相同 | 746.19–761.19（731.03）；764.38–779.38（140.13） | true / true |
| 编辑 2K | 216–867.97（651.97） | 相同 | 相同 | 768.58–783.58（731.03）；786.77–801.77（140.13） | true / true |

- `geometryDelta.afterVsBefore` 与 `correctedVsBefore`：四个场景全部 `0`。
- 连续帧监控（`longError.transition`，各 48–54 帧，约 0.88–1.82s）：
  `dialogTop/dialogBottom/dialogHeight/submitY.maxAbsVsBefore` 全部 `0`，未出现“先位移、后回弹”。
- 行数 `2`、`wrapped=true`、`textEqualsRecorded=true`；`overflow:visible`、`overflow-wrap:anywhere`、
  `white-space:normal`；反馈盒高 `36.39px`（`min-height=36.4px`），文字高 `36.375px`。
- 提交按钮在出现前/出现后/修正后均可命中；无整页横向溢出。

### 6.2 1024×720 回归

| 场景 | 弹窗外框（高） | 表单 client/scroll/scrollTop | 错误行框初始是否在可视区 | 滚动后 | 按钮可命中 | 横向溢出 |
|---|---|---|---|---|---|---|
| 新增 | 108–708.39（600.39） | 480 / 509 / 0 → 29 | false / false | 两行均在可视区 | true / true | 无 |
| 编辑 | 108–708.39（600.39） | 480 / 532 / 0 → 52 | false / false | 两行均在可视区 | true / true | 无 |

- 1024 下弹窗高度、上下边、底部按钮位置在错误出现/修正前后均不变（变化量 `0`）。
- 两行文字完整可读：初始需在表单内受控滚动 `29px`（新增）／`52px`（编辑），滚动后两行均在
  表单可视区内；底部按钮不被遮挡、可点击。
- 窄视口未出现整页横向溢出（`scrollWidth=clientWidth=1024`）。

## 7. 静态布局与实现核对

- 弹窗未固定高度：`dialogStyle.maxHeight=none`，高度随内容；修复仅改变反馈区最小占位，不固定弹窗。
- 未写死与侧栏宽度相关的偏移：`dialogCentering.viewportCenterDelta=0`、
  `contentAreaCenterDelta=-110` 在各视口一致；侧栏展开 `220px`，弹窗由公共 `.ced-dialog` 居中。
- 公共模板未被改写：`.ced-field-feedback { min-height: var(--ced-feedback-min-height, 20px); margin-top: 2px; }`
  保持原样；公共令牌默认值未改；其他页面未改。
- 三项字段反馈占位仍各自独立（页面测试断言 `.cc-field-feedback.ced-field-feedback` 共 3 个；
  采集数据源字段恰好 1 个直接子反馈占位）。
- 未裁剪、未单行省略、未缩字号、未改文案、未把字段错误改为全局提示、未强制滚动位置、未用动画掩盖；
  字段、提交、错误映射、按钮行为与可访问性均未改。

## 8. 网络台账（摘要）

- 门禁在首次导航前安装，`serviceWorkers: 'block'`；只放行 `GET/HEAD/OPTIONS`。
- 修复后复测共 22 次只读请求：`/api/clients` ×6、`/api/clients/data-source-options` ×10、
  Vite 模块 `/src/api/clientConfig.ts` ×6。
- 非 GET 尝试 6 次（create `POST /api/clients` ×3、edit `PUT /api/clients/probe-001` ×3），
  **全部本地回放，后端转发 0**；无业务写入、无 DML/DDL、无夹具、无数据库直连、未访问数据源管理页。
- 长错误分支明确是浏览器本地回放，不是本轮真实后端拒绝；本轮未发生真实后端写入或拒绝。
- 详见证据目录 `network-ledger.md`。

## 9. 测试与构建

| 项目 | 命令 | 结果 |
|---|---|---|
| 定向前端测试 | `cd frontend && npx vitest run src/views/client-config/ClientConfigPage.spec.ts` | **186/186 通过**（含本轮新增 2 条静态/组件用例） |
| 前端构建 | `cd frontend && npm run build`（`vue-tsc --noEmit` + `vite build`） | **成功**（约 15.21s；仅既有 chunk-size 警告，无类型错误） |

## 10. 判定、统计与状态保护

- 逐条对照 AC-138：① 提示/错误状态切换不造成弹窗高度或位置突变 —— 通过（六步与长错误切换全 `0`）；
  ② 长错误完整可读、未被硬裁剪 —— 通过（两行完整、可读、无 `overflow:hidden`/固定单行）；
  ③ 允许响应式布局与受控滚动 —— 通过（1024 受控滚动后完整可读）；④ 未写死侧栏偏移或固定弹窗高度 —— 通过。
- `ACCEPTANCE.md` 仅将 `CCFG-AC-138` 状态格由 `FAIL` 改为 `PASS`，独立复算：
  `PASS 153 / FAIL 0 / BLOCKED 4 / NOT_RUN 0 = 157`；`CCFG-AC-079/087/091/094` 保持 `BLOCKED`，
  其余状态格、157 条定义、四族数量与 Feature 正式接受状态未改。
- 006/R1 报告与其原始 JSON/探针/校验文件保持原样；本轮为独立新建证据目录。

## 11. 变更文件

- `frontend/src/views/client-config/ClientConfigPage.vue`（页面局部反馈占位令牌）
- `frontend/src/views/client-config/ClientConfigPage.spec.ts`（定向测试 2 条）
- `docs/features/client-config/ACCEPTANCE.md`（仅 AC-138 状态格 `FAIL → PASS`）
- `docs/features/client-config/README.md`（本任务状态与入口最小同步）
- `docs/features/client-config/reports/CLIENT-CONFIG-AC138-DIALOG-LAYOUT-FIX-AND-RETEST-007.md`（本报告）
- `docs/features/client-config/reports/evidence/CLIENT-CONFIG-AC138-DIALOG-LAYOUT-FIX-AND-RETEST-007/`
  （探针、两轮结果 JSON、环境记录、网络台账、索引、SHA256SUMS）

## 12. 局限

- 仅使用 Chrome for Testing `147.0.7727.15`（headless）、DPR=1、100% 缩放；未覆盖其他浏览器/缩放组合。
- 1024×720 仅做长错误可读性、按钮可操作与横向溢出回归，不替代两个已确认视口。
- 长错误来自 005 已入仓真实后端记录的浏览器本地回放；本轮未真实向后端提交冲突写入（符合门禁要求）。

## 13. 下一入口

`CHATGPT_REMOTE_CLIENT_CONFIG_AC138_DIALOG_LAYOUT_FIX_AND_RETEST_007_REVIEW`
