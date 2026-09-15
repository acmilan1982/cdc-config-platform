# 操作按钮 Loading 视觉稳定性正式验收执行报告

- 任务编号：`DATA-SOURCE-SNAPSHOT-STATUS-ACTION-BUTTON-LOADING-VISUAL-STABILITY-FORMAL-ACCEPTANCE-001`
- Feature：`data-source-snapshot-status`（源库快照状态）
- 任务类型：正式验收执行（只执行与判定 `DSS-AC-108~113` 共 6 条；不修改实现代码、不修复验收中发现的问题、不作最终接受收口）
- 目标分支：`develop`
- 任务唯一基点提交：`5195a716ed3b6d0d3122decfe937b73b27581d5a`（`origin/develop` 与本地 HEAD 在该基点一致）
- 已批准业务内容基准提交：`c4d5c096a7428d7f5be1af0d776c53655dd86e26`
- R0 前端实现提交：`fccefbffccac7fbcc7bff039384549c24e0ed45e`
- R1 业务修正提交：`9fdccd202a47df29df95745491fcc9bf4cf8f082`；R1 结果提交：`1b58e3c9a234062bb1b9351f7675aeb21abd76cd`
- R2 严格断言闭环结果提交：`0ab68959e4bb9973c25f610769716e6d00a597d2`
- 实现复审收口基点提交：`5195a716ed3b6d0d3122decfe937b73b27581d5a`
- 对应需求/验收：`DSS-REQ-088`/`DSS-REQ-089`（REQUIREMENTS §21.9）；`DSS-AC-108`～`DSS-AC-113`（ACCEPTANCE §4.23）
- 对应设计/界面：`DESIGN.md` §31、`UI.md` §25
- 隔离 worktree：`/agent/dss-abl-fa-001`（`detached HEAD`，`5195a716ed3b6d0d3122decfe937b73b27581d5a`）
- 服务：前端 `http://192.168.174.70:5173/monitor/data-source-state`（pid `19652`）；后端 `http://192.168.174.70:8080`（pid `19585`）
- 验收日期：2026-09-14

> 本报告记录 `DSS-AC-108~113` 共 6 条的**真实执行与判定**结果。本轮在**全新隔离 worktree**（`/agent/dss-abl-fa-001`，`detached HEAD`，起点提交 `5195a716ed3b6d0d3122decfe937b73b27581d5a`）从该提交启动前后端，用**真实 Chromium** 在四档正式支持视口逐条执行，用**机器断言**（严格 `=== 0`、无容差）判定。6 条**全部 `PASS`**。正式验收执行**不等于最终接受**：本报告**不**把 Feature 写成 `ACCEPTED`/`IMPLEMENTED_ACCEPTED`/`FORMALLY_ACCEPTED`/`COMPLETED`，最终接受决定权在项目负责人，且 ChatGPT 需先从远程 Git 复审本轮正式验收结果。

---

## 1. 任务性质与边界

- **只执行与判定** `DSS-AC-108~113` 共 6 条；本任务**不实现**、**不修复**验收过程中发现的问题、**不作**正式验收收口或最终接受收口。
- **不修改** `frontend/**`、`backend/**`、测试代码、SQL、配置、依赖、锁文件（`git/02` 以路径级零差异与冻结区摘要哈希双重证明）。
- **不伪造**证据：所有结论均来自本任务真实采集的原始数据（`browser/`、`service/`、`db/`）。
- 失败注入**只在浏览器网络层**针对唯一目标 `GET /api/monitor/data-source-run-state/list` 进行，**不改**后端、数据库或生产代码；拦截不含任何非 GET 请求。
- 页面为**只读**：不手写 DML/DDL、不向业务表写入测试数据；后端只使用既有只读查询。
- 本任务**不**读取 ZooKeeper、Kafka；该 Feature **不依赖** ZooKeeper（`feature_zookeeper_dependency=NONE`、本任务 ZooKeeper 使用需求为 `NOT_REQUIRED_BY_FEATURE`）。后端启动期存在与本 Feature **无关**的 ZooKeeper 连接背景日志——后端曾建立到 `10.19.16.111:2181` 的会话，随后出现会话超时/重连（`Client session timed out`、`ConnectionLoss`、`session ... has expired`）。按 §5，这些属于**背景行为**，单独记录（`service/09-backend-background-behaviour.txt`），**不**作为本 Feature 依赖或验收失败；本任务全程**未**主动访问 ZooKeeper/Kafka。

