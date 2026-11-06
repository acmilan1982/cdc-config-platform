# 探针端管理新增／编辑弹窗专项验收（005）

- 任务编号：`CLIENT-CONFIG-DIALOG-ACCEPTANCE-005`
- 基线：`9b1bf9f309b9a2afd635bb408b490f62546b2dff`（`develop`）
- 页面范围：仅 `/config/client`；未打开、操作或测试 `/config/data-source` 或其他功能页面
- 判定对象：`CCFG-AC-120`、`CCFG-AC-125`、`CCFG-AC-134`、`CCFG-AC-138`
- 证据目录：`reports/evidence/CLIENT-CONFIG-DIALOG-ACCEPTANCE-005/`
- 下一入口：`CHATGPT_REMOTE_CLIENT_CONFIG_DIALOG_ACCEPTANCE_005_REVIEW`

## 1. 结论

| AC | 判定 | 依据摘要 |
|---|---|---|
| `CCFG-AC-120` | **PASS** | 新增“创建”与编辑“保存”的常态/hover/focus/active 计算样式均符合已批准值；表单不完整时按钮可点击、点击显示字段错误且零非 GET；新增模式真实 5000 ms 延迟多时点采样显示忙碌态清楚可辨、无蓝黑跳色、重复点击零新增请求；编辑模式由 004-R1 真实 `PUT` 防重证据与固定提交 `242cc5c` 的编辑忙碌快照共同支持；参考页对照采用已入仓运行证据 |
| `CCFG-AC-125` | **PASS** | 真实后端 `40941` 长错误在 1440×900 与 1024×720 均完整换行可读；窄视口表单内部滚动 29px 后两行文字均在可视区（`narrowScroll.lines[].insideFormViewport` 均为 true）；错误盒底边 644.56px 比表单可视区底边 644.39px 低 0.17px，属错误盒几何、不影响两行文字可读；文档无异常横向溢出；窄视口弹窗可操作并可关闭 |
| `CCFG-AC-134` | **PASS** | 新增与编辑两种模式均完成键盘输入、真实粘贴、自动生成、取消全部、提交失败、修正、关闭重开；候选 API 与 DB 互证（夹具前 238=238、夹具后 239=239）；已分配提示、逗号禁选、选择顺序、编辑锁定语义成立；`POST /api/clients` 冲突 `40941`、成功 `200/200` 并独立回读；编辑保存复用 004-R1 的真实 `PUT` 证据；固定 Git 区间审计显示参考页/其他 Feature/全局组件/后端/DB 定义/两套模板全局状态未被改动 |
| `CCFG-AC-138` | **BLOCKED**（本地部分完成） | 同视口 6 步几何在 1440×900（展开/收起）与 1024×720（展开）均稳定，长错误完整可读，未发现固定弹窗高度或写死侧栏偏移；但“项目负责人已确认当前稳定状态的相同视口（含展开/收起侧栏）”这一前置在已入仓记录中无可追溯确认，故整项保留 `BLOCKED` |

- `changed_ids=[CCFG-AC-120, CCFG-AC-125, CCFG-AC-134]`；`CCFG-AC-138` 及全部非目标状态格不变。
- 统计由 `PASS 149 / FAIL 0 / BLOCKED 8 / NOT_RUN 0` 更新为 **`PASS 152 / FAIL 0 / BLOCKED 5 / NOT_RUN 0 = 157`**。
- `CCFG-AC-115` 既有 `PASS` 未重判。
- **本批通过 ≠ 远程复审通过 ≠ 157 条整体正式验收通过 ≠ Feature 正式接受；提交/推送成功不代表远程复审通过。**

## 2. 环境与执行边界

