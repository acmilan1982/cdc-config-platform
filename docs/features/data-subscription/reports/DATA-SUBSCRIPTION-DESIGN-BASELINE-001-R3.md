# 任务执行报告：数据订阅设计基线 R3 定向修订（DATA-SUBSCRIPTION-DESIGN-BASELINE-001-R3）

## 1. 任务目的和依据的批准提交

| 项目 | 值 |
|---|---|
| 任务编号 | `DATA-SUBSCRIPTION-DESIGN-BASELINE-001-R3` |
| 前序设计任务 | `DATA-SUBSCRIPTION-DESIGN-BASELINE-001`（结果提交 `6104015...`）、`DATA-SUBSCRIPTION-DESIGN-BASELINE-001-R1`（结果提交 `3609548...`）、`DATA-SUBSCRIPTION-DESIGN-BASELINE-001-R2`（结果提交 `026417e7...`） |
| 需求调整链 | `DATA-SUBSCRIPTION-NO-CONCURRENCY-REQUIREMENTS-ADJUSTMENT-001`（草案提交 `afc5765...`）、`...-001-R1`（R1 定向修订提交 `27a27e3...`、`bb8716c...` 为更早历史）、`...-APPROVAL-001`（ChatGPT 对 R1 结果提交 `43a9097...` 正式复审 `APPROVED` 后的批准收口提交 `8331fbb...`） |
| 本任务依据的批准提交 | `8331fbb6e17b8e2165b788d972f651aa980bf227`（“取消并发保护”需求/验收调整正式批准收口，本任务基准提交） |
| 任务性质 | 纯文档设计基线 R3 定向修订（**不得修改业务代码、测试代码或配置，不访问数据库，不执行 DDL/DML，不操作 ZooKeeper/Kafka/sync-client 或业务进程**） |
| Feature | 数据订阅（`data-subscription`） |
| 分支 | `develop` |
| 基准提交（base_commit_id） | `8331fbb6e17b8e2165b788d972f651aa980bf227` |
| 结果提交（result_commit_id） | 见控制台 `AGENT_TASK_RESULT`（本报告不预先伪造尚未产生的提交号） |
| 远程提交（remote_commit_id） | 见控制台 `AGENT_TASK_RESULT` |
| ahead/behind | 见控制台 `AGENT_TASK_RESULT` |
| commit_status / push_status | 见控制台 `AGENT_TASK_RESULT` |

任务目的：产品负责人已批准“取消并发保护”需求与验收调整（`DSUB-REQ-097/098/099/103` 与 `DSUB-AC-107/108/109/110/114/117`），本任务据此对四份设计基线草案做 R3 定向修订——删除版本令牌/内容指纹/黄金向量/行锁/并发字段比较/`40910` 并发错误码，编辑与删除改为普通主键读写，删除预览只读不返回令牌，修正多源库空 token 判定，补充 nullable CSV 的 null-safe 契约，并保留 R2 已通过的三类查询语义、元数据 API query 参数、物化视图显式排除等全部正确设计不回退。

## 2. 开始前 Git 状态

执行开始前记录（`git branch --show-current` / `git status --short` / `git rev-parse HEAD` / `git rev-parse origin/develop` / `git rev-list --left-right --count HEAD...origin/develop`）：

- 当前分支：`develop`。
- 本地 HEAD：`8331fbb6e17b8e2165b788d972f651aa980bf227`。
- `origin/develop`：`8331fbb6e17b8e2165b788d972f651aa980bf227`（与本地一致，ahead/behind = `0 0`）。
- 开始前工作区存在大量与本任务无关的既有修改与未跟踪文件（`.claude/settings.local.json`、`agent-env.sh`、`frontend/index.html` 与 `frontend/src/**`、`docs/agent-prompts/**`、`docs/database/TASK3/4*` 删除、`docs/features/app-shell/` 与 `docs/features/large-screen/` 未跟踪目录等），本任务未清理、未回滚、未覆盖、未暂存、未提交任何既有修改。
- 本任务 5 个拟修改文件（DESIGN.md、API.md、UI.md、DATABASE.md、docs/features/README.md）与 1 个拟新增文件（本报告）在开始前均无未提交修改，可安全处理。
- 未使用 `git add .`、`git add -A` 等全量暂存；只逐文件暂存本任务授权文件。
- 未执行任何破坏性 Git 命令。

