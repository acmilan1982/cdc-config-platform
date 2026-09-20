# 数据源管理 —— 设计基线（DESIGN.md）

> 文档状态：`APPROVED`
> 需求状态：`APPROVED`
> 验收标准状态：`APPROVED`
> 实现状态：`NOT_STARTED`
> 设计任务：`DATA-SOURCE-DESIGN-BASELINE-001`
> 授权基准提交：`c24bbb826b252f06f75ec05bcac77e94a9871019`
> 创建日期：2026-08-29
> 批准任务：`DATA-SOURCE-DESIGN-APPROVAL-CLOSEOUT-001`
> 批准日期：2026-08-29
> 批准依据提交：`fdb9ecaf5bc24373e586d853b4174d1a9cd8bbfc`

---

## 0. 声明与边界

- 本设计已获用户正式批准（批准任务 `DATA-SOURCE-DESIGN-APPROVAL-CLOSEOUT-001`，批准日期 2026-08-29，批准依据提交 `fdb9ecaf5bc24373e586d853b4174d1a9cd8bbfc`），成为数据源管理 Feature 当前正式设计基线；不再处于"草案等待批准"状态。
- 设计批准**不代表**代码已实现、构建通过、验收执行或生产可用。
- 106 条验收用例仍全部为 `NOT_RUN`。
- 本设计不改变任何已批准 `DS-REQ`/`DS-AC`；不新增 DDL、锁、权限、认证或自动刷新等未批准能力。
- 本设计不修改代码、测试、构建文件、配置、菜单、路由、历史候选或任何已批准项目/数据库基线。

### 0.1 批准声明

- 用户已正式批准初版、R1、R2 共同形成的完整设计与契约内容；本文件成为数据源管理 Feature 当前正式设计基线。
- 允许下一阶段基于已批准需求、验收标准和四份设计基线生成实现任务提示词。
- 批准设计**不代表**：代码已经实现；后端或前端构建已经通过；服务已经启动或联调完成；数据库或 ZooKeeper 已被访问；任何 SQL/DDL 已执行；任何一条验收用例已经执行或通过；功能已经生产可用。
- 106 条验收用例继续全部为 `NOT_RUN`，不得写成 `PASS`/`FAIL`/`BLOCKED`。
- 实现状态继续为 `NOT_STARTED`。
- 第一版仍无数据库 DDL、主键/唯一约束/索引变更；批准本文档不等于批准执行数据库变更。

### 0.2 批准链

1. 需求及验收批准收口：`fed87640e007967ece60c1dad5e83438e2bc4672`
2. 基线影响同步及 R1：`3f8747b7aff076f06fc8fdad214e1f14e0013afe`、`c24bbb826b252f06f75ec05bcac77e94a9871019`
3. 设计草案初版：`f7ea3eb2a1343a0600deb86404ce6775a810dce9`
4. 设计 R1：`3b6496b6a2312450fd69be2edbbd287ceb756810`
5. 设计 R2 与最终复审通过基准：`fdb9ecaf5bc24373e586d853b4174d1a9cd8bbfc`
6. 用户最终批准与本批准收口任务：`DATA-SOURCE-DESIGN-APPROVAL-CLOSEOUT-001`

本文件不伪造独立 ChatGPT 报告，仅陈述本批准收口任务已收到的复审结论（基于 `fdb9ecaf...` 的 `REVIEW_PASS`）与用户批准事实。

---

## 1. 总体架构与改造边界（§6.1）

### 1.1 分层职责

| 层 | 职责（目标设计） |
|---|---|
| 前端页面 | `/config/data-source` 正式页面：无分页主列表、三条件查询、新增/编辑居中大弹窗、测试连接、业务属性弹窗（仅目标库）、命名策略大弹窗（仅源库）、删除交互；全部交互见 `UI.md` |
| API 层 | 复用 `/api/data-sources` 根路径；无分页列表/详情/新增/编辑/删除/测试连接/业务属性/目标候选/命名策略 CRUD；接口契约见 `API.md` |
| Service 层 | `DataSourceServiceImpl`（改造）：主数据源 CRUD、查询、测试连接、业务属性、目标候选；命名策略职责拆分到独立 Service（见 §1.4），只操作 `CDC_DATA_SOURCE_EXTEND` |
| Mapper 层 | `DataSourceMapper`（复用）、`DataSourceExtendMapper`（复用）；扩展以确定性 WHERE + 全量计数（区分 0/1/≥2）+ DML 受影响行数校验；目标设计不使用 `ROWNUM=1` 截断多行，不用 MyBatis-Plus 不可控的单记录更新/删除 |
| 数据层 | 两张已批准物理表：`CDC_DATA_SOURCE`（主数据源）、`CDC_DATA_SOURCE_EXTEND`（源库到目标库的命名策略）；物理结构、约束、索引见 `DATABASE.md` |

### 1.2 当前实现事实 vs 目标设计（分栏表达）

> 当前后端为**旧候选实现**（`DataSourceServiceImpl` 等），仅用于识别差距、复用点与迁移边界；**不是**目标实现，不构成已满足需求的证据。

| 维度 | 当前实现事实（旧候选） | 目标设计（本草案，按已批准需求） |
|---|---|---|
| 列表 | 分页 `PageResult<DataSourceListVO>` | 无分页，直接返回全部 `FG_ACTIVE='1'` 记录，按 `DATA_SOURCE_ID` 升序（`DS-REQ-005`/`010`/`002`） |
| 启用/停用 | `PUT /{id}/enable`、`PUT /{id}/disable` 存在 | 删除；目标设计不提供启用/停用能力（`DS-REQ-003`/`091`） |
| EXTEND 语义 | 一对一扩展配置，`create/update` 强制 `extend` 必填，双表联写 | `CDC_DATA_SOURCE_EXTEND` 是"源库到目标库的命名策略"，源库 0..N；独立 CRUD，与主表保存解耦（`DS-REQ-062`/`063`） |
| ID 变更 | 修改 ID 时同步 `CDC_DATA_SOURCE_EXTEND.DATA_SOURCE_ID` | 修改 ID 只改主表当前记录，不同步任何其他表引用（`DS-REQ-041`） |
| 删除 | 先删 EXTEND 再删主表（级联），删除策略隐含在主表删除内 | 删除数据源只物理删除主表当前记录，不检查、不级联（`DS-REQ-092`~`095`）；删除单条策略只删对应 EXTEND 行（`DS-REQ-081`） |
| EXTEND 取值 | `findExtend` 用 `ROWNUM=1` 取第一条 | 策略列表无分页全量返回；按逻辑键定位编辑/删除，多行异常时阻止保存（`DS-REQ-071`/`067`） |
| 密码 | 未做掩码/不返回处理（当前旧代码仍直接暴露） | 真实密码永不返回；编辑页掩码为 UI 状态；未改密码时请求字段缺席（`DS-REQ-042`~`047`） |
| 测试连接 | 无 | 新增/编辑弹窗均提供；临时连接、10 秒超时、前端 10→0 倒计时（`DS-REQ-048`~`061`） |
| 业务属性 | 主表 `DATA_SOURCE_BIZ_ATTR` 列已存在但无管理入口 | 仅目标库独立弹窗读取/保存；原样传输不 trim、不校验 JSON（`DS-REQ-082`~`090`） |
| 前端 | `DataSourcePage.vue` 占位页 | 正式页面替换占位页；路由 `/config/data-source` 保留 |

> **本轮已批准调整基线局部替代提示（§13，`APPROVED`）**：本表“列表”行“无分页，直接返回全部 `FG_ACTIVE='1'` 记录”与“启用/停用”行“删除；目标设计不提供启用/停用能力（`DS-REQ-003`/`091`）”两处目标设计结论，已由本轮 `DS-REQ-150`（列表查询全部记录）与 `DS-REQ-168`~`DS-REQ-173`（新增独立启用/停用接口，只更新主表 `FG_ACTIVE`）**局部替代**。替代边界：列表查询范围由“仅 `FG_ACTIVE='1'`”改为“全部记录”，无分页与 `DATA_SOURCE_ID` 升序**不变**；启用/停用由“删除能力”改为“保留能力但收敛为只写主表 `FG_ACTIVE` 的独立接口”。§1.4“旧分页/启停/一对一 EXTEND 语义在目标接口集中**删除**”中关于**旧**接口语义删除的结论仍成立（旧接口语义删除 ≠ 不提供启停能力），本条不改变 EXTEND 相关结论。详细设计见 §13，变更记录见 §14。

### 1.3 现有类与新增/拆分清单

**复用（可改造）：**

| 类 | 处理 |
|---|---|
| `datasource/entity/DataSource.java` | 保留，17 列映射不变 |
| `datasource/entity/DataSourceExtend.java` | 改造：映射 5 列（补 `TARGET_DATA_SOURCE_ID`）；作为命名策略实体，不再当作 1:1 扩展 |
| `datasource/mapper/DataSourceMapper.java` | 保留；如需确定性查询补充自定义 SQL 方法 |
| `datasource/mapper/DataSourceExtendMapper.java` | 保留；补充确定性 WHERE 的自定义 SQL（无分页全量计数 + 多行防护；目标设计不使用 `ROWNUM=1` 截断） |
| `datasource/exception/DataSourceErrorCode.java` | 改造：保留兼容码，新增命名策略/目标库/测试连接相关业务码（见 `API.md` §7.5） |
| `datasource/controller/DataSourceController.java` | 改造：收敛到 `/api/data-sources` 目标接口集，删除分页/启停/一对一扩展旧语义 |
| `common/api/ApiResponse`、`common/exception/BusinessException`、`common/exception/GlobalExceptionHandler`、`common/page/PageResult` | 保留；无分页场景不再使用 `PageResult` |

**新增：**

| 新增 | 说明 |
|---|---|
| `DataSourceCreateDTO` / `DataSourceUpdateDTO`（重设计） | 字段集按 `DS-REQ-019`~`031`；更新 DTO 不再含旧 `extend`、密码字段按缺席语义（见 §6.5） |
| `DataSourceListVO`（重设计） | 无分页列表返回；不含密码/ORG/BIZ_ATTR/DOMAIN/FG_ACTIVE/时间/SOURCE_APP（`DS-REQ-011`/`012`） |
| `DataSourceDetailVO` | 详情；不含真实密码，含掩码 UI 状态所需信息 |
| `NamingStrategyDTO` / `NamingStrategyVO` | 命名策略新增/编辑请求与列表返回；编辑携带原逻辑键 + 新目标 ID |
| `TargetOptionVO` | 目标库候选下拉选项 |
| `BizAttrVO` / `BizAttrSaveDTO` | 业务属性读取/保存 |
| `TestConnectionDTO` / `TestConnectionResultVO` | 测试连接请求与结果（脱敏消息） |
| `DataSourceNamingStrategyService`（新增接口 + 实现） | 命名策略列表/新增/编辑/删除，只操作 `CDC_DATA_SOURCE_EXTEND`；与主表 Service 解耦 |
| `DataSourceBizAttrService`（可选，或并入主 Service） | 业务属性读取/保存；只更新 `DATA_SOURCE_BIZ_ATTR` 一列 |
| `datasource/converter/*` | 参数/实体/VO 转换器，统一 trim 与隐藏字段处理 |

### 1.4 迁移与兼容边界

- 不允许通过保留旧接口语义反向改变批准需求。旧分页/启停/一对一 EXTEND 语义在目标接口集中**删除**，兼容策略见 `API.md` §7.6。
- 旧 DTO（`DataSourceCreateDTO`/`DataSourceUpdateDTO`/`DataSourceExtendDTO` 旧字段语义）不继续作为目标契约；实现阶段重写或替换。
- 测试类 `DataSourceControllerTest` 覆盖旧 7 接口（含 enable/disable），实现阶段须同步调整以覆盖目标接口；本任务不修改测试代码。
- 前端 `DataSourcePage.vue` 占位页在本任务不动；实现阶段替换为正式页面，路由 `/config/data-source` 与菜单"数据源管理"保留。

---

## 2. 核心流程（§6.2）

### 2.1 页面初始化与无分页列表查询

1. 进入 `/config/data-source`，前端调用 `GET /api/data-sources`（无分页参数）。
2. 后端固定 `FG_ACTIVE='1'` 过滤（`DS-REQ-001`/`002`/`004`），默认 `DATA_SOURCE_ID` 升序（`DS-REQ-010`）；返回全部匹配记录，其中 `dataSourceCategory` 为后端忽略大小写识别存量后规范化输出的 `SOURCE`/`TARGET`。
3. 前端渲染列表；加载中、空数据、失败脱敏提示 + 重试状态见 `UI.md`（`DS-REQ-098`~`100`）。
4. 三条件查询（数据源ID/名称/主机）为空时返回全部；不为空时按忽略大小写模糊匹配且多条件 AND（`DS-REQ-006`~`009`）。

### 2.2 新增数据源

1. 主列表点"新增"，打开居中大弹窗（`DS-REQ-015`）。
2. 弹窗字段仅：数据源ID、名称、类别、类型、主机、端口、用户名、密码、Service Name（`DS-REQ-019`/`020`）；类别可选 `SOURCE`|`TARGET`；类型按类别联动（源库仅 ORACLE；目标库 ORACLE/MYSQL/DORIS），角色变化导致类型非法时清空（`DS-REQ-024`/`025`）。
3. 表单校验：ID/名称/类别/类型/主机/端口/用户/密码/Service Name 必填与长度、格式、范围（`DS-REQ-021`~`030`）；用户输入字符串除业务属性外 trim（`DS-REQ-031`）。
4. 提交 `POST /api/data-sources`；后端独立校验 + 保存前查重（ID/名称忽略大小写精确比较，`DS-REQ-032`~`036`）；类别只接受 `SOURCE`/`TARGET` 并保存统一大写（`DS-REQ-023`）。
5. 插入 `CDC_DATA_SOURCE`：`FG_ACTIVE='1'`、`DATA_SOURCE_ORG=DATA_SOURCE_NAME`（`DS-REQ-004`/`037`）；不写其他表。
6. 成功提示并刷新列表；防重复提交（`DS-REQ-017`/`018`/`101`/`102`）。

### 2.3 编辑数据源（含修改 ID、密码未改/已改）

1. 双击行或点"编辑"，打开同一居中大弹窗并加载详情（`DS-REQ-013`/`014`/`103`）。
2. 前端在打开编辑弹窗时，单独保存**不可编辑的 `originalDataSourceId`**（值为打开弹窗时的原始主键）；表单中的"数据源 ID"仍是用户可自由修改的新值，不得用作"读取持久化旧密码"的定位键。
3. 详情不含真实密码；密码框显示掩码 `*********`（UI 状态，非后端哨兵值）（`DS-REQ-043`/`044`/`046`）。
4. 数据源 ID 可自由修改（`DS-REQ-021`）；提交 `PUT /api/data-sources/{originalId}`，`originalId` 即 `originalDataSourceId`（编辑前原 ID），按原 ID 且 `FG_ACTIVE='1'` 定位主表当前记录；记录不存在或 `FG_ACTIVE!='1'` 视为不存在，返回 `40400`，不更新。
5. 密码未编辑：更新请求**不发送密码字段**（缺席），后端保留原值（`DS-REQ-045`）；密码已编辑：trim 后覆盖（`DS-REQ-045`/`031`）。
6. 隐藏字段按已批准规则保留：`DATA_SOURCE_ORG` 保持原值、`SOURCE_APP`/`DOMAIN` 保留、`FG_ACTIVE` 不变、时间字段不动（`DS-REQ-037`~`040`）。
7. 修改 ID 只更新主表当前记录，**不同步** `CDC_DATA_SOURCE_EXTEND.DATA_SOURCE_ID`、`TARGET_DATA_SOURCE_ID` 或其他表（`DS-REQ-041`）。
8. 类别/类型变化只影响主表当前记录；成功提示并刷新列表。

### 2.4 删除数据源

