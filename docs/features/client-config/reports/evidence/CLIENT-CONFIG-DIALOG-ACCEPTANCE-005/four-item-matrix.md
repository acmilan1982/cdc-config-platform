# 005 四项判定矩阵（AC-120 / 125 / 134 / 138）

判定口径：全部适用条件有证据才 PASS；直接反例 FAIL；关键前置或证据不足保留 BLOCKED。
证据键前缀：`A` = `results/probeA-readonly.json`，`B` = `results/probeB-write.json`，`C` = `results/ac134-git-audit.json`。

## CCFG-AC-120 — 主提交按钮外观与提交态

| 子步骤 | 证据键 | 实测 | 判定 |
|---|---|---|---|
| 创建常态 | `A.sections.ac120Create.normal` | `rgb(9,9,11)` 底/边框、`rgb(255,255,255)` 字、`6px`、`500`、`pointer` | PASS |
| 创建 Hover / 键盘 focus-visible / 按下 | `A.sections.ac120Create.hover` / `keyboardFocus` / `active` | `rgb(39,39,42)` / `rgb(39,39,42)`+`focusVisible=true` / `rgb(24,24,27)` | PASS |
| 编辑常态 / Hover / focus / 按下 | `A.sections.ac120Edit.normal/hover/keyboardFocus/active` | 同创建模式；按钮文字“保存” | PASS |
| 表单不完整仍可点击 | `A.sections.ac120Create.preClickDisabled`、`afterIncompleteClick` | `disabled=false`；点击后 ID/描述字段错误；`nonGetAttempts=0` | PASS |
| 编辑表单不完整仍可点击 | `A.sections.ac120Edit.afterIncompleteClick` | 描述错误显示；`nonGetAttempts=0` | PASS |
| 创建忙碌态（真实延迟 5000 ms） | `B.sections.busy.snapshots`（129/557/2113/3656 ms） | `is-disabled is-loading`、spinner=1、底色 `rgb(63,63,70)`、无蓝色；`blueDetected=false` | PASS |
| 忙碌期防重复 | `B.sections.busy` + `B.sections.requestLedger` | 真实鼠标重复点击命中 `FOOTER`；`POST` 总数=2（冲突+成功），无额外请求；忙碌期输入值不变 | PASS |
| 编辑忙碌态（004-R1 + 固定提交 `242cc5c`） | `…004-R1/results/r1b-write-dedup.json` → `flows.edit.busyState/duplicateAction/putCount/response/readback`；固定提交 `242cc5c` 的 `…MULTI-AC-CRUD…/group-e-results.json` → `ac115.submitting.inFlight` | 延迟 PUT；`is-disabled is-loading`；重复点击命中 FOOTER；`deltaAttempts` 唯一 PUT 早于重复点击（首笔，非第二笔）；`putCount=1`；200/200；回读一致；`inFlight` 快照 `loadingVisible=1`、`rgb(63,63,70)`/白字（非完整颜色时序） | PASS（复用） |
| 参考页对照 | `reference-evidence-index.md` §1 | 数据源页常态/hover/focus/active 值与本次一致；参考实现 `807a5a5` 自该提交起样式未变；Chrome 148 vs 147 差异已记录 | PASS |
| AC-115 关系 | 不重判 | AC-115 既有 PASS 保留 | 不适用 |

**AC-120 判定：PASS。**

## CCFG-AC-125 — 换行错误可读性与窄视口

| 子步骤 | 证据键 | 实测 | 判定 |
|---|---|---|---|
| 真实可触发长错误 | `B.sections.conflict` | 真实后端 40941；文本 = 期望全文；归属“采集数据源”字段 | PASS |
| 正常视口换行与可读 | `B.sections.conflict.wideBeforeScroll` | 1440×900：2 行（行宽 731.03 / 140.13），行盒均在表单可视区内，无滚动；`overflow=visible` | PASS |
| 窄视口可读（受控滚动后） | `B.sections.conflict.narrowBeforeScroll` / `narrowScroll` / `narrowAfterScroll` | 1024×720：2 行；表单 `clientHeight=480`、`scrollHeight=509`；`scrollTop=29` 后两行盒均位于表单可视区（609.19–624.19、627.38–642.38） | PASS |
| 无硬裁剪 | `B.sections.conflict.wideBeforeScroll.ancestors` / `narrowBeforeScroll.ancestors` / `narrowAfterScroll.ancestors`、`A.sections.layoutStatic` | 错误文本 `overflow=visible`、`overflow-wrap:anywhere`；直接反馈/控件祖先均 visible；`.cc-form`/`.el-overlay*`/`.content-area` 为 `overflow:auto`、`.main-layout` 为 `overflow:hidden`，但未截断错误盒；表单为受控内部滚动 | PASS |
| 无异常横向溢出 | `B.sections.conflict.wideBeforeScroll.doc` / `narrowBeforeScroll.doc` / `narrowAfterScroll.doc` | 1440: `scrollWidth=clientWidth=1440`；1024: `scrollWidth=clientWidth=1024`；`horizontalOverflow=false` | PASS |
| 窄视口弹窗可操作/关闭 | `A` 窄视口序列 + `closeDialogIfOpen` | 1024 下可选中/取消数据源、提交触发错误、点击“取消”关闭 | PASS |

