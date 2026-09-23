# 探针端管理 Feature 界面设计（UI）

## 1. 元数据与文档状态

| 项目 | 值 |
|---|---|
| Feature 中文名称 | 探针端管理 |
| Feature 标识 | `client-config` |
| 既有路由 | `/config/client`（保持不变） |
| 目标文档 | `docs/features/client-config/UI.md` |
| 文档状态 | `APPROVED`（界面设计正式批准：ChatGPT 对提交 `ba7c5e9...` 的设计并发口径调整结果正式复审 `APPROVED`，项目负责人于 2026-09-04 明确回复“批准”，经批准收口任务 `CLIENT-CONFIG-DESIGN-CONCURRENCY-ADJUSTMENT-APPROVAL-001` 收口为 `APPROVED`，可用于后续实现；批准的是设计基线，不代表代码已实现、已测试或验收已执行通过） |
| 实现状态 | 分层口径：`existing_feature_implementation_status=IMPLEMENTED_PENDING_USER_ACCEPTANCE`（既有 Feature 实现已完成、尚待项目负责人验收）；`adjustment_baseline_status=APPROVED`（本轮页面级调整基线已于 2026-09-22 经项目负责人批准收口，批准前为 `DRAFT_PENDING_USER_REVIEW`）；`adjustment_implementation_status=IMPLEMENTED_PENDING_USER_ACCEPTANCE`（仅指本轮页面级调整实现已于 2026-09-23 由 `CLIENT-CONFIG-QUERY-LIST-AND-LIST-TABLE-ADJUSTMENT-IMPLEMENTATION-001` 完成、并经 ChatGPT 从远程 Git 独立代码复审通过，当前等待项目负责人页面目测/接受；其 2026-09-23 代码提交时点状态 `IMPLEMENTED_PENDING_CHATGPT_REVIEW` 属历史记录；**不**代表已目测、已验收或已接受）；`formal_acceptance_execution_status=NOT_RUN`。旧单层 `NOT_STARTED`（本设计只定义目标界面与交互）属历史事实，不代表当前既有实现状态 |
| 初版任务 | `CLIENT-CONFIG-DESIGN-BASELINE-001`（阶段 4 设计基线，纯文档） |
| 初版基线提交 | `cecfdd5478df8b82ba39c083553ea8dd7ead48e8` |
| 初版设计提交 | `21f4729c43d146426e8d4f1b2d6b667cfcf160ff` |
| R1 任务 | `CLIENT-CONFIG-DESIGN-BASELINE-001-R1`（正式设计复审驱动的定向修订，纯文档） |
| R1 复审结论 | ChatGPT 正式复审：`CHANGES_REQUIRED`（R1-01~R1-09；本文件落实 R1-02/R1-06/R1-07/R1-08 界面与交互修订） |
| R1 基线提交 | `21f4729c43d146426e8d4f1b2d6b667cfcf160ff` |
| 依据需求 | `CCFG-REQ-001~112`（`001~090` 已批准；`091~103` 为本轮调整基线，已于 2026-09-22 批准，见 §15；`104~112` 为第二轮 V2 新增需求，当前 `adjustment2_baseline_status=APPROVED`（2026-09-23 批准收口，批准前为 `DRAFT_PENDING_USER_REVIEW`），见 §16） |
| 依据验收 | `CCFG-AC-001~104`（第一轮 `001~089` 与第二轮 V2 草案 `090~104` 执行状态**全部** `NOT_RUN`） |
| 创建日期 | 2026-09-03 |
| R1 日期 | 2026-09-04 |
| 并发调整任务 | `CLIENT-CONFIG-DESIGN-CONCURRENCY-ADJUSTMENT-001`（依据重新批准的需求/验收并发口径，定向清除过时显式表锁设计的纯文档任务） |
| 并发调整日期 | 2026-09-04 |
| 批准日期 | 2026-09-04 |
| 批准人角色 | 项目负责人 |
| ChatGPT 复审入口 | `CHATGPT_FORMAL_DESIGN_CONCURRENCY_ADJUSTMENT_REVIEW` |
| ChatGPT 复审结论 | `APPROVED`（对提交 `ba7c5e917b1b9d08208c3e1ceb31285407f5fd5e` 下的设计并发口径调整结果） |
| 项目负责人回复 | 明确回复“批准”（2026-09-04） |
| 批准对象 | 提交 `ba7c5e917b1b9d08208c3e1ceb31285407f5fd5e` 下的本文件及其全部界面设计定义 |
| 批准收口任务 | `CLIENT-CONFIG-DESIGN-CONCURRENCY-ADJUSTMENT-APPROVAL-001` |
| 批准边界 | 设计获批不代表代码已实现、已测试或验收已执行通过 |
| 设计编号 | `CCFG-UI-001 ~ CCFG-UI-042`（`001~026` 已批准；`027~035` 为第一轮新增项，其调整基线已于 2026-09-22 批准，见 §15；`036~042` 为第二轮 V2 新增项，当前 `APPROVED`（2026-09-23 批准收口，批准前为 `DRAFT_PENDING_USER_REVIEW`；见 §16），连续、唯一、不可复用；每个设计编号恰有一个定义行 |
| PENDING_USER_CONFIRMATION | `0`（R1 已清零：`CCFG-UI-004/005` 的行选中与“已选择：{探针ID}”去留、`CCFG-UI-035` 的异常 `FG_ACTIVE` 承载形式均由项目负责人本轮明确决定并冻结，见 §15） |
| 本轮调整任务编号 | `CLIENT-CONFIG-QUERY-LIST-AND-LIST-TABLE-ADJUSTMENT-BASELINE-001`（R1 修订：`-001-R1`；R2 证据纠错：`-001-R2`；R3 最小纠错：`-001-R3`；批准收口：`CLIENT-CONFIG-QUERY-LIST-AND-LIST-TABLE-ADJUSTMENT-BASELINE-APPROVAL-CLOSEOUT-001`） |
| existing_feature_implementation_status | `IMPLEMENTED_PENDING_USER_ACCEPTANCE`（既有 Feature 实现已完成、尚待项目负责人验收；**不**因本轮页面调整改写） |
| adjustment_baseline_status | `APPROVED`（2026-09-22 草案建立时的 `DRAFT_PENDING_USER_REVIEW` 属历史状态；经 R1 修订与 R2/R3 证据纠错后由项目负责人于 2026-09-22 批准） |
| adjustment_approval_status | `APPROVED_BY_PROJECT_OWNER`（`adjustment_approval_date=2026-09-22`，`adjustment_approved_reviewed_commit=5066c761f8a9400d5841222cb73b0c03f56a82d0`；批准依据见 §15 前言） |
| adjustment_implementation_status | `IMPLEMENTED_PENDING_USER_ACCEPTANCE`（本轮页面级调整实现已于 2026-09-23 完成、并经 ChatGPT 从远程 Git 独立代码复审通过，当前等待项目负责人页面目测/接受；其 2026-09-23 代码提交时点状态 `IMPLEMENTED_PENDING_CHATGPT_REVIEW` 属历史记录；**不**代表既有 Feature 实现状态；**不**等于已目测、已验收或已接受） |
| formal_acceptance_execution_status | `NOT_RUN`（本轮正式验收未执行；`CCFG-AC-001~089` 全部 `NOT_RUN`） |
| 页面级选择性接入授权 | **已获项目负责人授权**：`/config/client` 页面级选择性接入查询列表页模板与列表表格视觉模板（查询列表页模板侧本页**不**接入刷新工具栏；列表表格视觉模板侧本页仅覆盖**主列表**，不含新增/编辑弹窗与弹窗内控件）。该授权为**页面级授权事实**，本轮批准收口**不新增、不扩大**该授权，也**不**等于本轮实现已完成；模板级全局迁移状态**未变**，其他页面**未获**授权 |
| 本轮新增界面编号 | `CCFG-UI-027 ~ CCFG-UI-035`（9 条，见 §15） |
| 本轮定向修订的既有界面项 | `CCFG-UI-004/005/006/018/022/024`（保留原文并标注被 `CCFG-UI-027~035` 取代/收窄的部分） |
| 本轮下一入口 | `CHATGPT_REMOTE_BASELINE_APPROVAL_CLOSEOUT_R2_REVIEW`（ChatGPT 远程独立复审本次 R2 状态/入口纠错的结果提交；历史入口 `CHATGPT_REMOTE_BASELINE_APPROVAL_CLOSEOUT_REVIEW` 已完成并返回 `CHANGES_REQUIRED`，原 `CHATGPT_REMOTE_BASELINE_R1_REVIEW` 已随 R1/R2/R3 复审闭环；基线经 ChatGPT 远程 R3 复审 `APPROVED` 后由项目负责人于 2026-09-22 批准） |
| 第二轮 V2 视觉调整基线状态 | `adjustment2_baseline_status=APPROVED`（第二轮主列表视觉调整，依据项目负责人已确认的五项视觉调整决定建立草案，经 ChatGPT 远程 V2 复审 `CHANGES_REQUIRED`、R1 纠错后再经 ChatGPT 远程复审 `APPROVED`，由项目负责人于 2026-09-23 批准收口，见 §16；批准前为 `DRAFT_PENDING_USER_REVIEW`） |
| 第二轮 V2 视觉调整批准状态 | `adjustment2_approval_status=APPROVED_BY_PROJECT_OWNER`（`adjustment2_approval_date=2026-09-23`，`adjustment2_approved_reviewed_commit=3830cba16142b4e2ad88f1fa96682ea8397a1203`；项目负责人 2026-09-23 明确回复原话 `批准本轮五项视觉调整基线`） |
| 第二轮 V2 视觉调整实现状态 | `adjustment2_implementation_status=NOT_STARTED`（本轮**已批准基线**尚未实现；批准**不**等于已实现） |
| 第二轮 V2 正式验收执行状态 | `formal_acceptance_execution_status=NOT_RUN`（`CCFG-AC-001~104` 共 104 条全部 `NOT_RUN`，其中 `CCFG-AC-090~104` 为本轮 V2 新增用例） |
| 配套文档 | `DESIGN.md`、`API.md`、`DATABASE.md` |

R1 界面修订目标（不改已批准 90 条需求与 76 条验收、不进入代码实现、不做设计批准收口）：采集数据源列“直接显示前三项”明确为非持久化投影且不原地修改接口数组（`R1-02`）；红色历史异常标签与编辑回显覆盖 `CATEGORY_MISMATCH`/`TYPE_MISMATCH`（`R1-06`）；新增含逗号歧义行与历史 NULL 描述的展示/编辑契约（`R1-07/R1-08`）。

并发口径定向调整（2026-09-04，`CLIENT-CONFIG-DESIGN-CONCURRENCY-ADJUSTMENT-001`，纯文档）：本轮 UI 业务交互总体不变，仅从 `CCFG-UI-020` 用户可见文案表删除“锁等待超时取 `50050` message”项（`50050 LOCK_WAIT_TIMEOUT` 已随设计并发口径调整从错误码契约删除，见 API.md）；保留 `40940` ID 冲突、`40941` 数据源占用冲突、`40942` 历史异常阻断及其他既有文案；不新增“并发双成功”用户提示或模式开关。原表锁/锁等待方案为设计草案内容，未获项目负责人批准，已整体标记为过时。本调整后界面设计经 ChatGPT 对提交 `ba7c5e9...`（`ba7c5e917b1b9d08208c3e1ceb31285407f5fd5e`）下的设计并发口径调整结果正式复审（`CHATGPT_FORMAL_DESIGN_CONCURRENCY_ADJUSTMENT_REVIEW`）结论 `APPROVED`，项目负责人于 2026-09-04 明确回复“批准”，经批准收口任务 `CLIENT-CONFIG-DESIGN-CONCURRENCY-ADJUSTMENT-APPROVAL-001` 收口为 `APPROVED`（批准的是设计基线，不代表代码已实现、已测试或验收已执行通过）。

## 2. 页面布局

