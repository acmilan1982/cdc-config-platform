# 源库快照状态 Feature — 查询按钮与表格布局稳定性调整基线草案 R1 文档口径纠正 执行报告

- 任务编号：`DATA-SOURCE-SNAPSHOT-STATUS-QUERY-BUTTON-AND-TABLE-LAYOUT-STABILITY-BASELINE-001-R1`
- 任务类型：**纯文档极小定向纠正**（不修改代码、不构建、不测试、不验收、不批准、不做最终接受收口）
- 日期：2026-09-15
- 分支：`develop`
- Base commit（任务开始前）：`be101a19558ae1ef1436bb3d61746dc21338e49a`
- 上游任务：`DATA-SOURCE-SNAPSHOT-STATUS-QUERY-BUTTON-AND-TABLE-LAYOUT-STABILITY-BASELINE-001`（R0，报告见同目录 `...-BASELINE-001.md`）
- 工作方式：独立隔离 worktree `/agent/dss-query-button-table-layout-baseline-001-r1`（detached HEAD，位于上述 base commit）；主工作区 `/agent/cdc-config-platform` 与全部既有 worktree 全程零触碰

---

## 1. 任务目标

按 ChatGPT 从远程 Git 对 R0 草案提交 `be101a19558ae1ef1436bb3d61746dc21338e49a` 的独立复审结论，执行一次纯文档、极小的定向 R1 纠正。

```text
chatgpt_r0_review_status=CHANGES_REQUIRED
review_scope=TWO_DOCUMENT_WORDING_CONFLICTS_ONLY
business_direction_status=CORRECT_AND_PRESERVED
```

本轮**只**纠正两类问题，不改变已确认的解决方向、不新增编号、不修改宽度值、不批准草案、不实现代码、不执行验收、不做最终接受收口。

---

## 2. R0 复审结论与纠正范围

ChatGPT 复核 R0 提交后确认以下内容**正确并全部冻结**：变更范围为 8 份入口文档加 1 份 R0 报告、无代码变更；真实根因链（查询结果行数变化 → 真实主内容滚动容器纵向滚动条出现/消失 → `clientWidth` 变化 → Element Plus 重新分配弹性列宽）；“共 N 条”不是直接根因；查询与重置目标宽度同为 `62px`、立即刷新保持 `110px`；`scrollbar-gutter: stable` 作用于真实主滚动容器且限定在 `/monitor/data-source-state` 路由范围；不固定所有表格列、不采用 JavaScript/`ResizeObserver` 补偿、不使用全局滚动条方案；需求 91、验收 118；既有 113 条 `PASS` 不变；新增 5 条验收全部 `NOT_RUN`；追踪 `91/91` 与 `118/118`；草案仍未批准、未实现、未验收。

变更需求**仅**限定为以下两项**文档措辞冲突**：

| # | 位置 | R0 内容 | 判定 | R1 处理 |
|---|---|---|---|---|
| 1 | `UI.md` §32.2 | 重置按钮仅 `width = 62px` | 错误：与 `DESIGN.md` §38.3、`ACCEPTANCE.md` `DSS-AC-114` 的四属性锁定口径冲突，也与紧随其后的“禁止只设 `width`”规则自相矛盾 | 原位改为 `width = min-width = max-width = flex-basis = 62px` |
| 2 | `ACCEPTANCE.md` `DSS-AC-114` | “短结果与长结果之间、‘查询’与‘重置’之间均一致” | 歧义：可能被误解为两个不同按钮的 `x`/`y` 坐标数值必须相同 | 原位改为“每个按钮分别与自身稳定基准比较；查询与重置只比较宽度集合均为 `[62]`” |

R0 报告 §3.1 中的同一口径错误属**历史原文**，按任务要求**不得改写**，改为在报告文末追加 append-only 纠正记录（见 §4）。

---

## 3. 两项纠正的实际落地

### 3.1 重置按钮四属性锁定口径统一（问题 1）

`UI.md` §32.2 的“重置”行由：

```text
| 重置 | `width = 62px`（固定宽度） | **仅**固定宽度；**不**新增 loading 态、**不**改变禁用逻辑、**不**改变点击语义 |
```

