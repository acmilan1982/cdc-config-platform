# CLIENT-CONFIG-CONCURRENCY-REQUIREMENTS-ADJUSTMENT-001 执行报告

## 1. 任务身份

| 项目 | 值 |
|---|---|
| 任务编号 | `CLIENT-CONFIG-CONCURRENCY-REQUIREMENTS-ADJUSTMENT-001` |
| 任务类型 | 已批准需求与验收的并发口径定向调整（纯文档） |
| 仓库 | `https://github.com/acmilan1982/cdc-config-platform` |
| 分支 | `develop` |
| Feature | `client-config`（探针端管理，页面路由 `/config/client`） |
| 任务提示词 | `docs/prompts/client-config/CLIENT-CONFIG-CONCURRENCY-REQUIREMENTS-ADJUSTMENT-001-Agent任务提示词.md` |
| 授权基线提交 | `e6e018a1d9f24c65ea0bd9e0d06eb1f764fda5ed`（`git fetch` 后核对本地 `HEAD`、`origin/develop`、`git ls-remote origin refs/heads/develop` 三者一致，ahead/behind = `0 0`） |
| 下一入口 | `CHATGPT_FORMAL_REQUIREMENTS_ADJUSTMENT_REVIEW` |
| 报告自身最终提交 | 不包含（提交后最终 SHA 仅在 Push 后控制台结果块输出，本报告不含自身最终提交 ID） |

本任务只调整需求、验收及索引状态，不修改设计文档，不进入代码实现，不执行验收，不自行批准调整后的需求。此前生成但尚未执行的任何“设计 R2 修订提示词”已被本次更早阶段的需求调整取代，不得执行。

## 2. 目标与权限边界

目标：把 Feature `client-config` 已批准需求/验收中的并发口径，按项目负责人 2026-09-04 最新决定调整为“尽力写前检查、不执行 Oracle 显式表锁、接受极端并发双成功边界”，并只更新受影响的需求/验收业务行、必要摘要/状态/批准说明与变更记录。

权限边界：

- 只允许新增或修改 5 个文件（见 §6）。
- 禁止修改 `DESIGN.md`/`API.md`/`UI.md`/`DATABASE.md`（四份设计文档对授权基线必须零差异）。
- 禁止修改任何既有报告、`docs/database/` 下任何文件、任意业务代码/测试/配置/脚本、其他 Feature 文件。
- 不连接数据库、不执行 DDL/DML、不访问 ZooKeeper/Kafka、不启停服务、不执行前后端构建与测试。
- 执行 Commit 与普通 Push 到 `origin/develop`（禁止 force push）；Push 成功后立即停止。

## 3. Git/工作区现场与无关修改保护

任务开始时执行 `git fetch origin develop`，并核对：当前分支 `develop`；本地 `HEAD`、`origin/develop`、`git ls-remote origin refs/heads/develop` 均为 `e6e018a1d9f24c65ea0bd9e0d06eb1f764fda5ed`；`git rev-list --left-right --count origin/develop...HEAD` 输出 `0 0`。

工作区包含大量与本任务无关的既有修改与未跟踪文件，逐一保持原样，不修改、不覆盖、不暂存、不提交。这些无关内容（保护对象）包括但不限于：

- `M .claude/settings.local.json`、`M agent-env.sh`；
- `D docs/database/TASK3_FINAL_REVISION_REPORT_20260806.md`、`D docs/database/TASK4_EXECUTION_REPORT_20260807.md`、`D docs/database/TASK4_WARN_TEST_FINAL_REPORT_20260807.md`；
- `M frontend/index.html`、`frontend/src/config/menu.ts`、`frontend/src/layouts/HeaderBar.vue`、`MainLayout.vue`、`Sidebar.vue`、`frontend/src/stores/app.ts`、`frontend/src/styles/global.css`；
- `docs/agent-prompts/` 下大量新增提示词文件、`docs/baseline-work/`、`docs/code/`、`docs/database/` 下多个新增分析文件、`docs/features/app-shell/`、`docs/features/large-screen/`、`docs/large-screen/`、`docs/pages/zk-client-monitor-candidates-answers.md`、`docs/prompts/`、`docs/screenshots/`、`docs/task-reports/`、`docs/zookeeper/`、`frontend/src/api/subscription.spec.ts`、`frontend/src/styles/theme.css`、`frontend/src/views/large-screen/mock-data.ts`、`package-lock.json` 等未跟踪内容。

