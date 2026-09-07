# 源库快照状态 Feature 验收草案（ACCEPTANCE）

## 1. 文档元数据与状态

| 项目 | 值 |
|---|---|
| Feature 中文名称 | 源库快照状态 |
| Feature 标识 | `data-source-snapshot-status` |
| 既有路由 | `/monitor/data-source-state` |
| 目标文档 | `docs/features/data-source-snapshot-status/ACCEPTANCE.md` |
| 文档状态 | `DRAFT_ADJUSTMENT_PENDING_USER_REVIEW`（当前版为验收前 UI 调整草案 `DATA-SOURCE-SNAPSHOT-STATUS-UI-ADJUSTMENT-BASELINE-001`，建立在已批准需求/验收/设计基线之上；已批准基线保留为历史，**批准基线不自动批准本轮调整草案**，见本表“调整草案关系”与 §1 文档事实边界声明） |
| baseline_status | 既有批准版 `APPROVED`（正式批准版本 `DATA-SOURCE-SNAPSHOT-STATUS-REQUIREMENTS-BASELINE-APPROVAL-001`，保留为历史；本轮当前调整版本为 `DRAFT_ADJUSTMENT_PENDING_USER_REVIEW`，批准不自动延伸到本轮调整） |
| acceptance_status | `DRAFT_ADJUSTMENT_PENDING_USER_REVIEW`（当前调整版本，见 `REQUIREMENTS.md`；已批准版本保留为历史） |
| acceptance_execution_status | `NOT_RUN`（acceptance_execution_status=NOT_RUN；既有 68 条 `DSS-AC-001~068` 与本调整新增 `DSS-AC-069~080` 全部 `NOT_RUN`，正式验收未执行） |
| 实现状态 | `IMPLEMENTED_ADJUSTMENT_PENDING`（implementation_status=IMPLEMENTED_ADJUSTMENT_PENDING；既有实现 `DATA-SOURCE-SNAPSHOT-STATUS-IMPLEMENTATION-001`/`-R1` 已完成，但**本轮 UI 调整尚未实现**，待 ChatGPT 对本调整草案正式复审且项目负责人批准后另立实现，见 Feature README §9/§10） |
| 设计状态 | `DESIGN.md`/`UI.md` 当前调整版本为 `DRAFT_ADJUSTMENT_PENDING_USER_REVIEW`（本轮调整草案，见对应文档）；`API.md`/`DATABASE.md` 保持已批准（`APPROVED`）且本轮**整文件零差异**（本轮不改接口、SQL、表结构、数据库访问与产品只读边界） |
| 验收用例状态 | 文档内全部 `DSS-AC-*` 状态为 `NOT_RUN`（尚未执行正式验收；不写 PASS/FAIL/ACCEPTED/IMPLEMENTED_ACCEPTED） |
| pending_user_review | `YES`（本轮为验收前 UI 调整草案，待 ChatGPT 正式复审与项目负责人审阅，pending_user_review=YES；pending_user_confirmation_count=0） |
| 正式批准版本 | `DATA-SOURCE-SNAPSHOT-STATUS-REQUIREMENTS-BASELINE-APPROVAL-001`（项目负责人明确“批准”驱动的需求与验收基线批准收口） |
| 批准链 | R0 需求与验收草案建立 → R1 定向修订 → R2 最小定向修订 → R3 极小定向修订 → ChatGPT 对 R3 结果正式复审 `APPROVED`（R3 结果提交 `4234af73db2190098f3dcd219319a4281fdabafd`）→ 项目负责人随后明确回复“批准” |
| 批准依据提交 | `4234af73db2190098f3dcd219319a4281fdabafd`（ChatGPT 对 R3 结果正式复审 `APPROVED` 的 R3 结果提交；本批准收口以该提交为批准内容基准） |
| 批准日期 | 2026-09-05 |
| 初版任务编号 | `DATA-SOURCE-SNAPSHOT-STATUS-REQUIREMENTS-BASELINE-001`（初版需求与验收草案建立） |
| R1 任务编号 | `DATA-SOURCE-SNAPSHOT-STATUS-REQUIREMENTS-BASELINE-001-R1`（ChatGPT 正式复审 `CHANGES_REQUIRED` 后的纯文档定向修订；历史版） |
| R2 任务编号 | `DATA-SOURCE-SNAPSHOT-STATUS-REQUIREMENTS-BASELINE-001-R2`（ChatGPT 对 R1 结果正式复审 `CHANGES_REQUIRED` 后的纯文档最小定向修订；历史版） |
| 本版（R3）任务编号 | `DATA-SOURCE-SNAPSHOT-STATUS-REQUIREMENTS-BASELINE-001-R3`（ChatGPT 对 R2 结果正式复审 `CHANGES_REQUIRED` 后的纯文档极小定向修订；历史版本，其后经批准收口为 `APPROVED`） |
| 初版授权基线提交 | `72b305a8e4134d10f514920c215b9647fb7d9e3b`（初版任务开始时 `origin/develop` 最新提交；历史基线） |
| R1 授权基线提交 | `91eb2209a99a65ef1d433c2fb1c815a1abcd5bd5`（R1 任务开始时 `origin/develop` 最新提交；历史基线） |
| R2 授权基线提交 | `0476c40a49f1a7aa6d48fe58194c92982276fd60`（历史基线） |
| 本版（R3）授权基线提交 | `5c58af6b0a378c8534ebc0b76eaa7bc75b6a847a`（R3 任务开始时 `origin/develop` 最新提交；历史基线） |
| 本版（UI 调整草案）任务编号 | `DATA-SOURCE-SNAPSHOT-STATUS-UI-ADJUSTMENT-BASELINE-001`（验收前 UI 调整草案建立；ChatGPT 对实现 R1 提交 `37825272c25c8a2d8a595ff0d5c25c6349186663` 代码复审 `CHANGES_REQUIRED` 后，项目负责人提出更完整的 UI 调整，本轮在已批准基线之上建立**纯文档调整草案**；未实现、未执行正式验收、未批准） |
| 本版（UI 调整草案）授权基线提交 | `37825272c25c8a2d8a595ff0d5c25c6349186663`（本任务开始时 `origin/develop` 最新提交，本地 HEAD 与其一致，ahead/behind=0/0） |
| 调整草案关系 | 已批准需求/验收基线（正式批准版本 `DATA-SOURCE-SNAPSHOT-STATUS-REQUIREMENTS-BASELINE-APPROVAL-001`，批准内容基准提交 `4234af73db2190098f3dcd219319a4281fdabafd`）与已批准设计基线（`DATA-SOURCE-SNAPSHOT-STATUS-DESIGN-BASELINE-APPROVAL-001`）保留为历史；**批准基线不自动批准本轮调整草案**——本调整草案须经 ChatGPT 对本调整基线草案正式复审 `APPROVED` 且项目负责人明确回复“批准”后方能成为新基线。本轮定向修订受影响的既有验收用例（`DSS-AC-026/027/068`）并为新增规则连续新增 `DSS-AC-069~080`（见 §4.18），不改接口、SQL、表结构、数据库访问与产品只读边界（API.md/DATABASE.md 整文件零差异）。下一入口为 ChatGPT 对本调整草案正式复审（不是直接实现） |
| 文档版本 | 批准收口版（2026-09-05；在 R3 极小定向修订版基础上，ChatGPT 对 R3 结果正式复审 `APPROVED`（R3 结果提交 `4234af73db2190098f3dcd219319a4281fdabafd`）、项目负责人随后明确“批准”，需求与验收基线状态收口为 `APPROVED`，正式批准版本 `DATA-SOURCE-SNAPSHOT-STATUS-REQUIREMENTS-BASELINE-APPROVAL-001`；业务零变化——`DSS-AC-001~068` 仍 68 条且全部 `NOT_RUN`；批准的是需求与验收标准基线，不代表功能已实现、验收已执行或通过；该版本为历史批准版本，2026-09-07 本轮 UI 调整草案在其之上建立，批准不自动延伸到本轮调整） |
| 创建日期 | 2026-09-05（初版）；R1、R2、R3 修订及批准收口同日；2026-09-07 建立验收前 UI 调整草案 |
| 依据需求 | `docs/features/data-source-snapshot-status/REQUIREMENTS.md`（既有批准基线 `DSS-REQ-001~065` 与本轮调整草案新增 `DSS-REQ-066~071`，共 `DSS-REQ-001~071` 71 条；当前调整版本文档状态 `DRAFT_ADJUSTMENT_PENDING_USER_REVIEW`，已批准版本保留为历史） |

重要声明：

- 本文件把所有需求转换为可客观验收的场景，使用唯一、稳定的验收编号 `DSS-AC-xxx`。
- 所有用例初始状态为 `NOT_RUN`；`PASS / FAIL / BLOCKED` 是执行后状态，任何用例只有在执行并取得与步骤匹配的客观证据后才允许更新。
- 本文件只定义期望行为，**不授权任何数据库写操作或测试数据写入**；对需要构造数据库异常数据的验收场景，只有后续任务提示词显式包含该授权时才可执行，且测试数据写授权只适用于 `CDC_DATA_SOURCE_RUN_STATE`，绝不授权修改 `CDC_CLIENT_MULTIPLE`、`CDC_DATA_SOURCE` 或其他表（授权边界与可构造场景见 `REQUIREMENTS.md` §20 `DSS-REQ-065` 与本文件 `DSS-AC-063/065`）。
- 本文件验收标准基线已批准（2026-09-05，正式批准版本与批准链见 §1），但验收标准获批不等于执行验收、正式验收通过或实现正式接受。本文件不执行任何验收；`DSS-AC-*` 全部保持 `NOT_RUN`，不代表功能已实现、已验收通过或已正式交付。
- 本版为验收前 UI 调整草案（`DATA-SOURCE-SNAPSHOT-STATUS-UI-ADJUSTMENT-BASELINE-001`，2026-09-07）：在已批准基线之上定向修订受影响的既有验收用例（`DSS-AC-026/027/068`，见 §4.6/§4.10）并连续新增 `DSS-AC-069~080`（见 §4.18）；既有批准版（`DSS-AC-001~068`）保留为历史，批准基线不自动批准本轮调整草案；本轮全部 `DSS-AC-001~080` 均保持 `NOT_RUN`、未执行任何正式验收。

