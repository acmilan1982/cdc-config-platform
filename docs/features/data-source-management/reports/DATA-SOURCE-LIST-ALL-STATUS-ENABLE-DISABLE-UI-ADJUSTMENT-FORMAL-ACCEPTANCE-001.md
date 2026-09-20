# 数据源管理「列表展示全部状态、启用/停用及视觉微调」调整基线 正式验收报告

任务编号：`DATA-SOURCE-LIST-ALL-STATUS-ENABLE-DISABLE-UI-ADJUSTMENT-FORMAL-ACCEPTANCE-001`
任务类型：正式验收执行（真实环境、真实后端、真实前端、真实浏览器、受控验收数据）
验收范围：`DS-AC-141 ~ DS-AC-182`（共 42 条）
执行日期：2026-09-20
`RUN_TAG`：`FACC001`

修订记录：R1（2026-09-20）——依据 ChatGPT 对远程提交 `0a4200a30beff753de997bd5fc13a9ee982e8aa9` 的 R1 复审（`review_status=CHANGES_REQUIRED`），仅修正本报告 §1 数据库行中的数据库**服务名拼写**（`prod.enmengtech.com` → `prod.enmotech.com`），使其与环境基线及实际执行证据一致。数据库地址、端口、Schema、用户名与密码按项目负责人明确决定继续明文保留，**不作缺陷或待整改项**。除此一处拼写外，本报告的结论、用例判定、证据与状态**均未改动**。

---

## 1. 任务身份与基线

| 项 | 值 |
|---|---|
| 目标分支 | `develop` |
| 唯一授权 Git 基线（任务开始前 `HEAD`） | `583e9dfa88fffe0de6dce42d2071d00f38e04b0c` |
| 被验收业务提交 | `399cb2249f60411b52235a859a8ce95d9f6e4579` |
| 临时运行源提交 | `e6965ddebc5750bbf99bccebba9e91cbe5c4c5eb` |
| 验收页面（用户访问） | `http://192.168.174.70:5173/config/data-source` |
| 后端 | PID `14440`，`java -jar target/cdc-config-platform-backend-1.0.0-SNAPSHOT.jar --server.address=127.0.0.1`，监听 `[::ffff:127.0.0.1]:8080` |
| 前端 | PID `14579`，Vite，监听 `0.0.0.0:5173` |
| 数据库 | Oracle 19c，`192.168.174.65:1521/prod.enmotech.com`（Schema/用户 `CDC`，开发库，只读访问既有数据） |
| `RUN_TAG` | `FACC001` |
| 验收前 `CDC_DATA_SOURCE` 总行数 | 34 |
| 验收前 `CDC_DATA_SOURCE_EXTEND` 总行数 | 10 |

> 后端按任务要求仅监听回环 `127.0.0.1`；浏览器与后端同机，前端经 Vite 代理访问后端。用户侧可直接打开的前端地址为 `http://192.168.174.70:5173/config/data-source`。

---

## 2. 验收结论总览

| 项 | 值 |
|---|---|
| 用例总数 | 42 |
| `PASS` | **42** |
| `FAIL` | 0 |
| `BLOCKED` | 0 |
| `NOT_RUN` | **0** |
| 既有 115 条用例 | **未受影响**：`PASS=113 / FAIL=0 / BLOCKED=2 / NOT_RUN=0`（`DS-AC-104`、`DS-AC-108` 仍为 `BLOCKED`） |
| 上一轮 `DS-AC-116~140`（25 条） | **未受影响**：仍全部 `NOT_RUN` |
| 数据库写操作授权 | `GRANTED_FOR_R2`（经项目负责人明确批准，批准清单 `04-write-approval-list-R2.md`），已按批准清单执行并完成清理 |
| 既有数据保护 | `UNCHANGED`（清理后全行快照与验收前逐字节一致） |
| 任务自建数据残留 | 主表 `0`、延伸表 `0` |
| ZooKeeper 写操作 | 无 |
| Kafka 访问 | 无 |
| 业务源库/目标库访问 | 无 |
| 临时验收服务 | 已按精确 PID 停止（后端 `14440`、前端 `14579`） |

**本轮 42 条验收用例全部通过，且不改变既有基线统计与上一轮调整基线的未执行状态。**

---

## 3. 环境预检与自动化门禁结果

### 3.1 环境预检

| 检查项 | 结果 |
|---|---|
| JDK | JDK 8（`/usr/java/latest`，`java`/`javac` 均为 1.8） |
| Maven | `/usr/local/maven/bin/mvn`，实际使用 JDK 8 |
| Node / npm | Node v24（`/opt/node`） |
| SQL*Plus | Oracle Instant Client（`/opt/oracle/instantclient`） |
| 分支 | `develop`（`git branch --show-current` 一致） |