| 设计编号 | 设计决定 | 覆盖需求 | 覆盖验收 |
|---|---|---|---|
| CCFG-UI-001 | 页面标题、菜单名称、面包屑可见名称统一为“探针端管理”，不再向用户显示“客户端配置”；既有路由 `/config/client` 与 Feature 目录标识 `client-config` 保持不变。实现阶段同步修改 `frontend/src/router/index.ts`（`meta.title`）、`frontend/src/config/menu.ts` 与页面标题，收口需求基线 `BI-CFG-001`（本设计只落盘界面规则，不创建代码）。 | CCFG-REQ-001 | CCFG-AC-001 |
| CCFG-UI-002 | 页面层级自上而下：独立页面标题“探针端管理”与说明文字“维护 sync-client 探针及其采集数据源配置”→ 独立查询区（§3）→ 独立表格卡片（含工具栏（§4）与数据表格（§5~§11））。查询区不得与工具栏、表格共置同一大卡片。仅放大页面内部字号、控件高度、按钮、表头、行高与区域间距，页面比当前更舒展但仍保持管理平台风格，不做夸张大屏化，不修改全局缩放或全局布局。另含页面级加载与空状态（§12）。首次进入自动触发一次列表查询（读全部记录），不做自动刷新。 | CCFG-REQ-002、CCFG-REQ-009 | CCFG-AC-002、CCFG-AC-008 |
| CCFG-UI-005 | **【本轮定向修订 · 待批准】** 列表列固定为：探针 ID｜探针描述｜采集数据源｜数据源数量｜状态，无独立“操作”列，行内不放编辑/删除按钮。单击行单选并高亮（选中行使用明显但克制的浅蓝底与左侧约 3px 蓝色强调线，普通悬停态颜色更淡且不得覆盖选中视觉，键盘聚焦样式不被吞掉），任一时刻最多选中一条；点击另一数据行切换选中；点击页面非交互空白区域取消当前选择（清除选中行视觉与“已选择：{探针ID}”、恢复“删除所选”禁用）；点击删除按钮至删除确认框打开期间、删除确认框内部及取消、行内状态操作、数据源标签/Tooltip、点击式 `+N` 完整清单、新增/编辑弹窗及其他浮层、有效工具栏控件均不误清除选择；查询、重置、列表重新加载或数据集替换、删除成功后清除选择，取消删除确认后保留原选中行；双击行打开编辑弹窗，探针 ID 键盘聚焦后 Enter/空格打开编辑（页面不显示“双击记录可编辑”提示，仅取消提示文字，双击与键盘编辑交互保留）。列表不分页、无“加载更多”。表格常规行以单行数据源标签自适应展示，行视觉高度约 58~64px（实际数值结合组件盒模型调试，避免裁切或巨大留白）。探针描述列保持单行展示、空间不足省略，仅当文本确实被截断时才显示完整描述 Tooltip（与采集数据源标签共用页面级单实例悬停 Tooltip，见 CCFG-UI-008）；历史 `clientDesc` 为 NULL 或去除首尾空白后为空的记录按 CCFG-UI-025 展示占位符，不得把缺失描述渲染为空白格，也不得把描述改为多行。**【本轮定向修订 · 待批准】** 本项中“列固定为……｜状态，无独立‘操作’列”已由 §15 `CCFG-UI-028`（列顺序改为 序号｜探针 ID｜探针描述｜采集数据源｜数据源数量｜操作）与 `CCFG-UI-030/031/032` 取代；本项中**行单选、选中行浅蓝底与左侧约 3px 强调线、点击切换选中、点击非交互空白取消选择、以及各“保留/清除选择”分支**整体**已被项目负责人本轮明确取消**（不再有选中态、选中事件、选中行集合、当前选中行概念与“已选择：{探针ID}”文本，见 §15 `CCFG-UI-035` 与 `CCFG-REQ-020`/`CCFG-REQ-094`），**不**作兼容保留、**不**待确认、**不**可选；行**双击编辑**与**探针 ID 键盘聚焦后 Enter/空格编辑**、探针描述单行省略与占位符展示口径**仍有效**，与取消选择能力不冲突。 | CCFG-REQ-003、CCFG-REQ-011、CCFG-REQ-020、CCFG-REQ-023、CCFG-REQ-024 | CCFG-AC-003、CCFG-AC-009、CCFG-AC-016、CCFG-AC-018 |
| CCFG-UI-025 | 历史 `CLIENT_DESC` 为 NULL/空白的界面契约（R1-08）：列表中该行“探针描述”列显示确定占位符 `—`；悬停占位符的 Tooltip 说明“未填写探针描述”。双击打开编辑弹窗时：`clientDesc` 为 NULL 映射为空白输入框；非 NULL 值（含首尾空白）原样回显，不 Trim、不改写。该历史状态不阻止打开编辑、删除、停用或按既有规则启用；编辑保存时前端仍要求补齐为“去除首尾空白后非空且原文 UTF-8 `<=1024 BYTE`”的描述（字节按实际输入原文计，Trim 仅判空），保存前按 TextEncoder 对原文预校验。不自动写回、不自动生成、不把 NULL 自动持久化为空串。 | CCFG-REQ-011、CCFG-REQ-039、CCFG-REQ-058、CCFG-REQ-059 | CCFG-AC-009、CCFG-AC-028、CCFG-AC-033、CCFG-AC-047 |

## 3. 查询区

| 设计编号 | 设计决定 | 覆盖需求 | 覆盖验收 |
|---|---|---|---|
| CCFG-UI-003 | 查询区为独立区域，两个查询项采用一致的“外部标签 + 控件”结构：第一个查询项外部标签为“探针信息”，控件为关键词输入框，占位文字“请输入探针 ID 或探针描述”，输入框不显示搜索图标；第二个查询项外部标签为“探针状态”，控件为状态下拉（默认显示“全部”；选项为全部/启用/停用），另有“查询”“重置”按钮。控件宽度、高度与彼此间距适当放大更易辨认。查询逻辑不变：关键词对探针 ID/探针描述不区分大小写包含匹配；状态三选一；修改条件不自动查询，仅点击“查询”后条件才生效并触发查询；点击“重置”恢复默认（关键词空、状态全部），不自动触发查询、不覆盖当前已生效列表。 | CCFG-REQ-006、CCFG-REQ-007、CCFG-REQ-008 | CCFG-AC-005、CCFG-AC-006、CCFG-AC-007 |

## 4. 工具栏与行操作入口（本节两项已被 §15 定向修订，原文保留）

| 设计编号 | 设计决定 | 覆盖需求 | 覆盖验收 |
|---|---|---|---|
| CCFG-UI-004 | **【本轮定向修订 · 待批准】** 工具栏（位于独立表格卡片顶部，含“新增探针”与唯一“删除所选”两个按钮）：新增探针为蓝色主按钮并带清晰加号图标；删除所选带删除图标，未选中任何行时灰色禁用，选中后为红色描边危险按钮（不使用大面积红色填充）；选中记录后按钮右侧显示“已选择：{探针ID}”，未选中时不得显示伪造 ID。工具栏不显示“双击记录可编辑”提示文字；取消提示不等于取消交互，双击行打开编辑与探针 ID 键盘聚焦后 Enter/空格打开编辑能力必须保留。删除前弹二次确认（文案见 §14），确认内容含将被删除的探针 ID；取消不删除；删除成功后刷新列表并清空选中状态。**【本轮定向修订 · 待批准】** 本项中“唯一‘删除所选’按钮”“未选中禁用 / 选中后显示‘已选择：{探针ID}’”及该按钮的删除确认入口已由 §15 `CCFG-UI-029`（取消“删除所选”、新增按钮移至结果区头部最右侧）取代；删除确认语义本身仍有效，入口见 `CCFG-UI-032`。本项中**行单选与“已选择：{探针ID}”文本整体已被项目负责人本轮明确取消**（不再有选中态、选中事件、选中行集合与对应“已选择”文本，见 §15 `CCFG-UI-035` 与 `CCFG-REQ-020`/`CCFG-REQ-094`），**不**作兼容保留、**不**待确认、**不**可选；删除/启停等行操作的入口统一改为该行“更多”下拉，**不**依赖任何行选中态。工具栏“不显示‘双击记录可编辑’提示文字、双击行与探针 ID 键盘编辑能力保留”的口径**仍有效**。 | CCFG-REQ-021、CCFG-REQ-022、CCFG-REQ-023、CCFG-REQ-025 | CCFG-AC-017、CCFG-AC-018、CCFG-AC-019 |
| CCFG-UI-019 | 删除确认框：标题“删除探针”，正文包含探针 ID；按钮“取消 / 删除”。成功提示“删除成功”；失败按后端错误码展示可读信息。 | CCFG-REQ-025、CCFG-REQ-028 | CCFG-AC-019、CCFG-AC-020、CCFG-AC-021 |

## 5. 状态列与启停操作（本节两项已被 §15 定向修订，原文保留）

| 设计编号 | 设计决定 | 覆盖需求 | 覆盖验收 |
|---|---|---|---|
| CCFG-UI-006 | **【本轮定向修订 · 待批准】** 状态列在同一格内把状态标签与“启用/停用”文字操作明确区分（不新增操作列）：状态是不可点击的胶囊标签，`fgActive='1'` → 浅绿底/绿字“启用”；`'0'` → 浅灰底/灰字“停用”；其余 → 浅红底/红字“异常（原始值=xxx）”，必须显示原始状态值。操作为明确文字按钮，与状态标签之间有明显间距：已启用记录显示红/橙红色“停用”，已停用记录显示蓝色“启用”；操作按钮有清晰悬停/聚焦反馈，状态标签不得呈现为可点击控件。非 `0/1` 行状态列不提供“启用”操作，仅提供“停用”与删除。启停操作按钮带独立防重复提交（见 §12/§15）。**【本轮定向修订 · 待批准】** 本项中“状态列”本身与“同一格内的‘启用/停用’文字操作入口”已由 §15 `CCFG-UI-028`（取消“状态”列）与 `CCFG-UI-032`（启停入口改为“操作”列“更多”下拉）取代；历史异常 `FG_ACTIVE` 必须显示原始值的可见性要求继续有效，但**承载位置与文案已冻结**为“探针 ID 列内紧随 ID 的红色 `异常：{原始值}`”（R1 冻结口径，取代本项原文的 `异常（原始值=xxx）` 写法，见 `CCFG-UI-031`/`CCFG-UI-035`）；防重复提交要求继续有效。 | CCFG-REQ-029、CCFG-REQ-033、CCFG-REQ-034 | CCFG-AC-022、CCFG-AC-025、CCFG-AC-026 |
| CCFG-UI-018 | **【本轮定向修订 · 待批准】** 停用：弹二次确认（正文含探针 ID，文案见 CCFG-UI-020）；确认后调 E7，成功提示“停用成功”。启用：一般免确认，点击直接调 E6，成功提示“启用成功”。停用/启用不弹“进程已停止/已启动”等措辞。数据源历史异常（停用/不存在/类别不符/类型不符/含逗号/行级歧义）及历史 NULL/空白描述均不阻断停用/启用交互；跨探针重复分配冲突由后端在启用时拒绝并展示提示（见 CCFG-UI-021）。**【本轮定向修订 · 待批准】** 本项的**入口位置与展现方式**已由 §15 `CCFG-UI-032` 改为“操作”列“更多”下拉；停用二次确认、启用免确认、成功提示、后端冲突拒绝与既有文案等**业务语义保持不变**（`CCFG-UI-019`/`CCFG-UI-020`/`CCFG-UI-021` 继续有效）。 | CCFG-REQ-030、CCFG-REQ-031、CCFG-REQ-032、CCFG-REQ-035 | CCFG-AC-023、CCFG-AC-024、CCFG-AC-027 |

## 6. 采集数据源列（紧凑展示）

