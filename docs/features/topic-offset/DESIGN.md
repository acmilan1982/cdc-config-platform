# 数据同步进度 Feature 设计草案（DESIGN）

## 1. 元数据与状态

| 项目 | 值 |
|---|---|
| Feature 中文名称 | 数据同步进度 |
| Feature 标识 | `topic-offset` |
| 既有路由 | `/monitor/topic-offset` |
| 目标文档 | `docs/features/topic-offset/DESIGN.md` |
| 文档状态 | `APPROVED`（本功能设计基线已获 ChatGPT 正式复审批准，可另起实现任务；见 §1.1） |
| 文档性质 | 功能设计基线草案（第一版只读查询设计；**不包含**编码、DDL、DML、测试执行） |
| 设计任务编号 | `TOPIC-OFFSET-DESIGN-001` |
| 设计依据 | `docs/features/topic-offset/REQUIREMENTS.md`（`APPROVED`）、`ACCEPTANCE.md`（`APPROVED`、100 条 `TOFF-AC-xxx` 全部 `NOT_RUN`）、`DATABASE.md`（`APPROVED`）、`README.md` |
| 起始基线提交 | `a9916eaabc3187e4273d336343fe687c2e55fabf` |
| 创建日期 | 2026-09-02 |

审批状态（与已批准文档保持一致）：

- requirements_status：`APPROVED`
- acceptance_status：`APPROVED`
- database_document_status：`APPROVED`
- acceptance_execution_status：`NOT_RUN`（本任务不执行任何验收；100 条 `TOFF-AC-xxx` 保持 `NOT_RUN`，设计不得把任一验收状态改为 `PASS`）
- design_status：`APPROVED`（本设计基线已获 ChatGPT 正式复审批准，见 §1.1）
- implementation_status：`NOT_STARTED`

本任务只设计，不编码、不测试、不修改数据库、不访问 Oracle/Kafka/ZooKeeper、不启停服务。发现的任何与已批准需求冲突将立即停止报告，不静默选边。

### 1.1 批准收口说明

- ChatGPT 已于 2026-09-02 对提交 `68779649e673da7ee95079c4724b346ea441c5f6`（本设计基线草案及 `TOPIC-OFFSET-DESIGN-001-R1` 定向修订）完成正式复审，结论 `APPROVED`。
- 批准范围：`DESIGN.md`（本文件）、`API.md`、`UI.md` 作为 topic-offset 功能实现设计基线，已确认无阻断实现的设计矛盾；Topic 五段解析、pending/applied 两阶段提交、JSON null 局部序列化、`NEXT_OFFSET` 确定格式模型、三表只读次数与非 SCN 快照边界等均已确认。
- 本收口任务未开始实现：`implementation_status=NOT_STARTED`、`acceptance_execution_status=NOT_RUN`（100 条 `TOFF-AC-xxx` 保持 `NOT_RUN`）。设计基线获批后**可另起 topic-offset 实现任务**；本任务未进行任何编码、测试、验收或数据库访问。

## 2. 目标、范围与非目标

### 2.1 设计目标

把已批准的 124 条需求（TOFF-REQ-001~124）、100 条验收标准（TOFF-AC-001~100，全部 `NOT_RUN`）与已批准数据库物理事实（`DATABASE.md`）转化为**可直接实施、可测试、无关键歧义**的设计基线，作为后续实现任务（页面名称统一、后端查询、前端页面、联调、验收）的唯一设计依据。

### 2.2 范围内（第一版）

- 页面“数据同步进度”，路由保持 `/monitor/topic-offset`（TOFF-REQ-001、TOFF-REQ-002、TOFF-REQ-003）；
- 固定 8 列只读列表：序号、同步对象、已保存消费位置、最新数据位置（用户可见列名；底层 API/VO 字段仍为 `kafkaEndOffset`，见 5.10）、待消费数量、消费延迟、断点更新时间、中心端（TOFF-REQ-081）；
- 固定 `KAFKA_TOPIC ASC, SERVER_ID ASC` 排序、固定每页 150 条、序号跨页连续（TOFF-REQ-087/089/082/092）；
- 查询区四个条件：客户端、源库、目标库（均含“全部”的多选下拉）、表名（TOFF-REQ-021、TOFF-REQ-022）；
- Topic 严格五段解析、原值权威保留、无法解析不猜测（TOFF-REQ-012~019）；
- 客户端/源库/目标库候选读取全部配置（含停用），映射名称与停用/缺失/空名状态（TOFF-REQ-040~053）；
- 首次进入自动缺省查询、同一登录会话返回恢复已生效条件与页码、返回后立即刷新一次（TOFF-REQ-034、TOFF-REQ-099、TOFF-REQ-101）；
- 60 秒自动刷新 + 立即刷新 + 页面不可见暂停 + 重新可见立即刷新 + 请求不重叠（TOFF-REQ-103~113）；
- 断点时间按 `YYYY-MM-DD HH:mm:ss` 展示、Offset 全链路字符串（TOFF-REQ-084、TOFF-REQ-076、TOFF-REQ-080）；
- 最新数据位置（API/VO 字段 `kafkaEndOffset`）、待消费数量、消费延迟第一版统一显示 `—`（TOFF-REQ-064/066/067）。

### 2.3 非目标（第一版明确不做）

- 连接 Kafka 或读取 Kafka 地址/认证/客户端库（TOFF-REQ-004/123）；
- 判断断点过期/异常/离线/有效、计算健康度或完成百分比（TOFF-REQ-005、TOFF-REQ-006、TOFF-REQ-071）；
- 统计卡片、图表、导出、行选择、操作列（TOFF-REQ-007、TOFF-REQ-008、TOFF-REQ-119）；
- 新增/编辑/删除/Offset 重置/重新消费/跳过/从头消费/任何写接口或写动作（TOFF-REQ-008/011/122）；
- 表头排序/排序箭头、分页规格选择器（TOFF-REQ-086/089）；
- 对 `CDC_TOPIC_OFFSET` 的任何写、清理或修复；不改库（TOFF-REQ-122、TOFF-REQ-124、数据库设计结论 §8）。

## 3. 上位基线与代码只读盘点

### 3.1 上位批准基线

本设计完整读取并以上位约束执行：`README.md`、`REQUIREMENTS.md`（124 条）、`ACCEPTANCE.md`（100 条）、`DATABASE.md`、`docs/baseline/` 六份项目级基线（`PROJECT.md`/`ENVIRONMENT.md`/`ARCHITECTURE.md`/`DEVELOPMENT_RULES.md`/`PROJECT_STATUS.md`/`DOMAIN_GLOSSARY.md`）、根目录 `CLAUDE.md`。

### 3.2 后端代码盘点（只读观察，来源当前分支代码）

