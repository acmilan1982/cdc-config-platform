# 源库快照状态 Feature 验收草案（ACCEPTANCE）

## 1. 文档元数据与状态

| 项目 | 值 |
|---|---|
| Feature 中文名称 | 源库快照状态 |
| Feature 标识 | `data-source-snapshot-status` |
| 既有路由 | `/monitor/data-source-state` |
| 目标文档 | `docs/features/data-source-snapshot-status/ACCEPTANCE.md` |
| 文档状态 | `DRAFT_PENDING_USER_REVIEW`（验收标准草案，未批准、未执行） |
| baseline_status | `DRAFT_PENDING_USER_REVIEW` |
| acceptance_status | `DRAFT_PENDING_USER_REVIEW` |
| acceptance_execution_status | `NOT_RUN`（验收标准获批不代表已执行正式验收） |
| 实现状态 | `NOT_STARTED` |
| 设计状态 | `NOT_STARTED`（DESIGN/API/UI/DATABASE 未建立） |
| 验收用例状态 | 文档内全部 `DSS-AC-*` 状态为 `NOT_RUN`（尚未执行正式验收；不写 PASS/FAIL/ACCEPTED/IMPLEMENTED_ACCEPTED） |
| 任务编号 | `DATA-SOURCE-SNAPSHOT-STATUS-REQUIREMENTS-BASELINE-001` |
| 授权基线提交 | `72b305a8e4134d10f514920c215b9647fb7d9e3b` |
| 创建日期 | 2026-09-05 |
| 依据需求 | `docs/features/data-source-snapshot-status/REQUIREMENTS.md`（`DSS-REQ-001~065`，文档状态 `DRAFT_PENDING_USER_REVIEW`） |

重要声明：

- 本文件把所有需求转换为可客观验收的场景，使用唯一、稳定的验收编号 `DSS-AC-xxx`。
- 所有用例初始状态为 `NOT_RUN`；`PASS / FAIL / BLOCKED` 是执行后状态，任何用例只有在执行并取得与步骤匹配的客观证据后才允许更新。
- 本文件只定义期望行为，**不授权任何数据库写操作或测试数据写入**；对需要构造数据库异常数据的验收场景，只有后续任务提示词显式包含该授权时才可执行（授权边界见 `REQUIREMENTS.md` §20 `DSS-REQ-065`）。
- 验收标准文档获批不等于执行验收、正式验收通过或实现正式接受。本文件不执行任何验收；`DSS-AC-*` 全部保持 `NOT_RUN`，不代表功能已实现、已验收通过或已正式交付。

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

## 4. 验收用例

> 全部用例本次不执行，状态列统一为 `NOT_RUN`。“前置条件 / 操作·输入 / 预期结果”三列以可观察、可判定的 Given/When/Then 结构描述。凡依赖“受控测试数据构造”的场景，均以后续任务提示词显式纳入 `DSS-REQ-065` 授权为前提，且构造前备份、完成后恢复。

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
| DSS-AC-020 | NOT_RUN | DSS-REQ-022 | 已进入页面 | 观察查询区 | 查询条件固定为探针端、源库、快照状态三项；不出现时间范围、在线状态、健康状态、关键字或其他条件；三个控件形态与“全部”按采纳后的草案建议（DSS-PROP-001/002）执行 |
| DSS-AC-021 | NOT_RUN | DSS-REQ-023 | 首次通过左侧菜单进入页面 | 进入页面并观察是否自动发起查询 | 无需点击“查询”，页面自动按缺省条件查询全部并展示结果 |
| DSS-AC-022 | NOT_RUN | DSS-REQ-024 | 配置表存在未在 RUN_STATE 出现的探针端/源库 | 打开探针端/源库候选 | 候选只来自当前 RUN_STATE 实际记录及其可选展示信息；没有 RUN_STATE 记录的探针端或源库不出现在候选 |
| DSS-AC-023 | NOT_RUN | DSS-REQ-025 | 存在关联配置缺失/停用的 RUN_STATE 行 | 分别设置探针端、源库、快照状态为具体值并组合查询 | 多条件组合取交集（跨条件“且”），命中只作用于 RUN_STATE 原始记录及可解析/可展示补充信息；查询不因配置缺失或停用排除本应命中的 RUN_STATE 行 |
| DSS-AC-024 | NOT_RUN | DSS-REQ-023, DSS-REQ-025 | 已进入页面并有结果 | 修改条件但不点击查询按钮 | 列表保持不变；只有发起查询后才按新条件刷新结果 |

### 4.6 列表字段（对应 REQUIREMENTS §11）

