# 任务执行报告：数据订阅含逗号数据源 ID 查询兼容需求定向调整（DATA-SUBSCRIPTION-COMMA-ID-QUERY-REQUIREMENTS-ADJUSTMENT-001）

## 1. 任务元数据

| 项目 | 值 |
|---|---|
| 任务编号 | `DATA-SUBSCRIPTION-COMMA-ID-QUERY-REQUIREMENTS-ADJUSTMENT-001` |
| Feature | 数据订阅（`data-subscription`） |
| 任务性质 | 纯文档、单问题需求与验收标准定向调整草案（正式复审发现驱动） |
| 目标分支 | `develop` |
| 当前需求状态（调整前） | `APPROVED`（点号保留分隔符调整批准版本，批准依据提交 `bb8716c...`） |
| 当前验收标准状态（调整前） | `APPROVED`（同上） |
| 当前设计状态 | `DRAFT_PENDING_USER_REVIEW`（设计复审仍为 `CHANGES_REQUIRED`） |
| 当前实现状态 | `NOT_STARTED` |
| 当前验收执行状态 | 126 条全部 `NOT_RUN` |
| 前序设计 R1 提交 | `3609548238c9fede745f5291e258469ab7b78167`（本任务基准提交） |
| 前序设计 R1 正式复审结论 | `CHANGES_REQUIRED`（主要问题已落实，但发现含逗号 ID 查询与无转义 CSV 协议存在不可消除歧义） |
| 数据库访问 | 不需要，禁止访问 |
| 数据库写入及 DDL/DML | 禁止 |
| 业务代码、测试代码修改 | 禁止 |
| ZooKeeper、Kafka、`sync-client` 及其他业务进程操作 | 禁止 |

调整后状态：`requirements_status=DRAFT_PENDING_USER_REVIEW`、`acceptance_status=DRAFT_PENDING_USER_REVIEW`、`design_status=DRAFT_PENDING_USER_REVIEW`（四份设计文档零修改，仍为草案，待需求调整正式复审通过后执行设计 R2）、`implementation_status=NOT_STARTED`、`acceptance_execution_status=NOT_RUN`（126 条全部 `NOT_RUN`）。

## 2. 基准提交与 Git 现场

任务开始前记录（`git branch --show-current` / `git status --short` / `git rev-parse HEAD` / `git rev-parse origin/develop` / `git rev-list --left-right --count origin/develop...HEAD` / `git show --stat --oneline 3609548238c9fede745f5291e258469ab7b78167`）：

- 当前分支：`develop`。
- 本地 HEAD：`3609548238c9fede745f5291e258469ab7b78167`。
- `origin/develop`：`3609548238c9fede745f5291e258469ab7b78167`（与本地一致，ahead/behind = `0 0`）。
- 基准提交 `3609548...` 为本任务前序设计 R1 提交（`docs(data-subscription): revise design baselines R1`，6 个文件：DESIGN/API/UI/DATABASE、`docs/features/README.md`、`reports/DATA-SUBSCRIPTION-DESIGN-BASELINE-001-R1.md`）。
- 任务结果提交 / 远程提交 / ahead/behind / commit_status / push_status 在控制台 `AGENT_TASK_RESULT` 结果块输出，本报告不预先伪造尚未产生的提交号（遵循既有报告约定）。

## 3. 正式复审发现的问题

ChatGPT 对设计 R1 提交 `3609548...` 正式复审后确认：行锁并发、查询 OR/AND 分组、结构化 `sourceTables`、删除预览、`UUID32 + IdType.INPUT`、交叉引用、点号规则和 Schema 能力分层等主要问题已经落实。

但正式复审发现，已批准需求中的以下边界与当前逗号分隔存储协议存在不可消除的歧义：

> 查询候选中的存量数据源 ID 即使含英文逗号，也允许用于查询历史订阅，并且不得导致无法定位历史记录。