本任务实际变更文件（相对授权基线）：仅下文 §6 白名单列出的 5 个文件，其中 4 个为定向修订、1 个为本报告（新增）。未执行 `reset`/`checkout`/`clean`/`stash`，未 `git add .`、未 `git add -A`。

## 4. 项目负责人决定口径（完整记录）

按任务提示词 §2，项目负责人已确认以下口径：

1. 配置平台不再为了保证数据源唯一分配执行 Oracle 显式表锁。
2. 新增、编辑、启用在写入前重新读取当前配置并检查数据源是否已被其他探针分配；发现冲突时仍拒绝当前操作并给出明确提示。
3. 接受极端并发下两个请求同时完成检查、随后都写入成功的可能性；配置平台不再承诺并发时“最多一个成功”。
4. 探针 ID ASCII 大小写不敏感唯一仍是普通新增/编辑的校验规则，但同样不再承诺两个极端并发请求最多一个成功。
5. `sync-client`、`sync-server` 在正式使用配置时都会检查数据源是否重复分配，作为运行侧最终防线；配置平台不得把自身的写前检查描述为数据库级强一致保证。
6. 普通事务可继续用于单次 DML 的失败回滚，但不得再宣称该事务能消除“检查后写入”的并发竞态。
7. 前端候选占用标记、后端写前二次检查、历史重复分配异常展示、停用不释放数据源等既有规则继续保留。

业务事实边界：`sync-client`/`sync-server` 的运行侧重复检查属于项目负责人本次明确提供的业务事实，本任务按该事实记录，不虚构具体实现类、SQL、错误码或日志行为；本 Feature 不实现、不调用、不通知这两个进程的校验，不通过 HTTP 触发它们，不操作进程、ZooKeeper 或 Kafka。

## 5. 为什么现有表锁设计已过时、不能继续批准

现有 `DESIGN.md`/`API.md`/`UI.md`/`DATABASE.md`（R1 定向修订后的草案）为满足旧口径“并发争抢同一数据源最多一个成功”“大小写不敏感并发唯一”的强保证，采用 `LOCK TABLE CDC_CLIENT_MULTIPLE IN EXCLUSIVE MODE WAIT 5` 方案（如 `DATABASE.md` 事务锁矩阵与 CCFG-DB-009/016/017/018、`DESIGN.md` CCFG-DESIGN-024/026/027“并发最多一笔成功”、`API.md` `ORA-30006→50050` 错误码 `CCFG-API-017`、`UI.md` 针对 50050 的提示文案等）。

本次项目负责人决定已取消“为保证数据源唯一分配执行 Oracle 显式表锁”和并发“最多一个成功”承诺，改为“写入前重新读取 + 尽力写前检查 + 已接受极端并发双成功边界”。该表锁方案因此与新的需求/验收口径直接冲突、已过时，暂不可批准、不可用于实现，标记为 `STALE_LOCK_DESIGN_PENDING_REQUIREMENTS_APPROVAL`；须待本轮需求调整经 ChatGPT 正式复审与项目负责人重新批准后，另行定向修订四份设计文档（本任务不做该修订）。

## 6. 实际变更文件（5 文件白名单内）

| 文件 | 变更类型 |
|---|---|
| `docs/features/client-config/REQUIREMENTS.md` | 定向修订 |
| `docs/features/client-config/ACCEPTANCE.md` | 定向修订 |
| `docs/features/client-config/README.md` | 定向修订 |
| `docs/features/README.md` | 定向修订 |
| `docs/features/client-config/reports/CLIENT-CONFIG-CONCURRENCY-REQUIREMENTS-ADJUSTMENT-001.md` | 新增（本报告） |

`git diff --check` 输出 `DIFF_CHECK_CLEAN`；四份设计文档相对授权基线 `e6e018a...` 均核验为零差异（`ZERO_DIFF`）。实际暂存按完整文件名逐个进行，未使用宽泛暂存。

