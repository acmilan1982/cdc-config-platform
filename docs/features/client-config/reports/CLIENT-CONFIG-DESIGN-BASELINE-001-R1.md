# 执行报告：CLIENT-CONFIG-DESIGN-BASELINE-001-R1

## 1. 任务身份

| 项目 | 值 |
|---|---|
| 任务编号 | `CLIENT-CONFIG-DESIGN-BASELINE-001-R1` |
| 任务类型 | 正式设计复审驱动的定向文档修订（纯文档） |
| Feature | `client-config`（页面最终名称“探针端管理”，路由 `/config/client`） |
| 目标分支 | `develop` |
| 执行日期 | 2026-09-04 |
| 实际基线提交 | `21f4729c43d146426e8d4f1b2d6b667cfcf160ff` |
| 报告路径 | `docs/features/client-config/reports/CLIENT-CONFIG-DESIGN-BASELINE-001-R1.md` |

文件白名单（仅允许修改/新增以下 7 个文件）：

1. 修改 `docs/features/client-config/DESIGN.md`
2. 修改 `docs/features/client-config/API.md`
3. 修改 `docs/features/client-config/UI.md`
4. 修改 `docs/features/client-config/DATABASE.md`
5. 修改 `docs/features/client-config/README.md`
6. 修改 `docs/features/README.md`
7. 新增 `docs/features/client-config/reports/CLIENT-CONFIG-DESIGN-BASELINE-001-R1.md`

## 2. 读取资料及现场核验

- 按项目规则读取六份项目级正式基线（`docs/baseline/` 下 `PROJECT.md`/`ENVIRONMENT.md`/`ARCHITECTURE.md`/`DEVELOPMENT_RULES.md`/`PROJECT_STATUS.md`/`DOMAIN_GLOSSARY.md`）与流程基线 `docs/baseline/FEATURE_DEVELOPMENT_AND_ADJUSTMENT_PROCESS.md`。
- 读取本 Feature 已批准基线 `REQUIREMENTS.md`（`CCFG-REQ-001~090`，`APPROVED`）、`ACCEPTANCE.md`（`CCFG-AC-001~076`，全部 `NOT_RUN`）以及四份设计草案、`client-config/README.md`、`docs/features/README.md`、初版执行报告 `reports/CLIENT-CONFIG-DESIGN-BASELINE-001.md`。
- 只读读取数据库批准基线 `docs/database/tables/CDC_CLIENT_MULTIPLE.md`、`docs/database/tables/CDC_DATA_SOURCE.md`；只读核对项目现有 `ApiResponse`、`GlobalExceptionHandler`、错误码与相邻 Feature 契约风格，未修改任何代码。
- 实际执行 `git fetch origin develop`（R1-09，见 §9），核验当前分支为 `develop`，本地 `HEAD`、`origin/develop`、`git ls-remote origin refs/heads/develop` 三者在任务开始前一致指向 `21f4729c43d146426e8d4f1b2d6b667cfcf160ff`，ahead/behind = `0 0`。

## 3. Git 现场与工作区既有修改保护

| 项目 | 值 |
|---|---|
| 分支 | `develop` |
| 本地 `develop` | `21f4729c43d146426e8d4f1b2d6b667cfcf160ff` |
| `origin/develop` | `21f4729c43d146426e8d4f1b2d6b667cfcf160ff` |
| `git ls-remote origin refs/heads/develop` | `21f4729c43d146426e8d4f1b2d6b667cfcf160ff` |
| ahead/behind | `0 0` |

工作区存在大量与本次任务无关的既有修改（tracked 修改/删除与 untracked 文件，分布于 `.claude/`、`agent-env.sh`、`docs/agent-prompts/`、`docs/database/`、`docs/features/` 若干、`frontend/` 若干等），本次任务只读取这些既有内容，不修改、不暂存、不提交。白名单 7 个文件中，四个设计文档与两份 README 在任务开始前均无与本任务重叠的工作区改动，本次改动全部由本任务产生；`REQUIREMENTS.md`/`ACCEPTANCE.md`/初版报告/`docs/database/` 一律不改。

## 4. 实际变更清单

