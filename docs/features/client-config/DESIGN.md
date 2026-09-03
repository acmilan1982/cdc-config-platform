# 探针端管理 Feature 逻辑设计（DESIGN）

## 1. 元数据与文档状态

| 项目 | 值 |
|---|---|
| Feature 中文名称 | 探针端管理（页面与菜单最终统一使用的用户可见名称；本 Feature 内部目录标识仍为 `client-config`，既有路由 `/config/client` 保持不变） |
| Feature 标识 | `client-config` |
| 既有路由 | `/config/client`（保持不变） |
| 目标文档 | `docs/features/client-config/DESIGN.md` |
| 文档状态 | `DRAFT_PENDING_USER_REVIEW`（设计草案，尚未经 ChatGPT 正式复审与项目负责人批准；不得写成已批准基线） |
| 实现状态 | `NOT_STARTED`（本设计只落盘目标逻辑方案，不代表任何代码、页面或接口已经实现） |
| 任务编号 | `CLIENT-CONFIG-DESIGN-BASELINE-001`（阶段 4 设计基线，纯文档） |
| 依据需求 | `REQUIREMENTS.md`：`CCFG-REQ-001~090`，文档状态 `APPROVED` |
| 依据验收 | `ACCEPTANCE.md`：`CCFG-AC-001~076`，全部 `NOT_RUN`，文档状态 `APPROVED`（批准的是验收标准，不是验收执行结果） |
| 基线提交 | `cecfdd5478df8b82ba39c083553ea8dd7ead48e8`（本任务开始前 `origin/develop` 与本地 HEAD 一致的实际起点） |
| 创建日期 | 2026-09-03 |
| 设计编号 | `CCFG-DESIGN-001 ~ CCFG-DESIGN-034`，连续、唯一、不可复用 |
| PENDING_USER_CONFIRMATION | `0`（本设计不存在由已批准需求无法推导、必须由项目负责人另行决定的业务或用户可见语义；如正式复审发现须确认项，应在复审结论中标出） |
| 配套文档 | `API.md`（`CCFG-API-*`）、`UI.md`（`CCFG-UI-*`）、`DATABASE.md`（`CCFG-DB-*`），与本文件状态相同，接口路径、字段名、状态值、错误码、事务边界与本文件一致 |

## 2. 范围与状态边界

- 本设计只建立逻辑设计草案，不实现代码，不执行测试，不连接数据库，不修改任何数据库基线（`docs/database/` 零改动），不执行 DDL/DML。
- 已批准需求 `CCFG-REQ-001~090` 是唯一业务语义来源。本设计不增加、弱化、替换或重新解释任何需求；对本 Feature 无法从需求推导的技术空档给出唯一确定方案，不保留“方案 A/B 待定”。
- 本 Feature 只维护 `CDC_CLIENT_MULTIPLE` 配置，不直接启停、重启或通知 `sync-client`；不操作 ZooKeeper、Kafka、Topic 或运行进程；不连接源 Oracle 数据源、不读取 Schema/表结构。
- 接口、页面反馈不得承诺配置对运行中进程“实时生效”“已启停”“已重启”。
- 所有候选代码类名、文件名均为实现阶段建议（标注“待建”），本任务不创建、不宣称已存在。

## 3. 分层结构与代码组织（候选方案）

### 3.1 总体分层

| 设计编号 | 设计决定 | 覆盖需求 | 覆盖验收 |
|---|---|---|---|
| CCFG-DESIGN-001 | 后端使用独立垂直包 `com.bsoft.cdcconfig.clientconfig`，与故障监控、数据源、订阅等其他模块隔离。Controller 只做协议接入与基础绑定；Service 承担业务校验、历史异常判定、事务与表级锁编排；Mapper 只负责参数化 SQL；DTO/Query/VO/Converter/ErrorCode/Helper 各司其职。前端建立独立 `api`、`types`、正式页面与必要的局部组件/工具。 | CCFG-REQ-085、CCFG-REQ-087、CCFG-REQ-090 | CCFG-AC-071、CCFG-AC-073、CCFG-AC-076 |
| CCFG-DESIGN-002 | 后端候选类（实现阶段待建，不创建）：`com.bsoft.cdcconfig.clientconfig.controller.ClientConfigController`；`service.ClientConfigService`（接口）与 `service.impl.ClientConfigServiceImpl`；`mapper.CdcClientConfigMapper`（`extends BaseMapper<CdcClientConfig>`，映射 `CDC_CLIENT_MULTIPLE`）；`entity.CdcClientConfig`（本 Feature 自己的写实体）；`model/dto` 请求与 `model/vo` 响应、`model/query` 查询条件、`converter` 转换器；`enums.ClientConfigErrorCode`（错误码，见 API.md）；`helper` 数据源 CSV 与 UTF-8 字节工具。命名避开既有 `monitor/topicoffset/mapper/ClientConfigMapper` 与 `monitor/jobfailure` 的 `CdcClientMultiple`/`CdcClientMultipleMapper`（均为故障监控只读模型），避免 `@MapperScan` 下 Spring Bean 名冲突与跨 Feature 复用。 | CCFG-REQ-090 | CCFG-AC-076 |
| CCFG-DESIGN-003 | 前端候选：路由 `/config/client` 指向正式页面 `frontend/src/views/client-config/ClientConfigPage.vue`（替换现占位页，占位页仅作既有实现保留），`meta.title` 与菜单 `frontend/src/config/menu.ts` 中该项标题、面包屑统一为“探针端管理”（实现阶段一并收口 BI-CFG-001）；`frontend/src/api/clientConfig.ts`、`frontend/src/types/clientConfig.ts`、局部组件（如编辑弹窗、数据源紧凑标签组件）与局部工具（CSV/UTF-8 字节），均待实现阶段建立。 | CCFG-REQ-001 | CCFG-AC-001 |
| CCFG-DESIGN-004 | 本 Feature 新建自己的 `CdcClientConfig`/`CdcClientConfigMapper` 读写模型，不复用、不修改故障监控模块 `monitor/jobfailure` 中对 `CDC_CLIENT_MULTIPLE` 的只读消费模型（`CdcClientMultiple`/`CdcClientMultipleMapper`），避免跨 Feature 耦合；既有只读消费模块保持原样。 | CCFG-REQ-090 | CCFG-AC-076 |