---

## 2. 唯一基点、隔离环境与服务

### 2.1 基点校验（`git/01-scope-and-base.txt`）

| 校验项 | 值 |
|---|---|
| 期望基点提交 | `5195a716ed3b6d0d3122decfe937b73b27581d5a` |
| `git ls-remote origin develop` | `5195a716ed3b6d0d3122decfe937b73b27581d5a` |
| 本地 `origin/develop` | `5195a716ed3b6d0d3122decfe937b73b27581d5a` |
| worktree `HEAD` | `5195a716ed3b6d0d3122decfe937b73b27581d5a` |
| 判定 | 三者一致；未做 rebase/merge；无分叉 |

主工作区 `/agent/cdc-config-platform`（`develop`，`4222b0a24b927aca6f62ff348fd8549b73d4156c` 及其既有修改）**逐字节保留**，本任务未进入、未清理、未修改；未进入或清理任何既有 worktree。

### 2.2 服务（`service/00`～`service/02`、`service/08`）

- 先按 PID + cwd + 命令行逐个核对 5173/5174 监听进程，仅对**确认属于本 Feature 前序任务**的实例按精确 PID 记录后停止（`service/00-pre-existing-instances.txt`）；未按端口批量杀进程，未使用 `pkill node`/`killall`，未停止来源不明进程。
- 前端从本 worktree 的 `frontend/` 启动：`npm run dev -- --host 0.0.0.0 --port 5173 --strictPort`；监听 `0.0.0.0:5173`，cwd 指向本 worktree，`--strictPort` 下未漂移到 5174。
- 后端从本 worktree 的 `backend/` 启动（既有 dev 配置与凭据，凭据未写入任何证据）：监听 `*:8080`，`GET /api/monitor/data-source-run-state/list` 返回 **HTTP 200**，页面可见查询栏、刷新区与表格。
- 服务来源指纹（`service/02-served-source-fingerprint.txt`）：对实际被服务的四个 Feature 源文件按 blob 哈希比对，与基点提交 `5195a716…` **一致**（`DataSourceSnapshotQueryBar.vue`=`36e501da0c2f44cf3cc2269b3be62d2485761471`、`DataSourceSnapshotQueryBar.spec.ts`=`6219da2239c593a1bd9856aaac29afc12d52f7ae`、`DataSourceSnapshotToolbar.vue`=`2723426a8e9a3c461dbb087b99250b25e170f1bc`、`DataSourceSnapshotToolbar.spec.ts`=`7ab59211c2d39fe44247bc527d38c408bc171aac`、`DataSourceRunStatePage.spec.ts`=`210162bee9d3345096550133ed9f73152a38e144`）。
- 服务保持运行，供用户视觉验收；PID、cwd、URL、日志路径与停止命令见 `service/08-service-control-record.txt`（`kill 19652 19585`）。

---

## 3. 变更前门禁（§6：先证明基线可测，再改文档状态）

| 检查 | 期望 | 实测 | 结论 |
|---|---|---|---|
| 定向组件测试 `DataSourceSnapshotQueryBar.spec.ts` + `DataSourceSnapshotToolbar.spec.ts` | 2 文件 / 119 用例 | 2 文件 / 119 通过，exit `0` | 一致（`service/03`） |
| `data-source-run-state` Feature 测试 | 265 用例 | 13 文件 / 265 通过，exit `0` | 一致（`service/04`） |
| 前端全量测试 | 854 用例 | 50 文件 / 854 通过，exit `0` | 一致（`service/05`） |
| `vue-tsc --noEmit` | 通过 | exit `0` | 一致（`service/06`） |
| `vite build` | 通过 | exit `0` | 一致（`service/07`） |

实测数字与任务预期**完全一致**，无需要重新核对 Git 内容的偏差；不存在无法解释的差异。

---