| 观察项 | 现状事实（文件） | 对设计的影响 |
|---|---|---|
| 包根与模块 | `com.bsoft.cdcconfig`；模块自包含，如 `monitor/jobfailure`、`monitor/zookeeper`、`datasource`、`subscription`（`backend/src/main/java/com/bsoft/cdcconfig/**`） | 本功能新建自包含模块 `com.bsoft.cdcconfig.monitor.topicoffset` |
| 统一响应体 | `ApiResponse<T>`：`code/message/data/timestamp`，成功 `code=200`（`common/api/ApiResponse.java`） | 所有接口返回 `ApiResponse`，HTTP 200 + 业务错误码 |
| 分页结果体 | `PageResult<T>`：`records/total/pageNum/pageSize/pages`（`common/page/PageResult.java`） | 本页列表响应在其上扩展 `unparseableTotal` |
| 异常/错误码 | `GlobalExceptionHandler`（`common/exception/`）+ `BusinessException(code,msg)` + 模块错误码类（如 `monitor/jobfailure/exception/JobFailureErrorCode.java`） | 新建 `monitor/topicoffset/exception/TopicOffsetErrorCode.java` |
| Controller 路由 | 无 context-path；Controller 自写 `/api/...`（如 `/api/job-failure`、`/api/log-query`、`/api/subscriptions`） | 本功能用 `/api/monitor/topic-offset` |
| Mapper 惯例 | 多 `extends BaseMapper<T>`；服务多为普通 interface + `@Service` impl（**不**用 `IService/ServiceImpl`）；`MapperScan com.bsoft.cdcconfig.**.mapper` | Mapper/Service 结构跟随惯例；但对断点表使用**不继承 BaseMapper** 的只读 Mapper（见 5.2） |
| Oracle 分页 | `MyBatisPlusConfig` 配 `PaginationInnerInterceptor(DbType.ORACLE)`，但无业务实际调用 MP `Page`；现网实现多为内存切片（如 `JobFailureServiceImpl.queryHistory` `subList` 分页）；Oracle SQL 用 `FETCH FIRST n ROWS ONLY`，无 MySQL `LIMIT` | ≤6000 条规模下采用 **SQL 取全量（固定排序）→ Java 过滤 → 内存切片**，不引入 SQL 分页 |
| `CDC_TOPIC_OFFSET` 代码 | 后端无任何实体/Mapper/XML 引用（仅前端静态产物占位） | 绿场新增只读访问；字段以 `DATABASE.md` 为准 |
| 配置表既有访问 | `CDC_CLIENT_MULTIPLE`：`monitor/jobfailure` 现仅按 `FG_ACTIVE='1'` 取启用项；`CDC_DATA_SOURCE`：`subscription` 已有**安全投影** `DataSourceRef`（只映射 ID/ORG/CATEGORY/FG_ACTIVE，注释“绝不加载 DATA_SOURCE_PASSWORD”） | 本功能候选需**全部配置（含停用）**，且绝不可 SELECT 密码列 → 新建本模块内显式列投影 Mapper（见 5.5） |
| Jackson/时间 | `spring.jackson.date-format=yyyy-MM-dd HH:mm:ss`、`time-zone=GMT+8`、`default-property-inclusion=non_null`（`application.yml`）；**无全局 Long/BigDecimal→字符串序列化器** | Offset/时间**不由 Jackson 数字/时间序列化承载**，改用 SQL `TO_CHAR` 直接产出字符串（见 5.8），消除精度与时区漂移 |
| 测试 | JUnit 5 + Mockito；`backend/src/test/java/com/bsoft/cdcconfig/**`（如 `datasource/service/DataSourceServiceTest.java`） | 测试组织跟随，见 §11 |

### 3.3 前端代码盘点（只读观察，来源当前分支代码）

| 观察项 | 现状事实（文件） | 对设计的影响 |
|---|---|---|
| 路由 | `src/router/index.ts` 扁平路由、无嵌套 children、`meta:{title,group}`；`/monitor/topic-offset` → `TopicOffsetPage.vue`（`meta.title='Topic 偏移量', group='运行监控'`） | 路由保持；实现阶段把 meta.title 与菜单标题统一为“数据同步进度” |
| 菜单 | `src/config/menu.ts` `MenuItem{path,title,icon}`；`/monitor/topic-offset` 标题“Topic 偏移量” | 实现阶段改标题；本设计不改代码 |
| 布局缓存 | `MainLayout.vue` `<router-view/>` **无 keep-alive**；项目内无任何 keep-alive 先例 | 会话恢复不能用路由缓存，采用**路由级 Pinia store**（见 6.3） |
| API 层 | `src/services/http.ts` axios（baseURL 来自 env，拦截器仅错误 `ElMessage`）；信封类型 `ApiResponse<T>`（`src/types/monitor.ts`）；分页类型 `PageResult<T>`（各域 types 文件）；多值重复参数序列化先例 `src/api/subscription.ts` | 本功能 `src/api/topicOffset.ts` + `src/types/topicOffset.ts`，重复参数 `clientId=a&clientId=b` |
| 状态管理 | Pinia 仅 `app.ts`（appName/version）；页面列表状态均组件本地（如 `job-failure/index.vue`、`log-query` composable）；有请求序号防旧覆盖先例（`useLogQueryTab.ts` request 令牌） | 页面本地 transient 状态 + 专用于会话恢复的 store |
| “全部”多选互斥先例 | `src/views/log-query/components/selection.ts` `normalizeSelection`（哨兵 `__ALL__`） | 本功能在自身工具中实现同一互斥语义（哨兵 `__ALL__`） |
| 自动刷新/可见性先例 | `CdcNodeStatusPage.vue`（setInterval + refreshing 防重 + requestId）；`LargeScreenPage.vue`（`visibilitychange` 暂停） | 组合二者形成本页计时模型（§7） |
| Element Plus | `^2.5.0` 全量引入；表格 `size="small" border`；`fixed="left"`/右对齐数字/`show-overflow-tooltip`/手写 `el-tooltip` 均有先例 | 本页样式沿用 EP 体系（见 UI.md） |
| 视觉令牌 | `src/styles/theme.css`（`--app-*`、EP 覆盖 `--el-color-*`）；无 monospace/警告字面令牌 → 页面按需局部定义 | 见 UI.md §10/§12 |
| 占位页边界 | `src/views/topic-offset/TopicOffsetPage.vue` 复用 `PlaceholderPage` | 实现阶段**替换该文件内容**，保留路径与路由；同时改路由/菜单标题 |

### 3.4 复用与新建边界

- **复用**：`ApiResponse`/`PageResult`/`BusinessException`/`GlobalExceptionHandler`、EP 全量组件、axios 封装与信封类型、`PageResult` 前端类型、`el-select`+`__ALL__` 互斥交互语义、60s 计时与 `visibilitychange` 语义、请求序号防旧覆盖模式。
- **不直接复用**：`monitor/jobfailure` 的启用过滤查询（只返回启用项，而本页需全部配置）、`subscription` 模块内部类（避免跨模块耦合），故新建本模块薄读取层（见 5.5）。不虚构任何不存在的公共组件。

## 4. 总体架构与调用链

```
前端 TopicOffsetPage.vue（查询区/工具栏/8列表格/分页）
   │  (axios: GET /api/monitor/topic-offset/offsets  查询+自动刷新+分页)
   │  (axios: GET /api/monitor/topic-offset/candidates  候选下拉/最新配置)
   ▼
TopicOffsetController  ←─ 只暴露两个只读 GET（无任何写入口）
   ▼
TopicOffsetQueryService(interface)+Impl
   ├─ 读取断点：TopicOffsetMapper（仅 @Select，TO_CHAR 字符串化）
   ├─ 读取配置：ClientConfigMapper / DataSourceConfigSafeMapper（显式列投影，不含密码）
   ├─ TopicNameParser（纯函数严格五段解析）
   └─ 过滤/映射/内存切片 → 组装 VO
   ▼
ApiResponse<TopicOffsetPageVO|CandidateGroupVO>
```

调用链：一次 `/offsets` 请求内按固定顺序依次执行 **三次只读 SELECT**（配置两表 + 断点表各一次），结果在内存汇总；全程无 DML、不开数据库事务，**不存在跨三张表的 Oracle 同一 SCN 一致快照**——三次 SELECT 依次独立返回，配置与断点只在 Java 内存映射层面对齐。