| 设计编号 | 设计决定 | 覆盖需求 | 覆盖验收 |
|---|---|---|---|
| CCFG-UI-007 | “采集数据源”列以机构名称 `DATA_SOURCE_ORG` 为标签正文（正常标签不拼接数据源 ID 或名称）。单元格内标签严格单行（禁止换行、禁止出现第二行与纵向/横向滚动条）；常规行视觉高度约 58~64px（以实际盒模型调试为准）；放大标签以提高识别度（字号约 14px、高度约 26~28px、合理左右内边距与标签间距）。单行最多直接展示 6 个标签：可见数量 = min（单行实际可容纳数量，6）；总数不超过 6 且空间充足时全部直接展示、无 `+N`，总数超过 6 或单行放不下全部时才显示 `+N`，必须为 `+N` 自身及其间距在单行末尾预留宽度（不得裁切、不得换行、不得越界），不得强行压缩/重叠/越界塞满 6 个。窗口或列宽变化后自动重算，不依赖刷新页面。正常标签使用清晰但克制的普通样式；异常标签整体使用红色语义样式（见 CCFG-UI-010）。 | CCFG-REQ-012、CCFG-REQ-013、CCFG-REQ-014 | CCFG-AC-009、CCFG-AC-010、CCFG-AC-011 |
| CCFG-UI-008 | 单个标签最大视觉宽度约等于 10 个全角汉字，超过时用 CSS 省略号展示（不得用简单字符串截取破坏中英文混排）；完整机构名称经 Tooltip 可见。数据源标签无论是否发生文本省略都允许悬停查看详情（Tooltip 还承担数据源 ID 与异常说明功能）：正常数据源仅展示“完整机构名称 / 数据源 ID：xxx”；存在异常时按实际增加“异常原因：xxx / 冲突探针：xxx”；不显示 `DATA_SOURCE_NAME`（不删除后端返回的 `dataSourceName` 字段，不影响新增/编辑弹窗候选展示）；数据源不存在且无法取得机构名称时直接展示原始数据源 ID 与异常原因，不显示空机构名称或重复 ID。探针描述与采集数据源标签共用页面级单实例悬停状态管理：整个探针端管理列表任意时刻最多显示一个此类悬停 Tooltip；进入新的可提示元素立即关闭上一个；稳定悬停约 200~300ms 后才显示（快速扫过不得连续弹出多个）；鼠标离开立即隐藏（不保留隐藏延迟）；Tooltip 本身不可进入或保持；查询、重置、重新加载、打开弹窗、关闭/切换页面与组件销毁时必须清除当前 Tooltip 及定时器。不得仅靠缩短动画时间掩盖问题，必须有能保证“最多一个”的状态或实例控制。单个标签内文字须水平、垂直居中（正常、红色异常、以原始数据源 ID 展示、超长被省略、动态 `+N` 各态一致）：标签以不依赖字体基线的双向居中布局（`inline-flex`/`flex` 且 `align-items/justify-content: center`）承载文字，内层承载文字的元素须具有统一、明确的盒模型与行高，左右内边距对称；不得使用 `top`、`transform: translateY(...)`、负 margin 或单独增加 `padding-top` 等脆弱偏移“看起来居中”，且不得裁切文字或破坏单行 `nowrap`/省略。 | CCFG-REQ-012、CCFG-REQ-015 | CCFG-AC-009、CCFG-AC-012 |
| CCFG-UI-009 | `+N` 使用 Popover 且仅点击触发（不得把 `+N` 改成悬停触发；`+N` 完整清单与悬停 Tooltip 是两类交互）。点击展示全部数据源完整清单，清单按规范化去重后的原存储顺序展示、异常项不隐藏；清单设置最大高度（详见 §14 交互参数）并在内部滚动，不得改为第三行或更多行直接展开。打开 `+N` 清单时不得遗留上一个悬停 Tooltip 遮挡页面（应清除）。 | CCFG-REQ-016 | CCFG-AC-011 |
| CCFG-UI-010 | 异常数据源（项级 `INACTIVE`/`NOT_FOUND`/`CATEGORY_MISMATCH`/`TYPE_MISMATCH`/`COMMA_IN_ID`/`DUPLICATE_IN_ROW`/`ASSIGNED_TO_MULTIPLE_CLIENTS`；行级 `COMMA_PROTOCOL_AMBIGUOUS` 见 CCFG-UI-026）整体使用红色语义标签样式。单行可见集采用前端非持久化投影：把异常项排在正常项前、组内保持接口原顺序作为可见优先级；异常标签优先进入可见的标签（单行可见集，最多 6 项），在满足异常优先前提下其余数据源保持既有原始保存顺序；在单行容量内按实测宽度尽可能多地展示标签。仅当全部标签无法放入单行或总数超过 6 时才显示 `+N`，`N` 必须等于当前未直接展示的数据源数量（= 完整数组数量 − 直接展示数量）。该投影不原地修改接口数组，不改变持久化顺序、选择顺序或保存顺序。完整清单（Tooltip/点击 `+N`/编辑回显）按接口原顺序（规范化去重后原存储顺序）给出，异常项不被隐藏。标签正文：正常标签只显示机构名称；异常标签正文仍优先显示机构名称（红色语义），数据源不存在且无法取得机构名称时才显示经同样省略处理的原始数据源 ID；异常原因经悬停 Tooltip（CCFG-UI-008）与点击 `+N` 完整清单展示。 | CCFG-REQ-017、CCFG-REQ-078 | CCFG-AC-013、CCFG-AC-065 |
| CCFG-UI-011 | “数据源数量”列显示该行按普通 CSV 解析、去空、去重后的非空数据源 ID 数量（与列表标签展示同口径）；同一行历史重复 ID 不计重复。行级含逗号歧义（`COMMA_PROTOCOL_AMBIGUOUS`）时，该数量与标签明确标注为“普通 CSV 解析的展示结果”，不计为已确定的分配，见 CCFG-UI-026。 | CCFG-REQ-018、CCFG-REQ-019 | CCFG-AC-015 |
| CCFG-UI-026 | 行级含逗号歧义（`COMMA_PROTOCOL_AMBIGUOUS`，R1-07）的界面契约：当一行原始 `DATA_SOURCE_ID` 中存在可与“已知含英文逗号数据源 ID”匹配的可能而无法无损还原时，列表行以整行级红色歧义标识展示，显示原始完整字符串 `rawDataSourceIds`、可能的含逗号数据源 ID 集合（`possibleCommaDataSourceIds`）与原因文案“英文逗号既可能是分隔符、也可能属于数据源 ID，无法精确还原实际分配关系”。该行的机构标签与数据源数量均为普通 CSV 解析的展示结果，悬停/Popover 也据此标注，不宣称已恢复实际分配。双击可打开编辑弹窗，但在用户清除原始歧义配置并重新选择合法候选前禁止保存（不得静默拆分后直接覆盖）；若含逗号数据源已从 `CDC_DATA_SOURCE` 删除，普通 CSV 解析的对应 token 以 `NOT_FOUND` 展示，不猜测不存在的含逗号 ID。 | CCFG-REQ-010、CCFG-REQ-064、CCFG-REQ-078、CCFG-REQ-080、CCFG-REQ-081、CCFG-REQ-084 | CCFG-AC-052、CCFG-AC-065、CCFG-AC-067、CCFG-AC-068、CCFG-AC-070 |

## 7. 新增/编辑弹窗

| 设计编号 | 设计决定 | 覆盖需求 | 覆盖验收 |
|---|---|---|---|
| CCFG-UI-013 | 新增弹窗字段固定三项：探针 ID（可编辑）、探针描述（含右侧“自动生成”）、采集数据源；不提供状态字段与启停控件。新增校验：三项必填；探针 ID 满足长度与 `^[A-Za-z0-9][A-Za-z0-9._-]{0,31}$`；描述必填以“去除首尾空白后非空”判定，UTF-8 字节预校验按**实际输入原文（含首尾空白）**以 `TextEncoder` 计算 `<=1024 BYTE`（Trim 仅判空，不改变提交文本）；数据源至少 1 个。保存成功提示“新增成功”并关闭刷新。 | CCFG-REQ-036、CCFG-REQ-037、CCFG-REQ-039、CCFG-REQ-040、CCFG-REQ-041、CCFG-REQ-052 | CCFG-AC-028、CCFG-AC-029、CCFG-AC-031、CCFG-AC-033、CCFG-AC-034 |
| CCFG-UI-014 | 编辑弹窗字段同新增（探针 ID、探针描述、采集数据源），不含状态字段与启停控件。探针 ID 默认只读并显示锁定图标/文案；点击明确入口“修改探针 ID”解除只读（不弹修改前警告），入口随即变为“取消修改”；点击“取消修改”恢复原探针 ID 并回到只读。已选数据源中处于停用、不存在、类别非 SOURCE、类型非 ORACLE、含逗号或与其他探针重复分配等历史异常项以红色标签完整回显（含原始数据源 ID、当前类别/类型与原因），不得静默丢弃；行级含逗号歧义（`COMMA_PROTOCOL_AMBIGUOUS`）按 CCFG-UI-026 完整展示原始串与原因。编辑打开时：`clientDesc` 为 NULL 映射为空白输入框、非 NULL 值（含首尾空白）原样回显，只回显已保存内容、不自动生成/覆盖（见 CCFG-UI-025）。自身已选且健康的项按“原探针 ID”自排除，不因“已分配”被禁用。保存整体成功或整体失败，异常项未清除前禁止保存（见 CCFG-UI-017）。 | CCFG-REQ-042、CCFG-REQ-044、CCFG-REQ-045、CCFG-REQ-046、CCFG-REQ-058、CCFG-REQ-066、CCFG-REQ-079、CCFG-REQ-080 | CCFG-AC-032、CCFG-AC-035、CCFG-AC-036、CCFG-AC-037、CCFG-AC-047、CCFG-AC-054、CCFG-AC-066、CCFG-AC-067 |

## 8. 自动生成按钮

| 设计编号 | 设计决定 | 覆盖需求 | 覆盖验收 |
|---|---|---|---|
| CCFG-UI-015 | “自动生成”位于“探针描述”输入框右侧，任何表单状态下保持可点击外观（不因未选数据源/编辑历史/自定义描述而禁用）。语义：一次性文本填充工具，不保存/不提交任何“生成模式”，不新增字段。点击行为：① 无已选数据源 → 严格无动作（不清空、不修改描述、不弹确认、不报错、不改任何表单状态）；② 有已选 → 不弹二次确认，清空当前描述，按当前选择顺序读取每个数据源 `DATA_SOURCE_ORG`，单逗号连接写入（逗号前后无空格），不排序、不因机构名称相同去重、每项只 Trim 不改内部字符；③ 任一已选无法取得非空机构名称（明确指出该数据源 ID），或完整结果去空白后为空，或 UTF-8 字节数超过 1024 → 生成失败并明确提示，保持原描述不变，不静默截断；④ 成功写入后输入框立即恢复为普通可编辑文本，之后增删数据源不联动更新描述（用户可再次点击“自动生成”覆盖）。自动生成只对每个 `DATA_SOURCE_ORG` 片段 Trim；生成及用户后续编辑所得文本即最终提交原文，提交保存时原文保存（Trim 仅判空），前端按 `TextEncoder` 对原文（含首尾空白）预校验字节，后端保存时仍按最终提交原文权威校验。 | CCFG-REQ-050、CCFG-REQ-051、CCFG-REQ-052、CCFG-REQ-053、CCFG-REQ-054、CCFG-REQ-055、CCFG-REQ-056、CCFG-REQ-057、CCFG-REQ-058、CCFG-REQ-060 | CCFG-AC-041、CCFG-AC-042、CCFG-AC-043、CCFG-AC-044、CCFG-AC-045、CCFG-AC-046、CCFG-AC-047、CCFG-AC-048 |

## 9. 数据源多选（采集数据源控件）

| 设计编号 | 设计决定 | 覆盖需求 | 覆盖验收 |
|---|---|---|---|
| CCFG-UI-016 | 候选来源为 E2 返回的可选项与不可选项：主文本显示机构名称 `DATA_SOURCE_ORG`，同时可悬停/可见数据源名称与完整数据源 ID；支持按机构名称、数据源名称、数据源 ID 不区分大小写本地搜索。规则：含英文逗号的候选（`COMMA_IN_ID`）仍展示但置灰禁止选择，提示“ID 含英文逗号，不可选择”；已被其他探针分配的候选（`OCCUPIED`）仍展示但置灰禁止选择，标注“已分配给：{探针ID}”；编辑时自身已选健康项按 `excludeClientId`（原探针 ID）自排除而不被禁用。候选无可用项（空数组）、搜索无结果、候选加载失败三态各有明确提示。已选的历史异常项（含 `INACTIVE`/`NOT_FOUND`/`CATEGORY_MISMATCH`/`TYPE_MISMATCH`/`COMMA_IN_ID`/`DUPLICATE_IN_ROW`/`ASSIGNED_TO_MULTIPLE_CLIENTS`）以红色标签显示在“已选”区域并保留原数据源 ID 与原因（不进入可选池）。 | CCFG-REQ-061、CCFG-REQ-062、CCFG-REQ-063、CCFG-REQ-064、CCFG-REQ-065、CCFG-REQ-066、CCFG-REQ-067、CCFG-REQ-079、CCFG-REQ-080 | CCFG-AC-049、CCFG-AC-050、CCFG-AC-051、CCFG-AC-052、CCFG-AC-053、CCFG-AC-054、CCFG-AC-055、CCFG-AC-066、CCFG-AC-067 |

