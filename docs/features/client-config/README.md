# 探针端管理 Feature（client-config）导航与状态

## 1. Feature 身份

| 项目 | 值 |
|---|---|
| 用户可见名称 | 探针端管理（页面标题、菜单、面包屑已统一为“探针端管理”；路由 `meta.title`、`menu.ts` 与页面标题均为该名称，更名已实施） |
| Feature 内部标识 | `client-config`（内部目录标识不变） |
| 既有路由 | `/config/client`（保持不变） |
| 既有实现事实 | `IMPLEMENTED_PENDING_USER_ACCEPTANCE`（既有页面与后端 CRUD 已实现并通过自动化与真实页面复验，**尚待项目负责人验收**；来源见 `reports/CLIENT-CONFIG-LIST-UI-ADJUSTMENT-001-R2.md`、`reports/CLIENT-CONFIG-USER-ACCEPTANCE-PREPARATION-001-R1.md`；本节此前“占位实现、实现未开始”表述已随本节更新纠正，历史章节不改写） |
| 实现状态 | 分层口径：`existing_feature_implementation_status=IMPLEMENTED_PENDING_USER_ACCEPTANCE`（既有 Feature 实现已完成、尚待项目负责人验收）；`adjustment_implementation_status=IMPLEMENTED_PENDING_USER_ACCEPTANCE`（**仅指**本轮页面级调整实现已由 `CLIENT-CONFIG-QUERY-LIST-AND-LIST-TABLE-ADJUSTMENT-IMPLEMENTATION-001` 于 2026-09-23 完成、并经 ChatGPT 从远程 Git 独立代码复审通过，当前等待项目负责人页面目测/接受；其 2026-09-23 代码提交时点状态 `IMPLEMENTED_PENDING_CHATGPT_REVIEW` 属历史记录；**不**代表既有实现状态，也**不**代表已目测、已验收或已接受） |
| 正式验收执行 | `formal_acceptance_execution_status=NOT_RUN`（全部 104 条验收用例未执行，含既有 76 条、第一轮新增 13 条与第二轮 V2 草案新增 15 条） |
| 本轮调整任务编号 | `CLIENT-CONFIG-QUERY-LIST-AND-LIST-TABLE-ADJUSTMENT-BASELINE-001`（R1 修订：`-001-R1`；R2 证据纠错：`-001-R2`；R3 最小纠错：`-001-R3`；批准收口：`CLIENT-CONFIG-QUERY-LIST-AND-LIST-TABLE-ADJUSTMENT-BASELINE-APPROVAL-CLOSEOUT-001`） |
| 本轮调整基线状态 | `adjustment_baseline_status=APPROVED`（经 ChatGPT 远程 R3 复审 `APPROVED` 后由项目负责人于 2026-09-22 批准；批准前为 `DRAFT_PENDING_USER_REVIEW`） |
| 本轮调整批准状态 | `adjustment_approval_status=APPROVED_BY_PROJECT_OWNER`；`adjustment_approval_date=2026-09-22`；`adjustment_approved_reviewed_commit=5066c761f8a9400d5841222cb73b0c03f56a82d0` |
| 本轮调整实现状态 | `adjustment_implementation_status=IMPLEMENTED_PENDING_USER_ACCEPTANCE`（批准后的页面级调整已由 `CLIENT-CONFIG-QUERY-LIST-AND-LIST-TABLE-ADJUSTMENT-IMPLEMENTATION-001` 于 2026-09-23 实现，定向测试与前端构建通过，并已经 ChatGPT 从远程 Git 独立代码复审通过，当前等待项目负责人页面目测/接受；2026-09-23 代码提交时点状态为历史值 `IMPLEMENTED_PENDING_CHATGPT_REVIEW`；**不**等于已目测、已验收或已接受） |
| 本轮正式验收执行状态 | `formal_acceptance_execution_status=NOT_RUN`（新增 `CCFG-AC-077~089` 亦全部 `NOT_RUN`） |
| 第二轮调整任务编号 | `CLIENT-CONFIG-VISUAL-FOLLOWUP-BASELINE-001-V2`（2026-09-23，第二轮主列表视觉调整**草案**，对应报告见 §2 导航） |
| 第二轮调整基线状态 | `adjustment2_baseline_status=DRAFT_PENDING_USER_REVIEW`（已经 ChatGPT 从远程 Git 对 V2 草案的独立复审、结论 `CHANGES_REQUIRED`，当前由 R1 纠错任务 `CLIENT-CONFIG-VISUAL-FOLLOWUP-BASELINE-001-V2-R1` 定向修订；**未**获项目负责人批准） |
| 第二轮调整实现状态 | `adjustment2_implementation_status=NOT_STARTED`（本轮草案尚未实现） |

### 1.1 本轮页面级调整分层状态（2026-09-22，R1 修订；同日批准收口后更新为 `APPROVED`）

本轮任务 `CLIENT-CONFIG-QUERY-LIST-AND-LIST-TABLE-ADJUSTMENT-BASELINE-001`（R1：`-001-R1`，纯文档）按项目负责人已明确确认的 9 项页面调整决定、以及 R1 新增的两项冻结决定（行选中能力整体取消、历史异常 `FG_ACTIVE` 红色 `异常：{原始值}`），为 `/config/client` 单页建立页面级调整基线。该基线经 R2 证据纠错、R3 最小纠错后，已由 ChatGPT 从远程 Git 复审（R3 结论 `APPROVED`）并由项目负责人于 2026-09-22 批准收口。当前分层状态如下：

```text
existing_feature_implementation_status=IMPLEMENTED_PENDING_USER_ACCEPTANCE
adjustment_baseline_status=APPROVED
adjustment_approval_status=APPROVED_BY_PROJECT_OWNER
adjustment_approval_date=2026-09-22
adjustment_approved_reviewed_commit=5066c761f8a9400d5841222cb73b0c03f56a82d0
adjustment_implementation_status=NOT_STARTED
formal_acceptance_execution_status=NOT_RUN
PENDING_USER_CONFIRMATION=0
next_entry=CHATGPT_REMOTE_BASELINE_APPROVAL_CLOSEOUT_R2_REVIEW
```

- **历史状态与当前状态必须区分（不得删除或伪装 R0/R1/R2/R3 记录）**：本轮新增/修订条款在批准前曾为 `DRAFT_PENDING_USER_REVIEW`；R1 阶段 ChatGPT 对 R0 的复审结论为 `CHANGES_REQUIRED`、R2 阶段对 R1 为 `CHANGES_REQUIRED`、R3 阶段对 R2 为 `CHANGES_REQUIRED`，R3 结果随后获 ChatGPT `APPROVED` 并由项目负责人批准。当前 `adjustment_baseline_status=APPROVED` 只表示**页面调整基线**获批，**不**表示页面已实现、已目测、已测试或验收已通过。
- **不得抹除旧实现事实**：本 Feature 的既有实际实现状态为 `IMPLEMENTED_PENDING_USER_ACCEPTANCE`（既有实现已完成、尚待项目负责人验收），该事实保持原样、**不**因本轮页面调整改写；只有**本轮页面级调整实现**为 `NOT_STARTED`。
- **验收分层**：全部 89 条（既有 76 条 `CCFG-AC-001~076` + 本轮新增 13 条 `CCFG-AC-077~089`）**全部 `NOT_RUN`**。不得把本轮调整基线批准写成“已实现”“已测试”或“验收通过”。
- **页面级授权 ≠ 模板级全局授权（2026-09-22 批准收口后口径）**：项目负责人**已授予** `/config/client` 的**页面级选择性接入授权**（查询列表页模板侧采用页面壳/查询面板/操作区/结果面板四组件、**不**接入刷新工具栏；列表表格视觉模板侧仅覆盖本页**主列表**，不含新增/编辑弹窗与弹窗内控件）。本次批准收口**不新增、不扩大**该授权范围；该页面级授权与本次页面调整基线批准**均不等于**本轮实现已授权或已完成。两套公共模板的**模板级全局迁移状态**（`page_migration_status=NOT_STARTED`、`page_migration_authorization_status=NOT_GRANTED`、`pilot_page_selection_status=NOT_DECIDED`）**保持不变**，**其他页面未被授权**。
- **待确认项清零**：`PENDING_USER_CONFIRMATION=0`；行单选/选中行高亮/“已选择：{探针ID}”取消与异常 `FG_ACTIVE` 红色 `异常：{原始值}` 均为项目负责人本轮已冻结决定，不再作为待确认项、风险项或实现自由度。

