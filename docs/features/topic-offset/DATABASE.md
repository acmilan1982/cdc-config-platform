# 数据同步进度 Feature 数据库物理事实只读复核（DATABASE）

## 1. 文档元数据与任务编号

| 项目 | 值 |
|---|---|
| Feature 中文名称 | 数据同步进度 |
| Feature 标识 | `topic-offset` |
| 路由 | `/monitor/topic-offset` |
| 目标文档 | `docs/features/topic-offset/DATABASE.md` |
| 文档状态 | `APPROVED`（ChatGPT 已于 2026-09-02 复审批准只读复核结果；本状态由 `VERIFIED_PENDING_USER_REVIEW` 收口而来，详见收口说明与 §12 变更记录） |
| 文档性质 | 数据库物理事实只读复核记录；**不是** DESIGN.md 功能设计基线，不构成任何建表/改表/加索引/加约束方案 |
| 任务编号 | `TOPIC-OFFSET-DATABASE-READONLY-VERIFICATION-001` |
| 复核时间 | 2026-09-02 |
| 复核数据库 | Oracle 19c 开发库（`192.168.174.65:1521/prod.enmotech.com`） |
| 复核 Schema | `CDC`（连接用户 `CDC`，`CURRENT_SCHEMA=CDC`） |
| 起始基线提交 | `ddc74d70714a5e88b6f98291c76b070b09f8d54a` |
| 关联已批准文档 | `README.md`（文档状态 `APPROVED`）、`REQUIREMENTS.md`（需求基线 `APPROVED`）、`ACCEPTANCE.md`（验收标准基线 `APPROVED`，验收执行 `NOT_RUN`） |
| 关系 | 本复核通过并获 ChatGPT 复审后，才能进入 `TOPIC-OFFSET-DESIGN-001`；本任务不开始设计、不实现、不执行验收 |

审批状态（保持与已批准文档一致）：

- requirements_status：`APPROVED`
- acceptance_status：`APPROVED`
- acceptance_execution_status：`NOT_RUN`
- design_status：`NOT_STARTED`
- implementation_status：`NOT_STARTED`

只读边界声明：本任务只执行无副作用 `SELECT`；未执行也不授权任何 `INSERT/UPDATE/DELETE/MERGE`、`CREATE/ALTER/DROP/TRUNCATE/COMMENT/GRANT/REVOKE`、PL/SQL、`COMMIT/ROLLBACK`、统计收集、锁表及任何会话/Schema 对象修改；未访问 Kafka、ZooKeeper；未启动服务。

### 收口说明（TOPIC-OFFSET-DATABASE-APPROVAL-CLOSEOUT-001）

ChatGPT 已复审批准只读复核提交 `d63e6e51cfa8a8c4a4c5bde38421f6c808d97600` 的数据库物理事实复核结果，结论 `APPROVED`。本收口任务仅将文档状态由 `VERIFIED_PENDING_USER_REVIEW` 更新为 `APPROVED`：

- 数据库结构、约束、索引、分区、统计、样本、风险结论与未能核实事项零变化；
- 本次批准的是数据库物理事实只读复核结果（功能级复核基线），不等于授权本任务或本功能修改数据库（含原表 `CDC_TOPIC_OFFSET`），也未改变任何已批准项目级基线；
- 数据库事实基线获批不代表设计或实现已经开始；设计（DESIGN.md / API.md / UI.md 及数据库设计基线）与实现仍为 `NOT_STARTED`，验收执行仍为 `NOT_RUN`。

## 2. 复核范围、环境、时间与只读边界

