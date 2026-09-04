# CLIENT-CONFIG-DESIGN-CONCURRENCY-ADJUSTMENT-001 执行报告

## 1. 任务身份、实际基线、Git 与工作区现场

```text
task_code=CLIENT-CONFIG-DESIGN-CONCURRENCY-ADJUSTMENT-001
task_type=设计草案并发口径定向调整（纯文档）
repository=https://github.com/acmilan1982/cdc-config-platform
branch=develop
known_base_commit=a3beeefd78886ef660a36525a5c71c618ccd5f65
feature=client-config
page_name=探针端管理
route=/config/client
design_applicability=DESIGN_CONCURRENCY_ADJUSTED_PENDING_FORMAL_REVIEW
report_path=docs/features/client-config/reports/CLIENT-CONFIG-DESIGN-CONCURRENCY-ADJUSTMENT-001.md
next_entry=CHATGPT_FORMAL_DESIGN_CONCURRENCY_ADJUSTMENT_REVIEW
```

本任务是依据 2026-09-04 已重新批准的需求/验收并发口径，对“探针端管理”四份设计草案（`DESIGN.md`/`API.md`/`UI.md`/`DATABASE.md`）执行一次独立、定向的并发口径调整：清除设计中已过时的 Oracle 显式表锁设计（`LOCK TABLE CDC_CLIENT_MULTIPLE IN EXCLUSIVE MODE WAIT 5`）、专用锁等待错误路径（`ORA-30006 → 50050 LOCK_WAIT_TIMEOUT`）与前端锁超时文案，并把新增/编辑/启用统一为“普通短事务 + DML 前全量重读 + 当次尽力写前检查 + DML”口径。本任务只修改设计文档与状态同步，不实现代码、不执行测试或验收、不连接数据库、不自行批准设计。

实际 Git 现场（提交前核验）：

- 分支：`develop`
- 本地 `HEAD`：`a3beeefd78886ef660a36525a5c71c618ccd5f65`
- `origin/develop`：`a3beeefd78886ef660a36525a5c71c618ccd5f65`
- `git ls-remote origin refs/heads/develop`：同值
- `git rev-list --left-right --count HEAD...origin/develop`：`0 0`
- 工作区存在大量与本任务无关的既有修改与未跟踪文件（前端布局/样式、`.claude/settings.local.json`、`agent-env.sh`、`docs/database/` 删除、`docs/agent-prompts/`、`docs/features/app-shell|large-screen/`、`package-lock.json` 等）。本任务只修改白名单内 6 个文件并新增本报告 1 份（共 7 文件），对其余内容一律不修改、不覆盖、不暂存、不提交。未发现目标文件存在无法安全区分的既有修改。

## 2. 已批准需求/验收及批准链

当前权威业务基线（本任务依据）：

```text
requirements_status=APPROVED
acceptance_status=APPROVED
requirements_count=90
acceptance_count=76
acceptance_execution_status=NOT_RUN
requirements_approval_closeout_commit=a3beeefd78886ef660a36525a5c71c618ccd5f65
```

批准链：

