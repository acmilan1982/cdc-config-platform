# 107 条验收覆盖矩阵 — DATA-SOURCE-SNAPSHOT-STATUS-FORMAL-ACCEPTANCE-001

- 任务编号：`DATA-SOURCE-SNAPSHOT-STATUS-FORMAL-ACCEPTANCE-001`
- 分支：`develop`（隔离 worktree `/agent/dss-formal-acceptance-001`，detached）
- 起点提交：`af88aa847c7cf6a197237a46f59130744d13f082`
- 验收对象：正式 `5173` 页面（`http://127.0.0.1:5173/monitor/data-source-state`）+ 正式后端 `8080` + 项目配置 Oracle 开发库（只读）
- 执行日期：2026-09-12
- 用例来源：`ACCEPTANCE.md` §4.1～§4.22 的 107 条 `DSS-AC-001~107` 业务行（原文与预期结果逐字节未改）

## 0. 证据类型图例（§8）

| 代号 | 含义 | 本任务落点 |
|---|---|---|
| `SC` | 静态代码/路由/菜单/契约/只读边界审阅 | `readonly/static-checks.txt` |
| `BT` | 后端定向自动化测试 | `tests/backend-targeted.txt`（27 passed / 0 failed） |
| `FT` | 前端定向/功能/全量测试 | `tests/frontend-targeted.txt`（250）、`tests/frontend-full.txt`（834） |
| `DB` | 真实开发库只读查询 + 前后对照 | `database/baseline-before.txt`、`baseline-after.txt`、`zero-write-proof.txt` |
| `HTTP` | 真实后端 GET 接口 | `http/01..22-*.json`、`http/SUMMARY.txt` |
| `BR` | 真实 Chromium（CDP）正式页面：DOM/几何/网络/Console | `browser/*.json`、`browser/*.txt`、`browser/screenshots/` |
| `BI` | 浏览器请求拦截替换响应（**非真实后端数据**，逐场景标注） | `browser/bi.json`、`browser/changed-data.json` |
| `BUILD` | 后端/前端构建 | `tests/backend-package.txt`、`tests/frontend-build.txt` |
| `SVC` | 服务存在性与本机可达性 | `services/liveness.txt` |

**真实性边界**：`BI` 类证据只替换列表接口响应字节，已在每个 JSON 内以 `biLabel`/`label` 显式标注“NOT real backend data”；`PRIOR-HUMAN`（项目负责人此前实现阶段人工检查）**未被用作任何用例的判定依据**；`5174` 隔离视觉原型证据**未被使用**。

## 1. 判定口径

- 逐条按 `ACCEPTANCE.md` 的“操作·输入 / 预期结果”**分解必要子项**；仅当全部必要子项均有充分证据且符合预期才记 `PASS`。
- 本轮**无** `FAIL`：未发现必须记为失败的真实缺陷。
- 本轮 **1 条 `BLOCKED`**：`DSS-AC-065`（受控测试数据 DML 授权——本任务 §6.2 明确不授权，且无充分替代证据）。
- 预期规则被后续已批准规则**定向取代**时，按 §5.1“以后续已批准现行规则为准”判定，并在行内记录取代关系（不因此判失败）。
- 四态计数：`PASS 106 / FAIL 0 / BLOCKED 1 / NOT_RUN 0 = 107`。

---

## 4.1 页面命名、菜单、路由与占位边界（DSS-AC-001~005）

| 编号 | 状态 | 证据类型 | 具体证据 | 充分性说明 |
|---|---|---|---|---|
| DSS-AC-001 | PASS | BR+SC | `BR structure.json` 四视口 `dssTitle="源库快照状态"`、`activeMenu="源库快照状态"`、`route=/monitor/data-source-state`；`SC S1`：`menu.ts:26` 唯一条目、`router/index.ts:43` meta title、页面 `dss-title`、面包屑取自 route meta | 四个命名面全部命中；菜单仅 1 条同名入口（`grep -c`=1） |
| DSS-AC-002 | PASS | SC | `SC S1` + 目录 `frontend/src/views/data-source-run-state/`、任务代码前缀 `DATA-SOURCE-SNAPSHOT-STATUS`（证据目录与提示词）、需求/验收前缀 `DSS-REQ-`/`DSS-AC-` | 命名映射（路由↔目录↔slug↔可见名）一致 |
| DSS-AC-003 | PASS | SC+BR | `SC S1`：`router/index.ts` 该路径恰好 1 条记录；`BR structure.json` 直接访问该路由成功进入页面 | 存在且仅存在一条路由记录 |
| DSS-AC-004 | PASS | SC | `SC S1`：页面组件位于 `frontend/src/views/data-source-run-state/`（26 个 Feature 文件，`git ls-files`），无无价值重命名 | 目录与文档命名映射一致 |
| DSS-AC-005 | PASS | SC | `SC S1`：菜单/路由元数据/页面标题/面包屑四处均为“源库快照状态”，四处无旧名残留 | 见 §5 观察项 O-1（旧名出现在**非上述四面**的未路由组件与陈旧构建产物中，已单独记录、未计入本用例） |

## 4.2 业务语义与跨程序边界（DSS-AC-006~009）

| 编号 | 状态 | 证据类型 | 具体证据 | 充分性说明 |
|---|---|---|---|---|
| DSS-AC-006 | PASS | DB+HTTP+BR | `DB baseline-before.txt §C`：SNAPSHOT_RUNNING 13 / SNAPSHOT_COMPLETED 11；`HTTP 01` 分类计数一致；`BR data.json` 行级状态标签与 DB 值一一对应 | RUNNING/COMPLETED 语义均由真实数据行证明 |
| DSS-AC-007 | PASS | BR+SC | `BR structure.json` 仅 3 个控件（查询/重置/立即刷新）、无操作列；`SC S2`：无在线/健康/失联/同步进度语义（唯一“增量”命中为 CSS 宽度注释） | 页面只呈现快照状态信息 |
| DSS-AC-008 | PASS | SC | `SC S2`：Feature 前端/API 无 `sync-client`/`kafka` 引用（0 命中）；后端 Feature 包无写方法与外部交互 | 本仓库不实现、不调用 sync-client |
| DSS-AC-009 | PASS | BR+DB | `BR tokens.json` 页面仅 7 列（无时间派生状态列）；`DB §B` COMPLETED 行 `UPDATED_AT` 为历史时间（2026-09-05/06）仍按普通行展示；`SC S2` 无时间派生逻辑 | 未依据 `UPDATED_AT` 推断在线/健康/离线 |