1. 行操作"删除"，二次确认弹窗（`DS-REQ-091`/`096`）。
2. 提交 `DELETE /api/data-sources/{id}`。
3. 后端只**物理删除** `CDC_DATA_SOURCE` 当前记录（`DS-REQ-092`/`093`/`097`），且该记录须 `FG_ACTIVE='1'`；记录不存在或 `FG_ACTIVE!='1'` 视为不存在，返回 `40400`。这仍是物理删除，不是修改 `FG_ACTIVE`。不检查、不删除、不更新、不级联 `CDC_DATA_SOURCE_EXTEND` 或其他表；被目标引用不阻塞（`DS-REQ-094`/`095`）。
4. 防重复提交、成功提示并刷新（`DS-REQ-096`/`101`/`102`）。

### 2.5 测试连接（新增 / 编辑两种密码来源）

新增弹窗：
1. 填完连接字段（含密码）后点"测试连接"；使用**当前表单密码**（`DS-REQ-050`）。
2. 前端倒计时 10→0 并禁用按钮；提前返回停止；到 0 忽略迟响应（`DS-REQ-055`~`057`）。
3. 后端建立一次性临时连接，执行 `SELECT 1 FROM DUAL`（Oracle）/`SELECT 1`（MySQL/Doris），10 秒超时不重试（`DS-REQ-052`~`054`）。
4. 结果以脱敏消息返回："连接成功"或掩码失败原因（`DS-REQ-058`/`059`）；失败原因不暴露密码/堆栈/敏感连接串（`DS-REQ-059`/`107`）。
5. 测试失败**不阻止保存**；测试连接不是保存前置条件（`DS-REQ-049`）。
6. 修改任一连接字段后，已成功的测试结果失效（`DS-REQ-060`）。

编辑弹窗：
1. 密码未改：测试连接请求携带 `originalDataSourceId`（编辑前原主键）、`password` 字段缺席；后端只按 `originalDataSourceId` 定位 `FG_ACTIVE='1'` 记录并读取**持久化原密码**，仅用于本次临时连接，不写日志/响应（`DS-REQ-051`/`052`）。
2. 密码已改：使用请求中的新密码；可携带 `originalDataSourceId` 表明编辑上下文，但不得读取或混用旧密码（`DS-REQ-051`）。
3. 修改表单中当前 `dataSourceId` 后测试连接且密码未修改时，仍必须使用原记录密码（按 `originalDataSourceId` 定位）。
4. 其余同新增（倒计时、超时、脱敏、非前置条件）。

### 2.6 业务属性读取与保存（仅目标库）

1. 目标库行操作"业务属性"，打开独立弹窗（`DS-REQ-082`/`084`）。
2. 弹窗内为普通多行 JSON 文本编辑区，可为空、允许非法 JSON（`DS-REQ-085`~`087`）。
3. 读取：`GET /api/data-sources/{id}/biz-attr`；保存：`PUT /api/data-sources/{id}/biz-attr`。
4. 保存**原样传输**，不 trim、不校验 JSON（`DS-REQ-087`/`088`）；只更新主表 `DATA_SOURCE_BIZ_ATTR` 一列（`DS-REQ-109`）。
5. 成功提示并刷新（`DS-REQ-089`）；未保存修改关闭弹窗需确认（`DS-REQ-090`）。
6. **角色限定**：后端在读取/保存前先按 `DATA_SOURCE_ID=? AND FG_ACTIVE='1'` 定位记录；记录不存在或 `FG_ACTIVE!='1'` 返回 `40400`。记录存在且有效后，再校验当前角色为 `TARGET`（按 `UPPER(DATA_SOURCE_CATEGORY)='TARGET'` 识别）；存在且有效但角色不是 TARGET 时，返回"数据源角色不适用于当前操作"业务码（`API.md` §7.5 的 `40006`）并拒绝操作。角色校验只拦截本次操作，不清理、不迁移、不级联其他数据（`DS-REQ-040`）。

### 2.7 命名策略列表、新增、编辑、删除（仅源库）

1. 源库行操作"命名策略"，打开独立大弹窗，显示当前源库 ID 与名称（`DS-REQ-069`/`070`）。
2. 列表：`GET /api/data-sources/{sourceId}/naming-strategies`，无分页（`DS-REQ-071`）；列：目标库ID/名称/类型/策略/前缀/后缀/操作（`DS-REQ-072`）。
3. 新增：弹窗内表单，"目标库"下拉仅 `FG_ACTIVE='1' AND DATA_SOURCE_CATEGORY='TARGET'`（`DS-REQ-076`）；新增默认不预选目标（`DS-REQ-077`）；`TARGET_DATA_SOURCE_ID` 必填（`DS-REQ-078`）；策略 `TABLE_MERGE` 时前缀/后缀不必填并清空，`CUSTOM_PREFIX_SUFFIX` 时前缀+后缀必填并 trim（`DS-REQ-079`/`080`）。
4. 提交 `POST /api/data-sources/{sourceId}/naming-strategies`；后端按**新逻辑键** `(DATA_SOURCE_ID, TARGET_DATA_SOURCE_ID)` 全量计数：0 行允许执行 `INSERT`；1 行返回 `40902` 逻辑键重复；≥2 行返回 `40903` 存量多条异常（`DS-REQ-064`/`065`/`067`）；插入后校验受影响行数=1，否则回滚；不清理存量（`DS-REQ-066`）。
5. 编辑：按原 `(sourceId, targetId)` 定位；切换目标库时请求同时携带原目标 ID 与新目标 ID（`API.md` §7.2）；提交 `PUT /api/data-sources/{sourceId}/naming-strategies/{originalTargetId}`。
6. 删除：行操作删除，二次确认（`DS-REQ-081`）；`DELETE /api/data-sources/{sourceId}/naming-strategies/{targetId}`，只删除逻辑键定位的当前 EXTEND 行（`DS-REQ-081`）。
7. 同一弹窗内新增/编辑表单（`DS-REQ-074`）；未保存修改关闭确认（`DS-REQ-075`）；成功反馈（`DS-REQ-102`）。
8. **角色限定**：后端在列表/新增/编辑/删除前先按 `DATA_SOURCE_ID=? AND FG_ACTIVE='1'` 定位 `sourceId` 对应记录；记录不存在或 `FG_ACTIVE!='1'` 返回 `40400`。记录存在且有效后，再校验当前角色为 `SOURCE`（按 `UPPER(DATA_SOURCE_CATEGORY)='SOURCE'` 识别）；存在且有效但角色不是 SOURCE 时，返回"数据源角色不适用于当前操作"业务码（`40006`）并拒绝操作（`API.md` §7.5）。新增/编辑的新目标库 `targetDataSourceId` 仍必须校验 `FG_ACTIVE='1'` 且当前角色为 `TARGET`（`DS-REQ-076`）；不存在、未启用或不是 TARGET 一律返回 `40005`，不使用 `40006`。

### 2.8 查询、加载、保存、删除、测试失败的统一处理

- 统一前端状态模型（加载中/空/错误+重试/成功/未保存修改）见 `UI.md` §8.6（`DS-REQ-098`~`104`）。
- 后端统一错误契约（HTTP 200 + 业务码 / HTTP 400 校验 / HTTP 500 未知）与脱敏，见 `API.md` §7.5。
- 所有写操作防重复提交（`DS-REQ-101`）；所有容器关闭前未保存修改确认（`DS-REQ-104`）；不使用旧新标签页行为（`DS-REQ-105`）。

---

## 3. 事务与维护边界（§6.3）

| 操作 | 影响表/列 | 事务 | 说明 |
|---|---|---|---|
| 新增数据源 | 只插入 `CDC_DATA_SOURCE` | `@Transactional` | `FG_ACTIVE='1'`、`DATA_SOURCE_ORG=DATA_SOURCE_NAME`；不写 EXTEND |
| 编辑数据源 | 只更新主表当前记录 | `@Transactional` | 按原 ID 且 `FG_ACTIVE='1'` 定位（非 `'1'` 视为不存在，不更新）；UPDATE 的 WHERE/受影响行数校验保证只操作该有效记录；隐藏字段按规则保留；修改 ID 不更新任何其他表引用 |
| 删除数据源 | 只物理删除主表当前记录 | `@Transactional` | 只允许删除 `FG_ACTIVE='1'` 的当前记录（非 `'1'` 视为不存在返回 `40400`）；不检查、不删除、不级联 EXTEND 或其他表；被引用不阻塞 |
| 业务属性保存 | 只更新主表 `DATA_SOURCE_BIZ_ATTR` 一列 | `@Transactional` | 原样保存，不 trim、不校验 JSON |
| 命名策略新增/编辑/删除 | 只操作 `CDC_DATA_SOURCE_EXTEND` | `@Transactional` | 与主表保存完全解耦 |
| 删除命名策略 | 只删除逻辑键定位的当前 EXTEND 行 | `@Transactional` | 先按原逻辑键全量计数，恰好 1 才 DML；DML 后校验受影响行数=1，否则回滚（`DS-REQ-081`/`067`） |
| 目标库候选查询 | 只读 `CDC_DATA_SOURCE` | 只读（无事务写） | `FG_ACTIVE='1' AND UPPER(DATA_SOURCE_CATEGORY)='TARGET'` |
| 测试连接 | 无业务表写入 | 无事务 | 一次性临时连接；不进入应用连接池；不保存表单内容 |

- 单表操作失败即回滚该操作；命名策略与主数据源相互独立，互不级联。
- 命名策略**新增**：按**新逻辑键** `(sourceId, targetDataSourceId)` 全量计数——0 行允许执行 `INSERT`；1 行返回 `40902` 逻辑键重复；≥2 行返回 `40903` 存量多条异常。插入后校验受影响行数恰好为 1，否则抛保存异常并回滚。新增流程不返回 `40401`，不要求"原逻辑键恰好一行"（`DS-REQ-064`/`067`）。
- 命名策略**编辑**：按**原逻辑键** `(sourceId, originalTargetId)` 全量计数——0 行返回 `40401` 不存在；≥2 行返回 `40903` 存量多条异常；恰好 1 行继续。若新目标 ID 与原目标 ID 忽略大小写相同，不把当前行误判为重复；若逻辑键变化，按**新逻辑键**查重并排除原记录：0 行允许更新，1 行返回 `40902`，≥2 行返回 `40903`。使用完整原逻辑键执行 UPDATE，影响行数必须为 1，否则抛异常并回滚。
- 命名策略**删除**：按**原逻辑键**全量计数——0 行返回 `40401`，≥2 行返回 `40903`，恰好 1 行才允许删除；使用完整原逻辑键 DELETE，影响行数必须为 1，否则抛异常并回滚。
- 目标设计不使用 `ROWNUM=1` 截断；不清洗、不合并、不自动删除重复存量；无锁、无数据库唯一约束、无 DDL，并发窗口限制继续明确保留（`DS-REQ-064`/`066`/`067`/`081`/`108`）。
- 测试连接**不写任何业务数据**，不触发 DML（`DS-REQ-061`/`109`）。

---

## 4. 逻辑唯一性与并发边界（§6.4）

- ID、名称唯一性：后端**保存前**按忽略大小写的精确比较查重（`DS-REQ-032`/`033`/`034`）；编辑查重排除当前原记录/原逻辑键（`DS-REQ-035`）。
- 命名策略逻辑键 `(DATA_SOURCE_ID, TARGET_DATA_SOURCE_ID)`：后端保存前逻辑联合查重（`DS-REQ-064`/`065`）。**新增**按**新逻辑键**全量计数：0 行允许执行 `INSERT`；1 行返回 `40902`；≥2 行返回 `40903`。**编辑**按**原逻辑键**计数（0 行 → `40401`、≥2 行 → `40903`、恰好 1 行继续），若逻辑键变化再按**新逻辑键**查重并排除原记录（0 行允许更新、1 行 → `40902`、≥2 行 → `40903`）；新目标与原目标忽略大小写相同不误判当前行为重复。**删除**按**原逻辑键**计数（0 行 → `40401`、≥2 行 → `40903`、恰好 1 行才允许删除）。重复/存量多条均阻止并提示（`DS-REQ-067`）。
- 编辑/删除：先按原逻辑组合键执行 `COUNT(*)` 或等价的全量计数，只有计数**恰好为 1** 才允许 DML；DML 后校验受影响行数恰好为 1，否则抛业务异常并依赖事务回滚。目标设计不使用 `ROWNUM=1` 掩盖多行异常。
- **第一版无数据库唯一约束、索引或任何 DDL**（`DS-REQ-034`/`065`/`108`）。因此"查询后写入"**不宣称**具备数据库级并发唯一保证：无数据库唯一约束、无锁、无 DDL 时并发窗口仍然存在，两个请求同时通过查重后都写入是可能发生的。这是已批准需求接受的限制，不虚假宣称数据库级唯一保证。
- 本设计**不新增**本地锁、分布式锁或 DDL。若后续实现发现必须新增才能满足需求，停止并报告，由用户决策，不得自行加入（§11）。

---

## 5. 密码与安全（§6.5）

- 真实密码**永不返回前端**：列表、详情、业务属性、命名策略任何响应均不含密码（`DS-REQ-042`/`043`）。
- 编辑页掩码 `*********` 仅为 **UI 状态**，不是后端哨兵值；后端不识别、不依赖该字符串（`DS-REQ-044`/`046`）。
- 密码未编辑时，更新请求**不发送密码字段**（字段缺席），后端保留原值（`DS-REQ-045`）。
- 输入新密码时 trim 后覆盖（`DS-REQ-045`/`031`）。
- 编辑场景测试连接未改密码时，请求携带 `originalDataSourceId`（编辑前原主键）、`password` 字段缺席；后端只按 `originalDataSourceId` 定位 `FG_ACTIVE='1'` 记录并安全读取数据库原密码，**仅用于本次临时连接**，不进入日志/响应/异常（`DS-REQ-051`/`052`）。
- 表单中可编辑的 `dataSourceId` 不得作为读取持久化密码的定位键；不向前端返回真实密码、不以掩码字符串当哨兵、不把原密码/连接串/堆栈写入日志或响应（`DS-REQ-044`/`046`/`047`/`107`）。
- 密码不进入日志、响应、异常或执行报告（`DS-REQ-047`/`107`）；失败原因脱敏（`DS-REQ-059`）。
- 当前系统无认证机制；本 Feature **不新增认证**（§11 边界，保持已批准范围）。

---

## 6. 测试连接技术设计（§6.6）

- **URL/驱动选择生成职责**：由后端根据 `DATA_SOURCE_TYPE` 生成连接参数——
  - Oracle：`jdbc:oracle:thin:@//host:port/serviceName`，驱动 `oracle.jdbc.OracleDriver`；
  - MySQL：`jdbc:mysql://host:port/serviceName`，驱动 `com.mysql.cj.jdbc.Driver`；
  - Doris：`jdbc:mysql://host:port/serviceName`（Doris 兼容 MySQL 协议），驱动复用 MySQL 驱动；URL/驱动差异集中在一个后端连接构建组件，前端不拼接 JDBC URL。
- **探活 SQL**：Oracle 执行 `SELECT 1 FROM DUAL`；MySQL/Doris 执行 `SELECT 1`（`DS-REQ-053`）。
- **一次性临时连接**：每次测试新建临时 `Connection`，不用应用连接池、不保存表单内容、`try-with-resources`/`finally` 关闭（`DS-REQ-052`/`061`）。
- **后端超时**：10 秒、不自动重试（`DS-REQ-054`）。
- **前端倒计时**：10→0 秒文案；测试中禁用按钮；提前返回停止；到 0 忽略迟响应（`DS-REQ-055`~`057`）。
- **防重复点击与请求代次**：前端为每次测试维护请求序列/代次号；响应仅当代次匹配且未超时/未修改连接字段时生效（`DS-REQ-057`/`060`）。
- **MySQL/Doris JDBC 依赖**：属后续实现任务的**构建依赖调整**，本任务**不修改 `pom.xml`**（当前仅 `ojdbc8`）。
- **不是保存前置条件**：测试失败仍可保存（`DS-REQ-049`）。

---

## 7. 校验、trim 与状态（§6.7）

