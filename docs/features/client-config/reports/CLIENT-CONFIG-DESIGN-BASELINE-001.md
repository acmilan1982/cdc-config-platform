# 执行报告：CLIENT-CONFIG-DESIGN-BASELINE-001

## 1. 任务身份

| 项目 | 值 |
|---|---|
| 任务编号 | `CLIENT-CONFIG-DESIGN-BASELINE-001` |
| 任务类型 | 阶段 4 设计基线（纯文档，设计草案建立） |
| Feature | `client-config`（页面最终名称“探针端管理”，路由 `/config/client`） |
| 目标分支 | `develop` |
| 执行日期 | 2026-09-03 |
| 实际基线提交 | `cecfdd5478df8b82ba39c083553ea8dd7ead48e8` |
| 报告路径 | `docs/features/client-config/reports/CLIENT-CONFIG-DESIGN-BASELINE-001.md` |

## 2. 读取资料及现场核验结果

- 按项目规则读取六份项目级正式基线（`docs/baseline/` 下 `PROJECT.md`/`ENVIRONMENT.md`/`ARCHITECTURE.md`/`DEVELOPMENT_RULES.md`/`PROJECT_STATUS.md`/`DOMAIN_GLOSSARY.md`）。
- 读取本 Feature 已批准基线：`REQUIREMENTS.md`（`CCFG-REQ-001~090`，`APPROVED`）、`ACCEPTANCE.md`（`CCFG-AC-001~076`，全部 `NOT_RUN`，`APPROVED` 的是验收标准而非验收执行结果）以及 `client-config/README.md`。
- 读取数据库批准基线 `docs/database/` 中与 `CDC_CLIENT_MULTIPLE`/`CDC_DATA_SOURCE` 相关表文档（含 `CLIENT_DESC VARCHAR2(256)` 历史核验事实），只读，未改写任何 `docs/database/` 文件。
- 读取相邻 Feature（监控侧）代码中的响应与异常规约：`ApiResponse<T>`、`GlobalExceptionHandler`、同名 Mapper 占用情况，据此确定错误码空闲号段与避免新建 `ClientConfigMapper` 同名的候选类命名。
- 现场核验：当前分支 `develop`；本地 `develop`、`origin/develop`、`git ls-remote` 三者在任务开始前一致指向 `cecfdd5478df8b82ba39c083553ea8dd7ead48e8`，ahead/behind = `0 0`。本次任务不执行 `git fetch`。

## 3. Git 现场与工作区既有修改保护

| 项目 | 值 |
|---|---|
| 分支 | `develop` |
| 本地 `develop` | `cecfdd5478df8b82ba39c083553ea8dd7ead48e8` |
| `origin/develop` | `cecfdd5478df8b82ba39c083553ea8dd7ead48e8` |
| `git ls-remote origin refs/heads/develop` | `cecfdd5478df8b82ba39c083553ea8dd7ead48e8` |
| ahead/behind | `0 0` |

工作区存在大量与本次任务无关的既有修改（tracked 修改/删除与 untracked 文件，分布于 `.claude/`、`agent-env.sh`、`docs/database/`、`docs/agent-prompts/`、`docs/baseline-work/`、`docs/code/`、`docs/large-screen/`、`docs/pages/`、`docs/prompts/`、`docs/screenshots/`、`docs/task-reports/`、`docs/features/app-shell/`、`docs/features/large-screen/`、`frontend/` 若干文件、`package-lock.json` 等）。本次任务只读取这些既有文件，不修改、不暂存、不提交。

白名单 7 个文件在任务开始前均无工作区未提交改动（`docs/features/client-config/` 与 `docs/features/README.md` 已随 `cecfdd5` 提交，工作区干净），本次改动全部由本任务产生，不存在归属无法区分的既有修改。

## 4. 新增/修改文件白名单与实际变更清单

