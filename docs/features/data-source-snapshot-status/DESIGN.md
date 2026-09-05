# 源库快照状态 Feature 设计草案（DESIGN）

## 1. 元数据与文档状态

| 项目 | 值 |
|---|---|
| Feature 中文名称 | 源库快照状态 |
| Feature 标识 | `data-source-snapshot-status`（Feature 文档目录标识；任务代码前缀 `DATA-SOURCE-SNAPSHOT-STATUS`） |
| 所属模块 | 运行监控 |
| 既有路由 | `/monitor/data-source-state`（保持既有值不变；本设计不新增、不重命名、不改挂） |
| 前端源码目录 | `frontend/src/views/data-source-run-state/`（保留既有目录名，不做无业务价值目录重命名；命名映射见 UI §10） |
| 目标文档 | `docs/features/data-source-snapshot-status/DESIGN.md`（总设计入口） |
| 配套设计文档 | `API.md`（接口设计草案）、`UI.md`（界面设计草案）、`DATABASE.md`（数据库查询设计草案） |
| 文档状态 | `DRAFT_PENDING_USER_REVIEW`（设计草案，尚未批准） |
| requirements_status | `APPROVED`（`docs/features/data-source-snapshot-status/REQUIREMENTS.md`，`DSS-REQ-001~065` 共 65 条） |
| acceptance_status | `APPROVED`（`docs/features/data-source-snapshot-status/ACCEPTANCE.md`，`DSS-AC-001~068` 共 68 条，全部 `NOT_RUN`） |
| design_status | `DRAFT_PENDING_USER_REVIEW`（本文件与 API.md / UI.md / DATABASE.md 均为草案，未批准） |
| implementation_status | `NOT_STARTED`（本设计不编码；页面仍为占位、后端仍无 RUN_STATE 访问链路） |
| acceptance_execution_status | `NOT_RUN`（本设计不执行验收；68 条 `DSS-AC-*` 全部保持 `NOT_RUN`） |
| pending_user_confirmation_count | `0`（本草案无必须由项目负责人决策的待确认设计项，见 §15） |
| 设计任务编号 | `DATA-SOURCE-SNAPSHOT-STATUS-DESIGN-BASELINE-001`（纯文档设计草案建立） |
| 设计任务授权基线提交 | `38da355f16438ad0d9156acdd667e9258fe89141`（本任务开始时 `origin/develop` 最新提交；本地 HEAD 与其一致） |
| 批准内容基准 | `4234af73db2190098f3dcd219319a4281fdabafd`（已批准需求/验收的批准内容基准） |
| 创建日期 | 2026-09-05 |
| 依据需求 | `REQUIREMENTS.md`（`DSS-REQ-001~065`，已批准，批准版本 `DATA-SOURCE-SNAPSHOT-STATUS-REQUIREMENTS-BASELINE-APPROVAL-001`） |
| 依据验收 | `ACCEPTANCE.md`（`DSS-AC-001~068`，全部 `NOT_RUN`，已批准） |
| 数据库事实依据 | `docs/database/reports/DATA-SOURCE-SNAPSHOT-STATUS-DATABASE-VERIFICATION-001.md`（已提交数据库只读复核报告；本设计任务未连接数据库，见 DATABASE §2） |

任务边界声明：

- 本文件只把已批准需求与验收转换为**可复审、可实现、可测试的四份设计草案**，不改变任何已批准业务规则，不编码，不执行测试或验收，不访问或操作数据库/ZooKeeper/Kafka/sync-client，不启停服务。
- 设计状态只能是 `DRAFT_PENDING_USER_REVIEW`，不得写成 `APPROVED`；功能不得写成 `IMPLEMENTED`、`IMPLEMENTED_PENDING_REVIEW` 或 `IMPLEMENTED_ACCEPTED`；68 条验收不得改为 `PASS/FAIL/BLOCKED`，必须全部保持 `NOT_RUN`。
- “设计文档已建立”不等于“设计已批准”；下一入口为 **ChatGPT 对设计草案进行正式复审**（见 README）。
- 本文件建议的类名/包名/文件路径用于后续实现阶段，**不代表当前仓库已存在这些实现**（现状盘点见 §3）。

## 2. 设计目标与边界

### 2.1 设计目标

把已批准的“源库快照状态”只读监控需求落地为一份可直接实现的前后端设计：确定接口数量与职责、候选数据返回方式、筛选所在层、时间传输方式、异常标志模型、前端状态存放方式、计时器与请求令牌策略等关键技术方案（§4~§13），使实现阶段无需再做方案级决策。

### 2.2 范围内（设计对象）

- 后端只读查询链路：Controller → Query → Service → 只读 Mapper → VO。
- 前端页面：查询区（三项多选）、七列表格、刷新工具栏、状态与异常展示、60 秒自动刷新。
- “界面选择条件 / 已应用查询条件”两阶段状态、请求快照、失败保留与恢复可见刷新。
- 只读 LEFT JOIN（等价保行）补充探针端描述与源库 ORG 等展示信息。
- 待实现阶段的测试设计（后端单测 / Mapper SQL 审计 / JSON 契约 / 前端组件与 composable 测试 / 浏览器人工验证）。

### 2.3 范围外（设计明确不引入）

- 任何写接口、写按钮、隐式写行为；对 `CDC_DATA_SOURCE_RUN_STATE` 的任何 DML/DDL。
- 分页、每页条数、翻页控件、`PageResult` 语义（本 Feature 不分页）。
- sync-client 在线/健康/失联、增量采集状态、同步进度、时间推断（超时/异常/离线/长期运行）。
- 从配置表补 RUN_STATE 缺失行、虚拟状态（未开始/待快照/尚无快照记录）。
- 依据 `UPDATED_AT` 推断任何健康状态。
- Kafka / ZooKeeper / TongZK / sync-client 接入。
- 表头自定义排序、操作列、详情/编辑/删除/跳转入口。

### 2.4 不得改变的业务规则（约束清单）

详见 §5.1~§13，逐条落实 `DSS-REQ-001~065`。四份设计必须整体保持一致（prompt §10.1）：接口路径、参数名、JSON 字段名、状态枚举、时间格式、错误码、候选方案与刷新状态机完全一致。

## 3. 现状盘点与可复用模式

以下为仓库**当前真实代码/文档**盘点（只读；本任务不改动任何源码）。后续实现应复用下列成熟模式，但不得照搬与本 Feature 冲突的分页、候选范围、状态语义或路由（prompt §2.7）。

### 3.1 前端现状

- 占位页：`frontend/src/views/data-source-run-state/DataSourceRunStatePage.vue`（`PlaceholderPage`，标题“数据源运行状态”，AS-IS）。
- 路由：`frontend/src/router/index.ts` 存在 `/monitor/data-source-state`（name `DataSourceRunState`，title“数据源运行状态”，group“运行监控”）；另有 `/monitor/topic-offset`（name `TopicOffset`）等同组监控路由。
- 菜单：`frontend/src/config/menu.ts`“运行监控”组含 `/monitor/data-source-state`（title“数据源运行状态”）。
- HTTP：`frontend/src/services/http.ts`——axios 实例，`baseURL=import.meta.env.VITE_API_BASE_URL || ''`，默认超时 10000ms，响应拦截器直接返回 response，错误拦截器统一 `ElMessage.error` 后 reject。**查询类长耗时请求按需在 api 封装层覆盖更长超时**（topic-offset 用 30000ms）。
- API 类型基座：`frontend/src/types/monitor.ts`（`ApiResponse<T>`）、`frontend/src/types/topicOffset.ts`。
- API 封装惯例：`frontend/src/api/topicOffset.ts` 手工实现重复参数序列化（axios 默认会把数组序列化为 `clientId[]=`，必须用 `paramsSerializer` 生成 `clientId=A&clientId=B`）。
- 可复用组件：`frontend/src/components/PlaceholderPage.vue`、`frontend/src/components/ClientCard.vue` 等。
- 状态管理：Pinia（`frontend/src/stores/topicOffset.ts` 为“路由级会话 store”，保存“上一次成功”的生效条件、结果与最近成功刷新时间 `lastSuccessAt`（前端 epoch），`hasSuccess` 计算属性；不用 localStorage）。
- composable 惯例：`frontend/src/views/topic-offset/composables/useTopicOffset.ts`——**单飞行＋最新意图槽位**并发模型：`busy`/`running`/`slot`/`acceptedSeq`（意图序号）、`disposed`（页面卸载）、`hidden`（页面隐藏）、定时器；仅当响应 `op.seq===acceptedSeq` 才允许提交；`ESTABLISHING`（initial/retry/query）与 `LIGHT`（page/manual/restore/auto）分级决定整表 loading 还是工具栏轻量状态。
- 选择工具惯例：`frontend/src/views/topic-offset/utils/selection.ts`——`ALL_OPTION='__ALL__'` 哨兵只存在于草稿层、绝不作为真实值请求；`normalizeDimension` 实现“全部”与具体候选互斥、清空回到“全部”；`rowKey.ts` 用 NUL 分隔复合键避免字符串拼接歧义。
- 测试：`frontend/src/views/topic-offset/*.spec.ts`（vitest，含组件与 composable 测试）。

