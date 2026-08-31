# 任务执行报告：数据订阅设计基线 R4 定向修订（DATA-SUBSCRIPTION-DESIGN-BASELINE-001-R4）

## 1. 任务编号、性质、基准提交

| 项目 | 值 |
|---|---|
| 任务编号 | `DATA-SUBSCRIPTION-DESIGN-BASELINE-001-R4` |
| 任务性质 | 纯文档设计基线 R4 定向修订（**不得修改业务代码、测试代码或配置，不访问数据库，不执行 DDL/DML，不操作 ZooKeeper/Kafka/sync-client 或业务进程，不启动服务、不运行构建/测试**） |
| 依据 | ChatGPT 对 R3 结果提交 `ac4954401b79e04c56a8bbf9daec871fd194f19c` 的正式复审结论 `CHANGES_REQUIRED` |
| Feature | 数据订阅（`data-subscription`） |
| 分支 | `develop` |
| 基准提交（base_commit_id） | `ac4954401b79e04c56a8bbf9daec871fd194f19c`（即 R3 结果提交） |
| 结果提交（result_commit_id） | 见控制台 `AGENT_TASK_RESULT`（本报告不预先伪造尚未产生的提交号） |
| 远程提交（remote_commit_id） | 见控制台 `AGENT_TASK_RESULT` |
| ahead/behind | 见控制台 `AGENT_TASK_RESULT` |
| commit_status / push_status | 见控制台 `AGENT_TASK_RESULT` |

本任务不是需求调整、不是设计批准、不是功能实现、不是验收执行，也不授权数据库或外部系统操作。

## 2. ChatGPT R3 正式复审结论

- R3 基准提交：`8331fbb6e17b8e2165b788d972f651aa980bf227`。
- R3 结果提交：`ac4954401b79e04c56a8bbf9daec871fd194f19c`。
- 远程状态：R3 报告本地、`origin/develop` 与远程 `develop` 一致，ahead/behind 为 `0 0`。
- 正式复审结论：**`CHANGES_REQUIRED`**，发现三个确定问题：
  1. 删除影响行数的错误码写错（`DESIGN.md` §5.3 把 DELETE 多行异常写成 `50040`，应统一为 `50041`）；
  2. DELETE 接口的多源库异常后端防护在四文档中不一致（`DESIGN.md` §5.3 未写强制普通读取与异常校验，`DATABASE.md` §4.5 使用“如删除前需要当前记录”可选语气，删除预览不能替代 DELETE 自身防护）；
  3. Java 对 NULL 调用 split 的行为说明错误（R3 文档称“NULL 会被 split 成 `['']`”，实际对 `null` 调用实例方法 `split` 会抛 `NullPointerException`）。

R3 已正确完成且必须保留的内容见本报告 §7。

## 3. 三项发现及逐项修复结果

### 3.1 删除影响行数的错误码写错 → 已修正

- 修改前：`DESIGN.md` §5.3 写为“DELETE 受影响行数必须为 1（0 行 → `40430`，多行异常 → `50040`）”。
- 依据只读 `API.md` §7：`50040 SAVE_FAILED` 为 `INSERT/UPDATE` 受影响行数异常；`50041 DELETE_FAILED` 为 `DELETE` 受影响行数异常。
- 修正后统一口径：
  - DELETE 影响 0 行：`40430 SUBSCRIPTION_NOT_FOUND`；
  - DELETE 影响多于 1 行：`50041 DELETE_FAILED`；
  - 不得把 DELETE 异常映射为 `50040 SAVE_FAILED`。
- 修正位置：`DESIGN.md` §5.3、§5.4；`DATABASE.md` §4.5（明确包含 `>1 → 50041` 且“不得映射为 `50040`”）。
- `API.md` 错误码表本就正确，本任务未修改（保持零 diff）。

### 3.2 DELETE 接口的多源库异常后端防护不一致 → 已统一为强制步骤