- **前后端双重校验**：前端即时提示（Element Plus 表单规则），后端独立校验兜底（`DS-REQ-106`）。
- 校验字段范围见 `DS-REQ-021`~`030`（ID/名称/类别/类型/主机/端口/用户/密码/Service Name 的必填、长度、格式、值域）；端口 1~65535；ID `[A-Za-z0-9_-]` ≤32。
- **端口类型契约**：API 请求/响应中 `port` 为 JSON number / Java `Integer`，示例写 `1521` 不加引号；前端表单模型使用数值端口，只接受整数 1..65535；后端 DTO 独立重新校验整数与范围。数据库物理列仍为 `VARCHAR2(64)`（已批准物理事实），持久化边界显式执行 `Integer ↔ 十进制字符串` 转换，不修改数据库字段、不执行 DDL（`DS-REQ-027`）。
- **角色大小写兼容**：新增/编辑请求只接受 `SOURCE`/`TARGET` 并保存为统一大写；读取历史记录时对 `DATA_SOURCE_CATEGORY` 忽略大小写识别并向前端返回规范化 `SOURCE`/`TARGET`；角色条件查询使用大小写兼容比较（如 `UPPER(DATA_SOURCE_CATEGORY)='TARGET'`），仅为兼容既有存量大小写，不放宽到其他非法值（`DS-REQ-023`）。
- **新引用 ID 业务长度**：`targetDataSourceId` 的 API 业务长度按主数据源 ID 上限 32 校验；数据库物理列 `VARCHAR2(128)` 为物理事实保留，不得把物理容量误当作新引用 ID 的业务长度（`DS-REQ-078`）。
- **角色—类型联动**：源库仅 ORACLE；目标库 ORACLE/MYSQL/DORIS；角色变化导致类型非法时清空类型（`DS-REQ-024`/`025`）。
- **三条件查询**：数据源ID/名称/主机，忽略大小写模糊，多条件 AND，字符串 trim（`DS-REQ-006`~`009`/`031`）。
- **trim 例外**：所有用户输入字符串均 trim，**唯一例外**为 `DATA_SOURCE_BIZ_ATTR`（原样保存，不 trim、不校验 JSON）（`DS-REQ-031`/`088`）。
- **状态**：加载中/空数据/错误+重试/成功反馈/未保存修改确认/防重复提交，覆盖全部容器（`DS-REQ-098`~`104`）。

---

## 8. 性能、诊断与限制（§6.8）

- 数据源总数 ≤100、策略为小规模配置数据；**列表不分页**（`DS-REQ-005`/`071`）。
- 查询避免 N+1：命名策略列表一次性按 `sourceId` 查询 EXTEND 全量行，再对目标库 ID 集合做**一次** `CDC_DATA_SOURCE` 查询完成名称/类型映射（`DS-REQ-072`）。
- 日志与错误可诊断但不泄露敏感信息（不输出密码、不输出完整连接串、异常消息脱敏）（`DS-REQ-047`/`107`）。
- **无缓存、无定时任务、无自动刷新**；已批准需求未要求自动刷新，页面只在操作成功后刷新（`DS-REQ-098`~`102` 边界）。
- **已接受限制**：无数据库级唯一约束，逻辑唯一仅靠保存前查重（§4）；存量异常数据不清洗（`DS-REQ-066`）。
- **延期项**：MySQL/Doris 驱动引入、`DataSourceControllerTest` 适配、前端占位页替换，均为实现阶段工作。

---

## 9. 需求追踪（§6.9）

> 109 条 `DS-REQ-001`~`109` 连续追踪。每条至少映射到一个具体设计章节；缩写：D=DESIGN.md，A=API.md，U=UI.md，DB=DATABASE.md。

| # | 需求要点 | 设计映射 |
|---|---|---|
| 001 | `CDC_DATA_SOURCE` 作为独立主表展示 | D§2.1/§1.1、A§7.1、DB§9.1 |
| 002 | 仅查询/操作 `FG_ACTIVE='1'` 记录 | D§2.1、A§7.1、DB§9.4 |
| 003 | 页面不提供启用/停用 | D§1.2、A§7.6、U§8.1 |
| 004 | 新增写 `FG_ACTIVE='1'`，编辑不改 | D§2.2/§3、DB§9.3 |
| 005 | 记录 ≤100，列表不分页 | D§2.1/§8、A§7.4、U§8.1 |
| 006 | 查询条件仅 ID/名称/主机 | D§2.1、A§7.4、U§8.1 |
| 007 | 三条件忽略大小写模糊 | D§2.1、A§7.4、DB§9.4 |
| 008 | 多条件 AND、查询值先 trim | D§2.1、A§7.4、DB§9.4 |
| 009 | 查询/重置行为 | D§2.1、U§8.1 |
| 010 | 默认 ID 升序 | D§2.1、A§7.4、DB§9.4 |
| 011 | 列表列清单 | D§1.3、A§7.4、U§8.1、DB§9.2 |
| 012 | 列表不含密码/ORG/BIZ_ATTR/DOMAIN/FG_ACTIVE/时间/SOURCE_APP | D§5、A§7.4、U§8.1 |
| 013 | 行操作：编辑/业务属性(仅目标)/命名策略(仅源)/删除 | D§2.3/2.4/2.6/2.7、U§8.1 |
| 014 | 双击行=编辑 | D§2.3、U§8.1 |
| 015 | 新增/编辑居中大弹窗 | D§2.2/2.3、U§8.2 |
| 016 | 未保存修改关闭确认 | D§2.8、U§8.2/8.4/8.5 |
| 017 | 请求处理中防重复提交 | D§2.8、U§8.6 |
| 018 | 保存成功刷新列表 | D§2.2、U§8.6 |
| 019 | 弹窗仅含字段：ID/名称/类别/类型/主机/端口/用户/密码/Service Name | D§2.2、A§7.4、U§8.2 |
| 020 | 不展示/不编辑 ORG/DOMAIN/SOURCE_APP/FG_ACTIVE/时间/BIZ_ATTR | D§2.2/2.3、U§8.2 |
| 021 | ID 必填 ≤32 `[A-Za-z0-9_-]`，可自由修改 | D§7、A§7.4、U§8.2 |
| 022 | 名称必填 ≤30 | D§7、A§7.4、U§8.2 |
| 023 | 类别 SOURCE/TARGET | D§7、A§7.4、U§8.2 |
| 024 | 类型：源库仅 ORACLE；目标库 ORACLE/MYSQL/DORIS | D§7、A§7.4、U§8.2 |
| 025 | 角色变化导致类型非法时清空 | D§7、U§8.2 |
| 026 | 主机必填 ≤64（IP/域名/主机名） | D§7、A§7.4、U§8.2 |
| 027 | 端口必填整数 1~65535 | D§7、A§7.4、U§8.2 |
| 028 | 用户必填 ≤64 | D§7、A§7.4、U§8.2 |
| 029 | 新增密码必填 ≤64；编辑按 §9 密码契约 | D§2.2/2.3/§5、A§7.3、U§8.2 |
| 030 | Service Name 必填 ≤64；Oracle 文案"Service Name"/MySQL/Doris"数据库名" | D§7、A§7.4、U§8.2 |
| 031 | 除 BIZ_ATTR 外所有字符串 trim | D§7、A§7.4、U§8.2 |
| 032 | ID 忽略大小写精确唯一 | D§4、A§7.5、DB§9.4 |
| 033 | 名称忽略大小写精确唯一 | D§4、A§7.5、DB§9.4 |
| 034 | 后端保存前查重，无 DB 唯一/DDL | D§4、A§7.5、DB§9.4 |
| 035 | 编辑查重排除自身 | D§4、A§7.5、DB§9.4 |
| 036 | 冲突时清晰业务提示 | D§2.2、A§7.5、U§8.2 |
| 037 | 新增 DATA_SOURCE_ORG=DATA_SOURCE_NAME | D§2.2/§3、DB§9.3 |
| 038 | 编辑保留原 ORG | D§2.3/§3、DB§9.3 |
| 039 | SOURCE_APP/DOMAIN 保留 | D§2.3/§3、DB§9.3 |
| 040 | 类别变化只更新主表当前记录 | D§2.3/§3、DB§9.3 |
| 041 | 修改 ID 只改主表，不同步引用 | D§2.3/§3、A§7.2、DB§9.3 |
| 042 | 主列表不得显示密码 | D§5、A§7.4、U§8.1 |
| 043 | 详情/编辑接口不返回真实密码 | D§5、A§7.3、U§8.2 |
| 044 | 编辑弹窗固定掩码（UI 状态） | D§5、U§8.2 |
| 045 | 未改密码字段缺席、已改发 trim 后新密码 | D§5、A§7.3、U§8.2 |
| 046 | 不依赖魔法哨兵字符串 | D§5、A§7.3、U§8.2 |
| 047 | 密码不泄露进日志/异常/响应 | D§5、A§7.3、U§8.2 |
| 048 | 新增/编辑弹窗均有测试连接按钮 | D§2.5、U§8.3 |
| 049 | 测试连接不是保存前置条件 | D§2.5/§6、A§7.3、U§8.3 |
| 050 | 使用弹窗内当前未保存连接字段 | D§2.5、A§7.3、U§8.3 |
| 051 | 编辑未改密码用持久化密码、已改用新密码 | D§2.5、A§7.3、U§8.3 |
| 052 | 一次性临时 JDBC 连接、不入池、不用表单保存、用完关闭 | D§2.5/§6、DB§9.5 |
| 053 | Oracle `SELECT 1 FROM DUAL`；MySQL/Doris `SELECT 1` | D§2.5/§6、DB§9.5 |
| 054 | 单次超时 10 秒、不重试 | D§2.5/§6、A§7.5、U§8.3 |
| 055 | 测试期间按钮禁用、倒计时 10..0 | D§2.5/§6、U§8.3 |
| 056 | 提前返回停止倒计时 | D§2.5/§6、U§8.3 |
| 057 | 到 0 超时、忽略迟响应 | D§2.5/§6、U§8.3 |
| 058 | 成功仅需"连接成功" | D§2.5、A§7.4、U§8.3 |
| 059 | 失败脱敏原因，不暴露堆栈/密码/敏感连接 | D§2.5/§5、A§7.5、U§8.3 |
| 060 | 任意连接字段修改后成功失效 | D§2.5/§6、U§8.3 |
| 061 | 连接测试不改业务数据 | D§3/§6、DB§9.5 |
| 062 | EXTEND 为命名策略而非通用 1:1 | D§1.2、U§8.5、DB§9.1 |
| 063 | 源库 0..N 命名策略 | D§1.2/2.7、DB§9.1 |
| 064 | 逻辑组合键 `(DATA_SOURCE_ID, TARGET_DATA_SOURCE_ID)` 唯一 | D§2.7/§4、A§7.2、DB§9.3 |
| 065 | 后端保存前组合查重、无 DDL | D§2.7/§4、DB§9.4 |
| 066 | 不处理/不清洗存量异常 | D§2.7/§8、DB§9.3 |
| 067 | 重复/存量多条时阻止保存并提示 | D§2.7、A§7.5、DB§9.3 |
| 068 | 文案"目标库命名策略/命名策略" | U§8.5 |
| 069 | 仅源库显示命名策略按钮 | D§2.7、U§8.5 |
| 070 | 独立大弹窗 | D§2.7、U§8.5 |
| 071 | 弹窗内全部策略、不分页 | D§2.7、A§7.4、U§8.5 |
| 072 | 列表列：目标库ID/名称/类型/策略/前缀/后缀/操作 | D§2.7/§8、A§7.4、U§8.5 |
| 073 | 新增/编辑/删除策略 | D§2.7、A§7.1、U§8.5 |
| 074 | 表单在同一大弹窗内切换/展开 | D§2.7、U§8.5 |
| 075 | 未保存修改关闭/切换确认 | D§2.7、U§8.5 |
| 076 | 目标库下拉仅 FG_ACTIVE='1' AND CATEGORY='TARGET' | D§2.7、A§7.1、U§8.5、DB§9.4 |
| 077 | 新增默认不选目标库 | D§2.7、U§8.5 |
| 078 | TARGET_DATA_SOURCE_ID 每条必填 | D§2.7、A§7.4、U§8.5 |
| 079 | TABLE_MERGE 前缀/后缀不必填并清空 | D§2.7、U§8.5 |
| 080 | CUSTOM_PREFIX_SUFFIX 前缀+后缀必填并 trim | D§2.7、U§8.5 |
| 081 | 删除只删对应 EXTEND 行 + 二次确认 | D§2.7/§3、A§7.2、DB§9.3 |
| 082 | BIZ_ATTR 仅对 TARGET 使用 | D§2.6、U§8.4 |
| 083 | 不在主列表/主表单展示或编辑 | D§2.6、A§7.4、U§8.4 |
| 084 | 独立业务属性弹窗 | D§2.6、U§8.4 |
| 085 | 普通 JSON 文本/多行编辑、仅文本 | D§2.6、U§8.4 |
| 086 | 内容可为空 | D§2.6、U§8.4 |
| 087 | 不做 JSON 合法性/结构校验 | D§2.6、A§7.4、U§8.4 |
| 088 | 原样保存、唯一不 trim 字段 | D§2.6/§7、A§7.4、DB§9.5 |
| 089 | 保存成功反馈、按需刷新 | D§2.6、U§8.4 |
| 090 | 未保存修改关闭确认 | D§2.6、U§8.4 |
| 091 | 页面只保留删除、不保留停用 | D§1.2/2.4、U§8.1 |
| 092 | 删除是主表当前记录物理删除 | D§2.4、A§7.1、DB§9.3 |
| 093 | 删源库/目标库只删主表记录 | D§2.4/§3、DB§9.3 |
| 094 | 不检查/不删除/不级联 EXTEND 或其他表 | D§2.4/§3、DB§9.3 |
| 095 | 被目标引用不阻止删除 | D§2.4、A§7.5、DB§9.3 |
| 096 | 二次确认 + 防重复 + 刷新 | D§2.4、U§8.6 |
| 097 | 删除不得通过修改 FG_ACTIVE | D§2.4、DB§9.3 |
| 098 | 主列表、弹窗加载态 | D§2.8、U§8.6 |
| 099 | 空数据状态 | D§2.8、U§8.6 |
| 100 | 失败脱敏提示 + 重试入口 | D§2.8、A§7.5、U§8.6 |
| 101 | 请求进行中防重复提交 | D§2.8、U§8.6 |
| 102 | 成功保存明确反馈 | D§2.8、U§8.6 |
| 103 | 双击编辑与按钮编辑一致 | D§2.3、U§8.1 |
| 104 | 所有编辑容器未保存关闭确认 | D§2.8、U§8.6 |
| 105 | 不使用新标签页/聚焦刷新旧行为 | D§2.8、U§8.1 |
| 106 | 后端独立重新校验 | D§7、A§7.5、U§8.6 |
| 107 | 密码/敏感连接信息不进日志/异常/响应/页面 | D§5/§8、A§7.5、DB§9.5 |
| 108 | 第一版不新增主键/唯一/索引/DDL | D§4、DB§9.1 |
| 109 | 测试/业务属性/命名策略不改变无关表 | D§3、DB§9.2/9.3 |

---

## 10. 批准收口变更记录（2026-08-29）

- 2026-08-29；
- 文档状态由 `DRAFT_PENDING_USER_REVIEW` 转为 `APPROVED`；
- 技术/产品正文不变；
- 实现状态仍为 `NOT_STARTED`；
- 106 条验收仍为 `NOT_RUN`；
- 依据为本批准任务 `DATA-SOURCE-DESIGN-APPROVAL-CLOSEOUT-001` 及 `fdb9ecaf5bc24373e586d853b4174d1a9cd8bbfc` 最终复审通过基准。

---

## 11. 列表首页选择性接入查询列表页公共组件设计（`APPROVED`，`IMPLEMENTED_PENDING_USER_REVIEW`）

