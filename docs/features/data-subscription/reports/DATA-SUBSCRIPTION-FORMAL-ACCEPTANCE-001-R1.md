# 数据订阅正式验收 R1 报告（DATA-SUBSCRIPTION-FORMAL-ACCEPTANCE-001-R1）

## 1. 任务元数据与基准提交

| 项目 | 值 |
|---|---|
| 任务编号 | `DATA-SUBSCRIPTION-FORMAL-ACCEPTANCE-001-R1` |
| Feature | 数据订阅（`data-subscription`） |
| 任务目标 | 回应正式验收复审（`CHANGES_REQUIRED`）：① 补齐真实浏览器覆盖，修订 `coverage-matrix.md` 不准确的 `BR` 标注；② 在干净 worktree 中重跑前端测试并记录真实计数（排除未跟踪 `frontend/src/api/subscription.spec.ts`）；重新确认 126 条验收用例状态 |
| 开发分支 | `develop` |
| 基准提交 | `49eb778cb24b4f6d26a192d5441b0476099cf68d` |
| 复审结果 | 126 条全部 `PASS`，0 `FAIL`，0 `BLOCKED`（`coverage-matrix-r1.md` 逐条复核） |
| 验收执行状态 | `acceptance_execution_status = EXECUTED_PENDING_REVIEW` |
| 实现状态 | `implementation_status = IMPLEMENTED_FORMAL_ACCEPTANCE_EXECUTED_PENDING_REVIEW`（**不写** `IMPLEMENTED_ACCEPTED`，等待 ChatGPT 正式复审） |
| R1 证据目录 | `docs/features/data-subscription/evidence/DATA-SUBSCRIPTION-FORMAL-ACCEPTANCE-001-R1/` |

## 2. 回应复审问题

### 2.1 Problem 2.1：真实浏览器覆盖缺失

- 原正式验收 R0 的 `coverage-matrix.md` 在 059/060/078~088/094~100/104/113/116~118/126 等用例标 `BR`，但 R0 浏览器证据实际仅覆盖列表/查询/详情/新增弹窗结构（`[R0]browser/browser-summary.txt`），大量标 `BR` 的交互（换源确认清空、脏关闭、Schema 懒加载/缓存/失败重试、240 表、全选/Shift/只看已选、保存禁用、删除预览/取消/确认、控制台零 error 等）没有真实浏览器场景。
- R1 以真实 Chrome headless（CDP，`/usr/bin/google-chrome`）在 `http://127.0.0.1:5173/config/subscribe`（`/api` → 后端 8080）逐场景补验，形成 **54 个浏览器场景**（§5 全段）：S1×10、S2×6、S3×13、S3 补充×3、S4-A×5、S4-B×6、S5×11。
- 每个场景记录：验收 ID、视口、前置数据、操作步骤、实际结果、请求/拦截计数、截图/DOM/控制台证据路径、真实/拦截标记。索引见 `evidence/.../R1/browser/browser-scenario-index.md`。
- 明确使用 `BROWSER_INTERCEPTED_UI_SCENARIO` 的场景（S2-3、S3-12、S3-14、S4-5~S4-8、S5-1、S5-2a、S5-4）只证明前端 UI 行为，不代表真实 Oracle 数据，已在索引与 `coverage-matrix-r1.md` 逐条标注（`BR-IC`）。
- 对确无真实浏览器场景、且原矩阵标 `BR` 的用例（如 `DSUB-AC-046` 目标异常、`DSUB-AC-087` 汇总/徽标），R1 矩阵明确纠正为 `FT + 真实 DOM/摘要观察` 支撑，不再以 `BR` 概括。R1 矩阵为当前结论，取代 R0 矩阵证据标注。

### 2.2 Problem 2.2：前端测试计数依赖未跟踪文件

- R0 前端定向“8 文件 141 用例”含未跟踪 `frontend/src/api/subscription.spec.ts`（17 用例）。
- R1 在干净 worktree（`/tmp/cdc-r1-worktree`，HEAD=`49eb778…`，不含任何主工作区未跟踪文件）重跑：
  - 定向（仅 `src/views/data-subscribe/**` 已跟踪 spec）：**7 文件 / 124 用例全 PASS**；
  - 全量：**22 文件 / 359 用例全 PASS**；
  - `npm run build`：**BUILD SUCCESS**。