**AC-125 判定：PASS。**

## CCFG-AC-134 — 新增／编辑全链与候选规则

| 子步骤 | 证据键 | 实测 | 判定 |
|---|---|---|---|
| 新增：键盘输入 | `A.sections.ac134Create.keyboard` | 键入 `CCFG005-KB1` | PASS |
| 新增：真实剪贴板粘贴 | `A.sections.ac134Create.paste` | `navigator.clipboard.writeText` + Ctrl+V → `PASTE-005-描述样本` | PASS |
| 新增：自动生成与顺序 | `A.sections.ac134Create.autoGenerate` / `autoGenerateReverse` | DS06→DS05 与反向，描述顺序与选择顺序一致 | PASS |
| 新增：取消全部 / 提交失败 / 修正 / 重开 | `cancelAll` / `submitFailure` / `corrected` / `reopen` | 中性提示 → 红色错误 → 修正清除 → 重开后空表单；`nonGet=0` | PASS |
| 编辑：锁定/解锁/再锁定 | `A.sections.ac134Edit.initial/unlocked/relocked` | 初始锁定“（已锁定）”；“修改探针 ID”解锁；可再锁定 | PASS |
| 编辑：键盘 / 粘贴 / 自动生成 | `A.sections.ac134Edit.keyboard/paste/autoGenerate` | 均落到描述草稿；顺序正确 | PASS |
| 编辑：取消全部 / 提交失败 / 修正 / 重开 | `cancelAllSubmitFailure` / `corrected` / `reopen` | 错误显示后修正清除；重开恢复原描述与数据源 | PASS |
| 候选资格 API↔DB | `A.sections.ac134Candidates`；`B.sections.setup.apiBeforeOccupation` | 238=238（夹具前）；夹具后 239=239；停用/异常/非 SOURCE/非 ORACLE 样本均不在 API | PASS |
| 已分配提示含探针 ID | `A...domSamples`；`B.sections.setup.optionsAfterOccupation`；`B.gate.responses` | “已分配给：CCFG004-HOLDER”；占用后 `occupiedByClientIds=['CCFG005-OCC1']`；40941 文案含 `CCFG005-OCC1` | PASS |
| 含英文逗号不可选 | `A...domSamples` | `CCFG-AC-R1-COM,ID` 禁用，原因“ID 含英文逗号，不可选择” | PASS |
| 保存接口/业务码/回读 | `B.gate.responses`；`B.sections.readback` | `POST /api/clients` 冲突 40941、成功 200/200；独立 GET 回读一致 | PASS |
| 编辑真实保存 | `…004-R1/results/r1b-write-dedup.json` → `flows.edit` | `PUT /api/clients/CCFG004-NEW1` 延迟转发，200/200；描述与数据源回读一致 | PASS（复用） |
| 参考页/其他 Feature/全局组件/后端/DB/两套模板 | `C.checks` | 五类触碰列表均为空；产品工作区 diff 为空；共享模板仅已批准轮次文档与 opt-in 扩展 | PASS |

**AC-134 判定：PASS。**

## CCFG-AC-138 — 弹窗稳定性与长错误

| 子步骤 | 证据键 | 实测 | 判定 |
|---|---|---|---|
| 前置：负责人已确认的稳定视口（含侧栏） | 见 `results/ac138-precondition-search.txt` | 现行定义要求该确认；仓库内未找到具体视口+侧栏组合的负责人确认记录 | **缺失** |
| 同视口 6 步序列（1440×900，侧栏展开） | `A.sections.ac125Ac138.wide` | 高度恒 613.19、top 恒 135、提交按钮 y 恒 700.19；反馈路径 灰→隐藏→灰→红→隐藏；每步 `nonGet=0` | 本地通过 |
| 同视口 6 步序列（1440×900，侧栏收起） | `A.sections.ac125Ac138.wideCollapsed` | 与展开态相同的几何；无水平溢出 | 本地通过 |
| 窄视口序列（1024×720，侧栏展开） | `A.sections.ac125Ac138.narrow` | 高度恒 600.39、top 恒 108、提交按钮 y 恒 660.39；无水平溢出 | 本地通过 |
| 长错误分支可读 | `B.sections.conflict` | 真实 40941 两行可读；窄视口受控滚动；错误盒未被祖先滚动/溢出限制截断 | 本地通过 |
| 固定高度/侧栏偏移 | `A.sections.ac125Ac138.*.fixedDialogHeightCss`、`dialogCentering.delta=0` | 高度为内容驱动；弹窗水平居中 delta=0；未发现写死侧栏偏移 | 本地通过 |

**AC-138 判定：BLOCKED（本地部分已完成）。**
最小补证条件：由项目负责人明确确认当前稳定状态的视口与侧栏状态组合（例如 1440×900 + 侧栏展开），并在该确认条件下重跑同一 6 步序列；本次 1440×900 展开/收起与 1024×720 的本地几何与长错误证据可作为补证基础，但不能替代负责人确认这一前置。