| 文件 | 操作 |
|---|---|
| `docs/features/client-config/DESIGN.md` | 新增（逻辑设计草案，`CCFG-DESIGN-001~034`） |
| `docs/features/client-config/API.md` | 新增（接口契约草案，`CCFG-API-001~014`） |
| `docs/features/client-config/UI.md` | 新增（界面设计草案，`CCFG-UI-001~024`） |
| `docs/features/client-config/DATABASE.md` | 新增（数据库使用设计草案，`CCFG-DB-001~020`） |
| `docs/features/client-config/README.md` | 修改（文档导航与状态收口） |
| `docs/features/README.md` | 修改（仅同步 `client-config` 索引行并追加一条设计基线变更记录） |
| `docs/features/client-config/reports/CLIENT-CONFIG-DESIGN-BASELINE-001.md` | 新增（本执行报告） |

实际变更清单与白名单完全一致，共 7 个文件；未触碰 `REQUIREMENTS.md`、`ACCEPTANCE.md`、任何代码、测试、配置、数据库基线或其他 Feature 文件。

## 5. 四文档设计编号数量与唯一性检查

| 文档 | 编号区间 | 定义行数 | 连续性 | 唯一性 |
|---|---|---|---|---|
| `DESIGN.md` | `CCFG-DESIGN-001~034` | 34 | 通过（1~34 连续） | 每个编号仅一行定义，引用可解析 |
| `API.md` | `CCFG-API-001~014` | 14 | 通过（1~14 连续） | 同上 |
| `UI.md` | `CCFG-UI-001~024` | 24 | 通过（1~24 连续） | 同上 |
| `DATABASE.md` | `CCFG-DB-001~020` | 20 | 通过（1~20 连续） | 同上 |

- 跨文档引用核验：全部可引用设计编号均能在对应文档内解析到定义行，无悬空引用；四类编号无重复。
- 自检采用独立只读脚本完成（临时脚本，未入库），结果与上表一致。

## 6. 需求/验收追踪覆盖检查

| 覆盖项 | 目标 | 检查结果 |
|---|---|---|
| 需求设计覆盖 | `CCFG-REQ-001~090` | 90/90（90 条全部至少被一个设计项覆盖；总矩阵见 `DESIGN.md` §12.1） |
| 验收设计覆盖 | `CCFG-AC-001~076` | 76/76（76 条全部可追踪到相应设计；总矩阵见 `DESIGN.md` §12.2） |

- 文本覆盖复核：`CCFG-REQ-001~090` 90 条与 `CCFG-AC-001~076` 76 条编号在四文档范围内全部出现且可追踪，缺数为 0。
- 需求文档仍为 90 条、验收文档仍为 76 条；76 条验收用例仍全部 `NOT_RUN`。本次批准对象不改变，设计草案不构成“验收通过”或“实现完成”。

## 7. 四文档接口/字段/错误码/状态/事务一致性

四文档共用一套已锁定的契约（以 `API.md` 为接口文字权威，其余文档引用接口标识 E1~E7，不出现冲突路径字面量）：

- 接口集合固定 E1~E7：`GET /api/clients`（列表）、`GET /api/clients/data-source-options`（候选）、`POST /api/clients`（新增）、`PUT /api/clients/{originalClientId}`（编辑）、`DELETE /api/clients/{clientId}`（删除）、`PUT /api/clients/{clientId}/enable`（启用）、`PUT /api/clients/{clientId}/disable`（停用）；不设详情 GET、分页、批量与进程控制接口。
- 请求模型：`CreateClientRequest{clientId,clientDesc,dataSourceIds[]}`、`UpdateClientRequest{clientId,clientDesc,dataSourceIds[]}`，均不含状态/启停字段；`originalClientId` 走 E4 路径参数。
- 视图模型：`ClientListVO/ClientListItemVO/DataSourceViewItemVO/DataSourceOptionVO` 字段名在四文档一致（如 `fgActive` 保留原始字符串、`status` 为 `ENABLED/DISABLED/ABNORMAL`、异常枚举 `INACTIVE/NOT_FOUND/COMMA_IN_ID/DUPLICATE_IN_ROW/ASSIGNED_TO_MULTIPLE_CLIENTS`）。
- 错误码统一在 `API.md` §8 定义并在 DESIGN/UI/DATABASE 复用：业务失败以 HTTP 200 + 业务 `code` 返回、`data=null`、细节写入 `message`；框架级 400/500。错误码区间不与现有模块冲突。
- 状态机、写操作原子性、事务边界在四文档一致：新增/编辑/启用 = 事务 + 表级互斥锁 + 锁内重查权威校验 + 行数必须为 1 + 失败整笔回滚；停用/删除 = 不取表锁的短事务；读取不取锁。
- `PENDING_USER_CONFIRMATION` 数量：0（四文档均记录为 0，无必须由项目负责人决定且无法由已批准需求推导的阻断项，可进入正式设计复审）。

