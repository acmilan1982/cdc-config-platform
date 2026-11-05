# 探针端管理数据源选择与历史数据验收 R1 定向补证执行报告

- 任务编号：`CLIENT-CONFIG-SOURCE-SELECTION-AND-HISTORICAL-DATA-ACCEPTANCE-002-R1`
- 任务提示词：`docs/prompts/client-config/CLIENT-CONFIG-SOURCE-SELECTION-AND-HISTORICAL-DATA-ACCEPTANCE-002-R1-Agent-Prompt.md`
- 执行日期：2026-11-05
- 分支：`develop`
- 开工基线：`6c72727b4e77efc15034af0dc44242e15ced094f`（本地 = `origin/develop` = 远端 `refs/heads/develop`）
- 范围：仅 `CCFG-AC-034`、`CCFG-AC-057` 两项真实运行补证 + 证据可复现性修正 + 执行计数勘误；其余 22 项不重跑。

## 1. 结论摘要

| 项目 | 结果 |
|---|---|
| `CCFG-AC-034` | **PASS 维持**：32 个真实存在、类别/启用正确、未被占用的合成源序列化 1055 字节；真实新增页选择后后端返回 40105，真实 API 同样 40105 且无持久化；1000 字节成功腿经真实编辑 API 重新确认，持久化恰好 1000 字节 |
| `CCFG-AC-057` | **PASS 维持**：启用探针 A 占有 S/R → 真实停用后 A 仍占用 S → B 分配被 40941 阻断且反馈指向 A → 真实编辑从 A 移除 S 保留 R → B 成功取得 S，独立回读确认归属转移 |
| `changed_ids` | `[]`（两项均未出现反例，未发生状态 token 变化） |
| 统计 | `PASS` **125** / `FAIL` **0** / `BLOCKED` **27** / `NOT_RUN` **5** = **157**（未变，独立复算） |
| `r0_dml_count_reconciliation` | **PARTIALLY_VERIFIED**（见 §6：可核实部分与不可复算部分已分开；未用 188 或任何推算值替换 193） |

本批补证完成并推送成功不等于远程复审通过；两项补齐不等于 157 条整体验收通过或 Feature 正式接受。

## 2. 业务执行事实

### 2.1 R1 夹具

| 项目 | 值 |
|---|---|
| 新增合成数据源 | **34** 行：32 条 AC-034 容量源（`S2AC-R1O-…01`～`…32`，每条 32 字符）+ AC-057 的 S（`S2AC-R1S1`）与 R（`S2AC-R1R1`） |
| 新增合成探针 | **2** 行：`S2AC-R1A`（终态 `FG_ACTIVE='0'`，持有 R）、`S2AC-R1B`（`FG_ACTIVE='1'`，持有 S） |
| 数据源终态 | `CDC_DATA_SOURCE` **235** 行（R0 后 201 + R1 34）；既有 37 条未修改 |
| 探针终态 | `CDC_CLIENT_MULTIPLE` **61** 行（R0 后 59 + R1 2）；`S2AC-R1OVER` 无行 |
| 清理/恢复 | 按负责人授权**不清理、不恢复**；不报告 `RESTORED` |

夹具均为纯合成值（`r1-host.invalid`、`r1_user`、`r1_notreal`、`R1OverOrgNN` 等），未复制真实凭据或连接信息。直接 DML 仅用于夹具准备与独立核对；所有被测新增、停用、编辑移除与分配均通过真实业务 API/页面完成。

### 2.2 数据漂移观察（非本任务造成）

R0 采集于 2026-11-04 14:07 的合成探针快照显示多数记录 `FG_ACTIVE='1'`；R1 开工时（2026-11-05，未对任何 R0 探针执行启停）观察到 29 条 R0 合成探针的 `FG_ACTIVE` 均为 `'0'`。该变化发生在 R1 之前，原因未排查，不影响 R0 历史响应/JSON 的当时事实。R1 的 1000 字节成功腿因此不依赖该启用态，而是用真实编辑 API 对仍存在的 1000 字节载荷重新保存并回读；AC-057 另用全新 A/B 夹具，A 由真实新增 API 创建后为 `'1'`，再执行停用。