> 状态：`APPROVED`。本轮调整基线分层状态：`adjustment_design_status=APPROVED`、`adjustment_baseline_status=APPROVED`、`implementation_status=IMPLEMENTED_PENDING_USER_REVIEW`、`implementation_authorization_status=GRANTED_IN_THIS_TASK`、`formal_acceptance_execution_status=NOT_RUN`、`new_adjustment_acceptance_status=ALL_NOT_RUN`。本节为任务 `DATA-SOURCE-LIST-PAGE-SELECTIVE-QUERY-LIST-INTEGRATION-BASELINE-001`（`task_type=FEATURE_ADJUSTMENT_BASELINE_DRAFT`）形成的设计基线，**已获批准**，并已由 `DATA-SOURCE-LIST-PAGE-SELECTIVE-QUERY-LIST-INTEGRATION-IMPLEMENTATION-001` 实现，**尚未验收**。
> 批准链（2026-09-19）：初版草案提交 `01680ee527b8e35cd4afd84c4789b862d34f7a77` → R1 修订提交 `c3fd460bea64a14ccc7b52a554194a133330e29d` → ChatGPT 远程 Git R1 复审结论 `REVIEW_PASS` → 项目负责人 2026-09-19 明确回复“批准这轮调整基线”；批准任务 `DATA-SOURCE-LIST-PAGE-SELECTIVE-QUERY-LIST-INTEGRATION-APPROVAL-CLOSEOUT-001`。
> 实现**不代表**已验收或生产可用：实现状态为 `IMPLEMENTED_PENDING_USER_REVIEW`，实现授权为 `GRANTED_IN_THIS_TASK`，`DS-AC-116~140`（25 条）仍全部 `NOT_RUN`。
> §0~§10 的既有 `APPROVED` 设计基线与追踪结论保持原样、编号与正文逐字冻结；本节只就 `/config/data-source` **第一个主列表页面**的选择性接入给出结论，并明确其与既有设计的局部替代边界。
> 关联需求：`REQUIREMENTS.md` §22 的 `DS-REQ-116~138`；关联验收：`ACCEPTANCE.md` §4.16 的 `DS-AC-116~140`（全部 `NOT_RUN`）。

### 11.1 分层职责与边界

| 层 | 本轮职责 | 明确不承担 |
|---|---|---|
| 公共页面壳（`QueryListPageShell`/`QueryListQueryPanel`/`QueryListActions`/`QueryListResultPanel`） | 提供标题与说明、查询条件容器、查询/重置动作、结果卡片与槽位 | CRUD 状态、分页、Tooltip 状态、API 请求、弹窗状态、数据源业务规则 |
| 数据源管理 Feature | 持有查询草稿与生效条件、请求与错误语义、空状态、表格与行操作、弹窗 | 不复制一套平行等价 CSS；不改写公共组件实现 |
| 路由/布局 | `/config/data-source` 保持既有 meta；稳定滚动条槽仍只对 `/monitor/data-source-state` 生效 | 不为本页启用 `stableScrollbarGutter` |

- 公共组件接入**不改变**请求次数、请求时机、错误语义、空状态、列表刷新时机、角色规范化、删除行为与弹窗行为（`DS-REQ-120`）。
- 接入方式为**选择性复用**，不是把 CRUD 配置管理页改造成只读监控页（`DS-REQ-117`）。

### 11.2 组件接入映射与槽位归属

| 页面能力 | 公共组件 | 槽位/契约 | 归属 |
|---|---|---|---|
| 页面标题与一句话说明 | `QueryListPageShell` | props `title`/`description`，默认槽直挂 `.ql-page` | 公共 |
| 查询条件容器 | `QueryListQueryPanel` | 默认槽承载三个文本条件 + 角色 `el-select` 单选下拉框 | 公共容器 / Feature 内容 |
| 查询 / 重置 | `QueryListActions` | emits `query`/`reset`；`queryWidthPx`/`resetWidthPx` 四值同锁 | 公共 |
| 结果卡片 | `QueryListResultPanel` | 固定错误槽 = Feature `loadError` 的 `el-alert`；`toolbar` 槽 = “新增数据源”；`body` 槽 = Feature 表格、空状态与行操作 | 公共容器 / Feature 内容 |
| 自动刷新工具栏 | **不接入** `QueryListRefreshToolbar` | — | — |
| 稳定滚动条槽 | **不自动启用** | — | — |

- 现有公共组件契约以当前远程已接受实现为准（`frontend/src/components/query-list/**`），本节不修改其 props / slots / emits / CSS。
- `QueryListResultPanel` 保持其**已验收的固定结构**：结果区头部 → 固定错误槽 → 固定分隔线 → `body` 主体槽。数据源表格放入 `body` 主体槽；“无分页”**只**表示 `body` 中不放分页组件，**不**删除固定错误槽与固定分隔线（`DS-REQ-123`/`136`）。

### 11.3 页面结构与结果区头部

- 三段结构：① 页面标题与一句话说明（`QueryListPageShell`）；② 查询条件区（`QueryListQueryPanel` + `QueryListActions`）；③ 结果列表区（`QueryListResultPanel`）。
- 结果区头部：左侧“数据源列表” + 当前结果数量；右侧“新增数据源”。
- 结果区**保留** `QueryListResultPanel` 固定结构：头部 → 固定错误槽 → 固定分隔线 → `body` 主体槽。`DataSourcePage.vue` 现有 `loadError` 对应的 `el-alert` 映射到**固定错误槽**，保留现有错误消息展示与关闭行为；数据源表格放入 `body` 主体槽；结果区**不增加**“双击数据行可编辑”提示行或其他辅助说明行。
- 不显示刷新倒计时、最近刷新时间或“立即刷新”；不显示“双击数据行可编辑”文案，但双击编辑保留（`DS-REQ-122`/`124`）。

### 11.4 角色查询条件与 API 参数设计

- 查询区在既有三个文本条件之外新增“角色”条件，控件固定为 Element Plus `el-select` **单选下拉框**（**不得**画成 Radio / 单选按钮组）；占位与默认显示“全部”；选项顺序与显示文本固定为：全部、源库、目标库，绑定值依次为空值、`SOURCE`、`TARGET`；控件宽度冻结为 `140px`（同一文档不得出现其他宽度）；宽屏顺序固定为：数据源 ID → 名称 → 角色 → 主机 → 查询 → 重置；窄屏响应式遵循 `QueryListQueryPanel` 已验收的整组换行规则，不单独发明本页断点或布局算法。查询提交当前角色值；重置后角色回到“全部”（`DS-REQ-125`/`127`）。
- 过滤使用规范化代码 `SOURCE`/`TARGET`，与既有 `DATA_SOURCE_CATEGORY` 大小写兼容比较复用（`DESIGN §7`、`DATABASE §4`）；**不**使用中文展示值作为数据库查询值。
- 角色与其他非空条件 **AND** 组合；文本条件继续遵守既有 trim 与忽略大小写包含规则。
- API 侧定义一个**可选**字符串查询参数 `category`（详细草案见 `API.md` §9）。归一化、校验与异常映射冻结为：
  1. 绑定完成后、Bean Validation 前归一化：先 `trim()`；`null` 或 trim 后空字符串统一转为 `null`（表示“全部”）；非空值**不自动转大写**，只接受精确大写 `SOURCE`/`TARGET`。
  2. 归一化为空值后，以**允许 `null`** 的字段约束校验非空值，例如 `@Pattern(regexp = "SOURCE|TARGET", message = "角色仅支持 SOURCE 或 TARGET")`；Bean Validation 对 `null` 不判失败，故“全部”合法。
  3. `GET` 请求中 `@ModelAttribute` 的绑定/字段校验错误按 **`BindException`** 处理，**不再**声称由 `MethodArgumentNotValidException` 承接。
  4. 改动边界冻结为在 `DataSourceController` 增加**功能局部**的 `@ExceptionHandler(BindException.class)`（与既有局部 `@ExceptionHandler(HttpMessageNotReadableException.class)` 同构），返回 HTTP `400` / `code=400` / 优先取 `category` 字段校验消息（无法提取字段消息时使用明确的通用参数错误消息），不泄露堆栈或内部细节；**不**扩大为全局异常处理器改造。
  5. **回归风险（须在实现阶段验证）**：`MethodArgumentNotValidException extends BindException`，而控制器局部 `@ExceptionHandler` 优先级高于 `@RestControllerAdvice`；该局部处理器必须保持既有请求体校验错误的字段级消息语义，不得回归。
  6. **不新增**业务错误码（既有 `40001` 按 `API.md` §5.2 仅用于新增/编辑请求体，不适用于列表查询参数）。
  7. 本条只冻结实现方案；本轮**不实际修改** `DataSourceQuery`、`DataSourceController` 或任何异常处理代码。
- **不引入任何数据库结构变化**（无 DDL、无新列、无索引/约束变化）。

### 11.5 主列表、操作列与删除

- 主列表列清单、默认排序（`DS-REQ-010` ID 升序）、有效记录范围、角色标签均保持既有结论（`DS-REQ-129`）。
- 移除每行可见“编辑”按钮；编辑入口只保留双击行（局部替代 `DS-REQ-013` 编辑项、`DS-REQ-014` 中“单击编辑按钮”表述；`DS-REQ-103` 适用前提随之变化）。
- 操作列只保留一个带文字的“更多”下拉：
  - 源库行：`目标库命名策略` / 分隔线 / 红色危险项 `删除`；
  - 目标库行：`业务属性` / 分隔线 / 红色危险项 `删除`；
  - 菜单不含“编辑”；菜单与下拉面板事件不冒泡触发双击编辑或其他行事件。
- 删除继续使用既有二次确认、并发阻断、错误提示与“仅删除主表记录”语义（`DS-REQ-091~097` 不变）；危险样式不改变删除业务语义。

### 11.6 无分页与几何稳定性

- 前后端继续不使用分页参数或分页交互，保持“记录总数不超过 100、一次加载全部”的已批准边界（`DS-REQ-005` 继续有效）；不因 `QueryListResultPanel.body` 支持承载分页而增加分页。“无分页”**只**表示 `body` 中不放分页组件，**不**意味着删除 `QueryListResultPanel` 的固定错误槽或固定分隔线。
- 首次加载与查询 Loading 期间，查询/重置按钮宽度四值同锁、结果卡片几何保持稳定，无跳变。
- 页面不提供自动刷新、手工刷新工具栏或“立即刷新”。

### 11.7 Tooltip 结论（保留既有机制）

- 当前主列表实现事实：数据源 ID、数据源名称、主机地址、Service Name/数据库名、用户名等列使用 Element Plus `show-overflow-tooltip`。
- 本轮**保留**该机制；**不删除、不弱化、不改变**，包括本轮范围外的命名策略弹窗 Tooltip。
- 迁移到公共单实例 Tooltip（`QueryListTooltipHost` + `useQueryListTooltip`）**未纳入本轮**：迁移会改变触发/延迟/单实例语义，属可观测行为变化，缺少充分必要性，故优先保留现有机制。

### 11.8 迁移授权与基线边界

- 查询列表页模板基线（`docs/baseline/query-list-page-template/`）面向**只读查询列表页**，其 `MIGRATION.md` §1.1 将“数据源管理（含新增/编辑/删除）”列为**不适合直接套用**，§5 将含 CRUD 的配置管理页面列为**不纳入迁移范围**，并给出“若后续确需统一视觉，应另立任务评估”的路径。
- 本轮为项目负责人于 **2026-09-18** 明确授权“数据源管理列表页选择性接入查询列表页公共组件”后，依据该“另立任务评估”路径发起的**页面范围化、行为不变**的选择性接入调整基线（2026-09-19 已获批）；非模板级“页面迁移”。
- 该授权与仍未实施的状态以**追加**方式记录于 `docs/baseline/query-list-page-template/MIGRATION.md`（不改写既有历史）；模板级 `page_migration_status`/`page_migration_authorization_status`/`pilot_page_selection_status` 维持 `NOT_STARTED`/`NOT_GRANTED`/`NOT_DECIDED` 不变，其他页面未获授权。

### 11.9 需求追踪（`DS-REQ-116~138`）

| 需求 | 设计落点 |
|---|---|
| DS-REQ-116 | §11.1、§11.8 |
| DS-REQ-117 | §11.1、§11.2 |
| DS-REQ-118 | §11.2 |
| DS-REQ-119 | §11.2、§11.6 |
| DS-REQ-120 | §11.1 |
| DS-REQ-121 | §11.3 |
| DS-REQ-122 | §11.3、§11.6 |
| DS-REQ-123 | §11.2、§11.3 |
| DS-REQ-124 | §11.3、§11.5 |
| DS-REQ-125 | §11.2、§11.4 |
| DS-REQ-126 | §11.4 |
| DS-REQ-127 | §11.4（重置语义沿用既有 `DS-REQ-009`，不套用模板默认） |
| DS-REQ-128 | §11.4 |
| DS-REQ-129 | §11.5 |
| DS-REQ-130 | §11.5 |
| DS-REQ-131 | §11.5 |
| DS-REQ-132 | §11.5 |
| DS-REQ-133 | §11.5 |
| DS-REQ-134 | §11.5 |
| DS-REQ-135 | §11.7 |
| DS-REQ-136 | §11.6 |
| DS-REQ-137 | §11.6 |
| DS-REQ-138 | §11.2、§11.8 |

## 12. 本轮调整变更记录

### 12.1 初版草案（2026-09-19，任务 `...-001`）

- 2026-09-19；
- 新增 §11「列表首页选择性接入查询列表页公共组件设计（`DRAFT_PENDING_USER_REVIEW`，未实现）」；
- §0~§10 既有 `APPROVED` 设计基线与追踪结论逐字冻结、未修改；
- 实现状态仍为 `NOT_STARTED`（本轮为纯文档草案，未修改任何 `.vue`/`.ts`/`.java`/测试/依赖/配置/SQL，未访问数据库/ZK/Kafka，未启动服务）；
- 本轮新增需求 `DS-REQ-116~138` 与本轮新增验收 `DS-AC-116~140` 均为 `NOT_RUN`；
- 既有正式复验统计 `PASS=113/FAIL=0/BLOCKED=2/NOT_RUN=0`（阻塞 `DS-AC-104`/`DS-AC-108`）逐字保留，未置 `IMPLEMENTED_ACCEPTED`；
- 依据任务 `DATA-SOURCE-LIST-PAGE-SELECTIVE-QUERY-LIST-INTEGRATION-BASELINE-001`。

### 12.2 R1 定向修订（2026-09-19，任务 `...-001-R1`）

- 2026-09-19；
- 修订范围仅限 ChatGPT 远程独立复审提出的四项问题，落在 §11.2、§11.3、§11.4、§11.6：
  1. §11.4：`category` 归一化/校验/异常映射冻结为“trim → 空转 `null` → 不自动转大写 → 允许 `null` 的 `@Pattern(regexp="SOURCE|TARGET")` → `BindException` → 控制器局部 `@ExceptionHandler(BindException.class)` 返回 HTTP 400 / `code=400` / 字段级消息”，并显式记录局部处理器优先级回归风险与“本轮不改代码”；
  2. §11.2/§11.3/§11.6：删除“头部下方直接进入表格”，明确保留 `QueryListResultPanel` 固定结构（头部 → 固定错误槽 → 固定分隔线 → `body`），`loadError` 的 `el-alert` 映射错误槽，且“无分页 ≠ 删除固定错误槽或分隔线”；
  3. §11.2/§11.4：角色条件明确为 `el-select` 单选下拉框、宽度 `140px`、禁止 Radio 画法，并冻结选项顺序、绑定值与宽屏排列顺序；
  4. 本节变更记录与 `REQUIREMENTS.md` §21、`ACCEPTANCE.md` §7、`API.md` §10、`UI.md` §10.7 的 R1 记录一致。
- §0~§10 既有 `APPROVED` 设计基线与 §11 其他小节结论未修改；`DS-REQ-116~138` 编号与数量（23 条）未变；
- 实现状态仍为 `NOT_STARTED`；本轮新增验收 `DS-AC-116~140` 仍全部为 `NOT_RUN`；既有统计 `PASS=113/FAIL=0/BLOCKED=2/NOT_RUN=0` 逐字保留；
- 依据任务 `DATA-SOURCE-LIST-PAGE-SELECTIVE-QUERY-LIST-INTEGRATION-BASELINE-001-R1`（纯文档修订；未修改任何业务代码/测试/依赖/配置/SQL；未访问数据库/ZK/Kafka；未启动服务）。

