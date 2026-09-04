# 探针端管理 Feature 数据库使用设计（DATABASE）

## 1. 元数据与文档状态

| 项目 | 值 |
|---|---|
| Feature 中文名称 | 探针端管理 |
| Feature 标识 | `client-config` |
| 既有路由 | `/config/client`（保持不变） |
| 目标文档 | `docs/features/client-config/DATABASE.md` |
| 文档状态 | `DRAFT_PENDING_USER_REVIEW`（设计草案，尚未经 ChatGPT 正式复审与项目负责人批准；不得写成已批准基线） |
| 实现状态 | `NOT_STARTED` |
| 初版任务 | `CLIENT-CONFIG-DESIGN-BASELINE-001`（阶段 4 设计基线，纯文档） |
| 初版基线提交 | `cecfdd5478df8b82ba39c083553ea8dd7ead48e8` |
| 初版设计提交 | `21f4729c43d146426e8d4f1b2d6b667cfcf160ff` |
| R1 任务 | `CLIENT-CONFIG-DESIGN-BASELINE-001-R1`（正式设计复审驱动的定向修订，纯文档） |
| R1 复审结论 | ChatGPT 正式复审：`CHANGES_REQUIRED`（R1-01~R1-09；本文件落实 R1-03/R1-04/R1-06/R1-07 的 SQL 与读取契约修订） |
| R1 基线提交 | `21f4729c43d146426e8d4f1b2d6b667cfcf160ff` |
| 依据需求 | `CCFG-REQ-001~090`（`APPROVED`） |
| 依据验收 | `CCFG-AC-001~076`（全部 `NOT_RUN`） |
| 创建日期 | 2026-09-03 |
| R1 日期 | 2026-09-04 |
| 并发调整任务 | `CLIENT-CONFIG-DESIGN-CONCURRENCY-ADJUSTMENT-001`（依据重新批准的需求/验收并发口径，定向清除过时显式表锁设计的纯文档任务） |
| 并发调整日期 | 2026-09-04 |
| 设计编号 | `CCFG-DB-001 ~ CCFG-DB-022`，连续、唯一、不可复用；每个设计编号恰有一个定义行 |
| PENDING_USER_CONFIRMATION | `0` |
| 数据库访问授权状态 | `NOT_RUN_NOT_AUTHORIZED`（本任务不连接数据库，全部元数据来自已批准数据库基线或项目负责人正式复审提供） |
| 写操作状态 | `NONE`；`DDL_STATUS=NONE`；`DML_STATUS=NONE` |
| 配套文档 | `DESIGN.md`、`API.md`、`UI.md` |

R1 数据库侧修订目标（不改已批准 90 条需求与 76 条验收、不进入代码实现、不做设计批准收口）：`CLIENT_DESC` 保存/Trim/字节口径固定为原文保存、Trim 仅判空、按实际保存原文计字节（`R1-03`，见 CCFG-DB-003）；关键词 LIKE 增加 `\` 转义与 `ESCAPE '\'`，`%`/`_`/`\` 按字面量（`R1-04`，见 CCFG-DB-008 与新增 CCFG-DB-021）；列表/映射读取覆盖类别/类型资格判定、已知含英文逗号数据源 ID 集合与歧义行判定、历史 `CLIENT_DESC` 原样含空白/NULL 读取（`R1-06/R1-07/R1-08`，见新增 CCFG-DB-022）。

