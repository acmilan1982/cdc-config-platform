# 中心端配置数据库使用设计（DATABASE）

## 1. 文档元数据与状态

| 项目 | 值 |
|---|---|
| 正式功能标识 | `server-config` |
| 目标文档 | `docs/features/server-config/DATABASE.md` |
| 文档状态 | `DRAFT_PENDING_USER_REVIEW` |
| 需求基线状态 | `APPROVED` |
| 验收基线状态 | `APPROVED` |
| 实现状态 | `NOT_STARTED` |
| 设计任务 | `SERVER-CONFIG-DESIGN-BASELINE-001` |
| 授权基线提交 | `c1a6d7dc38de261093383d7abf719f0834dd9bb3` |
| R1 修订任务 | `SERVER-CONFIG-DESIGN-BASELINE-001-R1` |
| R1 授权基线提交 | `53d74c19e31c4068963e7b3c50c12073e9ebad8f` |
| 依据需求 | `docs/features/server-config/REQUIREMENTS.md`（已批准） |
| 关联契约 | `docs/features/server-config/DESIGN.md`、`API.md`、`UI.md`（同一事务、字段与校验规则） |
| 创建日期 | 2026-08-27 |

声明：本文档为**候选数据库使用设计**，待 ChatGPT 与项目负责人复审，不能自行批准。本文只描述本 Feature 如何读取与使用已批准数据库对象，**不复制项目级数据库基线，不设计 DDL，不新增索引/约束/外键**；`DDL_STATUS=NONE`（`SC-DB-120~123`）。本任务未连接数据库，未执行任何 SQL。

## 2. 权威数据库基线引用和事实/目标分层

| 编号 | 规则 |
|---|---|
| SC-DB-001 | 本 Feature 涉及两张表的物理结构、字段类型、长度、可空性、约束、当前行数与数据分布均引用已批准数据库基线，不重新查询数据库（`REQUIREMENTS.md` §4）：`docs/database/README.md`、`docs/database/SCHEMA.md`、`docs/database/RELATIONS.md`、`docs/database/tables/CDC_SERVER.md`、`docs/database/tables/CDC_SERVER_CONFIG.md`。 |
| SC-DB-002 | 事实分层：表结构/字段/约束/索引为 `OBSERVED_DATABASE`（已批准基线）；“当前开发库 1 行中心端、8 行配置、`IS_EDITABLE` 6 个 `'1'` 2 个 `'0'`”为数据快照，不得写成生产常态或数据库强制约束；本 Feature 全部读取/写入路径为 `FUTURE_FEATURE_TARGET`（当前未实现）。 |
| SC-DB-003 | 本 Feature 不做任何数据库结构变更：不新增表/列/索引/唯一约束/Check/外键/触发器/序列，不做数据清洗或回填（`SC-NFR-05`、`SC-NONGOAL-04`）。 |

## 3. `CDC_SERVER`、`CDC_SERVER_CONFIG` 在本 Feature 中的用途

| 编号 | 规则 |
|---|---|
| SC-DB-010 | `CDC_SERVER`：中心端登记表，本 Feature 只用于**识别唯一中心端**（查询 `SERVER_ID`），不提供独立维护页面或写接口，不新增/修改/删除其记录（`SC-NONGOAL-01`）。 |
| SC-DB-011 | `CDC_SERVER_CONFIG`：中心端配置项表，本 Feature 查询全部既有记录，并只修改可编辑记录的 `CONFIG_VALUE`；禁止新增、删除记录（`SC-NONGOAL-02`）。 |

## 4. 读取字段、返回用途、写入字段和禁止写入字段矩阵