1. Controller 接收并校验查询参数；
2. 只读 SELECT ①（配置表一）：`CDC_CLIENT_MULTIPLE` 显式列投影（CLIENT_ID/CLIENT_DESC/FG_ACTIVE）全部行，用于客户端映射；
3. 只读 SELECT ②（配置表二）：`CDC_DATA_SOURCE` 显式列投影（DATA_SOURCE_ID/DATA_SOURCE_ORG/DATA_SOURCE_CATEGORY/FG_ACTIVE，**列清单不含密码**）全部行，用于源库/目标库映射；
4. 只读 SELECT ③（断点表）：`TopicOffsetMapper` 以 `ORDER BY KAFKA_TOPIC ASC, SERVER_ID ASC` 取 `CDC_TOPIC_OFFSET` 全量（≤6000）；
5. 在 Java 内存将两张配置表结果构造为 `clientById`/`dataSourceById` 映射（本设计中“配置快照”仅指**同一次请求内依次读取后形成的内存映射**，不是 Oracle SCN 一致快照；见 5.5）；
6. 逐行严格解析 Topic（`TopicNameParser`）；可解析取 5 段，否则标记无法解析且不猜测（TOFF-REQ-014/015/017/019）；
7. 应用结构化过滤：无任何结构化条件 → 保留全部（含无法解析，TOFF-REQ-032）；任一结构化条件生效 → 无法解析行不参与匹配（TOFF-REQ-033），仅保留命中的可解析行；
8. 计算 `total`（过滤后全集行数）与 `unparseableTotal`（过滤后全集中无法解析行数，TOFF-REQ-020）；
9. 按 `(pageNum-1)*150` 切片当前页（保持 SQL 既定排序，不做二次排序）；
10. 每行映射客户端/源库/目标库显示状态并格式化 Offset/时间为字符串，组装 `TopicOffsetItemVO`；
11. 返回 `ApiResponse`。

候选查询调用链：一次 `/candidates` 请求执行 **两次只读 SELECT**（仅两张配置表：`CDC_CLIENT_MULTIPLE` + `CDC_DATA_SOURCE`），在内存构造映射后按规则排序/分类（SOURCE/TARGET 大小写不敏感）→ 组装候选 VO。

## 5. 后端设计

### 5.1 模块与文件规划

新建包 `com.bsoft.cdcconfig.monitor.topicoffset`：

| 文件 | 职责 |
|---|---|
| `controller/TopicOffsetController.java` | 两个只读 GET：`/offsets`、`/candidates`；仅参数解析与委托 |
| `query/TopicOffsetQuery.java` | offsets 查询参数载体（`List<String> clientId/sourceId/targetId`、`String tableName`、`Integer pageNum`） |
| `service/TopicOffsetQueryService.java` + `service/impl/TopicOffsetQueryServiceImpl.java` | 查询编排：只读 SELECT 读两张配置表 + 断点表（offsets 共三次、candidates 共两次），内存映射、解析、过滤、分片 |
| `parser/TopicNameParser.java` | 纯函数：严格五段解析；无状态、可单测 |
| `mapper/TopicOffsetMapper.java` | 断点表**只读 Mapper（不继承 BaseMapper）**，`@Select` 固定排序 + `TO_CHAR` 字符串化 |
| `mapper/ClientConfigMapper.java` | `CDC_CLIENT_MULTIPLE` 显式列投影（CLIENT_ID/CLIENT_DESC/FG_ACTIVE），全部行 |
| `mapper/DataSourceConfigMapper.java` | `CDC_DATA_SOURCE` 显式列投影（DATA_SOURCE_ID/ORG/CATEGORY/FG_ACTIVE），全部行；**列清单中绝不出现 DATA_SOURCE_PASSWORD** |
| `model/TopicOffsetRow.java`、`model/ClientConfigRow.java`、`model/DataSourceConfigRow.java` | Mapper 返回行（camelCase 字段） |
| `domain/TopicParts.java` | 解析成功的五段（clientId/sourceId/schema/table/targetId）与解析结果封装 |
| `vo/TopicOffsetPageVO.java`、`vo/TopicOffsetItemVO.java`、`vo/TopicNameMapVO.java`、`vo/CandidateGroupVO.java`、`vo/ClientCandidateVO.java`、`vo/DataSourceCandidateVO.java` | 响应 VO（纯 camelCase POJO，不直接暴露实体） |
| `constant/TopicOffsetConstants.java` | 常量：`PAGE_SIZE=150`、映射状态枚举字符串（`ACTIVE/INACTIVE/NOT_FOUND`）、各类上限 |
| `exception/TopicOffsetErrorCode.java` | 参数校验错误码（见 5.9） |

### 5.2 只读链路与禁止写约束

- `TopicOffsetMapper` **不继承 `BaseMapper`**，接口内仅有 `@Select`；因此该表在 Mapper 层**不存在** save/update/delete/remove 等方法面（满足 TOFF-REQ-011/122、TOFF-AC-005 ⑤）。
- 两个配置 Mapper 同理使用显式 `@Select` 投影，不含任何写方法。
- Service 不调用任何持久化写 API；业务层不存在对断点/配置表的写方法。
- Controller 只暴露 `GET`；请求、分页、自动/手工刷新都是同一只读 `GET`（TOFF-REQ-009）。
- 仅 `SELECT` 不得触发 DML；实现与验收通过 SQL 日志/审计核验（TOFF-REQ-122、TOFF-AC-004/005）。

### 5.3 Topic 严格五段解析（纯函数，归属后端 parser 层）

规则（TOFF-REQ-012~019）：

- 解析对象是数据库原样 `KAFKA_TOPIC` 原始值；任何地方都不重新拼接/替换/写回（TOFF-REQ-012、TOFF-REQ-013、TOFF-REQ-124）。
- 成功条件（TOFF-REQ-014/015）：按英文句点 `.` 拆分，**恰好得到 5 段即解析成功**；多于或少于 5 段均视为无法解析。已批准需求**没有**规定“段必须非空”，故本设计**不引入“非空段/空段一律失败”规则**，也不用正则做段校验；`DATABASE.md` §7 “各段非空、无前导/结尾/连续句点”是对当前 8 条样本的**数据事实观察**（样本恰好全部为 5 段非空），是复核记录，不是解析规则，不得作为解析判定依据。
- 实现要点：使用能保留尾部空段的拆分方式 `topic.split("\\.", -1)`（`limit=-1` 时尾部空串被保留，不会因默认 split 吞尾串而改变段数），拆分结果数组长度恰好为 5 即 `parseable=true`；解析后 `parts[0]=clientId`、`parts[1]=sourceId`、`parts[2]=schema`、`parts[3]=table`、`parts[4]=targetId`。**不 trim、不改写、不重组**原始 Topic（TOFF-REQ-013/124）。
- 空段语义：若真实存在由前导点、尾点或连续点产生的空段，只要拆分长度恰好为 5，该行仍解析成功；空段按**原值（空串）**参与展示、精确筛选与配置映射，**不自行添加任何占位业务文案**（不把空段猜成客户端/源库/Schema/表名/目标库含义）。配置表主键不可能为空串，空段在配置映射中无匹配 → 该端映射 `NOT_FOUND`（UI 按其规则标记“配置不存在”，TOFF-REQ-058）；空段精确筛选只在用户显式传入空值时才会命中，候选下拉不提供空选项，实际不会被选中。当前开发样本无此类形态（`DATABASE.md` §7），由单元测试构造覆盖（§11）。
- 无法解析（拆分后多于 5 段或少于 5 段，含段内含句点导致多段）：返回 `parseable=false`，不猜测、不部分解析、不从配置反向推断（TOFF-REQ-015/017/019/062）；原始 Topic 仍原样返回用于悬浮，Offset/断点时间/中心端等其余字段照常展示（TOFF-REQ-016/018）。
- 解析结果只用于“展示”与“查询”，`KAFKA_TOPIC` 原值始终随响应返回用于悬浮（TOFF-REQ-018/061）。
- 开发库当前无异常样本（`DATABASE.md` §7），异常分支由单元测试构造覆盖（§11）。

### 5.4 过滤算法（先筛选 → 再固定排序 → 再分页，TOFF-REQ-090）

查询条件与映射（TOFF-REQ-021~033）：