## 4. 验收执行方式（真实浏览器 + 机器断言）

- **真实 Chromium**（`Chrome/148.0.7778.167`）经 Chrome DevTools Protocol 驱动，零新增依赖（`browser/harness/cdp.mjs`）。
- 页面由**本 worktree** 的 Vite 实例（5173，`--strictPort`）服务；成功路径把目标 GET 放行到**真实后端**（8080），失败路径**只在浏览器网络层**对该唯一 GET 返回受控失败。拦截仅限 `GET /api/monitor/data-source-run-state/list`，且不产生任何非 GET 请求。
- 四档官方视口：`1280×800`、`1700×920`、`1920×1080`、`2560×1440`；每档对空闲 / 点击「查询」Loading / 查询成功 / 查询失败 / 点击「立即刷新」Loading / 刷新成功 / 刷新失败等状态逐一测量。
- 几何判据：`getBoundingClientRect()` **原始值**，跨状态最大差值**严格 `=== 0`**；无容差、无右锚点替代、无舍入掩盖（`browser/harness/assertions.mjs` 为唯一判定模块）。
- **判定模块可失败性自证**（`browser/negative-selftest.mjs`）：对真实结果注入 `0.001px` 位移（`MANUAL_LOADING` 状态的 `queryBtn.w +0.001` 与 `refreshBtn.y +0.001`）后，断言模块报出**未舍入实测量**（`0.0009999999999976694` / `0.0010000000000047748`）并以**非零退出码**结束；未改动结果仍为 `passed=true`、失败 `0`。该非零退出即预期结果，证明模块既能通过干净输入、也能识别亚 `0.001px` 位移，不存在舍入掩盖或伪通过。

### 4.1 机器判定汇总

| 指标 | 值 |
|---|---|
| `checks_passed` | `294` |
| `assertion_failure_count` | `0` |
| 断言模块真实退出码 | `0` |
| 汇总结论 | `RESULT=ALL_HARD_ASSERTIONS_PASSED` |
| 四视口整组位移 | `x/y/width/height` 全 `0` |
| 查询按钮宽度集合 | `[62]`（四状态 × 四视口） |
| 立即刷新按钮宽度集合 | `[110]` |
| 请求总数 / 非 GET 请求 / 接口非 GET | `491` / `0` / `0` |
| console error | `0` |
| 其他路由 Feature 私有样式泄漏 | `0` |
| 页面水平溢出 | `0` |
| 成功路径真实后端 | HTTP `200`，`recordCount=30` |

原始产物：`browser/acceptance-matrix.json`（完整结果对象）、`browser/rects/{1280x800,1700x920,1920x1080,2560x1440}.json`（每视口每状态原始矩形与位移）、`browser/acceptance-requests.json`（全部请求与真实后端响应）、`browser/acceptance-console.json`、`browser/acceptance-assertion-analysis.txt`、`browser/acceptance-run.txt`（原始 stdout/stderr 与退出码）、`browser/negative-selftest.txt`、`browser/screenshots/*.png`（含 reduced-motion 与其他路由）。

---

## 5. 逐条验收判定