### 3.2 约束

- 不修改任何既有 Entity、Mapper、Service、Controller、错误码；不在本 Feature 之外新增公共类。
- 若发现既有可复用 CSV/字节工具与批准需求口径一致则复用，否则在本 Feature 内新建独立 Helper（见 §5、§8），不在本设计阶段创建。

## 4. 查询与展示数据流

| 设计编号 | 设计决定 | 覆盖需求 | 覆盖验收 |
|---|---|---|---|
| CCFG-DESIGN-005 | 固定“小表全量读取 + 内存装配”：一次读取符合查询条件的 `CDC_CLIENT_MULTIPLE` 全部行（仅查询过滤为关键词/状态时先过滤，否则为全表），默认按 `CLIENT_ID` 字符串降序；一次读取 `CDC_DATA_SOURCE` 安全字段子集用于名称映射与异常判定；在内存完成解析、去重、占用映射与异常装配，不做逐行 N+1 查询；数据源行视图随列表一次返回。无分页、无缓存。 | CCFG-REQ-002、CCFG-REQ-003、CCFG-REQ-004、CCFG-REQ-005、CCFG-REQ-078 | CCFG-AC-002、CCFG-AC-003、CCFG-AC-004、CCFG-AC-065 |
| CCFG-DESIGN-006 | 状态分类固定为：`fgActive='1'` → `ENABLED`；`fgActive='0'` → `DISABLED`；其余原始值 → `ABNORMAL`（必须携带原始 `fgActive` 字符串）。状态筛选语义：`ALL` 含任意原始值；`ENABLED` 只匹配 `FG_ACTIVE='1'`；`DISABLED` 只匹配 `FG_ACTIVE='0'`；非 `0/1` 历史异常值只出现在“全部”结果中，不被单独筛出。 | CCFG-REQ-002、CCFG-REQ-006、CCFG-REQ-033 | CCFG-AC-002、CCFG-AC-005、CCFG-AC-025 |
| CCFG-DESIGN-007 | 关键词为空时不作关键词过滤；关键词非空时对探针 ID 与探针描述执行不区分大小写的包含匹配（统一转小写后 `contains`），不比较大小写敏感性差异。 | CCFG-REQ-006 | CCFG-AC-005 |
| CCFG-DESIGN-008 | 数据源映射与候选项只读取安全字段：`DATA_SOURCE_ID`、`DATA_SOURCE_ORG`、`DATA_SOURCE_NAME`、`DATA_SOURCE_TYPE`、`DATA_SOURCE_CATEGORY`、`FG_ACTIVE`。任何层不得读取、传输或返回 `DATA_SOURCE_PASSWORD` 及本页面不需要的连接串、主机、用户名、服务名等字段。 | CCFG-REQ-087 | CCFG-AC-073 |
| CCFG-DESIGN-009 | 列表与候选接口不提供分页参数、不分页、不提供“加载更多”、不做自动刷新；页面不为探针数或数据源数设业务上限（物理字段容量边界仍按 §5/§8 校验）。 | CCFG-REQ-003、CCFG-REQ-004 | CCFG-AC-003 |

## 5. 多值协议与异常模型

