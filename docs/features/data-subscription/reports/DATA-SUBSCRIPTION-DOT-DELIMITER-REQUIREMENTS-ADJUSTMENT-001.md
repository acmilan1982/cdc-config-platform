# 任务执行报告：数据订阅点号保留分隔符需求定向调整草案（DATA-SUBSCRIPTION-DOT-DELIMITER-REQUIREMENTS-ADJUSTMENT-001）

## 1. 任务编号、性质与状态

| 项目 | 值 |
|---|---|
| 任务编号 | `DATA-SUBSCRIPTION-DOT-DELIMITER-REQUIREMENTS-ADJUSTMENT-001` |
| 前序任务 | `DATA-SUBSCRIPTION-DESIGN-BASELINE-001` |
| 前序结果提交 | `610401575938ba32f13fa635493f991bdfae81b6` |
| 任务性质 | 项目负责人明确决策驱动的纯文档需求/验收定向调整（**不得修改业务代码、不访问数据库、不执行 DDL/DML**） |
| Feature | 数据订阅（`data-subscription`） |
| 最终状态 | `SUCCESS`（本报告记录的是本任务“点号保留分隔符”定向调整草案落盘结果；**本报告不把调整写成已批准或已实现**） |
| 分支 | `develop` |
| 基准提交（base_commit_id） | `610401575938ba32f13fa635493f991bdfae81b6` |
| 结果提交（result_commit_id） | 见控制台 `AGENT_TASK_RESULT`（本报告不预先伪造尚未产生的提交号） |
| 远程提交（remote_commit_id） | 见控制台 `AGENT_TASK_RESULT` |
| ahead/behind | 见控制台 `AGENT_TASK_RESULT` |
| commit_status / push_status | 见控制台 `AGENT_TASK_RESULT` |

调整草案状态：需求/验收当前版本均为 `DRAFT_PENDING_USER_REVIEW`；设计（DESIGN/API/UI/DATABASE）保持 `DRAFT_PENDING_USER_REVIEW` 且本任务零改动；实现状态保持 `NOT_STARTED`；126 条验收保持 `NOT_RUN`。

## 2. 项目负责人明确决定及日期

项目负责人已于 **2026-08-30** 明确选择：

> 第一版把英文句点 `.` 定义为保留分隔符。数据源 ID、Schema 名或表名包含英文句点时，禁止用于新增或编辑订阅。

背景：数据订阅已批准的单表存储格式为 `DATA_SOURCE_ID.Schema.表名`，英文句点 `.` 用作三段之间的结构分隔符；当前已批准需求只明确禁止组件名称包含英文逗号，没有明确句点边界。若设计草案直接增加“禁止句点”会超出已批准需求，因此 ChatGPT 正式设计复审结论为 `CHANGES_REQUIRED`。本任务只把该决定定向写入需求和验收标准，使后续设计具有正式依据。

本任务**未**修正设计草案中的其他问题、**未**批准设计、**未**实现代码。

## 3. 分支、基准提交、结果提交、远程提交与 ahead/behind

- 分支：`develop`。
- 基准提交（base_commit_id）：`610401575938ba32f13fa635493f991bdfae81b6`（任务开始前本地 HEAD 与 `origin/develop` 一致）。
- 结果提交 / 远程提交 / ahead/behind / commit_status / push_status：本任务 Commit 与 Push 结果在控制台 `AGENT_TASK_RESULT` 结果块输出，不在本报告中伪造尚未产生的提交号（遵循既有报告约定）。

## 4. 开始前工作区状态与既有修改保护结果

执行开始前记录（`git branch --show-current` / `git status --short` / `git rev-parse HEAD` / `git rev-parse origin/develop` / `git rev-list --left-right --count origin/develop...HEAD` / `git show --stat --oneline 610401575938ba32f13fa635493f991bdfae81b6`）：

