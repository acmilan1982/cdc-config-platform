# 探针端管理剩余验收可执行方案草案 R1 定向纠错（CLIENT-CONFIG-REMAINING-ACCEPTANCE-ENABLEMENT-PLAN-DRAFT-001-R1）

> 任务编号：`CLIENT-CONFIG-REMAINING-ACCEPTANCE-ENABLEMENT-PLAN-DRAFT-001-R1`
> 分支：`develop`；基线提交：`37f30b730bace8eb97371578a3fd1071bbb494db`
> 范围：仅 `/config/client`（探针端管理）及其所属源码、验收资料与文档。**不**访问、测试或修改其他功能页面。
> 性质：**纯文档定向纠错**。**不执行任何业务写入，不修改已批准定义，不重判验收状态，不创建样本，不连接数据库、不调用业务接口、不运行浏览器、不启停服务。**
> 所有写执行项仍为 `NOT_REQUESTED / NOT_EXECUTED`；定义拟文仍为 `DRAFT_PENDING_REVIEW / NOT_APPROVED`；首批写方案仍为 `NOT_READY`。
> 关系：R0 报告 `CLIENT-CONFIG-REMAINING-ACCEPTANCE-ENABLEMENT-PLAN-DRAFT-001.md` 作为**历史快照保留不回写**；本 R1 报告逐位置覆盖 R0 的对应缺陷，不覆盖权威定义与 157 个状态格。
> **R2 修订注（`CLIENT-CONFIG-REMAINING-ACCEPTANCE-ENABLEMENT-PLAN-DRAFT-001-R2`）**：本文件由 R2 任务**原位最小修订**，起点 `develop` @ `46e367932437848945ab91c4f657d5125dc2429b`。**原 R1 复审入口 `CHATGPT_REMOTE_CLIENT_CONFIG_REMAINING_ACCEPTANCE_ENABLEMENT_PLAN_DRAFT_R1_REVIEW` 标为历史；现行复审入口为 `CHATGPT_REMOTE_CLIENT_CONFIG_REMAINING_ACCEPTANCE_ENABLEMENT_PLAN_DRAFT_R2_REVIEW`。** R2 仅修正 §4.2 证据复用口径（区分“已有可追溯证据 / 本批新增或需回归 / 本批不执行但此前已覆盖 / 现行仍缺”），撤回“未 PASS/NOT_RUN ⇒ 无历史证据”的推导，并收敛 §3.1 成功路径终态与 §3.5 `dataSources[]` 字段；**不表示 R2 已 `APPROVED`**，不改变任何定义、状态或写执行。

---

## 1. 现场与基线核对

| 项 | 本次实测 |
|---|---|
| 仓库 / 分支 | `/agent/cdc-config-platform` / `develop` |
| HEAD（base） | `37f30b730bace8eb97371578a3fd1071bbb494db` |
| `origin/develop` / 远端 `refs/heads/develop` | 均等于 `37f30b730bace8eb97371578a3fd1071bbb494db`（三方一致、未推进、无分叉） |
| 任务前工作区 | 仅 `.claude/settings.local.json`(M)、`docs/prompts/`(??)、`runtime-logs/`(??) 等无关内容，保持原样、未暂存、未提交 |
| 正式项目级基线 | `docs/baseline/` 六份已于任务开始时完整读取 |
| 功能级基线 | `docs/features/client-config/{README,REQUIREMENTS,DESIGN,ACCEPTANCE,UI,API,DATABASE}.md` |
| 现行四态 | `PASS` **78** / `FAIL` **0** / `BLOCKED` **64** / `NOT_RUN` **15** = **157** |
| 剩余集合 | **79 条** = 64 `BLOCKED` + 15 `NOT_RUN`（从 `ACCEPTANCE.md` §4 实际行重算） |
| 本轮 changed_ids | **`[]`**（本任务不改任何状态格） |

**复审依据**：ChatGPT 从远程 Git 对 `096ba406..37f30b73` 独立复审 **`CHANGES_REQUIRED`**：三文件变更范围正确、157 条验收状态未动；阻塞在**执行方案无法按所写步骤恢复所有允许原值、覆盖映射混淆对象/状态、现行缺口又引用旧时点结论**。本 R1 只纠正 R0 草案报告，不修改代码或 AC 定义，不推断任何新批准事件。

---

## 2. 逐位置覆盖（R0 → R1）

| R1 条目 | R0 位置 | R0 缺陷 | R1 处理 | 本报告位置 |
|---|---|---|---|---|
| R1-01 | R0 §4.2/§4.3/§4.4 | W-A 固定 `enable→disable`，允许原 `'1'` 却无法恢复 `'1'`；W-B 未按当前值确定顺序；E2 自排除与“缺席≠无占用”未说清；读后写竞态被写成无风险 | 二选一：**首批严格限定原 `'0'`**，顺序 `enable→disable`，原 `'1'` 明确排除；给出 W-A/W-B 完整可读步骤、请求次数、前像、停止条件、回退；补充 E2 自排除语义与 E1 `conflictClientIds` 只读可判定性；承认残余竞态，不加锁、不改接口 | §3 |
| R1-02.1 | R0 §3.3/§4.3/§4.4 | 首批映射包含 AC-026/083 异常 `FG_ACTIVE` 对象归零腿；AC-027 的异常数据源前置并未在对象上具备 | 首批只选正常 `'0'` 对象；AC-026/083 排除；AC-027 因正常对象不具备异常数据源前置而排除 | §4.1/§4.2 |
| R1-02.2 | R0 §4.3/§4.4 | 把“W-B 启停 `submitting` 可补 AC-115”错误映射 | 删除该映射；`onEnable/onDisable` 用 `busyClientIds/rowBusy`，`submitDialog` 才设 `submitting`；AC-115 的保存 loading 另立后续批次 | §4.2 |
| R1-02.3 | R0 §4.4 | AC-156 行高/命中区/焦点/窄视口/125% 已有已审历史证据，却被列入“仍缺”；顺序单请求被当成可覆盖多次重载交错 | 区分“首批不重跑、可复用”与“现行仍缺”；可复用腿不重列；现行仍缺**多次重载响应交错**，逐步列出真实可观察计划 | §4.2 |
| R1-02.4 | R0 §4.4 | 统一预置“所有 AC 都只能部分取证” | 逐条按自身定义写本批实际不含步骤；AC-023/151/152 若既有证据加本批完整步骤可覆盖全部要求，只写“可供未来独立重判”，本轮不翻状态 | §4.2/§4.3 |
| R1-03.1 | R0 §3.1/§3.2/§6 | AC-098 只引用旧 `accG#098`“仅 1440”，称不能替代 1920/缩窄腿 | 同时引用 R5 `accG#098` 与 round7 `AC010_client_adaptive_by_width` 的 7 源跨宽度结果；按已 APPROVED 的 R3 写明仍缺恰好 6 源组、其视口执行与测量盒模型 | §5.1 |
| R1-03.2 | R0 §3.4/§3.2 | 把 AC-092 重列为“弹窗内表格行高只读实测未做”，且 37 条样本表漏掉 092 | AC-092 纳入真实样本依赖；移除旧伪缺口；`dialogHasInnerTable=false` 已观察；样本子集按真实列表重算为 38 条 | §5.2/§5.5 |
| R1-03.3 | R0 §3.2（AC-112） | 用探针字段 `maxClientIdLen`/`maxDescLen` 证明候选超长 | 改用候选字段 `maxOrgLen=19`/`maxDsIdLen=32`；承认 002 已有 900×800 候选区宽度与滚动证据，仅长样本组合仍缺 | §5.3 |
| R1-03.4 | R0 §3.2（AC-030） | 把“预先创建两条仅大小写不同且同时存在的记录”当作前置 | 区分“一条既有记录 + 大小写变体尝试提交”与特殊历史脏数据；按 AC 自身定义写足够条件，不把预期被拒的写入当准备前置 | §5.4 |
| R1-04 | R0 §2.1.4/§2.2.4/§2.1.6/§2.2.6 | “子项不适用，不据此判 PASS”可被读成整条永久禁止 PASS；未来业务禁用态被暗示已有公共 CSS | 收敛为：不能仅凭子项不适用让整条通过，但不永久禁止整条未来 PASS；公共触发器禁用视觉**未实现**，须先完成公共实现/契约批准与页面接入再取证 | §6 |
| R1-05 | R0 §6/§6.1 | 正式验收时间误写为 9 月 8 日；002 采集时点未从证据读取；`accG#098` 与 round7 未分开；002-R1 jar 时间误写 12:21:27Z；源码用相对路径 | 逐条核对为 2026-09-28、2026-09-30T16:29:15Z、2026-11-02T05:30:51Z、jar `2026-09-22T04:21:27Z`；两来源分开；使用完整源码路径；登记错误码差异待裁定 | §7 |

---

## 3. R1-01：启停往返恢复原值（唯一推荐首批）

### 3.1 二选一结果：首批严格限定原 `'0'`

R1 要求在两种方案中二选一。本报告选择**方案 A**：

- **首批对象严格限定原值 `FG_ACTIVE='0'`**，顺序固定 `enable→disable`；**成功路径的终态为原值 `'0'`**。若 E6/E7 请求失败或发生读后写竞态，按 §3.4/§3.7 停止并报告，**不能保证所有情况下都恢复原值**（不声称绝对恢复）。
- **原值 `'1'` 的对象明确排除在首批之外**，不进入本批 W-A/W-B；它不是“已批准”或“可立即执行”的对象。若未来要覆盖原 `'1'`，须另立批次并使用 `disable→enable` 反向顺序（本报告不展开为可执行方案）。
- 不选方案 B（完整写两分支），因为首批越少分支越可审；在原 `'0'` 单一分支上把对象、前像、停止条件与回退写实，比同时维护两条分支更不容易在恢复时丢失原状态。

**W-A 与 W-B 的关系**：W-A 是 API 写腿（无浏览器），W-B 是同对象的 UI 确认/重载/重选腿（浏览器、后续独立授权）。两者都以原 `'0'` 为前提；W-B 的顺序由**当前/原值**决定，原 `'0'` 时同样为 `enable→disable`。两阶段合并执行**成功时**回到原 `'0'`；请求失败或竞态按 §3.4/§3.7 停止并报告，不声称无条件恢复。