## 10. 保存阻断与提交

| 设计编号 | 设计决定 | 覆盖需求 | 覆盖验收 |
|---|---|---|---|
| CCFG-UI-017 | 新增/编辑提交前前端检查：数据源为 0 → 禁止保存（提示“至少选择 1 个数据源”）；编辑存在任一历史异常项（含 `INACTIVE`/`NOT_FOUND`/`CATEGORY_MISMATCH`/`TYPE_MISMATCH`/`COMMA_IN_ID`/`DUPLICATE_IN_ROW`/`ASSIGNED_TO_MULTIPLE_CLIENTS`）或行级 `COMMA_PROTOCOL_AMBIGUOUS` 歧义 → 禁止保存（提示需先移除异常项 / 清除原始歧义配置并重新选择合法候选），用户处理后且描述补齐为“去除首尾空白后非空”方可保存；保存按钮在提交中禁用（`SUBMITTING`）防重复。新增/编辑成功（`code=200`）后关闭弹窗并刷新列表；失败按后端业务 `message`/`code` 展示可读错误（文案见 CCFG-UI-020）。 | CCFG-REQ-081、CCFG-REQ-082、CCFG-REQ-085 | CCFG-AC-068、CCFG-AC-069、CCFG-AC-071 |

## 11. 加载、空状态与失败

| 设计编号 | 设计决定 | 覆盖需求 | 覆盖验收 |
|---|---|---|---|
| CCFG-UI-012 | 页面加载：骨架/加载态直至首查返回；查询结果为空显示明确空状态提示（如“暂无符合条件的探针”）；查询/加载失败显示失败提示与重试。候选三态见 §9。以上均为本地状态，不引入自动刷新。 | CCFG-REQ-009、CCFG-REQ-067 | CCFG-AC-008、CCFG-AC-055 |
| CCFG-UI-023 | 所有写操作（新增/编辑/删除/启用/停用）进入 `SUBMITTING`：对应确认按钮与触发入口禁用、显示加载，请求结束后复位；重复点击不产生重复提交；页面无自动刷新轮询。 | CCFG-REQ-085 | CCFG-AC-071 |

## 12. 用户可见文案表

| 设计编号 | 设计决定 | 覆盖需求 | 覆盖验收 |
|---|---|---|---|
| CCFG-UI-020 | 确定以下用户可见文案（含确认、成功、冲突/异常反馈；冲突正文直接取后端 `message` 或以文案表映射）：删除确认“确定删除探针 {探针ID} 吗？该操作不可恢复。”；停用确认“确定停用探针 {探针ID} 吗？停用后该探针不再按启用状态命中。”；成功提示“新增成功 / 编辑成功 / 启用成功 / 停用成功 / 删除成功”；ID 冲突取 `40940` message；数据源占用冲突取 `40941` message（含机构名称、数据源 ID、全部冲突探针 ID）；历史异常阻断取 `40942` message；候选加载失败“数据源候选加载失败，请稍后重试”。本 Feature 无“锁等待超时”用户文案（`50050 LOCK_WAIT_TIMEOUT` 已随并发口径调整删除，见 API.md）。 | CCFG-REQ-086 | CCFG-AC-072 |
| CCFG-UI-021 | 成功/反馈文案边界：不得出现“进程已停止/已启动/已重启”“配置已实时生效”等错误承诺；也不得把异常数据源描述为“已自动修复”。 | CCFG-REQ-090 | CCFG-AC-076 |

## 13. 响应式与可访问性

| 设计编号 | 设计决定 | 覆盖需求 | 覆盖验收 |
|---|---|---|---|
| CCFG-UI-022 | **【本轮定向修订 · 待批准】** 表格在项目常用桌面窗口与一个较小桌面窗口下均不得出现异常横向溢出、标签越界或 `+N` 消失；总宽不足时表格容器横向滚动，不改变列顺序、不隐藏关键异常信息。列宽缩窄内容较少的列、把空间让给探针描述与采集数据源（以下为目标区间，非机械照抄，以常见与较小窗口不遮挡、不溢出为验收依据）：探针 ID 约 170~180px，超出单行省略、悬停显示完整 ID；探针描述分配更多空间，保持单行省略；采集数据源获得最大剩余空间（单行标签区）；数据源数量约 100~110px，内容居中；状态约 150~170px，足以区分状态标签与操作。列宽不足时以省略号截断内容。**【本轮定向修订 · 待批准】** 本项中“状态约 150~170px”的列宽已随 §15 `CCFG-UI-028` 取消“状态”列而不再适用，改由“序号”列（窄列）与“操作”列（窄且固定在最右）替代；其余列宽策略与“桌面窗口不溢出、容器横向滚动、不隐藏关键异常信息”的要求继续有效。 | CCFG-REQ-011、CCFG-REQ-013、CCFG-REQ-017 | CCFG-AC-009、CCFG-AC-010、CCFG-AC-013 |
| CCFG-UI-024 | **【本轮定向修订 · 待批准】** 弹窗最大高度限制并内部滚动（新增/编辑弹窗内容过长时 `max-height` 内滚）；`+N` Popover 清单设最大高度（如 320px）内滚；悬停 Tooltip 为页面级单实例并出现在可视区域内，不越界、不叠留；点击式 `+N` 完整清单与悬停 Tooltip 是两类交互，打开清单不遗留旧 Tooltip 遮挡。键盘可达：查询/新增/重置、双击编辑、探针 ID 键盘编辑、状态列文字操作（**本轮定向修订 · 待批准**：该入口已由 §15 `CCFG-UI-032` 改为“操作”列“更多”下拉，键盘可达要求随之作用于“更多”入口与下拉条目）均可 Tab 聚焦并以 Enter/Space 触发；带图标按钮必须保留可识别文字，不得做成纯图标；**【本轮定向修订 · 待批准】** 禁用状态（如“删除所选”未选中、置灰候选）有明确视觉与 `aria-disabled` 语义——“删除所选”已由 §15 `CCFG-UI-029` 取消，该项保留于“置灰候选”等其余禁用态；焦点样式不得被局部 CSS 清除。长中文/长 ID 以 `text-overflow: ellipsis` 省略且完整值经 Tooltip 可见。不得以响应式为由改变列顺序或隐藏异常信息；不得为了固定单行/行高布局而使用不可维护的硬编码字符数量推算。 | CCFG-REQ-020、CCFG-REQ-015、CCFG-REQ-016、CCFG-REQ-017 | CCFG-AC-016、CCFG-AC-012、CCFG-AC-011、CCFG-AC-013 |

## 14. 关联矩阵

- 逐交互/逐文案的“覆盖需求/覆盖验收”已在上方各设计编号表内给出；完整 REQ→设计项、AC→设计项总矩阵见 `DESIGN.md` §12（本文件设计项以其 `CCFG-UI-*` 编号出现并被纳入总矩阵，保证 112/112 需求、104/104 验收可追踪）。
- 本文件所有 `CCFG-UI-*` 编号在其表内均有唯一一行，引用可解析。

## 15. 页面级模板选择性接入与列表调整（本轮新增 · 2026-09-22 批准收口为 `APPROVED`）

本节为 `CLIENT-CONFIG-QUERY-LIST-AND-LIST-TABLE-ADJUSTMENT-BASELINE-001`
（R1 修订 → R2/R3 证据纠错）的界面调整基线，
基于项目负责人逐项确认的 9 项页面调整决策，以及 R1 新增的两项明确决定
（行选中能力整体取消、历史异常 `FG_ACTIVE` 红色 `异常：{原始值}` 展示）。
该基线经 ChatGPT 远程 R3 复审（对象提交 `5066c761f8a9400d5841222cb73b0c03f56a82d0`）结论 `APPROVED` 后，
项目负责人于 2026-09-22 批准，经批准收口任务
`CLIENT-CONFIG-QUERY-LIST-AND-LIST-TABLE-ADJUSTMENT-BASELINE-APPROVAL-CLOSEOUT-001` 收口为：
`adjustment_baseline_status=APPROVED`、
`adjustment_approval_status=APPROVED_BY_PROJECT_OWNER`、
`adjustment_approval_date=2026-09-22`、
`adjustment_approved_reviewed_commit=5066c761f8a9400d5841222cb73b0c03f56a82d0`。
**批准的是本轮页面调整基线；批准时点本轮仍 `NOT_STARTED`（未实现）、`NOT_RUN`（未执行验收）、未目测**；
本轮调整实现随后已于 2026-09-23 完成（完成时点 `adjustment_implementation_status=IMPLEMENTED_PENDING_CHATGPT_REVIEW` 属该时点历史值；该实现其后已经 ChatGPT 从远程 Git 独立代码复审通过，当前 `adjustment_implementation_status=IMPLEMENTED_PENDING_USER_ACCEPTANCE`，等待项目负责人页面目测/接受，
**不**代表已目测、已验收或已接受）；
`formal_acceptance_execution_status=NOT_RUN`
（既有 Feature 实现事实仍为 `existing_feature_implementation_status=IMPLEMENTED_PENDING_USER_ACCEPTANCE`，
**不**因本轮调整改写）；`PENDING_USER_CONFIRMATION=0`。
`DRAFT_PENDING_USER_REVIEW` 为本节 2026-09-22 草案建立时的历史状态，已被本次批准收口取代。
本节只描述**主列表区**的可见结构与交互，不定义新增/编辑弹窗内部控件
（弹窗与弹窗内控件**不**纳入列表表格视觉模板范围）。

**页面级授权事实（与模板级全局状态分层）**：项目负责人**已授予** `/config/client` 的**页面级选择性接入授权**——
查询列表页模板侧采用页面壳/查询面板/操作区/结果面板四个公共组件、**不**接入刷新工具栏组件；
列表表格视觉模板侧仅覆盖本页**主列表**（不含新增/编辑弹窗与弹窗内控件）；**其他页面未获授权**。
该页面级授权先于本轮批准收口存在，本轮收口**不新增、不扩大**该授权，也**不**等于本轮实现已完成或已验收；
模板级全局迁移状态**未变**（见 `docs/baseline/query-list-page-template/MIGRATION.md`
与 `docs/baseline/list-table-visual-template/MIGRATION.md`，本文件不修改其模板级全局结论）。