- 需求/验收基线曾于 2026-09-03 获项目负责人批准（`CLIENT-CONFIG-REQUIREMENTS-BASELINE-APPROVAL-001`，ChatGPT 对 R1 结果提交 `9b31893...` 正式复审 `APPROVED`）。旧口径仅把“数据源唯一分配、并发最多一笔成功”作为目标承诺，未批准任何具体表锁语句；`LOCK TABLE CDC_CLIENT_MULTIPLE IN EXCLUSIVE MODE WAIT 5` 是随后形成、始终未获批准的设计草案方案。
- 项目负责人决定（2026-09-04）：配置平台不再为保证数据源唯一分配执行 Oracle 显式表锁，取消并发“最多一个成功”强承诺，改为“写入前重新读取 + 尽力写前检查 + 已接受极端并发下两笔先后都成功边界”；运行侧 `sync-client`/`sync-server` 重复检查为最终防线但不属本 Feature 范围。
- 需求/验收并发口径定向调整草案：`CLIENT-CONFIG-CONCURRENCY-REQUIREMENTS-ADJUSTMENT-001`；首版结果经 ChatGPT 正式复审 `CHANGES_REQUIRED`（R1-01~R1-04）；R1 定向修订：`CLIENT-CONFIG-CONCURRENCY-REQUIREMENTS-ADJUSTMENT-001-R1`。
- ChatGPT 对并发口径调整 R1 结果提交 `f2a4d7db7fa63aaf834fbed73ad7a69f45621dcf` 正式复审结论为 `APPROVED`；项目负责人于 2026-09-04 明确回复“批准”。
- 批准收口任务：`CLIENT-CONFIG-CONCURRENCY-REQUIREMENTS-ADJUSTMENT-APPROVAL-001`；`REQUIREMENTS.md`/`ACCEPTANCE.md` 收口为 `APPROVED`（提交 `a3beeefd...`，即本任务起点）。2026-09-03 批准保留为历史，不自动批准本轮调整。

批准的是需求基线与验收标准，不代表功能已实现或验收已通过；90 条需求与 76 条验收均保持 `APPROVED` 且全部 `NOT_RUN`。

## 3. 过时设计扫描清单（现行设计中须清除的过时语义）

设计草案曾为实现旧口径的并发强承诺引入以下过时设计，本任务按已重新批准需求口径逐项清除或改写为禁止/边界说明：

| 过时语义 | 出现载体 | 处理 |
|---|---|---|
| `LOCK TABLE CDC_CLIENT_MULTIPLE IN EXCLUSIVE MODE WAIT 5` 表级互斥锁作为探针 ID/数据源唯一性保证手段 | DESIGN-001/016/017/020/023 及相关章节、API-008/009/011/014/016、DB-007/009/010/016/017/018、接口清单表、事务/并发章节 | 全部移除现行正向设计；改为“普通短事务 + DML 前全量重读 + 当次尽力写前检查”，并新增禁止性边界（DB-009、DESIGN-024/025/026） |
| `ORA-30006 → 50050 LOCK_WAIT_TIMEOUT` 专用锁等待错误契约 | API 错误码表 `50050` 行、API-017 触发归类、DESIGN-022 失败分支、DB 相关路径 | 删除 `50050` 错误码行（见 §6）；API-017/DESIGN-022/DB-009/016/017 明确本 Feature 不存在该专用触发路径 |
| 前端锁等待超时用户文案（“锁等待超时取 `50050` message”） | UI-020 用户可见文案表 | 删除该文案项并明确本 Feature 无锁等待超时文案 |
| 并发“最多一个成功 / 最多一笔成功”强承诺（两请求竞态只允许一笔成功） | DESIGN-027、API-008/009/011/014/016、DB-016/017 | 改为“已接受的并发结果：允许一笔成功、也允许两笔在竞态窗口中都成功；不承诺并发最多一个成功”；保留顺序冲突业务码 `40940/40941/40942` |
| 设计前提把“短事务表锁串行写入”当作唯一性实现前提 | DB-018 | 明确不再把该前提作为设计前提，也不引入显式锁、分布式锁或 DDL |
| Service 职责“事务与表级锁编排”；章节标题含锁/串行化表述 | DESIGN-001、DESIGN §7 标题 | 改为普通短事务与 DML 前全量重读/写前检查编排；章节标题改“并发边界与写前检查” |

保留（不属本任务范围、不改动）：普通顺序冲突的业务码（`40940`/`40941`/`40942`）、单请求原子性与 row-count==1、失败回滚、历史异常展示、读取端点不取锁说明、运行侧 `sync-client`/`sync-server` 最终防线（外场、不改动）。保留项中凡提及“表锁/锁等待”的读取或边界行均为“不取锁/无锁路径”的禁止或否定表述，已在 §12 逐条分类。

## 4. DESIGN/API/UI/DATABASE 逐项修订说明

### 4.1 DESIGN.md

