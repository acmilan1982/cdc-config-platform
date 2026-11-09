# CLIENT-CONFIG-REMAINING-REFERENCE-EVIDENCE-REVIEW-008｜剩余四项参考证据复核

- 任务：`CLIENT-CONFIG-REMAINING-REFERENCE-EVIDENCE-REVIEW-008`
- 固定基线：`2c830ad0479e83cc4cc22a0e35598c7a564a6c32`（`develop`，007 远端复审通过）
- 复核对象：`CCFG-AC-079`、`CCFG-AC-087`、`CCFG-AC-091`、`CCFG-AC-094`（其余 153 项与 157 条定义不属本轮范围）
- 页面范围：只静态读取仓库内参考页历史报告、脱敏原始运行证据与相关源码；**未打开、未请求、未操作 `/config/data-source` 或其他功能页面**
- 证据目录：本轮**无新增探针侧实测**，不新建证据目录
- 现行下一入口：`CHATGPT_REMOTE_CLIENT_CONFIG_REMAINING_REFERENCE_EVIDENCE_REVIEW_008_REVIEW`

## 1. 结论

| AC | 判定 | 依据摘要 |
|---|---|---|
| `CCFG-AC-079` | **BLOCKED** | 探针侧两视口几何齐全；参考侧仓库内仍无 `/config/data-source`“新增数据源”按钮相对结果区头部的运行时几何，也无关按钮所在视口/DPR/缩放条件 |
| `CCFG-AC-087` | **BLOCKED** | 探针侧“停用”标识计算样式与两视口位置齐全；参考侧只有“同格/行高”文字证据，缺 `/config/data-source`“数据源 ID”停用标识的同条件计算样式；旧快照页 Badge 与设计基线不能替代 |
| `CCFG-AC-091` | **BLOCKED** | 探针侧三态 ID 正文计算样式两视口齐全；参考侧有字号/字重/颜色但**缺单元格背景**，且无该组测量所属视口/DPR/缩放/浏览器条件 |
| `CCFG-AC-094` | **BLOCKED** | 探针侧绿色标签几何、配色、居中与未裁切两视口齐全；参考侧角色标签有几何/配色但**缺文字居中量**，且无该组测量所属视口/DPR/缩放/浏览器条件 |

- `changed_ids=[]`
- 验收统计：**`PASS 153 / FAIL 0 / BLOCKED 4 / NOT_RUN 0 = 157`**（未变）
- `ACCEPTANCE.md` 未修改；157 条定义、`CCFG-REQ`/`CCFG-DESIGN`/`CCFG-UI` 数量与 Feature 正式接受状态均未变；本轮不宣布 Feature 正式接受。
- `reference_page_live_access=0`；`backend_non_get_forwarded=0`；本轮未启动浏览器、未调用业务接口、未启停服务、未做任何业务或数据库/ZooKeeper 写操作。

## 2. 边界与开工检查

| 检查项 | 实测 |
|---|---|
| 工作目录 | `/agent/cdc-config-platform`（有效 Git 仓库） |
| 分支 | `develop` |
| `git status --short` | `M .claude/settings.local.json`、`?? docs/prompts/`、`?? runtime-logs/`（均为任务开始前既有、非本任务范围，保持原样） |
| HEAD | `2c830ad0479e83cc4cc22a0e35598c7a564a6c32` |
| `origin/develop`（`git ls-remote`） | `2c830ad0479e83cc4cc22a0e35598c7a564a6c32` |
| 与基线关系 | 本地 HEAD 与远端一致，未分叉 |
| 服务状态 | 8080/5173 无监听，无 vite/后端进程 |
| 参考页访问 | 0 次（未导航、未请求、未操作） |
| 探针侧补采 | 未执行。参考侧证据不足，且服务未运行；按任务要求不重复已完成的探针侧测量，不自行构建或启停服务 |

未执行 `reset`、`clean`、`stash`、`checkout` 或任何覆盖既有改动的操作。

## 3. 检索范围与固定引用

### 3.1 已检索来源