| 文件 | 操作 |
|---|---|
| `docs/features/client-config/DESIGN.md` | 修改（R1 定向修订：编号扩至 `CCFG-DESIGN-001~037`） |
| `docs/features/client-config/API.md` | 修改（R1 重排为连续唯一编号 `CCFG-API-001~020`，修正初版重复定义） |
| `docs/features/client-config/UI.md` | 修改（编号扩至 `CCFG-UI-001~026`） |
| `docs/features/client-config/DATABASE.md` | 修改（编号扩至 `CCFG-DB-001~022`） |
| `docs/features/client-config/README.md` | 修改（文档导航与状态收口） |
| `docs/features/README.md` | 修改（仅同步 `client-config` 索引行并追加一条 R1 变更记录） |
| `docs/features/client-config/reports/CLIENT-CONFIG-DESIGN-BASELINE-001-R1.md` | 新增（本执行报告） |

实际变更清单与白名单完全一致，共 7 个文件；未触碰 `REQUIREMENTS.md`、`ACCEPTANCE.md`、初版报告、任何代码/测试/配置/脚本、`docs/database/` 或其他 Feature 文件。

## 5. 正式复审结论与 R1-01~R1-09 逐项修订证据

ChatGPT 对初版设计草案提交 `21f4729c...` 的正式设计复审结论为 `CHANGES_REQUIRED`。逐项修订证据：

| 编号 | 复审发现 | R1 修订证据 |
|---|---|---|
| R1-01 | `API.md` 实际存在 35 个 `| CCFG-API-nnn |` 定义行、只有 14 个不同编号（`CCFG-API-002` 2 次、`CCFG-API-003` 3 次、`CCFG-API-011` 3 次、`CCFG-API-012` 17 次）；初版报告“定义行 14、每个编号一行”结论不符事实；错误码明细表重复填同一编号；追踪矩阵用 `API-002`/`UI-003` 缩写 | 重写 `API.md`：定义行重排为连续唯一 `CCFG-API-001~020`，每个编号恰一个定义行（定义行数 = 不同编号数 = 20）；错误码明细表去掉“设计编号”列，由 `CCFG-API-017`/`018` 统一定义整表触发与覆盖契约；`DESIGN.md` §12 追踪矩阵全用完整 `CCFG-*` 编号；编号调整不改变业务语义。真实初版统计见 §6 |
| R1-02 | E1 列表只返回“异常优先排序”的 `items`，前端无法恢复原顺序，与“前三项异常优先 + 完整清单原顺序”冲突 | 统一单一顺序契约（`CCFG-DESIGN-014`/`API-005` 列表 VO/`UI-010`）：E1 `dataSources` 恒按“规范化去重后的原存储顺序”返回，后端不为前三项改序；前端仅算非持久化前三项投影（异常项稳定前置、组内保接口原顺序、再取前三），`+N` = 完整数组数量 − 直接显示数量；投影不原地改接口数组，不改表单选择/自动生成/保存顺序。前后对照见 §8 |
| R1-03 | `clientDesc` “后端做 Trim”易被实现为保存前删空白 | 固定原文保存口径（`CCFG-DESIGN-028/030`、`API-015`、`UI-013/014/015`、`DATABASE` `CCFG-DB-003`）：Trim 仅判空、不覆盖请求原始最终文本；UTF-8 `<=1024 BYTE` 按实际保存原文（含首尾空白）计；数据库存用户最终提交原文；编辑回显原样。补未来测试场景（仅空白拒、带空白 Trim 非空允许原文保存、恰好 1024 BYTE 允许、含空白原文超限拒） |
| R1-04 | DATABASE 只写 `LOWER(...) LIKE`，未定义 `%`/`_` 通配处理，字面量包含失真 | 补唯一转义方案（`CCFG-DESIGN-007`、`API-004`、`CCFG-DB-008` + 新增 `CCFG-DB-021`）：Trim 后以 `\` 为 LIKE 转义字符，依次转义 `\`→`\\`、`%`→`\%`、`_`→`\_`；绑定参数 `%{escaped}%` + SQL `ESCAPE '\'`；禁止 `${}`/拼接；测试覆盖关键词自身含 `%`/`_`/`\` |
| R1-05 | 存在未批准的数据源 ID“其他非法字符”限制 | 删除 `INVALID_DATA_SOURCE_ID` 文案“或非法字符”，`40104` 触发与 message 只对应已批准规则（数据源 ID 含英文逗号不可选）；不再为数据源 ID 新增字符白名单/正则；保存校验按已批准事实（非空、不含英文逗号、精确存在于允许候选、满足启用/SOURCE/ORACLE/唯一占用） |
| R1-06 | E1 异常枚举缺“已选数据源后来变非 SOURCE/非 ORACLE”，保存时突然失败 | 补齐项级稳定枚举 `CATEGORY_MISMATCH`/`TYPE_MISMATCH`（`CCFG-DESIGN-011/035`、`API-005`、`UI-010/014/016`、`CCFG-DB-022`）：E1 读类别/类型识别返回；UI 红色异常回显（原始数据源 ID、当前类别/类型与原因）；编辑存在此类异常与其他历史异常一致禁止保存；启用仅被跨探针重复分配冲突阻断；错误详情能指出具体数据源 ID 与不合格原因 |
| R1-07 | `COMMA_IN_ID` 只覆盖“整值等于某含逗号 ID”，未覆盖含逗号 ID 与其他 ID 并存、未消除 CSV 不可逆歧义 | 固定保守方案（`CCFG-DESIGN-010/036`、`API-005`、`UI-016/026`、`CCFG-DB-022`）：候选仍展示含逗号 ID 但禁选；读取执行普通 CSV 解析用于可确定 token；用只读“含逗号 ID 集合”按完整连续文本与 CSV 边界做可能匹配，行级返回 `rawDataSourceIds` + `COMMA_PROTOCOL_AMBIGUOUS` + `possibleCommaDataSourceIds`；页面完整展示原始串并标注“普通 CSV 解析的展示结果”；编辑可打开但在清除歧义前禁止保存、不静默拆分覆盖；含逗号 ID 已删除只能按缺失 token 标 `NOT_FOUND`，不猜测 |
| R1-08 | 批准基线 `CLIENT_DESC` 可空，但目标表单描述必填，历史 NULL 契约缺失 | 补齐（`CCFG-DESIGN-037`、`API-005`、`UI-005/025/014`、`CCFG-DB-003/022`）：E1 `clientDesc` 用 `string\|null`；列表 NULL/空白描述以确定占位符 `—` + Tooltip“未填写探针描述”；编辑打开 NULL 映射空输入、非 NULL（含首尾空白）原样回显；不阻止打开/删除/停用/启用；保存仍须补齐为 Trim 后非空且原文 `<=1024 BYTE`；不自动写回、不自动生成、不把 NULL 持久化空串 |
| R1-09 | 初版报告写“本次任务不执行 git fetch”，与初版提示词强制开始检查不一致 | 本任务实际执行 `git fetch origin develop`（见 §9 与 §3 现场）；在初版报告真实历史基础上如实记录初版偏差，不改写初版报告；本报告不沿用初版错误编号统计，改用真实统计（§6） |