| 编号 | 表 | 字段 | 读/写 | 返回用途 |
|---|---|---|---|---|
| SC-DB-020 | `CDC_SERVER` | `SERVER_ID` | 读 | 页面顶部展示唯一中心端 ID；保存时归属校验依据（`SC-UI-01`） |
| SC-DB-021 | `CDC_SERVER_CONFIG` | `ID_SERVER_CONFIG` | 读 / 更新 `WHERE` | 查询响应 `idServerConfig`；保存请求主键 |
| SC-DB-022 | `CDC_SERVER_CONFIG` | `SERVER_ID` | 读（不可写） | 应用层归属校验：目标记录 `SERVER_ID` 必须等于唯一中心端 `SERVER_ID`（`SC-BATCH-04`） |
| SC-DB-023 | `CDC_SERVER_CONFIG` | `CONFIG_DESC` | 读（不可写） | 配置项说明；显示名称兜底输入（`SC-UI-18~22`） |
| SC-DB-024 | `CDC_SERVER_CONFIG` | `CONFIG_KEY` | 读（不可写） | Key Tooltip、白名单判定、排序（`SC-UI-15`、`SC-EDIT-01`） |
| SC-DB-025 | `CDC_SERVER_CONFIG` | `CONFIG_VALUE` | 读 / **唯一可写字段** | 查询响应当前值；批量保存新值（`SC-NFR-07`） |
| SC-DB-026 | `CDC_SERVER_CONFIG` | `IS_EDITABLE` | 读（不可写，不展示） | 应用层计算 `editable` 判定的输入之一；不返回前端展示（`SC-API-032`） |

| 编号 | 规则 |
|---|---|
| SC-DB-027 | 本 Feature 只允许修改 `CONFIG_VALUE`；`CONFIG_KEY`、`CONFIG_DESC`、`SERVER_ID`、`ID_SERVER_CONFIG`、`IS_EDITABLE` 均不可修改（`SC-NFR-07`）。 |

## 5. 唯一中心端查询规则以及 0/1/多条处理

| 编号 | 规则 |
|---|---|
| SC-DB-030 | 识别唯一中心端：查询 `CDC_SERVER` 全部行（小表），按 `COUNT`/列表数量判定：0 条 → `SERVER_NOT_REGISTERED`（`40210`）；恰 1 条 → 取其 `SERVER_ID`；>1 条 → `SERVER_MULTIPLE`（`40211`）（`SC-SERVER-01~04`、`SC-DESIGN-062`）。 |
| SC-DB-031 | 查询与保存两个入口各自独立执行上述识别，不在会话中缓存中心端（`SC-DESIGN-062`、`SC-AC-052~056`）。 |
| SC-DB-032 | 数据库不强制“单中心端”（`CDC_SERVER.md` §3）；0/多中心端按已批准异常行为处理，不自行选择第一条、不自动修复（`SC-SERVER-03/04`）。 |

## 6. 按唯一 `SERVER_ID` 查询全部配置并按 `CONFIG_KEY` 排序

| 编号 | 规则 |
|---|---|
| SC-DB-033 | 配置查询：按唯一中心端 `SERVER_ID` 等值过滤 `CDC_SERVER_CONFIG.SERVER_ID`，返回该中心端全部记录，无新增/删除/分页/筛选（`SC-UI-03`、`SC-NFR-08`）。 |
| SC-DB-034 | 排序：`ORDER BY CONFIG_KEY ASC NULLS LAST, ID_SERVER_CONFIG ASC`（先按 `CONFIG_KEY` 升序，NULL Key 排最后；`CONFIG_KEY` 相同时以 `ID_SERVER_CONFIG` 升序作为稳定次序，多次查询顺序确定不变）；返回全部记录（`SC-DISPLAY-02`、`SC-AC-017`、`API.md` `SC-API-034`）。 |

## 7. 逻辑 1:N 关系、无物理外键及应用层归属校验

| 编号 | 规则 |
|---|---|
| SC-DB-040 | `CDC_SERVER` 与 `CDC_SERVER_CONFIG` 为应用层维护的逻辑一对多关系（`CDC_SERVER_CONFIG.SERVER_ID` → `CDC_SERVER.SERVER_ID`，关系 R16），**无物理外键**（项目架构决策，非缺陷）（`RELATIONS.md`、两表基线 §9）。 |
| SC-DB-041 | 因无物理外键，代码必须主动校验：目标配置记录的 `SERVER_ID` 必须等于唯一中心端 `SERVER_ID`；任一记录归属不符 → 整批拒绝（`SC-BATCH-04`、`SC-DB-072`）。 |
| SC-DB-042 | 不得把逻辑关系写成物理外键，不新增外键约束（`SC-NONGOAL-04`）。 |