### 1.2 本轮页面级调整基线批准收口（2026-09-22，纯文档）

| 项目 | 值 |
|---|---|
| 批准任务编号 | `CLIENT-CONFIG-QUERY-LIST-AND-LIST-TABLE-ADJUSTMENT-BASELINE-APPROVAL-CLOSEOUT-001` |
| 证据链 | R0 草案提交 `fba09d17a471f7a4d1c7e56c07cfe9e6d1420dd1` → R1 修订提交 `2c2b2a71fcd049a68f86339d225f659af69e81c3` → R2 证据纠错提交 `5e0731aef0e36c1be9b87eba660e9b8c4a052555` → R3 最小纠错提交 `5066c761f8a9400d5841222cb73b0c03f56a82d0` |
| ChatGPT 复审对象 / 结论 | 远程提交 `5066c761f8a9400d5841222cb73b0c03f56a82d0`；结论 `APPROVED` |
| 项目负责人批准 | 于 2026-09-22 明确回复原话：`批准本轮探针端管理页面调整基线` |
| 批准对象 | `CCFG-REQ-091~103` 及本轮对既有需求的定向修订；`CCFG-AC-077~089` 及本轮对既有验收的定向修订；`CCFG-DESIGN-038~046` 及相关定向修订；`CCFG-UI-027~035` 及相关定向修订；R1 冻结的两项项目负责人决定（取消行单选/选中高亮/“已选择：{探针ID}”；异常 `FG_ACTIVE` 红色 `异常：{原始值}`，异常行“更多”仅含“停用”和“删除”）。**仅限** `/config/client` 单页，**不**扩大到 API、数据库契约、其他页面或模板级全局迁移 |
| 状态变化 | 仅 `adjustment_baseline_status` 由 `DRAFT_PENDING_USER_REVIEW` 变为 `APPROVED`（并记录 `adjustment_approval_status=APPROVED_BY_PROJECT_OWNER`） |
| 保持不变的计数与状态 | 需求/验收/设计/UI 定义 103/89/46/35；89 条验收全部 `NOT_RUN`；覆盖 103/103；`PENDING_USER_CONFIRMATION=0`；`adjustment_implementation_status=NOT_STARTED`；`formal_acceptance_execution_status=NOT_RUN` |
| 下一入口 | 2026-09-22 批准收口时的**历史入口**：`CHATGPT_REMOTE_BASELINE_APPROVAL_CLOSEOUT_REVIEW`（该远程复审已完成并返回 `CHANGES_REQUIRED`，由 R1/R2 纠错任务承接）；该记录时点的下一入口为 `CHATGPT_REMOTE_BASELINE_APPROVAL_CLOSEOUT_R2_REVIEW`（已由后续独立页面调整实现任务承接，**当前**下一入口见 §1.4） |

### 1.3 本轮页面级调整实现（2026-09-23）

独立实现任务 `CLIENT-CONFIG-QUERY-LIST-AND-LIST-TABLE-ADJUSTMENT-IMPLEMENTATION-001` 已按已批准基线实现 `/config/client` 单页调整（起始提交 `40d28125de5d7977936a35bca193ccf4489d65b7`，对应报告见 §2 导航）。该实现任务**完成时点**的分层状态如下（该实现其后已经 ChatGPT 从远程 Git 独立代码复审通过，**当前**分层状态见 §1.4）：

```text
existing_feature_implementation_status=IMPLEMENTED_PENDING_USER_ACCEPTANCE
adjustment_baseline_status=APPROVED
adjustment_approval_status=APPROVED_BY_PROJECT_OWNER
adjustment_approval_date=2026-09-22
adjustment_approved_reviewed_commit=5066c761f8a9400d5841222cb73b0c03f56a82d0
adjustment_implementation_status=IMPLEMENTED_PENDING_CHATGPT_REVIEW
formal_acceptance_execution_status=NOT_RUN
PENDING_USER_CONFIRMATION=0
next_entry=CHATGPT_REMOTE_CLIENT_CONFIG_PAGE_ADJUSTMENT_IMPLEMENTATION_REVIEW
```

- **实现范围**：仅在 `frontend/src/views/client-config/ClientConfigPage.vue` 与 `ClientConfigPage.spec.ts` 两文件实施页面级调整（无新增定向测试文件），并同步当前状态文档；两套公共模板实现、数据源管理参考页、路由/菜单、前端 API 类型与接口、后端代码、数据库对象与构建依赖**均未修改**。
- **实现内容**：接入 `QueryListPageShell`/`QueryListQueryPanel`/`QueryListActions`/`QueryListResultPanel` 四组件（**不**接入刷新工具栏/倒计时/最近刷新时间）；主列表六列固定顺序 序号｜探针 ID｜探针描述｜采集数据源｜数据源数量｜操作（最右 `fixed="right"`）；结果区左侧摘要、右侧“新增探针”；取消“删除所选”、行单选、选中高亮与“已选择：{探针ID}”及独立“状态”列；探针 ID 后按 `FG_ACTIVE` 三态显示（`'1'` 无标记、`'0'` 与数据源管理同款“停用”标记、其余历史异常红色 `异常：{原始值}`，不可见单空白以可见定界符如实呈现）；“更多”菜单按行态给出 停用/启用 + 删除；主表以显式根类接入列表表格视觉预设（仅主表）；页面“刷新失败”提示改为普通加载语义“列表加载失败 / 重试”。
- **状态边界**：`adjustment_implementation_status=IMPLEMENTED_PENDING_CHATGPT_REVIEW` 只表示**代码实现已完成并停在 ChatGPT 远程复审入口**；**不**表示已通过项目负责人目测、已执行正式验收或已获最终接受。全部 89 条验收（既有 76 条 + `CCFG-AC-077~089` 13 条）仍**全部 `NOT_RUN`**，覆盖保持 103/103，`PENDING_USER_CONFIRMATION=0` 保持。浏览器只读实机目测因运行条件不具备（无可用开发服务与浏览器自动化工具，且不得擅自安装）记为 `BROWSER_BLOCKED_RUNTIME_UNAVAILABLE`，如实留待用户页面目测，未伪造任何截图或视觉通过结论。
- **页面级授权 ≠ 模板级全局授权（本次实现后口径不变）**：项目负责人**已授予** `/config/client` 的页面级选择性接入授权（查询列表页模板侧四组件、**不**接入刷新工具栏；列表表格视觉模板侧仅覆盖本页**主列表**）。本次实现**不新增、不扩大**该授权范围；两套公共模板的**模板级全局迁移状态**（`page_migration_status=NOT_STARTED`、`page_migration_authorization_status=NOT_GRANTED`、`pilot_page_selection_status=NOT_DECIDED`）**保持不变**，数据源管理参考页最终接受状态**不变**，**其他页面未被授权**。
- **时序说明（2026-09-23 追加，不改写以上历史表述）**：本轮实现起始提交为 `de23b68d1999425d14c2753515b237711147b826`；截至 2026-09-23，该页面级调整实现**已**经 ChatGPT 从远程 Git 独立代码复审通过，`next_entry=CHATGPT_REMOTE_CLIENT_CONFIG_PAGE_ADJUSTMENT_IMPLEMENTATION_REVIEW` **属该时点的历史入口**。本节此前所述实现状态 `IMPLEMENTED_PENDING_CHATGPT_REVIEW` 为历史状态表述；此处仅追加时序说明，**不**改写实现定义、**不**宣布页面最终接受、**不**改变 89 条验收 `NOT_RUN` 的执行状态。