## 2. 验收结果状态模型

| 状态 | 含义 |
|---|---|
| `NOT_RUN` | 尚未执行，不能推定通过（所有用例初始状态） |
| `PASS` | 已执行且符合预期，须附证据 |
| `FAIL` | 已执行且不符合预期，须记录失败点 |
| `BLOCKED` | 受环境或前置条件阻塞，须记录阻断原因 |
| `DEFERRED_UNTIL_*` | 经批准延期到明确后续阶段 |

## 3. 验收领域分类与需求映射

| 分类 | 编号范围 | 关联需求（REQUIREMENTS 章节） |
|---|---|---|
| 页面命名、菜单、路由与占位边界 | 见 §4.1 | §5（REQ-001~005） |
| 业务语义与跨程序边界 | 见 §4.2 | §6（REQ-006~010） |
| 只读边界、无写接口与 SQL 只读审计 | 见 §4.3 | §7（REQ-011~015） |
| RUN_STATE 驱动、不补行、不推断、规模与不分页 | 见 §4.4 | §8、§9（REQ-016~021） |
| 查询条件与组合 | 见 §4.5 | §10（REQ-022~025） |
| 列表字段 | 见 §4.6 | §11（REQ-026~034） |
| 状态映射与未知值 | 见 §4.7 | §12（REQ-035~040） |
| 关联异常兼容 | 见 §4.8 | §13（REQ-041~045） |
| 排序 | 见 §4.9 | §14（REQ-046~049） |
| 自动/手工刷新与页面可见性 | 见 §4.10 | §15（REQ-050~054） |
| 时间字段边界 | 见 §4.11 | §16（REQ-055~057） |
| 加载、空数据、失败与恢复 | 见 §4.12 | §17（REQ-058~061） |
| 可访问性与基础视觉 | 见 §4.13 | §18（REQ-062~063） |
| 安全、日志与敏感数据边界 | 见 §4.14 | §19（REQ-064） |
| 测试数据授权与恢复 | 见 §4.15 | §20（REQ-065） |
| 真实样例与受控构造场景 | 见 §4.16 | §8、§12、§13、§20（REQ-016/017/023/035/040/041/042/043/044/065 等） |
| 测试与构建执行入口 | 见 §4.17 | 全量需求（代表性引用 REQ-027/031/032/035/036/046/050/060/062 等） |
| 本轮 UI 调整草案新增验收 | 见 §4.18 | §21（REQ-066~071，本轮调整草案新增）；并对既有 REQ-028/029/050 展示/刷新行补强 |

## 4. 验收用例

> 全部用例本次不执行，状态列统一为 `NOT_RUN`。“前置条件 / 操作·输入 / 预期结果”三列以可观察、可判定的 Given/When/Then 结构描述。凡依赖“受控测试数据构造”的场景，均以后续任务提示词显式纳入 `DSS-REQ-065` 授权为前提，且构造只允许通过操作 `CDC_DATA_SOURCE_RUN_STATE` 完成、构造前备份、完成后恢复；需“关联配置停用/类别异常”等既有配置的场景，仅当开发库已存在合适只读关联配置时方可引用其做真实数据库验收，否则使用后端自动化/前端 Mock/组件测试验证。

### 4.1 页面命名、菜单、路由与占位边界（对应 REQUIREMENTS §5）

| 编号 | 状态 | 关联需求 | 前置条件 | 操作·输入 | 预期结果 |
|---|---|---|---|---|---|
| DSS-AC-001 | NOT_RUN | DSS-REQ-001 | 功能已实现并可登录平台 | 打开左侧“运行监控”菜单进入页面，观察页面标题、菜单、地址栏、面包屑 | 菜单、页面标题、路由元数据标题、面包屑均显示“源库快照状态”，无第二个同名入口；“源库快照状态”作为用户可见名称全平台统一 |
| DSS-AC-002 | NOT_RUN | DSS-REQ-002 | 文档与实现为当前版本 | 检查 Feature 文档目录、任务代码前缀与路由 | Feature 目录标识为 `data-source-snapshot-status`，任务代码前缀 `DATA-SOURCE-SNAPSHOT-STATUS`，功能归属“运行监控”；需求编号前缀 `DSS-REQ-`、验收前缀 `DSS-AC-` |
| DSS-AC-003 | NOT_RUN | DSS-REQ-003 | 路由表为当前事实 | 检查 `frontend/src/router/index.ts` | 存在且仅存在一条 `/monitor/data-source-state` 路由记录，地址栏访问该路由正常进入本页面；未新增、重命名或删除该路由 |
| DSS-AC-004 | NOT_RUN | DSS-REQ-004 | 源码目录为当前事实 | 检查前端源码目录 | 页面组件仍位于 `frontend/src/views/data-source-run-state/`，目录未做无业务价值重命名；文档命名映射（路由 ↔ 代码目录 ↔ Feature slug ↔ 用户可见名）一致 |
| DSS-AC-005 | NOT_RUN | DSS-REQ-005 | 功能已实现 | 检查菜单、路由元数据、页面标题、面包屑 | 已不存在“数据源运行状态”旧名残留；四处均更新为“源库快照状态” |

### 4.2 业务语义与跨程序边界（对应 REQUIREMENTS §6）

| 编号 | 状态 | 关联需求 | 前置条件 | 操作·输入 | 预期结果 |
|---|---|---|---|---|---|
| DSS-AC-006 | NOT_RUN | DSS-REQ-006 | 存在 RUNNING 与 COMPLETED 构造样例 | 对照数据库只读结果观察列表 | 每行对应一个“探针端＋源库”组合的初始快照状态；`SNAPSHOT_RUNNING` 语义为源库初始快照执行中、`SNAPSHOT_COMPLETED` 语义为源库初始快照已完成 |
| DSS-AC-007 | NOT_RUN | DSS-REQ-007 | 功能已实现 | 观察整页结构、文案与字段 | 页面只呈现初始快照状态信息；不出现 sync-client 在线/健康/失联判定，不呈现增量采集是否正常或当前同步进度语义 |
| DSS-AC-008 | NOT_RUN | DSS-REQ-008, DSS-REQ-009 | 具备代码审阅条件 | 检查本仓库代码与文档 | sync-client 启动时“按 RUN_STATE 决策（只增量/插入 RUNNING 并快照/RUNNING 重跑）”只作为跨程序业务事实记录，本仓库（仅 `cdc-config`）不实现该逻辑、不调用 sync-client，无新增 sync-client 交互代码 |
| DSS-AC-009 | NOT_RUN | DSS-REQ-010 | 存在 COMPLETED 样例且 `UPDATED_AT` 早于当前时间 | 观察该行及页面整体 | 页面与接口不依据 `UPDATED_AT` 或任何时间字段推断或展示 sync-client 在线、健康、离线或异常 |

### 4.3 只读边界、无写接口与 SQL 只读审计（对应 REQUIREMENTS §7）

| 编号 | 状态 | 关联需求 | 前置条件 | 操作·输入 | 预期结果 |
|---|---|---|---|---|---|
| DSS-AC-010 | NOT_RUN | DSS-REQ-011, DSS-REQ-013 | 功能已实现，具备代码审阅与 SQL 日志/审计取证条件 | 检查本功能全部接口与后端 Controller/Service/Mapper/注解 SQL/XML，及查询/刷新期间 SQL 日志或数据库审计 | ①Controller 只暴露只读查询；②Service 不调用 save/update/remove/delete 等写能力；③Mapper/注解 SQL/XML 对 `CDC_DATA_SOURCE_RUN_STATE` 仅执行 `SELECT`；④不存在针对该表的 INSERT/UPDATE/DELETE/MERGE；⑤查询与刷新期间经 SQL 日志/数据库审计确认无 DML；⑥`CDC_CLIENT_MULTIPLE`、`CDC_DATA_SOURCE`（如用于 LEFT JOIN）同样只读 |
| DSS-AC-011 | NOT_RUN | DSS-REQ-012 | 已进入页面 | 观察页面 | 页面不提供新增、修改、删除、重置、重新快照、重试或批量操作入口；无写按钮；无操作列 |
| DSS-AC-012 | NOT_RUN | DSS-REQ-014 | 页面已展示列表 | 触发首次查询、手工“立即刷新”并等待自动刷新，观察网络面板与页面行为 | 每次操作均只产生读取语义；不出现任何针对本表或其他表的写请求；页面数据不被任何展示动作改变 |
| DSS-AC-013 | NOT_RUN | DSS-REQ-015 | 存在关联配置与 RUN_STATE 行 | 检查列表 SQL 与展示结果 | 使用 LEFT JOIN 补充探针端描述与源库 ORG 等展示信息；行集合由 RUN_STATE 驱动且不被 JOIN 改变；即使某行关联配置不存在，该行仍展示（见 §4.8） |

### 4.4 RUN_STATE 驱动、不补行、不推断、规模与不分页（对应 REQUIREMENTS §8、§9）

| 编号 | 状态 | 关联需求 | 前置条件 | 操作·输入 | 预期结果 |
|---|---|---|---|---|---|
| DSS-AC-014 | NOT_RUN | DSS-REQ-016 | 数据库存在 RUN_STATE 记录 | 对照数据库只读结果观察列表 | 列表行集合与 `CDC_DATA_SOURCE_RUN_STATE` 实际存在行一一对应，无凭空多出的行 |
| DSS-AC-015 | NOT_RUN | DSS-REQ-017 | `CDC_CLIENT_MULTIPLE`/`CDC_DATA_SOURCE` 存在但 RUN_STATE 无对应记录的“探针端＋源库”组合 | 进入页面执行缺省查询 | 这些组合不展示；未依据配置表补出缺失行 |
| DSS-AC-016 | NOT_RUN | DSS-REQ-018 | 功能已实现 | 观察整页 | 不出现“未开始”“待快照”“尚无快照记录”等推断或虚拟状态 |
| DSS-AC-017 | NOT_RUN | DSS-REQ-019 | 关联探针端或源库配置缺失/停用/异常 | 进入页面并设置相应查询 | 对应 RUN_STATE 行仍照常展示，未被过滤 |
| DSS-AC-018 | NOT_RUN | DSS-REQ-020, DSS-REQ-021 | 数据库 RUN_STATE 行数在约 100 以内 | 进入页面并观察请求与列表 | 一次请求返回全部符合条件记录；页面无分页、无每页条数与翻页控件；无客户端二次翻页拉取 |
| DSS-AC-019 | NOT_RUN | DSS-REQ-016, DSS-REQ-026 | 结果跨多类状态 | 进入页面观察序号与数据源组合 | 序号为完整结果集内稳定连续显示序号；出现两个相同 `CLIENT_ID+DATA_SOURCE_ID` 组合的重复行计为异常（行唯一标识为该组合） |