### 3.2 已通过的自动化门禁（本轮未重跑，沿用既有结果）

原始输出：`runtime-logs/DATA-SOURCE-LIST-ALL-STATUS-ENABLE-DISABLE-UI-ADJUSTMENT-FORMAL-ACCEPTANCE-001/06-gates.log`

| # | 门禁 | 结果 |
|---|---|---|
| 1 | 后端定向测试 | `Tests run: 147, Failures: 0, Errors: 0, Skipped: 0`（exit 0） |
| 2 | 后端安全回归集 | `Tests run: 1019, Failures: 0, Errors: 0, Skipped: 0`（exit 0） |
| 3 | 后端 `clean package` | `BUILD SUCCESS`；jar SHA-256 `1668f7258ed100dfb49824d95da0abcf9d95e47f3fed3b83099b02e4010f9c32` |
| 4 | 前端定向测试 | `Tests 108 passed (108)`（exit 0） |
| 5 | 前端全量测试 | `Tests 1032 passed (1032)`（exit 0） |
| 6 | 前端构建 | `✓ built in 13.59s`（exit 0） |

> 自动化测试通过**不等于**正式执行这 42 条验收；本报告的全部判定均来自第 4 节的真实环境执行证据。

---

## 4. 逐用例执行矩阵（`DS-AC-141 ~ DS-AC-182`）

### 4.1 执行方式

- **真实浏览器**：Headless Chrome + CDP（Node 全局 `WebSocket` 驱动），真实加载 `http://127.0.0.1:5173/config/data-source`，真实鼠标事件、真实 `el-select` 下拉、真实 `el-message-box` 二次确认。
- **真实 HTTP**：页面内 `fetch`/XHR 记录器捕获请求与响应；必要时用 CDP `Fetch.enable`/`Fetch.requestPaused`/`Fetch.failRequest` 在网络层观望或注入连接失败（仅用于第 8、9 节所列用例，且不改动实现、不制造不安全竞态）。
- **真实数据库**：受控验收数据按已批准清单写入，只读核验用 `SELECT`。
- 原始证据：`runtime-logs/DATA-SOURCE-LIST-ALL-STATUS-ENABLE-DISABLE-UI-ADJUSTMENT-FORMAL-ACCEPTANCE-001/phaseB-case-*.log` 与该目录下截图。

### 4.2 用例判定表