## 4.3 只读边界、无写接口与 SQL 只读审计（DSS-AC-010~013）

| 编号 | 状态 | 证据类型 | 具体证据 | 充分性说明 |
|---|---|---|---|---|
| DSS-AC-010 | PASS | SC+AUDIT+BT+DB | ①`SC S3` Controller 仅只读查询；②Service 无 save/update/remove/delete；③Mapper/注解 SQL 仅 SELECT；④无 INSERT/UPDATE/DELETE/MERGE；⑤`readonly/runtime-audit.txt`：`write_statement_count=0`、RUN_STATE `SELECT=23 WRITE=0`；⑥`CDC_CLIENT_MULTIPLE`/`CDC_DATA_SOURCE` `SELECT=23 WRITE=0`；`DB zero-write-proof.txt` 六段前后一致 | 六项子证据齐全（代码+运行日志+库前后对照） |
| DSS-AC-011 | PASS | BR+SC | `BR structure.json readOnlyProbe`：无操作列、无写按钮、查询区外无输入；`SC S4` | 无任何写入口 |
| DSS-AC-012 | PASS | BR+DB | `BR requests.json`/`changed-data.json` `nonGet=0`；`DB zero-write-proof.txt` 全文与计数哈希前后一致 | 三次刷新路径均只读 |
| DSS-AC-013 | PASS | HTTP+DB | `HTTP SUMMARY`：LEFT JOIN 补充描述/ORG；`HTTP 01` records=30 = `DB §A` RUN_STATE 30 行；`DB §H` joined_rows=30（JOIN 不改行集合）；`HTTP 21` 源库配置缺失行仍返回 | 行集合由 RUN_STATE 驱动，不被 JOIN 改变 |

## 4.4 RUN_STATE 驱动、不补行、不推断、规模与不分页（DSS-AC-014~019）

| 编号 | 状态 | 证据类型 | 具体证据 | 充分性说明 |
|---|---|---|---|---|
| DSS-AC-014 | PASS | DB+HTTP | `DB §A` RUN_STATE=30；`HTTP 01` records=30 且逐行 `clientId/sourceId` 与 `DB §B` 全量内容一致 | 一一对应，无凭空多出行 |
| DSS-AC-015 | PASS | DB+HTTP | `DB §A`：CDC_CLIENT_MULTIPLE=16、CDC_DATA_SOURCE=34；`HTTP 01` 候选 `candClients=8`/`candSources=9` < 配置表行数 → 候选亦不据配置补行 | 配置表多出组合未出现在列表 |
| DSS-AC-016 | PASS | SC+BR | `SC S2` 0 命中“未开始/待快照/尚无快照记录”；`BR structure.json` 无此类文案 | 无推断/虚拟状态 |
| DSS-AC-017 | PASS | HTTP+BR | `HTTP 01` clientState NOT_FOUND=5 / sourceState NOT_FOUND=5 的行照常返回；`HTTP 04/06/07` 含 NOT_FOUND/INACTIVE 行；`BR data.json` 这些行正常展示且带“停用”标记 | 关联配置缺失/停用行未被过滤 |
| DSS-AC-018 | PASS | BR+HTTP+SC | `BR structure.json`：`headerCount=7`、`bodyRowCount=30`、`pagination=0`；`HTTP 01` 单请求返回全部命中；`SC S4` 无分页控件 | 无分页、单请求全量 |
| DSS-AC-019 | PASS | BR+DB | `BR structure.json` 序号列存在；`BR data.json` 30 行 `seq` 1..30 连续唯一；`DB §B` 30 行 `CLIENT_ID+DATA_SOURCE_ID` 组合无重复 | 序号稳定连续；无重复组合 |

## 4.5 查询条件与组合（DSS-AC-020~024）

| 编号 | 状态 | 证据类型 | 具体证据 | 充分性说明 |
|---|---|---|---|---|
| DSS-AC-020 | PASS | BR+FT+SC | `BR tokens.json triggerBoxes` 240/300/200×32；`BR popper-matrix.json` 覆盖 ALL/SHORTEST/LONGEST/多选折叠/取消/重置；`FT` QueryBar spec“全部与具体候选互斥”“截断标签”“完整 value”用例；`SC S1` 三项条件固定 | 三项多选+显式“全部”+互斥+option 截断标签，均有实测/单元证据 |
| DSS-AC-021 | PASS | BR+FT+SC | 场景A：`BR requests.json initial`：1 次 GET 且无 `clientId/sourceId/status` 参数（`initialUsesAllCriteria` 通过）；场景B：`FT` DataSourceRunStatePage/errorChain + `SC` 错误卡片“重新加载”，重试仍按三项“全部” | 首载成功/失败两条路径均有证据；失败态以 FT 为主 |
| DSS-AC-022 | PASS | HTTP+BT+BR | ①`HTTP 01` 候选仅来自 RUN_STATE（8/9）；②`HTTP 04/06` 含未知记录时 `statuses` 含 UNKNOWN；③`BT candidatesShouldNeverBeNarrowedByCurrentFilter`：无未知行时 `statuses=[RUNNING,COMPLETED]`（无 UNKNOWN）；③补充`BT unknownStatusCandidateShouldAppearOnlyWhenUnknownRowExists`；④`HTTP 06` 筛出全部非 RUNNING/COMPLETED 行；⑤`BR data.json statusTooltipRaw[UNKNOWN]` 可查看原始值 | 子项③由后端测试覆盖（真实库始终存在未知行，无法以线上数据观测“无未知”分支） |
| DSS-AC-023 | PASS | HTTP+BR | `HTTP 07` 客户端多选 → 5 行（同条件“或”）；`HTTP 08` 源库多选 → 5 行；`HTTP 09` 跨条件“且” → 1 行；`HTTP 02/03/04` 单条件命中；`HTTP 07/08` 命中行含 NOT_FOUND/INACTIVE 关联配置 | “或/且”与关联缺失不排除均实测 |
| DSS-AC-024 | PASS | BR+FT | ①-⑩ 由 `BR requests.json` 各 phase（query/reset/singleFlight/failure/emptySuccess/hidden + `queryUsesClickedSelection`/`resetKeepsAppliedCriteria`/`emptySuccessUpgradesAppliedCriteria`/`failure*`）与 `FT` useDataSourceSnapshot/页面 spec 共同覆盖 | 十个子场景全部有直接证据；点击瞬间快照、仅成功才替换已应用条件均实测 |