## 3. `CCFG-AC-034` 逐原子证据矩阵

定义：至少选择 1 个数据源，未选禁止保存；无数量硬上限，但序列化结果不得超过 1000 物理容量，超容量拒绝保存且不绕过“至少 1 个”规则。

| # | 前置 | 操作 | 期望 | 实际 | 判定 |
|---|---|---|---|---|---|
| 1 | 32 个 `S2AC-R1O-…` 源已由夹具创建，`FG_ACTIVE='1'`、`CATEGORY=SOURCE`、`TYPE=ORACLE`，且无占用 | 只读 SQL 与候选 API 核对 | 全部存在、可选、未占用 | SQL `R1O_COUNT=32`、`R1O_HELD=0`；候选 API 返回 34/34（含 S/R）`selectable=true`、无 `notSelectableReason` | 满足 |
| 2 | 同上；序列化 `32 × 32 字符 + 31 逗号 = 1055` UTF-8 字节 | 真实新增页选择全部 32 源并提交 | 若前端阻断则 0 请求并有提示；若发请求则记录真实业务码 | 选择 32/32 成功；提交发出 **1** 个 POST；HTTP 200 + 业务 `code=40105`；页面红色反馈“数据源序列化结果超过 1000 字节（UTF-8），请减少选择。” | 满足（后端拒绝） |
| 3 | 同一已验证集合 | 真实 API `POST /api/clients`（`clientId=S2AC-R1OVER`） | 业务 `40105`，不创建/不部分更新 | HTTP 200 + `code=40105`，`serializedBytes=1055`；独立列表回读 `rowPresent=false`；SQL `R1OVER_ROWS=0` | 满足 |
| 4 | `S2AC-PCAP` 行仍存在，载荷 31 个 CAP 源、恰好 1000 字节 | 真实编辑 API `PUT /api/clients/S2AC-PCAP` 重新保存同一载荷 | 成功且持久化仍为 1000 字节 | HTTP 200 + `code=200`；回读 `rawDataSourceIdsBytes=1000`、`samePayload=true`、31 个源 | 满足（1000 字节成功边界） |
| 5 | R0 未选源腿 | 不重跑，复用 R0 `cases.noSourceUi`/`noSourceApi` | 前端 0 请求并提示；API 40103 | R0 固定键仍在：`results/group-d-results.json` → `cases.noSourceUi.requests=[]`、`cases.noSourceApi.json.code=40103` | 满足（历史证据保留） |
| 6 | R0 40 个短源、359 字节 | 不重跑，复用 R0 `countCap` | 无固定数量硬上限 | `results/group-supp-results.json` → `countCap.json.code=200`、`serializedBytes=359`、`count=40` | 满足（历史证据保留） |

证据键：

- `evidence/...-R1/results/ac034-r1-results.json` → `precondition.allSelectable`、`precondition.serializedBytes=1055`、`uiOver.chosenCount=32`、`uiOver.requests`（1 条 POST）、`uiOver.response.responseJson.code=40105`、`uiOver.feedback`、`apiOver.json.code=40105`、`apiOver.serializedBytes`、`noPersistence.rowPresent=false`、`exact1000Reuse.rawDataSourceIdsBytes=1000`。
- `evidence/...-R1/results/ac034-exact1000-refresh.json` → `response.httpStatus=200`、`response.json.code=200`、`after.rawDataSourceIdsBytes=1000`、`after.samePayload=true`。
- `evidence/...-R1/results/r1-sql-verification.txt` → `R1O_COUNT=32`、`R1O_HELD=0`、`R1OVER_ROWS=0`、`PCAP_PERSISTED` 的 `CHARS=1000/BYTES=1000`。

说明：业务边界仍按 1000 字节校验，数据库列 1024 字节的物理宽度不改变业务口径；未新增数量上限。