| 设计编号 | 设计决定 | 覆盖需求 | 覆盖验收 |
|---|---|---|---|
| CCFG-DESIGN-010 | 统一 CSV 协议（与批准需求 §6 一致）：读取时按单个英文逗号（`,`）拆分、每项去除首尾空白、忽略空项；空/仅空白/仅空项序列 → 无数据源。写入时对最终选定的数据源 ID 去除首尾空白、忽略空项、按规范化结果去重（同一行内）、保持用户选择顺序，用单个英文逗号连接且逗号前后不加空格。数据源 ID 不做大小写折叠（其为 `CDC_DATA_SOURCE` 物理主键的精确引用，仅 Trim），跨记录占用比较也使用精确规范化 token；探针 ID 的大小写不敏感唯一性另见 §6/§7，两者口径不同、不得混用。 | CCFG-REQ-010、CCFG-REQ-040 | CCFG-AC-014、CCFG-AC-034 |
| CCFG-DESIGN-011 | 定义跨前后端一致的数据源异常原因枚举（稳定字符串），至少含：`INACTIVE`（对应数据源停用，`FG_ACTIVE!='1'`）、`NOT_FOUND`（不在 `CDC_DATA_SOURCE`）、`COMMA_IN_ID`（原始存储值整体等于某含逗号的数据源 ID，无法按 CSV 拆分）、`DUPLICATE_IN_ROW`（同一行内存在 Trim 后重复的 token）、`ASSIGNED_TO_MULTIPLE_CLIENTS`（与另一条探针记录重复分配）。前端的展示文案由 UI.md 映射；VO 传稳定枚举串，不在接口层做本地化拼接。 | CCFG-REQ-017、CCFG-REQ-019、CCFG-REQ-079、CCFG-REQ-080 | CCFG-AC-013、CCFG-AC-015、CCFG-AC-066、CCFG-AC-067 |
| CCFG-DESIGN-012 | 同一行历史重复 ID 的展示与计数统一为“按 Trim 后不同 ID 去重”，并把“原配置含重复 token”记录为 `DUPLICATE_IN_ROW` 异常事实。计数列 = 去重后的非空 token 数；标签/清单按去重后的项展示。展示去重与计数使用同一口径（满足 `CCFG-REQ-019`），不另造第二口径。 | CCFG-REQ-018、CCFG-REQ-019 | CCFG-AC-015 |
| CCFG-DESIGN-013 | 跨记录占用映射：对所有读取的行（含 `FG_ACTIVE=0` 与非 `0/1` 异常状态行）按规范化 token 建立“token → 占用该 token 的探针 ID 列表”，供唯一分配判定、候选占用标注与列表冲突提示使用；同一数据源被多条探针占用时保留全部冲突探针 ID，不隐藏任何一个。停用/异常状态行同样参与占用映射（停用不释放数据源）。 | CCFG-REQ-068、CCFG-REQ-069、CCFG-REQ-070、CCFG-REQ-075、CCFG-REQ-076 | CCFG-AC-056、CCFG-AC-057、CCFG-AC-062、CCFG-AC-063 |
| CCFG-DESIGN-014 | 展示投影与写回边界：直接显示前三项使用“异常项优先、组内保持原存储顺序”的稳定投影；`+N` Popover 与编辑回显展示规范化后的完整清单（保持去重后的原顺序）。列表查询仅做“展示投影”，绝不修改数据库中的原始 `DATA_SOURCE_ID` 内容（展示去重 ≠ 写回修复），本 Feature 不自动清理或修复历史异常数据。显示排序/投影不改变保存时的选择顺序或数据库内容。 | CCFG-REQ-017、CCFG-REQ-019、CCFG-REQ-078、CCFG-REQ-084 | CCFG-AC-013、CCFG-AC-015、CCFG-AC-065、CCFG-AC-070 |
| CCFG-DESIGN-015 | 机构映射缺省策略：数据源 ID 能在安全字段集中命中时，视图携带 `org`、`dataSourceName`；无法命中（如 `NOT_FOUND`）时 `org`/`dataSourceName` 允许为 `null`，前端仍须显示原始数据源 ID 与异常原因，不得因缺名而丢弃该异常项。`DATA_SOURCE_ORG` 为空的历史记录同样按“无法取得机构名称”处理。 | CCFG-REQ-080、CCFG-REQ-012 | CCFG-AC-067、CCFG-AC-009 |

## 6. 新增、编辑、删除与启停流程

| 设计编号 | 设计决定 | 覆盖需求 | 覆盖验收 |
|---|---|---|---|
| CCFG-DESIGN-016 | 新增流程（E3）：校验请求（探针 ID 格式/唯一性前置、描述、数据源格式）→ 在单个短事务内先获取 `CDC_CLIENT_MULTIPLE` 表级互斥锁（见 §7）→ 在锁内重新读取全部行并权威校验探针 ID ASCII 大小写不敏感唯一、全部拟保存数据源唯一分配 → `INSERT`，`FG_ACTIVE` 固定写 `1`；行数必须为 1，否则回滚。新增表单不含状态字段。 | CCFG-REQ-041、CCFG-REQ-043 | CCFG-AC-031、CCFG-AC-030 |
| CCFG-DESIGN-017 | 编辑流程（E4）：请求同时携带 `originalClientId` 与最终 `clientId`；以 `originalClientId` 精确定位原记录（定位不到 → 探针不存在）；允许 `clientId` 修改；在同一个事务与同一把表级锁内，按最终 `clientId` 做格式与 ASCII 大小写不敏感唯一校验（按 `originalClientId` 排除自身，允许自身仅大小写调整且无其他冲突时保存并保留新大小写），按全部拟保存数据源做唯一分配校验（自排除同样按 `originalClientId`，杜绝把改后的新 ID 误当排除键），随后一次性原子 `UPDATE` 探针 ID、描述与数据源；更新行数必须为 1。编辑不级联处理其他表、进程、ZooKeeper/Kafka。 | CCFG-REQ-044~CCFG-REQ-048、CCFG-REQ-049、CCFG-REQ-066、CCFG-REQ-073 | CCFG-AC-038、CCFG-AC-039、CCFG-AC-040、CCFG-AC-054、CCFG-AC-060 |
| CCFG-DESIGN-018 | 删除流程（E5）：以探针 ID 定位，在短事务内直接物理 `DELETE` 该记录；不检查、不修改、不级联该探针与其他表/进程/ZooKeeper/Kafka 的关系；删除行数必须为 1，否则回滚并报“探针不存在或已删除”。删除成功后前端刷新列表并清空选中。 | CCFG-REQ-026、CCFG-REQ-027、CCFG-REQ-028 | CCFG-AC-020、CCFG-AC-021 |
| CCFG-DESIGN-019 | 停用流程（E7）：二次确认由前端负责；后端在短事务内仅把目标记录 `FG_ACTIVE` 更新为 `0`，行数必须为 1；历史数据源异常（停用/不存在/含逗号）不阻断停用。 | CCFG-REQ-030、CCFG-REQ-032、CCFG-REQ-035 | CCFG-AC-023、CCFG-AC-024、CCFG-AC-027 |
| CCFG-DESIGN-020 | 启用流程（E6）：一般不弹确认；后端在单个短事务内先获取表级互斥锁，在锁内重读目标记录并校验状态（非 `0/1` 直接拒绝，见 CCFG-DESIGN-021），执行与新增/编辑相同的全部数据源唯一分配校验；仅重复分配冲突阻断启用，其他数据源异常不阻断；成功后仅把 `FG_ACTIVE` 更新为 `1`，行数必须为 1。防止历史异常记录绕过新增/编辑规则。 | CCFG-REQ-031、CCFG-REQ-032、CCFG-REQ-035、CCFG-REQ-072 | CCFG-AC-022、CCFG-AC-024、CCFG-AC-027、CCFG-AC-059 |
| CCFG-DESIGN-021 | 非 `0/1` 状态边界：`fgActive` 非 `0/1` 的记录列表可见并显示原始状态值（`ABNORMAL`）；允许的操作仅限删除与停用（停用需二次确认并把 `FG_ACTIVE` 置 `0`）；接口层对这类记录的“启用”直接拒绝（错误码 `40240`）；状态列不提供“启用”操作；如需回到启用须先停用归 `0` 再启用（后者才触发唯一分配校验）。 | CCFG-REQ-033、CCFG-REQ-034 | CCFG-AC-025、CCFG-AC-026 |
| CCFG-DESIGN-022 | 写操作原子性与行数校验：新增/编辑/删除/启停均校验受影响行数必须等于 1，更新行数异常、唯一性冲突、锁等待超时或任意校验失败时整笔回滚，不存在部分写入；编辑保存整体成功或整体失败。 | CCFG-REQ-049、CCFG-REQ-074 | CCFG-AC-040、CCFG-AC-061 |