| 来源 | 固定提交 | 本轮用途 |
|---|---|---|
| `docs/features/client-config/ACCEPTANCE.md`（四条原定义） | `2c830ad` | 条款原文与视口要求 |
| `docs/features/client-config/reports/CLIENT-CONFIG-LIST-MENU-AND-ROW-HEIGHT-ACCEPTANCE-004.md` | `9b1bf9f`（R1 最后一次勘误） | 探针侧两视口结论与来源索引 |
| `docs/features/client-config/reports/CLIENT-CONFIG-LIST-MENU-AND-ROW-HEIGHT-ACCEPTANCE-004-R1.md` | `9b1bf9f` | 四项维持 BLOCKED 的理由复核 |
| `docs/features/client-config/reports/evidence/CLIENT-CONFIG-LIST-MENU-AND-ROW-HEIGHT-ACCEPTANCE-004/reference-evidence-index.md` | `9b1bf9f` | E1–E7 与跨页参考证据清单 |
| `.../evidence/...-004/results/readonly-geometry.json` | `1104191` | 探针侧两视口原始几何/样式 |
| `.../evidence/...-004/results/readonly-menu-keyboard.json` | `1104191` | 长 ID Tooltip、双击与键盘编辑入口 |
| `docs/features/data-source-management/reports/DATA-SOURCE-LIST-ALL-STATUS-ENABLE-DISABLE-UI-ADJUSTMENT-FORMAL-ACCEPTANCE-001.md` | `81c2081` | 参考页正式验收的 `DS-AC-147/148/149/151/152/179` |
| `docs/features/data-source-management/evidence/DATA-SOURCE-LIST-ALL-STATUS-ENABLE-DISABLE-UI-ADJUSTMENT-FORMAL-ACCEPTANCE-001/01-git-and-runtime-identity.md` | `0a4200a` | 参考侧运行身份（仅记录 Chrome `148.0.7778.167`） |
| `runtime-logs/DATA-SOURCE-LIST-ALL-STATUS-ENABLE-DISABLE-UI-ADJUSTMENT-FORMAL-ACCEPTANCE-001/phaseB-case-b.log`（未入仓、gitignored） | 本地未跟踪 | 参考侧原始值：`ds.idText`、`ds.srcTag`/`ds.tgtTag`、`markers` |
| `docs/baseline/list-table-visual-template/evidence/LIST-TABLE-VISUAL-TEMPLATE-SHARED-IMPLEMENTATION-FORMAL-ACCEPTANCE-001/03-browser-equivalence-1440x900.json` | `8501416` | `/config/data-source` 在 1440×900、DPR 1、100% 下的表级运行时样本 |
| `.../04-browser-equivalence-1920x1080.json` | `8501416` | 同上，1920×1080 |
| `docs/features/client-config/reports/evidence/CLIENT-CONFIG-ROW-HEIGHT-AND-OPTIONAL-ELLIPSIS-IMPLEMENTATION-001/row-height-results.json` | `d93f838` | E5：参考页两视口行高（仅行高口径） |
| `docs/features/data-source-snapshot-status/reports/DATA-SOURCE-SNAPSHOT-STATUS-PROTOTYPE-TO-FORMAL-IMPLEMENTATION-001.md` | `ba309ea` | 旧快照页 Badge 运行时样式（**非** `/config/data-source`） |
| `docs/baseline/list-table-visual-template/UI.md` | `925c3a8` | `.ds-inactive-mark` 等**设计基线**取值（非运行时） |
| `frontend/src/views/data-source/DataSourcePage.vue` | 工作区 HEAD | 参考页代码变更可比性 |
| `frontend/src/views/client-config/ClientConfigPage.vue` | 工作区 HEAD | 探针页代码变更可比性 |
| `frontend/src/styles/list-table/list-table-visual.css` | 工作区 HEAD | 公共表格预设是否影响四属性 |

### 3.2 检索结论

