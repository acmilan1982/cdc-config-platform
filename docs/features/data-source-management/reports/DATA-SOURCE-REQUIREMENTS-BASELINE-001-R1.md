# 执行报告：数据源管理需求基线草案 R1 修订

## 1. 任务结论与状态

本任务按提示词 `DATA-SOURCE-REQUIREMENTS-BASELINE-001-R1-PROMPT.md` 修复“数据源管理”Feature 验收文档的逐例状态和需求追踪缺口，共修改一个文件、新增一个文件：

1. 修改 `docs/features/data-source-management/ACCEPTANCE.md`
2. 新增 `docs/features/data-source-management/reports/DATA-SOURCE-REQUIREMENTS-BASELINE-001-R1.md`（本报告）

任务结论：**SUCCESS**。ChatGPT 复审结论为 `CHANGES_REQUIRED`，问题类别为两类：①每条验收用例没有独立状态字段；②11 个需求编号（`DS-REQ-031/052/053/061/062/065/068/073/083/106/108`）没有被任何验收用例引用。本任务按修订方案修复以上问题：为全部用例增加“状态”列并逐例标注 `NOT_RUN`；把 11 个原缺失需求编号映射到实际验收用例的“关联需求”字段；新增 `DS-AC-102`~`DS-AC-106` 共 5 条用例；新增需求—验收追踪矩阵。用例总数由 101 更新为 106。本任务为纯文档任务，未修改任何产品需求（`REQUIREMENTS.md` 未改动），未连接数据库，未执行任何数据库查询或写操作，未执行 DDL，未连接 ZooKeeper，未启动任何业务进程，未执行构建或测试，未修改任何代码、测试、配置、菜单、路由或占位页，未创建 DESIGN/API/UI/DATABASE 文档，未修改 `docs/database/**`、`docs/baseline/**`、`docs/features/README.md`、其他 `docs/features/**` 或 `CLAUDE.md`。

## 2. Git 开始状态、授权基线和分类

| 项 | 值 |
|---|---|
| 当前分支 | `develop` |
| 执行时实际基准提交 | `07a17921c025165d846e1ea238bc8c078db3d573`（== 远端 origin/develop == 本地 HEAD） |
| 复审对象提交 | `07a17921c025165d846e1ea238bc8c078db3d573`（R1 提示词 §1 引用的已复审结果提交，已确认远端一致） |
| 初始任务授权基线 | `eca58e669c8ebad3cf73a1732870d1cfb8388517` |
| ahead/behind | `0 0` |
| 环境预检 | git、claude、locale 均通过（本任务为纯文档任务，不要求后端/前端/数据库/ZooKeeper 环境项） |

工作区分类（任务开始前记录）：

- 任务开始前工作区已存在大量与本任务无关的既有未提交内容（未跟踪提示词/过程材料、已修改菜单与布局文件、已删除历史报告等），全部保持原样，未修改、未覆盖、未暂存、未提交。
- 本任务授权的两个目标文件在任务开始前状态：`ACCEPTANCE.md` 为已提交文件且工作区无修改；R1 报告文件不存在。
- 本任务仅修改授权范围内的 `ACCEPTANCE.md`、新增 R1 报告，与其他文件无重叠。

## 3. 实际读取的正式基线和当前文档

按提示词 §3 要求完整读取：

- `CLAUDE.md`（仓库根目录 Agent 开发规范）；
- `docs/baseline/` 六份正式项目级基线：`PROJECT.md`、`ENVIRONMENT.md`、`ARCHITECTURE.md`、`DEVELOPMENT_RULES.md`、`PROJECT_STATUS.md`、`DOMAIN_GLOSSARY.md`；
- `docs/baseline/FEATURE_DEVELOPMENT_AND_ADJUSTMENT_PROCESS.md`；
- 当前 `docs/features/data-source-management/REQUIREMENTS.md`（`DS-REQ-001`~`DS-REQ-109`，连续唯一）；
- 当前 `docs/features/data-source-management/ACCEPTANCE.md`（初始任务版本，101 条用例）；
- 原执行报告 `docs/features/data-source-management/reports/DATA-SOURCE-REQUIREMENTS-BASELINE-001.md`。

已确认远端 `develop` 指向 `07a17921c025165d846e1ea238bc8c078db3d573`，与 R1 提示词 §1 引用一致，父提交为 `eca58e6...`；该提交只新增 REQUIREMENTS、ACCEPTANCE、原执行报告三个授权文件。

## 4. ChatGPT 复审问题与修订方案落实

### 4.1 问题一：每条用例没有独立状态字段

复审指出当前验收表只有“编号、关联需求、前置条件、操作/输入、预期结果”，没有每条用例自己的“状态”列，虽全局声明全部 `NOT_RUN`，仍未满足“每个用例至少包含初始状态 `NOT_RUN`”的要求。