并发口径定向调整（2026-09-04，`CLIENT-CONFIG-DESIGN-CONCURRENCY-ADJUSTMENT-001`，纯文档）：删除把 `LOCK TABLE CDC_CLIENT_MULTIPLE IN EXCLUSIVE MODE WAIT 5` 作为唯一性保证手段的数据库现行设计：`CCFG-DB-007` 改依托 DML 前全量重读 + 当次检查、不依托表锁/物理强一致唯一约束；`CCFG-DB-009` 由定义可执行 `LOCK TABLE` SQL 改为显式禁止主动表锁与专用锁超时路径的数据库边界；`CCFG-DB-010` 由“锁内检查读取”改为“DML 前全量检查读取”（普通一致性读，不阻止其他会话写入）；§5 事务与锁矩阵改列并删除锁获取顺序/`WAIT 5`/超时分支；`CCFG-DB-016/017/018` 改写普通短事务 + 竞态边界口径。`ORA-30006 → 50050` 已删除（见 API.md）；本任务不连接数据库、不执行任何 DML/DDL，`DDL_STATUS=NONE`。原表锁方案为设计草案内容，未获项目负责人批准；本调整后数据库设计仍为 `DRAFT_PENDING_USER_REVIEW`，待 ChatGPT 正式设计调整复审与项目负责人批准。

## 2. 事实分层（256 历史基线 / 真实 1024 元数据 / 本 Feature 目标）

| 设计编号 | 设计决定 | 覆盖需求 | 覆盖验收 |
|---|---|---|---|
| CCFG-DB-001 | 严格区分三层事实，互不覆盖：① 已批准数据库基线（`docs/database/`，如 `tables/CDC_CLIENT_MULTIPLE.md`）仍记录 `CLIENT_DESC VARCHAR2(256)` 的历史核验事实，本设计不改写 `docs/database/` 任何文件；② 项目负责人正式复审于真实数据库查询得到的元数据为 `VARCHAR2(1024 BYTE)`（`DATA_LENGTH=1024`、`CHAR_LENGTH=1024`、`CHAR_USED=B`）；③ 本 Feature 已批准需求统一采用 `1024 BYTE` 语义（去除首尾空白后必填、UTF-8 编码字节数 `<=1024`）。数据库基线同步是后续独立数据库只读核验与同步任务，本设计任务不重新连接数据库验证 1024，也不提出或执行任何 `ALTER`。 | CCFG-REQ-039 | CCFG-AC-033 |

## 3. 字段使用矩阵

| 设计编号 | 设计决定 | 覆盖需求 | 覆盖验收 |
|---|---|---|---|
| CCFG-DB-002 | `CDC_CLIENT_MULTIPLE.CLIENT_ID`（主键 `VARCHAR2(32)`）：可新增、可修改、按原探针 ID 定位与删除；应用层执行 ASCII 大小写不敏感唯一（编辑按 `originalClientId` 排除自身）。Oracle 主键只保证精确值唯一，不作为大小写不敏感唯一约束。 | CCFG-REQ-037、CCFG-REQ-038、CCFG-REQ-048 | CCFG-AC-029、CCFG-AC-030、CCFG-AC-039 |
| CCFG-DB-003 | `CLIENT_DESC`（R1-03）：物理可空，目标规则为“去除首尾空白后非空即必填”；Trim 结果只用于判空、不覆盖不替换请求中的原始最终文本；UTF-8 字节数 `<=1024`（`VARCHAR2(1024 BYTE)` 语义）按**实际保存的原始最终文本（含首尾空白）**计算。保存只写入用户最终提交的原始描述文本，不自动删除首尾空白、不改写内部字符；后端做必填（Trim 判空）/原文字节校验，不重新生成。读取侧对历史 NULL/空白值原样保留 `NULL`（不自动写回空串），列表/编辑按 DESIGN/UI 的占位与空输入映射展示。 | CCFG-REQ-039、CCFG-REQ-059 | CCFG-AC-033 |
| CCFG-DB-004 | `DATA_SOURCE_ID`（`VARCHAR2(1000)`）：至少 1 个规范化数据源；按 CSV 解析/规范序列化（去重、保序、单逗号无空格）；序列化结果按 BYTE 校验不超过物理 `VARCHAR2(1000)`；跨记录占用比较用精确规范化 token（不折叠大小写）。 | CCFG-REQ-040、CCFG-REQ-010 | CCFG-AC-034、CCFG-AC-014 |
| CCFG-DB-005 | `FG_ACTIVE`（`VARCHAR2(1)`）：新增固定写 `1`；编辑表单不写该字段；启用/停用经独立 UPDATE 分别置 `1`/`0`；非 `0/1` 历史异常值原样保留并展示原始值（仅删除/停用/先停用再启用可处理）。 | CCFG-REQ-041、CCFG-REQ-030、CCFG-REQ-031、CCFG-REQ-033、CCFG-REQ-034 | CCFG-AC-031、CCFG-AC-023、CCFG-AC-024、CCFG-AC-025、CCFG-AC-026 |
| CCFG-DB-006 | `CDC_DATA_SOURCE` 仅作只读安全字段来源：允许读取/映射 `DATA_SOURCE_ID`、`DATA_SOURCE_ORG`、`DATA_SOURCE_NAME`、`DATA_SOURCE_TYPE`、`DATA_SOURCE_CATEGORY`、`FG_ACTIVE`；禁止读取、传输、返回 `DATA_SOURCE_PASSWORD` 及无关连接信息。 | CCFG-REQ-061、CCFG-REQ-087 | CCFG-AC-049、CCFG-AC-073 |
| CCFG-DB-007 | 两表无物理外键、无唯一约束、无规范化关联表；探针 ID 大小写不敏感唯一与“一个数据源只分配给一个探针”均为应用层业务规则，依托目标 DML 前全表重读与当次尽力写前检查实现（见 §4/§5），不依托任何表锁，也无物理强一致唯一约束，不新增任何 DDL 对象。 | CCFG-REQ-068、CCFG-REQ-090 | CCFG-AC-056、CCFG-AC-076 |