## 4. `CCFG-AC-057` 逐原子证据矩阵

定义：唯一分配校验覆盖表中全部记录（含 `FG_ACTIVE=0` 与历史异常态）；停用不释放数据源，仍会冲突；只有从原记录移除该数据源或删除原记录后才释放。

| # | 前置 | 操作 | 期望 | 实际 | 判定 |
|---|---|---|---|---|---|
| 1 | S=`S2AC-R1S1`、R=`S2AC-R1R1` 存在且可选、未被占用；A=`S2AC-R1A`、B=`S2AC-R1B` 均不存在 | 只读候选 API 与列表核对 | S/R `selectable=true`；A/B 无行 | `precondition.s.dataSourceId=S2AC-R1S1`（`selectable=true`, `occupiedByClientIds=[]`）、`precondition.r` 同；A/B 行均为 null | 满足 |
| 2 | 同上 | 真实新增 API 创建 A，持有 `[S,R]` | 成功，A 为启用态并持有两源 | `createA.json.code=200`；`aAfterCreate.row.fgActive="1"`、`rawDataSourceIds="S2AC-R1S1,S2AC-R1R1"` | 满足（启用探针占用样本） |
| 3 | A 启用并占用 S | 真实停用 API `PUT /api/clients/S2AC-R1A/disable`，随后候选 API 查询 S | 成功；A=`0` 且仍关联 S；S 仍不可选且冲突指向 A | `disableA.json.code=200`；`aAfterDisable.row.fgActive="0"`、`rawDataSourceIds="S2AC-R1S1,S2AC-R1R1"`；`sCandidateWhileDisabled.selectable=false`、`occupiedByClientIds=["S2AC-R1A"]` | 满足（停用不释放） |
| 4 | 停用 A 仍占用 S | 真实新增 API 创建 B，请求 `[S]` | 40941，反馈指向 A，无部分写入 | `createBBlocked.json.code=40941`，message 含“R1Ac057SourceS（S2AC-R1S1）”与“S2AC-R1A”；`bAfterBlocked.row=null` | 满足 |
| 5 | 停用 A 仍占用 S | 真实编辑 API `PUT /api/clients/S2AC-R1A`，载荷 `[R]` | 成功持久化；A 仅关联 R，仍停用 | `editARemoveS.json.code=200`；`aAfterEdit.row.rawDataSourceIds="S2AC-R1R1"`、`fgActive="0"` | 满足（移除释放） |
| 6 | A 已移除 S、保留 R | 真实新增 API 创建 B，请求 `[S]` | 成功；S 归 B，A 不再关联 S | `createB.json.code=200`；`bAfterCreate.row.fgActive="1"`、`rawDataSourceIds="S2AC-R1S1"`；`aFinal.row.rawDataSourceIds="S2AC-R1R1"`；`sCandidateFinal.occupiedByClientIds=["S2AC-R1B"]` | 满足 |
| 7 | 历史异常态占用 | 不重复制造；复用 R0 `abnormalHolderBlocks` | 异常态记录仍阻断 | R0 `results/group-d-results.json` → `occupancy.abnormalHolderBlocks.json.code=40941` | 满足（历史证据保留） |

“移除或删除”为二选一；本批执行移除释放，删除释放腿未单独执行。A/B 按授权保留，未恢复 A 为启用，不清理 B。

证据键：`evidence/...-R1/results/ac057-r1-results.json` → `precondition`、`createA.json.code`、`aAfterCreate.row`、`disableA.json.code`、`aAfterDisable.row`、`sCandidateWhileDisabled`、`createBBlocked.json.code/message`、`bAfterBlocked.row`、`editARemoveS.json.code`、`aAfterEdit.row`、`createB.json.code`、`bAfterCreate.row`、`aFinal.row`、`sCandidateFinal`；独立 SQL 见 `results/r1-sql-verification.txt` 的 `AC057_FINAL_ROWS` 与 `AC057_S_R_HOLDERS`。

## 5. 四项纠正