落实方式：`ACCEPTANCE.md` 中 §4.1～§4.14 全部既有与新增用例表格均增加“状态”列，位于“编号”与“关联需求”之间；每一行状态明确写为 `NOT_RUN`；未把任何用例写成 `PASS`/`FAIL`/`BLOCKED` 或已执行。原 101 条用例逐条完成状态列修复。

### 4.2 问题二：11 个需求编号没有被任何验收用例引用

复审列出原缺失编号：

```text
DS-REQ-031
DS-REQ-052
DS-REQ-053
DS-REQ-061
DS-REQ-062
DS-REQ-065
DS-REQ-068
DS-REQ-073
DS-REQ-083
DS-REQ-106
DS-REQ-108
```

落实方式（全部通过实际验收用例“关联需求”字段引用，非说明段、覆盖摘要或追踪矩阵伪覆盖）：

| 原缺失需求编号 | 修订后覆盖的实际验收用例 |
|---|---|
| DS-REQ-031 | DS-AC-102（新增：统一 trim 规则，覆盖查询输入、主表单字段、密码、命名策略前后缀） |
| DS-REQ-052 | DS-AC-103、DS-AC-104（新增：Oracle 与 MySQL/Doris 一次性临时连接） |
| DS-REQ-053 | DS-AC-103、DS-AC-104（新增：Oracle `SELECT 1 FROM DUAL`，MySQL/Doris `SELECT 1`） |
| DS-REQ-061 | DS-AC-101（既有用例补充关联，明确连接测试不得写入数据库业务数据） |
| DS-REQ-062 | DS-AC-072、DS-AC-074、DS-AC-075（源库 0..N 命名策略语义） |
| DS-REQ-065 | DS-AC-081、DS-AC-082（命名策略保存前查重，不新增主键/唯一约束/DDL） |
| DS-REQ-068 | DS-AC-071、DS-AC-072、DS-AC-073（入口/列表统一“目标库命名策略/命名策略”，不用“扩展配置”） |
| DS-REQ-073 | DS-AC-074、DS-AC-075、DS-AC-079、DS-AC-080、DS-AC-083（新增/编辑/删除三种能力均可客观验收） |
| DS-REQ-083 | DS-AC-006、DS-AC-024（`DATA_SOURCE_BIZ_ATTR` 不在主列表和主数据源表单展示或编辑） |
| DS-REQ-106 | DS-AC-105（新增：绕过前端的后端独立校验） |
| DS-REQ-108 | DS-AC-038、DS-AC-106（应用层唯一性/查重与无 DDL/无新增约束或索引） |

### 4.3 修订方案 §5.1 其余落实

- `DS-AC-004`：操作/输入增加“检查主列表查询请求与响应及后端接口契约”，预期结果增加“前后端查询请求与接口契约均不使用分页参数（无 `pageNum`/`pageSize` 等）”，使“前后端均无分页参数”可被客观验证。
- `DS-AC-073`：预期结果不再使用“建议列”这类不可判定措辞，明确要求展示“目标库 ID、目标库名称、数据库类型、命名策略、前缀、后缀、操作”。
- 命名策略入口/列表用例（DS-AC-071/072/073）明确页面使用“目标库命名策略”或“命名策略”，不使用含义模糊的“扩展配置”。

### 4.4 修订方案 §5.2 新增用例（DS-AC-102 ~ DS-AC-106，共 5 条）

| 编号 | 状态 | 关联需求 | 目的 |
|---|---|---|---|
| DS-AC-102 | NOT_RUN | DS-REQ-031 | 统一 trim 规则：除 `DATA_SOURCE_BIZ_ATTR` 外全部字符串输入去除首尾空格，覆盖查询输入、主数据源表单字段、密码、命名策略前后缀 |
| DS-AC-103 | NOT_RUN | DS-REQ-052, DS-REQ-053 | Oracle：一次性临时 JDBC 连接、不使用应用连接池、不保存表单、`SELECT 1 FROM DUAL`、测试完成关闭 |
| DS-AC-104 | NOT_RUN | DS-REQ-052, DS-REQ-053 | MySQL/Doris：一次性临时 JDBC 连接、不使用应用连接池、不保存表单、`SELECT 1`、测试完成关闭 |
| DS-AC-105 | NOT_RUN | DS-REQ-106 | 绕过前端直接调用后端接口，验证后端独立重新校验必填、长度、值域、角色—类型联动、ID/名称唯一性、命名策略逻辑联合键重复 |
| DS-AC-106 | NOT_RUN | DS-REQ-108 | 通过代码/数据库迁移差异/数据库结构只读核对，验证第一版未新增主键、唯一约束、索引或 DDL；唯一性与命名策略查重由后端保存前查询完成 |

新增后按 §4.14 单列分类“补充验收（trim/临时连接/后端独立校验/无 DDL）”，编号连续、唯一，分类计数与总数同步更新为 106。

## 5. 修改/新增文件清单