| 项 | 值 |
|---|---|
| 分支 / 基线 | `develop` / `9b1bf9f309b9a2afd635bb408b490f62546b2dff` |
| 后端 | 复用 PID `3215`，`*:8080`，`GET /api/clients?status=ALL` → 200 |
| 后端产物 | `target/cdc-config-platform-backend-1.0.0-SNAPSHOT.jar`，SHA-256 `efdbea827b6ab84dd47105d2cc130f0bc3c5b70dc78cc626b6421e1f9750a459` |
| 前端 | 复用 PID `3348`，Vite `0.0.0.0:5173`，`GET /config/client` → 200 |
| 浏览器 | Chrome for Testing `147.0.7727.15`（Playwright headless，chromium-1217） |
| 视口 / DPR / 缩放 | 1440×900、1024×720；DPR 1；100% |
| 侧栏状态 | 展开 / 收起（仅 AC-138 几何序列） |
| 数据库计数 | 夹具前 90 探针 / 268 源 / 238 资格；最终 92 探针 / 273 源 / 239 资格 |
| 服务入口 | `http://192.168.174.70:5173/config/client` |
| 停止命令 | `kill 3348 3215` |
| 未做 | 未构建、未重启/启停服务、未改产品源码/测试/依赖/模板/配置、未跑全量测试/lint、未操作 ZK/Kafka、未连接源库、未访问其他页面 |

网络门禁在首次导航前安装：只读探针拒绝一切非 GET/HEAD/OPTIONS 业务请求并计数（实测 `nonGetAttempts=0`）；写探针仅放行两类精确 `POST /api/clients`（合成 `CCFG005-NEW` + 校验过的 `dataSourceIds`），成功类延迟 5000 ms 以形成忙碌窗口，最终运行 `aborted=[]`。受控注入仅为网络层延迟，未伪造请求体/响应，未修改 DOM/CSS。

## 3. `CCFG-AC-120`：主提交按钮外观与提交态

证据键：`A` = `results/probeA-readonly.json`（005 只读探针结果，基线 `85d0f61` 入仓），`B` = `results/probeB-write.json`（005 受控写探针结果，同一基线），`R1` = `reports/evidence/CLIENT-CONFIG-LIST-MENU-AND-ROW-HEIGHT-ACCEPTANCE-004-R1/results/r1b-write-dedup.json`（004-R1 入仓，基线 `11041911d05df65804aafd67ea9fa1cec03ce5db`），`E2` = 固定提交 `242cc5cf878216ef6e020effc539ee742c87a35c` 的 `reports/evidence/CLIENT-CONFIG-MULTI-AC-CRUD-AND-ABNORMAL-STATE-ACCEPTANCE-001/group-e-results.json`。

### 3.1 计算样式（创建“创建”与编辑“保存”分列）

| 子步骤 | 证据键 | 实测 |
|---|---|---|
| 创建常态 | `A.sections.ac120Create.normal` | 底色/边框 `rgb(9,9,11)`、文字 `rgb(255,255,255)`、圆角 `6px`、字重 `500`、`cursor=pointer` |
| 创建 hover | `A.sections.ac120Create.hover` | `rgb(39,39,42)` |
| 创建键盘 focus-visible | `A.sections.ac120Create.keyboardFocus` | `rgb(39,39,42)`、`focusVisible=true`、Tab 可达 1 次 |
| 创建按下 | `A.sections.ac120Create.active` | `rgb(24,24,27)`（mousedown/up 之间采样） |
| 编辑常态 / hover / focus / active | `A.sections.ac120Edit.normal/hover/keyboardFocus/active` | 与创建模式同值；按钮文字“保存” |
| 参考页对照 | `reference-evidence-index.md` §1 | 已入仓运行证据 `935478a` §3.3 同值；参考实现 `807a5a5` 起样式未变（blame 核对）；Chrome 148 vs 147 差异已记录 |

### 3.2 表单不完整时的可点击性

- 创建：`A.sections.ac120Create.preClickDisabled=false`；点击后显示“探针 ID 不能为空。”“探针描述不能为空。”与“至少选择 1 个数据源”，提交按钮仍可点击，`nonGetAttempts=0`。
- 编辑：`A.sections.ac120Edit.afterIncompleteClick` 显示描述字段错误，`nonGetAttempts=0`，按钮未被预先禁用。

### 3.3 忙碌态与防重复

**新增模式**（“创建”按钮）：