### 4.5 查询条件与组合（对应 REQUIREMENTS §10）

| 编号 | 状态 | 关联需求 | 前置条件 | 操作·输入 | 预期结果 |
|---|---|---|---|---|---|
| DSS-AC-020 | NOT_RUN | DSS-REQ-022 | 已进入页面 | 观察查询区；逐个打开三个条件控件；把某条件由“全部”切换为具体候选再切回“全部”；在同一条件内选择多个具体候选 | 查询条件固定为探针端、源库、快照状态三项，不出现时间范围、在线状态、健康状态、关键字或其他条件；三项均为多选控件且每项提供显式“全部”、默认选中“全部”；某条件的“全部”与其具体候选互斥（选任一具体候选即退出“全部”，改选“全部”即清空该条件具体候选） |
| DSS-AC-021 | NOT_RUN | DSS-REQ-023 | 首次通过左侧菜单进入页面 | 场景 A（首次自动查询成功）：进入页面观察网络与结果；场景 B（首次自动查询失败）：制造首次失败并观察页面与“已应用查询条件”，随后让一次重试成功 | A：无需点击“查询”，页面自动以三项“全部”查询一次并成功展示结果，该组“全部”成为初始“已应用查询条件”；B：当前无历史成功结果，展示首次加载失败状态与“重新加载”入口（展示形态另见 DSS-AC-056），“已应用查询条件”仍为初始三项“全部”，点击“重新加载”或后续自动重试仍按三项“全部”发起，首次查询成功后该组“全部”才可能被替换（“仅成功才替换已应用条件”规则见 DSS-AC-024） |
| DSS-AC-022 | NOT_RUN | DSS-REQ-024 | 存在 RUN_STATE 记录；分别存在/不存在未知状态记录的两种数据集（无未知/含未知数据集构造见 §4.16） | ①打开探针端/源库候选；②在含未知记录的数据集打开快照状态候选；③在无未知记录的数据集打开快照状态候选；④选择“未知状态”发起查询；⑤查看未知行 | ①探针端/源库候选只来自当前 RUN_STATE 实际记录及其可选展示信息，未在 RUN_STATE 出现的探针端/源库不出现；②状态条件出现“未知状态”；③不出现“未知状态”；④“未知状态”筛出所有原始 `SNAPSHOT_STATUS` 不属于 `SNAPSHOT_RUNNING`/`SNAPSHOT_COMPLETED` 的行；⑤未知行仍展示并可查看数据库原始状态值 |
| DSS-AC-023 | NOT_RUN | DSS-REQ-022, DSS-REQ-025 | 存在可命中的数据及关联配置缺失/停用的 RUN_STATE 行 | ①在探针端条件选两个具体探针端 X、Y（其余条件“全部”）查询；②再选具体源库 Z 与状态“快照进行中”与所设探针端组合查询；③对关联配置缺失/停用行重复上述查询 | ①命中 X 或 Y 对应的行（同一条件内“或”）；②命中同时满足所设探针端、源库、状态的行（跨条件“且”）；③命中只作用于 RUN_STATE 原始记录及可解析/可展示补充信息，查询不因关联配置缺失或停用排除本应命中的 RUN_STATE 行 |
| DSS-AC-024 | NOT_RUN | DSS-REQ-023, DSS-REQ-025, DSS-REQ-050, DSS-REQ-061 | 已进入页面并有按“已应用查询条件”（初始三项“全部”）的结果 R0；存在可区分且可命中的具体候选 A、B、C（用于请求快照、先失败后成功、空结果等验证） | ①把某条件改为候选 A 但不点击“查询”，观察是否发出请求与列表；②触发一次“立即刷新”或等待一次自动刷新，观察返回；③点击“查询”并在请求在途期间把界面条件改为候选 B，待该次（按候选 A 快照的）请求成功返回后观察列表、已应用条件与界面控件；④把界面条件改为候选 C 并点击“查询”，制造该次查询失败，观察列表、已应用条件、界面控件、提示与“最近成功刷新时间”；⑤失败后界面仍为候选 C 但未点击“查询”时触发“立即刷新”或等待自动刷新，观察结果与“最近成功刷新时间”；⑥再对候选 C 点击“查询”并令其成功，观察列表与已应用条件；⑦点击“重置”（不点击“查询”）观察界面与列表；⑧界面已为三项“全部”但未点击“查询”时触发“立即刷新”或等待自动刷新，观察结果；⑨再点击“查询”观察列表；⑩用一组会成功返回 0 条的条件点击“查询”，观察结果 | ①修改条件不自动查询：不发出请求，列表仍 R0、已应用条件仍“全部”；②自动/立即刷新仍按旧“已应用条件”（“全部”）发起并成功返回 R0，不使用未提交界面候选；本次成功刷新以返回结果更新表格与“最近成功刷新时间”（更新为本次成功刷新完成时间），但不替换、不改变“已应用条件”（仍为“全部”）；③点击“查询”才按点击瞬间捕获的请求快照（候选 A）发起查询，成功后升级的是该次请求开始时的快照而非请求结束时控件已变成的候选 B：列表按候选 A 结果展示、已应用条件变为候选 A、“最近成功刷新时间”更新、界面控件保留在途改成候选 B；④该次新条件（候选 C）查询失败：不得升级为已应用条件，保留上一次成功结果（候选 A 结果）与上一次已应用条件（候选 A），界面控件保留候选 C 便于再次点击“查询”，失败提示脱敏收敛、“最近成功刷新时间”不更新；⑤自动/立即刷新仍按“已应用条件”（候选 A）发起并成功返回：不使用界面中失败且未提交的新条件（候选 C）；不替换、不改变“已应用条件”（仍为候选 A）；以本次成功刷新结果更新表格，“最近成功刷新时间”更新为本次成功刷新完成时间，并从请求结束后重新开始完整 60 秒周期；⑥点击“查询”用候选 C 发起且成功：候选 C 升级为已应用条件、列表替换为候选 C 结果、“最近成功刷新时间”更新；⑦“重置”只把三个界面选择条件恢复为“全部”，本身不发起查询、不清空/不替换当前表格、不改变已应用条件（列表与已应用条件仍为 ⑥ 的候选 C 结果）；⑧界面已为三项“全部”但未点击“查询”时，自动/立即刷新仍按“已应用条件”（候选 C）发起并成功返回，而非按“全部”结果：不使用界面未提交的“全部”；不替换、不改变“已应用条件”（仍为候选 C）；以本次成功刷新结果更新表格与“最近成功刷新时间”（更新为本次成功刷新完成时间）；⑨点击“查询”才按三项“全部”查询并把“全部”更新为已应用条件；⑩成功返回 0 条属于成功：展示空态、该组条件升级为已应用条件、“最近成功刷新时间”更新（空结果成功语义另见 DSS-AC-057）。只有用户点击“查询”且查询成功，才允许用该次请求快照替换“已应用查询条件”；自动刷新和“立即刷新”无论成功或失败都不得改变“已应用查询条件”。成功刷新只按既有已应用条件更新表格数据、最近成功刷新时间，并从请求结束后重新开始完整 60 秒周期 |

### 4.6 列表字段（对应 REQUIREMENTS §11）

| 编号 | 状态 | 关联需求 | 前置条件 | 操作·输入 | 预期结果 |
|---|---|---|---|---|---|
| DSS-AC-025 | NOT_RUN | DSS-REQ-027 | 已进入页面 | 观察表头 | 固定七列且顺序为：序号、探针端、源库、快照状态、快照启动时间、快照完成时间、记录更新时间；无第八列“操作”或其他业务列 |
| DSS-AC-026 | NOT_RUN | DSS-REQ-028 | 存在可关联到探针端的行；本轮调整已定向修订该用例为“表格内只显示原始 `CLIENT_ID`、完整 `CLIENT_DESC` 经悬停 Tooltip 展示” | 观察探针端列 | 表格内只显示原始 `CLIENT_ID`（单行、超出列宽省略号），不再把 `CLIENT_DESC` 同行或次行内联展示；完整 `CLIENT_DESC` 经悬停 Tooltip 展示（Tooltip 内容与单实例边界见 §4.18 `DSS-AC-074/076/077`）；描述为空时不弹空 Tooltip；探针配置缺失时仍显示原始 `CLIENT_ID`，Tooltip/异常提示能表达“探针端配置缺失” |
| DSS-AC-027 | NOT_RUN | DSS-REQ-029 | 存在可关联源库与无法关联源库的行；本轮调整已定向修订该用例为“正常关联且 ORG 非空只显示源库 ORG、悬停显示完整 ORG、缺失/ORG 空回退显示原始 ID” | 观察源库列；对可关联行悬浮查看 Tooltip | 正常关联且 ORG（`DATA_SOURCE_ORG`）非空时，源库列单行只显示源库 ORG（超出列宽省略号），悬停以 Tooltip 展示完整 ORG，不以原始 `DATA_SOURCE_ID` 作为正常行 Tooltip 的默认内容；不采用两行 ORG＋ID 布局；源库配置缺失或 ORG 为空时回退显示原始 `DATA_SOURCE_ID`（不得显示空白），Tooltip 显示完整原始 ID 及对应异常说明（停用、类别非 SOURCE 等轻量异常语义见 §4.8；Tooltip 单实例边界见 §4.18 `DSS-AC-075/076/077`） |
| DSS-AC-028 | NOT_RUN | DSS-REQ-030 | 存在已知与未知状态行 | 观察快照状态列；对各行查看数据库原始状态值 | 已知状态以中文标签展示；任意行均可查看数据库原始状态值（如 `SNAPSHOT_RUNNING`） |
| DSS-AC-029 | NOT_RUN | DSS-REQ-031, DSS-REQ-032 | 存在 `SNAPSHOT_LAST_SEEN_AT`/`SNAPSHOT_COMPLETED_AT` 为 NULL 的行 | 观察两时间列 | 快照启动时间展示 `SNAPSHOT_LAST_SEEN_AT`、快照完成时间展示 `SNAPSHOT_COMPLETED_AT`；NULL 一律显示 `--` |
| DSS-AC-030 | NOT_RUN | DSS-REQ-033, DSS-REQ-055 | 存在 RUN_STATE 行 | 对照数据库只读结果观察记录更新时间列 | 展示 `UPDATED_AT`，与数据库业务值一致（展示格式 `YYYY-MM-DD HH:mm:ss` 见 DSS-REQ-055，格式化不改业务值） |
| DSS-AC-031 | NOT_RUN | DSS-REQ-034 | 已进入页面 | 观察列表行 | 无操作列；无详情、编辑、删除、跳转或任何写操作入口 |

