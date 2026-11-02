# 探针端管理定向只读验收补测报告 002

- **任务编号**：`CLIENT-CONFIG-TARGETED-READONLY-ACCEPTANCE-SUPPLEMENT-002`
- **性质**：**真实浏览器只读**定向验收补测（真实运行页面、网络层写阻断、零业务写入）。
- **范围**：**仅** `/config/client`（探针端管理）及该 Feature 既有验收定义、报告与证据。**不**访问／测试／修改其他功能页面；对已批准 AC 中的跨页前置**只复用已入仓历史证据**，缺失即保持缺口。**不**授权业务写入、夹具创建、数据库／ZooKeeper／Kafka 改动或 157 条整体验收收口。
- **分支 / 起点**：`develop`，任务开始前 HEAD = `d925899e9072acf5f5e4146e1a5fcdef566486fa`；`origin/develop` 与远程 `refs/heads/develop` 同为该提交，三方一致、无前移、无分叉。
- **目标 AC（12 条）**：`CCFG-AC-009 / 017 / 088 / 092 / 101 / 103 / 112 / 115 / 124 / 130 / 136 / 151`。本轮**不**处理 `CCFG-AC-098`、`155`、`156`、`157`（保留 R3 已审结论）。

---

## 1. 现场与基线核对

| 项 | 值 |
|---|---|
| 分支 | `develop` |
| 任务开始前提交（base） | `d925899e9072acf5f5e4146e1a5fcdef566486fa` |
| `origin/develop` / 远程 `refs/heads/develop` | `d925899e9072acf5f5e4146e1a5fcdef566486fa`（三方一致） |
| 工作区既有无关内容（**保持原样，未改／未暂存／未提交**） | `.claude/settings.local.json`（M）、`docs/prompts/`（??）、`runtime-logs/`（??） |
| 正式项目级基线 | `docs/baseline/` 六份已于任务开始时完整读取 |
| 功能级基线 | `docs/features/client-config/{README,REQUIREMENTS,DESIGN,ACCEPTANCE,UI,API,DATABASE}.md` |
| 初始四态（基准） | `PASS` **71** / `FAIL` **0** / `BLOCKED` **71** / `NOT_RUN` **15** = **157** |

**定义保护基线**：`ACCEPTANCE.md` §4 共 157 条、编号 `CCFG-AC-001~157` 连续且唯一；除本报告 §6 明确列出的状态格外，任何定义单元、步骤、预期均未被改写。

---

## 2. 执行方式与写阻断

| 项 | 值 |
|---|---|
| 浏览器 | Chromium（Playwright `playwright-core` + `chromium-1217`），headless，`deviceScaleFactor=1` |
| 前端 | Vite dev server 实际服务工作树（`http://127.0.0.1:5173`，监听 `0.0.0.0:5173`，PID 7191）；`frontend/src` 末次提交 `d878c3d` |
| 后端 | 只读调用 `http://127.0.0.1:8080`（监听 `*:8080`，PID 7137）；jar `2026-09-22T12:21:27Z`，sha256 `efdbea82…`，晚于其后端源末次提交 `807a5a58`（2026-09-20）且无更晚 `backend/src` 提交 |
| 视口 | 列表/确认框：1440×900、1920×1080；弹窗：1440×900、1920×1080、900×800（窄视口） |
| **写阻断** | **首次导航前**在浏览器上下文安装 `context.route('**/api/**')`：`GET/HEAD/OPTIONS` 放行，其余方法一律 `abort('blockedbyclient')` 并计数 |
| **非 GET 拦截计数** | 4 个探针、所有视口 **均为 `0`**（`s2-*.json` → `writeInterception.nonGetAttempts=0`，`attempts=[]`） |
| 交互边界 | 仅：导航、悬停、真实键盘焦点、滚动、行选择、菜单/弹窗/确认框**打开与取消**、本地无效表单校验、**未提交**草稿；**未**点击启停/删除最终确认；**未**直调写接口；**未**建夹具或改库 |

**脱敏**：业务 ID／机构名不入仓。确认框正文中的探针 ID 在证据中掩码为 `<ID>`（`bodyMasked`）；弹窗「已分配」原因文本同样掩码为 `已分配给：<ID>`；`fgActive` 原始值不落盘，仅记录逐行布尔匹配与掩码形状。全量证据扫描未见真实业务 ID／机构名（详见 §9）。

---

## 3. 逐 ID 覆盖与判定