### 3.2 后端现状

- 分层：`Controller(@RestController) → Service → Mapper`，公共组件 `common/api/ApiResponse`、`common/page/PageResult`、`common/exception/BusinessException`、`common/exception/GlobalExceptionHandler`。
- `ApiResponse<T>`：`{ code, message, data, timestamp }`；成功 `code=200,message="success"`。
- 异常：`BusinessException(code,message)` 由 `GlobalExceptionHandler` 以 **HTTP 200** 返回业务错误体；参数校验 400、类型不匹配 400、兜底 500 `"服务器内部错误"`（脱敏）。监控模块各 Feature 使用独立错误码枚举，数字互不重叠：zookeeper `5001~5003`、topicoffset `40001~40003`、jobfailure/datasource/logquery/serverconfig/subscription 等各自段位；**`41xxx` 段当前未被任何模块占用**（本 Feature 选用，见 API §8）。
- 已实现的只读监控参考 Feature **topic-offset**（前后端均已提交）：
  - `backend/.../monitor/topicoffset/controller/TopicOffsetController.java`——只暴露 `GET`，`@RequestParam(required=false) List<String> ...`，用 Query 对象承载。
  - `TopicOffsetQueryServiceImpl`——全量只读 `selectAll()` 后在服务层做过滤/映射/切片（本 Feature 复用其“**全量加载→服务层过滤**”骨架，但因 DSS 不分页且候选必须来自 RUN_STATE 全量，做 DSS 特有调整，见 §5/§6）。
  - `TopicOffsetMapper`——**纯注解 `@Select`、显式列别名、不继承 BaseMapper、无写方法**；`DATE` 字段用 Oracle `TO_CHAR(..., 'YYYY-MM-DD HH24:MI:SS')` 确定性字符串化后 Java 只透传（本 Feature 的 3 个 DATE 列沿用同一方案）。
  - `ClientConfigMapper` / `DataSourceConfigMapper`——显式列投影；`DataSourceConfigMapper` 列清单**绝不包含 `DATA_SOURCE_PASSWORD`**。
  - 映射模型 `TopicEndpointMappingVO(state=ACTIVE/INACTIVE/NOT_FOUND, id, org/desc)` 表达“配置存在/停用/不存在”，本 Feature 的关联异常标志模型（§5.5）沿用同风格但按 DSS-REQ-043/044 扩展 source 维度。
  - 错误码枚举风格：`enum XxxErrorCode { NAME(code, message) }`；常量类 `XxxConstants` 承载 `FG_ACTIVE_ENABLED="1"`、`MAX_FILTER_IDS`、映射状态词等。
- Jackson（`backend/src/main/resources/application.yml`）：`date-format: yyyy-MM-dd HH:mm:ss`、`time-zone: GMT+8`、`default-property-inclusion: non_null`。因此**需要 JSON 显式 null 的字段必须在 VO 上用字段级 `@JsonInclude(Include.ALWAYS)`**（topic-offset 的 `TopicOffsetItemVO` 即如此，不改全局配置）。
- MyBatis-Plus：`@MapperScan("com.bsoft.cdcconfig.**.mapper")`。**注意 bean 名冲突**：simple class name 默认去重，因此本 Feature 新增 Mapper/Service 的类名不得与既有类撞名（尤其不得再建 `ClientConfigMapper`/`DataSourceConfigMapper`/`DataSourceMapper`，本设计选用唯一名，见 §4.2）。

### 3.3 数据库只读复核事实（摘要）

权威依据为已提交复核报告（本设计不重新查库；物理事实详见 DATABASE §3）。关键结论：`CDC_DATA_SOURCE_RUN_STATE` 六字段、主键 `PK_CDC_DS_RUN_STATE(CLIENT_ID, DATA_SOURCE_ID)`、无外键/触发器/状态封闭 Check、4 个非空字段、2 个可空 DATE；`VARCHAR2` 为 BYTE 语义；当前开发库仅 1 条 `SNAPSHOT_RUNNING` 样例。

## 4. 总体架构与职责划分

### 4.1 总体分层

```
浏览器（Vue 3 SPA）
  页 DataSourceRunStatePage.vue（替换占位页；UI §2）
   ├─ components/ DataSourceSnapshotQueryBar.vue / DataSourceSnapshotTable.vue / DataSourceSnapshotToolbar.vue / DataSourceSnapshotStatusTag.vue
   ├─ composables/ useDataSourceSnapshot.ts（编排：两阶段条件 + 单飞行 + 60s 计时 + 失败保留）
   ├─ stores/ dataSourceSnapshot.ts（Pinia 路由级会话 store：已应用条件/records/最近成功刷新时间/候选）
   ├─ api/ dataSourceSnapshot.ts（GET /api/monitor/data-source-run-state/list，重复参数序列化 + 查询级超时）
   ├─ types/ dataSourceSnapshot.ts（ApiResponse 派生 + 查询/候选/行/映射 VO 类型）
   └─ utils/ selection.ts（ALL_OPTION/互斥/两阶段换算）、rowKey.ts、format.ts、format.spec.ts...
         │  GET（唯一接口；response 内嵌 records + candidates）
         ▼
Spring Boot（Tomcat :8080）
   DataSourceRunStateController（仅 GET，无任何写端点）          [controller]
     └→ DataSourceRunStateQueryService(+Impl)                  [service: 参数归一→全量只读→候选→过滤→排序→映射]
          ├→ DataSourceRunStateMapper（CDC_DATA_SOURCE_RUN_STATE 全量只读 @Select）       [mapper]
          ├→ RunStateClientMapper（CDC_CLIENT_MULTIPLE 显式投影只读 @Select）
          └→ RunStateDataSourceMapper（CDC_DATA_SOURCE 显式投影只读 @Select，不含 PASSWORD）
          ├→ 常量/错误码/枚举（分类与映射状态）
          └→ VO：SnapshotStatusListVO / SnapshotStatusItemVO / CandidateGroupVO / ClientCandidateVO / SourceCandidateVO / ClientRefVO / SourceRefVO
   Oracle 19c（CDC schema）
```

### 4.2 建议的后续实现文件（仅设计建议，当前不创建）