| 用例 | 判定 | 关键实测证据 |
|---|---|---|
| `DSS-AC-108` | **PASS** | 四状态「查询」按钮 `x`/`y`/`width`/`height` 最大变化 `0px`；宽度恒 `62px`（集合 `[62]`）；Element Plus 默认 Loading 图标未进入内容流（`elementPlusLoadingIcon=0`，四状态 × 四视口）；成功与失败后均恢复 |
| `DSS-AC-109` | **PASS** | 标签文字恒为 `查询`；标签中心点 `x`/`y` 最大变化 `0px`；白色指示器位于文字**左侧空白区**、不覆盖不推动文字、不进入内容流；指示器为**常驻单节点**，仅切换可见性/透明度/旋转，`aria-hidden="true"` 恒成立；`prefers-reduced-motion: reduce` 下旋转停止但**静态可见**且按钮几何不变。项目负责人已接受“白色旋转环位于 `查询` 左侧”的现有视觉形态，未作改色或重设 |
| `DSS-AC-110` | **PASS** | 四状态「立即刷新」按钮 `x`/`y`/`width`/`height` 最大变化 `0px`；宽度恒 `110px`（集合 `[110]`）；默认 Loading 图标未进入内容流；Loading 后正确恢复 |
| `DSS-AC-111` | **PASS** | 标签文字恒为 `立即刷新`；标签中心点 `x`/`y` 最大变化 `0px`；深色指示器位于文字左侧空白区、不覆盖不推动；`.dss-refresh-group` 的 `x`/`y`/`width`/`height` 在所有状态严格不变；`最近成功刷新：--`、多组 `HH:mm:ss`、成功刷新后时间更新均不推动刷新组；倒计时 `60/59/10/9/0/--` 不移动 `2ch` 秒数槽位与后续元素 |
| `DSS-AC-112` | **PASS** | 各自 Loading 期间 `aria-busy=true`、结束后移除/恢复；`aria-disabled` 单飞行语义保留（两按钮均不使用原生 `disabled` 改变视觉）；指示器恒 `aria-hidden=true`；`queryLoading` 只点亮查询指示器、`manualLoading` 只点亮刷新指示器；单次有效点击**恰好 +1 次 GET**（`singleClickGets=1`）；在途重复点击（`duplicateClickGets=1`）、另一按钮（`crossButtonGets=1`）、Enter（`enterGets=1`）均**不产生重复请求**；成功更新数据与最近成功刷新时间；失败保留旧结果、旧已应用条件（前后均为 `?status=RUNNING` 同一非空条件）与旧成功刷新时间并显示收敛错误信息；页面不可见时倒计时冻结（隐藏期 GET `0`），恢复可见按既有规则**恰好触发 1 次**补偿 GET 且**不点亮**手动指示器；写请求 `0` |
| `DSS-AC-113` | **PASS** | 四档视口下「查询/重置」组、「刷新信息组」、查询栏位置与高度变化量均 `0px`（`reset_btn`/`query_group`/`refresh_sep`/`query_bar` 位移全 `0`）；`1280×800` 保留既有响应式换行，Loading **未引起额外换行**；console error `0`；其他路由（`/monitor/data-source`）无 Feature 私有样式泄漏；查询下拉固定宽度、Unicode 截断、Tooltip、完整原始查询参数语义与刷新/查询状态机均无回退；页面水平溢出 `0` |

`DSS-AC-108~113` 共 6 条：`PASS 6 / FAIL 0 / BLOCKED 0 / NOT_RUN 0`。

---

## 6. 数据库只读快照与请求路径 SQL 审计（§14）

- 验收执行前后对 `CDC_DATA_SOURCE_RUN_STATE`（30 行）、`CDC_CLIENT_MULTIPLE`（16 行）、`CDC_DATA_SOURCE`（34 行）三表取**只读**行数、主键集合与内容摘要快照（内容摘要对非 `PASSWORD` 列做 `NVL` 包裹后 `ora_hash`，主键约束从数据字典复核）。
- 前后快照**完全一致**（`db/01`、`db/02`，结论见 `db/03`）：`database_write_status=ZERO`。
- 请求路径 SQL 分类审计（`db/04`）：代码层仅 `@GetMapping("/list")`，写映射 `0`，3 个 `@Select` 只读 Mapper；运行期日志写动词行 `0`、`select` 行 `475`。后台统计调度器对**其他表**的既有写入单独审计，与本 Feature 三表与请求路径分离，不混同为“页面写入”。
- 上述证据**未记录**数据库地址、用户名、密码或完整连接串（`git/04-credential-scan.txt` 复核）。

---

## 7. 文档状态同步（§15）