### 3.2 对象与状态模型（首批专用对象）

| 项 | 要求 |
|---|---|
| 对象类型 | 一条**专用测试探针**，`clientId` 由负责人明确绑定；不选正在承担实际采集或他人使用的对象 |
| 原/当前 `FG_ACTIVE` | **必须恰为 `'0'`**；`'1'` 与任何非 `0/1` 值均不进入首批 |
| `DATA_SOURCE_ID` | 至少 1 个 token；每个 token 无他人占用（按 §3.3 只读核对）；不改动 token |
| 允许修改字段 | **仅 `FG_ACTIVE`**（经 E6/E7）；本批不改 `CLIENT_ID`、`CLIENT_DESC`、`DATA_SOURCE_ID` |
| 隔离 | 对象专用，且外部 `sync-client` 不引用它；启用窗口内该行满足 `FG_ACTIVE='1'`，存在被外部读取的可能，隔离不成立则 `NOT_READY` |
| 版本 | 服务/前端版本与提交明确；执行窗口内无他人并发修改 |

### 3.3 E2 自排除语义与“缺席≠无占用”

- **E2 契约**（源码 `dataSourceOptions()`）：只返回 `isCandidate(ds)` 为真的数据源（`FG_ACTIVE='1' && 类别 SOURCE && 类型 ORACLE`）；`COMMA_IN_ID` 单独标记；其余候选项用 `ownersExcluding(occupancy.get(token), exclude)` 计算占用，返回 `OCCUPIED` + `occupiedByClientIds`。`excludeClientId` 会先 `trim()`，再按**精确 owner 相等**排除。
- **首批用法**：编辑/核对目标对象时必须使用 **`excludeClientId=<原始 clientId>`**（快照中的原值），不得用新值或其他近似值；否则目标对象自身会被算作占用者，产生假冲突。
- **缺席≠无占用**：E2 只返回候选数据源；非候选数据源被**整体省略**。因此“某 token 未出现在 E2”**不能**据此认定无占用。E2 的缺席只能说明“它不是当前候选”，不能说明“没有其他探针占用它”。
- **现行接口下的只读可判定性**：E1 `GET /api/clients` 在装配每行时，对每个 token 调用 `toDataSourceViewItem()`，其中 `ownersExcluding(occupancy.get(token), ownerClientId)` 会排除该行自身，并在有其他 owner 时写入 `anomalies=[ASSIGNED_TO_MULTIPLE_CLIENTS]` 与非空 `conflictClientIds`。因此，**判断目标对象 token 是否被他人占用，可读路径是 E1 的 `dataSources[].conflictClientIds`，而不是 E2 的缺席**。E1 与 E6 使用同一占用表，静态语义一致。
- **残留限制**：E1 的 `conflictClientIds` 是**时点快照**，不是并发保证；读后写前仍可能发生变化。若 token 对应的数据源行不存在，E1 会保留该 token 并按现有异常规则标记，但本批不据此推断“可安全启用”；出现不清楚的异常即停止。

### 3.4 读后写残余竞态（不声称绝对不覆盖）

源码 `ClientConfigServiceImpl.enable()` 是 `UPDATE ... WHERE CLIENT_ID = ? SET FG_ACTIVE='1'`，`disable()` 同为按 ID 的 UPDATE；**没有**携带前像的 CAS 条件（无 `WHERE FG_ACTIVE = 前像`）。因此：

- “先 E1 读前像、再 E6/E7 写”**不是原子防并发保护**；在“读后写前”的窗口内，他人可能已修改该行，本批无法仅凭业务接口证明“绝不覆盖他人更新”。
- 首批仍要求**专用对象 + 独占操作窗口**：执行期间由负责人保证无他人操作该对象；执行前重读、执行后比对。
- 本任务**不增加锁、不修改接口、不写 SQL 兜底**；残余竞态如实登记为执行前提，而不是“已保证”。
- 若执行前重读发现前像漂移（`FG_ACTIVE` 不再是 `'0'`，或 `CLIENT_DESC`/`DATA_SOURCE_ID` 变化），停止，不覆盖、不继续。

### 3.5 W-A（API 写腿）完整步骤

> 前提：§3.2 对象已绑定、隔离成立、当前 `FG_ACTIVE='0'`、无并发。所有写 `NOT_REQUESTED / NOT_EXECUTED`。

| 步 | 操作 | 请求/次数 | 期望 | 前像/核对 | 停止条件 |
|---|---|---|---|---|---|
| A0 | 运行前快照 | `GET /api/clients?status=ALL`（或按关键词），1 次只读 | 返回 200；找到唯一目标行 | 记录 `clientId`、`clientDesc`、`rawDataSourceIds`、`dataSources[]`（含 `dataSourceId`/`org`/`dataSourceName`/`anomalies`/`conflictClientIds`）、`possibleCommaDataSourceIds`、`rowAnomalies`、`dataSourceCount`、`fgActive`、`status`；确认 `fgActive='0'` | 找不到、重复命中、`fgActive≠'0'`、任一 token 的 `conflictClientIds` 非空 |
| A1 | 候选/占用复核 | `GET /api/clients/data-source-options?excludeClientId=<原始 clientId>`，1 次只读 | 目标 token 的具体可判定性按 §3.3 | 记录候选是否存在、`notSelectableReason`；**不以缺席判定无占用** | 任何 token 在 E1 显示他人占用，或异常无法解释 |
| A2 | 启用 | `PUT /api/clients/{clientId}/enable`，**无请求体**，1 次写 | 成功 `code=200`；影响 1 行，`FG_ACTIVE '0'→'1'` | 变更字段**仅** `FG_ACTIVE` | 返回 40240/40440/40941 或其他非预期码；影响行数≠1；出现未计划请求 |
| A3 | 启用后核对 | `GET /api/clients?status=ALL`，1 次只读 | `fgActive='1'`；其他字段与 A0 一致 | 逐字段比对 A0 | 任何非 `FG_ACTIVE` 字段变化、目标消失、出现占用冲突 |
| A4 | 停用（恢复） | `PUT /api/clients/{clientId}/disable`，**无请求体**，1 次写 | 成功 `code=200`；影响 1 行，`FG_ACTIVE '1'→'0'` | 变更字段**仅** `FG_ACTIVE` | 返回 40440 或其他非预期码；影响行数≠1 |
| A5 | 还原核对 | `GET /api/clients?status=ALL`，1 次只读 | `fgActive='0'`，与 A0 前像逐字段一致 | 确认仅启停往返、无其他变化 | 未恢复原值、字段漂移、目标消失 |

**请求汇总**：**写 2 次**（A2 E6、A4 E7）；只读至少 3 次（A0/A3/A5 E1）+ 1 次 E2（A1）。无 E3/E4/E5。

### 3.6 W-B（UI 确认/重载/重选腿）完整步骤（原 `'0'`，`enable→disable`）

> 前提：W-B 为后续独立授权；不假设与 W-A 同一执行窗口。若单独执行，起始仍须为原 `'0'`。

| 步 | 操作 | 写次数 | 期望/观察 |
|---|---|---|---|
| B0 | 两个桌面视口（1440×900、1920×1080）加载列表，记录目标行固定选中与菜单 | 0 | 无“状态”列；目标行“更多”下拉含“启用”与“删除”；点击“更多”不触发双击编辑、无选中视觉 |
| B1 | 点击“更多→启用”，读取确认框标题/正文/按钮 | 0 | 标题“启用探针”、正文 `确定启用探针 {探针ID} 吗？`、按钮“取消／启用” |
| B2 | 点“取消” | **0** | 不发写请求；`FG_ACTIVE` 仍 `'0'`；固定选中不变 |
| B3 | 再次点击“启用”，在确认框出现后（点击前）读取主确认按钮正常/悬停/按下/键盘焦点 | 0 | 黑底白字，各态可辨、无蓝底或蓝黑跳色（AC-151 口径） |
| B4 | 单击“启用”确认，观察关闭与请求 | **1** | 确认框先关闭、随后**恰 1 次** E6；成功后 `FG_ACTIVE='1'`、探针 ID 后“停用”标记消失；列表重载；若目标仍在结果中按稳定 `clientId` 固定选中 |
| B5 | 在已启用行点击“更多→停用”，读取确认框 | 0 | 标题“停用探针”、正文 `确定停用探针 {探针ID} 吗？`、按钮“取消／停用” |
| B6 | 点“取消” | **0** | 不发写请求；`FG_ACTIVE` 仍 `'1'`；列表与固定选中不变 |
| B7 | 再次点击“停用”，读取主确认按钮各态 | 0 | 黑底白字、各态可辨、无蓝黑跳色（AC-152 口径） |
| B8 | 单击“停用”确认，观察关闭与请求 | **1** | 确认框先关闭、随后**恰 1 次** E7；成功后 `FG_ACTIVE='0'`、“停用”标记出现；**恢复原值 `'0'`** |
| B9 | 还原核对 | 0 | 与 B0 前像一致；仅 `FG_ACTIVE` 往返变化 |

**请求汇总**：**确认写 2 次**（B4 E6、B8 E7）；取消路径 **0 次**；两视口的读观察与确认框读取不额外产生写。顺序由**当前/原值**决定：原 `'0'` → `enable→disable`；首批不执行原 `'1'` 的 `disable→enable` 分支。

**重载/选中**：B4/B8 后观察“确认框先关闭、随后请求、列表重载、固定选中”；若目标因当前状态筛选不再显示，按 AC-145 清除固定选中。**顺序单请求不宣称覆盖多次重载响应交错**（见 §4.2 AC-156）。

### 3.7 请求次数、前像、停止条件、回退与授权