删除预览只能提供删除确认信息，**不能替代 DELETE 接口自身的后端防护**（接口可被直接调用，且预览结果不是一致性快照）。R4 在四文档统一 DELETE 接口自身事务内删除前防护为强制步骤：

1. DELETE 事务内先按 `DATA_SUB_ID` 普通 `SELECT` 当前记录；
2. 不使用 `FOR UPDATE`，不加锁，不比较预览结果，不检查并发变化；
3. 查询不到返回 `40430`；
4. 复用统一的 `isMultiSourceAnomaly` / `splitTrimDropEmpty` 判定；
5. 当前读取结果为多源库异常时返回 `40351 ANOMALY_NOT_DELETABLE`，**不得执行 DELETE**；
6. 校验通过后按 `DATA_SUB_ID` 执行普通物理 DELETE；
7. 普通 `SELECT` 与 `DELETE` 之间若被其他页面或人工数据库操作修改，不检测、不拒绝，仍符合已批准“无并发保护、最后一次成功写入生效”边界；
8. DELETE 影响 0 行返回 `40430`，影响多行返回 `50041`。

修正位置：`DESIGN.md` §3.7（明确 DELETE 接口自身重复执行普通读取和后端业务防护）、§5.3（强制流程化）、§5.4（删除事务边界与 §5.3 一致）；`DATABASE.md` §4.5（给出强制的普通 SELECT → 异常判定 → DELETE 顺序，删除“如需要”可选语义，补充删除前防护 SQL 示例）、§5.2 摘要行同步删除可选语气；`DATABASE.md` §4.7 继续声明删除后端防护复用统一判定方法。

本项修正未恢复任何版本令牌、行锁、指纹、`UPDATE_TIME` 比较或并发冲突错误码。

### 3.3 Java 对 NULL 调用 split 的行为说明错误 → 已修正

- 修改前：R3 文档在 `DESIGN.md` §4.9 核心动机写“`NULL` 会被 split 成 `['']`”，在 `DESIGN.md` §4.7 与 `DATABASE.md` §4.7 的禁止原始 split 说明中写“`NULL`/空白会被拆成非预期的 token 数”。
- 修正后准确口径：
  - 对 `null` 直接调用实例方法 `split` 会抛 `NullPointerException`；
  - 空字符串、仅空白字符串、连续分隔符等输入若直接按数组长度判断，会产生与“有效非空 token 数”不一致的结果；
  - 所有场景必须先经 `splitTrimDropEmpty`：`null`、空字符串、仅空白均归一化为空集合；
  - 多源库异常只按归一化后的非空 token 数 `>= 2` 判定。
- 修正位置：`DESIGN.md` §4.7（禁止原始 split 的说明）、§4.9（核心动机）；`DATABASE.md` §4.7（禁止原始 split 的说明）。
- 已搜索四份设计文档中所有“NULL 被 split 成 token/数组”或等价错误表述并全部修正；R3 已定义的 9 个边界示例及其预期结果**未改变**（仅修正与 Java 真实行为矛盾的解释文字）。

## 4. 删除流程最终统一顺序

四文档一致（`DESIGN.md` §3.7/§5.3/§5.4、`DATABASE.md` §4.5/§5.2、只读 `API.md` §4.10）：

```text
删除预览（GET /{dataSubId}/delete-preview）：
  普通只读查询 → 返回确认信息（订阅描述/源库/Schema 数/源表数/目标库）
  → 不锁行、不返回版本令牌 → 记录不存在返回 40430

DELETE /api/subscriptions/{dataSubId}（事务内强制删除前防护，删除预览不能替代）：
  按 DATA_SUB_ID 普通 SELECT 当前记录（不加锁、不比较预览、不检查并发）
  → 查询不到 → 40430
  → 复用 isMultiSourceAnomaly/splitTrimDropEmpty 判定
     → 多源库异常 → 40351 ANOMALY_NOT_DELETABLE，不得执行 DELETE
  → 校验通过 → 按 DATA_SUB_ID 普通物理 DELETE（不带 FOR UPDATE）
     → 影响 0 行 → 40430
     → 影响 >1 行 → 50041 DELETE_FAILED
  → 提交事务 → 刷新列表并提示重启后生效
```