### 1.4 第二轮主列表视觉调整草案（2026-09-23，`DRAFT_PENDING_USER_REVIEW`）

第二轮任务 `CLIENT-CONFIG-VISUAL-FOLLOWUP-BASELINE-001-V2`（纯文档）依据项目负责人查看 `/config/client` 与 `/config/data-source` 页面后**已明确确认的五项视觉调整决定**，为 `/config/client` **主列表**建立新一轮调整**草案**。本提示词完整取代此前被项目负责人取消的 `...BASELINE-001-Agent-Prompt.md`（V1），V1 不作为现行任务执行、提交或引用。当前分层状态如下：

```text
existing_feature_implementation_status=IMPLEMENTED_PENDING_USER_ACCEPTANCE
adjustment_baseline_status=APPROVED
adjustment_implementation_status=IMPLEMENTED_PENDING_USER_ACCEPTANCE
adjustment2_baseline_status=DRAFT_PENDING_USER_REVIEW
adjustment2_implementation_status=NOT_STARTED
formal_acceptance_execution_status=NOT_RUN
PENDING_USER_CONFIRMATION=0
next_entry=CHATGPT_REMOTE_CLIENT_CONFIG_VISUAL_FOLLOWUP_BASELINE_V2_R1_REVIEW
```

五项调整：① 结果区最右侧“新增探针”改为参考页“新增数据源”同款**黑色实心按钮**（保留加号/文案/位置/行为，不改“查询”“重置”）；② “探针 ID”**正文**采用参考页“数据源 ID”同款字重与颜色（停用/异常标识语义与视觉保持，省略与编辑入口不变）；③ 主列表行高跟随参考页“数据源管理”主列表**实际行高规则**（移除本页固定像素行高，改由公共表格视觉预设的单元格内边距与内容决定；不改全局模板与公共预设、公共层不新增行高令牌）；④ “采集数据源”标签借用参考页“角色”标签视觉语言并采用**绿色／红色／中性色**三态（有项级 `anomalies` → 红；否则整行 `COMMA_PROTOCOL_AMBIGUOUS` → 中性；否则 → 绿，语义为“当前未检测到异常”而非“目标库”角色；红色异常不因整行歧义降级，整行歧义提示保留；ORG／ID 回退、异常优先、最多 6 个、`+N` 与完整清单语义保持，尺寸变更须同步核准测量盒模型）；⑤ 操作列**全部行**的“更多”文字统一改为**水平三点图标（Ellipsis）**（菜单柔和圆角/弥散阴影/适当内边距/清晰 Hover 与焦点、以分隔线单独隔开红色“删除”、可键盘操作、右边缘不裁切；点击/双击触发器与菜单不冒泡触发行双击编辑；下拉条目仍严格按 `FG_ACTIVE` 三态）。**不改项**：“探针描述”列宽维持现状（长文本省略）、现有查询条件、**刷新能力缺席**、六列顺序、CRUD 合同、Tooltip 业务信息与弹窗功能不变。

- **状态分层与批准边界**：本轮草案基线为 `DRAFT_PENDING_USER_REVIEW`、本轮实现为 `NOT_STARTED`、本轮验收为 `NOT_RUN`（`CCFG-AC-090~104`，15 条新增，全文件 104 条全部 `NOT_RUN`）。**项目负责人对五项产品决策的口头/聊天确认不等于本轮草案已经复审和正式批准，更不等于调整已实现或验收通过。**
- **参考来源效力边界**：参考页 `/config/data-source` **仅作视觉对照**，本轮规则**只**作用于 `/config/client` 主列表；**不**修改数据源管理的代码、文档、状态、行为，**不**修改模板级全局配置。所有 `#hex`/像素数值均为**参考页实现事实**，用户提供截图是**期望视觉来源**而非测试通过证据；实现须以真实参考页样式与实际视口为准。
- **历史保持不改写**：§1.1/§1.2/§1.3 记载的第一轮已批准基线（`adjustment_baseline_status=APPROVED`）、既有实现事实（`IMPLEMENTED_PENDING_USER_ACCEPTANCE`）与第一轮实现事实**保持真实、不改写、不抹除**；`CCFG-REQ-001~103`、`CCFG-AC-001~089`、`CCFG-DESIGN-001~046`、`CCFG-UI-001~035` 定义行**逐字节零变化**。本轮草案**不**自动继承上一轮批准，需另行 ChatGPT 远程复审与项目负责人批准。
- **不涉及范围**：本轮**不改** `API.md`/`DATABASE.md`、**不改**任何业务代码/测试/前端或后端源文件、**不改** `docs/baseline/**` 与模板级全局状态（`NOT_STARTED`/`NOT_GRANTED`/`NOT_DECIDED`）；`PENDING_USER_CONFIRMATION=0`。

## 2. 文档导航