## 6. API 设计编号真实统计与 R1 修订后统计

初版 `API.md`（提交 `21f4729c...`）真实定义行统计（按 `| CCFG-API-nnn |` 起始行独立计数，非 distinct 编号计数）：

| 项目 | 数值 |
|---|---|
| 定义行总数 | 35 |
| 不同编号数 | 14 |
| 重复定义编号 | `CCFG-API-002`×2、`CCFG-API-003`×3、`CCFG-API-011`×3、`CCFG-API-012`×17 |
| 编号范围 | 001~014（14 个不同编号全部出现、无缺失，但 `002`/`003`/`011`/`012` 被重复用作定义行，定义行数 35 ≠ 不同编号数 14） |

初版报告 §5 声称“API 定义行数 14、每个编号仅一行定义”，与文件事实（35 行、多处重复）不符；该错误结论不在本报告沿用。

R1 修订后 `API.md` 定义行统计（独立只读脚本核验）：

| 项目 | 数值 |
|---|---|
| 定义行总数 | 20 |
| 不同编号数 | 20 |
| 编号区间 | `CCFG-API-001~020`，连续 |
| 重复定义编号 | 无 |
| 每个编号定义行 | 恰 1 行 |

错误码明细表不含“设计编号”列；`DESIGN.md` §12 追踪矩阵改为全称编号。

## 7. 四文档最终编号区间、定义行数、唯一性与交叉引用验证

| 文档 | 编号区间 | 定义行数 | 连续性 | 唯一性 |
|---|---|---|---|---|
| `DESIGN.md` | `CCFG-DESIGN-001~037` | 37 | 通过（001~037 连续） | 每个编号恰一行定义，无重复 |
| `API.md` | `CCFG-API-001~020` | 20 | 通过（001~020 连续） | 同上 |
| `UI.md` | `CCFG-UI-001~026` | 26 | 通过（001~026 连续） | 同上 |
| `DATABASE.md` | `CCFG-DB-001~022` | 22 | 通过（001~022 连续） | 同上 |

