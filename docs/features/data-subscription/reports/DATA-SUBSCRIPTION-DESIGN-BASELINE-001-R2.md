# 任务执行报告：数据订阅设计基线 R2 定向修订（DATA-SUBSCRIPTION-DESIGN-BASELINE-001-R2）

## 1. 任务元数据与状态

| 项目 | 值 |
|---|---|
| 任务编号 | `DATA-SUBSCRIPTION-DESIGN-BASELINE-001-R2` |
| 前序设计任务 | `DATA-SUBSCRIPTION-DESIGN-BASELINE-001`（结果提交 `6104015...`）、`DATA-SUBSCRIPTION-DESIGN-BASELINE-001-R1`（结果提交 `3609548...`） |
| 含逗号查询需求调整批准收口提交 | `afc5765956cac3c8f66d8857ff17565472d0c746`（本任务基准提交；ChatGPT 对 `5d5b5f4...` 含逗号需求调整正式复审 `APPROVED` 后的收口） |
| 复审来源 | R1 定向修订后 DESIGN/API/UI/DATABASE 仍为 `DRAFT_PENDING_USER_REVIEW`，设计复审结论仍为 `CHANGES_REQUIRED`，本任务统一修正 R1 正式复审剩余四项并同步含逗号查询批准基线 |
| 任务性质 | 纯文档设计基线 R2 定向修订（**不得修改业务代码、测试代码或配置，不访问数据库，不执行 DDL/DML，不操作 ZooKeeper/Kafka/sync-client 或业务进程**） |
| Feature | 数据订阅（`data-subscription`） |
| 最终状态 | `SUCCESS`（本报告记录的是设计基线 R2 定向修订收口结果；**本报告不声称设计已批准、功能已实现或验收已通过**） |
| 分支 | `develop` |
| 基准提交（base_commit_id） | `afc5765956cac3c8f66d8857ff17565472d0c746` |
| 结果提交（result_commit_id） | 见控制台 `AGENT_TASK_RESULT`（本报告不预先伪造尚未产生的提交号） |
| 远程提交（remote_commit_id） | 见控制台 `AGENT_TASK_RESULT` |
| ahead/behind | 见控制台 `AGENT_TASK_RESULT` |
| commit_status / push_status | 见控制台 `AGENT_TASK_RESULT` |

收口后状态：`requirements_status=APPROVED`、`acceptance_status=APPROVED`、`design_status=DRAFT_PENDING_USER_REVIEW`（四份设计文档仍为草案，待 ChatGPT 正式设计 R2 复审）、`design_review_status=PENDING_R2_REVIEW`、`implementation_status=NOT_STARTED`、`acceptance_execution_status=NOT_RUN`（126 条全部 `NOT_RUN`）。

## 2. Git 基准和开始现场

执行开始前记录（`git branch --show-current` / `git status --short` / `git rev-parse HEAD` / `git rev-parse origin/develop` / `git rev-list --left-right --count origin/develop...HEAD`）：

- 当前分支：`develop`。
- 本地 HEAD：`afc5765956cac3c8f66d8857ff17565472d0c746`。
- `origin/develop`：`afc5765956cac3c8f66d8857ff17565472d0c746`（与本地一致，ahead/behind = `0 0`）。
- 开始前工作区存在大量与本任务无关的既有修改与未跟踪文件（如 `.claude/settings.local.json`、`agent-env.sh`、`frontend/src/**`、`docs/agent-prompts/**`、`docs/database/TASK3/4*` 删除、`docs/features/app-shell/` 与 `docs/features/large-screen/` 未跟踪目录等），本任务未清理、未回滚、未覆盖、未暂存、未提交任何既有修改。
- 本任务 5 个拟修改文件（DESIGN.md、API.md、UI.md、DATABASE.md、docs/features/README.md）与 1 个拟新增文件（本报告）在开始前均无未提交修改，可安全处理。
- 未使用 `git add .`、`git add -A` 等全量暂存；只逐文件暂存本任务授权文件。
- 未执行任何破坏性 Git 命令。