| 项 | 内容 |
|---|---|
| 总写请求 | W-A **2**（E6+E7）；W-B **2**（E6+E7 确认）；两阶段合计最多 **4**，取消路径 0；不执行 E3/E4/E5 |
| 前像 | A0/B0 采集：`clientId`、`clientDesc`、`rawDataSourceIds`、`dataSources[]`（`dataSourceId`/`org`/`anomalies`/`conflictClientIds`）、`fgActive`、`status`、列表总行数、E2 候选可判定信息、服务/前端版本与提交 |
| 停止条件 | 对象未绑定/非专用；`FG_ACTIVE≠'0'`；E1 显示 token 被他人占用；前像漂移；服务版本不明或变化；E6/E7 非预期码（尤其 40240/40941）；影响行数≠1；出现未计划请求（E3/E4/E5）或浏览器异常；无法恢复原值；发现外部采集引用；任何越权/跨页/数据库/ZK/Kafka 需求 |
| 回退 | 原 `'0'`：E6 后以 E7 恢复 `'0'`；每次写前用 E1 重读比对；若 E6 成功而 E7 失败，停止并报告当前 `'1'` 状态，等待负责人决定，**不用 SQL 强改**；若他人已改，停止、不覆盖、报告；写后逐字段比对，确认仅 `FG_ACTIVE` 变化 |
| 授权 | 负责人须明确批准：**精确 `clientId`**、E6/E7 路径与无请求体调用、W-A/W-B 步骤、恢复方向与原值、观察窗口、允许触达的 token；W-B 另需浏览器操作授权。未绑定对象、隔离未成立、占用未核实时只能 `NOT_READY`，不得写成“可立即执行” |

---

## 4. R1-02：首批覆盖表服从对象与真实状态模型

### 4.1 对象/状态约束

1. **只选正常 `'0'` 对象**。首批对象原 `FG_ACTIVE='0'`，经 E6 短暂变 `'1'`，再经 E7 回到 `'0'`。
2. **AC-026/083 排除**：两者的前置明确要求 `FG_ACTIVE` 为非 `0/1` 的**异常对象**；首批正常对象不能证明异常对象行为，且 E6 对非 `0/1` 返回 40240、无 API 可恢复异常原值。首批**不覆盖**其“停用归零腿”。
3. **AC-027 排除**：其前置要求关联停用/不存在/含逗号/重复分配的**异常数据源**；正常对象的干净数据源不满足。除非负责人绑定的对象实际具备该前置（本轮未核实、也不选这样的对象），否则不得列为首批已覆盖。
4. **AC-115 不映射到 W-B**：`onEnable/onDisable` 使用 `busyClientIds/rowBusy`；`submitDialog` 才设置 `submitting`。E6/E7 往返不会触发 AC-115 的保存加载态。保存写另立后续批次。
5. **AC-156 分两类**：行高/命中区/焦点/窄视口/真实 125% 缩放已有已审历史证据，**首批不重跑、可复用**；**现行仍缺**的是“多次重载响应交错”的竞态，顺序单请求不能宣称覆盖。

### 4.2 纠正后的覆盖表（四类证据口径）

> **列义（R2 起）**：
> - **已有可追溯的实际证据**：已入仓、可回指的验收证据（文件 + JSON 键 + 观察内容）；不因该 AC 当前为 `BLOCKED`/`NOT_RUN` 而清零。
> - **本批新增采集/需回归的步骤**：首批 W-A/W-B 计划实际执行的步骤，或需在真实对象上回归的既有观察。
> - **本批不执行但此前已覆盖（复用，不重跑）**：本批不执行、但已有客观证据可直接复用的步骤。
> - **现行仍缺（本批不能补）**：按该 AC 自身定义确实仍缺、且首批对象/授权/边界内不能补齐的步骤。
> - **未来可判性**：既有证据 + 本批完整步骤后能否由未来独立任务覆盖全部要求。**本轮不翻任何状态。**
>
> 证据简称：`002` = `reports/evidence/CLIENT-CONFIG-TARGETED-READONLY-ACCEPTANCE-SUPPLEMENT-002/`（采集 `2026-09-30T16:29:15Z`）；`round7` = `reports/evidence/CLIENT-CONFIG-ROUND7-TARGETED-ACCEPTANCE-AND-VISUAL-RECORD-001/round7-targeted-readonly-results.json`；`zoom` = `reports/evidence/CLIENT-CONFIG-ROW-HEIGHT-AND-OPTIONAL-ELLIPSIS-IMPLEMENTATION-001-R1/real-zoom-summary.json`。**验收状态（`BLOCKED`/`NOT_RUN`）不是证据；不得以状态格替代证据检索。**

