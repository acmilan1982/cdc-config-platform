# 数据订阅后端实现与测试报告

- 任务编号：`DATA-SUBSCRIPTION-BACKEND-IMPLEMENTATION-001`
- 任务类型：数据订阅后端实现、自动化测试与纯文档执行报告
- 分支：`develop`
- 授权基线提交：`1481368d802a148c5a0a31d1b770f0249effb7ba`
- 报告时间：2026-08-31

---

## 1. 任务结论

依据已批准的数据订阅功能基线（`docs/features/data-subscription/` 下 REQUIREMENTS、ACCEPTANCE、DESIGN、API、UI、DATABASE）与 `docs/prompts/data-subscription/DATA-SUBSCRIPTION-BACKEND-IMPLEMENTATION-001-AGENT-PROMPT.md`，数据订阅后端实现完成：

- **后端**：新增 `com.bsoft.cdcconfig.subscription` 包，实现 **10 项 API**（候选、列表、详情、源库元数据、新增、编辑打开、编辑保存、删除预览、物理删除）与 **25 个业务错误码**；未修改任何现有业务模块、公共组件、依赖清单与已批准基线。
- **自动化测试**：后端本任务相关 **132/132 通过**（7 个测试类）。
- **编译**：`mvn clean package -DskipTests` **BUILD SUCCESS**。
- **完整测试**：`mvn clean test` 共 **854 个**，**3 个失败 + 1 个错误**，全部位于 `JobFailureServiceTest`、`OracleDateMappingTest`，为依赖开发库实时数据/运行态的既有环境性失败；已通过基准提交 `1481368d` 的 worktree 对照确认与本任务新增包无关（详见 §10）。
- `git diff --check` 通过；未引入任何新第三方依赖；未访问真实数据库、未执行真实 DDL/DML、未操作 ZooKeeper/Kafka/sync-client、未启动任何服务。
- 实现状态：**IMPLEMENTED_PENDING_REVIEW**；前端尚未实现，126 条正式验收全部 **NOT_RUN**。

本任务只代表数据订阅后端实现与自动化测试完成，不代表整个 Feature 完成，未进行任何验收。

## 2. Git 开始状态与基线

任务开始前记录并核验：

| 项目 | 值 |
|---|---|
| 当前分支 | `develop` |
| 本地 HEAD | `1481368d802a148c5a0a31d1b770f0249effb7ba` |
| 远程 `origin/develop`（fetch 后） | `1481368d802a148c5a0a31d1b770f0249effb7ba`（与基准一致，未触发 `BLOCKED_BASE_CHANGED`） |
| `git status --short` | 保存完整开始快照；存在大量任务前既有已修改与未跟踪内容（`frontend/**`、`.claude/settings.local.json`、`agent-env.sh`、`docs/database/TASK*` 删除、`docs/agent-prompts/**` 未跟踪等），全部原样保留，未清理、未覆盖、未暂存、未提交 |

核验命令：

```bash
git branch --show-current
git rev-parse HEAD
git status --short
```

## 3. 仓库现状盘点和复用点

- **统一响应体**：复用 `com.bsoft.cdcconfig.common.api.ApiResponse<T>`（code/message/data/timestamp；`success()/success(data)/fail(code,message)`）。
- **全局异常与业务错误码**：复用 `com.bsoft.cdcconfig.common.exception.BusinessException` 与全局 `GlobalExceptionHandler`；本任务功能内 `SubscriptionValidationException`（extends `BusinessException`，code=40300，携带结构化 `validationErrors`）在 `SubscriptionController` 本地 `@ExceptionHandler` 收敛，保证 `data.validationErrors` 不被全局处理器置空。
- **MyBatis-Plus**：`@TableId(value="DATA_SUB_ID", type=IdType.INPUT)` 专用实体 `DataSubscribe`（UUID32 手动赋值），**未修改**大屏 `largescreen.stats.entity.DataSubscribeEntity`；`@MapperScan("com.bsoft.cdcconfig.**.mapper")` 按简单类名注册 bean、`type-aliases-package: com.bsoft.cdcconfig` 按简单类名注册别名，因此新增 Mapper/VO 均采用唯一类名（`SubscriptionDataSubscribeMapper`、`SubscriptionDataSourceMapper`、`SubscriptionTargetOptionVO`）以避免与既有类冲突。
- **事务**：写入操作使用注入 `PlatformTransactionManager` 构造的 `TransactionTemplate` 手动管理事务（PRESERVE/REPLACE 保存语义）。
- **源库元数据**：`SourceMetadataService` 以能力模式（`ALL_USERS` 与 Oracle 数据字典）只读探测源库普通表/Schema，失败时按错误分类去敏，不落库、不写 ZooKeeper。
- **测试基座**：沿用仓库既有模式——Service 测试 `@ExtendWith(MockitoExtension.class)` + `@Mock` + `@InjectMocks` + `@BeforeAll` 预置 MyBatis-Plus `TableInfoHelper.initTableInfo` 缓存；Controller 测试 `@WebMvcTest` + `@MockBean` + `MockMvc`。所有测试均使用 Mock，不连接真实 Oracle、不执行真实 DML。