> 证据键缩写：`s2-list` = `evidence/...-002/s2-list-results.json`；`s2-dialog` = `s2-dialog-results.json`；`s2-fg` = `s2-fgactive-results.json`；`s2-confirm` = `s2-confirm-results.json`。既有证据键以 `CLIENT-CONFIG-FORMAL-ACCEPTANCE-EXECUTION-001-R5/coverage-matrix.json` 与各历史报告为准。

| AC | 现行定义要点（前置/步骤/预期） | 既有证据 | 本轮新增证据（键/取值） | 前→后 | 判定结论 |
|---|---|---|---|---|---|
| **009** | 存在多数据源探针；1440/1920 下观察表头与采集数据源列；列为 序号｜探针 ID｜探针描述｜采集数据源｜数据源数量｜操作（最右固定）、无“状态”列、以机构名为主 | R5 `key=009` / `accA.json`：表头/无状态列/机构名；缺 **1920×1080 腿** | `s2-list` 两视口 `structure.headers` 精确等于六列、`hasStatusColumn=false`、`structure.headersRightmost="操作"`；`dataSourceColumn[*].allVisibleTagsMatchOrgWhereOrgExists=true`（多源行 idx4：1440 `visible=2/+3`、1920 `visible=5`，`tagTotalInDom=5`） | BLOCKED→**PASS** | 六列/无状态列/最右操作列/机构名主显示在**两桌面视口**均成立；历史缺的 1920 腿由本轮补齐 |
| **017** | 1440/1920 观察头部与页面；单击普通单元格；头部最右“新增探针”、无“删除所选”/批量入口、无单选/高亮/“已选择” | R5 `key=017-part` / `accA.json`：仅记录操作列固定；缺 1920 腿与新增按钮位置 | `s2-list` 两视口 `structure.addBtn.right == toolbarRight`（1440：1368/1368；1920：1848/1848）；`batchAbsence` 五项全 `false`；`rowClick`：首击 `[1]`→再击同 `[]`→击他行 `[3]`（**唯一一行**固定） | BLOCKED→**PASS** | 新增按钮最右、批量入口/占位与“已选择”提示均不存在、单行固定选中切换（含再击取消、转移）在**两视口**实测成立 |
| **088** | 存在 `FG_ACTIVE` 非 `'0'/'1'` 记录；1440/1920 观察；`异常：{原始值}` 紧跟 ID、原样字符串、可读对比度、不只靠颜色；该行下拉只含“删除/停用”、无“启用”；不挤压操作列 | R5 `key=088` / `accA.json`：1 条异常样本 shown==api；缺 1920 腿 | `s2-list`：异常标记 `color=rgb(185,28,28)`、`fontWeight=700`、`contrastVsWhite=6.47`、`gapFromIdRight=6`、`insideRow=true`、`overlapsActionCell=false`；`abnormalRowMenu.itemTexts=["停用","删除"]`（两视口）；`s2-fg`：两视口 `allMatch=true`、`apiAbnormalCount=1`、`abnormalRowsFound=1` | BLOCKED→**PASS** | 界面显示值 `异常：{原始值}` 与只读 GET 的 `fgActive` 原值逐行一致（两视口）；红色+字重+对比度 6.47 不只靠颜色；菜单仅“停用/删除”；不覆盖操作列 |
| **092** | 存在含多数据源、**超长 ID**、**超长描述**、异常数据源记录；行高与参考页一致、公共层未新增行高令牌、**新增/编辑弹窗内表格行高不受影响** | R5 `key=092` / `accG.json`：仅 1440、行高由内边距外推 | `s2-dialog` `ac092`：`create.dialogHasInnerTable=false`；`s2-list` `rowHeightHistogram={48:15,52:1}` | BLOCKED→**BLOCKED** | 弹窗内表格腿**空真**成立；但**前置样本缺失**——当前 `maxClientIdLen=19`、`maxDescLen=152`，无“超长 ID/描述”样本；参考页行高与本轮 1920 腿亦未新增直接对照。**不**虚构样本、**不**翻状态 |
| **101** | 三点菜单柔和圆角/弥散阴影/内边距；条目 Hover 与**键盘焦点**反馈；分隔线隔开红色“删除”；删除红色且不只靠颜色 | R5 `key=101` / `accD.json`：无 Hover/焦点态 | `s2-list`：`popperBorderRadius=8px`、`popperBoxShadow=0 6px 16px rgba(0,0,0,.12), 0 2px 8px rgba(0,0,0,.06)`、`menuPadding=4px`、`itemPadding=6px 12px`；`menuHoverNonDanger` 启用 `bg=rgb(236,245,255)/color=rgb(64,158,255)`；`keyboardMenu.steps` 真实键盘焦点遍历“启用(蓝)/删除(红)”；`separatorCount=1`；`dangerColor=rgb(245,108,108)` | BLOCKED→**PASS** | 圆角/弥散阴影/内边距、Hover 与**真实键盘焦点**逐项过渡、1 条分隔线、删除红色语义，两视口一致 |
| **103** | 单击/双击三点触发器及菜单内交互**不冒泡**触发行双击编辑；删除/停用/启用二次确认、接口调用、行级忙碌与失败复位与 082/084 一致；忙碌期该行入口/条目禁用 | 五/六轮实现报告：事件隔离与行级忙碌实现 | `s2-list` `rowEventIsolation`：`singleClickTrigger`/`doubleClickTrigger`/`doubleClickMenuItem` 均 `editDialogOpened=false` | BLOCKED→**BLOCKED** | **只读隔离腿已覆盖**；但**写路径腿**（删除/停用/启用二次确认、接口调用、行级忙碌与失败复位）本轮**未执行**（属写授权），故保持 `BLOCKED` |
| **112** | 候选源较多、**超长机构名/超长 DATA_SOURCE_ID/含不可选原因**；可见高度适度增加；可选源横向略宽于已选；可读性改善；受控滚动仅限弹窗 | 三/五轮弹窗报告：双栏与滚动实现 | `s2-dialog` `sourcePanes`：`optionsWiderThanChosen=true`（宽差 50.656px）、`optList.scrollable=true`、`overflowsDialog=false`、可选 13/禁用 12、原因色 `rgb(230,162,60)`、主/次字号 13/12px | BLOCKED→**BLOCKED** | 双栏配比、弹窗内受控滚动、原因可读性已观测；但**前置样本缺失**——`maxOrgLen=19`、`maxDsIdLen=32`，无“超长机构名/超长 ID”样本，`SM` 缺口未闭合 |
| **115** | 主提交按钮正常 `#09090b`/白字/6px/500；Hover/聚焦 `#27272a`、按下 `#18181b`；仅 submitting 时不可重复提交并加载反馈、不蓝黑跳色；非常态仍黑；取消/自动生成/修改 ID 未变黑；**含“发起保存并在请求处理中再次点击”** | 六轮实现报告：按钮视觉 | `s2-dialog` `create.submitStates`：normal `rgb(9,9,11)`/白/6px/500，hover `rgb(39,39,42)`，pressed `rgb(24,24,27)`，focusTab `rgb(39,39,42)`；`secondary.cancel/autogen` 白底非黑；`edit.idToggleStyle` 透明底蓝字；两视口一致 | BLOCKED→**BLOCKED** | **只读视觉腿已覆盖**（正常/悬停/按下/键盘焦点、次要按钮未变黑）；但**`submitting` 加载态与“请求处理中再次点击”属写路径**，本轮**未执行**，保持 `BLOCKED` |
| **124** | 可触发至少一项业务错误；未选→选中 1→全部取消→提交红色错误→修正消除，逐步记录弹窗底边与底部按钮纵坐标；新增/编辑各一次；反馈区预留稳定空间、不跳动、两模式一致 | 四轮校验实现报告 | `s2-dialog` `ac124_create`/`ac124_edit`（3 视口）：create `S0~S4` 弹窗底边**唯一值**、footer 按钮 `y` **唯一值**；edit `E0~E3` 同；create S3 `errCount=2`、edit E2 `errCount=1`，修正后归 0；`sourceFeedback` 提示/错误 tone 切换 | BLOCKED→**PASS** | 五步序列在新增与编辑**两模式**、**三视口**均执行；弹窗底边与底部按钮纵坐标**零跳动**（每模式唯一值）；错误出现/消除、反馈空间稳定；两模式共用同一弹窗与布局 |
| **130** | 可粘贴大段文本；≤256 字符、按 Unicode 完整字符计数（256 汉字允许）；手输/粘贴同一限制；截断不拆代理对、不产生半个字符；提示文案“最多 256 个字符” | 四轮校验实现报告 | `s2-dialog` `ac130`（3 视口）：300 汉字→`codePoints=256`/`utf16=256`；256 汉字→256/256；混合 200 汉字+100 Emoji→`codePoints=256`/`utf16=312`、`lastCodePoint=128512`、`lastIsLoneSurrogate=false`；边界 255 汉字+Emoji→256cp/257utf16 未拆对；手输 258 汉字→256cp；`placeholder="探针用途描述（最多 256 个字符）"`；`maxlength=null` | BLOCKED→**PASS** | 完整字符计数、Emoji/代理对不拆、256 边界允许、手输与粘贴同一限制、提示文案，均三视口实测 |
| **136** | 已进入 `/config/client`；可访问参考页 `/config/data-source`（只读对照，不修改）；桌面+窄视口打开新增/编辑；测宽度/安全边距、标签右缘与控件左缘约 12px、控件左右边界、字号/字重/颜色/红星、是否写死单框宽度；沿用同弹窗、约 900px、未扩大、页面作用域、无全局/单框固定宽 | 五轮间距实现报告；CEDVT 首接入报告（`/config/data-source` 零挂载且未变，跨页前置复用） | `s2-dialog` `create.labels`/`edit.labels`（3 视口）：三项标签 `14px/500/rgb(63,63,70)`、红星 `"*"`/`rgb(245,108,108)`/`textAlign=right`；`gapLabelRightToControlLeft=12`；`ctrlLeft` 三项一致（桌面 382）、`ctrlRight` 1154；`inputInlineStyleWidth=""`；create==edit；弹窗桌面 900、窄视口 852（=900−48 安全边距） | BLOCKED→**PASS** | 桌面 900/窄视口安全边距、12px 标签间距、控件左右边界对齐、字号/字重/颜色/红星、无单框固定宽、页面作用域，三视口实测；跨页前置按指令**复用历史证据**（CEDVT 首接入已核实参考页零挂载且未变） |
| **151** | 主确认按钮黑底白字；正常/悬停/按下/键盘焦点可辨、可访问、无蓝底或蓝黑跳色；文案“启用”、取消“取消”；**单击确认后先关闭再调启用接口、一次确认只写入一次** | 六轮实现报告：确认框视觉 | `s2-confirm`（两视口）：启用框 title `启用探针`、`bodyMasked="确定启用探针 <ID> 吗？"`、按钮 `[取消,启用]`；停用框 `[取消,停用]`；主按钮 true resting `rgb(9,9,11)`/白/6px/500、hover `rgb(39,39,42)`、pressed `rgb(24,24,27)`、focusTab `rgb(39,39,42)`（无蓝底）；取消后 `nonGetAttempts=0` | BLOCKED→**BLOCKED** | **只读视觉/文案腿已覆盖**（各态可辨、无蓝黑跳色、文案正确）；但“单击确认后调用启用接口、一次确认只写一次”属**写路径**，本轮**未执行**，保持 `BLOCKED` |