## 7. 并发与锁：确定方案

| 设计编号 | 设计决定 | 覆盖需求 | 覆盖验收 |
|---|---|---|---|
| CCFG-DESIGN-023 | 权威并发方案：对新增、编辑与启用，在同一个短事务内、在执行任何权威唯一性检查之前，先执行 Oracle 显式表级互斥锁，再获锁后在锁内重新读取 `CDC_CLIENT_MULTIPLE` 全部记录完成探针 ID ASCII 大小写不敏感唯一校验、数据源跨探针唯一分配校验（编辑按 `originalClientId` 排除自身），然后写入。逻辑 SQL 形态见 `DATABASE.md` §10.3/§10.4。 | CCFG-REQ-038、CCFG-REQ-043、CCFG-REQ-048、CCFG-REQ-071 | CCFG-AC-030、CCFG-AC-039、CCFG-AC-058 |
| CCFG-DESIGN-024 | 有限等待与错误映射固定为唯一值：`LOCK TABLE CDC_CLIENT_MULTIPLE IN EXCLUSIVE MODE WAIT 5`，等待上限 5 秒。理由：配置表写入频率极低、并发量小，5 秒足够覆盖人工节奏下的并发短事务；既避免无限等待导致请求挂死，又避免过短等待在正常并发下频繁误报。等待超时（`ORA-30006`）统一映射为错误码 `50050`（配置表繁忙，请稍后重试），整笔失败并回滚，不进入校验与写入。 | CCFG-REQ-085、CCFG-REQ-086 | CCFG-AC-071、CCFG-AC-072 |
| CCFG-DESIGN-025 | 明确为何以下方案都不足，必须以表级互斥锁为权威：① 仅前端禁选：可被绕过（直接调接口），且只覆盖“健康候选”，管不住历史脏数据与并发；② Java 进程内 `synchronized`/`ConcurrentHashMap`：只在本 JVM 内有效，多实例/重启后失效，数据库仍是最终权威；③ 普通“先查后写”：检查与写入之间存在竞态窗口，两请求可同时通过检查再同时写入，形成幻读式重复分配或大小写仅不同的重复 ID；④ 只锁已存在行的 `SELECT ... FOR UPDATE`：只能锁已存在行，无法阻止并发 `INSERT` 新行在检查后、写入前插入（幻影），亦无法对“尚不存在的目标新行”提供唯一性保证；要阻止“新增的行抢占 token/ID”，必须序列化整表写入，即表级互斥锁。 | CCFG-REQ-038、CCFG-REQ-068、CCFG-REQ-071、CCFG-REQ-077 | CCFG-AC-030、CCFG-AC-056、CCFG-AC-058、CCFG-AC-064 |
| CCFG-DESIGN-026 | 表锁适用前提与禁止项：表级互斥锁只服务本配置表的低频写入；普通列表/候选读取在事务外、不加锁，依赖 Oracle 一致性读不受影响（见 DATABASE.md）。不引入 `DBMS_LOCK`、分布式锁、Redis、独立锁表、唯一函数索引、规范化关联表或任何 DDL；唯一分配与 ID 唯一均为应用层业务规则。 | CCFG-REQ-090 | CCFG-AC-076 |
| CCFG-DESIGN-027 | 并发安全结论：两个请求并发新增或改成仅大小写不同的探针 ID 时最多一个成功；两个请求并发争抢同一数据源（两个新增、两个编辑、新增与编辑）时最多一个成功。两次写入都必须先竞争同一把表级互斥锁，后进入锁的请求在锁内重查时会看到先进入者已写入的结果而拒绝，从而保证结果收敛且不产生脏重复。 | CCFG-REQ-077 | CCFG-AC-064 |

## 8. UTF-8 BYTE 校验