- 复核范围：`CDC_TOPIC_OFFSET`（页面主数据源）以及页面名称映射与筛选候选直接相关的 `CDC_CLIENT_MULTIPLE`、`CDC_DATA_SOURCE` 两张配置表的物理字段事实；未扩大到两张配置表的完整业务复验。
- 连接信息依据：代码 `backend/src/main/resources/application-dev.yml`（url `jdbc:oracle:thin:@//192.168.174.65:1521/prod.enmotech.com`、username `CDC`）与项目级已批准 `ENVIRONMENT.md` §2；未展示或转移任何额外凭据。
- 复核方式：SQL\*Plus 只读查询 `ALL_TABLES / ALL_TAB_COLUMNS / ALL_COL_COMMENTS / ALL_TAB_COMMENTS / ALL_CONSTRAINTS / ALL_CONS_COLUMNS / ALL_INDEXES / ALL_IND_COLUMNS / ALL_PART_TABLES / ALL_PART_KEY_COLUMNS / ALL_TAB_PARTITIONS / ALL_TRIGGERS / ALL_SYNONYMS / ALL_OBJECTS` 与受限数据分布查询；样本查询全部限定行数。
- 时间：2026-09-02，一次会话内完成。
- 结果可信边界：本文件所有数据统计均来自开发库当次快照；不宣称代表生产数据分布。

## 3. CDC_TOPIC_OFFSET 完整物理结构

Owner/Schema：`CDC`；普通堆表（`IOT_TYPE=N`），非临时表（`TEMPORARY=N`），非分区（`PARTITIONED=NO`），表空间 `USERS`，`LOGGING=YES`；表注释：`中心端topic消费记录`；当前无触发器、无同义词、无其他类型同名对象。

| # | 字段名 | Oracle 类型 | 长度语义 | 精度/小数 | 可空 | 默认值 | 字段注释（字典） | 页面角色 |
|---|---|---|---|---|---|---|---|---|
| 1 | `SERVER_ID` | VARCHAR2 | 64 BYTE | — | N | — | 中心端标识符 | “中心端”列，原样展示 |
| 2 | `KAFKA_TOPIC` | VARCHAR2 | 512 BYTE | — | N | — | 中心端从kafka读取的topic | “同步对象”的解析来源；原始 Topic 权威保留 |
| 3 | `NEXT_OFFSET` | NUMBER | 22 | 19,0 | N | — | topic的下一个offset | “已保存消费位置”，按字符串传输与展示 |
| 4 | `UPDATED_AT` | DATE | 7 | — | N | — | 记录更新时间 | “断点更新时间”，按 `YYYY-MM-DD HH:mm:ss` 展示 |

复核确认：需求/验收中出现并要求的 `SERVER_ID`、`KAFKA_TOPIC`、`NEXT_OFFSET`、`UPDATED_AT` 四列在当前物理表中真实存在，物理类型与已批准需求语义匹配（详见 §8）。表中没有与 Kafka 末端位置、待消费数量、消费延迟、完成百分比、状态列对应的物理列——第一版这三项 Kafka 指标固定显示 `—` 与本表无物理列的事实一致。

## 4. 约束、索引、分区与存储事实

### 4.1 约束

| 类型 | 名称 | 字段（顺序） | 状态 | 其它 |
|---|---|---|---|---|
| PRIMARY KEY | `PK_CDC_TOPIC_OFFSET` | `SERVER_ID`(1), `KAFKA_TOPIC`(2) | ENABLED / VALIDATED | NOT DEFERRABLE / IMMEDIATE / USER NAME |
| CHECK (NOT NULL) | `SYS_C0041466` | `SERVER_ID` | ENABLED / VALIDATED | `"SERVER_ID" IS NOT NULL` |
| CHECK (NOT NULL) | `SYS_C0041467` | `KAFKA_TOPIC` | ENABLED / VALIDATED | `"KAFKA_TOPIC" IS NOT NULL` |
| CHECK (NOT NULL) | `SYS_C0041468` | `NEXT_OFFSET` | ENABLED / VALIDATED | `"NEXT_OFFSET" IS NOT NULL` |
| CHECK (NOT NULL) | `SYS_C0041469` | `UPDATED_AT` | ENABLED / VALIDATED | `"UPDATED_AT" IS NOT NULL` |

