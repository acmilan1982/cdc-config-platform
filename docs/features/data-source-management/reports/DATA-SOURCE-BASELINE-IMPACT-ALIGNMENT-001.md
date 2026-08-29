# DATA-SOURCE-BASELINE-IMPACT-ALIGNMENT-001 — 已批准数据源管理规则向权威项目/数据库基线一致性调整执行报告

> 任务类型：已批准业务规则向权威项目/数据库基线的纯文档同步
> 目标分支：`develop`
> 授权基准提交：`fed87640e007967ece60c1dad5e83438e2bc4672`
> 最终提交 ID：见控制台结果块 `result_commit_id`（本报告不伪造尚未产生的 Commit ID）
> 报告日期：2026-08-29

---

## 1. 任务结论、授权基准和完整批准链

### 1.1 任务结论

本任务把已批准的数据源管理（`data-source-management`）Feature 业务规则准确传播到当前权威项目级与数据库基线，消除了当前权威文档中仍存在的"`CDC_DATA_SOURCE_EXTEND` 每数据源一对一且必填"旧目标规则。任务只做文档同步，未重新设计 Feature、未改变数据库物理事实、未进入代码实现。全部 10 个已授权现行权威文件已完成同步，1 个执行报告文件已新增，机械检查全部通过，已提交并推送。

### 1.2 授权基准与完整批准链

| 阶段 | 提交 | Commit Message |
|---|---|---|
| 需求基线初稿 | `07a17921c025165d846e1ea238bc8c078db3d573` | docs(data-source-management): establish requirements baseline draft [DATA-SOURCE-REQUIREMENTS-BASELINE-001] |
| 需求基线 R1 修订 | `ca4d87be367cf69382bb55ab7800c17e0549c924` | docs(data-source-management): repair acceptance traceability [DATA-SOURCE-REQUIREMENTS-BASELINE-001-R1] |
| 需求与验收批准收口（授权基准） | `fed87640e007967ece60c1dad5e83438e2bc4672` | docs(data-source-management): approve requirements baseline [DATA-SOURCE-REQUIREMENTS-APPROVAL-CLOSEOUT-001] |
| ChatGPT 对批准收口复审 | — | `REVIEW_PASS` |

传播的 10 条已批准目标规则（来自 `REQUIREMENTS.md`，本任务仅准确传播、未扩展或改写）：
`CDC_DATA_SOURCE_EXTEND` 表示"源库到目标库的命名策略"；每个源库 0..N 条策略；每条以 `DATA_SOURCE_ID` 表示源库、`TARGET_DATA_SOURCE_ID` 表示目标库；`(DATA_SOURCE_ID, TARGET_DATA_SOURCE_ID)` 为逻辑联合唯一组合；第一版仅由后端保存前查询校验、不新增主键/唯一约束/索引/DDL；不处理、不清洗存量异常数据；页面与文档统一使用"目标库命名策略"或"命名策略"；目标库选择仅来自 `FG_ACTIVE='1' AND DATA_SOURCE_CATEGORY='TARGET'`（业务规则，非物理约束）；删除数据源只物理删除 `CDC_DATA_SOURCE` 当前记录；修改 `DATA_SOURCE_ID` 只修改 `CDC_DATA_SOURCE` 当前记录。

---

## 2. 开始前分支、HEAD、远端 SHA、ahead/behind、工作区状态

执行（修改前）记录的 Git 现场：

- 当前分支：`develop`
- 本地 HEAD：`fed87640e007967ece60c1dad5e83438e2bc4672`
- 远端 `origin/develop`：`fed87640e007967ece60c1dad5e83438e2bc4672`
- `git ls-remote origin refs/heads/develop`：`fed87640e007967ece60c1dad5e83438e2bc4672`
- ahead/behind：`0 0`（本地与远端完全一致，无分叉）
- 远端精确指向授权基准提交，满足任务停止条件检查，未触发 `BLOCKED_REMOTE_BASE_CHANGED`。

工作区状态（修改前，`git status --short`）：
- 10 个授权文件（本任务目标文件）在修改前均为干净状态；
- 既有无关内容原样保留：`frontend/**` 若干文件修改、`docs/database/TASK3/4*.md` 删除、`docs/agent-prompts/**` 未跟踪文件、`.claude/settings.local.json`、`agent-env.sh` 等，均不修改、不清理、不暂存、不提交。