| 设计编号 | 设计决定 | 覆盖需求 | 覆盖验收 |
|---|---|---|---|
| CCFG-DESIGN-028 | `CLIENT_DESC`：Trim 后必须非空；按真实 UTF-8 字节数必须 `<= 1024`（物理容量 `VARCHAR2(1024 BYTE)`）。后端用 `StandardCharsets.UTF_8`（`getBytes(UTF_8).length`）计算真实字节数作为最终防线；前端用等价 UTF-8 编码（`TextEncoder`）预校验，禁止用 JavaScript `.length`/字符数判断。纯 ASCII 1024 字符可过、1025 必须拒；中文按常见 3 字节/字、Emoji 等补充字符按 4 字节计。 | CCFG-REQ-039 | CCFG-AC-033 |
| CCFG-DESIGN-029 | `DATA_SOURCE_ID`：序列化结果（去重、顺序、单逗号连接的完整字符串）按数据库 BYTE 语义校验不超过物理 `VARCHAR2(1000)`；字节计算与 CCFG-DESIGN-028 同一工具。超限拒绝保存（错误码 `40105`），并保持“至少 1 个”约束独立成立。 | CCFG-REQ-040 | CCFG-AC-034 |
| CCFG-DESIGN-030 | “自动生成”描述必须在临时变量中完整生成并按必填（Trim 后非空）与 `<=1024 BYTE` 校验，校验通过后才原子替换输入框内容；任一已选数据源无法取得非空 `DATA_SOURCE_ORG`（此时明确指出该数据源 ID）、或结果去空白为空、或字节超限，则自动生成失败并给明确提示，保持原描述不变；不得静默截断。提交阶段后端仍按最终文本做必填/Trim/`1024 BYTE` 校验（CCFG-REQ-059），不重新生成、不比较其是否等于机构组合。 | CCFG-REQ-039、CCFG-REQ-059、CCFG-REQ-060 | CCFG-AC-033、CCFG-AC-048 |

## 9. 状态机与失败状态（页面级）

| 设计编号 | 设计决定 | 覆盖需求 | 覆盖验收 |
|---|---|---|---|
| CCFG-DESIGN-031 | 页面与操作状态机：页面加载（`LOADING` → `SUCCESS`/`EMPTY`/`FAILED`）；查询触发后回到加载；提交/删除/启停在按钮层进入 `SUBMITTING` 并禁用对应控件防重复提交，成功后刷新列表并复位；候选加载 `LOADING` → `SUCCESS`/`EMPTY`/`FAILED`。所有写操作都有加载、防重复提交与成功/失败反馈；无自动刷新。 | CCFG-REQ-007、CCFG-REQ-085 | CCFG-AC-006、CCFG-AC-071 |
| CCFG-DESIGN-032 | 生效边界与反馈约束：成功提示只表达“保存/删除/启用/停用成功”，不得声称“进程已停止/已启动/已重启”或“配置已实时生效”。后端不在写路径连接源库、不操作进程/ZK/Kafka。 | CCFG-REQ-090、CCFG-REQ-088、CCFG-REQ-089 | CCFG-AC-076、CCFG-AC-074、CCFG-AC-075 |

## 10. 测试设计（未来测试方案，本任务不执行）

| 设计编号 | 设计决定 | 覆盖需求 | 覆盖验收 |
|---|---|---|---|
| CCFG-DESIGN-033 | 未来后端/前端测试方案至少覆盖：CSV 解析/去重/序列化与异常判定；ASCII 大小写不敏感 ID 唯一性（含仅大小写修改自身）；UTF-8 1024 BYTE 边界（ASCII/中文/Emoji）；自动生成无选择严格无动作、失败不覆盖旧描述；CRUD、启停、异常历史回显、按原 ID 排除自身；并发争抢（两新增、两编辑、新增与编辑争 ID/数据源）；表级锁等待超时（`50050`）；Controller 契约与错误码。 | CCFG-REQ-085、CCFG-REQ-086 | CCFG-AC-071、CCFG-AC-072 |
| CCFG-DESIGN-034 | 契约与范围边界测试：断言接口与页面不返回密码等敏感字段；断言不存在分页、自动刷新、进程/ZK/Kafka 调用、源库连接、Schema/表读取与任何 DDL；断言页面反馈无“实时生效/已启停”措辞。 | CCFG-REQ-087、CCFG-REQ-088、CCFG-REQ-089、CCFG-REQ-090 | CCFG-AC-073、CCFG-AC-074、CCFG-AC-075、CCFG-AC-076 |

## 11. PENDING_USER_CONFIRMATION 记录

- 数量：`0`。
- 本设计全部用户可见语义与业务规则均可由已批准需求 `CCFG-REQ-001~090` 推导，未发现必须由项目负责人另行决定、且需求无法推导的业务或用户可见空档。

## 12. 追踪矩阵（设计项 → 需求/验收）

> 下列矩阵汇总四份设计文档（`DESIGN.md`/`API.md`/`UI.md`/`DATABASE.md`）对 90 条需求与 76 条验收的覆盖。逐文档的“设计项→需求/验收”列已在各文档对应表内给出；本表用于一次性核对 90/90 与 76/76 覆盖。

### 12.1 需求覆盖矩阵（REQ → 覆盖设计项）

