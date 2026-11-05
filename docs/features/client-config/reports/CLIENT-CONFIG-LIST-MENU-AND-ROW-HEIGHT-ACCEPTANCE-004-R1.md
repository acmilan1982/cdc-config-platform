# 探针端管理列表、三点菜单与行高验收 R1 定向补证（004-R1）

- 任务编号：`CLIENT-CONFIG-LIST-MENU-AND-ROW-HEIGHT-ACCEPTANCE-004-R1`
- 基线：`11041911d05df65804aafd67ea9fa1cec03ce5db`（develop；本地/跟踪/远端一致）
- 复审区间：`968c1e57534d1fc6392ea499a0860a901fded6ab..11041911d05df65804aafd67ea9fa1cec03ce5db`，004 远程复审结论 `CHANGES_REQUIRED`
- 页面范围：`/config/client`（未访问或测试数据源管理及其他页面，未扩展跨页对照）
- 判定复核范围：`CCFG-AC-071`、`084`、`089`、`103`、`117`、`153`；另作行高样本与复用引用勘误
- 证据目录：`reports/evidence/CLIENT-CONFIG-LIST-MENU-AND-ROW-HEIGHT-ACCEPTANCE-004-R1/`
- 下一入口：`CHATGPT_REMOTE_CLIENT_CONFIG_LIST_MENU_AND_ROW_HEIGHT_ACCEPTANCE_004_R1_REVIEW`

## 1. 结论

| AC | R1 判定 | 调整 |
|---|---|---|
| `CCFG-AC-071` | **PASS（维持）** | 编辑补真实鼠标重复动作 + 零增量；删除补真实鼠标重复动作 + 零增量；创建/启停复用既有可归属记录 |
| `CCFG-AC-084` | **PASS（维持）** | 五类操作的取消/确认、单请求、失败复位与菜单隔离逐项对应，无新反例 |
| `CCFG-AC-089` | **PASS（维持）** | A/B 菜单隔离冲突已由残留节点判定语义解释；干净前置下删除项双击不打开编辑弹窗、不改变固定选中 |
| `CCFG-AC-103` | **PASS（维持）** | 按 AC-157 禁用态适用性说明，忙碌期禁用对象为菜单条目，三点触发器仍可点；004 报告“本行入口禁用”措辞已更正 |
| `CCFG-AC-117` | **PASS（维持）** | 方向键实测焦点落到“删除”（`role=menuitem`、`tabIndex=0`），字重/红字/分隔线/Hover/焦点样式逐项复核 |
| `CCFG-AC-153` | **PASS（维持）** | R1 菜单与双击补测期间固定选中无额外变化；其余重选/清除分支复用 004 与 AC-145 证据 |

- 六项均按 R1 证据重新判定，未以“维持 149 PASS”为前提；本轮未新增 FAIL，也未把可判定项降为 BLOCKED。
- 本批判定**未变更任何状态 token**：`changed_ids=[]`；四态统计仍 **PASS 149 / FAIL 0 / BLOCKED 8 / NOT_RUN 0 = 157**。
- `CCFG-AC-079/087/091/094` 保留 `BLOCKED`；`120/125/134/138` 留给弹窗专项，本轮未触碰。
- **本报告不宣布 Feature 正式接受；提交/推送成功不代表远程复审通过。**

## 2. 环境与执行边界

| 项 | 值 |
|---|---|
| 分支 / 基线 | `develop` / `11041911d05df65804aafd67ea9fa1cec03ce5db` |
| 后端 | 复用 PID 3327，`*:8080`，`GET /api/clients?status=ALL` → 200 |
| 前端 | 复用 PID 3385，Vite `0.0.0.0:5173`，`GET /config/client` → 200 |
| 浏览器 | Chrome for Testing 147.0.7727.15（Playwright headless，chromium-1217） |
| 视口 / DPR / 缩放 | 1440×900；DPR 1；100% |
| 只读门禁 | 首次导航前安装；GET/HEAD/OPTIONS 放行，其余 abort+计数；实测 **0** 非 GET |
| 写门禁 | 仅放行 `PUT /api/clients/CCFG004-NEW1`、`DELETE /api/clients/CCFG004-DEL2`，均延迟 5000ms 转发；其余非 GET abort+计数 |
| 未做 | 未构建、未重启/启停服务、未改产品源码/测试/依赖/模板/配置、未跑全量测试、未操作 ZK/Kafka、未连接源库、未访问其他页面 |

## 3. R1-01：A/B 菜单隔离冲突解释（AC-089、103、153）

### 3.1 原始证据与矛盾