- 未跟踪 `frontend/src/api/subscription.spec.ts` **未带入干净 worktree、未执行、未计数**。若已跟踪测试不足以证明某条验收，R1 使用真实 HTTP/浏览器/DB 证据补齐（见 `coverage-matrix-r1.md`），未提交、未复制、未修改该未跟踪文件。
- 记录文件：`frontend-tests/targeted-tests-clean-worktree.txt`、`full-tests-clean-worktree.txt`、`build-clean-worktree.txt`。

## 3. 执行环境与时间

- 环境：CDC 配置管理平台内网开发服务器，Linux；JDK 8（`/usr/java/latest`）；Maven（`/usr/local/maven`）；Node.js（`/opt/node`）；Oracle Instant Client（`/opt/oracle/instantclient`）；浏览器 `/usr/bin/google-chrome`（headless，Node v24 + CDP）。
- 执行时间：2026-09-02。
- 环境预检：`git`、`claude`、`node`、`npm`、`sqlplus` 通过；`locale` 正常。
- 后端服务：dev 配置监听 `0.0.0.0:8080`（复用）；前端 Vite dev 监听 `0.0.0.0:5173`，代理 `/api` → `127.0.0.1:8080`，页面入口 `http://127.0.0.1:5173/config/subscribe`。
- 数据库：内网开发库 Oracle 19c（`CDC` schema，`192.168.174.65:1521`）。
- 真实源库：`112-source-19c`（孝感市第一人民医院，category=source，fg_active=1）；Schema 元数据只读。

## 4. Git 初始状态与无关现场保护

任务开始前执行 `git status --short`、`git branch --show-current`、`git rev-parse HEAD`，确认：

- 当前分支为 `develop`；
- 基准提交为 `49eb778cb24b4f6d26a192d5441b0476099cf68d`；
- 工作区任务开始前已有无关修改保持原样，不修改、不暂存、不提交：`.claude/settings.local.json`、`agent-env.sh`、已删除的 `docs/database/TASK3*/TASK4*`、`frontend/index.html`、`frontend/src/config/menu.ts`、`frontend/src/layouts/HeaderBar.vue`/`MainLayout.vue`/`Sidebar.vue`、`frontend/src/stores/app.ts`、`frontend/src/styles/global.css`，以及未跟踪 `docs/agent-prompts/**`、`docs/baseline-work/**`、`docs/prompts/**`、`frontend/src/api/subscription.spec.ts` 等。
- R1 仅新增/修改允许范围内的文件（见 §10）。

## 5. 数据准备（授权 DML）

- 数据库写操作（临时目标库 `R1TGT01`/`R1TGT.DOT`、`CDC_DATA_SUBSCRIBE` 6 条 R1 种子、浏览器 e2e 流程写入、备份恢复、临时目标清理）已在人工明确审批范围内执行（`database/dml-execution-r1.txt`）。
- 前置只读核验（`database/precheck-r1.txt`）：备份表 `CDC_DATA_SUBSCRIBE_2026_08_31` 12 行、当前 12 行、双向主键/非 CLOB MINUS=0、CLOB 不一致 0、R1 残留 0（DML 前）。
- 为浏览器场景构造种子：`R1ACNORMAL01`（3 表 3 目标）、`R1ACNORMAL02`（多 Schema）、`R1ACUNPARSE01`（无法解析历史）、`R1ACINACTIVE01`（源已停用 199-source）、`R1ACNOTFOUND01`（源不存在）、`R1ACANOMALY01`（多源异常）；临时目标库 `R1TGT01`/`R1TGT.DOT`（无需真实连接）。

## 6. R1 真实浏览器补验摘要（54 场景）

覆盖与结果（详见 `browser/browser-scenario-index.md` 与 `browser/s1..s5-scenarios.json`）：