- 004 报告与其证据索引已经列出 E1–E7；本轮在其基础上定向复核参考侧，没有发现新的同条件运行时测量。
- 仓库内**不存在**同时满足以下条件的参考侧证据：对象为 `/config/data-source`、覆盖 `1440×900` 与 `1920×1080`、记录浏览器版本/DPR/缩放，且包含四项所需的按钮几何、标识计算样式、ID 正文背景或角色标签居中量。
- 旧快照页 `/monitor/data-source-state` 的 Badge 样式与 `docs/baseline/list-table-visual-template/UI.md` 的设计取值，均为**不同页面**或**设计口径**，不能替代参考页运行时实测。

## 4. 逐视口可比性

探针侧条件固定（004 证据 `conditions` 段）：

| 条件 | 探针侧（`/config/client`） | 参考侧（`/config/data-source`） | 可比性 |
|---|---|---|---|
| 浏览器 | Chromium `147.0.7727.15`（headless） | Chrome `148.0.7778.167`（DS 正式验收） | **版本不同**，需作为差异记录 |
| 视口 | `1440×900`、`1920×1080`（`innerWidth/innerHeight`） | **未记录** | 无法逐视口对齐 |
| DPR | `1` | **未记录** | 无法确认一致 |
| 缩放 | `100%` | **未记录** | 无法确认一致 |
| 侧栏 | 展开 | **未记录** | 影响头部横向位置，需对齐 |
| 同条件表级样本 | — | LT 等价验收 JSON 有 `1440×900`/`1920×1080`、DPR 1、`visualViewportScale 1` 的 `/config/data-source` 运行样本 | 条件最好，但**仅覆盖表根/表头/行/单元格几何与表头样式**，不含四项所需字段 |

因此本轮的阻塞点不是探针侧缺失，而是**参考侧缺少可对齐的同条件运行时测量**。按任务要求，不得以源码相同、版本相近或只命中一个视口推定另一组成立。

## 5. 逐项证据矩阵

### 5.1 `CCFG-AC-079`：新增按钮位于结果区头部最右侧

| 视口 | 条款 | 探针侧来源与值 | 参考侧来源与值 | 比较条件与代码变更核对 | 结论 | 仍缺证据 |
|---|---|---|---|---|---|---|
| 1440×900 | 头部最右侧；与“新增数据源”右侧位置一致；头部左侧无该按钮 | `readonly-geometry.json` `viewports["1440x900"].addButton`（`1104191`）：`btnLeft=1264`、`btnRight=1368`、`btnW=104`、`toolbarRight=1368`、`headerRight=1384`、`rightGapInToolbar=0`、`isToolbarLastChild=true`、`otherToolbarChildren=0`、`leftOfSummaryHasAdd=false`、`addBtnCount=1`、`clonedInFilterArea=false` | DS 正式验收 `DS-AC-179`（`81c2081`）只有按钮样式 `120×32`，无位置；`phaseB-case-b.log` 的 `addButton` 只有 class/颜色，无几何；LT 等价 JSON（`8501416`）有表根/表头矩形，无按钮 | 参考侧无该视口按钮/头部矩形，无法比较相对位置；参考页代码 `583e9df`→HEAD 的 `DataSourcePage.vue` 差异未触及结果区头部或按钮位置（见 §6） | **BLOCKED** | 参考页 1440×900 下“新增数据源”按钮与结果区头部的矩形/右侧间距，及其 `isToolbarLastChild`/`rightGapInToolbar` 等价量 |
| 1920×1080 | 同上 | 同文件：`btnLeft=1744`、`btnRight=1848`、`btnW=104`、`toolbarRight=1848`、`headerRight=1864`，其余字段同 1440 | 同上，仍无按钮几何 | 同上；两侧内容区宽度不同，须比较各自头部内的右侧定位，不能拿绝对 x 硬比；当前连参考侧相对定位都没有 | **BLOCKED** | 参考页 1920×1080 下同一组相对定位字段 |

### 5.2 `CCFG-AC-087`：ID 列紧随序号、停用标识视觉与参考一致且不挤压操作列