- A：`evidence/...-004/results/readonly-geometry.json` → `interactions.menuIsolation`：
  - `menuOpen={open:true,items:["启用","删除"]}`、`dlgAfterMenu=true`、`confirmOpened=false`、`fixedBeforeMenu=1`、`fixedAfterMenu=1`、`nonGetAttempts=0`。
- B：`evidence/...-004/results/readonly-menu-keyboard.json` → `eventIsolation`：首项为“启用”，条目双击后 `open=false`，`fixed=0`（无编辑弹窗、无固定变化）。
- A 探针源码 `evidence/...-004/probes/probeA-readonly.cjs`：
  - 在进入菜单前先用 `.cc-dialog .el-dialog__headerbtn` 关闭编辑弹窗，但关闭调用为 `.catch(() => {})`，未验证关闭结果；
  - `dlgAfterMenu` 判定为 `!!d && getComputedStyle(d).display !== 'none'`，只读取第一个 `.cc-dialog` 的 `display`；
  - 删除项双击调用亦为 `.dblclick().catch(() => {})`，超时被吞掉。

### 3.2 根因定位（可复现）

R1A 复现 A 的完整序列（第 6/7 行编辑 → 关闭，第 8 行开菜单），结果 `results/r1a-readonly-desensitized.json`：

- `aSequenceReplication.step1_afterDblEdit`：`dialogCount=1`、`visibleDialogCount=1`，标题“编辑探针”，overlay `display:block`。
- `aSequenceReplication.step2_afterClose1`：关闭成功（`closeResult=ok`）后 **节点仍保留在 DOM**：`display=block`、`height=0`、overlay `display:none`、overlay height 0；`aStyleFirstDialog.display=block`。
- `aSequenceReplication.step4_afterClose2`：第二次编辑关闭后状态相同。
- `aSequenceReplication.step5_menu`：菜单展开时 `visibleDialogCount=0`，但残留节点仍为 `display=block`、`height=0`。
- `aSequenceReplication.step6_afterDeleteDbl`：`visibleDialogCount=0`、固定选中不变；同一 `dblclick` 调用在复现中直接 `TimeoutError`（原 A 探针将其吞掉）。

**结论**：`dlgAfterMenu=true` 是**未卸载但已隐藏的零高度 `.cc-dialog` 节点**触发的判定假阳性；它不代表存在可见编辑弹窗，也不是菜单点击的副作用。A 探针的 `display!=='none'` 判定不足；B 的“菜单交互不打开编辑弹窗”与之一致，并非互相矛盾。

### 3.3 干净前置下的只读补测

`results/r1a-readonly-desensitized.json`（`nonGetAttempts=0`）：

- 初始：`dialogCount=0`、`visibleDialogCount=0`、`fixed=[]`。
- 单点控制：打开 `CCFG004-DEL2` 菜单，单击“删除” → 出现确认框“删除探针 / 确定删除探针 CCFG004-DEL2 吗？该操作不可恢复。”，无 `.cc-dialog`；仅取消。
- 干净双击试次（`CCFG004-DEL2` 第 86 行、`CCFG004-OFF` 第 82 行）：
  - 元素命中为 `LI.cc-more-danger.el-dropdown-menu__item`（“删除”）；
  - 事件序列：`click`（菜单项）→ `click`（`.el-overlay-message-box`）→ `dblclick`（`.el-overlay-message-box`）；
  - 动作后 `visibleDialogCount=0`、`.cc-dialog` 节点数为 0、确认框关闭、`fixed=[]`；
  - 即：第一次点击打开删除确认框，第二次点击命中遮罩并按 `closeOnClickModal` 关闭确认框；全程无编辑弹窗、无固定选中变化、零写。
- 复现中另记录了 A 选择器直接 `dblclick` 的超时；未吞掉超时后把“无副作用”当作结论。

因此 AC-089/103/153 的“菜单交互不误开编辑、固定高亮不变”有干净前置实测支持；原 A 记录保留不改，语义由本节解释。

## 4. R1-02：五类操作忙碌与防重复矩阵（AC-071、084、103）

### 4.1 矩阵