## 3. 正式复审剩余问题

R1 定向修订已修正 R1 正式复审发现项并同步已批准点号规则，但设计草案仍为 `DRAFT_PENDING_USER_REVIEW`、设计复审结论仍为 `CHANGES_REQUIRED`。含逗号查询需求调整正式批准（`5d5b5f4...`，ChatGPT 复审 `APPROVED`）后，四份设计文档仍存在以下与最新批准基线不一致的剩余问题，本任务统一修正：

1. 三类查询语义尚未落地：设计文档曾以 `INSTR`/`LIKE` 等方式描述普通 ID 精确匹配，且含逗号 ID 的“历史兼容可能匹配”语义未在服务层 Java 字面量过滤中落实，可能被实现为伪精确匹配。
2. 元数据 API（Schema 列表、表清单）使用路径变量承载 `dataSourceId`/`schema`，无法可靠承载含 `/`、`#`、`?`、空格等合法特殊字符的 Oracle quoted identifier（即使 `encodeURIComponent`，`%2F` 也可能被 Servlet 容器或反向代理拒绝或提前解码）。
3. 物化视图排除不明确：存在依赖 `ALL_TABLES` “天然排除物化视图”的错误表述风险，且 Schema 列表、表清单、保存前批量复核三处未统一显式排除 `ALL_MVIEWS.MVIEW_NAME`/`CONTAINER_NAME`。
4. 指纹算法未字节级确定：`versionToken` 早期存在依赖 JVM 默认时区的 epoch millis 日期规则与实现自选字段顺序的风险，未给出可复现的黄金测试向量。

## 4. 最新批准需求依据

- 需求基线：`docs/features/data-subscription/REQUIREMENTS.md`（`APPROVED`，107 条 `DSUB-REQ-001` ~ `DSUB-REQ-107`，当前版本为含逗号数据源 ID 查询兼容调整批准版本，批准依据提交 `afc5765956cac3c8f66d8857ff17565472d0c746`）。
- 验收基线：`docs/features/data-subscription/ACCEPTANCE.md`（`APPROVED`，126 条 `DSUB-AC-001` ~ `DSUB-AC-126`，全部 `NOT_RUN`）。
- 关键已批准需求：
  - `DSUB-REQ-033`（查询候选三类语义：普通 ID/仅含句点 ID 完整 token 精确匹配，含逗号 ID 返回候选并显示歧义警告）；
  - `DSUB-REQ-034`（查询匹配三类语义：普通/仅含句点 ID 按 CSV 拆分 token 去除首尾空白后完整字面精确匹配，`S01` 不匹配 `S012`，`%`/`_`/反斜杠/正则字符按字面处理；含逗号 ID 为“历史兼容可能匹配”，不得伪造精确识别）；
  - `DSUB-REQ-097`（并发保护版本令牌）、`DSUB-REQ-103`（删除锁内比较版本令牌）；
  - `DSUB-REQ-069`（Schema/表范围：普通表，不含视图、物化视图、同义词）；
  - `DSUB-REQ-107`（大屏调整延期边界：`DEFERRED_AFTER_DATA_SUBSCRIPTION_FEATURE_ACCEPTANCE`）。
- 本任务只让设计文档与上述最新批准需求对齐；不改动任何已批准需求或验收标准。

## 5. 三类查询语义与服务层匹配算法

已批准的三类查询语义（`DSUB-REQ-033/034`、`DSUB-AC-032~035`）在四份设计文档中一致落地：