### 4.7 状态映射与未知值（对应 REQUIREMENTS §12）

| 编号 | 状态 | 关联需求 | 前置条件 | 操作·输入 | 预期结果 |
|---|---|---|---|---|---|
| DSS-AC-032 | NOT_RUN | DSS-REQ-035 | 存在 `SNAPSHOT_RUNNING` 行 | 观察快照状态列 | 显示“快照进行中”的蓝色状态标签 |
| DSS-AC-033 | NOT_RUN | DSS-REQ-036 | 存在 `SNAPSHOT_COMPLETED` 行 | 观察快照状态列 | 显示“快照已完成”的绿色状态标签 |
| DSS-AC-034 | NOT_RUN | DSS-REQ-037, DSS-REQ-039 | 数据库对 `SNAPSHOT_STATUS` 无封闭 Check（已核验事实）；存在未知状态行 | 构造或存在未知状态行后进入页面/接口 | 未知状态行正常展示；接口不报错、页面不报错；该行不被丢弃，也不被改写为已知状态 |
| DSS-AC-035 | NOT_RUN | DSS-REQ-038 | 存在未知状态行 | 观察快照状态列 | 显示橙色“未知状态”标签，且可查看数据库原始状态值；标签在颜色与文字上均与两种已知状态清晰区分 |
| DSS-AC-036 | NOT_RUN | DSS-REQ-040 | 当前开发库无 COMPLETED 天然样例 | 检查验收数据准备 | 验收不依赖开发库天然存在 COMPLETED；`SNAPSHOT_COMPLETED` 场景通过受控测试数据构造（见 §4.16） |
| DSS-AC-037 | NOT_RUN | DSS-REQ-037, DSS-REQ-038, DSS-REQ-039 | 已按授权构造含 RUNNING/COMPLETED/未知状态的受控数据集 | 分别观察三类状态行展示、接口返回与排序 | RUNNING 显示“快照进行中”（蓝）、COMPLETED 显示“快照已完成”（绿）、未知显示“未知状态”（橙）并附原始值；状态均有文字表达不只靠颜色；三类行都完整返回，无报错、无丢弃 |

### 4.8 关联异常兼容（对应 REQUIREMENTS §13）

| 编号 | 状态 | 关联需求 | 前置条件 | 操作·输入 | 预期结果 |
|---|---|---|---|---|---|
| DSS-AC-038 | NOT_RUN | DSS-REQ-041 | 存在 `CLIENT_ID` 无对应探针端的行 | 观察探针端列 | 仍展示原始 `CLIENT_ID`，并提供轻量异常提示 |
| DSS-AC-039 | NOT_RUN | DSS-REQ-042 | 存在 `DATA_SOURCE_ID` 无对应数据源的行 | 观察源库列 | 仍展示原始 `DATA_SOURCE_ID`，并提供轻量异常提示 |
| DSS-AC-040 | NOT_RUN | DSS-REQ-043 | 关联探针端或源库 `FG_ACTIVE` 为停用 | 观察对应行 | RUN_STATE 行仍展示，并可标识“配置已停用” |
| DSS-AC-041 | NOT_RUN | DSS-REQ-044 | 关联源库类别非 SOURCE、类别大小写异常或其他配置异常 | 观察对应行 | RUN_STATE 行仍展示，并提供轻量提示（描述配置关联事实） |
| DSS-AC-042 | NOT_RUN | DSS-REQ-045 | 上述任一异常行存在 | 观察异常所在单元格、整页与数据库状态 | 异常提示以单元格内小图标或弱提示文字呈现，悬浮（Tooltip）可解释；未新增专门的异常列；提示只描述配置关联事实；快照状态未被改判为失败；未触发任何数据库修复或写行为 |

### 4.9 排序（对应 REQUIREMENTS §14）

| 编号 | 状态 | 关联需求 | 前置条件 | 操作·输入 | 预期结果 |
|---|---|---|---|---|---|
| DSS-AC-043 | NOT_RUN | DSS-REQ-046 | 结果同时含 RUNNING、未知、COMPLETED | 进入页面执行缺省查询 | 状态按 `SNAPSHOT_RUNNING` → 未知状态 → `SNAPSHOT_COMPLETED` 分组成序 |
| DSS-AC-044 | NOT_RUN | DSS-REQ-047 | 同一状态组含多条 | 观察组内顺序 | 组内按 `UPDATED_AT` 倒序 |
| DSS-AC-045 | NOT_RUN | DSS-REQ-048 | 同状态组内 `UPDATED_AT` 并列 | 观察并列行的相对顺序 | 使用 `CLIENT_ID`、`DATA_SOURCE_ID` 作为确定性排序键，顺序稳定可复现 |
| DSS-AC-046 | NOT_RUN | DSS-REQ-049 | 已进入页面 | 点击各表头 | 无任何表头排序或排序箭头，顺序不被用户改变 |

### 4.10 自动/手工刷新与页面可见性（对应 REQUIREMENTS §15）

| 编号 | 状态 | 关联需求 | 前置条件 | 操作·输入 | 预期结果 |
|---|---|---|---|---|---|
| DSS-AC-047 | NOT_RUN | DSS-REQ-050 | 页面成功查询 | 观察工具栏与网络；点击“立即刷新”并观察按钮宽度与文案 | 提供“立即刷新”入口且存在 60 秒自动刷新；手工刷新可立即取得新数据；自动与“立即刷新”沿用“已应用查询条件”（见 DSS-AC-024）；“立即刷新”按钮宽度稳定（见 DSS-AC-068） |
| DSS-AC-048 | NOT_RUN | DSS-REQ-051, DSS-REQ-054 | 页面成功查询后切到其他标签页/最小化 | 观察网络面板；保持不可见超过一个刷新周期；切回观察网络与表格；使恢复可见后的首次刷新失败一次再观察 | 页面不可见期间自动刷新计时停止/取消，不发送自动刷新请求，也不保留旧剩余秒数供恢复后复用、不从旧剩余秒数续计；重新可见后立即按“已应用查询条件”刷新一次，该次请求无论成功还是失败，结束后都重新开始完整 60 秒周期；恢复可见的刷新不与其他请求重叠 |
| DSS-AC-049 | NOT_RUN | DSS-REQ-052 | 页面有数据 | 触发自动与手工刷新并核对数据库 | 刷新只读取、不改变任何数据；数据库无 DML；页面展示仅为读取结果 |
| DSS-AC-050 | NOT_RUN | DSS-REQ-053 | 存在较慢的后端响应 | 在一次请求在途时再次点击“立即刷新”或等待自动刷新触发并观察网络；记录在途请求结束时刻，再观察其后首次自动刷新发生的时刻 | 前一次请求未结束时不发起下一次重叠请求：被抑制的手工或自动触发不产生新请求；被抑制的触发不视为一次实际请求、不单独重置 60 秒计时——其后首次自动刷新仍在在途请求结束后约 60 秒发生，而非从被抑制触发时刻起顺延重置 |
| DSS-AC-051 | NOT_RUN | DSS-REQ-054 | 页面已成功查询（存在已应用查询条件 C） | 场景 A：观察一次成功自动刷新结束后到下一次自动刷新的间隔；场景 B：制造一次刷新失败，观察失败后到下一次自动刷新的间隔、表格、已应用条件与“最近成功刷新时间”；场景 C：在刷新在途时触发一次手工刷新或让自动触发到期，观察网络；场景 D：不可见跨周期后恢复可见再观察 | A：页面可见时每次实际发出的查询/刷新请求结束后，无论成功还是失败，都从该请求结束时刻重新开始一个完整 60 秒周期——两次成功刷新间隔约 60 秒；B：失败不停止自动刷新、也不立即无间隔重试：失败后仍按已应用条件 C 保留最近成功数据、最近成功刷新时间不更新，约 60 秒后按已应用条件 C 正常自动重试；C：请求在途时不发起下一次重叠请求，被抑制的自动/手工触发不视为实际请求、不单独重置计时；D：页面不可见期间自动刷新计时停止/取消且不保留剩余秒数复用，恢复可见后立即按已应用条件 C 刷新一次，该请求无论成功还是失败，结束后都重新开始完整 60 秒周期 |
| DSS-AC-068 | NOT_RUN | DSS-REQ-050, DSS-REQ-061 | 页面已有成功结果；后端存在可感知的刷新延迟 | 连续多次点击“立即刷新”（或制造刷新在途），观察结果卡片头部右侧刷新逻辑组中的“立即刷新”按钮、按钮前的“60 秒自动刷新｜最近成功刷新：…”文案与刷新组整体；使一次刷新失败后再观察“最近成功刷新时间” | 刷新控件为结果卡片头部右侧不可拆散的“刷新逻辑组”（本轮 UI 调整草案定位，见 §4.18 `DSS-AC-071/072`）：“立即刷新”按钮宽度稳定——刷新在途加载图标出现/消失不改变按钮宽度；“60 秒自动刷新｜最近成功刷新：…”等文字位置不因刷新状态移动；刷新组整体不因刷新在途状态发生明显水平位移；“最近成功刷新时间”仅在成功刷新后更新（从未成功显示 `--`；失败或被抑制的刷新触发都不更新，保持上一次成功值）；失败后自动刷新不停止、约 60 秒后自动重试 |

### 4.11 时间字段边界（对应 REQUIREMENTS §16）