- 无 UNIQUE 约束、无 FOREIGN KEY（物理外键）约束。
- 结论：`(SERVER_ID, KAFKA_TOPIC)` 已由数据库主键唯一保证，可承担行唯一标识；本任务未创建任何约束。

### 4.2 索引

| 名称 | 类型 | 唯一性 | 字段（顺序） | 状态 | 可见性 | 分区 |
|---|---|---|---|---|---|---|
| `PK_CDC_TOPIC_OFFSET` | NORMAL | UNIQUE | `SERVER_ID`(1), `KAFKA_TOPIC`(2) | VALID | VISIBLE | NO |

- 表中仅有该主键索引，无其它普通索引、函数索引或位图索引。
- 事实判断：需求固定排序 `KAFKA_TOPIC ASC, SERVER_ID ASC`（TOFF-REQ-087）与主键索引前导列顺序（`SERVER_ID, KAFKA_TOPIC`）不一致，按该排序查询需要额外排序步骤；在 ≤6000 条规模下开销可忽略。是否新增索引属后续设计评估项，本任务不提出 DDL。

### 4.3 分区与存储

- 分区：`ALL_PART_TABLES` 与 `ALL_TAB_PARTITIONS` 均无记录；`PARTITIONED=NO`。非分区普通堆表。
- 表空间：`USERS`；`LOGGING=YES`；`IOT_TYPE=N`；`TEMPORARY=N`。
- 优化器统计：`LAST_ANALYZED=19-AUG-26`，`NUM_ROWS=8`（统计快照，与当次 `COUNT(*)` 一致）。本任务未执行统计信息收集。

## 5. 三张表中页面相关字段的映射

### 5.1 CDC_TOPIC_OFFSET（页面主数据）

| 页面字段 / 查询语义 | 来源列 | 物理类型 | 备注 |
|---|---|---|---|
| 同步对象（解析展示、悬浮原始 Topic） | `KAFKA_TOPIC` | VARCHAR2(512 BYTE) | 按“客户端.源库.Schema.表名.目标库”五段拆分 |
| 已保存消费位置 | `NEXT_OFFSET` | NUMBER(19,0) | 按字符串传输/展示（TOFF-REQ-076） |
| 断点更新时间 | `UPDATED_AT` | DATE | 按 `YYYY-MM-DD HH:mm:ss` 格式化展示 |
| 中心端 | `SERVER_ID` | VARCHAR2(64 BYTE) | 原样展示 |
| 客户端 / 源库 / 目标库 / 表名 筛选 | 由 `KAFKA_TOPIC` 文本解析 | — | 本表无对应独立物理列（见 §9 风险 a） |
| Kafka 末端位置 / 待消费数量 / 消费延迟 | 无物理列（Kafka 侧口径） | — | 第一版固定显示 `—`（TOFF-REQ-066/067） |

### 5.2 CDC_CLIENT_MULTIPLE（客户端候选，页面“客户端”筛选/下拉）

| 页面语义 | 来源列 | 物理类型 | 可空 | 备注 |
|---|---|---|---|---|
| 候选 ID / 精确匹配值 | `CLIENT_ID` | VARCHAR2(32 BYTE) | N | 主键（PK_CDC_CLIENT_MULTIPLE），无重复 |
| 展示“客户端ID（客户端描述）”的描述部分 | `CLIENT_DESC` | VARCHAR2(256 BYTE) | Y | 当前无 NULL/空串；代码需防长度过长省略与悬浮（TOFF-REQ-047） |
| 停用标记（候选读取全部配置，不按启用过滤） | `FG_ACTIVE` | VARCHAR2(1 BYTE) | N | `0/1`；本页候选需含全部配置并按 `0` 标记“已停用”（TOFF-REQ-045/046） |
| （本页不使用）多值弱逻辑引用 | `DATA_SOURCE_ID` | VARCHAR2(1000 BYTE) | Y | 逗号分隔，非本页映射字段 |