1. **普通 ID（不含英文逗号）**：按 CSV 拆分 token 去除首尾空白后，以 Java `String.equals` 做完整字面精确匹配；`%`、`_`、反斜杠、句点、正则字符全部按普通字面字符处理；不使用 `LIKE`、正则或 `%ID%` 子串匹配；`S01` 不匹配 `S012`。
2. **仅含英文句点（不含英文逗号）的 ID**：句点不是这两个 CSV 字段（`DATA_FROM_SOURCE_ID`/`DATA_TO_SOURCE_ID`）的分隔符，仍适用普通 ID 的完整 token 精确匹配。
3. **含英文逗号的 ID**：定义为“历史兼容可能匹配”。由于 `DATA_FROM_SOURCE_ID`/`DATA_TO_SOURCE_ID` 为无引号、无转义符、无长度前缀的英文逗号分隔协议，原始 CSV 无法精确区分“单个含逗号 ID”与“多个相邻普通 ID”，因此返回“可能匹配记录集合”（查询原子为存储 token 连续子序列匹配），并在响应 `queryWarnings` 与页面持续显示歧义警告；**不得静默丢弃可能相关历史记录，也不得伪造精确识别**；无歧义条件时 `queryWarnings=[]`，警告不是错误、不阻断查询。

查询过滤在服务层 Java 完成，数据库只做单次全量启用记录查询并按 `NVL(UPDATE_TIME, INSERT_TIME) DESC` 排序，Java 过滤保持数据库排序相对顺序。匹配算法见 DESIGN §7.1 与 DATABASE.md §4.1，列表 API 见 API.md §4.2，页面交互见 UI.md §2.1。

## 6. 列表 API 响应结构调整

列表接口 `GET /api/subscriptions` 唯一响应类型调整为对象 `data: { items, queryWarnings }`（API.md §4.2；`data` 不再是数组）。`items` 为记录数组；`queryWarnings` 为歧义条件数组，当前唯一类型 `AMBIGUOUS_COMMA_ID`（含逗号数据源 ID 历史兼容可能匹配），字段包含 `type`/`field`/`value`/`message`。UI 按 `data.items` 渲染列表行、逐条展示 `queryWarnings` 歧义警告文案（“含逗号的数据源 ID 只能进行历史兼容可能匹配，结果可能包含歧义记录”），不得把 `data` 当数组。该结构已在四份设计文档统一。

## 7. 元数据 API query 参数调整

元数据两个接口在 R2 由路径变量改为 query 参数：

- `GET /api/subscriptions/metadata/schemas?dataSourceId=<原始字符串>`（API §4.4）；
- `GET /api/subscriptions/metadata/tables?dataSourceId=<原始字符串>&schema=<原始字符串>`（API §4.5）。

Spring 以 `@RequestParam String` 接收，前端用 axios `params` 对象传参、不手工拼接 query string；`dataSourceId`/`schema` 按原始字符串传输、保持大小写、不做 URL 路径段拆分。原 `GET /metadata/{dataSourceId}/schemas/{schema}/tables` 路径变量草案在 API §2 合并说明中明确废弃并说明原因，不设计兼容双路径。`{dataSubId}` 仍作为路径变量，因为订阅主键为后端生成的 32 位十六进制 UUID，恒为安全字符。API 能力总数保持恰好 10 个。

## 8. 物化视图显式排除方案

统一“可订阅普通表集合”谓词显式排除 Oracle 物化视图（`ALL_TABLES` 不会天然排除物化视图）：

```sql
FROM ALL_TABLES t
WHERE NOT EXISTS (
  SELECT 1 FROM ALL_MVIEWS mv
  WHERE mv.OWNER = t.OWNER
    AND (mv.MVIEW_NAME = t.TABLE_NAME OR mv.CONTAINER_NAME = t.TABLE_NAME)
)
```

该谓词统一用于三处（DESIGN §6.3/§6.4、DATABASE.md §4.8）：

1. Schema 列表（只保留至少含一张可订阅普通表的可访问、非系统 Schema）；
2. 指定 Schema 的普通表清单；
3. 保存前批量复核（一次源库连接按 Schema 批量校验）。

Schema 能力分层两种模式（`ORACLE_MAINTAINED='N'` 优先 / `FALLBACK_EXCLUSION_LIST` 系统 Schema 排除清单兼容回退）均叠加同一物化视图排除谓词；DATABASE.md §4.8 给出 4 个参数化 SQL 示例。不得写成“`ALL_TABLES` 天然排除物化视图”。表范围契约同步收紧：普通表，不含视图、物化视图、同义词（`DSUB-REQ-069`）。