改为：

```text
| 重置 | `width = min-width = max-width = flex-basis = 62px` | 四属性同时锁定，避免内容宽度或 flex 分配把按钮撑开或压缩；本轮**只**增加固定几何约束，**不**新增 Loading 状态、**不**改变重置按钮禁用逻辑、点击语义、按钮高度、间距或视觉层级 |
```

- 四属性同时锁定，避免内容宽度或 flex 分配把按钮撑开或压缩；
- 本轮**只**增加固定几何约束；
- **不**新增 Loading 状态；
- **不**改变重置按钮禁用逻辑、点击语义、按钮高度、间距或视觉层级；
- `UI.md` §32.2 中“禁止只设 `width` 而放任其余三个属性被改写”的规则**保留不变**。

`ACCEPTANCE.md` `DSS-AC-114` 中重置按钮的“（同四项锁定）”补充为显式的四项锁定拼写（`width = min-width = max-width = flex-basis = 62px`，同四项锁定），使 `UI.md`、`DESIGN.md`、`ACCEPTANCE.md` 与 R1 报告对重置按钮的表述完全统一。

### 3.2 `DSS-AC-114` 跨按钮坐标歧义原位消除（问题 2）

只原位修改 `ACCEPTANCE.md` 中 `DSS-AC-114` 这一条业务行；其编号、状态（仍为 `NOT_RUN`）、关联需求（`DSS-REQ-090`）、宽度数值与业务目标均不变。

删除的歧义表述：

```text
三个按钮在四种状态下的 `x`/`y`/`width`/`height` 零位移（短结果与长结果之间、“查询”与“重置”之间均一致）
```

替换为的明确判定（完整句子，非追加括号）：

```text
每个按钮均以其自身空闲稳定态为基准，分别比较查询 Loading、查询成功、查询失败以及短结果/长结果状态；同一按钮在这些状态之间的 `x`/`y`/`width`/`height` 差值严格为 `0`。“查询”和“重置”只要求宽度同为 `62px`（宽度集合均为 `[62]`），二者各自的 `x` 坐标必须稳定，但不要求两个不同按钮的 `x` 坐标数值相同。
```

同时在本行明确：

- “重置”按钮自身**没有**新增 Loading 状态；所谓查询 Loading/成功/失败，是页面状态变化时测量重置按钮**自身**几何是否稳定；
- “立即刷新”仍以其**自身**空闲态为基准比较，不要求与查询或重置处于同一坐标；宽度集合继续为 `[110]`；
- 三个按钮**分别测量**，各自对自身基准做状态间比较；
- 查询与重置之间**只**比较目标宽度集合均为 `[62]`，**不得**比较二者绝对 `x` 坐标是否相等。

---

## 4. R0 报告处理（严格 append-only）

文件：`docs/features/data-source-snapshot-status/reports/DATA-SOURCE-SNAPSHOT-STATUS-QUERY-BUTTON-AND-TABLE-LAYOUT-STABILITY-BASELINE-001.md`

| 项目 | 值 |
|---|---|
| R0 原文字节数 | `11317` |
| R0 原文 `sha256` | `7f85b34ab22114b71c64bccc5a9462579a0ed832292bb90de91ea208a6a1fc47` |
| 追加后文件前 `11317` 字节 | 与 R0 原文**逐字节相同**（前缀比对通过） |
| 删除行数 | `0` |
| 追加后文件字节数 | `18536` |

校验方式：以 `git show be101a19558ae1ef1436bb3d61746dc21338e49a:<报告路径>` 取出 R0 提交中的原始字节，与 R1 后同长度前缀逐字节比较，结果一致。`r0_report_append_only_status=PREFIX_BYTE_IDENTICAL_NO_DELETION`。

在报告文末追加的独立章节“10. ChatGPT R0 复审与 R1 纠正记录”明确记录：

- R0 §3.1 表格中的“重置仅 `width = 62px`”为**文档口径错误**；
- 纠正后的权威口径为 `width = min-width = max-width = flex-basis = 62px`；
- R0 的业务方向、根因、宽度数值、gutter 方案与计数**均未改变**；
- `DSS-AC-114` 的跨按钮坐标歧义**已在 R1 原位纠正**；
- R0 复审结论记录为 `CHANGES_REQUIRED_TWO_DOCUMENT_WORDING_CONFLICTS_ONLY`。