排序规则：客户端候选按 `CLIENT_ID` 升序（TOFF-REQ-041）。

### 5.3 CDC_DATA_SOURCE（源库/目标库候选，页面“源库/目标库”筛选/下拉）

| 页面语义 | 来源列 | 物理类型 | 可空 | 备注 |
|---|---|---|---|---|
| 候选 ID / 精确匹配值 | `DATA_SOURCE_ID` | VARCHAR2(32 BYTE) | N | 主键（PK_CDC_DATA_SOURCE），无重复 |
| 展示“ORG（ID）”的 ORG/名称 | `DATA_SOURCE_ORG` | VARCHAR2(64 BYTE) | N | 当前无 NULL/空串；空值展示“未定义名称（ID）”为代码防护（TOFF-REQ-048） |
| 源库/目标库类别 | `DATA_SOURCE_CATEGORY` | VARCHAR2(30 BYTE) | Y | 字典注释“source/target 大小写都行”；实际数据存在 `SOURCE/source/target` 大小写混用，识别必须大小写不敏感（TOFF-REQ-044） |
| 停用标记（候选读取全部配置，不按启用过滤） | `FG_ACTIVE` | VARCHAR2(1 BYTE) | Y | 当前无 NULL；本页候选需含全部配置并按 `0` 标记“已停用”（TOFF-REQ-045/046） |
| 不参与本页读取 | `DATA_SOURCE_PASSWORD` 等其余列 | — | — | 本页不读取；本任务从未 SELECT 密码列值 |

排序规则：源库/目标库候选按 `DATA_SOURCE_ORG, DATA_SOURCE_ID` 升序（TOFF-REQ-042/043）。

## 6. 数据质量与规模统计（开发库 2026-09-02 快照）

### 6.1 CDC_TOPIC_OFFSET

| 项 | 结果 |
|---|---|
| 总行数 | 8 |
| 四列空值 | 全部 0 |
| 中心端去重数 | 1（`Server001`），`SERVER_ID` 长度 8~9 |
| Topic 去重数 | 8；`KAFKA_TOPIC` 长度 68~82（字符） |
| `(SERVER_ID, KAFKA_TOPIC)` 重复组合 | 0（主键唯一） |
| `NEXT_OFFSET` 最小/最大 | 359337 / 7289444 |
| `NEXT_OFFSET` 负值 / 小数 | 0 / 0 |
| `NEXT_OFFSET` 超过 JS 安全整数（9,007,199,254,740,991） | 0（当前样本；但类型 NUMBER(19,0) 上限远超 JS 安全整数，见 §8 结论 3） |
| `UPDATED_AT` 最早 / 最晚 | 2026-08-17 17:46:17 / 2026-08-17 18:09:54 |

- 预期核对：需求“开发环境约十余条记录”与当次 8 条量级相符。

### 6.2 CDC_CLIENT_MULTIPLE

| 项 | 结果 |
|---|---|
| 总行数 / 去重 ID | 7 / 7（PK 唯一，无重复 ID） |
| `CLIENT_ID` 空值 / 长度 | 0；8~9 |
| `CLIENT_DESC` 空值 / 空串 / 最大长度 | 0 / 0 / 77 |
| `FG_ACTIVE` 空值 / 取值分布 | 0；`0`=4，`1`=3 |

- 事实：当前数据存在停用（`FG_ACTIVE=0`）客户端，候选必须包含停用配置并标记（TOFF-REQ-045/046 现实触发）。

### 6.3 CDC_DATA_SOURCE