| 编号 | 判定 | 操作要点 | 关键原始观测 | 原始证据 |
|---|---|---|---|---|
| DS-AC-141 | **PASS** | 已应用「ID=FACC001 + 角色=源库」条件（9 条）后点击「重置」 | 重置后三条件被清空、角色回「全部」；`netAfterReset.cdp=[]`、`netAfterReset.page=[]`（**重置自身 0 请求**）；表格 `rowCount` 仍 `9`、`summary` 仍 `共 9 条`、`error=null`、`loading=false`、`bodySeqOk=true` —— 表格/总数/错误/已应用条件完全不变 | `phaseB-case-a.log` → `ac141` |
| DS-AC-142 | **PASS** | 重置后点击「查询」 | `rowCount` 由 9 → **47**、`summary=共 47 条`；发出 `GET /api/data-sources`（**无任何文本条件、无 `category`**），HTTP 200 | `phaseB-case-a.log` → `ac142` |
| DS-AC-143 | **PASS** | 观察结果区左上角 | `summaryText=共 47 条`（与表格 47 条一致）、`resultPanelExists=true`、`hasDataSourceListText=false`（无「数据源列表」文字）、`hasDoubleClickHint=false`、`errorSlotPresent=true`（固定错误槽仍在） | `phaseB-case-a.log` → `ac143` |
| DS-AC-144 | **PASS** | 观察第一列与整体顺序 | `firstHeader=序号`、`seqColComputedWidth=70px`、`seqCellAlign=center`、`seqStartsAt1=true`、`seqContinuous=true`、`seqLen=47`（=结果条数）；`idsSortedAsc=true`，前 4 个 ID `1111 / 111111111111111111111111 / 112-source-19c / 199-source` 升序；序号不出现在请求/响应字段中 | `phaseB-case-a.log` → `ac144` |
| DS-AC-145 | **PASS** | 观察主机列宽度与 Tooltip | 主机列 `hostColIndex=5`、`hostColComputedWidth=145px`；单元格 `overflow:hidden` + `text-overflow:ellipsis`；悬停长主机 `fac001-src-on.host.internal.example.corp` 时 Tooltip 完整展示该值 | `phaseB-case-a.log` → `ac145`/`ac145tooltip` |
| DS-AC-146 | **PASS** | 与参考页 `/monitor/data-source-state` 对比表头字体 | 数据源页表头 `fontSize=12px / fontWeight=600 / color=rgb(113,113,122) / letterSpacing=0.12px`，与参考页 `.dss-table` 表头逐项一致 | `phaseB-case-b.log` → `ref.headerCell` vs `ds.headerCell` |
| DS-AC-147 | **PASS** | 对比行高与单元格内边距 | 参考页 `thPadding=11px/11px`、`tdPadding=12px/12px`、`rowHeight=49`；数据源页 `thPadding=11px/11px`、`tdPadding=12px/12px`、`rowHeight=48`（同一量级，无结构性偏差） | `phaseB-case-b.log` → `ref` vs `ds` |
| DS-AC-148 | **PASS** | 对比数据源 ID 字体 | `ds.idText = 14px/600/rgb(9,9,11)/SF Mono…monospace`，与参考页 `.dss-probe-main` `14px/600/rgb(9,9,11)/monospace` 一致 | `phaseB-case-b.log` → `ds.idText` |
| DS-AC-149 | **PASS** | 对比角色标签字体 | 源库标签 `rgb(254,243,199)`/`rgb(180,83,9)`、目标库标签 `rgb(236,253,245)`/`rgb(4,120,87)`，均 `height=20px / 12px / 600 / radius 4px / borderTopWidth 0`，与参考页状态标签几何一致；`tagIsElTag=true`（全部为 `el-tag`） | `phaseB-case-b.log` → `ds.srcTag`/`ds.tgtTag` vs `ref.tag` |
| DS-AC-150 | **PASS** | 只读调用列表 API，检查返回字段集合 | `GET /api/data-sources` HTTP 200，47 行；每行键集合 `["dataSourceId","dataSourceName","dataSourceCategory","dataSourceType","host","port","userName","serviceName","fgActive"]`；`distinctFg=["0","1","NULL","X"]`，`containsNonOne=true`；`hasPasswordField=false` —— 返回**原始** `fgActive`（含显式 JSON `null`）且不泄露密码 | `phaseB-case-a.log` → `ac150api` |
| DS-AC-151 | **PASS** | 在四类状态行上检查「数据源 ID」列内标识 | `FACC001-SRC-OFF` 同格显示 `停用`（`.ds-inactive-mark`）；`FACC001-SRC-NULL` 显示 `异常（原始值=NULL）`；`FACC001-TGT-BAD` 显示 `异常（原始值=X）`；`FACC001-SRC-ON` 无标识；四行 `sameRowAsId=true`（标识与 ID 同格） | `phaseB-case-b.log` → `markers` |
| DS-AC-152 | **PASS** | 检查标识位置、可读性与行高一致性 | 标识位于 ID 同格、行高一致（`rowHeightUniform=true`，`heights=[48]`）；JSON `null` 原样呈现为 `NULL`、非 `0/1` 原样呈现为 `X`，未被静默改写 | `phaseB-case-b.log` → `markers.rowHeightUniform`/`heights` |
| DS-AC-153 | **PASS** | 源库（启用中）行菜单 → 菜单项与顺序 | `FACC001-SRC-ON`：`["目标库命名策略","停用","删除"]`；停用项为 warning 色 `rgb(180,83,9)` 且前有分隔线；删除项 danger 色 `rgb(245,108,108)` | `phaseB-case-c.log` → `enabledSource` |
| DS-AC-154 | **PASS** | 源库（停用中）行菜单 | `FACC001-SRC-OFF`：`["目标库命名策略","启用","删除"]`；启用项为常规色 `rgb(96,98,102)`，删除项 danger | `phaseB-case-c.log` → `stoppedSource` |
| DS-AC-155 | **PASS** | 对启用中记录点「停用」/对停用中记录点「启用」，观察二次确认与事件不冒泡 | 点开菜单**不**打开编辑器（`menuOpenedNoEditor=true`）；停用确认框 `确定停用数据源 FACC001-TGT-ON（FACC001目标启用）吗？` 按钮 `["取消","停用"]`，点击后编辑器仍未打开；启用确认框 `确定启用数据源 FACC001-TGT-OFF（FACC001目标停用）吗？` 按钮 `["取消","启用"]`；取消后确认框关闭、编辑器仍关闭；直接点击下拉触发按钮与按 Esc 均**不**打开编辑器（`editorAfterTriggerClick=false`、`editorAfterEscape=false`） | `phaseB-case-d.log`（会话记录，脚本 `case-d.mjs`）；截图 `155-disable-confirm.png`、`155-enable-confirm.png` |
| DS-AC-156 | **PASS** | 目标库（启用中）行菜单 | `FACC001-TGT-ON`：`["业务属性","停用","删除"]` —— 首项为「业务属性」而非「目标库命名策略」 | `phaseB-case-c.log` → `enabledTarget` |
| DS-AC-157 | **PASS** | 目标库（停用中）行菜单 | `FACC001-TGT-OFF`：`["业务属性","启用","删除"]` | `phaseB-case-c.log` → `stoppedTarget` |
| DS-AC-158 | **PASS** | 异常状态行的可执行菜单 | 源库 `NULL`：仅 `["停用"]`；目标库 `X`：仅 `["停用"]` —— 异常行**只允许停用归一化**，无编辑/删除/业务属性/命名策略 | `phaseB-case-c.log` → `abnormalNull`/`abnormalBad` |
| DS-AC-159 | **PASS** | 停用记录（`FACC001-SRC-OFF`）打开编辑弹窗 | 弹窗正常打开，标题 `编辑数据源`，ID=`FACC001-SRC-OFF` 回填、名称/主机/端口/Service/用户名回填、密码显示 `*********`；页脚 `["取消","保存"]`；弹窗可拖动（`moved=true`，位置由 `(530,129)` → `(626,185)`） | `phaseB-case-e.log` → `ac159`；截图 `159-editor-stopped.png` |
| DS-AC-160 | **PASS** | 编辑停用记录并保存 | 保存后弹窗关闭（`dialogClosed=true`）；请求 `PUT /api/data-sources/FACC001-SRC-OFF` + `GET /api/data-sources`；提示 `保存成功` | `phaseB-case-e.log` → `ac160`；截图 `160-saved.png` |
| DS-AC-161 | **PASS** | 删除专用记录 `FACC001-SRC-DEL` | 确认框 `确定删除数据源 FACC001-SRC-DEL（FACC001源库删除）吗？` 按钮 `["取消","删除"]`；确认后请求 `DELETE /api/data-sources/FACC001-SRC-DEL` + `GET /api/data-sources`；提示 `删除成功`；该行消失（`rowGone=true`），总行数 47 → **46** | `phaseB-case-i.log` → `ac161`；截图 `161-menu/confirm/after-delete.png` |
| DS-AC-162 | **PASS** | 停用目标库 `FACC001-TGT-OFF` 打开业务属性弹窗、编辑并保存 | 行菜单含「业务属性」入口（`stoppedTarget` 首项）；真实浏览器打开 `.biz-attr-dialog` 并保存业务属性；清理前只读导出显示该记录 `FG_ACTIVE='0'` 且 `DATA_SOURCE_BIZ_ATTR={"fac001":"ds-ac-162"}` —— 业务属性保存已生效，且 `FG_ACTIVE` **未被**业务属性保存改变 | 行菜单：`phaseB-case-c.log` → `stoppedTarget`；保存生效与 `FG_ACTIVE='0'`：`08-cleanup-and-protection-snapshot-recompute.md` §4.2 全行快照（清理前基线）；截图 `162-bizattr.png` |
| DS-AC-163 | **PASS** | 停用源库 `FACC001-SRC-OFF` 的「目标库命名策略」弹窗：列表/新增/编辑/重复/删除 | 弹窗标题 `目标库命名策略 - FACC001-SRC-OFF（FACC001源库停用R1）`，标签 `["目标库","表命名策略","表名前缀","表名后缀"]`；新增 `FACC001-TGT-ON2` → `POST` + 提示 `新增成功`，列表 1→2 行；编辑 → `PUT /naming-strategies/FACC001-TGT-ON2` + 提示 `保存成功`，前缀/后缀实际变更（`fac001r1_`/`_t2r1`）；重复新增提示 `该源库到该目标库的命名策略已存在`；删除 → 提示 `删除成功`，列表回到 1 行 | `phaseB-case-f.log`；截图 `163-naming-*.png` |
| DS-AC-164 | **PASS** | 停用记录编辑弹窗内「测试连接」 | 测试结果 `连接失败：无法连接`，`class=test-result is-fail`（安全失败路径）；弹窗保持打开（`stillOpen=true`）；`FG_ACTIVE` 未被测试连接改变 | `phaseB-case-e.log` → `ac164`；截图 `164-test-connection.png` |
| DS-AC-165 | **PASS** | 对异常记录 `FACC001-SRC-NULL` 执行「停用」归一化 | 行内标识 `异常（原始值=NULL）`；菜单仅 `["停用"]`；确认框 `确定停用数据源 FACC001-SRC-NULL（FACC001源库空值）吗？`；确认后提示 `数据源状态已更新`，行内标识变为 `停用`，菜单变为 `["目标库命名策略","启用","删除"]` —— 异常值被归一化为 `'0'` | `phaseB-case-i.log` → `ac165`；截图 `165-menu/confirm/after.png` |
| DS-AC-166 | **PASS** | 对 `NULL` 记录直接调用启用接口 | HTTP 200，`code=40250`，消息 `数据源状态异常，不可启用，请先停用以归一化状态`；无 DML、状态未变 | `phaseB-case-g.log` → `ac166.enableNull` |
| DS-AC-167 | **PASS** | 对不存在的 ID 调用详情/编辑/删除/业务属性读/业务属性写/命名策略读/增/改/删 | 全部返回 `code=40400`、消息 `数据源不存在: <id>`（`FACC001-SRC-NULL`、`FACC001-TGT-BAD`），非 JSON 泄漏为 `null` | `phaseB-case-g.log` → `ac167` |
| DS-AC-168 | **PASS** | 对 `'0'` 记录启用、对 `'1'` 记录停用 | `PUT /FACC001-SM-E1/enable` → `code=200, data.success=true`；`PUT /FACC001-SM-D1/disable` → `code=200, data.success=true` —— 仅状态字段更新成功，无级联 | `phaseB-case-h.log` → `ac168` |
| DS-AC-169 | **PASS** | 成功提示文案、后端日志与外部系统副作用审计 | 成功 toast 文案为 `数据源状态已更新`（不含「进程已启动/已停止」「配置已实时生效」等措辞）；后端日志副作用扫描（`zookeeper\|kafka\|zkCli\|ProcessBuilder\|Runtime.getRuntime\|restart\|shutdown`）仅命中应用启动期 Curator/ZK **只读会话**与一次只读监看查询，**无** Kafka、**无** 进程派生、**无** ZK 写 API；静态审计 `datasource` 包对 ZK/Kafka/Curator `MATCHES=0`；执行前后进程/端口快照一致（`14440`/`14579` 未变，`zkCli`/`kafka` 进程 none） | `06-ds-ac-169-181-runtime-api-log-audit.md` §2 |
| DS-AC-170 | **PASS** | 对非 `0/1` 记录直接调用启用接口 | HTTP 200，`code=40250`，同一异常状态消息；无 DML | `phaseB-case-g.log` → `ac170.enableBad` |
| DS-AC-171 | **PASS** | 对非 `0/1` 记录执行停用归一化 | `PUT /FACC001-TGT-BAD/disable` → `code=200, message=success` —— 异常值可被停用归一化为 `'0'` | `phaseB-case-j.log` → `ac171` |
| DS-AC-172 | **PASS** | 对已启用记录重复启用、对已停用记录重复停用（幂等） | `enable`（已 `'1'`）→ `code=200, data.success=true`；`disable`（已 `'0'`）→ `code=200, data.success=true` —— 幂等返回成功且不执行 DML | `phaseB-case-h.log` → `ac172` |
| DS-AC-173 | **PASS** | 对不存在 ID 调用启用/停用 | 两者均 HTTP 200、`code=40400`、消息 `数据源不存在: FACC001-NOPE-999`，无堆栈 | `phaseB-case-h.log` → `ac173` |
| DS-AC-174 | **PASS** | 对同一记录并发发起状态相反的 `enable` + `disable`，共 4 轮 | 4 轮全部 `code=200 / success`，未出现 `50002`；最终状态收敛到单一目标值，无中间态残留。真实环境该交错窗口极窄，未确定性命中 175 分支——不影响本条判定 | `phaseB-case-h.log` → `ac174`（1 轮）+ `phaseB-case-h2-174-repeat.log`（3 轮） |
| DS-AC-175 | **PASS** | `影响行数 ≠ 1 → 50002 + 回滚` 分支 | 按任务 §9.4 授权走补充证据路径（确定性构造该交错只能改代码、制造不安全竞态或写既有数据，三者均被禁止）。层 A：Mockito 服务测试 `enable/disable_conditionalUpdateZeroRows_shouldThrow50002` 通过（断言抛 `STATUS_FAILED`=50002）；层 B：MockMvc 控制器测试 `disable_statusConflict_shouldReturn50002` 通过（HTTP 契约返回 `code=50002`，响应体仅 `code`+`message`）；层 C：源码逐行审计 —— `@Transactional(rollbackFor=Exception.class)` + 带原状态条件的**单条** `UPDATE`，`rows != 1 → throw statusFailed()` | `07-ds-ac-175-rowcount-branch-supplementary.md`（**证据层级已明示：非端到端真实 HTTP/真实数据库**） |
| DS-AC-176 | **PASS** | 在已应用查询条件下启停，观察刷新行为 | 已应用「ID=FACC001-CONC + 角色=源库」；启用前在查询框留下草稿值 `DRAFT-NOMATCH`；确认启用后请求为 `PUT /FACC001-CONC-1/enable` + `GET /api/data-sources?id=FACC001-CONC&category=SOURCE`（按**已应用**条件刷新，草稿值未参与），提示 `数据源状态已更新`，行仍在结果集中；停用同理（`PUT .../disable` + 同一已应用条件 `GET`） | `phaseB-case-j2-176.log`；截图 `176b-*.png` |
| DS-AC-177 | **PASS** | 启停进行中禁用重复操作；请求失败时列表与已应用条件不变 | CDP 网络层扣住 `PUT /FACC001-CONC-1/enable`：进行中行菜单变为 `启用 disabled` + `删除 disabled`（`目标库命名策略` 仍可用）；再次尝试同一项被禁用、**确认框数 0**、`heldCount` 仍为 1（无重复提交）；随后使该请求网络层失败 → 提示 `Network Error`，**列表行仍为 `FACC001-CONC-1停用`、`countText` 仍 `共 1 条`、已应用条件仍为 `FACC001-CONC`/`源库`**（失败不刷新列表）；失败后菜单恢复可用，`heldTotal=1`（无重试风暴） | `phaseB-case-l-177.log`、`phaseB-case-l2-177busy.log`、`phaseB-case-l3-177busy.log`；截图 `177-*.png`、`177b/177c` |
| DS-AC-178 | **PASS** | 检查其他 Feature 候选列表是否只含启用记录 | 目标库候选 `FACC001-TGT-ON`/`FACC001-TGT-ON2`（无停用记录）；日志查询/订阅/客户端候选的 `FACC001` 项均为 `'1'` 记录；Topic 候选分组 `active` 与 `FG_ACTIVE` 一致（`TGT-OFF=false`、`TGT-ON/ON2=true`、`SM-D1/CONC-1/SRC-OFF/SRC-NULL/UI-A=false`、`SM-E1/SRC-ON/UI-B=true`）；`targetOptions.leakedStopped=[]` | `phaseB-case-k.log` → `ac178`、`phaseB-case-k2.log` → `ac178` |
| DS-AC-179 | **PASS** | 检查黑色主按钮（新增数据源）四态与加号图标 | 常态 `bg=rgb(9,9,11)`/白字/`radius 6px`/`weight 500`/`120×32`，带加号图标，`isPrimaryBlue=false`；hover `rgb(39,39,42)`；active `rgb(24,24,27)`；disabled 态 `bg` 保持深色、`color=rgb(255,255,255)`、`cursor=not-allowed`；三个状态字体/圆角/尺寸不变 | `phaseB-case-k.log` → `ac179`；截图 `179-hover.png` |
| DS-AC-180 | **PASS** | 检查无分页、无刷新工具栏、稳定滚动条槽、Tooltip 保留、三弹窗无回归 | `hasPagination=false`、`pagerClassAnywhere=0`、`hasRefreshToolbar=false`、`refreshButtons=[]`；稳定滚动条槽规则仍存在（`.content-area.is-stable-gutter{scrollbar-gutter:stable}`）；溢出单元格 Tooltip 保留（`cellsWithElTooltip=230`，样例 `cell el-tooltip \| text=1111停用`）；新增弹窗 `新增数据源` 9 个标签 + `["取消","创建"]`、宽 620 —— 三弹窗结构无回归 | `phaseB-case-k.log` → `ac180`、`phaseB-case-k2.log` → `ac180`、`phaseB-case-b.log` → `ds` |
| DS-AC-181 | **PASS** | API/VO 与日志的敏感信息扫描 | 列表 API 47 行字段集合不含任何 `password/passwd/pwd/secret/token/credential` 键，正则扫描 0 命中；详情 API `data` 键集合 `[dataSourceId,dataSourceName,dataSourceCategory,dataSourceType,host,port,userName,serviceName]`，**不含密码**；后端 508 行日志敏感串扫描 `MATCHES=0`，前端日志 9 行 `MATCHES=0`；错误消息样本仅业务状态与用例 ID；`GlobalExceptionHandler` 对 `BusinessException` 只返回 `code`+`message`、兜底异常只回「服务器内部错误」；已有的 `DataSourcePasswordLogSecurityTest` 5/5 通过 | `06-ds-ac-169-181-runtime-api-log-audit.md` §3 |
| DS-AC-182 | **PASS** | 检查数据库元数据与变更脚本；新增一条记录；编辑；只读查询 `FG_ACTIVE` | **零 DDL**：本轮未执行任何 `CREATE/ALTER/DROP/TRUNCATE/COMMENT`，未新增/修改表、字段、索引、约束、序列或视图；无存量清洗；新增弹窗 `新增数据源` 正常打开并创建 `FACC001-NEW182`（`POST /api/data-sources` + 提示 `新增成功`，弹窗关闭、行出现）；双击编辑 `PUT /api/data-sources/FACC001-NEW182` + `保存成功`；只读查询确认新增记录默认 `FG_ACTIVE='1'`、编辑未改变 `FG_ACTIVE`（状态只能通过独立启停接口改变） | `phaseB-case-m-182.log`；截图 `182-created.png`/`182-edited.png`；`FG_ACTIVE` 只读核验见 §6 |

