# 探针端管理：受控启停前只读就绪核查（CLIENT-CONFIG-CONTROLLED-TOGGLE-READINESS-CHECK-001）

> 任务性质：**只读就绪核查 + 执行方案准备**。本任务不执行启停，不绑定对象，不取得写授权；不重复 AC-090/AC-157 验收，不改任何状态格。
>
> 开工基线：`develop` @ `07851c44cb6be104e8b84a03d70cdac4e6a9ec80`（local HEAD / `origin/develop` / 远端 `refs/heads/develop` 三方一致）。

## 1. 门禁与现场

| 项 | 事实 |
|---|---|
| 分支 | `develop` |
| 三方 SHA | local HEAD、`origin/develop`、远端 `refs/heads/develop` 均为 `07851c44cb6be104e8b84a03d70cdac4e6a9ec80` |
| 环境 | JDK 8 / Node `v24.17.0`；既有服务复用，**未**启动、停止、重启或构建 |
| 前端 | Vite dev server，pid `8141`，`0.0.0.0:5173`，服务工作区 HEAD |
| 后端 | Spring Boot jar，pid `8120`，`*:8080`；jar mtime `2026-09-22 12:21:27 +0800`，sha256 `efdbea…a459` |
| 源码版本 | 后端 `clientconfig` 最后提交 `84d3cdc`（2026-09-05）；后端 `src` 最后提交 `807a5a5`（2026-09-20）；本页最后提交 `d878c3d`（2026-09-30） |
| 制品限制 | jar 时间戳与 sha256 已记录；时间戳**不能单独证明**源码与制品一致。`clientconfig` 后端源码最后变更早于 jar mtime，但本任务未做独立制品—源码比对 |
| 工作区 | 任务前无关内容保持原样（`.claude/settings.local.json`、`docs/prompts/**`、`runtime-logs/**` 未暂存、未修改） |

AGENTS.md 在仓库中不存在；已按 `CLAUDE.md`、六份 `docs/baseline/` 正式基线、环境说明与现行方案草案 R1（含 R2 原位修订）执行。未打印任何凭据。

## 2. 方法与证据边界

- 只读范围：`clientconfig` 所属源码、文档、既有证据；既有业务 GET 接口；本机服务进程/监听信息。未访问 `/config/client` 以外的功能页面。
- 请求纪律：核查脚本仅有 GET 方法分支，未提供任何写方法。实际请求为 1 次列表读取 + 每个候选 1 次数据源候选读取（共 2 次），合计 3 次 GET。
- 未使用浏览器，故未安装浏览器网络拦截；`write_requests=0` 只证明**本脚本**未调用写接口，**不等于**数据库层零写审计。
- 未执行 enable/disable/保存/删除；未创建或修改探针、关联源或夹具；未访问数据库、ZooKeeper、Kafka；未查看或操作 sync-client 进程；未运行测试、构建、lint、类型检查。
- 证据分层：本文分别标注 **API 观察**、**源码推导**、**负责人待确认**、**未来计划**、**实际未执行**。历史证据状态格（`BLOCKED`/`NOT_RUN`）不作为“无证据”的推导依据。

## 3. 现行接口源码核对（源码推导）