未修改任何既有证据或其他既有报告。

---

## 5. 变更文件清单（10 个白名单路径）

| 文件 | 变更内容 |
|---|---|
| `docs/features/README.md` | Feature 索引：`data-source-snapshot-status` 行下一入口更新为 R1 复审入口（R0 入口降级为带日期与任务编号的历史值）；§下一步“唯一活跃入口”段落同步；2026-09-15 R0 变更记录行中入口值补加历史限定；追加 2026-09-15 R1 变更记录行 |
| `docs/features/data-source-snapshot-status/README.md` | §1 新增 R1 分层状态行、下一入口更新为 R1 复审入口；§10 同步；追加 R1 变更记录 |
| `docs/features/data-source-snapshot-status/REQUIREMENTS.md` | §1 新增 R1 分层状态行、下一入口更新；追加 R1 变更记录。`DSS-REQ-001~091` 业务行逐字节不变 |
| `docs/features/data-source-snapshot-status/ACCEPTANCE.md` | `DSS-AC-114` 一条业务行文字口径纠正（状态仍 `NOT_RUN`）；§1 新增 R1 分层状态行、下一入口更新；追加 R1 变更记录。`DSS-AC-001~113` 与 `DSS-AC-115~118` 完整行逐字节不变 |
| `docs/features/data-source-snapshot-status/DESIGN.md` | §1 新增 R1 分层状态行、下一入口更新；§38 变更记录追加 R1 条目。§38 业务规则与 §14.2/§14.3 映射行逐字节不变 |
| `docs/features/data-source-snapshot-status/UI.md` | §32.2“重置”行四属性锁定口径统一；§1 新增 R1 分层状态行、下一入口更新；§32.8 变更记录追加 R1 条目。§32 其余业务规则逐字节不变 |
| `docs/features/data-source-snapshot-status/API.md` | 仅同步 §1 R1 分层状态/计数/下一入口并追加一条“本轮不改变接口契约”说明；接口业务契约与 §9 映射表逐字节不变 |
| `docs/features/data-source-snapshot-status/DATABASE.md` | 仅同步 §1 R1 分层状态/计数/下一入口并追加一条“本轮不改变数据库契约”说明；数据库业务正文逐字节不变 |
| `docs/features/data-source-snapshot-status/reports/DATA-SOURCE-SNAPSHOT-STATUS-QUERY-BUTTON-AND-TABLE-LAYOUT-STABILITY-BASELINE-001.md` | R0 报告，严格 append-only，文末追加“ChatGPT R0 复审与 R1 纠正记录” |
| `docs/features/data-source-snapshot-status/reports/DATA-SOURCE-SNAPSHOT-STATUS-QUERY-BUTTON-AND-TABLE-LAYOUT-STABILITY-BASELINE-001-R1.md` | 本报告（新增） |

本任务提示词 Markdown（`docs/prompts/data-source-snapshot-status/...-001-R1-PROMPT.md`）仅存在于主工作区，**未提交入库**。

---

## 6. 契约与边界

```text
api_contract_change_status=NONE
database_contract_change_status=NONE
database_access_status=NONE
database_write_status=NOT_REQUESTED
zookeeper_environment_status=AVAILABLE
task_initiated_zookeeper_operation_status=NONE
zookeeper_write_status=NOT_REQUESTED
feature_zookeeper_dependency=NONE
kafka_access_status=NONE
service_lifecycle_status=NOT_RUN_NOT_REQUIRED_DOC_ONLY
```