---

## 3. 11 个授权文件的实际修改清单

| # | 文件 | 操作 |
|---|---|---|
| 1 | `docs/features/data-source-management/REQUIREMENTS.md` | 修改（§17/§18/§20） |
| 2 | `docs/baseline/ARCHITECTURE.md` | 修改（§4.1/§4.7/§9/新增§10） |
| 3 | `docs/baseline/DOMAIN_GLOSSARY.md` | 修改（"数据源"术语/"目标库命名策略"新增/示例/新增变更记录） |
| 4 | `docs/baseline/PROJECT_STATUS.md` | 修改（§1.1/§1.2/§9.2/§9.3/§9.4/新增§11） |
| 5 | `docs/database/README.md` | 修改（§4.1/§10/§11） |
| 6 | `docs/database/RELATIONS.md` | 修改（R01/R15/§5.3/§7/§8） |
| 7 | `docs/database/CHANGELOG.md` | 修改（§3/§4） |
| 8 | `docs/database/DATA_PROFILE.md` | 修改（§5/§7.2/§9） |
| 9 | `docs/database/SCHEMA.md` | 修改（§2/§6/§8） |
| 10 | `docs/database/tables/CDC_DATA_SOURCE_EXTEND.md` | 修改（标题/§1/§2/§3/§8/§9/§10） |
| 11 | `docs/features/data-source-management/reports/DATA-SOURCE-BASELINE-IMPACT-ALIGNMENT-001.md` | 新增（本报告） |

除上述 11 个文件外未修改任何文件。

---

## 4. 每个权威文件如何消除旧一对一目标规则

### 4.1 `docs/features/data-source-management/REQUIREMENTS.md`

- `DS-REQ-001`～`DS-REQ-109` 的编号、文本、顺序、语义完全不变（机械检查确认与 `fed8764` 逐行一致）。
- 文档状态保持 `APPROVED`，实现状态保持 `NOT_STARTED`。
- §17 更新为：本次项目/数据库权威基线影响已由 `DATA-SOURCE-BASELINE-IMPACT-ALIGNMENT-001` 完成同步；数据库物理结构和当前代码没有因此变化。
- §18"受影响的已批准基线"由"经用户批准后再更新"改为"已通过本任务同步完成"；现有后端改造、前端占位页替换和 JDBC 驱动仍为后续事项。
- §20 新增本次一致性调整变更记录。
- 未把同步文档写成已经完成设计或实现。

### 4.2 `docs/baseline/ARCHITECTURE.md`

- §4.1 数据对象说明：`CDC_DATA_SOURCE_EXTEND` 由"数据源扩展配置（表命名策略），目标规则为每数据源一对一必填"改为"源库到目标库的命名策略（目标表命名策略：前缀/后缀/合并策略）；源库 0..N，第一版由后端保存前校验逻辑联合唯一，不新增 DDL"。
- §4.7 R01 更新为：`DATA_SOURCE_ID` 到源库的多对一弱逻辑引用；反向一个源库 0..N 条命名策略；`(DATA_SOURCE_ID, TARGET_DATA_SOURCE_ID)` 为逻辑联合唯一组合，第一版仅由后端保存前校验、不新增 DDL；维护方标注"管理平台（旧候选实现双表联写，待改造）"。
- §4.7 R15 更新为：目标库弱逻辑引用，一条策略对应一个业务必填目标库、一个目标库可被多个源库策略引用；数据库仍无外键/类别约束；维护方标注 `TARGET_DATA_SOURCE_ID` 字段当前代码未映射、属待改造。
- §4.7 新增"**源库到目标库命名策略**（R01/R15）"说明段，含逻辑联合唯一组合、`FG_ACTIVE='1' AND DATA_SOURCE_CATEGORY='TARGET'` 目标库选择规则、当前代码差距（Entity 未映射目标字段、`ROWNUM=1`）。
- §9 D02 由"一对一目标未强制"高严重度缺陷改为"无主键/唯一约束/索引为当前物理事实、第一版明确不新增 DDL、旧后端 `ROWNUM=1`/未映射目标字段属待改造代码差距"。
- 当前代码读写入口和旧实现事实保留为当前事实；新增 §10 文档级变更记录；文档状态保持 `APPROVED`。