## 3. 授权范围和实际文件

授权范围（R3 提示词 §4）：5 个修改文件 + 1 个新增文件，共 6 个授权文件。

| 文件 | 动作 |
|---|---|
| `docs/features/data-subscription/DESIGN.md` | 修改 |
| `docs/features/data-subscription/API.md` | 修改 |
| `docs/features/data-subscription/UI.md` | 修改 |
| `docs/features/data-subscription/DATABASE.md` | 修改 |
| `docs/features/README.md` | 修改（仅 `data-subscription` 行 + 追加一条 R3 变更记录） |
| `docs/features/data-subscription/reports/DATA-SUBSCRIPTION-DESIGN-BASELINE-001-R3.md` | 新增（本报告） |

实际提交范围与授权范围完全一致：提交暂存区仅含上述 6 个文件，`git diff --cached --name-status` 未出现其他文件。未修改 `REQUIREMENTS.md`、`ACCEPTANCE.md` 或任何既有报告。

## 4. 四份设计文档状态

收口后四份设计文档状态（与 R2 一致保持草案，仅设计复审状态更新）：

| 文档 | 基线状态 | 设计复审状态 | 实现状态 |
|---|---|---|---|
| DESIGN.md | `DRAFT_PENDING_USER_REVIEW` | `PENDING_R3_REVIEW` | `NOT_STARTED` |
| API.md | `DRAFT_PENDING_USER_REVIEW` | `PENDING_R3_REVIEW` | `NOT_STARTED` |
| UI.md | `DRAFT_PENDING_USER_REVIEW` | `PENDING_R3_REVIEW` | `NOT_STARTED` |
| DATABASE.md | `DRAFT_PENDING_USER_REVIEW` | `PENDING_R3_REVIEW` | `NOT_STARTED` |

需求/验收基线保持 `APPROVED`（107 条 / 126 条，当前正式批准版本为“取消并发保护”需求与验收调整版本，批准依据提交 `43a9097...`）。126 条验收全部 `NOT_RUN`。本报告不声称设计已批准、功能已实现或验收已通过。

## 5. 删除的并发机制完整清单

R3 依据已批准“取消并发保护”产品边界（`DSUB-REQ-097/098/099/103`），从四份规范性设计文档中删除以下机制，未以任何替代方案重新引入：

1. **版本令牌 `versionToken`**：编辑打开、编辑保存请求、删除预览响应全部移除版本令牌字段与闭环。
2. **内容指纹 `DSUB-FP-V1`**：删除固定头/10 字段 FieldFrame 帧编码/SHA-256/`TO_CHAR` 日期指纹 SQL/黄金测试向量定义。
3. **黄金向量**：删除 `bc1e643a...`（407 字节）黄金测试向量及两次独立复核说明。
4. **行锁**：删除 `SELECT ... FOR UPDATE` 原子行锁、锁行内重读与锁行内比较流程。
5. **并发字段比较**：删除编辑保存与删除前基于打开快照/指纹的逐字段一致性比较。
6. **`40910 CONCURRENT_MODIFIED`**：删除错误码及其“刷新后重新编辑”分支处理，错误码总数由 26 更新为 25。
7. **`UPDATE_TIME` 比较 / 内容一致性比较**：编辑与删除不再读取或比较 `UPDATE_TIME` 或任何内容指纹作为并发判定。

对旧术语的残留提及仅允许以“已删除的历史设计”形式存在于 R3 变更记录/说明中，不构成现行规范；正文不再出现可作为现行实现的版本令牌/指纹/行锁/`40910` 描述。