| 编号 | 状态 | 关联需求 | 前置条件 | 操作·输入 | 预期结果 |
|---|---|---|---|---|---|
| DSS-AC-052 | NOT_RUN | DSS-REQ-055 | 三个时间字段存在各类取值（含 NULL） | 对照数据库只读结果观察三列 | 三列统一展示为 `YYYY-MM-DD HH:mm:ss`；空值（NULL）显示 `--`；展示格式化不改动业务时间值 |
| DSS-AC-053 | NOT_RUN | DSS-REQ-056 | 功能已实现 | 观察整页与接口返回 | 无任何依据时间字段计算出的“超时”“异常”“离线”“长期运行”等状态或提示 |
| DSS-AC-054 | NOT_RUN | DSS-REQ-057 | 存在长时间 `SNAPSHOT_RUNNING` 的行 | 观察该行 | 不因其运行时间长而自动显示为错误或警告 |

### 4.12 加载、空数据、失败与恢复（对应 REQUIREMENTS §17）

| 编号 | 状态 | 关联需求 | 前置条件 | 操作·输入 | 预期结果 |
|---|---|---|---|---|---|
| DSS-AC-055 | NOT_RUN | DSS-REQ-058 | 后端有响应延迟 | 进入页面观察首次加载 | 加载在途时展示加载反馈，不展示空态或错误态 |
| DSS-AC-056 | NOT_RUN | DSS-REQ-059 | 首次加载失败（如接口不可用） | 制造首次失败并观察页面、“已应用查询条件”与表格；点击“重新加载”或让其自动重试一次后观察 | 展示首次加载失败状态与“重新加载”入口；点击“重新加载”或自动重试可重试；“已应用查询条件”仍为初始三项“全部”，不因失败改写，重新加载/自动重试仍按三项“全部”发起；不把失败展示成空数据或成功（首次失败场景与已应用条件的衔接另见 DSS-AC-021） |
| DSS-AC-057 | NOT_RUN | DSS-REQ-060 | 查询结果为空 | 设置一组条件并点击“查询”构造成功返回 0 条 | 成功返回 0 条视为成功查询：展示空数据提示，不展示成接口错误、不伪装成失败；该组条件升级为新的“已应用查询条件”、“最近成功刷新时间”更新，并从该次请求结束后重新开始完整 60 秒自动刷新周期 |
| DSS-AC-058 | NOT_RUN | DSS-REQ-061 | 已有成功结果与当前“已应用查询条件”C | 制造一次刷新失败并观察表格、提示与“最近成功刷新时间”；再连续制造多次失败；随后一次刷新成功再观察 | 刷新失败保留最近一次成功数据与已应用查询条件 C：不清空表格、不改换条件，后续自动/立即刷新仍按 C 发起；失败提示脱敏且收敛，不连续堆叠相同消息；“最近成功刷新时间”只在查询/刷新成功后更新，失败或被抑制的触发均不更新（连续失败期间保持上一次成功值，成功后才更新）；失败后自动刷新不停止、不立即无间隔重试，约 60 秒后按已应用条件 C 自动重试（计时语义见 DSS-AC-051）；刷新在途不造成表格明显闪烁 |
| DSS-AC-059 | NOT_RUN | DSS-REQ-061 | 页面成功查询后数据被另一写进程改变 | 等待一次自动刷新或手工刷新 | 刷新只重新读取，最新数据库值被反映；页面不写任何数据 |

### 4.13 可访问性与基础视觉（对应 REQUIREMENTS §18）

| 编号 | 状态 | 关联需求 | 前置条件 | 操作·输入 | 预期结果 |
|---|---|---|---|---|---|
| DSS-AC-060 | NOT_RUN | DSS-REQ-062 | 已进入页面 | 观察整体视觉 | 采用与现有 app-shell / Element Plus 一致的企业管理后台浅色风格 |
| DSS-AC-061 | NOT_RUN | DSS-REQ-063 | 存在已知、未知状态及异常提示 | 观察并关闭颜色（灰度或辅助） | 状态与异常信息均以文字传达（中文标签/原始值），不只依赖颜色；色弱/黑白环境下仍可区分 |

### 4.14 安全、日志与敏感数据边界（对应 REQUIREMENTS §19）

| 编号 | 状态 | 关联需求 | 前置条件 | 操作·输入 | 预期结果 |
|---|---|---|---|---|---|
| DSS-AC-062 | NOT_RUN | DSS-REQ-064 | 功能已实现 | 制造查询/刷新失败并检查响应、页面与日志 | 返回与展示为脱敏错误，不含内部堆栈、无关数据或敏感信息；日志不含与本表查询无关的敏感内容；任何查询路径不产生写操作 |

### 4.15 测试数据授权与恢复（对应 REQUIREMENTS §20）

| 编号 | 状态 | 关联需求 | 前置条件 | 操作·输入 | 预期结果 |
|---|---|---|---|---|---|
| DSS-AC-063 | NOT_RUN | DSS-REQ-065 | 后续任务准备构造测试数据 | 审查任务提示词与执行记录 | 仅当任务提示词显式纳入 `DSS-REQ-065` 授权时才对 `CDC_DATA_SOURCE_RUN_STATE` 执行 `INSERT/UPDATE/DELETE`；对象仅限项目配置 Oracle 开发库、仅本表；执行前完整备份原始数据；执行后恢复到任务开始前状态并逐行一致核验；报告记录目的/范围/备份/恢复证据；不使用 `TRUNCATE/ALTER/DROP` 或其他 DDL；不操作其他表；不操作生产库 |

### 4.16 真实样例与受控构造场景

| 编号 | 状态 | 关联需求 | 前置条件 | 操作·输入 | 预期结果 |
|---|---|---|---|---|---|
| DSS-AC-064 | NOT_RUN | DSS-REQ-016, DSS-REQ-023, DSS-REQ-035 | 当前开发库存在真实 RUNNING 样例 | 进入页面执行首次缺省查询并对照数据库只读结果 | 真实 `SNAPSHOT_RUNNING` 样例行（例如 `hosp-012` + `112-source-19c`）被展示为“快照进行中”，证明列表真实来源于 RUN_STATE |
| DSS-AC-065 | NOT_RUN | DSS-REQ-040, DSS-REQ-041, DSS-REQ-042, DSS-REQ-043, DSS-REQ-044, DSS-REQ-065 | 后续任务已纳入对 `CDC_DATA_SOURCE_RUN_STATE` 的受控测试数据 DML 授权；“关联配置停用/源库类别异常”类场景做真实数据库验收的前提是开发库已存在合适的既有只读关联配置，否则改用后端自动化测试/前端 Mock/组件测试 | 备份→构造 `SNAPSHOT_COMPLETED`、未知状态、孤立探针端、孤立源库等仅需操作 RUN_STATE 即可构造的样例（对 RUN_STATE 新增/修改，可引用开发库既有关联配置）→执行相关验收→恢复→逐行一致核验；“关联配置停用”“源库类别异常”等需既有配置的场景：仅当开发库已存在合适只读关联配置时，通过新增/修改 RUN_STATE 引用该既有配置执行真实数据库验收；无合适既有配置时使用后端自动化测试、前端 Mock/组件测试验证 | 构造场景均被正确展示与宽容处理（见 §4.7、§4.8 相关用例）；整个过程只对 `CDC_DATA_SOURCE_RUN_STATE` 执行 `INSERT/UPDATE/DELETE`，不新增/修改/删除 `CDC_CLIENT_MULTIPLE`、`CDC_DATA_SOURCE` 或其他任何表；所有 RUN_STATE 测试 DML 遵守 `DSS-REQ-065` 的备份、恢复、逐行一致核验、禁 DDL、禁生产库等全部边界；完成后数据库恢复到任务开始前状态且逐行一致，备份/恢复证据齐全 |

### 4.17 测试与构建执行入口

| 编号 | 状态 | 关联需求 | 前置条件 | 操作·输入 | 预期结果 |
|---|---|---|---|---|---|
| DSS-AC-066 | NOT_RUN | DSS-REQ-026, DSS-REQ-031, DSS-REQ-032, DSS-REQ-035, DSS-REQ-036, DSS-REQ-046, DSS-REQ-048 | 功能已实现 | 执行后端单元/集成测试、前端组件/单测与构建 | 自动化用例覆盖状态映射（RUNNING/COMPLETED/未知）、NULL 时间 `--`、默认与确定性排序、序号唯一性、空态等可单测逻辑；后端 `mvn` 与前端 `npm` 相关测试与构建通过；可作为正式验收证据来源 |
| DSS-AC-067 | NOT_RUN | DSS-REQ-001, DSS-REQ-027, DSS-REQ-050, DSS-REQ-062 | 服务可外部访问 | 在真实浏览器中进入页面做只读目测 | 页面标题“源库快照状态”，七列表格与查询区正常；自动/手工刷新只读；整体为浅色企业后台风格；无 console 错误；无任何写动作 |

### 4.18 本轮 UI 调整草案新增验收（对应 REQUIREMENTS §21）

> 本小节为验收前 UI 调整草案 `DATA-SOURCE-SNAPSHOT-STATUS-UI-ADJUSTMENT-BASELINE-001` 在既有批准基线之上新增的验收用例 `DSS-AC-069~080`，全部 `NOT_RUN`。调整规则落点/设计依据见 `UI.md`/`DESIGN.md` 本轮调整草案章节；被定向修订的既有用例见 §4.6 `DSS-AC-026/027`、§4.10 `DSS-AC-068`。