> **AC-130 输入方式说明（如实记录，避免夸大）**：`t_300han`/`t_256han`/`t_mixed`/`t_boundary` 由**单次整段插入**驱动（`page.fill`，触发一次粘贴式 `input` 事件；未使用系统剪贴板、未发送真实 `Ctrl+V`）；`t_handType` 由**真实逐键输入**驱动（`page.keyboard.type`，258 汉字）。两者经同一受控 setter，均截断至 `codePoints=256` 且 `hasLoneSurrogateAnywhere=false`，故“手输/粘贴同一限制、大段文本整段接收、不拆代理对”成立；「可粘贴」按上述**单次整段插入**口径证据化，不宣称已做系统剪贴板级粘贴。

---

## 4. 状态变更汇总

| 项 | 值 |
|---|---|
| `changed_ids` | `[CCFG-AC-009, CCFG-AC-017, CCFG-AC-088, CCFG-AC-101, CCFG-AC-124, CCFG-AC-130, CCFG-AC-136]` |
| 上调（BLOCKED→PASS） | **7** 条：`009 / 017 / 088 / 101 / 124 / 130 / 136` |
| 保持 BLOCKED | **5** 条：`092`（超长 ID/描述样本缺失）、`103`（写路径腿）、`112`（超长机构名/ID 样本缺失）、`115`（`submitting` 加载态与写步骤）、`151`（确认写路径腿） |
| 变更后四态 | `PASS` **78** / `FAIL` **0** / `BLOCKED` **64** / `NOT_RUN` **15** = **157** |
| `FAIL` | **0**（本轮**未**发现产品反例，**不**新增 `FAIL`） |