| AC | 已有可追溯的实际证据（来源+内容） | 本批新增采集/需回归的步骤 | 本批不执行但此前已覆盖（复用，不重跑） | 现行仍缺（本批不能补） | 未来可判性 |
|---|---|---|---|---|---|
| `CCFG-AC-022` | `002 s2-list-results.json → viewports.*.structure`：`hasStatusColumn=false`、六列表头；`menu.itemTexts=["启用","删除"]`（停用行）；`idMarkers` 第 1–15 行为“停用”标记；`002 s2-confirm-results.json → viewports.*.enableBox`（标题/正文/按钮）与 `enablePrimary` 各态。 | W-B 对原 `'0'` 行执行“更多→启用”确认：确认框先关闭、恰 1 次 E6、E1 `fgActive='1'`、重载后 ID 后“停用”标记消失；两视口 1440×900/1920×1080 观察。 | 无“状态”列观察、停用行下拉观察、确认框结构与主按钮视觉观察、标记视觉观察——002 已覆盖，不重跑（执行时若回归视觉，属计划回归而非首次覆盖）。 | 定义前置“列表含启用与停用探针**各若干条**”未满足：首批仅一个原 `'0'` 对象，启用后只有短期一条 `'1'`；多行稳定样本仍缺。 | 不能仅凭本批判整条；需多行启停样本后独立重判。 |
| `CCFG-AC-023` | `002 s2-confirm-results.json → viewports.*.disableBox`（标题“停用探针”、正文、按钮“取消/停用”、`cc-confirm--disable`）与 `disablePrimary` 各态；`writeInterception.nonGetAttempts=0` 与探针 `cancelBox`（`probe-s2-confirm.cjs` 157/165 行）表明取消观察 0 写；`002 s2-list-results.json → viewports.*.abnormalRowMenu.itemTexts=["停用","删除"]`（该观察取自异常行 `idx=16`）。 | W-B 先 E6 形成真实 `'1'` 行；在真实 `'1'` 行回归停用确认框（此前 `disableBox` 取自异常行）；取消 0 写；单击确认 → 先关闭后请求、恰 1 次 E7、E1 `fgActive='0'`、ID 后“停用”标记出现、列表重载。 | 停用确认框标题/正文/按钮与主按钮各视觉态、取消不写的观察——002 已覆盖；真实 `'1'` 行回归属本批计划回归。 | —（按本条定义，W-B 形成 `'1'` 行后可完整执行；不以 `NOT_RUN` 推导“无历史证据”）。 | **可供未来独立重判**；本轮不翻状态。 |
| `CCFG-AC-024` | `002 s2-confirm-results.json → viewports.*.enableBox`/`enablePrimary`（原 `'0'` 行 `targets.offRowIdx=1`）与 `writeInterception.nonGetAttempts=0`；`002 s2-list-results.json → viewports.*.menu.itemTexts=["启用","删除"]`。 | W-A E6 写 + E1 `fgActive='1'`；W-B 启用确认成功。 | 启用确认框/主按钮视觉观察、菜单条目观察、取消 0 写观察——002 已覆盖。 | 与该探针对应进程的观察；证明未直接启停/重启/通知 `sync-client`、未操作 ZooKeeper/Kafka——本批不授权。 | 不能仅凭本批判整条；缺进程/ZK/Kafka 腿。 |
| `CCFG-AC-026` | `002 s2-list-results.json → viewports.*.idMarkers[15]`：`abnormal` 为“异常：”红标；`viewports.*.abnormalRowMenu.itemTexts=["停用","删除"]`（无“启用”）；`abnormalRowCount=1`。 | 本批不采集（异常对象不在首批；E6 对非 `0/1` 返回 40240，且无 API 恢复异常原值）。 | 异常红标视觉观察、异常行下拉条目（无“启用”）观察——002 已覆盖。 | 异常记录 E7 停用归 `'0'`、E5 删除；首批不执行且无安全恢复路径。 | 不能；需异常对象与 E7/E5 授权。 |
| `CCFG-AC-027` | `002 s2-dialog-results.json → sampleFacts`：`anomalousRows=8`、`ambiguousRows=1`、`multiSourceWithAnomaly=true`；`002 s2-list-results.json → idMarkers` 异常红标与 `abnormalRowMenu` 条目。 | 本批不采集（正常对象不具备“关联停用/不存在/含逗号/重复分配数据源、状态为启用”的前置）。 | 异常/歧义样本存在性观察、行级异常标记与菜单观察——002 已覆盖；不借用相邻 AC 的 `PASS`。 | 状态为启用的异常数据源探针上的 E7 停用、E5 删除、E6 启用（含重复分配冲突阻断）。 | 不能；需此类对象与写授权。 |
| `CCFG-AC-082` | `002 s2-list-results.json → viewports.*.structure.headersRightmost="操作"`、六列表头；`menu.itemTexts=["启用","删除"]`（`'0'` 行）；`abnormalRowMenu.itemTexts=["停用","删除"]`（异常行）；`rowEventIsolation.editDialogOpened=false`；`rowClick` 固定选中/再次取消/切换他行；三视口 1440×900/1920×1080/900×800。 | W-B E6 形成 `'1'` 行后读取该行下拉（应为“停用/删除”）；确认 `'1'`、`'0'`、异常三类共存；点击“更多”无选中视觉、不触发双击编辑。 | 最右固定“操作”列观察、`'0'` 行与异常行下拉观察、菜单事件隔离观察——002 已覆盖，不重跑。 | —（执行时若异常行或 `'0'` 行样本漂移，则该项需重判；本批未执行前不声称已覆盖）。 | **可供未来独立重判**（E6 后三类共存；异常行既有）。 |
| `CCFG-AC-083` | `002 s2-list-results.json → viewports.*.idMarkers[15].abnormal`（“异常：”红标）与 `abnormalRowMenu.itemTexts=["停用","删除"]`（无“启用”）。 | 本批不采集（异常对象不在首批）。 | 异常行下拉条目（无“启用”）观察——002 已覆盖。 | 异常记录 E7 停用后 `FG_ACTIVE→0`、E5 删除；首批不执行且无安全恢复路径。 | 不能；需异常对象与 E7/E5 授权。 |
| `CCFG-AC-084` | `002 s2-list-results.json → menu.itemTexts=["启用","删除"]`、`abnormalRowMenu.itemTexts=["停用","删除"]`、`menuHoverNonDanger`、`keyboardMenu`；`002 s2-confirm-results.json → enableBox`/`disableBox`/`enablePrimary`/`disablePrimary`；`writeInterception.nonGetAttempts=0`。 | W-B 启用/停用各一次确认；确认框先关闭后请求、恰 1 次写；取消 0 写；成功后状态。 | 菜单条目观察、确认框结构与主按钮视觉观察、取消 0 写观察——002 已覆盖。 | E5 删除；慢请求与重复点击；业务冲突失败反馈与行级忙碌复位。 | 不能；缺删除、慢请求、冲突与失败分支。 |
| `CCFG-AC-103` | `002 s2-list-results.json → viewports.*.rowEventIsolation`：`singleClickTrigger`/`doubleClickTrigger`/`doubleClickMenuItem` 三者 `editDialog.visible=false`；`rowClick` 固定选中行为；`keyboardMenu`；`002 s2-confirm-results.json` 的 `cancelBox` 与 `writeInterception.nonGetAttempts=0`（取消 0 写）；`enableBox`/`disableBox`。 | W-B 启用/停用各一次确认，观察恰 1 次写；取消 0 写；若执行时出现真实行级忙碌，记录入口/条目禁用与不重复提交（慢请求不在首批）。 | 单击/双击触发器、菜单项区域双击不误开编辑；取消确认 0 写——002 已覆盖。 | E5 删除；失败复位；慢请求下行级忙碌禁用与不重复提交。 | 不能；缺删除、失败复位、慢请求忙碌观察。 |
| `CCFG-AC-115` | `002 s2-dialog-results.json → viewports.*.create.submitStates` 与 `edit.submitStates`：`normal` bg `rgb(9, 9, 11)`、`hover` `rgb(39, 39, 42)`、`pressed` `rgb(24, 24, 27)`、`focusTab`（`tabFrom="取消"`）`rgb(39, 39, 42)`；`secondary.cancel`/`secondary.autogen` bg `rgb(255, 255, 255)`、color `rgb(96, 98, 102)`、border `rgb(220, 223, 230)`；`edit.idToggleStyle` bg `rgba(0, 0, 0, 0)`、color `rgb(64, 158, 255)`；`edit.idKeyboard`（`inputDisabledBefore=true`、`toggleText="修改探针 ID"`、`hasLockHint=true`）。 | 本批不采集（启停走 `busyClientIds/rowBusy`，非 `submitting`；保存 loading 另立后续批次）。 | 新增/编辑主提交按钮正常、Hover、按下、真实 Tab 焦点观察；次要按钮非黑观察；修改探针 ID 未变黑观察——002 已覆盖，不重跑。 | 保存请求中的 `submitting`/`loading` 外观、loading 期间不可重复提交、无蓝黑跳色；需保存写与请求延迟。 | 不能；保存写另立后续批次。 |
| `CCFG-AC-139` | `002 s2-confirm-results.json → viewports.*.disableBox`（标题/正文/按钮/`cc-confirm--disable`）与 `disablePrimary` 各态；`cancelBox` + `writeInterception.nonGetAttempts=0`；`002 s2-list-results.json → abnormalRowMenu`（取自异常行 `idx=16`）。 | W-B 先 E6 形成真实 `'1'` 行；停用确认：取消 0 写、状态不变；单击确认 → 先关闭后请求、恰 1 次 E7、成功后 `'0'` 与“停用”标记出现；在真实 `'1'` 行回归确认框。 | 停用确认框结构/视觉观察、取消 0 写观察——002 已覆盖；真实 `'1'` 行回归属本批计划回归。 | 制造一次停用失败（业务冲突或网络错误）的失败提示与状态不变。 | 不能；缺失败分支。 |
| `CCFG-AC-140` | `002 s2-confirm-results.json → targets.offRowIdx=1`（真实 `'0'` 行）、`enableBox`（标题/正文/按钮/`cc-confirm--enable`）、`enablePrimary` 各态；`cancelBox` + `writeInterception.nonGetAttempts=0`；`002 s2-list-results.json → menu.itemTexts=["启用","删除"]`、`structure.idMarkers` 第 1–15 行“停用”标记。 | W-B 原 `'0'` 行：确认框读取、取消 0 写、固定选中不变；单击确认 → 先关闭后请求、恰 1 次 E6、成功后 `'1'`、标记消失。 | 确认框结构/视觉观察、取消 0 写观察、菜单条目观察——002 已覆盖。 | 制造一次启用失败（重复分配冲突或网络错误）的失败提示与状态不变；连续操作不重复请求的失败/慢请求分支。 | 不能；成功与写计数腿本批可补，失败分支仍缺。 |
| `CCFG-AC-145` | `002 s2-list-results.json → rowClick.afterFirstClick.highlightRows=[1]`、`afterSecondClickSame=[]`、`afterClickOtherRow=[3]`；`structure.batchAbsence`（`hasSelectionColumn=false`/`hasRowCheckbox=false`/`hasDeleteSelected=false`/`hasBatchWord=false`/`hasSelectedHint=false`）；`rowEventIsolation`；`keyboardMenu`。 | W-B 单行固定选中；取消确认不改变选中；启停成功后按可见性重选（单对象）。 | 单行固定/再次取消/切换他行观察、无复选框/多选/批量入口观察、行内控件事件隔离观察——002 已覆盖。 | 多条探针下对另一行 B 启停的 A/B 转移；状态筛选下目标消失清除选中；删除成功/取消/失败；启停失败分支。 | 不能；缺多行 A/B、删除与失败分支。 |
| `CCFG-AC-151` | `002 s2-confirm-results.json → targets.offRowIdx=1`（真实 `'0'` 行）、`enableBox`（标题“启用探针”、正文 `确定启用探针 <ID> 吗？`、按钮“取消/启用”、`cc-confirm--enable`）、`enablePrimary` 的 `normal`/`autoFocusResting`/`hover`/`pressed`/`focusTab`（黑底白字、焦点环 `2px rgb(160, 207, 255)`）；`cancelBox` + `writeInterception.nonGetAttempts=0`；`002 s2-list-results.json → menu.itemTexts=["启用","删除"]`。 | W-B 原 `'0'` 行实际单击“启用”：确认框先关闭、随后恰 1 次 E6、成功后 `'1'`、标记消失；一次确认只写一次。 | 主确认按钮正常/悬停/按下/键盘焦点各态观察、标题/正文/按钮文案观察、取消 0 写观察——002 已覆盖，不重跑（如需视觉回归，属计划回归，不是此前未覆盖）。 | —（按本条定义，既有证据 + W-B 完整步骤可覆盖全部要求；本轮未执行，不预判）。 | **可供未来独立重判**；本轮不翻状态。 |
| `CCFG-AC-152` | `002 s2-confirm-results.json → disableBox`（标题“停用探针”、正文 `确定停用探针 <ID> 吗？`、按钮“取消/停用”、`cc-confirm--disable`）、`disablePrimary` 的 `normal`/`autoFocusResting`/`hover`/`pressed`/`focusTab`（黑底白字、焦点环）；`cancelBox` + `writeInterception.nonGetAttempts=0`；注意 `targets.onRowIdx=16` 为异常行，不是真实 `'1'` 行。 | W-B 先 E6 形成真实 `'1'` 行；停用确认实际单击 → 先关闭后请求、恰 1 次 E7、成功后 `'0'`、标记出现；在真实 `'1'` 行回归确认框视觉。 | 停用确认框标题/正文/按钮观察、主按钮各态观察、取消 0 写观察——002 已覆盖；真实 `'1'` 行上的视觉回归属本批计划回归，不是首次覆盖。 | —（按本条定义，W-B 形成 `'1'` 行后可完整执行）。 | **可供未来独立重判**；本轮不翻状态。 |
| `CCFG-AC-153` | `002 s2-list-results.json → rowClick`（单行固定/再次取消/切换他行）、`structure.batchAbsence`、`rowEventIsolation`、`keyboardMenu`；`round7 → AC156_menu_isolation`（`editDialogOpen=false`）、`AC156_dblclick_edit`（`editDialogOpen=true`）。 | W-B 启停成功后普通重载的单对象重选；取消确认不改变选中。 | 单行固定/取消/切换观察、双击编辑观察、行内控件事件隔离观察、无复选框/多选/批量入口观察——002/round7 已覆盖。 | 普通查询/重试/删除成功等普通重载清除选中；删除成功重载；多行启停重选。 | 不能；缺多行、删除与重试。 |
| `CCFG-AC-156` | `round7 → AC155_156_client_1440x900.rows[]`：`rowH=48`、`entryW/H=28`、`entryRadius="6px"`、`vCentered=true`、`boxInsideCell=true`、`boxInsideRow=true`；`AC156_focus`：`tabReached=true`、`outline=2px solid rgb(64, 158, 255)`、`outlineOffset="-2px"`、`ariaLabel="更多操作：<ID>"`；`AC156_regressions_readonly`；`AC156_menu_isolation`（`editDialogOpen=false`、`fixedSelectedRows=0`）；`AC156_dblclick_edit`（`editDialogOpen=true`、`fixedSelectedRows=1`）；`AC156_tab_reaches_ellipsis=true`；`zoom → zoomLegs.100/125.hitBoxCssPx` 均 `28×28`，125% 物理 `35×35`。 | W-B 一次启用确认与重载、一次停用确认与重载；单次重载后的固定选中；单击/取消/双击/键盘/菜单事件隔离回归观察。 | 行高/命中区/焦点/窄视口/真实 125% 缩放观察、单击固定/取消/切换观察、菜单隔离观察、双击编辑观察——round7/zoom 已覆盖，不重跑。 | 多次重载响应交错竞态（顺序单请求无法制造/证明交错）；写操作触发的多次重载竞态。 | 不能仅凭本批判整条；缺多次重载交错。 |