## 8. `IS_EDITABLE` 可空、无 Check 的事实，以及应用层精确 `'1'` 判定

| 编号 | 规则 |
|---|---|
| SC-DB-050 | `IS_EDITABLE` 物理类型 `CHAR(1)`、可空、默认值 `'1'`，数据库无 Check 约束（`CDC_SERVER_CONFIG.md` §2/§3）；其合法值全集只能由本 Feature 应用层定义（`FUTURE_FEATURE_TARGET`）。 |
| SC-DB-051 | 应用层可编辑判定：数据库真实记录 `IS_EDITABLE` 去除尾部填充后**精确等于字符 `'1'`** 且 `CONFIG_KEY` ∈ 白名单（`SC-EDIT-01`）；`'0'`、NULL、空白、任何非 `'1'` 值一律只读（`SC-EDIT-02`、`SC-AC-021`）。 |
| SC-DB-052 | `editable` 计算布尔只用于前端控件形态；后端保存时按主键重读真实 `IS_EDITABLE` 并独立重新判定（`SC-API-032`、`SC-NFR-01`）。 |

## 9. `(SERVER_ID, CONFIG_KEY)` 无唯一约束、`CONFIG_KEY` 可空的事实

| 编号 | 规则 |
|---|---|
| SC-DB-053 | `(SERVER_ID, CONFIG_KEY)` 无数据库唯一约束；`CONFIG_KEY` 可空（`CDC_SERVER_CONFIG.md` §2/§3）。不得假设数据库强制唯一或非空（`SC-DISPLAY-02`）。 |
| SC-DB-054 | 重复 Key 或空 Key：仍完整展示全部记录（按 `CONFIG_KEY ASC NULLS LAST, ID_SERVER_CONFIG ASC` 的稳定次序），显示名称兜底（空 Key 时 `CONFIG_DESC` 缺失则显示“未定义配置项”）；可编辑性按**每条记录独立判定**（`IS_EDITABLE='1'` 且 Key ∈ 白名单，`SC-EDIT-01`），**重复 Key 本身不导致只读**；空 Key 不在白名单 → 只读并返回 `CONFIG_KEY_NOT_SUPPORTED`（`40422`），不因空 Key 走到值校验；不新增数据库约束，不做数据清理（`SC-DISPLAY-02`、`SC-UI-DESIGN-042`、`SC-AC-022/023`）。 |
| SC-DB-055 | 当前开发库无重复/空 Key 属数据事实，不得写成永久保证（`CDC_SERVER_CONFIG.md` §10）。 |

## 10. `CONFIG_VALUE` 可空但业务保存值非空、物理长度 64 与应用层校验

| 编号 | 规则 |
|---|---|
| SC-DB-060 | `CONFIG_VALUE` 物理类型 `VARCHAR2(64)`、可空（`CDC_SERVER_CONFIG.md` §2）。数据库可空不代表业务允许空：保存值必须 trim 后非空（`SC-CFG-GEN-01`）。 |
| SC-DB-061 | 保存值长度口径：**原样提交长度**（未 trim 前）物理上限 64 字符，且规范化后最终可保存值必须非空并 ≤ 64，应用层在写库前按固定顺序校验（`SC-CFG-GEN-02`、`SC-DESIGN-076`）；不依赖数据库截断作为正常校验方式（`SC-AC-042`）。 |
| SC-DB-062 | 专门规则与通用规则（非空、长度 64）必须同时满足；任一不满足整条记录校验失败（`SC-CFG-GEN-03/04`）。 |
| SC-DB-063 | 查询返回的当前 `CONFIG_VALUE` 可能为 NULL/空白/非法；展示不脱敏、不掩码（`SC-NFR-03`、`SC-DISPLAY-05`）。 |