| 项 | 结果 |
|---|---|
| 总行数 / 去重 ID | 20 / 20（PK 唯一，无重复 ID） |
| `DATA_SOURCE_ID` 空值 / 长度 | 0；4~32 |
| `DATA_SOURCE_ORG` 空值 / 空串 / 最大长度 | 0 / 0 / 18 |
| `DATA_SOURCE_CATEGORY` 空值 / 字面取值数 | 0；3 个字面值（`SOURCE`、`source`、`target`，逻辑两类的含大小写混用） |
| `FG_ACTIVE` 空值 | 0 |
| 大小写不敏感类别 × 启用分布 | `SOURCE`：停用 6 / 启用 3；`TARGET`：停用 8 / 启用 3 |
| 同类别内 `DATA_SOURCE_ORG` 重复（ORG 同名但 ID 不同） | 存在（如 target `doirs库`×5、`mysql库`×2、`杭州市第一人民医院`×2） |

- 事实：类别大小写混用真实存在（需 TOFF-REQ-044 大小写不敏感）；停用数据源真实存在；ORG 在类别内不唯一（候选去重按 ID，非按 ORG）。

## 7. Topic 结构统计及代表性样本

- 当次数据 Topic 全部满足“恰好 5 段且各段非空、无前导/结尾/连续句点”。
- `REGEXP_LIKE(KAFKA_TOPIC,'^[^.]+(\.[^.]+){4}$')`：恰好 5 段 = 8；非 5 段 = 0。
- 句点数量分布：全为 4 个句点（8/8）；前导/结尾句点 0；连续句点 0。
- 代表样本（8 条全部列出；`SERVER_ID=Server001`；仅展示解析判断所需字段）：

| SERVER_ID | KAFKA_TOPIC | NEXT_OFFSET | UPDATED_AT |
|---|---|---|---|
| Server001 | `hosp-012.112-source-19c.SPT_HIS_2023.OPT_FEE.company-target-doris-v4` | 2357580 | 2026-08-17 17:49:01 |
| Server001 | `hosp-012.112-source-19c.SPT_HIS_2023.OPT_FEEDETAIL.company-target-doris-v4` | 6043534 | 2026-08-17 17:46:17 |
| Server001 | `hosp-012.112-source-19c.SPT_HIS_2023.OPT_HANDLEDETAIL.company-target-doris-v4` | 4275211 | 2026-08-17 18:09:54 |
| Server001 | `hosp-012.112-source-19c.SPT_HIS_2023.OPT_HANDLEDETAIL_EXE.company-target-doris-v4` | 7289444 | 2026-08-17 17:53:03 |
| Server001 | `hosp-012.112-source-19c.SPT_HIS_2023.OPT_RECORD.company-target-doris-v4` | 5136033 | 2026-08-17 18:06:36 |
| Server001 | `hosp-012.112-source-19c.SPT_HIS_2023.OPT_REGISTER.company-target-doris-v4` | 3422544 | 2026-08-17 18:06:01 |
| Server001 | `hosp-012.112-source-19c.SPT_HIS_2023.PT_EXAMINATION_DETAIL.company-target-doris-v4` | 4231482 | 2026-08-17 17:57:42 |
| Server001 | `hosp-012.112-source-19c.SPT_HIS_2023.PT_EXAMINATION_RECORD.company-target-doris-v4` | 359337 | 2026-08-17 17:52:51 |

- 样本形态与需求概念格式（客户端.源库.Schema.表名.目标库）一致；表名对应第 4 段，源库/目标库经配置表映射名称，与候选读取逻辑匹配。
- 非 5 段、段内含句点等异常形态在开发库当前样本中不存在（0 条），需在设计/实现中按 TOFF-REQ-014~019 处理，验收阶段可用构造数据（须另行授权）或未来真实异常记录验证，本任务未写入任何测试数据。

## 8. 对已批准需求可行性的逐项结论