| 条件 | 语义 | 判定（Java） |
|---|---|---|
| 客户端 | “全部” 或 选中若干 `clientId`，精确匹配**解析后第 1 段**，不转换大小写（TOFF-REQ-027） | 段值在选中集合内；同维“或” |
| 源库 | 同上，匹配解析后第 2 段（TOFF-REQ-027） | 同上 |
| 目标库 | 同上，匹配解析后第 5 段（TOFF-REQ-027） | 同上 |
| 表名 | 不区分大小写**包含**，只匹配解析后第 4 段（表名），不匹配 Schema（TOFF-REQ-028、TOFF-REQ-029） | `table.toLowerCase(Locale.ROOT).contains(v.toLowerCase(Locale.ROOT))` |
| 维度关系 | 同一维“或”，跨维“且”（TOFF-REQ-026） | 各维存在命中才保留 |

“全部/无结构化条件”规则：

- 客户端/源库/目标库的“全部”表示该维**不作为真实值参与**（TOFF-REQ-023、TOFF-REQ-024、TOFF-REQ-025）；前端哨兵 `__ALL__` 不会传给后端。
- 三个下拉均“全部”且表名为空 → 无结构化条件：**保留全部行（含无法解析行）**（TOFF-REQ-032）。
- 任一结构化条件生效（任一维选了具体 ID，或表名去首尾空格后非空）→ 无法解析行不参与匹配（TOFF-REQ-033）；能命中的只能来自可解析行。
- 表名首尾空格在**提交成“生效条件”前**去除（TOFF-REQ-030）；过滤用的都是去掉空格后的值。
- `%`、`_`、反斜杠按普通字符处理：因为过滤全部在 Java 内存字符串比较中完成，**不存在 SQL LIKE/通配符**，故天然不把这些字符当通配符、无需转义（TOFF-REQ-031、TOFF-AC-034）。这是本设计的单一明确选择：**不为过滤生成任何 LIKE SQL**。

过滤后保序：`TopicOffsetMapper` 已按 `KAFKA_TOPIC ASC, SERVER_ID ASC` 返回，Java 过滤只做“保留/剔除”不改序，故过滤后子序列仍保持同一固定排序（TOFF-REQ-087/088）。

### 5.5 配置最新映射与候选（TOFF-REQ-040~053）

- 每次 `/offsets` 请求共执行 **三次只读 SELECT**：`CDC_CLIENT_MULTIPLE`、`CDC_DATA_SOURCE`（本小节，映射用）与 `CDC_TOPIC_OFFSET`（断点表，见 5.2/5.8）；每次 `/candidates` 请求执行 **两次只读 SELECT**（仅两张配置表）。两张配置表每次请求都重新读取**最新全部配置**用于名称与状态映射（TOFF-REQ-052），不存在复用上一条数据的缓存。
- 配置表与断点表是**三次独立依次执行**的只读查询，无数据库事务包裹；这里所述的映射只在**同一次请求内按顺序读取后**于 Java 内存中构造，**不构成跨三张表的 Oracle 同一 SCN 一致快照**（若保留“配置快照”一词，仅指上述内存映射，不是数据库快照）。
- `ClientConfigMapper`：`SELECT CLIENT_ID, CLIENT_DESC, FG_ACTIVE FROM CDC_CLIENT_MULTIPLE`（全部行，不过滤启用）。
- `DataSourceConfigMapper`：`SELECT DATA_SOURCE_ID, DATA_SOURCE_ORG, DATA_SOURCE_CATEGORY, FG_ACTIVE FROM CDC_DATA_SOURCE`（全部行，不过滤启用；列清单固定，**绝不**读取 `DATA_SOURCE_PASSWORD`，参照 `subscription/entity/DataSourceRef` 安全投影先例）。
- 内存快照结构：
  - `clientById`：`CLIENT_ID(主键唯一) → {desc, active}`（FG_ACTIVE 判定：`FG_ACTIVE == '1'` 为启用，否则停用；TOFF-REQ-046、`DOMAIN_GLOSSARY` FG_ACTIVE 语义）。
  - `dataSourceById`：`DATA_SOURCE_ID(主键唯一) → {org, category, active}`（用于行映射，不受类别限制）。
  - 候选派生：`sources = dataSourceById` 中 `UPPER(category)='SOURCE'`；`targets = ...='TARGET'`（大小写不敏感，TOFF-REQ-044）；类别为 NULL/其它不入候选但**仍保留在 id 映射**用于行显示，避免隐藏记录（TOFF-REQ-010/051）。
- 候选顺序：客户端 `ORDER BY CLIENT_ID`；源库/目标库 `ORDER BY DATA_SOURCE_ORG ASC NULLS LAST, DATA_SOURCE_ID ASC`（TOFF-REQ-041/042/043）；`ALL`/“全部”是前端第一项，后端不返回（TOFF-REQ-050）。
- ID 去重：两张表主键唯一（`DATABASE.md` 已核实无重复 ID），仍按 `LinkedHashMap`/map key 去重作为防御（TOFF-REQ-049）。
- 行映射状态（显示语义详见表单与 UI.md §6）：
  - 客户端/源库/目标库 ID 在配置中不存在 → `NOT_FOUND`（展示原始 ID + “配置不存在”，TOFF-REQ-058）；该 ID 不加入候选但不影响缺省查询展示（TOFF-REQ-051）。
  - 存在但 `FG_ACTIVE != '1'` → `INACTIVE`（仍显示名称或 ID 并标记“已停用”，TOFF-REQ-057/046）。
  - 存在且启用 → `ACTIVE`。
  - 数据源存在但 `DATA_SOURCE_ORG` 为空/空白 → 显示“未定义名称”（TOFF-REQ-048/059）。
- 已生效筛选 ID 在刷新期间被删除：过滤只看“Topic 解析出的段值”，与配置是否存在无关，因此记录不被隐藏（TOFF-REQ-010/053）；“ID（配置不存在）”的临时项由前端按最新候选差集生成（UI.md §9），后端照常接受该 ID 作为过滤值。

### 5.6 排序与分页（TOFF-REQ-087~093）

- 排序单一权威：`CDC_TOPIC_OFFSET ORDER BY KAFKA_TOPIC ASC, SERVER_ID ASC`（NLS_SORT=BINARY 字节序，确定性；`DATABASE.md` §9-g）；Java 过滤不改序。不对解析后客户端 ID 排序（TOFF-REQ-088）。
- 固定每页 150 条（`PAGE_SIZE=150`），不提供分页规格选择器（TOFF-REQ-089）；`pageNum` 由前端传入，缺省 1。
- 切片：`from=(pageNum-1)*150; to=min(from+150,total)`；记录按上述已排序集合顺序截取。
- `total` = 过滤后全集行数（TOFF-REQ-092）。
- `pages` = `ceil(total/150)`（total=0 → 0 页；空结果前端回到第 1 页）。

### 5.7 total 与 unparseableTotal 口径（TOFF-REQ-020、TOFF-REQ-098）

- 二者都基于**过滤后全集**，不随页变化。
- `unparseableTotal` = 过滤后全集中 `parseable=false` 的行数：无结构化条件时为全表无法解析行数；存在结构化条件时为 0（因无法解析行不参与匹配，TOFF-REQ-033）。前端工具栏据此展示，不另做统计页（TOFF-AC-018）。

### 5.8 NEXT_OFFSET 字符串链路与 UPDATED_AT 格式化

单一明确选择：在 Mapper 的 `@Select` 内用 Oracle 函数把数值与时间直接转字符串，Java/JSON 全程字符串（TOFF-REQ-076、TOFF-REQ-080、TOFF-AC-077/081）。`NEXT_OFFSET` 采用**显式格式模型 + 固定数字字符设置**，不依赖会话 NLS，消除无格式 `TO_CHAR` 的表示不确定性。