- **§5.1 列表与查询（S1-1~S1-10，真实）**：挂载自动空条件查询；两多选下拉与组内 OR/组间 AND 请求参数；点击查询才请求、重置不请求；空状态文案；源表“共 N 张”/目标“+N”悬停；多源异常行警示与操作按钮=0；已停用/不存在源标记。
- **§5.2 详情（S2-1~S2-5，真实 + S2-3 拦截）**：查看打开详情、完整渲染、无法解析分区警告、异常行无查看入口；41 表详情内部滚动（拦截 UI，仅证前端）。
- **§5.3 新增/编辑弹窗（S3-1~S3-12，真实 + S3-12 拦截）**：共用弹窗；必填/max255；1K/2K 尺寸；标题栏拖动；脏关闭二次确认；布局；目标卡片；可搜索下拉排序/高亮；新增与编辑换源二次确认清空（S3-13 编辑态真实：取消保留、确定清空、PUT=0）；异常记录可查看/编辑/删除但保存阻断；源库不可达有限编辑（拦截）。
- **§5.3 补充（S3-13/S3-14）**：编辑换源取消保留/确定清空不写库（真实）；已失效已选表警告 + 保存禁用 + “移除异常已选表”解除（拦截注入 invalidTables，仅证前端 UI）。
- **§5.4a Schema/表真实源小容量（S4-1~S4-4）**：真实源 `112-source-19c` Schema 懒加载与缓存命中；左 Schema 右表；表名模糊搜索；全选/取消/只看已选/清空；勾选行浅蓝。
- **§5.4b Schema/表高容量（S4-5~S4-8，拦截）**：240 表容量渲染与内部滚动；Shift/锚点 240 行边界；失败重试；切换 Schema 已选保留。
- **§5.5 保存/删除/完整闭环（S5-1~S5-9）**：40300 结构化错误回显（拦截）；保存中按钮禁用（S5-2a 拦截 + S5-2b 真实双击仅 1 次提交）；真实新增成功提示含重启说明；真实编辑回显与 PUT 持久化（S5-5）；PUT PRESERVE/REPLACE 载荷采集不写库（拦截 S5-4）；删除预览/确认完整内容（S5-6）；取消不删除（S5-7）；真实删除成功与行消失（S5-8）；**真实端到端闭环**（S5-9：新增→列表→详情→编辑→删除预览→取消→再次预览→确认删除→消失）。
- **控制台**：全部场景控制台新增 error=0（`s1..s5-console-errors.json`、`s3b-console-errors.json` 为空/0 增量）。

## 7. 干净 worktree 前端测试与构建

| 项 | 结果 |
|---|---|
| 干净 worktree 提交 | `49eb778cb24b4f6d26a192d5441b0476099cf68d`（/tmp/cdc-r1-worktree） |
| 定向测试 | 7 文件（data-subscribe 已跟踪 spec）/ 124 用例 PASS |
| 全量测试 | 22 文件 / 359 用例 PASS |
| 构建 | `npm run build` BUILD SUCCESS |
| 未跟踪文件 | `frontend/src/api/subscription.spec.ts` 未带入、未执行、未计数 |

后端代码与测试相对 `49eb778…` 零变化，沿用原正式验收 138/138 定向测试与 package 成功证据（本 R1 不重跑后端测试，见任务 Prompt §8）。

## 8. 数据库恢复与核验

- 临时目标库 `R1TGT01`/`R1TGT.DOT`：已删除，残留 **0**。
- `CDC_DATA_SUBSCRIBE` 在单一事务内从备份表恢复（`DELETE ALL` → 显式 12 列 `INSERT SELECT` → `COMMIT`）。
- 恢复后只读核验（`database/restore-r1.txt`）：当前 12 = 备份 12；主键集合双向 `MINUS=0`；8 个非 CLOB 列双向 `MINUS=0`；4 个 CLOB 列 `DBMS_LOB.COMPARE` 不一致 0；R1 订阅残留 0；R1 临时目标残留 0。
- 无 DDL；备份表 `CDC_DATA_SUBSCRIBE_2026_08_31` 只读未修改。

## 9. 126 条逐条状态与证据映射

- R1 覆盖矩阵：`docs/features/data-subscription/evidence/DATA-SUBSCRIPTION-FORMAL-ACCEPTANCE-001-R1/coverage-matrix-r1.md`（126 条逐条：最终状态、实际执行方式、具体证据路径、简短结论；`BR`/`BR-IC`/`FT`/`HTTP`/`DB`/`BT`/`SC` 分类与 R0 保留证据引用）。
- 浏览器场景索引：同目录 `browser/browser-scenario-index.md`。
- R1 矩阵取代 R0 `coverage-matrix.md` 的证据标注并纠正其中不准确的 `BR` 声明；R0 原始证据文件未删除。

## 10. PASS / FAIL / BLOCKED 汇总