| 文档 | 职责 | 状态 |
|---|---|---|
| `README.md`（本文件） | Feature 定位、文档导航与状态 | 已随 Feature 基线状态更新（2026-09-03）；R1 定向修订同步（2026-09-04）；并发口径调整草案同步（2026-09-04）；并发口径调整 R1 定向修订同步（2026-09-04）；并发口径调整批准收口同步（2026-09-04）；设计并发口径调整同步（2026-09-04）；设计并发口径调整批准收口同步（2026-09-04）；页面级调整草案同步（2026-09-22）；页面级调整草案 R1 偏差修正同步（2026-09-22）；页面级调整基线批准收口同步（2026-09-22）；页面级调整实现同步（2026-09-23）；第二轮主列表视觉调整草案同步（2026-09-23）；第二轮视觉调整草案 R1 纠错（行级歧义警示颜色勘误、`CCFG-AC-093` 窄视口预期收窄、当前状态/入口与历史时点一致）同步（2026-09-23） |
| `REQUIREMENTS.md` | 需求基线（`CCFG-REQ-001~090` 已批准；本轮新增 `CCFG-REQ-091~103` 已随本轮页面调整基线于 2026-09-22 批准） | `APPROVED`（2026-09-03 曾 `APPROVED`，因并发口径调整于 2026-09-04 转为待复审草案：取消旧需求的并发“最多一个成功”强承诺（`LOCK TABLE ... WAIT 5` 是后续未批准设计草案的方案，本轮已过时），改为尽力写前检查 + 已接受并发边界；首版调整结果经 ChatGPT 正式复审 `CHANGES_REQUIRED`（R1-01~R1-04），R1 定向修订完成后，ChatGPT 对 R1 结果提交 `f2a4d7d...` 正式复审 `APPROVED`，项目负责人于 2026-09-04 明确回复“批准”，经并发口径调整批准收口重新收口为 `APPROVED`；批准的是需求基线，不代表功能已实现或验收已通过；调整前批准历史见 §1.1，本轮批准信息见 §1.2）——**本轮页面级调整基线（2026-09-22，已批准）**：新增 §1.3 分层状态块与 §7.10（`CCFG-REQ-091~103`，13 条），定向修订 `CCFG-REQ-011/020/021/022/023/025/028/029/034/042`；新增部分与修订部分已随本轮页面调整基线于 2026-09-22 批准（批准前为 `DRAFT_PENDING_USER_REVIEW`），实现仍为 `NOT_STARTED`、验收仍为 `NOT_RUN`；`CCFG-REQ-001~090` 主体历史批准链保留不改写。**第二轮主列表视觉调整草案（2026-09-23，`DRAFT_PENDING_USER_REVIEW`）**：新增 §7.11 与 `CCFG-REQ-104~112`（9 条），并在 §7.10 前言追加时序说明（该节历史 `NOT_STARTED`/`NOT_RUN` 表述属该时点事实；页面级调整实现已于 2026-09-23 完成并通过 ChatGPT 远程代码复审，定义行未改写）；编号总数更新为 `CCFG-REQ-001~112`（112 条）、覆盖 112/112，`CCFG-REQ-001~103` 定义行逐字节零变化；新增部分**尚未**复审、**尚未**批准） |
| `ACCEPTANCE.md` | 验收标准（`CCFG-AC-001~104`，全部 `NOT_RUN`） | `APPROVED`（2026-09-03 曾 `APPROVED`，因并发口径调整于 2026-09-04 转为待复审草案，首版调整结果经 ChatGPT 正式复审 `CHANGES_REQUIRED`、R1 定向修订完成后，ChatGPT 对 R1 结果提交 `f2a4d7d...` 正式复审 `APPROVED`、项目负责人于 2026-09-04 明确回复“批准”，经并发口径调整批准收口重新收口为 `APPROVED`；批准的是验收标准，不是验收执行结果；76 条用例仍全部 `NOT_RUN`）——**本轮页面级调整基线（2026-09-22，已批准）**：新增 §1.3 分层状态块与 `CCFG-AC-077~089`（13 条），R0 定向修订 `CCFG-AC-002/009/016/017/018/019/021/022/023/025/026/032`，**R1 修正后的本轮修订用例清单为** `CCFG-AC-002/009/016/017/018/019/020/021/022/023/025/026/032/082/087/088/089`（17 条，含 R0 漏记的 `016`/`023` 与 R1 追加项，见 `ACCEPTANCE.md` §1.4）；验收由 76 条增至 **89 条**，需求→验收覆盖 **103/103（100%）**，**89 条执行状态全部为 `NOT_RUN`**。**第二轮主列表视觉调整草案（2026-09-23，`DRAFT_PENDING_USER_REVIEW`）**：新增 §1.6 分层状态块与 `CCFG-AC-090~104`（15 条），验收总数增至 **104 条**、覆盖更新为 **112/112（100%）**、**104 条执行状态全部为 `NOT_RUN`**；`CCFG-AC-001~089` 定义行逐字节零变化，新增部分**尚未**复审、**尚未**批准 |
| `DESIGN.md` | 逻辑设计（`CCFG-DESIGN-001~037` 已批准；本轮新增 `CCFG-DESIGN-038~046` 已随本轮页面调整基线于 2026-09-22 批准；第二轮新增 `CCFG-DESIGN-047~053` 为 V2 草案，含并发/锁方案、追踪矩阵） | `APPROVED`（2026-09-03 设计草案；初版正式设计复审结论 `CHANGES_REQUIRED`，2026-09-04 R1 已定向修订；同日设计并发口径定向调整任务 `CLIENT-CONFIG-DESIGN-CONCURRENCY-ADJUSTMENT-001` 按已重新批准的需求并发口径完成设计调整（移除该过时表锁方案）；调整结果经 ChatGPT 对提交 `ba7c5e9...` 正式复审（`CHATGPT_FORMAL_DESIGN_CONCURRENCY_ADJUSTMENT_REVIEW`）结论 `APPROVED`，项目负责人于 2026-09-04 明确回复“批准”，经批准收口任务 `CLIENT-CONFIG-DESIGN-CONCURRENCY-ADJUSTMENT-APPROVAL-001` 收口为 `APPROVED`、`PENDING_USER_CONFIRMATION=0`，可用于后续实现；批准的是设计基线，不代表代码已实现、已测试或验收已执行通过）——**本轮页面级调整基线（2026-09-22，已批准）**：新增 §13 与 `CCFG-DESIGN-038~046`（9 条），§12 追踪矩阵更新为 103/103 与 89/89；新增部分已随本轮页面调整基线于 2026-09-22 批准（批准前为 `DRAFT_PENDING_USER_REVIEW`），实现仍为 `NOT_STARTED`；`CCFG-DESIGN-001~037` 业务定义原文保留不改写，仅 `CCFG-DESIGN-021` 追加一条“入口位置由 §13 取代”的定向修订标注（语义不变）。**第二轮主列表视觉调整草案（2026-09-23，`DRAFT_PENDING_USER_REVIEW`）**：新增 §14 与 `CCFG-DESIGN-047~053`（7 条），§12 追踪矩阵更新为 112/112 与 104/104；`CCFG-DESIGN-001~046` 定义行逐字节零变化，新增部分**尚未**复审、**尚未**批准、**尚未**实现 |
| `API.md` | 接口契约（`CCFG-API-001~020`，接口 E1~E7、错误码表） | `APPROVED`（2026-09-03 设计草案；初版正式设计复审结论 `CHANGES_REQUIRED`，2026-09-04 R1 已定向修订；同日设计并发口径定向调整任务 `CLIENT-CONFIG-DESIGN-CONCURRENCY-ADJUSTMENT-001` 按已重新批准的需求并发口径完成设计调整（移除该过时错误码方案）；调整结果经 ChatGPT 对提交 `ba7c5e9...` 正式复审（`CHATGPT_FORMAL_DESIGN_CONCURRENCY_ADJUSTMENT_REVIEW`）结论 `APPROVED`，项目负责人于 2026-09-04 明确回复“批准”，经批准收口任务 `CLIENT-CONFIG-DESIGN-CONCURRENCY-ADJUSTMENT-APPROVAL-001` 收口为 `APPROVED`、`PENDING_USER_CONFIRMATION=0`，可用于后续实现；批准的是设计基线，不代表代码已实现、已测试或验收已执行通过，实现状态仍 `NOT_STARTED`） |
| `UI.md` | 界面设计（`CCFG-UI-001~026` 已批准；本轮新增 `CCFG-UI-027~035` 已随本轮页面调整基线于 2026-09-22 批准；第二轮新增 `CCFG-UI-036~042` 为 V2 草案，布局/交互/文案） | `APPROVED`（2026-09-03 设计草案；初版正式设计复审结论 `CHANGES_REQUIRED`，2026-09-04 R1 已定向修订；同日设计并发口径定向调整任务 `CLIENT-CONFIG-DESIGN-CONCURRENCY-ADJUSTMENT-001` 按已重新批准的需求并发口径完成设计调整（移除该过时文案方案）；调整结果经 ChatGPT 对提交 `ba7c5e9...` 正式复审（`CHATGPT_FORMAL_DESIGN_CONCURRENCY_ADJUSTMENT_REVIEW`）结论 `APPROVED`，项目负责人于 2026-09-04 明确回复“批准”，经批准收口任务 `CLIENT-CONFIG-DESIGN-CONCURRENCY-ADJUSTMENT-APPROVAL-001` 收口为 `APPROVED`、`PENDING_USER_CONFIRMATION=0`，可用于后续实现；批准的是设计基线，不代表代码已实现、已测试或验收已执行通过）——**本轮页面级调整基线（2026-09-22，已批准）**：新增 §15 与 `CCFG-UI-027~035`（9 条），`CCFG-UI-004/005/006/018/022/024` 部分口径被取代或收窄（原文保留不改写）；**R1（2026-09-22）**：冻结项目负责人两项决定——取消“删除所选”后**行单选/选中行高亮/“已选择：{探针ID}”整体取消**、历史异常 `FG_ACTIVE` 展示为**紧跟探针 ID 的红色 `异常：{原始值}`**（`CCFG-UI-031/035`），并定向清理 `CCFG-UI-004/005/006/032` 的旧行选中表述；新增部分已随本轮页面调整基线于 2026-09-22 批准（批准前为 `DRAFT_PENDING_USER_REVIEW`），实现仍为 `NOT_STARTED`，本轮 `PENDING_USER_CONFIRMATION=0`。**第二轮主列表视觉调整草案（2026-09-23，`DRAFT_PENDING_USER_REVIEW`）**：新增 §16 与 `CCFG-UI-036~042`（7 条），`CCFG-UI-004/005/007/010/029/032` 的部分口径被本轮**定向修订**（原文保留不改写）；`CCFG-UI-001~035` 定义行逐字节零变化，新增部分**尚未**复审、**尚未**批准、**尚未**实现 |
| `DATABASE.md` | 数据库使用设计（`CCFG-DB-001~022`，SQL 形态/事务锁矩阵） | `APPROVED`（2026-09-03 设计草案；初版正式设计复审结论 `CHANGES_REQUIRED`，2026-09-04 R1 已定向修订；同日设计并发口径定向调整任务 `CLIENT-CONFIG-DESIGN-CONCURRENCY-ADJUSTMENT-001` 按已重新批准的需求并发口径完成设计调整（移除该过时事务锁方案）；调整结果经 ChatGPT 对提交 `ba7c5e9...` 正式复审（`CHATGPT_FORMAL_DESIGN_CONCURRENCY_ADJUSTMENT_REVIEW`）结论 `APPROVED`，项目负责人于 2026-09-04 明确回复“批准”，经批准收口任务 `CLIENT-CONFIG-DESIGN-CONCURRENCY-ADJUSTMENT-APPROVAL-001` 收口为 `APPROVED`、`PENDING_USER_CONFIRMATION=0`，可用于后续实现；批准的是设计基线，不代表代码已实现、已测试或验收已执行通过，实现状态仍 `NOT_STARTED`，76 条验收仍全部 `NOT_RUN`） |
| `reports/CLIENT-CONFIG-REQUIREMENTS-BASELINE-001.md` | 需求与验收草案建立执行报告 | 已建立 |
| `reports/CLIENT-CONFIG-REQUIREMENTS-BASELINE-001-R1.md` | R1 定向修订执行报告 | 已建立 |
| `reports/CLIENT-CONFIG-REQUIREMENTS-BASELINE-APPROVAL-001.md` | 需求与验收基线批准收口执行报告 | 已建立 |
| `reports/CLIENT-CONFIG-DESIGN-BASELINE-001.md` | 设计基线草案建立执行报告 | 已建立 |
| `reports/CLIENT-CONFIG-DESIGN-BASELINE-001-R1.md` | 设计基线 R1 定向修订（正式复审 `CHANGES_REQUIRED`）执行报告 | 已建立（2026-09-04） |
| `reports/CLIENT-CONFIG-CONCURRENCY-REQUIREMENTS-ADJUSTMENT-001.md` | 并发口径定向调整草案（纯文档）执行报告 | 已建立（2026-09-04） |
| `reports/CLIENT-CONFIG-CONCURRENCY-REQUIREMENTS-ADJUSTMENT-001-R1.md` | 并发口径调整 R1 定向修订（正式复审 `CHANGES_REQUIRED`）执行报告 | 已建立（2026-09-04） |
| `reports/CLIENT-CONFIG-CONCURRENCY-REQUIREMENTS-ADJUSTMENT-APPROVAL-001.md` | 并发口径调整批准收口执行报告 | 已建立（2026-09-04） |
| `reports/CLIENT-CONFIG-DESIGN-CONCURRENCY-ADJUSTMENT-001.md` | 设计并发口径调整（正式需求并发口径重新批准驱动）执行报告 | 已建立（2026-09-04） |
| `reports/CLIENT-CONFIG-DESIGN-CONCURRENCY-ADJUSTMENT-APPROVAL-001.md` | 设计并发口径调整批准收口执行报告 | 已建立（2026-09-04） |
| `reports/CLIENT-CONFIG-QUERY-LIST-AND-LIST-TABLE-ADJUSTMENT-BASELINE-001.md` | 页面级查询列表页模板 + 列表表格视觉模板选择性接入调整基线草案执行报告 | 已建立（2026-09-22） |
| `reports/CLIENT-CONFIG-QUERY-LIST-AND-LIST-TABLE-ADJUSTMENT-BASELINE-001-R1.md` | 页面级调整基线草案 R1 偏差修正（ChatGPT 对 R0 复审 `CHANGES_REQUIRED` 驱动，含项目负责人两项冻结决定）执行报告 | 已建立（2026-09-22） |
| `reports/CLIENT-CONFIG-QUERY-LIST-AND-LIST-TABLE-ADJUSTMENT-BASELINE-001-R2.md` | R1 报告证据纠错（ChatGPT 对 R1 复审 `CHANGES_REQUIRED` 驱动的追加式证据纠错）执行报告 | 已建立（2026-09-22） |
| `reports/CLIENT-CONFIG-QUERY-LIST-AND-LIST-TABLE-ADJUSTMENT-BASELINE-001-R3.md` | R2 报告摘要最小证据纠错（ChatGPT 对 R2 复审 `CHANGES_REQUIRED` 驱动）执行报告 | 已建立（2026-09-22） |
| `reports/CLIENT-CONFIG-QUERY-LIST-AND-LIST-TABLE-ADJUSTMENT-BASELINE-APPROVAL-CLOSEOUT-001.md` | 页面级调整基线批准收口（项目负责人批准驱动，`APPROVED`）执行报告 | 已建立（2026-09-22） |
| `reports/CLIENT-CONFIG-QUERY-LIST-AND-LIST-TABLE-ADJUSTMENT-IMPLEMENTATION-001.md` | 页面级调整实现（`/config/client` 单页，接入四组件 + 主列表视觉预设，取消行选中/独立状态列，ID 三态标识与“更多”菜单）执行报告 | 已建立（2026-09-23） |
| `reports/CLIENT-CONFIG-VISUAL-FOLLOWUP-BASELINE-001-V2.md` | 第二轮主列表视觉调整基线草案（五项：黑色实心新增按钮、ID 正文对齐、行高跟随参考页、采集数据源标签三态、操作列三点图标菜单）执行报告 | 已建立（2026-09-23，草案 `DRAFT_PENDING_USER_REVIEW`） |
| `reports/CLIENT-CONFIG-VISUAL-FOLLOWUP-BASELINE-001-V2-R1.md` | 第二轮主列表视觉调整草案 R1 纠错（ChatGPT 对 V2 复审 `CHANGES_REQUIRED` 驱动：行级歧义警示颜色越界勘误、`CCFG-AC-093` 窄视口预期收窄、当前状态/入口与历史时点一致）执行报告 | 已建立（2026-09-23） |