- `B.sections.busy` 是受控 5000 ms 网络延迟下的多时点快照（`gateDelayMs=5000`、`isRealHttpDelay=true`）。`B.sections.busy.snapshots` 在 129/557/2113/3656 ms 均显示 `el-button--primary is-disabled is-loading cc-dialog-submit ced-submit`、`spinnerCount=1`、底色/边框 `rgb(63,63,70)`、文字 `rgb(255,255,255)`、`cursor=not-allowed`、`pointer-events:none`；`distinctBackgrounds=['rgb(63,63,70)']`、`blueDetected=false`。
- 忙碌期真实鼠标重复点击命中 `.el-dialog__footer`；`B.sections.requestLedger` 中 `apiRequestMethods.POST=2`（冲突 + 成功），无额外请求；`B.sections.busy.successForwardedCount=1`；忙碌期已输入 ID 保持不变（`B.sections.busy.snapshots[2].typedWhileBusy.unchanged=true`）。
- 成功后对话框关闭，MutationObserver 捕获“新增成功”toast（`B.sections.busy.afterResponse.observedToasts`）。
- **边界**：5000 ms 是受控网络延迟注入；上述多时点采样只属于新增模式，编辑模式未执行同样的多时点采样。

**编辑模式**（“保存”按钮；并列两份已入仓证据）：

- ① `R1.flows.edit`（004-R1 真实延迟 `PUT`）：`busyState.submit.disabled=true`、`cls` 含 `is-disabled is-loading`、按钮文字“保存”；`duplicateAction` 的真实鼠标重复操作命中 `.el-dialog__footer`，其 `deltaAttempts` 中唯一一条 `PUT /api/clients/CCFG004-NEW1` 的时间戳 `1793883054470` **早于**重复点击时间戳 `1793883055183`，即它是已存在的首笔请求，不是重复动作新增的第二笔；`putCount=1`；`response` 200/200；`readback` 描述与数据源一致。
- ② `E2.ac115.submitting.inFlight`（固定提交 `242cc5c`）：`loadingVisible=1`、`textWhileLoading="保存"`、`style.backgroundColor/borderColor="rgb(63, 63, 70)"`、`style.color="rgb(255, 255, 255)"`、`disabledAttr=true`。该记录是编辑忙碌态快照，**不是**完整颜色时序。

**判定：PASS。** `CCFG-AC-115` 的既有 `PASS` 保留，不重判；其“提交处理中暂不可重复提交”口径与本条并存无冲突。

## 4. `CCFG-AC-125`：换行错误可读性与窄视口

真实错误来源：先由页面外真实 `POST /api/clients` 建立 `CCFG005-OCC1` 对合成源 `CCFG005-DS-LONG-0123456789ABCDE` 的占用，再由浏览器提交同一源，后端返回真实业务码 `40941`（未伪造长文本，未改 DOM/CSS）。