```sql
SELECT SERVER_ID                                        AS serverId
      ,KAFKA_TOPIC                                      AS kafkaTopic
      ,TO_CHAR(NEXT_OFFSET
              ,'FM99999999999999999990'
              ,'NLS_NUMERIC_CHARACTERS=''.,''')         AS nextOffsetStr   -- NUMBER(19,0) → 确定性十进制整数字符串
      ,TO_CHAR(UPDATED_AT,'YYYY-MM-DD HH24:MI:SS')      AS updatedAtStr    -- Oracle DATE 秒级、无时区 → 原样钟面时间
FROM   CDC.CDC_TOPIC_OFFSET
ORDER  BY KAFKA_TOPIC ASC, SERVER_ID ASC
```

格式要点（Oracle 19c、`NUMBER(19,0)`）：

- 格式模型为 `FM` + 20 个整数数字位（示例 `99999999999999999990` 为 19 个 `9` + 末位强制 `0`），至少提供 19 个整数位，**完整容纳 `NUMBER(19,0)` 的全部合法值**（绝对值最大 19 位：`±9999999999999999999`）；末位 `0` 保证整数值至少显示一位（`0 → '0'`），`FM` 抑制前导/尾随空格与多余 `9` 空位。
- `NLS_NUMERIC_CHARACTERS=''.,''` 固定小数点 `.`、组分隔符 `,`，配合不含 `G`/`D` 的格式：**不产生千分位、不受会话 NLS 数字字符影响**。
- 结果恒为普通十进制整数字符串：**无科学计数、无千分位、无前后空格、不丢精度**；Java 只透传，**永不转 `double/BigInteger` 或 Jackson 数值序列化**（TOFF-REQ-076、TOFF-REQ-080、TOFF-AC-008/077/081）。
- 设计验证样例（后续 Mapper/接口测试必测；本任务不连接数据库验证）：

| 输入值（NUMBER(19,0)） | 期望输出字符串 |
|---|---|
| `0` | `"0"` |
| `1` | `"1"` |
| `-1` | `"-1"` |
| `9007199254740993`（超 JS 安全整数） | `"9007199254740993"` |
| `9999999999999999999`（19 位正边界） | `"9999999999999999999"` |
| `-9999999999999999999`（19 位负边界） | `"-9999999999999999999"` |

其余说明：

- `UPDATED_AT DATE` 为秒级、无时区（`DATABASE.md` §9-i）；`TO_CHAR(UPDATED_AT,'YYYY-MM-DD HH24:MI:SS')` 输出的是数据库存储钟面时间，**不做任何隐式时区换算**，符合 TOFF-REQ-084、TOFF-REQ-124（只允许按 `YYYY-MM-DD HH:mm:ss` 显示格式化，不得篡改业务时间值）与 TOFF-AC-008/066。
- 项目全局 Jackson `date-format/time-zone` 不作用于本 VO（本 VO 字段本身是 `String`），因此不存在“JDK 默认时区把 DATE 平移”的风险。
- VO 中 `nextOffset`/`updatedAt` 类型为 `String`（见 API.md 字段字典）。`rawTopic` 原样返回（TOFF-REQ-012/018）。

### 5.9 参数校验与错误码（防御性，TOFF-REQ 无冲突；接口契约见 API.md）

- `pageNum`：可空（缺省 1），解析须为整数且 `>=1`，否则 `40001`。
- `clientId/sourceId/targetId`：每一维传入数 ≤ 50（防御上限），超限 `40003`；单项去除首尾空格后须非空。
- `tableName`：去除首尾空格后长度 ≤ 200，超长 `40002`。
- 校验失败统一抛 `BusinessException(code,msg)`，HTTP 200 + 非 200 业务码（沿用项目统一响应约定）。
- 不新增任何新增/修改/删除/Offset 重置/Kafka 操作接口（TOFF-REQ-008/011/122；质量门槛）。

### 5.10 行显示数据模型（映射结果 VO，接口字段见 API.md §6）

`TopicOffsetItemVO` 每个字段都是已解析/已映射结果，前端不做配置猜算：

| 字段 | 说明 |
|---|---|
| `serverId` | 原样 `SERVER_ID`（TOFF-REQ-085） |
| `rawTopic` | 原样 `KAFKA_TOPIC`（悬浮完整原始 Topic，TOFF-REQ-018/061） |
| `nextOffset`/`updatedAt` | 字符串（5.8） |
| `kafkaEndOffset/pendingCount/consumeLag` | 恒为 JSON 显式 `null`（第一版三列 `—`；未来值为字符串口径，TOFF-REQ-063~070/076；禁止设计为 0）。这三列在 `TopicOffsetItemVO` 上以字段级 `@JsonInclude(ALWAYS)` 显式输出，见下 |
| `parseable` | 是否解析成功 |
| `parsed` | 成功时 `{clientId,sourceId,schema,table,targetId}`（TOFF-REQ-054 二行、28 表名过滤来源）；失败行 JSON 显式 `null`（字段级 `@JsonInclude(ALWAYS)`，见下） |
| `mapping` | 成功时 `{client:{state,id,desc?}, source:{state,id,org?}, target:{state,id,org?}}`；`state ∈ ACTIVE/INACTIVE/NOT_FOUND`（5.5）；失败行 JSON 显式 `null`（字段级 `@JsonInclude(ALWAYS)`，见下） |

**Jackson 序列化包含规则（null 与全局 `non_null` 冲突的唯一实现方案，与 API.md §3.1 一致）**：

- 项目全局 `default-property-inclusion=non_null`（§3.2），**只靠全局配置不会输出 `null` 字段**——不能在响应中呈现 Kafka 三列 `null`、失败行 `parsed`/`mapping` 为 `null` 的契约。
- 唯一方案：在承载 VO `TopicOffsetItemVO` 上，对**必须显式 `null`** 的五个字段（`kafkaEndOffset/pendingCount/consumeLag` 与不可解析行的 `parsed/mapping`）使用**字段级** `@JsonInclude(JsonInclude.Include.ALWAYS)`，仅覆盖这些字段/VO，**不改变全局序列化配置**；其余字段保持全局 `non_null`。
- `parsed`/`mapping` 为成功（非 null）时本就正常输出；其内部子对象字段（如 `org/desc` 可空）保持 VO 内普通字段默认规则（非 null 才输出）。
- 前端类型与 UI 规则保持：接口字段类型为 `string\|null`，`null` → 页面显示 `—`/空位规则，**绝不转成 `0` 或字符串 `"null"`**（见 UI.md §5；TOFF-REQ-066）。

## 6. 前端设计

### 6.1 文件规划

| 文件 | 职责 |
|---|---|
| `src/types/topicOffset.ts` | `ApiResponse` 复用 `@/types/monitor`；`TopicOffsetPageResult/TopicOffsetItem/TopicNameMap/MappingRef/映射状态联合/CandidateGroup` 类型 |
| `src/api/topicOffset.ts` | `fetchOffsets(params)`、`fetchCandidates()`；重复参数序列化（先例 `subscription.ts`） |
| `src/stores/topicOffset.ts` | 会话级 store（6.3）：最近成功生效条件、页码、最近成功结果、最近成功刷新时间 |
| `src/views/topic-offset/TopicOffsetPage.vue` | 替换现有占位页内容；页面编排 + 计时/可见性 + 错误/空态 |
| `src/views/topic-offset/utils/selection.ts` | “全部/具体项”互斥（哨兵 `__ALL__`，语义同 `log-query/selection.ts`） |
| `src/views/topic-offset/components/OffsetQueryBar.vue` | 查询区：客户端/源库/目标库多选（含“全部”）+ 表名 + 查询/重置 |
| `src/views/topic-offset/components/OffsetToolbar.vue` | 工具栏：左组（总数、无法解析警示文案）、右组（60s 刷新状态、最近成功刷新时间、立即刷新）；字号层级见 UI.md §12.1 |
| `src/views/topic-offset/components/OffsetTable.vue` | 8 列表格（含“最新数据位置”用户表头，数据字段 `kafkaEndOffset`）+ 同步对象两行格式/悬浮（受控单实例延迟 Tooltip：激活行键 + 350ms 计时、离开/结果替换/翻页/刷新提交/卸载即关闭、非 enterable、长 Topic 换行）+ 空/加载态 |