| 层 | 建议路径/类（`backend/src/main/java/com/bsoft/cdcconfig/` 前缀省略） |
|---|---|
| Controller | `monitor/datasourcerunstate/controller/DataSourceRunStateController.java` |
| Query | `monitor/datasourcerunstate/query/DataSourceRunStateQuery.java` |
| Service | `monitor/datasourcerunstate/service/DataSourceRunStateQueryService.java`、`service/impl/DataSourceRunStateQueryServiceImpl.java` |
| Mapper | `monitor/datasourcerunstate/mapper/DataSourceRunStateMapper.java`、`RunStateClientMapper.java`、`RunStateDataSourceMapper.java` |
| Row（Mapper 投影） | `monitor/datasourcerunstate/model/DataSourceRunStateRow.java`、`RunStateClientRow.java`、`RunStateDataSourceRow.java` |
| VO | `monitor/datasourcerunstate/vo/SnapshotStatusListVO.java`、`SnapshotStatusItemVO.java`、`CandidateGroupVO.java`、`ClientCandidateVO.java`、`SourceCandidateVO.java`、`ClientRefVO.java`、`SourceRefVO.java` |
| 枚举/常量/异常 | `monitor/datasourcerunstate/enums/SnapshotStatusCategory.java`（RUNNING/COMPLETED/UNKNOWN）、`constant/DataSourceRunStateConstants.java`、`exception/DataSourceRunStateErrorCode.java` |

前端建议新增/替换（均在既有 `frontend/src/views/data-source-run-state/` 目录内）：

| 项 | 建议路径/文件 |
|---|---|
| 页面 | `frontend/src/views/data-source-run-state/DataSourceRunStatePage.vue`（由占位页替换为正式页） |
| 子组件 | `.../components/DataSourceSnapshotQueryBar.vue`、`DataSourceSnapshotTable.vue`、`DataSourceSnapshotToolbar.vue`、`DataSourceSnapshotStatusTag.vue` |
| composable | `.../composables/useDataSourceSnapshot.ts` |
| store | `frontend/src/stores/dataSourceSnapshot.ts` |
| api | `frontend/src/api/dataSourceSnapshot.ts` |
| types | `frontend/src/types/dataSourceSnapshot.ts` |
| utils | `.../utils/selection.ts`、`rowKey.ts`、`format.ts`（可含 `*.spec.ts`） |

> 类名/包名选择避开既有类撞名（`monitor/topicoffset/mapper/ClientConfigMapper`、`DataSourceConfigMapper` 已存在，故本 Feature 采用 `RunStateClientMapper`/`RunStateDataSourceMapper`/`DataSourceRunStateMapper` 等唯一名），与 MyBatis `@MapperScan` 默认 bean 名兼容。

### 4.3 职责划分

| 组件 | 职责 | 关键约束 |
|---|---|---|
| Controller | 只暴露 `GET /api/monitor/data-source-run-state/list`；把多值请求参数绑定到 Query；不出现任何 POST/PUT/PATCH/DELETE。 | 无写能力；不直接访问 Mapper/DB。 |
| Query/参数归一 | `clientId`/`sourceId`/`status` 多值；trim、去空、去重、数量与取值校验。 | “全部”=参数缺失/空，不传哨兵；status 只允许 `RUNNING/COMPLETED/UNKNOWN`。 |
| Service | ① 归一校验；② 三次全量只读（RUN_STATE + 两张配置投影）；③ 计算候选（RUN_STATE 全量，与筛选无关）；④ 按条件过滤；⑤ 固定排序；⑥ 映射 VO（含关联异常标志、状态分类、NULL 时间）。 | 服务层不调用任何写方法；不拼字符串 SQL；不改任何行。 |
| 只读 Mapper | 纯 `@Select` 注解、显式列别名；无 `BaseMapper`；无写方法。 | 不 `SELECT *`；配置投影不含 `DATA_SOURCE_PASSWORD`。 |
| VO/枚举/常量 | 承载接口契约、映射状态词、常量。 | JSON null 语义字段用 `@JsonInclude(ALWAYS)`。 |
| 前端 store | 保存“上一次成功”的已应用条件、records、最近成功刷新时间（前端成功时刻 epoch）、候选；`hasSuccess`。 | 失败不写入；不落 localStorage。 |
| 前端 composable | 请求编排：初始/查询/重试/手工/自动/恢复可见、单飞行、60s 计时、失败保留、最新意图。 | 见 §7~§9 状态机。 |
| 前端组件 | 查询区草稿、表格展示、工具栏稳定宽度、状态/异常视觉。 | 颜色非唯一通道；稳定宽度。 |

## 5. 后端读取流程设计

### 5.1 单次请求处理流程（结论）

**采用“一次请求内先全量读取、再内存过滤”**（沿用 topic-offset 骨架并做 DSS 化），而不是“动态拼 WHERE 下推 SQL”：

1. Controller 收到 `GET .../list`，把参数归一进 `DataSourceRunStateQuery`（`List<String> clientId/sourceId/status`）。
2. Service 归一校验（§5.2）。
3. 三次**全量只读**：
   - `DataSourceRunStateMapper.selectAll()`：单条固定 `@Select`，读取 RUN_STATE **全部行**（无 WHERE），6 个显式列；3 个 DATE 以 `TO_CHAR` 字符串化（见 DATABASE §9）。这是驱动数据集，绝不因任何配置 JOIN 或过滤丢失行（DSS-REQ-015/019）。
   - `RunStateClientMapper.selectAll()`：`CDC_CLIENT_MULTIPLE` 投影（`CLIENT_ID/CLIENT_DESC/FG_ACTIVE`），建 `CLIENT_ID→行` 索引（`putIfAbsent`）。
   - `RunStateDataSourceMapper.selectAll()`：`CDC_DATA_SOURCE` 投影（`DATA_SOURCE_ID/DATA_SOURCE_ORG/DATA_SOURCE_CATEGORY/FG_ACTIVE`，**无 PASSWORD**），建 `DATA_SOURCE_ID→行` 索引。
4. 基于 **RUN_STATE 全量行**计算候选（§6）——候选与当前筛选无关。
5. 基于同一全量行按“同条件 OR、跨条件 AND”过滤出展示集合（§5.3）。
6. 对展示集合做固定确定性排序（§5.4）。
7. 逐行映射 `SnapshotStatusItemVO`（状态分类 §5.5；关联异常标志 §5.6；时间透传 §5.7）。
8. 返回 `SnapshotStatusListVO{records, candidates}`（§5.8）。

**决策理由**：全量集 ≤ ~100 行，一次全读开销极小；候选与列表来自**同一份读取快照**，天然满足“候选不被当前筛选收窄”（DSS-REQ-024 与 prompt §6）且消除多请求间的候选/列表时序不一致；筛选逻辑集中在服务层，可单元测试、可审计；Mapper SQL 恒为固定只读 `SELECT`，杜绝任何字符串拼接注入面。**否决**“动态 WHERE 下推 SQL + 独立候选查询”：会引入两份结果集的快照不一致风险，且候选需第二份未过滤查询或额外的 WHERE 复杂度。

### 5.2 参数归一与校验（结论）

- 每一维多值参数若缺失或归一后为空 ⇒ 该维不设过滤（等价“全部”）；前端草稿层哨兵 `__ALL__` 永不传输（UI §3 / utils selection）。
- 每一具体值：`trim` 后空串丢弃；去重（去重后顺序不影响语义）。
- 上限：任一维具体值数量 ≤ `MAX_FILTER_IDS=200`（覆盖 ~100 行规模下单维全部可选项的余量；超限抛 `41001`，DSS-REQ-020 规模假设下不会自然触发，纯防御）。
- status 取值白名单：`RUNNING/COMPLETED/UNKNOWN`；出现白名单外 token（含原始状态字符串如 `SNAPSHOT_RUNNING`）→ 抛 `41002`（前端只会发这三类 token，防御非法输入）。
- 校验失败经 `BusinessException` 以 HTTP 200 业务错误体返回，消息脱敏（见 API §8）。

### 5.3 过滤语义（服务层）

设三组具体值 `C=clientId 已选、S=sourceId 已选、K=status 已选`（均为集合）：