| 子步骤 | 证据键 | 实测 |
|---|---|---|
| 真实可触发长错误 | `B.sections.conflict` | 业务码 `40941`；文本与期望全文一致；归属“采集数据源”字段 |
| 正常视口换行可读 | `B.sections.conflict.wideBeforeScroll` | 1440×900：2 行，行宽 731.03 / 140.13；表单区 191.39–700.56（clientHeight 509、scrollHeight 509、scrollTop 0）；错误盒与两行文字均在表单可视区内（`pRect.bottom=700.56` 与 `form.bottom=700.56` 相同） |
| 无硬裁剪 | `B.sections.conflict.wideBeforeScroll.ancestors`、`B.sections.conflict.narrowBeforeScroll.ancestors`、`B.sections.conflict.narrowAfterScroll.ancestors`、`A.sections.layoutStatic` | 错误文本 `overflow=visible`、`overflow-wrap:anywhere`；直接反馈/控件祖先（`P`、`.cc-field-feedback`、`.cc-form-control`）均 `overflow=visible`。祖先链中确实存在滚动/溢出限制：`.cc-form`、`.el-overlay-dialog`、`.el-overlay`、`.content-area` 为 `overflow:auto`，`.main-layout` 为 `overflow:hidden`；这些限制未对两行错误文字造成硬裁剪：`narrowScroll.lines[].insideFormViewport` 两值均为 true（609.19–624.19、627.38–642.38）；错误盒底边 644.56px 比表单可视区底边 644.39px 低 0.17px，属错误盒几何而非文字可读性 |
| 窄视口可读（受控滚动） | `B.sections.conflict.narrowBeforeScroll` / `narrowScroll` / `narrowAfterScroll`（`form`、`pRect`、`lines`） | 1024×720：表单 164.39–644.39（clientHeight 480、scrollHeight 509、`overflowY=auto`）；滚动前错误盒 637.19–673.56，超出表单底边；`narrowScroll.formScrollTop=29` 后 `narrowScroll.lines[].insideFormViewport` 两值均为 true（609.19–624.19、627.38–642.38），两行文字完整可读；`narrowAfterScroll.lines[]` 只记录 `top/left/width/height`，无 `insideFormViewport`；`narrowAfterScroll.pRect.bottom=644.56` 比 `form.bottom=644.39` 低 0.17px |
| 无异常横向溢出 | `B.sections.conflict.wideBeforeScroll.doc`、`B.sections.conflict.narrowBeforeScroll.doc`、`B.sections.conflict.narrowAfterScroll.doc` | 1440：`scrollWidth=clientWidth=1440`；1024：`scrollWidth=clientWidth=1024`；两视口 `horizontalOverflow=false` |
| 窄视口可操作/关闭 | `A` 窄视口序列 + `closeDialogIfOpen` | 1024 下可选中/取消数据源、提交触发错误、点击“取消”关闭 |

表单为受控内部滚动（`.cc-form` 的 `overflowY=auto`），不构成整页横向溢出；两种视口的 `doc.horizontalOverflow` 均为 false，无文档级横向滚动。

**判定：PASS。**

## 5. `CCFG-AC-134`：新增／编辑全链与候选规则

### 5.1 两种模式矩阵

| 子步骤 | 新增证据键 | 编辑证据键 | 实测 |
|---|---|---|---|
| 键盘输入 | `A.sections.ac134Create.keyboard` | `A.sections.ac134Edit.keyboard` | 新增键入 `CCFG005-KB1`；编辑在弹窗的**描述框**清空后键盘输入（`action="clear textarea + keyboard.type(delay=10)"`），`descValue="CCFG005-NEW-EDIT-KB"`；该值写入描述草稿，未写入探针 ID 字段，不用于证明改名 |
| 真实剪贴板粘贴 | `A.sections.ac134Create.paste` | `A.sections.ac134Edit.paste` | `navigator.clipboard.writeText` + Ctrl+V；分别得到 `PASTE-005-描述样本`、`EDIT-PASTE-005`（非脚本赋值） |
| 自动生成与顺序 | `A.sections.ac134Create.autoGenerate/autoGenerateReverse` | `A.sections.ac134Edit.autoGenerate` | 新增 DS06→DS05 与反向，描述顺序与选择顺序一致；编辑顺序正确 |
| 取消全部 / 提交失败 / 修正 / 重开 | `A.sections.ac134Create.cancelAll/submitFailure/corrected/reopen` | `A.sections.ac134Edit.cancelAllSubmitFailure/corrected/reopen` | 中性提示 → 红色错误 → 修正清除 → 重开为空/恢复原值；各步 `nonGet=0` |
| 编辑锁定/解锁/再锁定 | — | `A.sections.ac134Edit.initial/unlocked/relocked` | `initial`：`idLocked=true`、`lockHint="（已锁定）"`、`toggleText="修改探针 ID"`、`idValue="CCFG004-NEW1"`；`unlocked`：`inputEditable=true`、`toggleText="取消修改"`、值保持 `CCFG004-NEW1`；`relocked`：`idLocked=true`、`toggleText="修改探针 ID"`、值仍为 `CCFG004-NEW1` |

### 5.2 候选资格与选择规则