**明确排除**：`CCFG-AC-026`、`CCFG-AC-027`、`CCFG-AC-083`（异常对象/异常数据源）与 `CCFG-AC-115`（保存 loading）不在首批**执行**范围；其既有 002 可复用证据仍按下表复用，不因排除而清零。**首批不含**删除（E5）、失败注入、慢请求、进程/ZooKeeper/Kafka 观察、跨页对照、异常/歧义样本**的新采集**、恰好 6 源/字节边界/>256 生成样本的新采集。

### 4.3 不预置“所有 AC 都只能部分取证”

- 上表逐条写的是**四类证据口径下的实际状态**，不把“本批不执行”直接等同于“按自身定义仍缺”，也不统一套用“部分取证”结论。
- `CCFG-AC-023`/`082`/`151`/`152` 在既有证据 + 本批完整步骤后，**可能**覆盖全部要求，因此只写“可供未来独立重判”；本轮仍不翻任何状态。
- 其余条目写出的缺口均有定义原文依据（多行样本、异常样本、删除、失败注入、慢请求、进程观察、多次重载交错等），**不为维持 `BLOCKED` 虚构新缺口**。
- 本表各行均检索到至少一项可复用证据并已给出文件/JSON 键；**未使用状态格（`BLOCKED`/`NOT_RUN`）推导“无历史证据”**。仅当确实查不到可复用证据时才写“未找到”并注明检索范围；本表无此类“未找到”行。
- 任何 AC 是否 `PASS`，由未来独立验收任务按完整定义重新判定；本报告不制造状态变更。

---

## 5. R1-03：最新已审的缺口时间线与样本归属

### 5.1 `CCFG-AC-098`：双来源与仍缺

| 来源 | 时点 | 内容 | 边界 |
|---|---|---|---|
| `CCFG-FORMAL-ACCEPTANCE-EXECUTION-001-R5.md` 的 `accG#098` | 2026-09-28（R5 对**既有执行证据**的复核） | 7 源样本 `total=7`、`direct=1`、`plus=+6`、`srcW=271`，**仅 1440×900** | 是 R5 时点的复核，不是 round7 |
| `CLIENT-CONFIG-ROUND7-TARGETED-ACCEPTANCE-AND-VISUAL-RECORD-001` 的 `AC010_client_adaptive_by_width` | 2026-09-29（**另一来源**） | 同一样本 `idx=13`/`tagTotal=7`：**1920×1080 → 可见 5 / `+2` / `plusMatchesHidden=true`**；**1440×900 → 1 / `+6` / true**；**900×800 → 1 / `+6` / true**；`rowH=48` | 7 源组跨宽度已覆盖；无盒模型测量字段 |

**纠正结论**：R0 只引用 `accG#098`“仅 1440”并称不能替代 1920/缩窄腿，是**旧时点结论**。按已 APPROVED 的缺口盘点 R3，7 源组跨宽度**已覆盖**；`CCFG-AC-098` 现仍缺：

1. **恰好 6 源**样本（历史只覆盖 ≥7 源组；当前环境是否具备**未知**，本轮未核实）；
2. **6 源组**在 1440×900、1920×1080 与缩窄窗口的执行；
3. **测量盒模型**的直接证据（round7 只有 `tagVisible`/`+N`/`plusMatchesHidden`，无盒模型测量字段，不声称已覆盖）。

R5 的 `STEP MISSING` 属当时时点结论，不再冒充现行缺口。

### 5.2 `CCFG-AC-092`：纳入真实样本依赖，移除旧伪缺口

- 002-R1 §5 已审说明：AC-092 的 `BLOCKED` 原因**仅为**当前库内缺“超长 ID / 超长描述”样本（`maxClientIdLen=19`、`maxDescLen=152`），与本轮是否重复跨页对照无关。
- 002 证据已观察 `dialogHasInnerTable=false`：新增/编辑弹窗**没有内表格**，因此“弹窗内表格行高只读实测未做”不是现行缺口，应从“仍缺”列移除；该子预期已由“无内表格”客观事实覆盖。
- 将 AC-092 纳入**真实样本依赖**（§5.5），并重算样本子集为 **38 条**；不硬套 R0 的“37”。

### 5.3 `CCFG-AC-112`：候选字段与既有窄视口证据

- 候选源的长名称/ID 必须引用**候选字段** `maxOrgLen=19`、`maxDsIdLen=32`（002 `s2-dialog-results.json` `/sampleFacts`），**不能**用探针字段 `maxClientIdLen`/`maxDescLen` 证明。
- 002 证据已有 **900×800 窄视口**观察：新增与编辑模式下 `optionsWiderThanChosen=true`（候选区比已选区宽 **47.312px**）、`optList.scrollable=true`；1440/1920 为 50.656px。因此**不能**写成“完全没有窄视口证据”。
- 仍缺的是：超长机构名/超长候选 ID/不可选原因**与长样本组合**的可读性；当前样本 `maxOrgLen=19`/`maxDsIdLen=32` 是否算“超长”未知，本轮未核实。

### 5.4 `CCFG-AC-030`：最小充分条件

- 现行 `assertClientIdUnique()` 使用 `equalsIgnoreCase` 并排除**精确原 ID**；它**不要求**预先通过业务接口创建两条仅大小写不同且**同时存在**的记录。
- 区分两类情形：
  - **常规最小条件**：一条既有记录（如 `probe-001`）+ 以其大小写变体（`Probe-001`/`PROBE-001`）尝试提交；①③只需这一条既有记录；②需要一条无冲突的新 ID；④需要两个库内**原本不存在**的全新 ID（如 `race-001`/`RACE-001`）用于并发场景。
  - **特殊历史脏数据**：库内已存在两条仅大小写不同的记录，这是历史数据状态，**不是**本 AC 的准备前置，也不得用“预创建两条”来制造。
- 预期会被拒绝的写入（①③）**不是**准备前置；只有②需要一次成功保存，④需要并发授权。不得把“两笔都因 `probe-001` 冲突而失败”当作并发场景。

### 5.5 38 条样本依赖表（按真实列表重算）

> 列义：`AC ID → 自身缺失步骤 → 精确样本条件 → 已有历史证据 → 当前可用性 → 只读可补部分 → 仍需写授权部分`。
> 「当前可用性」一律为**历史观察 + 本轮未核实**；不得当作当前事实。相对 R0：新增 `CCFG-AC-092`；纠正 `030/092/098/112`；**所有对正式验收执行报告的引用时点改为 2026-09-28**（R0 误写为 9 月 8 日）。

