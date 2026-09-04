# CLIENT-CONFIG-CONCURRENCY-REQUIREMENTS-ADJUSTMENT-001-R1 执行报告

## 1. 任务身份

```text
task_code=CLIENT-CONFIG-CONCURRENCY-REQUIREMENTS-ADJUSTMENT-001-R1
task_type=并发口径需求调整正式复审后的定向文档修订（纯文档）
repository=https://github.com/acmilan1982/cdc-config-platform
branch=develop
known_base_commit=6071d7aff31cb36321831fcd455c298d379551f3
feature=client-config
page_name=探针端管理
route=/config/client
report_path=docs/features/client-config/reports/CLIENT-CONFIG-CONCURRENCY-REQUIREMENTS-ADJUSTMENT-001-R1.md
next_entry=CHATGPT_FORMAL_REQUIREMENTS_ADJUSTMENT_R1_REVIEW
```

本任务只修正正式复审（`CHANGES_REQUIRED`）发现的文档一致性与验收可执行性问题（R1-01～R1-04），不改变项目负责人已确认的并发业务口径，不修改设计文档，不实现代码，不执行验收，不自行批准需求。

## 2. 正式复审结论

```text
formal_review_result=CHANGES_REQUIRED
```

ChatGPT 对并发口径调整首版结果提交 `6071d7aff31cb36321831fcd455c298d379551f3` 的正式需求调整复审结论为 `CHANGES_REQUIRED`。主体业务调整正确（取消 Oracle 显式表锁与并发“最多一个成功”强保证；保留新增/编辑/启用的后端写前检查、停用不释放、冲突提示、历史重复异常展示与运行侧最终防线），本轮不重写该主体口径，只处理 R1-01～R1-04。

## 3. 实际基线

- 分支：`develop`
- 本地 `HEAD`：`6071d7aff31cb36321831fcd455c298d379551f3`
- `origin/develop`：`6071d7aff31cb36321831fcd455c298d379551f3`（`git ls-remote` 同值）
- ahead/behind：`0 0`
- `git fetch origin develop`：已执行，与预检一致。
- 文档状态：
  - `REQUIREMENTS.md`：`DRAFT_PENDING_USER_REVIEW`
  - `ACCEPTANCE.md`：`DRAFT_PENDING_USER_REVIEW`
  - `DESIGN.md`/`API.md`/`UI.md`/`DATABASE.md`：`DRAFT_PENDING_USER_REVIEW`，适用性 `STALE_LOCK_DESIGN_PENDING_REQUIREMENTS_APPROVAL`（本轮零改动）
  - 实现状态：`NOT_STARTED`
  - 76 条验收执行状态：全部 `NOT_RUN`
  - `PENDING_USER_CONFIRMATION=0`

## 4. Git 与工作区现场

开始前记录 `git status --short --branch`：当前为 `develop...origin/develop`。工作区存在大量与本任务无关的既有修改与未跟踪文件（前端布局/样式、`.claude/settings.local.json`、`agent-env.sh`、`docs/database/` 删除、`docs/agent-prompts/`、`docs/features/app-shell|large-screen/`、`package-lock.json` 等）。本任务只修改白名单内 5 个文件，对其余内容一律不修改、不覆盖、不暂存、不提交。未发现目标文件存在无法安全区分的既有修改。

## 5. R1-01～R1-04 逐项修订证据

### R1-01：清除 REQUIREMENTS.md 与 ACCEPTANCE.md 的当前状态残留

- `REQUIREMENTS.md` §1.1 说明段：已把“本需求基线已经正式批准”“下一入口为设计基线”“本文件不建立或宣称任何设计文档”等旧现时态改写为分层表述：2026-09-03 批准仅作为旧口径历史事实保留；当前现行状态是并发口径调整后的 `DRAFT_PENDING_USER_REVIEW` 草案，尚未经本轮正式复审通过和项目负责人重新批准；当前下一入口是 `CHATGPT_FORMAL_REQUIREMENTS_ADJUSTMENT_R1_REVIEW`，不是设计基线；四份设计文档已作为既有草案存在、含已过时 `LOCK TABLE ... WAIT 5` 方案，本调整及其 R1 不修改既有设计草案。
- `REQUIREMENTS.md` §1.2 标题与正文：记录“首版调整结果经 ChatGPT 正式复审 `CHANGES_REQUIRED`（R1-01~R1-04），R1 定向修订已完成，当前等待 ChatGPT 对 R1 结果正式复审（`CHATGPT_FORMAL_REQUIREMENTS_ADJUSTMENT_R1_REVIEW`）与项目负责人批准”。
- `REQUIREMENTS.md` §5.2 范围外表述：原“本任务只建立需求与验收草案，不建立 DESIGN/API/UI/DATABASE”改为准确指向“本任务（并发口径需求调整及其 R1 定向修订）只修订需求与验收草案，不建立 DESIGN/API/UI/DATABASE（四份设计文档已作为既有草案存在，本调整及其 R1 修订不修改它们），不实现任何代码”。
- `ACCEPTANCE.md` §2：“截至本批准收口，没有任何用例被执行”改为“截至当前草案，没有任何用例被执行（2026-09-03 旧口径批准只批准‘验收标准’，不改变这一结论）”；§2 现时态声明同步限定为待 R1 正式复审与重新批准；§1 文档状态、任务编号等元数据同步记录 R1 阶段。未改变任何验收业务含义。
- 定向扫描确认：四份目标文档不再出现“已经正式批准”“下一入口为设计基线”“本文件不建立或宣称任何设计文档”等旧现时态。