## 7. 受影响 REQ/AC 的调整前后语义

### 7.1 需求（`REQUIREMENTS.md`）

| 编号 | 调整前（旧口径） | 调整后（新口径） |
|---|---|---|
| `CCFG-REQ-038` | 探针 ID 去除首尾空白后按 ASCII 大小写不敏感唯一；编辑自排除；保留最终大小写；Oracle 主键仅精确值唯一、不执行 DDL；“并发提交也必须守住……最多一个成功，具体锁与事务方案留待 DESIGN/DATABASE”。 | 保留普通新增/编辑校验、编辑自排除、保留最终大小写、Oracle 主键精确大小写事实与“不执行 DDL”；删除并发“最多一个成功”承诺；明确该规则是写入前应用校验规则、只约束普通顺序操作下唯一，不通过 Oracle 显式表锁串行化，极端并发可双成功为已接受并发边界（见 `CCFG-REQ-077`）。 |
| `CCFG-REQ-068` | “强制业务不变量：同一个规范化数据源 ID 最多只能出现在一条记录的 DATA_SOURCE_ID 中”的无条件强表述。 | 改为配置平台目标业务规则与普通操作校验规则：非并发正常操作中写前检查能看到既有占用时拒绝新增重复分配；历史异常或极端并发仍可能使表内出现重复，页面必须识别并展示，不得宣称数据库物理保证（不强一致唯一约束、不显式表锁）。 |
| `CCFG-REQ-071` | 新增/编辑保存时后端必须重新校验全部拟保存数据源，不能只依赖前端禁选。 | 明确后端必须在执行 DML 前重新读取 `CDC_CLIENT_MULTIPLE` 全部记录并校验全部拟保存数据源；该检查是尽力写前检查，不通过 Oracle 显式表锁把检查与写入串行化。 |
| `CCFG-REQ-072` | 启用时后端必须执行与新增/编辑相同的唯一分配校验。 | 保留启用前（更新 `FG_ACTIVE='1'` 前）重复分配检查，明确同样是不取 Oracle 显式表锁的写前检查。 |
| `CCFG-REQ-074` | 任一数据源冲突时整次保存或启用必须失败，不得部分写入。 | 明确“整体失败、不得部分写入”仅针对当次写前检查已发现冲突或当前请求自身执行失败；不得推导为并发下全局唯一保证。 |
| `CCFG-REQ-077` | 并发保存必须守住该不变量：两个探针并发争抢同一数据源时不允许两次都成功；具体事务/锁/原子方案留 DESIGN/DATABASE；本规则为应用层业务约束，不执行 DDL。 | 整条改写为新的并发边界，明确 7 点：① 新增/编辑/启用不为数据源唯一分配执行 Oracle 显式表锁；② 探针 ID 大小写校验同样不依赖显式表锁；③ 每个请求仍须 DML 前当次后端检查；④ 接受竞态窗口及两请求都成功；⑤ 不再提供“最多一个成功”强保证、双成功不作为验收失败；⑥ 不新增 DDL；⑦ `sync-client`/`sync-server` 运行侧重复检查为最终防线但不属本 Feature 调用/实现范围。 |

同步最小一致性修订：§1 元数据（文档状态→`DRAFT_PENDING_USER_REVIEW`、追加任务编号/类型）、§1.1 标题加“旧口径批准历史”限定、新增 §1.2（本轮并发口径调整，2026-09-04，待复审）、§5.1 范围“强制业务不变量”改为“目标业务规则与普通操作校验”并写入并发边界与运行侧防线、§7.7 标题改为“一个源库原则上只分配给一个探针（目标规则、普通校验与并发边界）”、§8 对应行标题同步、§10 追加 2026-09-04 变更记录行。其余 84 条需求业务语义与编号/顺序/数量保持零变更。

### 7.2 验收（`ACCEPTANCE.md`）