### 4.3 `docs/baseline/DOMAIN_GLOSSARY.md`

- "数据源"术语删除 EXTEND 为 1:1 扩展信息的概括，改为"源库通过 `CDC_DATA_SOURCE_EXTEND` 表达 0..N 条'目标库命名策略'（见下），不再是'每数据源一条的 1:1 扩展信息'"，来源标注 `REQUIREMENTS.md`。
- 新增"### 目标库命名策略 (Target Naming Strategy)"术语：源库 0..N；每条关联一个业务必填目标库；`(DATA_SOURCE_ID, TARGET_DATA_SOURCE_ID)` 组合逻辑唯一；第一版不新增主键/唯一约束/索引/DDL；目标库选择仅来自 `FG_ACTIVE='1' AND DATA_SOURCE_CATEGORY='TARGET'`。
- "当前事实/目标规则/当前差异"示例更新为新批准规则：无主键/唯一约束/索引不是未落实一对一的差异，第一版无 DDL 是已批准边界。
- 历史术语与通用关系分级未被错误改写；新增文档级变更记录；文档状态保持 `APPROVED`。

### 4.4 `docs/baseline/PROJECT_STATUS.md`

- §1.1/§1.2 数据源两表行更新为"已有旧后端候选实现（CRUD+启停等，与新批准目标存在冲突），批准的新目标尚未实现，前端未对接"。
- §9.2 分类由"后端闭环/前端缺口"调整为"旧后端候选实现/新目标未实现"，明确区分"已有旧后端候选实现"与"批准的新目标尚未实现、前端仍占位"；分类合计保持 2，自校验 `9 + 2 + 1 + 2 = 14 ✓` 不变。
- §9.3 R01 更新为已批准的源库 0..N 命名策略关系。
- §9.4 原 R01（是否约束每数据源一条扩展配置）`PENDING_DECISION` 关闭并注明由已批准数据源管理 Feature 基线取代；D01/D03/D04 保留为 `PENDING_DECISION`。
- 数据库物理事实和当前代码事实保留；新增 §11 文档级变更记录；文档状态保持 `APPROVED`。

### 4.5 `docs/database/README.md`

- §4.1 当前表索引中 `CDC_DATA_SOURCE_EXTEND` 用途统一为"源库到目标库的命名策略（目标表命名策略）"。
- §10 权威边界补充：已批准 Feature 业务规则已同步到本目录对应文档；本次同步未执行任何数据库操作，物理结构无变化。
- §11 变更记录新增 2026-08-29 条目，注明旧一对一目标已由已批准数据源管理基线取代；文档状态保持 `APPROVED`。

### 4.6 `docs/database/RELATIONS.md`

- R01 更新为：`CDC_DATA_SOURCE_EXTEND.DATA_SOURCE_ID → CDC_DATA_SOURCE.DATA_SOURCE_ID` 是源库弱逻辑引用；一条策略属于一个源库，反向一个源库 0..N 条策略；`(DATA_SOURCE_ID, TARGET_DATA_SOURCE_ID)` 为逻辑联合唯一组合，第一版仅由后端保存前查询校验、无数据库唯一约束/DDL，数据库物理上仍允许 0..N；旧代码证据（双表联写、`ROWNUM=1`）明确为"旧实现（待改造）"。
- R15 更新为：目标库弱逻辑引用；业务上每条策略的 `TARGET_DATA_SOURCE_ID` 必填，但数据库字段仍物理可空且无外键/类别约束。
- 关系表"可空"列继续表达数据库物理可空性，未因 Feature 业务必填而错误改为物理不可空；物理可空性与业务必填在关系说明中区分。
- §5.3 更名为"源库到目标库命名策略关系（无数据库类别约束）"并展开：逻辑联合唯一组合、第一版后端校验、当前代码未映射 `TARGET_DATA_SOURCE_ID`、无代码级 JOIN、引用方代码须容错。
- §7 关系图 R01/R15 行更新为源库/目标库两个方向的命名策略关系，不再出现"一对一必填目标"。
- 关系数量与确认等级未变化（已确认 13 + 高度可信 3 = 16，编号 R01～R16 齐全）；新增 §8 变更记录；文档状态保持 `APPROVED`。