- 每个编号定义行数 = 该文档不同编号数，四文档均无重复定义。
- 跨文档引用核验：四文档中出现的全部 `CCFG-(DESIGN|API|UI|DB)-\d{3}` 引用均能在对应文档内解析到唯一定义行，无悬空引用（`unresolved_design_reference_count=0`）；无 `API-xxx`/`UI-xxx`/`DESIGN-xxx`/`DB-xxx` 缩写残留（独立只读脚本 + 全量扫描核验）。
- 初始版本的旧编号范围只在各文档“2026-09-03 初版”变更记录行内作为历史事实保留，不作为当前状态。

## 8. 数据源顺序契约前后对照

| 维度 | 初版（复审前冲突） | R1（修订后单一契约） |
|---|---|---|
| E1 返回数组 | `API.md` 只返回“异常优先”的 `items`，前端无法恢复原顺序 | `dataSources` 恒按“规范化去重后的原存储顺序”返回 |
| 后端改序 | 列表前三项依赖接口改序 | 后端绝不为列表前三项改变数组顺序 |
| 前端前三项 | —— | 计算非持久化投影：异常项稳定前置、组内保接口原顺序，再取前三项 |
| `+N` | —— | `N` = 完整数组数量 − 直接显示数量 |
| 完整清单/编辑回显 | 异常优先数组 | 一律使用接口原顺序数组 |
| 投影副作用 | —— | 投影不原地修改接口数组，不改表单选择/自动生成/保存顺序；展示去重不写回数据库 |

## 9. 初版未 fetch 的历史过程偏差与 R1 fetch 结果

- 初版任务 `CLIENT-CONFIG-DESIGN-BASELINE-001` 执行时未执行 `git fetch`，其执行报告写明“本次任务不执行 `git fetch`”。该记录与初版提示词“开始前必须 fetch”的强制要求不一致，属过程偏差。按 R1-09 要求：不改写初版报告，本报告如实记录该偏差。
- 本任务已实际执行 `git fetch origin develop`：成功拉取 `origin/develop` 到 `FETCH_HEAD`；随后核验当前分支为 `develop`，本地 `HEAD`、`origin/develop`、`git ls-remote origin refs/heads/develop` 三者一致为 `21f4729c43d146426e8d4f1b2d6b667cfcf160ff`，ahead/behind = `0 0`（见 §3）。远程在本次执行期间未前进。

## 10. 并发表锁方案保持不变的核验

正式复审通过的并发表锁主体设计未做无关重写，R1 修订后逐项复核仍保持：

1. Oracle 显式表锁 `LOCK TABLE CDC_CLIENT_MULTIPLE IN EXCLUSIVE MODE WAIT 5`（`CCFG-DESIGN-023/024`、`CCFG-DB-009`）。
2. 锁等待超时 `ORA-30006` → 业务错误 `50050`，整笔回滚。
3. 新增/编辑/启用：同一短事务，先获取表锁，再锁内全表重查权威校验（探针 ID ASCII 大小写不敏感唯一 + 全部数据源唯一分配，编辑按 `originalClientId` 排除自身），再写入且行数必须为 1。
4. 探针 ID 保存保留用户最终大小写；同一数据源最多分配给一个探针，停用不释放；并发争抢最多一个成功。
5. 删除为不取表锁的短事务物理删除且不检查其他表/进程关联；停用只更新 `FG_ACTIVE='0'`、启用只更新 `FG_ACTIVE='1'` 且执行重复分配检查；列表/候选读取不取锁。
6. 本 Feature 不连接源库、不操作进程/ZooKeeper/Kafka、不执行 DDL，不自动修复历史脏数据。

## 11. 需求/验收零差异与 90/90、76/76 追踪覆盖

| 覆盖项 | 目标 | 检查结果 |
|---|---|---|
| 需求设计覆盖 | `CCFG-REQ-001~090` | 90/90（90 条全部至少被一个设计项覆盖；总矩阵见 `DESIGN.md` §12.1） |
| 验收设计覆盖 | `CCFG-AC-001~076` | 76/76（76 条全部可追踪到相应设计项；总矩阵见 `DESIGN.md` §12.2） |

- `REQUIREMENTS.md`/`ACCEPTANCE.md` 相对起点 `21f4729c43d146426e8d4f1b2d6b667cfcf160ff` 零差异（`git diff --stat` 为空）。
- 需求仍 90 条、验收仍 76 条；76 条验收用例仍全部 `NOT_RUN`。本次修订对象是设计草案，不改变已批准需求/验收。
- §12 追踪矩阵按各设计项“覆盖需求/覆盖验收”逐行重建，缺失 REQ/AC 数为 0。