| 编号 | 调整前（旧口径） | 调整后（新口径） |
|---|---|---|
| `CCFG-AC-030` | 顺序执行、绕过前端的探针 ID 大小写不敏感校验场景保留；④ 并发场景预期“最多一个成功”。 | 保留 ①②③ 普通顺序/绕过前端场景；④ 改为极端并发不作为唯一性强保证验收：允许一笔成功也允许两笔都在竞态窗口成功，不以“最多一个成功”为通过标准、不依赖显式表锁。 |
| `CCFG-AC-056` | 无条件“同一个规范化数据源 ID 最多只出现在一条记录中”。 | 改为普通（非并发）新增/编辑/启用操作验收：当次写前检查能看到既有占用时必须拒绝重复分配；同时允许表中因历史异常或极端并发存在重复，页面异常展示规则继续适用，不宣称数据库物理保证。 |
| `CCFG-AC-058` | 绕过前端禁选，后端保存时重新校验冲突则拒绝。 | 保留绕过前端的后端写前检查（DML 前重新读取校验）；明确为尽力写前检查，不要求不核验显式表锁，不宣称消除并发竞态。 |
| `CCFG-AC-059` | 启用时后端执行相同唯一分配校验，冲突拒绝。 | 保留启用前检查；明确为不取显式表锁的写前检查，不宣称消除并发竞态。 |
| `CCFG-AC-061` | 任一数据源冲突即整次保存失败、不产生部分写入。 | 保留“当次检查发现任一冲突则整次失败且无部分写入”；增加不得据此推导并发原子保证的边界。 |
| `CCFG-AC-064` | 最多一笔成功、不允许两笔都成功；事务/锁方案在 DESIGN/DATABASE。 | 改写为新并发边界验收：并发时每请求执行写前检查；不执行 `LOCK TABLE CDC_CLIENT_MULTIPLE`、不存在锁等待超时业务路径；允许一笔成功也允许两笔竞态窗口内成功；不以“最多一笔成功”为标准；出现重复按历史重复异常展示；运行侧最终防线不由本 Feature 验收调用或模拟。 |

同步最小一致性修订：§1 元数据（文档状态→`DRAFT_PENDING_USER_REVIEW`、依据需求状态、追加任务编号/类型）、§1.1 标题加“旧口径批准历史”限定、新增 §1.2（本轮并发口径调整，2026-09-04，待复审）、§2 状态口径段落、§3 分类“唯一分配不变量（含并发）”改为“数据源唯一分配（目标规则、普通校验与并发边界）”、§6 追加 2026-09-04 变更记录行。76 条验收定义行编号/顺序/数量、关联需求、追踪矩阵（§5）与执行状态零变更，全部保持 `NOT_RUN`。

### 7.3 状态与批准链处理

- `REQUIREMENTS.md` 文档状态：`APPROVED` → `DRAFT_PENDING_USER_REVIEW`（§1.1 保留 2026-09-03 批准历史，新增 §1.2 明确旧批准不自动批准本轮调整）。
- `ACCEPTANCE.md` 文档状态：`APPROVED` → `DRAFT_PENDING_USER_REVIEW`（同上）。
- 实现状态保持 `NOT_STARTED`；76 条验收执行状态全部保持 `NOT_RUN`；未把标准修订写成验收已通过。
- 四份设计文档不修改，仍为 `DRAFT_PENDING_USER_REVIEW`；README 明确它们仍包含已过时表锁方案，标记 `STALE_LOCK_DESIGN_PENDING_REQUIREMENTS_APPROVAL`，暂不可批准、不可用于实现，待需求重新批准后定向修订。
- 本轮不存在待项目负责人决定的问题，`PENDING_USER_CONFIRMATION=0`；执行中未新增业务歧义，未自行补充规则。

## 8. 强制验证记录