### R1-02：纠正表锁方案的批准历史归属

- 正确归属记录于 `REQUIREMENTS.md` §1.1 说明段：2026-09-03 获批的是旧口径需求/验收中的“并发最多一个成功”目标；当时需求只要求后续设计确定事务/锁/原子方案，未批准任何具体表锁语句；`LOCK TABLE CDC_CLIENT_MULTIPLE IN EXCLUSIVE MODE WAIT 5` 是后来形成的设计草案，始终未获项目负责人批准；本轮需求调整取消该并发强保证并明确不使用该显式表锁，故既有设计草案已过时。
- `docs/features/client-config/README.md` §4 旧口径批准历史：把“批准只覆盖旧口径（含并发‘最多一个成功’强承诺与表锁方案）”改写为“该次批准只覆盖旧口径的并发强保证目标（并发‘最多一个成功’强承诺；当时需求只要求后续设计确定事务/锁/原子方案，未批准任何具体表锁语句，`LOCK TABLE ... WAIT 5` 是随后形成、始终未获项目负责人批准的设计草案方案）”。
- `docs/features/README.md`：`client-config` 当前索引行的基线状态说明与 2026-09-04 变更记录，把“为保证唯一分配执行 Oracle `LOCK TABLE`、并发最多一笔成功”分别表述为“旧需求的并发强保证（数据源唯一分配、并发最多一笔成功）”与“后续未批准设计草案为实现该强保证提出的表锁方案（本轮已过时）”。
- 历史报告一律未改写；本 R1 报告记录纠正后的解释。

### R1-03：消除探针 ID 并发规则内部矛盾并修正验收数据

- `CCFG-REQ-038`：唯一性表述明确限定为“在普通顺序新增/编辑及当次写前检查的目标规则下……当次检查能够看到既有冲突时必须拒绝保存”；新增/编辑拒绝条件均加“当次检查/当次检查看到”限定；明确“前端可提前校验，但后端保存前必须执行最终校验，不得因下述并发例外弱化普通操作或绕过前端直接调用时的后端检查”；并发语义改为“只约束普通顺序新增/编辑及当次写前检查；不通过 Oracle 显式表锁把校验与写入串行化。极端并发竞态是明确例外：当次检查通过后、写入完成前另一请求可能已先写入，两个请求可能先后都成功并产生仅大小写不同的多条记录；……不属于本 Feature 验收失败”。已消除“前半段无条件唯一、后半段接受重复”的内部语义冲突。
- `CCFG-AC-030`：并发子场景④改用库内原本不存在、且不受既有 `probe-001` 前置条件影响的一组新 ID `race-001`/`RACE-001`；明确两个请求各自执行写前检查、允许只成功一笔、也允许两笔都在竞态窗口内先后成功（可产生仅大小写不同的多条记录）、不以“最多一个成功”作为通过标准、不得出现因 Oracle 显式表锁返回锁等待超时的业务错误；明确 `probe-001` 只服务顺序场景①与绕过前端场景③，不得使并发场景变成“两笔都因 `probe-001` 冲突而失败”。既有 `probe-001` 前置条件未污染并发子场景预期。

### R1-04：使 CCFG-AC-058 成为可实际执行的场景

- 原“通过接口直接提交一份把该数据源分配给两个探针的请求”不可执行（单次新增/编辑请求只操作一条探针记录），已改为明确的顺序场景：
  1. 数据源 `ds-x` 已由启用探针 A（`probe-a`）占用；
  2. 前端候选列表已把 `ds-x` 标为不可选（“已分配给：probe-a”）；
  3. 绕过前端，直接调用探针 B（`probe-b`，库内原本不存在）的新增接口，用一次针对单条探针记录的请求提交 `DATA_SOURCE_ID` 含 `ds-x`（若以编辑方式取证，可对另一条尚未占用 `ds-x` 的既有探针记录调用编辑接口把 `ds-x` 加入其采集数据源）；
  4. 后端在探针 B 新增/编辑执行 DML 前重新读取 `CDC_CLIENT_MULTIPLE` 全表，发现 `probe-a` 的既有占用，拒绝探针 B 的请求并给出明确冲突提示。