- `ACCEPTANCE.md` §4.23 中 `DSS-AC-108~113` 状态列由 `NOT_RUN` 全部改为 **`PASS`**；`DSS-AC-001~107` 保持 `PASS`，业务行不改。
- 8 份入口文档（`docs/features/README.md`、Feature `README.md`、`REQUIREMENTS.md`、`ACCEPTANCE.md`、`DESIGN.md`、`UI.md`、`API.md`、`DATABASE.md`）当前状态/统计/下一入口更新为：
  - `action_button_loading_visual_stability_acceptance_status=EXECUTED_PENDING_CHATGPT_REVIEW`
  - `action_button_loading_visual_stability_acceptance_execution_status=PASS`
  - `action_button_loading_visual_stability_acceptance_pass_count=6`
  - `action_button_loading_visual_stability_acceptance_fail_count=0`
  - `action_button_loading_visual_stability_acceptance_blocked_count=0`
  - `action_button_loading_visual_stability_acceptance_not_run_count=0`
  - `formal_acceptance_pass_count=113`、`formal_acceptance_fail_count=0`、`formal_acceptance_blocked_count=0`、`formal_acceptance_not_run_count=0`
  - `action_button_loading_visual_stability_implementation_status=IMPLEMENTED_ADJUSTMENT_PENDING_FINAL_ACCEPTANCE`
  - 统一下一入口：`CHATGPT_ACTION_BUTTON_LOADING_VISUAL_STABILITY_FORMAL_ACCEPTANCE_REVIEW_FROM_GIT_THEN_PROJECT_OWNER_FINAL_ACCEPTANCE_DECISION`
- **不写** `ACCEPTED` / `IMPLEMENTED_ACCEPTED`；原直接值均以 `（**历史（…）**：…）` 方式保留，历史记录只追加、不删除、不改写。
- 每份文档追加**一条**正式验收执行记录；`DESIGN.md` 新增 `## 36.`、`UI.md` 新增 `## 30.` 小节。

---

## 8. 冻结边界与 Git 证明

- **路径级零差异**（`git/02-frozen-boundary-audit.txt`）：`frontend/`、`backend/` 相对基点提交改动文件数 `0`；`reports/`、`evidence/` 下**既有**受控文件改动 `0`（新证据目录本身为新增未跟踪目录）；非 `docs/` 改动文件 `0`（SQL/配置/依赖/测试代码全部位于 `frontend/`、`backend/` 内）。
- **命名冻结区摘要哈希**：`DESIGN.md` §14（含 §14.2/§14.3 映射）与 §31 业务规则、`UI.md` §9 映射与 §25 业务规则、`API.md` §9 映射、`DATABASE.md` §14 映射：
  - `DESIGN.md` §14、`UI.md` §9、`API.md` §9、`DATABASE.md` §14：基点与工作区摘要**完全一致**；
  - `DESIGN.md` §31、`UI.md` §25：仅在剥离 `- **状态与边界**` 状态行后摘要**完全一致**，即**业务规则正文零差异**（该状态行属于验收状态陈述，不属于业务规则）。
- **逐行变更审计**：全部变更文件中，含内容的变更行**全部**落在允许标记内（验收状态/统计/下一入口、`DSS-AC-10x/11x` 状态单元格、`DESIGN` §31 / `UI` §25 状态行、收口记录历史限定语、追加记录）；**未解释变更行 = `0`**。
- **计数完整性**：`DSS-AC-001~113` 共 113 条、连续唯一、全部 `PASS`，与基点相比**仅** `108~113` 状态列变化；`DSS-AC-001~107` 仍全 `PASS`。`DSS-REQ-001~089` 共 89 条、连续唯一、业务行零变化。
- **`git diff --check`**（`git/03-diff-check.txt`）：工作区退出码 `0`；索引退出码 `0`（提交前索引为空）；8 份入口文档无行尾空白/CRLF。
- **行尾空白规范化**（`git/05-whitespace-normalization.txt`）：新增证据中 `service/01`（2 行）、`service/02`（1 行）、`service/backend.log`（496 行）存在行尾空白，已做**仅删除行尾不可见填充**的信息保留式规范化，可见内容逐字节不变；二进制截图未触碰；规范化后新增证据文本文件行尾空白命中 `0`。该处理满足 §18“提交前处理行尾空白、保证 `git diff --check`/`git diff --cached --check` 真实退出 `0`”。
- **凭据扫描**（`git/04-credential-scan.txt`）：新增证据与报告未出现密码、Token、Cookie、Authorization、私钥、完整连接串、开发库地址或端口；仅出现两处**非机密**的 `password` 字样（数据库列名与“未记录连接信息”的说明句）。

---

## 9. 复现与后续