### 6.2 状态模型（区分并设计）

| 状态 | 载体 | 生命周期 |
|---|---|---|
| 表单草稿 `draft` | 组件本地 `reactive{clients,sources,targets,tableName}` | 仅组件存活期；未提交草稿不保留（TOFF-REQ-100） |
| 待提交条件 `pendingCriteria` | 组件本地（不可变快照） | 点“查询”时由草稿规范化生成、目标页 1；**只用于本次请求**，成功提交前不写入 store（见 6.5） |
| 生效条件 `applied`（store `appliedCriteria`） | store | **仅在查询/分页/刷新成功且仍是当前请求时原子提交**；失败不改写；跨页面停留保留（TOFF-REQ-099） |
| 当前页码 `pageNum` | store | 仅“成功且仍是当前请求”时提交：查询成功回到 1（TOFF-REQ-035/091），刷新保持、翻页成功才更新（TOFF-REQ-110） |
| 候选配置 `candidates` | 组件本地（每次数据操作刷新） | 每次首次/条件查询/翻页/刷新/返回都读取最新（TOFF-REQ-052） |
| 最近成功结果 `records/total/unparseableTotal` | store | 查询失败保留上一次（TOFF-REQ-039/111）；初始 `null` |
| 最近成功刷新时间 `lastRefreshAt` | store | 页面成功取得数据时刻（TOFF-REQ-114；非 `UPDATED_AT`） |
| 请求令牌/加载态 | 组件本地 | 防旧覆盖 + 轻量刷新指示 |

组件本地暂态：`loading`（首次/查询大态）、`refreshing`（自动/手工轻量刷新）、`pendingCriteria`（点查询后至成功提交间的一次性条件快照）、`requestSeq`、`requestInFlight`、`lastError`、store 未初始化标志。

### 6.3 会话恢复机制（TOFF-REQ-099、TOFF-REQ-100、TOFF-REQ-101、TOFF-REQ-102）

- 项目**无 keep-alive**，路由卸载即销毁组件；单一明确选择：新增 `stores/topicOffset.ts`（Pinia，内存态）。
- 首次会话进入：store 无“上次成功”记录 → 表单显示缺省（三“全部”+空表名）、第 1 页、自动发起缺省查询（TOFF-REQ-097、TOFF-REQ-098、TOFF-REQ-034、TOFF-REQ-037）。
- 同一会话离开页面再返回：store 保留 `appliedCriteria+pageNum+records` → 进入时**表单恢复为已生效条件**（非草稿）、回恢复页码、先展示保留结果并**立即刷新一次**，成功后重计 60s 周期（TOFF-REQ-099、TOFF-REQ-100、TOFF-REQ-101、TOFF-REQ-103）。
- 浏览器刷新/重新登录/新会话：Pinia 内存清空 → 恢复缺省查询（TOFF-REQ-102）。不使用 sessionStorage/localStorage，避免跨会话陈旧缓存。
- 恢复时若保留页码越界，按 §7 越界收敛处理（TOFF-REQ-093）。

### 6.4 组件行为约定（详细交互见 UI.md）

- `OffsetQueryBar` 持有草稿；点“查询”= 由草稿规范化生成一次性 `pendingCriteria`、目标页 1 并发起请求；**请求成功（且仍是当前请求）后才原子提交**为 `appliedCriteria+pageNum=1`（两阶段提交，见 6.5；TOFF-REQ-035/038）。点“重置”= 草稿恢复缺省、**不查询**、不改 pending/applied/页码（TOFF-REQ-037）。
- “全部”互斥：选择具体项自动取消“全部”，选“全部”清空具体项，清空具体项恢复“全部”；哨兵 `__ALL__` 仅在表单层存在，从不作为真实值请求（TOFF-REQ-023、TOFF-REQ-024、TOFF-REQ-025）。
- 自动/手工刷新使用 store 的 `appliedCriteria` 与已提交 `pageNum`，不使用草稿、也不使用未提交的 `pendingCriteria`（TOFF-REQ-038/110）。
- 最近成功刷新时间用前端成功返回时刻（`lastRefreshAt`），随成功刷新更新；与数据库 `UPDATED_AT` 无关（TOFF-REQ-114、TOFF-AC-098）。
- 表名输入在生成 `pendingCriteria`（提交请求）前去除首尾空格（TOFF-REQ-030）。

### 6.5 生效条件两阶段提交模型（查询/翻页/刷新统一）

单一明确选择：**`appliedCriteria` 与 `pageNum` 只在请求成功且仍是当前有效请求时原子提交**，任何失败请求都不得改写“上一次成功生效条件/页码/结果”。流程如下：

1. 用户点击“查询”：用当前草稿规范化生成**不可变** `pendingCriteria`（三“全部”归一为空、表名去首尾空格），目标页 `1`；
2. 发起请求 `fetchOffsets(pendingCriteria, pageNum=1)`（同次一并刷新候选配置，TOFF-REQ-052）；
3. 响应成功**且 `seq === requestSeq`（仍是当前有效请求）**时，一次性原子提交：
   - `appliedCriteria = pendingCriteria`；
   - `pageNum = 1`；
   - `records/total/unparseableTotal = 本次结果`；
   - `lastRefreshAt = 前端成功时刻`；
4. 响应失败或已过期（非当前请求）：`appliedCriteria`、`pageNum`、最近成功结果与刷新时间**全部保持不变**；本次 `pendingCriteria` 仍留在组件中供用户继续修改或重试，但自动刷新、手工刷新与菜单返回恢复**只能使用上一次成功 `appliedCriteria`**（TOFF-REQ-038/099/110）。

分页与刷新同此原则：翻页以 `appliedCriteria + 目标页` 发起请求，成功且仍为当前请求才提交新 `pageNum` 与对应结果；请求新页失败时保留原成功页码与结果。**全文档不存在“失败请求覆盖上一次成功生效条件”的路径**。

## 7. 刷新并发与生命周期

### 7.1 事件流矩阵

| 事件 | 行为 |
|---|---|
| 首次进入 | 无上次成功 → 以缺省条件（三“全部”+空表名）生成 pending、目标页 1 自动查询（成功才提交）；有上次成功 → 恢复后立即按 `appliedCriteria` 刷新一次（6.3） |
| 点击查询 | 草稿→pendingCriteria（目标页 1）请求；成功且仍当前才提交 applied+page1（6.5；重置计时） |
| 点击重置 | 仅改草稿为缺省；不查询、不动 pending/applied/列表/页码（TOFF-REQ-037） |
| 翻页 | 以 `appliedCriteria`+目标页请求（不改草稿）；成功且仍当前才提交新页码与结果；失败保留原页码/结果（6.5） |
| 手工刷新 | 按已提交 applied+当前页轻量刷新；成功才更新时间/重计 60s（TOFF-REQ-108） |
| 查询/翻页失败 | 保留上一次成功 applied/页码/结果；未提交 pending 留草稿供修改/重试（见 7.4） |
| 60s 自动刷新 | 见 7.3 |
| 页面隐藏 | 停止计时与自动刷新请求（TOFF-REQ-106） |
| 重新可见 | 立即轻量刷新一次并重计（TOFF-REQ-107/101 语义同源） |
| 离开菜单再返回 | 组件卸载清计时；返回走 6.3 恢复 |
| 请求进行中再次触发 | 防重叠（TOFF-REQ-109，见 7.2） |
| 刷新后当前页越界 | total>0 且 page>pages → page=pages 后再查一次；total=0 → page=1（TOFF-REQ-093） |
| 连续自动刷新失败 | 抑制重复提示（TOFF-REQ-113，见 7.4） |