- 前端源码差异：`ZERO`；后端源码差异：`ZERO`；测试代码、SQL、配置、依赖与锁文件差异：`ZERO`。
- 未连接数据库、未执行任何查询或写操作；未主动访问或写入 ZooKeeper；未访问 Kafka。
- 未启动、停止或重启 `5173`、`5174`、`8080` 或任何其它服务；未使用 `pkill`/`killall`/模糊匹配 kill/宽泛端口终止。
- 未执行浏览器验证、构建或测试，也未将其写成任何 `PASS`。
- 未修改既有 `DSS-REQ-001~091` 业务行、既有 `DSS-AC-001~113` 任何业务列或状态列、既有 `DSS-AC-115~118` 完整行、既有 DESIGN 追踪映射行、既有历史报告与既有证据。
- 本报告及本次文档变更不包含账号口令、令牌、Cookie、`Authorization` 头、完整连接串或私钥等凭据信息。

---

## 7. 提交前校验结果（23 项）

| # | 检查项 | 结果 |
|---|---|---|
| 1 | `git diff --check` 返回 0 | `PASS`（退出码 `0`，无空白错误） |
| 2 | 变更路径严格等于 §8 的 10 个白名单路径 | `PASS`（10/10，无缺少、无白名单外差异） |
| 3 | `DSS-REQ-001~091` 连续唯一共 91 条 | `PASS`（91 条，唯一 91，连续 001~091） |
| 4 | `DSS-AC-001~118` 连续唯一共 118 条 | `PASS`（118 条，唯一 118，编号集合完整覆盖 001~118；物理行序与 base 完全一致，未增删未重排） |
| 5 | `DSS-AC-001~113` 全部 `PASS` 且完整行逐字节不变 | `PASS`（无差异行，113/113 全部 `PASS`） |
| 6 | `DSS-AC-114~118` 全部 `NOT_RUN` | `PASS`（5/5） |
| 7 | 仅 `DSS-AC-114` 文字口径发生授权变化，编号/状态/关联需求/数值/业务目标不变 | `PASS` |
| 8 | `DSS-AC-115~118` 完整行逐字节不变 | `PASS`（无差异行） |
| 9 | `DSS-REQ-001~091` 完整业务行逐字节不变 | `PASS`（无差异行） |
| 10 | DESIGN §14.2/§14.3 全部映射行逐字节不变，追踪仍 91/91、118/118 | `PASS`（50 行与 69 行全等；14.2 覆盖 91/91、14.3 覆盖 118/118） |
| 11 | DESIGN §38 业务规则逐字节不变 | `PASS`（§38 内除“变更记录”条目外逐字节不变） |
| 12 | UI §32 除 §32.2“重置”行和文末追加的 R1 状态/变更记录外业务规则逐字节不变 | `PASS` |
| 13 | UI、DESIGN、ACCEPTANCE 与 R1 报告对重置按钮统一为 `width=min-width=max-width=flex-basis=62px` | `PASS` |
| 14 | `DSS-AC-114` 不再出现“查询与重置的 x/y 必须相同”或任何等价歧义 | `PASS`（歧义表述已删除） |
| 15 | `DSS-AC-114` 明确每个按钮分别与其自身稳定基准比较 | `PASS`（自基准比较显式写入） |
| 16 | R0 报告原字节为修改后文件完整前缀，删除行数为 0 | `PASS`（前缀逐字节相同；删除行 `0`） |
| 17 | 8 份入口文档当前直接下一入口均为 R1 复审入口；R0 入口仅存在于明确历史限定中 | `PASS` |
| 18 | 当前状态仍为草案待复审与项目负责人批准，`pending_user_review=YES` | `PASS` |
| 19 | API 业务契约与映射表逐字节不变 | `PASS` |
| 20 | DATABASE 业务正文逐字节不变 | `PASS` |
| 21 | `frontend/**`、`backend/**`、测试、SQL、配置、依赖、锁文件、证据、其他报告零差异 | `PASS`（`git status --porcelain -- frontend backend` 与 `git diff --name-only` 均为 0 项） |
| 22 | 新报告无密码、Token、Cookie、`Authorization`、完整连接串、私钥或其他凭据 | `PASS` |
| 23 | Markdown lint 工具可用性 | `documentation_validation_status=NOT_AVAILABLE`（未发现项目级 Markdown lint 工具，未虚构 `PASS`） |

任一检查失败即不得提交或推送；本轮 23 项全部通过。

---

## 8. R1 后的分层状态与下一入口