## 11. 批量保存事务边界、按主键重查、归属/编辑性/Key/值校验、整批回滚

| 编号 | 规则 |
|---|---|
| SC-DB-070 | 批量保存方法整体置于一个数据库事务（`@Transactional(rollbackFor = Exception.class)`）；唯一中心端识别、逐条按主键重读、全部校验、逐条更新都在同一事务内（`SC-BATCH-05`、`SC-DESIGN-100`）。 |
| SC-DB-071 | 逐条按主键 `ID_SERVER_CONFIG` 重新读取真实记录；不信任客户端提交的 Key、可编辑状态、原值或中心端归属（`SC-BATCH-02`、`SC-EDIT-05`）。 |
| SC-DB-072 | 逐条校验顺序：① 请求契约检查（仅 `idServerConfig` + `configValue`，出现额外字段整批拒绝 `REQUEST_FIELD_NOT_ALLOWED` `40227`，`SC-API-042/050/076`）→ ② 记录存在（`40420`）→ ③ 归属等于唯一中心端（`40423`）→ ④ `IS_EDITABLE` 精确 `'1'`（`40421`）→ ⑤ Key 白名单（`40422`）→ ⑥ 值校验（`SC-API-052` 固定顺序：JSON 字符串类型 → `null` → trim 后非空 `40224` → 原样长度 ≤64 `40225` → Key 专门规则 `40226` → 规范化后非空且 ≤64）；任一失败 → 整批回滚（`SC-BATCH-03/06`）。 |
| SC-DB-073 | 更新按主键 `UPDATE CDC_SERVER_CONFIG SET CONFIG_VALUE = ? WHERE ID_SERVER_CONFIG = ?`；逐条核验更新行数恰为 1（`SC-DB-092`）。 |
| SC-DB-074 | 任一更新行数不符或抛异常 → 整批回滚，禁止部分成功（`SC-BATCH-06`、`SC-AC-058`）。 |
| SC-DB-075 | 事务边界只覆盖批量保存；查询为单次只读，无事务要求。 |
| SC-DB-076 | 保存成功后由前端重新查询展示最新值；后端不维护任何会话状态或缓存（`SC-STATE-01`）。 |

## 12. 并发不保护与最后成功提交覆盖语义

| 编号 | 规则 |
|---|---|
| SC-DB-080 | 本 Feature 不做并发保护：更新不使用旧值、版本号、时间戳或原值作为 `WHERE` 条件（`SC-BATCH-07`）。 |
| SC-DB-081 | 更新以本次合法提交值覆盖数据库当时值，即“最后一次成功保存生效”（`SC-BATCH-08`、`SC-AC-059`）。 |
| SC-DB-082 | 确认框原值仅用于用户确认展示，不参与数据库并发比较（`SC-BATCH-07`）。 |
| SC-DB-083 | 不引入乐观锁、版本列或幂等键；重复合法请求自然收敛（`SC-NONGOAL-08`、`SC-API-092`）。 |

## 13. 查询和更新 SQL 的逻辑形态、绑定参数要求

| 编号 | 规则 |
|---|---|
| SC-DB-090 | 唯一中心端识别（逻辑形态）：`SELECT SERVER_ID FROM CDC_SERVER ORDER BY SERVER_ID`，应用层统计行数并取唯一值；不依赖 `ROWNUM` 猜测第一条（0/多按异常处理，`SC-DB-030`）。 |
| SC-DB-091 | 配置查询（逻辑形态）：`SELECT ID_SERVER_CONFIG, SERVER_ID, CONFIG_DESC, CONFIG_KEY, CONFIG_VALUE, IS_EDITABLE FROM CDC_SERVER_CONFIG WHERE SERVER_ID = ? ORDER BY CONFIG_KEY ASC NULLS LAST, ID_SERVER_CONFIG ASC`；`SERVER_ID` 为绑定参数，取自唯一中心端识别结果。 |
| SC-DB-092 | 更新（逻辑形态）：`UPDATE CDC_SERVER_CONFIG SET CONFIG_VALUE = ? WHERE ID_SERVER_CONFIG = ?`；两个参数均为绑定参数；主键为字符串。 |
| SC-DB-093 | 以上为参数化逻辑 SQL 形态（MyBatis/MyBatis-Plus 绑定参数风格），**不是可执行的 DDL**；所有用户输入一律走绑定参数，不使用字符串拼接，杜绝 SQL 注入（`SC-NFR` 通用安全约束）。 |
| SC-DB-094 | 查询/更新均通过 MyBatis-Plus `BaseMapper`（实体/`LambdaQueryWrapper`/`LambdaUpdateWrapper`）实现（同 `DataSourceMapper`/`DataSourceServiceImpl` 风格）；不新增动态表名或 `${}` 拼接。 |