- 当前分支：`develop`。
- 本地 HEAD：`610401575938ba32f13fa635493f991bdfae81b6`。
- `origin/develop`：`610401575938ba32f13fa635493f991bdfae81b6`（与本地一致，ahead/behind = `0 0`）。
- 开始前工作区存在大量与本任务无关的既有修改与未跟踪文件（如 `.claude/settings.local.json`、`agent-env.sh`、`frontend/src/**`、`docs/agent-prompts/**`、`docs/database/TASK3/4*` 删除、`docs/features/app-shell/` 与 `docs/features/large-screen/` 未跟踪目录等），本任务未清理、未回滚、未覆盖、未暂存、未提交任何既有修改。
- 本任务 3 个拟修改文件（REQUIREMENTS.md、ACCEPTANCE.md、docs/features/README.md）与 1 个拟新增文件（本报告）在开始前均无未提交修改，可安全处理。
- 未使用 `git add .`、`git add -A` 等全量暂存；只逐文件暂存本任务授权文件。
- 未执行任何破坏性 Git 命令。

## 5. 实际修改/新增文件

修改（授权范围内 3 个）：

1. `docs/features/data-subscription/REQUIREMENTS.md`
2. `docs/features/data-subscription/ACCEPTANCE.md`
3. `docs/features/README.md`

新增（授权范围内 1 个）：

4. `docs/features/data-subscription/reports/DATA-SUBSCRIPTION-DOT-DELIMITER-REQUIREMENTS-ADJUSTMENT-001.md`（本报告）

未修改：`DESIGN.md`、`API.md`、`UI.md`、`DATABASE.md`、所有既有报告、`docs/baseline/`、`docs/database/`、`docs/features/large-screen/`、任何 Java/Vue/TypeScript/JavaScript/SQL/配置/测试文件、其他 Feature 文档。

## 6. 调整前后的规则对照

| 维度 | 调整前（已批准版本 `d7560445...`） | 调整后（当前草案） |
|---|---|---|
| 单表格式 | `DATA_SOURCE_ID.Schema.表名`（未明确句点边界） | 保持不变；明确两个英文句点 `.` 为三段结构的**保留分隔符** |
| 存储协议 | 未说明 | 明确无引号、转义符或长度前缀机制 |
| 保留字符 | 仅禁止英文逗号 `,`（`DSUB-REQ-017`） | 禁止英文逗号 `,` 与英文句点 `.`（`DSUB-REQ-017`） |
| 逗号/句点用途 | 逗号用于多值项分隔 | 逗号用于多值项分隔；句点用于三段结构分隔 |
| 转义/编码 | 无 | 第一版明确不设计转义或编码协议 |
| 新增/编辑约束 | 页面不得允许选择 | 页面不得允许选择；后端保存也必须拒绝；必须说明具体名称与保留字符原因，不得只提示“格式错误” |
| 查询候选边界 | 按 `FG_ACTIVE=1` 且类别匹配返回 | 仍按 `FG_ACTIVE=1` 且类别匹配返回；存量数据源 ID 含保留字符仍允许用于查询历史订阅 |
| 维护候选边界 | 未明确 | ID 含保留字符的源库/目标库候选显示为禁用项并标注“名称含协议保留字符，不能用于订阅配置”，不静默隐藏 |
| Schema/表选择 | 未明确 | 名称含保留字符的对象显示为不可选择并说明原因，不静默隐藏 |
| 历史记录兼容 | 未明确 | 历史记录不因保留字符隐藏；正常三段格式不误判为异常；组件内部点号不可解析时保留原始内容并警告；编辑回显异常项，修复前禁止保存 |

## 7. `DSUB-REQ-016/017` 修订证据

### 7.1 `DSUB-REQ-016`（定向澄清，编号不变）

调整前：

> 单张表格式为 `DATA_SOURCE_ID.Schema.表名`；Schema 和表名区分大小写，必须保持从源 Oracle 中读取到的原始大小写。

调整后：

> 单张表格式为 `DATA_SOURCE_ID.Schema.表名`；其中两个英文句点 `.` 是三段结构的保留分隔符；存储协议没有引号、转义符或长度前缀机制；Schema 和表名区分大小写，必须保持从源 Oracle 中读取到的原始大小写。

### 7.2 `DSUB-REQ-017`（定向扩展，编号不变）

调整前：

> 数据源 ID、Schema 名和表名不得包含英文逗号；发现这种对象时页面不得允许选择，并明确说明协议限制。