- `A.sections.ac134Candidates`：API 总数 238、DOM 238；禁用 164（158 OCCUPIED + 6 COMMA）。
- 夹具前 `B.sections.setup.apiBeforeOccupation` 238 = DB 资格行 238；夹具后 239 = 239。
- 停用（`FG_ACTIVE=0`）、异常（`X`）、非 `SOURCE`、非 `ORACLE` 的 005 样本均不在候选 API。
- 已分配提示：`CCFG004-DS-A` 显示“已分配给：CCFG004-HOLDER”；`CCFG004-DS-B` 显示“已分配给：CCFG004-NEW1”；占用后 `occupiedByClientIds=['CCFG005-OCC1']`，`40941` 文案含 `CCFG005-OCC1`。
- `CCFG-AC-R1-COM,ID` 禁用，原因“ID 含英文逗号，不可选择”。
- `DS05/DS06` 可选，选择顺序与自动生成顺序一致。

### 5.3 保存接口与回读

- `B.gate.responses`：冲突提交 `POST /api/clients` → HTTP 200、业务码 `40941`；成功提交 → HTTP 200、业务码 `200`。
- 独立 `GET /api/clients?status=ALL` 回读 `CCFG005-NEW`：`fgActive=1`、`status=ENABLED`、`dataSources=[CCFG-AC-R1-DS06]`；列表行文本包含该 ID 与机构名。
- 必要 SELECT 核对 `CDC_CLIENT_MULTIPLE` 中 2 行合成探针与 `CDC_DATA_SOURCE` 中 5 个夹具。
- 编辑真实保存复用 `R1.flows.edit`：`PUT /api/clients/CCFG004-NEW1` 延迟转发，200/200，描述与数据源回读一致。

### 5.4 参考页与范围不变性

固定 Git 区间审计（探针 C，`results/ac134-git-audit.json`）区间 `3d4cec1^..9b1bf9f`，102 个 client-config 归属提交：

- `referencePageTouchedByClientConfig=[]`
- `otherFeatureTouchedByClientConfig=[]`
- `globalComponentsTouchedByClientConfig=[]`
- `backendOutsideClientConfigTouchedByClientConfig=[]`
- `dbDefinitionTouchedByClientConfig=[]`
- client-config 工作区相对基线的 `backend frontend` diff 为空

参考页运行时覆盖引用已入仓证据（`reference-evidence-index.md` §3），本任务未做跨页操作。共享模板路径仅含已批准的首次接入/收口文档与显式 opt-in 的限定 CSS，未新增全局令牌或全局覆盖。

**判定：PASS。**

## 6. `CCFG-AC-138`：弹窗稳定性与长错误

### 6.1 本地执行结果

| 条件 | 证据键 | 实测 |
|---|---|---|
| 1440×900，侧栏展开，6 步序列 | `A.sections.ac125Ac138.wide` | 高度恒 613.19、top 恒 135、提交按钮 y 恒 700.19；反馈 灰→隐藏→灰→红→隐藏；每步 `nonGet=0` |
| 1440×900，侧栏收起 | `A.sections.ac125Ac138.wideCollapsed` | 与展开态相同几何；无水平溢出 |
| 1024×720，侧栏展开 | `A.sections.ac125Ac138.narrow` | 高度恒 600.39、top 恒 108、提交按钮 y 恒 660.39；无水平溢出 |
| 长错误分支 | `B.sections.conflict` | 真实 `40941` 两行可读；窄视口受控滚动 29px 后两行文字均在表单可视区（`narrowScroll.lines[].insideFormViewport` 均为 true）；错误盒底边 644.56px 比表单底边 644.39px 低 0.17px |
| 固定高度/侧栏偏移 | `A.sections.ac125Ac138.*.fixedDialogHeightCss`、`dialogCentering.delta=0` | 高度内容驱动；水平居中 delta=0；未发现写死侧栏偏移 |

### 6.2 阻断原因

定义前置“项目负责人已确认当前稳定状态的相同视口（含展开/收起侧栏）”在 `ACCEPTANCE.md`、`README.md`、`REQUIREMENTS.md`、`DESIGN.md`、`UI.md` 与历史报告中的检索结果（`results/ac138-precondition-search.txt`）均未找到具体视口+侧栏组合的负责人确认记录。按任务规则，关键前置不足时整项保留 `BLOCKED`，本地几何与长错误证据不能替代该确认。