设计 R1 中使用 `INSTR(',' || col || ',', ',' || #{token} || ',') > 0` 并声称可以对含逗号 ID 做“完整 token 精确匹配”，该结论不成立：查询 `A,B` 会同时命中相邻 token `A`、`B`，存在不可消除的假阳性。该表达必须先在已批准需求与验收基线中诚实调整，之后才能进入设计 R2。

## 4. 为什么无转义 CSV 无法精确识别含逗号 ID

当前物理协议为：

```text
DATA_FROM_SOURCE_ID：英文逗号分隔数据源 ID
DATA_TO_SOURCE_ID：英文逗号分隔数据源 ID
```

第一版没有引号、转义符、长度前缀或独立关联表（已批准 `DSUB-REQ-016/017` 明确“无引号/转义符/长度前缀机制”，`DSUB-REQ-013/015` 明确英文逗号用于多值项分隔）。因此原始字符串：

```text
A,B
```

无法区分以下两种含义：

```text
一个数据源 ID：A,B
两个数据源 ID：A 与 B
```

同理，目标库字段中的 `A,B,C` 无法判断是三个普通 ID、一个含逗号 ID 加一个普通 ID，还是其他组合。

当查询 ID 本身含英文逗号时，`INSTR(',' || col || ',', ',' || #{token} || ',') > 0` 无法精确定位该 ID：`col = 'A,B'`（单个含逗号 ID）与 `col = 'A,B,C'`（多个普通 ID）在 CSV 层面都是“以逗号分隔的 token 序列”，系统无法区分逗号属于 ID 内容还是 token 分隔符；查询 `A,B` 时 `INSTR` 会在 `A`、`B` 各自作为独立 token 的行上命中，产生假阳性。因此含逗号候选只能采用“历史兼容可能匹配”语义。

## 5. 本次批准前草案规则

本任务为需求调整草案，尚未获得正式复审批准。草案确立以下规则：

- 查询候选仍来自 `CDC_DATA_SOURCE`，仅返回 `FG_ACTIVE=1` 且类别匹配的数据源，不包含停用或不存在的数据源；
- 查询候选不得因为 ID 含英文逗号或英文句点而被静默隐藏；
- 含逗号候选仍可选择，但必须明显标记为“历史兼容模糊查询”（如“含逗号，历史兼容查询可能存在歧义”）；
- 查询结果对含逗号候选采用“可能匹配”语义，明确可能包含歧义记录，不得静默丢弃可能相关的历史记录；
- 普通 ID 与仅含句点 ID 继续按去除首尾空白后的完整 token 字面精确匹配；
- 新增/编辑维护候选的禁用规则不变（ID 含英文逗号或英文句点仍禁止用于新增/编辑）；
- 多源库异常记录“整行警示、无任何操作”规则不变；
- 不引入引号、转义符、长度前缀、新关联表或数据迁移。

## 6. 普通 ID、仅含句点 ID、含逗号 ID 三类语义对照

| 候选类别 | 是否返回查询候选 | 是否可选 | 是否显示警告 | 查询匹配语义 |
|---|---|---|---|---|
| 不含英文逗号的 ID | 是（`FG_ACTIVE=1` 且类别匹配） | 是 | 否 | 按 CSV 拆分后的完整 token 精确匹配；token 比较前去除首尾空白；不得使用 `%ID%` 子串匹配；`%`、`_`、反斜杠或正则元字符按字面值处理；`S01` 不误匹配 `S012` |
| 含英文句点但不含英文逗号的 ID | 是（同上） | 是 | 否 | 仍是普通候选，英文句点不是 `DATA_FROM_SOURCE_ID`/`DATA_TO_SOURCE_ID` 这两个 CSV 字段的分隔符，按完整 token 精确匹配 |
| 含英文逗号的 ID | 是（同上，不静默隐藏） | 是 | 是（如“含逗号，历史兼容查询可能存在歧义”） | “历史兼容可能匹配”：查询只能在原始 CSV 字段中查找与该候选字面值相同的连续、分隔边界完整的片段；返回“可能匹配记录集合”，可能包含由多个相邻普通 ID 形成相同文本的歧义记录；不得要求后端伪造精确识别 |