| 项 | 当前源码事实 |
|---|---|
| E1 | `GET /api/clients`，可选 `keyword`、`status`（`ALL/ENABLED/DISABLED`，缺省 `ALL`）；返回 `data.items[]`，行字段 `clientId`、`clientDesc`、`status`、`fgActive`、`dataSourceCount`、`rawDataSourceIds`、`possibleCommaDataSourceIds`、`rowAnomalies`、`dataSources[]` |
| E1 行内源 | `dataSources[]` 每项含 `dataSourceId`、`org`、`dataSourceName`、`anomalies[]`、`conflictClientIds[]`；`anomalies` 稳定枚举 `INACTIVE` / `NOT_FOUND` / `CATEGORY_MISMATCH` / `TYPE_MISMATCH` / `DUPLICATE_IN_ROW` / `ASSIGNED_TO_MULTIPLE_CLIENTS` |
| E2 | `GET /api/clients/data-source-options?excludeClientId=<原始 clientId>`；仅返回 `isCandidate`（`FG_ACTIVE='1' && 类别 SOURCE && 类型 ORACLE`）的数据源；`notSelectableReason` 为 `COMMA_IN_ID` / `OCCUPIED` / `null`；`occupiedByClientIds` 已按 `excludeClientId` 精确自排除 |
| E2 缺席语义 | 非候选源被**整体省略**；“某 token 未出现在 E2”**不能**认定其无他人占用，只能说明它不是当前候选源 |
| E6 | `PUT /api/clients/{clientId}/enable`，**无 `@RequestBody`**；源码先全表重读、按精确 ID 找目标，非 `0/1` 返回 `40240`，任一 token 被他人占用返回 `40941`，否则 `UPDATE ... WHERE CLIENT_ID = ? SET FG_ACTIVE='1'` |
| E7 | `PUT /api/clients/{clientId}/disable`，**无 `@RequestBody`**；按 ID `UPDATE ... SET FG_ACTIVE='0'`，行数≠1 返回 `40440` |
| 并发 | E6/E7 均**无携带前像的 CAS 条件**（无 `WHERE FG_ACTIVE = 前像`）；读后写窗口内的并发修改无法由现有业务接口证明“绝不覆盖” |
| 占用判定 | E1 行装配时对每个 token 计算 `ownersExcluding(occupancy, 自身)`；只读判断他人占用的可读路径是 E1 `dataSources[].conflictClientIds`，不是 E2 的缺席 |
| 前端启停 | `onEnable/onDisable` 均先用 `ElMessageBox.confirm` 二次确认；确认阶段即 `markBusy`，取消不写、行级 `rowBusy` 禁用下拉菜单项；仅 `submitDialog` 使用保存加载态 `submitting`，启停往返不触发保存加载态 |
| 错误码差异 | 源码 update/delete/enable/disable 行数≠1 均返回 `40440`；`API.md` `CCFG-API-017` 的 `50051/50052` 口径与源码存在差异，仍属登记待裁定；执行时以实际观察为准，不静默统一 |

## 4. 只读候选筛查（API 观察）

### 4.1 总体与筛选口径

- 列表共 **16** 行：`FG_ACTIVE='0'` **15** 行、`'1'` **1** 行、非 `0/1` **0** 行。
- 初筛仅考虑原 `FG_ACTIVE` 精确等于字符串 `'0'` 的正常对象，并要求：至少 1 个 token；token 去重后数量与行内源项数量一致；`rowAnomalies=[]`；`possibleCommaDataSourceIds=[]`；每个关联源 `anomalies=[]` 且 `conflictClientIds=[]`。
- 对通过初筛的对象，再按原始 `clientId` 自排除调用一次 E2；要求每个 token 在 E2 中存在且 `selectable=true`（不存在/`OCCUPIED`/`COMMA_IN_ID` 均不进入候选）。
- 最多整理 3 个；本次通过初筛并满足 E2 条件的有 **2** 个。

### 4.2 排除原因聚合（非互斥，同一行可命中多项）

| 原因 | 行次数 |
|---|---|
| `FG_ACTIVE_NOT_EXACT_0`（原值非 `'0'`） | 1 |
| `SOURCE_ANOMALY`（关联源存在 `anomalies`） | 8 |
| `SOURCE_CONFLICT`（关联源 `conflictClientIds` 非空） | 7 |
| `NO_DATA_SOURCE_TOKEN`（原始串为空或无 token） | 5 |
| `ROW_ANOMALY`（`rowAnomalies` 非空） | 1 |
| `COMMA_AMBIGUITY`（`possibleCommaDataSourceIds` 非空） | 1 |

这些计数是**排除原因的出现次数**，不是互斥行数；不能相加当作行数。

### 4.3 技术候选（待负责人绑定，非专用确认）