- 顶部状态元数据：新增“并发调整任务 `CLIENT-CONFIG-DESIGN-CONCURRENCY-ADJUSTMENT-001`”与“并发调整日期 2026-09-04”行；同步 `PENDING_USER_CONFIRMATION=0` 说明，注明本轮并发口径定向调整亦未引入需另行决定的新语义。
- 在 R1 说明段后新增并发口径定向调整说明段。
- `CCFG-DESIGN-001`：Service 职责由“事务与表级锁编排”改为“普通短事务与 DML 前全量重读/写前检查编排”。
- `CCFG-DESIGN-016`（新增）、`CCFG-DESIGN-017`（编辑）、`CCFG-DESIGN-020`（启用）：删除表级互斥锁与“锁内权威校验”流程，改为“开启普通短事务 → DML 前全量重读 → 当次尽力写前检查 → 发现冲突不执行 DML 返回既有业务冲突 → 未发现冲突立即 DML；行数必须为 1、任一步失败整笔回滚”，并明确“该当次检查不消除检查与写入之间的并发竞态”。
- `CCFG-DESIGN-022`（写操作原子性与行数校验）：删除“锁等待超时”失败分支，明确本 Feature 无锁等待超时失败分支（该专用路径已删除）。
- §7 章节标题改为“并发边界与写前检查：确定方案”。
- `CCFG-DESIGN-023`（权威写前检查流程）：改为普通短事务内、目标 DML 前的全量重读与当次检查描述，明确该检查是后端最终应用层校验但不是并发强一致保证，不通过显式锁、行锁或任何串行化机制消除检查与 DML 之间的竞态窗口。
- `CCFG-DESIGN-024`：明确不执行显式表锁、不提供专用锁等待错误；不存在 `LOCK TABLE ... IN EXCLUSIVE MODE WAIT 5` 及 `ORA-30006 → 50050 LOCK_WAIT_TIMEOUT` 路径，错误码表不含 `50050`。
- `CCFG-DESIGN-025`（技术取舍）：明确前端禁选与后端当次写前检查均为尽力校验，不构成并发强一致唯一，不为唯一性强加 JVM 锁、分布式锁、独立锁表、`SELECT ... FOR UPDATE` 行锁、DDL 串行化等。
- `CCFG-DESIGN-026`：无主动并发锁/无 DDL 适用边界：不主动执行显式表锁/行锁，不引入 `DBMS_LOCK`、分布式锁、独立锁表、唯一函数索引、规范化关联表或任何 DDL；普通 DML 固有行锁/TM 锁不写成业务唯一性保证。
- `CCFG-DESIGN-027`（已接受的并发结果）：允许一笔成功、也允许两笔在竞态窗口中都成功，本 Feature 不承诺“并发最多一个成功”；普通顺序冲突仍由后提交者当次检查拒绝并返回 `40940/40941`。
- `CCFG-DESIGN-033`（未来测试方案）：删除“表级锁等待超时（`50050`）”测试目标；改为验证每个请求都执行 DML 前全量重读与当次写前检查、系统不主动执行 `LOCK TABLE`、不存在专用 `50050` 路径、不以“并发最多一个成功”为通过标准；若两笔均成功形成重复则验证列表按历史异常/冲突规则展示；不调用或模拟 sync-client/sync-server。R1 已批准测试场景 ①~⑥ 保持。
- §13 变更记录追加 2026-09-04 并发口径定向调整行。

### 4.2 API.md