| AC ID | 自身缺失步骤 | 精确样本条件 | 已有历史证据 | 当前可用性 | 只读可补部分 | 仍需写授权部分 |
|---|---|---|---|---|---|---|
| `CCFG-AC-012` | 机构名称超长时的标签/Tooltip 观察 | 一条 `DATA_SOURCE_ORG` 超长的数据源 | 2026-09-30 002 `maxDescLen=152`、`maxClientIdLen=19`；无超长 ORG 证据 | 未知；**本轮未核实** | 标签主文本、Tooltip 单实例/延迟、窄视口可读性 | 无写腿（本条只读）；样本本身需获准提供 |
| `CCFG-AC-013` | 行级异常数据源（停用/不存在/逗号/重复分配）观察 | 至少各一条对应异常数据源/分配 | 2026-09-28 执行报告 §7.3 列 `CCFG-AC-R1-ABN`(X,mock7)、`...-HIST-COM`(0,含逗号)、`...-OFF`(0,DS08)、`...-ON`(0,DS01..DS07)；2026-09-30 缺口盘点观察“零 `FG_ACTIVE='1'` 行” | 未知；**本轮未核实** | 异常标签/Tooltip、冲突探针信息、行级提示 | 无写腿（本条只读）；样本本身需获准提供 |
| `CCFG-AC-015` | 同一行 `DATA_SOURCE_ID` 含 Trim 后重复项的计数/标签一致 | 一行原始 CSV 含重复 token（如 `DS01,DS01`） | 2026-09-28 W7 计划曾建议插入，**未执行**；无已入仓观察 | 未知；**本轮未核实** | 若样本存在，可只读核对计数/标签/去重展示 | 样本创建需写授权；本条观察本身只读 |
| `CCFG-AC-022` | 启用写 + 启用后状态/标记观察；前置“启用与停用各若干条” | 至少一条 `FG_ACTIVE='0'` 的专用探针 + 多行启停样本 | 2026-09-28 夹具含 OFF/ON；2026-09-30 缺口盘点观察“零 `FG_ACTIVE='1'` 行” | 未知；**本轮未核实** | 无状态列、下拉含“启用”、确认框结构（不确认） | E6 启用写；UI 确认与成功后标记消失 |
| `CCFG-AC-023` | 停用写 + 停用后状态/标记观察 | 至少一条 `FG_ACTIVE='1'` 的启用探针（可由本批 E6 形成） | 同上；历史上零启用行 | 未知；**本轮未核实** | 下拉含“停用”、确认框结构（不确认） | E7 停用写；UI 确认与成功后标记出现 |
| `CCFG-AC-024` | 启用写 + 数据库/进程观察 | 一条停用探针 | 同上 | 未知；**本轮未核实** | 无（本条重点是写后状态与进程边界） | E6 写；进程/ZooKeeper/Kafka 观察另需授权 |
| `CCFG-AC-026` | 异常记录可停用、删除；下拉无“启用” | 一条 `FG_ACTIVE` 非 `0/1` 的记录 | 2026-09-28 夹具 `CCFG-AC-R1-ABN`(X,mock7)；未在当前库核实 | 未知；**本轮未核实** | 下拉条目只读观察（删除/停用、无启用） | E7 停用；E5 删除 |
| `CCFG-AC-027` | 异常数据源不阻止停用/删除，除重复分配外不阻止启用 | 一条关联停用/不存在/逗号/重复分配数据源、状态为启用的探针 | 2026-09-28 夹具含 ABN/HIST-COM；历史零启用行 | 未知；**本轮未核实** | 下拉条目/异常提示只读观察 | E7 停用、E5 删除、E6 启用 |
| `CCFG-AC-030` | ① 既有记录的大小写变体提交；② 无冲突新 ID 保存原样；③ 绕过前端提交大小写变体；④ 两个全新 ID 并发 | **一条既有记录**（如 `probe-001`）+ 其大小写变体；②一条可保存的新 ID；④库内原本不存在的 `race-001`/`RACE-001`。**不要求**预创建两条仅大小写不同且同时存在的记录 | 2026-09-28 执行报告曾记“库内现无 `probe-001`，须新建”；未执行 | 未知；**本轮未核实** | 若既有记录存在，可只读观察提交被拒 | E3/E4 写 + 直接接口调用；④另需并发授权 |
| `CCFG-AC-033` | 1024/1025/Emoji 字节边界保存（绕过前端） | 恰好 1024 UTF-8 字节、1025 字节、含 Emoji/代理对的描述文本 | 2026-09-30 002 观察 `maxDescLen=152`；无边界样本 | 未知；**本轮未核实** | 无（重点是保存结果） | E3/E4 写；绕过前端直调 |
| `CCFG-AC-039` | `probe-001`/`alpha-01` 类样本改名写 | 可改名的专用探针（原 ID/新 ID 明确） | 2026-09-28 W3 计划曾用 `CCFG-AC-R1-NEW*` 做改 ID；未执行 | 未知；**本轮未核实** | 编辑弹窗打开后的只读观察 | E4 改名写 |
| `CCFG-AC-044` | 多源（含同 ORG）选择、逗号连接/不去重 | ≥2 个可选源，且其中含机构名称相同者 | 2026-09-28 候选 13 项、11 项被占用 → 前端仅 1 项可选；同 ORG 未取证 | 未知；**本轮未核实** | 候选列表、同 ORG 不去重、逗号连接展示 | 无写腿（本条只读）；样本本身需获准提供 |
| `CCFG-AC-046` | 再次点击重新覆盖到新选择 | ≥2 个可选源 | 同上（当时仅 1 项可选） | 未知；**本轮未核实** | 新增与编辑弹窗中再次点击覆盖 | 无写腿（本条只读） |
| `CCFG-AC-048` | V2/R2 四分支：恰好 1024 BYTE、>1024 BYTE、ORG 不可得、去空白后为空 | 四类各自满足的已选源组 | 无已入仓边界样本；2026-09-30 `maxDescLen=152` | 未知；**本轮未核实** | 自动生成结果、截断/提示、保持原描述 | 无写腿（本条只读）；样本本身需获准提供 |
| `CCFG-AC-054` | 编辑态“已选 + 改 ID 未保存”下候选列表的占用标记 | 一条可进入编辑态、能改 ID 未保存的记录 | 无明确已入仓样本；历史只有候选占用观察 | 未知；**本轮未核实** | 候选列表自排除、占用标记只读观察 | 无写腿（打开编辑不写） |
| `CCFG-AC-057` | 停用占用样本上的写 | 一个被停用探针占用的源 + 一条可用/不可用组合 | 2026-09-28 报告指出某真实数据源被若干探针占用、合成夹具 `CCFG-AC-R1-DS01~07` 被 `...-ON` 占用 | 未知；**本轮未核实** | 占用原因/冲突探针只读展示 | E3/E4/E6 写 |
| `CCFG-AC-059` | 启用重复分配样本上的写 | 目标探针的数据源已被另一探针占用 | 同上 | 未知；**本轮未核实** | 候选占用标记只读观察 | E6 启用写（预期 40941） |
| `CCFG-AC-063` | 多探针占用样本上的写 | 至少两个探针对同一源形成占用关系 | 2026-09-28 候选占用关系；未在当前库核实 | 未知；**本轮未核实** | 占用标记只读观察 | E3/E4 写 |
| `CCFG-AC-064` | 并发争抢（写） | 两个专用对象/两个请求，可控并发 | 仅 2026-09-28 W8 计划（`RACE01`/`RACE02`），**未执行** | 未知；**本轮未核实** | 无 | 并发 E3/E4 写；需单独并发授权 |
| `CCFG-AC-068` | 异常数据源编辑保存阻断 | 一条含异常数据源的可编辑探针 | 2026-09-28 夹具 ABN/HIST-COM；未在当前库核实 | 未知；**本轮未核实** | 编辑弹窗异常提示只读观察 | E4 编辑写（预期 40942/失败提示） |
| `CCFG-AC-082` | 启用行下拉 `'1'→[删除,停用]` 腿；三类共存 | 同时存在 `'1'`、`'0'` 与非 `0/1` 异常记录 | 2026-09-30 缺口盘点观察零启用行；历史曾记录一条启用行 | 未知；**本轮未核实** | 启用行下拉条目、无选中视觉、不触发编辑 | 无写腿（本条只读）；样本本身可能需 E6 创建 |
| `CCFG-AC-083` | 异常记录下拉无“启用”，停用后 `FG_ACTIVE→0` | 一条 `FG_ACTIVE` 非 `0/1` 的记录 | 2026-09-28 夹具 `CCFG-AC-R1-ABN`；未在当前库核实 | 未知；**本轮未核实** | 下拉条目只读观察 | E7 停用写 |
| `CCFG-AC-087` | 启用行停用标识与参考页并排对照 | 一条 `FG_ACTIVE='1'` 行 + 参考页停用标识 | 历史零启用行；跨页对照未在本任务授权 | 未知；**本轮未核实** | 标识视觉、间距、不挤压操作列 | 无写腿；跨页对照需后续获准 |
| `CCFG-AC-092` | 缩行后三态标识/标签/行级提示/`+N`/操作入口；双击编辑；滚动表头/固定列 | 含多个数据源、**超长 ID**、**超长描述**、异常数据源的记录 | 002-R1 §5 明确 `BLOCKED` 仅因超长 ID/描述样本缺失；002 `s2-dialog-results.json`：`dialogHasInnerTable=false`（弹窗无内表格）、`maxClientIdLen=19`、`maxDescLen=152`、`multiSourceWithAnomaly=true` | 未知；**本轮未核实** | 行高/标签/提示/`+N`/入口只读核对；弹窗无内表格已观察 | 无写腿（本条只读）；样本需负责人提供 |
| `CCFG-AC-095` | 项级异常标签红标 + Tooltip 原因 | 一条含既有 `anomalies` 的数据源分配 | 2026-09-28 夹具 ABN/HIST-COM；未在当前库核实 | 未知；**本轮未核实** | 红标、Tooltip 原因、冲突探针信息 | 无写腿（本条只读） |
| `CCFG-AC-096` | `COMMA_PROTOCOL_AMBIGUOUS` 行的中性色 + 整行提示 | 一行原始 CSV 含已知含逗号数据源 ID | 2026-09-28 `CCFG-AC-R1-HIST-COM`(0,`CCFG-AC-R1-COM,ID`)；未在当前库核实 | 未知；**本轮未核实** | 中性色、整行歧义提示、与绿色区分 | 无写腿（本条只读） |
| `CCFG-AC-097` | 整行歧义 + 项级异常共存的红色优先 | 同一行同时含 `COMMA_PROTOCOL_AMBIGUOUS` 与明确项级 `anomalies` | 无已入仓共存样本 | 未知；**本轮未核实** | 红色优先、整行提示保留、互不覆盖 | 无写腿（本条只读） |
| `CCFG-AC-098` | **恰好 6 源**两桌面视口 + 缩窄窗口执行；**测量盒模型**直接核对 | 一条恰好 6 个已分配数据源的探针；≥7 源**不能**替代 | R5 `accG#098`（2026-09-28，对既有执行证据的复核）：7 源 `total=7/direct=1/plus=+6/srcW=271`，仅 1440×900；round7（2026-09-29，另一来源）同一 7 源组：1920→5/`+2`/true、1440→1/`+6`/true、900→1/`+6`/true，`rowH=48` | 未知；**本轮未核实** | 7 源跨宽度已覆盖（可复用）；恰好 6 源与盒模型仍缺 | 无写腿（本条只读）；样本需获准提供 |
| `CCFG-AC-099` | ORG 可取/不可取、异常项、去重较多、`+N` 溢出 | 一条同时具备上述特征的记录 | 历史有标签/`+N` 证据；未覆盖全部组合 | 未知；**本轮未核实** | 标签回退、异常优先、去重后数量、`+N` 完整清单 | 无写腿（本条只读） |
| `CCFG-AC-106` | ORG 缺失 + 另一项有 ORG + `+N` 完整清单 | 一条至少一项 ORG 缺失、另一项有 ORG 的记录 | 无明确已入仓组合样本 | 未知；**本轮未核实** | 标签回退原始 ID、完整清单顺序/去重 | 无写腿（本条只读） |
| `CCFG-AC-112` | 超长机构名/超长候选 ID/不可选原因组合可读性 | 候选源含超长 `DATA_SOURCE_ORG`/超长 `DATA_SOURCE_ID`，并含 `COMMA_IN_ID`/`OCCUPIED` 原因 | 002 `s2-dialog-results.json`（2026-09-30）：候选字段 `maxOrgLen=19`、`maxDsIdLen=32`（**不是**探针 `maxClientIdLen`/`maxDescLen`）；900×800 已有 `optionsWiderThanChosen=true`（47.312px）、`optList.scrollable=true`（create/edit） | 未知；**本轮未核实** | 候选区宽度关系与窄视口滚动已有证据；超长样本可读性仍缺 | 无写腿（本条只读）；样本需获准提供 |
| `CCFG-AC-131` | 768/1024/>1024 字节边界（绕过前端） | 768、1024、>1024 三档描述文本 | 无已入仓边界样本 | 未知；**本轮未核实** | 无（重点是保存/拒绝） | E3/E4 写；绕过前端直调 |
| `CCFG-AC-132` | >256 字符自动生成、顺序变化仍取前 256、无源点击无动作、ORG 不可得 | 一组选择顺序可生成 >256 字符完整描述的源 + 一条 ORG 不可得源 | 无已入仓组合样本；普通两个可选源不足 | 未知；**本轮未核实** | 自动生成/截断/无源点击/ORG 不可得提示 | 无写腿（自动生成为本地 UI，不写） |
| `CCFG-AC-133` | >256 字符历史 `CLIENT_DESC` 打开/保存 | 一条历史 `CLIENT_DESC` 长度 >256 字符的记录 | 2026-09-30 002 `maxDescLen=152`；无 >256 证据 | 未知；**本轮未核实** | 编辑弹窗回显、截断/提示只读观察 | E4 保存写 |
| `CCFG-AC-134` | 启用行样本 + 填写/提交失败写腿 | 一条启用探针；可制造失败的表单输入 | 2026-09-30 缺口盘点零启用行；无明确失败样本 | 未知；**本轮未核实** | 启用行、弹窗字段/按钮只读观察 | E6/E7 + E3/E4 写 |
| `CCFG-AC-139` | 停用确认成功/失败写 | 一条 `FG_ACTIVE='1'` 探针 + 可制造停用失败 | 历史零启用行；无失败样本 | 未知；**本轮未核实** | 确认框标题/正文/按钮、取消不写 | E7 确认写 + 失败分支 |
| `CCFG-AC-152` | 停用确认按钮各态 + 取消/单击一次 | 一条 `FG_ACTIVE='1'` 探针（可由本批 E6 形成） | 历史零启用行 | 未知；**本轮未核实** | 按钮正常/悬停/按下/焦点、取消不写 | E7 确认写（一次） |
| `CCFG-AC-155` | 超长内容行样本 | 一条超长内容行（超出常规单行且不裁切） | 2026-09-30 002 `rowHeightHistogram={48:15,52:1}`；跨页常规行历史证据；无超长内容行 | 未知；**本轮未核实** | 行高、裁切/重叠/换行、标签/提示/入口完整 | 无写腿（本条只读）；样本本身需获准提供 |