## 6. 编辑打开与保存的新契约

编辑打开（API.md §4.7）与编辑保存（API.md §4.8、DESIGN.md §5.2、DATABASE.md §5.2）改为普通主键读写：

- **编辑打开**：按 `DATA_SUB_ID` 普通 `SELECT` 回显，响应不含 `versionToken`，不锁行、不返回任何并发令牌。
- **编辑保存（PUT）**：请求不含 `versionToken`。完成现有业务校验（参数/必填校验、数据源/表失效校验、多源库异常限制、PRESERVE/REPLACE 语义复核）→ 按 `DATA_SUB_ID` 普通 `UPDATE`（不带 `FOR UPDATE`、不带指纹或版本令牌）→ 检查受影响行数处理记录不存在。PRESERVE 模式要求写入字段与当前记录一致，REPLACE 模式用请求字段覆盖。
- **无并发保证**：编辑打开与保存之间记录被其他页面或人工修改 → 不报并发错误，按普通更新语义处理；最后一次成功写入生效。记录在保存时已不存在 → `40430 SUBSCRIPTION_NOT_FOUND`。
- **无 `UPDATE_TIME` 比较**：保存不读取/不比较打开时与保存时的 `UPDATE_TIME` 或内容指纹。

## 7. 删除预览与删除的新契约

删除预览（API.md §4.9）与删除（API.md §4.10、DESIGN.md §5.3、DATABASE.md §5.2）改为普通只读 + 普通主键删除：

- **删除预览**：普通只读回显，不锁行、不返回 `versionToken`；与删除确认构成两步闭环，预览仅展示记录当前内容。
- **删除（DELETE）**：请求仅路径参数 `{dataSubId}`，无 JSON 请求体、无令牌；直接按 `DATA_SUB_ID` 物理删除（普通主键 `DELETE`，不带锁行/指纹比较）。
- **无并发冲突检测**：预览后记录被其他页面或人工修改 → 不报并发错误，按普通删除语义处理；记录已不存在 → `40430`。
- 删除预览接口**保留**，未删除，仅改为只读不返回令牌。

## 8. API 和 UI 调整

### API 调整

- 能力总数保持恰好 10 个；删除预览接口保留。
- `versionToken` 从编辑打开响应、编辑保存请求、删除预览响应的 JSON 结构与字段表中全部移除。
- DELETE 调整为仅路径参数、无 JSON 请求体。
- 编辑保存并发说明改为“普通读取当前记录完成业务校验（不锁行、不比较打开时与保存时的内容）→ 按 `DATA_SUB_ID` 普通 UPDATE；最后一次成功写入生效”。
- 错误码表删除 `40910` 行，总数 26 → 25。
- 三类查询语义（普通 ID/仅含句点 ID 完整 token 精确匹配、含逗号 ID 历史兼容可能匹配）与 `items + queryWarnings` 列表响应、元数据 API query 参数、物化视图显式排除全部保留不回退。

### UI 调整

- 编辑打开不返回版本令牌，编辑保存请求不携带令牌（`DSUB-REQ-097`，DESIGN §5.1）。
- “异常数据源与并发”小节改为“异常数据源”，明确异常数据源限制仍有效，并注明不提供并发冲突检测、无“刷新后重新编辑”提示。
- “删除确认与并发”小节改为“删除确认”，删除两步闭环保留但全程无令牌；明确删除不提供并发冲突检测。
- 通用交互明确加载态为 UI 反馈，不代表并发处理（DESIGN §5.5 重复提交边界：无并发令牌、无重复提交服务端锁）。
- 前端不保留对 `40910` 的分支处理。

## 9. 25 个错误码结论

R3 提示词 §16 要求：删除 `40910 CONCURRENT_MODIFIED`，错误码总数由 26 准确更新为 25，不新增替代并发错误码。已核验：