- 页面验收入口：`http://192.168.174.70:5173/monitor/data-source-state`；后端：`http://192.168.174.70:8080`。
- 停止服务：`kill 19652 19585`（详情见 `service/08-service-control-record.txt`）。
- 证据索引与逐条判定：`evidence/DATA-SOURCE-SNAPSHOT-STATUS-ACTION-BUTTON-LOADING-VISUAL-STABILITY-FORMAL-ACCEPTANCE-001/EVIDENCE-INDEX.txt`。
- 下一入口：`CHATGPT_ACTION_BUTTON_LOADING_VISUAL_STABILITY_FORMAL_ACCEPTANCE_REVIEW_FROM_GIT_THEN_PROJECT_OWNER_FINAL_ACCEPTANCE_DECISION`（先由 ChatGPT 从远程 Git 复审本轮正式验收结果，再由项目负责人作最终接受决定）。

---

## 10. R1 定向纠正（2026-09-15，`DATA-SOURCE-SNAPSHOT-STATUS-ACTION-BUTTON-LOADING-VISUAL-STABILITY-FORMAL-ACCEPTANCE-001-R1`；**本节为追加，上文 §1～§9 零字节改动**）

> 本节由纯文档与证据事实一致性纠正任务 `DATA-SOURCE-SNAPSHOT-STATUS-ACTION-BUTTON-LOADING-VISUAL-STABILITY-FORMAL-ACCEPTANCE-001-R1`（基点提交 `eeafac6fb1030615bb17f21f35da9f2043597903`）**追加**，用于纠正本报告上文的**证据事实表述错误**，并同步当前 ZooKeeper 环境分层口径与当前下一入口。**本节不改变 R0 的任何实质结论**：`DSS-AC-108~113` 六条仍为 `PASS`，机器断言 `294` 项通过、失败 `0`、判定模块真实退出码 `0`，四档视口几何严格 `0px`、按钮宽度恒为 `62px`/`110px`，数据库只读零写入，代码/契约/追踪零差异。上文 §1～§9 的**任何字节均未删除或改写**：追加前基点文件 `sha256=2cd0955da04412f5eaccbc4df1d413b078e79c61eb0a57857b1836304eee863a`（`17900` 字节），追加后该文件仍以其为**完整前缀**（逐字节前缀比对 `cmp -n 17900` 退出 `0`，证明见 R1 证据 `evidence/DATA-SOURCE-SNAPSHOT-STATUS-ACTION-BUTTON-LOADING-VISUAL-STABILITY-FORMAL-ACCEPTANCE-001-R1/git/05-r0-report-append-only-proof.txt`）。

### 10.1 纠正一：负向自测的**退出码**事实（上文 §4 第 5 条）