## 9. `DSUB-FP-V1` 字节级算法

版本令牌统一为字节级确定、可复现的 `DSUB-FP-V1` 内容指纹（DESIGN §5.1 权威定义；API.md §4.7/§4.9、DATABASE.md §5.2 重复必要契约）：

- 固定头：ASCII 10 字节 `"DSUB-FP-V1"`。
- 10 个字段固定顺序：`DATA_SUB_ID`、`DATA_SUB_DESC`、`DATA_FROM_SOURCE_ID`、`DATA_TO_SOURCE_ID`、`DATA_SOURCE_TABLE`、`DATA_SOURCE_COMMENT`、`DATA_TARGET_TABLE`、`DATA_TARGET_COMMENT`、`INSERT_TIME`、`UPDATE_TIME`。
- 每个 FieldFrame：`nameLength`（4 字节 signed int32 大端序）+ `nameBytes`（UTF-8）+ `nullFlag`（1 字节，`0x00`=NULL / `0x01`=非 NULL）+ 非 NULL 时 `valueLength`（8 字节 signed int64 大端序，允许 0）+ `valueBytes`（UTF-8）。
- 空字符串编码为 `0x01 + int64(0)`，与 NULL 的 `0x00` 明确不同。
- DATE 取值：`TO_CHAR(INSERT_TIME, 'YYYY-MM-DD"T"HH24:MI:SS', 'NLS_DATE_LANGUAGE=American NLS_CALENDAR=GREGORIAN') AS INSERT_TIME_FP`（非 NULL 时为 19 个 ASCII 字符，NULL 时为 NULL）；**不使用 epoch millis，不依赖 JVM 默认时区**；编辑打开、删除预览和锁行重读的 Mapper SQL 必须使用同一表达式取得日期指纹值。
- SHA-256 对完整字节流计算，小写十六进制 64 字符。
- 一个后端共享工具方法（如 `SubscriptionFingerprintV1`），编辑打开、删除预览、编辑保存锁内比较、删除锁内比较必须复用同一实现。

## 10. 黄金测试向量与复核方式

黄金测试向量（完整示例输入与逐字段编码见 DESIGN §5.1）：固定 10 字段按规范编码，完整字节流 **407 字节**，SHA-256 = **`bc1e643aa5154798030a7523d08dd7348d0e5186b508a0e67bba4e0c7de547dd`**。

复核方式（纯文档任务允许使用临时本地脚本计算，但脚本不提交）：

- 第一次计算：用临时本地 Python 脚本按 §9 规范（`struct.pack` 构造 4/8 字节大端帧）对示例 10 字段编码并做 SHA-256；
- 第二次独立复核：改用另一独立临时脚本（`int.to_bytes` 构造大端帧、按字节计数断言 407 字节）再次计算；
- 两次结果一致，均为 `bc1e643aa5154798030a7523d08dd7348d0e5186b508a0e67bba4e0c7de547dd`，且两次脚本均以字节计数确认 407 字节。

DESIGN.md（§5.1，权威）与 DATABASE.md（§5.2）引用结果一致；两处临时脚本均已删除，未进入仓库。

## 11. 一致性收紧项

- `40315 INVALID_TABLE_FORMAT` 消息统一为“源表输入结构或 Schema/表名格式非法”（API.md §4.6/§7），与结构化 `SourceTableInput{schemaName,tableName}` 唯一保存契约一致，不得提示请求应为完整源库ID.Schema.表名。
- 列表 SQL 只查全部启用记录（`WHERE FG_ACTIVE='1'`）并明确 `ORDER BY NVL(UPDATE_TIME, INSERT_TIME) DESC`（自定义 Mapper SQL，DATABASE.md §4.1）；不得用 MyBatis-Plus `apply("NVL(...) DESC")` 冒充排序 API。
- 保留 R1 已正确设计不回退：`sourceSelectionMode = PRESERVE | REPLACE` 唯一契约、删除预览 + 物理删除两步闭环、原子行锁 `SELECT ... FOR UPDATE`、`@TableId IdType.INPUT` + 32 位无连字符 UUID、26 个错误码、`DSUB-REQ-001~107` 追踪表与 126 条验收覆盖不变。
- 元数据 API 由路径变量改为 query 参数后，前端 axios `params` 传参、`dataSourceId`/`schema` 保持原始字符串传输。