## 14. 当前记录量下的性能判断；不新增索引、不分页、不缓存

| 编号 | 规则 |
|---|---|
| SC-DB-100 | 当前 `CDC_SERVER_CONFIG` 为小表（开发库 8 行），一次全量加载全部配置；不分页、不筛选、不搜索（`SC-NFR-08`、`SC-NONGOAL-09`）。 |
| SC-DB-101 | 查询链路为一次 `CDC_SERVER` 小表读 + 一次 `CDC_SERVER_CONFIG` 按 `SERVER_ID` 全量读，无 N+1、无大表 JOIN、无缓存（`SC-DESIGN-121`）。 |
| SC-DB-102 | **不新增任何索引**（`CDC_SERVER_CONFIG.md` §4 当前仅有主键索引；按 `SERVER_ID` 查询依赖全表扫描，小表可接受）；不做分区、不分页游标（`SC-NFR-05`）。 |
| SC-DB-103 | 批量保存单事务内逐条按主键更新，批量上限 200，事务短小；不引入批处理优化组件。 |
| SC-DB-104 | 不做服务端缓存、定时任务、异步刷新或消息推送（`SC-NONGOAL-09`）。 |

## 15. 数据库异常与行数校验

| 编号 | 规则 |
|---|---|
| SC-DB-110 | 更新行数与预期不符（应为 1）即视为异常，抛出并整批回滚（`SC-BATCH-06`、`SC-AC-058`）。 |
| SC-DB-111 | 保存阶段数据库连接/执行异常：统一转译为运行时 `BusinessException` 并整批回滚，映射为 `SAVE_FAILED`（`50030`），**不新增 `DATABASE_ACCESS_FAILED` 风格错误码，不提供“或”选项**；message 不泄露底层堆栈与 SQL（`SC-NFR-02`、`SC-DESIGN-109`、`API.md` `SC-API-053`）。 |
| SC-DB-112 | 查询阶段数据库异常不转译业务码，由 `GlobalExceptionHandler` 按未捕获异常映射为 HTTP 500、`code=500`、`message="服务器内部错误"`，前端进入 `LOAD_FAILED` 并提供“重试”；不写入、不修复节点（本 Feature 不涉及 ZooKeeper）。 |

## 16. 明确 `DDL_STATUS=NONE`

| 编号 | 规则 |
|---|---|
| SC-DB-120 | `DDL_STATUS=NONE`：本 Feature 不需要任何数据库结构变更（无 CREATE/ALTER/DROP/TRUNCATE/COMMENT/GRANT/REVOKE），不新增索引/约束/外键/触发器/序列（`SC-NFR-05`、`SC-NONGOAL-04`）。 |
| SC-DB-121 | 本 Feature 不允许对 `CDC_SERVER` / `CDC_SERVER_CONFIG` 执行数据写入（INSERT/UPDATE/DELETE/MERGE）之外的任何数据库写操作；批量保存仅 `UPDATE CONFIG_VALUE`（`SC-DB-092`）。 |
| SC-DB-122 | 验收中需要构造数据库异常数据的场景（0/多中心端、空/异常 `IS_EDITABLE`、空/非法当前值等）只定义期望行为，不授权测试数据写入；任何写库需按项目数据库审批规则另行获得授权（`ACCEPTANCE.md` 重要声明）。 |
| SC-DB-123 | 本任务（设计与契约）不连接数据库、不执行任何 SQL；实现与验收阶段的数据库操作按 `CLAUDE.md` §12 审批规则执行。 |