普通 `SELECT` 与 `DELETE` 之间的并发变化不检测、不拒绝，属于已批准“无并发保护、最后一次成功写入生效”边界。

## 5. DELETE 错误码最终映射

| 场景 | 错误码 | 说明 |
|---|---|---|
| DELETE 影响 0 行（记录不存在或已被删除） | `40430 SUBSCRIPTION_NOT_FOUND` | `DSUB-REQ-104` |
| DELETE 影响多于 1 行 | `50041 DELETE_FAILED` | 仅 DELETE 受影响行数异常 |
| DELETE 目标为多源库异常记录 | `40351 ANOMALY_NOT_DELETABLE` | 不得执行 DELETE |

`50040 SAVE_FAILED` 仅用于 `INSERT/UPDATE` 受影响行数异常；全文不存在把 DELETE 异常映射为 `50040` 的活动设计。

## 6. Java null/split 的准确语义与 helper 契约

- 对 `null` 调用实例方法 `split(...)` 会抛 `NullPointerException`（不是返回 `['']`）。
- `splitTrimDropEmpty(csv)`：`NULL` 或仅空白 → 空列表；否则按英文逗号拆分（等价 `split(",", -1)`），逐 token 去首尾空白，丢弃空 token，保留大小写，返回按原顺序排列的非空 token 列表。
- `matchCsvNormal`：查询 ID 不含逗号时使用，对 `splitTrimDropEmpty(storedCsv)` 任一 token 做 Java `String.equals` 完整字面精确匹配；`NULL`/空白存储值解析为空集合，与任意查询 ID 都不匹配。
- `matchCsvComma`：查询 ID 含逗号时使用（历史兼容可能匹配），`queryAtomic` 为 `storedAtomic` 的连续子序列。
- `isMultiSourceAnomaly = splitTrimDropEmpty(dataFromSourceId).size() >= 2`。
- 9 个边界示例（`NULL`/`''`/`'   '` → 0 token 非异常；`'S01'`/`',S01'`/`'S01,,'`/`'S01, , '` → 1 token 非异常；`' S01 , S02 '`/`'S01,S02'` → 2 token 异常）保持 R3 预期结果不变。
- 所有实现不得绕过 `splitTrimDropEmpty` 自行 `split`/`trim`。

## 7. R3 已正确内容的保留情况

R4 未回退、未重新设计以下 R3/R2 已正确内容：

1. 已删除版本令牌、内容指纹、`DSUB-FP-V1`、黄金向量、行锁、并发字段比较和 `40910 CONCURRENT_MODIFIED`；
2. 编辑保存采用普通主键读取/更新，删除预览为普通只读，物理删除不做并发比较；
3. 多源库异常判定使用 `splitTrimDropEmpty(...).size() >= 2`；
4. 已建立 nullable CSV 的统一 helper；
5. R2 的三类查询语义、`items + queryWarnings`、元数据 query 参数、显式排除 `ALL_MVIEWS`、`SourceTableInput[]`、`PRESERVE/REPLACE`、`UUID32 + IdType.INPUT` 均已保留；
6. 需求与验收仍为 `APPROVED`，107 条需求和 126 条验收保持不变，126 条验收全部 `NOT_RUN`；
7. 设计仍为 `DRAFT_PENDING_USER_REVIEW`，实现仍为 `NOT_STARTED`；
8. 大屏修正仍为 `DEFERRED_AFTER_DATA_SUBSCRIPTION_FEATURE_ACCEPTANCE`。

## 8. 需求、验收、API、UI 零 diff 证据