未引入任何新第三方依赖。

## 4. 实际新增/修改文件及用途

### 4.1 后端主源码（`backend/src/main/java/com/bsoft/cdcconfig/subscription/`，共 34 个文件）

| 文件 | 用途 |
|---|---|
| `controller/SubscriptionController.java` | 10 个 REST 端点 + 本地异常收敛 |
| `service/SubscriptionService.java` | 订阅服务接口 |
| `service/impl/SubscriptionServiceImpl.java` | 候选/列表/详情/新增/编辑/删除预览/物理删除实现 |
| `service/SourceMetadataService.java` | 源库元数据服务接口 |
| `service/impl/SourceMetadataServiceImpl.java` | 源库 Schema/普通表只读探测与错误去敏 |
| `entity/DataSubscribe.java` | 订阅实体（`DATA_SUB_ID` UUID32 主键，INPUT） |
| `entity/DataSourceRef.java` | 数据源引用最小投影（ID/ORG/FG_ACTIVE，不含密码） |
| `mapper/SubscriptionDataSubscribeMapper.java` | 订阅 Mapper（唯一类名避免 bean 冲突） |
| `mapper/SubscriptionDataSourceMapper.java` | 数据源投影 Mapper（唯一类名） |
| `exception/SubscriptionErrorCode.java` | 25 个批准错误码常量 + 工厂方法 |
| `exception/SubscriptionValidationException.java` | 批量校验聚合异常（40300 + validationErrors） |
| `exception/BadRequestException.java` | 请求契约错误（HTTP 400） |
| `converter/SubscriptionConverter.java` | Entity ↔ VO 转换、Schema 分组、时间格式化 |
| `helper/SubscriptionCsvHelper.java` | 源/目标 CSV 解析、空值语义、匹配语义、多源异常判定 |
| `helper/DataSourceTableParser.java` | `DATA_SOURCE_TABLE` 结构解析（schema.table） |
| `dto/SubscriptionSaveDTO.java` | 保存请求 DTO |
| `dto/SubscriptionQuery.java` | 列表查询条件（源/目标多选） |
| `dto/SourceTableInput.java` | 源表输入 DTO |
| `vo/OptionsVO.java` | 候选响应 |
| `vo/SourceOptionVO.java` | 源库候选 |
| `vo/SubscriptionTargetOptionVO.java` | 目标库候选（唯一类名避免别名冲突） |
| `vo/SourceRefVO.java` | 源引用状态（NORMAL/INACTIVE/NOT_FOUND） |
| `vo/TargetRefVO.java` | 目标引用状态 |
| `vo/SubscriptionRowVO.java` | 列表行 |
| `vo/SubscriptionListVO.java` | 列表响应 |
| `vo/SubscriptionDetailVO.java` | 详情响应 |
| `vo/SubscriptionEditOpenVO.java` | 编辑打开响应 |
| `vo/SubscriptionDeletePreviewVO.java` | 删除预览响应 |
| `vo/SchemaTableGroup.java` | Schema 分组 |
| `vo/SchemaVO.java` | Schema 列表响应 |
| `vo/TableVO.java` | 表列表响应 |
| `vo/ValidationErrorsVO.java` / `vo/ValidationErrorVO.java` | 批量校验错误结构 |
| `vo/QueryWarningVO.java` | 查询告警项 |

### 4.2 后端测试（`backend/src/test/java/com/bsoft/cdcconfig/subscription/`，共 7 个文件）