> **逐条状态仅在“全部现行有效前置/步骤/预期均被历史与本轮实际证据逐项覆盖”时上调**；缺关键腿的 5 条维持 `BLOCKED`，**不**把模拟/DOM 强制造出的状态报成真实页面验收。

---

## 5. 新增证据键明细（可复核）

| 证据键 | 文件 | 关键取值 |
|---|---|---|
| `structure.headers` / `hasStatusColumn` / `headersRightmost` | `s2-list-results.json` | 六列精确；无状态列；最右“操作”（两视口） |
| `structure.addBtn` / `batchAbsence` | `s2-list-results.json` | `right==toolbarRight`；五项缺失断言均 `false` |
| `dataSourceColumn[*].allVisibleTagsMatchOrgWhereOrgExists` | `s2-list-results.json` | 有机构名时可见标签全部匹配机构名（两视口） |
| `idMarkers[*].abnormal` | `s2-list-results.json` | `rgb(185,28,28)`/`700`/`contrast=6.47`/`gap=6`/`overlapsActionCell=false` |
| `abnormalRowMenu` / `menuHoverNonDanger` / `keyboardMenu` | `s2-list-results.json` | `["停用","删除"]`；hover 蓝；键盘焦点蓝/红；`separatorCount=1` |
| `rowClick` / `rowEventIsolation` | `s2-list-results.json` | 单行固定切换；三点/条目交互 `editDialogOpened=false` |
| `viewports.*.allMatch` | `s2-fgactive-results.json` | 两视口 `true`；`apiAbnormalCount=1` |
| `ac124_create` / `ac124_edit` | `s2-dialog-results.json` | 各状态弹窗底边/footer `y` 唯一值；错误计数 S3=2、E2=1 |
| `ac130.*` | `s2-dialog-results.json` | 256 完整字符、`utf16=312`、`lastCodePoint=128512`、不拆代理对 |
| `create.labels` / `edit.labels` / `sourcePanes` | `s2-dialog-results.json` | 14px/500/#3f3f46、星号红、gap=12、左右边界对齐、无内联宽 |
| `submitStates` / `secondary` / `idToggleStyle` | `s2-dialog-results.json` | #09090b→#27272a→#18181b；次要按钮非黑 |
| `ac092` | `s2-dialog-results.json` | `dialogHasInnerTable=false` |
| `enableBox` / `enablePrimary` / `disableBox` | `s2-confirm-results.json` | 标题/正文/按钮；#09090b→#27272a→#18181b；无蓝底 |