调整后：

> 数据源 ID、Schema 名和表名不得包含英文逗号 `,`，也不得包含英文句点 `.`。英文逗号用于多值项分隔，英文句点用于 `DATA_SOURCE_ID.Schema.表名` 三段结构分隔；第一版不设计转义或编码协议。数据源 ID、Schema 名或表名含英文逗号或句点时，不得用于新增或编辑订阅：页面不得允许选择，后端保存也必须拒绝；页面必须向用户说明具体名称和保留字符原因，不得只提示“格式错误”。

## 8. 被定向扩展的验收项清单（不增加编号）

| 验收项 | 扩展内容 |
|---|---|
| `DSUB-AC-013` | 大小写保持规则不变；明确两个英文句点为三段结构保留分隔符（正常格式） |
| `DSUB-AC-014` | 从“名称含英文逗号”扩展为分别验证英文逗号与组件内部英文句点；明确结构句点不属异常 |
| `DSUB-AC-032` | 查询候选仍能选择协议不兼容的存量数据源以查询历史记录，不因保留字符移除 |
| `DSUB-AC-063` | 新增/编辑源库候选中 ID 含保留字符者显示但禁用并标注原因，不静默隐藏 |
| `DSUB-AC-071` | 新增/编辑目标库候选中 ID 含保留字符者显示但禁用并标注原因（目标库 ID 同样禁止句点） |
| `DSUB-AC-077` | Schema/表名含英文逗号或组件内部句点时不可选择并说明原因，不静默隐藏 |
| `DSUB-AC-091` | 保存校验扩展为名称不包含英文逗号也不包含组件内部英文句点；绕过前端提交含保留字符组件时后端拒绝并列出失效项 |
| `DSUB-AC-055` | 正常三段格式（含两个结构句点）不被误判为异常；组件内部点号造成不可解析时保留原始内容并警告 |
| `DSUB-AC-104` | 编辑回显含保留字符的异常项并标记；保存前必须替换或修复；删除规则保持不变 |

以上扩展均为在既有编号上的前置条件/操作/预期结果定向修订，未改变无关业务语义；验收编号仍为 `DSUB-AC-001` ~ `DSUB-AC-126` 共 126 条、连续、唯一，全部仍为 `NOT_RUN`。

## 9. 查询候选、维护候选、历史数据兼容规则

- **查询候选**：列表查询区的源库/目标库候选仍按 `FG_ACTIVE=1` 且类别匹配返回；即使某个存量数据源 ID 含英文逗号或句点，也应允许用于查询历史订阅，不得因此无法定位历史记录。
- **维护候选**：新增/编辑弹窗中的源库、目标库候选若 ID 含英文逗号或句点，显示为禁用项并明确标注“名称含协议保留字符，不能用于订阅配置”，不得静默隐藏。
- **Schema/表选择**：名称含英文逗号或组件内部句点的对象显示为不可选择，并说明原因。
- **目标库 ID**：虽不参与 `DATA_SOURCE_ID.Schema.表名` 拼接，但项目负责人已选择统一的数据源 ID 保留字符规则，新增/编辑中同样禁止句点。
- **历史数据兼容**：历史启用记录仍按原始内容展示，不因保留字符直接从列表隐藏；详情能够展示的内容继续展示，无法可靠解析的内容放入原始异常内容区并警告，不得静默丢弃；正常单源库记录仍允许查看和删除；编辑打开时回显异常项，保存前必须替换或修复含保留字符的无效配置；多源库异常记录仍遵守既有“整行警示、无任何操作”规则，优先级不变。
- **正常结构点号**：不得把所有含点号的完整表标识误判为异常；结构分隔用的两个句点是正常格式，只有组件内部额外句点才属于协议不兼容。

## 10. 107/126 编号与状态保护

- `DSUB-REQ-001` ~ `DSUB-REQ-107` 保持 107 条、连续、唯一；仅 `DSUB-REQ-016/017` 定向修订，其余需求业务行无变化。
- `DSUB-AC-001` ~ `DSUB-AC-126` 保持 126 条、连续、唯一；不增加、不删除、不重编号；全部 126 条状态仍为 `NOT_RUN`。
- 验收→需求映射无悬空；每条需求引用仍存在。
- 点号决策未写成已经实现或已经验收通过。