### 12.3 批准收口（2026-09-19，任务 `...-APPROVAL-CLOSEOUT-001`）

- 2026-09-19；
- 本轮调整设计基线由 `DRAFT_PENDING_USER_REVIEW` 收口为 `APPROVED`（`adjustment_design_status=APPROVED`、`adjustment_baseline_status=APPROVED`）；§11 章节标题与状态声明同步更新；§11.8 将“选择性接入草案”表述更新为“选择性接入调整基线（2026-09-19 已获批）”；
- 批准链：初版草案提交 `01680ee527b8e35cd4afd84c4789b862d34f7a77` → R1 修订提交 `c3fd460bea64a14ccc7b52a554194a133330e29d` → ChatGPT 远程 Git R1 复审结论 `REVIEW_PASS` → 项目负责人于 2026-09-19 明确回复“批准这轮调整基线”（批准任务 `DATA-SOURCE-LIST-PAGE-SELECTIVE-QUERY-LIST-INTEGRATION-APPROVAL-CLOSEOUT-001`）；
- 批准只代表设计正式成立，**不代表**已实现、已测试、已验收或生产可用：实现状态仍为 `NOT_STARTED`，实现授权仍为 `NOT_GRANTED_IN_THIS_TASK`，本轮新增验收 `DS-AC-116~140`（25 条）仍全部 `NOT_RUN`；
- §0~§10 既有 `APPROVED` 设计基线与追踪结论逐字冻结、未修改；§11.1~§11.7、§11.9 技术正文与 R1 冻结方案（`category` 归一化/校验/`BindException`、`QueryListResultPanel` 固定结构、角色 `el-select` `140px`、无分页/无刷新/Tooltip 保留）**零变化**；`DS-REQ-116~138` 数量（23 条）与编号未变；
- 模板级 `page_migration_status`/`page_migration_authorization_status`/`pilot_page_selection_status` 维持 `NOT_STARTED`/`NOT_GRANTED`/`NOT_DECIDED` 不变，其他页面未获授权；
- 既有统计 `PASS=113/FAIL=0/BLOCKED=2/NOT_RUN=0`（阻塞 `DS-AC-104`/`DS-AC-108`）与原始证据逐字保留；
- 依据任务 `DATA-SOURCE-LIST-PAGE-SELECTIVE-QUERY-LIST-INTEGRATION-APPROVAL-CLOSEOUT-001`（项目负责人批准驱动的调整基线批准收口；纯文档任务；未修改任何业务代码/测试/依赖/配置/SQL；未访问数据库/ZK/Kafka；未启动服务）。

### 12.4 实现状态回写（2026-09-19，任务 `DATA-SOURCE-LIST-PAGE-SELECTIVE-QUERY-LIST-INTEGRATION-IMPLEMENTATION-001`）

- 2026-09-19；
- §11 章节标题改为“（`APPROVED`，`IMPLEMENTED_PENDING_USER_REVIEW`）”，状态声明由 `implementation_status=NOT_STARTED`/`implementation_authorization_status=NOT_GRANTED_IN_THIS_TASK`/`acceptance_execution_status=ALL_NOT_RUN` 更新为 `implementation_status=IMPLEMENTED_PENDING_USER_REVIEW`/`implementation_authorization_status=GRANTED_IN_THIS_TASK`/`formal_acceptance_execution_status=NOT_RUN`/`new_adjustment_acceptance_status=ALL_NOT_RUN`（`adjustment_design_status`/`adjustment_baseline_status` 保持 `APPROVED`）；
- 实现按 §11 已批准设计执行：`QueryListPageShell`/`QueryListQueryPanel`/`QueryListActions`/`QueryListResultPanel` 选择性接入、结果区固定结构（头部 → 固定错误槽 → 固定分隔线 → `body`）、角色 `el-select` 单选下拉框 `140px`、`category` 归一化/校验/控制器局部 `BindException` 处理、无分页、无刷新工具栏、Tooltip 保留、行双击编辑与“更多”操作列；未接入 `QueryListRefreshToolbar`、未启用稳定滚动条槽；
- §11.1~§11.9 技术正文与 R1 冻结方案**零变化**；`DS-REQ-116~138` 数量（23 条）与编号未变；§0~§10 既有 `APPROVED` 设计基线与追踪结论逐字冻结、未修改；
- 实现状态为 `IMPLEMENTED_PENDING_USER_REVIEW`，**未**置为 `IMPLEMENTED_ACCEPTED`/生产可用；`DS-AC-116~140`（25 条）仍全部 `NOT_RUN`（`ALL_NOT_RUN`），正式验收执行状态 `NOT_RUN`；
- 模板级 `page_migration_status`/`page_migration_authorization_status`/`pilot_page_selection_status` 维持 `NOT_STARTED`/`NOT_GRANTED`/`NOT_DECIDED` 不变，其他页面未获授权；
- 既有统计 `PASS=113/FAIL=0/BLOCKED=2/NOT_RUN=0`（阻塞 `DS-AC-104`/`DS-AC-108`）与原始证据逐字保留；
- 依据任务 `DATA-SOURCE-LIST-PAGE-SELECTIVE-QUERY-LIST-INTEGRATION-IMPLEMENTATION-001`（已批准调整基线的前后端实现、自动化测试、构建与实现状态回写；未修改公共查询列表组件、数据库结构/数据/SQL/配置；未访问数据库/ZK/Kafka；未启动服务）。

## 13. 列表展示全部状态、启用/停用及视觉微调设计（`APPROVED`，`IMPLEMENTED_ACCEPTED`，正式验收已执行且最终验收已通过 `PASS=42/FAIL=0/BLOCKED=0/NOT_RUN=0`，`final_acceptance_status=ACCEPTED`）

> 本轮调整基线分层状态：`adjustment_document_status=APPROVED`、`adjustment_baseline_status=APPROVED`、`adjustment_design_status=APPROVED`、`implementation_status=IMPLEMENTED_ACCEPTED`、`final_acceptance_status=ACCEPTED`、`implementation_authorization_status=GRANTED_IN_THIS_TASK`、`formal_acceptance_execution_status=EXECUTED_PASSED_LOCAL`、`new_adjustment_acceptance_status=PASS_42_OF_42`（2026-09-20 由 `DATA-SOURCE-LIST-ALL-STATUS-ENABLE-DISABLE-UI-ADJUSTMENT-FORMAL-ACCEPTANCE-001` 在真实环境执行，并经项目负责人 2026-09-20 最终验收接受；该 `ACCEPTED` **仅**适用于本节当前调整设计）。
>
> 批准链（2026-09-19）：初版草案提交 `4ccd6610...` → R1 修订提交 `c4e1048...` → R2 极小修订提交 `aa906c0...` → ChatGPT 从远程 Git 复审 R2 提交 `aa906c0...` 结论 `REVIEW_PASS`（`blocking_finding_count=0`）→ 项目负责人 2026-09-19 明确回复“批准本轮调整基线” → 批准收口任务 `DATA-SOURCE-LIST-ALL-STATUS-ENABLE-DISABLE-UI-ADJUSTMENT-APPROVAL-CLOSEOUT-001`。批准对象为经初版、R1、R2 修订并由 ChatGPT 远程复审通过的**当前**调整基线，**非仅初版**；批准与实现只代表设计基线正式成立且已落地，**不代表**已测试、已验收或生产可用。
>
> 任务：`DATA-SOURCE-LIST-ALL-STATUS-ENABLE-DISABLE-UI-ADJUSTMENT-BASELINE-001`（`task_type=FEATURE_ADJUSTMENT_BASELINE`，纯文档任务）。
>
> 实现任务：`DATA-SOURCE-LIST-ALL-STATUS-ENABLE-DISABLE-UI-ADJUSTMENT-IMPLEMENTATION-001`（2026-09-19）；实现授权 `GRANTED_IN_THIS_TASK`。正式验收任务：`DATA-SOURCE-LIST-ALL-STATUS-ENABLE-DISABLE-UI-ADJUSTMENT-FORMAL-ACCEPTANCE-001`（2026-09-20）；最终验收收口任务：`DATA-SOURCE-LIST-ALL-STATUS-ENABLE-DISABLE-UI-ADJUSTMENT-FINAL-ACCEPTANCE-CLOSEOUT-001`（2026-09-20，实现状态 `IMPLEMENTED_ACCEPTED`、`final_acceptance_status=ACCEPTED`），`DS-AC-141~182`（42 条）已由 `NOT_RUN` 更新为 `PASS`（`PASS=42/FAIL=0/BLOCKED=0/NOT_RUN=0`）。本节 §13.0~§13.9 设计结论**逐字未变**，仅状态分层随正式验收执行与最终验收接受更新。
>
> 本节冻结**设计结论**；关联需求 `DS-REQ-139~177`，关联验收 `DS-AC-141~182`。§0~§12 既有结论**逐字冻结**；本节对旧结论的替代一律通过 §13.0 的“局部替代声明”显式给出边界，未声明替代的旧规则继续有效。

### 13.0 局部替代声明清单

| # | 被替代的既有结论 | 替代需求 | 替代边界（只替代这些；其余继续有效） |
|---|---|---|---|
| 1 | `DS-REQ-009`/`DS-REQ-127`“重置后立即恢复全部有效记录” | `DS-REQ-139`/`DS-REQ-140` | 只替代“重置即发起查询”的部分；控件清空（三文本条件清空、角色恢复“全部”）继续有效；模板默认“重置不查询”由此成为本 Feature 当前有效语义 |
| 2 | `DS-REQ-123`“结果区头部左侧为‘数据源列表’与当前结果数量” | `DS-REQ-141` | 只替代头部文字；`QueryListResultPanel` 固定结构、`loadError` 映射固定错误槽、不增加辅助说明行的结论继续有效 |
| 3 | `DS-REQ-011`/`DS-REQ-129` 的“第一列为数据源 ID”隐含列顺序与“保留当前列清单” | `DS-REQ-142`/`DS-REQ-143` | 只替代“新增序号列作为第一列”；既有各列列身份与默认 `DATA_SOURCE_ID ASC` 排序继续有效 |
| 4 | `DS-REQ-002`“其他值（包括 `'0'`）全部视为不存在”中的列表查询范围 | `DS-REQ-150` | 只替代“列表查询与展示只触及 `FG_ACTIVE='1'`”；详情/编辑/删除等“不存在”语义另由第 5 条处理 |
| 5 | `DS-REQ-012`“列表不得展示 `FG_ACTIVE`”的排他性 | `DS-REQ-152`~`DS-REQ-154` | 只替代为“API 返回原始 `fgActive`，页面在数据源 ID 列内以标识表达状态”；“不新增独立状态列”继续有效 |
| 6 | `DS-REQ-002`/`DS-REQ-091` 中“主记录非 `'1'` 即视为不存在”，适用于详情/编辑/删除/业务属性/源库命名策略/编辑态连接测试 | `DS-REQ-155`~`DS-REQ-159` | 只替代为“`FG_ACTIVE='0'` 时上述读/写维护不再返回 `40400`”；目标库候选、其他 Feature 候选、角色校验、密码保护、命名策略唯一性、删除业务语义继续有效 |
| 7 | `DS-REQ-132`“源库/目标库行‘更多’菜单只有业务入口与红色删除” | `DS-REQ-163`~`DS-REQ-167` | 只替代为“在业务入口与红色删除之间插入状态相关的启用/停用项，且异常行菜单收敛为只有归一化停用”；业务入口身份、删除为最后一项且红色危险、菜单不含“编辑”继续有效 |
| 8 | `DS-REQ-003`“页面不提供启用/停用操作”与 `DS-REQ-091`“目标设计不提供启用/停用能力” | `DS-REQ-168`~`DS-REQ-173` | 只替代为“提供逐行启用/停用，并由两个独立接口只更新主表 `FG_ACTIVE`”；旧分页/一对一 EXTEND 语义删除的结论、删除业务语义继续有效 |
| 9 | `DS-REQ-118`“`toolbar` 槽承载‘新增数据源’按钮”的默认蓝色视觉效果 | `DS-REQ-174` | 只替代视觉样式；槽位归属、位置、业务流程与点击行为继续有效 |

> 未列出的既有规则**继续有效**，文档不得出现两套互相冲突的“当前有效结论”。

### 13.1 列表查询与状态派生（后端）

- **查询范围**：主列表查询移除 `FG_ACTIVE='1'` 固定过滤条件，返回 `CDC_DATA_SOURCE` 的**全部记录**；其余查询条件（数据源 ID / 数据源名称 / 主机地址的忽略大小写模糊包含、角色 `category` 的规范化代码过滤、AND 组合、先 trim）**完全不变**（`DS-REQ-007`/`008`/`126` 继续有效）。
- **排序**：仍为 `wrapper.orderByAsc(DataSource::getDataSourceId)`，即 `DATA_SOURCE_ID ASC`（`DS-REQ-010`/`DS-REQ-144`）。
- **分页**：仍无分页，一次加载全部（`DS-REQ-005`/`DS-REQ-175`）。
- **响应字段**：`DataSourceListVO` 需**新增** `fgActive` 字段以返回原始值（`DS-REQ-154`）。除此之外**不新增**任何列表响应字段；不得把状态派生为新的响应字段或独立“状态”列。
- **状态派生（仅前端展示语义，不由后端二次解释）**：
  - `fgActive` 原值为 `'1'` → 启用；无附加标识。
  - 原值为 `'0'` → 停用；显示“停用”标识。
  - 原值为 `NULL` 或非 `'0'`/`'1'` → 异常；显示 `异常（原始值=…）`，`NULL` 时明确显示 `NULL`。
  - **后端不得**把 `NULL`/非 `0`/`1` 静默归一化为 `'0'` 或 `'1'`；不得在响应中做状态折叠。
- **列表页不触发任何运行态查询**：列表接口不访问源库、不访问 ZooKeeper/Kafka、不读取进程状态。

### 13.2 结果区头部、序号列与列宽（前端）

- **头部**：结果区左上角只渲染 `共 n 条`；`n` 取当前已加载结果数组长度；删除“数据源列表”文字。`QueryListResultPanel` 固定结构（头部 → 固定错误槽 → 固定分隔线 → `body`）与 `loadError` 映射**不变**（`DS-REQ-123` 继续有效）。
- **序号列**：表格第一列为 Feature 自有的“序号”列，取 `index + 1`；固定窄宽、单元格内容居中；**不参与**列数据绑定、不进入请求参数与响应字段、不改变默认排序；排序相关状态**不因**该列变化。
- **主机列**：相对调整前缩窄“主机”列宽；`show-overflow-tooltip` 继续作用与主机列，被省略内容仍可悬停查看完整值；主机字段的取值、长度与校验规则不变。
- **列清单不变**：数据源 ID、数据源名称、角色、类型、主机、端口、Service Name、用户名、操作列的列身份不变；**不新增**独立“状态”列（`DS-REQ-154`）。

### 13.3 视觉对齐（行高、字体、角色标签）

以“源库快照状态”页面（`/monitor/data-source-state`）最终实现为唯一视觉参照：

| 对齐项 | 参照目标 | 设计结论 |
|---|---|---|
| 行高与基础字号/字重 | 该页表格行高、表头 `.cell`（`12px`/`600`/中性灰）与正文基础字号/字重 | 数据源列表对齐该参照；**不再**使用调整前偏紧凑、偏小、偏淡的效果（`DS-REQ-146`） |
| “数据源 ID”正文 | 该页“探针端”列的主值样式（更重字重 + 等宽字体族特征 + 等宽数字） | 数据源 ID 正文使用与“探针端”一致的清晰字体效果（`DS-REQ-147`） |
| “源库/目标库”角色标签 | 该页“快照状态”标签（固定高度、内边距、无边框、固定圆角、`12px`/`600`） | 清晰度、字号、字重参考该标签；**保留**标签形态与源库/目标库可区分颜色（`DS-REQ-148`） |