**最小补证条件**：由项目负责人明确确认当前稳定视口与侧栏状态组合（例如 1440×900 + 侧栏展开），并在该条件下重跑同一 6 步序列；本次 1440×900 展开/收起与 1024×720 的本地证据可作为补证基础。

**判定：BLOCKED（本地部分已完成）。**

## 7. 写入与夹具台账

详细记录见 `write-ledger.md` 与 `fixture-ledger.md`。

| 类别 | 数量 |
|---|---|
| 业务 API 非 GET 尝试（全部运行） | 10 |
| 其中真实成功写 | 6 |
| 其中真实后端预期拒绝 | 4 |
| 最终证据运行尝试 | 3（占用建立 200/200；冲突 200/40941；成功 200/200） |
| 前端零写（只读探针 A 非 GET） | 0 |
| 忙碌期重复点击新增请求 | 0 |
| 夹具 INSERT | 5 |
| 夹具 DELETE | 2（合计删除 4 行） |
| 夹具 DML 语句合计 | 7 |
| COMMIT（事务控制，不计入 DML） | 3 |
| 保留的合成数据源 / 探针 | 5 / 2 |

- 夹具 SQL 与被测业务写严格分开：5 个数据源由 SQL*Plus 写入，2 个合成探针由产品 API 写入。
- 受控注入仅 5000 ms 网络延迟；`40941` 为真实后端业务码，非伪造响应。
- 未执行 DDL；未对其他表执行 DML；未写 ZK/Kafka；未连接源库；未启停或操作运行侧进程。
- 测试数据按任务约定保留，不要求清理或恢复，不报告 `RESTORED`。

## 8. 验收定义完整性与 Git 检查

- `CCFG-AC-001~157` 共 157 条，编号连续且唯一；`CCFG-REQ-001~154`（154）、`CCFG-DESIGN-001~089`（89）、`CCFG-UI-001~077`（77）数量不变。
- 定义行与状态格仅 `CCFG-AC-120/125/134` 三个状态 token 由 `BLOCKED` 改为 `PASS`；其余非目标状态格不变；批准状态与基线状态不变。
- `CCFG-AC-138` 保持 `BLOCKED`；此前 004 批次保留的 `CCFG-AC-079/087/091/094` 未被本任务触碰。
- README 追加 005 入口段落，未改写历史统计。
- `git diff --check` 通过（无空白错误）。

## 9. 边界与限制

- 仅 `/config/client`；参考页条件仅来自可溯源的已入仓运行证据，未打开、操作或测试参考页或其他页面。
- 未改产品代码、测试、依赖、配置、模板或其他 Feature；未构建、未重启服务、未跑全量测试/lint。
- 证据均已脱敏：不含数据库凭据、真实连接信息、原始业务记录或整屏截图。
- Chrome 148（参考页已入仓证据）与 Chrome 147（本机实测）的版本差异已记录，计算样式值一致，不构成阻断。
- 窄视口可读性依赖表单受控内部滚动；这是已批准布局允许的行为，不视为异常横向溢出。
- 本地部分完成不等同于整项 `PASS`；`CCFG-AC-138` 仍需负责人确认前置。

## 10. 下一入口

`CHATGPT_REMOTE_CLIENT_CONFIG_DIALOG_ACCEPTANCE_005_R2_REVIEW`

## 11. R1 勘误记录（2026-11-06）

本次仅做文档/引用勘误与静态核验，未重跑探针、未调用业务 API、未读写数据库、未启停服务。判定维持：`CCFG-AC-120/125/134` PASS、`CCFG-AC-138` BLOCKED。