- 错误码表不再存在 `40910 CONCURRENT_MODIFIED`，总数准确为 **25**。
- 保留项完整：参数和必填校验；数据源/表失效项；源库连接/元数据错误；多源库异常查看/编辑/删除预览/删除错误；`40430 SUBSCRIPTION_NOT_FOUND`；保存失败；删除失败。
- 编辑/删除期间记录已不存在 → `40430`；记录被其他页面或人工修改但仍存在 → 不报并发错误，按普通更新/删除语义处理。
- 错误码表数量、摘要与正文一致（数量 25、表行数 25、摘要行数与表行数一致）。

## 10. null-safe CSV 权威契约

R3 引入统一 null-safe CSV 解析与查询匹配权威契约（DESIGN.md §4.9 权威定义；API.md §4.2、DATABASE.md §4.1、UI.md 查询交互按必要契约重复）：

- **`splitTrimDropEmpty(csv)`**：输入为 `NULL` 或空白（全空白字符串）时返回**空列表**；否则按英文逗号拆分（`split(",", -1)`），对每个 token 去除首尾空白，丢弃空 token，保留大小写；对 `DATA_FROM_SOURCE_ID`/`DATA_TO_SOURCE_ID` 的存储 CSV 一律使用该解析器。
- **`matchCsvNormal`**（普通查询，不含逗号 ID）：若查询 ID 为 `NULL` 或空白 → 返回不匹配；对存储 CSV 解析后的 token 集合做 Java 字面量完整相等（`String.equals`）匹配，任一 token 相等即匹配；对 nullable storedCsv（`NULL` 或空白）不抛 NPE 并返回不匹配。
- **`matchCsvComma`**（含逗号查询）：对 nullable storedCsv 同样不抛 NPE 并返回不匹配；非空时按“存储 token 连续子序列”做历史兼容可能匹配，命中 `AMBIGUOUS_COMMA_ID` 歧义警告。
- `NULL`/空白/`""`/`" "` 均归约为“空 token 集合”（0 个 token），与“空字符串不等于 NULL”的旧区分不再作为并发指纹输入；本契约仅服务于查询匹配与多源库异常判定，不涉及任何指纹。
- 三类查询语义（OR/OR/AND 分组、`queryWarnings` 展示）在四文档未退化。

## 11. 多源库异常判定及边界例子

多源库异常判定（`isMultiSourceAnomaly`）统一为：

```
isMultiSourceAnomaly = splitTrimDropEmpty(dataFromSourceId).size() >= 2
```

即先按 §10 的 `splitTrimDropEmpty` 归一化（NULL/空白 → 空集合、按逗号拆分、trim、丢弃空 token），再判断 token 数量是否至少 2。**不存在**原始 `split().length >= 2` 形式（未 trim、未丢弃空 token）作为判定依据。

代表性边界例子（DESIGN.md §4.9、DATABASE.md §4.7）：

| 存储值（`DATA_FROM_SOURCE_ID`） | `splitTrimDropEmpty` 后 token 数 | 是否多源库异常 |
|---|---|---|
| `NULL` | 0 | 否 |
| `""` | 0 | 否 |
| `"   "`（全空白） | 0 | 否 |
| `"S01"` | 1 | 否 |
| `",S01"` | 1 | 否 |
| `"S01,,"` | 1 | 否 |
| `"S01, , "` | 1 | 否 |
| `"S01,S02"` | 2 | 是 |
| `" S01 , S02 "` | 2 | 是 |

多源库异常查看/编辑/删除预览/删除错误码保留，异常限制仍有效。

## 12. R2 保留项

R3 不得回退 R2 已通过的以下正确设计（逐项核验仍存在且一致）：