- `clientId`：空集合不过滤；否则 `row.clientId ∈ C`。
- `sourceId`：空集合不过滤；否则 `row.dataSourceId ∈ S`。
- `status`：空集合不过滤；否则按 token 判据：
  - `RUNNING` → `raw=='SNAPSHOT_RUNNING'`
  - `COMPLETED` → `raw=='SNAPSHOT_COMPLETED'`
  - `UNKNOWN` → `raw != 'SNAPSHOT_RUNNING' && raw != 'SNAPSHOT_COMPLETED'`（列非空；NN 约束下无 NULL 分支，见 DATABASE §5）
  - 满足任一 token 即命中（OR）。
- 跨条件为 AND；命中仅作用于 RUN_STATE 原始行（及其可解析补充信息），**与关联配置缺失/停用/类别异常无关**，因此异常行不会被过滤掉（DSS-REQ-025/041~044）。

> 注：`UNKNOWN` 的判定基于**原始状态值**而非归一类别，与候选/展示的分类共用同一个 `classify(raw)` 函数（§5.5），保证“选中未知状态筛出的行”与“展示为未知状态的行”严格一致（DSS-REQ-024）。

### 5.4 固定确定性排序（服务层，结论）

展示集合按以下比较器排序（全在服务层 Java 完成，DSS-REQ-046~049）：

1. 状态组排序键 `statusRank`：`RUNNING=0`、`UNKNOWN=1`、`COMPLETED=2`（升序）——对应“先 RUNNING、再未知、后 COMPLETED”。
2. 组内 `updatedAt`（`YYYY-MM-DD HH:mm:ss` 字符串，**倒序**；UPDATED_AT 非空，字符串格式固定宽度，字典序=时间序）。
3. 并列时 `clientId`（升序）、再 `dataSourceId`（升序），保证确定可复现。

不依赖数据库 `ORDER BY`（Mapper 全量无序返回亦可，但允许加一条无害 `ORDER BY` 便于人工取证；最终顺序以服务层为准）。实现用 `List.sort` 稳定比较器。

### 5.5 状态分类与原始值保留（结论）

服务层 `classify(String raw)`：

| raw 值 | 分类（statusCategory） | 说明 |
|---|---|---|
| `SNAPSHOT_RUNNING` | `RUNNING` | 展示“快照进行中”（蓝） |
| `SNAPSHOT_COMPLETED` | `COMPLETED` | 展示“快照已完成”（绿） |
| 其他任意值（列 NN） | `UNKNOWN` | 展示“未知状态”（橙），原始值保留可见 |

- 行同时携带原始 `snapshotStatus`（数据库原值）与 `statusCategory`（归一类别）；原始值绝不被改写或丢弃（DSS-REQ-030/038/039）。
- 分类是**只读推导**，不是数据库写操作；数据库无封闭 Check（DSS-REQ-037），必须宽容未知值。
- 该函数同时用于过滤、展示、候选三处，保证语义一致。

### 5.6 关联异常标志模型（结论）

探针端与源库的配置关联各自产出一个小映射对象（风格同 topic-offset `TopicEndpointMappingVO`，但按 DSS 需要扩展），**不新增专门异常列**（DSS-REQ-045），前端据此渲染单元格内图标/弱提示与 Tooltip。

`clientRef: ClientRefVO { state, desc }`

| state | 语义（触发条件） | desc |
|---|---|---|
| `ACTIVE` | `CDC_CLIENT_MULTIPLE.CLIENT_ID` 命中且 `FG_ACTIVE=='1'` | 配置的 `CLIENT_DESC`（不 trim/改写；可为 null） |
| `INACTIVE` | 命中但 `FG_ACTIVE!='1'` | 同上 |
| `NOT_FOUND` | 未命中配置 | `null` |

`sourceRef: SourceRefVO { state, org, category, sourceRole }`

| state | 语义 | org | category（trim+upper 归一） | sourceRole |
|---|---|---|---|---|
| `ACTIVE` | 命中且 `FG_ACTIVE=='1'` | `DATA_SOURCE_ORG`（可为 null） | 归一类别 | `category=='SOURCE'` |
| `INACTIVE` | 命中但 `FG_ACTIVE!='1'` | 同上 | 同上 | 同上 |
| `NOT_FOUND` | 未命中 | `null` | `null` | `false` |

- 类别归一：对 `DATA_SOURCE_CATEGORY` 做 `trim().toUpperCase()`（当前开发库存储小写 `source`，必须大小写不敏感判定；DSS-REQ-044 的“类别大小写异常”指**无法归一为有效类别**的情形，即归一后不等于 `SOURCE`/`TARGET` 之外的畸形值或空——本 Feature 只关心是否为 SOURCE 展示前提，非 SOURCE 且非 TARGET 的空/畸形值统一归为 `sourceRole=false`）。**决策**：任何大小写写法只要 `upper=='SOURCE'` 即视为正常源库关联，不产生告警；`upper!='SOURCE'`（含 `TARGET`、空、畸形）产生“类别非 SOURCE”轻提示。
- 源库**展示/候选并不要求 `sourceRole=true`**：RUN_STATE 行存在即展示（可能是一个类别异常的源库），类别异常只加提示、绝不影响行保留（DSS-REQ-044/045）。
- 客户端“探针端”同样只判断存在/停用（`ACTIVE/INACTIVE/NOT_FOUND`），不做类别判断。

### 5.7 时间透传（结论）

- 三个 DATE 在 Mapper SQL 用 `TO_CHAR(col,'YYYY-MM-DD HH24:MI:SS')` 字符串化，Java 层作 `String` **只透传不重排**（topic-offset 同方案；避免服务端时区二次转换，展示格式即 `YYYY-MM-DD HH:mm:ss`，满足 DSS-REQ-055）。
- `snapshotLastSeenAt`/`snapshotCompletedAt` 可能为 SQL `NULL` → Java `null` → JSON **显式 null**（`@JsonInclude(ALWAYS)`），前端渲染 `--`（DSS-REQ-031/032）。
- `updatedAt` 列非空 → 恒为字符串，但前端格式函数对 null 同样兜底 `--`。
- 时间仅作展示，**任何一层都不得由时间推断健康/超时/离线**（DSS-REQ-056/057/010）。

### 5.8 响应模型（结论，与 API §5 一致）

`SnapshotStatusListVO { List<SnapshotStatusItemVO> records; CandidateGroupVO candidates; }`

每条 records 由前端按数组顺序生成稳定“序号”（UI §4/API §6）；候选与列表同请求同快照。

## 6. 查询候选与列表一致性方案

### 6.1 候选生成（结论）

候选**始终**由当次请求读到的 **RUN_STATE 全量行**派生（在过滤之前、与筛选条件无关）并补充配置展示信息（org/desc/停用/类别）：

- **探针端候选**：遍历 RUN_STATE 全量行，按 `CLIENT_ID` 去重（一个探针可对应多源库），得到集合；每项按 `clientRef` 信息输出 `{id=clientId, desc=配置CLIENT_DESC或null, active=FG_ACTIVE=='1'}`；排序按 `clientId` 升序。
- **源库候选**：遍历全量行按 `DATA_SOURCE_ID` 去重（一个源库可被多探针引用）；输出 `{id, org, active}`；排序按 `org`（空值后置）→ `dataSourceId` 升序。
- **状态候选**：恒为 `RUNNING`、`COMPLETED` 两项（“快照进行中/快照已完成”，DSS-REQ-024 明确这两项为候选）；**仅当**全量行中存在 `classify(raw)=='UNKNOWN'` 的行时，追加 `UNKNOWN`（“未知状态”动态出现，DSS-REQ-024/AC-022）。顺序固定 `[RUNNING, COMPLETED]`，`UNKNOWN` 追加在后。

**与 topic-offset 的关键差异**：topic-offset 的客户端/源库候选来自**配置表全量**；DSS 候选来自 **RUN_STATE 全量实际记录**（未在 RUN_STATE 出现的探针/源库不进入候选），这是 DSS-REQ-024 强制规则，属有意偏离参考实现。