- **作用域约束**：所有覆盖必须**局部作用**于数据源管理列表页（页面根作用域的 `--ql-*` 令牌覆盖 + 页面级 class）；**禁止**写入 `:root`、禁止修改公共组件、禁止影响 `QueryListPageShell`/`QueryListQueryPanel`/`QueryListActions`/`QueryListResultPanel` 的默认外观或其他路由（`DS-REQ-149`/`DS-REQ-138`）。
- **禁止**在“源库快照状态”页面侧做任何改动来“配合”本轮视觉调整。

### 13.4 停用/异常记录的操作矩阵

| 操作 | `FG_ACTIVE='1'`（启用） | `FG_ACTIVE='0'`（停用） | `NULL`/非 `0`/`1`（异常） |
|---|---|---|---|
| 列表可见 | 可见，无标识 | 可见，行内“停用”标识 | 可见，行内 `异常（原始值=…）` |
| 双击编辑 | 允许 | **允许**（`DS-REQ-155`） | **禁止**（`DS-REQ-162`） |
| 保存后状态 | 保持 `'1'` | **保持 `'0'`**，不自动启用 | 不适用（无编辑入口） |
| 删除 | 允许 | **允许**（物理删除） | **禁止**，须先停用归零 |
| 业务属性（仅目标库） | 允许 | **允许** | **禁止** |
| 源库命名策略（仅源库） | 允许 | **允许** | **禁止** |
| 编辑态连接测试 | 允许 | **允许** | 不适用（无编辑入口） |
| 菜单“启用” | 不显示 | **显示** | **禁止**显示（须先归零） |
| 菜单“停用” | **显示** | 不显示 | **显示**（唯一写入口，用于归一化） |
| 是否可作为其他 Feature 候选 | 是 | **否** | **否** |

- 前端按上表**隐藏或禁用**不允许的入口；**后端仍必须独立校验**，不得依赖前端（`DS-REQ-158`/`DS-REQ-162`）。
- 停用记录的编辑**不得提供**任何修改 `FG_ACTIVE` 的入口；状态只能通过 §13.5 的独立接口改变（`DS-REQ-176`）。

### 13.5 启用/停用后端设计（`DS-REQ-168`~`DS-REQ-173`）

**接口**

| 方法 | 路径 | 作用 |
|---|---|---|
| `PUT` | `/api/data-sources/{dataSourceId}/enable` | 只把目标主表记录 `FG_ACTIVE` 写为 `'1'` |
| `PUT` | `/api/data-sources/{dataSourceId}/disable` | 只把目标主表记录 `FG_ACTIVE` 写为 `'0'` |

**状态机（冻结）**

| 接口 | 当前 `FG_ACTIVE` | 行为 | 结果 |
|---|---|---|---|
| `enable` | `'0'` | 写入 `'1'` | 成功 |
| `enable` | `'1'` | 不写入 | **幂等成功**（重复目标状态） |
| `enable` | `NULL` / 非 `0`/`1` | 拒绝 | `40250`（非法状态），**不写库** |
| `disable` | `'1'` | 写入 `'0'` | 成功 |
| `disable` | `'0'` | 不写入 | **幂等成功**（重复目标状态） |
| `disable` | `NULL` / 非 `0`/`1` | 写入 `'0'` | 成功（归一化） |

**读取、事务与写入边界（冻结）**

- **两个接口都先读取**：`enable` 与 `disable` 均在事务内**先按 `DATA_SOURCE_ID` 读取主表当前记录及其原始 `FG_ACTIVE`**，**不**按 `FG_ACTIVE='1'` 过滤。记录不存在 → `40400`，**不执行 DML**。只读取本表该记录，**不访问**源库，**不访问** ZooKeeper/Kafka，**不操作**进程；**不加锁**、**不新增**版本字段。
- **最多一条 `UPDATE`**：**每次非幂等状态变更最多执行一条 `UPDATE`；允许在 `UPDATE` 前执行状态读取**。不得写成接口全程只有一条 SQL。
- **条件 `UPDATE`**：非幂等路径的 `UPDATE` **必须带原状态条件**，同时匹配 `DATA_SOURCE_ID` 与**本事务开始时读取到的原始 `FG_ACTIVE`**（`NULL` 须正确匹配，见等价伪 SQL `DATABASE.md` §9.3）。**不得**退化为无状态条件的 `UPDATE ... WHERE DATA_SOURCE_ID=?`——后者会破坏“当前已为 `'0'` 时不执行 DML”的幂等约束，也无法防止读取后状态变化造成旧请求覆盖新状态。
- 只更新 `CDC_DATA_SOURCE.FG_ACTIVE` 一列；**不修改**任何其他字段；**不级联**修改或删除 `CDC_DATA_SOURCE_EXTEND`、客户端、订阅及任何其他表（`DS-REQ-168`/`DS-REQ-169`）。
- **不访问**源库；**不操作**进程、ZooKeeper 或 Kafka；成功提示**不得**声称进程已启动/停止或配置已实时生效（`DS-REQ-169`）。
- **影响行数与并发（完全冻结）**：非幂等路径的条件 `UPDATE` 影响行数为 `1` → 成功；**影响行数不为 `1`（包括读取后被其他请求改变而导致 `0` 行）→ `50002`，当前事务回滚**。**不**在本轮引入重试、再次读取后改判成功、悲观锁、乐观版本字段或新的错误码。重复目标状态**只有**在本事务首次读取时已经处于目标状态，才按幂等成功处理。并发相反请求的最终数据库状态允许为其中一个请求的目标值；发生条件 `UPDATE` 冲突的请求返回 `50002`。**不加锁**、**不使用**乐观版本字段（`DS-REQ-171`）。

**错误码（冻结）**

| 场景 | 结果 |
|---|---|
| 目标主表记录不存在 | `40400`（复用既有 `notFound`），事务内**无任何写入** |
| 非法状态（仅 `enable` 遇到 `NULL`/非 `0`/`1`） | `40250`（**本轮新增业务码**，语义：目标记录状态非法，不可启用） |
| 重复目标状态（`enable` 遇到 `'1'`、`disable` 遇到 `'0'`） | **成功**，不写库、不返回错误 |
| `UPDATE` 影响行数 ≠ 1（含读取后状态被其他请求改变导致 `0` 行） | `50002`（`STATUS_FAILED`，复用既有语义并**恢复启用**该码），事务**回滚**，不留中间状态 |
| 其他保存类失败 | 沿用既有 `50000`（`SAVE_FAILED`）语义 |

> `50002` 在 `API.md` §5.2 既有“已废弃”表中被标注为“启用/停用能力移除（`DS-REQ-003`/`091`）”；本轮因能力恢复而**恢复启用**该码，`API.md` §5.2 需同步作局部替代说明。
> `40250` 为本轮**唯一**新增业务码；除该码外**不新增**其他错误码，`40400`/`50000` 为复用。

**前端消息处理（冻结）**

- `40400` → 提示目标数据源不存在；**不刷新列表**。
- `40250` → 提示该记录状态异常、只能先停用归一化；**不刷新列表**。
- `50002`/`50000` → 提示操作失败、请重试；**不刷新列表**。
- **任何启停失败（含网络失败、`40400`、`40250`、`50002`、`50000` 或其他业务错误）均不自动重新查询**，一律**保留**当前列表、结果总数与已应用查询条件并**恢复 busy**（`DS-REQ-173`/`DS-AC-177`）；**只有成功**才按当前已应用查询条件重新查询。
- 成功提示只陈述“状态已更新”，不得声称进程或配置已生效。

### 13.6 前端启用/停用交互设计

- **动态菜单**：按 §13.4 与 `DS-REQ-167` 冻结的菜单结构渲染；启用/停用项位于“删除”**之前**，“删除”为最后一项且红色危险；“启用”为普通操作样式；“停用”为警示色且与红色“删除”可区分。
- **防冒泡**：下拉触发器、菜单项与确认框的事件链**必须**阻止冒泡到行级双击编辑与其他行事件（与 `DS-REQ-134` 既有机制一致）。
- **二次确认**：启用与停用**均**弹出确认框，文案明确包含**数据源 ID** 与**目标动作**。
- **行级 busy 与重复提交防护**：按行维护操作中状态（沿用既有 `deletingId` 式单值/行键守卫模式），同一行操作进行中时禁用该行的启停与删除入口，避免重复提交。
- **成功/失败处理**：**只有成功**才按**当前已应用查询条件**重新查询（不读取尚未点击“查询”的草稿条件）；因列表展示全部状态，停用成功后该行**仍保留**并出现“停用”标识，启用成功后标识消失；**任何失败均不自动重新查询**，保留当前列表、结果总数与已应用条件、恢复 busy、显示明确错误（`DS-REQ-173`/`DS-AC-177`）。
- **样式作用域**：所有新增样式局部作用于数据源页面，不写入 `:root`，不影响公共组件与其他路由。

### 13.7 “新增数据源”按钮视觉设计

- 删除 Element Plus 默认 `type="primary"` 蓝色视觉；改为**黑色实心主按钮**，与页面“查询”按钮使用同一黑白灰视觉语言：默认底色/边框使用与 `QueryListActions` 查询按钮一致的深色值、白色文字、hover 略浅深灰、active 再加深。
- **保留**前置加号图标；尺寸与圆角与公共查询列表页规范一致（复用既有 `--ql-actions-*` 令牌语义或等值常量，不在 `:root` 定义）。
- **不改变**按钮位置、槽位归属（仍在 `QueryListResultPanel` 的 `toolbar` 槽）与新增业务流程。

### 13.8 明确不变项

- 不分页（`DS-REQ-005`/`136`/`175`）；不接入 `QueryListRefreshToolbar`，不增加自动刷新、立即刷新或最近刷新时间（`DS-REQ-119`/`122`）；不启用稳定滚动条槽（`scrollbar-gutter: stable` 仍只对 `/monitor/data-source-state` 生效）。
- 保留当前 Tooltip 机制，本轮**不迁移**公共单实例 Tooltip（`DS-REQ-135`）。
- 角色查询仍为 `el-select` 单选、宽度 `140px`（`DS-REQ-125`）；双击仍是唯一编辑入口，“更多”菜单不增加“编辑”（`DS-REQ-130`/`131`）。
- 三个既有业务弹窗的布局、字段、宽度与视觉**不做**重新设计；仅为支持停用记录维护而调整**必要的**读/写状态边界（`DS-REQ-176`）。
- 新增记录仍默认写 `FG_ACTIVE='1'`；**编辑不得修改** `FG_ACTIVE`；物理删除语义不变，不改为逻辑删除（`DS-REQ-176`）。
- **零 DDL、零存量数据清洗**；不新增表、字段、索引、约束、序列或视图（`DS-REQ-177`）。

### 13.9 需求追踪（`DS-REQ-139~177`）

| 需求 | 设计落点 |
|---|---|
| DS-REQ-139、DS-REQ-140 | §13.0（#1）、§13.10 |
| DS-REQ-141 | §13.0（#2）、§13.2 |
| DS-REQ-142、DS-REQ-143、DS-REQ-144 | §13.0（#3）、§13.2 |
| DS-REQ-145 | §13.2 |
| DS-REQ-146、DS-REQ-147、DS-REQ-148、DS-REQ-149 | §13.3 |
| DS-REQ-150 | §13.0（#4）、§13.1 |
| DS-REQ-151、DS-REQ-152、DS-REQ-153、DS-REQ-154 | §13.0（#5）、§13.1 |
| DS-REQ-155、DS-REQ-156、DS-REQ-157、DS-REQ-158、DS-REQ-159 | §13.0（#6）、§13.4 |
| DS-REQ-160、DS-REQ-161、DS-REQ-162 | §13.4、§13.5 |
| DS-REQ-163、DS-REQ-164、DS-REQ-165、DS-REQ-166、DS-REQ-167 | §13.0（#7）、§13.6 |
| DS-REQ-168、DS-REQ-169、DS-REQ-170、DS-REQ-171、DS-REQ-172、DS-REQ-173 | §13.0（#8）、§13.5、§13.6 |
| DS-REQ-174 | §13.0（#9）、§13.7 |
| DS-REQ-175、DS-REQ-176、DS-REQ-177 | §13.8 |

### 13.10 重置语义设计（`DS-REQ-139`/`DS-REQ-140`）

- 重置只把查询控件恢复到缺省状态（三个文本条件清空、`category` 恢复“全部”），**不调用**列表接口、**不改变** `effectiveQuery`/已应用条件快照、**不改变**当前表格、结果总数与错误展示。
- 现有实现中“重置后立即 `loadList(effectiveSnapshot())`”的行为由此被本设计替代。
- 用户点击“查询”时才按当前控件值构造并应用条件发起一次查询。首次进入页面的默认查询行为不变。

## 14. 本轮调整变更记录

### 14.1 初版草案（2026-09-19，任务 `DATA-SOURCE-LIST-ALL-STATUS-ENABLE-DISABLE-UI-ADJUSTMENT-BASELINE-001`）

- 2026-09-19；
- 新增 §13「列表展示全部状态、启用/停用及视觉微调设计（`DRAFT_PENDING_USER_REVIEW`，未实现）」与本节；§1.2 表后新增“本轮新草案局部替代提示”指向 §13；
- 分层状态：`adjustment_document_status=DRAFT_PENDING_USER_REVIEW`、`adjustment_baseline_status=DRAFT_PENDING_USER_REVIEW`、`implementation_status=NOT_STARTED`、`implementation_authorization_status=NOT_GRANTED_IN_THIS_TASK`、`formal_acceptance_execution_status=NOT_RUN`、`new_adjustment_acceptance_status=ALL_NOT_RUN`；
- §13.0 以九条“局部替代声明”逐项冻结对既有结论的替代边界（重置后立即查询、结果区“数据源列表”、原列清单与无序号列、列表固定 `FG_ACTIVE='1'`、不得展示 `FG_ACTIVE`、非启用记录视为不存在、“更多”菜单只有业务入口与删除、页面不提供启用/停用、新增按钮默认蓝色）；
- §13.5 冻结启停接口、状态机（`enable` 只接受 `'0'`；`disable` 接受 `'1'` 并接受异常归一化为 `'0'`；重复目标状态幂等成功）、事务与写入边界（单条主表 `UPDATE`、不级联、不访问外部系统）、并发结论（不加锁、最终收敛、不承诺至多一次成功）、错误码（复用 `40400`、新增 `40250`、恢复 `50002`）与前端消息处理；
- §0~§12 既有 `APPROVED` 设计基线与 §11 追踪结论逐字冻结、未修改；`DS-REQ-001~138` 编号与正文未改；
- 本轮新增需求 `DS-REQ-139~177`（39 条）与本轮新增验收 `DS-AC-141~182`（42 条）全部为 `NOT_RUN`；上一轮 `DS-AC-116~140`（25 条）仍全部 `NOT_RUN`，未混入本轮统计；
- 既有正式复验统计 `PASS=113/FAIL=0/BLOCKED=2/NOT_RUN=0`（阻塞 `DS-AC-104`/`DS-AC-108`）逐字保留，未置 `IMPLEMENTED_ACCEPTED`；
- 本轮为纯文档草案：未修改任何 `.java`/`.vue`/`.ts`/测试/依赖/配置/SQL/锁文件，未访问数据库/ZK/Kafka，未启动服务，未运行 Maven/npm 测试或构建。

### 14.2 R1 定向修订（2026-09-19，任务 `DATA-SOURCE-LIST-ALL-STATUS-ENABLE-DISABLE-UI-ADJUSTMENT-BASELINE-001-R1`）