## 12. 四份设计文档同步结果

| 文档 | 本次修改要点 |
|---|---|
| DESIGN.md | §1 元数据更新（R2、`PENDING_R2_REVIEW`）；§3.1 查询流程（三类语义 + items/queryWarnings）；§4.1 三类语义替代 INSTR 表述；§5.1 权威 `DSUB-FP-V1` 算法与黄金向量；§6.3/§6.4 统一物化视图谓词；§7.1 服务层 Java 匹配算法；§8 需求追踪表同步；§3.3 元数据接口改 query 参数；页脚 R2 |
| API.md | §1 元数据更新；§2 路径表（#4/#5 改 query 参数、合并说明）；§4.2 列表响应 items+queryWarnings；§4.4/§4.5 query 参数 + 物化视图排除说明；§4.7/§4.9 versionToken→`DSUB-FP-V1`；§7 40315 消息；页脚 R2 |
| UI.md | §1 元数据更新；§2.1 三类候选 + items/queryWarnings 展示 + 歧义警告文案；§6 元数据接口 query 参数；页脚 R2 |
| DATABASE.md | §1 元数据更新；§4.1 列表单次 SQL + 服务层 Java 过滤伪代码；§4.8 4 个带物化视图排除谓词的参数化 SQL；§5.2 `DSUB-FP-V1` 契约与黄金值；页脚 R2 |

## 13. 需求与验收零修改证明

- `REQUIREMENTS.md`、`ACCEPTANCE.md` 相对基准提交 `afc5765...` **零 diff**（`git diff afc5765... -- REQUIREMENTS.md ACCEPTANCE.md` 输出为空）。
- 文档状态均保持 `APPROVED`（含逗号查询批准版本，批准依据提交 `afc5765...`）。
- 126 条验收全部 `NOT_RUN`（0 条非 `NOT_RUN`）。
- 未新增表、列、索引、触发器或迁移。

## 14. 107 条需求追踪与 126 条设计覆盖

- 需求追踪：DESIGN.md §8 追踪表覆盖 `DSUB-REQ-001` ~ `DSUB-REQ-107` 全部 107 条，每条至少映射一个 R2 修订后真实存在的设计章节（`grep -oE 'DSUB-REQ-[0-9]+' DESIGN.md | sort -u | wc -l = 107`）。
- 设计覆盖：`ACCEPTANCE.md` 126 条 `DSUB-AC-001` ~ `DSUB-AC-126` 覆盖 13 个领域（§4.1 生效边界与 sync-client 字段、§4.2 数据模型与存储规则、§4.3 列表页面与查询、§4.4 异常记录与异常数据源展示、§4.5 查看详情、§4.6 新增/编辑弹窗交互与源库搜索、§4.7 目标库选择、§4.8 Schema 与表选择、§4.9 新增保存规则、§4.10 编辑规则、§4.11 并发保护、§4.12 删除规则、§4.13 通用交互、安全与延期项）；R2 变更涉及的 `DSUB-AC-032~035`（三类查询）与 Schema/表、并发保护相关用例均得到 R2 修订后设计章节覆盖。
- 结果：`requirements_traceability_status=COMPLETE`、`acceptance_design_coverage_status=COMPLETE`。设计覆盖不等于验收通过；126 条仍全部 `NOT_RUN`。

## 15. 章节交叉引用验证

- 用临时校验脚本提取四份设计文档全部 275 个具名交叉引用（形如 `DESIGN §N.M`、`API §N.M`、`UI §N.M`、`DATABASE §N.M`），逐一与目标文档真实章节标题核对：**275/275 全部解析到真实章节，0 个悬空引用**（章节级引用 `UI §5` 等按子章节前缀判定）。
- 结果：`cross_reference_status=COMPLETE`。
- 交叉引用校验脚本为临时脚本，未提交。