## 4.6 列表字段（DSS-AC-025~031）

| 编号 | 状态 | 证据类型 | 具体证据 | 充分性说明 |
|---|---|---|---|---|
| DSS-AC-025 | PASS | BR+SC | `BR structure.json` `headers` 恰为七列且顺序一致；`SC S4` 无第八列 | 七列固定顺序 |
| DSS-AC-026 | PASS | BR+SC+FT | `BR data.json probeTooltipEqualsTrimmedDesc/ShortShowsDesc/NoEmpty/inactiveMarkSeen/inactiveMarkCorrect`；`BR tokens.json probeMain=600`、`inactiveMark`；`FT` Table spec 停用 Badge 外观与非 SOURCE/缺失静默 | 主内容仅 CLIENT_ID、Tooltip 仅描述、“停用”红字均实测；无黄色符号 |
| DSS-AC-027 | PASS | BR+FT+SC | `BR data.json sourceTooltipRawId[org]/[fallback]`、`sourceTooltipNotOrg`、`sourceOrgAndFallbackCovered`、`sourceTooltipAlwaysRawId`；`SC S6` 类别异常回退用例 | ORG 非空显示 ORG、ORG 空/NOT_FOUND 回退 ID、Tooltip 恒为原始 ID 均实测 |
| DSS-AC-028 | PASS | BR | `BR data.json statusTooltipRaw[RUNNING/UNKNOWN/COMPLETED]` 均显示 `原始状态：<raw>`；`BR tokens.json statusTags` 中文标签 | 已知状态中文标签 + 任意行可查原始值 |
| DSS-AC-029 | PASS | BR+DB | `BR table-visual.json` 时间列文本含 `--`；`DB §K` null_last_seen=13 / null_completed=19 | NULL 一律 `--`，两列分别对应 LAST_SEEN / COMPLETED |
| DSS-AC-030 | PASS | BR+DB | `BR table-visual.json timeTexts=["2026-09-06 11:02:00","--","2026-09-06 11:02:00"]` 与 `DB §B` 该行 UPDATED_AT 一致 | 展示值与库内业务值一致 |
| DSS-AC-031 | PASS | BR+SC | `BR structure.json hasActionColumn=false`、按钮仅 3 个只读入口；`SC S4` | 无操作列、无写入口 |

## 4.7 状态映射与未知值（DSS-AC-032~037）

| 编号 | 状态 | 证据类型 | 具体证据 | 充分性说明 |
|---|---|---|---|---|
| DSS-AC-032 | PASS | BR | `BR tokens.json statusTags.RUNNING = {bg rgb(224,242,254), color rgb(3,105,161), symbol ●, text ●快照进行中}` | 蓝色“快照进行中”标签 |
| DSS-AC-033 | PASS | BR | `BR tokens.json statusTags.COMPLETED = {bg rgb(236,253,245), color rgb(4,120,87), symbol ✓, text ✓快照已完成}` | 绿色“快照已完成”标签 |
| DSS-AC-034 | PASS | HTTP+BR+DB | `HTTP 22` 未知行返回 code=200、msg=success；`BR data.json` 未知行正常渲染；`DB §C` 含 SNAPSHOT_UNKNOWN/STALE/STARTING/UNKNOWN/UNKNOWN_MODE | 未丢弃、未改写、无报错 |
| DSS-AC-035 | PASS | BR | `BR tokens.json statusTags.UNKNOWN = {bg rgb(254,243,199), color rgb(180,83,9), symbol ?, text ?未知状态}`；`BR data.json` UNKNOWN 原始值 Tooltip | 橙色标签且与两类已知状态清晰区分 |
| DSS-AC-036 | PASS | DB+HTTP+BR | `DB §B/§C`：开发库**无天然** SNAPSHOT_COMPLETED；11 条 COMPLETED 全部为构造夹具（`c-dssr1-0906-*` + `s-dssr1-0906-*`）；`HTTP 05` 与 `BR` 展示该构造数据 | 验收未依赖天然 COMPLETED；COMPLETED 场景由受控构造夹具提供（构造由此前已授权任务完成，本任务未执行 DML）。见 §5 观察项 O-2 |
| DSS-AC-037 | PASS | BR+HTTP | `BR tokens.json statusTags` 三类标签文字+符号+颜色；`BR data.json` 三类行均完整返回、无丢弃；`HTTP 01` 三类分类计数 | 三类状态均有文字表达且完整返回 |

## 4.8 关联异常兼容（DSS-AC-038~042）