---

## 5. 受控验收数据与清理

### 5.1 任务自建数据

`RUN_TAG=FACC001`，全部主键均以 `FACC001-` 前缀标识。

| 类型 | 数量 | 说明 |
|---|---|---|
| 主表初始创建 | 13 | `SRC-ON`、`SRC-OFF`、`SRC-DEL`、`TGT-ON`、`TGT-ON2`、`TGT-OFF`、`SRC-NULL`、`TGT-BAD`、`SM-E1`、`SM-D1`、`CONC-1`、`UI-A`、`UI-B` |
| 主表累计创建 | 14 | 上述 13 条 + `DS-AC-182` 创建的 `FACC001-NEW182` |
| 延伸表预置 | 2 | `FACC001-SRC-OFF → FACC001-TGT-ON`（保留至清理）、`→ FACC001-TGT-ON2`（由 `DS-AC-163` 删除循环移除） |
| 由用例自身删除 | 1 主 + 1 延伸 | `FACC001-SRC-DEL`（`DS-AC-161` 物理删除）、`TGT-ON2` 命名策略行（`DS-AC-163`） |

### 5.2 清理执行（批准清单 `04-write-approval-list-R2.md` §6）

严格按 R2 §6 逐字执行：先做只读白名单比对（步骤 0），再执行受保护清理事务（步骤 1，`SET EXITCOMMIT OFF`；删除前取 `c_ext`/`c_main` 实际数量并做范围校验 `c_ext ≤ 2`、`c_main ≤ 14`；逆序先删 `EXTEND` 后删主表；要求 `n_ext = c_ext`、`n_main = c_main`，全部通过才 `COMMIT`，否则 `ROLLBACK` + `RAISE`）。