| 设计编号 | 设计决定 | 覆盖需求 | 覆盖验收 |
|---|---|---|---|
| CCFG-UI-027 | 页面结构选择性接入查询列表页模板（`docs/baseline/query-list-page-template/`）：页面壳、页面标题“探针端管理”与说明文字、独立查询区、独立结果区（表格卡片）、错误提示槽位、加载稳定性等**页面层**规则按该模板的公共组件边界复用。复用组件范围与数据源管理参考页一致（四个公共组件：页面壳、查询面板、操作区、结果面板），**不**接入该模板的刷新工具栏组件；不改变本页现有查询/重置/首次加载/失败语义，除非本节明确改写。本页仍是 CRUD 配置页：Feature 专属写操作、弹窗、业务校验、行级操作与并发语义归本 Feature 所有，**不**被页面层模板接管。 | CCFG-REQ-091 | CCFG-AC-077 |
| CCFG-UI-029 | 结果区头部右侧放置“新增探针”主按钮（蓝色主按钮 + 加号图标），位置与数据源管理主列表的右侧“新增数据源”一致。**取消**原工具栏的“删除所选”按钮：结果区不再提供任何批量删除入口，同时**整体取消行单选、选中行高亮与“已选择：{探针ID}”文本**（不再有选中态、选中事件、选中行集合或当前选中行概念，普通单元格点击不产生任何选中视觉，见 §15 `CCFG-UI-035`）。删除/启停均由该行“更多”下拉发起，**不**依赖任何行选中态。工具栏提示文字口径不变：不显示“双击记录可编辑”提示，双击行/键盘打开编辑的能力保留。 | CCFG-REQ-093、CCFG-REQ-094 | CCFG-AC-079、CCFG-AC-080 |
| CCFG-UI-028 | 主列表列顺序固定为（自左至右）：序号｜探针 ID｜探针描述｜采集数据源｜数据源数量｜操作（最右侧固定列）。**取消**原“状态”列，列表不再有独立状态列；任何启停入口不得再出现在列表正文单元格内（改用 `CCFG-UI-032` 的操作列下拉）。列宽策略按 `CCFG-UI-022` 相应调整：序号列窄列；探针 ID 仍约 170~180px；探针描述与采集数据源继续占据主要剩余空间；数据源数量约 100~110px；操作列窄且固定在最右。 | CCFG-REQ-095、CCFG-REQ-011 | CCFG-AC-009、CCFG-AC-081 |
| CCFG-UI-030 | “序号”列为**新增第一列**，位于列表最左。列表不分页，序号按当前查询显示顺序从 `1` 开始连续递增（第 1 行=`1`，第 n 行=`n`），不跳号、不回车重置。序号为展示派生值，**不**写入数据库、**不**参与排序与查询条件、**不**作为行标识；查询/重置后按新的显示顺序重新从 `1` 编号。 | CCFG-REQ-100 | CCFG-AC-086 |
| CCFG-UI-031 | “探针 ID”列紧随“序号”列（第二列）。本列紧随探针 ID 文本之后的标记按 `FG_ACTIVE` **三态**冻结（与 `CCFG-REQ-101`/`CCFG-REQ-102` 一致）：`fgActive='1'`（启用）→ **不**显示任何状态标记；`fgActive='0'`（停用）→ 追加“停用”标记，其视觉样式、颜色语义、与 ID 文本的间距及显示位置必须与数据源管理主列表“数据源 ID”后的“停用”标记**完全一致**（同一视觉语言，不另立一套样式）；其余历史异常值（非 `'0'`/`'1'`）→ 紧随探针 ID 之后显示**红色徽标，固定文案 `异常：{原始值}`**，`{原始值}` 按既有数据契约如实展示、不得静默转换或省略（`FG_ACTIVE` 为 `VARCHAR2(1) NOT NULL`，Oracle 中 `''` 等价 `NULL`，故 null/空串为契约不可达；理论上不可见的单空白字符按半角引号定界展示，见 `CCFG-UI-035`）。红色徽标不得仅靠颜色传达语义，须有可读对比度与文字。标记**不得**挤压或遮盖“操作”列，其位置、间距与溢出处理见 `CCFG-UI-035`。探针 ID 自身的单行省略与完整值 Tooltip 不变。 | CCFG-REQ-101、CCFG-REQ-102、CCFG-REQ-011 | CCFG-AC-009、CCFG-AC-087、CCFG-AC-088 |
| CCFG-UI-032 | 最右侧“操作”列为固定列，列内只有唯一文字入口“更多”（文字按钮或链接样式，带清晰悬停/聚焦反馈）。点击“更多”展开下拉菜单，条目按 `FG_ACTIVE` 决定：`fgActive='1'`（启用中）→ 下拉含“删除”“停用”；`fgActive='0'`（已停用）→ 下拉含“删除”“启用”；非 `0/1`（历史异常）→ 下拉仅含“删除”“停用”（不提供“启用”，按 `CCFG-REQ-034`/`CCFG-REQ-097`）。条目顺序为先“停用/启用”后“删除”，危险条目“删除”使用危险语义样式，“停用”使用警告语义样式；下拉内不出现状态标签、不出现批量操作。操作列与行内其他区域的事件边界：单击或双击“更多”入口均不得冒泡触发行编辑（`row-dblclick`），展开下拉**不产生任何选中视觉**（本页已无行选中态、无选中行概念、无“已选择：{探针ID}”文本）；打开下拉、关闭下拉、执行下拉条目均**不**改变、也**不**依赖任何行选中态。 | CCFG-REQ-096、CCFG-REQ-097 | CCFG-AC-082、CCFG-AC-083 |
| CCFG-UI-033 | 本页**无任何刷新能力**：不提供自动刷新、即时刷新、“刷新”按钮、刷新倒计时与“最后刷新时间”显示；不接入查询列表页模板的刷新工具栏组件。列表数据更新仍只由既有数据流驱动：首次进入自动查询一次、点击“查询”、点击“重置”后不自动查询、写操作成功后按既有规则更新列表（新增/编辑/删除/启停成功后的列表更新语义保持 `CCFG-UI-015`/`CCFG-UI-017`/`CCFG-UI-018` 的既有规定，不因取消刷新区域而改成需手动刷新）。页面不得显示“重新加载”“刷新”等在此语义之外的控件。 | CCFG-REQ-092 | CCFG-AC-078 |
| CCFG-UI-034 | 列表空状态与错误状态：查询结果为空时显示明确空状态提示（沿用 `CCFG-UI-012` 口径，如“暂无符合条件的探针”）；查询/加载失败时显示失败提示与重试入口。新增/编辑/删除/启停的成功与失败提示沿用 `CCFG-UI-020`/`CCFG-UI-021` 既有文案口径，不新增文案、不改写既有文案。空状态与错误状态位于结果区内部，不因取消刷新区域而缺失或改由浏览器级刷新承担。 | CCFG-REQ-091、CCFG-REQ-092 | CCFG-AC-077、CCFG-AC-078 |
| CCFG-UI-035 | **行选中能力整体取消 + 历史异常 `FG_ACTIVE` 展示冻结（项目负责人本轮明确决定，已冻结、不再待确认）。** 一、取消“删除所选”后的行选中能力：本页**不**提供行单选（无行选中态、无选中事件、无选中行集合、无“当前选中行”概念），**不**提供选中行视觉（无选中底色、无高亮、无左侧强调线，普通单元格单击**不**产生任何选中视觉），**不**提供“已选择：{探针ID}”或等效选中文本；删除/启停一律由该行“更多”下拉发起，**不**依赖、也**不**改变任何行选中态；查询、重置、列表重新加载、删除成功后**无**“清除选中”动作，取消删除/启停确认后**无**“保留选中”语义；行双击编辑与探针 ID 键盘编辑**保留**，不与取消选择冲突。二、历史异常 `FG_ACTIVE`（值非 `'0'`/`'1'`）展示**冻结**为：紧随探针 ID 文本之后的**红色徽标，固定文案 `异常：{原始值}`**，`{原始值}` 按既有数据契约如实展示（不得静默转换、不得只写“异常”而不带原值；`FG_ACTIVE` 为 `VARCHAR2(1) NOT NULL`，Oracle 中 `''` 等价 `NULL`，故 null/空串为契约不可达；理论上不可见的单空白字符以半角引号定界展示，如 `异常：" "`，该规则由既有契约确定性推导、**不**自行发明后端语义）。三、该徽标的**位置、间距与溢出**：紧跟探针 ID 之后、与 ID 保持固定间距、允许在列宽不足时随该列以省略号截断且完整值经 Tooltip 可见；**不得**挤压、遮盖“操作”列，**不得**使“操作”列错位或不可点击。四、红色徽标须有**可读对比度**，**不得**仅靠颜色传达语义（需保留文字 `异常`）。五、历史异常行**保留**其删除入口，删除/停用接口、确认文案、保存前校验、忙状态（`SUBMITTING`）与错误反馈**均不变**。 | CCFG-REQ-102 | CCFG-AC-088 |

本节与既有界面项的关系：
`CCFG-UI-004`（工具栏含“新增探针”+“删除所选”）、`CCFG-UI-005`（五列固定、无“操作”列）、
`CCFG-UI-006`（状态列与行内启停文字操作）、`CCFG-UI-018`（行内停用/启用入口）、
`CCFG-UI-022`（含“状态”列宽的列宽区间）、`CCFG-UI-024`（可访问性提到状态列文字操作与“删除所选”未选中）
的部分口径被本节 `CCFG-UI-027~035` **取代或收窄**；上述既有条目原文**保留不改写**，
其被取代范围以本节为准。其中 `CCFG-UI-004`/`CCFG-UI-005` 内**行单选、选中行高亮与“已选择：{探针ID}”**
相关口径已由项目负责人本轮明确**整体取消**（见 `CCFG-UI-029`/`CCFG-UI-035` 与 `CCFG-REQ-020`/`CCFG-REQ-094`），
该取消为**已冻结决定**，**不**作兼容保留、**不**待确认、**不**可选；
`CCFG-UI-004`/`CCFG-UI-005` 的**双击编辑**、**探针 ID 键盘编辑**与**探针描述展示口径**仍有效。
其他界面项（查询区 `CCFG-UI-003`、采集数据源列 `CCFG-UI-007~011`/`026`、
新增/编辑弹窗 `CCFG-UI-013~017`、自动生成 `CCFG-UI-015`、候选控件 `CCFG-UI-016`、
加载与空状态 `CCFG-UI-012`/`023`、文案表 `CCFG-UI-020`/`021`）**本轮不变**。

**本轮 `PENDING_USER_CONFIRMATION`（0 项）**：
R1 已将原 1 项待确认清零。项目负责人本轮已明确决定并冻结：
（一）取消“删除所选”后，**行单选、选中行高亮与“已选择：{探针ID}”整体取消**（见 `CCFG-UI-029`/`CCFG-UI-035`）；
（二）历史异常 `FG_ACTIVE` 展示为**紧跟探针 ID 的红色 `异常：{原始值}`**（见 `CCFG-UI-031`/`CCFG-UI-035`）。
两项均**不再**作为待确认项、风险项或实现自由度，不计入需求/验收编号覆盖（`CCFG-REQ`/`CCFG-AC` 编号与计数不变）。

### 15.1 本轮页面级调整基线批准收口（2026-09-22，纯文档）

| 项目 | 值 |
|---|---|
| 批准任务编号 | `CLIENT-CONFIG-QUERY-LIST-AND-LIST-TABLE-ADJUSTMENT-BASELINE-APPROVAL-CLOSEOUT-001` |
| 批准证据链 | R0 草案提交 `fba09d17a471f7a4d1c7e56c07cfe9e6d1420dd1` → R1 修订提交 `2c2b2a71fcd049a68f86339d225f659af69e81c3` → R2 证据纠错提交 `5e0731aef0e36c1be9b87eba660e9b8c4a052555` → R3 最小纠错提交 `5066c761f8a9400d5841222cb73b0c03f56a82d0` |
| ChatGPT 复审对象与结论 | 对象提交 `5066c761f8a9400d5841222cb73b0c03f56a82d0`；结论 `APPROVED`（远程 R3 复审） |
| 项目负责人批准 | 2026-09-22 明确回复“批准本轮探针端管理页面调整基线” |
| 批准对象 | `CCFG-UI-027~035`（含 R1 两项冻结决定：行选中能力整体取消；历史异常 `FG_ACTIVE` 紧跟探针 ID 的红色 `异常：{原始值}`）及本轮定向修订口径 |
| 状态变化 | 仅 `adjustment_baseline_status`：`DRAFT_PENDING_USER_REVIEW` → `APPROVED`；新增 `adjustment_approval_status=APPROVED_BY_PROJECT_OWNER` |
| 保持不变的计数与状态 | `CCFG-UI-001~035` 共 35 条（连续、唯一）；`CCFG-AC-001~089` 共 89 条仍全部 `NOT_RUN`；需求 103 条、验收 89 条、设计 46 条、界面 35 条；`existing_feature_implementation_status=IMPLEMENTED_PENDING_USER_ACCEPTANCE`；`adjustment_implementation_status=NOT_STARTED`；`formal_acceptance_execution_status=NOT_RUN`；`PENDING_USER_CONFIRMATION=0`。35 条界面定义行相对批准提交逐字零差异，仅状态、批准元数据与变更记录变化 |
| 下一入口 | 2026-09-22 批准收口时的**历史入口**：`CHATGPT_REMOTE_BASELINE_APPROVAL_CLOSEOUT_REVIEW`（该远程复审已完成并返回 `CHANGES_REQUIRED`）；**当前下一入口**为 `CHATGPT_REMOTE_BASELINE_APPROVAL_CLOSEOUT_R2_REVIEW`（通过后方可进入独立实现任务；本收口**不**启动实现） |

批准对象**仅为本轮页面调整基线**，**不**代表代码已实现、已测试、已目测或验收已执行通过；
`API.md`/`DATABASE.md` 本轮**未**修改；模板级全局迁移状态**未变**。