- `REQUIREMENTS.md` 相对基准 `ac49544...` 零 diff；107 条需求（`DSUB-REQ-001` ~ `DSUB-REQ-107`）连续唯一，状态 `APPROVED`。
- `ACCEPTANCE.md` 相对基准 `ac49544...` 零 diff；126 条验收（`DSUB-AC-001` ~ `DSUB-AC-126`）连续唯一，全部 `NOT_RUN`，状态 `APPROVED`。
- `API.md` 相对基准 `ac49544...` 零 diff（其错误码表本就正确，本任务未修改）。
- `UI.md` 相对基准 `ac49544...` 零 diff。
- 未新增表、列、索引、触发器或迁移；未修改 `docs/baseline/`、`docs/database/`、其他 Feature 文档或任何既有报告。

## 9. 状态边界

- `requirements_status=APPROVED`、`acceptance_status=APPROVED`、`design_status=DRAFT_PENDING_USER_REVIEW`、`design_review_status=PENDING_R4_REVIEW`、`implementation_status=NOT_STARTED`、`acceptance_execution_status=NOT_RUN`。
- 四份设计文档全部仍为 `DRAFT_PENDING_USER_REVIEW`；DESIGN/DATABASE 元数据更新为 `PENDING_R4_REVIEW`，API/UI 零 diff（其元数据保持 R3 值，只读核验通过）。
- 本报告**不声称**设计已批准、功能已实现或任何验收项通过；126 条验收全部 `NOT_RUN`。

## 10. 文件范围、Git、外部系统保护项

- 授权范围（R4 提示词 §4）：`DESIGN.md`、`DATABASE.md`、`docs/features/README.md` 修改 + `reports/DATA-SUBSCRIPTION-DESIGN-BASELINE-001-R4.md` 新增，共 4 个授权文件。实际提交范围与授权范围完全一致。
- 未修改任何 Java/Vue/TypeScript/JavaScript/SQL/配置/测试文件。
- 未访问数据库，未执行 DDL/DML（`database_access_status=NONE`、`database_write_status=NONE`、`ddl_status=NONE`）。
- 未操作 ZooKeeper、Kafka、`sync-client` 或任何业务进程（`zookeeper_access_status=NONE`、`kafka_operation_status=NONE`、`business_service_operation_status=NONE`）。
- 未运行 Maven/npm/前后端测试，未启动任何服务（纯文档任务按验证矩阵 `NOT_APPLICABLE`）。
- 未清理、未回滚、未覆盖、未暂存、未提交任务开始前已有的无关工作区修改（`frontend/**`、`.claude/settings.local.json`、`agent-env.sh`、`docs/database/TASK3/4*` 删除、`docs/agent-prompts/**` 等）。
- 本提示词文件本身不属于提交范围，未暂存未提交。
- 文档无密码、完整连接串、密钥、令牌或堆栈等敏感信息新增。

## 11. 验证命令和结果

按 R4 提示词 §7 的 31 项强制验证逐项执行，全部通过。代表性命令与结果：