| 编号 | 旧写法 | 新写法 | 证据路径与键 |
|---|---|---|---|
| R1-01 | 将新增模式的 `B.sections.busy` 多时点采样视为已覆盖编辑模式；编辑忙碌态仅笼统“复用 004-R1” | 新增模式明确为 `B.sections.busy` 多时点采样（5000 ms 受控延迟）；编辑模式并列两份证据：`R1.flows.edit`（`busyState`/`duplicateAction`/`putCount`，`deltaAttempts` 首笔 PUT 时间戳早于重复点击，非第二笔）与 `E2.ac115.submitting.inFlight`（`loadingVisible=1`、底色/边框 `rgb(63,63,70)`、白字；仅为忙碌快照，非完整颜色时序） | `results/probeB-write.json → sections.busy`、`sections.requestLedger`；`...004-R1/results/r1b-write-dedup.json → flows.edit`；提交 `242cc5c` 的 `...MULTI-AC-CRUD.../group-e-results.json → ac115.submitting.inFlight` |
| R1-02 | `B.sections.conflict.ancestors`、`B.sections.conflict.doc`（不存在） | 改为各快照内的实际字段：`wideBeforeScroll/narrowBeforeScroll/narrowAfterScroll.ancestors` 与同名快照的 `.doc`；并如实记录祖先链存在 `.cc-form`/`.el-overlay*`/`.content-area` 的 `overflow:auto` 与 `.main-layout` 的 `overflow:hidden`；这些限制未对两行错误文字造成硬裁剪，错误盒底边 644.56px 比表单可视区底边 644.39px 低 0.17px（R2 进一步精确） | `results/probeB-write.json → sections.conflict.wideBeforeScroll/narrowBeforeScroll/narrowAfterScroll`（`.ancestors`、`.doc`、`.form`、`.pRect`、`.lines`） |
| R1-03 | “编辑解锁后键入 `CCFG005-NEW-EDIT-KB`” | 改为“在编辑弹窗的描述框清空后键盘输入”，值写入描述草稿，未写入探针 ID 字段，不用于证明改名 | `results/probeA-readonly.json → sections.ac134Edit.keyboard`（`action`、`descValue`）；锁定/解锁/再锁定另引 `initial`/`unlocked`/`relocked` |

勘误文件：本报告、`evidence/.../reference-evidence-index.md`、`evidence/.../four-item-matrix.md`、`evidence/.../SHA256SUMS`。原始 JSON、探针、SQL、台账与其他批次文件逐字节保留。

## 12. R2 勘误记录（2026-11-06）

本轮仅做 AC-125 窄视口证据表述修正与静态核验，未重跑探针、未调用业务 API、未读写数据库、未启停服务。`CCFG-AC-125` 维持 PASS；`CCFG-AC-138` 与 `CCFG-AC-079/087/091/094` 维持 BLOCKED。

| 编号 | 旧写法 | 新写法 | 证据路径与键 |
|---|---|---|---|
| R2-01 | 将 `insideFormViewport` 归到 `narrowAfterScroll.lines[]`，并暗示窄视口整个错误盒完全位于可视区 | `insideFormViewport` 仅存在于 `narrowScroll.lines[]`（两值均为 true，坐标 609.19–624.19、627.38–642.38）；`narrowAfterScroll.lines[]` 只记录 `top/left/width/height`，无该字段。表单滚动 29px 后两行文字完整可读；错误盒底边 644.56px，表单可视区底边 644.39px，低 0.17px | `results/probeB-write.json → sections.conflict.narrowScroll.formScrollTop`、`.narrowScroll.lines[].insideFormViewport`、`.narrowAfterScroll.lines[]`、`.narrowAfterScroll.pRect.bottom`、`.narrowAfterScroll.form.bottom` |
| R2-02 | 摘要、AC-125 表、R1 勘误说明及 AC-138 复用句中的“错误盒未截断/完整显示” | 区分错误盒几何与两行文字可读性：两行文字未被硬裁剪且均在表单可视区内；错误盒底边比表单可视区底边低 0.17px。正常视口与无整页横向溢出的既有结论保留 | 同上 |

勘误文件：本报告、`evidence/.../four-item-matrix.md`、`evidence/.../SHA256SUMS`。证据索引、原始 JSON、探针、SQL、台账、其他批次与 `ACCEPTANCE.md` 逐字节保留。