## 16. 探针端管理主列表视觉调整（第二轮 V2 · 2026-09-23 草案建立 → V2 复审 `CHANGES_REQUIRED` → R1 纠错 → 2026-09-23 批准收口为 `APPROVED`）

本节为 `CLIENT-CONFIG-VISUAL-FOLLOWUP-BASELINE-001-V2` 的**第二轮主列表视觉调整基线草案**，
依据项目负责人查看 `/config/client` 与 `/config/data-source` 页面后**已明确确认的五项调整决定**建立。
**状态分层**：本节草案基线 `adjustment2_baseline_status=DRAFT_PENDING_USER_REVIEW`、
本轮实现 `adjustment2_implementation_status=NOT_STARTED`、
本轮正式验收 `formal_acceptance_execution_status=NOT_RUN`；
§15（`CCFG-UI-027~035`）此前获批基线保持 `APPROVED`，既有实现事实保持
`existing_feature_implementation_status=IMPLEMENTED_PENDING_USER_ACCEPTANCE`。
**项目负责人对五项产品决策的聊天确认不等于本节草案已复审或已批准，更不等于已实现或已验收**；
`CCFG-UI-001~035` 的既有定义行**逐字节不改**，本节与既有界面项冲突处一律按“本节定向修订”处理并保留原文。

**时序说明（不改写历史）**：§15 及其关联元数据记录的下一页入口
`CHATGPT_REMOTE_CLIENT_CONFIG_PAGE_ADJUSTMENT_IMPLEMENTATION_REVIEW` 反映的是 2026-09-23 实现完成时点的等待状态；
该远程代码复审**其后已经发生并已通过**，属该入口的已完成事实。本节不擦除该历史记录，也不宣布页面最终接受或视觉验收通过。本轮草案**当前下一入口**为 `CHATGPT_REMOTE_CLIENT_CONFIG_VISUAL_FOLLOWUP_BASELINE_V2_R1_REVIEW`（V2 草案已经 ChatGPT 从远程 Git 独立复审、结论 `CHANGES_REQUIRED`，由 R1 纠错任务 `CLIENT-CONFIG-VISUAL-FOLLOWUP-BASELINE-001-V2-R1` 承接；历史入口 `CHATGPT_REMOTE_CLIENT_CONFIG_VISUAL_FOLLOWUP_BASELINE_V2_REVIEW` 照实保留）。

**现行状态（2026-09-23 批准收口后追加，不改写上述历史表述）**：本节 2026-09-23 草案建立时的分层状态为 `adjustment2_baseline_status=DRAFT_PENDING_USER_REVIEW`、`adjustment2_implementation_status=NOT_STARTED`、本轮正式验收 `NOT_RUN`，该“草案／待复审”措辞属**草案阶段**的真实状态。其后 V2 草案 R1 纠错提交 `3830cba16142b4e2ad88f1fa96682ea8397a1203` 经 ChatGPT 从远程 Git 独立复审、结论 `APPROVED`（R1 纠错通过），项目负责人于 2026-09-23 明确回复原话 `批准本轮五项视觉调整基线`。**当前分层状态**：`adjustment2_baseline_status=APPROVED`、`adjustment2_approval_status=APPROVED_BY_PROJECT_OWNER`、`adjustment2_approval_date=2026-09-23`、`adjustment2_approved_reviewed_commit=3830cba16142b4e2ad88f1fa96682ea8397a1203`；`adjustment2_implementation_status=NOT_STARTED`（批准**不**等于已实现）；本轮正式验收 `NOT_RUN`（`CCFG-AC-001~104` 共 104 条全部 `NOT_RUN`）。§15（`CCFG-UI-027~035`）此前已批准基线保持 `APPROVED`，既有实现事实保持 `IMPLEMENTED_PENDING_USER_ACCEPTANCE`，均不改写。批准范围**仅**为 `/config/client` 主列表五项（黑色新增按钮、ID 正文对齐、行高跟随参考页、采集数据源标签绿/红/中性三态且独立行级歧义警示保持红色、操作列水平三点图标及改进菜单），**不**扩大到本轮不改项（探针描述列宽、已确认不改项、R1 修正后的窄视口横向滚动规则保持原样）、数据源管理参考页、其他页面或模板级全局迁移。

**参考来源的效力边界**：参考页 `/config/data-source`（`frontend/src/views/data-source/DataSourcePage.vue`）
与公共表格视觉预设（`frontend/src/styles/list-table/list-table-visual.css`）是本次视觉对照的**真实来源**；
项目负责人提供的操作列示意图体现**期望目标**，但截图**不是**测试通过证据。
参考页仅作视觉对照，本节**不**修改数据源管理的代码、文档、状态、行为与模板级全局配置。

| 设计编号 | 设计决定 | 覆盖需求 | 覆盖验收 |
|---|---|---|---|
| CCFG-UI-036 | 结果区最右侧“新增探针”按钮由蓝色主按钮改为与参考页“新增数据源”同款的**黑色实心**主按钮：保留加号图标、按钮文案、结果区头部最右侧位置与既有新增行为；**不**顺带改变“查询”“重置”等按钮；默认/Hover/聚焦/禁用视觉以参考页实际样式为准（参考实现事实：`#09090b` 底与边框、`#ffffff` 文字、圆角 6px、字重 500，Hover/聚焦 `#27272a`，按下 `#18181b`；`:not(.is-disabled)` 限定仅正常态换色，禁用态沿用 Element Plus 既有禁用视觉），不自行发明配色。 | CCFG-REQ-104 | CCFG-AC-090 |
| CCFG-UI-037 | “探针 ID”单元格的 **ID 正文文本**采用参考页“数据源 ID”同款字重与颜色（参考实现事实：字重 600、颜色 `#09090b`，可沿用等宽字体族与表格数字对齐）。ID 之后的“停用”标识与历史异常原值标识**保持各自现行语义与视觉**（`CCFG-UI-031`/`CCFG-UI-035` 不变），**不**对整列文本或标识笼统加粗改色；ID 单行省略、完整值 Tooltip 与点击/键盘编辑入口行为不变。 | CCFG-REQ-105 | CCFG-AC-091 |
| CCFG-UI-038 | 探针主列表行高跟随参考页“数据源管理”主列表的**实际行高规则**：**移除**本页对主列表行的固定像素行高，改由公共表格视觉预设的单元格上下内边距与内容共同决定（参考页未声明固定行高）；**不**凭截图写死像素值、**不**改动全局模板或公共预设本身。缩行后探针 ID 三态标识、采集数据源标签、行级提示、`+N` 与“操作”列入口仍可读可点；行双击编辑、探针 ID 键盘编辑、表头与最右固定列正常；新增/编辑弹窗内表格**不**受影响。 | CCFG-REQ-106 | CCFG-AC-092、CCFG-AC-093 |
| CCFG-UI-039 | “采集数据源”标签借用参考页“角色”标签视觉语言（参考实现事实：高度 20px、字号 12px、字重 600、圆角 4px、无边框、柔和底色），并采用**绿色／红色／中性色**三态：该数据源存在既有 `anomalies` → **红色**并保留异常原因与冲突探针 Tooltip；否则整行存在 `COMMA_PROTOCOL_AMBIGUOUS` → **中性色**且**不**暗示关联已确认正常；否则 → **绿色**（语义为“当前未检测到异常”，**不是**“目标库”角色）。红色异常**不**因整行歧义降级为中性色；整行级歧义提示保留。标签尺寸/字号/内边距变更后，实现阶段必须同步核准单行可见数量与 `+N` 的**测量盒模型**（重算测量基准），避免遮挡或误计数。采集数据源列既有语义**保持**不变：ORG／ID 回退、异常项优先、最多直接显示 6 个、窄列溢出 `+N` 与展开完整清单（去重后按原存储顺序、异常项不隐藏）——`CCFG-UI-011`/`CCFG-UI-012` 语义零改动，仅观感随标签尺寸与配色变化。 | CCFG-REQ-107、CCFG-REQ-108、CCFG-REQ-109 | CCFG-AC-094、CCFG-AC-095、CCFG-AC-096、CCFG-AC-097、CCFG-AC-098、CCFG-AC-099 |
| CCFG-UI-040 | 最右侧固定“操作”列的**全部行**唯一入口由“更多”文字改为**水平三点图标（Ellipsis）**，不保留“部分行文字、部分行图标”的过渡状态；图标具有足够命中区域、明确键盘焦点与可访问名称（如“更多操作：{探针ID}”）。下拉条目与业务语义保持 `CCFG-UI-032` 不变：启用行“停用＋删除”、停用行“启用＋删除”、历史异常原值行“停用＋删除”（**不**出现“启用”）。 | CCFG-REQ-110 | CCFG-AC-100 |
| CCFG-UI-041 | 三点图标单击展开的菜单采用柔和圆角、弥散阴影、适当内边距、清晰 Hover／焦点反馈，并以**分隔线**将红色警示“删除”单独隔开（“停用”为警告语义，条目顺序仍为先“停用/启用”后“删除”）；菜单可键盘操作、禁用态可辨识；点击/双击触发器与菜单内任意交互均**不**冒泡触发行双击编辑；接近右边缘或滚动时菜单**不**被裁切。二次确认、接口、行级忙碌与失败行为保持 `CCFG-UI-018`/`CCFG-UI-019`/`CCFG-UI-020`/`CCFG-UI-023` 不变。 | CCFG-REQ-111 | CCFG-AC-101、CCFG-AC-102、CCFG-AC-103 |
| CCFG-UI-042 | 本轮**不改项与回归边界**：“探针描述”列宽维持现状、长文本单行省略（描述通常由已分配数据源的 `DATA_SOURCE_ORG` 组成，数据源另在“采集数据源”列逐项展示）；查询条件、**刷新能力缺席**（`CCFG-UI-033` 不变）、六列顺序（`CCFG-UI-028` 不变）、CRUD 合同、Tooltip 业务信息与新增/编辑弹窗功能不因本轮视觉调整改变；标签与行高变更必须覆盖**正常视口与窄视口**下完整单行的可读性以及 `+N` 的可见性、可点击性。 | CCFG-REQ-112 | CCFG-AC-093、CCFG-AC-104 |

本节与既有界面项的关系：`CCFG-UI-004`/`CCFG-UI-029`（新增按钮为蓝色主按钮）、
`CCFG-UI-005`/`CCFG-UI-007`（常规行视觉高度约 58~64px）、
`CCFG-UI-007`/`CCFG-UI-010`（采集数据源标签尺寸与异常红色语义）、
`CCFG-UI-032`（操作列唯一**文字**入口“更多”）的部分口径被本节 `CCFG-UI-036~042`
**定向修订**；上述既有条目原文**保留不改写**，其被修订范围以本节为准。
其余界面项（查询区 `CCFG-UI-003`、探针 ID 三态标识 `CCFG-UI-031`/`CCFG-UI-035`、
序号列 `CCFG-UI-030`、空状态与错误状态 `CCFG-UI-034`、文案表 `CCFG-UI-020`/`CCFG-UI-021`、
新增/编辑弹窗 `CCFG-UI-013~017`、候选控件 `CCFG-UI-016`）本轮**不变**。

**本轮 V2 `PENDING_USER_CONFIRMATION`（0 项）**：五项调整均由项目负责人已明确确认，
本节不新增需要项目负责人另行决定的视觉或交互空档；`PENDING_USER_CONFIRMATION` 保持 **0**。

## 17. 变更记录