| 别名 | 原状态 | 关联源数 | 行异常 | 逗号歧义 | 源异常 | 源冲突 | E2（按原始 ID 自排除） |
|---|---|---|---|---|---|---|---|
| `T01` | `'0'` / `DISABLED` | 7 | 0 | 0 | 0 | 0 | `S01`–`S07` 全部存在且 `selectable=true`，`occupiedByCount=0` |
| `T02` | `'0'` / `DISABLED` | 1 | 0 | 0 | 0 | 0 | `S01` 存在且 `selectable=true`，`occupiedByCount=0` |

- `T01`/`T02` 只是**技术候选别名**；真实 `clientId`、描述、机构与源 ID 未写入仓库。
- E2 结果与 E1 `conflictClientIds` 均为**采集时点快照**，不是执行窗口的并发保证。
- 候选未被自动认定为“专用测试对象”；名称是否含 test/demo **不**替代负责人确认。

## 5. 负责人待确认项（PENDING_OWNER_CONFIRMATION）

以下事项无法由本任务通过代码、GET 接口或只读观察证明，必须在未来写授权前由负责人明确：

| # | 待确认项 |
|---|---|
| 1 | 选定对象的完整 `clientId` 与专用测试用途 |
| 2 | 外部 `sync-client` 不引用该对象，启用不会触发实际采集 |
| 3 | 关联源确可用于该测试 |
| 4 | 明确独占执行窗口及无其他操作者 |
| 5 | 允许写的接口、最大次数、失败/超时处置与回退权限 |

本任务未访问外部进程/基础设施来替代负责人确认。即使技术候选通过，上述事项未落实时总体不得标 `READY_AUTHORIZED`。

## 6. 就绪判定

| 键 | 值 | 依据 |
|---|---|---|
| `technical_readiness` | `ELIGIBLE_CANDIDATE_FOUND` | 2 个技术候选通过初筛与 E2 检查 |
| `owner_binding_status` | `PENDING` | 未绑定对象；候选仅别名 |
| `isolation_confirmation_status` | `PENDING` | 外部 sync-client 引用与采集隔离未由负责人确认 |
| `exclusive_window_status` | `PENDING` | 未确认独占窗口与无其他操作者 |
| `write_authorization_status` | `NOT_REQUESTED` | 本任务不申请写授权 |
| `write_execution_status` | `NOT_EXECUTED` | 未执行任何非 GET 请求 |
| `overall_readiness` | `NOT_READY_PENDING_OWNER_CONFIRMATION` | 技术候选存在，但负责人绑定/隔离/独占/授权均未落实 |

**技术候选存在 ≠ 已专用 ≠ 已隔离 ≠ 可执行。** 若负责人未绑定对象，方案只能使用占位符，不能写成可直接运行的写脚本。

## 7. 启停往返执行方案（只写不执行）

> 对象占位：`<OWNER_BOUND_CLIENT_ID>`。`T01`/`T02` 仅为技术候选别名，负责人未确认前不视为正式绑定。
> 两批次相互独立，负责人可选择其一或分别批准；**不得**因批准 A 自动串行获得 B 的授权。

### 7.1 批次 A：API 往返（成功路径写 2 次）