| 验证项 | 命令/方式 | 结果 |
|---|---|---|
| 分支 | `git branch --show-current` | `develop` |
| 基准与远程一致 | `git rev-parse HEAD` / `origin/develop` | `ac4954401b79e04c56a8bbf9daec871fd194f19c`，ahead/behind `0 0`（`BLOCKED_BASE_CHANGED` 未触发） |
| 开始前工作区已有修改 | `git status --short` 记录 | 无关修改原样保留 |
| REQUIREMENTS 零 diff + 107 条 + APPROVED | `git diff ac49544... --` + `grep -oE 'DSUB-REQ-[0-9]+' | sort -u | wc -l` | 107（001~107 连续唯一） |
| ACCEPTANCE 零 diff + 126 条 + 全部 NOT_RUN + APPROVED | `git diff ac49544... --` + 计数 | 126（001~126 连续唯一），0 条非 `NOT_RUN` |
| API.md / UI.md 零 diff | `git diff ac49544... -- API.md UI.md` | 0 行 |
| 无活动版并发机制（令牌/指纹/DSUB-FP-V1/黄金向量/FOR UPDATE/行锁/字段比较/40910） | 关键词扫描 + 上下文判断 | 通过（仅历史/禁止/修正说明提及） |
| DELETE 流程四文档一致（普通 SELECT → 存在性与异常防护 → 普通 DELETE） | 关键字比对 DESIGN §3.7/§5.3/§5.4、DATABASE §4.5 | 一致 |
| 删除前普通读取不加锁、预览不替代 DELETE 防护 | 关键字比对 | 通过 |
| 多源库异常 DELETE 返回 `40351` | 关键字比对 | 通过 |
| DELETE 影响 0 行返回 `40430` | 关键字比对 | 通过 |
| DELETE 影响多行返回 `50041` | 关键字比对 | 通过 |
| 无把 DELETE 映射为 `50040` 的活动设计 | 全局 grep | 通过（仅禁止表述） |
| `50040` 仅 INSERT/UPDATE、`50041` 仅 DELETE，与只读 API.md §7 一致 | 错误码表比对 | 通过 |
| `splitTrimDropEmpty(null)` 返回空集合 | 文档契约核对 | 通过 |
| 多源库异常用归一化非空 token 数 `>= 2` | 关键字比对 | 通过 |
| 无“null 调 split 返回 `['']`”错误说法 | 全局 grep | 通过（仅修正说明提及） |
| 准确说明 null 调 split 抛 NPE | 关键字比对 | 通过 |
| R3 的 9 个 nullable CSV 边界示例完整且预期一致 | 文档表核对 | 通过 |
| R2/R3 保留设计未回退（三类查询、items+queryWarnings、query 参数、ALL_MVIEWS、SourceTableInput[]、PRESERVE/REPLACE、UUID32+IdType.INPUT） | 关键字比对 | 通过 |
| 四份设计文档全部 `DRAFT_PENDING_USER_REVIEW`；API/UI 零 diff 只读核验状态 | 元数据表核验 | 通过 |
| 107 条需求追踪和 126 条验收设计覆盖完整 | DESIGN §8/§8.1 核验 | `COMPLETE` |
| 交叉引用解析到真实章节 | 临时只读脚本 | 全部通过、0 悬空 |
| README 仅 `data-subscription` 行 + 追加本任务变更记录 | `git diff ac49544... -- README.md` | 通过 |
| 大屏延期状态 | DESIGN §2.2 | `DEFERRED_AFTER_DATA_SUBSCRIPTION_FEATURE_ACCEPTANCE` |
| 无敏感信息新增 | 全局 grep | 通过 |
| `git diff --check` | 授权文件 | 通过 |
| 暂存区恰好 4 个授权文件 | `git diff --cached --name-status` | 4 文件（3 修改 + 1 新增） |
| 无关修改原样保留且未进入提交 | `git status --short` 对比 | 通过 |
| 普通推送、无 force push | `git push origin develop` | 通过 |
| 推送后本地/`origin/develop`/远程一致，ahead/behind `0 0` | `git rev-parse` + `git ls-remote` + `git rev-list --left-right --count` | 通过 |

## 12. 下一入口：ChatGPT 正式 R4 设计复审

- 本任务完成的是设计基线 R4 定向修订（纯文档），**不构成设计批准、功能实现或验收通过**。
- 唯一下一入口：ChatGPT 对 R4 设计草案结果提交进行正式复审。
- 只有 R4 正式复审通过后，才允许执行设计基线批准收口；设计正式批准后才能进入功能实现阶段。
- 实现阶段（`NOT_STARTED`）尚未开始；126 条验收（全部 `NOT_RUN`）尚未执行；大屏调整保持 `DEFERRED_AFTER_DATA_SUBSCRIPTION_FEATURE_ACCEPTANCE`。

---

*报告生成：DATA-SUBSCRIPTION-DESIGN-BASELINE-001-R4（纯文档设计基线 R4 定向修订）。本任务按 ChatGPT 对 R3 结果提交 `ac49544...` 正式复审 `CHANGES_REQUIRED` 的三个确定发现项定向修正 DELETE 错误码、DELETE 删除前多源库异常后端防护与 Java null/split 语义；设计仍为 `DRAFT_PENDING_USER_REVIEW` 草案待 ChatGPT 正式设计 R4 复审，功能未实现，126 条验收未执行。*