### 4.7 `docs/database/CHANGELOG.md`

- 未改写任何已发生 DDL/DML 历史。
- §3 原 R01（是否约束每数据源一条扩展配置/一对一必填目标）由 `PENDING_DECISION` 关闭，明确旧候选已被已批准 Feature 规则取代；记录当前决定：第一版不新增主键、唯一约束、索引或 DDL，逻辑联合唯一由后端查询校验；明确本关闭仅为文档基线调整，未改变数据库结构，不得写成数据库结构已经改变。
- D01/D03/D04 保留为 `PENDING_DECISION`。
- 新增 §4 变更记录；文档状态保持 `APPROVED`。

### 4.8 `docs/database/DATA_PROFILE.md`

- 保留所有 2026-08-26 实测数值不变。
- §5 `DATA_SOURCE_ID` 完整性结论更新：重复不再单独等同于违反"一对一"（0..N 下同一源库多行属允许范围）；2 条孤立仍是观测到的测试构造弱引用场景；13 个数据源无策略记录符合 0 条允许规则；明确"本任务不重新读库，未对 `(DATA_SOURCE_ID, TARGET_DATA_SOURCE_ID)` 组合是否无重复作出核验声明"。
- §7.2 原 R01 一对一约束候选由 `PENDING_DECISION` 关闭，注明第一版无 DDL；D01/D03/D04 保留。
- 新增 §9 变更记录；文档状态保持 `APPROVED`。

### 4.9 `docs/database/SCHEMA.md`

- §2 表 2 当前用途更新为"源库到目标库的命名策略（目标表命名策略：前缀/后缀/合并策略）"；数据维护方更新为"管理平台（旧候选实现随 CDC_DATA_SOURCE 联写；批准目标为源库 0..N，第一版无 DDL）"。
- §6 管理平台写入说明区分当前**旧候选实现**（双表联写、一对一读取、`ROWNUM=1` 等，未满足已批准源库 0..N 命名策略目标）与批准新目标（第一版无 DDL），禁止把新目标写成已实现。
- §8 变更记录新增 2026-08-29 条目；14+2=16 张已批准单表物理基线自校验不变；文档状态保持 `APPROVED`。

### 4.10 `docs/database/tables/CDC_DATA_SOURCE_EXTEND.md`

- 标题与文档业务名称统一为"源库到目标库的命名策略表"；未伪造数据库表注释。
- §1 表用途更新为"源库到目标库的命名策略（目标表命名策略：前缀/后缀/合并策略）；源库 0..N，第一版由后端保存前校验逻辑联合唯一，不新增 DDL"；主键行注明"无（当前物理事实；第一版不新增主键/唯一约束/索引/DDL）"。
- §2 主键/约束/索引/字段结构等物理事实完全不变；字段数据库原注释（`DATA_SOURCE_ID`"原则上与 CDC_DATA_SOURCE 表记录一对一"）原样保留；另增"批准业务语义（不是数据库注释）"说明，未把业务解释伪装成数据库注释。
- §3 无约束为当前物理事实；第一版明确不新增主键、唯一约束、索引或任何 DDL；原映射资料 D02"EXTEND 无约束，高严重度"不再作为"一对一未约束"缺陷。
- §8 保留当前 Entity/Mapper/Service 旧访问事实，明确其尚未满足已批准 0..N 目标（`ROWNUM=1` 取第一条、Entity 未映射 `TARGET_DATA_SOURCE_ID`、双表联写）。
- §9 D02 调整为：无主键/唯一约束/索引为当前物理事实；第一版不新增 DDL；逻辑联合唯一由未来后端保存前查询校验；不再列为"一对一未约束"待决策缺陷。数据快照按 0..N 正确解释：同一 `DATA_SOURCE_ID` 多行不必然异常；孤立/空目标由应用层按批准规则处理；存量不清洗。`TARGET_DATA_SOURCE_ID` 列确认业务必填但数据库字段物理可空。
- 新增 §10 变更记录；文档状态保持 `APPROVED`。