| 文件 | 用途 | 测试数 |
|---|---|---|
| `controller/SubscriptionControllerTest.java` | HTTP 层：10 端点路由、状态、错误码映射、请求契约 400 | 16 |
| `converter/SubscriptionConverterTest.java` | 转换、Schema 分组、引用状态、时间格式化 | 12 |
| `exception/SubscriptionErrorCodeTest.java` | 25 码去重、无 40910、工厂消息 | 4 |
| `helper/SubscriptionCsvHelperTest.java` | CSV 空值/匹配/多源异常边界 | 25 |
| `helper/DataSourceTableParserTest.java` | `DATA_SOURCE_TABLE` 结构解析 | 11 |
| `service/SubscriptionServiceImplTest.java` | 候选/列表/详情/增删改业务规则 | 49 |
| `service/SourceMetadataServiceImplTest.java` | 源库元数据能力模式/回退/去敏 | 15 |

### 4.3 执行报告

| 文件 | 用途 |
|---|---|
| `docs/features/data-subscription/reports/DATA-SUBSCRIPTION-BACKEND-IMPLEMENTATION-001.md` | 本报告 |

## 5. 模块结构

```
backend/src/main/java/com/bsoft/cdcconfig/subscription/
├── controller/  SubscriptionController          # REST 入口 + 本地异常收敛
├── service/     SubscriptionService             # 业务接口
│   └── impl/    SubscriptionServiceImpl, SourceMetadataServiceImpl
├── entity/      DataSubscribe, DataSourceRef     # UUID32 专用实体 + 引用投影
├── mapper/      SubscriptionDataSubscribeMapper, SubscriptionDataSourceMapper
├── dto/         SubscriptionSaveDTO, SubscriptionQuery, SourceTableInput
├── vo/          16 个响应视图对象
├── converter/   SubscriptionConverter
├── helper/      SubscriptionCsvHelper, DataSourceTableParser
└── exception/   SubscriptionErrorCode, SubscriptionValidationException, BadRequestException
```

## 6. 10 项 API 实现矩阵

| # | 方法 | 路径 | 说明 | 主要错误码 |
|---|---|---|---|---|
| 1 | GET | `/api/subscriptions/options` | 源库/目标库启用候选一次返回 | 无 |
| 2 | GET | `/api/subscriptions` | 启用订阅列表，可带 `sourceIds`/`targetIds` 多选（服务层 Java 过滤，无分页） | 无 |
| 3 | GET | `/api/subscriptions/{dataSubId}` | 订阅详情（只读配置库，不连接源 Oracle） | 40430、40352 |
| 4 | GET | `/api/subscriptions/metadata/schemas?dataSourceId=` | 源库可访问且含普通表的非系统 Schema | 40340、40341 |
| 5 | GET | `/api/subscriptions/metadata/tables?dataSourceId=&schema=` | 按 Schema 查询普通表（不含视图/物化视图/同义词） | 40340、40341 |
| 6 | POST | `/api/subscriptions` | 新增订阅（恒为 REPLACE 语义），返回后端生成的订阅 ID | 40300~40323、40330/40331、50040 |
| 7 | GET | `/api/subscriptions/{dataSubId}/edit` | 编辑打开，回显原配置与已选 Schema/表，best-effort 源表有效性核对 | 40430、40350 |
| 8 | PUT | `/api/subscriptions/{dataSubId}` | 编辑保存（PRESERVE/REPLACE 语义，PRESERVE 不重写 `DATA_SOURCE_TABLE`） | 40430、40300~40323、40330/40331、40350、50040 |
| 9 | GET | `/api/subscriptions/{dataSubId}/delete-preview` | 删除预览（只读，返回删除确认信息，不锁行） | 40430、40353 |
| 10 | DELETE | `/api/subscriptions/{dataSubId}` | 物理删除（按主键，不携带并发字段） | 40430、50041 |

## 7. 25 个错误码实现情况

全部 25 个批准错误码已在 `SubscriptionErrorCode` 定义并接入业务路径（不含被批准的 40910 系列）：