## 4. SQL 逻辑形态（全部参数化绑定，禁止 `${}`/动态表名/拼接用户输入）

| 设计编号 | 设计决定 | 覆盖需求 | 覆盖验收 |
|---|---|---|---|
| CCFG-DB-008 | 列表读取：条件由 Mapper `<if>` 按绑定参数拼接，不拼接用户文本；无关键词且状态为 `ALL` 时为全表读取；关键字条件使用 `LOWER(CLIENT_ID)`/`LOWER(CLIENT_DESC)` `LIKE`（统一小写实现不区分大小写字面量包含，R1-04：应用层先把 Trim 后关键词中的 `\`、`%`、`_` 依次转义为字面量，Mapper 用绑定参数形成 `%{escapedKeyword}%` 并带 `ESCAPE '\'`，详见 CCFG-DB-021，禁止 `${}`）；排序固定 `ORDER BY CLIENT_ID DESC`。候选/映射读取：`SELECT DATA_SOURCE_ID, DATA_SOURCE_ORG, DATA_SOURCE_NAME, DATA_SOURCE_TYPE, DATA_SOURCE_CATEGORY, FG_ACTIVE FROM CDC_DATA_SOURCE`（无密码列，类别/类型列供历史资格变化与候选判定，见 CCFG-DB-022），候选附加 `WHERE FG_ACTIVE='1' AND UPPER(DATA_SOURCE_CATEGORY)='SOURCE' AND UPPER(DATA_SOURCE_TYPE)='ORACLE'`；列表侧另以一次只读查询取得“全部已知含英文逗号的数据源 ID 集合”供歧义判定。 | CCFG-REQ-002、CCFG-REQ-005、CCFG-REQ-006、CCFG-REQ-010、CCFG-REQ-061 | CCFG-AC-002、CCFG-AC-004、CCFG-AC-005、CCFG-AC-014、CCFG-AC-049 |
| CCFG-DB-009 | 显式表锁与专用锁超时边界（禁止项）：本 Feature 不执行 `LOCK TABLE CDC_CLIENT_MULTIPLE IN EXCLUSIVE MODE WAIT 5`，不为探针 ID/数据源唯一性主动加任何显式表锁，也不产生 `ORA-30006 → 50050 LOCK_WAIT_TIMEOUT` 专用锁等待超时路径（`50050` 已从错误码表删除，见 API.md）。代码中禁止新增或调用 `LOCK TABLE`、`SELECT ... FOR UPDATE` 锁行方案或 `DBMS_LOCK`；Oracle 普通 DML 自身的行锁/TM 锁属数据库固有行为，按既有全局异常边界处理，不被写成业务唯一性保证。 | CCFG-REQ-077、CCFG-REQ-085 | CCFG-AC-064、CCFG-AC-071 |
| CCFG-DB-010 | DML 前全量检查读取（目标 DML 前在同一普通短事务内执行，供应用层做 ID 大小写不敏感唯一与数据源占用映射）：`SELECT CLIENT_ID, DATA_SOURCE_ID, FG_ACTIVE FROM CDC_CLIENT_MULTIPLE`（无过滤全量，或按需 `ORDER BY CLIENT_ID`）；应用层对读取结果构建占用映射并判定；编辑按 `originalClientId` 自排除。该读取是普通一致性读，不阻止其他会话写入；检查结果只代表读取瞬间，不构成跨请求强一致唯一保证（见 CCFG-DB-017）。 | CCFG-REQ-038、CCFG-REQ-068、CCFG-REQ-069、CCFG-REQ-070、CCFG-REQ-084 | CCFG-AC-030、CCFG-AC-056、CCFG-AC-057、CCFG-AC-070 |
| CCFG-DB-011 | 新增写入：`INSERT INTO CDC_CLIENT_MULTIPLE (CLIENT_ID, CLIENT_DESC, DATA_SOURCE_ID, FG_ACTIVE) VALUES (#{clientId}, #{clientDesc}, #{dataSourceIds}, '1')`；`dataSourceIds` 为规范化序列化后的单字符串。 | CCFG-REQ-041 | CCFG-AC-031 |
| CCFG-DB-012 | 编辑写入（按原探针 ID 定位并原子更新 ID/描述/数据源）：`UPDATE CDC_CLIENT_MULTIPLE SET CLIENT_ID = #{clientId}, CLIENT_DESC = #{clientDesc}, DATA_SOURCE_ID = #{dataSourceIds} WHERE CLIENT_ID = #{originalClientId}`。 | CCFG-REQ-048、CCFG-REQ-049、CCFG-REQ-073 | CCFG-AC-039、CCFG-AC-040、CCFG-AC-060 |
| CCFG-DB-013 | 删除写入：`DELETE FROM CDC_CLIENT_MULTIPLE WHERE CLIENT_ID = #{clientId}`；不做任何关联表检查。 | CCFG-REQ-026、CCFG-REQ-027 | CCFG-AC-020、CCFG-AC-021 |
| CCFG-DB-014 | 启用/停用写入：启用 `UPDATE CDC_CLIENT_MULTIPLE SET FG_ACTIVE = '1' WHERE CLIENT_ID = #{clientId}`；停用 `UPDATE CDC_CLIENT_MULTIPLE SET FG_ACTIVE = '0' WHERE CLIENT_ID = #{clientId}`。 | CCFG-REQ-030、CCFG-REQ-031 | CCFG-AC-023、CCFG-AC-024 |
| CCFG-DB-015 | 行数校验：新增/编辑/删除/启停 Mapper 均返回受影响行数，业务层断言等于 1；不等于 1（如记录不存在）时映射 `40440`（编辑/删除/启停定位失败）或 `50051/50052`，且不产生部分写入。 | CCFG-REQ-049、CCFG-REQ-074 | CCFG-AC-040、CCFG-AC-061 |
| CCFG-DB-021 | 关键词字面量 LIKE 转义（R1-04，逻辑 SQL）：Mapper 对列表关键词采用 `(LOWER(CLIENT_ID) LIKE #{kwId} ESCAPE '\' OR LOWER(CLIENT_DESC) LIKE #{kwDesc} ESCAPE '\')`，其中 `#{kwId}`/`#{kwDesc}` 由应用层对 Trim 后关键词依次转义（`\`→`\\`、`%`→`\%`、`_`→`\_`）后包裹为 `%{escaped}%` 的绑定参数；`\`、`%`、`_` 均按普通字符参与不区分大小写字面量包含匹配，通配符不生效。全程绑定参数，禁止 `${}`、动态表名或字符串拼接用户输入；未来测试须覆盖关键词自身含 `%`/`_`/`\` 的匹配。 | CCFG-REQ-006 | CCFG-AC-005 |
| CCFG-DB-022 | 历史异常资格与歧义判定读取（R1-06/R1-07/R1-08，逻辑 SQL）：列表/映射读取的 `CDC_DATA_SOURCE` 安全字段含 `DATA_SOURCE_CATEGORY`/`DATA_SOURCE_TYPE`/`FG_ACTIVE`，供应用层判定已选 token 的 `NOT_FOUND`/`INACTIVE`/`CATEGORY_MISMATCH`/`TYPE_MISMATCH` 与候选范围；另以一次只读查询取得“全部 ID 含英文逗号的已知数据源 ID 集合”，应用层按完整连续文本与 CSV 边界对每行原始 `DATA_SOURCE_ID` 做可能匹配，判定行级 `COMMA_PROTOCOL_AMBIGUOUS` 并填充 `possibleCommaDataSourceIds`；每行原始 `DATA_SOURCE_ID` 与 `CLIENT_DESC` 按数据库值原样读取（含首尾空白；`CLIENT_DESC` 允许为 `NULL`），读取层不 Trim、不改写。全部读取不加写锁、不取表锁（Oracle 一致性读）。 | CCFG-REQ-010、CCFG-REQ-061、CCFG-REQ-064、CCFG-REQ-078、CCFG-REQ-080、CCFG-REQ-084 | CCFG-AC-049、CCFG-AC-052、CCFG-AC-065、CCFG-AC-067、CCFG-AC-070 |

## 5. 事务与并发边界矩阵

| 操作 | 普通事务 | DML 前全量重读 | 当次检查 | DML 写入 | 并发边界 |
|---|---|---|---|---|---|
| 新增（E3） | 是 | 是 | 探针 ID ASCII 大小写不敏感唯一；全部数据源唯一分配且可用 | `INSERT`（`CLIENT_ID/CLIENT_DESC/DATA_SOURCE_ID/FG_ACTIVE='1'`） | 接受竞态（检查后他笔可能先写入成功） |
| 编辑（E4） | 是 | 是 | 原记录存在（按 `originalClientId`）；新 ID 格式+唯一（自排除原 ID）；数据源唯一+可用（自排除原 ID） | `UPDATE`（`CLIENT_ID/CLIENT_DESC/DATA_SOURCE_ID` 一次原子更新） | 接受竞态 |
| 启用（E6） | 是 | 是 | 原记录/状态（非 `0/1` 拒）；数据源重复分配（仅此阻断） | `UPDATE FG_ACTIVE='1'` | 接受竞态 |
| 停用（E7） | 是（短） | 否 | 目标记录存在 | `UPDATE FG_ACTIVE='0'` | 普通 DML |
| 删除（E5） | 是（短） | 否 | 无（不做关联检查） | 物理 `DELETE` 该行 | 普通 DML |
| 列表/候选读取（E1/E2） | 否（只读调用） | 不适用 | 展示/占用快照 | 无 | 结果可能随后变旧 |

> 各写操作行数必须为 1；请求内校验失败、业务冲突、更新行数异常或任一步失败均整笔回滚，不产生部分写入（见 CCFG-DB-015/016 与 DESIGN.md `CCFG-DESIGN-022`）。本 Feature 不主动执行显式表锁，矩阵无锁获取顺序与锁等待超时分支（`WAIT 5`/`ORA-30006 → 50050` 已删除）。

| 设计编号 | 设计决定 | 覆盖需求 | 覆盖验收 |
|---|---|---|---|
| CCFG-DB-016 | 事务与并发边界矩阵如上：新增/编辑/启用为“普通短事务 + DML 前全量重读 + 当次尽力写前检查 + DML”，不获取表锁、不存在锁等待超时分支；停用/删除为不重读全表的普通短事务写；列表/候选为不加写互斥锁的只读。写操作行数必须为 1，任一步失败整笔回滚，保证整体成功/整体失败、不产生部分写入。DML 前重读与 DML 之间允许竞态窗口，极端并发可能两笔都成功（已接受边界，见 CCFG-DB-017 与 DESIGN.md §7）。 | CCFG-REQ-049、CCFG-REQ-072、CCFG-REQ-074、CCFG-REQ-077 | CCFG-AC-040、CCFG-AC-059、CCFG-AC-061、CCFG-AC-064 |
| CCFG-DB-017 | Oracle 一致性读与竞态边界：普通 `SELECT`（一致性读，经 undo 不取 `TM` 锁）不取行锁/TM 锁；写前检查的重读同样采用普通一致性读，因此查询快照建立之后其他事务可能先提交，检查结果只代表读取瞬间，不构成跨请求强一致唯一保证。本 Feature 不主动执行显式表锁，不存在 `LOCK TABLE ... WAIT 5`/`ORA-30006 → 50050` 路径；Oracle 普通 `INSERT`/`UPDATE`/`DELETE` 自身的行锁/TM 锁属数据库固有行为，不等于应用层主动设计的表级并发保护，也不得写成唯一性强保证。极端并发下检查与 DML 之间可能插入其他成功写入（“先查后写”竞态），属已接受边界。 | CCFG-REQ-077、CCFG-REQ-090 | CCFG-AC-064、CCFG-AC-076 |

## 6. 性能前提与 DDL 边界

| 设计编号 | 设计决定 | 覆盖需求 | 覆盖验收 |
|---|---|---|---|
| CCFG-DB-018 | 已批准数据库基线记录“`CDC_CLIENT_MULTIPLE` 当前业务模型下记录总数不超过 20 条”为既有事实（`CONFIRMED_HARD_LIMIT`），不等于页面新增业务上限；本 Feature 不设探针数/数据源数业务硬上限（字段物理容量仍校验）。设计前提：小表全量读 + 普通短事务 + DML 前当次重读检查的开销可接受；不再把“短事务表锁串行写入”作为设计前提，也不引入显式锁、分布式锁或额外基础设施。无 N+1（一次读客户表 + 一次读数据源表）。不新增索引、外键、唯一约束、触发器、序列、关联表或迁移脚本；`DDL_STATUS=NONE`。 | CCFG-REQ-004、CCFG-REQ-090 | CCFG-AC-003、CCFG-AC-076 |
| CCFG-DB-019 | 本设计任务的数据库访问授权状态为 `NOT_RUN_NOT_AUTHORIZED`：不连接 Oracle、不查询、不构造数据、不执行 `INSERT/UPDATE/DELETE/MERGE/DDL`；`DML_STATUS=NONE`。历史异常数据（停用/不存在/含逗号/重复分配/非 `0/1` 状态）由正式验收阶段在获批的只读取证环境中核验，本任务不构造也不改动。 | CCFG-REQ-088、CCFG-REQ-089 | CCFG-AC-074、CCFG-AC-075 |
| CCFG-DB-020 | 本 Feature 数据库侧不引入任何通知或联动 `sync-client` 的机制：不创建触发器、存储过程、作业、队列或日志表；`FG_ACTIVE` 仅为普通数据列，由 `sync-client` 自行按 `FG_ACTIVE='1'` 匹配读取，本平台写库成功即结束。页面反馈只表述配置已保存，不声称已实时作用于运行中的进程；该边界由正式验收在获批的只读取证环境中以“对象集比对 + 提示文案检查”核验。 | CCFG-REQ-090 | CCFG-AC-076 |

## 7. 关联矩阵

- 逐字段/逐 SQL/逐事务行的“覆盖需求/覆盖验收”已在上方各设计编号表内给出；完整 REQ→设计项、AC→设计项总矩阵见 `DESIGN.md` §12（本文件设计项以其 `CCFG-DB-*` 编号出现并被纳入总矩阵，保证 90/90 需求、76/76 验收可追踪）。
- 本文件所有 `CCFG-DB-*` 编号在其表内均有唯一一行，引用可解析。
- 本文件描述的所有 SQL 均为“逻辑形态”，全部使用绑定参数（`#{}`），不使用 `${}`、动态表名或用户输入拼接。