| 项目 | 前序问题 | R1 处理 | 核实方式 |
|---|---|---|---|
| 探针依赖 | 多个 R0 探针 `require('./lib.cjs')`，实际文件为 `probe-lib.cjs`；`probe-supplements.cjs` 又用 `require('./probe-lib.cjs')` | 保留 R0 原始探针字节；在 R1 `probes/legacy-r0/` 提供修正副本，统一为 `require('../probe-lib.cjs')`；R1 两项使用新建探针 | `results/legacy-probe-dependency-check.txt`：12 个副本逐文件 `node --check` 通过、目标存在；公共库 SHA256 `1628c6ff…52ca2f` 与 R0 一致；未执行整段历史探针 |
| 缺失 CSV | R0 README 索引了两份当时未提交的 CSV | 原始快照真实存在（2026-11-04 14:07，仅合成值），脱敏检查后补入 R0 `samples/` 并标注采集时点；未从当前库生成伪 R0 快照 | R0 `samples/synthetic-sources.csv` 164 行、`synthetic-clients.csv` 29 行；R0 `SHA256SUMS` 新增两条并更新 README 条目，其余 40 条哈希保持原值 |
| “无 mock”表述 | README 绝对声称未使用 mock，与 AC-055 空池 fulfill 注入不一致 | 改为限定描述：AC-055 空候选池/加载失败为标注的路由 fulfil/abort 注入，不等同真实空库；AC-133 为只读观察；其余为真实页面/接口 | R0 README §导语与复现第 5 条 |
| 复现顺序 | 把含 API 创建终态的合并 SQL 当作创建前脚本 | 明确合并 SQL 不是无条件前置脚本：`S2AC-P14/PAUTO/PCAP/PK40/P07` 当时由真实 API 创建，脚本仅保留等价 INSERT；R1 给出真正的前置脚本与顺序 | R0 README 复现第 2～4 条；R1 README §2（夹具先于探针、重跑需换夹具/独立库） |

## 6. R0 执行计数勘误

| 口径 | 数值/事实 | 来源与状态 |
|---|---|---|
| 脚本文本条数 | **193 INSERT + 2 COMMIT** = 164 数据源 + 29 探针；无 `UPDATE/DELETE/DDL` | R0 `sql/fixture-prepare.sql`（102+22+1 COMMIT）与 `fixture-prepare-extra.sql`（62+7+1 COMMIT），`grep` 复核；**VERIFIED** |
| 实际业务 API | **18** 次：成功 **8**、按预期拒绝 **10** | R0 结果 JSON 中 8 个 `code=200`（`group-a/c/d/e2/supp`）与 10 个拒绝（40103×1、40105×1、40441×1、40941×7）；**VERIFIED**（按响应码可复算） |
| 实际直接 DML 尝试/成功次数 | **无法从现存记录精确复算** | R0 未保留逐次 SQL*Plus 执行会话日志；不能用脚本总行数、净增行数或 API 成功数倒推 |
| 实际 COMMIT 次数 | **无法从现存记录精确复算** | 同上；脚本含 2 条 `COMMIT` 只是文本口径 |
| 仅用于重放、当时未执行的语句 | 至少 5 条探针 INSERT：`S2AC-P14`、`S2AC-PAUTO`、`S2AC-PCAP`、`S2AC-PK40`、`S2AC-P07` | 各自由真实 API 创建并返回 200（`group-a`、`group-c`、`group-d`、`group-supp`、`group-d.occupancy.afterRelease`）；因此脚本中对应等价 INSERT 在当时不可能是已执行 DML；其余语句是否逐条执行/重试无记录 |
| 最终保留行数 | 201 数据源（164 合成 + 37 既有）、59 探针（29 合成 + 30 既有） | R0 `results/final-state.txt`；这是状态事实，不作为执行次数 |

结论：`r0_dml_count_reconciliation=PARTIALLY_VERIFIED`。R0 报告中的“193 条 INSERT”为脚本文本口径，不得直接当作实际执行次数；本文不提供替代性的推算值。

## 7. R1 独立执行记录