三类候选可同时存在于同一查询组的条件中，组内仍按 `OR`；如果一次查询包含任意含逗号候选，页面必须显示查询歧义警告。

## 7. 修改文件清单

修改（授权范围内 3 个）：

1. `docs/features/data-subscription/REQUIREMENTS.md`
2. `docs/features/data-subscription/ACCEPTANCE.md`
3. `docs/features/README.md`（仅 `data-subscription` 一行与变更记录）

新增（授权范围内 1 个）：

4. `docs/features/data-subscription/reports/DATA-SUBSCRIPTION-COMMA-ID-QUERY-REQUIREMENTS-ADJUSTMENT-001.md`（本报告）

未修改：`DESIGN.md`、`API.md`、`UI.md`、`DATABASE.md`、所有既有报告、`docs/baseline/`、`docs/database/`、`docs/features/large-screen/`、任何 Java/Vue/TypeScript/JavaScript/SQL/配置/测试文件、其他 Feature 文档。

## 8. REQUIREMENTS 定向差异

仅定向调整 `DSUB-REQ-033`、`DSUB-REQ-034` 及其紧邻的“查询候选边界”说明；其他 105 条需求业务行逐字保持。

- 文档状态：`APPROVED` → `DRAFT_PENDING_USER_REVIEW`（§1 元数据、§1 说明段均更新；上一正式批准版本及批准提交 `bb8716c...` 作为历史事实保留）。
- `DSUB-REQ-033`：保留“候选来自 `CDC_DATA_SOURCE`、`FG_ACTIVE=1`、类别匹配、不含停用或不存在数据源”，新增“查询候选不得因含英文逗号或英文句点被静默隐藏（只涉及列表查询候选，新增/编辑维护候选禁用规则不变）”与三类候选语义（不含逗号 ID 为普通候选、仅含句点 ID 仍为普通候选可精确匹配、含逗号 ID 仍返回可选但显示“含逗号，历史兼容查询可能存在歧义”警告标记）。
- 紧邻“查询候选边界”说明：更新为仅含句点候选仍是普通候选可精确匹配、含逗号候选标记警告并按“历史兼容可能匹配”返回可能匹配记录集合、不得要求后端把无转义 CSV 中的含逗号 ID 精确识别为单个 token。
- `DSUB-REQ-034`：保留 OR/OR/AND、点击“查询”才执行、重置只清空表单、无结果提示规则，新增 A/B/C 确定语义——A 不含逗号 ID 按 CSV 拆分后的完整 token 精确匹配（去首尾空白、禁 `%ID%` 子串、`%`/`_`/反斜杠/正则元字符按字面值、`S01` 不误匹配 `S012`、仅含句点 ID 适用本规则）；B 含逗号 ID 诚实定义为“历史兼容可能匹配”（不得称为精确 token 匹配，返回可能匹配记录集合，页面提供明确警告，不得静默丢弃可能相关历史记录，不设计引号/转义符/长度前缀/关联表/迁移）；C 多条件组合 OR/OR/AND 不变、普通精确条件与含逗号可能匹配条件可同组且组内 OR、任一组含逗号候选时页面显示查询歧义警告。
- §19 变更记录追加本任务行；末尾关联文档追加本报告引用。

## 9. ACCEPTANCE 定向差异

仅定向调整 `DSUB-AC-032`、`DSUB-AC-033`、`DSUB-AC-034`、`DSUB-AC-035` 及与其直接相关的追踪说明；其余 122 条验收业务行逐字保持；126 条全部保持 `NOT_RUN`。