## 8. 表级锁并发方案及为何普通“先查后写”不足

新增/编辑/启用采用确定性并发方案：在写事务内、任何权威校验之前先执行 `LOCK TABLE CDC_CLIENT_MULTIPLE IN EXCLUSIVE MODE WAIT 5`（有限等待 5 秒，超时 `ORA-30006` 映射 `50050` 并整笔回滚），锁内重新读取全表并按“ASCII 大小写不敏感探针 ID 唯一（编辑按 `originalClientId` 排除自身）+ 全部数据源唯一分配”做权威校验，再写入且行数必须为 1。

已明确论证以下替代方案均不足，必须以表级互斥锁为权威（见 `DESIGN.md` `CCFG-DESIGN-025`）：

1. 仅前端禁选：可被直接调接口绕过，且只覆盖健康候选，管不住历史脏数据与并发；
2. Java 进程内 `synchronized`/`ConcurrentHashMap`：只在本 JVM 有效，多实例/重启失效，数据库仍是最终权威；
3. 普通“先查后写”：检查与写入之间存在竞态窗口，两请求可同时通过检查再同时写入，形成幻读式重复分配或大小写仅不同的重复 ID；
4. 仅锁已存在行的 `SELECT ... FOR UPDATE`：只能锁已存在行，无法阻止并发 `INSERT` 新行在检查后、写入前插入（幻影插入），也无法对“尚不存在的目标新行”提供唯一性保证。

Oracle 一致性读（普通 `SELECT` 不取 `TM` 锁）在表锁持有期间照常可读，因此列表/候选读取设计为不依赖表锁；并发写入方（含其他模块对同一表的 DML）与 `EXCLUSIVE` 表锁互斥而等待，从而把配置写入串行化。锁获取必须先于任何权威唯一性检查。

## 9. CLIENT_DESC 256 历史基线与真实 1024 BYTE 元数据分层

严格区分三层事实，互不覆盖（`DATABASE.md` §2 `CCFG-DB-001`）：

1. 已批准数据库基线（`docs/database/`）仍记录 `CLIENT_DESC VARCHAR2(256)` 的历史核验事实；本任务不改写 `docs/database/` 任何文件。
2. 项目负责人正式复审于真实数据库查询得到的元数据为 `VARCHAR2(1024 BYTE)`（`DATA_LENGTH=1024`、`CHAR_LENGTH=1024`、`CHAR_USED=B`）。
3. 本 Feature 已批准需求统一采用 `1024 BYTE` 语义：去除首尾空白后必填、UTF-8 编码字节数 `<=1024`。

数据库基线同步是后续独立的数据库只读核验与同步任务；本设计任务不重新连接数据库验证 1024，不提出也不执行任何 `ALTER`。`DATA_SOURCE_ID` 序列化结果按 BYTE 校验不超过物理 `VARCHAR2(1000)`。

## 10. git diff --check、状态词与禁止文件检查

- `git diff --check`：通过（无空白错误）。
- 变更文件清单：严格等于白名单内 7 个文件；`REQUIREMENTS.md`/`ACCEPTANCE.md` 相对基线提交 `cecfdd5` 零差异。
- 状态词检查：
  - `REQUIREMENTS.md` 状态 `APPROVED`、`ACCEPTANCE.md` 状态 `APPROVED`（批准的是验收标准，不是验收执行结果）；
  - `DESIGN.md`/`API.md`/`UI.md`/`DATABASE.md` 状态均为 `DRAFT_PENDING_USER_REVIEW`，未错误出现 `APPROVED` 作为四份新设计文档的当前状态；`PENDING_USER_CONFIRMATION=0`；
  - 实现状态仍为 `NOT_STARTED`；验收执行状态仍为 `NOT_RUN`。