## 3. Feature 定位

“探针端管理”用于维护 Oracle 表 `CDC_CLIENT_MULTIPLE` 的探针配置（探针 ID、探针描述、采集数据源、启停状态）。`sync-client` 进程用自身 `client_id` 命中 `CLIENT_ID` 相同且 `FG_ACTIVE=1` 的记录并读取其采集数据源。本 Feature 只维护数据库配置，不直接启停、通知进程，不操作 ZooKeeper、Kafka 或 Topic。

## 4. 当前状态

- 旧口径批准历史：需求基线 `REQUIREMENTS.md`（`CCFG-REQ-001~090`，90 条）与验收标准 `ACCEPTANCE.md`（`CCFG-AC-001~076`，76 条）曾于 2026-09-03 获项目负责人正式批准（ChatGPT 对 R1 结果正式复审结论 `APPROVED`，项目负责人明确回复“批准”），旧口径状态为 `APPROVED`。该次批准只覆盖旧口径的并发强保证目标（并发“最多一个成功”强承诺；当时需求只要求后续设计确定事务/锁/原子方案，未批准任何具体表锁语句，`LOCK TABLE ... WAIT 5` 是随后形成、始终未获项目负责人批准的设计草案方案），不代表功能已实现或验收已通过；后续因并发口径调整进入本轮待复审草案状态，经 ChatGPT 对 R1 结果正式复审 `APPROVED` 与项目负责人 2026-09-04 批准后重新收口为 `APPROVED`（见下条）；旧批准不自动批准本轮调整。
- 并发口径调整草案（2026-09-04，`CLIENT-CONFIG-CONCURRENCY-REQUIREMENTS-ADJUSTMENT-001`，纯文档）：按项目负责人明确决定，配置平台不再为保证数据源唯一分配执行 Oracle 显式表锁，取消并发“最多一个成功”强承诺，改为“新增/编辑/启用写入前重新读取 + 尽力写前检查 + 已接受极端并发下两笔先后都成功的边界”；运行侧 `sync-client`/`sync-server` 使用配置时的重复检查为最终防线但不属本 Feature 范围。受影响需求 `CCFG-REQ-038/068/071/072/074/077`、验收 `CCFG-AC-030/056/058/059/061/064`；`REQUIREMENTS.md` 与 `ACCEPTANCE.md` 状态由旧口径 `APPROVED` 调整为 `DRAFT_PENDING_USER_REVIEW`。ChatGPT 对首版调整结果（提交 `6071d7a...`）正式复审结论为 `CHANGES_REQUIRED`（R1-01~R1-04）；R1 定向修订（`CLIENT-CONFIG-CONCURRENCY-REQUIREMENTS-ADJUSTMENT-001-R1`，2026-09-04，对应报告见 §2 导航）已完成；ChatGPT 对 R1 结果提交 `f2a4d7d...` 正式复审结论为 `APPROVED`（`CHATGPT_FORMAL_REQUIREMENTS_ADJUSTMENT_R1_REVIEW`），项目负责人于 2026-09-04 明确回复“批准”，`REQUIREMENTS.md` 与 `ACCEPTANCE.md` 经批准收口任务 `CLIENT-CONFIG-CONCURRENCY-REQUIREMENTS-ADJUSTMENT-APPROVAL-001` 重新收口为 `APPROVED`（对应报告见 §2 导航）；2026-09-03 批准保留为历史，不自动批准本轮调整（本轮依据独立复审与项目负责人明确回复）。
- **【历史记录 · 已被后续实现与收口取代，不代表当前状态】** 设计基线阶段曾记录“实现状态仍为 `NOT_STARTED`：尚未实现任何页面、接口或写库能力；页面/菜单仍为占位，用户可见名称仍为‘客户端配置’”。该表述属**历史事实**（对应设计草案阶段），已由后续实现事实取代：当前 `existing_feature_implementation_status=IMPLEMENTED_PENDING_USER_ACCEPTANCE`，且页面标题、菜单与面包屑已统一为“探针端管理”（见 §1）；仅**本轮页面级调整实现**为 `adjustment_implementation_status=NOT_STARTED`。
- 正式验收执行状态仍为 `formal_acceptance_execution_status=NOT_RUN`：全部 89 条验收用例（既有 76 条 + 本轮新增 13 条）均未执行，不得把已批准需求/验收标准中的目标规则描述为当前已实施事实，不得写成“验收通过”。
- `DESIGN.md`/`API.md`/`UI.md`/`DATABASE.md` 已于 2026-09-03 建立设计基线草案（`CLIENT-CONFIG-DESIGN-BASELINE-001`），状态均为 `DRAFT_PENDING_USER_REVIEW`、`PENDING_USER_CONFIRMATION=0`；当时本 Feature 尚未进入实现阶段，四份文档为草案、其中表锁/锁等待方案从未获项目负责人批准（不得写成原表锁设计曾获批准）；不因建立设计草案而改变已批准需求/验收，也不修改任何数据库基线。因本轮需求并发口径调整（2026-09-04）重新批准后，设计并发口径定向调整任务 `CLIENT-CONFIG-DESIGN-CONCURRENCY-ADJUSTMENT-001`（2026-09-04，纯文档）已从四份设计文档中移除已过时的 `LOCK TABLE ... WAIT 5` 表锁/锁等待错误码（`ORA-30006→50050`）方案并按已重新批准口径调整设计，四份文档整体标记由 `STALE_LOCK_DESIGN_PENDING_DESIGN_REVISION` 更新为 `DESIGN_CONCURRENCY_ADJUSTED_PENDING_FORMAL_REVIEW`（当时仍为 `DRAFT_PENDING_USER_REVIEW`、`PENDING_USER_CONFIRMATION=0`）。该调整结果随后经 ChatGPT 对提交 `ba7c5e9...` 正式复审 `APPROVED`、项目负责人于 2026-09-04 明确回复“批准”，四份设计文档经批准收口任务 `CLIENT-CONFIG-DESIGN-CONCURRENCY-ADJUSTMENT-APPROVAL-001` 收口为 `APPROVED`（见下两条）。
- ChatGPT 对初版设计草案提交 `21f4729c43d146426e8d4f1b2d6b667cfcf160ff` 的正式设计复审结论为 `CHANGES_REQUIRED`（R1-01~R1-09）。`CLIENT-CONFIG-DESIGN-BASELINE-001-R1`（2026-09-04，纯文档）已完成定向修订：API 设计编号重排为 `CCFG-API-001~020` 连续唯一；四文档编号范围同步为 `CCFG-DESIGN-001~037`/`CCFG-API-001~020`/`CCFG-UI-001~026`/`CCFG-DB-001~022`；数据源数组固定“原存储顺序返回 + 前端非持久化前三项投影”单一契约；`CLIENT_DESC` 固定原文保存、Trim 仅判空、按原文计 UTF-8 字节；关键词 LIKE 增加 `\` 字面量转义与 `ESCAPE '\'`；删除未批准的数据源 ID“其他非法字符”限制；补齐 `CATEGORY_MISMATCH`/`TYPE_MISMATCH`、含逗号歧义（`COMMA_PROTOCOL_AMBIGUOUS`）与历史 NULL/空白 `CLIENT_DESC` 契约。修订后四文档状态保持 `DRAFT_PENDING_USER_REVIEW`、`PENDING_USER_CONFIRMATION=0`；受本轮需求并发口径调整影响，正式 R1 设计复审延后；需求调整 R1 结果已获 ChatGPT 正式复审 `APPROVED` 并由项目负责人于 2026-09-04 批准。设计并发口径定向调整任务 `CLIENT-CONFIG-DESIGN-CONCURRENCY-ADJUSTMENT-001`（2026-09-04，纯文档）已从四份设计文档中移除过时的表锁/锁等待错误码方案并按已批准并发口径调整设计（标记 `DESIGN_CONCURRENCY_ADJUSTED_PENDING_FORMAL_REVIEW`，当时仍为 `DRAFT_PENDING_USER_REVIEW`、`PENDING_USER_CONFIRMATION=0`）。对设计并发口径调整结果的正式设计复审（`CHATGPT_FORMAL_DESIGN_CONCURRENCY_ADJUSTMENT_REVIEW`）已于 2026-09-04 完成、结论 `APPROVED`，项目负责人同日明确回复“批准”，四份设计文档经批准收口任务 `CLIENT-CONFIG-DESIGN-CONCURRENCY-ADJUSTMENT-APPROVAL-001` 收口为 `APPROVED`、`PENDING_USER_CONFIRMATION=0`（当前状态见下条）。
- 设计批准收口（2026-09-04，`CLIENT-CONFIG-DESIGN-CONCURRENCY-ADJUSTMENT-APPROVAL-001`，纯文档，对应报告见 §2 导航）：对设计并发口径调整结果的正式设计复审（`CHATGPT_FORMAL_DESIGN_CONCURRENCY_ADJUSTMENT_REVIEW`）对象为提交 `ba7c5e917b1b9d08208c3e1ceb31285407f5fd5e`、结论 `APPROVED`，项目负责人于 2026-09-04 明确回复“批准”；`DESIGN.md`/`API.md`/`UI.md`/`DATABASE.md` 四份设计文档状态已由 `DRAFT_PENDING_USER_REVIEW` 收口为 `APPROVED`、`PENDING_USER_CONFIRMATION=0`，整体标记由 `DESIGN_CONCURRENCY_ADJUSTED_PENDING_FORMAL_REVIEW` 收口为 `APPROVED_READY_FOR_IMPLEMENTATION`，可用于后续实现；37/20/26/22 条设计业务定义相对批准提交逐字零差异，覆盖保持需求 90/90、验收 76/76。批准的是设计基线，不代表代码已实现、已测试或验收已执行通过：实现状态仍为 `NOT_STARTED`，页面/菜单仍为占位、用户可见名称仍为“客户端配置”，76 条验收仍全部 `NOT_RUN`。下一入口为 `CLIENT_CONFIG_IMPLEMENTATION`（见 §5）。
- 基线影响项（如旧资料“客户端配置”“管理平台对 `CDC_CLIENT_MULTIPLE` 只读”“编辑时探针 ID 不可改”等表述、`CLIENT_DESC` 长度 256 与 1024 的数据库基线差异）已在 `REQUIREMENTS.md` §9 记录；其中 `CLIENT_DESC` 真实语义已确认为 `VARCHAR2(1024 BYTE)`，256 与 1024 的已批准数据库基线差异继续作为后续独立数据库基线同步事项保留。
- **【历史记录 · 草案建立阶段，已被 2026-09-22 批准收口取代，不代表当前状态】** 页面级调整草案（2026-09-22，`CLIENT-CONFIG-QUERY-LIST-AND-LIST-TABLE-ADJUSTMENT-BASELINE-001`，纯文档，对应报告见 §2 导航）：按项目负责人已明确确认的 9 项页面调整决定，为 `/config/client` 单页建立“查询列表页模板选择性接入（页面层）”与“列表表格视觉模板接入（主列表）”的调整基线草案。**可见结果**：列顺序改为 序号｜探针 ID｜探针描述｜采集数据源｜数据源数量｜操作（最右固定列）；“新增探针”移到结果区头部最右侧；取消“删除所选”与“状态”列及其行内启停；删除/启停入口改为“操作”列“更多”下拉（`FG_ACTIVE='1'` → 删除/停用；`'0'` → 删除/启用；历史异常 → 仅删除/停用）；探针 ID 后按 `FG_ACTIVE` 三态显示（`'1'` 无标记、`'0'` “停用”标记、其余历史异常红色 `异常：{原始值}`）；本页不提供任何刷新能力。**分层状态（草案阶段）**：该阶段为 `adjustment_baseline_status=DRAFT_PENDING_USER_REVIEW`、`adjustment_implementation_status=NOT_STARTED`、本轮正式验收 `NOT_RUN`；该草案后经 R2/R3 证据纠错并由项目负责人批准收口为 `APPROVED`（见 §1.1、§1.2）。**旧实现事实不被改写**：`existing_feature_implementation_status=IMPLEMENTED_PENDING_USER_ACCEPTANCE` 保留；全部 89 条验收仍 `NOT_RUN`。**本轮不改** `API.md`/`DATABASE.md`（接口与数据库契约不变）、**不改**任何业务代码或测试。**授权分层**：项目负责人**已授予** `/config/client` 的页面级选择性接入授权（查询列表页模板侧四组件、不接入刷新工具栏；列表表格视觉模板侧仅主列表），**该页面级授权与本次基线批准均不代表本轮实现已完成或已验收**；两套模板的**模板级全局状态保持不变**，**其他页面未被授权**。`PENDING_USER_CONFIRMATION=0`：R1 已冻结行选中能力整体取消与异常 `FG_ACTIVE` 红色 `异常：{原始值}` 两项决定（见 §1.1 与 `UI.md` §15）。
- 页面级调整基线批准收口（2026-09-22，`CLIENT-CONFIG-QUERY-LIST-AND-LIST-TABLE-ADJUSTMENT-BASELINE-APPROVAL-CLOSEOUT-001`，纯文档，对应报告见 §2 导航）：ChatGPT 从远程 Git 对 R3 结果提交 `5066c761f8a9400d5841222cb73b0c03f56a82d0` 的复审结论为 `APPROVED`，项目负责人于 2026-09-22 明确回复原话 `批准本轮探针端管理页面调整基线`，本轮页面级调整基线由 `DRAFT_PENDING_USER_REVIEW` 收口为 `APPROVED`（`adjustment_approval_status=APPROVED_BY_PROJECT_OWNER`）。**批准的是页面调整基线，不是代码、测试、目测结果或最终接受**：`existing_feature_implementation_status=IMPLEMENTED_PENDING_USER_ACCEPTANCE` 保持，该时点 `adjustment_implementation_status=NOT_STARTED` 保持，89 条验收全部 `NOT_RUN` 保持，覆盖 103/103、`PENDING_USER_CONFIRMATION=0` 保持；`API.md`/`DATABASE.md` 未修改，两套模板的模板级全局状态保持不变。
- 页面级调整实现（2026-09-23，`CLIENT-CONFIG-QUERY-LIST-AND-LIST-TABLE-ADJUSTMENT-IMPLEMENTATION-001`，前端实现任务，对应报告见 §2 导航）：按已批准基线实现 `/config/client` 单页调整，`adjustment_implementation_status` 由 `NOT_STARTED` 变为 `IMPLEMENTED_PENDING_CHATGPT_REVIEW`。**实现已完成，但不等同于已目测、已验收或已接受**：`existing_feature_implementation_status=IMPLEMENTED_PENDING_USER_ACCEPTANCE` 保持，全部 89 条验收仍 `NOT_RUN`，覆盖 103/103、`PENDING_USER_CONFIRMATION=0` 保持；`API.md`/`DATABASE.md` 未修改，两套模板的模板级全局状态与数据源管理参考页最终接受状态保持不变。实现细节与分层状态见 §1.3。（**时序说明**：该实现已于 2026-09-23 经 ChatGPT 从远程 Git 独立代码复审通过；此处仅追加时序说明，不改写上述历史表述。）
- 第二轮主列表视觉调整**草案**（2026-09-23，`CLIENT-CONFIG-VISUAL-FOLLOWUP-BASELINE-001-V2`，纯文档，对应报告见 §2 导航）：依据项目负责人查看 `/config/client` 与 `/config/data-source` 页面后**已明确确认的五项调整决定**，为 `/config/client` 主列表建立新一轮视觉调整草案——① “新增探针”改黑色实心按钮；② 探针 ID 正文字重颜色对齐参考页“数据源 ID”；③ 行高跟随参考页“数据源管理”主列表实际规则（移除固定像素、不改全局模板）；④ 采集数据源标签借用“角色”标签视觉语言并采用绿/红/中性色三态；⑤ 操作列“更多”统一改为水平三点图标菜单（含删除分隔线、键盘可访问、事件边界）。**分层状态**：本轮草案基线 `adjustment2_baseline_status=DRAFT_PENDING_USER_REVIEW`、本轮实现 `adjustment2_implementation_status=NOT_STARTED`、本轮验收 `NOT_RUN`（`CCFG-AC-090~104` 15 条新增，全文件 104 条全部 `NOT_RUN`）；覆盖更新为 112/112。**历史不被改写**：第一轮已批准基线、既有实现事实与第一轮实现事实保持真实，`CCFG-REQ-001~103`/`CCFG-AC-001~089`/`CCFG-DESIGN-001~046`/`CCFG-UI-001~035` 定义行逐字节零变化。**本轮不改** `API.md`/`DATABASE.md`、**不改**任何业务代码/测试/前端或后端源文件、**不改** `docs/baseline/**` 与模板级全局状态；`PENDING_USER_CONFIRMATION=0`。**用户同意五项 ≠ 文档已批准 ≠ 已实现 ≠ 已验收**（详见 §1.4）。