| 操作 | 慢请求期间 UI 状态 | 实际重复动作（可归属） | 窗口写增量 | 首笔结果 | 成功/失败反馈与复位 | 证据 |
|---|---|---|---|---:|---|---|
| 新增 | 提交按钮 `is-disabled is-loading`，spinner 1 | 首笔后 +250ms 对同一按钮派发第二次 `click` MouseEvent（与 R1B 编辑同状态的按钮一致，`pointer-events:none`） | **0**（`writeCountForNew1=1`） | HTTP 200 / code 200 | Toast“新增成功”、弹窗关闭、行存在 `FG_ACTIVE='1'`、源 `CCFG004-DS-B` | `...-004/results/write-flows.json` `flows.ac071_create`；`probes/probeD-write.cjs` 第 276–307 行 |
| 编辑 | 同上（`is-disabled is-loading`） | 004：+200ms 合成 `click` 派发；R1B：+713ms **真实鼠标点击**按钮中心，`elementFromPoint` 命中 `FOOTER.el-dialog__footer`（按钮不可命中） | **0**（PUT 计数 1） | HTTP 200 / code 200 | Toast“编辑成功”、弹窗关闭、描述已落库 | `...-004/results/write-flows.json` `flows.ac071_edit`；R1 `results/r1b-write-dedup.json` `flows.edit` |
| 启用 | 菜单“启用/删除”均 `aria-disabled=true`、`is-disabled`、`cursor:not-allowed`；三点触发器 `ariaDisabled=null`、`pointerEvents:auto` | 窗口内对禁用条目执行 `li.click()`（DOM 点击） | **0** | HTTP 200 | Toast“启用成功”、固定选中按稳定 ID 重选、菜单复位为可点 | `...-004/results/write-timing-busy-toast.json` `flows.enable_slow`；`...-001/group-e-results.json` `ac140`（取消/成功/失败） |
| 停用 | 同上；其他行菜单保持可点 | 窗口内对禁用条目执行 `li.click()`（DOM 点击） | **0** | HTTP 200 | 行显示“停用”、固定选中保留、菜单复位；失败时“停用失败，请检查网络后重试。”并复位 | `...-004/results/write-timing-busy-toast.json` `flows.disable_slow`、`disable_failure`；`...-001/group-e-results.json` `ac139` |
| 删除 | 菜单“停用/删除”均 `aria-disabled=true`、`is-disabled`、`cursor:not-allowed` | R1B：确认后 600ms 重开菜单，对“删除”条目中心执行**真实鼠标点击**，命中 `LI.cc-more-danger.el-dropdown-menu__item.is-disabled`；菜单保持展开 | **0**（DELETE 计数 1） | HTTP 200 / code 200 | Toast“删除成功”、行移除、固定清空；失败时“删除失败，请检查网络后重试。”且行保留、菜单复位 | R1 `results/r1b-write-dedup.json` `flows.delete`；`...-004/results/write-timing-busy-toast.json` `flows.delete_failure`；`...-004/results/write-flows.json` `flows.ac071_delete_cancel`、`ac071_delete` |

补充：
- 编辑按钮忙碌态 `pointer-events:none` 来自 Element Plus `.el-button.is-loading`；因此真实坐标点击落到 footer，不能触发按钮。创建与编辑共用同一提交按钮与同一状态类，R1B 的坐标级结果对两者一致适用。
- 启停的重复尝试是禁用条目上的 DOM `click`；删除的同类禁用条目已由 R1B 用真实鼠标点击补证，二者为同一 `.el-dropdown-menu` 组件行为。
- 单笔请求计数未被单独用作“重复动作”的证明：每一行都记录了动作发生的时间点/命中元素（或派发方式）与窗口内计数。

### 4.2 取消、确认与失败分支

- 新增/编辑：确认只有一次提交；失败路径复用 `...-004/results/edit-failure.json` 与 AC-115 的提交加载/字段错误零写证据（`...-001/group-e-results.json` `ac115`、`ac115-supplement-results.json`：`writeCount=0`、字段错误 3 条、按钮保持可点）。
- 停用：取消零写（`write-flows.json` `ac084_disable_cancel` `writesDelta=0`）；成功单请求；真实网络失败提示并保留行/选中（`disable_failure`）。AC-139 提供可归属的取消、成功、失败三腿（`group-e-results.json` `ac139.cancel/success/failure`）。
- 启用：取消零写（`ac140.cancel.enableWrites=0`）；成功 `+1`；40941 业务拒绝保留原状态（`ac140.failure`）。现行基线按批准语义启用也弹确认，未沿用“启用一般不弹确认”的旧说法。
- 删除：取消零写（`ac071_delete_cancel` `writesDelta=0`，行保留）；成功单请求并清选；失败提示、行保留、菜单复位（`delete_failure`）。AC-145 `b1–b6` 覆盖停用成功后重选、过滤后清空、启用取消、启用 40941 失败保留、删除成功清空、删除取消/失败保留。
- 受控网络中断只用于失败复位分支，未被表述为真实业务拒绝；真实业务拒绝引用 40940/40941 实测（`write-flows.json` `ac072_40940`、`ac072_40941`）。