### 6.2 更新时机

- **首次进入/条件查询/自动刷新/手工刷新/恢复可见**：每次成功的 `list` 请求都携带与列表同一快照的 `candidates`；成功后前端把 records 与 candidates **一并**提交到 store（`commitSuccess`，§7.3），因此候选随每次成功刷新更新。
- **未知状态出现/消失**：因候选与列表同快照，一旦新数据出现未知行，下一次成功刷新返回的 `statuses` 即含 `UNKNOWN`；若未知行消失，下一次成功刷新返回的 `statuses` 不再含 `UNKNOWN`（UI 对已选但不再提供的 token 按“ghost 保留”处理，UI §3.5）。
- **过滤不得收窄候选**：因为候选在过滤前从全量行计算，即便当前只筛到“运行中”，探针/源库候选仍含全量出现的其他行；不会出现“选了某条件后其它候选消失”的收窄。
- **查询失败**：候选不更新（store 保留上一次成功候选与列表，§7.4）。空结果成功：records=[] 但 candidates 仍是全量派生（非空子集可能为空？空结果代表全量本身就为空或筛空；若全量为空，candidates 亦为空——这本身是合法空态，AC-057）。

### 6.3 一致性证明

同一响应内：records = f(全量行, 过滤条件)；candidates = g(全量行)。两者由同一次 `selectAll()` 的全量行派生，共享同一 classify/排序常量，因此：候选不漏 RUN_STATE 真实出现项、不被过滤收窄、未知候选与未知行分类一致、无跨请求时序偏差。

## 7. 前端状态机设计

### 7.1 状态存放（结论）

- **界面选择条件（草稿）**：页面实例内 `reactive` 草稿（三个控件数组，含 `__ALL__` 哨兵），不进入 store（刷新/卸载即还原为初始“全部”或最近成功条件，见 UI §3.3）。topic-offset 以 `initial` prop 从已应用条件还原草稿——本 Feature 相同：组件内只保留本地草稿；页面卸载重建时用 store 的已应用条件还原草稿。
- **已应用查询条件**：Pinia store（路由级会话）`dataSourceSnapshot`。仅“用户点击查询且成功（含成功空结果）”时由该次**请求快照**替换（DSS-REQ-023/AC-024）；自动/手工刷新、失败、重置都不改它。
- **请求快照**：composable 在用户点击“查询”瞬间 `Object.freeze` 式复制草稿去哨兵得到不可变 `AppliedCriteria`，随请求携带；在途修改控件不影响本次成功升级用的是哪组条件（DSS-REQ-023）。
- **最近成功数据**：store `records`（上一次成功结果）。查询成功以本次结果替换；刷新成功以本次结果替换；失败/空态区分见下。
- **最近成功刷新时间**：store `lastSuccessAt`（**前端成功收到响应并判为成功的时刻**，epoch ms），仅成功后更新；格式化为 `HH:mm:ss` 展示。
- **页面可见性**：由页面生命周期/`visibilitychange` 事件驱动 composable（onMounted/onUnmounted/onActivated/onDeactivated 及 `document.hidden`），与 topic-offset 的 `visibilityChanged(hidden)` 一致。
- **60 秒计时器**：composable 内部 `setTimeout`（非 store），页面可见才运行。
- **请求在途与防旧覆盖**：composable 内部“单飞行＋最新意图槽位＋seq”，见 §8/§9。

### 7.2 条件模型

`AppliedCriteria { clientIds: string[]; sourceIds: string[]; statuses: StatusToken[] }`；数组为空即“该维全部”（与请求“不传该维参数”对应，API §4）。类型 `StatusToken = 'RUNNING'|'COMPLETED'|'UNKNOWN'`。

草稿层 `{ clients: string[]; sources: string[]; statuses: string[] }` 用 `__ALL__` 哨兵表示“全部”；`selection.ts` 提供 `ALL_OPTION`、`normalizeDimension`、`concreteIds`、`draftFromCriteria`、`buildCriteriaFromDraft`、`criteriaEqual`（复用 topic-offset 已验证的纯函数模式，逻辑不变）。

### 7.3 成功提交（两阶段提交，结论）

composable 持有 `store` 作为“上一次成功现场”权威；成功路径为：

```
请求结束且 op.seq===acceptedSeq 且 code===200：
    store.commitSuccess(op.criteria, res.data.records, res.data.candidates, nowEpoch)
    说明：
      - op.kind ∈ {initial,retry,query}（建立性）：op.criteria 即本次点击快照 → 该次快照升级为已应用条件（仅在“点击查询且成功”才替换，含成功空结果）。
      - op.kind ∈ {manual,restore,auto}（刷新性）：op.criteria 恒等于 store 当前已应用条件（进链前取自 store.appliedCriteria），提交后条件不变，只更新 records/candidates/lastSuccessAt。
    lastSuccessAt 更新为本次成功刷新完成时刻。
    清除刷新错误；关闭首次加载错误态。
```

> 边界（与 DSS-REQ-023/AC-024 完全一致）：自动/手工/恢复刷新**无论成功失败都不得改变已应用条件**；只有成功点击“查询”才替换。

### 7.4 失败/空态处理（结论）

- `!store.hasSuccess` 时的失败（首次加载失败，kind=initial/retry）：进入**首次加载失败态**（整区错误 + “重新加载”入口），`firstLoadError=true`；已应用条件仍为初始三项“全部”；重试仍按“全部”发起（DSS-REQ-059/AC-056）。
- `store.hasSuccess` 时的失败（查询新条件失败或刷新失败）：**保留**上一次成功 records/appliedCriteria/candidates/lastSuccessAt；`refreshError` 显示**收敛的脱敏**短提示（不堆叠相同消息）；不清表、不伪装空态（DSS-REQ-061/AC-058）。
- 成功返回 0 条：**成功**；records=[]；按 kind 规则处理条件（刷新性则条件不变；查询性则快照升级）；空态提示“暂无数据”，非错误（DSS-REQ-060/AC-057）。

### 7.5 计时器规则（结论，严格对照 DSS-REQ-051/054）

- 页面可见时：**每一次实际发出并结束的请求（无论成功失败）**，在请求结束时**重新开始完整 60 秒**（`scheduleNext()`：先清再设 60s 后触发自动刷新）。
- 请求在途时收到自动触发/手工触发 ⇒ 抑制（不发起新请求，见 §9）；被抑制触发**不视为实际请求、不单独重置计时**——只有真正结束一次实际请求才重启周期。
- 页面隐藏：`stopTimer()` 取消计时、不保留剩余秒数；隐藏前已在途请求允许正常结束并按成败规则处理，但**隐藏期间不启动新计时**（结束回调检查 hidden）。
- 页面恢复可见：若 `hasSuccess` → 立即按已应用条件发起一次 `restore` 刷新；该请求结束（无论成败）→ 重启完整 60 秒；若从未成功（无 store 现场）→ 发起 `initial`（按“全部”）。
- 最近成功刷新时间**仅成功更新**；失败或被抑制触发绝不更新。

### 7.6 视觉状态（结论）

- `loading`（整表）：kind=initial/retry/query 在途。
- `refreshing`（工具栏轻量，表格不遮罩、不闪烁）：kind=manual/restore/auto 在途。
- 首次加载失败：整区错误态 + 重新加载（`firstLoadError`）。
- 有数据时的刷新失败：工具栏内联收敛提示 `refreshError`（不清表）。
- 空态：`records.length===0 && hasSuccess` 显示空数据占位。
- 工具栏：固定宽度“立即刷新” + 左侧“60 秒自动刷新｜最近成功刷新：…”（UI §6）。

## 8. 事件—状态转移表

约定：`A=已应用条件`、`D=界面草稿(含哨兵)`、`S=请求快照`、`R=最近成功数据/候选`、`T=最近成功刷新时间`、`Tm=60s 计时器`。`·`表示该项不变。kind：`initial`首次、`query`点击查询、`manual`立即刷新、`auto`自动刷新、`retry`重新加载、`restore`恢复可见。抑制=在途时放弃本次触发。