| 编号 | 状态 | 关联需求 | 前置条件 | 操作·输入 | 预期结果 |
|---|---|---|---|---|---|
| DSS-AC-069 | NOT_RUN | DSS-REQ-066 | 页面可访问且已有成功结果 | 打开“源库快照状态”页面，观察整页垂直结构 | 页面自上而下分为三个有明显视觉分隔的顶层语义区：①标题“源库快照状态”＋功能说明区（说明表达“探针端与源库组合的初始快照阶段状态、页面只读”，无在线/健康/同步进度等推断）；②独立查询卡片（白色独立容器、边框/圆角、合理内边距与上下间距，含探针端、源库、快照状态三个多选与查询、重置按钮）；③独立结果卡片（白色独立容器、卡片头部与主体、与查询卡片有清晰间距）。三块沿用项目现有设计令牌（app-shell / Element Plus 浅色企业后台），未引入另一套视觉体系；不再把标题/查询/刷新/表格挤入无层级连续平面 |
| DSS-AC-070 | NOT_RUN | DSS-REQ-067 | 结果含未知状态与不含未知状态两类数据集 | 观察结果卡片头部左侧文字；先看含未知状态结果，再看 0 未知结果 | 结果卡片头部左侧展示当前成功结果总数 `共 {records.length} 条`；当结果含 `statusCategory=UNKNOWN` 时在其后以轻量橙色提示 `其中 {unknownCount} 条未知状态`（只统计接口返回 `statusCategory=UNKNOWN` 记录，不推断健康/错误），为 0 时不显示；既有行内关联异常提示保留，头部不做复杂多类别汇总 |
| DSS-AC-071 | NOT_RUN | DSS-REQ-068 | 页面已有成功结果 | 观察结果卡片头部右侧刷新组内容、顺序与对齐；将浏览器缩窄到不足整组宽度再观察 | 右侧为不可拆散的“刷新逻辑组”，按序含：灰色状态圆点（刷新在途变蓝色动态、文字仍为主要信息载体）、`60 秒自动刷新`、分隔符、`最近成功刷新：HH:mm:ss`（从未成功为 `--`）、“立即刷新”按钮；整组靠右对齐，不以“文案靠左、按钮单独靠右”方式拆散；宽度不足时刷新组整体换行，不得只把“立即刷新”按钮单独挤到下一行 |
| DSS-AC-072 | NOT_RUN | DSS-REQ-068 | 页面已有成功结果；后端存在可感知刷新延迟 | 分别观察刷新组在空闲、手工刷新（manual）在途、自动刷新（auto）在途、恢复可见刷新（restore）在途、一次失败后的几何与刷新失败提示位置；再观察“立即刷新”按钮 loading 与加载图标出现/消失 | “立即刷新”按钮在 idle/loading/failure 三态保持稳定宽度，加载图标出现/消失不改变按钮宽度、不移动按钮本身、前方文案与“最近成功刷新”时间；刷新失败提示置于不会推动刷新组关键元素的稳定槽位，出现/消失不造成工具栏明显水平跳动。按钮 loading 映射：仅 `manual`（点击“立即刷新”）让“立即刷新”按钮显示 loading；`auto` 与 `restore` 在途只让刷新状态圆点变蓝并呈刷新动态，**不使“立即刷新”按钮显示 loading**、按钮外观稳定（六类请求完整视觉映射逐项验证见 `DSS-AC-078`）；手工/自动/恢复可见刷新在途“查询”按钮文字/颜色/尺寸/位置不闪动（busy 视觉隔离与单请求见 `DSS-AC-078/079`） |
| DSS-AC-073 | NOT_RUN | DSS-REQ-069 | 页面已有含长探针端/源库名与三类状态的成功结果 | 观察表头列宽与时间列；查看表头实测像素宽度 | 七列顺序不变且目标列宽：序号 `70px` 居中、探针端 `170px` 左对齐、源库 `280px` 左对齐（明显宽于探针端列）、快照状态 `130px` 居中、快照启动时间/快照完成时间/记录更新时间各 `165px`；三个时间列长度固定、使用固定列宽（不把多余空间平均摊给时间列）；时间值完整显示为 `YYYY-MM-DD HH:mm:ss`（空值 `--`，格式与空值语义见 §4.11 `DSS-AC-052`）；表格内容过宽时允许表格容器横向滚动，不通过换行挤压时间或主要文本 |
| DSS-AC-074 | NOT_RUN | DSS-REQ-028, DSS-REQ-069 | 存在探针端描述较长/为空/配置缺失的行 | 观察探针端列各行；对长描述行悬停，对空描述与配置缺失行悬停；在浏览器内检查是否存在原生 `title` | 探针端列表格内只显示原始 `CLIENT_ID`，单行、超出 `170px` 列宽省略号，不再把 `CLIENT_DESC` 同行/次行内联展示；悬停展示完整 `CLIENT_DESC`（页面级单实例 Tooltip，见 `DSS-AC-076/077`），描述为空时不弹空 Tooltip；探针配置缺失仍显示原始 `CLIENT_ID`，Tooltip/异常提示能表达“探针端配置缺失”；表格内无与受控 Tooltip 并存的原生 `title` 浏览器提示 |
| DSS-AC-075 | NOT_RUN | DSS-REQ-029, DSS-REQ-069 | 存在正常关联且 ORG 非空、ORG 为空、源库配置缺失、停用/类别非 SOURCE 的行 | 观察源库列各行并对正常/回退行悬停 | 正常关联且 ORG（`DATA_SOURCE_ORG`）非空时只显示源库 ORG，单行、超出 `280px` 列宽省略号，悬停 Tooltip 展示完整 `DATA_SOURCE_ORG`（不以原始 `DATA_SOURCE_ID` 作为正常行 Tooltip 默认内容）；源库配置缺失或 ORG 为空时回退显示原始 `DATA_SOURCE_ID`（不显示空白），Tooltip 显示完整原始 ID 及对应异常说明；停用、类别非 SOURCE 等既有轻量异常语义保留（见 §4.8）；Tooltip 单实例与无原生 `title` 边界同 `DSS-AC-074/076/077` |
| DSS-AC-076 | NOT_RUN | DSS-REQ-070 | 页面结果含探针端描述、源库 ORG、未知状态、缺失/停用/类别异常图标等各类可触发 Tooltip 的多行 | 在表格内快速横向或纵向扫过多行（连续触发不同 Tooltip），观察任意时刻页面上可见的 Tooltip 数量；触发新项后立即观察旧项 | 页面任意时刻最多显示 1 个 Tooltip（覆盖探针端描述、完整源库 ORG、未知状态原始值、探针/源库缺失/停用/类别异常图标说明等本页全部表格 Tooltip）：新触发项出现前立即关闭旧 Tooltip，不允许同时残留多个；离开触发区域、表格数据替换、滚动、窗口缩放、页面隐藏或卸载时关闭 Tooltip；快速扫行过程中始终最多一个 |
| DSS-AC-077 | NOT_RUN | DSS-REQ-070 | 存在各类可触发 Tooltip 的行 | 依次验证 Tooltip 的延迟、关闭、边界与生命周期；观察是否可被鼠标进入 | Tooltip 统一短暂显示延迟（约 300~350ms）并即时关闭，不依赖多个独立 Element Plus Tooltip 各自延迟并存；Tooltip 不可交互（pointer-events none/非 enterable），鼠标无法进入 Tooltip 造成遗留；对视口四边做边界避让，完整 Tooltip 不超出可视区、不被表格容器裁切；内容优先单行展示，仅在完整内容物理宽度超过安全视口时于该极端情况换行保证全文可读与不越界；页面隐藏/卸载后无残留 Tooltip；表格内不混用原生 `title` 浏览器提示 |
| DSS-AC-078 | NOT_RUN | DSS-REQ-071 | 页面可访问且可制造六类请求（首载/失败重试/条件查询/立即刷新/60 秒自动/恢复可见）；后端存在可感知响应延迟 | 逐类制造并观察六类请求：`initial`（新开页面首次自动加载）、`retry`（首次加载失败后点击错误区“重新加载”）、`query`（点击“查询”）、`manual`（点击“立即刷新”）、`auto`（等待约 60 秒自动刷新）、`restore`（切后台再切回恢复可见触发刷新）；逐类观察表格区/对应按钮 loading、刷新状态圆点与“立即刷新”外观并核对网络面板 | 六类请求的页面视觉反馈与 `DSS-REQ-071` 映射逐项一致：`initial` 表格区域显示 loading 而“查询/立即刷新”按钮外观稳定、不显示 loading；`retry` 只有错误区“重新加载”按钮显示 loading 而“查询/立即刷新”不显示 loading；`query` 只有“查询”按钮显示 loading 而“立即刷新”外观稳定；`manual` 只有“立即刷新”按钮显示 loading 且刷新状态圆点变蓝并呈刷新动态、“查询”外观稳定；`auto` 与 `restore` 均只让刷新状态圆点变蓝并呈刷新动态，“查询”与“立即刷新”按钮外观稳定、均不显示 loading——**特别验证 `auto`/`restore` 不得让“立即刷新”按钮显示 loading**；`initial/retry/query` 不得错误点亮刷新状态圆点；点击“立即刷新”时网络层只有一次按当前已应用条件发出的刷新请求、无额外查询请求；“查询”按钮在刷新在途不闪动（文字/颜色/尺寸/位置不变）并阻止鼠标与键盘触发且具正确 `aria-disabled`；任何操作不得通过允许并发、取消当前请求后偷换为查询、排队查询或静默补发来解决视觉问题 |
| DSS-AC-079 | NOT_RUN | DSS-REQ-071 | 页面已有成功结果 | 场景 A：请求（查询或刷新）在途时反复点击“立即刷新”与“查询”并分别用鼠标与键盘触发；场景 B：先点击“查询”令其在途，再触发“立即刷新”；场景 C：点击“立即刷新”令其在途，再触发“查询”；对每个在途场景核对各控件 loading 是否仍与六类请求映射（`DSS-AC-078`）一致 | 单飞行、忙碌抑制、不并发、不排队、不补发等既有业务规则保持不变：busy 在途期间无论鼠标还是键盘都不能制造第二个并发请求——查询在途时“立即刷新”不发起第二个请求且不表现得像被点击（无虚假加载反馈）；刷新在途时“查询”不可发起请求（禁用、鼠标与键盘均阻断、具 `aria-disabled` 语义、无闪动）；非发起按钮不呈现加载反馈；busy 抑制不得改变六类请求的 loading 反馈映射——只有实际发起当前请求的操作显示 loading，被抑制按钮不得因 busy 额外获得或失去 loading，刷新状态圆点仍只随刷新类请求（`manual/auto/restore`）点亮；无并发请求、无取消当前请求后偷换、无排队、无静默补发 |
| DSS-AC-080 | NOT_RUN | DSS-REQ-066, DSS-REQ-069 | 可在真实浏览器设置视口 | 分别以 1440×900 与 1920×1080 视口打开页面并目测；必要时补充当前项目支持的较窄桌面视口 | 两种视口下均：三块页面结构清晰分隔；七列固定列宽正常（源库列明显宽于探针端列、三时间列完整显示）；结果卡片头部左右布局与右侧刷新逻辑组正常；页面级单实例 Tooltip 正常且不越界；无水平/垂直布局破坏或遮挡；整体为浅色企业后台风格、无 console 错误、无任何写动作 |