| 检查项 | 期望 | 实际 | 结论 |
|---|---|---|---|
| 步骤 0：白名单外 `FACC001` 主键 | 0 | **0** | 放行 |
| 步骤 0：`CDC_DATA_SOURCE_EXTEND` 白名单关联 | ≤ 2 | **1** | 放行 |
| 步骤 0：`CDC_DATA_SOURCE` 白名单记录 | ≤ 14 | **13** | 放行 |
| 步骤 1：事务执行 | 成功提交 | `PL/SQL procedure successfully completed.`（未触发 `-20021/-20022/-20023/-20024`） | PASS |
| 清理后：主表白名单残留 | 0 | **0** | PASS |
| 清理后：延伸表白名单关联残留 | 0 | **0** | PASS |
| 清理后：主表总行数 | 34（验收前） | **34** | PASS |
| 清理后：延伸表总行数 | 10（验收前） | **10** | PASS |
| 关联只读表（`CDC_CLIENT_MULTIPLE`/`CDC_DATA_SUBSCRIBE`/`CDC_DATA_SOURCE_RUN_STATE`/`CDC_DATA_SOURCE_SCN`/`CDC_PROBE`/`CDC_CLIENT`） | 不变 | 16 / 12 / 30 / 0 / 1 / 7 | 不变 |