| # | 事件 | 前置状态 | 请求参数 | 成功结果 | 失败结果 | 计时器结果 |
|---|---|---|---|---|---|---|
| E1 | 首次进入（mount，无现场） | A=全部(初始)、D=全部、无 R | kind=initial，按“全部” | A=全部(保持)；R=本次结果；T=本次成功时刻；候选更新 | `firstLoadError=true`；A 仍全部；R 无 | 请求结束起重启完整 60s |
| E2 | 修改任一控件 | A 任意、D 变 | 不发起请求 | —（不发） | — | 不变 |
| E3 | 点击“查询”（空闲） | A0、D0 | kind=query，S=点击瞬间去哨兵快照 | A=S；R=本次；T=更新；候选更新 | A 保持 A0；R 保持；D 保留新选择 | 请求结束重启完整 60s |
| E4 | 查询在途再次改控件 | S 已锁定 | （同一次请求） | 升级的是 S（非结束时控件值） | 同 E3 失败 | 同 E3 |
| E5 | 点击“查询”（在途/有待执行意图） | 上一请求未结束 | 抑制或置入最新意图槽位（query 覆盖旧意图） | 依实际发起者为准 | 依实际发起者为准 | 被抑制的触发不重置计时 |
| E6 | 查询失败（已有成功现场） | A0、R0 | kind=query 新条件 | — | A 保持 A0；R 保持 R0；D 保留新条件；收敛脱敏提示；T 不更新 | 请求结束重启完整 60s（失败后 60s 按 A 自动重试，不立即重试） |
| E7 | 重置（不点击查询） | D 任意、A0 | 不发请求 | D=三项“全部”；A/R/T/表格不变 | — | 不变 |
| E8 | 立即刷新（空闲） | A0、R0 | kind=manual，参数=A0（恒非 D） | R=本次成功结果；候选更新；**A 保持 A0**；T=本次成功时刻 | R/A/T 保持；收敛脱敏提示 | 请求结束重启完整 60s |
| E9 | 自动刷新触发（空闲且可见） | A0、R0 | kind=auto，参数=A0 | 同 E8 成功 | 同 E8 失败（约 60s 后按 A0 自动重试） | 请求结束重启完整 60s |
| E10 | 请求在途时手动/自动触发 | 在途 | 抑制（manual 不排队等待？manual 属于用户意图，忙时**保留最新 manual/query 意图槽位**，见 §9；auto 直接丢弃） | — | — | 被抑制触发不重置计时 |
| E11 | 页面隐藏 | Tm 运行中 | — | — | — | stopTimer，不保留剩余秒数；在途请求允许结束但不启动新计时 |
| E12 | 恢复可见（有现场） | A0、R0 | kind=restore，参数=A0 | R=本次；T=更新；A 保持 A0 | R/A/T 保持；收敛提示 | 请求结束重启完整 60s |
| E13 | 恢复可见（无现场/从未成功） | 无 R | kind=initial/retry 按“全部” | 同 E1 成功 | 同 E1 失败 | 同 E1 |
| E14 | 点击“重新加载”（首次失败态） | A=全部 | kind=retry 按“全部” | 同 E1 成功 | `firstLoadError` 保持 | 请求结束重启完整 60s |
| E15 | 成功返回 0 条（空态） | A0 | 按 kind 规则 | 属成功：records=[]（空态）；查询性则 A=S；T=更新；候选=全量派生 | — | 请求结束重启完整 60s |
| E16 | 卸载（路由离开） | 任意 | — | — | — | 清计时器、置 disposed，杜绝迟到响应写入 |

> E8/E9/E12：无论 kind，刷新成功的请求参数都取 **A（已应用条件）**，永不取 D；这正是 AC-024 第②/⑤/⑧步“未点击查询的界面变化不影响刷新”的机制保证。

## 9. 并发与竞态设计

结论：复用 topic-offset 的**“单飞行（single-flight）＋最新用户意图槽位”＋意图序号（seq）**模型（已实现并被 topic-offset-R1 采纳），去掉其分页维度，并按其约定强化 DSS 的计时语义：

1. **单飞行**：任意时刻至多一个受控请求在链；`busy` 为真时其它请求不得并发（DSS-REQ-053）。
2. **意图序号 `acceptedSeq`**：每次接受最新用户意图（建立性 query/retry，或条件兼容的 manual）自增并赋给该 op；响应提交前校验 `op.seq===acceptedSeq && !disposed`，**旧响应、旧等待意图、卸载后的迟到响应一律不得覆盖**最新成功现场（防竞态）。
3. **抑制**：`busy` 时 `auto`/`restore` 直接丢弃（不排队、不计时）；`query`/`manual` 等用户意图在条件仍有效时**覆盖进槽位**（最新意图胜出），从而在请求结束后按最新意图补发；被抑制的触发不视为实际请求、不重置计时。
4. **条件判陈**：进入槽位前用 `criteriaEqual` 判断“保留性刷新”是否与在途/槽位中建立性条件冲突，旧条件意图丢弃（topic-offset `preserveValidFor` 思路），避免基于旧 A 的刷新覆盖新条件查询。
5. **计时**：`scheduleNext()` 只在**一次真实请求的 finally 且 visible && !disposed** 时调用（成功失败皆重启完整 60s）；`stopTimer` 于隐藏/卸载；隐藏期间 finally 不重启（检查 hidden）。
6. **卸载**：`destroy()` 置 `disposed=true`、清计时器、清槽位；所有提交/回调先判 `disposed`。
7. **组件 onMounted/onUnmounted/onActivated/onDeactivated + visibilitychange** 对接 `visibilityChanged`，与 timer/store 生命周期一致。

## 10. 未知状态、关联缺失/停用/类别异常、NULL 兼容设计

1. **未知状态**：`classify()` 对任何非两已知原值返回 `UNKNOWN`，行保留、原始值展示、标签橙＋文字（DSS-REQ-037~039）；过滤器 UNKNOWN 语义与分类共用函数（§5.3/5.5）；候选仅在确有未知行时出现（§6.1）。接口/页面绝不因未知值抛错。
2. **关联缺失/停用/类别异常**：行恒保留（映射 state 驱动前端提示，不新增列、不改判快照状态、不触发修复，DSS-REQ-041~045）；展示见 UI §5。
3. **NULL**：两快照时间为 NULL → JSON 显式 null → UI `--`；`UPDATED_AT` 非空但格式化函数对 null 兜底 `--`（DSS-REQ-031/032/055）。
4. **空表**：RUN_STATE 无行 → records=[] 空态、candidates 中 client/source 为空、statuses=[RUNNING,COMPLETED]（仍两项，未知不出现）；属成功空态。
5. **配置表自身异常**（如 FG_ACTIVE 非 '1' 亦非 '0'、类别空/畸形）：一律按“停用=非'1'”“非 SOURCE”宽容处理为对应提示，不抛错、不丢行（DATABASE §12）。

## 11. 安全与只读保证

| 层 | 保证 |
|---|---|
| Controller | 仅 `GET` 端点；无 POST/PUT/PATCH/DELETE；无写方法可调用路径。 |
| Service | 只注入 3 个只读 Mapper；不调用 `save/update/remove/delete/insert`；不持有 `Connection/JdbcTemplate`；无 `@Transactional` 写；不拼字符串 SQL。 |
| Mapper | 均为纯注解 `@Select`、显式列、无 `BaseMapper`（天然无内置 CRUD）；不 `SELECT *`；不读 `DATA_SOURCE_PASSWORD`。 |
| VO | 不包含任何密码/敏感字段；错误消息脱敏（API §8）。 |
| UI | 无写按钮、无操作列、无跳转入口；刷新仅重读。 |
| 测试契约 | Mapper SQL 审计（扫描禁止关键字）、Controller 反射/端点清单断言无写端点、查询期间 SQL 日志无 DML（见 §12/AC-010）。 |
| 文档 | 本设计不新增任何 RUN_STATE 或其它表的写能力；`DSS-REQ-065` 的测试 DML 授权只服务于**后续**测试/验收任务且以提示词显式纳入为前提，本设计任务不使用（DATABASE §13）。 |