| 日期 | 变更 | 依据 |
|---|---|---|
| 2026-09-03 | 新建 `docs/features/client-config/UI.md`：页面布局、查询/工具栏/列表、状态与启停、采集数据源紧凑展示、新增/编辑弹窗、自动生成、候选控件、保存阻断、文案表、响应式与可访问性（`CCFG-UI-001~024`），文档状态 `DRAFT_PENDING_USER_REVIEW`，`PENDING_USER_CONFIRMATION=0` | CLIENT-CONFIG-DESIGN-BASELINE-001（阶段 4 设计基线；纯文档任务，未实现、未执行验收） |
| 2026-09-04 | R1 定向修订（界面设计编号扩为 `CCFG-UI-001~026`，共 26 条，仍连续唯一）：`CCFG-UI-010` 明确非持久化前三项投影与完整清单原顺序（R1-02）并补 `CATEGORY_MISMATCH`/`TYPE_MISMATCH` 红色标签（R1-06）；`CCFG-UI-013/014/015` 固定描述原文保存/Trim 仅判空/按原文计字节，编辑回显覆盖类别/类型异常与 NULL 描述；`CCFG-UI-016/017/018` 同步异常范围、保存阻断与启停不受阻语义；新增 `CCFG-UI-025`（历史 NULL/空白描述占位与编辑映射，R1-08）、`CCFG-UI-026`（含逗号歧义行展示与编辑阻断，R1-07）。文档状态保持 `DRAFT_PENDING_USER_REVIEW`，`PENDING_USER_CONFIRMATION=0` | CLIENT-CONFIG-DESIGN-BASELINE-001-R1（正式复审 `CHANGES_REQUIRED` 定向修订；纯文档任务，未实现、未执行验收） |
| 2026-09-04 | 并发口径定向调整（`CLIENT-CONFIG-DESIGN-CONCURRENCY-ADJUSTMENT-001`，纯文档）：`CCFG-UI-020` 从用户可见文案表删除“锁等待超时取 `50050` message”并明确本 Feature 无锁等待超时文案（`50050` 已从错误码契约删除）；其余 UI 业务交互与文案不变，不新增“并发双成功”用户提示或模式开关。文档状态保持 `DRAFT_PENDING_USER_REVIEW`，`PENDING_USER_CONFIRMATION=0`；不新增/删除/重排界面编号 | CLIENT-CONFIG-DESIGN-CONCURRENCY-ADJUSTMENT-001（设计草案并发口径定向调整；纯文档任务，未实现、未执行验收） |
| 2026-09-04 | 批准收口（`CLIENT-CONFIG-DESIGN-CONCURRENCY-ADJUSTMENT-APPROVAL-001`，纯文档）：文档状态由 `DRAFT_PENDING_USER_REVIEW` 收口为 `APPROVED`，`PENDING_USER_CONFIRMATION=0`；批准对象为提交 `ba7c5e917b1b9d08208c3e1ceb31285407f5fd5e` 下的本文件及其全部界面设计定义。26 条 `CCFG-UI-*` 业务定义行相对批准提交逐字零差异，仅状态与批准元数据变化；批准的是设计基线，不代表代码已实现、已测试或验收已执行通过（实现状态仍 `NOT_STARTED`，76 条验收仍全部 `NOT_RUN`） | ChatGPT 正式复审 `CHATGPT_FORMAL_DESIGN_CONCURRENCY_ADJUSTMENT_REVIEW` 结论 `APPROVED`（提交 `ba7c5e9...`），项目负责人于 2026-09-04 明确回复“批准” |
| 2026-09-05 | 列表口径定向修订（`CLIENT-CONFIG-LIST-UI-ADJUSTMENT-001`，已由项目负责人逐项确认的列表调整口径）：仅调整探针端管理列表页面的视觉与交互——页面层级与标题/说明（CCFG-UI-002）、查询区外部标签/占位/无搜索图标/控件尺度（CCFG-UI-003）、工具栏图标与“已选择”与取消“双击记录可编辑”提示（CCFG-UI-004/005）、两行预留行高与列宽（CCFG-UI-005/022）、数据源标签只显示机构名称 + 单标签宽度上限 + 两行自适应 `+N` + 异常优先（CCFG-UI-007/010）、Tooltip 内容不含 `DATA_SOURCE_NAME` + 页面级单实例延迟悬停 Tooltip（CCFG-UI-008/009/024）、状态胶囊与启停文字操作分离（CCFG-UI-006）。界面编号与数量 26 条保持不变、不新增/删除/重排；未改新增/编辑弹窗（CCFG-UI-013/014/015/016/017）与后端/接口/全局体系；未执行验收（76 条仍全部 `NOT_RUN`） | 项目负责人批准 `CLIENT-CONFIG-LIST-UI-ADJUSTMENT-001` 列表口径（2026-09-05）；纯前端列表调整，未实现、未执行验收 |
| 2026-09-05 | R1 列表口径定向修订（`CLIENT-CONFIG-LIST-UI-ADJUSTMENT-001-R1`，项目负责人 1K 实际页面目测后批准的定向修订）：撤回两行方案改回单行——行高与选中清除（CCFG-UI-004/005/022）：常规行单行标签、视觉高度约 58~64px；加强选中行视觉（浅蓝底 + 左侧约 3px 强调线、普通悬停更淡且不覆盖选中、键盘聚焦不被吞掉）；点击另一行切换、点击页面非交互空白取消选择、删除按钮/确认框/行内/标签/Tooltip/`+N` 清单/弹窗/有效控件不误清除、查询/重置/重载/数据替换/删除成功清除、取消删除确认保留；数据源列单行自适应最多 6 项 + 动态 `+N` + 放大标签（CCFG-UI-007/010）：字号约 14px、高度约 26~28px、可见数 = min(实际容量,6)、超出或放不下才 `+N`、`+N` 在行末预留宽度；Tooltip 异常文案/结构不变（CCFG-UI-008/009）。界面编号与数量 26 条保持不变、不新增/删除/重排；未改新增/编辑弹窗（CCFG-UI-013/014/015/016/017）与后端/接口/全局体系；实现状态 `IMPLEMENTED_PENDING_USER_ACCEPTANCE`；未执行验收（76 条仍全部 `NOT_RUN`） | 项目负责人批准 `CLIENT-CONFIG-LIST-UI-ADJUSTMENT-001-R1` 列表口径（2026-09-05）；纯前端列表调整，未实现、未执行验收 |
| 2026-09-05 | R2 实现纠偏最小口径补充（`CLIENT-CONFIG-LIST-UI-ADJUSTMENT-001-R2`，项目负责人 R1 目测后发现的“采集数据源”标签文字未稳定居中的实现纠偏）：现有基线已覆盖单行/尺寸/省略/Tooltip，未显式覆盖标签文字居中；仅向受影响界面项 `CCFG-UI-008` 追加一句“标签内文字水平、垂直居中（各态一致、不依赖字体基线、不用脆弱位移凑居中、不破坏单行省略/`+N` 点击区）”的最小口径。界面编号与数量 26 条保持不变、不新增/删除/重排；未改新增/编辑弹窗（CCFG-UI-013/014/015/016/017）与后端/接口/全局体系；实现状态 `IMPLEMENTED_PENDING_USER_ACCEPTANCE`；未执行验收（76 条仍全部 `NOT_RUN`） | `CLIENT-CONFIG-LIST-UI-ADJUSTMENT-001-R2`（项目负责人 1K 目测发现问题后下达的实现纠偏任务；纯前端列表实现/测试纠偏，未执行验收） |
| 2026-09-22 | 页面级查询列表页模板 + 列表表格视觉模板选择性接入调整草案（`CLIENT-CONFIG-QUERY-LIST-AND-LIST-TABLE-ADJUSTMENT-BASELINE-001`，纯文档）：新增 §15 与 `CCFG-UI-027~035`（9 条，界面编号扩为 `CCFG-UI-001~035`）：页面层选择性接入（`027`）、列顺序改为 序号｜探针 ID｜探针描述｜采集数据源｜数据源数量｜操作（`028`）、结果区头部右侧“新增探针”并取消“删除所选”（`029`）、新增序号列（`030`）、探针 ID 停用标记（`031`）、最右固定操作列“更多”下拉与条目顺序及警告/危险样式（`032`）、无刷新区域（`033`）、空状态与错误状态（`034`）、异常 `FG_ACTIVE` 可见性保护与行选中按 PENDING 暂保留（`035`）。`CCFG-UI-004/005/006/018/022/024` 部分口径被取代或收窄，原文保留不改写；新增/编辑弹窗与弹窗内控件**不**纳入列表表格视觉模板范围。本轮草案**基线状态** `DRAFT_PENDING_USER_REVIEW`、**实现状态** `NOT_STARTED`、**正式验收执行状态** `NOT_RUN`；既有实现事实仍为 `IMPLEMENTED_PENDING_USER_ACCEPTANCE`，**不**因本轮草案被改写；R0 当日登记的行选中待确认项（含“已选择：{探针ID}”存续问题）**已由下方 2026-09-22 R1 记录取代并清零**，本条仅为 R0 当日历史记录；下一入口 `CHATGPT_REMOTE_BASELINE_REVIEW`（已由 R1 记录改为 `CHATGPT_REMOTE_BASELINE_R1_REVIEW`）；本轮**不**修改 `API.md`/`DATABASE.md`、**不**修改任何代码、**不**执行验收、**不**做批准收口 | 项目负责人于当前会话逐项确认的 9 项页面调整决策（本轮为草案，未批准、未实现、未执行验收、未目测） |
| 2026-09-22 | R1 偏差修正（`CLIENT-CONFIG-QUERY-LIST-AND-LIST-TABLE-ADJUSTMENT-BASELINE-001-R1`，纯文档）：① 冻结项目负责人两项决定——取消“删除所选”后**行单选/选中行高亮/“已选择：{探针ID}”整体取消**（`CCFG-UI-029`/`CCFG-UI-035`，并定向清理 `CCFG-UI-004`/`CCFG-UI-005` 的“仍有效/PENDING”表述）；**历史异常 `FG_ACTIVE` → 紧跟探针 ID 的红色 `异常：{原始值}`**（`CCFG-UI-031`/`CCFG-UI-035`，删除“承载形式由实现阶段确定”的表述）；② `CCFG-UI-032` 的“不改变行选中态”改为“不产生任何选中视觉”，并明确打开/关闭/执行下拉均不改变也不依赖行选中态；③ 元数据与 §15 补**页面级选择性接入授权**事实（`/config/client` 页面级已获授权、模板级全局状态未变、其他页面未授权），并与“本轮基线未批准/本轮未实现”分层；④ 四层状态统一为 `existing_feature_implementation_status=IMPLEMENTED_PENDING_USER_ACCEPTANCE` / `adjustment_baseline_status=DRAFT_PENDING_USER_REVIEW` / `adjustment_implementation_status=NOT_STARTED` / `formal_acceptance_execution_status=NOT_RUN`；⑤ `PENDING_USER_CONFIRMATION` 由 `1` 清零为 `0`，下一入口改为 `CHATGPT_REMOTE_BASELINE_R1_REVIEW`。界面编号与数量 `CCFG-UI-001~035`（35 条）保持连续、唯一、不新增/删除/重排；本轮草案仍**未**批准、**未**实现、**未**执行验收；**不**修改 `API.md`/`DATABASE.md`、**不**修改任何代码 | `CLIENT-CONFIG-QUERY-LIST-AND-LIST-TABLE-ADJUSTMENT-BASELINE-001-R1`（ChatGPT 对 R0 的复审结论 `CHANGES_REQUIRED` 驱动的定向偏差修正，含项目负责人两项冻结决定；纯文档任务，未运行测试/构建/浏览器，未执行验收） |
| 2026-09-22 | R2 证据纠错（`CLIENT-CONFIG-QUERY-LIST-AND-LIST-TABLE-ADJUSTMENT-BASELINE-001-R2`，纯文档）：ChatGPT 对 R1 远程提交 `2c2b2a71fcd049a68f86339d225f659af69e81c3` 的复审结论为 `CHANGES_REQUIRED`，仅涉 R1 执行报告的三处追踪证据表述，不涉业务规则。本文件**未修改**；界面编号与数量 `CCFG-UI-001~035`（35 条）与业务定义行零变化；`adjustment_baseline_status` 保持 `DRAFT_PENDING_USER_REVIEW`；下一入口 `CHATGPT_REMOTE_BASELINE_R3_REVIEW` | `CLIENT-CONFIG-QUERY-LIST-AND-LIST-TABLE-ADJUSTMENT-BASELINE-001-R2`（纯文档追加式证据纠错；未运行测试/构建/浏览器，未执行验收） |
| 2026-09-22 | R3 最小证据纠错（`CLIENT-CONFIG-QUERY-LIST-AND-LIST-TABLE-ADJUSTMENT-BASELINE-001-R3`，纯文档）：ChatGPT 对 R2 远程提交 `5e0731aef0e36c1be9b87eba660e9b8c4a052555` 的复审结论为 `CHANGES_REQUIRED`，仅涉两处文字证据（`ACCEPTANCE.md` §1.4 说明文字、R2 报告 §8 异常菜单摘要）。本文件**未修改**；界面编号与数量 `CCFG-UI-001~035`（35 条）与业务定义行零变化；`adjustment_baseline_status` 保持 `DRAFT_PENDING_USER_REVIEW`；下一入口 `CHATGPT_REMOTE_BASELINE_R3_REVIEW` | `CLIENT-CONFIG-QUERY-LIST-AND-LIST-TABLE-ADJUSTMENT-BASELINE-001-R3`（纯文档最小证据纠错；未运行测试/构建/浏览器，未执行验收） |
| 2026-09-22 | 页面级调整基线**批准收口**（`CLIENT-CONFIG-QUERY-LIST-AND-LIST-TABLE-ADJUSTMENT-BASELINE-APPROVAL-CLOSEOUT-001`，纯文档）：ChatGPT 从远程 Git 对 R3 结果提交 `5066c761f8a9400d5841222cb73b0c03f56a82d0` 的复审结论为 `APPROVED`，项目负责人于 2026-09-22 明确回复原话 `批准本轮探针端管理页面调整基线`；本轮调整基线**状态变化仅为** `adjustment_baseline_status` 由 `DRAFT_PENDING_USER_REVIEW` 变为 `APPROVED`（并新增 `adjustment_approval_status=APPROVED_BY_PROJECT_OWNER`、`adjustment_approval_date=2026-09-22`、`adjustment_approved_reviewed_commit=5066c761f8a9400d5841222cb73b0c03f56a82d0`）。界面编号与数量 `CCFG-UI-001~035`（35 条）保持连续、唯一、不新增/删除/重排；35 条界面定义行相对批准提交逐字零差异；`existing_feature_implementation_status=IMPLEMENTED_PENDING_USER_ACCEPTANCE`、`adjustment_implementation_status=NOT_STARTED`、`formal_acceptance_execution_status=NOT_RUN`、`PENDING_USER_CONFIRMATION=0` 均保持不变；89 条验收仍全部 `NOT_RUN`；**不**修改 `API.md`/`DATABASE.md`、**不**修改任何代码、**不**执行验收；下一入口 `CHATGPT_REMOTE_BASELINE_APPROVAL_CLOSEOUT_REVIEW` | 项目负责人 2026-09-22 批准（原话 `批准本轮探针端管理页面调整基线`）；依据 ChatGPT 远程 R3 复审 `APPROVED`（对象提交 `5066c761f8a9400d5841222cb73b0c03f56a82d0`）；批准的是页面调整基线，不代表已实现、已测试、已目测或验收已通过 |
| 2026-09-23 | 页面级调整**实现**（`CLIENT-CONFIG-QUERY-LIST-AND-LIST-TABLE-ADJUSTMENT-IMPLEMENTATION-001`，前端实现任务）：按已批准基线实现 `/config/client` 单页调整，`adjustment_implementation_status` 由 `NOT_STARTED` 变为 `IMPLEMENTED_PENDING_CHATGPT_REVIEW`。落地 `CCFG-UI-027~035`：主列表六列固定顺序 序号｜探针 ID｜探针描述｜采集数据源｜数据源数量｜操作（最右固定）、结果区左侧摘要与右侧“新增探针”、取消“删除所选”与行选中视觉、探针 ID 三态标识（`'1'` 无标记 / `'0'` 与数据源管理同款“停用”标记 / 其余历史异常红色 `异常：{原始值}` 且不可见单空白以可见定界符如实呈现）、“更多”菜单条目与事件边界、主表视觉预设接入（仅主表）、空态与失败提示及重试。**本文件不改变任何界面业务定义**：界面编号与数量 `CCFG-UI-001~035`（35 条）保持连续、唯一、不新增/删除/重排，定义行相对起始提交**逐字节零变化**；89 条验收仍全部 `NOT_RUN`；`API.md`/`DATABASE.md` 未修改；两套模板的模板级全局状态（`NOT_STARTED`/`NOT_GRANTED`/`NOT_DECIDED`）不变；浏览器只读实机目测因运行条件不具备记为 `BROWSER_BLOCKED_RUNTIME_UNAVAILABLE`，未伪造截图或视觉通过结论；下一入口 `CHATGPT_REMOTE_CLIENT_CONFIG_PAGE_ADJUSTMENT_IMPLEMENTATION_REVIEW` | `CLIENT-CONFIG-QUERY-LIST-AND-LIST-TABLE-ADJUSTMENT-IMPLEMENTATION-001`（前端实现任务；未修改公共模板实现、数据源管理参考页、路由/菜单、API 类型与接口、后端代码、数据库对象/DDL、构建依赖；未执行正式验收或最终接受） |
| 2026-09-23 | 第二轮主列表视觉调整**草案**（`CLIENT-CONFIG-VISUAL-FOLLOWUP-BASELINE-001-V2`，纯文档）：依据项目负责人查看 `/config/client` 与 `/config/data-source` 页面后已明确确认的五项视觉调整决定，新增 §16 与 `CCFG-UI-036~042`（7 条，界面编号扩为 `CCFG-UI-001~042`）——`036` 新增按钮黑色实心（保留加号/文案/最右位置/新增行为，不改查询/重置）、`037` 探针 ID 正文字重与颜色对齐数据源 ID（标识语义与视觉保持）、`038` 行高跟随参考页主列表实际规则（移除固定像素行高、由公共预设内边距与内容决定，不改全局模板）、`039` 采集数据源标签借用角色标签视觉语言 + 绿/红/中性色三态与优先级（异常不因行级歧义降级；尺寸变更须同步核准测量盒模型）、`040` 操作列“更多”**全部行**统一改为水平三点图标（命中区域/键盘焦点/可访问名称）、`041` 三点菜单视觉与分隔线隔离红色删除及键盘可访问与事件边界、`042` 不改项与正常/窄视口回归边界。**定向修订** `CCFG-UI-004/005/007/010/029/032` 相关部分口径（原文保留不改写，被修订范围以 §16 为准）。**元数据**：新增第二轮 V2 分层行（`adjustment2_baseline_status=DRAFT_PENDING_USER_REVIEW`、实现 `NOT_STARTED`、验收 `NOT_RUN`），依据需求/验收/设计编号范围同步更新；§14 关联矩阵计数更新为 112/112、104/104；另在本节补**时序说明**（§15 历史“等待 ChatGPT 实现复审”入口其后已复审通过，属该入口已完成事实，不擦除历史、不宣布最终接受）。**计数与边界**：`CCFG-UI-001~035`（35 条）定义行**逐字节零变化**、不新增/删除/重排；验收由 89 条增至 **104 条**（`CCFG-AC-090~104` 全部 `NOT_RUN`）；`PENDING_USER_CONFIRMATION=0`；**不**修改 `API.md`/`DATABASE.md`、**不**修改任何代码/测试/前端源文件、**不**改 `docs/baseline/**` 与模板级全局状态；下一入口 `CHATGPT_REMOTE_CLIENT_CONFIG_VISUAL_FOLLOWUP_BASELINE_V2_REVIEW` | `CLIENT-CONFIG-VISUAL-FOLLOWUP-BASELINE-001-V2`（项目负责人已确认的五项视觉调整决策驱动的**草案**；纯文档任务，未实现代码、未运行测试/构建/浏览器/服务、未访问数据库/ZooKeeper/Kafka、未执行正式验收或最终接受；用户同意五项 ≠ 文档已批准 ≠ 已实现 ≠ 已验收） |
| 2026-09-23 | 第二轮 V2 草案 **R1 纠错**（`CLIENT-CONFIG-VISUAL-FOLLOWUP-BASELINE-001-V2-R1`，纯文档）：ChatGPT 对 V2 远程提交 `328a7ac56fabb3f3ef5ff5f087537a8d828df84b` 的复审结论为 `CHANGES_REQUIRED`，仅须修正三处文档问题，五项已确定产品决策不重新设计。本文件**不修改任何界面业务定义**（`CCFG-UI-001~042` 定义行逐字节零变化；行级歧义警示颜色越界问题落在 `DESIGN.md` `CCFG-DESIGN-050`，界面侧 `CCFG-UI-013` 定义行**不改写**、语义不变）：① **R1-03 当前状态与历史时点一致**——元数据 `实现状态` 与 `adjustment_implementation_status` 行的**当前值**改为 `IMPLEMENTED_PENDING_USER_ACCEPTANCE`（第一轮页面级调整实现代码复审已通过、等待项目负责人页面目测/接受），§15 历史叙述改为“完成时点为历史值 `IMPLEMENTED_PENDING_CHATGPT_REVIEW`、其后复审已通过”，保留历史；② **R1-01 关联勘误**——§16 已重申整行级歧义警示标识**保持原有红色警示样式与 Tooltip/文案**、中性色仅用于无项级异常的采集数据源标签，本文件不新增待确认项；③ §16 时序说明补记本轮草案**当前下一入口** `CHATGPT_REMOTE_CLIENT_CONFIG_VISUAL_FOLLOWUP_BASELINE_V2_R1_REVIEW`。**编号与计数**：`CCFG-UI-001~042`（42 条）保持连续、唯一、不新增/删除/重排；需求 112 条、验收 104 条（全部 `NOT_RUN`）、设计 53 条不变；本轮草案仍 `DRAFT_PENDING_USER_REVIEW`、本轮实现仍 `NOT_STARTED`；`PENDING_USER_CONFIRMATION=0`；**不**改 `API.md`/`DATABASE.md`、**不**改任何业务代码/测试/前端或后端源文件、**不**改 `docs/baseline/**` 与模板级全局状态；下一入口 `CHATGPT_REMOTE_CLIENT_CONFIG_VISUAL_FOLLOWUP_BASELINE_V2_R1_REVIEW` | `CLIENT-CONFIG-VISUAL-FOLLOWUP-BASELINE-001-V2-R1`（ChatGPT 对 V2 的 `CHANGES_REQUIRED` 复审驱动的纯文档 R1 纠错；未实现代码、未运行测试/构建/浏览器/服务、未访问数据库/ZooKeeper/Kafka、未执行正式验收或最终接受；未宣布第二轮文档已批准） |
| 2026-09-23 | 第二轮主列表视觉调整基线**批准收口**（`CLIENT-CONFIG-VISUAL-FOLLOWUP-BASELINE-APPROVAL-CLOSEOUT-001`，纯文档）：ChatGPT 从远程 Git 对 V2 草案 R1 纠错提交 `3830cba16142b4e2ad88f1fa96682ea8397a1203` 的复审结论为 `APPROVED`（R1 纠错通过），项目负责人于 2026-09-23 明确回复原话 `批准本轮五项视觉调整基线`；本轮**状态变化仅为** `adjustment2_baseline_status` 由 `DRAFT_PENDING_USER_REVIEW` 变为 `APPROVED`（并新增元数据 `adjustment2_approval_status`/`adjustment2_approval_date`/`adjustment2_approved_reviewed_commit` 行与 §16 现行状态说明），**不**改变任何界面业务定义。界面编号与数量 `CCFG-UI-001~042`（42 条）保持连续、唯一、不新增/删除/重排，定义行相对提交 `3830cba` **逐字节零变化**；需求 112 条、验收 104 条（全部 `NOT_RUN`）、设计 53 条不变；`adjustment2_implementation_status=NOT_STARTED`（批准**不**等于已实现）、§15 已批准基线（`adjustment_baseline_status=APPROVED`）与既有实现事实（`IMPLEMENTED_PENDING_USER_ACCEPTANCE`）保持真实；`PENDING_USER_CONFIRMATION=0`；两套模板的模板级全局状态（`NOT_STARTED`/`NOT_GRANTED`/`NOT_DECIDED`）不变，页面级授权**不新增、不扩大**；批准范围**仅**为 `/config/client` 主列表五项；下一入口 `CHATGPT_REMOTE_CLIENT_CONFIG_VISUAL_FOLLOWUP_BASELINE_APPROVAL_CLOSEOUT_REVIEW`（只有该复审通过后才进入第二轮实现任务） | `CLIENT-CONFIG-VISUAL-FOLLOWUP-BASELINE-APPROVAL-CLOSEOUT-001`（项目负责人批准驱动的第二轮视觉调整基线批准收口；纯文档任务，未修改代码/测试、未运行测试/构建/浏览器/服务、未访问数据库/ZooKeeper/Kafka、未执行正式验收或最终接受） |