- 依据 ChatGPT 对远程提交 `4ccd6610...` 的 R1 复审结论 `CHANGES_REQUIRED`（3 类阻塞问题），只做对应最小修订；§13.0 九条局部替代声明、状态机与 UI 决策**不变**。
- **§13.5 事务与写入边界重写**：明确两个接口均**先读取**当前记录及原始 `FG_ACTIVE`（不按 `FG_ACTIVE='1'` 过滤；不存在 → `40400` 不写库；不访问源库/ZK/Kafka、不操作进程、不加锁）；“单条 `UPDATE` 短事务”修正为“**每次非幂等状态变更最多执行一条 `UPDATE`，允许 `UPDATE` 前先读取**”；非幂等路径 `UPDATE` **必须带原状态条件**（`DATA_SOURCE_ID` + 事务首次读取的原始 `FG_ACTIVE`，含 `NULL`），**不得**退化为无状态条件 `UPDATE ... WHERE DATA_SOURCE_ID=?`。
- **§13.5 影响行数与并发完全冻结**：影响行数 ≠ 1（含读取后被改变导致 `0` 行）→ `50002` 回滚；不引入重试/悲观锁/乐观版本/新错误码；重复目标状态仅在首次读取已处于目标状态时幂等成功；并发冲突请求返回 `50002`；错误表 `50002` 行同步明确“含读取后被改变导致 `0` 行”。
- **§13.5 前端消息处理与 §13.6 成功/失败处理统一**：删除“`40400`/`40250` 后刷新列表”，改为**任何启停失败均不自动重新查询**，保留当前列表、结果总数与已应用条件并恢复 busy；**只有成功**才按当前已应用查询条件重新查询（`DS-REQ-173`/`DS-AC-177`）。
- `DS-REQ-001~177` 编号与正文零变化；本轮草案状态仍为 `DRAFT_PENDING_USER_REVIEW`、`implementation_status=NOT_STARTED`、`implementation_authorization_status=NOT_GRANTED_IN_THIS_TASK`、`new_adjustment_acceptance_status=ALL_NOT_RUN`；未修改任何业务代码/测试/依赖/配置/SQL，未访问数据库/ZK/Kafka，未启动服务。

### 14.3 批准收口（2026-09-19，任务 `DATA-SOURCE-LIST-ALL-STATUS-ENABLE-DISABLE-UI-ADJUSTMENT-APPROVAL-CLOSEOUT-001`）

- 2026-09-19；
- §13 章节标题由“（`DRAFT_PENDING_USER_REVIEW`，未实现）”收口为“（`APPROVED`，未实现）”；分层状态 `adjustment_document_status`/`adjustment_baseline_status` 由 `DRAFT_PENDING_USER_REVIEW` 收口为 `APPROVED`，并同步 `adjustment_design_status=APPROVED`（`implementation_status`/`implementation_authorization_status`/`formal_acceptance_execution_status`/`new_adjustment_acceptance_status` 保持 `NOT_STARTED`/`NOT_GRANTED_IN_THIS_TASK`/`NOT_RUN`/`ALL_NOT_RUN`）；
- 记录完整批准链：初版草案提交 `4ccd6610...` → R1 修订提交 `c4e1048...` → R2 极小修订提交 `aa906c0...` → ChatGPT 远程 Git 复审 R2 提交 `aa906c0...` 结论 `REVIEW_PASS`（`blocking_finding_count=0`）→ 项目负责人 2026-09-19 明确回复“批准本轮调整基线” → 批准收口任务 `DATA-SOURCE-LIST-ALL-STATUS-ENABLE-DISABLE-UI-ADJUSTMENT-APPROVAL-CLOSEOUT-001`；
- §1.2 表后“本轮新草案局部替代提示”改标为“本轮已批准调整基线局部替代提示（§13，`APPROVED`）”；
- §13.0~§13.6 设计正文（含 R1 冻结的先读、幂等不写、NULL-safe 原状态条件 `UPDATE`、并发 `50002`、失败不刷新）**零变化**；§0~§12 既有 `APPROVED` 设计基线与 §11 追踪结论逐字冻结；
- `DS-REQ-001~177` 编号与正文零变化；本轮新增验收 `DS-AC-141~182`（42 条）仍全部 `NOT_RUN`，上一轮 `DS-AC-116~140`（25 条）仍全部 `NOT_RUN`；既有 `PASS=113/FAIL=0/BLOCKED=2/NOT_RUN=0`（阻塞 `DS-AC-104`/`DS-AC-108`）逐字保留；
- 批准只代表设计基线正式成立，**不代表**已实现、已测试、已验收或生产可用；实现须**另行**授权并使用独立任务；未修改任何业务代码/测试/依赖/配置/SQL，未访问数据库/ZK/Kafka，未启动服务。

### 14.4 实现状态回写（2026-09-19，任务 `DATA-SOURCE-LIST-ALL-STATUS-ENABLE-DISABLE-UI-ADJUSTMENT-IMPLEMENTATION-001`）

- §13 章节标题由“（`APPROVED`，未实现）”更新为“（`APPROVED`，`IMPLEMENTED_PENDING_USER_REVIEW`）”；分层状态由 `implementation_status=NOT_STARTED`/`implementation_authorization_status=NOT_GRANTED_IN_THIS_TASK` 更新为 `IMPLEMENTED_PENDING_USER_REVIEW`/`GRANTED_IN_THIS_TASK`，并补充实现任务号（`adjustment_document_status`/`adjustment_baseline_status`/`adjustment_design_status` 保持 `APPROVED`，`formal_acceptance_execution_status=NOT_RUN`、`new_adjustment_acceptance_status=ALL_NOT_RUN` 保持）；
- 实现按 §13 已批准设计执行：列表返回并展示 `CDC_DATA_SOURCE` 全部状态与原始 `FG_ACTIVE`；维护边界由 `FG_ACTIVE='1'` 放宽为精确 `FG_ACTIVE IN ('1','0')`；异常记录只允许显式“停用”归一化；逐行启用/停用菜单 + 二次确认 + 行级 busy；新增 `PUT /api/data-sources/{id}/enable`、`PUT /api/data-sources/{id}/disable` 两个接口，严格实现 §13.5 冻结的先读、幂等不写、NULL-safe 原状态条件 `UPDATE`、影响行数 ≠ 1 → `50002` 回滚、失败不刷新列表；
- §13.0~§13.6 设计正文（含 R1 冻结方案与 R2 极小修订）**零变化**；§0~§12 既有 `APPROVED` 设计基线与 §11 追踪结论逐字冻结；
- `DS-REQ-139~177` 数量（39 条）与编号未变；本轮新增验收 `DS-AC-141~182`（42 条）仍全部 `NOT_RUN`，上一轮 `DS-AC-116~140`（25 条）仍全部 `NOT_RUN`；既有 `PASS=113/FAIL=0/BLOCKED=2/NOT_RUN=0`（阻塞 `DS-AC-104`/`DS-AC-108`）逐字保留；
- 实现状态为 `IMPLEMENTED_PENDING_USER_REVIEW`，**未**置为 `IMPLEMENTED_ACCEPTED`/`ACCEPTED`/生产可用；正式验收执行状态 `NOT_RUN`；未访问数据库/ZK/Kafka（含自动化测试），未对数据库执行任何 DDL/DML，未启动/停止/重启任何服务。

### 14.5 正式验收执行与状态回写（2026-09-20，任务 `DATA-SOURCE-LIST-ALL-STATUS-ENABLE-DISABLE-UI-ADJUSTMENT-FORMAL-ACCEPTANCE-001`）

- 依据项目负责人 2026-09-20 授予的正式验收执行授权（含 `database_write_approval_status=GRANTED_FOR_R2`），在真实后端 + 真实 Oracle 开发库 + 真实浏览器 + 受控验收数据（`RUN_TAG=FACC001`）下执行 `DS-AC-141~182` 共 42 条。
- **§13 标题与状态块更新**：标题更新为「（`APPROVED`，`IMPLEMENTED_PENDING_FINAL_ACCEPTANCE`，正式验收已执行 `PASS=42/FAIL=0/BLOCKED=0/NOT_RUN=0`）」；`implementation_status` 由 `IMPLEMENTED_PENDING_USER_REVIEW` 更新为 `IMPLEMENTED_PENDING_FINAL_ACCEPTANCE`，`formal_acceptance_execution_status` 由 `NOT_RUN` 更新为 `EXECUTED_PASSED_LOCAL`，`new_adjustment_acceptance_status` 由 `ALL_NOT_RUN` 更新为 `PASS_42_OF_42`；`adjustment_document_status`/`adjustment_baseline_status`/`adjustment_design_status` 仍为 `APPROVED`。
- **§13.0~§13.9 设计正文（含 R1 冻结方案与 R2 极小修订）逐字零变化**：`DS-REQ-139~177`（39 条）编号与正文未改；`DS-AC-001~182` 编号、关联需求、前置条件、操作步骤、预期结果零变化，仅 `DS-AC-141~182` 状态列由 `NOT_RUN` 更新为 `PASS`。
- 既有正式复验统计 `PASS=113/FAIL=0/BLOCKED=2/NOT_RUN=0`（阻塞 `DS-AC-104`/`DS-AC-108`）**逐字保留**；上一轮 `DS-AC-116~140`（25 条）仍全部 `NOT_RUN`；实现状态**未**置为 `IMPLEMENTED_ACCEPTED`/`ACCEPTED`/生产可用，正式验收执行通过**不等于**最终验收通过。
- 本任务未修改任何业务代码/测试/配置/依赖/锁文件/SQL/DDL；数据库仅执行 R2 批准的受控写入与清理（残留 `0`、既有数据字节级未变）、未执行 DDL；ZooKeeper 只读、无 Kafka、未访问业务源库/目标库；临时验收服务已按精确 PID 停止。报告见 `reports/DATA-SOURCE-LIST-ALL-STATUS-ENABLE-DISABLE-UI-ADJUSTMENT-FORMAL-ACCEPTANCE-001.md`。

### 14.6 最终验收接受与状态回写（2026-09-20，任务 `DATA-SOURCE-LIST-ALL-STATUS-ENABLE-DISABLE-UI-ADJUSTMENT-FINAL-ACCEPTANCE-CLOSEOUT-001`）

- 依据 ChatGPT 对远程证据提交 `30e902f7c2c3de62b7a7ff454fa25a4cef74fdfa` 的正式验收 R1 复审结论 `review_status=REVIEW_PASS`、`blocking_finding_count=0`；项目负责人据此于 2026-09-20 作出**最终验收接受**决定。
- **§13 标题与状态块更新**：标题更新为「（`APPROVED`，`IMPLEMENTED_ACCEPTED`，正式验收已执行且最终验收已通过 `PASS=42/FAIL=0/BLOCKED=0/NOT_RUN=0`，`final_acceptance_status=ACCEPTED`）」；`implementation_status` 由 `IMPLEMENTED_PENDING_FINAL_ACCEPTANCE` 更新为 `IMPLEMENTED_ACCEPTED`，并新增 `final_acceptance_status=ACCEPTED`；`formal_acceptance_execution_status=EXECUTED_PASSED_LOCAL`、`new_adjustment_acceptance_status=PASS_42_OF_42` 逐字保留；`adjustment_document_status`/`adjustment_baseline_status`/`adjustment_design_status` 仍为 `APPROVED`。
- **接受范围**：`DS-REQ-139~177`、`DS-AC-141~182`、正式验收结果 `PASS=42/FAIL=0/BLOCKED=0/NOT_RUN=0`、被验收业务实现提交 `399cb2249f60411b52235a859a8ce95d9f6e4579`、证据链截至 `30e902f7c2c3de62b7a7ff454fa25a4cef74fdfa`。
- **§13.0~§13.9 设计正文（含 R1 冻结方案与 R2 极小修订）逐字零变化**；`DS-REQ-139~177`（39 条）与 `DS-AC-001~182` 编号、前置条件、操作步骤、预期结果未改。
- **边界**：该 `ACCEPTED` **仅**适用于本轮当前调整设计，**不**把数据源管理 Feature 整体正式验收状态改为 `ACCEPTED`；既有 `PASS=113/FAIL=0/BLOCKED=2/NOT_RUN=0`、`DS-AC-104`/`DS-AC-108` 两个 `BLOCKED`、上一轮 `DS-AC-116~140`（25 条全部 `NOT_RUN`）均未改变。
- 本任务未访问数据库/ZK/Kafka/源库/目标库；未启动服务；未重跑测试或构建；未修改业务代码/测试/配置/依赖/锁文件。

## 15. 新增/修改时间字段维护、列表默认排序与主弹窗表单视觉调整设计（`APPROVED`，`IMPLEMENTED_PENDING_FINAL_ACCEPTANCE`，正式验收已在本地真实环境执行且 17 条全部 `PASS`）

> 分层状态：`adjustment_document_status=APPROVED`、`adjustment_baseline_status=APPROVED`、`adjustment_design_status=APPROVED`、`implementation_authorization_status=GRANTED_IN_THIS_TASK`、`implementation_status=IMPLEMENTED_PENDING_FINAL_ACCEPTANCE`、`formal_acceptance_execution_status=EXECUTED_PASSED_LOCAL`、`new_adjustment_acceptance_status=PASS_17_OF_17`、`final_acceptance_status=NOT_ACCEPTED_PENDING_PROJECT_OWNER`、`project_owner_visual_review_status=PASS`、`password_false_required_defect_status=FIXED_CONFIRMED`。本轮验收 `DS-AC-183~199`（17 条）已由 `DATA-SOURCE-CREATE-EDIT-TIME-SORT-FORM-UI-ADJUSTMENT-FORMAL-ACCEPTANCE-001` 于 2026-09-20 在真实后端 + 真实 Oracle 开发库 + 真实浏览器 + 受控验收数据（`RUN_TAG=FACC002`）下端到端执行：`PASS=17/FAIL=0/BLOCKED=0/NOT_RUN=0`；该 `EXECUTED_PASSED_LOCAL` **不构成**最终验收，不得写为 `ACCEPTED`/`IMPLEMENTED_ACCEPTED`/生产可用。

### 15.0 局部替代声明

1. **默认排序（对 §1.2/§2 既有 `DS-REQ-010` 结论）**：列表默认排序由 `DATA_SOURCE_ID ASC` **局部替代**为 `UPDATE_TIME DESC NULLS LAST, INSERT_TIME DESC NULLS LAST, DATA_SOURCE_ID ASC`。替代边界仅限“默认排序键”；`DATA_SOURCE_ID` 作为时间相同时的**稳定排序第三键**继续有效；无分页、模糊匹配与 AND 组合、全状态展示与原始 `fgActive` 返回**全部不变**。
2. **主弹窗视觉（对既有 `DS-REQ-176` 结论）**：新增/编辑主弹窗的**标签对齐、标签文字样式、密码必填标识、右下角提交按钮视觉**被本轮设计替代；业务属性弹窗与目标库命名策略弹窗的布局、字段、宽度与视觉**不变**；主弹窗字段集合、校验规则、保存行为、弹窗宽度与业务流程**不变**。
3. **时间字段维护（对 §9/§3 既有写入边界的补充）**：本轮为 `CDC_DATA_SOURCE` 的 `INSERT_TIME`/`UPDATE_TIME` 建立明确维护规则，属既有写入边界的**补充**；不改变任何既有业务校验、错误码、并发控制、删除语义或密码安全边界。

### 15.1 新增时间字段（`DS-REQ-178`）

- **不采用** `MyBatis-Plus` 的通用 `insert(entity)`：该方式无法让两列取数据库 `SYSDATE`，若在 Java 侧 `new Date()` 赋值则违反“不使用 JVM 时间”。
- **采用** `DataSourceMapper` 上的**显式注解 INSERT**（`@Insert`），列出全部业务列并在常量位置写入 `SYSDATE, SYSDATE`；对应列 `INSERT_TIME`、`UPDATE_TIME` 在同一条 INSERT 中取值，时间一致。
- 服务层新增路径由 `insertWithSysdate(entity)` 承接；`FG_ACTIVE='1'`、`DATA_SOURCE_ORG` 等既有新增语义不变；实体字段不承载时间值。
- 不新增触发器，不修改表结构，不依赖数据库列默认值。

### 15.2 主表修改时维护 `UPDATE_TIME`（`DS-REQ-179`~`DS-REQ-182`）