| 视口 | 条款 | 探针侧来源与值 | 参考侧来源与值 | 比较条件与代码变更核对 | 结论 | 仍缺证据 |
|---|---|---|---|---|---|---|
| 1440×900 | 序号后为探针 ID；启用行无标识、停用行有“停用”；视觉（配色/圆角/高度/字号字重）、间距、显示方式与数据源管理“数据源 ID”停用标识一致；不遮挡操作列 | `readonly-geometry.json` `viewports["1440x900"]`：列序 `序号→探针 ID→探针描述→采集数据源→数据源数量→操作`；`idTriState.on.marker=null`；`off.marker` 为 `cc-inactive-mark`，`height=20`、`width=34`、`borderRadius=4px`、`fontSize=11px`、`fontWeight=700`、`color=rgb(153,27,27)`、`background=rgb(254,226,226)`、`padding=0px 6px`、`lineHeight=11px`、`markerInsideCell=true`、`markerVerticalCenterDelta=0`；`tableChrome.lastThRight=lastTdRight=1368` | DS 正式验收 `DS-AC-151/152`（`81c2081`）只记录标识文案、同格与行高一致；`phaseB-case-b.log` `markers` 只有 `text`/`sameRowAsId`/`inactive`，**无计算样式**；旧快照页 Badge（`ba309ea`）为 `/monitor/data-source-state`，非参考页；`UI.md`（`925c3a8`）为设计口径 | 参考侧缺同条件计算样式；参考页代码差异未触及 `.ds-inactive-mark`（见 §6） | **BLOCKED** | 参考页 1440×900 下停用标识的 color/background/radius/height/font-size/font-weight/padding/line-height 及与 ID 的间距、排列；启用行无标识的同条件证据 |
| 1920×1080 | 同上 | 同文件 `viewports["1920x1080"]`：各字段与 1440 完全一致（含 `marker` 全部值、`markerVerticalCenterDelta=0`）；`lastThRight=lastTdRight=1848` | 同上，仍无计算样式 | 同上 | **BLOCKED** | 参考页 1920×1080 下同一组字段 |

### 5.3 `CCFG-AC-091`：ID 正文颜色与字重、三态、省略/Tooltip/编辑入口