## 5. 需求—验收追踪矩阵

下列矩阵确认每条 `DSS-REQ-*` 至少被一个 `DSS-AC-*` 覆盖（覆盖行以主要承担用例表示，完整对应以各验收行“关联需求”列为准）：

| 需求 | 承担验收用例 | 需求 | 承担验收用例 |
|---|---|---|---|
| DSS-REQ-001 | DSS-AC-001 | DSS-REQ-034 | DSS-AC-031 |
| DSS-REQ-002 | DSS-AC-002 | DSS-REQ-035 | DSS-AC-032, DSS-AC-064 |
| DSS-REQ-003 | DSS-AC-003 | DSS-REQ-036 | DSS-AC-033 |
| DSS-REQ-004 | DSS-AC-004 | DSS-REQ-037 | DSS-AC-034, DSS-AC-037 |
| DSS-REQ-005 | DSS-AC-005 | DSS-REQ-038 | DSS-AC-035, DSS-AC-037 |
| DSS-REQ-006 | DSS-AC-006 | DSS-REQ-039 | DSS-AC-034, DSS-AC-037 |
| DSS-REQ-007 | DSS-AC-007 | DSS-REQ-040 | DSS-AC-036, DSS-AC-065 |
| DSS-REQ-008 | DSS-AC-008 | DSS-REQ-041 | DSS-AC-038, DSS-AC-065 |
| DSS-REQ-009 | DSS-AC-008 | DSS-REQ-042 | DSS-AC-039, DSS-AC-065 |
| DSS-REQ-010 | DSS-AC-009 | DSS-REQ-043 | DSS-AC-040, DSS-AC-065 |
| DSS-REQ-011 | DSS-AC-010 | DSS-REQ-044 | DSS-AC-041, DSS-AC-065 |
| DSS-REQ-012 | DSS-AC-011 | DSS-REQ-045 | DSS-AC-042 |
| DSS-REQ-013 | DSS-AC-010 | DSS-REQ-046 | DSS-AC-043, DSS-AC-066 |
| DSS-REQ-014 | DSS-AC-012 | DSS-REQ-047 | DSS-AC-044 |
| DSS-REQ-015 | DSS-AC-013 | DSS-REQ-048 | DSS-AC-045, DSS-AC-066 |
| DSS-REQ-016 | DSS-AC-014, DSS-AC-019, DSS-AC-064 | DSS-REQ-049 | DSS-AC-046 |
| DSS-REQ-017 | DSS-AC-015 | DSS-REQ-050 | DSS-AC-047, DSS-AC-067, DSS-AC-068, DSS-AC-071, DSS-AC-072 |
| DSS-REQ-018 | DSS-AC-016 | DSS-REQ-051 | DSS-AC-048 |
| DSS-REQ-019 | DSS-AC-017 | DSS-REQ-052 | DSS-AC-049 |
| DSS-REQ-020 | DSS-AC-018 | DSS-REQ-053 | DSS-AC-050 |
| DSS-REQ-021 | DSS-AC-018 | DSS-REQ-054 | DSS-AC-051 |
| DSS-REQ-022 | DSS-AC-020, DSS-AC-023 | DSS-REQ-055 | DSS-AC-052 |
| DSS-REQ-023 | DSS-AC-021, DSS-AC-024, DSS-AC-064 | DSS-REQ-056 | DSS-AC-053 |
| DSS-REQ-024 | DSS-AC-022 | DSS-REQ-057 | DSS-AC-054 |
| DSS-REQ-025 | DSS-AC-023, DSS-AC-024 | DSS-REQ-058 | DSS-AC-055 |
| DSS-REQ-026 | DSS-AC-019, DSS-AC-066 | DSS-REQ-059 | DSS-AC-056 |
| DSS-REQ-027 | DSS-AC-025, DSS-AC-067 | DSS-REQ-060 | DSS-AC-057 |
| DSS-REQ-028 | DSS-AC-026, DSS-AC-074 | DSS-REQ-061 | DSS-AC-024, DSS-AC-058, DSS-AC-059, DSS-AC-068, DSS-AC-072 |
| DSS-REQ-029 | DSS-AC-027, DSS-AC-075 | DSS-REQ-062 | DSS-AC-060, DSS-AC-067 |
| DSS-REQ-030 | DSS-AC-028 | DSS-REQ-063 | DSS-AC-061 |
| DSS-REQ-031 | DSS-AC-029, DSS-AC-066 | DSS-REQ-064 | DSS-AC-062 |
| DSS-REQ-032 | DSS-AC-029, DSS-AC-066 | DSS-REQ-065 | DSS-AC-063, DSS-AC-065 |
| DSS-REQ-033 | DSS-AC-030 | DSS-REQ-066 | DSS-AC-069, DSS-AC-080 |
| DSS-REQ-067 | DSS-AC-070 | | |
| DSS-REQ-068 | DSS-AC-071, DSS-AC-072 | | |
| DSS-REQ-069 | DSS-AC-073, DSS-AC-074, DSS-AC-075, DSS-AC-080 | | |
| DSS-REQ-070 | DSS-AC-076, DSS-AC-077 | | |
| DSS-REQ-071 | DSS-AC-078, DSS-AC-079 | | |

## 6. 未执行说明与后续执行边界

- 本文件全部 `DSS-AC-*` 为 `NOT_RUN`（既有批准版 `DSS-AC-001~068` 与本轮调整草案新增 `DSS-AC-069~080` 共 80 条，全部 `NOT_RUN`，`acceptance_not_run_count=80`），本任务（纯文档 UI 调整草案）不执行任何正式验收、不把开发自测写成 PASS。
- 验收标准基线已批准（需求与验收基线批准收口任务 `DATA-SOURCE-SNAPSHOT-STATUS-REQUIREMENTS-BASELINE-APPROVAL-001`，2026-09-05），设计基线已批准（`DATA-SOURCE-SNAPSHOT-STATUS-DESIGN-BASELINE-APPROVAL-001`，2026-09-06），功能已由实现任务 `DATA-SOURCE-SNAPSHOT-STATUS-IMPLEMENTATION-001`/`-R1` 完成（既有实现存在）；当前文档为验收前 UI 调整草案 `DATA-SOURCE-SNAPSHOT-STATUS-UI-ADJUSTMENT-BASELINE-001`——本轮 `acceptance_status` 当前调整版本为 `DRAFT_ADJUSTMENT_PENDING_USER_REVIEW`、实现状态为 `IMPLEMENTED_ADJUSTMENT_PENDING`（本轮调整尚未实现）、`formal_acceptance_execution_status=NOT_RUN`、`human_visual_acceptance_status=NOT_RUN`、`pending_user_review=YES`、`pending_user_confirmation_count=0`。正式执行验收须由后续独立正式验收任务在本轮调整经 ChatGPT 正式复审与项目负责人批准、实现完成后开展，验收结果只能由正式验收任务写入。
- 依赖数据库只读比对或受控测试数据构造的用例，执行时必须遵守项目数据库只读/审批规则；测试数据 DML 仅在后续任务提示词显式纳入 `DSS-REQ-065` 授权时执行。
- 本文件不授权任何数据库写操作或测试数据写入；验收标准获批不等于执行验收、验收通过或实现正式接受；本轮 UI 调整草案尚未经 ChatGPT 正式复审与项目负责人批准，不构成新批准基线。

## 7. 文档级变更记录