- 顶部状态元数据新增并发调整任务/日期行；并发调整说明段补充“接口清单表由锁边界改为读/写前检查边界”。
- 接口清单表（E1~E7）表头“需表级互斥锁”改为“写前全量重读+当次检查”；E1/E2/E5/E7 为“否（只读）”，E3 为“是（INSERT 前重读全表）”，E4 为“是（UPDATE 前重读全表）”，E6 为“是（UPDATE 前重读目标与全表）”。
- `CCFG-API-008`（新增）、`CCFG-API-009`（编辑）、`CCFG-API-011`（启用）：写入边界由“表级互斥锁 + 锁内全量权威校验”改为“普通短事务 → 目标 DML 前重读全表 → 当次应用层校验 → 无冲突立即 DML → 行数校验与提交/回滚”，并明确该流程不消除检查与写入之间竞态、不保证并发最多一笔成功。
- `CCFG-API-014`（编辑自排除/数据源校验后端契约）与 `CCFG-API-016`（启用契约）：保留既有唯一性分配规则，追加说明“目标 DML 前全量重读后的当次检查是最终应用层校验，但不是并发强一致唯一保证；极端并发边界与批准需求一致（见 DESIGN.md §7）”。
- 错误码表删除 `| 50050 | LOCK_WAIT_TIMEOUT | ... |` 行（见 §6）。
- `CCFG-API-017`（错误触发归类）：删除“锁等待超时（`ORA-30006`）→ `50050` 并回滚”分支；明确本 Feature 不产生 `50050 LOCK_WAIT_TIMEOUT`（不存在 `ORA-30006` 锁等待专用触发路径，已随并发口径调整删除），未捕获数据库异常按既有全局异常边界处理。
- §13 变更记录追加 2026-09-04 并发口径定向调整行。

### 4.3 UI.md

- 顶部状态元数据新增并发调整任务/日期行；说明本轮 UI 业务交互总体不变。
- `CCFG-UI-020`：删除“锁等待超时取 `50050` message”文案项；明确本 Feature 无“锁等待超时”用户文案（`50050 LOCK_WAIT_TIMEOUT` 已随并发口径调整从错误码契约删除，见 API.md）；保留 `40940`/`40941` 等冲突正文直接取后端 message 的口径，不新增“并发双成功”用户提示或模式开关。
- §15 变更记录追加 2026-09-04 并发口径定向调整行。

### 4.4 DATABASE.md

- 顶部状态元数据新增并发调整任务/日期行。
- `CCFG-DB-007`：探针 ID 大小写不敏感唯一与数据源唯一分配均明确为应用层业务规则，依托目标 DML 前全表重读与当次尽力写前检查实现，不依托任何表锁，也无物理强一致唯一约束，不新增任何 DDL 对象。
- `CCFG-DB-009`：由“定义 `LOCK TABLE CDC_CLIENT_MULTIPLE IN EXCLUSIVE MODE WAIT 5` SQL”改写为禁止项边界：本 Feature 不执行该 `LOCK TABLE`、不为唯一性主动加任何显式表锁、不产生 `ORA-30006 → 50050 LOCK_WAIT_TIMEOUT` 专用锁等待超时路径；代码中禁止新增或调用 `LOCK TABLE`、`SELECT ... FOR UPDATE` 锁行方案或 `DBMS_LOCK`。
- `CCFG-DB-010`：DML 前全量检查读取；明确该读取是普通一致性读，不阻止其他会话写入，检查结果只代表读取瞬间，不构成跨请求强一致唯一保证。
- §5 章节标题改为“事务与并发边界矩阵”；并发矩阵表头改为 `操作 | 普通事务 | DML 前全量重读 | 当次检查 | DML 写入 | 并发边界`，行内容：新增/编辑/启用为“是/是/当次检查内容/各自 DML/接受竞态（允许两笔都成功）”，停用/删除为“普通短事务、不重读全表”，列表/候选为“只读、展示占用快照、结果可能随后变旧”；矩阵下注明写操作行数必须为 1、失败整笔回滚、本 Feature 不主动执行显式表锁、矩阵无锁获取顺序与锁等待超时分支（`WAIT 5`/`ORA-30006 → 50050` 已删除）。
- `CCFG-DB-016`：新增/编辑/启用引用矩阵说明为“普通短事务 + DML 前全量重读 + 当次尽力写前检查 + DML”，不获取表锁、不存在锁等待超时分支；DML 前重读与 DML 之间允许竞态窗口，极端并发可能两笔都成功（已接受边界，见 CCFG-DB-017）。
- `CCFG-DB-017`：Oracle 一致性读与竞态边界：普通 `SELECT` 与写前检查重读均为一致性读、不取行锁/TM 锁，检查结果只代表读取瞬间，不构成跨请求强一致唯一保证；本 Feature 不主动执行显式表锁，不存在 `LOCK TABLE ... WAIT 5`/`ORA-30006 → 50050` 路径。
- `CCFG-DB-018`：明确不再把“短事务表锁串行写入”作为设计前提，也不引入显式锁、分布式锁或 DDL；小表全量读 + 普通短事务 + DML 前当次重读检查的开销可接受。
- §8 变更记录追加 2026-09-04 并发口径定向调整行。