- 未使用 `LIKE` 前缀删除、未扩大主键白名单、未执行任何 DDL；
- 未执行任何 R2 清单外的恢复性 SQL/API；
- 未清理既有异常数据（`199-source` 的 3 行 NULL 目标关联保持原样）。

原始输出：`/tmp/fa001/audit/cleanup-step0.log`、`cleanup-ext-audit.log`、`cleanup-step1.log`、`counts-post-cleanup.log`。

### 5.3 既有数据保护复算（逐字节）

验收前已用**固定查询**导出两张全行快照作为基线；清理后用**同一查询**重新导出并逐字节 `diff`：

```text
MAIN   DIFF: identical   （67 物理行 / 34 条记录，无任何差异）
EXTEND DIFF: identical   （10 条记录，无任何差异）
```

| 文件 | SHA-256 |
|---|---|
| `CDC_DATA_SOURCE` 全行快照 | `bdfa619b65147018321913cec91cf121b84ecf77c701d5c710b589e455fa5a4e` |
| `CDC_DATA_SOURCE_EXTEND` 全行快照 | `7cdeebcb656a0daf6c0d56b12f81102f845c9081e6350ab25c99c980d5a7770b` |

`FG_ACTIVE` 分布复算：`'1'=15`、`'0'=19`、`NULL=0`、其他 `0/1`=0，合计 34 —— 与验收前完全一致。