### 7.2 请求并发与旧覆盖（单一方案：请求序号令牌）

- 选择项目既有“请求序号/结果令牌”方案：每次发起查询 `const seq=++requestSeq`；响应回来若 `seq !== requestSeq` 则丢弃，避免旧请求覆盖新结果（先例 `useLogQueryTab.ts`）。**只有 `seq===requestSeq` 且成功时才允许提交生效条件/页码/结果**（两阶段提交，见 6.5），从机制上杜绝过期/失败请求改写“上一次成功生效条件”。
- 另设 `requestInFlight`：任一请求进行中，跳过同一时刻的自动刷新触发与重复点击，保证不重叠（TOFF-REQ-109）。
- 首次/条件查询用整表 `loading`；自动/手工刷新用轻量 `refreshing`（表格不空、不清空、不整页闪烁，TOFF-REQ-112；旧数据保留至新数据替换）。

### 7.3 自动刷新计时

- 周期固定 60s（TOFF-REQ-103）。`setInterval(60_000)` 每次 tick 检查：页面隐藏或 `requestInFlight` 或无任何成功记录 → 跳过本次，不重排下一 tick；否则轻量刷新。
- 计时起点：**首次成功查询完成后**开始（TOFF-REQ-105）；手工刷新成功/重新可见立即刷新成功后重置计时（TOFF-REQ-107/108）。
- 自动刷新不产生整页闪烁：不清表、不闪 loading 大层，仅工具栏“刷新中”轻提示（TOFF-REQ-112/096）。

### 7.4 失败处理与提示抑制

- 查询失败：保留 store 中上一次成功结果、`appliedCriteria`、`pageNum` 与最近成功刷新时间，全部不改写，不清空列表（TOFF-REQ-039/111）。
- 首次加载失败（从未成功，`records===null`）：整区错误态 + “重新加载”按钮，点击用当前 `pendingCriteria`（缺省时为缺省条件）重试（TOFF-REQ-115）。
- 查询成功但空结果：空态文案“暂无符合条件的数据”，不是接口错误（TOFF-REQ-116）。
- 自动刷新连续失败：**只更新工具栏内联错误文本，不逐 60s 弹 `ElMessage`**，避免提示堆叠（TOFF-REQ-113/097）；仅手工动作可用一次轻提示，且失败时不打断周期。

## 8. 数据库设计结论与授权边界

- **第一版无需 DDL**：`CDC.CDC_TOPIC_OFFSET` 现有表结构与需求匹配（`DATABASE.md` §8）；固定排序 `KAFKA_TOPIC, SERVER_ID` 与主键前导列不一致，但在 ≤6000 条规模下排序开销可忽略，不新建索引（`DATABASE.md` §9-g）。
- 实现读取用 `SELECT` + `TO_CHAR`（5.8），属只读表达式，不改表不改数据。
- 边界记录（供后续任务）：开发环境 `CDC_TOPIC_OFFSET` 当前不足 10 条；用户已授权在设计获批后的**开发任务**中对原表执行获批方案明确要求的操作；备份表 `CDC_TOPIC_OFFSET_2026_09_02` 默认禁止任何修改；**当前设计任务不得访问或操作数据库**；因本设计预计无需 DDL，后续实现**不得仅因“已有授权”而改表**。

## 9. 安全、只读与精度保证

- 绝对只读：无写 Controller/Service/Mapper 方法面（TOFF-REQ-011/122；5.2）。
- 不读取敏感列：本模块任何 SQL 列清单不含 `CDC_DATA_SOURCE.DATA_SOURCE_PASSWORD`；文档、日志、响应不输出任何凭据。
- Offset 精度：DB 侧 `TO_CHAR` 字符串化 → Java/JSON 字符串 → 前端字符串渲染，全程不落 JS `Number`（TOFF-REQ-076、TOFF-REQ-077、TOFF-REQ-080）。
- 时间语义：Oracle `DATE` 秒级无时区，输出存库钟面时间、不做隐式时区换算（TOFF-REQ-084、TOFF-REQ-124）。
- Kafka 三列字段（`kafkaEndOffset/pendingCount/consumeLag`）第一版在 JSON 中**始终存在且显式为 `null`**（不可为 0）；因全局 Jackson 为 `non_null`，用 `TopicOffsetItemVO` 字段级 `@JsonInclude(Include.ALWAYS)` 显式输出，不改变全局配置（见 5.10）；UI 显示 `—`（TOFF-REQ-066；质量门槛“不设计成 0”）。

## 10. 性能判断

- 单次 `/offsets` 请求执行三次只读 SELECT（`CDC_CLIENT_MULTIPLE`、`CDC_DATA_SOURCE` 两张小配置表 + `CDC_TOPIC_OFFSET` 断点表一次全表只读扫描），随后在内存解析/过滤/切片；断点表 ≤6000 行、配置表几十行级，60s 一次量级下开销可忽略（`DATABASE.md` §9-g）。
- 配置表为小表：每次请求全量读取映射，几十行级，无缓存复杂度；避免引入与规模不匹配的优化（质量门槛）。
- 分页在内存完成，不产生 Oracle `LIMIT`/多层嵌套 SQL；无需额外索引（§8）。

## 11. 测试策略（本任务只设计，不执行）

### 11.1 分层测试组织

- 单元（后端 `src/test/java/.../monitor/topicoffset/`）：`TopicNameParserTest`（恰好 5 段=成功；少 5 段、多 5 段（含段内含句点导致多段）=无法解析；**恰好 5 段但含空段**边界：前导点如 `.a.b.c.d`、尾点如 `a.b.c.d.`、连续点如 `a..b.c.d` 均按长度=5 判成功、空段原样保留并按 `NOT_FOUND` 参与映射，不判失败）；`TopicOffsetQueryServiceTest`（Mockito 注入 Mapper）：过滤组合、全部→含无法解析、结构条件→剔除无法解析、大小写不敏感表名包含、`%`/`_`/反斜杠字面、排序保持、`unparseableTotal`/`total` 口径、内存切片、越界页码、TO_CHAR 字符串透传、配置映射 ACTIVE/INACTIVE/NOT_FOUND/空名、同 ID 去重。
- 组件/前端：状态机（draft/pending/applied 三态隔离、**查询成功才提交生效条件与页码**、查询/翻页失败不改写上一次成功条件/页码/结果、重置不查询、会话恢复、刷新保持页、请求防重叠、越界收敛、失败保留旧数据、连续失败不堆提示）。
- 接口：`/offsets`、`/candidates` 的契约/校验/错误码用例；`TOFF-AC-077/081`（字符串 Offset）通过接口 JSON 断言。
- 人工验收：100 条 `TOFF-AC-001~100` 在实现与环境就绪后另行执行；本任务不执行，不改任何验收状态为 `PASS`。

### 11.2 与 100 条验收的归属（节选映射，全量见 UI/API 追踪）