| 视口 | 条款 | 探针侧来源与值 | 参考侧来源与值 | 比较条件与代码变更核对 | 结论 | 仍缺证据 |
|---|---|---|---|---|---|---|
| 1440×900 | ID 正文颜色/字重与参考“数据源 ID”一致；三态保持各自语义；未整列加粗改色；单行省略、完整 Tooltip、鼠标/键盘编辑不变 | `readonly-geometry.json` `viewports["1440x900"].idTriState`：`on/off/abnormal/long` 正文均 `color=rgb(9,9,11)`、`fontWeight=600`、`fontSize=14px`；`off.marker=cc-inactive-mark`、`abnormal.marker=cc-abnormal-mark` 各自独立；`long` `clientWidth=152`、`scrollWidth=274`、`truncated=true`、`whiteSpace=nowrap`、`overflow=hidden`、`textOverflow=ellipsis`；`role=button`、`tabIndex=0`。Tooltip/双击/键盘入口见 `readonly-menu-keyboard.json`：`longIdTooltip.visible=true` 且完整值、`dblclickDialog.open=true`、`tabFocus` 有 2px 焦点环 | DS 正式验收 `DS-AC-148`（`81c2081`）：`ds.idText = 14px/600/rgb(9,9,11)/monospace` 与参考 `.dss-probe-main` 一致；**未记录单元格背景**；`phaseB-case-b.log` 同。参考侧运行身份仅记录 Chrome `148.0.7778.167`，**无视口/DPR/缩放** | 数值上字号/字重/颜色相同，但不等同同条件实测；背景两侧均未记录；浏览器 147 vs 148；参考页代码差异未触及 `.dss-probe-main`/ID 正文（见 §6） | **BLOCKED** | 参考页两视口下 ID 正文 color/weight/**单元格背景**及浏览器/DPR/缩放条件；探针侧若要补齐背景，需另行授权的只读补采 |
| 1920×1080 | 同上 | 同文件 `viewports["1920x1080"].idTriState`：与 1440 完全一致；`readonly-menu-keyboard.json` 无顶层视口元数据（交互项为单次记录） | 同上 | 同上；交互项也缺逐视口记录，但首要阻塞仍为参考侧 | **BLOCKED** | 参考页 1920×1080 下同一组字段；探针侧交互项的视口元数据（如需用于最终判定） |

### 5.4 `CCFG-AC-094`：数据源标签采用参考角色标签视觉语言，绿色语义与居中

| 视口 | 条款 | 探针侧来源与值 | 参考侧来源与值 | 比较条件与代码变更核对 | 结论 | 仍缺证据 |
|---|---|---|---|---|---|---|
| 1440×900 | 无项级 anomalies、无整行 `COMMA_PROTOCOL_AMBIGUOUS` 的样本；标签高/字重/圆角/无边框/柔和底色与参考“角色”标签相近；绿色表示“当前未检测到异常”；文字水平/垂直居中、无裁切偏移 | `readonly-geometry.json` `viewports["1440x900"].tags.green`：`cls=cc-dstag cc-dstag--ok`、`height=20`、`borderRadius=4px`、`fontWeight=600`、`fontSize=12px`、`borderTopWidth=0px`、`borderStyle=none`、`color=rgb(4,120,87)`、`background=rgb(236,253,245)`、`padding=0px 9px`、`display=flex`、`alignItems=center`、`justifyContent=center`、`textVerticalCenterDelta=0`、`textHorizontalCenterDelta=0`、`clippedByTag=false`；`rowsSample` 中同表 `hasRowbad=false`（无整行歧义），绿色类即无项级异常 | DS 正式验收 `DS-AC-149`（`81c2081`）：源库标签 `rgb(254,243,199)`/`rgb(180,83,9)`、目标库标签 `rgb(236,253,245)`/`rgb(4,120,87)`，均 `height=20 / 12px / 600 / radius 4px / borderTopWidth 0`，`tagIsElTag=true`；`phaseB-case-b.log` 同；**无文字居中量**；无视口/DPR/缩放 | 几何/配色数值接近，但参考侧无居中量与逐视口条件；参考页代码差异未触及 `.ds-dstag`/标签样式（见 §6） | **BLOCKED** | 参考页两视口下角色标签的文字水平/垂直居中量、裁切情况，及浏览器/DPR/缩放条件（含样本确无项级异常与整行歧义的说明） |
| 1920×1080 | 同上 | 同文件 `viewports["1920x1080"].tags.green`：与 1440 完全一致（所有字段相同），`clippedByTag=false` | 同上 | 同上 | **BLOCKED** | 参考页 1920×1080 下同一组字段 |

## 6. 代码变更可比性核对

### 6.1 探针侧（`/config/client`）

- 探针页 `frontend/src/views/client-config/ClientConfigPage.vue` 自 004 采集基线 `968c1e5` 到当前 `2c830ad` 的提交只有 `2c830ad`（AC-138 弹窗反馈区令牌）。
- 该差异只新增 `.cc-source-field > .ced-field-feedback` 的 `--ced-feedback-min-height`，**未触及**新增按钮/结果区头部、ID 正文、`cc-inactive-mark`、`cc-abnormal-mark`、`cc-dstag` 或操作列。
- 结论：004 的探针侧四属性值对当前代码仍可复用；本轮按任务要求未重复探针侧测量。

### 6.2 参考侧（`/config/data-source`）

- 参考页 `frontend/src/views/data-source/DataSourcePage.vue` 自参考采集基线 `583e9df` 到 `HEAD` 的提交为 `c6d752c`、`807a5a5`、`55e6273`。
- 逐行核对差异：新增 `LT_MAIN_TABLE_CLASS` 根类、`label-position="right"`、新增/编辑弹窗提交按钮黑白样式、弹窗标签与密码星号样式，并把表头/正文基础表格样式迁移到公共预设 `frontend/src/styles/list-table/list-table-visual.css`（令牌值等价）。
- 差异**未触及** `.ds-inactive-mark`、`.ds-abnormal-mark`、`.ds-dstag`、`.dss-probe-main`（ID 正文）或“新增数据源”按钮的位置/头部布局；公共预设只定义表宽/表头/单元格内边距/三点入口命中区。
- 结论：参考侧四属性的实现路径在采集后未被改动，历史取值在**代码层面**仍可对应；但代码未变**不能**补出缺失的运行时条件（视口、DPR、缩放、浏览器、居中量、背景、按钮几何）。

## 7. 缺失字段与最小后续条件

| AC | 缺什么 | 最小后续条件 |
|---|---|---|
| 079 | 参考页两视口“新增数据源”按钮与结果区头部的相对几何（按钮 left/right/width、头部 right、右侧间距、是否头部最后子元素） | 经负责人明确授权的 `/config/data-source` 只读运行时测量：`1440×900` 与 `1920×1080`、与探针相同的浏览器/DPR/缩放、侧栏状态对齐，输出上述字段并入库脱敏证据 |
| 087 | 参考页两视口停用标识计算样式（color/background/radius/height/font-size/font-weight/padding/line-height）及与 ID 间距/排列；启用行无标识 | 同上条件的只读测量，输出上述计算样式与同格排列 |
| 091 | 参考页两视口 ID 正文 color/weight 与**单元格背景**；该组测量的浏览器/DPR/缩放；探针侧背景如需补齐亦须另行只读补采 | 同上条件的只读测量，输出正文与单元格背景计算样式；探针侧背景字段在授权下补齐 |
| 094 | 参考页两视口角色标签的文字水平/垂直居中量、裁切情况、完整计算样式；样本无项级异常且无整行歧义的说明；该组测量的浏览器/DPR/缩放 | 同上条件的只读测量，输出居中量/裁切/计算样式，并记录样本条件 |

说明：本轮未获授权打开或请求参考页，且服务未运行；按任务要求保留证据缺口，不写成产品缺陷，也不写成已通过。参考侧证据不足时，未重复已完成的探针侧测量。

## 8. 网络与运行台账

- 本轮为纯静态只读取证：未启动浏览器、未安装网络门禁、未发起任何 `/api/**` 请求，也未访问任何页面。
- `reference_page_live_access=0`；`backend_non_get_forwarded=0`；业务写 0；数据库写 0；ZooKeeper/Kafka 操作 0。
- 未启停服务；未构建前端/后端（本任务无代码改动，按验证矩阵不需要构建）。

## 9. 状态与统计保护

独立复算（对 `ACCEPTANCE.md` 逐行统计）：

- AC 行数 **157**，唯一 ID **157**，区间 `CCFG-AC-001`–`CCFG-AC-157`，连续无缺号。
- 状态分布：`PASS 153`、`BLOCKED 4`、`FAIL 0`、`NOT_RUN 0`；BLOCKED 精确为 `CCFG-AC-079/087/091/094`。
- 定义行数：`CCFG-REQ 154`、`CCFG-AC 157`、`CCFG-DESIGN 89`、`CCFG-UI 77`，与 Feature README 既有口径一致。
- 本轮 `changed_ids=[]`；未修改任何状态格；未修改 157 条定义；未标记 Feature 正式接受。

## 10. 变更文件

- `docs/features/client-config/reports/CLIENT-CONFIG-REMAINING-REFERENCE-EVIDENCE-REVIEW-008.md`（本报告）
- `docs/features/client-config/README.md`（追加本轮最小入口说明）

未修改：`ACCEPTANCE.md`、旧证据目录、产品代码、配置、公共模板、参考页及其他 Feature 文件。

## 11. 局限

- 未获得参考页实时只读访问授权，参考侧只能使用仓库内历史证据。
- 参考侧历史证据缺统一记录的浏览器/视口/DPR/缩放，且浏览器版本（Chrome 148）与探针（Chromium 147）不同。
- `phaseB-case-b.log` 为本地未跟踪原始日志；可追溯的入仓摘要见 DS 正式验收报告，但两者都缺本轮所需字段。
- 未进行任何新的探针侧或参考侧运行时测量，因此无法用本轮新数据消除缺口。

## 12. 下一入口

`CHATGPT_REMOTE_CLIENT_CONFIG_REMAINING_REFERENCE_EVIDENCE_REVIEW_008_REVIEW`