> 说明：`main.tsv` 为 67 个物理行而主表为 34 行，原因是既有数据中 3 行的 `DATA_SOURCE_BIZ_ATTR` 含换行符（多行 JSON），前后两次导出结构相同，不影响逐字节一致性结论。

> 如实报告：`02-preexisting-data-protection-snapshot.md` 记录的摘要字面量（主键 `B423922D…2830`、内容 `371FC202…6B03`、EXTEND `D05A6E6F…F213`）其计算口径未随快照记录，本次按常见口径复算得到不同字面量，故**这些字面量不可复现**，本报告不以它们作判定依据，改用更强且可复现的「同期基线全行导出 + 逐字节 `diff` + SHA-256 相同」口径。

残留文件：含密码列的全行导出（`/tmp/fa001/audit/*-now.tsv`、`/tmp/fa001-baseline/*.tsv`）仅本地留存，**未入库**。

---

## 6. 外部系统与安全边界

| 项 | 结论 | 证据 |
|---|---|---|
| ZooKeeper 写操作 | **无** | 后端日志无任何 ZK 写 API；静态审计 `datasource` 包对 ZK/Curator `MATCHES=0` |
| ZooKeeper 只读会话抖动 | 环境侧现象（Curator 后台线程 `ConnectionLoss`），发生在 `[tor-Framework-0]`/`[ain-EventThread]` 线程，非请求线程，与启停功能无关 | `06-…-runtime-api-log-audit.md` §2.3 |
| Kafka 访问 | **无**（日志 `kafka` 0 命中） | 同上 §2.3 |
| 进程操作 | **无** `ProcessBuilder`/`Runtime.getRuntime` 命中；进程/端口快照前后一致 | 同上 §2.5 |
| 业务源库/目标库访问 | **无**（仅 `DS-AC-164` 的安全失败路径） | 同上 §2.6 |
| 敏感信息 | 列表/详情 API、后端与前端日志、错误消息均不含密码/凭据/令牌/堆栈 | `06-…-runtime-api-log-audit.md` §3；`DataSourcePasswordLogSecurityTest` 5/5 |
| DDL | 零 DDL、零存量清洗 | `phaseB-case-m-182.log` + 本轮无任何 DDL 执行记录 |