- **上文错误表述**：§4 第 5 条写“断言模块报出**未舍入实测量**（`0.0009999999999976694` / `0.0010000000000047748`）并以**非零退出码**结束”。该“非零退出码”表述是**证据事实错误**，必须按下列事实理解。
- **事实 (1) 断言函数确实检测到变异**：R0 的判定模块 `evaluateAcceptanceResult()` 对注入的恰好 `0.001px` 位移**确实判定失败**——证据 `browser/negative-selftest.txt` 记录 `(b) +0.001px width/y in 1920x1080/MANUAL_LOADING : passed=false failures=3`，三条失败为 `refresh_btn_rect_delta.y | 1920x1080 | actual=0.0010000000000047748 expected=0`、`query_btn_rect_delta.width | 1920x1080 | actual=0.0009999999999976694 expected=0`、`query_button_actual_width_set | 1920x1080 | actual="62,62.001" expected="62"`。**“模块可证伪、无舍入掩盖、无伪通过”的结论成立**。
- **事实 (2) R0 `negative-selftest.mjs` 进程退出码实际为 `0`**：该程序的设计语义是“**成功检测出变异即自测成功**”（`browser/harness/negative-selftest.mjs` 末尾 `const ok = baseline.passed === true && afterMutation.passed === false && afterMutation.failure_count > 0` 与 `process.exit(ok ? 0 : 1)`）。因此“检测到 `0.001px` 变异”对应的是**退出码 `0`**；R0 证据 `browser/negative-selftest.txt` 中的 `SELF_TEST_EXIT_CODE=0` 与 shell 捕获的 `EXIT_CODE=0` 与该事实一致。
- **事实 (3) 原表述的性质**：上文把“**断言模块判定失败**”误写为“**自测程序进程退出码非零**”，属于**证据事实错误**（而非结论错误）。R0 验收判定本身不受影响。
- **R1 证据补强**：R1 新增**页面无关**判定 CLI `evidence/DATA-SOURCE-SNAPSHOT-STATUS-ACTION-BUTTON-LOADING-VISUAL-STABILITY-FORMAL-ACCEPTANCE-001-R1/browser/harness/assert-result.mjs`，**复用 R0 同一** `evaluateAcceptanceResult()`（不复制、不改写判定逻辑），以**真实子进程退出码**给出可被 shell 直接证明的失败路径：对 R0 原始 `browser/acceptance-matrix.json` 真实退出码 `0`（`passed=true`、失败 `0`）；对仅注入恰好 `0.001px` 的负向控制副本真实退出码 `1`，并打印**未舍入**非零差值与失败字段。命令、stdout、stderr 与 shell 捕获退出码见 `…-R1/browser/original-result-assertion.txt`、`…-R1/browser/negative-control-assertion.txt`、`…-R1/browser/negative-control-injection-record.txt`。该负向控制副本**仅用于证明判定可失败**，**不得**作为任何 `PASS` 验收证据使用。

### 10.2 纠正二：ZooKeeper 当前环境分层口径（上文 §1）

- 上文 §1 对“后端启动期存在与本 Feature **无关**的 ZooKeeper 连接背景日志（曾建立到 `10.19.16.111:2181` 的会话，随后超时/重连）”的**事实描述本身准确**；本次纠正的是**分层口径**，统一为：`zookeeper_environment_status=AVAILABLE`（**项目负责人提供的当前环境事实**；本 R1 任务**未**主动连接、访问或验证 ZooKeeper）、`background_backend_zookeeper_session_status=OBSERVED_SESSION_ESTABLISHED_THEN_TIMEOUT_OR_RECONNECT`、`formal_acceptance_task_initiated_zookeeper_node_operation_status=NONE`、`zookeeper_write_status=NOT_REQUESTED`、`feature_zookeeper_dependency=NONE`。
- 三层必须分开读：**环境可用性** / **后端后台组件既有会话行为** / **本 Feature 的依赖与写操作**；不得再用裸的、不区分层级的 `zookeeper_access_status=NONE` 式表述。

### 10.3 当前下一入口（R1 之后）

- 上文 §9 的 R0 下一入口 `CHATGPT_ACTION_BUTTON_LOADING_VISUAL_STABILITY_FORMAL_ACCEPTANCE_REVIEW_FROM_GIT_THEN_PROJECT_OWNER_FINAL_ACCEPTANCE_DECISION` 作为 **2026-09-14 R0 正式验收提交后的历史入口**保留。
- 当前统一下一入口为 `CHATGPT_ACTION_BUTTON_LOADING_VISUAL_STABILITY_FORMAL_ACCEPTANCE_R1_REVIEW_FROM_GIT_THEN_PROJECT_OWNER_FINAL_ACCEPTANCE_DECISION`：先由 ChatGPT 从远程 Git 复审 R1 纠正结果，再由项目负责人作出最终接受决定。
- 本轮**尚未最终接受**：不写 `ACCEPTED`/`IMPLEMENTED_ACCEPTED`/`COMPLETED`，`action_button_loading_visual_stability_acceptance_status=EXECUTED_PENDING_CHATGPT_REVIEW` 保持不变。
- R1 报告：`reports/DATA-SOURCE-SNAPSHOT-STATUS-ACTION-BUTTON-LOADING-VISUAL-STABILITY-FORMAL-ACCEPTANCE-001-R1.md`；R1 证据：`evidence/DATA-SOURCE-SNAPSHOT-STATUS-ACTION-BUTTON-LOADING-VISUAL-STABILITY-FORMAL-ACCEPTANCE-001-R1/`。