| # | 文件 | 操作 | 状态 |
|---|---|---|---|
| 1 | `docs/features/data-source-management/ACCEPTANCE.md` | 修改 | `DRAFT_PENDING_USER_REVIEW`（逐例状态列 + 追踪缺口修复） |
| 2 | `docs/features/data-source-management/reports/DATA-SOURCE-REQUIREMENTS-BASELINE-001-R1.md` | 新增（本报告） | — |

## 6. 需求—验收追踪与机械检查结果

在 `ACCEPTANCE.md` §5 新增需求—验收追踪矩阵（`DS-REQ-001`~`DS-REQ-109` 全覆盖），并在提交前执行可靠机械检查，结果全部通过：

| 检查项 | 结果 |
|---|---|
| 需求编号正好为 `001`~`109`，无缺失、无重复（`REQUIREMENTS.md` 未修改） | 通过（109/109） |
| 验收编号从 `001` 连续到 `106`，无缺失、无重复 | 通过（106/106） |
| 每条验收用例都有状态 `NOT_RUN` | 通过（106/106） |
| 每条验收用例至少引用一个有效需求编号 | 通过（106/106） |
| 每个 `DS-REQ-001`~`DS-REQ-109` 至少被一条实际验收用例引用 | 通过（109/109） |
| 不存在 `DS-REQ-110` 等无效引用 | 通过（0 个无效引用） |
| 分类数量之和等于实际用例数 | 通过（106 = 106） |
| 文档元数据中的用例数量与实际行数一致 | 通过（106 = 106） |
| `git diff --check` | 通过 |

## 7. 未修改证明

- `REQUIREMENTS.md` 未修改：R1 提交前后 `git diff --stat` 与工作区状态确认 `docs/features/data-source-management/REQUIREMENTS.md` 无任何改动；`DS-REQ-xxx` 文本、编号与产品语义保持初始任务版本原样。
- 原执行报告 `DATA-SOURCE-REQUIREMENTS-BASELINE-001.md` 未修改：同上确认无任何改动，保留其历史事实。
- 本提示词（`DATA-SOURCE-REQUIREMENTS-BASELINE-001-R1-PROMPT.md`）位于 `docs/prompts/`（未跟踪），未进入 Git。

## 8. 代码 / 构建 / 测试 / 数据库 / DDL / ZooKeeper / 服务操作声明

```text
database_access_status=NONE
database_write_status=NONE
ddl_status=NONE
zookeeper_access_status=NONE
service_start_stop_status=NONE
business_code_change_status=NONE
backend_build_status=NOT_APPLICABLE
frontend_build_status=NOT_APPLICABLE
test_status=NOT_APPLICABLE
feature_document_change_status=仅修改 ACCEPTANCE.md、新增 R1 报告（REQUIREMENTS.md 与原执行报告未修改）
```

本任务按提示词要求未连接数据库，未执行任何数据库查询或写操作（INSERT/UPDATE/DELETE/MERGE/CREATE/ALTER/DROP/TRUNCATE/COMMENT/GRANT/REVOKE/PL-SQL）；未连接 ZooKeeper；未启动任何业务进程；未执行构建或测试；未修改任何业务代码、前端、后端、测试、配置、菜单、路由或占位页；未创建 DESIGN/API/UI/DATABASE 文档；未修改 `docs/database/**`、`docs/baseline/**`、`docs/features/README.md` 或其他 `docs/features/**`、`CLAUDE.md`。

## 9. Commit / Push 执行结果

- 授权范围：仅 §5 列出的 2 个文件；逐文件精确暂存，不使用 `git add .` / `git add -A`。
- 提交信息：`docs(data-source-management): repair acceptance traceability [DATA-SOURCE-REQUIREMENTS-BASELINE-001-R1]`。
- 提交后核对提交文件清单严格为上述两个文件；未包含其他文件，随后推送。
- 推送：普通 `git push origin develop`，禁止 force push。
- 推送后核验：`git rev-parse HEAD` 与 `git rev-parse origin/develop` 一致，`git rev-list --left-right --count HEAD...origin/develop` 为 `0 0`；两个目标文件工作区状态正常；无关工作区内容保持原样。

说明：包含本报告自身的最终 Commit ID 无法在同一 Commit 内自洽生成，故本报告不填写最终提交 SHA；最终 result_commit_id、remote_commit_id、ahead_behind 以控制台 `AGENT_TASK_RESULT` 输出为准，由 ChatGPT 直接核验远程提交。本报告不保留任何伪装成实际值的尖括号占位符，也不制造第二个循环提交。

## 10. 下一步

本任务完成两个授权文件的修订/新增、验证、Commit 并 Push 后立即停止。下一步为 **`CHATGPT_REVIEW`**：由 ChatGPT 直接核验远程结果提交，确认验收文档逐例状态与需求追踪缺口已修复；**不得写成用户已批准**。需求与验收基线仍需在复审通过后由用户批准，批准后进入阶段 4“设计与契约”，不得直接进入代码实现。