| 需求编号 | 覆盖设计项 |
|---|---|
| CCFG-REQ-001 | UI-001、UI-002、CCFG-DESIGN-003 |
| CCFG-REQ-002 | CCFG-DESIGN-005、CCFG-DESIGN-006、API-002、UI-002 |
| CCFG-REQ-003 | CCFG-DESIGN-005、CCFG-DESIGN-009、API-002、API-009、UI-005 |
| CCFG-REQ-004 | CCFG-DESIGN-005、CCFG-DESIGN-009、CCFG-DB-018 |
| CCFG-REQ-005 | CCFG-DESIGN-005、CCFG-DB-008、API-002 |
| CCFG-REQ-006 | CCFG-DESIGN-006、CCFG-DESIGN-007、API-002、UI-003 |
| CCFG-REQ-007 | CCFG-DESIGN-031、UI-003、API-002 |
| CCFG-REQ-008 | UI-003 |
| CCFG-REQ-009 | UI-012、API-002、UI-002 |
| CCFG-REQ-010 | CCFG-DESIGN-010、CCFG-DB-004、CCFG-DB-008、API-010、API-011 |
| CCFG-REQ-011 | UI-005、API-009 |
| CCFG-REQ-012 | CCFG-DESIGN-015、UI-007、UI-008、API-009 |
| CCFG-REQ-013 | UI-007 |
| CCFG-REQ-014 | UI-007 |
| CCFG-REQ-015 | UI-008 |
| CCFG-REQ-016 | UI-009 |
| CCFG-REQ-017 | CCFG-DESIGN-011、CCFG-DESIGN-014、UI-010、API-009 |
| CCFG-REQ-018 | CCFG-DESIGN-012、UI-011 |
| CCFG-REQ-019 | CCFG-DESIGN-011、CCFG-DESIGN-012、CCFG-DESIGN-014、UI-011、API-009 |
| CCFG-REQ-020 | UI-005 |
| CCFG-REQ-021 | UI-004 |
| CCFG-REQ-022 | UI-004 |
| CCFG-REQ-023 | UI-004、UI-005 |
| CCFG-REQ-024 | UI-005 |
| CCFG-REQ-025 | UI-004、UI-019 |
| CCFG-REQ-026 | CCFG-DESIGN-018、CCFG-DB-013、API-006 |
| CCFG-REQ-027 | CCFG-DESIGN-018、CCFG-DESIGN-034、API-006 |
| CCFG-REQ-028 | CCFG-DESIGN-018、UI-005 |
| CCFG-REQ-029 | UI-006、API-009 |
| CCFG-REQ-030 | CCFG-DESIGN-019、CCFG-DB-014、API-008、UI-018 |
| CCFG-REQ-031 | CCFG-DESIGN-020、CCFG-DB-014、API-007、UI-018 |
| CCFG-REQ-032 | CCFG-DESIGN-019、CCFG-DESIGN-020、CCFG-DESIGN-032、API-007、API-008、UI-021 |
| CCFG-REQ-033 | CCFG-DESIGN-006、CCFG-DESIGN-021、UI-006、API-009 |
| CCFG-REQ-034 | CCFG-DESIGN-021、UI-006、API-007 |
| CCFG-REQ-035 | CCFG-DESIGN-019、CCFG-DESIGN-020、CCFG-DESIGN-021、UI-017、API-007、API-008 |
| CCFG-REQ-036 | UI-013、UI-014、API-010 |
| CCFG-REQ-037 | API-011、UI-013 |
| CCFG-REQ-038 | CCFG-DESIGN-016、CCFG-DESIGN-017、CCFG-DESIGN-023、CCFG-DESIGN-025、CCFG-DB-002、CCFG-DB-010、API-011 |
| CCFG-REQ-039 | CCFG-DESIGN-028、CCFG-DESIGN-030、CCFG-DB-003、API-011 |
| CCFG-REQ-040 | CCFG-DESIGN-010、CCFG-DESIGN-029、CCFG-DB-004、API-011 |
| CCFG-REQ-041 | CCFG-DESIGN-016、CCFG-DB-005、CCFG-DB-011、API-004、UI-013 |
| CCFG-REQ-042 | UI-014、API-010 |
| CCFG-REQ-043 | CCFG-DESIGN-016、CCFG-DESIGN-023、API-011 |
| CCFG-REQ-044 | UI-014、CCFG-DESIGN-017 |
| CCFG-REQ-045 | UI-014 |
| CCFG-REQ-046 | UI-014 |
| CCFG-REQ-047 | CCFG-DESIGN-017、API-005 |
| CCFG-REQ-048 | CCFG-DESIGN-017、CCFG-DESIGN-023、CCFG-DB-012、API-005、API-011 |
| CCFG-REQ-049 | CCFG-DESIGN-017、CCFG-DESIGN-022、CCFG-DB-016、API-005 |
| CCFG-REQ-050 | UI-015 |
| CCFG-REQ-051 | UI-015、API-010 |
| CCFG-REQ-052 | UI-015 |
| CCFG-REQ-053 | UI-015 |
| CCFG-REQ-054 | UI-015 |
| CCFG-REQ-055 | UI-015 |
| CCFG-REQ-056 | UI-015 |
| CCFG-REQ-057 | UI-015 |
| CCFG-REQ-058 | UI-015 |
| CCFG-REQ-059 | CCFG-DESIGN-030、CCFG-DB-003、API-011 |
| CCFG-REQ-060 | CCFG-DESIGN-030、UI-015 |
| CCFG-REQ-061 | API-003、CCFG-DESIGN-008、CCFG-DB-006、CCFG-DB-008 |
| CCFG-REQ-062 | UI-016、API-009 |
| CCFG-REQ-063 | UI-016、API-003 |
| CCFG-REQ-064 | UI-016、API-003 |
| CCFG-REQ-065 | UI-016、API-003 |
| CCFG-REQ-066 | CCFG-DESIGN-013、CCFG-DESIGN-017、UI-016、API-003 |
| CCFG-REQ-067 | UI-016、API-003 |
| CCFG-REQ-068 | CCFG-DESIGN-013、CCFG-DESIGN-023、CCFG-DB-007、CCFG-DB-010、API-011 |
| CCFG-REQ-069 | CCFG-DESIGN-013、CCFG-DB-010 |
| CCFG-REQ-070 | CCFG-DESIGN-013、CCFG-DB-010 |
| CCFG-REQ-071 | CCFG-DESIGN-023、CCFG-DESIGN-025、API-011 |
| CCFG-REQ-072 | CCFG-DESIGN-020、CCFG-DB-010、CCFG-DB-016、API-007 |
| CCFG-REQ-073 | CCFG-DESIGN-017、CCFG-DB-012 |
| CCFG-REQ-074 | CCFG-DESIGN-022、CCFG-DB-016、API-011 |
| CCFG-REQ-075 | CCFG-DESIGN-013、CCFG-DESIGN-011、API-012 |
| CCFG-REQ-076 | CCFG-DESIGN-013、API-012 |
| CCFG-REQ-077 | CCFG-DESIGN-023、CCFG-DESIGN-025、CCFG-DESIGN-027、CCFG-DB-016、CCFG-DB-017 |
| CCFG-REQ-078 | CCFG-DESIGN-005、CCFG-DESIGN-014、API-002、UI-010 |
| CCFG-REQ-079 | CCFG-DESIGN-011、CCFG-DESIGN-014、UI-014、API-009 |
| CCFG-REQ-080 | CCFG-DESIGN-011、CCFG-DESIGN-015、UI-014、API-009 |
| CCFG-REQ-081 | UI-017、API-012、CCFG-DESIGN-022 |
| CCFG-REQ-082 | UI-017、API-011、API-012 |
| CCFG-REQ-083 | CCFG-DESIGN-019、CCFG-DESIGN-020、UI-017、API-007、API-008 |
| CCFG-REQ-084 | CCFG-DESIGN-014、CCFG-DB-010 |
| CCFG-REQ-085 | CCFG-DESIGN-001、CCFG-DESIGN-024、CCFG-DESIGN-031、API-013、UI-023 |
| CCFG-REQ-086 | CCFG-DESIGN-024、CCFG-DESIGN-033、API-012、UI-020 |
| CCFG-REQ-087 | CCFG-DESIGN-001、CCFG-DESIGN-008、CCFG-DESIGN-034、CCFG-DB-006、API-009 |
| CCFG-REQ-088 | CCFG-DESIGN-032、CCFG-DESIGN-034、CCFG-DB-019、API-014 |
| CCFG-REQ-089 | CCFG-DESIGN-032、CCFG-DESIGN-034、CCFG-DB-019、API-014 |
| CCFG-REQ-090 | CCFG-DESIGN-001、CCFG-DESIGN-004、CCFG-DESIGN-026、CCFG-DESIGN-032、CCFG-DESIGN-034、CCFG-DB-018、API-014 |