1. 三类查询语义：普通 ID 完整 token 字面精确匹配、仅含句点 ID 仍完整 token 精确匹配、含逗号 ID 历史兼容可能匹配并经 `queryWarnings` 展示歧义警告；服务层 Java 字面量过滤，不使用 `LIKE`/`INSTR` 冒充含逗号精确匹配。
2. 列表 API 唯一响应类型：`data: { items, queryWarnings }`。
3. 元数据 API（Schema 列表、表清单）全部为 query 参数，不残留旧路径变量 URL。
4. Schema/表/保存复核三处仍显式排除 `ALL_MVIEWS`（`MVIEW_NAME`/`CONTAINER_NAME`），不出现“天然排除”错误表述。
5. `sourceSelectionMode = PRESERVE | REPLACE` 唯一契约与结构化 `SourceTableInput{schemaName, tableName}`。
6. 列表 SQL 单次全量启用记录查询 + `ORDER BY NVL(UPDATE_TIME, INSERT_TIME) DESC`，服务层 Java 过滤保持排序相对顺序。
7. `filterMode`、32 位无连字符 UUID + `@TableId IdType.INPUT`（依据 API §8.1，DESIGN §2.2）、最小字段投影、无 DDL。
8. 元数据接口 query 参数下 `dataSourceId`/`schema` 按原始字符串传输、保持大小写。

## 13. 需求 107 条追踪完整性

- `REQUIREMENTS.md` 相对基准提交 `8331fbb...` 零 diff，状态保持 `APPROVED`。
- 107 条需求（`DSUB-REQ-001` ~ `DSUB-REQ-107`）连续唯一，业务行零变化。
- DESIGN.md §8 需求追踪表覆盖全部 107 条，每条映射到 R3 修订后真实存在的章节；`DSUB-REQ-097/098/099/103`（无并发边界）映射到 DESIGN §5.1/§5.2/§5.3、DATABASE §5.1 等真实章节，不映射任何已删除的指纹/行锁章节。
- 结果：`requirements_traceability_status=COMPLETE`。

## 14. 验收 126 条设计覆盖完整性

- `ACCEPTANCE.md` 相对基准提交 `8331fbb...` 零 diff，状态保持 `APPROVED`。
- 126 条验收（`DSUB-AC-001` ~ `DSUB-AC-126`）连续唯一，业务行和映射零变化，全部 `NOT_RUN`（0 条非 `NOT_RUN`）。
- 126 条按 13 个领域覆盖（生效边界与 sync-client 字段、数据模型与存储规则、列表页面与查询、异常记录与异常数据源展示、查看详情、新增/编辑弹窗交互与源库搜索、目标库选择、Schema 与表选择、新增保存规则、编辑规则、并发保护边界、删除规则、通用交互安全与延期项），R3 变更涉及的 `DSUB-AC-048/107/108/109/110/114/117`（无并发保护边界）均得到 R3 修订后设计章节覆盖。
- 结果：`acceptance_design_coverage_status=COMPLETE`。设计覆盖不等于验收通过；126 条仍全部 `NOT_RUN`。

## 15. 交叉引用验证

- 提取四份设计文档全部具名交叉引用（形如 `DESIGN §N.M`、`API §N.M`、`UI §N.M`、`DATABASE §N.M`），逐一与目标文档真实章节标题核对，**全部解析到真实存在的章节，0 个悬空引用**。
- 特别核验：不存在引用已删除指纹（`DSUB-FP-V1` §5.1）或行锁（`SELECT ... FOR UPDATE` §5.2）章节的悬空引用；DESIGN §5 五个子节（§5.1 无并发保护边界、§5.2 编辑保存的普通流程、§5.3 删除预览与普通删除流程、§5.4 事务边界与受影响行数检查、§5.5 重复提交边界）全部可解析；DATABASE §5（事务、受影响行数与无并发保护）子节全部可解析。
- 四份文档之间接口、字段、错误码、流程、状态一致。
- 结果：`cross_reference_status=COMPLETE`。

## 16. 无 DDL、无数据库、无代码/测试操作