---

## 5. 当前数据库物理事实、当前旧代码事实、已批准目标规则三层边界说明

| 层次 | 内容 | 处理方式 |
|---|---|---|
| 当前数据库物理事实（已核验快照，不得改写） | `CDC_DATA_SOURCE_EXTEND` 无主键、无唯一约束、无索引、无外键、无分区；`DATA_SOURCE_ID`/`TARGET_DATA_SOURCE_ID` 字段类型、长度、可空性、数据库注释状态不变；2026-08-26 行数/空值/重复/孤立/分布为瞬时观测快照、原始数字保留；数据库物理上仍允许 0..N | 全部保留，未改动任何物理事实描述 |
| 当前旧代码事实（现有候选实现/待改造） | `DataSourceExtend` Entity 未映射 `TARGET_DATA_SOURCE_ID`；`DataSourceServiceImpl` 存在双表联写、一对一读取、`ROWNUM=1`、级联处理、启停等旧逻辑；前端仍为占位页；实现状态 `NOT_STARTED` | 全部保留并明确标注"旧候选实现/待改造"，未伪装成已完成新实现 |
| 已批准目标规则（本次传播内容） | 源库 0..N 命名策略；`(DATA_SOURCE_ID, TARGET_DATA_SOURCE_ID)` 逻辑联合唯一；第一版仅后端保存前查询校验、不新增 DDL；不处理存量异常；目标库仅从 `FG_ACTIVE='1' AND DATA_SOURCE_CATEGORY='TARGET'` 选择；删除/修改数据源不级联 EXTEND | 准确传播到各权威文档；未扩展、未改写业务含义 |

三层边界在每一份权威文档中均有区分：物理事实（数据库）与业务规则（Feature 基线）互不混淆，当前旧代码事实作为"现状差距"单独标注，不冒充批准目标。

---

## 6. 明确哪些历史文件/报告未修改及原因

以下历史内容一律未修改，保持原貌：

- `docs/database/reports/**` 中既有报告——属历史执行记录，本任务为纯文档同步，不篡改历史原文；
- 标记 `HISTORICAL_SUPERSEDED` 的旧文档——已退出现行权威范围，保持历史状态；
- `docs/database/open-questions.md`、`open-questions-answers.md` 等历史问答与负责人当时答复——记录当时结论，不因新批准规则改写历史答复；
- 旧任务当时的变更记录和批准记录——保持原样；
- 其他 Feature 文档、代码、测试、构建配置、菜单、路由——不在授权范围。

旧规则被新批准 Feature 基线取代的说明，均写入当前权威文档的**变更记录**中（如 `CHANGELOG.md`、`DATA_PROFILE.md` 等 2026-08-29 条目），未篡改历史原文。

机械检查确认：历史材料、历史报告和其他 Feature 无 diff（见 §7.10）。

---

## 7. 机械检查结果

按任务提示词 §9 逐项执行并记录：

1. **实际改动路径只有 11 个授权文件**：`git status --short` 显示仅 10 个授权现有文件被修改 + 1 个新增报告文件；无授权外文件被修改。
2. **`git diff --check` 通过**：`EXIT=0`，无空白错误/冲突标记。
3. **`DS-REQ-001`～`DS-REQ-109` 相对 `fed8764` 完全一致**：逐行提取对比 `identical: True`（109 行 == 109 行）。
4. **`DS-AC-001`～`DS-AC-106` 与追踪矩阵完全未修改**：`git diff fed8764 -- ACCEPTANCE.md` 为空（`EXIT=0` 无输出）；`ACCEPTANCE.md` 不在授权修改范围内。
5. **状态保持**：需求文档 `APPROVED` ✓、实现 `NOT_STARTED` ✓；验收用例 `DS-AC` 计数 106、全部 `NOT_RUN` ✓。
6. **关键词分类**（修改后现行权威文件中搜索 `CDC_DATA_SOURCE_EXTEND`、`一对一`、`1:1`、`每数据源一条`、`扩展配置`、`PENDING_DECISION`）：
   - 当前有效目标规则未再把 EXTEND 描述为每数据源一对一必填；
   - 保留命中及理由见 §7.1；
   - 无保留命中仍描述 EXTEND 为现行"每数据源一对一必填"目标规则。