## 16. 代码、数据库与外部系统保护

- 未修改任何 Java/Vue/TypeScript/JavaScript/SQL/配置/测试文件。
- 未访问数据库，未执行 DDL/DML（`database_access_status=NONE`、`database_write_status=NONE`、`ddl_status=NONE`）。
- 未操作 ZooKeeper、Kafka、`sync-client` 或任何业务进程（`zookeeper_access_status=NONE`、`kafka_operation_status=NONE`、`business_service_operation_status=NONE`）。
- 未修改 `docs/baseline/`、`docs/database/`、`docs/features/large-screen/`、其他 Feature 文档或任何既有报告。
- 未运行 Maven/npm/前后端测试，未启动任何服务（纯文档任务按验证矩阵 `NOT_APPLICABLE`）。
- 文档无密码、连接串、Token 或其他敏感信息（`jdbc:oracle:thin:@//host:port/serviceName` 为占位模板，非真实凭据）。

## 17. 任务开始前既有修改保护

- 开始前已存在的 114 处与本任务无关的既有修改与未跟踪文件（`.claude/settings.local.json`、`agent-env.sh`、`frontend/src/**`、`docs/agent-prompts/**`、`docs/database/TASK3/4*` 删除、`docs/features/app-shell/` 与 `docs/features/large-screen/` 未跟踪目录等）全部保持原样，未修改、未覆盖、未暂存、未提交。
- 任务执行后 `git status --short` 中，除本任务 5 个授权修改文件与 1 个新增报告外，其余全部为开始前既有项；未使用全量暂存，只逐文件暂存本任务授权文件。

## 18. 验证命令与结果

按 R2 提示词 §14 的 39 项强制验证逐项执行，全部通过。代表性命令与结果：