## 5. 普通事务、写前检查、竞态窗口、DML 固有锁行为的边界说明

- 普通短事务：新增/编辑/启用写请求各自在单个普通数据库短事务内执行，事务内只有目标 DML 与必要的当次一致性读，不获取任何显式表锁/行锁（`DBMS_LOCK`、`LOCK TABLE`、`SELECT ... FOR UPDATE` 均不使用）。
- DML 前全量重读与当次尽力写前检查：在同一事务内、目标 DML 之前，重新读取 `CDC_CLIENT_MULTIPLE` 全部记录与所需候选/占用信息，完成探针 ID ASCII 大小写不敏感唯一、数据源跨探针唯一分配（编辑按 `originalClientId`、启用按目标记录自身排除）及候选可用性当次检查；发现冲突不执行 DML 并返回既有业务冲突；未发现冲突立即执行目标 DML。该检查是后端最终应用层校验，但不是并发强一致唯一保证。
- 竞态窗口：检查与 DML 之间、以及两个并发请求各自检查与提交之间存在竞态窗口；普通一致性读不阻止其他会话写入，检查结果只代表读取瞬间。本 Feature 明确接受该竞态，不通过显式锁、行锁、JVM 锁、分布式锁或 DDL 串行化消除。
- DML 固有锁行为边界：Oracle 执行普通 `INSERT`/`UPDATE`/`DELETE` 时可能产生的行锁、TM 锁是数据库 DML 固有副作用，不写成业务唯一性保证；本 Feature 不依赖也不宣称其消除竞态。
- 行数校验与回滚：写操作受影响行数必须等于 1；请求内校验失败、业务冲突、更新行数异常或任一步失败均整笔回滚，不产生部分写入。
- 已接受的并发结果：普通顺序冲突会被后提交者的当次检查拒绝并返回 `40940`/`40941`/`40942`；极端并发下允许一笔成功，也允许两笔在竞态窗口中都成功，本 Feature 不承诺“并发最多一个成功”。若两笔均成功形成重复，由列表/历史异常展示规则呈现（读取端处理，不属并发强一致保证）。
- 运行侧 `sync-client`/`sync-server` 使用配置时的重复检查为最终防线，但不属本 Feature 范围；设计文档不含对该运行侧机制的实现设计。

## 6. `50050` 删除及其他错误码不变的证据

API.md 错误码表相对起点（`a3beeefd...`）变更核验：

- 起点错误码定义行共 15 条：`40100/40101/40102/40103/40104/40105/40240/40440/40441/40940/40941/40942/50050/50051/50052`。
- 现行错误码定义行共 14 条：`40100/40101/40102/40103/40104/40105/40240/40440/40441/40940/40941/40942/50051/50052`。
- 唯一删除：`| 50050 | LOCK_WAIT_TIMEOUT | 200 | 并发 | 系统繁忙，等待配置数据锁超时，请稍后重试。 |`。
- 未新增任何错误码；其余 14 条错误码的编号、名称、HTTP 状态、类别与描述相对起点逐字不变，顺序不变。
- 保留的顺序冲突业务码：`40940`（探针 ID 冲突）、`40941`（数据源占用冲突）、`40942`（启用场景顺序冲突等，按既有契约）；这些业务码语义未因并发口径调整而变化，仅作为顺序冲突（非并发强保证）结果返回。