```text
chatgpt_r0_review_status=CHANGES_REQUIRED_TWO_DOCUMENT_WORDING_CONFLICTS_ONLY
r1_document_wording_correction_status=COMPLETED_PENDING_CHATGPT_REVIEW
accepted_scope_acceptance_status=PASS_113
query_button_and_table_layout_stability_solution_direction_status=APPROVED_BY_PROJECT_OWNER
query_button_and_table_layout_stability_document_status=DRAFT_PENDING_CHATGPT_REVIEW_AND_PROJECT_OWNER_APPROVAL
query_button_and_table_layout_stability_implementation_status=PENDING_FORMAL_IMPLEMENTATION_ON_5173
query_button_and_table_layout_stability_code_review_status=NOT_RUN
query_button_and_table_layout_stability_acceptance_status=NOT_RUN
query_button_and_table_layout_stability_acceptance_not_run_count=5
pending_user_review=YES
pending_user_confirmation_count=0
```

- 当前下一入口（8 份入口文档统一）：

```text
CHATGPT_QUERY_BUTTON_AND_TABLE_LAYOUT_STABILITY_BASELINE_R1_REVIEW_FROM_GIT_THEN_PROJECT_OWNER_DOCUMENT_APPROVAL
```

- R0 入口 `CHATGPT_QUERY_BUTTON_AND_TABLE_LAYOUT_STABILITY_BASELINE_REVIEW_FROM_GIT_THEN_PROJECT_OWNER_DOCUMENT_APPROVAL` 作为 **2026-09-15 历史入口**保留（**R0 历史入口，已由 R1 纠正任务处理**），不再构成本轮当前直接值，未被删除。
- 本草案仍**未批准**、**未实现**、**未验收**；**不得**写成 `APPROVED`/`IMPLEMENTED`/`PASS`/`ACCEPTED`/`COMPLETED`，也不得作最终接受收口。

---

## 9. 冻结不变的内容（相对 R0 提交 `be101a1...`）

- `DSS-REQ-001~091` 共 91 条完整业务行；
- `DSS-AC-001~113` 共 113 条完整业务行与状态，全部 `PASS`；
- `DSS-AC-115~118` 共 4 条完整业务行与状态，全部 `NOT_RUN`；
- `DSS-AC-114` 的编号、状态、关联需求、宽度数值和业务方向（仅消除文字冲突与歧义）；
- `DESIGN.md` §14.2/§14.3 既有及新增追踪映射行；
- `DESIGN.md` §38 全部业务规则；
- `UI.md` §32 除 §32.2“重置”行以外的业务规则；
- 需求 91、验收 118、追踪 `91/91` 和 `118/118`；
- 查询按钮四属性 `62px`；重置按钮纠正后四属性 `62px`；立即刷新四属性 `110px`；
- 路由私有真实主滚动容器 `scrollbar-gutter: stable` 方向；
- 表格弹性列策略；不采用 JS/`ResizeObserver` 补偿、不全局修改滚动行为；
- API 与数据库契约；
- `frontend/**`、`backend/**`、测试、SQL、配置、依赖、锁文件、证据和其他既有报告。

---

## 10. 明确未执行项

- 未批准 R1 文档（不得写成 `APPROVED`）；
- 未开始前端实现（不得写成 `IMPLEMENTED`）；
- 未执行 `DSS-AC-114~118`（全部 `NOT_RUN`，不得写成 `PASS`）；
- 未改变既有 113 条 `PASS`；
- 未作 Feature 最终接受收口；
- 未启动、停止或重启任何服务；
- 未清理任何 worktree；
- 未修改需求编号或新增需求；未修改验收编号或新增验收；
- 未改变 `62/62/110px` 决策；未改变滚动条根因与 route-scoped gutter 方案；
- 未修改 R0 报告原始内容；未修改任何既有证据或其他报告。

---

## 11. 下一入口

```text
CHATGPT_QUERY_BUTTON_AND_TABLE_LAYOUT_STABILITY_BASELINE_R1_REVIEW_FROM_GIT_THEN_PROJECT_OWNER_DOCUMENT_APPROVAL
```

即：先由 ChatGPT 从远程 Git 独立复审 R1 纠正结果，再由项目负责人决定是否批准本草案文档。