| # | 验证项 | 命令/方法 | 结果 |
|---|---|---|---|
| 1 | `git diff --check` | `git diff --check` | `DIFF_CHECK_CLEAN`（无空白错误） |
| 2 | 实际变更不超出 5 文件白名单 | `git diff --stat -- <5 个白名单文件>` + 工作区核对 | 仅 5 个白名单文件为本任务变更（4 修订 + 1 新增），其余工作区改动均为任务前已存在并受保护 |
| 3 | 需求定义行 `CCFG-REQ-001~090` 共 90 条连续唯一 | `grep -oE 'CCFG-REQ-[0-9]{3}' REQUIREMENTS.md | sort -u` + 定义行计数 | count=90，`REQ-CONTIGUOUS-OK`；定义行数 90 |
| 4 | 验收定义行 `CCFG-AC-001~076` 共 76 条连续唯一 | 同上对 `ACCEPTANCE.md` | count=76，`AC-CONTIGUOUS-OK`；定义行数 76 |
| 5 | 76 条验收执行状态全部 `NOT_RUN` | `grep -E '^\| CCFG-AC-...'` 检查非 NOT_RUN 状态 | 未发现 PASS/FAIL/BLOCKED；`ALL_AC_ROWS_NOT_RUN` |
| 6 | 验收对需求覆盖 90/90、无悬空 | §5 矩阵行计数 + 全文档 REQ 引用扫描 | matrix_count=90，`MATRIX-CONTIGUOUS-OK`；90 个 REQ 均被引用，无缺失 |
| 7 | 除受影响行与必要摘要/状态/变更记录外其余业务语义不变 | 全文核对受影响清单 | 受影响 REQ 6 条、AC 6 条；其余业务行零改动（见 §7） |
| 8 | 全文不再承诺并发最多成功/表锁消除竞态 | `grep` 扫描“最多一个成功/最多一笔成功/LOCK TABLE/显式表锁/锁等待/强一致/消除竞态/原子” | 仅剩否定表述、已接受并发边界表述与调整历史记录，无正向残留承诺 |
| 9 | 仍明确普通写前后端检查、停用不释放、冲突提示、历史异常展示、运行侧最终防线、不执行 DDL | 受影响行 + 未受影响行核对 | 满足（`CCFG-REQ-069/075/076/078~090` 等未改动；`CCFG-REQ-077`⑦ 写入运行侧防线） |
| 10 | 四份设计文档相对起点 `e6e018a...` 零差异 | `git diff --quiet e6e018a... -- <4 文件>` | 四份均 `ZERO_DIFF` |
| 11 | 不执行后端/前端构建和测试 | — | `NOT_RUN_NOT_REQUIRED_DOCS_ONLY` |
| 12 | 不连接数据库、不执行 DDL/DML、不访问 ZK/Kafka、不启停服务 | — | `NOT_RUN_NOT_AUTHORIZED` / `NONE` |

## 9. 未执行、禁止与延期事项

- 未执行任何后端/前端构建与测试（纯文档任务）。
- 未连接数据库，未执行任何 DDL/DML，未查询库表元数据。
- 未访问、未写入 ZooKeeper/Kafka，未启停任何服务/进程。
- 未修改 `DESIGN.md`/`API.md`/`UI.md`/`DATABASE.md`（对起点零差异；其中表锁方案已过时，标记 `STALE_LOCK_DESIGN_PENDING_REQUIREMENTS_APPROVAL`，延期至需求调整重新批准后定向修订）。
- 未修改任何既有报告、`docs/database/` 文件、业务代码/测试/配置/脚本、其他 Feature 文件。
- 未批准调整后的需求/验收，未执行验收，未把标准修订写成验收通过（76 条执行状态保持全部 `NOT_RUN`）。
- 未虚构 `sync-client`/`sync-server` 运行侧重复检查的具体实现类、SQL、错误码或日志行为。

## 10. Commit/Push 计划与本报告说明

- 建议提交信息：`docs(client-config): revise concurrency requirements`。
- 计划：先核对完整 diff 与 5 文件白名单，逐个按完整文件名暂存（禁止 `git add .`/`-A`），普通 Commit；普通 Push 到 `origin/develop`（禁止 force push）；Push 后核验本地 `HEAD == origin/develop == git ls-remote`、ahead/behind `0 0`。
- Push 成功后立即停止：不修改设计、不生成实现、不自行批准需求、不执行验收、不连接数据库、不启停服务。
- 本报告不含自身最终提交 ID；最终提交 ID 仅在 Push 后控制台结果块输出。

## 11. 提交与核验后的现场结果（Push 后由控制台结果块补充）

- 实际 Push 结果、本地/远程/`ls-remote` 三者 SHA 与 ahead/behind 以任务结束时的 `AGENT_TASK_RESULT` 控制台结果块为准。