| 分组 | 错误码 | 触发点 |
|---|---|---|
| 批量校验聚合 | 40300 | 新增/编辑保存批量校验失败，`data.validationErrors` 结构化返回 |
| 描述/结构校验 | 40310/40311 | 描述为空 / 超 255 |
| 源/目标/源表必填 | 40312/40313/40314 | 未选择源库 / 未选择目标库 / 未选择源表 |
| 表格式与命名 | 40315/40316/40317/40318 | 源表结构或格式非法 / 名称含逗号或组件内部句点 / 记录内重复源表 / 记录内重复目标库 |
| 引用校验 | 40320/40321/40322/40323 | 源库不存在或停用 / 目标库不存在或停用 / 源库类别不符 / 目标库类别不符 |
| 源表有效性 | 40330/40331 | 源表中存在源库不存在的表 / 当前账号不可访问的表 |
| 源连接 | 40340/40341 | 源库连接失败（去敏分类）/ Schema/表加载失败（去敏分类） |
| 多源异常 | 40350/40351/40352/40353 | 异常记录不支持编辑 / 删除 / 查看 / 删除预览 |
| 不存在 | 40430 | 订阅记录不存在或已删除 |
| 保存/删除兜底 | 50040/50041 | 写操作影响行数异常或数据库异常 |

错误码映射规则：单点业务错误返回对应单码；批量校验失败统一 `SubscriptionValidationException`（HTTP 200 + code=40300 + `validationErrors`）；请求契约错误（空请求体、缺失参数、非法 `sourceSelectionMode`）返回 HTTP 400 + code=400；写操作影响行数不匹配（INSERT≠1、UPDATE/DELETE=0 或 >1）映射 50040/50041/40430。

## 8. 核心规则实现说明

- **UUID32 主键**：`UUID.randomUUID().toString().replace("-", "")`；`DataSubscribe` 使用 `@TableId(value="DATA_SUB_ID", type=IdType.INPUT)`，未修改大屏 `DataSubscribeEntity`。
- **CSV 空值与匹配语义**：`SubscriptionCsvHelper.splitTrimDropEmpty`（null/空白→空集）；`matchCsvNormal` 精确相等（`S01`≠`S012`）；`matchCsvComma` 查询原子作为连续子序列匹配；`isMultiSourceAnomaly = size>=2`。
- **`DATA_SOURCE_TABLE` 解析**：格式 `DATA_SOURCE_ID.Schema.表名`，按首个 `.` 与末个 `.` 切分；Schema 含额外句点 → 该 token 不可解析并计入 `rawUnparseableTables`；`tableCount` 含所有非空逗号 token。
- **数据源引用最小投影**：仅加载 `DATA_SOURCE_ID / DATA_SOURCE_ORG / FG_ACTIVE`，绝不加载含密码完整实体。
- **写操作事务与行数检查**：`TransactionTemplate` 包裹 INSERT/UPDATE/DELETE；INSERT 影响行数≠1 → 50040；UPDATE 0 → 40430、>1 → 50040；DELETE 0 → 40430、>1 → 50041。
- **保存语义**：新增恒为 REPLACE；编辑保存按请求 `sourceSelectionMode` 区分 PRESERVE（不重写 `DATA_SOURCE_TABLE`）与 REPLACE；保存前对源/目标引用、类别、源表有效性执行校验并聚合 `validationErrors`。
- **多源异常保护**：`DATA_FROM_SOURCE_ID` 含多源（≥2）的记录标记异常，列表/详情透出 `anomalyMultiSource`，并阻止编辑（40350）、删除（40351）、查看（40352）、删除预览（40353）。
- **源库元数据只读**：`SourceMetadataServiceImpl` 以能力模式探测（`ALL_USERS.ORACLE_MAINTAINED='N'`）并回退（ORA 904/942/1031）；排除物化视图（`MVIEW_NAME OR CONTAINER_NAME`）；连接/加载失败按分类去敏后返回 40340/40341，不把底层敏感堆栈返回前端。

## 9. 自动化测试清单与真实结果

| 测试类 | 结果 |
|---|---|
| `SubscriptionControllerTest` | 16/16 通过 |
| `SubscriptionConverterTest` | 12/12 通过 |
| `SubscriptionErrorCodeTest` | 4/4 通过 |
| `SubscriptionCsvHelperTest` | 25/25 通过 |
| `DataSourceTableParserTest` | 11/11 通过 |
| `SubscriptionServiceImplTest` | 49/49 通过 |
| `SourceMetadataServiceImplTest` | 15/15 通过 |
| **合计** | **132/132 通过** |

## 10. 完整测试的基准/当前对比