| 验收领域 | 归属 |
|---|---|
| 页面/路由命名 | UI.md §2、DESIGN 3.3（TOFF-AC-001/002） |
| 只读/无写/不连 Kafka | DESIGN 5.2/9、API.md §8（TOFF-AC-003~008） |
| Topic 解析/原值 | DESIGN 5.3、API 字段 `parseable/parsed/rawTopic`、UI 同步对象（TOFF-AC-009~018） |
| 首次/恢复/刷新并发 | DESIGN 6.3/7、UI 生命周期（TOFF-AC-019~024/087~100） |
| 查询区/“全部”/过滤 | DESIGN 5.4、API 参数（TOFF-AC-025~042） |
| 候选与配置映射 | DESIGN 5.5、API candidates（TOFF-AC-043~053） |
| Offset 精度与时间 | DESIGN 5.8、API 字符串字段（TOFF-AC-066/077~081/008） |
| 分页/表格/视觉 | UI.md §5/§6（TOFF-AC-063~076） |
| 进度字段口径（含后续 Kafka） | API null 字段 + UI `—` + DESIGN §2.3 非目标（TOFF-AC-082~086） |

## 12. 实施文件清单

后端新建（`backend/src/main/java/com/bsoft/cdcconfig/monitor/topicoffset/**`，文件见 5.1）+ 测试目录（§11）。前端：见 6.1 文件清单（`types/topicOffset.ts`、`api/topicOffset.ts`、`stores/topicOffset.ts`、`views/topic-offset/*`）。代码修改点：替换 `src/views/topic-offset/TopicOffsetPage.vue` 占位内容、`src/config/menu.ts` 标题改“数据同步进度”、`src/router/index.ts` 该路由 `meta.title` 改“数据同步进度”（TOFF-REQ-001/003）。不改其他页面/配置/构建文件。后端无需 XML Mapper（全注解 `@Select`）。

## 13. 明确决策记录

| # | 决策 | 理由/依据 |
|---|---|---|
| A | 过滤、解析、映射全部在后端完成，前端只渲染服务端返回的 VO | 复用仓库“服务端渲染 VO”惯例；满足每次查询读取最新配置（TOFF-REQ-052）；前端不做猜算 |
| B | 断点表只读 Mapper 不继承 `BaseMapper`，仅注解 `@Select` | 从根本上消除 DML 方法面（TOFF-REQ-011/122、TOFF-AC-005） |
| C | `NEXT_OFFSET`/`UPDATED_AT` 在 SQL 层 `TO_CHAR` 字符串化 | 防 JS 精度、防时区漂移；Oracle DATE 无时区事实 |
| D | 结构化过滤在 Java 内存完成，**不生成 LIKE SQL** | 使 `%`/`_`/`\` 天然按字面处理，免除转义（TOFF-REQ-031）；数据量小 |
| E | 会话恢复采用路由级 Pinia store，不用 keep-alive/本地存储 | 项目无 keep-alive；内存态天然满足“刷新/重登回缺省”（TOFF-REQ-102） |
| F | 自动/手工刷新用轻量 `refreshing`，不动草稿、保持旧数据 | TOFF-REQ-110/111/112 |
| G | 分页/总数/无法解析总数内存计算，不做 SQL 分页 | ≤6000 条；实现简单可测 |
| H | API 用 `GET` + 重复参数传多值 | 只读语义、仓库已有 `paramsSerializer` 先例；不以 HTTP 方法判定写库（TOFF-AC-004） |
| I | 未解析 Topic 的 `parsed`/`mapping` 显式 `null`、Kafka 三列显式 `null`：在 `TopicOffsetItemVO` 相应字段上用**字段级 `@JsonInclude(JsonInclude.Include.ALWAYS)`** 输出，不改变全局 `non_null` 配置 | 契约要求这些字段第一版始终存在且为 JSON `null`，仅靠全局 `non_null` 会被省略；同时避免任何猜测值/0 值进入展示（TOFF-REQ-062/066；R1 复审 4.3） |
| J | 参数防御上限：单维候选 ≤50、表名 ≤200 | 防异常输入；业务量纲内不会误伤 |

## 14. 风险与限制

- 无法解析/停用/缺失/空名等异常样本开发库当前不存在（`DATABASE.md` §11），需构造数据或未来真实样本验收（TOFF-AC-007/011/012 等）；设计已定义确定规则，无“实现时再说”。
- 生产数据分布未采样：排序/分页语义以数据库字节序（BINARY）为准，本设计不依赖 NLS 之外的会话参数；实现禁止改动会话排序参数。
- 实现阶段如代码盘点发现与批准需求实质冲突，应停止并按 `CLAUDE.md` 冲突规则报告，不静默改需求或扩范围。

## 15. 需求归属与追踪

- DESIGN/API/UI 三文分工：业务规则与算法归属 DESIGN（本文件），接口契约归属 `API.md`，视觉/交互/状态归属 `UI.md`。
- 三文档各章节已内联标注需求编号（TOFF-REQ-xxx）。API/UI 另附需求追踪表。全部 124 条需求在 DESIGN/API/UI 中均有实现归属；本设计未遗漏 Kafka 后续口径（TOFF-REQ-068~070/073~075）的“第一版非实现、仅未来口径”边界。
- 数据库事实、需求、验收基线零变化；本草案不修改 `REQUIREMENTS.md`/`ACCEPTANCE.md`/`DATABASE.md`。

## 16. 变更记录

| 日期 | 变更 | 依据 |
|---|---|---|
| 2026-09-02 | 建立本功能设计草案（`DRAFT_PENDING_USER_REVIEW`）：总体架构、后端查询/解析/过滤/映射/分页设计、前端状态与刷新并发、数据库结论（无需 DDL）、测试策略、实施清单；未编码、未执行测试或验收 | TOPIC-OFFSET-DESIGN-001（纯文档设计任务；等待 ChatGPT/用户复审后进入实现任务） |
| 2026-09-02 | R1 定向修订（状态保持 `DRAFT_PENDING_USER_REVIEW`）：Topic 解析仅“恰好 5 段”，去除非空段/正则规则并补含空段边界；生效条件改为仅在查询/分页/刷新成功且仍为当前请求时原子提交；明确 null 与全局 `non_null` 冲突的唯一方案（`TopicOffsetItemVO` 字段级 `@JsonInclude(ALWAYS)`）；`NEXT_OFFSET` 采用显式格式模型 + 固定数字字符并列出验证样例；offsets 读取三次只读 SELECT、candidates 两次，明确非跨表 SCN 一致快照 | TOPIC-OFFSET-DESIGN-001-R1（ChatGPT 正式复审 `CHANGES_REQUIRED` 定向修订） |
| 2026-09-02 | 设计基线正式批准收口（状态 `DRAFT_PENDING_USER_REVIEW`→`APPROVED`）：ChatGPT 对提交 `68779649e673da7ee95079c4724b346ea441c5f6` 正式复审 `APPROVED`；更新文档状态与 design_status，未改动任何设计正文；批准后可另起实现任务，本任务未开始实现 | TOPIC-OFFSET-DESIGN-APPROVAL-CLOSEOUT-001（ChatGPT 正式复审批准收口） |
| 2026-09-03 | R2 用户人工页面视觉检查调整的最小技术映射同步（状态保持 `APPROVED`，仅技术说明同步，不改后端架构/SQL/接口数量/数据库读取次数/Topic 解析/请求单飞行/两阶段提交/候选刷新设计）：第 2.2 范围内 8 列清单的 UI 表头按 R2 改为“最新数据位置”并保留底层 API/VO 字段 `kafkaEndOffset` 不变（5.10、API.md 契约、技术 Kafka Log End Offset 口径均不改）；同步对象 Tooltip 明确为受控单实例延迟模型（激活行键 + 350ms 计时、离开/结果替换/翻页/刷新提交/卸载立即关闭、非 enterable、长 Topic 换行，见 6.1 OffsetTable 职责与 §11 测试点）；同步 §6.1 组件职责与字号层级归属（UI.md §12.1）。API 字段、后端架构与数据库事实零变化 | TOPIC-OFFSET-IMPLEMENTATION-001-R2（用户人工页面视觉检查确认的显示/交互调整；不代表正式验收已执行，100 条 `TOFF-AC-*` 保持 `NOT_RUN`） |