| 编号 | 状态 | 证据类型 | 具体证据 | 充分性说明 |
|---|---|---|---|---|
| DSS-AC-038 | PASS | BR+HTTP | `BR data.json probeTooltipNoEmpty[6]`（NOT_FOUND 不弹空 Tooltip）、无黄色符号；`HTTP 01` clientState NOT_FOUND=5 行仍返回 | 缺失静默、主内容为原始 CLIENT_ID |
| DSS-AC-039 | PASS | BR+HTTP | `BR data.json sourceTooltipRawId[fallback]`；`HTTP 21` 两条 NOT_FOUND 源库行返回 | 回退显示原始 ID、无缺失提示 |
| DSS-AC-040 | PASS | BR+HTTP | `BR tokens.json inactiveMark`（浅红 Badge 11px/700，clip=0）、`BR data.json inactiveMarkCorrect`；`HTTP 04` INACTIVE 行返回；源库列无红色标记 | 探针端“停用”红字；源库不回退为红字 |
| DSS-AC-041 | PASS | FT+BR | `FT` Table spec:238 源库停用/类别非 SOURCE/配置缺失 → 按 ORG/回退 ID 展示、无黄色图标；`BR data.json` 源库列无异常标记 | 类别异常行为由单元测试覆盖（真实库无类别非 SOURCE 行） |
| DSS-AC-042 | PASS | BR+FT+DB | `BR data.json` 无黄色图标、无异常 Tooltip；`BR tokens.json statusTags` 未知标签未回退；`DB zero-write-proof.txt` 前后一致（未触发修复/写） | 静默/降级展示，未改判状态、未写库 |

## 4.9 排序（DSS-AC-043~046）

| 编号 | 状态 | 证据类型 | 具体证据 | 充分性说明 |
|---|---|---|---|---|
| DSS-AC-043 | PASS | BT+BR+HTTP | `BT` QueryServiceImplTest:118-123 断言 RUNNING→UNKNOWN→COMPLETED 分组；`BR data.json rows` 行序（0..12 RUNNING、随后 UNKNOWN、末段 COMPLETED）；`HTTP 01` 分类计数 | 分组顺序实测+单测双证 |
| DSS-AC-044 | PASS | BT+BR | `BT`（组内 updatedAt 倒序，测试注释与断言）；`BR data.json rows` 同组内 `times[2]`（UPDATED_AT）递减 | 组内 `UPDATED_AT` 倒序 |
| DSS-AC-045 | PASS | BT+SC | `BT` 确定性排序键（CLIENT_ID/DATA_SOURCE_ID）用例；`SC S3` Mapper 排序子句含确定性键 | 并列时顺序稳定可复现 |
| DSS-AC-046 | PASS | BR+SC | `BR structure.json sortableHeaders=0`；`SC S4` 无表头排序 | 顺序不被用户改变 |

## 4.10 自动/手工刷新与页面可见性（DSS-AC-047~051、068）

| 编号 | 状态 | 证据类型 | 具体证据 | 充分性说明 |
|---|---|---|---|---|
| DSS-AC-047 | PASS | BR | `BR structure.json` 存在“立即刷新”；`BR table-visual.json countdownText="59 秒后自动刷新"`；`BR requests.json` 手工刷新仅 1 次按已应用条件 GET | 60 秒自动刷新 + 立即刷新均实测 |
| DSS-AC-048 | PASS | BR+FT | `BR requests.json hidden`：`duringHidden=0`、`afterVisible=1`；`FT` useDataSourceSnapshot destroy/visibility 用例 | 不可见冻结、恢复至多一次，均实测 |
| DSS-AC-049 | PASS | DB+AUDIT+BR | `DB zero-write-proof.txt` 六段一致；`readonly/runtime-audit.txt` 0 写；`BR` 全程 `nonGet=0` | 刷新只读 |
| DSS-AC-050 | PASS | BR | `BR requests.json singleFlight`：`burstEvents=160 → getCount=1` | 在途不重叠、被抑制触发不产生请求 |
| DSS-AC-051 | PASS | BR+FT | A：`BR table-visual` 倒计时与 `requests.countdown`（走秒 0 GET）；B：`requests.failure`（失败后保留旧数据/时间）；C：`requests.singleFlight`；D：`requests.hidden` | 四场景均实测 |
| DSS-AC-068 | PASS | BR | `BR table-visual.json` `refreshBtnW idle/loading/after=110/110/110`，`groupOriginX`/`actionsOrigin` 三态不变；`BR requests.failure` `refreshTimeBefore==After`；`BR tokens.json refreshBtn 110×32` | 宽度稳定、组不位移、时间仅成功更新 |

## 4.11 时间字段边界（DSS-AC-052~054）

| 编号 | 状态 | 证据类型 | 具体证据 | 充分性说明 |
|---|---|---|---|---|
| DSS-AC-052 | PASS | BR+DB | `BR table-visual.json` 三列文本 `YYYY-MM-DD HH:mm:ss`、空值 `--`；`DB §B` 原始值 | 格式统一，NULL 显示 `--`，不改业务值 |
| DSS-AC-053 | PASS | SC+BR | `SC S2` 无超时/离线/长期运行派生；`BR` 页面无此类提示 | 无时间派生状态 |
| DSS-AC-054 | PASS | DB+BR | `DB §B`：`hosp-012/112-source-19c` RUNNING 自 2026-08-17 起长期未变，`BR data.json` 仍按普通 RUNNING 展示（无错误/警告） | 长时间 RUNNING 不误判 |

## 4.12 加载、空数据、失败与恢复（DSS-AC-055~059）

| 编号 | 状态 | 证据类型 | 具体证据 | 充分性说明 |
|---|---|---|---|---|
| DSS-AC-055 | PASS | BR+FT | `BR screenshots/refresh-loading-*.png` 在途 loading；`FT` 页面 spec 首载 loading 用例；`BR structure.json` 无空态/错误态误显 | 在途展示加载反馈 |
| DSS-AC-056 | PASS | FT+SC+BR | `FT` 页面/errorChain spec（首次失败态 + “重新加载” + 已应用条件仍为三项“全部”）；`SC` 错误卡片；`BR requests.failure` 展示内联失败提示样式 | 首载失败路径以 FT 为主（浏览器未重现首载失败，非必需） |
| DSS-AC-057 | PASS | BR | `BR requests.json emptySuccess`：`共 0 条`、`rows=0`、`errSlot=""`、`emptySuccessUpgradesAppliedCriteria` 通过 | 0 条视为成功、升级已应用条件、更新时间 |
| DSS-AC-058 | PASS | BR+FT | `BR requests.failure`：旧行/汇总/最近成功时间均保留、内联提示“刷新失败，将在约 60 秒后自动重试”；`FT` errorChain 收敛不堆叠、不触发全局弹窗 | 失败保留现场、提示收敛 |
| DSS-AC-059 | PASS | BR(BI)+DB | `BR changed-data.json`（`BI` 明确标注“NOT real backend data”）`refreshReflectsNewestValue`：`08:00:01`→`09:30:47`；`noWriteRequestFromPage`、`refreshWasGet` 通过；`DB zero-write-proof.txt` 佐证页面无写 | 外部写进程不可用，以响应替换模拟“另一写进程改变数据”；已逐场景标注 BI |