### 4.3 AC-103 与 AC-157 禁用态适用关系

- AC-103 定义原文（`ACCEPTANCE.md` 第 911 行）：“行级忙碌期间该行入口/对应条目禁用、不重复提交，其他行不受影响”。
- AC-157 已生效适用性说明（`ACCEPTANCE.md` 第 966 行，**2026-11-03 生效**）原文要点：“当前**三点触发器本身没有业务禁用条件**；行级忙碌时被禁用者是**下拉菜单项**（条目 `disabled`），**菜单项禁用不等于触发器禁用**，**不得**人为制造触发器禁用场景。故触发器 `disabled` 子项当前**记为不适用**；**不能仅凭该子项不适用判整条 `PASS`**，也**不构成整条永久禁止 `PASS`**——其他全部适用要求被覆盖后，由**未来独立验收任务**判定。”
- 实测：忙碌期菜单条目 `aria-disabled=true`、`is-disabled`、`cursor:not-allowed`，点击零增量；三点触发器 `ariaDisabled=null`、`pointerEvents:auto`、`cursor:pointer`。
- 适用口径：现行基线要求且可评价的是“对应条目禁用”；“入口（触发器）禁用”按 AC-157 不适用，且不得人为制造。实际行为与现行基线一致，**不构成反例**。
- 004 报告 `...-004.md` 第 60 行“行级忙碌仅禁本行入口/条目”已定向更正为“仅禁用本行下拉菜单条目，三点触发器仍可点”，并注明 AC-157 依据；验收定义与 AC-157 说明本身未改。

## 5. R1-03：删除项键盘焦点（AC-117）

证据：`results/r1a-readonly-desensitized.json` → `focus`（`nonGetAttempts=0`；Esc 关闭，未确认删除）。

- 焦点入口：对 `CCFG004-ON` 的三点触发器聚焦后按 Enter 打开菜单，焦点落在首项“启用”（`role=menuitem`、`tabIndex=0`）。
- 方向键：按一次 ArrowDown，`document.activeElement` 变为“删除”：
  - `tag=LI`、`role=menuitem`、`class="cc-more-danger el-dropdown-menu__item"`、`tabIndex=0`；
  - 计算样式：`background-color=rgb(236,245,255)`、`color=rgb(245,108,108)`、`outline-style=none`；
  - 其后 ArrowDown 在启用/删除间循环，菜单保持展开。
- 对比样式：启停条目与删除条目 `font-weight` 均为 **400**；删除为红字 `rgb(245,108,108)`；分隔线 `1px solid rgb(235,238,245)`、`margin-top=4px`、高 1；删除项实际悬停背景/文字同为 `rgb(236,245,255)` / `rgb(245,108,108)`。
- 焦点与悬停区分：键盘遍历前鼠标已移开菜单；键盘焦点态与真实悬停态颜色一致；另以 `element.focus()` 做 DOM 聚焦对照（`tabIndex=-1`）亦呈同色，说明颜色相同，但键盘路径本身确已把焦点放到删除项（`tabIndex=0`）。
- Tab 离开菜单回到三点触发器，Shift+Tab 到行 ID 并关闭菜单；随后重新打开菜单，未触发删除确认。真实删除确认与业务语义继续引用已入仓证据（004 `write-flows.json` `ac071_delete*`、R1 `r1b-write-dedup.json` `flows.delete`），未为焦点再删一条。

## 6. R1-04：行高与复用引用勘误

### 6.1 行高（保留原测值，不重跑）

`...-004/results/readonly-geometry.json` `viewports.<1440x900|1920x1080>.rowHeightSummary`：

- 两视口各 `sampleCount=89`，高度分布均为 **84 行 48px + 5 行 52px**；
- 5 条行级提示样本 `SAMPLE-01..05`：`rowH=52`、`rowbadH=27`；
- `normalMaxAbsDiff=0`、`normalOverOnePx=[]`。
- 1024 字符描述样本 `SAMPLE-30`：`rowH=48`、`desc.len=1024`、`clientWidth=276`、`scrollWidth=9562`、`truncated=true`、`textOverflow=ellipsis`；它是**超长内容自适应观察样本**，**不是** 52px 行。
- 004 报告 AC-155 行原“异常/歧义与超长内容组为 52”易被读成 1024 字符样本为 52；已定向更正为“84×48 + 5×52（行级提示 27）；1024 字符样本为 48，仅作超长观察”。

### 6.2 E5 参考口径