- 预期明确：该场景是普通顺序操作下一次针对另一探针的新增/编辑请求的尽力写前检查，不使用 Oracle 显式表锁，不宣称消除并发竞态。

## 6. 批准链纠正

已把“旧批准覆盖并发强承诺 + 表锁方案”的错误/易误解表述纠正为：

- 2026-09-03 批准覆盖对象是旧口径需求与验收中的并发“最多一个成功”目标（旧需求只要求后续设计确定事务/锁/原子方案）；
- `LOCK TABLE ... WAIT 5` 表锁语句是后续形成的设计草案内容，始终未获批准，并因本轮需求调整已过时。

批准历史事实保留（不改写历史报告），仅同步修正状态类文档中的归属表述。

## 7. 业务行差异白名单

本轮需求/验收业务行差异严格限定为：

```text
CCFG-REQ-038
CCFG-AC-030
CCFG-AC-058
```

其他 89 条需求与 74 条验收业务行相对起点 `6071d7a...` 逐字零差异（用 `git show <base>:<file> | grep '^| CCFG-REQ-'` 与当前文件相应行 diff 验证：仅上述三条业务行各自出现单一变更 hunk）。

`CCFG-REQ-068/071/072/074/077` 与 `CCFG-AC-056/059/061/064` 的新并发主体语义保持不变，未触碰。

## 8. 强制验证结果

| 验证项 | 命令/证据 | 结果 |
|---|---|---|
| 分支/远程一致 | `git branch --show-current`、`git rev-parse HEAD`、`git ls-remote origin refs/heads/develop` | `develop`，三者均 `6071d7af...`，ahead/behind `0 0` |
| `git diff --check` | 全工作区执行 | 通过（无空白错误） |
| 实际变更文件 | `git status --short` 白名单范围 | 严格 5 文件：`REQUIREMENTS.md`、`ACCEPTANCE.md`、`client-config/README.md`、`features/README.md`、本 R1 报告（新增）；无越界 |
| 需求定义行 | 提取 `^| CCFG-REQ-` 行 | 90 条，`CCFG-REQ-001~090` 连续、唯一 |
| 验收定义行 | 提取 `^| CCFG-AC-` 行 | 76 条，`CCFG-AC-001~076` 连续、唯一；执行状态全部 `NOT_RUN`（76/76） |
| 覆盖核验 | §5 追踪矩阵去重 + AC 关联需求列引用检查 | 需求→验收覆盖 90/90，无悬空引用 |
| 业务行差异 | 需求/验收业务行 diff | 仅 `CCFG-REQ-038`、`CCFG-AC-030`、`CCFG-AC-058`；其他 89/74 行零差异 |
| 设计零差异 | `git diff --stat <base> -- DESIGN.md API.md UI.md DATABASE.md` | 空（零差异） |
| 定向扫描 | 状态/下一入口/批准链/并发规则文本 | R1-01~R1-04 全部满足（见 §5） |

## 9. 所有未执行和禁止事项

- 未运行后端/前端构建与测试：`NOT_RUN_NOT_REQUIRED_DOCS_ONLY`。
- 未连接数据库，未执行任何 DDL/DML：`NOT_RUN_NOT_AUTHORIZED` / `NONE`。
- 未访问 ZooKeeper / Kafka / sync 进程：`NOT_RUN_NOT_AUTHORIZED`。
- 未启停任何服务：`NONE`。
- 未修改 `DESIGN.md`/`API.md`/`UI.md`/`DATABASE.md`（零改动）。
- 未改写任何历史报告。
- 未新增/删除/重排/复用需求或验收编号；未自行批准需求；未执行验收；`PENDING_USER_CONFIRMATION=0`。
- 状态未写成 `APPROVED`、验收通过、已实现或设计可用于实现。

## 10. Commit / Push 计划

- 建议提交信息：`docs(client-config): refine concurrency requirement adjustment`
- 逐个按完整文件名暂存本任务白名单内 5 个文件，禁止 `git add .` / `git add -A`。
- 普通 Push 到 `origin/develop`，禁止 force push。
- 完成后核验本地 `HEAD == origin/develop == git ls-remote`，ahead/behind 为 `0 0`。
- 本报告不预填包含自身的最终提交 ID；最终提交 ID 与远程核验结果只在 Push 后的控制台结果块输出。

## 11. 下一入口

`CHATGPT_FORMAL_REQUIREMENTS_ADJUSTMENT_R1_REVIEW`：由 ChatGPT 对本次 R1 定向修订结果提交下的 `REQUIREMENTS.md`/`ACCEPTANCE.md`（90 需求/76 验收，全部 `NOT_RUN`）进行正式复审，并经项目负责人批准后，需求/验收才重新回到可批准状态；随后再对去除过时表锁方案后的四份设计文档进行正式 R1 复审（`CHATGPT_FORMAL_DESIGN_R1_REVIEW`），批准后才进入实现阶段。