| 编号 | 状态 | 关联需求 | 前置条件 | 操作·输入 | 预期结果 |
|---|---|---|---|---|---|
| DSS-AC-025 | NOT_RUN | DSS-REQ-027 | 已进入页面 | 观察表头 | 固定七列且顺序为：序号、探针端、源库、快照状态、快照启动时间、快照完成时间、记录更新时间；无第八列“操作”或其他业务列 |
| DSS-AC-026 | NOT_RUN | DSS-REQ-028 | 存在可关联到探针端的行 | 观察探针端列 | 展示原始 `CLIENT_ID`；关联成功时按草案建议补充展示 `CLIENT_DESC`，未关联时仅原始 ID 且带轻量异常提示 |
| DSS-AC-027 | NOT_RUN | DSS-REQ-029 | 存在可关联源库与无法关联源库的行 | 观察源库列 | 可关联行优先展示源库 ORG；所有行都能查看原始 `DATA_SOURCE_ID`（展示形式按采纳后的草案建议 DSS-PROP-003） |
| DSS-AC-028 | NOT_RUN | DSS-REQ-030 | 存在已知与未知状态行 | 观察快照状态列 | 已知状态以中文标签展示；任意行均可查看数据库原始状态值（按采纳后的草案建议展示） |
| DSS-AC-029 | NOT_RUN | DSS-REQ-031, DSS-REQ-032 | 存在 `SNAPSHOT_LAST_SEEN_AT`/`SNAPSHOT_COMPLETED_AT` 为 NULL 的行 | 观察两时间列 | 快照启动时间展示 `SNAPSHOT_LAST_SEEN_AT`、快照完成时间展示 `SNAPSHOT_COMPLETED_AT`；NULL 一律显示 `--` |
| DSS-AC-030 | NOT_RUN | DSS-REQ-033 | 存在 RUN_STATE 行 | 对照数据库只读结果观察记录更新时间列 | 展示 `UPDATED_AT`，与数据库业务值一致（允许按草案建议格式化，不改业务值） |
| DSS-AC-031 | NOT_RUN | DSS-REQ-034 | 已进入页面 | 观察列表行 | 无操作列；无详情、编辑、删除、跳转或任何写操作入口 |

### 4.7 状态映射与未知值（对应 REQUIREMENTS §12）

| 编号 | 状态 | 关联需求 | 前置条件 | 操作·输入 | 预期结果 |
|---|---|---|---|---|---|
| DSS-AC-032 | NOT_RUN | DSS-REQ-035 | 存在 `SNAPSHOT_RUNNING` 行 | 观察快照状态列 | 显示“快照进行中” |
| DSS-AC-033 | NOT_RUN | DSS-REQ-036 | 存在 `SNAPSHOT_COMPLETED` 行 | 观察快照状态列 | 显示“快照已完成” |
| DSS-AC-034 | NOT_RUN | DSS-REQ-037, DSS-REQ-039 | 数据库对 `SNAPSHOT_STATUS` 无封闭 Check（已核验事实）；存在未知状态行 | 构造或存在未知状态行后进入页面/接口 | 未知状态行正常展示；接口不报错、页面不报错；该行不被丢弃，也不被改写为已知状态 |
| DSS-AC-035 | NOT_RUN | DSS-REQ-038 | 存在未知状态行 | 观察快照状态列 | 显示与两种已知状态清晰区分的“未知状态”视觉标签，且可查看数据库原始状态值 |
| DSS-AC-036 | NOT_RUN | DSS-REQ-040 | 当前开发库无 COMPLETED 天然样例 | 检查验收数据准备 | 验收不依赖开发库天然存在 COMPLETED；`SNAPSHOT_COMPLETED` 场景通过受控测试数据构造（见 §4.16） |
| DSS-AC-037 | NOT_RUN | DSS-REQ-037, DSS-REQ-038, DSS-REQ-039 | 已按授权构造含 RUNNING/COMPLETED/未知状态的受控数据集 | 分别观察三类状态行展示、接口返回与排序 | RUNNING 显示“快照进行中”、COMPLETED 显示“快照已完成”、未知显示“未知状态”并附原始值；三类行都完整返回，无报错、无丢弃 |

### 4.8 关联异常兼容（对应 REQUIREMENTS §13）