- 未修改任何 Java/Vue/TypeScript/JavaScript/SQL/配置/测试文件。
- 未访问数据库，未执行 DDL/DML（`database_access_status=NONE`、`database_write_status=NONE`、`ddl_status=NONE`）。
- 未操作 ZooKeeper、Kafka、`sync-client` 或任何业务进程（`zookeeper_access_status=NONE`、`kafka_operation_status=NONE`、`business_service_operation_status=NONE`）。
- 未修改 `docs/baseline/`、`docs/database/`、`docs/features/large-screen/`、其他 Feature 文档或任何既有报告。
- 未运行 Maven/npm/前后端测试，未启动任何服务（纯文档任务按验证矩阵 `NOT_APPLICABLE`）。
- 文档无密码、连接串、Token 或其他敏感信息。

## 17. 大屏延期状态

大屏调整保持 `DEFERRED_AFTER_DATA_SUBSCRIPTION_FEATURE_ACCEPTANCE`（DESIGN §2.2），本任务未触碰大屏 Feature 文档、前端代码或任何相关配置，不作为本 Feature 验收阻断项。未顺手修复大屏或其他 Feature。

## 18. 强制验证结果

按 R3 提示词 §19 的 50 项强制验证逐项执行，全部通过。代表性命令与结果：

| 验证项 | 命令/方式 | 结果 |
|---|---|---|
| 分支 | `git branch --show-current` | `develop` |
| REQUIREMENTS/ACCEPTANCE 零 diff | `git diff 8331fbb... -- REQUIREMENTS.md ACCEPTANCE.md` | 0 行（零 diff） |
| 需求/验收状态 | 读元数据表 | `APPROVED` / `APPROVED` |
| 需求数量 | `grep -oE 'DSUB-REQ-[0-9]+' ... | sort -u | wc -l` | 107（001~107 连续唯一） |
| 验收数量 | `grep -cE '^\| DSUB-AC-[0-9]{3} \|'` | 126（001~126 连续唯一） |
| 非 NOT_RUN 验收 | 状态列计数 | 0（126 条全部 `NOT_RUN`） |
| 四份设计文档状态 | 元数据表 | 全部 `DRAFT_PENDING_USER_REVIEW` / `PENDING_R3_REVIEW` |
| 实现状态 | 元数据表 | `NOT_STARTED` |
| 编辑打开无 versionToken | API.md §4.7 | 通过 |
| PUT 无 versionToken | API.md §4.8 | 通过 |
| 删除预览无 versionToken | API.md §4.9 | 通过 |
| DELETE 仅路径参数无 JSON body | API.md §4.10 | 通过 |
| 无 DSUB-FP-V1 现行规范 | 全局 grep | 通过（仅“已删除的历史设计”形式提及） |
| 无 FOR UPDATE / 行锁 / 指纹现行流程 | 全局 grep | 通过（仅“不锁行/不指纹”否定式） |
| 无 40910 CONCURRENT_MODIFIED | 错误码表 | 通过，总数 25 |
| UI 无并发冲突/刷新重试/令牌 | UI.md | 通过 |
| 编辑保存普通主键 UPDATE + 最后一次成功写入生效 | DESIGN §5.2 / API §4.8 | 通过 |
| 删除预览普通只读无锁无令牌 | DESIGN §5.3 / API §4.9 | 通过 |
| DELETE 直接主键物理删除 | API §4.10 | 通过 |
| 记录不存在/受影响行数/事务回滚/多源库异常限制 | DESIGN §5.4 | 通过 |
| PRESERVE/REPLACE + SourceTableInput[] | 四文档一致 | 通过 |
| NULL/空白 → 空 token 集合 | DESIGN §4.9 / DATABASE §4.1 | 四文档统一 |
| 普通查询 nullable 不抛 NPE 返回不匹配 | DATABASE §4.1 | 通过 |
| 含逗号查询 nullable 不抛 NPE 返回不匹配 | DATABASE §4.1 | 通过 |
| 多源库异常 trim+丢弃空 token ≥ 2 | DATABASE §4.7 | 通过 |
| 无原始 split().length ≥ 2 判定 | 全局 grep | 通过 |
| §12 边界例子在文档 | DESIGN §4.9 | 9 例齐全 |
| 三类查询语义 OR/OR/AND + queryWarnings | API §4.2 / DESIGN §7.1 | 未退化 |
| 列表唯一响应 items + queryWarnings | API §4.2 | 通过 |
| 元数据 API 全 query 参数 | API §2/§4.4/§4.5 | 通过 |
| 三处显式排除 ALL_MVIEWS | DESIGN §6.3/§6.4、DATABASE §4.8 | 通过 |
| filterMode/UUID32+IdType.INPUT/最小投影/无 DDL | DESIGN §2.2 | 保持 |
| 错误码数量/摘要/正文一致 | API §6/§7 | 25/25 |
| 需求追踪无遗漏 | DESIGN §8 | 107/107 |
| 验收设计覆盖（含 AC-048/107~110/114/117） | 13 领域核对 | 126 全覆盖 |
| 交叉引用解析到真实章节 | 临时脚本 | 全部通过、0 悬空 |
| 无引用已删除章节的悬空引用 | 临时脚本 | 通过 |
| 四文档接口/字段/错误码/流程/状态一致 | 关键字比对 | 通过 |
| 大屏延期状态 | DESIGN §2.2 | `DEFERRED_AFTER_DATA_SUBSCRIPTION_FEATURE_ACCEPTANCE` |
| 未访问数据库 / 未 DDL | — | `NONE` |
| 未修改业务/测试代码 | `git diff --name-status 8331fbb...` | 仅 5 个授权文档修改 |
| 未操作 ZooKeeper/Kafka/业务进程 | — | `NONE` |
| 未运行 Maven/npm/测试、未启动服务 | — | `NOT_APPLICABLE`（纯文档） |
| 无敏感信息 | 全局 grep | 通过 |
| `git diff --check` | 授权 6 文件 | 通过 |
| 授权文件范围 | `git diff --name-status` + 未跟踪清单 | 5 修改 + 1 新增 = 6 个授权文件 |
| 提交暂存区仅 6 个授权文件 | `git diff --cached --name-status` | 仅 6 个授权文件 |
| 既有修改保护 | `git status --short` 对比 | 既有项原样保留 |