| 步 | 只读/写 | 操作 | 请求/次数 | 期望与核对 | 停止条件 |
|---|---|---|---|---|---|
| A0 | 读 | 运行前快照 | `GET /api/clients?status=ALL`，1 次 | 返回 `code=200`；找到唯一目标行；记录完整前像；确认 `fgActive='0'` | 找不到、重复命中、`fgActive≠'0'`、任一 token `conflictClientIds` 非空 |
| A1 | 读 | 候选/占用复核 | `GET /api/clients/data-source-options?excludeClientId=<原始 clientId>`，1 次 | 记录目标 token 的候选存在性与 `notSelectableReason`；不以缺席判定无占用 | 任一 token 在 E1 显示他人占用，或异常无法解释 |
| A2 | **写** | 启用 | `PUT /api/clients/{clientId}/enable`，**无请求体**，1 次 | 成功 `code=200`；影响 1 行；`FG_ACTIVE '0'→'1'` | 返回 `40240`/`40440`/`40941` 或其他非预期码；影响行数≠1；出现未计划请求 |
| A3 | 读 | 启用后核对 | `GET /api/clients?status=ALL`，1 次 | `fgActive='1'`；其他字段与 A0 一致 | 任何非 `FG_ACTIVE` 字段变化、目标消失、出现占用冲突 |
| A4 | **写** | 停用（恢复） | `PUT /api/clients/{clientId}/disable`，**无请求体**，1 次 | 成功 `code=200`；影响 1 行；`FG_ACTIVE '1'→'0'` | 返回 `40440` 或其他非预期码；影响行数≠1 |
| A5 | 读 | 还原核对 | `GET /api/clients?status=ALL`，1 次 | `fgActive='0'`，与 A0 前像逐字段一致 | 未恢复原值、字段漂移、目标消失 |

**批次 A 汇总**：成功路径 **写 2 次**（A2 E6、A4 E7）；只读至少 3 次 E1 + 1 次 E2。无 E3/E4/E5。

### 7.2 批次 B：UI 往返（成功路径写 2 次）

> 前提：后续独立授权；起始对象必须仍为原 `'0'`。两个桌面视口（1440×900、1920×1080）只做读观察，**不按视口重复启停**。

| 步 | 写次数 | 操作与观察 |
|---|---|---|
| B0 | 0 | 加载列表，记录目标行固定选中与“更多”菜单；无“状态”列；`'0'` 行菜单含“启用”“删除” |
| B1 | 0 | 点击“更多→启用”，读取确认框标题/正文/按钮 |
| B2 | 0 | 点“取消”；不发写请求，`FG_ACTIVE` 仍 `'0'`，固定选中不变 |
| B3 | 0 | 再次打开启用确认框，读取主确认按钮正常/悬停/按下/真实 Tab 焦点 |
| B4 | **1** | 单击“启用”确认；确认框先关闭，随后**恰 1 次** E6；成功后 `FG_ACTIVE='1'`、ID 后“停用”标记消失，列表重载并按稳定 `clientId` 重选 |
| B5 | 0 | 在已启用行点击“更多→停用”，读取确认框 |
| B6 | 0 | 点“取消”；不发写请求，`FG_ACTIVE` 仍 `'1'` |
| B7 | 0 | 再次打开停用确认框，读取主确认按钮各态 |
| B8 | **1** | 单击“停用”确认；确认框先关闭，随后**恰 1 次** E7；成功后 `FG_ACTIVE='0'`、恢复原值 |
| B9 | 0 | 还原核对，与 B0 前像一致；仅 `FG_ACTIVE` 往返变化 |

**批次 B 汇总**：成功路径 **写 2 次**（B4 E6、B8 E7）；取消路径 **0 次**；两视口读观察不增加写。顺序由当前/原值决定；原 `'1'` 的 `disable→enable` 分支不在首批。

### 7.3 两批关系与写次数

- 若 A、B 都执行成功，合计最多 **4 次写**（A 2 + B 2）。
- 两批**各自重新满足**对象绑定、原 `'0'`、隔离、独占窗口与授权前置；不能自动串行授权。
- 不按视口重复启停扩大写次数；视觉观察可在写前完成或复用已有证据。
- 恢复请求若需超出 2 次成功路径预算，必须另有明确次数上限/授权；本任务**不授予**。

### 7.4 必须写实的执行约束