## 4.13 可访问性与基础视觉（DSS-AC-060~061）

| 编号 | 状态 | 证据类型 | 具体证据 | 充分性说明 |
|---|---|---|---|---|
| DSS-AC-060 | PASS | BR | `BR tokens.json layers`（body rgb(245,247,250)、content-area rgb(240,242,245)、content-card #fff；query/result 卡片 token）与 app-shell 令牌一致；`BR screenshots/page-idle-*.png` | 浅色企业后台风格一致 |
| DSS-AC-061 | PASS | BR | `BR tokens.json statusTags` 文本 `●快照进行中/✓快照已完成/?未知状态`、`inactiveMark.text="停用"`；`BR data.json` 未知原始值文本 | 状态与异常均以文字+符号表达，不只靠颜色 |

## 4.14 安全、日志与敏感数据边界（DSS-AC-062）

| 编号 | 状态 | 证据类型 | 具体证据 | 充分性说明 |
|---|---|---|---|---|
| DSS-AC-062 | PASS | BR+HTTP+FT+AUDIT | `BR requests.failure errSlot="刷新失败，将在约 60 秒后自动重试"`（脱敏、无堆栈）；`HTTP 13/14` code=41002 msg="快照状态取值非法"（业务提示，无堆栈）；`FT` errorChain；`AUDIT` 0 写 | 失败返回/展示脱敏、无敏感信息、无写 |

## 4.15 测试数据授权与恢复（DSS-AC-063）

| 编号 | 状态 | 证据类型 | 具体证据 | 充分性说明 |
|---|---|---|---|---|
| DSS-AC-063 | PASS | DB+AUDIT+SC | 本任务提示词 §6.2 未纳入 `DSS-REQ-065` DML 授权；`DB zero-write-proof.txt` 证明全程零写入（`A/B/C/D/H/K` 前后一致）；`AUDIT` `write_statement_count=0`；未使用任何 DDL | 未执行 DML 即满足“仅当显式授权时才执行”，边界得到遵守 |

## 4.16 真实样例与受控构造场景（DSS-AC-064~065）

| 编号 | 状态 | 证据类型 | 具体证据 | 充分性说明 |
|---|---|---|---|---|
| DSS-AC-064 | PASS | HTTP+BR+DB | `HTTP 02`（clientId=hosp-012）返回 `clientId=hosp-012, sourceId=112-source-19c, snapshotStatus=SNAPSHOT_RUNNING`；`BR data.json` 该行显示“●快照进行中”；`DB §B` 对应真实行 | 真实 RUNNING 样例证明列表来源于 RUN_STATE |
| DSS-AC-065 | BLOCKED | — | 本任务 §6.2 明确“不授权对 `CDC_DATA_SOURCE_RUN_STATE` 或其他业务表执行人工 INSERT/UPDATE/DELETE/MERGE”；该用例前置条件为“后续任务已纳入受控测试数据 DML 授权”，本任务不满足，故备份→构造→验收→恢复→逐行一致核验全过程**无法执行**；DML 治理本身**无充分替代证据**（展示类子行为已由 006/033/037/038/039/041/042 独立覆盖） | 无法执行且无充分替代 → `BLOCKED` |

## 4.17 测试与构建执行入口（DSS-AC-066~067）

| 编号 | 状态 | 证据类型 | 具体证据 | 充分性说明 |
|---|---|---|---|---|
| DSS-AC-066 | PASS | BT+FT+BUILD | `tests/backend-targeted.txt` Tests run 27, Failures 0；`tests/frontend-targeted.txt` 250 passed；`tests/frontend-full.txt` 834 passed；`tests/backend-package.txt`/`frontend-build.txt` BUILD SUCCESS | 自动化覆盖映射/NULL/排序/唯一性/空态，且构建通过 |
| DSS-AC-067 | PASS | BR+SVC | `BR structure.json` 标题/七列/查询区；`BR` 全程 read-only、`consoleErrors=0`、`nonGet=0`；`services/liveness.txt` 服务存活且本机可达 | 真实浏览器只读目测全部通过 |

## 4.18 第一轮 UI 调整草案新增验收（DSS-AC-069~080）

> `DSS-AC-073/080` 中的列宽/时间列口径已被 §4.20 `DSS-AC-090` 的 `70/170/285/140/170/170/170`、`1175px` 模型**定向取代**（§5.1），实际按 §4.20 现行规则实测通过；`DSS-AC-074/075/076/077` 的关联异常图标说明已随黄色图标删除而取消（§4.19 现行规则）。