可以使用临时只读脚本验证章节、术语、编号、引用和差异；临时文件未进入 Git。

## 19. Git 提交与推送结果

- 逐文件暂存 §3 的 6 个授权文件；`git diff --cached --name-status` 确认无其他文件。
- Commit message 体现“数据订阅设计 R3 定向修订”，未写成设计批准、功能实现或验收通过。
- 普通推送到 `origin/develop`，禁止 force push。
- 推送后核验：`git rev-parse HEAD`、`git rev-parse origin/develop`、`git ls-remote origin refs/heads/develop`、`git rev-list --left-right --count HEAD...origin/develop`、`git status --short`，确认本地 HEAD、远端跟踪分支与远程 develop 一致，ahead/behind 为 `0 0`。
- 任务开始前已有无关修改仍原样存在且未进入提交。
- 结果提交号、远程提交号、ahead/behind 及 commit_status/push_status 见控制台 `AGENT_TASK_RESULT`。

---

*报告生成：DATA-SUBSCRIPTION-DESIGN-BASELINE-001-R3（纯文档设计基线 R3 定向修订）。本任务依据已批准“取消并发保护”需求/验收调整（批准收口提交 `8331fbb...`）删除并发设计并改为普通主键读写，修正多源库空 token 判定并补充 nullable CSV 契约；设计仍为 `DRAFT_PENDING_USER_REVIEW` 草案待 ChatGPT 正式设计 R3 复审，功能未实现，126 条验收未执行。*