---

## 6. 边界、未执行项与合规声明

- **零业务写入**：4 个探针**所有视口**非 GET 拦截计数均为 `0`，无请求到达后端写接口；**未**提交有效新增/编辑表单、**未**点击启用/停用/删除最终确认、**未**直调写接口、**未**建夹具、**未**改库或写 ZooKeeper/Kafka、**未**执行历史 W1~W8。
- **未跨页**：**未**访问 `/config/data-source` 或任何其他功能页面；`CCFG-AC-136` 的跨页前置按指令**复用已入仓历史证据**（CEDVT 首接入报告已核实参考页零挂载且未变），本轮**未**新采集跨页证据、**未**请求跨页授权。
- **未改产品**：**未**改产品源码、测试、共享 CSS、两套模板基线、其他功能文档、历史报告与该链既有证据、`docs/baseline/` 六份正式项目级基线、`docs/prompts/**`、`runtime-logs/**`、`.claude/**`。
- **未执行（保持 BLOCKED 的原因）**：`092`/`112` 缺超长样本（`SM`）；`103`/`115`/`151` 缺写路径腿（`WA`，`115` 含 `submitting` 加载态与“请求处理中再次点击”）。这些**不**通过模拟服务响应或 DOM 强制造假状态。
- **不等同整体验收**：本轮**仅**最小变更 7 条状态格；**不**表示 157 条整体正式验收通过、**不**构成写授权、**不**批准其他页面接入或迁移。

---

## 7. 核验命令与结果