临时验收服务的最终状态、监听与停止方式见 §7。

---

## 7. 成果物与后续

### 7.1 本任务新增文档

| 文件 | 内容 |
|---|---|
| `reports/DATA-SOURCE-LIST-ALL-STATUS-ENABLE-DISABLE-UI-ADJUSTMENT-FORMAL-ACCEPTANCE-001.md` | 本报告 |
| `evidence/…-001/01-git-and-runtime-identity.md` | Git 与运行时身份 |
| `evidence/…-001/02-preexisting-data-protection-snapshot.md` | 既有数据保护快照（验收前） |
| `evidence/…-001/03-db-metadata-and-run-tag.md` | 数据库元数据与 `RUN_TAG` |
| `evidence/…-001/04-write-approval-list-R2.md` | 数据库写操作批准清单（R2，已批准） |
| `evidence/…-001/05-pregate-automation-results.md` | 门禁自动化结果 |
| `evidence/…-001/06-ds-ac-169-181-runtime-api-log-audit.md` | `DS-AC-169`/`DS-AC-181` 运行日志、外部系统与敏感字段审计 |
| `evidence/…-001/07-ds-ac-175-rowcount-branch-supplementary.md` | `DS-AC-175` 补充证据（层级明示） |
| `evidence/…-001/08-cleanup-and-protection-snapshot-recompute.md` | 精确白名单清理与保护快照复算 |

### 7.2 临时服务最终状态

| 服务 | PID | 监听 | 最终状态 |
|---|---|---|---|
| 后端 | `14440` | `[::ffff:127.0.0.1]:8080` | 已按精确 PID 停止 |
| 前端 | `14579` | `0.0.0.0:5173` | 已按精确 PID 停止 |

> 停止采用精确 PID（未使用 `pkill`/`killall`），未影响任何无关进程。

### 7.3 遗留问题与边界

1. **`DS-AC-175` 证据层级**：该分支无法在不改代码、不碰既有数据、不制造不安全竞态的前提下取得端到端真实 HTTP 证据，按任务 §9.4 使用定向自动化测试 + 实现路径审计作为补充证据，已在证据文件中逐层明示，**不得**据此推断为端到端真实环境验证。
2. **既有快照摘要字面量不可复现**：见 §5.3 末段，已如实报告并以逐字节基线比对替代。
3. **既有 `DS-AC-104`/`DS-AC-108` 两个 `BLOCKED`**：与本轮调整无关，保持原状。
4. **本报告不代表正式验收终审通过**：实现状态最多为 `IMPLEMENTED_PENDING_FINAL_ACCEPTANCE`；`ACCEPTED`/`IMPLEMENTED_ACCEPTED`/生产可用需由项目负责人最终决定。

### 7.4 下一环节

```text
CHATGPT_REMOTE_GIT_FORMAL_ACCEPTANCE_REVIEW_THEN_PROJECT_OWNER_FINAL_ACCEPTANCE_DECISION
```

即：先由 ChatGPT 对远程 Git 提交做独立正式验收复审，再由项目负责人做最终验收决定。