- **仅 `FG_ACTIVE` 允许变化**；`clientId`、`clientDesc`、`rawDataSourceIds`/token 与其他业务字段保持不变。
- 只用现有接口；E6/E7 **无请求体**，不臆造请求参数；不调用 E3/E4/E5。
- 现有按 ID 更新**没有 CAS**，读后写竞态仍存在；不新增锁、不改接口、不用 SQL 兜底。
- 执行前**重新获取前像**；漂移即停止，不覆盖他人修改。
- enable 失败/超时后**不得盲重试或盲 disable**；先 GET 核实真实终态，响应丢失不等于写未发生。
- 已启用但后续核对失败时，是否允许一次恢复性 disable 必须在未来授权中明确；**没有授权不继续**。
- disable 超时后只读核实，不自动重复写。
- 成功往返回到 `'0'` **不等于**任何故障下保证恢复。
- 不以 SQL 兜底，不新增锁，不修改接口或配置。

## 8. 覆盖表（复用现行已审方案，未翻任何状态）

> 证据口径：**已有可复用** = 已入仓、可回指的验收证据；**本批计划新增/需回归** = 未来执行步骤；**仍缺** = 按该 AC 自身定义本批不能补。状态格 `BLOCKED`/`NOT_RUN` 不作为“无证据”的依据。
> 证据简称：`002` = `CLIENT-CONFIG-TARGETED-READONLY-ACCEPTANCE-SUPPLEMENT-002`（采集 2026-09-30T16:29:15Z）；`round7` = `CLIENT-CONFIG-ROUND7-TARGETED-ACCEPTANCE-AND-VISUAL-RECORD-001`；`zoom` = `CLIENT-CONFIG-ROW-HEIGHT-AND-OPTIONAL-ELLIPSIS-IMPLEMENTATION-001-R1/real-zoom-summary.json`。

| AC | 已有可复用证据 | 本批计划新增/需回归 | 仍缺（本批不能补） |
|---|---|---|---|
| `CCFG-AC-022` | `002 s2-list-results.json → structure`（无状态列、六列）、`menu.itemTexts=["启用","删除"]`、`idMarkers` 停用标记；`s2-confirm-results.json → enableBox/enablePrimary` | W-B 原 `'0'` 行启用确认：先关闭、恰 1 次 E6、`fgActive='1'`、标记消失 | 多行启停稳定样本 |
| `CCFG-AC-023` | `002 s2-confirm-results.json → disableBox`、`disablePrimary`、`cancelBox` + `nonGetAttempts=0` | W-B 真实 `'1'` 行停用确认、取消 0 写、恰 1 次 E7、恢复 `'0'` | 按定义 W-B 后可完整执行，未来独立重判 |
| `CCFG-AC-024` | `002 enableBox`/`enablePrimary`、`menu.itemTexts=["启用","删除"]`、取消 0 写 | W-A E6 + E1 `fgActive='1'`；W-B 启用确认成功 | 对应 sync-client 进程、ZK/Kafka 观察 |
| `CCFG-AC-082` | `002 structure`（最右“操作”列）、`menu`/`abnormalRowMenu`、`rowEventIsolation`、`rowClick` | W-B E6 后读取 `'1'` 行下拉；`'0'`/`'1'`/异常共存 | 执行时样本漂移需重判 |
| `CCFG-AC-084` | `002` 菜单条目、确认框/主按钮、取消 0 写 | W-B 启用/停用各一次确认，恰 1 次写 | 删除、慢请求、重复点击、冲突失败反馈 |
| `CCFG-AC-103` | `002 rowEventIsolation`、`cancelBox` + `nonGetAttempts=0` | W-B 各一次确认，恰 1 次写，取消 0 写 | 删除、失败复位、慢请求忙碌 |
| `CCFG-AC-139` | `002 disableBox`/`disablePrimary`、`cancelBox` | W-B 真实 `'1'` 行停用确认与状态变化 | 停用失败分支 |
| `CCFG-AC-140` | `002 offRowIdx=1`、`enableBox`/`enablePrimary`、`menu`/`idMarkers` | W-B 原 `'0'` 行启用确认、取消 0 写、恰 1 次 E6 | 启用失败/慢请求/重复提交分支 |
| `CCFG-AC-145` | `002 rowClick`、`structure.batchAbsence`、`rowEventIsolation` | W-B 单行固定选中、取消不改变选中、成功后重选 | 多行 A/B、状态筛选消失、删除与失败 |
| `CCFG-AC-151` | `002 enableBox`（标题/正文/按钮）、`enablePrimary` 各态、取消 0 写 | W-B 实际单击启用：先关闭、恰 1 次 E6、状态变化 | 按定义 W-B 后可完整执行，未来独立重判 |
| `CCFG-AC-152` | `002 disableBox`、`disablePrimary` 各态、取消 0 写（注意原 `onRowIdx` 为异常行） | W-B 真实 `'1'` 行停用确认与视觉回归 | 按定义 W-B 后可完整执行，未来独立重判 |
| `CCFG-AC-153` | `002 rowClick`、`rowEventIsolation`、`keyboardMenu`；`round7` 双击编辑/菜单隔离 | W-B 启停成功后普通重载的单对象重选 | 删除、重试、多行启停重选 |
| `CCFG-AC-156` | `round7 rows[]`（48px、28×28、6px、居中、盒内）、`AC156_focus`、`zoom`（100%/125% 28×28） | W-B 单次启用/停用后的普通重载与事件隔离回归 | 多次重载响应交错竞态 |