## 12. 测试设计（本任务只设计、不执行）与需求/验收覆盖

| 测试类别 | 目标 | 覆盖映射（代表性） |
|---|---|---|
| 后端单测：`classify` | 已知/未知映射 | DSS-REQ-035~039 → AC-032~035/037 |
| 后端单测：过滤 | OR/AND、UNKNOWN 语义、空=全部、与关联异常无关 | DSS-REQ-022~025 → AC-020/022/023 |
| 后端单测：排序 | 状态组序、updatedAt 倒序、并列 key | DSS-REQ-046~049 → AC-043~045 |
| 后端单测：候选 | 全量派生、去重、未知条件出现、不被筛选收窄 | DSS-REQ-024 → AC-022 |
| 后端单测：映射 | 探针/源库 ACTIVE/INACTIVE/NOT_FOUND、sourceRole、类别归一 | DSS-REQ-028/029/041~045 → AC-026/027/038~042 |
| Mapper SQL 审计 | 仅 SELECT、显式列、无 PASSWORD、无 DML 关键字 | DSS-REQ-011~015 → AC-010/013 |
| JSON/时间契约 | 时间串格式、显式 null、无分页字段 | DSS-REQ-026~034/055 → AC-025/029/030/052 |
| 前端 composable 测试 | 两阶段条件、请求快照、失败保留、计时器(隐藏/恢复/抑制/重启)、seq 防旧 | DSS-REQ-023/050~054/058~061 → AC-021/024/047~051/055~058/068 |
| 前端组件测试 | 多选互斥、空值 `--`、颜色非唯一、稳定宽度工具栏 | DSS-REQ-022/029/055/062/063 → AC-020/027/052/060/061/068 |
| 浏览器人工只读目测 | 页面标题、七列、只读、无 console 错误 | DSS-REQ-001/027/050/062 → AC-001/005/067 |

（完整 65/65 与 68/68 机械矩阵见 §14。）

## 13. 风险、取舍与回滚边界

| 风险/取舍 | 评估 | 缓解 |
|---|---|---|
| 全量读取 + 内存过滤（不 SQL 下推） | ~100 行规模完全可接受；换来候选/列表同快照与零注入 | 规模假设超限时（如千行级）仍需先改设计（非本版）；用 DATABASE §11 说明无需索引 |
| 候选与列表放同一响应 | 每次刷新多传候选（小） | 减少一次往返与跨请求不一致；空/小表开销可忽略 |
| 单接口 list（无独立 candidates 端点） | 与 topic-offset 两接口不同 | 本 Feature 候选=全量派生且需与列表同快照，属有意偏离；已在 §6.1 说明 |
| 时间以字符串透传 | 失去服务端 Date 语义 | 已由 topic-offset 验证；展示/格式需求即字符串，排序在服务层用同格式字符串即可 |
| 前端哨兵只存草稿、已应用条件永不含哨兵 | 若误把哨兵当真实值发请求会 41002 | 类型区分（`AppliedCriteria` 无哨兵）+ 序列化器只发白名单 token + 单测 |
| 计时器“每次真实请求结束重启” | 与 topic-offset“仅成功重启”不同 | 以 DSS-REQ-054 为准（更强约束），composable finally 统一调度，抑制/隐藏不触发 |
| 若未来发现需求真实矛盾 | — | 本设计不静默改语义：停止并报告（prompt §10.4） |
| 回滚边界 | 纯文档草案 | 删除/回退 4 份设计文件即回到“已批准需求+未设计”状态；不影响任何代码/数据 |

## 14. 跨文档一致性与设计—需求—验收追踪

### 14.1 一致性清单

四份设计文档（DESIGN/API/UI/DATABASE）在本设计中统一使用：接口 `GET /api/monitor/data-source-run-state/list`；查询参数 `clientId`/`sourceId`/`status`；状态 token `RUNNING`/`COMPLETED`/`UNKNOWN`；原始状态值 `SNAPSHOT_RUNNING`/`SNAPSHOT_COMPLETED`；中文标签 快照进行中/快照已完成/未知状态；时间格式 `YYYY-MM-DD HH:mm:ss`、JSON null、UI `--`；映射状态 `ACTIVE`/`INACTIVE`/`NOT_FOUND`；错误码 `41001/41002`；行键 `clientId+'\x00'+dataSourceId`；排序常量；候选不随筛选收窄。任何偏差视为设计不一致。

### 14.2 需求 → 设计落点矩阵（65/65）

落点记号：D=DESIGN §、A=API §、U=UI §、DB=DATABASE §。

| 需求 | 设计落点 | 需求 | 设计落点 |
|---|---|---|---|
| DSS-REQ-001 | D§1/§4、U§10 | DSS-REQ-034 | A§5/§6、U§4.6 |
| DSS-REQ-002 | D§1 | DSS-REQ-035 | D§5.5、U§5.1、DB§5 |
| DSS-REQ-003 | U§10、D§1 | DSS-REQ-036 | D§5.5、U§5.1、DB§5 |
| DSS-REQ-004 | D§4.2、U§10 | DSS-REQ-037 | D§10、DB§5、A§5 |
| DSS-REQ-005 | U§10 | DSS-REQ-038 | D§5.5/§10、U§5.2 |
| DSS-REQ-006 | DB§3/§5、U§5 | DSS-REQ-039 | D§10、A§5/§7、U§5.2 |
| DSS-REQ-007 | D§2.3/§10、U§2 | DSS-REQ-040 | DB§12、D§13 |
| DSS-REQ-008 | D§2.4、DB§3（跨程序事实） | DSS-REQ-041 | D§5.6、U§5.4 |
| DSS-REQ-009 | D§2.3 | DSS-REQ-042 | D§5.6、U§5.4 |
| DSS-REQ-010 | D§5.7、U§4.5、DB§9 | DSS-REQ-043 | D§5.6、U§5.4 |
| DSS-REQ-011 | D§11、DB§13 | DSS-REQ-044 | D§5.6、U§5.4、DB§3 |
| DSS-REQ-012 | A§3、U§4.6 | DSS-REQ-045 | D§5.6、U§5.5 |
| DSS-REQ-013 | D§11、A§3 | DSS-REQ-046 | D§5.4、U§4.7、DB§8 |
| DSS-REQ-014 | D§5.1、DB§4 | DSS-REQ-047 | D§5.4、U§4.7、DB§8 |
| DSS-REQ-015 | D§5.1/§5.6、DB§4 | DSS-REQ-048 | D§5.4、U§4.7、DB§8 |
| DSS-REQ-016 | D§6.1、DB§4/§6、A§5 | DSS-REQ-049 | U§4.7、A§6 |
| DSS-REQ-017 | DB§4、D§6.1 | DSS-REQ-050 | D§7.6/§8、U§6、A§4 |
| DSS-REQ-018 | U§4.2、D§2.3 | DSS-REQ-051 | D§7.5/§9、U§7.4 |
| DSS-REQ-019 | DB§4、D§5.6 | DSS-REQ-052 | D§11、A§3 |
| DSS-REQ-020 | A§5、DB§11、D§5.1 | DSS-REQ-053 | D§8/§9、U§7.3 |
| DSS-REQ-021 | A§6、U§4.7、D§2.3 | DSS-REQ-054 | D§7.5/§9、U§6.4/§7.3 |
| DSS-REQ-022 | D§5.3/§7.2、U§3、A§4 | DSS-REQ-055 | D§5.7、A§5、U§4.5、DB§9 |
| DSS-REQ-023 | D§7/§8、U§3.6、A§4 | DSS-REQ-056 | D§5.7/§10、DB§9 |
| DSS-REQ-024 | D§6、U§3.2/§3.5、A§5 | DSS-REQ-057 | U§4.5、D§10 |
| DSS-REQ-025 | D§5.3/§8(E7)、U§3.4/§3.6 | DSS-REQ-058 | D§7.6、U§7.1 |
| DSS-REQ-026 | A§6、U§4.1 | DSS-REQ-059 | D§7.4、U§7.2 |
| DSS-REQ-027 | A§5/§6、U§4 | DSS-REQ-060 | D§7.4、U§7.2 |
| DSS-REQ-028 | D§5.6、U§4.3 | DSS-REQ-061 | D§7.4/§7.6、U§6.4/§7.3 |
| DSS-REQ-029 | D§5.6、U§4.4 | DSS-REQ-062 | U§1/§2、D§3.1 |
| DSS-REQ-030 | D§5.5、U§5.2/§5.3 | DSS-REQ-063 | U§5/§8、D§10 |
| DSS-REQ-031 | D§5.7、U§4.5 | DSS-REQ-064 | A§8、U§7.3、D§11 |
| DSS-REQ-032 | D§5.7、U§4.5 | DSS-REQ-065 | DB§13、D§11 |
| DSS-REQ-033 | D§5.7、U§4.5 | | |