| 编号 | 状态 | 证据类型 | 具体证据 | 充分性说明 |
|---|---|---|---|---|
| DSS-AC-069 | PASS | BR | `BR tokens.json layers`：`dss-page` transparent/10px/14px 16px/gap 12px、`query-card` rgb(244,244,245)/8px/无阴影、`result-card` #fff/10px/box-shadow/border 0；三段式结构 `BR structure.json` dssCardCount=2 | 三块语义区与令牌均实测 |
| DSS-AC-070 | PASS | BR | `BR tokens.json resultHeader.summaryCount={16px,700,rgb(9,9,11),text "共 30 条"}`；`summaryUnknown={12px,700,rgb(180,83,9) on rgb(254,243,199),radius 999px,height 22px,padding 0 8px,text "其中 6 条未知状态"}`；`FT` 0 未知时不显示 | 汇总与未知胶囊均实测 |
| DSS-AC-071 | PASS | BR | `BR tokens.json resultHeader.refreshGroupChildren=[dss-countdown-ring, dss-countdown-text, dss-refresh-sep, dss-refresh-time, el-button dss-refresh-btn]`；`BR table-visual` 组靠右贴合 | 刷新逻辑组顺序/不可拆散性实测 |
| DSS-AC-072 | PASS | BR+FT | `BR table-visual displacement`：`refreshBtnW idle/loading/after=110`，`groupOriginX`/`actionsOrigin` 三态不变；`FT` QueryBar 六类请求映射（仅 `manual` 使“立即刷新”loading）；`BR requests.failure` 失败提示位于稳定槽位 | 三态宽度、组位移、失败提示位置均有实测 |
| DSS-AC-073 | PASS | BR+FT | `BR table-visual.json` 1280 实测 `headerWidths=[70,170,285,140,170,170,170]`、`tableMinW=1175px`；1700/1920/2560 弹性列按比例吸收、三时间列等宽；`FT` Table spec:153/155/156 | 按 §4.20 现行模型实测通过（`1145/130/165` 旧口径已被取代，见注） |
| DSS-AC-074 | PASS | BR | `BR data.json` 探针端主内容仅 CLIENT_ID、Tooltip 仅完整描述（空/缺失不弹）、`inactiveMark` 红字“停用”、无黄色图标 | 逐项实测 |
| DSS-AC-075 | PASS | BR | `BR data.json sourceTooltipAlwaysRawId`（正常行与回退行同源）、ORG 空回退、无异常说明 | 逐项实测 |
| DSS-AC-076 | PASS | BR | `BR data.json tooltipHostAtMostOne`、离开/滚动/隐藏关闭、快速扫行不残留 | 单实例规则实测 |
| DSS-AC-077 | PASS | BR+FT | `BR data.json tooltipNonEnterable/WithinViewport/BoundaryAvoidance/fixed position/noNativeTitle`；`BR data.json delayMs=320`（约 300~350ms） | 延迟/关闭/边界/生命周期实测 |
| DSS-AC-078 | PASS | BR+FT | `BR requests.json` 六类请求计数（initial 1、countdown 0、singleFlight 1、reset 0、failure、hidden）；`FT` QueryBar 六类 loading 映射（initial/retry/auto/restore 不点亮“立即刷新”） | 六类请求视觉映射由 BR+FT 共同覆盖 |
| DSS-AC-079 | PASS | BR+FT | `BR requests.json singleFlight`：鼠标+键盘 160 次触发 → 1 GET；`FT` busy 阻断/`aria-disabled`/无闪动用例 | 忙碌抑制、单飞行实测 |
| DSS-AC-080 | PASS | BR | `BR table-visual.json`（1280/1700/1920/2560）+ `BR closeout-1440.json`（1440×900 直接实测）三块结构、表格铺满或横向滚动、头部不位移、Tooltip 不越界、0 console error、0 写 | 1440×900 已独立实测（见 §5 观察项 O-3 关于 1440 与 1700 分别属窄屏/宽屏区间） |

## 4.19 第二轮 UI 调整草案新增验收（DSS-AC-081~086）

| 编号 | 状态 | 证据类型 | 具体证据 | 充分性说明 |
|---|---|---|---|---|
| DSS-AC-081 | PASS | BR | `BR table-visual.json` + `BR closeout-1440.json`：①表格铺满或横向滚动（1280: tableW=1175 > body 916 滚动；1700: tableW=1336 = 卡片正文）；②固定列实测 70/285/140（序号/源库/状态）恒定；③弹性列按 170:285 权重吸收；④`displacement` 头部不动；⑤单行 ellipsis；⑥`<1175px` 保持最小总宽并滚动 | ②中“时间列 165 且不因宽屏变宽”已被 §4.20 `090` 取代为“三时间列等宽、按最终算法吸收富余”，实测符合取代后规则 |
| DSS-AC-082 | PASS | BR | `BR data.json probeTooltip*`、`inactiveMark*`、`probeDescVariantsCovered`、`noYellowIcon*` | ACTIVE/INACTIVE/NOT_FOUND/空描述四类均覆盖 |
| DSS-AC-083 | PASS | BR+FT | `BR data.json sourceTooltip*`（正常/回退同源、无异常说明、无黄色图标）；`SC S6` + `FT` Table spec:238 覆盖类别非 SOURCE | 类别异常行真实库不存在，行为由 FT 覆盖 |
| DSS-AC-084 | PASS | BR(BI)+HTTP+FT | `BR bi.json`（标注 BI）19/20 不截断、21/22 截断、CJK 按 code point、emoji 代理对不拆分、`fieldsTruncatedBeforeAssembly`、`requestCarriesFullRawId`、`requestDoesNotCarryEllipsis`；`HTTP 17/18/19`；`FT` QueryBar spec 边界用例 | 截断规则与“展示不回流到 value/请求”双证 |
| DSS-AC-085 | PASS | BR+FT | `BR popper-matrix.json`：client 480 / source 400 / status 240（`spread=0`）、触发控件 240/300/200；`BR tokens.json triggerBoxes`；`FT` 命名空间 popper-class 用例 | 源库面板 400 已按 §4.22 现行规则取代本用例“560px”旧表述；实测符合现行规则 |
| DSS-AC-086 | PASS | BR | `BR data.json tooltipHostAtMostOne`、未知原始值 Tooltip、无异常图标说明 Tooltip、无原生 `title` | 删除图标后单实例规则未回归 |

## 4.20 隔离视觉原型 R2～R7 设计固化新增验收（DSS-AC-087~095）