| 状态 | 数量 |
|---|---|
| PASS | 126 |
| FAIL | 0 |
| BLOCKED | 0 |
| **合计** | **126** |

## 11. 失败或阻塞项

无。126 条全部 PASS。

## 12. 未操作 sync-client/Kafka/ZooKeeper/大屏

- 全程未操作 sync-client、Kafka Topic、ZooKeeper（`zookeeper_access_status=NONE`、`kafka_operation_status=NONE`、`sync_client_operation_status=NONE`）。
- 未修改大屏相关代码或大屏基线；大屏修正保持 `DEFERRED_AFTER_DATA_SUBSCRIPTION_FEATURE_ACCEPTANCE` 延期（`DSUB-AC-121/122`）。

## 13. 当前实现状态与下一入口

- `implementation_status = IMPLEMENTED_FORMAL_ACCEPTANCE_EXECUTED_PENDING_REVIEW`；`acceptance_execution_status = EXECUTED_PENDING_REVIEW`。
- 下一入口：**ChatGPT 对本 R1 提交进行正式复审**。
  - 复审通过后才允许最终验收接受收口并更新为 `IMPLEMENTED_ACCEPTED`；
  - 若仍存在 FAIL/BLOCKED：按真实数量更新状态，不得写成正式验收通过。

## 14. R1-R1 元数据定向修订追加说明（2026-09-02）

- ChatGPT 对本 R1 结果提交 `f76239bdec7c6900bf4776118d7128f8792e5d11` 正式复审结论 `CHANGES_REQUIRED`：R1 的真实浏览器补验（54 场景）、干净 worktree 前端定向 124/全量 359 测试、`npm run build`、数据库恢复（12=12、双向 MINUS 0、CLOB 一致 0、R1 残留 0）以及 126 条证据映射本身全部通过复审；仅三处状态/证据元数据矛盾待定向修正：
  1. `ACCEPTANCE.md` 顶部“文档状态”元数据行与 §1 长状态说明仍以当前语气写 126 条 `NOT_RUN`，与 126 条 `PASS`、执行汇总和实现状态冲突；
  2. S4-7a/S4-7b 场景汇总文字与明细 JSON（`browser/s4b-shift240.json reservedSelected=[]`、`browser/s4b-anchor240.json reservedFinal=[]`）相反/残缺；
  3. S5-9 场景机读 `ac` 数组与 `browser-scenario-index.md` 验收 ID 漏列 `DSUB-AC-126`（与 `coverage-matrix-r1.md` 不一致）。
- 三处已由 `DATA-SUBSCRIPTION-FORMAL-ACCEPTANCE-001-R1-R1` 定向修订完成，修订明细见新报告 `reports/DATA-SUBSCRIPTION-FORMAL-ACCEPTANCE-001-R1-R1.md`。本追加仅记录元数据修订，业务语义与验收结论零变化；本报告 §1~§13 的 R1 执行事实（54 场景、124/359 前端测试、DB 恢复、126 条全部 `PASS`、`EXECUTED_PENDING_REVIEW` 状态）不回退。
- 当前仍等待 ChatGPT 对 R1-R1 结果提交正式复审；复审通过前不更新为 `IMPLEMENTED_ACCEPTED`。

## 15. 最终接受收口说明（DATA-SUBSCRIPTION-FORMAL-ACCEPTANCE-CLOSEOUT-001）

ChatGPT 已对 R1-R1 结果提交 `ae66d90e4415ce51be54f8be2523bb44b55b78a2` 的正式复审结论为 `APPROVED`，任务 `DATA-SUBSCRIPTION-FORMAL-ACCEPTANCE-CLOSEOUT-001` 完成最终接受收口。本报告 §1~§14 的 R1 执行事实与元数据修订记录不回退；数据订阅 Feature 当前实现状态收口为 `IMPLEMENTED_ACCEPTED`、正式验收状态为 `ACCEPTED`、验收执行状态为 `PASS`（126 条全部 `PASS`，0 `FAIL`/0 `BLOCKED`/0 `NOT_RUN`），本 Feature 不再有待验收复审入口；§13 的“下一入口：ChatGPT 对本 R1 提交进行正式复审”及上文“等待正式复审、不更新为 `IMPLEMENTED_ACCEPTED`”等表述为当时状态，不代表当前。详见 `reports/DATA-SUBSCRIPTION-FORMAL-ACCEPTANCE-CLOSEOUT-001.md`。