## 8. 变更记录

| 日期 | 变更 | 依据 |
|---|---|---|
| 2026-09-03 | 新建 `docs/features/client-config/DATABASE.md`：事实分层、字段使用矩阵、参数化 SQL 逻辑形态、事务与锁矩阵、性能前提与 DDL 边界（`CCFG-DB-001~020`），文档状态 `DRAFT_PENDING_USER_REVIEW`，`PENDING_USER_CONFIRMATION=0`；`DDL_STATUS=NONE`、`DATABASE_ACCESS=NOT_RUN_NOT_AUTHORIZED`、`DML=NONE`，不改写 `docs/database/` | CLIENT-CONFIG-DESIGN-BASELINE-001（阶段 4 设计基线；纯文档任务，未连接数据库、未执行 DDL/DML） |
| 2026-09-04 | R1 定向修订（数据库设计编号扩为 `CCFG-DB-001~022`，共 22 条，仍连续唯一）：`CCFG-DB-003` 固定 `CLIENT_DESC` 原文保存/Trim 仅判空/按原文计字节并保留历史 NULL（R1-03）；`CCFG-DB-008` 列表关键词改字面量包含并读取类别/类型/含逗号集合（R1-04/R1-06/R1-07）；新增 `CCFG-DB-021`（LIKE 转义 `ESCAPE '\'`）、`CCFG-DB-022`（历史资格/歧义判定与 `CLIENT_DESC`/`DATA_SOURCE_ID` 原样读取）。文档状态保持 `DRAFT_PENDING_USER_REVIEW`，`PENDING_USER_CONFIRMATION=0`；`DDL_STATUS=NONE`、`DATABASE_ACCESS=NOT_RUN_NOT_AUTHORIZED`、`DML=NONE`，不改写 `docs/database/` | CLIENT-CONFIG-DESIGN-BASELINE-001-R1（正式复审 `CHANGES_REQUIRED` 定向修订；纯文档任务，未连接数据库、未执行 DDL/DML） |
| 2026-09-04 | 并发口径定向调整（`CLIENT-CONFIG-DESIGN-CONCURRENCY-ADJUSTMENT-001`，纯文档）：`CCFG-DB-007` 应用层唯一规则改依托 DML 前全量重读 + 当次检查、不依托表锁/物理强一致唯一约束；`CCFG-DB-009` 由定义 `LOCK TABLE CDC_CLIENT_MULTIPLE IN EXCLUSIVE MODE WAIT 5` SQL 改为显式禁止主动表锁/`SELECT ... FOR UPDATE`/`DBMS_LOCK` 与专用锁超时路径的边界；`CCFG-DB-010` 改“DML 前全量检查读取”（普通一致性读）；§5 标题与事务矩阵改“事务与并发边界矩阵”，删除锁获取顺序/`WAIT 5`/超时分支；`CCFG-DB-016/017/018` 改写普通短事务、Oracle 一致性读竞态边界与小表开销前提。`ORA-30006→50050` 已删除（见 API.md）。文档状态保持 `DRAFT_PENDING_USER_REVIEW`，`PENDING_USER_CONFIRMATION=0`；`DDL_STATUS=NONE`、`DATABASE_ACCESS=NOT_RUN_NOT_AUTHORIZED`、`DML=NONE`，不改写 `docs/database/` | CLIENT-CONFIG-DESIGN-CONCURRENCY-ADJUSTMENT-001（设计草案并发口径定向调整；纯文档任务，未连接数据库、未执行 DDL/DML） |