| 类别 | 次数 | 明细 |
|---|---|---|
| 直接 DML（夹具） | 尝试 **34** / 成功 **34** / 失败 **0**；`COMMIT` 尝试 **1** / 成功 **1** | `sql/fixture-prepare-r1.sql` 单次执行；`results/fixture-prepare-r1.out` 显示 34 次 `1 row created`、1 次 `Commit complete`、exit 0 |
| 业务写请求（到达真实后端） | **10** 次：成功 **5**、按预期拒绝 **5** | AC-034：探针两次运行各产生 UI 超限 1 次（40105）+ API 超限 1 次（40105），共 4 次拒绝；1000B 刷新 PUT 1 次（200）。AC-057：创建 A（200）、停用 A（200）、B 被阻断（40941）、编辑 A 移除 S（200）、B 成功（200） |
| 被阻断在到达后端之前 | **0** | AC-034 前端未本地预拦截，实际发出 1 个请求并由后端拒绝 |
| 注入 | **0** | R1 两项未使用路由注入或故障注入 |
| 重试 | **1** 次探针重跑 | `probe-ac034-r1.cjs` 首轮在完成两次超限写请求后，因回读响应结构解析错误（`data.items` 误当作数组）中止；修正后整轮重跑，两次超限写请求已计入上表 |
| 最终保留行 | R1 数据源 **34**、探针 **2**、`S2AC-R1OVER` **0** | 独立 SQL 与列表回读 |

R0 与 R1 分开统计；上文 R1 数字不能表述为 R0 已执行。

## 8. 文档变更、统计与 Git

- `ACCEPTANCE.md`：仅追加 §1.38 R1 状态块与 §6 一行变更记录；157 条定义行与全部状态格不变。
- `README.md`：仅追加本批导航/下一入口段落。
- 新增 R1 报告与 R1 证据目录；R0 证据目录仅做提示词允许的最小修正：补入两份真实 CSV、修正 README 的 mock/复现表述、更新 `SHA256SUMS` 对应条目；R0 运行 JSON/SQL 输出与历史探针字节未改。
- 定义四族数量复核：`REQ154 / AC157 / DESIGN89 / UI77` 不变；157 条 AC 编号连续唯一。
- 统计：`PASS 125 / FAIL 0 / BLOCKED 27 / NOT_RUN 5 = 157`；`changed_ids=[]`。
- 本报告不预填自身提交 SHA；推送状态与最终 SHA 在执行回报中给出。

## 9. 边界与服务

- 未运行全量产品测试/构建/lint/类型检查；未修改产品源码/CSS/测试/依赖/配置/模板或其他 Feature、REQ/DESIGN/UI/API/DATABASE。
- 未访问“数据源管理”页面，未连接/测试样本源、未启动采集、未操作 ZK/Kafka/sync-client/sync-server，未做 DDL 或其他表 DML。
- 既有 37 条数据源保护结论仅覆盖 R0 已实际比对的 6 字段（`ID|ORG|DATA_SOURCE_NAME|TYPE|CATEGORY|FG`），不等于整行所有字段已证实。
- 服务保持运行：后端 PID **3327**（`*:8080`，jar SHA256 `efdbea82…a459`，mtime 2026-09-22，mtime 不证明与源码一致）；前端 npm PID **3373**、Vite PID **3385**（`0.0.0.0:5173`）。
- 验收入口：`http://192.168.174.70:5173/config/client`；停止：`kill 3327 3373 3385`。
- 日志：`runtime-logs/CLIENT-CONFIG-SOURCE-SELECTION-AND-HISTORICAL-DATA-ACCEPTANCE-002-R1/`（`backend-8080.log`、`frontend-5173.log`、PID 文件）。
- 按授权不清理、不恢复，故不报告 `RESTORED`。

## 10. 下一入口

`CHATGPT_REMOTE_CLIENT_CONFIG_SOURCE_SELECTION_AND_HISTORICAL_DATA_ACCEPTANCE_002_R1_REVIEW`