| 编号 | 状态 | 证据类型 | 具体证据 | 充分性说明 |
|---|---|---|---|---|
| DSS-AC-087 | PASS | BR | `BR tokens.json layers`：body rgb(245,247,250)、content-area rgb(240,242,245)、content-card #fff、`dss-page` rgba(0,0,0,0)/10px/14px 16px/gap 12px、`query-card` rgb(244,244,245)/8px/boxShadow none/borderWidth 0、`result-card` #fff/10px/box-shadow/border 0 | 背景层级与三段式逐项命中 |
| DSS-AC-088 | PASS | BR+FT | `BR tokens.json queryBar`：标签 14px/600/rgb(63,63,70)/无背景边框/nowrap、`labelGapAfter.gap=6`；`triggerBoxes` 240/300/200×32；`queryBtn` rgb(9,9,11)/白/500/6px/30px；`resetBtn` rgb(228,228,231)/rgb(63,63,70)/6px/30px；`FT` 改条件不发请求 | 逐项实测 |
| DSS-AC-089 | PASS | BR | `BR tokens.json resultHeader`：汇总 16px/700/rgb(9,9,11)；胶囊 12px/700/rgb(180,83,9) on rgb(254,243,199)/999px/22px/0 8px；刷新按钮白底 1px rgb(228,228,231)/rgb(63,63,70)/6px/110px idle=loading | 逐项实测 |
| DSS-AC-090 | PASS | BR+FT | `BR table-visual.json` 1280 `headerWidths=[70,170,285,140,170,170,170]`、`tableMinW=1175px`；1700/1920/2560 宽屏 time 列等宽（198/237/349）、源库 > 探针端；`BR closeout-1440.json` 同模型；`FT` Table spec 153-156 | 最小列宽模型与铺满行为逐视口实测 |
| DSS-AC-091 | PASS | BR | `BR table-visual.json timeCellPad={pl 8px, pr 8px, pt 0, pb 0}`、`rowH=49`、`timeOverflow=[0,0,0]` | 水平 8px、行高 49px、19 字符无省略 |
| DSS-AC-092 | PASS | BR | `BR tokens.json countdown.ring=16×16`、`ringTrack rgb(228,228,231)`、`ringProgress rgb(37,99,235)`；`BR table-visual countdownText="59 秒后自动刷新"`；`BR requests.countdown requestsDuringTick=0`；`BR requests.hidden` 冻结/恢复 | 圆环、走秒 0 GET、冻结恢复实测 |
| DSS-AC-093 | PASS | BR | `BR tokens.json statusTags`（三色/600/20px/4px/符号 ●✓?）、`inactiveMark`（#fee2e2/#991b1b/11px/700/4px/20px/0 6px/clip=0）、`unknownRowBg rgba(254,243,199,0.42)`、`probeMain=600`；`BR data.json` 源库 Tooltip 恒为原始 ID | 逐项实测（hover 背景见 table-visual unknownBg/hoverBg） |
| DSS-AC-094 | PASS | BR+SC | `BR table-visual.json`：1280 `queryBarH=70`（查询/重置换行）、1700/1920/2560 `queryBarH=32`（同一行）；`BR closeout-1440.json queryCardH=52`（同一行）；`SC` REQUIREMENTS §21.5 已撤回“1280 必须同一行”前提 | 换行行为实测且与文档现状一致 |
| DSS-AC-095 | PASS | BR+FT | `BR requests.json` 全部 phase + `BR changed-data.json`；`FT` 全套用例（交互状态机、单实例、只读） | 状态机与既有验证行为一致 |

## 4.21 查询控件交互调整草案新增验收（DSS-AC-096~103）

| 编号 | 状态 | 证据类型 | 具体证据 | 充分性说明 |
|---|---|---|---|---|
| DSS-AC-096 | PASS | BR+FT | `BR popper-matrix.json`：三控件 `triggerW/wrapperW` 在 ALL/SHORTEST/LONGEST/截断/多选折叠/取消/重置/滚动/开关面板下恒为 240/300/200，`spread=0`；`BR tokens.json triggerBoxes`；`FT` 源码字面量契约（min=max=width=flex basis） | 根节点与 wrapper 宽度恒定为实测值 |
| DSS-AC-097 | PASS | BR+FT | `BR closeout-1440.json layoutStates`：S0_INIT_ALL→S1_SHORTEST→S2_LONGEST→S3_MULTI_COLLAPSE→S4_AFTER_RESET，`.dss-q-actions.x=1218`、`y=176.5`、`queryCardH=52`、三 `groupXs=[292,594,942]`、`triggerW=[240,300,200]` 全程不变（15/15 断言通过） | 内容长度变化不推动后续组与按钮、不改变高度、不额外换行，均直接实测 |
| DSS-AC-098 | PASS | BR(BI)+HTTP+FT | `BR bi.json` 19/20 原文、21/22 前 20 code point+`...`、中文按 1 码点、代理对不拆断、空描述/空 ORG 无空括号；`HTTP 17/18/19`；`FT` QueryBar 边界与 trim 用例 | 四字段边界与空值均双证 |
| DSS-AC-099 | PASS | BR(BI)+HTTP+FT | `BR bi.json requestCarriesFullRawId/requestDoesNotCarryEllipsis`；`HTTP 17`（19 字符完整命中）/`18`（截断前缀不命中）；`FT` 完整 value 语义用例 | 截断只影响显示 |
| DSS-AC-100 | PASS | BR+FT | `BR data.json queryBarTooltip`：152 码点 → 完整未截断描述；13 码点 → 无 Tooltip；`qbarTooltipAbsentForAll/EmptyDesc`；`FT` 20 无 Tooltip / 21 有、超长 ID 无、源库候选无、“全部”无 | 条件与内容、非目标候选无 Tooltip 均双证 |
| DSS-AC-101 | PASS | FT+BR | `FT` QueryBar spec：可见已选标签 Tooltip 与候选一致、`+N` 不聚合、碰撞候选身份正确；`BR data.json queryBarTooltip` 实测 | 已选项与 `+N` 语义由单元测试覆盖 |
| DSS-AC-102 | PASS | BR+SC+FT | `BR data.json queryBarTooltip` 实测 rect l=340 r=820（宽 480）、`withinViewport=true`、`pointerEvents=none`；`SC S7` 样式 `max-width: min(480px, calc(100vw - 16px))`；`FT` Teleport 到 body、类名与表格 Tooltip 独立、悬停 0 请求 | 安全宽度、不污染表格 Tooltip 均双证 |
| DSS-AC-103 | PASS | BR+FT | `BR requests.json` 全程 0 请求于选择/重置、`singleFlight`/`hidden`/`failure` 无回退；`BR popper-matrix.json` 四视口几何恒定；`BR table-visual.json`+`tokens.json` 回归项（110px 按钮、49px 行高、时间无省略、倒计时、未知状态、源库 Tooltip）；`FT` 0 请求用例 | 请求计数与回归项均实测 |