## 11. 上一批准版本与当前草案状态关系

- 上一正式批准版本（需求与验收）提交为 `d7560445be1504e6ed9957fa7b31be1fd393ea19`，批准事实保留为历史证据，**不得改写历史**。
- 当前修订版本在保留上一版全部编号、数量与业务语义基础上，仅增加“英文句点 `.` 为三段结构保留分隔符”的定向调整，状态为 `DRAFT_PENDING_USER_REVIEW`，待 ChatGPT 正式复审。
- 草案待复审不表示既有实现状态发生变化：实现仍为 `NOT_STARTED`，126 条验收仍全部 `NOT_RUN`。
- 设计（DESIGN/API/UI/DATABASE）仍为 `DRAFT_PENDING_USER_REVIEW`，ChatGPT 正式设计复审结论为 `CHANGES_REQUIRED`，等待需求调整复审通过后再执行 `DATA-SUBSCRIPTION-DESIGN-BASELINE-001-R1`。

## 12. 设计文档零改动检查

- `DESIGN.md`、`API.md`、`UI.md`、`DATABASE.md` 相对 `610401575938ba32f13fa635493f991bdfae81b6` **零 diff**（验证见 §16）。
- 设计文档中仍待修正的问题（指纹并发缺少原子行锁或条件写入、MyBatis 查询伪代码错误合并源/目标 OR、`sourceTables` API 契约冲突、删除接口无可获得 `versionToken`、MyBatis-Plus 默认主键策略依据错误、大量无效章节引用、系统 Schema 静态黑名单不可靠等）**本任务未修改**，统一留待 `DATA-SUBSCRIPTION-DESIGN-BASELINE-001-R1` 处理。

## 13. 实现状态、大屏延期状态保护

- 实现状态：`NOT_STARTED`（无任何业务代码或测试代码改动）。
- 验收执行状态：126 条全部 `NOT_RUN`。
- 大屏调整状态保持 `DEFERRED_AFTER_DATA_SUBSCRIPTION_FEATURE_ACCEPTANCE`（`DSUB-REQ-107`）；未修改 `docs/features/large-screen/` 任何文件。

## 14. 数据库、DDL/DML、代码、测试和外部系统操作状态

- 数据库访问：`NONE`；数据库写入：`NONE`；DDL/DML：`NONE`。
- 业务代码修改：`NONE`；测试代码修改：`NONE`。
- ZooKeeper：`NONE`；Kafka：`NONE`；`sync-client` 及其他业务进程操作：`NONE`。
- 未运行 Maven、npm 或前后端测试；未启动任何服务；未访问数据库。

## 15. 强制前置阅读与基线核验

本任务完整阅读了根目录 `CLAUDE.md`、仓库 Agent 规则、`docs/features/README.md`、`REQUIREMENTS.md`、`ACCEPTANCE.md`、`DESIGN.md`、`API.md`、`UI.md`、`DATABASE.md`、`docs/features/data-subscription/reports/DATA-SUBSCRIPTION-DESIGN-BASELINE-001.md`，并核验前序提交 `610401575938ba32f13fa635493f991bdfae81b6` 的实际差异范围（6 个文件：README + DESIGN/API/UI/DATABASE + 设计报告），确认本任务授权文件与既有修改边界无冲突。

## 16. 验证命令和结果