---

## 6. R1-04：090/157 拟文收敛

> 本节只修改**拟文草案**，不触碰权威 `REQUIREMENTS/ACCEPTANCE/DESIGN/UI` 或公共模板。拟文仍 `DRAFT_PENDING_REVIEW / NOT_APPROVED`。

### 6.1 两处歧义的统一收敛

**收敛一：子项不适用 ≠ 整条永久禁止 `PASS`。**

- “该子项记不适用，不据此判 `PASS`”的准确含义是：**不能仅凭某一个子项不适用就让整条 AC 通过**。
- 它**不是**整条 AC 永久禁止 `PASS`。拟文获批后，若该 AC 的其他**全部适用**前置/步骤/预期均被覆盖，可由**未来独立验收任务**判整条；本轮仍不改变任何状态。
- 拟文须写入这句话，避免被读成“整条永远不能 `PASS`”。

**收敛二：公共触发器禁用视觉尚未实现。**

- 公共模板的触发器 `disabled` 视觉目前是**设计契约、尚未实现、现行 CSS 无规则**（`SHARED_COMPONENT_DESIGN.md` §12.1）。
- 未来业务引入真实触发器禁用态时，**不能**仅凭一份“拟议契约”假定已有可用公共 CSS。必须**先完成所需的公共实现/契约批准与页面接入**，再取证。
- 这些公共实现/接入**不由本次草案自动授权**；本任务不制造任何批准事件。

### 6.2 `CCFG-AC-090` 拟文（收敛后）

在 R0 §2.1.4 的基础上，保留“当前无新增权限模型、‘无数据源可选’不禁用按钮、不得人为构造禁用业务条件”的判断，并把条件性契约改写为：

> 「**当前页面没有可观察的‘新增探针’禁用态**：无权限模型；‘无数据源可选’不会禁用按钮，而是打开弹窗并展示空候选。故该子项当前**记为不适用**；**不能仅凭该子项不适用就让整条 AC 通过**，也**不据此判 `PASS`**。**这不构成整条 AC 永久禁止 `PASS`**：拟文获批后，若正常态、Hover、键盘聚焦、按下态、图标/文案/位置、点击打开新增弹窗、查询/重置不变等**其他全部适用要求**均被覆盖，可由未来独立验收任务判整条。
>
> **条件性契约（未来本 Feature 实际引入可观察禁用条件时生效）**：一旦新增按钮出现真实、可观察的禁用条件，该禁用态须沿用 Element Plus 既有禁用视觉、不得误用黑色实心；届时重新打开该子项验收。未来引入禁用态所需的公共实现/契约批准与页面接入，**不由本次草案自动授权**。」

### 6.3 `CCFG-AC-157` 拟文（收敛后）

在 R0 §2.2.4 的基础上，保留“被禁用者是下拉菜单项、菜单项禁用不属于触发器外观”的判断，并把条件性契约改写为：

> 「**触发器自身的 `disabled` 状态（条件性）**——当前三点触发器**没有业务禁用条件**；现行被禁用者是**下拉菜单项**（行级忙碌时条目禁用），**不得**把菜单项禁用当作触发器禁用，也**不得**为验收人为构造触发器禁用态。该子项当前**记为不适用**；**不能仅凭该子项不适用就让整条 AC 通过**，也**不据此判 `PASS`**。**这不构成整条 AC 永久禁止 `PASS`**：拟文获批后，若外观、可访问性、显式 opt-in、未启用页面计算样式零变化、公共层不接管业务语义、28px 不强制行高、迁移状态不变等**其他全部适用要求**均被覆盖，可由未来独立验收任务判整条。
>
> **条件性契约（未来本 Feature 为触发器实际引入可观察禁用条件时生效）**：**公共触发器禁用视觉目前尚未实现**（设计契约、现行 CSS 无规则）。未来业务引入真实触发器禁用态时，**不能**仅凭拟议契约假定已有可用公共 CSS；须**先完成所需的公共实现/契约批准与页面接入**，再按届时可观察状态重新验收。这些公共实现/接入**不由本次草案自动授权**。」

### 6.4 联动定义与批准问题

- 仍建议对 `CCFG-DESIGN-047`/`CCFG-UI-036`（AC-090）与 `CCFG-DESIGN-089`/`CCFG-UI-076`（AC-157）做**说明性补充**，但不修改权威行。
- `CCFG-REQ-104`/`CCFG-REQ-154` 建议不改（原文“实际适用”“须能承载”可解释为“存在时如何呈现”）。
- 批准问题：是否接受“子项不适用不等于整条永久禁止 `PASS`”；是否接受“公共触发器禁用视觉未实现、须先实现/批准再取证”；是否要求 DESIGN/UI 两行做最小补充。

---

## 7. R1-05：来源时间与引用核对

### 7.1 逐来源核对

| 证据/来源 | 时点 | 用途 | 本轮核对结果 |
|---|---|---|---|
| 本任务 base `37f30b73` 与三方 SHA | 2026-11-02 | 现场基线 | 是（Git 只读） |
| `ACCEPTANCE.md` §4 定义与状态 | 当前提交 | 79 条集合与定义原文 | 是（文件只读） |
| `CLIENT-CONFIG-FORMAL-ACCEPTANCE-EXECUTION-001.md` §7.3 | **2026-09-28**（报告第 50 行“执行时间”） | 16 行夹具/7 源/异常/逗号样本 | 否；**本轮未核实当前可用性**。R0 误写为 9 月 8 日，已纠正 |
| `CLIENT-CONFIG-FORMAL-ACCEPTANCE-EXECUTION-001-R5.md` 的 `accG#098` | **2026-09-28**（R5 对既有执行证据的复核） | ≥7 源 `total=7/direct=1/plus=+6/srcW=271`，仅 1440×900 | 否；**本轮未核实** |
| `CLIENT-CONFIG-ROUND7-TARGETED-ACCEPTANCE-AND-VISUAL-RECORD-001` 的 `AC010_client_adaptive_by_width` | **2026-09-29**（**与 R5 分开的另一来源**） | 7 源组跨宽度：1920→5/`+2`/true、1440→1/`+6`/true、900→1/`+6`/true | 否；**本轮未核实** |
| `CLIENT-CONFIG-REMAINING-ACCEPTANCE-GAP-TRIAGE-AND-READONLY-SUPPLEMENT-001`（R1~R3） | 2026-09-30 ~ 2026-10-01 | “零 `FG_ACTIVE='1'` 行”、87 条分类、AC-098 时序与 AC-092 分类 | 否；**本轮未核实** |
| 002 `s2-dialog-results.json` 与 `env-and-version.txt` | **`captured_at_utc=2026-09-30T16:29:15Z`** | `maxDescLen=152`、`maxClientIdLen=19`、`maxDsIdLen=32`、`maxOrgLen=19`、`rowHeightHistogram={48:15,52:1}`、`dialogHasInnerTable=false`、900×800 候选区宽度/滚动 | 否；**本轮未核实**；只读已入仓文件 |
| 002-R1 `env-and-version.txt` | **`captured_at_utc=2026-11-02T05:30:51Z`** | 只读补证环境 | 是（读取已入仓文件）；不重跑 |
| 002-R1 `backend_jar_mtime` | **`2026-09-22T04:21:27Z`**（R1 证据） | jar 时间 | 是（读取 R1 env）；R0 误写 `12:21:27Z`，已纠正 |

### 7.2 时间戳的边界

- 002 env 记录 jar `2026-09-22T12:21:27Z`，002-R1 env 记录 `2026-09-22T04:21:27Z`，但两者 `backend_jar_sha256` 相同（`efdbea…a459`）。这是**跨证据时间戳差异**，本报告**登记待裁定**，不擅自判定哪一个是构建时间。
- **时间戳不独立证明构建源码一致**；R1 仅在引用 002-R1 时使用其 env 的 `04:21:27Z`，不把时间戳当作代码一致性证据。

### 7.3 源码路径与返回码

实际完整路径：

- `backend/src/main/java/com/bsoft/cdcconfig/clientconfig/controller/ClientConfigController.java`
  - `@RequestMapping("/api/clients")`：第 37 行；`GET` 第 49 行；`GET /data-source-options` 第 59 行；`POST` 第 67 行；`PUT /{originalClientId}` 第 74 行；`DELETE /{clientId}` 第 83 行；`PUT /{clientId}/enable` 第 91 行；`PUT /{clientId}/disable` 第 99 行；E6/E7 **无 `@RequestBody`**。