- 文档状态与“依据需求”状态：`APPROVED` → `DRAFT_PENDING_USER_REVIEW`（§1 元数据、§1 状态说明段均更新；上一正式批准版本及批准提交 `bb8716c...` 作为历史事实保留）。
- `DSUB-AC-032`：覆盖候选仅含启用且类别匹配数据源、含逗号/句点 ID 不被静默移除、仅含句点候选保持普通可选、含逗号候选可选但显示明确歧义警告。
- `DSUB-AC-033`（源库组）与 `DSUB-AC-034`（目标库组）：分别覆盖两个普通 ID 之间为 OR、token 去首尾空白后精确匹配、`S01` 不误匹配 `S012`、`%`/`_` 等字符按字面值处理、仅含句点 ID 可精确匹配、选择含逗号候选时返回可能匹配集合并显示歧义警告、验收承认 `A,B` 歧义无法从当前物理字段消除（不得要求后端伪造精确识别）。
- `DSUB-AC-035`：组间 AND 不变、任一组包含含逗号候选时仍按组间 AND 执行、页面持续展示歧义警告。
- 在 `DSUB-AC-035` 后新增紧邻“查询歧义补充说明”（不新增验收编号），说明无引号/转义符/长度前缀协议下 `A,B` 的歧义、三类匹配语义与验收边界。
- §5 追踪说明补充“含逗号候选历史兼容可能匹配与歧义警告 → DSUB-AC-032~035”覆盖映射。
- §6 变更记录追加本任务行；末尾关联文档追加本报告引用。

## 10. 107/126 编号与追踪验证

- `DSUB-REQ-001` ~ `DSUB-REQ-107` 恰好 107 条、连续、唯一，未新增、删除或重编号；仅 `DSUB-REQ-033/034` 及紧邻说明发生业务语义变化，其余 105 条需求业务行逐字保持。
- `DSUB-AC-001` ~ `DSUB-AC-126` 恰好 126 条、连续、唯一，未新增、删除或重编号；仅 `DSUB-AC-032~035` 及紧邻补充说明、追踪说明发生业务语义变化，其余 122 条验收业务行逐字保持。
- 126 条验收全部 `NOT_RUN`（0 条非 `NOT_RUN`）。
- 验收到需求映射无悬空：`DSUB-AC-032` → `DSUB-REQ-033`；`DSUB-AC-033/034/035` → `DSUB-REQ-034`，均指向真实存在的需求。
- 覆盖校验完整：每条需求至少被一条验收用例引用；含逗号候选语义已由 `DSUB-AC-032~035` 覆盖。

## 11. 设计文档零修改验证

- `DESIGN.md`、`API.md`、`UI.md`、`DATABASE.md` 相对基准提交 `3609548...` **零 diff**（`git diff 3609548 -- DESIGN.md API.md UI.md DATABASE.md` 为空）。
- 四份设计文档文档状态仍为 `DRAFT_PENDING_USER_REVIEW`；设计复审仍为 `CHANGES_REQUIRED`（`design_review_status=CHANGES_REQUIRED`）。
- 设计 R1 中 `INSTR(',' || col || ',', ',' || #{token} || ',') > 0` 对含逗号 ID “完整 token 精确匹配”的表述仍存在于设计文档（DESIGN §7.1、DATABASE §4.1），本任务不修改设计文档，该表述将在本需求调整草案正式复审通过后的设计 R2 中统一修正。
- 设计状态声明：`design_documents_change_status=NONE`；设计 R2 尚未执行。

## 12. 代码、数据库和外部系统保护项

- 数据库访问：`NONE`；数据库写入：`NONE`；DDL/DML：`NONE`。
- 业务代码修改：`NONE`；测试代码修改：`NONE`。
- ZooKeeper：`NONE`；Kafka：`NONE`；`sync-client` 及其他业务进程操作：`NONE`。
- 未运行 Maven、npm 或前后端测试；未启动任何服务；未访问数据库（纯文档任务）。
- 未引入引号、转义符、长度前缀、新关联表或数据迁移；未修改 `DATA_SOURCE_TABLE` 三段点号协议；未修改多源库异常记录“整行警示、无任何操作”规则；未修改重复订阅、删除、并发等其他业务规则。