| 验证项 | 命令/方式 | 结果 |
|---|---|---|
| 1 只修改/新增 4 个授权文件 | `git status --short`、`git diff --name-status` | 仅 3 修改 + 1 新增 |
| 2 DESIGN/API/UI/DATABASE 相对基准零 diff | `git diff 6104015 -- DESIGN.md API.md UI.md DATABASE.md` | 零 diff |
| 3 代码、测试、项目级基线、数据库基线、大屏零 diff | `git diff --name-status` | 无此类文件进入提交 |
| 4 `DSUB-REQ-001~107` 仍为 107 条连续唯一 | `grep -oE 'DSUB-REQ-[0-9]{3}' REQUIREMENTS.md \| sort -u` | 107 条连续唯一 |
| 5 除 `DSUB-REQ-016/017` 及状态/说明/变更记录外需求业务行无变化 | `git diff 6104015 -- REQUIREMENTS.md` 人工核对 | 通过 |
| 6 `DSUB-AC-001~126` 仍为 126 条连续唯一 | `grep -cE '^\| DSUB-AC-[0-9]{3} \|'` ACCEPTANCE.md | 126 |
| 7 全部 126 条仍为 NOT_RUN | `grep -E '^\| DSUB-AC-[0-9]{3} \|'` 非 NOT_RUN 计数 | 0 |
| 8 验收→需求映射无悬空 | 人工核对 `关联需求` 列 | 通过 |
| 9 点号规则覆盖查询候选、维护候选、Schema/表选择、后端保存、历史详情与编辑 | 人工核对 §6/§8 | 通过 |
| 10 正常结构句点不误判为非法 | 人工核对 `DSUB-AC-055`/`DSUB-AC-013`/历史兼容说明 | 通过 |
| 11 上一批准提交与当前草案状态区分清楚 | 人工核对 §1/§11 | 通过 |
| 12 实现仍为 NOT_STARTED | `grep NOT_STARTED` | 保持 |
| 13 设计仍为 DRAFT_PENDING_USER_REVIEW 且未改动 | `grep DRAFT_PENDING_USER_REVIEW` + §12 | 保持 |
| 14 大屏状态仍为 DEFERRED_AFTER_DATA_SUBSCRIPTION_FEATURE_ACCEPTANCE | `grep` | 保持 |
| 15 无敏感信息 | 对 4 个文件执行敏感信息关键词扫描（口令/连接串/内网数据库地址/token 等） | 无 |
| 16 Markdown 表格、标题、链接和代码块检查 | 人工审查 + `git diff --check` | 通过 |
| 17 `git diff --check` | `git diff --check` | exit=0 |
| 18 `git diff --name-status` 仅 4 个授权文件 | `git diff --name-status` | 通过 |
| 19 逐文件审查 staged diff | 逐文件 `git diff --cached` | 通过 |
| 20 提交前后记录 `git status --short` | 提交前后记录 | 无授权文件残留 |
| 21 推送后本地 HEAD / origin/develop / 远程 develop 一致 | `git rev-parse HEAD`/`git rev-parse origin/develop` | 见控制台结果块 |
| 22 推送后 ahead/behind 为 0 0 | `git rev-list --left-right --count origin/develop...HEAD` | 见控制台结果块 |

本任务不运行 Maven、npm 或前后端测试，不启动服务，不访问数据库（纯文档任务）。

## 17. Commit 与 Push 证据

本任务 Commit 与 Push 结果（result_commit_id / remote_commit_id / ahead/behind / commit_status / push_status）在控制台 `AGENT_TASK_RESULT` 结果块输出。遵循既有报告约定，本报告不预先伪造尚未产生的提交号。

- 提交方式：只逐文件暂存 4 个授权文件（1 新增 + 3 修改），未全量暂存。
- 提交信息体现“需求调整草案”（建议信息：`docs(data-subscription): draft reserved-dot requirement adjustment`），不暗示已批准或已实现。
- 普通推送至 `origin/develop`，未 force push；推送失败或本地与远程不一致时不得报告 `SUCCESS`。

## 18. 下一阶段

本调整为**待正式复审草案**。下一入口为“点号需求调整复审”：ChatGPT 对当前需求/验收调整草案进行正式复审；复审通过后再执行 `DATA-SUBSCRIPTION-DESIGN-BASELINE-001-R1`，统一修正设计复审 `CHANGES_REQUIRED` 发现的全部设计问题（见 §12）。

本报告不声称调整已经正式批准或功能已实现。

---

*报告生成：DATA-SUBSCRIPTION-DOT-DELIMITER-REQUIREMENTS-ADJUSTMENT-001（项目负责人决策驱动的纯文档需求/验收定向调整草案）。需求/验收当前版本状态为 `DRAFT_PENDING_USER_REVIEW`，未获正式复审批准；本任务不表示数据订阅功能已实现或验收已通过。*