**明确排除执行但保留既有证据**：`CCFG-AC-026`、`CCFG-AC-027`、`CCFG-AC-083`（异常对象/异常数据源前置）与 `CCFG-AC-115`（保存 loading；启停不触发 `submitting`）。本批**不含**删除、失败注入、慢请求、进程/ZooKeeper/Kafka 观察、跨页对照、异常/歧义样本新采集。

本表**不**预置“所有 AC 都只能部分取证”，也**不**翻任何状态；是否 `PASS` 由未来独立验收任务按完整定义判定。

## 9. 脱敏与本机映射

- 仓库证据仅含：别名 `T01/T02`、源别名 `S01..`、计数、布尔条件、排除原因、请求方法与脱敏路径。
- 真实 `clientId`、`clientDesc`、机构、源 ID、连接信息与原始 API 响应**未入仓**，也未在公开报告中展开。
- 别名→完整 ID 的最小映射保存在仓库外临时文件（权限 `600`），路径仅在最终执行回复中告知负责人；未上传、未提交。
- 未将候选别名当作正式绑定。

## 10. 未执行项与限制

- **未执行**任何写请求（enable/disable/save/delete）、UI 最终确认或写路径回归。
- **未执行**数据库、ZooKeeper、Kafka 访问；**未**查看或操作 sync-client 进程。
- **未**创建/修改测试探针、关联源或夹具；**未**运行测试、构建、lint、类型检查；**未**启动/停止服务。
- **未**访问其他功能页面，**未**请求跨页授权。
- E1/E2 均为时点快照；**未**证明执行窗口内的并发稳定性。
- jar 与源码的一致性仅记录时间戳与 sha256 边界，**未**做制品级比对。
- 本报告**不**预填自身提交 SHA；最终执行回复给出真实 base/result。

## 11. 文档与状态保护

- 权威 `REQUIREMENTS.md` / `ACCEPTANCE.md` / `DESIGN.md` / `UI.md` **未修改**；157 个状态格与四族定义逐字节不变；`changed_ids=[]`。
- 当前统计（独立复算）：`PASS 80 / FAIL 0 / BLOCKED 62 / NOT_RUN 15 = 157`；剩余 `BLOCKED+NOT_RUN = 77`。
- 本任务不重复 AC-090/AC-157 验收，不改任何状态格，不回写原方案草案。
- 变更仅限：本报告、本证据目录、`README.md` 的最小现状/导航/下一入口同步。

## 12. 下一入口

`CHATGPT_REMOTE_CLIENT_CONFIG_CONTROLLED_TOGGLE_READINESS_CHECK_REVIEW`

**只读就绪核查 ≠ 对象已绑定 ≠ 已专用/已隔离 ≠ 写授权 ≠ 已执行启停 ≠ 157 条整体验收通过。**