- `backend/src/main/java/com/bsoft/cdcconfig/clientconfig/service/impl/ClientConfigServiceImpl.java`
  - `dataSourceOptions()`：候选 `isCandidate`（第 463-468 行）、`COMMA_IN_ID`、`OCCUPIED`、`ownersExcluding`（第 417 行）。
  - `create()`：`entity.setFgActive(FG_ACTIVE_1)`（第 206 行），插入行数≠1 → `saveFailed()`（第 209 行，50051）。
  - `update()`：行数≠1 → `clientNotFound()`（第 227 行，40440）；`delete()` 第 252 行同。
  - `enable()`（第 262-294 行）：不存在→40440；非 `0/1`→40240（`illegalClientState`）；占用→40941；`UPDATE ... WHERE CLIENT_ID=? SET FG_ACTIVE='1'`；行数≠1→40440。
  - `disable()`（第 296-305 行）：`UPDATE ... WHERE CLIENT_ID=? SET FG_ACTIVE='0'`；行数≠1→40440；允许非 `0/1` 记录停用。
  - `assertClientIdUnique()`：`equalsIgnoreCase`，排除精确原 ID（第 319 行附近）。
- `backend/src/main/java/com/bsoft/cdcconfig/clientconfig/exception/ClientConfigErrorCode.java`：`ILLEGAL_CLIENT_STATE=40240`、`CLIENT_NOT_FOUND=40440`、`CLIENT_ID_CONFLICT=40940`、`DATA_SOURCE_OCCUPIED=40941`、`SAVE_FAILED=50051`、`DELETE_FAILED=50052`（第 133 行定义）。
- `backend/src/main/java/com/bsoft/cdcconfig/clientconfig/model/vo/DataSourceViewItemVO.java`：`conflictClientIds`（第 20 行）。
- `backend/src/main/java/com/bsoft/cdcconfig/clientconfig/model/vo/ClientConfigDataSourceOptionVO.java`：`notSelectableReason`、`occupiedByClientIds`。

**错误码差异（登记待裁定，不作已核实统一契约）**：

- 源码：update/delete/enable/disable 行数≠1 均抛 `clientNotFound`（40440）；`DELETE_FAILED`（50052）在 client-config 服务中**定义但未使用**。
- `API.md` `CCFG-API-017`：写行数异常归 `50051`、删除归 `50052`。
- 该差异**不能**当作已核实统一契约；执行前须明确成功/异常处理依据：E6/E7 成功以 HTTP 200 + `code=200` 且 E1 反映为准；异常以源码实际返回码（40240/40440/40941）为观察依据；行数异常的实际码以执行时观测为准，若与 API-017 不一致，登记差异并停止扩大结论。

---

## 8. 79 条集合与样本子集复算

### 8.1 四态与剩余集合

从当前 `ACCEPTANCE.md` §4 的 157 个 AC 行实际提取：

| 状态 | 数量 |
|---|---|
| `PASS` | **78** |
| `FAIL` | **0** |
| `BLOCKED` | **64** |
| `NOT_RUN` | **15** |
| 合计 | **157** |

剩余集合 = **79 条**（64 `BLOCKED` + 15 `NOT_RUN`）。**78 个 `PASS` 不重新列为待验收**；`changed_ids=[]`。

### 8.2 64 条 `BLOCKED`

`CCFG-AC-012`、`013`、`014`、`015`、`022`、`026`、`027`、`030`、`031`、`034`、`039`、`042`、`044`、`046`、`048`、`054`、`055`、`059`、`068`、`071`、`072`、`075`、`076`、`077`、`079`、`082`、`083`、`084`、`087`、`089`、`090`、`091`、`092`、`094`、`095`、`096`、`097`、`098`、`099`、`102`、`103`、`104`、`106`、`112`、`115`、`117`、`120`、`121`、`125`、`128`、`131`、`132`、`133`、`134`、`138`、`139`、`140`、`145`、`151`、`152`、`153`、`155`、`156`、`157`。

### 8.3 15 条 `NOT_RUN`

`CCFG-AC-020`、`021`、`023`、`024`、`033`、`038`、`040`、`056`、`057`、`058`、`060`、`061`、`062`、`063`、`064`。

### 8.4 样本依赖子集（38 条，重算）

`CCFG-AC-012`、`013`、`015`、`022`、`023`、`024`、`026`、`027`、`030`、`033`、`039`、`044`、`046`、`048`、`054`、`057`、`059`、`063`、`064`、`068`、`082`、`083`、`087`、`092`、`095`、`096`、`097`、`098`、`099`、`106`、`112`、`131`、`132`、`133`、`134`、`139`、`152`、`155`。

> 相对 R0 的 37 条：**新增 `CCFG-AC-092`**。其余 37 条不变（`CCFG-AC-084` 不在样本子集，属纯写路径）。不人为凑回 37。

### 8.5 非样本分类与并集复算

| 类别 | 条数 | 成员 |
|---|---|---|
| 样本依赖 | 38 | 见 §8.4 |
| 运行时/非样本（无数据样本） | 5 | `CCFG-AC-055`、`102`、`115`、`125`、`138` |
| 跨页对照 | 6 | `CCFG-AC-079`、`087`、`090`、`091`、`094`、`120` |
| 纯写路径（无数据样本） | 30 | `CCFG-AC-014`、`020`、`021`、`031`、`034`、`038`、`040`、`042`、`056`、`058`、`060`、`061`、`062`、`071`、`072`、`075`、`076`、`077`、`084`、`089`、`103`、`104`、`117`、`121`、`128`、`140`、`145`、`151`、`153`、`156` |
| 定义裁定 | 1 | `CCFG-AC-157` |

**并集复算**：38 + 5 + 6 + 30 + 1 = **80** 个条目引用；`CCFG-AC-087` 同时出现在“样本依赖”和“跨页对照”两类，重复计 1 次 → **80 − 1 = 79**，与剩余集合 **79** 完全一致。无遗漏、无多余。`CCFG-AC-115` 归入运行时/非样本，**不入首批覆盖**。

### 8.6 定义与状态字节一致性

| 保护项 | 本任务结果 |
|---|---|
| `REQUIREMENTS.md` 定义行 | **未修改** |
| `ACCEPTANCE.md` §4 定义行与 157 个状态格 | **未修改**；逐 ID 字节一致 |
| `DESIGN.md` 定义行 | **未修改** |
| `UI.md` 定义行 | **未修改** |
| 公共模板 `SHARED_COMPONENT_DESIGN.md` | **未修改** |
| AC 编号/计数 | **未新增、未删除、未重排**；仍 157 |
| 草案状态 | `DRAFT_PENDING_REVIEW` / `NOT_APPROVED` |
| 首批写方案 | `NOT_READY` |
| 写执行 | `NOT_REQUESTED` / `NOT_EXECUTED` |

---

## 9. 边界与未执行项

- **未**执行业务写入、**未**创建样本/夹具、**未**修改数据库/ZooKeeper/Kafka。
- **未**运行测试、构建、lint、浏览器、服务启停；构建类状态记 `NOT_APPLICABLE`。
- **未**访问数据库、**未**调用业务接口、**未**读取实际业务值。
- **未**修改权威 `REQUIREMENTS/ACCEPTANCE/DESIGN/UI` 定义行、157 个状态格、公共模板。
- **未**修改 `002-R1` 历史报告/JSON/校验和；R0 报告作为历史快照保留不回写。
- **未**把“方案草案建立”记为“样本具备”“写授权”或“正式验收完成”。
- **未**请求跨页访问/测试/改造授权；`/config/data-source` 仅作为既有历史证据来源，不在本轮访问。
- **未**修改 `/config/client` 源码、样式、测试、CSS 或模板。

---

## 10. 任务结果

- **base**：`37f30b730bace8eb97371578a3fd1071bbb494db`
- **result**：本任务单次提交（`result_commit_id` 见推送后的最终 `AGENT_TASK_RESULT`；本报告与该提交同批）
- **实际变更**：
  - 新增 `docs/features/client-config/reports/CLIENT-CONFIG-REMAINING-ACCEPTANCE-ENABLEMENT-PLAN-DRAFT-001-R1.md`（本报告）
  - 最小同步 `docs/features/client-config/README.md`（R1 摘要/导航/§4 条目/§5 现行下一入口）
- **状态变化**：`changed_ids=[]`；四态保持 `PASS 78 / FAIL 0 / BLOCKED 64 / NOT_RUN 15 = 157`；剩余 79 条不变
- **样本子集**：**38 条**（新增 `CCFG-AC-092`）；并集复算 **79**（38+5+6+30+1−1）
- **定义拟文**：`CCFG-AC-090`、`CCFG-AC-157`，状态 `DRAFT_PENDING_REVIEW` / `NOT_APPROVED`
- **首批写方案**：`NOT_READY`；所有写 `NOT_REQUESTED / NOT_EXECUTED`
- **未决项**：专用对象未绑定、隔离未成立、E1/E2 占用未实测、失败注入/慢请求未授权、API-017 与源码错误码差异待裁定、002 与 002-R1 jar 时间戳差异待裁定、AC-098 恰好 6 源样本当前可用性未知
- **未执行项**：测试/构建/lint/浏览器/服务启停/数据库/接口/ZooKeeper/Kafka 全部未执行
- **下一入口（R1，历史）**：`CHATGPT_REMOTE_CLIENT_CONFIG_REMAINING_ACCEPTANCE_ENABLEMENT_PLAN_DRAFT_R1_REVIEW`（已由本 R2 修订承接，保留为历史）
- **现行下一入口（R2）**：`CHATGPT_REMOTE_CLIENT_CONFIG_REMAINING_ACCEPTANCE_ENABLEMENT_PLAN_DRAFT_R2_REVIEW`

**R2 修订记录（`CLIENT-CONFIG-REMAINING-ACCEPTANCE-ENABLEMENT-PLAN-DRAFT-001-R2`）**：本报告由 R2 任务原位修订，R2 base 为 `develop` @ `46e367932437848945ab91c4f657d5125dc2429b`；R1 的 base `37f30b730bace8eb97371578a3fd1071bbb494db` 与 R1 任务结果作为历史保留。R2 只修正 §4.2 四类证据口径、撤回状态推导并收敛 §3.1/§3.5，**不**表示 R2 已 `APPROVED`，不改变任何定义、状态或写执行；R2 结果提交见推送后的最终 `AGENT_TASK_RESULT`。

**R1 草案 ≠ 定义获批 ≠ 样本具备 ≠ 写授权 ≠ 157 条整体验收通过；推送 ≠ 复审通过 ≠ 草案批准 ≠ 写授权。R2 修订同样不等于 `APPROVED`。**