## 17. 数据库规则到 API、DESIGN、需求与验收用例的可追溯矩阵

| 数据库设计编号 | 对应 API | 对应 DESIGN | 对应需求 | 验收用例 |
|---|---|---|---|---|
| `SC-DB-030~032` | `SC-API-060/061` | `SC-DESIGN-062` | `SC-SERVER-01~06` | `SC-AC-013~016` |
| `SC-DB-033/034`、`SC-DB-090/091` | `SC-API-023~025/034` | `SC-DESIGN-040~046` | `SC-UI-01~04`、`SC-DISPLAY-01~03` | `SC-AC-004/013/017/018` |
| `SC-DB-040~042` | `SC-API-072` | `SC-DESIGN-057` | `SC-BATCH-04` | `SC-AC-054` |
| `SC-DB-050~052` | `SC-API-030/032/070` | `SC-DESIGN-080` | `SC-EDIT-01~05` | `SC-AC-019~023`、`SC-AC-065` |
| `SC-DB-053~055` | `SC-API-071` | `SC-DESIGN-130~134` | `SC-DISPLAY-02`、`SC-EDIT-03` | `SC-AC-022/023` |
| `SC-DB-060~063` | `SC-API-066~068` | `SC-DESIGN-090~094` | `SC-CFG-GEN-01~04`、`SC-DISPLAY-04~08` | `SC-AC-041/042`、`SC-AC-065` |
| `SC-DB-070~076`、`SC-DB-110/111` | `SC-API-040~049` | `SC-DESIGN-057~060`、`SC-DESIGN-100~103` | `SC-BATCH-01~08`、`SC-STATE-01/02` | `SC-AC-052~061` |
| `SC-DB-080~083` | `SC-API-092` | `SC-DESIGN-102/103`、`SC-DESIGN-105` | `SC-BATCH-07/08`、`SC-NFR-04` | `SC-AC-059` |
| `SC-DB-100~104` | `SC-API-035/041` | `SC-DESIGN-120~123` | `SC-NFR-08`、`SC-NONGOAL-09` | `SC-AC-017` |
| `SC-DB-120~123` | — | `SC-DESIGN-150/151` | `SC-NFR-05`、`SC-NONGOAL-04` | `SC-AC-064` |

编号策略：本文档编号按章节分组、预留区间编号（章节内递增），不要求全文连续；每条编号唯一、引用可解析，章节内相邻编号保持递增，全局不保证无空隙。

## 18. 文档级变更记录

| 日期 | 变更 | 依据 |
|---|---|---|
| 2026-08-27 | 建立“中心端配置”Feature 候选数据库使用设计（DRAFT_PENDING_USER_REVIEW / NOT_STARTED；`DDL_STATUS=NONE`） | SERVER-CONFIG-DESIGN-BASELINE-001（阶段 4 设计与契约；纯文档任务；依据已批准数据库基线，未连接数据库） |
| 2026-08-27 | R1 修订：排序补充稳定次序 `CONFIG_KEY ASC NULLS LAST, ID_SERVER_CONFIG ASC`；重复 Key 按行独立判定可编辑、重复本身不导致只读；保存值长度口径明确（原样提交 ≤64、规范化后非空且 ≤64）；校验顺序增加请求契约检查 `40227` 与 `SC-API-052` 值校验顺序；保存异常唯一映射 `SAVE_FAILED 50030`（不新增 `DATABASE_ACCESS_FAILED`）、查询异常映射 HTTP 500 → `LOAD_FAILED`；保持 DRAFT_PENDING_USER_REVIEW / NOT_STARTED | SERVER-CONFIG-DESIGN-BASELINE-001-R1（REQUIRES_CHANGES 修订；纯文档任务） |