对基准提交 `1481368d802a148c5a0a31d1b770f0249effb7ba` 创建 worktree（`git worktree add /tmp/cdc-baseline <基准提交>`，按提示词 §15/§11 授权），执行同一完整测试命令，与本任务提交前工作区结果对比：

| 项目 | 基准提交（1481368d） | 本任务工作区 |
|---|---|---|
| 完整测试总数 | 854 | 854 |
| 失败/错误 | 3 失败 + 1 错误 | 3 失败 + 1 错误 |
| 失败类 | `JobFailureServiceTest`（3）、`OracleDateMappingTest`（1） | 完全一致 |
| 新增失败 | 0 | 0 |

结论：完整测试失败集与基准完全一致，全部为依赖开发库实时数据/运行态的既有环境性失败，与本任务新增 `com.bsoft.cdcconfig.subscription` 包无任何交集；按规则不擅自扩大修复范围，予以保留并报告。worktree 已 `git worktree remove --force` 清理。

## 11. 构建与验证结果

| 项目 | 命令 | 结果 |
|---|---|---|
| 后端编译打包 | `mvn clean package -DskipTests` | BUILD SUCCESS |
| subscription 定向测试 | `mvn test -Dtest='Subscription*Test,SourceMetadataServiceImplTest'`（等价于全量后提取） | 132/132 通过 |
| 后端完整测试 | `mvn clean test` | 854 个，3 失败 + 1 错误（全部既有，见 §10） |
| 空白错误 | `git diff --check` | 通过 |
| 数据库访问/写操作 | 无 | NONE / NONE |
| ZooKeeper 访问/写操作 | 无 | NONE |
| 前端变更 | 无 | NONE |

## 12. 未执行真实数据库读写的声明

本任务未连接真实开发库、未执行任何真实 SQL/DDL/DML、未新增任何数据库对象、未读取或输出任何密码/完整连接串/密钥/令牌；所有数据访问均通过 Mock 测试验证，不改变任何数据库状态。

## 13. 已知限制与边界

- **源表有效性核对为 best-effort**：编辑打开时的源表核对可能因源库不可达而失败，以查询告警透出，不阻断回显。
- **未启动任何业务服务**；未触发/重启 `sync-server`；未操作 ZooKeeper/Kafka/sync-client。
- 后端完整测试存在 4 个既有环境性失败（§10），与本任务无关，需在真实验收环境（开发库实时数据满足断言预期）时复测确认。
- 本报告不含结果提交/远程 SHA（报告本身为提交产物，无法自引用），由 Agent 最终会话输出块在推送完成后给出。

## 14. 前端尚未实现

前端 `frontend/` 未做任何变更：订阅列表/详情/新增/编辑/删除页面与交互均未实现，菜单、路由、类型、API 封装均未新增。前端实现为后续独立任务。

## 15. 126 条正式验收仍 NOT_RUN

`docs/features/data-subscription/ACCEPTANCE.md` 全部验收项（126 条）仍为 **NOT_RUN**，未执行任何功能验收、联调或视觉验收。实现状态为 **IMPLEMENTED_PENDING_REVIEW**，不代表整个 Feature 完成。

## 16. 服务启动与验收 URL

本任务为代码实现 + 自动化测试 + 纯文档报告，未要求启动程序供用户验收，故不提供访问 URL。

## 17. 提交与推送

本任务按提示词 §13/§15 仅授权本次精确范围（`backend/src/main/java/com/bsoft/cdcconfig/subscription/**`、`backend/src/test/java/com/bsoft/cdcconfig/subscription/**`、本报告文件）的普通提交与普通推送至 `origin/develop`：逐文件暂存，禁止 `git add .`/`git add -A`，不 force push，提示词文件与一切既有无关修改不入库；提交信息体现「实现数据订阅后端与测试」，不写成整个 Feature 完成或验收通过。提交与推送结果（result_commit_id、remote_commit_id、ahead/behind、push_status）由 Agent 任务结果输出块给出。

## 18. 结果输出

提交与推送结果由 Agent 最终会话输出块按提示词 §16 格式给出；本报告为提交产物，不包含自引用提交号。

## 19. 下一步入口

下一入口为 **ChatGPT 对数据订阅后端实现的正式代码复审**（后端实现 code review），复审通过后再进入前端实现等后续任务。不得自行进入真实联调、视觉验收或收口。