## 4.22 查询下拉固定宽度基线新增验收（DSS-AC-104~107）

| 编号 | 状态 | 证据类型 | 具体证据 | 充分性说明 |
|---|---|---|---|---|
| DSS-AC-104 | PASS | BR+FT | `BR popper-matrix.json`：外层 `.el-popper` 在 A_INIT_ALL…J_AFTER_RESET 各状态恒为 480/400/240、`spread=0`；`CLOSE_REOPEN`：关闭后 `display:none/aria-hidden/width 0`，重开 `equal=true before=480 reopen=480`（源库 400、状态 240 同）；四视口均测 | 固定对象为外层 `.el-popper`，关闭重开一致性实测 |
| DSS-AC-105 | PASS | BR | `BR popper-matrix.json` 四档正式视口外层 480/400/240、`hOverflow=0`、`DOC hScroll=false`；内层 `.el-select-dropdown` 内联 `min-width` 未导致外层越界 | `<1280px` 仅防御性观察、不计入结论；Element Plus 内层内联约束不作为失败依据 |
| DSS-AC-106 | PASS | BR+FT | `BR popper-matrix.json CLOSE_REOPEN fontW=700`（`is-selected` 选中强调保留）且外层宽度与未选中差 0；`inner 478/398/238` = 外层 −2px 边框（自适应而非内外同宽写死）；`BR table-visual.json featureAuthoredImportantRules=0`、19 条裸 `.el-popper` 规则全部来自 `element-plus/dist/index.css`（0 条 Feature 自撰） | 选中样式不影响宽度、内外层叠关系正确、无 `!important`/无全局覆盖 |
| DSS-AC-107 | PASS | BR+SC+FT | `BR tokens.json triggerBoxes` 240/300/200×32 未变；`BR bi.json`/`data.json` 四字段截断与 Tooltip 规则未变、完整 value/查询语义未变；`BR requests.json resetZeroRequests` 等 0 请求、无回退；`SC + §16` `API.md`/`DATABASE.md` 本任务零差异；四视口已测 | 触发控件尺寸、截断/Tooltip、请求语义、契约不变，均双证 |

---

## 5. 观察项与冲突记录（不影响上述判定）

- **O-1 旧名残留（非四面）**：`frontend/src/views/HomePage.vue:65` 的模块说明仍含“数据源运行状态”；该组件**未被任何路由或组件引用**（`grep -rn HomePage frontend/src` → 0 引用），运行中的 5173 平台不呈现。另 `backend/src/main/resources/static/assets/*.js` 为**既有提交的陈旧构建产物**（PlaceholderPage 旧 bundle，chunk hash `aaNH3SSt` 与当前构建 `eLQZ7Bas` 不同），非本 Feature 源码。二者均落在 `DSS-AC-001/005` 的“菜单/路由元数据/页面标题/面包屑”四个检查面**之外**，故不计入用例失败；此处如实记录，供项目负责人与 ChatGPT 独立复审判断。
- **O-2 `DSS-AC-036` 前置条件措辞与现状**：开发库**无天然** `SNAPSHOT_COMPLETED`（成立）；现有 11 条 COMPLETED 全部为受控构造夹具（`c-dssr1-0906-*`/`s-dssr1-0906-*` 及 `SNAPSHOT-TEST-*-DONOTUSE` 关联配置），由**此前已授权任务**构造；本任务未执行任何 DML。用例预期“验收不依赖天然 COMPLETED”成立。
- **O-3 1440×900 视口归属**：`DSS-AC-080/081/090` 命名的 1440×900 已用 `browser/closeout-1440.json` 独立实测；实测 `resultCardBodyW=1108 < 1175`，属“最小总宽 + 横向滚动”区间（与 1280 同区间），1700 起进入“铺满”区间。
- **O-4 取代关系（§5.1）**：`DSS-AC-073` 的 `130/165/280/1145px` 与 `DSS-AC-081②` 的“时间列 165 固定”均被 `DSS-AC-090` 的 `70/170/285/140/170/170/170`、`1175px`、“三时间列等宽并按最终算法吸收富余”取代；`DSS-AC-085` 的“源库面板 560px”被 §4.22 的 400px 取代。二者按现行规则实测通过，不判失败。
- **O-5 调度器与本 Feature 三表分离审计**：`readonly/runtime-audit.txt` 记录 4 个整点轮次（`LARGE_SCREEN_STATS`，均 `stopReason=all_caught_up`、`correctProcessed=0`、`errorProcessed=0`）与 `CDC_STATS_WATERMARK SELECT=24 WRITE=0`；`database/zero-write-proof.txt §L` 仅记录 `CDC_STATS_*` 当前行数、**未声明前后增量**。调度器行为与本 Feature 三表零写入分别审计，未混为一谈（符合 §6.3）。
- **O-6 `DSS-AC-036` 处置说明**：本轮未把 `036` 判为 `FAIL`，因为其“操作·输入”为“检查验收数据准备”、预期为“验收不依赖天然 COMPLETED”，该预期成立；构造动作本身归属 `DSS-AC-065`，已在 `065` 记 `BLOCKED`。

## 6. 四态计数

| 状态 | 条数 | 编号 |
|---|---|---|
| `PASS` | 106 | DSS-AC-001~064、DSS-AC-066~107 |
| `FAIL` | 0 | — |
| `BLOCKED` | 1 | DSS-AC-065 |
| `NOT_RUN` | 0 | — |
| **合计** | **107** | `DSS-AC-001~107` 连续唯一 |