### 12.2 验收覆盖矩阵（AC → 覆盖设计项）

| 验收编号 | 覆盖设计项 |
|---|---|
| CCFG-AC-001 | UI-001、UI-002、CCFG-DESIGN-003 |
| CCFG-AC-002 | CCFG-DESIGN-005、CCFG-DESIGN-006、API-002、UI-002 |
| CCFG-AC-003 | CCFG-DESIGN-005、CCFG-DESIGN-009、API-002、API-009 |
| CCFG-AC-004 | CCFG-DESIGN-005、CCFG-DB-008、API-002 |
| CCFG-AC-005 | CCFG-DESIGN-006、CCFG-DESIGN-007、API-002、UI-003 |
| CCFG-AC-006 | CCFG-DESIGN-031、UI-003、API-002 |
| CCFG-AC-007 | UI-003 |
| CCFG-AC-008 | UI-012、API-002 |
| CCFG-AC-009 | UI-005、UI-007、API-009、CCFG-DESIGN-015 |
| CCFG-AC-010 | UI-007 |
| CCFG-AC-011 | UI-007、UI-009 |
| CCFG-AC-012 | UI-008 |
| CCFG-AC-013 | UI-010、CCFG-DESIGN-011、CCFG-DESIGN-014 |
| CCFG-AC-014 | CCFG-DESIGN-010、CCFG-DB-004、API-010、API-011 |
| CCFG-AC-015 | CCFG-DESIGN-012、CCFG-DESIGN-014、UI-011 |
| CCFG-AC-016 | UI-005 |
| CCFG-AC-017 | UI-004 |
| CCFG-AC-018 | UI-005、UI-004 |
| CCFG-AC-019 | UI-004、UI-019 |
| CCFG-AC-020 | CCFG-DESIGN-018、CCFG-DB-013、API-006 |
| CCFG-AC-021 | CCFG-DESIGN-018、API-006、UI-005 |
| CCFG-AC-022 | UI-006、API-009 |
| CCFG-AC-023 | CCFG-DESIGN-019、CCFG-DB-014、API-008、UI-018 |
| CCFG-AC-024 | CCFG-DESIGN-019、CCFG-DESIGN-020、API-007、API-008、UI-018 |
| CCFG-AC-025 | CCFG-DESIGN-006、CCFG-DESIGN-021、UI-006 |
| CCFG-AC-026 | CCFG-DESIGN-021、UI-006、API-007 |
| CCFG-AC-027 | CCFG-DESIGN-019、CCFG-DESIGN-020、UI-017、API-007、API-008 |
| CCFG-AC-028 | API-011、UI-013、CCFG-DB-003、CCFG-DB-004 |
| CCFG-AC-029 | API-011、UI-013 |
| CCFG-AC-030 | CCFG-DESIGN-023、CCFG-DESIGN-016、CCFG-DESIGN-025、CCFG-DB-002、CCFG-DB-010、API-011 |
| CCFG-AC-031 | CCFG-DESIGN-016、UI-013、CCFG-DB-005、CCFG-DB-011、API-004 |
| CCFG-AC-032 | UI-014、API-010 |
| CCFG-AC-033 | CCFG-DESIGN-028、CCFG-DESIGN-030、CCFG-DB-003、API-011 |
| CCFG-AC-034 | CCFG-DESIGN-029、CCFG-DB-004、API-011 |
| CCFG-AC-035 | UI-014、CCFG-DESIGN-017 |
| CCFG-AC-036 | UI-014 |
| CCFG-AC-037 | UI-014 |
| CCFG-AC-038 | CCFG-DESIGN-017、API-005 |
| CCFG-AC-039 | CCFG-DESIGN-017、CCFG-DESIGN-023、API-011、CCFG-DB-012 |
| CCFG-AC-040 | CCFG-DESIGN-017、CCFG-DESIGN-022、CCFG-DB-016、API-005 |
| CCFG-AC-041 | UI-015 |
| CCFG-AC-042 | UI-015、API-010 |
| CCFG-AC-043 | UI-015 |
| CCFG-AC-044 | UI-015 |
| CCFG-AC-045 | UI-015 |
| CCFG-AC-046 | UI-015 |
| CCFG-AC-047 | UI-015 |
| CCFG-AC-048 | CCFG-DESIGN-030、UI-015 |
| CCFG-AC-049 | API-003、CCFG-DESIGN-008、CCFG-DB-006、CCFG-DB-008 |
| CCFG-AC-050 | UI-016、API-009 |
| CCFG-AC-051 | UI-016、API-003 |
| CCFG-AC-052 | UI-016、API-003 |
| CCFG-AC-053 | UI-016、API-003 |
| CCFG-AC-054 | UI-016、API-003、CCFG-DESIGN-017 |
| CCFG-AC-055 | UI-016、API-003 |
| CCFG-AC-056 | CCFG-DESIGN-013、CCFG-DB-007、CCFG-DB-010 |
| CCFG-AC-057 | CCFG-DESIGN-013、CCFG-DB-010 |
| CCFG-AC-058 | CCFG-DESIGN-023、CCFG-DESIGN-025、API-011 |
| CCFG-AC-059 | CCFG-DESIGN-020、CCFG-DB-010、CCFG-DB-016、API-007 |
| CCFG-AC-060 | CCFG-DESIGN-017、CCFG-DB-012 |
| CCFG-AC-061 | CCFG-DESIGN-022、CCFG-DB-016、API-011 |
| CCFG-AC-062 | CCFG-DESIGN-013、API-012 |
| CCFG-AC-063 | CCFG-DESIGN-013、API-012 |
| CCFG-AC-064 | CCFG-DESIGN-027、CCFG-DESIGN-023、CCFG-DB-016、CCFG-DB-017 |
| CCFG-AC-065 | CCFG-DESIGN-005、CCFG-DESIGN-014、API-002、UI-010 |
| CCFG-AC-066 | CCFG-DESIGN-011、CCFG-DESIGN-014、UI-014、API-009 |
| CCFG-AC-067 | CCFG-DESIGN-011、CCFG-DESIGN-015、UI-014、API-009 |
| CCFG-AC-068 | UI-017、API-012、CCFG-DESIGN-022 |
| CCFG-AC-069 | UI-017、API-011、API-012 |
| CCFG-AC-070 | CCFG-DESIGN-014、CCFG-DB-010 |
| CCFG-AC-071 | CCFG-DESIGN-001、CCFG-DESIGN-024、CCFG-DESIGN-031、CCFG-DESIGN-033、API-013、UI-023 |
| CCFG-AC-072 | CCFG-DESIGN-024、CCFG-DESIGN-033、API-012、UI-020 |
| CCFG-AC-073 | CCFG-DESIGN-008、CCFG-DESIGN-034、CCFG-DB-006、API-009 |
| CCFG-AC-074 | CCFG-DESIGN-034、CCFG-DB-019、API-014 |
| CCFG-AC-075 | CCFG-DESIGN-034、CCFG-DB-019、API-014 |
| CCFG-AC-076 | CCFG-DESIGN-001、CCFG-DESIGN-026、CCFG-DESIGN-032、CCFG-DESIGN-034、CCFG-DB-018、API-014、UI-021 |

## 13. 变更记录

| 日期 | 变更 | 依据 |
|---|---|---|
| 2026-09-03 | 新建 `docs/features/client-config/DESIGN.md`：设计 `CCFG-DESIGN-001~034`（34 条），文档状态 `DRAFT_PENDING_USER_REVIEW`，`PENDING_USER_CONFIRMATION=0`；与 `API.md`/`UI.md`/`DATABASE.md` 共用一套接口路径、字段、错误码与事务边界 | CLIENT-CONFIG-DESIGN-BASELINE-001（阶段 4 设计基线；纯文档任务，未批准、未实现、未执行验收） |