## 7. 实际修改的设计业务定义行清单与理由

逐一定义行相对起点变化（提取 diff 中 `| CCFG-` 定义行，-/+ 成对）：

| 文档 | 修改的定义行 | 修改理由（需求依据） |
|---|---|---|
| DESIGN.md | `CCFG-DESIGN-001/016/017/020/022/023/024/025/026/027/033`（11 行） | Service 职责、新增/编辑/启用流程、原子性、权威写前检查、锁边界/取舍/适用边界、已接受并发结果、测试方案随并发口径调整 |
| API.md | `CCFG-API-008/009/011/014/016/017`（6 行） | 写接口写入边界改普通事务+重读+当次检查；编辑/启用契约补充非并发强一致唯一说明；错误触发归类去除 `50050` 路径 |
| UI.md | `CCFG-UI-020`（1 行） | 删除锁等待超时用户文案项 |
| DATABASE.md | `CCFG-DB-007/009/010/016/017/018`（6 行） | 唯一性改为应用层规则+当次检查；表锁改禁止项；读取边界与事务矩阵、一致性读竞态边界、设计前提调整 |

此外的非编号结构性修订：四份文档顶部状态元数据行与并发调整说明段、API.md 接口清单表头与 E1~E7 读/写边界列、DATABASE.md §5 标题与并发边界矩阵、DESIGN.md §7 标题、四份文档变更记录各追加 1 行 2026-09-04 记录。

理由共性：按 2026-09-04 重新批准的需求/验收并发口径（`CCFG-REQ-038/068/071/072/074/077`、`CCFG-AC-030/056/058/059/061/064` 相关）删除过时表锁方案，不引入新业务语义，不影响需求编号/数量、设计编号/数量与覆盖。

## 8. 四类设计编号连续唯一、引用可解析

- `CCFG-DESIGN-001~037`：37 条定义行，编号连续且唯一。
- `CCFG-API-001~020`：20 条定义行，编号连续且唯一。
- `CCFG-UI-001~026`：26 条定义行，编号连续且唯一。
- `CCFG-DB-001~022`：22 条定义行，编号连续且唯一。
- 各文档定义行中的交叉引用（如 `见 DESIGN.md §7`、`见 CCFG-DB-017`、`见 API.md`、`见 DATABASE.md §4/§5`）经抽查均可解析到现存章节或定义行；未发现重复定义或不可解析引用。
- 错误码引用与错误码表一致：正文不再存在指向 `50050 LOCK_WAIT_TIMEOUT` 的正向契约。

## 9. 需求设计覆盖 90/90、验收设计覆盖 76/76

对四份设计文档全部 `| CCFG-` 定义行的覆盖/追踪引用做并集核验：

- 需求引用并集覆盖 90/90：`CCFG-REQ-001~090` 全部至少被一个设计定义行引用，缺项为空。
- 验收引用并集覆盖 76/76：`CCFG-AC-001~076` 全部至少被一个设计定义行引用，缺项为空。

覆盖建立在需求/验收各 90/76 条定义行之上（见 §11）。

## 10. REQUIREMENTS/ACCEPTANCE 零差异

- `git diff --stat <base> -- REQUIREMENTS.md ACCEPTANCE.md`：空。
- 90 条需求定义行（`^| CCFG-REQ-`）相对起点逐字零差异；76 条验收定义行（`^| CCFG-AC-`）相对起点逐字零差异。
- 状态与业务行均未被本任务触碰：`REQUIREMENTS.md`/`ACCEPTANCE.md` 保持 `APPROVED`，76 条验收执行状态保持全部 `NOT_RUN`。

## 11. 状态仍为设计草案、实现未开始、验收未执行