```bash
cd /agent/cdc-config-platform
git rev-parse HEAD; git rev-parse origin/develop; timeout 30 git ls-remote origin refs/heads/develop   # 三方一致
git status --short                                                                                    # 白名单差异
git diff --check                                                                                      # 无空白错误
# 状态统计与编号连续性（脚本可复算）
python3 - <<'PY'
import re
t=open('docs/features/client-config/ACCEPTANCE.md').read()
rows=re.findall(r'^\| (CCFG-AC-\d{3}) \| (PASS|FAIL|BLOCKED|NOT_RUN) \|', t, re.M)
ids=[int(i.split('-')[-1]) for i,_ in rows]
print('rows',len(rows),'continuous',ids==list(range(1,len(rows)+1)),'unique',len(set(ids))==len(ids))
from collections import Counter; print(Counter(s for _,s in rows))
PY
# 证据非 GET 拦截计数（应全为 0）
node -e 'for(const f of ["s2-list-results","s2-dialog-results","s2-fgactive-results","s2-confirm-results"]){const d=require("./docs/features/client-config/reports/evidence/CLIENT-CONFIG-TARGETED-READONLY-ACCEPTANCE-SUPPLEMENT-002/"+f+".json");console.log(f,d.writeInterception.nonGetAttempts)}'
# 脱敏扫描（业务 ID/机构名）
grep -rInE 'hosp-[0-9]|机构|有限公司|DATA_SOURCE_ID[^"]*[A-Za-z0-9]{12}' docs/features/client-config/reports/evidence/CLIENT-CONFIG-TARGETED-READONLY-ACCEPTANCE-SUPPLEMENT-002/ || echo NO_BUSINESS_DATA
```

**结果**：base 三方一致；白名单差异仅本报告、证据目录与 `ACCEPTANCE.md`/`README.md` 的最小同步；`git diff --check` 无输出；157 行编号连续唯一、四态合计 157；四探针非 GET 拦截计数均为 `0`；脱敏扫描无真实业务数据命中。

**构建 / 测试 / 浏览器**：未改产品代码、测试或 CSS；后端/前端构建与测试按 `CLAUDE.md` §15/§16/§17 记 **`NOT_APPLICABLE`**。浏览器为**真实运行页面**只读探针（非 `NOT_RUN`）。

---

## 8. 任务结果与变更清单

| 项 | 值 |
|---|---|
| 任务编号 | `CLIENT-CONFIG-TARGETED-READONLY-ACCEPTANCE-SUPPLEMENT-002` |
| 分支 | `develop` |
| `base_commit_id` | `d925899e9072acf5f5e4146e1a5fcdef566486fa` |
| `result_commit_id` | 本任务单一提交（SHA 见 `AGENT_TASK_RESULT` 块） |
| 路由与授权边界 | **仅** `/config/client`；零业务写入；**不**构成写授权或整体验收结论 |
| 本轮统计 | `PASS` **78** / `FAIL` **0** / `BLOCKED` **64** / `NOT_RUN` **15** = **157** |
| `changed_ids` | `[CCFG-AC-009, CCFG-AC-017, CCFG-AC-088, CCFG-AC-101, CCFG-AC-124, CCFG-AC-130, CCFG-AC-136]` |
| 保持 BLOCKED | `CCFG-AC-092 / 103 / 112 / 115 / 151` |
| 下一入口 | `CHATGPT_REMOTE_CLIENT_CONFIG_TARGETED_READONLY_ACCEPTANCE_SUPPLEMENT_002_REVIEW` |

**变更文件（本任务明确授权范围内的路径）**：

- `docs/features/client-config/reports/CLIENT-CONFIG-TARGETED-READONLY-ACCEPTANCE-SUPPLEMENT-002.md`（**新增**，本报告）
- `docs/features/client-config/reports/evidence/CLIENT-CONFIG-TARGETED-READONLY-ACCEPTANCE-SUPPLEMENT-002/`（**新增**：4 个探针脚本、4 个脱敏结果 JSON、`env-and-version.txt`、`README.md`、`SHA256SUMS.txt`）
- `docs/features/client-config/ACCEPTANCE.md`（**必要最小**：7 条 §4 状态格 `BLOCKED→PASS`；新增 §1.27 状态块）
- `docs/features/client-config/README.md`（**必要最小**：新增本轮状态块、导航与现行下一入口）

**未变更**：产品源码、测试、共享 CSS、两套模板基线、`REQUIREMENTS.md`/`DESIGN.md`/`UI.md`/`API.md`/`DATABASE.md`、历史报告与该链证据、`docs/baseline/` 六份正式项目级基线、`docs/prompts/**`、`runtime-logs/**`、`.claude/**`、参考页 `/config/data-source`。

**提交推送不等于本补测复审通过，也不等于 157 条整体验收通过或写授权。**