`...-001/row-height-results.json`（E5，提交 `d93f838`/`aa942dc`）：

- `before.datasource_1440x900`、`before.datasource_1920x1080` 各 `rowCount=36`，全部 `rowH=48`；环境 `DPR=1`、缩放 `100%`、同两视口。
- 该文件只用于**行高参考**；不扩大为其他视觉属性已对照。004 与本 R1 的 52px 行是行级提示自适应，与参考页 48px 常规行不冲突。

### 6.3 E1 引用勘误

原 `...-004/reference-evidence-index.md` 将 AC-082/115/121/139/140/145 笼统指向 `group-b-results.json`，不准确。核对后的真实键位：

| AC | 文件 | 键 |
|---|---|---|
| AC-121 | `...-MULTI-AC-CRUD-AND-ABNORMAL-STATE-ACCEPTANCE-001/group-c-results.json` | `ac121` |
| AC-082 | `...-001/group-d-results.json` | `ac082` |
| AC-115 | `...-001/group-e-results.json` | `ac115`（另有 `ac115-supplement-results.json`） |
| AC-139 | `...-001/group-e-results.json` | `ac139` |
| AC-140 | `...-001/group-e-results.json` | `ac140` |
| AC-145 | `...-001/group-f-results.json` | `ac145` |

`group-b-results.json` 实际键为 `ac039/ac054/ac060/ac040`，不含上述六个 AC。索引已按上表更正；原结果 JSON、探针运行记录与历史事实未改。

## 7. 请求、注入与 DML 台账（R1 新增）

| 类别 | 数量 | 说明 |
|---|---:|---|
| 浏览器非 GET 尝试 | 2 | `PUT /api/clients/CCFG004-NEW1`、`DELETE /api/clients/CCFG004-DEL2` |
| 放行 | 2 | 均延迟 5000ms 后单次转发 |
| 受控注入 | 0 | — |
| 前端拦截 | 0 | — |
| 后端成功 | 2 | 均 HTTP 200 / code 200 |
| 用户取消且零写 | 1 | R1A 单击删除打开确认框后仅取消（Esc），未点最终删除；R1B 写阶段无取消 |
| DML | 2 | 1 UPDATE（描述）+ 1 DELETE（合成行）；DDL 0；其他表 0 |
| 新增夹具 | 0 | 复用既有合成探针 |

- 独立回读：执行前 91 行；执行后 90 行。`CCFG004-NEW1` 描述为 R1 合成文本、`FG_ACTIVE='0'`、源仍为 `CCFG004-DS-B`；`CCFG004-DEL2` 不存在。
- 白名单绑定：方法 + 精确路径（路径参数即完整目标 ID）；编辑表单只改描述，`ClientSaveRequest` 其余字段沿用原值；脚本未逐字段记录请求体，此为已知边界。
- 样本按授权保留；`CCFG004-DEL2` 的删除是真实删除流程的预期结果，不属于事后清理。

## 8. 复用、补测与剩余缺口

- **复用**：004 的 `readonly-geometry.json`、`readonly-menu-keyboard.json`、`write-flows.json`、`write-timing-busy-toast.json`、`edit-failure.json` 及 A–I 探针；E1 的 `group-c/d/e/f-results.json` 与 `ac115-supplement-results.json`；E5 的 `row-height-results.json`（仅行高）。
- **补测**：R1A 只读（0 写）解释菜单隔离与焦点；R1B 写（2 笔）补编辑/删除的真实鼠标重复动作与零增量。
- **未重跑**：004 全部 18 项、行高、响应交错、跨页对照、弹窗专项均未重跑；AC-089/153 的其他分支继续引用 004 与既有真实验收。
- **剩余缺口**：`CCFG-AC-079/087/091/094` 仍为 `BLOCKED`（缺参考页同条件运行时证据）；AC-157 触发器 `disabled` 子项按适用性说明记为不适用，本条整条判定仍由未来独立验收任务负责。R1 未发现六项目标的明确反例，也未新增无法归属的证据。

## 9. 校验与 Git

- 157 个连续唯一 ID、原定义行、非目标状态复核通过；四态统计 `PASS 149 / FAIL 0 / BLOCKED 8 / NOT_RUN 0 = 157`。
- 004 报告与参考索引为定向文字更正；原结果 JSON、探针运行记录未改；受修改文件的校验和已更新，其余条目保留。
- 证据目录含 `SHA256SUMS`；提交前逐文件计算校验和。
- `git diff --check` 通过；按路径暂存、单次提交、普通快进推送；结果提交 SHA 与远端 SHA 见执行回报，不在本报告预填。