| # | 结论对象 | 事实结论 | 说明 |
|---|---|---|---|
| 1 | 页面字段可用性（TOFF-REQ-065/076/084/085 等） | 可行 | `NEXT_OFFSET`/`KAFKA_TOPIC`/`SERVER_ID`/`UPDATED_AT` 均真实存在，物理类型支持已批准口径（Offset 为 NUMBER(19,0) 需字符串链路；时间为 DATE 秒级精度） |
| 2 | 绝对只读（TOFF-REQ-004/009/011/122/124） | 可行 | `CDC_TOPIC_OFFSET` 为普通只读数据源，无平台写路径；页面读取不触发任何 DML |
| 3 | `NEXT_OFFSET` 必须后端转字符串（TOFF-REQ-076/080） | **是** | NUMBER(19,0) 最大量级约 9.99×10^18，远超 JS 安全整数 9,007,199,254,740,991；当前样本虽在安全范围内，物理类型仍可超限，必须按字符串传输/展示 |
| 4 | 行唯一与稳定排序（TOFF-REQ-083/087/091~093） | 可行 | 主键唯一保证 `(SERVER_ID, KAFKA_TOPIC)` 无重复；`KAFKA_TOPIC ASC, SERVER_ID ASC` 排序键整体唯一，分页确定性成立，无需额外稳定字段；两列均 NOT NULL，无 NULL 排序问题；NLS_SORT=BINARY 确定性 |
| 5 | Topic 严格五段解析（TOFF-REQ-012~019） | 可行，需实现异常分支 | 当前样本全为恰好 5 段；异常（<5、>5、段内句点、空段）必须按需求实现处理与展示，无法以当前样本覆盖 |
| 6 | 客户端/源库/目标库候选读取全部配置并按名称/停用映射（TOFF-REQ-040~052） | 可行 | 两张配置表字段真实存在；停用配置当前真实存在（需包含并标记）；类别存在大小写混用（需大小写不敏感）；`CLIENT_DESC`/`DATA_SOURCE_ORG` 无空值但需代码空值防护 |
| 7 | 绝对只读配置映射（`CDC_CLIENT_MULTIPLE`、`CDC_DATA_SOURCE` 同样只读） | 可行 | 平台对两张配置表已有只读用法与（`CDC_DATA_SOURCE` 的）维护 CRUD；本页按只读查询读取，无写操作 |
| 8 | 固定 150/页与 ≤6000 规模下查询 | 可行 | 8 行开发规模；即使到生产 ≤6000 行，全表读取 + 内存排序/分页开销可忽略；无必要新增索引，见 §9 风险 g |
| 9 | Offset 无负值/小数/超范围在展示时的处理 | 无当前阻塞 | 当前无负值/小数/超 JS 安全样本；字符串链路已规避精度问题，负值/不一致显示属于 TOFF-REQ-074 后续口径，非本表阻塞 |

## 9. 后续设计必须处理的事实与风险