7. **R01 不再是"一对一唯一约束"待决策项**：`ARCHITECTURE.md`、`PROJECT_STATUS.md`、`CHANGELOG.md`、`DATA_PROFILE.md`、`tables/CDC_DATA_SOURCE_EXTEND.md` 中原 R01 `PENDING_DECISION` 均已关闭并注明由已批准数据源管理基线取代；D01/D03/D04 未被误改、保留为 `PENDING_DECISION`。
8. **数据库字段、约束、索引、可空性、行数、观测分布无依据变化**：物理事实（无主键/唯一约束/索引/外键/分区、字段类型与可空性、2026-08-26 数值）全部保留。
9. **关系数量、表数量、分类合计与导航链接自洽**：`RELATIONS.md` 关系编号 R01～R16 共 16 条齐全、确认等级（已确认 13 + 高度可信 3）不变；`SCHEMA.md` 14+2=16 张已批准单表物理基线自校验不变；`PROJECT_STATUS.md` 分类合计保持 2、自校验 `9 + 2 + 1 + 2 = 14 ✓` 不变。
10. **历史材料、历史报告和其他 Feature 无 diff**：上述历史对象未触碰，仅 11 个授权文件有改动。

### 7.1 保留命中说明（§9.6 每一条保留命中）

| 位置 | 关键词 | 保留理由 |
|---|---|---|
| `REQUIREMENTS.md` §3.1 现状差距表 | 一对一、扩展配置、ROWNUM=1 | 记录现有后端旧候选行为（`findExtend`/`create` 强校验等）为"目标需修正"的现状差距，属当前旧代码事实，不构成现行目标规则 |
| `REQUIREMENTS.md` §17/§18 | 一对一、扩展配置 | 记录旧目标规则已由本任务同步取代的说明，属变更/同步描述 |
| `REQUIREMENTS.md` DS-REQ-062/DS-REQ-068 | 扩展配置 | 已批准需求原文：明确"不是每个数据源一条且必填的通用扩展配置""避免使用含义模糊的'扩展配置'"（批准的否定式表述，语义为批准语言） |
| `ARCHITECTURE.md` §9 D02 | 一对一、ROWNUM=1 | 记录无约束为当前物理事实、第一版不新增 DDL、旧后端 `ROWNUM=1`/未映射目标字段为待改造差距（原差异 D02 已关闭） |
| `ARCHITECTURE.md` §10 变更记录 | 一对一、扩展配置 | 本次同步变更记录 |
| `DOMAIN_GLOSSARY.md` 数据源术语 | 每数据源一条、1:1 | 批准的否定式表述："不再是'每数据源一条的 1:1 扩展信息'" |
| `DOMAIN_GLOSSARY.md` 变更记录 | 一对一、1:1 | 本次同步变更记录 |
| `DOMAIN_GLOSSARY.md` PENDING_DECISION（订阅标识符） | PENDING_DECISION | 属 D01（CDC_DATA_SUBSCRIBE 主键）待决策，与 EXTEND 无关 |
| `PROJECT_STATUS.md` §9.2 | 一对一 | 记录旧后端候选实现"一对一读取"为现状差距（与新批准目标冲突） |
| `PROJECT_STATUS.md` §9.4/变更记录 | 每数据源一条、扩展配置 | 记录原 R01 `PENDING_DECISION` 关闭及取代说明 |
| `PROJECT_STATUS.md` §9.4 PENDING_DECISION 表 | PENDING_DECISION | D01/D03/D04 待决策，与 EXTEND 无关 |
| `README.md` 变更记录 | 一对一、扩展配置 | 本次同步变更记录 |
| `RELATIONS.md` R01 | ROWNUM=1 | 旧代码证据（`findExtend` 通过 selectOne+ROWNUM=1）保留并标注"旧实现（待改造）" |
| `RELATIONS.md` 变更记录 | 一对一 | 本次同步变更记录 |
| `CHANGELOG.md` §3/变更记录 | 一对一、每数据源一条、扩展配置 | 记录原 R01 `PENDING_DECISION` 关闭及取代说明；D01/D03/D04 PENDING_DECISION 保留（与 EXTEND 无关） |
| `DATA_PROFILE.md` §5 | 一对一 | 记录重复 DATA_SOURCE_ID 在 0..N 下"不单独视为违反一对一"（0..N 解释） |
| `DATA_PROFILE.md` §7.2/变更记录 | 一对一、每数据源一条、扩展配置 | 记录原 R01 `PENDING_DECISION` 关闭及取代说明；D01/D03/D04 PENDING_DECISION 保留（与 EXTEND 无关） |
| `SCHEMA.md` §6 | 一对一、ROWNUM=1 | 记录旧候选实现（双表联写、一对一读取、`ROWNUM=1`）为未满足批准目标的现状，禁止把新目标写成已实现 |
| `SCHEMA.md` §8 变更记录 | 一对一 | 本次同步变更记录 |
| `tables/CDC_DATA_SOURCE_EXTEND.md` §2 字段注释 | 一对一 | `DATA_SOURCE_ID` 字段**数据库原注释**（"原则上与 CDC_DATA_SOURCE 表记录一对一"），任务要求保留原注释，禁止改写数据库注释 |
| `tables/CDC_DATA_SOURCE_EXTEND.md` §2 批准业务语义 | 一对一 | 批准业务语义说明，明确数据库原注释为旧表注释/旧意图、不代表已批准规则 |
| `tables/CDC_DATA_SOURCE_EXTEND.md` §3/§9 | 一对一、PENDING_DECISION | 记录无约束为当前物理事实、D02 不再作为"一对一未约束"缺陷、原 R01 `PENDING_DECISION` 关闭 |
| `tables/CDC_DATA_SOURCE_EXTEND.md` §8 | ROWNUM=1 | 当前旧代码访问事实（`findExtend` selectOne + `ROWNUM=1`），明确尚未满足批准目标 |
| `tables/CDC_DATA_SOURCE_EXTEND.md` §10/§9 变更记录 | 1:1、一对一 | 本次同步变更记录（含"移除'目标规则为与 CDC_DATA_SOURCE 1:1'描述"） |