- 四份设计文档状态保持 `DRAFT_PENDING_USER_REVIEW`、`PENDING_USER_CONFIRMATION=0`，不得写成已批准基线；设计适用性标记由 `STALE_LOCK_DESIGN_PENDING_DESIGN_REVISION` 更新为 `DESIGN_CONCURRENCY_ADJUSTED_PENDING_FORMAL_REVIEW`（该标记只出现在状态文档/索引/README 与本报告，不出现在设计文档内部）。
- 需求/验收 `APPROVED`（90/76），76 条验收用例全部 `NOT_RUN`，未执行正式验收。
- 实现状态仍为 `NOT_STARTED`：未实现任何页面、接口或写库能力；本任务不把设计调整写成实现完成或可批准。
- 调整后设计文档仍需 ChatGPT 正式设计 R1 复审与项目负责人批准后才可进入实现阶段（下一入口见 §16）。

## 12. 强制全文扫描残留分类

对四份设计文档执行不区分大小写强制扫描，覆盖 `LOCK TABLE / EXCLUSIVE MODE / WAIT 5 / ORA-30006 / 50050 / LOCK_WAIT_TIMEOUT / 表级互斥锁 / 表锁 / 锁内 / 锁等待 / 最多一个成功 / 最多一笔成功 / 串行化 / 堵住竞态`。现行有效设计中不存在正向表锁/锁超时/并发强保证语义。全部命中均已人工分类，仅以下类型允许：

- 顶部状态元数据与并发调整说明段（DESIGN/API/UI/DATABASE）：描述“已按批准口径清除过时显式表锁设计”的过程性说明（如 `CCFG-DESIGN-024`、`CCFG-DB-009`、`CCFG-API-017`、`CCFG-UI-020` 中的否定/禁止句）。
- 明确禁止性语句：本 Feature 不执行 `LOCK TABLE ...`、不产生 `ORA-30006 → 50050`、不存在 `50050`、不承诺“并发最多一个成功”、不以任何串行化机制消除竞态（`CCFG-DESIGN-024/025/026/027`、`CCFG-API-008/009/011/017`、`CCFG-UI-020`、`CCFG-DB-007/009/010/016/017`、矩阵注记）。
- 只读端点“无表锁/不取锁（Oracle 一致性读）”否定表述（`CCFG-API-004/006`、`CCFG-DB-022` 等）。
- 测试方案中以“不主动执行 `LOCK TABLE`、不存在专用 `50050` 路径、不以‘并发最多一个成功’为通过标准”出现的否定表述（`CCFG-DESIGN-033`）。
- 四份文档变更记录新增的 2026-09-04 行：描述本任务清除过时方案的变更历史。

## 13. 所有未执行和禁止事项

- 未连接数据库，未执行任何 DDL/DML/SELECT 之外操作：数据库写操作 `NOT_REQUESTED`；本任务未发起任何数据库连接。
- 未访问或修改 ZooKeeper、Kafka、Topic：`NOT_REQUESTED`。
- 未启停、重启或通知任何服务和进程：`NONE`。
- 未修改任何代码、测试、构建配置或数据库基线：`NOT_APPLICABLE`。
- 未运行后端/前端构建或测试：`NOT_RUN_NOT_REQUIRED_DOCS_ONLY`。
- 未修改任何需求或验收业务定义行（§10 零差异）。
- 未修改设计编号、未删除/重排任何编号、未引入新编号。
- 未运行功能验收；76 条验收用例未改为 `PASS`。
- 实现状态未写成已实现；设计状态未写成 `APPROVED`。
- 未改写任何历史报告；未修改 `.claude/settings.json`、`.claude/skills/**`、`CLAUDE.md`、`docs/baseline/` 六份正式项目级基线。
- 未清理或提交工作区中的其他任务文件；未执行 `git fetch`/`git pull`/`git merge`/`git rebase`。
- `PENDING_USER_CONFIRMATION=0`。

## 14. 强制验证汇总表