| 编号 | 事实 / 风险 | 影响 | 说明（仅记录，不实施 DDL/变更） |
|---|---|---|---|
| a | `CDC_TOPIC_OFFSET` 无“客户端/源库/目标库/表名”等独立物理列 | 筛选无法直接命中单一索引列 | 四个查询条件都是对 `KAFKA_TOPIC` 文本的派生逻辑（第 1/2/4 段等）叠加配置映射；设计需确定 SQL 派生/LIKE 或后端过滤边界，属后续设计评估项 |
| b | 开发库无非 5 段 / 段内含句点样本 | 异常分支无法用现网数据验证 | 设计与验收需覆盖 TOFF-REQ-014~019/032/033 逻辑；验收需构造数据（另行授权） |
| c | 类别大小写混用（`SOURCE/source/target`） | 筛选/候选必须大小写不敏感 | 与 TOFF-REQ-044 一致；设计统一归一化识别 |
| d | 大量停用配置（客户端 4/7、数据源 SOURCE 6/TARGET 8 停用） | 候选含停用并标记“已停用”会真实触发 | 与 TOFF-REQ-045/046 一致；页面要能展示停用状态且仍能匹配筛选 |
| e | `DATA_SOURCE_ORG` 在类别内不唯一、`CLIENT_DESC`/`DATA_SOURCE_ORG` 空值防护 | 显示映射需以 ID 为权威并防空值 | 候选去重按 ID（TOFF-REQ-049）；空名展示“未定义名称（ID）”（TOFF-REQ-048）为代码防护需求，当前无样本 |
| f | `NEXT_OFFSET` NUMBER(19,0) | Offset 必须字符串链路，防 JS Number 精度丢失 | 后端接口与前端展示全链路字符串（TOFF-REQ-076/080）；当前开发样本不超限不代表类型安全 |
| g | 主键索引前导列为 `SERVER_ID`，与固定排序 `KAFKA_TOPIC ASC, SERVER_ID ASC` 不一致 | 排序需额外排序步骤 | ≤6000 条规模可忽略；如需大型数据集优化可后续评估是否新增排序索引，本任务不实施 |
| h | `KAFKA_TOPIC` VARCHAR2(512 BYTE) 为字节长度语义 | 未来含多字节段时 512 字节上限可能约束 | Topic 命名规则下段通常 ASCII；设计如需放宽可后续评估（不实施） |
| i | `UPDATED_AT` 为 Oracle DATE（秒级、无时区类型） | 时间无 Oracle 时区语义 | 值语义为写入方（sync-server）会话时间；展示按本地 `YYYY-MM-DD HH:mm:ss`，不得做隐式时区转换（TOFF-REQ-084/114 区分“最近刷新时间”） |
| j | 本复核为开发库单点快照 | 生产分布未采样 | 全部统计仅代表开发库 2026-09-02；生产数据特征如需确认应在具备只读权限后单独核验 |
| k | `CDC_TOPIC_OFFSET` 不在已批准数据库物理基线（docs/database/ 16 张单表基线）内，已批准 `SCHEMA.md` 标为“历史提及、当前代码无访问” | 本 DATABASE.md 是功能级复核记录，不是项目级物理基线 | 是否提升为项目级已批准物理基线属于后续独立基线任务；本任务未改变任何已批准基线 |

## 10. 已执行只读 SQL 及结果摘要

以下为本任务实际执行的只读查询类别（连接：开发库 `CDC` Schema；全部无副作用）。完整可复核要点如下：

| # | 查询目的 | 主要对象 / 关键谓词 | 结果摘要 |
|---|---|---|---|
| 1 | 连接身份与当前 Schema | `USER`、`SYS_CONTEXT('USERENV','CURRENT_SCHEMA')` | `CDC` / `CDC` / `CDC` |
| 2 | 三表可见性与对象类型 | `ALL_TABLES`、`ALL_OBJECTS`、`ALL_SYNONYMS` WHERE 名称 IN（三表） | 三表均存在，Owner 均 `CDC`，无同名同义词 |
| 3 | 表元数据 | `ALL_TABLES` WHERE `CDC_TOPIC_OFFSET` | 堆表、非临时、非分区、表空间 USERS、`NUM_ROWS=8` |
| 4 | 表/列注释 | `ALL_TAB_COMMENTS`、`ALL_COL_COMMENTS` | 表“中心端topic消费记录”；四列注释见 §3 |
| 5 | 列结构 | `ALL_TAB_COLUMNS`（类型/长度/精度/可空/CHAR_USED） | 见 §3、§5 |
| 6 | 约束 | `ALL_CONSTRAINTS` + `ALL_CONS_COLUMNS` | PK_CDC_TOPIC_OFFSET(SERVER_ID,KAFKA_TOPIC)；4 个 NOT NULL CHECK |
| 7 | 索引 | `ALL_INDEXES` + `ALL_IND_COLUMNS` | 仅 PK_CDC_TOPIC_OFFSET 唯一索引 |
| 8 | 分区 | `ALL_PART_TABLES`、`ALL_PART_KEY_COLUMNS`、`ALL_TAB_PARTITIONS` | 无分区 |
| 9 | 触发器 | `ALL_TRIGGERS` | 三表均无触发器 |
| 10 | 行数与空值 | `COUNT(*)` + 各列 NULL 计数 | 8 行；四列 0 NULL |
| 11 | 重复键 | `GROUP BY (SERVER_ID,KAFKA_TOPIC) HAVING COUNT(*)>1` | 0 |
| 12 | 长度/去重统计 | `COUNT(DISTINCT ...)`、`MIN/MAX(LENGTH/LENGTHB(...))` | 见 §6 |
| 13 | Offset 数值分布 | `MIN/MAX`、负值/小数/超 JS 安全整数计数 | 见 §6.1 |
| 14 | 时间范围 | `MIN/MAX(UPDATED_AT)` | 见 §6.1 |
| 15 | Topic 段结构 | `REGEXP_LIKE`、`REGEXP_COUNT`、前导/结尾/连续句点 | 全为恰好 5 段（8/8） |
| 16 | 样本 | `SELECT KAFKA_TOPIC, SERVER_ID, NEXT_OFFSET, UPDATED_AT ... ORDER BY KAFKA_TOPIC`（8 行，全量小表） | 见 §7 |
| 17 | 配置表列/约束 | `ALL_TAB_COLUMNS`、`ALL_CONSTRAINTS`（两表） | 见 §5.2/§5.3 |
| 18 | 配置表分布 | 行数、ID 去重、FG_ACTIVE/CATEGORY 分布、重复 ID/ORG | 见 §6.2/§6.3 |