## 13. 任务开始前既有修改保护

- 任务开始前工作区存在大量与本任务无关的既有修改与未跟踪文件（如 `.claude/settings.local.json`、`agent-env.sh`、`frontend/src/**`、`docs/agent-prompts/**`、`docs/database/TASK3/4*` 删除、`docs/features/app-shell/` 与 `docs/features/large-screen/` 未跟踪目录等），本任务未清理、未回滚、未覆盖、未暂存、未提交任何既有修改。
- 本任务 3 个拟修改文件（REQUIREMENTS.md、ACCEPTANCE.md、docs/features/README.md）与 1 个拟新增文件（本报告）在开始前均无未提交修改，可安全处理。
- 未使用 `git add .`、`git add -A` 等全量暂存；只逐文件暂存本任务 4 个授权文件。
- 未执行任何破坏性 Git 命令。

## 14. 验证命令与结果

| # | 验证项 | 命令/方式 | 结果 |
|---|---|---|---|
| 1 | 当前分支为 `develop` | `git branch --show-current` | `develop` |
| 2 | REQUIREMENTS 状态为 `DRAFT_PENDING_USER_REVIEW` | `grep '^\| 文档状态 \|' REQUIREMENTS.md` | `DRAFT_PENDING_USER_REVIEW` |
| 3 | ACCEPTANCE 状态为 `DRAFT_PENDING_USER_REVIEW` | `grep '^\| 文档状态 \|' ACCEPTANCE.md` | `DRAFT_PENDING_USER_REVIEW` |
| 4 | `DSUB-REQ-001~107` 恰好 107 条、连续、唯一 | `grep -oE 'DSUB-REQ-[0-9]{3}'` 提取对比基准 | 107 条，连续唯一 |
| 5 | 仅 `DSUB-REQ-033/034` 及紧邻说明发生业务语义变化 | `git diff 3609548 -- REQUIREMENTS.md` 逐行比对 | 通过（其余 105 条逐字保持） |
| 6 | `DSUB-AC-001~126` 恰好 126 条、连续、唯一 | `grep -oE 'DSUB-AC-[0-9]{3}'` 提取对比基准 | 126 条，连续唯一 |
| 7 | 126 条全部 `NOT_RUN` | 非 `NOT_RUN` 状态计数 | 0 条非 `NOT_RUN` |
| 8 | 仅 `DSUB-AC-032~035` 及紧邻说明发生业务语义变化 | `git diff 3609548 -- ACCEPTANCE.md` 逐行比对 | 通过（其余 122 条逐字保持） |
| 9 | 验收到需求映射无悬空 | 逐条核对 `DSUB-AC-032~035` 关联需求 | 全部指向真实需求 |
| 10 | 文档明确普通 ID trim 后完整 token 精确匹配 | 检索 REQUIREMENTS/ACCEPTANCE | 通过 |
| 11 | 文档明确仅含句点 ID 仍可精确匹配 | 检索 REQUIREMENTS/ACCEPTANCE | 通过 |
| 12 | 文档明确含逗号 ID 只能“可能匹配”，存在不可消除的假阳性 | 检索 REQUIREMENTS/ACCEPTANCE | 通过 |
| 13 | 文档不存在“INSTR 可对含逗号 ID 精确匹配”或同义错误结论 | 检索本任务修改文档 | 通过（0 处错误结论；设计文档既有表述零修改，待 R2 统一修正） |
| 14 | 新增/编辑仍禁止使用含逗号或句点的 ID | `grep DSUB-REQ-016/017`、维护候选边界 | 通过（未改变） |
| 15 | 多源库异常规则未改变 | `grep DSUB-REQ-010~012` | 通过（逐字保持） |
| 16 | DESIGN/API/UI/DATABASE 相对基准提交零 diff | `git diff 3609548 -- DESIGN.md API.md UI.md DATABASE.md` | 零 diff |
| 17 | 设计状态仍为 `DRAFT_PENDING_USER_REVIEW` 且复审仍为 `CHANGES_REQUIRED` | `grep '^\| 文档状态 \|'` 四份设计文档 | 全部 `DRAFT_PENDING_USER_REVIEW`；复审 `CHANGES_REQUIRED` |
| 18 | 实现状态仍为 `NOT_STARTED` | `grep '^\| 实现状态 \|'` | `NOT_STARTED` |
| 19 | 大屏延期状态保持 | `grep DEFERRED_AFTER_DATA_SUBSCRIPTION_FEATURE_ACCEPTANCE` | 保持 |
| 20 | 未修改业务代码、测试代码或其他 Feature | `git diff --name-status` | 通过 |
| 21 | 未访问数据库、未执行 DDL/DML | 本任务未发起任何数据库连接 | 通过 |
| 22 | 未操作 ZooKeeper、Kafka、`sync-client` 或业务进程 | 本任务未发起任何外部系统操作 | 通过 |
| 23 | 未运行 Maven/npm/前后端测试 | 本任务未运行任何构建或测试命令 | 通过（纯文档任务无需运行） |
| 24 | 文档无密码、连接串、Token 或其他敏感信息 | 对 4 个文件执行敏感信息关键词扫描 | 无 |
| 25 | `git diff --check` | `git diff --check` | exit=0 |
| 26 | `git diff --name-status` 只包含 4 个授权文件 | `git diff --name-status` | 通过 |
| 27 | 任务开始前既有无关修改保持原样 | 提交前后对比 `git status --short` | 通过 |