| 编号 | 状态 | 关联需求 | 前置条件 | 操作·输入 | 预期结果 |
|---|---|---|---|---|---|
| DSS-AC-038 | NOT_RUN | DSS-REQ-041 | 存在 `CLIENT_ID` 无对应探针端的行 | 观察探针端列 | 仍展示原始 `CLIENT_ID`，并提供轻量异常提示 |
| DSS-AC-039 | NOT_RUN | DSS-REQ-042 | 存在 `DATA_SOURCE_ID` 无对应数据源的行 | 观察源库列 | 仍展示原始 `DATA_SOURCE_ID`，并提供轻量异常提示 |
| DSS-AC-040 | NOT_RUN | DSS-REQ-043 | 关联探针端或源库 `FG_ACTIVE` 为停用 | 观察对应行 | RUN_STATE 行仍展示，并可标识“配置已停用” |
| DSS-AC-041 | NOT_RUN | DSS-REQ-044 | 关联源库类别非 SOURCE、类别大小写异常或其他配置异常 | 观察对应行 | RUN_STATE 行仍展示，并提供轻量提示（描述配置关联事实） |
| DSS-AC-042 | NOT_RUN | DSS-REQ-045 | 上述任一异常行存在 | 观察整页与数据库状态 | 异常提示只描述配置关联事实；快照状态未被改判为失败；未触发任何数据库修复或写行为 |

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
| DSS-AC-047 | NOT_RUN | DSS-REQ-050 | 页面成功查询 | 观察工具栏与网络 | 提供“立即刷新”入口且存在 60 秒自动刷新；手工刷新可立即取得新数据 |
| DSS-AC-048 | NOT_RUN | DSS-REQ-051 | 页面成功查询后切到其他标签页/最小化 | 观察网络面板；再切回 | 页面不可见时不发送自动刷新请求；重新可见后恢复自动刷新（恢复后是否立即刷新按采纳后的草案建议 DSS-PROP-008） |
| DSS-AC-049 | NOT_RUN | DSS-REQ-052 | 页面有数据 | 触发自动与手工刷新并核对数据库 | 刷新只读取、不改变任何数据；数据库无 DML；页面展示仅为读取结果 |
| DSS-AC-050 | NOT_RUN | DSS-REQ-053 | 存在较慢的后端响应 | 在一次请求未结束时再次触发刷新 | 前一次请求未结束时不发起下一次重叠请求 |
| DSS-AC-051 | NOT_RUN | DSS-REQ-054 | 页面成功查询 | 观察刷新周期 | 自动刷新周期固定为 60 秒；计时起点、不可见计时、恢复可见刷新细节按采纳后的草案建议（DSS-PROP-006/008）执行 |

### 4.11 时间字段边界（对应 REQUIREMENTS §16）

| 编号 | 状态 | 关联需求 | 前置条件 | 操作·输入 | 预期结果 |
|---|---|---|---|---|---|
| DSS-AC-052 | NOT_RUN | DSS-REQ-055 | 三个时间字段存在各类取值 | 对照数据库只读结果观察三列 | 三列按数据库值展示，NULL 按 `--`；展示格式化不改动业务时间值 |
| DSS-AC-053 | NOT_RUN | DSS-REQ-056 | 功能已实现 | 观察整页与接口返回 | 无任何依据时间字段计算出的“超时”“异常”“离线”“长期运行”等状态或提示 |
| DSS-AC-054 | NOT_RUN | DSS-REQ-057 | 存在长时间 `SNAPSHOT_RUNNING` 的行 | 观察该行 | 不因其运行时间长而自动显示为错误或警告 |

### 4.12 加载、空数据、失败与恢复（对应 REQUIREMENTS §17）

| 编号 | 状态 | 关联需求 | 前置条件 | 操作·输入 | 预期结果 |
|---|---|---|---|---|---|
| DSS-AC-055 | NOT_RUN | DSS-REQ-058 | 后端有响应延迟 | 进入页面观察首次加载 | 加载在途时展示加载反馈，不展示空态或错误态 |
| DSS-AC-056 | NOT_RUN | DSS-REQ-059 | 首次加载失败（如接口不可用） | 制造首次失败并观察 | 展示错误状态与“重新加载”入口；点击可重试；不把失败展示成空数据或成功 |
| DSS-AC-057 | NOT_RUN | DSS-REQ-060 | 查询结果为空 | 构造空结果并查询 | 展示空数据提示；不展示成接口错误 |
| DSS-AC-058 | NOT_RUN | DSS-REQ-061 | 已有成功结果 | 制造一次刷新失败并观察；再连续制造多次失败 | 页面区分成功/失败/空/进行中状态，失败与空结果不互相伪装；给出可理解的脱敏失败提示；连续失败提示收敛不堆叠（保留旧结果、最近成功刷新时间等按采纳后的草案建议 DSS-PROP-006） |
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
| DSS-AC-065 | NOT_RUN | DSS-REQ-040, DSS-REQ-041, DSS-REQ-042, DSS-REQ-043, DSS-REQ-044, DSS-REQ-065 | 后续任务已纳入受控测试数据 DML 授权 | 备份→构造 COMPLETED、未知状态、孤立探针/源库、停用关联、类别异常等样例→执行相关验收→恢复→逐行一致核验 | 构造场景均被正确展示与宽容处理（见 §4.7、§4.8 相关用例）；完成后数据库恢复到任务开始前状态且逐行一致，备份/恢复证据齐全；全程无 DDL、无其他表操作、无生产库操作 |