| 验证项 | 方法 | 结果 |
|---|---|---|
| 分支/远程一致 | `git branch --show-current`、`git rev-parse HEAD`、`git rev-parse origin/develop`、`git ls-remote origin refs/heads/develop`、`git rev-list --left-right --count HEAD...origin/develop` | `develop`，四者均 `a3beeefd...`，ahead/behind `0 0` |
| `git diff --check` | 白名单 6 个已改文件 | 通过（无空白错误） |
| 实际变更文件 | `git status --short` + `git diff --name-only <base>` 白名单范围 | 严格 7 文件：`client-config/DESIGN.md`、`client-config/API.md`、`client-config/UI.md`、`client-config/DATABASE.md`、`client-config/README.md`、`features/README.md`、本报告（新增）；无越界 |
| 需求/验收 blob 零差异 | `git diff --stat <base> -- REQUIREMENTS.md ACCEPTANCE.md` + 定义行 diff | 90 需求、76 验收逐字零差异；文档保持 `APPROVED`、76 条验收全部 `NOT_RUN` |
| 设计定义数量 | 提取 `^| CCFG-DESIGN/API/UI/DB-` 行 | 37/20/26/22，编号各自连续、唯一 |
| 无重复/无悬空引用 | 编号集合与文档内引用抽查 | 通过 |
| 覆盖 | 四文档定义行引用并集 | 需求设计覆盖 90/90，验收设计覆盖 76/76 |
| 现行设计过时语义 | §12 强制全文扫描 + 人工分类 | 无可执行 `LOCK TABLE ... WAIT 5`；无 `ORA-30006 → 50050` 契约；无 `50050 LOCK_WAIT_TIMEOUT` 错误码；无“并发最多一个成功”保证；新增/编辑/启用均有 DML 前全量重读当次检查；明确接受极端并发双成功边界；不把普通 DML 固有锁行为写成业务唯一性保证 |
| 设计状态 | 四文档顶部/页尾 | 均保持 `DRAFT_PENDING_USER_REVIEW`、`PENDING_USER_CONFIRMATION=0`；未出现设计已批准表述 |
| 状态文档同步 | `client-config/README.md`、`features/README.md` 当前态单元 | 适用性标记更新为 `DESIGN_CONCURRENCY_ADJUSTED_PENDING_FORMAL_REVIEW`，报告导航新增本报告，下一入口更新为 `CHATGPT_FORMAL_DESIGN_CONCURRENCY_ADJUSTMENT_REVIEW`；历史变更记录行保持原样 |

## 15. Commit / Push 结果与核验

- 建议提交信息：`docs(client-config): align design with approved concurrency policy`
- 逐个按完整文件名暂存本任务白名单内 7 个文件（4 份设计文档 + 2 份 README + 本报告），禁止 `git add .` / `git add -A`。
- 普通 Push 到 `origin/develop`，禁止 force push、禁止操作其他分支。
- 完成后核验本地 `HEAD == origin/develop == git ls-remote`，ahead/behind 为 `0 0`。
- 本报告不预填包含自身的最终提交 ID；最终提交 ID、Push 状态与远程核验结果在 Push 后的控制台结果块（§17 `AGENT_TASK_RESULT`）输出。

## 16. 下一入口

```text
CHATGPT_FORMAL_DESIGN_CONCURRENCY_ADJUSTMENT_REVIEW
```

四份设计文档并发口径调整已完成（从设计草案移除已过时的 `LOCK TABLE ... WAIT 5`/`ORA-30006 → 50050` 及并发“最多一个成功”表述，按已重新批准的需求并发口径统一为普通短事务 + DML 前全量重读 + 当次尽力写前检查 + DML）。需求与验收保持 `APPROVED`（90/76，全部 `NOT_RUN`）。下一独立入口为对设计并发口径调整结果进行 ChatGPT 正式设计 R1 复审；复审通过并批准收口前，四份设计文档保持 `DRAFT_PENDING_USER_REVIEW`（标记 `DESIGN_CONCURRENCY_ADJUSTED_PENDING_FORMAL_REVIEW`），不可批准、不可用于实现；实现状态保持 `NOT_STARTED`、76 条验收保持全部 `NOT_RUN`。不得直接写成“设计已可批准”，也不得直接进入实现阶段。