| 场景 | 实现方式 | 结论 |
|---|---|---|
| 编辑保存（主弹窗“保存”） | 既有的单条 `LambdaUpdateWrapper` 主表 `UPDATE` 追加 `setSql("UPDATE_TIME = SYSDATE")` | 业务字段与时间在同一条 UPDATE；`INSERT_TIME` 不参与 SET |
| 非幂等启用 / 停用 / 异常归一化停用 | 既有的“带原状态条件”单条 `UPDATE` 在同一 `LambdaUpdateWrapper` 中追加 `setSql("UPDATE_TIME = SYSDATE")` | 与 `FG_ACTIVE` 同一条 UPDATE；原状态条件（含 `NULL`）不变 |
| 幂等启用 / 幂等停用 | **不进入**写路径，保持函数开头早退 | **零 DML**，不因更新时间而写库 |
| 业务属性保存 | 既有的单条主表 `UPDATE` 追加 `setSql("UPDATE_TIME = SYSDATE")` | 与 `DATA_SOURCE_BIZ_ATTR` 同一条 UPDATE |
| 目标库命名策略（列表/新增/编辑/删除） | 只写 `CDC_DATA_SOURCE_EXTEND` | **不联动**更新 `CDC_DATA_SOURCE.UPDATE_TIME` |

- 失败、并发冲突或影响行数 ≠ 1 的既有分支**继续**抛错并回滚（`50000`/`50001`/`50002` 等既有错误码不变），时间字段与业务字段同事务回滚，**不会**单独留下变化。
- 删除语义不变；**不**回填、不清洗、不修改任何存量时间字段；**不**新增索引；**零 DDL**。

### 15.3 列表默认排序（`DS-REQ-183`）

- 后端 `list(query)` 在既有过滤条件之后，以 `wrapper.last("ORDER BY …")` 明确生成：

```sql
ORDER BY UPDATE_TIME DESC NULLS LAST, INSERT_TIME DESC NULLS LAST, DATA_SOURCE_ID ASC
```

- 两个 `DESC NULLS LAST` 与末尾 `DATA_SOURCE_ID ASC` **均**为必需；选择 `last(...)` 而非 `orderBy(...)` 是因为 MyBatis-Plus 的 `orderBy` 不支持 `NULLS LAST` 这种 Oracle 专有排序语义。
- 前端**不做**任何二次排序；查询条件、返回字段、全状态展示、无分页**均不变**。

### 15.4 主弹窗标签对齐与文字样式（`DS-REQ-184`、`DS-REQ-185`）

- 主弹窗 `el-form` 的 `label-position` 由 `left` 改为 `right`，`label-width` **保持** `120px`。
- 因 `label-width` 不变、`.test-bar { padding-left: 120px; }` 不变，“测试连接”按钮与输入控件左侧的对齐线**不受影响**；输入控件起始位置**保持稳定**。
- 标签文字样式以 `:deep(.editor-dialog .el-form-item__label)` 限定作用域：`font-size: 14px; font-weight: 500; color: #3f3f46`；不设置 `font-family`，沿用页面默认无衬线字体；**不**复用列表“数据源 ID”的等宽字体或 `font-weight: 600` / `#09090b`；普通必填字段的星号继续由 Element Plus 既有 `is-required` + `asterisk-left` 伪元素渲染，仍为红色危险色。**密码字段是明确例外**：该表单项**不**依赖 `is-required` 渲染星号，而是按 §15.5 以专用视觉类渲染。
- 业务属性弹窗与目标库命名策略弹窗的 `label-position`/`label-width`/标签样式**不变**；样式不泄漏到其他页面。

### 15.5 密码必填标识（`DS-REQ-186`）

- 密码表单项保留 `prop="password"`，**删除** `required` 属性；**不**通过 Element Plus 的 `is-required` 机制渲染星号。
- **新增模式**在密码表单项上挂载纯视觉局部类：

```vue
:class="{ 'editor-password-required-mark': !isEdit }"
```

- 星号由 `.editor-password-required-mark` 的 scoped CSS `::before` 渲染，颜色为 `var(--el-color-danger)`；选择器以 `:deep(.editor-dialog …)` 限定，无全局泄漏。
- 该类**只控制视觉**，不产生任何校验副作用：
  - **不**生成隐式必填规则；
  - **不**添加 `is-required` 框架状态类；
  - **不**读取不存在的 `editorForm.password`。
- 新增模式空密码仍由既有 `validatePassword()` 提示中文 `请输入密码`。
- **编辑模式**不挂载该类：标签**不显示**星号，且未修改密码时允许留空保存；主动修改密码后清空仍提示 `请输入新密码`。
- 密码掩码、聚焦、失焦、密码不回显与请求体规则（编辑模式未修改密码时不携带 `password`）**全部保持不变**。
- **R1 根因说明（2026-09-20）**：初版设计的 `:required="!isEdit"` 会使 Element Plus 针对 `prop="password"` 生成隐式必填规则，该规则校验的是 `editorForm.password`；而密码输入实际绑定独立状态 `passwordInput`（不在 `editorForm` 内），两者不一致，因此**密码已填写仍被拦截并显示英文 `password is required`**。该缺陷已由 `DATA-SOURCE-CREATE-EDIT-TIME-SORT-FORM-UI-ADJUSTMENT-001-R1` 按上述最终方案修复；本节即为修复后的权威设计。

### 15.6 创建/保存按钮视觉（`DS-REQ-187`、`DS-REQ-188`）

- 主弹窗右下角提交按钮保留 `type="primary"` 与既有 `:loading="saving"` / `:disabled="editorLoading"` 绑定，文案为 `isEdit ? '保存' : '创建'`，并新增专用类名 `editor-submit-button` 作为局部样式钩子。
- 样式以 `:deep(.editor-dialog .editor-submit-button:not(.is-disabled))` 限定：常态 `#09090b`；`:hover`/`:focus` 为 `#27272a`；`:active` 为 `#18181b`；文字 `#ffffff`；`border-radius: 6px`；`font-weight: 500`。
- 选择器带 `:not(.is-disabled)`，**不**覆盖 Element Plus 的禁用视觉，disabled 仍不可点击外观；loading 图标与文字颜色沿用上述白字设置保持可读。
- “取消”按钮、“测试连接”按钮、业务属性弹窗与目标库命名策略弹窗的提交按钮**均不调整**；样式不泄漏到其他页面或弹窗。

### 15.7 追踪

| 需求 | 验收 | 设计条目 |
|---|---|---|
| DS-REQ-178 | DS-AC-183 | §15.1 |
| DS-REQ-179 | DS-AC-184 | §15.2 |
| DS-REQ-180 | DS-AC-185、DS-AC-186 | §15.2 |
| DS-REQ-181 | DS-AC-187 | §15.2 |
| DS-REQ-182 | DS-AC-188 | §15.2 |
| DS-REQ-183 | DS-AC-189、DS-AC-190、DS-AC-191 | §15.3 |
| DS-REQ-184 | DS-AC-192、DS-AC-193 | §15.4 |
| DS-REQ-185 | DS-AC-194 | §15.4 |
| DS-REQ-186 | DS-AC-195、DS-AC-196 | §15.5 |
| DS-REQ-187 | DS-AC-197、DS-AC-198 | §15.6 |
| DS-REQ-188 | DS-AC-199 | §15.6 |

## 16. 本轮调整变更记录

### 16.1 实现与状态回写（2026-09-20，任务 `DATA-SOURCE-CREATE-EDIT-TIME-SORT-FORM-UI-ADJUSTMENT-001`）

- 新增 §15「新增/修改时间字段维护、列表默认排序与主弹窗表单视觉调整设计（`APPROVED`，`IMPLEMENTED_PENDING_USER_REVIEW`）」与本节（§16）。
- 分层状态：`adjustment_document_status=APPROVED`、`adjustment_baseline_status=APPROVED`、`adjustment_design_status=APPROVED`、`implementation_authorization_status=GRANTED_IN_THIS_TASK`、`implementation_status=IMPLEMENTED_PENDING_USER_REVIEW`、`formal_acceptance_execution_status=NOT_RUN`、`new_adjustment_acceptance_status=ALL_NOT_RUN`；项目负责人已在当前会话明确批准该方案。
- §15.0 三条“局部替代声明”冻结对既有结论的替代边界（默认排序键、主弹窗视觉、时间字段维护属补充）。
- 实现落点：`DataSourceMapper` 新增显式注解 INSERT `insertWithSysdate`；`DataSourceServiceImpl` 的 `create`/`update`/`updateStatusConditionally`/`saveBizAttr` 与 `list` 按 §15.1~§15.3 调整；`DataSourcePage.vue` 主弹窗按 §15.4~§15.6 调整（`label-position`、密码 `:required`、`editor-submit-button` 与两段局部 `:deep(.editor-dialog …)` 样式）。
- 幂等分支继续保持**零 DML**；命名策略路径未触及主表时间；删除、并发控制、错误码、密码安全、连接测试、查询条件、返回字段、全状态展示与无分页**全部不变**；**零 DDL**、**零存量清洗**、**零新增索引**。
- §0~§14 既有设计基线与追踪结论**逐字冻结、未修改**；`DS-REQ-001~177` 编号与正文未改；`DS-AC-001~182` 编号、前置条件、操作步骤、预期结果未改。
- 本轮新增验收 `DS-AC-183~199`（17 条）全部为 `NOT_RUN`；上一轮 `DS-AC-116~140`（25 条）仍全部 `NOT_RUN`；已最终接受的 `DS-AC-141~182`（42 条 `PASS`）状态未改变。
- 既有 `PASS=113/FAIL=0/BLOCKED=2/NOT_RUN=0`（阻塞 `DS-AC-104`/`DS-AC-108`）**逐字保留**。
- 实现状态为 `IMPLEMENTED_PENDING_USER_REVIEW`，**未**置为 `IMPLEMENTED_ACCEPTED`/`ACCEPTED`/生产可用；正式验收执行状态 `NOT_RUN`。
- 未访问数据库/ZK/Kafka/业务源库/目标库；未对数据库执行任何 DDL/DML；未修改依赖与锁文件；从最终提交启动临时前后端服务供项目负责人目测（后端按既有配置自动建立连接池，不视为 Agent 主动访问）。

### 16.2 R2 设计文档纠偏（2026-09-20，任务 `DATA-SOURCE-CREATE-EDIT-TIME-SORT-FORM-UI-ADJUSTMENT-001-R2`）

- **触发**：ChatGPT 从远程 Git 复审 R1 提交 `55e6273b74182c408e36b75e09ad21819f33d3e2`，结论 `code_review_status=REVIEW_PASS`、`overall_review_status=CHANGES_REQUIRED`、`blocking_finding_count=1`，唯一阻塞类型为 `DESIGN_DOCUMENT_INCONSISTENCY`：本文件 §15.4/§15.5 仍保留 R1 已废止的旧方案。
- **§15.4 纠偏**：删除“必填星号继续由 Element Plus 的 `is-required` 伪元素渲染”的笼统表述，改为——普通必填字段仍可由 Element Plus 既有 `is-required` 机制渲染；**密码字段是明确例外**，按 §15.5 以专用视觉类渲染星号。
- **§15.5 纠偏**：整节由旧方案（`required` 属性 / `is-required` 类 / “不使用纯文本伪造星号”）完整替换为 R1 已落地的最终方案（保留 `prop="password"` 并删除 `required`、新增模式挂载 `editor-password-required-mark` 局部类、scoped CSS `::before` 渲染 `var(--el-color-danger)` 星号、该类只控制视觉不生成隐式必填规则/不添加 `is-required`/不读取 `editorForm.password`、新增空密码仍由 `validatePassword()` 提示 `请输入密码`、编辑模式无星号且未修改可保存、主动修改后清空仍提示 `请输入新密码`、掩码与请求体规则不变），并补充 R1 根因说明。
- **一致性目标**：本节纠偏后，§15.4/§15.5 与 R1 实际代码、`UI.md §13.3` 及 R1 执行报告一致，避免后续 Agent 依据旧描述重新引入同一缺陷。
- **边界**：本 R2 为纯文档定向修订，**不改变**本轮需求语义（`DS-REQ-178~188` 编号与正文零变化）、**不改变**验收正文（`DS-AC-183~199` 编号、前置条件、操作步骤、预期结果零变化）、**未修改**任何运行代码/测试/配置/依赖/锁文件/SQL；未访问数据库/ZK/Kafka/业务源库/目标库；未执行测试或构建；未启停任何服务。
- §16.1 及 §12/§14 全部历史变更记录（含“密码 `:required`”等当时准确的实现记录）**作为历史证据逐字保留**，未改写。
- 状态回写：§15 标题与状态块 `implementation_status` 由 `IMPLEMENTED_PENDING_USER_REVIEW` 更新为 `IMPLEMENTED_PENDING_FORMAL_ACCEPTANCE`，并补充 `project_owner_visual_review_status=PASS`、`password_false_required_defect_status=FIXED_CONFIRMED`（项目负责人 2026-09-20 复测通过）；`formal_acceptance_execution_status=NOT_RUN`、`new_adjustment_acceptance_status=ALL_NOT_RUN` 保持不变。
- 报告：`reports/DATA-SOURCE-CREATE-EDIT-TIME-SORT-FORM-UI-ADJUSTMENT-001-R2.md`。

### 16.3 正式验收执行与状态回写（2026-09-20，任务 `DATA-SOURCE-CREATE-EDIT-TIME-SORT-FORM-UI-ADJUSTMENT-FORMAL-ACCEPTANCE-001`）

- **状态回写**：§15 标题由“（`APPROVED`，`IMPLEMENTED_PENDING_FORMAL_ACCEPTANCE`）”改为“（`APPROVED`，`IMPLEMENTED_PENDING_FINAL_ACCEPTANCE`，正式验收已在本地真实环境执行且 17 条全部 `PASS`）”；分层状态由 `implementation_status=IMPLEMENTED_PENDING_FORMAL_ACCEPTANCE`/`formal_acceptance_execution_status=NOT_RUN`/`new_adjustment_acceptance_status=ALL_NOT_RUN` 更新为 `implementation_status=IMPLEMENTED_PENDING_FINAL_ACCEPTANCE`/`formal_acceptance_execution_status=EXECUTED_PASSED_LOCAL`/`new_adjustment_acceptance_status=PASS_17_OF_17`，并新增 `final_acceptance_status=NOT_ACCEPTED_PENDING_PROJECT_OWNER`；`adjustment_document_status`/`adjustment_baseline_status`/`adjustment_design_status` 仍为 `APPROVED`。
- **执行结论**：`DS-AC-183~199`（17 条）于 2026-09-20 在真实后端 + 真实 Oracle 开发库 + 真实浏览器 + 受控验收数据（`RUN_TAG=FACC002`，运行源 `db1cfda7...`）下端到端执行，`PASS=17/FAIL=0/BLOCKED=0/NOT_RUN=0`（`DS-AC-198` 的禁用态采用定向自动化 + 计算样式 + 构建产物 CSS 佐证，证据层级已明示）。
- **数据库**：写操作经项目负责人明确批准（`GRANTED_BY_PROJECT_OWNER_FOR_AGENT_CREATED_DATA_ONLY`），自建数据已按精确主键白名单清理（残留 `0`），既有 36 条主表与 10 条延伸表记录规范化快照四个 SHA-256 **逐字节一致**；未执行 DDL/存量清洗。
- **边界**：本轮 `EXECUTED_PASSED_LOCAL` **不构成**最终验收；最终验收决定权属项目负责人，前置为 ChatGPT 从远程 Git 的正式验收复审。§15.0 三条“局部替代声明”与 §15.1~§15.6 设计内容**未改**；`DS-REQ-178~188`/`DS-AC-183~199` 编号、正文、前置条件、操作步骤、预期结果零变化；上一轮 `DS-AC-116~140`（25 条 `NOT_RUN`）与已最终接受的 `DS-AC-141~182`（42 条 `PASS`、`final_acceptance_status=ACCEPTED`）状态未改变；既有 `PASS=113/FAIL=0/BLOCKED=2/NOT_RUN=0` 与 `DS-AC-104`/`DS-AC-108` 两个 `BLOCKED` 逐字保留；未置 `ACCEPTED`/`IMPLEMENTED_ACCEPTED`/生产可用。
- 报告：`reports/DATA-SOURCE-CREATE-EDIT-TIME-SORT-FORM-UI-ADJUSTMENT-FORMAL-ACCEPTANCE-001.md`。