| 日期 | 变更 | 依据 |
|---|---|---|
| 2026-09-05 | 建立“源库快照状态”Feature 验收草案：`DSS-AC-001~067` 用例全部 `NOT_RUN`，建立需求 ID 与验收 ID 映射（“关联需求”列）与 §5 需求—验收追踪矩阵，覆盖需求全部领域；只编写验收标准，不执行验收，不写 PASS/FAIL 结果 | DATA-SOURCE-SNAPSHOT-STATUS-REQUIREMENTS-BASELINE-001（纯文档任务；待用户审阅） |
| 2026-09-05 | R1 定向修订验收草案：新增 `DSS-AC-068`（刷新工具栏稳定宽度），验收计数为 `DSS-AC-001~068` 共 68 条、全部 `NOT_RUN`；重写 `DSS-AC-020/022/023/024`（多选“或/且”、“全部”互斥、未知状态候选动态出现与筛选、修改不查询/点击查询才应用/重置不查询的完整“双状态”序列验证，落实 R1-03）、`DSS-AC-027`（源库单行 Tooltip）、`DSS-AC-032/033/035/037`（状态标签颜色＋文字）、`DSS-AC-048/051`（恢复可见立即按已应用条件刷新）、`DSS-AC-052`（`YYYY-MM-DD HH:mm:ss` 时间格式）、`DSS-AC-058`（失败保留旧结果）、`DSS-AC-042`（异常弱提示形式）；重写 `DSS-AC-065` 限定测试数据 DML 仅可操作 RUN_STATE、其余场景按既有配置或自动化/Mock（落实 R1-02）；删除对 `DSS-PROP-*` 的引用并同步 §5 追踪矩阵；仍为 `DRAFT_PENDING_USER_REVIEW`，全部 `NOT_RUN`，待 ChatGPT 对 R1 结果正式复审 | DATA-SOURCE-SNAPSHOT-STATUS-REQUIREMENTS-BASELINE-001-R1（ChatGPT 正式复审 `CHANGES_REQUIRED` 驱动的纯文档定向修订；草案未批准、功能未实现、验收未执行） |
| 2026-09-05 | R2 最小定向修订验收草案：不新增/删除/重编号任何 `DSS-AC-*`，验收计数仍为 68、全部 `NOT_RUN`；在既有用例内消除两个剩余歧义——R2-01 扩展 `DSS-AC-021`（首次自动查询失败仍保持初始“全部”已应用条件）、`DSS-AC-024`（新条件查询失败不升级已应用条件/保留旧结果/刷新仍旧/界面保留新条件、请求快照与在途改条件语义、空结果视为成功）、`DSS-AC-056`（首次加载失败“已应用查询条件”仍为三项“全部”）、`DSS-AC-057`（成功返回 0 条属成功并升级条件与更新时间）、`DSS-AC-058`（刷新失败保留已应用条件与数据、最近成功刷新时间不更新）；R2-02 扩展 `DSS-AC-048/051`（每次实际请求结束无论成败重启完整 60 秒周期、失败后约 60 秒自动重试、被抑制触发不视为实际请求不单独重置计时、不可见停止且不保留剩余秒数复用）、`DSS-AC-050`、`DSS-AC-068`；`DSS-AC-024` 关联需求增补 `DSS-REQ-061` 并同步 §5 追踪矩阵；仍为 `DRAFT_PENDING_USER_REVIEW`，全部 `NOT_RUN`，待 ChatGPT 对 R2 结果正式复审 | DATA-SOURCE-SNAPSHOT-STATUS-REQUIREMENTS-BASELINE-001-R2（ChatGPT 对 R1 结果正式复审 `CHANGES_REQUIRED` 驱动的纯文档最小定向修订；草案未批准、功能未实现、验收未执行） |
| 2026-09-05 | R3 极小定向修订验收草案：不新增/删除/重编号任何 `DSS-AC-*`，验收计数仍为 68、全部 `NOT_RUN`；只定向修正 `DSS-AC-024` 的验收矛盾——该用例第⑤步“自动/立即刷新按旧“已应用条件”成功返回”不再写作“也不更新“最近成功刷新时间””，统一为“成功刷新必须把“最近成功刷新时间”更新为本次成功刷新完成时间、但不替换、不改变“已应用查询条件””；并按同一口径同步该用例第②、⑧步等明确成功的刷新步骤（成功刷新更新表格与最近成功刷新时间，永不替换“已应用查询条件”）；把该用例末句替换为无歧义结论：只有用户点击“查询”且查询成功，才允许用该次请求快照替换“已应用查询条件”；自动刷新和“立即刷新”无论成功或失败都不得改变“已应用查询条件”。除 `DSS-AC-024` 外，其余 67 条验收业务行相对本版授权基线 `5c58af6` 逐字节不变；§5 追踪矩阵与编号计数未变；仍为 `DRAFT_PENDING_USER_REVIEW`，全部 `NOT_RUN`，待 ChatGPT 对 R3 结果正式复审 | DATA-SOURCE-SNAPSHOT-STATUS-REQUIREMENTS-BASELINE-001-R3（ChatGPT 对 R2 结果正式复审 `CHANGES_REQUIRED` 驱动的纯文档极小定向修订；草案未批准、功能未实现、验收未执行） |
| 2026-09-05 | 需求与验收基线批准收口：ChatGPT 对 R3 结果（提交 `4234af73db2190098f3dcd219319a4281fdabafd`）正式复审结论 `APPROVED`，项目负责人随后明确回复“批准”；本文件基线状态由 `DRAFT_PENDING_USER_REVIEW` 收口为 `APPROVED`（正式批准版本 `DATA-SOURCE-SNAPSHOT-STATUS-REQUIREMENTS-BASELINE-APPROVAL-001`，批准内容基准提交 `4234af73db2190098f3dcd219319a4281fdabafd`）；业务零变化——`DSS-AC-001~068` 仍 68 条、全部 `NOT_RUN`、§5 需求—验收追踪矩阵零差异、65 条 `DSS-REQ-*`（见 `REQUIREMENTS.md`）零差异；实现状态保持 `NOT_STARTED`、设计状态保持 `NOT_STARTED`、验收执行状态保持 `NOT_RUN`；验收标准获批不等于执行验收、验收通过或实现正式接受；下一入口更新为设计基线建立 | DATA-SOURCE-SNAPSHOT-STATUS-REQUIREMENTS-BASELINE-APPROVAL-001（项目负责人明确批准驱动的需求与验收基线批准收口；纯文档任务，未设计、未实现、未执行验收） |
| 2026-09-06 | 本文件仅同步实现任务 `DATA-SOURCE-SNAPSHOT-STATUS-IMPLEMENTATION-001` 完成后的**当前实现状态与文档级实现记录**（文档级状态同步，不新增/删除/重编号/修改任何 `DSS-AC-*` 用例、不写任何 PASS/FAIL、相对批准内容基准 `4234af7...` 业务零变化、§5 追踪矩阵零差异）：元数据“实现状态/设计状态”行更新为 `IMPLEMENTED_PENDING_REVIEW`/`APPROVED`；68 条 `DSS-AC-001~068` 全部保持 `NOT_RUN`、`acceptance_not_run_count=68`、`formal_acceptance_execution_status=NOT_RUN`、`human_visual_acceptance_status=NOT_RUN`；正式验收由后续独立任务执行 | DATA-SOURCE-SNAPSHOT-STATUS-IMPLEMENTATION-001（前后端实现；纯文档记录，不改验收用例、不执行正式验收） |
| 2026-09-07 | 验收前 UI 调整草案 `DATA-SOURCE-SNAPSHOT-STATUS-UI-ADJUSTMENT-BASELINE-001`（纯文档草案，**不自动批准、不实现、不执行验收**）：定向修订受影响的既有用例 `DSS-AC-026`（探针端列表格内只显示原始 `CLIENT_ID`、完整 `CLIENT_DESC` 经悬停 Tooltip、不再内联，空描述不弹空 Tooltip、配置缺失仍显示 `CLIENT_ID` 且异常提示表达“探针端配置缺失”，落点并入新增 `DSS-AC-074`）、`DSS-AC-027`（正常关联且 ORG 非空只显示 ORG、悬停 Tooltip 显示完整 ORG 而非原始 ID 默认、缺失/ORG 空回退原始 `DATA_SOURCE_ID` 不空白，落点并入新增 `DSS-AC-075`）、`DSS-AC-068`（刷新控件归位结果卡片头部右侧不可拆散刷新逻辑组、三态几何稳定，落点并入新增 `DSS-AC-071/072`）；在 §4.18 新增 `DSS-AC-069~080` 共 12 条全部 `NOT_RUN`（三块页面结构与卡片分隔 `DSS-AC-069`、结果总数＋未知状态提示 `DSS-AC-070`、刷新逻辑组整体右对齐与窄宽度整体换行 `DSS-AC-071`、刷新组 idle/loading/failure 三态几何稳定与失败提示稳定槽位 `DSS-AC-072`、七列固定列宽 `DSS-AC-073`、探针端单行省略与 Tooltip 内容 `DSS-AC-074`、源库 ORG/回退原始 ID 与 Tooltip 内容 `DSS-AC-075`、页面级单实例 Tooltip 快速扫行最多一个 `DSS-AC-076`、Tooltip 关闭/生命周期/边界/无原生 title `DSS-AC-077`、点击立即刷新仅发起操作加载反馈且查询不闪动无第二请求 `DSS-AC-078`、busy 期间鼠标键盘均不制造并发请求 `DSS-AC-079`、1440×900 与 1920×1080 视口验证 `DSS-AC-080`）；同步 §3 分类、§5 需求—验收追踪矩阵（新增需求 `DSS-REQ-066~071` 与新增用例正反向引用、`DSS-REQ-028/029/050/061` 覆盖补强，无悬空）。计数：`DSS-AC-001~080` 共 80 条全部 `NOT_RUN`。状态迁移（草案范围）：`acceptance_status` 当前调整版本为 `DRAFT_ADJUSTMENT_PENDING_USER_REVIEW`、实现状态 `IMPLEMENTED_ADJUSTMENT_PENDING`、正式验收 `NOT_RUN`、人工页面验收 `NOT_RUN`、`pending_user_review=YES`、`pending_user_confirmation_count=0`；旧批准版本保留为历史，批准旧基线**不自动批准**本轮调整草案。`API.md`/`DATABASE.md` 整文件零差异。下一入口为 ChatGPT 对本 UI 调整基线草案正式复审（不是直接实现） | DATA-SOURCE-SNAPSHOT-STATUS-UI-ADJUSTMENT-BASELINE-001（ChatGPT 对实现 R1 复审 `CHANGES_REQUIRED` 与负责人 UI 调整要求驱动的验收前纯文档调整草案；已批准旧基线作为历史保留，草案未批准、本轮调整未实现、验收未执行） |
| 2026-09-07 | R1 极小定向修订验收草案（`DATA-SOURCE-SNAPSHOT-STATUS-UI-ADJUSTMENT-BASELINE-001-R1`）：仅定向澄清 `DSS-AC-072`（刷新组在空闲、手工刷新、自动刷新、恢复可见刷新与失败状态下的几何稳定性与按钮 loading 映射，明确 `auto`/`restore` 在途只激活刷新状态圆点、不使“立即刷新”按钮显示 loading）、`DSS-AC-078`（逐项验证 `initial/retry/query/manual/auto/restore` 六类请求的视觉映射，特别验证 `auto`/`restore` 不得让“立即刷新”按钮显示 loading）、`DSS-AC-079`（继续验证各种 busy 状态下鼠标/键盘抑制与网络单请求，且 busy 抑制不得改变六类请求的 loading 反馈映射）；`DSS-AC-001~071`、`073~077`、`080` 业务行逐字节零差异、验收数量保持 80、不新增 `DSS-AC-081`、80 条全部保持 `NOT_RUN`、§5 追踪矩阵零差异；与 `REQUIREMENTS.md` `DSS-REQ-071`、`DESIGN.md` §19.3/§19.6、`UI.md` §13.3/§13.6 六类映射逐项一致。状态保持（草案范围）：`DRAFT_ADJUSTMENT_PENDING_USER_REVIEW`、实现 `IMPLEMENTED_ADJUSTMENT_PENDING`、正式验收 `NOT_RUN`、人工页面验收 `NOT_RUN`、`pending_user_review=YES`、`pending_user_confirmation_count=0`；`API.md`/`DATABASE.md` 整文件零差异。下一入口为 ChatGPT 对 R1 结果提交正式复审（不是直接实现） | DATA-SOURCE-SNAPSHOT-STATUS-UI-ADJUSTMENT-BASELINE-001-R1（ChatGPT 对 UI 调整草案正式复审 `CHANGES_REQUIRED` 驱动的纯文档极小定向修订；草案未批准、本轮调整未实现、验收未执行） |

> 关联文档：需求草案 `docs/features/data-source-snapshot-status/REQUIREMENTS.md`；功能入口与状态 `docs/features/data-source-snapshot-status/README.md`。