## 5. 下一入口

设计并发口径调整任务 `CLIENT-CONFIG-DESIGN-CONCURRENCY-ADJUSTMENT-001` 已于 2026-09-04 完成（纯文档）：从四份设计草案（`DESIGN.md`/`API.md`/`UI.md`/`DATABASE.md`）中移除已过时的 `LOCK TABLE ... WAIT 5`、`ORA-30006→50050` 及并发“最多一个成功”等设计，按已重新批准的需求并发口径调整设计并发表述（需求与验收已随本轮并发口径调整重新批准，ChatGPT 对 R1 结果提交 `f2a4d7d...` 正式复审 `APPROVED`，项目负责人于 2026-09-04 明确回复“批准”，`REQUIREMENTS.md`/`ACCEPTANCE.md` 已收口为 `APPROVED`）。设计并发口径调整结果已于 2026-09-04 完成正式设计复审与批准收口：ChatGPT 对提交 `ba7c5e9...` 的设计并发口径调整结果正式复审（`CHATGPT_FORMAL_DESIGN_CONCURRENCY_ADJUSTMENT_REVIEW`）结论 `APPROVED`，项目负责人于 2026-09-04 明确回复“批准”，四份设计文档经批准收口任务 `CLIENT-CONFIG-DESIGN-CONCURRENCY-ADJUSTMENT-APPROVAL-001` 收口为 `APPROVED`、`PENDING_USER_CONFIRMATION=0`，整体标记为 `APPROVED_READY_FOR_IMPLEMENTATION`（对应报告见 §2 导航）。下一入口为 `CLIENT_CONFIG_IMPLEMENTATION`：以已批准的需求（90 条）、验收（76 条、全部 `NOT_RUN`）与四份设计（37/20/26/22）为唯一业务基线进入实现阶段；该实现随后已完成（见 §4 既有实现事实 `IMPLEMENTED_PENDING_USER_ACCEPTANCE`），76 条验收保持全部 `NOT_RUN`；不得把已批准设计写成测试已通过或验收已通过。