---

## 8. 未连接数据库/ZooKeeper、未执行 SQL/DDL、未启动服务、未构建、未测试、未修改代码的证明

- 本任务为纯文档同步，全程未连接 Oracle 开发库、未连接 ZooKeeper；
- 未执行任何 `SELECT`/`INSERT`/`UPDATE`/`DELETE`/`MERGE`/DDL 或其他数据库 SQL；
- 未启动或停止任何后端/前端服务进程；
- 未执行 `mvn`、`npm`、`node`、`sqlplus`、`zkCli` 等构建/测试/数据库/监控命令（任务类型为文档任务，按验证矩阵标记为 `NOT_APPLICABLE`）；
- 未修改任何代码、测试、构建配置、菜单、路由、`.claude` 配置或 Skill；
- `git diff --check` 通过且改动文件仅限 11 个授权文档，进一步佐证无代码级改动。

---

## 9. Commit、Push 与推送后同步状态

- 精确暂存 11 个授权文件（未使用 `git add .` / `git add -A` 等宽泛暂存）；
- Commit Message（按任务建议）：`docs(data-source-management): align approved baseline impacts [DATA-SOURCE-BASELINE-IMPACT-ALIGNMENT-001]`；
- 使用普通非强制推送 `git push origin develop`（未 force push、未 rebase、未 reset、未 clean、未 stash）；
- 推送后核验：
  - `HEAD == origin/develop == git ls-remote origin refs/heads/develop`；
  - ahead/behind 为 `0 0`；
  - 提交只包含授权文件；
  - 无关工作区内容原样保留。
- 最终 `result_commit_id` 与 `push_status` 见控制台结果块。

---

## 10. 下一步

下一步仅为 `CHATGPT_REVIEW_BASELINE_ALIGNMENT`。任务不直接进入设计或实现，等待 ChatGPT 从远端 Git 复审一致性调整结果后再决定后续。

本任务未宣布 Feature 已进入设计、已实现或已验收。