| 验证项 | 命令/方式 | 结果 |
|---|---|---|
| 分支 | `git branch --show-current` | `develop` |
| REQUIREMENTS/ACCEPTANCE 零 diff | `git diff afc5765... -- REQUIREMENTS.md ACCEPTANCE.md` | 0 行（零 diff） |
| 需求/验收状态 | 读元数据表 | `APPROVED` / `APPROVED` |
| 需求数量 | `grep -oE 'DSUB-REQ-[0-9]+' ... | sort -u | wc -l` | 107（001~107 连续唯一） |
| 验收数量 | `grep -cE '^\| DSUB-AC-[0-9]{3} \|'` | 126（001~126 连续唯一） |
| 非 NOT_RUN 验收 | 状态列计数 | 0（126 条全部 `NOT_RUN`） |
| 四份设计文档状态 | 元数据表 | 全部 `DRAFT_PENDING_USER_REVIEW` / `PENDING_R2_REVIEW` |
| 实现状态 | 元数据表 | `NOT_STARTED` |
| 三类查询语义四文档一致 | 关键字比对 | 通过（普通/仅含句点/含逗号） |
| 列表唯一响应类型 | API.md §4.2 | `items + queryWarnings` |
| 无 LIKE/INSTR 冒充含逗号精确匹配 | 全局 grep | 通过（无违规表述） |
| 列表 SQL 排序 | DATABASE.md §4.1 | `ORDER BY NVL(UPDATE_TIME, INSERT_TIME) DESC`，无 `apply("NVL...")` 示例 |
| 元数据 API 唯一路径 | API.md §2 | 仅 `/metadata/schemas`、`/metadata/tables`，query 参数；旧 `{dataSourceId}/schemas/{schema}/tables` 路径已清理（仅保留在合并说明中作为废弃说明） |
| API 能力总数 | API.md §2 能力表 | 恰好 10 |
| 物化视图三处排除 | DESIGN/DATABASE | 三处均带 `ALL_MVIEWS` NOT EXISTS 谓词；两种能力模式均叠加 |
| 无“天然排除”错误表述 | 全局 grep | 仅出现“不会天然排除”否定式 |
| `DSUB-FP-V1` 规范完整 | DESIGN §5.1 | 固定头/字段顺序/4-1-8 字节帧/大端序/null-empty/UTF-8/DATE SQL 齐全 |
| 无 epoch millis 指纹规则 | 全局 grep | 仅“禁止使用 epoch millis”表述 |
| 黄金向量四文档引用一致 | DESIGN §5.1 / DATABASE §5.2 | 均为 `bc1e643a...`（407 字节） |
| 黄金向量二次独立复核 | 两个独立临时脚本 | 两次一致（见 §10） |
| 指纹算法复用 | DESIGN §5.1 | 编辑打开/删除预览/编辑保存锁内/删除锁内同一实现 |
| 40315 契约 | API.md §7 | 源表输入结构或 Schema/表名格式非法 |
| R1 正确设计未回退 | 关键字比对 | PRESERVE/REPLACE、行锁、删除预览、UUID32+IdType.INPUT、26 错误码均在 |
| 需求追踪无遗漏 | DESIGN §8 | 107/107 |
| 验收设计覆盖无遗漏 | 13 领域核对 | 126 全覆盖、状态未改变 |
| 交叉引用 | 临时脚本 | 275/275 解析到真实章节 |
| 大屏延期状态 | DESIGN §2.2 | `DEFERRED_AFTER_DATA_SUBSCRIPTION_FEATURE_ACCEPTANCE` |
| 未改业务/测试代码 | `git diff --name-status afc5765...` | 仅 5 个授权文档修改 |
| 未访问数据库 / 未 DDL | — | `NONE` |
| 未操作 ZooKeeper/Kafka/业务进程 | — | `NONE` |
| 未运行 Maven/npm/测试 | — | `NOT_APPLICABLE`（纯文档） |
| 无敏感信息 | 全局 grep | 通过 |
| `git diff --check` | 授权 5 文件 | 通过 |
| 授权文件范围 | `git diff --name-status` + 未跟踪清单 | 5 修改 + 1 新增 = 6 个授权文件 |
| 既有修改保护 | `git status --short` 对比 | 既有项保持原样 |

## 19. 后续步骤：ChatGPT 正式设计 R2 复审

- 本任务完成的是设计基线 R2 定向修订（纯文档），**不构成设计批准、功能实现或验收通过**。
- 下一步：由 ChatGPT 对 DESIGN/API/UI/DATABASE 当前提交进行正式设计 R2 复审；若复审结论为 `APPROVED`，再按项目流程进入实现阶段规划。
- 实现阶段（`NOT_STARTED`）尚未开始；126 条验收（全部 `NOT_RUN`）尚未执行；大屏调整保持 `DEFERRED_AFTER_DATA_SUBSCRIPTION_FEATURE_ACCEPTANCE`，不作为本 Feature 验收阻断项。

## 20. 最终状态声明

本任务为纯文档设计基线 R2 定向修订，已实现：三类查询语义在服务层 Java 字面量过滤中的一致落地；列表 API 唯一响应结构 `items + queryWarnings`；元数据 API 由路径变量改为 query 参数；Oracle 物化视图在三处显式排除；`DSUB-FP-V1` 成为字节级确定算法并具备双次复核一致的黄金测试向量；R1 已正确设计全部保留不回退；REQUIREMENTS/ACCEPTANCE 零修改且保持 `APPROVED`；四份设计文档保持 `DRAFT_PENDING_USER_REVIEW`/`PENDING_R2_REVIEW` 草案状态等待 ChatGPT 正式设计 R2 复审；仅 6 个授权文件进入提交。

*报告生成：DATA-SUBSCRIPTION-DESIGN-BASELINE-001-R2（纯文档设计基线 R2 定向修订）。本任务只修正 R1 正式复审剩余四项并同步含逗号查询批准基线；设计仍为 `DRAFT_PENDING_USER_REVIEW` 草案待 ChatGPT 正式设计 R2 复审，功能未实现，126 条验收未执行。*