**当前下一入口（第二轮主列表视觉调整草案 R1 起，覆盖以上历史入口）**：`CHATGPT_REMOTE_CLIENT_CONFIG_VISUAL_FOLLOWUP_BASELINE_V2_R1_REVIEW`（对象为第二轮主列表视觉调整草案 R1 纠错任务 `CLIENT-CONFIG-VISUAL-FOLLOWUP-BASELINE-001-V2-R1` 的结果提交；V2 草案任务 `CLIENT-CONFIG-VISUAL-FOLLOWUP-BASELINE-001-V2` 已提交 ChatGPT 远程复审、结论 `CHANGES_REQUIRED`，由 R1 承接；提交 SHA 由 ChatGPT 从远程 Git 取得，本文件不预造）。本任务是**纯文档草案**：新增 `CCFG-REQ-104~112`（9 条）、`CCFG-AC-090~104`（15 条）、`CCFG-DESIGN-047~053`（7 条）、`CCFG-UI-036~042`（7 条）；编号总数更新为 需求 112 / 验收 104 / 设计 53 / UI 42，覆盖 112/112，**104 条验收全部 `NOT_RUN`**。**状态分层**：本轮草案基线 `adjustment2_baseline_status=DRAFT_PENDING_USER_REVIEW`、本轮实现 `adjustment2_implementation_status=NOT_STARTED`；第一轮已批准基线与既有实现事实保持真实不改写。**下一步须由 ChatGPT 从远程 Git 对本次草案做独立复审**；**不得**把本次草案写成已批准、已实现、已目测或已验收，也不得在复审通过前继续进入代码实现。参考页 `/config/data-source` **仅作视觉对照**，本轮规则只作用于 `/config/client` 主列表，两套模板的模板级全局状态保持不变，**其他页面未被授权**。更早的历史入口 `CHATGPT_REMOTE_CLIENT_CONFIG_PAGE_ADJUSTMENT_IMPLEMENTATION_REVIEW`（2026-09-23 起，该实现已获 ChatGPT 远程代码复审通过）与 `CHATGPT_REMOTE_BASELINE_APPROVAL_CLOSEOUT_R2_REVIEW`、`CHATGPT_REMOTE_BASELINE_R1_REVIEW` 保留不改写。