本任务不运行 Maven、npm 或前后端测试，不启动服务，不访问数据库（纯文档任务）。

## 15. 后续步骤

- 本需求调整草案（`REQUIREMENTS.md`、`ACCEPTANCE.md` 当前版本）必须交由 ChatGPT 正式复审，结论为 `APPROVED` 后本草案方可收口为正式批准版本。
- 正式复审通过后再执行设计 R2：统一修正设计文档中 `INSTR` 对含逗号 ID “完整 token 精确匹配”的表述，落实普通 ID / 仅含句点 ID 精确匹配与含逗号候选“历史兼容可能匹配 + 歧义警告”的查询语义，并同步四份设计文档。
- 设计 R2 完成后仍需再次正式设计复审；实现阶段（`NOT_STARTED`）与 126 条验收（全部 `NOT_RUN`）尚未开始。

## 16. 最终状态声明

- 含逗号数据源 ID 的查询歧义已在需求和验收中诚实、确定地记录：无转义 CSV 协议无法精确识别含逗号 ID，含逗号候选为“历史兼容可能匹配”并显示歧义警告；
- 普通 ID 与仅含句点 ID 的去除首尾空白后完整 token 精确查询语义保持；
- 查询候选仍按启用状态和类别筛选，不静默隐藏含保留字符候选；新增/编辑禁用规则与其他业务需求未改变；
- 107/126 数量、编号、映射和 `NOT_RUN` 状态全部正确；
- 四份设计文档零修改，等待需求调整正式复审通过后的设计 R2；
- 本任务只是需求调整草案，不是正式批准、设计批准、功能实现或验收通过；`DRAFT_PENDING_USER_REVIEW` 状态必须在 ChatGPT 正式复审通过后另行收口。

---

*报告生成：DATA-SUBSCRIPTION-COMMA-ID-QUERY-REQUIREMENTS-ADJUSTMENT-001（正式复审发现驱动的纯文档需求/验收定向调整草案）。本任务只诚实记录含逗号 ID 查询歧义与三类查询语义；需求/验收仍为草案待正式复审，设计文档零修改待 R2，功能未实现，126 条验收未执行。*