未输出任何密码、Token 或敏感连接信息；未 SELECT `CDC_DATA_SOURCE.DATA_SOURCE_PASSWORD` 等凭据列的值。

## 11. 未能核实事项

| 项 | 状态 | 说明 |
|---|---|---|
| 生产环境数据分布 | `UNVERIFIED` | 本复核仅基于开发库；生产规模/分布未采样，需在生产侧具备只读权限后单独核验 |
| 非 5 段 / 段内含句点 / 负值 / 小数 / 超 JS 安全范围真实样本 | `UNVERIFIED`（当前无样本） | 开发库当前不存在此类记录；无法据现网数据验证对应展示分支 |
| 配置表“空名称/缺失 ID”真实样本 | `UNVERIFIED`（当前无样本） | `CLIENT_DESC`、`DATA_SOURCE_ORG` 当前无空值/空串；缺失配置引用场景需构造或后续真实出现 |
| 项目级物理基线提升 | `UNVERIFIED` | `CDC_TOPIC_OFFSET` 未在已批准项目级数据库物理基线内；是否提升属后续独立基线任务 |
| 触发器等依赖对象 | 已核实 | 三表均无触发器；未发现相关序列/视图/同义词（同义词无匹配） |

## 12. 变更记录

| 日期 | 变更 | 依据 |
|---|---|---|
| 2026-09-02 | 建立 `CDC_TOPIC_OFFSET` 及其页面映射配置表物理事实只读复核文档（`VERIFIED_PENDING_USER_REVIEW`；未批准、未授权建表/改表/索引/约束变更；不进入设计、实现或验收） | TOPIC-OFFSET-DATABASE-READONLY-VERIFICATION-001（只读复核任务；待用户/ChatGPT 审阅后进入 DESIGN-001） |
| 2026-09-02 | 收口：ChatGPT 复审批准只读复核结果（`APPROVED`，复审提交 `d63e6e51...`）；文档状态由 `VERIFIED_PENDING_USER_REVIEW` 更新为 `APPROVED`；数据库结构/约束/索引/分区/统计/样本/风险/未能核实事项零变化；批准仅为功能级数据库事实复核基线，不授权修改数据库，也不表示设计或实现已开始 | TOPIC-OFFSET-DATABASE-APPROVAL-CLOSEOUT-001（数据库复核文档正式批准收口任务） |