## 12. 状态、git diff --check 与禁止文件检查

- 状态词检查：`REQUIREMENTS.md`/`ACCEPTANCE.md` 状态 `APPROVED`（批准的是验收标准，不是验收执行结果）；`DESIGN.md`/`API.md`/`UI.md`/`DATABASE.md` 状态均为 `DRAFT_PENDING_USER_REVIEW`、`PENDING_USER_CONFIRMATION=0`，未自行批准为 `APPROVED`；实现状态仍为 `NOT_STARTED`；验收执行状态仍为 `NOT_RUN`。
- `git diff --check`：通过（无空白错误）。
- 禁止文件检查：实际变更文件严格等于白名单 7 个；未修改代码、测试、配置、脚本、`docs/database/`、其他 Feature 文件与初版报告；未执行数据库/ZK/Kafka/服务操作（见 §13）。

## 13. 未执行事项及原因

| 事项 | 状态 | 原因 |
|---|---|---|
| 后端构建/测试 | `NOT_RUN_NOT_REQUIRED_DOCS_ONLY` | 纯文档任务，无代码改动；按验证矩阵不适用 |
| 前端构建/测试 | `NOT_RUN_NOT_REQUIRED_DOCS_ONLY` | 纯文档任务，无前端改动；按验证矩阵不适用 |
| 数据库访问 | `NOT_RUN_NOT_AUTHORIZED` | 本任务不连接 Oracle、不查询、不构造数据 |
| DDL/DML 写操作 | `NONE`（`DDL_STATUS=NONE`） | 未获授权且任务不需要；不提出也不执行任何 `ALTER`，不改写 `docs/database/` |
| ZooKeeper/Kafka 操作 | `NOT_RUN_NOT_AUTHORIZED` | 本 Feature 不操作 ZooKeeper/Kafka/Topic |
| 服务启动/停止 | `NONE` | 任务不要求启动程序 |
| 代码实现 | `NOT_STARTED` | 设计草案未经正式 R1 复审与批准，不得进入实现 |
| 正式验收执行 | `NOT_RUN` | 76 条验收用例全部未执行 |

## 14. Commit、Push 与远程一致性

- 计划提交信息：`docs(client-config): revise design baseline after review`。
- 提交范围：仅白名单 7 个文件，逐个暂存，禁止宽泛 `git add .`/`-A`。
- Push：普通 Push 到 `origin/develop`，禁止 force push；若远程在执行期间前进则停止并报告，不覆盖。
- 按规则，本报告不预填包含自身的最终提交 ID；Push 后核验本地 `HEAD`、`origin/develop` 与 `git ls-remote` 三者一致、ahead/behind 为 `0 0`，该结果以任务控制台结果块输出，不写入本报告（避免报告内含自身最终提交 ID）。

## 15. 下一入口

`CHATGPT_FORMAL_DESIGN_R1_REVIEW`：由 ChatGPT 对 `DESIGN.md`/`API.md`/`UI.md`/`DATABASE.md` 四份经 R1 定向修订的设计草案进行正式 R1 复审；设计草案须经 ChatGPT 正式 R1 复审通过并经项目负责人批准后才能进入实现阶段，不得跳过设计直接实现代码。

## 16. 变更记录

| 日期 | 变更 | 依据 |
|---|---|---|
| 2026-09-04 | 新增 `docs/features/client-config/reports/CLIENT-CONFIG-DESIGN-BASELINE-001-R1.md`，记录 ChatGPT 正式设计复审 `CHANGES_REQUIRED`（R1-01~R1-09）驱动的四文档定向修订、API 编号真实/修订后统计、四文档编号区间与唯一性、顺序契约对照、`CLIENT_DESC` 原文保存/LIKE 转义/数据源 ID 限制删除/历史异常与 NULL 描述契约、并发表锁方案保持、90/90 与 76/76 覆盖、初版未 fetch 偏差与本次 fetch 结果；四文档保持 `DRAFT_PENDING_USER_REVIEW`、`PENDING_USER_CONFIRMATION=0`，实现 `NOT_STARTED`、76 条验收 `NOT_RUN`；未修改 `REQUIREMENTS.md`/`ACCEPTANCE.md`/代码/测试/配置/数据库基线/初版报告 | CLIENT-CONFIG-DESIGN-BASELINE-001-R1（正式复审 `CHANGES_REQUIRED` 定向修订；纯文档任务，未实现、未执行验收、未连接数据库、未执行 DDL/DML、未操作 ZK/Kafka/服务） |