覆盖：65/65；无悬空需求。

### 14.3 验收 → 设计落点矩阵（68/68）

| 验收 | 设计落点 | 验收 | 设计落点 |
|---|---|---|---|
| DSS-AC-001 | U§10、A§2 | DSS-AC-035 | U§5.2/§5.3、DB§5 |
| DSS-AC-002 | D§1、U§10 | DSS-AC-036 | DB§12、D§13 |
| DSS-AC-003 | U§10、A§2 | DSS-AC-037 | D§5.5/§6、U§5.2、DB§5 |
| DSS-AC-004 | U§10、D§4.2 | DSS-AC-038 | D§5.6、U§5.4 |
| DSS-AC-005 | U§10 | DSS-AC-039 | D§5.6、U§5.4 |
| DSS-AC-006 | DB§3/§5、U§5.1 | DSS-AC-040 | D§5.6、U§5.4 |
| DSS-AC-007 | D§2.3/§10、U§2 | DSS-AC-041 | D§5.6、U§5.4、DB§3 |
| DSS-AC-008 | D§2.4、U§10 | DSS-AC-042 | D§5.6、U§5.5 |
| DSS-AC-009 | D§5.7、DB§9 | DSS-AC-043 | D§5.4、U§4.7 |
| DSS-AC-010 | D§11、A§3、DB§10/§13 | DSS-AC-044 | D§5.4、U§4.7 |
| DSS-AC-011 | A§3、U§4.6 | DSS-AC-045 | D§5.4、U§4.7 |
| DSS-AC-012 | D§11、DB§13 | DSS-AC-046 | U§4.7、A§6 |
| DSS-AC-013 | D§5.1/§5.6、DB§4 | DSS-AC-047 | D§7.6、U§6 |
| DSS-AC-014 | DB§4、D§6.1 | DSS-AC-048 | D§7.5/§9、U§7.4 |
| DSS-AC-015 | DB§4 | DSS-AC-049 | D§11、A§3 |
| DSS-AC-016 | U§4.2、D§2.3 | DSS-AC-050 | D§8/§9、U§7.3 |
| DSS-AC-017 | DB§4、D§5.6 | DSS-AC-051 | D§7.5/§8/§9、U§6.4/§7.3 |
| DSS-AC-018 | A§6、DB§11 | DSS-AC-052 | D§5.7、U§4.5、DB§9 |
| DSS-AC-019 | A§6、U§4.1 | DSS-AC-053 | D§10、DB§9 |
| DSS-AC-020 | D§5.3/§7.2、U§3 | DSS-AC-054 | U§4.5、D§10 |
| DSS-AC-021 | D§7.4/§8、U§3.6 | DSS-AC-055 | D§7.6、U§7.1 |
| DSS-AC-022 | D§6、U§3.2/§3.5、DB§6 | DSS-AC-056 | D§7.4、U§7.2 |
| DSS-AC-023 | D§5.3、A§4、DB§7 | DSS-AC-057 | D§7.4、U§7.2 |
| DSS-AC-024 | D§7.3/§7.5/§8、U§3.6/§6 | DSS-AC-058 | D§7.4/§7.6、U§6.4/§7.3 |
| DSS-AC-025 | A§5/§6、U§4 | DSS-AC-059 | D§7.3、U§6.3 |
| DSS-AC-026 | D§5.6、U§4.3 | DSS-AC-060 | U§1/§2 |
| DSS-AC-027 | D§5.6、U§4.4 | DSS-AC-061 | U§5/§8 |
| DSS-AC-028 | D§5.5、U§5.3 | DSS-AC-062 | A§8、U§7.3、D§11 |
| DSS-AC-029 | D§5.7、U§4.5 | DSS-AC-063 | DB§13、D§11 |
| DSS-AC-030 | D§5.7、U§4.5、DB§9 | DSS-AC-064 | DB§3、U§5.1 |
| DSS-AC-031 | U§4.6、A§6 | DSS-AC-065 | DB§13、D§11 |
| DSS-AC-032 | U§5.1、DB§5 | DSS-AC-066 | D§12、A§7 |
| DSS-AC-033 | U§5.1、DB§5 | DSS-AC-067 | U§2/§10、D§3.1 |
| DSS-AC-034 | D§10、A§7、DB§5 | DSS-AC-068 | D§7.6/§8、U§6.2 |

覆盖：68/68；无悬空验收；反向引用均在 `DSS-REQ-001~065` 内。

## 15. 设计决策与待确认设计项

### 15.1 本草案已定关键决策（依批准需求 + 代码惯例 + 数据库事实解决，不再推给项目负责人）

1. **唯一接口** `GET /api/monitor/data-source-run-state/list`，响应内嵌 `records+candidates`（§5.8/§6）。
2. **全量读取 + 服务层过滤**（非动态 SQL WHERE），保证候选不被筛选收窄与同快照（§5.1/§6）。
3. **时间以 SQL `TO_CHAR` 字符串透传**，JSON 显式 null，UI `--`（§5.7/API §5）。
4. **状态分类 `classify`**（RUNNING/COMPLETED/UNKNOWN）统一用于过滤/展示/候选（§5.5）。
5. **关联异常标志**：client 3 态、source 4 态（state+sourceRole），源库类别**大小写不敏感归一**、非 SOURCE 仅提示不丢行（§5.6）。
6. **状态候选**恒含 RUNNING/COMPLETED，未知仅在确有未知行时追加（§6.1，符合 AC-022 语义）。
7. **前端 store 持“上次成功现场”**、composable 持“单飞行+seq+计时器瞬态”，两阶段条件用哨兵草稿模型（§7）。
8. **计时器在每次真实请求结束后重启完整 60s（成败皆然）**，抑制/隐藏不重置（§7.5/§8）。
9. **包/类名**避开既有类撞名，置于 `monitor/datasourcerunstate`（§4.2）。
10. **错误码** `41xxx` 段（`41001/41002`），当前无模块占用（§4.1/API §8）。
11. **行键** = `clientId + '\x00' + dataSourceId`（NUL 分隔，同 topic-offset rowKey 方案）；序号前端按排序结果生成（API §6）。
12. **不分页**：不出现 pageNum/pageSize/pages/total 字段（API §6）。

### 15.2 待确认设计项

**0 项**（`pending_user_confirmation_count=0`）。本草案已把可依据批准需求、既有代码惯例与已核验数据库事实解决的方案全部落定（§15.1）；未发现必须在项目负责人层决策的设计分叉。设计草案仍待 **ChatGPT 正式复审**；批准前不进入实现，68 条验收保持 `NOT_RUN`。