### 4.17 测试与构建执行入口

| 编号 | 状态 | 关联需求 | 前置条件 | 操作·输入 | 预期结果 |
|---|---|---|---|---|---|
| DSS-AC-066 | NOT_RUN | DSS-REQ-026, DSS-REQ-031, DSS-REQ-032, DSS-REQ-035, DSS-REQ-036, DSS-REQ-046, DSS-REQ-048 | 功能已实现 | 执行后端单元/集成测试、前端组件/单测与构建 | 自动化用例覆盖状态映射（RUNNING/COMPLETED/未知）、NULL 时间 `--`、默认与确定性排序、序号唯一性、空态等可单测逻辑；后端 `mvn` 与前端 `npm` 相关测试与构建通过；可作为正式验收证据来源 |
| DSS-AC-067 | NOT_RUN | DSS-REQ-001, DSS-REQ-027, DSS-REQ-050, DSS-REQ-062 | 服务可外部访问 | 在真实浏览器中进入页面做只读目测 | 页面标题“源库快照状态”，七列表格与查询区正常；自动/手工刷新只读；整体为浅色企业后台风格；无 console 错误；无任何写动作 |

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
| DSS-REQ-017 | DSS-AC-015 | DSS-REQ-050 | DSS-AC-047, DSS-AC-067 |
| DSS-REQ-018 | DSS-AC-016 | DSS-REQ-051 | DSS-AC-048 |
| DSS-REQ-019 | DSS-AC-017 | DSS-REQ-052 | DSS-AC-049 |
| DSS-REQ-020 | DSS-AC-018 | DSS-REQ-053 | DSS-AC-050 |
| DSS-REQ-021 | DSS-AC-018 | DSS-REQ-054 | DSS-AC-051 |
| DSS-REQ-022 | DSS-AC-020 | DSS-REQ-055 | DSS-AC-052 |
| DSS-REQ-023 | DSS-AC-021, DSS-AC-024, DSS-AC-064 | DSS-REQ-056 | DSS-AC-053 |
| DSS-REQ-024 | DSS-AC-022 | DSS-REQ-057 | DSS-AC-054 |
| DSS-REQ-025 | DSS-AC-023, DSS-AC-024 | DSS-REQ-058 | DSS-AC-055 |
| DSS-REQ-026 | DSS-AC-019, DSS-AC-066 | DSS-REQ-059 | DSS-AC-056 |
| DSS-REQ-027 | DSS-AC-025, DSS-AC-067 | DSS-REQ-060 | DSS-AC-057 |
| DSS-REQ-028 | DSS-AC-026 | DSS-REQ-061 | DSS-AC-058, DSS-AC-059 |
| DSS-REQ-029 | DSS-AC-027 | DSS-REQ-062 | DSS-AC-060, DSS-AC-067 |
| DSS-REQ-030 | DSS-AC-028 | DSS-REQ-063 | DSS-AC-061 |
| DSS-REQ-031 | DSS-AC-029, DSS-AC-066 | DSS-REQ-064 | DSS-AC-062 |
| DSS-REQ-032 | DSS-AC-029, DSS-AC-066 | DSS-REQ-065 | DSS-AC-063, DSS-AC-065 |
| DSS-REQ-033 | DSS-AC-030 | | |

## 6. 未执行说明与后续执行边界

- 本文件全部 `DSS-AC-*` 为 `NOT_RUN`，本次不执行任何验收。
- 验收标准草案待用户审阅与 ChatGPT 正式复审；执行验收须在功能实现完成并满足环境条件后开展。
- 依赖数据库只读比对或受控测试数据构造的用例，执行时必须遵守项目数据库只读/审批规则；测试数据 DML 仅在后续任务提示词显式纳入 `DSS-REQ-065` 授权时执行。
- 本文件不授权任何数据库写操作或测试数据写入；验收标准获批不等于执行验收、验收通过或实现正式接受。

## 7. 文档级变更记录

| 日期 | 变更 | 依据 |
|---|---|---|
| 2026-09-05 | 建立“源库快照状态”Feature 验收草案：`DSS-AC-001~067` 用例全部 `NOT_RUN`，建立需求 ID 与验收 ID 映射（“关联需求”列）与 §5 需求—验收追踪矩阵，覆盖需求全部领域；只编写验收标准，不执行验收，不写 PASS/FAIL 结果 | DATA-SOURCE-SNAPSHOT-STATUS-REQUIREMENTS-BASELINE-001（纯文档任务；待用户审阅） |

> 关联文档：需求草案 `docs/features/data-source-snapshot-status/REQUIREMENTS.md`；功能入口与状态 `docs/features/data-source-snapshot-status/README.md`。