- 禁止内容搜索：四文档及两份 README 中“密码字段”仅以“禁止读取/传输/返回”的否定形式出现；分页、自动刷新、进程/`sync-client` 启停通知、ZooKeeper/Kafka 调用、源库连接、Schema/表读取、DDL 与数据库基线修改仅以“不提供/不引入/不执行/不操作”的否定形式出现；成功文案未出现“实时生效/已启停/已自动修复”等错误承诺。页面反馈、接口与写路径均不声称配置已实时作用于运行中的 `sync-client` 进程。

## 11. 未执行事项及原因

| 事项 | 状态 | 原因 |
|---|---|---|
| 后端构建/测试 | `NOT_RUN_NOT_REQUIRED_DOCS_ONLY` | 纯文档任务，无代码改动；按验证矩阵不适用 |
| 前端构建/测试 | `NOT_RUN_NOT_REQUIRED_DOCS_ONLY` | 纯文档任务，无前端改动；按验证矩阵不适用 |
| 数据库访问 | `NOT_RUN_NOT_AUTHORIZED` | 本任务不连接 Oracle、不查询、不构造数据 |
| DDL/DML 写操作 | `NONE`（`DDL_STATUS=NONE`、`DML_STATUS=NONE`） | 未获授权且任务不需要；不提出也不执行任何 `ALTER`，不改写 `docs/database/` |
| ZooKeeper/Kafka 操作 | `NOT_RUN_NOT_AUTHORIZED` | 本 Feature 不操作 ZooKeeper/Kafka/Topic |
| 服务启动/停止 | `NONE` | 任务不要求启动程序 |
| 代码实现 | `NOT_STARTED` | 设计草案未经正式复审与批准，不得进入实现 |
| 正式验收执行 | `NOT_RUN` | 76 条验收用例全部未执行 |

## 12. Git 提交、Push 与远程一致性核验

- 提交信息（建议）：`docs(client-config): add design baseline draft`。
- 提交范围：仅白名单 7 个文件，逐个暂存，禁止宽泛 `git add .`/`-A`。
- Push：普通 Push 到 `origin/develop`，禁止 force push；若远程在执行期间前进则停止并报告，不覆盖。
- 提交前核验：本地 `develop` == `origin/develop` == `git ls-remote` == `cecfdd5...`，ahead/behind = `0 0`。
- 按规则，本报告不预填包含自身的最终提交 ID；Push 后需核验本地 `HEAD`、`origin/develop` 与 `git ls-remote` 三者一致、ahead/behind 为 `0 0`，该结果以任务控制台结果块输出，不写入本报告。

## 13. 下一入口

`CHATGPT_FORMAL_DESIGN_REVIEW`：由 ChatGPT 对 `DESIGN.md`/`API.md`/`UI.md`/`DATABASE.md` 四份设计草案进行正式设计复审；设计草案须经 ChatGPT 正式复审通过并经项目负责人批准后才能进入实现阶段，不得跳过设计直接实现代码。

## 14. 变更记录

| 日期 | 变更 | 依据 |
|---|---|---|
| 2026-09-03 | 新建 `docs/features/client-config/DESIGN.md`/`API.md`/`UI.md`/`DATABASE.md` 设计草案与 `README.md`/`docs/features/README.md` 状态收口，状态均 `DRAFT_PENDING_USER_REVIEW`，`PENDING_USER_CONFIRMATION=0`，不改写 `REQUIREMENTS.md`/`ACCEPTANCE.md`/代码/测试/配置/数据库基线 | CLIENT-CONFIG-DESIGN-BASELINE-001（阶段 4 设计基线；纯文档任务，未实现、未执行验收、未连接数据库、未执行 DDL/DML） |
